# MACRO2_78: Active Docs Map And ScenarioWriters Cleanup

Модель: GPT-5.5, reasoning extra high.

Цель: decide and document status of `Docs/ScenarioWriters/**`, `scenarist.md`, `gatbage/**` and active doc map.

Критично: there are 964 markdown files; agents need to know source of truth versus historical context.

Ownership: `README.md`, `appendix.md`, `Docs/ScenarioWriters/README.md` if created, `desdoc.md`.

Читать: `README.md Documentation Map`, `appendix.md`, `Docs/ScenarioWriters/*.md`.

Deliverables:
- active/archive status for scenario writer docs;
- no duplicate source-of-truth claims;
- short rules for using scenario docs in content text passes.

Проверки: docs grep for old `Docs/Tasks`/`AgentPrompts` recreation instructions; `npm run typecheck` if no source changed not required but okay.

Параллельные ограничения: no mass deletion of historical docs.
