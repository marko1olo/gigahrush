# Design Floor: Райсовет и архив картотек

Status: implemented authored route floor. Route id: `raionsovet_archive`. Anchor: `z=+22`. Base floor: `MINISTRY`. Shipped HUD name: `Райсовет и архив картотек`.

Owned file: `src/gen/design_floors/raionsovet_archive.ts`. Existing design reference: `Docs/Expansions/03_raionsovet_archive/`. Planning sections below preserve the older `Живой архив` name and may predate the routed implementation.

## Role

Raionsovet is the administrative layer below Ministry authority: local records, apartment rights, ration identities, access permits and living memory. The archive should be useful to every other floor.

Primary decisions: file, steal, forge, expose, swap identities, protect a witness, burn a record.

## Generation

- Archive stacks, card catalog corridors, clerk windows, public waiting room, locked living shelves.
- Shelves create tactical lanes; avoid blind maze bloat.
- One office should have a legal service counter; one back route should support theft.
- Place at least one document container with owner/access rules.

## NPCs

- `archive_lida_index`: clerk who knows where records moved.
- `archive_paper_grandfather`: old NPC treated as living index card.
- `archive_fire_liquidator`: wants to burn infected shelves.
- `archive_false_heir`: NPC trying to steal apartment rights.

## Quests

- `archive_get_floor_permit`: obtain route paper for a design floor.
- `archive_swap_card`: choose who owns a room after samosbor.
- `archive_save_or_burn`: preserve records for citizens or burn infected stacks for safety.
- `archive_market_license`: create/suppress a Market 88 license.

## Systems

Represent archive outcomes as compact flags and document items. Do not simulate all residents.

Potential flags:

- `archive.permit.<routeId>`
- `archive.card_swapped.<npcOrRoomId>`
- `archive.shelf_burned.<zoneId>`
- `archive.market_license_state`

## Cross-Floor Hooks

- Ministry validates archive papers but may reject suspicious ones.
- Registry Morgue consumes death/identity cards.
- Kvartiry/Living quests use apartment rights.
- Floor 69 and Market 88 use blackmail and licenses.

## DoD

- At least two records can be obtained by different methods.
- One record change has a visible NPC/door/container consequence.
- Debug lists active archive flags by route id.
