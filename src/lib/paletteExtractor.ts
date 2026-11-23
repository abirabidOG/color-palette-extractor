export interface ColorSwatch {
  id: string;
  hex: string;
  rgb: [number, number, number];
  rgbString: string;
  luminance: number;
  textColor: string;
  isLight?: boolean;
  isDark?: boolean;
  isPicked?: boolean;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const hex = [clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  return `#${hex}`;
}

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return [r, g, b];
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return [r, g, b];
}

export function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function getContrastTextColor(r: number, g: number, b: number): string {
  return getLuminance(r, g, b) > 0.6 ? '#0B0B0D' : '#FFFFFF';
}

export function sRgbLuminance(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * sRgbLuminance(r) + 0.7152 * sRgbLuminance(g) + 0.0722 * sRgbLuminance(b);
}

export function getWcagContrast(r: number, g: number, b: number) {
  const L = getRelativeLuminance(r, g, b);
  const ratioWhite = (1.0 + 0.05) / (L + 0.05);
  const ratioBlack = (L + 0.05) / (0.0 + 0.05);
  return {
    ratioWhite: parseFloat(ratioWhite.toFixed(2)),
    ratioBlack: parseFloat(ratioBlack.toFixed(2)),
    aaWhite: ratioWhite >= 4.5,
    aaaWhite: ratioWhite >= 7.0,
    aaBlack: ratioBlack >= 4.5,
    aaaBlack: ratioBlack >= 7.0,
  };
}

// RGB <-> HSL conversions for harmony generation
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case nr:
        h = (ng - nb) / d + (ng < nb ? 6 : 0);
        break;
      case ng:
        h = (nb - nr) / d + 2;
        break;
      case nb:
        h = (nr - ng) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const nh = ((h % 360) + 360) % 360 / 360;
  const ns = Math.max(0, Math.min(100, s)) / 100;
  const nl = Math.max(0, Math.min(100, l)) / 100;

  if (ns === 0) {
    const val = Math.round(nl * 255);
    return [val, val, val];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = nl < 0.5 ? nl * (1 + ns) : nl + ns - nl * ns;
  const p = 2 * nl - q;
  const r = Math.round(hue2rgb(p, q, nh + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, nh) * 255);
  const b = Math.round(hue2rgb(p, q, nh - 1 / 3) * 255);
  return [r, g, b];
}

export function createSwatchFromRgb(r: number, g: number, b: number, idSuffix = ""): ColorSwatch {
  const hex = rgbToHex(r, g, b);
  const lum = getLuminance(r, g, b);
  return {
    id: `swatch-${idSuffix || hex.replace("#", "")}`,
    hex,
    rgb: [r, g, b],
    rgbString: `rgb(${r}, ${g}, ${b})`,
    luminance: lum,
    textColor: getContrastTextColor(r, g, b),
    isLight: lum >= 0.7,
    isDark: lum <= 0.3,
  };
}

export function generateHarmonies(baseSwatch: ColorSwatch): {
  complementary: ColorSwatch[];
  analogous: ColorSwatch[];
  triadic: ColorSwatch[];
} {
  const [h, s, l] = rgbToHsl(baseSwatch.rgb[0], baseSwatch.rgb[1], baseSwatch.rgb[2]);

  // Complementary (base + inverted hue)
  const compRgb = hslToRgb((h + 180) % 360, s, l);
  const compShade = hslToRgb((h + 180) % 360, Math.max(10, s - 20), Math.min(90, l + 20));
  const complementary = [
    baseSwatch,
    createSwatchFromRgb(compRgb[0], compRgb[1], compRgb[2], "comp-1"),
    createSwatchFromRgb(compShade[0], compShade[1], compShade[2], "comp-2"),
  ];

  // Analogous (base + -30 deg + +30 deg)
  const a1 = hslToRgb((h - 30 + 360) % 360, s, l);
  const a2 = hslToRgb((h + 30) % 360, s, l);
  const analogous = [
    createSwatchFromRgb(a1[0], a1[1], a1[2], "ana-1"),
    baseSwatch,
    createSwatchFromRgb(a2[0], a2[1], a2[2], "ana-2"),
  ];

  // Triadic (base + 120 deg + 240 deg)
  const t1 = hslToRgb((h + 120) % 360, s, l);
  const t2 = hslToRgb((h + 240) % 360, s, l);
  const triadic = [
    baseSwatch,
    createSwatchFromRgb(t1[0], t1[1], t1[2], "tri-1"),
    createSwatchFromRgb(t2[0], t2[1], t2[2], "tri-2"),
  ];

  return { complementary, analogous, triadic };
}

