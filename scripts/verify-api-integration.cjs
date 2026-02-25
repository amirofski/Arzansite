#!/usr/bin/env node
'use strict';

// Verify and optionally align service endpoints with the integration guide.
// Usage (report only):
//   node scripts/verify-api-integration.cjs --guide docs/frontend-api-guide-full.md --services src/lib/services --src src --report
// Optional write mode (requires mapping file):
//   node scripts/verify-api-integration.cjs --write --mapping scripts/api-endpoint-mapping.json
// Optional index check/update:
//   node scripts/verify-api-integration.cjs --update-index

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  guidePath: path.join('docs', 'frontend-api-guide-full.md'),
  srcRoot: 'src',
  servicesDir: path.join('src', 'lib', 'services'),
  mappingFile: path.join('scripts', 'api-endpoint-mapping.json'),
  outDir: path.join('reports'),
};

function parseArgs(argv) {
  const args = { guidePath: DEFAULTS.guidePath, srcRoot: DEFAULTS.srcRoot, servicesDir: DEFAULTS.servicesDir, mappingFile: DEFAULTS.mappingFile, outDir: DEFAULTS.outDir, report: true, write: false, updateIndex: false };
  const raw = argv.slice(2);
  for (let i = 0; i < raw.length; i++) {
    const k = raw[i];
    const v = raw[i + 1];
    switch (k) {
      case '--guide': args.guidePath = v; i++; break;
      case '--src': args.srcRoot = v; i++; break;
      case '--services': args.servicesDir = v; i++; break;
      case '--mapping': args.mappingFile = v; i++; break;
      case '--outDir': args.outDir = v; i++; break;
      case '--report': args.report = true; break;
      case '--no-report': args.report = false; break;
      case '--write': args.write = true; break;
      case '--update-index': args.updateIndex = true; break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        break;
    }
  }
  args.guidePath = path.resolve(args.guidePath);
  args.srcRoot = path.resolve(args.srcRoot);
  args.servicesDir = path.resolve(args.servicesDir);
  args.mappingFile = path.resolve(args.mappingFile);
  args.outDir = path.resolve(args.outDir);
  return args;
}

function printHelp() {
  console.log('API Integration Verifier');
  console.log('');
  console.log('Options:');
  console.log('  --guide <path>         Path to the API guide markdown (default: ' + DEFAULTS.guidePath + ')');
  console.log('  --src <dir>            Source root to scan (default: ' + DEFAULTS.srcRoot + ')');
  console.log('  --services <dir>       Services directory to scan (default: ' + DEFAULTS.servicesDir + ')');
  console.log('  --mapping <path>       Mapping json for replacements (default: ' + DEFAULTS.mappingFile + ')');
  console.log('  --outDir <dir>         Output directory for reports (default: ' + DEFAULTS.outDir + ')');
  console.log('  --report               Generate JSON/MD reports (default)');
  console.log('  --no-report            Do not write reports');
  console.log('  --write                Apply replacements using mapping file (restricted to services dir)');
  console.log('  --update-index         Check and optionally update services index barrel (index.ts)');
  console.log('  --help                 Show help');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readFileUtf8(p) {
  return fs.readFileSync(p, 'utf8');
}

function writeFileUtf8(p, content) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

function listFilesRecursively(root, exts) {
  const results = [];
  const extsSet = exts || new Set(['.ts', '.tsx', '.js', '.jsx']);
  const skipDirs = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out']);
  function walk(dir) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const d of entries) {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) {
        if (!skipDirs.has(d.name)) walk(full);
      } else {
        const ext = path.extname(d.name);
        if (extsSet.has(ext)) results.push(full);
      }
    }
  }
  walk(root);
  return results;
}

function parseDocEndpoints(guideContent) {
  const endpoints = new Set();
  const byMethod = { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 };
  const lines = guideContent.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^###\s+(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)\s*$/.exec(line);
    if (m) {
      const method = m[1].toUpperCase();
      const p = m[2];
      const key = method + ' ' + p;
      if (!endpoints.has(key)) {
        endpoints.add(key);
        if (byMethod[method] != null) byMethod[method]++;
      }
    }
  }
  return { endpoints: endpoints, byMethod: byMethod };
}

