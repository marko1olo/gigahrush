# Story Anchor Brief: Мясной низ

Status: historical expansion brief for the existing story anchor. Current route stop: `FloorLevel.HELL` at `z=-36`. There is no shipped design-floor route id `hell`; README and `src/data/procedural_floors.ts` remain source of truth.

Existing generator reference: `src/gen/hell/`. Planning sections below describe possible route-scale expansion, not shipped design-floor route data.

## Role

Hell is high-threat combat and PSI survival: meat architecture, cultists, liquidators, arenas, thin chapels, dangerous caches, a story foothold room and short brutal routes. It is not a place to loiter.

Primary decisions: fight, flee, sacrifice resource, break ritual, use PSI, take rare cache, seal route.

## Generation

Use current Hell generator as base:

- meat rooms, cult spaces, altar arena, PSI meat cache, thin-wall chapel and the story holdout anchor zone;
- down lifts are normal Hell route exits, while Heralds live in Podad at `z=-40`;
- compact routes with strong encounter identity;
- more set pieces, not endless meat corridors.

## NPCs

Existing plot NPCs remain anchors. Expanded route-scale NPCs:

- `hell_burned_guide_arseny`: knows one safe but costly path.
- `hell_cult_taxman`: demands item/life/document tribute.
- `hell_liquidator_last`: wants extraction or final shot.
- `hell_meat_choir_trace`: non-NPC sound/readable trace.

## Quests

- `hell_break_altar`: combat wave or stealth sabotage.
- `hell_extract_liquidator`: escort wounded NPC through meat route.
- `hell_take_psi_cache`: choose rare reward versus backlash.
- `hell_stop_cult_signal`: affects Chthonic Attic/Ministry cult evidence.

## Samosbor

Hell should feel near-constant but still structured: warning is short, shelters are corrupt, aftermath leaves meat marks and stronger monsters. Do not remove shelter choice; make it costly.

## Cross-Floor Hooks

- Chthonic Attic foreshadows roots/cult marks.
- Underhell opens after Hell choices.
- Podad carries the Herald gate for the lower route.
- Ministry/Liquidators react to proof from Hell.

## DoD

- One major encounter has multiple approaches.
- Rare rewards are one-shot or costly.
- Player can exit without farming infinite monster spawns.
