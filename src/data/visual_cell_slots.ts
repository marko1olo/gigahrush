export type VisualCellCode = number;
export type VisualModelId = string;

export type VisualCellFamily =
  | 'pipe'
  | 'button'
  | 'cable'
  | 'panel'
  | 'column'
  | 'furniture'
  | 'ceiling'
  | 'lamp'
  | 'machine'
  | 'organic'
  | 'clutter';

export type VisualCellAnchor = 'floor' | 'wall' | 'ceiling' | 'corner' | 'contextual';
export type VisualCellMount = 'floor' | 'ceiling' | 'wallFace' | 'cellCenter' | 'corner' | 'volume';
export type VisualCellZBand = 'floor' | 'lowWall' | 'midWall' | 'highWall' | 'ceiling' | 'fullHeight';
export type VisualCellSource = 'any' | 'wallCell' | 'floorCell' | 'adjacentWallCell';
export type VisualCellFacePolicy = 'bestExposed' | 'allExposedCapped' | 'runAxis' | 'cornerPair';
export type VisualCellMerge = 'none' | 'line4' | 'wallLine' | 'cluster';

export interface VisualCellDef {
  code: VisualCellCode;
  id: string;
  family: VisualCellFamily;
  anchor: VisualCellAnchor;
  mount: VisualCellMount;
  zBand?: VisualCellZBand;
  source: VisualCellSource;
  facePolicy?: VisualCellFacePolicy;
  modelId?: VisualModelId;
  merge: VisualCellMerge;
  priority: number;
  densityCost: number;
  /**
   * Structural role: this is a column — a floor-anchored volume that must reach
   * the ceiling and that occupies its cell against other columns.
   *
   * It is deliberately separate from `family`, which is a *material* axis used
   * for voxel classification and merge compatibility. Overloading `family` with
   * structural role is what broke columns: `organic_column_bone` is materially
   * organic, so it could not sit in `family: 'column'` without losing its voxel
   * representation — and as a result it was absent from every hardcoded column
   * list in the renderer, never stretched to the ceiling, and never blocked a
   * second column from being placed in its own cell.
   *
   * `zBand: 'fullHeight'` cannot substitute either: machine bodies, apparatus
   * frames and wall veins also declare it without being columns.
   */
  column?: boolean;
}

