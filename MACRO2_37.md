# MACRO2_37: Active Floor Instance Keying

Модель: GPT-5.5, reasoning extra high.

Цель: numbered floor instances use their actual anomaly key, not the intended FloorRun target key.

Критично: №404/556/etc can interrupt design/procedural travel; save/load/editor patches must bind to the anomaly floor actually loaded.

Ownership: `src/systems/floor_instances.ts`, `src/systems/map_editor.ts`, `src/systems/net_terminal_gen.ts`, `src/main.ts`, `tests/procedural-floors.test.ts`.

Читать: `README.md Numbered Lift Instances`, `src/systems/floor_instances.ts`, `src/systems/procedural_floors.ts`.

Deliverables:
- active instance exposes stable world key for editor/save/runtime state;
- edit/save/load inside forced instance returns to same anomaly;
- no patch leakage to intended normal route floor.

Проверки: `npm run test:unit`, manual debug forced 404.

Параллельные ограничения: do not add new numbered floor content here.
