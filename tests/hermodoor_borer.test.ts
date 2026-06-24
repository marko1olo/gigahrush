import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { DoorState, FloorLevel } from '../src/core/types';
import { World } from '../src/core/world';
import { blocksHermodoorBorerSeal, storeFor } from '../src/systems/hermodoor_borer';
import { makeGameState } from './helpers';
import { createWorldEventState } from '../src/systems/events';

test('blocksHermodoorBorerSeal prevents hermodoor from sealing during borer damage', () => {
    const world = new World();
    const state = makeGameState({ currentFloor: FloorLevel.LIVING, worldEvents: createWorldEventState() });

    // Scenario 1: No valid door record exists
    assert.equal(blocksHermodoorBorerSeal(world, state, 1, 10), false);

    // Setup a door record
    const store = storeFor(world);
    store.doorRecords.set(1, {
        doorIdx: 1,
        roomId: 10,
        roomName: 'Test Room',
        zoneId: 0,
        floor: FloorLevel.LIVING,
        cycle: 0,
        phase: 'warning',
        detectedAt: 0,
        damageAt: 0,
    });

    // Scenario 2: Phase is warning
    assert.equal(blocksHermodoorBorerSeal(world, state, 1, 10), false);

    // Scenario 3: Phase is damaged, but door does not exist in world
    store.doorRecords.get(1)!.phase = 'damaged';
    assert.equal(blocksHermodoorBorerSeal(world, state, 1, 10), false);

    // Scenario 4: Phase is damaged, door exists
    world.doors.set(1, {
        idx: 1,
        state: DoorState.HERMETIC_CLOSED,
        roomA: 10,
        roomB: 11,
        keyId: '',
        timer: 100,
    });

    const initialMsgs = state.msgs.length;

    assert.equal(blocksHermodoorBorerSeal(world, state, 1, 10), true);
    assert.equal(world.doors.get(1)?.state, DoorState.HERMETIC_OPEN);
    assert.equal(world.doors.get(1)?.timer, 0);
    assert.equal(store.doorRecords.get(1)?.phase, 'compromised');
    assert.equal(store.doorRecords.get(1)?.compromisedAt, state.time);

    // Verify a message was added to state
    assert.ok(state.msgs.length > initialMsgs);
    assert.ok(state.msgs.some(m => m.text.includes('Укрытие скомпрометировано: Test Room')));

    const msgsAfterDamaged = state.msgs.length;

    // Scenario 5: Phase is already 'compromised', door exists
    world.doors.get(1)!.state = DoorState.HERMETIC_CLOSED; // close the door again to test if it opens it
    world.doors.get(1)!.timer = 100;

    assert.equal(blocksHermodoorBorerSeal(world, state, 1, 10), true);
    assert.equal(world.doors.get(1)?.state, DoorState.HERMETIC_OPEN);
    assert.equal(world.doors.get(1)?.timer, 0);
    assert.equal(store.doorRecords.get(1)?.phase, 'compromised');

    // Ensure no new messages are pushed when already compromised
    assert.equal(state.msgs.length, msgsAfterDamaged);
});
