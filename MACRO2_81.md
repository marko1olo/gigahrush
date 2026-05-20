# MACRO2_81: Zhelemish Raw Use Sell Consequence

Модель: GPT-5.5, reasoning extra high.

Цель: Желемыш becomes a clear food/medicine/economy risk with raw/use/sell/NPC reaction paths.

Критично: user named желемыш; it should be ugly survival pressure, not a random item.

Ownership: `src/data/zhelemish_defs.ts`, `src/systems/status.ts`, `src/gen/living/zhelemish_cellar.ts`, `src/gen/living/fake_medpost_zhelemish.ts`, `src/data/rumors.ts`.

Читать: `README.md`, `src/data/zhelemish_defs.ts`, `src/gen/living/zhelemish_cellar.ts`.

Deliverables:
- raw/treat/sell choices visible in inventory/NPC/rumor;
- NPC reaction or contract consequence for risky sample/use;
- status effects are bounded and explainable.

Проверки: `npm run test:unit`, `npm run content:audit`, manual zhelemish cellar route.

Параллельные ограничения: no glamorized buff; survival tradeoff only.
