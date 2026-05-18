# Monster_17_Perestanovshchik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: local topology/anomaly encounter owner.

<AGENT_PROMPT id="MONSTER_17_PERESTANOVSHCHIK">
PROMPT IDENTIFIED: MONSTER_17_PERESTANOVSHCHIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/data/procedural_floors.ts`
   - `src/gen/procedural_floor.ts`
   - `src/systems/procedural_anomalies.ts`
   - `src/gen/void/protocol_chamber.ts`
   - `src/systems/void_protocols.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_17_PERESTANOVSHCHIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_17_PERESTANOVSHCHIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `perestanovshchik` / **Перестановщик** as a local topology encounter around paired cells, repeated doors, or swapped labels. It must not alter global floor transitions or softlock routes.

## Absolute Write Scope

Owned:
- New source file: `src/gen/void/perestanovshchik.ts`
- `Docs/Tasks/Status_MONSTER_17_PERESTANOVSHCHIK.md`
- `Docs/AgentLogs/LOG_MONSTER_17_PERESTANOVSHCHIK.md`
- Optional focused test: `tests/monster_17_perestanovshchik.test.ts`

Conditional integration:
- `src/gen/void/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not edit save/load route state.
- Do not alter normal lift transitions.
- Do not create a topology trap without a guaranteed exit.

## Design Contract

- id: `perestanovshchik`
- ru_name: `Перестановщик`
- mode: A local anomaly encounter; C only after proof
- floors: procedural `teleport_cells`, `VOID`, `darkness`
- room/context: repeated doorway, loop room, marked paired cells
- warning cue: floor number mismatch, repeated door, minimap/map flicker, chalk marks
- counterplay: mark correct door, disable anchor, use paired cell intentionally, retreat before swap
- failure result: local loop into side room, lost time, ambush pressure
- reward/trace: `lift_scheme`, `void_spike`, topology rumor
- event/rumor hook: tags `monster`, `topology`, `teleport`, `route`

## Implementation Tasks

1. Create a local Void/anomaly chamber with two clearly marked paired positions or doors.
2. Use existing sparse teleport/anomaly concepts only locally.
3. Add a visible anchor that can be disabled or avoided.
4. Ensure at least one exit remains reachable at all times.
5. Add a small threat only after the topology rule is demonstrated.
6. Publish event for loop entered, anchor disabled, or route recovered.
7. Run `npm run typecheck`; run `npm run check` if movement/anomaly behavior is integrated.

## Done Means

- The player understands the local route trick.
- There is no softlock.
- Global procedural route/save state is untouched.
</AGENT_PROMPT>

<POLISH_MANDATE>
The house may rearrange, but this task must stay local and reversible.
</POLISH_MANDATE>
