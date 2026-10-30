# Decor assets progress (AI-facing notes, English)

- Status: complete. 66 item PNGs (`assets/decor/items/`) + 8 scene PNGs (`assets/decor/scenes/`, 1536x384).
- Items were generated as 7 per-series sheets with the built-in image_gen tool, then sliced, snapped to the pixel grid, palette-quantized and upscaled x4 with binary alpha. `arc_candle` was regenerated; junk slicing and stray specks fixed.
- Player-facing Chinese names/descriptions live in `tools/decor_text.py` (the image pipeline corrupted them to "?" once via PowerShell pipes). After editing the manifest, run `python tools/decor_text.py` then `python tools/decor_data.py`.
- Checks: `python tools/check_decor_assets.py` -> `docs/decor/asset-check.json` (0 errors, 0 warnings). Review sheets: `contact-items.png`, `contact-scenes.png`, `preview-camp.png`.
- Watch: snow and island scenes have an uneven ground profile; verify item heights in the camp.
