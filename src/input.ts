/* ── Input handler: keyboard + mouse (pointer lock) ──────────── */

import { type InputState } from './core/types';
import {
  applyControlCode,
  clearControlInputs,
  consumeControlCaptureCode,
  getControlCaptureAction,
} from './systems/controls';

export function createInput(): InputState {
  return {
    fwd: false, back: false, left: false, right: false,
    strafeL: false, strafeR: false,
    attack: false, interact: false, pickup: false,
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
    controlReset: false,
    mouse: { dx: 0, dy: 0, locked: false },
    touch: { moveX: 0, moveY: 0, lookX: 0, lookY: 0, active: false },
  };
}

export function bindInput(input: InputState, canvas: HTMLCanvasElement): () => void {
  const onDown = (e: KeyboardEvent) => {
    if (getControlCaptureAction()) {
      if (!e.metaKey && !e.ctrlKey && !e.altKey) consumeControlCaptureCode(e.code);
      e.preventDefault();
      return;
    }
    applyControlCode(input, e.code, true);
    e.preventDefault();
  };

  const onUp = (e: KeyboardEvent) => {
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
    if (document.pointerLockElement !== canvas) {
      canvas.requestPointerLock();
    }
  };

  const onMouseDown = (e: MouseEvent) => {
    if (e.button === 0 && document.pointerLockElement === canvas) {
      input.mouseAttack = true;
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
      input.mouseAttack = false;
      clearControlInputs(input);
    }
  };

  document.addEventListener('keydown', onDown);
  document.addEventListener('keyup', onUp);
  document.addEventListener('mousemove', onMouse);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('pointerlockchange', onLockChange);

  return () => {
    document.removeEventListener('keydown', onDown);
    document.removeEventListener('keyup', onUp);
    document.removeEventListener('mousemove', onMouse);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('pointerlockchange', onLockChange);
  };
}
