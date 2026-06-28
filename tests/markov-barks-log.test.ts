import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateAmbientBark,
  generateMarkovBark,
  generateWitnessBark,
  type MarkovSpeechRouterRequest,
  type MarkovSpeechRouterResult,
} from '../src/systems/markov_barks';
import { eventIsMarkedNpcSpeech, generateMarkovLogSpeech, type MarkovLogSpeechEventFacts } from '../src/systems/markov_log_speech';

function routedText(request: MarkovSpeechRouterRequest, text: string): MarkovSpeechRouterResult {
  return {
    text,
    source: 'generated_markov',
    intent: request.intent,
    tags: request.context.tags,
    fallbackUsed: false,
  };
}

test('alert and combat bark signals are exact fallback or rejection only', () => {
  const rejected = generateMarkovBark({
    signal: 'combat',
    actor: { id: 7, name: 'Нина' },
  });
  assert.equal(rejected, undefined);

  const fallback = generateMarkovBark({
    signal: 'alert',
    actor: { id: 7, name: 'Нина' },
    exactFallback: 'К герме, быстро!',
    routeSpeech: request => routedText(request, 'не должно появиться'),
  });
  assert.equal(fallback?.text, 'К герме, быстро!');
  assert.equal(fallback?.fallbackUsed, true);
  assert.equal(fallback?.source, 'locked_author_text');
  assert.equal(fallback?.rejected, true);
});

test('ambient bark uses bark intent and respects the supplied character cap', () => {
  let seen: MarkovSpeechRouterRequest | undefined;
  const result = generateAmbientBark({
    actor: { id: 8, name: 'Слесарь' },
    exactFallback: 'Трубу слушай.',
    context: { roomName: 'Кухня' },
    maxChars: 32,
    routeSpeech: request => {
      seen = request;
      return routedText(request, 'Кухня: сначала проверь, потом спорь и не спорь ещё раз.');
    },
  });

  assert.equal(seen?.intent, 'bark_ambient');
  assert.equal(seen?.maxChars, 32);
  assert.ok((result?.text.length ?? 999) <= 32);
});

test('generated bark receives actor context and event anchors', () => {
  const result = generateAmbientBark({
    actor: { id: 9, name: 'Дежурная' },
    exactFallback: 'Очередь ждёт.',
    event: { type: 'container_opened', itemName: 'пайковая карточка', tags: ['supply'] },
    context: { roomName: 'Кладовая' },
    seed: 12,
    routeSpeech: request => routedText(request, request.context.anchors.join('|')),
  });

  assert.equal(result?.source, 'generated_markov');
  assert.match(result?.text ?? '', /Дежурная/);
  assert.match(result?.text ?? '', /Кладовая/);
  assert.match(result?.text ?? '', /пайковая карточка|container_opened/);
});

test('witness bark routes as log speech and stays deterministic for the same seed/context', () => {
  const request = {
    actor: { id: 10, name: 'Свидетель' },
    exactFallback: 'Видел кражу.',
    event: { type: 'item_stolen', itemName: 'пайковая карточка', tags: ['theft'] },
    seed: 'same',
    repeatIndex: 2,
    routeSpeech: (routerRequest: MarkovSpeechRouterRequest) => routedText(
      routerRequest,
      `${routerRequest.intent}:${routerRequest.seed}:${routerRequest.repeatIndex}:${routerRequest.context.anchors.join(',')}`,
    ),
  };

  const first = generateWitnessBark(request);
  const second = generateWitnessBark(request);

  assert.equal(first?.intent, 'log_speech');
  assert.equal(first?.text, second?.text);
  assert.match(first?.text ?? '', /пайковая карточка|item_stolen/);
});

