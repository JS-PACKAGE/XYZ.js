import { Buffer } from 'node:buffer';
import { dirname, join, relative, resolve, sep, posix } from 'node:path';
import { parseSync } from 'vite';

const engineID = '__XYZ_SITE_ENGINE__';
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

function importMetaURL(node) {
  return (
    node?.type === 'MemberExpression' &&
    !node.computed &&
    node.property?.name === 'url' &&
    node.object?.type === 'MetaProperty' &&
    node.object.meta?.name === 'import' &&
    node.object.property?.name === 'meta'
  );
}

function pathMarker(path) {
  return `__XYZ_SITE_PATH_${Buffer.from(path).toString('hex')}__`;
}

function relativeURL(from, to) {
  const path = posix.relative(posix.dirname(from), to);
  return path.startsWith('.') ? path : `./${path}`;
}

// Consumer code is bundled; the engine is deliberately not. Its unchanged module
// locations are part of the native backend/vendor/worklet deployment contract.
export function portableModules(root) {
  return {
    name: 'xyz-portable-public-engine',
    enforce: 'pre',
    resolveId(source, importer) {
      if (source === 'xyz.js' || source === engineID)
        return { id: engineID, external: true };
      const clean = source.split('?')[0];
      const candidate =
        clean === '/src/index.js' || clean === '/src/index.ts'
          ? join(root, clean.slice(1))
          : clean.startsWith('.') && importer
            ? resolve(dirname(importer.split('?')[0]), clean)
            : clean;
      if (
        candidate === join(root, 'src/index.js') ||
        candidate === join(root, 'src/index.ts') ||
        candidate === join(root, 'dist/src/index.js')
      )
        return { id: engineID, external: true };
    },
    transform(code, id) {
      const source = slash(relative(root, id.split('?')[0]));
      if (
        !/^(?:examples|benchmarks)\//.test(source) ||
        !/\.[cm]?[jt]sx?$/.test(source) ||
        id.includes('?') ||
        source === 'examples/index.ts' ||
        !code.includes('import.meta')
      )
        return;
      const parsed = parseSync(id, code);
      if (parsed.errors.length)
        throw new Error(
          `Cannot parse site consumer ${source}: ${parsed.errors[0].message}`,
        );
      const edits = [];
      const workers = new Map();
      let baseName = '__xyzSiteSourceURL';
      while (code.includes(baseName)) baseName += '_';
      let needsBase = false;
      visit(parsed.program, (node) => {
        if (
          node.type !== 'NewExpression' ||
          node.callee?.name !== 'URL' ||
          !importMetaURL(node.arguments[1])
        )
          return;
        const asset = node.arguments[0];
        const worker =
          asset?.type === 'Literal' &&
          typeof asset.value === 'string' &&
          /\.worker\.[cm]?[jt]s$/.test(asset.value);
        if (worker) {
          let name = workers.get(asset.value);
          if (!name) {
            name = `${baseName}Worker${workers.size}`;
            workers.set(asset.value, name);
          }
          // Both pool.moduleURL and workerFactory must refer to the same emitted
          // module, never a raw TypeScript asset or a window-only import map.
          edits.push({ start: asset.start, end: asset.end, text: name });
        } else {
          needsBase = true;
          const base = node.arguments[1];
          edits.push({ start: base.start, end: base.end, text: baseName });
        }
      });
      if (!edits.length) return;
      for (const edit of edits.sort((a, b) => b.start - a.start))
        code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
      const imports = [...workers]
        .map(
          ([path, name]) =>
            `import ${name} from ${JSON.stringify(`${path}?worker&url`)};`,
        )
        .join('\n');
      // Preserve source-relative URL semantics, including dynamic query strings
      // and formats whose manifests refer to neighboring assets (GLTF/Tiled).
      const base = needsBase
        ? `const ${baseName} = new URL(/* @vite-ignore */ ${JSON.stringify(pathMarker(source))}, import.meta.url).href;\n`
        : '';
      return { code: `${imports}\n${base}${code}`, map: null };
    },
    renderChunk(code, chunk) {
      const transformed = code
        .replace(/(["'])__XYZ_SITE_ENGINE__\1/g, () =>
          JSON.stringify(relativeURL(chunk.fileName, 'engine/src/index.js')),
        )
        .replace(
          /(["'])__XYZ_SITE_PATH_([a-f0-9]+)__\1/g,
          (_, _quote, encoded) =>
            JSON.stringify(
              relativeURL(
                chunk.fileName,
                Buffer.from(encoded, 'hex').toString(),
              ),
            ),
        );
      if (transformed !== code) return { code: transformed, map: null };
    },
  };
}
