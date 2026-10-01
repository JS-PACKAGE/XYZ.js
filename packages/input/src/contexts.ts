import { ActionMap, GamepadState } from './gamepad.js';
import type {
  ActionBinding,
  ActionKeyboard,
  ActionSources,
  GamepadSnapshot,
} from './gamepad.js';

const EMPTY_GAMEPADS: readonly (GamepadSnapshot | null)[] = [];

export interface InputContextOptions {
  readonly bindings?: Readonly<Record<string, readonly ActionBinding[]>>;
  readonly priority?: number;
  /** Reserves bound physical sources against lower contexts and legacy actions. */
  readonly consume?: boolean;
  /** Actual browser Gamepad.index, not the position in a compact snapshot array. */
  readonly gamepadIndex?: number;
}

/** An initially inactive, named layer of the InputManager's shared action stack. */
export class InputContext {
  private enabled = false;
  private destroyed = false;
  private readonly actionMap: ActionMap;
  private readonly routedPad: GamepadState | undefined;
  readonly priority: number;
  readonly consume: boolean;
  readonly gamepadIndex: number | undefined;

  /** @internal Created and owned by InputContexts. */
  constructor(
    readonly name: string,
    private readonly owner: InputContexts,
    private readonly defaultPad: GamepadState,
    keyboard: ActionKeyboard,
    sources: ActionSources,
    options: InputContextOptions,
  ) {
    this.priority = options.priority ?? 0;
    this.consume = options.consume ?? true;
    this.gamepadIndex = options.gamepadIndex;
    if (this.gamepadIndex !== undefined) {
      this.routedPad = new GamepadState(defaultPad);
      this.routedPad.preferredIndex = this.gamepadIndex;
    }
    this.actionMap = new ActionMap(
      this.routedPad ?? defaultPad,
      keyboard,
      sources,
      true,
    );
    if (options.bindings !== undefined) this.actionMap.import(options.bindings);
  }

  get active(): boolean {
    return this.enabled;
  }

  activate(): void {
    this.assertAlive();
    if (this.enabled) return;
    this.enabled = true;
    this.actionMap.baseline();
    this.owner.activate(this);
  }

  deactivate(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.actionMap.reset();
    this.owner.deactivate(this);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.deactivate();
    this.destroyed = true;
    this.actionMap.reset();
    this.routedPad?.reset();
    this.owner.remove(this);
  }

  value(action: string): number {
    return this.actionMap.value(action);
  }

  isDown(action: string): boolean {
    return this.actionMap.isDown(action);
  }

  wasPressed(action: string): boolean {
    return this.actionMap.wasPressed(action);
  }

  wasReleased(action: string): boolean {
    return this.actionMap.wasReleased(action);
  }

  rebind(action: string, bindings: readonly ActionBinding[]): void {
    this.assertAlive();
    this.actionMap.rebind(action, bindings);
    if (this.enabled) {
      this.actionMap.baseline();
      this.owner.reconcile();
    }
  }

  unbind(action: string): boolean {
    this.assertAlive();
    const removed = this.actionMap.unbind(action);
    if (removed && this.enabled) this.owner.reconcile();
    return removed;
  }

  exportBindings(): Record<string, ActionBinding[]> {
    return this.actionMap.export();
  }

  importBindings(
    bindings: Readonly<Record<string, readonly ActionBinding[]>>,
  ): void {
    this.assertAlive();
    this.actionMap.import(bindings);
    if (this.enabled) {
      this.actionMap.baseline();
      this.owner.reconcile();
    }
  }

  /** @internal Each routed pad retains its own disconnect/release history. */
  poll(pads: ArrayLike<GamepadSnapshot | null>): void {
    if (!this.routedPad) return;
    this.routedPad.deadzone = this.defaultPad.deadzone;
    this.routedPad.pressThreshold = this.defaultPad.pressThreshold;
    this.routedPad.update(pads);
  }

  /** @internal */
  update(
    consumed: ReadonlySet<string>,
    claimed: Set<string>,
    preserveEdges: boolean,
  ): void {
    this.actionMap.update(
      consumed,
      this.consume ? claimed : undefined,
      preserveEdges,
    );
  }

  /** @internal */
  updateInactive(): void {
    this.actionMap.updateInactive();
  }

  /** @internal */
  reset(): void {
    this.actionMap.reset();
    this.routedPad?.reset();
  }

