import { type InputState } from '../core/types';

type BooleanInputKey = {
  [K in keyof InputState]: InputState[K] extends boolean ? K : never;
}[keyof InputState];

interface ControlActionDefBase {
  id: string;
  group: string;
  label: string;
  input?: BooleanInputKey;
  defaultKeys: readonly string[];
}

export const CONTROL_ACTIONS = [
  { id: 'moveForward', group: 'Движение', label: 'Вперёд', input: 'fwd', defaultKeys: ['KeyW', 'ArrowUp', 'KeyC', 'KeyY'] },
  { id: 'moveBackward', group: 'Движение', label: 'Назад', input: 'back', defaultKeys: ['KeyS', 'ArrowDown'] },
  { id: 'turnLeft', group: 'Движение', label: 'Поворот влево', input: 'left', defaultKeys: ['ArrowLeft'] },
  { id: 'turnRight', group: 'Движение', label: 'Поворот вправо', input: 'right', defaultKeys: ['ArrowRight'] },
  { id: 'strafeLeft', group: 'Движение', label: 'Шаг влево', input: 'strafeL', defaultKeys: ['KeyA'] },
  { id: 'strafeRight', group: 'Движение', label: 'Шаг вправо', input: 'strafeR', defaultKeys: ['KeyD'] },
  { id: 'attack', group: 'Бой', label: 'Атака / выстрел', input: 'attack', defaultKeys: ['Space'] },
  { id: 'interact', group: 'Бой', label: 'Взаимодействовать / подтвердить', input: 'interact', defaultKeys: ['KeyE'] },
  { id: 'useTool', group: 'Бой', label: 'Использовать инструмент', input: 'use', defaultKeys: ['KeyG', 'KeyR'] },
  { id: 'sleep', group: 'Состояние', label: 'Спать, удерживать', input: 'sleep', defaultKeys: ['KeyZ'] },
  { id: 'pee', group: 'Состояние', label: 'Пописать', input: 'pee', defaultKeys: ['KeyP'] },
  { id: 'gameMenu', group: 'Экраны', label: 'Меню / назад / закрыть', input: 'escape', defaultKeys: ['Enter'] },
  { id: 'controlsMenu', group: 'Экраны', label: 'Все клавиши', input: 'controls', defaultKeys: ['Tab'] },
  { id: 'inventory', group: 'Экраны', label: 'Инвентарь', input: 'inv', defaultKeys: ['KeyI'] },
  { id: 'map', group: 'Экраны', label: 'Карта: мини / полная / выкл.', input: 'map', defaultKeys: ['KeyM'] },
  { id: 'quests', group: 'Экраны', label: 'Задания', input: 'questLog', defaultKeys: ['KeyQ'] },
  { id: 'factions', group: 'Экраны', label: 'Фракции / A-Life', input: 'factionMenu', defaultKeys: ['KeyF'] },
  { id: 'log', group: 'Экраны', label: 'Журнал сообщений', input: 'logMenu', defaultKeys: ['KeyL'] },
  { id: 'netSphere', group: 'Экраны', label: 'НЕТ-СФЕРА', defaultKeys: ['KeyN'] },
  { id: 'debug', group: 'Экраны', label: 'Отладка', input: 'debugScreen', defaultKeys: ['Backquote'] },
  { id: 'netSubmit', group: 'НЕТ-СФЕРА', label: 'Отправить сообщение', defaultKeys: ['Enter'] },
  { id: 'netClose', group: 'НЕТ-СФЕРА', label: 'Закрыть чат', defaultKeys: ['Escape'] },
  { id: 'netErase', group: 'НЕТ-СФЕРА', label: 'Удалить символ', defaultKeys: ['Backspace'] },
  { id: 'menuUp', group: 'Меню', label: 'Выбор вверх', input: 'invUp', defaultKeys: ['KeyW', 'ArrowUp'] },
  { id: 'menuDown', group: 'Меню', label: 'Выбор вниз', input: 'invDn', defaultKeys: ['KeyS', 'ArrowDown'] },
  { id: 'menuLeft', group: 'Меню', label: 'Влево / предыдущая', input: 'invLeft', defaultKeys: ['KeyA', 'ArrowLeft'] },
  { id: 'menuRight', group: 'Меню', label: 'Вправо / следующая', input: 'invRight', defaultKeys: ['KeyD', 'ArrowRight'] },
  { id: 'drop', group: 'Инвентарь', label: 'Выбросить / перенести вправо', input: 'drop', defaultKeys: ['KeyD'] },
  { id: 'attrStr', group: 'Инвентарь', label: 'Очко в силу', input: 'attrStr', defaultKeys: ['Digit1'] },
  { id: 'attrAgi', group: 'Инвентарь', label: 'Очко в ловкость', input: 'attrAgi', defaultKeys: ['Digit2'] },
  { id: 'attrInt', group: 'Инвентарь', label: 'Очко в интеллект', input: 'attrInt', defaultKeys: ['Digit3'] },
  { id: 'controlReset', group: 'Экран клавиш', label: 'Сбросить выбранную', input: 'controlReset', defaultKeys: ['Backspace'] },
] as const satisfies readonly ControlActionDefBase[];

