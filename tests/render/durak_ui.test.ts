import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { drawDurakInterface } from '../../src/render/durak_ui';
import type { DurakSnapshot } from '../../src/systems/durak';

class CanvasStubContext {
  fillStyle: string = '';
  strokeStyle: string = '';
  textAlign: string = '';
  textBaseline: string = '';
  font: string = '';
  globalAlpha: number = 1;
  lineWidth: number = 1;
  canvas = { width: 800, height: 600 };

  calls: any[] = [];

  measureText(text: string): { width: number } {
    return { width: text.length * 5 };
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this.calls.push({ type: 'fillRect', x, y, w, h, fillStyle: this.fillStyle });
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this.calls.push({ type: 'strokeRect', x, y, w, h, strokeStyle: this.strokeStyle });
  }

  fillText(text: string, x: number, y: number): void {
    this.calls.push({ type: 'fillText', text, x, y, fillStyle: this.fillStyle, font: this.font });
  }

  save(): void {
    this.calls.push({ type: 'save' });
  }

  restore(): void {
    this.calls.push({ type: 'restore' });
  }
}

function createEmptySnapshot(): DurakSnapshot {
  return {
    open: true,
    npcId: 1,
    npcName: 'Тестовый НИП',
    stakeRubles: 10,
    trumpSuit: 'hearts',
    trumpCard: { id: 1, suit: 'hearts', rank: 6 },
    talonCount: 20,
    discardCount: 5,
    attacker: 'player',
    defender: 'npc',
    phase: 'player_attack',
    defenderTaking: false,
    defenderStartCards: 6,
    playerHand: [{ id: 2, suit: 'clubs', rank: 7 }],
    npcHandCount: 6,
    table: [],
    selectedIndex: 0,
    canPlaySelected: true,
    canFinishTurn: false,
    canTake: false,
    finished: false,
    winner: '',
    message: '',
    log: [],
  };
}

test('drawDurakInterface rendering tests', async (t) => {
  await t.test('Renders player attacking state correctly', () => {
    const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
    const snapshot = createEmptySnapshot();

    drawDurakInterface(ctx, snapshot, 0, 0, 800, 600, 1, 1, 0);

    const stub = ctx as unknown as CanvasStubContext;

    // Check if it renders the title
    const hasTitle = stub.calls.some(c => c.type === 'fillText' && c.text.includes('ДУРАК'));
    assert.ok(hasTitle, 'Should render title "ДУРАК"');

    // Check if it renders the turn indicator (player turn)
    const hasPlayerTurn = stub.calls.some(c => c.type === 'fillText' && c.text.includes('ВЫ ХОДИТЕ'));
    assert.ok(hasPlayerTurn, 'Should render "ВЫ ХОДИТЕ"');

    // Check if stake and trump suit are rendered
    const hasMeta = stub.calls.some(c => c.type === 'fillText' && c.text.includes('СТАВКА 10Р') && c.text.includes('КОЗЫРЬ'));
    assert.ok(hasMeta, 'Should render meta info (stake and trump)');
  });

  await t.test('Renders npc attacking state correctly', () => {
    const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
    const snapshot = createEmptySnapshot();
    snapshot.attacker = 'npc';
    snapshot.defender = 'player';
    snapshot.phase = 'player_defense';

    drawDurakInterface(ctx, snapshot, 0, 0, 800, 600, 1, 1, 0);

    const stub = ctx as unknown as CanvasStubContext;

    // Check if it renders the turn indicator (npc turn)
    const hasNpcTurn = stub.calls.some(c => c.type === 'fillText' && c.text.includes('ХОДИТ') && c.text.includes(snapshot.npcName));
    assert.ok(hasNpcTurn, 'Should render npc turn indicator');
  });

  await t.test('Renders finished game state correctly', () => {
    const ctx = new CanvasStubContext() as unknown as CanvasRenderingContext2D;
    const snapshot = createEmptySnapshot();
    snapshot.finished = true;

    drawDurakInterface(ctx, snapshot, 0, 0, 800, 600, 1, 1, 0);

    const stub = ctx as unknown as CanvasStubContext;

    // Finished state actions usually have 'ЗАКРЫТЬ' and 'ВЫЙТИ'
    const hasFinishActions = stub.calls.some(c => c.type === 'fillText' && c.text.includes('ЗАКРЫТЬ') && c.text.includes('ВЫЙТИ'));
    assert.ok(hasFinishActions, 'Should render finished state actions');
  });
});
