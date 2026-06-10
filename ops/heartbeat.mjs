// Autonomous AgentBeacon heartbeat loop — the AVAL verifier's on-chain pulse.
// Posts heartbeat(ref) every INTERVAL_MS from the agent key: gas-only, high frequency.
// Each ref attests autonomous activity (here a per-tick hash; wire to real verdict batches).
import "dotenv/config";
import {
  createWalletClient,
  createPublicClient,
  http,
  keccak256,
  stringToHex,
  formatEther,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoAlfajores } from "viem/chains";

const NET = (process.env.NETWORK || "alfajores").toLowerCase();
const chain = NET === "celo" || NET === "mainnet" ? celo : celoAlfajores;
const INTERVAL = Number(process.env.INTERVAL_MS || 180000); // 3 min default
const MAX = Number(process.env.MAX_BEATS || 0); // 0 = run forever
const MIN_BAL = BigInt(process.env.MIN_BALANCE_WEI || "2000000000000000"); // 0.002
const BEACON = process.env.BEACON_ADDRESS;
const PK = process.env.AGENT_PRIVATE_KEY;

if (!BEACON || !PK) {
  console.error("Set BEACON_ADDRESS and AGENT_PRIVATE_KEY (see ops/.env.example)");
  process.exit(1);
}

const account = privateKeyToAccount(PK.startsWith("0x") ? PK : `0x${PK}`);
const transport = http();
const wallet = createWalletClient({ account, chain, transport });
const pub = createPublicClient({ chain, transport });

const ABI = [
  { type: "function", name: "heartbeat", stateMutability: "nonpayable", inputs: [{ name: "ref", type: "bytes32" }], outputs: [] },
  { type: "function", name: "pulse", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log(`AgentBeacon loop · ${chain.name} · agent ${account.address}`);
console.log(`beacon ${BEACON} · interval ${INTERVAL}ms · max ${MAX || "∞"}`);

let i = 0;
while (MAX === 0 || i < MAX) {
  const bal = await pub.getBalance({ address: account.address });
  if (bal < MIN_BAL) {
    console.error(`Low balance ${formatEther(bal)} ${chain.nativeCurrency.symbol} — stopping.`);
    break;
  }
  const ref = keccak256(stringToHex(`aval:${NET}:${Date.now()}:${i}`));
  try {
    const hash = await wallet.writeContract({ address: BEACON, abi: ABI, functionName: "heartbeat", args: [ref] });
    const rcpt = await pub.waitForTransactionReceipt({ hash });
    const pulse = await pub.readContract({ address: BEACON, abi: ABI, functionName: "pulse" });
    console.log(`#${i} beat -> ${hash} (block ${rcpt.blockNumber}, gas ${rcpt.gasUsed}, pulse ${pulse})`);
  } catch (e) {
    console.error(`#${i} failed: ${e.shortMessage || e.message}`);
  }
  i++;
  if (MAX === 0 || i < MAX) await sleep(INTERVAL);
}
console.log("heartbeat loop ended.");
