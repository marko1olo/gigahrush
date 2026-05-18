# Monster_16_Ekrannik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: screen/signal misinformation encounter owner.

<AGENT_PROMPT id="MONSTER_16_EKRANNIK">
PROMPT IDENTIFIED: MONSTER_16_EKRANNIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/procedural_screens.ts`
   - `src/gen/design_floors/antenna_court.ts`
   - `src/gen/design_floors/dark_metro.ts`
   - `src/entities/eye.ts`
   - `src/entities/paragraph.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_16_EKRANNIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_16_EKRANNIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `ekrannik` / **Экранник** as a screen-bound misinformation and ranged-pressure encounter. It must never silently corrupt quest state.

## Absolute Write Scope

Owned:
- New source file: `src/gen/void/ekrannik.ts`
- `Docs/Tasks/Status_MONSTER_16_EKRANNIK.md`
- `Docs/AgentLogs/LOG_MONSTER_16_EKRANNIK.md`
- Optional focused test: `tests/monster_16_ekrannik.test.ts`

Conditional integration:
- `src/gen/void/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not edit map/quest systems to create false persistent objectives.
- Do not alter all procedural screens.
- Do not add DOM UI.

## Design Contract

- id: `ekrannik`
- ru_name: `Экранник`
- mode: A local screen encounter; C screen marker only if assigned
- floors: `MINISTRY`, `antenna_court`, `dark_metro`, `VOID`
- room/context: terminal row, warning screen, signal nest, wrong route board
- warning cue: wrong player/floor line, green or white frame, map hint contradiction
- counterplay: break line of sight, turn off fuse/screen, shoot screen, ignore false marker, clear room before reading
- failure result: false local route clue, `EYE`/`PARAGRAPH` shot, warning confusion
- reward/trace: `circuit_board`, `overexposed_photo`, signal rumor
- event/rumor hook: tags `monster`, `screen`, `signal`, `misdirection`

## Implementation Tasks

1. Create a local Void or signal-room encounter with 1-3 screens.
2. Add obviously suspicious false text that does not mutate quest state.
3. Use `EYE` or `PARAGRAPH` as the ranged pressure body.
4. Add one disabling route: fuse, screen shot, alternate corridor, ignore clue.
5. Publish event when false signal is read, disabled, or followed into danger.
6. Keep all misinformation local and reversible.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player learns screens can lie in this context.
- No real quest marker is corrupted.
- The encounter uses existing render/screen channels.
</AGENT_PROMPT>

<POLISH_MANDATE>
Misinformation must be recoverable. Confuse the player-character, not the save file.
</POLISH_MANDATE>
