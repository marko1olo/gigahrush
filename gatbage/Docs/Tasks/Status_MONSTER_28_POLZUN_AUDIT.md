# Status MONSTER_28_POLZUN_AUDIT

Date: 2026-05-18

## Scope

Owned files touched:

- `src/entities/polzun.ts`
- `tests/monster_28_polzun_audit.test.ts`
- `Docs/Tasks/Status_MONSTER_28_POLZUN_AUDIT.md`
- `Docs/AgentLogs/LOG_MONSTER_28_POLZUN_AUDIT.md`

Shared files audited read-only:

- `src/entities/monster.ts`
- `src/data/monster_ecology.ts`
- `src/data/monster_variants.ts`
- `src/systems/ai/monster.ts`
- `src/systems/monster_bait.ts`

## Findings

- Polzun stats already match the heavy band from `gatbage/monsters.md`: hp 150, speed 1.0, damage 18, attack cadence 2.0.
- Existing ecology already places Polzun on `LIVING`, `MAINTENANCE`, and `HELL`, with corridor, bathroom, production, and storage identity.
- Existing variants already cover `wet_polzun` and `silent_polzun`; no shared variant edit was needed under this prompt's read-only contract.
- Existing bait system already attracts `POLZUN` through food/govnyak markers with capped scans.

## Changes

- Added local `floors`, `aiFlags`, `counterplay`, and `lootHint` metadata to `src/entities/polzun.ts`.
- Preserved heavy-threat numbers; speed was not raised.
- Reworked the procedural sprite silhouette to be flatter, wider, lower, and visibly crawling with floor smear and dragging limbs.
- Added a focused audit test covering heavy-band stats, local counterplay metadata, bait flag, floor identity, and low crawler sprite shape.

## Desired Shared Follow-Up

No shared ecology, variant, or AI change is required for this audit. If a future integrator owns shared AI, the only useful follow-up would be a generic narrow-passage or water-floor movement/damage hook that benefits multiple monsters, not a Polzun-only branch.

## Verification

- Baseline `npm run typecheck`: pass.
- Post-change `npm run typecheck`: pass.
- `npx tsx --test tests/monster_28_polzun_audit.test.ts`: pass.
- `npm run test:unit`: pass.