function extractRelativePathFromStringLiteral(litContent) {
  const idx = litContent.search(/\/(?:[a-zA-Z0-9_-]|\$\{)/);
  if (idx === -1) return null;
  let out = '';
  for (let i = idx; i < litContent.length; i++) {
    const ch = litContent[i];
    if (ch === '\n' || ch === '\r') break;
    out += ch;
  }
  out = out.replace(/[\s\)]*$/, '');
  return out;
}

function getLineNumber(text, index0Based) {
  const pre = text.slice(0, index0Based);
  const lines = pre.split(/\r?\n/);
  return lines.length;
}

function scanServiceEndpoints(servicesDir) {
  const files = listFilesRecursively(servicesDir);
  const resultsByFile = new Map();
  const endpointSet = new Set();
  const methodCallRe = /\.\s*(get|post|put|patch|delete)\s*\(\s*([`'\"])\s*([\s\S]*?)\2/gmi;
  const fetchCallRe = /\bfetch\s*\(\s*([`'\"])\s*([\s\S]*?)\1\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/gmi;
  const requestCallRe = /\.\s*request(?:Json)?\s*\(\s*([`'\"])\s*(GET|POST|PUT|PATCH|DELETE)\1\s*,\s*([`'\"])\s*([\s\S]*?)\3/gmi;

  for (const file of files) {
    const content = readFileUtf8(file);
    const found = [];

    for (const m of content.matchAll(methodCallRe)) {
      const method = String(m[1] || '').toUpperCase();
      const lit = String(m[3] || '');
      const pathStr = extractRelativePathFromStringLiteral(lit);
      if (pathStr) {
        const key = method + ' ' + pathStr;
        endpointSet.add(key);
        found.push({ method: method, path: pathStr, origin: 'method-call', line: getLineNumber(content, m.index || 0) });
      }
    }

    for (const m of content.matchAll(fetchCallRe)) {
      const urlLit = String(m[2] || '');
      const opts = String(m[3] || '');
      const methodM = /\bmethod\s*:\s*([`'\"])\s*(GET|POST|PUT|PATCH|DELETE)\1/i.exec(opts);
      const method = methodM ? String(methodM[2]).toUpperCase() : 'GET';
      const pathStr = extractRelativePathFromStringLiteral(urlLit);
      if (pathStr) {
        const key = method + ' ' + pathStr;
        endpointSet.add(key);
        found.push({ method: method, path: pathStr, origin: 'fetch', line: getLineNumber(content, m.index || 0) });
      }
    }

    for (const m of content.matchAll(requestCallRe)) {
      const method = String(m[2] || '').toUpperCase();
      const lit = String(m[4] || '');
      const pathStr = extractRelativePathFromStringLiteral(lit);
      if (pathStr) {
        const key = method + ' ' + pathStr;
        endpointSet.add(key);
        found.push({ method: method, path: pathStr, origin: 'request', line: getLineNumber(content, m.index || 0) });
      }
    }

    if (found.length) resultsByFile.set(file, found);
  }

  return { filesScanned: files.length, resultsByFile: resultsByFile, endpointSet: endpointSet };
}

function compareEndpointSets(docSet, codeSet) {
  const inBoth = [];
  const docOnly = [];
  const codeOnly = [];

  for (const e of codeSet) {
    if (docSet.has(e)) inBoth.push(e); else codeOnly.push(e);
  }
  for (const e of docSet) {
    if (!codeSet.has(e)) docOnly.push(e);
  }
  inBoth.sort(); docOnly.sort(); codeOnly.sort();
  return { inBoth: inBoth, docOnly: docOnly, codeOnly: codeOnly };
}

function nowIso() { return new Date().toISOString(); }
function timeTag() {
  const d = new Date();
  function pad(n) { return String(n).padStart(2, '0'); }
  return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

function writeReports(outDir, guidePath, docInfo, scanInfo, diffInfo) {
  ensureDir(outDir);
  const tag = timeTag();
  const jsonPath = path.join(outDir, 'api-integration-report-' + tag + '.json');
  const mdPath = path.join(outDir, 'api-integration-report-' + tag + '.md');

  const json = {
    generatedAt: nowIso(),
    guidePath: guidePath,
    totals: {
      docEndpoints: docInfo.endpoints.size,
      codeEndpoints: scanInfo.endpointSet.size,
      filesScanned: scanInfo.filesScanned,
    },
    docByMethod: docInfo.byMethod,
    comparison: {
      intersectionCount: diffInfo.inBoth.length,
      docOnlyCount: diffInfo.docOnly.length,
      codeOnlyCount: diffInfo.codeOnly.length,
      docOnly: diffInfo.docOnly,
      codeOnly: diffInfo.codeOnly,
    },
    byFile: Array.from(scanInfo.resultsByFile.entries()).map(function(pair){ return { file: pair[0], items: pair[1] }; }),
  };
  writeFileUtf8(jsonPath, JSON.stringify(json, null, 2));

  const md = [];
  md.push('# API Integration Report');
  md.push('Generated: ' + json.generatedAt);
  md.push('');
  md.push('- Guide: ' + guidePath);
  md.push('- Files scanned: ' + scanInfo.filesScanned);
  md.push('- Doc endpoints: ' + docInfo.endpoints.size);
  md.push('- Code endpoints: ' + scanInfo.endpointSet.size);
  md.push('');
  md.push('## Summary');
  md.push('- In both: ' + diffInfo.inBoth.length);
  md.push('- Doc only (not found in code): ' + diffInfo.docOnly.length);
  md.push('- Code only (not listed in guide, likely legacy/fallback): ' + diffInfo.codeOnly.length);
  md.push('');
  if (diffInfo.docOnly.length) {
    md.push('## Doc-only endpoints');
    md.push('');
    for (const e of diffInfo.docOnly) md.push('- ' + e);
    md.push('');
  }
  if (diffInfo.codeOnly.length) {
    md.push('## Code-only endpoints');
    md.push('');
    for (const e of diffInfo.codeOnly) md.push('- ' + e);
    md.push('');
  }
  md.push('## Per-file findings');
  md.push('');
  for (const pair of Array.from(scanInfo.resultsByFile.entries())) {
    const file = pair[0];
    const items = pair[1];
    md.push('### ' + path.relative(process.cwd(), file));
    for (const it of items) {
      md.push('- ' + it.method + ' ' + it.path + ' (via ' + it.origin + ', line ' + it.line + ')');
    }
    md.push('');
  }
  writeFileUtf8(mdPath, md.join('\n'));

  return { jsonPath: jsonPath, mdPath: mdPath };
}

function loadMapping(mappingPath) {
  try {
    const raw = readFileUtf8(mappingPath);
    const data = JSON.parse(raw);
    const list = Array.isArray(data.replacements) ? data.replacements : [];
    const entries = [];
    for (const r of list) {
      if (!r || !r.from || !r.to || !r.from.path || !r.to.path) continue;
      entries.push({
        from: { method: r.from.method ? String(r.from.method).toUpperCase() : null, path: String(r.from.path) },
        to: { method: r.to.method ? String(r.to.method).toUpperCase() : null, path: String(r.to.path) },
      });
    }
    return entries;
  } catch (e) {
    return [];
  }
}

function applyReplacementsToServices(servicesDir, mappingEntries) {
  if (!mappingEntries.length) return { changedFiles: [], totalReplacements: 0 };
  const files = listFilesRecursively(servicesDir);
  const changedFiles = [];
  let totalReplacements = 0;
  for (const file of files) {
    let content = readFileUtf8(file);
    let changed = false;

    for (const r of mappingEntries) {
      const fromPath = r.from.path;
      const toPath = r.to.path;
      const pat = new RegExp(escapeRegExp(fromPath), 'g');
      const before = content;
      content = content.replace(pat, toPath);
      if (content !== before) {
        const diffCount = countOccurrences(before, fromPath) - countOccurrences(content, fromPath);
        totalReplacements += Math.max(diffCount, 1);
        changed = true;
      }
    }

    if (changed) {
      writeFileUtf8(file, content);
      changedFiles.push(file);
    }
  }
  return { changedFiles: changedFiles, totalReplacements: totalReplacements };
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function countOccurrences(text, sub) {
  if (!sub) return 0;
  let count = 0, idx = 0;
  for (;;) {
    idx = text.indexOf(sub, idx);
    if (idx === -1) break;
    count++; idx += sub.length;
  }
  return count;
}

function checkOrUpdateServicesIndex(servicesDir, write) {
  const indexPath = path.join(servicesDir, 'index.ts');
  if (!fs.existsSync(indexPath)) return { indexPath: indexPath, action: 'missing', missing: [] };
  const content = readFileUtf8(indexPath);
  const files = listFilesRecursively(servicesDir, new Set(['.ts']));
  const serviceFiles = files.filter(function(f){ return f !== indexPath && /Service\.ts$/i.test(path.basename(f)); });
  const missing = [];
  for (const f of serviceFiles) {
    const rel = './' + path.relative(servicesDir, f).replace(/\\/g, '/').replace(/\.ts$/, '');
    if (content.indexOf(rel) === -1) missing.push(rel);
  }
  if (write && missing.length) {
    const extra = missing.map(function(m){ return "export * from '" + m + "';"; }).join('\n') + '\n';
    writeFileUtf8(indexPath, content + '\n' + extra);
    return { indexPath: indexPath, action: 'appended', missing: missing };
  }
  return { indexPath: indexPath, action: missing.length ? 'has-missing' : 'ok', missing: missing };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(args.guidePath)) {
    console.error('Guide not found: ' + args.guidePath);
    process.exit(1);
  }
  if (!fs.existsSync(args.servicesDir)) {
    console.error('Services dir not found: ' + args.servicesDir);
    process.exit(1);
  }

  console.log('[verify-api] Reading guide: ' + args.guidePath);
  const guideContent = readFileUtf8(args.guidePath);
  const docInfo = parseDocEndpoints(guideContent);
  console.log('[verify-api] Guide endpoints: ' + docInfo.endpoints.size + ' (GET:' + docInfo.byMethod.GET + ' POST:' + docInfo.byMethod.POST + ' PUT:' + docInfo.byMethod.PUT + ' PATCH:' + docInfo.byMethod.PATCH + ' DELETE:' + docInfo.byMethod.DELETE + ')');

  console.log('[verify-api] Scanning services: ' + args.servicesDir);
  const scanInfo = scanServiceEndpoints(args.servicesDir);
  console.log('[verify-api] Files scanned: ' + scanInfo.filesScanned + ', Endpoints found in code: ' + scanInfo.endpointSet.size);

  const diffInfo = compareEndpointSets(docInfo.endpoints, scanInfo.endpointSet);
  console.log('[verify-api] Comparison -> InBoth: ' + diffInfo.inBoth.length + ', DocOnly: ' + diffInfo.docOnly.length + ', CodeOnly: ' + diffInfo.codeOnly.length);

  if (args.report) {
    const reportPaths = writeReports(args.outDir, args.guidePath, docInfo, scanInfo, diffInfo);
    console.log('[verify-api] Reports written:\n  - ' + reportPaths.jsonPath + '\n  - ' + reportPaths.mdPath);
  }

  if (args.updateIndex) {
    const res = checkOrUpdateServicesIndex(args.servicesDir, args.write);
    if (res.action === 'missing') {
      console.log('[verify-api] No index.ts found at ' + res.indexPath);
    } else if (res.action === 'ok') {
      console.log('[verify-api] services/index.ts OK (no missing exports detected)');
    } else if (res.action === 'has-missing') {
      console.log('[verify-api] services/index.ts is missing exports for:');
      for (const m of res.missing) console.log('  - ' + m);
      console.log('[verify-api] Re-run with --write --update-index to append export stubs.');
    } else if (res.action === 'appended') {
      console.log('[verify-api] Appended export stubs in services/index.ts for:');
      for (const m of res.missing) console.log('  - ' + m);
    }
  }

  if (args.write) {
    const mapping = loadMapping(args.mappingFile);
    if (!mapping.length) {
      console.log('[verify-api] Write mode requested, but no replacements found in mapping file: ' + args.mappingFile);
      console.log('[verify-api] Aborting write phase. Edit the mapping file and re-run.');
    } else {
      console.log('[verify-api] Applying replacements from mapping: ' + args.mappingFile);
      const res = applyReplacementsToServices(args.servicesDir, mapping);
      console.log('[verify-api] Replacements applied: ' + res.totalReplacements + ' changes across ' + res.changedFiles.length + ' files.');
      if (res.changedFiles.length) {
        console.log('[verify-api] Changed files:');
        for (const f of res.changedFiles) console.log('  - ' + path.relative(process.cwd(), f));
      }
    }
  }

  console.log('[verify-api] Done.');
}

if (require.main === module) {
  main().catch(function(err) {
    console.error(err);
    process.exit(1);
  });
}

