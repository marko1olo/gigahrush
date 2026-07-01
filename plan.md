1. **Optimize `getCurrentPlayerEntity` in `src/systems/player_actor.ts`**
   - The current implementation of `getCurrentPlayerEntity` uses `entities.find()` which is O(N).
   - Change it to use `getEntityIndex().byId.get(currentPlayerId)` which is O(1).
2. **Replace `findPlayer` with `getCurrentPlayerEntity` across the codebase**
   - Import `getCurrentPlayerEntity` from `src/systems/player_actor.ts`.
   - Find all `findPlayer` usages in:
     - `src/systems/hermodoor_borer.ts`
     - `src/systems/samosbor.ts`
     - `src/systems/samosbor_director.ts`
     - `src/gen/hell/myasomer.ts`
     - `src/gen/hell/altar_arena.ts`
     - `src/gen/void/maronary_signalshchik.ts`
   - Replace the usages and delete the local `findPlayer` definitions.
3. **Pre-commit step**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
4. **Submit PR**
   - Commit the change with the PR title and description outlining the O(N) -> O(1) performance improvements in looking up the player entity.
