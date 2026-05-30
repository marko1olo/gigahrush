# Shared Tool: Maze Graphs

Purpose: reusable maze/labyrinth graph generation for Ministry, Maintenance, archives, labyrinth floors and procedural profiles.

Recommended module:

- `src/gen/maze_graph.ts`

Implement in order:

1. Growing Tree with selection weights (`newest`, `oldest`, `random`).
2. Braiding post-pass.
3. Landmark scoring.
4. Wilson only when a floor needs uniform spanning tree fairness.

Graph data:

- nodes on coarse toroidal grid
- edges with tags: `backbone`, `chord`, `locked_optional`, `reward_leaf`
- start/end anchors
- protected seam metadata

Rasterization:

- emit intent graph first
- caller stamps into `World`
- caller owns rooms, doors, textures and features

Validation:

- graph connected before rasterization
- lift backbone ungated
- optional locks only on chords/leaves
- landmark spacing recorded
