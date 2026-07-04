import { MonsterKind } from '../core/types';

export interface WaveConfig {
    mobs: { kind: MonsterKind, count: number }[];
    prepTimeMs: number; // Время передышки ПЕРЕД волной
}

export const ARENA_WAVES: WaveConfig[] = [
    { mobs: [{ kind: MonsterKind.SLIMEVIK, count: 2 }], prepTimeMs: 10000 },
    { mobs: [{ kind: MonsterKind.SLIMEVIK, count: 4 }, { kind: MonsterKind.POLZUN, count: 1 }], prepTimeMs: 15000 },
    { mobs: [{ kind: MonsterKind.POLZUN, count: 3 }], prepTimeMs: 15000 },
    { mobs: [{ kind: MonsterKind.ZOMBIE, count: 4 }], prepTimeMs: 15000 },
    { mobs: [{ kind: MonsterKind.TVAR, count: 2 }, { kind: MonsterKind.POLZUN, count: 2 }], prepTimeMs: 15000 },
    { mobs: [{ kind: MonsterKind.SBORKA, count: 3 }, { kind: MonsterKind.ZOMBIE, count: 2 }], prepTimeMs: 15000 },
    { mobs: [{ kind: MonsterKind.ZOMBIE, count: 6 }], prepTimeMs: 15000 },
    { mobs: [{ kind: MonsterKind.TVAR, count: 4 }], prepTimeMs: 20000 },
    { mobs: [{ kind: MonsterKind.BETONNIK, count: 1 }, { kind: MonsterKind.POLZUN, count: 2 }], prepTimeMs: 20000 },
    { mobs: [{ kind: MonsterKind.BETONNIK, count: 2 }, { kind: MonsterKind.TVAR, count: 3 }], prepTimeMs: 25000 },
];
