/* ── Intro Atrium — Актовый зал + Оружейная (Стрельбище) ───────── */
/*   Self-contained content module:                               */
/*     • Актовый зал — briefing room with slides & desks          */
/*     • Оружейная — armory / shooting range with targets          */
/*     • NPCs: Ольга Дмитриевна (tutor), Барни (armory)           */
/*     • Quest chain: Ольга→Барни→Ольга                           */
/*     • Item drops: makarov, ammo, supplies near counters         */
/*     • Keybind hint textures for tutorial room walls             */
/*                                                                 */
/*   To add a new hand-crafted room, create a similar file and     */
/*   call it from the living/index.ts orchestrator.                */

import {
  W, Cell, DoorState, Tex, RoomType, Feature,
  type Room, type Entity,
  EntityType, AIGoal,
} from '../../core/types';
import { World } from '../../core/world';
import { freshNeeds } from '../../data/catalog';
import { PLOT_NPCS } from '../../data/plot';
import { stampRoom, protectRoom } from '../shared';
import { drawTextCentered } from '../../render/text';
import { S, rgba, noise, clamp } from '../../render/pixutil';
import { Spr } from '../../render/sprite_index';

function protectTutorialWallsAsHermetic(world: World, x: number, y: number, w: number, h: number): void {
  for (let dy = -1; dy <= h; dy++) {
    for (let dx = -1; dx <= w; dx++) {
      if (dx !== -1 && dx !== w && dy !== -1 && dy !== h) continue;
      const idx = world.idx(x + dx, y + dy);
      if (world.cells[idx] === Cell.WALL) world.hermoWall[idx] = 1;
    }
  }
}

