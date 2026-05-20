# MACRO2_94: Procedural Screens Signal Relevance

Модель: GPT-5.5, reasoning extra high.

Цель: screens provide useful ambient intel about samosbor, scarcity, faction control, route anomaly and Void protocols.

Критично: screens are already generated; if their text is generic, they waste a strong diegetic UI channel.

Ownership: `src/gen/procedural_screens.ts`, `src/data/screen_signals.ts`, `src/render/textures.ts`, `tests/content-registry.test.ts`.

Читать: `README.md Procedural Screens`, `src/data/screen_signals.ts`, `src/gen/procedural_screens.ts`.

Deliverables:
- screen signal chooses local floor/room/zone/anomaly relevant text;
- avoids bathrooms/doors and content conflicts;
- rumors linked to screen messages remain valid.

Проверки: `npm run test:unit`, `npm run content:audit`, manual procedural floor screens.

Параллельные ограничения: screens are ambient intel, not interactive UI.
