/* ── Needs system: food, water, sleep, pee, poo ──────────────── */

import { type Entity, type Msg, EntityType, msg } from '../core/types';
import { Spr } from '../render/sprite_index';
import { isDebugOnePunchManEnabled, keepDebugOnePunchManAlive } from './debug_cheats';

// Rates per second
const FOOD_RATE  = 0.08;
const WATER_RATE = 0.12;
const SLEEP_RATE = 0.05;
const PEE_DIGEST = 0.10;   // pending → pee per second
const POO_DIGEST = 0.06;   // pending → poo per second

export function updateNeeds(entities: Entity[], dt: number, time: number, msgs: Msg[], playerId: number, nextId?: { v: number }): void {
  for (const e of entities) {
    if (!e.alive || !e.needs) continue;
    const n = e.needs;

    // Attribute scaling: STR slows hunger, AGI slows thirst, INT slows sleep decay
    const str = e.rpg?.str ?? 0;
    const agi = e.rpg?.agi ?? 0;
    const int = e.rpg?.int ?? 0;
    const foodRate  = FOOD_RATE  / (1 + 0.1 * str);
    const waterRate = WATER_RATE / (1 + 0.1 * agi);
    const sleepRate = SLEEP_RATE / (1 + 0.1 * int);

    n.food  = Math.max(0, n.food  - foodRate  * dt);
    n.water = Math.max(0, n.water - waterRate * dt);
    n.sleep = Math.max(0, n.sleep - sleepRate * dt);

    // Passive pee/poo growth from pending digestion
    if (n.pendingPee && n.pendingPee > 0) {
      const dp = Math.min(n.pendingPee, PEE_DIGEST * dt);
      n.pee = Math.min(100, n.pee + dp);
      n.pendingPee -= dp;
    }
    if (n.pendingPoo && n.pendingPoo > 0) {
      const dp = Math.min(n.pendingPoo, POO_DIGEST * dt);
      n.poo = Math.min(100, n.poo + dp);
      n.pendingPoo -= dp;
    }

    // Consequences
    if (e.hp === undefined) continue;
    if (e.id === playerId && isDebugOnePunchManEnabled()) {
      keepDebugOnePunchManAlive(e);
      continue;
    }

    if (n.food <= 0)  e.hp -= 0.3 * dt;
    if (n.water <= 0) e.hp -= 0.5 * dt;
    if (n.pee >= 100) e.hp -= 0.1 * dt;
    if (n.poo >= 100) e.hp -= 0.1 * dt;

    // Player warnings
    if (e.id === playerId) {
      if (n.food  < 15 && Math.random() < 0.005) addMsg(msgs, 'Вы голодны...', time, '#da4');
      if (n.water < 15 && Math.random() < 0.005) addMsg(msgs, 'Хочется пить...', time, '#48c');
      if (n.sleep < 10 && Math.random() < 0.005) addMsg(msgs, 'Глаза закрываются...', time, '#a8f');
      if (n.pee   > 85 && Math.random() < 0.005) addMsg(msgs, 'Нужен туалет...', time, '#da4');
    }

    // Death
    if (e.hp <= 0) {
      e.alive = false;
      e.hp = 0;
      // Drop NPC inventory on starvation death
      if (e.type === EntityType.NPC && nextId && e.inventory && e.inventory.length > 0) {
        for (const item of e.inventory) {
          if (!item || item.count <= 0) continue;
          entities.push({
            id: nextId.v++, type: EntityType.ITEM_DROP,
            x: e.x + (Math.random() - 0.5) * 0.5,
            y: e.y + (Math.random() - 0.5) * 0.5,
            angle: 0, pitch: 0, alive: true, speed: 0, sprite: Spr.ITEM_DROP,
            inventory: [{ defId: item.defId, count: item.count, data: item.data }],
          });
        }
        e.inventory = [];
      }
    }
  }
}

function addMsg(msgs: Msg[], text: string, time: number, color: string) {
  if (msgs.length > 0 && msgs[msgs.length - 1].text === text) return;
  msgs.push(msg(text, time, color));
}
