# MACRO2_35: Rail Train Rebuild Identity

Модель: GPT-5.5, reasoning extra high.

Цель: trains remain boardable/moving after samosbor rebuild or floor regeneration.

Критично: rail tracks store train entity ids/cells; regenerated entities can invalidate identity and passenger state.

Ownership: `src/systems/rail_trains.ts`, `src/systems/samosbor.ts`, `src/gen/design_floors/dark_metro.ts`, `tests/rail-trains.test.ts`.

Читать: `README.md Dark Metro`, `src/systems/rail_trains.ts`, `src/gen/procedural_anomalies/rail_trains` if present.

Deliverables:
- rebuild remaps train `entityIds` or recreates track/train state atomically;
- `railTrainCells` rebuilt after generation;
- passenger exits safely if rebuild interrupts a ride.

Проверки: `npm run test:unit`, debug force samosbor on dark metro.

Параллельные ограничения: no broader transport rewrite.
