import pathlib
import subprocess
import sys

mode = sys.argv[1]
test_file = pathlib.Path(".repogauntlet_grader") / f"{mode}.test.mjs"
result = subprocess.run(
    ["node", "--experimental-strip-types", "--test", str(test_file)],
    capture_output=True,
    text=True,
)
sys.stdout.write(result.stdout)
sys.stderr.write(result.stderr)
expected = 3 if mode == "public" else 2
if result.returncode != 0 or f"# pass {expected}" not in result.stdout:
    raise SystemExit(result.returncode or 65)
print(f"REPOGAUNTLET_PHASE_COMPLETE:{mode}_tests")
