# Rationale_AG18_INDUSTRY

## Decisions

### Maintenance Floor Over New Industry Floor

The prompt forbids creating an industry floor enum. The maintenance floor already has pipes, pumps, pressure rooms, water, and production-room affordances, so the concentrate press is an additive maintenance POI registered through the manifest.

Rejected: a new floor or broad generator switch. That would touch red integration files and add no MVP value.

### Existing Production And Containers

The factory room is a normal `RoomType.PRODUCTION` named for concentrate. `factoryForRoom()` can select the new `concentrate_press` profile, while `ensureProductionRooms()` creates/uses room containers and publishes production/block events.

Rejected: custom per-room production state, worker simulation, conveyor physics, or manual container system edits. The existing slow tick already creates the item consequence the prompt needs.

### Abstract Resource, Existing Items

`industrial_slurry` is one abstract stock made from existing item ids such as `filter_layer`, `acid_bottle`, `metal_water`, and `rubber_strip`. Recipes output existing usable items: `grey_briquette`, `green_briquette`, and `gasmask_filter`.

Rejected: new concentrate item ids. Existing bрикет and filter items already serve food/survival and keep inventory/render code unchanged.

### Four NPCs, Two Quest Surfaces

The room has four hand-authored NPCs for immediate room-level story and four system contracts for the generic quest bank. The side quests cover repair, input delivery, defense, and theft. The contracts mirror those factory jobs for contextual NPC offers/debug.

Rejected: hiding all content behind procedural contracts only. The prompt asks for a visible room-level story.

### Bounded Samosbor Aftermath

The aftermath is a small quarantined waste room with water and fog values, plus contaminated loot and local threats. The contamination is bounded by room walls/door behavior; it does not add a new global aftermath tick or per-frame scan.

Rejected: production-wide contamination simulation or fog mechanics changes. The existing fog spread is already global and door-bounded.

## Runtime Cost

- Recurring systems added: 0.
- Production work: existing 1-second cadence and existing 64-room production cap.
- Generation cost: one POI stamp, four NPCs, 21 drops, 3 monsters.
- Hot-loop allocation: none added.
