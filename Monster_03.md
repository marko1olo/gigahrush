# Monster_03_Ocherednik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: crowd-pressure social monster setup owner.

<AGENT_PROMPT id="MONSTER_03_OCHEREDNIK">
PROMPT IDENTIFIED: MONSTER_03_OCHEREDNIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/kvartiry/ration_queue.ts`
   - `src/gen/kvartiry/social_helpers.ts`
   - `src/gen/kvartiry/social_pressure.ts`
   - `src/systems/factions.ts`
   - `src/systems/events.ts`
   - `src/entities/monster.ts`
4. Create `Docs/Tasks/Status_MONSTER_03_OCHEREDNIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_03_OCHEREDNIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `ocherednik` / **Очередник** as a mutated queue encounter. It should use crowd, witnesses, ration papers and social cost, not a new melee stat block.

## Absolute Write Scope

Owned:
- New source file: `src/gen/kvartiry/ocherednik.ts`
- `Docs/Tasks/Status_MONSTER_03_OCHEREDNIK.md`
- `Docs/AgentLogs/LOG_MONSTER_03_OCHEREDNIK.md`
- Optional focused test: `tests/monster_03_ocherednik.test.ts`

Conditional integration:
- `src/gen/kvartiry/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add crowd pathfinding systems.
- Do not globally modify NPC FSM.
- Do not force combat as the only resolution.

## Design Contract

- id: `ocherednik`
- ru_name: `Очередник`
- mode: A, local NPC/monster encounter
- floors: `KVARTIRY`, later `MINISTRY`/`communal_ring`
- room/context: ration queue, corridor choke, communal lobby
- warning cue: murmured queue numbers, ration paper trail, unmoving line
- counterplay: show coupon, take side route, expose fake queue leader, disperse, fight through with reputation cost
- failure result: player slowed or routed into bad line; witnesses record violence/theft; `ZOMBIE` or `NELYUD` activates
- reward/trace: ration papers, coupon, small money, rumor, faction event
- event/rumor hook: tags `monster`, `queue`, `ration`, `witness`

## Implementation Tasks

1. Build a bounded Kvartiry queue POI or extension around ration queue patterns.
2. Place a readable blocked route with a clear alternate route.
3. Add one named suspicious queue leader using existing `NELYUD` or `ZOMBIE`.
4. Add a noncombat branch using an existing item or local interaction.
5. If the player chooses violence, publish a witnessed event and make the social cost visible in log/status.
6. Add loot/trace that reinforces ration scarcity.
7. Run `npm run typecheck`; run `npm run check` if generation is integrated.

## Done Means

- The player can resolve the encounter by document/social choice, route choice, or combat.
- Shooting in the crowd has a cost.
- No broad NPC or faction rewrite is introduced.
</AGENT_PROMPT>

<POLISH_MANDATE>
The queue is the monster. Do not reduce it to one enemy standing in a corridor.
</POLISH_MANDATE>
