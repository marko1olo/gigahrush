export interface NpcTemplate {
    id: string;
    name: string;
    sprite: string;
    health: number;
    faction: string;
    flags: string[];
    dialogId?: string;
}

export const CHAR_HERO: NpcTemplate = {
    id: 'char_hero_artem',
    name: 'Артем (Герой)',
    sprite: 'hero_unique', // Требует уникального спрайта в атласе
    health: 200,
    faction: 'resistance',
    flags: ['IMMORTAL', 'PLOT_CRITICAL'],
    dialogId: 'hero_intro_dialog'
};

export const CHAR_VILLAIN: NpcTemplate = {
    id: 'char_villain_kombinat',
    name: 'Глава Комбината',
    sprite: 'villain_suit',
    health: 500,
    faction: 'kombinat',
    flags: ['IMMORTAL', 'PLOT_CRITICAL', 'HOSTILE_LATER']
};
