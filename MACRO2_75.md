# MACRO2_75: CI-Like Script Matrix

Модель: GPT-5.5, reasoning extra high.

Цель: make npm scripts express readonly, browser, release and full gates clearly.

Критично: agents need to know which commands write artifacts and which are safe preflight checks.

Ownership: `package.json`, `README.md`, `cloudflare.md`, `mobile.md`.

Читать: `package.json`, `README.md Build And Commands`, current validation instructions.

Deliverables:
- scripts like `check:readonly`, `check:browser`, `check:release` if useful;
- docs identify commands that write `dist/`, `itch/` or require Cloudflare/Chrome;
- no change to existing `check` semantics unless justified.

Проверки: run all new scripts or document environment blockers.

Параллельные ограничения: no dependency additions.
