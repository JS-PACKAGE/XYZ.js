import { type Texture } from '../../../assets/src/index.js';
import { Group2D } from '../gameplay/group2d.js';
import { type ColorRGBA, type Rect2D } from '../gameplay/contracts.js';
export type ParticleNozzle = {
    kind: 'point';
} | {
    kind: 'rectangle';
    width: number;
    height: number;
} | {
    kind: 'circle';
    radius: number;
};
export interface ParticleEmitterOptions {
    texture: Texture;
    source?: Rect2D;
    capacity: number;
    rate: number;
    lifetime: readonly [number, number];
    speed: readonly [number, number];
    angle: readonly [number, number];
    acceleration?: readonly [number, number];
    /** Logical width and height, not a random range or replacement source size. */
    startSize: readonly [number, number];
    endSize: readonly [number, number];
    startColor: ColorRGBA;
    endColor: ColorRGBA;
    nozzle?: ParticleNozzle;
    seed?: number;
    /** Simulation coordinates; independent of inherited world/screen rendering space. */
    space?: 'local' | 'world';
}
/** Bounded CPU simulation with borrowed texture and a fixed ordinary-Sprite pool. */
export declare class ParticleEmitter extends Group2D {
    private readonly simulationSpace;
    private readonly pool;
    private state;
    private active;
    private free;
    private freeCount;
    private count;
    private running;
    private fraction;
    private randomState;
    private readonly rate;
    private readonly lifetime;
    private readonly speed;
    private readonly angle;
    private readonly acceleration;
    private readonly startSize;
    private readonly endSize;
    private readonly startColor;
    private readonly endColor;
    private readonly nozzle;
    constructor(options: ParticleEmitterOptions);
    get activeCount(): number;
    get emitting(): boolean;
    start(): void;
    stop(): void;
    emit(count: number): void;
    clear(): void;
    /** @internal Scene invokes this after physics, never through object.update(). */
    updateSimulation(dt: number): void;
    destroy(): void;
    private assertAlive;
    private random;
    private sample;
    private spawn;
    private advance;
    private appearance;
    private retire;
}
