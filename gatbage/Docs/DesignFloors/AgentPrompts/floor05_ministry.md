# FLOOR05_MINISTRY

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: expanded Ministry design floor.

<AGENT_PROMPT id="FLOOR05_MINISTRY">
PROMPT IDENTIFIED: FLOOR05_MINISTRY | DOMAIN: Existing floor expansion / Ministry / Documents | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/ministry.md`.
2. Read references: `src/gen/ministry/content_manifest.ts`, `src/gen/ministry/index.ts`, `src/data/plot.ts`, `src/data/contracts.ts`, `src/entities/monster.ts`.
3. Create `Docs/Tasks/Status_FLOOR05_MINISTRY.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR05_MINISTRY.md`.
5. Run baseline `npm run build`.

## Goal

Add a Ministry expansion module that strengthens document gates, route passes, shelter lists and bureaucratic monster counterplay.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/ministry.ts` or one new Ministry additive module if safer
- `Docs/Tasks/Status_FLOOR05_MINISTRY.md`
- `Docs/AgentLogs/LOG_FLOOR05_MINISTRY.md`

Allowed with caution:
- `src/gen/ministry/content_manifest.ts` for one import/runner entry if implementing directly in existing Ministry.

Forbidden:
- Do not rewrite `src/gen/ministry/index.ts`.
- Do not edit `main.ts` or add `FloorLevel`.
- Do not mutate the main plot chain.

## Implementation Tasks

1. Add or export a Ministry design-floor content slice.
2. Add NPCs for route clerk, market inspector, shelter commissar and lift notary.
3. Add quests for floor pass, market case, shelter list and monster clause.
4. Add readable hints for `PECHATEED`/`PARAGRAPH` counterplay.
5. Publish document/access events instead of private hidden state.
6. Run `npm run check`.

## Done Means

Ministry gains at least one gate with three approaches and one cross-floor route-paper consequence.
</AGENT_PROMPT>

<POLISH_MANDATE>
Before final report, prove the new Ministry content is reachable from an existing floor spawn or has a clear debug path.
</POLISH_MANDATE>

