# Rationale_EXPANSION_SUBAGENTS

## Decision 1: Launch Documentation Workers, Not Code Workers

Problem: The worktree is already heavily modified by many agents. Letting ten new agents implement code simultaneously across shared systems would collide in `types.ts`, `debug.ts`, generators, data files, render files, and README.

Solution: Launch each worker against one expansion folder only. Their job is to create implementation packages, content manifests, and integration contracts. Source implementation remains a later batch with explicit source-file ownership.

Rejected Alternatives: Direct concurrent coding was rejected because it would create merge conflicts and broken build risk. One shared planning file was rejected because it would create edit contention and blur ownership.

Scalability potential: Documentation workers can prepare non-overlapping implementation packages. Future code workers can use those packages to split source ownership cleanly.

Hardware Impact: No runtime cost. Coordination prevents future hot-loop bloat by requiring each expansion to define Math LOD and integration boundaries before code.

## Decision 2: Respect Platform Thread Limit

Problem: The platform accepted six worker sessions and rejected four with `agent thread limit reached`.

Solution: Keep the first six running, wait for completions, then launch EXP07-EXP10 as slots free.

Rejected Alternatives: Retry storm was rejected because the limit is hard and repeated spawn failures waste time.

Scalability potential: Sequential waves preserve isolation while staying inside platform capacity.

Hardware Impact: No game runtime impact.