export function generateTutorRoom(
  world: World, nextRoomId: number, entities: Entity[], nextId: { v: number },
): { room: Room; spawnX: number; spawnY: number; nextRoomId: number } {

  /* ================================================================
   *  A. Актовый зал (briefing hall) — existing tutorial room
   * ================================================================ */
  const hallW = 11, hallH = 9;
  const armW = 7, armH = 14;

  // Find clear position near center — never overwrite apartments (aptMask)
  let hallX = 512 - Math.floor(hallW / 2);
  let hallY = 512 - Math.floor(hallH / 2);
  function areaClear(bx: number, by: number, fw: number, fh: number): boolean {
    for (let dy = -1; dy <= fh; dy++)
      for (let dx = -1; dx <= fw; dx++)
        if (world.aptMask[world.idx((bx + dx + W) % W, (by + dy + W) % W)]) return false;
    return true;
  }
  if (!areaClear(hallX, hallY, hallW + 1 + armW, Math.max(hallH, armH + 1))) {
    // Spiral search outward from center for a clear spot
    let found = false;
    for (let r = 1; r < 200 && !found; r++)
      for (let dy = -r; dy <= r && !found; dy++)
        for (let dx = -r; dx <= r && !found; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const tx = (512 - Math.floor(hallW / 2) + dx + W) % W;
          const ty = (512 - Math.floor(hallH / 2) + dy + W) % W;
          if (areaClear(tx, ty, hallW + 1 + armW, Math.max(hallH, armH + 1))) {
            hallX = tx; hallY = ty; found = true;
          }
        }
  }

  const room = stampRoom(world, nextRoomId++, RoomType.COMMON, hallX, hallY, hallW, hallH, -1);
  room.name = 'Актовый зал';
  room.wallTex = Tex.PANEL;
  room.floorTex = Tex.F_LINO;
  protectRoom(world, hallX, hallY, hallW, hallH, Tex.PANEL, Tex.F_LINO);
  protectTutorialWallsAsHermetic(world, hallX, hallY, hallW, hallH);

  // Desks: rows of half-height desk sprites
  const DESK_SPRITE = Spr.DESK;
  for (let dy = 2; dy <= hallH - 3; dy += 2)
    for (let dx = 1; dx < hallW - 1; dx++)
      if (dx % 2 === 1) {
        entities.push({
          id: nextId.v++, type: EntityType.BILLBOARD,
          x: hallX + dx + 0.5, y: hallY + dy + 0.5,
          angle: 0, pitch: 0, alive: true, speed: 0,
          sprite: DESK_SPRITE, spriteScale: 0.5,
        });
      }

  // Slide walls: 2 cells on the north wall
  const slideX1 = hallX + Math.floor(hallW / 2) - 1;
  const slideX2 = hallX + Math.floor(hallW / 2);
  const slideY = hallY - 1;
  for (const sx of [slideX1, slideX2]) {
    const si = world.idx(sx, slideY);
    world.wallTex[si] = Tex.SLIDE_1;
    world.features[si] = Feature.SLIDE;
    world.slideCells.push(si);
  }

  // Keybind hint posters: west wall now, east wall after armory (protectRoom overwrites)
  {
    let hi = 0;
    // West wall of hall: x = hallX - 1 (5 textures on dy=0,2,4,6,8)
    for (let dy = 0; dy < hallH && hi < 7; dy += 2) {
      world.wallTex[world.idx(hallX - 1, hallY + dy)] = Tex.HINT_1 + hi;
      hi++;
    }
    // East wall hints are placed after armory section below
  }

  // Lamps
  world.features[world.idx(hallX + Math.floor(hallW / 2), hallY + Math.floor(hallH / 2))] = Feature.LAMP;
  world.features[world.idx(hallX + 2, hallY + 2)] = Feature.LAMP;
  world.features[world.idx(hallX + hallW - 3, hallY + 2)] = Feature.LAMP;

  // Tutorial NPC: Ольга Дмитриевна
  const olgaDef = PLOT_NPCS['olga'];
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: hallX + Math.floor(hallW / 2) + 0.5, y: hallY + 1 + 0.5,
    angle: Math.PI / 2, pitch: 0, alive: true, speed: olgaDef.speed,
    sprite: olgaDef.sprite,
    spriteSeed: 90, // authored visual seed for the starting doctor
    name: olgaDef.name, isFemale: olgaDef.isFemale,
    needs: freshNeeds(), hp: olgaDef.hp, maxHp: olgaDef.maxHp, money: olgaDef.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: olgaDef.inventory.map(i => ({ ...i })),
    faction: olgaDef.faction, occupation: olgaDef.occupation,
    plotNpcId: 'olga', canGiveQuest: true, questId: -1,
  });

  /* ================================================================
   *  B. Оружейная / Стрельбище (armory + shooting range)
   * ================================================================ */
  const armX = hallX + hallW + 1;
  const armY = hallY + 1;

  const armory = stampRoom(world, nextRoomId++, RoomType.PRODUCTION, armX, armY, armW, armH, -1);
  armory.name = 'Оружейная';
  armory.wallTex = Tex.METAL;
  armory.floorTex = Tex.F_CONCRETE;
  protectRoom(world, armX, armY, armW, armH, Tex.METAL, Tex.F_CONCRETE);
  protectTutorialWallsAsHermetic(world, armX, armY, armW, armH);

  // ── Connecting corridor (2 cells between halls) + door ──
  const doorY = hallY + Math.floor(hallH / 2);
  const gapX = hallX + hallW;
  const hallArmoryDoor = world.idx(gapX, doorY);
  world.cells[hallArmoryDoor] = Cell.DOOR;
  world.wallTex[hallArmoryDoor] = Tex.DOOR_METAL;
  world.floorTex[hallArmoryDoor] = Tex.F_LINO;
  world.aptMask[hallArmoryDoor] = 1;
  world.hermoWall[hallArmoryDoor] = 1;
  world.doors.set(hallArmoryDoor, {
    idx: hallArmoryDoor,
    state: DoorState.HERMETIC_OPEN,
    roomA: room.id,
    roomB: armory.id,
    keyId: '',
    timer: 0,
  });
  room.doors.push(hallArmoryDoor);
  armory.doors.push(hallArmoryDoor);
  world.aptMask[world.idx(gapX, doorY - 1)] = 1;
  world.aptMask[world.idx(gapX, doorY + 1)] = 1;

  // ── Targets on far (south) wall ──
  for (let dx = 0; dx < armW; dx++) {
    const ci = world.idx(armX + dx, armY + armH);
    if (world.cells[ci] === Cell.WALL) {
      world.wallTex[ci] = Tex.TARGET;
    }
  }

  // ── Counter/barrier line at y offset 3 ──
  const counterY = armY + 3;
  for (let dx = 1; dx < armW - 1; dx++) {
    entities.push({
      id: nextId.v++, type: EntityType.BILLBOARD,
      x: armX + dx + 0.5, y: counterY + 0.5,
      angle: 0, pitch: 0, alive: true, speed: 0,
      sprite: DESK_SPRITE, spriteScale: 0.5,
    });
  }

  // ── Lamps in armory ──
  world.features[world.idx(armX + Math.floor(armW / 2), armY + 1)] = Feature.LAMP;
  world.features[world.idx(armX + Math.floor(armW / 2), armY + armH - 3)] = Feature.LAMP;
  world.features[world.idx(armX + 1, armY + 7)] = Feature.LAMP;
  world.features[world.idx(armX + armW - 2, armY + 7)] = Feature.LAMP;

  // ── Item drops: ammo on counter ──
  entities.push({
    id: nextId.v++, type: EntityType.ITEM_DROP,
    x: armX + 3 + 0.5, y: armY + 1 + 0.5,
    angle: 0, pitch: 0, alive: true, speed: 0,
    sprite: Spr.ITEM_DROP, spriteScale: 1.0,
    inventory: [{ defId: 'ammo_9mm', count: 8 }],
  });

  // ── NPC: Барни — armory instructor ──
  const barniDef = PLOT_NPCS['barni'];
  entities.push({
    id: nextId.v++, type: EntityType.NPC,
    x: armX + 2 + 0.5, y: armY + 1 + 0.5,
    angle: Math.PI, pitch: 0, alive: true, speed: barniDef.speed,
    sprite: barniDef.sprite,
    name: barniDef.name, isFemale: barniDef.isFemale,
    needs: freshNeeds(), hp: barniDef.hp, maxHp: barniDef.maxHp, money: barniDef.money,
    ai: { goal: AIGoal.IDLE, tx: 0, ty: 0, path: [], pi: 0, stuck: 0, timer: 0 },
    inventory: barniDef.inventory.map(i => ({ ...i })),
    faction: barniDef.faction, occupation: barniDef.occupation,
    plotNpcId: 'barni', canGiveQuest: true, questId: -1,
  });

  // ── East wall hint posters ──
  {
    const doorDy = Math.floor(hallH / 2);
    let hi = 5;
    for (let dy = hallH - 1; dy >= 0 && hi < 7; dy -= 2) {
      if (dy === doorDy) continue;
      world.wallTex[world.idx(hallX + hallW, hallY + dy)] = Tex.HINT_1 + hi;
      hi++;
    }
  }

  // ── Lore poster on south wall (center) ──
  world.wallTex[world.idx(hallX + Math.floor(hallW / 2), hallY + hallH)] = Tex.HINT_LORE;

  // ── Re-apply slide textures to guarantee they are never overwritten ──
  for (const sx of [slideX1, slideX2]) {
    const si = world.idx(sx, slideY);
    world.wallTex[si] = Tex.SLIDE_1;
    world.features[si] = Feature.SLIDE;
  }

  // ── Player spawn: back of the hall, facing north ──
  const spawnX = hallX + Math.floor(hallW / 2) + 0.5;
  const spawnY = hallY + hallH - 2 + 0.5;

  return { room, spawnX, spawnY, nextRoomId };
}