export const VISUAL_CELL_DEFS = [
  {
    code: 1,
    id: 'pipe_wall_small',
    family: 'pipe',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'lowWall',
    source: 'wallCell',
    facePolicy: 'runAxis',
    modelId: 'pipe_wall_small',
    merge: 'wallLine',
    priority: 80,
    densityCost: 2,
  },
  {
    code: 2,
    id: 'pipe_wall_large',
    family: 'pipe',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'midWall',
    source: 'wallCell',
    facePolicy: 'runAxis',
    modelId: 'pipe_wall_large',
    merge: 'wallLine',
    priority: 88,
    densityCost: 3,
  },
  {
    code: 3,
    id: 'button_panel',
    family: 'button',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'midWall',
    source: 'adjacentWallCell',
    facePolicy: 'bestExposed',
    modelId: 'button_panel',
    merge: 'none',
    priority: 96,
    densityCost: 1,
  },
  {
    code: 4,
    id: 'cable_wall_loose',
    family: 'cable',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'highWall',
    source: 'wallCell',
    facePolicy: 'runAxis',
    modelId: 'cable_wall_loose',
    merge: 'wallLine',
    priority: 70,
    densityCost: 1,
  },
  {
    code: 5,
    id: 'ceiling_cable',
    family: 'cable',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    facePolicy: 'runAxis',
    modelId: 'ceiling_cable',
    merge: 'line4',
    priority: 64,
    densityCost: 1,
  },
  {
    code: 6,
    id: 'wall_panel_flat',
    family: 'panel',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'midWall',
    source: 'wallCell',
    facePolicy: 'bestExposed',
    modelId: 'wall_panel_flat',
    merge: 'cluster',
    priority: 72,
    densityCost: 2,
  },
  {
    code: 7,
    id: 'wall_panel_screen',
    family: 'panel',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'midWall',
    source: 'wallCell',
    facePolicy: 'bestExposed',
    modelId: 'wall_panel_screen',
    merge: 'none',
    priority: 92,
    densityCost: 2,
  },
  {
    code: 8,
    id: 'ceiling_beam',
    family: 'ceiling',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    facePolicy: 'runAxis',
    modelId: 'ceiling_beam',
    merge: 'line4',
    priority: 74,
    densityCost: 3,
  },
  {
    code: 9,
    id: 'ceiling_bulb',
    family: 'lamp',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    modelId: 'ceiling_bulb',
    merge: 'none',
    priority: 94,
    densityCost: 1,
  },
  {
    code: 10,
    id: 'column_hint',
    family: 'column',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'fullHeight',
    source: 'floorCell',
    modelId: 'column_hint',
    merge: 'cluster',
    priority: 84,
    densityCost: 4,
    column: true,
  },
  {
    code: 11,
    id: 'furniture_table_hint',
    family: 'furniture',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'furniture_table_hint',
    merge: 'none',
    priority: 78,
    densityCost: 3,
  },
  {
    code: 12,
    id: 'furniture_desk_hint',
    family: 'furniture',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'desk_slab',
    merge: 'none',
    priority: 79,
    densityCost: 3,
  },
  {
    code: 13,
    id: 'furniture_chair_hint',
    family: 'furniture',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'chair_simple',
    merge: 'none',
    priority: 72,
    densityCost: 2,
  },
  {
    code: 14,
    id: 'furniture_bed_hint',
    family: 'furniture',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'bed_frame',
    merge: 'none',
    priority: 80,
    densityCost: 4,
  },
  {
    code: 15,
    id: 'furniture_shelf_hint',
    family: 'furniture',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'lowWall',
    source: 'adjacentWallCell',
    facePolicy: 'bestExposed',
    modelId: 'furniture_shelf_hint',
    merge: 'none',
    priority: 76,
    densityCost: 2,
  },
  {
    code: 16,
    id: 'machine_body',
    family: 'machine',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'fullHeight',
    source: 'floorCell',
    modelId: 'machine_box',
    merge: 'none',
    priority: 92,
    densityCost: 4,
  },
  {
    code: 17,
    id: 'machine_panel',
    family: 'machine',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'midWall',
    source: 'adjacentWallCell',
    facePolicy: 'bestExposed',
    modelId: 'machine_panel',
    merge: 'none',
    priority: 94,
    densityCost: 2,
  },
  {
    code: 18,
    id: 'apparatus_frame',
    family: 'machine',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'fullHeight',
    source: 'floorCell',
    modelId: 'apparatus_frame',
    merge: 'cluster',
    priority: 86,
    densityCost: 4,
  },
  {
    code: 19,
    id: 'candle_stub_hint',
    family: 'lamp',
    anchor: 'floor',
    mount: 'floor',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'candle_stub',
    merge: 'none',
    priority: 88,
    densityCost: 1,
  },
  {
    code: 20,
    id: 'ceiling_pipe_bundle',
    family: 'ceiling',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    facePolicy: 'runAxis',
    modelId: 'ceiling_pipe_bundle',
    merge: 'line4',
    priority: 78,
    densityCost: 3,
  },
  {
    code: 21,
    id: 'ceiling_cable_bundle',
    family: 'ceiling',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    facePolicy: 'runAxis',
    modelId: 'ceiling_cable_bundle',
    merge: 'line4',
    priority: 76,
    densityCost: 2,
  },
  {
    code: 22,
    id: 'column_concrete_square',
    family: 'column',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'fullHeight',
    source: 'floorCell',
    modelId: 'column_concrete_square',
    merge: 'none',
    priority: 90,
    densityCost: 4,
    column: true,
  },
  {
    code: 23,
    id: 'rubble_chunk',
    family: 'clutter',
    anchor: 'floor',
    mount: 'floor',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'rubble_chunk',
    merge: 'none',
    priority: 42,
    densityCost: 1,
  },
  {
    code: 24,
    id: 'organic_thread',
    family: 'organic',
    anchor: 'contextual',
    mount: 'volume',
    zBand: 'fullHeight',
    source: 'any',
    facePolicy: 'runAxis',
    modelId: 'organic_thread',
    merge: 'cluster',
    priority: 68,
    densityCost: 2,
  },
  {
    code: 25,
    id: 'ceiling_light_panel',
    family: 'lamp',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    modelId: 'ceiling_light_panel',
    merge: 'none',
    priority: 93,
    densityCost: 1,
  },
  {
    code: 26,
    id: 'lamp_stand_hint',
    family: 'lamp',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'lamp_stand',
    merge: 'none',
    priority: 87,
    densityCost: 2,
  },
  {
    code: 27,
    id: 'organic_wall_veins',
    family: 'organic',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'fullHeight',
    source: 'wallCell',
    facePolicy: 'runAxis',
    modelId: 'organic_wall_veins',
    merge: 'wallLine',
    priority: 76,
    densityCost: 2,
  },
  {
    code: 28,
    id: 'organic_wall_ribs',
    family: 'organic',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'fullHeight',
    source: 'wallCell',
    facePolicy: 'bestExposed',
    modelId: 'organic_wall_ribs',
    merge: 'cluster',
    priority: 78,
    densityCost: 3,
  },
  {
    code: 29,
    id: 'organic_ceiling_tendrils',
    family: 'organic',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    facePolicy: 'runAxis',
    modelId: 'organic_ceiling_tendrils',
    merge: 'line4',
    priority: 72,
    densityCost: 2,
  },
  {
    code: 30,
    id: 'organic_column_bone',
    family: 'organic',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'fullHeight',
    source: 'floorCell',
    modelId: 'organic_column_bone',
    merge: 'none',
    priority: 90,
    densityCost: 4,
    column: true,
  },
  {
    code: 31,
    id: 'column_concrete_round',
    family: 'column',
    anchor: 'floor',
    mount: 'volume',
    zBand: 'fullHeight',
    source: 'floorCell',
    modelId: 'column_concrete_round',
    merge: 'none',
    priority: 90,
    densityCost: 4,
    column: true,
  },
  {
    code: 32,
    id: 'cave_stalactite',
    family: 'organic',
    anchor: 'ceiling',
    mount: 'ceiling',
    zBand: 'ceiling',
    source: 'floorCell',
    modelId: 'cave_stalactite',
    merge: 'none',
    priority: 74,
    densityCost: 2,
  },
  {
    code: 33,
    id: 'cave_wall_protrusion',
    family: 'organic',
    anchor: 'wall',
    mount: 'wallFace',
    zBand: 'lowWall',
    source: 'wallCell',
    facePolicy: 'bestExposed',
    modelId: 'cave_wall_protrusion',
    merge: 'cluster',
    priority: 70,
    densityCost: 2,
  },
  {
    code: 34,
    id: 'corpse_meat_chunk',
    family: 'clutter',
    anchor: 'floor',
    mount: 'floor',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'organic_meat_lump',
    merge: 'none',
    priority: 45,
    densityCost: 1,
  },
  {
    code: 35,
    id: 'corpse_bone_chunk',
    family: 'clutter',
    anchor: 'floor',
    mount: 'floor',
    zBand: 'floor',
    source: 'floorCell',
    modelId: 'organic_rib_cage',
    merge: 'none',
    priority: 45,
    densityCost: 1,
  },
] as const satisfies readonly VisualCellDef[];

