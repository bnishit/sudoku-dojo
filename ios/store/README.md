# Sudoku Belts · App Store pack

Local draft for iPhone v1, fully free. Pending Claude review. Nothing uploaded or submitted. The Xcode AppIcon and `app/` are unchanged.

## Review

- `icon-options/compare.html`: current icon + A/B/C, each at 1024, 180 and 60 CSS pixels, on light and dark. Optional rounded-corner preview; new PNGs are square, 1024×1024, RGB with no alpha. Nishit picks before anyone changes the Xcode icon.
- `listing.md`: paste-ready fields with character counts, six captions, draft age-rating answers, and Data Not Collected.
- `walkthrough.html`: real export previews and the exact code that handles supplied or missing captures.
- `export/`: six numbered 1320×2868 PNGs from real iPhone 17 Pro Max simulator captures, plus preview and status. **Approved by Nishit on 2026-11-04; ready to upload.** Re-exporting resets `uploadReady` to false.

## Regenerate exports

From the repository root, after the one-time install:

```sh
npm --prefix ios/store/screenshots run export
```

One-time install: `npm --prefix ios/store/screenshots ci --cache /tmp/sudoku-belts-npm-cache`.

Requires Node 20.9+ and an installed Google Chrome. On macOS the default Chrome path is used. Set `CHROME_PATH` to another Chrome or Chromium executable if needed. No Xcode, simulator, browser download, or app build is used. The command starts a local Next.js page, exports through html-to-image in Chrome, writes the PNGs, checks their sizes, and stops its own server. Port 5197 must be free. Generator fonts are local Georgia and Arial, matching the app's serif/sans style without fetching font files. No generated background art is used.

## Real captures

Claude replaced all six captures on an iPhone 17 Pro Max simulator at **1320×2868**, portrait, light mode, status bar 9:41. They come from real play: four Easy puzzles and eight Medium moves, with no edited data. Rerun the command above after changing a capture or caption:

| File | Capture | Current input |
|---|---|---|
| `raw/01.png` | Learn path | Real · White Belt; Next: Full House |
| `raw/02.png` | Hidden Single: Box lesson | Real · beam drawn; 4 blocks column 9 in this box |
| `raw/03.png` | Play board mid-game | Real · Medium; 7s highlighted; 0 mistakes |
| `raw/04.png` | Your missed moments replay | Real · move 1 of 11; coach prompt |
| `raw/05.png` | Daily puzzle | Real · 6s highlighted |
| `raw/06.png` | Me: week + blind spot + reminder | Real · 1 of 3 days; Hidden Single in a column; reminder ON |

The generator always reads these six paths. Existing placeholders appear as-is with a DRAFT banner. Missing captures get a clear Capture pending box inside the phone frame. Known placeholder hashes stay flagged even if renamed. A new 1320×2868 image removes its banner, but **size is not proof of correct content**: Human review must still check the final screen, light mode, lesson beam, replay, blind spot, week and reminder. `export/status.json` deliberately keeps `uploadReady: false` for human review.

No app UI is generated, redrawn, retouched, or assembled from components. The screenshot is fitted inside the skill's provided phone frame without stretching or cropping. Frame corners clip the image as a real phone would. Status bar and home indicator remain part of the real capture. Missing file state is not a simulated app screen.

For layout work after a first export, `npm --prefix ios/store/screenshots run dev` opens the generator at localhost:3000. It uses the last prepared capture manifest; rerun export after replacing inputs. The page also has a browser download button. The command-line export is the reliable way to write directly to `export/`.

## Scope and source

The generator is a separate Next.js tool with its own locked dependencies. It does not alter the static app or Xcode project. Its single page owns captions, layouts and html-to-image export. Numbered filenames preserve capture order. The supplied mockup and measured screen opening come from the app-store-screenshots skill. Icon prompts and built-in generation provenance are in `icon-options/prompts.md`.

Built from AGENTS.md, TASKS.md, ios/BRIEF.md and research/market-research.md. The current request's fully free v1 and capture order take precedence over the older paid-market recommendation and older screenshot plan in the brief.
