import { type GameState, type WorldEvent, msg } from '../core/types';
import { registerWorldEventObserver } from './events';

let tutorialHintShown = false;

function onWorldEvent(state: GameState, event: WorldEvent): void {
  if (event.type === 'player_craft_item') {
    // If the player crafted something (part of the tutorial), we can trigger samosbor.
    if (state.currentFloor === 2 && !state.samosborActive && state.samosborTimer > 0) {
      state.msgs.push(msg('Отлично! Ты научился крафтить.', state.time, '#4af'));
      // Samosbor will be forced on the next tick if we zero the timer.
      state.samosborTimer = 0;
    }
  }

  // The instruction requires the player to be prompted: "Подойди к станку и собери что-нибудь."
  // A simple way to do this is when the player picks up the resources (metal_sheet or cloth_roll)
  // in the tutorial room. Or just checking quest progress.
  if (!tutorialHintShown && event.type === 'player_pick_item' && state.currentFloor === 2) {
    if (event.itemId === 'metal_sheet' || event.itemId === 'cloth_roll') {
      state.msgs.push(msg('Подойди к станку и собери что-нибудь.', state.time, '#9cf'));
      tutorialHintShown = true;
    }
  }
}

export function initTutorialSystem(): void {
  registerWorldEventObserver(onWorldEvent);
}
