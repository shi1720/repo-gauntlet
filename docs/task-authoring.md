# Task authoring guide

## Definition of done

A task is ready only when:

1. its issue states observable behavior and compatibility constraints;
2. the baseline builds, preserved behavior passes, and at least one fail-to-pass check fails;
3. a plausible incomplete mutant fails for a different or narrower reason;
4. the golden candidate passes every public, hidden, and quality gate;
5. three repeated golden runs have the same canonical digest;
6. candidate-editable paths exclude graders, manifests, generated reports, and reference solutions;
7. test commands use a grader-owned wrapper that validates the child harness's native completion summary before emitting the RepoGauntlet phase marker.

## Directory contract

```text
tasks/<language>/<slug>/
├── task.json
├── source/                 frozen baseline control
├── grader/                 public and hidden grader entrypoints
└── candidates/
    ├── mutant/             plausible incomplete solution
    └── golden/             reviewed reference solution
```

The baseline is always the untouched `source/` tree, so it cannot drift from a duplicate overlay. Every other candidate directory must contain exactly the paths declared by `candidate_paths`. Shared headers or fixtures remain in `source/`.

## Scoring guidance

Use a small number of behavioral dimensions. A useful default is 10 points for build, 25 for public behavior, 55 for hidden behavior, and 10 for executable quality constraints. Never award quality points to a candidate whose behavior fails. Avoid subjective source-string checks when a contract can be executed.

Performance tasks should verify semantic equivalence before efficiency. Prefer operation counts, allocation counts, maximum state size, or algorithmic invariants over a single wall-clock threshold. If timing matters, use warmups, repeated samples, a wide noise policy, and an informational rather than sole correctness gate.

## Authoring workflow

```bash
make doctor
PYTHONPATH=core python3 -m repogauntlet.cli list
PYTHONPATH=core python3 -m repogauntlet.cli validate TASK-ID
```

Inspect all three reports when calibration fails. A baseline that resolves means the test does not observe the issue. A mutant that resolves means the test is too narrow. A golden failure means the issue, implementation, or environment contract is inconsistent.

## Review checklist

- No test relies on host locale, timezone, current time, unordered map iteration, or network access.
- Randomized tests use `REPOGAUNTLET_SEED` and print enough information to reproduce a failure.
- The issue does not leak hidden assertion details or implementation filenames.
- Test output describes violated behavior without revealing hidden expected values unnecessarily.
- Commands are argv arrays with no shell interpolation.
- Candidate stdout alone must never authorize a passing phase.
- The golden solution is minimal, documented, and not mounted into a candidate interaction environment.
