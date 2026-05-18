# FLOOR09_MANHATTAN_CROSSROADS

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Manhattan Crossroads design floor.

<AGENT_PROMPT id="FLOOR09_MANHATTAN_CROSSROADS">
PROMPT IDENTIFIED: FLOOR09_MANHATTAN_CROSSROADS | DOMAIN: Design floor / Road grid / Crosswalks | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/manhattan_crossroads.md`.
2. Read references: `src/gen/procedural_floor.ts`, `src/gen/shared.ts`, `src/render/marks.ts`, `src/render/textures.ts`.
3. Create `Docs/Tasks/Status_FLOOR09_MANHATTAN_CROSSROADS.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR09_MANHATTAN_CROSSROADS.md`.
5. Run baseline `npm run build`.

## Goal

Implement the requested indoor Manhattan-like road floor with asphalt avenues, two-way lanes, white divider lines and zebra crossings.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/manhattan_crossroads.ts`
- Optional local road-mark helper inside the same file
- `Docs/Tasks/Status_FLOOR09_MANHATTAN_CROSSROADS.md`
- `Docs/AgentLogs/LOG_FLOOR09_MANHATTAN_CROSSROADS.md`

Forbidden:
- Do not add vehicle physics.
- Do not add a traffic simulation.
- Do not edit core texture enums unless an integrator owns the texture expansion.

## Implementation Tasks

1. Export `generateManhattanCrossroadsDesignFloor()`.
2. Generate orthogonal avenues, cross streets, blocks, sidewalks/service edges and intersections.
3. Add asphalt floor treatment using existing textures/marks first.
4. Add white divider lines and striped crossings using marks or existing texture tricks.
5. Add NPCs/quests for junction control, zebra escort, stolen cargo and wrong turn.
6. Run `npm run typecheck`; run `npm run check` if render/texture changes are made.

## Done Means

The floor reads instantly as roads and crossings, has at least one three-approach junction and supports a playable crossing/escort decision.
</AGENT_PROMPT>

<POLISH_MANDATE>
Take special care with readability. If the road markings are not visible from raycaster view and map view, adjust scale or contrast.
</POLISH_MANDATE>

