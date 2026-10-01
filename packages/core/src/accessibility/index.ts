import { Vector2 } from '../../../math/src/index.js';
import { GameObject } from '../game-object.js';
import type { Scene } from '../scene.js';
import type { Rect2D } from '../gameplay/contracts.js';
import type { Mask2D } from '../rendering2d/mask2d.js';
import { rendering2dLimits } from '../../../../src/data/rendering2d.js';

export interface AccessibilityOptions2D {
  readonly role: string;
  readonly label: string;
  readonly tabIndex?: number;
  readonly disabled?: boolean;
}
interface ClipShape {
  readonly data: string;
  readonly path: Path2D;
  readonly fillRule: CanvasFillRule;
}
interface SemanticClip {
  mask: Mask2D;
  readonly wrapper: HTMLDivElement;
  readonly definition: SVGMaskElement;
  readonly background: SVGRectElement;
  readonly path: SVGPathElement;
  readonly transform: Float64Array;
}
interface SemanticEntry {
  readonly node: HTMLDivElement;
  readonly host: HTMLDivElement;
  readonly controller: AbortController;
  readonly generation: number;
  readonly clips: SemanticClip[];
  width: number;
  height: number;
  coverage: boolean;
  clipCoverage: boolean;
  spaceDown: boolean;
}
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
let nextMaskId = 0;

