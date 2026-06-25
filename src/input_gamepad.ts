/* ── Physical gamepad adapter (browser Gamepad API) ──────────────
 *
 * Polls `navigator.getGamepads()` once per game tick and translates a
 * `standard`-mapped controller into the universal `InputFrame`. Edge
 * detection lives here so the resolver only sees per-frame held/pressed/
 * released sets. No DOM gameplay logic, no haptics by default.
 *
 * Default standard-mapping intent (see `xinput.md`):
 *   axes[0/1] → moveX/moveY
 *   axes[2/3] → lookX/lookY (lookY honors invertLookY)
 *   button 0 (A) → interact press / menuAccept
 *   button 1 (B) → menuClose press
 *   button 2 (X) → useTool hold
 *   button 3 (Y) → inventory press
 *   button 4 (LB) → log press
 *   button 5 (RB) → factions press
 *   button 6 (LT) → useTool hold (analog)
 *   button 7 (RT) → attack hold
 *   button 8 (Back/View) → map press
 *   button 9 (Start/Menu) → gameMenu press
 *   button 10 (L3) → sprint hold
 *   button 11 (R3) → no-op (reserved)
 *   buttons 12-15 (D-pad) → menu nav up/down/left/right
 */

import {
  type InputFrame,
  applyStickDeadzone,
  applyTriggerCurve,
  mergeAxis,
  pressAction,
  releaseAction,
  setActionHeld,
  setActiveDevice,
  setMenuNav,
} from './systems/input_intent';
import {
  loadGamepadSettings,
  type GamepadSettings,
} from './systems/gamepad_settings';
import { type ControlActionId } from './systems/controls';

type ActionMap = Partial<Record<number, ControlActionId>>;

const BUTTON_HOLD_ACTIONS: ActionMap = {
  2: 'useTool',
  6: 'useTool',
  7: 'attack',
  10: 'sprint',
  // D-pad mirrors keyboard arrow keys: held → menu navigation boolean true,
  // release → false. Without this, `setMenuNav` would set `input.invDn = true`
  // on the press edge and never clear it, causing menus to auto-scroll forever
  // after a single D-pad nudge.
  12: 'menuUp',
  13: 'menuDown',
  14: 'menuLeft',
  15: 'menuRight',
};

const BUTTON_EDGE_ACTIONS: ActionMap = {
  0: 'interact',
  1: 'menuClose',
  3: 'inventory',
  4: 'log',
  5: 'factions',
  8: 'map',
  9: 'gameMenu',
};

const STANDARD_BUTTON_COUNT = 17;

interface GamepadAdapterState {
  attached: boolean;
  activeIndex: number;
  prevButtons: boolean[];
  hadAnyInput: boolean;
  lastLabel: string;
  lastConnected: boolean;
  lastMappingStandard: boolean;
}

export interface GamepadAdapter {
  poll(frame: InputFrame): void;
  detach(): void;
  isConnected(): boolean;
  hadAnyInput(): boolean;
  settings(): GamepadSettings;
}

function nav(): Navigator | null {
  if (typeof navigator === 'undefined') return null;
  return navigator;
}

function safeGetGamepads(): (Gamepad | null)[] {
  const n = nav();
  if (!n || typeof n.getGamepads !== 'function') return [];
  try {
    return Array.from(n.getGamepads() ?? []);
  } catch {
    return [];
  }
}

function pickActivePad(state: GamepadAdapterState): Gamepad | null {
  const pads = safeGetGamepads();
  if (pads.length === 0) return null;
  if (state.activeIndex >= 0 && state.activeIndex < pads.length) {
    const cur = pads[state.activeIndex];
    if (cur && cur.connected) return cur;
  }
  let bestIdx = -1;
  let bestPad: Gamepad | null = null;
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];
    if (!pad || !pad.connected) continue;
    if (pad.mapping === 'standard' && bestIdx === -1) {
      bestIdx = i;
      bestPad = pad;
    }
  }
  if (bestPad) state.activeIndex = bestIdx;
  return bestPad;
}

function getButton(pad: Gamepad, idx: number): { pressed: boolean; value: number } {
  const btn = pad.buttons[idx];
  if (!btn) return { pressed: false, value: 0 };
  if (typeof btn === 'number') return { pressed: btn > 0.5, value: btn };
  return { pressed: !!btn.pressed, value: typeof btn.value === 'number' ? btn.value : (btn.pressed ? 1 : 0) };
}

