import { gestureDefaults } from '../../../src/data/input.js';
import type { PointerSample } from './index.js';

export type GestureType =
  'tap' | 'doubletap' | 'longpress' | 'swipe' | 'pan' | 'pinch' | 'rotate';
/** Discrete gestures (`tap`, `doubletap`, `longpress`, `swipe`) only report `end`. */
export type GesturePhase = 'start' | 'change' | 'end' | 'cancel';
export interface GesturePoint {
  readonly x: number;
  readonly y: number;
}

export interface GestureDetail {
  readonly type: GestureType;
  readonly phase: GesturePhase;
  /** Pointer ids taking part: one, or two for pinch and rotate. */
  readonly pointerIds: readonly number[];
  readonly pointerType: string;
  /** Logical pixels; the pointer, or the midpoint of the two pointers. */
  readonly center: GesturePoint;
  /** Movement of `center` since the gesture began, in logical pixels. */
  readonly translation: GesturePoint;
  /** Logical pixels per second at the latest sample. */
  readonly velocity: GesturePoint;
  /** Swipe direction by dominant axis. */
  readonly direction?: 'left' | 'right' | 'up' | 'down';
  /** Pinch distance relative to when the second pointer went down (1 = unchanged). */
  readonly scale: number;
  /** Rotation of the two pointers in radians since they went down; clockwise on screen is positive. */
  readonly rotation: number;
}

export interface GestureOptions {
  /** Monotonic milliseconds used for timing; defaults to `performance.now`. */
  readonly now?: () => number;
  readonly thresholds?: Partial<GestureThresholds>;
}
export type GestureThresholds = {
  -readonly [K in keyof typeof gestureDefaults]: number;
};

interface Contact {
  readonly id: number;
  readonly type: string;
  readonly startX: number;
  readonly startY: number;
  readonly startTime: number;
  x: number;
  y: number;
  lastTime: number;
  vx: number;
  vy: number;
  /** Moved beyond the tap slop at some point, so it can no longer be a tap or long press. */
  moved: boolean;
  panning: boolean;
  longPressed: boolean;
  /** Took part in a two-pointer gesture; its release is never a tap or swipe. */
  multi: boolean;
}

interface Pair {
  readonly a: Contact;
  readonly b: Contact;
  readonly startDistance: number;
  readonly startAngle: number;
  readonly startCenterX: number;
  readonly startCenterY: number;
  lastAngle: number;
  rotation: number;
  pinching: boolean;
  rotating: boolean;
}

interface LastTap {
  readonly x: number;
  readonly y: number;
  readonly time: number;
}

type Listener = (detail: GestureDetail) => void;

const ZERO: GesturePoint = Object.freeze({ x: 0, y: 0 });

/**
 * Turns the pointer stream into tap, double tap, long press, swipe, pan, pinch and rotate
 * gestures. It is a read-only observer: it never consumes samples or changes how the Scene routes
 * pointers, so it can run beside ordinary pointer handlers. Only the first two simultaneous
 * pointers are tracked, and mouse input uses the primary button only.
 */
export class GestureRecognizer extends EventTarget {
  readonly thresholds: GestureThresholds;
  private readonly clock: () => number;
  private readonly contacts = new Map<number, Contact>();
  private pair: Pair | undefined;
  private lastTap: LastTap | undefined;
  private disposed = false;

  constructor(options: GestureOptions = {}) {
    super();
    this.clock = options.now ?? (() => performance.now());
    this.thresholds = { ...gestureDefaults, ...options.thresholds };
    for (const [name, value] of Object.entries(this.thresholds))
      if (!Number.isFinite(value) || value < 0)
        throw new RangeError(`Gesture threshold ${name} must be nonnegative.`);
  }

  /** Subscribes to one gesture type; returns the function that unsubscribes. */
  on(type: GestureType, listener: Listener): () => void {
    const handler = (event: Event): void =>
      listener((event as CustomEvent<GestureDetail>).detail);
    this.addEventListener(type, handler);
    return () => this.removeEventListener(type, handler);
  }

  /** @internal Called for every pointer sample as it is recorded. */
  feed(sample: PointerSample): void {
    if (this.disposed) return;
    const now = this.clock();
    switch (sample.kind) {
      case 'down':
        if (sample.button === 0) this.down(sample, now);
        break;
      case 'move':
        this.move(sample, now);
        break;
      case 'up':
        if (sample.button === 0) {
          // Pointerup can carry movement not delivered by a preceding pointermove.
          const contact = this.contacts.get(sample.id);
          if (
            contact &&
            (contact.x !== sample.position.x || contact.y !== sample.position.y)
          )
            this.move(sample, now);
          this.up(sample.id, now);
        }
        break;
      case 'cancel':
        this.cancel(sample.id);
        break;
      default:
        break;
    }
  }

