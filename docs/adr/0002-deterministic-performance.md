# ADR 0002: Deterministic performance gates

Status: accepted

The C++ reference task grades semantics and grader-observed value comparisons. Wall-clock data is recorded but cannot independently fail a candidate. Shared CI hosts and laptop power states make narrow time thresholds flaky; an executable complexity proxy tests the intended algorithm more reliably.
