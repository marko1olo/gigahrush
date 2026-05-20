# MACRO2_51: World.solid Audit Semantics

Модель: GPT-5.5, reasoning extra high.

Цель: reachability tests distinguish open, locked, hermetic, water, lift-adjacent and intentionally gated content.

Критично: a naive BFS can mark valid locked gameplay as broken or miss real softlocks behind closed doors.

Ownership: `tests/procedural-floors.test.ts`, `tests/core-world.test.ts`, `src/core/world.ts` only if semantics are wrong.

Читать: `src/core/world.ts`, `src/core/types.ts`, generation reachability tests.

Deliverables:
- shared reachability classifier with reason codes;
- tests for door states and lift-adjacent passability;
- audit output can say "gated by key" versus "unreachable".

Проверки: `npm run test:unit`.

Параллельные ограничения: avoid changing runtime collision unless a test exposes a real bug.
