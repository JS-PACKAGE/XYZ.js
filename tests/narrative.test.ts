import { describe, expect, it, vi } from 'vitest';
import {
  CutsceneDirector,
  cutsceneValue,
  cutsceneAudio,
} from '../packages/core/src/cutscene.js';
import { Dialogue } from '../packages/core/src/dialogue.js';
import { QuestSystem } from '../packages/core/src/quests.js';
import { Scene } from '../packages/core/src/scene.js';
import { I18n } from '../packages/core/src/i18n.js';
import { SaveManager, assertJsonValue } from '../packages/core/src/storage.js';
import type { DialogueState } from '../packages/core/src/dialogue.js';
import type { QuestState } from '../packages/core/src/quests.js';

const questDefinitions = [
  {
    id: 'delivery',
    objectives: [{ id: 'parcel', target: 2 }],
    rewards: ['coin'],
  },
  {
    id: 'return',
    prerequisites: ['delivery'],
    objectives: [{ id: 'home', target: 1 }],
    rewards: ['badge'],
  },
] as const;
const dialogueDefinition = {
  id: 'greeting',
  start: 'hello',
  variables: { trusted: false },
  nodes: [
    {
      id: 'hello',
      text: 'Help the courier?',
      events: ['hello'],
      choices: [
        {
          id: 'yes',
          text: 'Yes',
          next: 'accepted',
          set: { trusted: true },
          events: ['accept'],
        },
        {
          id: 'secret',
          text: 'Secret',
          next: 'accepted',
          condition: { variable: 'trusted', equals: true },
        },
        { id: 'no', text: 'No', next: 'declined' },
      ],
    },
    { id: 'accepted', text: 'Deliver two parcels.', events: ['quest'] },
    { id: 'declined', text: 'Maybe later.' },
  ],
} as const;

