
import { World } from '../../core/world';
import { Entity, ZoneFaction, RoomType } from '../../core/types';
import { spawnPlotNpcFromPackage } from '../plot_npc_spawn';

export function assignOutskirtsTerritories(world: World, centerX: number): void {
  for (const room of world.rooms) {
    if (!room) continue;
    const cx = room.x + Math.floor(room.w / 2);
    let owner = ZoneFaction.CITIZEN;
    if (cx < centerX - 10) owner = ZoneFaction.WILD;
    else if (cx > centerX + 10) owner = ZoneFaction.LIQUIDATOR;

    // Assign to cells
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        world.factionControl[world.idx(x, y)] = owner;
      }
    }
  }
}

export function spawnFactionLeaders(world: World, entities: Entity[], nextId: { v: number }): void {
  // Find HQs
  let wildHq = null;
  let liqHq = null;

  // Since we assign territories using world.factionControl, we can check faction of HQ.
  // Wait, rooms themselves don't store faction natively unless we added a property. We just set world.factionControl.
  // We can sample a cell inside the room to see who owns it.

  for (const room of world.rooms) {
    if (!room || room.type !== RoomType.HQ) continue;
    const cellOwner = world.factionControl[world.idx(room.x + Math.floor(room.w/2), room.y + Math.floor(room.h/2))];

    if (cellOwner === ZoneFaction.WILD) {
      wildHq = room;
    } else if (cellOwner === ZoneFaction.LIQUIDATOR) {
      liqHq = room;
    }
  }

  if (wildHq) {
    spawnPlotNpcFromPackage(entities, nextId, 'wild_brigadier', wildHq.x + 5, wildHq.y + 5);
  }

  if (liqHq) {
    spawnPlotNpcFromPackage(entities, nextId, 'liquidator_captain', liqHq.x + 5, liqHq.y + 5);
  }
}
