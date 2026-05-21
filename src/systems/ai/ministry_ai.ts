/* ── Ministry NPC AI — separate schedule & behavior ───────────── */
/*   Does NOT modify the general FSM. Called instead of updateNPC   */
/*   when currentFloor === FloorLevel.MINISTRY.                     */

import {
  type Entity, type Msg,
  AIGoal, RoomType, NpcState, Occupation, Faction,
  type GameClock, Cell,
} from '../../core/types';
import { World } from '../../core/world';
import { followPath, gotoNearestRoomType, gotoRoom, tryAssignPathToCell, wanderNearby, wanderInRoom } from './pathfinding';
import { stampMark, MarkType } from '../../render/marks';
import {
  bark,
  BARK_GENERIC, BARK_GENERIC_F, BARK_CHANCE_GENERIC,
} from './barks';

let _barkMsgs: Msg[] = [];
let _barkTime = 0;

export function setMinistryContext(msgs: Msg[], time: number): void {
  _barkMsgs = msgs;
  _barkTime = time;
}

/* ── Ministry schedule — occupation-aware ─────────────────────── */
function getMinistrySchedule(hour: number, samosborActive: boolean, e: Entity): NpcState {
  if (samosborActive && e.faction !== Faction.LIQUIDATOR) return NpcState.HIDING;
  if (hour >= 22 || hour < 7)  return NpcState.SLEEPING;
  if (hour >= 7  && hour < 8)  return NpcState.MORNING;
  if (hour >= 8  && hour < 10) return NpcState.WORKING;
  if (hour >= 10 && hour < 11) {
    if (e.occupation === Occupation.HUNTER) return NpcState.PATROL;
    return NpcState.MEETING;
  }
  if (hour >= 11 && hour < 12) return NpcState.WORKING;
  if (hour >= 12 && hour < 13) return NpcState.LUNCH;
  if (hour >= 13 && hour < 15) return NpcState.WORKING;
  if (hour >= 15 && hour < 16) return NpcState.BREAK;
  if (hour >= 16 && hour < 18) return NpcState.WORKING;
  return NpcState.FREE_TIME; // 18-22
}

function defaultGoalForMinistryState(state: NpcState): AIGoal {
  switch (state) {
    case NpcState.SLEEPING: return AIGoal.SLEEP;
    case NpcState.WORKING:
    case NpcState.MEETING: return AIGoal.WORK;
    case NpcState.LUNCH: return AIGoal.EAT;
    case NpcState.HIDING: return AIGoal.HIDE;
    case NpcState.PATROL: return AIGoal.WANDER;
    default: return AIGoal.WANDER;
  }
}

export function primeMinistryAlifeState(e: Entity, clock: GameClock, samosborActive: boolean): void {
  const ai = e.ai;
  if (!ai) return;
  if (ai.npcState === undefined) {
    ai.npcState = getMinistrySchedule(clock.hour, samosborActive, e);
    ai.stateTimer = 0;
  }
  if (ai.goal === AIGoal.IDLE && ai.combatTargetId === undefined && ai.timer <= 0) {
    ai.goal = defaultGoalForMinistryState(ai.npcState);
  }
}

/* ── Main ministry NPC update ─────────────────────────────────── */
export function updateMinistryNPC(
  world: World, _entities: Entity[], e: Entity,
  dt: number, _time: number, clock: GameClock, samosborActive: boolean,
): void {
  const ai = e.ai!;
  const n = e.needs;

  // Initialize
  if (ai.npcState === undefined) {
    ai.npcState = getMinistrySchedule(clock.hour, samosborActive, e);
    ai.stateTimer = 0;
  }

  // Schedule transitions
  const scheduled = getMinistrySchedule(clock.hour, samosborActive, e);
  if (ai.npcState !== scheduled && ai.npcState !== NpcState.HIDING) {
    ai.npcState = scheduled;
    ai.path = [];
    ai.pi = 0;
    ai.goal = AIGoal.IDLE;
    ai.stateTimer = 0;
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

  // Needs restoration in relevant rooms
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
    if (currentRoom.type === RoomType.MEDICAL && e.hp !== undefined && e.maxHp !== undefined) {
      e.hp = Math.min(e.maxHp, e.hp + 3 * dt);
    }
    // Sleeping at office desk restores sleep
    if (currentRoom.type === RoomType.OFFICE && ai.npcState === NpcState.SLEEPING) {
      n.sleep = Math.min(100, n.sleep + 4 * dt);
    }
  }

  // FSM
  switch (ai.npcState) {
    case NpcState.SLEEPING:  handleSleeping(world, e, dt); break;
    case NpcState.MORNING:   handleMorning(world, e, dt); break;
    case NpcState.WORKING:   handleWorking(world, e, dt); break;
    case NpcState.MEETING:   handleMeeting(world, e, dt); break;
    case NpcState.LUNCH:     handleLunch(world, e, dt); break;
    case NpcState.BREAK:     handleBreak(world, e, dt); break;
    case NpcState.FREE_TIME: handleFreeTime(world, e, dt); break;
    case NpcState.PATROL:    handlePatrol(world, e, dt); break;
    case NpcState.HIDING:    handleHiding(world, e, dt); break;
  }

  tryAmbientBark(e, dt, samosborActive);
}