describe('CutsceneDirector', () => {
  it('fails boundedly rather than hanging on tiny infinite repeats or enormous deltas', () => {
    for (const [duration, delta] of [
      [Number.MIN_VALUE, 1],
      [1, Number.MAX_VALUE],
    ]) {
      const errors: unknown[] = [];
      const director = new CutsceneDirector({
        duration: duration!,
        repeat: Infinity,
        onError: (error) => errors.push(error),
      });
      director.play();
      expect(() => director.update(delta!)).toThrow('work budget');
      expect(director.status).toBe('error');
      expect(errors).toHaveLength(1);
    }
    let cues = 0;
    const finite = new CutsceneDirector({
      duration: 0.1,
      repeat: 3,
      cues: [
        {
          id: 'each',
          at: 0,
          repeat: true,
          run: () => {
            cues++;
          },
        },
      ],
    });
    finite.play();
    finite.update(1);
    expect(finite.status).toBe('completed');
    expect(cues).toBe(4);
  });
  it('samples overlapping tracks, suppresses seek effects, pauses and restores on cancel', () => {
    const target = { x: 0, label: 'initial' };
    const cue = vi.fn();
    const director = new CutsceneDirector({
      duration: 4,
      tracks: [
        {
          id: 'move',
          start: 0,
          duration: 4,
          action: {
            reset: () => {
              target.x = 0;
            },
            sample: (t) => {
              target.x = t * 10;
            },
          },
        },
        {
          id: 'label',
          start: 1,
          duration: 2,
          action: cutsceneValue(
            () => target.label,
            (v) => {
              target.label = v;
            },
            'Moving',
          ),
        },
      ],
      cues: [{ id: 'cue', at: 1, run: cue }],
    });
    director.play();
    director.update(1.5);
    expect(target).toEqual({ x: 15, label: 'Moving' });
    expect(cue).toHaveBeenCalledTimes(1);
    director.pause();
    director.update(2);
    expect(director.time).toBe(1.5);
    director.seek(0.5);
    expect(target).toEqual({ x: 5, label: 'initial' });
    director.resume();
    director.update(1);
    expect(cue).toHaveBeenCalledTimes(1);
    director.seek(3.5);
    director.update(0.5);
    expect(director.status).toBe('completed');
    director.cancel();
    expect(target).toEqual({ x: 0, label: 'initial' });
  });
  it('holds at asynchronous user choices and discards unused frame time', async () => {
    let choose!: () => void;
    const next = vi.fn();
    const director = new CutsceneDirector({
      duration: 3,
      cues: [
        {
          id: 'choice',
          at: 1,
          run: () =>
            new Promise<void>((resolve) => {
              choose = resolve;
            }),
        },
        { id: 'next', at: 2, run: next },
      ],
    });
    director.play();
    director.update(3);
    expect(director.status).toBe('waiting');
    expect(director.time).toBe(1);
    director.pause();
    choose();
    await Promise.resolve();
    await Promise.resolve();
    expect(director.status).toBe('paused');
    director.resume();
    director.update(1);
    expect(next).toHaveBeenCalledTimes(1);
  });
  it('aborts stale barriers on seek and cancels owned audio after the cue resolved', async () => {
    let resolve!: () => void;
    let signal!: AbortSignal;
    const stop = vi.fn();
    const director = new CutsceneDirector({
      duration: 3,
      cues: [
        { id: 'audio', at: 0, run: cutsceneAudio(() => ({ stop })) },
        {
          id: 'choice',
          at: 1,
          run: (context) => {
            signal = context.signal;
            return new Promise<void>((r) => {
              resolve = r;
            });
          },
        },
      ],
    });
    director.play();
    director.update(0);
    await Promise.resolve();
    await Promise.resolve();
    director.update(1);
    director.seek(2);
    expect(signal.aborted).toBe(true);
    expect(stop).toHaveBeenCalledTimes(1);
    resolve();
    await Promise.resolve();
    expect(director.time).toBe(2);
    director.cancel();
    expect(director.status).toBe('cancelled');
  });
  it('loops repeat cues deterministically and rejects recursive updates', () => {
    const once = vi.fn();
    const repeat = vi.fn();
    const director = new CutsceneDirector({
      duration: 1,
      repeat: 2,
      cues: [
        { id: 'once', at: 0, run: once },
        { id: 'repeat', at: 0.5, repeat: true, run: repeat },
      ],
    });
    director.play();
    director.update(3);
    expect(once).toHaveBeenCalledTimes(1);
    expect(repeat).toHaveBeenCalledTimes(3);
    expect(director.status).toBe('completed');
    const nested = new CutsceneDirector({
      duration: 1,
      cues: [{ id: 'nested', at: 0, run: ({ director: d }) => d.update(0) }],
    });
    nested.play();
    expect(() => nested.update(1)).toThrow('reentrant');
    expect(nested.status).toBe('error');
  });
  it('supports a cue pausing synchronously and Scene destruction', () => {
    const scene = new Scene();
    const director = scene.add(
      new CutsceneDirector({
        duration: 1,
        cues: [{ id: 'pause', at: 0, run: ({ director: d }) => d.pause() }],
      }),
    );
    director.play();
    director.update(0);
    expect(director.status).toBe('paused');
    director.resume();
    director.update(1);
    expect(director.status).toBe('completed');
    scene.destroy();
    expect(director.destroyed).toBe(true);
  });
});

