/**
 * Remove AI-generated flavor templates (those with a real imagePrompt depiction)
 * and delete their card image files under public/assets/images/cards.
 *
 * Usage: npm run reset-images
 */
import fs from 'fs';
import path from 'path';

const TEMPLATES_PATH = path.resolve('src/data/sim/card_flavor_templates.json');
const CARDS_DIR = path.resolve('public/assets/images/cards');
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png'];

/** True when imagePrompt is a subject depiction, not a legacy name stub. */
function hasImagePrompt(entry) {
  const prompt = entry.imagePrompt?.trim();
  if (!prompt) return false;
  return prompt !== entry.name;
}

function deleteCardImages(imageName) {
  const deleted = [];
  for (const ext of IMAGE_EXTS) {
    const filePath = path.join(CARDS_DIR, `${imageName}${ext}`);
    if (!fs.existsSync(filePath)) continue;
    fs.unlinkSync(filePath);
    deleted.push(path.relative(process.cwd(), filePath));
  }
  return deleted;
}

const templates = JSON.parse(fs.readFileSync(TEMPLATES_PATH, 'utf8'));
if (!Array.isArray(templates)) {
  console.error('Expected card_flavor_templates.json to be an array');
  process.exit(1);
}

const toRemove = templates.filter(hasImagePrompt);
const kept = templates.filter((entry) => !hasImagePrompt(entry));

let deletedFiles = 0;
let missingImages = 0;

for (const entry of toRemove) {
  const deleted = deleteCardImages(entry.imageName);
  if (deleted.length) {
    deletedFiles += deleted.length;
    for (const file of deleted) {
      console.log(`Deleted ${file}`);
    }
  } else {
    missingImages++;
    console.log(`No image file for ${entry.imageName}`);
  }
}

fs.writeFileSync(TEMPLATES_PATH, `${JSON.stringify(kept, null, 2)}\n`);

console.log(
  `\nRemoved ${toRemove.length} template(s), kept ${kept.length}. ` +
    `Deleted ${deletedFiles} image file(s)` +
    (missingImages ? ` (${missingImages} missing)` : '') +
    '.'
);