function tryAmbientBark(e: Entity, dt: number, samosborActive: boolean): void {
  const ai = e.ai!;
  ai.ambientBarkCd = Math.max(0, (ai.ambientBarkCd ?? (10 + Math.random() * 12)) - dt);
  if (ai.ambientBarkCd > 0) return;
  ai.ambientBarkCd = 18 + Math.random() * 28;
  if (samosborActive) return;
  if (ai.npcState === NpcState.SLEEPING || ai.npcState === NpcState.HIDING) return;
  bark(e, _barkMsgs, _barkTime, BARK_GENERIC, BARK_GENERIC_F, BARK_CHANCE_GENERIC, '#9ba');
}

/* ── Go to assigned room, or find by type ─────────────────────── */
function gotoAssignedOrNearest(world: World, e: Entity, fallbackType: RoomType): void {
  if (e.assignedRoomId !== undefined && e.assignedRoomId >= 0) {
    gotoRoom(world, e, e.assignedRoomId);
  } else {
    if (!gotoNearestRoomType(world, e, fallbackType)) wanderNearby(world, e);
  }
}

/* ── Toilet check helper ──────────────────────────────────────── */
function tryToilet(world: World, e: Entity): boolean {
  const n = e.needs;
  if (!n) return false;
  if (n.pee > 70 || n.poo > 70) {
    e.ai!.goal = AIGoal.TOILET;
    gotoNearestRoomType(world, e, RoomType.BATHROOM);
    e.ai!.timer = 10;
    return true;
  }
  return false;
}

function checkToiletDone(world: World, e: Entity): boolean {
  const n = e.needs;
  if (!n) return false;
  const cr = world.roomAt(e.x, e.y);
  if (cr && cr.type === RoomType.BATHROOM && n.pee < 15 && n.poo < 15) {
    e.ai!.goal = AIGoal.IDLE;
    e.ai!.timer = 1;
    return true;
  }
  return false;
}

/* ── State handlers ──────────────────────────────────────────── */

/** Sleep in assigned office (no LIVING rooms in ministry) */
function handleSleeping(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.goal === AIGoal.IDLE || ai.timer <= 0) {
    ai.goal = AIGoal.SLEEP;
    gotoAssignedOrNearest(world, e, RoomType.OFFICE);
    ai.timer = 10;
  }
  followPath(world, e, dt);
}

/** Morning: toilet → eat → wander */
function handleMorning(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;
  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 40 || n.poo > 40)) {
      if (!tryToilet(world, e)) { ai.goal = AIGoal.WANDER; wanderNearby(world, e); ai.timer = 8; }
    } else if (n && n.food < 70) {
      ai.goal = AIGoal.EAT;
      gotoNearestRoomType(world, e, RoomType.KITCHEN);
      ai.timer = 10;
    } else {
      ai.goal = AIGoal.WANDER;
      wanderNearby(world, e);
      ai.timer = 6 + Math.random() * 6;
    }
  }
  if (ai.goal === AIGoal.TOILET) checkToiletDone(world, e);
  if (ai.goal === AIGoal.EAT) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.KITCHEN && n && n.food > 80) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }
  followPath(world, e, dt);
}

/** Work: go to assigned office/room, toilet breaks */
function handleWorking(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;
  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 80 || n.poo > 80)) {
      tryToilet(world, e);
    } else {
      ai.goal = AIGoal.WORK;
      gotoAssignedOrNearest(world, e, RoomType.OFFICE);
      ai.timer = 15 + Math.random() * 20;
    }
  }
  // Arrived at work room? Wander inside it
  if (ai.goal === AIGoal.WORK && ai.path.length === 0) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.id === e.assignedRoomId) {
      wanderInRoom(world, e);
      ai.timer = 8 + Math.random() * 15;
    }
  }
  if (ai.goal === AIGoal.TOILET) checkToiletDone(world, e);
  followPath(world, e, dt);
}

/** Meeting: directors/secretaries/scientists go to COMMON halls */
function handleMeeting(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.goal === AIGoal.IDLE || ai.timer <= 0) {
    ai.goal = AIGoal.WORK;
    if (!gotoNearestRoomType(world, e, RoomType.COMMON)) wanderNearby(world, e);
    ai.timer = 20 + Math.random() * 15;
  }
  // In the hall — wander inside it
  if (ai.path.length === 0) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.COMMON) {
      wanderInRoom(world, e);
      ai.timer = 10 + Math.random() * 10;
    }
  }
  followPath(world, e, dt);
}

