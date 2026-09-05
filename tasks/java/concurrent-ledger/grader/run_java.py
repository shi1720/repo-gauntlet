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
subprocess.run(["java", "-ea", "-cp", ".", "PublicTest" if mode == "public" else "HiddenTest"], check=True)

