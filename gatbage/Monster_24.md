# Monster_24_Pristav_Pustoty

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: Void protocol enforcer encounter owner.

<AGENT_PROMPT id="MONSTER_24_PRISTAV_PUSTOTY">
PROMPT IDENTIFIED: MONSTER_24_PRISTAV_PUSTOTY | DOMAIN: Monster Content | ITERATION: monsters.md wave 1.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read `README.md`, `architecture.md`, `desdoc.md`, `monsters.md`, and `AGENTS.md`.
3. Read relevant source:
   - `src/systems/void_protocols.ts`
   - `src/gen/void/protocol_chamber.ts`
   - `src/gen/void/trace_seal_protocol.ts`
   - `src/entities/spirit.ts`
   - `src/entities/paragraph.ts`
   - `src/systems/events.ts`
4. Create `Docs/Tasks/Status_MONSTER_24_PRISTAV_PUSTOTY.md`.
5. Append final report to `Docs/AgentLogs/LOG_MONSTER_24_PRISTAV_PUSTOTY.md`.
6. Run baseline `npm run typecheck` and record the exact result.

## Goal

Implement `pristav_pustoty` / **Пристав Пустоты** as a local Void rule enforcer. The rule must be stated before enforcement, and violation must be a choice.

## Absolute Write Scope

Owned:
- New source file: `src/gen/void/pristav_pustoty.ts`
- `Docs/Tasks/Status_MONSTER_24_PRISTAV_PUSTOTY.md`
- `Docs/AgentLogs/LOG_MONSTER_24_PRISTAV_PUSTOTY.md`
- Optional focused test: `tests/monster_24_pristav_pustoty.test.ts`

Conditional integration:
- `src/gen/void/content_manifest.ts` only with explicit manifest ownership.
- Do not edit `src/systems/void_protocols.ts` unless the runner explicitly reassigns ownership.

Forbidden:
- Do not create a universal law engine.
- Do not hide the rule.
- Do not tax/delete irreplaceable quest items.

## Design Contract

- id: `pristav_pustoty`
- ru_name: `Пристав Пустоты`
- mode: A local chamber rule; B later only if reused
- floors: `VOID`, `darkness`, protocol chambers
- room/context: protocol chamber, toll line, borrowed light marker
- warning cue: protocol text appears before body, entity waits until violation
- counterplay: obey rule, pay small cost, break protocol anchor, deliberately violate after preparing
- failure result: `SPIRIT`/`PARAGRAPH` pressure, small item tax, route penalty
- reward/trace: `void_spike`, `psi_mark`, protocol rumor
- event/rumor hook: tags `monster`, `void`, `protocol`, `rule`

## Implementation Tasks

1. Create one Void chamber with a short rule readable in-world/log.
2. Implement the rule locally with simple state: paid/obeyed/violated/anchor broken.
3. Spawn pressure only after violation or deliberate attack.
4. Keep costs small and avoid unique quest items.
5. Publish event for rule stated, obeyed, violated, paid, or anchor broken.
6. Ensure the exit remains reachable after every outcome.
7. Run `npm run typecheck`; run `npm run check` if integrated.

## Done Means

- The player sees the rule before consequence.
- Obedience, payment, sabotage and combat are all understandable.
- No broad Void protocol rewrite is required.
</AGENT_PROMPT>

<POLISH_MANDATE>
Void rules can be strange, but not unfair. State the rule, then let the player decide.
</POLISH_MANDATE>
