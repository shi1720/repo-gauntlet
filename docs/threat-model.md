# Threat model

## Scope

The bundled local runner is for trusted task authors and CI calibration. It launches task commands as local child processes and therefore is **not** a security boundary for arbitrary third-party submissions.

## Protected assets

- host credentials, files, network, and process table;
- hidden tests and golden reference solutions;
- task manifests and scoring policy;
- availability of the evaluation service;
- integrity and attribution of reports.

## Implemented controls

- candidate path allowlist;
- rejection of absolute paths, `..`, symlinks, protected paths, and oversized overlays;
- argv execution with `shell=False`;
- fresh temporary workspace per evaluation phase;
- wall-clock timeouts, POSIX process-group termination, and bounded captured output;
- normalized seed, hash seed, locale, timezone, and source epoch;
- distinct candidate, timeout, build, and infrastructure outcomes;
- canonical digest over stable behavioral results.

## Required untrusted-execution boundary

A deployment that accepts untrusted patches must add a rootless OCI or microVM boundary with:

- no network, Docker socket, host PID namespace, or host mounts;
- non-root UID, read-only root filesystem, isolated writable workspace and `/tmp`;
- all Linux capabilities dropped, `no-new-privileges`, and the default seccomp profile;
- hard CPU, memory, PID, file-size, output, and wall-clock limits;
- prebuilt, digest-pinned toolchain images with dependencies installed before evaluation;
- hidden tests injected only after candidate interaction has ended;
- per-run workspace destruction and externally enforced cancellation.

Docker reduces risk but is not a VM. High-risk multi-tenant execution should use a stronger boundary such as a microVM and independent control-plane credentials.

## Known limitations

- Windows process termination does not currently provide the same descendant cleanup guarantee as POSIX process-group termination.
- Hidden tests are visible to code during the local grading process. They are unavailable during candidate generation, but not cryptographically secret from a malicious runtime.
- Report digests provide reproducibility checks, not authenticity. Signed provenance is future work.
- Memory and PID values in v1 manifests document the intended container policy; the trusted local runner enforces wall time only.
