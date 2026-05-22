#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const srcRoot = path.join(root, 'src');

function toRel(abs) {
  return path.relative(root, abs).replaceAll(path.sep, '/');
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

const files = walk(srcRoot);
const sourceCache = new Map();

function sourceFile(relPath) {
  const abs = path.join(root, relPath);
  let sf = sourceCache.get(abs);
  if (!sf) {
    sf = ts.createSourceFile(abs, fs.readFileSync(abs, 'utf8'), ts.ScriptTarget.Latest, true);
    sourceCache.set(abs, sf);
  }
  return sf;
}

function lineOf(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function propName(name, constants = new Map()) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  if (ts.isComputedPropertyName(name)) {
    if (ts.isIdentifier(name.expression)) return constants.get(name.expression.text);
    if (ts.isPropertyAccessExpression(name.expression)) return name.expression.name.text;
  }
  return undefined;
}

function stringValue(expr, constants = new Map()) {
  expr = unwrapConstExpression(expr);
  if (!expr) return undefined;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr.text;
  if (ts.isIdentifier(expr)) return constants.get(expr.text);
  return undefined;
}

function numberValue(expr, constants = new Map()) {
  expr = unwrapConstExpression(expr);
  if (!expr) return undefined;
  if (ts.isNumericLiteral(expr)) return Number(expr.text);
  if (ts.isIdentifier(expr)) return constants.get(expr.text);
  return undefined;
}

function unwrapConstExpression(expr) {
  while (
    expr
    && (ts.isAsExpression(expr)
      || ts.isSatisfiesExpression(expr)
      || ts.isParenthesizedExpression(expr)
      || ts.isTypeAssertionExpression(expr))
  ) {
    expr = expr.expression;
  }
  return expr;
}

function forEachNode(sf, cb) {
  function visit(node) {
    cb(node);
    ts.forEachChild(node, visit);
  }
  visit(sf);
}

function varInitializer(relPath, name) {
  const sf = sourceFile(relPath);
  let found;
  forEachNode(sf, node => {
    if (!ts.isVariableDeclaration(node)) return;
    if (!ts.isIdentifier(node.name) || node.name.text !== name) return;
    found = node.initializer;
  });
  return found;
}

function stringConstants(relPath) {
  const sf = sourceFile(relPath);
  const constants = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      const text = stringValue(decl.initializer);
      if (text !== undefined) constants.set(decl.name.text, text);
    }
  }
  return constants;
}

function stringArrayValues(expr, constants = new Map(), arrayConstants = new Map()) {
  expr = unwrapConstExpression(expr);
  if (!expr) return [];
  const sf = expr.getSourceFile();
  if (ts.isIdentifier(expr)) {
    const values = arrayConstants.get(expr.text);
    return values ? values.map(id => ({ id, line: lineOf(sf, expr) })) : [];
  }
  if (
    ts.isCallExpression(expr)
    && ts.isPropertyAccessExpression(expr.expression)
    && expr.expression.name.text === 'slice'
  ) {
    return stringArrayValues(expr.expression.expression, constants, arrayConstants);
  }
  if (ts.isConditionalExpression(expr)) {
    return [
      ...stringArrayValues(expr.whenTrue, constants, arrayConstants),
      ...stringArrayValues(expr.whenFalse, constants, arrayConstants),
    ];
  }
  if (!ts.isArrayLiteralExpression(expr)) return [];
  const out = [];
  for (const element of expr.elements) {
    if (ts.isSpreadElement(element)) {
      out.push(...stringArrayValues(element.expression, constants, arrayConstants));
      continue;
    }
    const id = stringValue(element, constants);
    if (id) out.push({ id, line: lineOf(sf, element) });
  }
  return out;
}

function stringArrayConstants(relPath) {
  const sf = sourceFile(relPath);
  const constants = stringConstants(relPath);
  const arrays = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      const values = stringArrayValues(decl.initializer, constants, arrays).map(v => v.id);
      if (values.length > 0) arrays.set(decl.name.text, values);
    }
  }
  return arrays;
}

function numberConstants(relPath) {
  const sf = sourceFile(relPath);
  const constants = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name)) continue;
      const value = numberValue(decl.initializer);
      if (value !== undefined) constants.set(decl.name.text, value);
    }
  }
  return constants;
}

function objectKeys(relPath, name) {
  const init = varInitializer(relPath, name);
  if (!init || !ts.isObjectLiteralExpression(init)) return [];
  const constants = stringConstants(relPath);
  return init.properties
    .filter(ts.isPropertyAssignment)
    .map(p => ({ id: propName(p.name, constants), file: relPath, line: lineOf(sourceFile(relPath), p) }))
    .filter(v => v.id);
}

function objectKeysInFiles(name) {
  const out = [];
  for (const abs of files) {
    const relPath = toRel(abs);
    const sf = sourceFile(relPath);
    forEachNode(sf, node => {
      if (!ts.isVariableDeclaration(node)) return;
      if (!ts.isIdentifier(node.name) || node.name.text !== name) return;
      if (!node.initializer || !ts.isObjectLiteralExpression(node.initializer)) return;
      const constants = stringConstants(relPath);
      for (const p of node.initializer.properties) {
        if (!ts.isPropertyAssignment(p)) continue;
        const id = propName(p.name, constants);
        if (id) out.push({ id, file: relPath, line: lineOf(sf, p) });
      }
    });
  }
  return out;
}

function arrayObjects(relPath, name) {
  const init = arrayInitializer(relPath, varInitializer(relPath, name));
  if (!init || !ts.isArrayLiteralExpression(init)) return [];
  const sf = sourceFile(relPath);
  return init.elements
    .filter(ts.isObjectLiteralExpression)
    .map(node => ({ node, line: lineOf(sf, node), file: relPath }));
}

function arrayInitializer(relPath, expr) {
  expr = unwrapConstExpression(expr);
  if (!expr) return undefined;
  if (ts.isArrayLiteralExpression(expr)) return expr;
  if (
    ts.isCallExpression(expr)
    && ts.isPropertyAccessExpression(expr.expression)
    && expr.expression.name.text === 'map'
    && ts.isIdentifier(expr.expression.expression)
  ) {
    return arrayInitializer(relPath, varInitializer(relPath, expr.expression.expression.text));
  }
  return undefined;
}

