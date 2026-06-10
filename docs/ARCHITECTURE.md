# AVAL Celo — Architecture

## Contracts
| Contract | Responsibility |
|---|---|
| `MockUSD` | testnet ERC-20 settlement stable (6 decimals, open mint) → real cUSD/USDC on mainnet |
| `InvoiceRegistry` | anchors invoice commitments (issuer, debtor, face, due, docHash) |
| `ReputationOracle` | agent stake + writer-recorded verdicts/faults + slash + public accuracy (ERC-8004 flavor) |
| `FinancingToken` | ERC-721 ownership receipt, one per funded deal, pool-minted |
| `FundingPool` | escrow + lifecycle: fund → milestone release → repay (ERC-8183 flavor) |
| `AgentBeacon` | gas-only heartbeat the agent posts each cycle (on-chain footprint) |

## Roles (wired at deploy)
- `FinancingToken` ownership → `FundingPool` (only the pool mints / sets status).
- `ReputationOracle.setWriter(FundingPool, true)` + `setWriter(agent, true)`.
- `AgentBeacon.setAgent(agent, true)`.

## Financing lifecycle
1. Supplier's invoice is anchored (`InvoiceRegistry.anchor`).
2. Investor `fund()`s it: advance (minus fee) goes to the supplier now; investor gets an
   ERC-721 receipt; fee goes to the treasury.
3. AI verifier `releaseMilestone()`s as work is verified, earning a reputation verdict.
4. Debtor `repay()`s the nominal to the current receipt holder at maturity; receipt → Repaid.

## Autonomous ops (`ops/`)
- `heartbeat.mjs` — posts `AgentBeacon.heartbeat(ref)` every interval (gas-only TX frequency).
- `journal.mjs` — appends the live beacon pulse to a log and commits it (commit frequency).

## Multi-chain
One of three AVAL deployments (Casper, Celo, BNB). The product design is shared
(`design.md` in the Casper repo); only the settlement rails differ. On BNB the agent layer can
use the official `bnbagent-sdk` (ERC-8004 identity + ERC-8183 agentic commerce).
