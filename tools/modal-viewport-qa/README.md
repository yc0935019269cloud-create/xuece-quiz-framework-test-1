# 平板題目視窗高度與捲動檢查

使用者回報「學習模式 → 知識筆記」的相關題視窗在 iPad 顯示異常：上方標題／關閉鍵被捲走，底部露出後方清單。使用截圖同一題 `physopt-exam-u5-107-sp-49` 重現舊版問題：外層捲動 115px 後，標題 top = −65px、關閉鍵 top = −73px，後方頁面未鎖定。

`QV.previewModal` 現在使用 `U.modal({contained:true})`：標題與關閉鍵在固定的 header，只有 modal-scroll 內容區捲動；外層覆蓋可見視窗並禁止捲動。以 VisualViewport 的 height／width／offset 配合工具列、鍵盤與轉向變化；沒有 API 時用 innerHeight／innerWidth。相關說明：[MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport)、[WebKit 動態視窗單位](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/)。

背景用固定 body 保存原捲動位置和原 inline styles，關閉後還原；巢狀 contained modal 共用計數，重複關閉不重複釋放。`App.go` 改用 `U.clearModals()` 先清理閱讀視窗，再切頁；外部直接移除視窗也會由 observer 清理。普通 modal 不啟用 contained，維持原捲動樣式。

先啟動 `python tools/audio-qa/serve.py`（127.0.0.1:8977）：

```powershell
npx --yes --package @playwright/cli playwright-cli -s=modal-viewport-ipad open --browser msedge --device 'iPad (gen 7)'
npx --yes --package @playwright/cli playwright-cli -s=modal-viewport-ipad run-code --filename tools/formulas-qa/setup.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=modal-viewport-ipad snapshot '#learnBody' --raw
npx --yes --package @playwright/cli playwright-cli -s=modal-viewport-ipad run-code --filename tools/modal-viewport-qa/check.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=modal-viewport-ipad close
```

桌機換另一 session 名稱並省略 device。測試使用一次性 context，setup 載入前備份 localStorage，check finally 還原，不使用使用者 profile。完成後停止自己啟動的伺服器。

每個 context 25 項：從長清單開截圖同一題、標題／關閉鍵在內容中段與底部仍可見、可讀到詳解最後、背景鎖定、橫直轉向、390px、關閉還原清單位置／原樣式、可見視窗收縮與偏移、巢狀／重複關閉、Esc、切頁、外部移除、普通視窗與 JS 錯誤。工具列／鍵盤採 EventTarget fixture 模擬 VisualViewport，最後還原 API；轉向測試等待 resize 事件穩定再核對尺寸。

另重跑原相關題 UI 檢查的 iPad 路徑 73 項，20 組連結、343 題來源、閱讀不改紀錄均通過。結果及截圖為 `output/playwright/modal-viewport-*`。此輪是 HTTP／Edge iPad 路徑模擬，沒有實機 iPadOS／Safari 或本輪 file:// 測試；勿把視窗 fixture 當成真實 iPadOS 驗證。
