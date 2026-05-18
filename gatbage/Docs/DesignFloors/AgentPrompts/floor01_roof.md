# FLOOR01_ROOF

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Roof design floor.

<AGENT_PROMPT id="FLOOR01_ROOF">
PROMPT IDENTIFIED: FLOOR01_ROOF | DOMAIN: Design floor / Roof / Dynamic sky | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/roof.md`.
2. Read references: `src/gen/floor_manifest.ts`, `src/gen/living/index.ts`, `src/render/textures.ts`, `src/render/webgl.ts`.
3. Create `Docs/Tasks/Status_FLOOR01_ROOF.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR01_ROOF.md`.
5. Run baseline `npm run build`.

## Goal

Implement a self-contained Roof floor module with open concrete roof topology, antenna NPCs, roof quests and a bounded dynamic procedural sky-ceiling prototype.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/roof.ts`
- Optional new local roof-only data file if needed
- `Docs/Tasks/Status_FLOOR01_ROOF.md`
- `Docs/AgentLogs/LOG_FLOOR01_ROOF.md`

Forbidden:
- Do not add `FloorLevel.ROOF`.
- Do not edit `main.ts`, save/load or central floor routing.
- Do not hardcode roof-only logic into broad render paths without a tiny generic hook and explicit status note.
- Do not import network assets.

## Implementation Tasks

1. Export a `generateRoofDesignFloor()` module using existing `World`/entity patterns.
2. Stamp roof slabs, parapets, antenna clusters, ventilation shelters and at least two exits.
3. Add named roof NPCs and side quests from the floor doc.
4. Prototype dynamic sky as a bounded canvas/texture provider or document the exact integrator hook if render integration is unsafe.
5. Publish at least one event or quest consequence for signal/weather repair.
6. Run `npm run typecheck`; run `npm run check` if render code changes.

## Done Means

The Roof has a playable generator slice, nonblank sky plan/prototype, one shelter, one antenna decision and no central-route conflicts.
</AGENT_PROMPT>

<POLISH_MANDATE>
Verify the roof is not a huge empty plane. The first 30 seconds after spawn must show a landmark, a route and a risk.
</POLISH_MANDATE>

