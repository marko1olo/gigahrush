# AG30 Content QA Log

Date: 2026-05-17

## Final Report

Green:

- `node scripts/content-audit.mjs` passes with no duplicate ids, no missing item/NPC refs, and no unimported content modules. Script coverage includes duplicate checks in `scripts/content-audit.mjs:248`, item/NPC reference checks in `scripts/content-audit.mjs:256`, content import reachability in `scripts/content-audit.mjs:281`, and LIVING zone listing in `scripts/content-audit.mjs:307`.
- Current counts: 101 plot NPC ids, 16 plot-chain steps, 105 side-quest steps, 38 contracts, 188 item ids, 22 monster kinds, 22 monster registry entries, 20 monster variants, 146 rumors.
- Manifest counts: hell 2, kvartiry 13, living 10, maintenance 16, ministry 8, void 2.
- LIVING HUD zone ids registered without collisions: 3, 7, 12, 13, 14, 18, 24, 25, 31, 32, 38, 39, 42, 46.
- `npm run check` passed: typecheck, 25 unit tests, build, and smoke. Final build: `dist/index.html` 1,008.44 kB, gzip 305.46 kB. Smoke: `hudLit=36864`, `webglLit=1024`.

Fixed:

- Corrected rumor reveal item ids in `src/data/rumors.ts:60`, `src/data/rumors.ts:61`, and `src/data/rumors.ts:78` from stale ids to shipped ids: `idol_chernobog` and `psi_strike`.
- Added deterministic registry test coverage in `tests/content-registry.test.ts:59`, `tests/content-registry.test.ts:68`, and `tests/content-registry.test.ts:73`.
- Updated `tests/data-ids.test.ts:42` so `money` is accepted as a quest pseudo-item, matching existing quest completion logic.
- Made `package.json:12` discover compiled test files after `tsc` emits them, fixing clean-tree `npm run check` behavior.

Blocked:

- None in the current audit output.

Risky:

- The worktree is heavily dirty and changed during the audit. AG30 did not revert unrelated agent work; report counts reflect the tree after the final `node scripts/content-audit.mjs` run.
- Generator `console.log` noise remains visible during unit floor generation; this is pre-existing and not a reachability blocker.

