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

/** Public 2D facade; entities and component registration belong to Scene. */
export class GameObject extends SceneObject {
  readonly transform = new Transform2D();
  readonly worldMatrix = new Matrix3();
  private ancestor: GameObject | undefined;
  private readonly descendants = new Set<GameObject>();
  private alpha = 1;
  private order = 0;
  private coordinateSpace: 'world' | 'screen' = 'world';
  private readonly color: [number, number, number, number] = [1, 1, 1, 1];
  private readonly composedColor: [number, number, number, number] = [
    1, 1, 1, 1,
  ];
  private readonly inverseMatrix = new Matrix3();
  private readonly localPoint = new Vector2();
  private readonly bounds: Rect2D = { x: 0, y: 0, width: 0, height: 0 };
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
    return (this.actionQueue ??= new ActionQueue(this));
  }
  /** @internal Do not instantiate queues on passive glyph/tile/pool sprites. */
  advanceActions(dt: number, canContinue?: () => boolean): void {
    this.actionQueue?.update(dt, canContinue);
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
    for (const child of this.descendants) child.assertPhysicsSpace();
  }
  private assertParentingPhysics(child: GameObject): void {
    if (child.body?.type === 'dynamic')
      throw new Error('Dynamic bodies require root GameObjects.');
    if (this.worldSpace === 'screen') child.assertPhysicsSpace();
  }

  /** @internal Initialization belongs to the first active tick, not detached construction. */
  initializeEvents(): void {
    if (this.initializedEvents) return;
    this.initializedEvents = true;
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
    for (let i = 0; i < 4; i++) this.color[i] = value[i];
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
    return this.descendants;
  }
  get worldSpace(): 'world' | 'screen' {
    return this.parent?.worldSpace ?? this.space;
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
    for (let i = 0; i < 4; i++) this.composedColor[i] = this.color[i];
    for (let object = this.parent; object; object = object.parent)
      for (let i = 0; i < 4; i++) this.composedColor[i] *= object.color[i];
    return this.composedColor;
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
    this.descendants.add(child);
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
    this.ancestor?.descendants.delete(this);
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
  updateWorldMatrix(): Matrix3 {
    const parentMatrix = this.parent?.updateWorldMatrix();
    const scene = this.scene;
    let localMatrix: Matrix3;
    if (
      scene?.presentingPhysics &&
      this.body?.type === 'dynamic' &&
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
    if (parentMatrix) this.worldMatrix.copy(parentMatrix).multiply(localMatrix);
    else this.worldMatrix.copy(localMatrix);
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
    return this.inverseMatrix
      .copy(this.updateWorldMatrix())
      .invert()
      .transformPoint(point, out);
  }
  getWorldBounds(out: Rect2D = { x: 0, y: 0, width: 0, height: 0 }): Rect2D {
    const bounds = this.getLocalBounds(this.bounds);
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
    if (this.hitTestMode === 'collider')
      return this.collider?.containsPoint(point, this) ?? false;
    try {
      this.inverseMatrix.copy(this.updateWorldMatrix()).invert();
    } catch (error) {
      if (error instanceof RangeError) return false;
      throw error;
    }
    this.inverseMatrix.transformPoint(point, this.localPoint);
    const bounds = this.getLocalBounds(this.bounds);
    return (
      bounds.width > 0 &&
      bounds.height > 0 &&
      this.localPoint.x >= bounds.x &&
      this.localPoint.x <= bounds.x + bounds.width &&
      this.localPoint.y >= bounds.y &&
      this.localPoint.y <= bounds.y + bounds.height
    );
  }
  update(deltaTime: number): void {
    void deltaTime;
  }

  override destroy(): void {
    if (this.destroyed) return;
    const children = [...this.descendants];
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
    this.descendants.clear();
    if (errors.length)
      throw new AggregateError(errors, 'GameObject cleanup failed.');
  }
}
