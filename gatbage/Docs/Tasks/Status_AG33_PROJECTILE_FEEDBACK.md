# AG33 Projectile Impact Feedback Status

Date: 2026-05-17

## Scope

Make ranged combat more readable through projectile sprite identity, bounded impact marks, short impact sounds, and player-facing hit feedback.

## Checklist

- [x] Extracted `AGENT_33_PROJECTILE_IMPACT_FEEDBACK` XML block by id from `Docs/AgentPrompts/AGENT_33_PROJECTILE_IMPACT_FEEDBACK.md`.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` P0.1/P0.2, `src/systems/ai/combat.ts`, `src/systems/ai/monster.ts`, `src/systems/inventory.ts`, `src/render/sprite_index.ts`, `src/render/sprites.ts`, `src/render/blood.ts`, `src/systems/audio.ts`, `src/data/weapons.ts`, `src/entities/monster.ts`.
- [x] Baseline `npm run build`: passed.
- [x] Audited projectile sprite assignments.
- [x] Added distinct hostile projectile sprites.
- [x] Added bounded impact feedback.
- [x] Updated sprite registry coverage.
- [x] Ran `npm run typecheck`: passed after current-tree strict TS cleanup.
- [ ] Ran `npm run check`: attempted; latest run blocked by concurrent `.test-build` writers.
- [x] Appended final report to `Docs/AgentLogs/LOG_AG33_PROJECTILE_FEEDBACK.md`.

## Projectile Audit

- Player physical weapons use `Spr.BULLET`, `Spr.PELLET`, `Spr.NAIL`, `Spr.GRENADE`, `Spr.GAUSS_BOLT`, `Spr.PLASMA_BOLT`, `Spr.BFG_BOLT`, and `Spr.FLAME_BOLT`.
- Player PSI projectile spells use `Spr.PSI_BOLT`.
- Ranged monsters auto-assign projectiles in `generateSprites()`: `EYE` uses `Spr.EYE_BOLT`, `ROBOT` uses plasma, and other ranged monsters use PSI.
- NPC ranged combat creates projectiles from equipped weapon data, so NPC bullets, pellets, nails, plasma, flame and grenade shots currently inherit the same data sprite as player weapons.

## Implementation Notes

- Added hostile variants for bullets, pellets, nails, PSI, plasma, and flame in the sprite atlas.
- NPC ranged combat now maps player weapon projectile sprites through `hostileProjectileSprite()`.
- Ranged monsters now auto-assign hostile PSI/plasma/flame sprites where appropriate; eye bolts remain distinct.
- Projectile floor/wall impacts now use bounded mark helpers: ballistic holes stay compact, PSI/plasma impacts leave energy/scorch marks, and flame leaves burn marks.
- Projectile impacts now emit short spatial impact cues; body hits use flesh or energy cues.
- Player projectile damage now writes a throttled HUD log line such as `ПСИ-удар: -10` or `Дробь: -8`.
- `tests/sprites-floors.test.ts` now verifies all projectile sprites, including hostile variants, are inside `Spr.TOTAL` and nonblank.

## Validation Notes

- Baseline `npm run build`: passed before AG33 edits.
- `npm run typecheck`: passed.
- `npm run check`: attempted repeatedly. Current shared workspace has concurrent test runners writing `.test-build`; latest exact failure was `rm: .test-build: Directory not empty` during `npm run test:unit`.
- While unblocking validation, small unrelated strict-TypeScript fixes were needed in `src/render/map_ui.ts`, `src/gen/ministry/document_gate.ts`, `src/systems/void_protocols.ts`, `src/data/void_protocols.ts`, and `src/systems/quests.ts`.
