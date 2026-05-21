# Story Anchor Brief: Министерство

Status: historical expansion brief for the existing story anchor. Current route stop: `FloorLevel.MINISTRY` at `z=+30`. There is no shipped design-floor route id `ministry`; README and `src/data/procedural_floors.ts` remain source of truth.

Existing generator reference: `src/gen/ministry/`. Planning sections below describe possible route-scale expansion, not shipped design-floor route data.

## Role

Ministry is the official bureaucratic stealth/combat floor: documents, permits, archives, inspections, guards, queues, stamps and hostile paperwork monsters. It should remain an anchor, not a joke corridor.

Primary decisions: legal pass, forged pass, bribe, stealth, violence, record theft, witness protection, report suppression.

## Generation

Use current Ministry generator as base:

- queue halls, offices, archive pockets, smoking rooms, interrogation, stamp rooms;
- preserve strong visual identity: marble, carpets, portraits, screens;
- add more route pressure, not bigger empty offices;
- every locked important room needs a paper route and a risky bypass route.

## NPCs

Existing Ministry NPCs remain references. Expanded floor should add:

- `ministry_route_clerk`: explains floor-run papers.
- `ministry_anti_market_inspector`: creates Market 88 heat.
- `ministry_shelter_commissar`: controls samosbor shelter access.
- `ministry_lift_notary`: validates design-floor route changes.

## Quests

- `ministry_floor_pass`: obtain pass to a chosen design floor route.
- `ministry_market_case`: help/sabotage inspection of Market 88.
- `ministry_shelter_list`: forge or correct shelter list before samosbor.
- `ministry_monster_clause`: kill or document a PECHATEED/PARAGRAPH threat.

## Monsters

Use bureaucratic threats:

- `PECHATEED`: chases valuable documents.
- `PARAGRAPH`: ranged paperwork enemy.
- `SHOVNIK`: stronger near sealed walls.
- rare `NELYUD` as false clerk.

## Cross-Floor Hooks

- Upper Bureau feeds appointment/access.
- Raionsovet and Registry Morgue provide document consequences.
- Manhattan Crossroads road permits can be issued or denied here.
- Darkness can invalidate paperwork by removing labels.

## DoD

- Player can pass one gate three ways: document, social/economy, combat/stealth.
- At least one Ministry quest points to another design floor.
- Paper monsters have readable counterplay and rumor/document hints.
