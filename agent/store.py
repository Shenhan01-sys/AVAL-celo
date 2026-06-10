"""In-memory mock store + agent activity log for the Aval demo backend.

Lets the frontend run end-to-end (marketplace, detail, fund, milestones, live agent
feed) without a database or a live chain. Everything resets on restart.
"""
from __future__ import annotations

from typing import Optional

# --- agent activity feed (newest first) ------------------------------------

_activity: list[dict] = []
_clock = {"t": 1_717_000_000}


def _now() -> int:
    _clock["t"] += 7
    return _clock["t"]


def log_activity(type_: str, icon: str, message: str, tx: Optional[str] = None) -> dict:
    item = {"time": _now(), "type": type_, "icon": icon, "message": message, "tx": tx}
    _activity.insert(0, item)
    return item


def list_activity(limit: int = 50) -> list[dict]:
    return _activity[:limit]


# --- financings ------------------------------------------------------------

_financings: dict[str, dict] = {}
_seq = {"n": 0}


def _next_id() -> str:
    _seq["n"] += 1
    return f"fin_{_seq['n']:04d}"


def _milestones(funding_amount: float, product_type: str) -> list[dict]:
    if product_type == "po":
        specs = [("Down payment", 30), ("Production", 30), ("Shipment", 20), ("Delivery", 20)]
    else:
        specs = [("Advance", 40), ("Delivery", 30), ("Acceptance", 30)]
    out = []
    for i, (name, pct) in enumerate(specs, start=1):
        out.append(
            {
                "idx": i,
                "name": name,
                "percentage": pct,
                "payout_amount": round(funding_amount * pct / 100, 2),
                "status": "pending",
                "auto": True,
            }
        )
    return out


def add_financing(
    *,
    invoice_number: str,
    amount: float,
    buyer_name: str,
    issuer_name: str,
    due_date: str,
    product_type: str,
    verdict: dict,
    pricing: dict,
    buyer_wallet: str = "",
    buyer_email: str = "",
    buyer_status: str = "pending",
) -> dict:
    fid = _next_id()
    fin = {
        "id": fid,
        "invoice_number": invoice_number,
        "amount": amount,
        "buyer_name": buyer_name,
        "buyer_wallet": buyer_wallet,
        "buyer_email": buyer_email,
        "buyer_status": buyer_status,
        "issuer_name": issuer_name,
        "due_date": due_date,
        "product_type": product_type,
        "yield_rate": pricing["yield_rate"],
        "funding_amount": pricing["funding_amount"],
        "expected_yield_amount": pricing["expected_yield_amount"],
        "total_repayment": pricing["total_repayment"],
        "risk_score": verdict["risk_score"],
        "risk_tier": verdict["risk_tier"],
        "verifier_accuracy": 96,
        "status": "published",
        "ai_report": {
            "doc_score": verdict["doc_score"],
            "counterparty_score": verdict["counterparty_score"],
            "relationship_score": verdict["relationship_score"],
            "unique": verdict["unique"],
        },
        "oracle": {"accuracy_pct": 96, "stake_cspr": 5000},
        "milestones": _milestones(pricing["funding_amount"], product_type),
    }
    _financings[fid] = fin
    return fin


def list_marketplace() -> list[dict]:
    keys = (
        "id", "invoice_number", "amount", "funding_amount", "buyer_name", "expected_yield_amount",
        "yield_rate", "risk_tier", "verifier_accuracy", "status", "due_date", "buyer_status", "buyer_wallet",
    )
    return [
        {k: f[k] for k in keys}
        for f in _financings.values()
        if f["status"] in ("published", "funded")
    ]


def get_financing(fid: str) -> Optional[dict]:
    return _financings.get(fid)


def set_status(fid: str, status: str) -> None:
    if fid in _financings:
        _financings[fid]["status"] = status


def confirm_buyer(fid: str) -> Optional[dict]:
    """Debtor accepts the Notice of Assignment → invoice becomes buyer-confirmed."""
    fin = _financings.get(fid)
    if not fin:
        return None
    fin["buyer_status"] = "confirmed"
    return fin


def release_milestone(fid: str, idx: int) -> Optional[dict]:
    fin = _financings.get(fid)
    if not fin:
        return None
    for m in fin["milestones"]:
        if m["idx"] == idx:
            m["status"] = "released"
            return m
    return None


