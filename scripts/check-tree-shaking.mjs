import {
  access,
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { gzipSync } from 'node:zlib';
import console from 'node:console';
import { Buffer } from 'node:buffer';
import { build } from 'vite';
import { startupBaseline, startupBudgets } from '../src/data/startup.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = join(root, 'src/index.ts');
const temporary = await mkdtemp(join(tmpdir(), 'xyz-tree-shaking-'));
const gpuImplementation = /\/packages\/graphics\/src\/web(?:gpu|gl2)[-/]/;
const canvasImplementation =
  /\/packages\/graphics\/src\/canvas2d-renderer\.[jt]s$/;

async function bundle(name, consumer) {
  const entry = join(temporary, `${name}.mjs`);
  await writeFile(entry, consumer);
  const result = await build({
    configFile: false,
    root: temporary,
    logLevel: 'error',
    build: {
      target: 'es2022',
      minify: true,
      sourcemap: false,
      write: false,
      reportCompressedSize: false,
      lib: { entry, formats: ['es'], fileName: () => 'entry.js' },
    },
  });
  const output =
    Array.isArray(result) && result.length === 1 ? result[0] : result;
  if (Array.isArray(output) || !('output' in output))
    throw new Error('Expected a single ES consumer build.');
  const chunks = new Map(
    output.output
      .filter((file) => file.type === 'chunk')
      .map((chunk) => [chunk.fileName, chunk]),
  );
  const initial = [...chunks.values()].find((chunk) => chunk.isEntry);
  if (!initial) throw new Error(`${name}: no consumer entry chunk.`);
  const closure = (seeds) => {
    const names = new Set();
    const queue = [...seeds];
    for (let i = 0; i < queue.length; i++) {
      const name = queue[i];
      if (names.has(name)) continue;
      const chunk = chunks.get(name);
      if (!chunk) throw new Error(`${name}: unresolved deployed chunk import.`);
      names.add(name);
      queue.push(...chunk.imports);
    }
    return names;
  };
  const sizes = (names) => {
    let minified = 0;
    let gzip = 0;
    for (const name of names) {
      const code = chunks.get(name).code;
      minified += Buffer.byteLength(code);
      // Each HTTP resource is compressed independently, as in an actual deployment.
      gzip += gzipSync(code, { level: 9 }).byteLength;
    }
    return { minified, gzip };
  };
  const staticNames = closure([initial.fileName]);
  const canvas = [...chunks.values()].find((chunk) =>
    Object.keys(chunk.modules).some((id) => canvasImplementation.test(id)),
  );
  const startupNames = canvas
    ? closure([initial.fileName, canvas.fileName])
    : staticNames;
  const lazyNames = new Set(
    [...chunks.keys()].filter((name) => !staticNames.has(name)),
  );
  const gpuStartup = [...startupNames].flatMap((name) =>
    Object.keys(chunks.get(name).modules).filter((id) =>
      gpuImplementation.test(id),
    ),
  );
  return {
    initial: sizes(staticNames),
    startup: sizes(startupNames),
    lazy: sizes(lazyNames),
    all: sizes(chunks.keys()),
    lazyChunks: lazyNames.size,
    canvasChunk: canvas?.fileName ?? null,
    canvasIsLazy: !!canvas && !staticNames.has(canvas.fileName),
    gpuStartup,
  };
}

function enforce(label, measurement, ceilings) {
  for (const [field, limit] of Object.entries(ceilings)) {
    if (measurement[field] <= 0 || measurement[field] > limit)
      throw new Error(
        `${label}: ${field} ${measurement[field]} bytes exceeds the ${limit}-byte ceiling.`,
      );
  }
}

try {
  // Resolve the deployed consumer through package.json exports/sideEffects, not a source alias.
  await access(join(root, 'dist/src/index.js'));
  await mkdir(join(temporary, 'node_modules'));
  await symlink(root, join(temporary, 'node_modules/xyz.js'), 'dir');
  for (const [kind, specifier] of [
    ['source', JSON.stringify(source)],
    ['built-root', JSON.stringify('xyz.js')],
  ]) {
    const tiny = await bundle(
      `${kind}-math`,
      `import { Vector2 } from ${specifier};\nconsole.log(new Vector2(3, 4).length());\n`,
    );
    const canvas = await bundle(
      `${kind}-canvas`,
      `import { Game, Scene, Sprite, Texture } from ${specifier};
const canvas = document.createElement('canvas');
canvas.width = canvas.height = 64;
document.body.append(canvas);
const image = document.createElement('canvas');
image.width = image.height = 8;
image.getContext('2d').fillRect(0, 0, 8, 8);
const texture = await Texture.fromImage(image);
const scene = new Scene();
scene.add(new Sprite({ texture, position: [32, 32] }));
const game = await Game.create({ canvas, renderer: 'canvas2d', autoResize: false, pixelRatio: 1 });
await game.setScene(scene);
game.start();
window.consumer = { game, scene, texture };
`,
    );
    const full = await bundle(
      `${kind}-full`,
      `import * as XYZ from ${specifier};\nconsole.log(XYZ);\n`,
    );
    console.log(
      JSON.stringify({
        kind,
        historicalCanvasBaseline: startupBaseline,
        math: tiny,
        canvas,
        full,
      }),
    );
    enforce(`${kind} math`, tiny.initial, {
      minified: startupBudgets.mathMinifiedBytes,
    });
    enforce(`${kind} Canvas2D initial entry`, canvas.initial, {
      minified: startupBudgets.canvasInitialMinifiedBytes,
      gzip: startupBudgets.canvasInitialGzipBytes,
    });
    enforce(
      `${kind} Canvas2D startup including selected lazy backend`,
      canvas.startup,
      {
        minified: startupBudgets.canvasStartupMinifiedBytes,
        gzip: startupBudgets.canvasStartupGzipBytes,
      },
    );
    enforce(`${kind} deferred chunks`, canvas.lazy, {
      minified: startupBudgets.lazyMinifiedBytes,
      gzip: startupBudgets.lazyGzipBytes,
    });
    if (tiny.all.minified >= full.all.minified)
      throw new Error(
        `${kind}: the math consumer must remain smaller than the full facade.`,
      );
    if (!canvas.canvasIsLazy || !canvas.lazyChunks)
      throw new Error(`${kind}: Canvas2D must be a real lazy backend chunk.`);
    if (canvas.gpuStartup.length)
      throw new Error(
        `${kind}: Canvas2D startup includes GPU implementation modules: ${canvas.gpuStartup.join(', ')}`,
      );
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
