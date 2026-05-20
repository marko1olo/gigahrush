# MACRO2_5: README, Desdoc And Scaling Fact Sync

Модель: GPT-5.5, reasoning extra high.

Цель: привести активные документы к текущим фактам после landed high-density/population/index changes.

Критично: `README.md`, `desdoc.md` и `scaling.md` расходятся в counts и baseline; новые агенты будут планировать по неверным числам.

Ownership: `README.md`, `desdoc.md`, `scaling.md`, `appendix.md`.

Читать: `README.md`, `desdoc.md`, `scaling.md`, `src/data/population_profiles.ts`, вывод `npm run content:audit`.

Deliverables:
- обновить только проверенные shipped facts: counts, profiles, active docs map;
- явно отметить, что `Docs/ScenarioWriters/` active или archive;
- убрать устаревшие "60 tests/318 rumors" если audit уже показывает другое.

Проверки: `npm run content:audit`, `npm run test:unit`, docs grep на конфликтующие числа.

Параллельные ограничения: README не должен становиться roadmap; planning остается в `desdoc.md`.
