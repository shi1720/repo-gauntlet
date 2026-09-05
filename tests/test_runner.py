import unittest
import sys
import tempfile
from pathlib import Path

from repogauntlet.runner import Runner


ROOT = Path(__file__).resolve().parents[1]
TASK = ROOT / "tasks" / "python" / "interval-ledger"


class RunnerTests(unittest.TestCase):
    def test_baseline_fails_and_golden_resolves(self):
        runner = Runner(ROOT)
        baseline = runner.evaluate(TASK, "baseline")
        golden = runner.evaluate(TASK, "golden")
        self.assertEqual(baseline.verdict, "TEST_FAILED")
        self.assertEqual(golden.verdict, "RESOLVED")
        self.assertEqual(golden.score, 100.0)

    def test_report_digest_ignores_timing(self):
        report = Runner(ROOT).evaluate(TASK, "golden")
        first = report.canonical_digest()
        report.phases[0].duration_ms += 99_999
        self.assertEqual(report.canonical_digest(), first)

    def test_timeout_with_output_returns_clean_phase(self):
        runner = Runner(ROOT)
        with tempfile.TemporaryDirectory() as cwd:
            phase = runner._run_phase(
                "quality",
                [sys.executable, "-c", "import time; print('started', flush=True); time.sleep(5)"],
                Path(cwd),
                {"PATH": ""},
                1,
                10,
            )
        self.assertEqual(phase.status, "timeout")
        self.assertIn("started", phase.output)

    def test_successful_early_exit_without_completion_marker_fails(self):
        runner = Runner(ROOT)
        with tempfile.TemporaryDirectory() as cwd:
            phase = runner._run_phase(
                "public_tests",
                [sys.executable, "-c", "raise SystemExit(0)"],
                Path(cwd),
                {"PATH": ""},
                1,
                25,
            )
        self.assertEqual(phase.status, "failed")
        self.assertIn("missing trusted grader completion marker", phase.output)

    def test_unsafe_external_overlay_returns_patch_rejected(self):
        runner = Runner(ROOT)
        with tempfile.TemporaryDirectory() as overlay_name:
            overlay = Path(overlay_name)
            (overlay / "unexpected.py").write_text("pass")
            report = runner.evaluate(TASK, "external", overlay)
        self.assertEqual(report.verdict, "PATCH_REJECTED")
        self.assertEqual(report.score, 0)


if __name__ == "__main__":
    unittest.main()
