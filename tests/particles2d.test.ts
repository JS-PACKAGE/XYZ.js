import { describe, expect, it, vi } from 'vitest';
import { Texture } from '../packages/assets/src/index.js';
import { Group2D } from '../packages/core/src/gameplay/group2d.js';
import {
  ParticleEmitter,
  type ParticleEmitterOptions,
  type ParticleNozzle,
} from '../packages/core/src/particles2d/index.js';
import { Scene } from '../packages/core/src/scene.js';
import { Sprite } from '../packages/core/src/sprite.js';
import { Vector2 } from '../packages/math/src/index.js';
import { world2dLimits } from '../src/data/world2d.js';

function options(
  overrides: Partial<ParticleEmitterOptions> = {},
): ParticleEmitterOptions {
  return {
    texture: new Texture({
      width: 20,
      height: 10,
      close: vi.fn(),
    } as unknown as ImageBitmap),
    capacity: 8,
    rate: 4,
    lifetime: [2, 2],
    speed: [10, 10],
    angle: [0, 0],
    acceleration: [4, -2],
    startSize: [8, 4],
    endSize: [16, 12],
    startColor: [1, 0, 0.2, 1],
    endColor: [0, 1, 0.8, 0],
    seed: 17,
    ...overrides,
  };
}
function live(emitter: ParticleEmitter): Sprite[] {
  return [...emitter.children].filter(
    (child): child is Sprite => child instanceof Sprite && child.renderEnabled,
  );
}
function state(emitter: ParticleEmitter): number[][] {
  return live(emitter).map((p) => [
    p.position.x,
    p.position.y,
    p.scale.x,
    p.scale.y,
    ...p.tint,
  ]);
}

