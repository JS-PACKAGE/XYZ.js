import { describe, expect, it } from 'vitest';
import { World, type System } from '../packages/ecs/src/world.js';

class Position {
  constructor(public x: number) {}
}
class Velocity {
  constructor(public x: number) {}
}

describe('World entity and component CRUD', () => {
  it('allocates stable IDs and queries complete component matches in creation order', () => {
    const world = new World();
    const first = world.createEntity();
    const second = world.createEntity();
    const third = world.createEntity();
    expect([first, second, third]).toEqual([1, 2, 3]);
    expect(world.hasEntity(first)).toBe(true);
    world.addComponent(first, Position, new Position(2));
    world.addComponent(second, Position, new Position(3));
    world.addComponent(second, Velocity, new Velocity(4));
    world.addComponent(third, Velocity, new Velocity(5));
    expect([...world.query(Position)]).toEqual([first, second]);
    expect([...world.query(Position, Velocity)]).toEqual([second]);
    expect(world.getComponent(second, Position)?.x).toBe(3);
    world.addComponent(second, Position, new Position(9));
    expect(world.getComponent(second, Position)?.x).toBe(9);
    expect(world.removeComponent(second, Velocity)).toBe(true);
    expect(world.hasComponent(second, Velocity)).toBe(false);
    expect([...world.query(Position, Velocity)]).toEqual([]);
    expect(world.removeEntity(first)).toBe(true);
    expect(world.removeEntity(first)).toBe(false);
    expect(world.getComponent(first, Position)).toBeUndefined();
    expect([...world.query(Position)]).toEqual([second]);
    expect(world.createEntity()).toBe(4);
    expect(() =>
      world.addComponent(first, Position, new Position(1)),
    ).toThrow();
    world.destroy();
    expect(() => world.createEntity()).toThrow();
  });

  it('initializes systems in order, defers newly added systems to the next tick, and destroys exactly once', () => {
    const world = new World();
    const calls: string[] = [];
    const replacement: System = {
      initialize: () => calls.push('replacement:init'),
      update: () => calls.push('replacement:update'),
      destroy: () => calls.push('replacement:destroy'),
    };
    const last: System = {
      update: () => calls.push('last:update'),
      destroy: () => calls.push('last:destroy'),
    };
    const first: System = {
      initialize: () => calls.push('first:init'),
      update: () => {
        calls.push('first:update');
        world.removeSystem(last);
        world.addSystem(replacement);
      },
      destroy: () => calls.push('first:destroy'),
    };
    world.addSystem(first);
    world.addSystem(last);
    world.update(0.016);
    expect(calls).toEqual([
      'first:init',
      'first:update',
      'last:destroy',
      'replacement:init',
    ]);
    world.removeSystem(first);
    world.update(0.016);
    world.destroy();
    world.destroy();
    expect(calls).toEqual([
      'first:init',
      'first:update',
      'last:destroy',
      'replacement:init',
      'first:destroy',
      'replacement:update',
      'replacement:destroy',
    ]);
  });

  it('releases partially initialized systems and rejects duplicate registrations', () => {
    const world = new World();
    const calls: string[] = [];
    const failed: System = {
      initialize: () => {
        calls.push('init');
        throw new Error('broken');
      },
      update: () => calls.push('update'),
      destroy: () => calls.push('destroy'),
    };
    expect(() => world.addSystem(failed)).toThrow('broken');
    expect(calls).toEqual(['init', 'destroy']);
    const system: System = { update: () => {} };
    world.addSystem(system);
    expect(() => world.addSystem(system)).toThrow('already registered');
    world.destroy();
  });
});
