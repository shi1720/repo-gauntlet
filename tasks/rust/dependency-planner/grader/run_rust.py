import pathlib
import subprocess
import sys

mode = sys.argv[1]
source = pathlib.Path(".repogauntlet_grader") / (mode + ".rs")
binary = pathlib.Path("grader-" + mode)
library = pathlib.Path("libcandidate.rlib")
subprocess.run(["rustc", "--crate-name", "planner", "--crate-type", "lib", "--edition", "2021", "src/lib.rs", "-o", str(library)], check=True)
subprocess.run(["rustc", "--edition", "2021", "--test", str(source), "--extern", f"planner={library}", "-o", str(binary)], check=True)
result = subprocess.run([str(binary.resolve()), "--test-threads=1"], capture_output=True, text=True)
sys.stdout.write(result.stdout); sys.stderr.write(result.stderr)
expected = 2 if mode == "public" else 3
if result.returncode != 0 or f"{expected} passed; 0 failed" not in result.stdout:
    raise SystemExit(result.returncode or 65)
print(f"REPOGAUNTLET_PHASE_COMPLETE:{mode}_tests")
