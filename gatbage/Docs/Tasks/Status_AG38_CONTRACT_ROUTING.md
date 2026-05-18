# AG38 Contract Target Routing Status

Prompt block extracted: `AGENT_38_CONTRACT_TARGET_ROUTING`.

Preflight:
- Read `README.md`, `architecture.md`, `desdoc.md` P0.3, contract/quest/map/event/deadline systems, and `tests/content-registry.test.ts`.
- Baseline `npm run typecheck` passed before edits.

Implementation:
- Contract definitions now carry generic target metadata: floor, room type, zone tag, and player-facing hint.
- `contractToQuest` copies target metadata into generic quest fields.
- Contract created/completed/failed events include target metadata.
- Quest log route hints use target floor/hint for contract quests.
- Map lift highlighting reads target floors, and current-floor target room markers are bounded to visible map cells.
- Content registry coverage now validates contract target floor, room type, and hint metadata.

Validation:
- Baseline `npm run typecheck` passed before edits.
- `npm run check` reached and passed the content registry contract target validation.
- Final `npm run check` is blocked during `npm run typecheck` by unrelated in-progress context/rumor edits: duplicate object keys in `src/systems/context.ts` and duplicate function implementations in `src/systems/rumor.ts`.
- Three debug-spawn order contract hints were inspected; they read as player-facing Russian.
