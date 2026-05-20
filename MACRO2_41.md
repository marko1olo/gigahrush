# MACRO2_41: Vertical Danger Distribution Retune

Модель: GPT-5.5, reasoning extra high.

Цель: danger should reflect route band, descent/upward pressure and anomaly, not saturate by raw `abs(z)` alone.

Критично: if every far z gap is high danger, vertical route loses rhythm and preparation choices flatten.

Ownership: `src/data/procedural_floors.ts`, `tests/procedural-floors.test.ts`.

Читать: `README.md Floors`, `desdoc.md Vertical Route UX`, `src/data/procedural_floors.ts`.

Deliverables:
- danger distribution snapshot by z/seed;
- route bands: upper bureaucracy/roof, residential, industrial, hell/void each have distinct pressure;
- anomalies add pressure without making every floor lethal.

Проверки: `npm run test:unit`, generated deck summary.

Параллельные ограничения: keep authored/story anchors unchanged.
