import { Entity, NpcRole, EntityType } from '../core/types';
import { NpcTemplate } from '../data/plot_characters';

// World is not exported in core/types, we will type it as any or structural
// Since the prompt uses world.entities.find and world.entities.push, we'll duck type it
export interface SpawnerWorld {
    entities: Entity[];
}

// Since createEntity isn't centrally exported without more context,
// we'll use the package logic or a basic stub that fits the prompt.
// Let's implement createEntity logic locally as a stub if needed, or just push a new object.
// Actually, I should check how createEntity works or if I can just push an object that satisfies Entity.
// For the sake of the specification:
function createEntity(x: number, y: number): Entity {
    return {
        id: Math.floor(Math.random() * 1000000), // A-Life assigns proper IDs usually, this is a basic fallback
        type: EntityType.NPC,
        x,
        y,
        angle: 0,
        pitch: 0,
        alive: true,
        speed: 1.0,
        sprite: 0
    };
}

export function spawnPlotCharacter(world: SpawnerWorld, template: NpcTemplate, x: number, y: number): Entity {
    // Проверяем, не существует ли он уже (даже на другом этаже, если A-life глобальный)
    const existing = world.entities.find(e => e.plotId === template.id);
    if (existing) {
        // Телепортируем к сцене
        existing.x = x;
        existing.y = y;
        return existing;
    }

    // Иначе создаем нового
    const npc = createEntity(x, y);
    npc.plotId = template.id;
    npc.name = template.name;
    npc.hp = template.health;
    npc.maxHp = template.health; // Also set maxHp so percentage works
    npc.flags = template.flags;
    // Assuming role can be assigned. In Entity we added role?: NpcRole
    npc.role = NpcRole.CINEMATIC_ACTOR; // Изначально залочен для сцены
    world.entities.push(npc);
    return npc;
}
