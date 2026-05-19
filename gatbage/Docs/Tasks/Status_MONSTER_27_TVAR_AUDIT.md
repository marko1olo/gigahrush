# MONSTER_27_TVAR_AUDIT Status

Date: 2026-05-18
Status: complete

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_27_TVAR_AUDIT">` from `Monster_27.md` with `perl -0ne`.
- Read required docs: `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read required source: `src/entities/tvar.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`, `src/systems/monster_bait.ts`.
- Read comparison monsters: `src/entities/sborka.ts`, `src/entities/polzun.ts`.
- Baseline `npm run typecheck`: exit 0. Output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Audit Notes

- SBORKA: hp 10, speed 2.8, dmg 4, attackRate 0.8. Fast trash/ammo pressure.
- TVAR before change: hp 60, speed 1.8, dmg 12, attackRate 1.2. Fits common medium melee band.
- POLZUN: hp 150, speed 1.0, dmg 18, attackRate 2.0. Slow heavy doorway pressure.
- Shared ecology already gives TVAR floors, variants, wall-edge counterplay, bait attraction, and raw meat loot hint.
- Local `tvar.ts` lacked `counterplay`, `lootHint`, `floors`, and bait metadata present on newer readable monster definitions.

## Changes Planned

- Keep TVAR stats unchanged.
- Add local Russian counterplay and loot hint to match the existing `MonsterDef` pattern.
- Add local floor metadata and `foodBait` metadata without touching shared tables.
- Add a small local sprite cue for panel scars/wall-scraping limbs; no AI branch.

## Completed Changes

- Updated `src/entities/tvar.ts`.
- Stats unchanged: hp 60, speed 1.8, dmg 12, attackRate 1.2.
- Added local metadata: floors, `foodBait`, counterplay, loot hint.
- Added local sprite readability cues: panel scars, wall-scraping forelimbs, thicker green eye pixels.
- Did not edit shared ecology, variants, RPG, broad AI, or generator tables.

## Validation

- Final `npm run typecheck`: exit 0. Output:

```txt
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

- `npm run build`: exit 0. Key output:

```txt
✓ 309 modules transformed.
dist/index.html  2,302.86 kB │ gzip: 686.67 kB
✓ built in 2.96s
```

- First `npm run smoke` before rebuilding `dist/`: exit 1 at `inventory panel`, with debug state still `showInventory:false`.
- After `npm run build`, `npm run smoke`: exit 0. Pass line:

```txt
Smoke playability passed at http://127.0.0.1:57310/?smoke=1; expedition=off; thirdWave=off; hudLit=6196, hudCenterLit=128, sceneLit=202144
```

## Shared Follow-Up Notes

- No shared ecology, variant, RPG, or AI changes are required for this pass.
