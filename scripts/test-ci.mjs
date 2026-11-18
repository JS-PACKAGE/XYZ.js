import console from 'node:console';
import process from 'node:process';
import { configDefaults } from 'vitest/config';
import { createVitest, startVitest } from 'vitest/node';

const proceduralFiles = [
  'tests/procedural-material.test.ts',
  'tests/procedural-material-motifs.test.ts',
];
const options = { run: true, watch: false };
const [argument, ...extra] = process.argv.slice(2);
const shard = /^(\d+)\/(\d+)$/.exec(argument ?? '');
if (extra.length || (!shard && argument !== 'regular')) {
  throw new Error('Usage: node scripts/test-ci.mjs regular|<index>/<count>');
}

if (argument === 'regular') {
  await startVitest([], {
    ...options,
    exclude: [...configDefaults.exclude, ...proceduralFiles],
  });
} else {
  const index = Number(shard[1]);
  const count = Number(shard[2]);
  if (!Number.isSafeInteger(count) || index < 1 || index > count) {
    throw new Error(`Invalid test shard: ${argument}`);
  }

  const vitest = await createVitest(options);
  try {
    await vitest.standalone();
    // Vitest's file sharding cannot subdivide the two large procedural suites.
    // Runtime collection expands parameterized cases and gives each a stable ID.
    const files = await vitest.getRelevantTestSpecifications(proceduralFiles);
    if (files.length !== proceduralFiles.length) {
      throw new Error('Could not resolve both procedural test files.');
    }
    const collected = await vitest.collectTests(files);
    if (
      collected.unhandledErrors.length ||
      collected.testModules.length !== files.length
    ) {
      throw new Error('Could not collect procedural test cases.', {
        cause: collected.unhandledErrors,
      });
    }

    const selected = new Set();
    const specs = files.map((file) => {
      const module = collected.testModules.find(
        (test) => test.moduleId === file.moduleId,
      );
      if (!module?.ok()) throw new Error(`Collection failed: ${file.moduleId}`);
      const cases = [...module.children.allTests()];
      const ids = cases
        .filter((_, i) => i % count === index - 1)
        .map((test) => test.id);
      if (!ids.length)
        throw new Error(`Empty shard ${argument}: ${file.moduleId}`);
      console.log(
        `Procedural shard ${argument}: ${ids.length}/${cases.length} cases in ${module.relativeModuleId}`,
      );
      for (const id of ids) selected.add(id);
      return file.project.createSpecification(
        file.moduleId,
        { testIds: ids },
        file.pool,
      );
    });

    const { testModules, unhandledErrors } =
      await vitest.runTestSpecifications(specs);
    for (const module of testModules) {
      for (const test of module.children.allTests()) {
        if (test.result().state === 'passed' && !selected.delete(test.id)) {
          throw new Error(
            `Unexpected case outside shard ${argument}: ${test.fullName}`,
          );
        }
      }
    }
    if (
      unhandledErrors.length ||
      testModules.length !== files.length ||
      selected.size ||
      testModules.some((test) => !test.ok())
    ) {
      throw new Error(
        `Procedural shard ${argument} did not pass: ${selected.size} selected cases without a pass.`,
        { cause: unhandledErrors },
      );
    }
  } finally {
    await vitest.close();
  }
}
