# Monster_25_Remontnik_Bez_Smeny

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: maintenance route-repair remnant encounter owner.

<AGENT_PROMPT id="MONSTER_25_REMONTNIK_BEZ_SMENY">
PROMPT IDENTIFIED: MONSTER_25_REMONTNIK_BEZ_SMENY | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/lift_repair_shaft.ts`
   - `src/gen/maintenance/pressure_station.ts`
   - `src/gen/maintenance/automation_cage.ts`
   - `src/data/items.ts`
   - `src/systems/events.ts`
   - `src/systems/containers.ts`
4. Create `Docs/Tasks/Status_MONSTER_25_REMONTNIK_BEZ_SMENY.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_25_REMONTNIK_BEZ_SMENY.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `remontnik_bez_smeny` / **Ремонтник Без Смены** as a maintenance remnant that changes a local shortcut/tool route and can be bargained with, robbed, killed, or avoided.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/remontnik_bez_smeny.ts`
- `Docs/Tasks/Status_MONSTER_25_REMONTNIK_BEZ_SMENY.md`
- `Docs/AgentLogs/LOG_MONSTER_25_REMONTNIK_BEZ_SMENY.md`
- Optional focused test: `tests/monster_25_remontnik_bez_smeny.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not close the only exit.
- Do not globally alter door repair behavior.
- Do not add a new crafting/repair framework.

## Design Contract

- id: `remontnik_bez_smeny`
- ru_name: `Ремонтник Без Смены`
- mode: A local route/tool encounter; B only if reused
- floors: `service_floor`, `MAINTENANCE`, procedural workshops, post-samosbor aftermath
- room/context: repair closet, welded shortcut, tool cart, bad wall
- warning cue: welding light in empty corridor, tool cart moves, work order mismatch
- counterplay: show work order, give part, steal tool before noticed, lure away, kill for tools
- failure result: local optional shortcut closes, repair quest route changes, machinery wakes
- reward/trace: `wrench`, `gear`, `sealant_tube`, repair rumor
- event/rumor hook: tags `monster`, `repair`, `route_denial`, `maintenance`

## Implementation Tasks

1. Create a Maintenance repair closet or shortcut room with two routes.
2. Add one remnant NPC/monster-like figure or named existing monster.
3. Add a local shortcut that can be preserved, traded for, robbed open, or temporarily blocked.
4. Add one tool/reward container tied to the choice.
5. Publish event for bargained, robbed, killed, route preserved, or route welded outcomes.
6. Guarantee the main route remains open.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player decides whether route, tool, reputation, or safety matters more.
- The remnant changes only local route state.
- No global repair system or softlock is introduced.
</AGENT_PROMPT>

<POLISH_MANDATE>
The best version is a negotiation with a broken maintenance instinct. Keep the route consequence local and fair.
</POLISH_MANDATE>
