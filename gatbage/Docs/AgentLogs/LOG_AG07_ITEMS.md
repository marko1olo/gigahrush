# AG07 Items / Weapons / PSI / Documents Log

## 2026-05-17 AG07 Data Expansion

What was wrong:
The item catalogue was too narrow for the documented economy/document/weapon/PSI direction. Existing debug spawn-all could expose data, but the data surface lacked ordinary economic objects, document props, components, practical new weapons, and enough short note text.

What was done:
Added 95 total item ids now present in `ITEMS` count scan result: catalogue total is 156 item ids. Added 20 usable food/drink/medicine entries with synchronous existing effects, 13 physical weapons with matching `PHYS_WEAPON_STATS`, 3 ammo ids, 6 PSI weapon ids with matching `PSI_WEAPON_STATS`, 50+ economy/document/tool/component/lore ids, and 80 new short `NOTES` strings for 95 total notes.

Cinematic Cheats used:
No new simulation. Documents, detectors, artifacts, pressure tools, and strange materials are data/lore/economy objects instead of new per-frame mechanics. PSI additions reuse existing projectile or supported instant hooks. Harpoon and new firearms reuse existing projectile sprites.

Exact Microseconds saved:
Renderer changes avoided: estimated 30-80 us/frame saved versus adding new projectile sprite/render branches.
No new item systems: estimated 10-40 us/frame saved versus status/crafting/document ticking.
No new PSI instant hooks: estimated 5-20 us/frame saved versus extra global effect scans.
Debug coverage reused through `Object.keys(ITEMS)`: estimated 0 maintenance us/frame and no runtime cost outside debug.

Verification:
Baseline `npm run build` passed in 612 ms.
Loop 1 build passed in 691 ms.
Loop 2 build passed in 691 ms.
Loop 3 build passed in 698 ms.
POLISH_MANDATE build passed in 674 ms.
Audit: duplicate item ids = none; weapon items missing stats = none; new weapon ids missing stats = none.

Integrator notes:
AG07 did not edit renderer, `sprite_index.ts`, `main.ts`, `debug.ts`, or add `ItemType`. Debug command 4 spawns all catalogue items, so AG07 items are exposed without shared debug edits. Debug command 1 remains a curated baseline weapon drop, documented as baseline rather than complete.

## 2026-05-17 AG07 Round 2 Reachability Pass

What was wrong:
The first expansion had enough catalogue breadth, but several practical document/tool categories were only loose room loot. Containers and economy resources did not yet make the expanded paperwork, detectors, relay/valve parts, and control forms visible enough for stealing, shortage pricing, or repeated discovery.

What was done:
Added 12 item ids, all `ItemType.MISC`: `samosbor_tally`, `sealed_complaint`, `elevator_override_form`, `pressure_logbook`, `ration_stamp_pad`, `container_key_label`, `valve_tag`, `relay_diagram`, `seal_wax`, `emergency_roster`, `filter_receipt`, `inspection_mirror`. Added 14 short `NOTES` strings. No weapons or PSI were added. Updated `RESOURCES` and `CONTAINER_DEFS` so the new ids, plus weakly hooked first-pass document/tool ids, participate in pricing and container loot.

Cinematic Cheats used:
Documents and control parts are still data/economy/container objects. There is no new document system, lockpicking branch, or per-frame detector scan. Tool-like items are useful as loot/economy signals without claiming unsupported active behavior.

Verification:
Baseline `npm run build` passed in 751 ms before edits.
Data-count check after shared-worktree updates: 187 item ids, 137 notes, 16 PSI stats, no duplicate item ids, no missing resource refs, no missing container refs. AG07 Round 2 itself added 12 item ids and 14 note strings; the higher current totals include other unowned rows already present in the shared worktree.
Post-AG07 data `npm run build` passed in 800 ms before later shared `samosbor.ts` edits landed.
Latest `npm run build` is blocked by out-of-scope `src/systems/samosbor.ts` duplicate declarations: `findPlayer`, `applyPendingSamosborAftermath`, `findWalkableNear`.
`npm run typecheck` is blocked by out-of-scope `src/systems/samosbor.ts` errors; the initial run reported unused aftermath variables plus missing `findPlayer` and `applyPendingSamosborAftermath`.

Integrator notes:
Round 2 stayed inside AG07 write scope. It did not edit renderer, `main.ts`, `systems/samosbor.ts`, contracts, weapon stats, PSI stats, sprites, or item types.
