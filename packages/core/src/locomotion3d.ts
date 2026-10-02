import { Vector3 } from '../../math/src/index.js';
import { locomotion3DDefaults as defaults } from '../../../src/data/locomotion3d.js';
import { AnimationMixer, type AnimationAction } from './animation.js';
import {
  AnimationRootMotion,
  rotateAnimationVector,
} from './animation-root-motion.js';
import {
  AnimationStateMachine,
  type AnimationStateDefinition,
} from './animation-state.js';
import type { Object3D } from './object3d.js';
import type {
  CharacterController3D,
  CharacterMoveResult3D,
  CharacterMovementOptions3D,
} from './physics3d/character.js';

export type LocomotionPhase3D = 'idle' | 'walk' | 'run' | 'jump' | 'fall';
export interface LocomotionAnimation3D extends AnimationStateDefinition {
  /** Authored horizontal metres/second at timeScale=1; matches playback to requested speed. */
  motionSpeed?: number;
}
export interface LocomotionInput3D {
  /** World-space horizontal stick, clamped to unit length. +Z is the body's forward axis. */
  x: number;
  z: number;
  run?: boolean;
  /** Rising edge, buffered until one fixed tick; held jump never repeats. */
  jump?: boolean;
  /** Optional world yaw in radians, independent of movement direction. */
  yaw?: number;
}
export interface CharacterLocomotionOptions3D {
  /** Borrowed visual/skeleton root, distinct from the capsule owner. Unit scale required. */
  root: Object3D;
  animations: Readonly<Record<string, LocomotionAnimation3D>>;
  /** Maps gameplay phases to authored state names. No game-specific clip names are assumed. */
  states: Readonly<Record<LocomotionPhase3D, string>>;
  /** Velocity uses in-place clips; root-motion consumes grounded strides. Air control uses velocity. */
  movement?: 'velocity' | 'root-motion';
  walkSpeed?: number;
  runSpeed?: number;
  acceleration?: number;
  deceleration?: number;
  gravity?: number;
  jumpSpeed?: number;
  terminalSpeed?: number;
  turnSpeed?: number;
  fadeDuration?: number;
}
function positive(value: number, label: string, zero = false): number {
  if (!Number.isFinite(value) || (zero ? value < 0 : value <= 0))
    throw new RangeError(
      `${label} must be finite and ${zero ? 'nonnegative' : 'positive'}.`,
    );
  return value;
}
function yawOf(rotation: {
  x: number;
  y: number;
  z: number;
  w: number;
}): number {
  return Math.atan2(
    2 * (rotation.w * rotation.y + rotation.x * rotation.z),
    1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z),
  );
}

/**
 * Fixed-step upright capsule locomotion, not a universal controller: no climbing, swimming,
 * arbitrary gravity, root pitch/roll, root vertical jumps, or automatic navigation.
 * Owns an independent mixer/state machine; borrows controller, clips and pose targets.
 * Never register this mixer with Scene animations or advance it outside fixedUpdate.
 */
export class CharacterLocomotion3D {
  readonly mixer = new AnimationMixer();
  readonly animation: AnimationStateMachine;
  /** Borrowed reusable measured velocity, excluding support carry and penetration recovery. */
  readonly velocity = new Vector3();
  private readonly commanded = new Vector3();
  private readonly displacement = new Vector3();
  private readonly rootDelta = new Vector3();
  private readonly worldDelta = new Vector3();
  private readonly movementOptions: CharacterMovementOptions3D = {};
  private readonly bindings: AnimationRootMotion;
  private readonly actions: readonly AnimationAction[];
  private readonly walkSpeed: number;
  private readonly runSpeed: number;
  private readonly acceleration: number;
  private readonly deceleration: number;
  private readonly gravity: number;
  private readonly jumpSpeed: number;
  private readonly terminalSpeed: number;
  private readonly turnSpeed: number;
  private readonly fadeDuration: number;
  private x = 0;
  private z = 0;
  private running = false;
  private yaw: number | undefined;
  private jumpHeld = false;
  private jumpPending = false;
  private verticalSpeed = 0;
  private rootYaw = 0;
  private pausedState = false;
  private stopped = false;
  private disposed = false;
  private updating = false;
  private generation = 0;
  private lastEpoch: number | undefined;
  private manualAnimation = false;
  private phaseState: LocomotionPhase3D = 'idle';
  private moveResult: CharacterMoveResult3D | undefined;

