# Rationale_AUDIT

Problem: The user asked for a code audit and concrete development plan, while the pasted top-level protocol references local mandate files and batch XML that are absent in this checkout.
Solution: Use actual repo evidence as authority: `README.md`, `desdoc.md`, `architecture.md`, source files, status logs, and expansion docs. Record missing protocol files instead of inventing them.
Rejected Alternatives: Pretending `CURRENT_BATCH.md` or `.agents-skills/` exists; forcing a Windows/Unity workflow onto this TypeScript/Vite browser game.
Scalability potential: Low/Middle/High/Ultra guidance is kept in the audit by requiring content modules to scale through static geometry, slow ticks, caps, and visual overkill rather than raw simulation.
Hardware Impact: Documentation-only work adds 0 us/frame. The plan protects roughly 500-1500 us/frame on i3/MX350-class hardware by rejecting full-world hot scans for economy, containers, A-Life, and content.

Problem: The project is playable but has half-integrated systems and a red strict typecheck.
Solution: Make Phase 0 a compile/stabilization gate, then finish existing economy/container/production/dialogue/variant rails before adding new rails.
Rejected Alternatives: Starting new floors or a second economy/quest/dialogue stack while `npx tsc --noEmit` fails.
Scalability potential: Low devices get stable existing loops; middle/high/ultra gain more content density only after debug-visible systems are wired.
Hardware Impact: Fixing the unused parameter itself saves 0 us/frame but restores strict compile discipline. Finishing existing rails prevents duplicate systems that would otherwise add avoidable frame and maintenance cost.

Problem: Content growth can easily become unreviewable if every agent edits `main.ts`, central enums, or renderer files.
Solution: Audit mandates module-owned content, floor manifests, small registries, ids, and integrator-owned hooks only when needed.
Rejected Alternatives: Content-specific logic in `main.ts`, monolithic `content.ts`, enum bloat for pocket floors, or renderer-owned gameplay state.
Scalability potential: Low tier loads cheap static modules; high and ultra tiers can add richer procedural marks/events without changing ownership boundaries.
Hardware Impact: Expected steady-frame cost per content module remains 0 us unless it owns a bounded slow tick or interaction path.

Problem: The next project phase needs game design direction, not just engineering hygiene.
Solution: Define the player loop as shelter -> resource/info -> social/repair/fight decision -> samosbor pressure -> aftermath -> new rumor/contract/debt. Prioritize Black Market, Mushroom Shift, OBZH School, Hospital, Heatline, Archive, Metro, 404, Void in dependency order.
Rejected Alternatives: Random content dumping, pure shooter escalation, or explaining samosbor fully.
Scalability potential: Low uses text/log/HUD feedback; middle adds more variants; high/ultra buys atmosphere through denser content and procedural visuals.
Hardware Impact: Gameplay growth is mostly generation-time or slow-tick. The plan avoids fluid, steam, logistics, and full social simulation costs that could exceed 0.1 ms/frame.

Problem: The first audit identified a strict compile failure, but the local tree had already moved partway toward fixing it with an underscore parameter.
Solution: Remove the unused parameter entirely from `registerFactoryRoom` and update the call site. This is cleaner than relying on TypeScript's underscore parameter exemption.
Rejected Alternatives: Keeping `_world` as a silent unused parameter, or changing compiler settings.
Scalability potential: Low/Middle/High/Ultra all benefit from strict compile as a hard gate before content waves.
Hardware Impact: 0 us/frame runtime change. Prevents false-green quality reports and avoids future dead parameter accretion.

Problem: The context-aware dialogue system existed, but the actual NPC menu call passed only the NPC.
Solution: Pass `{ world, state, player, time: state.time }` into `generateTalkText` from the NPC talk path, using the already optional API.
Rejected Alternatives: Rewriting dialogue, storing more state on NPC entities, or making context mandatory for all callers.
Scalability potential: Low gets better local lines at interaction time; middle/high/ultra can add richer context and rumor effects without new frame-loop work.
Hardware Impact: Interaction-time only. Estimated 20-100 us per talk, 0 us/frame steady.

