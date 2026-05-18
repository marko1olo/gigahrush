# Status: FLOOR02_CHTHONIC_ATTIC

Date: 2026-05-18

## Scope

Implemented the future design-floor module for `chthonic_attic` in `src/gen/design_floors/chthonic_attic.ts`.

This stays within the floor prompt write scope. It does not add a new `FloorLevel`, does not edit Hell/Ministry orchestrators, and does not wire the floor into current lift/save/debug manifests.

## Delivered

- Exported `generateChthonicAtticDesignFloor()`.
- Added a self-contained `DESIGN_FLOOR_ID = 'chthonic_attic'` and future `z=-36` debug metadata.
- Stamped a connected attic layout with:
  - wide combat lane from entry to roof service exit;
  - narrow cable/crawl route through three crawlspaces;
  - concrete-root obstacles and a root nursery;
  - shrine niches, witness/shelter niche, evidence storage and liquidator burn post;
  - three exit targets: `ministry_return`, `roof_service`, `crawl_hatch`.
- Added four named NPC roles through `registerSideQuest()` content registration:
  - `attic_agrafena_rootkeeper`;
  - `attic_deacon_ostap`;
  - `attic_cable_boy_yura`;
  - `attic_liquidator_masha`.
- Added four side quests:
  - `attic_cut_or_feed_root`;
  - `attic_black_hand_report`;
  - `attic_crawl_escort`;
  - `attic_burn_niche`.
- Implemented generation/interaction root state with `cut`, `feed` and `burn` choices.
- Added shelter-with-cost state:
  - `cut`: delayed shelter opening;
  - `feed`: item cost through `meat_rune`;
  - `burn`: HP cost from smoke/heat.
- Exported `publishChthonicAtticRootChoice()` using the existing world-event store with `room_regrown` plus attic/root choice tags and compact cross-floor data.
- Exported `traceChthonicAtticExitPaths()` for softlock verification.

## Route Trace

Manual route trace from spawn to every exit after each root choice:

```txt
cut:  ministry_return=6, roof_service=210, crawl_hatch=194
feed: ministry_return=6, roof_service=210, crawl_hatch=194
burn: ministry_return=6, roof_service=210, crawl_hatch=248
```

All exits remain reachable after every root choice.

## Validation

- `npm run build` baseline before edits: passed.
- `npm run typecheck`: passed.
- Temporary esbuild-bundled route check: passed.
- Local item-id check for attic `defId` / quest item references: passed.

`npm run check` was not run because this change adds a standalone future generator module and docs only; it does not touch systems, rendering, save/load, AI, inventory, economy, the quest system or current generation orchestration.
