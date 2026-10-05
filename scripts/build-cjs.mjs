import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import { build, parseSync } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const slash = (path) => path.split(sep).join('/');

function visit(node, callback) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') callback(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) visit(child, callback);
    } else if (value && typeof value === 'object') visit(value, callback);
  }
}

// CJS modules mirror the engine tree, but workers and the official OPM backend
// remain ESM. Anchor URLs to those original installed modules, not the CJS tree.
export function cjsModuleURLs(dist, output) {
  return {
    name: 'xyz-cjs-native-module-urls',
    enforce: 'pre',
    transform(code, id) {
      if (!code.includes('import.meta')) return;
      const modulePath = relative(dist, id);
      if (
        modulePath.startsWith('..') ||
        slash(modulePath).startsWith('vendor/')
      )
        throw new Error(
          `CJS build must not transform outside engine dist: ${id}`,
        );
      const parsed = parseSync(id, code);
      if (parsed.errors.length)
        throw new Error(
          `Cannot parse CJS input ${id}: ${parsed.errors[0].message}`,
        );
      const edits = [];
      let base = '__xyzOriginalModuleURL';
      while (code.includes(base)) base += '_';
      visit(parsed.program, (node) => {
        if (
          node.type === 'MemberExpression' &&
          !node.computed &&
          node.property?.name === 'url' &&
          node.object?.type === 'MetaProperty' &&
          node.object.meta?.name === 'import' &&
          node.object.property?.name === 'meta'
        )
          edits.push({ start: node.start, end: node.end });
      });
      if (!edits.length) return;
      for (const edit of edits.sort((a, b) => b.start - a.start))
        code = code.slice(0, edit.start) + base + code.slice(edit.end);
      const original = slash(relative(dirname(join(output, modulePath)), id));
      return {
        code: `const ${base} = require('node:url').pathToFileURL(require('node:path').resolve(__dirname, ${JSON.stringify(original)})).href;\n${code}`,
        map: null,
      };
    },
  };
}

export async function buildCJS(directory = root) {
  const dist = join(directory, 'dist');
  const output = join(dist, 'cjs');
  const result = await build({
    configFile: false,
    root: directory,
    publicDir: false,
    plugins: [cjsModuleURLs(dist, output)],
    build: {
      ssr: true,
      target: 'es2022',
      outDir: output,
      emptyOutDir: true,
      copyPublicDir: false,
      sourcemap: true,
      minify: false,
      rolldownOptions: {
        input: { 'src/index': join(dist, 'src/index.js') },
        preserveEntrySignatures: 'strict',
        external: (id) => id.startsWith('node:'),
        output: {
          format: 'cjs',
          exports: 'named',
          preserveModules: true,
          preserveModulesRoot: dist,
          entryFileNames: '[name].cjs',
          chunkFileNames: '[name].cjs',
          // Internal backends stay asynchronous and separate; the native vendor
          // URL import is never changed into require() of an ESM worklet tree.
          dynamicImportInCjs: true,
        },
      },
    },
  });
  await mkdir(join(output, 'src'), { recursive: true });
  await writeFile(
    join(output, 'src/index.d.cts'),
    'export * from "../../src/index.js";\n',
  );
  const outputs = new Set(
    (Array.isArray(result) ? result : [result]).flatMap((item) =>
      item.output.flatMap((entry) => {
        const path = `dist/cjs/${entry.fileName}`;
        return entry.type === 'chunk' && entry.map
          ? [path, `${path}.map`]
          : [path];
      }),
    ),
  );
  outputs.add('dist/cjs/src/index.d.cts');
  return [...outputs].sort();
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const outputs = await buildCJS();
  console.log(
    `Built ${outputs.length} CJS distribution files (ESM/vendor unchanged).`,
  );
}
