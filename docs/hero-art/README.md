# 角色美術與動畫

## 角色與動畫（2026-10-04）

- 已實裝 5 個職業各 4 男／4 女，共 40 款新造型（用魂晶購買）；職業本身仍沿用原有解鎖規則。入口：職業殿堂 → 造型，可篩選男生／女生、新造型／經典，並試播攻擊與爆擊。
- 圖片模型生成的正本：`assets/heroes/*.png`，每人 8 個獨立姿勢（待機、眨眼、4 種攻擊、爆擊蓄力、爆擊重擊），共 320 個姿勢。動畫由這些姿勢加上播放節奏、位移與職業特效組成，不是逐幀影片。
- `js/heroes.js`：造型註冊、Canvas 姿勢播放器、呼吸／眨眼、攻擊／爆擊；`js/hero-atlas.js`：自動產生的來源範圍、腳底 pivot、共同比例與鄰格遮罩資訊。PNG 正本不經程式改繪。
- 4 種攻擊使用洗牌袋隨機播放（每袋各出現一次）；`js/fx.js` 中遊俠補疾風雙射、聖女補星環祝禱、狂戰士補裂地橫掃；爆擊各有職業特效。營地、職業殿堂、地圖、戰鬥、結算及學習模式共用角色播放器。
- 價格：新造型依款式 1／2／3／4 為 160／180／200／240 魂晶，定價在 `js/heroes.js` 的 `NEW_SKIN_COST`。可免費試穿與試播；新角色預設穿經典預設款，未購買的付費造型會退回預設外觀。舊造型 ID 與已購造型保留在「經典造型」。
- 動畫展示頁：`docs/hero-art/preview.html`（可 file://）；提示詞與造型清單：`docs/hero-art/manifest.json`；來源／修正紀錄：`docs/hero-art/generation-log.json`。
- 重新分析素材：`python tools/hero_atlas.py`（需要 Pillow、NumPy，只寫 metadata，不修改 PNG）；校驗：`docs/hero-art/atlas-check.json`。
- QA 已通過 40 款購買扣款、換裝與保存、320 姿勢非空／差異、160 次普通動畫與 40 次爆擊動畫、5 職業實際答題攻擊、4 招隨機覆蓋、390px 手機版及 file:// 載入。結果：`docs/hero-art/qa-report.json`；截圖：`docs/hero-art/screenshots/`。
- QA 在獨立且用完丟棄的 Edge headless context 內執行，備份／還原該 context 的 localStorage，沒有使用使用者的瀏覽器存檔。測試工具：`tools/check_hero_animations.cjs`、`tools/check_hero_motion.cjs`（Playwright + Edge）；本機可設定 `$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'` 後執行。
- 改 JS／CSS 後需更新 index.html 與展示頁的快取版本；腳本順序為 content2 → monsters → hero-atlas → heroes → store。不要手改自動產生的 hero-atlas.js，也不要改已用於存檔的 px_<職業>_<m/f><1..4> ID。


## 40 款造型

| 職業 | 男生 4 款 | 女生 4 款 |
|---|---|---|
| 騎士 | 月白誓約、薔薇近衛、蒼海巡誓、琥珀王衛 | 晨曦女騎、紫藤劍姬、緋櫻守望、夜藍劍華 |
| 法師 | 星夜魔導、霜雪學者、翠玉術士、暮焰秘法 | 櫻莓魔女、紫晶占星、薄荷幻術、月霜魔女 |
| 遊俠 | 森境遊俠、月影獵手、白羽風行、日曜獵弓 | 花羽射手、赤狐斥候、星蘭追風、青葉林守 |
| 聖女 | 晨光祭司、白夜司祭、月華聖使、翠庭祝禱 | 月鈴聖女、玫瑰祝禱、星砂聖歌、幽蘭祭司 |
| 狂戰士 | 赤焰戰魂、冰狼戰將、雷獅戰豪、夜曜狂刃 | 薔薇戰姬、雷霆女王、霜櫻戰姬、翡翠戰嵐 |
