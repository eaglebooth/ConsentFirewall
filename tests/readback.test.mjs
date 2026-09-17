import { test } from "node:test";
import { strict as assert } from "node:assert";
import { unwrapReadback } from "../scripts/readback.mjs";

test("plain string version is not JSON", () => {
  assert.equal(unwrapReadback("CONSENT_FIREWALL_V1"), "CONSENT_FIREWALL_V1");
});

test("quoted version is decoded", () => {
  assert.equal(unwrapReadback('"CONSENT_FIREWALL_V1"'), "CONSENT_FIREWALL_V1");
});

test("nested result and JSON record are decoded", () => {
  assert.deepEqual(unwrapReadback({ result: '{"checks":"0"}' }), { checks: "0" });
});
