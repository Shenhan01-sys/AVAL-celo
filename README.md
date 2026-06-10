# AVAL on Celo — Autonomous Verification And Lending

Autonomous AI-agent invoice/PO financing. Suppliers sell unpaid invoices early for cash today;
investors fund them for yield (single invoices or tranched pools); an AI agent autonomously
verifies invoices, prices risk, and releases milestone payments; debtors repay at maturity.
Settles in a stablecoin (cUSD/USDC on Celo).

This repo is the **Celo (EVM / Solidity)** port. The contracts mirror the Casper/Odra design,
re-expressed with OpenZeppelin and an ERC-8004 (agent reputation) + ERC-8183 (job lifecycle)
flavor. Built with **Foundry**.

## Layout (monorepo)
```
contracts/  Foundry project — src/, test/, script/, lib/, Makefile, deployments/
ops/        autonomous loops — heartbeat (tx frequency) + journal (commit frequency)
web/        Next.js frontend (Celo port of the AVAL app)
agent/      FastAPI AI verifier (Celo port)
docs/       architecture notes
```

## Contracts (planned)
| Contract | Role |
|---|---|
| `MockUSD` | testnet ERC-20 settlement stable (mainnet → real cUSD/USDC) |
| `InvoiceRegistry` | anchor invoice commitments on-chain |
| `ReputationOracle` | agent stake + verdict accuracy (ERC-8004 flavor) |
| `FinancingToken` | ERC-721 ownership receipt, one per funded deal |
| `FundingPool` | escrow, fund, milestone release (ERC-8183 job lifecycle) |
| `AgentBeacon` | cheap gas-only heartbeat the agent posts each cycle |

## Build & test
```bash
cd contracts
forge build
forge test
```

## Deploy (testnet first)
```bash
cd contracts
cp .env.example .env   # fill PRIVATE_KEY (deployer), CELOSCAN_API_KEY
forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
```
Networks: Alfajores testnet (chainId 44787) → Celo mainnet (chainId 42220).

## Autonomous ops (`ops/`)
Two loops keep AVAL alive on-chain (see `ops/.env.example`):
```bash
cd ops && npm install
npm run heartbeat   # AgentBeacon.heartbeat(ref) every interval — gas-only TX frequency
npm run journal     # appends live beacon pulse to a log + commits it — commit frequency
```

## Deployed addresses
Recorded per network under `deployments/` after a broadcast (see `alfajores.example.json`).

| Contract | Alfajores | Celo mainnet |
|---|---|---|
| MockUSD | `0x` | — |
| InvoiceRegistry | `0x` | — |
| ReputationOracle | `0x` | — |
| FinancingToken | `0x` | — |
| FundingPool | `0x` | — |
| AgentBeacon | `0x` | — |

## Chains
This is one of three AVAL deployments (Casper, Celo, BNB) sharing the same product design
(`design.md` in the Casper repo). Only the settlement rails differ per chain. On BNB the agent
layer can use the official `bnbagent-sdk` (ERC-8004 identity + ERC-8183 agentic commerce).
