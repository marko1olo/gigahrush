# AG12 Mushroom Shift Rationale

Date: 2026-05-17

## Preflight Notes

- The AG12 prompt asks for the first playable Mushroom Shift slice, not the full hydroponics expansion.
- The expansion docs describe future room-level farm state and slow ticks, but this prompt explicitly limits the task to a room-scale slice with no biological simulation.
- Baseline `npm run build` passed before edits.

## Integration Read

- LIVING content is safest through `src/gen/living/content_manifest.ts` and `registerZoneContent()`.
- Side quests can be registered from the content module through `registerSideQuest()` and then materialized by the existing quest system.
- Items and resources already support food, tools, medicine, and generic production inputs.
- `systems/production.ts` matches rooms by type/name hint and emits factory outputs into room containers when a matching container exists.
- Rumors are static definitions and can carry the bounded wet/mold aftermath hook without adding samosbor runtime ownership.

## Design Choices

- The content lives in `src/gen/living/mushroom_cellar.ts` as one self-contained POI module. It avoids `main.ts`, renderer files, shared AI, and samosbor internals.
- The POI is a protected LIVING zone 32 room called `Грибная прачечная первой смены`, using `Tex.ROTTEN`, `Tex.F_TILE`, `Tex.F_WATER`, existing features, and floor marks for domestic mold horror.
- NPC count stays at three: Егор Плесень owns the racks, Ольга Санпропуск creates sanitary pressure, and Валера Мешков represents hoarding/dirty-ration pressure.
- Four side quests map directly to the prompt beats: fetch disinfectant, repair vent, expose hoarder, and choose/use contaminated food pressure.
- New items are only the four needed to make the loop legible. Contaminated food uses existing inventory `use` callbacks instead of a poison system.
- Production is hooked with a small `mushroom_cellar` factory and `fungal_inputs` resource, but direct drops keep the slice playable without new container APIs.
