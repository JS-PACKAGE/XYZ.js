/* global document, window, requestAnimationFrame -- used inside page.evaluate */
import { createServer } from 'vite';
import { chromium } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { browserIdentity, browserLaunchOptions } from './browser-launch.mjs';

const directory = '.vite/tangent-runtime';
await mkdir(directory, { recursive: true });
const server = await createServer({
  server: { host: '127.0.0.1', port: 5247, strictPort: true },
});
const launch = await browserLaunchOptions('chromium');
let browser;
const report = { results: [], errors: [] };
try {
  await server.listen();
  browser = await chromium.launch(launch);
  report.identity = browserIdentity('chromium', browser, launch);
  for (const backend of ['webgpu', 'webgl2']) {
    const page = await browser.newPage();
    page.on('pageerror', (error) =>
      report.errors.push(`${backend}: ${error.stack}`),
    );
    await page.exposeFunction('captureTangentVisual', () =>
      page
        .locator('canvas')
        .screenshot({ path: `${directory}/${backend}.png` }),
    );
    await page.goto('http://127.0.0.1:5247/');
    report.results.push(
      await page.evaluate(async (backend) => {
        // Serialized page.evaluate cannot carry static imports into its browser context.
        const E = await import('/src/index.ts');
        const { frameProofs } = await import('/tests/browser/frame-proof.ts');
        const canvas = document.createElement('canvas');
        document.body.replaceChildren(canvas);
        const game = await E.Game.create({
          canvas,
          width: 64,
          height: 64,
          renderer: backend,
        });
        const renderer = game.graphics;
        const proofs = frameProofs(renderer, canvas);
        const scene = new E.Scene();
        scene.camera3D = new E.OrthographicCamera();
        scene.camera3D.height = 2;
        scene.camera3D.position.set(0, 0, 2);
        const image = document.createElement('canvas');
        image.width = image.height = 2;
        const context = image.getContext('2d');
        const data = context.createImageData(2, 2);
        data.data.set([
          255, 128, 0, 255, 0, 255, 128, 255, 0, 0, 255, 255, 255, 255, 255,
          255,
        ]);
        context.putImageData(data, 0, 0);
        const normal = await E.Texture.fromImage(image);
        const albedo = document.createElement('canvas');
        albedo.width = albedo.height = 1;
        const albedoContext = albedo.getContext('2d');
        albedoContext.fillStyle = '#ffffff';
        albedoContext.fillRect(0, 0, 1, 1);
        const white = await E.Texture.fromImage(albedo);
        const material = new E.PBRMaterial({
          texture: white,
          normalTexture: normal,
          metallic: 0,
          roughness: 1,
          alphaMode: 'OPAQUE',
          doubleSided: false,
        });
        const geometry = E.generateMikkTangents(
          new E.Geometry({
            positions: [-0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0],
            normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            uvs: [1, 0, 0, 0, 0, 1, 1, 1],
            tangents: [-1, 0, 0, 1, -1, 0, 0, 1, -1, 0, 0, 1, -1, 0, 0, 1],
            indices: [0, 2, 1, 0, 3, 2],
          }),
        ).geometry;
        const mesh = scene.add(new E.Mesh({ geometry, material }));
        scene.ambientLight = 0;
        scene.directionalLight.direction.set(0.2, 0.9, 1);
        scene.directionalLight.intensity = 1;
        const capture = async () => {
          const next = proofs.next();
          renderer.beginFrame();
          renderer.render(scene, 64, 64);
          renderer.endFrame();
          return next;
        };
        const authored = await capture();
        const left = authored.bytes[31 * 64 * 4 + 24 * 4];
        const right = authored.bytes[31 * 64 * 4 + 40 * 4];
        if (left === right)
          throw new Error('Mirrored tangent shading did not vary across UV.');
        mesh.scale.set(-1, 1, 1);
        mesh.updateWorldMatrix();
        const mirrored = await capture();
        let changed = 0;
        for (let i = 0; i < authored.bytes.length; i += 4)
          if (
            Math.abs(authored.bytes[i] - mirrored.bytes[i]) +
              Math.abs(authored.bytes[i + 1] - mirrored.bytes[i + 1]) +
              Math.abs(authored.bytes[i + 2] - mirrored.bytes[i + 2]) >
            24
          )
            changed++;
        if (changed < 64)
          throw new Error(
            'Negative scale did not preserve tangent orientation.',
          );
        scene.remove(mesh);
        context.fillStyle = 'rgb(128,218,218)';
        context.fillRect(0, 0, 2, 2);
        const constantNormal = await E.Texture.fromImage(image);
        const constantMaterial = new E.PBRMaterial({
          texture: white,
          normalTexture: constantNormal,
          metallic: 0,
          roughness: 1,
          alphaMode: 'OPAQUE',
          doubleSided: false,
        });
        const constantMesh = scene.add(
          new E.Mesh({ geometry, material: constantMaterial }),
        );
        const center = (31 * 64 + 31) * 4;
        const constant = await capture();
        constantMesh.scale.x = -1;
        const reflected = await capture();
        if (Math.abs(constant.bytes[center] - reflected.bytes[center]) > 2)
          throw new Error('Reflection changed the world-space bitangent.');
        scene.remove(constantMesh);
        const joint = new E.Object3D();
        joint.scale.set(-2, 1, 1);
        const skin = scene.add(
          new E.SkinnedMesh({
            geometry,
            material: constantMaterial,
            joints: [joint],
            jointIndices: new Uint32Array(16),
            weights: new Float32Array(16).fill(1),
          }),
        );
        const skinned = await capture();
        skin.updateSkin();
        if (
          Math.abs(constant.bytes[center] - skinned.bytes[center]) > 2 ||
          Math.abs(skin.geometry.tangents[3] + 1) > 0.00001
        )
          throw new Error(
            `Native skin or CPU mirror lost reflected handedness: ${constant.bytes[center]}, ${skinned.bytes[center]}, ${skin.geometry.tangents[3]}.`,
          );
        scene.remove(skin);
        const weights = new E.MorphWeights([0]);
        const morph = scene.add(
          new E.Mesh({
            geometry,
            material: constantMaterial,
            morph: new E.MorphTargets({
              positions: [new Float32Array(12)],
              tangents: [[1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0]],
              weights,
            }),
          }),
        );
        const beforeMorph = await capture();
        weights.set(0, 1);
        morph.updateDeformation();
        const afterMorph = await capture();
        const morphDelta = Math.abs(
          beforeMorph.bytes[center] - afterMorph.bytes[center],
        );
        if (morphDelta < 8)
          throw new Error('Native tangent morph did not rotate shading.');
        scene.remove(morph);
        const uv1Geometry = E.generateMikkTangents(
          new E.Geometry({
            positions: [-0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0],
            normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
            uvs: [1, 0, 0, 0, 0, 1, 1, 1],
            uvs1: [1, 0, 0, 0, 0, 1, 1, 1],
            indices: [0, 2, 1, 0, 3, 2],
          }),
          { texCoord: 1 },
        ).geometry;
        const uv1Weights = new E.MorphWeights([0]);
        const uv1Mesh = scene.add(
          new E.Mesh({
            geometry: uv1Geometry,
            material: new E.PBRMaterial({
              texture: white,
              normalTexture: constantNormal,
              roughness: 1,
              alphaMode: 'OPAQUE',
              doubleSided: false,
              textureCoordinates: { normal: { texCoord: 1 } },
            }),
            morph: new E.MorphTargets({
              positions: [new Float32Array(12)],
              tangents: [[1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0]],
              weights: uv1Weights,
            }),
          }),
        );
        const uv1Before = await capture();
        uv1Weights.set(0, 1);
        uv1Mesh.updateDeformation();
        const uv1After = await capture();
        const uv1MorphDelta = Math.abs(
          uv1Before.bytes[center] - uv1After.bytes[center],
        );
        if (uv1MorphDelta < 8)
          throw new Error(
            'Native UV1 tangent morph used a derivative fallback.',
          );
        scene.remove(uv1Mesh);
        uv1Mesh.destroy();
        const rotatedReference = scene.add(
          new E.Mesh({
            geometry: new E.Geometry({
              positions: [
                -0.5, 0.5, 0, 0.5, 0.5, 0, 0.5, -0.5, 0, -0.5, -0.5, 0,
              ],
              normals: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
              uvs: [1, 0, 0, 0, 0, 1, 1, 1],
              indices: [0, 2, 1, 0, 3, 2],
              tangents: [0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1],
            }),
            material: constantMaterial,
          }),
        );
        const rotatedExpected = await capture();
        scene.remove(rotatedReference);
        rotatedReference.destroy();
        scene.add(
          new E.Mesh({
            geometry: E.generateMikkTangents(geometry, { convention: 'gltf' })
              .geometry,
            material: new E.PBRMaterial({
              texture: white,
              normalTexture: constantNormal,
              roughness: 1,
              alphaMode: 'OPAQUE',
              doubleSided: false,
              textureCoordinates: { normal: { rotation: Math.PI / 2 } },
            }),
          }),
        );
        const transformedFrame = await capture();
        const transformedError = Math.abs(
          rotatedExpected.bytes[center] - transformedFrame.bytes[center],
        );
        if (transformedError > 2)
          throw new Error(
            `Transformed glTF frame changed handedness: ${rotatedExpected.bytes[center]} vs ${transformedFrame.bytes[center]}.`,
          );
        await game.setScene(scene);
        game.start();
        await new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        );
        await window.captureTangentVisual();
        mesh.destroy();
        constantMesh.destroy();
        skin.destroy();
        morph.destroy();
        scene.destroy();
        game.destroy();
        normal.destroy();
        constantNormal.destroy();
        white.destroy();
        return {
          backend,
          left,
          right,
          changed,
          morphDelta,
          uv1MorphDelta,
          transformedError,
          reflected: reflected.bytes[center],
          skinned: skinned.bytes[center],
          drawCalls: authored.stats.drawCalls,
        };
      }, backend),
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