test('explicit NPC log speech uses only supplied actor target and event facts', () => {
  const result = generateMarkovLogSpeech({
    isSpeech: true,
    event: {
      id: 42,
      type: 'rumor_spread',
      actorId: 11,
      actorName: 'Нина',
      targetId: 12,
      targetName: 'Антон',
      tags: ['rumor'],
    },
    exactFallback: 'Нина: слух пошёл.',
    seed: 77,
    routeSpeech: request => routedText(
      request,
      `${request.context.actorName ?? ''}:${request.context.targetName ?? ''}:${request.context.eventType ?? ''}`,
    ),
  });

  assert.equal(result?.intent, 'log_speech');
  assert.match(result?.text ?? '', /Нина/);
  assert.match(result?.text ?? '', /Антон/);
  assert.match(result?.text ?? '', /rumor_spread/);
  assert.doesNotMatch(result?.text ?? '', /Ольга|Яков|Павел|патроны|гермодверь/);
});

test('structural world log event types do not become Markov text by accident', () => {
  const result = generateMarkovLogSpeech({
    event: {
      id: 43,
      type: 'door_opened',
      zoneId: 3,
      tags: [],
    },
    exactFallback: 'Дверь открылась.',
    routeSpeech: request => routedText(request, 'не должно появиться'),
  });

  assert.equal(result, undefined);
});

test('log speech rejects combat and samosbor critical facts by exact fallback', () => {
  const combat = generateMarkovLogSpeech({
    isSpeech: true,
    event: {
      id: 44,
      type: 'npc_kill_npc',
      actorName: 'Нина',
      targetName: 'Антон',
      tags: ['combat', 'kill'],
    },
    exactFallback: 'Нина ударила Антона.',
    routeSpeech: request => routedText(request, 'не должно появиться'),
  });
  assert.equal(combat?.text, 'Нина ударила Антона.');
  assert.equal(combat?.rejected, true);

  const samosbor = generateMarkovLogSpeech({
    isSpeech: true,
    event: {
      id: 45,
      type: 'samosbor_warning',
      actorName: 'Дежурная',
      tags: ['samosbor_critical'],
    },
    exactFallback: 'Ищите гермодверь.',
    routeSpeech: request => routedText(request, 'не должно появиться'),
  });
  assert.equal(samosbor?.text, 'Ищите гермодверь.');
  assert.equal(samosbor?.rejected, true);
});

test('lightweight bark path does not require a full ContextSnapshot', () => {
  const result = generateAmbientBark({
    actor: { id: 46, name: 'Повар' },
    exactFallback: 'Суп остыл.',
    routeSpeech: request => routedText(request, request.context.actorName ?? ''),
  });

  assert.equal(result?.text, 'Повар');
});

test('eventIsMarkedNpcSpeech evaluates speech tags and overrides correctly', () => {
  const baseEvent: MarkovLogSpeechEventFacts = {
    id: 1,
    type: 'rumor_spread',
    tags: [],
  };

  // 1. isSpeech param overrides everything
  assert.equal(eventIsMarkedNpcSpeech(baseEvent, true), true);

  // 2. Explicit speech tags
  assert.equal(eventIsMarkedNpcSpeech({ ...baseEvent, tags: ['npc_speech'] }), true);
  assert.equal(eventIsMarkedNpcSpeech({ ...baseEvent, tags: ['log_speech'] }), true);
  assert.equal(eventIsMarkedNpcSpeech({ ...baseEvent, tags: ['spoken'] }), true);

  // 3. Event data properties
  assert.equal(eventIsMarkedNpcSpeech({ ...baseEvent, data: { npcSpeech: true } }), true);
  assert.equal(eventIsMarkedNpcSpeech({ ...baseEvent, data: { speech: true } }), true);

  // 4. Negative cases
  assert.equal(eventIsMarkedNpcSpeech(baseEvent), false);
  assert.equal(eventIsMarkedNpcSpeech({ ...baseEvent, tags: ['combat', 'rumor'] }), false);
  assert.equal(eventIsMarkedNpcSpeech({ ...baseEvent, data: { npcSpeech: false, speech: false } }), false);
});
