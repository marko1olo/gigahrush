/* ── NPC A-Life FSM: schedule-driven behavior + needs ─────────── */

import {
  type Entity, type Msg,
  EntityType, AIGoal, RoomType, NpcState, Occupation, Faction,
  type GameClock,
} from '../../core/types';
import { World } from '../../core/world';
import { stampMark, MarkType } from '../../render/marks';
import { followPath, findNearest, findFamilyRoom, gotoRoom, wanderNearby, wanderFar } from './pathfinding';
import {
  bark,
  BARK_HIDE, BARK_HIDE_F, BARK_CHANCE_HIDE,
  BARK_GENERIC, BARK_GENERIC_F, BARK_CHANCE_GENERIC,
} from './barks';
import { tickNpcMemoryLowFrequency } from '../npc_memory';
import { tickNpcRumorLowFrequency } from '../rumor';

let _barkMsgs: Msg[] = [];
let _barkTime = 0;

export function setNpcContext(msgs: Msg[], time: number): void {
  _barkMsgs = msgs;
  _barkTime = time;
}

/* ── Schedule → NpcState mapping ──────────────────────────────── */
function getScheduledState(hour: number, samosborActive: boolean, e?: Entity): NpcState {
  if (e?.isTraveler) {
    if (samosborActive && e.faction === Faction.CITIZEN) return NpcState.HIDING;
    return NpcState.TRAVELING;
  }
  if (samosborActive) return NpcState.HIDING;
  if (hour >= 22 || hour < 6)  return NpcState.SLEEPING;
  if (hour >= 6  && hour < 8)  return NpcState.MORNING;
  if (hour >= 8  && hour < 12) return NpcState.WORKING;
  if (hour >= 12 && hour < 13) return NpcState.LUNCH;
  if (hour >= 13 && hour < 18) return NpcState.WORKING;
  return NpcState.FREE_TIME; // 18-22
}

/* ── Work room types by occupation ────────────────────────────── */
const WORK_KITCHEN = [RoomType.KITCHEN] as const;
const WORK_MEDICAL = [RoomType.MEDICAL] as const;
const WORK_PRODUCTION = [RoomType.PRODUCTION] as const;
const WORK_OFFICE = [RoomType.OFFICE] as const;
const WORK_STORAGE = [RoomType.STORAGE] as const;
const WORK_SCIENTIST = [RoomType.OFFICE, RoomType.MEDICAL] as const;
const WORK_DIRECTOR = [RoomType.OFFICE, RoomType.COMMON] as const;
const WORK_HOUSEWIFE = [RoomType.LIVING, RoomType.KITCHEN] as const;
const WORK_CHILD = [RoomType.LIVING, RoomType.COMMON] as const;
const WORK_ALCOHOLIC = [RoomType.SMOKING, RoomType.COMMON, RoomType.KITCHEN] as const;
const WORK_HUNTER = [RoomType.CORRIDOR, RoomType.COMMON] as const;
const WORK_DEFAULT = [RoomType.PRODUCTION, RoomType.OFFICE] as const;

function getWorkRoomTypes(occ: Occupation | undefined): readonly RoomType[] {
  switch (occ) {
    case Occupation.COOK:        return WORK_KITCHEN;
    case Occupation.DOCTOR:      return WORK_MEDICAL;
    case Occupation.LOCKSMITH:
    case Occupation.ELECTRICIAN:
    case Occupation.TURNER:
    case Occupation.MECHANIC:    return WORK_PRODUCTION;
    case Occupation.SECRETARY:   return WORK_OFFICE;
    case Occupation.STOREKEEPER: return WORK_STORAGE;
    case Occupation.SCIENTIST:   return WORK_SCIENTIST;
    case Occupation.DIRECTOR:    return WORK_DIRECTOR;
    case Occupation.HOUSEWIFE:   return WORK_HOUSEWIFE;
    case Occupation.CHILD:       return WORK_CHILD;
    case Occupation.ALCOHOLIC:   return WORK_ALCOHOLIC;
    case Occupation.HUNTER:      return WORK_HUNTER;
    default:                     return WORK_DEFAULT;
  }
}

