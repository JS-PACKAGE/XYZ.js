import { defineConfig } from 'vite';
import process from 'node:process';
const base = process.env.GAME_BASE ?? './';
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
  ],
  build: { target: 'es2022' },
});
