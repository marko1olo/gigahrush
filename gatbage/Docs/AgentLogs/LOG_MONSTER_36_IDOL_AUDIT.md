# MONSTER_36_IDOL_AUDIT Log

2026-05-18

- Extracted `MONSTER_36_IDOL_AUDIT` from `Monster_36.md`.
- Audited README, architecture, desdoc, monster design docs, IDOL entity definition, monster registry, monster ecology/variants, Hell choir tax, and Underhell anchor placement.
- Confirmed IDOL stays immobile through `speed: 0` and generic monster AI handling for `def.speed === 0`.
- Added local floors/counterplay/loot hint to `src/entities/idol.ts`.
- Added focused unit coverage in `tests/monster_36_idol_audit.test.ts`.
- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
- Final `npm run test:unit`: passed, 70 tests.