  /** @internal Once per frame: promotes a held, unmoved pointer to a long press. */
  update(): void {
    if (this.disposed || this.pair) return;
    const now = this.clock();
    for (const contact of this.contacts.values()) {
      if (
        contact.moved ||
        contact.longPressed ||
        contact.multi ||
        now - contact.startTime < this.thresholds.longPressMs
      )
        continue;
      contact.longPressed = true;
      this.emit('longpress', 'end', [contact], contact.x, contact.y, ZERO);
    }
  }

  /** @internal Cancels whatever is in flight, for example when the page is hidden. */
  reset(): void {
    for (const contact of [...this.contacts.values()]) this.cancel(contact.id);
    this.contacts.clear();
    this.pair = undefined;
    this.lastTap = undefined;
  }

  destroy(): void {
    if (this.disposed) return;
    this.reset();
    this.disposed = true;
  }

  private down(sample: PointerSample, now: number): void {
    if (this.contacts.has(sample.id) || this.contacts.size >= 2) return;
    const { x, y } = sample.position;
    const contact: Contact = {
      id: sample.id,
      type: sample.type,
      startX: x,
      startY: y,
      startTime: now,
      x,
      y,
      lastTime: now,
      vx: 0,
      vy: 0,
      moved: false,
      panning: false,
      longPressed: false,
      multi: false,
    };
    this.contacts.set(contact.id, contact);
    if (this.contacts.size < 2) return;
    const [a, b] = [...this.contacts.values()] as [Contact, Contact];
    // A second pointer turns whatever the first was doing into a pinch/rotate candidate.
    if (a.panning) this.emitPan('cancel', a);
    a.multi = b.multi = true;
    a.panning = false;
    this.lastTap = undefined;
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    this.pair = {
      a,
      b,
      startDistance: Math.max(Math.hypot(b.x - a.x, b.y - a.y), 1e-6),
      startAngle: angle,
      startCenterX: (a.x + b.x) / 2,
      startCenterY: (a.y + b.y) / 2,
      lastAngle: angle,
      rotation: 0,
      pinching: false,
      rotating: false,
    };
  }

  private move(sample: PointerSample, now: number): void {
    const contact = this.contacts.get(sample.id);
    if (!contact) return;
    const { x, y } = sample.position;
    const dt = Math.max(now - contact.lastTime, 1) / 1000;
    // Blend with the previous estimate so one jittery sample does not decide a swipe.
    contact.vx = 0.5 * contact.vx + (0.5 * (x - contact.x)) / dt;
    contact.vy = 0.5 * contact.vy + (0.5 * (y - contact.y)) / dt;
    contact.x = x;
    contact.y = y;
    contact.lastTime = now;
    if (contact.multi && !this.pair) return;
    if (this.pair) {
      this.movePair(this.pair);
      return;
    }
    const travel = Math.hypot(x - contact.startX, y - contact.startY);
    if (!contact.moved && travel > this.thresholds.tapSlop)
      contact.moved = true;
    if (
      !contact.panning &&
      contact.moved &&
      travel >= this.thresholds.panThreshold
    ) {
      contact.panning = true;
      this.emitPan('start', contact);
    } else if (contact.panning) this.emitPan('change', contact);
  }

  private movePair(pair: Pair): void {
    const { a, b } = pair;
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const scale = distance / pair.startDistance;
    // Unwrap the angle step so crossing ±π does not jump by 2π.
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    let step = angle - pair.lastAngle;
    if (step > Math.PI) step -= 2 * Math.PI;
    else if (step < -Math.PI) step += 2 * Math.PI;
    pair.rotation += step;
    pair.lastAngle = angle;
    if (
      !pair.pinching &&
      Math.abs(scale - 1) >= this.thresholds.pinchThreshold
    ) {
      pair.pinching = true;
      this.emitPair('pinch', 'start', pair);
    } else if (pair.pinching) this.emitPair('pinch', 'change', pair);
    if (
      !pair.rotating &&
      Math.abs(pair.rotation) >= this.thresholds.rotateThreshold
    ) {
      pair.rotating = true;
      this.emitPair('rotate', 'start', pair);
    } else if (pair.rotating) this.emitPair('rotate', 'change', pair);
  }

