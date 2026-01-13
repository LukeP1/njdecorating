#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

// projectRoot is the repo root (one level above this script)
const projectRoot = path.join(__dirname, '..');
const imagesDir = path.join(projectRoot, 'images');

const maxWidth = 1600;
const maxHeight = 1600;
const quality = 80;

const validExtensions = new Set(['.jpg', '.jpeg', '.png']);
const excludeDirs = new Set(['node_modules', '_site', '.git', '.jekyll-cache', 'vendor', '.bundle']);

async function getImageFiles() {
  const entries = await fs.readdir(imagesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && validExtensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name);
}

async function convertImage(fileName) {
  const inputPath = path.join(imagesDir, fileName);
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const outputName = `${base}.webp`;
  const outputPath = path.join(imagesDir, outputName);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    let transformer = image;
    const needsResize =
      (metadata.width && metadata.width > maxWidth) ||
      (metadata.height && metadata.height > maxHeight);

    if (needsResize) {
      console.log(
        `Resizing and converting ${fileName} -> ${outputName} (${metadata.width}x${metadata.height})`
      );
      transformer = transformer.resize({
        width: maxWidth,
        height: maxHeight,
        fit: 'inside',
        withoutEnlargement: true,
      });
    } else {
      console.log(`Converting ${fileName} -> ${outputName} without resize.`);
    }

    await transformer.toFormat('webp', { quality }).toFile(outputPath);

    return { oldName: fileName, newName: outputName };
  } catch (error) {
    console.error(`Failed to convert ${fileName}:`, error.message);
    return null;
  }
}

async function walkForTextFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (excludeDirs.has(entry.name)) continue;
      const childDir = path.join(dir, entry.name);
      files.push(...(await walkForTextFiles(childDir)));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.html' || ext === '.css' || ext === '.js') {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  return files;
}

async function updateReferences(mappings) {
  if (mappings.length === 0) {
    console.log('No images converted, skipping reference update.');
    return;
  }

  const textFiles = await walkForTextFiles(projectRoot);

  for (const filePath of textFiles) {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = content;

    for (const { oldName, newName } of mappings) {
      updated = updated.split(oldName).join(newName);
    }

    if (updated !== content) {
      await fs.writeFile(filePath, updated, 'utf8');
      console.log(`Updated references in ${path.relative(projectRoot, filePath)}`);
    }
  }
}

async function main() {
  try {
    const imageFiles = await getImageFiles();

    if (imageFiles.length === 0) {
      console.log('No source images found in images directory.');
      return;
    }

    console.log(`Found ${imageFiles.length} images to process.`);

    const mappings = [];
    for (const fileName of imageFiles) {
      const mapping = await convertImage(fileName);
      if (mapping) mappings.push(mapping);
    }

    await updateReferences(mappings);

    console.log('Image optimisation complete.');
  } catch (error) {
    console.error('Unexpected error during image optimisation:', error);
    process.exit(1);
  }
}

main();