export function generateCssVariablesCode(swatches: ColorSwatch[]): string {
  const lines = [":root {"];
  swatches.forEach((s, idx) => {
    lines.push(`  --color-${idx + 1}: ${s.hex}; /* rgb(${s.rgb.join(", ")}) */`);
  });
  lines.push("}");
  return lines.join("\n");
}

export function generateTailwindConfigCode(swatches: ColorSwatch[]): string {
  const colorLines = swatches
    .map((s, idx) => `        '${idx + 1}': '${s.hex}',`)
    .join("\n");
  return `/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        palette: {
${colorLines}
        },
      },
    },
  },
};`;
}

export function generateJsonCode(swatches: ColorSwatch[]): string {
  const list = swatches.map((s, idx) => ({
    index: idx + 1,
    hex: s.hex,
    rgb: s.rgb,
    rgbString: s.rgbString,
    luminance: parseFloat(s.luminance.toFixed(3)),
    contrast: getWcagContrast(s.rgb[0], s.rgb[1], s.rgb[2]),
  }));
  return JSON.stringify(list, null, 2);
}

export function colorDistance(
  c1: [number, number, number],
  c2: [number, number, number]
): number {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  // Weighted perceptual distance
  return Math.sqrt(0.299 * dr * dr + 0.587 * dg * dg + 0.114 * db * db);
}

interface Pixel {
  r: number;
  g: number;
  b: number;
}

interface ColorBox {
  pixels: Pixel[];
  rMin: number;
  rMax: number;
  gMin: number;
  gMax: number;
  bMin: number;
  bMax: number;
  volume: number;
}

function createBox(pixels: Pixel[]): ColorBox {
  let rMin = 255,
    rMax = 0,
    gMin = 255,
    gMax = 0,
    bMin = 255,
    bMax = 0;

  for (let i = 0; i < pixels.length; i++) {
    const p = pixels[i];
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }

  const volume = (rMax - rMin + 1) * (gMax - gMin + 1) * (bMax - bMin + 1);
  return { pixels, rMin, rMax, gMin, gMax, bMin, bMax, volume };
}

function medianCut(pixels: Pixel[], targetBoxes: number): Pixel[][] {
  if (pixels.length === 0) return [];
  const boxes: ColorBox[] = [createBox(pixels)];

  while (boxes.length < targetBoxes) {
    // Pick box with largest pixel count and range
    let bestIndex = -1;
    let maxScore = -1;

    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (b.pixels.length > 8) {
        const range = Math.max(
          b.rMax - b.rMin,
          b.gMax - b.gMin,
          b.bMax - b.bMin
        );
        const score = b.pixels.length * (range + 1);
        if (score > maxScore) {
          maxScore = score;
          bestIndex = i;
        }
      }
    }

    if (bestIndex === -1) break;

    const boxToSplit = boxes.splice(bestIndex, 1)[0];
    const rRange = boxToSplit.rMax - boxToSplit.rMin;
    const gRange = boxToSplit.gMax - boxToSplit.gMin;
    const bRange = boxToSplit.bMax - boxToSplit.bMin;

    const maxRange = Math.max(rRange, gRange, bRange);
    let channel: 'r' | 'g' | 'b' = 'r';
    if (maxRange === gRange) channel = 'g';
    else if (maxRange === bRange) channel = 'b';

    boxToSplit.pixels.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(boxToSplit.pixels.length / 2);
    const part1 = boxToSplit.pixels.slice(0, mid);
    const part2 = boxToSplit.pixels.slice(mid);

    if (part1.length > 0) boxes.push(createBox(part1));
    if (part2.length > 0) boxes.push(createBox(part2));
  }

  return boxes.map((b) => b.pixels);
}