export function createGamepadAdapter(): GamepadAdapter {
  const state: GamepadAdapterState = {
    attached: false,
    activeIndex: -1,
    prevButtons: new Array(STANDARD_BUTTON_COUNT).fill(false),
    hadAnyInput: false,
    lastLabel: '',
    lastConnected: false,
    lastMappingStandard: false,
  };

  const onConnected = (e: GamepadEvent) => {
    if (state.activeIndex < 0 && e.gamepad && e.gamepad.connected) {
      state.activeIndex = e.gamepad.index;
      state.lastLabel = typeof e.gamepad.id === 'string' ? e.gamepad.id.slice(0, 64) : '';
    }
  };
  const onDisconnected = (e: GamepadEvent) => {
    if (e.gamepad && e.gamepad.index === state.activeIndex) {
      state.activeIndex = -1;
      state.prevButtons.fill(false);
      state.lastConnected = false;
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('gamepadconnected', onConnected);
    window.addEventListener('gamepaddisconnected', onDisconnected);
    state.attached = true;
  }

  function poll(frame: InputFrame): void {
    const settings = loadGamepadSettings();
    if (!settings.enabled) {
      state.prevButtons.fill(false);
      state.lastConnected = false;
      return;
    }
    const pad = pickActivePad(state);
    if (!pad) {
      // Clear holds on disconnect: emit releases for any previously held button.
      for (let i = 0; i < state.prevButtons.length; i++) {
        if (!state.prevButtons[i]) continue;
        const holdId = BUTTON_HOLD_ACTIONS[i];
        if (holdId) releaseAction(frame, holdId);
        const edgeId = BUTTON_EDGE_ACTIONS[i];
        if (edgeId) releaseAction(frame, edgeId);
        state.prevButtons[i] = false;
      }
      state.lastConnected = false;
      state.lastMappingStandard = false;
      frame.hardware.gamepadConnected = false;
      frame.hardware.gamepadMappingStandard = false;
      frame.hardware.gamepadLabel = state.lastLabel;
      return;
    }

    state.lastConnected = true;
    state.lastMappingStandard = pad.mapping === 'standard';
    state.lastLabel = typeof pad.id === 'string' ? pad.id.slice(0, 64) : state.lastLabel;
    frame.hardware.gamepadConnected = true;
    frame.hardware.gamepadMappingStandard = state.lastMappingStandard;
    frame.hardware.gamepadLabel = state.lastLabel;

    if (!state.lastMappingStandard) {
      // Non-standard: leave prevButtons alone, do nothing this tick.
      return;
    }

    let anyInput = false;

    // ── Sticks ──────────────────────────────────────────────
    const axes = pad.axes;
    if (axes.length >= 2) {
      const move = applyStickDeadzone(axes[0] ?? 0, axes[1] ?? 0, settings.moveDeadzone, settings.moveCurve);
      if (move.x !== 0) {
        mergeAxis(frame, 'moveX', move.x);
        anyInput = true;
      }
      if (move.y !== 0) {
        mergeAxis(frame, 'moveY', -move.y); // gameplay treats moveY positive = forward
        anyInput = true;
      }
    }
    if (axes.length >= 4) {
      const look = applyStickDeadzone(axes[2] ?? 0, axes[3] ?? 0, settings.lookDeadzone, settings.lookCurve);
      if (look.x !== 0) {
        mergeAxis(frame, 'lookX', look.x * settings.lookSensitivity);
        anyInput = true;
      }
      if (look.y !== 0) {
        const sign = settings.invertLookY ? -1 : 1;
        mergeAxis(frame, 'lookY', sign * look.y * settings.lookSensitivity);
        anyInput = true;
      }
    }

    // ── Triggers (LT/RT analog → held semantics) ────────────
    const ltCurve = applyTriggerCurve(getButton(pad, 6).value, settings.triggerThreshold, Math.min(0.95, settings.triggerThreshold + 0.2));
    const rtCurve = applyTriggerCurve(getButton(pad, 7).value, settings.triggerThreshold, Math.min(0.95, settings.triggerThreshold + 0.2));

    // ── Buttons & edges ─────────────────────────────────────
    for (let i = 0; i < STANDARD_BUTTON_COUNT; i++) {
      let pressedNow = getButton(pad, i).pressed;
      if (i === 6) pressedNow = ltCurve.held;
      if (i === 7) pressedNow = rtCurve.held;
      const wasPressed = state.prevButtons[i];

      const holdId = BUTTON_HOLD_ACTIONS[i];
      if (holdId && pressedNow) setActionHeld(frame, holdId, true);

      const edgeId = BUTTON_EDGE_ACTIONS[i];
      if (edgeId) {
        if (pressedNow && !wasPressed) pressAction(frame, edgeId);
        else if (!pressedNow && wasPressed) releaseAction(frame, edgeId);
        else if (pressedNow) setActionHeld(frame, edgeId, true);
      } else if (holdId) {
        if (!pressedNow && wasPressed) releaseAction(frame, holdId);
      }

      // D-pad → menu nav edges (12 up, 13 down, 14 left, 15 right)
      if (i >= 12 && i <= 15 && pressedNow && !wasPressed) {
        if (i === 12) setMenuNav(frame, 'up', true);
        if (i === 13) setMenuNav(frame, 'down', true);
        if (i === 14) setMenuNav(frame, 'left', true);
        if (i === 15) setMenuNav(frame, 'right', true);
      }

      if (pressedNow !== wasPressed) anyInput = true;
      state.prevButtons[i] = pressedNow;
    }

    if (anyInput) {
      state.hadAnyInput = true;
      setActiveDevice(frame, 'gamepad');
    }
  }

  function detach(): void {
    if (!state.attached) return;
    if (typeof window !== 'undefined') {
      window.removeEventListener('gamepadconnected', onConnected);
      window.removeEventListener('gamepaddisconnected', onDisconnected);
    }
    state.attached = false;
  }

  return {
    poll,
    detach,
    isConnected: () => state.lastConnected,
    hadAnyInput: () => state.hadAnyInput,
    settings: () => loadGamepadSettings(),
  };
}
