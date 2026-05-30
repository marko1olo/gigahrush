# Procedural Anomaly: `teleport_cells`

Type: existing `FloorAnomalyId`.

Goal: make sparse topology pairs readable and route-safe.

Geometry plan:

- Paired seamlets.
- Dislocated shortcut islands.
- Visible markers/screens/lights near pairs.

Runtime constraints:

- Pairs remain sparse and bidirectional.
- Lift backbone must work without using teleport pairs.

Validation:

- Every pair has reverse pair.
- No protected/lift cell is teleported.
