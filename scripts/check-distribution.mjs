import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import process from 'node:process';
import console from 'node:console';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));

// Executed in a fresh Node process rooted inside the actual installed/extracted
// package: neither Vitest's transforms nor repository dependencies resolve it.
async function consume() {
  const { default: assert } = await import('node:assert/strict');
  const { createRequire } = await import('node:module');
  const { access } = await import('node:fs/promises');
  const require = createRequire(new URL('./package.json', import.meta.url));
  const cjs = require('xyz.js');
  const esm = await import('xyz.js');
  assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());

  function operations(engine) {
    const vector = new engine.Vector3(3, 4, 0);
    assert.equal(vector.length(), 5);
    assert.equal(vector.normalize(), vector);
    const cross = new engine.Vector3(1, 0, 0).cross(
      new engine.Vector3(0, 1, 0),
    );
    const matrix = new engine.Matrix4().compose(
      new engine.Vector3(10, 20, 30),
      new engine.Quaternion(),
      new engine.Vector3(2, 3, 4),
    );
    const point = new engine.Vector3(1, 2, 3);
    assert.equal(matrix.transformPoint(point, point), point);
    assert.deepEqual([point.x, point.y, point.z], [12, 26, 42]);
    matrix.invert().transformPoint(point, point);
    for (const [actual, expected] of [
      [point.x, 1],
      [point.y, 2],
      [point.z, 3],
    ])
      assert.ok(Math.abs(actual - expected) < 1e-5);
    return [vector.x, vector.y, vector.z, cross.x, cross.y, cross.z];
  }
  assert.deepEqual(operations(cjs), operations(esm));

  function objects(engine) {
    const texture = new engine.Texture({ kind: 'native', width: 2, height: 3 });
    const scene = new engine.Scene();
    const geometry = new engine.Geometry({
      positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      normals: [0, 0, 1, 0, 0, 1, 0, 0, 1],
      uvs: [0, 0, 1, 0, 0, 1],
      indices: [0, 1, 2],
    });
    const material = new engine.TextureMaterial({ texture });
    const mesh = new engine.Mesh({ geometry, material });
    assert.equal(material.texture, texture);
    assert.equal(mesh.geometry, geometry);
    assert.equal(mesh.material, material);
    return { Texture: texture, Scene: scene, Mesh: mesh };
  }
  const requiredObjects = objects(cjs);
  const importedObjects = objects(esm);
  const identity = Object.fromEntries(
    Object.keys(requiredObjects).map((name) => {
      const requiredOwn = requiredObjects[name] instanceof cjs[name];
      const importedOwn = importedObjects[name] instanceof esm[name];
      assert.equal(requiredOwn, true);
      assert.equal(importedOwn, true);
      return [
        name,
        {
          sameConstructor: cjs[name] === esm[name],
          requiredOwn,
          importedOwn,
          requiredInstanceOfImported:
            requiredObjects[name] instanceof esm[name],
          importedInstanceOfRequired:
            importedObjects[name] instanceof cjs[name],
        },
      ];
    }),
  );
  function mixedTexture(engine, texture) {
    try {
      const material = new engine.TextureMaterial({ texture });
      assert.equal(material.texture, texture);
      return { accepted: true };
    } catch (error) {
      if (!(error instanceof TypeError)) throw error;
      return { accepted: false, error: error.message };
    }
  }
  const mixedMaterials = {
    requiredMaterialImportedTexture: mixedTexture(cjs, importedObjects.Texture),
    importedMaterialRequiredTexture: mixedTexture(esm, requiredObjects.Texture),
  };
  for (const instances of [requiredObjects, importedObjects])
    instances.Texture.destroy();

  for (const backend of ['canvas2d', 'webgl2', 'webgpu']) {
    assert.equal(
      Object.keys(require.cache).some((path) =>
        path.endsWith(`${backend}-renderer.cjs`),
      ),
      false,
      `Root require eagerly loaded ${backend}`,
    );
  }

  const worker = cjs.geometryWorkerURL();
  assert.equal(worker.href, esm.geometryWorkerURL().href);
  assert.equal(worker.href.includes('/cjs/'), false);
  await access(worker);
  const voice = {
    version: 7,
    name: 'distribution',
    algorithm: 4,
    feedback: 0,
    modIndex: 0,
    lfo: { rate: 0, amDepth: 0, pmDepth: 0 },
    ops: Array.from({ length: 4 }, () => ({
      ratio: 1,
      level: 1,
      detune: 0,
      adsr: { a: 0, d: 0, s: 1, r: 0.5 },
    })),
  };
  // This calls the real asynchronously imported official API, including its
  // neighboring schema/normalization modules, without creating AudioContexts.
  const native = await cjs.OPMAdapter.validateVoice(voice);
  assert.deepEqual(native, await esm.OPMAdapter.validateVoice(voice));
  assert.equal(native.version, 1);
  assert.equal(native.ops.length, 4);
  for (const path of ['api/index.js', 'core/index.js', 'worklet/processor.js'])
    await access(new URL(`./dist/vendor/opm/dist/${path}`, import.meta.url));
  return {
    exports: Object.keys(cjs).length,
    root: 'require/import equivalent math and full exports',
    identity,
    mixedMaterials,
    backend:
      'root require does not load rendering backends; native initialization is the browser gate',
    assets:
      'original ESM worker URL and actual asynchronous official vendor voice validation',
  };
}

export async function verifyDistribution(directory = root) {
  const { stdout } = await execute(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `console.log(JSON.stringify(await (${consume.toString()})()));`,
    ],
    { cwd: directory, maxBuffer: 1024 * 1024 },
  );
  return JSON.parse(stdout.trim());
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  if (process.argv.length > 3)
    throw new Error(
      'Usage: node scripts/check-distribution.mjs [extracted-package-directory]',
    );
  console.log(
    JSON.stringify(
      await verifyDistribution(
        process.argv[2] ? resolve(process.argv[2]) : root,
      ),
      null,
      2,
    ),
  );
}
