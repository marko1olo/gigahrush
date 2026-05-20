# MACRO2_50: Living Rebuild Side-Array Cleanup

Модель: GPT-5.5, reasoning extra high.

Цель: repeated Living samosbor rebuilds do not leave stale screens, surfaces, containers, marks, route cues or volatile side arrays.

Критично: Living has protected apartments plus volatile maze; stale sparse maps can create ghost interactions after several cycles.

Ownership: `src/gen/living/volatile.ts`, `src/systems/samosbor.ts`, `src/systems/containers.ts`, `src/systems/route_cues.ts`, tests.

Читать: `README.md Living`, `src/gen/living/volatile.ts`, `src/systems/samosbor.ts`.

Deliverables:
- prune/rebuild volatile-only `screenCells`, `surfaceMap`, containers and cues;
- preserve `aptMask` protected content;
- test multiple Living samosbor cycles.

Проверки: `npm run test:unit`, manual debug force samosbor.

Параллельные ограничения: do not wipe player inventory/state or permanent POI.
