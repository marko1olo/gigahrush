# rework_06_combat_camera_feedback

Target model: GPT-5.5 worker.

Mode: implementation worker. Preserve current dirty UI/input work.

## Goal

Make combat and camera feel understandable before tuning combat balance.

The issue is not only difficulty. The first click, pointer lock, crosshair, weapon state, hit feedback and vertical aim can all fail to communicate.

## Feedback This Addresses

- Combat feels muddy.
- Player does not know whether a click fired.
- Browser mouse capture/fullscreen behavior is unclear.
- FOV/camera feels wrong on wide windows.
- Players can die before understanding what hit them.

## Mandatory Intake

Read:

- `README.md`
- `architecture.md`
- `src/input.ts`
- `src/main.ts`
- `src/fullscreen.ts`
- `src/render/title_ui.ts`
- `src/data/languages.ts`
- `src/render/hud.ts`
- `src/render/webgl.ts`
- `src/systems/controls.ts`
- `src/systems/damage.ts`
- `src/systems/inventory.ts`
- `src/systems/ai/combat.ts`
- relevant monster attack/telegraph code in `src/systems/ai/monster.ts`

Run `git status --short`.

## Current Facts To Verify

- Render FOV is already approximately 60 degrees, not 90.
- The game renders a low-resolution canvas and stretches it to the viewport.
- First canvas click requests pointer lock; shooting with mouse starts only after pointer lock.
- Combat feedback surfaces exist but may be hidden by UI defaults.
- Pitch can move enough that new players may aim into floor/ceiling.

## Non-Goals

- Do not raise FOV first.
- Do not rewrite renderer projection in a broad pass unless aspect distortion is proven and validated.
- Do not rebalance all weapons.
- Do not add a physics engine or external dependency.

## Implementation Direction

Start with communication:

1. Title/start hint:
   - click captures mouse
   - `ЛКМ/Пробел` attack
   - `E` confirm/send instead of Enter
   - `Enter` menu/back instead of Esc
   - `F11` fullscreen
   - `Tab` controls
   - `U` interface

2. Pointer-lock overlay or one-time center prompt:
   - before lock: `Кликните по игре: мышь будет захвачена для обзора`
   - explain that Esc belongs to browser pointer-lock release, while in-game back/close is `Enter`
   - after lock: disappear

3. Novice combat feedback:
   - crosshair visible
   - weapon panel visible
   - hit/miss/resource messages visible
   - damage cause visible

4. Pitch safety:
   - consider smaller default pitch range or gentle auto-return when not actively looking vertically.
   - verify projectiles still aim correctly.

5. Melee threat pre-hit:
   - add or expose a short directional/screen cue when an enemy enters melee threat range.
   - keep bounded through existing entity index or AI state, not full-world scans.

## Suggested File Ownership

Likely touched:

- `src/data/languages.ts`
- `src/render/title_ui.ts`
- `src/input.ts`
- `src/main.ts` for pointer-lock/camera wiring
- `src/render/hud.ts` for prompt/feedback if not owned elsewhere
- tests for controls/title helpers if available

Possible:

- `src/render/webgl.ts` only if aspect-correct rendering is explicitly in scope and validated.

Avoid:

- One-off combat-specific code in broad AI.
- Renderer-owned gameplay state.
- Hidden changes to weapon stats without visible design reason.

## Acceptance Criteria

- A first-time desktop player understands why the first click may capture mouse.
- Attack feedback is visible in novice/default preset.
- Damage feedback cannot be disabled without another clear cue.
- FOV is not made wider as a knee-jerk response.
- Any pitch/aspect change is validated with browser screenshots.

## Verification

```bash
npm run typecheck
npm run test:unit
npm run check:browser
```

Manual validation:

- fresh desktop run
- click-to-lock flow
- shoot target in Barni's range
- wide desktop viewport
- mobile/compact viewport if title text changed
