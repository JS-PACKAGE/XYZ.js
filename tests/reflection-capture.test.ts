import { describe, expect, it } from 'vitest';
import { Scene } from '../packages/core/src/scene.js';
import { ReflectionProbe } from '../packages/core/src/reflection-probe.js';
import { EnvironmentMap } from '../packages/core/src/environment.js';
import {
  captureConfiguration,
  encodeProbeFaces,
  capturedEnvironment,
  ProbeCaptureScheduler,
} from '../packages/graphics/src/reflection-capture.js';
import { RenderGraph } from '../packages/graphics/src/render-graph.js';
import { PostProcessor2D } from '../packages/core/src/materials2d/material2d.js';

function fixture() {
  const scene = new Scene();
  const map = EnvironmentMap.gradient({
    width: 8,
    zenith: [1, 0, 0],
    horizon: [1, 0, 0],
    ground: [1, 0, 0],
  });
  const probe = new ReflectionProbe({
    environment: map,
    position: [0, 0, 0],
    min: [-2, -2, -2],
    max: [2, 2, 2],
    dynamic: true,
  });
  scene.reflectionProbes.push(probe);
  return { scene, map, probe };
}

describe('native reflection capture contract', () => {
  it('encodes six distinct orthogonal views and restores camera/post/probes after a failed face', () => {
    const { scene, map, probe } = fixture();
    const camera = scene.camera3D;
    scene.background = map;
    scene.postProcessing.enabled =
      scene.postProcessing.taa =
      scene.postProcessing.ssr =
        true;
    const effect = new PostProcessor2D({
      wgsl: 'fn effect(color: vec4f, uv: vec2f, screen: vec2f) -> vec4f { return color; }',
      glsl: 'vec4 effect(vec4 color, vec2 uv, vec2 screen) { return color; }',
    });
    const graph = new RenderGraph({
      targets: [{ name: 'output' }],
      passes: [{ name: 'pass', inputs: ['$scene'], output: 'output', effect }],
      output: 'output',
    });
    scene.renderGraph = graph;
    const matrices: number[][] = [];
    encodeProbeFaces(scene, probe, {}, (_face, next) => {
      expect(next.fov).toBe(Math.PI / 2);
      expect(probe.enabled).toBe(false);
      expect(scene.postProcessing.enabled).toBe(false);
      expect(scene.renderGraph).toBeUndefined();
      matrices.push([...next.matrix.elements]);
    });
    expect(new Set(matrices.map((m) => m.join(','))).size).toBe(6);
    expect(scene.camera3D).toBe(camera);
    expect(() =>
      encodeProbeFaces(scene, probe, { includeBackground: false }, (face) => {
        expect(scene.background).toBeUndefined();
        if (face === 2) throw new Error('native capture failed');
      }),
    ).toThrow('native capture failed');
    expect(scene.camera3D).toBe(camera);
    expect(scene.background).toBe(map);
    expect(scene.renderGraph).toBe(graph);
    expect(
      scene.postProcessing.enabled &&
        scene.postProcessing.taa &&
        scene.postProcessing.ssr &&
        probe.enabled,
    ).toBe(true);
    scene.destroy();
    map.destroy();
  });

  it('rejects insufficient storage and abort before mutating scene state', () => {
    const { scene, map, probe } = fixture();
    const camera = scene.camera3D;
    expect(() => captureConfiguration(probe, { maxBytes: 1 })).toThrow(
      RangeError,
    );
    const controller = new AbortController();
    controller.abort();
    expect(() =>
      encodeProbeFaces(scene, probe, { signal: controller.signal }, () => {
        throw new Error('must not encode');
      }),
    ).toThrow();
    expect(scene.camera3D).toBe(camera);
    scene.destroy();
    map.destroy();
  });

  it('converts actual face colors, and replacement ownership never destroys a borrowed map', () => {
    const { scene, map, probe } = fixture();
    const faces = Array.from({ length: 6 }, (_, face) => {
      const data = new Float32Array(2 * 2 * 4);
      for (let i = 0; i < 4; i++) data.set([face + 1, 0, 0, 1], i * 4);
      return data;
    });
    const first = capturedEnvironment(2, faces);
    expect(first.width).toBe(8);
    const second = capturedEnvironment(2, faces);
    probe.adoptCapture(first);
    probe.adoptCapture(second);
    expect(first.destroyed).toBe(true);
    expect(map.destroyed).toBe(false);
    probe.destroy();
    expect(second.destroyed).toBe(true);
    scene.destroy();
    map.destroy();
  });

  it('allows one pending automatic capture and no recapture inside its simulation interval', async () => {
    const { scene, map, probe } = fixture();
    const scheduler = new ProbeCaptureScheduler();
    let captures = 0,
      finish!: (map: EnvironmentMap) => void;
    const capture = () => {
      captures++;
      return new Promise<EnvironmentMap>((resolve) => {
        finish = resolve;
      });
    };
    const failure = () => {
      throw new Error('unexpected capture failure');
    };
    scheduler.schedule(scene, capture, failure);
    scheduler.schedule(scene, capture, failure);
    expect(captures).toBe(1);
    const result = EnvironmentMap.gradient({
      width: 8,
      zenith: [0, 1, 0],
      horizon: [0, 1, 0],
      ground: [0, 1, 0],
    });
    finish(result);
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    scheduler.schedule(scene, capture, failure);
    expect(captures).toBe(1);
    expect(probe.environment).toBe(result);
    probe.destroy();
    scene.destroy();
    map.destroy();
  });

  it('reclaims late capture when the probe was removed from its scene', async () => {
    const { scene, map, probe } = fixture();
    const scheduler = new ProbeCaptureScheduler();
    let resolve!: (map: EnvironmentMap) => void;
    const promise = new Promise<EnvironmentMap>((finish) => {
      resolve = finish;
    });
    scheduler.schedule(
      scene,
      () => promise,
      () => {
        throw new Error('unexpected capture failure');
      },
    );
    scene.reflectionProbes.splice(0, 1);
    const result = EnvironmentMap.gradient({
      width: 8,
      zenith: [0, 1, 0],
      horizon: [0, 1, 0],
      ground: [0, 1, 0],
    });
    resolve(result);
    await Promise.resolve();
    await Promise.resolve();
    expect(result.destroyed).toBe(true);
    expect(probe.environment).toBe(map);
    scene.destroy();
    map.destroy();
  });
});
