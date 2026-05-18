# Status: FLOOR17_DARK_METRO

Date: 2026-05-18
Owner: Codex
Scope: `src/gen/design_floors/dark_metro.ts`

## Result

- Added the standalone future design-floor generator `generateDarkMetroDesignFloor(seed?)`.
- Kept the current shipped `FloorLevel` route and README facts untouched.
- Implemented authored station topology: station hall, platform, underpass, kiosk, signal room, blind tunnel and service exit.
- Added four registered NPC ids and side quests:
  - `dark_metro_light_platform`
  - `dark_metro_wrong_train`
  - `dark_metro_rescue_stranded`
  - `dark_metro_signal_box`
- Added compact packed state helpers for platform light, armed wrong route, signal box and stranded NPC state.
- Added deterministic route definitions with explicit clues, costs, destination hooks and safe fallback.
- Added `publishDarkMetroRouteEvent()` using existing `metro_route_taken` / `metro_wrong_stop` world events for future Market/Service/Hell hooks.

## Readability Notes

- Platform starts at weak light, not black.
- Blind tunnel keeps a low ambient floor plus candles/fog hints.
- The fallback route is represented by white-light landmarks back to the station hall.
- No moving train simulation or random player teleport was added.

## Validation

- Baseline `npm run build`: passed before implementation.
- Post-edit `npm run typecheck`: passed.
- Post-edit `npm run check`: passed.
- Direct compiled generator sanity check: passed.
  - `rooms=7`
  - `entities=13`
  - `containers=3`
  - `doors=10`
  - spawn is walkable and lit
  - deterministic armed route: `dark_metro_service_floor_shortcut`

## Notes For Integrator

- The module is not wired into `src/gen/floor_manifest.ts`.
- Container `floor` values use `FloorLevel.MAINTENANCE` as a temporary base because design floors do not have enum values yet.
- Future route integration should consume `DARK_METRO_ROUTES`, `initialDarkMetroState()` and `publishDarkMetroRouteEvent()` instead of adding route logic to render/debug.
