# Design Floor: Коммунальное кольцо

Status: implemented authored route floor. Route id: `communal_ring`. Anchor: `z=+4`. Base floor: `KVARTIRY`. Shipped HUD name: `Коммунальное кольцо`.

Owned file: `src/gen/design_floors/communal_ring.ts`.

## Role

This represents "all floors like apartments" without cloning Kvartiry or Living. It is a ring of communal services: laundries, kitchens, showers, storage rooms, notice boards, stair loops and shared grudges.

Primary decisions: clean, steal, trade, hide, expose, ration, repair, shelter.

## Generation

- Ring corridor with four сквозные коммуналки: each chain has pass-through living rooms, a kitchen, a bathroom, internal doors and exits at both ends.
- Shared services: laundry, shower, kitchen, pantry, notice office and service core.
- Full-floor expansion adds repeated shared-service knots around the 1024x1024 route footprint.
- Loops must be navigable; use landmark rooms and signage.
- Protect permanent POIs from volatile rebuild if integrated into current living-like generator.

## NPCs

- `communal_laundry_luba`: owns laundry access and clean-bandage service.
- `communal_shower_viktor`: knows water contamination rumors.
- `communal_notice_tamara`: controls notice board quests.
- `communal_panhandler_sasha`: detects theft and trades small goods.
- `communal_through_nina`: keeps the through-flat food chain alive.
- `communal_primus_yegor`: repairs the primus/boiling-water route through a valve tag.

## Quests

- `communal_clean_bandages`: wash contaminated cloth for medicine/resource loop.
- `communal_notice_dispute`: choose which public notice becomes official.
- `communal_pantry_theft`: steal, buy or earn access to food storage.
- `communal_shower_pressure`: repair pressure or let water route to Collectors.
- `communal_through_chain_bread`: feed the сквозная коммуналка for safer passage and a key-label reward.
- `communal_primus_valve`: bring a valve tag to restore boiling water in the pass-through flat.

## Samosbor

Communal Ring should produce aftermath accusations. A sealed laundry, missing pantry stock, wet corridor, contaminated showers or changed notice board creates a new small conflict.

## Cross-Floor Hooks

- Living hub receives everyday supplies and rumors.
- Kvartiry riot pressure can spill into the ring.
- Collectors water state affects shower/laundry.
- Registry Morgue/Hospital can request clean cloth or patient records.

## DoD

- At least three shared services exist and each has a decision.
- One service state changes after samosbor.
- The floor feels residential but distinct from Kvartiry density and Living hub safety.
