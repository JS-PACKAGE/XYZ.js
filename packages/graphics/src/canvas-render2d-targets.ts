import { Texture, type Texture2DSource } from '../../assets/src/index.js';
import { Scene } from '../../core/src/scene.js';
import { IsolatedGroup2D } from '../../core/src/rendering2d/isolated-group.js';
import type { Rect2D } from '../../core/src/gameplay/contracts.js';
import {
  collectRenderCommands2D,
  RenderCommandBuffer2D,
} from './render2d-contract.js';
import {
  RenderTexture2D,
  createOwnedRenderTexture2D,
  validateRenderTextureSize2D,
  assertRenderTextureOwner2D,
  validateRenderTextureDependencies2D,
  validateRenderTextureRegion2D,
  type RenderTextureOptions2D,
} from './render-texture2d.js';
import type { CanvasRender2D } from './canvas-render2d.js';
import { GraphicsError, UnsupportedGraphicsError } from './errors.js';
export class CanvasRender2DTargets {
  readonly canvases = new Map<RenderTexture2D, HTMLCanvasElement>();
  private readonly detachedScene = new Scene();
  constructor(
    private readonly owner: object,
    private readonly idle: () => void,
    private readonly engine: CanvasRender2D,
    private readonly alive: () => boolean,
  ) {}
  create(options: RenderTextureOptions2D): RenderTexture2D {
    this.idle();
    const size = validateRenderTextureSize2D(options);
    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    if (!canvas.getContext('2d'))
      throw new GraphicsError('Canvas2D target unavailable.');
    const target = createOwnedRenderTexture2D(
      this.owner,
      size,
      (next) => {
        this.idle();
        canvas.width = next.width;
        canvas.height = next.height;
      },
      () => {
        canvas.width = canvas.height = 1;
        this.canvases.delete(target);
      },
    );
    this.canvases.set(target, canvas);
    return target;
  }
  async render(
    target: RenderTexture2D,
    content: Scene | IsolatedGroup2D,
    options: { clear?: boolean; bounds?: Rect2D } = {},
  ): Promise<void> {
    this.idle();
    assertRenderTextureOwner2D(target, this.owner);
    const root = content instanceof IsolatedGroup2D ? content : undefined;
    const scene = root
      ? (root.scene ?? this.detachedScene)
      : (content as Scene);
    if (content.destroyed)
      throw new GraphicsError('Render content must be live.');
    if (scene.effects2D.length)
      throw new UnsupportedGraphicsError(
        'Canvas2D does not support native 2D post processors.',
      );
    const bounds =
      options.bounds ??
      (root
        ? root.getLocalBounds()
        : {
            x: 0,
            y: 0,
            width: target.logicalWidth,
            height: target.logicalHeight,
          });
    validateRenderTextureSize2D({
      width: bounds.width,
      height: bounds.height,
      resolution: target.resolution,
    });
    if (!Number.isFinite(bounds.x + bounds.y))
      throw new RangeError('Render bounds must be finite.');
    const commands = new RenderCommandBuffer2D();
    const scratch = document.createElement('canvas');
    try {
      collectRenderCommands2D(
        scene,
        target.logicalWidth,
        target.logicalHeight,
        commands,
        { root, skipCulling: true },
      );
      this.engine.preflight(commands);
      const dependencies: RenderTexture2D[] = [];
      const source = (value: Texture2DSource | undefined): void => {
        if (value?.kind === 'render') dependencies.push(value);
      };
      const inspect = (buffer: RenderCommandBuffer2D): void => {
        for (const command of buffer.items) {
          if (command.kind === 'layer') {
            source(command.object.mask?.texture);
            inspect(command.commands);
          } else if (command.kind === 'particles') {
            for (let i = 0; i < command.object.activeCount; i++)
              source(
                command.object.getSlot(command.object.activeSlotAt(i)).texture,
              );
          } else source(command.object.texture);
        }
      };
      inspect(commands);
      validateRenderTextureDependencies2D(target, dependencies, this.owner);
      scratch.width = target.width;
      scratch.height = target.height;
      const context = scratch.getContext('2d')!;
      if (options.clear === false)
        context.drawImage(this.canvases.get(target)!, 0, 0);
      this.engine.draw(
        context,
        commands,
        scene,
        target.width / bounds.width,
        target.height / bounds.height,
        root,
        bounds,
      );
      const destination = this.canvases.get(target)!.getContext('2d')!;
      destination.globalCompositeOperation = 'copy';
      destination.drawImage(scratch, 0, 0);
      destination.globalCompositeOperation = 'source-over';
      target.publish(this.owner, dependencies);
    } finally {
      scratch.width = scratch.height = 1;
      commands.destroy();
      this.engine.sources.endFrame();
    }
  }
  async extract(
    target: RenderTexture2D,
    options: { region?: Rect2D } = {},
  ): Promise<Uint8ClampedArray> {
    this.idle();
    assertRenderTextureOwner2D(target, this.owner);
    const r = validateRenderTextureRegion2D(target, options.region);
    return this.canvases
      .get(target)!
      .getContext('2d')!
      .getImageData(r.x, r.y, r.width, r.height).data;
  }
  async generate(
    content: Scene | IsolatedGroup2D,
    options: { bounds?: Rect2D; resolution?: number } = {},
  ): Promise<Texture> {
    this.idle();
    const bounds =
      options.bounds ??
      (content instanceof IsolatedGroup2D
        ? content.getLocalBounds()
        : {
            x: 0,
            y: 0,
            width: content.camera2D.viewportWidth,
            height: content.camera2D.viewportHeight,
          });
    const target = this.create({
      width: bounds.width,
      height: bounds.height,
      resolution: options.resolution,
    });
    try {
      await this.render(target, content, { bounds });
      const bitmap = await createImageBitmap(this.canvases.get(target)!);
      if (!this.alive()) {
        bitmap.close();
        throw new GraphicsError('Renderer destroyed during generation.');
      }
      return new Texture(bitmap);
    } finally {
      target.destroy();
    }
  }
  destroy(): void {
    for (const target of this.canvases.keys()) target.destroy();
  }
}
