# LOG_AG40_CONTAINER_WITNESS

## 2026-05-17

Implemented AG40 container witness/audit pass.

- Added event-driven, bounded nearby NPC witness detection to container theft.
- Theft events now include witness, owner, faction, audit, and relation-penalty context.
- Witnesses learn the theft rumor through the existing rumor path and receive theft-specific memory pressure.
- Owner/faction theft marks the container for audit once through the container state, without a global scan.
- Added a narrow faction relation penalty helper for witnessed or audited theft.
- Container UI now shows pre-theft risk text and post-theft/audit state.
- Added a unit test covering witnessed theft event context, audit marking, NPC memory, and faction pressure.

Validation:

- Baseline `npm run typecheck`: passed before AG40 edits.
- `npm run typecheck`: passed after edits.
- `npm run test:unit`: passed.
- `npm run build`: passed during `npm run check`.
- `npm run smoke`: failed with blank WebGL canvas samples and unchanged inventory HUD brightness. This failure appears outside AG40 container logic and remains the blocker for full `npm run check`.
