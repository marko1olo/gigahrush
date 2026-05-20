# MACRO2_49: Samosbor Aftermath On Design And Procedural Floors

Модель: GPT-5.5, reasoning extra high.

Цель: route floors get deterministic aftermath without losing authored state, anomaly state or route identity.

Критично: samosbor must alter expeditions across the whole vertical route, not only story floors.

Ownership: `src/systems/samosbor.ts`, `src/data/samosbor_variants.ts`, `src/gen/design_floors/*.ts` only through narrow hooks, tests.

Читать: `README.md Samosbor`, `src/systems/procedural_floors.ts`, `src/gen/design_floors/manifest.ts`.

Deliverables:
- generic aftermath hook keyed by current route entry;
- procedural anomaly state remains valid after rebuild;
- visible residue: mark, loot, blocked door, rumor, changed room state.

Проверки: `npm run test:unit`, debug force samosbor on design/procedural floors.

Параллельные ограничения: avoid content-specific branches in `main.ts`.
