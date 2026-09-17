import { readFile } from "node:fs/promises";
import { createClient } from "genlayer-js";
import { studioNext } from "./network.mjs";

const code = await readFile(new URL("../contracts/consent_firewall.py", import.meta.url), "utf8");
const client = createClient({ chain: studioNext });
const schema = await client.getContractSchemaForCode(code);
const methods = Object.keys(schema?.methods ?? schema ?? {});
const required = ["create_profile", "publish_profile_version", "register_policy", "open_check", "assess_check", "get_profile", "get_snapshot", "get_check", "get_stats"];
for (const name of required) if (!methods.includes(name)) throw new Error(`Schema missing ${name}`);
process.stdout.write(`Studio Next accepted ConsentFirewall schema (${methods.length} methods).\n`);
