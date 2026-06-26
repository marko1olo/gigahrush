import { DoorState, TutorialStep, type WorldEvent, type GameState, W } from '../core/types';
import { registerWorldEventObserver } from './events';
import { registerContentRuntimeHook, type ContentRuntimeContext } from './content_hooks';
import { setDoorState } from './door_state';

// We need a data-driven approach.
export interface TutorialStepConfig {
  step: TutorialStep;
  triggerType: string;
  triggerTags: string[];
  nextStep: TutorialStep;
  successMessage: string;
  unlockConnectedDoor?: boolean;
}

export const TUTORIAL_STEPS: TutorialStepConfig[] = [
  {
    step: TutorialStep.DRINK,
    triggerType: 'interactive_used',
    triggerTags: ['sink_drink'],
    nextStep: TutorialStep.TOILET,
    successMessage: 'Отлично! Жажда утолена.',
    unlockConnectedDoor: true,
  }
];

function pushMsg(state: GameState, text: string, color = '#aaa'): void {
  const newMsg = {
    text,
    time: state.time,
    color,
    day: Math.floor(state.clock.totalMinutes / 1440),
    hour: state.clock.hour,
    minute: state.clock.minute,
  };
  state.msgs.push(newMsg);
}

export function initTutorial(): void {
  let pendingUnlockForStep: TutorialStepConfig | undefined;

  registerWorldEventObserver((state, event: WorldEvent) => {
    if (state.tutorialStep === undefined) return;

    for (const config of TUTORIAL_STEPS) {
      if (state.tutorialStep === config.step && event.type === config.triggerType) {
        if (config.triggerTags.every(tag => event.tags.includes(tag))) {
          state.tutorialStep = config.nextStep;
          pushMsg(state, config.successMessage, '#ff0');
          pendingUnlockForStep = config;
        }
      }
    }
  });

  registerContentRuntimeHook({
    id: 'tutorial_machine',
    phases: ['pre_ai'],
    update(ctx: ContentRuntimeContext) {
      if (pendingUnlockForStep) {
        const config = pendingUnlockForStep;
        pendingUnlockForStep = undefined;
        let opened = false;

        if (config.unlockConnectedDoor) {
          const px = Math.floor(ctx.player.x);
          const py = Math.floor(ctx.player.y);
          for (const door of ctx.world.doors.values()) {
            if (door.state === DoorState.CLOSED || door.state === DoorState.HERMETIC_CLOSED) {
               const doorX = door.idx % W;
               const doorY = (door.idx / W) | 0;
               const dist = Math.abs(doorX - px) + Math.abs(doorY - py);
               if (dist <= 15) {
                  setDoorState(ctx.world, door, DoorState.OPEN);
                  opened = true;
                  break;
               }
            }
          }
        }
        if (opened) return { worldChanged: true };
      }
    }
  });
}
