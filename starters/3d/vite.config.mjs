import { defineConfig } from 'vite';
import process from 'node:process';
import { resolve } from 'node:path';
import { prepareDeployment } from './scripts/offline-deployment.mjs';
const base = process.env.GAME_BASE ?? './';
let output;
if (
  base !== './' &&
  (!base.startsWith('/') ||
    !base.endsWith('/') ||
    base.includes('..') ||
    base.includes('?') ||
    base.includes('#'))
)
  throw new Error(
    'GAME_BASE must be ./ or an absolute deployment path ending in /.',
  );
export default defineConfig({
  base,
  optimizeDeps: { exclude: ['xyz.js'] },
  plugins: [
    {
      name: 'preserve-engine-module-layout',
      enforce: 'pre',
      resolveId(source) {
        if (source === 'xyz.js')
          return {
            id:
              base === './'
                ? '../engine/src/index.js'
                : base + 'engine/src/index.js',
            external: true,
          };
      },
    },
    {
      name: 'strict-csp-offline-deployment',
      apply: 'build',
      configResolved(config) {
        output = resolve(config.root, config.build.outDir);
      },
      async closeBundle() {
        await prepareDeployment(output, {
          offline: process.env.GAME_OFFLINE === '1',
        });
      },
    },
  ],
  build: { target: 'es2022' },
});
