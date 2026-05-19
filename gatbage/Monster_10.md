# Monster_10_Nasosnaya_Matka

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: pump-room water boss encounter owner.

<AGENT_PROMPT id="MONSTER_10_NASOSNAYA_MATKA">
PROMPT IDENTIFIED: MONSTER_10_NASOSNAYA_MATKA | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/pressure_station.ts`
   - `src/gen/maintenance/water_bridge.ts`
   - `src/gen/maintenance/overflow_sluice.ts`
   - `src/entities/matka.ts`
   - `src/entities/tube_eel.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_10_NASOSNAYA_MATKA.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_10_NASOSNAYA_MATKA.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `nasosnaya_matka` / **Насосная Матка** as a water-pressure boss room using valves, dry perimeter, and capped water-biased adds. Do not build a fluid simulation.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/nasosnaya_matka.ts`
- `Docs/Tasks/Status_MONSTER_10_NASOSNAYA_MATKA.md`
- `Docs/AgentLogs/LOG_MONSTER_10_NASOSNAYA_MATKA.md`
- Optional focused test: `tests/monster_10_nasosnaya_matka.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not modify generic `MATKA` reproduction.
- Do not expand water across the whole map.
- Do not spawn uncapped adds.

## Design Contract

- id: `nasosnaya_matka`
- ru_name: `Насосная Матка`
- mode: A boss encounter using `MATKA`/`TUBE_EEL`; B later only if reused
- floors: `MAINTENANCE`, pressure/water POIs
- room/context: pump room, pressure station, overflow sluice
- warning cue: pump pulses like breathing, water lanes, pressure gauge mark
- counterplay: close valves in order, fight on dry perimeter, use harpoon/electric tool, kill core after draining
- failure result: local water lane advantage for `TUBE_EEL`, forced harder route, capped add pressure
- reward/trace: `manometer`, `valve_tag`, `pipe`, water resource event
- event/rumor hook: tags `monster`, `pump`, `water`, `boss`, `pressure`

## Implementation Tasks

1. Create a local pump-room boss layout with dry perimeter and 2-3 water lanes.
2. Place a named core using `MATKA` or heavy existing monster stats.
3. Add 2-4 valve/pressure controls that visibly affect add spawning or safe path.
4. Cap active adds to 3-6 and prefer `TUBE_EEL`/`POLZUN`.
5. Add a clear reward container or drop after draining/clearing.
6. Publish events for valve changes, pressure failure, boss cleared.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The boss is a room puzzle, not a bigger Matka.
- Dry route and valve counterplay are real.
- Spawn count is capped and local.
</AGENT_PROMPT>

<POLISH_MANDATE>
Pressure buys drama, not simulation. Keep the water fake, readable, and local.
</POLISH_MANDATE>
