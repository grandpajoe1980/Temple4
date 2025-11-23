const fs = require('fs');
const path = require('path');

const tenantBlueprintPath = path.join(__dirname, '..', 'prisma', 'tenantBlueprint.ts');
const outBase = path.join(process.cwd(), 'public', 'seed', 'photos');

const samplePngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAABH1JREFUeNrs3c1y2kAQB/Dv//1xk0QkRZgkq2bK6cF7iQ0nYp9sI2wEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACwG7K5A6wA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAB8Gf8AANgnf2cAANgk8x0AAACAdwYAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAA+AdHAAAAeBoAAAAAAAAAAAAAAAAAAAAAA+AdHAAAAeBoAAAAAAAAAAAAAAAAAAAAAA+AdH' +
  'AAAAeBoAAAAAAAAAAAAAAAAAAAAAA+AdHAAAAeBoAAAAAAAAAAAAAAAAAAAAAA+AdHAAAAeBoA' +
  'AAAAAAAAAAAAAAAAAAAP4B6wABAP//AwD//wMA////AO8Gf1cAAAB4GgAAAAAAAAAAAAAAAAAAA' +
  'AAAA+AdHAAAAeBoAAAAAAAAAAAAAAAAAAAAAAAD+Af8AAAD//wMA//8DAAD//wMAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAfwZ/QAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgD8Gf0AAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfwZ/QAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AODnAAYAAQDk8Z8AAAAASUVORK5CYII=';

function extractSlugs(content) {
  const re = /slug:\s*'([^']+)'/g;
  const slugs = [];
  let m;
  while ((m = re.exec(content))) {
    slugs.push(m[1]);
  }
  return Array.from(new Set(slugs));
}

function main() {
  if (!fs.existsSync(tenantBlueprintPath)) {
    console.error('tenantBlueprint.ts not found at', tenantBlueprintPath);
    process.exit(1);
  }
  const tb = fs.readFileSync(tenantBlueprintPath, 'utf8');
  const slugs = extractSlugs(tb);
  if (!fs.existsSync(outBase)) fs.mkdirSync(outBase, { recursive: true });
  for (const slug of slugs) {
    const dir = path.join(outBase, slug);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < 5; i++) {
      const filePath = path.join(dir, `photo-${i + 1}.png`);
      fs.writeFileSync(filePath, samplePngBase64, { encoding: 'base64' });
    }
  }
  console.log('Wrote local seed photos to public/seed/photos/<tenantSlug>/photo-#.png');
}

try {
  main();
} catch (err) {
  console.error(err);
  process.exit(1);
}
