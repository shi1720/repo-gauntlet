"""Task discovery and quality preflight."""

from pathlib import Path
from typing import Iterable, List, Tuple

from .models import ManifestError, TaskManifest


def discover_tasks(root: Path) -> List[Path]:
    return sorted(path.parent for path in root.glob("*/*/task.json"))


def preflight(task_dir: Path) -> Tuple[TaskManifest, List[str]]:
    manifest = TaskManifest.from_path(task_dir / "task.json")
    findings: List[str] = []
    if len(manifest.issue.split()) < 18:
        findings.append("issue statement is too short to define observable behavior")
    if not (task_dir / manifest.source_dir).is_dir():
        findings.append("source_dir does not exist")
    if not (task_dir / "grader").is_dir():
        findings.append("grader directory does not exist")
    for candidate in ("golden", "mutant"):
        if not (task_dir / "candidates" / candidate).is_dir():
            findings.append("missing %s negative/control candidate" % candidate)
    return manifest, findings
