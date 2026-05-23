import { Cell, Feature, W, msg, type Entity, type GameState } from '../core/types';
import { World } from '../core/world';
import { GAMBLING_MACHINES, getGamblingMachineDef, type GamblingDefId, type GamblingMachineDef } from '../data/gambling';
import { publishEvent } from './events';

export interface GamblingMachine {
  idx: number;
  x: number;
  y: number;
  defId: GamblingDefId;
}

export interface GamblingBetOutcome {
  win: boolean;
  stake: number;
  grossPayout: number;
  net: number;
}

export interface GamblingOverlaySnapshot {
  open: boolean;
  machineIdx: number;
  label: string;
  betRubles: number;
  cashRubles: number;
  presetIndex: number;
  presets: readonly number[];
  minBet: number;
  maxBet: number;
  houseEdge: number;
  message: string;
  canSubmit: boolean;
}

const gamblingRegistry = new Map<number, GamblingMachine>();

const runtime = {
  open: false,
  machineIdx: -1,
  activeDefId: 'slots' as GamblingDefId,
  presetIndex: 0,
  message: '',
};

function cleanMoney(actor: Entity): number {
  const money = actor.money ?? 0;
  return Number.isFinite(money) ? Math.max(0, Math.floor(money)) : 0;
}

function canUseMachineCell(world: World, idx: number): boolean {
  if (world.aptMask[idx] || world.hermoWall[idx]) return false;
  const cell = world.cells[idx];
  if (cell === Cell.DOOR || cell === Cell.LIFT || cell === Cell.ABYSS) return false;
  const feature = world.features[idx];
  return feature === Feature.NONE || feature === Feature.MACHINE;
}

function currentDef(): GamblingMachineDef {
  return GAMBLING_MACHINES[runtime.activeDefId] ?? GAMBLING_MACHINES.slots;
}

function clampPreset(): void {
  const def = currentDef();
  runtime.presetIndex = ((runtime.presetIndex % def.presets.length) + def.presets.length) % def.presets.length;
}

export function clearGamblingMachines(): void {
  gamblingRegistry.clear();
}

export function getGamblingMachineAt(world: World, x: number, y: number): GamblingMachine | undefined {
  return gamblingRegistry.get(world.idx(Math.floor(x), Math.floor(y)));
}

export function isGamblingMachineTarget(world: World, x: number, y: number): boolean {
  return !!getGamblingMachineAt(world, x, y);
}

export function placeGamblingMachine(world: World, x: number, y: number, defId: GamblingDefId): GamblingMachine | null {
  const def = getGamblingMachineDef(defId);
  if (!def) return null;
  const idx = world.idx(x, y);
  if (!canUseMachineCell(world, idx)) return null;
  world.setFeatureAt(idx, Feature.MACHINE);
  const machine: GamblingMachine = { idx, x: idx % W, y: (idx / W) | 0, defId: def.id };
  gamblingRegistry.set(idx, machine);
  return machine;
}

export function openGamblingMachine(state: GameState, machine: GamblingMachine): void {
  runtime.open = true;
  runtime.machineIdx = machine.idx;
  runtime.activeDefId = machine.defId;
  runtime.presetIndex = 0;
  runtime.message = '';
  state.paused = true;
  if (typeof document !== 'undefined' && document.pointerLockElement) document.exitPointerLock();
}

export function closeGamblingMachine(): void {
  runtime.open = false;
  runtime.machineIdx = -1;
  runtime.message = '';
}

export function isGamblingOverlayOpen(): boolean {
  return runtime.open;
}

export function moveGamblingPreset(delta: number): void {
  runtime.presetIndex += delta;
  clampPreset();
  runtime.message = '';
}

export function resolveGamblingBet(def: GamblingMachineDef, stake: number, roll: number): GamblingBetOutcome {
  const cleanStake = Math.max(0, Math.floor(stake));
  const win = roll >= 0 && roll < def.winChance;
  const grossPayout = win ? Math.floor(cleanStake * def.payoutMultiplier) : 0;
  return {
    win,
    stake: cleanStake,
    grossPayout,
    net: grossPayout - cleanStake,
  };
}

export function activateGamblingBet(
  world: World,
  state: GameState,
  player: Entity,
  roll = Math.random(),
): GamblingBetOutcome | null {
  const machine = gamblingRegistry.get(runtime.machineIdx);
  const def = machine ? getGamblingMachineDef(machine.defId) : undefined;
  if (!machine || !def) {
    runtime.message = 'Автомат исчез из учета.';
    return null;
  }

  clampPreset();
  const stake = Math.max(def.minBet, Math.min(def.maxBet, def.presets[runtime.presetIndex] ?? def.minBet));
  const cash = cleanMoney(player);
  if (cash < stake) {
    runtime.message = 'Не хватает наличных.';
    state.msgs.push(msg(runtime.message, state.time, '#f84'));
    return null;
  }

  player.money = cash - stake;
  const outcome = resolveGamblingBet(def, stake, roll);
  player.money = cleanMoney(player) + outcome.grossPayout;
  runtime.message = outcome.win
    ? `${def.label}: выигрыш ${outcome.grossPayout} руб.`
    : `${def.label}: ставка ушла в бетон.`;

  const zoneId = world.zoneMap[machine.idx];
  const roomId = world.roomMap[machine.idx];
  publishEvent(state, {
    type: 'gambling_bet',
    zoneId,
    roomId: roomId >= 0 ? roomId : undefined,
    x: machine.x + 0.5,
    y: machine.y + 0.5,
    actorId: player.id,
    actorName: player.name,
    actorFaction: player.faction,
    itemValue: stake,
    severity: 1,
    privacy: 'local',
    tags: ['gambling', def.id, 'bet'],
    data: { stake, machineId: def.id, houseEdge: def.houseEdge },
  });
  publishEvent(state, {
    type: outcome.win ? 'gambling_win' : 'gambling_loss',
    zoneId,
    roomId: roomId >= 0 ? roomId : undefined,
    x: machine.x + 0.5,
    y: machine.y + 0.5,
    actorId: player.id,
    actorName: player.name,
    actorFaction: player.faction,
    itemValue: Math.abs(outcome.net),
    severity: outcome.win ? 3 : 2,
    privacy: 'local',
    tags: ['gambling', def.id, outcome.win ? 'win' : 'loss'],
    data: {
      stake,
      grossPayout: outcome.grossPayout,
      net: outcome.net,
      machineId: def.id,
    },
  });
  state.msgs.push(msg(runtime.message, state.time, outcome.win ? '#8f8' : '#f84'));
  return outcome;
}

export function getGamblingOverlaySnapshot(player: Entity): GamblingOverlaySnapshot {
  const def = currentDef();
  clampPreset();
  const bet = Math.max(def.minBet, Math.min(def.maxBet, def.presets[runtime.presetIndex] ?? def.minBet));
  const cash = cleanMoney(player);
  return {
    open: runtime.open,
    machineIdx: runtime.machineIdx,
    label: def.label,
    betRubles: bet,
    cashRubles: cash,
    presetIndex: runtime.presetIndex,
    presets: def.presets,
    minBet: def.minBet,
    maxBet: def.maxBet,
    houseEdge: def.houseEdge,
    message: runtime.message,
    canSubmit: cash >= bet,
  };
}
