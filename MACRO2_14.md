# MACRO2_14: Projectile, Impact And Sound Cues

Модель: GPT-5.5, reasoning extra high.

Цель: сделать ranged combat readable through projectile sprites, impact marks, hit sounds and death cause.

Критично: ranged monsters and PSI threats punish open corridors; без telegraph игрок ощущает случайную смерть.

Ownership: `src/render/blood.ts`, `src/render/sprite_index.ts`, `src/render/sprites.ts`, `src/systems/audio.ts`, `src/systems/ai/combat.ts`.

Читать: `README.md Rendering`, `src/systems/ai/combat.ts`, `src/entities/*eye*`, `src/entities/paragraph.ts`.

Deliverables:
- distinct hostile projectile visuals for Eye/Paragraph/PSI/energy;
- wall/floor/body impact feedback with bounded marks;
- sound cues distance-aware and not overpowering siren.

Проверки: `npm run typecheck`, `npm run test:unit`, `npm run smoke`, manual debug spawn ranged pack.

Параллельные ограничения: avoid imported assets; procedural sprites/sound only.
