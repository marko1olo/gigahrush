import { W, EntityType, type Entity } from '../core/types';

export const ENTITY_MASK_PLAYER = 1 << EntityType.PLAYER;
export const ENTITY_MASK_NPC = 1 << EntityType.NPC;
export const ENTITY_MASK_MONSTER = 1 << EntityType.MONSTER;
export const ENTITY_MASK_ITEM_DROP = 1 << EntityType.ITEM_DROP;
export const ENTITY_MASK_PROJECTILE = 1 << EntityType.PROJECTILE;
export const ENTITY_MASK_ACTOR = ENTITY_MASK_PLAYER | ENTITY_MASK_NPC | ENTITY_MASK_MONSTER;
export const ENTITY_MASK_VISIBLE = ENTITY_MASK_ACTOR | ENTITY_MASK_ITEM_DROP | ENTITY_MASK_PROJECTILE;

const BUCKET_SIZE = 16;
const BUCKET_SHIFT = 4;
const BUCKETS_PER_AXIS = W >> BUCKET_SHIFT;
const BUCKET_COUNT = BUCKETS_PER_AXIS * BUCKETS_PER_AXIS;
const BUCKET_MASK = BUCKETS_PER_AXIS - 1;
const PATH_BUCKET_STEP = BUCKET_SIZE * 0.5;

export type EntityIndexRebuildReason =
  | 'manual'
  | 'load'
  | 'simulation'
  | 'spawn_cleanup'
  | 'smoke_stress'
  | 'marketing_hell_eyes'
  | 'ensure';

export interface EntityIndexBucketStats {
  bucketCount: number;
  usedBucketCount: number;
  maxBucketSize: number;
  meanUsedBucketSize: number;
}

export interface EntityIndexQueryStats {
  radiusCount: number;
  pathCount: number;
  bucketChecks: number;
  resultCount: number;
  maxResultCount: number;
  visibleCount: number;
  visibleResultCount: number;
  lastVisibleResultCount: number;
}

export interface EntityIndexDebugStats {
  version: number;
  rebuildReason: EntityIndexRebuildReason;
  simulationFrame: number;
  entityCount: number;
  liveEntityCount: number;
  actorCount: number;
  aiCount: number;
  needsCount: number;
  projectileCount: number;
  npcCount: number;
  monsterCount: number;
  itemCount: number;
  rebuildMs: number;
  buckets: EntityIndexBucketStats;
  queries: EntityIndexQueryStats;
}

function entityMask(e: Entity): number {
  return 1 << e.type;
}

