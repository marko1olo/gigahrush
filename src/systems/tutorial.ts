import { type Entity, type GameState, msg } from '../core/types';
import { registerWorldEventObserver, publishEvent } from './events';

export enum TutorialStep {
  DRINK = 0,
  TOILET = 1,
  EAT = 2,
  WORK = 3,
  CRAFT = 4,
  SAMOSBOR = 5,
  ESCAPE = 6,
  DONE = 7,
}

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

registerWorldEventObserver((state, event) => {
  if (!state.tutorialMode) return;

  if (event.type === 'player_craft_item' && state.tutorialStep === TutorialStep.CRAFT) {
    logTutorialMsg(state, '-отлично, инструмент готов. Руки всё ещё помнят.', state.time + 15);
    state.tutorialStep = TutorialStep.SAMOSBOR;
    state.samosborTimer = 0; // Force Samosbor to start immediately
    publishEvent(state, {
      type: 'samosbor_warning',
      severity: 4,
      privacy: 'public',
      tags: ['samosbor', 'warning', 'forced', 'tutorial'],
    });
  }
});
