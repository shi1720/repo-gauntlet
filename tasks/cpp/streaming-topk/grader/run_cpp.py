import pathlib
import subprocess
import sys

mode=sys.argv[1]
source=pathlib.Path(".repogauntlet_grader")/(mode+".cpp")
binary=pathlib.Path("grader-"+mode)
subprocess.run(["c++","-std=c++17","-O2","-Wall","-Wextra","-Werror","-I.","topk.cpp",str(source),"-o",str(binary)],check=True)
result=subprocess.run([str(binary.resolve())],capture_output=True,text=True)
sys.stdout.write(result.stdout);sys.stderr.write(result.stderr)
expected=f"{mode} top-k contract passed"
if result.returncode != 0 or not any(line.startswith(expected) for line in result.stdout.splitlines()):
    raise SystemExit(result.returncode or 65)
print(f"REPOGAUNTLET_PHASE_COMPLETE:{mode}_tests")
