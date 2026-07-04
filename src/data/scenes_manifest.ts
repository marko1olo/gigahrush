export const SCENE_CONFRONTATION_1 = {
    id: 'scene_confrontation_1',
    steps: [
        { type: 'CAMERA_MOVE', target: 'char_villain_kombinat', duration: 2.0 },
        { type: 'SPEECH', actor: 'char_villain_kombinat', text: 'Думал, сможешь остановить Самосбор? Глупец.' },
        { type: 'WAIT', duration: 3.0 },
        { type: 'CAMERA_MOVE', target: 'char_hero_artem', duration: 1.0 },
        { type: 'SPEECH', actor: 'char_hero_artem', text: 'Я хотя бы попытаюсь.' },
        { type: 'WAIT', duration: 2.0 },
        { type: 'RELEASE_ACTORS' },
        { type: 'CAMERA_RESET' }
    ]
};
