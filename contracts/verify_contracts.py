#!/usr/bin/env python3
"""Zero-dependency verifier for frozen ScopeBomb schema, catalog, and sample fixture."""

import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCHEMA = json.loads((ROOT / "contracts" / "scope_bomb.schema.json").read_text())
CATALOG = json.loads((ROOT / "data" / "scope_catalog.json").read_text())
FIXTURE = json.loads((ROOT / "contracts" / "sample_report.fixture.json").read_text())


def _resolve_ref(ref: str):
    assert ref.startswith("#/$defs/"), f"Unsupported ref: {ref}"
    return SCHEMA["$defs"][ref.split("/")[-1]]


def validate(instance, node, path="root"):
    if "$ref" in node:
        return validate(instance, _resolve_ref(node["$ref"]), path)
    if "anyOf" in node:
        for option in node["anyOf"]:
            try:
                validate(instance, option, path)
                return
            except AssertionError:
                pass
        raise AssertionError(f"{path}: failed all anyOf options")
    if "const" in node:
        assert instance == node["const"], f"{path}: expected {node['const']!r}, got {instance!r}"
    if "enum" in node:
        assert instance in node["enum"], f"{path}: {instance!r} not in {node['enum']}"

    expected = node.get("type")
    if isinstance(expected, list):
        ok = any(_matches_type(instance, t) for t in expected)
        assert ok, f"{path}: expected one of {expected}, got {type(instance).__name__}"
    elif expected:
        assert _matches_type(instance, expected), f"{path}: expected {expected}, got {type(instance).__name__}"

    if isinstance(instance, dict):
        for req in node.get("required", []):
            assert req in instance, f"{path}: missing required key {req!r}"
        props = node.get("properties", {})
        if node.get("additionalProperties") is False:
            extra = set(instance) - set(props)
            assert not extra, f"{path}: unexpected extra keys {sorted(extra)}"
        for k, v in instance.items():
            if k in props:
                validate(v, props[k], f"{path}.{k}")
    elif isinstance(instance, list) and "items" in node:
        for i, item in enumerate(instance):
            validate(item, node["items"], f"{path}[{i}]")


def _matches_type(val, t: str) -> bool:
    return {
        "string": lambda x: isinstance(x, str),
        "integer": lambda x: isinstance(x, int) and not isinstance(x, bool),
        "number": lambda x: isinstance(x, (int, float)) and not isinstance(x, bool),
        "boolean": lambda x: isinstance(x, bool),
        "array": lambda x: isinstance(x, list),
        "object": lambda x: isinstance(x, dict),
        "null": lambda x: x is None,
    }[t](val)


def main() -> int:
    assert SCHEMA.get("title"), "Missing schema title"
    validate(FIXTURE, SCHEMA, "AuditReport")
    for i, entry in enumerate(CATALOG["scopes"]):
        validate(entry, SCHEMA["$defs"]["ScopeCatalogEntry"], f"catalog.scopes[{i}]")
    assert len(CATALOG["incident_presets"]) == 5, "Expected 5 grounded incident presets"
    print(f"OK: schema, {len(CATALOG['scopes'])} scope entries, {len(CATALOG['incident_presets'])} presets, and fixture verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
