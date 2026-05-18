# FLOOR16_COLLECTORS

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: expanded Collectors design floor.

<AGENT_PROMPT id="FLOOR16_COLLECTORS">
PROMPT IDENTIFIED: FLOOR16_COLLECTORS | DOMAIN: Existing floor expansion / Maintenance / Water and pressure | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/collectors.md`.
2. Read references: `src/gen/maintenance/content_manifest.ts`, `src/gen/maintenance/pressure_station.ts`, `src/gen/maintenance/water_bridge.ts`, `src/gen/maintenance/overflow_sluice.ts`, `src/entities/tube_eel.ts`.
3. Create `Docs/Tasks/Status_FLOOR16_COLLECTORS.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR16_COLLECTORS.md`.
5. Run baseline `npm run build`.

## Goal

Add a Collectors/Maintenance expansion slice focused on water, pressure, tube monsters and cross-floor scarcity consequences.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/collectors.ts` or one new additive module under `src/gen/maintenance/`
- `Docs/Tasks/Status_FLOOR16_COLLECTORS.md`
- `Docs/AgentLogs/LOG_FLOOR16_COLLECTORS.md`

Allowed with caution:
- `src/gen/maintenance/content_manifest.ts` for one runner entry.

Forbidden:
- Do not add fluid simulation.
- Do not rewrite Maintenance generator topology.
- Do not spawn unbounded water monsters.

## Implementation Tasks

1. Add a water/pressure POI with drain/reroute decision.
2. Include NPCs for pressure permits, flooded maps, tube hunting and stolen parts.
3. Add quests for drain, tube eel hunt, pressure bridge and filter run.
4. Use existing water/pressure visual and container patterns.
5. Publish one scarcity/access event affecting another floor by id.
6. Run `npm run check`.

## Done Means

One water or pressure choice changes later scarcity/access, and the floor remains navigable after the event.
</AGENT_PROMPT>

<POLISH_MANDATE>
Prefer a clear valve choice over a complex puzzle. The player should understand what gets water and what loses it.
</POLISH_MANDATE>

