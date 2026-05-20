# MACRO2_100: Final Integration, Release Gate And Fact Pass

Модель: GPT-5.5, reasoning extra high.

Цель: merge completed MACRO2 work, resolve conflicts, run release checks, update only factual docs and produce a concise integration report.

Критично: parallel work is not done until the combined tree is verified in browser and docs match shipped behavior.

Ownership: `README.md`, `desdoc.md`, `architecture.md`, `package.json`, changed source/test files from completed branches.

Читать: `README.md`, `architecture.md`, `desdoc.md`, `package.json`, `MACRO2_PARALLEL_CONTRACT.md` if present.

Deliverables:
- collect changed files by lane and preserve unrelated dirty work;
- run `npm run check`, `npm run smoke` or `npm run check:full` where feasible;
- update README counters/behavior only after verified source and built game pass.

Проверки: `npm run check`, `npm run smoke`, `npm run artifacts:verify`/itch checks if those scripts exist.

Параллельные ограничения: no destructive git cleanup; fix real integration failures, do not hide them.
