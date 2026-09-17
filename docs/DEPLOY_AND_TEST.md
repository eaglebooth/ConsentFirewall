# Deploy and test

## Local gate

```powershell
python -m pytest -q
$env:PYTHONUTF8='1'
genvm-lint contracts\consent_firewall.py
```

## Studio Next schema gate

This transmits the contract source to the configured Studio Next RPC but does not
deploy or submit a transaction:

```powershell
npm ci
npm run schema:studio-next
```

## Deployment

Use the main wallet only for deployment. Pass its private key directly through
stdin from a secure local secret provider; the script does not read a `.env` file
or persist the value:

```powershell
<secure-secret-provider> | npm run deploy:studio-next
```

The constructor takes no arguments and the deployer receives no special role.

## First live matrix

1. Wallet A creates a strict profile.
2. Either wallet registers a commit-pinned policy snapshot and exact SHA-256.
3. Wallet A opens a check against its exact profile version.
4. Assess the check and verify all five stored classifications.
5. Repeat against a permissive profile to prove one policy can produce a distinct
   deterministic outcome for another user.
6. Submit a wrong digest and verify terminal `UNRESOLVED`.
7. Confirm non-owner profile versioning and check opening roll back.
8. Confirm duplicate profile, snapshot and check IDs roll back.
9. Publish profile version 2 and prove a new check can still bind version 1.

Record every finalized transaction and authoritative readback in
`docs/LIVE_E2E_EVIDENCE.md` after deployment.
