# Rationale_AG06_KV

## Preflight Decisions

Problem: Windows-only authoritative paths from the pasted instruction (`C:\hades\Hecton8\...`) and local `.agents-skills/` registry are absent in `/Users/jirnyak/Mirror/gigahrush`.
Solution: Use the extracted AGENT_06 XML prompt, README, desdoc sections, and current source files as the enforceable local evidence set.
Rejected Alternatives: Blocking on missing Windows paths would stop work despite a complete local assignment. Inventing mandate filenames would create fake compliance.
Scalability potential: Low, Middle, High, Ultra tiers all benefit from content-only POIs because no new global simulation loop is added.
Hardware Impact: Avoiding new per-frame systems preserves low-end i3/MX350 frame time; expected recurring cost before implementation is 0 us.

Problem: Kvartiry social content must coexist with parallel agents.
Solution: Add isolated modules under `src/gen/kvartiry/`, touch `index.ts` only for imports/calls and a bounded uprising hook, and leave global relations/Faction enum untouched.
Rejected Alternatives: Editing global matrices or waiting for AG09 rumor/memory APIs would create cross-agent dependency and integration risk.
Scalability potential: Low tier gets static POIs and cheap local conversions; higher tiers still benefit from dense authored dialogue and loot without CPU escalation.
Hardware Impact: Module generation cost is one-time during floor generation; recurring hook must stay cooldown-bound and local. Target steady-frame cost: 0 us except existing 30s population tick.

Problem: New POIs must be reachable without rewriting the Kvartiry maze.
Solution: Use `stampRoom`, `protectRoom`, and `connectProtectedRoom` from shared generation, then add local furniture/loot/NPCs inside protected rooms.
Rejected Alternatives: Mutating existing flood-filled rooms by name would be brittle and could trample other agents' content. Adding new `RoomType` values would spill into unrelated systems.
Scalability potential: Low tier pays one-time stamping only; Middle/High/Ultra get denser authored social scenes without extra frame loops.
Hardware Impact: One-time generation cost is a few rectangular cell writes per POI. Estimated recurring frame gain versus a social simulation loop: 100+ us avoided on i3/MX350.

Problem: Barricade content can easily break pathing if it seals a corridor.
Solution: Put the barricade inside its own protected corridor room and leave a two-cell gap through the obstacle line.
Rejected Alternatives: Blocking live maze corridors would risk disconnecting lifts or spawn routes.
Scalability potential: Low tier sees a cheap static obstacle; higher tiers can later decorate the same room without changing path guarantees.
Hardware Impact: Static wall writes cost 0 us per frame; no physics or nav rebuild is introduced.

Problem: The dynamic uprising hook must add local social pressure without a new simulation loop.
Solution: Register authored POI centers at generation time and sample one center only inside the existing 30-second uprising cadence. Conversion is capped at 2-5 non-plot citizens.
Rejected Alternatives: Per-frame scans, memory/rumor dependencies, or global faction heat maps would violate the prompt and add cost outside AG06's domain.
Scalability potential: Low tier gets rare local unrest at negligible cost; Middle, High, Ultra can raise visual density around the same POIs later without changing the hook.
Hardware Impact: No per-frame cost. On the 30-second tick, worst case is one linear entity pass with early exit after 5 conversions; estimated amortized cost below 1 us/frame on i3/MX350.

Problem: Side quests need social flavor but the current quest system supports one fetch target per quest.
Solution: Keep quests to one existing target item and put secondary food/water flavor in rewards, drops, and dialogue.
Rejected Alternatives: Extending `QuestType` or adding multi-item quest targets would cross domain boundaries and risk UI/quest regressions.
Scalability potential: Low tier uses existing quest UI; higher tiers can later upgrade quest schema without invalidating these content modules.
Hardware Impact: Reusing `registerSideQuest` adds no runtime cost beyond existing quest lookup arrays; estimated saved implementation risk is higher than any microsecond gain.

Problem: Polish mandate required deleting heavy social simulator code and checking duplicate spawn loops.
Solution: No heavy simulator code was present after implementation; kept one POI registry and a capped 30-second uprising hook. Spawn code is one-shot generation per POI through shared helpers.
Rejected Alternatives: Adding faction heat maps, timers per POI, or persistent unrest agents would violate AG06's content-only mandate.
Scalability potential: Low tier keeps authored static POIs; Middle, High, Ultra can add visuals or density around the same generated rooms without changing recurring CPU cost.
Hardware Impact: Final recurring AG06 cost remains 0 us/frame, with a rare amortized <1 us/frame 30-second tick scan.
