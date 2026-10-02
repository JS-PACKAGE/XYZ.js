import { describe, expect, it } from 'vitest';
import { GPUParticleEmitter3D } from '../packages/core/src/gpu-particles3d.js';
import { Object3D } from '../packages/core/src/object3d.js';
import { Scene } from '../packages/core/src/scene.js';
import { GPU_PARTICLE_COMMAND_FLOATS } from '../src/data/gpu-particles3d.js';

function commands(
  emitter: GPUParticleEmitter3D,
): { age: number; sequence: number; matrix: number[] }[] {
  const words = new Uint32Array(emitter.commandData.buffer);
  return Array.from({ length: emitter.activeCount }, (_, index) => {
    const base =
      ((emitter.commandHead + index) % emitter.capacity) *
      GPU_PARTICLE_COMMAND_FLOATS;
    return {
      age: emitter.shaderTime - emitter.commandData[base],
      sequence: words[base + 1],
      matrix: Array.from(emitter.commandData.subarray(base + 4, base + 20)),
    };
  });
}

describe('GPU particle emission command lifecycle', () => {
  it('drops new bursts without queuing overflow and expires at the exclusive endpoint', () => {
    const emitter = new GPUParticleEmitter3D({ capacity: 2, lifetime: 1 });
    expect(emitter.burst(5)).toBe(2);
    expect(emitter.droppedCount).toBe(3);
    emitter.stop();
    emitter.updateSimulation(0.5);
    expect(emitter.burst(1)).toBe(0);
    emitter.updateSimulation(0.5);
    expect(emitter.activeCount).toBe(0);
    expect(emitter.burst(1)).toBe(1);
    expect(commands(emitter)[0].sequence).toBe(6);
  });

  it('freezes command age and fractional rate on pause, but stop only disables admission', () => {
    const emitter = new GPUParticleEmitter3D({
      capacity: 4,
      rate: 2,
      lifetime: 2,
    });
    emitter.updateSimulation(0.25);
    emitter.pause();
    emitter.updateSimulation(5);
    expect(emitter.time).toBe(0.25);
    expect(emitter.activeCount).toBe(0);
    emitter.resume();
    emitter.updateSimulation(0.25);
    expect(emitter.activeCount).toBe(1);
    expect(commands(emitter)[0].age).toBeCloseTo(0);
    emitter.stop();
    emitter.updateSimulation(1);
    expect(commands(emitter)[0].age).toBeCloseTo(1);
    emitter.updateSimulation(1);
    expect(emitter.activeCount).toBe(0);
  });

  it('uses chronological capacity admission independent of update partition, including huge time skips', () => {
    for (const [capacity, rate, lifetime] of [
      [3, 11, 0.7],
      [5, 7, 1.3],
      [2, 4, 0.5],
    ]) {
      const whole = new GPUParticleEmitter3D({
        capacity,
        rate,
        lifetime,
        seed: 91,
      });
      const split = new GPUParticleEmitter3D({
        capacity,
        rate,
        lifetime,
        seed: 91,
      });
      whole.burst(1);
      split.burst(1);
      whole.updateSimulation(100);
      for (let tick = 0; tick < 1000; tick++) split.updateSimulation(0.1);
      expect(whole.activeCount).toBe(split.activeCount);
      expect(whole.droppedCount).toBe(split.droppedCount);
      const a = commands(whole),
        b = commands(split);
      expect(a.map((command) => command.sequence)).toEqual(
        b.map((command) => command.sequence),
      );
      for (let i = 0; i < a.length; i++)
        expect(a[i].age).toBeCloseTo(b[i].age, 4);
      whole.destroy();
      split.destroy();
    }
  });

  it('retains world birth affine transforms through ancestor motion and samples new births at the new pose', () => {
    const parent = new Object3D();
    parent.position.set(3, 4, 5);
    parent.scale.set(2, 3, 4);
    const emitter = parent.add(
      new GPUParticleEmitter3D({ capacity: 4, space: 'world' }),
    );
    emitter.burst(1);
    const first = commands(emitter)[0].matrix;
    parent.position.set(-8, 9, 10);
    emitter.updateSimulation(0.25);
    emitter.burst(1);
    const births = commands(emitter);
    expect(births[0].matrix).toEqual(first);
    expect(births[0].matrix.slice(12, 15)).toEqual([3, 4, 5]);
    expect(births[1].matrix.slice(12, 15)).toEqual([-8, 9, 10]);
    expect(emitter.updateWorldMatrix().elements[12]).toBe(-8);
  });

  it('releases native owners on clear, detachment and destruction without retaining callbacks', () => {
    const scene = new Scene();
    const emitter = scene.add(new GPUParticleEmitter3D({ capacity: 1 }));
    let releases = 0;
    emitter.ownNative(() => releases++);
    emitter.burst(1);
    emitter.clear();
    expect(emitter.activeCount).toBe(0);
    emitter.clear();
    expect(releases).toBe(1);
    emitter.ownNative(() => releases++);
    scene.remove(emitter);
    expect(releases).toBe(2);
    emitter.ownNative(() => releases++);
    emitter.destroy();
    emitter.destroy();
    expect(releases).toBe(3);
    expect(emitter.commandData.byteLength).toBe(0);
    expect(() => emitter.burst(1)).toThrow();
    scene.destroy();
  });

  it('rebases long-running shader clocks without changing live command ages or seeds', () => {
    const emitter = new GPUParticleEmitter3D({
      capacity: 1,
      lifetime: 10,
      seed: 0xffff_ffff,
    });
    emitter.updateSimulation(1023.75);
    emitter.burst(1);
    const sequence = commands(emitter)[0].sequence;
    emitter.updateSimulation(0.5);
    expect(emitter.shaderTime).toBe(0.25);
    expect(commands(emitter)[0].age).toBeCloseTo(0.5);
    expect(commands(emitter)[0].sequence).toBe(sequence);
  });
});
