import { describe, expect, it } from 'vitest';
import { LIGHTING_FLOAT_COUNT } from '../src/data/rendering.js';
import {
  uploadChangedSpan,
  uploadSceneBlock,
} from '../packages/graphics/src/webgpu-mesh-pipeline.js';
import { fillLightingData } from '../packages/core/src/render-data.js';
import { PointLight, SpotLight } from '../packages/core/src/lights.js';
import { Scene } from '../packages/core/src/scene.js';

describe('uploadSceneBlock', () => {
  it('keeps the GPU copy equal to the full block as light counts change', () => {
    // A zero-initialised GPU buffer that applies writes like GPUQueue.writeBuffer.
    const gpu = new Uint32Array(20 + LIGHTING_FLOAT_COUNT + 36);
    const queue = {
      writeBuffer(
        _buffer: GPUBuffer,
        offset: number,
        source: Uint32Array,
        start: number,
        size: number,
      ) {
        gpu.set(source.subarray(start, start + size), offset / 4);
      },
    } as unknown as GPUQueue;
    const data = new Float32Array(gpu.length);
    const bits = new Uint32Array(data.buffer);
    const uploaded = {
      scenePoints: 0,
      sceneSpots: 0,
      sceneSent: new Uint32Array(gpu.length),
    };
    const scene = new Scene();
    const points = Array.from({ length: 5 }, (_, i) => {
      const light = new PointLight();
      light.position.set(i, 2, 3);
      return light;
    });
    const spots = Array.from({ length: 3 }, (_, i) => {
      const light = new SpotLight();
      light.position.set(-i, 1, 0);
      return light;
    });
    for (const [p, s] of [
      [3, 2],
      [1, 0],
      [0, 0],
      [5, 3],
      [2, 1],
    ] as const) {
      fillLightingData(scene, data.subarray(20), {
        pointLights: points.slice(0, p),
        spotLights: spots.slice(0, s),
      });
      for (let i = 0; i < 20; i++) data[i] = p * 100 + i;
      data.fill(s + 0.5, 20 + LIGHTING_FLOAT_COUNT);
      const bytes = uploadSceneBlock(
        queue,
        {} as GPUBuffer,
        data,
        bits,
        uploaded,
      );
      expect(gpu).toEqual(bits);
      expect(bytes).toBeLessThan(data.byteLength);
      // An unchanged block costs nothing on the next frame.
      expect(
        uploadSceneBlock(queue, {} as GPUBuffer, data, bits, uploaded),
      ).toBe(0);
    }
  });
});

describe('uploadChangedSpan', () => {
  it('keeps the GPU bits equal to the staged block and skips unchanged ranges', () => {
    const gpu = new Uint32Array(40);
    const queue = {
      writeBuffer(
        _buffer: GPUBuffer,
        offset: number,
        source: Uint32Array,
        start: number,
        size: number,
      ) {
        gpu.set(source.subarray(start, start + size), offset / 4);
      },
    } as unknown as GPUQueue;
    const data = new Float32Array(40);
    const bits = new Uint32Array(data.buffer);
    const sent = new Uint32Array(40);
    const upload = (start = 0, end = 40) =>
      uploadChangedSpan(queue, {} as GPUBuffer, bits, sent, start, end);
    expect(upload()).toBe(0);
    data[3] = 1;
    data[17] = -2;
    expect(upload()).toBe(15 * 4);
    expect(gpu).toEqual(bits);
    expect(upload()).toBe(0);
    // Sign and NaN payload changes are not equal under float comparison rules.
    data[5] = -0;
    expect(upload()).toBe(4);
    bits[9] = 0x7fc00001;
    expect(upload()).toBe(4);
    bits[9] = 0x7fc00002;
    expect(upload()).toBe(4);
    expect(gpu).toEqual(bits);
    // A restricted range leaves differences outside it pending.
    data[0] = 7;
    data[39] = 8;
    expect(upload(1, 39)).toBe(0);
    expect(upload(30, 40)).toBe(4);
    expect(gpu[0]).toBe(0);
    expect(upload()).toBe(4);
    expect(gpu).toEqual(bits);
  });
});
