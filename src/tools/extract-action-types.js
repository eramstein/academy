/**
 * Split action-types.png into individual icon PNGs.
 * Sheet is 1082x1024 with layout 5+5+5+6 (not the 5x5 / 64px grid in the draft JSON).
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sheetPath = 'public/assets/images/ui/icons/action_types/action-types.png';
const outDir = 'public/assets/images/ui/icons/action_types';

/** Names in left-to-right, top-to-bottom order (addMana is last on row 4). */
const names = [
  'directDamage',
  'healUnit',
  'damageLand',
  'destroyUnit',
  'fortifyLand',
  'reanimate',
  'damageOpponent',
  'addGrowthCounters',
  'addDecayCounters',
  'drawCards',
  'mezz',
  'stun',
  'root',
  'daze',
  'bounceUnit',
  'forceMoveUnit',
  'fight',
  'cycleCards',
  'tutorCard',
  'regrowCard',
  'addMana',
];

const BLACK_THR = 6;
const PAD = 2;

const meta = await sharp(sheetPath).metadata();
console.log('spritesheet', meta.width, 'x', meta.height);

const { data, info } = await sharp(sheetPath)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const isContent = (i) => {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  if (a < 5) return false;
  return r > BLACK_THR || g > BLACK_THR || b > BLACK_THR;
};

function bands(counts, minCount) {
  const out = [];
  let start = null;
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] >= minCount) {
      if (start === null) start = i;
    } else if (start !== null) {
      out.push([start, i - 1]);
      start = null;
    }
  }
  if (start !== null) out.push([start, counts.length - 1]);
  return out;
}

const rowCounts = new Array(height).fill(0);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (isContent((y * width + x) * channels)) rowCounts[y]++;
  }
}
const rowBands = bands(rowCounts, 10);

const boxes = [];
for (const [rs, re] of rowBands) {
  const localCol = new Array(width).fill(0);
  for (let y = rs; y <= re; y++) {
    for (let x = 0; x < width; x++) {
      if (isContent((y * width + x) * channels)) localCol[x]++;
    }
  }
  for (const [cs, ce] of bands(localCol, 3)) {
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = rs; y <= re; y++) {
      for (let x = cs; x <= ce; x++) {
        if (isContent((y * width + x) * channels)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    boxes.push({
      left: Math.max(0, minX - PAD),
      top: Math.max(0, minY - PAD),
      width: Math.min(width - 1, maxX + PAD) - Math.max(0, minX - PAD) + 1,
      height: Math.min(height - 1, maxY + PAD) - Math.max(0, minY - PAD) + 1,
    });
  }
}

if (boxes.length !== names.length) {
  throw new Error(`Expected ${names.length} icons, detected ${boxes.length}`);
}

fs.mkdirSync(outDir, { recursive: true });

for (let i = 0; i < names.length; i++) {
  const name = names[i];
  const box = boxes[i];
  const outPath = path.join(outDir, `${name}.png`);

  const extracted = await sharp(sheetPath).extract(box).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const px = Buffer.from(extracted.data);
  for (let p = 0; p < px.length; p += 4) {
    if (px[p] <= BLACK_THR && px[p + 1] <= BLACK_THR && px[p + 2] <= BLACK_THR) {
      px[p + 3] = 0;
    }
  }

  await sharp(px, {
    raw: {
      width: extracted.info.width,
      height: extracted.info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(outPath);

  const outMeta = await sharp(outPath).metadata();
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(
    `${name.padEnd(20)} ${box.width}x${box.height} @ (${box.left},${box.top})`.padEnd(48),
    `wrote ${outMeta.width}x${outMeta.height} ${sizeKb}KB`,
  );
}

console.log(`\nExtracted ${names.length} icons → ${outDir}`);
