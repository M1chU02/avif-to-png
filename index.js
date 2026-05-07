#!/usr/bin/env node
/**
 * avif-to-png – Convert .avif files to .png.
 *
 * Usage:
 *   avif-to-png <input> [options]
 *
 * Arguments:
 *   <input>          Path to an AVIF file or a directory containing AVIFs.
 *
 * Options:
 *   -o, --out <dir>  Output directory (defaults to the same folder as the source file).
 *   -r, --recursive  Recurse into sub‑directories when <input> is a folder.
 *   -q, --quiet      Suppress per‑file logs, show only a final summary.
 *
 * Example:
 *   avif-to-png ./image.avif
 *   avif-to-png ./pictures -r -o ./pngs
 */

const { program } = require('commander');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

program
  .argument('<input>', 'AVIF file or directory')
  .option('-o, --out <dir>', 'Output directory (default: same folder as source)')
  .option('-r, --recursive', 'Process directories recursively')
  .option('-q, --quiet', 'Suppress per‑file logs')
  .parse(process.argv);

const options = program.opts();
const inputPath = path.resolve(program.args[0]);
const outBase = options.out ? path.resolve(options.out) : null;
let filesProcessed = 0;
let errors = 0;

/**
 * Convert a single AVIF file to PNG.
 */
async function convertFile(avifPath) {
  const relDir = path.dirname(avifPath);
  const outDir = outBase ? outBase : relDir;
  const baseName = path.basename(avifPath, '.avif');
  const pngPath = path.join(outDir, `${baseName}.png`);

  try {
    await fs.promises.mkdir(outDir, { recursive: true });
    await sharp(avifPath).png().toFile(pngPath);
    if (!options.quiet) console.log(`✔ ${avifPath} → ${pngPath}`);
    filesProcessed++;
  } catch (e) {
    console.error(`✖ Failed ${avifPath}: ${e.message}`);
    errors++;
  }
}

/**
 * Walk a directory (optionally recursively) and collect .avif files.
 */
async function walkDir(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (options.recursive) await walkDir(fullPath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.avif')) {
      await convertFile(fullPath);
    }
  }
}

/**
 * Main driver.
 */
(async () => {
  try {
    const stats = await fs.promises.stat(inputPath);
    if (stats.isFile()) {
      if (!inputPath.toLowerCase().endsWith('.avif')) {
        console.error('Error: The supplied file does not have an .avif extension.');
        process.exit(1);
      }
      await convertFile(inputPath);
    } else if (stats.isDirectory()) {
      await walkDir(inputPath);
    } else {
      console.error('Error: Input must be a file or directory.');
      process.exit(1);
    }

    // Summary
    console.log('\n=== Conversion complete ===');
    console.log(`Processed: ${filesProcessed}`);
    if (errors) console.log(`Errors:    ${errors}`);
    process.exit(errors ? 1 : 0);
  } catch (e) {
    console.error(`Fatal error: ${e.message}`);
    process.exit(1);
  }
})();
