import { describe, expect, it, vi } from 'vitest';
import {
  AnimationClip,
  AnimationMixer,
  KeyframeTrack,
} from '../packages/core/src/animation.js';
import { AnimationStateMachine } from '../packages/core/src/animation-state.js';
import { Group } from '../packages/core/src/group.js';

/** A clip that moves x linearly from `from` to `to` over `seconds`. */
function slide(
  target: Group,
  from: number,
  to: number,
  seconds = 1,
  name = 'slide',
) {
  return new AnimationClip(name, [
    new KeyframeTrack(
      target,
      'translation',
      [0, seconds],
      [from, 0, 0, to, 0, 0],
    ),
  ]);
}

describe('AnimationAction blending', () => {
  it('layers a lower-weight action over the pose below it and keeps weight 1 as replace', () => {
    const target = new Group();
    const mixer = new AnimationMixer();
    mixer.clipAction(slide(target, 10, 10, 1, 'base')).play();
    const top = mixer.clipAction(slide(target, 20, 20, 1, 'top')).play();
    mixer.update(0.1);
    expect(target.position.x).toBe(20);
    top.weight = 0.25;
    mixer.update(0.1);
    expect(target.position.x).toBeCloseTo(12.5);
    top.weight = 0;
    mixer.update(0.1);
    // Weight 0 leaves only the base layer.
    expect(target.position.x).toBe(10);
    expect(top.effectiveWeight).toBe(0);
  });

  it('cross-fades with linear weights and stops the outgoing action when it reaches zero', () => {
    const target = new Group();
    const mixer = new AnimationMixer();
    const a = mixer.clipAction(slide(target, 0, 0, 10, 'a')).play();
    const b = mixer.clipAction(slide(target, 100, 100, 10, 'b'));
    a.crossFadeTo(b, 1);
    mixer.update(0.5);
    expect(target.position.x).toBeCloseTo(50);
    mixer.update(0.25);
    expect(target.position.x).toBeCloseTo(75);
    mixer.update(0.25);
    expect(target.position.x).toBe(100);
    expect(a.playing).toBe(false);
    expect(b.playing).toBe(true);
    expect(b.effectiveWeight).toBe(1);
    mixer.update(5);
    expect(target.position.x).toBe(100);
  });

  it('raises the incoming action above the outgoing one even when it was created first', () => {
    const target = new Group();
    const mixer = new AnimationMixer();
    const incoming = mixer.clipAction(slide(target, 100, 100, 10, 'in'));
    const outgoing = mixer.clipAction(slide(target, 0, 0, 10, 'out')).play();
    outgoing.crossFadeTo(incoming, 1);
    mixer.update(0.25);
    // With incoming layered on top the pose is lerp(0, 100, 0.25), not lerp(100, 0, 0.75).
    expect(target.position.x).toBeCloseTo(25);
  });

  it('fades a single action in from the current pose', () => {
    const target = new Group();
    target.position.set(4, 0, 0);
    const mixer = new AnimationMixer();
    mixer.clipAction(slide(target, 10, 10, 1)).fadeIn(2);
    mixer.update(1);
    expect(target.position.x).toBeCloseTo(7);
  });

  it('blends rotations along the shortest path and normalizes', () => {
    const target = new Group();
    const half = Math.SQRT1_2;
    const clip = new AnimationClip('turn', [
      new KeyframeTrack(
        target,
        'rotation',
        [0, 1],
        [0, 0, half, half, 0, 0, half, half],
      ),
    ]);
    const mixer = new AnimationMixer();
    const action = mixer.clipAction(clip).play();
    action.weight = 0.5;
    mixer.update(0.1);
    const q = target.rotation;
    expect(Math.hypot(q.x, q.y, q.z, q.w)).toBeCloseTo(1);
    expect(q.z).toBeGreaterThan(0);
    expect(q.w).toBeGreaterThan(0.7);
  });

  it('supports ping-pong, counts loops and reports finish exactly once', () => {
    const target = new Group();
    const mixer = new AnimationMixer();
    const action = mixer.clipAction(slide(target, 0, 10, 1));
    action.loopMode = 'pingpong';
    const loops = vi.fn();
    action.on('loop', loops).play();
    mixer.update(0.75);
    expect(action.time).toBeCloseTo(0.75);
    mixer.update(0.5);
    // 1.25 s into a 1 s clip: on the way back at 0.75.
    expect(action.time).toBeCloseTo(0.75);
    expect(target.position.x).toBeCloseTo(7.5);
    expect(loops).toHaveBeenCalledTimes(0);
    mixer.update(1);
    expect(action.time).toBeCloseTo(0.25);
    expect(loops).toHaveBeenCalledTimes(1);

    const once = mixer.clipAction(slide(target, 0, 1, 1, 'once'));
    once.loop = false;
    const finished = vi.fn();
    once.on('finished', finished).play();
    mixer.update(0.6);
    mixer.update(0.6);
    mixer.update(1);
    expect(finished).toHaveBeenCalledTimes(1);
    expect(once.normalizedTime).toBe(1);
    expect(once.playing).toBe(false);
  });

  it('still lets callers seek by assigning time', () => {
    const target = new Group();
    const mixer = new AnimationMixer();
    const action = mixer.clipAction(slide(target, 0, 10, 1)).play();
    action.time = 0.5;
    mixer.update(0.1);
    expect(target.position.x).toBeCloseTo(6);
    expect(() => {
      action.time = -1;
    }).toThrow(RangeError);
  });
});

