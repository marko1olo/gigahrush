/* ── Input handler: keyboard + mouse (pointer lock) ──────────── */

import { type InputState } from './core/types';

type BooleanInputKey = {
  [K in keyof InputState]: InputState[K] extends boolean ? K : never;
}[keyof InputState];

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
    mouse: { dx: 0, dy: 0, locked: false },
    touch: { moveX: 0, moveY: 0, lookX: 0, lookY: 0, active: false },
  };
}

export function bindInput(input: InputState, canvas: HTMLCanvasElement): () => void {
  const keyMap: Record<string, BooleanInputKey> = {
    KeyW: 'fwd', KeyS: 'back',
    ArrowUp: 'fwd', ArrowDown: 'back',
    ArrowLeft: 'left', ArrowRight: 'right',
    KeyA: 'strafeL', KeyD: 'strafeR',
    Space: 'attack',
    KeyE: 'interact',
    KeyF: 'factionMenu',
    KeyL: 'logMenu',
    KeyM: 'map',
    KeyI: 'inv',
    KeyR: 'use', // restart (handled in main)
    KeyG: 'use', // tool activation
    KeyQ: 'questLog',
    // Russian layout equivalents
    KeyC: 'fwd',   // Ц -> W pos
    KeyY: 'fwd',   // fallback
  };

  const onDown = (e: KeyboardEvent) => {
    const k = keyMap[e.code];
    if (k) input[k] = true;
    // Inventory / menu navigation
    if (e.code === 'ArrowUp' || e.code === 'KeyW') input.invUp = true;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') input.invDn = true;
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.invLeft = true;
    if (e.code === 'ArrowRight') input.invRight = true;
    if (e.code === 'KeyD') input.drop = true;
    if (e.code === 'Enter') { input.escape = true; e.preventDefault(); return; }
    if (e.code === 'Digit1') input.attrStr = true;
    if (e.code === 'Digit2') input.attrAgi = true;
    if (e.code === 'Digit3') input.attrInt = true;
    if (e.code === 'Backquote') input.debugScreen = true;
    if (e.code === 'KeyP') input.pee = true;
    if (e.code === 'KeyZ') input.sleep = true;
    e.preventDefault();
  };

  const onUp = (e: KeyboardEvent) => {
    const k = keyMap[e.code];
    if (k) input[k] = false;
    input.invUp = false;
    input.invDn = false;
    input.invLeft = false;
    input.invRight = false;
    if (e.code === 'KeyR' || e.code === 'KeyG') input.use = false;
    if (e.code === 'KeyD') input.drop = false;
    if (e.code === 'Enter') input.escape = false;
    if (e.code === 'Digit1') input.attrStr = false;
    if (e.code === 'Digit2') input.attrAgi = false;
    if (e.code === 'Digit3') input.attrInt = false;
    if (e.code === 'Backquote') input.debugScreen = false;
    if (e.code === 'KeyP') input.pee = false;
    if (e.code === 'KeyZ') input.sleep = false;
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
    if (!input.mouse.locked) input.mouseAttack = false;
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
