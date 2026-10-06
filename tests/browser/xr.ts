import { XRSessionManager, type Game } from '../../src/index.js';

/** Surface probe only: no physical headset/runtime or immersive rendering certification. */
export async function probeXR(game: Game) {
  const manager = new XRSessionManager(game);
  try {
    const supported = await manager.isSessionSupported('immersive-vr');
    if (typeof supported !== 'boolean')
      throw new Error('WebXR support query did not return a boolean.');
    const exists = 'xr' in navigator;
    if (!exists && supported)
      throw new Error('WebXR reports support without navigator.xr.');
    if (game.graphics.backend === 'canvas2d') {
      let rejected = false;
      try {
        await manager.requestSession('immersive-vr');
      } catch (error) {
        rejected = error instanceof Error && error.message.includes('Canvas2D');
      }
      if (!rejected)
        throw new Error('Canvas2D immersive session must reject explicitly.');
    }
    return {
      navigatorXR: exists,
      immersiveVRSupported: supported,
      immersiveRuntime: 'BLOCKED: no physical headset/runtime used',
      xrGpuBinding: 'XRGPUBinding' in globalThis,
    };
  } finally {
    manager.destroy();
  }
}
