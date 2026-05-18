# Rationale_ORCHESTRATOR

## Decision 1: Treat Repository Facts As Authority

Problem: User-supplied protocol references `C:\hades\Hecton8`, Unity, `.agents-skills`, and `/Docs`, but this checkout is a TypeScript/Vite game with no local `AGENTS.md`, no Unity project, no `.agents-skills`, and no initial `Docs` tree.

Solution: Use the inline protocol where it is compatible, but ground prompt design in actual files: `src/core/types.ts`, `src/core/world.ts`, `src/main.ts`, `src/gen/*`, `src/systems/*`, `README.md`, and `desdoc.md`.

Rejected Alternatives: Pretending absent Windows paths exist would create unusable prompts. Converting the project to the described Unity architecture would be sabotage.

Scalability potential: Agents receive prompts that fit the current single-page WebGL raycaster and can add content without forcing engine migration.

Hardware Impact: Avoided architecture churn saves low-end devices from unnecessary abstractions; expected runtime gain is indirect, around 100-300 us per frame versus naive over-systematization.

## Decision 2: Ten Separate Prompt Files, Not One Batch

Problem: Ten agents will work in parallel and the supplied protocol says each agent must extract only its own XML block. A single master batch increases neighboring-prompt contamination and edit contention.

Solution: Create ten standalone `Docs/AgentPrompts/AGENT_*.md` files. Each contains exactly one `<AGENT_PROMPT id="...">` block and its own `<POLISH_MANDATE>`.

Rejected Alternatives: One huge `CURRENT_BATCH.md` was rejected because it would invite accidental cross-reading and make per-agent launch paths less explicit.

Scalability potential: Operators can launch all prompts independently. Weak devices can run only selected agents; high-end workflows can run all ten.

Hardware Impact: Planning-only; no frame cost. Human/agent coordination savings estimated at 250000-500000 us per integration conflict avoided.

## Decision 3: Assign File Ownership, Allow Surgical Shared Touches

Problem: Some game systems require shared files (`core/types.ts`, `main.ts`, `systems/debug.ts`, `render/sprites.ts`). Full isolation is impossible if features must be playable.

Solution: Each prompt defines an absolute write scope and a named shared-touch rule. Agents must re-read shared files immediately before edits and avoid depending on another agent's not-yet-merged output.

Rejected Alternatives: Forbidding all shared edits would produce dead modules with no gameplay visibility. Allowing unrestricted shared edits would cause merge collisions.

Scalability potential: Parallel patches stay mostly additive: new modules, side-effect content modules, data registries, and narrow integration hooks.

Hardware Impact: Runtime impact depends on future implementations; prompts require cooldowns, fixed buffers, and no new dependencies to keep low-end i3/MX350 viable.

## Decision 4: Verify The Combined Tree After Agent Completion

Problem: Individual agents reported successful builds, but parallel changes can still collide after all patches are present in one worktree.

Solution: After all ten sessions completed, run `npm run build`, `npx tsc --noEmit`, and `git diff --check` from the root.

Rejected Alternatives: Trusting per-agent build reports was rejected because AG10 touched shared systems after AG07-AG09 and could change type surfaces.

Scalability potential: Final integrated verification catches cross-domain breakage before the next wave of agents starts.

Hardware Impact: No runtime cost. Saved debugging time estimated at 90000-130000 us by catching compile/type/whitespace failures immediately.
