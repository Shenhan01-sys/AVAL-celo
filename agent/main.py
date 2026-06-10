"""Aval verifier agent — FastAPI app (demo backend for the frontend + the agentic loop).

Human-facing (frontend) endpoints:
  GET  /health
  GET  /marketplace
  GET  /financing/{id}
  POST /documents/upload                      supplier submits an invoice → agent verifies
  POST /financing/{id}/fund                   investor funds a deal
  POST /financing/{id}/milestone-proof        supplier proof → agent AUTONOMOUSLY releases
  GET  /agent/activity                        live feed of the agent's autonomous actions
  GET  /oracle/identity                       the agent's on-chain reputation

Machine-facing (bots) endpoint:
  POST /oracle/verify                         x402-PAID verified risk assessment

Run:  uvicorn main:app --reload --port 8000
"""
from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from fastapi import FastAPI, File, Form, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import store
from chain import chain
from config import get_settings
from pricing import price
from verifier import Verifier
from x402_gate import require_payment

app = FastAPI(title="Aval Oracle", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
verifier = Verifier()


@app.get("/health")
async def health() -> dict:
    s = get_settings()
    return {"ok": True, "chain_mock": s.chain_mock_mode, "ai_mock": s.ai_mock_mode}


# --- Marketplace / detail --------------------------------------------------

@app.get("/marketplace")
async def marketplace() -> list[dict]:
    return store.list_marketplace()


@app.get("/financing/{fid}")
async def financing_detail(fid: str):
    fin = store.get_financing(fid)
    if not fin:
        return {"error": "not found"}
    return fin


# --- Supplier: submit an invoice (agent verifies) --------------------------

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("invoice"),
    issuer_name: str = Form(...),
    buyer_name: str = Form(...),
    total_amount: str = Form(...),
    invoice_date: str = Form(...),
    due_date: str = Form(...),
    invoice_number: str = Form(""),
    po_number: str = Form(""),
    buyer_email: str = Form(""),
    buyer_wallet: str = Form(""),
):
    data = await file.read()
    verdict = await verifier.verify_document(data, document_type)  # type: ignore[arg-type]
    store.log_activity(
        "x402", "💸",
        f"Paid 0.02 csprUSD via x402 for buyer registry lookup ({buyer_name})",
    )

    if verdict.risk_tier == "reject":
        store.log_activity("verify", "🚫", f"Rejected {invoice_number or po_number} → risk too high")
        return {"status": "rejected", "risk_score": verdict.risk_score, "risk_tier": verdict.risk_tier}

    nominal = Decimal(total_amount)
    tenor = max(1, (datetime.strptime(due_date, "%Y-%m-%d") - datetime.strptime(invoice_date, "%Y-%m-%d")).days)
    p = price(document_type, verdict.risk_score, nominal, tenor)  # type: ignore[arg-type]
    pricing = {
        "advance_rate": p.advance_rate,
        "yield_rate": float(p.yield_rate * 100),
        "funding_amount": float(p.funding_amount),
        "expected_yield_amount": float(p.expected_yield_amount),
        "total_repayment": float(p.total_repayment),
    }
    fin = store.add_financing(
        invoice_number=invoice_number or po_number,
        amount=float(nominal),
        buyer_name=buyer_name,
        issuer_name=issuer_name,
        due_date=due_date,
        product_type=document_type,
        verdict=verdict.dict(),
        pricing=pricing,
        buyer_email=buyer_email,
        buyer_wallet=buyer_wallet,
    )
    await chain.register_invoice(fin["id"])
    store.log_activity(
        "verify", "✅",
        f"Verified {fin['invoice_number']} → risk {verdict.risk_tier.upper()} ({verdict.risk_score}), priced at {pricing['yield_rate']:.0f}% APR",
    )
    return {
        "financing_id": fin["id"],
        "risk_score": verdict.risk_score,
        "risk_tier": verdict.risk_tier,
        "pricing": pricing,
    }


# --- Investor: fund a deal -------------------------------------------------

@app.post("/financing/{fid}/fund")
async def fund(fid: str):
    fin = store.get_financing(fid)
    if not fin:
        return {"error": "not found"}
    store.set_status(fid, "funded")
    m1 = store.release_milestone(fid, 1)
    tx = await chain.release_milestone(fid, 1)
    store.log_activity(
        "fund", "🟢",
        f"Investor funded {fin['invoice_number']} ({fin['funding_amount']:,.0f}) — M1 auto-released",
        tx=tx,
    )
    return {"ok": True, "funding_id": f"fund_{fid}", "release_tx": tx, "milestone": m1}


