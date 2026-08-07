// convert-images.js
// Recursively converts images to JPEG, with per-folder resize/size settings
// Only processes images that are either not JPG or are too large
// Optionally overwrites the original PNGs

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const overwriteOriginals = true; // true = replace PNGs with JPGs

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
];

async function processImage(inputPath, { width, height, maxFileSizeKB, quality }) {
  const ext = path.extname(inputPath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) return;

  const stats = fs.statSync(inputPath);
  const fileSizeKB = stats.size / 1024;

  // Skip if it's already a JPG and under the size limit
  if (['.jpg', '.jpeg'].includes(ext) && fileSizeKB <= maxFileSizeKB) {
    console.log(`⏭️ Skipping (already optimized): ${inputPath} (${fileSizeKB.toFixed(1)}KB)`);
    return;
  }

  console.log(`🔄 Processing: ${inputPath} (${fileSizeKB.toFixed(1)}KB)`);

  let outputPath;
  if (overwriteOriginals) {
    outputPath = inputPath + '.tmp.jpg';
  } else {
    outputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.jpg');
  }

  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: 'cover',
        position: 'centre',
      })
      .jpeg({ quality })
      .toFile(outputPath);

    if (overwriteOriginals) {
      const finalOutputPath = inputPath.replace(/\.(png|jpg|jpeg)$/i, '.jpg');
      fs.renameSync(outputPath, finalOutputPath);

      if (ext === '.png') {
        fs.unlinkSync(inputPath);
        console.log(`🗑️ Deleted original PNG: ${inputPath}`);
      }
    }

    const newStats = fs.statSync(
      overwriteOriginals ? inputPath.replace(/\.(png|jpg|jpeg)$/i, '.jpg') : outputPath
    );
    const newFileSizeKB = newStats.size / 1024;

    console.log(`✅ Processed: ${inputPath} -> ${newFileSizeKB.toFixed(1)}KB`);
  } catch (err) {
    console.error(`❌ Error processing ${inputPath}:`, err);
    if (fs.existsSync(outputPath) && overwriteOriginals) {
      fs.unlinkSync(outputPath);
    }
  }
}

function walkDir(dir, settings) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, settings);
    } else {
      processImage(fullPath, settings);
    }
  });
}

for (const target of targets) {
  console.log(`\n🔄 Processing directory: ${target.dir}`);
  if (fs.existsSync(target.dir)) {
    walkDir(target.dir, target);
  } else {
    console.log(`⚠️ Directory not found: ${target.dir}`);
  }
}
