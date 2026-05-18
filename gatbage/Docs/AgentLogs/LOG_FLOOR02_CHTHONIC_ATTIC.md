# LOG: FLOOR02_CHTHONIC_ATTIC

Date: 2026-05-18

## Summary

Added `src/gen/design_floors/chthonic_attic.ts` as a self-contained future authored-floor module for the Chthonic Attic design brief.

The implementation deliberately avoids current story-floor integration. The design-floor contract says these planned floors are not shipped behavior until an integrator wires route ids, save/load, debug travel and README facts. The module therefore exports generator/debug/trace/event helpers and registers its content when imported.

## Implementation Notes

- The floor uses fixed authored topology inside the 1024x1024 toroidal world.
- The main route is a wide combat lane with root obstacles that narrow pressure without blocking traversal.
- The alternate route is a narrow crawl/cable route through three crawlspaces.
- Root choices are compact state mutations:
  - `cut` opens root work and seals the relic niche;
  - `feed` opens relic access and seals the root nursery/shelter at item cost;
  - `burn` scorches the shrine and tightens one crawl door while leaving the main lane open.
- No live root-growth simulation or per-frame scan was added.
- Cross-floor relevance is carried by an existing `WorldEvent` type with tags and data rather than a new event bus or enum.

## Validation Log

Baseline:

```txt
npm run build
passed
```

Typecheck:

```txt
npm run typecheck
passed
```

Route trace:

```txt
cut: ministry_return:6, roof_service:210, crawl_hatch:194
feed: ministry_return:6, roof_service:210, crawl_hatch:194
burn: ministry_return:6, roof_service:210, crawl_hatch:248
```

All root choices preserve spawn-to-exit reachability.

Local item-id check: all 18 item ids referenced by the module exist in `src/data/items.ts`.
