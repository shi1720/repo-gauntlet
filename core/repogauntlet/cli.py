"""Dependency-free RepoGauntlet command line interface."""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

from .catalog import discover_tasks, preflight
from .models import ManifestError
from .runner import Runner


def repository_root() -> Path: return Path(__file__).resolve().parents[2]


def task_map(root: Path):
    result = {}
    for task_dir in discover_tasks(root / "tasks"):
        manifest, _ = preflight(task_dir)
        if manifest.id in result: raise ManifestError("duplicate task id: %s" % manifest.id)
        result[manifest.id] = task_dir
    return result


def command_list(root: Path) -> int:
    print("ID                 LANGUAGE    CATEGORY       TITLE")
    for task_dir in discover_tasks(root / "tasks"):
        manifest, _ = preflight(task_dir); print("%-18s %-11s %-14s %s" % (manifest.id, manifest.language, manifest.category, manifest.title))
    return 0


def command_doctor(root: Path) -> int:
    failures = 0; print("RepoGauntlet doctor")
    probes = {"python": ("python3", "--version"), "java": ("javac", "-version"), "rust": ("rustc", "--version"), "cpp": ("c++", "--version"), "typescript": ("node", "--version")}
    for language, argv in probes.items():
        executable = shutil.which(argv[0])
        if executable is None:
            detail = "not installed (CI remains available)"
        else:
            try:
                probe = subprocess.run(argv, capture_output=True, text=True, timeout=4, check=False)
                version = (probe.stdout or probe.stderr).strip().splitlines()
                detail = executable if probe.returncode == 0 else "unusable: %s" % (version[-1] if version else "version probe failed")
            except (OSError, subprocess.TimeoutExpired) as exc:
                detail = "unusable: %s" % exc
        print("  %-12s %s" % (language, detail))
    for task_dir in discover_tasks(root / "tasks"):
        manifest, findings = preflight(task_dir); print("  %-18s %s" % (manifest.id, "ok" if not findings else "invalid"))
        for finding in findings: failures += 1; print("    - %s" % finding)
    return 1 if failures else 0


def evaluate(root: Path, task_id: str, candidate: str, overlay: str = ""):
    tasks = task_map(root)
    if task_id not in tasks: raise ManifestError("unknown task id: %s" % task_id)
    overlay_path = Path(overlay).expanduser().resolve() if overlay else None
    label = "external" if overlay else candidate
    return Runner(root).evaluate(tasks[task_id], label, overlay_path)


def command_validate(root: Path, all_tasks: bool, task_id: str) -> int:
    selected = list(task_map(root)) if all_tasks else [task_id]; failed = 0
    for selected_id in selected:
        print("calibrating %s" % selected_id)
        baseline = evaluate(root, selected_id, "baseline"); mutant = evaluate(root, selected_id, "mutant")
        golden_runs = [evaluate(root, selected_id, "golden") for _ in range(3)]
        digests = {report.canonical_digest() for report in golden_runs}
        valid = baseline.verdict == "TEST_FAILED" and mutant.verdict == "TEST_FAILED" and all(report.verdict == "RESOLVED" for report in golden_runs) and len(digests) == 1
        print("  baseline=%s mutant=%s golden=%s repeat_digest=%s" % (baseline.verdict, mutant.verdict, golden_runs[0].verdict, "stable" if len(digests)==1 else "DRIFT"))
        if not valid: failed += 1
    return 1 if failed else 0


def write_report(root: Path, report, output: str) -> None:
    encoded = json.dumps(report.to_dict(), indent=2, sort_keys=True)
    if output:
        destination = Path(output).expanduser(); destination = destination if destination.is_absolute() else root / destination
        destination.parent.mkdir(parents=True, exist_ok=True); destination.write_text(encoded + "\n", encoding="utf-8"); print("wrote %s" % destination)
    else: print(encoded)


def command_run(root: Path, task_id: str, candidate: str, overlay: str, output: str) -> int:
    report = evaluate(root, task_id, candidate, overlay); write_report(root, report, output); return 0 if report.verdict == "RESOLVED" else 2


def command_demo(root: Path, output: str) -> int:
    reports = [evaluate(root, "PY-INTERVAL-001", "golden") for _ in range(3)]
    if len({report.canonical_digest() for report in reports}) != 1: print("demo failed: outcome digest drifted", file=sys.stderr); return 1
    report = reports[0]; write_report(root, report, output)
    print("RepoGauntlet demo: %s scored %.1f/100 (%s)" % (report.task_id, report.score, report.verdict)); print("reproducibility digest: %s" % report.canonical_digest()); return 0


def build_parser() -> argparse.ArgumentParser:
    parser=argparse.ArgumentParser(prog="repogauntlet",description="Author and calibrate reproducible coding-agent environments"); sub=parser.add_subparsers(dest="command",required=True)
    sub.add_parser("list"); sub.add_parser("doctor"); validate=sub.add_parser("validate"); validate.add_argument("task_id",nargs="?",default=""); validate.add_argument("--all",action="store_true")
    run=sub.add_parser("run"); run.add_argument("task_id"); run.add_argument("--candidate",default="golden",choices=("baseline","mutant","golden")); run.add_argument("--overlay",default="",help="candidate directory to evaluate through the overlay firewall"); run.add_argument("--output",default="")
    demo=sub.add_parser("demo"); demo.add_argument("--output",default="reports/latest.json"); return parser


def main(argv=None) -> int:
    args=build_parser().parse_args(argv); root=repository_root()
    try:
        if args.command=="list": return command_list(root)
        if args.command=="doctor": return command_doctor(root)
        if args.command=="validate":
            if not args.all and not args.task_id: raise ManifestError("provide a task id or --all")
            return command_validate(root,args.all,args.task_id)
        if args.command=="run": return command_run(root,args.task_id,args.candidate,args.overlay,args.output)
        if args.command=="demo": return command_demo(root,args.output)
    except ManifestError as exc: print("error: %s" % exc,file=sys.stderr); return 64
    return 1


if __name__=="__main__": raise SystemExit(main())