export type ControlActionId = typeof CONTROL_ACTIONS[number]['id'];
type ControlBindings = Record<ControlActionId, string[]>;

const CONTROL_STORAGE_KEY = 'gigahrush_control_bindings_v1';

const CODE_LABELS: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Backquote: '~',
  Backspace: 'Backspace',
  Enter: 'Enter',
  Escape: 'Esc',
  Space: 'Пробел',
  Tab: 'Tab',
};

let bindings = loadControlBindings();
let captureAction: ControlActionId | null = null;

function actionInput(action: typeof CONTROL_ACTIONS[number]): BooleanInputKey | undefined {
  return 'input' in action ? action.input : undefined;
}

function defaultBindings(): ControlBindings {
  const out = {} as ControlBindings;
  for (const action of CONTROL_ACTIONS) out[action.id] = [...action.defaultKeys];
  return out;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function uniqueCodes(codes: readonly unknown[]): string[] {
  const out: string[] = [];
  for (const raw of codes) {
    if (typeof raw !== 'string' || raw.length < 2 || raw.length > 32) continue;
    if (!out.includes(raw)) out.push(raw);
  }
  return out;
}

function normalizeBindings(raw: unknown): ControlBindings {
  const out = defaultBindings();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const src = raw as Record<string, unknown>;
  for (const action of CONTROL_ACTIONS) {
    const codes = src[action.id];
    if (Array.isArray(codes)) out[action.id] = uniqueCodes(codes);
  }
  return out;
}

function loadControlBindings(): ControlBindings {
  const s = storage();
  if (!s) return defaultBindings();
  try {
    return normalizeBindings(JSON.parse(s.getItem(CONTROL_STORAGE_KEY) ?? 'null'));
  } catch {
    return defaultBindings();
  }
}

function saveControlBindings(): void {
  const s = storage();
  if (!s) return;
  try {
    s.setItem(CONTROL_STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // Local storage can be blocked. The current in-memory bindings still work.
  }
}

export function keyCodeLabel(code: string): string {
  if (CODE_LABELS[code]) return CODE_LABELS[code];
  if (code.startsWith('Key') && code.length === 4) return code.slice(3);
  if (code.startsWith('Digit') && code.length === 6) return code.slice(5);
  if (code.startsWith('Numpad')) return `Num ${code.slice(6)}`;
  return code;
}

export function controlBindings(actionId: ControlActionId): readonly string[] {
  return bindings[actionId] ?? [];
}

export function controlBindingLabel(actionId: ControlActionId): string {
  const codes = controlBindings(actionId);
  return codes.length > 0 ? codes.map(keyCodeLabel).join(' / ') : '—';
}

export function controlHint(actionId: ControlActionId): string {
  return `[${controlBindingLabel(actionId)}]`;
}

export function matchesControlAction(actionId: ControlActionId, code: string): boolean {
  return controlBindings(actionId).includes(code);
}

export function applyControlCode(input: InputState, code: string, pressed: boolean): boolean {
  let matched = false;
  for (const action of CONTROL_ACTIONS) {
    const key = actionInput(action);
    if (!key || !matchesControlAction(action.id, code)) continue;
    input[key] = pressed;
    matched = true;
  }
  return matched;
}

export function clearControlInputs(input: InputState): void {
  const cleared: Partial<Record<BooleanInputKey, true>> = {};
  for (const action of CONTROL_ACTIONS) {
    const key = actionInput(action);
    if (!key || cleared[key]) continue;
    input[key] = false;
    cleared[key] = true;
  }
}

export function setControlPrimaryBinding(actionId: ControlActionId, code: string): void {
  const current = [...controlBindings(actionId)];
  const rest = current.filter(existing => existing !== code);
  bindings[actionId] = uniqueCodes([code, ...rest]);
  saveControlBindings();
}

export function resetControlBinding(actionId: ControlActionId): void {
  const action = CONTROL_ACTIONS.find(def => def.id === actionId);
  if (!action) return;
  bindings[actionId] = [...action.defaultKeys];
  saveControlBindings();
}

export function resetAllControlBindings(): void {
  bindings = defaultBindings();
  saveControlBindings();
}

export function beginControlCapture(actionId: ControlActionId): void {
  captureAction = actionId;
}

export function cancelControlCapture(): void {
  captureAction = null;
}

export function getControlCaptureAction(): ControlActionId | null {
  return captureAction;
}

export function consumeControlCaptureCode(code: string): boolean {
  if (!captureAction) return false;
  if (code === 'Escape') {
    captureAction = null;
    return true;
  }
  if (code === 'Backspace') {
    resetControlBinding(captureAction);
    captureAction = null;
    return true;
  }
  setControlPrimaryBinding(captureAction, code);
  captureAction = null;
  return true;
}
