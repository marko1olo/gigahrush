# Monster_09_Pressovik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: production-line timing encounter owner.

<AGENT_PROMPT id="MONSTER_09_PRESSOVIK">
PROMPT IDENTIFIED: MONSTER_09_PRESSOVIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/concentrate_press.ts`
   - `src/gen/design_floors/production_belt.ts`
   - `src/gen/maintenance/automation_cage.ts`
   - `src/render/marks.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_09_PRESSOVIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_09_PRESSOVIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `pressovik` / **Прессовик** as a production-line room rule: timing, safe lanes, machine stop, and optional lure. The room rule matters more than a new monster kind.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/pressovik.ts`
- `Docs/Tasks/Status_MONSTER_09_PRESSOVIK.md`
- `Docs/AgentLogs/LOG_MONSTER_09_PRESSOVIK.md`
- Optional focused test: `tests/monster_09_pressovik.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add hidden instant death.
- Do not add broad physics or conveyor simulation.
- Do not edit render/webgl for a one-room hazard.

## Design Contract

- id: `pressovik`
- ru_name: `Прессовик`
- mode: A room puzzle; B only if a moving body is later approved
- floors: `MAINTENANCE`, `production_belt`, concentrate press POIs
- room/context: press line, piston chamber, warning-light corridor
- warning cue: warning light, floor danger marks, repeated slam cycle
- counterplay: observe beat, cross safe lane, stop machine, lure enemies into press, use side cover
- failure result: high burst damage or forced retreat, never unavoidable death
- reward/trace: `gear`, `spring`, `metal_sheet`, production event
- event/rumor hook: tags `monster`, `press`, `timing`, `production`

## Implementation Tasks

1. Build a local press room with stable geometry and clear safe/unsafe lanes.
2. Add visible cycle cues before the player must cross.
3. Use existing monsters as pressure, but make machine timing the main rule.
4. Add one disable or bypass action.
5. Optionally let the player lure a small monster into the hazard if local code can do it cleanly.
6. Publish event for machine stopped, crossed, or dangerous failure.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player can watch one cycle and learn.
- The encounter changes movement timing.
- No new physics subsystem or hidden kill plane.
</AGENT_PROMPT>

<POLISH_MANDATE>
If the player cannot read the safe beat, reduce damage and improve cues before adding difficulty.
</POLISH_MANDATE>
