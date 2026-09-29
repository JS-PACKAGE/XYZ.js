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
  private disposed = false;

  createEntity(): Entity {
    this.assertAlive();
    const entity = this.nextEntity++;
    this.entities.add(entity);
    return entity;
  }

  hasEntity(entity: Entity): boolean {
    return this.entities.has(entity);
  }

  removeEntity(entity: Entity): boolean {
    this.assertAlive();
    if (!this.entities.delete(entity)) return false;
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
    return value;
  }

  getComponent<T>(entity: Entity, type: ComponentType<T>): T | undefined {
    return this.components.get(type)?.get(entity) as T | undefined;
  }

  *query(
    ...types: readonly ComponentType<unknown>[]
  ): IterableIterator<Entity> {
    for (const entity of this.entities) {
      let matches = true;
      for (const type of types) {
        if (!this.components.get(type)?.has(entity)) {
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
    return this.components.get(type)?.delete(entity) ?? false;
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
    for (let i = this.systems.length - 1; i >= 0; i--) {
      if (!this.systems[i].active) this.systems.splice(i, 1);
    }
  }

  private assertAlive(): void {
    if (this.disposed) throw new Error('World has been destroyed.');
  }
}
