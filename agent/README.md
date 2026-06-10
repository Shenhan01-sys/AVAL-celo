# Aval Agent (Python)

The autonomous verifier + x402-paid RWA oracle.

## Run
```bash
cd agent
python -m venv .venv && . .venv/Scripts/activate   # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env        # fill in package hashes + x402 settings (or keep mock modes)
uvicorn main:app --reload --port 8000
```
Docs at http://localhost:8000/docs

## What it does
- `POST /oracle/verify` — **x402-paid**. Unpaid → `402` + payment requirements. Paid
  (verified+settled by `x402-facilitator.cspr.cloud`) → returns the risk assessment +
  pricing. This is the "RWA oracle as a service".
- `POST /milestone-proof` — the agent verifies supplier proof and, if confident,
  **calls `FundingPool.release_milestone` itself** (holds the `aiVerifier` role).
- `GET /oracle/identity` — the agent's on-chain accuracy + stake (trust signal).

## Modes
| Flag | Default | Effect |
|---|---|---|
| `AI_MOCK_MODE` | true | deterministic risk scores from file hash (no API spend) |
| `CHAIN_MOCK_MODE` | true | fake deploy hashes so the loop demos without a node |

Flip to `false` and fill the env to go live (wire Claude vision in `verifier.py`, and
the casper-client/SDK deploy in `chain.py`).
