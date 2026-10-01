import {
  Game,
  Scene,
  Group,
  Mesh,
  Geometry,
  PBRMaterial,
  NativeTexture2D,
  Vector2,
  Vector3,
  CharacterController3D,
  BoxCollider3D,
  CapsuleCollider3D,
  RigidBody3D,
  NavigationGraph3D,
  PathFollower3D,
  UIRoot,
  UIElement,
  UILabel,
  UIButton,
  UISlider,
  UICheckbox,
  LocalStorageBackend,
  PreloadBatch,
} from '../../src/index.js';
import type {
  AudioAsset,
  AudioPlayback,
  InputContext,
  RendererPreference,
  AnimationAction,
  AnimationBlendTree,
  TwoBoneIKConstraint,
  NavigationGraphPath3D,
} from '../../src/index.js';
import { beaconRunDefaults as tuning } from '../../src/data/beacon-run.js';
import { beacons, patrol, spawn, crateSpawns } from './level.js';
import { createRunner } from './character.js';

type Mode =
  | 'loading'
  | 'menu'
  | 'playing'
  | 'paused'
  | 'settings'
  | 'won'
  | 'lost'
  | 'error'
  | 'destroyed';
interface Preferences {
  volume: number;
  muted: boolean;
  reducedMotion: boolean;
}
type BodySave = {
  position: number[];
  rotation: number[];
  velocity: number[];
  angularVelocity: number[];
};
type RunSave = {
  kind: 'run';
  outcome: 'playing' | 'won' | 'lost';
  remaining: number;
  player: number[];
  verticalVelocity: number;
  enemy: number[];
  enemyTarget: number;
  collected: boolean[];
  crates: BodySave[];
  grace: number;
};
type PreferenceSave = {
  kind: 'preferences';
  volume: number;
  muted: boolean;
  reducedMotion: boolean;
};
export interface BeaconRunReport {
  readonly mode: Mode;
  readonly score: number;
  readonly remaining: number;
  readonly player: readonly number[];
  readonly enemy: readonly number[];
  readonly collected: readonly boolean[];
  readonly paused: boolean;
  readonly grounded: boolean;
  readonly navigation: string;
  readonly ik: string;
  readonly audioUnlocked: boolean;
  readonly audioPlaying: boolean;
  readonly preferences: Readonly<Preferences>;
  readonly backend: string;
  readonly cleanup: boolean;
  readonly errors: readonly string[];
}
declare global {
  interface Window {
    readonly beaconRun: { readonly report: () => BeaconRunReport };
  }
}

const canvas = document.querySelector<HTMLCanvasElement>('#game')!;
const boot = document.querySelector<HTMLParagraphElement>('#boot')!;
const status = document.querySelector<HTMLParagraphElement>('#status')!;
const destroyButton = document.querySelector<HTMLButtonElement>('#destroy')!;
const lifetime = new AbortController();
const errors: string[] = [];
const preferences: Preferences = {
  volume: tuning.volume,
  muted: false,
  reducedMotion: false,
};
let game: Game | undefined;
let arena: BeaconScene | undefined;
let mode: Mode = 'loading';
let settingsReturn: 'menu' | 'paused' = 'menu';
let unlockPromise: Promise<void> | undefined;
let pendingRun: RunSave | undefined;
let cleanup = false;
let note = 'Loading…';
let loadGeneration = 0;
const vectorArray = (v: Readonly<Vector3>): number[] => [v.x, v.y, v.z];
function finiteArray(
  value: unknown,
  count: number,
  bound: number,
): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === count &&
    value.every(
      (n) =>
        typeof n === 'number' && Number.isFinite(n) && Math.abs(n) <= bound,
    )
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
function validSave(value: unknown): boolean {
  if (!record(value)) return false;
  if (value.kind === 'preferences')
    return (
      typeof value.volume === 'number' &&
      Number.isFinite(value.volume) &&
      value.volume >= 0 &&
      value.volume <= 1 &&
      typeof value.muted === 'boolean' &&
      typeof value.reducedMotion === 'boolean'
    );
  if (
    value.kind !== 'run' ||
    !['playing', 'won', 'lost'].includes(String(value.outcome))
  )
    return false;
  if (
    typeof value.remaining !== 'number' ||
    !Number.isFinite(value.remaining) ||
    value.remaining < 0 ||
    value.remaining > tuning.duration ||
    !finiteArray(value.player, 3, 10) ||
    value.player[1] < 0.8 ||
    value.player[1] > 4 ||
    !finiteArray(value.enemy, 3, 8) ||
    value.enemy[1] < 0.8 ||
    value.enemy[1] > 1.2 ||
    typeof value.verticalVelocity !== 'number' ||
    !Number.isFinite(value.verticalVelocity) ||
    Math.abs(value.verticalVelocity) > 20 ||
    !Number.isInteger(value.enemyTarget) ||
    Number(value.enemyTarget) < 0 ||
    Number(value.enemyTarget) >= patrol.length ||
    typeof value.grace !== 'number' ||
    !Number.isFinite(value.grace) ||
    value.grace < 0 ||
    value.grace > tuning.captureGrace ||
    !Array.isArray(value.collected) ||
    value.collected.length !== beacons.length ||
    !value.collected.every((v) => typeof v === 'boolean') ||
    !Array.isArray(value.crates) ||
    value.crates.length !== crateSpawns.length
  )
    return false;
  if (
    Math.abs(value.player[0]) > 7.7 ||
    Math.abs(value.player[2]) > 7.7 ||
    Math.abs(value.enemy[0]) > 5.1 ||
    Math.abs(value.enemy[2]) > 5.1
  )
    return false;
  return value.crates.every(
    (body) =>
      record(body) &&
      finiteArray(body.position, 3, 10) &&
      body.position[1] >= 0 &&
      finiteArray(body.rotation, 4, 1) &&
      Math.abs(Math.hypot(...body.rotation) - 1) < 0.001 &&
      finiteArray(body.velocity, 3, 30) &&
      finiteArray(body.angularVelocity, 3, 30),
  );
}
function reportError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  errors.push(message);
  if (errors.length > 20) errors.shift();
  say(message);
}
function say(message: string): void {
  note = message;
  status.textContent = message;
}
function resetInput(): void {
  game?.input.reset();
  if (arena && !arena.destroyed) {
    arena.horizontal.value = 0;
    arena.vertical.value = 0;
  }
}
function trustedUnlock(event: Event): void {
  if (!event.isTrusted || !game || !arena || cleanup || game.audio.unlocked)
    return;
  if (
    event instanceof KeyboardEvent &&
    !['Enter', 'Space'].includes(event.code)
  )
    return;
  const bounds = canvas.getBoundingClientRect();
  const soundControl = arena.audioControls.some(({ button, allowMuted }) => {
    if (preferences.muted && !allowMuted) return false;
    for (
      let node: UIElement | undefined = button;
      node;
      node = node.parent instanceof UIElement ? node.parent : undefined
    )
      if (!node.visible) return false;
    if (event instanceof PointerEvent && event.target === canvas) {
      const point = new Vector2(
        ((event.clientX - bounds.left) * game!.width) / bounds.width,
        ((event.clientY - bounds.top) * game!.height) / bounds.height,
      );
      button.toLocal(point, point);
      return (
        point.x >= 0 &&
        point.y >= 0 &&
        point.x <= button.layoutWidth &&
        point.y <= button.layoutHeight
      );
    }
    return event.target === game!.accessibility.element(button);
  });
  if (!soundControl) return;
  unlockPromise = game.audio.unlock();
  void unlockPromise.catch((error: unknown) =>
    reportError(
      new Error(
        `Audio unlock failed. Retry Start / Enable sound, or choose Play muted. ${error instanceof Error ? error.message : String(error)}`,
      ),
    ),
  );
}
canvas.addEventListener('pointerdown', trustedUnlock, {
  signal: lifetime.signal,
});
window.addEventListener('keydown', trustedUnlock, {
  capture: true,
  signal: lifetime.signal,
});
window.addEventListener('click', trustedUnlock, {
  capture: true,
  signal: lifetime.signal,
});
canvas.addEventListener(
  'pointerdown',
  () => {
    if (mode === 'playing') {
      arena?.root.focus.focus(undefined);
      canvas.focus({ preventScroll: true });
    }
  },
  { signal: lifetime.signal },
);
function releaseTouch(): void {
  game?.input.virtual.reset();
  if (arena && !arena.destroyed) {
    arena.horizontal.value = 0;
    arena.vertical.value = 0;
  }
}
for (const event of ['pointerup', 'pointercancel', 'blur'])
  window.addEventListener(event, releaseTouch, { signal: lifetime.signal });
