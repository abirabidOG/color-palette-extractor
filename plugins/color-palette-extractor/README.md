# Color Palette Extractor plugin for Claude Code

Extract a colour palette from any photo or logo without leaving the terminal.
Free, local, no sign-up, nothing uploaded.

## Install

In Claude Code:

```text
/plugin marketplace add abirabidOG/color-palette-extractor
/plugin install color-palette-extractor@color-palette-extractor
```

First run only: the skill installs its image engine once, from the plugin
folder:

```bash
cd <plugin-dir>
npm install
```

## Use

```text
/palette photo.jpg
/palette logo.png --colors 8 --txt palette.txt
```

Or ask Claude in plain words: "what colours are in this photo?" Colour
counts: 3, 5, or 8. The plugin prints one HEX code per line, most dominant
first, and can also write a TXT file.

## How it works

The plugin ships a skill (`skills/color-palette-extractor/SKILL.md`), a slash
command (`/palette`), and a small Node script (`scripts/palette.cjs`) built
on sharp. It reads the real pixels of your image and finds the dominant
colours with median-cut quantisation, the same method the web tool uses.
Everything runs on your machine. The script prints the palette exactly as
found, it never invents or adjusts a colour.

## What it does not do

- No click-to-pick and no PNG swatch strip. Both live in the web tool.
- No RGB output from the script. Ask Claude to convert the HEX codes if you
  need RGB.

## Web version

The same extraction with a visual interface, click-to-pick, HEX and RGB copy,
and PNG strip and TXT downloads:
https://tools.abidmahmud.cv/palette-extractor

## Licence

MIT. By Abid Mahmud, https://www.abidmahmud.cv
