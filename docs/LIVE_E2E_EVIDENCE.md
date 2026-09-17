# ConsentFirewall — Studio Next live evidence

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

This file intentionally contains no invented transaction hash. Add source parity,
the failure-first matrix, happy paths and final readbacks only after each
transaction finalizes.