/* ── NPC behavior: schedule-driven FSM with needs ─────────────── */
export function updateNPC(world: World, _entities: Entity[], e: Entity, dt: number, _time: number, clock: GameClock, samosborActive: boolean): void {
  const ai = e.ai!;
  const n = e.needs;

  // Initialize NPC state if not set
  if (ai.npcState === undefined) {
    ai.npcState = getScheduledState(clock.hour, samosborActive, e);
    ai.stateTimer = 0;
  }

  // ── Ольга Дмитриевна: tutor → doctor transition after 1 game hour ──
  if (e.plotNpcId === 'olga' && !e.plotDone && clock.totalMinutes >= 60) {
    e.plotDone = true;
    ai.npcState = getScheduledState(clock.hour, samosborActive, e);
    ai.path = [];
    ai.pi = 0;
    ai.goal = AIGoal.IDLE;
    ai.stateTimer = 0;
  }
  if (e.plotNpcId === 'olga' && !e.plotDone) {
    ai.goal = AIGoal.IDLE;
    ai.timer = 1;
    return;
  }

  // Check for schedule transition
  const scheduled = getScheduledState(clock.hour, samosborActive, e);
  if (ai.npcState !== scheduled && ai.npcState !== NpcState.HIDING) {
    if (!e.isTraveler || scheduled !== NpcState.TRAVELING) {
      ai.npcState = scheduled;
      ai.path = [];
      ai.pi = 0;
      ai.goal = AIGoal.IDLE;
      ai.stateTimer = 0;
    }
  }
  if (ai.npcState === NpcState.HIDING && !samosborActive) {
    ai.npcState = scheduled;
    ai.path = [];
    ai.pi = 0;
    ai.goal = AIGoal.IDLE;
    ai.stateTimer = 0;
  }

  ai.timer -= dt;
  ai.stateTimer = (ai.stateTimer ?? 0) + dt;

  // NPC needs restoration when in relevant room
  const currentRoom = world.roomAt(e.x, e.y);
  if (n && currentRoom) {
    if (currentRoom.type === RoomType.KITCHEN) {
      n.food = Math.min(100, n.food + 8 * dt);
      n.water = Math.min(100, n.water + 10 * dt);
      n.pendingPoo = (n.pendingPoo ?? 0) + 8 * 0.7 * dt;
      n.pendingPee = (n.pendingPee ?? 0) + 8 * 0.3 * dt + 10 * 0.6 * dt;
    }
    if (currentRoom.type === RoomType.BATHROOM) {
      n.water = Math.min(100, n.water + 12 * dt);
      n.pendingPee = (n.pendingPee ?? 0) + 12 * 0.6 * dt;
      if (n.pee > 15 && Math.random() < 0.3) {
        const fx = ((e.x % 1) + 1) % 1;
        const fy = ((e.y % 1) + 1) % 1;
        stampMark(world, Math.floor(e.x), Math.floor(e.y), fx, fy, 0.1, MarkType.DRIP, Math.floor(e.id * 1000 + n.pee), 200, 180, 30, 40);
      }
      n.pee = Math.max(0, n.pee - 20 * dt);
      n.poo = Math.max(0, n.poo - 15 * dt);
    }
    if (currentRoom.type === RoomType.LIVING && ai.npcState === NpcState.SLEEPING) {
      n.sleep = Math.min(100, n.sleep + 6 * dt);
    }
    if (currentRoom.type === RoomType.MEDICAL && e.hp !== undefined && e.maxHp !== undefined) {
      e.hp = Math.min(e.maxHp, e.hp + 3 * dt);
    }
  }

  // FSM behavior per state
  switch (ai.npcState) {
    case NpcState.SLEEPING:  handleSleeping(world, e, dt); break;
    case NpcState.MORNING:   handleMorning(world, e, dt); break;
    case NpcState.WORKING:   handleWorking(world, e, dt); break;
    case NpcState.LUNCH:     handleLunch(world, e, dt); break;
    case NpcState.FREE_TIME: handleFreeTime(world, e, dt); break;
    case NpcState.HIDING:    handleHiding(world, e, dt); break;
    case NpcState.TRAVELING: handleTraveling(world, e, dt); break;
  }

  tickNpcMemoryLowFrequency(e, _time, clock.totalMinutes, samosborActive);
  tickNpcRumorLowFrequency(e, _time, clock.totalMinutes, samosborActive);
  tryAmbientBark(e, dt, samosborActive);
}

function tryAmbientBark(e: Entity, dt: number, samosborActive: boolean): void {
  const ai = e.ai!;
  ai.ambientBarkCd = Math.max(0, (ai.ambientBarkCd ?? (10 + Math.random() * 12)) - dt);
  if (ai.ambientBarkCd > 0) return;

  ai.ambientBarkCd = 18 + Math.random() * 28;
  if (samosborActive) return;
  if (ai.npcState === NpcState.SLEEPING || ai.npcState === NpcState.HIDING) return;
  if (ai.goal === AIGoal.FLEE || ai.goal === AIGoal.HIDE || ai.goal === AIGoal.HUNT) return;

  bark(e, _barkMsgs, _barkTime, BARK_GENERIC, BARK_GENERIC_F, BARK_CHANCE_GENERIC, '#9ba');
}

