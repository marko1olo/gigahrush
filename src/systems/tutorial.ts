import { DoorState, type GameState, type Entity } from '../core/types';
import type { World } from '../core/world';
import { msg } from '../core/types';

export function handleDrinkTutorial(state: GameState, world: World, player: Entity): void {
  for (const door of world.doors.values()) {
    if (door.keyId === 'tut_cafe_key' && door.state === DoorState.LOCKED) {
      if (player.needs) {
        player.needs.pee = Math.max(15, player.needs.pee);
      }
      state.msgs.push(msg('Нужно в туалет. Найди ванную.', state.time, '#fff'));
      break;
    }
  }
}

export function handleToiletTutorial(state: GameState, world: World): void {
  for (const door of world.doors.values()) {
    if (door.keyId === 'tut_cafe_key' && door.state === DoorState.LOCKED) {
      door.state = DoorState.OPEN;
      state.msgs.push(msg('Чисто и культурно.', state.time, '#8fc'));
      state.msgs.push(msg('Щелчок. Дверь в столовую разблокирована.', state.time, '#fff'));
      break;
    }
  }
}
