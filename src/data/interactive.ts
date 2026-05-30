import {
  Cell,
  ContainerKind,
  Feature,
  Tex,
  type WorldEventSeverity,
  type WorldEventType,
} from '../core/types';

export type InteractiveSurfaceLayer = 'block' | 'feature' | 'container' | 'billboard';

export type InteractiveActionKind =
  | 'drink_water'
  | 'relieve'
  | 'repair_pending'
  | 'message'
  | 'open_container';

export type InteractiveVisualDef =
  | { kind: 'feature'; feature: Feature }
  | { kind: 'container'; containerKind?: ContainerKind }
  | { kind: 'cell'; cell: Cell; wallTex?: Tex; floorTex?: Tex }
  | { kind: 'billboard'; sprite: number; scale?: number; z?: number };

export interface InteractiveTargetDef {
  range: number;
  priority: number;
}

export interface InteractiveActionDef {
  id: string;
  label: string;
  kind: InteractiveActionKind;
  cooldownSeconds?: number;
  waterDelta?: number;
  peeDelta?: number;
  pooDelta?: number;
  message?: string;
  color?: string;
  eventType?: WorldEventType;
  eventSeverity?: WorldEventSeverity;
}

export interface InteractiveDef {
  id: string;
  layer: InteractiveSurfaceLayer;
  label: string;
  prompt: string;
  tags: readonly string[];
  visual: InteractiveVisualDef;
  target: InteractiveTargetDef;
  actions: readonly InteractiveActionDef[];
}

const registry = new Map<string, InteractiveDef>();

export function registerInteractiveDef(def: InteractiveDef): void {
  registry.set(def.id, def);
}

export function getInteractiveDef(defId: string): InteractiveDef | undefined {
  return registry.get(defId);
}

export function allInteractiveDefs(): InteractiveDef[] {
  return [...registry.values()];
}

export const INTERACTIVE_DEFS = [
  {
    id: 'sink_drink',
    layer: 'feature',
    label: 'Раковина',
    prompt: ' пить',
    tags: ['water', 'needs', 'sink', 'kitchen', 'bathroom'],
    visual: { kind: 'feature', feature: Feature.SINK },
    target: { range: 2.25, priority: 66 },
    actions: [
      {
        id: 'drink',
        label: 'Пить',
        kind: 'drink_water',
        cooldownSeconds: 6,
        waterDelta: 28,
        peeDelta: 8,
        message: 'Вы пьете из раковины. Вода холодная, с привкусом трубы.',
        color: '#6cf',
        eventType: 'interactive_used',
        eventSeverity: 1,
      },
    ],
  },
  {
    id: 'sink_broken',
    layer: 'feature',
    label: 'Сломанная раковина',
    prompt: ' сломанная раковина',
    tags: ['water', 'needs', 'sink', 'kitchen', 'bathroom', 'broken', 'repair'],
    visual: { kind: 'feature', feature: Feature.SINK },
    target: { range: 2.25, priority: 78 },
    actions: [
      {
        id: 'inspect_broken',
        label: 'Осмотреть',
        kind: 'repair_pending',
        cooldownSeconds: 2,
        message: 'Раковина сломана. Нужен ремонт: кран держится на честном слове.',
        color: '#9ab',
        eventType: 'interactive_used',
        eventSeverity: 0,
      },
    ],
  },
  {
    id: 'toilet_relief',
    layer: 'feature',
    label: 'Туалет',
    prompt: ' туалет',
    tags: ['needs', 'toilet', 'bathroom'],
    visual: { kind: 'feature', feature: Feature.TOILET },
    target: { range: 2.25, priority: 64 },
    actions: [
      {
        id: 'relieve',
        label: 'Воспользоваться',
        kind: 'relieve',
        cooldownSeconds: 10,
        peeDelta: -70,
        pooDelta: -65,
        message: 'Вы закрываете за собой дверь на одну честную минуту.',
        color: '#bbb',
        eventType: 'interactive_used',
        eventSeverity: 0,
      },
    ],
  },
  {
    id: 'toilet_broken',
    layer: 'feature',
    label: 'Сломанный унитаз',
    prompt: ' сломанный унитаз',
    tags: ['needs', 'toilet', 'bathroom', 'broken', 'repair'],
    visual: { kind: 'feature', feature: Feature.TOILET },
    target: { range: 2.25, priority: 77 },
    actions: [
      {
        id: 'inspect_broken',
        label: 'Осмотреть',
        kind: 'repair_pending',
        cooldownSeconds: 2,
        message: 'Унитаз сломан. Нужен ремонт: бачок молчит, вода стоит.',
        color: '#aaa',
        eventType: 'interactive_used',
        eventSeverity: 0,
      },
    ],
  },
  {
    id: 'workbench_basic',
    layer: 'feature',
    label: 'Верстак',
    prompt: ' верстак',
    tags: ['workbench', 'crafting', 'repair', 'machine'],
    visual: { kind: 'feature', feature: Feature.MACHINE },
    target: { range: 2.25, priority: 63 },
    actions: [
      {
        id: 'inspect',
        label: 'Осмотреть',
        kind: 'message',
        cooldownSeconds: 2,
        message: 'Верстак принимает инструменты, детали и рецепты. Пока доступен только осмотр.',
        color: '#9cf',
        eventType: 'interactive_used',
        eventSeverity: 0,
      },
    ],
  },
  {
    id: 'container_adapter',
    layer: 'container',
    label: 'Контейнер',
    prompt: ' контейнер',
    tags: ['container', 'inventory'],
    visual: { kind: 'container', containerKind: ContainerKind.WOODEN_CHEST },
    target: { range: 2.25, priority: 62 },
    actions: [
      {
        id: 'open',
        label: 'Открыть',
        kind: 'open_container',
        eventType: 'interactive_used',
        eventSeverity: 1,
      },
    ],
  },
] as const satisfies readonly InteractiveDef[];

for (const def of INTERACTIVE_DEFS) registerInteractiveDef(def);
