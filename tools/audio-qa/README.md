# 音訊回歸檢查

以 Playwright CLI 在獨立、用完即關閉的 context 測試；setup 備份該 context 的 localStorage，各 check 的 finally 靜音並還原，不使用使用者瀏覽器設定檔。

在專案根目錄執行 `python tools/audio-qa/serve.py`（僅 127.0.0.1:8977，高併發、安靜的本機伺服器）。另一個終端機執行：

```powershell
npx --yes --package @playwright/cli playwright-cli -s=audio-qa open --browser msedge --device 'iPad (gen 7)'
npx --yes --package @playwright/cli playwright-cli -s=audio-qa run-code --filename tools/audio-qa/setup.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=audio-qa snapshot '#topbar' --raw
npx --yes --package @playwright/cli playwright-cli -s=audio-qa run-code --filename tools/audio-qa/check-ios.cjs --raw
npx --yes --package @playwright/cli playwright-cli -s=audio-qa close
```

- iPhone：改成 `--device 'iPhone 13'`，其餘相同。
- 桌機：省略 `--device`，改執行 `check-desktop.cjs`。它會注入下一段 play 拒絕及延遲，確認上一段仍在播放、過期淡出不會暫停新播放器。
- iOS 解碼失敗：先以 iOS device 執行 setup，再執行 `check-fallback.cjs`；它只針對目前 fire.mp3 的 byteLength 模擬 decodeAudioData 失敗，檔案若更換須調整 fixture，其他環境音仍使用真實解碼。
- 合併原生觸覺開關後的題庫相容性：以 iOS device 執行 setup，接著執行 `check-ios.cjs` 與 `check-bank.cjs`；檢查開關覆蓋層點擊、詳解收合、練習只記一次、上游打擊音效與學習畫面。
- 關閉測試 context 後，停止自己啟動的本機伺服器。不要用 close-all 或使用使用者的既有瀏覽器 profile。

這是 **Chromium 真實 Web Audio＋iOS 程式路徑模擬**，不是 iPadOS／iPhone 實機或實際聆聽驗證。Windows Playwright WebKit 沒有 AudioContext；不能據此聲稱 Safari 音訊已通過。

相關規格／瀏覽器問題：

- [W3C Audio Session](https://www.w3.org/TR/audio-session/)：playback 類型。
- [WebKit 276016](https://bugs.webkit.org/show_bug.cgi?id=276016)：iOS 音訊中斷後 suspend／resume 的回報。
- [WebKit 281566](https://bugs.webkit.org/show_bug.cgi?id=281566)：resume Promise 可能一直 pending。
- [WebKit 258864](https://bugs.webkit.org/show_bug.cgi?id=258864)：輸出裝置切換時失真／速度異常的回報；不是已確認本次使用者的根因。
