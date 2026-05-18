# FLOOR12_FLOOR_69

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Floor 69 design floor.

<AGENT_PROMPT id="FLOOR12_FLOOR_69">
PROMPT IDENTIFIED: FLOOR12_FLOOR_69 | DOMAIN: Design floor / Adult vice / Debt and blackmail | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/floor_69.md`.
2. Read references: `Docs/Tasks/Status_UNASSIGNED.md` F69 sections, `Docs/AgentLogs/Rationale_UNASSIGNED.md` F69 sections, `src/render/sprite_index.ts`, `src/entities/npc.ts`, `src/gen/living/black_market_88.ts`.
3. Create `Docs/Tasks/Status_FLOOR12_FLOOR_69.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR12_FLOOR_69.md`.
5. Run baseline `npm run build`.

## Goal

Implement a non-graphic adult vice floor focused on debt, blackmail, refuge, raids, medicine and protection choices.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/floor_69.ts`
- Optional local F69 data file
- `Docs/Tasks/Status_FLOOR12_FLOOR_69.md`
- `Docs/AgentLogs/LOG_FLOOR12_FLOOR_69.md`

Forbidden:
- No minors in this floor's adult context.
- No graphic sex, pornographic text or explicit sex mechanics.
- Do not create coercive fetish content.
- Do not edit global sprite registry unless fixing an existing F69 sprite-bank integration bug.

## Implementation Tasks

1. Export `generateFloor69DesignFloor()`.
2. Stamp public corridor, rooms, clinic, debt office, security checkpoint and staff route.
3. Add adult-only NPCs for manager, guard, performer, doctor and accountant.
4. Add quests for blackmail evidence, hiding/escort, debt ledger, clinic supply and raid choice.
5. Store heat/trust/debt/blackmail as bounded state.
6. Run `npm run typecheck`; run `npm run check` if systems/render changes.

## Done Means

The floor has adult themes without explicit content, and at least one quest supports protect, expose and profit outcomes.
</AGENT_PROMPT>

<POLISH_MANDATE>
Before final report, audit every player-facing line for age safety and explicitness. Remove anything that would turn systemic vice into pornography.
</POLISH_MANDATE>

