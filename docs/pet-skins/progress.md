# Pet skins (AI-facing notes, English)

- Status: complete. 45 drawn skins (9 pets x 5 themes: strawberry, bee, sailor, cloud, moon), 6 frames each (idle0, idle1, blink, happy, sleep, surprise).
- Art: Codex image_gen drew one sheet per skin (a row of 6 poses) into `draft-sheets/` (about 53 MB, git-ignored, kept locally). Claude wrote `tools/pet-skins/make.py`: cuts the 6 cells at the emptiest column near each expected boundary (cells sometimes touch), scales so the idle pose is 50 of 60 logical px, one 40-colour palette per skin, binary alpha, keeps only connected pieces >= 6% of the largest (removes neighbour slivers and stray marks), bottom-aligned and centred, x4 nearest.
- Integration: `js/pet-skins-data.js` (generated) appends to `C.PET_SKINS`; `PetArt.url` returns frame paths for `{img}` skins; `Store.petHTML` drops accessories for drawn skins; fitting room shows a separate drawn-skin row with per-skin prices and an accessory note; camp photo maps drawn skins too.
- Prices 80/90/100/110/120 by theme; rationale in `docs/寵物造型.md`.
- QA: `tools/pet-skins-qa/check.cjs` 24/24 (all 270 frames load, buy/wear, camp/battle/learn markup, frame swapping, accessory handling, old saves, 390 px no horizontal scroll, no page errors).
