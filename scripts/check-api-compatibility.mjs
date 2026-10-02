import ts from 'typescript';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import process from 'node:process';
import console from 'node:console';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = resolve(root, '.vite/api-compatibility');
await mkdir(directory, { recursive: true });
const report = {
  status: 'FAIL',
  scope:
    'Published value/type export names and maintained 1.x consumer fixtures; not comprehensive signature compatibility.',
  diagnostics: [],
  removed: [],
  retained: 0,
};
const config = ts.readConfigFile(
  resolve(root, 'tsconfig.json'),
  ts.sys.readFile,
);
if (config.error)
  throw new Error(
    ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
  );
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram({
  rootNames: [
    ...parsed.fileNames,
    resolve(root, 'tests/consumers/renderer-v1.10.ts'),
  ],
  options: { ...parsed.options, noEmit: true },
});
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) {
  report.diagnostics = diagnostics.map((diagnostic) =>
    ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  );
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (name) => name,
      getCurrentDirectory: () => root,
      getNewLine: () => '\n',
    }),
  );
  process.exitCode = 1;
} else {
  const baseline = JSON.parse(
    await readFile(
      resolve(root, 'tests/consumers/public-exports-v1.11.json'),
      'utf8',
    ),
  );
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(resolve(root, 'src/index.ts'));
  const symbol = checker.getSymbolAtLocation(source);
  const current = new Map(
    checker.getExportsOfModule(symbol).map((entry) => {
      const resolved =
        entry.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(entry)
          : entry;
      return [
        entry.name,
        {
          value: Boolean(resolved.flags & ts.SymbolFlags.Value),
          type: Boolean(resolved.flags & ts.SymbolFlags.Type),
        },
      ];
    }),
  );
  const removed = baseline
    .filter((entry) => {
      const actual = current.get(entry.name);
      return (
        !actual ||
        (entry.value && !actual.value) ||
        (entry.type && !actual.type)
      );
    })
    .map((entry) => entry.name);
  report.removed = removed;
  report.retained = baseline.length - removed.length;
  if (removed.length) {
    console.error(`Removed public exports: ${removed.join(', ')}`);
    process.exitCode = 1;
  } else {
    report.status = 'PASS';
    console.log(
      `PASS: ${baseline.length} published value/type exports retained; v1.10 custom Renderer consumer compiles. Signature compatibility beyond maintained consumer fixtures is not certified.`,
    );
  }
}
await writeFile(
  resolve(directory, 'report.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
