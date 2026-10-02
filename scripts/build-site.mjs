import {
  access,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import console from 'node:console';
import process from 'node:process';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL, URL } from 'node:url';
import { build } from 'vite';
import { portableModules } from './site-modules.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const destination = join(root, '.vite/site');
const ownershipFile = '.xyz-site-files.json';
const slash = (path) => path.split(sep).join('/');
const sourceExtensions = /\.(?:[cm]?[jt]sx?|html)$/i;

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function files(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    if (entry.isSymbolicLink())
      throw new Error(
        `Site inputs/output must not contain symlinks: ${directory}/${entry.name}`,
      );
    if (entry.isDirectory())
      result.push(...(await files(join(directory, entry.name), `${name}/`)));
    else if (entry.isFile()) result.push(name);
    else throw new Error(`Unsupported site input: ${directory}/${entry.name}`);
  }
  return result.sort();
}

async function entries() {
  const result = ['index.html', 'examples/index.html'];
  for (const directory of ['examples', 'benchmarks']) {
    const inventory = await files(join(root, directory));
    for (const child of await readdir(join(root, directory), {
      withFileTypes: true,
    })) {
      if (
        child.isDirectory() &&
        !inventory.includes(`${child.name}/index.html`)
      )
        throw new Error(
          `Missing runnable site entry: ${directory}/${child.name}/index.html`,
        );
    }
    result.push(
      ...inventory
        .filter((name) => name.endsWith('.html'))
        .map((name) => `${directory}/${name}`),
    );
  }
  for (const entry of new Set(result)) await access(join(root, entry));
  return [...new Set(result)].sort();
}

async function copyFixtures(stage) {
  for (const directory of ['examples', 'benchmarks']) {
    for (const name of await files(join(root, directory))) {
      if (sourceExtensions.test(name)) continue;
      const output = join(stage, directory, name);
      await mkdir(dirname(output), { recursive: true });
      await cp(join(root, directory, name), output);
    }
  }
  // Vite public assets retain their unbundled relative manifest/image locations.
  const publicDirectory = join(root, 'public');
  if (await exists(publicDirectory)) {
    await files(publicDirectory);
    await cp(publicDirectory, stage, { recursive: true });
  }
  await cp(join(root, 'LICENSE'), join(stage, 'LICENSE'));
  const { soakWorkload } = await import(
    pathToFileURL(join(root, 'dist/src/data/observability.js')).href
  );
  await writeFile(
    join(stage, 'benchmarks/mixed/network.bin'),
    Buffer.alloc(soakWorkload.networkPayloadBytes, 85),
  );
}

async function verifyDist() {
  await access(join(root, 'dist/src/index.js'));
  await files(join(root, 'dist'));
  // A stale/incomplete vendor deployment must fail, not ship a working homepage
  // that breaks only when the audio backend imports its native processor.
  for (const name of await files(join(root, 'vendor/opm'))) {
    const source = await readFile(join(root, 'vendor/opm', name));
    const deployed = await readFile(join(root, 'dist/vendor/opm', name));
    if (!source.equals(deployed))
      throw new Error(
        `Built vendor differs from the official inventory: ${name}. Run pnpm build first.`,
      );
  }
}

async function ensureSafeOutput(path) {
  const segments = slash(relative(root, path)).split('/');
  let cursor = root;
  for (const segment of segments) {
    cursor = join(cursor, segment);
    if ((await exists(cursor)) && (await lstat(cursor)).isSymbolicLink())
      throw new Error(`Refusing to overwrite a symlinked site path: ${cursor}`);
  }
}

async function publishGeneratedFiles(stage) {
  await ensureSafeOutput(destination);
  const manifestPath = join(destination, ownershipFile);
  await ensureSafeOutput(manifestPath);
  let previous = [];
  if (await exists(manifestPath)) {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (
      manifest.generator !== 'xyz-build-site' ||
      !Array.isArray(manifest.files) ||
      manifest.files.some(
        (name) =>
          typeof name !== 'string' ||
          name.startsWith('/') ||
          name.includes('\\') ||
          name
            .split('/')
            .some((part) => part === '..' || part === '' || part === '.'),
      )
    )
      throw new Error(`Invalid site ownership manifest: ${manifestPath}`);
    previous = manifest.files;
  }
  const generated = await files(stage);
  const owned = new Set(previous);
  // Preflight every overwrite before changing the existing site. Never empty an
  // existing output tree: unknown files and even obsolete generated files survive.
  for (const name of generated) {
    const output = join(destination, name);
    await ensureSafeOutput(output);
    if (await exists(output)) {
      if (!owned.has(name))
        throw new Error(
          `Refusing to overwrite an unowned site file: ${output}`,
        );
      if (!(await lstat(output)).isFile())
        throw new Error(
          `Generated site file was replaced by a directory: ${output}`,
        );
    }
  }
  await mkdir(destination, { recursive: true });
  for (const name of generated) {
    const output = join(destination, name);
    await mkdir(dirname(output), { recursive: true });
    await cp(join(stage, name), output);
  }
  await writeFile(
    manifestPath,
    JSON.stringify(
      {
        generator: 'xyz-build-site',
        files: [...new Set([...previous, ...generated])].sort(),
      },
      null,
      2,
    ) + '\n',
  );
}

