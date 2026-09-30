export type InteractionPhase2D = 'capture' | 'target' | 'bubble';
export interface InteractionDispatchDetail2D {
  readonly target: EventTarget;
  readonly currentTarget: EventTarget;
  readonly immediatePropagationStopped: boolean;
}
export function isInteractionEvent2D(type: string): boolean {
  return (
    type === 'wheel' ||
    type === 'activate' ||
    type === 'focus' ||
    type === 'blur' ||
    type === 'pointerenter' ||
    type === 'pointerleave' ||
    type === 'pointerdown' ||
    type === 'pointerup' ||
    type === 'pointermove' ||
    type === 'pointercancel' ||
    type === 'pointertap' ||
    type === 'pointerupoutside' ||
    type === 'dragstart' ||
    type === 'dragmove' ||
    type === 'dragend'
  );
}
interface ListenerRecord {
  type: string;
  callback: EventListenerOrEventListenerObject;
  capture: boolean;
  wrapper: EventListener;
  signal?: AbortSignal;
  abort?: () => void;
}

/** Native dispatch retains listener mutation, once, signal, and exception semantics. */
export class InteractionListeners2D {
  private readonly capture = new EventTarget();
  private readonly bubble = new EventTarget();
  private readonly records: ListenerRecord[] = [];
  private guard: (() => boolean) | undefined;
  has(type: string): boolean {
    return this.records.some((record) => record.type === type);
  }
  add(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (!callback || (typeof options === 'object' && options.signal?.aborted))
      return;
    const capture =
      typeof options === 'boolean' ? options : (options?.capture ?? false);
    if (
      this.records.some(
        (record) =>
          record.type === type &&
          record.callback === callback &&
          record.capture === capture,
      )
    )
      return;
    const once = typeof options === 'object' && options.once;
    const record: ListenerRecord = {
      type,
      callback,
      capture,
      wrapper: (event) => {
        if (this.guard && !this.guard()) {
          event.stopImmediatePropagation();
          return;
        }
        if (once) this.remove(type, callback, capture);
        if (typeof callback === 'function')
          callback.call(event.currentTarget, event);
        else callback.handleEvent(event);
      },
    };
    if (typeof options === 'object' && options.signal) {
      record.signal = options.signal;
      record.abort = () => this.remove(type, callback, capture);
      options.signal.addEventListener('abort', record.abort, { once: true });
    }
    this.records.push(record);
    (capture ? this.capture : this.bubble).addEventListener(
      type,
      record.wrapper,
      options,
    );
  }
  remove(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    const capture =
      typeof options === 'boolean' ? options : (options?.capture ?? false);
    const index = this.records.findIndex(
      (record) =>
        record.type === type &&
        record.callback === callback &&
        record.capture === capture,
    );
    if (index < 0) return;
    const [record] = this.records.splice(index, 1);
    (capture ? this.capture : this.bubble).removeEventListener(
      type,
      record.wrapper,
      capture,
    );
    if (record.abort) record.signal?.removeEventListener('abort', record.abort);
  }
  private deliver(
    event: Event,
    owner: EventTarget,
    target: EventTarget,
    phase: InteractionPhase2D,
    guard: () => boolean,
    immediateStopped: () => boolean,
  ): boolean {
    const previous = this.guard;
    const currentTarget = Object.getOwnPropertyDescriptor(
      event,
      'currentTarget',
    );
    const eventPhase = Object.getOwnPropertyDescriptor(event, 'eventPhase');
    Object.defineProperties(event, {
      target: { configurable: true, value: target },
      currentTarget: { configurable: true, value: owner },
      eventPhase: {
        configurable: true,
        value:
          phase === 'capture'
            ? Event.CAPTURING_PHASE
            : phase === 'bubble'
              ? Event.BUBBLING_PHASE
              : Event.AT_TARGET,
      },
    });
    this.guard = guard;
    try {
      if (phase !== 'bubble' && guard()) this.capture.dispatchEvent(event);
      if (phase !== 'capture' && !immediateStopped() && guard())
        this.bubble.dispatchEvent(event);
      return !event.defaultPrevented;
    } finally {
      this.guard = previous;
      if (currentTarget)
        Object.defineProperty(event, 'currentTarget', currentTarget);
      else
        Object.defineProperty(event, 'currentTarget', {
          configurable: true,
          value: null,
        });
      if (eventPhase) Object.defineProperty(event, 'eventPhase', eventPhase);
      else
        Object.defineProperty(event, 'eventPhase', {
          configurable: true,
          value: Event.NONE,
        });
    }
  }
  dispatch(
    event: CustomEvent<InteractionDispatchDetail2D>,
    phase: InteractionPhase2D,
    guard: () => boolean,
  ): boolean {
    const detail = event.detail;
    return this.deliver(
      event,
      detail.currentTarget,
      detail.target,
      phase,
      guard,
      () => detail.immediatePropagationStopped,
    );
  }
  /** Existing consumers may dispatch ordinary native Events, without router detail. */
  dispatchNative(
    event: Event,
    owner: EventTarget,
    guard: () => boolean = () => true,
  ): boolean {
    let immediate = false;
    const descriptor = Object.getOwnPropertyDescriptor(
      event,
      'stopImmediatePropagation',
    );
    const stop = event.stopImmediatePropagation;
    Object.defineProperty(event, 'stopImmediatePropagation', {
      configurable: true,
      value: () => {
        immediate = true;
        stop.call(event);
      },
    });
    try {
      return this.deliver(
        event,
        owner,
        owner,
        'target',
        guard,
        () => immediate,
      );
    } finally {
      if (descriptor)
        Object.defineProperty(event, 'stopImmediatePropagation', descriptor);
      else Reflect.deleteProperty(event, 'stopImmediatePropagation');
    }
  }
  destroy(): void {
    while (this.records.length) {
      const record = this.records[this.records.length - 1];
      this.remove(record.type, record.callback, record.capture);
    }
  }
}