export function extractPaletteFromCanvas(
  canvas: HTMLCanvasElement,
  targetCount: 3 | 5 | 8 | 12 = 5
): ColorSwatch[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  // Downsample to max 150x150 for fast & smooth processing
  const maxDim = 150;
  let sampleW = canvas.width;
  let sampleH = canvas.height;
  if (sampleW > maxDim || sampleH > maxDim) {
    if (sampleW > sampleH) {
      sampleH = Math.round((sampleH * maxDim) / sampleW);
      sampleW = maxDim;
    } else {
      sampleW = Math.round((sampleW * maxDim) / sampleH);
      sampleH = maxDim;
    }
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, sampleW);
  offscreen.height = Math.max(1, sampleH);
  const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!offCtx) return [];

  offCtx.drawImage(canvas, 0, 0, offscreen.width, offscreen.height);
  const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  const data = imgData.data;

  const validPixels: Pixel[] = [];
  const lightPixels: Pixel[] = [];
  const darkPixels: Pixel[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    // Ignore fully transparent or low-opacity pixels
    if (a < 128) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const p: Pixel = { r, g, b };
    validPixels.push(p);

    const lum = getLuminance(r, g, b);
    if (lum >= 0.8) {
      lightPixels.push(p);
    } else if (lum <= 0.2) {
      darkPixels.push(p);
    }
  }

  if (validPixels.length === 0) return [];

  // Generate more cluster boxes to ensure high diversity
  const clusterCount = Math.max(16, targetCount * 3);
  const clusters = medianCut(validPixels, clusterCount);

  // Calculate average color and count for each cluster
  const clusterAverages = clusters.map((pixels) => {
    let sumR = 0,
      sumG = 0,
      sumB = 0;
    for (let i = 0; i < pixels.length; i++) {
      sumR += pixels[i].r;
      sumG += pixels[i].g;
      sumB += pixels[i].b;
    }
    const count = pixels.length;
    const avg: [number, number, number] = [
      Math.round(sumR / count),
      Math.round(sumG / count),
      Math.round(sumB / count),
    ];
    return {
      rgb: avg,
      count,
      luminance: getLuminance(avg[0], avg[1], avg[2]),
    };
  });

  // Sort by popularity / count descending
  clusterAverages.sort((a, b) => b.count - a.count);

  const selectedColors: [number, number, number][] = [];
  const minDistance = targetCount <= 3 ? 45 : targetCount === 5 ? 32 : 24;

  for (const cluster of clusterAverages) {
    const isDistinct = selectedColors.every(
      (selected) => colorDistance(selected, cluster.rgb) >= minDistance
    );
    if (isDistinct) {
      selectedColors.push(cluster.rgb);
    }
    if (selectedColors.length >= targetCount) break;
  }

  // Fallback: if not enough distinct colors, loosen threshold
  if (selectedColors.length < targetCount) {
    for (const cluster of clusterAverages) {
      const isDistinct = selectedColors.every(
        (selected) => colorDistance(selected, cluster.rgb) >= 15
      );
      if (isDistinct) {
        selectedColors.push(cluster.rgb);
      }
      if (selectedColors.length >= targetCount) break;
    }
  }

  // Add 1 distinct light shade if clearly different and present
  let lightColor: [number, number, number] | null = null;
  if (lightPixels.length >= 10) {
    let sumR = 0,
      sumG = 0,
      sumB = 0;
    for (let i = 0; i < lightPixels.length; i++) {
      sumR += lightPixels[i].r;
      sumG += lightPixels[i].g;
      sumB += lightPixels[i].b;
    }
    const avgLight: [number, number, number] = [
      Math.round(sumR / lightPixels.length),
      Math.round(sumG / lightPixels.length),
      Math.round(sumB / lightPixels.length),
    ];
    const isDistinctFromAll = selectedColors.every(
      (c) => colorDistance(c, avgLight) >= 35
    );
    if (isDistinctFromAll) {
      lightColor = avgLight;
    }
  }

  // Add 1 distinct dark shade if clearly different and present
  let darkColor: [number, number, number] | null = null;
  if (darkPixels.length >= 10) {
    let sumR = 0,
      sumG = 0,
      sumB = 0;
    for (let i = 0; i < darkPixels.length; i++) {
      sumR += darkPixels[i].r;
      sumG += darkPixels[i].g;
      sumB += darkPixels[i].b;
    }
    const avgDark: [number, number, number] = [
      Math.round(sumR / darkPixels.length),
      Math.round(sumG / darkPixels.length),
      Math.round(sumB / darkPixels.length),
    ];
    const isDistinctFromAll = selectedColors.every(
      (c) => colorDistance(c, avgDark) >= 35
    );
    if (isDistinctFromAll) {
      darkColor = avgDark;
    }
  }

  // If target count is 5, prompt states:
  // "Extract 5 dominant colors from the image, plus 1 light and 1 dark shade if they are clearly different, for a total of 5 to 6 colors."
  // So for targetCount = 5, we keep up to 6 colors if light/dark is distinct!
  const finalRgbList: {
    rgb: [number, number, number];
    isLight?: boolean;
    isDark?: boolean;
  }[] = selectedColors.slice(0, targetCount).map((rgb) => ({ rgb }));

  const maxAllowed = targetCount === 5 ? 6 : targetCount;

  if (lightColor && finalRgbList.length < maxAllowed) {
    finalRgbList.push({ rgb: lightColor, isLight: true });
  }
  if (darkColor && finalRgbList.length < maxAllowed) {
    finalRgbList.push({ rgb: darkColor, isDark: true });
  }

  return finalRgbList.map((item, index) => {
    const [r, g, b] = item.rgb;
    const hex = rgbToHex(r, g, b);
    const lum = getLuminance(r, g, b);
    return {
      id: `color-${index}-${hex}`,
      hex,
      rgb: item.rgb,
      rgbString: `rgb(${r}, ${g}, ${b})`,
      luminance: lum,
      textColor: getContrastTextColor(r, g, b),
      isLight: item.isLight,
      isDark: item.isDark,
    };
  });
}

