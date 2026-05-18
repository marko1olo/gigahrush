# FLOOR20_VOID

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: expanded Void design floor.

<AGENT_PROMPT id="FLOOR20_VOID">
PROMPT IDENTIFIED: FLOOR20_VOID | DOMAIN: Existing floor expansion / Void / Protocol backlash | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/void.md`.
2. Read references: `src/gen/void/content_manifest.ts`, `src/gen/void/index.ts`, `src/gen/void/protocol_chamber.ts`, `src/gen/void/borrowed_light_rule.ts`, `Docs/Expansions/10_void_afterprotocol/`.
3. Create `Docs/Tasks/Status_FLOOR20_VOID.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR20_VOID.md`.
5. Run baseline `npm run build`.

## Goal

Add a Void expansion slice with one local protocol that preserves/erases/seals a target and creates bounded backlash.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/void.ts` or one new additive module under `src/gen/void/`
- `Docs/Tasks/Status_FLOOR20_VOID.md`
- `Docs/AgentLogs/LOG_FLOOR20_VOID.md`

Allowed with caution:
- `src/gen/void/content_manifest.ts` if a manifest exists and accepts additive content.

Forbidden:
- Do not rewrite final victory flow.
- Do not scan the whole world for protocol targets.
- Do not make protocol effects permanent global magic without local scope.

## Implementation Tasks

1. Add or export a Void protocol content slice.
2. Add protocol clerk/borrowed neighbor/black-box trace content.
3. Implement one protocol with target key, local benefit and backlash.
4. Use recent interaction/authored target/debug target, not world search.
5. Publish protocol/backlash events.
6. Run `npm run check`.

## Done Means

Void gains one understandable rule change with useful local benefit and explicit bounded backlash.
</AGENT_PROMPT>

<POLISH_MANDATE>
If the protocol cannot be explained by one short HUD/log line, reduce its scope.
</POLISH_MANDATE>

