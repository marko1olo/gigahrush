# Status AG100 Rat Bait Behavior

Prompt extracted: `AGENT_100_RAT_BAIT_BEHAVIOR` from `Docs/AgentPrompts/AGENT_100_RAT_BAIT_BEHAVIOR.md`.

## Required Context

- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.4 and 16.6.
- [x] Read `src/data/monster_ecology.ts`.
- [x] Read `src/systems/ai/monster.ts`.
- [x] Read `src/systems/ai/index.ts`.
- [x] Read `src/systems/inventory.ts`.
- [x] Read `src/systems/events.ts`.

## Baseline Validation

- `npm run typecheck`: blocked before edits. `package.json` in this checkout has no `typecheck` script.

## Implementation Checklist

- [x] Identify existing small monster kinds suitable for bait attraction.
- [x] Add bounded attraction check with radius, cooldown, candidate cap and explicit marker.
- [x] Let food/govnyak placement or use create temporary bait marker.
- [x] Add useful counterplay without broad AI rewrite.
- [x] Publish bait placed, attracted, consumed and expired events.
- [x] Add debug/test path and performance notes.
- [x] Run available validation.

## Notes

- Small-monster set: `KRYSNOZHKA`, `SBORKA`, `TVAR`, `POLZUN`.
- Debug path: existing debug command "Спавн предметов" can spawn all items; player can pick food/govnyak and drop/use it near small monsters.
- Performance notes: no item-drop scans. Active bait markers are capped at 8; each monster scans at most 8 bait candidates on its own cooldown. Food markers last 24 seconds, govnyak markers last 30 seconds, and combat inside 5 cells overrides bait.
- Pickup counterplay: if the player recovers the dropped item before a monster eats it, the bait marker is removed.

## Validation

- `npm run typecheck`: blocked before edits; missing script.
- `npx tsc --noEmit`: passed.
- `npx tsc -p tsconfig.test.json`: passed after adding current `uvBeamFx`/`uvBeamLen` defaults to `tests/helpers.ts`.
- `node --test .test-build/tests/monster-bait.test.js`: passed, 3 tests.
- `npm run check`: blocked; missing script.
- `npm run build`: passed.
- `git diff --check`: passed.
