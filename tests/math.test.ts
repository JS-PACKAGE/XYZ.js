import { describe, expect, it } from 'vitest';
import { Matrix3, Transform2D, Vector2 } from '../packages/math/src/index.js';

describe('2D math', () => {
  it('mutates vectors in place and preserves zero on normalization', () => {
    const vector = new Vector2(3, 4);
    const copy = vector.clone();
    expect(copy).not.toBe(vector);
    expect(vector.length()).toBe(5);
    expect(vector.normalize()).toBe(vector);
    expect(vector.length()).toBeCloseTo(1);
    expect(
      vector.scale(5).subtract(new Vector2(1, 2)).add(new Vector2(1, 2)),
    ).toBe(vector);
    expect(vector.x).toBeCloseTo(copy.x);
    expect(vector.y).toBeCloseTo(copy.y);
    expect(new Vector2().normalize()).toEqual(new Vector2());
    expect(new Vector2().copy(vector).set(7, 8)).toEqual(new Vector2(7, 8));
  });

  it('composes translation, rotation, and nonuniform scale in that order', () => {
    const matrix = new Matrix3().compose(
      new Vector2(10, 20),
      Math.PI / 2,
      new Vector2(2, 3),
    );
    const out = new Vector2();
    expect(matrix.transformPoint(new Vector2(1, 2), out)).toBe(out);
    expect(out.x).toBeCloseTo(4);
    expect(out.y).toBeCloseTo(22);
    expect(matrix.elements[6]).toBe(10);
    expect(matrix.elements[7]).toBe(20);
  });

  it('roundtrips points using inverse, including aliased outputs', () => {
    const matrix = new Matrix3().compose(
      new Vector2(-8, 4),
      0.47,
      new Vector2(2, -3),
    );
    const point = new Vector2(7, -5);
    matrix.transformPoint(point, point);
    matrix.invert().transformPoint(point, point);
    expect(point.x).toBeCloseTo(7, 5);
    expect(point.y).toBeCloseTo(-5, 5);
    expect(matrix.identity().transformPoint(point)).toEqual(point);
  });

  it('rejects singular inverse without changing its matrix', () => {
    const matrix = new Matrix3().compose(
      new Vector2(2, 3),
      0.8,
      new Vector2(0, 2),
    );
    const original = Array.from(matrix.elements);
    expect(() => matrix.invert()).toThrow(RangeError);
    expect(Array.from(matrix.elements)).toEqual(original);
  });

  it('initializes independent transforms and updates the same reusable matrix', () => {
    const source = new Vector2(3, 4);
    const transform = new Transform2D({
      position: source,
      rotation: Math.PI / 2,
    });
    source.set(50, 60);
    expect(transform.matrix.transformPoint(new Vector2(1, 0)).x).toBeCloseTo(3);
    transform.position.set(6, 7);
    transform.scale.set(2, 2);
    const matrix = transform.matrix;
    expect(transform.updateMatrix()).toBe(matrix);
    const transformed = matrix.transformPoint(new Vector2(1, 0));
    expect(transformed.x).toBeCloseTo(6);
    expect(transformed.y).toBeCloseTo(9);
    expect(new Transform2D().matrix.transformPoint(new Vector2(5, 6))).toEqual(
      new Vector2(5, 6),
    );
  });
});
