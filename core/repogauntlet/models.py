"""Strict, versioned domain models for task manifests and evaluation reports."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Mapping
import hashlib
import json
import re


class ManifestError(ValueError):
    """Raised when a task manifest or candidate overlay fails closed."""


@dataclass(frozen=True)
class Limits:
    timeout_seconds: int
    memory_mb: int
    processes: int
    network: bool


@dataclass(frozen=True)
class Commands:
    build: List[str]
    public_tests: List[str]
    hidden_tests: List[str]
    quality: List[str]


@dataclass(frozen=True)
class Scoring:
    build: int
    public_tests: int
    hidden_tests: int
    quality: int

    @property
    def total(self) -> int:
        return self.build + self.public_tests + self.hidden_tests + self.quality


@dataclass(frozen=True)
class TaskManifest:
    schema_version: str
    id: str
    title: str
    language: str
    category: str
    difficulty: str
    issue: str
    source_dir: str
    candidate_paths: List[str]
    commands: Commands
    limits: Limits
    scoring: Scoring
    seed: int = 42

    TOP_LEVEL = {"schema_version", "id", "title", "language", "category", "difficulty", "issue", "source_dir", "candidate_paths", "commands", "limits", "scoring", "seed"}
    LANGUAGES = {"Python", "Java", "Rust", "C++", "TypeScript"}
    CATEGORIES = {"bug_fix", "feature", "refactor", "performance"}
    DIFFICULTIES = {"easy", "medium", "hard", "expert"}

    @classmethod
    def from_path(cls, path: Path) -> "TaskManifest":
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise ManifestError("cannot read manifest %s: %s" % (path, exc)) from exc
        if not isinstance(raw, dict):
            raise ManifestError("manifest root must be an object")
        return cls.from_mapping(raw)

    @classmethod
    def from_mapping(cls, raw: Mapping[str, Any]) -> "TaskManifest":
        unknown = sorted(set(raw).difference(cls.TOP_LEVEL))
        missing = sorted(cls.TOP_LEVEL.difference({"seed"}).difference(raw))
        if unknown: raise ManifestError("unknown fields: %s" % ", ".join(unknown))
        if missing: raise ManifestError("missing required fields: %s" % ", ".join(missing))
        if raw["schema_version"] != "1.0": raise ManifestError("unsupported schema_version: %s" % raw["schema_version"])
        if not isinstance(raw["id"], str) or not re.fullmatch(r"[A-Z][A-Z0-9-]{4,63}", raw["id"]): raise ManifestError("invalid task id")
        if raw["language"] not in cls.LANGUAGES: raise ManifestError("unsupported language: %s" % raw["language"])
        if raw["category"] not in cls.CATEGORIES: raise ManifestError("unsupported category: %s" % raw["category"])
        if raw["difficulty"] not in cls.DIFFICULTIES: raise ManifestError("unsupported difficulty: %s" % raw["difficulty"])
        if not isinstance(raw["title"], str) or not 8 <= len(raw["title"]) <= 120: raise ManifestError("title length must be 8..120")
        if not isinstance(raw["issue"], str) or len(raw["issue"]) < 60: raise ManifestError("issue must define at least 60 characters of observable behavior")
        paths = raw["candidate_paths"]
        if not isinstance(paths, list) or not paths or len(paths) != len(set(paths)) or not all(isinstance(value, str) for value in paths): raise ManifestError("candidate_paths must be a non-empty unique string list")
        validate_relative_path(raw["source_dir"])
        if raw["source_dir"] == ".": raise ManifestError("source_dir may not be the task root")
        for candidate_path in paths: validate_relative_path(candidate_path)
        commands = _strict_object(raw["commands"], {"build", "public_tests", "hidden_tests", "quality"}, "commands")
        for name, argv in commands.items():
            if not isinstance(argv, list) or not argv or not all(isinstance(arg, str) and arg for arg in argv): raise ManifestError("commands.%s must be a non-empty argv string list" % name)
        limits_raw = _strict_object(raw["limits"], {"timeout_seconds", "memory_mb", "processes", "network"}, "limits")
        for name in ("timeout_seconds", "memory_mb", "processes"):
            if not isinstance(limits_raw[name], int) or isinstance(limits_raw[name], bool): raise ManifestError("limits.%s must be an integer" % name)
        if not 1 <= limits_raw["timeout_seconds"] <= 600: raise ManifestError("timeout_seconds must be between 1 and 600")
        if not 32 <= limits_raw["memory_mb"] <= 8192: raise ManifestError("memory_mb must be between 32 and 8192")
        if not 1 <= limits_raw["processes"] <= 1024: raise ManifestError("processes must be between 1 and 1024")
        if limits_raw["network"] is not False: raise ManifestError("evaluation network access must be disabled")
        scoring_raw = _strict_object(raw["scoring"], {"build", "public_tests", "hidden_tests", "quality"}, "scoring")
        if not all(isinstance(value, int) and not isinstance(value, bool) and 0 <= value <= 100 for value in scoring_raw.values()): raise ManifestError("scoring values must be integers from 0 to 100")
        scoring = Scoring(**scoring_raw)
        if scoring.total != 100: raise ManifestError("scoring weights must total 100, got %s" % scoring.total)
        seed = raw.get("seed", 42)
        if not isinstance(seed, int) or isinstance(seed, bool): raise ManifestError("seed must be an integer")
        return cls(raw["schema_version"], raw["id"], raw["title"], raw["language"], raw["category"], raw["difficulty"], raw["issue"], raw["source_dir"], list(paths), Commands(**commands), Limits(**limits_raw), scoring, seed)


@dataclass
class PhaseResult:
    name: str
    status: str
    duration_ms: int
    exit_code: int
    output: str
    points: float


@dataclass
class EvaluationReport:
    schema_version: str
    task_id: str
    candidate: str
    verdict: str
    score: float
    seed: int
    phases: List[PhaseResult]
    artifact_digest: str
    toolchain: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["canonical_digest"] = self.canonical_digest()
        return data

    def canonical_digest(self) -> str:
        stable = {
            "schema_version": self.schema_version, "task_id": self.task_id, "candidate": self.candidate,
            "verdict": self.verdict, "score": self.score, "seed": self.seed, "artifact_digest": self.artifact_digest,
            "phases": [{"name": p.name, "status": p.status, "exit_code": p.exit_code, "points": p.points} for p in self.phases],
        }
        return hashlib.sha256(json.dumps(stable, sort_keys=True, separators=(",", ":")).encode("utf-8")).hexdigest()


def validate_relative_path(value: str) -> None:
    if not isinstance(value, str): raise ManifestError("path must be a string")
    path = Path(value)
    if not value or value == "." or path.is_absolute() or ".." in path.parts: raise ManifestError("unsafe relative path: %r" % value)


def _strict_object(raw: Any, fields: set, label: str) -> Mapping[str, Any]:
    if not isinstance(raw, dict): raise ManifestError("%s must be an object" % label)
    unknown = sorted(set(raw).difference(fields)); missing = sorted(fields.difference(raw))
    if unknown: raise ManifestError("unknown %s fields: %s" % (label, ", ".join(unknown)))
    if missing: raise ManifestError("missing %s fields: %s" % (label, ", ".join(missing)))
    return raw