function getObjectString(obj, key, constants = new Map()) {
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p) || propName(p.name) !== key) continue;
    return stringValue(p.initializer, constants);
  }
  return undefined;
}

function getObjectNumber(obj, key, constants = new Map()) {
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p) || propName(p.name) !== key) continue;
    return numberValue(p.initializer, constants);
  }
  return undefined;
}

function getObjectStringArray(obj, key, constants = new Map()) {
  const arrays = stringArrayConstants(toRel(obj.getSourceFile().fileName));
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p) || propName(p.name) !== key) continue;
    return stringArrayValues(p.initializer, constants, arrays);
  }
  return [];
}

function getObjectArrayObjects(obj, key) {
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p) || propName(p.name) !== key) continue;
    const init = unwrapConstExpression(p.initializer);
    if (!init || !ts.isArrayLiteralExpression(init)) return [];
    const sf = p.getSourceFile();
    const out = [];
    for (const element of init.elements) {
      const node = unwrapConstExpression(element);
      if (node && ts.isObjectLiteralExpression(node)) out.push({ node, line: lineOf(sf, node) });
    }
    return out;
  }
  return [];
}

function getObjectProp(obj, key) {
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p) || propName(p.name) !== key) continue;
    return p.initializer;
  }
  return undefined;
}

function constObject(relPath, name) {
  const init = unwrapConstExpression(varInitializer(relPath, name));
  return init && ts.isObjectLiteralExpression(init) ? init : undefined;
}

function arrayIds(relPath, name) {
  const constants = stringConstants(relPath);
  return arrayObjects(relPath, name)
    .map(({ node, line, file }) => ({ id: getObjectString(node, 'id', constants), line, file }))
    .filter(v => v.id);
}

function exportedConstObjectIds(relPath, namePattern) {
  const sf = sourceFile(relPath);
  const constants = stringConstants(relPath);
  const out = [];
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt) || !hasExportModifier(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !namePattern.test(decl.name.text)) continue;
      const init = unwrapConstExpression(decl.initializer);
      if (!init || !ts.isObjectLiteralExpression(init)) continue;
      const id = getObjectString(init, 'id', constants);
      if (id) out.push({ id, name: decl.name.text, file: relPath, line: lineOf(sf, decl) });
    }
  }
  return out;
}

function arrayPropIds(relPath, name, prop) {
  const constants = stringConstants(relPath);
  return arrayObjects(relPath, name)
    .map(({ node, line, file }) => ({ id: getObjectString(node, prop, constants), line, file }))
    .filter(v => v.id);
}

function arrayPropStringRefs(relPath, name, prop) {
  const constants = stringConstants(relPath);
  const out = [];
  for (const entry of arrayObjects(relPath, name)) {
    for (const value of getObjectStringArray(entry.node, prop, constants)) {
      out.push({ id: value.id, file: entry.file, line: value.line });
    }
  }
  return out;
}

