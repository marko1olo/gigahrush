# MACRO2_52: Debug Route Browser Upgrade

Модель: GPT-5.5, reasoning extra high.

Цель: debug menu summarizes current z, route id, actual floor instance, reachability counts, lifts, anomaly and bad placement count.

Критично: with 85 vertical stops, agents need in-game diagnostics, not source spelunking.

Ownership: `src/systems/debug.ts`, `src/systems/procedural_floors.ts`, `src/systems/floor_instances.ts`.

Читать: `README.md Debug`, `src/systems/debug.ts`, `src/systems/procedural_floors.ts`.

Deliverables:
- one debug command/report "route floor summary";
- includes baseFloor/story/design/procedural/instance identity;
- includes basic reachability and anomaly state from existing helpers.

Проверки: `npm run typecheck`, manual debug on story/design/procedural/instance floor.

Параллельные ограничения: no new gameplay behavior.
