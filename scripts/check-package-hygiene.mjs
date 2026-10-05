#!/usr/bin/env node
import { Buffer } from 'node:buffer';
import { spawn } from 'node:child_process';
import {
  copyFile,
  chmod,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import console from 'node:console';
import {
  approvedPackageFiles,
  approvedPackagePatterns,
  inspectApprovedArchive,
} from './package-inventory.mjs';
import { verifyDistribution } from './check-distribution.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const usage =
  'Usage: node scripts/check-package-hygiene.mjs [--output directory] [--archive package.tgz] | --print-files';
async function command(binary, args, cwd, logPath) {
  const chunks = [];
  // Windows .cmd shims cannot be spawned directly; invoke npm's bundled JS
  // entry point without a shell so archive/output paths remain literal arguments.
  if (binary === 'npx' && process.platform === 'win32') {
    args = [
      join(dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js'),
      ...args,
    ];
    binary = process.execPath;
  }
  const child = spawn(binary, args, {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => chunks.push(chunk));
  child.stderr.on('data', (chunk) => chunks.push(chunk));
  const code = await new Promise((accept, reject) => {
    child.once('error', reject);
    child.once('close', accept);
  });
  await writeFile(logPath, Buffer.concat(chunks));
  if (code !== 0)
    throw new Error(
      `${binary} ${args.join(' ')} exited ${code}; see ${logPath}`,
    );
  return Buffer.concat(chunks).toString('utf8');
}
async function pack(cwd, destination, log) {
  await mkdir(destination, { recursive: true });
  await command(
    'npx',
    ['--yes', 'pnpm@12.6.0', 'pack', '--pack-destination', destination],
    cwd,
    log,
  );
  const archives = (await readdir(destination)).filter((path) =>
    path.endsWith('.tgz'),
  );
  if (archives.length !== 1)
    throw new Error(`Expected one actual pnpm pack archive in ${destination}.`);
  return join(destination, archives[0]);
}
async function copyApproved(root, destination, inventory) {
  for (const path of approvedPackageFiles(inventory)) {
    const source = join(root, path);
    const parts = path.split('/');
    for (let count = 1; count <= parts.length; count++) {
      if ((await lstat(join(root, ...parts.slice(0, count)))).isSymbolicLink())
        throw new Error(`Approved source contains symlink: ${path}`);
    }
    const target = join(destination, path);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(source, target);
    await chmod(target, (await lstat(source)).mode & 0o777);
  }
  // These are exclusion inputs, not shipped game source. Never copy caches or credentials.
  for (const path of ['starters/2d/.npmignore', 'starters/3d/.npmignore']) {
    await copyFile(join(root, path), join(destination, path));
  }
}
async function contaminate(directory) {
  const paths = [
    'node_modules/.vite/deps/_metadata.json',
    '.vite/site/secret.js',
    '.cache/build.js',
    'coverage/lcov.info',
    '.DS_Store',
    'debug.log',
    'unreviewed.tgz',
    'tests/unreviewed.test.js',
    'docs/unreviewed.md',
    'scripts/unreviewed.mjs',
    'scripts/offline/unreviewed.js',
    'scripts/offline/.cache/unreviewed.js',
    'dist/src/unreviewed.js',
    'dist/src/.vite/deps/unreviewed.js',
    'dist/src/node_modules/unreviewed.js',
    'dist/src/debug.log',
    'dist/packages/core/src/unreviewed.d.ts',
    'dist/packages/.cache/unreviewed.js',
  ];
  for (const kind of ['2d', '3d']) {
    for (const path of [
      'node_modules/.vite/deps/_metadata.json',
      'node_modules/.vite/deps/package.json',
      'node_modules/.vite/deps/engine.js',
      '.vite/deps/engine.js',
      'dist/assets/engine.js',
      '.cache/generated.js',
      'coverage/lcov.info',
      'debug.log',
      '.DS_Store',
      'unreviewed.js',
      'src/unreviewed.ts',
      'public/unreviewed.json',
    ])
      paths.push(`starters/${kind}/${path}`);
  }
  for (const path of paths) {
    const target = join(directory, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(
      target,
      'Disposable unapproved contamination. Never ship.\n',
    );
  }
  return paths;
}
function sameApprovedArchive(left, right) {
  for (const [path, entry] of left.files) {
    const other = right.files.get(path);
    if (
      !other ||
      !entry.content.equals(other.content) ||
      entry.executable !== other.executable
    )
      throw new Error(
        `Clean/dirty package contents or executable permission differ: ${path}`,
      );
  }
}
async function smoke(archive, inspected, workspace, output) {
  const extracted = join(workspace, 'extracted');
  await mkdir(extracted);
  for (const [path, entry] of inspected.files) {
    const target = join(extracted, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, entry.content, {
      mode: entry.executable ? 0o755 : 0o644,
    });
  }
  const distribution = await verifyDistribution(extracted);
  await writeFile(
    join(output, 'packed-root.log'),
    JSON.stringify(distribution, null, 2) + '\n',
  );
  const bins = [];
  for (const [name, path] of Object.entries(inspected.manifest.bin ?? {})) {
    await command(
      process.execPath,
      [join(extracted, path), '--help'],
      extracted,
      join(output, `${name}-help.log`),
    );
    bins.push(name);
  }
  const starters = [];
  for (const kind of ['2d', '3d']) {
    const destination = join(workspace, `consumer-${kind}`);
    await command(
      process.execPath,
      [
        join(extracted, 'scripts/create-game.mjs'),
        destination,
        '--template',
        kind,
        '--package',
        archive,
      ],
      extracted,
      join(output, `${kind}-create.log`),
    );
    const manifest = JSON.parse(
      await readFile(join(destination, 'package.json'), 'utf8'),
    );
    if (manifest.dependencies?.['xyz.js'] !== 'file:vendor/xyz.js.tgz')
      throw new Error(
        `Packaged ${kind} starter has no local archive dependency.`,
      );
    for (const [path, entry] of inspected.files) {
      const prefix = `starters/${kind}/`;
      if (path.startsWith(prefix) && path !== `${prefix}package.json`) {
        if (
          !entry.content.equals(
            await readFile(join(destination, path.slice(prefix.length))),
          )
        )
          throw new Error(`Packaged ${kind} starter source changed: ${path}`);
      }
    }
    if (
      !(await readFile(join(destination, 'vendor/xyz.js.tgz'))).equals(
        await readFile(archive),
      )
    )
      throw new Error(
        `Packaged ${kind} starter archive is not byte-identical.`,
      );
    starters.push({
      template: kind,
      source: 'actual extracted CLI',
      dependency: 'byte-identical local archive',
    });
  }
  return {
    bins,
    starters,
    distribution,
    scope:
      'Archive extraction and actual CLI/root runtime; full installed production/browser gameplay is the separate smoke:starters gate.',
  };
}
export async function checkPackageHygiene(args) {
  const inventory = JSON.parse(
    await readFile(join(root, 'scripts/package-inventory.json'), 'utf8'),
  );
  if (args.length === 1 && args[0] === '--print-files') {
    console.log(JSON.stringify(approvedPackagePatterns(inventory), null, 2));
    return;
  }
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage);
    return;
  }
  let archive;
  let outputRoot = join(root, '.vite/package-hygiene');
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (
      !['--output', '--archive'].includes(flag) ||
      seen.has(flag) ||
      !args[index + 1] ||
      args[index + 1].startsWith('-')
    )
      throw new Error(usage);
    seen.add(flag);
    const value = resolve(args[++index]);
    if (flag === '--output') outputRoot = value;
    else archive = value;
  }
  await mkdir(outputRoot, { recursive: true });
  const output = await mkdtemp(join(outputRoot, 'run-'));
  const workspace = await mkdtemp(join(tmpdir(), 'xyz-package-hygiene-'));
  const report = {
    status: 'failed',
    node: process.version,
    packageManager: 'pnpm@12.6.0',
    inventory: 'scripts/package-inventory.json',
    archives: [],
    output,
  };
  try {
    const version = await command(
      'npx',
      ['--yes', 'pnpm@12.6.0', '--version'],
      root,
      join(output, 'pnpm-version.log'),
    );
    if (version.trim() !== '12.6.0')
      throw new Error('Package gate requires actual pnpm 12.6.0.');
    const actual =
      archive ??
      (await pack(
        root,
        join(output, 'actual'),
        join(output, 'actual-pack.log'),
      ));
    const inspected = await inspectApprovedArchive(actual, inventory, root);
    report.archives.push({
      kind: 'actual',
      path: actual,
      sha256: inspected.sha256,
    });
    if (!archive) {
      const cleanRoot = join(workspace, 'clean');
      const dirtyRoot = join(workspace, 'dirty');
      await copyApproved(root, cleanRoot, inventory);
      await copyApproved(root, dirtyRoot, inventory);
      report.pollution = await contaminate(dirtyRoot);
      const cleanArchive = await pack(
        cleanRoot,
        join(output, 'clean'),
        join(output, 'clean-pack.log'),
      );
      const dirtyArchive = await pack(
        dirtyRoot,
        join(output, 'dirty'),
        join(output, 'dirty-pack.log'),
      );
      const clean = await inspectApprovedArchive(cleanArchive, inventory, root);
      const dirty = await inspectApprovedArchive(dirtyArchive, inventory, root);
      sameApprovedArchive(inspected, clean);
      sameApprovedArchive(clean, dirty);
      report.archives.push(
        { kind: 'clean', path: cleanArchive, sha256: clean.sha256 },
        { kind: 'dirty', path: dirtyArchive, sha256: dirty.sha256 },
      );
      report.cleanDirty =
        'Identical approved paths, every content byte and executable flags; identical source built outputs and pinned packing toolchain, no rebuilding.';
    }
    report.smoke = await smoke(actual, inspected, workspace, output);
    report.approved = [...inspected.files].map(([path, entry]) => ({
      path,
      bytes: entry.content.length,
      sha256: entry.sha256,
      executable: entry.executable,
    }));
    report.status = 'passed';
    console.log(`PACKAGE_HYGIENE_OK ${join(output, 'report.json')}`);
  } catch (error) {
    report.error = error.message;
    throw error;
  } finally {
    await writeFile(
      join(output, 'report.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
    await rm(workspace, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  checkPackageHygiene(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
