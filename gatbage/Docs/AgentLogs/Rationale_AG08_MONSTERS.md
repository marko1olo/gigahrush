# AG08 Monster Variants / AI Threats Rationale

## Preflight Decisions

Problem: Local registry files referenced by the external instructions are not present in this checkout.
Solution: Use the extracted AG08 prompt, README, and `desdoc.md` sections 17, 36, 69 as the available evidence base.
Rejected Alternatives: Inventing mandates or editing outside AG08 scope would create unverifiable work.
Scalability potential: Low/Middle/High/Ultra all benefit from data-only threat definitions and bounded AI branches.
Hardware Impact: Avoided any mandatory discovery/runtime work; estimated runtime gain is neutral, compile-time only.

Problem: Existing sprite indices depend on enum ordinal order and auto-counting.
Solution: Append new `MonsterKind` values only and keep `sprite_index.ts` auto-computed.
Rejected Alternatives: Manual sprite indices would be fragile under parallel agent edits.
Scalability potential: Low devices avoid extra lookup churn; Ultra can add more monsters without renderer rewiring.
Hardware Impact: O(1) index math preserved; no measurable per-frame cost.

Problem: Monster variants were requested, but integrating them into every spawn path would touch unowned generator files during parallel work.
Solution: Add a pure data registry with floor/kind lookup helpers and leave generator consumption as an explicit integration point.
Rejected Alternatives: Mutating existing spawn tables across living, maintenance, ministry, hell, and void would collide with other agents and increase merge risk.
Scalability potential: Low/Middle devices pay no per-frame tax; High/Ultra can consume more variant entries later for richer encounter tables.
Hardware Impact: 0 us/frame; one-time module initialization only.

Problem: New monsters need readable behavior without expensive simulation.
Solution: Implement six DEF modules with local procedural sprites and simple AI tags: wall bias, lamp power, document hunting, water speed, ranged clause, close reveal.
Rejected Alternatives: New physics, light simulation, or inventory economy hooks would exceed scope and frame budget.
Scalability potential: Low uses the same cheap sprites and bounded logic; Middle/High/Ultra can spawn more of them or combine with variants.
Hardware Impact: AI checks are bounded local loops or cooldown target scans; expected impact below 10 us for typical active monster counts, dominated by existing BFS.

Problem: Pechateed needed to prefer document holders without doing two entity scans or depending on AG07 future item IDs.
Solution: Use current item definitions and `ItemType.NOTE`/`ItemType.KEY` plus existing name/description document words; run one 1.5s cooldown scan that prioritizes document carriers, then close fallback targets.
Rejected Alternatives: Hardcoding future item IDs or scanning inventory every frame would break parallel data work and waste CPU.
Scalability potential: Low gets one bounded scan; Middle/High/Ultra can add more document definitions through item data without AI rewrites.
Hardware Impact: One O(entity count) scan per Pechateed per 1.5s, replacing any naive per-frame scan. Estimated savings versus per-frame scan: 100-500 us in crowded worlds.

Problem: Floor spawn integration was requested but floor generators are active shared files.
Solution: Export `NEW_MONSTER_KINDS` and `NEW_MONSTERS_BY_FLOOR` for later generator consumption.
Rejected Alternatives: Touching living/maintenance/ministry/hell/void spawn tables would collide with parallel agents and create dependency on their current edits.
Scalability potential: Low can keep pools unused; Middle/High/Ultra can expand spawn weights without changing entity or AI code.
Hardware Impact: 0 us/frame until consumed.

Problem: Paragraph needed ranged behavior without adding projectile code.
Solution: Mark it `isRanged` and let `generateSprites()` auto-assign the existing PSI bolt sprite, matching Idol/Herald/Creator behavior.
Rejected Alternatives: A custom paper projectile would require new sprite/projectile handling for no functional gain.
Scalability potential: Low keeps one projectile path; Middle/High/Ultra can vary damage/rate via data.
Hardware Impact: Same cost as existing ranged monster shot; no new per-frame system.

Problem: Debug spawn update was optional but `src/systems/debug.ts` is already modified in the shared worktree.
Solution: Skip debug changes and record the reason.
Rejected Alternatives: Editing the dirty debug list risks overwriting or interleaving another agent's changes.
Scalability potential: All tiers unaffected; spawn integration is available through exported pools.
Hardware Impact: 0 us/frame.

Problem: Polish mandate required anti-bloat review after the checklist was complete.
Solution: Re-read the AG08 registries, variant data, and AI branches; kept the Pechateed custom scan because it is simpler at runtime than two scans and documents the one exceptional target-priority rule.
Rejected Alternatives: Removing Pechateed's branch would regress document-priority behavior or reintroduce double scan logic.
Scalability potential: Low keeps a single cooldown scan; Middle/High/Ultra get deterministic document-threat behavior without new systems.
Hardware Impact: Final audit preserved 0 new global per-frame scans; build passed in 776ms.

Problem: README had stale monster counts and debug spawn wording.
Solution: Update only factual sections: 22 monster kinds, six AG08 threats/counterplay, variant registry, and debug wording that avoids claiming all monsters are spawned.
Rejected Alternatives: Rewriting broad design docs or claiming floor-generator integration that was intentionally not performed.
Scalability potential: Low/Middle/High/Ultra all get accurate integration guidance without runtime changes.
Hardware Impact: 0 us/frame.
