# LOG_AG116_UV_SPOTLIGHT

## 2026-05-18

Implemented the liquidator UV spotlight slice.

- Added `uv_spotlight` as a scarce utility tool with 36 battery pulses.
- Added bounded UV pulse runtime in `src/systems/uv_spotlight.ts`: no lighting system, no full-world scan, short cone only.
- Added narrow counterplay: eye attack stun, spirit stagger/pushback, UV reveal tint for dark surface residue/hidden marks.
- Added HUD beam feedback through `uvBeamFx` / `uvBeamLen` and a cyan-violet canvas cone.
- Added structured events: `uv_spotlight_used`, `uv_spotlight_target_affected`, `uv_spotlight_depleted`.
- Added reachable source in the Ministry liquidator archive cache and included the tool in debug combat grant.

Validation:

- Baseline `npm run typecheck`: blocked; script missing.
- `npx tsc --noEmit`: blocked by unrelated existing errors outside the UV files.
- `npm run build`: passed; existing duplicate-key warning for `govnyak_roll`.
- `npm run check`, `npm run test:unit`, `npm run smoke`: blocked; scripts missing.
- `node scripts/smoke-playability.mjs`: passed.
