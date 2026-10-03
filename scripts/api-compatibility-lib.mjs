import ts from 'typescript';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';

export const baselineArchiveSha256 =
  'a0c2b6baf04b8a81db51eae92cd20fd1c79c4822bd2d8e8f84ce30835887c196';

export function validateBaseline(baseline) {
  if (
    baseline.format !== 1 ||
    baseline.version !== '1.12.1' ||
    baseline.provenance.archiveSha256 !== baselineArchiveSha256
  )
    throw new Error(
      'Unrecognized declaration baseline identity. Generate history only from the verified official release archive.',
    );
  if (!baseline.declarations[baseline.entry])
    throw new Error('Baseline entry declaration is missing.');
  for (const [path, text] of Object.entries(baseline.declarations)) {
    if (
      createHash('sha256').update(text).digest('hex') !==
      baseline.provenance.declarationSha256[path]
    )
      throw new Error(`Baseline declaration integrity failure: ${path}`);
  }
}

const modifier = (node, kind) =>
  node.modifiers?.some((item) => item.kind === kind) ?? false;
const privateMember = (node) =>
  modifier(node, ts.SyntaxKind.PrivateKeyword) ||
  (node.name && ts.isPrivateIdentifier(node.name));

function memberKey(member, source) {
  return `${modifier(member, ts.SyntaxKind.StaticKeyword)}:${member.name?.getText(source) ?? 'constructor'}`;
}

function publishedClassMembers(text, path) {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const classes = new Map();
  const visit = (node) => {
    if (ts.isClassDeclaration(node) && node.name)
      classes.set(
        node.name.text,
        new Map(
          node.members.map((member) => [memberKey(member, source), member]),
        ),
      );
    ts.forEachChild(node, visit);
  };
  visit(source);
  return classes;
}

