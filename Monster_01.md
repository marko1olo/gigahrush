# Monster_01_Golos_Za_Dveryu

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: door/shelter deception encounter owner.

<AGENT_PROMPT id="MONSTER_01_GOLOS_ZA_DVERYU">
PROMPT IDENTIFIED: MONSTER_01_GOLOS_ZA_DVERYU | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source before editing:
   - `src/gen/living/external_cell_neighbor.ts`
   - `src/gen/kvartiry/false_neighbor.ts`
   - `src/gen/living/hermoseam_station.ts`
   - `src/entities/monster.ts`
   - `src/data/monster_ecology.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_01_GOLOS_ZA_DVERYU.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_01_GOLOS_ZA_DVERYU.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `golos_za_dveryu` / **Голос За Дверью** as a threshold horror encounter: a familiar voice behind a door pressures the player to open, wait, repair the seal, mark the door, or flee. This is not a sprite-only monster and not a random lethal door.

## Absolute Write Scope

Owned:
- New source file: `src/gen/living/golos_za_dveryu.ts`
- `Docs/Tasks/Status_MONSTER_01_GOLOS_ZA_DVERYU.md`
- `Docs/AgentLogs/LOG_MONSTER_01_GOLOS_ZA_DVERYU.md`
- Optional focused test: `tests/monster_01_golos_za_dveryu.test.ts`

Conditional integration:
- `src/gen/living/content_manifest.ts` only if the runner explicitly allows you to touch the Living manifest in this parallel batch.
- If manifest ownership is not granted, leave the exact import/runner line in status/log instead of editing a shared manifest.

Forbidden:
- Do not edit `main.ts`, `core/world.ts`, `render/webgl.ts`, broad AI, broad quest systems, or package metadata.
- Do not add a new `MonsterKind`.
- Do not make any normal door randomly lethal.

## Design Contract

- id: `golos_za_dveryu`
- ru_name: `Голос За Дверью`
- mode: A, local encounter using existing `NELYUD`/`SHADOW`
- floors: `LIVING`, optional procedural false-safe later
- room/context: half-sealed apartment or hermoseam-adjacent threshold
- warning cue: wrong familiar voice, door twitch, raw meat smell, suspicious screen/log line
- counterplay: do not open, inspect from distance, repair/mark seal, leave for liquidators, retreat
- failure result: opening deliberately spawns a bounded threat and damages/marks the local threshold
- reward/trace: `bottled_voice` if available, `siren_shard`, document clue, world event and rumor seed
- event/rumor hook: publish `monster_sighted` or an existing generic event with tags `monster`, `door_lure`, `samosbor_aftermath`

## Implementation Tasks

1. Build one small Living POI or attach to an existing safe-adjacent threshold without bulldozing protected start rooms.
2. Place clear warning cues before any threat spawns.
3. Add a deliberate local trigger: opening/interacting/looting near the marked door. Proximity alone must not punish the player.
4. Spawn at most one primary monster plus optional one small add; prefer `NELYUD` or `SHADOW`.
5. Add one noncombat outcome: ignore/mark/repair/leave evidence.
6. Publish a compact `WorldEvent` when the player triggers, avoids, marks, or clears the door.
7. Add a focused test or status evidence proving the encounter is bounded and can be integrated.
8. Run `npm run typecheck`; run `npm run check` if generator integration is actually edited.

## Done Means

- The player can choose not to open and gains safety, evidence, or a rumor clue.
- The encounter teaches door/shelter suspicion without poisoning every door in the game.
- No full-world door scan, no broad AI rewrite, no unbounded spawn.
</AGENT_PROMPT>

<POLISH_MANDATE>
Keep the horror in the decision before opening the door. If the player has no clue and no choice, redesign the encounter.
</POLISH_MANDATE>
