# Camp scene time variants

Each of the eight image scenes has morning, day, dusk and night files in its
manifest `tod` map. Existing unsuffixed PNGs remain unchanged. Existing art is
the day version except the library, crystal cave and observatory (night).
The default shop thumbnail is day, except the observatory (night).

The 24 missing versions were individually edited with the built-in imagegen
tool, using the corresponding original panorama as the edit target. Exact
prompts, generated source paths and processing measurements are recorded in
`tod-generation.json`. No new time boundaries are defined: the hub passes its
existing `timeOfDay()` value to `DECOR.sceneFor(tod)`. Its existing camp timer
also refreshes the hub when that same value changes while the camp stays open.

`tools/decor_tod.py` crops generator padding, registers stable landmarks to the
original, pins the original floor geometry with the generated lighting palette,
snaps to 512x128, quantizes to 128 colours and scales 3x with nearest neighbour.
The final files are opaque RGB. This retains the original furniture surface,
including the irregular snow and grass edges. Originals are never overwritten.
The contact sheet is `contact-scenes-tod.png` (eight rows, four labelled columns).

`tools/decor_scene_assets.py` is shared by `decor_data.py` and
`check_decor_assets.py`. It checks all paths, dimensions, opacity, 3x pixel grid
and palette, then compares measured floor edges in 48 column bands. Every pair
of times, and every time against the untouched original, must have median
absolute displacement at most 3px. Measurements go in `asset-check.json`.

Image scenes with `tod` use `data-night="tod"`, bypassing image dim filters.
Placed objects receive a slight dusk/night brightness adjustment. Classic
grassland keeps the original CSS treatment. The shop scenes tab has a labelled
four-image strip, using lazy-loaded images and a responsive four-column grid.

Final checks are run once after asset processing and implementation:

1. `python tools/check_decor_assets.py`
2. `python tools/decor_text.py` then `python tools/decor_data.py`
3. `NODE_PATH=E:\NEWTEST\skull-atlas-3d\node_modules node tools/decor-qa/check.cjs`
4. `python tools/build.py --check --strict`

Browser QA uses isolated Edge contexts via file://, backs up their localStorage
and restores it before closing. It checks every scene/time button, image loading,
absence of scene filters, four labelled shop previews and 390px overflow.

Run result (2026-10-30): assets 0 errors/0 warnings, maximum median floor
displacement 0px; browser 168/168 pass; text/data/strict build exit 0. One
autumn-night palette seam required correction after initial validation. Only
failed asset/data/browser steps were repeated; passing checks were retained.
See `output/playwright/decor-tod-final-checks.json` for the complete history.
