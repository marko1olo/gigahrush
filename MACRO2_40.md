# MACRO2_40: Procedural Population Budget Sanity

Модель: GPT-5.5, reasoning extra high.

Цель: procedural floor NPC/monster counts are intentional, performant and readable, not accidental 5k crowds everywhere.

Критично: `PROCEDURAL_POPULATION_PROFILE` can make random interstitial floors heavier than intended expedition floors.

Ownership: `src/data/population_profiles.ts`, `src/gen/procedural_floor.ts`, `tests/population-profiles.test.ts`.

Читать: `scaling.md`, `README.md Procedural Floors`, `src/data/population_profiles.ts`.

Deliverables:
- explicit normal/high-density procedural profiles or rarity gate;
- counts scale by danger/anomaly/band with caps;
- deck summary test across all 62 z slots and several seeds.

Проверки: `npm run test:unit`, stress smoke where high profile is intended.

Параллельные ограничения: do not reduce authored `KVARTIRY`/`HELL` density in this task.
