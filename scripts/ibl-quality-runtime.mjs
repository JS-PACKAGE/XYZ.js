/* global document, setTimeout, clearTimeout -- owned native HDR fixture */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { browserIdentity, browserLaunchOptions } from './browser-launch.mjs';

const built = process.argv.includes('--built');
const directory = `.vite/ibl-quality-runtime/${built ? 'built' : 'source'}`;
await mkdir(directory, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 5251, strictPort: true },
});
const launch = await browserLaunchOptions('chromium');
const report = {
  source: `P122 ${built ? 'built' : 'source'}, package 1.16.0`,
  results: [],
  errors: [],
  failures: [],
};
let browser;
try {
  await server.listen();
  browser = await chromium.launch(launch);
  report.identity = browserIdentity('chromium', browser, launch);
  for (const backend of ['webgpu', 'webgl2']) {
    const page = await browser.newPage();
    page.on('pageerror', (error) =>
      report.errors.push(`${backend}: ${error.stack}`),
    );
    await page.goto('http://127.0.0.1:5251/');
    const result = await page.evaluate(
      async ({ backend, built }) => {
        const E = await import(
          /* @vite-ignore */ built ? '/dist/src/index.js' : '/src/index.ts'
        );
        const { frameProofs } = await import('/tests/browser/frame-proof.ts');
        const canvas = document.createElement('canvas');
        document.body.replaceChildren(canvas);
        const game = await E.Game.create({
          canvas,
          width: 128,
          height: 128,
          renderer: backend,
        });
        const scene = new E.Scene(),
          proofs = frameProofs(game.graphics, canvas);
        const environments = [
          [1, 1, 1],
          [3, 1, 0.2],
        ].map((color) =>
          E.EnvironmentMap.gradient({
            width: 64,
            zenith: color,
            horizon: color,
            ground: color,
          }),
        );
        const borrowed = E.EnvironmentMap.gradient({
          width: 16,
          zenith: [0, 0, 0],
          horizon: [0, 0, 0],
          ground: [0, 0, 0],
        });
        const probe = new E.ReflectionProbe({
          environment: borrowed,
          position: [0, 0, 2],
          min: [-3, -3, -3],
          max: [3, 3, 3],
        });
        const texture = new E.NativeTexture2D({
          format: 'rgba8unorm',
          width: 1,
          height: 1,
          levels: [
            { width: 1, height: 1, data: new Uint8Array([255, 255, 255, 255]) },
          ],
        });
        const half = (value) => {
          const exponent = (value >>> 10) & 31,
            mantissa = value & 1023;
          return (
            (value & 32768 ? -1 : 1) *
            (exponent === 0
              ? mantissa * 2 ** -24
              : exponent === 31
                ? NaN
                : (1024 + mantissa) * 2 ** (exponent - 25))
          );
        };
        const capture = async () => {
          const map = await game.graphics.captureReflectionProbe(scene, probe, {
            size: 32,
          });
          try {
            const index =
              (Math.floor(map.height / 2) * map.width +
                Math.floor(map.width / 2)) *
              4;
            const rgb = [...map.levels[0].subarray(index, index + 3)].map(half);
            if (rgb.some((value) => !Number.isFinite(value) || value < 0))
              throw new Error('Invalid HDR radiance.');
            return rgb;
          } finally {
            map.destroy();
          }
        };
        const samples = [];
        try {
          scene.camera3D = new E.OrthographicCamera();
          scene.camera3D.position.set(0, 0, 2);
          scene.camera3D.height = 2;
          scene.ambientLight = 0;
          scene.directionalLight.intensity = 0;
          await game.setScene(scene);
          for (const [illumination, environment] of environments.entries()) {
            scene.environment = environment;
            for (const grazing of [false, true]) {
              const n = grazing ? [Math.sqrt(0.99), 0, 0.1] : [0, 0, 1];
              const geometry = new E.Geometry({
                positions: [
                  -0.8, 0.8, 0, 0.8, 0.8, 0, 0.8, -0.8, 0, -0.8, -0.8, 0,
                ],
                normals: [...n, ...n, ...n, ...n],
                uvs: [0, 0, 1, 0, 1, 1, 0, 1],
                indices: [0, 2, 1, 0, 3, 2],
              });
              for (const roughness of [0.04, 0.35, 0.65, 1])
                for (const layer of [
                  'metal',
                  'dielectric',
                  'coat',
                  'sheen',
                  'colored-metal',
                  'colored-sheen',
                ]) {
                  const material = new E.PBRMaterial({
                    texture,
                    color:
                      layer === 'colored-metal'
                        ? [0.5, 0.18, 0.025]
                        : layer === 'colored-sheen'
                          ? [0, 0, 0]
                          : [1, 1, 1],
                    metallic: layer.includes('metal') ? 1 : 0,
                    roughness,
                    specular: layer === 'colored-sheen' ? 0 : 1,
                    clearcoat: layer === 'coat' ? 1 : 0,
                    clearcoatRoughness: roughness,
                    sheenColor:
                      layer === 'sheen'
                        ? [1, 1, 1]
                        : layer === 'colored-sheen'
                          ? [1, 0.15, 0.03]
                          : [0, 0, 0],
                    sheenRoughness: roughness,
                  });
                  const mesh = scene.add(new E.Mesh({ geometry, material }));
                  try {
                    samples.push({
                      illumination,
                      grazing,
                      roughness,
                      layer,
                      rgb: await capture(),
                    });
                  } finally {
                    scene.remove(mesh);
                    mesh.destroy();
                  }
                }
            }
          }
          scene.environment = environments[0];
          const mesh = scene.add(
            new E.Mesh({
              geometry: E.Geometry.quad(1.6, 1.6),
              material: new E.PBRMaterial({
                texture,
                color: [1, 1, 1],
                metallic: 1,
                roughness: 1,
              }),
            }),
          );
          const before = await capture();
          if (proofs.graphicsEvents.length)
            throw new Error(proofs.graphicsEvents.join('\n'));
          const recovered = new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error('Native API recovery timeout.')),
              10000,
            );
            game.addEventListener(
              'graphicsrecovered',
              () => {
                clearTimeout(timeout);
                resolve();
              },
              { once: true },
            );
          });
          if (backend === 'webgpu') {
            // Fixture-only access to this Game's owned device, not a driver reset.
            game.graphics.current.device.destroy();
          } else {
            const extension = canvas
              .getContext('webgl2')
              .getExtension('WEBGL_lose_context');
            if (!extension)
              throw new Error('Owned API-loss extension unavailable.');
            extension.loseContext();
            setTimeout(() => extension.restoreContext(), 100);
          }
          await recovered;
          const after = await capture();
          scene.remove(mesh);
          mesh.destroy();
          const surfaceMesh = scene.add(
            new E.Mesh({
              geometry: E.Geometry.sphere(0.65, 16, 24),
              material: new E.PBRMaterial({
                texture,
                color: [0.7, 0.15, 0.03],
                metallic: 1,
                roughness: 0.6,
                clearcoat: 0.7,
                clearcoatRoughness: 0.2,
                sheenColor: [0.1, 0.04, 0.01],
                sheenRoughness: 0.7,
              }),
            }),
          );
          scene.environment = environments[1];
          scene.postProcessing.enabled = true;
          scene.postProcessing.toneMapping = 'aces';
          const next = proofs.next();
          game.graphics.beginFrame();
          game.graphics.render(scene, 128, 128);
          game.graphics.endFrame();
          const frame = await next;
          scene.remove(surfaceMesh);
          surfaceMesh.destroy();
          return {
            backend,
            samples,
            recovery: {
              kind: 'owned API loss, not physical driver evidence',
              before,
              after,
            },
            surface: { png: frame.png, stats: frame.stats },
          };
        } finally {
          game.destroy();
          scene.destroy();
          probe.destroy();
          environments.forEach((environment) => environment.destroy());
          borrowed.destroy();
          texture.destroy();
        }
      },
      { backend, built },
    );
    const png = result.surface.png;
    await writeFile(
      `${directory}/${backend}.png`,
      Buffer.from(png.slice(png.indexOf(',') + 1), 'base64'),
    );
    delete result.surface.png;
    report.results.push(result);
    for (const sample of result.samples) {
      const sky = sample.illumination ? [3, 1, 0.2] : [1, 1, 1],
        normalized = sample.rgb.map((value, c) => value / sky[c]);
      const valid =
        sample.layer === 'colored-metal'
          ? normalized[0] > normalized[1] &&
            normalized[1] > normalized[2] &&
            normalized.every((value) => value <= 1.015)
          : sample.layer === 'colored-sheen'
            ? normalized.every(
                (value, c) =>
                  Math.abs(value - normalized[0] * [1, 0.15, 0.03][c]) < 0.005,
              ) && normalized[0] <= 1.015
            : normalized.every((value) => Math.abs(value - 1) < 0.015);
      if (!valid) report.failures.push({ backend, ...sample });
    }
    if (
      result.recovery.after.some(
        (value, c) =>
          Math.abs(value - 1) > 0.015 ||
          Math.abs(value - result.recovery.before[c]) > 0.002,
      )
    )
      report.failures.push({ backend, recovery: result.recovery });
    await page.close();
  }
} finally {
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
  await browser?.close();
  await server.close();
}
if (report.errors.length || report.failures.length)
  throw new Error(
    JSON.stringify({ errors: report.errors, failures: report.failures }),
  );
process.stdout.write(
  `${JSON.stringify(
    report.results.map((result) => ({
      backend: result.backend,
      samples: result.samples.length,
      recovery: result.recovery,
      surface: result.surface,
    })),
    null,
    2,
  )}\n`,
);