// Compare private-brand-free declarations without changing their original method
// variance: generic API constraints may intentionally depend on method bivariance.
// Separate strict callable shadows below catch parameter narrowing, including
// constructors, without making valid published declaration graphs ill-formed.
function structuralSource(text, path, publishedClasses) {
  const source = ts.createSourceFile(
    path,
    text,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const opaqueSymbols = new Set();
  for (const statement of source.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      modifier(statement, ts.SyntaxKind.ExportKeyword)
    )
      continue;
    for (const declaration of statement.declarationList.declarations)
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.type &&
        ts.isTypeOperatorNode(declaration.type) &&
        declaration.type.operator === ts.SyntaxKind.UniqueKeyword
      )
        opaqueSymbols.add(declaration.name.text);
  }
  const transformed = ts.transform(source, [
    (context) => {
      const visit = (node) => {
        if (
          ts.isComputedPropertyName(node) &&
          ts.isIdentifier(node.expression) &&
          opaqueSymbols.has(node.expression.text)
        )
          return ts.factory.createStringLiteral(
            `__apiOpaque:${node.expression.text}`,
          );
        if (ts.isClassDeclaration(node)) {
          const published = node.name && publishedClasses?.get(node.name.text);
          const members = node.members
            .filter(
              (member) =>
                (!privateMember(member) ||
                  ts.isConstructorDeclaration(member)) &&
                (!published ||
                  ts.isConstructorDeclaration(member) ||
                  published.has(memberKey(member, source)) ||
                  modifier(member, ts.SyntaxKind.AbstractKeyword)),
            )
            .map((member) => {
              const copy = ts.factory.cloneNode(member);
              if (!ts.isConstructorDeclaration(member))
                copy.modifiers = member.modifiers?.filter(
                  (item) => item.kind !== ts.SyntaxKind.ProtectedKeyword,
                );
              return ts.visitEachChild(copy, visit, context);
            });
          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            members,
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (node) => ts.visitNode(node, visit);
    },
  ]);
  const printer = ts.createPrinter({ removeComments: true });
  const normalized = ts.createSourceFile(
    path,
    printer.printFile(transformed.transformed[0]),
    ts.ScriptTarget.Latest,
    true,
  );
  transformed.dispose();
  const helpers = [];
  for (const declaration of normalized.statements) {
    if (
      !declaration.name ||
      !ts.isIdentifier(declaration.name) ||
      !(
        ts.isClassDeclaration(declaration) ||
        ts.isInterfaceDeclaration(declaration) ||
        ts.isTypeAliasDeclaration(declaration)
      )
    )
      continue;
    const name = declaration.name.text;
    const parameters = declaration.typeParameters;
    const self = ts.factory.createTypeReferenceNode(
      name,
      parameters?.map((parameter) =>
        ts.factory.createTypeReferenceNode(parameter.name),
      ),
    );
    const strict = ts.transform(declaration, [
      (context) => {
        const visit = (node) => {
          // Polymorphic this stays intact in the real declaration. Its strict
          // callable shadow uses the containing type, avoiding illegal nested this.
          if (ts.isTypePredicateNode(node))
            return ts.factory.updateTypePredicateNode(
              node,
              node.assertsModifier,
              node.parameterName,
              node.type ? ts.visitNode(node.type, visit) : undefined,
            );
          if (ts.isThisTypeNode(node)) return self;
          if (ts.isTypeLiteralNode(node))
            return ts.factory.updateTypeLiteralNode(
              node,
              projectMembers(node.members, visit),
            );
          return ts.visitEachChild(node, visit, context);
        };
        function projectMembers(members, visitor, staticMembers = false) {
          const projected = [];
          const methods = new Map();
          for (const member of members) {
            if (
              privateMember(member) ||
              modifier(member, ts.SyntaxKind.StaticKeyword) !== staticMembers
            )
              continue;
            if (
              ts.isMethodDeclaration(member) ||
              ts.isMethodSignature(member)
            ) {
              const key = member.name.getText(normalized);
              if (!methods.has(key)) methods.set(key, []);
              methods.get(key).push(member);
            } else if (
              ts.isPropertyDeclaration(member) ||
              ts.isPropertySignature(member)
            ) {
              projected.push(
                ts.factory.createPropertySignature(
                  member.modifiers?.filter(
                    (item) => item.kind === ts.SyntaxKind.ReadonlyKeyword,
                  ),
                  member.name,
                  member.questionToken,
                  member.type
                    ? ts.visitNode(member.type, visitor)
                    : member.initializer
                      ? ts.factory.createLiteralTypeNode(member.initializer)
                      : undefined,
                ),
              );
            } else if (
              ts.isCallSignatureDeclaration(member) ||
              ts.isIndexSignatureDeclaration(member)
            ) {
              projected.push(ts.visitEachChild(member, visitor, context));
            } else if (
              ts.isSetAccessorDeclaration(member) &&
              ts.isIdentifier(member.name) &&
              member.parameters[0]?.type
            ) {
              // Property assignability compares only read types; model the write
              // type explicitly so narrowing a setter parameter is rejected.
              projected.push(
                ts.factory.createPropertySignature(
                  undefined,
                  `__api_set_${member.name.text}`,
                  undefined,
                  ts.visitNode(
                    ts.factory.createFunctionTypeNode(
                      undefined,
                      [
                        ts.factory.createParameterDeclaration(
                          undefined,
                          undefined,
                          'value',
                          undefined,
                          member.parameters[0].type,
                        ),
                      ],
                      ts.factory.createKeywordTypeNode(
                        ts.SyntaxKind.VoidKeyword,
                      ),
                    ),
                    visitor,
                  ),
                ),
              );
            } else if (ts.isConstructSignatureDeclaration(member)) {
              projected.push(
                ts.visitNode(
                  ts.factory.createCallSignature(
                    member.typeParameters,
                    member.parameters,
                    member.type,
                  ),
                  visitor,
                ),
              );
            }
          }
          for (const overloads of methods.values()) {
            const first = overloads[0];
            const functions = overloads.map((method) =>
              ts.visitNode(
                ts.factory.createFunctionTypeNode(
                  method.typeParameters,
                  method.parameters,
                  method.type ??
                    ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
                ),
                visitor,
              ),
            );
            projected.push(
              ts.factory.createPropertySignature(
                undefined,
                first.name,
                first.questionToken,
                functions.length === 1
                  ? functions[0]
                  : ts.factory.createIntersectionTypeNode(functions),
              ),
            );
          }
          return projected;
        }
        const shape = ts.isTypeAliasDeclaration(declaration)
          ? ts.visitNode(declaration.type, visit)
          : ts.factory.createTypeLiteralNode(
              projectMembers(declaration.members, visit),
            );
        helpers.push(
          ts.factory.createTypeAliasDeclaration(
            [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
            `__api_shape_${name}`,
            parameters,
            shape,
          ),
        );
        if (ts.isClassDeclaration(declaration)) {
          helpers.push(
            ts.factory.createTypeAliasDeclaration(
              [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
              `__api_static_${name}`,
              undefined,
              ts.factory.createTypeLiteralNode(
                projectMembers(declaration.members, visit, true),
              ),
            ),
          );
          const constructors = declaration.members.filter(
            ts.isConstructorDeclaration,
          );
          if (constructors.length) {
            const signatures = constructors.map((constructor) =>
              ts.factory.createFunctionTypeNode(
                parameters,
                constructor.parameters,
                self,
              ),
            );
            helpers.push(
              ts.factory.createTypeAliasDeclaration(
                [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)],
                `__api_ctor_${name}`,
                undefined,
                signatures.length === 1
                  ? signatures[0]
                  : ts.factory.createIntersectionTypeNode(signatures),
              ),
            );
          } else {
            helpers.push(
              ts.createSourceFile(
                path,
                `export type __api_ctor_${name} = typeof ${name} extends abstract new (...args: infer Args) => infer Instance ? (...args: Args) => Instance : never;`,
                ts.ScriptTarget.Latest,
                true,
              ).statements[0],
            );
          }
        }
        return (node) => node;
      },
    ]);
    strict.dispose();
  }
  return `${normalized.text}\n${helpers.map((node) => printer.printNode(ts.EmitHint.Unspecified, node, normalized)).join('\n')}\n`;
}

function makeProgram(files, roots, options) {
  const host = ts.createCompilerHost(options);
  const read = host.readFile.bind(host);
  const exists = host.fileExists.bind(host);
  host.readFile = (path) => files.get(resolve(path)) ?? read(path);
  host.fileExists = (path) => files.has(resolve(path)) || exists(path);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (path, languageVersion, onError, createNew) => {
    const text = files.get(resolve(path));
    return text === undefined
      ? getSourceFile(path, languageVersion, onError, createNew)
      : ts.createSourceFile(path, text, languageVersion, true);
  };
  const directories = new Set();
  for (const path of files.keys()) {
    let directory = dirname(path);
    while (!directories.has(directory)) {
      directories.add(directory);
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  const directoryExists = host.directoryExists?.bind(host);
  host.directoryExists = (path) =>
    directories.has(resolve(path)) || (directoryExists?.(path) ?? false);
  return ts.createProgram({ rootNames: roots, options, host });
}

function moduleExports(program, path) {
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(path);
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) throw new Error(`No declaration module at ${path}`);
  return new Map(
    checker
      .getExportsOfModule(symbol)
      .filter((entry) => !entry.name.startsWith('__api_'))
      .map((entry) => [
        entry.name,
        entry.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(entry)
          : entry,
      ]),
  );
}

function diagnosticRecord(diagnostic, contracts) {
  const position =
    diagnostic.file && diagnostic.start !== undefined
      ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
      : undefined;
  const contract =
    diagnostic.file && diagnostic.start !== undefined
      ? contracts.find(
          (item) =>
            resolve(item.file) === resolve(diagnostic.file.fileName) &&
            diagnostic.start >= item.start &&
            diagnostic.start < item.end,
        )
      : undefined;
  return {
    code: diagnostic.code,
    export: contract?.name,
    direction: contract?.direction,
    file: diagnostic.file?.fileName,
    line: position ? position.line + 1 : undefined,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
  };
}

function writable(symbol) {
  // TypeScript also marks readonly mapped properties on the resolved symbol.
  if (ts.getCheckFlags(symbol) & ts.CheckFlags.Readonly) return false;
  const declarations = symbol.declarations ?? [];
  if (declarations.some(ts.isSetAccessorDeclaration)) return true;
  if (declarations.some(ts.isGetAccessorDeclaration)) return false;
  return declarations.some(
    (node) =>
      (ts.isPropertySignature(node) || ts.isPropertyDeclaration(node)) &&
      !modifier(node, ts.SyntaxKind.ReadonlyKeyword),
  );
}

export function checkPublishedConsumers({
  baseline,
  consumers,
  root,
  compilerOptions,
}) {
  const directory = resolve(root, '.vite/api-compatibility/published');
  const files = new Map(
    Object.entries(baseline.declarations).map(([path, text]) => [
      resolve(directory, path),
      text,
    ]),
  );
  const roots = [];
  for (const [name, text] of Object.entries(consumers)) {
    const path = resolve(directory, 'consumers', name);
    files.set(
      path,
      text.replaceAll('../../src/index.js', '../dist/src/index.js'),
    );
    roots.push(path);
  }
  const program = makeProgram(files, roots, {
    ...compilerOptions,
    noEmit: true,
    rootDir: root,
  });
  return ts
    .getPreEmitDiagnostics(program)
    .map((diagnostic) => diagnosticRecord(diagnostic, []));
}

function checkMemberContracts(checker, previous, current, name, diagnostics) {
  const visited = new Map();
  const visit = (oldType, newType, path) => {
    oldType = checker.getNonNullableType(oldType);
    newType = checker.getNonNullableType(newType);
    let compared = visited.get(oldType);
    if (!compared) visited.set(oldType, (compared = new Set()));
    if (compared.has(newType)) return;
    compared.add(newType);
    if (oldType.isUnion() && newType.isUnion()) {
      for (const branch of oldType.types) {
        const tags = checker
          .getPropertiesOfType(branch)
          .filter((property) => checker.getTypeOfSymbol(property).isLiteral());
        if (!tags.length) continue;
        const candidates = newType.types.filter((candidate) =>
          tags.every((tag) => {
            const next = checker.getPropertyOfType(candidate, tag.name);
            return (
              next &&
              checker.typeToString(checker.getTypeOfSymbol(next)) ===
                checker.typeToString(checker.getTypeOfSymbol(tag))
            );
          }),
        );
        if (candidates.length === 1)
          visit(branch, candidates[0], `${path}.variant`);
      }
    }
    for (const member of checker.getPropertiesOfType(oldType)) {
      const next = checker.getPropertyOfType(newType, member.name);
      const declaration = member.valueDeclaration ?? member.declarations?.[0];
      if (
        !declaration ||
        !declaration.getSourceFile().fileName.includes('/virtual/previous/')
      )
        continue;
      const memberPath = `${path}.${member.name}`;
      if (!next) {
        diagnostics.push({
          export: name,
          member: memberPath,
          message: `${memberPath}: published member was removed (including optional members).`,
        });
        continue;
      }
      const nextDeclaration = next.valueDeclaration ?? next.declarations?.[0];
      if (!nextDeclaration) continue;
      if (writable(member) && !writable(next))
        diagnostics.push({
          export: name,
          member: memberPath,
          message: `${memberPath}: previously writable member is now readonly/getter-only.`,
        });
      visit(
        checker.getTypeOfSymbolAtLocation(member, declaration),
        checker.getTypeOfSymbolAtLocation(next, nextDeclaration),
        memberPath,
      );
    }
    for (const kind of [ts.SignatureKind.Call, ts.SignatureKind.Construct]) {
      const oldSignatures = checker.getSignaturesOfType(oldType, kind);
      const newSignatures = checker.getSignaturesOfType(newType, kind);
      for (const before of oldSignatures) {
        const printed = checker.signatureToString(before);
        const matching = newSignatures.filter(
          (signature) => checker.signatureToString(signature) === printed,
        );
        const candidates = matching.length
          ? matching
          : newSignatures.filter(
              (signature) =>
                signature.parameters.length === before.parameters.length &&
                signature.parameters.every(
                  (parameter, index) =>
                    checker.getTypeOfSymbol(parameter).flags ===
                    checker.getTypeOfSymbol(before.parameters[index]).flags,
                ),
            );
        // Overload additions/reordering are harmless. Never pair unrelated overloads.
        const after = candidates.length === 1 ? candidates[0] : undefined;
        if (!after) continue;
        visit(
          checker.getReturnTypeOfSignature(before),
          checker.getReturnTypeOfSignature(after),
          `${path}.return`,
        );
        for (
          let parameter = 0;
          parameter <
          Math.min(before.parameters.length, after.parameters.length);
          parameter++
        ) {
          const oldParameter = before.parameters[parameter];
          const newParameter = after.parameters[parameter];
          visit(
            checker.getTypeOfSymbol(oldParameter),
            checker.getTypeOfSymbol(newParameter),
            `${path}.argument[${parameter}]`,
          );
        }
      }
    }
  };
  visit(previous, current, name);
}

export function checkDeclarations({
  previous,
  current,
  entry,
  root,
  compilerOptions = {},
}) {
  const directory = resolve(root, '.vite/api-compatibility/virtual');
  const files = new Map();
  const oldPath = (path) =>
    resolve(directory, 'previous', path.replace(/\.d\.ts$/, '.ts'));
  const newPath = (path) =>
    resolve(directory, 'current', path.replace(/\.d\.ts$/, '.ts'));
  const normalizedPrevious = new Map();
  const normalizedCurrent = new Map();
  for (const [path, text] of Object.entries(previous))
    normalizedPrevious.set(path, structuralSource(text, path));
  for (const [path, text] of Object.entries(current))
    normalizedCurrent.set(
      path,
      structuralSource(
        text,
        path,
        previous[path]
          ? publishedClassMembers(previous[path], path)
          : undefined,
      ),
    );
  // Independently duplicated recursive generic graphs can be nominally unrelated
  // even when every declaration is identical. Intern only provably unchanged
  // dependency-closed modules (including cycles). Changed modules still undergo
  // every directional contract; text equality is never a rejection criterion.
  const shared = new Set(
    [...normalizedPrevious.keys()].filter(
      (path) => normalizedPrevious.get(path) === normalizedCurrent.get(path),
    ),
  );
  const dependencies = new Map();
  for (const [path, text] of normalizedPrevious) {
    const source = ts.createSourceFile(
      path,
      text,
      ts.ScriptTarget.Latest,
      true,
    );
    const referenced = new Set();
    const visit = (node) => {
      const specifier =
        ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
          ? node.moduleSpecifier
          : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
            ? node.argument.literal
            : undefined;
      if (
        specifier &&
        ts.isStringLiteral(specifier) &&
        specifier.text.startsWith('.')
      )
        referenced.add(
          relative(root, resolve(root, dirname(path), specifier.text))
            .replaceAll('\\', '/')
            .replace(/\.js$/, '.d.ts'),
        );
      ts.forEachChild(node, visit);
    };
    visit(source);
    dependencies.set(path, referenced);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const path of shared) {
      if (
        [...dependencies.get(path)].some(
          (dependency) => !shared.has(dependency),
        )
      ) {
        shared.delete(path);
        changed = true;
      }
    }
  }
  for (const [path, text] of normalizedPrevious) files.set(oldPath(path), text);
  for (const [path, text] of normalizedCurrent) files.set(newPath(path), text);
  for (const path of shared) {
    const canonical = resolve(
      directory,
      'shared',
      path.replace(/\.d\.ts$/, '.ts'),
    );
    files.set(canonical, normalizedPrevious.get(path));
    for (const facade of [oldPath(path), newPath(path)]) {
      const importPath = relative(dirname(facade), canonical)
        .replaceAll('\\', '/')
        .replace(/\.ts$/, '.js');
      files.set(
        facade,
        `export * from '${importPath.startsWith('.') ? importPath : `./${importPath}`}';\n`,
      );
    }
  }
  const options = {
    ...compilerOptions,
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    strict: true,
    skipLibCheck: compilerOptions.skipLibCheck ?? true,
    noEmit: true,
    noUnusedLocals: false,
    noUnusedParameters: false,
    rootDir: root,
  };
  const roots = [oldPath(entry), newPath(entry)];
  const initial = makeProgram(files, roots, options);
  const checker = initial.getTypeChecker();
  const oldExports = moduleExports(initial, roots[0]);
  const newExports = moduleExports(initial, roots[1]);
  const diagnostics = [];
  const removed = [];
  const contracts = [];
  let contractId = 0;
  function append(file, name, direction, body) {
    file = resolve(file);
    const before = files.get(file);
    files.set(file, `${before}\n${body}\n`);
    contracts.push({
      file,
      name,
      direction,
      start: before.length,
      end: files.get(file).length,
    });
  }
  for (const [name, previousSymbol] of oldExports) {
    const actual = newExports.get(name);
    const namespaces = ts.SymbolFlags.Value | ts.SymbolFlags.Type;
    if (
      !actual ||
      previousSymbol.flags & namespaces & ~(actual.flags & namespaces)
    ) {
      removed.push(name);
      diagnostics.push({
        export: name,
        message: `Removed export or value/type namespace: ${name}`,
      });
      continue;
    }
    const declaration = previousSymbol.declarations?.find(
      (node) => node.name && ts.isIdentifier(node.name),
    );
    if (!declaration) {
      diagnostics.push({
        export: name,
        message:
          'Unsupported exported declaration shape; refusing to silently skip compatibility coverage.',
      });
      continue;
    }
    const file = declaration.getSourceFile().fileName;
    const localName = declaration.name.text;
    const importName = `__CurrentAPI${contractId++}`;
    const importPath = relative(dirname(file), roots[1])
      .replaceAll('\\', '/')
      .replace(/\.ts$/, '.js');
    append(
      file,
      name,
      'module',
      `import * as ${importName} from '${importPath.startsWith('.') ? importPath : `./${importPath}`}';`,
    );
    const currentDeclaration = actual.declarations?.find(
      (node) => node.name && ts.isIdentifier(node.name),
    );
    const shadowable =
      ts.isClassDeclaration(declaration) ||
      ts.isInterfaceDeclaration(declaration) ||
      ts.isTypeAliasDeclaration(declaration);
    let shadowImport;
    if (shadowable && currentDeclaration) {
      shadowImport = `__CurrentShadow${contractId++}`;
      const shadowPath = relative(
        dirname(file),
        currentDeclaration.getSourceFile().fileName,
      )
        .replaceAll('\\', '/')
        .replace(/\.ts$/, '.js');
      append(
        file,
        name,
        'module',
        `import * as ${shadowImport} from '${shadowPath.startsWith('.') ? shadowPath : `./${shadowPath}`}';`,
      );
      if (
        ts.isClassDeclaration(declaration) &&
        ts.isClassDeclaration(currentDeclaration)
      ) {
        append(
          file,
          name,
          'strict constructor arguments',
          `function __apiConstructor${contractId++}() { let previous!: __api_ctor_${localName}; const current: ${shadowImport}.__api_ctor_${currentDeclaration.name.text} = null!; previous = current; return previous; }`,
        );
        append(
          file,
          name,
          'strict static methods',
          `function __apiStatic${contractId++}() { let previous!: __api_static_${localName}; const current: ${shadowImport}.__api_static_${currentDeclaration.name.text} = null!; previous = current; return previous; }`,
        );
      }
    }
    if (previousSymbol.flags & ts.SymbolFlags.Value) {
      append(
        file,
        name,
        'consumer value/constructor',
        `function __apiValue${contractId++}() { let previous!: typeof ${localName}; const current: typeof ${importName}.${name} = null!; previous = current; return previous; }`,
      );
      checkMemberContracts(
        checker,
        checker.getTypeOfSymbol(previousSymbol),
        checker.getTypeOfSymbol(actual),
        name,
        diagnostics,
      );
    }
    if (previousSymbol.flags & ts.SymbolFlags.Type) {
      const parameters = declaration.typeParameters ?? [];
      const printer = ts.createPrinter();
      const generics = parameters.length
        ? `<${parameters.map((node) => printer.printNode(ts.EmitHint.Unspecified, node, declaration.getSourceFile())).join(', ')}>`
        : '';
      const argumentsText = parameters.length
        ? `<${parameters.map((node) => node.name.text).join(', ')}>`
        : '';
      const previousType = `${localName}${argumentsText}`;
      const currentType = `${importName}.${name}${argumentsText}`;
      const classType = ts.isClassDeclaration(declaration);
      if (shadowImport) {
        append(
          file,
          name,
          'strict method/nested callable signatures',
          `function __apiStrict${contractId++}${generics}() { let previous!: __api_shape_${localName}${argumentsText}; let current!: ${shadowImport}.__api_shape_${currentDeclaration.name.text}${argumentsText}; previous = current; current = previous; return current; }`,
        );
      }
      append(
        file,
        name,
        'consumer type/return',
        `function __apiConsumer${contractId++}${generics}() { let previous!: ${previousType}; const current: ${currentType} = null!; previous = current; return previous; }`,
      );
      // Class additions are inherited by subclasses, not required from structural
      // implementors. Interfaces/options must still accept the old implementations.
      append(
        file,
        name,
        'implementor/options',
        `function __apiImplementor${contractId++}${generics}() { const previous: ${previousType} = null!; let current!: ${classType ? `Pick<${currentType}, keyof ${previousType}>` : currentType}; current = previous; return current; }`,
      );
      // Omitted generic arguments must retain their historical defaults too.
      for (
        let count = parameters.length - 1;
        count >= 0 && parameters[count].default;
        count--
      ) {
        const remaining = parameters.slice(0, count);
        const partialGenerics = remaining.length
          ? `<${remaining.map((node) => printer.printNode(ts.EmitHint.Unspecified, node, declaration.getSourceFile())).join(', ')}>`
          : '';
        const partialArguments = remaining.length
          ? `<${remaining.map((node) => node.name.text).join(', ')}>`
          : '';
        append(
          file,
          name,
          'generic defaults',
          `function __apiDefaults${contractId++}${partialGenerics}() { let previous!: ${localName}${partialArguments}; let current!: ${importName}.${name}${partialArguments}; previous = current; current = previous; return current; }`,
        );
      }
      const oldType = checker.getDeclaredTypeOfSymbol(previousSymbol);
      const newType = checker.getDeclaredTypeOfSymbol(actual);
      checkMemberContracts(checker, oldType, newType, name, diagnostics);
      if (classType) {
        for (const member of checker.getPropertiesOfType(newType)) {
          if (
            !checker.getPropertyOfType(oldType, member.name) &&
            member.declarations?.some((node) =>
              modifier(node, ts.SyntaxKind.AbstractKeyword),
            )
          )
            diagnostics.push({
              export: name,
              member: member.name,
              message: `${name}.${member.name}: new abstract member is mandatory for existing subclasses.`,
            });
        }
      }
    }
  }
  // Additive concrete class members are inherited, including inside nested return
  // types. Exclude only those additions from the comparison graph, not interfaces
  // or abstract obligations. Existing members and all signatures remain checked.
  for (const [path, text] of Object.entries(current)) {
    const publishedClasses = previous[path]
      ? publishedClassMembers(previous[path], path)
      : undefined;
    if (!publishedClasses) continue;
    const currentClasses = publishedClassMembers(text, path);
    for (const [className, members] of publishedClasses) {
      const nextMembers = currentClasses.get(className);
      if (!nextMembers) continue;
      for (const [key, member] of members) {
        if (privateMember(member)) continue;
        const next = nextMembers.get(key);
        if (!next) continue;
        const previouslyPublic = !modifier(
          member,
          ts.SyntaxKind.ProtectedKeyword,
        );
        if (
          privateMember(next) ||
          (previouslyPublic && modifier(next, ts.SyntaxKind.ProtectedKeyword))
        )
          diagnostics.push({
            export: className,
            member: key.split(':').slice(1).join(':'),
            message: `${className}.${key}: accessible member became private/protected.`,
          });
      }
    }
  }
  const contractProgram = makeProgram(files, roots, options);
  diagnostics.push(
    ...ts
      .getPreEmitDiagnostics(contractProgram)
      .map((item) => diagnosticRecord(item, contracts)),
  );
  return {
    status: diagnostics.length ? 'FAIL' : 'PASS',
    exports: oldExports.size,
    retained: oldExports.size - removed.length,
    removed,
    contracts: contracts.filter((item) => item.direction !== 'module').length,
    internedDeclarationModules: shared.size,
    diagnostics,
  };
}
