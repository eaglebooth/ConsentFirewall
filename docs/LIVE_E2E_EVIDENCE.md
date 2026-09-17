# ConsentFirewall — Studio Next live evidence

## V3 completed matrix

Verified on Studio Next, chain `61997`, against
[`0x7d6B664b0bE5CdC11efB39c2201371C1F39D4981`](https://explorer-studio-dev.genlayer.com/address/0x7d6B664b0bE5CdC11efB39c2201371C1F39D4981).

- Contract version: `CONSENT_FIREWALL_V3`
- Scenario: `1789620038345`
- Strict profile owner: `0xeb57bc7125fa60d7482ce12058397369ab3581f8`
- Permissive profile owner: `0x2da5393d7bbb9a037dc3abb56dbbc5c150fc843f`
- Immutable fixture: commit `ab767ac80c811d464e67828d06a8c90f9450ee50`
- Observed SHA-256: `ad0204016e3dcba0a5141635d5ba195b7cdcacf50751cc4638cba00b688b67d6`

### Failure-first and setup transactions

| Step | Finalized transaction | Result |
|---|---|---|
| Create strict profile | [`0x812026…b0dd`](https://explorer-studio-dev.genlayer.com/tx/0x8120266f95486b6a899b1a82614176e87de3fafd9806ef9b9529c6d66ce2b0dd) | Success |
| Non-owner publishes profile version | [`0xf90e20…7bb5`](https://explorer-studio-dev.genlayer.com/tx/0xf90e20ba25fd4dcff1ce9f3f1d5c74115ae883e76bb7de5c88852a1d748a7bb5) | `PROFILE_OWNER_ONLY` rollback |
| Duplicate profile | [`0x07cf49…9cb5`](https://explorer-studio-dev.genlayer.com/tx/0x07cf49588232cb485ac03f13f00ef3544d1c1fb27db4ed6b846626e1c23d9cb5) | `INVALID_OR_DUPLICATE_PROFILE` rollback |
| Register policy snapshot | [`0xf2029c…a5b4`](https://explorer-studio-dev.genlayer.com/tx/0xf2029ce7197328bfa8b57e15e27260ead876906e3a720946a2a64fa7dcb3a5b4) | Success |
| Duplicate source bytes | [`0x3d9831…7633`](https://explorer-studio-dev.genlayer.com/tx/0x3d98312e3e21a7db6c202b8000d36bca464e5be2140e6236f0509f57942b7633) | `POLICY_CONTENT_ALREADY_REGISTERED` rollback |
| Open strict check | [`0x62309b…488a`](https://explorer-studio-dev.genlayer.com/tx/0x62309b894e463241e9a59e37c3231333304b779d511c8d75ee7992789e49488a) | Success |
| Non-owner opens strict check | [`0xbaf4f0…5dcc`](https://explorer-studio-dev.genlayer.com/tx/0xbaf4f0349e2e7f2512725a8a890b1c928cd4861ec9b3e0561eebe22263ec5dcc) | `PROFILE_OWNER_ONLY` rollback |

### Semantic results

| Step | Finalized transaction | Authoritative result |
|---|---|---|
| Assess strict profile | [`0xc3848f…c3e4`](https://explorer-studio-dev.genlayer.com/tx/0xc3848f8be70faeeaf41cfc4bc630adf430d37bb147568cdbdf78be73e153c3e4) | `CONFLICT` |
| Reassess finalized check | [`0x995cf2…285e`](https://explorer-studio-dev.genlayer.com/tx/0x995cf2cd95697b71329f78c9acfb892cc0664df328b8d5be5fa51922ec18285e) | `CHECK_ALREADY_FINAL` rollback |
| Create permissive profile | [`0x3473c1…619c`](https://explorer-studio-dev.genlayer.com/tx/0x3473c1da37b357bb39719efd1fd868ee22cbd42849ee42eb6f9f7aa19b5c619c) | Success |
| Open permissive check | [`0x8b8d87…23c5`](https://explorer-studio-dev.genlayer.com/tx/0x8b8d87c8ff31fc070e10b5a3be5728aace512b3167112aaba1ea19a83bdf23c5) | Success |
| Assess permissive profile | [`0x65dbde…55ae`](https://explorer-studio-dev.genlayer.com/tx/0x65dbdebae06035c2a8eec11046516fa33b150b552724b3e372fc61d8002555ae) | `COMPATIBLE` |
| Register deliberately wrong digest | [`0x079d17…82aed`](https://explorer-studio-dev.genlayer.com/tx/0x079d17b166dccd64d6b0cbe9fb57a5d2cd2c381880670f7e0a4d237410d82aed) | Success |
| Open wrong-digest check | [`0x6da7b6…24c44`](https://explorer-studio-dev.genlayer.com/tx/0x6da7b60d5129c564a2135dbb362b4507fe05ccca294e33d10ffef0c5a5924c44) | Success |
| Assess wrong digest | [`0x544ce6…4d6b`](https://explorer-studio-dev.genlayer.com/tx/0x544ce658292f35d677f586a074bcf7e4e081389756310b53ec7a20e67edb4d6b) | `UNRESOLVED / SOURCE_DIGEST_MISMATCH` |

Both successful semantic checks stored the same validator-agreed policy vector:

```json
{
  "MODEL_TRAINING": "ALLOWED",
  "DATA_SALE": "PROHIBITED",
  "THIRD_PARTY_SHARING": "ALLOWED",
  "BIOMETRIC_PROCESSING": "PROHIBITED",
  "RETENTION_AFTER_TERMINATION": "ALLOWED"
}
```

Deterministic comparison produced conflicts for the strict profile on model
training, third-party sharing and post-termination retention. The independently
owned all-`ALLOW` profile was compatible with the same immutable policy vector.

Final authoritative counters:

```json
{
  "profiles": "2",
  "profile_versions": "2",
  "snapshots": "2",
  "checks": "3",
  "compatible": "1",
  "conflicts": "1",
  "unresolved": "1"
}
```

This proves reproducible source hashing, two-user profile ownership, exact
five-dimension semantic consensus, deterministic compatibility derivation,
terminal-check replay protection and fail-closed digest handling. It does not
authenticate the policy publisher or prove provider behavior or legal compliance.

## Superseded deployments

Verified deployment on Studio Next, chain `61997`:

- Contract: [`0x8887E688Bc8F53be27052Ab559E03b542116B4A9`](https://explorer-studio-dev.genlayer.com/address/0x8887E688Bc8F53be27052Ab559E03b542116B4A9)
- `get_contract_version`: `CONSENT_FIREWALL_V1`
- Initial `get_stats`: `profiles=0`, `profile_versions=0`, `snapshots=0`,
  `checks=0`, `compatible=0`, `conflicts=0`, `unresolved=0`

Status: superseded test deployment; transactional E2E failed at first semantic
assessment. Do not use this address as evidence of a working compatibility check.

## Verified deterministic setup and failure boundaries

The two-wallet test created a strict profile and a pinned policy snapshot, then
confirmed finalized rollbacks for non-owner profile update, duplicate profile,
duplicate source content and non-owner check opening. The strict check was opened.

| Step | Finalized transaction | Result |
|---|---|---|
| Create strict profile | [`0xa0cc20…bd054`](https://explorer-studio-dev.genlayer.com/tx/0xa0cc202c74451b69fc7fdf59aaab0dd3f13c8a93e7d4102ada1663b983ebd054) | Success |
| Non-owner profile update | [`0xa9ce65…c096`](https://explorer-studio-dev.genlayer.com/tx/0xa9ce659de3e4d65fcdc6e103e8dffabc4940242d3b03a6db1ad69d44df85c096) | `PROFILE_OWNER_ONLY` rollback |
| Duplicate profile | [`0xb8d38e…aa14`](https://explorer-studio-dev.genlayer.com/tx/0xb8d38ef767fb2dccac77274f324e18dbad7b06fe4f9223e7fcd395d83841aa14) | `INVALID_OR_DUPLICATE_PROFILE` rollback |
| Register policy snapshot | [`0x93c466…0cf5`](https://explorer-studio-dev.genlayer.com/tx/0x93c4664d88a79023f66dd43cf37d84042c1b73b47767f40626606841ae4f0cf5) | Success |
| Duplicate source content | [`0x1c52e9…1c84`](https://explorer-studio-dev.genlayer.com/tx/0x1c52e9d95520f53970218d1bc77d56a88b6f622763ce173cd6ceb5c9475e1c84) | `POLICY_CONTENT_ALREADY_REGISTERED` rollback |
| Open strict check | [`0x3cba19…ff14`](https://explorer-studio-dev.genlayer.com/tx/0x3cba1937f1c831d208a9ad2d128ef2a9003a4268151f5ed170f0dd599b90ff14) | Success |
| Non-owner opens check | [`0xc0e36e…0677`](https://explorer-studio-dev.genlayer.com/tx/0xc0e36ea43068dc9b129c28f73ce05e2ff4b5c5a5f9d5a0d83e558a949fa40677) | `PROFILE_OWNER_ONLY` rollback |
| First semantic assessment | [`0x133dc0…704f`](https://explorer-studio-dev.genlayer.com/tx/0x133dc046b49f486f5d705ab20952e8aa00ff9766c4bfd62f05e2e78574f4704f) | Runtime error; no assessment committed |

The assessment traceback says `AttributeError: module 'genlayer.vm' has no
attribute 'run_nondet_unsafe'`. Source has been corrected to `run_nondet`, but
that correction requires a fresh user deployment and a new E2E run. No
`COMPATIBLE`, `CONFLICT` or `UNRESOLVED` live result has been proven yet.

## V2 semantic execution

Contract [`0x850bf9E22A69C35EbAF67c109F9148e4ee4adee3`](https://explorer-studio-dev.genlayer.com/address/0x850bf9E22A69C35EbAF67c109F9148e4ee4adee3)
returned `CONSENT_FIREWALL_V2` with zero initial counters. Deterministic role and
duplicate boundaries finalized as expected. The first semantic assessment
executed successfully at [`0x6d2679…40de`](https://explorer-studio-dev.genlayer.com/tx/0x6d26795b2b45104ef86c6d004059239712a3fcec15054c6e8eb0478f444040de),
but authoritative readback was `UNRESOLVED / INVALID_CLASSIFICATION`. No conflict
or compatible verdict was claimed. V3 fixes the overly ambiguous output-shape
instruction while retaining exact enum and key validation.

This file intentionally contains no invented transaction hash. Add source parity,
the failure-first matrix, happy paths and final readbacks only after each
transaction finalizes.
