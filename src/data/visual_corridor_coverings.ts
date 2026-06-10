export type VisualCorridorVolumeStyle = 'concrete' | 'service' | 'organic' | 'void';

export type VisualCorridorCoveringId =
  | 'concrete'
  | 'residential'
  | 'ministry'
  | 'technical'
  | 'collector'
  | 'cave'
  | 'meat'
  | 'void';

export type FloorScatterPackage = 'collector' | 'linoleum' | 'organic';
export type WallReliefSet = 'concrete' | 'technical' | 'organic' | 'pipe';
export type WallBaseSet = 'none' | 'panels' | 'pipes' | 'cables' | 'technical' | 'organic';
export type CeilingSet = 'service' | 'organic';

export interface VisualCorridorCoveringDef {
  id: VisualCorridorCoveringId;
  style: VisualCorridorVolumeStyle;
  detailMul: number;
  organicMul: number;
  smoothness: number;

  floorScatter?: FloorScatterPackage;

  wallReliefSet?: WallReliefSet;
  wallReliefDensity: number;

  wallBaseSet?: WallBaseSet;
  wallBaseDensity: number;

  ceilingSet?: CeilingSet;
  ceilingDensity: number;

  floorGutterDensity: number;
  floorThresholdDensity: number;
  floorOrganicDensity: number;
}

export interface VisualCorridorCoveringRule {
  id: string;
  coveringId: VisualCorridorCoveringId;
  priority: number;
  floorKeys?: readonly string[];
  requiredTags?: readonly string[];
  blockedTags?: readonly string[];
}

export const VISUAL_CORRIDOR_COVERINGS: readonly VisualCorridorCoveringDef[] = [
  {
    id: 'concrete',
    style: 'concrete',
    detailMul: 1,
    organicMul: 0.25,
    smoothness: 0.22,
    wallReliefSet: 'concrete',
    wallReliefDensity: 0.46,
    wallBaseSet: 'none',
    wallBaseDensity: 0,
    ceilingDensity: 0,
    floorGutterDensity: 0,
    floorThresholdDensity: 0.24,
    floorOrganicDensity: 0,
  },
  {
    id: 'residential',
    style: 'concrete',
    detailMul: 1,
    organicMul: 0.15,
    smoothness: 0.28,
    floorScatter: 'linoleum',
    wallReliefSet: 'concrete',
    wallReliefDensity: 0.46,
    wallBaseSet: 'panels',
    wallBaseDensity: 0.26,
    ceilingDensity: 0,
    floorGutterDensity: 0,
    floorThresholdDensity: 0.24,
    floorOrganicDensity: 0,
  },
  {
    id: 'ministry',
    style: 'concrete',
    detailMul: 1,
    organicMul: 0.15,
    smoothness: 0.32,
    wallReliefSet: 'concrete',
    wallReliefDensity: 0.46,
    wallBaseSet: 'panels',
    wallBaseDensity: 0.22,
    ceilingDensity: 0,
    floorGutterDensity: 0,
    floorThresholdDensity: 0.24,
    floorOrganicDensity: 0,
  },
  {
    id: 'technical',
    style: 'service',
    detailMul: 1.18,
    organicMul: 0.12,
    smoothness: 0.16,
    wallReliefSet: 'technical',
    wallReliefDensity: 0.25,
    wallBaseSet: 'technical',
    wallBaseDensity: 0.33,
    ceilingSet: 'service',
    ceilingDensity: 0.45,
    floorGutterDensity: 0,
    floorThresholdDensity: 0.16,
    floorOrganicDensity: 0,
  },
  {
    id: 'collector',
    style: 'service',
    detailMul: 1.42,
    organicMul: 0.08,
    smoothness: 0.12,
    floorScatter: 'collector',
    wallReliefSet: 'pipe',
    wallReliefDensity: 0,
    wallBaseSet: 'pipes',
    wallBaseDensity: 0.44,
    ceilingSet: 'service',
    ceilingDensity: 0.54,
    floorGutterDensity: 0.34,
    floorThresholdDensity: 0.1,
    floorOrganicDensity: 0,
  },
  {
    id: 'cave',
    style: 'organic',
    detailMul: 1.22,
    organicMul: 1.1,
    smoothness: 0.38,
    floorScatter: 'organic',
    wallReliefSet: 'organic',
    wallReliefDensity: 0,
    wallBaseSet: 'organic',
    wallBaseDensity: 0.52,
    ceilingSet: 'organic',
    ceilingDensity: 0.4,
    floorGutterDensity: 0,
    floorThresholdDensity: 0.08,
    floorOrganicDensity: 0.52,
  },
  {
    id: 'meat',
    style: 'organic',
    detailMul: 1.24,
    organicMul: 2,
    smoothness: 0.78,
    floorScatter: 'organic',
    wallReliefSet: 'organic',
    wallReliefDensity: 0,
    wallBaseSet: 'organic',
    wallBaseDensity: 1.02,
    ceilingSet: 'organic',
    ceilingDensity: 0.18,
    floorGutterDensity: 0,
    floorThresholdDensity: 0.05,
    floorOrganicDensity: 1.02,
  },
  {
    id: 'void',
    style: 'void',
    detailMul: 0.65,
    organicMul: 0.18,
    smoothness: 0.52,
    wallReliefSet: 'concrete',
    wallReliefDensity: 0.38,
    wallBaseSet: 'panels',
    wallBaseDensity: 0.12,
    ceilingSet: 'service',
    ceilingDensity: 0.22,
    floorGutterDensity: 0,
    floorThresholdDensity: 0.1,
    floorOrganicDensity: 0.18,
  },
] as const;

