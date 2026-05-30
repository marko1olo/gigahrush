# Procedural Geometry: `admin_pockets`

Type: existing `FloorGeometryId`.

Goal: make small Ministry fragments behave like office pockets with legal and staff routes.

Geometry plan:

- BSP office slabs.
- Queue stubs.
- Staff-only optional chords.
- Document/counter landmarks.

Gameplay decisions:

- Legal queue.
- Staff stealth.
- Document theft.
- Bribe checkpoint.

Implementation constraints:

- No one locked staff door owns progression.
- Use Ministry/document tags already in profile.

Validation:

- Forced spec with `geometryId: 'admin_pockets'`.
- Legal and staff paths measured separately.
