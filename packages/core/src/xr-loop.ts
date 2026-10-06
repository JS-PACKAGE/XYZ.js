import type { Game } from './game.js';
import type { Scene } from './scene.js';

export interface XRLoopDriver {
  tick?: (timestamp: number) => void;
  render(scene: Scene | undefined): void;
  destroy(): void;
}
export const xrLoops = new WeakMap<Game, XRLoopDriver>();
export function requestGameFrame(
  game: Game,
  callback: FrameRequestCallback,
): number | undefined {
  const xr = xrLoops.get(game);
  if (xr) {
    xr.tick = callback;
    return undefined;
  }
  return requestAnimationFrame(callback);
}