Problem: The second audit needed to distinguish now-fixed P0 issues from remaining P1 gameplay gaps.
Solution: Update `audit.md` top verdict and append a second audit section with current compile/build pass, closed P0s, and remaining player-facing work.
Rejected Alternatives: Leaving stale "strict gate red" text as the first visible truth after the fix.
Scalability potential: Future agents start from current facts and do not waste cycles re-fixing closed issues.
Hardware Impact: Documentation-only, 0 us/frame.

Problem: `src/data/monster_variants.ts` contained meaningful content definitions that no runtime spawn path consumed.
Solution: Add a spawn-time `applyMonsterVariant` helper, cache small multipliers on `Entity`, prefix display names, and call it from samosbor/debug spawn paths. Damage multiplier is read inside existing attack calculations.
Rejected Alternatives: Per-variant AI branches, per-frame variant lookup, or leaving variants as dead data for later.
Scalability potential: Low gets cheap variant diversity; middle/high/ultra can add more definitions and visual/readout polish without hot-loop scans.
Hardware Impact: Variant selection happens at spawn/debug time only. Steady-frame cost is 0 us except one cached damage multiplier multiply during monster attacks.

Problem: Containers existed as world data and debug commands, but a player could not normally inspect/store/loot them.
Solution: Add `showContainerMenu` state, an interaction-time container finder, a two-grid container UI, and save/load for current-floor containers. Reuse `takeFromContainer`/`putIntoContainer` so theft events and inventory stack behavior stay in one system.
Rejected Alternatives: Making containers full entities, adding physics props, or creating a second inventory-transfer implementation in the renderer.
Scalability potential: Low uses interaction-time lookups and static UI; middle/high/ultra can spend budget later on visible props, sounds, and richer owner reactions without changing the data contract.
Hardware Impact: 0 us/frame when menu is closed. Open-menu work is bounded to two 5x5 grids. Interaction lookup is a small local container map query plus existing nearby fallback, estimated under 50 us per key press on i3/MX350-class hardware.

Problem: Contracts were valid quest wrappers but still required debug commands to enter normal play.
Solution: Add a `Контракт` action to the NPC menu that calls existing `spawnContract` and opens the quest page on success.
Rejected Alternatives: New contract board generation, a separate contract UI, or a second contract data model before a concrete location is designed.
Scalability potential: Low gets functional contract access now; middle/high/ultra can replace the generic NPC entry with boards, brokers, terminals, and faction desks.
Hardware Impact: Interaction-time only. Estimated under 20 us per contract request plus normal quest array checks.

Problem: Economy scarcity affected debug price output but not player trade.
Solution: Use `getAdjustedItemPrice` in NPC buy/sell logic and trade UI display.
Rejected Alternatives: Duplicating price math in `npc_ui.ts`, adding a market simulation tick, or changing item base values.
Scalability potential: Low uses cheap resource multipliers; middle/high/ultra can add visible shortages, rumors, and production-driven contracts over the same price API.
Hardware Impact: Trade-menu only. 0 us/frame outside UI; selected-item price lookup is bounded resource math.

Problem: Exposing containers without persistence would create save/load loot reset.
Solution: Save `world.containers` in `localStorage` and rebuild `containerMap` on load; old saves still call `ensureRoomContainers`.
Rejected Alternatives: Leaving containers transient, serializing the whole world, or adding a new save schema migrator for one plain data array.
Scalability potential: Current-floor persistence is enough for the existing single-floor save model. Future multi-floor persistence needs a floor-keyed container store.
Hardware Impact: 0 us/frame. Save/load payload grows by current-floor containers only; build output increased to 733.88 kB single-file HTML.

