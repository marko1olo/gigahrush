# AG35 Monster Encounter Placement Log

## 2026-05-17

Implemented floor-local tactical monster placement without adding new monster kinds or global runtime spawning.

Placed encounters:

| Monster | Floor | Room / Module | Player Counterplay |
| --- | --- | --- | --- |
| `SHOVNIK` | `LIVING` | `Комната герметичного шва` / `src/gen/living/hermoseam_station.ts` | Pull it off walls into the open center; wall-adjacent movement and damage are stronger. |
| `LAMPOVY` | `LIVING` | `Комната герметичного шва` / `src/gen/living/hermoseam_station.ts` | Do not fight under lamps; move it behind the partition or toward darker floor. |
| `NELYUD` | `KVARTIRY` | `Комната чужой очереди` / `src/gen/kvartiry/false_neighbor.ts` | Keep distance until ready; it becomes dangerous only at close reveal range. |
| `PARAGRAPH` | `MINISTRY` | `Кабинет отказных параграфов` / `src/gen/ministry/refusal_clause.ts` | Use partitions to break line of sight, then close after the ranged shot. |
| `ROBOT` | `MAINTENANCE` | `Клеть автоматики: плазменный пост` / `src/gen/maintenance/automation_cage.ts` | Use the metal baffle and machinery lane; push after plasma volleys. |
| `LAMPOVY` | `MAINTENANCE` | `Клеть автоматики: плазменный пост` / `src/gen/maintenance/automation_cage.ts` | Pull it away from lamps before committing to melee. |
| `SPIRIT` | `HELL` | `Часовня тонкой стены` / `src/gen/hell/thin_wall_chapel.ts` | Walls do not stop it; kite through the open nave and flee through the connected exit if unprepared. |

Manifest wiring:

- `src/gen/living/content_manifest.ts`
- `src/gen/kvartiry/content_manifest.ts`
- `src/gen/ministry/content_manifest.ts`
- `src/gen/maintenance/content_manifest.ts`
- `src/gen/hell/content_manifest.ts`

Debug:

- Updated `src/systems/debug.ts` so "Спавн монстров" iterates all numeric `MonsterKind` values, including the newer tactical monsters.

Validation:

- Baseline `npm run build`: passed.
- Post-change `npm run build`: passed.
- Separate `npm run smoke`: passed.
- `npm run check`: failed at `typecheck` on out-of-scope existing work. The check run reported unused symbols in `src/render/map_ui.ts`; a follow-up typecheck also reported unrelated errors in `src/systems/faction_events.ts`.

No encounter is a monster dumped in a corridor. Each is generation-time, capped, placed in a named room, and paired with readable clues through room names, item drops, screens/posters/marks, or NPC lines.
