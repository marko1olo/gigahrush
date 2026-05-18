# Status AG19 Metro Error Line

Date: 2026-05-17

## Scope

- Implemented metro as a maintenance-floor room/pocket route MVP.
- No new `FloorLevel` was added.
- No moving train physics or transport engine was added.

## Shipped

- `src/gen/maintenance/metro_error_line.ts` adds `Станция ошибочной линии: платформа 19`, `Депо без рельсов: карман маршрута`, and `Слепая пересадка: чужой вестибюль`.
- `src/data/metro.ts` defines four interaction-time routes: `Жилая петля`, `Красная нижняя`, `Депо без рельсов`, and `Слепая пересадка`.
- `src/systems/metro.ts` resolves ticket checks, cooldown, wrong-stop chance, samosbor risk, and route events when the player presses `E` on a station route panel.
- Three NPCs and three side quests were added: Жанна Жетонная, Боря Сцепщик, and Лида Не-та.
- Metro rumors and world-log event text were added for `metro_route_taken` and `metro_wrong_stop`.
- README facts were updated.

## Validation

- Baseline `npm run build`: passed before AG19 edits.
- `npm run typecheck`: passed after AG19 edits.
- `npm run check`: passed after final integration.
