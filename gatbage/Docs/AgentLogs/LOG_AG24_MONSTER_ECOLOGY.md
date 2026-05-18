# AG24 Monster Ecology Log

## 2026-05-17

What was wrong:
- Samosbor monster waves used a global hardcoded progression instead of floor-aware ecology.
- Existing monster variants and rumors gave some identity, but there was no single table describing all 22 current monster kinds consistently.
- Kill events recorded monster kills but did not expose counterplay, ecology, rare-monster, or loot-hint facts to event consumers.

What was done:
- Added `src/data/monster_ecology.ts` with 22 ecology definitions.
- Added `chooseFloorMonsterKind()` for floor-aware weighted samosbor selection.
- Added `chooseMonsterRareDrop()` as an optional rare existing-item helper.
- Updated `src/systems/samosbor.ts` so corridor, random-map, and fog spawns consume ecology data.
- Updated `src/systems/events.ts` so monster kill events include ecology tags/data; rare monster kills are severity 4.
- Added 22 monster ecology/counterplay rumors in `src/data/rumors.ts`.
- Updated `README.md` with factual docs for monster ecology, floor-aware samosbor spawns, and kill-event enrichment.
- Restored the test-expected `offerNpcContract()` export in `src/systems/contracts.ts` so the existing unit suite can compile.

Cinematic cheats used:
- Ecology affects selection weights and event facts rather than adding new live simulation.
- Loot remains a hint/helper surface using existing item ids, not a new per-kill loot system.
- Rare monsters are surfaced through event severity/tags instead of new UI plumbing.

Verification:
- Baseline `npm run build` passed before AG24 edits.
- `npm run typecheck` passed after final edits.
- `npm run test:unit` passed: 25 tests.
- `npm run build` passed.
- `npm run check` passed, including smoke playability at `http://127.0.0.1:62620/`.
