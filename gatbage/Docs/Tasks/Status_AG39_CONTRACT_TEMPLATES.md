# AG39 Contract Expedition Templates Status

Date: 2026-05-17

## Scope

Implemented expedition-style contract templates in `src/data/contracts.ts` using the existing generic quest types:

- `FETCH`: retrieve from containers or bring repair/delivery items.
- `KILL`: hunt existing monster kinds on risky floors.
- `TALK`: escort-like message delivery to existing plot NPCs.
- `VISIT`: inspect a story floor through the existing floor visit completion hook.

Runtime support remains generic: contracts carry `target` metadata with floor, room type, zone tag and player hint; quests receive target metadata, deadline context and event payloads without one-off contract code.

## New Expedition Contracts

| Contract | Type | Floor | Debug/completion path |
| --- | --- | --- | --- |
| `exp_living_emergency_roster` | FETCH | LIVING | Debug action 12 spawns/list contracts; take `emergency_roster` from common/emergency containers and let normal FETCH completion turn it in. |
| `exp_living_quarantine_message` | TALK | LIVING | Talk to `olga`; TALK completion uses existing `targetPlotNpcId`. |
| `exp_living_shadow_stairwell` | KILL | LIVING | Kill one `SHADOW`; KILL progress uses existing `notifyKill`. |
| `exp_ministry_safe_override` | FETCH | MINISTRY | Retrieve `elevator_override_form` from office/safe-style containers. |
| `exp_ministry_paragraph_audit` | KILL | MINISTRY | Kill one `PARAGRAPH`. |
| `exp_ministry_archive_inspection` | VISIT | MINISTRY | Enter Ministry; `visitFloor` closes the VISIT quest. |
| `exp_kvartiry_ration_stamp` | FETCH | KVARTIRY | Retrieve `ration_stamp_pad` from kitchen/cashbox-style containers. |
| `exp_kvartiry_nelyud_queue` | KILL | KVARTIRY | Kill one `NELYUD`. |
| `exp_kvartiry_common_inspection` | VISIT | KVARTIRY | Enter Kvartiry; `visitFloor` closes the VISIT quest. |
| `exp_maint_pressure_repair` | FETCH | MAINTENANCE | Retrieve `manometer` from production/tool containers. |
| `exp_maint_tube_eel_clear` | KILL | MAINTENANCE | Kill one `TUBE_EEL`. |
| `exp_maint_major_packet` | TALK | MAINTENANCE | Talk to `major_grom`. |
| `exp_hell_threshold_inspect` | VISIT | HELL | Enter Hell; `visitFloor` closes the VISIT quest. |
| `exp_hell_herald_bounty` | KILL | HELL | Kill one `HERALD`. |
| `exp_hell_bottled_voice_retrieve` | FETCH | HELL | Retrieve `bottled_voice` from storage/secret-stash style content. |
| `exp_void_archive_warrant` | FETCH | VOID | Retrieve `void_archive_warrant` from Void office/archive-style content. |
| `exp_void_jean_message` | TALK | VOID | Talk to `void_warning` / Жан Пустотник. |
| `exp_void_paragraph_cleanup` | KILL | VOID | Kill two `PARAGRAPH` monsters. |

## Reward/Deadline Notes

- Scarcity-aware money rewards now evaluate against the contract target floor, not only the issuer/current floor.
- New contracts cover `drink_water`, `medicine`, `ammo` and `documents` scarcity resources.
- Deadline scaling continues through `assignProceduralQuestDeadline`; cross-floor expedition contracts pass `crossFloor`, and VISIT contracts set `visitFloor` for existing completion semantics.
- Contract-created, completed and failed events include target metadata, reward resource id, target item/monster/NPC where applicable and contract tags.

## Validation

- Baseline before edits: `npm run build` passed.
- After implementation: `npm run typecheck` passed.
- `npm run check` was attempted, but the shared `.test-build` directory was being deleted by concurrent test runs from other active processes, so the package script failed while resolving emitted test files.
- Isolated equivalent unit run using `.test-build-ag39` passed all unit suites.
- `npm run build` passed after implementation.
- `npm run smoke` failed at the WebGL pixel check after gameplay start: HUD/title painted, but the WebGL canvas sampled as blank. This appears outside the contract data path and should be handled by the active render/smoke owner before claiming a full green check.
