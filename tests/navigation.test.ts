import { describe, expect, it } from 'vitest';
import { Vector3 } from '../packages/math/src/math3d.js';
import { NavigationGrid2D } from '../packages/core/src/navigation/grid.js';
import { NavigationGraph3D } from '../packages/core/src/navigation/graph.js';
import { navigationLimits } from '../src/data/navigation.js';

describe('bounded weighted navigation', () => {
  it('routes around a real wall, invalidates old snapshots, and publishes edits atomically', () => {
    const grid = new NavigationGrid2D({ columns: 3, rows: 3 });
    const start = { column: 0, row: 1 };
    const goal = { column: 2, row: 1 };
    grid.setCells([
      { column: 1, row: 0, walkable: false },
      { column: 1, row: 1, walkable: false },
    ]);
    const path = grid.findPath(start, goal);
    expect(path.cells).toEqual([
      start,
      { column: 0, row: 2 },
      { column: 1, row: 2 },
      { column: 2, row: 2 },
      goal,
    ]);
    expect(path.cost).toBe(4);
    const revision = grid.revision;
    expect(() =>
      grid.setCells([
        { column: 1, row: 2, walkable: false },
        { column: 0, row: 1, cost: -1 },
      ]),
    ).toThrow(RangeError);
    expect(grid.revision).toBe(revision);
    expect(grid.isPathCurrent(path)).toBe(true);
    expect(grid.findPath(start, goal).cells).toEqual(path.cells);
    grid.setCell(1, 2, { walkable: false });
    expect(grid.isPathCurrent(path)).toBe(false);
    expect(grid.findPath(start, goal)).toMatchObject({
      status: 'unreachable',
      cost: Infinity,
      cells: [],
    });
    expect(path.cost).toBe(4);
    expect(() => Object.assign(path.cells[0]!, { row: 0 })).toThrow(TypeError);
  });

  it('chooses the cheapest route rather than the fewest cells, and updates cost-sensitive search', () => {
    const grid = new NavigationGrid2D({ columns: 3, rows: 3 });
    grid.setCell(1, 1, { cost: 20 });
    const start = { column: 0, row: 1 };
    const goal = { column: 2, row: 1 };
    const detour = grid.findPath(start, goal);
    expect(detour.cost).toBe(4);
    expect(detour.cells).not.toContainEqual({ column: 1, row: 1 });
    grid.setCells([
      { column: 1, row: 1, cost: 0.25 },
      { column: 2, row: 1, cost: 0.5 },
    ]);
    expect(grid.findPath(start, goal)).toMatchObject({
      cost: 0.75,
      cells: [start, { column: 1, row: 1 }, goal],
    });
    expect(grid.isPathCurrent(detour)).toBe(false);
    expect(
      new NavigationGrid2D({ columns: 3, rows: 3 }).isPathCurrent(detour),
    ).toBe(false);
  });

  it('enforces diagonal corner rules, finite bounds and blocked endpoints', () => {
    const grid = new NavigationGrid2D({ columns: 2, rows: 2 });
    const start = { column: 0, row: 0 };
    const goal = { column: 1, row: 1 };
    grid.setCells([
      { column: 1, row: 0, walkable: false },
      { column: 0, row: 1, walkable: false },
    ]);
    expect(grid.findPath(start, goal, { diagonal: true }).status).toBe(
      'unreachable',
    );
    expect(
      grid.findPath(start, goal, { diagonal: true, cornerCutting: true }).cost,
    ).toBeCloseTo(Math.SQRT2);
    expect(grid.findPath(start, goal).status).toBe('unreachable');
    expect(grid.findPath(start, start).cost).toBe(0);
    grid.setCell(0, 0, { walkable: false });
    expect(grid.findPath(start, start).status).toBe('unreachable');
    expect(() => grid.findPath({ column: -1, row: 0 }, goal)).toThrow(
      RangeError,
    );
    expect(() => grid.setCell(1, 1, { cost: Infinity })).toThrow(RangeError);
    expect(
      () =>
        new NavigationGrid2D({
          columns: navigationLimits.gridCells + 1,
          rows: 1,
        }),
    ).toThrow(RangeError);
  });

  it('keeps the spatial heuristic admissible for cheap distant and zero-cost directed edges', () => {
    const nodes = [
      { id: 'start', position: new Vector3() },
      { id: 'far', position: new Vector3(1000, 0, 0) },
      { id: 'goal', position: new Vector3(1, 0, 0) },
      { id: 'isolated', position: new Vector3(5, 0, 0) },
    ];
    const connections = [
      { from: 'start', to: 'goal', cost: 2, directed: true },
      { from: 'start', to: 'far', cost: 0.1, directed: true },
      { from: 'far', to: 'goal', cost: 0.1, directed: true },
    ];
    const graph = new NavigationGraph3D({ nodes, connections });
    const path = graph.findPath('start', 'goal');
    expect(path.nodes.map((node) => node.id)).toEqual(['start', 'far', 'goal']);
    expect(path.cost).toBeCloseTo(0.2);
    expect(graph.findPath('goal', 'start').status).toBe('unreachable');
    expect(graph.findPath('start', 'isolated').cost).toBe(Infinity);
    expect(graph.findPath('start', 'start').cost).toBe(0);
    nodes[1]!.position.set(2, 2, 2);
    connections[1]!.cost = 99;
    expect(graph.getNode('far').position).toEqual(new Vector3(1000, 0, 0));
    expect(graph.findPath('start', 'goal').cost).toBeCloseTo(0.2);
    expect(() => Object.assign(path.nodes[1]!.position, { x: 0 })).toThrow(
      TypeError,
    );
    connections[1]!.cost = 0;
    const zero = new NavigationGraph3D({ nodes, connections });
    expect(zero.findPath('start', 'goal').cost).toBeCloseTo(0.1);
  });

  it('traverses undirected edges both ways and rejects ambiguous duplicate connections', () => {
    const nodes = [
      { id: 'a', position: new Vector3() },
      { id: 'b', position: new Vector3(0, 1, 0) },
    ];
    const graph = new NavigationGraph3D({
      nodes,
      connections: [{ from: 'a', to: 'b', cost: 3 }],
    });
    expect(graph.findPath('b', 'a').nodes.map((node) => node.id)).toEqual([
      'b',
      'a',
    ]);
    expect(graph.findPath('b', 'a').cost).toBe(3);
    expect(
      () =>
        new NavigationGraph3D({
          nodes,
          connections: [
            { from: 'a', to: 'b', cost: 3 },
            { from: 'b', to: 'a', cost: 1, directed: true },
          ],
        }),
    ).toThrow(RangeError);
    expect(() => graph.findPath('missing', 'b')).toThrow(RangeError);
    expect(
      () =>
        new NavigationGraph3D({
          nodes: [nodes[0]!, nodes[0]!],
          connections: [],
        }),
    ).toThrow(RangeError);
  });
});
