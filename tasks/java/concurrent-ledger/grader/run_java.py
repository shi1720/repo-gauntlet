import pathlib
import subprocess
import sys

grader = pathlib.Path(".repogauntlet_grader")
mode = sys.argv[1]
source = grader / ("PublicTest.java" if mode == "public" else "HiddenTest.java")
inputs = [str(source)]
if mode == "hidden":
    inputs.append(str(grader / "PublicTest.java"))
subprocess.run(["javac", "-cp", ".", "-d", "."] + inputs, check=True)
result = subprocess.run(
    ["java", "-ea", "-cp", ".", "PublicTest" if mode == "public" else "HiddenTest"],
    capture_output=True,
    text=True,
)
sys.stdout.write(result.stdout)
sys.stderr.write(result.stderr)
expected = f"{mode} ledger contract passed"
if result.returncode != 0 or expected not in result.stdout.splitlines():
    raise SystemExit(result.returncode or 65)
print(f"REPOGAUNTLET_PHASE_COMPLETE:{mode}_tests")
