interface ForceSource {
    readonly force: {
        readonly x: number;
        readonly y: number;
        readonly z?: number;
    };
    readonly torque: number | {
        readonly x: number;
        readonly y: number;
        readonly z: number;
    };
    readonly forceEpoch: number;
    clearForces(): void;
}
/** Frame forces contribute impulse over frame time, including frames with no physics tick. */
export declare class PhysicsForceAccumulator {
    private readonly impulse;
    readonly value: Float64Array<ArrayBuffer>;
    private duration;
    private readonly fixedImpulse;
    private epoch;
    private synchronize;
    sample(body: ForceSource, delta: number): void;
    discard(delta: number): void;
    sampleFixed(body: ForceSource, delta: number): void;
    /** Consume time-weighted frame impulse, plus forces submitted by the current fixed callback. */
    consume(body: ForceSource, delta: number): void;
}
export {};
