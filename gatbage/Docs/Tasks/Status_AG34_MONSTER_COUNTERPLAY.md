# AG34 Monster Counterplay Status

Prompt: `AGENT_34_MONSTER_COUNTERPLAY_AUDIT`
Date: 2026-05-17

## Preflight

- [x] Extracted prompt XML block by id.
- [x] Read `README.md`, `architecture.md`, `desdoc.md` P0.2, monster core/data/entity files, rumors, and events.
- [x] Baseline `npm run typecheck` passed before edits.

## 22-Monster Checklist

- [x] `SBORKA` - all non-void floors; corridor/common/storage swarm rule; rumor ids resolve.
- [x] `TVAR` - civil/deep living corridors; wall-distance rule; rumor ids resolve.
- [x] `POLZUN` - living/maintenance/hell wet and storage routes; doorway/straight-retreat rule; rumor ids resolve.
- [x] `BETONNIK` - rare heavy concrete threat outside Kvartiry; corner/stamina rule; rumor ids resolve.
- [x] `ZOMBIE` - non-void neighbor threat in living/kitchen/common/office; isolate-from-crowd rule; rumor ids resolve.
- [x] `EYE` - ranged line-of-fire enemy across active combat floors; break-line-and-close rule; rumor ids resolve.
- [x] `NIGHTMARE` - rare pressure enemy on civil/deep/void floors; fast burst-or-flee rule; rumor coverage now matches ecology floors.
- [x] `SHADOW` - ambush/darkness threat including Kvartiry; move-and-keep-distance rule; rumor coverage now matches ecology floors.
- [x] `REBAR` - production/storage iron threat; avoid-flat-iron and weapon-distance rule; rumor ids resolve.
- [x] `MATKA` - rare spawner on maintenance/hell/void; kill-or-clear decision rule; rumor ids resolve.
- [x] `IDOL` - static ranged monolith in storage/office/HQ; angle-or-rush rule; rumor ids resolve.
- [x] `MANCOBUS` - maintenance/hell controller boss; clear-guards and corner rule; rumor ids resolve.
- [x] `HERALD` - hell ranged watcher; cover rule; rumor ids resolve.
- [x] `CREATOR` - void final boss; resource/cover rule; rumor ids resolve.
- [x] `SPIRIT` - phasing rare threat; reposition rule; rumor ids resolve.
- [x] `ROBOT` - ministry/maintenance ranged machine; dodge-volley rule; rumor ids resolve.
- [x] `SHOVNIK` - civil seam hunter; center-room rule; rumor ids resolve.
- [x] `LAMPOVY` - civil/maintenance light-fed threat; leave-lamps rule; rumor ids resolve.
- [x] `PECHATEED` - civil document hunter; dump-paper or kite rule; rumor ids resolve.
- [x] `TUBE_EEL` - maintenance water ambusher; leave-water rule; rumor ids resolve.
- [x] `PARAGRAPH` - ministry/void ranged document enemy; break-sight-and-close rule; rumor ids resolve.
- [x] `NELYUD` - civil false human; test-distance rule; rumor ids resolve.

## Notes

- Added unit coverage so every registered monster needs ecology, concrete text, room/floor identity, resolving rumors, resolving variants, and valid rare drops.
- Kept changes inside data/test/doc scope. No monster enum, generator, or AI behavior changes.

## Validation

- [x] Baseline `npm run typecheck` passed before edits.
- [x] Post-edit `npm run typecheck` passed.
- [!] `npm run test:unit` ran; new monster ecology test passed, but the suite failed in existing `tests/inventory-rpg.test.ts` because dirty `src/data/psi.ts` has `psi_rupture.psiCost = 5` while the test still expects `ПСИ 1/10 -3`.
