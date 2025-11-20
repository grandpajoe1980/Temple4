const fs = require('fs');
const path = require('path');

function walk(dir) {
  const results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results.push(...walk(filePath));
    } else {
      if (/\.tsx?$/.test(filePath)) results.push(filePath);
    }
  });
  return results;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes("'use client'") && !content.includes('"use client"')) return null;

  const violations = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // skip type-only imports
    if (/^\s*import\s+type\s+/.test(line)) continue;

    const m = line.match(/from\s+['"]([^'"]+)['"]\s*;?$/);
    if (!m) continue;
    const source = m[1];

    // Flag imports from server-only modules:
    // - Prisma client
    // - any path under '@/lib' (data, permissions, services, etc.)
    if (source === '@prisma/client' || /^@\/lib(?:\/|$)/.test(source)) {
      violations.push({ line: i + 1, text: line.trim() });
      continue;
    }
    // Flag other server-only absolute aliases if added in future
    if (/^@\/(?:server|services|data|permissions)\b/.test(source)) {
      violations.push({ line: i + 1, text: line.trim() });
      continue;
    }
  }
  return violations.length ? violations : null;
}

function main() {
  const root = path.join(__dirname, '..');
  const appDir = path.join(root, 'app');
  if (!fs.existsSync(appDir)) {
    console.log('No app/ directory found — skipping client import checks.');
    process.exit(0);
  }
  const files = walk(appDir);
  const offenders = [];
  files.forEach((f) => {
    const v = checkFile(f);
    if (v) offenders.push({ file: path.relative(root, f), violations: v });
  });

  if (offenders.length) {
    console.error('Found client components importing server-only modules at runtime:');
    offenders.forEach((o) => {
      console.error(`\n - ${o.file}`);
      o.violations.forEach((vi) => {
        console.error(`    L${vi.line}: ${vi.text}`);
      });
    });
    process.exit(1);
  }
  console.log('No client import violations detected.');
}

main();
