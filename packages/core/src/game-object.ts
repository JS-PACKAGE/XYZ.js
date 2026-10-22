import { Matrix3, Transform2D, Vector2 } from '../../math/src/index.js';
import { SceneObject } from './scene-object.js';
import {
  assertFinite,
  type ColorRGBA,
  type Rect2D,
} from './gameplay/contracts.js';
import { ActionQueue } from './actions2d/index.js';
import { Collider2D } from './physics2d/collider.js';
import { RigidBody2D } from './physics2d/body.js';
import type { HitArea2D } from './gameplay/hit-area2d.js';
import type { AccessibilityOptions2D } from './accessibility/index.js';
import {
  InteractionListeners2D,
  isInteractionEvent2D,
  type InteractionPhase2D,
} from './gameplay/interaction-events.js';
import { PhysicsPresentation2D } from './physics-presentation.js';

// Shared, not per-instance: a Matrix3 costs ~300 heap bytes and these are only used synchronously
// (no user code runs between writing and reading them).
const inverseScratch = new Matrix3();
const pointScratch = new Vector2();

/**
 * `out.copy(parent).multiply(local)` in one pass: `multiply` leaves the last row alone, so
 * that row is the parent's, and every product reads the parent's stored values.
 */
function composeInto(out: Matrix3, parent: Matrix3, local: Matrix3): void {
  const e = out.elements,
    a = parent.elements,
    b = local.elements;
  const a0 = a[0],
    a1 = a[1],
    a3 = a[3],
    a4 = a[4],
    a6 = a[6],
    a7 = a[7];
  const b0 = b[0],
    b1 = b[1],
    b3 = b[3],
    b4 = b[4],
    b6 = b[6],
    b7 = b[7];
  e[0] = a0 * b0 + a3 * b1;
  e[1] = a1 * b0 + a4 * b1;
  e[2] = a[2];
  e[3] = a0 * b3 + a3 * b4;
  e[4] = a1 * b3 + a4 * b4;
  e[5] = a[5];
  e[6] = a0 * b6 + a3 * b7 + a6;
  e[7] = a1 * b6 + a4 * b7 + a7;
  e[8] = a[8];
}