Problem: UI/game-loop changes can compile but still produce blank canvas or startup exceptions.
Solution: Run the existing unit test suite and `smoke-playability` after build.
Rejected Alternatives: Treating `vite build` as enough for browser runtime changes.
Scalability potential: Smoke coverage remains cheap and catches startup/render regressions before content agents stack more systems.
Hardware Impact: Test-only cost. Runtime cost remains as recorded above.

Problem: A separate `Контракт` menu action duplicated the existing quest path and confused player-facing mental model.
Solution: Remove the NPC contract action and treat `ContractDef` rows as contextual system assignment templates inside the normal `Задание` flow. Keep `contractId` as metadata only for debug, future markets, and rewards.
Rejected Alternatives: Building a second contract board UI now, keeping two player-facing task verbs, or deleting the contract data and losing useful short assignments.
Scalability potential: Low gets one clean quest interface; middle/high/ultra can later surface brokers/boards as themed NPCs or rooms without adding a second journal.
Hardware Impact: 0 us/frame. Context scoring runs only when a player asks an NPC for a task.

Problem: A flat 10% quest-giver rate made the working game feel sparse and ignored who the NPC was or where they stood.
Solution: Raise quest-giver probability to a contextual 20-55% and generate tasks from profession, faction, room type, samosbor danger, zone state, and nearby monsters.
Rejected Alternatives: Making every NPC a quest giver, adding per-frame need scanning, or inventing a new assignment manager.
Scalability potential: Low keeps cheap interaction-time generation; middle/high/ultra can add more templates and room/faction hooks in data.
Hardware Impact: Reassign is generation/samosbor-time only. Offer scoring scans nearby monsters and NPC candidates on interaction, estimated under 200 us per NPC request on i3/MX350-class hardware, 0 us/frame steady.

Problem: After the contextual quest pass, strict TypeScript surfaced adjacent incomplete samosbor/floor-instance work: dead aftermath imports/vars, missing helper functions, and unregistered elevator event types.
Solution: Remove only dead imports/vars, add a lightweight `applyPendingSamosborAftermath`/`findPlayer` implementation, and add `elevator_anomaly`/`elevator_loop_exit` to `WorldEventType`.
Rejected Alternatives: Reverting neighboring systems, casting event payloads through `unknown`, or weakening TypeScript settings.
Scalability potential: Aftermath remains a cheap event/message hook that future content can expand without per-frame simulation.
Hardware Impact: 0 us/frame steady. Aftermath application runs once after rebuild and publishes one bounded event.

Problem: The user correctly flagged that "contracts" and "quests" were two words for the same player action, and the code still exposed a stale `offerNpcContract` API plus player-facing contract wording.
Solution: Delete the NPC contract API, keep the data as legacy system-assignment templates selected by `offerQuest`, and change UI/log/rumor/task copy to "задание" or "системное задание". Add unit coverage for the normal NPC assignment path producing a quest with `contractId` metadata.
Rejected Alternatives: Keeping a dead API for future boards, building a separate contract board now, or deleting the template data and losing usable short assignments.
Scalability potential: Low devices keep one cheap interaction-time quest path; middle/high/ultra can later add brokers, terminals, or boards as themed quest givers without a second journal.
Hardware Impact: 0 us/frame. Removed one unused interaction path and avoided duplicate task UI/state.

Problem: A hard active quest cap is a UI/system shortcut, not game design pressure; the user wanted unlimited active tasks but time pressure on procedural work.
Solution: Remove global active caps and add deadline fields only to procedural/system assignments. Hand-authored plot and side quests are detected by `plotStepIndex`/`sideQuestId` and never expire. Expiry marks the quest failed, clears the giver's active id, and publishes `quest_failed` or compatibility `contract_failed`.
Rejected Alternatives: Keeping an invisible cap, adding short universal timers to story quests, or ticking a second quest scheduler.
Scalability potential: Low devices pay only the existing 30-tick quest scan; middle/high/ultra can add richer deadline UI, brokers, and failure consequences over the same fields.
Hardware Impact: 0 us/frame beyond the existing quest completion scan. Deadline math is O(active quests) every 30 frames and uses primitive numbers only.
