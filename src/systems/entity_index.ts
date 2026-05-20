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

function entityMask(e: Entity): number {
  return 1 << e.type;
}

export class EntityIndex {
  private readonly buckets: Entity[][];
  readonly byId = new Map<number, Entity>();
  readonly ai: Entity[] = [];
  readonly actors: Entity[] = [];
  readonly needs: Entity[] = [];
  readonly projectiles: Entity[] = [];
  private builtFor: readonly Entity[] | null = null;
  private version = 0;

  constructor() {
    this.buckets = Array.from({ length: BUCKET_COUNT }, () => []);
  }

  rebuild(entities: readonly Entity[]): void {
    for (let i = 0; i < BUCKET_COUNT; i++) this.buckets[i].length = 0;
    this.byId.clear();
    this.ai.length = 0;
    this.actors.length = 0;
    this.needs.length = 0;
    this.projectiles.length = 0;

    for (const e of entities) {
      if (!e.alive) continue;
      this.byId.set(e.id, e);
      if (e.type === EntityType.PLAYER || e.type === EntityType.NPC || e.type === EntityType.MONSTER) this.actors.push(e);
      if (e.needs) this.needs.push(e);
      if (e.ai && (e.type === EntityType.NPC || e.type === EntityType.MONSTER)) this.ai.push(e);
      if (e.type === EntityType.PROJECTILE) this.projectiles.push(e);
      const bx = (Math.floor(e.x) & (W - 1)) >> BUCKET_SHIFT;
      const by = (Math.floor(e.y) & (W - 1)) >> BUCKET_SHIFT;
      this.buckets[by * BUCKETS_PER_AXIS + bx].push(e);
    }

    this.builtFor = entities;
    this.version++;
  }

  isBuiltFor(entities: readonly Entity[]): boolean {
    return this.builtFor === entities;
  }

  getVersion(): number {
    return this.version;
  }

  queryRadius(
    x: number,
    y: number,
    radius: number,
    out: Entity[],
    typeMask = ENTITY_MASK_VISIBLE,
  ): number {
    out.length = 0;
    const bx = (Math.floor(x) & (W - 1)) >> BUCKET_SHIFT;
    const by = (Math.floor(y) & (W - 1)) >> BUCKET_SHIFT;
    const span = Math.ceil(radius / BUCKET_SIZE);
    const r2 = radius * radius;

    for (let oy = -span; oy <= span; oy++) {
      const yy = (by + oy + BUCKETS_PER_AXIS) & (BUCKETS_PER_AXIS - 1);
      for (let ox = -span; ox <= span; ox++) {
        const xx = (bx + ox + BUCKETS_PER_AXIS) & (BUCKETS_PER_AXIS - 1);
        const bucket = this.buckets[yy * BUCKETS_PER_AXIS + xx];
        for (const e of bucket) {
          if ((entityMask(e) & typeMask) === 0) continue;
          const dx = ((e.x - x + W / 2) % W + W) % W - W / 2;
          const dy = ((e.y - y + W / 2) % W + W) % W - W / 2;
          if (dx * dx + dy * dy <= r2) out.push(e);
        }
      }
    }

    return out.length;
  }
}

const runtimeEntityIndex = new EntityIndex();

export function rebuildEntityIndex(entities: readonly Entity[]): EntityIndex {
  runtimeEntityIndex.rebuild(entities);
  return runtimeEntityIndex;
}

export function ensureEntityIndex(entities: readonly Entity[]): EntityIndex {
  if (!runtimeEntityIndex.isBuiltFor(entities)) runtimeEntityIndex.rebuild(entities);
  return runtimeEntityIndex;
}

export function getEntityIndex(): EntityIndex {
  return runtimeEntityIndex;
}
