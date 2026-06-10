"""x402 paywall — Aval as an x402 *resource server* (the paid oracle).

Pattern (Casper-native, hosted facilitator):
  1. No/invalid `PAYMENT-SIGNATURE` header  -> respond 402 + PaymentRequirements.
  2. With a signature -> POST to facilitator `/verify` then `/settle`; on success the
     route runs and returns data.

This keeps the paying/signing burden on the *client* (investor-agent, which uses
casper-eip-712), so the oracle stays pure Python.
Docs: https://docs.cspr.cloud/x402-facilitator-api/reference
"""
from __future__ import annotations

import json

import httpx
from fastapi import Request
from fastapi.responses import JSONResponse

from config import get_settings


def payment_requirements() -> dict:
    s = get_settings()
    return {
        "x402Version": 1,
        "accepts": [
            {
                "scheme": "exact",
                "network": s.x402_chain_id,            # casper:casper-test
                "asset": s.x402_asset_package,         # aUSD / csprUSD package hash
                "assetName": s.x402_asset_name,
                "payTo": s.x402_pay_to,
                "maxAmountRequired": s.x402_price,
                "resource": "/verify",
                "description": "Aval RWA verification oracle — one verified risk assessment.",
            }
        ],
    }


def _headers() -> dict:
    s = get_settings()
    h = {"Content-Type": "application/json"}
    if s.x402_access_token:
        h["Authorization"] = f"Bearer {s.x402_access_token}"
    return h


async def require_payment(request: Request) -> JSONResponse | None:
    """Returns a 402 JSONResponse if unpaid, else None (proceed)."""
    s = get_settings()
    signature = request.headers.get("PAYMENT-SIGNATURE") or request.headers.get("X-PAYMENT")
    if not signature:
        return JSONResponse(status_code=402, content=payment_requirements())

    try:
        payload = json.loads(signature)
    except Exception:
        return JSONResponse(status_code=402, content=payment_requirements())

    body = {"paymentPayload": payload, "paymentRequirements": payment_requirements()["accepts"][0]}
    async with httpx.AsyncClient(timeout=30) as client:
        verify = await client.post(
            f"{s.x402_facilitator_url}/verify", headers=_headers(), json=body
        )
        if verify.status_code != 200 or not verify.json().get("isValid", False):
            return JSONResponse(status_code=402, content=payment_requirements())
        settle = await client.post(
            f"{s.x402_facilitator_url}/settle", headers=_headers(), json=body
        )
        if settle.status_code != 200:
            return JSONResponse(status_code=402, content=payment_requirements())
    return None  # paid & settled — proceed
