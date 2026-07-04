import { Room, DoorState } from '../../core/types';
import { World } from '../../core/world';

export const STUB = true;

export function spawnElevatorDoors(world: World, room: Room) {
  for (const doorIdx of room.doors) {
    const door = world.doors.get(doorIdx);
    if (door) {
      door.state = DoorState.LOCKED;
      door.keyId = 'outskirts_pass';
      door.hp = 5000;
      door.maxHp = 5000;
    }
  }
}
