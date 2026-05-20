# MACRO2_96: Generation Test Runtime Budget

Модель: GPT-5.5, reasoning extra high.

Цель: keep heavy generator tests useful but bounded as all design/procedural floors are audited.

Критично: `npm run test:unit` already spends seconds generating floors; adding reachability across many seeds can make the gate too slow.

Ownership: `tests/procedural-floors.test.ts`, new generator test helpers, `package.json` optional split scripts.

Читать: existing generator tests, `package.json`, `scripts/smoke-playability.mjs`.

Deliverables:
- fast unit subset and heavy generation matrix split if necessary;
- deterministic seed lists for P0 reachability;
- test output summarizes slowest floor generators.

Проверки: `npm run test:unit`, optional `npm run test:generation`.

Параллельные ограничения: do not remove important generator coverage to make tests fast.
