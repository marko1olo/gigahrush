1. **Detect iOS and implement scrollTo trick in src/main.ts**:
   - In `src/main.ts`, add the import statement `import { isStandaloneDisplay } from './pwa';`.
   - Add a global variable `const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);`.
   - Inside `bootInitialGameOrTitle()`, add:
     ```typescript
     if (isIOS && !isStandaloneDisplay()) {
       window.scrollTo(0, 1);
     }
     ```

2. **Handle WebGL Context Loss in src/main.ts**:
   - Re-evaluate where `webglcontextlost` logic should be added since `textures`, `sprites`, `world` are not accessible before initialization and tests will complain if variables are potentially uninitialized.
   - We can place the listeners in `src/main.ts` near the bottom of file setup, or add `?` guards for safety:
     ```typescript
     canvas.addEventListener('webglcontextlost', (e) => {
       e.preventDefault();
     });
     canvas.addEventListener('webglcontextrestored', () => {
       if (started && typeof state !== 'undefined' && typeof world !== 'undefined') {
         disposeWebGL();
         initWebGL(canvas, textures, sprites, world);
       }
     });
     ```

3. **Update CSS for Safe Area in src/index.css**:
   - Add `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);` to the `body` block in `src/index.css`.

4. **Update Fullscreen Fallback Logic in src/mobile.ts and src/fullscreen.ts**:
   - In `src/fullscreen.ts`, change `function isIosWebKit(): boolean {` to `export function isIosWebKit(): boolean {`.
   - In `src/mobile.ts`, add `isIosWebKit` to the import from `./fullscreen`.
   - Modify `updateFullscreenUi` in `src/mobile.ts`: change `fullscreen.hidden = standalone || (!embedded && !nativeFullscreen);` to `fullscreen.hidden = standalone || (!embedded && !nativeFullscreen && !isIosWebKit());`.
   - Modify `fullscreen.addEventListener('pointerdown', e => { ... })` in `src/mobile.ts`: replace `if (!canUseMobileFullscreen()) return;` with:
     ```typescript
     if (!canUseMobileFullscreen()) {
       if (isIosWebKit()) {
         alert(mobileText({ ru: 'Для полного экрана добавьте игру на экран «Домой» (Поделиться -> На экран «Домой»)', en: 'For fullscreen, add the game to your Home Screen (Share -> Add to Home Screen)' }));
       }
       return;
     }
     ```

5. **Run tests**:
   - Run `npm run typecheck` to verify the changes compile correctly.
   - Run unit tests using `npx tsx --test scripts/run-unit-tests.mjs`.

6. **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
