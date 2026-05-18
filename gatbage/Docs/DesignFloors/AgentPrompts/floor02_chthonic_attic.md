# FLOOR02_CHTHONIC_ATTIC

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Chthonic Attic design floor.

<AGENT_PROMPT id="FLOOR02_CHTHONIC_ATTIC">
PROMPT IDENTIFIED: FLOOR02_CHTHONIC_ATTIC | DOMAIN: Design floor / Occult attic / Root routes | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/chthonic_attic.md`.
2. Read references: `src/gen/hell/index.ts`, `src/gen/ministry/index.ts`, `src/gen/shared.ts`, `src/systems/samosbor.ts`.
3. Create `Docs/Tasks/Status_FLOOR02_CHTHONIC_ATTIC.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR02_CHTHONIC_ATTIC.md`.
5. Run baseline `npm run build`.

## Goal

Implement a self-contained Chthonic Attic module with crawl routes, concrete roots, shrine niches and a choice between cutting, feeding or burning the attic's growth.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/chthonic_attic.ts`
- Optional local attic-only data file
- `Docs/Tasks/Status_FLOOR02_CHTHONIC_ATTIC.md`
- `Docs/AgentLogs/LOG_FLOOR02_CHTHONIC_ATTIC.md`

Forbidden:
- Do not add a new root-growth runtime simulation.
- Do not edit Hell or Ministry orchestrators.
- Do not create a per-frame door/root scan.

## Implementation Tasks

1. Export `generateChthonicAtticDesignFloor()`.
2. Stamp connected crawlspaces, root obstacles, shrine niches and at least one wide combat lane.
3. Add the four named NPC roles and at least three side quests from the floor doc.
4. Implement room-level root sealing/burning as generation or interaction state, not live growth.
5. Publish an event for one cross-floor relevant choice.
6. Run `npm run typecheck`; run `npm run check` for system/render changes.

## Done Means

The attic has two route styles, a shelter-with-cost decision, and root state that cannot softlock the player.
</AGENT_PROMPT>

<POLISH_MANDATE>
Before final report, trace a path from spawn to every exit after each root choice.
</POLISH_MANDATE>

