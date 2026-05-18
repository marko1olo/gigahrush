# LOG FLOOR21_DARKNESS

## Final Report

What was done: Added `src/gen/design_floors/darkness.ts` as a self-contained future design floor for route id `darkness` at planned z=40. It generates a compact post-Void anti-floor where light is represented by sparse lamps/candles, flashlight/lamp-bulb resources, room reveal costs, local quest metadata, and Darkness state stored per generated `World`.

Playable slice: The floor has a readable spawn room, a lamp-survival route with Nika, a name-recovery registry for `tamara_belova`, a shadow-toll room with bounded Shadow spawns, a longer unlit bypass, a return-trace room, containers/notes for choices, and a helper that publishes a structured return-trace event for future Living/Ministry/Yakov hooks.

Scope kept: No new `FloorLevel`, no global darkness system, no render/map rewrite, no final victory flow edits, and no unbounded shadow spawning. The debug entry is exposed as `DARKNESS_DEBUG_ENTRY` metadata for a future integrator rather than patched into `main.ts` or `systems/debug.ts`.

Cinematic cheats used: Light budget is compact local metadata plus existing flashlight durability and lamp-bulb items, not a new global resource simulation. Room labels are stored as hidden/revealed label data, with only initially revealed labels written to `world.rooms`; future route integration can consume the local state without changing renderer ownership.

Validation: Baseline `npm run build` passed before edits. Final `npm run typecheck` and final `npm run build` passed after the Darkness module and small no-unused cleanup in adjacent design-floor files. `npm run check` was skipped because no routed gameplay, render, map, save/load, or shared system behavior changed.
