# Rationale_AG01_EVENTS

## Preflight

Problem: Event/log layer must be added while 20+ agents may edit adjacent systems.  
Solution: Use only the explicit AGENT_01 write scope and keep existing direct `state.msgs.push(...)` paths alive.  
Rejected Alternatives: Replacing every message producer in one pass; too broad and conflict-prone.  
Scalability potential: Low uses bounded buffers and no background scans; Middle/High/Ultra can spend saved cycles on richer consumers later.  
Hardware Impact: Bounded event publish should stay in single-digit microseconds on i3/MX350-class hardware.

Problem: Local mandate registry and domain file are absent in this checkout.  
Solution: Treat the extracted XML block and `desdoc.md` sections 4, 73, 80 as local authority.  
Rejected Alternatives: Reading neighboring agent prompts or unrelated repos; violates strict parsing.  
Scalability potential: Keeps this task isolated from unowned systems.  
Hardware Impact: No runtime impact.

## Tasks 2-5

Problem: Event memory must survive long sessions without bloating saves or turning the HUD into a spam feed.  
Solution: Added fixed-capacity recent, important, and per-zone ring buffers plus a severity/privacy-gated world-log consumer.  
Rejected Alternatives: Plain `WorldEvent[]` history and string-first log writes; both fail the fixed-history and definition-driven mandates.  
Scalability potential: Low keeps 512/128/32 ring limits; Middle/High/Ultra can raise capacities or add richer consumers without changing producers.  
Hardware Impact: Ring writes are O(1). Estimated publish storage cost is under 10 us on i3/MX350; log conversion is skipped for low-severity ammo/noise events.

Problem: Old saves do not contain event state.  
Solution: `worldEvents` is optional in `GameState`, initialized on new games, and normalized on load/save.  
Rejected Alternatives: Hard migration or save version gate; unnecessary for optional bounded state.  
Scalability potential: Future save migrations can reuse the normalization boundary.  
Hardware Impact: Load normalization copies bounded buffers only; no frame-time impact after load.

## Tasks 6-10

Problem: Samosbor already had active variant work in the shared file, so event hooks had to avoid overwriting that logic.  
Solution: Published events at existing transition points only: start, warning, zone capture, boss spawn, end, and boss kill.  
Rejected Alternatives: Logging fog spread cells or every fog minion spawn; this would create hot-loop noise and save bloat.  
Scalability potential: Low/Middle get public high-severity chronicles; High/Ultra can later attach richer consumers to the same events.  
Hardware Impact: Transition-only publication is under 50 us per samosbor phase on i3/MX350-class hardware.

Problem: Inventory events must cover pickup/drop/use/break/ammo without breaking AI combat callers.  
Solution: Added optional `GameState` arguments; main player calls pass state, AI callers keep old signatures. Ammo consumes publish severity 0 events only.  
Rejected Alternatives: Moving inventory ownership into `GameState` or scattering event calls around projectile creation.  
Scalability potential: Low suppresses ammo log spam; Middle/High/Ultra can query recent inventory facts without producer changes.  
Hardware Impact: Player actions add a single publish under 10 us; projectile pellet loops stay untouched.

Problem: Quest and kill events must not duplicate rewards, XP, or quest counters.  
Solution: Published quest events after existing accept/complete mutations and kill events inside `handleKill` without changing `notifyKill` or XP calls.  
Rejected Alternatives: Making events drive quest completion in this pass; too broad and risks behavior regression.  
Scalability potential: Future context quests can consume these facts while current plot behavior remains stable.  
Hardware Impact: Single event object per quest transition/kill; estimated under 10 us each.

Problem: Debug visibility was required without changing unowned HUD render signatures.  
Solution: Added an existing debug-menu command that prints ring counts and last 10 important event ids/types.  
Rejected Alternatives: New overlay dependency or extra render parameters outside scope.  
Scalability potential: Works on all tiers because it is operator-triggered only.  
Hardware Impact: Zero frame cost until command execution.

## Task 11

Problem: README must describe shipped facts only.  
Solution: Added a short implemented-system subsection covering bounded buffers, wired producers, L-log/HUD conversion, old-save normalization, and the debug command.  
Rejected Alternatives: Future context/rumor/economy claims; those systems are not implemented here.  
Scalability potential: Documentation now names the fixed capacities and can be updated if future tiers raise them.  
Hardware Impact: Documentation only, 0 us runtime.

## Task 12

Problem: Final verification must distinguish own errors from baseline state.  
Solution: Ran `npm run build` after all code and README edits; build passed.  
Rejected Alternatives: Relying on checkpoint build before README/status/log edits.  
Scalability potential: Build verification protects integration across current producer hooks.  
Hardware Impact: Build-time only, 0 us runtime.
