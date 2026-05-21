# Addmonster 18: Червие

## Source

- https://samosb0r.fandom.com/ru/wiki/Червие

## Current Coverage

The game has NET terminals, hack backlash, `SAFEGUARD`, and `PARAGRAPH`, but no named net-borne AI that manifests through screens/servers and controls fanatics.

## Gameplay Role

Network/entity hybrid. Not a roaming animal; an encounter around compromised terminals, screens, server rooms, and mind-control events.

Player decision: cut power/network, fight avatar, destroy local server, or accept a tempting false instruction.

## Visual And Sprite Plan

- New sprite file: `src/entities/chervie_avatar.ts`.
- Silhouette: many-headed serpent made of cable and text fragments, floating out of a green/black terminal glow.
- Palette: black cable, phosphor green, rust red warning pixels, white text teeth.
- Procedural generation:
  - Draw central coil/cable body with 3 to 5 serpent heads.
  - Heads use terminal glyph teeth/eyes.
  - Add small screen-square fragments along body.
  - Floor visual states: ministry paper glyphs, net-well green, void black.
- It should visually connect to `PARAGRAPH`/NET but be more organic and serpentine.

## AI Plan

- New `MonsterKind.CHERVIE_AVATAR`.
- `netPossessor` AI flag:
  - Avatar is strongest near `Feature.SCREEN`, terminals, or server apparatus.
  - Can send a short-range mind pulse that confuses NPCs or forces hostile focus, capped by cooldown.
  - If local server apparatus is destroyed or powered down, avatar loses shield/speed.
- It should not control the whole floor. Only a radius around compromised site.

## Generation And Reachability

- `silicon_net_well`, Ministry archives, local computer rooms, NET-hack failure, rare procedural screen room.
- Author one compromised terminal site later with clear reward.
- Debug path: spawn avatar plus screen apparatus.

## Systems And Files

- `src/core/types.ts`, `src/entities/monster.ts`, `src/entities/chervie_avatar.ts`.
- `src/systems/ai/monster.ts`: screen-powered modifier and mind pulse.
- `src/systems/net_hack.ts` / `safeguard.ts`: optional backlash state.
- `src/systems/events.ts`: `chervie_signal`, `chervie_server_cut`, `chervie_false_order`.
- `src/data/monster_ecology.ts`, `src/data/rumors.ts`.
- Tests: power source radius and pulse cap.

## Counterplay

- Break line to screens.
- Cut power/destroy apparatus before fighting avatar.
- Do not obey terminal instructions during pulse window.
- EMP/energy weapons should be strong if available.

## Done

- Encounter is localized to a compromised network site.
- Screen-powered state is readable.
- Mind control is capped and evented.

## Agent Orchestration

- Parallel owner: one GPT-5.5 worker implements only this addmonster file.
- First read: `AGENTS.md`, `README.md`, `architecture.md`, `addmonster_00_index.md`, then this file.
- Write scope: create/modify only the monster package, sprite, authored POI/tests needed for this creature. Do not edit another `addmonster_*.md`.
- Shared files: make only minimal append-style edits for this monster; never reorder or refactor shared registries while other agents are working.
- Forbidden: `monsterVariantId`, `MONSTER_VARIANTS`, `applyMonsterVariant`, prefix-derived stats, or any mechanical subtype system.
- Final report: changed paths, new `MonsterKind`, reachability/debug path, tests run or skipped, and conflicts/TODOs.
