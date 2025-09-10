#!/usr/bin/env node
'use strict';

// Verify and optionally align service endpoints with the integration guide.
// Usage (report only):
//   node scripts/verify-api-integration.js --guide docs/frontend-api-guide-full.md --services src/lib/services --src src --report
// Optional write mode (requires mapping file):
//   node scripts/verify-api-integration.js --write --mapping scripts/api-endpoint-mapping.json
// Optional index check/update:
//   node scripts/verify-api-integration.js --update-index

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
  const args = { ...DEFAULTS, report: true, write: false, updateIndex: false };
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
        // ignore unknown
        break;
    }
  }
  // Normalize to absolute paths
  args.guidePath = path.resolve(args.guidePath);
  args.srcRoot = path.resolve(args.srcRoot);
  args.servicesDir = path.resolve(args.servicesDir);
  args.mappingFile = path.resolve(args.mappingFile);
  args.outDir = path.resolve(args.outDir);
  return args;
}

function printHelp() {
  console.log(`API Integration Verifier

Options:
  --guide <path>         Path to the API guide markdown (default: ${DEFAULTS.guidePath})
  --src <dir>            Source root to scan (default: ${DEFAULTS.srcRoot})
  --services <dir>       Services directory to scan (default: ${DEFAULTS.servicesDir})
  --mapping <path>       Mapping json for replacements (default: ${DEFAULTS.mappingFile})
  --outDir <dir>         Output directory for reports (default: ${DEFAULTS.outDir})
  --report               Generate JSON/MD reports (default)
  --no-report            Do not write reports
  --write                Apply replacements using mapping file (restricted to services dir)
  --update-index         Check and optionally update services index barrel (index.ts)
  --help                 Show help
`);
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

function listFilesRecursively(root, exts = new Set(['.ts', '.tsx', '.js', '.jsx'])) {
  const results = [];
  const skipDirs = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'out']);
  function walk(dir) {
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const d of entries) {
      const full = path.join(dir, d.name);
      if (d.isDirectory()) {
        if (!skipDirs.has(d.name)) walk(full);
      } else {
        const ext = path.extname(d.name);
        if (exts.has(ext)) results.push(full);
      }
    }
  }
  walk(root);
  return results;
}

function parseDocEndpoints(guideContent) {
  // Match lines like: "### GET /path" (method + absolute path)
  const re = /^###\s+(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)\s*$/gmi;
  const endpoints = new Set();
  const byMethod = { GET: 0, POST: 0, PUT: 0, PATCH: 0, DELETE: 0 };
  const lines = guideContent.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = /^###\s+(GET|POST|PUT|PATCH|DELETE)\s+([^\s]+)\s*$/.exec(line);
    if (m) {
      const method = m[1].toUpperCase();
      const p = m[2];
      const key = `${method} ${p}`;
      if (!endpoints.has(key)) {
        endpoints.add(key);
        if (byMethod[method] != null) byMethod[method]++;
      }
    }
  }
  return { endpoints, byMethod };
}

function extractRelativePathFromStringLiteral(litContent) {
  // Find the first occurrence that looks like a relative API path beginning with '/'
  // and not part of 'http(s)://'
  // Handles template literals with ${...} embedded.
  // Returns a normalized string e.g. '/wizard/orders/${order_id}'
  const idx = litContent.search(/\/(?:[a-zA-Z0-9_-]|\$\{)/);
  if (idx === -1) return null;
  // slice from idx until we hit a quote-like boundary; but we only have literal content
  // Stop at a whitespace or end; keep braces.
  let out = '';
  for (let i = idx; i < litContent.length; i++) {
    const ch = litContent[i];
    if (ch === '\n' || ch === '\r') break;
    out += ch;
  }
  // Trim trailing spaces/commas/parens just in case
  out = out.replace(/[\s\)]*$/, '');
  return out;
}

function getLineNumber(text, index0Based) {
  // Count newlines up to index
  const pre = text.slice(0, index0Based);
  const lines = pre.split(/\r?\n/);
  return lines.length; // 1-based
}