async function buildDocumentation(stage) {
  const { version } = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8'),
  );
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
    throw new Error('Invalid documentation package version.');
  const { Application } = await import('typedoc');
  const application = await Application.bootstrapWithPlugins({
    options: join(root, 'typedoc.json'),
    out: join(stage, 'api', version),
    name: `XYZ.js API v${version}`,
  });
  const project = await application.convert();
  if (!project) throw new Error('TypeDoc failed to convert the public API.');
  application.validate(project);
  if (application.logger.hasErrors())
    throw new Error('TypeDoc API validation failed.');
  await application.generateDocs(project, join(stage, 'api', version));
  if (application.logger.hasErrors())
    throw new Error('TypeDoc failed to generate the API portal.');
  await access(join(stage, 'api', version, 'index.html'));
  await access(join(stage, 'api', version, 'assets/search.js'));
  const examplesLink = docsOnly
    ? 'https://github.com/YueyuHoshizora/XYZ.js/tree/main/examples'
    : '../examples/index.html';
  const portal = (apiLink) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>XYZ.js documentation · v${version}</title></head>
<body><main><h1>XYZ.js documentation · v${version}</h1>
<p><a href="${apiLink}">Current contracts and searchable public API v${version}</a></p>
<p>目前契約與 API 搜尋 · 現在の契約と API 検索</p>
<p>Browser runtime profiles, ownership, abort and cleanup are documented with the root exports.
Historical acceptance is not a current capability or physical qualification claim.</p>
<p><a href="https://github.com/YueyuHoshizora/XYZ.js/blob/main/ACCEPTANCE.md">Historical acceptance and unverified limits</a></p>
<p><a href="${examplesLink}">Examples</a></p></main></body></html>
`;
  await mkdir(join(stage, 'docs'), { recursive: true });
  await writeFile(
    join(stage, 'docs/index.html'),
    portal(`../api/${version}/index.html`),
  );
  await writeFile(
    join(stage, 'api/index.html'),
    portal(`./${version}/index.html`),
  );
  return version;
}

const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--docs-only') || args.length > 1)
  throw new Error('Usage: node scripts/build-site.mjs [--docs-only]');
const docsOnly = args.includes('--docs-only');
const input = docsOnly ? [] : await entries();
if (!docsOnly) await verifyDist();
await ensureSafeOutput(join(root, '.vite'));
await mkdir(join(root, '.vite'), { recursive: true });
const stage = await mkdtemp(join(root, '.vite/site-build-'));
try {
  const documentationVersion = await buildDocumentation(stage);
  if (!docsOnly) {
    await build({
      configFile: false,
      root,
      base: './',
      publicDir: false,
      cacheDir: join(stage, '.cache'),
      plugins: [portableModules(root)],
      worker: { format: 'es', plugins: () => [portableModules(root)] },
      build: {
        target: 'es2022',
        outDir: stage,
        emptyOutDir: false,
        assetsInlineLimit: 0,
        sourcemap: false,
        rolldownOptions: { input: input.map((name) => join(root, name)) },
      },
    });
    for (const entry of input) await access(join(stage, entry));
    const homepage = join(stage, 'index.html');
    const html = await readFile(homepage, 'utf8');
    await writeFile(
      homepage,
      html.replace(
        /<body\b[^>]*>/i,
        '$&<nav aria-label="Documentation"><a href="./docs/index.html">Current contracts / searchable API</a></nav>',
      ),
    );
    for (const name of await files(stage)) {
      if (!/\.[cm]?js$/.test(name)) continue;
      const code = await readFile(join(stage, name), 'utf8');
      if (
        code.includes('__XYZ_SITE_ENGINE__') ||
        code.includes('__XYZ_SITE_PATH_')
      )
        throw new Error(
          `Unresolved deployment URL in generated module: ${name}`,
        );
    }
    const vendorRoot = join(root, 'dist/vendor/opm');
    const canonicalVendor = new Set(['']);
    for (const name of await files(join(root, 'vendor/opm'))) {
      canonicalVendor.add(name);
      let directory = dirname(name);
      while (directory !== '.') {
        canonicalVendor.add(slash(directory));
        directory = dirname(directory);
      }
    }
    await cp(join(root, 'dist'), join(stage, 'engine'), {
      recursive: true,
      // Local numbered copies remain untouched but are not official deployment files.
      filter: (path) => {
        const name = slash(relative(vendorRoot, path));
        return (
          name === '..' || name.startsWith('../') || canonicalVendor.has(name)
        );
      },
    });
    await copyFixtures(stage);
    await writeFile(
      join(stage, 'site-entries.json'),
      JSON.stringify(input, null, 2) + '\n',
    );
  }
  await publishGeneratedFiles(stage);
  console.log(
    `Built ${input.length} example HTML entries and searchable API v${documentationVersion} in .vite/site.`,
  );
} finally {
  await rm(stage, { recursive: true, force: true });
}
