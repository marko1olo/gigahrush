# Mobile Port Guide

This document is a practical checklist for adding mobile support to an already
working browser game without breaking the desktop build.

Use it when a game already works on PC and needs the minimum mobile layer:
movement, camera rotation, menu buttons, correct viewport sizing, and reliable
deployment to itch.io / static hosts / Cloudflare.

## Goal

Keep the desktop implementation intact. Add a mobile input and layout layer that
feeds the same game state and movement functions as keyboard/mouse input.

Do not rewrite gameplay, rendering, maps, AI, saving, audio, or desktop input
unless mobile support exposes a real compatibility bug.

## First Check The Real Build

Before changing code, verify what is actually served:

```bash
npm run build
npm run preview
curl -L https://your-live-url.example/ | rg "mobile-controls|viewport-fit|touch"
```

If a phone shows the old UI, the problem may be deployment/cache, not code.
Always check the live URL after deploying. In this project, the local build was
fixed, but `workers.dev` still served an older bundle until Wrangler deployed
the new `dist/`.

## Preserve Desktop Input

Keep keyboard and mouse paths working exactly as before:

- Do not remove `keydown` / `keyup`.
- Do not remove pointer lock or mouse look.
- Do not make desktop depend on touch events.
- Add mobile input values to the existing input values, then clamp to `-1..1`.

Pattern:

```ts
let forward = keyboardForward;
let strafe = keyboardStrafe;
let rotate = keyboardRotate;

forward = clampInput(forward + touchInput.forward);
strafe = clampInput(strafe + touchInput.strafe);
rotate = clampInput(rotate + touchInput.rotate);

movePlayer(state, forward, strafe, rotate, dt);
```

This keeps the gameplay system unchanged.

## Prefer Pointer Events

Use `pointerdown`, `pointermove`, `pointerup`, `pointercancel`, and
`lostpointercapture`. They work for touch, mouse, and stylus and avoid separate
touch/mouse code.

Use pointer capture so the control does not get stuck when the finger leaves the
button:

```ts
function capturePointer(target: EventTarget | null, pointerId: number): void {
	if (target instanceof HTMLElement) {
		target.setPointerCapture(pointerId);
	}
}

function releasePointer(target: EventTarget | null, pointerId: number): void {
	if (target instanceof HTMLElement && target.hasPointerCapture(pointerId)) {
		target.releasePointerCapture(pointerId);
	}
}
```

Always reset mobile input on:

- `pointerup`
- `pointercancel`
- `lostpointercapture`

## Touch Controls

For a first-person canvas game, two simple virtual pads are usually enough:

- left pad: forward/back and strafe
- right pad: camera rotation

Keep controls as an overlay above the canvas:

```svelte
{#if touchControlsEnabled}
	<div class="mobile-controls pointer-events-none absolute inset-0">
		<button class="mobile-pad mobile-pad--move pointer-events-auto">...</button>
		<button class="mobile-pad mobile-pad--turn pointer-events-auto">...</button>
	</div>
{/if}
```

The wrapper should be `pointer-events: none`; the actual controls should be
`pointer-events: auto`. This prevents the overlay from blocking the game except
where controls are meant to be touched.

Use `button` elements, not plain `div`s, unless there is a strong reason. Add
short `aria-label`s.

## Do Not Rely Only On CSS Media Queries

`@media (hover: none)` and `(pointer: coarse)` are useful, but not sufficient on
real phones, embedded browsers, and game portals.

Prefer explicit runtime detection:

```ts
function shouldUseTouchControls(): boolean {
	const ua = navigator.userAgent;
	const mobileUa = /android|iphone|ipad|ipod|mobile/i.test(ua);
	const touchCapable = navigator.maxTouchPoints > 0 || 'ontouchstart' in globalThis;
	const compactViewport = Math.min(window.innerWidth, window.innerHeight) < 900;
	return mobileUa || (touchCapable && compactViewport);
}
```

Update this on resize and `visualViewport.resize`.

Desktop machines with a touch screen should not automatically lose the desktop
experience. The compact viewport check helps avoid showing pads on large
desktop displays.

## Viewport And Page CSS

For mobile browser games, set the viewport and disable page gestures:

```html
<meta
	name="viewport"
	content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no"
/>
```

Global CSS:

```css
html,
body,
#app {
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	overflow: hidden;
	overscroll-behavior: none;
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
	background: #000;
}
```

Use `100dvh` for the app root when possible:

```svelte
<div class="h-screen w-screen overflow-hidden bg-black" style="height: 100dvh;">
```

This avoids incorrect sizing around mobile browser address bars.

## Canvas Sizing

Do not rely only on `window.innerWidth` / `innerHeight` on mobile. Prefer
`visualViewport` when available:

