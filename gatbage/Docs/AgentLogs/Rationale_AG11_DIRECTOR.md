# AGENT_11_SAMOSBOR_DIRECTOR_BEATS Rationale

## Boundary

Problem: Samosbor already has variants and a separate aftermath table, so AG11 must not replace variant selection or own content modules.
Solution: Add a small director registry and runtime beside the existing flow. The director selects local beats; variant choice and existing aftermath definitions remain untouched.
Rejected: Moving aftermath or variant logic into the director would violate the prompt and increase merge risk.

## State

Problem: Shared `GameState` and save/load are high-conflict integration surfaces.
Solution: Store `samosborDirector` as a normalized optional structural property on `GameState` from the director module. Old saves omit it; runtime recreates defaults when accessed.
Rejected: Editing `src/core/types.ts` and `src/main.ts` for persisted save state was unnecessary for an MVP scheduler.

## Scheduling

Problem: The director must not become frame logic.
Solution: Samosbor calls it at phase points only: once before start effects, once per 12 seconds while active, and once after rebuild when existing pending aftermath is applied.
Rejected: Per-frame evaluation or full-world scans.

## Effects

Problem: Beats need visible consequences without becoming feature owners.
Solution: Effects reuse existing cheap systems: HUD/message lines, event publication, bounded local fog writes, small NPC/monster spawn, economy stock delta, rumor memory, door state, and one container inventory edit.
Rejected: New lore explainer, new event bus, new AI loop, or global simulation.

## Debug

Problem: The system needs proof of choice and cooldown behavior.
Solution: Debug commands print state/trace, force the next matching beat, and clear cooldowns. Trace entries record phase, reason, chosen/rejected beat, budgets, and variant.

## Integration Note

`npm run typecheck` exposed a pre-existing duplicate helper block in `src/systems/rumor.ts`. I removed the older duplicate and kept the richer event-aware implementations so AG09 rumor behavior and AG11 rumor seeding both compile.
