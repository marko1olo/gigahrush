# MACRO2_79: Anti-Paphos Text Pass

Модель: GPT-5.5, reasoning extra high.

Цель: apply the scenario tone bible to high-impact player-facing text: plot, dialogue, rumors, notes, contracts, barks.

Критично: ГИГАХРУЩ tone should be бытовой industrial horror, not generic cosmic/fantasy trailer prose.

Ownership: `src/data/plot.ts`, `src/data/dialogue.ts`, `src/data/context_lines.ts`, `src/data/rumors.ts`, `src/data/notes.ts`, `src/data/contracts.ts`, `src/systems/ai/barks.ts`.

Читать: `Docs/ScenarioWriters/01_glavred_tone_bible.md`, `README.md`, local data files.

Deliverables:
- replace vague/pompous strings with concrete item/action/route/risk language;
- preserve Russian and character voice differences;
- no direct thread/paste copying.

Проверки: `npm run typecheck`, `npm run content:audit`, targeted UI text test if changed lengths are risky.

Параллельные ограничения: data/text only; do not alter quest mechanics.
