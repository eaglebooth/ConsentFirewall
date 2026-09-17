# ConsentFirewall

ConsentFirewall is a standalone GenLayer Intelligent Contract that produces an
auditable compatibility receipt between a user's versioned consent constraints
and one immutable user-submitted policy document snapshot.

It does **not** compare policy versions. Validators extract a bounded five-field
policy vector; deterministic contract code compares it with the frozen user
profile and stores `COMPATIBLE`, `CONFLICT`, or `UNRESOLVED`.

## Why GenLayer

Statements such as “we may use submissions to improve services”, “we do not sell
personal information”, and “you can opt out” require semantic interpretation.
A keyword search cannot reliably map policy prose to exact data-use permissions.
Independent validators fetch the same commit-pinned bytes and must agree on all
five classifications before the contract derives the outcome.

## Five dimensions

- `MODEL_TRAINING`
- `DATA_SALE`
- `THIRD_PARTY_SHARING`
- `BIOMETRIC_PROCESSING`
- `RETENTION_AFTER_TERMINATION`

User rules are `ALLOW`, `DENY`, or `REQUIRE_OPT_OUT`. Policy stances are
`ALLOWED`, `PROHIBITED`, `OPT_OUT`, or `UNSPECIFIED`.

## Original architecture

The durable relation is many consent-profile versions × many immutable policy
snapshots. It is not a renamed policy-diff, promise-drift, incident-gate,
exception-budget, escrow, or monitoring contract. Old profile versions remain
auditable after a new version is published.

## Lifecycle

```text
CREATE PROFILE + REGISTER POLICY SNAPSHOT
  -> OPEN CHECK
  -> VALIDATORS FETCH, HASH AND CLASSIFY
  -> CONTRACT COMPARES RULES
  -> COMPATIBLE | CONFLICT | UNRESOLVED
```

## Public API

Writes: `create_profile`, `publish_profile_version`, `register_policy`,
`open_check`, `assess_check`.

Views: `get_contract_version`, `get_profile`, `get_snapshot`, `get_check`,
`get_stats`.

## Verification

```powershell
python -m pytest -q
$env:PYTHONUTF8='1'
genvm-lint contracts\consent_firewall.py
npm run schema:studio-next
```

## Studio Next test deployment (superseded)

- Network: Studio Next, chain `61997`
- Contract: [`0x8887E688Bc8F53be27052Ab559E03b542116B4A9`](https://explorer-studio-dev.genlayer.com/address/0x8887E688Bc8F53be27052Ab559E03b542116B4A9)
- Version readback: `CONSENT_FIREWALL_V1`
- Initial state: zero profiles, versions, snapshots, checks and outcomes
- The first live semantic assessment failed because this deployed source called
  `gl.vm.run_nondet_unsafe`, unavailable in the Studio Next runtime. The local
  V2 source now uses `gl.vm.run_nondet`; a fresh deployment is required before
  claiming semantic E2E success. See `docs/LIVE_E2E_EVIDENCE.md`.

## Safe claim boundary

The receipt reports compatibility between submitted constraints and statements in
the exact submitted policy bytes. A label is descriptive and does not authenticate
the publisher; commit pinning proves reproducible content, not provider identity.
It does not prove provider behavior, legal
compliance, informed consent, successful opt-out, or real-world enforcement. It
does not hold funds or trigger an external account action.
