/* global document, window, requestAnimationFrame, HTMLCanvasElement -- browser fixture */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { browserIdentity, browserLaunchOptions } from './browser-launch.mjs';

const directory = '.vite/filtering-runtime';
await mkdir(directory, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 5249, strictPort: true },
});
const launch = await browserLaunchOptions('chromium');
let browser;
const report = {
  source: 'P120 working tree, package 1.16.0',
  results: [],
  errors: [],
};
try {
  await server.listen();
  browser = await chromium.launch(launch);
  report.identity = browserIdentity('chromium', browser, launch);
  for (const profile of [
    'webgpu',
    'webgl2',
    'webgl2-no-anisotropy',
    'canvas2d',
  ]) {
    const page = await browser.newPage();
    page.on('pageerror', (error) =>
      report.errors.push(`${profile}: ${error.stack}`),
    );
    if (profile === 'webgl2-no-anisotropy')
      await page.addInitScript(() => {
        // Restrict a real owned WebGL2 context to exercise extension absence.
        const getContext = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (...args) {
          const context = getContext.apply(this, args);
          if (args[0] === 'webgl2' && context) {
            const getExtension = context.getExtension.bind(context);
            context.getExtension = (name) =>
              name === 'EXT_texture_filter_anisotropic'
                ? null
                : getExtension(name);
          }
          return context;
        };
      });
    await page.exposeFunction('captureFilteringVisual', (name) =>
      page
        .locator('canvas')
        .screenshot({ path: `${directory}/${profile}-${name}.png` }),
    );
    await page.goto('http://127.0.0.1:5249/');
    report.results.push(
      await page.evaluate(async (profile) => {
        // Serialized page.evaluate cannot carry author-time static imports into its context.
        const E = await import('/src/index.ts');
        const { frameProofs } = await import('/tests/browser/frame-proof.ts');
        const backend = profile === 'webgl2-no-anisotropy' ? 'webgl2' : profile;
        const canvas = document.createElement('canvas');
        document.body.replaceChildren(canvas);
        const game = await E.Game.create({
          canvas,
          width: 128,
          height: 128,
          renderer: backend,
        });
        const renderer = game.graphics;
        const proofs = frameProofs(renderer, canvas);
        const scene = new E.Scene();
        const ownedTextures = [],
          ownedMaterials = [];
        try {
          await game.setScene(scene);
          const capabilities = renderer.capabilities.textureAnisotropy;
          if (
            capabilities?.maxRequest !== 16 ||
            (backend === 'webgpu'
              ? capabilities.maxEffective !== null
              : capabilities.maxEffective < 1)
          )
            throw new Error(
              `Invalid filtering capability: ${JSON.stringify(capabilities)}`,
            );
          if (
            (profile === 'webgl2-no-anisotropy' || backend === 'canvas2d') &&
            capabilities.maxEffective !== 1
          )
            throw new Error('Unavailable anisotropy was not reported as one.');
          const striped = (axis, masked = false) => {
            const levels = [];
            let size = 256;
            let data = new Uint8Array(size * size * 4);
            for (let y = 0; y < size; y++)
              for (let x = 0; x < size; x++) {
                const value = ((axis === 'u' ? x : y) >> 3) & 1 ? 255 : 0;
                const offset = (y * size + x) * 4;
                data[offset] = data[offset + 1] = data[offset + 2] = value;
                data[offset + 3] = masked ? value : 255;
              }
            while (true) {
              levels.push({ width: size, height: size, data });
              if (size === 1) break;
              const nextSize = size / 2,
                next = new Uint8Array(nextSize * nextSize * 4);
              for (let y = 0; y < nextSize; y++)
                for (let x = 0; x < nextSize; x++)
                  for (let c = 0; c < 4; c++) {
                    const first = (y * 2 * size + x * 2) * 4 + c;
                    next[(y * nextSize + x) * 4 + c] = Math.round(
                      (data[first] +
                        data[first + 4] +
                        data[first + size * 4] +
                        data[first + size * 4 + 4]) /
                        4,
                    );
                  }
              data = next;
              size = nextSize;
            }
            const texture = new E.NativeTexture2D({
              format: 'rgba8unorm',
              width: 256,
              height: 256,
              levels,
            });
            ownedTextures.push(texture);
            return texture;
          };
          const texture = striped('u'),
            optical = striped('v'),
            mask = striped('u', true);
          const white = new E.NativeTexture2D({
            format: 'rgba8unorm',
            width: 1,
            height: 1,
            levels: [
              {
                width: 1,
                height: 1,
                data: new Uint8Array([255, 255, 255, 255]),
              },
            ],
          });
          ownedTextures.push(white);
          const capture = async () => {
            const pending = proofs.next();
            renderer.beginFrame();
            renderer.render(scene, 128, 128);
            renderer.endFrame();
            return pending;
          };
          const difference = (a, b) => {
            let sum = 0,
              changed = 0;
            for (let i = 0; i < a.length; i += 4) {
              const delta = Math.abs(a[i] - b[i]);
              sum += delta;
              if (delta > 2) changed++;
            }
            return { sum, changed };
          };
          const variance = (bytes, y) => {
            let sum = 0,
              squared = 0;
            for (let x = 20; x < 108; x++) {
              const value = bytes[(y * 128 + x) * 4];
              sum += value;
              squared += value * value;
            }
            return squared / 88 - (sum / 88) ** 2;
          };
          const cpuTexture = async (width, height, bytes) => {
            const image = document.createElement('canvas');
            image.width = width;
            image.height = height;
            const context = image.getContext('2d'),
              data = context.createImageData(width, height);
            data.data.set(bytes);
            context.putImageData(data, 0, 0);
            const texture = await E.Texture.fromImage(image);
            ownedTextures.push(texture);
            return texture;
          };
          const results = [];
          if (backend !== 'canvas2d') {
            scene.camera3D = new E.OrthographicCamera();
            scene.camera3D.height = 2;
            scene.camera3D.position.set(0, 0, 2);
            scene.ambientLight = 1;
            scene.directionalLight.direction.set(0, 0, 1);
            scene.directionalLight.intensity = 1;
            scene.shadows.enabled = true;
            scene.shadows.mapSize = 128;
            const geometry = new E.Geometry({
              positions: [
                -0.8, 0.8, 0, 0.8, 0.8, 0, 0.8, -0.8, 0, -0.8, -0.8, 0,
              ],
              normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
              uvs: [0, 0, 1, 0, 1, 1, 0, 1],
              indices: [0, 2, 1, 0, 3, 2],
            });
            const hooks = {
              wgsl: 'fn xyzDeform(p:vec3f,n:vec3f,uv:vec2f)->XYZVertex { return XYZVertex(p,n); } fn xyzSurface(p:vec3f,n:vec3f,uv:vec2f,c:vec4f)->vec4f { return c; }',
              glsl: 'XYZVertex xyzDeform(vec3 p,vec3 n,vec2 uv) { return XYZVertex(p,n); } vec4 xyzSurface(vec3 p,vec3 n,vec2 uv,vec4 c) { return c; }',
            };
            for (const kind of [
              'pbr',
              'texture',
              'native',
              'mask',
              'blend',
              'optical',
            ]) {
              const frames = [];
              for (const maxAnisotropy of [1, 16]) {
                const sampler = {
                  maxAnisotropy,
                  addressModeU: 'repeat',
                  addressModeV: 'repeat',
                };
                const options = {
                  texture:
                    kind === 'mask'
                      ? mask
                      : kind === 'optical'
                        ? white
                        : texture,
                  textureSampler: sampler,
                  metallic: 0,
                  roughness: 1,
                  alphaMode:
                    kind === 'mask'
                      ? 'MASK'
                      : kind === 'blend'
                        ? 'BLEND'
                        : 'OPAQUE',
                  opacity: kind === 'blend' ? 0.7 : 1,
                };
                if (kind === 'optical')
                  Object.assign(options, {
                    transmission: 1,
                    transmissionTexture: optical,
                    transmissionSampler: sampler,
                  });
                const material =
                  kind === 'texture'
                    ? new E.TextureMaterial(options)
                    : kind === 'native'
                      ? new E.NativeMaterial3D({ ...options, ...hooks })
                      : new E.PBRMaterial(options);
                if (kind === 'native') {
                  ownedMaterials.push(material);
                  await renderer.prepareMaterial(material);
                }
                const mesh = scene.add(
                  new E.Mesh({
                    geometry,
                    material,
                    rotation: [(84 * Math.PI) / 180, 0, 0],
                  }),
                );
                frames.push(await capture());
                if (kind === 'pbr') {
                  game.start();
                  await new Promise((resolve) =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve)),
                  );
                  await window.captureFilteringVisual(
                    `${kind}-${maxAnisotropy}`,
                  );
                  game.pause();
                }
                scene.remove(mesh);
                mesh.destroy();
              }
              const delta = difference(frames[0].bytes, frames[1].bytes);
              if (profile === 'webgl2-no-anisotropy' && delta.changed !== 0)
                throw new Error(
                  `${kind} did not clamp to unavailable native filtering.`,
                );
              if (profile !== 'webgl2-no-anisotropy' && delta.changed < 8)
                throw new Error(
                  `${kind} filtering did not change actual oblique pixels: ${JSON.stringify(delta)}`,
                );
              if (kind === 'mask' && frames[1].stats.shadowDrawCalls < 1)
                throw new Error('Masked shadow path was not exercised.');
              results.push({
                kind,
                ...delta,
                variance1: variance(frames[0].bytes, 64),
                variance16: variance(frames[1].bytes, 64),
                shadowDrawCalls: frames[1].stats.shadowDrawCalls,
              });
            }
            scene.shadows.enabled = false;
          }
          // The same native source must not let a previous anisotropic draw contaminate
          // adjacent ordinary filtering or let a batch merge the two requests.
          const spriteTexture =
            backend === 'canvas2d'
              ? await cpuTexture(256, 256, texture.levels[0].data)
              : texture;
          const first = scene.add(
            new E.Sprite({
              texture: spriteTexture,
              position: [64, 40],
              scale: [0.4, 0.025],
              space: 'screen',
              sampler: { maxAnisotropy: 1 },
            }),
          );
          const second = scene.add(
            new E.Sprite({
              texture: spriteTexture,
              position: [64, 85],
              scale: [0.4, 0.025],
              space: 'screen',
              sampler: { maxAnisotropy: 16 },
            }),
          );
          const spriteFrame = await capture();
          second.sampler = { maxAnisotropy: 1 };
          const joined = await capture();
          const expectedSplit =
            backend === 'webgpu' || capabilities.maxEffective > 1 ? 1 : 0;
          if (
            backend !== 'canvas2d' &&
            spriteFrame.stats.drawCalls2D - joined.stats.drawCalls2D !==
              expectedSplit
          )
            throw new Error(
              `Incorrect sampler batch split: ${spriteFrame.stats.drawCalls2D}/${joined.stats.drawCalls2D}`,
            );
          second.sampler = { maxAnisotropy: 16 };
          if (backend === 'webgpu') {
            const ordinary = variance(spriteFrame.bytes, 40),
              anisotropic = variance(spriteFrame.bytes, 85);
            if (anisotropic < ordinary * 0.7)
              throw new Error(
                `Anisotropic Sprite lost short-axis detail: ${ordinary}/${anisotropic}`,
              );
          }
          const before = second.sampler;
          let rejected = false;
          try {
            second.sampler = { maxAnisotropy: 8, minFilter: 'nearest' };
          } catch (error) {
            rejected = error instanceof RangeError;
          }
          if (!rejected || second.sampler !== before)
            throw new Error(
              'Rejected Sprite sampling changed its active state.',
            );
          game.start();
          await new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          );
          await window.captureFilteringVisual('sprites');
          game.pause();
          const spriteVariances = [
            variance(spriteFrame.bytes, 40),
            variance(spriteFrame.bytes, 85),
          ];
          if (backend !== 'canvas2d') {
            const normal = await cpuTexture(
              256,
              256,
              optical.levels[0].data.map((value, index) =>
                index % 4 === 0 ? 128 : index % 4 === 1 ? value : 255,
              ),
            );
            const normalAlbedo = await cpuTexture(
              256,
              256,
              new Uint8Array(256 * 256 * 4).fill(255),
            );
            first.destroy();
            second.destroy();
            const light = new E.Lighting2D({
              ambient: [0, 0, 0],
              lights: [
                new E.Light2D({
                  position: [64, 20],
                  height: 100,
                  radius: 300,
                  intensity: 2,
                  space: 'screen',
                }),
              ],
            });
            const frames = [];
            for (const maxAnisotropy of [1, 16]) {
              const sprite = scene.add(
                new E.Sprite({
                  texture: normalAlbedo,
                  normalTexture: normal,
                  lighting: light,
                  position: [64, 64],
                  scale: [102 / 256, 6 / 256],
                  space: 'screen',
                  sampler: { maxAnisotropy },
                }),
              );
              frames.push(await capture());
              sprite.destroy();
            }
            const delta = difference(frames[0].bytes, frames[1].bytes);
            if (profile === 'webgl2-no-anisotropy' && delta.changed !== 0)
              throw new Error('Normal Sprite filtering did not clamp.');
            if (profile !== 'webgl2-no-anisotropy' && delta.changed < 8)
              throw new Error(
                `Normal Sprite filtering had no visible effect: ${JSON.stringify(delta)}`,
              );
            results.push({ kind: 'normal-sprite', ...delta });
          }
          if (proofs.graphicsEvents.length)
            throw new Error(proofs.graphicsEvents.join('\n'));
          return {
            profile,
            capabilities,
            materials: results,
            spriteDrawCalls: spriteFrame.stats.drawCalls2D,
            joinedSpriteDrawCalls: joined.stats.drawCalls2D,
            spriteVariances,
          };
        } finally {
          game.destroy();
          for (const material of ownedMaterials) material.destroy();
          scene.destroy();
          for (const texture of ownedTextures) texture.destroy();
        }
      }, profile),
    );
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
}
if (report.errors.length) throw new Error(report.errors.join('\n'));
process.stdout.write(`${JSON.stringify(report.results)}\n`);
