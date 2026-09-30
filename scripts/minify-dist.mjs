import { readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import { minify } from 'vite';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
let files = 0;
let before = 0;
let after = 0;

async function minifyDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      // Official vendor bytes and their relative worklet/chunk URLs must remain intact.
      if (path !== join(dist, 'vendor')) await minifyDirectory(path);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const source = await readFile(path, 'utf8');
      const inputMap = JSON.parse(await readFile(`${path}.map`, 'utf8'));
      const result = await minify(path, source, {
        module: true,
        compress: {
          target: 'es2022',
          keepNames: { function: true, class: true },
        },
        mangle: { keepNames: true },
        sourcemap: true,
        inputMap,
      });
      if (result.errors.length || !result.map) {
        throw new Error(
          `Unable to minify ${path}: ${JSON.stringify(result.errors)}`,
        );
      }
      result.map.file = basename(path);
      const output = `${result.code}\n//# sourceMappingURL=${basename(path)}.map\n`;
      await writeFile(`${path}.map`, JSON.stringify(result.map));
      await writeFile(path, output);
      files++;
      before += Buffer.byteLength(source);
      after += Buffer.byteLength(output);
    }
  }
}

await minifyDirectory(dist);
console.log(
  `Minified ${files} JavaScript files: ${before} → ${after} bytes (vendor unchanged).`,
);
