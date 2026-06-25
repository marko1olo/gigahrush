/* ── Input handler: keyboard + mouse (pointer lock) ──────────── */

import { type InputState } from './core/types';
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
    attack: false, interact: false, interactHeld: false, pickup: false,
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
  input.menuAccept = false;
  input.menuClose = false;
  input.menuWheel = 0;
  input.textInput = '';
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

function captureTextInput(input: InputState, e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  let text = '';
  if (e.key === 'Backspace') text = '\b';
  else if (e.key === 'Delete') text = '\x7f';
  else if (e.key.length === 1) text = e.key;
  if (!text) return;
  input.textInput = (input.textInput + text).slice(-64);
}

class InputBinder {
  private pointerLockClickStarted = false;
  private pointerLockAllowedAtMouseDown = false;

  constructor(
    private readonly input: InputState,
    private readonly canvas: HTMLCanvasElement,
    private readonly options: InputBindOptions
  ) {}

  private readonly onDown = (e: KeyboardEvent) => {
    if (getControlCaptureAction()) {
      consumeControlCaptureCode(e.code);
      e.preventDefault();
      return;
    }
    if (matchesControlAction('fullscreen', e.code)) {
      e.preventDefault();
      this.options.onFullscreenToggle?.();
    }
    if (this.options.shouldCaptureTextInput?.() === true) captureTextInput(this.input, e);
    applyControlCode(this.input, e.code, true);
    e.preventDefault();
  };

  private readonly onUp = (e: KeyboardEvent) => {
    applyControlCode(this.input, e.code, false);
  };

  private readonly onMouse = (e: MouseEvent) => {
    if (document.pointerLockElement === this.canvas) {
      this.input.mouse.locked = true;
      if (this.options.shouldHandleGameplayPointer?.() === false) {
        clearMouseGameplayState(this.input);
        return;
      }
      this.input.mouse.dx += e.movementX;
      this.input.mouse.dy += e.movementY;
    }
  };

  private readonly onClick = () => {
    const allowedAtMouseDown = this.pointerLockClickStarted ? this.pointerLockAllowedAtMouseDown : true;
    this.pointerLockClickStarted = false;
    this.pointerLockAllowedAtMouseDown = false;
    if (!allowedAtMouseDown) return;
    if (this.options.shouldRequestPointerLock?.() === false) return;
    requestPointerLockSafe(this.canvas);
  };

  private readonly onMenuMouseDown = (e: MouseEvent) => {
    if (getControlCaptureAction()) {
      consumeControlCaptureCode(mouseButtonCode(e.button));
      this.pointerLockClickStarted = true;
      this.pointerLockAllowedAtMouseDown = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    if (this.options.shouldHandleMenuPointer?.() === true) {
      if (e.button === 0) {
        this.input.menuAccept = true;
      } else if (e.button === 2) {
        this.input.menuClose = true;
      } else {
        return;
      }
      this.pointerLockClickStarted = true;
      this.pointerLockAllowedAtMouseDown = false;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
  };

  private readonly onMouseDown = (e: MouseEvent) => {
    if (getControlCaptureAction()) {
      consumeControlCaptureCode(mouseButtonCode(e.button));
      this.pointerLockClickStarted = true;
      this.pointerLockAllowedAtMouseDown = false;
      e.preventDefault();
      return;
    }
    const code = mouseButtonCode(e.button);
    if (e.button === 0) {
      this.pointerLockClickStarted = true;
      this.pointerLockAllowedAtMouseDown = this.options.shouldRequestPointerLock?.() !== false;
    }
    if (document.pointerLockElement === this.canvas && this.options.shouldHandleGameplayPointer?.() !== false) {
      applyControlCode(this.input, code, true);
    } else {
      applyControlCode(this.input, code, false);
    }
    if (e.button === 2) {
      e.preventDefault();
    }
  };

  private readonly onMouseUp = (e: MouseEvent) => {
    applyControlCode(this.input, mouseButtonCode(e.button), false);
    if (e.button === 2) {
      e.preventDefault();
    }
  };

  private readonly onContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  private readonly onWheel = (e: WheelEvent) => {
    const shouldHandle = this.options.shouldHandleMenuWheel ?? this.options.shouldHandleMenuPointer;
    if (shouldHandle?.() !== true) return;
    const dy = Number(e.deltaY);
    if (Number.isFinite(dy) && dy !== 0) {
      this.input.menuWheel += dy < 0 ? -1 : 1;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  private readonly onLockChange = () => {
    this.input.mouse.locked = document.pointerLockElement === this.canvas;
    if (!this.input.mouse.locked) {
      clearPointerState(this.input);
      this.input.controlEdit = false;
      this.input.controlReset = false;
      this.input.controlClose = false;
      this.input.menuAccept = false;
      this.input.menuClose = false;
      this.input.menuWheel = 0;
      this.input.textInput = '';
    } else if (this.options.shouldHandleGameplayPointer?.() === false) {
      clearMouseGameplayState(this.input);
    }
  };

  private readonly onBlur = () => {
    clearLostInputState(this.input, this.canvas);
  };

  private readonly onVisibilityChange = () => {
    if (document.hidden) clearLostInputState(this.input, this.canvas);
  };

  bind() {
    document.addEventListener('keydown', this.onDown);
    document.addEventListener('keyup', this.onUp);
    document.addEventListener('mousemove', this.onMouse);
    document.addEventListener('mousedown', this.onMenuMouseDown, { capture: true });
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('mouseup', this.onMouseUp);
    document.addEventListener('wheel', this.onWheel, { capture: true, passive: false });
    this.canvas.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('pointerlockchange', this.onLockChange);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('blur', this.onBlur, true);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  unbind() {
    document.removeEventListener('keydown', this.onDown);
    document.removeEventListener('keyup', this.onUp);
    document.removeEventListener('mousemove', this.onMouse);
    document.removeEventListener('mousedown', this.onMenuMouseDown, { capture: true });
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('wheel', this.onWheel, { capture: true });
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('blur', this.onBlur, true);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }
}

export function bindInput(input: InputState, canvas: HTMLCanvasElement, options: InputBindOptions = {}): () => void {
  const binder = new InputBinder(input, canvas, options);
  binder.bind();
  return () => binder.unbind();
}
