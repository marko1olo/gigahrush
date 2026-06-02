# ecology_10: heavy elites and bosses

> Parallel worker plan.
>
> Primary owner: `NIGHTMARE`, `KOSTOREZ`, `SAFEGUARD`, `SOBRANNYY`, `MANCOBUS`, `HERALD`, `CREATOR`.

## Intake

Read `README.md`, `architecture.md`, `ai.md`, `fight.md`, `balance.md`, `monsters.md`, `ecology.md`, `ecology_0.md`, then inspect:

- relevant `src/entities/*.ts`
- `src/systems/ai/monster.ts`
- boss readability data in `MonsterDef`
- route/final floor tests touching these monsters
- `tests/ai-full-pass.test.ts`
- relevant `tests/monster_*.test.ts`

## Mission

Make rare heavy threats readable, fair and decisive without crowd-scale cost. These monsters may have richer behavior because they are rare, but every phase must be bounded and should not suppress the full-floor simulation.

## Shared family rule

Family archetypes: `heavy_elite`, `windup_elite`, `rare_pressure`, `boss_line_controller`, `composite_growth`.

Implementation principles:

- Boss/elite behavior can use phases, but phase checks are actor-local.
- Windups must be readable and interruptible where counterplay says so.
- Heavy ranged sectors use existing projectile/line systems.
- No full-map minion coordination.
- Boss logic must still allow NPCs/monsters to interact honestly unless explicitly immune by design.

Potential shared helper:

```txt
eliteWindupState(actor, target, tuning)
  warn
  commit
  interrupt
  recover
```

Only add if `KOSTOREZ` and `SAFEGUARD` still duplicate enough logic after local cleanup.

## Monster plan

### `NIGHTMARE`

Current: rare pressure monster.

Goal: short burst or leave; long fight is bad.

Implementation lane:

- Prefer data/cue and pressure timer if current behavior lacks readability.
- Avoid complex pathing.

Counterplay transition:

- Heavy early damage or leaving room breaks pressure.

Tests:

- pressure does not grow unbounded.
- baseline combat target still valid.

### `KOSTOREZ`

Current: melee elite windup.

Goal: readable windup, corner/column/shotgun answer.

Implementation lane:

- Use existing blade elite tuning if present.
- Coordinate with `SAFEGUARD` for shared windup helper.

Counterplay transition:

- Leave windup range, break line with obstacle, shotgun stagger.

Tests:

- windup interrupt.
- recovery after miss/interrupt.

### `SAFEGUARD`

Current: fast NET/BLAME blade guard.

Goal: faster elite with same readable windup family but NET/source flavor.

Implementation lane:

- Share blade helper with `KOSTOREZ` if it stays small.
- Do not depend on Cloudflare/online.

Counterplay transition:

- Wall/door/machine/apparatus break line; shotgun interrupts.

Tests:

- no online dependency.
- windup/stagger cap.

### `SOBRANNYY`

Current: `meatGrowth`, post-samosbor composite.

Goal: dormant/sleeping composite; grows from repeated hits/kills but capped.

Implementation lane:

- Keep `WeakMap` runtime or actor-local scalar if current code uses it.
- Growth stacks must have cap and decay.

Counterplay transition:

- Do not wake without exit.
- Fire/toxic slime/hermetic threshold interrupts chase.
- Burst damage better than chip damage.

Tests:

- growth stack cap.
- dormant wake reasons local.

### `MANCOBUS`

Current: heavy ranged commander/boss.

Goal: sector/guard pressure; corners between volleys.

Implementation lane:

- Keep guard/minion interaction bounded.
- Do not global-command monsters.

Counterplay transition:

- Clear guards, break sector line, attack during reload.

Tests:

- no all-map guard scan.
- projectile/sector cooldown.

### `HERALD`

Current: Hell watcher / route-gated boss-like threat.

Goal: watcher line and voice pressure without scripted-only player tunnel.

Implementation lane:

- Keep route/floor gating out of `main.ts`.
- Use line/windup/cue helper if clean.

Counterplay transition:

- Cover between volleys, do not listen/stay exposed.

Tests:

- target selection remains entity-oriented.
- route gate behavior unchanged.

### `CREATOR`

Current: final Void boss.

Goal: final exam of cover, resource, green contour and exit discipline.

Implementation lane:

- Do not over-refactor final boss during ecology pass.
- Add only readability/cue/test gaps.

Counterplay transition:

- Cover between green bursts, leave contour, conserve movement.

Tests:

- no regression in final route generation.
- boss readability data intact.

## Samosbor line

Heavy elites are usually `exempt` or `born` through authored route/samosbor content. Do not spawn extra elites just because the floor is quiet. `SOBRANNYY` is the main post-samosbor composite owner here and must stay capped.

## Validation

Run `npm run check`. If final/route rendering, boss visuals or projectiles change, run browser validation when available.