/* ================================================================
 *  Keybind hint textures (merged from hints.ts)
 * ================================================================ */
const BG_R = 30, BG_G = 55, BG_B = 45;
const COL_KEY    = rgba(255, 230, 80);
const COL_DESC   = rgba(200, 215, 200);
const COL_BORDER = rgba(70, 110, 85);

const PAIRS: [string, string, string, string][] = [
  ['WASD',  'ХОДЬБА',    'МЫШЬ',  'ОБЗОР'],
  ['ЛКМ',   'АТАКА',     'E',     'ДЕЙСТВИЕ'],
  ['F',     'ФРАКЦИИ',   'I',     'ИНВЕНТАРЬ'],
  ['M',     'КАРТА',     'Q',     'ЗАДАНИЯ'],
  ['L',     'ЖУРНАЛ',    'N',     'НЕТ-СФЕРА'],
  ['P',     'ТУАЛЕТ',    'ENTER', 'МЕНЮ'],
  ['G',     'ИНСТРУМ.',  '1 2 3', 'АТРИБУТЫ'],
];

function drawHLine(t: Uint32Array, y: number, col: number): void {
  const m = S >> 1;
  for (let d = 0; d <= 24; d++) {
    if (m - d >= 0) t[y * S + (m - d)] = col;
    if (m + d < S)  t[y * S + (m + d)] = col;
  }
}

export function generateHintTextures(textures: Uint32Array[]): void {
  const HALF = S >> 1;
  for (let i = 0; i < 7; i++) {
    const t = textures[Tex.HINT_1 + i];
    const [k1, d1, k2, d2] = PAIRS[i];
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const n = noise(x, y, 400 + i * 7) * 10 - 5;
        t[y * S + x] = rgba(
          clamp(BG_R + Math.floor(n)),
          clamp(BG_G + Math.floor(n)),
          clamp(BG_B + Math.floor(n)),
        );
      }
    for (let p = 0; p < S; p++) for (let b = 0; b < 2; b++) {
      t[b * S + p] = COL_BORDER;
      t[(S - 1 - b) * S + p] = COL_BORDER;
      t[p * S + b] = COL_BORDER;
      t[p * S + (S - 1 - b)] = COL_BORDER;
    }
    drawHLine(t, HALF, COL_BORDER);
    drawTextCentered(t, k1, 7, COL_KEY);
    drawTextCentered(t, d1, 19, COL_DESC);
    drawTextCentered(t, k2, HALF + 7, COL_KEY);
    drawTextCentered(t, d2, HALF + 19, COL_DESC);
  }
  {
    const t = textures[Tex.HINT_LORE];
    const LR = 45, LG = 15, LB = 15;
    const LBORDER = rgba(100, 30, 30);
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        const n = noise(x, y, 777) * 8 - 4;
        t[y * S + x] = rgba(
          clamp(LR + Math.floor(n)),
          clamp(LG + Math.floor(n)),
          clamp(LB + Math.floor(n)),
        );
      }
    for (let p = 0; p < S; p++) for (let b = 0; b < 2; b++) {
      t[b * S + p] = LBORDER;
      t[(S - 1 - b) * S + p] = LBORDER;
      t[p * S + b] = LBORDER;
      t[p * S + (S - 1 - b)] = LBORDER;
    }
    drawTextCentered(t, 'ПОМНИ', 4, COL_KEY);
    drawTextCentered(t, 'ОСНОВНЫЕ', 16, COL_DESC);
    drawTextCentered(t, 'КОМАНДЫ', 28, COL_DESC);
    drawTextCentered(t, 'НЕЙРО', 40, COL_DESC);
    drawTextCentered(t, 'ИНТЕРФЕЙСА', 52, COL_DESC);
  }
}
