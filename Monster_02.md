# Monster_02_Plombirovshchik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: local route-denial and door-seal monster owner.

<AGENT_PROMPT id="MONSTER_02_PLOMBIROVSHCHIK">
PROMPT IDENTIFIED: MONSTER_02_PLOMBIROVSHCHIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/living/hermoseam_station.ts`
   - `src/systems/hermodoor_borer.ts`
   - `src/entities/shovnik.ts`
   - `src/entities/monster.ts`
   - `src/systems/ai/monster.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_02_PLOMBIROVSHCHIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_02_PLOMBIROVSHCHIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `plombirovshchik` / **Пломбировщик** as a local door/seam route-denial encounter. First version should reuse `SHOVNIK` patterns unless an integrator explicitly approves a new `MonsterKind`.

## Absolute Write Scope

Owned:
- New source file: `src/gen/living/plombirovshchik.ts`
- `Docs/Tasks/Status_MONSTER_02_PLOMBIROVSHCHIK.md`
- `Docs/AgentLogs/LOG_MONSTER_02_PLOMBIROVSHCHIK.md`
- Optional focused test: `tests/monster_02_plombirovshchik.test.ts`

Conditional integration:
- `src/gen/living/content_manifest.ts` only with explicit manifest ownership.
- If blocked, export the generator runner and record the exact manifest line.

Forbidden:
- Do not edit `core/types.ts` or add enum entries.
- Do not add a global door scanner.
- Do not seal the only exit from a POI.

## Design Contract

- id: `plombirovshchik`
- ru_name: `Пломбировщик`
- mode: A local encounter with `SHOVNIK`; Mode B only after integrator approval
- floors: `LIVING`, later `MINISTRY`/`MAINTENANCE`
- room/context: hermoseam service nook, damaged door, shelter-adjacent corridor
- warning cue: fresh rubber smell, white sealant line, ticking handle
- counterplay: pull into room center, cut seal with melee/tool, use `sealant_tube`/`hermo_gasket`, loud shot interrupts local sealing
- failure result: one local optional door becomes marked/jammed or the player must reroute inside the POI
- reward/trace: `hermo_gasket`, `sealant_tube`, repair note, event tags
- event/rumor hook: tags `monster`, `seal`, `hermodoor`, `route_denial`

## Implementation Tasks

1. Create a small Living repair/seam encounter with one local door decision.
2. Use existing wall-biased `SHOVNIK` behavior as the combat body.
3. Add visible seal marks and a clearly optional jammed/blocked local route.
4. Provide one recovery path: open alternate door, cut/repair seal, or kill the threat away from the wall.
5. Publish an event when the seal is noticed, broken, repaired, or the threat is killed.
6. Keep all door manipulation local to the generated room; do not inspect all doors.
7. Run `npm run typecheck`; run `npm run check` if integrated into generation.

## Done Means

- The encounter teaches "do not fight at the seam".
- Route denial is local, reversible or bypassable.
- No global state, no softlock, no new enum without integrator ownership.
</AGENT_PROMPT>

<POLISH_MANDATE>
The monster is interesting only if the door changes the player's route. If it is just a Shovnik with a new name, add the route decision or stop.
</POLISH_MANDATE>
