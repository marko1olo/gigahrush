import test from 'node:test';
import assert from 'node:assert/strict';
import { tradeCellPriceDisplay, scarcityBand } from '../../src/render/economy_ui';
import { makeGameState } from '../helpers';
import { Entity } from '../../src/core/types';

test('tradeCellPriceDisplay falls back to default prices when getEconomyQuote throws', () => {
    const state = makeGameState();

    // We create a mock NPC with a getter that throws an error when getEconomyQuote
    // tries to access its faction (which happens inside spreadFor -> traderMatches).
    // This allows getAdjustedItemPrice (which calls getEconomyQuote without opts)
    // to succeed, but the subsequent getEconomyQuote call with the NPC will throw
    // and exercise the catch block.
    const npc = {
        get faction() {
            throw new Error('Simulated economy merging error');
        }
    } as unknown as Entity;

    // This should not throw, it should return the fallback display object
    const display = tradeCellPriceDisplay(state, npc, 'canned', 'buy');

    // The fallback uses getAdjustedItemPrice, so price should be formatted as text
    assert.ok(display.text !== undefined, 'Display text should be present');
    assert.equal(typeof display.text, 'string');
    assert.ok(display.color !== undefined);
    assert.ok(display.scarcityColor !== undefined);
});

test('scarcityBand maps multipliers to correct bands', () => {
    assert.equal(scarcityBand(2.5).label, 'КРИЗИС');
    assert.equal(scarcityBand(2.05).label, 'КРИЗИС');
    assert.equal(scarcityBand(1.5).label, 'ДЕФИЦИТ');
    assert.equal(scarcityBand(1.35).label, 'ДЕФИЦИТ');
    assert.equal(scarcityBand(1.2).label, 'НАПРЯЖ.');
    assert.equal(scarcityBand(1.12).label, 'НАПРЯЖ.');
    assert.equal(scarcityBand(0.5).label, 'ИЗБЫТОК');
    assert.equal(scarcityBand(0.72).label, 'ИЗБЫТОК');
    assert.equal(scarcityBand(0.8).label, 'ЗАПАС');
    assert.equal(scarcityBand(0.88).label, 'ЗАПАС');
    assert.equal(scarcityBand(1.0).label, 'НОРМА');
    assert.equal(scarcityBand(NaN).label, 'НОРМА');
    assert.equal(scarcityBand(Infinity).label, 'НОРМА');
});
