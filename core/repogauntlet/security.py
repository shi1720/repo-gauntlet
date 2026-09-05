"""Candidate overlay firewall for trusted authoring and CI calibration.

These checks reduce accidental scope expansion but are not an execution sandbox.
See the threat model before adapting the runner for untrusted submissions.
"""

from pathlib import Path
from typing import Iterable

from .models import ManifestError, validate_relative_path

MAX_FILE_BYTES = 512 * 1024
MAX_TOTAL_BYTES = 2 * 1024 * 1024
FORBIDDEN_PARTS = {"grader", "golden", ".git", ".openai", "task.json"}


def validate_overlay(root: Path, allowed_paths: Iterable[str]) -> None:
    if not root.is_dir():
        raise ManifestError("candidate overlay is not a directory: %s" % root)
    allowed = set(allowed_paths)
    total = 0
    found = set()
    for path in sorted(root.rglob("*")):
        if path.is_symlink():
            raise ManifestError("candidate overlays may not contain symlinks: %s" % path)
        if not path.is_file():
            continue
        relative = path.relative_to(root).as_posix()
        validate_relative_path(relative)
        if any(part in FORBIDDEN_PARTS for part in Path(relative).parts):
            raise ManifestError("candidate attempted to modify protected path: %s" % relative)
        if relative not in allowed:
            raise ManifestError("candidate path is not allowed: %s" % relative)
        size = path.stat().st_size
        if size > MAX_FILE_BYTES:
            raise ManifestError("candidate file exceeds size limit: %s" % relative)
        total += size
        found.add(relative)
    if total > MAX_TOTAL_BYTES:
        raise ManifestError("candidate overlay exceeds total size limit")
    missing = sorted(allowed.difference(found))
    if missing:
        raise ManifestError("candidate overlay is missing: %s" % ", ".join(missing))
