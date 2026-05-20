# MACRO2_68: Net Endpoint Bad-Input Robustness

Модель: GPT-5.5, reasoning extra high.

Цель: API endpoints reject malformed JSON, oversized payloads, invalid ids and D1 failures consistently.

Критично: public endpoints need boring hardening before wider release.

Ownership: `functions/api/net/common.ts`, `hello.ts`, `chat.ts`, `event.ts`, `market.ts`, `stats.ts`, tests.

Читать: `functions/api/net/common.ts`, `tests/net-sphere.test.ts`, `tests/net-market.test.ts`.

Deliverables:
- shared JSON/body parser limits and error response shape;
- tests for malformed JSON, huge body, bad `sinceChatId`, bad method, D1 exception;
- sanitized response bodies.

Проверки: `npm run test:unit`.

Параллельные ограничения: no new runtime dependency.
