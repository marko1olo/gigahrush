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
  const init = varInitializer(relPath, name);
  if (!init || !ts.isArrayLiteralExpression(init)) return [];
  const sf = sourceFile(relPath);
  return init.elements
    .filter(ts.isObjectLiteralExpression)
    .map(node => ({ node, line: lineOf(sf, node), file: relPath }));
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
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p) || propName(p.name) !== key) continue;
    if (!ts.isArrayLiteralExpression(p.initializer)) return [];
    const sf = p.getSourceFile();
    return p.initializer.elements
      .map(element => ({ id: stringValue(element, constants), line: lineOf(sf, element) }))
      .filter(v => v.id);
  }
  return [];
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

function objectStringArrayRefs(relPath, name) {
  const init = varInitializer(relPath, name);
  if (!init || !ts.isObjectLiteralExpression(init)) return [];
  const constants = stringConstants(relPath);
  const sf = sourceFile(relPath);
  const out = [];
  for (const p of init.properties) {
    if (!ts.isPropertyAssignment(p) || !ts.isArrayLiteralExpression(p.initializer)) continue;
    const key = propName(p.name) ?? '<computed>';
    for (const element of p.initializer.elements) {
      const id = stringValue(element, constants);
      if (id) out.push({ id, key, file: relPath, line: lineOf(sf, element) });
    }
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

function resolveImport(fromAbs, spec) {
  if (!spec.startsWith('.')) return undefined;
  const base = path.resolve(path.dirname(fromAbs), spec);
  for (const candidate of [`${base}.ts`, path.join(base, 'index.ts')]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

const importIncoming = new Map();
const manifestEntries = new Map();
const manifestImportRefs = [];
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
const variantEntries = arrayIds('src/data/monster_variants.ts', 'MONSTER_VARIANTS');
const slimeEntries = arrayIds('src/data/slime_defs.ts', 'SLIME_DEFS');
const slimeSampleEntries = arrayPropIds('src/data/slime_defs.ts', 'SLIME_DEFS', 'sampleId');
const slimeTextHandleRefs = arrayPropStringRefs('src/data/slime_defs.ts', 'SLIME_DEFS', 'textHandles');
const zhelemishEntries = arrayPropIds('src/data/zhelemish_defs.ts', 'ZHELEMISH_DEFS', 'itemId');
const floorGeometryEntries = arrayIds('src/data/procedural_floors.ts', 'FLOOR_GEOMETRIES');
const floorMajorityEntries = arrayIds('src/data/procedural_floors.ts', 'FLOOR_MAJORITY_FACTIONS');
const floorAnomalyEntries = arrayIds('src/data/procedural_floors.ts', 'FLOOR_ANOMALIES');
const proceduralLootRefs = objectStringArrayRefs('src/data/procedural_floors.ts', 'LOOT_BY_TAG');
const monsterKindEntries = enumMembers('src/core/types.ts', 'MonsterKind');
const monsterRegistryEntries = objectKeys('src/entities/monster.ts', 'MONSTERS');
const plotChainEntries = arrayObjects('src/data/plot.ts', 'PLOT_CHAIN');
const designFloorRouteEntries = arrayIds('src/data/design_floors.ts', 'DESIGN_FLOOR_ROUTES');
const designFloorGeneratorEntries = objectKeys('src/gen/design_floors/manifest.ts', 'DESIGN_FLOOR_GENERATORS');

const itemIds = new Set(itemEntries.map(v => v.id));
const questTargetItemIds = new Set([...itemIds, 'money']);
const itemOrMoneyIds = new Set([...itemIds, 'money']);
const plotNpcIds = new Set([...plotNpcEntries, ...localNpcDefEntries].map(v => v.id));
const rumorIds = new Set(rumorEntries.map(v => v.id));

const errors = [];
function addDuplicateErrors(label, entries) {
  for (const d of duplicateIds(entries)) {
    errors.push(`${label} duplicate "${d.id}" at ${d.second.file ?? ''}:${d.second.line}; first at ${d.first.file ?? ''}:${d.first.line}`);
  }
}

addDuplicateErrors('ITEMS', itemEntries);
addDuplicateErrors('PLOT_NPCS/registerSideQuest', plotNpcEntries);
addDuplicateErrors('SIDE_QUESTS', sideQuestEntries);
addDuplicateErrors('CONTRACTS', contractEntries);
addDuplicateErrors('RUMORS', rumorEntries);
addDuplicateErrors('MONSTER_VARIANTS', variantEntries);
addDuplicateErrors('SLIME_DEFS', slimeEntries);
addDuplicateErrors('SLIME sample ids', slimeSampleEntries);
addDuplicateErrors('ZHELEMISH_DEFS', zhelemishEntries);
addDuplicateErrors('FLOOR_GEOMETRIES', floorGeometryEntries);
addDuplicateErrors('FLOOR_MAJORITY_FACTIONS', floorMajorityEntries);
addDuplicateErrors('FLOOR_ANOMALIES', floorAnomalyEntries);
addDuplicateErrors('DESIGN_FLOOR_ROUTES', designFloorRouteEntries);
addDuplicateErrors('DESIGN_FLOOR_GENERATORS', designFloorGeneratorEntries);
addDuplicateErrors('LIVING zone content', zoneEntries.filter(v => v.file.includes('/living/')));

const designFloorGeneratorIds = new Set(designFloorGeneratorEntries.map(v => v.id));
for (const route of designFloorRouteEntries) {
  if (!designFloorGeneratorIds.has(route.id)) errors.push(`${route.file}:${route.line} design floor route "${route.id}" has no generator`);
}
const designFloorRouteIds = new Set(designFloorRouteEntries.map(v => v.id));
for (const generator of designFloorGeneratorEntries) {
  if (!designFloorRouteIds.has(generator.id)) errors.push(`${generator.file}:${generator.line} design floor generator "${generator.id}" has no route`);
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
console.log(`- monster variants: ${variantEntries.length}`);
console.log(`- rumors: ${rumorEntries.length}`);
console.log(`- slime defs: ${slimeEntries.length}`);
console.log(`- zhelemish defs: ${zhelemishEntries.length}`);
console.log(`- procedural geometries: ${floorGeometryEntries.length}`);
console.log(`- procedural majority factions: ${floorMajorityEntries.length}`);
console.log(`- procedural anomalies: ${floorAnomalyEntries.length}`);
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
