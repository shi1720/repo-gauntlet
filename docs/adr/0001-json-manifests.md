# ADR 0001: Versioned JSON task manifests

Status: accepted

RepoGauntlet uses JSON rather than YAML for task manifests. The control plane can parse manifests without a third-party dependency, JSON Schema validation is direct, and command arrays cannot be confused with shell strings. The tradeoff is no comments inside manifests; rationale belongs in the issue and authoring documentation.

