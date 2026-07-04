import test from 'node:test';
import assert from 'node:assert/strict';

import { Cell, DoorState, EntityType, Faction, Occupation, RoomType, Tex, type Entity, type GameState, msg } from '../src/core/types';
import { World } from '../src/core/world';
import { resolveInteractive, useInteractive, runAction_FOR_TESTING } from '../src/systems/interactive';
import { TutorialStep } from '../src/systems/tutorial';
import { ITEMS } from '../src/data/catalog';
import { InteractiveActionDef, InteractiveDef, InteractiveWorldState } from '../src/data/interactive';
import { makeGameState } from './helpers';

test('runRelieve handles tutorial advancement and unlocks cafe door via runAction_FOR_TESTING', () => {
  const world = new World();
  world.doors.set(0, {
    x: 0,
    y: 0,
    state: DoorState.LOCKED,
    vertical: false,
    timer: 0,
    maxHp: 100,
    hp: 100,
    keyId: 'tut_cafe_key',
    tags: [],
    material: 0,
    tex: Tex.DOOR,
    jammed: false,
    electric: false,
  });

  const state = makeGameState();
  state.interactiveState = { byId: new Map() } as any;
  state.tutorialMode = true;
  state.tutorialStep = TutorialStep.TOILET;

  const player: Entity = {
    id: 1,
    type: EntityType.PLAYER,
    x: 0,
    y: 0,
    angle: 0,
    pitch: 0,
    alive: true,
    speed: 0,
    sprite: 0,
    faction: Faction.PLAYER,
    occupation: Occupation.CITIZEN,
    needs: { food: 50, water: 50, sleep: 50, pee: 80, poo: 80 },
  };

  const resolved = {
    instance: { id: 1, x: 0, y: 0, defId: 'toilet_relief', zoneId: 0, roomId: -1, hp: 100, active: true, state: {} },
    def: { id: 'toilet_relief', layer: 'feature', label: 'Туалет', prompt: ' туалет', actions: [], tags: [] } as any,
  };

  const action: InteractiveActionDef = {
    id: 'relieve',
    kind: 'relieve',
    label: 'Воспользоваться',
    cooldownSeconds: 10,
    peeDelta: -70,
    pooDelta: -65,
    message: 'Вы закрываете за собой дверь на одну честную минуту.',
    color: '#bbb',
    eventType: 'interactive_used',
    eventSeverity: 0,
  };

  const result = runAction_FOR_TESTING({
    world,
    state,
    player,
    lookX: 0,
    lookY: 0,
    distance: 1,
    canReachCursor: true,
    cursorAction: action,
  } as any, resolved, action);

  assert.equal(result.handled, true);
  assert.equal(state.tutorialStep, TutorialStep.EAT);
  assert.equal(world.doors.get(0)?.state, DoorState.CLOSED);
  assert.ok(world.surfaceVersion > 0);
  assert.equal(player.needs?.pee, 10);
  assert.equal(player.needs?.poo, 15);
});
