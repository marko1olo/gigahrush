import { AIGoal, EntityType, Faction, type Entity, type GameState } from '../core/types';
import { type World } from '../core/world';
import { generateNpcLoadout } from './procedural_loot';
import { seededRandom } from '../core/rand';
import { setFreeCameraFromSubject, startTrailerCamera, type RuntimeCamera } from './camera';
import { publishEvent } from './events';
import { awardXP, getMaxHp, randomRPG } from './rpg';
import { freshNeeds, randomName } from '../data/catalog';
import { isPlayerEntity } from './player_actor';
import { msg } from '../core/types';

function getRoomCenter(world: World, roomId: number | undefined, fallbackX: number, fallbackY: number): { cx: number; cy: number } {
  if (roomId !== undefined && roomId >= 0 && world.rooms[roomId]) {
    const room = world.rooms[roomId];
    return { cx: room.x + Math.floor(room.w / 2), cy: room.y + Math.floor(room.h / 2) };
  }
  return { cx: Math.floor(fallbackX), cy: Math.floor(fallbackY) };
}

function spawnArenaFighter(
  entities: Entity[],
  nextId: { v: number },
  x: number,
  y: number,
  faction: Faction,
  targetId: number,
  seed: number
): Entity {
  const nm = randomName(faction);
  const npcLevel = 5 + Math.floor(seededRandom(seed)() * 10);
  const rpg = randomRPG(npcLevel);
  const maxHp = getMaxHp(rpg);

  const rand = seededRandom(seed + 1);
  const loadout = generateNpcLoadout(faction, npcLevel, 3, rand(), [rand(), rand()]);

  const fighter: Entity = {
    id: nextId.v++,
    type: EntityType.NPC,
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 1.2,
    sprite: 0,
    name: nm.name,
    firstName: nm.firstName,
    lastName: nm.lastName,
    isFemale: nm.female,
    needs: freshNeeds(),
    hp: maxHp,
    maxHp: maxHp,
    money: 0,
    ai: {
      goal: AIGoal.HUNT,
      tx: 0, ty: 0,
      path: [],
      pi: 0,
      stuck: 0,
      timer: 0,
      combatTargetId: targetId
    },
    inventory: loadout.inventory ?? [],
    weapon: loadout.weapon,
    tool: loadout.tool,
    faction: faction,
    occupation: 0,
    questId: -1,
    rpg: rpg,
  };

  entities.push(fighter);
  return fighter;
}

export function startArenaMatch(
  world: World,
  entities: Entity[],
  state: GameState,
  nextId: { v: number },
  runtimeCamera: RuntimeCamera,
  roomId?: number
): void {
  const player = entities.find(e => e.alive && isPlayerEntity(e));
  if (!player) return;

  const { cx, cy } = getRoomCenter(world, roomId, player.x, player.y);

  // Generate deterministic seeds
  const seed1 = Math.floor(Math.random() * 1000000);
  const seed2 = Math.floor(Math.random() * 1000000);

  // Pick random factions
  const factions = [Faction.CITIZEN, Faction.LIQUIDATOR, Faction.WILD, Faction.CULTIST];
  const f1Faction = factions[Math.floor(seededRandom(seed1)() * factions.length)];
  const f2Faction = factions[Math.floor(seededRandom(seed2)() * factions.length)];

  const f1Id = nextId.v;
  const f2Id = nextId.v + 1;

  const f1 = spawnArenaFighter(entities, nextId, cx - 3, cy, f1Faction, f2Id, seed1);
  const f2 = spawnArenaFighter(entities, nextId, cx + 3, cy, f2Faction, f1Id, seed2);

  // Cross reference target IDs just to be sure
  f1.ai!.combatTargetId = f2.id;
  f2.ai!.combatTargetId = f1.id;

  // Turn them to face each other
  f1.angle = 0;
  f2.angle = Math.PI;

  state.arenaMatch = {
    active: true,
    fighter1Id: f1.id,
    fighter2Id: f2.id,
    roomId: roomId ?? -1
  };

  startTrailerCamera(runtimeCamera, cx, cy);
  state.trailerMode = true;
  state.msgs.push(msg(`Бой начался: ${f1.name} против ${f2.name}!`, state.time, '#f84'));
}

export function updateArenaMatch(
  _world: World,
  entities: Entity[],
  state: GameState,
  runtimeCamera: RuntimeCamera,
  player: Entity
): void {
  if (!state.arenaMatch?.active) return;

  const f1 = entities.find(e => e.id === state.arenaMatch!.fighter1Id);
  const f2 = entities.find(e => e.id === state.arenaMatch!.fighter2Id);

  // Track fighters with trailer camera
  if (f1 && f1.alive && f2 && f2.alive) {
    const mx = (f1.x + f2.x) / 2;
    const my = (f1.y + f2.y) / 2;
    // Simple tracking
    if (runtimeCamera.mode === 'trailer' && runtimeCamera.trailer) {
       runtimeCamera.free.x = mx;
       runtimeCamera.free.y = my;
    }
  }

  const f1Dead = !f1 || !f1.alive || f1.hp === undefined || f1.hp <= 0;
  const f2Dead = !f2 || !f2.alive || f2.hp === undefined || f2.hp <= 0;

  if (f1Dead || f2Dead) {
    state.arenaMatch.active = false;

    let winner: Entity | undefined;
    let loserName = "неизвестный";

    if (f1Dead && f2 && f2.alive && f2.hp! > 0) {
      winner = f2;
      loserName = f1?.name ?? loserName;
    } else if (f2Dead && f1 && f1.alive && f1.hp! > 0) {
      winner = f1;
      loserName = f2?.name ?? loserName;
    }

    if (winner) {
      awardXP(winner, 50, state.msgs, state.time);
      state.msgs.push(msg(`Победил ${winner.name}!`, state.time, '#4f4'));
    } else {
      state.msgs.push(msg(`Оба бойца погибли на арене.`, state.time, '#f44'));
    }

    publishEvent(state, {
      type: 'arena_match_ended',
      severity: 3,
      privacy: 'local',
      tags: ['arena', 'combat_end'],
      actorId: winner?.id,
      actorName: winner?.name,
      targetName: loserName,
      roomId: state.arenaMatch.roomId !== -1 ? state.arenaMatch.roomId : undefined,
    });

    setFreeCameraFromSubject(runtimeCamera, player);
    runtimeCamera.mode = 'player';
    state.trailerMode = false;
  }
}
