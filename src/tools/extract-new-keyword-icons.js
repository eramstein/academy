/**
 * Extract keyword icons from the new-icons spritesheet (5x3 grid, last cell empty).
 *
 * Usage: node src/tools/extract-new-keyword-icons.js
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sheetPath = 'public/assets/images/ui/icons/spritesheets/new-icons.png';
const outDir = 'public/assets/images/keywords/material-icons';

/** Left-to-right, top-to-bottom — matches KEYWORD_KEYS, with resist before armor as drawn. */
const NAMES = [
  'ranged',
  'haste',
  'moveAndAttack',
  'resist',
  'armor',
  'poisonous',
  'regeneration',
  'trample',
  'zerk',
  'cleave',
  'lance',
  'flying',
  'immobile',
  'armorPiercing',
];

const COLS = 5;
const ROWS = 3;

const meta = await sharp(sheetPath).metadata();
console.log('spritesheet', meta.width, 'x', meta.height);

const { data, info } = await sharp(sheetPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

function isContent(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  return a > 10 && (r > 20 || g > 20 || b > 20);
}

/** Bounding box of non-black pixels inside a rectangle. */
function contentBounds(x0, y0, x1, y1) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * channels;
      if (isContent(i)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const cellW = Math.floor(width / COLS);
const cellH = Math.floor(height / ROWS);
const pad = 2; // keep a thin black margin around the stone tile

fs.mkdirSync(outDir, { recursive: true });

let nameIdx = 0;
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (r === ROWS - 1 && c === COLS - 1) continue; // empty slot

    const x0 = c * cellW;
    const y0 = r * cellH;
    const x1 = c === COLS - 1 ? width : (c + 1) * cellW;
    const y1 = r === ROWS - 1 ? height : (r + 1) * cellH;

    const bounds = contentBounds(x0, y0, x1, y1);
    if (!bounds) {
      console.warn(`skip empty cell r${r}c${c}`);
      continue;
    }

    const left = Math.max(0, bounds.left - pad);
    const top = Math.max(0, bounds.top - pad);
    const right = Math.min(width, bounds.left + bounds.width + pad);
    const bottom = Math.min(height, bounds.top + bounds.height + pad);
    const extract = {
      left,
      top,
      width: right - left,
      height: bottom - top,
    };

    const name = NAMES[nameIdx++];
    const outPath = path.join(outDir, `${name}.png`);
    await sharp(sheetPath).extract(extract).png().toFile(outPath);

    const outMeta = await sharp(outPath).metadata();
    const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
    console.log(
      `${name.padEnd(16)} ${extract.width}x${extract.height} @ (${extract.left},${extract.top})`.padEnd(42),
      `wrote ${outMeta.width}x${outMeta.height} ${sizeKb}KB`,
    );
  }
}

console.log(`done — ${nameIdx} icons → ${outDir}`);
