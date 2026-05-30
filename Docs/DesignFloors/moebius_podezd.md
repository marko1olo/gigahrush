# Мёбиус-подъезд

Shipped route id: `moebius_podezd`

Route: `z=+2`, base floor `KVARTIRY`.

Implementation:

- `src/gen/design_floors/moebius_podezd.ts`
- `src/data/design_floors.ts`
- `src/gen/design_floors/manifest.ts`

## Shipped Floor

`moebius_podezd` is a residential orientation floor between `LIVING` and `communal_ring`. It has two long residential strips joined by a safe public loop, mirrored flat labels, paired seam landmarks and a central parity shortcut locked by seam gates.

The baseline route does not require the shortcut: both up and down lift directions remain reachable through the public loop. The optional shortcut is a risky seam route with a lock/tool decision, mirror-tell containers, reversed patrol actors and a recoverable route-marker stash.

## Validation Surface

- Public loop reaches route lifts without opening locked seam gates.
- Two residential strips and mirrored flats are real `Room` records.
- Paired seam landmarks and visible screen/wall cues mark the orientation flip.
- The parity shortcut is optional and keyed by `rubber_door_wedge`.
- Route-marker recovery is represented by a tagged stash with chalk and lift-order loot.
