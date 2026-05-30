# Procedural Anomaly: `none`

Type: existing `FloorAnomalyId`.

Goal: keep a clean baseline for geometry and majority tests.

Implementation task:

- Do not add behavior.
- Use this id in forced-spec tests when validating geometry profiles.

Validation:

- Changed procedural geometry must pass at least one test with `anomalyId: 'none'`.
