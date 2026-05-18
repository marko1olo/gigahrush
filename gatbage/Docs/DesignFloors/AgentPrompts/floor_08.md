# FLOOR08_KVARTIRY_GEOMETRY

Model: GPT-5.5
Reasoning: xhigh
Parallel role: `FloorLevel.KVARTIRY` geometry owner, z=-12 story anchor.

## Read First

Read `floor_00_geometry_contract.md`, `README.md`, `architecture.md`, `Docs/DesignFloors/kvartiry.md`, `src/gen/kvartiry/index.ts`, `src/gen/kvartiry/content_manifest.ts`, `src/gen/kvartiry/social_helpers.ts`.

## Owned Write Scope

Owned: `src/gen/kvartiry/index.ts`, optional `src/gen/kvartiry/geometry.ts`, kvartiry-only helpers, `Docs/Tasks/Status_FLOOR08_GEOMETRY.md`, `Docs/AgentLogs/LOG_FLOOR08_GEOMETRY.md`.

Allowed with caution: `content_manifest.ts` only to protect or place existing content against new geometry.

Forbidden: no population-cap increase, no crowd simulation, no erasing protected `aptMask` rooms.

## Geometry Goal

Make "квартиры ад": dense residential blocks, through-apartment shortcuts, shared kitchens, stairwell knots, barricaded courtyards, bathroom bottlenecks and social-pressure corridors.

## Tasks

1. Replace uniform residential maze feel with block/neighborhood clusters, each with its own courtyard or shared service knot.
2. Add through-apartment alternate routes that are tempting but socially risky.
3. Create chokepoints for barricades, protests and liquidator sweeps without increasing global NPC caps.
4. Add motifs: apartment chain, shared kitchen, stairwell knot, barricaded courtyard, corridor market strip.
5. Keep existing permanent content and riot hooks reachable.
6. Run `npm run check`.

## Done Means

Kvartiry navigation feels like hostile lived-in housing: dense, social, shortcut-rich and dangerous before any new quest is added.
