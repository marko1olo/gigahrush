# MONSTER_26_SBORKA_AUDIT Status

Status: complete

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_26_SBORKA_AUDIT">` from `Monster_26.md` with `awk`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `src/entities/sborka.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/monster_bait.ts`, and `src/systems/ai/monster.ts`.
- Baseline command: `npm run typecheck`
- Baseline result: exit 0

```text
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Audit Notes

- Current stats already match the trash band from `gatbage/monsters.md`: hp 10, speed 2.8, dmg 4.
- Shared ecology already marks SBORKA as common on all non-VOID floors, storage/corridor/common biased, bait-attracted, and backed by `cracked_sborka` / `fog_sborka` variants.
- Bait behavior is implemented generically through capped food/govnyak markers; no shared bait or AI diff is needed.

## Changes

- Added local `floors`, `counterplay`, `lootHint`, and `foodBait` metadata to `src/entities/sborka.ts`.
- Kept HP, speed, damage, attack rate, and shared ecology unchanged.
- Sharpened the sprite silhouette into a small jagged scrap-body with clear red eyes and thin limbs for better readability as fast weak pressure.

## Shared Diff Requests

None.

## Validation

- Post-change command: `npm run typecheck`
- Post-change result: exit 0

```text
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

- `npm run check`: not run; changes are limited to local entity metadata/sprite and docs, with no behavior/system/render/save integration change.
