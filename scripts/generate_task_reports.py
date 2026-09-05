"""Generate the three calibrated reports for one task pack."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from repogauntlet.cli import evaluate


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("task_id")
    parser.add_argument("output_dir", type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    expected = {
        "baseline": "TEST_FAILED",
        "mutant": "TEST_FAILED",
        "golden": "RESOLVED",
    }

    destination = args.output_dir / args.task_id
    destination.mkdir(parents=True, exist_ok=True)
    for candidate, verdict in expected.items():
        report = evaluate(root, args.task_id, candidate)
        if report.verdict != verdict:
            raise SystemExit(
                f"{args.task_id}/{candidate}: expected {verdict}, got {report.verdict}"
            )
        path = destination / f"{candidate}.json"
        path.write_text(
            json.dumps(report.to_dict(), indent=2, sort_keys=True) + "\n",
            encoding="utf-8",
        )
        print(f"wrote {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

