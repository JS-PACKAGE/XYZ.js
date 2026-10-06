import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  XRSessionManager,
  type XRFrameData,
  type XRSessionData,
  type XRViewData,
  type XRPoseTransform,
} from '../packages/core/src/xr.js';
import { xrLoops, requestGameFrame } from '../packages/core/src/xr-loop.js';
import { Scene } from '../packages/core/src/scene.js';
import { VirtualInput } from '../packages/input/src/virtual.js';
import { Matrix4 } from '../packages/math/src/index.js';
import type { Game } from '../packages/core/src/game.js';

function transform(x: number): XRPoseTransform {
  const inverse = new Matrix4();
  inverse.elements[12] = -x;
  return {
    position: { x, y: 1.6, z: 0 },
    orientation: { x: 0, y: 0, z: 0, w: 1 },
    inverse: { matrix: inverse.elements },
  };
}
class Session extends EventTarget implements XRSessionData {
  visibilityState = 'visible';
  inputSources = [
    {
      handedness: 'left',
      targetRaySpace: {},
      gripSpace: {},
      gamepad: { buttons: [{ value: 0.8 }], axes: [-0.5, 0.2] },
    },
  ];
  callback: ((time: number, frame: XRFrameData) => void) | undefined;
  state: object | undefined;
  cancelled = 0;
  requestReferenceSpace = vi.fn(async (type: string) => {
    expect(type).toBe('local-floor');
    return {};
  });
  updateRenderState(state: object): void {
    this.state = state;
  }
  requestAnimationFrame(
    callback: (time: number, frame: XRFrameData) => void,
  ): number {
    this.callback = callback;
    return 1;
  }
  cancelAnimationFrame(): void {
    this.cancelled++;
    this.callback = undefined;
  }
  async end(): Promise<void> {
    this.dispatchEvent(new Event('end'));
  }
}
function fixture(backend: 'webgl2' | 'canvas2d' | 'webgpu' = 'webgl2') {
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 2),
  );
  const session = new Session();
  const scene = new Scene();
  const input = { virtual: new VirtualInput() };
  const renderXRView = vi.fn();
  const game = Object.assign(new EventTarget(), {
    state: 'running',
    scene,
    input,
    clock: { suspend: vi.fn() },
    graphics: {
      backend,
      initializeXR: vi.fn(async () => ({ backend: 'webgl2', context: {} })),
      renderXRView,
    },
    pause() {
      this.state = 'paused';
    },
    start() {
      this.state = 'running';
      requestGameFrame(this as unknown as Game, () =>
        xrLoops.get(this as unknown as Game)?.render(scene),
      );
    },
  }) as unknown as Game;
  const requestSession = vi.fn(async () => session);
  const manager = new XRSessionManager(game, {
    isSessionSupported: vi.fn(async () => true),
    requestSession,
  });
  vi.stubGlobal(
    'XRWebGLLayer',
    class {
      framebuffer = {};
      getViewport(view: XRViewData) {
        return {
          x: view.transform.position.x < 0 ? 0 : 100,
          y: 0,
          width: 100,
          height: 200,
        };
      }
    },
  );
  const projection = new Matrix4().elements;
  const views = [-0.03, 0.03].map((x) => ({
    projectionMatrix: projection,
    transform: transform(x),
  }));
  const frame: XRFrameData = {
    getViewerPose: () => ({ transform: transform(2), views }),
    getPose: () => ({ transform: transform(3) }),
  };
  return {
    manager,
    session,
    scene,
    game,
    input,
    renderXRView,
    requestSession,
    frame,
  };
}
afterEach(() => vi.unstubAllGlobals());
describe('immersive XR session ownership', () => {
  it('renders each viewport with independent view/projection and updates the head camera', async () => {
    const f = fixture();
    const matrices: number[][] = [];
    f.renderXRView.mockImplementation((scene: Scene) =>
      matrices.push(Array.from(scene.camera3D.updateMatrix(0.5).elements)),
    );
    const original = f.scene.camera3D;
    await f.manager.requestSession('immersive-vr', {
      requiredFeatures: ['hand-tracking'],
      optionalFeatures: ['bounded-floor'],
    });
    expect(f.requestSession).toHaveBeenCalledWith('immersive-vr', {
      requiredFeatures: ['local-floor', 'hand-tracking'],
      optionalFeatures: ['bounded-floor'],
    });
    f.session.callback!(16, f.frame);
    expect(f.renderXRView.mock.calls.map((call) => call[1].viewport.x)).toEqual(
      [0, 100],
    );
    expect(matrices[0]![12]).toBeCloseTo(0.03);
    expect(matrices[1]![12]).toBeCloseTo(-0.03);
    expect(matrices[0]![10]).toBeCloseTo(0.5);
    expect(f.scene.camera3D).toBe(original);
    expect(original.position.x).toBe(2);
    expect(original.position.y).toBe(1.6);
    await f.manager.end();
  });
  it('maps controller poses/buttons/axes to remappable virtual controls and releases on removal', async () => {
    const f = fixture();
    await f.manager.requestSession('immersive-ar');
    f.session.callback!(16, f.frame);
    const controller = f.manager.controllers[0]!;
    expect(controller.grip?.position.x).toBe(3);
    expect(controller.targetRay?.position.x).toBe(3);
    expect(f.input.virtual.value(`${controller.prefix}.button.0`)).toBe(0.8);
    expect(f.input.virtual.value(`${controller.prefix}.axis.0`)).toBe(-0.5);
    f.session.inputSources = [];
    f.session.callback!(32, f.frame);
    expect(f.input.virtual.value(`${controller.prefix}.button.0`)).toBe(0);
    await f.manager.end();
  });
  it('suspends on hidden visibility and cancels session RAF and listeners on destruction', async () => {
    const f = fixture();
    await f.manager.requestSession('immersive-vr');
    f.session.visibilityState = 'hidden';
    f.session.dispatchEvent(new Event('visibilitychange'));
    expect(f.game.clock.suspend).toHaveBeenCalled();
    f.session.callback!(16, f.frame);
    expect(f.renderXRView).not.toHaveBeenCalled();
    f.manager.destroy();
    expect(f.session.cancelled).toBe(1);
    expect(xrLoops.has(f.game)).toBe(false);
    expect(f.manager.session).toBeUndefined();
    await expect(f.manager.requestSession('immersive-vr')).rejects.toThrow(
      'destroyed',
    );
  });
  it('rejects Canvas2D and cleans up a failed reference-space request', async () => {
    const canvas = fixture('canvas2d');
    await expect(canvas.manager.requestSession('immersive-vr')).rejects.toThrow(
      'Canvas2D',
    );
    const f = fixture();
    const end = vi.spyOn(f.session, 'end');
    f.session.requestReferenceSpace.mockRejectedValue(
      new Error('floor unavailable'),
    );
    await expect(f.manager.requestSession('immersive-vr')).rejects.toThrow(
      'floor unavailable',
    );
    expect(end).toHaveBeenCalledOnce();
    expect(xrLoops.has(f.game)).toBe(false);
  });
});