/* ── State handlers ──────────────────────────────────────────── */

function handleSleeping(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.goal === AIGoal.IDLE || ai.timer <= 0) {
    const targetRoom = findFamilyRoom(world, e, RoomType.LIVING);
    if (targetRoom >= 0 && ai.path.length === 0) {
      gotoRoom(world, e, targetRoom);
    }
    ai.goal = AIGoal.SLEEP;
    ai.timer = 10;
  }
  followPath(world, e, dt);
}

function handleMorning(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;

  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 50 || n.poo > 50)) {
      ai.goal = AIGoal.TOILET;
      const r = findNearest(world, e, RoomType.BATHROOM);
      if (r >= 0) gotoRoom(world, e, r);
    } else if (n && n.food < 60) {
      ai.goal = AIGoal.EAT;
      const r = findNearest(world, e, RoomType.KITCHEN);
      if (r >= 0) gotoRoom(world, e, r);
    } else if (n && n.water < 60) {
      ai.goal = AIGoal.DRINK;
      const r = findNearest(world, e, RoomType.KITCHEN);
      if (r >= 0) gotoRoom(world, e, r);
    } else {
      ai.goal = AIGoal.WANDER;
      wanderNearby(world, e);
    }
    ai.timer = 8 + Math.random() * 8;
  }

  if (n && ai.goal === AIGoal.TOILET) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.BATHROOM && n.pee < 15 && n.poo < 15) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }
  if (n && ai.goal === AIGoal.EAT) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.KITCHEN && n.food > 80) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }

  followPath(world, e, dt);
}

function handleWorking(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;

  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 80 || n.poo > 80)) {
      ai.goal = AIGoal.TOILET;
      const r = findNearest(world, e, RoomType.BATHROOM);
      if (r >= 0) gotoRoom(world, e, r);
      ai.timer = 10;
    } else if (n && e.hp !== undefined && e.maxHp !== undefined && e.hp < e.maxHp * 0.5) {
      ai.goal = AIGoal.GOTO;
      const r = findNearest(world, e, RoomType.MEDICAL);
      if (r >= 0) gotoRoom(world, e, r);
      ai.timer = 15;
    } else {
      ai.goal = AIGoal.WORK;
      const workTypes = getWorkRoomTypes(e.occupation);
      let bestRoom = -1;
      for (const rt of workTypes) {
        bestRoom = findNearest(world, e, rt);
        if (bestRoom >= 0) break;
      }
      if (bestRoom >= 0) gotoRoom(world, e, bestRoom);
      ai.timer = 15 + Math.random() * 20;
    }
  }

  if (ai.goal === AIGoal.TOILET) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.BATHROOM && n && n.pee < 15 && n.poo < 15) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }

  followPath(world, e, dt);
}

function handleLunch(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;

  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    ai.goal = AIGoal.EAT;
    const r = findNearest(world, e, RoomType.KITCHEN);
    if (r >= 0) gotoRoom(world, e, r);
    ai.timer = 20 + Math.random() * 10;
  }

  followPath(world, e, dt);
}

function handleFreeTime(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;

  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 70 || n.poo > 70)) {
      ai.goal = AIGoal.TOILET;
      const r = findNearest(world, e, RoomType.BATHROOM);
      if (r >= 0) gotoRoom(world, e, r);
    } else if (n && n.food < 40) {
      ai.goal = AIGoal.EAT;
      const r = findNearest(world, e, RoomType.KITCHEN);
      if (r >= 0) gotoRoom(world, e, r);
    } else if (n && e.hp !== undefined && e.maxHp !== undefined && e.hp < e.maxHp * 0.7) {
      ai.goal = AIGoal.GOTO;
      const r = findNearest(world, e, RoomType.MEDICAL);
      if (r >= 0) gotoRoom(world, e, r);
    } else {
      const roll = Math.random();
      if (roll < 0.3) {
        ai.goal = AIGoal.WANDER;
        const r = findNearest(world, e, RoomType.SMOKING);
        if (r >= 0) gotoRoom(world, e, r);
        else wanderNearby(world, e);
      } else if (roll < 0.55) {
        ai.goal = AIGoal.WANDER;
        const r = findNearest(world, e, RoomType.KITCHEN);
        if (r >= 0) gotoRoom(world, e, r);
        else wanderNearby(world, e);
      } else if (roll < 0.7) {
        ai.goal = AIGoal.WANDER;
        const r = findNearest(world, e, RoomType.COMMON);
        if (r >= 0) gotoRoom(world, e, r);
        else wanderNearby(world, e);
      } else {
        ai.goal = AIGoal.WANDER;
        wanderNearby(world, e);
      }
    }
    ai.timer = 8 + Math.random() * 12;
  }

  if (n && ai.goal === AIGoal.TOILET) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.BATHROOM && n.pee < 15 && n.poo < 15) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }

  followPath(world, e, dt);
}

