interface ForceSource {
  readonly force: {
    readonly x: number;
    readonly y: number;
    readonly z?: number;
  };
  readonly torque:
    number | { readonly x: number; readonly y: number; readonly z: number };
  readonly forceEpoch: number;
  clearForces(): void;
}

/** Frame forces contribute impulse over frame time, including frames with no physics tick. */
export class PhysicsForceAccumulator {
  private readonly impulse = new Float64Array(6);
  readonly value = new Float64Array(6);
  private duration = 0;
  private readonly fixedImpulse = new Float64Array(6);
  private epoch = 0;

  private synchronize(body: ForceSource): void {
    if (body.forceEpoch === this.epoch) return;
    this.impulse.fill(0);
    this.duration = 0;
    this.epoch = body.forceEpoch;
    this.fixedImpulse.fill(0);
  }

  sample(body: ForceSource, delta: number): void {
    this.synchronize(body);
    if (delta === 0) return;
    const force = body.force;
    const torque = body.torque;
    this.impulse[0] += force.x * delta;
    this.impulse[1] += force.y * delta;
    this.impulse[2] += (force.z ?? 0) * delta;
    this.impulse[3] += (typeof torque === 'number' ? 0 : torque.x) * delta;
    this.impulse[4] += (typeof torque === 'number' ? 0 : torque.y) * delta;
    this.impulse[5] += (typeof torque === 'number' ? torque : torque.z) * delta;
    this.duration += delta;
    body.clearForces();
    this.epoch = body.forceEpoch;
  }

  discard(delta: number): void {
    if (this.duration === 0 || delta === 0) return;
    const remaining = Math.max(0, this.duration - delta);
    const scale = remaining / this.duration;
    for (let i = 0; i < 6; i++) this.impulse[i] *= scale;
    this.duration = remaining;
  }
  sampleFixed(body: ForceSource, delta: number): void {
    this.synchronize(body);
    const force = body.force,
      torque = body.torque;
    this.fixedImpulse[0] += force.x * delta;
    this.fixedImpulse[1] += force.y * delta;
    this.fixedImpulse[2] += (force.z ?? 0) * delta;
    this.fixedImpulse[3] += (typeof torque === 'number' ? 0 : torque.x) * delta;
    this.fixedImpulse[4] += (typeof torque === 'number' ? 0 : torque.y) * delta;
    this.fixedImpulse[5] +=
      (typeof torque === 'number' ? torque : torque.z) * delta;
    body.clearForces();
    this.epoch = body.forceEpoch;
  }

  /** Consume time-weighted frame impulse, plus forces submitted by the current fixed callback. */
  consume(body: ForceSource, delta: number): void {
    this.synchronize(body);
    const fraction = this.duration > 0 ? Math.min(1, delta / this.duration) : 0;
    const force = body.force;
    const torque = body.torque;
    this.value[0] = force.x;
    this.value[1] = force.y;
    this.value[2] = force.z ?? 0;
    this.value[3] = typeof torque === 'number' ? 0 : torque.x;
    this.value[4] = typeof torque === 'number' ? 0 : torque.y;
    this.value[5] = typeof torque === 'number' ? torque : torque.z;
    for (let i = 0; i < 6; i++) {
      const part = this.impulse[i] * fraction;
      this.value[i] += part / delta;
      this.value[i] += this.fixedImpulse[i] / delta;
      this.fixedImpulse[i] = 0;
      this.impulse[i] -= part;
    }
    this.duration = Math.max(0, this.duration - delta);
    body.clearForces();
    this.epoch = body.forceEpoch;
  }
}
