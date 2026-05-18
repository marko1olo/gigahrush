# FLOOR07_REGISTRY_MORGUE

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Registry Morgue design floor.

<AGENT_PROMPT id="FLOOR07_REGISTRY_MORGUE">
PROMPT IDENTIFIED: FLOOR07_REGISTRY_MORGUE | DOMAIN: Design floor / Morgue / Identity records | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/registry_morgue.md`.
2. Read references: `Docs/Expansions/07_hospital_quarantine/`, `src/gen/living/hospital_quarantine.ts`, `src/data/notes.ts`, `src/entities/nelyud.ts`.
3. Create `Docs/Tasks/Status_FLOOR07_REGISTRY_MORGUE.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR07_REGISTRY_MORGUE.md`.
5. Run baseline `npm run build`.

## Goal

Implement a non-graphic morgue/registry floor with body tags, death certificates, medical containers and identity-driven horror.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/registry_morgue.ts`
- Optional local morgue data file
- `Docs/Tasks/Status_FLOOR07_REGISTRY_MORGUE.md`
- `Docs/AgentLogs/LOG_FLOOR07_REGISTRY_MORGUE.md`

Forbidden:
- No graphic gore set pieces.
- No explicit sexual content.
- Do not create a zombie horde farm.
- Do not edit hospital expansion files unless fixing a direct integration bug.

## Implementation Tasks

1. Export `generateRegistryMorgueDesignFloor()`.
2. Stamp reception, tag room, cold storage, ledger office and contaminated chamber.
3. Add NPCs and quests for tag recovery, certificate swap, missing body and medicine lock.
4. Gate medical loot through containers with owners/access rules.
5. Use rare readable threats such as `NELYUD`, `ZOMBIE`, `SHADOW` or document monsters.
6. Run `npm run typecheck`; run `npm run check` if systems/render changes.

## Done Means

One identity/death decision changes a fact outside the floor, and the floor remains systemic rather than graphic.
</AGENT_PROMPT>

<POLISH_MANDATE>
Before final report, remove any text that gets its impact from gore detail instead of gameplay consequence.
</POLISH_MANDATE>

