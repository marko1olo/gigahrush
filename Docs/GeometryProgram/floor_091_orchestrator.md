# Geometry Program Orchestrator

Role: integrator after modular floor/profile/anomaly/candidate agents finish.

Goal: verify, merge and connect geometry work without breaking shipped route, save/load, A-Life, samosbor, rendering or procedural generation.

## Integration Result 2026-05-30

The Geometry Program pass has been reconciled against `floor_000_index.md` and current source registries.

- Story coverage: 6 indexed story floors match the 6 `FloorLevel` story anchors; no story anchor is missing from the route.
- Shared coverage: all 8 indexed shared packets exist.
- Design-floor coverage: 41 indexed route floor ids have `src/data/design_floors.ts` entries, unique `z` values, generator files under `src/gen/design_floors/`, manifest registration and test mentions.
- Candidate classification: 21 candidate ids are routed design floors; `sandpile_perekrytie` is the remaining candidate and is implemented as a procedural anomaly.
- Procedural coverage: 10 geometry profiles, 5 majority profiles and 20 anomaly defs match the indexed packets plus `sandpile_perekrytie`.
- Route coverage: the current `FloorRun` span resolves to 47 authored/story stops and 54 procedural/fallback route floors.

Final validation passed: `npm run typecheck`, `npm run test:unit`, `npm run test:generation`, `npm run content:audit`, `npm run check` and `npm run smoke`.

## Read First

- `README.md`
- `architecture.md`
- `../../floors.md`
- [floor_000_index.md](floor_000_index.md)
- [floor_001_shared_agent_contract.md](shared/floor_001_shared_agent_contract.md)
- [floor_002_shared_route_registration.md](shared/floor_002_shared_route_registration.md)
- [floor_008_shared_runtime_topology.md](shared/floor_008_shared_runtime_topology.md)
- [floor_003_shared_validation_matrix.md](shared/floor_003_shared_validation_matrix.md)
- every changed modular packet
- every changed source file
- `git status --short`

## Merge Policy

- Do not revert unrelated dirty work.
- Shared helpers land before floor implementations that depend on them.
- Existing-floor improvements must be obviously safer/better than current behavior.
- New ids must have generator, registration and tests in the same integration.
- No new `FloorLevel`.
- No content-specific logic in `main.ts`, `core/world.ts`, broad AI or renderer.
- No ordinary NPC refill.
- README updates only after shipped, validated behavior exists.

## Intake Checklist Per Agent Patch

1. Which modular packet file did the agent own?
2. Which files changed?
3. Which ids changed or were added?
4. Is there a reachable gameplay path?
5. Are spawn, lifts, protected cells and route anchors preserved?
6. Does A-Life/population behavior remain compliant?
7. Does runtime mutation, if any, have dirty flags and cache invalidation?
8. Does save/load need a shape bump?
9. Are focused tests present?
10. Are generated artifacts absent?

Return for revision if:

- route/profile/anomaly data is dead
- generator cannot be forced
- tests are missing for a new id
- runtime code scans the full world per frame
- save shape changed without sanitizer/caps/version plan
- killed ordinary NPCs can be silently replaced
- protected floor cells can be deleted

## Merge Order

1. Shared tooling:
   - `shared_geometry_metrics`
   - `shared_proxy_grid`
   - `shared_maze_graph`
   - `shared_decision_triangles`
2. Existing story floors.
3. Existing shipped design floors.
4. Procedural geometry profiles.
5. Majority/population field changes.
6. Static/generation-time anomalies.
7. Runtime/topology anomalies.
8. Required first-wave candidates.
9. Other candidate floors.
10. Docs/source-of-truth updates.

## Consistency Checks

Design floors:

- `src/data/design_floors.ts` includes id, z, display name, base floor, role and danger.
- `src/gen/design_floors/<id>.ts` exports generator.
- `src/gen/design_floors/manifest.ts` registers id.
- Population profile exists or no broad ordinary NPC field is intentional.
- Generator can be forced by test or debug path.

Procedural geometry:

- `FloorGeometryId` union includes id.
- `FLOOR_GEOMETRIES` includes def.
- Generator branch/module uses id.
- Loot/monster tags are meaningful.
- Forced-spec test uses `anomalyId: 'none'`.

Majority profiles:

- spatial imprint changes are generation-time.
- no refill logic.
- placement respects caps/buckets.
- A-Life materialization remains owner of ordinary identity.

Anomalies:

- `FloorAnomalyId` union includes id.
- `FLOOR_ANOMALIES` includes def.
- generator branch/module applies effect.
- runtime hook exists only if needed.
- event tags/data updated when public facts matter.
- stress tests cover topology mutation.

Runtime topology:

- cadence, arena size and caps are explicit.
- dirty versions change after mutation.
- caches rebuild after floor transition/load.
- route anchors are protected.

## Validation Sequence

Minimum for any code integration:

```bash
npm run typecheck
npm run test:unit
npm run test:generation
npm run content:audit
```

Default:

```bash
npm run check
```

Browser/render/visibility/rail/light/HUD/input:

```bash
npm run check:browser
```

Full high-risk integration:

```bash
npm run check:full
```

Docs-only:

```bash
git diff --check
```

## Manual Verification Matrix

For each changed story/design/new floor:

- force generate / debug enter
- spawn passable
- up/down lift rules correct
- three promised decisions reachable
- non-sealed rooms reachable
- no ordinary choke isolates both lifts
- route cues visible
- population caps respected
- samosbor tested or exempt

For each changed procedural geometry/anomaly:

- forced spec with stable seed
- baseline with `anomalyId: 'none'` if geometry changed
- topology stress case if cells move/delete/open
- floor reachable after anomaly generation
- runtime caches rebuild after transition
- dirty versions update after mutation

## Final Documentation Rules

Update after implementation only:

- `README.md` for shipped facts/counts.
- `Docs/DesignFloors/INDEX.md` if new route floors ship.
- `Docs/ProceduralFloors/geometry.md` if geometry profile ids/contracts change.
- `Docs/ProceduralFloors/anomaly.md` if anomaly ids/contracts change.
- `../../floors.md` only if the central floor-system contract changes materially; archived root `geometry.md` lives in `../../gatbage/geometry.md` for historical comparison.
- the specific modular packet if its status changes from candidate to implemented.

Do not leave progress only in chat.

## Final Report Template

```txt
Changed:
- files
- ids added/changed
- floors/profiles/anomalies affected

Behavior:
- new reachable gameplay path
- geometry decision added
- samosbor/anomaly interaction

Safety:
- protected cells
- A-Life/population
- save/load
- dirty flags/cache

Validation:
- commands run
- failures fixed
- skipped checks with exact reason
```
