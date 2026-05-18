# Status FLOOR18_GEOMETRY

Date: 2026-05-18
Prompt: `gatbage/Docs/DesignFloors/AgentPrompts/floor_18.md`

## Scope

- Added Hell-local macro geometry in `src/gen/hell/geometry.ts`.
- Wired `src/gen/hell/index.ts` to build arena-chain topology before population.
- Retuned Hell population caps and added finite reinforcement budgets.
- Kept changes out of core, renderer, route data, plot-chain rewrites and shared systems.
- Report is under `gatbage/Docs/...` because active README says not to recreate retired `Docs/Tasks` or `Docs/AgentLogs`.

## Macro Geometry

Hell now starts in a pale safe scar with immediate route choice, then branches into five arena chains. Each chain has an approach, a bounded threat pocket, a visible fallback loop and a ritual/reward room. Repeated motifs are meat tunnels, bone bridge over abyss, vent throats, cult barricades and safe scars. The outer exits are tied into a flee ring so major fights have ways out instead of pure dead ends.

## Approximate Counts

- Arena chains: 5.
- Ritual/reward rooms: 5.
- Cult barricade rooms: 1 dedicated barricade plus 1 barricade-themed ritual room.
- Lifts: 12, all 12 adjacent to reachable floor in the generation probe.
- Bone bridge abyss cells: 408.
- Safe-scar / bone-floor cells using concrete floor texture: 1790.
- Initial generated actors in the probe: 245 monsters, 123 cultist NPCs, 20 liquidator NPCs.
- Reinforcement budgets after initial population: 780 monsters, 180 cultists, 54 liquidators, then no endless refill.

## Validation

- `npm run check`: failed during `npm run typecheck` before tests/build because the already-modified `src/gen/design_floors/full_floor.ts` has unused declarations: `connectCenterChain`, `decorateGenericRoom`, `pickRoom`.
- `npm run test:unit`: passed, 65 tests.
- `npm run build`: passed.
- Hell generation probe via `npx tsx -e ...`: passed; spawn at `512.5,512.5`, 12 rooms, 12 reachable lift adjacencies.