window.addEventListener(
  'keyup',
  (event) => {
    if (
      arena &&
      (event.target === game?.accessibility.element(arena.horizontal) ||
        event.target === game?.accessibility.element(arena.vertical))
    )
      releaseTouch();
  },
  { signal: lifetime.signal },
);
window.addEventListener(
  'keydown',
  (event) => {
    if (event.code !== 'Escape' || event.repeat || cleanup) return;
    event.preventDefault();
    if (mode === 'playing') arena?.show('paused');
    else if (mode === 'paused') arena?.show('playing');
    else if (mode === 'settings') arena?.closeSettings();
  },
  { signal: lifetime.signal },
);
window.addEventListener(
  'blur',
  () => {
    if (mode === 'playing') arena?.show('paused');
  },
  { signal: lifetime.signal },
);
document.addEventListener(
  'visibilitychange',
  () => {
    if (document.hidden && mode === 'playing') arena?.show('paused');
  },
  { signal: lifetime.signal },
);

function destroy(): void {
  if (cleanup) return;
  if (
    arena &&
    ['playing', 'paused', 'settings'].includes(mode) &&
    arena.remaining > 0
  )
    void saveRun().catch(reportError);
  cleanup = true;
  mode = 'destroyed';
  loadGeneration++;
  lifetime.abort();
  game?.destroy();
  destroyButton.disabled = true;
  boot.textContent =
    'Destroyed · scene borrowers, physics, UI, audio and native texture released.';
  say('Game destroyed. Reload this page to play again.');
}
destroyButton.addEventListener('click', destroy, { signal: lifetime.signal });
window.addEventListener(
  'pagehide',
  (event) => {
    if (!event.persisted) destroy();
    else if (mode === 'playing') arena?.show('paused');
  },
  { signal: lifetime.signal },
);
Object.defineProperty(window, 'beaconRun', {
  value: Object.freeze({
    report: (): BeaconRunReport => ({
      mode,
      score: arena?.collected.filter(Boolean).length ?? 0,
      remaining: arena?.remaining ?? tuning.duration,
      player: arena ? vectorArray(arena.player.position) : [],
      enemy: arena ? vectorArray(arena.enemy.position) : [],
      collected: arena ? [...arena.collected] : [],
      paused: mode !== 'playing',
      grounded: arena?.characterController.grounded ?? false,
      navigation: arena?.follower.state ?? 'unavailable',
      ik: arena?.ik.status ?? 'unavailable',
      audioUnlocked: game?.audio.unlocked ?? false,
      audioPlaying:
        arena?.musicPlayback?.state === 'playing' &&
        !(game?.audio.paused ?? true),
      preferences: { ...preferences },
      backend: game?.graphics.backend ?? 'unavailable',
      cleanup,
      errors: [...errors],
    }),
  }),
  writable: false,
});

