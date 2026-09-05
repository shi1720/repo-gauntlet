"""Deterministic trusted-local evaluator for task authoring and CI calibration."""

from __future__ import annotations

import hashlib
import json
import os
import platform
import shutil
import signal
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Dict, List, Optional

from .models import EvaluationReport, ManifestError, PhaseResult, TaskManifest
from .security import validate_overlay


class Runner:
    def __init__(self, repository_root: Path):
        self.repository_root = repository_root.resolve()

    def evaluate(self, task_dir: Path, candidate: str, overlay_path: Optional[Path] = None) -> EvaluationReport:
        task_dir = task_dir.resolve(); manifest = TaskManifest.from_path(task_dir / "task.json")
        source = (task_dir / manifest.source_dir).resolve()
        if task_dir not in source.parents or not source.is_dir(): raise ManifestError("source_dir escaped the task directory or does not exist")
        self._reject_symlinks(source, "source")
        overlay = None if candidate == "baseline" else (overlay_path or (task_dir / "candidates" / candidate)).resolve()
        if overlay is not None:
            try: validate_overlay(overlay, manifest.candidate_paths)
            except ManifestError as exc:
                phase = PhaseResult("overlay", "rejected", 0, 64, str(exc), 0.0)
                return self._report(manifest, candidate, "PATCH_REJECTED", [phase], self._artifact_digest(task_dir, source, None))
        artifact_digest = self._artifact_digest(task_dir, source, overlay)
        phases: List[PhaseResult] = []

        build = self._execute_in_fresh_workspace(task_dir, source, overlay, manifest, "build", manifest.commands.build, manifest.scoring.build, prerequisite=False)
        phases.append(build)
        if build.status == "infrastructure_error": return self._report(manifest, candidate, "INFRA_ERROR", phases, artifact_digest)
        if build.status == "timeout": return self._report(manifest, candidate, "TIMEOUT", phases, artifact_digest)
        if build.status != "passed": return self._report(manifest, candidate, "BUILD_FAILED", phases, artifact_digest)

        public = self._execute_in_fresh_workspace(task_dir, source, overlay, manifest, "public_tests", manifest.commands.public_tests, manifest.scoring.public_tests, prerequisite=True)
        hidden = self._execute_in_fresh_workspace(task_dir, source, overlay, manifest, "hidden_tests", manifest.commands.hidden_tests, manifest.scoring.hidden_tests, prerequisite=True)
        phases.extend([public, hidden])
        if any(phase.status == "infrastructure_error" for phase in (public, hidden)): return self._report(manifest, candidate, "INFRA_ERROR", phases, artifact_digest)
        if any(phase.status == "timeout" for phase in (public, hidden)): return self._report(manifest, candidate, "TIMEOUT", phases, artifact_digest)
        if any(phase.status != "passed" for phase in (public, hidden)):
            phases.append(PhaseResult("quality", "skipped", 0, 0, "quality command skipped until behavior passes", 0.0))
            return self._report(manifest, candidate, "TEST_FAILED", phases, artifact_digest)

        quality = self._execute_in_fresh_workspace(task_dir, source, overlay, manifest, "quality", manifest.commands.quality, manifest.scoring.quality, prerequisite=False)
        phases.append(quality)
        if quality.status == "infrastructure_error": verdict = "INFRA_ERROR"
        elif quality.status == "timeout": verdict = "TIMEOUT"
        elif quality.status != "passed": verdict = "QUALITY_FAILED"
        else: verdict = "RESOLVED"
        return self._report(manifest, candidate, verdict, phases, artifact_digest)

    def _execute_in_fresh_workspace(self, task_dir: Path, source: Path, overlay: Optional[Path], manifest: TaskManifest, name: str, argv: List[str], points: int, prerequisite: bool) -> PhaseResult:
        with tempfile.TemporaryDirectory(prefix="repogauntlet-") as temp_name:
            workspace = Path(temp_name) / "workspace"; shutil.copytree(source, workspace, symlinks=True)
            if overlay is not None:
                for relative in manifest.candidate_paths:
                    destination = workspace / relative; destination.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(overlay / relative, destination)
            grader = workspace / ".repogauntlet_grader"; shutil.copytree(task_dir / "grader", grader, symlinks=True)
            env = self._environment(manifest, grader)
            if prerequisite:
                prepared = self._run_phase("prepare", manifest.commands.build, workspace, env, manifest.limits.timeout_seconds, 0)
                if prepared.status != "passed": return PhaseResult(name, prepared.status, prepared.duration_ms, prepared.exit_code, "prerequisite build failed\n" + prepared.output, 0.0)
            return self._run_phase(name, argv, workspace, env, manifest.limits.timeout_seconds, points)

    def _run_phase(self, name: str, argv: List[str], cwd: Path, env: Dict[str, str], timeout: int, points: int) -> PhaseResult:
        started = time.monotonic()
        try:
            process = subprocess.Popen(argv, cwd=str(cwd), env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=False, shell=False, start_new_session=(os.name != "nt"))
            try:
                stdout, stderr = process.communicate(timeout=timeout)
            except subprocess.TimeoutExpired:
                if os.name != "nt": os.killpg(process.pid, signal.SIGKILL)
                else: process.kill()
                stdout, stderr = process.communicate()
                return PhaseResult(name, "timeout", int((time.monotonic()-started)*1000), 124, self._format_output(stdout, stderr), 0.0)
            status = "passed" if process.returncode == 0 else "failed"
            output = self._format_output(stdout, stderr)
            marker = "REPOGAUNTLET_PHASE_COMPLETE:%s" % name
            if status == "passed" and name in {"public_tests", "hidden_tests"} and marker not in output:
                status = "failed"
                output = (output + "\nmissing grader-wrapper completion marker").strip()
            return PhaseResult(name, status, int((time.monotonic()-started)*1000), int(process.returncode or 0), output, float(points if status == "passed" else 0))
        except FileNotFoundError as exc:
            return PhaseResult(name, "infrastructure_error", int((time.monotonic()-started)*1000), 127, str(exc), 0.0)

    @staticmethod
    def _format_output(stdout: bytes, stderr: bytes) -> str:
        out = stdout.decode("utf-8", errors="replace").strip(); err = stderr.decode("utf-8", errors="replace").strip()
        combined = (("stdout:\n" + out) if out else "") + (("\nstderr:\n" + err) if err else "")
        return combined.strip()[-8000:]

    def _environment(self, manifest: TaskManifest, grader: Path) -> Dict[str, str]:
        env = {key: os.environ[key] for key in ("PATH", "SystemRoot", "WINDIR") if key in os.environ}
        env["PATH"] = str(self.repository_root / "node_modules" / ".bin") + os.pathsep + env.get("PATH", "")
        env.update({"REPOGAUNTLET_GRADER": str(grader), "REPOGAUNTLET_SEED": str(manifest.seed), "PYTHONHASHSEED": str(manifest.seed), "TZ": "UTC", "LANG": "C.UTF-8", "LC_ALL": "C.UTF-8", "SOURCE_DATE_EPOCH": "1704067200", "NO_COLOR": "1"})
        return env

    @staticmethod
    def _reject_symlinks(root: Path, label: str) -> None:
        for path in root.rglob("*"):
            if path.is_symlink(): raise ManifestError("%s may not contain symlinks: %s" % (label, path.relative_to(root)))

    @staticmethod
    def _artifact_digest(task_dir: Path, source: Path, overlay: Optional[Path]) -> str:
        digest = hashlib.sha256(); digest.update((task_dir / "task.json").read_bytes())
        for label, root in (("source", source), ("grader", task_dir / "grader"), ("overlay", overlay)):
            if root is None: continue
            for path in sorted(item for item in root.rglob("*") if item.is_file()):
                digest.update(label.encode()); digest.update(path.relative_to(root).as_posix().encode()); digest.update(path.read_bytes())
        return digest.hexdigest()

    @staticmethod
    def _report(manifest: TaskManifest, candidate: str, verdict: str, phases: List[PhaseResult], artifact_digest: str) -> EvaluationReport:
        return EvaluationReport("1.0", manifest.id, candidate, verdict, round(sum(phase.points for phase in phases), 1), manifest.seed, phases, artifact_digest, {"host": platform.platform(), "python": platform.python_version()})
