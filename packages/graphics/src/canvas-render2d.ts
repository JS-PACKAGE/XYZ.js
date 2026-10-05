import type { Scene } from '../../core/src/scene.js';
import type { GameObject } from '../../core/src/game-object.js';
import type { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import { TilingSprite2D } from '../../core/src/graphics2d/tiling-sprite2d.js';
import { Matrix3 } from '../../math/src/index.js';
import { rendering2dLimits } from '../../../src/data/rendering2d.js';
import { RenderCommandBuffer2D } from './render2d-contract.js';
import {
  createTextureQuad2D,
  getSpriteQuad2D,
  getTextureQuad2D,
  getRelativeAppearance2D,
} from './sprite-instance.js';
import { CanvasSpriteSource } from './canvas-sprite-source.js';
import { UnsupportedGraphicsError } from './errors.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';

import type { FrameStats } from './render-stats.js';
const zeroBounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };
const white = new Float32Array([1, 1, 1, 1]);
const modes: Record<string, GlobalCompositeOperation> = {
  normal: 'source-over',
  add: 'lighter',
  multiply: 'multiply',
  screen: 'screen',
  erase: 'destination-out',
};
interface LayerPixels {
  canvas: HTMLCanvasElement;
  bounds: Rect2D;
  version: number;
}
export class CanvasRender2D {
  private readonly caches = new Map<IsolatedGroup2D, LayerPixels>();
  private readonly canvasBytes = new Map<HTMLCanvasElement, number>();
  private readonly quad = createTextureQuad2D();
  private readonly appearance = new Float32Array(4);
  private readonly matrix = new Matrix3();
  private readonly inverses = new WeakMap<IsolatedGroup2D, Matrix3>();
  private readonly product = new Matrix3();
  private readonly tile = document.createElement('canvas');
  private readonly tinted = document.createElement('canvas');
  private readonly maskCanvas = document.createElement('canvas');
  private tileMatrix: DOMMatrix | undefined;
  private readonly paths = new WeakMap<object, Path2D>();
  constructor(
    readonly sources: CanvasSpriteSource,
    readonly stats: FrameStats,
  ) {}

