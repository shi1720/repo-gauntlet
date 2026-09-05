import tempfile
import unittest
from pathlib import Path

from repogauntlet.models import ManifestError, TaskManifest
from repogauntlet.security import validate_overlay


class ManifestTests(unittest.TestCase):
    def test_rejects_scoring_that_does_not_total_100(self):
        raw = {
            "schema_version": "1.0", "id": "TEST-001", "title": "A valid title", "language": "Python",
            "category": "bug_fix", "difficulty": "easy", "issue": "A complete observable issue statement with enough words and explicit behavior to satisfy validation.",
            "source_dir": "source", "candidate_paths": ["a.py"],
            "commands": {"build": ["true"], "public_tests": ["true"], "hidden_tests": ["true"], "quality": ["true"]},
            "limits": {"timeout_seconds": 2, "memory_mb": 64, "processes": 4, "network": False},
            "scoring": {"build": 10, "public_tests": 10, "hidden_tests": 10, "quality": 10},
        }
        with self.assertRaisesRegex(ManifestError, "total 100"):
            TaskManifest.from_mapping(raw)

    def test_rejects_unknown_fields_and_invalid_enums(self):
        path = Path(__file__).resolve().parents[1] / "tasks" / "python" / "interval-ledger" / "task.json"
        import json
        raw = json.loads(path.read_text())
        raw["surprise"] = True
        with self.assertRaisesRegex(ManifestError, "unknown fields"):
            TaskManifest.from_mapping(raw)
        raw.pop("surprise")
        raw["language"] = "Brainfuck"
        with self.assertRaisesRegex(ManifestError, "unsupported language"):
            TaskManifest.from_mapping(raw)

    def test_rejects_invalid_limit_ranges(self):
        path = Path(__file__).resolve().parents[1] / "tasks" / "python" / "interval-ledger" / "task.json"
        import json
        raw = json.loads(path.read_text())
        raw["limits"]["memory_mb"] = -1
        with self.assertRaisesRegex(ManifestError, "memory_mb"):
            TaskManifest.from_mapping(raw)

    def test_rejects_parent_traversal(self):
        with tempfile.TemporaryDirectory() as root_name:
            root = Path(root_name)
            (root / "safe.py").write_text("pass")
            with self.assertRaises(ManifestError):
                validate_overlay(root, ["../safe.py"])

    def test_rejects_symlink(self):
        with tempfile.TemporaryDirectory() as root_name:
            root = Path(root_name)
            target = root / "real.py"
            target.write_text("pass")
            (root / "linked.py").symlink_to(target)
            with self.assertRaisesRegex(ManifestError, "symlinks"):
                validate_overlay(root, ["real.py", "linked.py"])


if __name__ == "__main__":
    unittest.main()
