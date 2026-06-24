## 2025-02-18 - Testing Improvement Task for Seroburmaline
**Learning:** `tests/helpers.ts` provides excellent mock utilities such as `addTestRoom`, `makeGameState`, and `makeTestPlayer` that allow fast, localized component testing without building full game states. Test files should reside at the root `/tests` rather than `/src`.
**Action:** Use these helpers whenever implementing testing improvements to save time, avoid missing mandatory properties on GameState or Entities, and maintain consistency with other tests.