function documentedProfileIds(relPath) {
  const text = fs.readFileSync(path.join(root, relPath), 'utf8');
  const heading = /^## Existing Profiles\s*$/m.exec(text);
  if (!heading) return [];
  const sectionStart = heading.index + heading[0].length;
  const rest = text.slice(sectionStart);
  const nextHeading = /^## /m.exec(rest);
  const section = nextHeading ? rest.slice(0, nextHeading.index) : rest;
  const out = [];
  const bulletRe = /^-\s+`([^`]+)`/gm;
  let bullet;
  while ((bullet = bulletRe.exec(section)) !== null) {
    const line = text.slice(0, sectionStart + bullet.index).split('\n').length;
    out.push({ id: bullet[1], file: relPath, line });
  }
  return out;
}

function objectStringArrayRefs(relPath, name) {
  const init = varInitializer(relPath, name);
  if (!init || !ts.isObjectLiteralExpression(init)) return [];
  const constants = stringConstants(relPath);
  const arrays = stringArrayConstants(relPath);
  const sf = sourceFile(relPath);
  const out = [];
  for (const p of init.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const key = propName(p.name) ?? '<computed>';
    for (const value of stringArrayValues(p.initializer, constants, arrays)) {
      out.push({ id: value.id, key, file: relPath, line: value.line });
    }
  }
  return out;
}

function propertyStringArrayRefs(relPath, arrayName, prop) {
  const constants = stringConstants(relPath);
  const arrays = stringArrayConstants(relPath);
  const out = [];
  for (const entry of arrayObjects(relPath, arrayName)) {
    const initializer = getObjectProp(entry.node, prop);
    if (!initializer) continue;
    for (const value of stringArrayValues(initializer, constants, arrays)) {
      out.push({ id: value.id, owner: getObjectString(entry.node, 'id', constants), prop, file: entry.file, line: value.line });
    }
  }
  return out;
}

function nestedRumorIdRefs(relPath) {
  const constants = stringConstants(relPath);
  const arrays = stringArrayConstants(relPath);
  const out = [];
  const sf = sourceFile(relPath);
  forEachNode(sf, node => {
    if (!ts.isPropertyAssignment(node) || propName(node.name) !== 'rumorIds') return;
    for (const value of stringArrayValues(node.initializer, constants, arrays)) {
      out.push({ id: value.id, file: relPath, line: value.line });
    }
  });
  return out;
}

function nestedWarningTagRefs(relPath, arrayName) {
  const constants = stringConstants(relPath);
  const out = [];
  function visitReveal(expr, owner, file) {
    expr = unwrapConstExpression(expr);
    if (!expr) return;
    if (ts.isArrayLiteralExpression(expr)) {
      for (const element of expr.elements) visitReveal(element, owner, file);
      return;
    }
    if (!ts.isObjectLiteralExpression(expr)) return;
    const kind = getObjectString(expr, 'kind', constants);
    const tag = getObjectString(expr, 'tag', constants);
    if (kind === 'warning' && tag) out.push({ id: tag, owner, prop: 'reveals.tag', file, line: lineOf(expr.getSourceFile(), expr) });
  }
  for (const entry of arrayObjects(relPath, arrayName)) {
    const owner = getObjectString(entry.node, 'id', constants);
    visitReveal(getObjectProp(entry.node, 'reveals'), owner, entry.file);
  }
  return out;
}

function arrayObjectNestedArrayCount(relPath, arrayName, prop) {
  let total = 0;
  for (const entry of arrayObjects(relPath, arrayName)) {
    const value = unwrapConstExpression(getObjectProp(entry.node, prop));
    if (!value || !ts.isArrayLiteralExpression(value)) continue;
    total += value.elements.filter(ts.isObjectLiteralExpression).length;
  }
  return total;
}

function readmeCountTable() {
  const text = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const out = new Map();
  for (const line of text.split(/\r?\n/)) {
    const match = /^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|$/.exec(line);
    if (!match) continue;
    const label = match[1].trim();
    const value = match[2].trim();
    if (!label || label === 'Domain' || label === '---') continue;
    out.set(label, value);
  }
  return out;
}

function enumMembers(relPath, name) {
  const sf = sourceFile(relPath);
  const out = [];
  forEachNode(sf, node => {
    if (!ts.isEnumDeclaration(node) || node.name.text !== name) return;
    for (const member of node.members) out.push({ id: propName(member.name), line: lineOf(sf, member) });
  });
  return out;
}

function numberConst(relPath, name) {
  return numberValue(varInitializer(relPath, name));
}

function duplicateIds(entries) {
  const seen = new Map();
  const dupes = [];
  for (const entry of entries) {
    if (!entry.id) continue;
    const previous = seen.get(entry.id);
    if (previous) dupes.push({ id: entry.id, first: previous, second: entry });
    else seen.set(entry.id, entry);
  }
  return dupes;
}

function hasExportModifier(node) {
  return !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
}

function identifierName(expr) {
  expr = unwrapConstExpression(expr);
  return expr && ts.isIdentifier(expr) ? expr.text : undefined;
}

function importSpecifierRefs(stmt) {
  const refs = [];
  const clause = stmt.importClause;
  if (!clause || clause.isTypeOnly) return refs;
  if (clause.name) refs.push({ importedName: 'default', localName: clause.name.text, node: clause.name });
  const namedBindings = clause.namedBindings;
  if (!namedBindings || !ts.isNamedImports(namedBindings)) return refs;
  for (const specifier of namedBindings.elements) {
    if (specifier.isTypeOnly) continue;
    refs.push({
      importedName: specifier.propertyName ? specifier.propertyName.text : specifier.name.text,
      localName: specifier.name.text,
      node: specifier,
    });
  }
  return refs;
}

function runnerName(name) {
  return /^(?:generate|spawn|run)[A-Z]/.test(name);
}

function manifestExportRunnerName(name) {
  return /^generate[A-Z]/.test(name)
    || /^run[A-Z].*Content/.test(name)
    || /^spawn[A-Z].*(?:Content|Npcs|Npc)/.test(name);
}

function exportedFunctionEntries(relPath) {
  const sf = sourceFile(relPath);
  const out = [];
  for (const stmt of sf.statements) {
    if (ts.isFunctionDeclaration(stmt) && stmt.name && hasExportModifier(stmt)) {
      out.push({ name: stmt.name.text, file: relPath, line: lineOf(sf, stmt) });
      continue;
    }
    if (!ts.isVariableStatement(stmt) || !hasExportModifier(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
      const init = unwrapConstExpression(decl.initializer);
      if (init && (ts.isArrowFunction(init) || ts.isFunctionExpression(init))) {
        out.push({ name: decl.name.text, file: relPath, line: lineOf(sf, decl) });
      }
    }
  }
  return out;
}

function topLevelContentRegistrations(relPath) {
  const sf = sourceFile(relPath);
  const registrations = [];
  const zoneGenerators = [];
  for (const stmt of sf.statements) {
    if (!ts.isExpressionStatement(stmt)) continue;
    const expr = unwrapConstExpression(stmt.expression);
    if (!expr || !ts.isCallExpression(expr) || !ts.isIdentifier(expr.expression)) continue;
    const call = expr.expression.text;
    if (!['registerSideQuest', 'registerSideQuestSteps', 'registerZoneContent'].includes(call)) continue;
    registrations.push({ call, file: relPath, line: lineOf(sf, expr) });
    if (call === 'registerZoneContent') {
      const generator = identifierName(expr.arguments[2]);
      if (generator) zoneGenerators.push({ id: generator, file: relPath, line: lineOf(sf, expr.arguments[2]) });
    }
  }
  return { registrations, zoneGenerators };
}

function callsIdentifier(node, name) {
  let found = false;
  function visit(child) {
    if (found) return;
    if (ts.isCallExpression(child) && identifierName(child.expression) === name) {
      found = true;
      return;
    }
    ts.forEachChild(child, visit);
  }
  visit(node);
  return found;
}

function forOfVariableName(node) {
  const init = node.initializer;
  if (ts.isIdentifier(init)) return init.text;
  if (!ts.isVariableDeclarationList(init)) return undefined;
  const decl = init.declarations[0];
  return decl && ts.isIdentifier(decl.name) ? decl.name.text : undefined;
}

function forOfRunnerArray(relPath, expr) {
  expr = unwrapConstExpression(expr);
  if (!expr) return undefined;
  if (ts.isArrayLiteralExpression(expr)) return expr;
  if (ts.isIdentifier(expr)) return arrayInitializer(relPath, varInitializer(relPath, expr.text));
  return undefined;
}

const directCallCache = new Map();
function directCallRefs(relPath, name) {
  const key = `${relPath}\0${name}`;
  const cached = directCallCache.get(key);
  if (cached) return cached;
  const sf = sourceFile(relPath);
  const refs = [];
  forEachNode(sf, node => {
    if (!ts.isCallExpression(node) || identifierName(node.expression) !== name) return;
    refs.push({ file: relPath, line: lineOf(sf, node), kind: 'call' });
  });
  directCallCache.set(key, refs);
  return refs;
}

const manifestInvocationCache = new Map();
function manifestInvocationRefs(relPath, name) {
  const key = `${relPath}\0${name}`;
  const cached = manifestInvocationCache.get(key);
  if (cached) return cached;
  const sf = sourceFile(relPath);
  const refs = [...directCallRefs(relPath, name)];
  if (relPath === 'src/gen/design_floors/manifest.ts') {
    const generatorMap = constObject(relPath, 'DESIGN_FLOOR_GENERATORS');
    if (generatorMap) {
      for (const p of generatorMap.properties) {
        if (!ts.isPropertyAssignment(p) || identifierName(p.initializer) !== name) continue;
        refs.push({ file: relPath, line: lineOf(sf, p.initializer), kind: 'generator map' });
      }
    }
  }
  forEachNode(sf, node => {
    if (!ts.isForOfStatement(node)) return;
    const loopVar = forOfVariableName(node);
    if (!loopVar || !callsIdentifier(node.statement, loopVar)) return;
    const arr = forOfRunnerArray(relPath, node.expression);
    if (!arr) return;
    for (const element of arr.elements) {
      if (identifierName(element) !== name) continue;
      refs.push({ file: relPath, line: lineOf(sf, element), kind: 'ordered runner list' });
    }
  });
  refs.sort((a, b) => a.line - b.line);
  manifestInvocationCache.set(key, refs);
  return refs;
}

function resolveImport(fromAbs, spec) {
  if (!spec.startsWith('.')) return undefined;
  const base = path.resolve(path.dirname(fromAbs), spec);
  for (const candidate of [`${base}.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

