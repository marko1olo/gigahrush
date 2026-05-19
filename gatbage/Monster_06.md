# Monster_06_Kabelnik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: industrial tether/trap encounter owner.

<AGENT_PROMPT id="MONSTER_06_KABELNIK">
PROMPT IDENTIFIED: MONSTER_06_KABELNIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/charge_cage.ts`
   - `src/gen/maintenance/automation_cage.ts`
   - `src/gen/maintenance/paritel_steam_bridge.ts`
   - `src/entities/lampovy.ts`
   - `src/entities/robot.ts`
   - `src/render/marks.ts`
4. Create `Docs/Tasks/Status_MONSTER_06_KABELNIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_06_KABELNIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `kabelnik` / **Кабельник** as a visible tether/trap rule in an industrial room. First version should be a local encounter using existing `LAMPOVY`/`ROBOT` bodies unless a hook owner explicitly approves a generic tether system.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/kabelnik.ts`
- `Docs/Tasks/Status_MONSTER_06_KABELNIK.md`
- `Docs/AgentLogs/LOG_MONSTER_06_KABELNIK.md`
- Optional focused test: `tests/monster_06_kabelnik.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add renderer-owned gameplay state.
- Do not scan all lamps/machines every frame.
- Do not add new AI fields unless the prompt is widened by an integrator.

## Design Contract

- id: `kabelnik`
- ru_name: `Кабельник`
- mode: A local encounter, possible C hook later
- floors: `MAINTENANCE`, `production_belt`, `service_floor`
- room/context: charge cage, fuse corridor, machine room
- warning cue: sparking cable line, lamp flicker, machine hum after crossing
- counterplay: cut cable/anchor, shut fuse, lure away from lamp, shoot anchor, use rubber/insulation item
- failure result: shock/slow, forced detour, resource drain
- reward/trace: `wire_coil`, `fuse`, `circuit_board`
- event/rumor hook: tags `monster`, `tether`, `electric`, `industrial`

## Implementation Tasks

1. Build one Maintenance room with a visible line/anchor using existing marks/features.
2. Use `LAMPOVY` or `ROBOT` as the combat body; name it locally if needed.
3. Make the line avoidable and obvious before damage.
4. Add one local disabling action: fuse, anchor, machine, or alternative route.
5. Keep the tether lifetime/local scope bounded.
6. Publish event when tether is triggered, disabled, or the threat is cleared.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player moves differently because of the line.
- The tether has one room, one anchor, one readable counterplay.
- No generic electric simulation is added.
</AGENT_PROMPT>

<POLISH_MANDATE>
If the cable is invisible or unavoidable, it is not counterplay. Make the room geometry teach the rule.
</POLISH_MANDATE>
