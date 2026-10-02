import { describe, expect, it } from 'vitest';
import { NavigationGrid2D } from '../packages/core/src/navigation/grid.js';
import { NavigationScheduler } from '../packages/core/src/navigation/scheduler.js';

const start = { column: 0, row: 0 },
  goal = { column: 19, row: 0 };

describe('Scene-wide navigation scheduling', () => {
  it('admits independent owners fairly and caps the total expansion work of 120 routes', () => {
    const scheduler = new NavigationScheduler({ workBudget: 13 });
    const owners = Array.from(
      { length: 3 },
      () => new NavigationGrid2D({ columns: 20, rows: 2 }),
    );
    const jobs = owners.flatMap((owner) =>
      Array.from({ length: 40 }, () =>
        owner.scheduleSearch(scheduler, start, goal),
      ),
    );
    scheduler.update(3);
    expect(
      owners.map((_, index) =>
        jobs.slice(index * 40, index * 40 + 40).some((job) => job.admitted),
      ),
    ).toEqual([true, true, true]);
    for (
      let tick = 0;
      tick < 1000 && jobs.some((job) => job.status === 'pending');
      tick++
    ) {
      const before = jobs.reduce((sum, job) => sum + job.expansions, 0);
      const stats = scheduler.update();
      expect(stats.work).toBeLessThanOrEqual(13);
      expect(
        jobs.reduce((sum, job) => sum + job.expansions, 0) - before,
      ).toBeLessThanOrEqual(13);
    }
    expect(
      jobs.every((job) => job.status === 'found' && job.result!.cost === 19),
    ).toBe(true);
    scheduler.destroy();
    owners.forEach((owner) => owner.destroy());
  });

  it('invalidates queued and admitted jobs without mixing revisions, and clear releases admission', () => {
    const scheduler = new NavigationScheduler();
    const grid = new NavigationGrid2D({ columns: 20, rows: 1 });
    const first = grid.scheduleSearch(scheduler, start, goal);
    const queued = grid.scheduleSearch(scheduler, start, goal);
    scheduler.update(1);
    grid.setCell(10, 0, { walkable: false });
    expect(first.status).toBe('invalidated');
    expect(queued.status).toBe('invalidated');
    expect(first.result).toBeUndefined();
    const next = grid.scheduleSearch(scheduler, start, goal);
    scheduler.clear();
    expect(next.status).toBe('cancelled');
    const final = grid.scheduleSearch(scheduler, start, goal);
    for (let tick = 0; tick < 10 && final.status === 'pending'; tick++)
      scheduler.update();
    expect(final.result!.status).toBe('unreachable');
    scheduler.destroy();
    grid.destroy();
  });
});
