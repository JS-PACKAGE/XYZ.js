import { access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import process from 'node:process';

export const packageRoot = fileURLToPath(new URL('../', import.meta.url));
export const engineDirectory = resolve(packageRoot, 'dist');
export const recipeDirectory = fileURLToPath(new URL('./', import.meta.url));
// Published tools consume compiled data; source fallback is only for repository development.
async function data(name) {
  const compiled = new URL(`../dist/src/data/${name}.js`, import.meta.url);
  try {
    await access(compiled);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return import(new URL(`../src/data/${name}.ts`, import.meta.url));
  }
  return import(compiled);
}
export const { assetRecipe } = await data('asset-recipe');
export const { assetLimits } = await data('assets');
export const { modelLimits } = await data('models');
export const { rendering2dLimits } = await data('rendering2d');

export function consumerTool(name) {
  // Tools/codecs remain consumer dev dependencies, never xyz.js runtime dependencies.
  const consumer = createRequire(resolve(process.cwd(), 'package.json'));
  try {
    return consumer.resolve(name);
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    return createRequire(import.meta.url).resolve(name);
  }
}
