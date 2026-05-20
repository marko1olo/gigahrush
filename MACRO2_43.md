# MACRO2_43: Procedural Loot Placement And Containers

Модель: GPT-5.5, reasoning extra high.

Цель: procedural floors create reachable, meaningful loot decisions through containers/stashes, not loose unreachable drops.

Критично: loot is the reason to risk interstitial floors; if it is scattered or blocked, contracts and scarcity suffer.

Ownership: `src/gen/procedural_floor.ts`, `src/data/procedural_floors.ts`, `src/data/container_defs.ts`, `tests/procedural-floors.test.ts`.

Читать: `README.md Economy, Containers And Production`, `src/systems/containers.ts`.

Deliverables:
- reachable stash/container placement by danger/anomaly/faction;
- value caps and contamination/theft tags;
- no unreachable item drops in reachability audit.

Проверки: `npm run test:unit`, `npm run content:audit`.

Параллельные ограничения: no new item ids unless existing loot tables cannot express the decision.