# --- seed a few demo financings so the marketplace isn't empty -------------

def _seed() -> None:
    samples = [
        dict(invoice_number="INV-2042", amount=500_000, buyer_name="PT Maju Mall",
             issuer_name="CV Kayu Jati", due_date="2026-09-05", product_type="invoice",
             verdict=dict(risk_score=82, risk_tier="low", doc_score=88, counterparty_score=84,
                          relationship_score=78, unique=True),
             pricing=dict(yield_rate=7.0, funding_amount=465_000.0,
                          expected_yield_amount=35_000.0, total_repayment=500_000.0)),
        dict(invoice_number="PO-7781", amount=300_000, buyer_name="PT Sinar Retail",
             issuer_name="UD Tekstil Sejahtera", due_date="2026-08-20", product_type="po",
             verdict=dict(risk_score=64, risk_tier="medium", doc_score=70, counterparty_score=66,
                          relationship_score=60, unique=True),
             pricing=dict(yield_rate=12.0, funding_amount=210_000.0,
                          expected_yield_amount=25_200.0, total_repayment=235_200.0)),
        dict(invoice_number="INV-3310", amount=150_000, buyer_name="PT Karya Logistik",
             issuer_name="CV Pangan Nusantara", due_date="2026-07-30", product_type="invoice",
             verdict=dict(risk_score=45, risk_tier="high", doc_score=52, counterparty_score=48,
                          relationship_score=44, unique=True),
             pricing=dict(yield_rate=15.0, funding_amount=130_000.0,
                          expected_yield_amount=20_000.0, total_repayment=150_000.0)),
    ]
    for s in samples:
        add_financing(**s)
    confirm_buyer("fin_0001")
    confirm_buyer("fin_0002")

    # --- DEMO: dense marketplace to stress-test the cash-flow-horizon field ---
    # (delete this whole block to return to just the 3 hand-crafted deals)
    import datetime

    _buyers = [
        "PT Maju Mall", "PT Sinar Retail", "PT Karya Logistik", "PT Global Niaga",
        "PT Bumi Sentosa", "CV Anugrah Jaya", "PT Mega Distribusi", "PT Cahaya Abadi",
        "PT Nusantara Pangan", "PT Surya Elektronik", "PT Tirta Makmur", "PT Indo Tekstil",
        "PT Prima Konstruksi", "PT Sehat Farma", "PT Digital Mandiri", "PT Hijau Lestari",
        "PT Samudra Ekspor", "PT Berkah Otomotif",
    ]
    _base = datetime.date(2026, 6, 9)
    for i in range(90):
        rate = 5 + (i * 7) % 12           # 5..16 %
        days = 18 + (i * 13) % 100        # 18..117 days to maturity
        amount = 80_000 + ((i * 47) % 50) * 10_000   # 80k..570k csprUSD
        tier = "low" if rate < 8 else ("medium" if rate <= 12 else "high")
        score = 88 - (rate - 5) * 3
        ey = round(amount * rate / 100, 2)
        ptype = "po" if i % 3 == 0 else "invoice"
        num = f"{'PO' if ptype == 'po' else 'INV'}-{4100 + i}"
        add_financing(
            invoice_number=num,
            amount=float(amount),
            buyer_name=_buyers[i % len(_buyers)],
            issuer_name=f"Supplier Co {i + 1}",
            due_date=(_base + datetime.timedelta(days=days)).isoformat(),
            product_type=ptype,
            verdict=dict(risk_score=score, risk_tier=tier, doc_score=score + 4,
                         counterparty_score=score, relationship_score=score - 6, unique=True),
            pricing=dict(yield_rate=float(rate), funding_amount=float(amount - ey),
                         expected_yield_amount=float(ey), total_repayment=float(amount)),
            buyer_status="confirmed" if i % 2 == 0 else "pending",
        )

    log_activity("oracle", "⭐", "Verifier agent online — accuracy 96%, staked 5,000 CSPR")
    log_activity("verify", "✅", "Verified INV-2042 → risk LOW (82), priced at 7% APR")
    log_activity("x402", "💸", "Paid 0.02 csprUSD via x402 for buyer registry lookup (PT Maju Mall)")


_seed()
