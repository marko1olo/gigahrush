# MACRO2_70: Net Event Public Identity Collision

Модель: GPT-5.5, reasoning extra high.

Цель: avoid public event id collisions when same-ms events share type or timestamp.

Критично: shared terminal history must be bounded and stable; duplicate IDs break polling and dedupe.

Ownership: `functions/api/net/event.ts`, `functions/api/net/common.ts`, `tests/net-sphere.test.ts`.

Читать: `functions/api/net/event.ts`, `cloudflare/d1/net_sphere.sql`, client polling code.

Deliverables:
- public event id uses DB id or sanitized event key, not only `${created_at}:${type}`;
- tests for duplicate timestamp/type;
- backwards-compatible client handling if needed.

Проверки: `npm run test:unit`.

Параллельные ограничения: no public exposure of private NET-GEN.
