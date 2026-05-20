import { EntityType, type Entity, type GameState, type PlayerDamageRecord, type PlayerDamageSourceKind } from '../core/types';
import { entityDisplayName } from '../entities/monster';

const DEATH_CAUSE_LOOKBACK_SEC = 4;
const DEATH_CAUSE_LOOKAHEAD_SEC = 1.5;

function roundDamage(amount: number): number {
  return Math.max(0, Math.round(amount * 10) / 10);
}

function damageSourceKind(source: Entity | undefined): PlayerDamageSourceKind {
  if (!source) return 'unknown';
  if (source.type === EntityType.MONSTER) return 'monster';
  if (source.type === EntityType.NPC) return 'npc';
  if (source.type === EntityType.PROJECTILE) return 'projectile';
  return 'unknown';
}

function sourceName(source: Entity | undefined, kind: PlayerDamageSourceKind): string {
  if (source) return entityDisplayName(source);
  switch (kind) {
    case 'hazard': return 'опасная зона';
    case 'need': return 'истощение';
    case 'samosbor': return 'самосбор';
    default: return 'неизвестный источник';
  }
}

export function recordPlayerDamage(
  state: GameState | undefined,
  source: Entity | undefined,
  amount: number,
  detail?: string,
  sourceKind: PlayerDamageSourceKind = damageSourceKind(source),
): void {
  if (!state || !Number.isFinite(amount) || amount <= 0) return;
  const rounded = roundDamage(amount);
  const name = sourceName(source, sourceKind);
  state.lastDamage = {
    time: state.time,
    tick: state.tick,
    amount: rounded,
    sourceKind,
    sourceId: source?.id,
    sourceName: name,
    monsterKind: source?.monsterKind,
    weaponId: source?.weapon,
    detail: detail && detail.length > 0 ? detail : `${name}: -${rounded}`,
  };
}

export function formatLastPlayerDamageCause(
  state: GameState,
  deathTime: number,
): string | undefined {
  const last: PlayerDamageRecord | undefined = state.lastDamage;
  if (!last) return undefined;
  if (last.time < deathTime - DEATH_CAUSE_LOOKBACK_SEC || last.time > deathTime + DEATH_CAUSE_LOOKAHEAD_SEC) return undefined;
  return last.detail || `${last.sourceName}: -${last.amount}`;
}
