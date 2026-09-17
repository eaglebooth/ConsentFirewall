import { createClient } from "genlayer-js";
import { studioNext } from "./network.mjs";

const address = process.argv[2];
if (!/^0x[0-9a-fA-F]{40}$/.test(address || "")) throw new Error("Pass contract address");
const client = createClient({ chain: studioNext });
for (const functionName of ["get_contract_version", "get_stats"]) {
  const value = await client.readContract({ address, functionName, args: [] });
  process.stdout.write(`${functionName}=${JSON.stringify(value)}\n`);
}

const checkId = process.argv[3];
if (checkId) {
  const value = await client.readContract({ address, functionName: "get_check", args: [checkId] });
  process.stdout.write(`get_check=${JSON.stringify(value)}\n`);
}
