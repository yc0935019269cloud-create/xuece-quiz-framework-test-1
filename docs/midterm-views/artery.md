# 實驗手冊總複習：動脈可辨識度審計與補圖

日期：2026-11-03。範圍：`manual` 的動脈 41 列（視網膜中央動脈原本重複一列，照保留）。
- 原先 ≤1 張：16 列；現在 ≤1 張可辨識圖：8 列。
- 將 Gray 514／877 原圖與近景合併為同一來源後，≤1 個清楚來源的列有 10 列；逐列理由見下表。近景及左右眼並非都代表新解剖角度。
- 全部 19 張既有底圖、86 個不重複圖／點已在450px逐一核對；本輪封鎖 21 對，另保留前次已封鎖的眼動脈側面圖／滑車下動脈。
- 新增6張圖（左右眼實照、Gray 513、519、514近景、877切面）；既有510、515、873、877也補上明確可見的點。
- `extra_views.json` 記錄每個既有審計點及新增點的 `mark`；細血管採箭頭、較粗血管採圈。箭頭尾端為 `from` 座標。本輪未改 JS/CSS，頁面仍使用現有圈形渲染；新樣式的400px證據是本資料夾的 `artery2-new-*` 與 `artery2-reviewed-*`，供下一位渲染工作者接手。
- 原圖鑑、原題庫與原題圖未修改。`replace:true` 僅用於使用者指定的滑車上動脈位置校訂；其他不良舊點以圖／構造配對封鎖並排除對應 qids。
- 每個 fallback 都明示「需要更好的圖；封鎖備援」，只留一張，qids不因保留圖片而恢復。

## 新圖與來源／授權

| 圖 | 來源、作者、授權 | 核對疊圖 |
|---|---|---|
| [正常左眼眼底實照（OS；圖左為鼻側）](../../img/eye-lab/extra/artery2-fundus-left.jpg) | Mikael Häggström，2012，CC0 1.0；https://commons.wikimedia.org/wiki/File:Fundus_photograph_of_normal_left_eye.jpg | [400px疊圖](artery2-new-01.png)，另有逐點版本 |
| [正常右眼眼底實照（OD；圖右為鼻側）](../../img/eye-lab/extra/artery2-fundus-right.jpg) | Mikael Häggström，2012，CC0 1.0；https://commons.wikimedia.org/wiki/File:Fundus_photograph_of_normal_right_eye.jpg | [400px疊圖](artery2-new-02.png)，另有逐點版本 |
| [頸內、頸外與椎動脈（Gray 513；右側面；圖上有原文標籤）](../../img/eye-lab/extra/artery2-gray513-neck.jpg) | Henry Vandyke Carter / Henry Gray，Gray's Anatomy 1918，公有領域；https://commons.wikimedia.org/wiki/File:Gray513.png | [400px疊圖](artery2-new-03.png)，另有逐點版本 |
| [腦底動脈展開示意（Gray 519；非新增標本角度；圖上有原文標籤）](../../img/eye-lab/extra/artery2-gray519-circle.jpg) | Henry Vandyke Carter / Henry Gray，Gray's Anatomy 1918，公有領域；https://commons.wikimedia.org/wiki/File:Gray519.png | [400px疊圖](artery2-new-04.png)，另有逐點版本 |
| [眼動脈分支上面觀近景（Gray 514；同圖放大，不算另一角度；圖上有原文標籤）](../../img/eye-lab/extra/artery2-gray514-orbit.jpg) | Henry Vandyke Carter / Henry Gray，Gray's Anatomy 1918，公有領域；https://commons.wikimedia.org/wiki/File:Gray514.png；僅裁切外圍空白 | [400px疊圖](artery2-new-05.png)，另有逐點版本 |
| [眼球血管水平切面近景（Gray 877；非另一角度；圖上有原文標籤）](../../img/eye-lab/extra/artery2-gray877-section.jpg) | Leber 據 Stöhr，Gray’s Anatomy 1918，公有領域；https://commons.wikimedia.org/wiki/File:Gray877_rotated.jpg；僅裁切外圍空白 | [400px疊圖](artery2-new-06.png)，另有逐點版本 |

## 圖號與候選排除

