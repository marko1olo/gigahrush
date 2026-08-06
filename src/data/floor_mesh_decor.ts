/* ── Per-floor mesh decor policy ──────────────────────────────────
 * Single source of truth for "what does this floor's mesh geometry look like".
 * Both sides resolve from here, keyed by theme tags:
 *   - generation: gen/visual_cell_slots.ts places visual slots (columns, wall
 *     fixtures, ceiling details) at floor build time — it owns placement, with
 *     room awareness, density caps and per-route overrides;
 *   - render: the mesh pass (render/mesh/*) draws those slots, picks the
 *     ceiling-run models and the voxel style. It does not invent geometry the
 *     floor did not ask for.
 *
 * They used to disagree. Generation picked models from a tag table while the
 * mesh pass re-guessed the floor from substrings of `floorKey`
 * (`includes('maintenance')` → round column, everything else → square), and the
 * two guesses were not even consistent with each other inside one file: the
 * column picker knew only 'maintenance' while the ceiling picker sixty lines
 * later also knew 'industrial'. So a hell floor grew bone columns from
 * generation and concrete square ones from the renderer in the same room, and
 * industrial/cave floors disagreed the same way.
 *
 * Adding a floor class: append a row. Rows are matched in order, first hit wins,
 * so put specific classes above general ones.
 */

/**
 * What a full-height column does in a cell that has no ceiling plane to reach
 * (open-sky roof lid, street canyon). `freestanding` keeps it at its authored
 * height, which reads as a waist-high stub unless the floor actually wants
 * pedestals; `drop` removes it.
 */
export type FloorColumnWithoutCeiling = 'drop' | 'freestanding';

/** Voxel silhouette style for the chunked mesh pass. */
export type FloorVoxelStyle = 'concrete' | 'maintenance' | 'hell' | 'void';

export interface FloorMeshDecor {
  /** Wall-mounted fixture models this floor may place. */
  wallIds: readonly string[];
  /** Ceiling-mounted detail models this floor may place. */
  ceilingIds: readonly string[];
  /** Column model this floor uses when generation places a column. */
  columnId: string;
  columnWithoutCeiling: FloorColumnWithoutCeiling;
  /** Ceiling runs are pipe/cable bundles rather than a plain structural beam. */
  serviceCeiling: boolean;
  voxelStyle: FloorVoxelStyle;
}

interface FloorMeshDecorRow {
  tags: readonly string[];
  decor: FloorMeshDecor;
}

const FLOOR_MESH_DECOR_ROWS: readonly FloorMeshDecorRow[] = [
  // Industrial / maintenance / collectors
  {
    tags: ['maintenance', 'collectors', 'industrial', 'pump', 'repair'],
    decor: {
      wallIds: ['pipe_wall_large', 'cable_wall_loose', 'pipe_wall_small', 'pipe_wall_small'],
      ceilingIds: ['ceiling_pipe_bundle', 'ceiling_cable_bundle'],
      columnId: 'column_concrete_round',
      columnWithoutCeiling: 'drop',
      serviceCeiling: true,
      voxelStyle: 'maintenance',
    },
  },
  // Ministry / bureaucratic
  {
    tags: ['ministry', 'bureaucratic', 'paper', 'office'],
    decor: {
      wallIds: ['button_panel', 'wall_panel_flat', 'cable_wall_loose', 'wall_panel_flat'],
      ceilingIds: ['ceiling_light_panel'],
      columnId: 'column_concrete_square',
      columnWithoutCeiling: 'drop',
      serviceCeiling: false,
      voxelStyle: 'concrete',
    },
  },
  // Residential / kvartiry / living
  {
    tags: ['residential', 'kvartiry', 'living', 'public', 'hub'],
    decor: {
      wallIds: ['button_panel', 'wall_panel_flat', 'cable_wall_loose', 'wall_panel_flat'],
      ceilingIds: ['ceiling_light_panel'],
      columnId: 'column_concrete_square',
      columnWithoutCeiling: 'drop',
      serviceCeiling: false,
      voxelStyle: 'concrete',
    },
  },
  // Void / protocol / finale. 'dark' joins this class: the mesh pass already
  // treated it as void for voxel style, generation did not.
  {
    tags: ['void', 'protocol', 'finale', 'dark'],
    decor: {
      wallIds: ['wall_panel_screen', 'wall_panel_flat', 'wall_panel_flat', 'wall_panel_flat'],
      ceilingIds: ['ceiling_light_panel'],
      columnId: 'column_concrete_square',
      columnWithoutCeiling: 'drop',
      serviceCeiling: false,
      voxelStyle: 'void',
    },
  },
  // Hell / meat — organic horror
  {
    tags: ['hell', 'meat_low', 'gut', 'ritual', 'samosbor', 'meat', 'underhell', 'cult'],
    decor: {
      wallIds: ['organic_wall_ribs', 'organic_wall_veins', 'cable_wall_loose', 'organic_wall_veins'],
      ceilingIds: ['organic_ceiling_tendrils'],
      columnId: 'organic_column_bone',
      columnWithoutCeiling: 'drop',
      serviceCeiling: false,
      voxelStyle: 'hell',
    },
  },
  // Cave / mushroom / living tunnels
  {
    tags: ['cave', 'mushroom', 'living_tunnels'],
    decor: {
      wallIds: ['cave_wall_protrusion', 'organic_wall_veins', 'cable_wall_loose', 'cave_wall_protrusion'],
      ceilingIds: ['cave_stalactite', 'organic_ceiling_tendrils'],
      columnId: 'column_concrete_round',
      columnWithoutCeiling: 'drop',
      serviceCeiling: false,
      voxelStyle: 'concrete',
    },
  },
];

export const DEFAULT_FLOOR_MESH_DECOR: FloorMeshDecor = {
  wallIds: ['cable_wall_loose'],
  ceilingIds: ['ceiling_light_panel'],
  columnId: 'column_concrete_square',
  columnWithoutCeiling: 'drop',
  serviceCeiling: false,
  voxelStyle: 'concrete',
};

function hasAnyTag(tags: ReadonlySet<string>, values: readonly string[]): boolean {
  for (const value of values) {
    if (tags.has(value)) return true;
  }
  return false;
}

export function resolveFloorMeshDecor(tags: ReadonlySet<string>): FloorMeshDecor {
  for (const row of FLOOR_MESH_DECOR_ROWS) {
    if (hasAnyTag(tags, row.tags)) return row.decor;
  }
  return DEFAULT_FLOOR_MESH_DECOR;
}
