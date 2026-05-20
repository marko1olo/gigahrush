# MACRO2_91: Save Load Runtime State Normalization

Модель: GPT-5.5, reasoning extra high.

Цель: save/load restores or safely invalidates all new runtime states: FloorRun, instances, index-independent entities, production, economy, banking, editor patches, events.

Критично: early dev can invalidate stale saves, but silent corrupt state wastes playtests.

Ownership: `src/main.ts` save/load sections, involved system `*ForSave/normalize*` helpers, save tests.

Читать: `README.md Save And Load`, `src/main.ts`, `src/systems/*ForSave*`.

Deliverables:
- save shape version or explicit normalization notes;
- tests for old/missing fields and active procedural/design/floor-instance saves;
- no all-entity giant save payload by accident.

Проверки: `npm run test:unit`, manual save/load across route floor and samosbor.

Параллельные ограничения: do not promise backward compatibility for every stale dev save; normalize or invalidate explicitly.