export function generatePaletteTxt(swatches: ColorSwatch[], imageTitle?: string): string {
  const header = imageTitle ? `# Color Palette - ${imageTitle}\n\n` : '';
  return header + swatches.map((s) => `${s.hex}  /* ${s.rgbString} */`).join('\n');
}

export async function generatePalettePng(
  swatches: ColorSwatch[],
  imageTitle: string = 'Color Palette'
): Promise<Blob> {
  const width = 1200;
  const height = 480;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context for PNG generation');

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Top header text
  ctx.font = '600 13px Inter, -apple-system, sans-serif';
  ctx.fillStyle = '#4F4E55';
  ctx.textAlign = 'left';
  ctx.fillText('COLOR PALETTE EXTRACTOR', 50, 48);

  ctx.font = '500 13px Inter, -apple-system, sans-serif';
  ctx.fillStyle = '#1F8C7F';
  ctx.textAlign = 'right';
  ctx.fillText('tools.abidmahmud.cv', width - 50, 48);

  // Subtle separator line
  ctx.strokeStyle = '#E5E1D6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 64);
  ctx.lineTo(width - 50, 64);
  ctx.stroke();

  // Swatches section
  const count = swatches.length;
  const marginX = 50;
  const swatchY = 88;
  const swatchH = 240;
  const totalW = width - marginX * 2;
  const gap = count > 6 ? 12 : 16;
  const swatchW = (totalW - gap * (count - 1)) / count;

  for (let i = 0; i < count; i++) {
    const s = swatches[i];
    const x = marginX + i * (swatchW + gap);

    // Rounded rectangle for swatch
    const radius = 12;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + radius, swatchY);
    ctx.lineTo(x + swatchW - radius, swatchY);
    ctx.quadraticCurveTo(x + swatchW, swatchY, x + swatchW, swatchY + radius);
    ctx.lineTo(x + swatchW, swatchY + swatchH - radius);
    ctx.quadraticCurveTo(
      x + swatchW,
      swatchY + swatchH,
      x + swatchW - radius,
      swatchY + swatchH
    );
    ctx.lineTo(x + radius, swatchY + swatchH);
    ctx.quadraticCurveTo(x, swatchY + swatchH, x, swatchY + swatchH - radius);
    ctx.lineTo(x, swatchY + radius);
    ctx.quadraticCurveTo(x, swatchY, x + radius, swatchY);
    ctx.closePath();
    ctx.fillStyle = s.hex;
    ctx.fill();

    // Border to ensure visibility of white/light swatches
    ctx.strokeStyle = '#E5E1D6';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Under-swatch labels
    const labelY = swatchY + swatchH + 32;

    // HEX label
    ctx.font = '700 18px Inter, -apple-system, monospace, sans-serif';
    ctx.fillStyle = '#0B0B0D';
    ctx.textAlign = 'center';
    ctx.fillText(s.hex, x + swatchW / 2, labelY);

    // RGB label
    ctx.font = '500 12px Inter, -apple-system, sans-serif';
    ctx.fillStyle = '#4F4E55';
    ctx.fillText(s.rgbString, x + swatchW / 2, labelY + 22);

    // Tag (Light / Dark / Picked) if applicable
    if (s.isLight || s.isDark || s.isPicked) {
      ctx.font = '600 10px Inter, -apple-system, sans-serif';
      ctx.fillStyle = '#1F8C7F';
      const tagText = s.isPicked
        ? 'PICKED'
        : s.isLight
        ? 'LIGHT'
        : 'DARK';
      ctx.fillText(tagText, x + swatchW / 2, labelY + 40);
    }
  }

  // Footer banner
  ctx.strokeStyle = '#E5E1D6';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, height - 48);
  ctx.lineTo(width - 50, height - 48);
  ctx.stroke();

  ctx.font = '400 12px Inter, -apple-system, sans-serif';
  ctx.fillStyle = '#4F4E55';
  ctx.textAlign = 'left';
  ctx.fillText(
    'Extracted from: ' + (imageTitle.length > 40 ? imageTitle.slice(0, 37) + '...' : imageTitle),
    50,
    height - 24
  );

  ctx.textAlign = 'right';
  ctx.fillText(
    'Free client-side tool by Abid Mahmud • abidmahmud.cv',
    width - 50,
    height - 24
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      'image/png',
      1.0
    );
  });
}
