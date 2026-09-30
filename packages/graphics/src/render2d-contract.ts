import type { Scene } from '../../core/src/scene.js';
import { Sprite } from '../../core/src/sprite.js';
import type { GraphicsBackend } from './index.js';
import type { ColorRGBA } from '../../core/src/gameplay/contracts.js';
import { TileMap, IsometricMap } from '../../core/src/maps2d/index.js';
import { compareObjects2D } from '../../core/src/gameplay/contracts.js';

export interface RenderSnapshot {
  readonly backend: GraphicsBackend;
  readonly width: number;
  readonly height: number;
  readonly destroyed: boolean;
  destroy(): void;
}
export interface TransitionFrame {
  kind: 'fade' | 'crossfade' | 'slide';
  progress: number;
  snapshot?: RenderSnapshot;
  color: ColorRGBA;
  direction: 'left' | 'right' | 'up' | 'down';
}
export interface FrameEffects {
  transition?: TransitionFrame;
}

/** Shared, allocation-free collection in logical pixels with conservative affine culling. */
export function collectSprites2D(
  scene: Scene,
  width: number,
  height: number,
  out: Sprite[],
): void {
  out.length = 0;
  const camera = scene.camera2D;
  for (const object of scene.objects) {
    if (object instanceof TileMap || object instanceof IsometricMap)
      object.updateCulling(camera, width, height);
  }
  for (const object of scene.objects) {
    if (
      !(object instanceof Sprite) ||
      !object.renderEnabled ||
      !object.worldVisible ||
      object.worldOpacity <= 0 ||
      object.texture.destroyed ||
      object.worldTint[3] <= 0
    )
      continue;
    const matrix = object.updateWorldMatrix().elements;
    const screen = object.worldSpace === 'screen';
    const zoom = screen ? 1 : camera.zoom;
    const offsetX = screen
      ? 0
      : -camera.position.x * zoom + camera.renderOffset.x;
    const offsetY = screen
      ? 0
      : -camera.position.y * zoom + camera.renderOffset.y;
    const left = -object.anchor.x * object.width;
    const top = -object.anchor.y * object.height;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let corner = 0; corner < 4; corner++) {
      const x = left + (corner & 1 ? object.width : 0);
      const y = top + (corner & 2 ? object.height : 0);
      const px = (matrix[0] * x + matrix[3] * y + matrix[6]) * zoom + offsetX;
      const py = (matrix[1] * x + matrix[4] * y + matrix[7]) * zoom + offsetY;
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
    if (
      maxX < 0 ||
      maxY < 0 ||
      minX > width ||
      minY > height ||
      !Number.isFinite(minX + minY + maxX + maxY)
    )
      continue;
    out.push(object);
  }
  // Stable sort retains Scene registration order for equal world z in each space.
  out.sort(compareObjects2D);
}
