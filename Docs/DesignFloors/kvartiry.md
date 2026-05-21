# Story Anchor Brief: Квартиры

Status: historical expansion brief for the existing story anchor. Current route stop: `FloorLevel.KVARTIRY` at `z=+14`. There is no shipped design-floor route id `kvartiry`; README and `src/data/procedural_floors.ts` remain source of truth.

Existing generator reference: `src/gen/kvartiry/`. Planning sections below describe possible route-scale expansion, not shipped design-floor route data.

## Role

Kvartiry is the dense social riot floor: queues, kitchens, barricades, counterfeit rooms, water fights, lost people, illegal printing and volatile neighbor politics.

Primary decisions: intervene, de-escalate, loot, protect, denounce, route around crowd, choose side, flee before uprising.

## Generation

Use current Kvartiry generator as base:

- tight apartments and communal corridors;
- high NPC density but bounded active logic;
- social POIs behind `content_manifest.ts`;
- no full crowd simulation per frame.

Future expansion should add more variety to apartment-like blocks without making every room bespoke.

## NPCs

Keep existing social NPC pack. Add future route-scale NPCs:

- `kv_route_brigadier`: organizes stair/elevator queues.
- `kv_food_witness`: remembers ration theft.
- `kv_water_agitator`: can start/stop water riot.
- `kv_child_safe_contact`: only as protected social context, not shock content.

## Quests

- `kv_stop_or_feed_riot`: solve water/food conflict by resource, violence or proof.
- `kv_print_route_pass`: use illegal print room to get design-floor paper.
- `kv_barricade_choice`: open road to Manhattan Crossroads or keep citizens safe.
- `kv_false_neighbor`: expose or shelter a false neighbor.

## Samosbor

Kvartiry aftermath should be social: missing neighbor, container accusation, sealed kitchen, queue change, rumor, barricade shift. Active phase can trigger uprising through existing social pressure hooks.

## Cross-Floor Hooks

- Communal Ring and Living share ration/neighbor facts.
- Manhattan Crossroads receives barricade/road access.
- Ministry/Raionsovet react to illegal printing.
- Market 88 buys scarce goods and rumors from Kvartiry.

## DoD

- One social conflict has at least three outcomes.
- At least one route to another design floor is changed by a Kvartiry decision.
- NPC pressure stays bounded by room/zone cooldowns.
