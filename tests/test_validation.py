import json
from pure_contract import module


VALID_RULES = {dimension: "DENY" for dimension in module.DIMENSIONS}
VALID_STANCES = {dimension: "PROHIBITED" for dimension in module.DIMENSIONS}


def test_rules_require_exact_dimension_set():
    incomplete = dict(VALID_RULES)
    incomplete.pop("DATA_SALE")
    assert module._parse_rules(json.dumps(incomplete)) == {}


def test_rules_reject_extra_dimension():
    extra = dict(VALID_RULES, LOCATION_TRACKING="DENY")
    assert module._parse_rules(json.dumps(extra)) == {}


def test_rules_normalize_case():
    lower = {dimension: "deny" for dimension in module.DIMENSIONS}
    assert module._parse_rules(json.dumps(lower)) == VALID_RULES


def test_rules_reject_unknown_enum():
    bad = dict(VALID_RULES, DATA_SALE="MAYBE")
    assert module._parse_rules(json.dumps(bad)) == {}


def test_classification_requires_exact_shape():
    assert module._normalize_classification({"dimensions": VALID_STANCES}) == {}


def test_classification_accepts_exact_shape():
    result = module._normalize_classification({
        "dimensions": VALID_STANCES,
        "rationale": "Every relevant use is expressly prohibited.",
    })
    assert result["dimensions"] == VALID_STANCES


def test_classification_accepts_flat_exact_shape():
    flat = dict(VALID_STANCES)
    flat["rationale"] = "All five classifications are explicit."
    result = module._normalize_classification(flat)
    assert result["dimensions"] == VALID_STANCES


def test_classification_still_rejects_extra_keys():
    value = {"dimensions": VALID_STANCES, "rationale": "Clear.", "verdict": "COMPATIBLE"}
    assert module._normalize_classification(value) == {}


def test_classification_accepts_and_validates_observed_digest():
    result = module._normalize_classification({
        "dimensions": VALID_STANCES,
        "rationale": "Every relevant use is expressly prohibited.",
        "observed": "a" * 64,
    })
    assert result["observed"] == "a" * 64
    assert module._normalize_classification({
        "dimensions": VALID_STANCES,
        "rationale": "Every relevant use is expressly prohibited.",
        "observed": "not-a-digest",
    }) == {}


def test_classification_rejects_unknown_policy_stance():
    bad = dict(VALID_STANCES, MODEL_TRAINING="SOMETIMES")
    assert module._normalize_classification({"dimensions": bad, "rationale": "x"}) == {}


def test_token_rejects_path_characters():
    assert module._token("../profile") == ""
    assert module._token("valid-profile_1") == "valid-profile_1"


def test_digest_validation():
    assert module._sha256("a" * 64) == "a" * 64
    assert module._sha256("g" * 64) == ""


def test_source_requires_commit_pinned_raw_github_url():
    valid = "https://raw.githubusercontent.com/org/repo/" + "a" * 40 + "/fixtures/policy.md"
    assert module._source_url(valid) == valid
    assert module._source_url(valid.replace("a" * 40, "main")) == ""
    assert module._source_url(valid + "?raw=1") == ""