- Gray 778 實為上頷／下頷神經分布，不能當眼動脈圖；正確眼動脈上面觀為514。已檢視原圖再取用。
- Gray 508 已在專案，臉部／頭皮動脈；509 是唇動脈，不額外引入。513 是頸內與椎動脈，真正上頷動脈圖為已在專案的510；511是抽象分支樹，未當新增解剖圖。
- Gray 516 已有；517／518是大腦供血區而非血管實物。519保留作循環拓樸輔助，圖說明示「示意，非新增標本角度」。
- Gray 875 是眼球前半部內面，沒有清楚可圈的睫狀動脈；873血管圖與877切面更適合。876展示脈絡膜／睫狀突／虹膜血管網，沒有足夠依據把其中一線指定為完整虹膜大動脈環，因此不加推測點。
- 滑車下動脈的 Commons 精確名稱搜尋無合適點位。內瞼動脈以514的 Medial palpebral 引線與515內側瞼支交叉核對；外瞼動脈以515淚動脈與上瞼弓的外側接續支辨識，只收可見上支，不假稱上下兩支皆完整。
- 眼底點取較細／較淺的動脈，避開深色粗靜脈與交叉處；中央動脈僅指盤內可見的動脈出現處，不能從眼底照看到其神經內走行，故標 `approx:true`。
- 877的長／短後睫狀動脈依圖例1與I對照；虹膜大動脈環只見圖例2的切面交點，不能當完整環，標 `approx:true`。
- 候選圖與完整 Commons API metadata 保存於 `tmp/artery2-*`；未採用的候選不進正式 img。

## 逐列前後（清楚圖與不同來源分開計數）

| 列 | 原圖數 | 現在清楚圖數 | 清楚來源數 | 剩餘限制 |
|---|---:|---:|---:|---|
| 頸內動脈 | 12 | 12 | 11 | — |
| 眼動脈 | 3 | 4 | 3 | — |
| 視網膜中央動脈 | 4 | 7 | 6 | — |
| 視網膜中央動脈 | 4 | 7 | 6 | — |
| 顳上動脈 | 1 | 2 | 2 | — |
| 顳下動脈 | 1 | 2 | 2 | — |
| 鼻上動脈 | 1 | 2 | 2 | — |
| 鼻下動脈 | 1 | 2 | 2 | — |
| 睫狀動脈 | 1 | 3 | 3 | — |
| 睫狀後長動脈 | 1 | 3 | 2 | — |
| 睫狀後短動脈 | 2 | 4 | 3 | — |
| 睫狀前動脈 | 2 | 3 | 2 | — |
| 虹膜大動脈環 | 2 | 1 | 1 | 需要更好的圖：873舊點在睫狀肌，877舊點在睫狀突網絡，均已封鎖；只保留校訂877的圖例2切面交點（approx），仍缺完整動脈環圖。 |
| 淚動脈 | 3 | 4 | 3 | — |
| 眶上動脈 | 3 | 3 | 3 | — |
| 滑車上動脈 | 2 | 3 | 2 | — |
| 滑車下動脈 | 1 | 0 | 0 | 需要更好的圖：Commons 搜尋沒有找到可明確標示此動脈的合法圖；514 未標此血管。兩舊圖封鎖，只保留514單一明示備援，不計清楚圖，也不出題。 |
| 前篩動脈 | 1 | 2 | 1 | Gray 514 前部內壁分支清楚；新增近景仍為同圖上面觀，不能算另一角度。 |
| 後篩動脈 | 1 | 2 | 1 | Gray 514 後部內壁分支清楚；新增近景仍為同圖上面觀，不能算另一角度。 |
| 內瞼動脈 | 1 | 2 | 2 | — |
| 外瞼動脈 | 1 | 1 | 1 | Gray 515 外側接續淚動脈的上瞼支可辨認；僅此一個解剖圖。另一張無名線尾已封鎖，仍需要前側眼瞼解剖／標本圖。 |
| 上瞼動脈弓 | 1 | 1 | 1 | Gray 515 可見連續上瞼弓；514 只見起始支，不能冒充完整動脈弓。需要另一眼瞼解剖圖。 |
| 下瞼動脈弓 | 1 | 1 | 1 | Gray 515 可見下瞼弓；其他候選沒有清楚呈現連續弓，需另一眼瞼解剖圖。 |
| 肌動脈 | 1 | 1 | 1 | Gray 514 Muscular 引線所指細支可見；舊圈偏到黃色神經，已封鎖。近景仍同一圖，需另一角度。 |
| 鼻背動脈 | 3 | 3 | 3 | — |
| 前脈絡叢動脈 | 1 | 0 | 0 | 需要更好的圖：標本舊點在細小起始分支，450px不能分開辨識。單一明示備援不計清楚圖，也不出題。 |
| 大腦前動脈 | 2 | 3 | 3 | — |
| 前交通動脈 | 2 | 3 | 3 | — |
| 大腦中動脈 | 2 | 3 | 3 | — |
| 後交通動脈 | 2 | 3 | 3 | — |
| 大腦後動脈 | 2 | 3 | 3 | — |
| 威利氏環 | 2 | 2 | 2 | — |
| 基底動脈 | 7 | 4 | 4 | — |
| 椎動脈 | 3 | 5 | 5 | — |
| 頸外動脈 | 3 | 4 | 4 | — |
| 上頷動脈 | 2 | 2 | 2 | — |
| 中腦膜動脈 | 1 | 2 | 2 | — |
| 眶下動脈 | 2 | 2 | 2 | — |
| 顏面動脈 | 3 | 3 | 3 | — |
| 眼角動脈 | 2 | 1 | 1 | Gray 508 鼻側上行末段可見；515 舊點貼近角靜脈已封鎖。需要另一清楚近景。 |
| 淺顳動脈 | 4 | 3 | 3 | — |

