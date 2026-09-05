# Changelog

## 0.1.4 — 2026-09-05

- Moved Python, Java, and C++ phase markers into grader-owned parent wrappers that validate the child harness transcript before authorizing success.
- Added a regression proving that a candidate cannot earn test points by printing both public markers and exiting before test execution.
- Clarified that wrapper completion evidence detects truncated harness runs but is not an unforgeable hostile-code attestation.

## 0.1.3 — 2026-09-05

- Promoted Vinext's base-path export into the GitHub Pages artifact root so the public workbench resolves at its canonical directory URL.
- Added fail-fast layout checks to the Pages packaging step.
- Derived phase progress scales from each task's calibrated scoring weights, eliminating overfilled bars when quality points are redistributed.

## 0.1.2 — 2026-09-05

- Corrected the Rust deep-graph fixture so it deterministically exercises a 50,000-node dependency chain on every platform.
- Updated every GitHub Actions dependency to the latest release and kept each action pinned to an immutable commit SHA.
- Made the public GitHub Pages workbench the primary portfolio demo.

## 0.1.1 — 2026-09-05

- Made the Rust negative control fail deterministically on the deep-graph contract.
- Fixed GCC portability for the C++ incomplete-solution control.
- Validated the Java environment through the first Linux polyglot CI run.

## 0.1.0 — 2026-09-05

- Added versioned task manifests, overlay firewall, normalized subprocess runner, canonical reports, and dependency-free CLI.
- Added calibrated Python, Java, Rust, C++, and TypeScript environments spanning bugs, features, refactoring, algorithms, and deterministic performance optimization.
- Added interactive report workbench with task browsing, replayed phase state, architecture, and methodology views.
- Added polyglot CI, schemas, authoring documentation, ADRs, and explicit threat model.
