# AG28 Procedural Signals / Screens Rationale

## Decision 0 - Keep Screens Non-Interactive

Problem: Screens should convey ambient intel, but the prompt forbids interaction-heavy UI and renderer-owned gameplay.

Solution: Treat signals as generation-time categories mapped to existing procedural wall texture variants and compact metadata. The player reads them as color/symbol language in the raycaster; details are supported by data tags, rumors, and debug summaries rather than DOM UI.

Rejected Alternatives: Clickable screens, HUD panels tied to screen proximity, or renderer-side state machines would violate the prompt and add UI/runtime ownership in the wrong layer.

Hardware Impact: Generation-time tagging is bounded by the existing placed screen count. Runtime animation remains bounded by `world.screenCells`.

## Decision 1 - Add Data Definitions Before Runtime Logic

Problem: Seven signal categories need consistent meaning across floors without hardcoding one-off behavior in the generator.

Solution: Add `src/data/screen_signals.ts` as plain definitions: ids, labels, texture variant, floor/room preferences, tags, and associated rumor ids. `src/gen/procedural_screens.ts` consumes these definitions during placement.

Rejected Alternatives: Encoding every category directly in `procedural_screens.ts` would make future floor/content additions harder and mix data with generation code.

Hardware Impact: Static definitions cost 0 microseconds per frame.

## Decision 2 - Texture Variant As Cell Tag

Problem: The prompt asks for cheap screen-cell tagging, but adding arrays to `World` would be a shared core/schema change.

Solution: Use the existing `Tex.SCREEN_BASE + variant * frameCount + frame` layout as the tag. `screenSignalForVariant()` recovers the category, and `summarizeProceduralScreens(world)` reads only `world.screenCells`.

Rejected Alternatives: A new `World.screenSignal` typed array would be dense and expensive for a rare feature. A `WeakMap<World, Map<cell, signal>>` would lose metadata when floors are copied during regeneration.

Hardware Impact: Summary and animation are O(screen count), with caps of 180 or lower per floor today.

## Decision 3 - Ambient Hook To Events And Rumors

Problem: Screens need useful intel without becoming a second event bus or gameplay authority.

Solution: `ScreenSignalDef` records existing `WorldEventType` ids and existing `RUMORS` ids relevant to each category. Generation uses those definitions to choose what kind of intel a wall screen implies; actual event publication remains in systems that own gameplay facts.

Rejected Alternatives: Publishing events from screen placement would make decorative walls create world facts. Scanning recent events every frame to retune screens would violate the no-global-scan rule.

Hardware Impact: Static event/rumor ids cost 0 microseconds per frame.
