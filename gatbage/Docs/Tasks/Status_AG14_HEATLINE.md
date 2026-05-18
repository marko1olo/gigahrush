# AG14 Heatline Zero Status

Updated: 2026-05-17 20:56 BST

## Scope

Prompt: `AGENT_14_HEATLINE_ZERO_HAZARDS`

Goal: add local heat/steam hazard gameplay to `MAINTENANCE` with static room state, timed-risk flavor, messages/quests, existing visuals, and no thermal/fluid simulation.

## Done

- Mandatory preflight read:
  - `README.md`
  - `architecture.md`
  - `Docs/Expansions/04_heatline_zero/expansion.md`
  - `src/gen/maintenance/content_helpers.ts`
  - `src/gen/maintenance/content_manifest.ts`
  - `src/systems/needs.ts`
  - `src/systems/events.ts`
  - `src/render/hud_fx.ts`
- Baseline `npm run build` passed before edits.
- Added `src/gen/maintenance/heatline_zero.ts`.
- Registered Heatline Zero in `src/gen/maintenance/content_manifest.ts`.
- Added static debug inspection through `src/systems/heatline.ts` and the existing debug balance/catalog command in `src/systems/debug.ts`.
- Updated `README.md` with shipped Heatline Zero facts and side quests.

## Gameplay Added

- A compact Heatline Zero maintenance pocket:
  - valve room
  - scorched shortcut corridor
  - repair box/storage
  - safe shower bypass
- Two NPCs:
  - Захар Нулевой
  - Мира Обводная
- Four side quests:
  - cool the zero valve with asbestos cord
  - fetch a manometer
  - visit the safe shower bypass
  - optional sabotage with fuel
- Local hazard pressure is represented through static room names, red lamps, pipe/metal/tile textures, water, burn marks, risky monsters, and loot placement.

## Performance Boundaries

- No per-frame scan.
- No cell heat field.
- No pressure graph tick.
- No new texture or cell enum.
- Debug status scans `world.rooms` only when the existing debug command is executed.

## Validation

- Baseline before edits: `npm run build` passed.
- Post-edit `npm run build` passed.
- Post-edit `npm run typecheck` was blocked by unrelated current-tree errors outside AG14 files.
- Final `npm run check` was run and stopped at `npm run typecheck`. Current blocking errors are outside AG14 files:
  - `src/data/dialogue.ts(79,59)` wrong argument count.
  - `src/gen/void/index.ts` duplicate `runVoidContent` import/identifier and wrong argument type.
  - `src/systems/containers.ts(269,34)` possible undefined inventory passed as `Item[]`.
  - `src/systems/rumor.ts` unused imports and unresolved rumor helper symbols.