/** Public 2D facade; entities and component registration belong to Scene. */
export class GameObject extends SceneObject {
  readonly transform = new Transform2D();
  readonly worldMatrix = new Matrix3();
  /** @internal Owning Scene's registration stamp, ordering per-frame updates; 0 when detached. */
  sceneUpdateId = 0;
  /** Scene presentation pass that `worldMatrix` was composed for; see updateWorldMatrix. */
  private matrixPass = 0;
  private ancestor: GameObject | undefined;
  /** Created on first child or first `children` read; tiles and glyphs are mostly leaves. */
  private descendants: Set<GameObject> | undefined;
  private alpha = 1;
  private order = 0;
  private coordinateSpace: 'world' | 'screen' = 'world';
  // Created on first use: most objects of a large map are never tinted, and culled ones
  // are never composed or bounded. An absent color is opaque white.
  private color: [number, number, number, number] | undefined;
  private composedColor: [number, number, number, number] | undefined;
  private bounds: Rect2D | undefined;
  visible = true;
  pointerEnabled = false;
  draggable = false;
  hitTestMode: 'graphics' | 'collider' = 'graphics';
  hitArea: HitArea2D | undefined;
  interactiveChildren = true;
  cursor: string | undefined;
  eventPropagation: 'target' | 'hierarchy' = 'target';
  accessibility: AccessibilityOptions2D | undefined;
  private interactionListeners: InteractionListeners2D | undefined;
  private initializedEvents = false;
  private actionQueue: ActionQueue | undefined;
  private rigidBody: RigidBody2D | undefined;
  private collisionShape: Collider2D | undefined;
  private physicsPresentation: PhysicsPresentation2D | undefined;
  override addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (isInteractionEvent2D(type))
      (this.interactionListeners ??= new InteractionListeners2D()).add(
        type,
        callback,
        options,
      );
    else super.addEventListener(type, callback, options);
  }
  override removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    if (isInteractionEvent2D(type))
      this.interactionListeners?.remove(type, callback, options);
    else super.removeEventListener(type, callback, options);
  }
  override dispatchEvent(event: Event): boolean {
    if (isInteractionEvent2D(event.type))
      return (
        this.interactionListeners?.dispatchNative(event, this) ??
        !event.defaultPrevented
      );
    return super.dispatchEvent(event);
  }
  /** @internal Router and accessibility callbacks guard each delivery against scene mutation. */
  dispatchInteractionEvent(
    event: CustomEvent,
    phase: InteractionPhase2D,
    guard: () => boolean,
  ): void {
    this.interactionListeners?.dispatch(event, phase, guard);
  }

  get actions(): ActionQueue {
    if (!this.actionQueue) {
      this.actionQueue = new ActionQueue(this);
      this.scene?.trackObjectPasses(this);
    }
    return this.actionQueue;
  }
  /** @internal Do not instantiate queues on passive glyph/tile/pool sprites. */
  advanceActions(dt: number, canContinue?: () => boolean): void {
    this.actionQueue?.update(dt, canContinue);
  }
  /** @internal Whether `advanceActions` has a queue to advance. */
  get hasActionQueue(): boolean {
    return this.actionQueue !== undefined;
  }
  /** @internal Whether `initializeEvents` has already run. */
  get eventsInitialized(): boolean {
    return this.initializedEvents;
  }
  get body(): RigidBody2D | undefined {
    return this.rigidBody;
  }
  set body(value: RigidBody2D | undefined) {
    if (value === this.rigidBody) return;
    if (this.destroyed)
      throw new Error('Cannot change a destroyed GameObject body.');
    if (value && !(value instanceof RigidBody2D))
      throw new TypeError('Invalid RigidBody2D.');
    const previous = this.rigidBody;
    value?.attach(this);
    this.rigidBody = value;
    try {
      this.scene?.physics.register(this);
    } catch (error) {
      if (this.rigidBody === value) this.rigidBody = previous;
      value?.detach(this);
      throw error;
    }
    if (this.rigidBody !== previous) {
      previous?.detach(this);
      this.physicsPresentation = undefined;
    }
  }
  /** Convex pieces sharing this object's body; ordinary objects use `collider` alone. */
  get colliderPieces(): readonly Collider2D[] | undefined {
    return undefined;
  }
  get collider(): Collider2D | undefined {
    return this.collisionShape;
  }
  set collider(value: Collider2D | undefined) {
    if (value === this.collisionShape) return;
    if (this.destroyed)
      throw new Error('Cannot change a destroyed GameObject collider.');
    if (value && !(value instanceof Collider2D))
      throw new TypeError('Invalid Collider2D.');
    if (value && this.worldSpace !== 'world')
      throw new Error('Screen-space physics is unsupported.');
    const previous = this.collisionShape;
    this.collisionShape = value;
    try {
      this.scene?.physics.register(this);
    } catch (error) {
      if (this.collisionShape === value) this.collisionShape = previous;
      throw error;
    }
  }

  private assertPhysicsSpace(): void {
    if (this.body || this.collider)
      throw new Error('Screen-space physics is unsupported.');
    if (this.descendants)
      for (const child of this.descendants) child.assertPhysicsSpace();
  }
  private assertParentingPhysics(child: GameObject): void {
    if (child.body && child.body.type !== 'static')
      throw new Error('Moving bodies require root GameObjects.');
    if (this.worldSpace === 'screen') child.assertPhysicsSpace();
  }

  /** @internal Initialization belongs to the first active tick, not detached construction. */
  initializeEvents(): void {
    if (this.initializedEvents) return;
    this.initializedEvents = true;
    this.scene?.noteEventsInitialized(this);
    this.dispatchObjectEvent('initialize');
  }

  get position(): Vector2 {
    return this.transform.position;
  }
  set position(value: Vector2) {
    assertFinite(value.x, 'position.x');
    assertFinite(value.y, 'position.y');
    this.transform.position.copy(value);
  }
  get rotation(): number {
    return this.transform.rotation;
  }
  set rotation(value: number) {
    assertFinite(value, 'rotation');
    this.transform.rotation = value;
  }
  get scale(): Vector2 {
    return this.transform.scale;
  }
  set scale(value: Vector2) {
    assertFinite(value.x, 'scale.x');
    assertFinite(value.y, 'scale.y');
    this.transform.scale.copy(value);
  }
  get pivot(): Vector2 {
    return this.transform.pivot;
  }
  set pivot(value: Vector2) {
    assertFinite(value.x, 'pivot.x');
    assertFinite(value.y, 'pivot.y');
    this.transform.pivot.copy(value);
  }
  get skew(): Vector2 {
    return this.transform.skew;
  }
  set skew(value: Vector2) {
    assertFinite(value.x, 'skew.x');
    assertFinite(value.y, 'skew.y');
    this.transform.skew.copy(value);
  }
  get opacity(): number {
    return this.alpha;
  }
  set opacity(value: number) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
      throw new RangeError('opacity must be finite and between 0 and 1.');
    this.alpha = value;
  }
  get zIndex(): number {
    return this.order;
  }
  set zIndex(value: number) {
    assertFinite(value, 'zIndex');
    this.order = value;
  }
  get tint(): ColorRGBA {
    return (this.color ??= [1, 1, 1, 1]);
  }
  /** @internal The tint channels, or undefined while opaque white; never creates them. */
  get existingTint(): Readonly<ColorRGBA> | undefined {
    return this.color;
  }
  set tint(value: ColorRGBA) {
    if (
      value.length !== 4 ||
      value.some(
        (channel) => !Number.isFinite(channel) || channel < 0 || channel > 1,
      )
    )
      throw new RangeError(
        'tint must contain four finite channels between 0 and 1.',
      );
    const color = (this.color ??= [1, 1, 1, 1]);
    for (let i = 0; i < 4; i++) color[i] = value[i];
  }
  get space(): 'world' | 'screen' {
    return this.coordinateSpace;
  }
  set space(value: 'world' | 'screen') {
    if (value !== 'world' && value !== 'screen')
      throw new RangeError('Unknown 2D coordinate space.');
    if (value === 'screen' && !this.parent) this.assertPhysicsSpace();
    this.coordinateSpace = value;
  }
  get parent(): GameObject | undefined {
    return this.ancestor;
  }
  get children(): ReadonlySet<GameObject> {
    return (this.descendants ??= new Set());
  }
  /** @internal Child traversal that does not materialize a leaf's empty set. */
  get existingChildren(): ReadonlySet<GameObject> | undefined {
    return this.descendants;
  }
  get worldSpace(): 'world' | 'screen' {
    // The root decides; a loop rather than a recursive getter call per ancestor.
    let root = this.parent;
    if (!root) return this.space;
    while (root.parent) root = root.parent;
    return root.space;
  }
  get worldVisible(): boolean {
    if (!this.visible || this.destroyed) return false;
    for (let object = this.parent; object; object = object.parent)
      if (!object.visible || object.destroyed) return false;
    return true;
  }
  get worldOpacity(): number {
    let opacity = this.opacity;
    for (let object = this.parent; object; object = object.parent)
      opacity *= object.opacity;
    return opacity;
  }
  get worldZIndex(): number {
    let order = this.zIndex;
    for (let object = this.parent; object; object = object.parent)
      order += object.zIndex;
    return order;
  }
  get worldTint(): ColorRGBA {
    const composed = (this.composedColor ??= [1, 1, 1, 1]),
      own = this.color;
    for (let i = 0; i < 4; i++) composed[i] = own ? own[i] : 1;
    // An absent color is white, and multiplying by 1 leaves every channel unchanged.
    for (let object = this.parent; object; object = object.parent) {
      const color = object.color;
      if (color) for (let i = 0; i < 4; i++) composed[i] *= color[i];
    }
    return composed;
  }

  add<T extends GameObject>(child: T): T {
    if (this.destroyed || child.destroyed)
      throw new Error('Cannot parent a destroyed GameObject.');
    if ((child as GameObject) === this)
      throw new Error('GameObject hierarchy cannot contain cycles.');
    for (let ancestor = this.parent; ancestor; ancestor = ancestor.parent)
      if (ancestor === child)
        throw new Error('GameObject hierarchy cannot contain cycles.');
    if (child.scene && child.scene !== this.scene)
      throw new Error('Cannot reparent a GameObject across scenes.');
    if (child.parent === this) return child;
    this.assertParentingPhysics(child);
    if (this.scene && child.scene !== this.scene) {
      const scene = this.scene;
      scene.add(child);
      if (
        this.destroyed ||
        child.destroyed ||
        this.scene !== scene ||
        child.scene !== scene ||
        child.parent
      )
        return child;
      this.assertParentingPhysics(child);
    }
    child.detachParent();
    child.ancestor = this;
    (this.descendants ??= new Set()).add(child);
    return child;
  }
  remove(child: GameObject): boolean {
    if (child.parent !== this) return false;
    if (this.scene) this.scene.remove(child);
    else child.detachParent();
    return true;
  }
  /** @internal Scene detaches roots without mutating subtree ownership. */
  detachParent(): void {
    this.ancestor?.descendants?.delete(this);
    this.ancestor = undefined;
  }
  /** @internal Stores only the previous fixed simulation pose. */
  capturePhysicsPose(): void {
    if (!this.scene?.interpolatePhysics) return;
    (this.physicsPresentation ??= new PhysicsPresentation2D()).capture(
      this.transform,
    );
  }
  /** @internal */
  sealPhysicsPose(): void {
    this.physicsPresentation?.seal(this.transform);
  }
  /**
   * @internal True when `updateWorldMatrix()` would return exactly `transform.updateMatrix()`:
   * a root using the base composition outside interpolated physics presentation.
   */
  get composesFromTransform(): boolean {
    return (
      !this.parent &&
      this.updateWorldMatrix === GameObject.prototype.updateWorldMatrix &&
      !this.scene?.presentingPhysics
    );
  }
  /**
   * @internal The parent, when it and this child use the base composition outside
   * interpolated presentation: this world matrix is then the parent's times this transform.
   */
  get baseComposedParent(): GameObject | undefined {
    const parent = this.parent;
    return parent &&
      this.updateWorldMatrix === GameObject.prototype.updateWorldMatrix &&
      parent.updateWorldMatrix === GameObject.prototype.updateWorldMatrix &&
      !this.scene?.presentingPhysics
      ? parent
      : undefined;
  }
  updateWorldMatrix(): Matrix3 {
    const scene = this.scene;
    const pass = scene?.presentationPass ?? 0;
    // Within one presentation nothing moves objects, so a matrix (and every
    // ancestor's) is composed once instead of once per descendant and per use.
    if (pass !== 0 && this.matrixPass === pass) return this.worldMatrix;
    const parentMatrix = this.parent?.updateWorldMatrix();
    let localMatrix: Matrix3;
    if (
      scene?.presentingPhysics &&
      this.body &&
      this.body.type !== 'static' &&
      !this.body.isSleeping &&
      this.physicsPresentation
    ) {
      const alpha = Math.min(
        1,
        scene.physics.interpolationAlpha +
          (scene.fixedInterpolationAlpha * scene.fixedDelta) /
            scene.physics.fixedDelta,
      );
      localMatrix = this.physicsPresentation.matrix(this.transform, alpha);
    } else localMatrix = this.transform.updateMatrix();
    if (parentMatrix) composeInto(this.worldMatrix, parentMatrix, localMatrix);
    else this.worldMatrix.copy(localMatrix);
    // Overrides may adjust the returned matrix after super; reusing it would
    // apply their adjustment twice, so only the base composition is reused.
    if (
      pass !== 0 &&
      this.updateWorldMatrix === GameObject.prototype.updateWorldMatrix
    )
      this.matrixPass = pass;
    return this.worldMatrix;
  }
  getLocalBounds(out: Rect2D = { x: 0, y: 0, width: 0, height: 0 }): Rect2D {
    out.x = out.y = out.width = out.height = 0;
    return out;
  }
  toWorld(point: Vector2, out: Vector2 = new Vector2()): Vector2 {
    return this.updateWorldMatrix().transformPoint(point, out);
  }
  toLocal(point: Vector2, out: Vector2 = new Vector2()): Vector2 {
    return inverseScratch
      .copy(this.updateWorldMatrix())
      .invert()
      .transformPoint(point, out);
  }
  getWorldBounds(out: Rect2D = { x: 0, y: 0, width: 0, height: 0 }): Rect2D {
    const bounds = this.getLocalBounds(
      (this.bounds ??= { x: 0, y: 0, width: 0, height: 0 }),
    );
    const matrix = this.updateWorldMatrix().elements;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let corner = 0; corner < 4; corner++) {
      const x = bounds.x + (corner & 1 ? bounds.width : 0);
      const y = bounds.y + (corner & 2 ? bounds.height : 0);
      const px = matrix[0] * x + matrix[3] * y + matrix[6];
      const py = matrix[1] * x + matrix[4] * y + matrix[7];
      minX = Math.min(minX, px);
      minY = Math.min(minY, py);
      maxX = Math.max(maxX, px);
      maxY = Math.max(maxY, py);
    }
    out.x = minX;
    out.y = minY;
    out.width = maxX - minX;
    out.height = maxY - minY;
    return out;
  }
  containsPoint(point: Vector2): boolean {
    if (this.hitTestMode === 'collider') {
      if (!this.collider) return false;
      return this.colliderPieces
        ? this.colliderPieces.some((piece) => piece.containsPoint(point, this))
        : this.collider.containsPoint(point, this);
    }
    try {
      inverseScratch.copy(this.updateWorldMatrix()).invert();
    } catch (error) {
      if (error instanceof RangeError) return false;
      throw error;
    }
    inverseScratch.transformPoint(point, pointScratch);
    // Copy out before getLocalBounds: subclass overrides may hit-test other objects.
    const x = pointScratch.x,
      y = pointScratch.y;
    const bounds = this.getLocalBounds(
      (this.bounds ??= { x: 0, y: 0, width: 0, height: 0 }),
    );
    return (
      bounds.width > 0 &&
      bounds.height > 0 &&
      x >= bounds.x &&
      x <= bounds.x + bounds.width &&
      y >= bounds.y &&
      y <= bounds.y + bounds.height
    );
  }
  update(deltaTime: number): void {
    void deltaTime;
  }

  override destroy(): void {
    if (this.destroyed) return;
    const children = this.descendants ? [...this.descendants] : [];
    const errors: unknown[] = [];
    try {
      this.actionQueue?.destroy();
      this.interactionListeners?.destroy();
    } catch (error) {
      errors.push(error);
    }
    this.detachParent();
    try {
      super.destroy();
    } catch (error) {
      errors.push(error);
    }
    this.rigidBody?.detach(this);
    for (const child of children) {
      try {
        child.destroy();
      } catch (error) {
        errors.push(error);
      }
    }
    this.descendants?.clear();
    if (errors.length)
      throw new AggregateError(errors, 'GameObject cleanup failed.');
  }
}
