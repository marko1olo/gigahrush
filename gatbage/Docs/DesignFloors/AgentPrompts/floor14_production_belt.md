# FLOOR14_PRODUCTION_BELT

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Production Belt design floor.

<AGENT_PROMPT id="FLOOR14_PRODUCTION_BELT">
PROMPT IDENTIFIED: FLOOR14_PRODUCTION_BELT | DOMAIN: Design floor / Production / Factory output | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/production_belt.md`.
2. Read references: `src/systems/production.ts`, `src/data/factories.ts`, `src/data/resources.ts`, `src/gen/maintenance/concentrate_press.ts`, `src/systems/containers.ts`.
3. Create `Docs/Tasks/Status_FLOOR14_PRODUCTION_BELT.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR14_PRODUCTION_BELT.md`.
5. Run baseline `npm run build`.

## Goal

Implement a factory floor where repair, sabotage, work shifts and output-container theft drive economy and route consequences.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/production_belt.ts`
- Optional local production data file
- `Docs/Tasks/Status_FLOOR14_PRODUCTION_BELT.md`
- `Docs/AgentLogs/LOG_FLOOR14_PRODUCTION_BELT.md`

Forbidden:
- Do not add live conveyor physics.
- Do not scan factory cells every frame.
- Do not rewrite production/economy systems.

## Implementation Tasks

1. Export `generateProductionBeltDesignFloor()`.
2. Stamp factory lines, press rooms, loading docks, lockers and foreman office.
3. Add NPCs and quests for restore line, steal crate, bad batch and worker escort.
4. Put output into owner/access containers.
5. Update or define bounded factory state through existing production patterns.
6. Run `npm run check`.

## Done Means

One line produces tangible output, and the player can work, steal or sabotage with visible consequences.
</AGENT_PROMPT>

<POLISH_MANDATE>
If a machine exists only as decoration, either give it a decision or remove it. Production must affect play.
</POLISH_MANDATE>

