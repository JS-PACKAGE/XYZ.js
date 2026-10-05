import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, symlink, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';
import { promisify } from 'node:util';
import { describe, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const execute = promisify(execFile);

describe('built root consumer distribution (run pnpm build first)', () => {
  it('shares canonical class types between NodeNext require and ESM import consumers', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'xyz-cjs-types-'));
    try {
      await mkdir(join(directory, 'node_modules'));
      await symlink(root, join(directory, 'node_modules/xyz.js'), 'dir');
      await writeFile(join(directory, 'package.json'), '{"type":"module"}\n');
      await writeFile(
        join(directory, 'consumer.cts'),
        `
import XYZ = require('xyz.js');
import type { Vector3 as ImportedVector, Game as ImportedGame } from 'xyz.js' with { 'resolution-mode': 'import' };
const vector: ImportedVector = new XYZ.Vector3(3, 4, 0);
const same: XYZ.Vector3 = vector;
declare const requiredGame: XYZ.Game;
const importedGame: ImportedGame = requiredGame;
const back: XYZ.Game = importedGame;
void same; void back;
`,
      );
      await writeFile(
        join(directory, 'consumer.mts'),
        `
import { Vector3, type Game } from 'xyz.js';
import type { Vector3 as RequiredVector, Game as RequiredGame } from 'xyz.js' with { 'resolution-mode': 'require' };
const required: RequiredVector = new Vector3(3, 4, 0);
declare const importedGame: Game;
const requiredGame: RequiredGame = importedGame;
void required; void requiredGame;
`,
      );
      await execute(
        process.execPath,
        [
          require.resolve('typescript/bin/tsc'),
          '--noEmit',
          '--strict',
          '--skipLibCheck',
          '--target',
          'ES2022',
          '--module',
          'NodeNext',
          '--moduleResolution',
          'NodeNext',
          join(directory, 'consumer.cts'),
          join(directory, 'consumer.mts'),
        ],
        { cwd: directory },
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
