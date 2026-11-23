// Google Analytics 4 Integration & Event Tracker for Color Palette Extractor

export const GA_MEASUREMENT_ID =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GA_ID) ||
  'G-ZF1FSM8N07';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Track an extraction event (when colors are quantized or re-extracted).
 */
export function trackPaletteExtracted(params: {
  colors_count: number;
  source: 'upload' | 'sample';
  image_type?: string;
}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'palette_extracted', {
      colors_count: params.colors_count,
      source: params.source,
      image_type: params.image_type,
      tool: 'color-palette-extractor',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track palette_extracted', err);
  }
}

/**
 * Track a palette download event (PNG strip or TXT).
 * Easily marked as a key conversion event in Google Analytics 4.
 */
export function trackDownloadPalette(params: {
  format: 'png' | 'txt';
  colors_count: number;
}) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  try {
    window.gtag('event', 'download_palette', {
      format: params.format,
      colors_count: params.colors_count,
      tool: 'color-palette-extractor',
      value: 1, // Conversion value
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track download_palette', err);
  }
}

/**
 * Phase 2 Events
 */
export function trackPaletteExported(exportType: 'css' | 'tailwind' | 'json' | 'png' | 'txt', count: number) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'palette_exported', {
      export_type: exportType,
      colors_count: count,
      tool: 'color-palette-extractor',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track palette_exported', err);
  }
}

export function trackContrastChecked(hex: string, ratioWhite: number, ratioBlack: number) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'contrast_checked', {
      swatch_hex: hex,
      ratio_white: ratioWhite,
      ratio_black: ratioBlack,
      tool: 'color-palette-extractor',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track contrast_checked', err);
  }
}

export function trackGradientCopied(gradientCss: string, colorsCount: number) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', 'gradient_copied', {
      css: gradientCss,
      colors_count: colorsCount,
      tool: 'color-palette-extractor',
    });
  } catch (err) {
    console.debug('[Analytics] Failed to track gradient_copied', err);
  }
}