  constructor(
    readonly controller: CharacterController3D,
    private readonly options: CharacterLocomotionOptions3D,
  ) {
    if (
      controller.destroyed ||
      controller.object.destroyed ||
      options.root === controller.object
    )
      throw new Error(
        'Locomotion requires a live borrowed controller and a distinct visual root.',
      );
    if (
      options.movement !== undefined &&
      options.movement !== 'velocity' &&
      options.movement !== 'root-motion'
    )
      throw new RangeError('Unknown locomotion movement mode.');
    this.walkSpeed = positive(
      options.walkSpeed ?? defaults.walkSpeed,
      'walkSpeed',
    );
    this.runSpeed = positive(options.runSpeed ?? defaults.runSpeed, 'runSpeed');
    this.acceleration = positive(
      options.acceleration ?? defaults.acceleration,
      'acceleration',
    );
    this.deceleration = positive(
      options.deceleration ?? defaults.deceleration,
      'deceleration',
    );
    this.gravity = positive(
      options.gravity ?? defaults.gravity,
      'gravity',
      true,
    );
    this.jumpSpeed = positive(
      options.jumpSpeed ?? defaults.jumpSpeed,
      'jumpSpeed',
    );
    this.terminalSpeed = positive(
      options.terminalSpeed ?? defaults.terminalSpeed,
      'terminalSpeed',
    );
    this.turnSpeed = positive(
      options.turnSpeed ?? defaults.turnSpeed,
      'turnSpeed',
      true,
    );
    this.fadeDuration = positive(
      options.fadeDuration ?? defaults.fadeDuration,
      'fadeDuration',
      true,
    );
    const definitions = Object.values(options.animations);
    if (!definitions.length || definitions.length > defaults.maxStates)
      throw new RangeError(
        'Locomotion animation count exceeds its finite state limit.',
      );
    for (const phase of ['idle', 'walk', 'run', 'jump', 'fall'] as const)
      if (!Object.hasOwn(options.animations, options.states[phase]))
        throw new RangeError(`Missing locomotion animation for ${phase}.`);
    for (const definition of definitions) {
      if (definition.motionSpeed !== undefined)
        positive(definition.motionSpeed, 'motionSpeed');
      if (definition.speed !== undefined)
        positive(definition.speed, 'animation speed', true);
      for (const track of definition.clip.tracks)
        if (
          track.target === controller.object ||
          (track.target === options.root && track.path === 'scale')
        )
          throw new Error(
            'Locomotion clips cannot animate the capsule owner or scale the extracted root.',
          );
    }
    this.bindings = new AnimationRootMotion(options.root, {
      sink: (delta) => {
        // External mixer advances cannot enqueue a displacement for a later physics tick.
        if (!this.updating || this.pausedState || this.stopped || this.disposed)
          return;
        this.rootDelta.copy(delta.translation);
        this.rootYaw = yawOf(delta.rotation);
      },
    });
    this.actions = definitions.map((definition) =>
      this.mixer.clipAction(definition.clip),
    );
    for (const action of this.actions)
      if (
        action.clip.tracks.some(
          (track) =>
            track.target === options.root &&
            (track.path === 'translation' || track.path === 'rotation'),
        )
      )
        action.setRootMotion(this.bindings);
    this.animation = new AnimationStateMachine(this.mixer, {
      states: options.animations,
      initial: options.states.idle,
    });
  }
  get destroyed(): boolean {
    return this.disposed;
  }
  get paused(): boolean {
    return this.pausedState;
  }
  set paused(value: boolean) {
    if (this.disposed) return;
    this.pausedState = value;
    this.mixer.paused = value;
    this.cancelPending();
  }
  get phase(): LocomotionPhase3D {
    return this.phaseState;
  }
  /** Last borrowed controller result; carries support/contact/block information. */
  get result(): CharacterMoveResult3D | undefined {
    return this.moveResult;
  }
  get requestedSpeed(): number {
    return Math.hypot(this.commanded.x, this.commanded.z);
  }

