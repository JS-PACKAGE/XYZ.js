import ts from 'typescript';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import { resolve, relative } from 'node:path';
import process from 'node:process';
import console from 'node:console';
import {
  checkDeclarations,
  checkPublishedConsumers,
  validateBaseline,
} from './api-compatibility-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
if (process.argv.includes('--negative-smoke')) {
  const { runNegativeSmoke } = await import('./api-compatibility-smoke.mjs');
  await runNegativeSmoke(root);
} else {
  const directory = resolve(root, '.vite/api-compatibility');
  await mkdir(directory, { recursive: true });
  const report = {
    status: 'FAIL',
    scope:
      'Verified published v1.12.1 declarations: value/type namespaces, structural constructors, methods, overloads, generic constraints/defaults, nested interfaces/options, writable members, interface implementors and protected/abstract subclass obligations; maintained versioned consumer compilations against published and current types. Private implementation details and structural stand-ins for concrete classes are excluded; additive concrete class members are permitted. This is TypeScript source compatibility, not runtime/behavioral, binary or arbitrary historical-version certification.',
    baseline: null,
    consumers: [],
    diagnostics: [],
    removed: [],
    retained: 0,
  };
  try {
    const baseline = JSON.parse(
      await readFile(
        resolve(root, 'tests/consumers/declarations-v1.12.1.json'),
        'utf8',
      ),
    );
    validateBaseline(baseline);
    report.baseline = {
      version: baseline.version,
      provenance: baseline.provenance,
      declarationFiles: Object.keys(baseline.declarations).length,
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
    report.consumers = (await readdir(resolve(root, 'tests/consumers')))
      .filter((name) => name.endsWith('.ts') && !name.endsWith('.test.ts'))
      .sort();
    const consumers = report.consumers.map((name) =>
      resolve(root, 'tests/consumers', name),
    );
    const program = ts.createProgram({
      rootNames: [...parsed.fileNames, ...consumers],
      options: { ...parsed.options, noEmit: true },
    });
    const diagnostics = [
      ...parsed.errors,
      ...ts.getPreEmitDiagnostics(program),
    ];
    if (diagnostics.length) {
      report.diagnostics = diagnostics.map((item) => ({
        code: item.code,
        file: item.file?.fileName,
        message: ts.flattenDiagnosticMessageText(item.messageText, '\n'),
      }));
      console.error(
        ts.formatDiagnosticsWithColorAndContext(diagnostics, {
          getCanonicalFileName: (name) => name,
          getCurrentDirectory: () => root,
          getNewLine: () => '\n',
        }),
      );
    } else {
      // Emit declarations in memory from actual type sources, never compare a stale dist.
      const declarations = {};
      const emission = ts.createProgram({
        rootNames: parsed.fileNames,
        options: {
          ...parsed.options,
          noEmit: false,
          declaration: true,
          emitDeclarationOnly: true,
        },
      });
      const emitted = emission.emit(undefined, (path, text) => {
        if (path.endsWith('.d.ts'))
          declarations[relative(root, path).replaceAll('\\', '/')] = text;
      });
      if (emitted.emitSkipped || emitted.diagnostics.length)
        throw new Error(
          `Declaration emission failed: ${emitted.diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, '\n')).join('\n')}`,
        );
      const structural = checkDeclarations({
        previous: baseline.declarations,
        current: declarations,
        entry: baseline.entry,
        root,
        compilerOptions: parsed.options,
      });
      Object.assign(report, structural);
      const frozenConsumers = {};
      for (const name of report.consumers.filter((name) =>
        name.includes('v1.12.1'),
      ))
        frozenConsumers[name] = await readFile(
          resolve(root, 'tests/consumers', name),
          'utf8',
        );
      report.publishedConsumerDiagnostics = checkPublishedConsumers({
        baseline,
        consumers: frozenConsumers,
        root,
        compilerOptions: parsed.options,
      });
      if (report.publishedConsumerDiagnostics.length) {
        report.status = 'FAIL';
        report.diagnostics.push(
          ...report.publishedConsumerDiagnostics.map((item) => ({
            ...item,
            direction: 'published consumer fixture',
          })),
        );
      }
      // Retain the historical namespace guard as well as the newer complete baseline.
      const legacy = JSON.parse(
        await readFile(
          resolve(root, 'tests/consumers/public-exports-v1.11.json'),
          'utf8',
        ),
      );
      const checker = program.getTypeChecker();
      const symbol = checker.getSymbolAtLocation(
        program.getSourceFile(resolve(root, 'src/index.ts')),
      );
      const exports = new Map(
        checker
          .getExportsOfModule(symbol)
          .map((entry) => [
            entry.name,
            entry.flags & ts.SymbolFlags.Alias
              ? checker.getAliasedSymbol(entry)
              : entry,
          ]),
      );
      report.legacyExports = legacy.length;
      for (const entry of legacy) {
        const actual = exports.get(entry.name);
        if (
          !actual ||
          (entry.value && !(actual.flags & ts.SymbolFlags.Value)) ||
          (entry.type && !(actual.flags & ts.SymbolFlags.Type))
        ) {
          report.status = 'FAIL';
          report.diagnostics.push({
            export: entry.name,
            message: `Removed historical v1.11 value/type namespace: ${entry.name}`,
          });
        }
      }
      for (const item of report.diagnostics)
        console.error(
          `${item.export ?? item.file ?? 'API'}${item.member ? `.${item.member}` : ''}${item.direction ? ` [${item.direction}]` : ''}: ${item.message}`,
        );
      if (report.status === 'PASS')
        console.log(
          `PASS: v${baseline.version} structural API (${report.retained} exports, ${report.contracts} directional contracts), ${legacy.length} historical export namespaces and ${consumers.length} versioned consumers. Runtime semantics are not certified by declaration checks.`,
        );
    }
  } catch (error) {
    report.status = 'FAIL';
    report.diagnostics.push({
      message: error instanceof Error ? error.message : String(error),
    });
    console.error(error);
  }
  await writeFile(
    resolve(directory, 'report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  if (report.status !== 'PASS') process.exitCode = 1;
}
