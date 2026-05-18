# FLOOR20_VOID_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `FloorLevel.VOID` geometry owner, z=36 story/final anchor.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/void.md`, `src/gen/void/index.ts`, `src/gen/void/content_manifest.ts`, `src/gen/void/borrowed_light_rule.ts`.

## Owned Write Scope

Owned: `src/gen/void/index.ts`, optional `src/gen/void/geometry.ts`, void-only helpers, `Docs/Tasks/Status_FLOOR20_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR20_GEOMETRY.md`.

Allowed with caution: `content_manifest.ts` only to anchor existing VOID content to new geometry.

Forbidden: no save ending rewrite, no untestable teleport-only maze, no renderer-only illusion that lies about collision.

## Geometry Goal

Make VOID impossible but playable: islands in empty space, folded corridors, protocol rooms, borrowed-light shelters, boss approach lanes and clear return/ending paths.

## Tasks

1. Build a macro layout of void islands linked by narrow folded corridors and protocol chambers.
2. Use impossible-feeling geometry through toroidal wrapping, repeated rooms and visual motifs while keeping collision honest.
3. Place borrowed-light or shelter spaces where the player can recover and plan.
4. Add motifs: protocol chamber, void island, folded corridor, white boss lane, borrowed-light shelter, return portal frame.
5. Keep final/portal transitions reachable and smoke-testable.
6. Run `npm run check`.

## Done Means

VOID feels anomalous through the room graph itself, but a player can still navigate, fight and finish without guessing hidden rules.
