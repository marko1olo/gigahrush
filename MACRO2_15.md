# MACRO2_15: Player Damage Cause Coverage

Модель: GPT-5.5, reasoning extra high.

Цель: смерть игрока всегда объясняется последним значимым source: monster, NPC, projectile, hazard, needs, samosbor, void rule.

Критично: если игрок не понимает, почему умер, horror становится шумом, а не обучаемым риском.

Ownership: `src/systems/damage.ts`, `src/main.ts`, `src/systems/needs.ts`, `src/systems/cell_hazards.ts`, `src/systems/samosbor.ts`, `tests/player-damage.test.ts`.

Читать: `src/systems/damage.ts`, `src/main.ts` death handling, hazard systems.

Deliverables:
- every HP-changing path calls `recordPlayerDamage` with actionable detail;
- game-over HUD/log shows source within stale window;
- tests for hazards, needs starvation/dehydration, samosbor, projectile.

Проверки: `npm run test:unit`, `npm run smoke`.

Параллельные ограничения: no balance changes; only attribution and UI clarity.
