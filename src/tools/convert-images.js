// convert-images.js
// Recursively converts images to JPEG, with per-folder resize/size settings
// Only processes images that are either not JPG, not yet at the target
// dimensions, or over the size limit without already being converted
// Optionally overwrites the original PNGs

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const overwriteOriginals = true; // true = replace PNGs with JPGs
const minQuality = 40;

const targets = [
  {
    dir: './public/assets/images/cards',
    width: 512,
    height: 512,
    maxFileSizeKB: 150,
    quality: 90,
  },
  {
    dir: './public/assets/images/places',
    width: 1024,
    height: 1024,
    maxFileSizeKB: 300,
    quality: 90,
  },
  {
    dir: './public/assets/images/characters',
    quality: 90,
  },
];

async function matchesTargetDimensions(inputPath, width, height) {
  if (!width && !height) return true;
  const meta = await sharp(inputPath).metadata();
  return (!width || meta.width === width) && (!height || meta.height === height);
}

async function encodeJpeg(inputPath, outputPath, { width, height, quality }) {
  let pipeline = sharp(inputPath);
  if (width && height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'cover',
      position: 'centre',
    });
  }
  await pipeline.jpeg({ quality }).toFile(outputPath);
}

async function processImage(inputPath, { width, height, maxFileSizeKB, quality }) {
  const ext = path.extname(inputPath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  const stats = fs.statSync(inputPath);
  const fileSizeKB = stats.size / 1024;
  const alreadyJpg = ['.jpg', '.jpeg'].includes(ext);
  const underSizeLimit = maxFileSizeKB == null || fileSizeKB <= maxFileSizeKB;

  if (alreadyJpg) {
    const alreadyConverted = await matchesTargetDimensions(inputPath, width, height);
    // Target-dimension JPGs must skip even when over maxFileSizeKB.
    // Re-encoding 1024² place art at quality 90 still lands at 300–440KB,
    // so a size-only skip would rewrite the same files every run.
    if (alreadyConverted || underSizeLimit) {
      console.log(`⏭️ Skipping (already optimized): ${inputPath} (${fileSizeKB.toFixed(1)}KB)`);
      return;
    }
  }

  console.log(`🔄 Processing: ${inputPath} (${fileSizeKB.toFixed(1)}KB)`);

  let outputPath;
  if (overwriteOriginals) {
    outputPath = inputPath + '.tmp.jpg';
  } else {
    outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.jpg');
  }

  try {
    let q = quality;
    let newFileSizeKB;

    while (true) {
      await encodeJpeg(inputPath, outputPath, { width, height, quality: q });
      newFileSizeKB = fs.statSync(outputPath).size / 1024;
      if (maxFileSizeKB == null || newFileSizeKB <= maxFileSizeKB || q <= minQuality) {
        break;
      }
      q -= 5;
    }

    if (overwriteOriginals) {
      const finalOutputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.jpg');
      fs.renameSync(outputPath, finalOutputPath);

      if (ext === '.png') {
        fs.unlinkSync(inputPath);
        console.log(`🗑️ Deleted original PNG: ${inputPath}`);
      }
    }

    const qualityNote = q !== quality ? ` @ q${q}` : '';
    console.log(`✅ Processed: ${inputPath} -> ${newFileSizeKB.toFixed(1)}KB${qualityNote}`);
  } catch (err) {
    console.error(`❌ Error processing ${inputPath}:`, err);
    if (fs.existsSync(outputPath) && overwriteOriginals) {
      fs.unlinkSync(outputPath);
    }
  }
}

async function walkDir(dir, settings) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, settings);
    } else {
      await processImage(fullPath, settings);
    }
  }
}

for (const target of targets) {
  console.log(`\n🔄 Processing directory: ${target.dir}`);
  if (fs.existsSync(target.dir)) {
    await walkDir(target.dir, target);
  } else {
    console.log(`⚠️ Directory not found: ${target.dir}`);
  }
}
