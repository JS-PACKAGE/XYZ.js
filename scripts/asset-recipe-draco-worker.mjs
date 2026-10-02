import {
  Worker,
  parentPort,
  workerData,
  isMainThread,
} from 'node:worker_threads';
import { Buffer } from 'node:buffer';
import { setTimeout, clearTimeout } from 'node:timers';
import { URL } from 'node:url';
import { createDracoAdapter } from './asset-recipe-draco.mjs';
import { verifyFile } from './asset-recipe-codecs.mjs';
import { assetRecipe } from '../src/data/asset-recipe.ts';
export async function createDracoWorkerAdapter(pin, base) {
  if (pin.version !== assetRecipe.dracoVersion)
    throw new Error('Draco version pin must be 1.5.7.');
  const paths = {};
  for (const name of ['decoder', 'decoderWasm', 'encoder', 'encoderWasm'])
    paths[name] = await verifyFile(pin[name], base);
  const run = (operation, asset, settings) =>
    new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL('./asset-recipe-draco-worker.mjs', import.meta.url),
        { workerData: { pin, base, operation, asset, settings } },
      );
      let settled = false;
      const finish = (error, result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.terminate().then(() => {
          if (error) reject(error);
          else {
            asset.document = result.document;
            asset.buffers = result.buffers.map((bytes) => Buffer.from(bytes));
            resolve();
          }
        }, reject);
      };
      const timer = setTimeout(
        () =>
          finish(
            new Error(
              'Official Draco conversion exceeded its finite deadline.',
            ),
          ),
        assetRecipe.codecTimeoutMilliseconds,
      );
      worker.on('message', (result) =>
        result.error
          ? finish(new Error(result.error))
          : finish(undefined, result),
      );
      worker.on('error', (error) => finish(error));
      worker.on('exit', (code) => {
        if (!settled)
          finish(
            new Error(
              `Official Draco worker exited without conversion (code ${code}).`,
            ),
          );
      });
    });
  return {
    paths,
    evidence: {
      version: pin.version,
      files: Object.fromEntries(
        Object.keys(paths).map((name) => [name, pin[name].sha256]),
      ),
    },
    decode: (asset) => run('decode', asset),
    encode: (asset, settings) => run('encode', asset, settings),
  };
}
if (!isMainThread) {
  try {
    const adapter = await createDracoAdapter(
      workerData.pin,
      workerData.base,
      verifyFile,
    );
    const asset = workerData.asset;
    asset.buffers = asset.buffers.map((bytes) => Buffer.from(bytes));
    adapter[workerData.operation](asset, workerData.settings);
    parentPort.postMessage({
      document: asset.document,
      buffers: asset.buffers,
    });
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
}
