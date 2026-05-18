# LOG_AG77_EXTERNAL_CELL_NEIGHBOR

## Final Report

Implemented AG77 as one additive Living content module plus a manifest import.

`src/gen/living/external_cell_neighbor.ts` creates `Квартира тихой соседки` in Living zone HUD 57. The room is domestic rather than ritualized: bed, stove, table, route papers, a hidden galosh box, and a small black-hand mark partly disguised by normal apartment clutter. It is protected with `aptMask` through `protectRoom()` and connected back to the volatile corridor network with a door and corridor.

The recruiter is `Нина Павловна`, presented as a normal citizen neighbor. Her dialogue offers socially plausible route information and deniable pressure rather than cult magic or arena escalation.

Registered side-quest outcomes:

- `ag77_expose_external_cell`: report the address to Barni/liquidators.
- `ag77_use_route_rumor`: use the route as an informant lead.
- `ag77_accept_quiet_signal`: accept the quiet external-cell signal.
- `ag77_keep_neighbor_quiet`: ignore/bargain and leave her as a neighborly rumor source.

The module observes completed AG77 side quests and publishes outcome events using existing `faction_relation_changed` events tagged with `ag77_external_cell_outcome`, `external_cell`, `chernobog`, and the specific outcome tag: `exposed`, `used_as_informant`, `recruited`, or `ignored`.

Validation:

- Baseline `npm run typecheck`: failed because the script is missing.
- `npm run check`: failed because the script is missing.
- `npx tsc --noEmit`: blocked by pre-existing/out-of-scope project errors; AG77-specific diagnostic filter returned no matches.
- Targeted module bundle with esbuild: passed with an unrelated duplicate-case warning in `src/systems/rumor.ts`.
- `npm run build`: blocked by pre-existing duplicate `roomCenter` in `src/gen/procedural_floor.ts`.
- `git diff --check` on touched AG77 files: passed.
