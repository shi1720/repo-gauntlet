import json
from pathlib import Path

from jsonschema import Draft202012Validator

root = Path(__file__).resolve().parents[1]
task_schema = json.loads((root / "schemas" / "task.schema.json").read_text(encoding="utf-8"))
report_schema = json.loads((root / "schemas" / "report.schema.json").read_text(encoding="utf-8"))
task_validator = Draft202012Validator(task_schema)
report_validator = Draft202012Validator(report_schema)

task_paths = sorted((root / "tasks").glob("*/*/task.json"))
for path in task_paths:
    data = json.loads(path.read_text(encoding="utf-8"))
    task_validator.validate(data)
    if sum(data["scoring"].values()) != 100:
        raise ValueError("%s scoring does not total 100" % path)

report_paths = sorted((root / "reports").glob("**/*.json"))
for path in report_paths:
    report_validator.validate(json.loads(path.read_text(encoding="utf-8")))

print("validated %d task manifests and %d reports" % (len(task_paths), len(report_paths)))

