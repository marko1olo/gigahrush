# AG77 External Cell Neighbor Status

## Preflight

- Prompt XML block extracted: `AGENT_77_EXTERNAL_CELL_NEIGHBOR`.
- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` section 16.2.
- Read required files: `src/gen/living/zone_content.ts`, `src/gen/living/content_manifest.ts`, `src/data/plot.ts`, `src/data/dialogue.ts`, `src/systems/events.ts`, `src/systems/factions.ts`.
- Baseline `npm run typecheck`: failed before code edits because `package.json` has no `typecheck` script.

## Implementation

- Added `src/gen/living/external_cell_neighbor.ts`.
- Registered it from `src/gen/living/content_manifest.ts`.
- POI: `Квартира тихой соседки`, Living zone HUD 57.
- Recruiter NPC: `Нина Павловна`, visually and factionally a citizen neighbor, with subtle route/cell dialogue.
- Room protection: stamped as a protected Living POI with `protectRoom()`, `aptMask`, a door, and a corridor connection.
- Material hooks: black-hand wall mark, route note drop, owner cabinet with route papers, secret galosh box with key label/coupons/cigarettes.
- Outcomes are published via a content-owned `registerWorldEventObserver()` watching AG77 side-quest completions:
  - `ag77_expose_external_cell`: report to Barni/liquidators, tags include `exposed`.
  - `ag77_use_route_rumor`: use the lower-route rumor, tags include `used_as_informant`.
  - `ag77_accept_quiet_signal`: accept the quiet cell signal, tags include `recruited`.
  - `ag77_keep_neighbor_quiet`: bargain/ignore as a neighbor issue, tags include `ignored` and `bargain`.
- Outcome events use existing `faction_relation_changed` events with `ag77_external_cell_outcome` tags and explicit player-faction relation deltas.

## Reachability

- Normal path: start or travel to `FloorLevel.LIVING`; find Living zone HUD 57 and enter `Квартира тихой соседки`.
- Debug path: existing debug story-floor teleport to Living, then use map/zone HUD to navigate to zone 57. Generation log line starts with `[AG77]`.

## Validation

- `npm run typecheck`: failed, missing script in `package.json`.
- `npm run check`: failed, missing script in `package.json`.
- `npx tsc --noEmit`: failed on pre-existing/out-of-scope errors in files such as `src/entities/krysnozhka.ts`, `src/entities/monster.ts`, `src/gen/procedural_floor.ts`, `src/main.ts`, `src/systems/contracts.ts`, `src/systems/faction_events.ts`, `src/systems/inventory.ts`, and `src/systems/samosbor.ts`.
- AG77 diagnostic filter: `npx tsc --noEmit --pretty false 2>&1 | rg "external_cell_neighbor|content_manifest" || true` produced no AG77-specific diagnostics.
- `npx esbuild src/gen/living/external_cell_neighbor.ts --bundle --format=esm --outfile=/tmp/ag77_external_cell_neighbor.js`: passed with an unrelated duplicate-case warning in `src/systems/rumor.ts`.
- `npm run build`: failed before reaching AG77 on pre-existing `src/gen/procedural_floor.ts` duplicate symbol `roomCenter`.
- `git diff --check -- src/gen/living/external_cell_neighbor.ts src/gen/living/content_manifest.ts`: passed.
