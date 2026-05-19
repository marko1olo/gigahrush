# Monster_18_Hladonets

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: cold-pocket active threat owner.

<AGENT_PROMPT id="MONSTER_18_HLADONETS">
PROMPT IDENTIFIED: MONSTER_18_HLADONETS | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/systems/hladon.ts`
   - `src/gen/maintenance/heatline_zero.ts`
   - `src/gen/maintenance/steam_valves.ts`
   - `src/gen/maintenance/blue_glow_sample.ts`
   - `src/entities/shadow.ts`
   - `src/entities/tube_eel.ts`
4. Create `Docs/Tasks/Status_MONSTER_18_HLADONETS.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_18_HLADONETS.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `hladonets` / **Хладонец** as a local cold-pocket stalker that makes heat/steam/route choices matter. Do not add a climate system.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/hladonets.ts`
- `Docs/Tasks/Status_MONSTER_18_HLADONETS.md`
- `Docs/AgentLogs/LOG_MONSTER_18_HLADONETS.md`
- Optional focused test: `tests/monster_18_hladonets.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not modify global needs drain.
- Do not create full-floor cold weather.
- Do not add per-frame full-room scans.

## Design Contract

- id: `hladonets`
- ru_name: `Хладонец`
- mode: A local room rule
- floors: procedural `hladon`, `MAINTENANCE`, cold service rooms
- room/context: frost pocket, steam valve corridor, cold machine chamber
- warning cue: frost marks, visible breath, slowed NPCs, pale residue
- counterplay: steam valve, heat item, boiler water, lure away from cold cells, avoid long fight
- failure result: local slow/needs pressure and bad chase setup
- reward/trace: `boiler_water`, `asbestos_cord`, `valve_tag`
- event/rumor hook: tags `monster`, `cold`, `hladon`, `heat_counter`

## Implementation Tasks

1. Build a marked cold room using existing Hladon/cold visual language.
2. Place a local threat using existing `SHADOW`/`TUBE_EEL` or named variant.
3. Add at least one heat/steam control that visibly weakens or reroutes the threat.
4. Keep cold pressure within marked cells or the generated room.
5. Publish event for heat counterplay, cold exposure, and threat cleared.
6. Avoid any full-world or full-floor runtime scans.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- Heat changes the encounter.
- Cold is visible and local.
- The player can choose route/valve timing.
</AGENT_PROMPT>

<POLISH_MANDATE>
Cold should shape the room, not the whole game. Keep it bounded and legible.
</POLISH_MANDATE>
