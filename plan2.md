1. **Add `MonsterKind.GNOME` to `src/core/types.ts`:** (already done)
2. **Add GNOME definition to `MONSTER_ECOLOGY` in `src/data/monster_ecology.ts`:**
   Add a record for GNOME specifying `floors: [FloorLevel.MAINTENANCE, FloorLevel.LIVING]`, `rooms: [RoomType.STORAGE, RoomType.CORRIDOR]`, counterplay, and loot hints. The issue states it should have a ~5% weight of the total pool in those floors, so we will assign `spawnWeight: 5.0` (which is about 5% if total weights are around 100, checking the other monsters). Include properties `minSamosborCount: 1`, `rare: false`, `rareDrops: []`.
3. **Add rumors about gnomes in `src/data/rumors.ts`:**
   Add a new rumor inside `BASE_RUMORS` array:
   ```ts
   {
      id: 'gnome_sighting',
      topic: 'monster',
      minTrust: -10,
      floors: [FloorLevel.MAINTENANCE, FloorLevel.LIVING],
      text: ['В коллекторах видели мелких. Шустрые, гады.', 'Мелкие твари, гномы, быстро бегают в жилых секторах.'],
      reveals: { kind: 'monster', monsterKind: MonsterKind.GNOME, confidence: 2 }
   }
   ```
4. **Add `MonsterKind.GNOME` to procedural generators in `src/data/procedural_floors.ts`:**
   Add `MonsterKind.GNOME` to `residential` and `maintenance` floor arrays in `src/data/procedural_floors.ts`. The pool in `procedural_floors.ts` has around 10 items.
5. **Verify changes:** Run `npm run typecheck` and `npm run test:unit` to verify the code changes and ensure no regressions were introduced.
6. Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
