# Status AG104 Fake Medpost Zhelemish

Prompt: `AGENT_104_FAKE_MEDPOST_ZHELEMISH`

## Preflight

- Extracted prompt block by id.
- Read `README.md`.
- Read `architecture.md`.
- Read `desdoc.md` section 16.5.
- Read `src/gen/living/emergency_medpost.ts`.
- Read `src/gen/living/hospital_quarantine.ts`.
- Read `src/gen/living/zone_content.ts`.
- Read `src/systems/events.ts`.
- Read `src/systems/containers.ts`.
- Baseline `npm run typecheck`: failed because `package.json` has no `typecheck` script in this checkout.

## Plan

1. Add a protected Living fake-medpost POI with practitioner, patient, relative and runner. Done.
2. Use existing side quests for warn, report, buy counterfeit treatment and take-cut decisions. Done.
3. Seed zhelemish/counterfeit stock through normal item/container patterns. Done.
4. Publish tagged outcome events from local world-event observer hooks. Done.
5. Register the content through `src/gen/living/content_manifest.ts`. Done.
6. Validate with available project scripts. Done with blockers noted below.

## Implementation

- Added `src/gen/living/fake_medpost_zhelemish.ts`.
- Registered `Липовый медугол желемыша` in Living zone HUD 46 through `src/gen/living/content_manifest.ts`.
- Spawned four NPCs:
  - `Левин Мазник`: counterfeit practitioner selling a paid zhelemish course.
  - `Даша Подмарлевая`: patient affected by the fake treatment.
  - `Лина Подмарлевая`: relative who asks the player to warn the patient.
  - `Клим Заготовщик`: stock runner who pays the player to supply infected mushroom.
- Added side-quest decisions:
  - `ag104_warn_patient`: warn the patient.
  - `ag104_report_ministry`: report the fake medpost to `Вера Пропускова`.
  - `ag104_buy_zhelemish_course`: buy the counterfeit treatment.
  - `ag104_take_cut`: provide infected stock and take a cut.
- Added three containers using existing container access/theft handling:
  - `Ящик желемышной мази`: owner stock, theft path.
  - `Касса липового медугла`: owner cashbox/papers, theft path.
  - `Серый пакет под каталкой`: secret sample stash.
- Added local world-event observer outcomes tagged with `ag104_fake_medpost`, `zhelemish`, and `medical_fraud`:
  - fraud exposed;
  - patient saved;
  - patient harmed;
  - profit taken.
- Stock theft uses the existing `item_stolen` event path with `zhelemish_stock` tags from the containers.

## Player Verification

1. Start on `Жилая зона`.
2. Find zone HUD 46 and enter `Липовый медугол желемыша`.
3. Choose one route:
   - talk to `Лина Подмарлевая`, accept the warning quest, then talk to `Даша`;
   - talk to `Даша`, accept the report quest, then report to `Вера Пропускова`;
   - talk to `Левин Мазник` and buy the zhelemish course;
   - bring `infected_mushroom` to `Клим Заготовщик` and take the cut;
   - steal from the owner stock/cashbox.
4. Confirm the HUD/log records the outcome and theft events use the container system.

## Validation

- `npm run typecheck`: missing script in `package.json`.
- `npm run check`: missing script in `package.json`.
- `npm run smoke`: missing script in `package.json`.
- `npx tsc --noEmit`: failed on existing repo-wide errors unrelated to AG104; no diagnostics mention `fake_medpost_zhelemish`, `content_manifest`, or `ag104`.
- `npm run build`: passed. Vite still reports an existing duplicate-case warning in `src/systems/debug.ts`.