function mipTexture(): NativeTexture2D {
  const levels: { width: number; height: number; data: Uint8Array }[] = [];
  for (const size of [16, 8, 4, 2, 1]) {
    const data = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const offset = (y * size + x) * 4;
        const shade =
          size > 2 &&
          ((x >> Math.max(0, Math.log2(size) - 2)) +
            (y >> Math.max(0, Math.log2(size) - 2))) %
            2
            ? 205
            : 255;
        data.set([shade, shade, shade, 255], offset);
      }
    levels.push({ width: size, height: size, data });
  }
  return new NativeTexture2D({
    format: 'rgba8unorm',
    width: 16,
    height: 16,
    levels,
  });
}

class BeaconScene extends Scene {
  readonly texture = mipTexture();
  readonly player = new Group();
  readonly enemy = new Group();
  readonly characterController: CharacterController3D;
  readonly enemyController: CharacterController3D;
  readonly graph = new NavigationGraph3D({
    nodes: patrol.map((point) => ({
      id: point.name,
      position: new Vector3(point.x, spawn.y, point.z),
    })),
    connections: patrol.map((point, index) => ({
      from: point.name,
      to: patrol[(index + 1) % patrol.length]!.name,
      cost: 5,
    })),
  });
  readonly follower: PathFollower3D;
  readonly crates: Mesh[] = [];
  readonly beaconMeshes: Mesh[] = [];
  readonly collected = beacons.map(() => false);
  readonly root: UIRoot;
  readonly sidebar: UIElement;
  readonly panels = new Map<Mode, UIElement>();
  readonly firstButtons = new Map<Mode, UIButton>();
  readonly audioControls: { button: UIButton; allowMuted: boolean }[] = [];
  private jumpRequested = false;
  readonly controls: InputContext;
  readonly blend: AnimationBlendTree;
  readonly bob: AnimationAction;
  readonly ik: TwoBoneIKConstraint;
  readonly handTarget = new Vector3();
  readonly motion = new Vector3();
  readonly cameraTarget = new Vector3(-2.5, 0, 0);
  horizontal!: UISlider;
  vertical!: UISlider;
  volume!: UISlider;
  mute!: UICheckbox;
  reducedMotion!: UICheckbox;
  hud!: UILabel;
  message!: UILabel;
  music: AudioAsset | undefined;
  sfx: AudioAsset | undefined;
  musicPlayback: AudioPlayback | undefined;
  remaining: number = tuning.duration;
  grace: number = tuning.captureGrace;
  verticalVelocity = 0;
  enemyTarget = 1;
  private saveElapsed = 0;
  private hudText = '';
  private currentMessage = '';
  private messageBusy = false;
  private savePending = false;
  private hudPending = false;
  private activeModal: UIElement | undefined;
  private readonly playbacks = new Set<AudioPlayback>();

