# FLOOR08_KVARTIRY

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: expanded Kvartiry design floor.

<AGENT_PROMPT id="FLOOR08_KVARTIRY">
PROMPT IDENTIFIED: FLOOR08_KVARTIRY | DOMAIN: Existing floor expansion / Kvartiry / Social riot | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/kvartiry.md`.
2. Read references: `src/gen/kvartiry/content_manifest.ts`, `src/gen/kvartiry/social_pressure.ts`, `src/gen/kvartiry/social_helpers.ts`, `src/data/resources.ts`.
3. Create `Docs/Tasks/Status_FLOOR08_KVARTIRY.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR08_KVARTIRY.md`.
5. Run baseline `npm run build`.

## Goal

Add a Kvartiry expansion slice that strengthens dense social riot gameplay and route consequences without raising global population caps.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/kvartiry.ts` or one new additive module under `src/gen/kvartiry/`
- `Docs/Tasks/Status_FLOOR08_KVARTIRY.md`
- `Docs/AgentLogs/LOG_FLOOR08_KVARTIRY.md`

Allowed with caution:
- `src/gen/kvartiry/content_manifest.ts` for one import/runner entry.

Forbidden:
- Do not rewrite Kvartiry population logic.
- Do not add crowd simulation.
- Do not edit `main.ts` or core floor enums.

## Implementation Tasks

1. Add one social conflict with at least three outcomes.
2. Include route impact toward Manhattan Crossroads, Communal Ring or Market 88.
3. Use existing social pressure hooks where possible.
4. Add bounded NPCs, containers and rumors/contracts.
5. Publish an event for the chosen outcome.
6. Run `npm run check`.

## Done Means

Kvartiry gains a real social-route decision and aftermath without new unbounded NPC behavior.
</AGENT_PROMPT>

<POLISH_MANDATE>
Count active NPCs created by the new content. If the number scales with room count or world size, cap it.
</POLISH_MANDATE>