/** Invisible semantics only; exact native geometric masks never replace canvas visuals. */
export class AccessibilityManager {
  private readonly entries = new Map<GameObject, SemanticEntry>();
  private readonly shapes = new WeakMap<Mask2D, ClipShape>();
  private readonly point = new Vector2();
  private readonly bounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };
  private readonly transform = new Float64Array(6);
  private scene?: Scene;
  private definitions?: SVGSVGElement;
  private coverageCanvas?: HTMLCanvasElement;
  private disposed = false;
  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly getSize: () => { width: number; height: number },
  ) {}

  /** Returns only the semantic mirror belonging to the object's live registration. */
  element(object: GameObject): HTMLElement | undefined {
    const entry = this.entries.get(object),
      scene = this.scene;
    if (
      this.disposed ||
      !entry ||
      !scene ||
      scene.destroyed ||
      object.destroyed ||
      object.scene !== scene ||
      !scene.has(object) ||
      object.registrationGeneration !== entry.generation ||
      !object.accessibility
    )
      return undefined;
    return entry.node;
  }

  focus(object: GameObject): boolean {
    const node = this.element(object);
    if (
      !node ||
      !this.entries.get(object)!.coverage ||
      object.accessibility!.disabled ||
      !object.worldVisible ||
      object.worldOpacity <= 0 ||
      object.worldTint[3] <= 0
    )
      return false;
    node.focus({ preventScroll: true });
    return (
      node.ownerDocument.activeElement === node && this.element(object) === node
    );
  }

  private emit(
    object: GameObject,
    entry: SemanticEntry,
    type: 'focus' | 'blur' | 'activate',
    originalEvent: Event,
  ): void {
    const scene = this.scene;
    const guard = (): boolean =>
      !this.disposed &&
      !!scene &&
      this.scene === scene &&
      !scene.destroyed &&
      !object.destroyed &&
      object.scene === scene &&
      scene.has(object) &&
      object.registrationGeneration === entry.generation &&
      this.entries.get(object) === entry &&
      !!object.accessibility &&
      !object.accessibility.disabled &&
      entry.coverage;
    if (!guard()) return;
    let stopped = false,
      immediate = false;
    const detail = {
      target: object,
      currentTarget: object,
      phase: 'target' as const,
      originalEvent,
      get propagationStopped() {
        return stopped;
      },
      get immediatePropagationStopped() {
        return immediate;
      },
      get defaultPrevented() {
        return event.defaultPrevented;
      },
      stopPropagation() {
        event.stopPropagation();
      },
      stopImmediatePropagation() {
        event.stopImmediatePropagation();
      },
      preventDefault() {
        event.preventDefault();
        originalEvent.preventDefault();
      },
    };
    const event = new CustomEvent(type, { detail, cancelable: true });
    const stop = event.stopPropagation.bind(event),
      stopImmediate = event.stopImmediatePropagation.bind(event);
    event.stopPropagation = () => {
      stopped = true;
      stop();
    };
    event.stopImmediatePropagation = () => {
      stopped = immediate = true;
      stopImmediate();
    };
    object.dispatchInteractionEvent(event, 'target', guard);
  }
  private create(object: GameObject): SemanticEntry {
    const document = this.canvas.ownerDocument;
    const host = document.createElement('div'),
      node = document.createElement('div');
    node.dataset.xyzAccessibility = '';
    host.dataset.xyzAccessibilityHost = '';
    Object.assign(host.style, {
      position: 'fixed',
      pointerEvents: 'none',
      margin: '0',
      padding: '0',
      border: '0',
    });
    Object.assign(node.style, {
      position: 'absolute',
      inset: '0',
      opacity: '0',
      pointerEvents: 'none',
      margin: '0',
      padding: '0',
      border: '0',
      overflow: 'hidden',
      background: 'none',
      color: 'transparent',
      outline: 'none',
    });
    host.append(node);
    const entry: SemanticEntry = {
      node,
      host,
      controller: new AbortController(),
      generation: object.registrationGeneration,
      clips: [],
      width: 0,
      height: 0,
      coverage: false,
      clipCoverage: false,
      spaceDown: false,
    };
    const options = { signal: entry.controller.signal };
    node.addEventListener(
      'focus',
      (event) => this.emit(object, entry, 'focus', event),
      options,
    );
    node.addEventListener(
      'blur',
      (event) => {
        entry.spaceDown = false;
        this.emit(object, entry, 'blur', event);
      },
      options,
    );
    node.addEventListener(
      'keydown',
      (event) => {
        if (
          object.accessibility?.disabled ||
          event.repeat ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        if (event.code === 'Enter') {
          event.preventDefault();
          this.emit(object, entry, 'activate', event);
        } else if (event.code === 'Space') {
          event.preventDefault();
          entry.spaceDown = true;
        }
      },
      options,
    );
    node.addEventListener(
      'keyup',
      (event) => {
        if (event.code !== 'Space' || !entry.spaceDown) return;
        entry.spaceDown = false;
        event.preventDefault();
        this.emit(object, entry, 'activate', event);
      },
      options,
    );
    document.body.append(host);
    return entry;
  }
  private shape(mask: Mask2D): ClipShape {
    let shape = this.shapes.get(mask);
    if (shape) return shape;
    if (mask.path)
      shape = {
        data: mask.path.toSVGPathData(),
        path: mask.path.nativePath2D,
        fillRule: mask.path.fillRule,
      };
    else {
      const rect = mask.rect,
        source = mask.texture;
      const x = rect?.x ?? 0,
        y = rect?.y ?? 0;
      const width =
        rect?.width ??
        mask.view?.width ??
        (source?.kind === 'render'
          ? source.logicalWidth
          : (source?.width ?? 0));
      const height =
        rect?.height ??
        mask.view?.height ??
        (source?.kind === 'render'
          ? source.logicalHeight
          : (source?.height ?? 0));
      const path = new Path2D();
      path.rect(x, y, width, height);
      shape = {
        data: `M${x} ${y}h${width}v${height}h${-width}Z`,
        path,
        fillRule: 'nonzero',
      };
    }
    this.shapes.set(mask, shape);
    return shape;
  }
  private createClip(mask: Mask2D): SemanticClip {
    const document = this.canvas.ownerDocument;
    if (!this.definitions) {
      this.definitions = document.createElementNS(SVG_NAMESPACE, 'svg');
      this.definitions.setAttribute('width', '0');
      this.definitions.setAttribute('height', '0');
      this.definitions.setAttribute('aria-hidden', 'true');
      this.definitions.style.cssText =
        'position:absolute;pointer-events:none;overflow:hidden';
      document.body.append(this.definitions);
    }
    const definition = document.createElementNS(SVG_NAMESPACE, 'mask');
    const background = document.createElementNS(SVG_NAMESPACE, 'rect');
    const path = document.createElementNS(SVG_NAMESPACE, 'path');
    const wrapper = document.createElement('div');
    const id = `xyz-semantic-mask-${nextMaskId++}`;
    definition.id = id;
    definition.setAttribute('maskUnits', 'userSpaceOnUse');
    definition.setAttribute('maskContentUnits', 'userSpaceOnUse');
    definition.setAttribute('mask-type', 'luminance');
    definition.setAttribute('x', '0');
    definition.setAttribute('y', '0');
    background.setAttribute('fill', 'white');
    definition.append(background, path);
    this.definitions.append(definition);
    Object.assign(wrapper.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      maskImage: `url("#${id}")`,
      maskMode: 'luminance',
    });
    return {
      mask,
      wrapper,
      definition,
      background,
      path,
      transform: new Float64Array(6),
    };
  }
  private clip(
    entry: SemanticEntry,
    object: GameObject,
    scene: Scene,
    left: number,
    top: number,
    width: number,
    height: number,
    scaleX: number,
    scaleY: number,
  ): boolean {
    let changed = entry.width !== width || entry.height !== height;
    entry.width = width;
    entry.height = height;
    let count = 0;
    for (
      let ancestor: GameObject | undefined = object;
      ancestor;
      ancestor = ancestor.parent
    ) {
      const maskedAncestor: GameObject & { readonly mask?: Mask2D } = ancestor;
      const mask = maskedAncestor.mask;
      if (!mask) continue;
      const matrix = ancestor.updateWorldMatrix().elements,
        m = mask.transform;
      const zoom = object.worldSpace === 'world' ? scene.camera2D.zoom : 1;
      const offsetX =
        object.worldSpace === 'world'
          ? scene.camera2D.renderOffset.x - scene.camera2D.position.x * zoom
          : 0;
      const offsetY =
        object.worldSpace === 'world'
          ? scene.camera2D.renderOffset.y - scene.camera2D.position.y * zoom
          : 0;
      const transform = this.transform;
      transform[0] = (matrix[0] * m[0] + matrix[3] * m[1]) * zoom * scaleX;
      transform[1] = (matrix[1] * m[0] + matrix[4] * m[1]) * zoom * scaleY;
      transform[2] = (matrix[0] * m[2] + matrix[3] * m[3]) * zoom * scaleX;
      transform[3] = (matrix[1] * m[2] + matrix[4] * m[3]) * zoom * scaleY;
      transform[4] =
        ((matrix[0] * m[4] + matrix[3] * m[5] + matrix[6]) * zoom +
          offsetX -
          left) *
        scaleX;
      transform[5] =
        ((matrix[1] * m[4] + matrix[4] * m[5] + matrix[7]) * zoom +
          offsetY -
          top) *
        scaleY;
      let slot = entry.clips[count];
      if (!slot) {
        slot = this.createClip(mask);
        entry.clips.push(slot);
        changed = true;
      }
      if (
        slot.mask !== mask ||
        transform.some((value, index) => value !== slot.transform[index])
      )
        changed = true;
      slot.mask = mask;
      slot.transform.set(transform);
      count++;
    }
    while (entry.clips.length > count) {
      const slot = entry.clips.pop()!;
      slot.definition.remove();
      slot.wrapper.remove();
      changed = true;
    }
    if (!changed) return entry.clipCoverage;
    let parent: HTMLElement = entry.host;
    for (const slot of entry.clips) {
      parent.append(slot.wrapper);
      parent = slot.wrapper;
      const shape = this.shape(slot.mask);
      slot.definition.setAttribute('width', String(width));
      slot.definition.setAttribute('height', String(height));
      slot.background.setAttribute('width', String(width));
      slot.background.setAttribute('height', String(height));
      slot.background.style.display = slot.mask.inverse ? '' : 'none';
      slot.path.setAttribute('d', shape.data);
      slot.path.setAttribute('fill', slot.mask.inverse ? 'black' : 'white');
      slot.path.setAttribute('fill-rule', shape.fillRule);
      slot.path.setAttribute(
        'transform',
        `matrix(${Array.from(slot.transform).join(' ')})`,
      );
    }
    parent.append(entry.node);
    if (!entry.clips.length) return width > 0 && height > 0;
    // Native coverage of the semantic box determines fully clipped visibility; images remain bounds-only.
    const canvas = (this.coverageCanvas ??=
      this.canvas.ownerDocument.createElement('canvas'));
    const pixelWidth = Math.ceil(width),
      pixelHeight = Math.ceil(height);
    if (
      pixelWidth > rendering2dLimits.targetDimension ||
      pixelHeight > rendering2dLimits.targetDimension ||
      pixelWidth * pixelHeight > rendering2dLimits.targetPixels
    )
      throw new RangeError(
        'Accessibility clipping exceeds the finite target budget.',
      );
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context)
      throw new Error(
        'Canvas2D is required for geometric accessibility clipping.',
      );
    context.fillStyle = 'white';
    context.fillRect(0, 0, width, height);
    for (const slot of entry.clips) {
      const m = slot.transform;
      context.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
      context.globalCompositeOperation = slot.mask.inverse
        ? 'destination-out'
        : 'destination-in';
      const shape = this.shape(slot.mask);
      context.fill(shape.path, shape.fillRule);
    }
    const pixels = context.getImageData(0, 0, pixelWidth, pixelHeight).data;
    for (let i = 3; i < pixels.length; i += 4) if (pixels[i] !== 0) return true;
    return false;
  }
  private remove(object: GameObject, entry: SemanticEntry): void {
    entry.controller.abort();
    entry.host.remove();
    for (const clip of entry.clips) clip.definition.remove();
    this.entries.delete(object);
  }
  update(scene?: Scene): void {
    if (this.disposed) return;
    if (scene !== this.scene) {
      this.reset();
      this.scene = scene;
    }
    if (!scene || scene.destroyed || !this.canvas.isConnected) {
      this.reset();
      return;
    }
    const rect = this.canvas.getBoundingClientRect(),
      style = getComputedStyle(this.canvas);
    const transformX =
      this.canvas.offsetWidth > 0 ? rect.width / this.canvas.offsetWidth : 1;
    const transformY =
      this.canvas.offsetHeight > 0 ? rect.height / this.canvas.offsetHeight : 1;
    const leftInset =
      ((parseFloat(style.borderLeftWidth) || 0) +
        (parseFloat(style.paddingLeft) || 0)) *
      transformX;
    const topInset =
      ((parseFloat(style.borderTopWidth) || 0) +
        (parseFloat(style.paddingTop) || 0)) *
      transformY;
    const cssWidth =
      rect.width -
      leftInset -
      ((parseFloat(style.borderRightWidth) || 0) +
        (parseFloat(style.paddingRight) || 0)) *
        transformX;
    const cssHeight =
      rect.height -
      topInset -
      ((parseFloat(style.borderBottomWidth) || 0) +
        (parseFloat(style.paddingBottom) || 0)) *
        transformY;
    const size = this.getSize();
    for (const [object, entry] of this.entries) {
      if (
        object.scene !== scene ||
        !scene.has(object) ||
        object.destroyed ||
        !object.accessibility ||
        object.registrationGeneration !== entry.generation
      )
        this.remove(object, entry);
    }
    for (const object of scene.objects) {
      if (
        !(object instanceof GameObject) ||
        !object.accessibility ||
        object.destroyed
      )
        continue;
      const semantic = object.accessibility;
      if (
        typeof semantic.role !== 'string' ||
        !semantic.role.trim() ||
        typeof semantic.label !== 'string' ||
        (semantic.disabled !== undefined &&
          typeof semantic.disabled !== 'boolean') ||
        (semantic.tabIndex !== undefined &&
          (!Number.isInteger(semantic.tabIndex) ||
            semantic.tabIndex < -1 ||
            semantic.tabIndex > 32767))
      )
        throw new TypeError(
          'Accessibility requires role, label, boolean disabled, and an integer tabIndex from -1 to 32767.',
        );
      let entry = this.entries.get(object);
      if (!entry) {
        entry = this.create(object);
        this.entries.set(object, entry);
      }
      const node = entry.node;
      node.setAttribute('role', semantic.role);
      node.setAttribute('aria-label', semantic.label);
      node.setAttribute('aria-disabled', String(semantic.disabled ?? false));
      node.tabIndex = semantic.disabled ? -1 : (semantic.tabIndex ?? 0);
      object.getWorldBounds(this.bounds);
      let minX = this.bounds.x,
        minY = this.bounds.y,
        maxX = minX + this.bounds.width,
        maxY = minY + this.bounds.height;
      if (object.worldSpace === 'world') {
        scene.camera2D.worldToScreen(this.point.set(minX, minY), this.point);
        minX = this.point.x;
        minY = this.point.y;
        scene.camera2D.worldToScreen(this.point.set(maxX, maxY), this.point);
        maxX = this.point.x;
        maxY = this.point.y;
      }
      minX = Math.max(0, minX);
      minY = Math.max(0, minY);
      maxX = Math.min(size.width, maxX);
      maxY = Math.min(size.height, maxY);
      let visible =
        object.worldVisible &&
        object.worldOpacity > 0 &&
        object.worldTint[3] > 0 &&
        maxX > minX &&
        maxY > minY &&
        size.width > 0 &&
        size.height > 0 &&
        cssWidth > 0 &&
        cssHeight > 0 &&
        style.display !== 'none' &&
        style.visibility !== 'hidden';
      if (visible) {
        entry.clipCoverage = this.clip(
          entry,
          object,
          scene,
          minX,
          minY,
          ((maxX - minX) * cssWidth) / size.width,
          ((maxY - minY) * cssHeight) / size.height,
          cssWidth / size.width,
          cssHeight / size.height,
        );
        visible = entry.clipCoverage;
      }
      entry.coverage = visible;
      entry.host.style.display = visible ? 'block' : 'none';
      node.setAttribute('aria-hidden', String(!visible));
      if (!visible || semantic.disabled) {
        entry.spaceDown = false;
        if (node === node.ownerDocument.activeElement) node.blur();
      }
      if (!visible) continue;
      entry.host.style.left = `${rect.left + leftInset + (minX * cssWidth) / size.width}px`;
      entry.host.style.top = `${rect.top + topInset + (minY * cssHeight) / size.height}px`;
      entry.host.style.width = `${entry.width}px`;
      entry.host.style.height = `${entry.height}px`;
    }
  }
  reset(): void {
    for (const [object, entry] of this.entries) this.remove(object, entry);
    this.scene = undefined;
    this.definitions?.remove();
    this.definitions = undefined;
    if (this.coverageCanvas) {
      this.coverageCanvas.width = this.coverageCanvas.height = 0;
      this.coverageCanvas = undefined;
    }
  }
  destroy(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
  }
}
