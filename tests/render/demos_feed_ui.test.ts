import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { drawDemosFeedPanel, type DrawDemosFeedOptions } from '../../src/render/demos_feed_ui';
import type { DemosFeedView, DemosFeedPostView, DemosRenderedReaction } from '../../src/systems/demos_posts';

function createMockCtx() {
  const calls: { method: string; args: any[] }[] = [];

  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    textAlign: '',
    textBaseline: '',
    font: '',
    measureText(text: string) {
      return { width: text.length * 10 };
    },
    fillRect(...args: any[]) { calls.push({ method: 'fillRect', args: [...args, this.fillStyle] }); },
    strokeRect(...args: any[]) { calls.push({ method: 'strokeRect', args: [...args, this.strokeStyle] }); },
    fillText(...args: any[]) { calls.push({ method: 'fillText', args: [...args, this.fillStyle, this.font] }); },
  } as unknown as CanvasRenderingContext2D;

  return { ctx, calls };
}

test('drawDemosFeedPanel empty feed', () => {
  const { ctx, calls } = createMockCtx();
  const view: DemosFeedView = {
    posts: [],
    total: 0,
    capacity: 100,
    emptyLabel: 'NO POSTS',
  };

  drawDemosFeedPanel(ctx, view, 10, 10, 200, 300, 1, 1);

  // Background and title
  assert.ok(calls.some(c => c.method === 'fillRect' && c.args[0] === 10 && c.args[1] === 10 && c.args[2] === 200 && c.args[3] === 300));
  assert.ok(calls.some(c => c.method === 'fillText' && c.args[0] === 'ЛЕНТА ДЕМОСА'));
  assert.ok(calls.some(c => c.method === 'fillText' && c.args[0] === '0/100'));

  // Empty label
    assert.ok(calls.some(c => c.method === 'fillText' && c.args[0] === 'NO POSTS' && c.args[3] === '#789'));
});

test('drawDemosFeedPanel with posts', () => {
  const { ctx, calls } = createMockCtx();
  const post: DemosFeedPostView = {
    id: 42,
    authorAlifeId: 101,
    createdAt: 100,
    text: 'Hello World',
    source: 'generated_markov',
    templateId: 't1',
    tags: ['tag1', 'tag2'],
    fallbackUsed: false,
  };

  const view: DemosFeedView = {
    posts: [post],
    total: 1,
    capacity: 100,
    emptyLabel: 'NO POSTS',
  };

  drawDemosFeedPanel(ctx, view, 10, 10, 200, 300, 1, 1);

  // Post background
  assert.ok(calls.some(c => c.method === 'fillRect' && c.args[4] === 'rgba(2,18,22,0.74)'));

  // Header text
    assert.ok(calls.some(c => c.method === 'fillText' && c.args[0].includes('post:42') && c.args[0].includes('alife:10')));

  // Post text
  assert.ok(calls.some(c => c.method === 'fillText' && c.args[0] === 'Hello World' && c.args[3] === '#d9f1ed'));

  // Tags
  assert.ok(calls.some(c => c.method === 'fillText' && c.args[0] === 'tag1'));
  assert.ok(calls.some(c => c.method === 'fillText' && c.args[0] === 'tag2'));
});

test('drawDemosFeedPanel with reactions', () => {
  const { ctx, calls } = createMockCtx();
  const post: DemosFeedPostView = {
    id: 42,
    authorAlifeId: 101,
    createdAt: 100,
    text: 'Hello World',
    source: 'generated_markov',
    templateId: 't1',
    tags: [],
    fallbackUsed: false,
  };

  const view: DemosFeedView = {
    posts: [post],
    total: 1,
    capacity: 100,
    emptyLabel: 'NO POSTS',
  };

  const reactionPositive: DemosRenderedReaction = {
    postId: 42,
    reactorAlifeId: 201,
    kind: 'like',
    relation: 10,
    text: 'Nice!',
    source: 'generated_markov',
    templateId: 't1',
    tags: [],
    fallbackUsed: false,
  };

  const reactionNegative: DemosRenderedReaction = {
    postId: 42,
    reactorAlifeId: 202,
    kind: 'dislike',
    relation: -10,
    text: 'Awful!',
    source: 'generated_markov',
    templateId: 't2',
    tags: [],
    fallbackUsed: false,
  };

  const opts: DrawDemosFeedOptions = {
    reactionsByPostId: {
      42: [reactionPositive, reactionNegative]
    }
  };

  drawDemosFeedPanel(ctx, view, 10, 10, 200, 300, 1, 1, opts);

  // Positive reaction text & color (#9dc)
    assert.ok(calls.some(c => c.method === 'fillText' && c.args[0].includes('alife:201') && c.args[0].includes('Nice!') && c.args[3] === '#9dc'));

  // Negative reaction text & color (#e99)
  assert.ok(calls.some(c => c.method === 'fillText' && c.args[0].includes('alife:202') && c.args[0].includes('Awful!') && c.args[3] === '#e99'));
});

test('drawDemosFeedPanel bounds checking (scrolling/skip rendering)', () => {
  const { ctx, calls } = createMockCtx();
  const post1: DemosFeedPostView = {
    id: 1, authorAlifeId: 101, createdAt: 100, text: 'Visible Post', source: 'generated_markov', templateId: 't1', tags: [], fallbackUsed: false,
  };
  const post2: DemosFeedPostView = {
    id: 2, authorAlifeId: 102, createdAt: 100, text: 'Hidden Post', source: 'generated_markov', templateId: 't2', tags: [], fallbackUsed: false,
  };

  const view: DemosFeedView = {
    posts: [post1, post2],
    total: 2,
    capacity: 100,
    emptyLabel: 'NO POSTS',
  };

  // Create a tight bounding box with no scroll (h=40)
  drawDemosFeedPanel(ctx, view, 10, 10, 200, 40, 1, 1, { scroll: 0 });

  // Post 1 might be partially visible or drawn, but Post 2 should definitely be skipped because rowY > bottom
  const post2TextCalls = calls.filter(c => c.method === 'fillText' && c.args[0] === 'Hidden Post');
  assert.equal(post2TextCalls.length, 0, 'Hidden post should not be rendered due to bounds check');

  calls.length = 0; // Clear calls

  // Scroll past the first post
  drawDemosFeedPanel(ctx, view, 10, 10, 200, 400, 1, 1, { scroll: 10 });

  // Due to scroll being large, rowY initially is small (e.g., negative/above bounds)
  // Let's check specifically that scrolling offsets correctly.
  const post1TextCalls = calls.filter(c => c.method === 'fillText' && c.args[0] === 'Visible Post');
  assert.equal(post1TextCalls.length, 0, 'Visible Post should be skipped due to being scrolled out of view at the top');

  const post2TextCallsScrolled = calls.filter(c => c.method === 'fillText' && c.args[0] === 'Hidden Post');
  assert.equal(post2TextCallsScrolled.length, 0, 'Hidden Post might also be scrolled out of view');
});