  /** @internal */
  endFrame(): void {
    this.actionMap.endFrame();
  }

  private assertAlive(): void {
    if (this.destroyed)
      throw new Error(`Input context "${this.name}" has been destroyed.`);
  }
}

/** Priority-ordered contexts; the legacy InputManager.actions is always the bottom layer. */
export class InputContexts {
  private readonly contexts = new Map<string, InputContext>();
  private readonly active: InputContext[] = [];
  private readonly retired = new Set<InputContext>();
  private readonly consumed = new Set<string>();
  private readonly claimed = new Set<string>();
  private snapshot: ArrayLike<GamepadSnapshot | null> = EMPTY_GAMEPADS;
  private destroyed = false;

  /** @internal Constructed by InputManager. */
  constructor(
    private readonly legacy: ActionMap,
    private readonly gamepad: GamepadState,
    private readonly keyboard: ActionKeyboard,
    private readonly sources: ActionSources,
  ) {}

  create(name: string, options: InputContextOptions = {}): InputContext {
    if (this.destroyed) throw new Error('Input contexts have been destroyed.');
    if (typeof name !== 'string' || !name || name === '__proto__')
      throw new RangeError('Input context name must be a non-empty string.');
    if (this.contexts.has(name))
      throw new RangeError(`Input context "${name}" already exists.`);
    if (!options || typeof options !== 'object' || Array.isArray(options))
      throw new RangeError('Input context options must be an object.');
    if (options.priority !== undefined && !Number.isFinite(options.priority))
      throw new RangeError('Input context priority must be finite.');
    if (options.consume !== undefined && typeof options.consume !== 'boolean')
      throw new RangeError('Input context consume must be boolean.');
    if (
      options.gamepadIndex !== undefined &&
      (!Number.isInteger(options.gamepadIndex) || options.gamepadIndex < 0)
    )
      throw new RangeError(
        'Input context gamepadIndex must be a nonnegative integer.',
      );
    const context = new InputContext(
      name,
      this,
      this.gamepad,
      this.keyboard,
      this.sources,
      options,
    );
    context.poll(this.snapshot);
    this.contexts.set(name, context);
    return context;
  }

  /** @internal Inserting before equal priorities gives the newest activation precedence. */
  activate(context: InputContext): void {
    const before = this.active.findIndex(
      (entry) => entry.priority <= context.priority,
    );
    this.active.splice(before < 0 ? this.active.length : before, 0, context);
    this.reconcile();
  }

  /** @internal */
  deactivate(context: InputContext): void {
    const index = this.active.indexOf(context);
    if (index >= 0) this.active.splice(index, 1);
    this.reconcile();
  }

  /** @internal */
  remove(context: InputContext): void {
    this.contexts.delete(context.name);
    this.retired.add(context);
  }

  /** @internal Existing layers retain genuine new edges while consumed edges stay muted. */
  reconcile(): void {
    this.route(true);
  }

  /** @internal */
  update(pads: ArrayLike<GamepadSnapshot | null>): void {
    this.snapshot = pads;
    for (const context of this.contexts.values()) {
      context.poll(pads);
      if (!context.active) context.updateInactive();
    }
    for (const context of this.retired) context.updateInactive();
    this.route(false);
  }

  /** @internal */
  reset(): void {
    this.snapshot = EMPTY_GAMEPADS;
    this.legacy.reset();
    for (const context of this.contexts.values()) context.reset();
    this.consumed.clear();
    this.claimed.clear();
  }

  /** @internal */
  endFrame(): void {
    this.legacy.endFrame();
    for (const context of this.contexts.values()) context.endFrame();
    for (const context of this.retired) context.endFrame();
    this.retired.clear();
  }

  /** @internal */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const context of this.contexts.values()) context.destroy();
    this.active.length = 0;
    this.consumed.clear();
    this.claimed.clear();
    this.retired.clear();
    this.snapshot = EMPTY_GAMEPADS;
  }

  private route(preserveEdges: boolean): void {
    this.consumed.clear();
    for (const context of this.active) {
      this.claimed.clear();
      context.update(this.consumed, this.claimed, preserveEdges);
      for (const source of this.claimed) this.consumed.add(source);
    }
    this.legacy.update(this.consumed, undefined, preserveEdges);
  }
}
