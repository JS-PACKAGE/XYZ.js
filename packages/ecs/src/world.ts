export type Entity = number;
export type ComponentType<T> = abstract new (...args: never[]) => T;

export interface System {
  initialize?(world: World): void;
  update(world: World, deltaTime: number): void;
  destroy?(world: World): void;
}

interface SystemEntry {
  system: System;
  active: boolean;
}

/** Scene-local entities and components; iteration follows entity and system insertion order. */
export class World {
  private nextEntity = 1;
  private readonly entities = new Set<Entity>();
  private readonly components = new Map<
    ComponentType<unknown>,
    Map<Entity, unknown>
  >();
  private readonly systems: SystemEntry[] = [];
  private updating = false;
  private systemsNeedCompaction = false;
  private disposed = false;
  /** Bumped by every entity or component membership change; see query. */
  private revision = 0;

  createEntity(): Entity {
    this.assertAlive();
    const entity = this.nextEntity++;
    this.entities.add(entity);
    this.revision++;
    return entity;
  }

  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  removeEntity(entity: Entity): boolean {
    this.assertAlive();
    if (!this.entities.delete(entity)) return false;
    this.revision++;
    for (const store of this.components.values()) store.delete(entity);
    return true;
  }

  addComponent<T>(entity: Entity, type: ComponentType<T>, value: T): T {
    this.assertAlive();
    if (!this.entities.has(entity))
      throw new RangeError('Entity does not exist.');
    let store = this.components.get(type);
    if (!store) {
      store = new Map();
      this.components.set(type, store);
    }
    store.set(entity, value);
    this.revision++;
    return value;
  }

  getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
    return this.components.get(type)?.get(entity) as T | undefined;
  }

  *query(
    ...types: readonly ComponentType<unknown>[]
  ): IterableIterator<Entity> {
    // A missing store means nothing matches and no caller code runs before the query ends.
    // Stores are only ever created, never replaced, so resolved ones stay valid across yields.
    const stores: Map<Entity, unknown>[] = [];
    for (const type of types) {
      const store = this.components.get(type);
      if (!store) return;
      stores.push(store);
    }
    const count = stores.length;
    let smallest: Map<Entity, unknown> | undefined;
    for (const store of stores)
      if (!smallest || store.size < smallest.size) smallest = store;
    let last = 0;
    if (smallest && smallest.size * 2 < this.entities.size) {
      // Entity ids ascend in creation order, which is also the Set's order, so the smallest
      // store's members sorted by id are exactly what the full walk below would yield.
      const matches: Entity[] = [];
      let sorted = true;
      for (const entity of smallest.keys()) {
        if (!this.entities.has(entity) || !hasAll(stores, entity)) continue;
        if (matches.length && entity < matches[matches.length - 1]!)
          sorted = false;
        matches.push(entity);
      }
      if (!sorted) matches.sort((a, b) => a - b);
      const revision = this.revision;
      for (let i = 0; i < matches.length && this.revision === revision; i++) {
        last = matches[i]!;
        yield last;
      }
      if (this.revision === revision) return;
      // Membership changed between yields: continue live after the last yielded entity, as
      // the full walk would have.
    }
    for (const entity of this.entities) {
      if (entity <= last) continue;
      let matches = true;
      for (let i = 0; i < count; i++) {
        if (!stores[i]!.has(entity)) {
          matches = false;
          break;
        }
      }
      if (matches) yield entity;
    }
  }

  hasComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
    return this.components.get(type)?.has(entity) ?? false;
  }

  removeComponent<T>(entity: Entity, type: ComponentType<T>): boolean {
    this.assertAlive();
    const removed = this.components.get(type)?.delete(entity) ?? false;
    if (removed) this.revision++;
    return removed;
  }

  addSystem(system: System): void {
    this.assertAlive();
    if (this.systems.some((entry) => entry.active && entry.system === system)) {
      throw new Error('System is already registered.');
    }
    try {
      system.initialize?.(this);
    } catch (error) {
      try {
        system.destroy?.(this);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'System initialization and cleanup failed.',
          { cause: cleanupError },
        );
      }
      throw error;
    }
    this.systems.push({ system, active: true });
  }

  removeSystem(system: System): boolean {
    this.assertAlive();
    const entry = this.systems.find(
      (candidate) => candidate.active && candidate.system === system,
    );
    if (!entry) return false;
    entry.active = false;
    this.systemsNeedCompaction = true;
    if (!this.updating) this.compactSystems();
    system.destroy?.(this);
    return true;
  }

  update(deltaTime: number): void {
    this.assertAlive();
    if (this.updating) throw new Error('World update cannot be reentered.');
    this.updating = true;
    const count = this.systems.length;
    try {
      for (let i = 0; i < count; i++) {
        const entry = this.systems[i];
        if (entry?.active) entry.system.update(this, deltaTime);
      }
    } finally {
      this.updating = false;
      this.compactSystems();
    }
  }

  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    const errors: unknown[] = [];
    for (let i = this.systems.length - 1; i >= 0; i--) {
      const entry = this.systems[i];
      if (!entry.active) continue;
      entry.active = false;
      try {
        entry.system.destroy?.(this);
      } catch (error) {
        errors.push(error);
      }
    }
    this.systems.length = 0;
    this.components.clear();
    this.entities.clear();
    if (errors.length)
      throw new AggregateError(errors, 'World system cleanup failed.');
  }

  private compactSystems(): void {
    if (!this.systemsNeedCompaction) return;
    let write = 0;
    for (let read = 0; read < this.systems.length; read++) {
      const entry = this.systems[read];
      if (entry.active) this.systems[write++] = entry;
    }
    this.systems.length = write;
    this.systemsNeedCompaction = false;
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('World has been destroyed.');
  }
}

function hasAll(
  stores: readonly Map<Entity, unknown>[],
  entity: Entity,
): boolean {
  for (let i = 0; i < stores.length; i++)
    if (!stores[i]!.has(entity)) return false;
  return true;
}
