# Addmonster 43: Remove Mechanical Subspecies

## Rule

No mechanical variants, no derived monsters, no universal subtype modifier layer.

Lore may call creatures relatives, subspecies, strains, or local names. Code must still implement each monster as a standalone package with its own `MonsterKind`, definition, sprite path, ecology, rumors, events, AI hook, and tests when needed.

## Current Problem

`src/data/monster_variants.ts` is a generic modifier registry. It lets one record change display prefix, HP, speed, damage, sprite cues, rumors, loot, and spawn choice across unrelated systems.

That contradicts the game's modular content rule: meaningful monsters should be reachable, readable, and owned by a bounded package, not hidden behind `monsterVariantId`.

## Remove

- Delete `src/data/monster_variants.ts`.
- Remove `Entity.monsterVariantId?: string` from `src/core/types.ts`.
- Remove `applyMonsterVariant`, `applyMonsterVariantDef`, `applyMonsterVariantById`, `chooseMonsterVariant`, `variantsForKind`, and `monsterVariantRumorIds`.
- Remove prefix naming from `entityDisplayName`.
- Remove old registry cue marks from `src/entities/procedural_visuals.ts`.
- Remove variant loot helpers from `src/main.ts`.
- Remove `MonsterEcologyDef.variants` and `ecologyVariants` event data.
- Remove event/log payloads keyed by `monsterVariantId`.

Keep `monsterDmgMult` only if it is still used by authored non-subspecies systems; the agent audit found it is not purely tied to the old registry.

## Convert Direct Special Cases First

- `src/gen/maintenance/betonoed_shortcut.ts`: spawn `MonsterKind.BETONOED`; replace `forceBetonoedVariant` with local `tuneBetonoedMonster`; publish `system: betonoed_shortcut`.
- `src/gen/maintenance/black_slime_eyes.ts`: spawn `MonsterKind.CHERNOSLIZ`.
- `src/gen/maintenance/chernaya_lichinka.ts`: replace local `monsterVariantId` with named encounter tags/state.
- `src/gen/ministry/matka_dokumentov.ts`: replace local id with named encounter tags/state.
- Zombie apocalypse conversion code should stop clearing `monsterVariantId` once the field is gone.

## Convert Generic Spawns

All generic `applyMonsterVariant(...)` calls become no-ops or explicit monster-kind selection.

Files identified by audit include procedural floor spawns, samosbor/director spawns, debug/map-editor spawns, emergency panels, hermodoor borer, hell/living/kvartiry/maintenance/ministry authored generators, and design-floor generators.

Policy:

- Generic spawns create one concrete `MonsterKind`.
- If a floor wants a special monster, its ecology/floor selection chooses that monster directly.
- If an authored POI wants unique behavior, it owns a named content module or spawns a named monster kind.

## Convert Visuals

- `generateProceduralMonsterSprite(kind, seed)` should not accept a subtype id.
- Standalone monsters own their cue marks in their own sprite modules or kind-specific sprite switch.
- Seeded visual variation is allowed; it must be cosmetic and local, not a gameplay subtype layer.

## Convert Loot And Rumors

- Remove generic variant loot.
- Give drops to monster definitions or authored encounters.
- Rewrite `variant_*` rumors into normal monster rumor ids only for real standalone monsters.
- `world_log` must key special text by `monsterKind`, `tags`, or `system`, not by old ids.

## Save And Docs

- Bump save shape or explicitly invalidate stale saves. The project is early development, so no legacy compatibility path is required.
- Update `README.md` counts: remove `Monster modifier variants | 23`; standalone monster count increases only when the new packages are implemented.
- Update `architecture.md` to remove `src/data/monster_variants.ts` and any "monster variant pack" language.

## Tests

- Update `tests/monster_00_base_registry_audit.test.ts` to remove old registry assertions.
- Update `tests/content-registry.test.ts` to remove `MONSTER_VARIANTS` uniqueness and ecology checks.
- Update `tests/data-ids.test.ts` to remove variant id validation.
- Add focused tests for the new standalone monsters when their AI hooks are implemented.
- Run `npm run check` after runtime removal; this touches systems, generation, events, save shape, docs, and tests.

## Done

- `rg "monsterVariantId|MONSTER_VARIANTS|applyMonsterVariant|chooseMonsterVariant|variantsForKind|variant_" src tests README.md architecture.md` returns no mechanical subtype references.
- Former entries 20 through 42 exist as direct monster plans or implemented monster packages.
- No player-facing behavior depends on an invisible modifier registry.

## Agent Orchestration

- Serial owner: one GPT-5.5 integration/migration worker handles this file after the parallel monster workers are merged or intentionally staged.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, every completed `addmonster_20.md` through `addmonster_42.md`, then this file.
- Write scope: remove the mechanical subtype layer, consolidate shared registries, update docs/tests/save shape, and preserve every standalone monster package already added by other agents.
- Shared files: this worker is allowed to touch broad shared files, but must not delete another worker's new `MonsterKind`, sprite module, ecology entry, rumor, authored POI, or test.
- Forbidden: compatibility shims that keep `monsterVariantId`, hidden prefix systems, or a renamed universal subtype registry.
- Final report: deleted APIs/files, migrated direct special cases, updated tests/docs, `rg` proof for removed subtype references, `npm run check` result, and any unresolved merge conflicts.
