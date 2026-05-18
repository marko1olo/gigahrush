# AG17 Hospital Quarantine Rationale

The slice stays finite on purpose. No disease model, spread tick, NPC scan, or hidden medical status was added.

Key decisions:
- Implemented quarantine as a protected LIVING POI in the existing zone-content registry, not as a new floor or broad system.
- Used existing medical items first: `bandage`, `pills`, `antibiotic`, `antifungal_ointment`, `sanitary_kit`, `clean_health_cert`, `psychiatrist_referral`.
- Added only one required document item, `quarantine_medcard`, because the medcard retrieval quest needs a concrete inventory target.
- Made the patient choice visible by having two quarantined patients ask for the same scarce `antibiotic` reward path.
- Used the existing `MonsterKind.ZOMBIE` for the outbreak cleanup instead of creating a disease monster.
- Published quarantine facts through existing `container_opened` and `item_stolen` events by propagating container tags into events and world-log text.

Container integration note:
- The current container system already supports additive hand-placed containers and skips rooms that already have containers. The AG17 module uses that path and tags its containers with `content`, `hospital`, and `quarantine`.
