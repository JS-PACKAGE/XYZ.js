import { Vector3 } from '../../../math/src/math3d.js';

function speedValue(speed: number): void {
  if (!Number.isFinite(speed) || speed < 0)
    throw new RangeError('Steering speed must be finite and nonnegative.');
}

/** Desired velocity, not force; caller owns output and integrates using seconds. */
export function steeringSeek(
  position: Readonly<Vector3>,
  target: Readonly<Vector3>,
  speed: number,
  out: Vector3,
): Vector3 {
  speedValue(speed);
  out.set(target.x - position.x, target.y - position.y, target.z - position.z);
  const distance = out.length();
  if (!Number.isFinite(distance))
    throw new RangeError('Steering positions must be finite.');
  return distance > 0 ? out.scale(speed / distance) : out;
}
export function steeringFlee(
  position: Readonly<Vector3>,
  threat: Readonly<Vector3>,
  speed: number,
  out: Vector3,
): Vector3 {
  steeringSeek(position, threat, speed, out);
  return out.scale(-1);
}
export function steeringArrive(
  position: Readonly<Vector3>,
  target: Readonly<Vector3>,
  speed: number,
  slowingRadius: number,
  out: Vector3,
): Vector3 {
  if (!Number.isFinite(slowingRadius) || slowingRadius <= 0)
    throw new RangeError('Slowing radius must be positive.');
  steeringSeek(position, target, speed, out);
  const distance = Math.hypot(
    target.x - position.x,
    target.y - position.y,
    target.z - position.z,
  );
  return out.scale(Math.min(1, distance / slowingRadius));
}

/** Deterministic XZ wander; independent state, no Math.random or frame-rate dependent jitter. */
export class SteeringWander3D {
  private state: number;
  private angle = 0;
  constructor(
    seed = 1,
    readonly turnRate = 2,
    readonly interval = 0.25,
  ) {
    if (
      !Number.isInteger(seed) ||
      !Number.isFinite(turnRate) ||
      turnRate < 0 ||
      !Number.isFinite(interval) ||
      interval < 1 / 120
    )
      throw new RangeError('Invalid wander seed/rate/interval.');
    this.state = seed >>> 0 || 1;
  }
  private remaining = 0;
  private angularVelocity = 0;
  update(deltaSeconds: number, speed: number, out: Vector3): Vector3 {
    speedValue(speed);
    if (!Number.isFinite(deltaSeconds) || deltaSeconds < 0 || deltaSeconds > 60)
      throw new RangeError('Wander delta must be within 0..60 seconds.');
    let time = deltaSeconds;
    while (time > 0) {
      if (this.remaining <= 0) {
        let x = this.state;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.state = x >>> 0;
        this.angularVelocity =
          ((this.state / 0xffffffff) * 2 - 1) * this.turnRate;
        this.remaining = this.interval;
      }
      const step = Math.min(time, this.remaining);
      this.angle = (this.angle + this.angularVelocity * step) % (Math.PI * 2);
      time -= step;
      this.remaining -= step;
    }
    return out.set(
      Math.cos(this.angle) * speed,
      0,
      Math.sin(this.angle) * speed,
    );
  }
}
