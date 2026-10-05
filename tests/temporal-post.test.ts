import { describe, expect, it } from 'vitest';
import { PerspectiveCamera } from '../packages/core/src/perspective-camera.js';
import { OrthographicCamera } from '../packages/core/src/orthographic-camera.js';
import { PostProcessingSettings } from '../packages/core/src/render-settings.js';
import { Matrix4, Vector3 } from '../packages/math/src/index.js';
import {
  TemporalPostState,
  writeTemporalUniforms,
} from '../packages/graphics/src/temporal-post.js';

interface TemporalFixture {
  state: TemporalPostState;
  scene: object;
  camera: PerspectiveCamera;
  settings: PostProcessingSettings;
}

function fixture(): TemporalFixture {
  return {
    state: new TemporalPostState(),
    scene: {},
    camera: new PerspectiveCamera(),
    settings: new PostProcessingSettings({
      taa: true,
      taaCameraCutDistance: 2,
    }),
  };
}

describe('temporal camera history', () => {
  it('jitter really moves projected pixels and inverse reconstruction remains exact', () => {
    for (const camera of [new PerspectiveCamera(), new OrthographicCamera()]) {
      const state = new TemporalPostState(),
        settings = new PostProcessingSettings({ taa: true });
      const baseline = new Matrix4().copy(camera.updateMatrix(2));
      const point = new Vector3(0.5, 0.25, 0),
        projected = new Vector3(),
        jittered = new Vector3();
      baseline.transformPoint(point, projected);
      state
        .begin({}, camera, 800, 400, settings)
        .transformPoint(point, jittered);
      expect(jittered.x - projected.x).toBeCloseTo(state.jitter[0]!, 6);
      expect(jittered.y - projected.y).toBeCloseTo(state.jitter[1]!, 6);
      expect(state.jitter[1]).not.toBe(0);
      state.inverseVP.transformPoint(jittered, projected);
      expect(projected.x).toBeCloseTo(point.x, 4);
      expect(projected.y).toBeCloseTo(point.y, 4);
      expect(projected.z).toBeCloseTo(point.z, 4);
      expect(Array.from(camera.matrix.elements)).toEqual(
        Array.from(baseline.elements),
      );
    }
  });

  it('retains only completed jittered frames and supports camera motion reprojection', () => {
    const f = fixture();
    f.state.begin(f.scene, f.camera, 640, 480, f.settings);
    expect(f.state.historyValid).toBe(false);
    const first = Array.from(f.state.currentVP.elements);
    f.state.commit();
    f.camera.position.x += 0.1;
    f.state.begin(f.scene, f.camera, 640, 480, f.settings);
    expect(f.state.historyValid).toBe(true);
    expect(Array.from(f.state.previousVP.elements)).toEqual(first);
    expect(Array.from(f.state.currentVP.elements)).not.toEqual(first);
    const data = new Float32Array(60);
    writeTemporalUniforms(data, f.state, f.settings);
    expect(Array.from(data.slice(32, 48))).toEqual(first);
    expect(data[51]).toBeCloseTo(f.settings.taaHistoryWeight);
    f.state.invalidate();
    writeTemporalUniforms(data, f.state, f.settings);
    expect(data[51]).toBe(0);
  });

  it('resets on identity changes, resize, aspect, camera cuts and projection changes', () => {
    const cases = [
      (f: TemporalFixture) => {
        f.scene = {};
      },
      (f: TemporalFixture) => {
        f.camera = new PerspectiveCamera();
      },
      (f: TemporalFixture) => {
        f.camera.position.x += 3;
      },
      (f: TemporalFixture) => {
        f.camera.rotation.y = 1;
        f.camera.rotation.w = 0;
      },
      (f: TemporalFixture) => {
        f.camera.fov *= 0.9;
      },
      (f: TemporalFixture) => {
        f.camera.near *= 2;
      },
      (f: TemporalFixture) => {
        f.camera.far *= 2;
      },
    ];
    for (const change of cases) {
      const f = fixture();
      f.state.begin(f.scene, f.camera, 640, 480, f.settings);
      f.state.commit();
      change(f);
      f.state.begin(f.scene, f.camera, 640, 480, f.settings);
      expect(f.state.historyValid).toBe(false);
    }
    const f = fixture();
    f.state.begin(f.scene, f.camera, 640, 480, f.settings);
    f.state.commit();
    f.state.begin(f.scene, f.camera, 800, 480, f.settings);
    expect(f.state.historyValid).toBe(false);
    f.state.commit();
    f.state.begin(f.scene, f.camera, 800, 480, f.settings, 2);
    expect(f.state.historyValid).toBe(false);
  });

  it('disabled TAA removes jitter and cannot revive stale history on reenable', () => {
    const f = fixture();
    f.state.begin(f.scene, f.camera, 640, 480, f.settings);
    f.state.commit();
    f.settings.taa = false;
    f.state.begin(f.scene, f.camera, 640, 480, f.settings);
    expect(Array.from(f.state.jitter)).toEqual([0, 0]);
    expect(f.state.historyValid).toBe(false);
    f.state.commit();
    expect(f.state.historyValid).toBe(false);
    f.settings.taa = true;
    f.state.begin(f.scene, f.camera, 640, 480, f.settings);
    expect(f.state.historyValid).toBe(false);
    expect(() => f.state.begin(f.scene, f.camera, 0, 480, f.settings)).toThrow(
      RangeError,
    );
  });
});
