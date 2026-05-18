# FLOOR03_ANTENNA_COURT_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `antenna_court` geometry owner, z=-32.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/antenna_court.md`, `src/gen/design_floors/antenna_court.ts`, `src/gen/design_floors/full_floor.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/antenna_court.ts`, antenna-only helpers, `Docs/Tasks/Status_FLOOR03_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR03_GEOMETRY.md`.

Allowed with caution: one isolated route branch/call in `full_floor.ts` if needed.

Forbidden: no render-specific radio hacks, no network assets, no central signal-system rewrite.

## Geometry Goal

Make an outdoor/indoor signal yard with radial antenna fields, cable trenches, fenced quadrants, repeater towers and maintenance cabins. The maze should be built from signal lines and cable routes rather than normal rooms.

## Tasks

1. Generate a radial or multi-hub antenna layout with towers as landmarks and cable trenches as corridors.
2. Add fenced sectors with gates/chokepoints and at least two bypass routes through trenches or maintenance rooms.
3. Use line-of-sight intentionally: some long lanes for signal/sniper risk, broken by towers and cable reels.
4. Add at least three motifs: antenna mast cluster, cable trench, relay cabin, fenced yard, weather-screen wall.
5. Keep route exits obvious and reachable from the central signal landmark.
6. Run `npm run check`.

## Done Means

The floor feels like a signal-yard labyrinth: navigation follows cables, towers and fenced sectors, not generic apartment or office corridors.
