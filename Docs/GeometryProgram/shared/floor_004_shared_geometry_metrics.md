# Shared Tool: Geometry Metrics

Purpose: generic metrics for floor safety and geometry quality.

Recommended module:

- `src/gen/geometry_metrics.ts`

Metrics:

- reachable ratio
- spawn-to-up/down lift path length
- non-sealed room reachability
- ordinary choke severity
- loop count on coarse graph
- path entropy
- LOS p95/p99
- density bucket max
- protected-cell mutation count
- torus seam sanity
- generation time descriptor

API requirements:

- Read-only over `World` unless explicitly named as repair.
- Accept optional anchors and protected masks.
- Return compact descriptor objects.
- Do not allocate object-per-cell structures in hot loops.

Tests:

- synthetic tiny world
- one forced procedural spec
- one design floor if cheap

Consumers:

- story/design floor agents
- procedural geometry agents
- anomaly agents
- orchestrator validation
