# AG26 Container / Trade UI Rationale

## Preflight

Problem: Container interaction existed but needed normal player-facing behavior, safe item transfer semantics, and scarcity prices connected to trade without per-frame economy work.
Solution: Read the prompt XML, README, architecture, container/trade UI, inventory, economy, dialogue, and main input sections before editing. Ran a baseline production build.
Rejected Alternatives: DOM UI, inventory redesign, or a full market simulation. The existing canvas grids and economy helpers were enough.
Hardware Impact: Interaction-only work. Container lookup stays local by cell/radius, and price calculations are cached by floor/economy version.

## Transfer Semantics

Problem: Transfer code must not duplicate or delete items under full inventory, full container, stack merge, or repeated keypress cases.
Solution: Container moves now calculate target fit before changing source counts. The target receives only the movable count, then the selected source slot is decremented. Stack merges are handled before new slots.
Rejected Alternatives: Relying on best-effort inventory add followed by rollback, or removing by item id instead of selected slot.
Hardware Impact: Explicit interaction only, O(slots) over 25 player slots or container capacity.

## Access Feedback

Problem: Locked, secret, faction, and owner access needed visible feedback, not silent failure.
Solution: Reused `containerAccessInfo()` for render and input dispatch. The panel shows access label/detail, theft changes the action hint, locked/secret failures emit HUD messages, and looking directly at a hidden stash can discover it.
Rejected Alternatives: Blocking all non-public containers or adding a separate lockpicking UI.
Hardware Impact: No frame scan. Access checks run only when drawing the open panel or handling `E`.

## Trade Prices

Problem: Scarcity-adjusted prices were needed in the existing NPC trade surface without recalculating economy data every frame.
Solution: Added a weak per-state price cache keyed by current floor and `priceVersion`. Resource stock changes bump the version. Trade open and successful buy/sell paths prime the cache for the visible inventories; draw calls then read cached prices.
Rejected Alternatives: Recomputing all item prices every HUD draw or storing UI-only price fields on item stacks.
Hardware Impact: Price work is O(unique visible trade item ids) at menu/update cadence; steady draw calls are map lookups.

## Documentation

Problem: README must document shipped behavior, not intent.
Solution: Updated trade/container facts to mention cached scarcity prices, access/capacity display, one-item transfers, stack merges, full-target failure, and access feedback.
Rejected Alternatives: Broad README rewrite or speculative future container mechanics.
Hardware Impact: Documentation only.
