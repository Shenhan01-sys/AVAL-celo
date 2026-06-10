"""Centralised settings for the Aval verifier agent."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # x402
    x402_facilitator_url: str = "https://x402-facilitator.cspr.cloud"
    x402_chain_id: str = "casper:casper-test"
    x402_asset_package: str = ""
    x402_asset_name: str = "aUSD"
    x402_pay_to: str = ""
    x402_price: str = "0.50"
    x402_access_token: str = ""

    # contracts
    funding_pool_hash: str = ""
    financing_token_hash: str = ""
    reputation_oracle_hash: str = ""
    invoice_registry_hash: str = ""

    # agent identity
    agent_secret_key_path: str = "./keys/agent_secret_key.pem"
    casper_node_rpc: str = "https://node.testnet.cspr.cloud"

    # modes
    chain_mock_mode: bool = True
    ai_mock_mode: bool = True
    anthropic_api_key: str = ""

    # verification policy
    milestone_confidence_threshold: float = 0.5


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
