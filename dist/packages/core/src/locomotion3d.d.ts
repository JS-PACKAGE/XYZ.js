import { Vector3 } from '../../math/src/index.js';
import { AnimationMixer } from './animation.js';
import { AnimationStateMachine, type AnimationStateDefinition } from './animation-state.js';
import type { Object3D } from './object3d.js';
import type { CharacterController3D, CharacterMoveResult3D } from './physics3d/character.js';
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
/**
 * Fixed-step upright capsule locomotion, not a universal controller: no climbing, swimming,
 * arbitrary gravity, root pitch/roll, root vertical jumps, or automatic navigation.
 * Owns an independent mixer/state machine; borrows controller, clips and pose targets.
 * Never register this mixer with Scene animations or advance it outside fixedUpdate.
 */
export declare class CharacterLocomotion3D {
    readonly controller: CharacterController3D;
    private readonly options;
    readonly mixer: AnimationMixer;
    readonly animation: AnimationStateMachine;
    /** Borrowed reusable measured velocity, excluding support carry and penetration recovery. */
    readonly velocity: Vector3;
    private readonly commanded;
    private readonly displacement;
    private readonly rootDelta;
    private readonly worldDelta;
    private readonly movementOptions;
    private readonly bindings;
    private readonly actions;
    private readonly walkSpeed;
    private readonly runSpeed;
    private readonly acceleration;
    private readonly deceleration;
    private readonly gravity;
    private readonly jumpSpeed;
    private readonly terminalSpeed;
    private readonly turnSpeed;
    private readonly fadeDuration;
    private x;
    private z;
    private running;
    private yaw;
    private jumpHeld;
    private jumpPending;
    private verticalSpeed;
    private rootYaw;
    private pausedState;
    private stopped;
    private disposed;
    private updating;
    private generation;
    private lastEpoch;
    private manualAnimation;
    private phaseState;
    private moveResult;
    constructor(controller: CharacterController3D, options: CharacterLocomotionOptions3D);
    get destroyed(): boolean;
    get paused(): boolean;
    set paused(value: boolean);
    get phase(): LocomotionPhase3D;
    /** Last borrowed controller result; carries support/contact/block information. */
    get result(): CharacterMoveResult3D | undefined;
    get requestedSpeed(): number;
    setInput(input: LocomotionInput3D): void;
    /** Explicit authored state/rate override until useAutomaticAnimation; same state does not rewind. */
    requestAnimation(name: string, rate?: number, fade?: number): void;
    useAutomaticAnimation(): void;
    /** Seek changes clip time only, never accumulated body motion; interrupts outgoing fades. */
    seek(time: number): void;
    /** Freezes physics and animation until start(), cancelling jump/velocity/root work. */
    stop(): void;
    start(): void;
    private cancelPending;
    /** Call once per gameplay fixed epoch, after input/platform transforms and before world physics. */
    fixedUpdate(delta: number, epoch?: number): CharacterMoveResult3D | undefined;
    destroy(): void;
}
