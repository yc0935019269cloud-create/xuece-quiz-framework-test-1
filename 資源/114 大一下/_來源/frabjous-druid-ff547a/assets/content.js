window.OPTOMETRY_CONTENT = {
  "course": {
    "title": "視光學期末考互動總複習",
    "subtitle": "把完整考點拆成可以一步一步理解的小課程：先懂白話、再看圖、接著走完整機轉，最後用考點與題目確認。",
    "sourceRoot": "E:\\學習\\視光學\\期末考\\單元"
  },
  "units": [
    {
      "id": "pd-lensometry",
      "code": "04",
      "shortTitle": "瞳距與焦度計",
      "title": "瞳距測量與焦度計",
      "file": "pd-lensometry.html",
      "status": "active",
      "summary": "會用焦度計測單焦、多焦與散光鏡片，理解稜鏡方向、MRP/OC、DBOC 與 Prentice's rule 的考法。",
      "sources": [
        "04 瞳距測量與焦度計：棱鏡與普倫提斯法則.pdf",
        "逐字稿 - 04 瞳距測量與焦度計：鏡片測量、稜鏡與普倫提斯法則.docx"
      ],
      "sections": [
        {
          "id": "lensometer-structure",
          "title": "焦度計 Lensometer：儀器、歸零與鏡片測量",
          "summary": "焦度計用望遠鏡系統觀察 reticle 與 movable target，藉由移動視標恢復清晰來讀出鏡片後頂點或前頂點度數。",
          "points": [
            {
              "title": "焦度計可以測什麼",
              "text": "單焦鏡片測後頂點度數；多焦鏡片近用區測前頂點度數。焦度計也能找光學中心、測柱鏡/軸度、測稜鏡量與標記 MRP。",
              "bullets": [
                "single vision 多測 back vertex power",
                "multifocal/PAL 近用區翻面測 front vertex power",
                "OC/MRP 標記會影響配鏡定位與誘發稜鏡"
              ],
              "visualPlan": "畫焦度計簡化剖面：窺孔、目鏡、reticle、movable target、standard lens、lens stop、鏡片夾；用滑桿演示 target 前後移動直到清晰。",
              "drill": {
                "question": "焦度計在單焦鏡片最主要測到的是什麼？",
                "choices": [
                  "後頂點度數 back vertex power",
                  "眼軸長度 axial length",
                  "角膜曲率半徑",
                  "前房深度"
                ],
                "answer": 0,
                "explain": "逐字稿強調單焦鏡片通常背面靠 lens stop，因此讀的是後頂點度數。"
              },
              "simple": "焦度計就是鏡片的讀值機：它不只讀球面度數，也能找散光、軸度、光心、稜鏡與多焦近用加入度。",
              "memory": "焦度計五件事：S、C、axis、OC/MRP、prism/ADD。",
              "examFocus": [
                "single vision 多測 back vertex power",
                "multifocal/PAL 近用區翻面測 front vertex power",
                "OC/MRP 標記會影響配鏡定位與誘發稜鏡"
              ]
            },
            {
              "title": "Keplerian telescope 造成影像反向",
              "text": "焦度計望遠鏡常是 Keplerian telescope，物鏡與目鏡都是凸透鏡，因此觀察到的 target 移動方向會與實際鏡片移動方向相反。",
              "bullets": [
                "Galilean telescope：影像正立、較輕、低放大",
                "Keplerian telescope：影像倒立、視野較大、可看遠",
                "驗度儀內看到往上移，影像可能往下"
              ],
              "visualPlan": "兩欄比較 Galilean/Keplerian 光線圖；焦度計欄加一個上下拖曳鏡片，target 反向移動的動畫。",
              "drill": {
                "question": "為什麼焦度計中移動鏡片時視標方向常看起來反過來？",
                "choices": [
                  "因為鏡片夾造成機械誤差",
                  "因為 Keplerian telescope 形成倒立影像",
                  "因為稜鏡基底方向相反",
                  "因為 reticle 沒有歸零"
                ],
                "answer": 1,
                "explain": "Keplerian telescope 的成像倒立，這是逐字稿特別提醒的觀念。"
              },
              "simple": "Keplerian telescope 會形成倒立影像，所以你移動鏡片時，看到的 target 方向可能和實際移動相反。",
              "memory": "K = 兩凸透鏡 = 倒像；看到反向先想到 Keplerian。",
              "examFocus": [
                "Galilean telescope：影像正立、較輕、低放大",
                "Keplerian telescope：影像倒立、視野較大、可看遠",
                "驗度儀內看到往上移，影像可能往下"
              ]
            },
            {
              "title": "使用前一定要歸零與調 reticle",
              "text": "測量前先把 power wheel 歸零，調整目鏡讓 reticle 清楚。無鏡片時 movable target 在 standard lens focal length；放入未知鏡片後 target 變模糊，再轉度數輪使它清楚。",
              "bullets": [
                "先清楚 reticle，再清楚 movable target",
                "未知鏡片讓目標失焦",
                "恢復清晰的位置對應鏡片度數"
              ],
              "visualPlan": "做三步動畫：歸零 reticle 清楚、放鏡片 target 模糊、旋轉 power wheel target 清晰並跳出度數讀值。",
              "drill": {
                "question": "焦度計測量前的正確第一步是？",
                "choices": [
                  "先找柱鏡軸位",
                  "先把鏡片翻面",
                  "先歸零並調清楚 reticle",
                  "先量 DBOC"
                ],
                "answer": 2,
                "explain": "若 reticle 沒清楚，後面 target 是否清晰會判斷錯。"
              },
              "simple": "歸零是在建立測量基準：先讓 reticle 清楚，再放鏡片找 target 清楚的位置。",
              "memory": "先清 reticle，再清 target；基準錯，讀值全錯。",
              "examFocus": [
                "先清楚 reticle，再清楚 movable target",
                "未知鏡片讓目標失焦",
                "恢復清晰的位置對應鏡片度數"
              ]
            }
          ],
          "studyPath": [
            "先認 lensometer 內部光路。",
            "再看 reticle 與 movable target 誰先清楚。",
            "最後把清楚位置連到鏡片讀值。"
          ]
        },
        {
          "id": "single-cylinder",
          "title": "單焦與散光鏡片測量",
          "summary": "球面鏡片兩軸同時清楚；散光鏡片要分別找兩主經線，短軸讀比較正的度數，長軸讀比較負的度數。",
          "points": [
            {
              "title": "球面鏡片：兩方向同時清楚",
              "text": "若 movable target 的長短線與中央點圈同時清楚，代表鏡片沒有柱鏡成分，直接讀 sphere power。",
              "bullets": [
                "兩主經線同時成焦",
                "沒有散光時不需要轉 axis wheel",
                "讀值可直接作為球面度數"
              ],
              "visualPlan": "空白舞台放 lensometer reticle，Claude 加一組 target 由模糊到整體清楚；旁邊顯示 sphere reading。",
              "drill": {
                "question": "焦度計中長短線與中央點同時清楚，最可能代表？",
                "choices": [
                  "鏡片含斜散",
                  "鏡片為球面度數",
                  "鏡片必有稜鏡",
                  "鏡片是 PAL 近用區"
                ],
                "answer": 1,
                "explain": "散光會造成兩主經線分開成焦；同時清楚通常是球面鏡片。"
              },
              "simple": "球面鏡片每個方向屈光力相同，所以焦度計 target 的長短線會一起清楚。",
              "memory": "兩線同清楚 = sphere；不用急著轉 axis。",
              "examFocus": [
                "兩主經線同時成焦",
                "沒有散光時不需要轉 axis wheel",
                "讀值可直接作為球面度數"
              ]
            },
            {
              "title": "散光鏡片：先找兩主經線",
              "text": "含散光鏡片會出現一組線清楚、一組線模糊。轉 axis wheel 讓暈開方向與 target 線對齊，再分別讀兩條主經線度數。",
              "bullets": [
                "兩主經線相差 90 度",
                "先對齊 axis，再讀 power",
                "不要把焦度計 target 當成光十字直接套用"
              ],
              "visualPlan": "做一個可旋轉 target：拖曳 axis knob 時模糊暈線逐漸與 reticle 對齊；對齊後才開放讀數。",
              "drill": {
                "question": "測散光鏡片時，為什麼不能直接把焦度計視標當光十字？",
                "choices": [
                  "因為視標沒有任何軸向資訊",
                  "因為會把長短軸與度數/軸位對應搞反",
                  "因為焦度計只能測球面鏡片",
                  "因為焦度計沒有 reticle"
                ],
                "answer": 1,
                "explain": "逐字稿特別提醒：長短軸與讀值有固定對應，直接當光十字會寫錯處方。"
              },
              "simple": "散光鏡片有兩個互相垂直的主方向，測量時要先對齊軸向，再分別讀兩個方向的度數。",
              "memory": "散光三步：對 axis、讀兩線、相減成 cylinder。",
              "examFocus": [
                "兩主經線相差 90 度",
                "先對齊 axis，再讀 power",
                "不要把焦度計 target 當成光十字直接套用"
              ]
            },
            {
              "title": "短軸對比較正，長軸對比較負",
              "text": "負柱鏡記錄時，短軸通常對到比較正的讀值，長軸對到比較負的讀值；兩者差值為 cylinder power，長軸所在刻度作為 axis。",
              "bullets": [
                "比較正者作 sphere",
                "比較負與比較正的差為負柱鏡量",
                "axis 看長線落在哪個刻度或 axis wheel"
              ],
              "visualPlan": "做讀值練習卡：短軸 -1.75、長軸 -3.00、長軸 147 度，自動組成 -1.75 -1.25 x147。",
              "drill": {
                "question": "若短軸清楚時讀 -1.75D，長軸清楚時讀 -3.00D，負柱鏡表示為？",
                "choices": [
                  "-3.00 -1.25 x 短軸",
                  "-1.75 -1.25 x 長軸",
                  "-1.75 +1.25 x 長軸",
                  "-3.00 +1.25 x 短軸"
                ],
                "answer": 1,
                "explain": "比較正的 -1.75 作 sphere；差值 1.25D；負柱鏡軸位看長軸方向。"
              },
              "simple": "負柱鏡寫法中，比較正的讀值當 sphere，比較負的讀值和它相減得到 cylinder，axis 看長軸方向。",
              "memory": "短正、長負；長軸給負柱鏡 axis。",
              "examFocus": [
                "比較正者作 sphere",
                "比較負與比較正的差為負柱鏡量",
                "axis 看長線落在哪個刻度或 axis wheel"
              ]
            }
          ],
          "studyPath": [
            "先分球面與散光的成焦差異。",
            "再找兩條主經線。",
            "最後把比較正/比較負轉成負柱鏡處方。"
          ]
        },
        {
          "id": "multifocal-prism",
          "title": "多焦鏡片、稜鏡與 MRP",
          "summary": "多焦鏡片要確認遠/近用區與 ADD；稜鏡測量重點在 base direction、MRP 位置與 lensometer target 在 reticle 上的偏移。",
          "points": [
            {
              "title": "多焦鏡片近用區要翻面測",
              "text": "PAL、bifocal、trifocal 的遠用區像單焦測後頂點；近用區要翻面讓前表面靠 lens stop，測 front vertex power，再確認 ADD 與定位。",
              "bullets": [
                "遠用區：背面靠 lens stop",
                "近用區：前表面靠 lens stop",
                "送工廠需單眼 PD，尤其 PAL 定位"
              ],
              "visualPlan": "做鏡片翻面動畫：遠用區測量、翻面、近用區測量，並在 PAL 貼紙上標出 fitting cross/near zone。",
              "drill": {
                "question": "多焦鏡片測近用區時，為什麼要翻面？",
                "choices": [
                  "因為要測前頂點度數",
                  "因為要避免稜鏡效應",
                  "因為近用區沒有 ADD",
                  "因為 reticle 會倒立"
                ],
                "answer": 0,
                "explain": "逐字稿明確說近距離區域測前頂點度數，所以鏡片方向要翻過來。"
              },
              "simple": "多焦近用區重視前頂點度數，所以要翻面讓前表面靠 lens stop 才能正確讀 ADD。",
              "memory": "遠用像單焦，近用要翻面；PAL 記得 fitting cross。",
              "examFocus": [
                "遠用區：背面靠 lens stop",
                "近用區：前表面靠 lens stop",
                "送工廠需單眼 PD，尤其 PAL 定位"
              ]
            },
            {
              "title": "稜鏡讓影像往 apex、物體看似往 base",
              "text": "稜鏡改變光線方向，可處理 binocular vision 問題、移動/擴大視野，也可 prism thinning。處方可用 BI/BO/BU/BD 或斜稜鏡組合表示。",
              "bullets": [
                "水平：base in / base out",
                "垂直：base up / base down",
                "斜稜鏡 = 水平 + 垂直分量"
              ],
              "visualPlan": "做 prism 三角形動畫：入射光折向 base、觀察者看到影像偏向 apex；切換 BI/BO/BU/BD 顯示 OD/OS 差異。",
              "drill": {
                "question": "稜鏡處方中的 BO 代表什麼？",
                "choices": [
                  "base down",
                  "base out",
                  "base over",
                  "base oblique"
                ],
                "answer": 1,
                "explain": "BO 是 base out，屬於水平稜鏡方向。"
              },
              "simple": "稜鏡讓光線折向 base，但觀察者會覺得影像往 apex 方向跑，這就是 BI/BO/BU/BD 判斷的核心。",
              "memory": "光向 base，像向 apex；處方看 base direction。",
              "examFocus": [
                "水平：base in / base out",
                "垂直：base up / base down",
                "斜稜鏡 = 水平 + 垂直分量"
              ]
            },
            {
              "title": "MRP 不等於 OC 時會產生稜鏡效果",
              "text": "配鏡或驗證稜鏡時，lensometer movable target 偏離 reticle 中心。若兩鏡片的 DBOC 與病人 PD 不一致，會因去中心產生 Prentice prism。",
              "bullets": [
                "MRP 是 prescribed prism 的參考點",
                "OC 是無稜鏡的光學中心",
                "DBOC 不等於 PD 會誘發棱鏡"
              ],
              "visualPlan": "畫一副眼鏡：雙眼瞳孔、OC、MRP、DBOC、PD；拖動 OC 時即時計算誘發 BI/BO。",
              "drill": {
                "question": "當 DBOC 不等於病人遠用 PD 時，最直接的臨床後果是？",
                "choices": [
                  "角膜 K 值改變",
                  "誘發稜鏡效果",
                  "瞳孔無直接反應",
                  "焦度計不能歸零"
                ],
                "answer": 1,
                "explain": "投影片標示 DBOC ≠ PD 會產生 prism effect。"
              },
              "simple": "眼睛沒有通過鏡片光心時，就等於透過一個稜鏡在看，所以 PD、DBOC、OC/MRP 必須對齊。",
              "memory": "OC 是無稜鏡點，MRP 是處方稜鏡點；不重合就要算。",
              "examFocus": [
                "MRP 是 prescribed prism 的參考點",
                "OC 是無稜鏡的光學中心",
                "DBOC 不等於 PD 會誘發棱鏡"
              ]
            }
          ],
          "studyPath": [
            "先分遠用與近用測量方向。",
            "再理解 prism base/apex 與影像位移。",
            "最後對齊 MRP、OC、PD，避免誘發稜鏡。"
          ]
        },
        {
          "id": "prentice",
          "title": "Prentice's rule 與計算題",
          "summary": "P = dF；d 用公分，F 用 D。考題重點是左右眼、正負鏡片、去中心方向與 BI/BO/BU/BD 的判斷。",
          "points": [
            {
              "title": "公式：P = d × F",
              "text": "P 是稜鏡度 prism diopter；d 是光學中心到視線/MRP 的距離，單位必須是 cm；F 是鏡片度數的絕對量。",
              "formula": "P(Δ) = d(cm) × F(D)",
              "bullets": [
                "mm 要先除以 10 變 cm",
                "左右眼各自算，不要直接用雙眼差",
                "高度數與大去中心會快速增加稜鏡量"
              ],
              "visualPlan": "做 Prentice 計算器：輸入 PD、DBOC、Rx，自動顯示每眼 d、P 與 BI/BO。",
              "drill": {
                "question": "Rx = -4.00DS OU，PD = 62 mm，DBOC = 72 mm，兩眼各誘發多少稜鏡？",
                "choices": [
                  "1Δ BI each",
                  "2Δ BI each",
                  "2Δ BO each",
                  "4Δ BI each"
                ],
                "answer": 1,
                "explain": "DBOC 比 PD 大 10 mm，單眼差 5 mm = 0.5 cm；0.5×4=2Δ。負鏡外移相當 BI。"
              },
              "simple": "Prentice's rule 說明去中心越多、鏡片度數越高，誘發稜鏡越大；d 一定要用公分。",
              "memory": "P = dF；mm 先除 10，每眼分開算。",
              "examFocus": [
                "mm 要先除以 10 變 cm",
                "左右眼各自算，不要直接用雙眼差",
                "高度數與大去中心會快速增加稜鏡量"
              ]
            },
            {
              "title": "水平與垂直稜鏡的加減規則",
              "text": "投影片整理：水平稜鏡同方向相加、相反方向相減；垂直稜鏡相反方向相加、同方向相減。判斷時先分 OD/OS，再分 H/V。",
              "bullets": [
                "H prism：same direction add",
                "V prism：opposite direction add",
                "斜稜鏡要拆成水平與垂直分量"
              ],
              "visualPlan": "做 OD/OS 稜鏡方向矩陣，按下 BI/BO/BU/BD 會亮起 add/subtract 的規則。",
              "drill": {
                "question": "兩眼水平稜鏡都是 BO，總水平稜鏡效果如何處理？",
                "choices": [
                  "相減",
                  "忽略",
                  "相加",
                  "只看 OD"
                ],
                "answer": 2,
                "explain": "水平稜鏡 same direction add。"
              },
              "simple": "兩眼稜鏡不能只看數字，要先分水平和垂直；方向關係不同，加減規則也不同。",
              "memory": "水平同向加、反向減；垂直反向加、同向減。",
              "examFocus": [
                "H prism：same direction add",
                "V prism：opposite direction add",
                "斜稜鏡要拆成水平與垂直分量"
              ]
            },
            {
              "title": "焦度計測稜鏡：target 偏到幾圈就是幾 Δ",
              "text": "1 m 處 1 cm 偏移 = 1Δ。lensometer reticle 上若 target 中心位於 2 ring 上方，表示 2Δ BU；BO 例子中 OD/OS target 會在相反側。",
              "bullets": [
                "垂直 2Δ BU：target 在中心上方 2 ring",
                "OU 1.5Δ BO：OD 與 OS target 偏向相對側",
                "標記 MRP 後確認瞳孔是否對上"
              ],
              "visualPlan": "做 reticle 同心圓互動：選 BU/BD/BI/BO 與 OD/OS，target 移到正確 ring；學生可拖 target 作答。",
              "drill": {
                "question": "右眼處方 2Δ BU 時，焦度計 movable target 應位於 reticle 中心的哪裡？",
                "choices": [
                  "左方 2 ring",
                  "右方 2 ring",
                  "上方 2 ring",
                  "下方 2 ring"
                ],
                "answer": 2,
                "explain": "投影片例子明確示範 2Δ Base Up 時 target 在中心上方 2 ring。"
              },
              "simple": "焦度計 reticle 像稜鏡座標紙，target 偏離中心幾圈，就代表幾個 prism diopter 的偏移。",
              "memory": "target 離中心幾 ring = 幾 Δ；先分 OD/OS 再判方向。",
              "examFocus": [
                "垂直 2Δ BU：target 在中心上方 2 ring",
                "OU 1.5Δ BO：OD 與 OS target 偏向相對側",
                "標記 MRP 後確認瞳孔是否對上"
              ]
            }
          ],
          "studyPath": [
            "先背 P = dF。",
            "再確認 d 用 cm、左右眼分開。",
            "最後判斷 BI/BO/BU/BD 與水平垂直加減。"
          ]
        }
      ],
      "quiz": [
        {
          "question": "焦度計測量 PAL 近用區時通常要測哪一種頂點度數？",
          "choices": [
            "front vertex power",
            "back vertex power",
            "axial power",
            "corneal power"
          ],
          "answer": 0,
          "explain": "近用區翻面測前頂點度數。"
        },
        {
          "question": "Prentice's rule 中 d 的單位是？",
          "choices": [
            "mm",
            "cm",
            "m",
            "degree"
          ],
          "answer": 1,
          "explain": "d 必須用 cm。"
        },
        {
          "question": "焦度計散光測量中，長軸通常對應哪個讀值？",
          "choices": [
            "比較負的度數",
            "比較正的度數",
            "ADD",
            "稜鏡底向"
          ],
          "answer": 0,
          "explain": "逐字稿強調長軸對比較負，短軸對比較正。"
        },
        {
          "question": "DBOC 與 PD 不一致時會造成？",
          "choices": [
            "RAPD",
            "稜鏡效應",
            "K 值變陡",
            "視網膜反射消失"
          ],
          "answer": 1,
          "explain": "去中心會依 Prentice's rule 產生稜鏡。"
        }
      ],
      "roadmap": [
        "先看焦度計怎麼把模糊 target 變清楚，理解「清楚位置 = 度數」。",
        "再分球面與散光：球面兩線一起清楚，散光要分兩條主經線。",
        "接著處理多焦與稜鏡：看前/後頂點、OC、MRP、base direction。",
        "最後用 Prentice's rule 把 PD、DBOC、度數轉成誘發稜鏡。"
      ]
    },
    {
      "id": "objective-refraction",
      "code": "05",
      "shortTitle": "客觀驗光",
      "title": "客觀驗光：視網膜檢影與綜合驗光儀",
      "file": "objective-refraction.html",
      "status": "active",
      "summary": "掌握 retinoscopy setup、with/against motion、中和、working distance、phoropter 上的 sphere/cylinder/axis 操作。",
      "sources": [
        "05 客觀驗光：視網膜檢影與綜合驗光儀.pdf",
        "逐字稿 - 05 客觀驗光：視網膜檢影與綜合驗光儀.docx"
      ],
      "sections": [
        {
          "id": "setup",
          "title": "檢影 setup 與工作距離",
          "summary": "客觀驗光要讓受檢者看遠、避免調節、固定 working distance，並把 retinoscope streak、phoropter axis 與反射光方向對齊。",
          "points": [
            {
              "title": "受檢者看遠，驗者不要擋住視線",
              "text": "病人應注視遠方目標。掃右眼用右眼、掃左眼用左眼，身體稍微偏側，避免擋住患者視線造成調節不穩。",
              "bullets": [
                "看遠可放鬆 accommodation",
                "驗者擋住視標會讓病人開始調節",
                "調節不穩會讓中和點漂移"
              ],
              "visualPlan": "畫 exam room 俯視圖：患者、phoropter、遠方 fixation target、驗者左右眼位置；錯誤站位用紅色遮住視線。",
              "drill": {
                "question": "視網膜檢影時若驗者擋住病人遠方視標，最可能造成？",
                "choices": [
                  "角膜散光消失",
                  "病人調節不穩導致結果不準",
                  "瞳孔必定 RAPD",
                  "焦度計 reticle 模糊"
                ],
                "answer": 1,
                "explain": "逐字稿特別說擋住視線會讓病人沒有目標可看，開始調節，檢影不準。"
              },
              "simple": "檢影要讓病人放鬆看遠；如果驗者擋住遠方目標，病人調節一啟動，屈光估計就偏了。",
              "memory": "檢影怕 accommodation；站位先保視線。",
              "examFocus": [
                "看遠可放鬆 accommodation",
                "驗者擋住視標會讓病人開始調節",
                "調節不穩會讓中和點漂移"
              ]
            },
            {
              "title": "working distance 要固定",
              "text": "檢影工作距離改變會改變中和所需度數。實作上常把手臂伸直固定距離；若未戴 working lens，最後要扣除 working distance lens。",
              "formula": "Rx = retinoscopy result - working lens",
              "bullets": [
                "57 cm 約等於 +1.75D working lens",
                "若病人已戴相當於工作距離的補助鏡，就不再扣",
                "手臂彎曲會讓距離不穩"
              ],
              "visualPlan": "做 working distance 尺規：距離從 50/57/67 cm 切換，旁邊顯示對應 working lens 與扣除結果。",
              "drill": {
                "question": "若受檢者已戴相當於 57 cm 的 working lens 進行檢影，最後處方應如何處理？",
                "choices": [
                  "再扣一次 working lens",
                  "不用再扣除 working lens",
                  "全部加 +3.00D",
                  "只保留 cylinder"
                ],
                "answer": 1,
                "explain": "逐字稿題目中說已戴 working distance 補助鏡，因此掃出的結果就是 Rx。"
              },
              "simple": "工作距離是檢影的基準平面；距離不同，最後要扣掉的 working lens 也不同。",
              "memory": "50 cm 扣 2.00D，67 cm 扣 1.50D；距離先固定。",
              "examFocus": [
                "57 cm 約等於 +1.75D working lens",
                "若病人已戴相當於工作距離的補助鏡，就不再扣",
                "手臂彎曲會讓距離不穩"
              ]
            },
            {
              "title": "retinoscope sleeve down 是 plane mirror effect",
              "text": "課堂強調 sleeve down 時光源與反射鏡較近，呈現較發散的 plane mirror effect；sleeve up 則較接近 concave mirror/聚合效果。",
              "bullets": [
                "初學流程多以 sleeve down position",
                "要熟悉 retinoscope 內部：光源、反射鏡、鏡子",
                "plane mirror effect 會影響 with/against 的判讀"
              ],
              "visualPlan": "畫 retinoscope 內部兩狀態：sleeve down 光線發散、sleeve up 光線聚合；附 with/against motion 小示意。",
              "drill": {
                "question": "逐字稿中 sleeve down position 主要對應哪種效果？",
                "choices": [
                  "prism thinning",
                  "plane mirror effect",
                  "corneal topography",
                  "near reflex"
                ],
                "answer": 1,
                "explain": "老師說 sleeve 往下時以平行/較發散方式呈現，屬 plane mirror effect。"
              },
              "simple": "套筒位置會改變出射光型態，判讀 with/against 前要先知道目前是 plane mirror 還是 concave mirror effect。",
              "memory": "先看 sleeve，再判 motion；模式錯，方向會誤解。",
              "examFocus": [
                "初學流程多以 sleeve down position",
                "要熟悉 retinoscope 內部：光源、反射鏡、鏡子",
                "plane mirror effect 會影響 with/against 的判讀"
              ]
            }
          ],
          "studyPath": [
            "先固定看遠與正確站位。",
            "再把 working distance 變成可扣回的基準。",
            "最後確認 retinoscope sleeve 模式再判讀。"
          ]
        },
        {
          "id": "motion-neutral",
          "title": "with/against motion 與中和",
          "summary": "檢影判讀核心是看眼底反射相對 streak 的移動方向，逐步加球鏡或柱鏡直到 neutral reflex。",
          "points": [
            {
              "title": "with motion 與 against motion",
              "text": "with motion 表示反射光跟 streak 同方向；against motion 表示反射光反方向。中和時反射不再有明顯移動，亮度通常最亮、最寬、最快。",
              "bullets": [
                "with motion 通常先用球面度數處理",
                "against motion 表示焦線已在視網膜前方",
                "neutral 是 endpoint，不是越亮越好就一直加"
              ],
              "visualPlan": "空白舞台做三段動畫：streak 左右掃，retinal reflex 同向、反向、neutral 全亮一閃。",
              "drill": {
                "question": "檢影中看到反射光與 streak 反方向移動，稱為？",
                "choices": [
                  "neutral",
                  "with motion",
                  "against motion",
                  "MCR"
                ],
                "answer": 2,
                "explain": "反向就是 against motion。"
              },
              "simple": "with motion 是反射跟光帶同向，against motion 是反向；你用鏡片把反射推到 neutral。",
              "memory": "順動加正或少負，逆動加負或少正；終點是 neutral。",
              "examFocus": [
                "with motion 通常先用球面度數處理",
                "against motion 表示焦線已在視網膜前方",
                "neutral 是 endpoint，不是越亮越好就一直加"
              ]
            },
            {
              "title": "bracketing：先跨過再抓回中和點",
              "text": "若加鏡後反射變暗，可能走錯方向。初學常先調到可看見明顯 against motion，再往回推抓 neutral，這就是 bracketing。",
              "bullets": [
                "不要長時間停留在誘發調節的狀態",
                "跨過 endpoint 再回來可提高判斷",
                "反射變暗可能代表方向錯"
              ],
              "visualPlan": "做度數滑桿：反射從 with → neutral → against，再回到 neutral；錯誤方向亮度變暗。",
              "drill": {
                "question": "bracketing 技巧的重點是？",
                "choices": [
                  "永遠只加正鏡",
                  "故意跨過中和點再回推找 endpoint",
                  "只測第二主經線",
                  "忽略 working distance"
                ],
                "answer": 1,
                "explain": "逐字稿說從一側調到另一側，再回去抓中點，稱 bracketing。"
              },
              "simple": "bracketing 是故意從一側跨過中和點，再往回縮小範圍，避免把接近中和誤判成真正中和。",
              "memory": "先跨過，再夾回；endpoint 不是最亮，是剛好 neutral。",
              "examFocus": [
                "不要長時間停留在誘發調節的狀態",
                "跨過 endpoint 再回來可提高判斷",
                "反射變暗可能代表方向錯"
              ]
            },
            {
              "title": "球面中和後再處理第二主經線",
              "text": "先找最 hyperopic 的主經線，用 sphere power 中和。再把 streak 與 phoropter axis 轉 90 度，第二主經線應看到 against motion，接著用 cylinder power 中和。",
              "bullets": [
                "第一主經線：sphere power",
                "第二主經線：cylinder power",
                "規則性散光兩主經線差 90 度"
              ],
              "visualPlan": "做 phoropter 操作動畫：axis ring + streak 同步轉 90 度，sphere knob 鎖定後改用 cylinder knob。",
              "drill": {
                "question": "retinoscopy with phoropter 中，第一主經線中和後，第二主經線通常用什麼中和？",
                "choices": [
                  "cylinder power",
                  "PD ruler",
                  "cocaine",
                  "keratometer mire"
                ],
                "answer": 0,
                "explain": "投影片與逐字稿都說第二主經線用 cylinder power neutralize。"
              },
              "simple": "先把一條主經線用 sphere 中和，再轉 90 度看另一條主經線差多少，差值就是散光成分。",
              "memory": "一軸先 neutral，轉 90 度找 cylinder。",
              "examFocus": [
                "第一主經線：sphere power",
                "第二主經線：cylinder power",
                "規則性散光兩主經線差 90 度"
              ]
            }
          ],
          "studyPath": [
            "先辨認 with 與 against。",
            "再用 bracketing 夾出 neutral。",
            "最後轉 90 度處理第二主經線。"
          ]
        },
        {
          "id": "phoropter-cylinder",
          "title": "綜合驗光儀與柱鏡/軸位",
          "summary": "phoropter 上 sphere、cylinder、axis 的操作要與檢影 streak 和反射光方向保持平行，避免軸位與度數對錯。",
          "points": [
            {
              "title": "phoropter 控制：sphere/cylinder/axis",
              "text": "投影片標出 0.25D sphere、3.00D sphere、sphere power scale、cylinder power knob、cylinder axis knob 與 cylinder power scale。實驗室使用負柱鏡系統。",
              "bullets": [
                "sphere 常以 0.25D step 微調",
                "cylinder power knob 每格常 0.25D",
                "axis knob 改變柱鏡軸位"
              ],
              "visualPlan": "畫 phoropter 前面板空白模型，Claude 補上可點擊 knob，點擊時顯示功能說明。",
              "drill": {
                "question": "要改變柱鏡軸位時，主要操作哪個部分？",
                "choices": [
                  "cylinder axis knob",
                  "PD ruler",
                  "lens stop",
                  "mire alignment knob"
                ],
                "answer": 0,
                "explain": "axis knob 控制柱鏡軸位。"
              },
              "simple": "綜合驗光儀上 sphere 控整體焦點，cylinder 控散光量，axis 控散光方向；三者不要混在一起轉。",
              "memory": "S 管整體，C 管差值，axis 管方向。",
              "examFocus": [
                "sphere 常以 0.25D step 微調",
                "cylinder power knob 每格常 0.25D",
                "axis knob 改變柱鏡軸位"
              ]
            },
            {
              "title": "streak、反射光、phoropter axis 要平行",
              "text": "當找到主經線時，retinoscope streak、眼底反射光方向、phoropter 上的 axis 指示要互相平行，才開始中和。",
              "bullets": [
                "三者平行是軸位正確的安全檢查",
                "第一主經線完成後三者一起轉 90 度",
                "若軸位錯，中和結果會錯"
              ],
              "visualPlan": "做三層可旋轉線段：streak、reflex、axis arrow；三線重疊時變綠並開啟下一步。",
              "drill": {
                "question": "下列哪一組在檢影找主經線時應互相平行？",
                "choices": [
                  "streak、眼底反射、phoropter axis",
                  "PD、DBOC、ADD",
                  "SVC、IVC、PA",
                  "mire、RAPD、Horner"
                ],
                "answer": 0,
                "explain": "逐字稿反覆強調這三個方向要平行。"
              },
              "simple": "檢影散光時，光帶、視網膜反射與 phoropter axis 必須對準同一主經線，讀值才有意義。",
              "memory": "三線平行再下手：streak、reflex、axis。",
              "examFocus": [
                "三者平行是軸位正確的安全檢查",
                "第一主經線完成後三者一起轉 90 度",
                "若軸位錯，中和結果會錯"
              ]
            },
            {
              "title": "負柱鏡寫法：比較正者作 sphere",
              "text": "若兩主經線分別由 -1.75D 與 +0.50D 中和，且題目已處理 working lens，負柱鏡處方以比較正的 +0.50D 為 sphere，差值 2.25D 作負柱鏡。",
              "formula": "例：+0.50 -2.25 × 160",
              "bullets": [
                "比較正的經線作 sphere",
                "差值為 cylinder magnitude",
                "負柱鏡 axis 為比較正/平的方向"
              ],
              "visualPlan": "做題目拆解動畫：160 度 streak 實際掃 70 度；兩讀值排列成光十字，再轉成負柱鏡處方。",
              "drill": {
                "question": "兩主經線中和讀值為 -1.75D 與 +0.50D，負柱鏡的 cylinder magnitude 是？",
                "choices": [
                  "0.50D",
                  "1.75D",
                  "2.25D",
                  "3.00D"
                ],
                "answer": 2,
                "explain": "兩讀值差距為 2.25D。"
              },
              "simple": "負柱鏡處方把比較正的主經線當 sphere，再用比較負的差值寫成負 cylinder。",
              "memory": "正者當 S，差值當 C，軸看不加 C 的方向。",
              "examFocus": [
                "比較正的經線作 sphere",
                "差值為 cylinder magnitude",
                "負柱鏡 axis 為比較正/平的方向"
              ]
            }
          ],
          "studyPath": [
            "先知道 sphere/cylinder/axis 各管什麼。",
            "再讓 streak、reflex、axis 平行。",
            "最後把兩主經線轉成負柱鏡。"
          ]
        },
        {
          "id": "review-cases",
          "title": "檢影題型總整理",
          "summary": "考題常把工作距離、主經線方向、球柱鏡轉換混在一起；拆題時先判斷是否要扣 working lens，再轉成負柱鏡。",
          "points": [
            {
              "title": "先看 working lens 是否已戴",
              "text": "題目寫『受檢者戴上相當於 57 cm 的工作距離補助鏡』，代表已補償 working distance，不要再扣。若沒有戴，才用 result - working lens。",
              "bullets": [
                "看到已戴補助鏡：不扣",
                "沒戴補助鏡：扣 working lens",
                "扣錯會整題 sphere 偏移"
              ],
              "visualPlan": "做判斷流程圖：題目文字高亮『已戴』或『未戴』，分流到不扣/扣除。",
              "drill": {
                "question": "檢影題最容易造成 sphere 整體錯位的第一個陷阱是？",
                "choices": [
                  "忘記判斷 working lens 是否已補償",
                  "把 WTR 當 ATR",
                  "忘記測 K 值",
                  "把 RAPD 寫成 Horner"
                ],
                "answer": 0,
                "explain": "working lens 是否已戴會直接影響整體球面度數。"
              },
              "simple": "檢影題要先判斷 working lens 是否已經放入；已戴就不用再扣，未戴才要扣工作距離。",
              "memory": "題幹先抓已戴/未戴；不要無腦扣。",
              "examFocus": [
                "看到已戴補助鏡：不扣",
                "沒戴補助鏡：扣 working lens",
                "扣錯會整題 sphere 偏移"
              ]
            },
            {
              "title": "光束方向不等於被測經線方向",
              "text": "逐字稿題目提醒：當光束與 160 度平行時，實際掃的是與 streak 垂直的 70 度方向。最後 axis 要依題目與負柱鏡規則判斷。",
              "bullets": [
                "streak 平行方向與 power meridian 可能相差 90 度",
                "題目要畫光十字才不容易錯",
                "不要只看到 160 就直接填所有欄位"
              ],
              "visualPlan": "做 160/70 度十字盤，切換 streak direction 與 power meridian，讓學生看到相差 90 度。",
              "drill": {
                "question": "當檢影光束與 160 度平行時，常需要注意什麼？",
                "choices": [
                  "實際分析的另一主經線可能是 70 度",
                  "working distance 一定為 1 m",
                  "一定是 RAPD",
                  "K 值一定為 45D"
                ],
                "answer": 0,
                "explain": "逐字稿用這題提醒 streak 與主經線方向要畫出來。"
              },
              "simple": "檢影光帶的方向和實際被中和的 power meridian 差 90 度，所以要把光束方向轉成正確主經線。",
              "memory": "光帶方向看起來是線；真正測的是垂直那條經線。",
              "examFocus": [
                "streak 平行方向與 power meridian 可能相差 90 度",
                "題目要畫光十字才不容易錯",
                "不要只看到 160 就直接填所有欄位"
              ]
            },
            {
              "title": "客觀驗光結果要回頭 double check",
              "text": "右眼掃完、左眼掃完後，回到右眼 double check。客觀結果是起點，最後仍需主觀驗光確認最佳視力與舒適度。",
              "bullets": [
                "客觀驗光提供起始處方",
                "雙眼互相影響，完成後回查",
                "不要把 retinoscopy 結果當最終配鏡處方"
              ],
              "visualPlan": "做檢查循環：OD → OS → OD recheck → subjective refinement。",
              "drill": {
                "question": "完成左眼檢影後，逐字稿建議下一步是？",
                "choices": [
                  "直接下處方",
                  "回右眼 double check",
                  "量 K 值",
                  "點 pilocarpine"
                ],
                "answer": 1,
                "explain": "老師說左眼掃完要回去右眼 double check。"
              },
              "simple": "客觀驗光只是起點，雙眼各自中和後要回頭確認右眼，再接主觀驗光微調。",
              "memory": "OD -> OS -> OD recheck -> subjective refinement。",
              "examFocus": [
                "客觀驗光提供起始處方",
                "雙眼互相影響，完成後回查",
                "不要把 retinoscopy 結果當最終配鏡處方"
              ]
            }
          ],
          "studyPath": [
            "先讀題幹是否已戴 working lens。",
            "再分清光束方向與 power meridian。",
            "最後回頭 double check 再接主觀驗光。"
          ]
        }
      ],
      "quiz": [
        {
          "question": "retinoscopy 的 working distance 若未補償，最後 Rx 應如何得到？",
          "choices": [
            "result - working lens",
            "result + PD",
            "K 值 × 1.25",
            "只看 cylinder"
          ],
          "answer": 0,
          "explain": "公式是 Rx = result - working lens。"
        },
        {
          "question": "第一主經線用 sphere 中和後，第二主經線預期常看到？",
          "choices": [
            "against motion",
            "miosis",
            "MCR",
            "cocaine response"
          ],
          "answer": 0,
          "explain": "第二焦線在視網膜前方時會看到 against motion。"
        },
        {
          "question": "負柱鏡 phoropter 中，axis knob 用於？",
          "choices": [
            "改變柱鏡軸位",
            "改變 PD",
            "改變瞳孔大小",
            "測角膜地圖"
          ],
          "answer": 0,
          "explain": "axis knob 控制 cylinder axis。"
        },
        {
          "question": "三線平行檢查包含 retinoscope streak、眼底反射與？",
          "choices": [
            "phoropter axis",
            "near triad",
            "MRP",
            "mire regularity"
          ],
          "answer": 0,
          "explain": "三者平行才是正確主經線。"
        }
      ],
      "roadmap": [
        "先建立正確檢影環境：病人看遠、站位不遮擋、working distance 固定。",
        "再判斷 retinal reflex 的 with / against / neutral，並用 bracketing 找 endpoint。",
        "接著把兩條主經線轉成 phoropter 上的 sphere、cylinder、axis。",
        "最後檢查 working lens 是否已扣，並用 double check 接到主觀驗光。"
      ]
    },
    {
      "id": "keratometry",
      "code": "06",
      "shortTitle": "角膜曲率",
      "title": "角膜曲率測量：K 值與角膜地圖",
      "file": "keratometry.html",
      "status": "active",
      "summary": "理解 keratometer 原理、K reading、角膜散光分類、Javal's rule 與 corneal topography 熱圖判讀。",
      "sources": [
        "06 角膜曲率測量：K值與角膜地圖.pdf",
        "逐字稿 - 06 角膜曲率測量：K值、角膜散光與角膜地圖.docx"
      ],
      "sections": [
        {
          "id": "corneal-optics",
          "title": "角膜光學與 K 值意義",
          "summary": "角膜提供眼球約三分之二屈光力；曲率半徑越大，角膜越平，屈光力越小。",
          "points": [
            {
              "title": "角膜平均屈光力約 42-44D",
              "text": "眼球總屈光力約 60D，其中約 40D 來自角膜、約 20D 來自水晶體。角膜中央約 4 mm 對中央視力最重要。",
              "bullets": [
                "角膜是主要屈光介面",
                "中央比周邊通常更陡",
                "K 值主要描述前角膜中央區域"
              ],
              "visualPlan": "畫眼球光學剖面：角膜 40D、水晶體 20D，中央 4 mm 高亮；旁邊用曲面顯示中央陡、周邊平。",
              "drill": {
                "question": "眼球總屈光力約 60D，其中角膜約提供多少？",
                "choices": [
                  "10D",
                  "20D",
                  "40D",
                  "80D"
                ],
                "answer": 2,
                "explain": "逐字稿說角膜約 40D，約佔三分之二。"
              },
              "simple": "角膜是眼球最大屈光面，中央角膜大約提供 42-44D，所以 K 值是臨床配鏡和角膜評估重點。",
              "memory": "眼總屈光約 60D，角膜約 2/3。",
              "examFocus": [
                "角膜是主要屈光介面",
                "中央比周邊通常更陡",
                "K 值主要描述前角膜中央區域"
              ]
            },
            {
              "title": "曲率半徑與屈光力反相關",
              "text": "角膜表面度數可用 F = (n' - n) / r 理解。以 keratometer index 1.3375 與空氣 1 估算，可用 337.5 / D 換算半徑 mm。",
              "formula": "r(mm) = 337.5 / F(D)",
              "bullets": [
                "r 越大 = 越平 = D 越小",
                "7.5 mm 約 45.00D",
                "7.8 mm 約 43.25D"
              ],
              "visualPlan": "做半徑滑桿：r 變大時曲線變平、D 值下降；紅/藍兩條弧線對照 7.5/7.8 mm。",
              "drill": {
                "question": "角膜曲率半徑變大時，表面屈光力通常會？",
                "choices": [
                  "變小",
                  "變大",
                  "不變",
                  "變成 RAPD"
                ],
                "answer": 0,
                "explain": "半徑越大代表越平，屈光力越小。"
              },
              "simple": "角膜半徑越小代表越彎、越陡，屈光力越高；半徑越大代表越平，屈光力越低。",
              "memory": "小 r 大 D，大 r 小 D；r = 337.5 / F。",
              "examFocus": [
                "r 越大 = 越平 = D 越小",
                "7.5 mm 約 45.00D",
                "7.8 mm 約 43.25D"
              ]
            },
            {
              "title": "Keratometer 與 topographer 不測球面屈光度",
              "text": "傳統 keratometer 與 corneal topographer 提供角膜散光與角膜/淚液表面健康資訊；它們不是用來直接測 myopia/hyperopia 的球面屈光度。",
              "bullets": [
                "可評估 CL fitting",
                "可看 mire distortion 或不規則性",
                "球面屈光度需靠驗光/自動驗光等資訊"
              ],
              "visualPlan": "做儀器比較表：keratometer、autorefractor/keratometer、topographer，勾選能測 K、球面屈光、地圖範圍。",
              "drill": {
                "question": "傳統 keratometer 最主要提供的是？",
                "choices": [
                  "角膜散光與前表面曲率資訊",
                  "視神經傳入缺損",
                  "房水流速",
                  "最終主觀處方"
                ],
                "answer": 0,
                "explain": "投影片強調 keratometer/topographer 提供 corneal astigmatism，不是球面屈光度。"
              },
              "simple": "keratometer 和 topographer 主要測角膜形狀，不是直接測整眼球面屈光，所以不能把 K 值當眼鏡處方。",
              "memory": "K 看 cornea，Rx 看整眼。",
              "examFocus": [
                "可評估 CL fitting",
                "可看 mire distortion 或不規則性",
                "球面屈光度需靠驗光/自動驗光等資訊"
              ]
            }
          ],
          "studyPath": [
            "先記角膜是眼球主要屈光面。",
            "再用半徑理解陡平。",
            "最後分清 K 值不是眼鏡處方。"
          ]
        },
        {
          "id": "keratometer-method",
          "title": "Keratometer 原理與記錄",
          "summary": "角膜可視為凸折射面與凸面鏡；儀器透過 mire 反射影像、prism doubling 與 telescope 量中央約 3 mm。",
          "points": [
            {
              "title": "mire 反射與 prism doubling",
              "text": "已知大小的 mire 放在角膜前固定距離，角膜前表面反射出影像；keratometer 透過望遠鏡測量，prism doubling + mirror 形成三個 mire images。",
              "bullets": [
                "角膜像 convex mirror 反射 mire",
                "先 focus mires，再 align",
                "mire 扭曲可提示淚液/角膜表面問題"
              ],
              "visualPlan": "做 mire 反射動畫：mire → 角膜凸面反射 → telescope；切換正常/乾眼時 mire 從清楚變扭曲。",
              "drill": {
                "question": "keratometer 中 mire image 主要來自哪裡？",
                "choices": [
                  "角膜前表面反射",
                  "視網膜神經節細胞",
                  "水晶體後囊",
                  "視神經交叉"
                ],
                "answer": 0,
                "explain": "原理是角膜當作凸面鏡反射 mire。"
              },
              "simple": "keratometer 看的是 mire 在角膜凸面上的反射影像，透過 doubling 對齊來換算角膜曲率。",
              "memory": "mire 要清楚規則，doubling 要對齊。",
              "examFocus": [
                "角膜像 convex mirror 反射 mire",
                "先 focus mires，再 align",
                "mire 扭曲可提示淚液/角膜表面問題"
              ]
            },
            {
              "title": "K reading 記錄的是 power meridian",
              "text": "K reading 通常先記水平子午線 power，再記垂直；記錄的是 power meridian，不是散光處方的 axis。最小屈光度子午線 flat K = 負柱鏡 axis 方向。",
              "bullets": [
                "例：42.75@180; 43.50@90",
                "也可寫 42.75/43.50@090",
                "角膜散光 = 兩主經線 D 差值"
              ],
              "visualPlan": "做 K reading 轉換卡：兩個 meridian 數字拖曳到記錄格式，再自動標出 flat K 與 cylinder axis。",
              "drill": {
                "question": "K reading 中 42.75@180; 43.50@90 記錄的是什麼？",
                "choices": [
                  "散光處方 axis",
                  "各 power meridian 的角膜屈光力",
                  "瞳孔反應速度",
                  "PD/DBOC 差"
                ],
                "answer": 1,
                "explain": "講義強調記錄的是 power meridian，不是 axis。"
              },
              "simple": "K reading 記錄哪條子午線的角膜屈光力，不等於眼鏡負柱鏡的處方軸位。",
              "memory": "K 記 power meridian；Rx axis 要再轉換。",
              "examFocus": [
                "例：42.75@180; 43.50@90",
                "也可寫 42.75/43.50@090",
                "角膜散光 = 兩主經線 D 差值"
              ]
            },
            {
              "title": "MCR 與 distorted mires",
              "text": "除了 K 值，也要記錄 mire 狀態。Mires clear and regular 可寫 MCR；若 blink 後很快扭曲或持續不規則，需記錄 distorted/irregular 與時間。",
              "bullets": [
                "MCR = mire clear and regular",
                "幾秒後扭曲可提示 tear film 問題",
                "持續扭曲要考慮角膜不規則"
              ],
              "visualPlan": "做三張 mire 狀態卡：clear regular、blink 後 3 秒扭曲、persistent irregular；讓學生選記錄語。",
              "drill": {
                "question": "MCR 在 K reading 紀錄中代表？",
                "choices": [
                  "mire clear and regular",
                  "Marcus Gunn response",
                  "minus cylinder refraction",
                  "maximum corneal radius"
                ],
                "answer": 0,
                "explain": "逐字稿說清楚規則的 mire 可記 MCR。"
              },
              "simple": "mire 清楚規則代表中央角膜表面較規則；眨眼後變形或持續扭曲，提示淚膜或角膜不規則。",
              "memory": "mire 變形先想 tear film，再想 corneal irregularity。",
              "examFocus": [
                "MCR = mire clear and regular",
                "幾秒後扭曲可提示 tear film 問題",
                "持續扭曲要考慮角膜不規則"
              ]
            }
          ],
          "studyPath": [
            "先看 mire 如何被角膜反射。",
            "再理解 prism doubling 對齊。",
            "最後用 mire 形狀判斷規則或扭曲。"
          ]
        },
        {
          "id": "astigmatism-javal",
          "title": "角膜散光、WTR/ATR 與 Javal's rule",
          "summary": "K 值差就是角膜散光；比較陡的方向決定 WTR/ATR/oblique，總散光估算要考慮 1.25 修正與眼內殘餘散光。",
          "points": [
            {
              "title": "WTR/ATR 判斷",
              "text": "垂直方向較陡、度數較高，多為 with-the-rule；水平方向較陡、垂直較平，多為 against-the-rule；斜向較陡則為 oblique。",
              "bullets": [
                "WTR：vertical meridian steeper",
                "ATR：horizontal meridian steeper",
                "axis 通常在 flat meridian"
              ],
              "visualPlan": "做角膜熱圖三切換：垂直紅帶 WTR、水平紅帶 ATR、斜紅帶 oblique。",
              "drill": {
                "question": "K = 42.50@180; 44.50@90，屬於哪種角膜散光？",
                "choices": [
                  "WTR",
                  "ATR",
                  "RAPD",
                  "Horner"
                ],
                "answer": 0,
                "explain": "90 度垂直方向較陡，所以是 WTR。"
              },
              "simple": "WTR/ATR 是看角膜哪個方向較陡：垂直較陡多為 WTR，水平較陡多為 ATR。",
              "memory": "垂直陡 WTR，水平陡 ATR，斜陡 oblique。",
              "examFocus": [
                "WTR：vertical meridian steeper",
                "ATR：horizontal meridian steeper",
                "axis 通常在 flat meridian"
              ]
            },
            {
              "title": "角膜散光差值轉矯正柱鏡",
              "text": "角膜散光 = 兩主經線屈光力差。矯正負柱鏡的 axis 在 flat K 方向，例如 42.50@180; 44.50@90 → -2.00 x180。",
              "formula": "corneal astigmatism = steep K - flat K",
              "bullets": [
                "flat K 是負柱鏡 axis",
                "差值是 cylinder magnitude",
                "球面可寫 PL 或依完整處方處理"
              ],
              "visualPlan": "做 K-to-cylinder 互動：輸入兩個 K 值，自動標出 steep/flat、WTR/ATR、負柱鏡結果。",
              "drill": {
                "question": "R: 42.75D at 180; 42.00D at 90，矯正負柱鏡軸位約為？",
                "choices": [
                  "180",
                  "090",
                  "045",
                  "不用軸位"
                ],
                "answer": 1,
                "explain": "90 度是 flat K，因此負柱鏡 axis 在 090。"
              },
              "simple": "兩條 K 值相差多少，就是角膜散光量的估計；轉成負柱鏡時要注意軸位轉換。",
              "memory": "steep - flat = corneal cyl；負柱鏡軸靠 flat meridian。",
              "examFocus": [
                "flat K 是負柱鏡 axis",
                "差值是 cylinder magnitude",
                "球面可寫 PL 或依完整處方處理"
              ]
            },
            {
              "title": "Javal's rule",
              "text": "框架眼鏡總散光估算可用 A total = 1.25(A corneal) + A internal。課堂採用平均眼內殘餘散光約 -0.50 x090；隱形眼鏡矯正通常不需 1.25 correction factor。",
              "formula": "A_total = 1.25(A_角膜) + A_眼內",
              "bullets": [
                "1.25 是角膜到眼鏡平面修正",
                "A internal 常用 -0.50 x090",
                "CL correction 不必套此 correction factor"
              ],
              "visualPlan": "做向量/軸位簡化計算器：角膜 WTR/ATR 輸入後，顯示 1.25 倍與 residual ATR 相加/相減。",
              "drill": {
                "question": "Javal's rule 中 1.25 correction factor 主要用於估算哪種矯正？",
                "choices": [
                  "框架眼鏡 spectacle correction",
                  "瞳孔近反射",
                  "cocaine test",
                  "reticle 歸零"
                ],
                "answer": 0,
                "explain": "投影片說 A total 是 spectacle correction，CL correction 不需此修正係數。"
              },
              "simple": "Javal's rule 用角膜散光估總散光，但要加入內部散光補償，所以只能當估算，不是最終處方。",
              "memory": "Javal = 角膜散光 × 1.25，再加 residual ATR。",
              "examFocus": [
                "1.25 是角膜到眼鏡平面修正",
                "A internal 常用 -0.50 x090",
                "CL correction 不必套此 correction factor"
              ]
            }
          ],
          "studyPath": [
            "先找 flat K 與 steep K。",
            "再判斷 WTR/ATR/oblique。",
            "最後把角膜散光轉成負柱鏡估計。"
          ]
        },
        {
          "id": "topography",
          "title": "角膜地圖 Topography",
          "summary": "topographer 用熱圖呈現角膜表面形狀；比 keratometer 更能看全角膜光學品質、疾病追蹤與術後變化。",
          "points": [
            {
              "title": "熱圖顏色：紅陡、藍紫平",
              "text": "角膜地圖把角膜表面形狀呈現為 heat map；紅色代表 steeper、度數較高，藍紫代表 flatter、度數較低。",
              "bullets": [
                "紅色不等於發炎，是曲率較陡",
                "藍紫代表較平或術後削薄區",
                "要結合比例尺與圖型判讀"
              ],
              "visualPlan": "做空白 corneal map canvas，Claude 補上色階條與紅/綠/藍紫地形；hover 顯示 steeper/flatter。",
              "drill": {
                "question": "角膜地圖上紅色區域通常代表？",
                "choices": [
                  "較陡、屈光力較高",
                  "較平、屈光力較低",
                  "一定是出血",
                  "一定是 RAPD"
                ],
                "answer": 0,
                "explain": "講義明確說 red = steeper，purple/blue = flatter。"
              },
              "simple": "角膜地形圖用顏色快速呈現彎曲程度；紅色通常較陡，藍紫通常較平。",
              "memory": "紅陡藍平；先看 pattern，再看數字。",
              "examFocus": [
                "紅色不等於發炎，是曲率較陡",
                "藍紫代表較平或術後削薄區",
                "要結合比例尺與圖型判讀"
              ]
            },
            {
              "title": "topographer 比 keratometer 範圍更廣",
              "text": "傳統 keratometer 主要看中央約 3 mm；topographer 可評估更大範圍與整體角膜光學品質，因此更適合追蹤疾病、手術或 injury 後復原。",
              "bullets": [
                "keratometer：中央 3 mm",
                "topographer：全角膜較廣泛資訊",
                "可追蹤 keratoconus 或雷射術後形態"
              ],
              "visualPlan": "畫同一顆角膜：中央 3 mm 圓圈 vs 全角膜 heat map，拖桿比較資訊範圍。",
              "drill": {
                "question": "下列哪項是 topographer 相對於傳統 keratometer 的優勢？",
                "choices": [
                  "只能測瞳孔大小",
                  "可看更大範圍的角膜形態",
                  "可直接治療青光眼",
                  "可替代所有主觀驗光"
                ],
                "answer": 1,
                "explain": "逐字稿強調 topography 比傳統 keratometer 能看更廣、更多角膜變化。"
              },
              "simple": "keratometer 主要看中央少數點，topographer 能看更大角膜範圍，因此更適合看不規則與術後形狀。",
              "memory": "Keratometer 看中央，topographer 看地圖。",
              "examFocus": [
                "keratometer：中央 3 mm",
                "topographer：全角膜較廣泛資訊",
                "可追蹤 keratoconus 或雷射術後形態"
              ]
            },
            {
              "title": "不規則散光與圓錐角膜",
              "text": "不規則散光可表現為上下不相等或兩主經線不相差 90 度。keratoconus 會在 topography 上看到局部 cone 區域變陡，且可隨病程惡化。",
              "bullets": [
                "regular astigmatism：主經線相差 90 度",
                "irregular：上下不同或主經線非 90 度",
                "keratoconus 常有局部 inferior steepening"
              ],
              "visualPlan": "做 regular vs irregular vs keratoconus 三張互動地圖，標出 cone location 與 progression slider。",
              "drill": {
                "question": "下列何者符合不規則散光的定義之一？",
                "choices": [
                  "兩主經線不相差 90 度",
                  "K 值一定等於 42D",
                  "瞳孔小於 3 mm",
                  "DBOC 等於 PD"
                ],
                "answer": 0,
                "explain": "逐字稿說除了上下不等，兩主經線不相差 90 度也屬不規則散光。"
              },
              "simple": "不規則散光不是兩條整齊主經線能解釋；圓錐角膜會出現局部下方或偏心變陡。",
              "memory": "局部紅 cone、形狀偏心，先警覺 keratoconus。",
              "examFocus": [
                "regular astigmatism：主經線相差 90 度",
                "irregular：上下不同或主經線非 90 度",
                "keratoconus 常有局部 inferior steepening"
              ]
            }
          ],
          "studyPath": [
            "先讀色階：紅陡、藍平。",
            "再比較中央 K 與全角膜地圖。",
            "最後看不規則 pattern 與 keratoconus。"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Keratometer 的 K reading 記錄的是？",
          "choices": [
            "power meridian",
            "RAPD grade",
            "PD",
            "retinoscopy endpoint"
          ],
          "answer": 0,
          "explain": "K reading 是各子午線角膜屈光力。"
        },
        {
          "question": "flat K 與負柱鏡 axis 的關係是？",
          "choices": [
            "flat K 方向就是負柱鏡 axis",
            "永遠相差 45 度",
            "無關",
            "只看瞳孔大小"
          ],
          "answer": 0,
          "explain": "最小屈光度子午線為 flat K，也是負柱鏡軸方向。"
        },
        {
          "question": "42.00@010; 46.00@100 的角膜散光量是？",
          "choices": [
            "1D",
            "2D",
            "4D",
            "6D"
          ],
          "answer": 2,
          "explain": "46-42 = 4D。"
        },
        {
          "question": "topography 熱圖藍紫色通常代表？",
          "choices": [
            "較平",
            "較陡",
            "一定感染",
            "一定水腫"
          ],
          "answer": 0,
          "explain": "紅較陡，藍紫較平。"
        }
      ],
      "roadmap": [
        "先抓角膜曲率和屈光力的關係：越陡度數越高，越平度數越低。",
        "再理解 keratometer 是看 mire 反射，不是在量整眼球面處方。",
        "接著把 K reading 轉成角膜散光、WTR/ATR/oblique 與負柱鏡軸位。",
        "最後用 topography 看更大範圍，辨認不規則散光與圓錐角膜。"
      ]
    },
    {
      "id": "pupil-response",
      "code": "07",
      "shortTitle": "瞳孔反應",
      "title": "瞳孔反應：光反射、RAPD 與 Horner syndrome",
      "file": "pupil-response.html",
      "status": "active",
      "summary": "整理正常瞳孔、直接/間接光反射、swinging flashlight test、RAPD、light-near dissociation、Adie、Argyll Robertson 與 Horner syndrome。",
      "sources": [
        "07 瞳孔反應：光反射與傳入傳出路徑.pdf",
        "逐字稿 - 07 瞳孔反應：光反射、RAPD與 Horner syndrome.docx"
      ],
      "sections": [
        {
          "id": "normal-pupil",
          "title": "正常瞳孔與大小判讀",
          "summary": "瞳孔是虹膜中央孔洞，控制入眼光量；正常應圓形、兩眼相近，並受年齡、光照、情緒與近反射影響。",
          "points": [
            {
              "title": "正常大小、miosis 與 mydriasis",
              "text": "正常瞳孔可約 1-8 mm，室內常約 3-5 mm。小於約 3 mm 可稱 miosis；大於約 7 mm 可稱 mydriasis。",
              "bullets": [
                "亮光與副交感使縮瞳",
                "暗處與交感使散瞳",
                "老人瞳孔常較小"
              ],
              "visualPlan": "做雙眼瞳孔直徑滑桿：1-8 mm，標出 miosis、normal indoor、mydriasis 區間。",
              "drill": {
                "question": "室內正常瞳孔大小大約常落在？",
                "choices": [
                  "3-5 mm",
                  "10-12 mm",
                  "0.1-0.5 mm",
                  "固定 8 mm"
                ],
                "answer": 0,
                "explain": "逐字稿說正常室內光約 3 到 5 mm。"
              },
              "simple": "瞳孔大小是縮瞳與散瞳力量的平衡，會隨光線、距離、藥物與神經狀態改變。",
              "memory": "小於約 3 mm 想 miosis，大於約 7 mm 想 mydriasis。",
              "examFocus": [
                "亮光與副交感使縮瞳",
                "暗處與交感使散瞳",
                "老人瞳孔常較小"
              ]
            },
            {
              "title": "生理性 anisocoria",
              "text": "約少數正常人可有生理性 anisocoria。關鍵是亮室與暗室兩眼差異大致相同；若暗室差更多，常指向小瞳孔那側散瞳障礙。",
              "bullets": [
                "亮暗差一樣：較可能生理性",
                "暗室差更多：小瞳孔側可能交感問題",
                "亮室差更多：大瞳孔側可能副交感問題"
              ],
              "visualPlan": "做亮室/暗室比較卡：兩眼差距固定 vs 暗室差距擴大 vs 亮室差距擴大。",
              "drill": {
                "question": "生理性 anisocoria 的典型特徵是？",
                "choices": [
                  "亮室與暗室兩眼差距差不多",
                  "只在暗室差很多",
                  "一定伴隨 ptosis",
                  "一定有 RAPD"
                ],
                "answer": 0,
                "explain": "逐字稿說正常生理性不等大在亮暗室差異大致相等。"
              },
              "simple": "生理性瞳孔不等大通常差距小、亮暗都差不多，不會伴隨明顯神經學症狀。",
              "memory": "差小又穩定，多半生理；亮暗放大差距才找病灶。",
              "examFocus": [
                "亮暗差一樣：較可能生理性",
                "暗室差更多：小瞳孔側可能交感問題",
                "亮室差更多：大瞳孔側可能副交感問題"
              ]
            },
            {
              "title": "near triad：調節、內聚、縮瞳",
              "text": "近距離反射也稱 near triad 或 near synkinesis，包含 accommodation、convergence 與 miosis，三者會連動。",
              "bullets": [
                "看近：睫狀肌收縮、水晶體變胖",
                "雙眼內聚",
                "瞳孔縮小"
              ],
              "visualPlan": "做近距離反射三連動畫：物體靠近時水晶體變厚、眼球內聚、瞳孔縮小。",
              "drill": {
                "question": "near triad 不包含下列哪一項？",
                "choices": [
                  "accommodation",
                  "convergence",
                  "miosis",
                  "corneal mire doubling"
                ],
                "answer": 3,
                "explain": "near triad 是調節、內聚、縮瞳。"
              },
              "simple": "看近物時，眼睛要同時增加晶狀體屈光力、兩眼內聚、瞳孔縮小，才能讓近物清楚。",
              "memory": "近反應三件套：accommodation、convergence、miosis。",
              "examFocus": [
                "看近：睫狀肌收縮、水晶體變胖",
                "雙眼內聚",
                "瞳孔縮小"
              ]
            }
          ],
          "studyPath": [
            "先定義 miosis、mydriasis、anisocoria。",
            "再比較亮暗環境差異。",
            "最後把近反應三聯記熟。"
          ]
        },
        {
          "id": "reflex-pathway",
          "title": "光反射路徑與 RAPD",
          "summary": "光反射需 afferent retina/CN II 與 efferent CN III/副交感路徑完整；swinging flashlight test 可抓 relative afferent pupillary defect。",
          "points": [
            {
              "title": "direct 與 consensual response",
              "text": "照一眼時，同眼縮瞳稱 direct response，對側縮瞳稱 consensual response。正常兩者應相近，因 pretectal/EW 核路徑有雙側投射。",
              "bullets": [
                "afferent：retina → optic nerve → pretectal area",
                "efferent：EW nucleus → CN III → ciliary ganglion → sphincter",
                "同眼與對側都會縮"
              ],
              "visualPlan": "畫雙眼光反射路徑：光進 OD，兩側 EW nucleus 亮起，兩眼 sphincter 收縮。",
              "drill": {
                "question": "照右眼時左眼也縮瞳，稱為？",
                "choices": [
                  "consensual response",
                  "direct response",
                  "Horner syndrome",
                  "MCR"
                ],
                "answer": 0,
                "explain": "對側反應是 consensual response。"
              },
              "simple": "光照一眼時，同眼縮瞳是 direct response，對眼同步縮瞳是 consensual response。",
              "memory": "一眼受光，兩眼都縮；同眼 direct，對眼 consensual。",
              "examFocus": [
                "afferent：retina → optic nerve → pretectal area",
                "efferent：EW nucleus → CN III → ciliary ganglion → sphincter",
                "同眼與對側都會縮"
              ]
            },
            {
              "title": "swinging flashlight test 與 RAPD",
              "text": "左右眼交替照光。若光移到病眼時兩眼反而相對放大，表示該眼傳入訊號較弱，稱 RAPD 或 Marcus Gunn pupil。",
              "bullets": [
                "RAPD 是 afferent defect",
                "角膜、水晶體、屈光不正造成的視力差通常不造成 RAPD",
                "可用 neutral density filter 量化"
              ],
              "visualPlan": "做手電筒左右擺動動畫：正常兩眼維持縮；RAPD 眼被照時雙眼放大。",
              "drill": {
                "question": "RAPD 主要代表哪一段路徑有相對缺損？",
                "choices": [
                  "傳入 afferent pathway",
                  "角膜曲率半徑",
                  "MRP 定位",
                  "房水排出"
                ],
                "answer": 0,
                "explain": "RAPD 全名 relative afferent pupillary defect。"
              },
              "simple": "交替照光比較兩眼傳入訊號；照到 RAPD 眼時，中樞收到的光變少，兩眼會相對放大。",
              "memory": "RAPD 是 afferent defect，不是瞳孔括約肌壞掉。",
              "examFocus": [
                "RAPD 是 afferent defect",
                "角膜、水晶體、屈光不正造成的視力差通常不造成 RAPD",
                "可用 neutral density filter 量化"
              ]
            },
            {
              "title": "light-near dissociation",
              "text": "正常對光反應與近反應量及速度相近。若光反應差但看近縮瞳保留或更強，稱 light-near dissociation/association，常見於副交感路徑某些病變。",
              "bullets": [
                "光反應弱",
                "近反應相對保留",
                "Adie's tonic pupil、Argyll Robertson pupil 皆可見"
              ],
              "visualPlan": "做對照動畫：光照無明顯縮瞳，但切到近目標時瞳孔慢慢或快速縮小。",
              "drill": {
                "question": "light-near dissociation 指的是？",
                "choices": [
                  "光反應差但近反應相對保留",
                  "角膜紅色代表較陡",
                  "DBOC 等於 PD",
                  "with motion 中和"
                ],
                "answer": 0,
                "explain": "逐字稿定義：近反應大於對光反應。"
              },
              "simple": "光近分離是光反射弱，但看近縮瞳保留，代表光反射路徑和近反應路徑受影響不同。",
              "memory": "Light 差、near 好；想到 Adie、Argyll。",
              "examFocus": [
                "光反應弱",
                "近反應相對保留",
                "Adie's tonic pupil、Argyll Robertson pupil 皆可見"
              ]
            }
          ],
          "studyPath": [
            "先畫出 direct/consensual 共同路徑。",
            "再用 swinging flashlight 找 RAPD。",
            "最後分辨光反射與近反應。"
          ]
        },
        {
          "id": "parasympathetic-disorders",
          "title": "副交感相關異常：CN III、Adie、Argyll Robertson",
          "summary": "副交感路徑控制 sphincter 與縮瞳。不同層次病變會造成大瞳孔、光反應差、近反應保留或藥物超敏感。",
          "points": [
            {
              "title": "CN III palsy 與瞳孔/眼位",
              "text": "第三腦神經控制多條眼外肌、提上瞼肌與副交感縮瞳路徑。缺損可見眼瞼下垂、眼球外斜/外下偏，以及瞳孔散大或光反應差。",
              "bullets": [
                "CN III 控制多數眼外肌",
                "levator palpebrae 受影響會 ptosis",
                "副交感纖維受影響會大瞳孔"
              ],
              "visualPlan": "畫 CN III 支配圖：眼外肌、levator、EW/ciliary ganglion/sphincter，點不同分支顯示症狀。",
              "drill": {
                "question": "CN III palsy 可同時造成下列哪組表現？",
                "choices": [
                  "ptosis、眼球運動異常、瞳孔縮瞳差",
                  "K 值增加、MCR",
                  "DBOC 不等於 PD",
                  "with motion"
                ],
                "answer": 0,
                "explain": "第三腦神經支配眼外肌、提上瞼肌與副交感縮瞳路徑。"
              },
              "simple": "第三對腦神經同時管部分眼外肌、提上瞼與副交感縮瞳，因此病變可能同時出現眼位、眼瞼、瞳孔問題。",
              "memory": "CN III：眼歪、ptosis、大瞳孔要一起看。",
              "examFocus": [
                "CN III 控制多數眼外肌",
                "levator palpebrae 受影響會 ptosis",
                "副交感纖維受影響會大瞳孔"
              ]
            },
            {
              "title": "Adie's tonic pupil",
              "text": "Adie's tonic pupil 常與 ciliary ganglion 或 postganglionic fibers 缺損有關。病眼大、光反應差；看近可慢慢縮，回看遠也慢慢放大，呈 tonic slow response。",
              "bullets": [
                "常見 light-near dissociation",
                "近反應可保留但慢",
                "低濃度 pilocarpine 可因 denervation supersensitivity 強烈縮瞳"
              ],
              "visualPlan": "做四格：暗室大瞳孔、亮室光反應差、看近慢縮、回遠慢放；pilocarpine 後病眼強烈縮。",
              "drill": {
                "question": "Adie's tonic pupil 使用低濃度 pilocarpine 後病眼強烈縮瞳，主要原因是？",
                "choices": [
                  "denervation supersensitivity",
                  "Prentice's rule",
                  "mire doubling",
                  "working distance"
                ],
                "answer": 0,
                "explain": "長期去神經支配使 sphincter receptor 增多，對藥物超敏感。"
              },
              "simple": "Adie 常是大瞳孔、光反應差、近反應慢，且因去神經後超敏感而對稀釋 pilocarpine 特別敏感。",
              "memory": "Adie = 大、慢、稀釋 pilocarpine 會縮。",
              "examFocus": [
                "常見 light-near dissociation",
                "近反應可保留但慢",
                "低濃度 pilocarpine 可因 denervation supersensitivity 強烈縮瞳"
              ]
            },
            {
              "title": "Argyll Robertson pupil",
              "text": "常與 neurosyphilis、長期糖尿病或酒精中毒等相關。典型為雙側小瞳孔，對光 direct/consensual 反應差或無，但近反應快速保留。",
              "bullets": [
                "病灶常牽涉中腦/EW nucleus 區域",
                "兩眼都可受影響",
                "小瞳孔且 light-near dissociation"
              ],
              "visualPlan": "做 AR pupil 比較：亮暗都小、照光不變、看近快速縮；旁邊標中腦/EW nucleus。",
              "drill": {
                "question": "Argyll Robertson pupil 的典型表現是？",
                "choices": [
                  "對光差但近反應保留",
                  "只有角膜 mire 扭曲",
                  "DBOC 過大",
                  "K 值 42D"
                ],
                "answer": 0,
                "explain": "這是典型 light-near dissociation。"
              },
              "simple": "Argyll Robertson pupil 通常小而不規則，光反射差但近反應保留，經典上和神經梅毒相關。",
              "memory": "AR pupil：accommodates but does not react。",
              "examFocus": [
                "病灶常牽涉中腦/EW nucleus 區域",
                "兩眼都可受影響",
                "小瞳孔且 light-near dissociation"
              ]
            }
          ],
          "studyPath": [
            "先看 CN III 傳出路。",
            "再比較 Adie 與 Argyll 的光近分離。",
            "最後用反應速度與藥物敏感性分開。"
          ]
        },
        {
          "id": "sympathetic-horner",
          "title": "交感路徑與 Horner syndrome",
          "summary": "交感路徑控制 dilator muscle、Müller muscle 與汗腺。Horner syndrome 以 ptosis、miosis、anhidrosis 與 dilation lag 為核心。",
          "points": [
            {
              "title": "交感路徑與三階神經元",
              "text": "交感路徑從下視丘到脊髓，再經肺尖/頸上交感神經節，最後沿三叉神經/長睫狀神經到眼球 dilator muscle，也支配 Müller muscle 與額頭汗腺。",
              "bullets": [
                "一階：中樞到脊髓",
                "二階：脊髓經肺尖到 superior cervical ganglion",
                "三階：沿 carotid/三叉路徑進眼"
              ],
              "visualPlan": "畫三階 sympathetic pathway，肺尖、頸上神經節、三叉/長睫狀神經都要標；用分段高亮可能病灶。",
              "drill": {
                "question": "Horner syndrome 可能因肺尖腫瘤壓迫哪段路徑而發生？",
                "choices": [
                  "交感二階神經元附近",
                  "角膜前表面 mire",
                  "reticle 中心",
                  "EW nucleus only"
                ],
                "answer": 0,
                "explain": "逐字稿提到二階路徑會經過肺尖，腫瘤壓迫可造成 Horner。"
              },
              "simple": "交感散瞳路徑從中樞下行到肺尖附近，再到頸上神經節，最後沿眼部神經到瞳孔擴大肌。",
              "memory": "Horner 定位看三階：central、preganglionic、postganglionic。",
              "examFocus": [
                "一階：中樞到脊髓",
                "二階：脊髓經肺尖到 superior cervical ganglion",
                "三階：沿 carotid/三叉路徑進眼"
              ]
            },
            {
              "title": "三個 osis：ptosis、miosis、anhidrosis",
              "text": "Horner syndrome 典型三徵為 ptosis 眼瞼下垂、miosis 縮瞳、anhidrosis 無汗。上下眼瞼受影響可讓眼睛看似內陷，稱 false enophthalmos。",
              "bullets": [
                "ptosis：Müller muscle 交感支配差",
                "miosis：dilator muscle 不能正常散瞳",
                "anhidrosis：額頭汗腺交感受損"
              ],
              "visualPlan": "做左右臉比較：病側輕 ptosis、小瞳孔、額頭乾；標 false enophthalmos 不是眼球真的後退。",
              "drill": {
                "question": "Horner syndrome 的三個 osis 不包含？",
                "choices": [
                  "ptosis",
                  "miosis",
                  "anhidrosis",
                  "keratoconus"
                ],
                "answer": 3,
                "explain": "三徵是 ptosis、miosis、anhidrosis。"
              },
              "simple": "Horner syndrome 是交感路徑受損，所以會小瞳孔、輕微眼瞼下垂，可能合併同側無汗。",
              "memory": "三個 osis：ptosis、miosis、anhidrosis。",
              "examFocus": [
                "ptosis：Müller muscle 交感支配差",
                "miosis：dilator muscle 不能正常散瞳",
                "anhidrosis：額頭汗腺交感受損"
              ]
            },
            {
              "title": "dilation lag 與藥物鑑別",
              "text": "Horner 病側在暗室散瞳慢，5 秒時 anisocoria 最大，12 秒後可能較接近。cocaine 正常會抑制 NE 回收使散瞳；Horner 病眼反應差。hydroxyamphetamine 可協助分辨一/二階與三階病灶。",
              "bullets": [
                "cocaine：阻斷 NE reuptake，正常眼散大",
                "Horner 病眼 NE 不足，cocaine 反應差",
                "hydroxyamphetamine 促進三階神經釋放 NE"
              ],
              "visualPlan": "做暗室 0/5/12 秒時間軸，病側散瞳 lag；藥物頁籤顯示 cocaine 與 hydroxyamphetamine 機轉。",
              "drill": {
                "question": "Horner syndrome 的 dilation lag 最常在何種情境被觀察？",
                "choices": [
                  "從亮室進入暗室後病側散瞳較慢",
                  "測 K 值時 mire 變清楚",
                  "Prentice 計算時 d 變大",
                  "phoropter axis 轉 90 度"
                ],
                "answer": 0,
                "explain": "Horner 病側交感散瞳弱，暗室初期 anisocoria 特別明顯。"
              },
              "simple": "Horner 患側暗處散瞳較慢，藥物測試可利用 norepinephrine 釋放或再吸收機轉幫助定位。",
              "memory": "暗處看 lag；cocaine 確認，hydroxyamphetamine 幫定位。",
              "examFocus": [
                "cocaine：阻斷 NE reuptake，正常眼散大",
                "Horner 病眼 NE 不足，cocaine 反應差",
                "hydroxyamphetamine 促進三階神經釋放 NE"
              ]
            }
          ],
          "studyPath": [
            "先走完三階交感路徑。",
            "再背 Horner 三個 osis。",
            "最後用 dilation lag 與藥物做定位。"
          ]
        }
      ],
      "quiz": [
        {
          "question": "RAPD 的主要問題在？",
          "choices": [
            "afferent pathway",
            "角膜曲率",
            "DBOC",
            "Javal's rule"
          ],
          "answer": 0,
          "explain": "RAPD 是 relative afferent pupillary defect。"
        },
        {
          "question": "Adie's tonic pupil 常見哪種現象？",
          "choices": [
            "light-near dissociation",
            "K 值全為 42D",
            "BO prism",
            "mire clear and regular"
          ],
          "answer": 0,
          "explain": "光反應差，看近反應保留且慢。"
        },
        {
          "question": "Horner syndrome 的病側瞳孔在暗室會？",
          "choices": [
            "散瞳較慢",
            "立即變最大",
            "完全不受交感影響但無症狀",
            "一定變成橢圓"
          ],
          "answer": 0,
          "explain": "交感散瞳受損造成 dilation lag。"
        },
        {
          "question": "Argyll Robertson pupil 典型為？",
          "choices": [
            "小瞳孔、對光差、近反應保留",
            "大瞳孔、cocaine 強烈散大",
            "K 值差 2D",
            "with motion"
          ],
          "answer": 0,
          "explain": "典型 light-near dissociation。"
        }
      ],
      "roadmap": [
        "先把正常瞳孔大小、亮暗變化、近反應三聯建立起來。",
        "再用 direct / consensual response 分清傳入路與傳出路。",
        "接著看 RAPD、light-near dissociation、CN III、Adie、Argyll 的差異。",
        "最後用 Horner 三階交感路徑、三個 osis、dilation lag 和藥物鑑別定位。"
      ]
    },
    {
      "id": "stereopsis",
      "code": "08",
      "shortTitle": "立體視覺",
      "title": "立體視覺：深度線索、視差與檢測",
      "file": "stereopsis.html",
      "status": "active",
      "summary": "先分清單眼如何猜距離、雙眼如何產生真正立體視，再學視差方向與各種立體視檢查。",
      "sources": [
        "8-stereoacuity_sp26.pdf",
        "逐字稿 - 08 立體視覺：單眼線索、視差與立體視檢測（2）.docx"
      ],
      "sections": [
        {
          "id": "depth-cues",
          "title": "單眼也能猜距離，但不是真正立體視",
          "summary": "大腦可以用經驗從平面影像猜出前後；真正細膩的立體視則需要兩眼一起工作。",
          "studyPath": [
            "先分清深度知覺與真正立體視。",
            "再把八種單眼線索分成幾何與外觀線索。",
            "最後理解單眼線索為什麼會製造視覺錯覺。"
          ],
          "points": [
            {
              "title": "深度知覺不等於真正立體視",
              "simple": "遮住一眼仍能猜誰近誰遠，是因為大腦會用經驗推理；真正 stereopsis 必須靠兩眼影像的細微差異。",
              "text": "Depth perception 是感覺物體前後距離的總能力，單眼也能靠 monocular cues 做到。Stereopsis 則是雙眼把略有差異的影像融合後產生的細膩立體感，所以單眼者可有深度知覺，但沒有真正雙眼立體視。",
              "examFocus": [
                "monocular cues 是後天學會的推論，不是精細 stereopsis",
                "單眼可保留粗略 depth perception",
                "真正 stereopsis 需要雙眼影像與 fusion"
              ],
              "memory": "單眼會猜遠近；雙眼才會做真正 3D。",
              "visualPlan": "做同一個教室場景的單眼/雙眼切換。單眼時只標示可用的大小、遮擋與透視線索；雙眼時顯示左右眼略不同影像融合成立體。不要使用通用眼球圖。",
              "drill": {
                "question": "遮住一眼後仍能判斷水壺比老師近，最主要代表什麼？",
                "choices": [
                  "仍有完整 stereopsis",
                  "可利用 monocular cues 判斷深度",
                  "視網膜視差變得更大",
                  "一定存在 diplopia"
                ],
                "answer": 1,
                "explain": "單眼可利用後天學會的深度線索，但真正 stereopsis 需要雙眼。"
              }
            },
            {
              "title": "幾何線索：大小、高度、透視與遮擋",
              "simple": "大腦看到物體較小、較高、靠近透視消失點或被別人擋住，就會把它判成比較遠。",
              "text": "Relative size 利用遠物看起來較小；relative height 利用平面上較高位置判斷較遠；perspective 利用平行線往遠方收斂；occlusion 則把遮住別人的物體判為較近。這些規則也能被藝術家用來製造平面上的立體錯覺。",
              "examFocus": [
                "relative size：同類物體看起來越小通常越遠",
                "relative height / perspective：較高、較靠近消失點通常較遠",
                "occlusion：遮擋者在前，被遮擋者在後"
              ],
              "memory": "小、高、收斂、被擋，通常都在後面。",
              "visualPlan": "做一張走廊透視圖，使用可切換按鈕逐一只留下 relative size、relative height、perspective、occlusion。每次只高亮一種線索並顯示前後判斷。",
              "drill": {
                "question": "兩個相同大小的人物畫在平面上，其中一個較小且靠近透視消失點，大腦通常判斷它如何？",
                "choices": [
                  "比較近",
                  "一定比較高",
                  "比較遠",
                  "無法使用任何深度線索"
                ],
                "answer": 2,
                "explain": "相對大小與透視都會讓較小、靠近消失點的物體被判為較遠。"
              }
            },
            {
              "title": "外觀線索：動態、紋理、陰影與清晰度",
              "simple": "近物移動感較明顯、細節較多也較清楚；陰影方向則幫大腦猜表面是凸還是凹。",
              "text": "Relative motion 會讓移動觀察者感到近物與遠物移動方向或速度不同；texture gradient 讓近處細節較清楚、遠處紋理較密；shading 依光源與陰影推測凸凹；clarity 則把較清楚物體判成較近。",
              "examFocus": [
                "relative motion 可用視差移動判斷前後",
                "texture 與 clarity：近處細節多且清楚",
                "shading 依光源方向推測凸面或凹面"
              ],
              "memory": "近的動得明顯、看得細、也看得清。",
              "visualPlan": "分成火車窗外、向日葵田、凸凹圓形、霧中山景四個小狀態，以切換控制逐一示範 relative motion、texture、shading、clarity，不能重複上一張走廊圖。",
              "drill": {
                "question": "遠方花田的花朵逐漸看不出單朵細節，主要是哪一種單眼線索？",
                "choices": [
                  "texture gradient",
                  "crossed disparity",
                  "fixation disparity",
                  "fusion"
                ],
                "answer": 0,
                "explain": "近處紋理細節清楚、遠處紋理逐漸密集模糊，稱 texture gradient。"
              }
            }
          ]
        },
        {
          "id": "binocular-stereopsis",
          "title": "雙眼把兩張不同照片合成深度",
          "summary": "左右眼位置不同，所以收到略不同影像；只要差異適中，大腦就能融像並感覺前後。",
          "studyPath": [
            "先理解 retinal disparity 與 fusion。",
            "再用 horopter 和 Panum 區域理解能不能單視。",
            "最後用 crossed / uncrossed disparity 判斷前後。"
          ],
          "points": [
            {
              "title": "Retinal disparity 加 fusion 產生 stereopsis",
              "simple": "左右眼像兩台相隔一點距離的相機；大腦把兩張略不同照片疊起來，就得到深度。",
              "text": "Retinal disparity 來自左右眼觀看角度不同。兩眼影像差異適中時，大腦可用 fusion 合成單一立體影像；若差異過大而無法融合，就會出現 diplopia。Stereoacuity 是能偵測到的最小深度差，以 seconds of arc 表示。",
              "examFocus": [
                "retinal disparity 是左右眼影像位置差",
                "fusion 成功產生 stereopsis；失敗可產生 diplopia",
                "stereoacuity 單位是 seconds of arc，數值越小越好"
              ],
              "memory": "有小差異才有立體；差太大就變雙影。",
              "visualPlan": "做拇指遮星星示範：切換左眼與右眼時拇指位置改變，再按 fusion 將兩張圖合成立體。加 disparity 滑桿，太大時顯示 diplopia。",
              "drill": {
                "question": "Stereoacuity 數值從 40 seconds of arc 改善到 10 seconds of arc，代表什麼？",
                "choices": [
                  "立體視變差",
                  "只能靠單眼線索",
                  "複視增加",
                  "可辨認更小的深度差，立體視更精細"
                ],
                "answer": 3,
                "explain": "Stereoacuity 是最小可偵測視差，數值越小代表越精細。"
              }
            },
            {
              "title": "Horopter 與 Panum's fusional area",
              "simple": "Horopter 是和注視點看起來同一深度的線；前後有一小段容許區，落在裡面仍能融合。",
              "text": "注視點影像落在兩眼 fovea。位於 horopter 的其他物體會落在對應視網膜點，形成 zero disparity，看起來與注視點同深度。Horopter 前後的 Panum's fusional area 容許少量不對應，仍可維持單視並產生深度；超出太多則可能複視。",
              "examFocus": [
                "horopter 上的物體為 zero disparity、看起來同深度",
                "Panum's fusional area 是 horopter 前後仍可融合的範圍",
                "超出融合範圍太多可能產生 diplopia"
              ],
              "memory": "圈上同深度，圈旁可立體，離圈太遠會雙影。",
              "visualPlan": "用俯視雙眼圖畫出 fixation、horopter 與 Panum 帶。拖曳 target 到圈上、圈前、圈後與區域外，分別顯示 same depth、front、behind、diplopia。",
              "drill": {
                "question": "物體落在 horopter 上時，最符合哪一項？",
                "choices": [
                  "crossed disparity",
                  "zero disparity",
                  "一定複視",
                  "exo fixation disparity"
                ],
                "answer": 1,
                "explain": "Horopter 上的物體落在兩眼對應視網膜點，屬 zero disparity。"
              }
            },
            {
              "title": "Crossed disparity 在前，uncrossed disparity 在後",
              "simple": "想把眼睛交叉看近物：交叉視差代表物體在注視點前；非交叉視差代表在後。",
              "text": "Target 位於 horopter 前方時產生 crossed disparity，融合後感覺物體較近；位於後方時產生 uncrossed disparity，融合後感覺物體較遠。多數立體視檢測利用 crossed disparity 讓圖形看起來浮出。",
              "examFocus": [
                "crossed disparity：target 在 fixation 前方",
                "uncrossed disparity：target 在 fixation 後方",
                "多數臨床 stereotest 以 crossed disparity 呈現浮出效果"
              ],
              "memory": "Crossed 往前浮；uncrossed 往後陷。",
              "visualPlan": "做可切換的左右眼半影像。Crossed 狀態讓圖形浮前，uncrossed 狀態讓圖形陷後，zero 狀態停在平面。顯示影像在左右眼的相對位置。",
              "drill": {
                "question": "立體視本中的圖形看起來浮到紙張前方，最可能使用哪種視差？",
                "choices": [
                  "uncrossed disparity",
                  "zero disparity",
                  "crossed disparity",
                  "fixation disparity"
                ],
                "answer": 2,
                "explain": "Crossed disparity 融合後會讓 target 感覺在注視平面前方。"
              }
            }
          ]
        },
        {
          "id": "disparity-development",
          "title": "視差不只一種，發展時間也會考",
          "summary": "相對視差最敏感；固視可以有小誤差；兒童早期雙眼視受干擾會明顯傷害立體視。",
          "studyPath": [
            "先比較相對視差與絕對視差。",
            "再理解 fixation disparity 是可容許的小誤差。",
            "最後記立體視發展與臨床重要性。"
          ],
          "points": [
            {
              "title": "相對視差比絕對視差敏感",
              "simple": "大腦最會做比較題：有注視點當尺，兩個物體互相比前後，比單獨猜一個位置更精準。",
              "text": "角度視差可分相對視差與絕對視差。相對視差會比較視標與可見注視參考點的視差；絕對視差只看視標相對注視軸的位置。人類視覺系統對相對視差更敏感。",
              "examFocus": [
                "角度視差是用角度表示的雙眼視差",
                "相對視差有可比較的注視參考點",
                "視覺系統對相對視差較敏感"
              ],
              "memory": "有參考點，深度判斷更準。",
              "visualPlan": "做兩欄角度圖：左欄顯示 fixation 與 target 可比較的 relative disparity；右欄隱藏 fixation，只剩 absolute disparity。用敏感度尺顯示左欄較精準。",
              "drill": {
                "question": "視覺系統通常對哪一種視差較敏感？",
                "choices": [
                  "relative disparity",
                  "absolute disparity",
                  "沒有差別",
                  "只有 monocular disparity"
                ],
                "answer": 0,
                "explain": "有 fixation reference 可做相對比較，因此 relative disparity 較敏感。"
              }
            },
            {
              "title": "Fixation disparity 是沒有複視的小固視誤差",
              "simple": "兩眼注視時不一定瞄得百分之百準；只要誤差很小，大腦仍能融合，不會看到兩個。",
              "text": "Fixation disparity 是 underconvergence 或 overconvergence 的微小誤差，但仍維持單視。Underconvergence 稱 exo fixation disparity，overconvergence 稱 eso fixation disparity。課堂數值提醒：外向誤差約 6 minutes of arc 內、內向誤差約 4 minutes of arc 內通常仍可融合。",
              "examFocus": [
                "fixation disparity 存在時仍沒有 diplopia",
                "underconvergence = exo fixation disparity",
                "overconvergence = eso fixation disparity"
              ],
              "memory": "少聚是 exo，多聚是 eso；小誤差仍可單視。",
              "visualPlan": "用俯視雙眼與注視點，滑桿切換 underconverge、aligned、overconverge。保持單一影像，超過課堂容許範圍時才顯示融合警告。",
              "drill": {
                "question": "眼睛稍微 underconverge，但患者仍沒有複視，稱為什麼？",
                "choices": [
                  "eso fixation disparity",
                  "exo fixation disparity",
                  "crossed diplopia",
                  "zero disparity"
                ],
                "answer": 1,
                "explain": "Underconvergence 對應 exo fixation disparity，且小誤差仍可維持融合。"
              }
            },
            {
              "title": "立體視是兒童雙眼視發展的警報器",
              "simple": "小朋友若兩眼沒有一起好好工作，立體視通常最早、最明顯下降，所以它很適合當篩檢。",
              "text": "Stereoacuity 約出生後 3-5 個月開始發展，約 6-9 歲接近成人程度，細膩立體視可持續成熟至約 12 歲。正常常見約 5-15 seconds of arc，最佳可達約 2 seconds。五歲前若斜視、弱視或其他問題破壞 binocular vision，立體視可能大幅下降。",
              "examFocus": [
                "立體視約出生後 3-5 個月開始發展",
                "五歲前 binocular vision 受干擾影響特別大",
                "正常 stereoacuity 常見 5-15 seconds of arc，數值越小越好"
              ],
              "memory": "五歲前雙眼一起用，立體視才長得好。",
              "visualPlan": "做 0 月到 12 歲發展時間軸，標出 3-5 月開始、5 歲敏感期、6-9 歲成人程度、約 12 歲細膩成熟；加入受干擾與正常兩條曲線。",
              "drill": {
                "question": "為什麼立體視檢查對幼兒雙眼視篩檢特別重要？",
                "choices": [
                  "立體視完全不受斜視影響",
                  "只要單眼視力好，立體視一定正常",
                  "五歲前雙眼視受干擾可使立體視大幅下降",
                  "立體視出生時已完全成熟"
                ],
                "answer": 2,
                "explain": "立體視依賴正常雙眼視發展，早期干擾會造成明顯下降。"
              }
            }
          ]
        },
        {
          "id": "stereo-tests",
          "title": "立體視檢查：先分 local 與 global",
          "summary": "局部測驗較容易但可能被單眼線索猜中；整體隨機點測驗較困難，也更能確認真正雙眼整合。",
          "studyPath": [
            "先比較 local 與 global 的核心差異。",
            "再把常見測驗配對到眼鏡與類型。",
            "最後用患者能力與作答方式判讀結果。"
          ],
          "points": [
            {
              "title": "局部測驗容易猜，整體測驗更依賴真正雙眼視",
              "simple": "局部測驗像看一隻有輪廓的蒼蠅，單眼也可能猜；整體測驗像在亂點中找圖，必須靠雙眼一起解碼。",
              "text": "局部立體視檢查使用小視標與中央視覺，常包含輪廓、陰影等單眼線索，例如 Titmus 蒼蠅。整體立體視檢查使用較大視網膜範圍與隨機點，需要圖像背景區分和更多神經處理，通常沒有可用的單眼深度線索。",
              "examFocus": [
                "局部測驗：中央視覺、小視標，可能含單眼線索",
                "整體測驗：隨機點、圖像背景區分、較困難",
                "雙眼視較弱者可能通過局部測驗，卻無法通過整體測驗"
              ],
              "memory": "Local 可猜；global 要真的兩眼合作。",
              "visualPlan": "左欄做 Titmus 輪廓蒼蠅並顯示單眼可猜線索；右欄做 random-dot 隱藏圖形，切換單眼時圖形消失。不要畫儀器。",
              "drill": {
                "question": "患者能通過 Titmus local stereotest，卻無法通過 random-dot global stereotest，最合理的解釋是？",
                "choices": [
                  "患者一定沒有任何視覺",
                  "local 的單眼線索可能幫助作答",
                  "global 比 local 更容易",
                  "Titmus 不需要中央視覺"
                ],
                "answer": 1,
                "explain": "Local 測驗可能含單眼線索，弱雙眼視患者仍可能猜對。"
              }
            },
            {
              "title": "測驗與眼鏡配對：偏光、紅綠、無測試鏡",
              "simple": "不同測驗只是用不同方法把左右眼影像分開：偏光、紅綠，或直接利用測試板本身。",
              "text": "Titmus、Randot 與部分隨機點測驗常使用偏光測試鏡。TNO 是課堂中特別強調使用紅綠測試鏡的測驗。Frisby 與 Lang 立體視檢查不需偏光或紅綠鏡，適合不願戴測試鏡的幼童；但 Frisby 偏頭觀看可能帶來單眼線索。",
              "examFocus": [
                "TNO 使用紅綠測試鏡",
                "Frisby 與 Lang 不需要測試眼鏡",
                "Frisby 偏頭或移動可能產生單眼線索"
              ],
              "memory": "TNO 用紅綠鏡；Frisby、Lang 不需測試鏡。",
              "visualPlan": "做測驗配對桌：Titmus/Randot 放偏光鏡、TNO 放紅綠鏡、Frisby/Lang 放無眼鏡圖示。點各測驗展開用途與限制。",
              "drill": {
                "question": "下列哪一個立體視測驗使用 red-green glasses？",
                "choices": [
                  "Titmus 蒼蠅",
                  "Frisby",
                  "TNO",
                  "Lang"
                ],
                "answer": 2,
                "explain": "TNO 是課堂中特別強調使用紅綠鏡的隨機點立體視檢查。"
              }
            },
            {
              "title": "檢查時先防止猜題，再看最小 seconds of arc",
              "simple": "先確認患者不是靠輪廓、偏頭或偷看猜答案，再把最後能通過的最小秒角記成立體視力。",
              "text": "立體視多在近距離測量。檢查者需確認測試距離、測試鏡與雙眼都正確使用，並避免患者靠單眼線索或改變觀看角度猜題。能辨認的 disparity 越小，stereoacuity 越好；global 測驗失敗也可能提示較弱 binocular vision。",
              "examFocus": [
                "stereoacuity 記錄最小可辨認 seconds of arc",
                "數值越小代表越好的立體視力",
                "要排除輪廓、偏頭、移動等單眼猜題線索"
              ],
              "memory": "先防猜，再記最小秒角；越小越好。",
              "visualPlan": "做臨床檢查流程板：正確距離、戴對測試鏡、雙眼觀看、防止偏頭猜題、記錄最小秒角。使用 stepper，最後輸出 stereoacuity。",
              "drill": {
                "question": "立體視檢查結果 20 seconds of arc 與 100 seconds of arc 相比，哪一個較好？",
                "choices": [
                  "100，因為數字較大",
                  "兩者完全相同",
                  "不能比較",
                  "20，因為可辨認更小視差"
                ],
                "answer": 3,
                "explain": "Stereoacuity 是最小可辨認視差，數值越小越精細。"
              }
            }
          ]
        }
      ],
      "quiz": [
        {
          "question": "真正 stereopsis 最核心需要什麼？",
          "choices": [
            "單眼清晰度即可",
            "兩眼略不同影像與 fusion",
            "只有 shading",
            "只有相對大小線索"
          ],
          "answer": 1,
          "explain": "真正立體視來自兩眼影像視差經大腦融像。"
        },
        {
          "question": "視標位於注視平面前方時，通常產生？",
          "choices": [
            "crossed disparity",
            "uncrossed disparity",
            "zero disparity",
            "只有 fixation disparity"
          ],
          "answer": 0,
          "explain": "Crossed disparity 代表 target 在注視平面前方。"
        },
        {
          "question": "哪一項最符合 global stereotest？",
          "choices": [
            "一定有清楚輪廓可單眼猜",
            "只測角膜曲率",
            "使用 random dots 並需 figure-ground discrimination",
            "只需單眼觀看"
          ],
          "answer": 2,
          "explain": "Global 測驗以 random dots 為主，需要較廣泛雙眼神經整合。"
        },
        {
          "question": "下列哪個測驗不需要偏光或紅綠測試鏡？",
          "choices": [
            "TNO",
            "Titmus 蒼蠅",
            "Randot",
            "Lang stereotest"
          ],
          "answer": 3,
          "explain": "Lang 與 Frisby 可不戴測試眼鏡。"
        }
      ],
      "roadmap": [
        "先分清：單眼深度線索只能猜前後，真正立體視需要雙眼。",
        "再理解：左右眼影像有小差異，大腦用 fusion 把它變成深度。",
        "接著判斷：crossed 在前、uncrossed 在後，horopter 上是 zero disparity。",
        "最後比較：local 可能被猜中，global 更依賴真正雙眼視。"
      ]
    },
    {
      "id": "near-point",
      "code": "09",
      "shortTitle": "NPA / NPC",
      "title": "近點調節 NPA 與近點聚合 NPC",
      "file": "near-point.html",
      "status": "active",
      "summary": "先懂眼睛如何對焦與向內聚合，再學調節幅度、NPA、NPC 的測法、正常值與異常判讀。",
      "sources": [
        "9-acc+and+conv_sp26.pdf",
        "逐字稿 - 09 近點調節與近點聚合：NPA、NPC與調節幅度（2）.docx"
      ],
      "sections": [
        {
          "id": "accommodation-basics",
          "title": "調節：把水晶體變厚，讓近物重新清楚",
          "summary": "調節是改變水晶體正屈光力的對焦功能；幅度、準確度與速度是三個不同面向。",
          "studyPath": [
            "先走一次看近時的肌肉與水晶體變化。",
            "再分清 amplitude、response、facility。",
            "最後用 far point 與 near point 算調節幅度。"
          ],
          "points": [
            {
              "title": "看近時：睫狀肌收縮，水晶體變圓",
              "simple": "看近就像把眼內鏡片調得更凸：睫狀肌收縮、懸韌帶放鬆、水晶體變厚，正度數增加。",
              "text": "Accommodation 讓眼睛在不同距離維持清楚。看近時 ciliary muscle 收縮，使 zonules 放鬆，crystalline lens 回到較圓、較厚的形狀，增加正屈光力並把焦點拉回視網膜；調節量以 diopter 表示。",
              "examFocus": [
                "ciliary muscle 收縮",
                "zonules 放鬆，crystalline lens 變厚變圓",
                "水晶體正屈光力增加，單位為 D"
              ],
              "memory": "肌肉收、韌帶鬆、晶體胖，近物清。",
              "visualPlan": "做遠看與近看兩狀態的水晶體剖面，精準顯示 ciliary muscle、zonules、lens 曲率與焦點。按鈕切換時只改變正確結構，不做漂浮動畫。",
              "drill": {
                "question": "看近發生調節時，下列何者正確？",
                "choices": [
                  "睫狀肌放鬆，懸韌帶拉緊",
                  "水晶體變薄，正屈光力下降",
                  "睫狀肌收縮，水晶體變厚",
                  "角膜曲率主動大幅改變"
                ],
                "answer": 2,
                "explain": "看近時睫狀肌收縮、懸韌帶放鬆，水晶體變圓變厚。"
              }
            },
            {
              "title": "調節三面向：能力、準確度、切換速度",
              "simple": "Amplitude 問最多能對焦多少；response 問有沒有對準；facility 問遠近切換快不快。",
              "text": "Amplitude of accommodation 是最大調節能力。Accommodative response 描述實際反應是否落在需求上，過度稱 lead、不足稱 lag。Accommodative facility 則是焦點在遠近之間快速切換的能力。",
              "examFocus": [
                "amplitude：最大 focusing ability",
                "response：lead 或 lag，反映準確度",
                "facility：改變焦點的速度與彈性"
              ],
              "memory": "Amplitude 看最大，response 看準不準，facility 看快不快。",
              "visualPlan": "做三站式對焦面板：最大重量代表 amplitude、靶心代表 response、遠近切換計時器代表 facility。點擊只顯示該項臨床問題。",
              "drill": {
                "question": "患者遠近轉換時要等很久才清楚，最直接反映哪一面向？",
                "choices": [
                  "facility",
                  "amplitude",
                  "corneal power",
                  "pupil diameter"
                ],
                "answer": 0,
                "explain": "Facility 描述調節焦點切換的速度與彈性。"
              }
            },
            {
              "title": "FP、NP 與 AA：清楚範圍的兩個邊界",
              "simple": "FP 是最遠清楚點，NP 是最近清楚點；兩者用屈光度相減，就是調節幅度。",
              "text": "Far point 是調節完全放鬆時最遠清楚點；near point 是最大調節時最近清楚點；兩者之間是 range of clear vision。完全矯正或正視眼的 FP 在無限遠，因此 AA 等於 NP 的屈光度；未完全矯正時 AA = NP - FP，且距離需先轉成 diopter。",
              "formula": "AA = NP(D) - FP(D)；完全矯正時 FP = 0D，所以 AA = NP(D)",
              "examFocus": [
                "FP：調節放鬆時最遠清楚點",
                "NP / NPA：最大調節時最近清楚點",
                "同樣 NPA 距離不代表相同 AA，仍要看 FP"
              ],
              "memory": "清楚範圍兩端是 FP 和 NP；幅度就是 NP 減 FP。",
              "visualPlan": "做一條從眼睛延伸的清楚範圍尺，可切換 emmetrope、myope、low hyperope、high hyperope，顯示 FP/NP 位置與 AA 計算。",
              "drill": {
                "question": "完全矯正患者的 NPA 為 10 cm，調節幅度約為多少？",
                "choices": [
                  "2.50D",
                  "5.00D",
                  "8.00D",
                  "10.00D"
                ],
                "answer": 3,
                "explain": "10 cm = 0.10 m，1/0.10 = 10D；完全矯正時 AA 等於 NP 屈光度。"
              }
            }
          ]
        },
        {
          "id": "amplitude-interpretation",
          "title": "調節幅度：先看年齡，再判斷是不是異常",
          "summary": "調節會隨年齡下降；臨床最重要的是實測值是否低於該年齡的最低預期值。",
          "studyPath": [
            "先用 Hofstetter 公式找年齡預期值。",
            "再把症狀連到 accommodative insufficiency。",
            "最後遇到兩眼不對稱時找原因。"
          ],
          "points": [
            {
              "title": "Hofstetter 公式：最低值最重要",
              "simple": "年紀越大，調節越少；臨床先算最低應有值，實測比它低才要警覺。",
              "text": "Age 是 amplitude of accommodation 最重要的決定因素。Hofstetter 公式可估最低、平均與最高值：minimum = 15 - 0.25(age)，mean = 18.5 - 0.3(age)，maximum = 25 - 0.4(age)。臨床判斷 accommodative insufficiency 時，最低預期值最重要。",
              "formula": "Minimum AA = 15 - 0.25(age)；Mean = 18.5 - 0.3(age)；Maximum = 25 - 0.4(age)",
              "examFocus": [
                "年齡是 AA 最佳決定因素",
                "低於 Hofstetter minimum 才特別支持調節不足",
                "舒適近用通常使用不超過總 AA 的一半"
              ],
              "memory": "最低值：15 減四分之一歲數。",
              "visualPlan": "做年齡滑桿與三條 Hofstetter 曲線，輸出 minimum/mean/maximum。另用半滿電池顯示舒適調節不超過總幅度一半。",
              "drill": {
                "question": "20 歲患者依 Hofstetter minimum 預期至少應有多少 AA？",
                "choices": [
                  "5D",
                  "10D",
                  "13D",
                  "15D"
                ],
                "answer": 1,
                "explain": "15 - 0.25×20 = 10D。"
              }
            },
            {
              "title": "調節不足會讓近距離工作撐不久",
              "simple": "不是完全看不到近物，而是看一下就糊、累、額頭痛，閱讀耐力變差。",
              "text": "調節不足常在長時間近距離工作後出現間歇模糊、眼疲勞、全身疲倦、額頭痛與閱讀能力下降。藥物、近期疾病與水晶體狀態也會影響 AA。年輕患者可考慮正鏡片或視覺訓練；老花造成的自然老化無法靠訓練恢復。",
              "examFocus": [
                "典型症狀集中在持續近距離工作",
                "正鏡片可降低近用調節需求",
                "非老花患者可考慮視覺訓練"
              ],
              "memory": "近看一下就糊又累，先想調節不足。",
              "visualPlan": "做閱讀時間軸：開始清楚，持續近用後出現 intermittent blur、眼疲勞、額頭痛。切換 plus lens 後降低調節負荷；不要畫通用水晶體。",
              "drill": {
                "question": "年輕患者看近一段時間後反覆模糊、眼疲勞，且 AA 低於年齡最低值，最符合？",
                "choices": [
                  "accommodative insufficiency",
                  "正常立體視",
                  "角膜過陡",
                  "RAPD"
                ],
                "answer": 0,
                "explain": "近距離症狀加上低於 Hofstetter minimum 的 AA 支持調節不足。"
              }
            },
            {
              "title": "兩眼 AA 差超過 1D，要找原因",
              "simple": "兩眼調節能力應接近；單眼明顯變差不是小事，要先排除度數、藥物、發炎與神經問題。",
              "text": "兩眼 AA 差異應小於約 1.00D。單眼 AA 下降合併瞳孔散大可能涉及副交感路徑。其他原因包括屈光不正改變、雙眼平衡不良、睫狀體發炎或創傷、單眼接觸抗膽鹼藥物，以及測試技術不一致。",
              "examFocus": [
                "兩眼 AA 差異應小於約 1.00D",
                "單眼 AA 下降加瞳孔散大要警覺神經問題",
                "先確認屈光矯正、藥物、眼健康與測試方法"
              ],
              "memory": "差超過 1D 不要只重測，要找原因。",
              "visualPlan": "做左右眼比較儀表，差值超過 1D 時展開原因分流：屈光、平衡、發炎創傷、抗膽鹼藥、parasympathetic、測試誤差。",
              "drill": {
                "question": "右眼 AA 明顯下降且右瞳孔散大，最需要優先考慮哪一類問題？",
                "choices": [
                  "單純單眼深度線索",
                  "角膜色階",
                  "副交感神經相關問題",
                  "正常年齡變化一定只影響右眼"
                ],
                "answer": 2,
                "explain": "調節與縮瞳共享副交感路徑，單眼 AA 下降合併散瞳需警覺神經問題。"
              }
            }
          ]
        },
        {
          "id": "npa-methods",
          "title": "NPA 與三種調節幅度測法",
          "summary": "所有方法都在找調節極限，但移動方向、終點與系統性偏差不同。",
          "studyPath": [
            "先學最常用的推近法與持續模糊終點。",
            "再比較拉遠法的清楚終點。",
            "最後理解負鏡片模糊法的公式與低估。"
          ],
          "points": [
            {
              "title": "Push-up：從 40 cm 推近到持續模糊",
              "simple": "把小字慢慢推近，第一次模糊可能只是閃一下；真正終點是再用力也清不回來的持續模糊。",
              "text": "雙眼推近法是快速初步篩檢，視標放在正前方約 40 cm，以每秒約 5 cm 推近，患者報持續模糊時記錄，並觀察雙眼是否持續內聚。單眼推近法則遮一眼、視標放在受測眼視軸上，可比較左右眼；終點需來回夾逼確認，距離量到鼻樑或眼鏡平面。",
              "examFocus": [
                "起始約 40 cm，推近速度每秒約 5 cm",
                "終點是持續模糊，不是第一次短暫模糊",
                "push-up 因 target 變大可能稍微高估 AA"
              ],
              "memory": "40 公分開始，慢慢推，持續糊才停。",
              "visualPlan": "做近點桿動畫，target 從 40 cm 以 5 cm/sec 靠近。顯示 transient blur 與 sustained blur 差異，並同步顯示雙眼內聚與量測平面。",
              "drill": {
                "question": "Push-up NPA 的正確終點是？",
                "choices": [
                  "第一次眨眼",
                  "target 碰到鼻子",
                  "患者報持續模糊",
                  "患者看到 diplopia 才停止"
                ],
                "answer": 2,
                "explain": "NPA 的終點是持續模糊，患者再努力也無法恢復清楚。"
              }
            },
            {
              "title": "Pull-away：從模糊拉遠到第一次清楚",
              "simple": "小朋友不一定懂什麼叫模糊；從很近拉遠，等他能說出圖案，終點通常比較容易回答。",
              "text": "拉遠法使用與推近法相同的照明與視標，但從近處模糊位置往遠處移動，患者第一次報清楚時記錄。它適合幼童，但因視標越拉越小，可能稍微低估 AA。推近法與拉遠法可重複並平均，以減少各自偏差。",
              "examFocus": [
                "拉遠法終點是第一次清楚",
                "對幼童較容易理解",
                "pull-away 可能低估，push-up 可能高估"
              ],
              "memory": "推近找糊，拉遠找清；一高估、一低估。",
              "visualPlan": "做 push-up 與 pull-away 並排動畫，顯示 target 視角變大/變小與偏差方向。讓使用者選 endpoint，立即提示高估或低估。",
              "drill": {
                "question": "Pull-away 法特別適合幼童的主要原因是？",
                "choices": [
                  "不需要任何視標",
                  "孩子較容易回報何時看清楚圖案",
                  "一定比所有方法精準",
                  "只測 convergence"
                ],
                "answer": 1,
                "explain": "幼童通常比起描述模糊，更容易說出何時能看清楚圖案。"
              }
            },
            {
              "title": "Minus lens to blur：負鏡片量加上 2.50D",
              "simple": "40 cm 本來就需要 2.50D 調節，再加多少負鏡片才持續模糊，就把那個量一起加上去。",
              "text": "負鏡片模糊法是單眼測試，患者戴遠用處方，近用視標固定在 40 cm。每 1-2 秒加入 -0.25D，直到出現輕微且持續模糊。AA 等於加入負鏡片度數的絕對值再加 2.50D；因負鏡片使影像縮小，結果通常比推近法低約 2D。",
              "formula": "AA = |加入的負鏡片度數| + 2.50D（視標固定在 40 cm）",
              "examFocus": [
                "單眼、distance Rx、40 cm near target",
                "每次 -0.25D，1-2 秒後再加",
                "結果通常比 push-up 低約 2D"
              ],
              "memory": "40 cm 先有 2.50D，再加負鏡片絕對值。",
              "visualPlan": "做 phoropter 近點卡，按鈕逐次加入 -0.25D，顯示影像縮小與 blur。旁邊即時計算 |minus| + 2.50D。",
              "drill": {
                "question": "40 cm 測 minus lens to blur，加入 -5.00D 時達 sustained blur，AA 為多少？",
                "choices": [
                  "2.50D",
                  "5.00D",
                  "7.50D",
                  "10.00D"
                ],
                "answer": 2,
                "explain": "|-5.00| + 2.50 = 7.50D。"
              }
            }
          ]
        },
        {
          "id": "npc",
          "title": "NPC：兩眼最多能往內聚到哪裡",
          "summary": "NPA 找模糊點，NPC 找單一影像破裂點；兩者終點、單位與異常意義完全不同。",
          "studyPath": [
            "先分清 version、vergence、convergence。",
            "再學 NPC 的 break、recovery 與正常值。",
            "最後用不同 target 比較找 convergence insufficiency。"
          ],
          "points": [
            {
              "title": "Version 同方向，vergence 反方向",
              "simple": "兩眼一起往右叫 version；看近時兩眼朝鼻側叫 convergence，是 vergence 的一種。",
              "text": "Version 描述兩眼往相同方向移動。Vergence 描述兩眼往相反方向移動，其中 convergence 是兩眼向內，divergence 是兩眼向外。NPC 測的是雙眼最大 convergence 能力，不是調節模糊極限。",
              "examFocus": [
                "version：兩眼同方向",
                "vergence：兩眼反方向",
                "convergence 向內、divergence 向外"
              ],
              "memory": "Version 同向走；vergence 反向開合。",
              "visualPlan": "做俯視雙眼控制器，按 version right、convergence、divergence 三鍵，精確旋轉兩眼並顯示視軸方向。",
              "drill": {
                "question": "看近物時兩眼同時朝鼻側轉動，稱為？",
                "choices": [
                  "version",
                  "convergence",
                  "divergence",
                  "accommodative lag"
                ],
                "answer": 1,
                "explain": "兩眼朝相反方向並向內轉動稱 convergence。"
              }
            },
            {
              "title": "NPC 記破裂點 / 恢復點，不是模糊點",
              "simple": "把目標移近，影像第一次變兩個或看到一眼跑出去是 break；拉遠重新變一個是 recovery。",
              "text": "NPC 是視軸最大交叉點，臨床從顏面量距離。破裂點可由患者報複視，或檢查者看到一眼外轉；拉遠至重新單一為恢復點。記錄格式是破裂點/恢復點 cm，也可記 TTN；若患者不報雙影但一眼外轉，需記抑制與眼別。",
              "examFocus": [
                "NPC 終點是破裂點，不是持續模糊",
                "平均 break 約 5 cm；大於 9 cm 異常",
                "recovery 應在 break 後 7 cm 以內"
              ],
              "memory": "NPA 停在糊；NPC 停在裂，拉遠再合。",
              "visualPlan": "做 NPC target 靠近動畫，顯示雙眼持續內聚、break 時一眼外轉/患者雙影、recovery 時重新單一。尺規標出 5 cm、9 cm 與 recovery 差距。",
              "drill": {
                "question": "NPC 記錄 12/22 cm，最需要注意哪一項？",
                "choices": [
                  "break 大於 9 cm，且 recovery 距 break 超過 7 cm",
                  "完全正常，因兩數都大於 5",
                  "這是 NPA 持續模糊",
                  "代表 TTN"
                ],
                "answer": 0,
                "explain": "Break 12 cm 已大於 9 cm；recovery 比 break 遠 10 cm，也超過 7 cm。"
              }
            },
            {
              "title": "不同 target 的 NPC 差很多，要想 convergence insufficiency",
              "simple": "有細節的字會用調節幫忙內聚；筆燈幫助較少。兩者差太多，代表純內聚能力可能不足。",
              "text": "NPC 可用調節性視標、筆燈或紅色鏡片加筆燈。老花者常用非調節性視標，避免把模糊與複視混淆。若調節性視標與筆燈或紅色鏡片測得的破裂點相差超過 5 cm，或恢復點相差超過 8 cm，需考慮內聚不足。症狀可包含複視、額頭痛、眼疲勞、全身疲倦、想睡與閱讀能力下降。",
              "examFocus": [
                "調節性視標會提供調節性內聚幫助",
                "break 差 >5 cm 或 recovery 差 >8 cm 要警覺 CI",
                "老花者宜用非調節性視標"
              ],
              "memory": "字卡有調節幫忙；燈光差很多，想 CI。",
              "visualPlan": "做三種 NPC target 比較器：字卡、penlight、red lens + penlight。輸入 break/recovery 後自動比較 5 cm 與 8 cm 門檻，顯示是否需警覺 CI。",
              "drill": {
                "question": "Accommodative target 與 penlight 測得的 NPC break 相差 7 cm，最應考慮？",
                "choices": [
                  "正常差異，不需理會",
                  "RAPD",
                  "convergence insufficiency",
                  "角膜散光"
                ],
                "answer": 2,
                "explain": "不同 target 的 break 相差超過 5 cm，需警覺 convergence insufficiency。"
              }
            }
          ]
        }
      ],
      "quiz": [
        {
          "question": "看近調節時，水晶體如何改變？",
          "choices": [
            "變薄、正度數下降",
            "變厚變圓、正度數增加",
            "完全不變",
            "只改變角膜"
          ],
          "answer": 1,
          "explain": "睫狀肌收縮使懸韌帶放鬆，水晶體變厚變圓。"
        },
        {
          "question": "NPA push-up 的 endpoint 是？",
          "choices": [
            "break/diplopia",
            "recovery",
            "sustained blur",
            "TTN"
          ],
          "answer": 2,
          "explain": "NPA 找持續模糊；NPC 才找 break。"
        },
        {
          "question": "下列哪個 NPC break 值屬異常警訊？",
          "choices": [
            "3 cm",
            "5 cm",
            "8 cm",
            "12 cm"
          ],
          "answer": 3,
          "explain": "NPC break 大於 9 cm 視為異常。"
        },
        {
          "question": "Minus lens to blur 在 40 cm 加到 -4.00D 持續模糊，AA 為？",
          "choices": [
            "6.50D",
            "4.00D",
            "2.50D",
            "1.50D"
          ],
          "answer": 0,
          "explain": "|-4.00| + 2.50 = 6.50D。"
        }
      ],
      "roadmap": [
        "先懂看近：睫狀肌收縮、水晶體變厚，調節力增加。",
        "再算能力：FP 與 NP 決定 AA，年齡用 Hofstetter minimum 判斷。",
        "接著會測 NPA：push-up 找糊、pull-away 找清、minus lens 要加 2.50D。",
        "最後分清 NPC：找 break/recovery，break 大於 9 cm 要警覺。"
      ]
    }
  ],
  "terms": [
    [
      "PD",
      "瞳距（pupillary distance）",
      "兩眼瞳孔中心的距離，用來讓鏡片光心對準眼睛，避免多餘稜鏡。"
    ],
    [
      "pupillary distance",
      "瞳距",
      "配鏡定位的核心距離，決定左右鏡片光學中心要放在哪裡。"
    ],
    [
      "DBOC",
      "雙眼光心距離（distance between optical centers）",
      "左右鏡片光心之間的距離；和 PD 不合時會產生稜鏡效果。"
    ],
    [
      "prism",
      "稜鏡",
      "改變光線方向，讓影像往稜鏡尖端方向看起來移動，臨床上用來補償眼位或檢查偏位。"
    ],
    [
      "base in",
      "底向內",
      "稜鏡底朝鼻側，常用於處理外斜或改變水平影像位置。"
    ],
    [
      "base out",
      "底向外",
      "稜鏡底朝顳側，常用於處理內斜或增加集合需求。"
    ],
    [
      "base up",
      "底向上",
      "稜鏡底朝上，會讓影像往下移，常用在垂直偏位補償。"
    ],
    [
      "base down",
      "底向下",
      "稜鏡底朝下，會讓影像往上移，常用在垂直偏位補償。"
    ],
    [
      "front vertex power",
      "前頂點屈光力",
      "從鏡片前表面頂點量到的屈光力，多焦近用區常用這個概念。"
    ],
    [
      "back vertex power",
      "後頂點屈光力",
      "從鏡片後表面頂點量到的屈光力，單焦處方驗配通常重視它。"
    ],
    [
      "single vision",
      "單焦鏡片",
      "整片鏡片主要提供一個度數，用於單一距離的清楚視力。"
    ],
    [
      "multifocal",
      "多焦鏡片",
      "同一片鏡片有遠、中、近不同焦度區，用來處理老花或多距離需求。"
    ],
    [
      "PAL",
      "漸進多焦鏡片（progressive addition lens）",
      "遠用到近用度數連續變化，沒有明顯分界線，但兩側有變形區。"
    ],
    [
      "ADD",
      "近用加入度",
      "近用區比遠用區多加的正度數，主要用來補償老花的調節不足。"
    ],
    [
      "Keplerian telescope",
      "克卜勒式望遠鏡",
      "兩片凸透鏡形成放大影像，視野較大但影像會倒立，需要轉像系統。"
    ],
    [
      "Galilean telescope",
      "伽利略式望遠鏡",
      "凸物鏡加凹目鏡，影像正立、系統較短，但視野通常較小。"
    ],
    [
      "standard lens",
      "標準鏡片",
      "焦度計內用來建立基準或比較的已知鏡片。"
    ],
    [
      "lens stop",
      "鏡片靠座",
      "讓鏡片在焦度計上穩定定位，減少讀值因位置改變而漂移。"
    ],
    [
      "sphere",
      "球面度數",
      "所有方向屈光力相同，用來矯正近視或遠視的主要度數。"
    ],
    [
      "cylinder",
      "柱鏡度數",
      "只在特定方向增加或減少屈光力，用來矯正散光。"
    ],
    [
      "axis",
      "散光軸度",
      "柱鏡不產生屈光力的方向；它標示方向，不是強弱。"
    ],
    [
      "bracketing",
      "夾逼法",
      "在兩個反應之間來回縮小範圍，用來更精準找到中和或最佳值。"
    ],
    [
      "streak",
      "線狀光帶",
      "檢影鏡投出的線形光，用來判斷不同主經線的順動、逆動和中和。"
    ],
    [
      "plane mirror effect",
      "平面鏡效應",
      "檢影鏡套筒在特定位置時形成發散光，判讀順逆動要依這個狀態。"
    ],
    [
      "concave mirror effect",
      "凹面鏡效應",
      "檢影鏡套筒改變成收斂光狀態，順逆動判讀會和另一模式不同。"
    ],
    [
      "working lens",
      "工作距離鏡片",
      "用鏡片補償檢查者工作距離造成的屈光偏差，最後處方要扣除。"
    ],
    [
      "objective refraction",
      "客觀驗光",
      "不依賴病人主觀回答，由檢查者或儀器估計屈光狀態。"
    ],
    [
      "subjective refraction",
      "主觀驗光",
      "根據病人的清晰度回饋微調處方，是最後配鏡的重要步驟。"
    ],
    [
      "autorefractor",
      "自動驗光機",
      "快速估算屈光度數的儀器，適合作起點但不能完全取代主觀驗光。"
    ],
    [
      "corneal topographer",
      "角膜地形圖儀",
      "量測角膜表面形狀並用顏色地圖呈現不規則彎曲。"
    ],
    [
      "corneal astigmatism",
      "角膜散光",
      "由角膜兩條主子午線彎曲度不同造成的散光成分。"
    ],
    [
      "flat K",
      "較平 K 值",
      "角膜較平的主子午線讀值，常和較陡 K 值一起判斷散光。"
    ],
    [
      "steep K",
      "較陡 K 值",
      "角膜較陡的主子午線讀值，數值通常較高。"
    ],
    [
      "WTR",
      "順規散光（with-the-rule）",
      "垂直子午線較陡的常見散光型態。"
    ],
    [
      "with-the-rule",
      "順規散光",
      "角膜垂直方向較陡，處方軸位常接近 180 度。"
    ],
    [
      "ATR",
      "逆規散光（against-the-rule）",
      "水平子午線較陡的散光型態。"
    ],
    [
      "against-the-rule",
      "逆規散光",
      "角膜水平方向較陡，處方軸位常接近 90 度。"
    ],
    [
      "oblique astigmatism",
      "斜向散光",
      "主軸不接近水平或垂直，而落在斜向角度的散光。"
    ],
    [
      "Javal's rule",
      "Javal 法則",
      "用角膜散光估計總散光的經驗法則，提醒還有內部散光影響。"
    ],
    [
      "residual astigmatism",
      "殘餘散光",
      "角膜散光以外，由晶狀體或眼內結構造成的散光成分。"
    ],
    [
      "MCR",
      "角膜反射像清楚且規則",
      "Mires Clear and Regular 的縮寫，是角膜曲率儀的紀錄用語，代表 mire 影像清楚規則、K 值較可信。"
    ],
    [
      "keratoconus",
      "圓錐角膜",
      "角膜局部變薄前凸，造成不規則散光與地形圖局部變陡。"
    ],
    [
      "heat map",
      "熱圖",
      "用顏色表示數值高低，角膜圖上常用暖色表示較陡、冷色表示較平。"
    ],
    [
      "miosis",
      "縮瞳",
      "瞳孔變小，多由副交感作用或交感不足造成。"
    ],
    [
      "mydriasis",
      "散瞳",
      "瞳孔變大，多由交感作用或副交感不足造成。"
    ],
    [
      "anisocoria",
      "瞳孔不等大",
      "兩眼瞳孔大小不同；亮暗環境的差異可幫助定位病灶。"
    ],
    [
      "near triad",
      "近反應三聯",
      "看近時同時出現調節、集合、縮瞳三個反應。"
    ],
    [
      "accommodation",
      "調節",
      "晶狀體增加屈光力，讓近距離物體成像在視網膜上。"
    ],
    [
      "convergence",
      "集合",
      "兩眼向內轉以對準近距離目標。"
    ],
    [
      "direct response",
      "直接光反射",
      "光照某眼時，同一眼瞳孔縮小的反應。"
    ],
    [
      "consensual response",
      "間接光反射",
      "光照某眼時，另一眼也縮瞳的反應。"
    ],
    [
      "swinging flashlight test",
      "交替遮光檢查",
      "快速交替照兩眼，用來偵測 RAPD 這種傳入路不對稱。"
    ],
    [
      "Marcus Gunn pupil",
      "Marcus Gunn 瞳孔",
      "RAPD 的另一名稱，表示患眼傳入光訊號相對不足。"
    ],
    [
      "afferent pathway",
      "傳入路徑",
      "把光刺激從視網膜經視神經送到中樞的路徑。"
    ],
    [
      "efferent pathway",
      "傳出路徑",
      "把中樞縮瞳命令經動眼神經送到瞳孔括約肌的路徑。"
    ],
    [
      "light-near dissociation",
      "光近分離",
      "光反射差但近反應保留，提示反射路徑與近反應路徑受影響程度不同。"
    ],
    [
      "CN III palsy",
      "第三對腦神經麻痺",
      "可能造成散瞳、眼瞼下垂與眼球運動異常，是大瞳孔鑑別重點。"
    ],
    [
      "ciliary ganglion",
      "睫狀神經節",
      "副交感縮瞳與調節路徑的中繼站，受損可造成 Adie 類表現。"
    ],
    [
      "pilocarpine",
      "匹羅卡品",
      "副交感致效劑，可用稀釋濃度測試去神經後超敏感。"
    ],
    [
      "Argyll Robertson pupil",
      "Argyll Robertson 瞳孔",
      "常見光近分離，小而不規則，經典上和神經梅毒相關。"
    ],
    [
      "neurosyphilis",
      "神經梅毒",
      "梅毒侵犯神經系統，可和 Argyll Robertson 瞳孔相關。"
    ],
    [
      "ptosis",
      "眼瞼下垂",
      "上眼瞼位置下降，可見於動眼神經麻痺或 Horner syndrome。"
    ],
    [
      "anhidrosis",
      "無汗",
      "交感路徑受損後汗腺功能下降，是 Horner syndrome 可能伴隨的表現。"
    ],
    [
      "dilation lag",
      "散瞳延遲",
      "暗處患側瞳孔散大較慢，是 Horner syndrome 的重要觀察點。"
    ],
    [
      "cocaine",
      "古柯鹼試驗藥物",
      "阻斷 norepinephrine 再吸收；Horner 患側因交感釋放不足而較不散瞳。"
    ],
    [
      "hydroxyamphetamine",
      "羥安非他命",
      "促使末梢釋放 norepinephrine，可幫助區分 Horner 病灶位置。"
    ],
    [
      "norepinephrine",
      "正腎上腺素",
      "交感神經末梢釋放的神經傳遞物，負責促進散瞳等反應。"
    ],
    [
      "denervation supersensitivity",
      "去神經後超敏感",
      "神經支配減少後，目標組織對低濃度藥物反應變強。"
    ],
    [
      "Müller muscle",
      "Müller 肌",
      "由交感支配的上眼瞼平滑肌，受損會造成 Horner 的輕度 ptosis。"
    ],
    [
      "lensometer",
      "焦度計/驗度儀",
      "測鏡片頂點度數、散光、軸位、光學中心與稜鏡量。"
    ],
    [
      "reticle",
      "標線",
      "焦度計內固定參考線，測量前要先調清楚。"
    ],
    [
      "movable target",
      "可移動視標",
      "焦度計中會隨 power wheel 前後移動、用來判斷鏡片度數的目標。"
    ],
    [
      "MRP",
      "主要參考點",
      "prescribed prism 的定位點，配鏡與驗證稜鏡時用來標記。"
    ],
    [
      "OC",
      "光學中心",
      "通過此點不產生稜鏡效果；OC 與瞳孔不對位會誘發稜鏡。"
    ],
    [
      "Prentice's rule",
      "普倫提斯法則",
      "P = dF，用去中心距離與鏡片度數估算誘發稜鏡。"
    ],
    [
      "retinoscopy",
      "視網膜檢影",
      "用眼底反射光客觀估計屈光狀態。"
    ],
    [
      "with motion",
      "順動",
      "反射光與檢影光束同方向移動。"
    ],
    [
      "against motion",
      "逆動",
      "反射光與檢影光束反方向移動。"
    ],
    [
      "neutral",
      "中和",
      "檢影 endpoint，反射不再有明顯方向性移動。"
    ],
    [
      "working distance",
      "工作距離",
      "檢影時驗者到受檢眼的距離，需扣除或用 working lens 補償。"
    ],
    [
      "phoropter",
      "綜合驗光儀",
      "可切換球鏡、柱鏡、軸位以進行客觀與主觀驗光。"
    ],
    [
      "keratometer",
      "角膜曲率儀",
      "測前角膜中央約 3 mm 的曲率與角膜散光。"
    ],
    [
      "mire",
      "角膜曲率儀視標/反射像",
      "由角膜前表面反射，用來對焦與對齊測 K 值。"
    ],
    [
      "K reading",
      "K 值",
      "角膜主子午線的屈光力記錄。"
    ],
    [
      "topography",
      "角膜地圖",
      "以熱圖呈現角膜表面曲率與形態。"
    ],
    [
      "RAPD",
      "相對傳入性瞳孔缺損",
      "swinging flashlight test 中病眼被照時雙眼反而相對放大。"
    ],
    [
      "Adie's tonic pupil",
      "Adie 強直性瞳孔",
      "副交感節後病變，光反應差、近反應慢且保留，對低濃度 pilocarpine 超敏感。"
    ],
    [
      "Horner syndrome",
      "霍納氏症候群",
      "交感路徑受損，典型 ptosis、miosis、anhidrosis 與 dilation lag。"
    ],
    [
      "depth perception",
      "深度知覺",
      "感覺物體前後與距離的能力，包含單眼線索與雙眼立體視。"
    ],
    [
      "monocular cues",
      "單眼深度線索",
      "只用一眼也能利用的後天深度判斷經驗。"
    ],
    [
      "stereopsis",
      "立體視",
      "大腦融合左右眼略有差異的影像後產生的細膩深度感。"
    ],
    [
      "retinal disparity",
      "視網膜視差",
      "同一物體在左右眼視網膜上成像位置的差異，是立體視的重要來源。"
    ],
    [
      "fusion",
      "融像",
      "大腦將左右眼影像整合成單一知覺的過程。"
    ],
    [
      "diplopia",
      "複視",
      "左右眼影像無法成功融像，因而看成兩個。"
    ],
    [
      "stereoacuity",
      "立體視力",
      "能偵測到的最小深度視差，通常以秒角表示，數值越小越好。"
    ],
    [
      "seconds of arc",
      "秒角",
      "極小的角度單位，用於記錄立體視力。"
    ],
    [
      "relative size",
      "相對大小",
      "把看起來較小的同類物體判斷為較遠的單眼線索。"
    ],
    [
      "relative height",
      "相對高度",
      "平面中位置較高的物體通常被判斷為較遠。"
    ],
    [
      "relative motion",
      "相對動態",
      "利用觀察者移動時近遠物體的相對移動差判斷深度。"
    ],
    [
      "perspective",
      "透視",
      "利用平行線往遠方收斂等幾何關係判斷深度。"
    ],
    [
      "occlusion",
      "遮擋",
      "遮住其他物體者被判斷為在前方。"
    ],
    [
      "texture gradient",
      "紋理梯度",
      "近處細節清楚、遠處紋理密集模糊的單眼深度線索。"
    ],
    [
      "shading",
      "陰影線索",
      "依亮暗與光源方向推測表面凸凹。"
    ],
    [
      "clarity",
      "清晰度線索",
      "較清楚物體通常被判斷為較近。"
    ],
    [
      "horopter",
      "雙眼單視界",
      "注視時落在兩眼對應視網膜點、看起來與注視點同深度的位置集合。"
    ],
    [
      "Panum's fusional area",
      "潘納姆融像區",
      "Horopter 前後仍可維持融合與單視的容許範圍。"
    ],
    [
      "zero disparity",
      "零視差",
      "物體位於 horopter，左右眼影像落在對應位置。"
    ],
    [
      "crossed disparity",
      "交叉性視差",
      "物體在注視平面前方時的視差，融合後感覺較近。"
    ],
    [
      "uncrossed disparity",
      "非交叉性視差",
      "物體在注視平面後方時的視差，融合後感覺較遠。"
    ],
    [
      "angular disparity",
      "角度視差",
      "以視軸夾角差描述的雙眼視差。"
    ],
    [
      "relative disparity",
      "相對視差",
      "比較目標與可見參考點之間的視差，人類對它較敏感。"
    ],
    [
      "absolute disparity",
      "絕對視差",
      "目標相對注視軸本身的視差，沒有另一個可見目標作比較。"
    ],
    [
      "fixation disparity",
      "固視偏差",
      "仍能維持單視的微小內聚誤差。"
    ],
    [
      "underconvergence",
      "內聚不足",
      "兩眼聚合量比需求少，對應 exo fixation disparity。"
    ],
    [
      "overconvergence",
      "內聚過度",
      "兩眼聚合量比需求多，對應 eso fixation disparity。"
    ],
    [
      "exo fixation disparity",
      "外向固視偏差",
      "因 underconvergence 造成、但仍可單視的微小誤差。"
    ],
    [
      "eso fixation disparity",
      "內向固視偏差",
      "因 overconvergence 造成、但仍可單視的微小誤差。"
    ],
    [
      "binocular vision",
      "雙眼視覺",
      "兩眼影像共同參與並由大腦整合的視覺功能。"
    ],
    [
      "local stereotest",
      "局部立體視檢查",
      "使用小型中央視標，可能含單眼線索。"
    ],
    [
      "global stereotest",
      "整體立體視檢查",
      "使用較大範圍 random dots，依賴真正雙眼整合。"
    ],
    [
      "random dots",
      "隨機點",
      "沒有明顯輪廓、需靠雙眼視差辨認隱藏圖形的點狀背景。"
    ],
    [
      "figure-ground discrimination",
      "圖像背景區分",
      "從背景中辨認隱藏圖形的神經處理能力。"
    ],
    [
      "polarized glasses",
      "偏光測試鏡",
      "利用不同偏振方向分別提供左右眼影像。"
    ],
    [
      "red-green glasses",
      "紅綠測試鏡",
      "利用紅綠濾鏡分離左右眼影像，TNO 會使用。"
    ],
    [
      "TNO",
      "TNO 立體視檢查",
      "使用紅綠鏡與隨機點圖形的整體立體視檢查。"
    ],
    [
      "Titmus",
      "Titmus 立體視檢查",
      "常見偏光局部立體視檢查，含蒼蠅與立體圈。"
    ],
    [
      "Randot",
      "Randot 立體視檢查",
      "結合偏光與隨機點圖形，可測量較細緻的立體視力。"
    ],
    [
      "Frisby",
      "Frisby 立體視檢查",
      "不需測試鏡，但偏頭觀看可能提供單眼線索。"
    ],
    [
      "Lang",
      "Lang 立體視檢查",
      "不需額外測試鏡，常用於幼兒的立體視篩檢。"
    ],
    [
      "Lang stereotest",
      "Lang 立體視檢查",
      "不需額外測試鏡，常用於幼兒粗略立體視篩檢。"
    ],
    [
      "accommodation",
      "調節",
      "改變水晶體形狀與屈光力，使不同距離物體維持清楚。"
    ],
    [
      "ciliary muscle",
      "睫狀肌",
      "收縮時讓懸韌帶放鬆，使水晶體變厚以增加調節。"
    ],
    [
      "zonules",
      "水晶體懸韌帶",
      "連接睫狀體與水晶體；放鬆時水晶體會變圓。"
    ],
    [
      "crystalline lens",
      "水晶體",
      "眼內可改變形狀的正透鏡，負責調節不同距離焦點。"
    ],
    [
      "amplitude of accommodation",
      "調節幅度",
      "眼睛能使用的最大調節能力。"
    ],
    [
      "accommodative response",
      "調節反應",
      "實際調節是否準確對應視標需求，可有 lead 或 lag。"
    ],
    [
      "lead",
      "調節超前",
      "實際調節量高於視標需求。"
    ],
    [
      "lag",
      "調節落後",
      "實際調節量低於視標需求。"
    ],
    [
      "accommodative facility",
      "調節靈敏度",
      "焦點在遠近之間快速切換的能力。"
    ],
    [
      "far point",
      "遠點",
      "調節完全放鬆時最遠的清楚點。"
    ],
    [
      "near point",
      "近點",
      "最大調節時最近的清楚點。"
    ],
    [
      "range of clear vision",
      "清晰視覺範圍",
      "Far point 與 near point 之間可維持清楚的範圍。"
    ],
    [
      "AA",
      "調節幅度",
      "Amplitude of accommodation 的縮寫。"
    ],
    [
      "FP",
      "遠點",
      "Far point 的縮寫。"
    ],
    [
      "NP",
      "近點",
      "Near point 的縮寫。"
    ],
    [
      "NPA",
      "近點調節",
      "Near point of accommodation，測量調節極限的近點。"
    ],
    [
      "Hofstetter",
      "霍夫斯泰特公式",
      "依年齡估計最低、平均與最高調節幅度。"
    ],
    [
      "accommodative insufficiency",
      "調節不足",
      "調節幅度低於需求，常造成近距離模糊與疲勞。"
    ],
    [
      "plus lenses",
      "正鏡片",
      "近用時可分擔調節需求，減少眼睛負擔。"
    ],
    [
      "vision therapy",
      "視覺訓練",
      "針對非老花患者的調節或雙眼視功能進行訓練。"
    ],
    [
      "parasympathetic pathway",
      "副交感路徑",
      "參與縮瞳與調節的神經路徑。"
    ],
    [
      "push-up",
      "推近法",
      "將視標由遠推近至 sustained blur，以測量 NPA。"
    ],
    [
      "pull-away",
      "拉遠法",
      "將視標由近拉遠至第一次清楚，以估計調節幅度。"
    ],
    [
      "minus lens to blur",
      "負鏡片模糊法",
      "在固定近距離逐步加負鏡片至 sustained blur 的調節幅度測法。"
    ],
    [
      "sustained blur",
      "持續模糊",
      "即使努力對焦仍無法恢復清楚，是 NPA 與 minus lens 測法的終點。"
    ],
    [
      "distance Rx",
      "遠用處方",
      "患者遠距離完全矯正的度數。"
    ],
    [
      "spectacle plane",
      "眼鏡平面",
      "戴鏡患者測量近點距離時使用的起始平面。"
    ],
    [
      "version",
      "共同運動",
      "兩眼往同一方向移動。"
    ],
    [
      "vergence",
      "異向運動",
      "兩眼往相反方向移動的總稱。"
    ],
    [
      "convergence",
      "內聚",
      "兩眼向鼻側轉動以注視近物。"
    ],
    [
      "divergence",
      "散開",
      "兩眼向外轉動以注視較遠物。"
    ],
    [
      "NPC",
      "近點聚合",
      "Near point of convergence，兩眼能維持聚合單視的最近點。"
    ],
    [
      "break",
      "破裂點",
      "NPC 中第一次複視或觀察到一眼外轉的位置。"
    ],
    [
      "recovery",
      "恢復點",
      "NPC 視標拉遠後重新成為單一影像的位置。"
    ],
    [
      "TTN",
      "到鼻尖",
      "To the nose，NPC 測到鼻尖仍未出現 break。"
    ],
    [
      "suppression",
      "抑制",
      "大腦忽略其中一眼影像，因此患者可能不報複視。"
    ],
    [
      "accommodative target",
      "調節性視標",
      "有細節可對焦的字或圖案，會同時誘發調節與內聚。"
    ],
    [
      "penlight",
      "筆燈",
      "缺少細節的非調節性 NPC 視標。"
    ],
    [
      "red lens",
      "紅色鏡片",
      "配合筆燈使用，可幫助分離雙眼影像與判定 NPC。"
    ],
    [
      "convergence insufficiency",
      "內聚不足",
      "近距離聚合能力不足，可能造成複視、疲勞與閱讀困難。"
    ],
    [
      "non-accommodative target",
      "非調節性視標",
      "不含細節、較少誘發調節的視標，常用於老花者 NPC。"
    ],
    [
      "crossed",
      "交叉性",
      "在立體視中通常表示物體感覺位於注視平面前方。"
    ],
    [
      "uncrossed",
      "非交叉性",
      "在立體視中通常表示物體感覺位於注視平面後方。"
    ],
    [
      "local",
      "局部",
      "立體視檢查中使用中央小視標、可能含單眼線索的類型。"
    ],
    [
      "global",
      "整體",
      "立體視檢查中使用較大隨機點範圍、需要更多雙眼整合的類型。"
    ],
    [
      "texture",
      "紋理",
      "物體表面的細節排列，可提供遠近線索。"
    ],
    [
      "Panum",
      "潘納姆",
      "常用來指 horopter 前後仍可融合的 Panum 融像區。"
    ],
    [
      "fovea",
      "中央凹",
      "視網膜中央視力最精細的區域，注視點影像通常落在此處。"
    ],
    [
      "fixation",
      "注視",
      "讓雙眼視軸對準目標並維持觀看。"
    ],
    [
      "stereotest",
      "立體視檢查",
      "用來測量是否具有立體視及最小可辨認視差。"
    ],
    [
      "reference",
      "參考點",
      "用來比較角度、深度或位置的基準。"
    ],
    [
      "monocular",
      "單眼的",
      "只使用一眼完成的觀看或檢查條件。"
    ],
    [
      "disparity",
      "視差",
      "左右眼影像位置或角度的差異。"
    ],
    [
      "minutes of arc",
      "分角",
      "角度單位；固視偏差常以數個分角描述。"
    ],
    [
      "seconds",
      "秒角數值",
      "立體視力情境中通常指 seconds of arc。"
    ],
    [
      "exo",
      "外向",
      "表示眼位或固視偏差朝外。"
    ],
    [
      "eso",
      "內向",
      "表示眼位或固視偏差朝內。"
    ],
    [
      "underconverge",
      "內聚不足",
      "兩眼向內聚合的量少於注視需求。"
    ],
    [
      "amplitude",
      "幅度",
      "調節情境中表示最大可用能力。"
    ],
    [
      "response",
      "反應準確度",
      "調節情境中表示實際反應是否對準需求。"
    ],
    [
      "facility",
      "靈敏度",
      "調節情境中表示遠近焦點切換速度。"
    ],
    [
      "diopter",
      "屈光度",
      "鏡片與調節能力常用的單位 D。"
    ],
    [
      "age",
      "年齡",
      "調節幅度最重要的預測因素。"
    ],
    [
      "minimum",
      "最低預期值",
      "Hofstetter 公式中臨床判斷調節不足最重要的門檻。"
    ],
    [
      "mean",
      "平均預期值",
      "Hofstetter 公式估計的同年齡平均調節幅度。"
    ],
    [
      "maximum",
      "最高預期值",
      "Hofstetter 公式估計的同年齡最高調節幅度。"
    ],
    [
      "focusing ability",
      "對焦能力",
      "眼睛改變焦點以維持清楚的能力。"
    ],
    [
      "diameter",
      "直徑",
      "圓形結構的寬度，例如瞳孔大小。"
    ],
    [
      "lens",
      "鏡片",
      "可改變光線聚散的光學元件；眼內水晶體也是一種透鏡。"
    ],
    [
      "minus",
      "負度數",
      "負鏡片的度數方向，minus lens to blur 會逐步加入負度數。"
    ]
  ]
};
