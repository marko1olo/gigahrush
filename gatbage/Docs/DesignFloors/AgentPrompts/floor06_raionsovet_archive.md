# FLOOR06_RAIONSOVET_ARCHIVE

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Raionsovet Archive design floor.

<AGENT_PROMPT id="FLOOR06_RAIONSOVET_ARCHIVE">
PROMPT IDENTIFIED: FLOOR06_RAIONSOVET_ARCHIVE | DOMAIN: Design floor / Archive / Access records | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/raionsovet_archive.md`.
2. Read references: `Docs/Expansions/03_raionsovet_archive/`, `src/gen/ministry/raionsovet_archive.ts`, `src/data/notes.ts`, `src/systems/events.ts`.
3. Create `Docs/Tasks/Status_FLOOR06_RAIONSOVET_ARCHIVE.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR06_RAIONSOVET_ARCHIVE.md`.
5. Run baseline `npm run build`.

## Goal

Implement a full archive floor slice with local records, apartment rights, route permits, document containers and identity consequences.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/raionsovet_archive.ts`
- Optional local archive data file
- `Docs/Tasks/Status_FLOOR06_RAIONSOVET_ARCHIVE.md`
- `Docs/AgentLogs/LOG_FLOOR06_RAIONSOVET_ARCHIVE.md`

Forbidden:
- Do not simulate all residents.
- Do not edit global save schema unless an integrator owns migration.
- Do not duplicate Ministry's full document system.

## Implementation Tasks

1. Export `generateRaionsovetArchiveDesignFloor()`.
2. Stamp archive stacks, catalog corridors, clerk windows and locked living shelves.
3. Add named NPCs and quests for permits, card swaps, burn/save and market license.
4. Store outcomes as compact flags/document ids.
5. Publish archive events with route ids and target ids.
6. Run `npm run typecheck`; run `npm run check` if systems change.

## Done Means

At least one record can be gained by legal and illegal paths, and changing it visibly affects a door, NPC, container or quest state.
</AGENT_PROMPT>

<POLISH_MANDATE>
Reject any solution that is only a document list. The player must walk, risk, choose and see a consequence.
</POLISH_MANDATE>

