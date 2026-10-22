/**
 * @internal Runs `run`, inside which moving pose snapshots (a physics world's
 * `withPoseSnapshot` with a mover) are separated by engine code only: no user code runs and
 * nothing but each snapshot's mover moves. Bounds that one snapshot refreshed then stay
 * known in the next, instead of every snapshot refreshing each queried collider again.
 */
export declare function runMoverSequence<T>(run: () => T): T;
/** @internal The running mover sequence, or 0 outside one. */
export declare function activeMoverSequence(): number;