  constructor(readonly runtime: Game) {
    super();
    this.physics3D.enabled = false;
    this.animations.paused = true;
    this.ambientLight = 0.55;
    this.directionalLight.intensity = 1.8;
    this.directionalLight.direction.set(-3, 8, 4).normalize();
    this.camera3D.position.set(0, 18, 17);
    this.camera3D.lookAt(this.cameraTarget);
    this.shadows.enabled = true;
    this.shadows.extent = 20;
    this.shadows.mapSize = 1024;
    this.box([0, -0.35, 0], [16, 0.7, 16], [0.13, 0.23, 0.3]);
    for (const x of [-8.1, 8.1])
      this.box([x, 0.65, 0], [0.4, 2, 16.6], [0.25, 0.38, 0.45]);
    for (const z of [-8.1, 8.1])
      this.box([0, 0.65, z], [16.6, 2, 0.4], [0.25, 0.38, 0.45]);
    this.box([-1.4, 0.7, 0], [0.5, 1.4, 5], [0.26, 0.4, 0.48]);
    this.box([1.8, 0.7, 0], [0.5, 1.4, 5], [0.26, 0.4, 0.48]);
    const ramp = this.box([0.2, 0.25, 1], [2.4, 0.25, 3], [0.44, 0.57, 0.61]);
    ramp.rotation.setFromEuler(-0.18, 0, 0);
    for (const point of crateSpawns) {
      const crate = this.box(
        [point.x, point.y, point.z],
        [0.9, 0.9, 0.9],
        [0.9, 0.52, 0.16],
        true,
      );
      this.crates.push(crate);
    }
    for (const point of beacons) {
      const marker = this.add(
        new Mesh({
          geometry: Geometry.sphere(0.3, 12, 8),
          material: this.material([0.08, 0.95, 0.84], [0.08, 0.5, 0.4]),
          position: [point.x, 1, point.z],
        }),
      );
      this.beaconMeshes.push(marker);
      this.add(
        new Mesh({
          geometry: Geometry.cube(1),
          material: this.material([0.12, 0.65, 0.68]),
          position: [point.x, 0.02, point.z],
          scale: [1.2, 0.04, 1.2],
          castShadow: false,
        }),
      );
    }
    this.add(
      new Mesh({
        geometry: Geometry.cube(1),
        material: this.material([0.26, 0.95, 0.48], [0.1, 0.2, 0.04]),
        position: [spawn.x, 0.015, spawn.z],
        scale: [2, 0.03, 1.7],
        castShadow: false,
      }),
    );
    this.player.collider = new CapsuleCollider3D(0.32, 1.2, {
      category: 2,
      mask: 1,
    });
    this.player.position.set(spawn.x, spawn.y, spawn.z);
    this.add(this.player);
    this.characterController = new CharacterController3D(
      this.player,
      this.physics3D,
      { pushStrength: 8, stepHeight: 0.3, groundSnap: 0.12, mask: 1 },
    );
    this.enemy.collider = new CapsuleCollider3D(0.32, 1.2, {
      category: 4,
      mask: 1,
    });
    this.enemy.position.set(patrol[0]!.x, spawn.y, patrol[0]!.z);
    this.add(this.enemy);
    this.enemy.add(
      new Mesh({
        geometry: Geometry.sphere(0.45, 12, 8),
        material: this.material([1, 0.16, 0.15], [0.35, 0.02, 0.01]),
      }),
    );
    this.enemy.add(
      new Mesh({
        geometry: Geometry.cube(1),
        material: this.material([0.9, 0.36, 0.18]),
        scale: [1.25, 0.12, 0.3],
      }),
    );
    this.enemyController = new CharacterController3D(
      this.enemy,
      this.physics3D,
      { mask: 1, groundSnap: 0.12 },
    );
    this.follower = new PathFollower3D(this.enemyController, {
      speed: tuning.opponentSpeed,
      arrivalTolerance: 0.1,
    });
    this.route(0, 1);
    this.handTarget.set(beacons[0]!.x, 1.2, beacons[0]!.z);
    const rig = createRunner(
      this.player,
      this.animations,
      this.material([0.7, 0.95, 1]),
      this.handTarget,
    );
    this.blend = rig.blend;
    this.bob = rig.bob;
    this.ik = rig.ik;
    this.root = this.add(
      new UIRoot(runtime, { direction: 'row', padding: 20, gap: 12 }),
    );
    this.sidebar = this.root.add(
      new UIElement({
        direction: 'column',
        width: 276,
        height: 'fill',
        gap: 8,
      }),
    );
    this.controls = runtime.input.contexts.create('beacon-world', {
      priority: 10,
      consume: true,
      bindings: {
        left: [
          { key: 'KeyA' },
          { key: 'ArrowLeft' },
          { axis: 'leftX', direction: -1 },
          { virtual: 'beacon-x', direction: -1 },
        ],
        right: [
          { key: 'KeyD' },
          { key: 'ArrowRight' },
          { axis: 'leftX', direction: 1 },
          { virtual: 'beacon-x', direction: 1 },
        ],
        up: [
          { key: 'KeyW' },
          { key: 'ArrowUp' },
          { axis: 'leftY', direction: -1 },
          { virtual: 'beacon-z', direction: -1 },
        ],
        down: [
          { key: 'KeyS' },
          { key: 'ArrowDown' },
          { axis: 'leftY', direction: 1 },
          { virtual: 'beacon-z', direction: 1 },
        ],
        jump: [{ key: 'Space' }, { button: 'a' }, { virtual: 'beacon-jump' }],
      },
    });
  }
  material(
    color: [number, number, number],
    emissive: [number, number, number] = [0, 0, 0],
  ): PBRMaterial {
    return new PBRMaterial({
      texture: this.texture,
      color,
      emissive,
      roughness: 0.72,
      textureSampler: {
        minFilter: 'linear',
        magFilter: 'linear',
        mipmapFilter: 'linear',
        lodMinClamp: 0,
        lodMaxClamp: 4,
      },
    });
  }
  box(
    position: [number, number, number],
    size: [number, number, number],
    color: [number, number, number],
    dynamic = false,
  ): Mesh {
    const mesh = new Mesh({
      geometry: Geometry.cube(1),
      material: this.material(color),
      position,
      scale: size,
    });
    mesh.collider = new BoxCollider3D(new Vector3(0.5, 0.5, 0.5));
    mesh.body = new RigidBody3D({
      type: dynamic ? 'dynamic' : 'static',
      mass: 1.2,
      friction: 0.7,
      linearDamping: 0.25,
      angularDamping: 0.4,
    });
    return this.add(mesh);
  }
  route(from: number, to: number): void {
    this.enemyTarget = to;
    const path = this.graph.findPath(patrol[from]!.name, patrol[to]!.name);
    if (path.status !== 'found')
      throw new Error('Authored patrol route is unreachable.');
    this.follower.setPath(path);
  }
  async buildUI(): Promise<void> {
    const common = {
      layout: { width: 'fill' as const, height: 38 },
      textStyle: { fontSize: 16, color: '#eaf6ff', wrapWidth: 260 },
    };
    const label = async (
      parent: UIElement,
      text: string,
      height = 30,
    ): Promise<UILabel> =>
      parent.add(
        await UILabel.create(text, {
          ...common,
          layout: { width: 'fill', height },
        }),
      );
    const button = async (
      parent: UIElement,
      text: string,
      action: () => void | Promise<void>,
    ): Promise<UIButton> => {
      const control = parent.add(await UIButton.create(text, common));
      control.addEventListener('click', () => {
        try {
          const result = action();
          if (result) void result.catch(reportError);
        } catch (error) {
          reportError(error);
        }
      });
      return control;
    };
    await label(this.sidebar, 'BEACON RUN');
    this.hud = await label(this.sidebar, '4 beacons · 75 seconds', 30);
    this.message = await label(this.sidebar, 'Collect cyan. Avoid red.', 58);
    const panel = (key: Mode): UIElement => {
      const node = this.sidebar.add(
        new UIElement({
          direction: 'column',
          width: 'fill',
          height: 'auto',
          gap: 8,
        }),
      );
      node.setVisible(false);
      this.panels.set(key, node);
      return node;
    };
    const menu = panel('menu');
    await label(menu, 'THE FOUR SIGNALS', 32);
    await label(menu, 'Collect all four, then extract.', 30);
    this.firstButtons.set(
      'menu',
      await button(menu, 'Start with sound', () => begin(false, false)),
    );
    this.audioControls.push({
      button: this.firstButtons.get('menu')!,
      allowMuted: true,
    });
    await button(menu, 'Play muted', () => begin(true, false));
    this.audioControls.push({
      button: await button(menu, 'Continue saved run', () =>
        begin(preferences.muted, true),
      ),
      allowMuted: false,
    });
    await button(menu, 'Settings', () => this.openSettings('menu'));
    await button(menu, 'Retry asset loading', retryAssets);
    const play = panel('playing');
    this.firstButtons.set(
      'playing',
      await button(play, 'Pause', () => this.show('paused')),
    );
    await label(play, 'MOVE / TOUCH', 26);
    this.horizontal = play.add(
      await UISlider.create('Left / Right · release resets', {
        ...common,
        layout: { width: 'fill', height: 62 },
        min: -1,
        max: 1,
        step: 0.1,
        value: 0,
      }),
    );
    this.vertical = play.add(
      await UISlider.create('North / South · release resets', {
        ...common,
        layout: { width: 'fill', height: 62 },
        min: -1,
        max: 1,
        step: 0.1,
        value: 0,
      }),
    );
    this.horizontal.addEventListener('change', () =>
      this.runtime.input.virtual.set('beacon-x', this.horizontal.value),
    );
    this.vertical.addEventListener('change', () =>
      this.runtime.input.virtual.set('beacon-z', this.vertical.value),
    );
    for (const axis of [this.horizontal, this.vertical])
      for (const type of [
        'pointerup',
        'pointerupoutside',
        'pointercancel',
        'blur',
      ])
        axis.addEventListener(type, releaseTouch);
    await button(play, 'Jump', () => {
      if (mode === 'playing') this.jumpRequested = true;
    });
    await button(play, 'Return focus to arena', () => {
      resetInput();
      this.root.focus.focus(undefined);
      canvas.focus({ preventScroll: true });
    });
    const paused = panel('paused');
    await label(paused, 'RUN PAUSED', 30);
    this.firstButtons.set(
      'paused',
      await button(paused, 'Resume run', () => this.show('playing')),
    );
    await button(paused, 'Settings', () => this.openSettings('paused'));
    await button(paused, 'Save run', async () => {
      await saveRun();
      say('Run saved locally. Continue will restore it after reload.');
    });
    await button(paused, 'Load saved run', async () => {
      const saved = await loadRun();
      if (saved) {
        this.restore(saved);
        this.show('paused');
        say('Saved run restored; Resume when ready.');
      }
    });
    await button(paused, 'Restart run', () => begin(preferences.muted, false));
    await button(paused, 'Main menu', async () => {
      try {
        await saveRun();
      } finally {
        this.show('menu');
      }
    });
    const settings = panel('settings');
    await label(settings, 'SETTINGS · FOCUS TRAPPED', 32);
    this.volume = settings.add(
      await UISlider.create('Master volume', {
        ...common,
        layout: { width: 'fill', height: 64 },
        min: 0,
        max: 1,
        step: 0.05,
        value: preferences.volume,
      }),
    );
    this.volume.addEventListener('change', () => {
      preferences.volume = this.volume.value;
      this.applyPreferences();
      void savePreferences().catch(reportError);
    });
    this.mute = settings.add(
      await UICheckbox.create('Mute audio', {
        ...common,
        checked: preferences.muted,
      }),
    );
    this.mute.addEventListener('change', () => {
      preferences.muted = this.mute.checked;
      this.applyPreferences();
      void savePreferences().catch(reportError);
    });
    this.reducedMotion = settings.add(
      await UICheckbox.create('Reduced character motion', {
        ...common,
        checked: preferences.reducedMotion,
      }),
    );
    this.reducedMotion.addEventListener('change', () => {
      preferences.reducedMotion = this.reducedMotion.checked;
      this.applyPreferences();
      void savePreferences().catch(reportError);
    });
    this.audioControls.push({
      button: await button(
        settings,
        'Enable sound / retry unlock',
        async () => {
          try {
            if (!this.runtime.audio.unlocked) {
              if (!unlockPromise) unlockPromise = this.runtime.audio.unlock();
              await unlockPromise;
            }
            preferences.muted = false;
            this.mute.checked = false;
            this.applyPreferences();
            await savePreferences();
            say('Sound enabled.');
          } catch (error) {
            unlockPromise = undefined;
            throw error;
          }
        },
      ),
      allowMuted: true,
    });
    this.firstButtons.set(
      'settings',
      await button(settings, 'Back from settings', () => this.closeSettings()),
    );
    for (const result of ['won', 'lost'] as const) {
      const node = panel(result);
      await label(
        node,
        result === 'won' ? 'EXTRACTION COMPLETE' : 'SIGNAL LOST',
        34,
      );
      this.firstButtons.set(
        result,
        await button(node, 'Restart run', () =>
          begin(preferences.muted, false),
        ),
      );
      await button(node, 'Main menu', () => this.show('menu'));
    }
    const failure = panel('error');
    await label(failure, 'ASSET LOAD FAILED', 30);
    this.firstButtons.set(
      'error',
      await button(failure, 'Retry asset loading', retryAssets),
    );
    await button(failure, 'Main menu', () => this.show('menu'));
    this.applyPreferences();
  }
  applyPreferences(): void {
    this.runtime.audio.master.volume = preferences.muted
      ? 0
      : preferences.volume;
    this.bob.weight = preferences.reducedMotion ? 0 : 1;
    this.ik.weight = preferences.reducedMotion ? 0.2 : 0.6;
    this.blend.timeScale = preferences.reducedMotion ? 0.25 : 1;
    if (preferences.muted) this.musicPlayback?.stop();
    else if (mode === 'playing' && this.runtime.audio.unlocked)
      this.startMusic();
  }
  startMusic(): void {
    if (
      preferences.muted ||
      !this.music ||
      !this.runtime.audio.unlocked ||
      this.musicPlayback?.state === 'playing'
    )
      return;
    this.musicPlayback = this.music.play({
      channel: 'music',
      scene: this,
      loop: true,
    });
  }
  openSettings(from: 'menu' | 'paused'): void {
    settingsReturn = from;
    this.show('settings');
  }
  closeSettings(): void {
    this.show(settingsReturn);
  }
  show(next: Mode): void {
    if (cleanup || this.destroyed) return;
    if (this.activeModal) {
      this.root.focus.popModal();
      this.activeModal = undefined;
    }
    mode = next;
    resetInput();
    this.jumpRequested = false;
    const playing = next === 'playing';
    this.physics3D.enabled = playing;
    this.animations.paused = !playing;
    for (const [key, node] of this.panels) node.setVisible(key === next);
    if (playing) {
      this.controls.activate();
      this.follower.resume();
      this.runtime.audio.resume('beacon-gameplay');
      this.root.focus.focus(undefined);
      canvas.focus({ preventScroll: true });
      this.startMusic();
      say('Find the four cyan beacons. Extract on the green pad.');
    } else {
      this.controls.deactivate();
      this.follower.pause();
      this.runtime.audio.pause('beacon-gameplay');
      const active = this.panels.get(next);
      if (active) {
        this.activeModal = active;
        this.root.focus.pushModal(active);
        this.root.focus.focus(this.firstButtons.get(next));
      }
      if (next === 'paused') {
        say('Paused: timer, physics and animation frozen; UI remains live.');
        void saveRun().catch(reportError);
      }
    }
  }
  resetRun(): void {
    this.remaining = tuning.duration;
    this.grace = tuning.captureGrace;
    this.verticalVelocity = 0;
    this.saveElapsed = 0;
    this.player.position.set(spawn.x, spawn.y, spawn.z);
    this.player.rotation.setFromEuler(0, 0, 0);
    this.enemy.position.set(patrol[0]!.x, spawn.y, patrol[0]!.z);
    this.route(0, 1);
    this.collected.fill(false);
    for (const marker of this.beaconMeshes) marker.visible = true;
    for (let index = 0; index < this.crates.length; index++) {
      const crate = this.crates[index]!,
        point = crateSpawns[index]!;
      crate.position.set(point.x, point.y, point.z);
      crate.rotation.set(0, 0, 0, 1);
      crate.body!.velocity.set(0, 0, 0);
      crate.body!.angularVelocity.set(0, 0, 0);
      crate.body!.clearForces();
      crate.body!.wake();
    }
    this.blend.normalizedTime = 0;
    this.bob.time = 0;
    this.characterController.move(this.motion.set(0, -0.01, 0));
  }
  snapshot(): RunSave {
    return {
      kind: 'run',
      outcome: mode === 'won' ? 'won' : mode === 'lost' ? 'lost' : 'playing',
      remaining: this.remaining,
      player: vectorArray(this.player.position),
      verticalVelocity: this.verticalVelocity,
      enemy: vectorArray(this.enemy.position),
      enemyTarget: this.enemyTarget,
      collected: [...this.collected],
      grace: this.grace,
      crates: this.crates.map((crate) => ({
        position: vectorArray(crate.position),
        rotation: [
          crate.rotation.x,
          crate.rotation.y,
          crate.rotation.z,
          crate.rotation.w,
        ],
        velocity: vectorArray(crate.body!.velocity),
        angularVelocity: vectorArray(crate.body!.angularVelocity),
      })),
    };
  }
  restore(save: RunSave): void {
    if (!validSave(save) || save.outcome !== 'playing' || save.remaining <= 0)
      throw new Error(
        'This save is not a playable unfinished run. Start a new run.',
      );
    this.remaining = save.remaining;
    this.grace = save.grace;
    this.verticalVelocity = save.verticalVelocity;
    this.player.position.set(save.player[0]!, save.player[1]!, save.player[2]!);
    this.enemy.position.set(save.enemy[0]!, save.enemy[1]!, save.enemy[2]!);
    this.enemyTarget = save.enemyTarget;
    const target = this.graph.nodes[save.enemyTarget]!;
    const route: NavigationGraphPath3D = {
      status: 'found',
      nodes: [target],
      cost: Math.hypot(
        this.enemy.position.x - target.position.x,
        this.enemy.position.y - target.position.y,
        this.enemy.position.z - target.position.z,
      ),
    };
    this.follower.setPath(route);
    for (let index = 0; index < beacons.length; index++) {
      this.collected[index] = save.collected[index]!;
      this.beaconMeshes[index]!.visible = !save.collected[index];
    }
    for (let index = 0; index < this.crates.length; index++) {
      const crate = this.crates[index]!,
        state = save.crates[index]!;
      crate.position.set(
        state.position[0]!,
        state.position[1]!,
        state.position[2]!,
      );
      crate.rotation.set(
        state.rotation[0]!,
        state.rotation[1]!,
        state.rotation[2]!,
        state.rotation[3]!,
      );
      crate.body!.velocity.set(
        state.velocity[0]!,
        state.velocity[1]!,
        state.velocity[2]!,
      );
      crate.body!.angularVelocity.set(
        state.angularVelocity[0]!,
        state.angularVelocity[1]!,
        state.angularVelocity[2]!,
      );
      crate.body!.clearForces();
      crate.body!.wake();
    }
    this.characterController.move(this.motion.set(0, -0.001, 0));
    resetInput();
  }
  effect(): void {
    if (preferences.muted || !this.runtime.audio.unlocked || !this.sfx) return;
    for (const playback of this.playbacks)
      if (playback.state !== 'playing') this.playbacks.delete(playback);
    this.playbacks.add(this.sfx.play({ channel: 'sfx', scene: this }));
  }
  override update(delta: number): void {
    if (mode === 'playing') {
      const dt = Math.min(delta, tuning.maxFrameDelta);
      let x = this.controls.value('right') - this.controls.value('left');
      let z = this.controls.value('down') - this.controls.value('up');
      const length = Math.hypot(x, z);
      if (length > 1) {
        x /= length;
        z /= length;
      }
      if (
        (this.jumpRequested || this.controls.wasPressed('jump')) &&
        this.characterController.grounded
      )
        this.verticalVelocity = tuning.jumpSpeed;
      this.jumpRequested = false;
      this.verticalVelocity -= tuning.gravity * dt;
      const movement = this.characterController.move(
        this.motion.set(
          x * tuning.playerSpeed * dt,
          this.verticalVelocity * dt,
          z * tuning.playerSpeed * dt,
        ),
      );
      if (movement.grounded && this.verticalVelocity < 0)
        this.verticalVelocity = 0;
      if (length > 0.08)
        this.player.rotation.setFromEuler(0, Math.atan2(x, z), 0);
      this.blend.setParameter(Math.min(1, length));
      this.follower.update(dt);
      if (this.follower.state === 'finished')
        this.route(this.enemyTarget, (this.enemyTarget + 1) % patrol.length);
      if (this.follower.state === 'blocked') this.follower.resume();
      this.remaining = Math.max(0, this.remaining - dt);
      this.grace = Math.max(0, this.grace - dt);
      let nearest = -1,
        distance = Infinity;
      for (let index = 0; index < beacons.length; index++) {
        const point = beacons[index]!;
        if (!this.collected[index]) {
          const d = Math.hypot(
            point.x - this.player.position.x,
            point.z - this.player.position.z,
          );
          if (d < distance) {
            distance = d;
            nearest = index;
          }
          if (d < tuning.collectionRadius && this.player.position.y < 2.2) {
            this.collected[index] = true;
            this.beaconMeshes[index]!.visible = false;
            this.effect();
            say(
              `${point.name} beacon collected. ${this.collected.filter(Boolean).length}/4 signals online.`,
            );
            void saveRun().catch(reportError);
          }
        }
        if (!preferences.reducedMotion)
          this.beaconMeshes[index]!.rotation.setFromEuler(
            0,
            (tuning.duration - this.remaining) * 1.5,
            0,
          );
      }
      const goal = nearest >= 0 ? beacons[nearest]! : spawn;
      this.handTarget.set(goal.x, 1.25, goal.z);
      if (
        this.grace === 0 &&
        Math.hypot(
          this.player.position.x - this.enemy.position.x,
          this.player.position.y - this.enemy.position.y,
          this.player.position.z - this.enemy.position.z,
        ) < tuning.captureRadius
      )
        this.finish(
          'lost',
          'The patrol intercepted you. Try the outer loop or jump past the drone.',
        );
      else if (this.remaining === 0)
        this.finish(
          'lost',
          'The signal window closed. Collect faster and return to the green extraction pad.',
        );
      else if (
        this.collected.every(Boolean) &&
        Math.hypot(
          this.player.position.x - spawn.x,
          this.player.position.z - spawn.z,
        ) < 1 &&
        this.player.position.y < 1.5
      )
        this.finish(
          'won',
          `All signals secured · ${Math.ceil(this.remaining)} seconds to spare!`,
        );
      this.saveElapsed += dt;
      if (
        this.saveElapsed >= tuning.autosaveSeconds &&
        !this.savePending &&
        mode === 'playing'
      ) {
        this.saveElapsed = 0;
        this.savePending = true;
        void saveRun()
          .catch(reportError)
          .finally(() => {
            this.savePending = false;
          });
      }
    }
    const text = `${this.collected.filter(Boolean).length}/4 SIGNALS · ${Math.ceil(this.remaining)}s`;
    if (text !== this.hudText && !this.hudPending && this.hud) {
      this.hudText = text;
      this.hudPending = true;
      void this.hud
        .setText(text)
        .catch(reportError)
        .finally(() => {
          this.hudPending = false;
        });
    }
    if (note !== this.currentMessage && !this.messageBusy && this.message) {
      this.currentMessage = note;
      this.messageBusy = true;
      const short = note.length > 62 ? `${note.slice(0, 59)}…` : note;
      void this.message
        .setText(short)
        .catch(reportError)
        .finally(() => {
          this.messageBusy = false;
        });
    }
  }
  finish(result: 'won' | 'lost', message: string): void {
    this.effect();
    this.show(result);
    this.musicPlayback?.stop();
    say(message);
    void saveRun().catch(reportError);
  }
  protected override onDestroy(): void {
    this.controls.destroy();
    this.follower.destroy();
    this.characterController.destroy();
    this.enemyController.destroy();
    this.musicPlayback?.stop();
    for (const playback of this.playbacks) playback.stop();
    this.playbacks.clear();
    this.runtime.audio.resume('beacon-gameplay');
    // Scene destroys its mesh/UI borrowers before releasing the shared native mip texture.
    this.texture.destroy();
  }
}

