# MACRO2_22: Shelter Choice And Aftermath Residue

Модель: GPT-5.5, reasoning extra high.

Цель: пережить самосбор можно умным укрытием, а после отбоя остается видимый игровой след.

Критично: самосбор не должен быть только таймером смерти или fog damage; он должен менять маршрут.

Ownership: `src/systems/samosbor.ts`, `src/systems/shelter_tally.ts`, `src/data/samosbor_variants.ts`, `src/systems/events.ts`, `tests/samosbor-shelter.test.ts`.

Читать: `README.md Samosbor`, `src/systems/samosbor.ts`, `src/data/samosbor_director.ts`.

Deliverables:
- prepared/unprepared shelter outcomes with events;
- aftermath can move loot, mark door, spawn rumor, alter container/economy/faction state;
- one test asserts at least one `WorldEvent` and log/HUD signal per cycle.

Проверки: `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: no full-world post-samosbor scan every frame; rebuild/generation-time only.
