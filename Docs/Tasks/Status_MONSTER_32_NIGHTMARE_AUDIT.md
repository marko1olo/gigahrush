# MONSTER_32 NIGHTMARE Audit Status

Prompt: `MONSTER_32_NIGHTMARE_AUDIT`

Preflight:
- Extracted the prompt block from `Monster_32.md`.
- Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, `gatbage/monsters.md`, `AGENTS.md`.
- Read `src/entities/nightmare.ts`, `src/entities/procedural_visuals.ts`, `src/entities/monster.ts`, `src/data/monster_ecology.ts`, `src/data/monster_variants.ts`, `src/systems/ai/monster.ts`.
- Baseline `npm run typecheck`: passed.

Audit notes:
- Shared ecology already keeps `NIGHTMARE` rare, post-samosbor gated, and tied to pressure/counterplay text.
- Local `DEF` had boss-level HP without a special boss mechanic, which made the rare pressure role lean toward sponge combat.

Implementation:
- Rebalanced local `NIGHTMARE` stats into the elite band.
- Added local floor identity, counterplay, and loot hint metadata.
- Added a focused unit test for the audit contract and sprite distinctness.

Validation:
- `npm run typecheck`: passed after changes.
- `npm run test:unit`: passed, 71 tests.