describe('pooled CPU particles', () => {
  it('integrates local acceleration analytically and interpolates logical sizes and tint without changing source dimensions', () => {
    const emitter = new ParticleEmitter(
      options({ source: { x: 2, y: 1, width: 8, height: 4 } }),
    );
    emitter.emit(1);
    const particle = live(emitter)[0];
    emitter.updateSimulation(0.5);
    emitter.updateSimulation(0.5);
    expect(particle.position.x).toBeCloseTo(12);
    expect(particle.position.y).toBeCloseTo(-1);
    expect(particle.width).toBe(8);
    expect(particle.height).toBe(4);
    expect(particle.scale.x).toBeCloseTo(1.5);
    expect(particle.scale.y).toBeCloseTo(2);
    expect(particle.tint).toEqual([0.5, 0.5, 0.5, 0.5]);
    emitter.updateSimulation(1);
    expect(emitter.activeCount).toBe(0);
    expect(particle.renderEnabled).toBe(false);
  });

  it('freezes the full world birth affine axes, position, velocity and acceleration under rotated nonuniform ancestors', () => {
    const ancestor = new Group2D();
    ancestor.position.set(30, -10);
    ancestor.rotation = 0.7;
    ancestor.scale.set(-2, 3);
    const emitter = ancestor.add(
      new ParticleEmitter(options({ space: 'world' })),
    );
    emitter.position.set(5, 9);
    emitter.rotation = -0.4;
    emitter.scale.set(1.5, 0.5);
    const birth = [...emitter.updateWorldMatrix().elements];
    emitter.emit(1);
    const particle = live(emitter)[0];
    ancestor.position.set(-100, 400);
    ancestor.rotation = -1.2;
    ancestor.scale.set(7, -0.1);
    emitter.position.set(50, 70);
    emitter.rotation = 2;
    emitter.scale.set(3, 4);
    emitter.updateSimulation(0.5);
    const matrix = particle.updateWorldMatrix().elements;
    // Local displacement at half a second is (5.5, -0.25); transform
    // directions with birth axes only, never the emitter's current transform.
    expect(matrix[6]).toBeCloseTo(
      birth[6] + birth[0] * 5.5 - birth[3] * 0.25,
      4,
    );
    expect(matrix[7]).toBeCloseTo(
      birth[7] + birth[1] * 5.5 - birth[4] * 0.25,
      4,
    );
    expect(matrix[0]).toBeCloseTo(birth[0] * (10 / 20), 5);
    expect(matrix[1]).toBeCloseTo(birth[1] * (10 / 20), 5);
    expect(matrix[3]).toBeCloseTo(birth[3] * (6 / 10), 5);
    expect(matrix[4]).toBeCloseTo(birth[4] * (6 / 10), 5);
    expect(particle.position.x).toBeCloseTo(matrix[6], 4);
    expect(particle.worldSpace).toBe('world');
  });

  it('keeps local particles attached to changed ancestors and allows a screen-root emitter', () => {
    const ancestor = new Group2D();
    ancestor.space = 'screen';
    const emitter = ancestor.add(
      new ParticleEmitter(options({ space: 'local' })),
    );
    emitter.emit(1);
    const particle = live(emitter)[0];
    emitter.updateSimulation(0.5);
    ancestor.position.set(50, 70);
    ancestor.rotation = 0.6;
    ancestor.scale.set(-3, 2);
    emitter.position.set(4, 8);
    emitter.rotation = -0.2;
    const expected = emitter
      .updateWorldMatrix()
      .transformPoint(particle.position, new Vector2());
    const matrix = particle.updateWorldMatrix().elements;
    expect(matrix[6]).toBeCloseTo(expected.x, 4);
    expect(matrix[7]).toBeCloseTo(expected.y, 4);
    expect(particle.worldSpace).toBe('screen');
  });

  it.each<ParticleNozzle>([
    { kind: 'point' },
    { kind: 'rectangle', width: 12, height: 8 },
    { kind: 'circle', radius: 6 },
  ])(
    'seeds deterministic nozzle, velocity and lifetime variation for $kind',
    (nozzle) => {
      const settings = options({
        nozzle,
        lifetime: [0.1, 2],
        speed: [2, 18],
        angle: [-2, 2],
      });
      const a = new ParticleEmitter(settings);
      const b = new ParticleEmitter(settings);
      const different = new ParticleEmitter({ ...settings, seed: 18 });
      a.emit(8);
      b.emit(8);
      different.emit(8);
      for (const particle of live(a)) {
        if (nozzle.kind === 'point')
          expect([particle.position.x, particle.position.y]).toEqual([0, 0]);
        else if (nozzle.kind === 'rectangle') {
          expect(Math.abs(particle.position.x)).toBeLessThanOrEqual(6);
          expect(Math.abs(particle.position.y)).toBeLessThanOrEqual(4);
        } else
          expect(
            Math.hypot(particle.position.x, particle.position.y),
          ).toBeLessThanOrEqual(6);
      }
      a.updateSimulation(0.4);
      b.updateSimulation(0.4);
      different.updateSimulation(0.4);
      expect(state(a)).toEqual(state(b));
      expect(state(a)).not.toEqual(state(different));
      a.updateSimulation(1.6);
      expect(a.activeCount).toBe(0);
    },
  );

  it('accumulates fractional rate and ages newborns at their birth times', () => {
    const settings = options({ rate: 2.5, acceleration: [0, 0] });
    const whole = new ParticleEmitter(settings);
    const split = new ParticleEmitter(settings);
    whole.start();
    split.start();
    whole.updateSimulation(1);
    split.updateSimulation(0.2);
    expect(split.activeCount).toBe(0);
    split.updateSimulation(0.3);
    expect(split.activeCount).toBe(1);
    split.updateSimulation(0.5);
    expect(whole.activeCount).toBe(2);
    expect(split.activeCount).toBe(2);
    const left = state(whole);
    const right = state(split);
    for (let i = 0; i < left.length; i++)
      for (let j = 0; j < left[i].length; j++)
        expect(right[i][j]).toBeCloseTo(left[i][j], 10);
    whole.updateSimulation(0.2);
    expect(whole.activeCount).toBe(3);
  });

  it('bounds enormous bursts and rate work, drops overflow rather than queuing it, and stops only new births', () => {
    const emitter = new ParticleEmitter(
      options({ capacity: 2, rate: Number.MAX_VALUE }),
    );
    emitter.emit(Number.MAX_SAFE_INTEGER);
    expect(emitter.activeCount).toBe(2);
    emitter.emit(10);
    emitter.stop();
    emitter.updateSimulation(1);
    expect(emitter.activeCount).toBe(2);
    expect(live(emitter)[0].position.x).toBeCloseTo(12);
    emitter.updateSimulation(1);
    expect(emitter.activeCount).toBe(0);
    emitter.updateSimulation(10);
    expect(emitter.activeCount).toBe(0);
    emitter.start();
    emitter.updateSimulation(10);
    expect(emitter.activeCount).toBe(0);
    emitter.updateSimulation(0.1);
    expect(emitter.activeCount).toBe(2);
  });

  it('reuses the same sprites, matrices and colors after clear and resets fractional emission', () => {
    const emitter = new ParticleEmitter(options());
    emitter.emit(8);
    const pool = live(emitter);
    const matrices = pool.map((p) => p.worldMatrix);
    const colors = pool.map((p) => p.tint);
    emitter.start();
    emitter.updateSimulation(0.1);
    emitter.clear();
    expect(emitter.activeCount).toBe(0);
    expect(emitter.emitting).toBe(true);
    emitter.updateSimulation(0.15);
    expect(emitter.activeCount).toBe(0);
    emitter.emit(8);
    expect(live(emitter)).toEqual(pool);
    for (let i = 0; i < pool.length; i++) {
      expect(pool[i].worldMatrix).toBe(matrices[i]);
      expect(pool[i].tint).toBe(colors[i]);
      expect([pool[i].position.x, pool[i].position.y]).toEqual([0, 0]);
      expect(pool[i].tint).toEqual([1, 0, 0.2, 1]);
    }
  });

  it('destroys the entire scene-owned pool without destroying the borrowed texture', () => {
    const settings = options();
    const emitter = new ParticleEmitter(settings);
    const scene = new Scene();
    scene.add(emitter);
    emitter.emit(3);
    emitter.start();
    const descendants = [...emitter.children];
    scene.destroy();
    expect(emitter.destroyed).toBe(true);
    expect(emitter.children.size).toBe(0);
    expect(descendants.every((child) => child.destroyed && !child.scene)).toBe(
      true,
    );
    expect(emitter.activeCount).toBe(0);
    expect(emitter.emitting).toBe(false);
    expect(settings.texture!.destroyed).toBe(false);
    expect((settings.texture as Texture).image.close).not.toHaveBeenCalled();
    expect(() => emitter.emit(1)).toThrow();
    expect(() => emitter.start()).toThrow();
    emitter.destroy();
  });

  it('rejects resource, lifetime, color, nozzle and burst boundary violations', () => {
    expect(
      () =>
        new ParticleEmitter(options({ capacity: world2dLimits.particles + 1 })),
    ).toThrow(RangeError);
    expect(() => new ParticleEmitter(options({ lifetime: [0, 1] }))).toThrow(
      RangeError,
    );
    expect(() => new ParticleEmitter(options({ speed: [3, 2] }))).toThrow(
      RangeError,
    );
    expect(
      () =>
        new ParticleEmitter(
          options({ nozzle: { kind: 'circle', radius: -1 } }),
        ),
    ).toThrow(RangeError);
    expect(
      () => new ParticleEmitter(options({ startColor: [1, 0, 0, 2] })),
    ).toThrow(RangeError);
    const emitter = new ParticleEmitter(options());
    expect(() => emitter.emit(-1)).toThrow(RangeError);
    expect(() => emitter.updateSimulation(NaN)).toThrow(RangeError);
    expect(emitter.activeCount).toBe(0);
  });
});
