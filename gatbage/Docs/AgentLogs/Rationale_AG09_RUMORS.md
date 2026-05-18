# AG09 Rumors / Memory / A-Life Rationale

## Decision 0 - Preflight Scope

Problem: AG09 must add memory, rumors, and contextual dialogue while AG01/other agents have already changed shared systems.

Solution: Treat `src/systems/events.ts` as optional existing infrastructure, keep AG09 state in module-level bounded maps keyed by NPC id, and avoid `GameState` edits. Dialogue will accept optional context instead of requiring every caller to pass state immediately.

Rejected Alternatives: Storing NPC memory on `Entity` or `GameState` would expand shared save contracts and increase merge risk. Direct dependency on AG01 event publication would fail if the event layer changes during parallel work.

Scalability potential: Low uses interaction-time/context-cooldown text only; Middle enables broader rumor pools; High can read recent world events; Ultra can layer event-derived rumor instances later without changing talk API.

Hardware Impact: Low-end i3/MX350 estimate is near-zero per frame for talk generation, with FSM hook gated to several in-game minutes per NPC. Expected cost remains below 100 microseconds on sampled update ticks and zero on most frames.

## Decision 1 - Static Rumor Catalog

Problem: Requirement demands at least 60 rumors, but runtime text generation cannot become a giant generated dump in hot paths.

Solution: Store 70 compact `RumorDef` records in `src/data/rumors.ts`, grouped by topic and floor. Selection uses topic weighting and bounded NPC memory, not a global omniscient feed.

Rejected Alternatives: Procedural paragraph generation would increase string churn and produce weak lines. Event-only rumors would block AG09 on AG01 integration details.

Scalability potential: Low uses static hints; Middle gates by floor/zone; High can seed from world events through `observeRumorEvent`; Ultra can add event-derived instances while keeping static rumors as fallback.

Hardware Impact: Static catalog costs 0 microseconds per frame. Talk-time scan over 70 entries is estimated 20-70 microseconds on i3/MX350 and is only performed on interaction.

## Decision 2 - Memory Outside Save State

Problem: NPCs need trust, fear, cooldowns, and known rumors without modifying `GameState` or save migration.

Solution: Use a module-level bounded `Map<number, NpcMemory>` capped at 1536 entries and 12 rumors per NPC. Decay and trim happen on interaction or staggered low-frequency FSM hook.

Rejected Alternatives: Adding memory fields to `Entity` or `GameState` would touch shared schemas and saves during parallel development. Unbounded maps would leak over long sessions.

Scalability potential: Low keeps transient memory; Middle can serialize later through a single adapter; High can add zone opinions; Ultra can attach black-box telemetry without changing dialogue callers.

Hardware Impact: Typical touched-NPC memory access is 1-8 microseconds on low-end silicon. Pruning scans only after cap overflow; expected during normal 1024 NPC runtime is negligible.

## Decision 3 - Dialogue Wiring Without Main Scope

Problem: Existing interaction calls `generateTalkText(npc)` from `main.ts`, but `main.ts` is outside AG09 write scope.

Solution: Keep `generateTalkText(npc)` backward-compatible and add optional `ContextBuildOptions` for future richer callers. Current fallback still uses NPC needs, HP, faction, occupation, trust, fear, and rumors.

Rejected Alternatives: Editing `main.ts` would improve room/zone/player distance in live talk but violates the declared AG09 write scope. Making context mandatory would break existing callers.

Scalability potential: Low uses NPC-local context; Middle passes world/state/player from allowed integration work; High adds recent event context; Ultra uses event-derived rumor instances and deeper social memory.

Hardware Impact: Current talk path adds estimated 20-100 microseconds per interaction, 0 per frame. On high-end machines this can buy more varied contextual prose later.

## Decision 4 - Bark Context Through Existing Function

Problem: Combat bark call sites are in modules outside AG09 write scope, but task requires combat/bark additions.

Solution: Add context selection inside `bark()` itself, keyed by existing pool identity and NPC state. This updates combat/flee/wounded output without changing combat code.

Rejected Alternatives: Editing combat call sites would exceed scope. Adding new per-frame scans would waste frame time for rare lines.

Scalability potential: Low uses small bark overrides; Middle adds more faction pools; High varies by room/zone once context is passed; Ultra can route black-box combat state into bark families.

Hardware Impact: One branch set per bark attempt, estimated 1-4 microseconds on i3/MX350. No added per-frame cost when barks are not attempted.

## Decision 5 - Polish Fix: Rumor Tick

Problem: The first FSM hook pass updated fear/trust decay but did not actually seed rumor knowledge from low-frequency context.

Solution: Add `tickNpcRumorLowFrequency()` in `src/systems/rumor.ts`, staggered every 7 in-game minutes per NPC. It remembers compact static rumors for active samosbor, wounds, hunger, or thirst.

Rejected Alternatives: Scanning world events per NPC every frame would violate the frame-time mandate. Importing AG01 `publishEvent` would couple AG09 to mutable parallel work.

Scalability potential: Low uses three static context seeds; Middle can add room/zone seeds; High can feed event-like facts through `observeRumorEvent`; Ultra can blend event instances and social graph spread.

Hardware Impact: One modulo gate and a few field checks inside existing NPC FSM. Estimated 1-5 microseconds on low-end i3/MX350 only on eligible staggered ticks, with 0 added global scan cost.
