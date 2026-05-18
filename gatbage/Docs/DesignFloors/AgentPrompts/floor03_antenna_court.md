# FLOOR03_ANTENNA_COURT

Model: GPT-5.5  
Reasoning: xhigh  
Parallel role: authored Antenna Court design floor.

<AGENT_PROMPT id="FLOOR03_ANTENNA_COURT">
PROMPT IDENTIFIED: FLOOR03_ANTENNA_COURT | DOMAIN: Design floor / Signals / Radio quests | ITERATION: floor-wave-1.

## Mandatory Preflight

1. Read `README.md`, `architecture.md`, `desdoc.md`, `Docs/DesignFloors/INDEX.md`, `Docs/DesignFloors/floor_contract.md`, `Docs/DesignFloors/antenna_court.md`.
2. Read references: `src/data/screen_signals.ts`, `src/gen/procedural_screens.ts`, `src/gen/living/obzh_school.ts`, `src/systems/events.ts`, `src/systems/rumor.ts`.
3. Create `Docs/Tasks/Status_FLOOR03_ANTENNA_COURT.md`.
4. Append final report to `Docs/AgentLogs/LOG_FLOOR03_ANTENNA_COURT.md`.
5. Run baseline `npm run build`.

## Goal

Implement a signal hub floor where the player can tune, jam, record, sell or repair floor signals through bounded state.

## Absolute Write Scope

Owned:
- New `src/gen/design_floors/antenna_court.ts`
- Optional local antenna data file
- `Docs/Tasks/Status_FLOOR03_ANTENNA_COURT.md`
- `Docs/AgentLogs/LOG_FLOOR03_ANTENNA_COURT.md`

Forbidden:
- Do not make a live radio simulation.
- Do not reveal full maps for remote floors.
- Do not edit metro, numbered-floor or void systems directly.

## Implementation Tasks

1. Export `generateAntennaCourtDesignFloor()`.
2. Stamp antenna courtyard, radio booths, relay rooms, battery closet and operator dorm.
3. Add named NPCs and quests for tuning, jamming, recording and battery theft.
4. Store local signal state as compact flags/fields.
5. Publish signal events that future floors can consume by id.
6. Run `npm run typecheck`; run `npm run check` if touching systems.

## Done Means

The floor provides one useful clue, one risky jam and one record/sell decision without constant background simulation.
</AGENT_PROMPT>

<POLISH_MANDATE>
Keep signal rewards informational. If a reward bypasses exploration or reveals an entire floor, reduce it to a clue.
</POLISH_MANDATE>

