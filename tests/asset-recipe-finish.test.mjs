import { execFile } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assetRecipe } from '../src/data/asset-recipe.js';
import { assetBrowser } from '../scripts/asset-recipe-browser.mjs';
import {
  engineDirectory,
  recipeDirectory,
} from '../scripts/asset-tool-paths.mjs';
import { encodePNG } from '../scripts/asset-recipe-lib.mjs';

// This exercises the real pinned browser and built root, like the production tool.
describe('material finish recipe runtime consumption', () => {
  // The production recipe tool refuses any Node other than the pinned version, so this only runs there.
  it.skipIf(process.versions.node !== assetRecipe.node)(
    'preserves required extensions, variant-only textures and finish values in both bundle choices',
    async () => {
      const root = await mkdtemp(join(tmpdir(), 'xyz-finish-recipe-'));
      let session;
      try {
        const binary = Buffer.alloc(60);
        const vertices = [-1, -1, 0, 1, -1, 0, 0, 1, 0, 0, 0, 1, 0, 0.5, 1];
        vertices.forEach((value, index) =>
          binary.writeFloatLE(value, index * 4),
        );
        await writeFile(join(root, 'triangle.bin'), binary);
        await writeFile(
          join(root, 'finish.png'),
          encodePNG({
            width: 1,
            height: 1,
            data: Buffer.from([64, 128, 192, 255]),
          }),
        );
        const extensions = {
          KHR_materials_anisotropy: {
            anisotropyStrength: 0.5,
            anisotropyRotation: 0.25,
          },
          KHR_materials_iridescence: {
            iridescenceFactor: 0.4,
            iridescenceIor: 1.5,
            iridescenceThicknessMaximum: 450,
          },
          KHR_materials_transmission: { transmissionFactor: 0.6 },
          KHR_materials_dispersion: { dispersion: 0.2 },
        };
        const model = {
          asset: { version: '2.0' },
          extensionsRequired: [
            'KHR_materials_variants',
            ...Object.keys(extensions),
          ],
          extensionsUsed: [
            'KHR_materials_variants',
            ...Object.keys(extensions),
          ],
          extensions: {
            KHR_materials_variants: { variants: [{ name: 'finish' }] },
          },
          buffers: [{ uri: 'triangle.bin', byteLength: binary.length }],
          bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 24 },
          ],
          accessors: [
            { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
            { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2' },
          ],
          images: [{ uri: 'finish.png' }],
          textures: [{ source: 0 }],
          materials: [
            {},
            {
              extensions,
              pbrMetallicRoughness: { baseColorTexture: { index: 0 } },
            },
          ],
          meshes: [
            {
              primitives: [
                {
                  attributes: { POSITION: 0, TEXCOORD_0: 1 },
                  material: 0,
                  extensions: {
                    KHR_materials_variants: {
                      mappings: [{ material: 1, variants: [0] }],
                    },
                  },
                },
              ],
            },
          ],
          nodes: [{ mesh: 0 }],
          scenes: [{ nodes: [0] }],
          scene: 0,
        };
        const input = join(root, 'source.gltf');
        const bundle = join(root, 'bundle');
        await writeFile(input, JSON.stringify(model));
        // Spawn the untransformed CLI: Vite SSR rewrites imports inside browser callbacks.
        await promisify(execFile)(process.execPath, [
          fileURLToPath(
            new URL('../scripts/build-assets.mjs', import.meta.url),
          ),
          '--input',
          input,
          '--out',
          bundle,
        ]);
        const manifest = JSON.parse(
          await readFile(join(bundle, 'manifest.json'), 'utf8'),
        );
        expect(manifest.textures).toHaveLength(1);
        for (const key of ['native', 'fallback'])
          expect(
            manifest.files.some(
              (file) => file.path === manifest.textures[0][key],
            ),
          ).toBe(true);
        for (const variant of manifest.variants) {
          const output = JSON.parse(
            await readFile(join(bundle, variant.path), 'utf8'),
          );
          expect(output.extensionsRequired).toEqual(model.extensionsRequired);
          expect(output.materials[1].extensions).toEqual(extensions);
          expect(output.meshes[0].primitives[0].extensions).toEqual(
            model.meshes[0].primitives[0].extensions,
          );
        }
        session = await assetBrowser({
          engine: engineDirectory,
          recipe: recipeDirectory,
          bundle,
        });
        for (const nativeTextures of [true, false]) {
          const result = await session.page.evaluate(
            `(async () => {
          const nativeTextures = ${nativeTextures};
          const { GLTFLoader, gltfVariants, loadAssetBundle } =
            await import('/engine/src/index.js');
          const renderer = {
            backend: 'webgl2',
            capabilities: {
              threeD: true,
              maxTextureSize: 8192,
              supportedTextureFormats: nativeTextures ? ['rgba8unorm'] : [],
            },
          };
          const asset = await loadAssetBundle(
            new URL('/bundle/manifest.json', location.href).href,
            { renderer, loader: new GLTFLoader() },
          );
          try {
            const variants = gltfVariants(asset);
            const material = variants.variants[0].mappings[0].material;
            const mesh = variants.variants[0].mappings[0].mesh;
            const base = mesh.material;
            variants.selectVariant('finish');
            const selected = mesh.material === material;
            variants.selectVariant(undefined);
            return {
              names: variants.variants.map((variant) => variant.name),
              finish: material.finish,
              textured: !!material.texture,
              selected,
              restored: mesh.material === base,
            };
          } finally {
            asset.dispose();
          }
        })()`,
          );
          expect(result.names).toEqual(['finish']);
          expect(result.finish).toMatchObject({
            anisotropy: 0.5,
            anisotropyRotation: 0.25,
            iridescence: 0.4,
            iridescenceIor: 1.5,
            iridescenceThickness: 0.5,
            dispersion: 0.2,
          });
          expect(result).toMatchObject({
            textured: true,
            selected: true,
            restored: true,
          });
        }
      } finally {
        if (session) await session.close();
        await rm(root, { recursive: true, force: true });
      }
    },
    120000,
  );
});
