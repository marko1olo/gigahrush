# MONSTER_48_KRYSNOZHKA_AUDIT Status

Status: complete

## Preflight

- Extracted `<AGENT_PROMPT id="MONSTER_48_KRYSNOZHKA_AUDIT">` from `Monster_48.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, and `AGENTS.md`.
- Read required source: `src/entities/krysnozhka.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/monster_bait.ts`, and `tests/monster-bait.test.ts`.
- Baseline command: `npm run typecheck`
- Baseline result: exit 0

```text
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

## Audit Notes

- Current stats fit the trash/swarm pressure band from `gatbage/monsters.md`: hp 14, speed 2.45, dmg 3.
- Shared ecology already limits Крысоножка to `KVARTIRY`, `LIVING`, and `MAINTENANCE` kitchen/storage/corridor/common contexts with low spawn weight and the `garbage_krysnozhka` variant.
- Bait behavior is already generic and capped through food/govnyak markers; `tests/monster-bait.test.ts` verifies `KRYSNOZHKA` is bait-attracted and that bait markers expire under the active cap.
- No reproduction, swarm count, shared bait, ecology, variant, AI, or spawn-table change is needed for this audit.

## Changes

- Sharpened local `counterplay` in `src/entities/krysnozhka.ts` around low HP, shotgun stagger, explicit food/govnyak bait, sticky trap routing, and sealed-container discipline.
- Sharpened local `lootHint` toward garbage-nest remains while keeping rare raw meat consistent with shared ecology.
- Kept HP, speed, damage, attack rate, floors, `foodBait`, sprite, shared ecology, and variants unchanged.

## Shared Diff Requests

None.

## Validation

- Post-change command: `npm run typecheck`
- Post-change result: exit 0

```text
> gigahrush@1.0.0 typecheck
> tsc --noEmit
```

- `npm run check`: not run; this audit is scoped to local entity metadata and docs, with no behavior/system/render/save integration change.
