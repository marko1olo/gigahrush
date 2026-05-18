# FLOOR19_UNDERHELL Status

## Preflight

- Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/underhell.md`.
- Read references: `src/gen/hell/index.ts`, `src/gen/hell/plot_chain.ts`, `src/gen/void/index.ts`, `src/systems/events.ts`.
- Baseline `npm run build`: passed before edits.
- Existing worktree was already heavily dirty before this task.

## Scope

- Owned module: `src/gen/design_floors/underhell.ts`.
- Docs: this file and `Docs/AgentLogs/LOG_FLOOR19_UNDERHELL.md`.
- No edits to Hell, Void, route manifests, core enums, debug menus or global systems.

## Implemented

- Added `generateUnderhellDesignFloor()` for future route id `underhell`, z `32`, with deterministic seed support.
- Stamped root tunnels, witness cells, black wells, a debt furnace, an inverted chapel and a Void cut gate.
- Registered four Underhell NPC quest surfaces: threshold payment, witness handling, debt burn and Void anchor cut.
- Represented ritual state as compact flags and exported helpers for threshold payment, witness resolution, debt burning and deterministic gate opening.
- Published debt and identity backlash through existing `WorldEvent` types and tags.

## Validation

- `npm run typecheck`: passed.
- Post-change `npm run build`: passed.
- `npm run check`: not run because this task did not wire route, save/load, debug travel or shared systems.

## Softlock Notes

- The generated route from spawn to gate is connected during generation.
- The Void gate opens deterministically when any threshold cost is paid and the anchor is broken.
- A debug/integrator hook can call `generateUnderhellDesignFloor({ forceOpenVoidGate: true })` for a direct smoke path.
