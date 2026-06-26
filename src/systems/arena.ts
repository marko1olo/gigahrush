import { type Entity, type GameState, msg } from '../core/types';
import { publishEvent } from './events';

import { ArenaBetOverlaySnapshot } from '../render/arenaui';

export interface ArenaBetState {
  open: boolean;
  arenaId: string;
  combatant1Id: number;
  combatant2Id: number;
  betRubles: number;
  presetIndex: number;
  presets: readonly number[];
  selectedCombatant: 1 | 2;
  message: string;
}

const runtime: ArenaBetState = {
  open: false,
  arenaId: '',
  combatant1Id: -1,
  combatant2Id: -1,
  betRubles: 10,
  presetIndex: 0,
  presets: [10, 50, 100, 500],
  selectedCombatant: 1,
  message: '',
};

let currentFighters: { c1: Entity | null, c2: Entity | null } = { c1: null, c2: null };

function calculateScore(c: Entity | null): number {
  if (!c) return 0;
  let score = (c.rpg?.level ?? 1) * 10;
  score += c.hp ?? 10;
  if (c.weapon) score += 20;
  return score;
}

function calculateOdds(c1: Entity | null, c2: Entity | null): { odds1: number, odds2: number } {
  const score1 = calculateScore(c1);
  const score2 = calculateScore(c2);

  if (score1 === 0 && score2 === 0) return { odds1: 1.0, odds2: 1.0 };

  let odds1 = 2.0;
  let odds2 = 2.0;

  if (score1 > score2 * 1.2) {
    odds1 = 1.5;
    odds2 = 3.0;
  } else if (score2 > score1 * 1.2) {
    odds1 = 3.0;
    odds2 = 1.5;
  }

  return { odds1, odds2 };
}

export function openArenaBet(state: GameState, arenaId: string, c1: Entity, c2: Entity): void {
  runtime.open = true;
  runtime.arenaId = arenaId;
  runtime.combatant1Id = c1.id;
  runtime.combatant2Id = c2.id;
  runtime.presetIndex = 0;
  runtime.betRubles = runtime.presets[0];
  runtime.selectedCombatant = 1;
  runtime.message = '';
  state.paused = true;
  currentFighters = { c1, c2 };
}

export function closeArenaBet(): void {
  runtime.open = false;
  runtime.message = '';
  currentFighters = { c1: null, c2: null };
}

export function isArenaBetOpen(): boolean {
  return runtime.open;
}

export function moveArenaBetPreset(delta: number): void {
  runtime.presetIndex = (runtime.presetIndex + delta + runtime.presets.length) % runtime.presets.length;
  runtime.betRubles = runtime.presets[runtime.presetIndex];
  runtime.message = '';
}

export function toggleArenaBetCombatant(): void {
  runtime.selectedCombatant = runtime.selectedCombatant === 1 ? 2 : 1;
  runtime.message = '';
}


export interface ActiveBet {
  amount: number;
  combatantId: number;
  odds: number;
}

let currentBet: ActiveBet | null = null;

export function placeArenaBet(state: GameState, player: Entity): boolean {
  if (!runtime.open) return false;

  const cash = Math.max(0, Math.floor(player.money ?? 0));
  if (cash < runtime.betRubles) {
    runtime.message = 'Не хватает наличных.';
    return false;
  }

  player.money = cash - runtime.betRubles;

  const { odds1, odds2 } = calculateOdds(currentFighters.c1, currentFighters.c2);
  const selectedOdds = runtime.selectedCombatant === 1 ? odds1 : odds2;
  const targetId = runtime.selectedCombatant === 1 ? runtime.combatant1Id : runtime.combatant2Id;

  currentBet = {
    amount: runtime.betRubles,
    combatantId: targetId,
    odds: selectedOdds
  };

  publishEvent(state, {
    type: 'arenabetplaced',
    actorId: player.id,
    actorName: player.name,
    actorFaction: player.faction,
    severity: 1,
    privacy: 'local',
    tags: ['arena', 'bet'],
    data: {
      arenaId: runtime.arenaId,
      amount: runtime.betRubles,
      combatantId: targetId,
      odds: selectedOdds
    },
    time: state.time
  });

  runtime.message = `Ставка принята: ${runtime.betRubles} руб.`;
  return true;
}

export function resolveArenaBet(state: GameState, player: Entity, winnerId: number): void {
    if (!currentBet) return;

    if (currentBet.combatantId === winnerId) {
        const winnings = Math.floor(currentBet.amount * currentBet.odds);
        player.money = Math.max(0, Math.floor(player.money ?? 0)) + winnings;

        publishEvent(state, {
            type: 'arenabetwon',
            actorId: player.id,
            actorName: player.name,
            actorFaction: player.faction,
            severity: 3,
            privacy: 'local',
            tags: ['arena', 'bet', 'win'],
            data: {
              amount: currentBet.amount,
              winnings: winnings,
              odds: currentBet.odds
            },
            time: state.time
        });
        state.msgs.push(msg(`Арена: Ваша ставка сыграла! Выигрыш: ${winnings} руб.`, state.time, '#8f8'));
    } else {
        publishEvent(state, {
            type: 'arenabetlost',
            actorId: player.id,
            actorName: player.name,
            actorFaction: player.faction,
            severity: 2,
            privacy: 'local',
            tags: ['arena', 'bet', 'loss'],
            data: {
              amount: currentBet.amount,
              odds: currentBet.odds
            },
            time: state.time
        });
        state.msgs.push(msg(`Арена: Ставка проиграла.`, state.time, '#f84'));
    }

    currentBet = null;
}


export function getArenaBetOverlaySnapshot(player: Entity): ArenaBetOverlaySnapshot {
  const cash = Math.max(0, Math.floor(player.money ?? 0));
  const { c1, c2 } = currentFighters;
  const { odds1, odds2 } = calculateOdds(c1, c2);

  return {
    open: runtime.open,
    arenaId: runtime.arenaId,
    combatant1Name: c1?.name ?? 'Неизвестный',
    combatant1Level: c1?.rpg?.level ?? 1,
    combatant1Hp: c1?.hp ?? 10,
    combatant1HasWeapon: !!c1?.weapon,
    combatant2Name: c2?.name ?? 'Неизвестный',
    combatant2Level: c2?.rpg?.level ?? 1,
    combatant2Hp: c2?.hp ?? 10,
    combatant2HasWeapon: !!c2?.weapon,
    cashRubles: cash,
    betRubles: runtime.betRubles,
    presetIndex: runtime.presetIndex,
    presets: runtime.presets,
    selectedCombatant: runtime.selectedCombatant,
    message: runtime.message,
    canSubmit: cash >= runtime.betRubles,
    odds1,
    odds2,
  };
}
