# Decor assets progress (AI-facing notes, English)

- Status: complete. 66 item PNGs (`assets/decor/items/`) + 8 scene PNGs (`assets/decor/scenes/`, 1536x384).
- Items were generated as 7 per-series sheets with the built-in image_gen tool, then sliced, snapped to the pixel grid, palette-quantized and upscaled x4 with binary alpha. `arc_candle` was regenerated; junk slicing and stray specks fixed.
- Player-facing Chinese names/descriptions live in `tools/decor_text.py` (the image pipeline corrupted them to "?" once via PowerShell pipes). After editing the manifest, run `python tools/decor_text.py` then `python tools/decor_data.py`.
- Checks: `python tools/check_decor_assets.py` -> `docs/decor/asset-check.json` (0 errors, 0 warnings). Review sheets: `contact-items.png`, `contact-scenes.png`, `preview-camp.png`.
- Watch: snow and island scenes have an uneven ground profile; verify item heights in the camp.

## Time-of-day variants (2026-10-30)

- Complete: 24 individual imagegen edits from the eight original references,
  plus eight unchanged copies, provide 32 named morning/day/dusk/night PNGs.
  The eight legacy paths remain intact. Prompts and processing measurements:
  `tod-generation.json`; review sheet: `contact-scenes-tod.png`.
- Camp uses its existing time value, including manual buttons and automatic
  clock changes. Shop scene cards show four labelled previews; cache is v165.
- Landmark registration and source-anchored floor cleanup were applied. Beach
  dusk/night needed 7px/6px floor corrections. Initial validation also found a
  6px autumn-night palette seam; feathering above the floor removed that seam.
- Final asset report: 0 errors, 0 warnings, maximum pairwise median floor
  displacement 0px. Browser QA: 168/168 pass at 1100px and 390px via file://.
  Text normalization, data generation and strict content check exit 0.
- The initial asset failure blocked generation; initial browser QA therefore
  saw stale data. After the one seam correction, only the failed asset/data/
  browser steps were repeated. Passing text/build checks were not repeated.
  Execution history is in `output/playwright/decor-tod-final-checks.json`.