/** Lunch: go to KITCHEN (буфет) */
function handleLunch(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    ai.goal = AIGoal.EAT;
    gotoNearestRoomType(world, e, RoomType.KITCHEN);
    ai.timer = 20 + Math.random() * 10;
  }
  followPath(world, e, dt);
}

/** Break: smoking room or kitchen */
function handleBreak(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;
  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 60 || n.poo > 60)) {
      tryToilet(world, e);
    } else if (Math.random() < 0.6) {
      ai.goal = AIGoal.WANDER;
      if (!gotoNearestRoomType(world, e, RoomType.SMOKING)) wanderNearby(world, e);
    } else {
      ai.goal = AIGoal.WANDER;
      if (!gotoNearestRoomType(world, e, RoomType.KITCHEN)) wanderNearby(world, e);
    }
    ai.timer = 10 + Math.random() * 10;
  }
  if (ai.goal === AIGoal.TOILET) checkToiletDone(world, e);
  followPath(world, e, dt);
}

/** Free time: kitchen, smoking, common hall, wander */
function handleFreeTime(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;
  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 60 || n.poo > 60)) {
      tryToilet(world, e);
    } else if (n && n.food < 40) {
      ai.goal = AIGoal.EAT;
      gotoNearestRoomType(world, e, RoomType.KITCHEN);
    } else if (n && e.hp !== undefined && e.maxHp !== undefined && e.hp < e.maxHp * 0.7) {
      ai.goal = AIGoal.GOTO;
      gotoNearestRoomType(world, e, RoomType.MEDICAL);
    } else {
      const roll = Math.random();
      ai.goal = AIGoal.WANDER;
      if (roll < 0.3) {
        if (!gotoNearestRoomType(world, e, RoomType.SMOKING)) wanderNearby(world, e);
      } else if (roll < 0.55) {
        if (!gotoNearestRoomType(world, e, RoomType.KITCHEN)) wanderNearby(world, e);
      } else if (roll < 0.75) {
        if (!gotoNearestRoomType(world, e, RoomType.COMMON)) wanderNearby(world, e);
      } else {
        wanderNearby(world, e);
      }
    }
    ai.timer = 8 + Math.random() * 12;
  }
  if (ai.goal === AIGoal.TOILET) checkToiletDone(world, e);
  if (ai.goal === AIGoal.EAT) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.KITCHEN && n && n.food > 80) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }
  followPath(world, e, dt);
}

/** Patrol — liquidators walk corridors */
function handlePatrol(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  const n = e.needs;
  if (ai.timer <= 0 || ai.goal === AIGoal.IDLE) {
    if (n && (n.pee > 80 || n.poo > 80)) {
      tryToilet(world, e);
    } else if (n && n.food < 30) {
      ai.goal = AIGoal.EAT;
      gotoNearestRoomType(world, e, RoomType.KITCHEN);
    } else {
      ai.goal = AIGoal.WANDER;
      patrolCorridor(world, e);
    }
    ai.timer = 10 + Math.random() * 15;
  }
  if (ai.goal === AIGoal.TOILET) checkToiletDone(world, e);
  if (ai.goal === AIGoal.EAT) {
    const cr = world.roomAt(e.x, e.y);
    if (cr && cr.type === RoomType.KITCHEN && n && n.food > 80) {
      ai.goal = AIGoal.IDLE; ai.timer = 1;
    }
  }
  followPath(world, e, dt);
}

/** Patrol helper: pick a random corridor point (not in any room) */
function patrolCorridor(world: World, e: Entity): void {
  for (let attempt = 0; attempt < 20; attempt++) {
    const dx = Math.floor(Math.random() * 60) - 30;
    const dy = Math.floor(Math.random() * 60) - 30;
    const tx = world.wrap(Math.floor(e.x) + dx);
    const ty = world.wrap(Math.floor(e.y) + dy);
    const ci = world.idx(tx, ty);
    if (world.cells[ci] !== Cell.FLOOR) continue;
    if (world.roomMap[ci] >= 0) continue; // only corridors
    const status = tryAssignPathToCell(world, e, tx, ty);
    if (status !== 'not_found') return;
  }
  wanderNearby(world, e);
}

/** Hiding: go to assigned room or nearest office */
function handleHiding(world: World, e: Entity, dt: number): void {
  const ai = e.ai!;
  if (ai.goal !== AIGoal.HIDE || ai.path.length === 0) {
    ai.goal = AIGoal.HIDE;
    gotoAssignedOrNearest(world, e, RoomType.OFFICE);
    ai.timer = 60;
  }
  followPath(world, e, dt);
}
