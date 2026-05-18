# AG116 UV Spotlight Status

## Preflight

- Prompt extracted: `AGENT_116_LIQUIDATOR_UV_SPOTLIGHT`.
- Required docs read: `README.md`, `architecture.md`, `desdoc.md` sections 16.1 and 16.6.
- Required source files read: `src/data/weapons.ts`, `src/data/items.ts`, `src/systems/inventory.ts`, `src/systems/ai/combat.ts`, `src/render/hud.ts`, `src/render/sprites.ts`.
- Baseline `npm run typecheck`: blocked, script is missing from `package.json`.

## Implementation Plan

- [x] Add a scarce `uv_spotlight` tool with finite battery durability.
- [x] Add bounded UV pulse handling in `systems`: short cone, no full lighting system.
- [x] Hook the tool into `main.ts` through the existing equipped-tool path.
- [x] Add HUD-only beam feedback and structured UV event types.
- [x] Place one reachable source in the Ministry liquidator archive cache and keep rare procedural spawn data.

## Result

- `uv_spotlight` is a tool, equipped through the utility slot.
- Hold `R` to fire short UV pulses. Each pulse drains one battery charge; the tool has 36 charges.
- Pulse effects are narrow: eyes get attack stun, spirits get stagger/pushback, dark surface marks are tinted into UV-visible residue.
- Events published: `uv_spotlight_used`, `uv_spotlight_target_affected`, `uv_spotlight_depleted`.
- Acquisition: rare procedural/HQ-storage spawn plus one fixed source in `Архив ликвидаторских дел` / `Шкаф боевой описи Л-47`.

## Validation

- Baseline `npm run typecheck`: blocked, script missing from `package.json`.
- `npx tsc --noEmit`: blocked by pre-existing unrelated errors; no UV files were reported.
- `npm run build`: passed. Existing warning: duplicate `govnyak_roll` key in `src/data/items.ts`.
- `npm run check`: blocked, script missing from `package.json`.
- `npm run test:unit`: blocked, script missing from `package.json`.
- `npm run smoke`: blocked, script missing from `package.json`.
- Direct smoke harness `node scripts/smoke-playability.mjs`: passed with nonblank HUD/WebGL samples.
