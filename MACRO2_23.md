# MACRO2_23: Maronary Variant Smoke And Gameplay

Модель: GPT-5.5, reasoning extra high.

Цель: Маронарий читается как зеленый логический сбой: wrong door, green source, high beep, risky shaving/trace.

Критично: lore already landed in variants and docs, but rare content needs debug/smoke coverage and actionable choices.

Ownership: `src/data/samosbor_variants.ts`, `src/systems/maronary_shaving.ts`, `src/systems/wrong_door.ts`, `src/render/map_ui.ts`, `tests/wrong-door.test.ts`.

Читать: `Docs/ScenarioWriters/44_maronary.md`, `gatbage/maronary.md`, `src/gen/void/maronary_signalshchik.ts`.

Deliverables:
- forced Maronary smoke path checks HUD/map/log/residue;
- player choices: avoid source, break source, sell/hide shaving, distrust route;
- no direct paste from threads; use bounded in-game motifs.

Проверки: `npm run test:unit`, `SMOKE_SCENARIO=maronary npm run smoke` or documented debug route.

Параллельные ограничения: do not create a separate Maronary system if variants/hooks suffice.
