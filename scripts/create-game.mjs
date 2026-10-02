#!/usr/bin/env node
import {
  cp,
  mkdir,
  readdir,
  readFile,
  lstat,
  writeFile,
} from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectPackage } from './starter-package.mjs';
import process from 'node:process';
import console from 'node:console';

const usage =
  'Usage: node scripts/create-game.mjs <destination> --template <2d|3d> --package <xyz.js.tgz|built-package-directory> [--name <package-name>]';
export async function createGame(args) {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 13))
    throw new Error('Node 22.13 or newer is required.');
  if (args.length === 1 && args[0] === '--help') {
    console.log(usage);
    return;
  }
  let destination,
    template,
    packagePath,
    name = 'xyz-game';
  const seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const argument = args[i];
    if (!argument.startsWith('-')) {
      if (destination) throw new Error(`Unexpected argument: ${argument}`);
      destination = argument;
      continue;
    }
    if (
      !['--template', '--package', '--name'].includes(argument) ||
      seen.has(argument)
    )
      throw new Error(`Unknown or repeated flag: ${argument}`);
    seen.add(argument);
    const value = args[++i];
    if (!value || value.startsWith('-'))
      throw new Error(`Missing value for ${argument}`);
    if (argument === '--template') template = value;
    if (argument === '--package') packagePath = value;
    if (argument === '--name') name = value;
  }
  if (!destination || !['2d', '3d'].includes(template) || !packagePath)
    throw new Error(usage);
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(name) || name.length > 214)
    throw new Error('Name must be a lowercase unscoped package name.');
  const target = resolve(destination);
  try {
    const existing = await lstat(target);
    if (
      existing.isSymbolicLink() ||
      !existing.isDirectory() ||
      (await readdir(target)).length
    )
      throw new Error(
        'Destination must be absent or an empty real directory; nothing is overwritten.',
      );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const source = resolve(packagePath);
  const packageInfo = await inspectPackage(source);
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  await mkdir(target, { recursive: true });
  if ((await readdir(target)).length)
    throw new Error('Destination became nonempty; nothing is overwritten.');
  const templatePath = join(root, 'starters', template);
  for (const entry of await readdir(templatePath))
    await cp(join(templatePath, entry), join(target, entry), {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
  await cp(
    join(root, 'scripts/offline-deployment.mjs'),
    join(target, 'scripts/offline-deployment.mjs'),
    { errorOnExist: true, force: false },
  );
  await cp(join(root, 'scripts/offline'), join(target, 'scripts/offline'), {
    recursive: true,
    errorOnExist: true,
    force: false,
  });
  await cp(
    join(root, 'scripts/deployment-server.mjs'),
    join(target, 'scripts/deployment-server.mjs'),
    { errorOnExist: true, force: false },
  );
  await mkdir(join(target, 'vendor'), { recursive: true });
  const dependency = packageInfo.directory
    ? 'vendor/xyz.js'
    : 'vendor/xyz.js.tgz';
  if (packageInfo.directory) {
    await mkdir(join(target, dependency));
    await cp(join(source, 'dist'), join(target, dependency, 'dist'), {
      recursive: true,
    });
    await writeFile(
      join(target, dependency, 'package.json'),
      JSON.stringify(packageInfo.manifest, null, 2) + '\n',
    );
    try {
      await cp(join(source, 'LICENSE'), join(target, dependency, 'LICENSE'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  } else await cp(source, join(target, dependency));
  const manifestPath = join(target, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.name = name;
  manifest.dependencies['xyz.js'] = `file:${dependency}`;
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    `Created ${template} game at ${target}\nNext: pnpm --dir "${target}" install && pnpm --dir "${target}" dev\nBuild: pnpm --dir "${target}" build\nNo install, publish, or external command was run.`,
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  createGame(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