function buildVisualCellDefMap<K extends 'id' | 'code'>(
  key: K,
): ReadonlyMap<VisualCellDef[K], VisualCellDef> {
  const out = new Map<VisualCellDef[K], VisualCellDef>();
  for (const def of VISUAL_CELL_DEFS) {
    if (def.code <= 0 || def.code > 255) throw new Error(`invalid visual cell code: ${def.id}`);
    const value = def[key];
    if (out.has(value)) throw new Error(`duplicate visual cell ${key}: ${String(value)}`);
    out.set(value, def);
  }
  return out;
}

export const VISUAL_CELL_DEF_BY_ID = buildVisualCellDefMap('id');
export const VISUAL_CELL_DEF_BY_CODE = buildVisualCellDefMap('code');

// Every column model, derived from the defs above. The renderer used to carry a
// hand-written list of three model ids for "stretch to the ceiling" which did
// not contain `organic_column_bone` — so bone columns never reached the ceiling
// and stood as stubs on hell floors. Deriving it from `def.column` means a new
// column model joins the rule by declaring one field.
export const VISUAL_CELL_COLUMN_MODEL_IDS: ReadonlySet<VisualModelId> = new Set(
  VISUAL_CELL_DEFS.filter(def => def.column === true).flatMap(def => {
    if (def.modelId === undefined) return [];
    return Array.isArray(def.modelId) ? [...def.modelId] : [def.modelId as VisualModelId];
  }),
);

export function visualCellDefById(id: string): VisualCellDef | undefined {
  return VISUAL_CELL_DEF_BY_ID.get(id);
}

export function visualCellDefByCode(code: VisualCellCode): VisualCellDef | undefined {
  return VISUAL_CELL_DEF_BY_CODE.get(code);
}