function scanServiceEndpoints(servicesDir) {
  const files = listFilesRecursively(servicesDir);
  const resultsByFile = new Map();
  const endpointSet = new Set();
  const methodCallRe = /\.\s*(get|post|put|patch|delete)\s*\(\s*([`'\"])\s*([\s\S]*?)\2/gmi;
  // fetch(url, { method: 'POST' })
  const fetchCallRe = /\bfetch\s*\(\s*([`'\"])\s*([\s\S]*?)\1\s*(?:,\s*\{([\s\S]*?)\})?\s*\)/gmi;
  // request('GET', '/path', ...)
  const requestCallRe = /\.\s*request(?:Json)?\s*\(\s*([`'\"])\s*(GET|POST|PUT|PATCH|DELETE)\1\s*,\s*([`'\"])\s*([\s\S]*?)\3/gmi;

  for (const file of files) {
    const content = readFileUtf8(file);
    const found = [];

    // 1) .get/.post/.put/.patch/.delete("/path")
    for (const m of content.matchAll(methodCallRe)) {
      const method = m[1].toUpperCase();
      const lit = m[3];
      const pathStr = extractRelativePathFromStringLiteral(lit);
      if (pathStr) {
        const key = `${method} ${pathStr}`;
        endpointSet.add(key);
        found.push({ method, path: pathStr, origin: 'method-call', line: getLineNumber(content, m.index || 0) });
      }
    }

    // 2) fetch("${API_BASE_URL}/path", { method: 'POST' })
    for (const m of content.matchAll(fetchCallRe)) {
      const urlLit = m[2] || '';
      const opts = m[3] || '';
      const methodM = /\bmethod\s*:\s*([`'\"])\s*(GET|POST|PUT|PATCH|DELETE)\1/i.exec(opts);
      const method = methodM ? methodM[2].toUpperCase() : 'GET';
      const pathStr = extractRelativePathFromStringLiteral(urlLit);
      if (pathStr) {
        const key = `${method} ${pathStr}`;
        endpointSet.add(key);
        found.push({ method, path: pathStr, origin: 'fetch', line: getLineNumber(content, m.index || 0) });
      }
    }

    // 3) .request('GET', '/path', ...)
    for (const m of content.matchAll(requestCallRe)) {
      const method = m[2].toUpperCase();
      const lit = m[4];
      const pathStr = extractRelativePathFromStringLiteral(lit);
      if (pathStr) {
        const key = `${method} ${pathStr}`;
        endpointSet.add(key);
        found.push({ method, path: pathStr, origin: 'request', line: getLineNumber(content, m.index || 0) });
      }
    }

    if (found.length) resultsByFile.set(file, found);
  }

  return { filesScanned: files.length, resultsByFile, endpointSet };
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
  return { inBoth, docOnly, codeOnly };
}

function nowIso() {
  return new Date().toISOString();
}

function timeTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function writeReports(outDir, guidePath, docInfo, scanInfo, diffInfo) {
  ensureDir(outDir);
  const tag = timeTag();
  const jsonPath = path.join(outDir, `api-integration-report-${tag}.json`);
  const mdPath = path.join(outDir, `api-integration-report-${tag}.md`);

  const json = {
    generatedAt: nowIso(),
    guidePath,
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
    byFile: Array.from(scanInfo.resultsByFile.entries()).map(([file, items]) => ({ file, items })),
  };
  writeFileUtf8(jsonPath, JSON.stringify(json, null, 2));

  const md = [];
  md.push(`# API Integration Report`);
  md.push(`Generated: ${json.generatedAt}`);
  md.push('');
  md.push(`- Guide: ${guidePath}`);
  md.push(`- Files scanned: ${scanInfo.filesScanned}`);
  md.push(`- Doc endpoints: ${docInfo.endpoints.size}`);
  md.push(`- Code endpoints: ${scanInfo.endpointSet.size}`);
  md.push('');
  md.push('## Summary');
  md.push(`- In both: ${diffInfo.inBoth.length}`);
  md.push(`- Doc only (not found in code): ${diffInfo.docOnly.length}`);
  md.push(`- Code only (not listed in guide, likely legacy/fallback): ${diffInfo.codeOnly.length}`);
  md.push('');
  if (diffInfo.docOnly.length) {
    md.push('## Doc-only endpoints');
    md.push('');
    for (const e of diffInfo.docOnly) md.push(`- ${e}`);
    md.push('');
  }
  if (diffInfo.codeOnly.length) {
    md.push('## Code-only endpoints');
    md.push('');
    for (const e of diffInfo.codeOnly) md.push(`- ${e}`);
    md.push('');
  }
  md.push('## Per-file findings');
  md.push('');
  for (const [file, items] of scanInfo.resultsByFile.entries()) {
    md.push(`### ${path.relative(process.cwd(), file)}`);
    for (const it of items) {
      md.push(`- ${it.method} ${it.path} (via ${it.origin}, line ${it.line})`);
    }
    md.push('');
  }
  writeFileUtf8(mdPath, md.join('\n'));

  return { jsonPath, mdPath };
}

function loadMapping(mappingPath) {
  try {
    const raw = readFileUtf8(mappingPath);
    const data = JSON.parse(raw);
    const list = Array.isArray(data.replacements) ? data.replacements : [];
    // Normalize into a map keyed by optional method + path; path-only also supported
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
      // Replace in string literals only by simple textual replacement; keep method info for reporting only.
      // We try to avoid replacing substrings by requiring quotes/backticks around or common delimiters.
      const patterns = [
        new RegExp(`(["'` + '`' + `])${escapeRegExp(fromPath)}(["'` + '`' + `])`, 'g'),
        new RegExp(`${escapeRegExp(fromPath)}`, 'g'),
      ];
      for (const pat of patterns) {
        const before = content;
        content = content.replace(pat, (m, g1, g2) => {
          // If matched with quotes, keep them
          if (g1 && g2) return `${g1}${toPath}${g2}`;
          return toPath;
        });
        if (content !== before) {
          const diffCount = countOccurrences(before, fromPath) - countOccurrences(content, fromPath);
          totalReplacements += Math.max(diffCount, 1);
          changed = true;
        }
      }
    }

    if (changed) {
      writeFileUtf8(file, content);
      changedFiles.push(file);
    }
  }
  return { changedFiles, totalReplacements };
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

function checkOrUpdateServicesIndex(servicesDir, write = false) {
  const indexPath = path.join(servicesDir, 'index.ts');
  if (!fs.existsSync(indexPath)) return { indexPath, action: 'missing', missing: [] };
  const content = readFileUtf8(indexPath);
  const files = listFilesRecursively(servicesDir, new Set(['.ts']));
  const serviceFiles = files.filter(f => f !== indexPath && /Service\.ts$/i.test(path.basename(f)));
  const missing = [];
  for (const f of serviceFiles) {
    const rel = './' + path.relative(servicesDir, f).replace(/\\/g, '/').replace(/\.ts$/, '');
    if (!content.includes(rel)) missing.push(rel);
  }
  if (write && missing.length) {
    const extra = missing.map(m => `export * from '${m}';`).join('\n') + '\n';
    writeFileUtf8(indexPath, content + '\n' + extra);
    return { indexPath, action: 'appended', missing };
  }
  return { indexPath, action: missing.length ? 'has-missing' : 'ok', missing };
}

async function main() {
  const args = parseArgs(process.argv);

  if (!fs.existsSync(args.guidePath)) {
    console.error(`Guide not found: ${args.guidePath}`);
    process.exit(1);
  }
  if (!fs.existsSync(args.servicesDir)) {
    console.error(`Services dir not found: ${args.servicesDir}`);
    process.exit(1);
  }

  console.log(`[verify-api] Reading guide: ${args.guidePath}`);
  const guideContent = readFileUtf8(args.guidePath);
  const docInfo = parseDocEndpoints(guideContent);
  console.log(`[verify-api] Guide endpoints: ${docInfo.endpoints.size} (GET:${docInfo.byMethod.GET} POST:${docInfo.byMethod.POST} PUT:${docInfo.byMethod.PUT} PATCH:${docInfo.byMethod.PATCH} DELETE:${docInfo.byMethod.DELETE})`);

  console.log(`[verify-api] Scanning services: ${args.servicesDir}`);
  const scanInfo = scanServiceEndpoints(args.servicesDir);
  console.log(`[verify-api] Files scanned: ${scanInfo.filesScanned}, Endpoints found in code: ${scanInfo.endpointSet.size}`);

  const diffInfo = compareEndpointSets(docInfo.endpoints, scanInfo.endpointSet);
  console.log(`[verify-api] Comparison -> InBoth: ${diffInfo.inBoth.length}, DocOnly: ${diffInfo.docOnly.length}, CodeOnly: ${diffInfo.codeOnly.length}`);

  if (args.report) {
    const { jsonPath, mdPath } = writeReports(args.outDir, args.guidePath, docInfo, scanInfo, diffInfo);
    console.log(`[verify-api] Reports written:\n  - ${jsonPath}\n  - ${mdPath}`);
  }

  if (args.updateIndex) {
    const res = checkOrUpdateServicesIndex(args.servicesDir, args.write);
    if (res.action === 'missing') {
      console.log(`[verify-api] No index.ts found at ${res.indexPath}`);
    } else if (res.action === 'ok') {
      console.log(`[verify-api] services/index.ts OK (no missing exports detected)`);
    } else if (res.action === 'has-missing') {
      console.log(`[verify-api] services/index.ts is missing exports for:`);
      for (const m of res.missing) console.log(`  - ${m}`);
      console.log(`[verify-api] Re-run with --write --update-index to append export stubs.`);
    } else if (res.action === 'appended') {
      console.log(`[verify-api] Appended export stubs in services/index.ts for:`);
      for (const m of res.missing) console.log(`  - ${m}`);
    }
  }

  if (args.write) {
    const mapping = loadMapping(args.mappingFile);
    if (!mapping.length) {
      console.log(`[verify-api] Write mode requested, but no replacements found in mapping file: ${args.mappingFile}`);
      console.log(`[verify-api] Aborting write phase. Edit the mapping file and re-run.`);
    } else {
      console.log(`[verify-api] Applying replacements from mapping: ${args.mappingFile}`);
      const { changedFiles, totalReplacements } = applyReplacementsToServices(args.servicesDir, mapping);
      console.log(`[verify-api] Replacements applied: ${totalReplacements} changes across ${changedFiles.length} files.`);
      if (changedFiles.length) {
        console.log(`[verify-api] Changed files:`);
        for (const f of changedFiles) console.log(`  - ${path.relative(process.cwd(), f)}`);
      }
    }
  }

  console.log('[verify-api] Done.');
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

