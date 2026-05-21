# Design Floor: Этаж 69

Status: implemented authored route floor. Route id: `floor_69`. Anchor: `z=-4`. Base floor: `MAINTENANCE`. Shipped HUD name: `Этаж 69`.

Owned file: `src/gen/design_floors/floor_69.ts`. Existing reference: F69 sprite-bank notes are preserved in `../../appendix.md` and archived original files under `../../gatbage/Docs/Tasks/Status_UNASSIGNED.md` and `../../gatbage/Docs/AgentLogs/Rationale_UNASSIGNED.md`.

## Tone And Safety

This is an adult vice floor, not explicit sexual content. All named NPCs and implied workers are adults. No minors, no graphic sex, no pornographic quest text, no coercive fetishization. The playable layer is debt, consent boundaries, blackmail, refuge, performance, crime, protection, medicine, drugs, documents and raids.

Primary decisions: protect, expose, pay debt, steal evidence, hide someone, forge age/access papers, break a raid, escort an adult NPC out, refuse a corrupt job.

## Role

Floor 69 is a zлачный residential floor: rooms rented by the hour, illegal bars, cabaret corridors, private booths, clinic door, debt office, security checkpoint, quiet refuge rooms and back stairs. It should be seductive as access and danger, not as explicit prose.

## Generation

- Dense residential shell with neon-like procedural light marks, curtains, service corridors and locked rooms.
- Room types can reuse living, common, storage, smoking, medical and office.
- Keep corridors readable; avoid maze of tiny rooms.
- Include at least two exits: public lift and staff/service route.
- Use the F69 female NPC sprite bank for adult performers/workers where appropriate, but also include guards, accountants, medics, cleaners and customers.

## NPCs

- `f69_madam_roza`: owner/manager, debt and protection contracts.
- `f69_guard_venya`: bouncer, can be bribed, fought or exposed.
- `f69_performer_ira`: adult worker with blackmail/evidence quest.
- `f69_doctor_sima`: discreet clinic, medicine scarcity and harm reduction.
- `f69_accountant_nil`: debt ledger tied to Market 88 and Ministry.

## Quests

- `f69_blackmail_tape`: steal/destroy/sell evidence involving an official.
- `f69_hide_worker`: hide an adult NPC during raid or escort them to Living/Clinic.
- `f69_debt_ledger`: pay, forge or burn a debt line.
- `f69_clinic_supply`: bring medicine/filter; reward is treatment, trust or document.
- `f69_break_raid`: warn people, help inspectors or use the chaos to steal.

## Systems

Keep state compact:

```txt
f69.heat: 0..100
f69.trust: -5..5
f69.raidUntilHour
f69.debtFlags[]
f69.blackmailFlags[]
```

No explicit sex mechanics. Transactions are trade/quest/dialogue state.

## Samosbor

Samosbor turns vice into shelter economics. Some locked private rooms are safe, but access is controlled by debt/trust. Aftermath can create missing ledger pages, medical demand, blackmail leaks or Ministry raid pressure.

## Cross-Floor Hooks

- Market 88 buys/sells debt and protection.
- Ministry/Upper Bureau can be blackmailed or can raid the floor.
- Hospital/Registry Morgue receive medical and identity consequences.
- Manhattan Crossroads provides courier and raid approach routes.

## DoD

- At least one quest has protect/expose/profit outcomes.
- Adult-only constraints are explicit in code comments/docs where relevant.
- No explicit player-facing sexual descriptions.
- `f69_performer_ira` keeps a 20+ line adult worker voice about boundaries, debt, raids, clinic access and blackmail.
- Supporting rumors, notes and system contracts expose protect, hide, pay debt, medical supply and expose choices.
- Heat/trust/debt are visible in debug and bounded.
