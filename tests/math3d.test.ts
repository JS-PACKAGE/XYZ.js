import { describe, expect, it } from 'vitest';
import {
  Matrix4,
  Quaternion,
  Transform3D,
  Vector3,
} from '../packages/math/src/index.js';

describe('3D math', () => {
  it('supports mutable vector operations, including an aliased cross product', () => {
    const vector = new Vector3(2, 3, 6);
    expect(vector.length()).toBe(7);
    expect(vector.dot(new Vector3(1, 2, 3))).toBe(26);
    expect(vector.normalize()).toBe(vector);
    expect(vector.length()).toBeCloseTo(1);
    expect(new Vector3().normalize()).toEqual(new Vector3());
    const other = vector.clone();
    expect(other).not.toBe(vector);
    expect(
      other.copy(new Vector3(1, 0, 0)).cross(new Vector3(0, 1, 0)),
    ).toEqual(new Vector3(0, 0, 1));
    expect(
      other
        .set(2, 3, 4)
        .add(new Vector3(1, 1, 1))
        .subtract(new Vector3(1, 1, 1))
        .scale(2),
    ).toEqual(new Vector3(4, 6, 8));
    expect(new Vector3(1, 2, 3).cross(new Vector3(1, 2, 3))).toEqual(
      new Vector3(),
    );
  });

  it('turns intrinsic XYZ Euler angles into a unit quaternion and rotates points', () => {
    const quaternion = new Quaternion().setFromEuler(
      Math.PI / 2,
      Math.PI / 2,
      0,
    );
    expect(
      Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w),
    ).toBeCloseTo(1);
    const point = new Matrix4()
      .compose(new Vector3(), quaternion, new Vector3(1, 1, 1))
      .transformPoint(new Vector3(0, 0, 1));
    expect(point.x).toBeCloseTo(1);
    expect(point.y).toBeCloseTo(0);
    expect(point.z).toBeCloseTo(0);
    const normalized = quaternion.clone();
    normalized
      .set(
        normalized.x * 3,
        normalized.y * 3,
        normalized.z * 3,
        normalized.w * 3,
      )
      .normalize();
    expect(normalized.x).toBeCloseTo(quaternion.x);
    expect(normalized.y).toBeCloseTo(quaternion.y);
    expect(normalized.z).toBeCloseTo(quaternion.z);
    expect(normalized.w).toBeCloseTo(quaternion.w);
  });

  it('composes translation, rotation and scale, then inverts without replacing the elements', () => {
    const translation = new Vector3(10, 20, 30);
    const rotation = new Quaternion().setFromEuler(0, 0, Math.PI / 2);
    const scale = new Vector3(2, 3, -4);
    const matrix = new Matrix4().compose(translation, rotation, scale);
    const point = new Vector3(1, 2, 3);
    const transformed = matrix.transformPoint(point, point);
    expect(transformed).toBe(point);
    expect(point.x).toBeCloseTo(4);
    expect(point.y).toBeCloseTo(22);
    expect(point.z).toBeCloseTo(18);
    const elements = matrix.elements;
    matrix.invert().transformPoint(point, point);
    expect(matrix.elements).toBe(elements);
    expect(point.x).toBeCloseTo(1, 4);
    expect(point.y).toBeCloseTo(2, 4);
    expect(point.z).toBeCloseTo(3, 4);
    expect(matrix.identity().transformPoint(point)).toEqual(point);
  });

  it('multiplies in column-vector order even when the right operand aliases this', () => {
    const translation = new Matrix4().compose(
      new Vector3(5, 0, 0),
      new Quaternion(),
      new Vector3(1, 1, 1),
    );
    const rotation = new Matrix4().compose(
      new Vector3(),
      new Quaternion().setFromEuler(0, 0, Math.PI / 2),
      new Vector3(1, 1, 1),
    );
    const combined = new Matrix4().copy(translation).multiply(rotation);
    const point = combined.transformPoint(new Vector3(1, 0, 0));
    expect(point.x).toBeCloseTo(5);
    expect(point.y).toBeCloseTo(1);
    const self = new Matrix4().copy(combined);
    expect(self.multiply(self)).toBe(self);
    const doubled = self.transformPoint(new Vector3(1, 0, 0));
    expect(doubled.x).toBeCloseTo(4);
    expect(doubled.y).toBeCloseTo(5);
  });

  it('throws for a singular matrix before mutating any element', () => {
    const matrix = new Matrix4().compose(
      new Vector3(2, 3, 4),
      new Quaternion().setFromEuler(0.2, 0.3, 0.4),
      new Vector3(0, 2, 3),
    );
    const original = Array.from(matrix.elements);
    expect(() => matrix.invert()).toThrow(RangeError);
    expect(Array.from(matrix.elements)).toEqual(original);
  });

  it('projects a right-handed camera near and far plane into WebGPU depth', () => {
    const projection = new Matrix4().perspective(Math.PI / 2, 2, 1, 11);
    expect(projection.transformPoint(new Vector3(0, 0, -1)).z).toBeCloseTo(0);
    expect(projection.transformPoint(new Vector3(0, 0, -11)).z).toBeCloseTo(1);
    const projected = new Vector3(2, 2, -2);
    expect(projection.transformPoint(projected, projected)).toBe(projected);
    expect(projected.x).toBeCloseTo(0.5);
    expect(projected.y).toBeCloseTo(1);
    const original = new Vector3(0.3, -0.2, -4);
    const roundtrip = projection.transformPoint(original);
    projection.invert().transformPoint(roundtrip, roundtrip);
    expect(roundtrip.x).toBeCloseTo(original.x, 5);
    expect(roundtrip.y).toBeCloseTo(original.y, 5);
    expect(roundtrip.z).toBeCloseTo(original.z, 5);
  });

  it('clones transform inputs and reuses its matrix on each update', () => {
    const position = new Vector3(1, 2, 3);
    const rotation = new Quaternion().setFromEuler(0, Math.PI / 2, 0);
    const scale = new Vector3(2, 2, 2);
    const transform = new Transform3D({ position, rotation, scale });
    position.set(100, 100, 100);
    rotation.set(0, 0, 0, 1);
    scale.set(1, 1, 1);
    const transformed = transform.matrix.transformPoint(new Vector3(0, 0, 1));
    expect(transformed.x).toBeCloseTo(3);
    expect(transformed.y).toBeCloseTo(2);
    expect(transformed.z).toBeCloseTo(3);
    const matrix = transform.matrix;
    transform.position.set(4, 5, 6);
    expect(transform.updateMatrix()).toBe(matrix);
    expect(matrix.transformPoint(new Vector3(0, 0, 1)).x).toBeCloseTo(6);
    expect(
      new Transform3D().matrix.transformPoint(new Vector3(1, 2, 3)),
    ).toEqual(new Vector3(1, 2, 3));
  });
});