function handleHiding(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.goal !== AIGoal.HIDE) {
    ai.goal = AIGoal.HIDE;
    ai.timer = 0;
  }
  if (ai.path.length === 0 && ai.timer <= 0) {
    if (e.isTraveler) {
      const r = findNearest(world, e, RoomType.LIVING);
      if (r >= 0) gotoRoom(world, e, r);
    } else {
      const targetRoom = findFamilyRoom(world, e, RoomType.LIVING);
      if (targetRoom >= 0) gotoRoom(world, e, targetRoom);
    }
    ai.timer = 1.25;
  }
  followPath(world, e, dt);
}

function handleTraveling(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;

  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 70 || n.poo > 70)) {
      ai.goal = AIGoal.TOILET;
      const r = findNearest(world, e, RoomType.BATHROOM);
      if (r >= 0) gotoRoom(world, e, r);
    } else if (n && n.food < 30) {
      ai.goal = AIGoal.EAT;
      const r = findNearest(world, e, RoomType.KITCHEN);
      if (r >= 0) gotoRoom(world, e, r);
    } else if (n && e.hp !== undefined && e.maxHp !== undefined && e.hp < e.maxHp * 0.5) {
      ai.goal = AIGoal.GOTO;
      const r = findNearest(world, e, RoomType.MEDICAL);
      if (r >= 0) gotoRoom(world, e, r);
    } else {
      ai.goal = AIGoal.WANDER;
      wanderFar(world, e);
    }
    ai.timer = 10 + Math.random() * 20;
  }

  if (n && ai.goal === AIGoal.TOILET) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.BATHROOM && n.pee < 15 && n.poo < 15) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }
  if (n && ai.goal === AIGoal.EAT) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.KITCHEN && n.food > 80) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }

  followPath(world, e, dt);
}

/* ── Force NPCs to hide (called by samosbor) ─────────────────── */
export function forceHide(entities: Entity[], msgs?: Msg[], time?: number): void {
  for (const e of entities) {
    if (e.type === EntityType.NPC && e.alive && e.ai) {
      if (e.faction === Faction.LIQUIDATOR || e.faction === Faction.CULTIST || e.faction === Faction.WILD) continue;
      if (msgs) bark(e, msgs, time ?? 0, BARK_HIDE, BARK_HIDE_F, BARK_CHANCE_HIDE, '#ff4');
      e.ai.npcState = NpcState.HIDING;
      e.ai.goal = AIGoal.HIDE;
      e.ai.path = [];
      e.ai.pi = 0;
      e.ai.timer = 0;
    }
  }
}

/* ── Get human-readable NPC state description (for talk) ──────── */
const STATE_TEXTS: Record<NpcState, string[]> = {
  [NpcState.SLEEPING]:  ['Я сплю... зачем ты меня будишь?', 'Ещё рано... дай поспать.', 'Ночь на дворе...'],
  [NpcState.MORNING]:   ['Утро. Надо в туалет и перекусить.', 'Собираюсь на работу.', 'Утренняя рутина...'],
  [NpcState.WORKING]:   ['Я на работе. Много дел.', 'Работаю. Некогда болтать.', 'Смена ещё не кончилась.'],
  [NpcState.LUNCH]:     ['Обед! Наконец-то.', 'Пойдём пообедаем.', 'Перерыв на еду.'],
  [NpcState.FREE_TIME]: ['Свободное время. Можно передохнуть.', 'Отдыхаю после смены.', 'Просто гуляю.'],
  [NpcState.HIDING]:    ['Самосбор! Сиди тихо!', 'Не высовывайся! Они снаружи!', 'Закрой дверь! Быстро!'],
  [NpcState.TRAVELING]: ['Иду куда глаза глядят.', 'Путь далёк. Не останавливаюсь.', 'Вечно в дороге...', 'Лабиринт бесконечен, и я в нём.'],
  [NpcState.MEETING]:   ['Заседание. Важные вопросы.', 'Совещание затянулось...', 'Обсуждаем повестку дня.'],
  [NpcState.PATROL]:    ['Патрулирую коридоры.', 'Всё под контролем.', 'Дежурство. Не отвлекай.'],
  [NpcState.BREAK]:     ['Перекур. Святое дело.', 'Пять минут отдыха.', 'Перерыв. Имею право.'],
};

export function getNpcStateText(state: NpcState): string {
  const texts = STATE_TEXTS[state];
  return texts[Math.floor(Math.random() * texts.length)];
}
