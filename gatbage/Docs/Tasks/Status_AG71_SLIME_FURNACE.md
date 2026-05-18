# AG71 Slime Furnace Status

## Preflight

- Prompt: `AGENT_71_SLIME_DEACTIVATION_FURNACE`.
- Read: `README.md`, `architecture.md`, `desdoc.md` sections 16.1 and 18.
- Read source: maintenance manifest, concentrate press, production, factories, resources, containers.
- Baseline `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.

## Implementation Notes

- Added `src/gen/maintenance/slime_deactivation_furnace.ts`.
- Registered the furnace in `src/gen/maintenance/content_manifest.ts`.
- Added `deactivated_residue` as the safe cleanup output item.
- Added `slime_deactivation_furnace` factory recipe:
  - consumes `slime_sample_brown` from the production container;
  - spends `fuel`, `tools`, and `labor`;
  - produces `deactivated_residue` and `gasmask_filter`;
  - publishes production events tagged `slime`, `deactivation_furnace`, `furnace_used`, and `deactivation_completed`.
- Extended production recipes with optional physical `inputItems` and `eventTags`.
- Production shortage events now include missing resource/item tags such as `fuel_missing`.
- Added data-id and production unit coverage for recipe input items and sample consumption.

## Validation

- Baseline `npm run typecheck`: failed before edits because `package.json` has no `typecheck` script.
- Requested `npm run check`: failed because `package.json` has no `check` script.
- `npx tsc --noEmit`: failed on pre-existing unrelated worktree errors in modules such as `entities/monster.ts`, `gen/procedural_floor.ts`, `systems/faction_events.ts`, `systems/quests.ts`, and others.
- `npm run build`: failed before reaching AG71 code on `src/gen/procedural_floor.ts` duplicate `roomCenter`.
- `git diff --check` on AG71-touched files: passed.
