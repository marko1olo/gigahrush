# Rationale_DIRECTOR_HOOK_SUBAGENTS

## Decision 1: Director Hook Pass Before Code

Problem: `00_samosbor_director` was added after the 10 expansion implementation packages were created. Those packages now need explicit hooks so future code work does not invent separate schedulers and cooldowns per expansion.

Solution: Launch one worker per expansion to add `director_hooks.md` and update local integration contracts. Workers remain documentation-scoped to avoid source conflicts in the dirty worktree.

Rejected Alternatives: Direct implementation was rejected because director integration touches shared runtime files and would collide with many current source edits. Leaving director hooks implicit was rejected because future implementation would drift.

Scalability potential: Each expansion becomes schedulable through shared DirectorBeat definitions and bounded traces, while low-end devices keep rare-tick director evaluation.

Hardware Impact: No runtime cost now. Future runtime target remains 0 us/frame steady-state for director logic, avoiding duplicated per-frame pressure systems.

## Decision 2: Run In Waves Because Of Thread Limit

Problem: The platform previously accepted about six simultaneous workers and rejected additional agents with `agent thread limit reached`.

Solution: Launch EXP00-EXP05 first, then launch EXP06-EXP10 after completed workers are closed.

Rejected Alternatives: Launching all 11 at once was rejected because it would produce avoidable failures and noisy orchestration.

Scalability potential: Wave scheduling preserves one-agent-per-expansion ownership while respecting platform capacity.

Hardware Impact: No runtime cost.
