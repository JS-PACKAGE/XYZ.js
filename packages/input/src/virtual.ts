interface VirtualControl {
  value: number;
  previous: number;
  minimum: number;
  maximum: number;
}

/** Named analog sources for canvas touch buttons and joysticks, within [-1, 1]. */
export class VirtualInput {
  private readonly controls = new Map<string, VirtualControl>();
  private destroyed = false;

  set(control: string, value: number): void {
    if (this.destroyed) throw new Error('Virtual input has been destroyed.');
    if (typeof control !== 'string' || !control || control === '__proto__')
      throw new RangeError('Virtual control must be a non-empty string.');
    if (!Number.isFinite(value) || value < -1 || value > 1)
      throw new RangeError('Virtual input value must be within [-1, 1].');
    let state = this.controls.get(control);
    if (!state) {
      if (value === 0) return;
      state = { value: 0, previous: 0, minimum: 0, maximum: 0 };
      this.controls.set(control, state);
    }
    state.value = value;
    state.minimum = Math.min(state.minimum, value);
    state.maximum = Math.max(state.maximum, value);
  }

  value(control: string): number {
    return this.controls.get(control)?.value ?? 0;
  }

  /** Neutralizes controls without losing release edges for the current frame. */
  reset(): void {
    for (const state of this.controls.values()) {
      state.previous = state.value;
      state.minimum = Math.min(state.value, 0);
      state.maximum = Math.max(state.value, 0);
      state.value = 0;
    }
  }

  /** @internal Preserves even a complete touch-button tap between updates. */
  wasPressed(control: string, direction: 1 | -1, threshold: number): boolean {
    const state = this.controls.get(control);
    if (!state) return false;
    const peak = direction === 1 ? state.maximum : -state.minimum;
    return peak >= threshold && state.previous * direction < threshold;
  }

  /** @internal */
  wasReleased(control: string, direction: 1 | -1, threshold: number): boolean {
    const state = this.controls.get(control);
    if (!state) return false;
    const peak = direction === 1 ? state.maximum : -state.minimum;
    const low = direction === 1 ? state.minimum : -state.maximum;
    return (
      peak >= threshold &&
      low < threshold &&
      state.value * direction < threshold
    );
  }

  /** @internal */
  endFrame(): void {
    for (const [name, state] of this.controls) {
      if (state.value === 0) this.controls.delete(name);
      else {
        state.previous = state.value;
        state.minimum = state.maximum = state.value;
      }
    }
  }

  /** @internal */
  destroy(): void {
    this.destroyed = true;
    this.controls.clear();
  }
}
