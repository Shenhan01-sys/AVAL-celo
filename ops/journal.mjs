// Autonomous ship-journal — appends a real heartbeat log entry and commits it each tick.
// Pairs with heartbeat.mjs: heartbeat drives on-chain TX frequency, journal drives COMMIT
// frequency. Each commit is a real entry (timestamp + live beacon pulse), not an empty commit.
// Commits straight to main (ops log), rebasing first to stay in sync.
import "dotenv/config";
import { execSync } from "node:child_process";
import { appendFileSync, mkdirSync, existsSync } from "node:fs";
import { createPublicClient, http } from "viem";
import { celo, celoAlfajores } from "viem/chains";

const NET = (process.env.NETWORK || "alfajores").toLowerCase();
const chain = NET === "celo" || NET === "mainnet" ? celo : celoAlfajores;
const BEACON = process.env.BEACON_ADDRESS;
const INTERVAL = Number(process.env.JOURNAL_INTERVAL_MS || 300000); // 5 min
const MAX = Number(process.env.JOURNAL_MAX || 0); // 0 = forever

const LOG_DIR = "journal";
const LOG = `${LOG_DIR}/ship-log.md`;
const ABI = [{ type: "function", name: "pulse", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] }];

const pub = createPublicClient({ chain, transport: http() });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sh = (c) => execSync(c, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });
console.log(`ship-journal · ${chain.name} · interval ${INTERVAL}ms · max ${MAX || "∞"}`);

let i = 0;
while (MAX === 0 || i < MAX) {
  let pulse = "n/a";
  try {
    if (BEACON) pulse = (await pub.readContract({ address: BEACON, abi: ABI, functionName: "pulse" })).toString();
  } catch {}
  const ts = new Date().toISOString();
  appendFileSync(LOG, `- ${ts} · ${chain.name} · beacon pulse ${pulse}\n`);
  try {
    sh("git pull --rebase --autostash origin main");
    sh(`git add ${LOG}`);
    sh(`git commit -m "chore(journal): ship log ${ts} pulse ${pulse} — Celo"`);
    sh("git push origin main");
    console.log(`#${i} committed journal entry (pulse ${pulse})`);
  } catch (e) {
    console.error(`#${i} journal commit failed: ${e.message}`);
  }
  i++;
  if (MAX === 0 || i < MAX) await sleep(INTERVAL);
}
console.log("ship-journal ended.");
