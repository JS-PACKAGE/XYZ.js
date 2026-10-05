/* global document, window, HTMLCanvasElement -- owned browser fixture */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { browserIdentity, browserLaunchOptions } from './browser-launch.mjs';
import { Buffer } from 'node:buffer';
import process from 'node:process';

const directory = '.vite/material-aa-runtime';
await mkdir(directory, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 5250, strictPort: true },
});
const launch = await browserLaunchOptions('chromium');
const report = {
  source: 'P121 working tree, package 1.16.0',
  results: [],
  errors: [],
};
let browser;
try {
  await server.listen();
  browser = await chromium.launch(launch);
  report.identity = browserIdentity('chromium', browser, launch);
  for (const profile of [
    'webgpu',
    'webgl2',
    'webgl2-no-float',
    'webgpu-no-aa',
    'webgl2-no-aa',
    'canvas2d',
  ]) {
    const page = await browser.newPage();
    page.on('pageerror', (error) =>
      report.errors.push(`${profile}: ${error.stack}`),
    );
    if (profile === 'webgl2-no-float')
      await page.addInitScript(() => {
        // Restrict the real owned context, not a substitute renderer.
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (...args) {
          const context = getContext.apply(this, args);
          if (args[0] === 'webgl2' && context) {
            const getExtension = context.getExtension.bind(context);
            context.getExtension = (name) =>
              name === 'EXT_color_buffer_float' ? null : getExtension(name);
          }
          return context;
        };
      });
    await page.exposeFunction('recordAaVisual', (name, png) =>
      writeFile(
        `${directory}/${profile}-${name}.png`,
        Buffer.from(png.split(',')[1], 'base64'),
      ),
    );
    await page.goto('http://127.0.0.1:5250/');
    const result = await page.evaluate(async (profile) => {
      // Serialized browser evaluation needs context-local module loading.
      const E = await import('/src/index.ts');
      const { frameProofs } = await import('/tests/browser/frame-proof.ts');
      const backend = profile.startsWith('webgl2')
        ? 'webgl2'
        : profile.startsWith('webgpu')
          ? 'webgpu'
          : 'canvas2d';
      const canvas = document.createElement('canvas');
      document.body.replaceChildren(canvas);
      const game = await E.Game.create({
        canvas,
        width: 128,
        height: 128,
        renderer: backend,
        antialias: !profile.endsWith('no-aa'),
      });
      const renderer = game.graphics,
        scene = new E.Scene(),
        proofs = frameProofs(renderer, canvas),
        textures = [];
      try {
        await game.setScene(scene);
        const capabilities = renderer.capabilities.alphaToCoverage;
        if (
          !capabilities ||
          capabilities.rgba8Samples < 1 ||
          capabilities.hdrSamples < 1
        )
          throw new Error('Missing coverage sample counts.');
        if (backend === 'canvas2d') {
          if (capabilities.rgba8Samples !== 1 || capabilities.hdrSamples !== 1)
            throw new Error('Canvas advertised MSAA.');
          return { profile, capabilities };
        }
        scene.camera3D = new E.OrthographicCamera();
        scene.camera3D.height = 2;
        scene.camera3D.position.set(0, 0, 2);
        scene.ambientLight = 0;
        scene.directionalLight.direction.set(0.3, 0, 1);
        scene.directionalLight.intensity = 1;
        const geometry = new E.Geometry({
          positions: [-0.8, 0.8, 0, 0.8, 0.8, 0, 0.8, -0.8, 0, -0.8, -0.8, 0],
          normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
          uvs: [0, 0, 1, 0, 1, 1, 0, 1],
          indices: [0, 2, 1, 0, 3, 2],
        });
        const texture = (size, fill) => {
          const data = new Uint8Array(size * size * 4);
          for (let y = 0; y < size; y++)
            for (let x = 0; x < size; x++) fill(data, (y * size + x) * 4, x, y);
          const value = new E.NativeTexture2D({
            format: 'rgba8unorm',
            width: size,
            height: size,
            levels: [{ width: size, height: size, data }],
          });
          textures.push(value);
          return value;
        };
        const white = texture(1, (d, i) => d.set([255, 255, 255, 255], i));
        const mask = texture(128, (d, i, x, y) =>
          d.set(
            [
              255,
              255,
              255,
              Math.round(Math.min(1, Math.max(0, (x + y) / 254)) * 255),
            ],
            i,
          ),
        );
        const normal = texture(128, (d, i, x) =>
          d.set(
            [Math.round(128 + 19 * Math.sin((x * Math.PI) / 4)), 128, 254, 255],
            i,
          ),
        );
        const flatNormal = texture(1, (d, i) => d.set([128, 128, 255, 255], i));
        const draw = async (options, position = [0, 0, 0]) => {
          const mesh = scene.add(
            new E.Mesh({
              geometry,
              material: new E.PBRMaterial({ texture: white, ...options }),
              position,
            }),
          );
          try {
            const pending = proofs.next();
            renderer.beginFrame();
            renderer.render(scene, 128, 128);
            renderer.endFrame();
            return await pending;
          } finally {
            scene.remove(mesh);
            mesh.destroy();
          }
        };
        if (profile.endsWith('no-aa')) {
          if (capabilities.rgba8Samples !== 1 || capabilities.hdrSamples !== 1)
            throw new Error('Disabled antialiasing advertised MSAA.');
          const mesh = scene.add(
            new E.Mesh({
              geometry,
              material: new E.PBRMaterial({
                texture: mask,
                alphaMode: 'MASK',
                alphaCutoff: 0.5,
                alphaToCoverage: true,
              }),
            }),
          );
          let rejection;
          try {
            renderer.beginFrame();
            renderer.render(scene, 128, 128);
          } catch (error) {
            rejection = String(error);
          } finally {
            scene.remove(mesh);
            mesh.destroy();
            // A rejected draw leaves the explicit frame open; finish with the now-empty scene.
            const recovery = proofs.next();
            renderer.render(scene, 128, 128);
            renderer.endFrame();
            await recovery;
          }
          if (!/alpha-to-coverage.*antialiasing/i.test(rejection ?? ''))
            throw new Error(`No explicit disabled-AA failure: ${rejection}`);
          return { profile, capabilities, rejection };
        }
        if (
          capabilities.rgba8Samples < 2 ||
          (profile !== 'webgl2-no-float' && capabilities.hdrSamples < 2)
        )
          throw new Error(
            'Owned native context did not expose coverage samples.',
          );
        const differences = (a, b) => {
          let sum = 0,
            changed = 0;
          for (let y = 25; y < 103; y++)
            for (let x = 25; x < 103; x++) {
              const i = (y * 128 + x) * 4,
                delta = Math.abs(a[i] - b[i]);
              sum += delta;
              if (delta > 2) changed++;
            }
          return { sum, changed };
        };
        const normalResults = [];
        for (const coat of [false, true]) {
          const sequences = [];
          for (const strength of [0, 1]) {
            const frames = [];
            for (let step = 0; step < 8; step++)
              frames.push(
                await draw(
                  {
                    metallic: coat ? 0 : 1,
                    color: coat ? [0, 0, 0] : [0.25, 0.25, 0.25],
                    roughness: coat ? 1 : 0.1,
                    normalTexture: coat ? flatNormal : normal,
                    normalSampler: { minFilter: 'linear', magFilter: 'linear' },
                    clearcoat: coat ? 1 : 0,
                    clearcoatRoughness: 0.1,
                    clearcoatNormalTexture: coat ? normal : undefined,
                    clearcoatNormalSampler: {
                      minFilter: 'linear',
                      magFilter: 'linear',
                    },
                    specularAntiAliasing: strength,
                  },
                  [step * 0.007, 0, 0],
                ),
              );
            let motion = 0,
              redSignal = 0;
            for (let step = 1; step < frames.length; step++)
              motion += differences(
                frames[step - 1].bytes,
                frames[step].bytes,
              ).sum;
            for (const frame of frames)
              for (let y = 25; y < 103; y++)
                for (let x = 25; x < 103; x++)
                  redSignal += frame.bytes[(y * 128 + x) * 4];
            // Report broadened-area RGB motion and relative contrast separately, not radiometric energy.
            sequences.push({
              frames,
              motion,
              redSignal,
              relativeMotion: motion / redSignal,
            });
          }
          for (const strength of [0, 1])
            await window.recordAaVisual(
              `${coat ? 'coat' : 'base'}-${strength}`,
              sequences[strength].frames[0].png,
            );
          const delta = differences(
            sequences[0].frames[0].bytes,
            sequences[1].frames[0].bytes,
          );
          if (
            delta.changed < 100 ||
            sequences[1].relativeMotion >= sequences[0].relativeMotion
          )
            throw new Error(
              `Specular AA did not reduce ${coat ? 'coat' : 'base'} relative temporal contrast: ${JSON.stringify({ delta, motion: sequences.map((s) => s.motion), relativeMotion: sequences.map((s) => s.relativeMotion) })}`,
            );
          normalResults.push({
            coat,
            delta,
            motion: sequences.map((s) => s.motion),
            redSignal: sequences.map((s) => s.redSignal),
            relativeMotion: sequences.map((s) => s.relativeMotion),
          });
        }
        const flat = [];
        for (const strength of [0, 1])
          flat.push(
            await draw({
              metallic: 0.5,
              roughness: 0.35,
              normalTexture: flatNormal,
              specularAntiAliasing: strength,
            }),
          );
        const flatDelta = differences(flat[0].bytes, flat[1].bytes);
        if (flatDelta.changed !== 0)
          throw new Error(`Flat normals changed: ${JSON.stringify(flatDelta)}`);
        scene.ambientLight = 1;
        scene.directionalLight.intensity = 0;
        const coverageResults = [];
        for (const hdr of [false, true]) {
          scene.postProcessing.enabled = hdr;
          scene.postProcessing.toneMapping = 'aces';
          if (hdr && profile === 'webgl2-no-float') {
            let rejection;
            const mesh = scene.add(
              new E.Mesh({
                geometry,
                material: new E.PBRMaterial({
                  texture: mask,
                  alphaMode: 'MASK',
                  alphaCutoff: 0.5,
                  alphaToCoverage: true,
                }),
              }),
            );
            try {
              renderer.beginFrame();
              renderer.render(scene, 128, 128);
            } catch (error) {
              rejection = String(error);
            } finally {
              scene.remove(mesh);
              mesh.destroy();
              const recovery = proofs.next();
              renderer.render(scene, 128, 128);
              renderer.endFrame();
              await recovery;
            }
            if (!/EXT_color_buffer_float/.test(rejection ?? ''))
              throw new Error('HDR silently fell back without its extension.');
            coverageResults.push({ hdr, rejection });
            continue;
          }
          const frames = [];
          for (const alphaToCoverage of [false, true])
            frames.push(
              await draw({
                texture: mask,
                alphaMode: 'MASK',
                alphaCutoff: 0.5,
                alphaToCoverage,
                roughness: 1,
              }),
            );
          const levels = frames.map((frame) => {
            const values = new Set();
            for (let y = 25; y < 103; y++)
              for (let x = 25; x < 103; x++)
                values.add(frame.bytes[(y * 128 + x) * 4]);
            return [...values].sort((a, b) => a - b);
          });
          const delta = differences(frames[0].bytes, frames[1].bytes);
          if (levels[1].length < levels[0].length + 2 || delta.changed < 64)
            throw new Error(
              `Coverage did not resolve the diagonal sample masks: ${JSON.stringify({ hdr, levels, delta })}`,
            );
          coverageResults.push({ hdr, levels, delta });
          for (const enabled of [0, 1])
            await window.recordAaVisual(
              `coverage-${hdr ? 'hdr' : 'sdr'}-${enabled}`,
              frames[enabled].png,
            );
        }
        let mixed;
        if (profile !== 'webgl2-no-float') {
          scene.postProcessing.enabled = true;
          scene.transparency = 'weighted';
          scene.shadows.enabled = true;
          scene.shadows.mapSize = 64;
          scene.ambientLight = 0.25;
          scene.directionalLight.intensity = 1;
          const floor = scene.add(
            new E.Mesh({
              geometry,
              material: new E.PBRMaterial({
                texture: white,
                color: [0.2, 0.3, 0.4],
                roughness: 1,
              }),
              position: [0, 0, -0.25],
            }),
          );
          const overlay = scene.add(
            new E.Mesh({
              geometry,
              material: new E.PBRMaterial({
                texture: white,
                color: [1, 0.1, 0.1],
                roughness: 1,
                alphaMode: 'BLEND',
                opacity: 0.4,
              }),
              position: [0.6, 0, 0.1],
              scale: [0.4, 0.4, 1],
            }),
          );
          const sprite = scene.add(
            new E.Sprite({
              texture: white,
              position: [15, 15],
              scale: [12, 12],
              space: 'screen',
            }),
          );
          try {
            const frames = [];
            for (const alphaToCoverage of [false, true])
              frames.push(
                await draw({
                  texture: mask,
                  alphaMode: 'MASK',
                  alphaCutoff: 0.5,
                  alphaToCoverage,
                  roughness: 1,
                }),
              );
            const delta = differences(frames[0].bytes, frames[1].bytes);
            if (delta.changed < 32 || frames[1].stats.shadowDrawCalls < 2)
              throw new Error(
                `Coverage/shadow/weighted composition was not exercised: ${JSON.stringify({ delta, stats: frames[1].stats })}`,
              );
            for (let i = 3; i < frames[1].bytes.length; i += 4)
              if (frames[1].bytes[i] !== 255)
                throw new Error(
                  'Coverage was attenuated again through HDR/OIT output alpha.',
                );
            const spritePixel = (15 * 128 + 15) * 4;
            if (
              frames[1].stats.drawCalls2D < 1 ||
              frames[1].bytes[spritePixel] < 250 ||
              frames[1].bytes[spritePixel + 1] < 250
            )
              throw new Error(
                'The ordinary 2D overlay inherited coverage/color-mask state.',
              );
            await window.recordAaVisual(
              'coverage-weighted-shadow',
              frames[1].png,
            );
            mixed = {
              delta,
              shadowDrawCalls: frames[1].stats.shadowDrawCalls,
              overlayDrawCalls: frames[1].stats.drawCalls2D,
            };
            const borrowed = E.EnvironmentMap.gradient({
              width: 32,
              zenith: [0, 0, 0],
              horizon: [0, 0, 0],
              ground: [0, 0, 0],
            });
            const probe = new E.ReflectionProbe({
              environment: borrowed,
              position: [0, 0, 0.5],
              min: [-2, -2, -2],
              max: [2, 2, 2],
            });
            const captures = [];
            scene.reflectionProbes.push(probe);
            try {
              for (const alphaToCoverage of [false, true]) {
                const mesh = scene.add(
                  new E.Mesh({
                    geometry,
                    material: new E.PBRMaterial({
                      texture: mask,
                      alphaMode: 'MASK',
                      alphaCutoff: 0.5,
                      alphaToCoverage,
                      roughness: 1,
                    }),
                  }),
                );
                try {
                  captures.push(
                    await renderer.captureReflectionProbe(scene, probe, {
                      size: 32,
                    }),
                  );
                } finally {
                  scene.remove(mesh);
                  mesh.destroy();
                }
              }
              let changedChannels = 0;
              for (let i = 0; i < captures[0].levels[0].length; i++) {
                const a = captures[0].levels[0][i],
                  b = captures[1].levels[0][i];
                if ((a & 0x7c00) === 0x7c00 || (b & 0x7c00) === 0x7c00)
                  throw new Error(
                    'Probe coverage produced non-finite half-float radiance.',
                  );
                if (i % 4 !== 3 && a !== b) changedChannels++;
              }
              if (changedChannels < 16)
                throw new Error(
                  `Probe capture ignored material coverage: ${changedChannels}`,
                );
              mixed.probeChangedChannels = changedChannels;
            } finally {
              scene.reflectionProbes.splice(
                scene.reflectionProbes.indexOf(probe),
                1,
              );
              probe.destroy();
              borrowed.destroy();
              for (const map of captures) map.destroy();
            }
          } finally {
            scene.remove(floor);
            scene.remove(overlay);
            scene.remove(sprite);
            floor.destroy();
            overlay.destroy();
            sprite.destroy();
          }
        }
        scene.postProcessing.enabled = false;
        await draw({ roughness: 1 });
        if (proofs.graphicsEvents.length)
          throw new Error(proofs.graphicsEvents.join('\n'));
        return {
          profile,
          capabilities,
          normalResults,
          flatDelta,
          coverageResults,
          mixed,
        };
      } finally {
        game.destroy();
        scene.destroy();
        for (const texture of textures) texture.destroy();
      }
    }, profile);
    report.results.push(result);
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
}
if (report.errors.length) throw new Error(report.errors.join('\n'));
process.stdout.write(`${JSON.stringify(report.results)}\n`);
