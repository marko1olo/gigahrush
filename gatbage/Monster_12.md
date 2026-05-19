# Monster_12_Chernaya_Lichinka

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: black slime cleanup pressure owner.

<AGENT_PROMPT id="MONSTER_12_CHERNAYA_LICHINKA">
PROMPT IDENTIFIED: MONSTER_12_CHERNAYA_LICHINKA | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/maintenance/black_slime_eyes.ts`
   - `src/data/slime_defs.ts`
   - `src/systems/uv_spotlight.ts`
   - `src/entities/eye.ts`
   - `src/entities/sborka.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_12_CHERNAYA_LICHINKA.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_12_CHERNAYA_LICHINKA.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `chernaya_lichinka` / **Черная Личинка** as a black-slime residue encounter. The player should choose UV/fire/seal/avoid/harvest instead of only shooting.

## Absolute Write Scope

Owned:
- New source file: `src/gen/maintenance/chernaya_lichinka.ts`
- `Docs/Tasks/Status_MONSTER_12_CHERNAYA_LICHINKA.md`
- `Docs/AgentLogs/LOG_MONSTER_12_CHERNAYA_LICHINKA.md`
- Optional focused test: `tests/monster_12_chernaya_lichinka.test.ts`

Conditional integration:
- `src/gen/maintenance/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add global slime growth timers.
- Do not create new slime ids.
- Do not make cleanup require a new item that is unavailable.

## Design Contract

- id: `chernaya_lichinka`
- ru_name: `Черная Личинка`
- mode: A local encounter using `EYE`/`SBORKA`; B later only if growth becomes generic
- floors: `MAINTENANCE`, black slime POIs, cult false-safe blocks
- room/context: black slime eyelets, sample room, cult-contaminated cleanup site
- warning cue: wet clicking, black eyelets, UV flicker, cult marks near residue
- counterplay: UV spotlight, fire, seal sample, avoid stepping through, remove cult witness
- failure result: larva becomes an `EYE` variant or spawns a small ambush; sample becomes riskier
- reward/trace: `slime_sample_black`, `psi_dust`, sealed-residue event
- event/rumor hook: tags `monster`, `slime_black`, `uv`, `cleanup`

## Implementation Tasks

1. Create a local black-slime chamber or reuse patterns from `black_slime_eyes.ts`.
2. Add visible black slime marks and a sample/reward decision.
3. Add at least two counterplay paths: UV/fire/seal/avoid.
4. Spawn a capped small threat only if the player mishandles residue or chooses risky harvest.
5. Publish event for sealed, burned, sampled, or awakened outcomes.
6. Keep all state local to the generated room.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- Cleanup is a real alternative to combat.
- Black slime feels dangerous before it attacks.
- No global growth simulation is introduced.
</AGENT_PROMPT>

<POLISH_MANDATE>
The larva exists to make cleanup tools meaningful. Do not make it another Eye with a black palette.
</POLISH_MANDATE>
