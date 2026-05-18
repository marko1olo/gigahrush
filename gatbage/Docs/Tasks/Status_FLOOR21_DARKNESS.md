# Status_FLOOR21_DARKNESS

Agent: FLOOR21_DARKNESS  
Domain: Design floor / Post-Void darkness / Light resource  
Prompt source: `Docs/DesignFloors/AgentPrompts/floor21_darkness.md`

## Preflight Record

- Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, and `Docs/DesignFloors/darkness.md`.
- Read references: `src/gen/void/index.ts`, `src/render/webgl.ts`, `src/render/hud_fx.ts`, `src/render/map_ui.ts`, and `src/entities/shadow.ts`.
- Baseline `npm run build`: passed before Darkness edits.

## Implementation

- [x] Added `src/gen/design_floors/darkness.ts`.
- [x] Exported `generateDarknessDesignFloor()`.
- [x] Built a small authored post-Void layout with entry, lamp post, hidden-name registry, shadow toll, unlit bypass, and return-trace room.
- [x] Added local Darkness state through `getDarknessState(world)`: light budget, revealed room ids, preserved name id, toll state, room labels, quest metadata, and return-trace flag.
- [x] Added NPC/quest surfaces for Nika's lamp survival, the lost name, shadow toll, and return trace.
- [x] Added `publishDarknessReturnTrace()` using existing structured events with `darkness`, `return_trace`, `living_hook`, `ministry_hook`, and `yakov_hook` tags.
- [x] Kept route/debug integration exported as metadata only; wiring into `FloorLevel`, debug travel, save/load, and README remains integrator-owned per the design-floor contract.

## Validation

- `npm run typecheck`: passed.
- Final `npm run build`: passed.
- `npm run check`: not run; this change does not alter render, map, save/load, AI, inventory, economy, quests, or generation routing. The new generator compiles but is not yet wired into the shipped route.

## Notes

- Darkness uses existing items and systems: `flashlight`, `lamp_bulb`, `overexposed_photo`, notes, containers, sparse lamps/candles, Shadow monsters, Eye monster, and the world event store.
- During validation, two adjacent untracked design-floor modules had pre-existing no-unused blockers; they were mechanically cleaned so full workspace typecheck could run.
