# MACRO2_97: Save Payload And Event Buffer Cap Audit

Модель: GPT-5.5, reasoning extra high.

Цель: save data stays compact despite high-density entities, events, editor patches, Net Sphere and production/economy state.

Критично: browser localStorage and single-file game cannot afford accidental 10k entity save payloads.

Ownership: `src/main.ts`, `src/systems/events.ts`, `src/systems/map_editor.ts`, save-related tests.

Читать: `README.md Save And Load`, `src/systems/events.ts`, `src/main.ts`.

Deliverables:
- debug/save summary reports payload size and major sections;
- fixed caps for event/editor/production histories;
- tests prove entity arrays are not serialized wholesale.

Проверки: `npm run test:unit`, manual save after stress/debug route.

Параллельные ограничения: do not store infinite history for telemetry.