# --- Debtor: repay the invoice at maturity (notified factoring) -------------

@app.post("/financing/{fid}/repay")
async def repay(fid: str):
    """The buyer/debtor pays the invoice face value; it auto-settles to the
    investor (principal + yield − platform fee), with any reserve to the supplier."""
    fin = store.get_financing(fid)
    if not fin:
        return {"error": "not found"}
    face = float(fin.get("amount") or fin["total_repayment"])
    total_rep = float(fin["total_repayment"])
    yield_amt = float(fin.get("expected_yield_amount") or 0)
    platform_fee = round(yield_amt * 0.10, 2)
    to_investor = round(total_rep - platform_fee, 2)
    to_supplier = round(max(0.0, face - total_rep), 2)
    store.set_status(fid, "settled")
    tx = f"deploy-{fid}-settle"
    store.log_activity(
        "settle", "🏦",
        f"Debtor {fin.get('buyer_name', 'buyer')} paid {face:,.0f} csprUSD on {fin['invoice_number']} → investor repaid {to_investor:,.0f}",
        tx=tx,
    )
    return {
        "ok": True,
        "invoice_number": fin["invoice_number"],
        "buyer_name": fin.get("buyer_name"),
        "paid_by_debtor": face,
        "to_investor": to_investor,
        "platform_fee": platform_fee,
        "to_supplier_reserve": to_supplier,
        "settle_tx": tx,
    }


# --- Debtor: accept Notice of Assignment (buyer confirmation) --------------

@app.post("/financing/{fid}/confirm")
async def confirm_buyer(fid: str):
    fin = store.confirm_buyer(fid)
    if not fin:
        return {"error": "not found"}
    store.log_activity(
        "confirm", "✍️",
        f"Debtor {fin.get('buyer_name', 'buyer')} confirmed {fin['invoice_number']} — Notice of Assignment accepted",
    )
    return {"ok": True, "buyer_status": "confirmed"}


# --- Supplier: milestone proof → agent AUTONOMOUSLY releases ---------------

@app.post("/financing/{fid}/milestone-proof")
async def milestone_proof(
    fid: str,
    file: UploadFile = File(...),
    milestone_idx: int = Query(..., ge=2, le=4),
):
    fin = store.get_financing(fid)
    if not fin:
        return {"error": "not found"}
    data = await file.read()
    verdict = await verifier.verify_milestone(data, milestone_idx)
    if verdict.verdict == "APPROVED":
        tx = await chain.release_milestone(fid, milestone_idx)
        m = store.release_milestone(fid, milestone_idx)
        payout = m["payout_amount"] if m else 0
        store.log_activity(
            "release", "💸",
            f"AI Verifier auto-released milestone {milestone_idx} of {fin['invoice_number']} → {payout:,.0f} csprUSD",
            tx=tx,
        )
        return {"status": "released", "confidence": verdict.confidence, "release_tx": tx}
    store.log_activity("release", "❌", f"Milestone {milestone_idx} proof rejected for {fin['invoice_number']}")
    return {"status": "rejected", "confidence": verdict.confidence, "fail_reasons": verdict.fail_reasons}


# --- Agentic feed + identity ----------------------------------------------

@app.get("/agent/activity")
async def agent_activity(limit: int = Query(50, ge=1, le=200)) -> list[dict]:
    return store.list_activity(limit)


@app.get("/oracle/identity")
async def oracle_identity() -> dict:
    return {
        "agent": get_settings().x402_pay_to or "aval-verifier-agent",
        "verifier_accuracy_pct": 96,
        "verifier_stake_cspr": 5000,
    }


# --- Machine-facing paid oracle (x402) ------------------------------------

@app.post("/oracle/verify")
async def oracle_verify(
    request: Request,
    file: UploadFile = File(...),
    document_type: str = Form("invoice"),
    nominal: str = Form("0"),
    tenor_days: int = Form(60),
):
    gate = await require_payment(request)
    if gate is not None:
        return gate  # HTTP 402 with payment requirements
    data = await file.read()
    result = await verifier.verify_document(data, document_type)  # type: ignore[arg-type]
    response: dict = {"verification": result.dict()}
    if result.risk_tier != "reject":
        p = price(document_type, result.risk_score, Decimal(nominal or "0"), tenor_days)  # type: ignore[arg-type]
        response["pricing"] = {
            "advance_rate": p.advance_rate,
            "yield_rate": float(p.yield_rate),
            "funding_amount": float(p.funding_amount),
            "total_repayment": float(p.total_repayment),
        }
    await chain.record_verification(get_settings().x402_pay_to or "agent")
    return response