function nowMs(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function emptyDebugStats(): EntityIndexDebugStats {
  return {
    version: 0,
    rebuildReason: 'manual',
    simulationFrame: -1,
    entityCount: 0,
    liveEntityCount: 0,
    actorCount: 0,
    aiCount: 0,
    needsCount: 0,
    projectileCount: 0,
    npcCount: 0,
    monsterCount: 0,
    itemCount: 0,
    rebuildMs: 0,
    buckets: {
      bucketCount: BUCKET_COUNT,
      usedBucketCount: 0,
      maxBucketSize: 0,
      meanUsedBucketSize: 0,
    },
    queries: {
      radiusCount: 0,
      pathCount: 0,
      bucketChecks: 0,
      resultCount: 0,
      maxResultCount: 0,
      visibleCount: 0,
      visibleResultCount: 0,
      lastVisibleResultCount: 0,
    },
  };
}

function wrappedDelta(from: number, to: number): number {
  return ((to - from + W / 2) % W + W) % W - W / 2;
}

function wrappedBucketCoord(v: number): number {
  return (Math.floor(v) & (W - 1)) >> BUCKET_SHIFT;
}

export class EntityIndex {
  private readonly buckets: Entity[][];
  private readonly bucketVisits = new Uint32Array(BUCKET_COUNT);
  private bucketVisitId = 1;
  readonly byId = new Map<number, Entity>();
  readonly ai: Entity[] = [];
  readonly actors: Entity[] = [];
  readonly needs: Entity[] = [];
  readonly projectiles: Entity[] = [];
  private builtFor: readonly Entity[] | null = null;
  private builtEntityCount = -1;
  private dirty = true;
  private version = 0;
  private simulationFrame = -1;
  private debugStats = emptyDebugStats();

  constructor() {
    this.buckets = Array.from({ length: BUCKET_COUNT }, () => []);
  }

  beginTelemetryFrame(): void {
    const q = this.debugStats.queries;
    q.radiusCount = 0;
    q.pathCount = 0;
    q.bucketChecks = 0;
    q.resultCount = 0;
    q.maxResultCount = 0;
    q.visibleCount = 0;
    q.visibleResultCount = 0;
    q.lastVisibleResultCount = 0;
  }

  rebuild(
    entities: readonly Entity[],
    rebuildReason: EntityIndexRebuildReason = 'manual',
    simulationFrame = -1,
  ): void {
    const startedAt = nowMs();
    for (let i = 0; i < BUCKET_COUNT; i++) this.buckets[i].length = 0;
    this.byId.clear();
    this.ai.length = 0;
    this.actors.length = 0;
    this.needs.length = 0;
    this.projectiles.length = 0;

    let liveEntityCount = 0;
    let usedBucketCount = 0;
    let maxBucketSize = 0;
    let npcCount = 0;
    let monsterCount = 0;
    let itemCount = 0;

    for (const e of entities) {
      if (!e.alive) continue;
      liveEntityCount++;
      this.byId.set(e.id, e);
      if (e.type === EntityType.PLAYER || e.type === EntityType.NPC || e.type === EntityType.MONSTER) this.actors.push(e);
      if (e.type === EntityType.NPC) npcCount++;
      else if (e.type === EntityType.MONSTER) monsterCount++;
      else if (e.type === EntityType.ITEM_DROP) itemCount++;
      if (e.needs) this.needs.push(e);
      if (e.ai && (e.type === EntityType.NPC || e.type === EntityType.MONSTER)) this.ai.push(e);
      if (e.type === EntityType.PROJECTILE) this.projectiles.push(e);
      const bx = wrappedBucketCoord(e.x);
      const by = wrappedBucketCoord(e.y);
      const bucket = this.buckets[by * BUCKETS_PER_AXIS + bx];
      if (bucket.length === 0) usedBucketCount++;
      bucket.push(e);
      if (bucket.length > maxBucketSize) maxBucketSize = bucket.length;
    }

    this.builtFor = entities;
    this.builtEntityCount = entities.length;
    this.dirty = false;
    this.version++;
    this.simulationFrame = simulationFrame;
    this.debugStats = {
      version: this.version,
      rebuildReason,
      simulationFrame,
      entityCount: entities.length,
      liveEntityCount,
      actorCount: this.actors.length,
      aiCount: this.ai.length,
      needsCount: this.needs.length,
      projectileCount: this.projectiles.length,
      npcCount,
      monsterCount,
      itemCount,
      rebuildMs: nowMs() - startedAt,
      buckets: {
        bucketCount: BUCKET_COUNT,
        usedBucketCount,
        maxBucketSize,
        meanUsedBucketSize: usedBucketCount > 0 ? liveEntityCount / usedBucketCount : 0,
      },
      queries: this.debugStats.queries,
    };
  }

  rebuildForSimulation(entities: readonly Entity[], simulationFrame: number): void {
    if (this.isBuiltFor(entities) && this.simulationFrame === simulationFrame) return;
    this.rebuild(entities, 'simulation', simulationFrame);
  }

  isBuiltFor(entities: readonly Entity[]): boolean {
    return this.builtFor === entities && this.builtEntityCount === entities.length && !this.dirty;
  }

  markDirty(): void {
    this.dirty = true;
  }

  getVersion(): number {
    return this.version;
  }

  copyDebugStats(out: EntityIndexDebugStats): EntityIndexDebugStats {
    out.version = this.debugStats.version;
    out.rebuildReason = this.debugStats.rebuildReason;
    out.simulationFrame = this.debugStats.simulationFrame;
    out.entityCount = this.debugStats.entityCount;
    out.liveEntityCount = this.debugStats.liveEntityCount;
    out.actorCount = this.debugStats.actorCount;
    out.aiCount = this.debugStats.aiCount;
    out.needsCount = this.debugStats.needsCount;
    out.projectileCount = this.debugStats.projectileCount;
    out.npcCount = this.debugStats.npcCount;
    out.monsterCount = this.debugStats.monsterCount;
    out.itemCount = this.debugStats.itemCount;
    out.rebuildMs = this.debugStats.rebuildMs;
    out.buckets.bucketCount = this.debugStats.buckets.bucketCount;
    out.buckets.usedBucketCount = this.debugStats.buckets.usedBucketCount;
    out.buckets.maxBucketSize = this.debugStats.buckets.maxBucketSize;
    out.buckets.meanUsedBucketSize = this.debugStats.buckets.meanUsedBucketSize;
    out.queries.radiusCount = this.debugStats.queries.radiusCount;
    out.queries.pathCount = this.debugStats.queries.pathCount;
    out.queries.bucketChecks = this.debugStats.queries.bucketChecks;
    out.queries.resultCount = this.debugStats.queries.resultCount;
    out.queries.maxResultCount = this.debugStats.queries.maxResultCount;
    out.queries.visibleCount = this.debugStats.queries.visibleCount;
    out.queries.visibleResultCount = this.debugStats.queries.visibleResultCount;
    out.queries.lastVisibleResultCount = this.debugStats.queries.lastVisibleResultCount;
    return out;
  }

  getDebugStats(): EntityIndexDebugStats {
    return this.copyDebugStats(emptyDebugStats());
  }

  queryRadius(
    x: number,
    y: number,
    radius: number,
    out: Entity[],
    typeMask = ENTITY_MASK_VISIBLE,
  ): number {
    out.length = 0;
    const bx = wrappedBucketCoord(x);
    const by = wrappedBucketCoord(y);
    const span = Math.ceil(radius / BUCKET_SIZE);
    const r2 = radius * radius;
    let bucketChecks = 0;

    for (let oy = -span; oy <= span; oy++) {
      const yy = (by + oy + BUCKETS_PER_AXIS) & BUCKET_MASK;
      for (let ox = -span; ox <= span; ox++) {
        const xx = (bx + ox + BUCKETS_PER_AXIS) & BUCKET_MASK;
        const bucket = this.buckets[yy * BUCKETS_PER_AXIS + xx];
        bucketChecks++;
        for (const e of bucket) {
          if ((entityMask(e) & typeMask) === 0) continue;
          const dx = wrappedDelta(x, e.x);
          const dy = wrappedDelta(y, e.y);
          if (dx * dx + dy * dy <= r2) out.push(e);
        }
      }
    }

    this.recordQuery(typeMask, bucketChecks, out.length, false);
    return out.length;
  }

  queryRadiusCapped(
    x: number,
    y: number,
    radius: number,
    out: Entity[],
    typeMask = ENTITY_MASK_VISIBLE,
    maxResults = Infinity,
  ): number {
    out.length = 0;
    if (maxResults <= 0) return 0;
    const bx = wrappedBucketCoord(x);
    const by = wrappedBucketCoord(y);
    const span = Math.ceil(radius / BUCKET_SIZE);
    const r2 = radius * radius;
    let bucketChecks = 0;

    for (let ring = 0; ring <= span; ring++) {
      for (let oy = -ring; oy <= ring; oy++) {
        for (let ox = -ring; ox <= ring; ox++) {
          if (ring > 0 && Math.max(Math.abs(ox), Math.abs(oy)) !== ring) continue;
          const yy = (by + oy + BUCKETS_PER_AXIS) & BUCKET_MASK;
          const xx = (bx + ox + BUCKETS_PER_AXIS) & BUCKET_MASK;
          const bucket = this.buckets[yy * BUCKETS_PER_AXIS + xx];
          bucketChecks++;
          for (const e of bucket) {
            if ((entityMask(e) & typeMask) === 0) continue;
            const dx = wrappedDelta(x, e.x);
            const dy = wrappedDelta(y, e.y);
            if (dx * dx + dy * dy > r2) continue;
            out.push(e);
            if (out.length >= maxResults) {
              this.recordQuery(typeMask, bucketChecks, out.length, false);
              return out.length;
            }
          }
        }
      }
    }

    this.recordQuery(typeMask, bucketChecks, out.length, false);
    return out.length;
  }

  queryPathRadius(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    radius: number,
    out: Entity[],
    typeMask = ENTITY_MASK_VISIBLE,
  ): number {
    out.length = 0;
    if (radius < 0) return 0;

    const dx = wrappedDelta(x0, x1);
    const dy = wrappedDelta(y0, y1);
    const len2 = dx * dx + dy * dy;
    if (len2 <= 0.000001) return this.queryRadius(x0, y0, radius, out, typeMask);

    const len = Math.sqrt(len2);
    const steps = Math.max(1, Math.ceil(len / PATH_BUCKET_STEP));
    const span = Math.ceil(radius / BUCKET_SIZE);
    const r2 = radius * radius;
    const visitId = this.nextBucketVisitId();
    let bucketChecks = 0;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bx = wrappedBucketCoord(x0 + dx * t);
      const by = wrappedBucketCoord(y0 + dy * t);
      for (let oy = -span; oy <= span; oy++) {
        const yy = (by + oy + BUCKETS_PER_AXIS) & BUCKET_MASK;
        for (let ox = -span; ox <= span; ox++) {
          const xx = (bx + ox + BUCKETS_PER_AXIS) & BUCKET_MASK;
          const bucketIndex = yy * BUCKETS_PER_AXIS + xx;
          if (this.bucketVisits[bucketIndex] === visitId) continue;
          this.bucketVisits[bucketIndex] = visitId;
          bucketChecks++;
          const bucket = this.buckets[bucketIndex];
          for (const e of bucket) {
            if ((entityMask(e) & typeMask) === 0) continue;
            const ex = wrappedDelta(x0, e.x);
            const ey = wrappedDelta(y0, e.y);
            let hitT = (ex * dx + ey * dy) / len2;
            if (hitT < 0) hitT = 0;
            else if (hitT > 1) hitT = 1;
            const px = ex - dx * hitT;
            const py = ey - dy * hitT;
            if (px * px + py * py <= r2) out.push(e);
          }
        }
      }
    }

    this.recordQuery(typeMask, bucketChecks, out.length, true);
    return out.length;
  }

  private recordQuery(typeMask: number, bucketChecks: number, resultCount: number, pathQuery: boolean): void {
    const q = this.debugStats.queries;
    if (pathQuery) q.pathCount++;
    else q.radiusCount++;
    q.bucketChecks += bucketChecks;
    q.resultCount += resultCount;
    if (resultCount > q.maxResultCount) q.maxResultCount = resultCount;
    if (typeMask === ENTITY_MASK_VISIBLE) {
      q.visibleCount++;
      q.visibleResultCount += resultCount;
      q.lastVisibleResultCount = resultCount;
    }
  }

  private nextBucketVisitId(): number {
    const id = this.bucketVisitId;
    this.bucketVisitId++;
    if (this.bucketVisitId > 0xffff_ffff) {
      this.bucketVisits.fill(0);
      this.bucketVisitId = 1;
    }
    return id;
  }
}

