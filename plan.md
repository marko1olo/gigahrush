1. **Analyze existing algorithms:** Review `connectRoomsMST` in `src/gen/shared.ts` and `carveOrganicCorridor` and `carveCorridor` in `src/gen/shared.ts`. Review `stitchSectorBoundaries` in `src/gen/procedural_floor.ts`.
2. **Update `connectRoomsMST`:** The current MST calculation in `src/gen/shared.ts` uses `world.dist()`, which might not properly account for toroidal distances (dist vs dist2 shouldn't matter for MST order, but let's double check if dist is correct). Actually, `world.dist` correctly uses `world.delta` which wraps over `W`.
3. **Refine carving functions (`carveCorridor` and `carveOrganicCorridor`) in `src/gen/shared.ts`:** Make sure that when a corridor hits a room, it creates a door cleanly instead of just busting through, and doesn't cut through `aptMask`.
4. **Create a new script `tests/generation-stitching.test.ts`:** Write a test that initializes a small 128x128 `World` instance, stamps a few rooms, calls `connectRoomsMST`, and then verifies connectivity from the first room using a Flood Fill (`checkConnectivity` or `ensureConnectivity`).
5. **Pre-commit step:** Run pre-commit instructions (audit, tests, etc.)
6. **Submit.**
