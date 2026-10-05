import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import console from 'node:console';
import { checkDeclarations } from './api-compatibility-lib.mjs';

export async function runNegativeSmoke(root) {
  const entry = 'dist/src/index.d.ts';
  const recursive = {
    [entry]:
      "export { Parent, Options } from './parent.js'; export { Child } from './child.js';",
    'dist/src/parent.d.ts':
      "import { Child } from './child.js'; export interface Options { label?: string; count?: number } export declare class Parent { child: Child; constructor(options?: Options); add<T extends Parent>(value: T): T; }",
    'dist/src/child.d.ts':
      "import { Parent } from './parent.js'; export declare class Child { parent: Parent; run<T extends Child>(value: T): T; }",
  };
  const cases = [
    [
      'unchanged contracts',
      'export interface Options { amount?: number } export declare class Engine { constructor(options?: Options); run(value: string): number; }',
      undefined,
      true,
    ],
    [
      'optional interface addition',
      'export interface Options { amount?: number }',
      'export interface Options { amount?: number; label?: string }',
      true,
    ],
    [
      'new export',
      'export declare function run(value: string): number;',
      'export declare function run(value: string): number; export interface Extra { label: string }',
      true,
    ],
    [
      'widened function input',
      'export declare function run(value: "one"): number;',
      'export declare function run(value: "one" | "two"): number;',
      true,
    ],
    [
      'concrete class and nested additions',
      'export declare class Child { value: number; } export declare class Engine { child: Child; run(): Child; }',
      'export declare class Child { value: number; extra(): void; } export declare class Engine { child: Child; run(): Child; added(): void; }',
      true,
    ],
    [
      'private class implementation change',
      'export declare class Engine { private state; run(): number; }',
      'export declare class Engine { private replacement; run(): number; }',
      true,
    ],
    [
      'opaque module symbol retained',
      'declare const brand: unique symbol; export interface Token { readonly [brand]: () => number; }',
      undefined,
      true,
    ],
    [
      'overload addition and reordering',
      'export declare function run(value: { x?: number }): string; export declare function run(value: number): number;',
      'export declare function run(value: boolean): boolean; export declare function run(value: number): number; export declare function run(value: { x?: number }): string;',
      true,
    ],
    [
      'fluent polymorphic this contract',
      'export declare class Engine { run(): this; copy(other: this): this; }',
      undefined,
      true,
    ],
    [
      'published bivariant generic factory constraint',
      'export interface Definition<T> { create(value: T): T } export type Definitions = Record<string, Definition<unknown>>; export declare class Registry<T extends Definitions> { constructor(definitions: T); } export declare function factory(): Registry<{ one: Definition<string> }>;',
      undefined,
      true,
    ],
    [
      'inferred readonly literal members',
      'export declare class Engine { readonly version = 0; readonly kind = "engine"; }',
      undefined,
      true,
    ],
    [
      'narrowed setter write type',
      'export declare class Box { get value(): string | undefined; set value(next: string | number); }',
      'export declare class Box { get value(): string | undefined; set value(next: string); }',
      false,
      /value/,
    ],
    [
      'widened setter write type (strict shadow equivalence)',
      'export declare class Box { get value(): string | undefined; set value(next: string); }',
      'export declare class Box { get value(): string | undefined; set value(next: string | number); }',
      false,
    ],
    [
      'this type predicate',
      'export declare class Node { isLeaf(): this is Node; }',
      undefined,
      true,
    ],
    [
      'identical cross-module recursive generic graph',
      {
        [entry]:
          "export { Parent } from './parent.js'; export { Child } from './child.js';",
        'dist/src/parent.d.ts':
          "import { Child } from './child.js'; export declare class Parent { child: Child; add<T extends Parent>(value: T): T; }",
        'dist/src/child.d.ts':
          "import { Parent } from './parent.js'; export declare class Child { parent: Parent; run<T extends Child>(value: T): T; }",
      },
      undefined,
      true,
    ],
    [
      'recursive graph with unrelated new export',
      recursive,
      {
        ...recursive,
        [entry]: `${recursive[entry]} export { Extra } from './child.js';`,
        'dist/src/child.d.ts': `${recursive['dist/src/child.d.ts']} export interface Extra { enabled: boolean }`,
      },
      true,
    ],
    [
      'recursive graph with additive options',
      recursive,
      {
        ...recursive,
        'dist/src/parent.d.ts': recursive['dist/src/parent.d.ts'].replace(
          'count?: number',
          'count?: number; enabled?: boolean',
        ),
      },
      true,
    ],
    [
      'recursive graph with inherited additive options',
      recursive,
      {
        ...recursive,
        'dist/src/parent.d.ts': recursive['dist/src/parent.d.ts'].replace(
          'export interface Options { label?: string; count?: number }',
          "import { TextOptions } from './options.js'; export interface Options extends TextOptions { count?: number }",
        ),
        'dist/src/options.d.ts':
          'export interface TextOptions { label?: string; enabled?: boolean }',
      },
      true,
    ],
    [
      'recursive graph still rejects removed optional input',
      recursive,
      {
        ...recursive,
        'dist/src/parent.d.ts': recursive['dist/src/parent.d.ts'].replace(
          'label?: string;',
          '',
        ),
      },
      false,
      /label/,
    ],
    [
      'recursive graph still rejects inherited required input',
      recursive,
      {
        ...recursive,
        'dist/src/parent.d.ts': recursive['dist/src/parent.d.ts'].replace(
          'export interface Options { label?: string; count?: number }',
          "import { TextOptions } from './options.js'; export interface Options extends TextOptions { count?: number }",
        ),
        'dist/src/options.d.ts':
          'export interface TextOptions { label?: string; enabled: boolean }',
      },
      false,
      /enabled/,
    ],
    [
      'long public string literal remains a contract',
      `export declare const source: ${JSON.stringify('a'.repeat(512))};`,
      `export declare const source: ${JSON.stringify('b'.repeat(512))};`,
      false,
      /source/,
    ],
    [
      'changed nested dependency is not interned',
      {
        [entry]: "export { Engine } from './engine.js';",
        'dist/src/engine.d.ts':
          "import { Options } from './options.js'; export declare class Engine { options: Options; constructor(options: Options); }",
        'dist/src/options.d.ts':
          'export interface Options { amount?: number; label?: string }',
      },
      {
        [entry]: "export { Engine } from './engine.js';",
        'dist/src/engine.d.ts':
          "import { Options } from './options.js'; export declare class Engine { options: Options; constructor(options: Options); }",
        'dist/src/options.d.ts': 'export interface Options { label?: string }',
      },
      false,
      /amount/,
    ],
    [
      'constructor overload removal',
      'export declare class Engine { constructor(value: string); constructor(value: number); }',
      'export declare class Engine { constructor(value: string); }',
      false,
      /Engine|constructor|number/,
    ],
    [
      'removed export',
      'export interface Options { amount?: number }',
      'export interface Other { amount?: number }',
      false,
      /Options/,
    ],
    [
      'changed value namespace',
      'export declare class Engine { run(): void; }',
      'export interface Engine { run(): void; }',
      false,
      /Engine/,
    ],
    [
      'required implementor member',
      'export interface Driver { run(): void; }',
      'export interface Driver { run(): void; stop(): void; }',
      false,
      /stop/,
    ],
    [
      'method parameter narrowing',
      'export interface Driver { run(value: string): void; }',
      'export interface Driver { run(value: "only"): void; }',
      false,
      /run/,
    ],
    [
      'method return change',
      'export interface Driver { run(): string; }',
      'export interface Driver { run(): number; }',
      false,
      /run/,
    ],
    [
      'removed overload',
      'export declare function run(value: string): string; export declare function run(value: number): number;',
      'export declare function run(value: string): string;',
      false,
      /run|number/,
    ],
    [
      'optional argument becomes required',
      'export declare function run(value?: string): void;',
      'export declare function run(value: string): void;',
      false,
      /run|string/,
    ],
    [
      'constructor input narrowing',
      'export declare class Engine { constructor(value: string); }',
      'export declare class Engine { constructor(value: "only"); }',
      false,
      /Engine|construct/,
    ],
    [
      'nested option becomes required',
      'export interface Options { sound?: { volume?: number } }',
      'export interface Options { sound?: { volume: number } }',
      false,
      /volume/,
    ],
    [
      'readonly mutation contract',
      'export interface Options { amount: number }',
      'export interface Options { readonly amount: number }',
      false,
      /amount/,
    ],
    [
      'optional member removal',
      'export interface Options { amount?: number; label?: string }',
      'export interface Options { label?: string }',
      false,
      /amount/,
    ],
    [
      'nested optional member removal',
      'export declare function run(options: { sound?: { volume?: number; label?: string } }): void;',
      'export declare function run(options: { sound?: { label?: string } }): void;',
      false,
      /volume/,
    ],
    [
      'nested readonly mutation contract',
      'export interface Options { sound: { volume: number } }',
      'export interface Options { sound: { readonly volume: number } }',
      false,
      /volume/,
    ],
    [
      'mapped readonly mutation contract',
      'export type Options = { amount: number }',
      'export type Options = Readonly<{ amount: number }>',
      false,
      /amount/,
    ],
    [
      'generic constraint narrowing',
      'export interface Box<T extends string | number> { value: T }',
      'export interface Box<T extends string> { value: T }',
      false,
      /constraint|string/,
    ],
    [
      'generic default changes',
      'export interface Box<T = string> { value: T }',
      'export interface Box<T = number> { value: T }',
      false,
      /value|number|string/,
    ],
    [
      'abstract subclass obligation',
      'export declare abstract class Engine { run(): void; }',
      'export declare abstract class Engine { run(): void; abstract stop(): void; }',
      false,
      /stop/,
    ],
    [
      'public member becomes protected',
      'export declare class Engine { run(): void; }',
      'export declare class Engine { protected run(): void; }',
      false,
      /run/,
    ],
  ];
  const results = [];
  for (const [name, oldText, newText, compatible, diagnostic] of cases) {
    const report = checkDeclarations({
      previous: typeof oldText === 'string' ? { [entry]: oldText } : oldText,
      current:
        typeof (newText ?? oldText) === 'string'
          ? { [entry]: newText ?? oldText }
          : (newText ?? oldText),
      entry,
      root,
      compilerOptions: { types: [], lib: ['lib.es2022.d.ts'] },
    });
    const messages = report.diagnostics
      .map(
        (item) => `${item.export ?? ''} ${item.member ?? ''} ${item.message}`,
      )
      .join('\n');
    assert.equal(
      report.status,
      compatible ? 'PASS' : 'FAIL',
      `${name}: unexpected compatibility result\n${messages}`,
    );
    if (diagnostic)
      assert.match(
        messages,
        diagnostic,
        `${name}: missing actionable diagnostic`,
      );
    results.push({
      name,
      expected: compatible ? 'PASS' : 'FAIL',
      observed: report.status,
      diagnostics: report.diagnostics,
    });
  }
  const directory = resolve(root, '.vite/api-compatibility');
  await mkdir(directory, { recursive: true });
  await writeFile(
    resolve(directory, 'negative-smoke.json'),
    `${JSON.stringify({ status: 'PASS', scope: 'Synthetic incompatible/compatible declarations through the same structural engine used by check:api-compatibility; no source mutation.', results }, null, 2)}\n`,
  );
  console.log(
    `PASS: ${cases.length} designed API compatibility cases (compatible additions accepted; breaking members rejected).`,
  );
}
