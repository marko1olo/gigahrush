/* ── Input handler: keyboard + mouse (pointer lock) ──────────── */

import { type InputState } from './core/types';
import {
  applyControlCode,
  clearControlInputs,
  consumeControlCaptureCode,
  getControlCaptureAction,
  matchesControlAction,
} from './systems/controls';

export function createInput(): InputState {
  return {
    fwd: false, back: false, left: false, right: false,
    strafeL: false, strafeR: false,
    attack: false, interact: false, interactHeld: false, pickup: false,
    map: false, inv: false, invUp: false, invDn: false, invLeft: false, invRight: false,
    use: false, escape: false,
    questLog: false,
    mouseAttack: false,
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
}

function clearPointerState(input: InputState): void {
  input.mouse.dx = 0;
  input.mouse.dy = 0;
  input.mouseAttack = false;
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
      if (!e.metaKey && !e.ctrlKey && !e.altKey) consumeControlCaptureCode(e.code);
      e.preventDefault();
      return;
    }
    if (matchesControlAction('fullscreen', e.code)) {
      e.preventDefault();
      options.onFullscreenToggle?.();
      return;
    }
    if (e.code === 'KeyE') input.controlEdit = true;
    if (e.code === 'Backspace') input.controlReset = true;
    if (e.code === 'Enter') input.controlClose = true;
    applyControlCode(input, e.code, true);
    e.preventDefault();
  };

  const onUp = (e: KeyboardEvent) => {
    if (e.code === 'KeyE') input.controlEdit = false;
    if (e.code === 'Backspace') input.controlReset = false;
    if (e.code === 'Enter') input.controlClose = false;
    applyControlCode(input, e.code, false);
  };

  const onMouse = (e: MouseEvent) => {
    if (document.pointerLockElement === canvas) {
      input.mouse.dx += e.movementX;
      input.mouse.dy += e.movementY;
      input.mouse.locked = true;
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
      if (document.pointerLockElement === canvas) input.mouseAttack = true;
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      input.mouseAttack = false;
    }
  };

  const onLockChange = () => {
    input.mouse.locked = document.pointerLockElement === canvas;
    if (!input.mouse.locked) {
      clearPointerState(input);
      clearControlInputs(input);
      input.controlEdit = false;
      input.controlReset = false;
      input.controlClose = false;
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
    document.removeEventListener('pointerlockchange', onLockChange);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('blur', onBlur, true);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
