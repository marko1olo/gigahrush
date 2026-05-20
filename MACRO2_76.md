# MACRO2_76: Smoke Scenario Coverage Pack

Модель: GPT-5.5, reasoning extra high.

Цель: smoke covers current domains: slime sample, cult conflict, rare samosbor, numbered lift, return path and dense stress.

Критично: green unit tests do not prove the built browser game can perform the intended survival loop.

Ownership: `scripts/smoke-playability.mjs`, `src/systems/debug.ts`, `package.json`.

Читать: `README.md Debug`, `scripts/smoke-playability.mjs`, current debug command list.

Deliverables:
- named smoke scenarios for expedition, third-wave/slime-cult, rare-samosbor, numbered-lift, stress, mobile, net;
- each scenario reports skipped domain with reason instead of silent pass;
- perf frame option documented.

Проверки: `npm run smoke`, selected `SMOKE_SCENARIO=... npm run smoke`.

Параллельные ограничения: no smoke dependence on random timing where debug can force state.
