import ast
from pathlib import Path


CONTRACT = Path(__file__).parents[1] / "contracts" / "consent_firewall.py"
SOURCE = CONTRACT.read_text(encoding="utf-8")
TREE = ast.parse(SOURCE)


def test_runner_header_is_first():
    lines = SOURCE.splitlines()
    assert lines[0] == "# v0.3.0"
    assert "py-genlayer:" in lines[1]


def test_single_contract_class():
    contracts = [
        node for node in TREE.body
        if isinstance(node, ast.ClassDef)
        and any(ast.unparse(base) == "gl.contract.Contract" for base in node.bases)
    ]
    assert [node.name for node in contracts] == ["ConsentFirewall"]


def test_expected_public_methods_only():
    contract = next(node for node in TREE.body if isinstance(node, ast.ClassDef) and node.name == "ConsentFirewall")
    public = []
    for node in contract.body:
        if not isinstance(node, ast.FunctionDef):
            continue
        decorators = {ast.unparse(item) for item in node.decorator_list}
        if "gl.public.write" in decorators or "gl.public.view" in decorators:
            public.append(node.name)
    assert set(public) == {
        "create_profile", "publish_profile_version", "register_policy", "open_check",
        "assess_check", "get_contract_version", "get_profile", "get_snapshot",
        "get_check", "get_stats",
    }


def test_model_cannot_return_final_compatibility_outcome():
    prompt_start = SOURCE.index('"You classify a public service policy')
    prompt_end = SOURCE.index("raw = gl.nondet.exec_prompt", prompt_start)
    prompt_source = SOURCE[prompt_start:prompt_end]
    assert "Do not decide compatibility" in prompt_source
    assert "COMPATIBLE" not in prompt_source
    assert "CONFLICT" not in prompt_source


def test_custom_validator_compares_consequential_vector():
    assert "left[\"dimensions\"] == right[\"dimensions\"]" in SOURCE
    assert 'str(left.get("observed", "")) == source_sha256' in SOURCE
    assert 'check.observed_sha256 = source_sha256' in SOURCE
    assert "gl.vm.run_nondet(classify, validate)" in SOURCE
    assert "run_nondet_unsafe" not in SOURCE


def test_source_failure_is_fail_closed():
    assert 'check.outcome = "UNRESOLVED"' in SOURCE
    assert '"SOURCE_DIGEST_MISMATCH"' in SOURCE


def test_no_custody_or_value_transfer_apis():
    lowered = SOURCE.lower()
    for forbidden in ("transfer(", "payable", "send_value", "selfdestruct"):
        assert forbidden not in lowered


def test_no_host_wall_clock_enters_consensus_state():
    assert "time.time" not in SOURCE
    assert "import time" not in SOURCE


def test_semantic_replays_are_indexed():
    assert "snapshot_content_keys" in SOURCE
    assert "check_relation_keys" in SOURCE
    assert "POLICY_CONTENT_ALREADY_REGISTERED" in SOURCE
    assert "COMPATIBILITY_ALREADY_CHECKED" in SOURCE
