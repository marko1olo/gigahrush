# MACRO2_77: Fifteen-Route Audit Pack

Модель: GPT-5.5, reasoning extra high.

Цель: выполнить и зафиксировать 15 ручных маршрутов из `desdoc.md Route Audit Pack`.

Критично: проекту нужен playability audit, not more nouns.

Ownership: `desdoc.md` compact route audit section, optional `appendix.md` note, no source unless obvious blocker.

Читать: `desdoc.md Route Audit Pack`, `README.md`, relevant source for each route.

Deliverables:
- route id, debug setup, lead source, decision, risk, reward/consequence, event ids, unreadable issue;
- at least one route per base floor plus procedural/numbered/rare samosbor;
- convert found blockers into follow-up MACRO/issue notes.

Проверки: `npm run typecheck` if docs-only no source touched; source fixes require relevant gate.

Параллельные ограничения: do not create `Docs/AgentLogs` or old task folders.
