# AUDIT Log

## 2026-05-17 Code/Architecture/Game Design Audit

What was wrong: The project is playable and content-ready, but strict typecheck is currently red, AG10 economy/production/containers is unfinished, AG09 dialogue context is not fully fed from `main.ts`, monster variants are data-only, and some documentation/status files are stale or incomplete.

What was done: Wrote `audit.md` at repo root with evidence-based findings, P0/P1 blockers, the 100% development plan, phase order, immediate work packages, content module DOD, game design direction, and scalability rules. Created AUDIT status and rationale files.

Cinematic Cheats used: The plan explicitly chooses static rooms, slow production ticks, abstract resources, event/log consequences, fog tint, HUD feedback, and room-state fakes over fluid, steam, market logistics, or full social simulation.

Exact Microseconds saved: Audit-only runtime cost is 0 us/frame. Following the plan avoids estimated 500-1500 us/frame from naive economy/container full scans, 1000+ us/frame from excessive content polling, and unbounded GC pressure from duplicate systems. Strict content modules target 0 us/frame steady cost unless they own a capped slow tick or interaction-time check.

Verification: `npx tsc --noEmit` was run and failed with `src/systems/production.ts(48,48): error TS6133: 'world' is declared but its value is never read.` `npm run build` was not run to avoid rewriting already-dirty `dist/index.html`; the strict typecheck failure is the current P0 gate.

## 2026-05-17 Must-Fix Pass And Second Audit

What was wrong: The first audit's P0 compile blocker had to be closed before more content work. NPC dialogue also had a real P1 underfeed: context builders existed but the menu call passed only the NPC. The audit document itself became stale once the compile gate was fixed.

What was done: Removed the dead `_world` parameter from `src/systems/production.ts`; updated the factory registration call. Updated `src/main.ts` so NPC talk passes `world`, `state`, `player`, and `time` into `generateTalkText`. Updated `audit.md` with current green gates, closed P0 status, and a second audit section.

Cinematic Cheats used: No new simulation. The fix preserves slow-tick production and interaction-time dialogue context only.

Exact Microseconds saved: Runtime frame savings are 0 us/frame because this is strictness/context wiring, not hot-loop optimization. It prevents future dead-code drift and unlocks context dialogue at approximately 20-100 us per NPC talk interaction, still 0 us/frame steady.

Additional must-fix: Monster variants were still dead data after the first follow-up. Added spawn-time variant application for samosbor/debug monsters, variant-prefixed display names, and cached HP/speed/damage modifiers.

Verification: `npx tsc --noEmit` PASS. `npm run build` PASS, 169 modules, `dist/index.html` 720.70 kB, gzip 222.55 kB, built in 762 ms.

## 2026-05-17 Player-Facing AG10 Pass

What was wrong: Economy, containers, and contracts had real data/system support but too much access still depended on debug commands. Trade displayed and charged base item values instead of scarcity prices. Container state was not saved, so exposing player looting without persistence would reset loot on load.

What was done: Added normal `E` container interaction, `GameState` container menu fields, two-grid container UI, HUD prompt support, item transfer through existing container helpers, locked-container block, and current-floor container save/load. Added `Контракт` to the NPC menu via existing `spawnContract`. Wired NPC trade buy/sell logic and selected-item UI to `getAdjustedItemPrice`. Updated `README.md` and `audit.md` to reflect shipped behavior and remaining P1s.

Cinematic Cheats used: Containers stay lightweight world data, not physics entities. Contracts reuse normal quests instead of a new screen. Economy remains abstract resource scarcity, not a simulated market.

Exact Microseconds saved: 0 us/frame when menus are closed. Container lookup is interaction-time only, estimated under 50 us per key press. Trade scarcity lookup is selected-item/menu-time only. Avoided a full entity/physics container path that would add unnecessary per-frame traversal and rendering cost.

