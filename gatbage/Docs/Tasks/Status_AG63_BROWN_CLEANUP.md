# AG63 Brown Cleanup Status

Date: 2026-05-18

## Scope

Prompt: `AGENT_63_BROWN_CLEANUP_CONTRACT`

Goal: add a cheap, local brown-slime cleanup assignment using existing maintenance content, contract routing, surface marks, cleaning tools, and world events.

## Preflight

- [x] Extracted `AGENT_63_BROWN_CLEANUP_CONTRACT` XML block by id from `Docs/AgentPrompts/AGENT_63_BROWN_CLEANUP_CONTRACT.md`.
- [x] Read `README.md`.
- [x] Read `architecture.md`.
- [x] Read `desdoc.md` sections 16.1 and 17-19.
- [x] Read `src/data/contracts.ts`.
- [x] Read `src/systems/contracts.ts`.
- [x] Read `src/systems/quests.ts`.
- [x] Read `src/systems/events.ts`.
- [x] Read `src/gen/maintenance/content_manifest.ts`.
- [x] Read `src/gen/living/zone_content.ts`.
- [x] Created this status file.
- [x] Baseline `npm run typecheck`: failed because current `package.json` has no `typecheck` script.
- [x] Appended final report to `Docs/AgentLogs/LOG_AG63_BROWN_CLEANUP.md`.

## Implementation

- [x] Add bounded brown-slime maintenance room/corner with visible residue marks.
- [x] Add cleanup contract and target reward path.
- [x] Wire existing cleaning kit into generic cleanup-contract completion.
- [x] Publish completion through existing contract event with `cleanup_completed`, `slime`, and `brown_slime` tags.
- [x] Run final validation.

## Changes

- Added `src/gen/maintenance/brown_slime_cleanup.ts`, a small protected Maintenance room named `Сухой обход: коричневая слизь` with bounded brown residue marks, a cleaning kit, hygiene loot, and one local maintenance NPC.
- Registered the room through `src/gen/maintenance/content_manifest.ts`.
- Added `exp_maint_brown_slime_cleanup` in `src/data/contracts.ts`.
- Added `brown_slime_cleanup_act` in `src/data/items.ts` as the generated proof item for normal FETCH contract completion.
- Added `notifyCleanupToolUse()` in `src/systems/contracts.ts`; the existing `cleaning_kit` calls it after bounded surface cleaning.
- Added cleanup completion tags in `src/systems/quests.ts` and visible cleanup log wording in `src/systems/world_log.ts`.

## Validation

- `npm run typecheck`: blocked, missing script in current `package.json`.
- `npx tsc --noEmit`: blocked by pre-existing unrelated errors in `src/data/plot.ts`, `src/gen/maintenance/slime_sample_post.ts`, `src/systems/faction_events.ts`, and `src/systems/inventory.ts`.
- `npm run build`: passed.
- `npm run check`: blocked, missing script in current `package.json`.

## Baseline Command

```txt
npm run typecheck
npm error Missing script: "typecheck"
```
