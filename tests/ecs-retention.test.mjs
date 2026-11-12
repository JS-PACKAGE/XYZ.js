import { execFile } from 'node:child_process';
import process from 'node:process';
import { URL } from 'node:url';
import { promisify } from 'node:util';
import { it } from 'vitest';

const execute = promisify(execFile);
const worldURL = new URL('../packages/ecs/src/world.ts', import.meta.url).href;

it('releases components held by suspended queries after World destruction', async () => {
  // A separate process gives this regression explicit GC without changing Vitest's heap.
  await execute(
    process.execPath,
    [
      '--expose-gc',
      '--experimental-strip-types',
      '--input-type=module',
      '--eval',
      `
import assert from 'node:assert/strict';
import { World } from ${JSON.stringify(worldURL)};
class First {}
class Second {}
function attach(world, entity, type) {
  const component = { payload: Array(32).fill(42) };
  world.addComponent(entity, type, component);
  return new WeakRef(component);
}
for (const mode of ['dense', 'sparse', 'throwing-cleanup']) {
  let query;
  const references = (() => {
    const world = new World();
    const first = world.createEntity();
    if (mode !== 'dense')
      for (let i = 0; i < 15; i++) world.createEntity();
    const references = [
      attach(world, first, First),
      attach(world, first, Second),
    ];
    if (mode === 'throwing-cleanup') {
      world.addSystem({
        update() {},
        destroy() {
          query = world.query(First, Second);
          assert.equal(query.next().value, first);
          throw new Error('cleanup failure');
        },
      });
      assert.throws(() => world.destroy(), AggregateError);
    } else {
      query = world.query(First, Second);
      assert.equal(query.next().value, first);
      world.destroy();
    }
    return references;
  })();
  // WeakRef keeps new targets alive until the creating job ends.
  await new Promise(setImmediate);
  global.gc();
  for (const reference of references)
    assert.equal(reference.deref(), undefined, mode + ' retained a component');
  // Keep the query live through GC, without resuming it early and hiding retention.
  assert.deepEqual(query.next(), { value: undefined, done: true });
}
`,
    ],
    { timeout: 10000 },
  );
});
