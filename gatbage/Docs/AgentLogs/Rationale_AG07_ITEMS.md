# AG07 Items Rationale

## Preflight Decisions

Problem: Agent scope must be isolated while AG08-AG10 may run in parallel.
Solution: Restrict edits to AG07 owned data files and README facts; do not touch `main.ts`, renderer, or sprite index unless a hard blocker appears.
Rejected Alternatives: Editing projectile rendering or action code would create cross-agent risk and violates AG07 scope.
Scalability potential: Data-only additions cost no runtime loop work; low, middle, high, and ultra devices pay only existing lookup/spawn costs.
Hardware Impact: Estimated 0 us per frame during normal play except existing item/weapon lookup paths; cheap i3/MX350 impact is negligible.

Problem: Mandate registry lookup required but `.agents-skills` is absent in this checkout.
Solution: Apply the AG07 XML selected mandates as the authoritative local mandate subset: item role required, existing projectile sprites only, readable data expansion, no dependencies.
Rejected Alternatives: Inventing mandate names from unavailable files would be unverifiable.
Scalability potential: Keeps implementation data-driven and low-risk across device tiers.
Hardware Impact: No runtime impact.

Problem: New PSI instant effects may not be supported by existing code.
Solution: Use projectile PSI definitions where possible, and only use instant `psiEffect` ids if already supported by the existing system.
Rejected Alternatives: Claiming unsupported instant spells work would be fake reporting.
Scalability potential: Projectile spells reuse existing deterministic entity update path on all tiers.
Hardware Impact: Per-cast projectile cost only; no new per-frame global system.

## Loop 1 Decisions

Problem: The item expansion needed volume without adding runtime systems.
Solution: Added data-only ordinary, economic, document, lore, tool, ammo, and component ids under existing `ItemType`s with explicit value and spawn role.
Rejected Alternatives: Adding crafting/document enums now would break AG07 scope and force other systems to depend on unfinished contracts.
Scalability potential: Low tier sees only normal item drops; middle tier gets denser economy; high and ultra can use the larger catalogue for richer generated loot without new per-frame work.
Hardware Impact: Estimated 0 us per frame; spawn-time object table lookup only. i3/MX350 cost is below measurable gameplay frame budget.

Problem: New weapons had to be functional without renderer or input edits.
Solution: Melee weapons use existing durability/range/cooldown path; ranged weapons use existing projectile sprites and ammo consumption.
Rejected Alternatives: Adding bespoke harpoon or chair visuals would touch forbidden renderer scope.
Scalability potential: Low tier uses same projectile path; high/ultra can spawn more varied loot and NPC arms later.
Hardware Impact: Same per-shot projectile cost as existing bullet/pellet/nail weapons; no continuous simulation.

## Loop 2 Decisions

Problem: `NOTES` needed a large expansion without breaking UI readability.
Solution: Added 80 short single-line notes tied to AG07 item, weapon, PSI, and document concepts.
Rejected Alternatives: Long document-style entries belong in a future document reader, not the existing note popup.
Scalability potential: Low tier receives cheap text variety; middle/high/ultra can surface more lore without any new render path.
Hardware Impact: 0 us per frame; array size increase only affects note selection/storage.

Problem: Balance had to respect cheap survival items and rare high-power tools while preserving existing mechanics.
Solution: Kept AG07 food/drink at 2-15, medicine at 20-150, physical weapons below 700, PSI as expensive rare weapons, and legendary lore artifacts at `spawnW:0`.
Rejected Alternatives: Putting high-end weapons in kitchens or making all PSI common would flatten progression.
Scalability potential: Low tier gets predictable basic loot; middle tier gets economic/document variety; high and ultra can later spend saved cycles on richer placement rules.
Hardware Impact: No frame-time cost; spawn-time table scan remains existing behavior.

## Loop 3 Decisions

Problem: Debug exposure needed confirmation without touching shared debug code.
Solution: Verified existing debug command 4 iterates `Object.keys(ITEMS)` and uses `getStack(def)`, so every AG07 item is spawnable.
Rejected Alternatives: Editing the hardcoded weapons debug command would exceed the requirement and risk merge conflicts.
Scalability potential: Debug coverage remains generic as the catalogue grows.
Hardware Impact: No runtime impact outside explicit debug command use.

Problem: README needed current facts without becoming a generated item dump.
Solution: Updated category counts and capability summaries only.
Rejected Alternatives: Listing all 90+ AG07 ids in README would damage maintainability.
Scalability potential: Low/middle/high/ultra content tiers can rely on data files for exact ids and README for system-level orientation.
Hardware Impact: Documentation only; 0 us.

## Loop 4 Polish Decisions

Problem: POLISH_MANDATE required duplicate-concept removal and weapon/stat parity.
Solution: Kept related item blocks grouped by function, ran duplicate-id audit, and verified every weapon item has matching physical or PSI stats.
Rejected Alternatives: Alphabetical sorting across all `ITEMS` would reduce local readability by separating ammo, weapons, and supporting documents from their functional blocks.
Scalability potential: Low tier keeps simple table lookup; middle/high/ultra tiers inherit a clean catalogue for future procedural placement.
Hardware Impact: No runtime change; final audit reports 46 weapon items, 0 missing stats, 0 duplicate item ids.

## Loop 5 Final Audit

Problem: Multiple agents modified the worktree, so final reporting must distinguish AG07-owned edits from ambient dirty files.
Solution: Final status and log list only AG07 scope files and generated build result; unrelated dirty files are not reverted.
Rejected Alternatives: Cleaning the worktree would risk deleting other agents' work.
Scalability potential: Integrator can merge AG07 data without hidden cross-domain edits.
Hardware Impact: No runtime impact.
