# Monster_07_Ventshun

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: vent/ceiling warning encounter owner.

<AGENT_PROMPT id="MONSTER_07_VENTSHUN">
PROMPT IDENTIFIED: MONSTER_07_VENTSHUN | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/pneumomail_station.ts`
   - `src/gen/maintenance/slime_singing_vents.ts`
   - `src/gen/design_floors/dark_metro.ts`
   - `src/entities/tube_eel.ts`
   - `src/entities/sborka.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_07_VENTSHUN.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_07_VENTSHUN.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `ventshun` / **Вентшун** as a vent/ceiling predator setup. The key is a warning cue followed by a bounded delayed threat, not an invisible ambush.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/ventshun.ts`
- `Docs/Tasks/Status_MONSTER_07_VENTSHUN.md`
- `Docs/AgentLogs/LOG_MONSTER_07_VENTSHUN.md`
- Optional focused test: `tests/monster_07_ventshun.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add a global vent-marker runtime unless assigned as a hook owner.
- Do not spawn threats without prior cue.
- Do not create unbounded vent reproduction.

## Design Contract

- id: `ventshun`
- ru_name: `Вентшун`
- mode: A local delayed spawn using existing monsters
- floors: `MAINTENANCE`, `service_floor`, `dark_metro`
- room/context: vent shaft, pipe ceiling, pneumomail duct, dark transfer
- warning cue: dust falling, grate cough, metal tap, marked vent
- counterplay: move away from vent, close valve, shoot grate, throw bait/noise away
- failure result: short burst damage, smog pocket, or capped `SBORKA`/`TUBE_EEL` spawn
- reward/trace: `filter_layer`, `pipe`, `gasmask_filter`
- event/rumor hook: tags `monster`, `vent`, `ambush`, `maintenance`

## Implementation Tasks

1. Create one room with 2-4 marked vent cells and safe space between them.
2. Add delayed spawn/activation after interaction, loot attempt, or crossing a warning zone.
3. Spawn a capped threat using existing `SBORKA`, `TUBE_EEL`, or `SHADOW`.
4. Provide one countermeasure: valve, grate shot, alternate route, bait/noise.
5. Publish event when vent warning appears and when the nest is cleared.
6. Keep all checks local to the room and trigger; no continuous global scan.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- Player sees or hears the vent before danger.
- Standing still under pipes is punished, but movement/counterplay works.
- The encounter cannot flood the map with monsters.
</AGENT_PROMPT>

<POLISH_MANDATE>
Make the vent feel like a place in the room. Do not spawn a monster from nowhere.
</POLISH_MANDATE>
