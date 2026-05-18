# Monster_22_Chernobozhiy_Svod

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: cult ritual room-anchor encounter owner.

<AGENT_PROMPT id="MONSTER_22_CHERNOBOZHIY_SVOD">
PROMPT IDENTIFIED: MONSTER_22_CHERNOBOZHIY_SVOD | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/kvartiry/cult_supply_kitchen.ts`
   - `src/gen/maintenance/cult_held_workshop.ts`
   - `src/data/chernobog_docket.ts`
   - `src/data/procedural_floors.ts`
   - `src/entities/idol.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_22_CHERNOBOZHIY_SVOD.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_22_CHERNOBOZHIY_SVOD.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `chernobozhiy_svod` / **Чернобожий Свод** as a cult-owned room anchor that can be exposed, sealed, robbed, destroyed or avoided. It is a room condition, not a magic-caster enemy.

## Absolute Write Scope

Owned:
- New source file: `src/gen/kvartiry/chernobozhiy_svod.ts`
- `Docs/Tasks/Status_MONSTER_22_CHERNOBOZHIY_SVOD.md`
- `Docs/AgentLogs/LOG_MONSTER_22_CHERNOBOZHIY_SVOD.md`
- Optional focused test: `tests/monster_22_chernobozhiy_svod.test.ts`

Conditional integration:
- `src/gen/kvartiry/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add a magic system.
- Do not rewrite cult faction logic.
- Do not create a second event bus.

## Design Contract

- id: `chernobozhiy_svod`
- ru_name: `Чернобожий Свод`
- mode: A room anchor encounter
- floors: cult false-safe blocks, `KVARTIRY`, `HELL`, cult workshops
- room/context: black-hand marks, false shelter, cult supply cache
- warning cue: hand marks align, silent safe block, organized forbidden supplies
- counterplay: expose marker, steal/ruin supply, bring proof to liquidator, destroy anchor, avoid shelter trap
- failure result: cultist reinforcements, `SHADOW`/`IDOL` spawn, false shelter consequence
- reward/trace: `idol_chernobog`, `meat_rune`, faction event
- event/rumor hook: tags `monster`, `cult`, `chernobog`, `false_safe_block`

## Implementation Tasks

1. Create a bounded Kvartiry cult room anchor with black-hand marks.
2. Add at least one noncombat path: expose, report, steal evidence, or sabotage supplies.
3. Use existing cultists and `IDOL`/`SHADOW` as pressure only after the room rule is clear.
4. Add a visible consequence for trusting the false safe space.
5. Publish event for exposed, looted, sealed, awakened, or reported outcomes.
6. Keep cult behavior social/ritualistic, not spellcasting.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player can expose the room instead of only clearing it.
- Cult residue affects rumor/faction state.
- The anchor has visible marks and bounded effects.
</AGENT_PROMPT>

<POLISH_MANDATE>
Чернобог should feel like a contaminating practice in a room, not a fantasy wizard boss.
</POLISH_MANDATE>
