/* global document, requestAnimationFrame, setTimeout, performance, AbortController -- used inside page.evaluate, which runs in the browser */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import console from 'node:console';
import { browserLaunchOptions, browserIdentity } from './browser-launch.mjs';
const server = await createServer({
  server: { host: '127.0.0.1', port: 5239, strictPort: true },
});
const directory = '.vite/expansion-runtime';
await mkdir(directory, { recursive: true });
const launch = await browserLaunchOptions('chromium');
let browser;
const report = { results: [], errors: [] };
try {
  await server.listen();
  browser = await chromium.launch(launch);
  report.identity = browserIdentity('chromium', browser, launch);
  for (const backend of ['canvas2d', 'webgl2', 'webgpu']) {
    const page = await browser.newPage();
    page.on('pageerror', (error) =>
      report.errors.push(`${backend}: ${error.stack}`),
    );
    await page.goto('http://127.0.0.1:5239/');
    try {
      report.results.push(
        await page.evaluate(async (backend) => {
          const E = await import('/src/index.ts');
          const { frameProofs } = await import('/tests/browser/frame-proof.ts');
          const { runVideoTextureSmoke } =
            await import('/tests/browser/video-texture.ts');
          const { runAnimatedImageSmoke } =
            await import('/tests/browser/animated-image.ts');
          const { runGLTFExporterSmoke } =
            await import('/tests/browser/gltf-exporter.ts');
          const { runComputeScenario } =
            await import('/examples/gpu-compute/scenario.ts');
          const { createChannelGraph } =
            await import('/examples/render-graph/graph.ts');
          const canvas = document.createElement('canvas');
          document.body.replaceChildren(canvas);
          const game = await E.Game.create({
            canvas,
            width: 128,
            height: 128,
            renderer: backend,
          });
          const renderer = game.graphics;
          const scene = new E.Scene();
          const image = document.createElement('canvas');
          image.width = image.height = 32;
          const context = image.getContext('2d');
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, 32, 32);
          const texture = new E.CanvasTexture2D(image);
          const sprite = scene.add(
            new E.Sprite({
              texture,
              anchor: [0, 0],
              position: [16, 16],
              scale: [3, 3],
            }),
          );
          const graph = createChannelGraph();
          const output = { backend };
          const check = (condition, message) => {
            if (!condition) throw new Error(message);
          };
          const changed = (a, b) => {
            let count = 0;
            for (let i = 0; i < a.length; i += 4)
              if (
                Math.abs(a[i] - b[i]) +
                  Math.abs(a[i + 1] - b[i + 1]) +
                  Math.abs(a[i + 2] - b[i + 2]) >
                30
              )
                count++;
            check(count > 64, 'Expected real consumer pixel mutation');
            return count;
          };
          const rejects = async (run, name) => {
            let error;
            try {
              await run();
            } catch (cause) {
              error = cause;
            }
            check(!!error, `${name} did not reject`);
            return String(error);
          };
          let fallback;
          try {
            if (backend === 'canvas2d') {
              output.graphUnsupported = await rejects(
                () => renderer.prepareRenderGraph(graph.graph),
                'Canvas graph',
              );
              output.computeUnsupported = await rejects(
                () => runComputeScenario(renderer),
                'Canvas compute',
              );
              sprite.lighting = new E.Lighting2D();
              renderer.beginFrame();
              output.lightingUnsupported = await rejects(
                () => renderer.render(scene, 128, 128),
                'Canvas lighting',
              );
              return output;
            }
            const proofs = frameProofs(renderer, canvas);
            const draw = async (effects) => {
              await new Promise((resolve) => requestAnimationFrame(resolve));
              renderer.beginFrame();
              renderer.render(scene, 128, 128, effects);
              const pending = proofs.next();
              renderer.endFrame();
              return (await pending).bytes;
            };
            const plain = await draw();
            await renderer.prepareRenderGraph(graph.graph);
            scene.renderGraph = graph.graph;
            const graphed = await draw();
            output.graphPixels = changed(plain, graphed);
            graph.merge.setUniforms([0]);
            output.graphUniformPixels = changed(graphed, await draw());
            scene.renderGraph = undefined;
            const light = new E.Light2D({
              position: [30, 30],
              height: 30,
              radius: 200,
              intensity: 2,
              color: [1, 0, 0],
            });
            sprite.lighting = new E.Lighting2D({
              ambient: [0.05, 0.05, 0.05],
              lights: [light],
            });
            const red = await draw();
            light.color[0] = 0;
            light.color[2] = 1;
            output.lightingPixels = changed(red, await draw());
            sprite.lighting = undefined;
            if (backend === 'webgpu') {
              const values = await runComputeScenario(renderer);
              check(
                values.every((v, i) => v === i / 2 + 3),
                'Compute oracle mismatch',
              );
              output.computeValues = values.length;
              const invalid = new E.ComputeProgram({
                bindings: [{ type: 'f32', access: 'read-write' }],
                wgsl: 'not valid wgsl',
              });
              try {
                output.compileRejected = await rejects(
                  () => renderer.prepareCompute(invalid),
                  'Invalid compute',
                );
              } finally {
                invalid.destroy();
              }
              const buffer = new E.ComputeBuffer({ type: 'f32', length: 4 });
              const abort = new AbortController();
              abort.abort();
              try {
                output.abortRejected = await rejects(
                  () => renderer.readCompute(buffer, { signal: abort.signal }),
                  'Aborted read',
                );
              } finally {
                buffer.destroy();
              }
            } else
              output.computeUnsupported = await rejects(
                () => runComputeScenario(renderer),
                'GL compute',
              );
            output.video = await runVideoTextureSmoke(renderer, canvas);
            output.animatedImage = await runAnimatedImageSmoke(
              renderer,
              canvas,
            );
            await runGLTFExporterSmoke();
            output.gltfExporter = true;
            check(
              !proofs.graphicsEvents.length,
              `Native graphics errors: ${proofs.graphicsEvents.join(';')}`,
            );
            scene.renderGraph = graph.graph;
            graph.merge.setUniforms([1]);
            sprite.position.set(0, 0);
            sprite.scale.set(1, 1);
            scene.camera3D.position.set(0, 0, 4);
            scene.camera3D.lookAt(new E.Vector3(0, 0, 0));
            scene.ambientLight = 1;
            scene.directionalLight.intensity = 0;
            fallback = await E.Texture.fromImage(image);
            scene.add(
              new E.Mesh({
                geometry: E.Geometry.cube(),
                material: new E.PBRMaterial({
                  texture: fallback,
                  textureSource: texture,
                  metallic: 0,
                  roughness: 1,
                }),
              }),
            );
            const complete = await draw();
            check(
              renderer.stats.meshes === 1,
              'Graph omitted the real 3D draw',
            );
            output.graphSceneMeshes = renderer.stats.meshes;
            const snapshot = await renderer.captureScene(scene, 128, 128);
            try {
              graph.merge.setUniforms([0]);
              const incoming = await draw();
              output.graphCompletePixels = changed(complete, incoming);
              const transition = {
                kind: 'crossfade',
                progress: 0,
                snapshot,
                color: [0, 0, 0, 1],
                direction: 'left',
              };
              const outgoing = await draw({ transition });
              check(
                complete.every(
                  (value, index) => Math.abs(value - outgoing[index]) <= 1,
                ),
                'Graph capture/transition zero did not preserve complete scene+HUD',
              );
              transition.progress = 1;
              const finished = await draw({ transition });
              check(
                incoming.every(
                  (value, index) => Math.abs(value - finished[index]) <= 1,
                ),
                'Transition one did not sample original graph destination',
              );
              output.graphCaptureTransition = true;
            } finally {
              snapshot.destroy();
            }
            graph.merge.setUniforms([1]);
            const beforeLoss = await draw();
            const retained =
              backend === 'webgpu'
                ? new E.ComputeBuffer({ type: 'f32', length: 4 })
                : undefined;
            if (retained)
              renderer.uploadCompute(retained, new Float32Array([1, 2, 3, 4]));
            let recovered = false;
            game.addEventListener(
              'graphicsrecovered',
              () => {
                recovered = true;
              },
              { once: true },
            );
            if (backend === 'webgpu') renderer.current.device.destroy();
            else {
              const extension = canvas
                .getContext('webgl2')
                .getExtension('WEBGL_lose_context');
              check(!!extension, 'Owned GL recovery injection unavailable');
              extension.loseContext();
              setTimeout(() => extension.restoreContext(), 100);
            }
            const deadline = performance.now() + 10000;
            while (!recovered && performance.now() < deadline)
              await new Promise((resolve) => setTimeout(resolve, 10));
            check(recovered, 'Same-backend recovery timed out');
            const afterLoss = await draw();
            check(
              beforeLoss.every(
                (value, index) => Math.abs(value - afterLoss[index]) <= 1,
              ),
              'Prepared graph was not restored after loss',
            );
            output.graphRecovered = true;
            if (retained) {
              try {
                output.lostComputeRejected = await rejects(
                  () => renderer.readCompute(retained),
                  'Lost compute contents',
                );
                renderer.uploadCompute(
                  retained,
                  new Float32Array([4, 3, 2, 1]),
                );
                check(
                  Array.from(await renderer.readCompute(retained)).join(',') ===
                    '4,3,2,1',
                  'Reuploaded compute storage did not recover',
                );
                output.computeReuploaded = true;
              } finally {
                retained.destroy();
              }
            }
            return output;
          } finally {
            scene.destroy();
            graph.destroy();
            game.destroy();
            texture.destroy();
            fallback?.destroy();
          }
        }, backend),
      );
    } catch (error) {
      report.errors.push(`${backend}: ${error.stack}`);
    }
    await page.close();
  }
} finally {
  await browser?.close();
  await server.close();
  await writeFile(`${directory}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
if (report.errors.length || report.results.length !== 3) process.exitCode = 1;
