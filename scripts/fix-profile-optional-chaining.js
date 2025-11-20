const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const exts = ['.ts', '.tsx', '.js', '.jsx'];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  const skipDirs = new Set(['node_modules', '.git', 'migrations', 'prisma', '.next']);
  list.forEach(function(file) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (skipDirs.has(file)) return;
      results = results.concat(walk(filePath));
    } else {
      if (exts.includes(path.extname(file))) results.push(filePath);
    }
  });
  return results;
}

function previewFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const occurrences = [];
  const search = '.profile?.';
  let idx = src.indexOf(search);
  while (idx !== -1) {
    // check char before the dot to ensure not already optional chaining (e.g., '?.profile.')
    const charBefore = src[idx - 1];
    if (charBefore !== '?') {
      const start = Math.max(0, idx - 40);
      const end = Math.min(src.length, idx + 40);
      occurrences.push({ index: idx, context: src.slice(start, end).replace(/\n/g, '␤') });
    }
    idx = src.indexOf(search, idx + 1);
  }
  return occurrences;
}

function applyFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  const search = '.profile?.';
  let idx = src.indexOf(search);
  let changed = false;
  while (idx !== -1) {
    const charBefore = src[idx - 1];
    if (charBefore !== '?') {
      // replace at this index
      src = src.slice(0, idx) + '.profile?.' + src.slice(idx + search.length);
      changed = true;
      idx = src.indexOf(search, idx + '.profile?.'.length);
    } else {
      idx = src.indexOf(search, idx + search.length);
    }
  }
  if (changed) {
    fs.writeFileSync(filePath, src, 'utf8');
  }
  return changed;
}

function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const only = args.find(a => a.startsWith('--only='));
  const target = only ? path.resolve(root, only.split('=')[1]) : null;

  const files = walk(root).filter(f => !f.includes(path.join('node_modules', '')));
  const matches = [];
  files.forEach(f => {
    if (target && !f.startsWith(target)) return;
    const occ = previewFile(f);
    if (occ.length) matches.push({ file: f, occ });
  });

  if (!apply) {
    console.log(`Dry run: found ${matches.length} files with potential replacements.`);
    matches.forEach(m => {
      console.log(`\nFile: ${path.relative(root, m.file)} — ${m.occ.length} occurrence(s)`);
      m.occ.slice(0,5).forEach(o => console.log(`  ... ${o.context}`));
    });
    if (matches.length === 0) console.log('No changes suggested.');
    else console.log('\nTo apply changes, re-run with --apply (recommended: create a git branch first).');
    process.exit(matches.length === 0 ? 0 : 2);
  }

  // apply mode
  console.log(`Applying changes to ${matches.length} files...`);
  let changedCount = 0;
  matches.forEach(m => {
    const ok = applyFile(m.file);
    if (ok) changedCount++;
    console.log(`  ${path.relative(root, m.file)} -> ${ok ? 'updated' : 'skipped'}`);
  });
  console.log(`Done. ${changedCount} files updated.`);
}

if (require.main === module) main();
