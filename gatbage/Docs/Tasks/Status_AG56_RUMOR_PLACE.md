# AG56 Rumor-To-Place Chain Status

Prompt extracted: `AGENT_56_RUMOR_TO_PLACE_CHAIN`.

## Preflight

- Read: `README.md`, `architecture.md`, `desdoc.md` P1 A-Life and P2, rumor/context/memory/event/UI files, and current floor content manifests.
- Baseline `npm run typecheck`: passed.
- Initial audit: existing static rumors had reveal coverage, but many reveals were broad and did not give a concrete route or player action.

## Plan

- Done: added structured practical lead metadata. Current runtime audit: 208 rumor definitions, 37 `lead` blocks.
- Done: recently heard leads are stored with a bounded TTL in `systems/npc_memory.ts`; NPC dialogue appends the lead line, and quest/full-map UI reads only the lightweight memory store.
- Done: high-signal event bridge now maps contracts, metro/elevator anomalies, containers, rare item pickups, faction events, production, samosbor, and monster kills to rumor records without unbounded scans.
- Done: tests validate rumor reveal/lead item ids, monster kinds, room types, floors, and minimum practical lead count.
- Validation: `npm run check` passed.

## Sampled Rumors

- `lead_living_black_market_debt`: go to `Счетная 88`; buy or steal a liquidator token from the debt locker.
- `lead_living_quarantine_medcard`: enter the Living quarantine hospital, avoid/kill the zombie, extract the quarantine medcard.
- `lead_ministry_stamp_room_wax`: search the Ministry stamp room for seal wax while keeping documents away from the pechateed.
- `lead_ministry_raionsovet_permit`: reach the living raionsovet archive, avoid paragraph fire lanes, take the archive permit.
- `lead_kvartiry_ration_queue_registry`: find the Kvartiry ration queue and get the ration registry extract by queueing or theft.
- `lead_kvartiry_false_neighbor_nelyud`: check the false neighbor room from range, expose the nelyud, then loot the room.
- `lead_maintenance_pressure_logbook`: descend to the pressure pump room, watch for tube eels, take the pressure logbook.
- `lead_maintenance_metro_ticket`: find platform 19 in Maintenance, buy a metro ticket, choose a route.
- `lead_hell_herald_threshold_shard`: push to the Herald threshold, fight from cover, take the siren shard.
- `lead_void_protocol_chamber_spike`: enter Protocol P-46 in the Void, survive the local rule, recover the void spike.