const importIncoming = new Map();
const importIncomingDeclRefs = new Map();
const importIncomingNamedRefs = new Map();
const manifestEntries = new Map();
const manifestImportRefs = [];
const manifestImportBindings = [];
const manifestRunnerImportRefs = [];
for (const abs of files) {
  const relPath = toRel(abs);
  const sf = sourceFile(relPath);
  for (const stmt of sf.statements) {
    if (!ts.isImportDeclaration(stmt)) continue;
    const spec = stringValue(stmt.moduleSpecifier);
    if (!spec) continue;
    const target = resolveImport(abs, spec);
    if (target) {
      const relTarget = toRel(target);
      if (!importIncoming.has(relTarget)) importIncoming.set(relTarget, new Set());
      importIncoming.get(relTarget).add(relPath);
      if (!importIncomingDeclRefs.has(relTarget)) importIncomingDeclRefs.set(relTarget, []);
      importIncomingDeclRefs.get(relTarget).push({
        file: relPath,
        line: lineOf(sf, stmt),
        spec,
        sideEffect: !stmt.importClause,
      });
      for (const named of importSpecifierRefs(stmt)) {
        if (!importIncomingNamedRefs.has(relTarget)) importIncomingNamedRefs.set(relTarget, []);
        importIncomingNamedRefs.get(relTarget).push({
          importedName: named.importedName,
          localName: named.localName,
          file: relPath,
          line: lineOf(sf, named.node),
          spec,
        });
      }
    }
    if (abs.endsWith('/content_manifest.ts') && target) {
      const targetRel = toRel(target);
      for (const named of importSpecifierRefs(stmt)) {
        if (!runnerName(named.localName) && !runnerName(named.importedName)) continue;
        manifestRunnerImportRefs.push({
          target: targetRel,
          importedName: named.importedName,
          localName: named.localName,
          file: relPath,
          line: lineOf(sf, named.node),
          spec,
        });
        manifestImportBindings.push({
          target: targetRel,
          imported: named.importedName,
          local: named.localName,
          file: relPath,
          line: lineOf(sf, named.node),
        });
      }
    }
    if (abs.endsWith('/content_manifest.ts') && spec.startsWith('./')) {
      const floor = path.basename(path.dirname(abs));
      const rel = target ? toRel(target) : `${toRel(path.dirname(abs))}/${spec}`;
      if (!manifestEntries.has(floor)) manifestEntries.set(floor, []);
      manifestEntries.get(floor).push(rel);
      manifestImportRefs.push({
        floor,
        spec,
        target: target ? toRel(target) : undefined,
        file: relPath,
        line: lineOf(sf, stmt),
        sideEffect: !stmt.importClause,
      });
    } else if (relPath === 'src/gen/design_floors/manifest.ts' && target && spec.startsWith('./')) {
      for (const named of importSpecifierRefs(stmt)) {
        manifestImportBindings.push({
          target: toRel(target),
          imported: named.importedName,
          local: named.localName,
          file: relPath,
          line: lineOf(sf, named.node),
        });
      }
    }
  }
}

const sideQuestNpcEntries = [];
const sideQuestEntries = [];
const zoneEntries = [];
const itemRefs = [];
const npcRefs = [];
const rewardTableRefs = [];
const directItemCallRefs = [];

const knownItemProps = new Set(['defId', 'targetItem', 'rewardItem', 'itemId', 'sampleId']);
const knownNpcProps = new Set(['giverNpcId', 'targetNpcId', 'targetPlotNpcId']);
const directItemCallNames = new Set(['addItem', 'addItemDrop', 'dropItem']);

for (const abs of files) {
  const rel = toRel(abs);
  const sf = sourceFile(rel);
  const numberConstants = new Map();
  const stringConstants = new Map();
  for (const stmt of sf.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name)) {
        const value = numberValue(decl.initializer);
        if (value !== undefined) numberConstants.set(decl.name.text, value);
        const text = stringValue(decl.initializer);
        if (text !== undefined) stringConstants.set(decl.name.text, text);
      }
    }
  }
  forEachNode(sf, node => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === 'registerSideQuest') {
        const npcId = stringValue(node.arguments[0], stringConstants);
        if (npcId) sideQuestNpcEntries.push({ id: npcId, file: rel, line: lineOf(sf, node) });
        const questArg = node.arguments[2];
        if (questArg && ts.isArrayLiteralExpression(questArg)) {
          for (const element of questArg.elements) {
            if (!ts.isObjectLiteralExpression(element)) continue;
            sideQuestEntries.push({
              id: getObjectString(element, 'id', stringConstants),
              file: rel,
              line: lineOf(sf, element),
            });
          }
        }
      }
      if (node.expression.text === 'registerZoneContent') {
        const zoneId = numberValue(node.arguments[0], numberConstants);
        const labelArg = node.arguments[1];
        const label = stringValue(labelArg)
          ?? (labelArg && ts.isIdentifier(labelArg) ? stringConstants.get(labelArg.text) : undefined);
        zoneEntries.push({ id: zoneId === undefined ? undefined : String(zoneId), label, file: rel, line: lineOf(sf, node) });
      }
      if (directItemCallNames.has(node.expression.text) && (rel.startsWith('src/gen/') || rel.startsWith('src/systems/'))) {
        for (const arg of node.arguments) {
          const id = stringValue(arg, stringConstants);
          if (id === undefined) continue;
          directItemCallRefs.push({ id, call: node.expression.text, file: rel, line: lineOf(sf, arg) });
          break;
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const name = propName(node.name);
      const value = stringValue(node.initializer, stringConstants);
      if (value && knownItemProps.has(name)) itemRefs.push({ id: value, prop: name, file: rel, line: lineOf(sf, node) });
      if (value && knownNpcProps.has(name)) npcRefs.push({ id: value, prop: name, file: rel, line: lineOf(sf, node) });
      if (name === 'rewardTable' && ts.isArrayLiteralExpression(node.initializer)) {
        for (const item of node.initializer.elements) {
          const id = stringValue(item, stringConstants);
          if (id) rewardTableRefs.push({ id, prop: 'rewardTable', file: rel, line: lineOf(sf, item) });
        }
      }
      if (name === 'plotNpcs' && ts.isArrayLiteralExpression(node.initializer)) {
        for (const item of node.initializer.elements) {
          const id = stringValue(item, stringConstants);
          if (id) npcRefs.push({ id, prop: 'plotNpcs', file: rel, line: lineOf(sf, item) });
        }
      }
    }
  });
}

