# 角色與造型擴充交接（2026-10-24）

## 範圍

新增影刃 `assassin`、武僧 `monk`、吟遊詩人 `bard` 三職業，各男／女 8 款；原五職業各追加男／女 4 款（索引 5～8）。新增 88 張八姿勢圖集，整體共 128 款／1,024 姿勢。所有 PNG 使用內建 image_gen 生成，正本不經程式改繪。

新職業的 `m1` 與 `f1` 免費，解鎖職業後預設穿 `m1`；切換女生第一款不需魂晶。職業本身各需要 140／150／160 魂晶解鎖。舊職業、舊造型 ID、舊價格與薔薇近衛免費預設不變。

## 檔案與產製流程

- `docs/hero-art/expansion-old-actors.json`／`expansion-new-actors.json`：本次 88 款設計、名稱、ID、每款完整提示詞；`src` 為專案相對位置。
- `assets/heroes/<職業>_<m/f><1..8>.png`：透明八姿勢原圖。不要用換色或複製其他造型補缺。
- `tools/sync_hero_expansion.py`：素材齊全後合併 manifest 與 heroes.js 的 ACTORS，缺圖即失敗。可重跑；不修改 PNG。
- `python tools/hero_atlas.py`：以原圖透明區重新計算來源範圍／腳底 pivot，只產生 metadata。analyze 可供其他工具匯入，匯入時不再寫檔。
- `python tools/check_hero_expansion_assets.py`：檢查本次 88 張原圖的透明區、八個分離姿勢與重複圖；未完成時列 missing。
- `js/heroes.js`：價格表擴至八款，註冊新職業衣櫃。新職業男女第一款免費。
- `js/store.js`：新職業預設造型；不清除／遷移玩家既有穿著。
- `js/screens.js`：造型計數／性別篩選使用實際清單，券只列付費圖集造型。
- `js/content.js`／`run.js`／`fx.js`／`learn.js`：新職業能力、技能與四招／爆擊。

## 機制

- 影刃：滿血敵人首擊 +35%／額外閃避，低血敵人追獵暴擊；學習必殺技「千影斷空」。
- 武僧：每三連擊護盾，上限不壓低其他技能給予的盾；學習模式以一次格擋表達；必殺技「真氣・破山」。
- 吟遊詩人：對目前敵人每四題答對觸發增傷與治療；學習模式用心數回復；必殺技「星海安可曲」。
- 遠征的完整技能仍使用既有等級／冷卻機制；學習模式沿用原本的一個能量必殺技介面。

## 驗證指令

```powershell
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/check_new_classes.cjs
python tools/check_hero_expansion_assets.py
python tools/sync_hero_expansion.py
python tools/hero_atlas.py
# 啟動 localhost:8965 靜態伺服器後：
node tools/check_hero_expansion.cjs
node tools/check_hero_expansion_motion.cjs
node tools/check_hero_expansion_routes.cjs
node tools/check_hero_gallery.cjs
python tools/build.py --check --strict
```

瀏覽器測試使用獨立 Edge context，先備份 localStorage、最後還原。圖片產製中不可把缺圖數為零之前的報告當成全數完成。歷史工具 `check_hero_animations.cjs`／`check_hero_motion.cjs` 的 40 款固定斷言只適用於原先版本，本次使用名稱帶 expansion 的工具。

## 完成狀態

**全部完成，快取 v149。** 88 張新圖集與總共 128 張 atlas 均通過八姿勢／透明／分離檢查；原本 40 張 PNG Git blob 不變。交付摘要 `docs/hero-art/expansion-qa-summary.json`。

- 19 項職業機制，128 款購買／換裝保存，1,024 姿勢非空／差異／邊界，8 職業實際答題流程，512 次普通動畫＋128 次爆擊均通過。
- 154 項新職業路線檢查在 1000／390px 通過：解鎖扣款、男女免費預設、實際首戰後回深淵地圖、學習檢核與必殺技、付費造型兌換／防重複、匯出匯入及 reload。兩個 context 均驗證 localStorage 完整還原。
- 展示頁 8 職業各 6 種攻擊控制、1280／390px 通過。全 32 支遊戲 JS 語法、`build.py --check --strict` 通過。
- Edge 的 file:// 來源規則禁止讀回圖集畫布像素，屬測試邊界而非播放故障；像素／姿勢在 HTTP 驗證，file:// 則測 UI、原圖成功載入、pose 狀態及截圖。未做實機 iPad 或真實雲端帳號往返。
- 圖片快取最多保留最近 24 張，再加上畫面內與正在出招的角色；靜態姿勢與播放均保留 2px 安全邊界。
- `python tools/sync_hero_expansion.py --allow-missing` 僅供產製途中先準備 registry，正式完成檢查不能帶此旗標。
