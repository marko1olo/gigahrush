1.  **Create `src/render/critters.ts`**:
    *   Implement an interface `Critter` (x, y, kind: 'rat' | 'roach' | 'fly', life, vx, vy, originX, originY).
    *   Maintain a module-level array `const activeCritters: Critter[] = []`.
    *   Implement `updateCritters(world: World, camera: CameraView, dt: number, time: number, entities: Entity[]): BloodParticle[]`. We can compute `dt` if we store `lastTime`, or just accept `dt` if we change `renderSceneGL` signature to include `dt`. Wait, `renderSceneGL` has `time` but not `dt`. Let's just track `lastTime` inside `critters.ts`.
    *   Initialize `xorshift32` using `Math.floor(time * 10)` as seed to get deterministic visual critters without using `Math.random()`. Cap to 30.
    *   Every update interval (e.g. 0.1s to save cycles), scan up to 10 random cells within radius 15 from `camera.x, camera.y`.
        *   Rats: Check if `room.type === RoomType.STORAGE | KITCHEN` (using `world.roomMap[ci]` to get `roomId`, then `world.rooms[roomId]`). Or near a container (`world.containers`).
        *   Cockroaches: Check if `room.type === RoomType.BATHROOM` or `world.light[ci] < 0.3`.
        *   Flies: Check if `world.surfaceMap.has(ci)` or if near a dead entity (`hp !== undefined && hp <= 0` in `entities`).
        *   Do not spawn in clean, well-lit rooms (`world.light[ci] >= 0.3` unless fly).
    *   Update positions based on `dt`.
    *   Map `Critter` instances to `BloodParticle` (`kind: 'debris'`, specific colors/sizes).
    *   Verify the newly created file using `cat src/render/critters.ts`.
2.  **Modify `src/render/webgl.ts`**:
    *   Import `updateCritters` from `./critters`.
    *   In `renderSceneGL`, call `const critterParticles = updateCritters(world, camera, time, entities);` to get critter particles. (We will change the signature of `updateCritters` to only take `time` and derive `dt`).
    *   Call `renderParticlesGL` with `critterParticles` after the main `renderParticlesGL` call.
    *   Verify modifications using `cat src/render/webgl.ts`.
3.  **Run Compilation & Tests**:
    *   Run `npm run typecheck` to ensure the logic compiles perfectly.
    *   Run `npm run test:unit` to ensure no game logic regressions.
4.  **Complete pre commit steps**:
    *   Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5.  **Submit the change** with a descriptive commit message.
