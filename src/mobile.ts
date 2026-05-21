import { type InputState } from './core/types';
import {
  canUseMobileFullscreen,
  enterMobileFullscreen,
  exitMobileFullscreen,
  isEmbeddedViewport,
  isMobileFullscreenActive,
  openStandalonePage,
} from './fullscreen';
import { isStandaloneDisplay } from './pwa';

export type MobileMenuId = 'inventory' | 'map' | 'quests' | 'log' | 'factions' | 'net' | 'menu' | 'debug';

interface MobileMenuItem {
  id: MobileMenuId;
  label: string;
  ariaLabel: string;
}

export interface MobileControlsContext {
  started: boolean;
  menuOpen: boolean;
  canInteract: boolean;
  gameOver: boolean;
}

export interface MobileControls {
  isEnabled(): boolean;
  refresh(): void;
  updateContext(context: MobileControlsContext): void;
  destroy(): void;
}

interface MobileControlsOptions {
  onGesture(): void;
  onMenu(menu: MobileMenuId): void;
  onConfirm(): void;
  onClose(): void;
}

type BooleanInputKey = {
  [K in keyof InputState]: InputState[K] extends boolean ? K : never;
}[keyof InputState];

const MENU_ITEMS: readonly MobileMenuItem[] = [
  { id: 'inventory', label: 'ИНВ', ariaLabel: 'Открыть инвентарь' },
  { id: 'map', label: 'КАРТА', ariaLabel: 'Открыть карту' },
  { id: 'quests', label: 'ЗАД', ariaLabel: 'Открыть задания' },
  { id: 'log', label: 'ЖУРН', ariaLabel: 'Открыть журнал сообщений' },
  { id: 'factions', label: 'ФРАК', ariaLabel: 'Открыть фракции' },
  { id: 'net', label: 'НЕТ', ariaLabel: 'Открыть НЕТ-СФЕРУ' },
  { id: 'menu', label: 'МЕНЮ', ariaLabel: 'Открыть меню сохранения' },
  { id: 'debug', label: 'ОТЛ', ariaLabel: 'Открыть отладочное меню' },
];

function shouldUseTouchControls(): boolean {
  const ua = navigator.userAgent;
  const mobileUa = /android|iphone|ipad|ipod|mobile/i.test(ua);
  const touchCapable = navigator.maxTouchPoints > 0 || 'ontouchstart' in globalThis;
  const compactViewport = Math.min(window.innerWidth, window.innerHeight) < 900;
  return mobileUa || (touchCapable && compactViewport);
}

function capturePointer(target: EventTarget | null, pointerId: number): void {
  if (target instanceof HTMLElement) {
    target.setPointerCapture(pointerId);
  }
}

function releasePointer(target: EventTarget | null, pointerId: number): void {
  if (target instanceof HTMLElement && target.hasPointerCapture(pointerId)) {
    target.releasePointerCapture(pointerId);
  }
}

function makeButton(className: string, label: string, ariaLabel: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.setAttribute('aria-label', ariaLabel);
  return button;
}

