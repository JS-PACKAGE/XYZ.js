import type { Game } from './game.js';
import type { Scene } from './scene.js';
import { PerspectiveCamera } from './perspective-camera.js';
import { Matrix4 } from '../../math/src/index.js';
import { xrLoops, type XRLoopDriver } from './xr-loop.js';

export type XRSessionMode = 'immersive-vr' | 'immersive-ar';
export interface XRPoseTransform {
  readonly position: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  };
  readonly orientation: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
  };
  readonly inverse: { readonly matrix: Float32Array };
}
export interface XRViewData {
  readonly projectionMatrix: Float32Array;
  readonly transform: XRPoseTransform;
}
export interface XRViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export interface XRInputSourceData {
  readonly handedness: string;
  readonly targetRaySpace: object;
  readonly gripSpace?: object;
  readonly gamepad?: {
    readonly buttons: readonly { readonly value: number }[];
    readonly axes: readonly number[];
  };
}
export interface XRFrameData {
  getViewerPose(space: object): {
    readonly transform: XRPoseTransform;
    readonly views: readonly XRViewData[];
  } | null;
  getPose(
    space: object,
    referenceSpace: object,
  ): { readonly transform: XRPoseTransform } | null;
}
export interface XRSessionData extends EventTarget {
  readonly inputSources: readonly XRInputSourceData[];
  readonly visibilityState: string;
  requestReferenceSpace(type: string): Promise<object>;
  updateRenderState(state: {
    baseLayer?: object;
    layers?: object[];
    depthNear?: number;
    depthFar?: number;
  }): void;
  requestAnimationFrame(
    callback: (timestamp: number, frame: XRFrameData) => void,
  ): number;
  cancelAnimationFrame(id: number): void;
  end(): Promise<void>;
}
export interface XRSystemData {
  isSessionSupported(mode: XRSessionMode): Promise<boolean>;
  requestSession(
    mode: XRSessionMode,
    options: { requiredFeatures: string[]; optionalFeatures: string[] },
  ): Promise<XRSessionData>;
}
export interface XRSessionOptions {
  requiredFeatures?: readonly string[];
  optionalFeatures?: readonly string[];
}
export interface XRController {
  readonly source: XRInputSourceData;
  readonly targetRay: XRPoseTransform | null;
  readonly grip: XRPoseTransform | null;
  /** Bind actions to virtual controls `${prefix}.button.N` / `${prefix}.axis.N`. */
  readonly prefix: string;
}
interface GLLayer {
  readonly framebuffer: WebGLFramebuffer;
  getViewport(view: XRViewData): XRViewport | null;
}
interface GPUBinding {
  createProjectionLayer(options: {
    colorFormat: GPUTextureFormat;
    textureUsage: number;
  }): object;
  getViewSubImage(
    layer: object,
    view: XRViewData,
  ): { colorTexture: GPUTexture; viewport: XRViewport; imageIndex?: number };
}
interface XRGlobals {
  XRWebGLLayer?: new (
    session: XRSessionData,
    gl: WebGL2RenderingContext,
  ) => GLLayer;
  XRGPUBinding?: new (session: XRSessionData, device: GPUDevice) => GPUBinding;
}
class XRCamera extends PerspectiveCamera {
  private readonly projection = new Matrix4();
  private readonly xrView = new Matrix4();
  setView(view: XRViewData): void {
    this.position.set(
      view.transform.position.x,
      view.transform.position.y,
      view.transform.position.z,
    );
    const q = view.transform.orientation;
    this.rotation.set(q.x, q.y, q.z, q.w);
    this.projection.elements.set(view.projectionMatrix);
    // WebXR has GL clip depth; the engine's common camera contract is 0..1.
    const e = this.projection.elements;
    for (let column = 0; column < 4; column++) {
      const i = column * 4;
      e[i + 2] = (e[i + 2]! + e[i + 3]!) * 0.5;
    }
    this.xrView.elements.set(view.transform.inverse.matrix);
    this.matrix.copy(this.projection).multiply(this.xrView);
  }
  override updateMatrix(): Matrix4 {
    return this.matrix;
  }
}

