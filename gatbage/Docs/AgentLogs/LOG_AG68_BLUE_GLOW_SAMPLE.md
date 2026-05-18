# AG68 Blue Glow Sample Log

## 2026-05-18

- Added `src/gen/maintenance/blue_glow_sample.ts`.
- The generated POI is `Кэш голубого свечения`: a small maintenance medical/cache room with blue PSI surface marks, lamps, light fog, desks, apparatus, and a tagged `Гермобокс синего образца` container.
- The sealed container holds `blue_glow_sample_sealed`; container take events carry `ag68_blue_glow_sample`, `sample`, `blue_glow`, `sealed`, and `quarantine` tags.
- Added `blue_glow_sample_sealed` and `blue_glow_sample_open` items. The sealed sample has high value and opens into the lower-value opened sample; the opened sample gives a short PSI/бодрость benefit with HP cost.
- Added two reward paths in the same room:
  - `Вера Люминова` buys the sealed sample for science value.
  - `Кирилл Глушитель` destroys the sealed sample through a liquidator cleanup path.
- Registered AG68 event observer in the content module. It publishes opened, contaminated, sold, and destroyed facts through existing event types and bounded tags, and applies a minor medicine stock penalty on careless opening.
- Validation:
  - Baseline `npm run typecheck`: blocked, package has no `typecheck` script.
  - `npm run build`: passed.
  - `npm run check`: blocked, package has no `check` script.
  - `npx tsc --noEmit`: blocked by pre-existing dirty-tree errors outside AG68 scope.