export function createMobileControls(input: InputState, options: MobileControlsOptions): MobileControls {
  const root = document.createElement('div');
  root.className = 'mobile-controls';
  root.setAttribute('aria-hidden', 'false');

  const rotate = document.createElement('div');
  rotate.className = 'mobile-rotate';
  rotate.textContent = 'Поверните телефон горизонтально';

  const movePad = makeButton('mobile-pad mobile-pad--move', '', 'Джойстик движения');
  const moveThumb = document.createElement('span');
  moveThumb.className = 'mobile-pad-thumb';
  movePad.append(moveThumb);

  const lookPad = makeButton('mobile-pad mobile-pad--look', '', 'Джойстик камеры');
  const lookThumb = document.createElement('span');
  lookThumb.className = 'mobile-pad-thumb';
  lookPad.append(lookThumb);

  const interact = makeButton('mobile-interact', 'E', 'Взаимодействие');
  const fire = makeButton('mobile-fire-zone', '', 'Атака');
  const fullscreen = makeButton('mobile-fullscreen', 'FULL', 'Полный экран');

  const menuRail = document.createElement('div');
  menuRail.className = 'mobile-menu-rail';
  const menuUp = makeButton('mobile-menu-btn', '▲', 'Меню выше');
  const menuSelect = makeButton('mobile-menu-btn mobile-menu-select', MENU_ITEMS[0].label, MENU_ITEMS[0].ariaLabel);
  const menuDown = makeButton('mobile-menu-btn', '▼', 'Меню ниже');
  menuRail.append(menuUp, menuSelect, menuDown);

  root.append(rotate, fire, fullscreen, movePad, lookPad, interact, menuRail);
  document.body.append(root);

  let enabled = false;
  let selectedMenu = 0;
  let movePointer = -1;
  let lookPointer = -1;
  let firePointer = -1;
  let moveActive = false;
  let lookActive = false;
  let context: MobileControlsContext = {
    started: false,
    menuOpen: false,
    canInteract: false,
    gameOver: false,
  };
  const pulseTimers = new Map<BooleanInputKey, ReturnType<typeof setTimeout>>();

  const setBool = (key: BooleanInputKey, value: boolean): void => {
    (input as unknown as Record<BooleanInputKey, boolean>)[key] = value;
  };

  const pulse = (key: BooleanInputKey): void => {
    setBool(key, true);
    const old = pulseTimers.get(key);
    if (old) clearTimeout(old);
    pulseTimers.set(key, setTimeout(() => {
      setBool(key, false);
      pulseTimers.delete(key);
    }, 90));
  };

  const updateTouchActive = (): void => {
    input.touch.active = moveActive || lookActive;
  };

  const clearTouchInput = (): void => {
    input.touch.moveX = 0;
    input.touch.moveY = 0;
    input.touch.lookX = 0;
    input.touch.lookY = 0;
    input.touch.active = false;
    input.mouseAttack = false;
    input.interact = false;
    input.interactHeld = false;
    moveActive = false;
    lookActive = false;
    movePointer = -1;
    lookPointer = -1;
    firePointer = -1;
    moveThumb.style.transform = '';
    lookThumb.style.transform = '';
  };

  const updateSelectedLabel = (): void => {
    menuSelect.textContent = context.menuOpen
      ? (context.gameOver ? 'R' : 'ЗАКР')
      : MENU_ITEMS[selectedMenu].label;
    menuSelect.setAttribute(
      'aria-label',
      context.menuOpen ? (context.gameOver ? 'Перезапуск' : 'Закрыть меню') : MENU_ITEMS[selectedMenu].ariaLabel,
    );
  };

  const updateFullscreenUi = (): void => {
    const standalone = isStandaloneDisplay();
    const embedded = isEmbeddedViewport();
    const nativeFullscreen = canUseMobileFullscreen();
    const active = isMobileFullscreenActive();
    const mode = standalone ? 'standalone' : embedded ? 'direct' : nativeFullscreen ? (active ? 'exit' : 'native') : 'hidden';
    fullscreen.dataset.fullscreenMode = mode;
    fullscreen.hidden = standalone || (!embedded && !nativeFullscreen);
    fullscreen.textContent = embedded ? '↗' : (active ? 'EXIT' : 'FULL');
    fullscreen.setAttribute(
      'aria-label',
      embedded ? 'Открыть игру отдельной страницей' : (isMobileFullscreenActive() ? 'Выйти из полного экрана' : 'Полный экран'),
    );
  };

  const setEnabled = (next: boolean): void => {
    enabled = next;
    root.toggleAttribute('hidden', !enabled);
    document.body.classList.toggle('mobile-controls-on', enabled);
    if (!enabled) clearTouchInput();
    updateSelectedLabel();
    updateFullscreenUi();
  };

  const refreshClasses = (): void => {
    const portrait = window.innerHeight > window.innerWidth;
    root.classList.toggle('is-started', context.started);
    root.classList.toggle('is-menu-open', context.menuOpen);
    root.classList.toggle('can-interact', context.canInteract);
    root.classList.toggle('is-game-over', context.gameOver);
    root.classList.toggle('is-portrait', portrait);
    updateSelectedLabel();
    updateFullscreenUi();
  };

  const refresh = (): void => {
    setEnabled(shouldUseTouchControls());
    refreshClasses();
  };

  const resetPad = (kind: 'move' | 'look'): void => {
    if (kind === 'move') {
      input.touch.moveX = 0;
      input.touch.moveY = 0;
      moveThumb.style.transform = '';
      moveActive = false;
    } else {
      input.touch.lookX = 0;
      input.touch.lookY = 0;
      lookThumb.style.transform = '';
      lookActive = false;
    }
    updateTouchActive();
  };

  const updatePad = (el: HTMLElement, thumb: HTMLElement, kind: 'move' | 'look', e: PointerEvent): void => {
    const rect = el.getBoundingClientRect();
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.42);
    const dx = e.clientX - (rect.left + rect.width * 0.5);
    const dy = e.clientY - (rect.top + rect.height * 0.5);
    const len = Math.hypot(dx, dy);
    const scale = len > radius ? radius / len : 1;
    const nx = (dx * scale) / radius;
    const ny = (dy * scale) / radius;
    thumb.style.transform = `translate(${nx * 34}%, ${ny * 34}%)`;
    if (kind === 'move') {
      input.touch.moveX = nx;
      input.touch.moveY = -ny;
      moveActive = true;
    } else {
      input.touch.lookX = nx;
      input.touch.lookY = ny;
      lookActive = true;
    }
    updateTouchActive();
  };

  const bindPad = (el: HTMLButtonElement, thumb: HTMLElement, kind: 'move' | 'look'): void => {
    const pointerDown = (e: PointerEvent): void => {
      if (!enabled || !context.started || context.menuOpen || context.gameOver) return;
      e.preventDefault();
      e.stopPropagation();
      options.onGesture();
      if (kind === 'move') movePointer = e.pointerId; else lookPointer = e.pointerId;
      capturePointer(el, e.pointerId);
      updatePad(el, thumb, kind, e);
    };
    const pointerMove = (e: PointerEvent): void => {
      const activePointer = kind === 'move' ? movePointer : lookPointer;
      if (e.pointerId !== activePointer) return;
      e.preventDefault();
      updatePad(el, thumb, kind, e);
    };
    const pointerEnd = (e: PointerEvent): void => {
      const activePointer = kind === 'move' ? movePointer : lookPointer;
      if (e.pointerId !== activePointer) return;
      e.preventDefault();
      releasePointer(el, e.pointerId);
      if (kind === 'move') movePointer = -1; else lookPointer = -1;
      resetPad(kind);
    };
    el.addEventListener('pointerdown', pointerDown);
    el.addEventListener('pointermove', pointerMove);
    el.addEventListener('pointerup', pointerEnd);
    el.addEventListener('pointercancel', pointerEnd);
    el.addEventListener('lostpointercapture', pointerEnd);
  };

  const holdInteractButton = (el: HTMLButtonElement): void => {
    let interactPointer = -1;
    el.addEventListener('pointerdown', e => {
      if (!enabled || !context.started) return;
      e.preventDefault();
      e.stopPropagation();
      options.onGesture();
      if (context.menuOpen) {
        options.onConfirm();
        return;
      }
      interactPointer = e.pointerId;
      capturePointer(el, e.pointerId);
      input.interact = true;
      input.interactHeld = true;
    });
    const pointerEnd = (e: PointerEvent): void => {
      if (e.pointerId !== interactPointer) return;
      e.preventDefault();
      releasePointer(el, e.pointerId);
      interactPointer = -1;
      input.interact = false;
      input.interactHeld = false;
    };
    el.addEventListener('pointerup', pointerEnd);
    el.addEventListener('pointercancel', pointerEnd);
    el.addEventListener('lostpointercapture', pointerEnd);
  };

  const menuNav = (dir: number): void => {
    options.onGesture();
    if (context.menuOpen) {
      pulse(dir < 0 ? 'invUp' : 'invDn');
    } else {
      selectedMenu = (selectedMenu + MENU_ITEMS.length + dir) % MENU_ITEMS.length;
      updateSelectedLabel();
    }
  };

  const menuConfirm = (): void => {
    options.onGesture();
    if (context.gameOver) {
      pulse('use');
    } else if (context.menuOpen) {
      options.onClose();
    } else {
      options.onMenu(MENU_ITEMS[selectedMenu].id);
    }
  };

  bindPad(movePad, moveThumb, 'move');
  bindPad(lookPad, lookThumb, 'look');
  holdInteractButton(interact);

  fullscreen.addEventListener('pointerdown', e => {
    if (!enabled || isStandaloneDisplay()) return;
    e.preventDefault();
    e.stopPropagation();
    if (isEmbeddedViewport()) {
      options.onGesture();
      openStandalonePage();
      return;
    }
    if (!canUseMobileFullscreen()) return;
    if (isMobileFullscreenActive()) {
      options.onGesture();
      void exitMobileFullscreen().finally(updateFullscreenUi);
    } else {
      const pending = enterMobileFullscreen();
      options.onGesture();
      void pending.finally(updateFullscreenUi);
    }
  });

  fire.addEventListener('pointerdown', e => {
    if (!enabled || !context.started || context.menuOpen || context.gameOver) return;
    e.preventDefault();
    e.stopPropagation();
    options.onGesture();
    firePointer = e.pointerId;
    capturePointer(fire, e.pointerId);
    input.mouseAttack = true;
  });
  const endFire = (e: PointerEvent): void => {
    if (e.pointerId !== firePointer) return;
    e.preventDefault();
    releasePointer(fire, e.pointerId);
    firePointer = -1;
    input.mouseAttack = false;
  };
  fire.addEventListener('pointerup', endFire);
  fire.addEventListener('pointercancel', endFire);
  fire.addEventListener('lostpointercapture', endFire);

  menuUp.addEventListener('pointerdown', e => {
    if (!enabled || !context.started) return;
    e.preventDefault();
    e.stopPropagation();
    menuNav(-1);
  });
  menuDown.addEventListener('pointerdown', e => {
    if (!enabled || !context.started) return;
    e.preventDefault();
    e.stopPropagation();
    menuNav(1);
  });
  menuSelect.addEventListener('pointerdown', e => {
    if (!enabled || !context.started) return;
    e.preventDefault();
    e.stopPropagation();
    menuConfirm();
  });

  const onResize = (): void => refresh();
  window.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('resize', onResize);
  window.visualViewport?.addEventListener('scroll', onResize);
  document.addEventListener('fullscreenchange', onResize);
  document.addEventListener('webkitfullscreenchange', onResize);
  refresh();

  return {
    isEnabled: () => enabled,
    refresh,
    updateContext(next: MobileControlsContext): void {
      context = next;
      refreshClasses();
    },
    destroy(): void {
      for (const timer of pulseTimers.values()) clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('scroll', onResize);
      document.removeEventListener('fullscreenchange', onResize);
      document.removeEventListener('webkitfullscreenchange', onResize);
      document.body.classList.remove('mobile-controls-on');
      root.remove();
    },
  };
}
