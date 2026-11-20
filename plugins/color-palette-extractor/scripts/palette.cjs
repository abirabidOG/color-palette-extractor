#!/usr/bin/env node
/**
 * Color Palette Extractor CLI, extract a colour palette from an image, locally.
 *
 * Usage:
 *   node scripts/palette.cjs <image> [--colors 3|5|8] [--txt <file>]
 *
 * Engine: sharp for pixel access, median-cut quantisation written below.
 * Runs fully offline. Nothing is uploaded. Prints one HEX code per line,
 * most dominant first.
 */
const fs = require("fs");
const sharp = require("sharp");

const MAX_DIMENSION = 200;
const SAMPLE_STEP = 1;

function parseArgs(argv) {
  let input = null;
  const opts = { colors: 5, txt: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--colors") opts.colors = Number(argv[++i]);
    else if (a === "--txt") opts.txt = argv[++i];
    else if (a.startsWith("--")) {
      console.error(`Unknown option: ${a}`);
      process.exit(2);
    } else if (!input) {
      input = a;
    } else {
      console.error(`Unexpected argument: ${a}`);
      process.exit(2);
    }
  }
  return { input, opts };
}

function toHex(r, g, b) {
  const h = (v) => Math.round(v).toString(16).padStart(2, "0").toUpperCase();
  return `#${h(r)}${h(g)}${h(b)}`;
}

/**
 * Median cut: split the box with the widest colour range along its longest
 * channel at the median pixel, until there are `count` boxes. The average
 * colour of each box becomes one palette colour. Boxes are ordered by pixel
 * count, most dominant first.
 */
function medianCut(pixels, count) {
  let boxes = [pixels];
  while (boxes.length < count) {
    let splitIndex = -1;
    let widestRange = -1;
    let splitChannel = 0;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.length < 2) continue;
      for (let c = 0; c < 3; c++) {
        let min = 255;
        let max = 0;
        for (const p of box) {
          if (p[c] < min) min = p[c];
          if (p[c] > max) max = p[c];
        }
        if (max - min > widestRange) {
          widestRange = max - min;
          splitIndex = i;
          splitChannel = c;
        }
      }
    }
    if (splitIndex === -1) break;
    const box = boxes[splitIndex];
    const sorted = [...box].sort((a, b) => a[splitChannel] - b[splitChannel]);
    const mid = Math.floor(sorted.length / 2);
    boxes.splice(splitIndex, 1, sorted.slice(0, mid), sorted.slice(mid));
  }
  return boxes
    .map((box) => {
      const n = box.length;
      let r = 0;
      let g = 0;
      let b = 0;
      for (const p of box) {
        r += p[0];
        g += p[1];
        b += p[2];
      }
      return { hex: toHex(r / n, g / n, b / n), pixels: n };
    })
    .sort((a, b) => b.pixels - a.pixels)
    .map((c) => c.hex);
}

async function main() {
  const { input, opts } = parseArgs(process.argv.slice(2));
  if (!input) {
    console.error("Usage: node scripts/palette.cjs <image> [--colors 3|5|8] [--txt <file>]");
    process.exit(2);
  }
  if (![3, 5, 8].includes(opts.colors)) {
    console.error(`--colors must be 3, 5, or 8 (got ${opts.colors}).`);
    process.exit(2);
  }
  if (!fs.existsSync(input)) {
    console.error(`Not found: ${input}`);
    process.exit(1);
  }
  let data;
  let info;
  try {
    ({ data, info } = await sharp(input)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside" })
      .raw()
      .toBuffer({ resolveWithObject: true }));
  } catch (err) {
    console.error(`Could not read ${input} as an image: ${err.message}`);
    process.exit(1);
  }
  const channels = info.channels;
  const pixels = [];
  for (let i = 0; i < data.length; i += channels * SAMPLE_STEP) {
    // Skip fully transparent pixels so they never become a palette colour.
    if (channels === 4 && data[i + 3] === 0) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }
  if (pixels.length === 0) {
    console.error(`No visible pixels found in ${input}.`);
    process.exit(1);
  }
  const palette = medianCut(pixels, opts.colors);
  const text = palette.join("\n") + "\n";
  process.stdout.write(text);
  if (opts.txt) {
    fs.writeFileSync(opts.txt, text);
    console.error(`Wrote ${palette.length} colours to ${opts.txt}`);
  }
}

main();
