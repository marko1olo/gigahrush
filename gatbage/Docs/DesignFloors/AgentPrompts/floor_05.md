# FLOOR05_MINISTRY_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `FloorLevel.MINISTRY` geometry owner, z=-24 story anchor.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/ministry.md`, `src/gen/ministry/index.ts`, `src/gen/ministry/content_manifest.ts`, `src/gen/floor_manifest.ts`.

## Owned Write Scope

Owned: `src/gen/ministry/index.ts`, optional `src/gen/ministry/geometry.ts`, ministry-only helpers, `Docs/Tasks/Status_FLOOR05_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR05_GEOMETRY.md`.

Allowed with caution: `src/gen/ministry/content_manifest.ts` only if geometry needs to protect existing content placement.

Forbidden: no plot-chain rewrite, no `main.ts`, no save/load changes, no erasing existing Ministry content modules.

## Geometry Goal

Make Ministry a grand administrative labyrinth: axial halls, nested rings, marble courtyards, queue serpents, document gates, archive loops and private service corridors.

## Tasks

1. Refactor or extend the base generator so the macro layout has recognizable axes/rings instead of only maze cells.
2. Protect existing Ministry POIs while making them sit naturally on the new circulation graph.
3. Add route classes: public carpet hall, clerk queue, archive/service backroute, locked authority shortcut.
4. Ensure queue geometry creates decisions: wait/steal/bribe/fight/bypass, with physical room for each.
5. Keep samosbor shelter and exit reachability clear after generation.
6. Run `npm run check`.

## Done Means

Ministry becomes a legible bureaucratic megastructure with public and private circulation, not a generic office maze with marble textures.
