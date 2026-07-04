import { type Entity, type GameState, msg, DoorState } from '../core/types';
import { type World } from '../core/world';
import { registerWorldEventObserver } from './events';
import { registerContentRuntimeHook } from './content_hooks';
import { setDoorState } from './door_state';

export enum TutorialStep {
  DRINK = 0,
  TOILET = 1,
  EAT = 2,
  WORK = 3,
  SAMOSBOR = 4,
  ESCAPE = 5,
  DONE = 6,
}

export const TUTORIAL_HINT_CANTEEN = 'Голод. Сходи в столовую.';
export const TUTORIAL_HINT_FACTORY = 'Сытно! Теперь на работу.';

export function unlockFactoryDoor(world: World): void {
  for (const door of world.doors.values()) {
    if (door.keyId === 'tut_factory_key') {
      setDoorState(world, door, DoorState.OPEN);
      return;
    }
  }
}

registerWorldEventObserver((state, event) => {
  if (!state.tutorialMode) return;

  if (event.type === 'player_pick_item' && (event.itemId === 'bread' || event.itemId === 'canned')) {
    if (state.tutorialStep === TutorialStep.EAT) {
      logTutorialMsg(state, 'Открой инвентарь и съешь это.', state.time + 15);
    }
  }

  if (event.type === 'player_use_item' && (event.itemId === 'bread' || event.itemId === 'canned')) {
    if (state.tutorialStep === TutorialStep.EAT) {
      state.tutorialStep = TutorialStep.WORK;
      logTutorialMsg(state, TUTORIAL_HINT_FACTORY, state.time + 15);
      state.tutorialUnlockFactoryDoor = true;
    }
  }
});

registerContentRuntimeHook({
  id: 'tutorial_unlock_factory_door',
  phases: ['post_ai'],
  update: ({ state, world }) => {
    if (state.tutorialUnlockFactoryDoor) {
      unlockFactoryDoor(world);
      state.tutorialUnlockFactoryDoor = false;
    }
  },
});

export function logTutorialMsg(state: GameState, text: string, time: number): void {
  const m = msg(text, time, '#fff');
  m.hour = state.clock?.hour ?? 8;
  m.minute = state.clock?.minute ?? 0;
  state.msgs.push(m);
  if (state.msgLog) state.msgLog.push(m);
}

export function startTutorial(state: GameState, player: Entity): void {
  state.tutorialMode = true;
  state.tutorialStep = TutorialStep.DRINK;
  if (player.needs) {
    player.needs.water = 20;
    player.needs.pee = 50;
    player.needs.poo = 50;
  }
  logTutorialMsg(state, '-где я?', state.time + 15);
  logTutorialMsg(state, '-я хочу пить', state.time + 15);
}



export function completeTutorial(state: GameState): void {
  if (!state.tutorialMode) return;
  state.tutorialMode = false;
  state.tutorialStep = TutorialStep.DONE;
  state.msgs.push(msg('Обучение завершено. Вы предоставлены сами себе.', state.time, '#8fc'));
}
