1.  **Add `MonsterKind.GNOME` to `src/core/types.ts`:** Done.
2.  **Add GNOME definition to `MONSTER_ECOLOGY` in `src/data/monster_ecology.ts`:**
    ```ts
    {
      kind: MonsterKind.GNOME,
      role: 'Мелкий, шустрый обитатель технических и жилых зон.',
      cue: 'Шорох, быстрый топот маленьких ног, тихий писк.',
      rule: 'Держится группами, убегает от света, нападает на отставших.',
      floorFit: 'Коллекторы, техобслуживание, заброшенные жилые сектора.',
      floors: [FloorLevel.MAINTENANCE, FloorLevel.LIVING],
      rooms: [RoomType.STORAGE, RoomType.CORRIDOR],
      spawnWeight: 5.0,
      minSamosborCount: 1,
      rare: false,
      lootHint: 'мелкий мусор, запчасти',
      counterplay: 'Включить свет, использовать фонарь, бить по ногам.',
      deathLogHint: 'Загрызен толпой мелких тварей из-за нехватки света.',
      rumorIds: ['gnome_sighting'],
      rareDrops: [],
    }
    ```
    I will also need to add GNOME context to `MONSTER_ECOLOGY_CONTEXT`:
    ```ts
      [MonsterKind.GNOME]: {
        tags: ['maintenance', 'living', 'storage', 'corridor', 'crowd', 'swarm', 'garbage'],
        anchorTags: ['storage', 'garbage', 'corridor'],
      },
    ```
3.  **Add rumors about gnomes in `src/data/rumors.ts`:**
    Add to `LOCAL_RUMORS` or define new rumor objects.
    "В коллекторах видели мелких. Шустрые, гады."
4.  **Add `MonsterKind.GNOME` to spawn generators in `src/data/procedural_floors.ts`:**
    Add it to `maintenance` and `living` (if there is a living pool) or residential/civil/crowd, with appropriate weighting or placement alongside other pool entries. Wait, `residential` is the array used for Living.
    ```ts
    residential: [..., MonsterKind.GNOME]
    maintenance: [..., MonsterKind.GNOME]
    ```
5.  **Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.**
