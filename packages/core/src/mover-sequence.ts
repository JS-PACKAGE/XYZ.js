/**
 * Nonzero while `runMoverSequence` runs: its moving pose snapshots follow one another with
 * only engine code between them, so only each snapshot's mover changes pose.
 */
let active = 0;
let started = 0;

/**
 * @internal Runs `run`, inside which moving pose snapshots (a physics world's
 * `withPoseSnapshot` with a mover) are separated by engine code only: no user code runs and
 * nothing but each snapshot's mover moves. Bounds that one snapshot refreshed then stay
 * known in the next, instead of every snapshot refreshing each queried collider again.
 */
export function runMoverSequence<T>(run: () => T): T {
  if (active) return run();
  active = ++started;
  try {
    return run();
  } finally {
    active = 0;
  }
}

/** @internal The running mover sequence, or 0 outside one. */
export function activeMoverSequence(): number {
  return active;
}