describe('AnimationStateMachine', () => {
  function rig() {
    const target = new Group();
    const mixer = new AnimationMixer();
    const idle = slide(target, 0, 0, 1, 'idle');
    const run = slide(target, 50, 50, 1, 'run');
    const jump = slide(target, 100, 100, 1, 'jump');
    const machine = new AnimationStateMachine(mixer, {
      initial: 'idle',
      states: {
        idle: { clip: idle },
        run: { clip: run, speed: 2 },
        jump: { clip: jump, loop: false },
      },
      parameters: { speed: 0, grounded: true },
      triggers: ['jump'],
      transitions: [
        {
          from: 'idle',
          to: 'run',
          duration: 0.5,
          when: (p) => (p.speed as number) > 0.1,
        },
        {
          from: 'run',
          to: 'idle',
          duration: 0.5,
          when: (p) => (p.speed as number) <= 0.1,
        },
        { from: '*', to: 'jump', duration: 0, trigger: 'jump' },
        { from: 'jump', to: 'idle', duration: 0.1, exitTime: 1 },
      ],
    });
    return { target, mixer, machine };
  }

  it('starts in the initial state and cross-fades when a parameter condition holds', () => {
    const { target, mixer, machine } = rig();
    const changes: string[] = [];
    machine.addEventListener('statechange', (e) =>
      changes.push(
        `${(e as CustomEvent).detail.from}>${(e as CustomEvent).detail.to}`,
      ),
    );
    mixer.update(0.1);
    expect(machine.current).toBe('idle');
    expect(target.position.x).toBe(0);
    machine.setParameter('speed', 1);
    mixer.update(0.25);
    expect(machine.current).toBe('run');
    // Half a second fade, a quarter of it elapsed: run is layered at weight 0.5 (0.25 / 0.5).
    expect(target.position.x).toBeCloseTo(25);
    mixer.update(0.5);
    expect(target.position.x).toBe(50);
    expect(machine.action.clip.name).toBe('run');
    expect(machine.action.timeScale).toBe(2);
    expect(changes).toEqual(['idle>run']);
  });

  it('consumes a trigger once, plays a non-looping state and returns via exitTime', () => {
    const { target, mixer, machine } = rig();
    machine.trigger('jump');
    mixer.update(0.1);
    expect(machine.current).toBe('jump');
    expect(target.position.x).toBe(100);
    // The trigger is spent: staying in jump must not re-enter it.
    mixer.update(0.5);
    expect(machine.current).toBe('jump');
    mixer.update(0.5);
    mixer.update(0.05);
    expect(machine.current).toBe('idle');
    mixer.update(0.2);
    expect(target.position.x).toBe(0);
  });

  it('rejects unknown states, undeclared parameters or triggers and type changes', () => {
    const { machine, mixer } = rig();
    expect(() => machine.setParameter('nope', 1)).toThrow(RangeError);
    expect(() => machine.setParameter('speed', true)).toThrow(TypeError);
    expect(() => machine.setParameter('speed', Number.NaN)).toThrow(TypeError);
    expect(() => machine.trigger('nope')).toThrow(RangeError);
    expect(() => machine.setState('nope')).toThrow(RangeError);
    const clip = slide(new Group(), 0, 1);
    expect(
      () =>
        new AnimationStateMachine(mixer, {
          initial: 'a',
          states: { a: { clip } },
          transitions: [{ from: 'a', to: 'b' }],
        }),
    ).toThrow(RangeError);
    // A transition without any condition would loop forever from a repeating source.
    expect(
      () =>
        new AnimationStateMachine(mixer, {
          initial: 'a',
          states: { a: { clip }, b: { clip } },
          transitions: [{ from: 'a', to: 'b' }],
        }),
    ).toThrow(RangeError);
    expect(
      () =>
        new AnimationStateMachine(mixer, {
          initial: 'a',
          states: { a: { clip } },
          transitions: [{ from: 'a', to: 'a', trigger: 'x' }],
        }),
    ).toThrow(RangeError);
  });

  it('stops evaluating once destroyed and can be forced into a state', () => {
    const { machine, mixer, target } = rig();
    machine.setState('jump', 0);
    mixer.update(0.1);
    expect(target.position.x).toBe(100);
    machine.destroy();
    machine.setParameter('speed', 1);
    mixer.update(0.1);
    expect(machine.current).toBe('jump');
  });
});
