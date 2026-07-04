import { World as WorldClass } from '../../core/world';
import { RoomType, Tex } from '../../core/types';
import type { FloorGeneration } from '../floor_manifest';
import { stampRoom } from '../shared';
import { assignOutskirtsTerritories, spawnFactionLeaders } from './outskirts_conflict';

export function generateOutskirtsDesignFloor(): FloorGeneration {
  const world = new WorldClass();
  const entities: any[] = [];
  const spawnX = 100;
  const spawnY = 100;
  let nextRoomId = 1;
  const nextId = { v: 1000 };

  const leftHq = stampRoom(world, nextRoomId++, RoomType.HQ, spawnX - 40, spawnY - 10, 20, 20, -1);
  leftHq.name = 'Штаб Wild';
  leftHq.wallTex = Tex.HERMO_WALL;
  leftHq.floorTex = Tex.F_CONCRETE;

  const centerArea = stampRoom(world, nextRoomId++, RoomType.COMMON, spawnX - 10, spawnY - 10, 20, 20, -1);
  centerArea.name = 'Нейтральная Зона';
  centerArea.wallTex = Tex.METAL;
  centerArea.floorTex = Tex.F_CONCRETE;

  const rightHq = stampRoom(world, nextRoomId++, RoomType.HQ, spawnX + 20, spawnY - 10, 20, 20, -1);
  rightHq.name = 'Штаб Ликвидаторов';
  rightHq.wallTex = Tex.HERMO_WALL;
  rightHq.floorTex = Tex.F_CONCRETE;

  assignOutskirtsTerritories(world, spawnX);
  spawnFactionLeaders(world, entities, nextId);

  return { world, entities, spawnX, spawnY };
}
