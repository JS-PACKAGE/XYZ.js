import {
  createRenderer,
  Scene,
  Mesh,
  Geometry,
  Texture,
  TextureMaterial,
  PBRMaterial,
  EnvironmentMap,
  ReflectionProbe,
  Text3D,
  Vector3,
} from 'xyz.js';
import { frameProofs, errorDetail, type FrameProof } from './frame-proof.js';

interface ScenarioResult {
  name: string;
  passed: boolean;
  [key: string]: unknown;
}
interface NativeTemporalOwner {
  temporal: { data: Float32Array };
  temporalState: { historyValid: boolean };
}
interface NativeInspection extends NativeTemporalOwner {
  current?: NativeInspection;
  meshPipeline?: NativeTemporalOwner;
}

export async function runAdvancedExpansion(backend: 'webgpu' | 'webgl2') {
  const canvas = document.createElement('canvas');
  document.body.append(canvas);
  const report: {
    backend: string;
    consumer: string;
    scenarios: ScenarioResult[];
    graphicsEvents: string[];
    passed?: boolean;
    runtimeError?: string;
  } = {
    backend,
    consumer: 'xyz.js root distribution',
    scenarios: [],
    graphicsEvents: [],
  };
  let runtimeError: unknown;
  const renderer = await createRenderer(
    canvas,
    backend,
    (error: unknown) => {
      runtimeError = error;
    },
    { antialias: false },
  );
  if (renderer.backend !== backend)
    throw new Error(`Expected ${backend}, got ${renderer.backend}`);
  renderer.resize(256, 256);
  const proofs = frameProofs(renderer, canvas);
  const owned: { destroy(): void }[] = [];
  const check = (ok: unknown, message: string) => {
    if (!ok) throw new Error(message);
  };
  const draw = async (scene: Scene) => {
    await new Promise<number>((resolve) => requestAnimationFrame(resolve));
    if (runtimeError) throw runtimeError;
    renderer.beginFrame();
    renderer.render(scene, canvas.width, canvas.height);
    const pending = proofs.next();
    renderer.endFrame();
    return pending;
  };
  const difference = (a: FrameProof, b: FrameProof) => {
    let sum = 0,
      changed = 0;
    for (let i = 0; i < a.bytes.length; i += 4) {
      let delta = 0;
      for (let c = 0; c < 3; c++)
        delta += Math.abs(a.bytes[i + c] - b.bytes[i + c]);
      sum += delta;
      if (delta > 3) changed++;
    }
    return { mean: sum / (a.width * a.height * 3), changed };
  };
  const scenario = async (
    name: string,
    run: () => Promise<Record<string, unknown>>,
  ) => {
    try {
      report.scenarios.push({ name, passed: true, ...(await run()) });
    } catch (error) {
      report.scenarios.push({ name, passed: false, error: errorDetail(error) });
    }
  };
  const whiteCanvas = document.createElement('canvas');
  whiteCanvas.width = whiteCanvas.height = 4;
  const ctx = whiteCanvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, 4, 4);
  const white = await Texture.fromImage(whiteCanvas);
  owned.push(white);
  const scene = () => {
    const s = new Scene();
    owned.push(s);
    s.ambientLight = 1;
    s.directionalLight.intensity = 0;
    s.camera3D.position.set(0, 0, 7);
    s.camera3D.lookAt(new Vector3());
    return s;
  };
  const flat = (color: [number, number, number]) =>
    new TextureMaterial({ texture: white, color });
  const environment = (color: [number, number, number]) => {
    const map = EnvironmentMap.gradient({
      width: 32,
      zenith: color,
      horizon: color,
      ground: color,
    });
    owned.push(map);
    return map;
  };
  try {
    await scenario('taa-native-pixels-and-history-resets', async () => {
      const s = scene();
      const mesh = s.add(
        new Mesh({
          geometry: Geometry.cube(2),
          material: flat([1, 0.2, 0.1]),
          rotation: [0.2, 0.4, 0.3],
        }),
      );
      Object.assign(s.postProcessing, {
        enabled: true,
        taa: true,
        toneMapping: 'none',
        taaCameraCutDistance: 1,
      });
      const a = await draw(s);
      const b = await draw(s);
      // Fixture-only inspection of the actual renderer-owned native pipeline.
      const inspection = renderer as unknown as NativeInspection;
      const native = inspection.current ?? inspection;
      const owner = native.meshPipeline ?? native;
      const temporal = owner.temporal;
      check(
        temporal && owner.temporalState,
        'Missing real native temporal pipeline',
      );
      const historyWeight = () => temporal.data[51];
      check(
        historyWeight() > 0,
        `Second frame did not consume history: ${historyWeight()}`,
      );
      const jitterDelta = difference(a, b);
      check(
        jitterDelta.changed > 0,
        `TAA had no native pixel changes: ${JSON.stringify(jitterDelta)}`,
      );
      const resets: { name: string; weight: number; frame: number }[] = [];
      const reset = async (name: string, change: () => void) => {
        change();
        const proof = await draw(s);
        const weight = historyWeight();
        check(weight === 0, `${name} retained history weight ${weight}`);
        resets.push({ name, weight, frame: proof.stats.frame });
        await draw(s);
        check(historyWeight() > 0, `${name} did not restart accumulation`);
      };
      await reset('camera-cut', () => {
        s.camera3D.position.x += 2;
      });
      await reset('projection', () => {
        const camera = s.camera3D;
        if (!('fov' in camera))
          throw new Error('Expected a perspective camera');
        camera.fov *= 0.9;
      });
      await reset('resize', () => renderer.resize(240, 240));
      s.postProcessing.taa = false;
      await draw(s);
      check(!owner.temporalState.historyValid, 'Disabled TAA retained history');
      s.postProcessing.taa = true;
      const enabled = await draw(s);
      check(historyWeight() === 0, 'Reenabled TAA used stale history');
      mesh.position.x += 0.1;
      const moving = await draw(s);
      return {
        jitterDelta,
        resets,
        motionDelta: difference(enabled, moving),
        png: moving.png,
      };
    });
    renderer.resize(256, 256);
    await scenario('ssr-native-pixels', async () => {
      const s = scene();
      s.camera3D.position.set(0, 4, 7);
      s.camera3D.lookAt(new Vector3(0, 0, 0));
      s.add(
        new Mesh({
          geometry: Geometry.cube(2),
          material: flat([1, 0.05, 0.02]),
          position: [0, 1, 0],
        }),
      );
      // SSR intentionally samples only opaque geometry, before deferred BLEND/transmission.
      s.add(
        new Mesh({
          geometry: Geometry.cube(1),
          material: new PBRMaterial({
            texture: white,
            metallic: 1,
            roughness: 0.05,
            alphaMode: 'OPAQUE',
          }),
          position: [0, -0.2, 0],
          scale: [8, 0.2, 8],
        }),
      );
      Object.assign(s.postProcessing, {
        enabled: true,
        toneMapping: 'none',
        ssr: false,
        ssrSteps: 128,
        ssrThickness: 0.05,
        ssrMaxDistance: 10,
        ssrStrength: 1,
        ssrRoughness: 0,
      });
      const off = await draw(s);
      s.postProcessing.ssr = true;
      const on = await draw(s);
      const delta = difference(off, on);
      check(
        delta.changed > 20 && delta.mean > 0.02,
        `SSR did not alter actual native pixels: ${JSON.stringify(delta)}`,
      );
      s.postProcessing.ssrStrength = 0;
      const zero = await draw(s);
      const zeroDelta = difference(off, zero);
      check(
        zeroDelta.changed === 0 && zeroDelta.mean === 0,
        `Zero SSR strength changed output: ${JSON.stringify(zeroDelta)}`,
      );
      s.postProcessing.ssrStrength = 1;
      s.postProcessing.ssrRoughness = 1;
      const rough = await draw(s);
      const roughDelta = difference(off, rough);
      check(
        roughDelta.changed === 0,
        `Roughness one retained SSR: ${JSON.stringify(roughDelta)}`,
      );
      return { delta, zeroDelta, roughDelta, png: on.png };
    });
    await scenario('six-face-capture-exclusion-abort', async () => {
      const s = scene();
      const map = environment([0, 0, 0]);
      const probe = new ReflectionProbe({
        environment: map,
        position: [0, 0, 0],
        min: [-5, -5, -5],
        max: [5, 5, 5],
      });
      s.reflectionProbes.push(probe);
      const positions: [number, number, number][] = [
        [3, 0, 0],
        [-3, 0, 0],
        [0, 3, 0],
        [0, -3, 0],
        [0, 0, 3],
        [0, 0, -3],
      ];
      const colors: [number, number, number][] = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 1],
      ];
      const meshes = positions.map((position, i) =>
        s.add(
          new Mesh({
            geometry: Geometry.cube(2.5),
            material: flat(colors[i]),
            position,
          }),
        ),
      );
      const camera = s.camera3D;
      const capture = async (options = {}) => {
        const result = await renderer.captureReflectionProbe!(s, probe, {
          size: 32,
          ...options,
        });
        owned.push(result);
        return result;
      };
      const first = await capture();
      const sample = (map: EnvironmentMap, p: number[]) => {
        const u = Math.atan2(p[0], -p[2]) / (2 * Math.PI) + 0.5;
        const v = Math.acos(p[1] / Math.hypot(...p)) / Math.PI;
        const x = Math.min(map.width - 1, Math.floor(u * map.width)),
          y = Math.min(map.height - 1, Math.floor(v * map.height));
        return Array.from(
          map.levels[0].slice(
            (y * map.width + x) * 4,
            (y * map.width + x) * 4 + 3,
          ),
        );
      };
      const faces = positions.map((p) => sample(first, p));
      check(
        new Set(faces.map((x) => x.join(','))).size === 6,
        `Six face readbacks not distinct: ${JSON.stringify(faces)}`,
      );
      meshes[0].material.color.splice(0, 3, 0.2, 0.4, 1);
      const updated = await capture();
      const changedFace = sample(updated, positions[0]);
      check(
        changedFace.join() !== faces[0].join(),
        'Scene edit did not change captured +X data',
      );
      const excluded = await capture({
        exclude: [meshes[0]],
        includeBackground: false,
      });
      const excludedFace = sample(excluded, positions[0]);
      check(
        excludedFace.every((x) => x === 0),
        `Exclusion left captured +X pixels: ${excludedFace}`,
      );
      const controller = new AbortController();
      controller.abort();
      let aborted = false;
      try {
        await capture({ signal: controller.signal });
      } catch {
        aborted = true;
      }
      check(
        aborted && s.camera3D === camera && meshes[0].visible && probe.enabled,
        'Aborted capture failed to reject or restore scene',
      );
      const proof = await draw(s);
      return { faces, changedFace, excludedFace, aborted, png: proof.png };
    });
    await scenario('spatial-probe-blending-same-mesh', async () => {
      const s = scene();
      s.ambientLight = 0;
      s.environment = environment([0, 0, 0]);
      const red = environment([1, 0, 0]),
        blue = environment([0, 0, 1]);
      s.reflectionProbes.push(
        new ReflectionProbe({
          environment: red,
          position: [-1.5, 0, 0],
          min: [-4, -3, -3],
          max: [0.8, 3, 3],
          blendDistance: 1,
        }),
        new ReflectionProbe({
          environment: blue,
          position: [1.5, 0, 0],
          min: [-0.8, -3, -3],
          max: [4, 3, 3],
          blendDistance: 1,
        }),
      );
      s.add(
        new Mesh({
          geometry: Geometry.quad(5, 2),
          material: new PBRMaterial({
            texture: white,
            metallic: 1,
            roughness: 0.2,
          }),
        }),
      );
      const proof = await draw(s);
      const pixel = (x: number) =>
        Array.from(
          proof.bytes.slice((128 * 256 + x) * 4, (128 * 256 + x) * 4 + 3),
        );
      const left = pixel(75),
        middle = pixel(128),
        right = pixel(180);
      check(
        left[0] > left[2] + 20 &&
          right[2] > right[0] + 20 &&
          middle[0] > 10 &&
          middle[2] > 10,
        `No spatial blend across single mesh: ${JSON.stringify({ left, middle, right })}`,
      );
      return { left, middle, right, meshCount: 1, png: proof.png };
    });
    await scenario('text3d-native-multiline-latest-wins', async () => {
      const s = scene();
      const label = await Text3D.create('Old', {
        fontSize: 64,
        height: 1,
        color: '#ff0000',
      });
      s.add(label);
      const before = await draw(s);
      const old = label.material.texture;
      await Promise.all([
        label.setText('Stale\nrequest'),
        label.setText('Latest\nMultiline'),
        label.setStyle({ color: '#00ff00', align: 'center', height: 1.5 }),
      ]);
      check(
        label.text === 'Latest\nMultiline' &&
          label.layout.lines.length === 2 &&
          label.style.color === '#00ff00' &&
          old.destroyed,
        'Latest text/style did not publish together',
      );
      const after = await draw(s);
      const delta = difference(before, after);
      let green = 0;
      for (let i = 0; i < after.bytes.length; i += 4)
        if (after.bytes[i + 1] > 40 && after.bytes[i + 1] > after.bytes[i] * 2)
          green++;
      check(
        delta.changed > 100 && green > 100,
        `Updated native text missing green pixels: ${JSON.stringify({ delta, green })}`,
      );
      return {
        text: label.text,
        lines: label.layout.lines.map((line) => line.text),
        green,
        delta,
        png: after.png,
      };
    });
    report.graphicsEvents = [...proofs.graphicsEvents];
    report.passed =
      report.scenarios.every((x) => x.passed) &&
      !runtimeError &&
      report.graphicsEvents.length === 0;
    if (runtimeError) report.runtimeError = errorDetail(runtimeError);
    return report;
  } finally {
    renderer.destroy();
    for (const item of owned.reverse()) item.destroy();
    canvas.remove();
  }
}
