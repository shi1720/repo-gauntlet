# Contributing

Thank you for improving RepoGauntlet. Open an issue before a large change so its evaluation contract can be reviewed first.

1. Create a focused branch.
2. Run `make doctor` and the relevant task calibration.
3. Add negative-path tests for runner changes; add baseline, mutant, and golden controls for task changes.
4. Run `make test` when all optional toolchains are installed, otherwise run the available task plus `make test-core web-build`.
5. Explain observable behavior, determinism considerations, and threat-model changes in the pull request.

Do not submit tasks copied from active private hiring evaluations, leaked test suites, personal data, malware, or dependencies that require secrets to validate.

