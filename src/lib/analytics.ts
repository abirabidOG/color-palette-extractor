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