describe('Dialogue', () => {
  it('preserves arbitrary own variable names through choices and save/restore', () => {
    const definition = {
      id: 'own-keys',
      start: 'a',
      nodes: [
        {
          id: 'a',
          text: 'Choose',
          choices: [
            {
              id: 'set',
              text: 'Set',
              next: 'b',
              set: { ['__proto__']: 'choice' },
            },
          ],
        },
        {
          id: 'b',
          text: 'Continue',
          choices: [
            {
              id: 'own',
              text: 'Own',
              next: 'c',
              condition: { variable: '__proto__', equals: 'choice' },
            },
            {
              id: 'absent',
              text: 'Absent',
              next: 'c',
              condition: { not: { variable: 'constructor', equals: null } },
            },
          ],
        },
        { id: 'c', text: 'Done' },
      ],
    } as const;
    const dialogue = new Dialogue(definition);
    expect(Object.hasOwn(dialogue.variables, 'constructor')).toBe(false);
    dialogue.start();
    dialogue.choose('set');
    expect(dialogue.variables['__proto__']).toBe('choice');
    expect(dialogue.view?.choices.map((choice) => choice.id)).toEqual([
      'own',
      'absent',
    ]);
    const restored = new Dialogue(definition);
    restored.restore(JSON.parse(JSON.stringify(dialogue.save())));
    restored.choose('own');
    restored.setVariable('__proto__', 'updated');
    restored.setVariable('constructor', 7);
    expect(restored.save().variables['__proto__']).toBe('updated');
    expect(restored.variables.constructor).toBe(7);
  });
  it('branches on variables and restores without duplicate events', () => {
    const events: string[] = [];
    const dialogue = new Dialogue(dialogueDefinition, {
      onEvent: (event) => events.push(event),
    });
    dialogue.start();
    expect(dialogue.view?.choices.map((choice) => choice.id)).toEqual([
      'yes',
      'no',
    ]);
    expect(() => dialogue.choose('secret')).toThrow('Unavailable');
    dialogue.choose('yes');
    expect(dialogue.view?.text).toBe('Deliver two parcels.');
    expect(dialogue.variables.trusted).toBe(true);
    expect(events).toEqual(['hello', 'accept', 'quest']);
    const state = dialogue.save();
    const restored = new Dialogue(dialogueDefinition, {
      onEvent: (event) => events.push(event),
    });
    restored.restore(state);
    restored.advance();
    expect(restored.completed).toBe(true);
    expect(events).toHaveLength(3);
    state.node = 'missing';
    expect(() => restored.restore(state)).toThrow('Invalid');
    expect(restored.completed).toBe(true);
  });
  it('resolves localized text from current variables and locale', () => {
    const i18n = new I18n({
      messages: {
        en: { greeting: 'Hello {name}' },
        fr: { greeting: 'Bonjour {name}' },
      },
    });
    const dialogue = new Dialogue(
      {
        id: 'localized',
        start: 'hello',
        variables: { name: 'Courier' },
        nodes: [{ id: 'hello', text: { key: 'greeting' } }],
      },
      { i18n },
    );
    dialogue.start();
    expect(dialogue.view?.text).toBe('Hello Courier');
    i18n.setLocale('fr');
    expect(dialogue.view?.text).toBe('Bonjour Courier');
  });
  it('clones immutable data, rejects graph errors, and prevents event reentrancy', () => {
    expect(
      () =>
        new Dialogue({
          id: 'bad',
          start: 'a',
          nodes: [{ id: 'a', text: 'a', next: 'missing' }],
        }),
    ).toThrow('reference');
    expect(
      () =>
        new Dialogue({
          id: 'cycle',
          start: 'a',
          nodes: [{ id: 'a', text: 'a', next: 'a' }],
        }),
    ).toThrow('cycle');
    const cyclic = new Dialogue({
      id: 'cycle',
      start: 'a',
      allowCycles: true,
      nodes: [{ id: 'a', text: 'a', next: 'a' }],
    });
    cyclic.start();
    cyclic.advance();
    expect(cyclic.view?.node).toBe('a');
    const dialogue = new Dialogue(dialogueDefinition, {
      onEvent: (_event, d) => {
        expect(() => d.advance()).toThrow('reentrant');
      },
    });
    dialogue.start();
    expect(Object.isFrozen(dialogue.definition.nodes)).toBe(true);
  });
});

