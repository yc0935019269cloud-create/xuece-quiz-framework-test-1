# 眼解剖（大二上）刷題包

素材：`E:\學習\大二上\眼解剖`（眼球自主神經系統（一）（二）、The structure and function of cornea）

## 資料夾內容

```
眼解剖2/
├─ README.md                    ← 本檔
├─ 00_規劃大綱.md               ← Prompt 1-A：單元／課程規劃
├─ 01_需要確認與圖片清單.md     ← 講義疑誤、推定答案、補充內容、圖片建議
└─ content/                     ← 結構和框架的 content/ 一樣，可以直接合併
   ├─ project.json              ← 專案設定（eye-anatomy-y2），兩個科目
   ├─ learn/                    ← Prompt 1-B：學習模式單元（8 單元、19 課）
   │  ├─ eye_ans/  ans-basics、ans-pathways、ans-trigeminal、ans-reflex、ans-clinical
   │  └─ cornea/   cornea-general、cornea-layers、cornea-supply
   └─ bank/                     ← Prompt 2：題庫（10 題本、161 題）
      ├─ eye_ans/  ans-basics-q(15)、ans-pathways-q(23)、ans-trigeminal-q(14)、ans-reflex-q(23)、ans-clinical-q(17)、ans-handout(1)
      └─ cornea/   cornea-general-q(12)、cornea-layers-q(30)、cornea-supply-q(18)、cornea-handout(8)
```

- `*-q` 是依學習單元自編的題目，每課至少 5 題，tags 對應學習模式 practice 的抽題關鍵字。
- `*-handout` 是講義「小試身手」的原題轉成題庫格式（Prompt 4）；詳解是另外補寫的。
- 自主神經部分另外依**上課逐字稿**補充：新增 `ans-trigeminal` 單元（三叉神經分支、視神經管、上眶裂與總腱環、長短睫狀神經），並在其他單元插入 7 張概念卡，追加 30 題。原有題目的題號沒有變動，作答紀錄不受影響。

## 怎麼放進遊戲

1. 把 `content/project.json` 覆蓋框架根目錄的 `content/project.json`（示範科目就不會出現；要保留的話把兩個科目加進原本的 subjects）。
2. 把 `content/learn/*` 和 `content/bank/*` 複製到框架的 `content/learn/`、`content/bank/`。
3. 在框架根目錄執行：

```bash
python tools/build.py
```

已用框架的 `tools/build.py --strict` 檢查過：7 個單元、9 個題本全部通過，沒有錯誤或節奏警告。
