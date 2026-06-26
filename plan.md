1. **Add `ROOM_MEMORY_BITS.SEARCH` to track container opening.**
   - In `src/systems/room_memory.ts`, add `SEARCH: 1 << 6` to `ROOM_MEMORY_BITS`.
   - Update `roomMemoryBitsForEvent` in `src/systems/room_memory.ts` to include `if (type === 'container_opened') bits |= ROOM_MEMORY_BITS.SEARCH;`.
   - Use `run_in_bash_session` to verify all edits to `src/systems/room_memory.ts` using `cat` and `npm run typecheck`.

2. **Update `generateContainerLoot` signature and logic in `src/systems/procedural_loot.ts`.**
   - Update signature to `export function generateContainerLoot(tags: readonly string[], proceduralValueCap: number | undefined, level: number, rollItems: number[], context?: { roomType?: RoomType; floorLevel?: FloorLevel; hasBeenSearched?: boolean }): Item[]`.
   - Apply context-dependent logic:
     - Multiply base profiles based on `context.roomType` (e.g., `KITCHEN` boosts `foodMult`, `MEDICAL` boosts `medicineMult`, `STORAGE` boosts `toolMult`, etc).
     - Multiply base profiles based on `context.floorLevel` (e.g., `HELL` boosts `weaponMult`/`ammoMult`, `MINISTRY` boosts `miscMult` for paper).
     - If `context.hasBeenSearched` is true, reduce the chance of finding valuable items by 80% by scaling down `maxVal` directly in `generateContainerLoot`.
   - In `generateContainerLoot`, explicitly filter out items with the `plot` tag after picking from the pool. (Wait, `buildLootPool` builds the pool. Since I have read `buildLootPool`, I will add `if (itemDefHasTag(item, 'plot')) continue;` inside `buildLootPool` loop, or filter the returned items in `generateContainerLoot`). The reviewer suggested applying filtering of plot items directly to the returned array inside `generateContainerLoot` to avoid needing to modify `buildLootPool`. I'll do that, or rather, I'll filter them when picking: `if (itemDefHasTag(itemDef, 'plot')) continue;`. Actually, `ITEMS` already has `spawnW: 0` for plot items. But I will add an explicit check to make sure `itemDefHasTag(itemDef, 'plot')` is excluded.
   - For scarcity-driven ammo: in `generateContainerLoot` and `generateNpcLoadout`, reduce ammo spawn chance for lower level numbers (closer to surface) and increase it for `HELL`.
   - Verify edits to `src/systems/procedural_loot.ts` using `npm run typecheck` and `cat`.

3. **Update callers of `generateContainerLoot` in `src/systems/containers.ts` and anomalies.**
   - In `src/systems/containers.ts`, modify `seedInventory` to accept `roomType: RoomType | undefined` and `hasBeenSearched: boolean`.
   - In `ensureRoomContainers` (`src/systems/containers.ts`), pass `room.type` to `seedInventory`, and calculate `hasBeenSearched` by calling `roomMemoryHas(getRoomMemory(floor, room.id), ROOM_MEMORY_BITS.SEARCH)`.
   - In `makeFeatureLootContainer` (`src/systems/containers.ts`), pass `undefined` (or omit roomType context) to `seedInventory`.
   - In `src/gen/procedural_anomalies/zombie_apocalypse.ts`, update the `generateContainerLoot` call to include an empty context.
   - Run `npm run typecheck` to verify no broken signatures.

4. **Testing and Verification.**
   - Run `npm run typecheck` to ensure there are no TypeScript errors.
   - Run `npm run test:unit` to run unit tests.
   - Run `npm run content:audit` to verify balance and weights.

5. **Pre-commit checks.**
   - Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
