# Color Palette Extractor

Get the colours from any photo or logo in seconds. Free, in your browser, no sign-up.

**Live tool:** https://tools.abidmahmud.cv/palette-extractor

Upload a photo or a logo and get a clean colour palette you can copy, pick from, and download. Your image never leaves your browser.

## What it does

- **Private by design.** The tool runs 100% client-side in the browser with the Canvas API. No upload, no server, no account.
- **Real colour extraction.** It reads the actual pixels of your image and uses deterministic median-cut quantisation to find the dominant colours.
- **3, 5, or 8 colours.** Pick how many colours you want in the palette.
- **HEX and RGB, one click to copy.** Every swatch shows its HEX and RGB values. Copy one colour, or copy all HEX codes at once.
- **Click to pick.** Click anywhere on your image to sample that exact pixel and add it to your palette, up to 8 colours.
- **Download your palette.** Save it as a high-resolution PNG swatch strip with hex labels, or as a plain TXT list of HEX codes.
- **Try it instantly.** A built-in sample photo lets you see the tool work with one click, no file needed.
- **Works with your files.** JPG, PNG, WebP, and SVG, up to 10 MB.

## Use it on the web

Open https://tools.abidmahmud.cv/palette-extractor, drop in an image, pick 3, 5, or 8 colours, and copy or download the palette. That is the whole job.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 to use the tool.

Build for production:

```bash
npm run build
npm run start
```

## Tech

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS 4
- Median-cut quantisation on real pixels, in the browser
- Google Analytics 4 events: `palette_extracted`, `download_palette`

## Claude Code plugin

This repo also ships a public Claude Code plugin that extracts a palette from an image right in your terminal. See `plugins/color-palette-extractor/README.md`, or install it with:

```text
/plugin marketplace add abirabidOG/color-palette-extractor
/plugin install color-palette-extractor@color-palette-extractor
```

## Author

Built by Abid Mahmud, Brand Identity Designer. Portfolio: https://www.abidmahmud.cv

## Licence

MIT. See `LICENSE`.
