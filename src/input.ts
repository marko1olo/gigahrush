/* ── Input handler: keyboard + mouse (pointer lock) ──────────── */

import { type InputState } from './core/types';
import {
  applyControlCode,
  cancelControlCapture,
  clearControlInputs,
  consumeControlCaptureCode,
  getControlCaptureAction,
  isControlResetCode,
  isMenuCloseCode,
  matchesControlAction,
} from './systems/controls';

export function createInput(): InputState {
  return {
    fwd: false, back: false, left: false, right: false,
    strafeL: false, strafeR: false, sprint: false,
    attack: false, interact: false, interactHeld: false, pickup: false,
    map: false, mapLegend: false, inv: false, invUp: false, invDn: false, invLeft: false, invRight: false,
    use: false, escape: false,
    questLog: false,
    mouseAttack: false, mouseUse: false,
    attrStr: false, attrAgi: false, attrInt: false,
    debugScreen: false,
    pee: false,
    drop: false,
    factionMenu: false,
    logMenu: false,
    sleep: false,
    controls: false,
    uiSettings: false,
    controlEdit: false,
    controlReset: false,
    controlClose: false,
    mouse: { dx: 0, dy: 0, locked: false },
    touch: { moveX: 0, moveY: 0, lookX: 0, lookY: 0, active: false },
  };
}

interface InputBindOptions {
  onFullscreenToggle?: () => void;
  shouldRequestPointerLock?: () => boolean;
  shouldHandleGameplayPointer?: () => boolean;
}

function clearMouseGameplayState(input: InputState): void {
  input.mouse.dx = 0;
  input.mouse.dy = 0;
  input.mouseAttack = false;
  input.mouseUse = false;
}

function clearPointerState(input: InputState): void {
  clearMouseGameplayState(input);
  input.touch.moveX = 0;
  input.touch.moveY = 0;
  input.touch.lookX = 0;
  input.touch.lookY = 0;
  input.touch.active = false;
}

function clearLostInputState(input: InputState, canvas: HTMLCanvasElement): void {
  clearControlInputs(input);
  input.controlEdit = false;
  input.controlReset = false;
  input.controlClose = false;
  clearPointerState(input);
  input.mouse.locked = document.pointerLockElement === canvas;
}

function requestPointerLockSafe(canvas: HTMLCanvasElement): void {
  if (document.pointerLockElement === canvas) return;
  const requestPointerLock = canvas.requestPointerLock;
  if (typeof requestPointerLock !== 'function') return;
  try {
    const result = requestPointerLock.call(canvas) as Promise<void> | void;
    result?.catch?.(() => {
      // Pointer lock may be denied outside a user-activation window.
    });
  } catch {
    // Some embedded browsers expose pointer lock but still throw synchronously.
  }
}

export function bindInput(input: InputState, canvas: HTMLCanvasElement, options: InputBindOptions = {}): () => void {
  let pointerLockClickStarted = false;
  let pointerLockAllowedAtMouseDown = false;

  const onDown = (e: KeyboardEvent) => {
    if (getControlCaptureAction()) {
      if (isControlResetCode(e.code)) {
        cancelControlCapture();
        input.controlReset = true;
        e.preventDefault();
        return;
      }
      if (isMenuCloseCode(e.code)) {
        cancelControlCapture();
        input.controlClose = true;
        e.preventDefault();
        return;
      }
      if (!e.metaKey && !e.ctrlKey && !e.altKey) consumeControlCaptureCode(e.code);
      e.preventDefault();
      return;
    }
    if (matchesControlAction('fullscreen', e.code)) {
      e.preventDefault();
      options.onFullscreenToggle?.();
      return;
    }
    if (isControlResetCode(e.code)) {
      input.controlReset = true;
      e.preventDefault();
      return;
    }
    if (isMenuCloseCode(e.code)) {
      input.controlClose = true;
      e.preventDefault();
      return;
    }
    applyControlCode(input, e.code, true);
    e.preventDefault();
  };

  const onUp = (e: KeyboardEvent) => {
    if (isControlResetCode(e.code)) {
      input.controlReset = false;
      return;
    }
    if (isMenuCloseCode(e.code)) {
      input.controlClose = false;
      return;
    }
    applyControlCode(input, e.code, false);
  };

  const onMouse = (e: MouseEvent) => {
    if (document.pointerLockElement === canvas) {
      input.mouse.locked = true;
      if (options.shouldHandleGameplayPointer?.() === false) {
        clearMouseGameplayState(input);
        return;
      }
      input.mouse.dx += e.movementX;
      input.mouse.dy += e.movementY;
    }
  };

  const onClick = () => {
    const allowedAtMouseDown = pointerLockClickStarted ? pointerLockAllowedAtMouseDown : true;
    pointerLockClickStarted = false;
    pointerLockAllowedAtMouseDown = false;
    if (!allowedAtMouseDown) return;
    if (options.shouldRequestPointerLock?.() === false) return;
    requestPointerLockSafe(canvas);
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      pointerLockClickStarted = true;
      pointerLockAllowedAtMouseDown = options.shouldRequestPointerLock?.() !== false;
      if (document.pointerLockElement === canvas && options.shouldHandleGameplayPointer?.() !== false) input.mouseAttack = true;
      else input.mouseAttack = false;
    } else if (e.button === 2) {
      if (document.pointerLockElement === canvas && options.shouldHandleGameplayPointer?.() !== false) input.mouseUse = true;
      else input.mouseUse = false;
      e.preventDefault();
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      input.mouseAttack = false;
    } else if (e.button === 2) {
      input.mouseUse = false;
      e.preventDefault();
    }
  };

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  const onLockChange = () => {
    input.mouse.locked = document.pointerLockElement === canvas;
    if (!input.mouse.locked) {
      clearPointerState(input);
      clearControlInputs(input);
      input.controlEdit = false;
      input.controlReset = false;
      input.controlClose = false;
    } else if (options.shouldHandleGameplayPointer?.() === false) {
      clearMouseGameplayState(input);
    }
  };

  const onBlur = () => {
    clearLostInputState(input, canvas);
  };

  const onVisibilityChange = () => {
    if (document.hidden) clearLostInputState(input, canvas);
  };

  document.addEventListener('keydown', onDown);
  document.addEventListener('keyup', onUp);
  document.addEventListener('mousemove', onMouse);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('pointerlockchange', onLockChange);
  window.addEventListener('blur', onBlur);
  document.addEventListener('blur', onBlur, true);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    document.removeEventListener('keydown', onDown);
    document.removeEventListener('keyup', onUp);
    document.removeEventListener('mousemove', onMouse);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    canvas.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('pointerlockchange', onLockChange);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('blur', onBlur, true);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