## 每個封鎖配對及理由

| 原圖 | 構造 | 理由 |
|---|---|---|
| img/eye-anat-manual/beal_base.jpg | 前脈絡叢動脈 | 細小起始分支在450px圖中無法與鄰近血管分開辨認 |
| img/eye-anat-manual/beal_base.jpg | 威利氏環 | 舊圈落在視交叉白色組織，未指向血管環 |
| img/eye-anat-manual/oc_blood_m.jpg | 外瞼動脈 | 去字示意圖中為無名線尾，缺乏可辨識的眼瞼與動脈弓關係 |
| img/eye-anat-manual/gray514.jpg | 眶上動脈 | 舊圈落在兩條末梢分支之間的空白，改用校訂近景 |
| img/eye-anat-manual/gray514.jpg | 滑車下動脈 | Gray 514 未標示滑車下動脈，舊圈在不明顯細線附近 |
| img/eye-anat-manual/gray514.jpg | 內瞼動脈 | 舊圈在標籤引線旁的空白處，沒有圈中血管 |
| img/eye-anat-manual/gray514.jpg | 鼻背動脈 | 舊圈偏離紅色鼻背分支，改用校訂近景 |
| img/eye-lab-private/slices/j007a-blank.jpg | 頸內動脈 | 切片全圖450px時血管僅數像素且與多條引線重疊，無法辨識 |
| img/eye-lab-private/slices/j007a-blank.jpg | 基底動脈 | 切片全圖450px時血管僅數像素且與多條引線重疊，無法辨識 |
| img/eye-lab-private/slices/j007a-blank.jpg | 淺顳動脈 | 切片全圖450px時血管僅數像素且與多條引線重疊，無法辨識 |
| img/eye-anat-manual/fundus_od.jpg | 視網膜中央動脈 | 舊圈遠離視神經盤，不能標為中央動脈在盤內的位置 |
| img/eye-anat-manual/fundus_od.jpg | 顳上動脈 | 舊點落在血管旁視網膜或交叉處；400px圓圈不能可靠區別動脈與靜脈，改用左右眼校訂標記 |
| img/eye-anat-manual/fundus_od.jpg | 顳下動脈 | 舊點落在血管旁視網膜或交叉處；400px圓圈不能可靠區別動脈與靜脈，改用左右眼校訂標記 |
| img/eye-anat-manual/fundus_od.jpg | 鼻上動脈 | 舊點落在血管旁視網膜或交叉處；400px圓圈不能可靠區別動脈與靜脈，改用左右眼校訂標記 |
| img/eye-anat-manual/fundus_od.jpg | 鼻下動脈 | 舊點落在血管旁視網膜或交叉處；400px圓圈不能可靠區別動脈與靜脈，改用左右眼校訂標記 |
| img/eye-lab/extra/gray877_horizontal_vessels.jpg | 虹膜大動脈環 | 舊圈落在睫狀突網絡，未對準圖例2的動脈環切面交點 |
| img/eye-anat-manual/gray515.jpg | 顏面動脈 | 舊圈在圖下端空白處，偏離血管 |
| img/eye-anat-manual/gray515.jpg | 眼角動脈 | 舊圈在角靜脈旁，不能可靠指認較內側的眼角動脈 |
| img/eye-lab-private/slices/sg3-blank.jpg | 基底動脈 | 全身矢狀切片的圈處太小且與引線重疊，未見可辨認的動脈管腔 |
| img/eye-anat-manual/oc_blood_m.jpg | 滑車下動脈 | 未標示此分支，不能將無名細線推定為滑車下動脈 |
| img/eye-anat-manual/gray514.jpg | 肌動脈 | 舊點在黃色神經旁，未準確指向 Muscular 引線所指細分支 |
| img/eye-anat-manual/gray873.jpg | 虹膜大動脈環 | 放大核對舊點在睫狀肌灰色帶內，並非清楚的動脈環血管 |