```ts
const viewport = globalThis.visualViewport;
const width = viewport?.width ?? window.innerWidth;
const height = viewport?.height ?? window.innerHeight;
canvas.width = Math.max(1, Math.round(width));
canvas.height = Math.max(1, Math.round(height));
```

Listen to:

- `window.resize`
- `visualViewport.resize`
- `visualViewport.scroll`

This handles address bar collapse, rotation, and embedded browsers.

## Safe Areas

Position mobile pads with safe-area insets:

```css
.mobile-pad {
	bottom: max(1rem, env(safe-area-inset-bottom));
}

.mobile-pad--move {
	left: max(1rem, env(safe-area-inset-left));
}

.mobile-pad--turn {
	right: max(1rem, env(safe-area-inset-right));
}
```

If the game has bottom subtitles or HUD text, move it above the pads on mobile:

```css
.message-bar--mobile {
	bottom: calc(max(1rem, env(safe-area-inset-bottom)) + 7.25rem);
}
```

## Menus

Canvas menus should use pointer events, not click-only logic:

```svelte
<canvas
	onpointerup={onMenuClick}
	onpointermove={onMenuMove}
	onpointerleave={onMenuLeave}
/>
```

Keep the same hit-test math, but make the displayed canvas responsive:

```css
width: min(640px, 100vw, calc(100dvh * 0.91));
height: auto;
touch-action: manipulation;
```

Fixed desktop menu sizes often overflow on phones.

## Audio Unlock

Mobile browsers block audio until a user gesture. Call the existing audio resume
function from first mobile interactions:

- menu pointer up
- movement pad pointer down
- turn pad pointer down
- canvas click / pointer interaction

Do not start new audio systems for mobile.

## Browser Compatibility

Do not assume `OffscreenCanvas` exists. Some iOS/Safari/WebView environments may
not support it, and game portals can use embedded browsers.

Use a fallback:

```ts
function createRenderCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
	if (typeof OffscreenCanvas === 'function') {
		return new OffscreenCanvas(width, height);
	}

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	return canvas;
}
```

Use the same fallback for temporary image canvases used by effects.

## Itch.io Package

For a single-file Vite build with copied public assets, zip the contents of
`dist`, not the `dist` folder itself:

```bash
npm run build
rm theater-itch.zip
(cd dist && zip -r -X ../theater-itch.zip index.html assets)
unzip -l theater-itch.zip
```

Expected shape:

```text
index.html
assets/
assets/sound/...
```

If `index.html` is nested inside `dist/` in the zip, itch.io may not open the
game correctly.

## Cloudflare Workers / Static Host

If the live URL is a Worker, pushing Git may not deploy it. Verify the actual
served HTML.

Useful checks:

```bash
curl -L https://your-worker.workers.dev/?check=1 | rg "mobile-controls|viewport-fit"
curl -I -L https://your-worker.workers.dev/?check=1
```

Deploy static assets with Wrangler when appropriate:

```bash
npm run build
npx wrangler deploy --name theater --assets dist --compatibility-date 2026-05-18
```

After deploy, re-check the live URL. Cloudflare may report cache hits even after
deploy; the content is what matters.

## Testing Checklist

Run local checks:

```bash
npm test
npm run build
npm run preview
```

Verify at least:

- desktop viewport: game starts, canvas is not blank, mobile controls are absent
- mobile viewport: game starts, canvas is not blank, both mobile pads are present
- mobile fallback without `OffscreenCanvas`: game still starts
- title/menu fits on a narrow screen
- message/HUD text is not hidden by pads
- existing keyboard/mouse still work on desktop

Headless checks are useful, but they are not enough. Test on a real phone before
declaring mobile done.

## Common Failure Signs

Phone shows the game but no controls:

- live site is still an old deployment
- controls depend only on `@media (hover: none)` / `(pointer: coarse)`
- controls exist but are behind another canvas or hidden by CSS
- overlay has `pointer-events: none` on the buttons too

Phone opens black screen or crashes before UI:

- unsupported browser API such as `OffscreenCanvas`
- audio context started outside a gesture and threw unexpectedly
- canvas size became `0x0`
- JavaScript bundle on live host is stale

Desktop regressed:

- touch code replaced keyboard/mouse instead of adding to it
- global `touch-action` or overlay blocks pointer lock
- controls are shown on desktop because the detection is too broad

## Final Rule

Mobile support is a thin adapter layer:

- same game state
- same movement function
- same render loop
- same content
- extra input source
- responsive canvas/page shell
- verified deployment

If the mobile port requires rewriting core gameplay, stop and re-check the
architecture. The safest mobile port is the one that changes the least.