const itemEntries = [
  ...objectKeys('src/data/items.ts', 'ITEMS'),
  ...objectKeys('src/data/chernobog_docket.ts', 'CHERNOBOG_DOCKET_ITEMS'),
];
const localNpcDefEntries = objectKeysInFiles('NPC_DEFS');
const plotNpcEntries = [
  ...objectKeys('src/data/plot.ts', 'PLOT_NPCS'),
  ...sideQuestNpcEntries,
];
const contractEntries = arrayIds('src/data/contracts.ts', 'CONTRACTS');
const rumorEntries = arrayIds('src/data/rumors.ts', 'RUMORS');
const slimeEntries = arrayIds('src/data/slime_defs.ts', 'SLIME_DEFS');
const slimeSampleEntries = arrayPropIds('src/data/slime_defs.ts', 'SLIME_DEFS', 'sampleId');
const slimeTextHandleRefs = arrayPropStringRefs('src/data/slime_defs.ts', 'SLIME_DEFS', 'textHandles');
const zhelemishEntries = arrayPropIds('src/data/zhelemish_defs.ts', 'ZHELEMISH_DEFS', 'itemId');
const floorGeometryEntries = arrayIds('src/data/procedural_floors.ts', 'FLOOR_GEOMETRIES');
const floorMajorityEntries = arrayIds('src/data/procedural_floors.ts', 'FLOOR_MAJORITY_FACTIONS');
const floorAnomalyEntries = arrayIds('src/data/procedural_floors.ts', 'FLOOR_ANOMALIES');
const floorGeometryDocEntries = documentedProfileIds('Docs/ProceduralFloors/geometry.md');
const floorAnomalyDocEntries = documentedProfileIds('Docs/ProceduralFloors/anomaly.md');
const proceduralLootRefs = objectStringArrayRefs('src/data/procedural_floors.ts', 'LOOT_BY_TAG');
const monsterKindEntries = enumMembers('src/core/types.ts', 'MonsterKind');
const worldEventTypeEntries = arrayInitializer('src/core/types.ts', varInitializer('src/core/types.ts', 'WORLD_EVENT_TYPES'))?.elements
  .map(node => ({ id: stringValue(node), file: 'src/core/types.ts', line: lineOf(sourceFile('src/core/types.ts'), node) }))
  .filter(v => v.id) ?? [];
