# AG64 Green Acid Room Status

## Preflight

- Prompt XML block extracted: `AGENT_64_GREEN_ACID_ROOM`.
- Read: `README.md`, `architecture.md`, `desdoc.md` section 16.1.
- Read required files: `src/gen/maintenance/content_manifest.ts`, `src/gen/living/content_manifest.ts`, `src/systems/inventory.ts`, `src/systems/events.ts`, `src/render/marks.ts`, `src/render/hud_fx.ts`.
- Baseline `npm run typecheck`: blocked, package has no `typecheck` script.

## Implementation

- [x] Add green acid slime maintenance room.
- [x] Add bounded organic-loot pickup consequence and countermeasure.
- [x] Publish exposure, neutralization, and sample pickup facts through existing event store tags.
- [x] Run final validation.
- [x] Append final report to `Docs/AgentLogs/LOG_AG64_GREEN_ACID_ROOM.md`.

## Notes

- Event type ids are currently a closed core union; AG64 will publish existing inventory event types with `slime`, `acid`, `sample`, `exposure`, and `neutralization` tags rather than adding a core event type.
- Implemented in `src/gen/maintenance/green_acid_room.ts`, wired through `src/gen/maintenance/content_manifest.ts`.
- Organic acid drops warn on first unsafe pickup, spoil only on repeated unsafe pickup, and can be recovered by spending one `filter_layer`.
- Validation: `npm run build` passed; `npm run check` blocked because the package has no `check` script.
- Current final `npx tsc --noEmit --pretty false` is blocked by unrelated dirty-tree errors outside the AG64 room path: duplicate `eventTags` in `src/data/plot.ts`, unfinished/unused `src/gen/hell/thin_wall_chapel.ts` imports, unused `src/gen/maintenance/slime_sample_post.ts` scaffolding, unfinished `src/systems/faction_events.ts` symbols, and unrelated slime/Veretar scaffolding currently present in `src/systems/inventory.ts`.
