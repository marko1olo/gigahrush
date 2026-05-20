# MACRO2_92: PWA Mobile Fullscreen Deployment Check

Модель: GPT-5.5, reasoning extra high.

Цель: PWA manifest, service worker, icons, fullscreen/direct-page flow and Cloudflare/static deploy are verified.

Критично: mobile browser hosts and itch iframes are fragile; wrong fullscreen path can reload or trap input.

Ownership: `public/manifest.webmanifest`, `public/sw.js`, `src/pwa.ts`, `src/fullscreen.ts`, `mobile.md`, `scripts/build-itch.mjs`.

Читать: `mobile.md`, `README.md Cloudflare Net Sphere`, `src/fullscreen.ts`.

Deliverables:
- deploy checklist with direct-page/iframe/iOS distinctions;
- smoke/manual checks for manifest/icons/SW registration;
- no forced fullscreen on incompatible iOS path.

Проверки: `npm run build`, `npm run smoke`, manual mobile/live checks documented.

Параллельные ограничения: preserve desktop startup and pointer lock.