export const VISUAL_CORRIDOR_COVERING_RULES: readonly VisualCorridorCoveringRule[] = [
  { id: 'story_void', coveringId: 'void', priority: 100, requiredTags: ['void'] },
  { id: 'finale_void', coveringId: 'void', priority: 98, requiredTags: ['finale'] },
  { id: 'story_meat', coveringId: 'meat', priority: 92, requiredTags: ['meat'] },
  { id: 'samosbor_meat', coveringId: 'meat', priority: 90, requiredTags: ['samosbor'] },
  { id: 'hell_meat', coveringId: 'meat', priority: 88, requiredTags: ['hell'] },
  { id: 'living_tunnel_cave', coveringId: 'cave', priority: 86, requiredTags: ['living_tunnels'] },
  { id: 'mycelium_cave', coveringId: 'cave', priority: 78, requiredTags: ['mushroom'] },
  { id: 'collector_geometry', coveringId: 'collector', priority: 74, requiredTags: ['collectors'] },
  { id: 'sump_collector', coveringId: 'collector', priority: 72, requiredTags: ['sump'] },
  { id: 'blackwater_collector', coveringId: 'collector', priority: 70, requiredTags: ['blackwater'] },
  { id: 'service_spines_technical', coveringId: 'technical', priority: 66, requiredTags: ['service'] },
  { id: 'power_technical', coveringId: 'technical', priority: 64, requiredTags: ['power'] },
  { id: 'workshop_technical', coveringId: 'technical', priority: 62, requiredTags: ['workshop'] },
  { id: 'industrial_technical', coveringId: 'technical', priority: 58, requiredTags: ['industrial'], blockedTags: ['collectors', 'sump', 'blackwater'] },
  { id: 'residential', coveringId: 'residential', priority: 50, requiredTags: ['residential'] },
  { id: 'ministry', coveringId: 'ministry', priority: 48, requiredTags: ['ministry'] },
] as const;

const VISUAL_CORRIDOR_COVERING_BY_ID = new Map<VisualCorridorCoveringId, VisualCorridorCoveringDef>(
  VISUAL_CORRIDOR_COVERINGS.map(def => [def.id, def]),
);

function hasAllTags(tags: ReadonlySet<string>, required: readonly string[] | undefined): boolean {
  if (!required || required.length <= 0) return true;
  for (const tag of required) {
    if (!tags.has(tag)) return false;
  }
  return true;
}

function hasBlockedTag(tags: ReadonlySet<string>, blocked: readonly string[] | undefined): boolean {
  if (!blocked || blocked.length <= 0) return false;
  for (const tag of blocked) {
    if (tags.has(tag)) return true;
  }
  return false;
}

export function visualCorridorCoveringById(id: VisualCorridorCoveringId | string | undefined): VisualCorridorCoveringDef {
  return VISUAL_CORRIDOR_COVERING_BY_ID.get((id ?? 'concrete') as VisualCorridorCoveringId) ?? VISUAL_CORRIDOR_COVERING_BY_ID.get('concrete')!;
}

export function selectVisualCorridorCovering(
  floorKey: string,
  tagsInput: readonly string[],
): { def: VisualCorridorCoveringDef; ruleId: string } {
  const tags = new Set(tagsInput);
  let best: VisualCorridorCoveringRule | undefined;
  for (const rule of VISUAL_CORRIDOR_COVERING_RULES) {
    if (rule.floorKeys && !rule.floorKeys.includes(floorKey)) continue;
    if (!hasAllTags(tags, rule.requiredTags) || hasBlockedTag(tags, rule.blockedTags)) continue;
    if (!best || rule.priority > best.priority) best = rule;
  }
  const coveringId = best?.coveringId ?? 'concrete';
  return { def: visualCorridorCoveringById(coveringId), ruleId: best?.id ?? 'default_concrete' };
}
