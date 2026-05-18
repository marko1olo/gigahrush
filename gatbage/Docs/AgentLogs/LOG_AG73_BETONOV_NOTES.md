# LOG_AG73_BETONOV_NOTES

## 2026-05-18

Implemented AG73 Betonov expedition notes.

- Added 6 short note strings under a Betonov/NII section in `src/data/notes.ts`.
- Updated existing `faction_scientist_notes` rumor in `src/data/rumors.ts` to point toward `MAINTENANCE` and the existing `Z+21..Z+23` procedural route below the Collectors.
- Kept scope data-only: no new story floor, no POI dependency, no procedural system change and no event bus change.
- Reused existing `note` item drop paths and existing `player_use_item` publication when a note is read.

Validation:

- `npm run typecheck` baseline failed because `package.json` defines only `dev`, `build` and `preview`.
- `npx tsc --noEmit` passed.
- `npm run build` passed.
- `npm run test:unit` was skipped because no tests changed and this checkout has no `test:unit` script.
