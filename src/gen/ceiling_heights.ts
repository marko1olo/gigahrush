import type { World } from '../core/world';
import { type Room, RoomType } from '../core/types';

/**
 * Render-only per-cell ceiling-height tiers.
 *
 * The walk level never changes — only the rendered wall top / ceiling plane is
 * raised so different room kinds read with a different vertical volume:
 *   tier 0 → plain rooms (default 1.0 wall height)
 *   tier 1 → corridors sit a little taller than plain rooms
 *   tier 2 → large rooms
 *   tier 3 → grand halls
 *
 * Tiers are stamped over each room's full rect (interior + wall ring) so the
 * bounding walls a ray actually hits carry the room's volume. Nothing here
 * touches gameplay, collision, AI or save state — it is pure render metadata,
 * regenerated whenever a floor is built or restored.
 *
 * Expandable: add a tier constant + raise the `LARGE_AREA`/`GRAND_AREA` table
 * or branch on more `RoomType`s. The shader maps tier `t` to height `1 + t*0.5`.
 */

const TIER_ROOM = 0;
const TIER_CORRIDOR = 1;
const TIER_LARGE = 2;
const TIER_GRAND = 3;

const LARGE_AREA = 60;   // w*h at/above which a room reads as a hall
const GRAND_AREA = 130;  // ...and a grand hall

function ceilingTierForRoom(room: Room): number {
  if (room.type === RoomType.CORRIDOR) return TIER_CORRIDOR;
  const area = room.w * room.h;
  if (area >= GRAND_AREA) return TIER_GRAND;
  if (area >= LARGE_AREA) return TIER_LARGE;
  return TIER_ROOM;
}

export function stampCeilingHeights(world: World): void {
  const ceil = world.ceilHeight;
  ceil.fill(0);
  for (const room of world.rooms) {
    if (!room) continue;
    const tier = ceilingTierForRoom(room);
    if (tier === TIER_ROOM) continue;
    for (let y = room.y - 1; y <= room.y + room.h; y++) {
      const wy = world.wrap(y);
      for (let x = room.x - 1; x <= room.x + room.w; x++) {
        ceil[world.idx(world.wrap(x), wy)] = tier;
      }
    }
  }
  world.markCeilHeightDirty();
}
