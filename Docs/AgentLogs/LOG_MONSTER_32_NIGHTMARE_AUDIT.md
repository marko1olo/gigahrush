# MONSTER_32 NIGHTMARE Audit Log

Final report:
- Audited `NIGHTMARE` / `Кошмарище` against the monster design bible elite band and existing ecology.
- Kept shared spawn/ecology/variant tables read-only.
- Changed local `src/entities/nightmare.ts` from boss-like `hp: 500`, slow contact, and sparse metadata to an elite pressure definition: `hp: 260`, `speed: 1.35`, `dmg: 32`, `attackRate: 1.15`.
- Added local floors, counterplay, and loot hint so the definition itself states the rule: burst it with heavy damage or leave.
- Verified sprite distinction from Shadow/Spirit with `tests/monster_32_nightmare_audit.test.ts`.

Validation:
- Baseline `npm run typecheck`: passed.
- Final `npm run typecheck`: passed.
- Final `npm run test:unit`: passed, 71 tests.
