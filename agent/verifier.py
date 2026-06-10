"""The risk model behind the Aval oracle.

Mock mode = deterministic scores from the file hash (no API spend, repeatable demos).
Real mode = swap in Claude vision (see `_verify_with_claude`). The 4-stage pipeline:
  A document authenticity · B counterparty · C relationship · D uniqueness
Score = 0.4*A + 0.3*B + 0.2*C + 0.1*uniqueness ; PO baseline -10.
"""
from __future__ import annotations

import hashlib
from dataclasses import asdict, dataclass, field
from typing import Literal

from config import get_settings

DocumentType = Literal["invoice", "po"]


@dataclass
class VerifyResult:
    risk_score: int
    risk_tier: str
    doc_score: int
    counterparty_score: int
    relationship_score: int
    unique: bool
    flags: list = field(default_factory=list)

    def dict(self) -> dict:
        return asdict(self)


@dataclass
class MilestoneResult:
    confidence: float
    verdict: Literal["APPROVED", "REJECTED"]
    fail_reasons: list = field(default_factory=list)

    def dict(self) -> dict:
        return asdict(self)


def _score(seed: str, low: int = 60, high: int = 95) -> int:
    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    return low + (h % (high - low + 1))


def _tier(score: int) -> str:
    return "low" if score >= 80 else "medium" if score >= 60 else "high" if score >= 40 else "reject"


class Verifier:
    """Autonomous verification brain. Deterministic in mock mode."""

    async def verify_document(self, file_bytes: bytes, document_type: DocumentType) -> VerifyResult:
        if not get_settings().ai_mock_mode:
            return await self._verify_with_claude(file_bytes, document_type)
        seed = hashlib.sha256(file_bytes).hexdigest()
        a = _score(seed + "doc")
        b = _score(seed + "ctp")
        c = _score(seed + "rel", 50, 90)
        risk = int(0.4 * a + 0.3 * b + 0.2 * c + 0.1 * 100)
        if document_type == "po":
            risk = max(0, risk - 10)
        return VerifyResult(risk, _tier(risk), a, b, c, True, [])

    async def verify_milestone(self, file_bytes: bytes, milestone_idx: int) -> MilestoneResult:
        seed = hashlib.sha256(file_bytes + str(milestone_idx).encode()).hexdigest()
        conf = _score(seed, 75, 98) / 100.0
        threshold = get_settings().milestone_confidence_threshold
        return MilestoneResult(conf, "APPROVED" if conf >= threshold else "REJECTED", [])

    async def _verify_with_claude(self, file_bytes: bytes, document_type: DocumentType) -> VerifyResult:
        # TODO: send the document image to Claude vision, parse a structured verdict.
        # Uses ANTHROPIC_API_KEY. Kept behind AI_MOCK_MODE so demos cost nothing.
        raise NotImplementedError("Set AI_MOCK_MODE=true or wire Claude vision here.")
