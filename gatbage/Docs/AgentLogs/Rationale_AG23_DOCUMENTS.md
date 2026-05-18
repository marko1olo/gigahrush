# AG23 Documents Rationale

## Preflight Decisions

Problem: Documents need to become useful without adding a document editor or a new UI surface.
Solution: Use existing `ItemType.NOTE` / `ItemType.MISC`, existing quest/contract shapes, and generation-time placement.
Rejected Alternatives: A form parser, document editor, or DOM-style screen would exceed the brief and add UI/runtime cost.

Problem: The worktree already contains broad uncommitted changes from other agents.
Solution: Treat the current checkout as the integration baseline, make scoped AG23 edits, and avoid reverting unrelated files.
Rejected Alternatives: Cleaning or resetting the tree would risk deleting other agents' work.

Problem: AG07 already added many paper props.
Solution: Add only explicit actionable variants that contracts and containers reference, while letting generic paper props remain flavor/economy items.
Rejected Alternatives: Reusing only generic ids would make official/forged utility invisible to players and contracts.

## Implementation Decisions

Problem: A manual `world.addContainer()` during Ministry generation would make `ensureRoomContainers()` return early and skip generic container seeding.
Solution: Put AG23 documents into existing data-only container pools: locked safes get official papers, secret stashes get forged papers.
Rejected Alternatives: Adding a bespoke generation-time container would have made one document cache reachable but silently reduced the rest of the floor's container coverage.

Problem: Typecheck failed after the data pass because unrelated integration files were already inconsistent.
Solution: Applied narrow fixes only: Void content manifest call shape, a container inventory guard, and rumor helper/event mapping completion.
Rejected Alternatives: Reporting a clean validation result without fixing the real errors, or doing broad refactors outside the failing lines.

Problem: Documents should carry risk without a new system.
Solution: Item names/descriptions include existing document keywords, so the existing печатеед targeting logic treats these papers as document-like; rumors and contracts surface that risk.
Rejected Alternatives: A new per-frame document-risk scanner or UI warning.
