# MACRO2_21: Samosbor Warning UX

Модель: GPT-5.5, reasoning extra high.

Цель: самосборный warning must be impossible to miss but not obscure movement/combat.

Критично: самосбор is the central horror loop; if warning is unreadable, shelter choice becomes random.

Ownership: `src/systems/samosbor.ts`, `src/render/hud_fx.ts`, `src/render/map_ui.ts`, `src/systems/world_log.ts`, `tests/samosbor-shelter.test.ts`.

Читать: `README.md Samosbor`, `desdoc.md P0.4`, `src/data/samosbor_variants.ts`.

Deliverables:
- warning stack: sound, HUD/log line, map risk overlay, NPC bark where available;
- variant-specific colors/cues for normal/Maronary/Istotit/Veretar;
- debug command forces warning window for smoke.

Проверки: `npm run test:unit`, `npm run smoke`, rare variant manual/debug checks.

Параллельные ограничения: no new DOM overlay; existing canvas channels only.
