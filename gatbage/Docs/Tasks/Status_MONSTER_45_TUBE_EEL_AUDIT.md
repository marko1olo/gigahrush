# MONSTER_45_TUBE_EEL_AUDIT Status

Status: complete with external validation blocker

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_45_TUBE_EEL_AUDIT">` from `Monster_45.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `src/entities/tube_eel.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/systems/ai/monster.ts`, and `src/gen/maintenance/water_bridge.ts`.
- Baseline `npm run typecheck`: exit 0.

## Audit Notes

- `TUBE_EEL` already has local `aiFlags: ['waterStrider']` and is limited to `FloorLevel.MAINTENANCE`.
- The generic monster AI already gives it water advantage and dry weakness: current movement is `1.45x` on `Cell.WATER` and `0.72x` on dry cells.
- `src/gen/maintenance/water_bridge.ts` already places two eels in water lanes and gives the player dry bridge/edge routing as counterplay.
- Shared ecology already ties it to maintenance water rooms, `ecology_eel_water`, `manometer`, and `pipe`; shared files remained read-only.

## Changes

- Rebalanced local stats in `src/entities/tube_eel.ts`: hp `70 -> 60`, speed `1.6 -> 1.45`, damage `16 -> 14`, attack cooldown `1.2 -> 1.35`.
- Sharpened local counterplay text to explicitly teach leaving the water lane for a dry edge or bridge.
- Sharpened local loot hint toward rusty slime, manometer, and pipe debris.
- Added `tests/monster_45_tube_eel_audit.test.ts` to lock local water/dry identity metadata.

## Outside Scope Note

- Broader water-room cues may still need a render/generator pass outside this prompt: water lanes should visibly imply "fight from dry edge or bridge" where eels spawn.

## Validation

- Focused test: `npx tsx --test tests/monster_45_tube_eel_audit.test.ts` passed.
- Post-change `npm run typecheck`: failed outside owned scope because untracked `src/gen/void/perestanovshchik.ts` has unused locals:

```text
src/gen/void/perestanovshchik.ts(5,3): error TS6133: 'Cell' is declared but its value is never read.
src/gen/void/perestanovshchik.ts(31,7): error TS6133: 'TAGS' is declared but its value is never read.
```

- `npm run check`: not run because `npm run typecheck` is currently blocked by the unrelated untracked Void file.
