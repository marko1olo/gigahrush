# FLOOR17_DARK_METRO

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Dark Metro design floor.

<AGENT_PROMPT id="FLOOR17_DARK_METRO">
PROMPT IDENTIFIED: FLOOR17_DARK_METRO | DOMAIN: Design floor / Dark routes / Wrong station | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/dark_metro.md`.
2. Read references: `Docs/Expansions/02_metro_error_line/`, `src/gen/maintenance/metro_error_line.ts`, `src/data/metro.ts`, `src/systems/metro.ts`, `src/render/map_ui.ts`.
3. Create `Docs/Tasks/Status_FLOOR17_DARK_METRO.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR17_DARK_METRO.md`.
5. Run baseline `npm run build`.

## Goal

Implement a dark station/underpass floor with wrong-route shortcuts, light restoration, stranded NPC rescue and deterministic route clues.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/dark_metro.ts`
- Optional local dark metro data file
- `Docs/Tasks/Status_FLOOR17_DARK_METRO.md`
- `Docs/AgentLogs/LOG_FLOOR17_DARK_METRO.md`

Forbidden:
- Do not make the screen unreadably black.
- Do not add moving train simulation.
- Do not teleport the player randomly without physical clues and fallback.

## Implementation Tasks

1. Export `generateDarkMetroDesignFloor()`.
2. Stamp station hall, platform, underpass, kiosk, signal room and blind tunnel.
3. Add NPCs/quests for light platform, wrong train, stranded rescue and signal box.
4. Store wrong-route/light state compactly.
5. Publish route events for future Market/Service/Hell hooks.
6. Run `npm run typecheck`; run `npm run check` if route systems change.

## Done Means

Dark Metro is scary but readable, and one shortcut has a clear clue, cost and safe fallback.
</AGENT_PROMPT>

<POLISH_MANDATE>
Test every darkness decision for readability. If the player cannot navigate, add lights/landmarks instead of more text.
</POLISH_MANDATE>

