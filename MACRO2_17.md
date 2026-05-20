# MACRO2_17: Monster Spawn Ecology And Route Fit

Модель: GPT-5.5, reasoning extra high.

Цель: связать monster ecology with floor roles, room types, procedural tags and loot hints.

Критично: если Tube Eel не привязан к воде, Pechateed к бумагам, Shadow к свету/темноте, counterplay теряет смысл.

Ownership: `src/data/monster_ecology.ts`, `src/gen/procedural_floor.ts`, `src/data/procedural_floors.ts`, `tests/monster_00_base_registry_audit.test.ts`.

Читать: `README.md Procedural Floors`, `src/data/monster_ecology.ts`, `src/gen/procedural_floor.ts`.

Deliverables:
- spawn weights respect anomaly/floor/room tags;
- procedural specs expose monster bias in screen/route cues;
- debug report lists likely monsters for current floor.

Проверки: `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: no per-frame ecology simulation; selection is generation-time/slow-tick.
