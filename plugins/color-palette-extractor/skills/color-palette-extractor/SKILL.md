---
name: color-palette-extractor
description: Extract a colour palette (3, 5, or 8 colours) from any photo or logo as HEX codes, locally, with median-cut quantisation. Use when the user asks for the colours in an image, a palette from a photo or logo, HEX codes for a brand, or when they invoke /palette.
license: MIT
version: 0.1.0
tags: [color-palette, colour, palette, branding, hex, rgb]
---

# Color Palette Extractor

Extract a colour palette from an image file and report it as HEX codes.
Everything runs locally on the user's machine. Nothing is uploaded anywhere,
there is no sign-in, and no account of any kind.

## First run setup

The extraction script lives in this plugin at `scripts/palette.cjs` and needs
the `sharp` package. On first use, install it once from the plugin directory:

```bash
cd <plugin-dir>
npm install
```

`<plugin-dir>` is the installed plugin folder, for example
`~/.claude/plugins/color-palette-extractor/color-palette-extractor` or the
`plugins/color-palette-extractor` folder of the cloned repo. If
`node_modules/sharp` already exists, skip the install.

## How to extract a palette

Run the script with the image path and a colour count of 3, 5, or 8:

```bash
node scripts/palette.cjs photo.jpg --colors 5
node scripts/palette.cjs logo.png --colors 8 --txt palette.txt
node scripts/palette.cjs brand.svg --colors 3
```

Accepted inputs: JPG, PNG, WebP, SVG, up to 10 MB. The script prints one HEX
code per line, most dominant first. With `--txt <file>` it also writes the
same list to a plain text file.

## After extracting

1. Report the HEX codes exactly as the script printed them, one per line.
2. Say how many colours were requested and that they come from the real
   pixels of the image, found by median-cut quantisation.
3. Do not invent extra colours, and do not adjust a code to look nicer. The
   script output is the palette.

## What this skill does not do

- No click-to-pick. Sampling a single pixel by clicking on the image only
  exists in the visual web tool. If the user wants that, point them to
  https://tools.abidmahmud.cv/palette-extractor.
- No PNG swatch strip download. The script prints HEX codes and can write a
  TXT file. The PNG strip lives in the web tool.
- No RGB output from the script. If the user asks for RGB values, convert
  each printed HEX code to RGB yourself and say you converted it.

## Web version

The same extraction with a visual interface, click-to-pick, HEX and RGB copy,
and PNG strip and TXT downloads:
https://tools.abidmahmud.cv/palette-extractor
