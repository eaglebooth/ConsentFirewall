import { createHash } from "node:crypto";
import { createAccount, createClient } from "genlayer-js";
import { transactionResultNumberToName } from "genlayer-js/types";
import { studioNext } from "./network.mjs";

const contract = process.env.CONSENT_FIREWALL_ADDRESS?.trim();
const policyUrl = process.env.CONSENT_POLICY_URL?.trim();
if (!/^0x[0-9a-fA-F]{40}$/.test(contract || "")) throw new Error("Missing CONSENT_FIREWALL_ADDRESS");
if (!/^https:\/\/raw\.githubusercontent\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\/[0-9a-fA-F]{40}\/.+/.test(policyUrl || "")) {
  throw new Error("CONSENT_POLICY_URL must be a commit-pinned raw GitHub URL");
}

const unwrap = raw => {
  let value = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (value && typeof value === "object" && Object.keys(value).length === 1 && "result" in value) value = value.result;
  if (typeof value === "string") { try { return JSON.parse(value); } catch { return value; } }
  return value;
};

async function readKeys() {
  if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(true);
  process.stdin.resume();
  const keys = [];
  let line = "";
  for await (const chunk of process.stdin) for (const character of String(chunk)) {
    if (character === "\u0003") throw new Error("Cancelled");
    if (character === "\r" || character === "\n") {
      if (!line) continue;
      const matches = line.match(/[0-9a-fA-F]{64}/g) ?? [];
      line = "";
      if (matches.length !== 1) throw new Error("Each line must contain exactly one private key");
      keys.push(matches[0]);
      if (keys.length === 2) {
        if (process.stdin.isTTY && process.stdin.setRawMode) process.stdin.setRawMode(false);
        return keys;
      }
    } else {
      line += character;
    }
  }
  throw new Error("Provide exactly two test private keys through stdin");
}

function rejection(tx, receipt) {
  const leader = tx?.consensus_data?.leader_receipt?.[0];
  const execution = String(leader?.execution_result ?? "").toUpperCase();
  const resultStatus = String(leader?.result?.status ?? "").toUpperCase();
  const finalized = String(tx?.statusName ?? receipt?.statusName ?? "").toUpperCase();
  const consensus = String(tx?.resultName ?? transactionResultNumberToName?.[String(tx?.result)] ?? "").toUpperCase();
  const payload = leader?.result?.payload?.readable ?? leader?.result?.payload ?? "";
  if (execution && execution !== "SUCCESS") return String(payload || execution);
  if (["ROLLBACK", "ERROR", "FAILED"].some(item => resultStatus.includes(item))) return String(payload || resultStatus);
  if (finalized && finalized !== "FINALIZED") return `status ${finalized}`;
  if (consensus && !["AGREE", "MAJORITY_AGREE"].includes(consensus)) return `consensus ${consensus}`;
  return "";
}

const keys = await readKeys();
const accounts = keys.map(key => createAccount(`0x${key}`));
keys.fill("");
if (accounts[0].address.toLowerCase() === accounts[1].address.toLowerCase()) throw new Error("Test wallets must differ");
const [strictClient, permissiveClient] = accounts.map(account => createClient({ chain: studioNext, account }));
const publicClient = createClient({ chain: studioNext });
const read = async (name, args = []) => unwrap(await publicClient.readContract({ address: contract, functionName: name, args }));

const version = await read("get_contract_version");
if (version !== "CONSENT_FIREWALL_V1") throw new Error(`Unexpected contract version ${version}`);
const response = await fetch(policyUrl);
if (!response.ok) throw new Error(`Fixture fetch failed ${response.status}`);
const source = await response.text();
if (source.length < 40) throw new Error("Fixture is too short");
const digest = createHash("sha256").update(source, "utf8").digest("hex");

const transactions = [];
async function write(label, name, args, client, expected = "") {
  let estimate;
  try { estimate = await client.estimateTransactionFeesForWrite({ address: contract, functionName: name, args, value: 0n }); }
  catch { estimate = await client.estimateTransactionFees({ leaderTimeunitsAllocation: 600, validatorTimeunitsAllocation: 600 }); }
  const hash = await client.writeContract({ address: contract, functionName: name, args, value: 0n,
    fees: { distribution: estimate.distribution, feeValue: estimate.feeValue } });
  transactions.push({ label, hash });
  process.stdout.write(`${label}: ${hash}\n`);
  const receipt = await client.waitForTransactionReceipt({ hash, waitUntil: "finalized", interval: 2000, retries: 300 });
  let tx = receipt; try { tx = await client.getTransaction({ hash }); } catch {}
  const failed = rejection(tx, receipt);
  if (expected) {
    if (!failed.includes(expected)) throw new Error(`${label}: expected ${expected}, got ${failed || "success"}`);
    process.stdout.write(`${label}: FINALIZED ROLLBACK ${expected}\n`);
    return;
  }
  if (failed) throw new Error(`${label}: ${failed}`);
  process.stdout.write(`${label}: FINALIZED\n`);
}

