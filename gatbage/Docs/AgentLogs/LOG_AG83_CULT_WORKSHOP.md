# LOG AG83 Cult Workshop

## 2026-05-18

- Implemented `src/gen/maintenance/cult_held_workshop.ts`.
- Registered the workshop in `src/gen/maintenance/content_manifest.ts`.
- Added a cult-held Maintenance production POI centered on a useful door-kit machine.
- Added five approaches: repair, clear/capture, negotiate tribute, sabotage, and steal production output.
- Added production-tied rewards and economy/resource event effects instead of cash-only rewards.
- Published outcome events through `systems/events.ts` using existing event types and AG83 tags.
- Validation:
  - `npm run typecheck` unavailable: missing script.
  - `npm run check` unavailable: missing script.
  - `npx tsc --noEmit` blocked by pre-existing non-AG83 errors.
  - `npm run build` blocked by pre-existing `src/gen/procedural_floor.ts` duplicate `roomCenter`.
  - Targeted esbuild bundle for AG83 module passed.
