# AG29 Performance Telemetry / Smoke Rationale

## Decision 0 - Use Existing Gates First

Problem: The prompt asks for confidence guardrails, not blind optimization.

Solution: Preserve the existing command shape: `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run smoke`, and `npm run check`. Add checks into the current unit and smoke paths instead of adding a new framework.

Rejected Alternatives: Adding Playwright, a custom browser runner, or another test framework would violate the zero-dependency project shape and duplicate the existing CDP smoke.

Runtime Impact: None.

## Decision 1 - Static Data Checks Live In Unit Tests

Problem: Content-heavy growth can break ids silently: item ids, quest ids, contract ids, monster ecology rows, monster variants, resources, factories, containers, and floor catalog metadata.

Solution: Add `tests/data-ids.test.ts` using Node's built-in test runner. The test imports existing registries, verifies duplicate ids, and checks references to item, monster, monster variant, NPC, resource, rumor, and floor ids.

Rejected Alternatives: Regex-checking TypeScript source would be brittle, and generation-time assertions would move validation into runtime paths.

Runtime Impact: None.

## Decision 2 - Smoke Gets Blank WebGL Detection And Optional Timing

Problem: The existing smoke already checked HUD pixels and WebGL availability, but it only logged WebGL pixel samples.

Solution: Fail smoke if the WebGL readback sample is blank. Add optional `SMOKE_PERF_FRAMES=N` frame timing summary based on `requestAnimationFrame`; this logs avg/p95/max but does not assert a budget.

Rejected Alternatives: Timing assertions are flaky across CI, headless Chrome, SwiftShader, and local laptops. In-game counters would require editing `main.ts` and renderer call sites outside this prompt's write scope.

Runtime Impact: Default smoke runtime is unchanged except for one existing 32x32 WebGL sample now being asserted. Optional telemetry only runs when the environment variable is set.