const tag = String(Date.now());
const strictId = `strict-${tag}`;
const permissiveId = `permissive-${tag}`;
const snapshotId = `policy-${tag}`;
const wrongSnapshotId = `wrong-${tag}`;
const strictCheck = `strict-check-${tag}`;
const permissiveCheck = `allow-check-${tag}`;
const wrongCheck = `wrong-check-${tag}`;
const dimensions = ["MODEL_TRAINING", "DATA_SALE", "THIRD_PARTY_SHARING", "BIOMETRIC_PROCESSING", "RETENTION_AFTER_TERMINATION"];
const rules = value => JSON.stringify(Object.fromEntries(dimensions.map(name => [name, value])));

// Failure-first role and input boundaries.
await write("setup.strictProfile", "create_profile", [strictId, rules("DENY")], strictClient);
await write("failure.nonOwnerVersion", "publish_profile_version", [strictId, rules("ALLOW")], permissiveClient, "PROFILE_OWNER_ONLY");
await write("failure.duplicateProfile", "create_profile", [strictId, rules("ALLOW")], strictClient, "INVALID_OR_DUPLICATE_PROFILE");
await write("setup.policySnapshot", "register_policy", [snapshotId, "Submitted test policy", policyUrl, digest], strictClient);
await write("failure.duplicateContent", "register_policy", [`duplicate-${tag}`, "Same submitted bytes", policyUrl, digest], permissiveClient, "POLICY_CONTENT_ALREADY_REGISTERED");

// Strict profile -> conflict for a fixture that permits at least one denied use.
await write("setup.strictCheck", "open_check", [strictCheck, strictId, 1n, snapshotId], strictClient);
await write("failure.nonOwnerOpen", "open_check", [`intruder-${tag}`, strictId, 1n, snapshotId], permissiveClient, "PROFILE_OWNER_ONLY");
await write("happy.strictAssess", "assess_check", [strictCheck], strictClient);
const strictReceipt = await read("get_check", [strictCheck]);
if (strictReceipt.outcome !== "CONFLICT") throw new Error(`Expected strict CONFLICT, got ${strictReceipt.outcome}`);
await write("failure.reassessFinal", "assess_check", [strictCheck], strictClient, "CHECK_ALREADY_FINAL");

// Same immutable policy, independently owned permissive profile -> compatible.
await write("setup.permissiveProfile", "create_profile", [permissiveId, rules("ALLOW")], permissiveClient);
await write("setup.permissiveCheck", "open_check", [permissiveCheck, permissiveId, 1n, snapshotId], permissiveClient);
await write("happy.permissiveAssess", "assess_check", [permissiveCheck], permissiveClient);
const permissiveReceipt = await read("get_check", [permissiveCheck]);
if (permissiveReceipt.outcome !== "COMPATIBLE") throw new Error(`Expected permissive COMPATIBLE, got ${permissiveReceipt.outcome}`);

// Wrong digest must finalize unresolved, never compatible.
const wrongDigest = digest === "0".repeat(64) ? "1".repeat(64) : "0".repeat(64);
await write("setup.wrongDigestSnapshot", "register_policy", [wrongSnapshotId, "Digest mismatch test", policyUrl, wrongDigest], strictClient);
await write("setup.wrongDigestCheck", "open_check", [wrongCheck, strictId, 1n, wrongSnapshotId], strictClient);
await write("failure.digestMismatch", "assess_check", [wrongCheck], strictClient);
const unresolvedReceipt = await read("get_check", [wrongCheck]);
if (unresolvedReceipt.outcome !== "UNRESOLVED" || unresolvedReceipt.rationale !== "SOURCE_DIGEST_MISMATCH") {
  throw new Error(`Expected digest UNRESOLVED, got ${JSON.stringify(unresolvedReceipt)}`);
}

const stats = await read("get_stats");
if (stats.conflicts !== "1" || stats.compatible !== "1" || stats.unresolved !== "1") throw new Error(`Final counters invalid ${JSON.stringify(stats)}`);
process.stdout.write(`CONSENT_FIREWALL_LIVE_COMPLETE ${JSON.stringify({ contract, wallets: accounts.map(account => account.address), policyUrl, digest, strictReceipt, permissiveReceipt, unresolvedReceipt, stats, transactions }, null, 2)}\n`);
