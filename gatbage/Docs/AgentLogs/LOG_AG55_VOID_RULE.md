# AG55 Void Rule Log

## 2026-05-17

Prompt: `AGENT_55_VOID_PROTOCOL_LOCAL_RULE`

Implemented one Void local-rule chamber:

- Added `src/gen/void/borrowed_light_rule.ts`.
- Imported it from `src/gen/void/content_manifest.ts`.
- Added the `borrowed_light` Void protocol definition in `src/data/void_protocols.ts`.
- Added event observer support to `src/systems/events.ts`.
- Added borrowed-light accept/reject/backlash handling in `src/systems/void_protocols.ts`.
- Added rumor `void_borrowed_light_rule` in `src/data/rumors.ts`.

Gameplay:

- The Void now stamps `Касса заемного света` near the Void entry.
- The player can take the accept receipt or reject receipt from two public containers.
- Accepting grants `psi_stabilizer x1` and `ammo_energy x2`, applies local fog/door rule in the chamber, publishes started/backlash events, and causes a bounded HP/psi-madness backlash.
- Rejecting publishes a reject event and leaves the rule inert.
- The choice is marked on both containers as `accepted` or `rejected`, so restored container state will not allow replaying both branches.

Mental test:

- Accept path: taking the accept receipt fires `container_opened`, the Void observer sees `void_rule/borrowed_light/accept`, rewards the player, applies local room effects, publishes backlash, and tags both containers `accepted`.
- Reject path: taking the reject receipt fires the same observer path with `reject`, publishes a short reject event/message, and tags both containers `rejected`.
- Save/load: container tags are preserved by container save normalization; transient fog/backlash is local and recoverable, and the rule cannot be accepted again after tags are restored.
- Return portal/victory: no `FloorLevel`, plot step, Creator, portal, or victory path logic was touched.

Validation:

- Baseline `npm run build`: passed.
- `npm run typecheck`: passed after implementation.
- `npm run check`: failed in `npm run test:unit`; `.test-build/tests/content-registry.test.js` could not require `../src/gen/living/content_manifest`.
- Standalone `npm run build`: passed.
- Standalone `npm run smoke`: failed after movement because the WebGL canvas appeared blank and the inventory-panel brightness did not change.
