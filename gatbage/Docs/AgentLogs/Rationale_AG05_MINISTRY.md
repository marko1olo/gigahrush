# Rationale_AG05_MINISTRY

## Preflight Decisions

Problem: The prompt requires registry mandates, but `.agents-skills/` and `Docs/Actual Domains of Project.txt` are absent in this checkout.  
Solution: Use the selected mandates embedded in the extracted agent prompt and verify against existing `README.md`, `desdoc.md`, and Ministry source files.  
Rejected Alternatives: Inventing missing registry rules or editing outside the prompt write scope.  
Scalability potential: Low, Middle, High, Ultra all benefit from static content modules because generation cost is paid at floor creation, not per frame.  
Hardware Impact: No frame cost; expected low-end i3/MX350 gain is avoidance of runtime systems and new render assets.

Problem: Administrative content needs playable spaces without new engine surfaces.  
Solution: Use stamped protected rooms, existing features, existing items, existing factions/occupations, and side quests via `registerSideQuest`.  
Rejected Alternatives: Adding new enums, global quest engine changes, or `Tex` variants. Those are outside scope and create integration risk with 20+ parallel agents.  
Scalability potential: Low uses simple props and NPCs; Middle/High/Ultra inherit existing lighting, portraits, and AI density without bespoke cost.  
Hardware Impact: Generation-only work; no recurring frame-time tax above current Ministry NPC/AI systems.

## Implementation Decisions

Problem: Administrative rooms need stable placement without overwriting lifts or other agents' floor work.  
Solution: Added `src/gen/ministry/admin_common.ts` using existing `findClearArea`, `stampRoom`, `protectRoom`, and `connectProtectedRoom`; generators skip if no clear wall area is found.  
Rejected Alternatives: Blind fallback coordinates or editing shared placement utilities. Standard raw carving can overwrite lifts and create unowned coupling.  
Scalability potential: Low uses static furniture; Middle adds normal NPC density; High and Ultra get existing lighting, portraits, and AI without new loops.  
Hardware Impact: Placement is generation-only; low-end i3/MX350 saves recurring path/physics cost, expected frame impact 0 us.

Problem: Permit flow requested TALK steps, but `src/systems/quests.ts` only generates side quests for FETCH/KILL and global quest engine edits are forbidden.  
Solution: Registered two TALK route steps in side quest data for permit semantics, and provided six playable FETCH/KILL side quests through the currently supported side-quest paths.  
Rejected Alternatives: Editing the global quest engine or `PLOT_CHAIN`, both outside scope and unsafe with parallel agents.  
Scalability potential: Low/Middle devices keep simple item/kill checks; High/Ultra can later activate TALK side quest support centrally without changing this content pack.  
Hardware Impact: Static data only; 0 us per frame beyond existing quest list scan.

Problem: The stamp room needed to feel guarded without new factions or AI.  
Solution: Spawned a named liquidator guard with existing `Occupation.HUNTER`, `Faction.LIQUIDATOR`, `makarov`, and `ammo_9mm`.  
Rejected Alternatives: New ADMIN faction, new guard AI, or new weapon. Those add integration risk and no content payoff.  
Scalability potential: Low keeps a single guard; Middle/High/Ultra inherit existing combat and faction behavior.  
Hardware Impact: One extra NPC in an already NPC-heavy floor; estimated incremental AI cost below 10 us on low-end silicon.

Problem: The dопросная needs a combat event without changing quest accept hooks.  
Solution: Spawned existing SHADOW and ZOMBIE monsters inside the room as a static ambush.  
Rejected Alternatives: New monster type, scripted cutscene, or quest-engine `spawnMonstersOnAccept` support for side quests.  
Scalability potential: Low: two monsters. Middle/High/Ultra: existing RPG scaling raises stats by zone level.  
Hardware Impact: Two entities only when Ministry is generated; expected low-end cost below 20 us during nearby AI/combat ticks, 0 us if inactive/off-floor.

Problem: Bureaucratic horror can turn into unreadable document bloat.  
Solution: Put flavor in short NPC lines and quest descriptions; no `data/notes.ts` edits.  
Rejected Alternatives: Long fake legal documents and new note series. They increase text mass without playability.  
Scalability potential: Low/Middle remain readable; High/Ultra get same content with no render or simulation expansion.  
Hardware Impact: Static string data; 0 us frame cost.

Problem: Polish mandate requires verifying rooms do not overwrite lifts, but `connectProtectedRoom` may carve outward after a room is stamped.  
Solution: `createAdminRoom` snapshots all `Cell.LIFT` indices before connection and restores them after connection. The room footprint itself still uses `findClearArea`, so lift cells cannot be inside the stamped rectangle.  
Rejected Alternatives: Trusting placement by inspection only, or editing shared generator code. Local restoration is scoped to Ministry admin POIs.  
Scalability potential: Low through Ultra keep existing lift topology; high-tier visuals are unaffected because no new render work is introduced.  
Hardware Impact: Four one-time 1024x1024 scans during Ministry generation; estimated 4000-8000 us total on i3/MX350 at floor generation, 0 us per frame.
