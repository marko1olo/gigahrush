# Monster_14_Zhelemishnik

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: zhelemish food/medicine resource monster owner.

<AGENT_PROMPT id="MONSTER_14_ZHELEMISHNIK">
PROMPT IDENTIFIED: MONSTER_14_ZHELEMISHNIK | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/gen/living/zhelemish_cellar.ts`
   - `src/gen/living/fake_medpost_zhelemish.ts`
   - `src/data/zhelemish_defs.ts`
   - `src/systems/status.ts`
   - `src/entities/zombie.ts`
   - `src/entities/polzun.ts`
4. Create `Docs/Tasks/Status_MONSTER_14_ZHELEMISHNIK.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_14_ZHELEMISHNIK.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `zhelemishnik` / **Желемышник** as a cellar guardian around zhelemish harvest. It should make raw/eat/sell/boil/sample decisions dangerous and legible.

## Absolute Write Scope

Owned:
- New source file: `src/gen/living/zhelemishnik.ts`
- `Docs/Tasks/Status_MONSTER_14_ZHELEMISHNIK.md`
- `Docs/AgentLogs/LOG_MONSTER_14_ZHELEMISHNIK.md`
- Optional focused test: `tests/monster_14_zhelemishnik.test.ts`

Conditional integration:
- `src/gen/living/content_manifest.ts` only with explicit manifest ownership.

Forbidden:
- Do not add new zhelemish item ids.
- Do not make zhelemish a clean buff.
- Do not add roaming fungal threats across the whole floor.

## Design Contract

- id: `zhelemishnik`
- ru_name: `Желемышник`
- mode: A local `ZOMBIE`/`POLZUN` variant; B later only if reused
- floors: `LIVING`, `KVARTIRY`, mushroom/zhelemish cellars
- room/context: wet cellar, bathroom growth, folk medicine corner
- warning cue: leathery skin flakes, jelly smell, cellar growth, NPC warning
- counterplay: salt/fire if existing, harvest outer patch, distract with dried zhelemish, bring scientist container, leave raw patch
- failure result: infection/status or trust loss; patch spoils or spawns guardian
- reward/trace: `zhelemish_raw`, `zhelemish_dried`, `slime_sample_brown`
- event/rumor hook: tags `monster`, `zhelemish`, `food`, `medicine_counterfeit`

## Implementation Tasks

1. Create or extend a Living cellar with one guarded patch and one safe harvest option.
2. Use existing zhelemish defs and item ids only.
3. Add a slow guardian using existing monster behavior.
4. Add a decision: raw harvest, safe processing, surrender sample, leave, or risky sale clue.
5. Publish event for harvest, spoiled patch, guardian awakened, or safe sample.
6. Keep the guardian tied to the patch; it should not roam broadly.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player chooses between hunger, money, science, and safety.
- Желемыш remains useful but dirty.
- No new resource framework is introduced.
</AGENT_PROMPT>

<POLISH_MANDATE>
The zhelemish decision should have a price. Do not turn it into free food guarded by a generic zombie.
</POLISH_MANDATE>
