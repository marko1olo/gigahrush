# FLOOR10_COMMUNAL_RING

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Communal Ring design floor.

<AGENT_PROMPT id="FLOOR10_COMMUNAL_RING">
PROMPT IDENTIFIED: FLOOR10_COMMUNAL_RING | DOMAIN: Design floor / Communal services / Residential loop | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/communal_ring.md`.
2. Read references: `src/gen/living/apartments.ts`, `src/gen/living/domkom_laundry_pack.ts`, `src/gen/kvartiry/communal_kitchen_feud.ts`, `src/systems/containers.ts`.
3. Create `Docs/Tasks/Status_FLOOR10_COMMUNAL_RING.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR10_COMMUNAL_RING.md`.
5. Run baseline `npm run build`.

## Goal

Implement an apartment-like communal service floor with a ring corridor, laundries, kitchens, showers, pantries and notice-board conflicts.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/communal_ring.ts`
- Optional local communal data file
- `Docs/Tasks/Status_FLOOR10_COMMUNAL_RING.md`
- `Docs/AgentLogs/LOG_FLOOR10_COMMUNAL_RING.md`

Forbidden:
- Do not clone the full Living apartment generator.
- Do not create a huge repetitive loop without landmarks.
- Do not overwrite `aptMask` behavior in existing Living code.

## Implementation Tasks

1. Export `generateCommunalRingDesignFloor()`.
2. Stamp a navigable loop with landmark services.
3. Add NPCs and quests for laundry, notice dispute, pantry theft and shower pressure.
4. Gate shared supplies through containers and witnesses.
5. Add one samosbor aftermath state for a service room.
6. Run `npm run typecheck`; run `npm run check` if systems change.

## Done Means

The floor feels residential but distinct from Living and Kvartiry, with three services that each create a player decision.
</AGENT_PROMPT>

<POLISH_MANDATE>
Walk the loop mentally from spawn. If all corridors look equivalent, add landmarks before adding more rooms.
</POLISH_MANDATE>

