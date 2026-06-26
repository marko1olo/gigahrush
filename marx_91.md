# План Агента: marx_91
## Роль
Вы — один из 100 агентов, выполняющих МЕГА-АПДЕЙТ для проекта ГИГАХРУЩ. Ваша задача №91.

## ⚠️ ОБЩИЕ ПРАВИЛА ДЛЯ ВСЕХ АГЕНТОВ (AGENTS.md)
1. **Никакого хардкода и костылей.** Системы должны быть расширяемыми и опираться на `src/data/`.
2. **Пятислойная архитектура:** `core/` -> `data/` -> `gen/` -> `systems/` -> `render/`. Никакого геймплея в `render/`.
3. **Iron Law (Оптимизация):** Никаких тяжелых поисков (BFS) в реалтайме во время симуляции.
4. Уважайте мобильную платформу и производительность (без лишних DOM манипуляций).
5. **Максимальная независимость:** Все агенты (Жюли) работают параллельно и абсолютно независимо друг от друга.
6. **Полная автономность:** НЕ задавайте пользователю вопросы и не просите советов. Обязательно принимайте все архитектурные, кодовые и дизайнерские решения самостоятельно!
7. **Обязательный коммит и PR:** Обязательно делайте `git commit` ваших изменений и создавайте Pull Request (или делайте пуш) после завершения работы.

## Текущая задача
**Мобильная версия: Fullscreen на iPhone (убрать панели Safari).**



### Контекст задачи
Fullscreen на iPhone — НЕТРИВИАЛЬНАЯ задача, но РЕШАЕМАЯ. Факт: на практике полный экран (без Safari UI, буквально игра на весь экран) иногда РАБОТАЕТ на iPhone — это подтверждено. Значит, технически возможно. Но проблемы:

1. **Fullscreen API** (`element.requestFullscreen()`) — НЕ поддерживается iOS Safari. Вообще.
2. **PWA standalone mode** (`display: standalone` в manifest) — работает если добавить на Home Screen. Но не все пользователи это делают.
3. **`minimal-ui`** viewport — deprecated, нестабильное поведение.
4. **Scroll-to-hide** — Safari скрывает панели при скролле. Можно имитировать `window.scrollTo(0, 1)` при загрузке.
5. **WebGL context loss** — при fullscreen transition iOS Safari может потерять WebGL контекст → КРАШ. Нужен `webglcontextlost` / `webglcontextrestored` handler.
6. **Перезагрузка** — iPhone иногда перезагружает вкладку при выходе из fullscreen (memory pressure).

**Стратегия**: Многоуровневый fallback chain, от лучшего к худшему:
- Уровень 1: PWA standalone (Add to Home Screen) → настоящий fullscreen
- Уровень 2: `scrollTo` trick + viewport meta → скрыть Safari chrome
- Уровень 3: Максимизация viewport + `env(safe-area-inset-*)` → хотя бы без notch обрезки

### Конкретные файлы и паттерны
- **`index.html`**: meta tags: `<meta name="apple-mobile-web-app-capable" content="yes">`, `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`, viewport с `viewport-fit=cover`.
- **`manifest.json`** (или `manifest.webmanifest`): `"display": "standalone"`, `"orientation": "landscape"` для PWA path.
- **`src/input.ts`** или **`src/main.ts`**: Fullscreen logic. Добавить:
  1. Detect iOS: `const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)`
  2. При первом тапе: `window.scrollTo(0, 1)` (scroll-to-hide trick)
  3. Detect standalone: `window.navigator.standalone === true` → уже fullscreen, skip всё
  4. Fallback: показать overlay «Добавьте на главный экран для полного экрана»
- **WebGL safety**: В `src/render/webgl.ts` — добавить `canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); /* save state */ })` и `webglcontextrestored` → reinit. Это КРИТИЧНО — fullscreen transition может убить контекст.
- **CSS**: `html, body { height: 100%; overflow: hidden; } body { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }`
- **Тестирование**: Обязательно тестировать на РЕАЛЬНОМ iPhone (не эмулятор). Проверить: 1) обычный Safari, 2) PWA с Home Screen, 3) переключение вкладок, 4) lock/unlock screen.

### Детальная спецификация по Архитектуре и Реализации (Строго обязательно к исполнению)
Вам необходимо детально интегрировать вашу задачу в существующие слои проекта. Ниже приведены конкретные архитектурные требования, релевантные вашей задаче:

#### 🛠 Общие Архитектурные Рекомендации
Ваша задача базовая, но не забывайте о разделении: логика строго в `systems/`, данные строго в `data/`, стейт сохраняемый. Никакого хардкода.

## Ваши шаги:
1. Прочитать соответствующие файлы (AGENTS.md, README.md, и исходники).
2. Реализовать фичу строго по контрактам архитектуры.
3. Добавить данные/интерфейсы/логику, проверить типы (`npm run typecheck`).
4. Написать или обновить модульные тесты при необходимости.
5. Убедиться, что функционал расширяем.
6. Закоммитить изменения (`git commit`) с подробным описанием.
7. Создать Pull Request (или запушить ветку).
8. Обязательно задокументировать свои архитектурные решения в файле задачи (или в PR), чтобы Оркестратор мог это проверить.

---
*Ожидается, что вы завершите задачу и оставите проект в компилируемом состоянии.*
