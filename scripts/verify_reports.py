"""Re-run committed artifacts and fail when their stable evidence has drifted."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from repogauntlet.cli import evaluate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("task_ids", nargs="+")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]

    checked = 0
    for task_id in args.task_ids:
        for candidate in ("baseline", "mutant", "golden"):
            path = root / "reports" / task_id / f"{candidate}.json"
            expected = json.loads(path.read_text(encoding="utf-8"))
            actual = evaluate(root, task_id, candidate).to_dict()
            for field in ("artifact_digest", "canonical_digest", "verdict", "score"):
                if actual[field] != expected[field]:
                    raise SystemExit(
                        f"{path}: {field} drifted: expected {expected[field]!r}, "
                        f"got {actual[field]!r}"
                    )
            checked += 1

    print(f"verified {checked} committed reports against fresh evaluations")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
