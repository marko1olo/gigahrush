# MONSTER_27_TVAR_AUDIT Final Report

Date: 2026-05-18

## Summary

Audited existing `TVAR` / `Тварь` as the common medium melee yardstick. TVAR remains between SBORKA and POLZUN:

- SBORKA: hp 10, speed 2.8, dmg 4, attackRate 0.8.
- TVAR: hp 60, speed 1.8, dmg 12, attackRate 1.2.
- POLZUN: hp 150, speed 1.0, dmg 18, attackRate 2.0.

No stat rebalance was needed. The gap was local readability: older `tvar.ts` did not carry the local `counterplay`/`lootHint`/floor metadata pattern used by newer monster definitions.

## Code Changes

- `src/entities/tvar.ts`
  - Added `FloorLevel` import and local `floors`.
  - Added `aiFlags: ['foodBait']` metadata.
  - Added Russian counterplay: hold medium distance, avoid wall pressure, bait with food/govnyak if needed.
  - Added loot hint for organic waste, concrete crumbs, and rare raw meat.
  - Added local sprite cues: panel scars, wall-scraping forelimbs, thicker eye pixels.

## Scope Notes

- Shared tables were read but not edited: `monster_ecology.ts`, `monster_variants.ts`.
- Broad AI and bait systems were read but not edited.
- No new AI branch, RPG scaling change, spawn table change, or variant change was introduced.

## Validation

Baseline `npm run typecheck`: exit 0.

Final `npm run typecheck`: exit 0.

`npm run build`: exit 0.

First `npm run smoke` before rebuilding `dist/`: exit 1 at `inventory panel`, with debug state `showInventory:false`.

After rebuilding, `npm run smoke`: exit 0.
