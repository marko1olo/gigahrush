# MACRO2_36: Route Cues Rebuild Contract

Модель: GPT-5.5, reasoning extra high.

Цель: route cues are copied, cleared or re-registered correctly on floor rebuild and procedural regeneration.

Критично: stale cues send the player to vanished rooms; missing cues make dense floors unreadable.

Ownership: `src/systems/route_cues.ts`, `src/systems/samosbor.ts`, `src/gen/procedural_floor.ts`, route-cue tests.

Читать: `README.md route_cues`, `src/systems/route_cues.ts`, `src/gen/procedural_floor.ts`.

Deliverables:
- documented cue lifetime per story/design/procedural/floor-instance world;
- no stale WeakMap/state markers after replacement;
- `routeCueCount` test before/after rebuild.

Проверки: `npm run test:unit`, route cue debug command.

Параллельные ограничения: no full-map route guidance scan in render.
