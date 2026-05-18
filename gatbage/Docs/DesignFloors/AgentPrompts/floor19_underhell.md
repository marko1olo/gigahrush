# FLOOR19_UNDERHELL

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Underhell design floor.

<AGENT_PROMPT id="FLOOR19_UNDERHELL">
PROMPT IDENTIFIED: FLOOR19_UNDERHELL | DOMAIN: Design floor / Below Hell / Ritual thresholds | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/underhell.md`.
2. Read references: `src/gen/hell/index.ts`, `src/gen/hell/plot_chain.ts`, `src/gen/void/index.ts`, `src/systems/events.ts`.
3. Create `Docs/Tasks/Status_FLOOR19_UNDERHELL.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR19_UNDERHELL.md`.
5. Run baseline `npm run build`.

## Goal

Implement a compact post-Hell ritual floor with threshold costs, witness cells, debt burning and a deterministic Void gate.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/underhell.ts`
- Optional local underhell data file
- `Docs/Tasks/Status_FLOOR19_UNDERHELL.md`
- `Docs/AgentLogs/LOG_FLOOR19_UNDERHELL.md`

Forbidden:
- Do not add a global morality system.
- Do not edit Void or Hell plot chain directly.
- Do not softlock the Void route behind hidden random state.

## Implementation Tasks

1. Export `generateUnderhellDesignFloor()`.
2. Stamp ritual thresholds, root tunnels, witness cells, inverted chapel and black wells.
3. Add NPCs/quests for threshold payment, witness rescue, debt burn and Void gate.
4. Represent ritual state as compact flags.
5. Publish backlash events for debt/identity manipulation.
6. Run `npm run typecheck`; run `npm run check` if route/system changes.

## Done Means

One ritual gate supports at least three costs, and Void access opens deterministically with no softlock.
</AGENT_PROMPT>

<POLISH_MANDATE>
Make every ritual cost concrete. Avoid vague "sacrifice" text unless the item, HP, document or faction consequence is explicit.
</POLISH_MANDATE>

