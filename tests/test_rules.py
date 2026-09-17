from pure_contract import module


def rules(**overrides):
    result = {dimension: "ALLOW" for dimension in module.DIMENSIONS}
    result.update(overrides)
    return result


def stances(**overrides):
    result = {dimension: "PROHIBITED" for dimension in module.DIMENSIONS}
    result.update(overrides)
    return result


def test_allow_accepts_every_policy_stance():
    for stance in module.POLICY_STANCES:
        policy = stances(MODEL_TRAINING=stance)
        assert module._derive_outcome(rules(), policy) == ("COMPATIBLE", [])


def test_deny_conflicts_with_allowed():
    outcome, conflicts = module._derive_outcome(
        rules(MODEL_TRAINING="DENY"), stances(MODEL_TRAINING="ALLOWED")
    )
    assert outcome == "CONFLICT"
    assert conflicts == ["MODEL_TRAINING"]


def test_deny_conflicts_with_opt_out_until_opt_out_is_proven():
    outcome, conflicts = module._derive_outcome(
        rules(DATA_SALE="DENY"), stances(DATA_SALE="OPT_OUT")
    )
    assert outcome == "CONFLICT"
    assert conflicts == ["DATA_SALE"]


def test_deny_accepts_prohibited():
    assert module._derive_outcome(
        rules(BIOMETRIC_PROCESSING="DENY"), stances()
    ) == ("COMPATIBLE", [])


def test_require_opt_out_accepts_opt_out():
    assert module._derive_outcome(
        rules(THIRD_PARTY_SHARING="REQUIRE_OPT_OUT"),
        stances(THIRD_PARTY_SHARING="OPT_OUT"),
    ) == ("COMPATIBLE", [])


def test_require_opt_out_conflicts_with_allowed():
    outcome, conflicts = module._derive_outcome(
        rules(THIRD_PARTY_SHARING="REQUIRE_OPT_OUT"),
        stances(THIRD_PARTY_SHARING="ALLOWED"),
    )
    assert outcome == "CONFLICT"
    assert conflicts == ["THIRD_PARTY_SHARING"]


def test_unspecified_constrained_dimension_is_unresolved():
    assert module._derive_outcome(
        rules(RETENTION_AFTER_TERMINATION="DENY"),
        stances(RETENTION_AFTER_TERMINATION="UNSPECIFIED"),
    ) == ("UNRESOLVED", [])


def test_conflict_dominates_unresolved():
    outcome, conflicts = module._derive_outcome(
        rules(MODEL_TRAINING="DENY", DATA_SALE="DENY"),
        stances(MODEL_TRAINING="UNSPECIFIED", DATA_SALE="ALLOWED"),
    )
    assert outcome == "CONFLICT"
    assert conflicts == ["DATA_SALE"]


def test_conflicts_follow_canonical_dimension_order():
    outcome, conflicts = module._derive_outcome(
        rules(MODEL_TRAINING="DENY", BIOMETRIC_PROCESSING="DENY"),
        stances(MODEL_TRAINING="ALLOWED", BIOMETRIC_PROCESSING="OPT_OUT"),
    )
    assert outcome == "CONFLICT"
    assert conflicts == ["MODEL_TRAINING", "BIOMETRIC_PROCESSING"]
