# AVAL on Celo — Autonomous Verification And Lending

Autonomous AI-agent invoice/PO financing. Suppliers sell unpaid invoices early for cash today;
investors fund them for yield (single invoices or tranched pools); an AI agent autonomously
verifies invoices, prices risk, and releases milestone payments; debtors repay at maturity.
Settles in a stablecoin (cUSD/USDC on Celo).

This repo is the **Celo (EVM / Solidity)** port. The contracts mirror the Casper/Odra design,
re-expressed with OpenZeppelin and an ERC-8004 (agent reputation) + ERC-8183 (job lifecycle)
flavor. Built with **Foundry**.

## Layout
```
src/        Solidity contracts
test/       Foundry tests
script/     deploy + ops scripts
lib/        dependencies (forge-std, openzeppelin-contracts)
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
forge build
forge test
```

## Deploy (testnet first)
```bash
cp .env.example .env   # fill PRIVATE_KEY (deployer), CELOSCAN_API_KEY
forge script script/Deploy.s.sol --rpc-url alfajores --broadcast --verify
```
Networks: Alfajores testnet (chainId 44787) → Celo mainnet (chainId 42220).

## Chains
This is one of three AVAL deployments (Casper, Celo, BNB) sharing the same product design
(`design.md` in the Casper repo). Only the settlement rails differ per chain.