  /** RGBA backing-store estimates exclude browser/driver overhead. */
  resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): void {
    const previous = this.canvasBytes.get(canvas) ?? 0;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const bytes = width * height * 4;
    this.canvasBytes.set(canvas, bytes);
    this.stats.target(bytes - previous);
  }

  releaseCanvas(canvas: HTMLCanvasElement): void {
    const bytes = this.canvasBytes.get(canvas);
    if (bytes !== undefined) {
      this.stats.target(-bytes);
      this.canvasBytes.delete(canvas);
    }
    canvas.width = canvas.height = 1;
  }
  preflight(commands: RenderCommandBuffer2D, depth = 0): void {
    if (depth > rendering2dLimits.layerDepth)
      throw new RangeError('Canvas2D layer depth exceeds budget.');
    for (const command of commands.items) {
      if (command.kind === 'mesh')
        throw new UnsupportedGraphicsError(
          'Canvas2D does not support visible Mesh2D.',
        );
      if (command.kind === 'sprite' && command.object.material)
        throw new UnsupportedGraphicsError(
          'Canvas2D does not support native Sprite materials.',
        );
      if (
        command.kind === 'sprite' &&
        (command.object.lighting || command.object.normalTexture)
      )
        throw new UnsupportedGraphicsError(
          'Canvas2D does not support native Lighting2D; select WebGPU or WebGL2.',
        );
      if (command.kind === 'sprite') {
        getSpriteQuad2D(command.object, this.quad);
        this.sources.prepare(command.object.texture);
      }
      if (command.kind === 'particles')
        for (let i = 0; i < command.object.activeCount; i++) {
          const slot = command.object.getSlot(command.object.activeSlotAt(i));
          getTextureQuad2D(slot.texture, slot.view, slot.source, this.quad);
          this.sources.prepare(slot.texture);
        }
      if (command.kind === 'layer') {
        if (command.object.filters.length)
          throw new UnsupportedGraphicsError(
            'Canvas2D does not support native Filter2D.',
          );
        if (command.object.mask?.texture)
          this.sources.prepare(command.object.mask.texture);
        const bounds = command.object.getLocalBounds();
        this.validateBounds(bounds);
        this.preflight(command.commands, depth + 1);
      }
    }
  }
  private validateBounds(bounds: Rect2D): void {
    if (
      ![bounds.x, bounds.y, bounds.width, bounds.height].every(
        Number.isFinite,
      ) ||
      bounds.width > rendering2dLimits.targetDimension ||
      bounds.height > rendering2dLimits.targetDimension ||
      Math.ceil(bounds.width) * Math.ceil(bounds.height) >
        rendering2dLimits.targetPixels
    )
      throw new RangeError('Canvas2D local target exceeds budget.');
  }
  draw(
    context: CanvasRenderingContext2D,
    commands: RenderCommandBuffer2D,
    scene: Scene,
    scaleX: number,
    scaleY: number,
    root?: IsolatedGroup2D,
    bounds: Rect2D = zeroBounds,
  ): void {
    this.stats.pass2D();
    let inverse: Matrix3 | undefined;
    if (root) {
      inverse = this.inverses.get(root);
      if (!inverse) {
        inverse = new Matrix3();
        this.inverses.set(root, inverse);
      }
      inverse.copy(root.updateWorldMatrix()).invert();
    }
    for (const command of commands.items) {
      const object = command.object;
      if (command.kind === 'layer') {
        const group = command.object;
        let pixels = this.caches.get(group);
        if (
          !pixels ||
          !group.cacheAsTexture ||
          pixels.version !== group.cacheVersion
        ) {
          const local = group.getLocalBounds();
          this.validateBounds(local);
          const canvas = pixels?.canvas ?? document.createElement('canvas');
          const width = Math.max(1, Math.ceil(local.width)),
            height = Math.max(1, Math.ceil(local.height));
          this.resizeCanvas(canvas, width, height);
          const target = canvas.getContext('2d')!;
          target.setTransform(1, 0, 0, 1, 0, 0);
          target.globalAlpha = 1;
          target.globalCompositeOperation = 'source-over';
          target.clearRect(0, 0, width, height);
          try {
            this.draw(target, command.commands, scene, 1, 1, group, local);
            if (group.mask) this.mask(target, group, local);
          } catch (error) {
            this.releaseCanvas(canvas);
            throw error;
          }
          pixels = { canvas, bounds: local, version: group.cacheVersion };
          this.caches.set(group, pixels);
        }
        this.transform(
          context,
          object,
          object.updateWorldMatrix(),
          scene,
          scaleX,
          scaleY,
          inverse,
          bounds,
          false,
        );
        getRelativeAppearance2D(object, root, this.appearance);
        // Group RGB belongs to the composite, never baked into cached descendants.
        const canvas = pixels.canvas;
        let image: CanvasImageSource = canvas;
        let tinted: HTMLCanvasElement | undefined;
        if (
          this.appearance[0] !== 1 ||
          this.appearance[1] !== 1 ||
          this.appearance[2] !== 1
        ) {
          tinted = this.tinted;
          this.resizeCanvas(tinted, canvas.width, canvas.height);
          this.stats.pass2D();
          const tc = tinted.getContext('2d')!;
          tc.globalCompositeOperation = 'copy';
          tc.drawImage(canvas, 0, 0);
          this.stats.draw2D();
          tc.globalCompositeOperation = 'source-over';
          const data = tc.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < data.data.length; i += 4)
            for (let c = 0; c < 3; c++) data.data[i + c] *= this.appearance[c];
          tc.putImageData(data, 0, 0);
          image = tinted;
        }
        context.globalAlpha = this.appearance[3];
        context.globalCompositeOperation = modes[group.blendMode];
        context.drawImage(
          image,
          pixels.bounds.x,
          pixels.bounds.y,
          pixels.bounds.width || 1,
          pixels.bounds.height || 1,
        );
        this.stats.draw2D();
        context.globalCompositeOperation = 'source-over';
      } else if (command.kind === 'sprite') {
        const sprite = command.object;
        const quad = getSpriteQuad2D(sprite, this.quad);
        getRelativeAppearance2D(sprite, root, this.appearance);
        this.transform(
          context,
          sprite,
          sprite.updateWorldMatrix(),
          scene,
          scaleX,
          scaleY,
          inverse,
          bounds,
          sprite.roundPixels,
        );
        const matrix = context.getTransform();
        const desiredScale =
          Math.max(
            Math.hypot(matrix.a, matrix.b),
            Math.hypot(matrix.c, matrix.d),
          ) / quad.resolution;
        const image = this.sources.image(
          sprite.texture,
          quad,
          this.appearance,
          desiredScale,
        );
        context.globalAlpha = this.appearance[3];
        context.imageSmoothingEnabled =
          (sprite.sampler?.magFilter ??
            sprite.sampler?.minFilter ??
            'linear') !== 'nearest';
        if (sprite instanceof TilingSprite2D) {
          context.save();
          context.beginPath();
          context.rect(
            -sprite.anchor.x * sprite.width,
            -sprite.anchor.y * sprite.height,
            sprite.width,
            sprite.height,
          );
          context.clip();
          const tile = this.tile;
          const resolution = image.width / quad.trimWidth;
          const tw = Math.max(1, Math.round(quad.naturalWidth * resolution)),
            th = Math.max(1, Math.round(quad.naturalHeight * resolution));
          this.resizeCanvas(tile, tw, th);
          this.stats.pass2D();
          const tileContext = tile.getContext('2d')!;
          tileContext.clearRect(0, 0, tw, th);
          tileContext.drawImage(
            image,
            quad.trimX * resolution,
            quad.trimY * resolution,
          );
          this.stats.draw2D();
          const pattern = context.createPattern(tile, 'repeat')!;
          const cs = Math.cos(sprite.tileRotation),
            sn = Math.sin(sprite.tileRotation);
          const tm = (this.tileMatrix ??= new DOMMatrix());
          tm.a = (cs * sprite.tileScale.x) / resolution;
          tm.b = (sn * sprite.tileScale.x) / resolution;
          tm.c = (-sn * sprite.tileScale.y) / resolution;
          tm.d = (cs * sprite.tileScale.y) / resolution;
          tm.e = sprite.tilePosition.x;
          tm.f = sprite.tilePosition.y;
          pattern.setTransform(tm);
          context.fillStyle = pattern;
          context.fillRect(
            -sprite.anchor.x * sprite.width,
            -sprite.anchor.y * sprite.height,
            sprite.width,
            sprite.height,
          );
          context.restore();
        } else
          context.drawImage(image, quad.x, quad.y, quad.width, quad.height);
        this.stats.draw2D();
      } else if (command.kind === 'particles') {
        const layer = command.object;
        for (let i = 0; i < layer.activeCount; i++) {
          const index = layer.activeSlotAt(i),
            slot = layer.getSlot(index);
          const quad = getTextureQuad2D(
            slot.texture,
            slot.view,
            slot.source,
            this.quad,
          );
          getRelativeAppearance2D(layer, root, this.appearance);
          this.appearance[0] *= slot.tintR;
          this.appearance[1] *= slot.tintG;
          this.appearance[2] *= slot.tintB;
          this.appearance[3] *= slot.tintA;
          this.transform(
            context,
            layer,
            layer.getSlotWorldMatrix(index, this.matrix),
            scene,
            scaleX,
            scaleY,
            inverse,
            bounds,
            false,
          );
          const matrix = context.getTransform();
          const image = this.sources.image(
            slot.texture,
            quad,
            this.appearance,
            Math.max(
              Math.hypot(matrix.a, matrix.b),
              Math.hypot(matrix.c, matrix.d),
            ) / quad.resolution,
          );
          context.globalAlpha = this.appearance[3];
          context.drawImage(
            image,
            quad.x - slot.anchorX * quad.naturalWidth,
            quad.y - slot.anchorY * quad.naturalHeight,
            quad.width,
            quad.height,
          );
          this.stats.draw2D();
        }
      }
    }
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    for (const [group, pixels] of this.caches)
      if (group.destroyed || !group.isolationEnabled) {
        this.releaseCanvas(pixels.canvas);
        this.caches.delete(group);
      }
  }
  private transform(
    context: CanvasRenderingContext2D,
    object: GameObject,
    matrix: Matrix3,
    scene: Scene,
    sx: number,
    sy: number,
    inverse: Matrix3 | undefined,
    bounds: Rect2D,
    round: boolean,
  ): void {
    const m = inverse
      ? this.product.copy(inverse).multiply(matrix).elements
      : matrix.elements;
    const world = !inverse && object.worldSpace === 'world';
    const camera = scene.camera2D;
    const z = world ? camera.zoom : 1;
    let x =
      ((m[6] - (world ? camera.position.x : 0)) * z +
        (world ? camera.renderOffset.x : 0) -
        bounds.x) *
      sx;
    let y =
      ((m[7] - (world ? camera.position.y : 0)) * z +
        (world ? camera.renderOffset.y : 0) -
        bounds.y) *
      sy;
    if (round) {
      x = Math.round(x);
      y = Math.round(y);
    }
    context.setTransform(
      m[0] * z * sx,
      m[1] * z * sy,
      m[3] * z * sx,
      m[4] * z * sy,
      x,
      y,
    );
  }
  private mask(
    context: CanvasRenderingContext2D,
    group: IsolatedGroup2D,
    bounds: Rect2D,
  ): void {
    const mask = group.mask!;
    const canvas = this.maskCanvas;
    this.resizeCanvas(canvas, context.canvas.width, context.canvas.height);
    this.stats.pass2D();
    const mc = canvas.getContext('2d')!;
    mc.setTransform(1, 0, 0, 1, 0, 0);
    mc.clearRect(0, 0, canvas.width, canvas.height);
    const m = mask.transform;
    mc.setTransform(m[0], m[1], m[2], m[3], m[4] - bounds.x, m[5] - bounds.y);
    mc.fillStyle = 'white';
    if (mask.kind === 'rect') {
      const r = mask.rect!;
      mc.fillRect(r.x, r.y, r.width, r.height);
    } else if (mask.kind === 'path') {
      let path = this.paths.get(mask.path!);
      if (!path) {
        path = mask.path!.nativePath2D;
        this.paths.set(mask.path!, path);
      }
      mc.fill(path, mask.path!.fillRule);
    } else {
      const q = getTextureQuad2D(
        mask.texture!,
        mask.view,
        undefined,
        this.quad,
      );
      const image = this.sources.image(mask.texture!, q, white);
      mc.drawImage(image, q.x, q.y, q.width, q.height);
      if (mask.channel === 'red') {
        const data = mc.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < data.data.length; i += 4)
          data.data[i + 3] = Math.round(
            (data.data[i] * data.data[i + 3]) / 255,
          );
        mc.setTransform(1, 0, 0, 1, 0, 0);
        mc.putImageData(data, 0, 0);
      }
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = mask.inverse
      ? 'destination-out'
      : 'destination-in';
    context.drawImage(canvas, 0, 0);
    this.stats.draw2D();
    this.stats.draw2D();
    context.globalCompositeOperation = 'source-over';
  }
  destroy(): void {
    for (const canvas of this.canvasBytes.keys()) this.releaseCanvas(canvas);
    this.caches.clear();
  }
}
