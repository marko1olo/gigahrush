# AG63 Brown Cleanup Log

Date: 2026-05-18

## Scope

Implemented `AGENT_63_BROWN_CLEANUP_CONTRACT`: a cheap brown-slime cleanup assignment using existing Maintenance generation, contracts, the cleaning kit, surface marks, and contract completion events.

## Implementation

- Added `src/gen/maintenance/brown_slime_cleanup.ts`.
- Registered `generateBrownSlimeCleanup()` in `src/gen/maintenance/content_manifest.ts`.
- Added contract `exp_maint_brown_slime_cleanup` to `src/data/contracts.ts`.
- Added item `brown_slime_cleanup_act` to `src/data/items.ts`.
- Added generic `notifyCleanupToolUse()` in `src/systems/contracts.ts`.
- Hooked the existing `cleaning_kit` path in `src/main.ts` to notify active cleanup contracts after bounded surface cleaning.
- Added completion tag handling in `src/systems/quests.ts`: cleanup contracts publish `cleanup_completed`, `slime`, and `brown_slime` before tag truncation.
- Added visible world-log wording for cleanup completion in `src/systems/world_log.ts`.

## Play Path

1. Reach Maintenance.
2. Use debug action 12 or a system-quest NPC route to accept `exp_maint_brown_slime_cleanup`.
3. Find `Сухой обход: коричневая слизь`.
4. Equip `cleaning_kit` and hold `R` over the brown residue.
5. Cleaning grants `brown_slime_cleanup_act`; normal FETCH completion removes it and pays money, XP, water coupons, a gasmask filter, and citizen reputation.

## Validation

- Baseline `npm run typecheck`: failed because current `package.json` exposes only `dev`, `build`, and `preview`.
- `npx tsc --noEmit`: failed on unrelated pre-existing errors in `src/data/plot.ts`, `src/gen/maintenance/slime_sample_post.ts`, `src/systems/faction_events.ts`, and `src/systems/inventory.ts`.
- `npm run build`: passed.
- Required `npm run check`: failed because current `package.json` has no `check` script.

## Notes

No global slime hazard system, AI branch, or per-frame scan was added. Cleanup detection runs only when the player actively uses the existing cleaning tool.
