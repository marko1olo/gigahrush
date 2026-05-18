# FLOOR11_LIVING

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: expanded Living design floor.

<AGENT_PROMPT id="FLOOR11_LIVING">
PROMPT IDENTIFIED: FLOOR11_LIVING | DOMAIN: Existing floor expansion / Hub / Expedition prep | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/living.md`.
2. Read references: `src/gen/living/content_manifest.ts`, `src/gen/living/zone_content.ts`, `src/gen/living/tutor_room.ts`, `src/systems/quests.ts`.
3. Create `Docs/Tasks/Status_FLOOR11_LIVING.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR11_LIVING.md`.
5. Run baseline `npm run build`.

## Goal

Add a Living-floor expedition-prep slice that helps players choose and prepare for design-floor routes without turning the hub into a menu.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/living.ts` or one new additive module under `src/gen/living/`
- `Docs/Tasks/Status_FLOOR11_LIVING.md`
- `Docs/AgentLogs/LOG_FLOOR11_LIVING.md`

Allowed with caution:
- `src/gen/living/content_manifest.ts` for one side-effect import.

Forbidden:
- Do not rewrite the tutorial chain.
- Do not remove existing plot NPC behavior.
- Do not add DOM UI.

## Implementation Tasks

1. Add route-prep NPC/content for expedition preparation.
2. Add quests for supplies, return evidence, hermodoor repair and lost property.
3. Use existing zone content/side quest patterns.
4. Make at least one return-from-floor consequence visible in log/NPC/dialogue.
5. Keep content protected from volatile rebuild if placed in Living.
6. Run `npm run check`.

## Done Means

Living helps select and prepare a future expedition while staying a playable hub, not an exposition screen.
</AGENT_PROMPT>

<POLISH_MANDATE>
Do not explain every floor in dialogue. Give concrete prep hints: item, risk, route, consequence.
</POLISH_MANDATE>

