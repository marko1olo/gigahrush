# Design Floor: Перекрестки

Status: implemented authored route floor. Route id: `manhattan_crossroads`. Anchor: `z=+8`. Base floor: `KVARTIRY`. Shipped HUD name: `Перекрестки`.

Owned file: `src/gen/design_floors/manhattan_crossroads.ts`. Planning sections below may predate the routed implementation; verify exact NPC, quest and route-blocker claims against source.

## Role

This is the requested "Manhattan" floor: an indoor street grid inside the megastructure. It has asphalt roads, two-way lanes, white divider lines and zebra crossings. It should feel like city infrastructure crushed into a concrete floor.

Primary decisions: cross under fire, control a junction, escort through crosswalks, steal from road stalls, repair traffic lights, reroute factions, flee down a side street.

## Generation

Grid fantasy:

- generate long orthogonal avenues and shorter cross streets;
- roads are floor cells with asphalt texture;
- each road has two directions divided by white line markings;
- intersections are 4-way or T-junction nodes;
- zebra crossings appear at intersections using floor marks/texture variants;
- blocks between roads contain apartments, kiosks, garages, service rooms and lift entrances;
- no vehicles as physics simulation in MVP.

Suggested cell scale:

- avenue width: 9-13 cells;
- lane width: 3-4 cells;
- divider line: 1 cell/mark line;
- sidewalk/service edge: 2-3 cells;
- crosswalk: 5-7 striped rows.

If new texture ids are needed, add them through an integrator-owned texture task. MVP can fake asphalt with dark concrete plus white floor marks.

## NPCs

- `crossroads_traffic_militsiya`: controls one junction and bribe/checkpoint routes.
- `crossroads_zebra_granny`: slow escort, teaches crossings.
- `crossroads_courier_dima`: runs between markets and residential floors.
- `crossroads_road_stalker_ksu`: sells shortcut rumors.

## Quests

- `crossroads_open_junction`: repair light, bribe guard or clear monsters.
- `crossroads_zebra_escort`: escort NPC across several crossings during danger.
- `crossroads_stolen_cargo`: recover cargo from a block garage or road stall.
- `crossroads_wrong_turn`: follow a street sign that points to a procedural floor.

## Hazards

Use cinematic fakes:

- "traffic" is sound, light state, scripted hazards or static wrecks;
- patrols move between junction nodes on slow ticks;
- crosswalk safety is local state, not traffic AI;
- road ambush uses line of sight and cover, not vehicle simulation.

## Cross-Floor Hooks

- Kvartiry barricades can close one street.
- Living hub can send delivery/escort quests here.
- Market 88 uses road couriers.
- Service Floor can repair signal lights.
- Dark Metro can open a wrong underpass at one intersection.

## DoD

- Player immediately reads roads, lanes, divider lines and crosswalks.
- At least one intersection has three valid approaches.
- Escort/crossing quest is playable without crowd simulation.
- Debug can print junction states and route blockers.
