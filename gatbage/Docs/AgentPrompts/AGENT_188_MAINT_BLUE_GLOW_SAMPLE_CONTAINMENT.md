# AGENT_188_MAINT_BLUE_GLOW_SAMPLE_CONTAINMENT

Model: GPT-5.5  
Reasoning: high  
Parallel role: blue glow sample owner.

<AGENT_PROMPT id="AGENT_188_MAINT_BLUE_GLOW_SAMPLE_CONTAINMENT">
PROMPT IDENTIFIED: AGENT_188_MAINT_BLUE_GLOW_SAMPLE_CONTAINMENT | DOMAIN: Maintenance content | ITERATION: 4.

## Mandatory Preflight

1. Extract this XML block by id with a CLI command.
2. Read the shared batch contract: `Docs/AgentPrompts/BATCH4_PARALLEL_CONTRACT.md`.
3. Read project source of truth before edits: `README.md`, `architecture.md`, and the relevant local `desdoc.md` section.
4. Read every file in your absolute write scope before changing it.
5. Create `Docs/Tasks/Status_AG188_MAINT_BLUE_GLOW_SAMPLE_CONTAINMENT.md`.
6. Append final report to `Docs/AgentLogs/LOG_AG188_MAINT_BLUE_GLOW_SAMPLE_CONTAINMENT.md`.
7. Run baseline `npm run typecheck` and record the result.

## Goal

Improve containment cues and reward for the blue glow sample.

## Absolute Write Scope

Owned:
- `src/gen/maintenance/blue_glow_sample.ts`
- `Docs/Tasks/Status_AG188_MAINT_BLUE_GLOW_SAMPLE_CONTAINMENT.md`
- `Docs/AgentLogs/LOG_AG188_MAINT_BLUE_GLOW_SAMPLE_CONTAINMENT.md`
- Optional focused test only if needed: `tests/ag188_maint_blue_glow_sample_containment.test.ts`

Read for context:
- `README.md`
- `architecture.md`
- `desdoc.md` relevant local sections
- `Docs/AgentPrompts/BATCH4_PARALLEL_CONTRACT.md`

Forbidden:
- Do not edit `README.md`; old `AGENT_119` owns the README fact pass.
- Do not edit `Docs/AgentPrompts`.
- Do not edit shared manifests, `main.ts`, `core/world.ts`, `core/types.ts`, `render/webgl.ts`, broad AI, broad quest/inventory/economy systems, or package metadata.
- Do not add runtime dependencies, DOM UI, new framework code, or unbounded scans.
- Do not import another new AG121-AG220 module.

## Implementation Tasks

1. Audit the owned source file and identify the smallest existing gameplay loop it already owns.
2. Local module only; no radiation system.
3. Ensure the result gives the player one decision: trade, steal, repair, escort, kill, hide, forge, expose, reroute, or flee.
4. Prefer existing item ids, event types, marks, containers, factions, and helper functions.
5. If the improvement requires a shared hook outside your scope, stop at a clear status/log blocker instead of widening scope.
6. Verify reachability through the existing generator/system path or a focused test/debug path.
7. Run `npm run typecheck`; for generator or system behavior changes also run `npm run check` unless blocked by a real environment failure.

## Done Means

- The sample is valuable and visibly unsafe.
- The change is isolated to the owned source file, status/log, and optional unique test.
- No shared queue conflict is introduced.
- Validation results are recorded with exact commands.
</AGENT_PROMPT>

<POLISH_MANDATE>
Keep this pass surgical. If the owned file is already good, add a focused verification/status note instead of inventing a new subsystem.
</POLISH_MANDATE>
