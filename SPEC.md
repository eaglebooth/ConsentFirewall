# ConsentFirewall V1 specification

## Deterministic truth table

| User rule | ALLOWED | PROHIBITED | OPT_OUT | UNSPECIFIED |
|---|---|---|---|---|
| ALLOW | compatible | compatible | compatible | compatible |
| DENY | conflict | compatible | conflict | unresolved |
| REQUIRE_OPT_OUT | conflict | compatible | compatible | unresolved |

Any conflict dominates unresolved dimensions. With no conflict, any unresolved
constrained dimension produces `UNRESOLVED`; otherwise the result is
`COMPATIBLE`.

## Provenance

V1 accepts only raw GitHub URLs containing a full 40-character commit hash. It
rejects mutable branches, query strings, fragments, credentials, traversal and
non-HTTPS sources. Validators recompute SHA-256 over the exact decoded UTF-8 text.
The `document_label` is a submitter assertion, not an authenticated publisher name.

## Consensus

Leader and validators independently fetch and classify the exact policy. A vote
is valid only when every consequential enum matches. Rationale wording is not a
consensus field. Acquisition, digest or classification failures finalize
`UNRESOLVED`; they can never silently become `COMPATIBLE`.
