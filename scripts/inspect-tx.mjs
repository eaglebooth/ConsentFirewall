import { createClient } from "genlayer-js";
import { studioNext } from "./network.mjs";

const hash = process.argv[2];
if (!/^0x[0-9a-fA-F]{64}$/.test(hash || "")) throw new Error("Pass transaction hash");
const client = createClient({ chain: studioNext });
const tx = await client.getTransaction({ hash });
const leader = tx?.consensus_data?.leader_receipt?.[0];
process.stdout.write(JSON.stringify({
  hash,
  status: tx?.statusName,
  result: tx?.resultName,
  executionResult: leader?.execution_result,
  calldata: leader?.calldata?.readable,
  resultStatus: leader?.result?.status,
  payload: leader?.result?.payload?.readable ?? leader?.result?.payload,
  stderr: leader?.genvm_result?.stderr,
}, null, 2) + "\n");
