/* ── Kvartiry content manifest ──────────────────────────────────
 * Social content modules are grouped here so index.ts stays stable.
 */

import { type Entity } from '../../core/types';
import { World } from '../../core/world';
import { syncNextEntityId } from '../content_manifest_utils';
import { spawnNavelny } from './navelny';
import { spawnZhirinovsky } from './zhirinovsky';
import { spawnTyotyaKlava } from './tyotya_klava';
import { spawnSeryGopnik } from './sery_gopnik';
import { spawnPahomBratishka } from './pakhom';
import { generateRedCorner } from './red_corner';
import { generateRationQueue } from './ration_queue';
import { generateOcherednik } from './ocherednik';
import { generateWaterRiot } from './water_riot';
import { generatePrintRoom } from './print_room';
import { generateBarricade } from './barricade';
import { generateCommunalKitchenFeud } from './communal_kitchen_feud';
import { generateLostChildCorner } from './lost_child_corner';
import { generateMedicineSwap } from './medicine_swap';
import { generateAmmoSmelter } from './ammo_smelter';
import { generateCultSupplyKitchen } from './cult_supply_kitchen';
import { generateChernobozhiySvod } from './chernobozhiy_svod';
import { generateFalseNeighborRoom } from './false_neighbor';
import { generatePustoySosedRoom } from './pustoy_sosed';
import { generateKv08RouteAssembly } from './kv08_route_assembly';
import { resetKvSocialPressurePois, tryKvSocialPressureUprising } from './social_pressure';

export function resetKvartiryContentState(): void {
  resetKvSocialPressurePois();
}

export function tryKvartiryContentUprising(world: World, entities: Entity[]): boolean {
  return tryKvSocialPressureUprising(world, entities);
}

export function spawnKvartiryNamedNpcs(
  world: World,
  entities: Entity[],
  nextId: number,
): number {
  spawnNavelny(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  spawnZhirinovsky(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  spawnTyotyaKlava(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  spawnSeryGopnik(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  spawnPahomBratishka(world, entities, { v: nextId });
  return syncNextEntityId(entities, nextId);
}

export function runKvartiryPermanentContent(
  world: World,
  entities: Entity[],
  nextId: number,
  spawnX: number,
  spawnY: number,
): number {
  const socialNext = { v: nextId };
  let socialRoomId = world.rooms.length;
  const redCorner = generateRedCorner(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = Math.max(socialRoomId + 1, redCorner.nextRoomId);
  socialRoomId = generateRationQueue(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateOcherednik(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateWaterRiot(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generatePrintRoom(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateBarricade(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateCommunalKitchenFeud(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateLostChildCorner(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateMedicineSwap(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateAmmoSmelter(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateCultSupplyKitchen(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateChernobozhiySvod(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = generateKv08RouteAssembly(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  generateFalseNeighborRoom(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  socialRoomId = Math.max(socialRoomId + 1, world.rooms.length);
  generatePustoySosedRoom(world, socialRoomId, entities, socialNext, spawnX, spawnY);
  return socialNext.v;
}