async function savePreferences(): Promise<void> {
  if (!game || cleanup) return;
  const data: PreferenceSave = { kind: 'preferences', ...preferences };
  await game.saves.save('preferences', data);
}
async function saveRun(): Promise<void> {
  if (!game || !arena || arena.destroyed) return;
  const data = arena.snapshot();
  await game.saves.save('continuation', data, tuning.duration - data.remaining);
  pendingRun =
    data.outcome === 'playing' && data.remaining > 0 ? data : undefined;
}
async function loadRun(): Promise<RunSave | undefined> {
  if (!game) return undefined;
  const result = await game.saves.load('continuation');
  if (result.status === 'missing') {
    say('No saved run yet. Start a run; progress is autosaved.');
    return undefined;
  }
  if (result.status === 'corrupt') {
    reportError(
      new Error(
        `Saved run is corrupt: ${result.error.message} Start a new run to replace it.`,
      ),
    );
    return undefined;
  }
  if (
    !validSave(result.record.data) ||
    !record(result.record.data) ||
    result.record.data.kind !== 'run'
  )
    throw new Error('Save does not contain Beacon Run state.');
  const save = result.record.data as unknown as RunSave;
  if (save.outcome !== 'playing' || save.remaining <= 0) {
    say('That run already ended. Start a new run.');
    return undefined;
  }
  return save;
}
let beginning = false;
async function begin(muted: boolean, continuation: boolean): Promise<void> {
  if (beginning || !arena || !game || cleanup) return;
  beginning = true;
  try {
    if (!arena.music || !arena.sfx) {
      arena.show('error');
      say('Assets are not loaded. Choose Retry asset loading before Start.');
      return;
    }
    preferences.muted = muted;
    if (!muted && !game.audio.unlocked) {
      if (!unlockPromise) unlockPromise = game.audio.unlock();
      try {
        await unlockPromise;
      } catch (error) {
        unlockPromise = undefined;
        throw new Error(
          `Audio is unavailable. Retry Start with a trusted click, or choose Play muted. ${error instanceof Error ? error.message : String(error)}`,
          { cause: error },
        );
      }
    }
    if (cleanup) return;
    const save = continuation ? await loadRun() : undefined;
    if (continuation && !save) return;
    if (save) arena.restore(save);
    else arena.resetRun();
    arena.mute.checked = muted;
    arena.applyPreferences();
    try {
      await savePreferences();
    } catch (error) {
      reportError(error);
    }
    if (cleanup) return;
    arena.show('playing');
    await saveRun();
  } catch (error) {
    reportError(error);
  } finally {
    beginning = false;
  }
}
async function retryAssets(): Promise<void> {
  if (!game || !arena || cleanup) return;
  const generation = ++loadGeneration;
  arena.show('loading');
  boot.textContent = 'Retrying real asset fetches…';
  const urls = [
    new URL('../sprite/music.json', import.meta.url).href,
    new URL('../sprite/sfx.json', import.meta.url).href,
  ];
  try {
    const batch = new PreloadBatch(
      urls.map((url, index) => game!.audio.opmTask(`retry-${index}`, url)),
    );
    batch.addEventListener('progress', () => {
      boot.textContent = `Asset retry · ${batch.progress.completed}/${batch.progress.total}`;
    });
    await batch.load({ signal: lifetime.signal });
    const [music, sfx] = await Promise.all(
      urls.map((url) => game!.audio.load(url, { signal: lifetime.signal })),
    );
    if (cleanup || generation !== loadGeneration) return;
    arena.music = music;
    arena.sfx = sfx;
    arena.show('menu');
    boot.textContent =
      'Ready · official OPM assets fetched; trusted Start decodes/unlocks sound.';
    say('Assets ready. Choose Start with sound or Play muted.');
  } catch (error) {
    if (!cleanup) {
      arena.show('error');
      reportError(error);
    }
  }
}

