# MACRO2_6: Single-File Build Size Budget

Модель: GPT-5.5, reasoning extra high.

Цель: ввести понятный budget/report для single-file HTML, generated frame data и itch upload weight.

Критично: production build уже около 8.9 MB HTML / 4.1 MB gzip; без бюджета контент может незаметно убить мобильную загрузку.

Ownership: `vite.config.ts`, `scripts/build-itch.mjs`, `package.json`, новый `scripts/build-size-report.mjs`.

Читать: `README.md`, `package.json`, `src/data/bad_apple_frames.ts`, `scripts/build-itch.mjs`.

Deliverables:
- build size report по HTML, gzip, generated data, sprite/texture code buckets if feasible;
- warning threshold, не hard fail на первом проходе;
- README/release notes explain acceptable growth.

Проверки: `npm run build`, `node scripts/build-size-report.mjs`, `npm run itch:build`.

Параллельные ограничения: не удалять контент ради размера; сначала измерение и бюджет.