describe('QuestSystem', () => {
  it('unlocks prerequisites, completes, restores and pays rewards exactly once', () => {
    const reward = vi.fn();
    const quests = new QuestSystem(questDefinitions, { onReward: reward });
    expect(quests.get('return').status).toBe('locked');
    expect(() => quests.accept('return')).toThrow('available');
    quests.accept('delivery');
    quests.progress('delivery', 'parcel');
    expect(quests.get('delivery').status).toBe('active');
    quests.progress('delivery', 'parcel', 20);
    expect(quests.get('return').status).toBe('available');
    expect(reward).toHaveBeenCalledTimes(1);
    const restored = new QuestSystem(questDefinitions, { onReward: reward });
    restored.restore(quests.save());
    expect(() => restored.progress('delivery', 'parcel')).toThrow('active');
    restored.accept('return');
    restored.progress('return', 'home');
    restored.restore(restored.save());
    expect(reward).toHaveBeenCalledTimes(2);
  });
  it('commits completion before throwing rewards and blocks reentrant mutations', () => {
    const quests = new QuestSystem(questDefinitions, {
      onReward: () => {
        expect(() => quests.accept('return')).toThrow('reentrant');
        throw new Error('reward failure');
      },
    });
    quests.accept('delivery');
    expect(() => quests.progress('delivery', 'parcel', 2)).toThrow(
      'reward failure',
    );
    expect(quests.get('delivery').rewarded).toBe(true);
    expect(quests.get('return').status).toBe('available');
    const restored = new QuestSystem(questDefinitions);
    restored.restore(quests.save());
    expect(restored.get('delivery').status).toBe('completed');
  });
  it('validates state transactionally and models terminal failure', () => {
    const quests = new QuestSystem(questDefinitions);
    const state = quests.save();
    state.quests.return.status = 'available';
    expect(() => quests.restore(state)).toThrow('prerequisites');
    expect(quests.get('return').status).toBe('locked');
    const bad = quests.save();
    bad.quests.delivery.progress.parcel = -1;
    expect(() => quests.restore(bad)).toThrow('progress');
    quests.accept('delivery');
    quests.fail('delivery');
    expect(quests.get('delivery').status).toBe('failed');
    expect(() => quests.progress('delivery', 'parcel')).toThrow('active');
    expect(
      () =>
        new QuestSystem([
          {
            id: 'a',
            prerequisites: ['a'],
            objectives: [{ id: 'x', target: 1 }],
          },
        ]),
    ).toThrow('cycle');
    quests.destroy();
    expect(() => quests.accept('return')).toThrow('reentrant');
  });
});

it('round-trips a joint dialogue/quest/reward payload through SaveManager without replay', async () => {
  const manager = new SaveManager();
  let coins = 0;
  const quests = new QuestSystem(questDefinitions, {
    onReward: (rewards) => {
      coins += rewards.length;
    },
  });
  const dialogue = new Dialogue(dialogueDefinition);
  dialogue.start();
  dialogue.choose('yes');
  quests.accept('delivery');
  quests.progress('delivery', 'parcel', 2);
  const payload = { quests: quests.save(), dialogue: dialogue.save(), coins };
  assertJsonValue(payload);
  await manager.save('narrative', payload);
  const loaded = await manager.load('narrative');
  expect(loaded.status).toBe('loaded');
  if (loaded.status !== 'loaded')
    throw new Error('Expected a saved narrative.');
  const saved = loaded.record.data as unknown as {
    quests: QuestState;
    dialogue: DialogueState;
    coins: number;
  };
  const rewards = vi.fn();
  const restored = new QuestSystem(questDefinitions, { onReward: rewards });
  restored.restore(saved.quests);
  dialogue.restore(saved.dialogue);
  coins = saved.coins;
  expect(coins).toBe(1);
  expect(restored.get('return').status).toBe('available');
  expect(dialogue.view?.node).toBe('accepted');
  expect(rewards).not.toHaveBeenCalled();
  manager.destroy();
});
