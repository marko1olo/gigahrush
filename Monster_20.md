# Monster_20_Maronary_Signalshchik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: Maronary aftermath signal encounter owner.

<AGENT_PROMPT id="MONSTER_20_MARONARY_SIGNALSHCHIK">
PROMPT IDENTIFIED: MONSTER_20_MARONARY_SIGNALSHCHIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/data/samosbor_variants.ts`
   - `src/systems/samosbor.ts`
   - `src/systems/samosbor_director.ts`
   - `src/gen/procedural_screens.ts`
   - `src/entities/eye.ts`
   - `src/entities/spirit.ts`
4. Create `Docs/Tasks/Status_MONSTER_20_MARONARY_SIGNALSHCHIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_20_MARONARY_SIGNALSHCHIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `maronary_signalshchik` / **Маронарный Сигнальщик** as a rare Maronary-style green signal aftermath encounter. It should improve readability of the existing `maronary` variant, not add a new samosbor variant.

## Absolute Write Scope

Owned:
- New source file: `src/gen/void/maronary_signalshchik.ts`
- `Docs/Tasks/Status_MONSTER_20_MARONARY_SIGNALSHCHIK.md`
- `Docs/AgentLogs/LOG_MONSTER_20_MARONARY_SIGNALSHCHIK.md`
- Optional focused test: `tests/monster_20_maronary_signalshchik.test.ts`

Conditional integration:
- `src/gen/void/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add a new samosbor variant.
- Do not make green signal a permanent global hazard.
- Do not silently alter navigation/quest state.

## Design Contract

- id: `maronary_signalshchik`
- ru_name: `Маронарный Сигнальщик`
- mode: A local aftermath/signal encounter
- floors: Maronary aftermath, screen-heavy route floors, `VOID`
- room/context: green source room, high-beep corridor, signal screen
- warning cue: high beep, green screen source, light/body mismatch
- counterplay: leave screen room, break source, follow non-green route, use cover, ignore signal
- failure result: confusion/delay, `EYE` or `SPIRIT` pressure
- reward/trace: `overexposed_photo`, `bottled_voice`, green-source event
- event/rumor hook: tags `monster`, `maronary`, `green_source`, `signal`

## Implementation Tasks

1. Create a local room that can appear as a readable Maronary-like aftermath or debug-forced encounter.
2. Use green source/screen cues already established in samosbor data.
3. Add one ranged or phasing pressure monster, but make the signal source the rule.
4. Add a clean disable/avoid route.
5. Publish event when the source is heard, followed, disabled, or cleared.
6. Do not change `SAMOSBOR_VARIANTS` unless the prompt is explicitly widened.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The encounter teaches Maronary cues.
- Green signal is local and recoverable.
- No new variant, no global navigation corruption.
</AGENT_PROMPT>

<POLISH_MANDATE>
Make the signal memorable, not omnipresent. It should explain Maronary, not replace it.
</POLISH_MANDATE>
