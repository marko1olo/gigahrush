# AG79 Cult Supply Kitchen Status

Date: 2026-05-18

## Scope

- Add a Kvartiry communal kitchen that functions as a mundane cult supply cell.
- Keep it non-combat: stealing, exposing, negotiating, sabotaging, returning food, or walking away must all be valid.

## Preflight

- Prompt extracted: `AGENT_79_CULT_SUPPLY_KITCHEN`.
- Read: `README.md`, `architecture.md`, `desdoc.md` section 16.2, `src/gen/kvartiry/content_manifest.ts`, `src/gen/kvartiry/social_helpers.ts`, `src/systems/containers.ts`, `src/systems/events.ts`, `src/data/items.ts`.
- Baseline: `npm run typecheck` failed because `package.json` has no `typecheck` script.

## Implementation

- Added `src/gen/kvartiry/cult_supply_kitchen.ts`.
- Registered the kitchen in `src/gen/kvartiry/content_manifest.ts`.
- Added `cult_supply_list` and `borrowed_kitchen_key` item definitions.
- Added `item_deposited` container events so deposits can publish consequences.
- Deposit tags now support resident relief, planted evidence, and supply sabotage through the container/event path.
- Fixed an unrelated duplicate `roomCenter` helper in `src/gen/procedural_floor.ts` that was blocking the available Vite build.

## Validation

- `npm run check`: failed because `package.json` has no `check` script.
- `npx tsc --noEmit`: failed on unrelated existing work outside AG79, including missing monster registry entries, incomplete faction event helpers, missing status fields, and missing event ids.
- `npm run build`: passed after the procedural-floor duplicate helper fix. Vite still reports an unrelated duplicate debug case warning.
- `git diff --check` on touched files: passed.
