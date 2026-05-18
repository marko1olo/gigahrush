# FLOOR04_UPPER_BUREAU

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Upper Bureau design floor.

<AGENT_PROMPT id="FLOOR04_UPPER_BUREAU">
PROMPT IDENTIFIED: FLOOR04_UPPER_BUREAU | DOMAIN: Design floor / Elite bureaucracy / Access gates | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/upper_bureau.md`.
2. Read references: `src/gen/ministry/index.ts`, `src/gen/ministry/admin_common.ts`, `src/data/plot.ts`, `src/systems/quests.ts`.
3. Create `Docs/Tasks/Status_FLOOR04_UPPER_BUREAU.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR04_UPPER_BUREAU.md`.
5. Run baseline `npm run build`.

## Goal

Implement a high-status administrative floor with appointment gates, staff routes, audit pressure and document/social alternatives to combat.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/upper_bureau.ts`
- Optional local bureau data file
- `Docs/Tasks/Status_FLOOR04_UPPER_BUREAU.md`
- `Docs/AgentLogs/LOG_FLOOR04_UPPER_BUREAU.md`

Forbidden:
- Do not add a new bureaucracy system.
- Do not rewrite Ministry content.
- Do not make all doors open with one universal key.

## Implementation Tasks

1. Export `generateUpperBureauDesignFloor()`.
2. Stamp salons, executive offices, locked file rooms and a staff-only route.
3. Add named NPCs and quests for preapproval, cleaner keys, audit heat and erased names.
4. Represent access outcomes as local flags and document items.
5. Publish an event when audit heat or record editing changes.
6. Run `npm run typecheck`; run `npm run check` if shared systems change.

## Done Means

One important gate supports legal, social/economic and illegal/combat approaches, each with a consequence.
</AGENT_PROMPT>

<POLISH_MANDATE>
Check that quiet stealth is genuinely possible. If every path becomes a fight, rebalance guards or add a paper route.
</POLISH_MANDATE>

