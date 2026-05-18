# AG17 Hospital Quarantine Log

## 2026-05-17

Implemented the AG17 quarantine slice as `src/gen/living/hospital_quarantine.ts`.

Delivered:
- Zone 38 protected medblock with triage, hermetic quarantine ward, med archive, and visible loot/props.
- NPCs: Мира Сортировочная, Лида Температурная, Юра Плесневой, Тарас Санпропуск, Варвара Морговая.
- Four side quests: two competing antibiotic patient paths, one quarantine medcard retrieval, one zombie outbreak cleanup.
- Locked/faction/secret quarantine containers with medicine and documents.
- `quarantine_medcard` item and four hospital contract definitions.
- Quarantine container events now carry tags into world-log text, so opened quarantine containers and stolen quarantine supplies/documents are readable facts.

Validation:
- Baseline `npm run build`: passed before edits.
- `npm run typecheck`: passed after implementation.
- Final `npm run build`: passed after implementation.
