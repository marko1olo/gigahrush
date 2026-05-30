# rework_orchestrator

Target model: GPT-5.5 orchestrator.

Mode: integration owner after the parallel `rework_01` through `rework_10` workers have run.

The tree is expected to be dirty. Some dirty work predates this campaign and may include PR docs, generated release artifacts, UI changes, bark changes and tests. Do not revert unrelated work. Do not assume every dirty file belongs to the UX campaign.

## Mission

Review, integrate and verify all UX rework worker outputs.

The end result should be one coherent first-session experience:

1. The player starts with a clear objective.
2. The UI is readable and not blank.
3. The first NPC interaction is not a trap.
4. Objective/route/lift cues explain where to go without requiring a map redesign.
5. Combat input/feedback is understandable.
6. Samosbor/hazards remain scary but legible.
7. NPC chatter becomes local signal, not global noise.
8. Mobile controls do not cover critical HUD.

## Mandatory Intake

Read:

- `README.md`
- `architecture.md`
- all files in `Docs/UXRework/rework_*.md`
- `git status --short`
- diffs for every file touched by workers

Useful commands:

```bash
git status --short
git diff --stat
git diff -- src tests Docs/UXRework README.md package.json scripts
```

Do not use destructive git commands.

## Integration Order

Review and integrate in this order:

1. `rework_02` UI orchestrator defaults/presets.
2. `rework_01` first playable path.
3. `rework_03` HUD slot/modal quiet.
4. `rework_05` route/lift/objective clarity.
5. `rework_06` combat/camera/pointer feedback.
6. `rework_08` samosbor/hazard teaching.
7. `rework_04` message/bark triage.
8. `rework_07` mobile safe layout.
9. `rework_09` first-hour text.
10. `rework_10` tests/smoke gates.

This order protects the first-session UI before adding polish or text volume.

## Conflict Rules

If two workers implement overlapping features:

- Keep one generic mechanism.
- Remove duplicate display surfaces.
- Prefer system/data helpers over content-specific checks in `main.ts`.
- Prefer HUD slots over new fixed coordinates.
- Prefer current-objective source of truth over separate one-off prompts.
- Prefer UI presets over hardcoded "always show" except locked critical warnings.

Do not preserve both versions "just in case".

## Red Flags To Reject

Reject or rewrite changes that:

- Put content-specific logic in `main.ts`, `core/world.ts`, `render/webgl.ts` or broad AI.
- Add a new `FloorLevel`.
- Hide damage/samosbor/hazard feedback with no replacement.
- Make the default HUD almost blank.
- Turn the minimap into a tiny full-information map.
- Rework map/minimap modes, colors or layer structure as part of this campaign. The map is considered acceptable; preserve it unless fixing a proven small bug.
- Add per-frame full-world scans.
- Add random bark volume instead of routing/triage.
- Commit `dist/index.html` or `itch/gigahrush-itch.zip` as part of a UX source PR.
- Add save migration scaffolding for UI settings.
- Translate Russian player-facing text by accident.

## Required Final UX Checks

Fresh desktop run:

- Title tells player how mouse capture and attack work.
- First visible objective points to Olga.
- Looking at Olga shows an interaction affordance.
- Olga interaction clearly offers/starts the Barni path.
- Barni path gives weapon/ammo feedback.
- Returning to Olga advances toward Yakov.
- The player can open UI settings and choose presets.

HUD:

- No overlap among objective, messages, existing minimap/route hints and critical warnings.
- Modal menus quiet ordinary HUD.
- Samosbor warning remains readable.
- Damage/sleep/death feedback remains visible.

Route/map:

- Existing map/minimap behavior is preserved.
- Route and lift language explain the first objective without forcing the player to study the map.
- Lift prompt communicates direction and target relevance.

Messages:

- Nearby barks show distance.
- Distant barks do not enter log.
- Ambient chatter does not flood HUD.

Mobile:

- Touch controls do not cover critical HUD.
- UI/menu/action rail remains usable in landscape.

## Validation Commands

Run in increasing scope. Stop and inspect real errors.

```bash
npm run typecheck
npm run test:unit
npm run content:audit
npm run check:readonly
```

For UI/render/mobile/input work, and for any tiny map bug fix that was explicitly approved, also run:

```bash
npm run check:browser
```

Final campaign gate:

```bash
npm run check:full
```

If broad player-facing text changed:

```bash
npm run l10n:audit
```

Do not run release artifact checks unless the user explicitly asks for release/deploy.

## Documentation Updates

Update docs only for shipped facts:

- `README.md` after verified behavior changes.
- `architecture.md` only if layer contracts changed.
- `desdoc.md` for future direction, or `problems.md` for problematic non-system mechanics.

Do not create agent-log or task-status directories. Keep durable campaign context in `Docs/UXRework/` or active planning docs.

## Final Report Template

Report:

- what changed by subsystem
- which first-session path is now visible
- which UI preset is default
- which hazards remain locked/critical
- what tests/checks passed
- any skipped checks and exact reason
- unresolved risks

Keep it concise and grounded in file paths.
