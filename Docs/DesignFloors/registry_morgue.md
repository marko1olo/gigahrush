# Design Floor: Морг регистраций

Status: implemented authored route floor. Route id: `registry_morgue`. Anchor: `z=+18`. Base floor: `MINISTRY`. Shipped HUD name: `Морг регистраций`.

Owned file: `src/gen/design_floors/registry_morgue.ts`. Catalog reference: `pocket_morgue_registry`. Planning sections below may predate the routed implementation; verify exact identity/death mechanics against source.

## Role

This is the layer where death becomes paperwork. It sits below Ministry/Raionsovet and above residential floors. The horror is not gore spectacle; it is identity, tags, ledgers, missing bodies, legal ghosts and medicine scarcity.

Primary decisions: identify, forge tag, steal medicine, expose swapped body, escort a relative, burn a contaminated record, flee a false corpse.

## Generation

- Reception window, tag room, cold storage, washing corridor, ledger office, contaminated chamber.
- Use medical/storage/office room types.
- Keep corpse imagery as marks/containers/readables; no graphic detail needed.
- At least one hermetic shelter must double as cold storage with moral cost.

## NPCs

- `morgue_registrar_faina`: controls legal tags and death certificates.
- `morgue_orderly_stepan`: knows which body is missing.
- `morgue_relative_ira`: wants a name, not loot.
- `morgue_quarantine_sanitar`: ties to hospital quarantine and inspections.

## Quests

- `morgue_find_tag`: recover a tag from a dangerous cold room.
- `morgue_swap_certificate`: forge death to open/close access elsewhere.
- `morgue_missing_body`: identify false corpse or NELYUD threat.
- `morgue_medicine_lock`: legal access, theft or trade for medical container.

## Monsters

Use rare, readable threats: `NELYUD`, `ZOMBIE`, `SHADOW`, `PECHATEED`. Monsters are consequences of record failure, not constant horde.

## Cross-Floor Hooks

- Hospital quarantine sends records here.
- Raionsovet identity swaps become body-tag conflicts.
- Ministry can demand proof or suppress it.
- Darkness can remove names from tags.

## DoD

- One quest changes identity/death state outside this floor.
- Medical loot is container-gated with owner/access risk.
- No graphic sexual or gore content; horror stays procedural/systemic.
