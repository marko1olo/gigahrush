# MACRO2_1: Start-To-Return Expedition Proof

Модель: GPT-5.5, reasoning extra high.

Цель: собрать один доказанный маршрут "подготовка -> цель -> риск -> награда -> самосбор/сбой -> возврат", который новый игрок может пройти без чтения исходников.

Критично: `desdoc.md` прямо говорит, что проект уже богат контентом, но рискует быть витриной без понятной вылазки.

Ownership: `scripts/smoke-playability.mjs`, `src/systems/debug.ts`, `src/render/quest_ui.ts`, `src/render/map_ui.ts`, уникальный `tests/expedition-slice.test.ts`.

Читать: `README.md`, `architecture.md`, `desdoc.md`, `src/gen/living/expedition_prep.ts`, `src/data/contracts.ts`.

Deliverables:
- debug/smoke path: актовый зал, подготовка, системное задание, лифт, бой или кража, контейнер, warning самосбора, возврат;
- единый route audit record в `desdoc.md` только после playable proof;
- проверка, что карта/лог/quest UI объясняют следующий шаг.

Проверки: `npm run typecheck`, `npm run test:unit`, `SMOKE_SCENARIO=expedition npm run smoke`.

Параллельные ограничения: не расширять весь проект; править только missing links выбранного маршрута.
