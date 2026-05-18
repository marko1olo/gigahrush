# FLOOR15_SERVICE_FLOOR

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Service Floor design floor.

<AGENT_PROMPT id="FLOOR15_SERVICE_FLOOR">
PROMPT IDENTIFIED: FLOOR15_SERVICE_FLOOR | DOMAIN: Design floor / Service access / Lift machines | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/service_floor.md`.
2. Read references: `src/systems/procedural_floors.ts`, `src/gen/maintenance/lift_repair_shaft.ts`, `src/gen/maintenance/content_manifest.ts`, `src/systems/events.ts`.
3. Create `Docs/Tasks/Status_FLOOR15_SERVICE_FLOOR.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR15_SERVICE_FLOOR.md`.
5. Run baseline `npm run build`.

## Goal

Implement a service/backstage floor with lift machines, staff corridors, breaker rooms, master-key scope and route/access flags.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/service_floor.ts`
- Optional local service data file
- `Docs/Tasks/Status_FLOOR15_SERVICE_FLOOR.md`
- `Docs/AgentLogs/LOG_FLOOR15_SERVICE_FLOOR.md`

Forbidden:
- Do not directly rewrite lift travel or save/load.
- Do not create a universal key that opens all doors.
- Do not edit `main.ts`.

## Implementation Tasks

1. Export `generateServiceFloorDesignFloor()`.
2. Stamp lift machine hall, breaker room, janitor depot, ventilation junction and staff canteen.
3. Add NPCs and quests for lift repair, master key, raid reroute and light restoration.
4. Represent route/lift/power outcomes as local flags and published events.
5. Add scoped key/access behavior only if it uses existing door/container patterns safely.
6. Run `npm run typecheck`; run `npm run check` if systems change.

## Done Means

One repair changes a route/access flag visible in debug or event logs, without hacking central lift travel.
</AGENT_PROMPT>

<POLISH_MANDATE>
Master-key content is dangerous. Confirm every opened thing belongs to a small scoped set, not the entire world.
</POLISH_MANDATE>

