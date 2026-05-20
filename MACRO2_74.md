# MACRO2_74: Test TypeScript Config Decision

Модель: GPT-5.5, reasoning extra high.

Цель: decide whether `tsconfig.test.json` is active, stale or should be wired into scripts.

Критично: dormant test config creates false confidence about Node test compilation.

Ownership: `tsconfig.test.json`, `package.json`, README command docs if changed.

Читать: `package.json`, `tsconfig.json`, `tsconfig.test.json`, `tests/**`.

Deliverables:
- either `npm run test:compile` uses it, or file is documented/removed;
- no duplicate incompatible module expectations;
- CI-like command matrix remains clear.

Проверки: `npx tsc -p tsconfig.test.json` or replacement script, `npm run test:unit`.

Параллельные ограничения: no new test framework dependency.
