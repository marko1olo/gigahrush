# Status_AG73_BETONOV_NOTES

## Prompt

- Extracted XML block id: `AGENT_73_BETONOV_EXPEDITION_NOTES`.
- Domain: Notes / Rumors / Procedural Floor Lead.
- Goal: add missing Betonov/NII expedition documents that point toward a dangerous procedural route or sample site without adding a story floor.

## Preflight

- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` sections 13, 16.1 and 17.
- Read `src/data/notes.ts`, `src/data/rumors.ts`, `src/systems/rumor.ts`, `src/data/procedural_floors.ts`, `src/systems/procedural_floors.ts`.
- Baseline requested command: `npm run typecheck` failed because `package.json` has no `typecheck` script.

## Implementation

- Added 6 short Betonov/NII expedition notes to `src/data/notes.ts`.
- Reused existing note spawn pattern: the generic `note` item pulls text from `NOTES` in NPC inventories and samosbor/procedural item drops.
- Upgraded existing rumor `faction_scientist_notes` in `src/data/rumors.ts` into a Betonov expedition lead.
- The rumor points to `MAINTENANCE` and the normal lift route below the Collectors (`Z+21..Z+23`), which are existing procedural route floors.
- Concrete decisions exposed in text: follow route for a sample, give the note to Yakov/NII/Ministry, sell it, or keep/hide it.
- No new `FloorLevel`, POI, event bus or procedural system was added.

## Events And Tests

- Reading a note already reuses the existing `player_use_item` event published by `systems/inventory.ts`.
- Note texts are plain strings, not id-backed documents, so note-id tests are not applicable.
- No tests were changed, so `npm run test:unit` was not required. The script is also absent from this checkout.

## Verification

- `npm run typecheck`: failed before code changes; missing npm script.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed.
- Note string count after change: 150.

## Done

- Expedition notes are discoverable through existing note-text drops.
- Rumor output gives a playable Maintenance/procedural route lead.
- Text stays short, bureaucratic and practical.
