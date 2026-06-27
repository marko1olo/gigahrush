/* ── Input handler: keyboard + mouse (pointer lock) ──────────── */

import type { InputState } from './core/types';
import {
  applyControlCode,
  clearControlInputs,
  consumeControlCaptureCode,
  getControlCaptureAction,
  matchesControlAction,
  mouseButtonCode,
} from './systems/controls';

export function createInput(): InputState {
  return {
    fwd: false, back: false, left: false, right: false,
    strafeL: false, strafeR: false, sprint: false,
    attack: false, interact: false, interactHeld: false, pickup: false, reload: false,
    map: false, mapLegend: false, inv: false, invUp: false, invDn: false, invLeft: false, invRight: false,
    use: false, escape: false,
    questLog: false,
    mouseAttack: false, mouseUse: false,
    menuAccept: false, menuClose: false, menuWheel: 0, textInput: '',
    attrStr: false, attrAgi: false, attrInt: false,
    debugScreen: false,
    pee: false,
    drop: false,
    factionMenu: false,
    logMenu: false,
    help: false,
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
  shouldHandleMenuPointer?: () => boolean;
  shouldHandleMenuWheel?: () => boolean;
  shouldCaptureTextInput?: () => boolean;
}

function clearMouseGameplayState(input: InputState): void {
  input.mouse.dx = 0;
  input.mouse.dy = 0;
  input.mouseAttack = false;
  input.mouseUse = false;
  for (let button = 0; button <= 4; button++) applyControlCode(input, mouseButtonCode(button), false);
}

function clearTouchState(input: InputState): void {
  input.touch.moveX = 0;
  input.touch.moveY = 0;
  input.touch.lookX = 0;
  input.touch.lookY = 0;
  input.touch.active = false;
}

function clearPointerState(input: InputState): void {
  clearMouseGameplayState(input);
  clearTouchState(input);
}

function clearLostInputState(input: InputState, canvas: HTMLCanvasElement): void {
  clearControlInputs(input);
  input.controlEdit = false;
  input.controlReset = false;
  input.controlClose = false;
  input.menuAccept = false;
  input.menuClose = false;
  input.menuWheel = 0;
  input.textInput = '';
  clearPointerState(input);
  input.mouse.locked = document.pointerLockElement === canvas;
}

function requestPointerLockSafe(canvas: HTMLCanvasElement): void {
  if (document.pointerLockElement === canvas) return;
  try {
    const result = canvas.requestPointerLock?.() as Promise<void> | void;
    result?.catch?.(() => {
      // Pointer lock may be denied outside a user-activation window.
    });
  } catch {
    // Some embedded browsers expose pointer lock but still throw synchronously.
  }
}

function captureTextInput(input: InputState, e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  let text = '';
  if (e.key === 'Backspace') text = '\b';
  else if (e.key === 'Delete') text = '\x7f';
  else if (e.key.length === 1) text = e.key;
  if (!text) return;
  input.textInput = (input.textInput + text).slice(-64);
}

export function bindInput(input: InputState, canvas: HTMLCanvasElement, options: InputBindOptions = {}): () => void {
  let pointerLockClickStarted = false;
  let pointerLockAllowedAtMouseDown = false;

  const onDown = (e: KeyboardEvent) => {
    if (getControlCaptureAction()) {
      consumeControlCaptureCode(e.code);
      e.preventDefault();
      return;
    }
    if (matchesControlAction('fullscreen', e.code)) {
      e.preventDefault();
      options.onFullscreenToggle?.();
    }
    if (options.shouldCaptureTextInput?.() === true) captureTextInput(input, e);
    applyControlCode(input, e.code, true);
    e.preventDefault();
  };

  const onUp = (e: KeyboardEvent) => {
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

  const onMenuMouseDown = (e: MouseEvent) => {
    if (getControlCaptureAction()) {
      consumeControlCaptureCode(mouseButtonCode(e.button));
      pointerLockClickStarted = true;
      pointerLockAllowedAtMouseDown = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (options.shouldHandleMenuPointer?.() === true) {
      if (e.button === 0) {
        input.menuAccept = true;
      } else if (e.button === 2) {
        input.menuClose = true;
      } else {
        return;
      }
      pointerLockClickStarted = true;
      pointerLockAllowedAtMouseDown = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    if (getControlCaptureAction()) {
      consumeControlCaptureCode(mouseButtonCode(e.button));
      pointerLockClickStarted = true;
      pointerLockAllowedAtMouseDown = false;
      e.preventDefault();
      return;
    }
    const code = mouseButtonCode(e.button);
    if (e.button === 0) {
      pointerLockClickStarted = true;
      pointerLockAllowedAtMouseDown = options.shouldRequestPointerLock?.() !== false;
    }
    if (document.pointerLockElement === canvas && options.shouldHandleGameplayPointer?.() !== false) {
      applyControlCode(input, code, true);
    } else {
      applyControlCode(input, code, false);
    }
    if (e.button === 2) {
      e.preventDefault();
    }
  };

  const onMouseUp = (e: MouseEvent) => {
    applyControlCode(input, mouseButtonCode(e.button), false);
    if (e.button === 2) {
      e.preventDefault();
    }
  };

  const onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  const onWheel = (e: WheelEvent) => {
    const shouldHandle = options.shouldHandleMenuWheel ?? options.shouldHandleMenuPointer;
    if (shouldHandle?.() !== true) return;
    const dy = Number(e.deltaY);
    if (Number.isFinite(dy) && dy !== 0) {
      input.menuWheel += dy < 0 ? -1 : 1;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  const onLockChange = () => {
    input.mouse.locked = document.pointerLockElement === canvas;
    if (!input.mouse.locked) {
      clearPointerState(input);
      input.controlEdit = false;
      input.controlReset = false;
      input.controlClose = false;
      input.menuAccept = false;
      input.menuClose = false;
      input.menuWheel = 0;
      input.textInput = '';
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
  document.addEventListener('mousedown', onMenuMouseDown, { capture: true });
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('wheel', onWheel, { capture: true, passive: false });
  canvas.addEventListener('contextmenu', onContextMenu);
  document.addEventListener('pointerlockchange', onLockChange);
  window.addEventListener('blur', onBlur);
  document.addEventListener('blur', onBlur, true);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    document.removeEventListener('keydown', onDown);
    document.removeEventListener('keyup', onUp);
    document.removeEventListener('mousemove', onMouse);
    document.removeEventListener('mousedown', onMenuMouseDown, { capture: true });
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('wheel', onWheel, { capture: true });
    canvas.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('pointerlockchange', onLockChange);
    window.removeEventListener('blur', onBlur);
    document.removeEventListener('blur', onBlur, true);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
