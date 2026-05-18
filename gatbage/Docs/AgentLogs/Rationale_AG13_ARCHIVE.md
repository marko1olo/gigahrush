# AG13 Archive Access Rationale

The archive slice stays inside `MINISTRY` and does not add `FloorLevel.ADMIN`.

Access gameplay uses existing container modes:

- `faction` service card index: player can take documents, but `takeFromContainer()` records unauthorized access as an `item_stolen` event and HUD theft message.
- `locked` passport safe: uses the existing locked-container denial path.
- `secret` dead-letter stash: gives a discoverable forged route without a new permission system.

Documents remain normal item definitions because current inventory and quest systems already understand item ids. They become useful through side quests, contract targets, rewards, container loot, rumors, and theft events. No parser or document runtime was added.

The new POI is generated through the Ministry content manifest, uses `createAdminRoom()`/`connectProtectedRoom()` via existing helpers, and keeps runtime work at generation time only.
