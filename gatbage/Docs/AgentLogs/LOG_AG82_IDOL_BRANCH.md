# LOG AG82 Idol Branch Expansion

Date: 2026-05-18

Implemented the Chernobog idol side-branch as gated authored side quest data:

- Ministry report via `vera_propuskova`.
- Liquidator field report via `polkovnik_streltsov`.
- Candle concealment via `batushka`.
- Counterfeit decoy via `stalker_mecheny`.
- Cult-contact handoff via `hell_contact`.

Continuity rule: any branch that takes `idol_chernobog` returns `idol_chernobog` as the quest reward. The counterfeit branch consumes `forged_stamp_sheet` instead and records that the main plot idol was preserved.

Runtime hook: authored quests can now carry event metadata (`eventData`, `eventPrivacy`, `eventSeverity`, `eventTargetName`) through quest creation/completion events. The AG82 branches publish `idol_branch` tags plus report/handoff/concealment/counterfeit tags and static rumor ids.

Validation:

- Baseline `npm run typecheck`: failed before edits because the script is missing from `package.json`.
- `npx tsc --noEmit`: blocked by pre-existing unrelated errors (`SILVER_SLIME_SEALED_ID`, missing `KOSTOREZ` registry entries, duplicate debug identifiers, incomplete faction/samosbor symbols).
- `npx tsc -p tsconfig.test.json`: blocked by the same errors plus missing test-state `uvBeamFx` / `uvBeamLen`.
- Targeted emitted JS tests for `content-registry` and `events-economy`: blocked at module load by pre-existing `ReferenceError: SILVER_SLIME_SEALED_ID is not defined`.
- `npm run build`: passed.
- Required `npm run check`: failed because the script is missing from `package.json`.
