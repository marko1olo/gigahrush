# MACRO2_39: Route-Aware Arrival Spawn

Модель: GPT-5.5, reasoning extra high.

Цель: floor transitions place the player near the correct reachable lift/button for the direction and route entry.

Критично: arbitrary same-XY fallback can put player far from intended exit or in unreadable geometry after design/procedural transitions.

Ownership: `src/main.ts`, `src/gen/floor_manifest.ts`, `src/gen/shared.ts`, `tests/procedural-floors.test.ts`.

Читать: `src/main.ts switchFloor`, `src/systems/procedural_floors.ts`, floor generators.

Deliverables:
- arrival spawn resolver chooses matching lift direction and reachable adjacent cell;
- fallback logs/debugs reason and remains safe;
- tests traverse representative adjacent FloorRun transitions.

Проверки: `npm run test:unit`, manual route travel smoke.

Параллельные ограничения: avoid content-specific transition logic.