Verification: `npx tsc --noEmit` PASS. `npm run build` PASS, 171 modules, `dist/index.html` 733.88 kB, gzip 226.98 kB, built in 707 ms. `npm run test:unit` PASS, 15 tests. `npm run smoke` PASS, `hudLit=36864`, `webglLit=1024`.

## 2026-05-17 Contextual Quest Pass

What was wrong: The separate NPC `Контракт` action duplicated `Задание` and made the task model noisy. Quest availability was still a flat 10% gate, so many NPCs felt inert and assignments ignored room/faction/profession context.

What was done: Removed `Контракт` from the NPC menu. Raised quest-giver probability to a contextual 20-55%. `offerQuest` now uses profession, faction, room type, zone/samosbor danger, and nearby monsters. Former contract definitions now enter through the ordinary `Задание` flow as system assignment templates; `contractId` remains metadata only. README, audit, status, and rationale were updated.

Cinematic Cheats used: No new task simulation. Assignment context is computed only when the player asks an NPC for work; danger is approximated from zone flags and nearest monster, not from a live job economy.

Exact Microseconds saved: 0 us/frame steady. Avoided a second player-facing contract UI/journal. Context scoring is interaction-time only, estimated under 200 us per NPC request on low-end hardware.

Additional compile stabilization: strict TypeScript exposed adjacent incomplete samosbor/floor-instance work. Removed dead samosbor imports/vars, added a lightweight pending-aftershock event helper, and registered elevator anomaly event types in `WorldEventType`.

Verification: `npx tsc --noEmit` PASS. `npm run build` PASS, 179 modules, `dist/index.html` 817.63 kB, gzip 250.99 kB, built in 821 ms. `npm run test:unit` PASS, 15 tests. `npm run smoke` PASS, `hudLit=36864`, `webglLit=1024`.

## 2026-05-17 Contract Vocabulary Cleanup

What was wrong: The separate `Контракт` UI was gone, but code and player-facing copy still carried an old NPC contract API and contract wording. That preserved the same conceptual split the user rejected.

What was done: Deleted `offerNpcContract` and its NPC scoring path. Kept former contract rows as system-assignment templates selected by ordinary `offerQuest`. Changed Black Market 88 descriptions, contextual lines, rumors, and world log output to "задание" / "системное задание". Updated README and added unit coverage for an NPC issuing a former contract template through the normal `Задание` route.

Cinematic Cheats used: No new simulation. The system remains one interaction-time quest selector with metadata for rewards/debug.

Exact Microseconds saved: 0 us/frame steady. Removed a duplicate interaction route and avoided a second task UI/journal.

Verification: `npx tsc --noEmit` PASS. `npm run build` PASS, 202 modules, `dist/index.html` 1,008.73 kB, gzip 305.54 kB, built in 1.35 s. `npm run test:unit` PASS, 26 tests. `npm run smoke` PASS, `hudLit=36864`, `webglLit=1024`.

## 2026-05-17 Procedural Quest Deadline Cleanup

What was wrong: A global active quest cap blocked content accumulation and did not create diegetic pressure. `main.ts` also still had a fallback path that spawned system assignments outside the normal `Задание` flow.

What was done: Removed global active quest caps from `offerQuest` and `spawnContract`. Removed the `main.ts` fallback contract spawn. Added procedural quest deadline fields and expiry failure. Plot-chain and hand-authored side quests do not expire. Quest UI/NPC quest tab show remaining time. Added unit coverage for no global cap, timed procedural assignment creation, and deadline failure.

Cinematic Cheats used: Deadline pressure is plain clock metadata, not a per-NPC job economy or scheduler.

Exact Microseconds saved: 0 us/frame steady beyond the existing quest scan. Removed duplicate contract fallback logic. Deadline checks are O(active quests) every 30 frames.

Verification: `npx tsc --noEmit` PASS. `npm run build` PASS, 204 modules, `dist/index.html` 1,016.72 kB, gzip 307.89 kB, built in 1.09 s. `npm run test:unit` PASS, 30 tests. `npm run smoke` PASS, `hudLit=36864`, `webglLit=1024`.
