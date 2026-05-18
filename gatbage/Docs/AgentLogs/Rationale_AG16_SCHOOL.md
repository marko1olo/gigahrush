# AG16 School Rationale

Date: 2026-05-17

## Preflight Notes

- The AG16 prompt asks for an OBZh school evacuation content slice, not a new tutorial overlay.
- `Docs/Expansions/06_obzh_school/expansion.md` proposes broader evacuation systems, but the AG16 prompt forbids group AI and asks for a compact playable decision loop. The implementation should stay in one LIVING POI module and reuse existing quests, items, fog, doors, and event logs.
- Baseline `npm run build` passed before edits.

## Current Integration Read

- LIVING additive content registers through `src/gen/living/content_manifest.ts` side-effect imports and `registerZoneContent()`.
- Hand-authored side quests register through `registerSideQuest()` in `src/data/plot.ts`.
- Existing side quest runtime already publishes quest created/completed events.
- The current quest materializer supports side FETCH/KILL; side TALK/VISIT definitions exist in content but need a generic runtime path to become playable.

## Design Direction

- Create `src/gen/living/obzh_school.ts` with classroom, shelter, NPCs, props, drops, and side quest registration.
- Use a broken school entrance where a `door_kit` can be installed with existing tool mechanics. During samosbor, a repaired door blocks fog; if left open, the school room is exposed. This gives a real decision without new group simulation.
- Keep rewards as existing items (`door_kit`, `flashlight`, food/water/medicine), not a new stat or perk system.

## Implementation Notes

- The school is a fixed zone-content module in LIVING zone 42. It stamps a protected ОБЖ classroom and a protected спортзал-убежище separated by an existing hermetic door.
- The classroom has a deliberately unprotected one-cell broken entrance in a valid wall-door-wall shape. The final quest gives a `door_kit`; using the existing tool action on that gap creates a normal door that blocks fog spread.
- The content does not add group AI, tutorial overlays, new stats, new items, or renderer changes.
- Side VISIT support now accepts `targetRoomName`, so content modules can point a visit quest at their own named room instead of the nearest generic `RoomType`.
- Existing quest-created and quest-completed events publish the school quest facts into the world event log.

## Validation Notes

- Production build passes after AG16.
- Typecheck/check/unit/smoke are blocked by unrelated pre-existing integration errors, mostly in void, rumor, main, containers, and one unit-test strictness issue.