const monsterRegistryEntries = objectKeys('src/entities/monster.ts', 'MONSTERS');
const monsterEcologyEntries = arrayObjects('src/data/monster_ecology.ts', 'MONSTER_ECOLOGY');
const plotChainEntries = arrayObjects('src/data/plot.ts', 'PLOT_CHAIN');
const designFloorRouteEntries = arrayIds('src/data/design_floors.ts', 'DESIGN_FLOOR_ROUTES');
const designFloorGeneratorEntries = objectKeys('src/gen/design_floors/manifest.ts', 'DESIGN_FLOOR_GENERATORS');
const populationProfileEntries = exportedConstObjectIds('src/data/population_profiles.ts', /_POPULATION_PROFILE$/);
const screenSignalEntries = arrayIds('src/data/screen_signals.ts', 'SCREEN_SIGNAL_DEFS');
const screenSignalEventTypeRefs = propertyStringArrayRefs('src/data/screen_signals.ts', 'SCREEN_SIGNAL_DEFS', 'eventTypes');
const screenSignalTagRefs = propertyStringArrayRefs('src/data/screen_signals.ts', 'SCREEN_SIGNAL_DEFS', 'tags');
const contractTagRefs = propertyStringArrayRefs('src/data/contracts.ts', 'CONTRACTS', 'tags');
const sideQuestTagRefs = propertyStringArrayRefs('src/data/plot.ts', 'SIDE_QUESTS', 'eventTags');
const rumorWarningTagRefs = nestedWarningTagRefs('src/data/rumors.ts', 'RUMORS');
const nestedRumorRefs = [];
for (const abs of files) {
  const rel = toRel(abs);
  if (!/^src\/(data|gen|systems)\//.test(rel)) continue;
  nestedRumorRefs.push(...nestedRumorIdRefs(rel));
}
const resourceEntries = arrayIds('src/data/resources.ts', 'RESOURCES');
const caravanEntries = arrayIds('src/data/caravans.ts', 'CARAVAN_LANES');
const factoryEntries = arrayIds('src/data/factories.ts', 'FACTORIES');
const factoryRecipeCount = arrayObjectNestedArrayCount('src/data/factories.ts', 'FACTORIES', 'recipes');
const physWeaponEntries = objectKeys('src/data/weapons.ts', 'PHYS_WEAPON_STATS');
const psiWeaponEntries = objectKeys('src/data/psi.ts', 'PSI_WEAPON_STATS');
const samosborVariantEntries = arrayIds('src/data/samosbor_variants.ts', 'SAMOSBOR_VARIANTS');
const samosborModifierEntries = objectKeys('src/data/samosbor_variants.ts', 'SAMOSBOR_MODIFIERS');
const samosborAftermathEntries = arrayIds('src/data/samosbor_variants.ts', 'SAMOSBOR_AFTERMATH_BEATS');
const samosborDirectorEntries = arrayIds('src/data/samosbor_director.ts', 'BASELINE_BEATS');

const itemIds = new Set(itemEntries.map(v => v.id));
const questTargetItemIds = new Set([...itemIds, 'money']);
const itemOrMoneyIds = new Set([...itemIds, 'money']);
const plotNpcIds = new Set([...plotNpcEntries, ...localNpcDefEntries].map(v => v.id));
const rumorIds = new Set(rumorEntries.map(v => v.id));
const worldEventTypes = new Set(worldEventTypeEntries.map(v => v.id));

const errors = [];
function addDuplicateErrors(label, entries) {
  for (const d of duplicateIds(entries)) {
    errors.push(`${label} duplicate "${d.id}" at ${d.second.file ?? ''}:${d.second.line}; first at ${d.first.file ?? ''}:${d.first.line}`);
  }
}

function addDocProfileSyncErrors(label, sourceEntries, docEntries, docPath) {
  if (docEntries.length === 0) {
    errors.push(`${docPath} missing Existing Profiles ${label} list`);
    return;
  }
  const sourceIds = sourceEntries.map(v => v.id);
  const docIds = docEntries.map(v => v.id);
  const sourceSet = new Set(sourceIds);
  const docSet = new Set(docIds);
  for (const source of sourceEntries) {
    if (!docSet.has(source.id)) errors.push(`${docPath} missing ${label} "${source.id}" from ${source.file}:${source.line}`);
  }
  for (const doc of docEntries) {
    if (!sourceSet.has(doc.id)) errors.push(`${doc.file}:${doc.line} documents unknown ${label} "${doc.id}"`);
  }
  if (
    sourceIds.length === docIds.length &&
    sourceIds.every(id => docSet.has(id)) &&
    docIds.some((id, i) => id !== sourceIds[i])
  ) {
    errors.push(`${docPath} ${label} order differs from source: expected ${sourceIds.join(', ')}`);
  }
}

addDuplicateErrors('ITEMS', itemEntries);
addDuplicateErrors('PLOT_NPCS/registerSideQuest', plotNpcEntries);
addDuplicateErrors('SIDE_QUESTS', sideQuestEntries);
addDuplicateErrors('CONTRACTS', contractEntries);
addDuplicateErrors('RUMORS', rumorEntries);
addDuplicateErrors('SLIME_DEFS', slimeEntries);
addDuplicateErrors('SLIME sample ids', slimeSampleEntries);
addDuplicateErrors('ZHELEMISH_DEFS', zhelemishEntries);
addDuplicateErrors('FLOOR_GEOMETRIES', floorGeometryEntries);
addDuplicateErrors('FLOOR_MAJORITY_FACTIONS', floorMajorityEntries);
addDuplicateErrors('FLOOR_ANOMALIES', floorAnomalyEntries);
addDuplicateErrors('Docs procedural geometry profiles', floorGeometryDocEntries);
addDuplicateErrors('Docs procedural anomaly profiles', floorAnomalyDocEntries);
addDuplicateErrors('DESIGN_FLOOR_ROUTES', designFloorRouteEntries);
addDuplicateErrors('DESIGN_FLOOR_GENERATORS', designFloorGeneratorEntries);
addDuplicateErrors('POPULATION_PROFILES', populationProfileEntries);
addDuplicateErrors('WORLD_EVENT_TYPES', worldEventTypeEntries);
addDuplicateErrors('SCREEN_SIGNAL_DEFS', screenSignalEntries);
addDuplicateErrors('RESOURCES', resourceEntries);
addDuplicateErrors('CARAVAN_LANES', caravanEntries);
addDuplicateErrors('FACTORIES', factoryEntries);
addDuplicateErrors('SAMOSBOR_VARIANTS', samosborVariantEntries);
addDuplicateErrors('SAMOSBOR_MODIFIERS', samosborModifierEntries);
addDuplicateErrors('SAMOSBOR_AFTERMATH_BEATS', samosborAftermathEntries);
addDuplicateErrors('SAMOSBOR_DIRECTOR_BEATS', samosborDirectorEntries);
addDuplicateErrors('LIVING zone content', zoneEntries.filter(v => v.file.includes('/living/')));

addDocProfileSyncErrors('procedural geometry profile', floorGeometryEntries, floorGeometryDocEntries, 'Docs/ProceduralFloors/geometry.md');
addDocProfileSyncErrors('procedural anomaly profile', floorAnomalyEntries, floorAnomalyDocEntries, 'Docs/ProceduralFloors/anomaly.md');

const designFloorGeneratorIds = new Set(designFloorGeneratorEntries.map(v => v.id));
for (const route of designFloorRouteEntries) {
  if (!designFloorGeneratorIds.has(route.id)) errors.push(`${route.file}:${route.line} design floor route "${route.id}" has no generator`);
}
const designFloorRouteIds = new Set(designFloorRouteEntries.map(v => v.id));
for (const generator of designFloorGeneratorEntries) {
  if (!designFloorRouteIds.has(generator.id)) errors.push(`${generator.file}:${generator.line} design floor generator "${generator.id}" has no route`);
}

const contentManifestPaths = files
  .map(toRel)
  .filter(rel => /^src\/gen\/[^/]+\/content_manifest\.ts$/.test(rel))
  .sort();
const manifestRunnerExports = contentManifestPaths.flatMap(rel => (
  exportedFunctionEntries(rel).filter(entry => manifestExportRunnerName(entry.name))
));

function location(ref) {
  return `${ref.file}:${ref.line}`;
}

function ownerLocation(ref) {
  const owner = exportedFunctionEntries(ref.target).find(entry => entry.name === ref.importedName);
  return owner ? `${owner.file}:${owner.line}` : `${ref.target}:?`;
}

const manifestImportTargets = new Map();
for (const ref of manifestImportRefs) {
  if (!ref.target) continue;
  const sameManifestKey = `${ref.file}\0${ref.target}`;
  const previousInManifest = manifestImportTargets.get(sameManifestKey);
  if (previousInManifest) {
    errors.push(`${ref.file}:${ref.line} duplicate manifest import "${ref.spec}" resolves to ${ref.target}; first at ${previousInManifest.file}:${previousInManifest.line}`);
  } else {
    manifestImportTargets.set(sameManifestKey, ref);
  }
}

const manifestImportTargetOwners = new Map();
for (const ref of manifestImportRefs) {
  if (!ref.target) continue;
  const previous = manifestImportTargetOwners.get(ref.target);
  if (previous && previous.file !== ref.file) {
    errors.push(`${ref.file}:${ref.line} manifest import "${ref.spec}" duplicates ${ref.target}; first manifest owner ${previous.file}:${previous.line}`);
  } else if (!previous) {
    manifestImportTargetOwners.set(ref.target, ref);
  }
}

const manifestRunnerImports = new Map();
for (const ref of manifestRunnerImportRefs) {
  const key = `${ref.file}\0${ref.target}\0${ref.importedName}`;
  const previous = manifestRunnerImports.get(key);
  if (previous) {
    errors.push(`${ref.file}:${ref.line} duplicate manifest runner import "${ref.importedName}" from "${ref.spec}"; first at ${previous.file}:${previous.line}; owner ${ownerLocation(ref)}`);
  } else {
    manifestRunnerImports.set(key, ref);
  }
}

for (const rel of contentManifestPaths) {
  const incoming = importIncomingDeclRefs.get(rel) ?? [];
  if (incoming.length === 0) {
    errors.push(`${rel}:1 content manifest is not imported by production source`);
  } else if (incoming.length > 1) {
    const first = incoming[0];
    for (const duplicate of incoming.slice(1)) {
      errors.push(`${duplicate.file}:${duplicate.line} duplicate production import of ${rel}; first at ${first.file}:${first.line}`);
    }
  }
}

for (const ref of manifestRunnerImportRefs) {
  const calls = manifestInvocationRefs(ref.file, ref.localName);
  if (calls.length === 0) {
    errors.push(`${ref.file}:${ref.line} manifest runner "${ref.localName}" from "${ref.spec}" is imported but never invoked; owner ${ownerLocation(ref)}`);
  } else if (calls.length > 1) {
    errors.push(`${ref.file}:${ref.line} manifest runner "${ref.localName}" from "${ref.spec}" is invoked ${calls.length} times (${calls.map(location).join(', ')}); owner ${ownerLocation(ref)}`);
  }
}

for (const runner of manifestRunnerExports) {
  const incoming = (importIncomingNamedRefs.get(runner.file) ?? []).filter(ref => ref.importedName === runner.name);
  if (incoming.length === 0) {
    errors.push(`${runner.file}:${runner.line} exported manifest runner "${runner.name}" is not imported by production source`);
    continue;
  }
  const calls = [];
  for (const ref of incoming) {
    const refs = directCallRefs(ref.file, ref.localName);
    if (refs.length === 0) {
      errors.push(`${ref.file}:${ref.line} imports manifest runner "${runner.name}" from ${runner.file}:${runner.line} but never calls it`);
    }
    calls.push(...refs);
  }
  if (calls.length > 1) {
    errors.push(`${runner.file}:${runner.line} exported manifest runner "${runner.name}" is called ${calls.length} times (${calls.map(location).join(', ')})`);
  }
}

const tagIdRe = /^[a-z][a-z0-9_]*$/;
for (const ref of screenSignalEventTypeRefs) {
  if (!worldEventTypes.has(ref.id)) errors.push(`${ref.file}:${ref.line} SCREEN_SIGNAL_DEFS.${ref.owner ?? '<unknown>'}.eventTypes references missing WorldEventType "${ref.id}"`);
}
for (const ref of [...screenSignalTagRefs, ...contractTagRefs, ...sideQuestTagRefs, ...rumorWarningTagRefs]) {
  if (!tagIdRe.test(ref.id)) errors.push(`${ref.file}:${ref.line} ${ref.prop} uses non-static or invalid event tag id "${ref.id}"`);
}
for (const ref of nestedRumorRefs) {
  if (!rumorIds.has(ref.id)) errors.push(`${ref.file}:${ref.line} rumorIds references missing rumor "${ref.id}"`);
}

for (const ref of manifestImportRefs) {
  if (!ref.target) {
    errors.push(`${ref.file}:${ref.line} ${ref.floor} manifest import "${ref.spec}" does not resolve to a .ts file`);
    continue;
  }
  if (ref.sideEffect) {
    const text = fs.readFileSync(path.join(root, ref.target), 'utf8');
    if (!/register(?:SideQuest|ZoneContent)\s*\(/.test(text)) {
      errors.push(`${ref.file}:${ref.line} side-effect manifest import "${ref.spec}" resolves to ${ref.target} but does not register zone content or a side quest`);
    }
  }
}

const livingZoneHudMax = numberConst('src/core/types.ts', 'WORLD_EVENT_ZONE_COUNT') ?? 64;
for (const zone of zoneEntries) {
  if (zone.id === undefined) {
    errors.push(`${zone.file}:${zone.line} registerZoneContent must use a static numeric zone HUD id`);
    continue;
  }
  const zoneId = Number(zone.id);
  if (!Number.isInteger(zoneId) || zoneId < 1 || zoneId > livingZoneHudMax) {
    errors.push(`${zone.file}:${zone.line} registerZoneContent zone ${zone.id} is outside HUD zone range 1..${livingZoneHudMax}`);
  }
  if (zone.label === undefined || zone.label.trim().length === 0) {
    errors.push(`${zone.file}:${zone.line} registerZoneContent zone ${zone.id} must use a static non-empty title`);
  }
}

for (const ref of itemRefs) {
  const allowed = ref.prop === 'targetItem' ? questTargetItemIds : itemIds;
  if (!allowed.has(ref.id)) errors.push(`${ref.file}:${ref.line} ${ref.prop} references missing item "${ref.id}"`);
}
for (const ref of rewardTableRefs) {
  if (!itemOrMoneyIds.has(ref.id)) errors.push(`${ref.file}:${ref.line} ${ref.prop} references missing item or money "${ref.id}"`);
}
for (const ref of directItemCallRefs) {
  if (!itemIds.has(ref.id)) errors.push(`${ref.file}:${ref.line} ${ref.call} references missing item "${ref.id}"`);
}
for (const ref of npcRefs) {
  if (!plotNpcIds.has(ref.id)) errors.push(`${ref.file}:${ref.line} ${ref.prop} references missing plot NPC "${ref.id}"`);
}
for (const ref of slimeTextHandleRefs) {
  if (!rumorIds.has(ref.id)) errors.push(`${ref.file}:${ref.line} slime textHandle references missing rumor "${ref.id}"`);
}
for (const ref of proceduralLootRefs) {
  if (!itemIds.has(ref.id)) errors.push(`${ref.file}:${ref.line} LOOT_BY_TAG.${ref.key} references missing item "${ref.id}"`);
}

const ostovMetaPath = 'src/gen/living/samosbornyy_ostov.ts';
const ostovMetaObject = constObject(ostovMetaPath, 'SAMOSBORNYY_OSTOV_METADATA');
if (!ostovMetaObject) {
  errors.push(`${ostovMetaPath} missing SAMOSBORNYY_OSTOV_METADATA`);
} else {
  const stringConsts = stringConstants(ostovMetaPath);
  const numberConsts = numberConstants(ostovMetaPath);
  const metadata = {
    id: getObjectString(ostovMetaObject, 'id', stringConsts),
    floor: getObjectString(ostovMetaObject, 'floor', stringConsts),
    zoneHudId: getObjectNumber(ostovMetaObject, 'zoneHudId', numberConsts),
    zoneTitle: getObjectString(ostovMetaObject, 'zoneTitle', stringConsts),
    reachability: getObjectString(ostovMetaObject, 'reachability', stringConsts),
    samosbor: getObjectString(ostovMetaObject, 'samosbor', stringConsts),
    performance: getObjectString(ostovMetaObject, 'performance', stringConsts),
  };
  if (metadata.id !== 'samosbornyy_ostov') errors.push(`${ostovMetaPath}:${lineOf(sourceFile(ostovMetaPath), ostovMetaObject)} SAMOSBORNYY_OSTOV_METADATA.id must be "samosbornyy_ostov"`);
  if (metadata.floor !== 'living') errors.push(`${ostovMetaPath}:${lineOf(sourceFile(ostovMetaPath), ostovMetaObject)} SAMOSBORNYY_OSTOV_METADATA.floor must be "living"`);
  if (metadata.zoneHudId !== 64) errors.push(`${ostovMetaPath}:${lineOf(sourceFile(ostovMetaPath), ostovMetaObject)} SAMOSBORNYY_OSTOV_METADATA.zoneHudId must be 64`);
  for (const key of ['zoneTitle', 'reachability', 'samosbor', 'performance']) {
    if (!metadata[key]) errors.push(`${ostovMetaPath}:${lineOf(sourceFile(ostovMetaPath), ostovMetaObject)} SAMOSBORNYY_OSTOV_METADATA.${key} is required`);
  }
  const zoneEntry = zoneEntries.find(v => v.file === ostovMetaPath && v.id === String(metadata.zoneHudId));
  if (!zoneEntry) {
    errors.push(`${ostovMetaPath}:${lineOf(sourceFile(ostovMetaPath), ostovMetaObject)} SAMOSBORNYY_OSTOV_METADATA.zoneHudId is not registered`);
  } else if (metadata.zoneTitle !== zoneEntry.label) {
    errors.push(`${ostovMetaPath}:${lineOf(sourceFile(ostovMetaPath), ostovMetaObject)} SAMOSBORNYY_OSTOV_METADATA.zoneTitle differs from registered zone label`);
  }
}

const helperModules = new Set([
  'admin_common.ts',
  'apartments.ts',
  'content_helpers.ts',
  'content_manifest.ts',
  'index.ts',
  'full_floor.ts',
  'manifest.ts',
  'npcs.ts',
  'posters.ts',
  'side_quests.ts',
  'slides.ts',
  'social_helpers.ts',
  'social_pressure.ts',
  'tutor_room.ts',
  'volatile.ts',
  'zone_content.ts',
]);

const unimportedContent = [];
for (const abs of files) {
  const rel = toRel(abs);
  if (!/^src\/gen\/(living|ministry|maintenance|kvartiry|hell|void|design_floors)\//.test(rel)) continue;
  if (helperModules.has(path.basename(abs))) continue;
  const text = fs.readFileSync(abs, 'utf8');
  const looksLikeContent = /registerSideQuest|registerZoneContent|export function (generate|spawn)/.test(text);
  if (looksLikeContent && !importIncoming.has(rel)) unimportedContent.push(rel);
}

console.log('Content QA registry audit');
console.log('');
console.log('Counts');
console.log(`- plot NPC ids: ${plotNpcEntries.length} (${objectKeys('src/data/plot.ts', 'PLOT_NPCS').length} base + ${sideQuestNpcEntries.length} side-effect registered)`);
console.log(`- local NPC defs found: ${localNpcDefEntries.length}`);
console.log(`- plot chain steps: ${plotChainEntries.length}`);
console.log(`- side quest steps: ${sideQuestEntries.filter(v => v.id).length}`);
console.log(`- contracts: ${contractEntries.length}`);
console.log(`- item ids: ${itemEntries.length}`);
console.log(`- monster kinds: ${monsterKindEntries.length}`);
console.log(`- monster registry entries: ${monsterRegistryEntries.length}`);
console.log(`- rumors: ${rumorEntries.length}`);
console.log(`- slime defs: ${slimeEntries.length}`);
console.log(`- zhelemish defs: ${zhelemishEntries.length}`);
console.log(`- procedural geometries: ${floorGeometryEntries.length}`);
console.log(`- procedural majority factions: ${floorMajorityEntries.length}`);
console.log(`- procedural anomalies: ${floorAnomalyEntries.length}`);
console.log(`- procedural geometry docs: ${floorGeometryDocEntries.length}`);
console.log(`- procedural anomaly docs: ${floorAnomalyDocEntries.length}`);
console.log(`- design floor routes: ${designFloorRouteEntries.length}`);
console.log(`- design floor generators: ${designFloorGeneratorEntries.length}`);
console.log(`- manifest imports checked: ${manifestImportRefs.length}`);
console.log(`- direct item call refs checked: ${directItemCallRefs.length}`);
for (const [floor, entries] of [...manifestEntries.entries()].sort()) {
  console.log(`- ${floor} manifest entries: ${entries.length}`);
}

console.log('');
console.log('LIVING zone content');
for (const z of zoneEntries.filter(v => v.file.includes('/living/')).sort((a, b) => Number(a.id) - Number(b.id))) {
  console.log(`- zone ${z.id ?? '?'}: ${z.label ?? '<unresolved title>'} (${z.file}:${z.line})`);
}

console.log('');
if (unimportedContent.length) {
  console.log('Unimported content modules');
  for (const rel of unimportedContent) console.log(`- ${rel}`);
} else {
  console.log('Unimported content modules: none detected');
}

console.log('');
if (errors.length) {
  console.log('Errors');
  for (const err of errors) console.log(`- ${err}`);
  process.exitCode = 1;
} else {
  console.log('Errors: none');
}