/** One immersive session per Game. Construct adjacent to Game; no published Game shape changes. */
export class XRSessionManager extends EventTarget implements XRLoopDriver {
  tick?: (timestamp: number) => void;
  private current: XRSessionData | undefined;
  private referenceSpace: object | undefined;
  private layer: GLLayer | undefined;
  private gpuBinding: GPUBinding | undefined;
  private gpuLayer: object | undefined;
  private frame: XRFrameData | undefined;
  private requestId: number | undefined;
  private pending = false;
  private disposed = false;
  private readonly camera = new XRCamera();
  private readonly controls = new Set<string>();
  private controllerValues: XRController[] = [];
  private readonly sourceIds = new WeakMap<object, number>();
  private nextSource = 0;
  private readonly onEnd = (): void => this.cleanup();
  private readonly onLoss = (): void => {
    void this.end().catch((error) =>
      this.dispatchEvent(new CustomEvent('error', { detail: error })),
    );
  };
  private readonly onVisibility = (): void => {
    this.game.clock.suspend();
    if (this.current?.visibilityState === 'hidden') this.clearControls();
    this.dispatchEvent(new Event('visibilitychange'));
  };
  constructor(
    readonly game: Game,
    private readonly system: XRSystemData | undefined = (
      globalThis.navigator as (Navigator & { xr?: XRSystemData }) | undefined
    )?.xr,
  ) {
    super();
  }
  get session(): XRSessionData | undefined {
    return this.current;
  }
  get controllers(): readonly XRController[] {
    return this.controllerValues;
  }
  isSessionSupported(mode: XRSessionMode): Promise<boolean> {
    return this.system?.isSessionSupported(mode) ?? Promise.resolve(false);
  }
  async requestSession(
    mode: XRSessionMode,
    options: XRSessionOptions = {},
  ): Promise<XRSessionData> {
    if (this.disposed || this.pending || this.current || xrLoops.has(this.game))
      throw new Error(
        'XR manager is destroyed or a session is already active/pending.',
      );
    const renderer = this.game.graphics;
    if (renderer.backend === 'canvas2d')
      throw new Error('Canvas2D does not support immersive WebXR.');
    if (!this.system || !renderer.initializeXR || !renderer.renderXRView)
      throw new Error('WebXR is unsupported by this platform or renderer.');
    this.pending = true;
    let session: XRSessionData | undefined;
    try {
      const native = await renderer.initializeXR();
      const globals = globalThis as typeof globalThis & XRGlobals;
      if (native.backend === 'webgpu' && !globals.XRGPUBinding)
        throw new Error('WebGPU immersive WebXR requires XRGPUBinding.');
      if (native.backend === 'webgl2' && !globals.XRWebGLLayer)
        throw new Error('WebGL immersive WebXR requires XRWebGLLayer.');
      session = await this.system.requestSession(mode, {
        requiredFeatures: [
          ...new Set([
            'local-floor',
            ...(options.requiredFeatures ?? []),
            ...(native.backend === 'webgpu' ? ['layers'] : []),
          ]),
        ],
        optionalFeatures: [...(options.optionalFeatures ?? [])],
      });
      this.referenceSpace = await session.requestReferenceSpace('local-floor');
      if (this.disposed || this.game.state === 'destroyed')
        throw new Error('XR owner was destroyed during session request.');
      if (native.backend === 'webgl2') {
        this.layer = new globals.XRWebGLLayer!(session, native.context);
        session.updateRenderState({ baseLayer: this.layer });
      } else {
        this.gpuBinding = new globals.XRGPUBinding!(session, native.device);
        this.gpuLayer = this.gpuBinding.createProjectionLayer({
          colorFormat: native.format,
          textureUsage:
            GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        });
        session.updateRenderState({ layers: [this.gpuLayer] });
      }
      this.current = session;
      session.addEventListener('end', this.onEnd);
      session.addEventListener('visibilitychange', this.onVisibility);
      this.game.addEventListener('graphicslost', this.onLoss);
      const running = this.game.state === 'running';
      this.game.pause();
      xrLoops.set(this.game, this);
      if (running) this.game.start();
      this.requestId = session.requestAnimationFrame(this.onFrame);
      this.dispatchEvent(new Event('start'));
      return session;
    } catch (error) {
      if (session) await session.end();
      this.cleanup();
      throw error;
    } finally {
      this.pending = false;
    }
  }
  async end(): Promise<void> {
    if (this.current) {
      const session = this.current;
      try {
        await session.end();
      } finally {
        this.cleanup();
      }
    }
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    const session = this.current;
    this.cleanup();
    if (session)
      void session
        .end()
        .catch((error) =>
          this.dispatchEvent(new CustomEvent('error', { detail: error })),
        );
  }
  private readonly onFrame = (timestamp: number, frame: XRFrameData): void => {
    const session = this.current;
    if (!session) return;
    this.requestId = undefined;
    this.frame = frame;
    try {
      if (
        session.visibilityState !== 'hidden' &&
        this.game.state === 'running'
      ) {
        this.updateInput(frame, session);
        this.tick?.(timestamp);
      } else this.clearControls();
    } finally {
      this.frame = undefined;
      if (this.current === session)
        this.requestId = session.requestAnimationFrame(this.onFrame);
    }
  };
  render(scene: Scene | undefined): void {
    if (!scene || !this.frame || !this.referenceSpace) return;
    const pose = this.frame.getViewerPose(this.referenceSpace);
    if (!pose) return;
    const original = scene.camera3D;
    original.position.set(
      pose.transform.position.x,
      pose.transform.position.y,
      pose.transform.position.z,
    );
    const q = pose.transform.orientation;
    original.rotation.set(q.x, q.y, q.z, q.w);
    this.current!.updateRenderState({
      depthNear: original.near,
      depthFar: original.far,
    });
    this.camera.near = original.near;
    this.camera.far = original.far;
    scene.camera3D = this.camera;
    try {
      for (const view of pose.views) {
        this.camera.setView(view);
        if (this.layer) {
          const viewport = this.layer.getViewport(view);
          if (viewport)
            this.game.graphics.renderXRView!(scene, {
              backend: 'webgl2',
              framebuffer: this.layer.framebuffer,
              viewport,
            });
        } else if (this.gpuBinding && this.gpuLayer) {
          const image = this.gpuBinding.getViewSubImage(this.gpuLayer, view);
          this.game.graphics.renderXRView!(scene, {
            backend: 'webgpu',
            texture: image.colorTexture,
            viewport: image.viewport,
            imageIndex: image.imageIndex ?? 0,
          });
        }
      }
    } finally {
      scene.camera3D = original;
    }
  }
  private updateInput(frame: XRFrameData, session: XRSessionData): void {
    const active = new Set<string>();
    this.controllerValues = Array.from(session.inputSources, (source) => {
      let id = this.sourceIds.get(source);
      if (id === undefined) {
        id = this.nextSource++;
        this.sourceIds.set(source, id);
      }
      const prefix = `xr.${source.handedness}.${id}`;
      const set = (name: string, value: number): void => {
        active.add(name);
        this.controls.add(name);
        this.game.input.virtual.set(name, value);
      };
      source.gamepad?.buttons.forEach((button, i) =>
        set(`${prefix}.button.${i}`, button.value),
      );
      source.gamepad?.axes.forEach((axis, i) =>
        set(`${prefix}.axis.${i}`, axis),
      );
      return {
        source,
        prefix,
        targetRay:
          frame.getPose(source.targetRaySpace, this.referenceSpace!)
            ?.transform ?? null,
        grip: source.gripSpace
          ? (frame.getPose(source.gripSpace, this.referenceSpace!)?.transform ??
            null)
          : null,
      };
    });
    for (const name of this.controls)
      if (!active.has(name)) {
        this.game.input.virtual.set(name, 0);
        this.controls.delete(name);
      }
  }
  private clearControls(): void {
    for (const name of this.controls) this.game.input.virtual.set(name, 0);
    this.controls.clear();
    this.controllerValues = [];
  }
  private cleanup(): void {
    const session = this.current;
    if (session && this.requestId !== undefined)
      session.cancelAnimationFrame(this.requestId);
    session?.removeEventListener('end', this.onEnd);
    session?.removeEventListener('visibilitychange', this.onVisibility);
    this.game.removeEventListener('graphicslost', this.onLoss);
    const attached = xrLoops.get(this.game) === this;
    if (attached) xrLoops.delete(this.game);
    this.clearControls();
    this.current = undefined;
    this.requestId = undefined;
    this.referenceSpace = undefined;
    this.layer = undefined;
    this.gpuBinding = undefined;
    this.gpuLayer = undefined;
    if (attached) {
      const running = this.game.state === 'running';
      this.game.pause();
      if (running && !this.disposed) this.game.start();
      this.dispatchEvent(new Event('end'));
    }
  }
}
