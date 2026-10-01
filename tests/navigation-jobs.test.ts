import { describe, expect, it } from 'vitest';
import { Vector3 } from '../packages/math/src/math3d.js';
import { NavigationGrid2D } from '../packages/core/src/navigation/grid.js';
import { NavigationGraph3D } from '../packages/core/src/navigation/graph.js';
import { navigationLimits } from '../src/data/navigation.js';

function graph() {
  return new NavigationGraph3D({
    nodes: ['a', 'b', 'c', 'd'].map((id, i) => ({
      id,
      position: new Vector3(i * 100, 0, 0),
    })),
    connections: [
      { from: 'a', to: 'd', cost: 4 },
      { from: 'a', to: 'b', cost: 0 },
      { from: 'b', to: 'c', cost: 0.1 },
      { from: 'c', to: 'd', cost: 0 },
    ],
  });
}

describe('incremental navigation jobs', () => {
  it('bounds each step and interleaves independent grid workspaces without changing optimal results', () => {
    const grid = new NavigationGrid2D({ columns: 20, rows: 2 });
    const from = { column: 0, row: 0 },
      to = { column: 19, row: 0 };
    const forward = grid.createSearch(from, to);
    const reverse = grid.createSearch(to, from);
    expect(forward.step(0)).toBe('pending');
    expect(forward.expansions).toBe(0);
    while (forward.status === 'pending' || reverse.status === 'pending') {
      const previous = forward.expansions;
      forward.step(1);
      expect(forward.expansions - previous).toBeLessThanOrEqual(1);
      const backwards = reverse.expansions;
      reverse.step(2);
      expect(reverse.expansions - backwards).toBeLessThanOrEqual(2);
    }
    expect(forward.result).toEqual(grid.findPath(from, to));
    expect(reverse.result).toEqual(grid.findPath(to, from));
    expect(forward.result!.cost).toBe(19);
  });

  it('retains zero/cheap-edge optimality under graph interleaving and cancellation', () => {
    const owner = graph();
    const first = owner.createSearch('a', 'd');
    const second = owner.createSearch('d', 'a');
    const cancelled = owner.createSearch('a', 'c');
    cancelled.step(1);
    cancelled.cancel();
    expect(cancelled.step(10)).toBe('cancelled');
    expect(cancelled.result).toBeUndefined();
    while (first.status === 'pending' || second.status === 'pending') {
      first.step(1);
      second.step(1);
    }
    expect(first.result!.nodes.map((node) => node.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
    ]);
    expect(first.result!.cost).toBeCloseTo(0.1);
    expect(first.result).toEqual(owner.findPath('a', 'd'));
    expect(second.result!.cost).toBeCloseTo(0.1);
  });

  it('invalidates edited work and reclaims cancelled or completed slots within a fixed concurrency cap', () => {
    const grid = new NavigationGrid2D({ columns: 4, rows: 1 });
    const from = { column: 0, row: 0 },
      to = { column: 3, row: 0 };
    const jobs = Array.from(
      { length: navigationLimits.concurrentSearches },
      () => grid.createSearch(from, to),
    );
    expect(() => grid.createSearch(from, to)).toThrow(RangeError);
    jobs[0]!.cancel();
    const replacement = grid.createSearch(from, to);
    replacement.step(1);
    grid.setCell(2, 0, { walkable: false });
    expect(replacement.status).toBe('invalidated');
    expect(replacement.result).toBeUndefined();
    expect(jobs.slice(1).every((job) => job.status === 'invalidated')).toBe(
      true,
    );
    expect(grid.findPath(from, to).status).toBe('unreachable');
    const pending = grid.createSearch(from, from);
    grid.destroy();
    expect(pending.status).toBe('cancelled');
    expect(() => grid.createSearch(from, to)).toThrow(Error);
    expect(() => replacement.step(-1)).toThrow(RangeError);
  });

  it('cancels graph ownership on destroy without retaining work in terminal handles', () => {
    const owner = graph();
    const job = owner.createSearch('a', 'd');
    job.step(1);
    owner.destroy();
    expect(job.status).toBe('cancelled');
    expect(job.result).toBeUndefined();
    expect(job.step(1)).toBe('cancelled');
    expect(() => owner.findPath('a', 'd')).toThrow(Error);
  });
});
