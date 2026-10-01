import { mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import console from 'node:console';
import { build } from 'vite';

const source = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'xyz-tree-shaking-'));

async function javascriptBytes(directory) {
  let bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) bytes += await javascriptBytes(path);
    else if (entry.isFile() && entry.name.endsWith('.js')) {
      bytes += (await stat(path)).size;
    }
  }
  return bytes;
}

async function bundle(name, consumer) {
  const directory = join(temporary, name);
  const entry = join(temporary, `${name}.mjs`);
  await writeFile(entry, consumer);
  await build({
    configFile: false,
    root: temporary,
    logLevel: 'error',
    build: {
      target: 'es2022',
      minify: true,
      sourcemap: false,
      outDir: directory,
      reportCompressedSize: false,
      lib: { entry, formats: ['es'], fileName: () => 'bundle.js' },
    },
  });
  return javascriptBytes(directory);
}

try {
  const specifier = JSON.stringify(source);
  const tiny = await bundle(
    'tiny',
    `import { Vector2 } from ${specifier};\nconsole.log(new Vector2(3, 4).length());\n`,
  );
  // Passing the namespace to an opaque consumer keeps every public export live.
  const full = await bundle(
    'full',
    `import * as XYZ from ${specifier};\nconsole.log(XYZ);\n`,
  );
  console.log(`Tree shaking: tiny ${tiny} bytes; full ${full} bytes.`);
  if (tiny <= 0 || tiny >= full) {
    throw new Error(
      'The tiny import must produce a smaller JavaScript bundle.',
    );
  }
  console.log(`Reduction: ${(((full - tiny) / full) * 100).toFixed(2)}%.`);
  // A single math import must not drag in modules with import-time effects; package.json's
  // "sideEffects": false is what lets bundlers drop the rest.
  const budget = 4096;
  if (tiny > budget) {
    throw new Error(
      `The tiny import is ${tiny} bytes, above the ${budget}-byte budget. Something imported by src/index.ts has an import-time side effect.`,
    );
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
