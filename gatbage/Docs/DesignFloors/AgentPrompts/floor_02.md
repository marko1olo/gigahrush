# FLOOR02_CHTHONIC_ATTIC_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `chthonic_attic` geometry owner, z=-36.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/chthonic_attic.md`, `src/gen/design_floors/chthonic_attic.ts`, `src/gen/design_floors/full_floor.ts`.

## Owned Write Scope

Owned: `src/gen/design_floors/chthonic_attic.ts`, local helpers, `Docs/Tasks/Status_FLOOR02_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR02_GEOMETRY.md`.

Allowed with caution: one isolated `chthonic_attic` integration call if current full-floor expansion blocks the new local geometry.

Forbidden: no global route edits, no new core cell types, no per-frame shifting maze.

## Geometry Goal

Make the attic a concrete root system above the building: low crawl corridors, thick support trunks, broken service lofts, crawl hatches, false maintenance rooms and root-like passages that coil around protected voids.

## Tasks

1. Replace generic block feel with dendritic root topology: a main spine, branching crawl tubes, bulb chambers and blocked stubs.
2. Use toroidal wrapping deliberately for one or two "impossible attic" loops, but keep navigation readable.
3. Create at least three room families: root throat, concrete nest, service crawl, ritual storage or broken stairhead.
4. Add chokepoints where enemies can pressure the player, plus alternate crawl bypasses for hiding/fleeing.
5. Keep exits to roof/ministry-side routes reachable and clearly marked by geometry, not just labels.
6. Run `npm run check`.

## Done Means

The floor reads as a chthonic crawlspace network from spawn, has multiple loops and route choices, and cannot be mistaken for Ministry offices with darker textures.
