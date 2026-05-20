# MACRO2_93: Procedural Audio Budget And Variant Sound Identity

Модель: GPT-5.5, reasoning extra high.

Цель: samosbor variants, ranged attacks, impacts and ambient drones have distinct procedural sound without audio spam.

Критично: Maronary/Istotit/Veretar are partly defined by sound; combat readability also depends on it.

Ownership: `src/systems/audio.ts`, `src/systems/samosbor.ts`, `src/systems/ai/combat.ts`, audio tests if feasible.

Читать: `README.md`, `Docs/ScenarioWriters/42_samosbor_common.md`, `43/44/45 variant docs`.

Deliverables:
- variant sound palette: siren/bell/beep/distant alarm;
- cooldown/cap for repeated cues;
- no imported audio assets.

Проверки: `npm run typecheck`, manual rare variant and firefight checks.

Параллельные ограничения: procedural browser audio only.