const runtimeEntityIndex = new EntityIndex();

export function rebuildEntityIndex(
  entities: readonly Entity[],
  rebuildReason: EntityIndexRebuildReason = 'manual',
): EntityIndex {
  runtimeEntityIndex.rebuild(entities, rebuildReason);
  return runtimeEntityIndex;
}

export function rebuildEntityIndexForSimulation(entities: readonly Entity[], simulationFrame: number): EntityIndex {
  runtimeEntityIndex.rebuildForSimulation(entities, simulationFrame);
  return runtimeEntityIndex;
}

export function rebuildEntityIndexAfterSpawnCleanup(entities: readonly Entity[]): EntityIndex {
  runtimeEntityIndex.rebuild(entities, 'spawn_cleanup');
  return runtimeEntityIndex;
}

export function markEntityIndexDirty(): void {
  runtimeEntityIndex.markDirty();
}

export function ensureEntityIndex(entities: readonly Entity[]): EntityIndex {
  // Runtime systems should normally read getEntityIndex(); this is only a load/test guard.
  if (!runtimeEntityIndex.isBuiltFor(entities)) runtimeEntityIndex.rebuild(entities, 'ensure');
  return runtimeEntityIndex;
}

export function getEntityIndex(): EntityIndex {
  return runtimeEntityIndex;
}
