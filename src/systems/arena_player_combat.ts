import { Entity, EntityType, DoorState, GameState } from '../core/types';
import { ARENA_WAVES } from '../data/arena_waves';
import { canSpawnEntityType } from './entity_limits';
import { setDoorState } from './door_state';
import { World } from '../core/world';
import { publishEvent } from './events';

export interface ArenaSurvivalState {
    isActive: boolean;
    currentWave: number;
    maxWaves: number;
    timerMs: number;
    activeEnemies: number[]; // Массив ID врагов текущей волны
    roomId: string;
}

export const survivalState: ArenaSurvivalState = {
    isActive: false, currentWave: 0, maxWaves: 10, timerMs: 0, activeEnemies: [], roomId: ''
};

function lockArenaDoors(world: World): void {
    const rId = Number(survivalState.roomId);
    for (const [_, door] of world.doors.entries()) {
        if (door.roomA === rId || door.roomB === rId) {
            setDoorState(world, door, DoorState.HERMETIC_CLOSED);
        }
    }
}

function unlockArenaDoors(world: World): void {
    const rId = Number(survivalState.roomId);
    for (const [_, door] of world.doors.entries()) {
        if (door.roomA === rId || door.roomB === rId) {
            setDoorState(world, door, DoorState.OPEN);
        }
    }
}

// Функция старта испытания
export function startArenaSurvival(world: World, state: GameState, roomId: string): void {
    survivalState.isActive = true;
    survivalState.currentWave = 0;
    survivalState.maxWaves = ARENA_WAVES.length;
    survivalState.timerMs = ARENA_WAVES[0].prepTimeMs;
    survivalState.activeEnemies = [];
    survivalState.roomId = roomId;

    // Блокируем двери арены
    lockArenaDoors(world);
    publishEvent(state, {
        type: 'arena_survival_started' as any,
        floor: state.currentFloor,
        roomId: Number(roomId),
        severity: 4,
        privacy: 'public',
        tags: ['arena', 'started']
    });
}

// Function to find spawn position in a room
function findSpawnPointInRoom(world: World, roomId: string): {x: number, y: number} | null {
    const roomNum = Number(roomId);
    if(isNaN(roomNum)) return null;
    let found = false;
    let rx = 0, ry = 0;

    for (let cy = 0; cy < 256; cy++) {
        for (let cx = 0; cx < 256; cx++) {
            if (world.roomMap[cy * 256 + cx] === roomNum && world.cells[cy * 256 + cx] === 0 /* Cell.FLOOR */) {
                rx = cx;
                ry = cy;
                found = true;
                break;
            }
        }
        if(found) break;
    }
    return found ? {x: rx + 0.5, y: ry + 0.5} : null;
}

// Функция спавна волны
export function spawnNextWave(world: World, entities: Entity[], nextEntityId: { v: number }, state: GameState, player: Entity): void {
    if (survivalState.currentWave >= ARENA_WAVES.length) return;

    // Check engine limits
    if (survivalState.activeEnemies.length > 20) return; // Wait for player to clear out more enemies

    const config = ARENA_WAVES[survivalState.currentWave];

    for (const mobDef of config.mobs) {
        for (let i = 0; i < mobDef.count; i++) {
            if (canSpawnEntityType(entities, EntityType.MONSTER)) {
                const pos = findSpawnPointInRoom(world, survivalState.roomId);
                if (pos) {
                    const id = nextEntityId.v++;
                    const mob: Entity = {
                        id,
                        type: EntityType.MONSTER,
                        x: pos.x,
                        y: pos.y,
                        angle: 0,
                        pitch: 0,
                        alive: true,
                        speed: 2,
                        sprite: 0,
                        monsterKind: mobDef.kind,
                        hp: 100,
                        maxHp: 100,
                        ai: {
                            tx: player.x, ty: player.y, goal: 0, pi: 0, stuck: 0, timer: 0,
                            combatTargetId: player.id,
                            state: 'hunt',
                            homeX: pos.x,
                            homeY: pos.y,
                            path: [],
                            alertTimer: 10,
                            goals: []
                        } as any
                    };
                    entities.push(mob);
                    survivalState.activeEnemies.push(id);
                }
            }
        }
    }

    publishEvent(state, {
        type: 'arena_wave_started' as any,
        floor: state.currentFloor,
        roomId: Number(survivalState.roomId),
        severity: 4,
        privacy: 'public',
        tags: ['arena', 'wave']
    });
}

export function updateArenaSurvival(world: World, entities: Entity[], player: Entity, state: GameState, dt: number, nextEntityId: { v: number }): void {
    if (!survivalState.isActive) return;

    if (!player.alive) {
        survivalState.isActive = false;
        return;
    }

    survivalState.activeEnemies = survivalState.activeEnemies.filter(id => {
        const e = entities.find(ent => ent.id === id);
        return e && e.alive;
    });

    if (survivalState.activeEnemies.length === 0) {
        if (survivalState.currentWave >= survivalState.maxWaves) {
            survivalState.isActive = false;
            unlockArenaDoors(world);
            publishEvent(state, {
                type: 'arena_survival_won' as any,
                floor: state.currentFloor,
                roomId: Number(survivalState.roomId),
                severity: 4,
                privacy: 'public',
                tags: ['arena', 'won']
            });
            return;
        }

        survivalState.timerMs -= dt * 1000;

        if (survivalState.timerMs <= 0) {
            spawnNextWave(world, entities, nextEntityId, state, player);
            survivalState.currentWave++;
        }
    } else {
        for (const id of survivalState.activeEnemies) {
            const e = entities.find(ent => ent.id === id);
            if (e && e.ai) {
                e.ai.tx = player.x;
                e.ai.ty = player.y;
                e.ai.combatTargetId = player.id;
            }
        }
    }
}