  private up(id: number, now: number): void {
    const contact = this.contacts.get(id);
    if (!contact) return;
    const pair = this.pair;
    if (pair && (pair.a === contact || pair.b === contact)) {
      if (pair.pinching) this.emitPair('pinch', 'end', pair);
      if (pair.rotating) this.emitPair('rotate', 'end', pair);
      this.pair = undefined;
      this.contacts.delete(id);
      // The remaining pointer finished a multi-touch gesture and must not become a tap or pan.
      return;
    }
    this.contacts.delete(id);
    if (contact.multi) return;
    const duration = now - contact.startTime;
    const dx = contact.x - contact.startX;
    const dy = contact.y - contact.startY;
    if (contact.panning) this.emitPan('end', contact);
    if (contact.longPressed) return;
    const speed = Math.hypot(contact.vx, contact.vy);
    if (
      contact.moved &&
      duration <= this.thresholds.swipeMaxMs &&
      Math.hypot(dx, dy) >= this.thresholds.swipeMinDistance &&
      speed >= this.thresholds.swipeMinVelocity
    ) {
      const direction =
        Math.abs(dx) >= Math.abs(dy)
          ? dx < 0
            ? 'left'
            : 'right'
          : dy < 0
            ? 'up'
            : 'down';
      this.emit(
        'swipe',
        'end',
        [contact],
        contact.x,
        contact.y,
        {
          x: dx,
          y: dy,
        },
        direction,
      );
      return;
    }
    if (contact.moved || duration > this.thresholds.tapMaxMs) return;
    this.emit('tap', 'end', [contact], contact.x, contact.y, ZERO);
    const previous = this.lastTap;
    if (
      previous &&
      now - previous.time <= this.thresholds.doubleTapMs &&
      Math.hypot(contact.x - previous.x, contact.y - previous.y) <=
        this.thresholds.doubleTapSlop
    ) {
      this.lastTap = undefined;
      this.emit('doubletap', 'end', [contact], contact.x, contact.y, ZERO);
    } else this.lastTap = { x: contact.x, y: contact.y, time: now };
  }

  private cancel(id: number): void {
    const contact = this.contacts.get(id);
    if (!contact) return;
    const pair = this.pair;
    if (pair && (pair.a === contact || pair.b === contact)) {
      if (pair.pinching) this.emitPair('pinch', 'cancel', pair);
      if (pair.rotating) this.emitPair('rotate', 'cancel', pair);
      this.pair = undefined;
      // The partner is no longer part of any gesture either.
      this.contacts.delete(pair.a.id);
      this.contacts.delete(pair.b.id);
      return;
    }
    this.contacts.delete(id);
    if (contact.panning) this.emitPan('cancel', contact);
  }

  private emitPan(phase: GesturePhase, contact: Contact): void {
    this.emit('pan', phase, [contact], contact.x, contact.y, {
      x: contact.x - contact.startX,
      y: contact.y - contact.startY,
    });
  }

  private emitPair(
    type: 'pinch' | 'rotate',
    phase: GesturePhase,
    pair: Pair,
  ): void {
    const { a, b } = pair;
    const x = (a.x + b.x) / 2;
    const y = (a.y + b.y) / 2;
    this.emit(
      type,
      phase,
      [a, b],
      x,
      y,
      { x: x - pair.startCenterX, y: y - pair.startCenterY },
      undefined,
      Math.hypot(b.x - a.x, b.y - a.y) / pair.startDistance,
      pair.rotation,
    );
  }

  private emit(
    type: GestureType,
    phase: GesturePhase,
    contacts: readonly Contact[],
    x: number,
    y: number,
    translation: GesturePoint,
    direction?: GestureDetail['direction'],
    scale = 1,
    rotation = 0,
  ): void {
    const first = contacts[0]!;
    const detail: GestureDetail = {
      type,
      phase,
      pointerIds: contacts.map((contact) => contact.id),
      pointerType: first.type,
      center: { x, y },
      translation,
      velocity: {
        x:
          contacts.reduce((sum, contact) => sum + contact.vx, 0) /
          contacts.length,
        y:
          contacts.reduce((sum, contact) => sum + contact.vy, 0) /
          contacts.length,
      },
      ...(direction ? { direction } : {}),
      scale,
      rotation,
    };
    this.dispatchEvent(new CustomEvent<GestureDetail>(type, { detail }));
  }
}