  setInput(input: LocomotionInput3D): void {
    if (this.disposed) return;
    if (
      !Number.isFinite(input.x) ||
      !Number.isFinite(input.z) ||
      (input.yaw !== undefined && !Number.isFinite(input.yaw))
    )
      throw new RangeError('Locomotion input must be finite.');
    const length = Math.hypot(input.x, input.z);
    this.x = length > 1 ? input.x / length : input.x;
    this.z = length > 1 ? input.z / length : input.z;
    this.running = input.run ?? false;
    this.yaw = input.yaw;
    if (input.jump && !this.jumpHeld && !this.pausedState && !this.stopped)
      this.jumpPending = true;
    this.jumpHeld = input.jump ?? false;
  }
  /** Explicit authored state/rate override until useAutomaticAnimation; same state does not rewind. */
  requestAnimation(name: string, rate = 1, fade = this.fadeDuration): void {
    if (this.disposed) return;
    positive(rate, 'animation rate', true);
    positive(fade, 'fade duration', true);
    if (!Object.hasOwn(this.options.animations, name))
      throw new RangeError(`Unknown locomotion animation ${name}.`);
    this.manualAnimation = true;
    if (this.animation.current !== name) this.animation.setState(name, fade);
    this.animation.action.timeScale = rate;
  }
  useAutomaticAnimation(): void {
    this.manualAnimation = false;
  }
  /** Seek changes clip time only, never accumulated body motion; interrupts outgoing fades. */
  seek(time: number): void {
    positive(time, 'seek time', true);
    if (this.disposed) return;
    const name = this.animation.current;
    const rate = this.animation.action.timeScale;
    this.cancelPending();
    this.mixer.stopAll();
    this.animation.setState(name, 0);
    this.animation.action.timeScale = rate;
    this.animation.action.time = time;
  }
  /** Freezes physics and animation until start(), cancelling jump/velocity/root work. */
  stop(): void {
    if (this.disposed) return;
    this.stopped = true;
    this.cancelPending();
    this.mixer.stopAll();
    this.commanded.set(0, 0, 0);
    this.velocity.set(0, 0, 0);
    this.verticalSpeed = 0;
  }
  start(): void {
    if (this.disposed) return;
    this.stopped = false;
    this.cancelPending();
    this.animation.action.play();
  }
  private cancelPending(): void {
    this.generation++;
    this.rootDelta.set(0, 0, 0);
    this.rootYaw = 0;
    this.jumpPending = false;
  }
  /** Call once per gameplay fixed epoch, after input/platform transforms and before world physics. */
  fixedUpdate(
    delta: number,
    epoch?: number,
  ): CharacterMoveResult3D | undefined {
    if (!Number.isFinite(delta) || delta < 0 || delta > defaults.maxFixedDelta)
      throw new RangeError(
        `Locomotion fixed delta must be 0..${defaults.maxFixedDelta} seconds.`,
      );
    if (epoch !== undefined && (!Number.isSafeInteger(epoch) || epoch < 0))
      throw new RangeError(
        'Locomotion epoch must be a nonnegative safe integer.',
      );
    if (
      this.disposed ||
      this.controller.destroyed ||
      this.options.root.destroyed ||
      this.controller.object.destroyed ||
      this.pausedState ||
      this.mixer.paused ||
      this.stopped ||
      !this.controller.world.enabled ||
      delta === 0
    )
      return this.moveResult;
    if (this.updating)
      throw new Error('Locomotion fixedUpdate is not reentrant.');
    if (epoch !== undefined && epoch === this.lastEpoch) return this.moveResult;
    if (
      epoch !== undefined &&
      this.lastEpoch !== undefined &&
      epoch < this.lastEpoch
    )
      throw new RangeError('Locomotion epochs must increase.');
    this.lastEpoch = epoch;
    this.updating = true;
    const generation = this.generation;
    try {
      const speed = this.running ? this.runSpeed : this.walkSpeed;
      const tx = this.x * speed,
        tz = this.z * speed;
      const dx = tx - this.commanded.x,
        dz = tz - this.commanded.z;
      const distance = Math.hypot(dx, dz);
      const step =
        (tx === 0 && tz === 0 ? this.deceleration : this.acceleration) * delta;
      const factor = distance > 0 ? Math.min(1, step / distance) : 0;
      this.commanded.x += dx * factor;
      this.commanded.z += dz * factor;
      const moving = this.requestedSpeed > defaults.movingThreshold;
      const rotation = this.controller.object.rotation;
      let yaw = yawOf(rotation);
      const desiredYaw =
        this.yaw ??
        (moving ? Math.atan2(this.commanded.x, this.commanded.z) : yaw);
      const difference = Math.atan2(
        Math.sin(desiredYaw - yaw),
        Math.cos(desiredYaw - yaw),
      );
      yaw += Math.max(
        -this.turnSpeed * delta,
        Math.min(this.turnSpeed * delta, difference),
      );
      let jumped = false;
      if (this.jumpPending && this.controller.grounded) {
        this.verticalSpeed = this.jumpSpeed;
        jumped = true;
      }
      this.jumpPending = false;
      if (this.controller.grounded && this.verticalSpeed < 0)
        this.verticalSpeed = 0;
      this.verticalSpeed = Math.max(
        -this.terminalSpeed,
        this.verticalSpeed - this.gravity * delta,
      );
      this.phaseState =
        jumped || this.verticalSpeed > 0
          ? 'jump'
          : !this.controller.grounded
            ? 'fall'
            : moving
              ? this.running
                ? 'run'
                : 'walk'
              : 'idle';
      if (!this.manualAnimation) {
        const name = this.options.states[this.phaseState];
        if (this.animation.current !== name)
          this.animation.setState(name, this.fadeDuration);
        const definition = this.options.animations[name]!;
        this.animation.action.timeScale =
          moving && definition.motionSpeed !== undefined
            ? this.requestedSpeed / definition.motionSpeed
            : (definition.speed ?? 1);
      }
      this.rootDelta.set(0, 0, 0);
      this.rootYaw = 0;
      this.mixer.update(delta);
      // Pause, stop, seek, destroy from animation callbacks cancels this entire pending move.
      if (
        generation !== this.generation ||
        this.disposed ||
        this.mixer.paused ||
        this.controller.destroyed ||
        this.controller.object.destroyed ||
        this.options.root.destroyed
      )
        return this.moveResult;
      rotation.setFromEuler(0, yaw, 0);
      if (
        this.options.movement === 'root-motion' &&
        this.controller.grounded &&
        !jumped
      ) {
        this.rootDelta.y = 0;
        if (!moving && !this.manualAnimation) {
          this.rootDelta.set(0, 0, 0);
          this.rootYaw = 0;
        }
        rotateAnimationVector(rotation, this.rootDelta, this.worldDelta);
        this.displacement.set(
          this.worldDelta.x,
          this.verticalSpeed * delta,
          this.worldDelta.z,
        );
      } else {
        this.rootYaw = 0;
        this.displacement.set(
          this.commanded.x * delta,
          this.verticalSpeed * delta,
          this.commanded.z * delta,
        );
      }
      this.movementOptions.epoch = epoch;
      this.movementOptions.detachSupport = jumped;
      const result = this.controller.move(
        this.displacement,
        this.movementOptions,
      );
      this.moveResult = result;
      this.velocity.set(
        result.locomotionDisplacement.x / delta,
        result.locomotionDisplacement.y / delta,
        result.locomotionDisplacement.z / delta,
      );
      if (result.grounded && this.verticalSpeed < 0) this.verticalSpeed = 0;
      if (this.verticalSpeed > 0)
        for (const contact of result.contacts)
          if (contact.normal.y < -0.5) {
            this.verticalSpeed = 0;
            break;
          }
      // Capsule rotation cannot bypass a sweep; only yaw is supported by this upright profile.
      if (this.options.movement === 'root-motion')
        rotation.setFromEuler(0, yawOf(rotation) + this.rootYaw, 0);
      return result;
    } finally {
      this.rootDelta.set(0, 0, 0);
      this.rootYaw = 0;
      this.updating = false;
    }
  }
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.cancelPending();
    this.animation.destroy();
    for (const action of this.actions) action.releaseRootMotion();
    this.mixer.destroy();
    this.velocity.set(0, 0, 0);
    this.commanded.set(0, 0, 0);
    this.moveResult = undefined;
  }
}
