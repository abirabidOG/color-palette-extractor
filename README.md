# Color Palette Extractor — Free Color Palette From Any Photo or Logo

> Get the perfect color palette from any photo or logo in seconds. Free, no upload, your image never leaves your browser.

A 100% client-side web utility built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**, deploy-ready for Vercel.

## Features
- **100% Client-Side Privacy**: Runs in-browser via the HTML5 Canvas API. Zero cloud uploads.
- **True Color Extraction**: Uses deterministic median-cut quantization on real pixels to extract dominant, light, and dark swatches.
- **Interactive Click-to-Pick**: Click anywhere on the preview image to sample and add custom pixel swatches.
- **Color Count Selector**: Extract 3, 5, or 8 colors dynamically.
- **One-Click Export**:
  - Copy individual HEX / RGB codes with instant feedback.
  - "Copy All HEX Codes" to clipboard.
  - "Download Palette as PNG" (high-resolution swatch strip with typography and hex labels).
  - "Download as TXT" (plain text list of HEX codes).
- **Try a Sample Photo**: Instant 1-click test state with an embedded multi-tone coastal illustration.
- **SEO & Schema**: Includes Open Graph tags and structured `FAQPage` JSON-LD schema.
- **Google Analytics 4**: Configurable measurement ID with `palette_extracted` and `download_palette` conversion tracking.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the tool.

## Build

```bash
npm run build
npm run start
```
