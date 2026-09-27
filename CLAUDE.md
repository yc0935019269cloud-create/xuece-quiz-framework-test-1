# 接手本專案前請先讀

這是「刷題地牢」通用刷題庫遊戲框架（從學測地牢抽出）。**開始工作前先讀 `README.md`**（後半是開發交接）。

- 使用者用繁體中文溝通。
- 內容（題目、學習單元、科目設定）都在 `content/`；改完執行 `python tools/build.py`。`data/*.js` 是自動產生的，不要手改。
- 格式規格：`docs/格式_題庫.md`、`docs/格式_學習模式.md`；給 AI 的提示詞：`docs/prompts/`。
- 純 HTML/JS、必須能用 file:// 開；改 JS/CSS 後把 index.html 的 `?v=N` 加一。
- 在預覽測試前先備份 localStorage、測完還原。
- `assets/music/u_*.mp3` 是使用者自備商業錄音，僅限個人使用，不可發布。
