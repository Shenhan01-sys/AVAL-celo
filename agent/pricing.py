"""Risk tier + pricing. Pure functions, ported from the LIEN reference design.

Fee structure: 1.5% origination + 10% performance (matches FundingPool).
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

ProductType = Literal["invoice", "po"]
RiskTier = Literal["low", "medium", "high", "reject"]

YIELD_TABLE = {
    ("invoice", "low"): Decimal("0.07"),
    ("invoice", "medium"): Decimal("0.10"),
    ("invoice", "high"): Decimal("0.15"),
    ("po", "low"): Decimal("0.09"),
    ("po", "medium"): Decimal("0.12"),
    ("po", "high"): Decimal("0.16"),
}
PO_ADVANCE_BY_TIER = {"low": 80, "medium": 75, "high": 70}
ORIGINATION_FEE_BPS = 150
PERFORMANCE_FEE_BPS = 1000


@dataclass
class Pricing:
    advance_rate: int
    yield_rate: Decimal
    funding_amount: Decimal
    expected_yield_amount: Decimal
    total_repayment: Decimal


def tier_for(risk_score: int) -> RiskTier:
    if risk_score >= 80:
        return "low"
    if risk_score >= 60:
        return "medium"
    if risk_score >= 40:
        return "high"
    return "reject"


def advance_rate_for(product_type: ProductType, tier: RiskTier) -> int:
    if product_type == "invoice":
        return 100
    if tier == "reject":
        return 0
    return PO_ADVANCE_BY_TIER[tier]


def price(product_type: ProductType, risk_score: int, nominal: Decimal, tenor_days: int) -> Pricing:
    tier = tier_for(risk_score)
    advance = advance_rate_for(product_type, tier)
    if tier == "reject" or advance == 0:
        raise ValueError("Document rejected — cannot price")
    yield_rate = YIELD_TABLE[(product_type, tier)]
    face = (nominal * Decimal(advance) / Decimal(100)).quantize(Decimal("0.01"))
    discount = (yield_rate * Decimal(tenor_days) / Decimal(365)).quantize(Decimal("0.0001"))
    funding = (face * (Decimal("1") - discount)).quantize(Decimal("0.01"))
    expected_yield = (face - funding).quantize(Decimal("0.01"))
    return Pricing(
        advance_rate=advance,
        yield_rate=yield_rate,
        funding_amount=funding,
        expected_yield_amount=expected_yield,
        total_repayment=(funding + expected_yield).quantize(Decimal("0.01")),
    )
