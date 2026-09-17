import ast
from pathlib import Path
import types


SOURCE_PATH = Path(__file__).parents[1] / "contracts" / "consent_firewall.py"
TREE = ast.parse(SOURCE_PATH.read_text(encoding="utf-8"))
NAMES = {
    "DIMENSIONS", "USER_RULES", "POLICY_STANCES",
    "_token", "_text", "_sha256", "_source_url", "_parse_rules",
    "_normalize_classification", "_derive_outcome",
}
selected = []
for node in TREE.body:
    if isinstance(node, ast.Assign):
        assigned = {target.id for target in node.targets if isinstance(target, ast.Name)}
        if assigned & NAMES:
            selected.append(node)
    elif isinstance(node, ast.FunctionDef) and node.name in NAMES:
        selected.append(node)

pure_tree = ast.Module(
    body=[ast.Import(names=[ast.alias(name="json")]), ast.Import(names=[ast.alias(name="typing")])] + selected,
    type_ignores=[],
)
ast.fix_missing_locations(pure_tree)
module = types.ModuleType("consent_firewall_pure")
exec(compile(pure_tree, str(SOURCE_PATH), "exec"), module.__dict__)

