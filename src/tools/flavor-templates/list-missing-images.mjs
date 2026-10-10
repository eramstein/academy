/**
 * List flavor templates with no matching file under public/assets/images/cards.
 *
 * Usage: node src/tools/flavor-templates/list-missing-images.mjs
 *        node src/tools/flavor-templates/list-missing-images.mjs --json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const TEMPLATES_PATH = path.join(root, 'src/data/sim/card_flavor_templates.json');
const CARDS_DIR = path.join(root, 'public/assets/images/cards');
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const asJson = process.argv.includes('--json');

const templates = JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf8'));
if (!Array.isArray(templates)) {
  console.error('Expected card_flavor_templates.json to be an array');
  process.exit(1);
}

const existingBasenames = new Set();
if (fs.existsSync(CARDS_DIR)) {
  for (const entry of fs.readdirSync(CARDS_DIR, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    if (!IMAGE_EXTS.has(ext)) continue;
    existingBasenames.add(path.basename(entry.name, path.extname(entry.name)));
  }
}

const missing = templates
  .filter((row) => typeof row.imageName === 'string' && row.imageName && !existingBasenames.has(row.imageName))
  .map((row) => ({
    fileName: `${row.imageName}.jpg`,
    imageName: row.imageName,
    imagePrompt: typeof row.imagePrompt === 'string' ? row.imagePrompt : (row.name ?? ''),
    name: typeof row.name === 'string' ? row.name : row.imageName,
    colors: Array.isArray(row.colors) ? row.colors : [],
  }))
  .sort((a, b) => a.fileName.localeCompare(b.fileName) || a.name.localeCompare(b.name));

if (asJson) {
  console.log(JSON.stringify({ missing, count: missing.length }, null, 2));
  process.exit(0);
}

if (missing.length === 0) {
  console.log(`OK — all ${templates.length} templates have an image (${existingBasenames.size} files).`);
  process.exit(0);
}

console.log(
  `${missing.length} missing of ${templates.length} templates (${existingBasenames.size} image files on disk)\n`
);
for (const row of missing) {
  console.log(`${row.fileName}\t${row.imagePrompt}`);
}
