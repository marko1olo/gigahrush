# MACRO2_3: Release Artifact Freshness Gate

Модель: GPT-5.5, reasoning extra high.

Цель: гарантировать, что tracked `dist/`, `itch/` и zip/HTML артефакты соответствуют текущему исходному билду.

Критично: дерево грязное, `dist/index.html` tracked, а stale single-file build может выглядеть как успешный релиз при сломанном исходнике или наоборот.

Ownership: `scripts/build-itch.mjs`, `package.json`, `README.md`, новый `scripts/verify-artifacts.mjs`.

Читать: `README.md`, `package.json`, `scripts/build-itch.mjs`, `vite.config.ts`, `itch/ITCH_UPLOAD_NOTES.txt`.

Deliverables:
- `npm run artifacts:verify` сравнивает timestamp/hash текущего build output с tracked artifacts;
- zip listing проверяет root `index.html` и PWA assets;
- README описывает релизный порядок без обещаний сверх shipped behavior.

Проверки: `npm run build`, `npm run itch:build`, `npm run artifacts:verify`, `npm run smoke`.

Параллельные ограничения: не решать за проект, должны ли артефакты быть tracked; только сделать drift явным.
