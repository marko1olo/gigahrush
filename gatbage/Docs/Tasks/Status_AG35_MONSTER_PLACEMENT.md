# AG35 Monster Encounter Placement Status

## Preflight

- Prompt block `AGENT_35_MONSTER_ENCOUNTER_PLACEMENT` extracted from `Docs/AgentPrompts/AGENT_35_MONSTER_ENCOUNTER_PLACEMENT.md`.
- Read source-of-truth docs: `README.md`, `architecture.md`, `desdoc.md` P0.2/P1.
- Read required monster/runtime files: `src/data/monster_ecology.ts`, `src/entities/monster.ts`, `src/systems/ai/monster.ts`, `src/systems/samosbor.ts`.
- Read floor manifests and existing monster-spawning POIs under `src/gen/`.
- Baseline `npm run build`: passed.

## Working Scope

- Add floor-local encounter modules under `src/gen/<floor>/`.
- Wire them through matching `content_manifest.ts` files.
- Keep all spawns generation-time only and capped.
- No new monster kinds, no `main.ts`, no shared generator rewrite.

## Placed Encounters

| Monster | Floor | Module | Role | Counterplay |
| --- | --- | --- | --- | --- |
| `SHOVNIK` | `LIVING` | `hermoseam_station.ts` | Hermodoor seam predator | Pull it into the center of the room, away from wall-adjacent damage/speed boosts. |
| `LAMPOVY` | `LIVING` / `MAINTENANCE` | `hermoseam_station.ts`, `automation_cage.ts` | Light-fed ambusher | Fight away from lamps or break line around machinery. |
| `NELYUD` | `KVARTIRY` | `false_neighbor.ts` | False civilian pressure | Keep distance; it reveals danger only at close range. |
| `PARAGRAPH` | `MINISTRY` | `refusal_clause.ts` | Bureaucratic ranged threat | Break line of sight behind partitions and close after shots. |
| `ROBOT` | `MAINTENANCE` | `automation_cage.ts` | Industrial firing lane | Use machinery/side aisle cover and push after plasma volleys. |
| `SPIRIT` | `HELL` | `thin_wall_chapel.ts` | Phasing wall threat | Do not trust walls; kite through the open nave and flee through the door. |

## Debug / Reachability Notes

- Existing floor travel is enough to reach each story floor.
- Debug menu command "Спавн монстров" now includes all tactical monster kinds for compact local checks.
- Authored rooms have readable names and item/NPC/surface clues so they can be found by map/log/visual inspection.

## Validation

- Baseline `npm run build`: passed before edits.
- Post-change `npm run build`: passed.
- Separate `npm run smoke`: passed.
- `npm run typecheck`: failed on out-of-scope files, not the AG35 modules.
- `npm run check`: failed during `typecheck`; subsequent direct typecheck also reports out-of-scope errors in `src/render/map_ui.ts` and `src/systems/faction_events.ts`.

## Notes

- All AG35 spawns are generation-time authored encounters, not per-frame spawners.
- Each encounter is in a named room with at least one visible clue: room name, item drop, screen/poster mark, NPC line, or floor mark.
- No rare monster was placed in a sealed/unreachable room.
