#!/usr/bin/env python3
"""Static validation for AgentReach Colab notebooks.

This does not run Google authorization or claim a live API test passed.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
notebooks = sorted(ROOT.glob("*.ipynb"))
if not notebooks:
    raise SystemExit("FAIL: no AgentReach notebooks found")

errors: list[str] = []
for path in notebooks:
    try:
        notebook = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        errors.append(f"{path.name}: invalid JSON ({type(exc).__name__})")
        continue

    if notebook.get("nbformat") != 4:
        errors.append(f"{path.name}: expected nbformat 4")

    cells = notebook.get("cells", [])
    ids = [cell.get("id") for cell in cells]
    if any(not cell_id for cell_id in ids):
        errors.append(f"{path.name}: one or more cells have no ID")
    if len(ids) != len(set(ids)):
        errors.append(f"{path.name}: cell IDs are not unique")

    for index, cell in enumerate(cells):
        if cell.get("cell_type") not in {"markdown", "code"}:
            errors.append(f"{path.name}: unsupported cell type at index {index}")
        if not isinstance(cell.get("source", []), list):
            errors.append(f"{path.name}: cell source must be a list at index {index}")

safe_path = ROOT / "AgentReach_Needle3_Phase3_SafeTest.ipynb"
if safe_path.exists():
    safe_nb = json.loads(safe_path.read_text(encoding="utf-8"))
    code = "\n".join(
        "".join(cell.get("source", []))
        for cell in safe_nb.get("cells", [])
        if cell.get("cell_type") == "code"
    )
    if "AgentReach Test Document" not in code:
        errors.append("Phase 3 Safe Test: exact test-document title missing")
    if "name = '{TEST_DOC_NAME}'" not in code:
        errors.append("Phase 3 Safe Test: exact-title Drive filter missing")
    if "file_id != approved_file_id" not in code:
        errors.append("Phase 3 Safe Test: exact approved-ID guard missing")
    if "text[:limit]" not in code or "limit = 5000" not in code:
        errors.append("Phase 3 Safe Test: 5,000-character preview cap missing")
    if "input(" in code:
        errors.append("Phase 3 Safe Test: interactive input prompt should not be used")
    for forbidden in (".create(", ".update(", ".delete(", ".trash("):
        if forbidden in code:
            errors.append(f"Phase 3 Safe Test: unexpected write operation {forbidden}")

if errors:
    print("AgentReach notebook validation: FAILED")
    for error in errors:
        print(f"- {error}")
    raise SystemExit(1)

print(f"AgentReach notebook validation: PASS ({len(notebooks)} notebooks parsed)")
print("Static checks only; live Google authorization and Needle execution require Colab.")
