import pathlib
import subprocess
import sys

mode=sys.argv[1]
source=pathlib.Path(".repogauntlet_grader")/(mode+".cpp")
binary=pathlib.Path("grader-"+mode)
subprocess.run(["c++","-std=c++17","-O2","-Wall","-Wextra","-Werror","-I.","topk.cpp",str(source),"-o",str(binary)],check=True)
subprocess.run([str(binary.resolve())],check=True)

