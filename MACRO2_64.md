# MACRO2_64: Mobile Controls And Panels Smoke

Модель: GPT-5.5, reasoning extra high.

Цель: mobile landscape controls, menu rail, touch panels and fullscreen/direct-launch path are verified automatically.

Критично: browser game release depends on mobile/itch ergonomics; desktop smoke does not cover touch.

Ownership: `src/mobile.ts`, `src/fullscreen.ts`, `src/input.ts`, `scripts/smoke-playability.mjs`, `mobile.md`.

Читать: `mobile.md`, `README.md Controls`, `src/mobile.ts`.

Deliverables:
- smoke mode emulates mobile viewport/touch and opens inventory/map/quest/log;
- safe area and text clipping checks;
- iOS/fullscreen limitations documented factually.

Проверки: `SMOKE_SCENARIO=mobile npm run smoke`, `npm run typecheck`.

Параллельные ограничения: preserve desktop input behavior.
