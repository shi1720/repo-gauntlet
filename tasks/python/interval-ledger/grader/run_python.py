import pathlib
import re
import subprocess
import sys


mode = sys.argv[1]
test_file = pathlib.Path(".repogauntlet_grader") / f"{mode}_test.py"
result = subprocess.run(
    [sys.executable, str(test_file)],
    capture_output=True,
    text=True,
)
sys.stdout.write(result.stdout)
sys.stderr.write(result.stderr)

expected = 3
summary = re.compile(rf"Ran {expected} tests? in [0-9.]+s\s+OK\s*$")
if result.returncode != 0 or not summary.search(result.stderr):
    raise SystemExit(result.returncode or 65)

print(f"REPOGAUNTLET_PHASE_COMPLETE:{mode}_tests")

