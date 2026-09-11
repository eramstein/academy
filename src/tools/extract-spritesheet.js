import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const jsonPath = 'public/assets/images/ui/icons/spritesheets/spritesheet.json';
const sheetPath = 'public/assets/images/ui/icons/spritesheets/spritesheet.png';
const outDir = 'public/assets/images/ui/icons';

const json = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const meta = await sharp(sheetPath).metadata();
console.log(
  'spritesheet',
  meta.width,
  'x',
  meta.height,
  meta.format,
  'channels',
  meta.channels,
  'hasAlpha',
  meta.hasAlpha,
);

const frames = json.textures[0].frames;
for (const f of frames) {
  const { x, y, w, h } = f.frame;
  const outPath = path.join(outDir, f.filename);
  await sharp(sheetPath)
    .extract({ left: x, top: y, width: w, height: h })
    .png()
    .toFile(outPath);
  const outMeta = await sharp(outPath).metadata();
  const sizeKb = Math.round(fs.statSync(outPath).size / 1024);
  console.log(
    `${f.filename.padEnd(18)} ${w}x${h} @ (${x},${y})`.padEnd(40),
    `wrote ${outMeta.width}x${outMeta.height} ${sizeKb}KB`,
  );
}