try {
  const requested =
    new URLSearchParams(location.search).get('renderer') ?? 'auto';
  if (!['auto', 'webgpu', 'webgl2', 'canvas2d'].includes(requested))
    throw new Error('Unknown renderer. Use auto, webgpu, webgl2 or canvas2d.');
  game = await Game.create({
    canvas,
    width: tuning.width,
    height: tuning.height,
    renderer: requested as RendererPreference,
    saveStorage: new LocalStorageBackend('beacon-run'),
    saveSchema: { version: 1, validate: validSave },
    antialias: true,
  });
  if (!game.graphics.capabilities.threeD)
    throw new Error(
      'Beacon Run requires WebGPU or WebGL2. Canvas2D is 2D-only; no 3D fallback is claimed. Try ?renderer=webgl2 on a supported browser.',
    );
  game.addEventListener('error', (event) => {
    reportError((event as CustomEvent<Error>).detail);
    if (!cleanup && arena) arena.show('paused');
  });
  game.addEventListener('graphicslost', () => {
    if (mode === 'playing') arena?.show('paused');
    say('Graphics context lost; waiting for recovery. Your run is paused.');
  });
  game.addEventListener('graphicsrecovered', () =>
    say('Graphics recovered. Resume your paused run.'),
  );
  try {
    const saved = await game.saves.load('preferences');
    if (
      saved.status === 'loaded' &&
      record(saved.record.data) &&
      saved.record.data.kind === 'preferences'
    ) {
      const values = saved.record.data as unknown as PreferenceSave;
      preferences.volume = values.volume;
      preferences.muted = values.muted;
      preferences.reducedMotion = values.reducedMotion;
    } else if (saved.status === 'corrupt')
      reportError(
        new Error(
          'Stored preferences are corrupt. Default preferences are active; settings will replace them.',
        ),
      );
    pendingRun = await loadRun();
  } catch (error) {
    reportError(
      new Error(
        `Local storage is unavailable. You can play, but save/continue may fail. ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
  arena = new BeaconScene(game);
  await arena.buildUI();
  await game.setScene(arena, {
    warmup: {
      maxItems: 3,
      maxMilliseconds: 5,
      signal: lifetime.signal,
      onProgress: (progress) => {
        boot.textContent = `Preparing arena pipelines · ${progress.completed}/${progress.total}`;
      },
    },
  });
  arena.show('loading');
  game.start();
  await retryAssets();
  if (arena.music && arena.sfx && pendingRun)
    say(
      'Saved run found. Continue restores your signals, time, player, patrol and dynamic crates.',
    );
} catch (error) {
  reportError(error);
  mode = 'error';
  boot.textContent =
    'Unable to prepare Beacon Run. Check the error below; reload to retry renderer initialization.';
  game?.destroy();
}
