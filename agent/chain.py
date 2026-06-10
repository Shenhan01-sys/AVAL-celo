"""Casper on-chain calls for the autonomous agent.

The agent holds the on-chain `aiVerifier` role, so it can call
`FundingPool.release_milestone` itself — no human in the loop.

Mock mode returns deterministic fake deploy hashes so the whole agent loop demos
without a node. Real mode builds/signs/puts a contract-call deploy via `casper-client`
(or the casper-python-sdk) using AGENT_SECRET_KEY_PATH against CASPER_NODE_RPC.
"""
from __future__ import annotations

import hashlib

from config import get_settings


def _fake_hash(*parts: str) -> str:
    return "deploy-" + hashlib.sha256("|".join(parts).encode()).hexdigest()


class AvalChain:
    async def release_milestone(self, token_id: int, idx: int) -> str:
        s = get_settings()
        if s.chain_mock_mode:
            return _fake_hash("release", str(token_id), str(idx))
        return await self._put_deploy(
            s.funding_pool_hash, "release_milestone",
            {"token_id": token_id, "idx": idx},
        )

    async def record_verification(self, verifier_account: str) -> str:
        s = get_settings()
        if s.chain_mock_mode:
            return _fake_hash("record_verification", verifier_account)
        return await self._put_deploy(
            s.reputation_oracle_hash, "record_verification", {"verifier": verifier_account}
        )

    async def register_invoice(self, doc_hash: str) -> str:
        s = get_settings()
        if s.chain_mock_mode:
            return _fake_hash("register", doc_hash)
        return await self._put_deploy(
            s.invoice_registry_hash, "register", {"doc_hash": doc_hash}
        )

    async def _put_deploy(self, contract_hash: str, entrypoint: str, args: dict) -> str:
        # TODO: build a StoredContractByHash session, sign with the agent secret key,
        # and `account_put_deploy` to CASPER_NODE_RPC. Kept behind CHAIN_MOCK_MODE so
        # the agent loop is demoable end-to-end without a node.
        raise NotImplementedError(
            f"Wire casper-client/SDK to call {contract_hash}.{entrypoint}({args})"
        )


chain = AvalChain()