## 完整審計索引

`artery2-decisions.json` 列出每個原有點的決定；`artery2-old-audit.json` 對應450px審計圖。下列400px覆核圖包含選定樣式與新增舊圖點，圖／點仍封鎖者會在圖例標出。

- [servier_brain_art_inf.jpg](artery2-reviewed-01.png)：8 個原有點；對照 [450px原圈](artery2-old-01.png)。
- [beal_base.jpg](artery2-reviewed-02.png)：5 個原有點；對照 [450px原圈](artery2-old-02.png)。
- [oc_blood_m.jpg](artery2-reviewed-03.png)：9 個原有點；對照 [450px原圈](artery2-old-03.png)。
- [cavsinus_m.jpg](artery2-reviewed-04.png)：1 個原有點；對照 [450px原圈](artery2-old-04.png)。
- [gray777.jpg](artery2-reviewed-05.png)：1 個原有點；對照 [450px原圈](artery2-old-05.png)。
- [gray514.jpg](artery2-reviewed-06.png)：11 個原有點；對照 [450px原圈](artery2-old-06.png)。
- [sobo679.jpg](artery2-reviewed-07.png)：3 個原有點；對照 [450px原圈](artery2-old-07.png)。
- [gray516_brain_base_arteries.jpg](artery2-reviewed-08.png)：9 個原有點；對照 [450px原圈](artery2-old-08.png)。
- [commons_superior_cervical_ganglion.jpg](artery2-reviewed-09.png)：1 個原有點；對照 [450px原圈](artery2-old-09.png)。
- [j007a-blank.jpg](artery2-reviewed-10.png)：3 個原有點；對照 [450px原圈](artery2-old-10.png)。
- [onh_diag_m.jpg](artery2-reviewed-11.png)：2 個原有點；對照 [450px原圈](artery2-old-11.png)。
- [fundus_od.jpg](artery2-reviewed-12.png)：5 個原有點；對照 [450px原圈](artery2-old-12.png)。
- [gray877_horizontal_vessels.jpg](artery2-reviewed-13.png)：3 個原有點；對照 [450px原圈](artery2-old-13.png)。
- [gray873.jpg](artery2-reviewed-14.png)：4 個原有點；對照 [450px原圈](artery2-old-14.png)。
- [gray515.jpg](artery2-reviewed-15.png)：8 個原有點；對照 [450px原圈](artery2-old-15.png)。
- [sg3-blank.jpg](artery2-reviewed-16.png)：1 個原有點；對照 [450px原圈](artery2-old-16.png)。
- [eca.jpg](artery2-reviewed-17.png)：4 個原有點；對照 [450px原圈](artery2-old-17.png)。
- [gray508_face_arteries.jpg](artery2-reviewed-18.png)：4 個原有點；對照 [450px原圈](artery2-old-18.png)。
- [gray510_maxillary_artery.jpg](artery2-reviewed-19.png)：4 個原有點；對照 [450px原圈](artery2-old-19.png)。

## 驗證與交接

- 自動檢查摘要：`artery2-verification.json`；建置與瀏覽器結果完成後記錄於該檔。
- `tools/midterm/check.cjs` 使用一次性 Edge context，測試前備份、測後還原該 context 的 localStorage。未使用使用者瀏覽器存檔。
- 未做醫學專業審稿或實機 iPad 測試；兩個封鎖備援及至多一個清楚來源的10列仍是明確缺口。
- 未修改 index.html／js／css，未執行 commit、push、reset、stash。AI-Brain 位於本輪允許寫入範圍外，本輪狀態與決策完整留於本報告，未寫入該 vault。

- 動脈資料／題池檢查：267項，0失敗；手冊題池排除31題；原題庫仍完整。
- `python tools/build.py --strict`：exit 0；使用已安裝的 Python 3.14 實體路徑（Windows 的 python 別名無法執行），記錄 `tmp/artery2-build.log`。
- `tools/midterm/check.cjs`：239項，0失敗；只執行一次；記錄 `tmp/artery2-check.log`。