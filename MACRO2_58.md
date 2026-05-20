# MACRO2_58: Production Output Route Goals

Модель: GPT-5.5, reasoning extra high.

Цель: factories and recipes generate reachable visit/guard/steal/repair goals, not background numbers.

Критично: 10 factories and 17 recipes are a route engine only if outputs land in player-facing places.

Ownership: `src/systems/production.ts`, `src/data/factories.ts`, `src/render/container_ui.ts`, `tests/events-economy.test.ts`.

Читать: `README.md Production`, `src/systems/production.ts`, `src/data/factories.ts`.

Deliverables:
- production outputs have visible container status;
- blocked/lacked output creates event/log/rumor when near or important;
- contract/resource rewards can target production state.

Проверки: `npm run test:unit`, debug production tick.

Параллельные ограничения: no live factory micro-simulation.
