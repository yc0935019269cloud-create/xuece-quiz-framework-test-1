# 大一下視光學59堂正課QA

```powershell
python tools/build.py --strict
python tools/learn-redo/s114_course_audit.py
$env:NODE_PATH='E:\NEWTEST\skull-atlas-3d\node_modules'
node tools/s114-course-qa/check.cjs
```

以`s114-course-progress.json`列的精確課ID為範圍，不測99名詞與已完成九堂總複習。`check.cjs`每課重載測試進度後實際跳頁，核對頁碼、類型、內容、溢出、判分、範例與實戰。自評題另計，不作自動語意判分。

5個互動按不同控制項測試：光斑3狀態；瞳孔路徑5階段；Prentice、K、正視近點三個計算器各測滑桿最小／最大與重設。

每課通過後寫驗證寬度進JSON與Session Note；已改寫不能當已驗證。重跑有更動的課後要重測，不沿用舊通過狀態。

輸出`output/playwright/s114-course-{audit,qa}.json`與抽樣截圖。已通過版本的可攜報告在`docs/s114-course-readability/`。獨立Edge context備份／還原localStorage；file://，非實機iPad或真人理解測試。
