(function () {
  const data = window.PHYSIO_CONTENT;
  const progressKey = "physiology-final-review-progress-v1";

  function readProgress() {
    try {
      return JSON.parse(localStorage.getItem(progressKey)) || {};
    } catch (error) {
      return {};
    }
  }

  function writeProgress(progress) {
    localStorage.setItem(progressKey, JSON.stringify(progress));
    renderProgressBadges();
  }

  function activeUnits() {
    return data.units.filter((unit) => unit.status === "active");
  }

  function unitById(id) {
    return data.units.find((unit) => unit.id === id);
  }

  const sectionNarratives = {
    cardiovascular: {
      "cardio-anatomy": {
        thread: ["先分清楚血液進出哪四個 chamber。", "再把房室之間與心室出口的 valves 接上。", "最後用 pressure gradient 解釋為什麼瓣膜會開或關。"],
        wrapUp: "本章主線：chambers 定位血流路線 -> AV valves 防止房室逆流 -> semilunar valves 控制出口 -> pressure gradient 決定所有瓣膜事件。"
      },
      "cardio-conduction": {
        thread: ["心臟要收縮，先要有能自動產生節律的細胞。", "節律必須沿固定傳導路線送到心室。", "AV delay 讓心房先把血送進心室。", "若繞過 AV node，就會出現 pre-excitation。"],
        wrapUp: "本章主線：pacemaker 發令 -> AV node 延遲 -> His-Purkinje 快速傳到 apex -> 心室由下往上收縮；bypass 會破壞這個時間安排。"
      },
      "cardio-ecg": {
        thread: ["ECG 先不是背波形，而是看電向量投影。", "P/QRS/T 代表不同部位的電活動。", "導程方向決定波形正負。", "異常波形要回推到傳導或復極機制。"],
        wrapUp: "本章主線：lead 是視角 -> waveform 是投影 -> P/QRS/T 對應電活動 -> 異常要回推向量、時間與傳導路徑。"
      },
      "cardio-cycle": {
        thread: ["心動週期可以用四個瓣膜事件切段。", "兩個等容積期說明壓力變但體積不變。", "EDV/ESV/SV 把週期轉成體積語言。", "systole/diastole 要回到瓣膜開關來定義。"],
        wrapUp: "本章主線：MC/AO/AC/MO 定義段落 -> 等容積期看壓力不看體積 -> EDV/ESV/SV 量化射血 -> systole/diastole 用瓣膜區間收束。"
      },
      "cardio-sounds-output": {
        thread: ["瓣膜事件會變成心音。", "異常填充或心房收縮會出現 S3/S4。", "心臟表現最後可用 CO=HRxSV 量化。", "藥理題再回到 preload、afterload、contractility 推論。"],
        wrapUp: "本章主線：valve closure 產生 S1/S2 -> filling 問題產生 S3/S4 -> CO 量化泵浦輸出 -> 藥理變因改變 SV。"
      },
      "cardio-pv-loop": {
        thread: ["PV loop 把壓力與體積放在同一張圖。", "loop 寬度對應 SV，面積對應外功。", "preload、afterload、contractility 分別改變 loop 形狀。"],
        wrapUp: "本章主線：PV loop 面積看做功 -> preload 增 EDV -> afterload 增 ESV -> contractility 降 ESV；最後都回到 SV 怎麼變。"
      }
    },
    urinary: {
      "renal-why": {
        thread: ["腎臟先用 filtration 產生濾液。", "再用 reabsorption/secretion 微調回收與排出。", "NaCl 決定水分跟血壓，血流與耗氧支撐這些工作。", "clearance 用數學把處理方向量化。"],
        wrapUp: "本章主線：filter 先大量篩 -> tubule 選擇回收/分泌 -> NaCl 帶動水與壓力 -> clearance 量化腎臟處理。"
      },
      "renal-nephron": {
        thread: ["先從尿液離開身體的路線定位。", "再把腎臟切成 cortex、medulla、pelvis。", "不同 nephron 決定濃縮尿液能力。", "出球小動脈接到不同血管床，讓回收能發生。"],
        wrapUp: "本章主線：urinary tract 定出口 -> kidney zones 定位置 -> nephron type 定功能 -> efferent arteriole 定回收血管。"
      },
      "renal-filtration": {
        thread: ["腎絲球壓力來自 afferent/efferent 的前後夾持。", "真正的篩選發生在三層 filtration barrier。", "mesangial cell 改變可濾過面積。", "蛋白尿代表屏障選擇性失守。"],
        wrapUp: "本章主線：arteriole 控壓 -> filtration barrier 控大小與電荷 -> mesangial cell 控 Kf -> proteinuria 顯示屏障壞掉。"
      },
      "renal-jga-raas": {
        thread: ["JGA 先偵測低灌流或低 NaCl。", "刺激會促使 renin 釋放。", "renin 啟動 Ang II。", "Ang II 與 aldosterone 把鈉、水、血壓拉回來。"],
        wrapUp: "本章主線：低壓/低鹽訊號 -> renin -> Ang II -> aldosterone -> 留鈉留水、排鉀並升壓。"
      },
      "renal-endocrine": {
        thread: ["腎臟不只排尿，也完成 vitamin D 活化。", "活性 vitamin D 連到鈣吸收。", "EPO 連到紅血球生成。", "aldosterone 再把腎臟和腎上腺皮質接起來。"],
        wrapUp: "本章主線：kidney 活化 vitamin D -> 提升 Ca2+ 吸收 -> EPO 促紅骨髓造血 -> adrenal cortex 的 aldosterone 回到鈉鉀調控。"
      },
      "renal-clearance": {
        thread: ["GFR 需要理想濾過物作基準。", "clearance 是用尿中排出量反推血漿被清空的體積。", "Cx 與 GFR 比較可判斷回收或分泌。", "RPF/RBF 最後要分清血漿與全血。"],
        wrapUp: "本章主線：inulin 定 GFR -> Cx 定清除率 -> Cx vs GFR 判斷 tubule 處理 -> RPF/RBF 用 hematocrit 換算。"
      }
    },
    cns: {
      "cns-overview": {
        thread: ["神經系統先處理刺激輸入。", "中樞整合訊息後決定輸出。", "神經與肌肉都靠 excitability 工作。", "高耗能特性使 CNS 特別怕缺氧缺血。"],
        wrapUp: "本章主線：input -> integration -> output；excitable cells 讓訊號可傳，homeostasis 解釋為什麼缺氧缺水會快速出問題。"
      },
      "cns-pns": {
        thread: ["先把 CNS/PNS 的解剖邊界定清楚。", "再把 PNS 拆成 somatic、autonomic、enteric。", "最後用 afferent/efferent 判斷訊號方向。"],
        wrapUp: "本章主線：brain/spinal cord 是 CNS -> 離開中樞就是 PNS -> PNS 再分功能系統 -> afferent/efferent 判斷進出方向。"
      },
      "cns-anatomy": {
        thread: ["先用大腦、間腦、腦幹、小腦定位 brain。", "再背腦神經與脊神經數量。", "最後把 ganglion 放回 PNS 定位題。"],
        wrapUp: "本章主線：brain 區域定位 -> cranial nerves 編號 -> spinal nerves 數量 -> ganglion 是 PNS 的重要定位線索。"
      },
      "cns-neuron": {
        thread: ["神經元先從 axon hillock 啟動訊號。", "形態分類看突起數量。", "功能分類看 input/process/output。", "sensory unit 與 motor unit 決定解析度與控制精細度。"],
        wrapUp: "本章主線：axon hillock 起始 AP -> morphology 看形狀 -> function 看路徑角色 -> unit size 決定感覺或動作精細度。"
      },
      "cns-glia": {
        thread: ["神經元能工作，需要 glia 支持。", "myelin 由不同細胞在 CNS/PNS 形成。", "microglia 負責清除免疫。", "BBB 用選擇性屏障保護 CNS。"],
        wrapUp: "本章主線：astrocyte 支持與 BBB -> oligodendrocyte/Schwann 做 myelin -> microglia 清除 -> BBB 保護但限制藥物進入。"
      },
      "cns-myelin-reflex": {
        thread: ["myelin 先解釋傳導速度。", "再用 sensory neuron、motor neuron 判斷 PNS/CNS 分類陷阱。", "最後用 interneuron 收束到完整 CNS 內路徑。"],
        wrapUp: "本章主線：myelination 加速 -> sensory terminal 在 CNS 仍可屬 PNS -> alpha motor neuron 也屬 PNS -> interneuron 才典型留在 CNS。"
      }
    },
    "special-senses": {
      "sense-lab": {
        thread: ["先用單眼視野看感覺輸入範圍。", "盲點說明 retina 有沒有 receptor 的差異。", "顏色視野大小連到不同 receptor 分布。"],
        wrapUp: "本章主線：monocular visual field -> optic disc blind spot -> color field size；實驗結果都回到 receptor 分布與雙眼互補。"
      },
      "vision-optics": {
        thread: ["看近物要先調焦、會聚、縮瞳。", "near point 量化最大 accommodation。", "光刺激本質是特定波長電磁波。"],
        wrapUp: "本章主線：near response 三件事 -> near point 測 accommodation -> wavelength 決定視覺刺激來源。"
      },
      "vision-retina": {
        thread: ["先把 retina 層次簡化定位。", "再分 rod/cone 的工作情境。", "最後進入 phototransduction：光照會讓 photoreceptor hyperpolarize。"],
        wrapUp: "本章主線：retina layers 定路徑 -> rod/cone 定功能 -> dark current 靠 cGMP -> light 關 Na+ channel 造成 hyperpolarization。"
      },
      "vision-pathway": {
        thread: ["視覺訊號先從 retina 送到 cortex。", "路徑中會用 lateral inhibition 強化邊界。", "雙眼差異形成 stereopsis。", "primary/secondary cortex 分別處理客觀特徵與整合。"],
        wrapUp: "本章主線：retina -> visual pathway -> lateral inhibition -> binocular integration -> visual cortex 分層處理。"
      },
      hearing: {
        thread: ["聲音先由外耳收集。", "中耳負責 impedance matching。", "內耳把機械波轉成 hair cell 訊號。", "反射保護內耳並協助定位聲音。"],
        wrapUp: "本章主線：outer ear 收音 -> middle ear 放大/匹配 -> inner ear transduction -> reflex 保護與定位。"
      },
      "hearing-pathology": {
        thread: ["基底膜 tonotopy 先決定頻率定位。", "hair cell stereocilia 彎曲決定興奮或抑制。", "聽力異常要分傳導性與神經性。", "pathway 逐站過濾後到 cortex。"],
        wrapUp: "本章主線：base/apex 頻率地圖 -> stereocilia transduction -> conductive vs sensorineural hearing loss -> auditory pathway 到 cortex。"
      },
      equilibrium: {
        thread: ["平衡輸入來自前庭、視覺與本體覺。", "semicircular canals 偵測旋轉。", "utricle/saccule 偵測線性加速度與頭位。"],
        wrapUp: "本章主線：multi-sensory balance -> angular acceleration by canals -> linear acceleration/head position by otolith organs -> nystagmus 反映前庭眼反射。"
      },
      "taste-smell": {
        thread: ["味覺先分五個基本味質。", "苦味閾值低，代表保護意義。", "味覺傳入靠 VII/IX/X。", "嗅覺連 limbic system，和味覺合成 flavor。"],
        wrapUp: "本章主線：basic tastes -> bitter protection -> cranial nerve input -> olfaction plus taste makes flavor and emotion-linked memory。"
      }
    }
  };

  const simplePointGuides = {
    cardiovascular: {
      "cardio-anatomy": [
        "先把心臟想成兩台接力水泵：右心把血送去肺，左心再把血送到全身，血繞成一個 8 字形。",
        "房室瓣就是心房通往心室的單向門，目標只有一個：不准血倒流回心房。",
        "半月瓣是心室的出口門；心室夠有力時門才打開，射完血就關起來（發出 S2）。",
        "不用死背瓣膜表格。哪一側壓力比較大，血就往哪裡推，門也跟著決定開或關。"
      ],
      "cardio-conduction": [
        "心臟裡有兩種角色：工作心肌負責用力擠血，節律細胞負責喊口令（它是心肌，不是神經）。",
        "電訊號像接力賽沿固定路線跑；左心室比較厚，所以左束支有兩條、右束支只有一條。",
        "房室結像紅綠燈故意讓訊號等一下；背後有三個讓它變慢的機制。",
        "預先興奮就是走捷徑繞過房室結；WPW 還走一般心肌，畫出斜斜的 delta wave。"
      ],
      "cardio-ecg": [
        "ECG 貼在皮膚上，記的是細胞膜『外』的電位變化，不是細胞裡面。",
        "只有一條公式：正極數到的電荷減掉負極數到的；靜止時兩邊一樣，所以畫平線。",
        "跟著圖一格一格數電荷：去極化掃過去畫出正波，再極化畫出方向相反的倒波。",
        "每條導程像一台攝影機；心臟電向量投影到它身上，同向往上、反向往下、垂直≈0。",
        "P、QRS、T 是心房去極化、心室去極化、心室再極化；心房再極化被巨大的 QRS 蓋住了。",
        "T 波理論上該倒，但收縮壓力讓心尖先再極化，方向翻兩次（負負得正）就向上了。",
        "紙速全球固定 25 mm/s；心率用 300 除以兩個 R 之間的大格數。"
      ],
      "cardio-cycle": [
        "盯四次門的開關 MC→AO→AC→MO；第一個動作是二尖瓣『關』，因為其它本來就沒在動。",
        "等容積期就像捏裝水的密閉瓶：壓力會變，但因為兩扇門都關著，水量不變。",
        "主動脈瓣一開，血先快射（前 1/3）再慢射（後 2/3），但兩段都還在收縮期。",
        "裝最滿是 EDV、射完剩 ESV、倒出去的是 SV；心室填充屬於舒張期。"
      ],
      "cardio-sounds-output": [
        "第一、第二心音主要是門關上的聲音：先關房室瓣，再關半月瓣。",
        "第三、第四心音像額外的撞擊聲，提醒你心室填充或心室太硬。",
        "心輸出量＝每分鐘跑幾趟 × 每趟載多少；運動員跑得慢但每趟載很多，CO 仍正常。",
        "藥理題先問三件事：進來多少血、出去有多難、心肌能擠多用力。"
      ],
      "cardio-pv-loop": [
        "壓力容積環一圈就是一個心跳，四條邊對應四期；圈越寬打出去越多。",
        "前負荷就是收縮前先裝進多少血；裝得更多，通常能射得更多，圈變寬。",
        "後負荷就是出口阻力；外面壓力越高，心室越難把血推出去，剩下的血越多，圈變高變窄。",
        "收縮力是心肌本身的擠壓能力；越有力，射完後留下的血越少，圈右下角往內縮。"
      ]
    },
    urinary: {
      "renal-why": [
        "用演化故事記：原始只會過濾 → 進淡水要把鹽撿回來（小管）→ 上陸要省水（吸鈉、水跟著）→ 把小管拉長更有效率。",
        "腎臟像大花豆，只佔體重約 0.5%，卻拿走約四分之一的心輸出量，超級操勞。",
        "腎臟做三件事：大量過濾、把有用的撿回來（重吸收）、把垃圾額外丟進去（分泌）。"
      ],
      "renal-nephron": [
        "尿液離開身體只有一條路：腎臟製造 → 輸尿管運送 → 膀胱儲存 → 尿道排出。",
        "皮質腎元環短、數量多、忙重吸收；近髓質腎元環長、深入髓質，專門濃縮稀釋尿液。",
        "一個腎元是小管＋血管兩套；集尿管像插糖葫蘆的木樁，一根插很多串，所以不算單一腎元。",
        "皮質腎元的血管纏在小管旁邊撿東西（peritubular）；近髓質的是 U 型直血管，保住髓質濃度梯度。"
      ],
      "renal-filtration": [
        "入球粗、出球細，像前後兩個水龍頭夾住腎絲球，把過濾壓維持住。",
        "濾過膜是三層篩子：內皮的規則窗孔、帶負電的基底膜、足細胞之間不規則的裂隙。",
        "系膜細胞像會收縮的支架；一收縮，可用來過濾的面積就變小，GFR 跟著降。",
        "尿裡出現大量蛋白，就像濾網破洞，要先懷疑腎絲球的過濾屏障壞了。"
      ],
      "renal-jga-raas": [
        "腎小球旁器有兩個警報器：一個（JG cell）看血壓，一個（macula densa）看流過來的鈉鹽夠不夠。",
        "低血壓、低鈉鹽、交感興奮，都是在說『循環量可能不夠』，於是腎臟放腎素來升壓保水。",
        "腎素推倒一串骨牌：血管收縮素原 → I → II；最後的血管收縮素二才是主角。",
        "血管收縮素二兩招升血壓：直接縮小動脈、再叫醛固酮『留鈉排鉀』把水留住。"
      ],
      "renal-endocrine": [
        "維他命 D 像半成品，肝臟先加工一半（25），最後一步要到腎臟才完成（1,25）才有活性。",
        "腎臟像氧氣感測站，缺氧時放紅血球生成素通知骨髓多造紅血球；腎壞了就容易貧血。"
      ],
      "renal-clearance": [
        "別被中文騙：腎臟很多『率』其實是『每分鐘兩顆腎發生某件事的體積』。",
        "想算 GFR，就找一個過濾後在小管完全不被動手腳的物質，濾過多少就排出多少。",
        "菊糖 inulin（不是胰島素）只被過濾、不被偷回也不被多丟，所以它的清除率剛好等於 GFR。"
      ]
    },
    cns: {
      "cns-overview": [
        "神經和肌肉都會放電，但神經是為了傳訊息、調控身體，不是收縮做工。",
        "中樞只有腦和脊髓；判斷一顆神經元時，只要它有任何一段伸到外面，整顆就算周邊。",
        "傳入(afferent)往中樞、傳出(efferent)離中樞；一套系統要能感覺→整合→運動。",
        "周邊神經分三隊：意識能控制的(體)、自動運作的(自主)、腸道自己一套的(腸)。"
      ],
      "cns-classify": [
        "感覺神經元本體在脊髓外的背根神經節，末梢才進中樞，所以整顆算周邊。",
        "運動神經元本體在脊髓裡，但軸突伸到肌肉，只要有一段在外面，整顆仍算周邊。",
        "一個神經元管得越少越精細（手指）、管得越多力量越大但越粗（大腿）。",
        "看到名詞要立刻反應中樞或周邊；十二對腦神經全部都算周邊。"
      ],
      "cns-neuron": [
        "樹突收訊、軸丘做最後決策：訊號加總夠強，動作電位就在軸丘點火。",
        "結構分類只看伸出幾條突起；雙極想到視網膜，假單極想到背根神經節。",
        "功能分感覺/中間/運動；小腦的浦肯野細胞樹突像掃把頭，整合超多訊息。",
        "物質沿軸突運送：往末端是順向、往本體是逆向；逆向常拿來標定神經迴路。"
      ],
      "cns-glia": [
        "大腦裡其實大部分是膠質細胞；神經元負責溝通整合，膠質負責支持營養保護。",
        "膠質的保護之一，是清掉突觸裡的神經傳導物，免得神經過度興奮受傷。",
        "同樣的工作，中樞和周邊名字不同：中樞 astrocyte／oligodendrocyte，周邊 satellite／Schwann。",
        "血腦屏障像嚴格海關，保護大腦；很多物質（如血清素）根本進不去。"
      ],
      "cns-myelin": [
        "有髓鞘時，訊號能在郎飛結之間跳著走，比沿整條軸突慢慢走快很多。",
        "白質是有髓軸突（脂質偏白）、灰質是細胞本體；大腦外灰內白，脊髓剛好相反。",
        "黑質的多巴胺神經元退化，就會造成巴金森氏症的顫抖與動作問題。"
      ]
    },
    "special-senses": {
      "ss-intro": [
        "特殊感覺有五種：視/聽/平衡/嗅/味；結構簡單的叫受器(痛溫壓觸)，複雜的叫器官(視聽平衡)。",
        "每種感覺只認得『對的刺激』：光不會讓你痛、也不會讓你聽到聲音。",
        "任何感覺都要先把刺激換成電(receptor potential)，過閾值變成動作電位，才傳得到中樞。"
      ],
      "ss-refraction": [
        "眼睛是凸透鏡：視網膜上的影像其實是上下顛倒、左右相反的。",
        "光經角膜、晶狀體聚焦到視網膜；能調的是晶狀體——看近時它會變厚。",
        "看近物時眼睛同時做三件事：晶狀體變厚、瞳孔縮小、兩眼往鼻側靠。",
        "近點是能看清楚的最近距離；年紀大晶狀體變硬、近點變遠，就是老花。"
      ],
      "ss-photo": [
        "桿細胞看黑白、在周邊、暗處用；錐細胞看彩色、在中央凹、解析好。",
        "視紫質＝視蛋白＋11-順式視黃醛；光照會把它拆開，再生需要維生素 A（缺了會夜盲）。",
        "感光細胞超反直覺：暗中一直去極化、放神經傳導物；被光照反而超極化、減少放——和一般神經相反。",
        "只有藍綠紅三種錐細胞，靠三者活化比例讓中樞判出各種顏色；綠紅光譜重疊，所以紅綠色盲常一起。"
      ],
      "ss-pathway": [
        "視網膜由色素層→感光細胞→雙極→神經節一層層傳；側抑制讓對比更清楚。",
        "鼻側纖維會交叉、顳側不交叉；不同位置受傷，視野缺損型態也不同。",
        "先到 primary cortex 的是『客觀』看到什麼；到 secondary 整合記憶經驗後變成『主觀』認知。",
        "視力本質是兩點辨別；視野黑白(rod)最大；盲點是視神經出口、沒有感光細胞。"
      ],
      "ss-hearing": [
        "聲音走外耳→中耳→內耳；中耳三小聽骨負責阻抗匹配、把振幅放大。",
        "耳蝸分三腔，記『外鈉內鉀』：外淋巴高鈉、中央階內淋巴高鉀。",
        "用『位置』編頻率：高頻在靠卵圓窗的底部、低頻在遠端頂部。",
        "毛細胞泡在高鉀內淋巴，所以是『鉀內流』去極化（例外）；方位靠兩耳的時間差與強度差。",
        "平衡靠視覺(最主要)＋前庭＋本體；半規管管旋轉、球囊橢圓囊管直線加速度。"
      ],
      "ss-taste-smell": [
        "五味各對應不同化學物（酸=氫離子、鹹=鈉、鮮=麩胺酸），苦最敏感；味覺走第 7/9/10 對腦神經。",
        "嗅覺能直接連到邊緣系統，所以和情緒記憶連很緊；味＋嗅一起才是完整的風味。"
      ]
    },
    ans: {
      "ans-overview": [
        "自主神經是你『意識管不到』的那套：你沒辦法用意念讓心跳變慢、也沒辦法一直憋氣不呼吸。",
        "四個必背特性：平時就一直放電(basal tone)、大多器官兩邊都管(雙重支配)、兩邊作用相反(拮抗)、交感能一起爆發(集體放電)。",
        "自主神經輸出一定是兩棒接力：節前神經元→神經節→節後神經元；體神經只有一棒。"
      ],
      "ans-pathway": [
        "交感從胸腰段出來(T1–L3)、副交感從腦薦出來(3/7/9/10 對腦神經＋S2–4)。",
        "交感有條神經鏈靠脊髓，所以節前短節後長；副交感的神經節靠器官，所以反過來。",
        "腎上腺髓質像交感的特殊節後：交感叫它(ACh)，它就把腎上腺素丟進血液送全身。"
      ],
      "ans-receptor": [
        "把這張圖記死：節前都是 ACh→Nn；副交感節後 ACh→M；交感節後 NE→α/β。",
        "尼古丁受體是離子通道、一律興奮；M 和腎上腺素受體看 G 蛋白：Gq 興奮、Gi 抑制、Gs 走 cAMP。",
        "兩個必考例外：汗腺是交感但用 ACh、腎入球小動脈只受交感。",
        "ACh＝膽鹼＋乙醯輔酶A 做的、被乙醯膽鹼酯酶分解；NE 從酪胺酸做的、被 MAO/COMT 分解。"
      ],
      "ans-effector": [
        "一把萬用鑰匙：交感＝『有人拿刀衝過來』(fight-or-flight)、副交感＝『休息消化』，其他用情境推。",
        "交感散瞳、心跳快、氣管開、腸胃關、腎濾過降；副交感大多相反。",
        "交感儲尿、副交感排尿；但最後尿不尿出來，由意識控制的外括約肌決定。"
      ],
      "ans-center": [
        "自主神經節前的細胞本體在脊髓的中側角(IML)，屬中樞——常和『中樞還周邊』一起考。",
        "初級中樞在脊髓/腦幹做內臟反射；高級中樞在腦幹和下視丘管體溫、水平衡、飲食、情緒。"
      ]
    },
    endocrine: {
      "endo-overview": [
        "荷爾蒙就是內分泌腺丟進血液的化學訊息，量極微，要靠目標細胞上的『受體』才生效。",
        "先看它溶不溶於水：水溶的（蛋白質／胺類）只能用細胞膜外的受體，脂溶的（類固醇）能鑽進細胞裡。",
        "蛋白質類 vs 類固醇類像兩種包裹：一種要在門口簽收（膜受體＋二級傳訊），一種能直接進屋改 DNA（核內受體）。",
        "eicosanoids 是用細胞膜上的脂肪酸（arachidonic acid）現做的局部荷爾蒙，就近作用、不跑遠。"
      ],
      "endo-adh-insulin": [
        "血量變少（像大出血），身體靠壓力感受器發現，趕快放抗利尿激素 ADH 把水留住。",
        "很多東西會調 ADH：壓力、痛、恐懼讓它升；酒精讓它降，所以喝酒會一直跑廁所、脫水。",
        "胰島素是『把多餘能量收進倉庫』的荷爾蒙：降血糖，叫肝、肌肉、脂肪把養分收起來。",
        "吃飽後血裡養分變多 → 胰島素出動 → 各組織把糖、胺基酸、脂肪收進去儲存。"
      ]
    },
    reproduction: {
      "repro-gonad": [
        "性腺（睪丸／卵巢）有兩個身分：做配子（精子／卵）的工廠，也是做性類固醇的工廠。",
        "男女其實一一對應：精子↔卵、Sertoli↔granulosa（保母細胞）、Leydig↔theca（做類固醇的）。",
        "性別像三道關卡：染色體性別→性腺性別→外觀性別；Y 上的 SRY 基因是把性腺推成睪丸的開關。"
      ],
      "repro-gameto": [
        "精子生成像不停的生產線：一個精原細胞分裂到底變 4 個精子，青春期後一輩子都在做。",
        "卵子生成走走停停：一個卵原細胞最後只變 1 顆卵，中途卡關兩次（排卵前、受精時才放行）。",
        "比一下：精子多又快（1→4）、卵子少又慢（1→1），差別都來自那兩次『暫停』。"
      ],
      "repro-steroid": [
        "所有性類固醇都從膽固醇一路改造而來，靠幾個酵素換零件，最後變睪固酮、雌激素。",
        "睪固酮還能再加工：5α-還原酶把它變更強的 DHT，aromatase 把它變雌激素。",
        "雌激素用完會被代謝：E2 變 E1、再變 E3，最後從尿液排掉。"
      ],
      "repro-axis": [
        "下視丘放 GnRH → 腦下垂體放 LH／FSH → 性腺做類固醇與配子，再回頭踩煞車（負回饋）。",
        "卵巢要兩種細胞合作：LH 叫 theca 做雄性素，FSH 叫 granulosa 用 aromatase 把它變雌激素。",
        "雌激素平常踩煞車（負回饋），但持續高過 48 小時就反過來踩油門 → LH 大爆發 → 排卵。"
      ]
    }
  };

  function simpleGuideForPoint(unitId, sectionId, pointIndex) {
    return simplePointGuides[unitId]?.[sectionId]?.[pointIndex] || "";
  }

  function narrativeForSection(unitId, section) {
    return sectionNarratives[unitId]?.[section.id] || {};
  }

  function defaultSectionThread(section) {
    return section.points.slice(0, 5).map((point, index) => `${index + 1}. ${point.title}`);
  }

  function defaultSectionWrapUp(section) {
    return section.points.map((point) => point.title).join(" -> ");
  }

  function bridgeForPoint(unitId, section, pointIndex) {
    const point = section.points[pointIndex];
    if (point.bridge) return point.bridge;
    const bridges = narrativeForSection(unitId, section).bridges || [];
    if (bridges[pointIndex]) return bridges[pointIndex];
    if (pointIndex === 0) return `這章先從「${point.title}」開始，因為它是後面推理的入口。`;
    const previous = section.points[pointIndex - 1];
    return `上一點先建立「${previous.title}」，所以這裡接著看「${point.title}」。`;
  }

  function totalDrills(unit) {
    return unit.sections.reduce((sum, section) => sum + section.points.length, 0) + unit.quiz.length;
  }

  function unitProgress(unit) {
    if (unit.status !== "active") return 0;
    const progress = readProgress()[unit.id] || {};
    if (progress.complete) return 100;
    const total = Math.max(1, totalDrills(unit));
    const done = new Set(progress.drills || []);
    return Math.min(100, Math.round((done.size / total) * 100));
  }

  function markDrill(unitId, key, correct) {
    if (!correct) return;
    const progress = readProgress();
    const entry = progress[unitId] || {};
    const drills = new Set(entry.drills || []);
    drills.add(key);
    progress[unitId] = { ...entry, drills: Array.from(drills) };
    writeProgress(progress);
  }

  function renderShell() {
    const sidebar = document.querySelector("[data-sidebar]");
    if (!sidebar) return;
    sidebar.innerHTML = `
      <div class="brand">
        <div class="brand-kicker">Physiology Final</div>
        <h1 class="brand-title">期末考<br/>互動總複習</h1>
      </div>
      <div class="nav-group">
        <div class="nav-label">Course</div>
        <a class="nav-link" href="./index.html" data-nav="home">總複習入口</a>
      </div>
      <div class="nav-group">
        <div class="nav-label">Units</div>
        ${data.units.map((unit) => unit.status === "active" ? `
          <a class="nav-link" href="./${unit.file}" data-unit-link="${unit.id}">
            <span>${escapeHtml(unit.shortTitle)}</span>
            <span class="progress-dot" data-progress-dot="${unit.id}"></span>
          </a>
        ` : `
          <span class="nav-link locked">
            <span>${escapeHtml(unit.shortTitle)}</span>
            <span class="chip">soon</span>
          </span>
        `).join("")}
      </div>
    `;
    const page = document.body.dataset.page;
    if (page === "home") {
      sidebar.querySelector('[data-nav="home"]')?.classList.add("active");
    }
    const unitId = document.body.dataset.unit;
    if (unitId) {
      sidebar.querySelector(`[data-unit-link="${unitId}"]`)?.classList.add("active");
    }
  }

  function renderProgressBadges() {
    document.querySelectorAll("[data-progress-dot]").forEach((dot) => {
      const unit = unitById(dot.dataset.progressDot);
      dot.classList.toggle("done", unit && unitProgress(unit) === 100);
    });
  }

  function renderDashboard() {
    const root = document.querySelector("[data-dashboard]");
    if (!root) return;
    const units = activeUnits();
    const complete = units.filter((unit) => unitProgress(unit) === 100).length;
    const pointCount = units.reduce((sum, unit) => sum + unit.sections.reduce((s, section) => s + section.points.length, 0), 0);
    const quizCount = units.reduce((sum, unit) => sum + unit.quiz.length, 0);
    const next = units.find((unit) => unitProgress(unit) < 100) || units[0];
    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">Interactive Review Entrance</div>
        <h1>${escapeHtml(data.course.title)}</h1>
        <p>${escapeHtml(data.course.subtitle)}</p>
        <div class="toolbar">
          <a class="btn" href="./${next.file}">${unitProgress(next) ? "繼續複習" : `從${escapeHtml(units[0].shortTitle)}開始`}</a>
          <a class="btn secondary" href="./${units[units.length - 1].file}">跳到${escapeHtml(units[units.length - 1].shortTitle)}</a>
          <button class="btn gold" type="button" data-random-quiz>隨機抽題</button>
        </div>
      </section>

      <section class="stat-grid">
        <div class="stat"><span class="unit-code">已開放單元</span><strong>${units.length} / ${data.units.length}</strong><span class="muted">全部 ${units.length} 個單元皆可完整複習。</span></div>
        <div class="stat"><span class="unit-code">知識點</span><strong>${pointCount}</strong><span class="muted">每個知識點都有題目。</span></div>
        <div class="stat"><span class="unit-code">總複習題</span><strong>${quizCount}</strong><span class="muted">章末混合題。</span></div>
        <div class="stat"><span class="unit-code">已完成</span><strong>${complete}</strong><span class="muted">本機瀏覽器進度。</span></div>
      </section>

      <section style="margin-top:24px">
        <h2 class="panel-title">七個期末單元</h2>
        <p class="muted">心血管、泌尿、中樞周邊、特殊感覺、自主神經、內分泌、生殖——全部七個單元皆已完成，可完整複習（13/14/15 附英文考法）。</p>
        <div class="grid two">
          ${data.units.map(renderUnitCard).join("")}
        </div>
      </section>

      <section class="grid two" style="margin-top:24px">
        <article class="review-panel">
          <div class="unit-code">全站複習</div>
          <h2 class="panel-title">期末總複習順序</h2>
          <ol>
            ${data.course.studyFlow.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ol>
        </article>
        <article class="review-panel">
          <div class="unit-code">高頻考點</div>
          <h2 class="panel-title">跨章考點</h2>
          <ul>
            ${data.course.highYield.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        </article>
      </section>

      <section class="review-panel" style="margin-top:24px">
        <div class="unit-code">隨機練習</div>
        <h2 class="panel-title">全站隨機題</h2>
        <div data-random-output class="mini-output">按「隨機抽題」會從全部七個單元的知識點題目隨機抽一題。</div>
      </section>
    `;
    root.querySelector("[data-random-quiz]")?.addEventListener("click", () => renderRandomQuiz(root));
    renderRandomQuiz(root);
    typesetMath();
  }

  function renderUnitCard(unit) {
    const progress = unitProgress(unit);
    const active = unit.status === "active";
    return `
      <article class="unit-card ${active ? "" : "locked"}" style="--accent:${unit.color}">
        <div class="unit-code">${escapeHtml(unit.code)} · ${active ? "已開放" : "之後製作"}</div>
        <h2>${escapeHtml(unit.title)}</h2>
        <p class="muted">${annotateTerms(unit.tagline)}</p>
        <div class="chips">
          ${unit.badges.map((badge) => `<span class="chip">${annotateTerms(badge)}</span>`).join("")}
        </div>
        ${active ? `
          <div class="meter" aria-label="progress"><span style="--value:${progress}%; --accent:${unit.color}"></span></div>
          <div class="toolbar">
            <a class="btn secondary" href="./${unit.file}">進入單元</a>
          </div>
        ` : `<button class="btn ghost" type="button">之後補齊</button>`}
      </article>
    `;
  }

  function renderRandomQuiz(root) {
    const drills = [];
    activeUnits().forEach((unit) => {
      unit.sections.forEach((section, sectionIndex) => {
        section.points.forEach((point, pointIndex) => {
          drills.push({ unit, section, point, key: `${unit.id}:s${sectionIndex}:p${pointIndex}` });
        });
      });
    });
    const item = drills[Math.floor(Math.random() * drills.length)];
    const output = root.querySelector("[data-random-output]");
    if (!item || !output) return;
    output.innerHTML = `
      <div class="unit-code">${escapeHtml(item.unit.shortTitle)} · ${annotateTerms(item.section.title)}</div>
      ${renderDrill(item.unit.id, `random:${item.key}`, item.point.drill)}
    `;
    bindChoices(output);
  }

  function renderUnit() {
    const root = document.querySelector("[data-unit-root]");
    const unit = unitById(document.body.dataset.unit);
    if (!root || !unit) return;
    const progress = unitProgress(unit);
    inlineTermSeen.clear();
    root.style.setProperty("--accent", unit.color);
    root.innerHTML = `
      <section class="hero">
        <div class="brand-kicker">${escapeHtml(unit.code)} · 互動教學單元</div>
        <h1>${escapeHtml(unit.title)}</h1>
        <p>${annotateTerms(unit.tagline)}</p>
        <div class="toolbar">
          <button class="btn" type="button" data-complete-unit="${unit.id}">標記本單元完成</button>
          <a class="btn secondary" href="./index.html">回總入口</a>
          <a class="btn secondary" href="#unit-review">跳到總複習</a>
        </div>
      </section>

      <section class="card pad">
        <div class="unit-code">章節地圖</div>
        <h2 class="panel-title">章節地圖</h2>
        <p class="muted">目前進度 ${progress}%。先點互動模型建立直覺，再做每個知識點底下的小題。</p>
        <div class="chips" style="margin-top:14px">
          ${unit.sections.map((section, index) => `<a class="btn small secondary" href="#${section.id}">${String(index + 1).padStart(2, "0")} ${escapeHtml(section.short || section.title)}</a>`).join("")}
        </div>
      </section>

      ${unit.sections.map((section, sectionIndex) => renderSection(unit, section, sectionIndex)).join("")}
      ${renderReview(unit)}
      ${renderSources(unit)}
    `;
    root.querySelector("[data-complete-unit]")?.addEventListener("click", (event) => {
      const progress = readProgress();
      progress[unit.id] = { ...(progress[unit.id] || {}), complete: true };
      writeProgress(progress);
      event.currentTarget.textContent = "已完成";
    });
    bindChoices(root);
    renderInteractions(root);
    initPointBlocks(root);
    typesetMath();
    applyAuditMode(root, unit);
  }

  function applyAuditMode(root, unit) {
    const mode = new URLSearchParams(window.location.search).get("audit");
    if (!["figures", "labs"].includes(mode)) return;
    const nodes = mode === "figures"
      ? [...root.querySelectorAll(".point-card")]
          .map((card, index) => {
            const title = card.querySelector("h3")?.textContent?.trim() || `Figure ${index + 1}`;
            const frame = card.querySelector(".visual-frame")?.outerHTML || "";
            return `<article class="audit-card"><h3><span>${index + 1}</span>${escapeHtml(title)}</h3>${frame}</article>`;
          })
      : [...root.querySelectorAll(".lab")]
          .map((lab, index) => `<article class="audit-card audit-lab"><h3><span>${index + 1}</span>${escapeHtml(lab.closest(".section-card")?.querySelector("h2")?.textContent?.trim() || `Lab ${index + 1}`)}</h3>${lab.outerHTML}</article>`);
    root.innerHTML = `
      <section class="audit-wrap">
        <h1>${escapeHtml(unit.title)} ${mode === "figures" ? "小圖檢查" : "動畫檢查"}</h1>
        <div class="audit-grid">${nodes.join("")}</div>
      </section>
    `;
    if (mode === "labs") renderInteractions(root);
  }

  function renderSection(unit, section, sectionIndex) {
    const narrative = narrativeForSection(unit.id, section);
    const thread = section.thread || narrative.thread || defaultSectionThread(section);
    const wrapUp = section.wrapUp || narrative.wrapUp || defaultSectionWrapUp(section);
    return `
      <article class="card section-card" id="${section.id}">
        <div class="section-head">
          <div class="unit-code">${escapeHtml(unit.shortTitle)} · ${String(sectionIndex + 1).padStart(2, "0")}</div>
          <h2>${annotateTerms(section.title)}</h2>
          <p>${annotateTerms(section.summary)}</p>
          ${renderSectionThread(thread)}
        </div>
        ${section.interaction ? `<div class="lab" data-interaction="${section.interaction}"></div>` : ""}
        <div class="point-grid">
          ${section.points.map((point, pointIndex) => renderPoint(unit.id, section, sectionIndex, point, pointIndex)).join("")}
        </div>
        ${renderSectionWrapUp(wrapUp)}
      </article>
    `;
  }

  function renderSectionThread(thread = []) {
    if (!thread.length) return "";
    return `
      <div class="section-thread" aria-label="本章主線">
        <b>本章主線</b>
        <ol>${thread.map((item) => `<li>${annotateTerms(item)}</li>`).join("")}</ol>
      </div>
    `;
  }

  function renderSectionWrapUp(wrapUp) {
    if (!wrapUp) return "";
    return `
      <div class="section-wrapup">
        <b>把這章串起來</b>
        <span>${annotateTerms(wrapUp)}</span>
      </div>
    `;
  }

  function renderPoint(unitId, section, sectionIndex, point, pointIndex) {
    const key = `${unitId}:s${sectionIndex}:p${pointIndex}`;
    const examPoints = point.exam || point.bullets || [];
    const trap = point.trap || "";
    const simpleGuide = simpleGuideForPoint(unitId, section.id, pointIndex);
    const moreInner = [
      point.mechanism ? `<div class="more-block"><b>它為什麼會這樣</b><p>${annotateTerms(point.mechanism)}</p></div>` : "",
      examPoints.length ? `<div class="more-block exam"><b>台大會怎麼考</b><ul>${examPoints.map((item) => `<li>${annotateTerms(item)}</li>`).join("")}</ul></div>` : "",
      trap ? `<div class="more-block trap"><b>最容易踩的坑</b><p>${annotateTerms(trap)}</p></div>` : "",
      point.formula ? `<div class="more-block formula"><b>一定要會用</b><span>${escapeHtml(point.formula)}</span></div>` : ""
    ].join("");
    return `
      <section class="point-card">
        <h3>${annotateTerms(point.title)}</h3>
        ${simpleGuide ? `<p class="point-lead">${annotateTerms(simpleGuide)}</p>` : ""}
        ${pointBlockSlot(unitId, sectionIndex, pointIndex) || renderPointVisual(unitId, sectionIndex, point, pointIndex)}
        <p class="point-key"><span class="point-key-tag">重點</span><span>${annotateTerms(point.plain || point.text)}</span></p>
        ${(point.examEN && point.examEN.length) ? `<div class="point-examen"><b>✏️ 英文考法 English phrasing</b><ul>${point.examEN.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
        ${moreInner ? `<details class="point-more"><summary><span>機制 · 考點 · 常見坑</span></summary><div class="more-body">${moreInner}</div></details>` : ""}
        ${renderDrill(unitId, key, point.drill)}
      </section>
    `;
  }

  function renderPointTerms(point) {
    const termSource = [
      point.title,
      point.text,
      point.plain,
      point.mechanism,
      ...(point.bullets || []),
      ...(point.exam || []),
      point.formula,
      point.trap,
      point.drill?.question,
      ...(point.drill?.choices || []),
      point.drill?.explain
    ].join(" ");
    const notes = renderTermNotes(termSource, 7);
    if (!notes) return "";
    return `
      <div class="point-terms">
        <b>術語補充</b>
        ${notes}
      </div>
    `;
  }

  function renderPointVisual(unitId, sectionIndex, point, pointIndex) {
    const text = `${point.title} ${point.text} ${(point.bullets || []).join(" ")} ${(point.formula || "")}`.toLowerCase();
    const focus = escapeHtml(point.title);
    let visual = simplePointVisual(unitId, sectionIndex, pointIndex, point, text);
    visual ||= genericPhysioVisual(sectionIndex, pointIndex);
    const legend = visual.legend || pointLegend(unitId, sectionIndex);
    const viewBox = visual.viewBox || "0 0 420 190";
    return `
      <figure class="point-visual ${visual.className || ""}" aria-label="${focus} 的生理示意圖">
        <div class="visual-frame">
          <svg viewBox="${viewBox}" role="img" aria-hidden="true">
            <defs>
              <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L0,6 L8,3 z" fill="#182033"></path>
              </marker>
              <marker id="arrow-red" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
                <path d="M0,0 L0,6 L8,3 z" fill="#bc3f34"></path>
              </marker>
              <linearGradient id="tissue-red" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stop-color="#fff2ee"></stop>
                <stop offset="1" stop-color="#bc3f3429"></stop>
              </linearGradient>
              <linearGradient id="tissue-blue" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stop-color="#eef6fb"></stop>
                <stop offset="1" stop-color="#2e5f8d2b"></stop>
              </linearGradient>
              <linearGradient id="tissue-green" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stop-color="#eff8f0"></stop>
                <stop offset="1" stop-color="#23694f24"></stop>
              </linearGradient>
              <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#182033" flood-opacity=".13"></feDropShadow>
              </filter>
            </defs>
            ${visual.svg}
          </svg>
        </div>
        <figcaption>
          <strong>${focus}</strong>
          <span>${annotateTerms(visual.caption)}</span>
          ${renderVisualLegend(legend)}
        </figcaption>
      </figure>
    `;
  }

  function renderHeartAnatomySvgLegacy({ x = 0, y = 0, scale = 1, mode = "flow", focus = "", showFlow = false, showConduction = false, showEcg = false } = {}) {
    const transform = `translate(${x} ${y}) scale(${scale})`;
    const heartFocus = {
      chambers: [[156, 202, 14]],
      avValves: [[128, 165, 8], [190, 164, 8]],
      semilunarValves: [[137, 117, 7], [205, 96, 7]],
      lvPressure: [[207, 222, 12]],
      workingMyocardium: [[207, 222, 12]],
      hisPurkinje: [[156, 270, 10]],
      avDelay: [[136, 163, 10]],
      bypass: [[205, 188, 10]],
      saNode: [[102, 126, 10]],
      avNode: [[136, 163, 10]],
      hisBundle: [[151, 202, 10]],
      bundleBranches: [[156, 248, 10]],
      purkinje: [[214, 221, 10]]
    };
    const ring = (name) => (heartFocus[name] || []).map(([cx, cy, r]) => (
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(184,135,30,.18)" stroke="#b8871e" stroke-width="3" class="pulse-dot"/>`
    )).join("");
    const ecgFocus = {
      saNode: [178, 512, 28, 40],
      avNode: [225, 512, 36, 40],
      hisBundle: [272, 512, 44, 46],
      bundleBranches: [282, 512, 44, 46],
      purkinje: [296, 512, 52, 46],
      tWave: [424, 512, 56, 40]
    };
    const ecgBox = showEcg && ecgFocus[focus]
      ? `<rect x="${ecgFocus[focus][0] - ecgFocus[focus][2] / 2}" y="${ecgFocus[focus][1] - ecgFocus[focus][3] / 2}" width="${ecgFocus[focus][2]}" height="${ecgFocus[focus][3]}" rx="8" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`
      : "";
    const flowLayer = showFlow ? {
      chambers: "",
      avValves: `
        <path d="M111 150 C116 160 122 167 130 174" fill="none" stroke="#145d9e" stroke-width="3.5" marker-end="url(#heart-blue-arrow)"/>
        <path d="M188 147 C190 158 195 168 202 180" fill="none" stroke="#bc3f34" stroke-width="3.5" marker-end="url(#heart-red-arrow)"/>
      `,
      semilunarValves: `
        <path d="M132 206 C133 166 135 134 141 116" fill="none" stroke="#145d9e" stroke-width="3.5" marker-end="url(#heart-blue-arrow)"/>
        <path d="M210 202 C216 164 214 126 207 96" fill="none" stroke="#bc3f34" stroke-width="3.5" marker-end="url(#heart-red-arrow)"/>
      `,
      lvPressure: `
        <path d="M210 205 C220 163 216 122 207 96" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#heart-red-arrow)"/>
      `
    }[focus] || "" : "";
    return `
      <defs>
        <marker id="heart-blue-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#145d9e"></path>
        </marker>
        <marker id="heart-red-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#bc3f34"></path>
        </marker>
        <marker id="heart-dark-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#182033"></path>
        </marker>
      </defs>
      <g transform="${transform}">
        <g opacity=".86">
          <path d="M178 88 C176 50 205 34 232 50 C257 65 257 99 232 120" fill="none" stroke="#c24136" stroke-width="11" stroke-linecap="round"/>
          <path d="M203 45 V22 M229 53 V29 M250 76 L270 64" stroke="#c24136" stroke-width="7" stroke-linecap="round"/>
          <path d="M126 112 C154 90 194 91 234 105 L278 112" fill="none" stroke="#70bee4" stroke-width="12" stroke-linecap="round"/>
          <path d="M63 40 V156 M63 228 V326 M40 118 H63" stroke="#70bee4" stroke-width="13" stroke-linecap="round"/>
          <path d="M264 148 H224 M264 167 H226" stroke="#c24136" stroke-width="5.5" stroke-linecap="round"/>
        </g>
        <path d="M82 145 C80 104 121 83 158 112 C187 92 233 113 251 164 C273 228 229 304 156 329 C94 306 62 246 68 190 C70 170 74 155 82 145Z" fill="#f8cdbb" stroke="#182033" stroke-width="3"/>
        <path d="M86 151 C93 116 126 107 153 129 C140 153 144 181 162 210 C128 226 92 203 82 176 C79 166 80 158 86 151Z" fill="#8ccceb" stroke="#2e5f8d" stroke-width="2.5"/>
        <path d="M118 213 C144 236 184 253 217 244 C199 296 136 296 100 253 C98 235 105 221 118 213Z" fill="#8ccceb" stroke="#2e5f8d" stroke-width="2.5"/>
        <path d="M170 127 C194 109 225 120 242 148 C217 159 190 156 170 143Z" fill="#d96352" stroke="#bc3f34" stroke-width="2.5"/>
        <path d="M172 171 C213 156 247 186 239 229 C223 270 178 257 153 220 C151 198 158 181 172 171Z" fill="#d96352" stroke="#bc3f34" stroke-width="2.5"/>
        <path d="M158 116 C150 165 154 224 174 286" fill="none" stroke="#182033" stroke-width="2.4" opacity=".62"/>
        <path d="M120 160 L132 170 L145 160 M182 158 L194 168 L207 158" fill="none" stroke="#fff6df" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M132 117 C140 112 149 113 156 120 M198 99 C206 96 215 97 222 103" fill="none" stroke="#fff6df" stroke-width="4" stroke-linecap="round"/>
        <text x="95" y="151" font-size="14" font-weight="900" fill="#12324a">RA</text>
        <text x="137" y="255" font-size="14" font-weight="900" fill="#12324a">RV</text>
        <text x="198" y="139" font-size="14" font-weight="900" fill="#fff">LA</text>
        <text x="198" y="221" font-size="14" font-weight="900" fill="#fff">LV</text>
        <text x="43" y="35" font-size="10" font-weight="900">SVC</text>
        <text x="41" y="348" font-size="10" font-weight="900">IVC</text>
        <text x="194" y="20" font-size="10" font-weight="900">aorta</text>
        <text x="245" y="102" font-size="10" font-weight="900">PA</text>
        <text x="260" y="164" font-size="10" font-weight="900">PV</text>
        ${flowLayer}
        ${showConduction ? `
          <circle cx="102" cy="126" r="8" fill="#b8871e"/><text x="113" y="130" font-size="12" font-weight="900">SA</text>
          <circle cx="136" cy="163" r="7.5" fill="#2e5f8d"/><text x="147" y="167" font-size="12" font-weight="900">AV</text>
          <path d="M103 134 C116 148 126 155 136 163" fill="none" stroke="#182033" stroke-width="3.5" marker-end="url(#heart-dark-arrow)"/>
          <path d="M136 172 C151 201 156 237 156 270" fill="none" stroke="#182033" stroke-width="3.5" marker-end="url(#heart-dark-arrow)"/>
          <path d="M156 270 C130 246 108 220 90 186 M156 270 C185 248 213 235 238 220" fill="none" stroke="#23694f" stroke-width="3.2" stroke-linecap="round"/>
          ${focus === "bypass" ? `<path d="M112 143 C160 154 202 172 238 214" fill="none" stroke="#6552a3" stroke-width="4" stroke-dasharray="7 6"/>` : ""}
        ` : ""}
        ${ring(focus)}
      </g>
      ${showEcg ? `
        <g>
          <text x="118" y="514" fill="#182033" font-size="16" font-weight="800">ECG</text>
          <path d="M155 510 L190 510 Q200 486 214 510 L248 510 L260 510 L272 472 L286 532 L306 510 L352 510 Q378 477 414 510 L492 510" fill="none" stroke="#182033" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="198" y="478" font-size="13" font-weight="900">P</text><text x="260" y="464" font-size="13" font-weight="900">QRS</text><text x="404" y="478" font-size="13" font-weight="900">T</text>
          ${ecgBox}
        </g>
      ` : ""}
    `;
  }

  function renderHeartAnatomySvgFlatLegacy({ x = 0, y = 0, scale = 1, mode = "flow", focus = "", showFlow = false, showConduction = false, showEcg = false } = {}) {
    const transform = `translate(${x} ${y}) scale(${scale})`;
    const focusLayer = {
      chambers: `
        <path d="M88 142 C91 104 124 86 156 111 C187 88 232 104 250 149 C272 219 236 299 155 334 C93 306 62 244 69 187 C72 166 78 151 88 142Z" fill="rgba(184,135,30,.1)" stroke="#b8871e" stroke-width="2.4"/>
      `,
      avValves: `
        <ellipse cx="132" cy="166" rx="20" ry="13" fill="rgba(184,135,30,.18)" stroke="#b8871e" stroke-width="2"/>
        <ellipse cx="196" cy="166" rx="20" ry="13" fill="rgba(184,135,30,.18)" stroke="#b8871e" stroke-width="2"/>
      `,
      semilunarValves: `
        <ellipse cx="139" cy="119" rx="18" ry="12" fill="rgba(184,135,30,.18)" stroke="#b8871e" stroke-width="2"/>
        <ellipse cx="205" cy="99" rx="17" ry="11" fill="rgba(184,135,30,.18)" stroke="#b8871e" stroke-width="2"/>
      `,
      lvPressure: `
        <path d="M174 169 C214 154 250 186 240 232 C229 279 181 270 153 222 C151 197 159 179 174 169Z" fill="rgba(188,63,52,.14)" stroke="#bc3f34" stroke-width="3"/>
        <ellipse cx="205" cy="99" rx="17" ry="11" fill="rgba(184,135,30,.16)" stroke="#b8871e" stroke-width="2"/>
      `,
      workingMyocardium: `
        <path d="M105 215 C135 231 183 249 222 237 C202 291 145 300 101 260 C98 239 102 224 105 215Z" fill="rgba(184,135,30,.12)" stroke="#b8871e" stroke-width="2.4"/>
        <path d="M174 169 C214 154 250 186 240 232 C229 279 181 270 153 222 C151 197 159 179 174 169Z" fill="rgba(184,135,30,.12)" stroke="#b8871e" stroke-width="2.4"/>
      `,
      hisPurkinje: `
        <path d="M136 172 C151 200 156 235 156 269" fill="none" stroke="#b8871e" stroke-width="6" stroke-linecap="round" opacity=".28"/>
        <path d="M156 269 C131 246 109 221 91 187 M156 269 C184 249 214 235 238 220" fill="none" stroke="#b8871e" stroke-width="6" stroke-linecap="round" opacity=".28"/>
      `,
      avDelay: `<circle cx="136" cy="166" r="15" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      bypass: `<path d="M112 143 C160 154 203 173 238 214" fill="none" stroke="#6552a3" stroke-width="7" stroke-linecap="round" opacity=".22"/>`,
      saNode: `<circle cx="102" cy="126" r="15" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      avNode: `<circle cx="136" cy="166" r="15" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      hisBundle: `<circle cx="150" cy="198" r="15" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      bundleBranches: `<circle cx="158" cy="242" r="17" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      purkinje: `<path d="M156 269 C131 246 109 221 91 187 M156 269 C184 249 214 235 238 220" fill="none" stroke="#b8871e" stroke-width="7" stroke-linecap="round" opacity=".28"/>`
    }[focus] || "";

    const flowStrip = showFlow ? `
      <g transform="translate(24 324)" font-size="8.2" font-weight="900" text-anchor="middle">
        <path d="M14 8 H226" fill="none" stroke="#145d9e" stroke-width="3" marker-end="url(#heart-blue-arrow)"/>
        <path d="M14 30 H226" fill="none" stroke="#bc3f34" stroke-width="3" marker-end="url(#heart-red-arrow)"/>
        <g fill="#8ccceb" stroke="#2e5f8d" stroke-width="1.5">
          <circle cx="14" cy="8" r="6"/><circle cx="76" cy="8" r="6"/><circle cx="138" cy="8" r="6"/><circle cx="200" cy="8" r="6"/>
        </g>
        <g fill="#d96352" stroke="#bc3f34" stroke-width="1.5">
          <circle cx="14" cy="30" r="6"/><circle cx="76" cy="30" r="6"/><circle cx="138" cy="30" r="6"/><circle cx="200" cy="30" r="6"/>
        </g>
        <text x="14" y="-2">SVC/IVC</text><text x="76" y="-2">RA</text><text x="138" y="-2">RV</text><text x="200" y="-2">PA</text>
        <text x="14" y="45">PV</text><text x="76" y="45">LA</text><text x="138" y="45">LV</text><text x="200" y="45">Ao</text>
      </g>
    ` : "";

    const conductionLayer = showConduction ? `
      <g>
        <circle cx="102" cy="126" r="7" fill="#b8871e" stroke="#fffdf7" stroke-width="2"/><text x="113" y="130" font-size="11" font-weight="900">SA</text>
        <circle cx="136" cy="166" r="6.5" fill="#2e5f8d" stroke="#fffdf7" stroke-width="2"/><text x="146" y="170" font-size="11" font-weight="900">AV</text>
        <path d="M104 134 C116 149 126 157 136 166" fill="none" stroke="#182033" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-dark-arrow)"/>
        <path d="M136 173 C150 200 156 236 156 269" fill="none" stroke="#182033" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-dark-arrow)"/>
        <path d="M156 269 C132 247 109 222 91 187 M156 269 C184 249 214 235 238 220" fill="none" stroke="#23694f" stroke-width="3.2" stroke-linecap="round"/>
        ${focus === "bypass" ? `<path d="M112 143 C160 154 203 173 238 214" fill="none" stroke="#6552a3" stroke-width="4" stroke-dasharray="7 6" stroke-linecap="round"/>` : ""}
      </g>
    ` : "";

    const ecgFocus = {
      saNode: [178, 512, 28, 40],
      avNode: [225, 512, 36, 40],
      hisBundle: [272, 512, 44, 46],
      bundleBranches: [282, 512, 44, 46],
      purkinje: [296, 512, 52, 46],
      tWave: [424, 512, 56, 40]
    };
    const ecgBox = showEcg && ecgFocus[focus]
      ? `<rect x="${ecgFocus[focus][0] - ecgFocus[focus][2] / 2}" y="${ecgFocus[focus][1] - ecgFocus[focus][3] / 2}" width="${ecgFocus[focus][2]}" height="${ecgFocus[focus][3]}" rx="8" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`
      : "";

    return `
      <defs>
        <marker id="heart-blue-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#145d9e"></path>
        </marker>
        <marker id="heart-red-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#bc3f34"></path>
        </marker>
        <marker id="heart-dark-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#182033"></path>
        </marker>
      </defs>
      <g transform="${transform}">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".95">
          <path d="M205 99 C198 67 215 43 241 51 C270 60 272 93 247 114" stroke="#c24136" stroke-width="10"/>
          <path d="M219 49 V22 M247 59 V31 M267 82 L282 70" stroke="#c24136" stroke-width="6.5"/>
          <path d="M138 120 C150 96 178 91 207 101 C232 109 253 115 278 121" stroke="#70bee4" stroke-width="11"/>
          <path d="M62 40 V154 M62 230 V330 M42 119 H86 M62 238 C72 236 80 230 89 221" stroke="#70bee4" stroke-width="12"/>
          <path d="M260 145 H229 M260 164 H228" stroke="#c24136" stroke-width="5"/>
        </g>
        <path d="M88 142 C91 104 124 86 156 111 C187 88 232 104 250 149 C272 219 236 299 155 334 C93 306 62 244 69 187 C72 166 78 151 88 142Z" fill="#f8cdbb" stroke="#182033" stroke-width="3"/>
        <path d="M91 148 C97 116 127 104 153 126 C145 148 145 176 158 199 C126 208 99 197 86 174 C81 163 83 154 91 148Z" fill="#8ccceb" stroke="#2e5f8d" stroke-width="2.3"/>
        <path d="M106 214 C136 230 183 247 222 237 C203 290 145 299 101 260 C98 239 102 224 106 214Z" fill="#8ccceb" stroke="#2e5f8d" stroke-width="2.3"/>
        <path d="M169 128 C196 110 229 122 244 151 C222 160 191 157 169 144Z" fill="#d96352" stroke="#bc3f34" stroke-width="2.3"/>
        <path d="M174 169 C214 154 250 186 240 232 C229 279 181 270 153 222 C151 197 159 179 174 169Z" fill="#d96352" stroke="#bc3f34" stroke-width="2.3"/>
        <path d="M158 116 C149 165 154 224 176 287" fill="none" stroke="#182033" stroke-width="2.3" opacity=".65"/>
        <g fill="none" stroke="#fff6df" stroke-linecap="round" stroke-linejoin="round">
          <path d="M119 162 L132 174 L147 162" stroke-width="4.4"/>
          <path d="M181 162 L195 175 L211 162" stroke-width="4.4"/>
          <path d="M129 119 C137 114 146 115 153 122" stroke-width="3.8"/>
          <path d="M196 99 C204 96 212 97 219 103" stroke-width="3.8"/>
        </g>
        ${focusLayer}
        <g font-size="13.5" font-weight="900" text-anchor="middle">
          <text x="103" y="151" fill="#12324a">RA</text>
          <text x="136" y="257" fill="#12324a">RV</text>
          <text x="204" y="141" fill="#fff">LA</text>
          <text x="202" y="222" fill="#fff">LV</text>
        </g>
        <g font-size="10.5" font-weight="900" fill="#101827">
          <text x="43" y="35">SVC</text><text x="41" y="348">IVC</text>
          <text x="200" y="20">Ao</text><text x="248" y="105">PA</text><text x="263" y="164">PV</text>
        </g>
        ${conductionLayer}
        ${flowStrip}
      </g>
      ${showEcg ? `
        <g>
          <text x="118" y="514" fill="#182033" font-size="16" font-weight="800">ECG</text>
          <path d="M155 510 L190 510 Q200 486 214 510 L248 510 L260 510 L272 472 L286 532 L306 510 L352 510 Q378 477 414 510 L492 510" fill="none" stroke="#182033" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="198" y="478" font-size="13" font-weight="900">P</text><text x="260" y="464" font-size="13" font-weight="900">QRS</text><text x="404" y="478" font-size="13" font-weight="900">T</text>
          ${ecgBox}
        </g>
      ` : ""}
    `;
  }

  function renderHeartAnatomySvg({ x = 0, y = 0, scale = 1, mode = "flow", focus = "", showFlow = false, showConduction = false, showEcg = false } = {}) {
    const transform = `translate(${x} ${y}) scale(${scale})`;
    const focusLayer = {
      chambers: "",
      avValves: `
        <ellipse cx="116" cy="182" rx="15" ry="8" fill="rgba(184,135,30,.22)" stroke="#b8871e" stroke-width="2"/>
        <ellipse cx="186" cy="182" rx="15" ry="8" fill="rgba(184,135,30,.22)" stroke="#b8871e" stroke-width="2"/>
      `,
      semilunarValves: `
        <ellipse cx="134" cy="142" rx="12" ry="7" fill="rgba(184,135,30,.22)" stroke="#b8871e" stroke-width="2"/>
        <ellipse cx="173" cy="134" rx="12" ry="7" fill="rgba(184,135,30,.22)" stroke="#b8871e" stroke-width="2"/>
      `,
      lvPressure: `
        <path d="M190 240 C184 200 177 162 173 140" fill="none" stroke="#bc3f34" stroke-width="4" stroke-linecap="round" marker-end="url(#heart-red-arrow)"/>
        <ellipse cx="173" cy="134" rx="12" ry="7" fill="rgba(184,135,30,.18)" stroke="#b8871e" stroke-width="2"/>
      `,
      workingMyocardium: `
        <path d="M150 130 C126 122 96 126 86 152 C82 172 86 184 96 186 L204 186 C216 182 218 166 214 152 C204 126 174 122 150 130Z" fill="rgba(184,135,30,.12)" stroke="#b8871e" stroke-width="2.2"/>
        <path d="M96 188 C100 240 122 296 174 314 C212 292 226 244 228 196 C229 190 224 188 214 188Z" fill="rgba(184,135,30,.1)" stroke="#b8871e" stroke-width="2.2"/>
      `,
      hisPurkinje: `
        <path d="M150 184 C156 212 162 250 174 300" fill="none" stroke="#b8871e" stroke-width="6" stroke-linecap="round" opacity=".28"/>
        <path d="M174 300 C150 282 120 250 96 200 M174 300 C202 282 224 250 230 200" fill="none" stroke="#b8871e" stroke-width="6" stroke-linecap="round" opacity=".28"/>
      `,
      avDelay: `<circle cx="150" cy="182" r="13" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      bypass: `<path d="M198 168 C216 188 222 214 214 240" fill="none" stroke="#6552a3" stroke-width="7" stroke-linecap="round" opacity=".22"/>`,
      saNode: `<circle cx="112" cy="132" r="13" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      avNode: `<circle cx="150" cy="182" r="13" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      hisBundle: `<circle cx="153" cy="206" r="13" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      bundleBranches: `<circle cx="162" cy="246" r="14" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`,
      purkinje: `<path d="M174 300 C150 282 120 250 96 200 M174 300 C202 282 224 250 230 200" fill="none" stroke="#b8871e" stroke-width="7" stroke-linecap="round" opacity=".28"/>`
    }[focus] || "";

    const insideFlow = showFlow ? {
      chambers: `
        <path d="M110 158 C108 180 112 208 120 232" fill="none" stroke="#145d9e" stroke-width="3.2" stroke-linecap="round" marker-end="url(#heart-blue-arrow)"/>
        <path d="M128 196 C132 172 134 158 134 148" fill="none" stroke="#145d9e" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-blue-arrow)"/>
        <path d="M192 158 C194 180 192 208 190 232" fill="none" stroke="#bc3f34" stroke-width="3.2" stroke-linecap="round" marker-end="url(#heart-red-arrow)"/>
        <path d="M186 196 C181 170 177 152 173 140" fill="none" stroke="#bc3f34" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-red-arrow)"/>
      `,
      avValves: `
        <path d="M110 160 C113 170 115 180 118 190" fill="none" stroke="#145d9e" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-blue-arrow)"/>
        <path d="M192 160 C190 172 188 180 186 190" fill="none" stroke="#bc3f34" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-red-arrow)"/>
      `,
      semilunarValves: `
        <path d="M130 188 C132 170 134 158 134 148" fill="none" stroke="#145d9e" stroke-width="3.2" stroke-linecap="round" marker-end="url(#heart-blue-arrow)"/>
        <path d="M184 188 C180 168 176 152 173 140" fill="none" stroke="#bc3f34" stroke-width="3.2" stroke-linecap="round" marker-end="url(#heart-red-arrow)"/>
      `,
      lvPressure: ""
    }[focus] || "" : "";

    const flowStrip = "";

    const conductionLayer = showConduction ? `
      <g>
        <circle cx="112" cy="132" r="7" fill="#b8871e" stroke="#fffdf7" stroke-width="2"/><text x="122" y="136" font-size="11" font-weight="900">SA</text>
        <circle cx="150" cy="182" r="6.5" fill="#2e5f8d" stroke="#fffdf7" stroke-width="2"/><text x="158" y="178" font-size="11" font-weight="900">AV</text>
        <path d="M114 139 C126 153 139 168 150 182" fill="none" stroke="#182033" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-dark-arrow)"/>
        <path d="M150 189 C156 214 162 250 174 300" fill="none" stroke="#182033" stroke-width="3" stroke-linecap="round" marker-end="url(#heart-dark-arrow)"/>
        <path d="M174 300 C150 282 120 250 96 200 M174 300 C202 282 224 250 230 200" fill="none" stroke="#23694f" stroke-width="3.1" stroke-linecap="round"/>
        ${focus === "bypass" ? `<path d="M198 168 C216 188 222 214 214 240" fill="none" stroke="#6552a3" stroke-width="4" stroke-dasharray="7 6" stroke-linecap="round"/>` : ""}
      </g>
    ` : "";

    const ecgFocus = {
      saNode: [178, 512, 28, 40],
      avNode: [225, 512, 36, 40],
      hisBundle: [272, 512, 44, 46],
      bundleBranches: [282, 512, 44, 46],
      purkinje: [296, 512, 52, 46],
      tWave: [424, 512, 56, 40]
    };
    const ecgBox = showEcg && ecgFocus[focus]
      ? `<rect x="${ecgFocus[focus][0] - ecgFocus[focus][2] / 2}" y="${ecgFocus[focus][1] - ecgFocus[focus][3] / 2}" width="${ecgFocus[focus][2]}" height="${ecgFocus[focus][3]}" rx="8" fill="rgba(184,135,30,.2)" stroke="#b8871e" stroke-width="2"/>`
      : "";

    return `
      <defs>
        <marker id="heart-blue-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#145d9e"></path>
        </marker>
        <marker id="heart-red-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#bc3f34"></path>
        </marker>
        <marker id="heart-dark-arrow" markerWidth="8" markerHeight="8" refX="6.5" refY="4" orient="auto" markerUnits="userSpaceOnUse">
          <path d="M0,0 L0,8 L8,4 z" fill="#182033"></path>
        </marker>
      </defs>
      <g transform="${transform}">
        <g fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M173 134 C171 112 168 92 166 76 C161 48 187 32 212 41 C235 49 238 78 226 100" stroke="#c5413a" stroke-width="10"/>
          <path d="M196 40 V18 M213 41 V20 M228 52 L243 43" stroke="#c5413a" stroke-width="6"/>
          <path d="M134 142 C137 120 140 106 146 96 C166 84 192 92 212 106" stroke="#7cc0e6" stroke-width="9"/>
          <path d="M146 96 C139 104 131 109 121 111" stroke="#7cc0e6" stroke-width="7"/>
          <path d="M82 38 V152" stroke="#7cc0e6" stroke-width="13"/>
          <path d="M82 346 V190" stroke="#7cc0e6" stroke-width="13"/>
          <path d="M244 150 H210 M244 166 H212" stroke="#c5413a" stroke-width="5"/>
        </g>
        <path d="M150 116 C118 102 86 110 78 138 C70 165 62 188 62 208 C62 246 86 300 138 320 C156 326 164 326 174 322 C214 314 240 280 244 236 C248 196 244 160 232 138 C220 116 182 102 150 116Z" fill="#f3c7b6" stroke="#182033" stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M150 130 C126 122 96 126 86 152 C82 168 84 178 88 184 L150 182 C149 165 149 147 150 130Z" fill="#8ecbe8"/>
        <path d="M150 182 L88 184 C92 230 104 272 132 292 C150 282 158 268 160 248 C156 220 152 200 150 182Z" fill="#6fb8de"/>
        <path d="M150 130 C174 122 204 126 214 152 C218 168 216 178 212 184 L150 182 C151 165 151 147 150 130Z" fill="#e9a899"/>
        <path d="M150 182 C152 200 156 222 160 248 C164 274 168 296 174 312 C204 290 224 250 228 198 C229 190 224 186 212 184 L150 182Z" fill="#d4604f"/>
        <path d="M150 130 C149 162 154 206 160 248 C166 276 170 296 174 312" fill="none" stroke="#182033" stroke-width="1.6" opacity=".4"/>
        <path d="M88 184 H212 M86 152 C120 160 180 160 214 152" fill="none" stroke="#182033" stroke-width="1.1" opacity=".22"/>
        <g fill="none" stroke="#fff6df" stroke-width="2.6" stroke-linecap="round" opacity=".92">
          <path d="M104 182 Q110 188 116 182 Q122 188 128 182"/>
          <path d="M174 182 Q180 188 186 182 Q192 188 198 182"/>
          <path d="M124 142 Q129 136 134 142 Q139 136 144 142"/>
          <path d="M163 134 Q168 128 173 134 Q178 128 183 134"/>
        </g>
        ${focusLayer}
        ${insideFlow}
        <ellipse cx="104" cy="232" rx="16" ry="7" fill="#fffdf7" opacity=".16" transform="rotate(-28 104 232)"/>
        <ellipse cx="206" cy="156" rx="13" ry="6" fill="#fffdf7" opacity=".14" transform="rotate(12 206 156)"/>
        <g font-size="13.5" font-weight="900" text-anchor="middle">
          <text x="112" y="160" fill="#12324a">RA</text>
          <text x="118" y="252" fill="#12324a">RV</text>
          <text x="188" y="162" fill="#fff">LA</text>
          <text x="190" y="252" fill="#fff">LV</text>
        </g>
        <g font-size="10.5" font-weight="900" fill="#101827" stroke="#fffdf7" stroke-width="3" paint-order="stroke" text-anchor="middle">
          <text x="70" y="36">SVC</text><text x="70" y="352">IVC</text>
          <text x="152" y="22">Ao</text><text x="232" y="100">PA</text><text x="252" y="150">PV</text>
        </g>
        ${conductionLayer}
        ${flowStrip}
      </g>
      ${showEcg ? `
        <g>
          <text x="118" y="514" fill="#182033" font-size="16" font-weight="800">ECG</text>
          <path d="M155 510 L190 510 Q200 486 214 510 L248 510 L260 510 L272 472 L286 532 L306 510 L352 510 Q378 477 414 510 L492 510" fill="none" stroke="#182033" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <text x="198" y="478" font-size="13" font-weight="900">P</text><text x="260" y="464" font-size="13" font-weight="900">QRS</text><text x="404" y="478" font-size="13" font-weight="900">T</text>
          ${ecgBox}
        </g>
      ` : ""}
    `;
  }

  function simplePointVisual(unitId, sectionIndex, pointIndex, point, text) {
    const title = point.title;
    const dot = (x, y, label = title) => focusDot(x, y, label);
    const simpleCaption = (main) => `${main} 圖中紅色焦點只標出這個知識點要看的位置，其他顏色看下方圖例。`;
    if (unitId === "cardiovascular") {
      if (sectionIndex === 0) {
        const foci = ["chambers", "avValves", "semilunarValves", "lvPressure"];
        return {
          className: "cardio-heart-visual",
          viewBox: "0 0 300 355",
          caption: "血流順序：靜脈血回右心房 → 右心室 → 肺動脈；肺靜脈血回左心房 → 左心室 → 主動脈。金色高亮是本題焦點。",
          svg: renderHeartAnatomySvg({ mode: "flow", focus: foci[pointIndex] || foci[0], showFlow: true })
        };
      }
      if (sectionIndex === 1) {
        const foci = ["workingMyocardium", "hisPurkinje", "avDelay", "bypass"];
        return {
          className: "cardio-heart-visual",
          viewBox: "0 0 300 355",
          caption: "傳導順序：SA node 啟動心房，AV node 延遲，His-Purkinje 把訊號帶到心尖再沿心室壁上行。金色高亮是本題焦點。",
          svg: renderHeartAnatomySvg({ mode: "conduction", focus: foci[pointIndex] || foci[0], showConduction: true })
        };
      }
      if (sectionIndex === 5) {
        const spots = [[230, 100, "external work"], [320, 150, "EDV"], [138, 150, "ESV"], [214, 62, "contractility"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: "PV loop 走向：右側填充、向上等容收縮、左側射血、向下等容舒張；loop 寬度就是 SV。",
          svg: `
            <line x1="70" y1="150" x2="374" y2="150" stroke="#182033" stroke-width="2.5"/><line x1="70" y1="150" x2="70" y2="28" stroke="#182033" stroke-width="2.5"/>
            <polygon points="138,150 138,58 320,58 320,150 138,150" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="3"/>
            <polygon points="${pointIndex === 1 ? "118,150 118,58 350,58 350,150 118,150" : pointIndex === 2 ? "166,150 166,42 324,42 324,150 166,150" : pointIndex === 3 ? "112,150 112,56 304,42 304,150 112,150" : "138,150 138,58 320,58 320,150 138,150"}" fill="#bc3f3422" stroke="#bc3f34" stroke-width="4" stroke-linejoin="round"/>
            <path d="M146 150 H312" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <path d="M320 144 V66" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <path d="M312 58 H146" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <path d="M138 66 V142" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <text x="224" y="171" font-size="11" font-weight="900">filling</text><text x="324" y="106" font-size="11" font-weight="900">MC</text>
            <text x="216" y="50" font-size="11" font-weight="900">ejection</text><text x="102" y="108" font-size="11" font-weight="900">AC</text>
            <text x="54" y="30" font-size="11" font-weight="900">P</text><text x="354" y="171" font-size="11" font-weight="900">V</text>
            <text x="114" y="171" font-size="11" font-weight="900">ESV</text><text x="314" y="171" font-size="11" font-weight="900">EDV</text>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 0) {
        const spots = [[136, 82, "chambers"], [172, 104, "AV valve"], [324, 102, "semilunar valve"], [246, 116, "pressure gradient"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("先把心臟當成四個房間加兩組單向門：右心去肺，左心去全身。"),
          svg: `
            <path d="M202 48 C162 28 112 44 96 86 C78 136 116 160 166 150 C184 164 230 164 252 148 C306 160 350 130 334 82 C320 42 260 28 214 56Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
            <path d="M210 56 V150 M104 102 H326" stroke="#182033" stroke-width="2.5" opacity=".7"/>
            <path d="M62 102 H104 M318 102 H374" stroke="#2e5f8d" stroke-width="5" marker-end="url(#arrow)"/>
            <path d="M154 102 L182 124 L210 102 M242 102 L270 124 L298 102" fill="none" stroke="#b8871e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M102 88 L118 102 L102 116 M318 88 L334 102 L318 116" fill="none" stroke="#b8871e" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="122" y="84" font-size="13" font-weight="900">RA</text><text x="262" y="84" font-size="13" font-weight="900">LA</text><text x="122" y="138" font-size="13" font-weight="900">RV</text><text x="262" y="138" font-size="13" font-weight="900">LV</text>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 1) {
        const spots = [[306, 124, "working myocardium"], [184, 150, "His-Purkinje route"], [198, 104, "AV delay"], [282, 108, "bypass"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("傳導只記一條主路線：SA 起點，AV 慢一下，His-Purkinje 快速散到心室。"),
          svg: `
            <path d="M202 44 C150 24 98 62 96 114 C94 158 146 168 202 146 C256 170 326 150 326 96 C326 44 260 24 216 58Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
            <circle cx="254" cy="58" r="10" fill="#b8871e"/><text x="268" y="62" font-size="12" font-weight="900">SA</text>
            <circle cx="198" cy="104" r="10" fill="#2e5f8d"/><text x="212" y="108" font-size="12" font-weight="900">AV</text>
            <path d="M254 70 C244 88 224 98 198 104 C194 124 188 138 178 158" fill="none" stroke="#182033" stroke-width="4" marker-end="url(#arrow)"/>
            <path d="M178 158 C140 132 122 116 108 94 M178 158 C224 134 268 124 306 104" fill="none" stroke="#23694f" stroke-width="3.5"/>
            <path d="M252 72 C276 88 286 108 304 130" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="6 5"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 2) {
        const spots = [[336, 58, "lead"], [166, 58, "QRS"], [126, 112, "projection"], [118, 130, "abnormal"]];
        const s = spots[pointIndex] || spots[1];
        return {
          caption: simpleCaption("ECG 的重點是「電方向投影到導程」：不是背形狀，而是看向量朝哪裡走。"),
          svg: `
            <rect x="42" y="36" width="336" height="118" rx="10" fill="#fffdf7" stroke="#c9bea8"/>
            <path d="M54 106 H78 C86 88 98 88 106 106 H138 L152 128 L168 58 L184 112 H224 C236 96 248 90 262 96 C278 102 284 114 314 114 H366" fill="none" stroke="#bc3f34" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="92" y="80" font-size="12" font-weight="900">P</text><text x="152" y="46" font-size="12" font-weight="900">QRS</text><text x="252" y="82" font-size="12" font-weight="900">T</text>
            <path d="M304 82 L356 52" stroke="#2e5f8d" stroke-width="3.5" marker-end="url(#arrow)"/>
            <path d="M84 132 C112 116 136 104 158 82" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="5 5"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 3) {
        const spots = [[86, 132, "MC"], [104, 146, "same volume"], [238, 146, "SV"], [326, 146, "diastole"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("心動週期用四個門事件切段：MC、AO、AC、MO；等容積期就是血進不來也出不去。"),
          svg: `
            <rect x="44" y="34" width="332" height="122" rx="10" fill="#fffdf7" stroke="#c9bea8"/>
            <path d="M58 132 C96 132 96 64 144 64 C194 64 196 134 244 134 C292 134 312 78 364 78" fill="none" stroke="#2e5f8d" stroke-width="4"/>
            <path d="M58 146 H118 H150 C210 146 210 146 250 146 C310 146 318 146 364 146" fill="none" stroke="#b8871e" stroke-width="4"/>
            ${["MC","AO","AC","MO"].map((label, i) => `<circle cx="${86 + i * 80}" cy="${i % 2 ? 64 : 132}" r="7" fill="#bc3f34"/><text x="${72 + i * 80}" y="${i % 2 ? 52 : 121}" font-size="11" font-weight="900">${label}</text>`).join("")}
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 4) {
        const spots = [[90, 118, "S1/S2"], [152, 90, "S3/S4"], [274, 82, "CO"], [304, 138, "drug effect"]];
        const s = spots[pointIndex] || spots[2];
        return {
          caption: simpleCaption("心音、CO 和藥理情境都回到同一件事：心臟每分鐘打出多少血，以及三個負荷怎麼變。"),
          svg: `
            <path d="M62 120 H100 L110 96 L122 120 H154 L166 78 L178 120 H216" fill="none" stroke="#bc3f34" stroke-width="4" stroke-linejoin="round"/>
            <rect x="236" y="50" width="118" height="66" rx="12" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <text x="252" y="78" font-size="14" font-weight="900">CO = HR x SV</text>
            <path d="M244 138 H344" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
            <text x="66" y="154" font-size="11" font-weight="900">sounds</text><text x="246" y="164" font-size="11" font-weight="900">load / contractility</text>
            ${dot(...s)}
          `
        };
      }
      const spots = [[210, 92, "work"], [330, 150, "EDV"], [156, 54, "ESV"], [132, 58, "contractility"]];
      const s = spots[pointIndex] || spots[0];
      return {
        caption: simpleCaption("PV loop 只先看三件事：左右是體積、上下是壓力、loop 寬度就是 SV。"),
        svg: `
          <line x1="70" y1="150" x2="374" y2="150" stroke="#182033" stroke-width="2.5"/><line x1="70" y1="150" x2="70" y2="28" stroke="#182033" stroke-width="2.5"/>
          <polygon points="138,150 138,58 320,58 320,150 138,150" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="3"/>
          <polygon points="${pointIndex === 1 ? "118,150 118,58 350,58 350,150 118,150" : pointIndex === 2 ? "166,150 166,42 324,42 324,150 166,150" : pointIndex === 3 ? "112,150 112,56 304,42 304,150 112,150" : "138,150 138,58 320,58 320,150 138,150"}" fill="#bc3f3422" stroke="#bc3f34" stroke-width="4"/>
          <text x="54" y="30" font-size="11" font-weight="900">P</text><text x="354" y="171" font-size="11" font-weight="900">V</text>
          ${dot(...s)}
        `
      };
    }

    if (unitId === "urinary") {
      if (sectionIndex === 0) {
        const spots = [[140, 92, "three processes"], [156, 78, "NaCl reabsorption"], [200, 51, "high renal blood flow / O2"], [378, 120, "excreted = clearance"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("用一個腎元看三個動作：血液被濾過進小管(filtration)、有用的回收(reabsorption)、不要的分泌(secretion)，剩下變尿；腎血流大、耗氧高。"),
          svg: `
            <rect x="38" y="40" width="338" height="22" rx="9" fill="#bc3f3414" stroke="#bc3f34" stroke-width="2"/><text x="46" y="55" font-size="9.5" font-weight="900" fill="#bc3f34">血液 peritubular（腎血流大、耗氧高）</text>
            <circle cx="62" cy="120" r="24" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/><text x="40" y="160" font-size="10" font-weight="900">腎絲球</text>
            <rect x="88" y="108" width="270" height="24" rx="11" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="3"/><text x="300" y="124" font-size="10" font-weight="900" fill="#2e5f8d">小管</text>
            <path d="M118 64 V104" stroke="#2e5f8d" stroke-width="4" marker-end="url(#arrow)"/><text x="100" y="100" font-size="9.5" font-weight="900" fill="#2e5f8d">filtration</text>
            <path d="M190 106 V66" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/><text x="166" y="100" font-size="9.5" font-weight="900" fill="#23694f">reabsorb</text>
            <path d="M262 64 V104" stroke="#b8871e" stroke-width="4" marker-end="url(#arrow)"/><text x="246" y="100" font-size="9.5" font-weight="900" fill="#b8871e">secrete</text>
            <path d="M358 120 H392" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><text x="356" y="150" font-size="10" font-weight="900">urine</text>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 5) {
        const spots = [[200, 100, "GFR ~ inulin"], [68, 74, "cleared plasma volume"], [150, 38, "Cx vs GFR"], [68, 122, "RPF/RBF plasma vs whole blood"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("清除率＝單位時間被某物質清空的血漿體積：Cx = Ux × V / Px。和 GFR 比可推淨回收或淨分泌；RPF 是血漿、RBF 是全血。"),
          svg: `
            <text x="36" y="28" font-size="11" font-weight="900">Cx = Ux × V / Px（被清空的血漿體積）</text>
            <rect x="36" y="56" width="64" height="92" rx="10" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><text x="44" y="166" font-size="10" font-weight="900">血漿 Px</text>
            <rect x="36" y="56" width="64" height="34" rx="10" fill="#bc3f3433" stroke="#bc3f34" stroke-width="2.5"/><text x="40" y="50" font-size="9" font-weight="900" fill="#bc3f34">cleared</text>
            <path d="M104 102 H148" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <path d="M212 56 C168 56 150 84 150 102 C150 138 198 150 224 138 C206 128 206 112 222 104 C238 96 242 120 232 130 C262 122 266 90 250 72 C240 60 226 56 212 56Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/><text x="166" y="172" font-size="10" font-weight="900">kidney (GFR)</text>
            <path d="M256 104 H318" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <rect x="320" y="84" width="74" height="44" rx="10" fill="#b8871e22" stroke="#b8871e" stroke-width="3"/><text x="330" y="110" font-size="10" font-weight="900" fill="#b8871e">urine Ux·V</text>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 1) {
        if (pointIndex === 0) {
          return {
            caption: simpleCaption("泌尿道要看方向：kidney 形成尿，ureter 往下送到 bladder，最後經 urethra 排出。"),
            svg: `
              <path d="M94 48 C56 62 54 126 94 144 C132 126 132 62 94 48Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
              <path d="M130 100 C178 116 190 140 206 152" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
              <ellipse cx="248" cy="150" rx="42" ry="24" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/>
              <path d="M248 174 V188" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <text x="68" y="40" font-size="12" font-weight="900">kidney</text><text x="176" y="132" font-size="12" font-weight="900">ureter</text><text x="226" y="146" font-size="12" font-weight="900">bladder</text>
              ${dot(206, 152, "urine path")}
            `
          };
        }
        if (pointIndex === 3) {
          return {
            caption: simpleCaption("出球小動脈離開腎絲球後，會接成 peritubular capillaries 或 vasa recta 來回收物質。"),
            svg: `
              <circle cx="86" cy="76" r="28" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
              <path d="M114 76 C158 54 190 62 216 88" fill="none" stroke="#2e5f8d" stroke-width="5" marker-end="url(#arrow)"/>
              <path d="M216 88 C260 42 340 52 354 104 C366 154 278 160 232 126" fill="none" stroke="#23694f" stroke-width="4"/>
              <path d="M262 72 V154 M292 72 V154" stroke="#23694f" stroke-width="4"/>
              <text x="52" y="126" font-size="12" font-weight="900">glomerulus</text><text x="246" y="54" font-size="12" font-weight="900">vasa recta</text>
              ${dot(286, 88, "post-efferent vessels")}
            `
          };
        }
        const spots = [[104, 138, "pelvis"], [92, 58, "cortex"], [244, 128, "long loop"], [286, 88, "vasa recta"]];
        const s = spots[pointIndex] || spots[1];
        return {
          caption: simpleCaption("腎臟切面先分皮質、髓質、腎盂；尿液濃縮靠長 loop 與 vasa recta。"),
          svg: `
            <path d="M100 28 C48 50 48 126 104 160 C162 126 162 62 100 28Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <path d="M112 58 C82 80 84 118 114 140 C142 116 142 82 112 58Z" fill="#b8871e44" stroke="#b8871e" stroke-width="2.5"/>
            <path d="M148 92 C212 48 318 54 330 100 C340 148 248 162 210 126" fill="none" stroke="#bc3f34" stroke-width="5"/>
            <path d="M242 72 V150 M272 72 V150" stroke="#23694f" stroke-width="4"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 2) {
        const spots = [[62, 88, "afferent"], [222, 150, "filtration barrier"], [202, 94, "mesangial area"], [222, 150, "protein leak through barrier"]];
        const s = spots[pointIndex] || spots[2];
        return {
          caption: simpleCaption("濾過膜要想成三層篩子：內皮、基底膜、podocyte slit；蛋白尿代表篩子破了。"),
          svg: `
            <path d="M40 94 C88 48 126 52 158 90" fill="none" stroke="#2e5f8d" stroke-width="7" marker-end="url(#arrow)"/>
            <circle cx="212" cy="94" r="48" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
            ${[0,1,2,3,4,5].map((i) => `<circle cx="${184 + (i % 3) * 26}" cy="${74 + Math.floor(i / 3) * 30}" r="12" fill="#fffdf7" stroke="#bc3f34" stroke-width="2.5"/>`).join("")}
            <path d="M266 94 C312 48 352 52 382 94" fill="none" stroke="#2e5f8d" stroke-width="5" marker-end="url(#arrow)"/>
            <path d="M168 144 H258" stroke="#23694f" stroke-width="4"/><path d="M176 154 H250" stroke="#b8871e" stroke-width="4"/><path d="M184 164 H242" stroke="#6552a3" stroke-width="4"/>
            ${pointIndex === 3 ? `<circle cx="238" cy="136" r="5" fill="#bc3f34"/><path d="M238 136 V166" stroke="#bc3f34" stroke-width="2.5" marker-end="url(#arrow-red)"/>` : ""}
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 3) {
        const spots = [[74, 130, "macula densa"], [92, 74, "renin"], [244, 82, "Ang II"], [326, 134, "aldosterone"]];
        const s = spots[pointIndex] || spots[1];
        return {
          caption: simpleCaption("RAAS 是低壓救援鏈：腎臟放 renin，Ang II 收縮血管，aldosterone 留鈉水。"),
          svg: `
            <rect x="38" y="52" width="80" height="46" rx="10" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <circle cx="76" cy="130" r="18" fill="#23694f33" stroke="#23694f" stroke-width="3"/>
            <path d="M122 76 H174" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="180" y="54" width="62" height="44" rx="8" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/>
            <path d="M246 76 H294" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="300" y="54" width="76" height="44" rx="8" fill="#bc3f3433" stroke="#bc3f34" stroke-width="3"/>
            <path d="M338 100 V134" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            ${dot(...s)}
          `
        };
      }
      const spots = [[222, 66, "Vit D activation"], [322, 94, "calcium absorption"], [222, 126, "EPO"], [322, 94, "adrenal cortex"]];
      const s = spots[pointIndex] || spots[0];
      return {
        caption: simpleCaption("腎臟也做內分泌：活化 Vitamin D、分泌 EPO，並和 aldosterone 調鈉水。"),
        svg: `
          <path d="M92 48 C54 62 52 126 92 144 C132 126 132 62 92 48Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
          <path d="M132 80 H192" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="202" y="48" width="82" height="40" rx="8" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/>
          <path d="M132 110 H192" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="202" y="108" width="82" height="40" rx="8" fill="#bc3f3433" stroke="#bc3f34" stroke-width="3"/>
          <circle cx="334" cy="94" r="28" fill="#23694f33" stroke="#23694f" stroke-width="3"/>
          ${dot(...s)}
        `
      };
    }

    if (unitId === "cns") {
      if (sectionIndex === 0) {
        const spots = [[68, 116, "excitable cells"], [220, 92, "input→integrate→output"], [214, 116, "O2/glucose dependence"], [150, 162, "negative feedback / homeostasis"]];
        const s = spots[pointIndex] || spots[1];
        return {
          caption: simpleCaption("神經系統＝input→中樞整合→output 的控制迴路，靠負回饋維持 homeostasis；神經與肌肉都是可興奮細胞，中樞極度依賴 O2 與葡萄糖。"),
          svg: `
            <text x="18" y="100" font-size="10.5" font-weight="900">刺激</text>
            <rect x="40" y="74" width="86" height="50" rx="10" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><text x="56" y="95" font-size="11" font-weight="900">受器/Input</text><text x="58" y="113" font-size="9" font-weight="900" fill="#2e5f8d">⚡ excitable</text>
            <path d="M130 99 H172" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <circle cx="220" cy="99" r="44" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/><text x="196" y="94" font-size="11" font-weight="900">CNS 整合</text><text x="190" y="112" font-size="9" font-weight="900" fill="#bc3f34">需 O2/葡萄糖</text>
            <path d="M266 99 H310" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
            <rect x="316" y="74" width="68" height="50" rx="10" fill="url(#tissue-green)" stroke="#23694f" stroke-width="3"/><text x="326" y="95" font-size="11" font-weight="900">效應器</text><text x="326" y="113" font-size="9" font-weight="900" fill="#23694f">⚡ 肌肉/腺體</text>
            <path d="M220 143 C188 172 116 166 84 126" fill="none" stroke="#b8871e" stroke-width="3.5" stroke-dasharray="6 5" marker-end="url(#arrow)"/><text x="112" y="182" font-size="10" font-weight="900" fill="#b8871e">負回饋 → homeostasis</text>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 2) {
        const spots = [[136, 70, "brain parts"], [282, 76, "cranial nerves"], [136, 142, "spinal nerves"], [322, 132, "ganglion"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("定位題要把腦、腦神經、脊神經、神經節分開看：腦與脊髓在 CNS，神經與 ganglion 在 PNS。"),
          svg: `
            <path d="M116 48 C144 26 184 44 174 76 C164 108 112 102 104 76 C98 62 104 52 116 48Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <rect x="120" y="94" width="32" height="72" rx="15" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <path d="M176 74 C214 58 246 62 282 76 M152 128 C198 156 252 156 318 132" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
            <circle cx="292" cy="76" r="15" fill="#b8871e55" stroke="#b8871e" stroke-width="3"/><circle cx="326" cy="132" r="15" fill="#23694f55" stroke="#23694f" stroke-width="3"/>
            <text x="92" y="38" font-size="12" font-weight="900">brain</text><text x="88" y="168" font-size="12" font-weight="900">spinal cord</text><text x="268" y="54" font-size="12" font-weight="900">CN</text><text x="310" y="162" font-size="12" font-weight="900">ganglion</text>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 1) {
        const spots = [[118, 100, "CNS"], [302, 80, "PNS"], [350, 136, "subdivision"], [230, 140, "direction"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("CNS 只記腦與脊髓；離開中樞的神經、神經節與末梢多歸 PNS。"),
          svg: `
            <path d="M106 50 C132 30 166 48 156 78 C146 106 104 100 96 78 C90 64 94 56 106 50Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><rect x="112" y="96" width="28" height="70" rx="14" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <path d="M154 72 C208 56 250 60 304 80 M144 130 C210 160 264 158 336 136" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
            <circle cx="318" cy="80" r="16" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/><circle cx="350" cy="136" r="16" fill="#23694f44" stroke="#23694f" stroke-width="3"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 3) {
        const spots = [[154, 96, "axon hillock"], [112, 96, "soma morphology"], [246, 96, "axon output"], [338, 84, "terminal unit"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("神經元用方向理解：dendrite 收訊，soma 整合，axon hillock 起跑，axon terminal 輸出。"),
          svg: `
            <circle cx="112" cy="96" r="32" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/><path d="M86 78 C54 44 40 84 58 108 M88 116 C58 152 38 136 34 164" fill="none" stroke="#bc3f34" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M146 96 H318" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round" marker-end="url(#arrow)"/>
            ${[178,218,258].map((x) => `<rect x="${x}" y="84" width="26" height="24" rx="10" fill="#b8871eaa"/>`).join("")}
            <path d="M318 96 C350 70 366 76 388 58 M318 96 C352 124 370 118 388 142" fill="none" stroke="#23694f" stroke-width="3.5"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 4) {
        const spots = [[282, 62, "astrocyte BBB support"], [150, 82, "myelin"], [68, 96, "microglia"], [282, 62, "BBB"]];
        const s = spots[pointIndex] || spots[1];
        return {
          caption: simpleCaption("膠細胞不是配角：髓鞘加速、astrocyte 幫 BBB、microglia 清除與免疫。"),
          svg: `
            <path d="M58 106 C110 62 164 66 198 98 C238 132 286 128 350 86" fill="none" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round"/>
            ${[96,142,216,266].map((x) => `<rect x="${x}" y="84" width="28" height="24" rx="11" fill="#b8871eaa"/>`).join("")}
            <circle cx="64" cy="96" r="22" fill="#bc3f3433" stroke="#bc3f34" stroke-width="3"/>
            <path d="M268 62 C306 38 344 40 374 62" fill="none" stroke="#23694f" stroke-width="4"/>
            <path d="M204 126 C232 150 262 150 292 126" fill="none" stroke="#6552a3" stroke-width="3"/>
            ${dot(...s)}
          `
        };
      }
      if (pointIndex === 0) {
        return {
          caption: simpleCaption("髓鞘像一段段絕緣套，讓動作電位在節點間跳躍，傳得更快。"),
          svg: `
            <path d="M62 98 H348" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round" marker-end="url(#arrow)"/>
            ${[120,166,212,258].map((x) => `<rect x="${x}" y="84" width="32" height="28" rx="12" fill="#b8871eaa" stroke="#b8871e" stroke-width="2"/>`).join("")}
            <circle cx="106" cy="98" r="5" fill="#bc3f34"/><circle cx="154" cy="98" r="5" fill="#bc3f34"/><circle cx="200" cy="98" r="5" fill="#bc3f34"/>
            <path d="M106 128 C142 152 190 152 226 128 C256 108 286 108 330 130" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#arrow)"/>
            <text x="120" y="76" font-size="12" font-weight="900">myelin</text><text x="74" y="142" font-size="12" font-weight="900">saltatory conduction</text>
            ${dot(166, 98, "myelin speeds conduction")}
          `
        };
      }
      const spots = [[244, 62, "myelin"], [96, 84, "sensory PNS"], [326, 122, "motor PNS"], [210, 96, "interneuron CNS"]];
      const s = spots[pointIndex] || spots[1];
      return {
        caption: simpleCaption("反射路徑用三段看：感覺進來，中間神經元整合，運動神經元出去。"),
        svg: `
          <rect x="166" y="50" width="100" height="94" rx="16" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
          <path d="M52 84 C94 58 134 62 166 92" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
          <circle cx="210" cy="96" r="16" fill="#b8871e66" stroke="#b8871e" stroke-width="3"/>
          <path d="M226 96 C268 96 296 112 346 122" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
          <path d="M92 120 C130 154 300 154 346 128" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="6 5"/>
          ${dot(...s)}
        `
      };
    }

    if (unitId === "special-senses") {
      if (sectionIndex === 0) {
        if (pointIndex === 0) {
          return {
            caption: simpleCaption("視野檢查要遮一眼，因為雙眼重疊區會互補缺損。"),
            svg: `
              <ellipse cx="154" cy="96" rx="84" ry="48" fill="#2e5f8d24" stroke="#2e5f8d" stroke-width="3"/>
              <ellipse cx="266" cy="96" rx="84" ry="48" fill="#bc3f3424" stroke="#bc3f34" stroke-width="3"/>
              <path d="M210 54 V138" stroke="#182033" stroke-width="2" stroke-dasharray="5 5"/>
              <circle cx="138" cy="96" r="12" fill="#fffdf7" stroke="#182033" stroke-width="3"/><circle cx="282" cy="96" r="12" fill="#fffdf7" stroke="#182033" stroke-width="3"/>
              <text x="116" y="150" font-size="12" font-weight="900">left eye</text><text x="250" y="150" font-size="12" font-weight="900">right eye</text>
              ${dot(210, 96, "binocular overlap")}
            `
          };
        }
        if (pointIndex === 2) {
          return {
            caption: simpleCaption("顏色視野不是一樣大：白光最大，接著藍、紅，綠色最小。"),
            svg: `
              <ellipse cx="210" cy="96" rx="150" ry="64" fill="none" stroke="#182033" stroke-width="3"/>
              <ellipse cx="210" cy="96" rx="122" ry="52" fill="none" stroke="#2e5f8d" stroke-width="4"/>
              <ellipse cx="210" cy="96" rx="94" ry="40" fill="none" stroke="#bc3f34" stroke-width="4"/>
              <ellipse cx="210" cy="96" rx="66" ry="28" fill="none" stroke="#23694f" stroke-width="4"/>
              <circle cx="70" cy="30" r="5" fill="#182033"/><text x="82" y="34" font-size="12" font-weight="900">white</text>
              <circle cx="142" cy="30" r="5" fill="#2e5f8d"/><text x="154" y="34" font-size="12" font-weight="900">blue</text>
              <circle cx="206" cy="30" r="5" fill="#bc3f34"/><text x="218" y="34" font-size="12" font-weight="900">red</text>
              <circle cx="262" cy="30" r="5" fill="#23694f"/><text x="274" y="34" font-size="12" font-weight="900">green</text>
              ${dot(276, 96, "green is smallest field")}
            `
          };
        }
        const spots = [[210, 96, "monocular"], [292, 96, "optic disc"], [154, 104, "color field"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("眼球先當成光學系統：光被 cornea/lens 聚到 retina；optic disc 沒受器所以是盲點。"),
          svg: `
            <ellipse cx="206" cy="96" rx="118" ry="62" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <circle cx="134" cy="96" r="28" fill="#fffdf7" stroke="#182033" stroke-width="3"/><circle cx="134" cy="96" r="10" fill="#182033"/>
            <path d="M42 68 C86 82 106 92 134 96 M42 124 C86 110 106 100 134 96" fill="none" stroke="#b8871e" stroke-width="3" marker-end="url(#arrow)"/>
            <path d="M306 96 C338 90 360 78 386 62" fill="none" stroke="#bc3f34" stroke-width="5" marker-end="url(#arrow-red)"/>
            <circle cx="292" cy="96" r="8" fill="#182033"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 1) {
        const spots = [[182, 96, "lens accommodation"], [58, 96, "near point"], [86, 166, "light wavelength"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("眼睛靠水晶體調節：看近水晶體變厚、看遠變扁，把光聚到 retina；near point 是還能對焦的最近距離。視覺刺激本質是特定波長的光。"),
          svg: `
            <ellipse cx="244" cy="96" rx="116" ry="60" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <path d="M150 52 C132 72 132 120 150 140" fill="none" stroke="#182033" stroke-width="3"/>
            <ellipse cx="178" cy="96" rx="15" ry="36" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/>
            <path d="M40 60 C92 74 134 86 178 96 M40 132 C92 118 134 106 178 96" fill="none" stroke="#b8871e" stroke-width="2.5" marker-end="url(#arrow)"/>
            <path d="M178 96 C232 96 288 96 332 96" fill="none" stroke="#bc3f34" stroke-width="3" marker-end="url(#arrow-red)"/>
            <circle cx="334" cy="96" r="6" fill="#bc3f34"/>
            <text x="148" y="40" font-size="10" font-weight="900" fill="#b8871e">水晶體（近厚遠扁）</text>
            <text x="296" y="150" font-size="10" font-weight="900" fill="#bc3f34">retina 焦點</text>
            <path d="M44 168 q9 -12 18 0 t18 0 t18 0" fill="none" stroke="#182033" stroke-width="2.5"/><text x="118" y="172" font-size="10" font-weight="900">光＝特定波長 λ</text>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 2) {
        if (pointIndex === 3) {
          return {
            caption: simpleCaption("黑暗時 cGMP 讓 Na+ 通道開；光照後 rhodopsin 啟動 PDE，cGMP 下降，通道關閉。"),
            svg: `
              <rect x="34" y="50" width="70" height="86" rx="12" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="3"/><text x="50" y="96" font-size="12" font-weight="900">Light</text>
              <path d="M108 94 H128" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="134" y="50" width="72" height="86" rx="12" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/><text x="148" y="90" font-size="12" font-weight="900">Rhod</text><text x="149" y="106" font-size="12" font-weight="900">opsin</text>
              <path d="M210 94 H232" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="238" y="50" width="86" height="86" rx="12" fill="#fff7e5" stroke="#b8871e" stroke-width="3"/><text x="254" y="90" font-size="12" font-weight="900">trans</text><text x="254" y="106" font-size="12" font-weight="900">ducin</text>
              <path d="M328 94 H344" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="350" y="50" width="58" height="86" rx="12" fill="#bc3f3428" stroke="#bc3f34" stroke-width="3"/><text x="367" y="82" font-size="12" font-weight="900">PDE</text><text x="356" y="106" font-size="12" font-weight="900">cGMP↓</text>
              <path d="M178 146 C234 172 318 172 380 144" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
              <text x="196" y="182" font-size="12" font-weight="900">Na+ channel closes</text>
              ${dot(379, 130, "PDE lowers cGMP")}
            `
          };
        }
        const spots = [[96, 126, "rods"], [246, 126, "cones"], [202, 44, "light"], [306, 96, "hyperpolarize"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("光轉導最容易考反直覺：光照讓 photoreceptor 超極化，不是去極化。"),
          svg: `
            <rect x="54" y="36" width="312" height="120" rx="12" fill="#fffdf7" stroke="#c9bea8" stroke-width="2.5"/>
            ${[88,118,148].map((x) => `<path d="M${x} 134 V72" stroke="#2e5f8d" stroke-width="7" stroke-linecap="round"/><circle cx="${x}" cy="62" r="8" fill="#2e5f8d55"/>`).join("")}
            ${[226,258,290].map((x) => `<path d="M${x} 134 V74" stroke="#bc3f34" stroke-width="8" stroke-linecap="round"/><circle cx="${x}" cy="62" r="11" fill="#bc3f3455"/>`).join("")}
            <path d="M202 26 L178 64 M202 26 L218 66" stroke="#b8871e" stroke-width="3.5" marker-end="url(#arrow)"/>
            <path d="M312 134 C332 112 342 94 348 70" fill="none" stroke="#23694f" stroke-width="3.5" marker-end="url(#arrow)"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 3) {
        if (pointIndex === 3) {
          return {
            caption: simpleCaption("Primary visual cortex 先接住輸入；secondary/association cortex 把視覺和記憶、其他感覺整合。"),
            svg: `
              <circle cx="64" cy="96" r="24" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
              <path d="M88 96 C126 88 152 88 190 96" fill="none" stroke="#182033" stroke-width="4" marker-end="url(#arrow)"/>
              <rect x="196" y="60" width="74" height="70" rx="12" fill="#b8871e55" stroke="#b8871e" stroke-width="3"/><text x="212" y="91" font-size="12" font-weight="900">Primary</text><text x="218" y="108" font-size="12" font-weight="900">V1</text>
              <path d="M274 96 H316" stroke="#182033" stroke-width="4" marker-end="url(#arrow)"/>
              <rect x="322" y="44" width="72" height="104" rx="12" fill="#23694f33" stroke="#23694f" stroke-width="3"/><text x="336" y="82" font-size="12" font-weight="900">Assoc.</text><text x="336" y="104" font-size="12" font-weight="900">memory</text>
              <path d="M356 46 C342 24 304 24 290 52" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#arrow)"/>
              ${dot(388, 132, "secondary visual integration")}
            `
          };
        }
        if (pointIndex === 1) {
          return {
            caption: simpleCaption("側向抑制讓亮暗交界更明顯：被強刺激的細胞會抑制旁邊細胞。"),
            svg: `
              ${[84,130,176,222,268,314].map((x, i) => `<rect x="${x-16}" y="${i < 3 ? 58 : 74}" width="32" height="${i < 3 ? 86 : 70}" rx="10" fill="${i < 3 ? "#fffdf7" : "#2e5f8d33"}" stroke="${i < 3 ? "#b8871e" : "#2e5f8d"}" stroke-width="3"/>`).join("")}
              <path d="M176 100 H222" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
              <path d="M222 116 H176" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
              <text x="82" y="44" font-size="12" font-weight="900">bright</text><text x="260" y="44" font-size="12" font-weight="900">dark</text>
              ${dot(198, 100, "lateral inhibition at edge")}
            `
          };
        }
        if (pointIndex === 2) {
          return {
            caption: simpleCaption("立體視覺靠左右眼看到的影像差異，再由中樞整合成深度。"),
            svg: `
              <circle cx="94" cy="78" r="24" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><circle cx="94" cy="126" r="24" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
              <path d="M120 78 C178 76 220 92 280 106 M120 126 C178 124 220 110 280 106" fill="none" stroke="#182033" stroke-width="4"/>
              <rect x="284" y="78" width="58" height="58" rx="10" fill="#b8871e55" stroke="#b8871e" stroke-width="3"/>
              <path d="M342 106 H382" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
              <text x="278" y="154" font-size="12" font-weight="900">depth</text>
              ${dot(280, 106, "binocular disparity")}
            `
          };
        }
        const spots = [[206, 102, "visual pathway"], [86, 80, "retinal contrast"], [132, 126, "binocular integration"]];
        const s = spots[pointIndex] || spots[1];
        return {
          caption: simpleCaption("視覺路徑抓主線：retina → optic nerve/chiasm → tract → 枕葉皮質。"),
          svg: `
            <circle cx="86" cy="80" r="28" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><circle cx="86" cy="126" r="28" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
            <path d="M114 80 C160 80 176 102 210 102 M114 126 C160 126 176 102 210 102" fill="none" stroke="#182033" stroke-width="4"/>
            <path d="M210 102 C260 78 300 72 350 52 M210 102 C260 126 302 132 350 152" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
            <rect x="342" y="34" width="36" height="36" rx="8" fill="#b8871e55" stroke="#b8871e" stroke-width="2.5"/><rect x="342" y="134" width="36" height="32" rx="8" fill="#23694f55" stroke="#23694f" stroke-width="2.5"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex <= 5) {
        if (sectionIndex === 4 && pointIndex === 3) {
          return {
            caption: simpleCaption("突發聲可啟動保護、轉頭與喚醒反射：先定位聲源，再提高警覺。"),
            svg: `
              <path d="M54 96 C88 50 132 62 120 112" fill="none" stroke="#bc3f34" stroke-width="6"/>
              <path d="M138 96 H190" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <circle cx="226" cy="96" r="22" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/><text x="204" y="134" font-size="12" font-weight="900">protect</text>
              <path d="M254 96 H302" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <circle cx="334" cy="96" r="28" fill="#23694f33" stroke="#23694f" stroke-width="3"/><path d="M322 96 C332 78 352 80 360 96" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/><text x="310" y="138" font-size="12" font-weight="900">turn head</text>
              ${dot(334, 96, "head rotation reflex")}
            `
          };
        }
        if (sectionIndex === 5 && pointIndex === 3) {
          return {
            caption: simpleCaption("聽覺不是只到耳蝸：訊號經第 VIII 對腦神經上傳，逐級過濾後到 auditory cortex。"),
            svg: `
              <path d="M38 96 C68 50 108 60 104 104" fill="none" stroke="#bc3f34" stroke-width="5"/>
              <path d="M116 96 H152" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="160" y="66" width="54" height="58" rx="12" fill="#2e5f8d33" stroke="#2e5f8d" stroke-width="3"/><text x="174" y="100" font-size="12" font-weight="900">VIII</text>
              <path d="M218 96 H258" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="266" y="66" width="58" height="58" rx="12" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/><text x="278" y="100" font-size="12" font-weight="900">Relay</text>
              <path d="M328 96 H360" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
              <rect x="366" y="66" width="46" height="58" rx="12" fill="#23694f33" stroke="#23694f" stroke-width="3"/><text x="374" y="100" font-size="12" font-weight="900">Ctx</text>
              ${dot(294, 96, "multi-level auditory filtering")}
            `
          };
        }
        if (sectionIndex === 5 && pointIndex === 1) {
          return {
            caption: simpleCaption("Hair cells 的 stereocilia 彎向 kinocilium 會興奮，反方向會抑制。"),
            svg: `
              <rect x="70" y="126" width="280" height="18" rx="8" fill="#2e5f8d33" stroke="#2e5f8d" stroke-width="3"/>
              ${[126,178,230,282].map((x) => `<rect x="${x-14}" y="84" width="28" height="42" rx="9" fill="#bc3f3433" stroke="#bc3f34" stroke-width="3"/><path d="M${x-8} 84 L${x-18} 50 M${x} 84 L${x-2} 48 M${x+8} 84 L${x+14} 54" stroke="#182033" stroke-width="3" stroke-linecap="round"/>`).join("")}
              <path d="M258 48 C282 58 300 66 320 78" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
              <text x="154" y="164" font-size="12" font-weight="900">basilar membrane</text>
              ${dot(282, 62, "stereocilia bend")}
            `
          };
        }
        const spots = sectionIndex === 4
          ? [[70, 96, "outer ear"], [226, 96, "ossicles"], [226, 96, "reflex"]]
          : [[332, 112, "cochlea"], [338, 112, "hair cells"], [226, 96, "conductive loss"]];
        const s = spots[pointIndex] || spots[2];
        return {
          caption: simpleCaption("聽覺先看三段：外耳收集，中耳放大，內耳耳蝸把震動轉成神經訊號。"),
          svg: `
            <path d="M44 96 C78 46 126 58 118 102 C112 136 84 148 62 132" fill="none" stroke="#bc3f34" stroke-width="6"/>
            <path d="M128 96 H176" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><circle cx="206" cy="96" r="20" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/><circle cx="248" cy="96" r="16" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/>
            <path d="M282 96 C326 46 388 72 366 124 C344 172 290 150 304 112 C318 84 350 94 338 122" fill="none" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round"/>
            <circle cx="338" cy="112" r="9" fill="#bc3f34" class="pulse-dot"/>
            <path d="M312 132 L350 94" stroke="#23694f" stroke-width="3.5" marker-end="url(#arrow)"/>
            ${dot(...s)}
          `
        };
      }
      if (sectionIndex === 6) {
        const spots = [[204, 130, "vestibular sensors"], [150, 76, "semicircular canals"], [214, 132, "otolith organs"]];
        const s = spots[pointIndex] || spots[0];
        return {
          caption: simpleCaption("平衡覺分兩種：半規管看旋轉，utricle/saccule 看線性加速度與頭位。"),
          svg: `
            <path d="M126 60 C194 20 270 52 236 108 C196 174 96 138 126 60Z" fill="none" stroke="#2e5f8d" stroke-width="6"/>
            <path d="M180 78 C230 38 306 76 270 132 C232 188 148 148 180 78Z" fill="none" stroke="#b8871e" stroke-width="5"/>
            <ellipse cx="204" cy="130" rx="54" ry="22" fill="#23694f33" stroke="#23694f" stroke-width="3"/>
            <circle cx="326" cy="96" r="28" fill="#fffdf7" stroke="#182033" stroke-width="3"/><circle cx="326" cy="96" r="8" fill="#182033"/>
            <path d="M296 96 H266" stroke="#bc3f34" stroke-width="3.5" marker-end="url(#arrow-red)"/>
            ${dot(...s)}
          `
        };
      }
      if (pointIndex === 3) {
        return {
          caption: simpleCaption("風味是味覺加嗅覺；嗅覺和 limbic system 連得強，所以特別容易勾起記憶和情緒。"),
          svg: `
            <path d="M70 74 C116 44 168 44 212 74 C174 114 110 114 70 74Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
            <circle cx="124" cy="78" r="7" fill="#b8871e"/><circle cx="150" cy="78" r="7" fill="#23694f"/>
            <path d="M214 76 C256 76 278 96 302 124" fill="none" stroke="#182033" stroke-width="4" marker-end="url(#arrow)"/>
            <path d="M70 142 C112 122 166 126 210 150" fill="none" stroke="#2e5f8d" stroke-width="4" marker-end="url(#arrow)"/>
            <rect x="302" y="108" width="70" height="44" rx="12" fill="#6552a333" stroke="#6552a3" stroke-width="3"/><text x="318" y="136" font-size="12" font-weight="900">limbic</text>
            ${dot(292, 112, "smell and limbic flavor")}
          `
        };
      }
      const spots = [[134, 76, "taste modalities"], [104, 78, "bitter threshold"], [276, 110, "VII/IX/X"]];
      const s = spots[pointIndex] || spots[1];
      return {
        caption: simpleCaption("味覺是化學刺激進味蕾，再由 VII、IX、X 腦神經傳入。"),
        svg: `
          <path d="M72 72 C116 44 164 44 208 72 C172 114 112 114 72 72Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
          <circle cx="108" cy="78" r="7" fill="#b8871e"/><circle cx="134" cy="76" r="7" fill="#23694f"/><circle cx="160" cy="78" r="7" fill="#2e5f8d"/>
          <path d="M210 76 C250 76 274 94 292 116 C314 144 344 150 376 132" fill="none" stroke="#182033" stroke-width="4" marker-end="url(#arrow)"/>
          ${dot(...s)}
        `
      };
    }
    return null;
  }

  function renderVisualLegend(legend = []) {
    if (!legend.length) return "";
    return `
      <div class="visual-legend" aria-label="圖例 legend">
        ${legend.map((item) => `
          <span class="legend-item">
            <i style="--swatch:${escapeHtml(item.color)}"></i>
            <b>${escapeHtml(item.zh)}</b>
            <em>${escapeHtml(item.en)}</em>
          </span>
        `).join("")}
      </div>
    `;
  }

  function pointLegend(unitId, sectionIndex) {
    const focus = { color: "#bc3f34", zh: "紅點/淡紅", en: "focus or active structure" };
    const flow = { color: "#2e5f8d", zh: "藍色", en: "main pathway or fluid flow" };
    const regulation = { color: "#23694f", zh: "綠色", en: "return flow or regulation" };
    const support = { color: "#b8871e", zh: "金色", en: "secondary element or modifier" };
    const signal = { color: "#182033", zh: "深色", en: "signal axis or structural boundary" };
    const alternate = { color: "#6552a3", zh: "紫色虛線", en: "alternate route or special case" };
    const legends = {
      cardiovascular: [
        [
          { color: "#b8871e", zh: "金色高亮焦點", en: "highlighted focus" },
          { color: "#7cc0e6", zh: "藍=缺氧血/右心", en: "deoxygenated, right heart" },
          { color: "#c5413a", zh: "紅=含氧血/左心", en: "oxygenated, left heart" },
          { color: "#145d9e", zh: "箭頭=血流方向", en: "blood flow direction" }
        ],
        [
          { color: "#b8871e", zh: "金色節律點", en: "pacemaker node" },
          { color: "#2e5f8d", zh: "藍色 AV node", en: "AV node delay" },
          { color: "#23694f", zh: "綠色分支", en: "Purkinje spread" },
          alternate
        ],
        [
          { color: "#bc3f34", zh: "紅色波形", en: "ECG tracing" },
          { color: "#2e5f8d", zh: "藍色向量", en: "lead vector" },
          { color: "#c9bea8", zh: "方格格線", en: "ECG grid" },
          alternate
        ],
        [
          { color: "#2e5f8d", zh: "藍線壓力", en: "pressure curve" },
          { color: "#b8871e", zh: "金線體積", en: "volume curve" },
          focus,
          { color: "#c9bea8", zh: "方格時間軸", en: "time grid" }
        ],
        [
          { color: "#bc3f34", zh: "紅線心音", en: "heart sound trace" },
          { color: "#2e5f8d", zh: "藍框 CO", en: "cardiac output" },
          regulation,
          { color: "#182033", zh: "深色軸/標註", en: "axis and labels" }
        ],
        [
          { color: "#2e5f8d", zh: "藍色正常 loop", en: "normal PV loop" },
          { color: "#bc3f34", zh: "紅色變化 loop", en: "changed PV loop" },
          focus,
          signal
        ]
      ],
      urinary: [
        [focus, { color: "#2e5f8d", zh: "藍色小管", en: "renal tubule" }, regulation, support],
        [
          { color: "#2e5f8d", zh: "藍色皮質/腎臟", en: "cortex / kidney" },
          { color: "#b8871e", zh: "金色髓質", en: "medulla" },
          { color: "#bc3f34", zh: "紅色腎元", en: "nephron" },
          regulation
        ],
        [
          { color: "#bc3f34", zh: "紅色腎絲球", en: "glomerular tuft" },
          { color: "#2e5f8d", zh: "藍色小動脈", en: "arterioles" },
          { color: "#23694f", zh: "綠/金/紫線", en: "filtration barrier layers" },
          focus
        ],
        [
          { color: "#2e5f8d", zh: "藍色 JG cell", en: "juxtaglomerular cell" },
          { color: "#b8871e", zh: "金色 renin", en: "renin" },
          { color: "#bc3f34", zh: "紅色 Ang II", en: "angiotensin II" },
          regulation
        ],
        [
          { color: "#2e5f8d", zh: "藍色腎臟", en: "kidney endocrine role" },
          { color: "#b8871e", zh: "金色 Vitamin D", en: "active vitamin D" },
          { color: "#bc3f34", zh: "紅色 EPO", en: "erythropoietin" },
          regulation
        ],
        [
          { color: "#2e5f8d", zh: "藍色血漿/GFR", en: "plasma or GFR" },
          { color: "#bc3f34", zh: "紅色尿液排出", en: "urinary excretion" },
          regulation,
          focus
        ]
      ],
      cns: [
        [flow, focus, regulation, support],
        [
          { color: "#2e5f8d", zh: "藍色 CNS", en: "central nervous system" },
          { color: "#bc3f34", zh: "紅色神經路徑", en: "peripheral nerve route" },
          { color: "#b8871e", zh: "金色神經節", en: "ganglion / cranial nerve point" },
          regulation
        ],
        [
          { color: "#2e5f8d", zh: "藍色 CNS", en: "brain and spinal cord" },
          { color: "#bc3f34", zh: "紅色 PNS 路徑", en: "PNS pathway" },
          support,
          regulation
        ],
        [
          { color: "#bc3f34", zh: "紅色 soma/樹突", en: "soma and dendrites" },
          { color: "#2e5f8d", zh: "藍色 axon", en: "axon" },
          { color: "#b8871e", zh: "金色 myelin", en: "myelin sheath" },
          regulation
        ],
        [
          { color: "#2e5f8d", zh: "藍色 axon", en: "axon" },
          { color: "#b8871e", zh: "金色髓鞘", en: "myelin" },
          { color: "#23694f", zh: "綠色 BBB", en: "blood-brain barrier" },
          { color: "#bc3f34", zh: "紅色 microglia", en: "microglia / immune support" }
        ],
        [
          { color: "#bc3f34", zh: "紅色傳入", en: "afferent sensory input" },
          { color: "#23694f", zh: "綠色傳出", en: "efferent motor output" },
          { color: "#2e5f8d", zh: "藍框 CNS", en: "CNS integration zone" },
          alternate
        ]
      ],
      "special-senses": [
        [
          { color: "#2e5f8d", zh: "藍色眼球/視野", en: "eyeball or visual field" },
          { color: "#b8871e", zh: "金色入射光", en: "incoming light" },
          { color: "#bc3f34", zh: "紅色視神經/焦點", en: "optic nerve or focus" },
          signal
        ],
        [
          { color: "#2e5f8d", zh: "藍色眼球", en: "eyeball" },
          { color: "#b8871e", zh: "金色光線", en: "light rays" },
          { color: "#bc3f34", zh: "紅色視神經", en: "optic nerve" },
          focus
        ],
        [
          { color: "#2e5f8d", zh: "藍色 rod", en: "rod photoreceptors" },
          { color: "#bc3f34", zh: "紅色 cone", en: "cone photoreceptors" },
          { color: "#b8871e", zh: "金色光刺激", en: "light stimulus" },
          regulation
        ],
        [
          { color: "#2e5f8d", zh: "藍色視網膜/眼", en: "retina / eyes" },
          { color: "#bc3f34", zh: "紅色視覺路徑", en: "visual pathway" },
          { color: "#b8871e", zh: "金色皮質區", en: "visual cortex target" },
          regulation
        ],
        [
          { color: "#bc3f34", zh: "紅色外耳/焦點", en: "outer ear or focus" },
          { color: "#b8871e", zh: "金色聽小骨", en: "ossicles" },
          { color: "#2e5f8d", zh: "藍色耳蝸", en: "cochlea" },
          regulation
        ],
        [
          { color: "#bc3f34", zh: "紅色外耳/毛細胞焦點", en: "outer ear or hair-cell focus" },
          { color: "#b8871e", zh: "金色中耳傳導", en: "middle-ear conduction" },
          { color: "#2e5f8d", zh: "藍色耳蝸", en: "cochlea" },
          regulation
        ],
        [
          { color: "#2e5f8d", zh: "藍色半規管", en: "semicircular canals" },
          { color: "#b8871e", zh: "金色第二管道", en: "canal plane" },
          { color: "#23694f", zh: "綠色耳石器", en: "otolith organs" },
          focus
        ],
        [
          { color: "#bc3f34", zh: "紅色味蕾", en: "taste bud" },
          { color: "#2e5f8d", zh: "藍/綠/金味質點", en: "taste modality points" },
          { color: "#182033", zh: "深色味覺神經", en: "afferent nerve VII/IX/X" },
          focus
        ]
      ]
    };
    return legends[unitId]?.[sectionIndex] || [focus, flow, regulation, support];
  }

  function focusDot(x, y, label, color = "#bc3f34") {
    return `
      <circle cx="${x}" cy="${y}" r="12" fill="${color}" opacity=".18" class="pulse-dot"/>
      <circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="#fffdf7" stroke-width="2"/>
      <title>${escapeHtml(label)}</title>
    `;
  }

  function cardiovascularVisual(text, sectionIndex, pointIndex) {
    if (sectionIndex === 0) {
      const spots = [
        [124, 84, "4 chambers"], [164, 98, "AV valves"], [263, 70, "semilunar"], [304, 116, "pressure gates"]
      ][pointIndex] || [210, 96, "flow"];
      return {
        caption: "四腔室、瓣膜與血流方向放在同一張圖看：右心送肺，左心送全身；瓣膜只由壓差決定開關。",
        svg: `
          <path d="M205 42 C170 20 112 34 92 82 C72 132 108 166 164 153 C184 168 226 168 250 150 C310 166 356 126 334 78 C316 36 258 18 216 48Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3" filter="url(#soft-shadow)"/>
          <path d="M210 48 V154 M99 102 H326" stroke="#182033" stroke-width="2.5" opacity=".7"/>
          <path d="M72 100 H106 M314 100 H376" stroke="#2e5f8d" stroke-width="5" marker-end="url(#arrow)"/>
          <path d="M158 102 L184 124 L210 102 M244 102 L270 124 L296 102" fill="none" stroke="#b8871e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M248 62 C280 42 314 50 334 76 M126 62 C154 42 184 48 202 72" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
          <text x="116" y="82" font-size="13" font-weight="900">RA</text><text x="260" y="82" font-size="13" font-weight="900">LA</text><text x="116" y="137" font-size="13" font-weight="900">RV</text><text x="260" y="137" font-size="13" font-weight="900">LV</text>
          <text x="38" y="88" font-size="11" font-weight="900">venae cavae</text><text x="338" y="88" font-size="11" font-weight="900">aorta</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 1) {
      const spots = [[254,58,"SA pacer"],[196,104,"AV delay"],[205,142,"His-Purkinje"],[252,91,"bypass"]][pointIndex] || [196,104,"node"];
      return {
        caption: "傳導圖要看實際路徑：SA node 起搏，AV node 延遲，His-Purkinje 讓心室同步；旁路會太早刺激心室。",
        svg: `
          <path d="M202 42 C154 22 96 58 94 114 C92 160 144 170 202 146 C258 174 326 154 328 96 C330 42 260 20 216 58Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3" filter="url(#soft-shadow)"/>
          <circle cx="254" cy="58" r="11" fill="#b8871e"/><circle cx="196" cy="104" r="10" fill="#2e5f8d"/>
          <path d="M254 70 C246 88 226 98 196 104 C190 122 184 136 174 156" fill="none" stroke="#182033" stroke-width="4" marker-end="url(#arrow)"/>
          <path d="M174 156 C140 132 124 118 106 94 M174 156 C222 134 268 126 308 104" fill="none" stroke="#23694f" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M252 70 C276 88 286 112 304 132" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="6 5"/>
          <text x="270" y="61" font-size="12" font-weight="900">SA</text><text x="212" y="108" font-size="12" font-weight="900">AV</text><text x="80" y="174" font-size="12" font-weight="900">fast ventricular network</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 2) {
      const spots = [[96,92,"lead view"],[174,50,"P-QRS-T"],[322,58,"projection"],[122,124,"arrhythmia"]][pointIndex] || [174,50,"ECG"];
      return {
        caption: "ECG 是導程對心臟電向量的投影：波形高低、正負與寬窄都要回推到傳導方向與時間。",
        svg: `
          <rect x="38" y="30" width="344" height="128" rx="10" fill="#fffdf7" stroke="#c9bea8"/>
          ${[68,108,148,188,228,268,308,348].map((x) => `<line x1="${x}" y1="38" x2="${x}" y2="150" stroke="#ebe3d4"/>`).join("")}
          <path d="M48 106 H76 C84 84 96 84 104 106 H138 L152 128 L168 56 L184 112 H224 C236 96 248 90 262 96 C276 102 282 114 308 114 H370" fill="none" stroke="#bc3f34" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="104" cy="106" r="8" fill="#2e5f8d44"/><circle cx="168" cy="56" r="9" fill="#b8871e66"/><circle cx="262" cy="96" r="8" fill="#23694f55"/>
          <path d="M304 82 L356 52" stroke="#2e5f8d" stroke-width="3" marker-end="url(#arrow)"/><path d="M84 128 C112 114 136 104 158 82" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="5 5"/>
          <text x="88" y="78" font-size="12" font-weight="900">P</text><text x="148" y="43" font-size="12" font-weight="900">QRS</text><text x="250" y="82" font-size="12" font-weight="900">T</text><text x="306" y="45" font-size="12" font-weight="900">mean vector</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 3) {
      const spots = [[86,132,"MC"],[152,72,"isovol."],[248,148,"SV"],[322,136,"diastole"]][pointIndex] || [86,132,"cycle"];
      return {
        caption: "心動週期像 Wiggers 圖：瓣膜事件切成 MC、AO、AC、MO，壓力在動，等容積期體積不動。",
        svg: `
          <rect x="42" y="30" width="336" height="128" rx="10" fill="#fffdf7" stroke="#c9bea8"/>
          <path d="M54 132 C92 132 94 62 142 62 C192 62 196 134 242 134 C292 134 310 78 366 78" fill="none" stroke="#2e5f8d" stroke-width="4"/>
          <path d="M54 146 H118 H150 C210 146 210 146 250 146 C310 146 318 146 366 146" fill="none" stroke="#b8871e" stroke-width="4"/>
          ${["MC","AO","AC","MO"].map((label, i) => `<circle cx="${86 + i * 80}" cy="${i % 2 ? 62 : 132}" r="7" fill="#bc3f34"/><text x="${72 + i * 80}" y="${i % 2 ? 50 : 121}" font-size="11" font-weight="900">${label}</text>`).join("")}
          <path d="M210 146 H258" stroke="#23694f" stroke-width="5" marker-end="url(#arrow)"/><text x="198" y="173" font-size="12" font-weight="900">volume: EDV - ESV = SV</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 4) {
      const spots = [[96,118,"S1/S2"],[160,90,"S3/S4"],[256,82,"CO"],[318,126,"drug"]][pointIndex] || [256,82,"CO"];
      return {
        caption: "心音、心輸出量與藥理情境都接回同一個泵浦：HR × SV，以及 preload/afterload/contractility 的方向。",
        svg: `
          <path d="M62 120 H102 L110 96 L122 120 H156 L166 78 L178 120 H214" fill="none" stroke="#bc3f34" stroke-width="4" stroke-linejoin="round"/>
          <rect x="232" y="48" width="120" height="70" rx="12" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
          <text x="248" y="76" font-size="14" font-weight="900">CO = HR × SV</text>
          <path d="M242 138 H344" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/><text x="244" y="166" font-size="11" font-weight="900">loading + contractility</text>
          <text x="62" y="152" font-size="11" font-weight="900">heart sounds</text>
          ${focusDot(...spots)}
        `
      };
    }
    const spots = [[205,94,"work area"],[330,150,"EDV↑"],[155,54,"ESV↑"],[132,58,"contractility↑"]][pointIndex] || [205,94,"PV loop"];
    const loop = pointIndex === 1 ? "118,150 118,58 350,58 350,150 118,150" : pointIndex === 2 ? "166,150 166,42 324,42 324,150 166,150" : pointIndex === 3 ? "112,150 112,56 304,42 304,150 112,150" : "138,150 138,58 320,58 320,150 138,150";
    return {
      caption: "PV loop 把壓力、體積、瓣膜事件與做功放在同一平面；不同情境會改變 loop 的寬度、高度與左右邊界。",
      svg: `
        <line x1="70" y1="150" x2="374" y2="150" stroke="#182033" stroke-width="2.5"/><line x1="70" y1="150" x2="70" y2="26" stroke="#182033" stroke-width="2.5"/>
        <polygon points="138,150 138,58 320,58 320,150 138,150" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="3"/>
        <polygon points="${loop}" fill="#bc3f3422" stroke="#bc3f34" stroke-width="4" stroke-linejoin="round"/>
        <text x="54" y="30" font-size="11" font-weight="900">P</text><text x="354" y="171" font-size="11" font-weight="900">V</text>
        <text x="104" y="172" font-size="12" font-weight="900">ESV</text><text x="318" y="172" font-size="12" font-weight="900">EDV</text>
        ${focusDot(...spots)}
      `
    };
  }

  function urinaryVisual(text, sectionIndex, pointIndex) {
    if (sectionIndex === 0) {
      const spots = [[92,72,"filter"],[250,128,"reabsorb"],[318,58,"secrete"],[332,118,"clearance"]][pointIndex] || [250,128,"tubule"];
      return {
        caption: "用一個腎元看三功能：血漿進 Bowman capsule，小管決定回收、分泌與最後排出。",
        svg: `
          <circle cx="92" cy="72" r="34" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
          <path d="M126 72 C192 34 254 44 258 90 C262 132 206 134 206 104 C206 72 288 72 342 112" fill="none" stroke="#2e5f8d" stroke-width="7" stroke-linecap="round"/>
          <path d="M64 130 C138 166 270 168 356 126" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
          <path d="M314 48 C298 68 286 84 270 102" fill="none" stroke="#b8871e" stroke-width="4" marker-end="url(#arrow)"/>
          <text x="46" y="42" font-size="12" font-weight="900">glomerulus</text><text x="194" y="170" font-size="12" font-weight="900">peritubular blood: NaCl/H2O return</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 1) {
      const spots = [[104,138,"urine out"],[92,58,"cortex"],[244,128,"long loop"],[286,88,"vasa recta"]][pointIndex] || [244,128,"medulla"];
      return {
        caption: "腎臟切面要分皮質、髓質與腎盂；近髓質腎元長 loop 深入髓質，旁邊有 vasa recta 維持梯度。",
        svg: `
          <path d="M100 28 C48 50 48 126 104 160 C162 126 162 62 100 28Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
          <path d="M112 58 C82 80 84 118 114 140 C142 116 142 82 112 58Z" fill="#b8871e44" stroke="#b8871e" stroke-width="2.5"/>
          <path d="M148 92 C212 48 318 54 330 100 C340 148 248 162 210 126" fill="none" stroke="#bc3f34" stroke-width="5"/>
          <path d="M242 72 V150 M272 72 V150" stroke="#23694f" stroke-width="4"/>
          <path d="M104 160 C130 168 146 168 166 164" stroke="#2e5f8d" stroke-width="5" marker-end="url(#arrow)"/>
          <text x="42" y="174" font-size="12" font-weight="900">pelvis → ureter</text><text x="212" y="174" font-size="12" font-weight="900">loop + vasa recta gradient</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 2) {
      const spots = [[62,88,"afferent"],[202,94,"capillary tuft"],[222,148,"3-layer barrier"],[286,70,"protein leak"]][pointIndex] || [222,148,"barrier"];
      return {
        caption: "腎絲球濾過膜不是一張網，而是 fenestrated endothelium、basement membrane、podocyte slit 三層篩選。",
        svg: `
          <path d="M40 94 C88 48 126 52 158 90" fill="none" stroke="#2e5f8d" stroke-width="7" marker-end="url(#arrow)"/>
          <circle cx="212" cy="94" r="48" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
          ${[0,1,2,3,4,5].map((i) => `<circle cx="${184 + (i % 3) * 26}" cy="${74 + Math.floor(i / 3) * 30}" r="12" fill="#fffdf7" stroke="#bc3f34" stroke-width="2.5"/>`).join("")}
          <path d="M266 94 C312 48 352 52 382 94" fill="none" stroke="#2e5f8d" stroke-width="5" marker-end="url(#arrow)"/>
          <path d="M168 144 H258" stroke="#23694f" stroke-width="4"/><path d="M176 154 H250" stroke="#b8871e" stroke-width="4"/><path d="M184 164 H242" stroke="#6552a3" stroke-width="4"/>
          <text x="122" y="180" font-size="12" font-weight="900">endothelium / basement membrane / podocyte slit</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 3) {
      const spots = [[74,130,"macula densa"],[92,74,"renin"],[244,82,"Ang II"],[326,134,"aldosterone"]][pointIndex] || [244,82,"RAAS"];
      return {
        caption: "JGA 把濾液 NaCl、入球壓力與交感 β1 轉成 renin 釋放，再啟動 Ang II 與 aldosterone。",
        svg: `
          <rect x="38" y="52" width="80" height="46" rx="10" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><text x="54" y="80" font-size="12" font-weight="900">JG cell</text>
          <circle cx="76" cy="130" r="18" fill="#23694f33" stroke="#23694f" stroke-width="3"/><text x="28" y="166" font-size="12" font-weight="900">NaCl↓ / pressure↓ / β1↑</text>
          <path d="M122 76 H174" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="180" y="54" width="62" height="44" rx="8" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/><text x="193" y="81" font-size="12" font-weight="900">renin</text>
          <path d="M246 76 H294" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="300" y="54" width="76" height="44" rx="8" fill="#bc3f3433" stroke="#bc3f34" stroke-width="3"/><text x="318" y="81" font-size="12" font-weight="900">Ang II</text>
          <path d="M338 100 V134" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><text x="260" y="166" font-size="12" font-weight="900">AT1 vasoconstriction + aldosterone</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 4) {
      const spots = [[92,94,"kidney"],[222,66,"Vit D"],[222,126,"EPO"],[322,94,"adrenal"]][pointIndex] || [92,94,"endocrine"];
      return {
        caption: "腎臟不是只排尿：它完成活性 Vitamin D、分泌 EPO，並和腎上腺皮質的 aldosterone 接成調控網。",
        svg: `
          <path d="M92 48 C54 62 52 126 92 144 C132 126 132 62 92 48Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><text x="70" y="100" font-size="12" font-weight="900">kidney</text>
          <path d="M132 80 H192" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="202" y="48" width="82" height="40" rx="8" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/><text x="216" y="73" font-size="12" font-weight="900">1,25-D</text>
          <path d="M132 110 H192" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="202" y="108" width="82" height="40" rx="8" fill="#bc3f3433" stroke="#bc3f34" stroke-width="3"/><text x="224" y="133" font-size="12" font-weight="900">EPO</text>
          <circle cx="334" cy="94" r="28" fill="#23694f33" stroke="#23694f" stroke-width="3"/><text x="296" y="164" font-size="12" font-weight="900">gut Ca absorption / bone marrow RBC / aldosterone</text>
          ${focusDot(...spots)}
        `
      };
    }
    const spots = [[170,92,"inulin"],[230,92,"Cx"],[298,128,"compare GFR"],[106,92,"plasma flow"]][pointIndex] || [230,92,"clearance"];
    return {
      caption: "清除率是虛擬清空體積：Cx = Ux × V / Px；和 GFR 比較即可判斷淨重吸收或淨分泌。",
      svg: `
        <rect x="42" y="40" width="336" height="112" rx="12" fill="#fffdf7" stroke="#c9bea8" stroke-width="2.5"/>
        <path d="M70 92 H148" stroke="#2e5f8d" stroke-width="5" marker-end="url(#arrow)"/><text x="66" y="73" font-size="12" font-weight="900">Px / RPF</text>
        <circle cx="188" cy="92" r="30" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><text x="170" y="96" font-size="12" font-weight="900">GFR</text>
        <path d="M220 92 H314" stroke="#bc3f34" stroke-width="5" marker-end="url(#arrow-red)"/><text x="246" y="73" font-size="12" font-weight="900">Ux · V</text>
        <path d="M214 128 C248 162 290 162 326 130" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
        <text x="132" y="176" font-size="12" font-weight="900">Cx &lt; GFR reabsorb · Cx &gt; GFR secrete</text>
        ${focusDot(...spots)}
      `
    };
  }

  function cnsVisual(text, sectionIndex, pointIndex) {
    if (sectionIndex === 0) {
      const spots = [[84,100,"excitable"],[222,100,"integrate"],[350,100,"output"],[184,154,"feedback"]][pointIndex] || [222,100,"CNS"];
      return {
        caption: "神經系統是 input、integration、output 的高速控制系統；所有路徑最後都服務 homeostasis。",
        svg: `
          <rect x="44" y="76" width="82" height="48" rx="10" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><text x="66" y="104" font-size="12" font-weight="900">Input</text>
          <path d="M132 100 H174" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><circle cx="222" cy="100" r="44" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/><text x="196" y="104" font-size="12" font-weight="900">Integrate</text>
          <path d="M270 100 H314" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><rect x="322" y="76" width="58" height="48" rx="10" fill="url(#tissue-green)" stroke="#23694f" stroke-width="3"/><text x="334" y="104" font-size="12" font-weight="900">Output</text>
          <path d="M222 144 C196 170 156 164 134 132" fill="none" stroke="#b8871e" stroke-width="4" marker-end="url(#arrow)"/>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex <= 2) {
      const spots = [[118,72,"brain"],[116,130,"spinal cord"],[302,80,"cranial n."],[320,138,"ganglion/PNS"]][pointIndex] || [302,80,"PNS"];
      return {
        caption: "CNS 是腦與脊髓；腦神經、脊神經、神經節與周邊末梢屬 PNS，分類題要看位置。",
        svg: `
          <path d="M106 50 C132 30 166 48 156 78 C146 106 104 100 96 78 C90 64 94 56 106 50Z" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><rect x="112" y="96" width="28" height="70" rx="14" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
          <path d="M154 72 C208 56 250 60 304 80 M144 130 C210 160 264 158 336 136" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
          <circle cx="318" cy="80" r="16" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/><circle cx="350" cy="136" r="16" fill="#23694f44" stroke="#23694f" stroke-width="3"/>
          <text x="84" y="32" font-size="12" font-weight="900">CNS</text><text x="274" y="52" font-size="12" font-weight="900">PNS nerves</text><text x="270" y="172" font-size="12" font-weight="900">afferent in · efferent out</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 3) {
      const spots = [[112,96,"soma"],[154,96,"axon hillock"],[246,96,"axon/myelin"],[338,84,"terminal"]][pointIndex] || [154,96,"neuron"];
      return {
        caption: "神經元不是一條線：dendrite 收訊、soma 整合、axon hillock 起始動作電位、axon terminal 傳到下一個細胞。",
        svg: `
          <circle cx="112" cy="96" r="32" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/><path d="M86 78 C54 44 40 84 58 108 M88 116 C58 152 38 136 34 164" fill="none" stroke="#bc3f34" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M146 96 H318" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round" marker-end="url(#arrow)"/>
          ${[178,218,258].map((x) => `<rect x="${x}" y="84" width="26" height="24" rx="10" fill="#b8871e88"/>`).join("")}
          <path d="M318 96 C350 70 366 76 388 58 M318 96 C352 124 370 118 388 142" fill="none" stroke="#23694f" stroke-width="3.5"/>
          <text x="54" y="178" font-size="12" font-weight="900">dendrite → soma → hillock → myelinated axon → synapse</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 4) {
      const spots = [[68,96,"microglia"],[150,82,"myelin"],[282,62,"BBB"],[222,132,"glia support"]][pointIndex] || [150,82,"glia"];
      return {
        caption: "膠細胞是神經元背後的維生系統：髓鞘加速、astrocyte 支持 BBB、microglia 清除與免疫。",
        svg: `
          <path d="M58 106 C110 62 164 66 198 98 C238 132 286 128 350 86" fill="none" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round"/>
          ${[96,142,216,266].map((x) => `<rect x="${x}" y="84" width="28" height="24" rx="11" fill="#b8871eaa"/>`).join("")}
          <circle cx="64" cy="96" r="22" fill="#bc3f3433" stroke="#bc3f34" stroke-width="3"/>
          <path d="M268 62 C306 38 344 40 374 62" fill="none" stroke="#23694f" stroke-width="4"/><text x="276" y="36" font-size="12" font-weight="900">BBB</text>
          <path d="M204 126 C232 150 262 150 292 126" fill="none" stroke="#6552a3" stroke-width="3"/>
          <text x="34" y="174" font-size="12" font-weight="900">microglia · oligodendrocyte/Schwann · astrocyte</text>
          ${focusDot(...spots)}
        `
      };
    }
    const spots = [[96,84,"sensory PNS"],[210,96,"interneuron CNS"],[326,122,"motor PNS"],[244,62,"myelin speed"]][pointIndex] || [210,96,"reflex"];
    return {
      caption: "把分類接回反射路徑：感覺神經元與 α motor neuron 可跨進 CNS，但細胞分類仍常算 PNS；中間神經元完整留在 CNS。",
      svg: `
        <rect x="166" y="50" width="100" height="94" rx="16" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><text x="200" y="44" font-size="12" font-weight="900">CNS</text>
        <path d="M52 84 C94 58 134 62 166 92" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
        <circle cx="210" cy="96" r="16" fill="#b8871e66" stroke="#b8871e" stroke-width="3"/>
        <path d="M226 96 C268 96 296 112 346 122" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#arrow)"/>
        <path d="M92 120 C130 154 300 154 346 128" fill="none" stroke="#6552a3" stroke-width="3" stroke-dasharray="6 5"/>
        <text x="48" y="56" font-size="12" font-weight="900">receptor</text><text x="332" y="148" font-size="12" font-weight="900">muscle</text>
        ${focusDot(...spots)}
      `
    };
  }

  function sensesVisual(text, sectionIndex, pointIndex) {
    if (sectionIndex <= 1) {
      const spots = sectionIndex === 0
        ? ([[210,96,"monocular"],[292,96,"optic disc"],[76,68,"color field"]][pointIndex] || [210,96,"field"])
        : ([[196,96,"lens"],[236,126,"near point"],[62,68,"wavelength"]][pointIndex] || [196,96,"focus"]);
      return {
        caption: "眼球是光學系統：cornea/lens 把光聚焦到 retina；optic disc 沒有 photoreceptor，所以形成盲點。",
        svg: `
          <ellipse cx="206" cy="96" rx="118" ry="62" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
          <circle cx="134" cy="96" r="28" fill="#fffdf7" stroke="#182033" stroke-width="3"/><circle cx="134" cy="96" r="10" fill="#182033"/>
          <path d="M42 68 C86 82 106 92 134 96 M42 124 C86 110 106 100 134 96" fill="none" stroke="#b8871e" stroke-width="3" marker-end="url(#arrow)"/>
          <path d="M306 96 C338 90 360 78 386 62" fill="none" stroke="#bc3f34" stroke-width="5" marker-end="url(#arrow-red)"/>
          <circle cx="292" cy="96" r="8" fill="#182033"/><text x="270" y="132" font-size="12" font-weight="900">optic disc</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 2) {
      const spots = [[96,126,"rods"],[246,126,"cones"],[202,44,"light"],[306,96,"hyperpolarize"]][pointIndex] || [202,44,"phototransduction"];
      return {
        caption: "視網膜可當成分層電路：光照使 rod/cone 超極化，再改變 bipolar 與 ganglion cell 訊號。",
        svg: `
          <rect x="54" y="36" width="312" height="120" rx="12" fill="#fffdf7" stroke="#c9bea8" stroke-width="2.5"/>
          ${[88,118,148].map((x) => `<path d="M${x} 134 V72" stroke="#2e5f8d" stroke-width="7" stroke-linecap="round"/><circle cx="${x}" cy="62" r="8" fill="#2e5f8d55"/>`).join("")}
          ${[226,258,290].map((x) => `<path d="M${x} 134 V74" stroke="#bc3f34" stroke-width="8" stroke-linecap="round"/><circle cx="${x}" cy="62" r="11" fill="#bc3f3455"/>`).join("")}
          <path d="M202 26 L178 64 M202 26 L218 66" stroke="#b8871e" stroke-width="3.5" marker-end="url(#arrow)"/>
          <path d="M312 134 C332 112 342 94 348 70" fill="none" stroke="#23694f" stroke-width="3.5" marker-end="url(#arrow)"/>
          <text x="66" y="174" font-size="12" font-weight="900">outer segment → bipolar/ganglion path · light reduces transmitter</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 3) {
      const spots = [[118,80,"retina"],[206,102,"chiasm"],[338,56,"occipital"],[132,132,"binocular"]][pointIndex] || [206,102,"visual path"];
      return {
        caption: "視覺路徑從 retina 經 optic chiasm、tract 到枕葉；側向抑制與雙眼差異讓邊界和深度更清楚。",
        svg: `
          <circle cx="86" cy="80" r="28" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><circle cx="86" cy="126" r="28" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
          <path d="M114 80 C160 80 176 102 210 102 M114 126 C160 126 176 102 210 102" fill="none" stroke="#182033" stroke-width="4"/>
          <path d="M210 102 C260 78 300 72 350 52 M210 102 C260 126 302 132 350 152" fill="none" stroke="#bc3f34" stroke-width="4" marker-end="url(#arrow-red)"/>
          <rect x="342" y="34" width="36" height="36" rx="8" fill="#b8871e55" stroke="#b8871e" stroke-width="2.5"/><rect x="342" y="134" width="36" height="32" rx="8" fill="#23694f55" stroke="#23694f" stroke-width="2.5"/>
          <text x="146" y="174" font-size="12" font-weight="900">chiasm crossing · cortex integration</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex <= 5) {
      const spots = [[70,96,"outer ear"],[226,96,"ossicles"],[332,112,"cochlea"],[332,92,"hair cells"]][pointIndex] || [332,112,"tonotopy"];
      return {
        caption: "聲音先由外耳收集，中耳聽小骨做阻抗匹配，內耳耳蝸以基底膜位置編碼音高，毛細胞負責換能。",
        svg: `
          <path d="M44 96 C78 46 126 58 118 102 C112 136 84 148 62 132" fill="none" stroke="#bc3f34" stroke-width="6"/>
          <path d="M128 96 H176" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/><circle cx="206" cy="96" r="20" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/><circle cx="248" cy="96" r="16" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/>
          <path d="M282 96 C326 46 388 72 366 124 C344 172 290 150 304 112 C318 84 350 94 338 122" fill="none" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round"/>
          <circle cx="338" cy="112" r="9" fill="#bc3f34" class="pulse-dot"/>
          <path d="M312 132 L350 94" stroke="#23694f" stroke-width="3.5" marker-end="url(#arrow)"/>
          <text x="40" y="166" font-size="12" font-weight="900">sound → ossicles → cochlear traveling wave → hair cells</text>
          ${focusDot(...spots)}
        `
      };
    }
    if (sectionIndex === 6) {
      const spots = [[150,76,"semicircular"],[214,132,"otolith"],[326,96,"VOR eye"]][pointIndex] || [150,76,"vestibular"];
      return {
        caption: "前庭有兩套感測器：半規管偵測旋轉，utricle/saccule 的 otolith 偵測線性加速度與頭位，並驅動眼震/VOR。",
        svg: `
          <path d="M126 60 C194 20 270 52 236 108 C196 174 96 138 126 60Z" fill="none" stroke="#2e5f8d" stroke-width="6"/>
          <path d="M180 78 C230 38 306 76 270 132 C232 188 148 148 180 78Z" fill="none" stroke="#b8871e" stroke-width="5"/>
          <ellipse cx="204" cy="130" rx="54" ry="22" fill="#23694f33" stroke="#23694f" stroke-width="3"/>
          <circle cx="326" cy="96" r="28" fill="#fffdf7" stroke="#182033" stroke-width="3"/><circle cx="326" cy="96" r="8" fill="#182033"/>
          <path d="M296 96 H266" stroke="#bc3f34" stroke-width="3.5" marker-end="url(#arrow-red)"/>
          ${focusDot(...spots)}
        `
      };
    }
    const spots = [[104,78,"taste pore"],[150,78,"taste cells"],[276,110,"VII/IX/X"]][pointIndex] || [150,78,"taste"];
    return {
      caption: "味覺是化學物質刺激味蕾細胞，再由 VII、IX、X 腦神經傳入；苦味閾值低有保護意義。",
      svg: `
        <path d="M72 72 C116 44 164 44 208 72 C172 114 112 114 72 72Z" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
        <circle cx="108" cy="78" r="7" fill="#b8871e"/><circle cx="134" cy="76" r="7" fill="#23694f"/><circle cx="160" cy="78" r="7" fill="#2e5f8d"/>
        <path d="M210 76 C250 76 274 94 292 116 C314 144 344 150 376 132" fill="none" stroke="#182033" stroke-width="4" marker-end="url(#arrow)"/>
        <text x="76" y="136" font-size="12" font-weight="900">sweet · salty · sour · bitter · umami</text><text x="274" y="92" font-size="12" font-weight="900">VII · IX · X</text>
        ${focusDot(...spots)}
      `
    };
  }

  function genericPhysioVisual(sectionIndex, pointIndex) {
    return {
      caption: "把抽象名詞接回身體裡的結構、流向與調控回饋。",
      svg: `
        <rect x="48" y="54" width="90" height="74" rx="18" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/>
        <path d="M144 92 H276" stroke="#182033" stroke-width="3" marker-end="url(#arrow)"/>
        <rect x="282" y="54" width="90" height="74" rx="18" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>
        ${focusDot(82 + pointIndex * 42, 92, "focus")}
        <path d="M324 132 C274 170 148 170 96 132" fill="none" stroke="#23694f" stroke-width="3" marker-end="url(#arrow)"/>
      `
    };
  }

  function renderDrill(unitId, key, drill) {
    const shuffled = shuffleChoices(drill.choices, drill.answer, key);
    const zh = drill.zh;
    let zhToggle = "";
    let zhExplain = "";
    if (zh) {
      const zhShuffled = zh.choices ? shuffleChoices(zh.choices, drill.answer, key) : null;
      const zhChoices = zhShuffled
        ? `<ol class="drill-zh-choices">${zhShuffled.choices.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ol>`
        : "";
      zhToggle = `<details class="drill-zh"><summary>中文翻譯</summary><div class="drill-zh-body"><p class="drill-zh-q">${escapeHtml(zh.question)}</p>${zhChoices}</div></details>`;
      if (zh.explain) zhExplain = `<span class="answer-zh">${escapeHtml(zh.explain)}</span>`;
    }
    return `
      <div class="drill" data-drill="${escapeHtml(key)}" data-unit="${escapeHtml(unitId)}" data-answer="${shuffled.answer}">
        <p class="drill-question">${annotateTerms(drill.question)}</p>
        <div class="choice-row">
          ${shuffled.choices.map((choice, index) => `<button class="btn choice" type="button" data-choice="${index}">${annotateTerms(choice)}</button>`).join("")}
        </div>
        ${zhToggle}
        <div class="answer">${annotateTerms(drill.explain)}${zhExplain}</div>
      </div>
    `;
  }

  function shuffleChoices(choices, answer, key) {
    const items = choices.map((choice, index) => ({ choice, originalIndex: index }));
    // Use only the drill key so English choices and their Chinese translations
    // receive the exact same permutation even though their text differs.
    let seed = hashString(`${key}:choices`);
    for (let i = items.length - 1; i > 0; i -= 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [items[i], items[j]] = [items[j], items[i]];
    }
    if (items.length > 1) {
      const targetIndex = hashString(`${key}:answer-position`) % items.length;
      const currentIndex = items.findIndex((item) => item.originalIndex === answer);
      if (currentIndex >= 0 && currentIndex !== targetIndex) {
        [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];
      }
    }
    return {
      choices: items.map((item) => item.choice),
      answer: items.findIndex((item) => item.originalIndex === answer)
    };
  }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function renderReview(unit) {
    const highYield = window.PHYSIO_HIGH_YIELD?.[unit.id] || [];
    return `
      <section class="review-panel" id="unit-review">
        <div class="unit-code">${escapeHtml(unit.shortTitle)} · 單元總複習</div>
        <h2 class="panel-title">統整複習：關鍵句、關鍵字與高頻考點</h2>
        <p class="review-lead">先掃標題，再背「關鍵句」；「陷阱／速記」是選項最常偷換的地方。以下已納入「必考重點」頁中屬於本單元的全部內容。</p>
        <div class="high-yield-grid">
          ${highYield.map(([level, title, key, trap]) => `
            <article class="high-yield-card" data-level="${level}">
              <span class="high-yield-tag">${level === "must" ? "明示必考" : level === "board" ? "國考補充" : "高頻重點"}</span>
              <h3>${annotateTerms(title)}</h3>
              <p class="high-yield-key"><b>關鍵句｜</b>${annotateTerms(key)}</p>
              <p class="high-yield-trap"><b>陷阱／速記｜</b>${annotateTerms(trap)}</p>
            </article>
          `).join("")}
        </div>
        <div class="review-grid">
          <div>
            <h3>必背主線</h3>
            <ol>
              ${unit.review.mustKnow.map((item) => `<li>${annotateTerms(item)}</li>`).join("")}
            </ol>
            <h3>常見失誤</h3>
            <ul>
              ${unit.review.traps.map((item) => `<li>${annotateTerms(item)}</li>`).join("")}
            </ul>
          </div>
          <div>
            <h3>章末混合題</h3>
            <div class="review-quiz">
              ${unit.quiz.map((item, index) => renderDrill(unit.id, `${unit.id}:quiz:${index}`, item)).join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderSources(unit) {
    return `
      <details class="source-details">
        <summary>來源檔與完整度清單</summary>
        <div class="source-links">
          ${unit.sources.map((source) => `<a class="btn secondary" href="${escapeHtml(source.href)}" target="_blank" rel="noreferrer">${annotateTerms(source.label)}</a>`).join("")}
        </div>
        <div class="table-wrap" style="padding:0 16px 16px">
          <table>
            <thead><tr><th>已覆蓋來源主題</th><th>頁面位置</th></tr></thead>
            <tbody>
              ${unit.coverage.map((item) => `<tr><td>${annotateTerms(item.topic)}</td><td>${annotateTerms(item.where)}</td></tr>`).join("")}
            </tbody>
          </table>
        </div>
      </details>
    `;
  }

  function bindChoices(scope = document) {
    scope.querySelectorAll("[data-drill]").forEach((drill) => {
      drill.querySelectorAll("[data-choice]").forEach((button) => {
        button.addEventListener("click", () => {
          const answer = Number(drill.dataset.answer);
          const selected = Number(button.dataset.choice);
          drill.querySelectorAll("[data-choice]").forEach((choice) => {
            const value = Number(choice.dataset.choice);
            choice.classList.toggle("correct", value === answer);
            choice.classList.toggle("wrong", value === selected && value !== answer);
          });
          drill.querySelector(".answer")?.classList.add("show");
          markDrill(drill.dataset.unit, drill.dataset.drill, selected === answer);
          typesetMath();
        }, { once: true });
      });
    });
  }

  // ===== Per-point interactive learning blocks (cardiovascular) =====
  const PB_DEFS = `<defs><marker id="pb-d" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L0,8 L8,4 z" fill="#182033"/></marker><marker id="pb-r" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L0,8 L8,4 z" fill="#bc3f34"/></marker><marker id="pb-b" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L0,8 L8,4 z" fill="#145d9e"/></marker><linearGradient id="tissue-red" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff2ee"/><stop offset="1" stop-color="#bc3f3429"/></linearGradient><linearGradient id="tissue-blue" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#eef6fb"/><stop offset="1" stop-color="#2e5f8d2b"/></linearGradient><linearGradient id="tissue-green" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#eff8f0"/><stop offset="1" stop-color="#23694f24"/></linearGradient></defs>`;
  const pbSvg = (vb, inner) => `<svg viewBox="${vb}" role="img" aria-hidden="true">${PB_DEFS}${inner}</svg>`;
  const pbHeart = (o) => pbSvg("0 0 300 355", renderHeartAnatomySvg(o || {}));
  const pbHeartEcg = (focus) => pbSvg("0 0 680 560", renderHeartAnatomySvg({ x: 190, y: 18, scale: 1.18, mode: "conduction", focus, showConduction: true, showEcg: true }));
  const pbEcg = (d, extra) => pbSvg("0 0 300 120", `<rect x="6" y="8" width="288" height="104" rx="8" fill="#fffdf7" stroke="#c9bea8"/><path d="${d}" fill="none" stroke="#bc3f34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${extra || ""}`);

  function pbShell(node, title, intro) {
    node.classList.add("point-lab");
    node.innerHTML = `<div class="lab-head"><strong>${escapeHtml(title)}</strong>${intro ? ` <span class="muted">${escapeHtml(intro)}</span>` : ""}</div><div data-ctrl></div><div class="lab-stage" data-stage></div><div class="mini-output" data-out></div>`;
    return { ctrl: node.querySelector("[data-ctrl]"), stage: node.querySelector("[data-stage]"), out: node.querySelector("[data-out]") };
  }
  function pbTabs(node, opts) {
    const ui = pbShell(node, opts.title, opts.intro);
    const seg = document.createElement("div"); seg.className = "seg";
    opts.tabs.forEach((t, i) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t.label; b.addEventListener("click", () => set(i)); seg.appendChild(b); });
    ui.ctrl.appendChild(seg);
    function set(i) { [...seg.children].forEach((b, j) => b.classList.toggle("active", j === i)); ui.stage.innerHTML = opts.tabs[i].svg; ui.out.innerHTML = opts.tabs[i].note; }
    set(opts.initial || 0);
  }
  function pbStepper(node, opts) {
    const ui = pbShell(node, opts.title, opts.intro);
    const seg = document.createElement("div"); seg.className = "seg";
    opts.steps.forEach((t, i) => { const b = document.createElement("button"); b.type = "button"; b.innerHTML = `<span class="pb-n">${i + 1}</span>${escapeHtml(t.label)}`; b.addEventListener("click", () => set(i)); seg.appendChild(b); });
    ui.ctrl.appendChild(seg);
    function set(i) { [...seg.children].forEach((b, j) => b.classList.toggle("active", j === i)); ui.stage.innerHTML = opts.steps[i].svg; ui.out.innerHTML = opts.steps[i].note; }
    set(opts.initial || 0);
  }
  function pbSlider(node, opts) {
    const ui = pbShell(node, opts.title, opts.intro);
    const wrap = document.createElement("div"); wrap.className = "lab-controls";
    const state = {};
    opts.sliders.forEach((s) => { state[s.key] = s.value; const l = document.createElement("label"); l.innerHTML = `${escapeHtml(s.label)} <input type="range" min="${s.min}" max="${s.max}" step="${s.step || 1}" value="${s.value}" data-k="${s.key}">`; wrap.appendChild(l); });
    ui.ctrl.appendChild(wrap);
    const upd = () => { const r = opts.render(state); ui.stage.innerHTML = r.svg; ui.out.innerHTML = r.note; };
    let updateQueued = false;
    const scheduleUpdate = () => {
      if (updateQueued) return;
      updateQueued = true;
      window.requestAnimationFrame(() => {
        updateQueued = false;
        upd();
      });
    };
    wrap.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", () => {
      state[inp.dataset.k] = Number(inp.value);
      scheduleUpdate();
    }));
    upd();
  }
  function pbHotspots(node, opts) {
    const ui = pbShell(node, opts.title, opts.intro);
    const dots = opts.spots.map((s, i) => `<g class="pb-hot" data-i="${i}"><circle cx="${s.x}" cy="${s.y}" r="14" fill="#bc3f34" opacity=".16"/><circle class="pb-core" cx="${s.x}" cy="${s.y}" r="6.5" fill="#bc3f34" stroke="#fffdf7" stroke-width="2"/></g>`).join("");
    ui.stage.innerHTML = pbSvg(opts.viewBox, opts.base + dots);
    ui.out.innerHTML = `<span class="muted">點上面的紅點看各部位說明。</span>`;
    ui.stage.querySelectorAll(".pb-hot").forEach((g) => g.addEventListener("click", () => {
      ui.stage.querySelectorAll(".pb-core").forEach((c) => c.setAttribute("fill", "#bc3f34"));
      g.querySelector(".pb-core").setAttribute("fill", "#b8871e");
      const s = opts.spots[g.dataset.i]; ui.out.innerHTML = `<strong>${escapeHtml(s.label)}</strong><span>${s.note}</span>`;
    }));
  }

  function pbLead(leadAngle, color) {
    const va = 60, proj = Math.cos((leadAngle - va) * Math.PI / 180), up = proj >= 0;
    const cx = 110, cy = 88, R = 54, rad = (a) => a * Math.PI / 180;
    const vEnd = [cx + R * Math.cos(rad(va)), cy + R * Math.sin(rad(va))];
    const lA = [cx - (R + 16) * Math.cos(rad(leadAngle)), cy - (R + 16) * Math.sin(rad(leadAngle))];
    const lB = [cx + (R + 16) * Math.cos(rad(leadAngle)), cy + (R + 16) * Math.sin(rad(leadAngle))];
    const mk = color === "#2e5f8d" ? "pb-b" : "pb-r";
    const defl = up ? "M210 130 H236 L250 86 L264 130 H290" : "M210 86 H236 L250 130 L264 86 H290";
    return pbSvg("0 0 300 176", `
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff2ee" stroke="#bc3f34" stroke-width="2"/>
      <line x1="${lA[0]}" y1="${lA[1]}" x2="${lB[0]}" y2="${lB[1]}" stroke="${color}" stroke-width="3" marker-end="url(#${mk})"/>
      <line x1="${cx}" y1="${cy}" x2="${vEnd[0]}" y2="${vEnd[1]}" stroke="#182033" stroke-width="4" marker-end="url(#pb-d)"/>
      <text x="${cx - 30}" y="${cy - 6}" font-size="10" font-weight="900">QRS 向量</text>
      <rect x="200" y="60" width="96" height="92" rx="8" fill="#fffdf7" stroke="#c9bea8"/><path d="${defl}" fill="none" stroke="#bc3f34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="214" y="74" font-size="10" font-weight="900">此導程波形</text>`);
  }
  function pbProj(toward) {
    const base = toward ? 96 : 64;
    const spike = toward ? "M40 96 H120 L150 40 L180 96 H264" : "M40 64 H120 L150 120 L180 64 H264";
    const arr = toward ? "M92 132 H148" : "M208 132 H152";
    return pbSvg("0 0 300 160", `
      <line x1="40" y1="${base}" x2="264" y2="${base}" stroke="#c9bea8" stroke-width="1.5"/>
      <line x1="150" y1="22" x2="150" y2="140" stroke="#2e5f8d" stroke-width="2" stroke-dasharray="4 4"/><text x="156" y="34" font-size="10" font-weight="900" fill="#2e5f8d">導程正極側</text>
      <path d="${arr}" stroke="#182033" stroke-width="4" marker-end="url(#pb-d)"/><text x="96" y="150" font-size="10" font-weight="900">去極化方向</text>
      <path d="${spike}" fill="none" stroke="#bc3f34" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
  }
  function pbCycle(hi) {
    const ev = [[70, 118, "MC"], [118, 40, "AO"], [170, 120, "AC"], [220, 120, "MO"]];
    const dots = ev.map((e, i) => `<circle cx="${e[0]}" cy="${e[1]}" r="${hi === i ? 8 : 5}" fill="${hi === i ? "#b8871e" : "#bc3f34"}" stroke="#fffdf7" stroke-width="2"/><text x="${e[0] - 8}" y="${e[1] - 10}" font-size="9" font-weight="900">${e[2]}</text>`).join("");
    let region = "";
    if (hi === 4) region = `<rect x="70" y="20" width="100" height="110" fill="#bc3f3418"/><text x="96" y="138" font-size="10" font-weight="900" fill="#bc3f34">systole</text>`;
    if (hi === 5) region = `<rect x="170" y="20" width="116" height="110" fill="#2e5f8d18"/><text x="200" y="138" font-size="10" font-weight="900" fill="#2e5f8d">diastole</text>`;
    return pbSvg("0 0 300 150", `<rect x="10" y="10" width="280" height="120" rx="8" fill="#fffdf7" stroke="#c9bea8"/>${region}<path d="M24 118 C70 118 70 40 118 40 C168 40 170 120 220 120 C262 120 276 70 286 64" fill="none" stroke="#bc3f34" stroke-width="3"/><text x="16" y="24" font-size="9" font-weight="800" fill="#9aa3ad">LV 壓</text>${dots}`);
  }
  function pbVol(vol, dir) {
    const h = vol / 160 * 116, y = 150 - h;
    const arr = dir === "up" ? `<path d="M150 120 V58" stroke="#bc3f34" stroke-width="4" marker-end="url(#pb-r)"/>` : `<path d="M150 58 V120" stroke="#2e5f8d" stroke-width="4" marker-end="url(#pb-b)"/>`;
    return pbSvg("0 0 300 184", `<line x1="20" y1="150" x2="280" y2="150" stroke="#182033" stroke-width="2"/><rect x="60" y="${y}" width="70" height="${h}" fill="#d4604f55" stroke="#bc3f34" stroke-width="2"/><text x="62" y="166" font-size="10" font-weight="900">心室體積 ${vol}</text>${arr}<text x="158" y="96" font-size="11" font-weight="900">壓力 ${dir === "up" ? "↑" : "↓"}</text>`);
  }
  function pbSound(w) {
    const marks = [["S1", 70, "#bc3f34"], ["S2", 170, "#bc3f34"], ["S3", 210, "#2e5f8d"], ["S4", 44, "#b8871e"]];
    const m = marks[w];
    return pbSvg("0 0 300 130", `<rect x="70" y="58" width="100" height="40" fill="#bc3f3412"/><text x="92" y="120" font-size="10" font-weight="900">systole</text><rect x="170" y="58" width="116" height="40" fill="#2e5f8d12"/><text x="202" y="120" font-size="10" font-weight="900">diastole</text><line x1="24" y1="78" x2="286" y2="78" stroke="#182033" stroke-width="2"/><line x1="${m[1]}" y1="40" x2="${m[1]}" y2="98" stroke="${m[2]}" stroke-width="3"/><circle cx="${m[1]}" cy="40" r="11" fill="${m[2]}" stroke="#fffdf7" stroke-width="2"/><text x="${m[1] - 9}" y="32" font-size="11" font-weight="900">${m[0]}</text>`);
  }
  function pbPV(edv, esv, pTop, extra) {
    const vx = (v) => 70 + (v / 160) * 308, py = (p) => 150 - (p / 140) * 116;
    const x0 = vx(esv), x1 = vx(edv), yb = py(8), yt = py(pTop);
    return pbSvg("0 0 400 185", `<line x1="70" y1="150" x2="392" y2="150" stroke="#182033" stroke-width="2"/><line x1="70" y1="28" x2="70" y2="150" stroke="#182033" stroke-width="2"/><text x="50" y="26" font-size="10" font-weight="900">P</text><text x="384" y="166" font-size="10" font-weight="900">V</text><polygon points="${x0},${yb} ${x1},${yb} ${x1},${yt} ${x0},${yt}" fill="#bc3f3418" stroke="#bc3f34" stroke-width="3" stroke-linejoin="round"/>${extra || ""}<line x1="${x0}" y1="${yb}" x2="${x0}" y2="162" stroke="#2e5f8d" stroke-width="1.4" stroke-dasharray="3 3"/><text x="${x0 - 12}" y="178" font-size="9" font-weight="800" fill="#2e5f8d">ESV</text><line x1="${x1}" y1="${yb}" x2="${x1}" y2="162" stroke="#23694f" stroke-width="1.4" stroke-dasharray="3 3"/><text x="${x1 - 12}" y="178" font-size="9" font-weight="800" fill="#23694f">EDV</text><text x="${(x0 + x1) / 2 - 16}" y="${yt - 8}" font-size="11" font-weight="900" fill="#bc3f34">SV=${edv - esv}</text>`);
  }
  function pbPV2(e0, s0, p0, e1, s1, p1) {
    const vx = (v) => 70 + (v / 160) * 308, py = (p) => 150 - (p / 140) * 116;
    const box = (e, s, p, col, dash) => { const x0 = vx(s), x1 = vx(e), yb = py(8), yt = py(p); return `<polygon points="${x0},${yb} ${x1},${yb} ${x1},${yt} ${x0},${yt}" fill="none" stroke="${col}" stroke-width="3" ${dash ? 'stroke-dasharray="6 5"' : ""} stroke-linejoin="round"/>`; };
    return pbSvg("0 0 400 178", `<line x1="70" y1="150" x2="392" y2="150" stroke="#182033" stroke-width="2"/><line x1="70" y1="28" x2="70" y2="150" stroke="#182033" stroke-width="2"/><text x="50" y="26" font-size="10" font-weight="900">P</text><text x="384" y="166" font-size="10" font-weight="900">V</text>${box(e0, s0, p0, "#9aa3ad", true)}${box(e1, s1, p1, "#bc3f34", false)}<text x="120" y="174" font-size="9" font-weight="800" fill="#9aa3ad">灰=原本</text><text x="220" y="174" font-size="9" font-weight="800" fill="#bc3f34">紅=改變後</text>`);
  }
  function pbLoad(t) {
    if (t === "pre") return pbPV2(120, 50, 118, 142, 50, 120);
    if (t === "after") return pbPV2(120, 50, 118, 120, 78, 134);
    return pbPV2(120, 50, 118, 120, 36, 126);
  }
  function pbPVphase(i) {
    const vx = (v) => 70 + (v / 160) * 308, py = (p) => 150 - (p / 140) * 116;
    const x0 = vx(50), x1 = vx(120), yb = py(8), yt = py(118);
    const edges = [
      `<path d="M${x0} ${yb} H${x1}" stroke="#23694f" stroke-width="5" marker-end="url(#pb-d)"/>`,
      `<path d="M${x1} ${yb} V${yt}" stroke="#bc3f34" stroke-width="5" marker-end="url(#pb-d)"/>`,
      `<path d="M${x1} ${yt} H${x0}" stroke="#bc3f34" stroke-width="5" marker-end="url(#pb-d)"/>`,
      `<path d="M${x0} ${yt} V${yb}" stroke="#2e5f8d" stroke-width="5" marker-end="url(#pb-d)"/>`];
    return pbSvg("0 0 400 175", `<line x1="70" y1="150" x2="392" y2="150" stroke="#182033" stroke-width="2"/><line x1="70" y1="28" x2="70" y2="150" stroke="#182033" stroke-width="2"/><text x="50" y="26" font-size="10" font-weight="900">P</text><text x="384" y="166" font-size="10" font-weight="900">V</text><polygon points="${x0},${yb} ${x1},${yb} ${x1},${yt} ${x0},${yt}" fill="#bc3f340e" stroke="#bc3f34" stroke-width="2"/>${edges[i]}`);
  }

  const cardioBlocks = [
    [
      (n) => pbHotspots(n, { title: "點四個腔室看它的工作", intro: "右心走肺循環、左心走全身。", viewBox: "0 0 300 355", base: renderHeartAnatomySvg({}), spots: [
        { x: 112, y: 158, label: "右心房 RA", note: "收全身靜脈血（SVC/IVC），再送進右心室。" },
        { x: 118, y: 250, label: "右心室 RV", note: "把缺氧血打到肺動脈，進入肺循環。" },
        { x: 188, y: 160, label: "左心房 LA", note: "收肺靜脈含氧血，送進左心室。" },
        { x: 190, y: 250, label: "左心室 LV", note: "打到主動脈供應全身；壁最厚以對抗高壓。" }] }),
      (n) => pbTabs(n, { title: "房室瓣：壓力差決定開關", intro: "三尖瓣(右)、二尖瓣(左)。", tabs: [
        { label: "舒張期 · 瓣開", svg: pbHeart({ focus: "avValves", showFlow: true }), note: "心房壓 > 心室壓 → 房室瓣<b>開</b>，血由心房灌入心室。" },
        { label: "收縮期 · 瓣關", svg: pbHeart({ focus: "avValves" }), note: "心室壓 > 心房壓 → 房室瓣<b>關</b>，產生 S1，避免血回流心房。" }] }),
      (n) => pbTabs(n, { title: "半月瓣：心室與動脈之間的門", intro: "主動脈瓣、肺動脈瓣。", tabs: [
        { label: "射血期 · 瓣開", svg: pbHeart({ focus: "semilunarValves", showFlow: true }), note: "心室壓 > 動脈壓 → 半月瓣<b>開</b>，血射入主動脈／肺動脈。" },
        { label: "舒張期 · 瓣關", svg: pbHeart({ focus: "semilunarValves" }), note: "動脈壓 > 心室壓 → 半月瓣<b>關</b>，產生 S2。" }] }),
      (n) => pbSlider(n, { title: "拖左心室壓，看哪個瓣會開", intro: "設左心房壓≈10、主動脈壓≈80 mmHg。", sliders: [{ key: "lvp", label: "左心室壓 (mmHg)", min: 0, max: 130, value: 20 }], render: ({ lvp }) => {
        const LA = 10, AO = 80, mv = LA > lvp, av = lvp > AO, h = (p) => p / 130 * 116, y = (p) => 150 - h(p);
        const svg = pbSvg("0 0 300 184", `<line x1="20" y1="150" x2="290" y2="150" stroke="#182033" stroke-width="2"/><rect x="40" y="${y(LA)}" width="46" height="${h(LA)}" fill="#86ccea" stroke="#2e5f8d" stroke-width="2"/><text x="46" y="166" font-size="10" font-weight="900">LA ${LA}</text><rect x="128" y="${y(lvp)}" width="46" height="${h(lvp)}" fill="#d4604f" stroke="#bc3f34" stroke-width="2"/><text x="128" y="166" font-size="10" font-weight="900">LV ${lvp}</text><rect x="216" y="${y(AO)}" width="46" height="${h(AO)}" fill="#c5413a" stroke="#bc3f34" stroke-width="2"/><text x="216" y="166" font-size="10" font-weight="900">AO ${AO}</text><circle cx="107" cy="36" r="12" fill="${mv ? "#23694f" : "#9aa3ad"}" stroke="#fffdf7" stroke-width="2"/><text x="96" y="24" font-size="9" font-weight="900">Mitral</text><circle cx="195" cy="36" r="12" fill="${av ? "#23694f" : "#9aa3ad"}" stroke="#fffdf7" stroke-width="2"/><text x="182" y="24" font-size="9" font-weight="900">Aortic</text>`);
        return { svg, note: `二尖瓣：<b>${mv ? "開" : "關"}</b>（LA ${LA} ${mv ? ">" : "≤"} LV ${lvp}）　主動脈瓣：<b>${av ? "開" : "關"}</b>（LV ${lvp} ${av ? ">" : "≤"} AO ${AO}）。瓣膜只看壓差。` };
      } }),
    ],
    [
      (n) => pbTabs(n, { title: "工作心肌 vs 節律傳導系統", tabs: [
        { label: "工作心肌", svg: pbHeart({ focus: "workingMyocardium" }), note: "心房肌＋心室肌，靠 gap junction 同步<b>收縮做工</b>。" },
        { label: "節律 / 傳導", svg: pbHeart({ showConduction: true, focus: "saNode" }), note: "SA→AV→His→束支→Purkinje，<b>產生並傳遞節律</b>。" }] }),
      (n) => pbStepper(n, { title: "傳導順序：點步驟看訊號走到哪", steps: [
        { label: "SA", svg: pbHeart({ showConduction: true, focus: "saNode" }), note: "SA node 自發起搏，正常節律起點。" },
        { label: "心房", svg: pbHeart({ showConduction: true, focus: "avNode" }), note: "訊號傳遍心房 → 對應 ECG 的 P 波。" },
        { label: "AV", svg: pbHeart({ showConduction: true, focus: "avDelay" }), note: "AV node 故意延遲（PR interval），讓心房先收縮填充心室。" },
        { label: "His", svg: pbHeart({ showConduction: true, focus: "hisBundle" }), note: "His 束沿室間隔下傳。" },
        { label: "束支", svg: pbHeart({ showConduction: true, focus: "bundleBranches" }), note: "左右束支把訊號送向兩側心室。" },
        { label: "Purkinje", svg: pbHeart({ showConduction: true, focus: "purkinje" }), note: "Purkinje 讓心室幾乎同步去極化 → QRS 窄。" }] }),
      (n) => pbSlider(n, { title: "拖 AV 延遲，看房室收縮時間差", intro: "延遲＝ECG 的 PR interval。", sliders: [{ key: "d", label: "AV 延遲 (ms)", min: 40, max: 320, value: 160 }], render: ({ d }) => {
        const vxp = 90 + (d / 320) * 150;
        const svg = pbSvg("0 0 300 150", `<line x1="40" y1="60" x2="290" y2="60" stroke="#182033" stroke-width="1.5"/><line x1="40" y1="120" x2="290" y2="120" stroke="#182033" stroke-width="1.5"/><text x="6" y="46" font-size="10" font-weight="900">心房</text><text x="6" y="108" font-size="10" font-weight="900">心室</text><path d="M70 60 l0 -26 6 26" fill="none" stroke="#2e5f8d" stroke-width="3"/><path d="M${vxp} 120 l0 -28 6 28" fill="none" stroke="#bc3f34" stroke-width="3"/><line x1="73" y1="64" x2="${vxp + 3}" y2="116" stroke="#b8871e" stroke-width="2" stroke-dasharray="4 4"/><text x="120" y="92" font-size="10" font-weight="900" fill="#b8871e">PR≈${d} ms</text>`);
        return { svg, note: `心房先收縮，心室延遲 ${d} ms 後才收縮。${d > 200 ? "<b>PR 過長</b> → 提示房室傳導阻滯(AV block)。" : "PR 正常約 120–200 ms。"}` };
      } }),
      (n) => pbTabs(n, { title: "Pre-excitation：訊號繞過 AV 延遲", tabs: [
        { label: "正常", svg: pbEcg("M14 72 H44 C52 58 62 58 70 72 H100 L112 72 L122 96 L134 30 L144 92 L154 72 H192 C204 56 218 56 230 72 H292"), note: "PR 正常、無 delta wave。" },
        { label: "WPW", svg: pbEcg("M14 72 H40 C48 58 58 58 66 72 L86 64 L122 96 L134 30 L144 92 L154 72 H192 C204 56 218 56 230 72 H292", "<path d='M66 72 L86 64' stroke='#b8871e' stroke-width='4'/><text x='66' y='58' font-size='10' font-weight='900' fill='#b8871e'>delta</text>"), note: "<b>PR 變短 + delta wave</b>：有旁路(bypass)提早激動心室。" },
        { label: "LGL", svg: pbEcg("M14 72 H36 C44 58 54 58 62 72 H80 L92 72 L102 96 L114 30 L124 92 L134 72 H192 C204 56 218 56 230 72 H292"), note: "<b>PR 變短、無 delta wave</b>。重點是 no normal AV delay。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "導程＝看心臟電向量的角度", intro: "平均 QRS 向量約朝左下，投影到不同導程就高低不同。", tabs: [
        { label: "Lead II", svg: pbLead(60, "#bc3f34"), note: "正極在左下，和向量方向接近 → QRS <b>明顯向上</b>。" },
        { label: "aVR", svg: pbLead(-150, "#bc3f34"), note: "正極在右上，和向量相反 → QRS 通常<b>向下</b>。" },
        { label: "V1", svg: pbLead(120, "#2e5f8d"), note: "靠右前，心室除極多遠離 → 多為<b>負向 (rS)</b>。" },
        { label: "V6", svg: pbLead(8, "#2e5f8d"), note: "靠左側，向量朝向它 → 多為<b>正向</b>。" }] }),
      (n) => pbStepper(n, { title: "P、QRS、T 對應什麼電活動", steps: [
        { label: "P", svg: pbHeartEcg("avNode"), note: "心房去極化 → <b>P 波</b>。" },
        { label: "QRS", svg: pbHeartEcg("purkinje"), note: "心室去極化（His-Purkinje 快速同步）→ <b>窄 QRS</b>。" },
        { label: "T", svg: pbHeartEcg("tWave"), note: "心室再極化 → <b>T 波</b>；方向看導程與電荷移動。" }] }),
      (n) => pbTabs(n, { title: "波形方向＝向量在導程上的投影", tabs: [
        { label: "電流朝向導程", svg: pbProj(true), note: "去極化朝<b>正極</b> → 波形<b>向上</b>。" },
        { label: "電流離開導程", svg: pbProj(false), note: "去極化朝<b>負極</b> → 波形<b>向下</b>。" }] }),
      (n) => pbTabs(n, { title: "常見異常：切換看波形怎麼變", tabs: [
        { label: "正常", svg: pbEcg("M14 72 H44 C52 58 62 58 70 72 H100 L112 72 L122 96 L134 30 L144 92 L154 72 H192 C204 56 218 56 230 72 H292"), note: "P-QRS-T 規律，PR 正常。" },
        { label: "一度 AV block", svg: pbEcg("M14 72 H44 C52 58 62 58 70 72 H140 L152 72 L162 96 L174 30 L184 92 L194 72 H236 C246 58 258 58 268 72 H292"), note: "<b>PR 明顯變長</b>（AV 傳導太慢）。" },
        { label: "WPW", svg: pbEcg("M14 72 H40 C48 58 58 58 66 72 L86 64 L122 96 L134 30 L144 92 L154 72 H192 C204 56 218 56 230 72 H292", "<path d='M66 72 L86 64' stroke='#b8871e' stroke-width='4'/>"), note: "<b>PR 短 + delta wave</b>（旁路提早激動）。" },
        { label: "心房顫動", svg: pbEcg("M14 78 q6 -8 12 0 t12 0 t12 0 t12 0 H96 L106 100 L116 36 L126 96 L136 78 H210 L220 98 L230 40 L240 94 L250 78 H292"), note: "<b>無清楚 P 波</b>、基線顫動，RR <b>不規則</b>。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "四個瓣膜事件：點步驟切段", steps: [
        { label: "MC", svg: pbCycle(0), note: "二尖瓣關(MC)：等容收縮開始，LV 壓快速上升。" },
        { label: "AO", svg: pbCycle(1), note: "主動脈瓣開(AO)：射血開始，血離開 LV。" },
        { label: "AC", svg: pbCycle(2), note: "主動脈瓣關(AC)：射血結束，等容舒張開始。" },
        { label: "MO", svg: pbCycle(3), note: "二尖瓣開(MO)：心室填充開始，回到 EDV。" }] }),
      (n) => pbTabs(n, { title: "等容積期：體積不變、只有壓力動", tabs: [
        { label: "等容收縮", svg: pbVol(120, "up"), note: "兩瓣<b>都關</b> → 體積不變(高點)，壓力快速<b>升</b>。" },
        { label: "射血", svg: pbVol(70, "down"), note: "主動脈瓣開 → 體積<b>下降</b>(EDV→ESV)。" },
        { label: "等容舒張", svg: pbVol(50, "down"), note: "兩瓣<b>都關</b> → 體積不變(低點)，壓力快速<b>降</b>。" },
        { label: "填充", svg: pbVol(120, "up"), note: "二尖瓣開 → 體積<b>上升</b>回 EDV。" }] }),
      (n) => pbSlider(n, { title: "拖 EDV / ESV，算 SV 與 EF", sliders: [{ key: "edv", label: "EDV (mL)", min: 90, max: 160, value: 120 }, { key: "esv", label: "ESV (mL)", min: 30, max: 100, value: 50 }], render: ({ edv, esv }) => {
        const sv = Math.max(0, edv - esv), ef = Math.round(sv / edv * 100);
        const bar = (x, v, c, lab) => `<rect x="${x}" y="${150 - v}" width="50" height="${v}" fill="${c}" stroke="#182033" stroke-width="1.5"/><text x="${x}" y="166" font-size="10" font-weight="900">${lab}</text>`;
        const svg = pbSvg("0 0 300 184", `<line x1="20" y1="150" x2="280" y2="150" stroke="#182033" stroke-width="2"/>${bar(40, edv, "#23694f44", "EDV " + edv)}${bar(120, esv, "#2e5f8d44", "ESV " + esv)}${bar(210, sv, "#bc3f3444", "SV " + sv)}`);
        return { svg, note: `SV = EDV − ESV = ${edv} − ${esv} = <b>${sv} mL</b>；射出分率 EF = SV/EDV ≈ <b>${ef}%</b>。` };
      } }),
      (n) => pbTabs(n, { title: "用瓣膜區間定義收縮 / 舒張", tabs: [
        { label: "Systole 收縮", svg: pbCycle(4), note: "MC → AC 之間：心室收縮（等容收縮＋射血）。" },
        { label: "Diastole 舒張", svg: pbCycle(5), note: "AC → MC 之間：心室舒張（等容舒張＋填充），時間較長。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "S1、S2 落在心動週期哪裡", steps: [
        { label: "S1 (lub)", svg: pbSound(0), note: "S1：房室瓣(二尖/三尖)關閉，<b>收縮期開始</b>。" },
        { label: "S2 (dub)", svg: pbSound(1), note: "S2：半月瓣(主動脈/肺動脈)關閉，<b>收縮期結束</b>。" }] }),
      (n) => pbTabs(n, { title: "S3、S4 的位置與意義", tabs: [
        { label: "S3", svg: pbSound(2), note: "S3：<b>舒張早期</b>快速填充，常見容量負荷↑/心衰。" },
        { label: "S4", svg: pbSound(3), note: "S4：<b>舒張末期</b>心房收縮撞上僵硬心室，常見肥厚/順應性下降。" }] }),
      (n) => pbSlider(n, { title: "CO = HR × SV：拖兩個滑桿", sliders: [{ key: "hr", label: "心率 HR (bpm)", min: 40, max: 180, value: 70 }, { key: "sv", label: "每搏量 SV (mL)", min: 40, max: 120, value: 70 }], render: ({ hr, sv }) => {
        const co = (hr * sv / 1000).toFixed(1);
        const svg = pbSvg("0 0 300 150", `<rect x="20" y="40" width="80" height="60" rx="10" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="2"/><text x="34" y="76" font-size="13" font-weight="900">HR ${hr}</text><text x="112" y="78" font-size="20" font-weight="900">×</text><rect x="134" y="40" width="84" height="60" rx="10" fill="#b8871e22" stroke="#b8871e" stroke-width="2"/><text x="148" y="76" font-size="13" font-weight="900">SV ${sv}</text><text x="226" y="78" font-size="20" font-weight="900">=</text><rect x="244" y="36" width="52" height="68" rx="10" fill="#bc3f3422" stroke="#bc3f34" stroke-width="2"/><text x="250" y="72" font-size="13" font-weight="900">${co}</text><text x="248" y="120" font-size="10" font-weight="900">L/min</text>`);
        return { svg, note: `心輸出量 CO = ${hr} × ${sv} = <b>${co} L/min</b>。` };
      } }),
      (n) => pbTabs(n, { title: "用三個負荷推藥理情境", tabs: [
        { label: "Preload ↑", svg: pbLoad("pre"), note: "前負荷↑(靜脈回流↑) → EDV↑ → 依 Frank-Starling，<b>SV↑、CO↑</b>。" },
        { label: "Afterload ↑", svg: pbLoad("after"), note: "後負荷↑(動脈壓↑) → 射血變難 → ESV↑ → <b>SV↓</b>。" },
        { label: "Contractility ↑", svg: pbLoad("contr"), note: "收縮力↑ → ESV↓ → <b>SV↑、CO↑</b>（與前負荷無關）。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "繞 PV loop 一圈：面積＝心臟做功", steps: [
        { label: "填充", svg: pbPVphase(0), note: "二尖瓣開，體積 ESV→EDV（底邊，向右）。" },
        { label: "等容收縮", svg: pbPVphase(1), note: "兩瓣關，壓力上升（右邊，向上）。" },
        { label: "射血", svg: pbPVphase(2), note: "主動脈瓣開，體積 EDV→ESV（頂邊，向左）。" },
        { label: "等容舒張", svg: pbPVphase(3), note: "兩瓣關，壓力下降（左邊，向下）。loop 圍出的<b>面積＝外做功</b>。" }] }),
      (n) => pbSlider(n, { title: "拖前負荷(EDV)，看 loop 變化", sliders: [{ key: "edv", label: "前負荷 EDV (mL)", min: 100, max: 160, value: 120 }], render: ({ edv }) => ({ svg: pbPV(edv, 50, 118), note: `前負荷↑ → EDV 右移、loop 變寬 → <b>SV = ${edv - 50} mL ↑</b>（Frank-Starling）。` }) }),
      (n) => pbSlider(n, { title: "拖後負荷，看 ESV 與 SV", sliders: [{ key: "af", label: "後負荷 (主動脈壓 mmHg)", min: 80, max: 150, value: 90 }], render: ({ af }) => { const esv = Math.round(50 + (af - 90) * 0.6); return { svg: pbPV(120, esv, Math.round(af * 0.95)), note: `後負荷↑ → 射血變難、ESV 右移 → <b>SV = ${120 - esv} mL ↓</b>。` }; } }),
      (n) => pbSlider(n, { title: "拖收縮力，看 ESV 與 SV", sliders: [{ key: "c", label: "收縮力 (相對 1–5)", min: 1, max: 5, value: 3 }], render: ({ c }) => { const esv = Math.round(74 - c * 8); return { svg: pbPV(120, esv, 108 + c * 4), note: `收縮力↑ → ESV 左移(更會排空) → <b>SV = ${120 - esv} mL ↑</b>。` }; } }),
    ],
  ];

  function pbChain(boxes, hi) {
    const n = boxes.length, w = Math.min(80, 360 / n - 6), gap = (380 - w * n) / (n + 1);
    let x = 10 + gap; const parts = [];
    boxes.forEach((b, i) => {
      const on = i <= hi;
      parts.push(`<rect x="${x}" y="48" width="${w}" height="58" rx="10" fill="${i === hi ? b.color + "55" : (on ? b.color + "20" : "#fff")}" stroke="${b.color}" stroke-width="${i === hi ? 3.5 : 2}"/>`);
      parts.push(`<text x="${x + w / 2}" y="82" font-size="11" font-weight="900" text-anchor="middle">${b.label}</text>`);
      if (i < n - 1) parts.push(`<path d="M${x + w + 1} 77 H${x + w + gap - 1}" stroke="#182033" stroke-width="2.5" marker-end="url(#pb-d)"/>`);
      x += w + gap;
    });
    return pbSvg("0 0 400 150", parts.join(""));
  }
  function pbText(text, color) {
    const lines = String(text).split("\n"), y0 = lines.length === 1 ? 66 : 50;
    return pbSvg("0 0 300 120", `<rect x="14" y="14" width="272" height="92" rx="12" fill="${color}14" stroke="${color}" stroke-width="2.5"/>` + lines.map((l, i) => `<text x="150" y="${y0 + i * 26}" font-size="15" font-weight="900" text-anchor="middle" fill="${color}">${l}</text>`).join(""));
  }
  function pbFraction(frac, label) {
    return pbSvg("0 0 300 120", `<rect x="20" y="46" width="260" height="32" rx="8" fill="#fff" stroke="#182033" stroke-width="2"/><rect x="20" y="46" width="${260 * frac}" height="32" rx="8" fill="#bc3f3455" stroke="#bc3f34" stroke-width="2"/><text x="150" y="34" font-size="12" font-weight="900" text-anchor="middle">${label}</text><text x="150" y="100" font-size="11" font-weight="900" text-anchor="middle">${Math.round(frac * 100)}%</text>`);
  }
  function pbUrine(phase) {
    const hi = (c) => phase === c;
    return pbSvg("0 0 300 150", `<rect x="20" y="20" width="260" height="18" rx="8" fill="#bc3f3414" stroke="#bc3f34" stroke-width="1.5"/><text x="26" y="33" font-size="9" font-weight="800" fill="#bc3f34">血液</text><circle cx="44" cy="100" r="20" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="2.5"/><rect x="64" y="92" width="200" height="20" rx="9" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="2.5"/><text x="248" y="86" font-size="9" font-weight="800" fill="#2e5f8d">小管</text><path d="M96 40 V88" stroke="#2e5f8d" stroke-width="${hi(0) ? 5 : 3}" marker-end="url(#pb-b)"/><text x="78" y="60" font-size="9" font-weight="800" fill="#2e5f8d">濾過</text><path d="M150 92 V42" stroke="#23694f" stroke-width="${hi(1) ? 5 : 3}" marker-end="url(#pb-d)" opacity="${hi(1) ? 1 : 0.4}"/><text x="130" y="60" font-size="9" font-weight="800" fill="#23694f">回收</text><path d="M204 40 V90" stroke="#b8871e" stroke-width="${hi(2) ? 5 : 3}" marker-end="url(#pb-d)" opacity="${hi(2) ? 1 : 0.4}"/><text x="210" y="60" font-size="9" font-weight="800" fill="#b8871e">分泌</text><path d="M264 102 H292" stroke="#182033" stroke-width="${hi(3) ? 5 : 3}" marker-end="url(#pb-d)"/><text x="266" y="128" font-size="9" font-weight="800">尿</text>`);
  }
  function pbBarrier(mode) {
    const hi = (l) => mode === l;
    const layer = (x, c, lab, on) => `<rect x="${x}" y="30" width="22" height="104" rx="6" fill="${on ? c + "55" : c + "18"}" stroke="${c}" stroke-width="${on ? 3.5 : 2}"/><text x="${x + 11}" y="150" font-size="8.5" font-weight="800" text-anchor="middle" fill="${c}">${lab}</text>`;
    const leak = mode === 4;
    return pbSvg("0 0 300 164", `<text x="46" y="22" font-size="9" font-weight="800" fill="#bc3f34">血液</text><text x="244" y="22" font-size="9" font-weight="800" fill="#2e5f8d">尿液側</text>${layer(120, "#bc3f34", "內皮", hi(0))}${layer(150, "#23694f", "基底膜", hi(1))}${layer(180, "#b8871e", "足細胞", hi(2))}<circle cx="60" cy="66" r="10" fill="#bc3f34"/><text x="44" y="94" font-size="8" font-weight="800">蛋白</text><circle cx="60" cy="108" r="5" fill="#2e5f8d"/><path d="M70 108 H248" stroke="#2e5f8d" stroke-width="2" stroke-dasharray="3 3" marker-end="url(#pb-b)"/><text x="232" y="122" font-size="8" font-weight="800">小分子過</text>${leak ? `<path d="M70 66 H248" stroke="#bc3f34" stroke-width="2.5" marker-end="url(#pb-r)"/><text x="218" y="58" font-size="8.5" font-weight="900" fill="#bc3f34">蛋白漏!</text>` : `<path d="M70 66 H196" stroke="#bc3f34" stroke-width="2.5"/><line x1="200" y1="58" x2="210" y2="74" stroke="#bc3f34" stroke-width="3"/><line x1="210" y1="58" x2="200" y2="74" stroke="#bc3f34" stroke-width="3"/>`}`);
  }
  function pbAldo() {
    return pbSvg("0 0 300 150", `<rect x="60" y="54" width="180" height="44" rx="10" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="2.5"/><text x="150" y="46" font-size="10" font-weight="900" text-anchor="middle">遠端小管/集尿管</text><path d="M150 54 V22" stroke="#23694f" stroke-width="4" marker-end="url(#pb-d)"/><text x="156" y="36" font-size="10" font-weight="900" fill="#23694f">Na⁺ 回收</text><path d="M108 98 V128" stroke="#b8871e" stroke-width="4" marker-end="url(#pb-d)"/><text x="58" y="124" font-size="10" font-weight="900" fill="#b8871e">K⁺ 分泌</text><path d="M200 98 V128" stroke="#2e5f8d" stroke-width="4" marker-end="url(#pb-d)"/><text x="196" y="124" font-size="10" font-weight="900" fill="#2e5f8d">水跟Na</text>`);
  }
  function pbNeph(long, vessel) {
    const lb = long ? 158 : 110;
    return pbSvg("0 0 300 185", `<rect x="20" y="20" width="260" height="62" fill="#2e5f8d12"/><text x="24" y="34" font-size="9" font-weight="800" fill="#2e5f8d">cortex 皮質</text><rect x="20" y="82" width="260" height="94" fill="#b8871e12"/><text x="24" y="96" font-size="9" font-weight="800" fill="#b8871e">medulla 髓質</text><circle cx="70" cy="50" r="16" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="2.5"/><text x="52" y="42" font-size="9" font-weight="800">腎絲球</text><path d="M86 50 C124 50 124 ${lb} 144 ${lb} C164 ${lb} 164 62 204 62" fill="none" stroke="#2e5f8d" stroke-width="5"/>${vessel === "vasa" ? `<path d="M156 86 V170 M174 86 V170" stroke="#bc3f34" stroke-width="4"/><text x="178" y="150" font-size="9" font-weight="800" fill="#bc3f34">vasa recta</text>` : `<path d="M214 62 C252 62 252 92 218 96 C252 100 252 72 224 76" fill="none" stroke="#bc3f34" stroke-width="4"/><text x="220" y="54" font-size="9" font-weight="800" fill="#bc3f34">peritubular</text>`}`);
  }

  const URET = [{ label: "腎", color: "#2e5f8d" }, { label: "輸尿管", color: "#2e5f8d" }, { label: "膀胱", color: "#b8871e" }, { label: "尿道", color: "#bc3f34" }];
  const RAASC = [{ label: "Renin", color: "#b8871e" }, { label: "Ang I", color: "#2e5f8d" }, { label: "Ang II", color: "#bc3f34" }, { label: "Aldo", color: "#23694f" }];
  const VITDC = [{ label: "皮膚/食物", color: "#b8871e" }, { label: "肝 25(OH)", color: "#2e5f8d" }, { label: "腎 1,25", color: "#bc3f34" }];
  const urinaryBlocks = [
    [
      (n) => pbStepper(n, { title: "腎元三功能：點步驟看一滴血漿的旅程", steps: [
        { label: "濾過", svg: pbUrine(0), note: "血漿在腎絲球被<b>濾過</b>進 Bowman capsule。" },
        { label: "回收", svg: pbUrine(1), note: "小管把有用的（水、Na⁺、葡萄糖）<b>回收</b>回血液。" },
        { label: "分泌", svg: pbUrine(2), note: "把多餘 / 有毒物質<b>分泌</b>進小管。" },
        { label: "排出", svg: pbUrine(3), note: "剩下的成為<b>尿液</b>排出。" }] }),
      (n) => pbSlider(n, { title: "拖 Na⁺ 回收，看血壓怎麼動", intro: "水會跟著鈉走。", sliders: [{ key: "na", label: "Na⁺ 回收 (相對 1–5)", min: 1, max: 5, value: 3 }], render: ({ na }) => {
        const bp = Math.round(80 + (na - 3) * 9), vol = 30 + na * 9;
        return { svg: pbSvg("0 0 300 150", `<line x1="30" y1="130" x2="270" y2="130" stroke="#182033" stroke-width="2"/><rect x="60" y="${130 - vol}" width="70" height="${vol}" fill="#86ccea" stroke="#2e5f8d" stroke-width="2"/><text x="62" y="146" font-size="10" font-weight="900">血量</text><rect x="178" y="44" width="94" height="58" rx="10" fill="#bc3f3422" stroke="#bc3f34" stroke-width="2.5"/><text x="198" y="72" font-size="15" font-weight="900">${bp}</text><text x="186" y="92" font-size="10" font-weight="900">mmHg</text>`), note: `Na⁺ 回收↑ → 水跟著回收 → 血量↑ → <b>血壓 ≈ ${bp} mmHg</b>。腎臟調 Na 就是在調血壓。` };
      } }),
      (n) => pbTabs(n, { title: "腎臟血流與耗氧為何特別高", tabs: [
        { label: "血流佔比", svg: pbFraction(0.22, "腎血流 ≈ 20–25% 心輸出"), note: "雙腎只佔體重 ~0.5%，卻拿到 <b>~20–25% 心輸出量</b>，因為要大量過濾血漿。" },
        { label: "耗氧", svg: pbFraction(0.5, "主動回收耗氧、髓質敏感"), note: "Na⁺-K⁺ pump 主動回收很耗氧；髓質血流低、對缺氧特別敏感。" }] }),
      (n) => pbTabs(n, { title: "「清除率」中文別被騙", tabs: [
        { label: "❌ 迷思", svg: pbText("以為＝把血液洗乾淨的速度", "#bc3f34"), note: "清除率<b>不是</b>「清潔血液」的意思。" },
        { label: "✓ 正解", svg: pbText("單位時間被某物質\n清空的血漿體積", "#23694f"), note: "Cx＝每分鐘有多少 mL 血漿被某物質「完全清空」的<b>虛擬體積</b>。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "泌尿道：尿液一路往外", steps: [
        { label: "腎臟", svg: pbChain(URET, 0), note: "腎臟<b>形成尿液</b>。" },
        { label: "輸尿管", svg: pbChain(URET, 1), note: "輸尿管把尿往下送到膀胱。" },
        { label: "膀胱", svg: pbChain(URET, 2), note: "膀胱<b>儲存</b>尿液。" },
        { label: "尿道", svg: pbChain(URET, 3), note: "經尿道<b>排出</b>體外。" }] }),
      (n) => pbHotspots(n, { title: "腎臟切面三層", viewBox: "0 0 300 192", base: `<path d="M150 20 C90 30 70 90 70 96 C70 102 90 162 150 172 C158 120 158 72 150 20Z" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="2.5"/><path d="M150 40 C112 50 100 90 100 96 C100 102 112 142 150 152 C156 116 156 76 150 40Z" fill="#b8871e22" stroke="#b8871e" stroke-width="2"/><path d="M150 70 C136 80 132 92 132 96 C132 100 136 112 150 122Z" fill="#fffdf7" stroke="#182033" stroke-width="1.5"/>`, spots: [
        { x: 86, y: 96, label: "皮質 Cortex", note: "外層，含腎絲球與近曲小管。" },
        { x: 116, y: 96, label: "髓質 Medulla", note: "內層，含 loop of Henle 與集尿管，負責濃縮尿液。" },
        { x: 142, y: 100, label: "腎盂 Pelvis", note: "集合尿液送入輸尿管。" }] }),
      (n) => pbTabs(n, { title: "兩種腎元分工不同", tabs: [
        { label: "Cortical", svg: pbNeph(false, "peri"), note: "多數腎元；loop 短、留在皮質，旁邊是 <b>peritubular capillaries</b>。" },
        { label: "Juxtamedullary", svg: pbNeph(true, "vasa"), note: "少數但 loop <b>長、深入髓質</b>，旁邊是 <b>vasa recta</b>，負責建立濃度梯度。" }] }),
      (n) => pbTabs(n, { title: "出球小動脈接到哪？", tabs: [
        { label: "→ Peritubular", svg: pbNeph(false, "peri"), note: "cortical 腎元的 efferent → <b>peritubular capillaries</b>，沿小管回收物質。" },
        { label: "→ Vasa recta", svg: pbNeph(true, "vasa"), note: "juxtamedullary 的 efferent → <b>vasa recta</b>，維持髓質滲透梯度。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "入球 / 出球小動脈夾住腎絲球", viewBox: "0 0 300 170", base: `<circle cx="150" cy="92" r="46" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${128 + (i % 3) * 24}" cy="${74 + Math.floor(i / 3) * 30}" r="11" fill="#fffdf7" stroke="#bc3f34" stroke-width="2"/>`).join("")}<path d="M36 80 C78 76 96 84 104 90" stroke="#2e5f8d" stroke-width="9" marker-end="url(#pb-b)" fill="none"/><path d="M196 92 C222 86 244 82 270 82" stroke="#bc3f34" stroke-width="6" marker-end="url(#pb-r)" fill="none"/>`, spots: [
        { x: 66, y: 80, label: "Afferent 入球小動脈", note: "較粗，血進入腎絲球；擴張 → 腎絲球壓↑ → GFR↑。" },
        { x: 236, y: 84, label: "Efferent 出球小動脈", note: "較細，血離開；收縮 → 腎絲球內壓↑ → GFR↑。" },
        { x: 150, y: 92, label: "腎絲球 tuft", note: "高壓微血管團，是過濾發生的地方。" }] }),
      (n) => pbStepper(n, { title: "濾過膜三層篩子", steps: [
        { label: "內皮", svg: pbBarrier(0), note: "Fenestrated endothelium：擋住血球。" },
        { label: "基底膜", svg: pbBarrier(1), note: "Basement membrane：帶負電，擋大分子與蛋白。" },
        { label: "足細胞", svg: pbBarrier(2), note: "Podocyte slit：最後一道，決定大小篩選。" }] }),
      (n) => pbSlider(n, { title: "拖 mesangial 收縮，看過濾面積", sliders: [{ key: "m", label: "Mesangial 收縮 (1–5)", min: 1, max: 5, value: 2 }], render: ({ m }) => ({ svg: pbFraction((100 - (m - 1) * 16) / 100, "有效過濾面積"), note: `Mesangial cell 收縮↑ → 過濾面積 / Kf↓ → <b>GFR↓</b>。` }) }),
      (n) => pbTabs(n, { title: "蛋白尿＝屏障壞了", tabs: [
        { label: "正常", svg: pbBarrier(3), note: "屏障完整：蛋白留血中，尿中幾乎無蛋白。" },
        { label: "破損 → 蛋白尿", svg: pbBarrier(4), note: "屏障受損 → 蛋白漏進尿 → <b>蛋白尿</b>，提示腎絲球病變。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "JGA 的兩個核心角色", viewBox: "0 0 300 160", base: `<path d="M24 58 C76 54 120 70 152 96" stroke="#2e5f8d" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="150" cy="100" r="22" fill="#23694f22" stroke="#23694f" stroke-width="2.5"/><rect x="58" y="120" width="190" height="20" rx="8" fill="#b8871e18" stroke="#b8871e" stroke-width="2"/>`, spots: [
        { x: 150, y: 130, label: "Macula densa", note: "小管細胞，感測流經的 <b>NaCl</b> 濃度。" },
        { x: 96, y: 64, label: "Granular (JG) cells", note: "入球小動脈壁細胞，<b>分泌 renin</b>。" }] }),
      (n) => pbTabs(n, { title: "Renin 釋放的三大刺激", tabs: [
        { label: "低血壓", svg: pbText("入球壓力 ↓", "#bc3f34"), note: "腎灌流壓↓ → JG cells 直接放 renin。" },
        { label: "低 NaCl", svg: pbText("Macula densa\nNaCl ↓", "#23694f"), note: "流經 NaCl↓ → 訊號 → renin↑。" },
        { label: "交感 β1", svg: pbText("交感神經 β1", "#b8871e"), note: "交感興奮刺激 JG cells β1 受體 → renin↑。" }] }),
      (n) => pbStepper(n, { title: "RAAS 級聯：點步驟", steps: [
        { label: "Renin", svg: pbChain(RAASC, 0), note: "腎放 <b>renin</b>。" },
        { label: "Ang I", svg: pbChain(RAASC, 1), note: "Angiotensinogen → <b>Ang I</b>。" },
        { label: "Ang II", svg: pbChain(RAASC, 2), note: "ACE(肺) 把 Ang I → <b>Ang II</b>：強力收縮血管、升壓。" },
        { label: "Aldo", svg: pbChain(RAASC, 3), note: "Ang II → 腎上腺放 <b>aldosterone</b> → 留鈉排鉀、水跟著。" }] }),
      (n) => pbTabs(n, { title: "Aldosterone：留鈉排鉀", tabs: [
        { label: "作用部位", svg: pbAldo(), note: "遠端小管 / 集尿管：<b>Na⁺ 回收↑、K⁺ 分泌↑</b>，水跟著 Na 回收。" },
        { label: "整體結果", svg: pbText("血量↑ 血壓↑\n血鉀 ↓", "#bc3f34"), note: "原發性醛固酮過多 → <b>高血壓 + 低血鉀</b>。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "Vitamin D 活化要經腎", steps: [
        { label: "來源", svg: pbChain(VITDC, 0), note: "皮膚日照或食物取得 vitamin D。" },
        { label: "肝", svg: pbChain(VITDC, 1), note: "肝臟做 25-OH vitamin D。" },
        { label: "腎", svg: pbChain(VITDC, 2), note: "腎 1α-hydroxylase → <b>活性 1,25(OH)₂D</b>。腎壞 → 活化不足。" }] }),
      (n) => pbTabs(n, { title: "活性 Vitamin D 幫鈣吸收", tabs: [
        { label: "腸道", svg: pbText("腸道 Ca²⁺ 吸收 ↑", "#23694f"), note: "活性 VitD 促進<b>腸道鈣吸收</b>。" },
        { label: "結果", svg: pbText("血鈣 ↑", "#bc3f34"), note: "維持血鈣 → 骨骼 / 神經肌肉正常；缺乏 → 低血鈣、骨病變。" }] }),
      (n) => pbSlider(n, { title: "拖組織氧，看 EPO 與紅血球", sliders: [{ key: "o2", label: "組織氧 (相對 1–5)", min: 1, max: 5, value: 3 }], render: ({ o2 }) => ({ svg: pbFraction((6 - o2) / 5, "EPO 分泌"), note: `組織缺氧↑ → 腎臟 <b>EPO↑</b> → 紅骨髓造紅血球↑。慢性腎病 → EPO 不足 → 貧血。` }) }),
      (n) => pbHotspots(n, { title: "腎上腺皮質分層（GFR）", viewBox: "0 0 300 185", base: `<path d="M150 26 C92 36 78 104 108 146 C150 168 192 150 200 118 C210 86 204 40 150 26Z" fill="#fffdf7" stroke="#b8871e" stroke-width="2.5"/><path d="M150 40 C104 48 92 104 116 140 C150 158 184 142 190 116 C198 84 192 50 150 40Z" fill="#b8871e14"/><path d="M150 56 C120 62 112 104 128 132 C150 146 172 134 176 114 C182 88 178 62 150 56Z" fill="#bc3f3414"/>`, spots: [
        { x: 150, y: 50, label: "Zona glomerulosa", note: "最外層 → <b>aldosterone</b>（接 RAAS、調鈉水）。" },
        { x: 150, y: 96, label: "Zona fasciculata", note: "中層 → cortisol（糖皮質）。" },
        { x: 150, y: 132, label: "Zona reticularis", note: "內層 → 雄性素。口訣 GFR → 鹽 / 糖 / 性。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "GFR 的理想物質：inulin", tabs: [
        { label: "為何理想", svg: pbText("自由過濾\n不回收 · 不分泌", "#23694f"), note: "inulin 完全自由過濾、<b>不回收也不分泌</b> → 清除率＝GFR。" },
        { label: "臨床替代", svg: pbText("creatinine\n（近似）", "#b8871e"), note: "臨床用內生肌酸酐(creatinine)估 GFR，方便但略高估。" }] }),
      (n) => pbSlider(n, { title: "算清除率 Cx = Ux·V / Px", sliders: [{ key: "ux", label: "尿濃度 Ux", min: 10, max: 200, value: 125 }, { key: "v", label: "尿流率 V (mL/min)", min: 1, max: 5, value: 1 }, { key: "px", label: "血漿濃度 Px", min: 1, max: 5, value: 1 }], render: ({ ux, v, px }) => { const cx = Math.round(ux * v / px); return { svg: pbText(`Cx = ${ux}×${v} / ${px}\n= ${cx} mL/min`, "#2e5f8d"), note: `每分鐘被清空的血漿體積 = <b>${cx} mL/min</b>。` }; } }),
      (n) => pbTabs(n, { title: "Cx 和 GFR 比，推淨方向", tabs: [
        { label: "Cx > GFR", svg: pbText("淨分泌", "#bc3f34"), note: "清除比過濾多 → 一定有<b>淨分泌</b>（如 PAH）。" },
        { label: "Cx = GFR", svg: pbText("只過濾", "#23694f"), note: "如 inulin：不回收不分泌。" },
        { label: "Cx < GFR", svg: pbText("淨回收", "#2e5f8d"), note: "清除比過濾少 → 有<b>淨回收</b>（如 glucose ≈ 0）。" }] }),
      (n) => pbTabs(n, { title: "RPF 與 RBF 別搞混", tabs: [
        { label: "RPF", svg: pbText("腎血漿流量\n（只算血漿）", "#2e5f8d"), note: "Renal plasma flow：只算<b>血漿</b>部分。" },
        { label: "RBF", svg: pbText("RBF = RPF / (1−Hct)", "#bc3f34"), note: "Renal blood flow：<b>全血</b>；RBF = RPF ÷ (1 − 血比容)。" }] }),
    ],
  ];

  function pbDir(into) {
    return pbSvg("0 0 300 140", `<rect x="110" y="40" width="80" height="60" rx="12" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="2.5"/><text x="150" y="76" font-size="12" font-weight="900" text-anchor="middle">CNS</text>${into ? `<path d="M30 70 H104" stroke="#bc3f34" stroke-width="5" marker-end="url(#pb-r)"/><text x="34" y="58" font-size="10" font-weight="900" fill="#bc3f34">afferent 入</text>` : `<path d="M196 70 H272" stroke="#23694f" stroke-width="5" marker-end="url(#pb-d)"/><text x="200" y="58" font-size="10" font-weight="900" fill="#23694f">efferent 出</text>`}`);
  }
  function pbNeuronShape(p) {
    const arms = { 1: `<path d="M150 86 V140" stroke="#bc3f34" stroke-width="5"/>`, 2: `<path d="M120 70 L80 40 M180 70 L220 40" stroke="#bc3f34" stroke-width="5"/>`, 3: `<path d="M120 64 L80 36 M150 56 V30 M180 64 L220 36 M150 86 V140" stroke="#bc3f34" stroke-width="5"/>` }[p];
    return pbSvg("0 0 300 160", `<circle cx="150" cy="78" r="26" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>${arms}`);
  }
  function pbMyelin(v) {
    const speed = v * v, beads = v >= 2 ? [60, 110, 160, 210].slice(0, v) : [];
    return pbSvg("0 0 300 130", `<path d="M20 70 H280" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round"/>${beads.map((x) => `<rect x="${x}" y="58" width="30" height="24" rx="10" fill="#b8871eaa" stroke="#b8871e" stroke-width="2"/>`).join("")}<text x="20" y="40" font-size="12" font-weight="900">相對傳導速度 ≈ ${speed}×</text><path d="M20 100 H${Math.min(280, 20 + speed * 10)}" stroke="#bc3f34" stroke-width="6" marker-end="url(#pb-r)"/>`);
  }
  const NEURON = `<circle cx="80" cy="92" r="30" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/><path d="M54 74 C30 50 22 70 36 86 M52 110 C28 132 20 116 36 104 M58 64 C44 38 60 36 66 58" fill="none" stroke="#bc3f34" stroke-width="3" stroke-linecap="round"/><path d="M110 92 H250" stroke="#2e5f8d" stroke-width="6" stroke-linecap="round"/>${[140, 176, 212].map((x) => `<rect x="${x}" y="82" width="24" height="20" rx="9" fill="#b8871eaa"/>`).join("")}<path d="M250 92 C270 76 284 80 296 70 M250 92 C272 108 286 104 296 116" fill="none" stroke="#23694f" stroke-width="3"/>`;
  const BRAIN = `<path d="M60 70 C60 40 110 30 150 40 C200 28 250 48 244 86 C250 120 210 132 170 126 C150 134 120 132 104 122 C70 124 54 100 60 70Z" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="2.5"/><ellipse cx="214" cy="120" rx="34" ry="22" fill="#b8871e18" stroke="#b8871e" stroke-width="2.5"/><rect x="150" y="118" width="20" height="46" rx="8" fill="#bc3f3418" stroke="#bc3f34" stroke-width="2.5"/>`;
  const CNSPNS = `<rect x="40" y="40" width="90" height="110" rx="14" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="2.5"/><text x="58" y="34" font-size="10" font-weight="900" fill="#2e5f8d">CNS</text><path d="M130 70 C180 64 210 70 256 66 M130 120 C180 126 210 120 256 124" stroke="#bc3f34" stroke-width="5" fill="none"/><circle cx="238" cy="66" r="12" fill="#b8871e44" stroke="#b8871e" stroke-width="2.5"/><text x="206" y="40" font-size="10" font-weight="900" fill="#bc3f34">PNS</text>`;
  const cnsBlocks = [
    [
      (n) => pbTabs(n, { title: "可興奮細胞：不只神經", tabs: [
        { label: "神經元", svg: pbText("Neuron ⚡", "#bc3f34"), note: "能產生動作電位、快速傳訊。" },
        { label: "肌肉", svg: pbText("Muscle ⚡", "#23694f"), note: "也能去極化收縮。兩者都是 <b>excitable cells</b>。" }] }),
      (n) => pbStepper(n, { title: "三個基本功能單位", steps: [
        { label: "感覺輸入", svg: pbChain([{ label: "感覺", color: "#bc3f34" }, { label: "整合", color: "#2e5f8d" }, { label: "運動", color: "#23694f" }], 0), note: "<b>Sensory</b>：受器把刺激變訊號傳入。" },
        { label: "中樞整合", svg: pbChain([{ label: "感覺", color: "#bc3f34" }, { label: "整合", color: "#2e5f8d" }, { label: "運動", color: "#23694f" }], 1), note: "<b>Integration</b>：CNS 處理、決策。" },
        { label: "運動輸出", svg: pbChain([{ label: "感覺", color: "#bc3f34" }, { label: "整合", color: "#2e5f8d" }, { label: "運動", color: "#23694f" }], 2), note: "<b>Motor</b>：輸出到肌肉或腺體。" }] }),
      (n) => pbTabs(n, { title: "神經系統為何怕缺氧缺水", tabs: [
        { label: "重量 vs 耗能", svg: pbFraction(0.2, "腦 ~2% 體重，耗 ~20% O₂/糖"), note: "幾乎只靠葡萄糖有氧代謝，能量儲備極少。" },
        { label: "缺氧後果", svg: pbText("數分鐘缺氧\n→ 不可逆損傷", "#bc3f34"), note: "所以對缺氧、缺水(電解質)特別敏感。" }] }),
      (n) => pbTabs(n, { title: "生理學的核心：homeostasis", tabs: [
        { label: "負回饋", svg: pbChain([{ label: "感測", color: "#bc3f34" }, { label: "整合", color: "#2e5f8d" }, { label: "效應", color: "#23694f" }], 2), note: "偵測偏離 → 比對設定點 → 效應器修正，拉回穩定。" },
        { label: "例子", svg: pbText("體溫 / 血壓 / 血糖", "#b8871e"), note: "幾乎所有生理調節都在維持 homeostasis。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "CNS 是腦與脊髓", viewBox: "0 0 300 170", base: CNSPNS, spots: [
        { x: 85, y: 95, label: "CNS", note: "<b>腦 + 脊髓</b>，負責整合。" },
        { x: 198, y: 66, label: "PNS 神經", note: "離開中樞的神經屬 PNS。" },
        { x: 238, y: 66, label: "神經節 ganglion", note: "細胞本體聚在中樞外 → PNS。" }] }),
      (n) => pbTabs(n, { title: "PNS 包含哪些", tabs: [
        { label: "腦神經", svg: pbText("12 對 cranial", "#bc3f34"), note: "從腦發出。" },
        { label: "脊神經", svg: pbText("31 對 spinal", "#2e5f8d"), note: "從脊髓發出。" },
        { label: "節 / 末梢", svg: pbText("ganglia + 末梢", "#b8871e"), note: "胞體與末梢都在中樞外。" }] }),
      (n) => pbTabs(n, { title: "PNS 再分類", tabs: [
        { label: "Somatic", svg: pbText("體運動\n隨意肌", "#bc3f34"), note: "控制骨骼肌、隨意。" },
        { label: "Autonomic", svg: pbText("自主\n內臟 / 腺體", "#2e5f8d"), note: "交感 / 副交感，調內臟。" },
        { label: "Enteric", svg: pbText("腸神經", "#23694f"), note: "腸道自有的神經網。" }] }),
      (n) => pbTabs(n, { title: "訊號方向：afferent / efferent", tabs: [
        { label: "Afferent 傳入", svg: pbDir(true), note: "感覺<b>進</b>中樞（afferent = arrive）。" },
        { label: "Efferent 傳出", svg: pbDir(false), note: "指令<b>出</b>中樞到效應器（efferent = exit）。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "Brain 四大部分", viewBox: "0 0 300 175", base: BRAIN, spots: [
        { x: 120, y: 72, label: "大腦 Cerebrum", note: "高階認知、運動、感覺。" },
        { x: 172, y: 98, label: "間腦 Diencephalon", note: "視丘 / 下視丘，中繼與內分泌調控。" },
        { x: 160, y: 148, label: "腦幹 Brainstem", note: "生命中樞(呼吸/心跳)、腦神經核。" },
        { x: 214, y: 120, label: "小腦 Cerebellum", note: "協調、平衡、動作微調。" }] }),
      (n) => pbTabs(n, { title: "12 對腦神經 (I–XII)", tabs: [
        { label: "感覺為主", svg: pbText("I 嗅 · II 視 · VIII 聽前庭", "#2e5f8d"), note: "純 / 主感覺。" },
        { label: "運動為主", svg: pbText("III IV VI XI XII", "#23694f"), note: "主要運動。" },
        { label: "混合", svg: pbText("V VII IX X", "#b8871e"), note: "混合(含副交感 VII IX X)。" }] }),
      (n) => pbTabs(n, { title: "31 對脊神經", tabs: [
        { label: "分段", svg: pbText("C8 · T12 · L5\nS5 · Co1", "#2e5f8d"), note: "頸8、胸12、腰5、薦5、尾1。" },
        { label: "合計", svg: pbText("= 31 對", "#bc3f34"), note: "8 + 12 + 5 + 5 + 1 = 31。" }] }),
      (n) => pbTabs(n, { title: "神經節 ganglion 在 PNS", tabs: [
        { label: "定義", svg: pbText("細胞本體\n聚在中樞外", "#b8871e"), note: "ganglion = PNS 裡的神經元胞體群。" },
        { label: "對比", svg: pbText("CNS 內叫 nucleus", "#2e5f8d"), note: "中樞內同樣的胞體群叫 nucleus(核)。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "神經元各部位", viewBox: "0 0 300 170", base: NEURON, spots: [
        { x: 50, y: 74, label: "樹突 Dendrite", note: "接收訊號輸入。" },
        { x: 80, y: 92, label: "細胞本體 Soma", note: "整合輸入。" },
        { x: 114, y: 92, label: "Axon hillock", note: "<b>動作電位常見起點</b>(閾值最低)。" },
        { x: 190, y: 92, label: "軸突 Axon", note: "傳導動作電位。" },
        { x: 284, y: 92, label: "末梢 Terminal", note: "釋放神經傳遞物到下一個細胞。" }] }),
      (n) => pbTabs(n, { title: "形態分類：看突起數", tabs: [
        { label: "Unipolar", svg: pbNeuronShape(1), note: "一個突起(常見感覺神經元)。" },
        { label: "Bipolar", svg: pbNeuronShape(2), note: "兩個突起(視網膜、嗅)。" },
        { label: "Multipolar", svg: pbNeuronShape(3), note: "多突起(最常見，運動神經元)。" }] }),
      (n) => pbStepper(n, { title: "功能分類：input → process → output", steps: [
        { label: "Sensory", svg: pbChain([{ label: "感覺", color: "#bc3f34" }, { label: "中間", color: "#2e5f8d" }, { label: "運動", color: "#23694f" }], 0), note: "感覺神經元(input)。" },
        { label: "Inter", svg: pbChain([{ label: "感覺", color: "#bc3f34" }, { label: "中間", color: "#2e5f8d" }, { label: "運動", color: "#23694f" }], 1), note: "中間神經元(process，CNS)。" },
        { label: "Motor", svg: pbChain([{ label: "感覺", color: "#bc3f34" }, { label: "中間", color: "#2e5f8d" }, { label: "運動", color: "#23694f" }], 2), note: "運動神經元(output)。" }] }),
      (n) => pbTabs(n, { title: "運動單位大小決定精細度", tabs: [
        { label: "小單位", svg: pbText("1 神經元 → 少數肌纖維", "#23694f"), note: "精細控制(如手指、眼外肌)。" },
        { label: "大單位", svg: pbText("1 神經元 → 很多肌纖維", "#bc3f34"), note: "力量大但粗(如大腿)。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "Astrocyte：支持 + BBB", tabs: [
        { label: "功能", svg: pbText("支持 · 營養 · 修飾突觸", "#23694f"), note: "星狀膠細胞是神經元的維生系統。" },
        { label: "BBB", svg: pbText("終足包住血管\n→ 血腦屏障", "#2e5f8d"), note: "幫忙形成 / 維持 BBB。" }] }),
      (n) => pbTabs(n, { title: "做髓鞘的兩種細胞", tabs: [
        { label: "Oligodendrocyte", svg: pbText("CNS\n一個包多條軸突", "#2e5f8d"), note: "中樞的髓鞘細胞。" },
        { label: "Schwann cell", svg: pbText("PNS\n一段包一條", "#b8871e"), note: "周邊的髓鞘細胞。" }] }),
      (n) => pbTabs(n, { title: "Microglia：CNS 的免疫清除", tabs: [
        { label: "平時", svg: pbText("巡邏 · 修剪突觸", "#2e5f8d"), note: "監測環境、修剪不用的突觸。" },
        { label: "受傷", svg: pbText("吞噬碎片 / 病原", "#bc3f34"), note: "活化成吞噬細胞，是 CNS 免疫主力。" }] }),
      (n) => pbTabs(n, { title: "BBB：保護也限制", tabs: [
        { label: "保護", svg: pbText("擋有害物質", "#23694f"), note: "維持腦內穩定環境。" },
        { label: "限制", svg: pbText("藥物也難進", "#bc3f34"), note: "很多藥到不了腦，是治療難點。" }] }),
    ],
    [
      (n) => pbSlider(n, { title: "拖髓鞘量，看傳導速度", sliders: [{ key: "v", label: "髓鞘 (1–5)", min: 1, max: 5, value: 1 }], render: ({ v }) => ({ svg: pbMyelin(v), note: `髓鞘↑ → <b>跳躍式傳導(saltatory)</b> → 速度↑。無髓鞘最慢。` }) }),
      (n) => pbTabs(n, { title: "體感覺神經元：是 PNS", tabs: [
        { label: "陷阱", svg: pbText("terminal 進到 CNS", "#bc3f34"), note: "末梢雖然進中樞…" },
        { label: "正解", svg: pbText("胞體在 DRG\n→ 算 PNS", "#23694f"), note: "只要有任何部分在中樞外，分類就算 PNS。" }] }),
      (n) => pbTabs(n, { title: "α motor neuron 也是 PNS 陷阱", tabs: [
        { label: "胞體", svg: pbText("胞體在脊髓 (CNS)", "#2e5f8d"), note: "細胞本體在中樞…" },
        { label: "分類", svg: pbText("軸突出中樞\n→ 算 PNS", "#bc3f34"), note: "軸突離開中樞到肌肉，所以歸 PNS。" }] }),
      (n) => pbTabs(n, { title: "Interneuron：完整留在 CNS", tabs: [
        { label: "定義", svg: pbText("整條都在\n腦 / 脊髓內", "#23694f"), note: "中間神經元是唯一典型<b>完全在 CNS</b> 的。" },
        { label: "對比", svg: pbText("感覺 / 運動神經元\n都跨到 PNS", "#bc3f34"), note: "所以分類題答案常是 interneuron。" }] }),
    ],
  ];
  function pbField(hi) {
    const rings = [["white", "#182033", 150, 64], ["blue", "#2e5f8d", 118, 50], ["red", "#bc3f34", 90, 38], ["green", "#23694f", 64, 26]];
    return pbSvg("0 0 300 175", rings.map((r, i) => `<ellipse cx="150" cy="96" rx="${r[2]}" ry="${r[3]}" fill="${hi === i ? r[1] + "22" : "none"}" stroke="${r[1]}" stroke-width="${hi === i ? 5 : 3}"/>`).join("") + rings.map((r, i) => `<circle cx="${44 + i * 62}" cy="24" r="6" fill="${r[1]}"/><text x="${54 + i * 62}" y="28" font-size="10" font-weight="900">${r[0]}</text>`).join(""));
  }
  function pbLens(near) {
    const lensRx = near ? 20 : 11;
    return pbSvg("0 0 300 175", `<ellipse cx="180" cy="92" rx="100" ry="56" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><ellipse cx="120" cy="92" rx="${lensRx}" ry="34" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/><path d="M40 ${near ? 58 : 74} C80 ${near ? 72 : 82} 100 88 120 92 M40 ${near ? 126 : 110} C80 ${near ? 112 : 102} 100 96 120 92" fill="none" stroke="#b8871e" stroke-width="2.5" marker-end="url(#pb-d)"/><path d="M120 92 H262" fill="none" stroke="#bc3f34" stroke-width="3" marker-end="url(#pb-r)"/><circle cx="264" cy="92" r="5" fill="#bc3f34"/><text x="96" y="38" font-size="11" font-weight="900" fill="#b8871e">${near ? "看近：水晶體變厚" : "看遠：水晶體變扁"}</text>`);
  }
  function pbWave(nm) {
    const hue = Math.round(280 - (nm - 400) / 300 * 280);
    return pbSvg("0 0 300 130", `<text x="150" y="32" font-size="10" font-weight="800" text-anchor="middle">可見光 400–700 nm</text><rect x="40" y="42" width="220" height="50" rx="10" fill="hsl(${hue},70%,55%)" stroke="#182033" stroke-width="2"/><text x="150" y="116" font-size="13" font-weight="900" text-anchor="middle">${nm} nm</text>`);
  }
  function pbTono(freq) {
    const t = (freq - 200) / (8000 - 200), x = 40 + (1 - t) * 220;
    return pbSvg("0 0 300 130", `<line x1="40" y1="72" x2="270" y2="72" stroke="#2e5f8d" stroke-width="8" stroke-linecap="round"/><text x="34" y="100" font-size="10" font-weight="800">base 高頻</text><text x="222" y="100" font-size="10" font-weight="800">apex 低頻</text><circle cx="${x}" cy="72" r="9" fill="#bc3f34"/><text x="${Math.max(20, x - 22)}" y="52" font-size="11" font-weight="900" fill="#bc3f34">${freq} Hz</text>`);
  }
  const EYE = `<ellipse cx="160" cy="92" rx="120" ry="64" fill="url(#tissue-blue)" stroke="#2e5f8d" stroke-width="3"/><path d="M48 60 C32 78 32 106 48 124" fill="none" stroke="#182033" stroke-width="3"/><ellipse cx="74" cy="92" rx="12" ry="30" fill="#b8871e33" stroke="#b8871e" stroke-width="2.5"/><path d="M232 58 C250 76 250 108 232 126" fill="none" stroke="#bc3f34" stroke-width="3"/><circle cx="248" cy="118" r="6" fill="#182033"/><circle cx="244" cy="78" r="5" fill="#bc3f34"/>`;
  const EAR = `<path d="M40 80 C70 30 120 44 110 92 C104 126 74 138 52 122" fill="none" stroke="#bc3f34" stroke-width="6"/><path d="M118 80 H150" stroke="#182033" stroke-width="3"/><circle cx="162" cy="80" r="10" fill="#b8871e44" stroke="#b8871e" stroke-width="2.5"/><circle cx="188" cy="80" r="9" fill="#b8871e44" stroke="#b8871e" stroke-width="2.5"/><path d="M208 80 C252 40 300 70 270 116 C246 150 200 130 214 96" fill="none" stroke="#2e5f8d" stroke-width="6"/>`;
  const PHOTO = [{ label: "光", color: "#b8871e" }, { label: "Rhod", color: "#bc3f34" }, { label: "Trans", color: "#2e5f8d" }, { label: "PDE", color: "#bc3f34" }, { label: "cGMP↓", color: "#23694f" }, { label: "Na關", color: "#182033" }];
  const VPATH = [{ label: "Retina", color: "#2e5f8d" }, { label: "視神經", color: "#bc3f34" }, { label: "Chiasm", color: "#b8871e" }, { label: "LGN", color: "#2e5f8d" }, { label: "V1", color: "#23694f" }];
  const APATH = [{ label: "Cochlea", color: "#2e5f8d" }, { label: "VIII", color: "#bc3f34" }, { label: "腦幹", color: "#b8871e" }, { label: "視丘", color: "#2e5f8d" }, { label: "Cortex", color: "#23694f" }];
  const ssBlocks = [
    [
      (n) => pbTabs(n, { title: "視野檢查為何遮一眼", tabs: [
        { label: "雙眼", svg: pbSvg("0 0 300 150", `<ellipse cx="120" cy="80" rx="80" ry="46" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="3"/><ellipse cx="180" cy="80" rx="80" ry="46" fill="#bc3f3422" stroke="#bc3f34" stroke-width="3"/>`), note: "雙眼視野<b>重疊</b>，會互補對方的缺損。" },
        { label: "遮一眼", svg: pbSvg("0 0 300 150", `<ellipse cx="150" cy="80" rx="84" ry="48" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="3"/><circle cx="150" cy="80" r="10" fill="#fffdf7" stroke="#182033" stroke-width="2.5"/><text x="150" y="84" font-size="9" font-weight="900" text-anchor="middle">盲點</text>`), note: "遮一眼才能測出<b>單眼</b>真正的視野與盲點。" }] }),
      (n) => pbHotspots(n, { title: "盲點從哪來", viewBox: "0 0 300 175", base: EYE, spots: [
        { x: 74, y: 92, label: "水晶體 Lens", note: "把光聚焦到視網膜。" },
        { x: 244, y: 78, label: "中央窩 Fovea", note: "cone 最密，看得<b>最清楚</b>。" },
        { x: 248, y: 118, label: "視神經盤 Optic disc", note: "視神經離開處，<b>沒有 photoreceptor → 盲點</b>。" }] }),
      (n) => pbTabs(n, { title: "顏色視野大小：白 > 藍 > 紅 > 綠", tabs: [
        { label: "白", svg: pbField(0), note: "白光視野<b>最大</b>。" },
        { label: "藍", svg: pbField(1), note: "次之。" },
        { label: "紅", svg: pbField(2), note: "再次。" },
        { label: "綠", svg: pbField(3), note: "綠色視野<b>最小</b>。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "看近物調節三件事", tabs: [
        { label: "看遠", svg: pbLens(false), note: "睫狀肌放鬆、懸韌帶緊 → 水晶體<b>扁</b>。" },
        { label: "看近", svg: pbLens(true), note: "睫狀肌收縮 → 水晶體<b>變厚</b>，加上瞳孔縮小、雙眼會聚。" }] }),
      (n) => pbSlider(n, { title: "拖物體距離，看能否對焦", sliders: [{ key: "d", label: "物體距離 (cm)", min: 5, max: 100, value: 40 }], render: ({ d }) => { const ok = d >= 10; return { svg: pbText(ok ? `${d} cm\n清楚` : `${d} cm\n模糊(超過近點)`, ok ? "#23694f" : "#bc3f34"), note: `<b>Near point</b> ≈ 10 cm：比這更近就對不到焦。近點反映最大調節能力，會隨年齡變遠(老花)。` }; } }),
      (n) => pbSlider(n, { title: "拖波長，看是什麼光", sliders: [{ key: "nm", label: "波長 (nm)", min: 400, max: 700, value: 530 }], render: ({ nm }) => ({ svg: pbWave(nm), note: `視覺刺激＝特定波長的電磁波；可見光約 <b>400(藍紫)–700(紅)</b> nm。` }) }),
    ],
    [
      (n) => pbHotspots(n, { title: "視網膜四層(光要穿到最後)", viewBox: "0 0 300 160", base: `${[["神經節", "#2e5f8d", 90], ["雙極", "#b8871e", 130], ["感光", "#bc3f34", 170], ["色素", "#182033", 210]].map((l) => `<rect x="${l[2]}" y="30" width="30" height="100" rx="6" fill="${l[1]}22" stroke="${l[1]}" stroke-width="2"/>`).join("")}<path d="M24 80 H86" stroke="#b8871e" stroke-width="5" marker-end="url(#pb-d)"/><text x="24" y="70" font-size="10" font-weight="900" fill="#b8871e">光</text>`, spots: [
        { x: 105, y: 80, label: "神經節細胞", note: "最前層，軸突組成視神經。" },
        { x: 145, y: 80, label: "雙極細胞", note: "中繼 photoreceptor → 神經節。" },
        { x: 185, y: 80, label: "感光細胞", note: "rod/cone 在<b>最後面</b>，光要先穿過前面層。" },
        { x: 225, y: 80, label: "色素上皮", note: "吸收雜散光、支持感光細胞。" }] }),
      (n) => pbTabs(n, { title: "Rod vs Cone", tabs: [
        { label: "Rod 桿", svg: pbText("暗視 · 無色\n周邊多 · 高敏感", "#2e5f8d"), note: "弱光、黑白、周邊視覺。" },
        { label: "Cone 錐", svg: pbText("亮視 · 顏色\n中央窩 · 高解析", "#bc3f34"), note: "強光、彩色、中央清晰。" }] }),
      (n) => pbTabs(n, { title: "光照時 photoreceptor 反而超極化", tabs: [
        { label: "暗", svg: pbText("Na⁺ 通道開\n去極化 · 釋放多", "#bc3f34"), note: "暗電流：暗的時候反而持續釋放神經傳遞物。" },
        { label: "光", svg: pbText("Na⁺ 通道關\n超極化 · 釋放少", "#2e5f8d"), note: "光照 → <b>超極化</b>(不是去極化)，這是最常考的反直覺點。" }] }),
      (n) => pbStepper(n, { title: "cGMP 暗電流鏈：光把 Na⁺ 通道關掉", steps: [
        { label: "光", svg: pbChain(PHOTO, 0), note: "光打到 rhodopsin。" },
        { label: "Rhodopsin", svg: pbChain(PHOTO, 1), note: "rhodopsin 活化。" },
        { label: "Transducin", svg: pbChain(PHOTO, 2), note: "活化 transducin(G 蛋白)。" },
        { label: "PDE", svg: pbChain(PHOTO, 3), note: "活化 PDE。" },
        { label: "cGMP↓", svg: pbChain(PHOTO, 4), note: "cGMP 下降。" },
        { label: "Na⁺ 關", svg: pbChain(PHOTO, 5), note: "cGMP-gated Na⁺ 通道關 → 超極化。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "視覺路徑：retina → 枕葉", steps: [
        { label: "Retina", svg: pbChain(VPATH, 0), note: "視網膜把光轉成訊號。" },
        { label: "視神經", svg: pbChain(VPATH, 1), note: "經視神經離開眼球。" },
        { label: "Chiasm", svg: pbChain(VPATH, 2), note: "視交叉：鼻側纖維交叉。" },
        { label: "LGN", svg: pbChain(VPATH, 3), note: "視丘 LGN 中繼。" },
        { label: "V1", svg: pbChain(VPATH, 4), note: "到枕葉 primary visual cortex。" }] }),
      (n) => pbTabs(n, { title: "側向抑制：強化對比", tabs: [
        { label: "原理", svg: pbText("被強刺激的細胞\n抑制旁邊", "#2e5f8d"), note: "亮處細胞壓制鄰居 → 邊界更明顯。" },
        { label: "效果", svg: pbText("亮暗交界\n更銳利", "#bc3f34"), note: "Mach band 等錯覺就來自此。" }] }),
      (n) => pbTabs(n, { title: "立體視覺(深度)", tabs: [
        { label: "雙眼差異", svg: pbText("左右眼影像\n略有不同", "#2e5f8d"), note: "binocular disparity。" },
        { label: "中樞整合", svg: pbText("→ 合成深度", "#23694f"), note: "中樞把差異算成立體深度。" }] }),
      (n) => pbTabs(n, { title: "V1 vs 聯合皮質", tabs: [
        { label: "Primary V1", svg: pbText("偏客觀\n基本特徵", "#2e5f8d"), note: "處理線條、方向等基本訊號。" },
        { label: "Association", svg: pbText("整合記憶\n其他感覺", "#b8871e"), note: "次級/聯合皮質做高階整合與辨識。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "外、中、內耳逐步傳聲", viewBox: "0 0 300 160", base: EAR, spots: [
        { x: 72, y: 80, label: "外耳", note: "耳廓+外耳道<b>收集</b>聲波。" },
        { x: 175, y: 80, label: "中耳聽小骨", note: "鎚/砧/鐙骨<b>放大</b>並做阻抗匹配。" },
        { x: 250, y: 96, label: "內耳耳蝸", note: "把振動<b>換能</b>成神經訊號。" }] }),
      (n) => pbTabs(n, { title: "阻抗匹配：提高傳聲效率", tabs: [
        { label: "問題", svg: pbText("空氣 → 液體\n大部分會反射", "#bc3f34"), note: "聲波從空氣進耳蝸液體，本來會損失很多。" },
        { label: "解法", svg: pbText("鼓膜/卵圓窗面積比\n+ 槓桿", "#23694f"), note: "聽小骨用面積比與槓桿放大壓力，把能量有效送進去。" }] }),
      (n) => pbTabs(n, { title: "Attenuation reflex 保護內耳", tabs: [
        { label: "大聲", svg: pbText("中耳肌肉收縮", "#bc3f34"), note: "鐙骨肌/鼓膜張肌收縮。" },
        { label: "結果", svg: pbText("降低傳入\n保護耳蝸", "#23694f"), note: "減少強音傷害(對突發音反應較慢)。" }] }),
      (n) => pbTabs(n, { title: "聽覺反射不只保護", tabs: [
        { label: "轉頭定位", svg: pbText("turn head\n找聲源", "#2e5f8d"), note: "反射性轉向聲源。" },
        { label: "喚醒", svg: pbText("arousal\n提高警覺", "#b8871e"), note: "突發聲提高警覺。" }] }),
    ],
    [
      (n) => pbSlider(n, { title: "拖頻率，看基底膜哪裡振最大", sliders: [{ key: "f", label: "頻率 (Hz)", min: 200, max: 8000, value: 1000, step: 100 }], render: ({ f }) => ({ svg: pbTono(f), note: `Tonotopy：<b>base 測高頻、apex 測低頻</b>。基底膜不同位置對不同頻率最敏感。` }) }),
      (n) => pbTabs(n, { title: "Hair cell：彎向決定興奮或抑制", tabs: [
        { label: "彎向 kinocilium", svg: pbText("→ 去極化\n興奮", "#bc3f34"), note: "stereocilia 彎向最長的 kinocilium → 興奮。" },
        { label: "反方向", svg: pbText("→ 超極化\n抑制", "#2e5f8d"), note: "反向彎 → 抑制。" }] }),
      (n) => pbTabs(n, { title: "傳導性 vs 神經性耳聾", tabs: [
        { label: "傳導性", svg: pbText("外/中耳問題\n(耳垢·中耳炎·骨)", "#b8871e"), note: "聲音傳不進去；常可矯正。" },
        { label: "神經性", svg: pbText("耳蝸/神經問題", "#bc3f34"), note: "感音或神經受損(老化、噪音、藥物)。" }] }),
      (n) => pbStepper(n, { title: "聽覺 pathway：一路過濾到 cortex", steps: [
        { label: "Cochlea", svg: pbChain(APATH, 0), note: "耳蝸換能。" },
        { label: "VIII", svg: pbChain(APATH, 1), note: "第八對腦神經上傳。" },
        { label: "腦幹", svg: pbChain(APATH, 2), note: "腦幹核逐級處理。" },
        { label: "視丘", svg: pbChain(APATH, 3), note: "視丘中繼。" },
        { label: "Cortex", svg: pbChain(APATH, 4), note: "顳葉 auditory cortex。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "平衡不只靠前庭", tabs: [
        { label: "前庭", svg: pbText("半規管 + 耳石器", "#2e5f8d"), note: "偵測頭部運動。" },
        { label: "視覺", svg: pbText("看環境動", "#bc3f34"), note: "提供空間參考。" },
        { label: "本體感覺", svg: pbText("關節/肌肉", "#23694f"), note: "感知肢體位置。三者整合才平衡。" }] }),
      (n) => pbTabs(n, { title: "半規管：偵測角加速度", tabs: [
        { label: "三平面", svg: pbText("三個半規管\n互相垂直", "#2e5f8d"), note: "對應三個旋轉平面。" },
        { label: "原理", svg: pbText("內淋巴慣性\n推動 cupula", "#bc3f34"), note: "旋轉(角加速度)使內淋巴推動 cupula → 毛細胞。" }] }),
      (n) => pbTabs(n, { title: "Utricle / Saccule：線性加速度", tabs: [
        { label: "偵測", svg: pbText("線性加速度\n+ 頭部傾斜", "#23694f"), note: "otolith(耳石)受重力/加速度拉動。" },
        { label: "方向", svg: pbText("Utricle 水平\nSaccule 垂直", "#2e5f8d"), note: "兩者偵測不同方向。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "五個基本味質", tabs: [
        { label: "甜", svg: pbText("Sweet · 糖", "#bc3f34"), note: "能量訊號。" },
        { label: "鹹", svg: pbText("Salty · Na⁺", "#b8871e"), note: "電解質。" },
        { label: "酸", svg: pbText("Sour · H⁺", "#23694f"), note: "酸/未熟/腐敗。" },
        { label: "苦", svg: pbText("Bitter · 生物鹼", "#2e5f8d"), note: "常與毒物相關。" },
        { label: "鮮", svg: pbText("Umami · 麩胺酸", "#bc3f34"), note: "蛋白質訊號。" }] }),
      (n) => pbSlider(n, { title: "拖味質，比閾值高低", sliders: [{ key: "t", label: "1甜 2鹹 3酸 4苦 5鮮", min: 1, max: 5, value: 4 }], render: ({ t }) => { const names = ["", "甜", "鹹", "酸", "苦", "鮮"], thr = [0, 60, 55, 35, 8, 50]; return { svg: pbFraction(thr[t] / 60, `${names[t]} 相對閾值`), note: `<b>苦味閾值最低</b>(最靈敏)：及早警覺可能有毒的生物鹼，有保護意義。` }; } }),
      (n) => pbTabs(n, { title: "味覺傳入腦神經", tabs: [
        { label: "VII", svg: pbText("顏面神經\n舌前 2/3", "#bc3f34"), note: "舌前 2/3 味覺。" },
        { label: "IX", svg: pbText("舌咽神經\n舌後 1/3", "#2e5f8d"), note: "舌後 1/3 味覺。" },
        { label: "X", svg: pbText("迷走神經\n會厭/咽", "#23694f"), note: "口訣：味覺 VII、IX、X。" }] }),
      (n) => pbTabs(n, { title: "嗅覺、limbic 與 flavor", tabs: [
        { label: "嗅 → limbic", svg: pbText("嗅覺連 limbic\n→ 記憶/情緒", "#6552a3"), note: "嗅覺路徑與邊緣系統連結強，特別易勾起記憶與情緒。" },
        { label: "Flavor", svg: pbText("味覺 + 嗅覺\n= 風味", "#b8871e"), note: "感冒鼻塞時東西「沒味道」，其實是嗅覺被擋。" }] }),
    ],
  ];
  const miniTabs = (node, title, items, intro = "") => pbTabs(node, {
    title,
    intro,
    tabs: items.map(([label, text, color, note]) => ({
      label,
      svg: pbText(text, color || "#2e5f8d"),
      note
    }))
  });
  const miniSteps = (node, title, items, intro = "") => pbStepper(node, {
    title,
    intro,
    steps: items.map(([label, text, color, note]) => ({
      label,
      svg: pbText(text, color || "#2e5f8d"),
      note
    }))
  });

  const ansBlocks = [
    [
      (n) => miniTabs(n, "意識與下意識：兩套路徑會互相影響", [
        ["Conscious", "主動感覺 / 動作", "#2e5f8d", "Somatic/意識路徑讓你主動感覺、移動與暫時控制呼吸。"],
        ["Subconscious", "心跳 · 血壓 · 體溫", "#23694f", "Autonomic 路徑自動維持生命所需的內環境。"],
        ["互相影響", "情緒 / 呼吸\n可調自主反應", "#b8871e", "兩套解剖路徑不同，但可在中樞與部分效應器互相調節。"]
      ]),
      (n) => miniSteps(n, "自主反射也有三段", [
        ["Input", "內臟受器\n偵測變化", "#2e5f8d", "壓力、伸展、化學環境先被 visceral receptor 偵測。"],
        ["Integrate", "脊髓 / 腦幹\n整合", "#b8871e", "中樞比較目前狀態與 homeostatic 需求。"],
        ["Output", "自主傳出\n調整器官", "#23694f", "交感或副交感輸出改變心肌、平滑肌與腺體。"]
      ]),
      (n) => pbSlider(n, {
        title: "拖 basal tone，看器官能否雙向微調",
        intro: "0 代表完全沒有基礎放電；5 是正常基準。",
        sliders: [{ key: "tone", label: "自主神經 basal tone", min: 0, max: 10, value: 5 }],
        render: ({ tone }) => ({
          svg: pbFraction(tone / 10, "basal tone"),
          note: tone === 0
            ? "沒有 basal tone 時，只能從零往上，<b>失去快速向下調節的餘裕</b>。"
            : `目前基礎活動 ${tone}/10；中樞可再增加或減少放電，做<b>雙向微調</b>。`
        })
      }),
      (n) => miniTabs(n, "四大生理特性：支配方式與集體放電", [
        ["拮抗", "心臟\n交感↑ 副交感↓", "#bc3f34", "心率是典型拮抗控制。"],
        ["互補", "不同階段\n共同完成任務", "#b8871e", "有些器官需要兩系統在不同階段協作。"],
        ["單一支配", "血管 · 汗腺\n多由交感", "#23694f", "多數血管、汗腺、豎毛肌等是重要例外。"],
        ["集體放電", "交感廣泛同步\nFight-or-flight", "#7b4aa0", "緊急刺激時，多個交感效應器同步活化。"]
      ])
    ],
    [
      (n) => miniTabs(n, "Somatic vs autonomic output", [
        ["Somatic", "CNS → 1 neuron\n→ 骨骼肌", "#2e5f8d", "一顆 motor neuron 直接到 skeletal muscle，使用 ACh→Nm。"],
        ["Autonomic", "CNS → 節前\n→ ganglion → 節後", "#23694f", "兩顆神經元接力到 smooth muscle、cardiac muscle 或 gland。"]
      ]),
      (n) => miniSteps(n, "交感 thoracolumbar 路徑", [
        ["起點", "T1–L2/L3\n側角", "#bc3f34", "交感節前胞體位在胸腰段脊髓。"],
        ["節前", "短纖維", "#b8871e", "交感神經節靠近脊髓，所以節前通常短。"],
        ["Ganglion", "交感鏈 /\n側副神經節", "#2e5f8d", "可上下行並大量分支。"],
        ["節後", "長纖維\n到效應器", "#23694f", "廣泛分支適合 fight-or-flight。"]
      ]),
      (n) => miniSteps(n, "副交感 craniosacral 路徑", [
        ["起點", "CN III VII IX X\n+ S2–S4", "#2e5f8d", "副交感由腦幹與薦髓流出。"],
        ["節前", "長纖維\n靠近器官", "#b8871e", "節前走很遠才到 terminal/intramural ganglion。"],
        ["Ganglion", "器官旁 / 壁內", "#23694f", "Ganglion 靠近效應器。"],
        ["節後", "短纖維", "#bc3f34", "節後只需走很短距離。"]
      ]),
      (n) => miniSteps(n, "腎上腺髓質：改造的交感神經節", [
        ["節前", "交感節前\nACh", "#2e5f8d", "交感節前纖維直接到 adrenal medulla。"],
        ["受體", "Chromaffin\nNn receptor", "#b8871e", "Chromaffin cell 像改造的節後神經元。"],
        ["入血", "Epi 80%\nNE 20%", "#bc3f34", "Catecholamines 不是進局部突觸，而是進血液。"],
        ["效果", "廣泛且較久", "#23694f", "循環訊號延長並放大交感反應。"]
      ])
    ],
    [
      (n) => miniSteps(n, "所有自主節前都一樣", [
        ["交感節前", "ACh", "#bc3f34", "交感節前是 cholinergic。"],
        ["副交感節前", "ACh", "#2e5f8d", "副交感節前也是 cholinergic。"],
        ["Ganglion", "Nn receptor", "#b8871e", "兩系統都在 autonomic ganglion 用 Nn。"],
        ["腎上腺髓質", "ACh → Nn", "#23694f", "Chromaffin cell 也接收節前 ACh。"]
      ]),
      (n) => miniTabs(n, "節後才真正分家", [
        ["副交感", "ACh → M", "#2e5f8d", "副交感節後通常釋放 ACh，作用 muscarinic receptor。"],
        ["交感多數", "NE → α / β", "#bc3f34", "大多數交感節後釋放 NE，作用 adrenergic receptor。"],
        ["判讀原則", "Transmitter\n+ receptor", "#23694f", "器官效果必須把 transmitter 和 receptor subtype 一起看。"]
      ]),
      (n) => miniTabs(n, "汗腺：交感 cholinergic 例外", [
        ["一般交感", "節後 NE\n→ α / β", "#bc3f34", "這是大多數交感節後規則。"],
        ["汗腺", "節後 ACh\n→ muscarinic", "#23694f", "汗腺只受交感支配，但節後用 ACh。"],
        ["考題警報", "Sympathetic\n不一定 NE", "#b8871e", "看到 sympathetic 不能無條件選 NE。"]
      ]),
      (n) => miniTabs(n, "Nicotinic 與 muscarinic 定位", [
        ["Nn", "Autonomic ganglion\n+ adrenal medulla", "#2e5f8d", "Nn 是 neuronal nicotinic receptor。"],
        ["Nm", "骨骼肌\nmotor end plate", "#bc3f34", "Nm 是 muscle nicotinic receptor。"],
        ["Muscarinic", "副交感效應器\n+ 汗腺", "#23694f", "Muscarinic receptors 是 GPCR。"]
      ])
    ],
    [
      (n) => miniTabs(n, "α1 = Gq：收縮型題目主力", [
        ["訊號", "α1 → Gq\n→ Ca²⁺↑", "#bc3f34", "Gq 啟動 PLC/IP3，使 intracellular Ca2+ 上升。"],
        ["血管", "Vasoconstriction", "#2e5f8d", "多數血管平滑肌收縮。"],
        ["眼 / 括約肌", "散瞳\n括約肌收縮", "#b8871e", "α1 收縮瞳孔放射肌與部分內括約肌。"]
      ]),
      (n) => miniTabs(n, "α2 = Gi：突觸前煞車", [
        ["位置", "Presynaptic\nterminal", "#2e5f8d", "α2 常位在交感末梢。"],
        ["訊號", "Gi → cAMP↓", "#b8871e", "Gi 降低 cAMP。"],
        ["效果", "NE release ↓", "#23694f", "形成負回饋，避免 NE 釋放過多。"]
      ]),
      (n) => miniTabs(n, "β 都走 Gs，器官任務不同", [
        ["β1", "心率↑\n收縮力↑", "#bc3f34", "β1 強化心臟輸出。"],
        ["β2", "支氣管舒張\n部分血管舒張", "#2e5f8d", "β2 平滑肌常舒張。"],
        ["β3", "脂解↑\n逼尿肌舒張", "#23694f", "β3 支持能量動員與儲尿。"]
      ]),
      (n) => miniTabs(n, "Muscarinic：常用 M2 / M3 推題", [
        ["M2", "Gi\n心率↓", "#2e5f8d", "心臟副交感作用主要經 M2。"],
        ["M3", "Gq\n分泌 / 收縮", "#23694f", "M3 促腺體分泌與多數平滑肌收縮。"],
        ["Endothelium M3", "NO → 血管舒張", "#b8871e", "M3 在內皮可經 NO 造成反直覺的 vasodilation。"]
      ])
    ],
    [
      (n) => miniTabs(n, "心肺與眼：先想 fight-or-flight", [
        ["心臟", "β1：HR / force ↑\nM2：HR ↓", "#bc3f34", "交感提高 cardiac output；副交感減慢 pacemaker。"],
        ["支氣管", "β2：舒張\nM3：收縮 / 分泌", "#2e5f8d", "交感提高通氣，副交感恢復日常氣道狀態。"],
        ["瞳孔", "α1：散瞳\nM3：縮瞳", "#b8871e", "交感擴大視野，副交感支援近距離視覺。"]
      ]),
      (n) => miniTabs(n, "腸胃：rest-and-digest", [
        ["副交感", "蠕動↑\n分泌↑", "#23694f", "休息與進食時促進消化。"],
        ["交感", "蠕動↓\n血流↓", "#bc3f34", "壓力時把資源轉去心肺與肌肉。"],
        ["括約肌", "交感 α1\n收縮", "#b8871e", "交感多使 GI sphincter 收縮。"]
      ]),
      (n) => miniTabs(n, "膀胱：切換儲尿與排尿", [
        ["儲尿", "β3 逼尿肌鬆\nα1 內括約肌緊", "#2e5f8d", "交感讓膀胱裝得下、出口關住。"],
        ["排尿", "M3 逼尿肌縮", "#23694f", "副交感啟動 voiding。"],
        ["外括約肌", "Somatic\npudendal nerve", "#bc3f34", "外尿道括約肌是意識可控的骨骼肌。"]
      ]),
      (n) => miniTabs(n, "皮膚與代謝：交感主場", [
        ["汗腺", "ACh → M\n出汗↑", "#2e5f8d", "交感 cholinergic 促進散熱。"],
        ["豎毛 / 血管", "α1 收縮", "#bc3f34", "皮膚血管與豎毛肌多由交感調節。"],
        ["燃料", "β3 脂解↑\n葡萄糖可用性↑", "#b8871e", "壓力時快速提供燃料。"]
      ])
    ],
    [
      (n) => miniTabs(n, "局部神經訊號 vs 循環 catecholamine", [
        ["神經末梢", "Local NE\n快而短", "#2e5f8d", "直接突觸傳遞，位置精準且終止快。"],
        ["腎上腺髓質", "Epi / NE 入血\n廣而較久", "#bc3f34", "血液把訊號帶到全身，延長壓力反應。"]
      ]),
      (n) => miniSteps(n, "自主控制中樞由低到高", [
        ["脊髓", "局部內臟反射", "#2e5f8d", "排尿、排便等反射可在脊髓層級整合。"],
        ["腦幹", "心血管 / 呼吸", "#bc3f34", "Medulla/pons 管理生命維持反射。"],
        ["下視丘", "體溫 / 水分 /\n攝食 / 內分泌", "#b8871e", "Hypothalamus 是高級 homeostatic integrator。"],
        ["Limbic / cortex", "情緒與意識調節", "#23694f", "情緒、認知與呼吸模式可改變自主輸出。"]
      ]),
      (n) => miniTabs(n, "傳遞物怎麼停下來", [
        ["ACh", "AChE\n快速分解", "#2e5f8d", "Acetylcholinesterase 在突觸間隙水解 ACh。"],
        ["NE", "Presynaptic\nreuptake", "#bc3f34", "NE 最主要先被神經末梢回收。"],
        ["Catecholamine", "MAO / COMT\n代謝", "#b8871e", "回收後或循環中的 catecholamine 可被 MAO/COMT 代謝。"]
      ]),
      (n) => miniSteps(n, "藥理題固定三步", [
        ["1", "Agonist or\nantagonist?", "#2e5f8d", "先判斷藥物是增強還是阻斷。"],
        ["2", "哪個 receptor\n在哪個器官?", "#b8871e", "找到 subtype 與組織位置。"],
        ["3", "正常效果\n方向怎麼變?", "#23694f", "把正常作用增強或反向阻斷即可。"]
      ])
    ]
  ];

  const endoBlocks = [
    [
      (n) => miniTabs(n, "訊號走多遠，名字就不同", [
        ["Intracrine", "留在細胞內\n直接作用", "#7b4aa0", "訊號不需分泌到細胞外。"],
        ["Autocrine", "回頭影響自己", "#bc3f34", "細胞分泌後作用自己或同類細胞。"],
        ["Paracrine", "影響鄰近細胞", "#b8871e", "局部擴散，不需走全身血液。"],
        ["Endocrine", "入血 → 遠端", "#2e5f8d", "傳統內分泌訊號進血液作用遠端 target。"],
        ["Neuroendocrine", "神經細胞\n分泌入血", "#23694f", "來源是 neurosecretory cell。"]
      ]),
      (n) => miniTabs(n, "Target cell：有 receptor 才聽得到", [
        ["有 receptor", "Hormone → response", "#23694f", "受體與下游路徑完整，細胞才反應。"],
        ["無 receptor", "Hormone 經過\n但無直接反應", "#bc3f34", "荷爾蒙雖隨血流到達，沒有受體仍不會直接作用。"],
        ["敏感度", "受體數量 / affinity\n可調整", "#b8871e", "Up/down-regulation 會改變同一濃度的效應。"]
      ]),
      (n) => miniTabs(n, "四個內分泌個體戶", [
        ["Adrenal medulla", "交感刺激", "#bc3f34", "直接回應 sympathetic preganglionic input。"],
        ["Pancreas", "血糖 / 養分", "#2e5f8d", "直接偵測 nutrient level。"],
        ["Parathyroid", "血中 Ca²⁺", "#23694f", "直接用 Ca-sensing receptor 偵測血鈣。"],
        ["Pineal", "明暗週期", "#b8871e", "依光暗資訊調節 melatonin。"]
      ]),
      (n) => pbSlider(n, {
        title: "膜訊號與基因訊號的時間尺度",
        sliders: [{ key: "speed", label: "訊號偏向 1=膜受體、5=核受體", min: 1, max: 5, value: 2 }],
        render: ({ speed }) => ({
          svg: pbFraction(speed / 5, "起效所需時間"),
          note: speed <= 2
            ? "膜受體與 second messenger 通常<b>起效快、持續較短</b>。"
            : "核內受體改變 transcription，通常<b>起效較慢、持續較久</b>。"
        })
      })
    ],
    [
      (n) => miniSteps(n, "Peptide hormone 的生命週期", [
        ["合成", "Prepro → Pro\n→ Hormone", "#2e5f8d", "經 ER/Golgi 加工成熟。"],
        ["庫存", "Secretory\nvesicle", "#b8871e", "可先儲存在分泌顆粒。"],
        ["釋放", "Ca²⁺ →\nexocytosis", "#bc3f34", "刺激使 Ca2+ 進入並胞吐。"],
        ["作用", "膜受體\nsecond messenger", "#23694f", "水溶性不能自由穿膜。"]
      ]),
      (n) => miniSteps(n, "Steroid hormone 的生命週期", [
        ["原料", "Cholesterol", "#b8871e", "多數 steroid 由膽固醇衍生。"],
        ["合成", "需要時才製造", "#bc3f34", "通常不在囊泡庫存。"],
        ["運送", "Carrier protein", "#2e5f8d", "脂溶性需載體在血中運送。"],
        ["作用", "穿膜 → 核受體", "#23694f", "常直接改變基因表現。"]
      ]),
      (n) => miniTabs(n, "Amine-derived 有兩種性格", [
        ["Catecholamine", "水溶 · 膜受體\n像 peptide", "#bc3f34", "Epinephrine/NE 起效快。"],
        ["Thyroid hormone", "脂溶 · 核受體\n像 steroid", "#2e5f8d", "T3/T4 是最重要的分類陷阱。"],
        ["Melatonin", "Tryptophan-derived", "#b8871e", "由 pineal gland 依明暗週期分泌。"]
      ]),
      (n) => miniTabs(n, "Eicosanoid：局部調節高手", [
        ["來源", "Arachidonic acid", "#b8871e", "由 20 碳不飽和脂肪酸衍生。"],
        ["家族", "PG · TXA · LT", "#bc3f34", "包含 prostaglandin、thromboxane、leukotriene。"],
        ["作用", "多為 local\nparacrine/autocrine", "#23694f", "參與發炎、血管、血小板與平滑肌調節。"]
      ])
    ],
    [
      (n) => miniTabs(n, "GPCR 三條主路徑", [
        ["Gs", "Adenylyl cyclase ↑\ncAMP / PKA ↑", "#bc3f34", "Gs 是 stimulatory G protein。"],
        ["Gi", "cAMP ↓", "#2e5f8d", "Gi 抑制 adenylyl cyclase 路徑。"],
        ["Gq", "PLC → IP3 / DAG\nCa²⁺ ↑", "#23694f", "Gq 連到 Ca2+ 與 PKC。"]
      ]),
      (n) => miniSteps(n, "Insulin receptor：RTK", [
        ["Insulin", "結合 receptor", "#bc3f34", "Insulin 接到 receptor tyrosine kinase。"],
        ["RTK", "Autophosphorylation", "#b8871e", "受體本身具有 kinase activity。"],
        ["PI3K / Akt", "GLUT4 上膜", "#2e5f8d", "促肌肉與脂肪攝取 glucose。"],
        ["MAPK", "生長訊號", "#23694f", "另可連到 growth-related pathway。"]
      ]),
      (n) => miniSteps(n, "GH receptor：JAK-STAT", [
        ["GH", "結合 cytokine\nreceptor", "#bc3f34", "GH receptor 本身沒有內建 kinase。"],
        ["JAK", "Associated kinase", "#b8871e", "受體招募 JAK。"],
        ["STAT", "進入細胞核", "#2e5f8d", "STAT 被磷酸化後調節轉錄。"],
        ["Response", "基因表現改變", "#23694f", "促進生長與代謝相關反應。"]
      ]),
      (n) => miniTabs(n, "Nuclear receptor：直接改轉錄", [
        ["Steroid", "穿膜 → receptor\n→ DNA", "#bc3f34", "Steroid 常透過 intracellular receptor。"],
        ["Thyroid", "T3 → nuclear\nreceptor", "#2e5f8d", "Thyroid hormone 雖是 amine，仍用核受體。"],
        ["Vitamin D", "Calcitriol → VDR", "#23694f", "VDR 促進鈣吸收相關蛋白表現。"]
      ])
    ],
    [
      (n) => miniSteps(n, "三級內分泌軸", [
        ["一級", "Hypothalamus\nreleasing hormone", "#2e5f8d", "例如 CRH、TRH、GnRH。"],
        ["二級", "Anterior pituitary\ntropic hormone", "#b8871e", "例如 ACTH、TSH、FSH/LH。"],
        ["三級", "Target gland\nhormone", "#bc3f34", "例如 cortisol、T3/T4、gonadal hormones。"],
        ["回饋", "三級 ┤ 上游", "#23694f", "Long-loop negative feedback 維持穩定。"]
      ]),
      (n) => miniTabs(n, "Anterior 六個，posterior 兩個", [
        ["Anterior", "GH · TSH · ACTH\nFSH · LH · PRL", "#bc3f34", "前葉是腺體細胞，透過 portal blood 接收下視丘訊號。"],
        ["Posterior", "ADH · Oxytocin", "#2e5f8d", "後葉儲存並釋放下視丘神經元製造的荷爾蒙。"]
      ]),
      (n) => miniTabs(n, "GnRH：脈衝與連續會相反", [
        ["Pulsatile", "約 90 分鐘脈衝\nLH / FSH 維持", "#23694f", "脈衝讓 receptor 保持反應。"],
        ["Continuous", "受體 down-regulation\nLH / FSH ↓", "#bc3f34", "持續刺激反而造成 desensitization。"]
      ]),
      (n) => miniTabs(n, "回饋方向", [
        ["Negative", "偏差縮小\n維持穩定", "#23694f", "體內多數 endocrine control 使用負回饋。"],
        ["Positive", "反應放大\n直到事件完成", "#bc3f34", "Oxytocin 分娩迴路是經典正回饋。"],
        ["例外提醒", "排卵前 estrogen\n→ LH surge", "#b8871e", "特定時段可從負回饋切成正回饋。"]
      ])
    ],
    [
      (n) => miniTabs(n, "ADH 兩個 receptor，兩個任務", [
        ["V1a", "Gq\n血管收縮", "#bc3f34", "V1a 提高 vascular tone。"],
        ["V2", "Gs / PKA\nAQP2 上膜", "#2e5f8d", "V2 在 collecting duct 增加水再吸收。"]
      ]),
      (n) => miniTabs(n, "Oxytocin 與 prolactin 不要混", [
        ["Oxytocin", "子宮收縮\nmilk ejection", "#bc3f34", "後葉釋放，造成肌上皮收縮與正回饋。"],
        ["Prolactin", "milk production", "#2e5f8d", "前葉分泌，促乳汁生成。"]
      ]),
      (n) => miniSteps(n, "GH / IGF-1 軸", [
        ["GHRH", "刺激 GH", "#2e5f8d", "Hypothalamic GHRH 促前葉釋放 GH。"],
        ["GH", "代謝 +\n促 IGF-1", "#bc3f34", "GH 直接調節代謝並促進 IGF-1。"],
        ["IGF-1", "骨與組織生長", "#b8871e", "執行許多生長作用。"],
        ["回饋", "GH / IGF-1\n抑制上游", "#23694f", "Somatostatin 也抑制 GH。"]
      ]),
      (n) => miniTabs(n, "GH 過多或 receptor 壞掉", [
        ["骨骺閉合前", "Gigantism", "#bc3f34", "線性長高仍可進行。"],
        ["骨骺閉合後", "Acromegaly", "#b8871e", "成人以肢端與軟組織增厚為主。"],
        ["GH receptor defect", "GH 正常/高\nIGF-1 低", "#2e5f8d", "Laron syndrome 是受體缺陷，不一定是 GH 缺乏。"]
      ])
    ],
    [
      (n) => miniSteps(n, "甲狀腺三級軸", [
        ["TRH", "Hypothalamus", "#2e5f8d", "TRH 刺激前葉。"],
        ["TSH", "Anterior pituitary", "#b8871e", "TSH 刺激 follicular cell。"],
        ["T3 / T4", "Thyroid", "#bc3f34", "提高代謝並回饋抑制 TRH/TSH。"]
      ]),
      (n) => miniSteps(n, "碘與 thyroglobulin 合成 T3/T4", [
        ["Iodide", "進 follicular cell", "#2e5f8d", "先把碘送進甲狀腺細胞。"],
        ["TPO", "Oxidation /\norganification", "#b8871e", "TPO 幫助碘化 thyroglobulin 的 tyrosine。"],
        ["MIT / DIT", "碘化 tyrosine", "#bc3f34", "一碘是 MIT，二碘是 DIT。"],
        ["Coupling", "MIT+DIT=T3\nDIT+DIT=T4", "#23694f", "Coupling 決定 T3/T4。"]
      ]),
      (n) => miniTabs(n, "T4、T3、rT3", [
        ["T4", "主要分泌\n儲備形式", "#2e5f8d", "甲狀腺多數先分泌 T4。"],
        ["T3", "較活性", "#bc3f34", "周邊 deiodinase 可把 T4 轉為 T3。"],
        ["rT3", "Inactive", "#b8871e", "另一種去碘方向形成 inactive rT3。"]
      ]),
      (n) => miniTabs(n, "兩種 goiter，用回饋方向分", [
        ["Graves", "TSI 刺激\nT3/T4↑ TSH↓", "#bc3f34", "外來抗體模仿 TSH，正常 TSH 被負回饋壓低。"],
        ["缺碘", "原料不足\nT3/T4↓ TSH↑", "#2e5f8d", "TSH 長期刺激造成腺體增生。"]
      ])
    ],
    [
      (n) => miniTabs(n, "血鈣太低或太高", [
        ["Hypocalcemia", "Na⁺ 通透性↑\nTetany", "#bc3f34", "神經肌肉更容易去極化。"],
        ["Hypercalcemia", "興奮性↓\nGI motility↓", "#2e5f8d", "可出現便秘、反射下降等。"]
      ]),
      (n) => miniTabs(n, "PTH：留鈣、排磷", [
        ["骨", "Ca²⁺ 釋放↑", "#bc3f34", "提高 bone resorption。"],
        ["腎", "Ca²⁺ 回收↑\nPhosphate 回收↓", "#2e5f8d", "淨效果提高游離血鈣。"],
        ["Vitamin D", "1α-hydroxylase ↑", "#23694f", "促進 calcitriol 生成。"]
      ]),
      (n) => miniSteps(n, "PTH 透過 osteoblast 叫醒 osteoclast", [
        ["PTH", "結合 osteoblast", "#2e5f8d", "成熟 osteoclast 沒有典型 PTH receptor。"],
        ["Osteoblast", "RANKL ↑", "#b8871e", "Osteoblast 表現 RANKL。"],
        ["Osteoclast", "RANK 被活化", "#bc3f34", "Osteoclast lineage 被活化。"],
        ["結果", "Bone resorption\nCa²⁺ ↑", "#23694f", "骨質釋放鈣到血中。"]
      ]),
      (n) => miniTabs(n, "Vitamin D 與 calcitonin", [
        ["Calcitriol", "腸道 Ca²⁺ /\nphosphate 吸收↑", "#b8871e", "活性 vitamin D 透過 VDR 增加吸收蛋白。"],
        ["Calcitonin", "血鈣↓", "#2e5f8d", "由 thyroid C cell 分泌，方向上降低血鈣。"],
        ["PTH", "血鈣↑\n血磷↓", "#bc3f34", "PTH 是低血鈣快速救援主力。"]
      ])
    ],
    [
      (n) => miniTabs(n, "胰島細胞配對", [
        ["α cell", "Glucagon", "#bc3f34", "升高血糖。"],
        ["β cell", "Insulin", "#2e5f8d", "降低血糖並促儲存。"],
        ["δ cell", "Somatostatin", "#23694f", "局部抑制多種分泌。"],
        ["PP / F cell", "Pancreatic\npolypeptide", "#b8871e", "胰島另一類細胞。"]
      ]),
      (n) => miniSteps(n, "內源 insulin 與 C-peptide", [
        ["Preproinsulin", "最初合成", "#2e5f8d", "典型 peptide hormone 前驅物。"],
        ["Proinsulin", "折疊加工", "#b8871e", "包含 A、B chain 與 C-peptide。"],
        ["切割", "Insulin +\nC-peptide", "#bc3f34", "成熟時切下 C-peptide。"],
        ["釋放", "1 : 1", "#23694f", "C-peptide 可反映內源 insulin 分泌。"]
      ]),
      (n) => miniSteps(n, "β cell 感糖並釋放 insulin", [
        ["GLUT2", "Glucose 進入", "#2e5f8d", "順濃度梯度進 β cell。"],
        ["ATP ↑", "KATP channel 關", "#b8871e", "代謝提高 ATP，關閉 KATP。"],
        ["去極化", "Ca²⁺ channel 開", "#bc3f34", "Voltage-gated Ca2+ channel 打開。"],
        ["胞吐", "Insulin release", "#23694f", "Ca2+ 觸發顆粒 exocytosis。"]
      ]),
      (n) => pbSlider(n, {
        title: "拖 insulin sensitivity，看代償與失控",
        sliders: [{ key: "s", label: "Insulin sensitivity", min: 1, max: 5, value: 4 }],
        render: ({ s }) => {
          const need = 6 - s;
          return {
            svg: pbFraction(need / 5, "維持血糖所需 insulin"),
            note: s >= 4
              ? "敏感度高：少量 insulin 就能促 GLUT4 上膜並控制血糖。"
              : s >= 2
                ? "敏感度下降：β cell 需要<b>高 insulin / C-peptide 代償</b>。"
                : "長期嚴重阻抗後若 β cell 衰竭，血糖會<b>失控上升</b>。"
          };
        }
      })
    ]
  ];

  // ===== test2 重編：心血管全新互動圖（cardioBlocksV2，取代搬運自原版的 cardioBlocks）=====
  const PBP = "#fffdf7", PBINK = "#182033", PBR = "#bc3f34", PBB = "#2e5f8d", PBGD = "#b8871e", PBGRN = "#23694f", PBMU = "#9aa3ad";

  // ECG 在記什麼：單一心肌細胞的膜內/膜外電荷 + 體表電極
  function pbCellOut(state) {
    const dep = state === "dep";
    const inSign = dep ? "+" : "−", outSign = dep ? "−" : "+";
    const inFill = dep ? "#f6d6cf" : "#dfeaf4";
    const outCol = dep ? PBB : PBR, inCol = dep ? PBR : PBB;
    const outWord = dep ? "負電" : "正電";
    const row = (sign, col, y) => [60, 110, 160, 210, 250].map((x) => `<text x="${x}" y="${y}" font-size="15" font-weight="900" fill="${col}" text-anchor="middle">${sign}</text>`).join("");
    return pbSvg("0 0 300 175", `
      <rect x="40" y="56" width="230" height="64" rx="14" fill="${inFill}" stroke="${PBINK}" stroke-width="2.5"/>
      ${row(outSign, outCol, 50)}${row(inSign, inCol, 96)}
      <text x="155" y="88" font-size="11" font-weight="900" fill="${PBINK}" text-anchor="middle">心肌細胞（膜內）</text>
      <rect x="138" y="12" width="34" height="20" rx="5" fill="${PBGD}" stroke="${PBINK}" stroke-width="2"/>
      <text x="155" y="26" font-size="10.5" font-weight="900" fill="#fff" text-anchor="middle">電極</text>
      <line x1="155" y1="32" x2="155" y2="50" stroke="${PBINK}" stroke-width="2.5"/>
      <text x="155" y="150" font-size="13" font-weight="900" fill="${outCol}" text-anchor="middle">體表（細胞外）記到：${outWord}</text>`);
  }

  // 正極 − 負極：兩個電極各「數 4 顆電荷」
  function pbCount(scn) {
    const rest = scn === "rest";
    const pos = 4, neg = rest ? 4 : -4, val = pos - neg;
    const leftSigns = rest ? ["+", "+", "+", "+"] : ["−", "−", "−", "−"];
    const cell = (x, s) => `<text x="${x}" y="80" font-size="15" font-weight="900" fill="${s === "+" ? PBR : PBB}" text-anchor="middle">${s}</text>`;
    const strip = (x0, signs) => signs.map((s, i) => cell(x0 + i * 22, s)).join("");
    return pbSvg("0 0 320 178", `
      <rect x="20" y="60" width="120" height="34" rx="8" fill="#eef1f7" stroke="${PBINK}" stroke-width="1.6"/>
      <rect x="180" y="60" width="120" height="34" rx="8" fill="#fbeeec" stroke="${PBINK}" stroke-width="1.6"/>
      ${strip(34, leftSigns)}${strip(194, ["+", "+", "+", "+"])}
      <text x="34" y="52" font-size="12" font-weight="900" fill="${PBB}">負極 數到 ${neg}</text>
      <text x="194" y="52" font-size="12" font-weight="900" fill="${PBR}">正極 數到 ${pos}</text>
      <text x="160" y="128" font-size="14" font-weight="900" fill="${PBINK}" text-anchor="middle">正 − 負 = ${pos} − (${neg}) = ${val}</text>
      <text x="160" y="152" font-size="12" font-weight="800" fill="${val === 0 ? PBMU : PBR}" text-anchor="middle">${val === 0 ? "→ 平線（停在零位）" : "→ 大正波（電流朝正極）"}</text>`);
  }

  // 招牌互動：把一個波從零一格一格推出來
  const PB_WAVE_STEPS = [
    { dep: 0, rep: 0, v: 0 }, { dep: 0.3, rep: 0, v: 0.5 }, { dep: 0.58, rep: 0, v: 1 }, { dep: 1, rep: 0, v: 0 },
    { dep: 1, rep: 0.3, v: -0.5 }, { dep: 1, rep: 0.62, v: -1 }, { dep: 1, rep: 1, v: 0 }
  ];
  const PB_WAVE_NOTES = [
    "靜止：細胞外全是正電，正 − 負 = 0 → <b>平線</b>。",
    "去極化開始：出現負區並往前推進，正 − 負由 0 <b>往上爬</b>。",
    "去極化過半：值到最高 → 畫出<b>正波頂點</b>。",
    "去極化完成：又全部同號，正 − 負<b>回到 0</b>。",
    "再極化開始（先去極化處先恢復）：值<b>往下掉</b>到零位以下。",
    "再極化過半：值到最低 → 畫出<b>倒波底點</b>。",
    "再極化完成：回 0。整段 = <b>正波 + 倒波</b>，這就是波形的由來。"
  ];
  function pbWaveBuild(i) {
    const N = 10, x0 = 46, cw = 21, cy = 44, ch = 28, s = PB_WAVE_STEPS[i];
    let cells = "";
    for (let c = 0; c < N; c++) {
      const f = (c + 0.5) / N, isDep = f < s.dep && f >= s.rep;
      const col = isDep ? "#cfe0ef" : "#f6d8d0", sign = isDep ? "−" : "+", sc = isDep ? PBB : PBR, x = x0 + c * cw;
      cells += `<rect x="${x}" y="${cy}" width="${cw - 2}" height="${ch}" fill="${col}" stroke="#c9bea8"/><text x="${x + (cw - 2) / 2}" y="${cy + 19}" font-size="13" font-weight="900" fill="${sc}" text-anchor="middle">${sign}</text>`;
    }
    let front = "";
    if (s.dep > 0 && s.dep < 1 && s.rep === 0) { const fx = x0 + s.dep * N * cw; front = `<path d="M${fx - 2} ${cy - 8} H${fx + 18}" stroke="${PBB}" stroke-width="3" marker-end="url(#pb-b)"/><text x="${fx - 8}" y="${cy - 12}" font-size="9" font-weight="900" fill="${PBB}">去極化前進</text>`; }
    if (s.rep > 0 && s.rep < 1) { const fx = x0 + s.rep * N * cw; front = `<path d="M${fx - 2} ${cy - 8} H${fx + 18}" stroke="${PBR}" stroke-width="3" marker-end="url(#pb-r)"/><text x="${fx - 8}" y="${cy - 12}" font-size="9" font-weight="900" fill="${PBR}">再極化前進</text>`; }
    const elec = `<text x="24" y="${cy + 19}" font-size="13" font-weight="900" fill="${PBB}">−</text><text x="${x0 + N * cw + 5}" y="${cy + 19}" font-size="13" font-weight="900" fill="${PBR}">+</text>`;
    const tb = 150, tx = (k) => 46 + k * (220 / 6), ty = (v) => tb - v * 30;
    let poly = "";
    for (let k = 0; k <= i; k++) poly += (k === 0 ? "M" : "L") + tx(k).toFixed(1) + " " + ty(PB_WAVE_STEPS[k].v).toFixed(1) + " ";
    const dot = `<circle cx="${tx(i).toFixed(1)}" cy="${ty(s.v).toFixed(1)}" r="5" fill="${PBGD}" stroke="#fff" stroke-width="2"/>`;
    return pbSvg("0 0 300 192", `${elec}${cells}${front}
      <rect x="40" y="96" width="240" height="86" rx="8" fill="${PBP}" stroke="#c9bea8"/>
      <line x1="40" y1="${tb}" x2="280" y2="${tb}" stroke="#c9bea8" stroke-width="1.4" stroke-dasharray="4 4"/>
      <path d="${poly}" fill="none" stroke="${PBR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${dot}
      <text x="48" y="110" font-size="10.5" font-weight="900" fill="${PBINK}">正 − 負 = ${Math.round(s.v * 8)}</text>`);
  }

  // AV delay 三機制
  function pbAV(view) {
    if (view === "why") return pbSvg("0 0 300 152", `
      <line x1="30" y1="50" x2="280" y2="50" stroke="${PBINK}" stroke-width="1.6"/><line x1="30" y1="110" x2="280" y2="110" stroke="${PBINK}" stroke-width="1.6"/>
      <text x="4" y="40" font-size="10" font-weight="900">心房</text><text x="4" y="100" font-size="10" font-weight="900">心室</text>
      <rect x="70" y="32" width="14" height="18" fill="${PBB}"/><rect x="150" y="92" width="14" height="18" fill="${PBR}"/>
      <path d="M84 44 C112 60 126 80 150 94" fill="none" stroke="${PBGD}" stroke-width="3" stroke-dasharray="5 4" marker-end="url(#pb-d)"/>
      <text x="92" y="78" font-size="11" font-weight="900" fill="${PBGD}">AV delay＝PR</text>
      <text x="30" y="140" font-size="10.5" font-weight="800" fill="${PBMU}">先讓心房收縮把血灌進心室，心室才收縮。</text>`);
    if (view === "fiber") return pbSvg("0 0 300 152", `
      <path d="M20 78 H100" stroke="${PBR}" stroke-width="20" stroke-linecap="round"/><path d="M100 78 H200" stroke="${PBR}" stroke-width="7" stroke-linecap="round"/><path d="M200 78 H280" stroke="${PBR}" stroke-width="20" stroke-linecap="round"/>
      <text x="42" y="50" font-size="11" font-weight="900">粗·快</text><text x="126" y="50" font-size="11" font-weight="900" fill="${PBR}">細·慢</text><text x="226" y="50" font-size="11" font-weight="900">粗·快</text>
      <text x="150" y="124" font-size="10.5" font-weight="800" fill="${PBMU}" text-anchor="middle">transitional fiber 粗→細→粗，細處傳導慢。</text>`);
    if (view === "k") {
      const ch = [60, 100, 140, 180, 220, 260].map((x) => `<rect x="${x - 5}" y="64" width="10" height="30" rx="3" fill="${PBB}"/><text x="${x}" y="56" font-size="9" font-weight="900" fill="${PBB}" text-anchor="middle">K⁺</text>`).join("");
      return pbSvg("0 0 300 152", `<line x1="30" y1="64" x2="280" y2="64" stroke="${PBINK}" stroke-width="2"/><line x1="30" y1="94" x2="280" y2="94" stroke="${PBINK}" stroke-width="2"/>${ch}<text x="150" y="124" font-size="10.5" font-weight="800" fill="${PBMU}" text-anchor="middle">鉀通道多 → 膜被往負拉、較難去極化 → 變慢。</text>`);
    }
    const cells = [40, 110, 180, 250].map((x) => `<rect x="${x}" y="55" width="56" height="40" rx="8" fill="#f3c7b6" stroke="${PBINK}" stroke-width="2"/>`).join("");
    const gaps = [96, 166, 236].map((x) => `<line x1="${x}" y1="75" x2="${x + 14}" y2="75" stroke="${PBGRN}" stroke-width="4"/>`).join("");
    return pbSvg("0 0 300 152", `${cells}${gaps}<text x="150" y="124" font-size="10.5" font-weight="800" fill="${PBMU}" text-anchor="middle">gap junction 少 → 細胞間接力慢 → 變慢。</text>`);
  }

  // T 波方向：理論該倒 vs 實際向上（黏土）
  function pbTwave(view) {
    const theory = view === "theory";
    const blob = `<path d="M120 30 C70 36 50 90 58 140 C66 188 96 226 120 226 C146 226 176 188 184 140 C192 90 170 36 120 30Z" fill="#f3c7b6" stroke="${PBINK}" stroke-width="2.5"/><text x="121" y="48" font-size="10" font-weight="900" fill="#a23" text-anchor="middle">心室底</text><text x="121" y="218" font-size="10" font-weight="900" fill="#a23" text-anchor="middle">心尖</text>`;
    const depA = `<path d="M158 56 L98 196" stroke="${PBR}" stroke-width="5" marker-end="url(#pb-r)"/><text x="150" y="48" font-size="10.5" font-weight="900" fill="${PBR}">去極化↘</text>`;
    const tbox = (up) => `<rect x="212" y="62" width="138" height="116" rx="10" fill="${PBP}" stroke="#c9bea8"/><line x1="212" y1="120" x2="350" y2="120" stroke="#c9bea8" stroke-dasharray="4 4"/><text x="220" y="78" font-size="11" font-weight="900">Lead II 的 T 波</text><path d="M222 120 H262 ${up ? "C282 120 282 80 300 80 C318 80 318 120 338 120" : "C282 120 282 160 300 160 C318 160 318 120 338 120"}" fill="none" stroke="${PBR}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="300" y="${up ? "70" : "174"}" font-size="11" font-weight="900" fill="${PBR}" text-anchor="middle">T ${up ? "向上" : "向下"}</text>`;
    const repA = theory
      ? `<path d="M98 196 L158 56" stroke="${PBB}" stroke-width="5" stroke-dasharray="8 5" marker-end="url(#pb-b)"/><text x="36" y="150" font-size="10.5" font-weight="900" fill="${PBB}">再極化(反向)</text>`
      : `<path d="M148 200 L126 60" stroke="${PBB}" stroke-width="5" marker-end="url(#pb-b)"/><text x="150" y="216" font-size="10" font-weight="900" fill="${PBB}">再極化(心尖先)</text>`;
    return pbSvg("0 0 360 232", `${blob}${depA}${repA}${tbox(!theory)}`);
  }

  // 射血：快速 1/3 vs 慢速 2/3
  function pbEject(phase) {
    const fast = phase === "fast";
    const curve = "M60 50 C90 58 110 100 120 112 C160 128 230 138 270 140";
    const hi = fast
      ? `<path d="M60 50 C90 58 110 100 120 112" fill="none" stroke="${PBR}" stroke-width="6" stroke-linecap="round"/><rect x="55" y="40" width="68" height="108" fill="${PBR}" opacity=".08"/>`
      : `<path d="M120 112 C160 128 230 138 270 140" fill="none" stroke="${PBB}" stroke-width="6" stroke-linecap="round"/><rect x="120" y="40" width="158" height="108" fill="${PBB}" opacity=".08"/>`;
    return pbSvg("0 0 300 170", `
      <line x1="40" y1="148" x2="285" y2="148" stroke="${PBINK}" stroke-width="2"/><line x1="40" y1="36" x2="40" y2="148" stroke="${PBINK}" stroke-width="2"/>
      <text x="14" y="44" font-size="9" font-weight="800">體積</text><text x="262" y="162" font-size="9" font-weight="800">時間</text>
      <path d="${curve}" fill="none" stroke="${PBMU}" stroke-width="2.5"/>${hi}
      <text x="46" y="48" font-size="9" font-weight="800" fill="${PBGRN}">EDV</text><text x="248" y="134" font-size="9" font-weight="800" fill="${PBB}">ESV</text>
      <text x="150" y="166" font-size="10" font-weight="900" fill="${fast ? PBR : PBB}" text-anchor="middle">${fast ? "前 1/3：快速射血（壓差大、收縮肌多）" : "後 2/3：慢速射血（壓差小、部分心肌休息）"}</text>`);
  }

  // 25 宮格紙速 + 300 法則
  function pb300(n) {
    const big = 42, x0 = 30, y0 = 22, hr = Math.round(300 / n);
    let sm = "";
    for (let i = 0; i <= 30; i++) sm += `<line x1="${x0 + i * big / 5}" y1="${y0}" x2="${x0 + i * big / 5}" y2="${y0 + 88}" stroke="#f7e0da" stroke-width="0.5"/>`;
    let grid = "";
    for (let i = 0; i <= 6; i++) grid += `<line x1="${x0 + i * big}" y1="${y0}" x2="${x0 + i * big}" y2="${y0 + 88}" stroke="#f0c9c0" stroke-width="1.3"/>`;
    for (let j = 0; j <= 2; j++) grid += `<line x1="${x0}" y1="${y0 + j * 44}" x2="${x0 + 6 * big}" y2="${y0 + j * 44}" stroke="#f0c9c0" stroke-width="1.3"/>`;
    const r1 = x0 + big, r2 = x0 + big + n * big;
    const spike = (x) => `<path d="M${x - 8} ${y0 + 80} L${x} ${y0 + 16} L${x + 8} ${y0 + 80}" fill="none" stroke="${PBR}" stroke-width="3" stroke-linejoin="round"/>`;
    return pbSvg("0 0 320 150", `<rect x="${x0}" y="${y0}" width="${6 * big}" height="88" fill="${PBP}"/>${sm}${grid}${spike(r1)}${spike(r2)}
      <line x1="${r1}" y1="${y0 + 100}" x2="${r2}" y2="${y0 + 100}" stroke="${PBGD}" stroke-width="2" marker-start="url(#pb-d)" marker-end="url(#pb-d)"/>
      <text x="${(r1 + r2) / 2}" y="${y0 + 114}" font-size="10" font-weight="900" fill="${PBGD}" text-anchor="middle">${n} 大格</text>
      <text x="${x0}" y="16" font-size="9" font-weight="800" fill="${PBMU}">25 mm/s：一大格 0.2 秒</text>
      <text x="${x0 + 3.4 * big}" y="${y0 + 36}" font-size="14" font-weight="900" fill="${PBR}">HR ≈ ${hr}</text>`);
  }

  const cardioBlocksV2 = [
    [
      (n) => pbHotspots(n, { title: "點四個腔室看它的工作", intro: "右心走肺循環、左心走全身，血繞成 8 字形。", viewBox: "0 0 300 355", base: renderHeartAnatomySvg({}), spots: [
        { x: 112, y: 158, label: "右心房 RA", note: "收全身回來的缺氧血（SVC/IVC），交給右心室。" },
        { x: 118, y: 250, label: "右心室 RV", note: "把缺氧血打到肺動脈、進入肺循環（低壓泵）。" },
        { x: 188, y: 160, label: "左心房 LA", note: "收肺靜脈回來的含氧血，交給左心室。" },
        { x: 190, y: 250, label: "左心室 LV", note: "打到主動脈供應全身；壁最厚以對抗高壓（高壓泵）。" }] }),
      (n) => pbTabs(n, { title: "房室瓣：壓力差決定開關", intro: "三尖瓣(右)、二尖瓣(左)。", tabs: [
        { label: "舒張期 · 瓣開", svg: pbHeart({ focus: "avValves", showFlow: true }), note: "心房壓 > 心室壓 → 房室瓣<b>開</b>，血由心房灌入心室。" },
        { label: "收縮期 · 瓣關", svg: pbHeart({ focus: "avValves" }), note: "心室壓 > 心房壓 → 房室瓣<b>關</b>，產生 S1，避免血回流心房。" }] }),
      (n) => pbTabs(n, { title: "半月瓣：心室與動脈之間的門", intro: "主動脈瓣、肺動脈瓣。", tabs: [
        { label: "射血期 · 瓣開", svg: pbHeart({ focus: "semilunarValves", showFlow: true }), note: "心室壓 > 動脈壓 → 半月瓣<b>開</b>，血射入主動脈／肺動脈。" },
        { label: "舒張期 · 瓣關", svg: pbHeart({ focus: "semilunarValves" }), note: "動脈壓 > 心室壓 → 半月瓣<b>關</b>，產生 S2。" }] }),
      (n) => pbSlider(n, { title: "拖左心室壓，看哪個瓣會開", intro: "設左心房壓≈10、主動脈壓≈80 mmHg。", sliders: [{ key: "lvp", label: "左心室壓 (mmHg)", min: 0, max: 130, value: 20 }], render: ({ lvp }) => {
        const LA = 10, AO = 80, mv = LA > lvp, av = lvp > AO, h = (p) => p / 130 * 116, y = (p) => 150 - h(p);
        const svg = pbSvg("0 0 300 184", `<line x1="20" y1="150" x2="290" y2="150" stroke="#182033" stroke-width="2"/><rect x="40" y="${y(LA)}" width="46" height="${h(LA)}" fill="#86ccea" stroke="#2e5f8d" stroke-width="2"/><text x="46" y="166" font-size="10" font-weight="900">LA ${LA}</text><rect x="128" y="${y(lvp)}" width="46" height="${h(lvp)}" fill="#d4604f" stroke="#bc3f34" stroke-width="2"/><text x="128" y="166" font-size="10" font-weight="900">LV ${lvp}</text><rect x="216" y="${y(AO)}" width="46" height="${h(AO)}" fill="#c5413a" stroke="#bc3f34" stroke-width="2"/><text x="216" y="166" font-size="10" font-weight="900">AO ${AO}</text><circle cx="107" cy="36" r="12" fill="${mv ? "#23694f" : "#9aa3ad"}" stroke="#fffdf7" stroke-width="2"/><text x="96" y="24" font-size="9" font-weight="900">Mitral</text><circle cx="195" cy="36" r="12" fill="${av ? "#23694f" : "#9aa3ad"}" stroke="#fffdf7" stroke-width="2"/><text x="182" y="24" font-size="9" font-weight="900">Aortic</text>`);
        return { svg, note: `二尖瓣：<b>${mv ? "開" : "關"}</b>（LA ${LA} ${mv ? ">" : "≤"} LV ${lvp}）　主動脈瓣：<b>${av ? "開" : "關"}</b>（LV ${lvp} ${av ? ">" : "≤"} AO ${AO}）。瓣膜只看壓差。` };
      } }),
    ],
    [
      (n) => pbTabs(n, { title: "工作心肌 vs 節律傳導系統", intro: "它會放電，但它是心肌不是神經。", tabs: [
        { label: "工作心肌", svg: pbHeart({ focus: "workingMyocardium" }), note: "心房肌＋心室肌，靠 gap junction 同步<b>收縮做工</b>。" },
        { label: "節律 / 傳導", svg: pbHeart({ showConduction: true, focus: "saNode" }), note: "SA→AV→His→束支→Purkinje，<b>產生並傳遞節律</b>（conducting system，本質仍是心肌）。" }] }),
      (n) => pbStepper(n, { title: "傳導順序：點步驟看訊號走到哪", intro: "整條路線方向大致是右上→左下。", steps: [
        { label: "SA", svg: pbHeart({ showConduction: true, focus: "saNode" }), note: "SA node 自發起搏，正常節律起點。" },
        { label: "心房", svg: pbHeart({ showConduction: true, focus: "avNode" }), note: "訊號傳遍心房 → 對應 ECG 的 P 波。" },
        { label: "AV", svg: pbHeart({ showConduction: true, focus: "avDelay" }), note: "AV node 故意延遲（PR interval），讓心房先收縮填充心室。" },
        { label: "His", svg: pbHeart({ showConduction: true, focus: "hisBundle" }), note: "His 束沿室間隔下傳。" },
        { label: "束支", svg: pbHeart({ showConduction: true, focus: "bundleBranches" }), note: "左束支<b>兩條</b>、右束支<b>一條</b>——因為左心室壁更厚，需要更強的同步輸出。" },
        { label: "Purkinje", svg: pbHeart({ showConduction: true, focus: "purkinje" }), note: "Purkinje 末端超多分支、深入厚心室壁，讓心室幾乎同步去極化 → QRS 窄。" }] }),
      (n) => pbTabs(n, { title: "AV delay 為何會慢：三個機制", intro: "老師特別強調的三點。", tabs: [
        { label: "為什麼要慢", svg: pbAV("why"), note: "讓心房先收縮把血灌進心室，心室才收縮 → 對應 ECG 的 PR interval。" },
        { label: "①粗-細-粗", svg: pbAV("fiber"), note: "transitional fiber 纖維<b>粗→細→粗</b>，細的地方傳導慢（細纖維傳得慢）。" },
        { label: "②鉀通道多", svg: pbAV("k"), note: "AV node <b>鉀離子通道多</b>，膜被往負拉、較難去極化，所以慢。" },
        { label: "③gap junction 少", svg: pbAV("gap"), note: "AV node 的 <b>gap junction 較少</b>，細胞間接力比較慢。" }] }),
      (n) => pbTabs(n, { title: "Pre-excitation：訊號繞過 AV 延遲", intro: "重點是 no normal AV delay。", tabs: [
        { label: "正常", svg: pbEcg("M14 72 H44 C52 58 62 58 70 72 H100 L112 72 L122 96 L134 30 L144 92 L154 72 H192 C204 56 218 56 230 72 H292"), note: "PR 正常、無 delta wave。" },
        { label: "WPW", svg: pbEcg("M14 72 H40 C48 58 58 58 66 72 L86 64 L122 96 L134 30 L144 92 L154 72 H192 C204 56 218 56 230 72 H292", "<path d='M66 72 L86 64' stroke='#b8871e' stroke-width='4'/><text x='66' y='58' font-size='10' font-weight='900' fill='#b8871e'>delta</text>"), note: "<b>PR 變短 + delta wave</b>：旁路直接電一般心室肌，起步慢慢爬。" },
        { label: "LGL", svg: pbEcg("M14 72 H36 C44 58 54 58 62 72 H80 L92 72 L102 96 L114 30 L124 92 L134 72 H192 C204 56 218 56 230 72 H292"), note: "<b>PR 變短、無 delta wave</b>：繞過後又回到正常路徑。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "ECG 在記什麼：細胞膜『外』的電位", intro: "非侵入式 → 只能記細胞外。", tabs: [
        { label: "靜止 resting", svg: pbCellOut("rest"), note: "內負外正；體表在細胞外，所以靜止時記到<b>正電</b>。" },
        { label: "去極化", svg: pbCellOut("dep"), note: "內正外負；體表記到<b>負電</b>。整張 ECG 都是記膜外，不是細胞內。" }] }),
      (n) => pbTabs(n, { title: "唯一公式：正極記到 − 負極記到", intro: "每個電極想成『數 4 顆電荷』。", tabs: [
        { label: "靜止", svg: pbCount("rest"), note: "兩極都記到 +4 → 4 − 4 = <b>0</b> → 平線。" },
        { label: "某側去極化", svg: pbCount("dep"), note: "負極下方變負電 → 4 − (−4) = <b>8</b> → 最大正波。" }] }),
      (n) => pbStepper(n, { title: "★把一個波從零一格一格推出來", intro: "去極化掃過去→正波；再極化→倒波。", steps: [0, 1, 2, 3, 4, 5, 6].map((i) => ({ label: ["靜止", "去極化↑", "頂點", "去極化完", "再極化↓", "底點", "完成"][i], svg: pbWaveBuild(i), note: PB_WAVE_NOTES[i] })) }),
      (n) => pbTabs(n, { title: "導程＝看的角度，波形＝向量投影", intro: "導程方向：負極→正極。", tabs: [
        { label: "Lead II", svg: pbLead(60, "#bc3f34"), note: "正極在左下，與正常向量『右上→左下』最同向 → QRS <b>明顯向上</b>，所以監視器最常看 Lead II。" },
        { label: "aVR", svg: pbLead(-150, "#bc3f34"), note: "正極在右上，與向量相反 → 正常 P/QRS/T 多<b>向下</b>。" },
        { label: "朝正極", svg: pbProj(true), note: "電荷移動方向朝向導程正極 → <b>正向波</b>。" },
        { label: "離開正極", svg: pbProj(false), note: "電荷移動方向遠離正極 → <b>負向波</b>；垂直時≈0。" }] }),
      (n) => pbStepper(n, { title: "P、QRS、T 各對應哪一步", intro: "Q 是心中隔(左→右)；心房再極化被 QRS 蓋住。", steps: [
        { label: "P", svg: pbHeartEcg("avNode"), note: "心房去極化 → <b>P 波</b>。" },
        { label: "QRS", svg: pbHeartEcg("purkinje"), note: "心室去極化（His-Purkinje 快速同步）→ <b>窄 QRS</b>；Q 波＝心中隔由左到右去極化。" },
        { label: "T", svg: pbHeartEcg("tWave"), note: "心室再極化 → <b>T 波</b>。心房再極化剛好落在 QRS、被蓋掉看不到。" }] }),
      (n) => pbTabs(n, { title: "T 波為何『該倒卻向上』", intro: "負負得正 ＋ 黏土比喻。", tabs: [
        { label: "理論：該倒", svg: pbTwave("theory"), note: "再極化方向和去極化相反 → 投影到 Lead II <b>理論上該是倒的</b>。" },
        { label: "實際：向上", svg: pbTwave("actual"), note: "心室強力收縮(壓力大像壓黏土)，心尖較不受壓<b>先再極化</b> → 向量再翻一次 → <b>T 向上（負負得正）</b>。" }] }),
      (n) => pbSlider(n, { title: "判讀工具：紙速 25mm/s 與 300 法則", intro: "拖兩個 R 之間的大格數。", sliders: [{ key: "n", label: "R-R 大格數", min: 1, max: 5, value: 4 }], render: ({ n }) => ({ svg: pb300(n), note: `心率 ≈ 300 ÷ ${n} = <b>${Math.round(300 / n)} bpm</b>。一大格 0.2 秒、一小格 0.04 秒；縱軸兩大格 = 1 mV。` }) }),
    ],
    [
      (n) => pbStepper(n, { title: "四個瓣膜事件：點步驟切段", intro: "第一個動作是二尖瓣『關』。", steps: [
        { label: "MC", svg: pbCycle(0), note: "二尖瓣關(MC)：一開始兩瓣狀態沒變，這是第一個真正的動作；等容收縮開始、LV 壓快速上升。" },
        { label: "AO", svg: pbCycle(1), note: "主動脈瓣開(AO)：LV 壓 > 主動脈壓，射血開始。" },
        { label: "AC", svg: pbCycle(2), note: "主動脈瓣關(AC)：LV 壓 < 主動脈壓，射血結束、等容舒張開始。" },
        { label: "MO", svg: pbCycle(3), note: "二尖瓣開(MO)：LV 壓 < 左心房壓，心室填充開始，回到 EDV。" }] }),
      (n) => pbTabs(n, { title: "等容積期：體積不變、只有壓力動", tabs: [
        { label: "等容收縮", svg: pbVol(120, "up"), note: "兩瓣<b>都關</b> → 體積不變(高點 EDV)，壓力快速<b>升</b>。" },
        { label: "射血", svg: pbVol(70, "down"), note: "主動脈瓣開 → 體積<b>下降</b>(EDV→ESV)。" },
        { label: "等容舒張", svg: pbVol(50, "down"), note: "兩瓣<b>都關</b> → 體積不變(低點 ESV)，壓力快速<b>降</b>。" },
        { label: "填充", svg: pbVol(120, "up"), note: "二尖瓣開 → 體積<b>上升</b>回 EDV（屬舒張期）。" }] }),
      (n) => pbTabs(n, { title: "射血不是等速：快速 1/3 + 慢速 2/3", intro: "兩段都還在收縮期。", tabs: [
        { label: "前 1/3 快速", svg: pbEject("fast"), note: "剛 AO 時壓差最大、收縮肌最多 → <b>快速射血</b>，體積掉得快。" },
        { label: "後 2/3 慢速", svg: pbEject("slow"), note: "壓差變小、部分心肌進入 resting → <b>慢速射血</b>；仍屬收縮期，不是舒張。" }] }),
      (n) => pbSlider(n, { title: "拖 EDV / ESV，算 SV 與 EF", sliders: [{ key: "edv", label: "EDV (mL)", min: 90, max: 160, value: 120 }, { key: "esv", label: "ESV (mL)", min: 30, max: 100, value: 50 }], render: ({ edv, esv }) => {
        const sv = Math.max(0, edv - esv), ef = Math.round(sv / edv * 100);
        const bar = (x, v, c, lab) => `<rect x="${x}" y="${150 - v}" width="50" height="${v}" fill="${c}" stroke="#182033" stroke-width="1.5"/><text x="${x}" y="166" font-size="10" font-weight="900">${lab}</text>`;
        const svg = pbSvg("0 0 300 184", `<line x1="20" y1="150" x2="280" y2="150" stroke="#182033" stroke-width="2"/>${bar(40, edv, "#23694f44", "EDV " + edv)}${bar(120, esv, "#2e5f8d44", "ESV " + esv)}${bar(210, sv, "#bc3f3444", "SV " + sv)}`);
        return { svg, note: `SV = EDV − ESV = ${edv} − ${esv} = <b>${sv} mL</b>；射出分率 EF = SV/EDV ≈ <b>${ef}%</b>。Systole＝MC→AC、Diastole＝AC→下一個 MC。` };
      } }),
    ],
    [
      (n) => pbStepper(n, { title: "S1、S2 落在心動週期哪裡", steps: [
        { label: "S1 (lub)", svg: pbSound(0), note: "S1：房室瓣(二尖/三尖)關閉，<b>收縮期開始</b>。" },
        { label: "S2 (dub)", svg: pbSound(1), note: "S2：半月瓣(主動脈/肺動脈)關閉，<b>收縮期結束</b>。" }] }),
      (n) => pbTabs(n, { title: "S3、S4 的位置與意義", tabs: [
        { label: "S3", svg: pbSound(2), note: "S3：<b>舒張早期</b>快速填充，常見容量負荷↑／心衰。" },
        { label: "S4", svg: pbSound(3), note: "S4：<b>舒張末期</b>心房收縮撞上僵硬心室，常見肥厚／順應性下降。" }] }),
      (n) => pbSlider(n, { title: "CO = HR × SV：拖兩個滑桿", intro: "運動員 HR 慢但 SV 大，CO 仍正常。", sliders: [{ key: "hr", label: "心率 HR (bpm)", min: 40, max: 180, value: 70 }, { key: "sv", label: "每搏量 SV (mL)", min: 40, max: 120, value: 70 }], render: ({ hr, sv }) => {
        const co = (hr * sv / 1000).toFixed(1);
        const svg = pbSvg("0 0 300 150", `<rect x="20" y="40" width="80" height="60" rx="10" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="2"/><text x="34" y="76" font-size="13" font-weight="900">HR ${hr}</text><text x="112" y="78" font-size="20" font-weight="900">×</text><rect x="134" y="40" width="84" height="60" rx="10" fill="#b8871e22" stroke="#b8871e" stroke-width="2"/><text x="148" y="76" font-size="13" font-weight="900">SV ${sv}</text><text x="226" y="78" font-size="20" font-weight="900">=</text><rect x="244" y="36" width="52" height="68" rx="10" fill="#bc3f3422" stroke="#bc3f34" stroke-width="2"/><text x="250" y="72" font-size="13" font-weight="900">${co}</text><text x="248" y="120" font-size="10" font-weight="900">L/min</text>`);
        return { svg, note: `心輸出量 CO = ${hr} × ${sv} = <b>${co} L/min</b>。${hr < 60 && sv >= 90 ? "（像運動員：HR 慢但 SV 大，CO 仍夠。）" : ""}` };
      } }),
      (n) => pbTabs(n, { title: "用三個負荷推藥理情境", intro: "preload / afterload / contractility。", tabs: [
        { label: "Preload ↑", svg: pbLoad("pre"), note: "前負荷↑(靜脈回流↑) → EDV↑ → 依 Frank-Starling，<b>SV↑、CO↑</b>。" },
        { label: "Afterload ↑", svg: pbLoad("after"), note: "後負荷↑(動脈壓↑) → 射血變難 → ESV↑ → <b>SV↓</b>。" },
        { label: "Contractility ↑", svg: pbLoad("contr"), note: "收縮力↑(細胞內 Ca²⁺↑) → ESV↓ → <b>SV↑、CO↑</b>。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "繞 PV loop 一圈：面積＝心臟做功", intro: "四條邊＝心動週期四期。", steps: [
        { label: "填充", svg: pbPVphase(0), note: "二尖瓣開，體積 ESV→EDV（底邊，向右）。" },
        { label: "等容收縮", svg: pbPVphase(1), note: "兩瓣關，壓力上升（右邊，向上）。" },
        { label: "射血", svg: pbPVphase(2), note: "主動脈瓣開，體積 EDV→ESV（頂邊，向左）。" },
        { label: "等容舒張", svg: pbPVphase(3), note: "兩瓣關，壓力下降（左邊，向下）。loop 圍出的<b>面積＝外做功</b>、寬度＝SV。" }] }),
      (n) => pbSlider(n, { title: "拖前負荷(EDV)，看 loop 變化", sliders: [{ key: "edv", label: "前負荷 EDV (mL)", min: 100, max: 160, value: 120 }], render: ({ edv }) => ({ svg: pbPV(edv, 50, 118), note: `前負荷↑ → EDV 右移、loop 變寬 → <b>SV = ${edv - 50} mL ↑</b>（Frank-Starling）。` }) }),
      (n) => pbSlider(n, { title: "拖後負荷，看 ESV 與 SV", sliders: [{ key: "af", label: "後負荷 (主動脈壓 mmHg)", min: 80, max: 150, value: 90 }], render: ({ af }) => { const esv = Math.round(50 + (af - 90) * 0.6); return { svg: pbPV(120, esv, Math.round(af * 0.95)), note: `後負荷↑ → 射血變難、ESV 右移 → <b>SV = ${120 - esv} mL ↓</b>，loop 變高變窄。` }; } }),
      (n) => pbSlider(n, { title: "拖收縮力，看 ESV 與 SV", sliders: [{ key: "c", label: "收縮力 (相對 1–5)", min: 1, max: 5, value: 3 }], render: ({ c }) => { const esv = Math.round(74 - c * 8); return { svg: pbPV(120, esv, 108 + c * 4), note: `收縮力↑ → ESV 左移(更會排空) → <b>SV = ${120 - esv} mL ↑</b>。` }; } }),
    ],
  ];

  // ===== test2 重編：內分泌 / 生殖 全新互動圖 =====
  function pb2col(leftHead, rightHead, rows, hi) {
    const rowH = 28, top = 44, xl = 156, xr = 312, wcol = 150, H = top + rows.length * rowH + 6;
    let b = `<rect x="${xl}" y="0" width="${wcol}" height="${H}" fill="${hi === 0 ? "#bc3f3410" : "none"}"/><rect x="${xr}" y="0" width="${wcol}" height="${H}" fill="${hi === 1 ? "#23694f12" : "none"}"/>`;
    b += `<rect x="${xl}" y="6" width="${wcol}" height="30" rx="6" fill="${hi === 0 ? PBR : PBMU}"/><text x="${xl + wcol / 2}" y="26" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">${leftHead}</text>`;
    b += `<rect x="${xr}" y="6" width="${wcol}" height="30" rx="6" fill="${hi === 1 ? PBGRN : PBMU}"/><text x="${xr + wcol / 2}" y="26" font-size="12" font-weight="900" fill="#fff" text-anchor="middle">${rightHead}</text>`;
    rows.forEach((r, i) => { const y = top + i * rowH; b += `<text x="6" y="${y + 18}" font-size="11" font-weight="900" fill="${PBINK}">${r[0]}</text><text x="${xl + wcol / 2}" y="${y + 18}" font-size="10.5" fill="${PBINK}" text-anchor="middle">${r[1]}</text><text x="${xr + wcol / 2}" y="${y + 18}" font-size="10.5" fill="${PBINK}" text-anchor="middle">${r[2]}</text><line x1="2" y1="${y + rowH - 4}" x2="466" y2="${y + rowH - 4}" stroke="#000" stroke-opacity=".06"/>`; });
    return pbSvg(`0 0 470 ${H}`, b);
  }
  function pbRecCell(sol) {
    const water = sol === "water";
    const cell = `<rect x="60" y="52" width="240" height="92" rx="16" fill="#eef3f8" stroke="${PBINK}" stroke-width="2.5"/><ellipse cx="180" cy="98" rx="44" ry="28" fill="#dfeaf4" stroke="${PBB}" stroke-width="2"/><text x="180" y="102" font-size="10" font-weight="800" fill="${PBB}" text-anchor="middle">細胞核</text>`;
    let extra;
    if (water) extra = `<circle cx="180" cy="34" r="9" fill="${PBR}"/><text x="180" y="22" font-size="10" font-weight="900" fill="${PBR}" text-anchor="middle">水溶荷爾蒙</text><rect x="168" y="46" width="24" height="10" rx="3" fill="${PBR}"/><text x="232" y="50" font-size="9" font-weight="900" fill="${PBR}">膜受體</text><path d="M180 56 C214 70 214 84 188 96" fill="none" stroke="${PBGD}" stroke-width="2.5" marker-end="url(#pb-d)"/><text x="236" y="84" font-size="9" font-weight="800" fill="${PBGD}">二級傳訊</text>`;
    else extra = `<circle cx="96" cy="30" r="9" fill="${PBGRN}"/><text x="96" y="20" font-size="10" font-weight="900" fill="${PBGRN}" text-anchor="middle">脂溶荷爾蒙</text><path d="M100 38 L168 92" stroke="${PBGRN}" stroke-width="2.5" marker-end="url(#pb-d)"/><text x="180" y="135" font-size="10" font-weight="900" fill="${PBB}" text-anchor="middle">核內受體 → 調 DNA</text>`;
    return pbSvg("0 0 360 158", cell + extra);
  }
  function pbTwoCell(hi) {
    const tOn = hi === 0, gOn = hi === 1;
    return pbSvg("0 0 430 176", `
      <rect x="18" y="46" width="160" height="104" rx="12" fill="${tOn ? "#fdeee9" : "#fff"}" stroke="${PBR}" stroke-width="${tOn ? 3.5 : 2}"/>
      <text x="98" y="40" font-size="12" font-weight="900" fill="${PBR}" text-anchor="middle">Theca cell</text>
      <text x="98" y="74" font-size="11" font-weight="800" text-anchor="middle">LH ↓</text>
      <text x="98" y="120" font-size="13" font-weight="900" fill="${PBR}" text-anchor="middle">雄性素</text>
      <rect x="252" y="46" width="160" height="104" rx="12" fill="${gOn ? "#eef6f0" : "#fff"}" stroke="${PBGRN}" stroke-width="${gOn ? 3.5 : 2}"/>
      <text x="332" y="40" font-size="12" font-weight="900" fill="${PBGRN}" text-anchor="middle">Granulosa cell</text>
      <text x="332" y="72" font-size="11" font-weight="800" text-anchor="middle">FSH ↓</text>
      <text x="332" y="96" font-size="10" font-weight="800" fill="#6552a3" text-anchor="middle">aromatase</text>
      <text x="332" y="122" font-size="13" font-weight="900" fill="${PBGRN}" text-anchor="middle">雌激素</text>
      <path d="M178 116 H250" stroke="#6552a3" stroke-width="4" marker-end="url(#pb-d)"/><text x="214" y="108" font-size="9" font-weight="800" fill="#6552a3" text-anchor="middle">送過去</text>`);
  }

  const HORMONE_ROWS = [["前驅物", "前驅多肽", "膽固醇"], ["溶解度", "水溶", "脂溶"], ["血中型態", "不結合", "蛋白結合"], ["半衰期", "短(分鐘)", "長(小時)"], ["儲存", "分泌顆粒", "不儲存"], ["受體", "細胞膜", "細胞核內"], ["訊號", "二級傳訊", "調控 DNA"], ["作用時間", "快(秒)", "慢(分~天)"], ["口服", "不可", "可"]];
  const GONAD_ROWS = [["配子", "精子", "卵"], ["保母 nurse", "Sertoli", "granulosa"], ["做類固醇", "Leydig", "theca/gr."]];
  const EICO = [{ label: "膜磷脂", color: PBGD }, { label: "AA20:4", color: PBR }, { label: "PG/LT", color: PBGRN }];
  const INSULIN = [{ label: "養分↑", color: PBGD }, { label: "胰島素", color: PBR }, { label: "肝肌脂", color: PBGRN }, { label: "血糖↓", color: PBB }];
  const GAMETE_S = [{ label: "精原2n", color: PBB }, { label: "初級2n", color: PBB }, { label: "次級1n", color: PBR }, { label: "精細胞", color: PBR }, { label: "精子", color: PBGRN }];
  const GAMETE_O = [{ label: "卵原2n", color: PBB }, { label: "初級", color: PBB }, { label: "次級", color: PBR }, { label: "卵子", color: PBGRN }];
  const STEROID = [{ label: "膽固醇", color: PBGD }, { label: "孕烯醇", color: PBGD }, { label: "雄性素", color: PBR }, { label: "睪固酮", color: PBR }, { label: "雌二醇", color: PBGRN }];
  const ESTR = [{ label: "E2", color: PBGRN }, { label: "E1", color: PBGD }, { label: "E3", color: PBR }, { label: "尿", color: PBB }];
  const AXIS = [{ label: "下視丘", color: PBB }, { label: "腦垂體", color: PBR }, { label: "性腺", color: PBGRN }];
  const SEXDET = [{ label: "基因", color: PBB }, { label: "性腺", color: PBR }, { label: "外觀", color: PBGRN }];

  const endocrineBlocksV2 = [
    [
      (n) => pbTabs(n, { title: "荷爾蒙的共同特性", tabs: [
        { label: "走血液", svg: pbText("由血液運送\n到遠處作用", PBR), note: "內分泌腺把荷爾蒙丟進血液，送到帶受體的目標細胞。" },
        { label: "量極微", svg: pbText("10⁻⁶ ~ 10⁻¹²\ng / ml 血漿", PBGD), note: "血中濃度極低，靠高親和力受體就能生效。" },
        { label: "靠受體", svg: pbText("有受體才有效\n>200 種荷爾蒙", PBGRN), note: "有沒有作用看『有沒有受體』，不是看濃度。" },
        { label: "作用時間", svg: pbText("毫秒 → 數天\n半衰期 t½", PBB), note: "作用時間從毫秒到數天；t½ 決定作用久不久。" }] }),
      (n) => pbTabs(n, { title: "溶解度決定受體位置", intro: "先問水溶還是脂溶。", tabs: [
        { label: "水溶→膜受體", svg: pbRecCell("water"), note: "水溶（蛋白質/胺類）過不了膜 → 用<b>細胞膜受體＋二級傳訊</b> → 快、短。" },
        { label: "脂溶→核受體", svg: pbRecCell("lipid"), note: "脂溶（類固醇）能穿膜 → 用<b>核內受體調 DNA</b> → 慢、長。" }] }),
      (n) => pbTabs(n, { title: "★蛋白質類 vs 類固醇類（點欄位看重點）", tabs: [
        { label: "蛋白質類", svg: pb2col("蛋白質類", "類固醇類", HORMONE_ROWS, 0), note: "水溶：膜受體、二級傳訊、t½ 短、存顆粒、作用快、<b>不可口服</b>。" },
        { label: "類固醇類", svg: pb2col("蛋白質類", "類固醇類", HORMONE_ROWS, 1), note: "脂溶：核內受體調 DNA、t½ 長、不儲存、作用慢、<b>可口服</b>。" }] }),
      (n) => pbStepper(n, { title: "Eicosanoids 從哪來", steps: [
        { label: "膜磷脂", svg: pbChain(EICO, 0), note: "原料藏在細胞膜的磷脂裡。" },
        { label: "花生四烯酸", svg: pbChain(EICO, 1), note: "需要時切下 arachidonic acid（20 碳、20:4 ω6）。" },
        { label: "前列腺素等", svg: pbChain(EICO, 2), note: "做成 PG 等 eicosanoids，<b>就近局部作用</b>。" }] }),
    ],
    [
      (n) => pbSlider(n, { title: "拖失血%，看 ADH 怎麼變", intro: "血量↓約 8-10% 才陡升。", sliders: [{ key: "loss", label: "血量下降 (%)", min: 0, max: 20, value: 0 }], render: ({ loss }) => {
        const fa = (l) => l < 8 ? 2 + l * 0.45 : 2 + 8 * 0.45 + (l - 8) * 3.2;
        const adh = fa(loss), X0 = 40, X1 = 282, Y0 = 128, Y1 = 22, xx = (l) => X0 + (l / 20) * (X1 - X0), yy = (a) => Y0 - (Math.min(a, 45) / 45) * (Y0 - Y1);
        let d = ""; for (let l = 0; l <= 20; l++) d += (l === 0 ? "M" : "L") + xx(l).toFixed(0) + " " + yy(fa(l)).toFixed(0) + " ";
        const svg = pbSvg("0 0 300 150", `<line x1="${X0}" y1="${Y0}" x2="${X1}" y2="${Y0}" stroke="#182033" stroke-width="1.5"/><line x1="${X0}" y1="${Y1}" x2="${X0}" y2="${Y0}" stroke="#182033" stroke-width="1.5"/><text x="16" y="26" font-size="9" font-weight="800">ADH</text><text x="248" y="146" font-size="9" font-weight="800">失血%</text><line x1="${xx(8)}" y1="${Y1}" x2="${xx(8)}" y2="${Y0}" stroke="${PBMU}" stroke-dasharray="3 3"/><text x="${xx(8)}" y="${Y1 + 6}" font-size="8" fill="${PBMU}" text-anchor="middle">~8%</text><path d="${d}" fill="none" stroke="${PBB}" stroke-width="2.5"/><circle cx="${xx(loss)}" cy="${yy(adh)}" r="5" fill="${PBR}" stroke="#fff" stroke-width="2"/>`);
        return { svg, note: `失血 ${loss}% → 血漿 ADH ≈ ${adh.toFixed(0)} pg/ml。${loss >= 8 ? "<b>超過 ~8-10%，ADH 陡升</b>（baroreceptor 偵測：頸動脈竇/主動脈弓/左心房）。" : "小變化時 ADH 變化不大。"}` };
      } }),
      (n) => pbTabs(n, { title: "改變 ADH 分泌的因素", tabs: [
        { label: "↑ 壓力/痛/恐懼", svg: pbText("運動·壓力\n痛·恐懼\n→ ADH ↑", PBR), note: "也會走 CRH-ACTH-cortisol↑。♀>♂、年長>年輕、黃體期/孕期門檻↓也較易釋放 ADH。" },
        { label: "↓ 酒精", svg: pbText("酒精\n抑制 ADH 分泌", PBB), note: "ADH↓ → 多尿、脫水。" },
        { label: "↓ 咖啡因", svg: pbText("咖啡因\n阻斷腎 V2 受體", PBGD), note: "不是抑制分泌，而是擋住 ADH 在集尿管的 V2 受體 → 利尿。" }] }),
      (n) => pbStepper(n, { title: "Insulin：降血糖、把養分收進倉庫", steps: [
        { label: "養分↑", svg: pbChain(INSULIN, 0), note: "餐後血中葡萄糖、胺基酸、脂肪酸上升。" },
        { label: "胰島素", svg: pbChain(INSULIN, 1), note: "刺激胰島素分泌。" },
        { label: "三大倉庫", svg: pbChain(INSULIN, 2), note: "肝、骨骼肌、脂肪把養分攝取、儲存。" },
        { label: "血糖↓", svg: pbChain(INSULIN, 3), note: "血中養分回降 → 降血糖（負回饋迴路）。" }] }),
      (n) => pbTabs(n, { title: "Insulin 是蛋白質類", tabs: [
        { label: "為何要打針", svg: pbText("蛋白質類·水溶\n口服會被消化\n→ 需注射", PBR), note: "胰島素是蛋白質類荷爾蒙，口服會被消化酵素分解，所以糖尿病要注射。" },
        { label: "三大標的", svg: pbText("肝 · 骨骼肌\n· 脂肪組織", PBGRN), note: "促進這三大組織攝取葡萄糖、脂肪酸、胺基酸並儲存。" }] }),
    ],
  ];

  const reproductionBlocksV2 = [
    [
      (n) => pbTabs(n, { title: "性腺的兩大功能", tabs: [
        { label: "配子工廠", svg: pbText("產生配子\n精子 / 卵", PBR), note: "生殖功能：germ cell production & maturation。" },
        { label: "類固醇工廠", svg: pbText("做性類固醇\nsteroid factory", PBGRN), note: "內分泌功能：睪固酮 / 雌激素 / 黃體素。" }] }),
      (n) => pbTabs(n, { title: "★男女對照表（點看對應）", tabs: [
        { label: "睪丸", svg: pb2col("睪丸", "卵巢", GONAD_ROWS, 0), note: "germ＝精子、nurse＝Sertoli、steroid＝Leydig。" },
        { label: "卵巢", svg: pb2col("睪丸", "卵巢", GONAD_ROWS, 1), note: "germ＝卵、nurse＝granulosa、steroid＝theca/granulosa。" }] }),
      (n) => pbStepper(n, { title: "性別三關卡：SRY 是開關", steps: [
        { label: "基因", svg: pbChain(SEXDET, 0), note: "染色體性別：有沒有 Y（上面的 SRY）。" },
        { label: "性腺", svg: pbChain(SEXDET, 1), note: "<b>SRY(TDF) → 睪丸</b>；無 SRY → 卵巢。" },
        { label: "外觀", svg: pbChain(SEXDET, 2), note: "睪丸分泌睪固酮/AMH → 男性外觀；無則女性。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "Spermatogenesis：1→4、連續", steps: [
        { label: "精原2n", svg: pbChain(GAMETE_S, 0), note: "spermatogonium(2n)，青春期後持續一生。" },
        { label: "初級2n", svg: pbChain(GAMETE_S, 1), note: "primary spermatocyte(2n)。" },
        { label: "次級1n", svg: pbChain(GAMETE_S, 2), note: "第一次減數分裂後 2n→<b>1n</b>。" },
        { label: "精細胞", svg: pbChain(GAMETE_S, 3), note: "spermatid(1n)，第二次減數分裂後。" },
        { label: "精子", svg: pbChain(GAMETE_S, 4), note: "分化成 spermatozoa；<b>1 個精原 → 4 個精子</b>。" }] }),
      (n) => pbStepper(n, { title: "Oogenesis：1→1、停滯兩次", steps: [
        { label: "卵原2n", svg: pbChain(GAMETE_O, 0), note: "oogonia(2n)，胎兒期就分裂、數量出生即定。" },
        { label: "初級(停)", svg: pbChain(GAMETE_O, 1), note: "停在 <b>prophase I</b>，到排卵前才完成第一次減數分裂。" },
        { label: "次級(停)", svg: pbChain(GAMETE_O, 2), note: "排卵時進行、停在 <b>metaphase II</b>。" },
        { label: "卵子", svg: pbChain(GAMETE_O, 3), note: "<b>受精</b>才完成第二次減數分裂 → 1 卵＋極體。" }] }),
      (n) => pbTabs(n, { title: "精子 vs 卵子 對照", tabs: [
        { label: "精子", svg: pbText("1 → 4\n連續·無停滯\n~70-80 天", PBB), note: "追求數量，青春期後一輩子持續。" },
        { label: "卵子", svg: pbText("1 → 1 ＋極體\n停滯兩次\n~28 天週期", PBR), note: "靠停滯把資源集中給一顆卵，卡在排卵與受精。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "Steroidogenesis：膽固醇一路改造", steps: [
        { label: "膽固醇", svg: pbChain(STEROID, 0), note: "所有性類固醇的共同原料。" },
        { label: "孕烯醇酮", svg: pbChain(STEROID, 1), note: "pregnenolone（經 3β-HSD 等）。" },
        { label: "雄性素", svg: pbChain(STEROID, 2), note: "androstenedione 等。" },
        { label: "睪固酮", svg: pbChain(STEROID, 3), note: "testosterone（17β-HSD）。" },
        { label: "雌二醇", svg: pbChain(STEROID, 4), note: "estradiol（<b>aromatase</b> 把雄性素變雌激素）。" }] }),
      (n) => pbTabs(n, { title: "睪固酮的兩條加工", tabs: [
        { label: "5α→DHT", svg: pbText("睪固酮\n5α-還原酶 ↓\nDHT（強約 3 倍）", PBR), note: "DHT 主導男性二級性徵；作用組織如毛囊、前列腺。" },
        { label: "aromatase→E2", svg: pbText("雄性素\naromatase ↓\n雌二醇 E2", PBGRN), note: "芳香酶把雄性素變雌激素（two-cell 的關鍵步驟）。" }] }),
      (n) => pbStepper(n, { title: "雌激素代謝：E2→E1→E3→尿", steps: [
        { label: "E2", svg: pbChain(ESTR, 0), note: "estradiol，活性最強。" },
        { label: "E1", svg: pbChain(ESTR, 1), note: "E2 ⇌ E1 由 <b>17β-HSD</b> 互換。" },
        { label: "E3", svg: pbChain(ESTR, 2), note: "再代謝成 estriol（活性最弱）。" },
        { label: "尿", svg: pbChain(ESTR, 3), note: "E3 由<b>尿液</b>排出（孕期可測尿 E3）。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "HPG / HPO 軸", steps: [
        { label: "下視丘", svg: pbChain(AXIS, 0), note: "分泌 GnRH（經門脈血管）。" },
        { label: "腦垂體", svg: pbChain(AXIS, 1), note: "前葉分泌 LH、FSH（gonadotropin）。" },
        { label: "性腺", svg: pbChain(AXIS, 2), note: "做性類固醇＋配子；產物回頭<b>負回饋</b>。inhibin 抑 FSH。" }] }),
      (n) => pbTabs(n, { title: "Two-cell theory（點看分工）", tabs: [
        { label: "Theca（LH）", svg: pbTwoCell(0), note: "LH → theca cell → <b>雄性素</b>（半成品）。" },
        { label: "Granulosa（FSH）", svg: pbTwoCell(1), note: "雄性素送進 granulosa，FSH 誘導 <b>aromatase → 雌激素</b>。" }] }),
      (n) => pbTabs(n, { title: "雌激素回饋：唯一的例外", tabs: [
        { label: "平常：負回饋", svg: pbText("雌激素 低/短\n→ 負回饋\n踩煞車", PBB), note: "多數時候雌激素抑制下視丘/腦下垂體。" },
        { label: ">48hr：正回饋", svg: pbText("雌激素 高>48hr\n→ 正回饋\nLH 爆發→排卵", PBR), note: "持續高濃度才翻成正回饋，引發 LH surge 與排卵（內分泌少見的正回饋）。" }] }),
    ],
  ];

  // ===== test2 重編：泌尿全新互動圖（沿用既有泌尿積木 pbUrine/pbNeph/pbBarrier/pbAldo 等，按新章節重組）=====
  const EVOL = [{ label: "過濾", color: PBB }, { label: "回收鹽", color: PBGRN }, { label: "回收水", color: PBB }, { label: "拉長小管", color: PBR }];
  const TUBE = [{ label: "鮑氏囊", color: PBB }, { label: "近曲", color: PBB }, { label: "亨利環", color: PBGD }, { label: "遠曲", color: PBR }, { label: "集尿管", color: PBGRN }];
  const KIDNEY_BASE = `<path d="M150 20 C90 30 70 90 70 96 C70 102 90 162 150 172 C158 120 158 72 150 20Z" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="2.5"/><path d="M150 40 C112 50 100 90 100 96 C100 102 112 142 150 152 C156 116 156 76 150 40Z" fill="#b8871e22" stroke="#b8871e" stroke-width="2"/><path d="M150 70 C136 80 132 92 132 96 C132 100 136 112 150 122Z" fill="#fffdf7" stroke="#182033" stroke-width="1.5"/>`;
  const GLOM_BASE = `<circle cx="150" cy="92" r="46" fill="url(#tissue-red)" stroke="#bc3f34" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${128 + (i % 3) * 24}" cy="${74 + Math.floor(i / 3) * 30}" r="11" fill="#fffdf7" stroke="#bc3f34" stroke-width="2"/>`).join("")}<path d="M36 80 C78 76 96 84 104 90" stroke="#2e5f8d" stroke-width="9" marker-end="url(#pb-b)" fill="none"/><path d="M196 92 C222 86 244 82 270 82" stroke="#bc3f34" stroke-width="6" marker-end="url(#pb-r)" fill="none"/>`;
  const JGA_BASE = `<path d="M24 58 C76 54 120 70 152 96" stroke="#2e5f8d" stroke-width="11" fill="none" stroke-linecap="round"/><circle cx="150" cy="100" r="22" fill="#23694f22" stroke="#23694f" stroke-width="2.5"/><rect x="58" y="120" width="190" height="20" rx="8" fill="#b8871e18" stroke="#b8871e" stroke-width="2"/>`;

  const urinaryBlocksV2 = [
    [
      (n) => pbStepper(n, { title: "演化推出腎臟：一步步逼出構造", intro: "From Fish to Philosopher。", steps: [
        { label: "過濾", svg: pbChain(EVOL, 0), note: "最早只有沒選擇性的<b>過濾</b> → 演化出腎絲球。" },
        { label: "回收鹽", svg: pbChain(EVOL, 1), note: "進淡水鹽變珍貴 → 長出小管<b>重吸收 NaCl</b>。" },
        { label: "回收水", svg: pbChain(EVOL, 2), note: "上陸要省水：<b>吸 Na 水跟著回收</b>。" },
        { label: "拉長小管", svg: pbChain(EVOL, 3), note: "把小管<b>拉長</b> → 接觸久、面積大 → 重吸收更有效率，就成了今天的腎臟。" }] }),
      (n) => pbTabs(n, { title: "腎臟小兵立大功", tabs: [
        { label: "血流佔比", svg: pbFraction(0.25, "腎血流 ≈ 25% 心輸出"), note: "雙腎只佔體重 ~0.5%，卻拿 <b>~20-25% 心輸出量</b>，高血流高耗氧。" },
        { label: "分區", svg: pbSvg("0 0 300 192", KIDNEY_BASE + `<text x="78" y="100" font-size="10" font-weight="900" fill="#2e5f8d" text-anchor="middle">皮質</text><text x="116" y="100" font-size="10" font-weight="900" fill="#b8871e" text-anchor="middle">髓質</text><text x="150" y="100" font-size="8" font-weight="900" text-anchor="middle">盂</text>`), note: "由外到內：cortex 皮質 → medulla 髓質 → pelvis 腎盂 → 接 ureter。" }] }),
      (n) => pbStepper(n, { title: "三大功能：一滴血漿的旅程", steps: [
        { label: "過濾", svg: pbUrine(0), note: "血漿在腎絲球被<b>濾過</b>進 Bowman capsule。" },
        { label: "重吸收", svg: pbUrine(1), note: "小管把有用的（水、Na⁺、葡萄糖）<b>回收</b>回血液。" },
        { label: "分泌", svg: pbUrine(2), note: "把多餘 / 有毒物質<b>分泌</b>進小管腔。" },
        { label: "排出", svg: pbUrine(3), note: "剩下的成為<b>尿液</b>。尿＝濾過 − 重吸收 ＋ 分泌。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "泌尿道：尿液一路往外", steps: [
        { label: "腎臟", svg: pbChain(URET, 0), note: "腎臟<b>形成尿液</b>。" },
        { label: "輸尿管", svg: pbChain(URET, 1), note: "輸尿管把尿往下送。（以此為界分上/下泌尿系統）" },
        { label: "膀胱", svg: pbChain(URET, 2), note: "膀胱<b>儲存</b>尿液。" },
        { label: "尿道", svg: pbChain(URET, 3), note: "經尿道<b>排出</b>體外。" }] }),
      (n) => pbTabs(n, { title: "兩大類腎元分工不同", tabs: [
        { label: "Cortical", svg: pbNeph(false, "peri"), note: "<b>多數</b>腎元；loop 短、留在皮質，主責重吸收/分泌，旁邊是 peritubular。" },
        { label: "Juxtamedullary", svg: pbNeph(true, "vasa"), note: "loop <b>長、深入髓質</b>，主責<b>濃縮稀釋</b>，旁邊是 vasa recta。" }] }),
      (n) => pbStepper(n, { title: "小管系統＋糖葫蘆", intro: "集尿管像插糖葫蘆的木樁。", steps: [
        { label: "鮑氏囊", svg: pbChain(TUBE, 0), note: "Bowman's capsule，接收濾液。" },
        { label: "近曲", svg: pbChain(TUBE, 1), note: "近曲小管 PCT。" },
        { label: "亨利環", svg: pbChain(TUBE, 2), note: "loop of Henle（下行/上行）。" },
        { label: "遠曲", svg: pbChain(TUBE, 3), note: "遠曲小管 DCT。" },
        { label: "集尿管", svg: pbChain(TUBE, 4), note: "<b>集尿管像木樁，一根插很多串糖葫蘆</b>（收集多個腎元）→ 不算單一腎元。" }] }),
      (n) => pbTabs(n, { title: "出球小動脈接到哪？", intro: "冷凍實驗：髓質溶質濃度高、不易結凍。", tabs: [
        { label: "→ Peritubular", svg: pbNeph(false, "peri"), note: "cortical 的 efferent → <b>peritubular</b>，纏小管<b>接收重吸收物</b>。" },
        { label: "→ Vasa recta", svg: pbNeph(true, "vasa"), note: "juxtamedullary 的 efferent → <b>vasa recta</b>（U 型）<b>維持髓質滲透梯度</b>。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "入球 / 出球小動脈夾住腎絲球", viewBox: "0 0 300 170", base: GLOM_BASE, spots: [
        { x: 66, y: 80, label: "Afferent 入球（較粗）", note: "血進入腎絲球；擴張 → 腎絲球壓↑ → GFR↑。" },
        { x: 236, y: 84, label: "Efferent 出球（較細）", note: "血離開；<b>收縮 → 腎絲球內壓↑ → GFR↑</b>。" },
        { x: 150, y: 92, label: "腎絲球 tuft", note: "高壓微血管團，是過濾發生的地方。" }] }),
      (n) => pbStepper(n, { title: "超過濾膜三層篩子", steps: [
        { label: "內皮窗孔", svg: pbBarrier(0), note: "Fenestrated endothelium：規則<b>窗孔</b>，擋血球。" },
        { label: "基底膜", svg: pbBarrier(1), note: "Basement membrane：<b>帶負電</b>，擋大分子與蛋白。" },
        { label: "足細胞裂隙", svg: pbBarrier(2), note: "Podocyte：不規則<b>filtration slit</b>，最後一道大小篩選。" }] }),
      (n) => pbSlider(n, { title: "拖 mesangial 收縮，看過濾面積/Kf", sliders: [{ key: "m", label: "Mesangial 收縮 (1–5)", min: 1, max: 5, value: 2 }], render: ({ m }) => ({ svg: pbFraction((100 - (m - 1) * 16) / 100, "有效過濾面積 / Kf"), note: `Mesangial cell 收縮↑ → 過濾面積 / Kf↓ → <b>GFR↓</b>。` }) }),
      (n) => pbTabs(n, { title: "蛋白尿＝屏障壞了", tabs: [
        { label: "正常", svg: pbBarrier(3), note: "屏障完整：蛋白留血中，尿中幾乎無蛋白。" },
        { label: "破損 → 蛋白尿", svg: pbBarrier(4), note: "屏障受損 → 蛋白漏進尿 → <b>蛋白尿</b>，先懷疑腎絲球病變。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "JGA 的兩個核心角色", viewBox: "0 0 300 160", base: JGA_BASE, spots: [
        { x: 150, y: 130, label: "Macula densa（化學感受器）", note: "自己的上行粗段/遠曲起始，感測流過的 <b>NaCl</b> 濃度。" },
        { x: 96, y: 64, label: "JG cell（壓力感受器）", note: "入球小動脈壁，<b>分泌 renin</b>。" }] }),
      (n) => pbTabs(n, { title: "Renin 釋放的三大原因", tabs: [
        { label: "血壓↓", svg: pbText("入球壓力 ↓\n內皮放 NO/PG", PBR), note: "腎灌流壓↓ → 牽張↓ → 內皮放 NO/prostaglandin → JG cell 放 renin。" },
        { label: "NaCl↓", svg: pbText("Macula densa\nNaCl ↓", PBGRN), note: "流經 NaCl↓ → macula densa（NKCC2）→ 訊號 → renin↑。" },
        { label: "交感 β1", svg: pbText("交感神經\nβ1 受體 → cAMP", PBGD), note: "交感興奮 → JG cell 的 β1 受體 → cAMP → renin↑。" }] }),
      (n) => pbStepper(n, { title: "RAAS 串起來", steps: [
        { label: "Renin", svg: pbChain(RAASC, 0), note: "renin 把 angiotensinogen 轉成 Ang I。" },
        { label: "Ang I", svg: pbChain(RAASC, 1), note: "angiotensin I（中間產物）。" },
        { label: "Ang II", svg: pbChain(RAASC, 2), note: "ACE 把 Ang I → <b>Ang II</b>（主要作用者；ACEi 擋此步）。" }] }),
      (n) => pbTabs(n, { title: "Ang II 兩大作用（都升血壓）", tabs: [
        { label: "縮血管", svg: pbText("AT1 受體\n小動脈收縮\nTPR↑ → 血壓↑", PBR), note: "Ang II 走 <b>AT1</b> 受體縮小動脈 → 總周邊阻力↑（快）。" },
        { label: "醛固酮", svg: pbAldo(), note: "Ang II → aldosterone（球狀帶）→ DCT/CD <b>留鈉排鉀</b>、水跟著 → 血量↑（慢）。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "維他命 D 活化：最後一步在腎", steps: [
        { label: "皮膚/食物", svg: pbChain(VITDC, 0), note: "皮膚 7-DHC 經陽光 → 維他命 D（DBP 攜帶）。" },
        { label: "肝 25(OH)", svg: pbChain(VITDC, 1), note: "肝臟做第一步：25-OH vitamin D（半成品）。" },
        { label: "腎 1,25", svg: pbChain(VITDC, 2), note: "腎臟做最後一步：<b>1,25-(OH)₂（活性型）</b> → 增加腸道鈣吸收。" }] }),
      (n) => pbTabs(n, { title: "EPO：腎臟是氧氣感測站", tabs: [
        { label: "正常", svg: pbText("腎感缺氧\n→ EPO ↑\n→ 紅骨髓造血", PBR), note: "腎臟感測血氧，缺氧時放 EPO 通知紅骨髓造紅血球。" },
        { label: "腎壞", svg: pbText("腎功能差\nEPO 不足\n→ 腎性貧血", PBB), note: "EPO 製造不足 → 紅血球生成受影響 → 腎性貧血。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "「率 / 清除率」中文別被騙", tabs: [
        { label: "❌ 迷思", svg: pbText("以為＝把血液\n洗乾淨的速度", PBR), note: "清除率<b>不是</b>「清潔血液」的速度。" },
        { label: "✓ 正解", svg: pbText("單位時間 兩顆腎\n發生某事的體積", PBGRN), note: "GFR＝每分鐘兩腎血漿→濾液的體積；清除率＝被某物質等效清空的血漿體積。" }] }),
      (n) => pbTabs(n, { title: "用質量守恆推 GFR", tabs: [
        { label: "質量守恆", svg: pbText("Px × GFR\n＝ Ux × V", PBB), note: "血漿 X 濃度 × GFR ＝濾過量；再±重吸收/分泌＝尿中量。" },
        { label: "理想物質", svg: pbText("不被重吸收\n也不被分泌\n(tubular = 0)", PBGRN), note: "找小管完全不處理的物質 → 濾過量＝排出量 → GFR ＝ Ux·V / Px。" }] }),
      (n) => pbTabs(n, { title: "Inulin 菊糖（不是 insulin）", tabs: [
        { label: "為何選它", svg: pbText("小·不帶電\n不被重吸收/分泌\n不合成不代謝·無毒", PBGRN), note: "符合理想條件 → inulin 清除率 ＝ <b>GFR</b>（黃金標準）。" },
        { label: "清除率公式", svg: pbText("Cx = Ux × V / Px", PBR), note: "與 GFR 相比可判斷某物質是被<b>重吸收</b>還是<b>分泌</b>。" }] }),
    ],
  ];

  // ===== test2 重編：中樞周邊全新互動圖（沿用既有神經積木）=====
  const CNS_ROWS = [["代表", "大腦·腦幹·脊髓", "腦神經·脊神經"], ["神經節", "核 nucleus", "ganglion"], ["12 腦神經", "—", "全屬 PNS"]];
  const GLIA_ROWS = [["支持營養", "astrocyte", "satellite"], ["做髓鞘", "oligodendro.", "Schwann"], ["清除/室管", "microglia等", "—"]];
  const cnsBlocksV2 = [
    [
      (n) => pbTabs(n, { title: "神經 vs 肌肉：都會放電，工作不同", tabs: [
        { label: "神經元", svg: pbText("能產生 AP\n→ 傳訊·調控", PBR), note: "可興奮：能產生動作電位。神經放電是為了<b>傳遞/整合訊息</b>。" },
        { label: "肌肉", svg: pbText("也能產生 AP\n→ 但是收縮", PBGRN), note: "肌肉也是 excitable，但放電是為了<b>收縮做工</b>。這是兩者最大差別。" }] }),
      (n) => pbTabs(n, { title: "★CNS / PNS 的鐵律", tabs: [
        { label: "規則", svg: pbText("任一部分在周邊\n→ 整顆 PNS", PBR), note: "只要 neuron 有任何一段在周邊，整顆就算 <b>PNS</b>。" },
        { label: "CNS", svg: pbText("全部都在中樞\n才算 CNS", PBB), note: "要算 CNS，必須所有組成都在 brain＋spinal cord。" }] }),
      (n) => pbTabs(n, { title: "訊號方向：afferent / efferent", tabs: [
        { label: "Afferent 傳入", svg: pbDir(true), note: "感覺<b>進</b>中樞（afferent＝arrive＝sensory＝input）。" },
        { label: "Efferent 傳出", svg: pbDir(false), note: "指令<b>出</b>中樞（efferent＝exit＝motor＝output）。" }] }),
      (n) => pbTabs(n, { title: "PNS 再分類", tabs: [
        { label: "Somatic", svg: pbText("意識可控/可感\n(隨意)", PBR), note: "體神經：意識能控制或感知（伸手拿東西、摸出形狀）。" },
        { label: "Autonomic", svg: pbText("意識不可\n直接控制", PBB), note: "自主神經：無法用意念馬上加快心跳。" },
        { label: "Enteric", svg: pbText("腸道自備\n感覺·整合·運動", PBGRN), note: "腸神經：離體小腸切斷神經血管仍會蠕動。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "體感覺神經元：是 PNS", tabs: [
        { label: "陷阱", svg: pbText("terminal\n進到脊髓(中樞)", PBR), note: "末梢雖然進中樞…" },
        { label: "正解", svg: pbText("胞體在 DRG\n(周邊) → PNS", PBGRN), note: "細胞本體在背根神經節(周邊)，整顆算 <b>PNS</b>。" }] }),
      (n) => pbTabs(n, { title: "α motor neuron 也是 PNS", tabs: [
        { label: "胞體", svg: pbText("胞體在脊髓\nventral horn(中樞)", PBB), note: "細胞本體在中樞…" },
        { label: "分類", svg: pbText("軸突出中樞\n到肌肉 → PNS", PBR), note: "軸突在周邊，整顆仍算 <b>PNS</b>（規則一致）。" }] }),
      (n) => pbTabs(n, { title: "運動/感覺單位：大小 vs 精細", tabs: [
        { label: "小單位", svg: pbText("1 神經元\n→ 少數肌纖維", PBGRN), note: "精細、力小（手指、眼外肌）。" },
        { label: "大單位", svg: pbText("1 神經元\n→ 很多肌纖維", PBR), note: "力量大、較不精細（大腿）。" }] }),
      (n) => pbTabs(n, { title: "CNS / PNS 具體包含", tabs: [
        { label: "CNS", svg: pb2col("CNS", "PNS", CNS_ROWS, 0), note: "大腦/間腦/腦幹/上下丘/脊髓。" },
        { label: "PNS", svg: pb2col("CNS", "PNS", CNS_ROWS, 1), note: "12 對腦神經(全 PNS)、脊神經、神經節、周邊神經。" }] }),
    ],
    [
      (n) => pbHotspots(n, { title: "神經元各部位（AP 在軸丘起始）", viewBox: "0 0 300 170", base: NEURON, spots: [
        { x: 50, y: 74, label: "樹突 Dendrite", note: "接收訊號輸入、分支多。" },
        { x: 80, y: 92, label: "細胞本體 Soma", note: "整合輸入。" },
        { x: 114, y: 92, label: "Axon hillock 軸丘", note: "<b>動作電位起始點</b>（電壓門控 Na 通道多、閾值最易達）。" },
        { x: 190, y: 92, label: "軸突 Axon", note: "傳導動作電位、通常一條主幹。" },
        { x: 284, y: 92, label: "末梢 Terminal", note: "形成 synapse、釋放神經傳遞物。" }] }),
      (n) => pbTabs(n, { title: "結構分類：看突起數量", tabs: [
        { label: "Unipolar", svg: pbNeuronShape(1), note: "一個突起。" },
        { label: "Bipolar", svg: pbNeuronShape(2), note: "兩個突起 → <b>視網膜/特殊感覺</b>。" },
        { label: "Pseudo-uni", svg: pbText("看似單極\n功能像雙極\n→ DRG", PBGD), note: "假單極：DRG 感覺神經元的型態。" },
        { label: "Multipolar", svg: pbNeuronShape(3), note: "多突起 → <b>中樞整合</b>（α motor、pyramidal、Purkinje）。" }] }),
      (n) => pbTabs(n, { title: "功能分類與明星細胞", tabs: [
        { label: "三類", svg: pbChain([{ label: "感覺", color: PBR }, { label: "中間", color: PBB }, { label: "運動", color: PBGRN }], 1), note: "sensory(input) / interneuron(整合) / motor(output)。" },
        { label: "Pyramidal", svg: pbText("錐體細胞\n大腦皮質/海馬\n高等認知", PBR), note: "multipolar，與高等認知有關。" },
        { label: "Purkinje", svg: pbText("浦肯野細胞\n小腦·掃把頭\n運動/平衡", PBGRN), note: "multipolar，樹突極複雜、整合大量訊息。" }] }),
      (n) => pbTabs(n, { title: "軸漿運輸 axonal transport", tabs: [
        { label: "Anterograde", svg: pbText("本體 → 末端\n(順向)", PBR), note: "把物質送往 axon terminal。" },
        { label: "Retrograde", svg: pbText("末端 → 本體\n(逆向·tracer)", PBB), note: "逆向常用螢光 tracer 標定神經迴路。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "Neuron vs Glia", tabs: [
        { label: "Neuron", svg: pbText("溝通 + 整合\n(數量以億計)", PBR), note: "神經元：communication＋integration。" },
        { label: "Glia", svg: pbText("支持/營養/保護\n(數量更多)", PBGRN), note: "膠質細胞數量是 neuron 數倍，大腦大部分是 glia。" }] }),
      (n) => pbTabs(n, { title: "Glia 三大功能", tabs: [
        { label: "支持", svg: pbText("穩定\n神經網路結構", PBB), note: "維持結構穩定。" },
        { label: "營養", svg: pbText("astrocyte\n供應養分", PBGRN), note: "缺養分時供養。" },
        { label: "保護", svg: pbText("清除\nneurotransmitter", PBR), note: "清掉突觸間隙的傳導物，防神經過度興奮。" }] }),
      (n) => pbTabs(n, { title: "中樞 vs 周邊膠質對照", tabs: [
        { label: "中樞", svg: pb2col("中樞 CNS", "周邊 PNS", GLIA_ROWS, 0), note: "astrocyte、oligodendrocyte、microglia、ependymal。" },
        { label: "周邊", svg: pb2col("中樞 CNS", "周邊 PNS", GLIA_ROWS, 1), note: "satellite cell、Schwann cell。" }] }),
      (n) => pbTabs(n, { title: "血腦屏障 BBB", tabs: [
        { label: "組成", svg: pbText("血管內皮\n+ astrocyte", PBB), note: "控制誰能進入中樞。" },
        { label: "擋什麼", svg: pbText("血清素 serotonin\n過不了 BBB", PBR), note: "很多血中物質不能任意進中樞（吃香蕉不會直接快樂）。" }] }),
    ],
    [
      (n) => pbSlider(n, { title: "拖髓鞘量，看傳導速度", intro: "中樞 oligodendrocyte／周邊 Schwann。", sliders: [{ key: "v", label: "髓鞘 (1–5)", min: 1, max: 5, value: 1 }], render: ({ v }) => ({ svg: pbMyelin(v), note: `髓鞘↑ → 在 <b>node of Ranvier</b> 之間<b>跳躍式傳導(saltatory)</b> → 速度↑。` }) }),
      (n) => pbTabs(n, { title: "灰質 vs 白質（大腦/脊髓相反）", tabs: [
        { label: "意義", svg: pbText("白質＝有髓 axon\n灰質＝cell body", PBB), note: "白＝脂質(髓鞘)＝軸突；灰＝細胞本體。" },
        { label: "大腦", svg: pbText("外灰\n內白", PBR), note: "皮質在外是灰質、深部纖維是白質。" },
        { label: "脊髓", svg: pbText("外白\n內灰", PBGRN), note: "剛好與大腦相反。" }] }),
      (n) => pbTabs(n, { title: "補充：substantia nigra", tabs: [
        { label: "黑質", svg: pbText("substantia nigra\ndopamine 神經元", PBINK), note: "大腦特定腦區，協調運動。" },
        { label: "Parkinson", svg: pbText("退化 →\n顫抖·動作問題", PBR), note: "多巴胺神經元退化 → 巴金森氏症。" }] }),
    ],
  ];

  // ===== test2 重編：特殊感覺全新互動圖（沿用既有感官積木 pbField/pbLens/pbWave/pbTono）=====
  const ROD_CONE_ROWS = [["視覺", "黑白(暗)", "彩色(明)"], ["色素", "rhodopsin", "3 photopsin"], ["分布", "周邊", "中央凹"], ["連結", "多對一", "一對一"], ["系統", "scotopic", "photopic"]];
  const TRANS = [{ label: "刺激", color: PBGD }, { label: "換能", color: PBR }, { label: "受器電位", color: PBB }, { label: "動作電位", color: PBGRN }, { label: "中樞", color: PBINK }];
  const RETINA = [{ label: "色素層", color: PBINK }, { label: "感光", color: PBR }, { label: "雙極", color: PBB }, { label: "神經節", color: PBGRN }];
  const SS_EAR = [{ label: "外耳", color: PBGD }, { label: "中耳", color: PBR }, { label: "內耳", color: PBGRN }];
  const ssBlocksV2 = [
    [
      (n) => pbTabs(n, { title: "五大特殊感覺與 receptor vs organ", tabs: [
        { label: "五感", svg: pbText("視 · 聽 · 平衡\n嗅 · 味", PBGD), note: "vision/hearing/equilibrium/olfaction/gustation；視覺 70%、聽覺 20%。" },
        { label: "receptor", svg: pbText("結構簡單\n痛溫壓觸", PBB), note: "sensory receptor：換能簡單。" },
        { label: "organ", svg: pbText("結構複雜\n視/聽/平衡", PBR), note: "sensory organ：換能複雜。" }] }),
      (n) => pbSlider(n, { title: "可見光與適宜刺激", intro: "光不會引發痛覺/聽覺（型態不對）。", sliders: [{ key: "nm", label: "波長 (nm)", min: 400, max: 700, value: 500 }], render: ({ nm }) => ({ svg: pbWave(nm), note: `可見光約 370–740 nm；adequate stimulus＝對的<b>型態＋強度</b>。${nm} nm 落在可見光內。` }) }),
      (n) => pbStepper(n, { title: "感覺骨架：換能 → AP → 中樞", steps: [
        { label: "刺激", svg: pbChain(TRANS, 0), note: "適宜刺激進入感覺器官。" },
        { label: "換能", svg: pbChain(TRANS, 1), note: "transduction：把刺激轉成電。" },
        { label: "受器電位", svg: pbChain(TRANS, 2), note: "receptor potential（局部、非 AP）。" },
        { label: "動作電位", svg: pbChain(TRANS, 3), note: "過閾值 → action potential（能長距離傳）。" },
        { label: "中樞", svg: pbChain(TRANS, 4), note: "傳到中樞整合 → 客觀＋主觀感覺。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "凸透鏡成像", tabs: [
        { label: "成像規則", svg: pbText("上下顛倒\n左右相反", PBR), note: "凸透鏡成像：inverted＋reversed，視網膜影像是倒的。" },
        { label: "為何看到正的", svg: pbText("靠 cortex\n投射對位", PBB), note: "不是把影像導正，而是訊號有投射到相應皮質區判讀。" }] }),
      (n) => pbTabs(n, { title: "晶狀體調節：可調的就是它", tabs: [
        { label: "看近：變厚", svg: pbLens(true), note: "看近物 → 晶狀體變厚、折光力↑，影像聚焦回視網膜。" },
        { label: "看遠：變扁", svg: pbLens(false), note: "看遠物 → 光近似平行、晶狀體較扁。" }] }),
      (n) => pbTabs(n, { title: "看近物的三個反射", tabs: [
        { label: "晶狀體變厚", svg: pbText("lens 變厚\n折光↑", PBR), note: "增加折光，讓近物聚焦。" },
        { label: "瞳孔縮小", svg: pbText("pupil\n縮小", PBB), note: "近物不需太多光，縮小增景深。" },
        { label: "Convergence", svg: pbText("兩眼往鼻側\n→ 落中央凹", PBGRN), note: "視軸輻輳；做不好 → diplopia 複視。" }] }),
      (n) => pbTabs(n, { title: "遠點、近點與老花", tabs: [
        { label: "近點隨年齡", svg: pbText("10歲 ~8cm\n20歲 ~11cm", PBB), note: "near point＝看清楚的最近距離（取決於晶狀體最大調節）。" },
        { label: "老花", svg: pbText("晶狀體變硬\n近點變遠", PBR), note: "presbyopia：看近要拿遠。是『看清楚』不是『看得到』。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "Rod vs Cone（點欄位看對照）", tabs: [
        { label: "Rod", svg: pb2col("Rod 桿", "Cone 錐", ROD_CONE_ROWS, 0), note: "rhodopsin、黑白、周邊、多對一、scotopic（暗、敏感、解析差）。" },
        { label: "Cone", svg: pb2col("Rod 桿", "Cone 錐", ROD_CONE_ROWS, 1), note: "3 photopsin、彩色、中央凹、一對一、photopic（明、解析好）。" }] }),
      (n) => pbStepper(n, { title: "Rhodopsin cycle（視紫質循環）", steps: [
        { label: "暗：結合", svg: pbText("opsin + 11-cis\n= rhodopsin", PBB), note: "暗處 opsin 與 11-cis retinal 結合成 rhodopsin。" },
        { label: "光：裂解", svg: pbText("光 → opsin\n+ all-trans", PBR), note: "光照使 rhodopsin 裂解、構型改變。" },
        { label: "異構回", svg: pbText("all-trans\n→ 11-cis", PBGD), note: "all-trans retinal 異構回 11-cis。" },
        { label: "需 vit A", svg: pbText("補 vitamin A\n缺 → 夜盲", PBGRN), note: "retinal 會消耗，需維生素 A；缺 → 夜盲。" }] }),
      (n) => pbTabs(n, { title: "★Dark current：與一般神經相反", tabs: [
        { label: "暗：去極化", svg: pbText("cGMP 高 → Na 開\n去極化 → 放 NT", PBR), note: "暗中 Na 通道開（dark current）→ 去極化 → 持續放神經傳遞物。" },
        { label: "光：超極化", svg: pbText("transducin→PDE\ncGMP↓→Na 關\n超極化→減 NT", PBB), note: "光 → rhodopsin→transducin→PDE→cGMP↓→Na 關 → 超極化 → 減 NT。<b>與一般神經相反</b>。" }] }),
      (n) => pbTabs(n, { title: "三原色學說與紅綠色盲", tabs: [
        { label: "三原色", svg: pbText("3 cone 活化比例\n→ 中樞判色", PBGRN), note: "藍/綠/紅 cone 被活化比例不同 → 中樞判讀成各種顏色。" },
        { label: "紅綠色盲", svg: pbText("green/red 光譜\n重疊 → 常一起", PBR), note: "green 與 red cone 光譜接近，所以紅綠色盲最常見。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "視網膜分層（光要先穿過內層）", intro: "horizontal/amacrine 做橫向調控、lateral inhibition 增對比。", steps: [
        { label: "色素層", svg: pbChain(RETINA, 0), note: "pigment layer：吸光防反射。" },
        { label: "感光", svg: pbChain(RETINA, 1), note: "rod/cone：產生 receptor potential。" },
        { label: "雙極", svg: pbChain(RETINA, 2), note: "bipolar cell。" },
        { label: "神經節", svg: pbChain(RETINA, 3), note: "ganglion cell：axon 匯成 <b>optic nerve</b> 送中樞。" }] }),
      (n) => pbTabs(n, { title: "視覺路徑與病灶判讀", intro: "鼻側交叉、顳側不交叉。", tabs: [
        { label: "路徑", svg: pbText("鼻側交叉\n顳側不交叉", PBB), note: "retina→optic nerve→chiasm→tract→cortex。" },
        { label: "Optic nerve", svg: pbText("該眼\n整側全盲", PBR), note: "視神經受損 → 該眼視野全盲。" },
        { label: "Chiasm", svg: pbText("兩眼顳側\n視野缺損", PBGD), note: "視交叉切到兩眼鼻側交叉纖維 → bitemporal。" },
        { label: "Optic tract", svg: pbText("對側\n同名偏盲", PBGRN), note: "視束受損 → 對側 homonymous hemianopia。" }] }),
      (n) => pbTabs(n, { title: "Primary vs Secondary 皮質：客觀/主觀", tabs: [
        { label: "Primary", svg: pbText("客觀感覺\n看到什麼", PBB), note: "primary visual cortex 忠實呈現看到什麼。" },
        { label: "Secondary", svg: pbText("主觀感覺\n整合記憶經驗", PBR), note: "secondary/association 整合海馬迴記憶/情緒 → 主觀認知。" }] }),
      (n) => pbTabs(n, { title: "視覺生理現象", tabs: [
        { label: "視力", svg: pbText("two-point\ndiscrimination", PBINK), note: "視力本質＝兩點辨別。" },
        { label: "視野", svg: pbField(0), note: "視野大小：白(rod) > 藍 > 紅綠(cone)。" },
        { label: "盲點", svg: pbText("視神經出口\n無感光細胞", PBR), note: "blind spot＝optic disc，無 photoreceptor。" },
        { label: "明暗適應", svg: pbText("暗適應：重建\nrhodopsin(較慢)", PBB), note: "明適應(rhodopsin 大量裂解) vs 暗適應(重新累積)。" }] }),
    ],
    [
      (n) => pbStepper(n, { title: "外/中/內耳與三小聽骨", intro: "attenuation reflex 大聲拉緊鼓膜保護。", steps: [
        { label: "外耳", svg: pbChain(SS_EAR, 0), note: "收集聲音。" },
        { label: "中耳", svg: pbChain(SS_EAR, 1), note: "三小聽骨 ossicles：<b>阻抗匹配、放大振幅</b>。" },
        { label: "內耳", svg: pbChain(SS_EAR, 2), note: "耳蝸換能。" }] }),
      (n) => pbTabs(n, { title: "耳蝸三腔與外鈉內鉀", tabs: [
        { label: "三腔", svg: pbText("前庭階\n中央階\n鼓室階", PBB), note: "scala vestibuli / media / tympani。" },
        { label: "外鈉內鉀", svg: pbText("外淋巴 高Na\n內淋巴 高K", PBR), note: "前庭階+鼓室階＝外淋巴(高Na)；中央階＝內淋巴(高K)。" }] }),
      (n) => pbSlider(n, { title: "★行波理論：拖頻率看最大振幅位置", sliders: [{ key: "f", label: "頻率 (Hz)", min: 200, max: 8000, value: 1000 }], render: ({ f }) => ({ svg: pbTono(f), note: `${f} Hz：${f >= 2000 ? "高頻 → <b>靠近卵圓窗的底部(base)</b>" : "低頻 → <b>遠端頂部(apex)</b>"}。耳蝸長度決定可聽範圍。` }) }),
      (n) => pbTabs(n, { title: "Hair cell、聲音方位、傳導", tabs: [
        { label: "Hair cell", svg: pbText("內淋巴 高K\n→ K⁺ 內流\n去極化(例外)", PBR), note: "毛細胞浸內淋巴(高K)，機械門控開 → K⁺ 內流去極化。" },
        { label: "剪切", svg: pbText("液體震動\n→ shearing\n纖毛拉扯", PBB), note: "纖毛與蓋膜剪切；kinocilium 最長。往一方向興奮、另一方向抑制。" },
        { label: "方位", svg: pbText("時間差\n+ 強度差", PBGD), note: "兩耳的時間差與強度差判斷聲音方位。" },
        { label: "傳導", svg: pbText("中耳問題：air↓\n內耳問題：兩者↓", PBGRN), note: "conductive(中耳)：air↓bone 正常；sensorineural(內耳/毛細胞)：air+bone 都↓。" }] }),
      (n) => pbTabs(n, { title: "平衡：三來源與前庭器官", tabs: [
        { label: "三來源", svg: pbText("視覺(主要)\n前庭 + 本體", PBR), note: "平衡靠視覺(最主要)、前庭器官、本體感覺。" },
        { label: "半規管", svg: pbText("角加速度\n頭部旋轉", PBB), note: "三半規管(近 XYZ 軸)；壺腹 ampulla 有 hair cell。" },
        { label: "球囊橢圓囊", svg: pbText("線性加速度", PBGRN), note: "utricle/saccule 偵測線性加速度。" },
        { label: "暈車", svg: pbText("感知矛盾\n→ 閉眼/睡覺", PBGD), note: "前庭/本體說在晃、視覺說沒晃 → 矛盾；關掉視覺可減輕。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "味覺：五味、化學、腦神經", tabs: [
        { label: "五味", svg: pbText("酸 甜 苦\n鹹 鮮", PBGD), note: "sour/sweet/bitter/salty/umami。" },
        { label: "對應化學", svg: pbText("酸=H⁺ 鹹=Na⁺\n鮮=glutamate", PBR), note: "酸對應 H⁺、鹹對應 Na⁺、鮮對應 glutamate。" },
        { label: "苦最敏感", svg: pbText("苦 閾值最低\n(最敏感)", PBB), note: "苦常代表毒，敏感有保護意義。" },
        { label: "腦神經", svg: pbText("VII 顏面\nIX 舌咽\nX 迷走", PBGRN), note: "味覺由第 7/9/10 對腦神經傳入。" }] }),
      (n) => pbTabs(n, { title: "嗅覺：直連 limbic 與 flavor", tabs: [
        { label: "直連 limbic", svg: pbText("olfactory →\nlimbic system\n情緒/記憶", PBR), note: "嗅覺可較直接連邊緣系統，不一定先經 thalamus → 情緒記憶連結強。" },
        { label: "Flavor", svg: pbText("味 + 嗅\n= flavor", PBGRN), note: "鼻塞時嗅覺參與變少 → flavor 下降（不是味覺壞）。" }] }),
    ],
  ];

  // ===== test2 重編：自主神經全新互動圖 =====
  const AN_PATH = [{ label: "節前", color: PBB }, { label: "神經節", color: PBGD }, { label: "節後", color: PBR }, { label: "效應器", color: PBGRN }];
  const AN_SRC = [["來源", "胸腰 T1-L3", "腦薦 3/7/9/10·S2-4"], ["神經鏈", "有 trunk", "無"], ["節前後", "前短後長", "前長後短"], ["節後傳導物", "NE", "ACh"]];
  const AN_EFF = [["瞳孔", "散大", "縮小"], ["心跳", "↑", "↓"], ["氣管", "擴張", "收縮"], ["腸胃蠕動", "↓", "↑"], ["腎入球", "收縮", "—"]];
  const AN_ACH = [{ label: "膽鹼+AcCoA", color: PBGD }, { label: "ACh", color: PBR }, { label: "AChE 分解", color: PBB }];
  const AN_NE = [{ label: "酪胺酸", color: PBGD }, { label: "DOPA", color: PBB }, { label: "多巴胺", color: PBR }, { label: "NE", color: PBGRN }];
  const ansBlocksV2 = [
    [
      (n) => pbTabs(n, { title: "自主神經＝subconscious", tabs: [
        { label: "意識管不到", svg: pbText("意識不能\n直接控制", PBR), note: "不能用意念馬上讓心跳變慢、也不能一直憋氣不呼吸。" },
        { label: "以反射運作", svg: pbText("感覺 → 整合\n→ 運動", PBGRN), note: "ANS 多以反射存在；與 conscious 是兩套路徑但中樞互相影響。" }] }),
      (n) => pbTabs(n, { title: "★四大生理特性", tabs: [
        { label: "Basal tone", svg: pbText("平時就\n一直放電", PBB), note: "截斷交感→血壓降、截斷副交感→血壓升，證明平時有張力。" },
        { label: "Dual", svg: pbText("多數器官\n兩邊都管", PBGRN), note: "雙重支配（有例外：汗腺、腎入球只交感）。" },
        { label: "Antagonistic", svg: pbText("兩邊\n作用相反", PBGD), note: "交感/副交感拮抗。" },
        { label: "Mass discharge", svg: pbText("交感特有\n一起爆發", PBR), note: "集體放電，緊急時整體啟動（fight-or-flight）。" }] }),
      (n) => pbTabs(n, { title: "輸出：兩顆神經元接力", tabs: [
        { label: "自主(兩棒)", svg: pbChain(AN_PATH, 3), note: "節前 → 神經節 → 節後 → 效應器（兩顆神經元）。" },
        { label: "體神經(一棒)", svg: pbText("只一顆\nACh → Nm", PBB), note: "體神經運動只一顆神經元，ACh→Nm 到骨骼肌。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "★交感 vs 副交感（點欄位）", tabs: [
        { label: "交感", svg: pb2col("交感", "副交感", AN_SRC, 0), note: "胸腰 T1-L3、有 trunk、前短後長、節後 NE。" },
        { label: "副交感", svg: pb2col("交感", "副交感", AN_SRC, 1), note: "腦薦(3/7/9/10+S2-4)、無 trunk、前長後短、節後 ACh。" }] }),
      (n) => pbTabs(n, { title: "節前/節後纖維長短", tabs: [
        { label: "交感", svg: pbText("有 trunk(近脊髓)\n節前短·節後長", PBR), note: "交感神經鏈靠脊髓 → 節前短、節後長。" },
        { label: "副交感", svg: pbText("神經節近器官\n節前長·節後短", PBB), note: "副交感神經節靠效應器 → 節前長、節後短。" }] }),
      (n) => pbStepper(n, { title: "腎上腺髓質：交感的特殊節後", steps: [
        { label: "交感節前", svg: pbText("交感節前\nACh → Nn", PBB), note: "受交感節前神經元支配。" },
        { label: "Chromaffin", svg: pbText("chromaffin\ncell", PBGD), note: "腎上腺髓質的內分泌細胞（演化自神經細胞）。" },
        { label: "釋放入血", svg: pbText("EPI ~80%\nNE ~20% → 血液", PBR), note: "釋放到血液 → 延長時間、雙重保護、延伸範圍（只受交感）。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "★傳導物與受體配對（記死）", tabs: [
        { label: "節前(both)", svg: pbText("ACh → Nn\n(交感+副交感)", PBB), note: "交感與副交感的<b>節前</b>都是 ACh→nicotinic(Nn)。" },
        { label: "副交感節後", svg: pbText("ACh → M\n(muscarinic)", PBGRN), note: "副交感節後：ACh→muscarinic。" },
        { label: "交感節後", svg: pbText("NE → α / β", PBR), note: "交感節後多為 NE→α/β（汗腺例外用 ACh）。" }] }),
      (n) => pbTabs(n, { title: "受體亞型與 G 蛋白", tabs: [
        { label: "Nicotinic", svg: pbText("離子通道\n一律興奮\nNn / Nm", PBR), note: "尼古丁受體是配體門控離子通道，皆興奮。" },
        { label: "Muscarinic", svg: pbText("M1/3/5 Gq 興奮\nM2/4 Gi 抑制", PBB), note: "M1/3/5＝Gq(EPSP)、M2/4＝Gi(IPSP)。" },
        { label: "Adrenergic", svg: pbText("α1 Gq · α2 Gi\nβ Gs(cAMP)", PBGRN), note: "α1＝Gq、α2＝Gi、β＝Gs。" }] }),
      (n) => pbTabs(n, { title: "★必考例外", tabs: [
        { label: "汗腺", svg: pbText("交感支配\n但用 ACh", PBR), note: "汗腺是交感支配的經典例外：節後釋放 ACh 而非 NE。" },
        { label: "腎入球", svg: pbText("只受交感\n不受副交感", PBB), note: "腎入球小動脈只受交感（控 GFR）。" }] }),
      (n) => pbTabs(n, { title: "合成與代謝", tabs: [
        { label: "ACh", svg: pbChain(AN_ACH, 1), note: "choline+acetyl-CoA →(ChAT)→ ACh；由 <b>AChE</b> 分解。" },
        { label: "NE", svg: pbChain(AN_NE, 3), note: "tyrosine→DOPA→dopamine→<b>NE</b>；由 MAO/COMT 分解。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "緊急 vs 休息（萬用鑰匙）", tabs: [
        { label: "交感 fight", svg: pbText("有人拿刀衝來\nfight-or-flight", PBR), note: "散瞳、心跳↑、氣管擴張、血糖↑、不急的關掉。" },
        { label: "副交感 rest", svg: pbText("休息消化\nrest-and-digest", PBGRN), note: "縮瞳、心跳↓、氣管收縮、促消化。" }] }),
      (n) => pbTabs(n, { title: "逐器官對照", tabs: [
        { label: "交感", svg: pb2col("交感", "副交感", AN_EFF, 0), note: "散瞳、心跳↑、氣管擴張、腸胃↓、腎入球收縮(GFR↓)。" },
        { label: "副交感", svg: pb2col("交感", "副交感", AN_EFF, 1), note: "縮瞳、心跳↓、氣管收縮、腸胃↑（腎入球無副交感）。" }] }),
      (n) => pbTabs(n, { title: "排尿：自主＋意識", tabs: [
        { label: "交感儲尿", svg: pbText("逼尿肌鬆\n內括約肌縮", PBB), note: "交感＝儲尿。" },
        { label: "副交感排尿", svg: pbText("逼尿肌縮\n內括約肌鬆", PBR), note: "副交感＝排尿。" },
        { label: "外括約肌", svg: pbText("體神經\n(conscious)", PBGRN), note: "外尿道括約肌由意識控制；過脹時 ANS 接管。" }] }),
    ],
    [
      (n) => pbTabs(n, { title: "節前胞體在 IML（中樞）", tabs: [
        { label: "IML", svg: pbText("脊髓中側角\n節前胞體\n(屬中樞)", PBB), note: "intermediolateral cell column，介於背角與腹角之間。" },
        { label: "考點", svg: pbText("交感屬 PNS\n但胞體在中樞", PBR), note: "常與『中樞/周邊判斷』一起考：交感是 PNS，但節前胞體在中樞(IML)。" }] }),
      (n) => pbTabs(n, { title: "初級 vs 高級中樞", tabs: [
        { label: "初級", svg: pbText("脊髓 / 腦幹\n內臟反射", PBGRN), note: "局部內臟反射（排尿、胃酸分泌等）。" },
        { label: "高級", svg: pbText("腦幹 + 下視丘\n體溫/水/飲食/情緒", PBR), note: "下視丘整合體溫、水平衡、飲食、情緒。" }] }),
    ],
  ];

  const unitBlocks = {
    cardiovascular: cardioBlocksV2,
    urinary: urinaryBlocksV2,
    cns: cnsBlocksV2,
    "special-senses": ssBlocksV2,
    ans: ansBlocksV2,
    endocrine: endocrineBlocksV2,
    reproduction: reproductionBlocksV2
  };
  const reservedVisualUnits = new Set([]);

  function pointBlockSlot(unitId, sectionIndex, pointIndex) {
    if (reservedVisualUnits.has(unitId)) {
      return `<div class="point-visual-reserved" data-visual-slot="${unitId}:${sectionIndex}:${pointIndex}" aria-label="預留視覺互動區"></div>`;
    }
    const reg = unitBlocks[unitId];
    if (!reg || !reg[sectionIndex] || !reg[sectionIndex][pointIndex]) return "";
    return `<div class="point-lab" data-pblock="${sectionIndex}:${pointIndex}" data-pbu="${unitId}"></div>`;
  }
  function initPointBlocks(root) {
    const initBlock = (node) => {
      if (node.dataset.pblockReady === "true") return;
      const reg = unitBlocks[node.dataset.pbu];
      const parts = node.dataset.pblock.split(":").map(Number);
      const fn = reg && reg[parts[0]] && reg[parts[0]][parts[1]];
      if (!fn) return;
      node.dataset.pblockReady = "true";
      try { fn(node); } catch (error) { node.innerHTML = `<div class="mini-output">互動載入失敗</div>`; }
    };
    const nodes = [...root.querySelectorAll("[data-pblock]")];
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(initBlock);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        initBlock(entry.target);
      });
    }, { rootMargin: "900px 0px" });
    nodes.forEach((node) => observer.observe(node));
  }

  // 統合大圖（Wiggers diagram）：把 ECG、四次開門、等容積期、壓力/容積/心音放在同一條時間軸，可拖時間游標看各數值如何同步變化。
  function renderWiggers(node) {
    node.classList.add("wiggers-lab");
    const X0 = 96, X1 = 716, W = X1 - X0;
    const tx = (t) => X0 + t * W;
    const PH = { top: 28, bot: 50 };
    const pP = { top: 74, bot: 214 }, vP = { top: 238, bot: 326 }, eP = { top: 350, bot: 418 }, sP = { top: 440, bot: 476 };
    const yP = (mm) => pP.bot - (mm / 130) * (pP.bot - pP.top);
    const yV = (ml) => vP.bot - ((ml - 30) / 110) * (vP.bot - vP.top);
    const AO = 0.07, AC = 0.42, MO = 0.50, AS = 0.86;
    const eMid = (eP.top + eP.bot) / 2;
    const pLV = (t) => {
      if (t < AO) return 8 + (82 - 8) * (t / AO);
      if (t < AC) return 82 + 40 * Math.sin(Math.PI * (t - AO) / (AC - AO));
      if (t < MO) return 82 - (82 - 8) * ((t - AC) / (MO - AC));
      let v = 8 + 2 * ((t - MO) / (1 - MO));
      if (t > AS) v += 5 * Math.sin(Math.PI * (t - AS) / (1 - AS));
      return v;
    };
    const pAo = (t) => {
      if (t < AO) return 82 - 2 * (t / AO);
      if (t < AC) return 80 + 42 * Math.sin(Math.PI * (t - AO) / (AC - AO));
      let base = 82 - 6 * ((t - AC) / (1 - AC));
      if (t < AC + 0.05) base += 7 * Math.sin(Math.PI * (t - AC) / 0.05);
      return base;
    };
    const pLA = (t) => {
      if (t < 0.03) return 7 + 3 * Math.sin(Math.PI * t / 0.03);
      if (t > AS) return 7 + 6 * Math.sin(Math.PI * (t - AS) / (1 - AS));
      if (t > 0.72 && t < AS) return 7 + 3 * ((t - 0.72) / (AS - 0.72));
      return 7;
    };
    const vol = (t) => {
      if (t < AO) return 120;
      if (t < AC) return 120 - 70 * Math.pow((t - AO) / (AC - AO), 0.7);
      if (t < MO) return 50;
      return 50 + 70 * Math.pow((t - MO) / (1 - MO), 0.62);
    };
    const poly = (fn, yf, col, w, dash) => {
      let d = "";
      for (let i = 0; i <= 180; i++) { const t = i / 180; d += (i ? "L" : "M") + tx(t).toFixed(1) + " " + yf(fn(t)).toFixed(1) + " "; }
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
    };
    const ph = (a, b, col, lab) => `<rect x="${tx(a)}" y="${PH.top}" width="${tx(b) - tx(a)}" height="${PH.bot - PH.top}" fill="${col}" opacity=".5"/><text x="${(tx(a) + tx(b)) / 2}" y="${PH.top + 15}" font-size="10.5" font-weight="900" fill="#3a2f1a" text-anchor="middle">${lab}</text>`;
    const phaseBands = ph(0, AO, "#e7a79c", "等容收縮") + ph(AO, AC, "#edc488", "射血") + ph(AC, MO, "#9fc2e0", "等容舒張") + ph(MO, AS, "#a9d3b4", "心室填充") + ph(AS, 1, "#9ecfc7", "心房收縮");
    const ev = (t, lab) => `<line x1="${tx(t)}" y1="${PH.bot}" x2="${tx(t)}" y2="${sP.bot}" stroke="#9aa3ad" stroke-width="1" stroke-dasharray="3 4"/><text x="${tx(t)}" y="${PH.bot + 11}" font-size="9.5" font-weight="900" fill="#182033" text-anchor="middle">${lab}</text>`;
    const events = ev(0, "MC") + ev(AO, "AO") + ev(AC, "AC") + ev(MO, "MO");
    const ecgPath = `M${tx(0)} ${eMid} L${tx(0.006)} ${eMid + 8} L${tx(0.022)} ${eP.top + 2} L${tx(0.038)} ${eMid + 14} L${tx(0.055)} ${eMid} L${tx(0.23)} ${eMid} Q${tx(0.30)} ${eMid - 26} ${tx(0.40)} ${eMid} L${tx(0.78)} ${eMid} Q${tx(0.85)} ${eMid - 15} ${tx(0.92)} ${eMid} L${tx(0.965)} ${eMid} L${tx(0.972)} ${eMid + 7} L${tx(0.988)} ${eP.top + 2} L${tx(1)} ${eMid + 10}`;
    const sMark = (t, lab, col) => `<circle cx="${tx(t)}" cy="${(sP.top + sP.bot) / 2}" r="7" fill="${col}" stroke="#fffdf7" stroke-width="2"/><text x="${tx(t)}" y="${(sP.top + sP.bot) / 2 + 3.5}" font-size="8.5" font-weight="900" fill="#fff" text-anchor="middle">${lab}</text>`;
    const sounds = sMark(0.004, "S1", "#bc3f34") + sMark(AC, "S2", "#bc3f34") + sMark(0.575, "S3", "#9aa3ad") + sMark(0.905, "S4", "#9aa3ad");
    const gl = (mm) => `<line x1="${X0}" y1="${yP(mm)}" x2="${X1}" y2="${yP(mm)}" stroke="#000" stroke-opacity=".05" stroke-width="1"/><text x="${X0 - 6}" y="${yP(mm) + 3}" font-size="8.5" fill="#9aa3ad" text-anchor="end">${mm}</text>`;
    const svg = `<svg viewBox="0 0 760 500" role="img" aria-label="心動週期統合圖">
      <text x="20" y="${(pP.top + pP.bot) / 2}" font-size="10" font-weight="800" fill="#182033" transform="rotate(-90 20 ${(pP.top + pP.bot) / 2})" text-anchor="middle">壓力 mmHg</text>
      <text x="20" y="${(vP.top + vP.bot) / 2}" font-size="10" font-weight="800" fill="#23694f" transform="rotate(-90 20 ${(vP.top + vP.bot) / 2})" text-anchor="middle">容積 mL</text>
      <text x="22" y="${eMid + 3}" font-size="11" font-weight="900" fill="#182033" text-anchor="middle">ECG</text>
      <text x="22" y="${(sP.top + sP.bot) / 2 + 3}" font-size="10" font-weight="800" fill="#182033" text-anchor="middle">心音</text>
      ${phaseBands}${events}
      ${gl(120)}${gl(80)}${gl(40)}
      ${poly(pAo, yP, "#e08a2e", 2.4)}
      ${poly(pLV, yP, "#bc3f34", 2.8)}
      ${poly(pLA, yP, "#2e5f8d", 2)}
      ${poly(vol, yV, "#23694f", 2.8)}
      <line x1="${X0}" y1="${vP.bot}" x2="${X1}" y2="${vP.bot}" stroke="#000" stroke-opacity=".08"/><text x="${X0 - 6}" y="${yV(50) + 3}" font-size="8.5" fill="#23694f" text-anchor="end">ESV</text><text x="${X0 - 6}" y="${yV(120) + 3}" font-size="8.5" fill="#23694f" text-anchor="end">EDV</text>
      <path d="${ecgPath}" fill="none" stroke="#182033" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
      <text x="${tx(0.02)}" y="${eP.top - 1}" font-size="8.5" font-weight="900" fill="#182033">QRS</text><text x="${tx(0.305)}" y="${eMid - 28}" font-size="8.5" font-weight="900" fill="#182033">T</text><text x="${tx(0.85)}" y="${eMid - 17}" font-size="8.5" font-weight="900" fill="#182033">P</text>
      ${sounds}
      <line id="wigCur" x1="${tx(0)}" y1="${PH.top}" x2="${tx(0)}" y2="${sP.bot}" stroke="#b8871e" stroke-width="2"/>
      <circle id="wigDotLV" cx="${tx(0)}" cy="${yP(pLV(0))}" r="4.5" fill="#bc3f34" stroke="#fff" stroke-width="2"/>
      <circle id="wigDotV" cx="${tx(0)}" cy="${yV(vol(0))}" r="4.5" fill="#23694f" stroke="#fff" stroke-width="2"/>
      <g font-size="9.5" font-weight="800">
        <rect x="${X1 - 150}" y="78" width="148" height="50" rx="6" fill="#fffdf7" stroke="#e6dcc6"/>
        <line x1="${X1 - 142}" y1="90" x2="${X1 - 126}" y2="90" stroke="#bc3f34" stroke-width="3"/><text x="${X1 - 122}" y="93" fill="#182033">LV pressure</text>
        <line x1="${X1 - 142}" y1="104" x2="${X1 - 126}" y2="104" stroke="#e08a2e" stroke-width="3"/><text x="${X1 - 122}" y="107" fill="#182033">Aortic pressure</text>
        <line x1="${X1 - 142}" y1="118" x2="${X1 - 126}" y2="118" stroke="#2e5f8d" stroke-width="3"/><text x="${X1 - 122}" y="121" fill="#182033">LA pressure</text>
      </g>
    </svg>`;
    node.innerHTML = `<div class="lab-head"><strong>心動週期統合圖：拖時間游標看各數值如何同步變化</strong> <span class="muted">ECG · 四次開門 · 等容積期 · 壓力／容積／心音同一條時間軸</span></div>
      <div class="wig-stage">${svg}</div>
      <input class="wig-range" type="range" min="0" max="1000" value="0" aria-label="心動週期時間游標"/>
      <div class="mini-output wig-out"></div>`;
    const describe = (t) => {
      const mmLV = Math.round(pLV(t)), mmAo = Math.round(pAo(t)), ml = Math.round(vol(t));
      let phase, mv, av, sound = "—", note;
      if (t < AO) { phase = "等容收縮期"; mv = "關"; av = "關"; sound = "S1（二尖瓣關）"; note = "兩瓣全關，左心室壓快速衝高、體積不變（停在 EDV）。"; }
      else if (t < AC) { const fast = t < 0.18; phase = "射血期 · " + (fast ? "快速（前 1/3）" : "慢速（後 2/3）"); mv = "關"; av = "開"; note = fast ? "主動脈瓣開、壓差最大，血快速射出，體積急降。" : "壓差變小、部分心肌休息，慢速射血（仍屬收縮期）。"; }
      else if (t < MO) { phase = "等容舒張期"; mv = "關"; av = "關"; sound = "S2（主動脈瓣關）"; note = "兩瓣全關，左心室壓快速下降、體積不變（停在 ESV）。"; }
      else if (t < AS) { const fast = t < 0.62; phase = "心室填充期 · " + (fast ? "快速填充" : "緩慢填充"); mv = "開"; av = "關"; if (fast) sound = "S3（早期填充，可能）"; note = "二尖瓣開，血由左心房灌入左心室，體積回升。"; }
      else { phase = "心房收縮期"; mv = "開"; av = "關"; sound = "S4（心房收縮，可能）"; note = "P 波後心房收縮，補進最後一腳（atrial kick）。"; }
      return `<div class="wig-grid"><span><b>時相</b>${phase}</span><span><b>二尖瓣</b>${mv}</span><span><b>主動脈瓣</b>${av}</span><span><b>心音</b>${sound}</span><span><b>左心室壓</b>${mmLV} mmHg</span><span><b>主動脈壓</b>${mmAo} mmHg</span><span><b>左心房壓</b>${pLA(t).toFixed(0)} mmHg</span><span><b>左心室容積</b>${ml} mL</span></div><p>${note}</p>`;
    };
    const range = node.querySelector(".wig-range"), out = node.querySelector(".wig-out");
    const cur = node.querySelector("#wigCur"), dotLV = node.querySelector("#wigDotLV"), dotV = node.querySelector("#wigDotV");
    const upd = () => {
      const t = Number(range.value) / 1000, x = tx(t);
      cur.setAttribute("x1", x); cur.setAttribute("x2", x);
      dotLV.setAttribute("cx", x); dotLV.setAttribute("cy", yP(pLV(t)));
      dotV.setAttribute("cx", x); dotV.setAttribute("cy", yV(vol(t)));
      out.innerHTML = describe(t);
    };
    range.addEventListener("input", upd);
    upd();
  }

  function renderInteractions(root) {
    root.querySelectorAll("[data-interaction]").forEach((node) => {
      const type = node.dataset.interaction;
      if (type === "wiggers") renderWiggers(node);
      if (type === "cardiac-conduction") renderCardiacConduction(node);
      if (type === "cardiac-cycle") renderCardiacCycle(node);
      if (type === "pv-loop") renderPvLoop(node);
      if (type === "nephron-map") renderNephronMap(node);
      if (type === "raas") renderRaas(node);
      if (type === "clearance") renderClearance(node);
      if (type === "nervous-router") renderNervousRouter(node);
      if (type === "neuron-builder") renderNeuronBuilder(node);
      if (type === "visual-field") renderVisualField(node);
      if (type === "phototransduction") renderPhototransduction(node);
      if (type === "visual-processing") renderVisualProcessing(node);
      if (type === "cochlea") renderCochlea(node);
      if (type === "auditory-pathway") renderAuditoryPathway(node);
      if (type === "vestibular") renderVestibular(node);
      if (type === "taste-smell") renderTasteSmell(node);
    });
    bindLabTermNotes(root);
  }

  function bindLabTermNotes(root) {
    root.querySelectorAll("[data-lab-term-notes]").forEach((node) => node.remove());
  }

  function updateLabTermNotes(lab) {
    lab?.querySelector("[data-lab-term-notes]")?.remove();
  }

  function renderTermAssistant() {
    const existing = document.querySelector("[data-term-assistant]");
    existing?.remove();

    const initialOpen = new URLSearchParams(window.location.search).get("assistant") === "open";
    const widget = document.createElement("aside");
    widget.className = "term-assistant" + (initialOpen ? " open" : "");
    widget.dataset.termAssistant = "";
    const currentUnitId = document.body.dataset.unit;
    widget.innerHTML = `
      <button class="term-assistant-toggle" type="button" data-assistant-toggle aria-expanded="${initialOpen ? "true" : "false"}">
        <span>單元跳站</span>
      </button>
      <div class="term-assistant-panel station-jumper-panel" role="dialog" aria-label="單元與站別快速跳轉">
        <div class="term-assistant-head">
          <div><div class="unit-code">快速導航</div><h2>單元跳站</h2></div>
          <button class="icon-btn" type="button" data-assistant-close aria-label="關閉">&times;</button>
        </div>
        <p class="station-jumper-help">先選單元，再點要去的第幾站；每站名稱都依頁面內容自動產生。</p>
        <div class="station-unit-list">
          ${activeUnits().map((unit) => `
            <section class="station-unit ${unit.id === currentUnitId ? "current" : ""}">
              <button class="station-unit-toggle" type="button" data-station-unit="${escapeHtml(unit.id)}" aria-expanded="${unit.id === currentUnitId ? "true" : "false"}">
                <span><b>${escapeHtml(unit.shortTitle)}</b><small>${unit.sections.length} 站</small></span>
                <span aria-hidden="true">⌄</span>
              </button>
              <div class="station-links" ${unit.id === currentUnitId ? "" : "hidden"}>
                ${unit.sections.map((section, index) => `
                  <a href="./${escapeHtml(unit.file)}#${escapeHtml(section.id)}">
                    <b>第 ${index + 1} 站</b>
                    <span>${escapeHtml(String(section.title).replace(/^第\s*\d+\s*站[：:]\s*/, ""))}</span>
                  </a>
                `).join("")}
                <a class="review-jump" href="./${escapeHtml(unit.file)}#unit-review"><b>統整複習</b><span>高頻重點、關鍵句與陷阱</span></a>
              </div>
            </section>
          `).join("")}
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    const toggle = widget.querySelector("[data-assistant-toggle]");
    const close = widget.querySelector("[data-assistant-close]");

    const setOpen = (open) => {
      widget.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => setOpen(!widget.classList.contains("open")));
    close.addEventListener("click", () => setOpen(false));
    widget.querySelectorAll("[data-station-unit]").forEach((button) => {
      button.addEventListener("click", () => {
        const links = button.nextElementSibling;
        const open = links.hasAttribute("hidden");
        links.toggleAttribute("hidden", !open);
        button.setAttribute("aria-expanded", String(open));
      });
    });
  }
  function findTermMatches(raw, limit = 5) {
    const query = normalizeTerm(raw);
    if (!query) return [];
    return termExplanations
      .map(([en, zh, note]) => {
        const enKey = normalizeTerm(en);
        const zhKey = normalizeTerm(zh);
        let score = 0;
        if (enKey === query) score = 100;
        else if (zhKey === query) score = 95;
        else if (enKey.startsWith(query)) score = 80;
        else if (query.length >= 2 && enKey.includes(query)) score = 65;
        else if (query.length >= 2 && zhKey.includes(query)) score = 55;
        return score ? { en, zh, note, score, refs: findKnowledgeRefs(en, zh) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.en.length - a.en.length)
      .slice(0, limit);
  }

  function findKnowledgeRefs(en, zh) {
    const refs = [];
    activeUnits().forEach((unit) => {
      unit.sections.forEach((section) => {
        let sectionHit = false;
        const sectionText = [section.title, section.short, section.summary].join(" ");
        if (termAppearsIn(sectionText, en, zh)) sectionHit = true;
        section.points.forEach((point) => {
          const text = [
            point.title,
            point.text,
            ...(point.bullets || []),
            point.formula,
            point.drill?.question,
            ...(point.drill?.choices || []),
            point.drill?.explain
          ].join(" ");
          if (!termAppearsIn(text, en, zh)) return;
          refs.push({
            unit: unit.shortTitle,
            section: section.title,
            point: point.title,
            href: `./${unit.file}#${section.id}`
          });
        });
        if (sectionHit && !refs.some((ref) => ref.unit === unit.shortTitle && ref.section === section.title)) {
          refs.push({ unit: unit.shortTitle, section: section.title, point: "\u7ae0\u7bc0\u7e3d\u89bd", href: `./${unit.file}#${section.id}` });
        }
      });
    });
    return refs.slice(0, 6);
  }

  function renderAssistantLocalAnswer(raw, matches) {
    if (!matches.length) {
      return `
        <article class="term-assistant-card">
          <div class="unit-code">本機術語庫</div>
          <h3>${escapeHtml(raw)}</h3>
          <p>\u76ee\u524d\u672c\u6a5f\u8a5e\u5eab\u6c92\u6709\u76f4\u63a5\u547d\u4e2d\u9019\u500b\u8a5e\u3002</p>
        </article>
      `;
    }
    return matches.map((term) => `
      <article class="term-assistant-card">
        <div class="unit-code">本機術語庫</div>
        <h3>${escapeHtml(term.en)}</h3>
        <dl>
          <dt>\u4e2d\u6587</dt><dd>${escapeHtml(term.zh)}</dd>
          <dt>\u5b83\u5728\u5e79\u561b</dt><dd>${escapeHtml(term.note)}</dd>
        </dl>
        ${term.refs.length ? `
          <div class="term-assistant-refs">
            <b>\u5c0d\u61c9\u77e5\u8b58\u9ede</b>
            ${term.refs.map((ref) => `<a href="${escapeHtml(ref.href)}">${escapeHtml(ref.unit)} / ${escapeHtml(ref.section)} / ${escapeHtml(ref.point)}</a>`).join("")}
          </div>
        ` : `<p class="muted">\u76ee\u524d\u9801\u9762\u6587\u5b57\u6c92\u6709\u76f4\u63a5\u6a19\u5230\u77e5\u8b58\u9ede\uff0c\u4f46\u53ef\u5148\u7528\u4e0a\u65b9\u8a5e\u7fa9\u7406\u89e3\u3002</p>`}
      </article>
    `).join("");
  }
  function normalizeTerm(value) {
    return String(value ?? "")
      .toLowerCase()
      .replace(/[()]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function termAppearsIn(text, en, zh) {
    const source = String(text ?? "");
    if (!source) return false;
    const escaped = String(en).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    const enPattern = new RegExp(`(^|[^A-Za-z0-9+])${escaped}($|[^A-Za-z0-9+])`, "i");
    return enPattern.test(source) || (String(zh).length > 1 && source.includes(zh));
  }

  function renderCardiacConduction(node) {
    const steps = [
      ["SA node", "主節律點啟動，心房開始去極化，ECG 形成 P 波。", 150, 75],
      ["AV delay", "AV node 故意延遲，讓心房先把血送入心室，形成 PR interval。", 210, 135],
      ["His bundle", "訊號穿過房室交界，進入心室傳導主幹。", 270, 170],
      ["Bundle branches", "左右束支把訊號快速送向兩側心室。", 345, 210],
      ["Purkinje", "Purkinje fiber 讓心室幾乎同步去極化，QRS 因此窄。", 455, 250],
      ["T wave", "心室再極化形成 T 波；方向要看導程向量與電荷移動。", 530, 155],
    ];
    let index = 0;
    const labFoci = ["saNode", "avNode", "hisBundle", "bundleBranches", "purkinje", "tWave"];
    node.innerHTML = `
      <h3>心臟傳導與 ECG 對位</h3>
      <p class="muted">點擊步驟，觀察 SA node、AV delay、His-Purkinje 與 P-QRS-T 的關係。</p>
      <div class="flow-row" data-flow></div>
      <div class="lab-stage cardio-heart-lab" data-stage></div>
      <div class="mini-output" data-caption></div>
    `;
    const flow = node.querySelector("[data-flow]");
    const stage = node.querySelector("[data-stage]");
    const caption = node.querySelector("[data-caption]");
    flow.innerHTML = steps.map((step, i) => `<button class="phase-step" type="button" data-step="${i}"><strong>${escapeHtml(step[0])}</strong><br/><span>${i + 1}</span></button>`).join("");
    const update = () => {
      const step = steps[index];
      flow.querySelectorAll("[data-step]").forEach((item) => item.classList.toggle("active", Number(item.dataset.step) === index));
      stage.innerHTML = `
        <svg viewBox="0 0 680 560" role="img" aria-label="cardiac conduction diagram">
          ${renderHeartAnatomySvg({ x: 190, y: 18, scale: 1.18, mode: "conduction", focus: labFoci[index], showConduction: true, showEcg: true })}
        </svg>
      `;
      caption.innerHTML = `<strong>${escapeHtml(step[0])}</strong><span>${escapeHtml(step[1])}</span>`;
    };
    flow.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => {
      index = Number(button.dataset.step);
      update();
    }));
    update();
  }

  function renderCardiacCycle(node) {
    const phases = [
      { name: "MC → AO", label: "等容積收縮", valves: "二尖瓣關、主動脈瓣關", volume: "高點不變", pressure: "快速上升" },
      { name: "AO → AC", label: "射血期", valves: "主動脈瓣開", volume: "下降", pressure: "先升後降" },
      { name: "AC → MO", label: "等容積舒張", valves: "二尖瓣關、主動脈瓣關", volume: "低點不變", pressure: "快速下降" },
      { name: "MO → MC", label: "心室填充", valves: "二尖瓣開", volume: "上升到 EDV", pressure: "低壓填充" },
    ];
    let index = 0;
    node.innerHTML = `
      <h3>瓣膜決定心動週期</h3>
      <p class="muted">以左心室為主體：壓力跨過左心房或主動脈時，瓣膜就切換。</p>
      <div class="phase-row" data-phases></div>
      <div class="lab-stage" data-stage></div>
      <div class="mini-output" data-output></div>
    `;
    const phaseRoot = node.querySelector("[data-phases]");
    const stage = node.querySelector("[data-stage]");
    const output = node.querySelector("[data-output]");
    phaseRoot.innerHTML = phases.map((phase, i) => `<button class="phase-step" type="button" data-phase="${i}"><strong>${phase.name}</strong><br/>${phase.label}</button>`).join("");
    const update = () => {
      const phase = phases[index];
      phaseRoot.querySelectorAll("[data-phase]").forEach((button) => button.classList.toggle("active", Number(button.dataset.phase) === index));
      const volumeX = [150, 310, 430, 555][index];
      stage.innerHTML = `
        <svg viewBox="0 0 680 300">
          <line x1="72" y1="245" x2="620" y2="245" stroke="#716a60" stroke-width="2"/>
          <line x1="72" y1="245" x2="72" y2="45" stroke="#716a60" stroke-width="2"/>
          <text x="38" y="55" font-size="13" fill="#716a60">壓力</text>
          <text x="570" y="270" font-size="13" fill="#716a60">時間</text>
          <path d="M90 214 C155 212 152 78 232 72 C302 66 355 118 390 152 C426 188 493 205 590 214" fill="none" stroke="#bc3f34" stroke-width="4"/>
          <path d="M90 214 C150 214 210 214 230 214 C285 212 335 174 390 172 C440 172 510 212 590 214" fill="none" stroke="#2e5f8d" stroke-width="4"/>
          <path d="M95 222 L230 222 L390 132 L470 132 L590 222" fill="none" stroke="#23694f" stroke-width="4"/>
          <rect x="${volumeX}" y="54" width="74" height="184" rx="8" fill="rgba(184,135,30,.16)" stroke="#b8871e"/>
          <text x="100" y="36" font-size="15" font-weight="800" fill="#182033">紅: LV pressure · 藍: LA pressure · 綠: LV volume</text>
        </svg>
      `;
      output.innerHTML = `
        <strong>${phase.name} ${phase.label}</strong>
        <span>瓣膜：${phase.valves}</span>
        <span>左心室體積：${phase.volume}；左心室壓力：${phase.pressure}</span>
      `;
    };
    phaseRoot.querySelectorAll("[data-phase]").forEach((button) => button.addEventListener("click", () => {
      index = Number(button.dataset.phase);
      update();
    }));
    update();
  }

  function renderPvLoop(node) {
    const variants = {
      normal: { label: "正常", color: "#2e5f8d", points: "180,230 180,80 420,80 420,230 180,230", note: "基準 PV loop；寬度約等於 SV。" },
      preload: { label: "Preload 上升", color: "#23694f", points: "160,230 160,78 480,78 480,230 160,230", note: "靜脈回流與 EDV 上升，Frank-Starling 使 SV 增加，loop 變寬。" },
      afterload: { label: "Afterload 上升", color: "#bc3f34", points: "210,230 210,56 438,56 438,230 210,230", note: "主動脈壓上升，射血困難，ESV 上升、SV 下降，loop 變窄且變高。" },
      contractility: { label: "Contractility 上升", color: "#b8871e", points: "150,230 150,76 405,56 405,230 150,230", note: "收縮力上升，ESV 下降、SV 增加。" },
    };
    node.innerHTML = `
      <h3>Pressure-volume loop 調參</h3>
      <p class="muted">切換 preload、afterload、contractility，觀察 EDV、ESV 與 stroke volume 的方向。</p>
      <div class="lab-controls">
        <label>變化情境
          <select data-pv-select>
            <option value="normal">正常</option>
            <option value="preload">Preload 上升</option>
            <option value="afterload">Afterload 上升</option>
            <option value="contractility">Contractility 上升</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const select = node.querySelector("[data-pv-select]");
    const output = node.querySelector("[data-output]");
    const stage = node.querySelector("[data-stage]");
    const update = () => {
      const v = variants[select.value];
      const pv = v.points.split(" ").map((pair) => pair.split(",").map(Number));
      const [bottomLeft, topLeft, topRight, bottomRight] = pv;
      output.innerHTML = `<strong>${v.label}</strong><span>${v.note}</span>`;
      stage.innerHTML = `
        <svg viewBox="0 0 680 310">
          <defs><marker id="pv-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#182033"/></marker></defs>
          <line x1="105" y1="250" x2="590" y2="250" stroke="#716a60" stroke-width="2"/>
          <line x1="105" y1="250" x2="105" y2="40" stroke="#716a60" stroke-width="2"/>
          <text x="52" y="52" font-size="13" fill="#716a60">LV pressure</text>
          <text x="535" y="276" font-size="13" fill="#716a60">LV volume</text>
          <polygon points="${v.points}" fill="${v.color}22" stroke="${v.color}" stroke-width="5" stroke-linejoin="round"/>
          <path d="M${bottomLeft[0] + 26} ${bottomLeft[1]} H${bottomRight[0] - 26}" stroke="#182033" stroke-width="3" marker-end="url(#pv-arrow)"/>
          <path d="M${bottomRight[0]} ${bottomRight[1] - 26} V${topRight[1] + 26}" stroke="#182033" stroke-width="3" marker-end="url(#pv-arrow)"/>
          <path d="M${topRight[0] - 26} ${topRight[1]} H${topLeft[0] + 26}" stroke="#182033" stroke-width="3" marker-end="url(#pv-arrow)"/>
          <path d="M${topLeft[0]} ${topLeft[1] + 26} V${bottomLeft[1] - 26}" stroke="#182033" stroke-width="3" marker-end="url(#pv-arrow)"/>
          <text x="${(bottomLeft[0] + bottomRight[0]) / 2 - 28}" y="${bottomLeft[1] + 22}" font-size="13" font-weight="800" fill="#182033">filling</text>
          <text x="${bottomRight[0] + 10}" y="${(bottomRight[1] + topRight[1]) / 2}" font-size="13" font-weight="800" fill="#182033">MC</text>
          <text x="${(topLeft[0] + topRight[0]) / 2 - 28}" y="${topRight[1] - 12}" font-size="13" font-weight="800" fill="#182033">ejection</text>
          <text x="${topLeft[0] - 44}" y="${(topLeft[1] + bottomLeft[1]) / 2}" font-size="13" font-weight="800" fill="#182033">AC</text>
          <text x="${bottomLeft[0] - 20}" y="272" font-size="13" fill="#182033">ESV</text>
          <text x="${bottomRight[0] - 8}" y="272" font-size="13" fill="#182033">EDV</text>
          <path d="M${bottomLeft[0]} 266 L${bottomRight[0]} 266" stroke="#182033" stroke-width="3" marker-end="url(#pv-arrow)"/>
        </svg>
      `;
    };
    select.addEventListener("change", update);
    update();
  }

  function renderNephronMap(node) {
    const segments = {
      glomerulus: "入球小動脈進入腎絲球，血漿穿過超過濾膜到 Bowman capsule，形成濾液。",
      pct: "近曲小管大量重吸收水、NaCl、葡萄糖與胺基酸，是回收主力。",
      loop: "亨利氏環建立髓質滲透壓梯度；近髓質腎元的長 loop 對濃縮尿很重要。",
      dct: "遠曲小管參與精細調節，macula densa 位在自己的 thick ascending limb / DCT 起始附近。",
      cd: "集尿管接收多個 nephron 的濾液，受 aldosterone、ADH 等調節，決定最後尿液濃縮。",
    };
    node.innerHTML = `
      <h3>腎元路徑點選圖</h3>
      <p class="muted">先把濾液路線背成一條路：腎絲球 → PCT → loop → DCT → collecting duct。</p>
      <div class="lab-controls">
        <label>選擇結構
          <select data-nephron-select>
            ${Object.keys(segments).map((key) => `<option value="${key}">${key}</option>`).join("")}
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const select = node.querySelector("[data-nephron-select]");
    const output = node.querySelector("[data-output]");
    const stage = node.querySelector("[data-stage]");
    const positions = { glomerulus: [150, 82], pct: [280, 88], loop: [352, 225], dct: [470, 95], cd: [565, 160] };
    const update = () => {
      const [x, y] = positions[select.value];
      output.innerHTML = `<strong>${select.value}</strong><span>${segments[select.value]}</span>`;
      stage.innerHTML = `
        <svg viewBox="0 0 680 300">
          <circle cx="150" cy="82" r="44" fill="#bc3f3420" stroke="#bc3f34" stroke-width="4"/>
          <path d="M194 82 C245 28 292 58 284 104 C278 140 226 126 238 90" fill="none" stroke="#2e5f8d" stroke-width="9" stroke-linecap="round"/>
          <path d="M288 104 C342 134 310 240 360 246 C410 250 380 130 438 104" fill="none" stroke="#23694f" stroke-width="9" stroke-linecap="round"/>
          <path d="M438 104 C486 68 520 94 498 132 C480 164 432 138 470 94" fill="none" stroke="#b8871e" stroke-width="9" stroke-linecap="round"/>
          <path d="M550 58 L550 248" stroke="#6552a3" stroke-width="13" stroke-linecap="round"/>
          <circle cx="${x}" cy="${y}" r="18" fill="#182033" class="pulse-dot"/>
          <text x="102" y="155" font-size="14" font-weight="800">glomerulus</text>
          <text x="248" y="54" font-size="14" font-weight="800">PCT</text>
          <text x="286" y="276" font-size="14" font-weight="800">loop of Henle</text>
          <text x="458" y="64" font-size="14" font-weight="800">DCT</text>
          <text x="575" y="162" font-size="14" font-weight="800">CD</text>
        </svg>
      `;
    };
    select.addEventListener("change", update);
    update();
  }

  function renderRaas(node) {
    node.innerHTML = `
      <h3>RAAS 三個 renin 觸發器</h3>
      <p class="muted">調整血壓、NaCl 與交感興奮，看 renin、Ang II、aldosterone 如何推回血壓。</p>
      <div class="lab-controls">
        <label>入球壓力 <input type="range" min="60" max="130" value="90" data-pressure /></label>
        <label>Macula densa NaCl <input type="range" min="10" max="100" value="45" data-nacl /></label>
        <label>交感 β1 <input type="range" min="0" max="100" value="35" data-symp /></label>
      </div>
      <div class="flow-row">
        <div class="flow-step">JG cell<br/><strong data-renin>renin</strong></div>
        <div class="flow-step">Angiotensinogen<br/>→ Ang I</div>
        <div class="flow-step">ACE<br/>→ Ang II</div>
        <div class="flow-step">AT1<br/>TPR ↑</div>
        <div class="flow-step">Zona glomerulosa<br/>Aldosterone ↑</div>
      </div>
      <div class="mini-output" data-output></div>
    `;
    const update = () => {
      const pressure = Number(node.querySelector("[data-pressure]").value);
      const nacl = Number(node.querySelector("[data-nacl]").value);
      const symp = Number(node.querySelector("[data-symp]").value);
      const renin = Math.max(0, (105 - pressure) * 1.2) + Math.max(0, (65 - nacl) * 0.9) + symp * 0.45;
      const level = renin > 95 ? "非常高" : renin > 55 ? "偏高" : renin > 25 ? "中等" : "低";
      node.querySelector("[data-renin]").textContent = level;
      node.querySelector("[data-output]").innerHTML = `
        <strong>Renin：${level}</strong>
        <span>低壓、低 NaCl、交感 β1 都會促進 renin。Ang II 經 AT1 使小動脈收縮、TPR 上升，也刺激 aldosterone 讓 DCT/CD 留鈉排鉀，水跟著 Na 留下來。</span>
      `;
    };
    node.querySelectorAll("input").forEach((input) => input.addEventListener("input", update));
    update();
  }

  function renderClearance(node) {
    node.innerHTML = `
      <h3>Clearance 與 GFR 計算器</h3>
      <p class="muted">核心守恆式：\\(C_x = U_x \\times V / P_x\\)。和 GFR 比較可推測淨重吸收或淨分泌。</p>
      <div class="lab-controls">
        <label>尿中濃度 Ux <input type="number" value="125" step="1" data-ux /></label>
        <label>尿流速 V <input type="number" value="1" step="0.1" data-v /></label>
        <label>血漿濃度 Px <input type="number" value="1" step="0.1" data-px /></label>
        <label>參考 GFR <input type="number" value="125" step="1" data-gfr /></label>
      </div>
      <div class="mini-output" data-output></div>
    `;
    const update = () => {
      const ux = Number(node.querySelector("[data-ux]").value);
      const v = Number(node.querySelector("[data-v]").value);
      const px = Number(node.querySelector("[data-px]").value) || 1;
      const gfr = Number(node.querySelector("[data-gfr]").value);
      const clearance = ux * v / px;
      const verdict = clearance > gfr + 2 ? "淨分泌為主，Cx > GFR" : clearance < gfr - 2 ? "淨重吸收為主，Cx < GFR" : "接近 inulin 型，Tx 約 0";
      node.querySelector("[data-output]").innerHTML = `<strong>Cx = ${format(clearance)} ml/min</strong><span>${verdict}</span>`;
      typesetMath();
    };
    node.querySelectorAll("input").forEach((input) => input.addEventListener("input", update));
    update();
  }

  function renderNervousRouter(node) {
    node.innerHTML = `
      <h3>CNS/PNS 與輸入輸出分類器</h3>
      <p class="muted">課堂特別提醒：只要一個 neuron 有任何部分在周邊，它就算 PNS。</p>
      <div class="lab-controls">
        <label>案例
          <select data-case>
            <option value="drg">體感覺神經元：cell body 在 DRG，terminal 進入脊髓</option>
            <option value="alpha">α motor neuron：cell body 在 ventral horn，axon 到骨骼肌</option>
            <option value="interneuron">中間神經元：所有 component 都在脊髓或腦內</option>
            <option value="cranial">第 VIII 對腦神經</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const cases = {
      drg: ["PNS", "afferent / sensory", "DRG 在周邊；雖然 terminal 進中樞，整顆 neuron 仍歸 PNS。"],
      alpha: ["PNS", "efferent / motor", "axon 離開中樞到骨骼肌，所以不是全都在 CNS。"],
      interneuron: ["CNS", "integrative", "所有 component 都留在中樞，負責整合。"],
      cranial: ["PNS", "依腦神經而定", "12 對腦神經全部歸周邊神經系統。"],
    };
    const update = () => {
      const value = node.querySelector("[data-case]").value;
      const info = cases[value];
      node.querySelector("[data-output]").innerHTML = `<strong>${info[0]} · ${info[1]}</strong><span>${info[2]}</span>`;
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 260">
          <rect x="80" y="42" width="230" height="170" rx="8" fill="#2e5f8d18" stroke="#2e5f8d" stroke-width="4"/>
          <rect x="370" y="42" width="230" height="170" rx="8" fill="#b8871e18" stroke="#b8871e" stroke-width="4"/>
          <text x="168" y="30" font-size="16" font-weight="900">CNS</text>
          <text x="455" y="30" font-size="16" font-weight="900">PNS</text>
          <path d="M480 126 C390 80 320 80 208 126" fill="none" stroke="#bc3f34" stroke-width="5" marker-end="url(#arr)"/>
          <path d="M208 156 C318 212 408 212 480 156" fill="none" stroke="#23694f" stroke-width="5" marker-end="url(#arr2)"/>
          <circle cx="${info[0] === "CNS" ? 198 : 482}" cy="128" r="16" fill="#182033" class="pulse-dot"/>
          <defs>
            <marker id="arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#bc3f34"/></marker>
            <marker id="arr2" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#23694f"/></marker>
          </defs>
        </svg>
      `;
    };
    node.querySelector("[data-case]").addEventListener("change", update);
    update();
  }

  function renderNeuronBuilder(node) {
    const dataMap = {
      unipolar: "單極：一條突起，課堂多作為形態分類概念。",
      bipolar: "雙極：一端 dendrite、一端 axon，常見於特殊感覺如視網膜。",
      pseudo: "偽單極：DRG 感覺神經元典型；看似一條突起，分成周邊端與中樞端。",
      multi: "多極：中樞整合與 α motor neuron 常見，樹突多、可接大量訊息。",
    };
    node.innerHTML = `
      <h3>神經元形態選擇器</h3>
      <div class="lab-controls">
        <label>形態
          <select data-kind>
            <option value="pseudo">偽單極</option>
            <option value="bipolar">雙極</option>
            <option value="multi">多極</option>
            <option value="unipolar">單極</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const update = () => {
      const kind = node.querySelector("[data-kind]").value;
      node.querySelector("[data-output]").innerHTML = `<strong>${escapeHtml(dataMap[kind].split("：")[0])}</strong><span>${escapeHtml(dataMap[kind])}</span>`;
      const branches = kind === "multi" ? 6 : kind === "bipolar" ? 2 : 1;
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 260">
          <circle cx="340" cy="130" r="38" fill="#6552a320" stroke="#6552a3" stroke-width="4"/>
          <text x="322" y="136" font-size="14" font-weight="900">soma</text>
          ${Array.from({ length: branches }).map((_, i) => {
            const angle = -140 + i * (280 / Math.max(1, branches - 1));
            const x = 340 + Math.cos(angle * Math.PI / 180) * 150;
            const y = 130 + Math.sin(angle * Math.PI / 180) * 86;
            return `<path d="M340 130 C${(340 + x) / 2} ${y} ${(340 + x) / 2} ${y} ${x} ${y}" fill="none" stroke="#2e5f8d" stroke-width="5" stroke-linecap="round"/>`;
          }).join("")}
          <path d="M378 130 C462 134 520 162 585 205" fill="none" stroke="#bc3f34" stroke-width="7" stroke-linecap="round"/>
          <circle cx="585" cy="205" r="11" fill="#bc3f34"/>
          <text x="530" y="230" font-size="14" font-weight="900">axon terminal</text>
        </svg>
      `;
    };
    node.querySelector("[data-kind]").addEventListener("change", update);
    update();
  }

  function renderVisualField(node) {
    const lesionText = {
      normal: "正常：雙眼視野互補，單眼才容易看到盲點。",
      optic: "單側 optic nerve 病變：同側眼失明或嚴重缺損。",
      chiasm: "視交叉受損：鼻側視網膜纖維受影響，典型為雙顳側偏盲。",
      tract: "視徑受損：對側同名偏盲。",
    };
    node.innerHTML = `
      <h3>視野、盲點與視路病變</h3>
      <div class="lab-controls">
        <label>病變位置
          <select data-lesion>
            <option value="normal">正常</option>
            <option value="optic">左視神經</option>
            <option value="chiasm">視交叉</option>
            <option value="tract">左視徑</option>
          </select>
        </label>
        <label>測試顏色
          <select data-color>
            <option value="white">白</option>
            <option value="blue">藍</option>
            <option value="red">紅</option>
            <option value="green">綠</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const sizeMap = { white: 210, blue: 184, red: 160, green: 132 };
    const colorMap = { white: "#e7e0d0", blue: "#2e5f8d", red: "#bc3f34", green: "#23694f" };
    const update = () => {
      const lesion = node.querySelector("[data-lesion]").value;
      const color = node.querySelector("[data-color]").value;
      const rx = sizeMap[color];
      node.querySelector("[data-output]").innerHTML = `<strong>${lesionText[lesion]}</strong><span>顏色視野大小：白 > 藍 > 紅 > 綠；盲點來自 optic disc 沒有 photoreceptor。</span>`;
      const masks = {
        normal: "",
        optic: `<rect x="90" y="60" width="220" height="160" fill="rgba(24,32,51,.72)"/>`,
        chiasm: `<rect x="90" y="60" width="105" height="160" fill="rgba(24,32,51,.68)"/><rect x="485" y="60" width="105" height="160" fill="rgba(24,32,51,.68)"/>`,
        tract: `<rect x="340" y="60" width="250" height="160" fill="rgba(24,32,51,.68)"/>`,
      }[lesion];
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 290">
          <text x="170" y="38" font-size="16" font-weight="900">左眼視野</text>
          <text x="440" y="38" font-size="16" font-weight="900">右眼視野</text>
          <ellipse cx="220" cy="145" rx="${rx * .54}" ry="${rx * .36}" fill="${colorMap[color]}33" stroke="${colorMap[color]}" stroke-width="4"/>
          <ellipse cx="460" cy="145" rx="${rx * .54}" ry="${rx * .36}" fill="${colorMap[color]}33" stroke="${colorMap[color]}" stroke-width="4"/>
          <circle cx="285" cy="145" r="18" fill="#182033"/>
          <circle cx="395" cy="145" r="18" fill="#182033"/>
          <text x="268" y="190" font-size="13" font-weight="900">盲點</text>
          <text x="378" y="190" font-size="13" font-weight="900">盲點</text>
          ${masks}
        </svg>
      `;
    };
    node.querySelectorAll("select").forEach((select) => select.addEventListener("change", update));
    update();
  }

  function renderPhototransduction(node) {
    node.innerHTML = `
      <h3>cGMP 暗電流與光轉導</h3>
      <p class="muted">用三步看：黑暗通道開、光照啟動 PDE、cGMP 下降後通道關閉。</p>
      <div class="lab-controls">
        <label>環境
          <select data-mode>
            <option value="dark">黑暗</option>
            <option value="light">光照</option>
          </select>
        </label>
        <label>演示步驟
          <select data-step>
            <option value="channel">cGMP-gated channel</option>
            <option value="cascade">rhodopsin → transducin → PDE</option>
            <option value="nt">neurotransmitter release</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get("photoMode");
    const requestedStep = params.get("photoStep");
    if (["dark", "light"].includes(requestedMode)) node.querySelector("[data-mode]").value = requestedMode;
    if (["channel", "cascade", "nt"].includes(requestedStep)) node.querySelector("[data-step]").value = requestedStep;
    const update = () => {
      const light = node.querySelector("[data-mode]").value === "light";
      const step = node.querySelector("[data-step]").value;
      const channelOpen = !light;
      const activeCascade = light;
      const ntHigh = !light;
      node.querySelector("[data-output]").innerHTML = light
        ? "<strong>光照：PDE 使 cGMP 下降，Na+ channel 關閉，photoreceptor 超極化，NT release 下降。</strong>"
        : "<strong>黑暗：cGMP 高，Na+ channel 開，dark current 讓 photoreceptor 偏去極化，NT release 較高。</strong>";
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 300">
          <defs>
            <marker id="photo-arrow" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#182033"/></marker>
            <marker id="photo-red" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#bc3f34"/></marker>
            <marker id="photo-green" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#23694f"/></marker>
          </defs>
          <text x="46" y="30" font-size="14" font-weight="900">outer segment</text>
          <rect x="48" y="42" width="156" height="194" rx="56" fill="#2e5f8d20" stroke="#2e5f8d" stroke-width="4"/>
          <rect x="86" y="72" width="82" height="38" rx="12" fill="${activeCascade ? "#b8871e55" : "#fffdf7"}" stroke="#b8871e" stroke-width="3"/>
          <text x="96" y="96" font-size="12" font-weight="900">rhodopsin</text>
          <rect x="112" y="146" width="34" height="58" rx="12" fill="${channelOpen ? "#23694f66" : "#c9bea866"}" stroke="${channelOpen ? "#23694f" : "#716a60"}" stroke-width="3"/>
          <text x="84" y="222" font-size="13" font-weight="900">${channelOpen ? "Na+ open" : "Na+ closed"}</text>
          ${channelOpen ? '<path class="ion-flow" d="M24 176 H106" stroke="#23694f" stroke-width="5" marker-end="url(#photo-green)"/>' : '<path d="M66 154 L108 196 M108 154 L66 196" stroke="#bc3f34" stroke-width="4"/>'}
          <path d="M168 90 H226" stroke="${activeCascade ? "#182033" : "#c9bea8"}" stroke-width="3.5" stroke-dasharray="${activeCascade ? "" : "7 6"}" marker-end="${activeCascade ? "url(#photo-arrow)" : ""}"/>
          <rect x="232" y="66" width="96" height="48" rx="10" fill="${activeCascade ? "#b8871e44" : "#fffdf7"}" stroke="#b8871e" stroke-width="3"/>
          <text x="248" y="95" font-size="13" font-weight="900">transducin</text>
          <path d="M328 90 H370" stroke="${activeCascade ? "#182033" : "#c9bea8"}" stroke-width="3.5" stroke-dasharray="${activeCascade ? "" : "7 6"}" marker-end="${activeCascade ? "url(#photo-arrow)" : ""}"/>
          <rect x="376" y="66" width="70" height="48" rx="10" fill="${activeCascade ? "#bc3f3444" : "#fffdf7"}" stroke="#bc3f34" stroke-width="3"/>
          <text x="398" y="95" font-size="13" font-weight="900">PDE</text>
          <path d="M412 114 V142" stroke="${activeCascade ? "#182033" : "#c9bea8"}" stroke-width="3.5" stroke-dasharray="${activeCascade ? "" : "7 6"}" marker-end="${activeCascade ? "url(#photo-arrow)" : ""}"/>
          <rect x="344" y="150" width="118" height="44" rx="10" fill="${light ? "#bc3f3422" : "#23694f22"}" stroke="${light ? "#bc3f34" : "#23694f"}" stroke-width="3"/>
          <text x="368" y="177" font-size="13" font-weight="900">${light ? "cGMP low" : "cGMP high"}</text>
          <path d="M344 176 C262 228 180 226 146 188" fill="none" stroke="${light ? "#bc3f34" : "#23694f"}" stroke-width="4" marker-end="url(${light ? "#photo-red" : "#photo-green"})"/>
          <rect x="222" y="218" width="152" height="44" rx="10" fill="${light ? "#23694f22" : "#bc3f3422"}" stroke="${light ? "#23694f" : "#bc3f34"}" stroke-width="3"/>
          <text x="244" y="246" font-size="13" font-weight="900">${light ? "hyperpolarized" : "depolarized"}</text>
          <path d="M374 240 C424 240 458 218 488 190" fill="none" stroke="#182033" stroke-width="3.5" marker-end="url(#photo-arrow)"/>
          <ellipse cx="520" cy="170" rx="38" ry="44" fill="${ntHigh ? "#bc3f3424" : "#23694f24"}" stroke="${ntHigh ? "#bc3f34" : "#23694f"}" stroke-width="4"/>
          <text x="488" y="162" font-size="12" font-weight="900">terminal</text>
          <text x="496" y="184" font-size="13" font-weight="900">${ntHigh ? "NT high" : "NT low"}</text>
          <path d="M560 170 H584" stroke="#182033" stroke-width="4" marker-end="url(#photo-arrow)"/>
          <rect x="590" y="106" width="72" height="128" rx="36" fill="#fffdf7" stroke="#23694f" stroke-width="4"/>
          <text x="604" y="174" font-size="13" font-weight="900">bipolar</text>
          <circle cx="626" cy="194" r="13" fill="${ntHigh ? "#bc3f3440" : "#23694f40"}"/>
          ${light ? '<path d="M22 90 H80" stroke="#bc3f34" stroke-width="4" marker-end="url(#photo-red)"/><text x="22" y="78" font-size="12" font-weight="900">light</text>' : '<text x="22" y="78" font-size="12" font-weight="900">dark</text>'}
          <circle cx="${step === "channel" ? 128 : step === "cascade" ? 412 : 520}" cy="${step === "channel" ? 174 : step === "cascade" ? 90 : 170}" r="16" fill="#bc3f34" class="pulse-dot"/>
        </svg>
      `;
    };
    node.querySelectorAll("select").forEach((select) => select.addEventListener("change", update));
    update();
  }

  function renderVisualProcessing(node) {
    const modes = {
      path: ["Retina → LGN → V1", "視覺訊號先走主要路徑到 primary visual cortex。", 206, 118],
      inhibition: ["Lateral inhibition", "旁邊受器透過水平細胞抑制，讓亮暗邊界更清楚。", 332, 118],
      cortex: ["Secondary cortex", "association cortex 把視覺與記憶、其他感覺整合成主觀判斷。", 504, 104]
    };
    node.innerHTML = `
      <h3>視覺路徑與皮質整合</h3>
      <p class="muted">切換路徑、側向抑制與 cortex 整合，避免把視覺只想成眼球成像。</p>
      <div class="lab-controls">
        <label>演示
          <select data-mode>
            <option value="path">視覺路徑</option>
            <option value="inhibition">側向抑制</option>
            <option value="cortex">primary → secondary cortex</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const update = () => {
      const key = node.querySelector("[data-mode]").value;
      const info = modes[key];
      node.querySelector("[data-output]").innerHTML = `<strong>${info[0]}</strong><span>${info[1]}</span>`;
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 270">
          <defs><marker id="vp-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#182033"/></marker></defs>
          <circle cx="94" cy="94" r="34" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="4"/><text x="66" y="154" font-size="13" font-weight="900">retina</text>
          <path class="${key === "path" ? "signal-flow" : ""}" d="M128 96 C176 82 206 102 250 116" fill="none" stroke="#182033" stroke-width="5" marker-end="url(#vp-arr)"/>
          <rect x="254" y="86" width="72" height="60" rx="12" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/><text x="276" y="121" font-size="13" font-weight="900">LGN</text>
          <path class="${key === "path" ? "signal-flow" : ""}" d="M330 116 H410" stroke="#182033" stroke-width="5" marker-end="url(#vp-arr)"/>
          <rect x="414" y="74" width="76" height="84" rx="12" fill="#bc3f3428" stroke="#bc3f34" stroke-width="3"/><text x="438" y="112" font-size="13" font-weight="900">V1</text>
          <path class="${key === "cortex" ? "signal-flow" : ""}" d="M492 116 C536 92 574 90 618 110" fill="none" stroke="#23694f" stroke-width="5" marker-end="url(#vp-arr)"/>
          <rect x="586" y="130" width="62" height="48" rx="12" fill="#23694f33" stroke="#23694f" stroke-width="3"/><text x="596" y="160" font-size="12" font-weight="900">assoc.</text>
          <rect x="210" y="190" width="42" height="42" rx="9" fill="#fffdf7" stroke="#b8871e" stroke-width="3"/><rect x="258" y="190" width="42" height="42" rx="9" fill="#fffdf7" stroke="#b8871e" stroke-width="3"/><rect x="306" y="190" width="42" height="42" rx="9" fill="#2e5f8d33" stroke="#2e5f8d" stroke-width="3"/>
          <path class="${key === "inhibition" ? "signal-flow" : ""}" d="M260 210 H306 M306 222 H260" stroke="#bc3f34" stroke-width="4" marker-end="url(#vp-arr)"/>
          <circle cx="${info[2]}" cy="${info[3]}" r="17" fill="#bc3f34" class="pulse-dot"/>
        </svg>
      `;
    };
    node.querySelector("[data-mode]").addEventListener("change", update);
    update();
  }

  function renderCochlea(node) {
    node.innerHTML = `
      <h3>聲音進耳蝸與基底膜行波</h3>
      <p class="muted">聲波先被中耳放大，再推動卵圓窗，基底膜最大振幅的位置決定音高。</p>
      <div class="lab-controls">
        <label>頻率 Hz <input type="range" min="200" max="8000" value="1000" data-frequency /></label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const update = () => {
      const f = Number(node.querySelector("[data-frequency]").value);
      const ratio = Math.log(f / 200) / Math.log(8000 / 200);
      const x = 560 - ratio * 400;
      node.querySelector("[data-output]").innerHTML = `<strong>${f} Hz</strong><span>${f > 3000 ? "高頻：最大振幅靠近 base。" : f < 700 ? "低頻：最大振幅靠近 apex。" : "中頻：最大振幅位於中段。"}</span>`;
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 250">
          <defs><marker id="cochlea-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#182033"/></marker></defs>
          <path d="M48 98 C82 48 130 60 120 108" fill="none" stroke="#bc3f34" stroke-width="7"/>
          <path class="signal-flow" d="M138 98 H186" stroke="#182033" stroke-width="4" marker-end="url(#cochlea-arr)"/>
          <circle cx="220" cy="98" r="20" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/><circle cx="260" cy="98" r="16" fill="#b8871e44" stroke="#b8871e" stroke-width="3"/>
          <path class="signal-flow" d="M284 98 H330" stroke="#182033" stroke-width="4" marker-end="url(#cochlea-arr)"/>
          <path d="M340 142 C410 66 560 72 604 130 C634 170 560 204 504 170 C462 144 494 104 540 126" fill="none" stroke="#2e5f8d" stroke-width="10" stroke-linecap="round"/>
          <path d="M380 162 C438 190 546 190 604 148" fill="none" stroke="#b8871e" stroke-width="7" stroke-linecap="round"/>
          <path class="travel-wave" d="M380 162 C438 190 546 190 604 148" fill="none" stroke="#bc3f34" stroke-width="4" stroke-linecap="round"/>
          <circle cx="${x}" cy="162" r="18" fill="#bc3f34" class="pulse-dot"/>
          <text x="370" y="218" font-size="13" font-weight="900">apex low</text>
          <text x="536" y="92" font-size="13" font-weight="900">base high</text>
          <text x="${x - 32}" y="132" font-size="13" font-weight="900">peak</text>
        </svg>
      `;
    };
    node.querySelector("[data-frequency]").addEventListener("input", update);
    update();
  }

  function renderAuditoryPathway(node) {
    const modes = {
      hair: ["Hair-cell transduction", "Stereocilia 彎曲改變通道開關，讓機械振動變成神經訊號。", 150, 136],
      relay: ["VIII → relay → cortex", "聽覺訊號由第 VIII 對腦神經上傳，經多級中繼與過濾後到 auditory cortex。", 360, 110],
      reflex: ["Reflex branches", "同一組聽覺輸入也可分支到 attenuation、轉頭、喚醒等反射。", 514, 150]
    };
    node.innerHTML = `
      <h3>Hair cells、聽覺路徑與反射分支</h3>
      <p class="muted">把耳蝸換能、CN VIII、多級過濾和反射放在同一張路徑圖看。</p>
      <div class="lab-controls">
        <label>演示
          <select data-mode>
            <option value="hair">hair cell 換能</option>
            <option value="relay">auditory pathway</option>
            <option value="reflex">reflex branches</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const update = () => {
      const key = node.querySelector("[data-mode]").value;
      const info = modes[key];
      node.querySelector("[data-output]").innerHTML = `<strong>${info[0]}</strong><span>${info[1]}</span>`;
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 270">
          <defs><marker id="aud-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#182033"/></marker></defs>
          <rect x="62" y="160" width="170" height="18" rx="8" fill="#2e5f8d33" stroke="#2e5f8d" stroke-width="3"/>
          ${[104,142,180].map((x) => `<rect x="${x-12}" y="104" width="24" height="56" rx="8" fill="#bc3f3430" stroke="#bc3f34" stroke-width="3"/><path d="M${x-7} 104 L${x-14} 72 M${x+2} 104 L${x} 70 M${x+9} 104 L${x+18} 78" stroke="#182033" stroke-width="3" stroke-linecap="round"/>`).join("")}
          <path class="${key === "hair" ? "signal-flow" : ""}" d="M186 86 C220 92 246 106 272 122" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#aud-arr)"/>
          <rect x="280" y="86" width="60" height="54" rx="12" fill="#2e5f8d33" stroke="#2e5f8d" stroke-width="3"/><text x="296" y="118" font-size="13" font-weight="900">VIII</text>
          <path class="${key === "relay" ? "signal-flow" : ""}" d="M342 112 H420" stroke="#182033" stroke-width="4" marker-end="url(#aud-arr)"/>
          <rect x="426" y="84" width="74" height="58" rx="12" fill="#b8871e33" stroke="#b8871e" stroke-width="3"/><text x="444" y="118" font-size="13" font-weight="900">relay</text>
          <path class="${key === "relay" ? "signal-flow" : ""}" d="M502 112 H586" stroke="#182033" stroke-width="4" marker-end="url(#aud-arr)"/>
          <rect x="592" y="84" width="58" height="58" rx="12" fill="#23694f33" stroke="#23694f" stroke-width="3"/><text x="604" y="118" font-size="13" font-weight="900">ctx</text>
          <path class="${key === "reflex" ? "signal-flow" : ""}" d="M420 142 C464 176 514 184 572 160" fill="none" stroke="#6552a3" stroke-width="4" stroke-dasharray="6 5" marker-end="url(#aud-arr)"/>
          <text x="488" y="206" font-size="13" font-weight="900">protect · turn · arouse</text>
          <circle cx="${info[2]}" cy="${info[3]}" r="17" fill="#bc3f34" class="pulse-dot"/>
        </svg>
      `;
    };
    node.querySelector("[data-mode]").addEventListener("change", update);
    update();
  }

  function renderVestibular(node) {
    node.innerHTML = `
      <h3>前庭：半規管、耳石器與眼震</h3>
      <p class="muted">旋轉看 cupula 彎曲；線性加速度看 otolith membrane 位移。眼球補償只在固定水平線上動，不亂飄。</p>
      <div class="lab-controls">
        <label>刺激
          <select data-mode>
            <option value="rotate">原地旋轉後停止</option>
            <option value="linear">電梯上升/車子加速</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const update = () => {
      const rotate = node.querySelector("[data-mode]").value === "rotate";
      node.querySelector("[data-output]").innerHTML = rotate
        ? "<strong>角加速度</strong><span>內淋巴慣性使 cupula 彎曲，停止後仍可出現短暫眼震。</span>"
        : "<strong>線性加速度</strong><span>utricle/saccule maculae 偵測頭部位移與重力方向。</span>";
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 250">
          <defs><marker id="vest-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#182033"/></marker></defs>
          <path d="M126 60 C194 20 270 52 236 108 C196 174 96 138 126 60Z" fill="none" stroke="#2e5f8d" stroke-width="8"/>
          <path d="M172 92 C190 78 214 78 232 94" fill="none" stroke="#b8871e" stroke-width="5"/>
          <path class="${rotate ? "cupula-sway" : ""}" d="M204 96 C210 122 216 136 224 154" fill="none" stroke="#bc3f34" stroke-width="6" stroke-linecap="round"/>
          <ellipse cx="342" cy="138" rx="78" ry="28" fill="#23694f26" stroke="#23694f" stroke-width="4"/>
          <path class="${!rotate ? "otolith-slide" : ""}" d="M292 128 H392" stroke="#b8871e" stroke-width="8" stroke-linecap="round"/>
          <circle cx="472" cy="112" r="34" fill="#fffdf7" stroke="#182033" stroke-width="4"/><circle class="${rotate ? "nystagmus-eye" : ""}" cx="472" cy="112" r="9" fill="#182033"/>
          <path d="M430 112 H390" stroke="#bc3f34" stroke-width="4" marker-end="url(#vest-arr)"/>
          <text x="108" y="198" font-size="13" font-weight="900">semicircular canal</text>
          <text x="286" y="198" font-size="13" font-weight="900">utricle / saccule</text>
          <text x="438" y="198" font-size="13" font-weight="900">${rotate ? "VOR / nystagmus" : "eye reference"}</text>
        </svg>
      `;
    };
    node.querySelector("[data-mode]").addEventListener("change", update);
    update();
  }

  function renderTasteSmell(node) {
    const modes = {
      taste: ["Taste buds", "酸、鹹、甜、苦、鮮由不同化學刺激啟動味蕾，再經 VII、IX、X 傳入。", 142, 98],
      smell: ["Olfactory epithelium", "氣味分子刺激嗅上皮 receptor，嗅覺特別容易連到 limbic system。", 306, 96],
      flavor: ["Flavor integration", "吃東西的風味是味覺加嗅覺；鼻塞時常是嗅覺貢獻變少。", 470, 116]
    };
    node.innerHTML = `
      <h3>味覺、嗅覺與 flavor 整合</h3>
      <p class="muted">把舌頭味蕾、嗅上皮、limbic 記憶情緒連結放在同一張圖看。</p>
      <div class="lab-controls">
        <label>演示
          <select data-mode>
            <option value="taste">五味與味覺神經</option>
            <option value="smell">嗅上皮與 limbic</option>
            <option value="flavor">味覺 + 嗅覺 = flavor</option>
          </select>
        </label>
        <div class="mini-output" data-output></div>
      </div>
      <div class="lab-stage" data-stage></div>
    `;
    const update = () => {
      const key = node.querySelector("[data-mode]").value;
      const info = modes[key];
      node.querySelector("[data-output]").innerHTML = `<strong>${info[0]}</strong><span>${info[1]}</span>`;
      node.querySelector("[data-stage]").innerHTML = `
        <svg viewBox="0 0 680 250">
          <defs><marker id="ts-arr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#182033"/></marker></defs>
          <path d="M72 76 C122 42 190 42 238 76 C196 124 116 124 72 76Z" fill="#bc3f3426" stroke="#bc3f34" stroke-width="4"/>
          ${[[118,"#b8871e","salty"],[146,"#23694f","bitter"],[174,"#2e5f8d","umami"]].map(([x,c])=>`<circle cx="${x}" cy="82" r="8" fill="${c}"/>`).join("")}
          <path class="${key === "taste" || key === "flavor" ? "signal-flow" : ""}" d="M238 82 C286 84 310 104 336 130" fill="none" stroke="#182033" stroke-width="4" marker-end="url(#ts-arr)"/>
          <path d="M268 54 C320 30 378 42 394 82 C366 74 316 74 268 54Z" fill="#2e5f8d22" stroke="#2e5f8d" stroke-width="4"/>
          <circle cx="326" cy="62" r="7" fill="#2e5f8d"/><circle cx="352" cy="64" r="7" fill="#23694f"/>
          <path class="${key === "smell" || key === "flavor" ? "signal-flow" : ""}" d="M384 82 C420 92 444 106 470 124" fill="none" stroke="#2e5f8d" stroke-width="4" marker-end="url(#ts-arr)"/>
          <rect x="466" y="98" width="86" height="58" rx="14" fill="#6552a333" stroke="#6552a3" stroke-width="4"/><text x="486" y="132" font-size="13" font-weight="900">limbic</text>
          <path class="${key === "flavor" ? "signal-flow" : ""}" d="M334 132 C382 174 468 178 538 150" fill="none" stroke="#23694f" stroke-width="4" marker-end="url(#ts-arr)"/>
          <text x="458" y="190" font-size="13" font-weight="900">memory · emotion · flavor</text>
          <circle cx="${info[2]}" cy="${info[3]}" r="17" fill="#bc3f34" class="pulse-dot"/>
        </svg>
      `;
    };
    node.querySelector("[data-mode]").addEventListener("change", update);
    update();
  }

  const termExplanations = [
    ["primary visual cortex", "初級視覺皮質", "先接收並初步判讀視覺輸入"],
    ["secondary visual cortex", "次級視覺皮質", "把視覺和記憶、其他感覺整合"],
    ["association visual cortex", "聯合視覺皮質", "參與較主觀的辨識與整合"],
    ["lateral geniculate body", "外側膝狀體", "丘腦內的視覺中繼站"],
    ["visual cortex", "視覺皮質", "大腦處理視覺訊號的區域"],
    ["optic nerve/chiasm", "視神經/視交叉", "視神經傳入後，鼻側纖維在視交叉交叉"],
    ["optic chiasm", "視交叉", "鼻側視網膜纖維在此交叉"],
    ["optic tract", "視束", "把視交叉後訊號送往丘腦"],
    ["tract", "神經束", "中樞內成束傳遞訊號的路徑"],
    ["optic nerve", "視神經", "把視網膜訊號送進中樞"],
    ["optic disc", "視神經盤", "沒有感光細胞，所以形成生理盲點"],
    ["photoreceptor", "感光細胞", "把光刺激轉成膜電位變化"],
    ["phototransduction", "光轉導", "把光變成神經訊號的化學鏈"],
    ["dark current", "暗電流", "黑暗時鈉離子內流使感光細胞偏去極化"],
    ["cGMP-gated Na+ channel", "cGMP 門控鈉離子通道", "cGMP 高時開啟，光照後關閉"],
    ["Na+ channel", "鈉離子通道", "控制鈉離子進出細胞"],
    ["rhodopsin", "視紫質", "桿細胞內吸光後啟動光轉導"],
    ["transducin", "轉導蛋白", "把視紫質訊號傳給 PDE"],
    ["PDE", "磷酸二酯酶", "分解 cGMP，使鈉通道關閉"],
    ["cGMP", "環鳥苷酸", "黑暗時維持感光細胞鈉通道開啟"],
    ["GMP", "鳥苷酸", "cGMP 被 PDE 分解後的產物"],
    ["rhodopsin-retinal cycle", "視紫質-視黃醛循環", "讓感光色素再生"],
    ["retina", "視網膜", "接收光並初步處理視覺訊號"],
    ["rod", "桿細胞", "負責暗視覺，高敏感但解析度低"],
    ["cone", "錐細胞", "負責色覺與高解析明視覺"],
    ["bipolar", "雙極細胞", "接收感光細胞訊號並傳給神經節細胞"],
    ["contrast", "對比", "幫助分辨邊界和明暗差"],
    ["lateral inhibition", "側向抑制", "讓邊界更銳利、對比更強"],
    ["binocular disparity", "雙眼視差", "提供立體深度線索"],
    ["convergence", "視軸會聚", "看近物時兩眼內收對準目標"],
    ["fovea", "中央凹", "視覺解析度最高的區域"],
    ["flicker fusion", "閃爍融合", "高頻閃光被感覺成連續光"],
    ["accommodation", "視覺調節", "看近物時晶狀體變凸、瞳孔縮小、視軸會聚"],
    ["afterimage", "後像", "刺激停止後短暫殘留的視覺感覺"],
    ["hyperpolarization", "超極化", "膜電位變得更負，感光細胞釋放傳遞物下降"],
    ["depolarization", "去極化", "膜電位變得較正，較容易傳遞訊號"],
    ["neurotransmitter", "神經傳遞物", "細胞間傳遞訊號的化學物質"],
    ["NT release", "神經傳遞物釋放", "感光細胞影響下一級細胞的方式"],
    ["NT", "神經傳遞物", "神經細胞釋放來影響下一級細胞的化學訊號"],
    ["thalamus", "丘腦", "多數感覺訊號進皮質前的中繼站"],
    ["cortex", "大腦皮質", "高階感覺處理與整合區"],
    ["auditory cortex", "聽覺皮質", "大腦處理聲音與音調的區域"],
    ["organ of Corti", "柯蒂氏器", "耳蝸內含毛細胞的聽覺受器區"],
    ["Corti organ", "柯蒂氏器", "耳蝸內含毛細胞的聽覺受器區"],
    ["hair cells", "毛細胞", "把機械彎曲轉成神經訊號"],
    ["hair cell", "毛細胞", "把機械彎曲轉成神經訊號"],
    ["stereocilia", "靜纖毛", "彎曲後開關離子通道"],
    ["basilar membrane", "基底膜", "行波最大振幅位置決定音高"],
    ["tectorial membrane", "蓋膜", "和基底膜相對移動以彎曲靜纖毛"],
    ["tympanic membrane", "鼓膜", "接收空氣聲波並震動"],
    ["ossicular system", "聽骨系統", "把鼓膜振動傳到卵圓窗"],
    ["ossicle", "聽小骨", "中耳槓桿傳聲結構"],
    ["oval window", "卵圓窗", "把中耳震動傳入耳蝸液體"],
    ["round window", "圓窗", "釋放耳蝸液體壓力波"],
    ["outer ear", "外耳", "收集聲波"],
    ["middle ear", "中耳", "放大並傳遞聲波"],
    ["inner ear", "內耳", "把聲音與平衡刺激轉成神經訊號"],
    ["cochlea", "耳蝸", "聽覺換能器官"],
    ["impedance matching", "阻抗匹配", "讓空氣聲波有效進入液體內耳"],
    ["attenuation reflex", "衰減反射", "大聲時降低傳導以保護內耳"],
    ["stapedius", "鐙骨肌", "收縮後降低聽骨鏈振動"],
    ["tensor tympani", "鼓膜張肌", "收縮後降低鼓膜/聽骨傳導"],
    ["head rotation reflex", "轉頭反射", "讓頭轉向聲源"],
    ["arousal", "喚醒反應", "突發聲提高警覺"],
    ["tonotopy", "音調定位圖", "不同頻率對應不同基底膜/皮質位置"],
    ["base", "耳蝸基底端", "偏高頻最大振幅區"],
    ["apex", "耳蝸頂端", "偏低頻最大振幅區"],
    ["conduction deafness", "傳導性耳聾", "外耳或中耳傳聲障礙"],
    ["nerve deafness", "神經性耳聾", "耳蝸、聽神經或中樞路徑障礙"],
    ["auditory pathway", "聽覺路徑", "把耳蝸訊號送到聽覺皮質"],
    ["CN VIII", "第八對腦神經", "傳遞聽覺與前庭訊號"],
    ["semicircular ducts", "半規管", "偵測頭部旋轉角加速度"],
    ["semicircular canal", "半規管", "偵測頭部旋轉角加速度"],
    ["vestibular apparatus", "前庭器", "偵測平衡與頭部運動"],
    ["proprioceptors", "本體感受器", "回報肌肉關節位置"],
    ["cupula", "壺腹嵴膠帽", "被內淋巴推動後彎曲毛細胞"],
    ["otolith membrane", "耳石膜", "偵測線性加速度與重力方向"],
    ["utricle", "橢圓囊", "偏水平線性加速度與頭位"],
    ["saccule", "球囊", "偏垂直線性加速度與頭位"],
    ["maculae", "耳石斑", "橢圓囊/球囊內的感受區"],
    ["linear acceleration", "線性加速度", "直線加速或頭位改變"],
    ["angular acceleration", "角加速度", "旋轉加速"],
    ["nystagmus", "眼震", "前庭刺激後眼球快慢相交替運動"],
    ["VOR", "前庭眼反射", "頭動時穩定視線"],
    ["taste buds", "味蕾", "偵測溶於唾液的化學味質"],
    ["olfactory epithelium", "嗅上皮", "氣味受器所在位置"],
    ["olfactory receptor cell", "嗅覺受器細胞", "把氣味分子轉成神經訊號"],
    ["olfactory", "嗅覺", "偵測氣味分子"],
    ["limbic system", "邊緣系統", "連結情緒與記憶"],
    ["flavor", "風味", "味覺加嗅覺共同形成的食物感受"],
    ["primary sensations of taste", "基本味質", "五種主要味覺分類"],
    ["sour", "酸味", "常和氫離子相關"],
    ["salty", "鹹味", "常和鈉離子相關"],
    ["sweet", "甜味", "常代表糖類或有機物"],
    ["bitter", "苦味", "常作為可能毒物的警示"],
    ["umami", "鮮味", "常和麩胺酸相關"],
    ["quinine", "奎寧", "苦味閾值例子"],
    ["threshold", "閾值", "剛能偵測到刺激的最低強度"],
    ["facial nerve", "顏面神經", "第七對，傳遞部分味覺"],
    ["glossopharyngeal nerve", "舌咽神經", "第九對，傳遞部分味覺"],
    ["vagus nerve", "迷走神經", "第十對，傳遞部分味覺"],
    ["VII", "第七對腦神經", "常參與前舌味覺"],
    ["IX", "第九對腦神經", "常參與後舌味覺"],
    ["X", "第十對腦神經", "常參與咽喉區味覺"],
    ["ECG", "心電圖", "記錄心臟電活動"],
    ["12 lead ECG", "十二導程心電圖", "從不同角度看心臟電活動"],
    ["bipolar limb leads", "雙極肢導程", "用兩個肢體電極形成觀看方向"],
    ["augmented limb leads", "加壓肢導程", "用單一正極方向看心臟電向量"],
    ["lead", "導程", "心電圖觀看電向量的角度"],
    ["aVR", "aVR 導程", "正極在右上，正常常呈負波"],
    ["aVL", "aVL 導程", "從左上方向看心臟電向量"],
    ["aVF", "aVF 導程", "從下方看心臟電向量"],
    ["P wave", "P 波", "代表心房去極化"],
    ["P", "P 波", "代表心房去極化"],
    ["QRS complex", "QRS 波群", "代表心室去極化"],
    ["QRS", "QRS 波群", "代表心室去極化"],
    ["T wave", "T 波", "代表心室再極化"],
    ["T", "T 波", "代表心室再極化"],
    ["PR interval", "PR 間期", "反映房室傳導時間"],
    ["ST segment", "ST 段", "可用來評估心肌缺血/損傷"],
    ["QT interval", "QT 間期", "反映心室去極化到再極化時間"],
    ["RR interval", "RR 間期", "用來估計心率與節律規則性"],
    ["axis", "心電軸", "平均去極化向量方向"],
    ["R wave progression", "R 波進展", "胸導程中 R 波逐漸變大的變化"],
    ["arrhythmia", "心律不整", "心臟節律或傳導異常"],
    ["AF", "心房顫動", "無明確 P 波且 RR 間期不規則"],
    ["VF", "心室顫動", "心室亂放電，無有效心輸出"],
    ["AV block", "房室傳導阻滯", "房室結或傳導路徑變慢/中斷"],
    ["Bundle branch block", "束支阻斷", "心室傳導變慢而 QRS 變寬"],
    ["ST elevation", "ST 段上升", "可提示急性心肌損傷"],
    ["troponin", "肌鈣蛋白", "心肌損傷常用生物標記"],
    ["RA", "右心房", "接收全身靜脈血"],
    ["RV", "右心室", "把血送往肺循環"],
    ["LA", "左心房", "接收肺靜脈血"],
    ["LV", "左心室", "把血送往全身循環"],
    ["chamber", "心腔", "心臟內的房間"],
    ["chambers", "心腔", "心臟內的房間"],
    ["AV valves", "房室瓣", "防止心室血液回流到心房"],
    ["AV valve", "房室瓣", "防止心室血液回流到心房"],
    ["tricuspid valve", "三尖瓣", "右房右室之間的房室瓣"],
    ["bicuspid valve", "二尖瓣", "左房左室之間的房室瓣"],
    ["mitral valve", "二尖瓣", "左房左室之間的房室瓣"],
    ["semilunar valves", "半月瓣", "防止動脈血回流到心室"],
    ["semilunar valve", "半月瓣", "防止動脈血回流到心室"],
    ["pulmonary valve", "肺動脈瓣", "右心室出口瓣膜"],
    ["aortic valve", "主動脈瓣", "左心室出口瓣膜"],
    ["aorta", "主動脈", "左心室把血送往全身的出口"],
    ["pulmonary artery", "肺動脈", "右心室把血送往肺的出口"],
    ["systemic circulation", "體循環", "把氧合血送到全身"],
    ["pulmonary circulation", "肺循環", "把血送到肺進行氣體交換"],
    ["lub", "第一心音聲", "常對應 S1"],
    ["dup", "第二心音聲", "常對應 S2"],
    ["S1", "第一心音", "主要來自房室瓣關閉"],
    ["S2", "第二心音", "主要來自半月瓣關閉"],
    ["S3", "第三心音", "快速心室填充相關聲音"],
    ["S4", "第四心音", "心房收縮推入僵硬心室相關聲音"],
    ["gallop rhythm", "奔馬律", "S3/S4 出現時的異常節律感"],
    ["working myocyte", "工作心肌細胞", "主要負責收縮做功"],
    ["pacemaker", "節律點", "自發產生心臟電節律"],
    ["conducting system", "傳導系統", "把節律訊號傳遍心臟"],
    ["SA node", "竇房結", "正常主要節律點"],
    ["AV node", "房室結", "延遲並傳遞心房到心室訊號"],
    ["His bundle", "希氏束", "把訊號由房室結送往心室"],
    ["atrioventricular bundle", "希氏束", "把訊號由房室結送往左右束支"],
    ["bundle branch", "束支", "把訊號分送至左右心室"],
    ["bundle branches", "左右束支", "把訊號分送左右心室"],
    ["Purkinje fiber", "浦肯野纖維", "快速同步心室去極化"],
    ["His-Purkinje", "希氏束-浦肯野系統", "快速傳導到心室"],
    ["His-Purkinje system", "希氏束-浦肯野系統", "由希氏束、束支與浦肯野纖維組成的快速心室傳導系統"],
    ["left ventricle", "左心室", "把含氧血射入主動脈供應全身"],
    ["right ventricle", "右心室", "把缺氧血射入肺動脈"],
    ["left atrium", "左心房", "接收肺靜脈回流的含氧血"],
    ["right atrium", "右心房", "接收全身靜脈回流的缺氧血"],
    ["mitral valve", "二尖瓣", "左心房與左心室之間的房室瓣"],
    ["tricuspid valve", "三尖瓣", "右心房與右心室之間的房室瓣"],
    ["atrioventricular valve", "房室瓣", "位於心房與心室之間的單向瓣膜"],
    ["semilunar valve", "半月瓣", "位於心室出口的主動脈瓣或肺動脈瓣"],
    ["depolarization", "去極化", "膜電位變得較不負並可觸發電訊號"],
    ["repolarization", "再極化", "膜電位恢復至靜止方向"],
    ["ventricular depolarization", "心室去極化", "正常主要對應 QRS complex"],
    ["atrial depolarization", "心房去極化", "正常主要對應 P wave"],
    ["ventricular repolarization", "心室再極化", "正常主要對應 T wave"],
    ["P wave", "P 波", "代表心房去極化"],
    ["T wave", "T 波", "代表心室再極化"],
    ["gap junction", "間隙連接", "讓心肌細胞電訊號同步傳遞"],
    ["AV delay", "房室延遲", "讓心房先收縮、心室後收縮"],
    ["pre-excitation", "預激症候群", "訊號提早繞過正常房室延遲"],
    ["WPW", "沃夫-巴金森-懷特症候群", "常見 PR 短與 delta 波"],
    ["LGL", "朗-甘-萊文症候群", "可見 PR 短但無 delta 波"],
    ["delta wave", "delta 波", "WPW 常見的 QRS 初始鈍斜波"],
    ["PV loop", "壓力-體積迴圈", "用來看心室做功與每搏輸出"],
    ["MC", "二尖瓣關閉", "等容積收縮開始"],
    ["AO", "主動脈瓣開啟", "射血開始"],
    ["AC", "主動脈瓣關閉", "等容積舒張開始"],
    ["MO", "二尖瓣開啟", "心室填充開始"],
    ["isovolumic contraction", "等容積收縮", "兩瓣都關、壓力上升但體積不變"],
    ["isovolumic relaxation", "等容積舒張", "兩瓣都關、壓力下降但體積不變"],
    ["systole", "收縮期", "心室收縮與射血區間"],
    ["diastole", "舒張期", "心室放鬆與填充區間"],
    ["EDV", "舒張末期容積", "心室填充後最大容積"],
    ["ESV", "收縮末期容積", "射血後心室剩餘容積"],
    ["SV", "每搏輸出量", "每次心跳射出的血量"],
    ["EF", "射出分率", "SV/EDV，用來估計收縮功能"],
    ["preload", "前負荷", "心室舒張末被填入的拉伸量"],
    ["afterload", "後負荷", "心室射血時要對抗的壓力"],
    ["contractility", "收縮力", "心肌本身產生張力的能力"],
    ["stroke volume", "每搏輸出量", "每次心跳射出的血量"],
    ["cardiac output", "心輸出量", "每分鐘心臟射出的血量"],
    ["CO", "心輸出量", "每分鐘心臟射出的血量"],
    ["HR", "心率", "每分鐘心跳次數"],
    ["Frank-Starling", "法蘭克-史達林機制", "心肌拉越長通常收縮越強"],
    ["venous return", "靜脈回流", "回到心臟的血量"],
    ["TPR/afterload", "總周邊阻力/後負荷", "小動脈阻力升高會讓心室射血更困難"],
    ["TPR", "總周邊阻力", "小動脈阻力影響後負荷"],
    ["histamine", "組織胺", "可造成血管擴張等反應"],
    ["muscarinic antagonist", "蕈毒鹼受體拮抗劑", "阻斷副交感膽鹼作用"],
    ["β antagonist", "乙型受體拮抗劑", "降低交感對心臟的刺激"],
    ["Ca2+ blocker", "鈣離子通道阻斷劑", "降低鈣離子進入而減弱收縮"],
    ["GFR/clearance", "腎絲球過濾率/清除率", "用質量守恆判斷腎臟處理量"],
    ["GFR/RPF/clearance", "腎絲球過濾率/腎血漿流量/清除率", "腎功能計算的三個核心量"],
    ["GFR", "腎絲球過濾率", "每分鐘形成濾液的體積"],
    ["RPF", "腎血漿流量", "每分鐘流經腎臟的血漿量"],
    ["RBF", "腎血流量", "每分鐘流經腎臟的全血量"],
    ["clearance", "清除率", "單位時間內被腎臟清掉的血漿體積"],
    ["inulin", "菊粉", "估計 GFR 的理想濾過標記"],
    ["PAH", "對胺馬尿酸", "常用來估計有效腎血漿流量"],
    ["filtration", "過濾", "血漿成分由腎絲球進入鮑氏囊"],
    ["reabsorption", "再吸收", "把小管內物質送回血液"],
    ["secretion", "分泌", "把血液物質送入小管腔"],
    ["excretion", "排泄", "最後排出尿中的量"],
    ["glomerulus", "腎絲球", "腎元內負責過濾的毛細血管球"],
    ["glomerular", "腎絲球", "與腎絲球過濾相關"],
    ["Bowman capsule", "鮑氏囊", "收集腎絲球濾液"],
    ["podocyte", "足細胞", "形成濾過裂隙的重要細胞"],
    ["fenestrated endothelium", "有窗孔內皮", "讓血漿小分子通過"],
    ["basement membrane", "基底膜", "腎絲球濾過屏障重要層"],
    ["filtration slit", "濾過裂隙", "足細胞間限制蛋白通過"],
    ["albumin", "白蛋白", "正常不易通過濾過屏障"],
    ["nephron", "腎元", "腎臟產生尿液的基本功能單位"],
    ["cortical nephron", "皮質腎元", "主要位於皮質，髓袢較短"],
    ["juxtamedullary nephron", "近髓腎元", "髓袢長，對濃縮尿重要"],
    ["PCT", "近曲小管", "大量再吸收水、鈉與養分"],
    ["loop of Henle", "亨利氏環", "建立髓質滲透梯度"],
    ["DCT", "遠曲小管", "受荷爾蒙調控鈉鉀鈣等"],
    ["collecting duct", "集尿管", "受 ADH/醛固酮調控水鈉處理"],
    ["CD", "集尿管", "受 ADH/醛固酮調控水與鈉處理"],
    ["NKCC2", "鈉鉀二氯共同運輸器", "粗上行支再吸收鹽分"],
    ["vasa recta", "直血管", "維持髓質滲透梯度"],
    ["peritubular capillary", "管周微血管", "接收小管再吸收物"],
    ["cortex", "皮質", "腎臟外層或大腦外層處理區"],
    ["medulla", "髓質", "腎臟內層或腦幹區域，需看上下文"],
    ["pelvis", "腎盂", "收集尿液進入輸尿管"],
    ["ureter", "輸尿管", "把尿液從腎臟送到膀胱"],
    ["bladder", "膀胱", "暫時儲存尿液"],
    ["urethra", "尿道", "把尿液排出體外"],
    ["JGA", "近腎絲球器", "感測壓力/鹽分並調控腎素"],
    ["JG cell", "近腎絲球細胞", "分泌腎素"],
    ["macula densa", "緻密斑", "偵測遠曲小管鈉氯濃度"],
    ["RAAS", "腎素-血管張力素-醛固酮系統", "調節血壓、血量與鈉保留"],
    ["renin", "腎素", "啟動 RAAS 的酵素"],
    ["angiotensinogen", "血管張力素原", "腎素作用的肝臟來源前驅物"],
    ["Ang I", "血管張力素 I", "ACE 轉換前的中間產物"],
    ["Ang II", "血管張力素 II", "收縮血管並促進醛固酮"],
    ["ACE", "血管張力素轉換酶", "把 Ang I 轉成 Ang II"],
    ["aldosterone", "醛固酮", "促進鈉再吸收與鉀分泌"],
    ["EPO", "紅血球生成素", "刺激骨髓製造紅血球"],
    ["erythropoietin", "紅血球生成素", "刺激骨髓製造紅血球"],
    ["vitamin D", "維生素 D", "腎臟可活化以調控鈣磷"],
    ["1,25-(OH)2 vitamin D", "活性維生素 D", "增加腸道鈣磷吸收"],
    ["CNS/PNS", "中樞/周邊神經系統", "用神經元位置判斷分類"],
    ["neuron", "神經元", "神經系統傳遞訊號的細胞"],
    ["CNS", "中樞神經系統", "腦與脊髓"],
    ["PNS", "周邊神經系統", "中樞外的神經結構"],
    ["excitable cells", "可興奮細胞", "能把刺激轉成電位變化"],
    ["excitability", "可興奮性", "細胞對刺激產生電反應的能力"],
    ["homeostasis", "恆定", "維持體內環境穩定"],
    ["input", "輸入", "接收傳入訊號"],
    ["integrate", "整合", "把多個訊號合併判讀"],
    ["integration", "整合", "中樞處理並合併訊號"],
    ["integrative", "整合型", "負責中樞內訊號處理"],
    ["process", "處理", "對訊號進行中樞加工"],
    ["output", "輸出", "把反應指令送出去"],
    ["communication", "溝通", "細胞或系統之間傳遞訊息"],
    ["control", "控制", "調節器官或系統反應"],
    ["afferent", "傳入", "把感覺訊號送往中樞"],
    ["efferent", "傳出", "把運動或自律指令送出中樞"],
    ["sensory", "感覺", "接收身體或外界刺激"],
    ["motor", "運動", "控制肌肉或腺體反應"],
    ["somatic", "體神經", "多控制骨骼肌與意識性動作"],
    ["autonomic", "自主神經", "控制內臟、血管與腺體"],
    ["enteric", "腸神經", "調控腸胃道活動"],
    ["soma", "細胞本體", "含細胞核的神經元主體"],
    ["dendrite", "樹突", "接收其他神經元訊號"],
    ["axon", "軸突", "把訊號傳往遠端"],
    ["axon hillock", "軸丘", "動作電位常從此被觸發"],
    ["terminal", "神經末梢", "釋放神經傳遞物"],
    ["action potential", "動作電位", "神經元快速傳遞的電訊號"],
    ["resting potential", "靜止膜電位", "細胞未被刺激時的膜電位"],
    ["voltage-gated", "電壓門控", "受膜電位變化控制開關"],
    ["myelin", "髓鞘", "提高軸突傳導速度"],
    ["myelination", "髓鞘化", "形成髓鞘以加速傳導"],
    ["Schwann cell", "許旺細胞", "周邊神經系統形成髓鞘"],
    ["oligodendrocyte", "寡樹突膠細胞", "中樞神經系統形成髓鞘"],
    ["node of Ranvier", "郎飛氏結", "髓鞘間隙，支援跳躍式傳導"],
    ["saltatory conduction", "跳躍式傳導", "動作電位在郎飛氏結間快速傳遞"],
    ["glia", "膠細胞", "支持、保護與調控神經元"],
    ["astrocyte", "星狀膠細胞", "支持 BBB 與神經環境穩定"],
    ["microglia", "小膠細胞", "中樞免疫清除細胞"],
    ["ependymal cell", "室管膜細胞", "與腦脊髓液流動相關"],
    ["satellite cell", "衛星細胞", "周邊神經節支持細胞"],
    ["BBB", "血腦障壁", "限制血液物質進入中樞"],
    ["brainstem", "腦幹", "包含中腦、橋腦、延腦等生命中樞"],
    ["midbrain", "中腦", "參與視聽反射與運動調控"],
    ["pons", "橋腦", "連接小腦並參與呼吸調節"],
    ["cerebellum", "小腦", "協調動作與平衡"],
    ["cerebrum", "大腦", "高階認知、感覺與運動整合"],
    ["diencephalon", "間腦", "包含丘腦與下視丘等"],
    ["hypothalamus", "下視丘", "調控內分泌、自主神經與恆定"],
    ["spinal cord", "脊髓", "傳導與反射中樞"],
    ["dorsal root ganglion", "背根神經節", "含感覺神經元細胞本體"],
    ["DRG", "背根神經節", "含感覺神經元細胞本體"],
    ["cranial nerve", "腦神經", "從腦幹/大腦出入的周邊神經"],
    ["spinal nerve", "脊神經", "從脊髓出入的周邊神經"],
    ["oculomotor", "動眼神經", "第三對腦神經，控制多數眼外肌"],
    ["trochlear", "滑車神經", "第四對腦神經，控制上斜肌"],
    ["trigeminal", "三叉神經", "第五對腦神經，臉部感覺與咀嚼"],
    ["abducens", "外旋神經", "第六對腦神經，控制外直肌"],
    ["vestibulocochlear", "前庭耳蝸神經", "第八對腦神經，聽覺與平衡"],
    ["accessory", "副神經", "第十一對腦神經，控制胸鎖乳突肌與斜方肌"],
    ["hypoglossal", "舌下神經", "第十二對腦神經，控制舌肌"],
    ["multipolar", "多極神經元", "多樹突單軸突，常見於運動神經元"],
    ["bipolar neuron", "雙極神經元", "常見於特殊感覺路徑"],
    ["pseudounipolar", "假單極神經元", "常見於感覺神經節"],
    ["unipolar", "單極神經元", "單一突起的神經元型態"],
    ["interneuron", "中間神經元", "在中樞內整合訊號"],
    ["serotonin", "血清素", "神經調節物質，影響情緒等"],
    ["substance P", "P 物質", "常與痛覺傳遞相關"]
    ,["pressure gradient", "壓力梯度", "壓力差會推動血液或液體移動"]
    ,["pressure", "壓力", "單位面積承受的推力"]
    ,["volume", "容積", "空間內所裝的液體量"]
    ,["interval", "間期", "兩個事件之間的時間範圍"]
    ,["wave", "波", "記錄到的訊號起伏"]
    ,["valves", "瓣膜", "控制血液單向流動的門"]
    ,["valve", "瓣膜", "控制血液單向流動的門"]
    ,["loop", "環狀路徑", "依上下文可指腎元環或壓力容積迴圈"]
    ,["cell body", "細胞本體", "含細胞核並整合訊號的主要部分"]
    ,["cells", "細胞", "身體組織的基本功能單位"]
    ,["cell", "細胞", "身體組織的基本功能單位"]
    ,["component", "組成部分", "一個結構或系統中的其中一部分"]
    ,["Unit 10-11", "單元 10-11", "心血管系統課程單元"]
    ,["Unit 12", "單元 12", "泌尿系統課程單元"]
    ,["Unit 13", "單元 13", "中樞與周邊神經系統課程單元"]
    ,["Unit 14", "單元 14", "特殊感覺系統課程單元"]
    ,["unit", "功能單位", "能完成特定工作的基本組合"]
    ,["nerves", "神經", "由多條神經纖維組成的傳導束"]
    ,["nerve", "神經", "把訊號在中樞與周邊間傳遞"]
    ,["ventral horn", "脊髓腹角", "脊髓灰質前方，含運動神經元細胞本體"]
    ,["ganglion", "神經節", "位在中樞外的神經元細胞本體集合"]
    ,["brain", "腦", "中樞神經系統的主要整合器官"]
    ,["node", "結點", "路徑上的特定結構或傳導站"]
    ,["fiber", "纖維", "細長的傳導或收縮結構"]
    ,["delay", "延遲", "訊號傳遞刻意或異常變慢"]
    ,["aortic", "主動脈相關", "與主動脈或主動脈瓣有關"]
    ,["lung", "肺", "進行氣體交換的器官"]
    ,["left eye", "左眼", "左側視野測試來源"]
    ,["right eye", "右眼", "右側視野測試來源"]
    ,["white", "白色", "顏色視野中範圍最大"]
    ,["blue", "藍色", "顏色視野中次大"]
    ,["red", "紅色", "顏色視野中較小"]
    ,["green", "綠色", "顏色視野中最小"]
    ,["bright", "亮區", "側向抑制中的高亮刺激"]
    ,["dark", "暗區", "側向抑制中的低亮刺激"]
    ,["outer segment", "外段", "感光細胞進行光轉導的位置"]
    ,["Na+ open", "鈉通道開", "黑暗時暗電流進入"]
    ,["Na+ closed", "鈉通道關", "光照時 cGMP 下降後關閉"]
    ,["relay", "中繼站", "神經路徑中的訊號轉接點"]
    ,["ctx", "皮質", "大腦皮質處理區"]
    ,["assoc.", "聯合區", "整合記憶與其他感覺"]
    // ── 13/14/15 英文單元補充術語（English-primary 用）──
    // 自主神經 ANS
    ,["sympathetic", "交感神經", "胸腰(T1-L3)出來；緊急 fight-or-flight"]
    ,["parasympathetic", "副交感神經", "腦薦(III/VII/IX/X+S2-4)出來；休息消化"]
    ,["sympathetic trunk", "交感神經鏈", "脊椎兩側、靠脊髓的神經節鏈"]
    ,["preganglionic", "節前神經元", "ANS 輸出的第一顆神經元(胞體在 IML)"]
    ,["postganglionic", "節後神經元", "在神經節換元後的第二顆神經元"]
    ,["adrenal medulla", "腎上腺髓質", "受交感節前支配、釋放 EPI/NE 入血"]
    ,["chromaffin cell", "嗜鉻細胞", "腎上腺髓質細胞、像走內分泌的節後"]
    ,["nicotinic", "尼古丁受體", "離子通道、興奮；節前與體神經(NMJ)"]
    ,["muscarinic", "蕈毒鹼受體", "GPCR；副交感節後 ACh 作用"]
    ,["adrenergic", "腎上腺素性", "受體 α/β，由 NE/EPI 活化"]
    ,["cholinergic", "膽鹼性", "用 ACh 的神經(含交感汗腺的例外)"]
    ,["acetylcholine", "乙醯膽鹼", "節前/副交感節後/體神經的傳導物"]
    ,["acetylcholinesterase", "乙醯膽鹼酯酶", "分解 ACh 的酵素"]
    ,["norepinephrine", "正腎上腺素", "交感節後傳導物，作用 α/β"]
    ,["epinephrine", "腎上腺素", "腎上腺髓質主要產物(~80%)"]
    ,["thoracolumbar", "胸腰", "交感神經來源(T1-L3)"]
    ,["craniosacral", "腦薦", "副交感神經來源(腦神經+S2-4)"]
    ,["basal tone", "基礎張力", "交感/副交感平時持續放電"]
    ,["dual innervation", "雙重支配", "多數效應器同時受交感與副交感"]
    ,["mass discharge", "集體放電", "交感特有、緊急整體啟動"]
    ,["antagonistic", "拮抗", "交感與副交感作用相反"]
    ,["intermediolateral cell column", "中側角", "脊髓灰質、節前神經元胞體所在"]
    ,["subconscious", "潛意識", "意識不能直接控制(自主)"]
    ,["fight-or-flight", "戰或逃", "交感活化的緊急反應"]
    ,["effector", "效應器", "受神經支配作用的器官/組織"]
    ,["neurotransmitter", "神經傳導物", "突觸前合成、釋放作用於突觸後受體"]
    ,["dopamine", "多巴胺", "NE 合成的中間產物、單胺類"]
    ,["tyrosine", "酪胺酸", "兒茶酚胺(DA/NE/EPI)的前驅"]
    // 中樞周邊 CNS
    ,["synapse", "突觸", "神經元間傳遞訊號的接點"]
    ,["neuroglia", "膠質細胞", "支持/營養/保護，數量多於神經元"]
    ,["astrocyte", "星狀膠質細胞", "中樞；支持/供養/參與 BBB"]
    ,["oligodendrocyte", "寡突膠質細胞", "中樞製造髓鞘"]
    ,["Schwann cell", "許旺細胞", "周邊製造髓鞘"]
    ,["satellite cell", "衛星細胞", "周邊；對應中樞 astrocyte"]
    ,["microglia", "小膠質細胞", "中樞的清除/免疫細胞"]
    ,["ependymal cell", "室管膜細胞", "中樞、襯腦室"]
    ,["myelin sheath", "髓鞘", "包軸突的絕緣層、加速傳導"]
    ,["node of Ranvier", "蘭氏結", "髓鞘間隙、跳躍傳導處"]
    ,["gray matter", "灰質", "細胞本體所在"]
    ,["white matter", "白質", "有髓軸突所在(脂質偏白)"]
    ,["afferent", "傳入", "周邊→中樞(sensory/input)"]
    ,["efferent", "傳出", "中樞→周邊(motor/output)"]
    ,["somatic", "體神經", "意識可控/可感"]
    ,["autonomic", "自主神經", "意識不能直接控制"]
    ,["enteric", "腸神經", "腸道自備的神經系統"]
    ,["multipolar", "多極神經元", "多突起、中樞整合常見"]
    ,["pseudounipolar", "假單極神經元", "看似單極、功能像雙極(DRG)"]
    ,["interneuron", "中間神經元", "在中樞內整合"]
    ,["substantia nigra", "黑質", "多巴胺神經元、退化致 Parkinson"]
    ,["blood-brain barrier", "血腦屏障", "內皮+astrocyte，控制中樞通透"]
    ,["excitability", "可興奮性", "能產生動作電位"]
    ,["axon hillock", "軸丘", "動作電位起始點"]
    // 特殊感覺 SS
    ,["photoreceptor", "感光細胞", "rod/cone，產生 receptor potential"]
    ,["rod cell", "桿細胞", "黑白/暗視覺、周邊、多對一"]
    ,["cone cell", "錐細胞", "彩色/明視覺、中央凹、一對一"]
    ,["opsin", "視蛋白", "rhodopsin 的蛋白部分"]
    ,["transducin", "視傳導蛋白", "光活化的 G 蛋白"]
    ,["phosphodiesterase", "磷酸二酯酶", "把 cGMP 降解成 5'-GMP"]
    ,["fovea centralis", "中央凹", "視力最清楚、cone 集中"]
    ,["macula", "黃斑", "中央凹周圍、彩色視覺區"]
    ,["optic nerve", "視神經", "ganglion cell 軸突匯集"]
    ,["optic chiasm", "視交叉", "鼻側纖維交叉處"]
    ,["optic tract", "視束", "視交叉後到中樞"]
    ,["accommodation", "調節", "晶狀體變厚以看近物"]
    ,["presbyopia", "老花", "晶狀體變硬、近點變遠"]
    ,["phototransduction", "感光換能", "把光轉成電訊號"]
    ,["bipolar cell", "雙極細胞", "視網膜：感光→神經節的中繼"]
    ,["ganglion cell", "神經節細胞", "軸突匯成視神經送中樞"]
    ,["horizontal cell", "水平細胞", "視網膜橫向調控、側抑制"]
    ,["amacrine cell", "無軸突細胞", "雙極與神經節間的橫向調控"]
    ,["lateral inhibition", "側抑制", "強化對比 contrast"]
    ,["basilar membrane", "基底膜", "耳蝸中央階、行波發生處"]
    ,["organ of Corti", "柯蒂氏器", "基底膜上的聽覺感覺器官"]
    ,["hair cell", "毛細胞", "聽覺/平衡的感覺細胞(K⁺ 內流)"]
    ,["cochlea", "耳蝸", "蝸牛狀、聽覺換能"]
    ,["endolymph", "內淋巴", "中央階、高 K⁺"]
    ,["perilymph", "外淋巴", "前庭階+鼓室階、高 Na⁺"]
    ,["oval window", "卵圓窗", "三小聽骨傳入震動處"]
    ,["round window", "圓窗", "耳蝸液體震動的出口"]
    ,["semicircular canal", "半規管", "偵測角加速度/旋轉"]
    ,["utricle", "橢圓囊", "偵測線性加速度"]
    ,["saccule", "球囊", "偵測線性加速度"]
    ,["tectorial membrane", "蓋膜", "毛細胞纖毛上方、剪切運動"]
    ,["traveling wave", "行波", "用位置編頻率(高頻 base/低頻 apex)"]
    ,["scotopic", "暗光系統", "rod 系統、暗視覺"]
    ,["photopic", "明光系統", "cone 系統、彩色視覺"]
    ,["trichromatic", "三原色", "3 種 cone 活化比例判色"]
    ,["adequate stimulus", "適宜刺激", "對受器有效的刺激型態+強度"]
    ,["receptor potential", "受器電位", "換能的局部電位(非 AP)"]
    ,["visible light", "可見光", "約 370-740 nm"]
    ,["limbic system", "邊緣系統", "情緒/記憶；嗅覺可直連"]
    ,["olfaction", "嗅覺", "olfactory epithelium 換能"]
    ,["gustation", "味覺", "酸甜苦鹹鮮"]
    ,["umami", "鮮味", "對應 glutamate"]
    ,["equilibrium", "平衡覺", "視覺+前庭+本體"]
    // 泌尿補充
    ,["tubular reabsorption", "重吸收", "把腎小管內有用物質送回血液"]
    ,["filtration barrier", "濾過屏障", "腎絲球限制血球與蛋白進入濾液的三層結構"]
    ,["mesangial cell", "系膜細胞", "收縮可改變腎絲球有效過濾面積與 Kf"]
    ,["proteinuria", "蛋白尿", "尿中出現異常蛋白，常提示腎絲球屏障受損"]
    ,["afferent arteriole", "入球小動脈", "把血送入腎絲球"]
    ,["efferent arteriole", "出球小動脈", "把血帶離腎絲球並形成後續微血管床"]
    ,["renal cortex", "腎皮質", "腎臟外層，含多數腎絲球"]
    ,["renal medulla", "腎髓質", "腎臟內層，對建立濃縮梯度重要"]
    // 中樞補充
    ,["Purkinje cell", "浦肯野細胞", "小腦皮質大型神經元，具有高度分枝的樹突"]
    ,["pyramidal cell", "錐體細胞", "大腦皮質常見的多極神經元"]
    ,["retrograde transport", "逆向運輸", "由軸突末端往細胞本體運送"]
    ,["anterograde transport", "順向運輸", "由細胞本體往軸突末端運送"]
    // 內分泌補充
    ,["endocrine gland", "內分泌腺", "把荷爾蒙釋放進血液作用於遠端標的"]
    ,["hormone", "荷爾蒙", "由內分泌細胞釋放的化學訊號"]
    ,["target cell", "標的細胞", "具有相應受體並能回應荷爾蒙的細胞"]
    ,["peptide hormone", "胜肽荷爾蒙", "水溶性，通常作用於細胞膜受體"]
    ,["steroid hormone", "類固醇荷爾蒙", "脂溶性，通常作用於細胞內受體"]
    ,["intracellular receptor", "細胞內受體", "位於細胞質或細胞核的脂溶性荷爾蒙受體"]
    ,["cell-surface receptor", "細胞膜受體", "位於細胞膜並啟動第二訊使路徑"]
    ,["negative feedback", "負回饋", "終端產物回頭抑制上游分泌"]
    ,["positive feedback", "正回饋", "產物反過來加強上游反應"]
    ,["anterior pituitary", "腦下垂體前葉", "合成並分泌多種促腺激素"]
    ,["posterior pituitary", "腦下垂體後葉", "儲存並釋放下視丘製造的 ADH 與 oxytocin"]
    ,["pituitary gland", "腦下垂體", "連接下視丘與周邊內分泌腺的重要中樞"]
    ,["antidiuretic hormone", "抗利尿激素", "增加集尿管水通透性"]
    ,["ADH", "抗利尿激素", "增加集尿管水通透性並濃縮尿液"]
    ,["oxytocin", "催產素", "促進子宮收縮與射乳"]
    ,["insulin", "胰島素", "降低血糖並促進能量儲存"]
    ,["glucagon", "升糖素", "提高血糖並促進肝臟釋放能量"]
    ,["pancreatic beta cell", "胰島 β 細胞", "分泌胰島素"]
    // 生殖補充
    ,["gonad", "性腺", "製造配子與性類固醇的器官"]
    ,["gamete", "配子", "單套染色體的精子或卵"]
    ,["spermatogenesis", "精子生成", "由精原細胞形成成熟精子的過程"]
    ,["oogenesis", "卵子生成", "由卵原細胞形成成熟卵的過程"]
    ,["Sertoli cell", "塞爾托利細胞", "睪丸內支持精子生成的保母細胞"]
    ,["Leydig cell", "萊迪希細胞", "受 LH 刺激並製造 testosterone"]
    ,["theca cell", "莢膜細胞", "受 LH 刺激並製造 androgen"]
    ,["granulosa cell", "顆粒細胞", "受 FSH 刺激並以 aromatase 製造 estrogen"]
    ,["sex-determining region Y", "性別決定區 Y", "Y 染色體上啟動睪丸分化的 SRY 基因"]
    ,["SRY", "性別決定區 Y", "啟動未分化性腺朝睪丸發育"]
    ,["testis-determining factor", "睪丸決定因子", "SRY 所產生並推動睪丸分化的因子"]
    ,["TDF", "睪丸決定因子", "由 SRY 啟動的睪丸分化訊號"]
    ,["meiosis", "減數分裂", "把二套染色體降為一套以形成配子"]
    ,["spermatogonium", "精原細胞", "精子生成的二倍體起始細胞"]
    ,["primary oocyte", "初級卵母細胞", "停留在減數分裂 prophase I 的卵母細胞"]
    ,["secondary oocyte", "次級卵母細胞", "排卵時停留在 metaphase II 的細胞"]
    ,["polar body", "極體", "卵子不對稱分裂產生的小細胞"]
    ,["cholesterol", "膽固醇", "所有 steroid hormone 的共同原料"]
    ,["pregnenolone", "孕烯醇酮", "cholesterol 製造 steroid hormone 的早期中間物"]
    ,["progesterone", "黃體素", "支持子宮內膜與妊娠的 steroid hormone"]
    ,["androgen", "雄性素", "可轉為 testosterone 或 estrogen 的性類固醇"]
    ,["testosterone", "睪固酮", "主要男性性類固醇"]
    ,["estradiol", "雌二醇", "活性最強的主要 estrogen E2"]
    ,["estrogen", "雌激素", "女性生殖與性徵的重要 steroid hormone"]
    ,["dihydrotestosterone", "雙氫睪固酮", "由 testosterone 經 5α-reductase 轉成的強效 androgen"]
    ,["DHT", "雙氫睪固酮", "作用強於 testosterone 的 androgen"]
    ,["5α-reductase", "5α-還原酶", "把 testosterone 轉成 DHT"]
    ,["aromatase", "芳香酶", "把 androgen 轉成 estrogen"]
    ,["HPG axis", "下視丘-腦下垂體-性腺軸", "調控男女生殖內分泌的共同軸線"]
    ,["HPO axis", "下視丘-腦下垂體-卵巢軸", "調控卵巢週期與排卵"]
    ,["gonadotropin-releasing hormone", "促性腺激素釋放激素", "下視丘釋放並刺激 LH/FSH"]
    ,["GnRH", "促性腺激素釋放激素", "刺激 anterior pituitary 分泌 LH 與 FSH"]
    ,["luteinizing hormone", "黃體生成素", "刺激 Leydig/theca 並參與 ovulation"]
    ,["follicle-stimulating hormone", "濾泡刺激素", "刺激 Sertoli/granulosa"]
    ,["inhibin", "抑制素", "主要抑制 FSH 分泌"]
    ,["activin", "活化素", "促進 FSH 作用或分泌"]
    ,["ovulation", "排卵", "成熟 secondary oocyte 由卵巢釋放"]
  ];

  let inlineTermEntryCache = null;
  let inlineTermObserver = null;
  let inlineTermObserverQueued = false;
  const inlineTermPendingRoots = new Set();
  const inlineTermObserverOptions = { childList: true, subtree: true, characterData: true };
  // 同一頁只把每個術語做成「可點字卡」一次，其餘出現顯示純中文（不可點、不含英文 → 不會被 observer 再處理），大幅減少視覺雜訊。
  const inlineTermSeen = new Set();

  function annotateTerms(text) {
    const source = normalizeTermText(String(text ?? ""));
    if (!source) return "";
    const mathPattern = /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\$[^$]*\$)/g;
    let output = "";
    let lastIndex = 0;
    let match;
    while ((match = mathPattern.exec(source))) {
      output += annotateTermSegment(source.slice(lastIndex, match.index));
      output += escapeHtml(match[0]);
      lastIndex = match.index + match[0].length;
    }
    output += annotateTermSegment(source.slice(lastIndex));
    return output;
  }

  function normalizeTermText(text) {
    return text
      .replace(/\b([A-Za-z][A-Za-z0-9+.-]{1,})\s+\1\b/gi, "$1")
      .replace(/\btubular reabsorption\s+reabsorption\b/gi, "tubular reabsorption")
      .replace(/\brenal cortex\s+cortex\b/gi, "renal cortex")
      .replace(/\brenal medulla\s+medulla\b/gi, "renal medulla")
      .replace(/\bganglion\s+ganglion cell\b/gi, "ganglion cell")
      .replace(/\bQRS(?:\s+complex)?\s+波群\b/gi, "QRS complex")
      .replace(/\bHis-Purkinje\b(?!\s+system)/gi, "His-Purkinje system")
      .replace(/\bHis\b(?![-\s]?Purkinje| bundle)/g, "His bundle");
  }

  function annotateTermSegment(segment) {
    if (!segment) return "";
    const entries = inlineTermEntries();
    let output = "";
    let index = 0;
    while (index < segment.length) {
      const match = findInlineTermMatch(segment, index, entries);
      if (match) {
        const { entry, raw, length } = match;
        if (forceChineseTermKeys.has(entry.key)) {
          output += escapeHtml(entry.zh);
          index += length;
          continue;
        }
        const alreadyNamed = segment.slice(0, index).trimEnd().endsWith(entry.zh);
        if (usesChinesePrimaryTerms() && inlineTermSeen.has(entry.key)) {
          // 重複出現：顯示純中文、不做成字卡（且不含英文，避免被 observer 再次處理）
          output += escapeHtml(entry.zh);
        } else {
          inlineTermSeen.add(entry.key);
          output += renderInlineTerm(entry.en, entry.zh, entry.note, alreadyNamed);
        }
        index += length;
        continue;
      }
      output += escapeHtml(segment[index]);
      index += 1;
    }
    return output;
  }

  const reverseTermBlacklist = new Set([
    "壓力", "容積", "細胞", "神經", "腦", "肺", "白色", "藍色", "紅色", "綠色",
    "亮區", "暗區", "組成部分", "功能單位", "結點", "纖維", "延遲", "控制", "處理",
    "輸入", "輸出", "溝通", "整合", "感覺", "運動"
  ]);
  const forceChineseTermKeys = new Set([
    "autonomic", "secretion", "control", "process", "integrate", "integration", "communication"
  ]);

  function canReverseTerm(entry) {
    return entry.zh.length >= 2 && !reverseTermBlacklist.has(entry.zh);
  }

  function consumePairedTranslation(segment, index, entry, matchedLength, matchedEnglish, entries) {
    const rest = segment.slice(index + matchedLength);
    const pairs = matchedEnglish
      ? [entry.en, entry.zh]
      : entries.filter((candidate) => candidate.zh === entry.zh).map((candidate) => candidate.en);
    const pairMatches = pairs
      .map((pair) => rest.match(new RegExp(
        `^(?:\\s*${escapeRegExp(pair)}|\\s*[：:=＝/、·-]\\s*${escapeRegExp(pair)}|\\s*[（(]\\s*${escapeRegExp(pair)}\\s*[）)])`,
        matchedEnglish ? "i" : ""
      )))
      .filter(Boolean)
      .sort((a, b) => b[0].length - a[0].length);
    return pairMatches.length ? matchedLength + pairMatches[0][0].length : matchedLength;
  }

  function findInlineTermMatch(segment, index, entries) {
    const matches = [];
    entries.forEach((entry) => {
      const englishRaw = segment.slice(index, index + entry.en.length);
      if (
        englishRaw.toLowerCase() === entry.key &&
        isTermBoundary(segment[index - 1]) &&
        isTermBoundary(segment[index + entry.en.length])
      ) {
        matches.push({
          entry,
          raw: englishRaw,
          length: consumePairedTranslation(segment, index, entry, entry.en.length, true, entries),
          score: entry.en.length + 20
        });
      }
      if (!usesChinesePrimaryTerms() && canReverseTerm(entry) && segment.startsWith(entry.zh, index)) {
        matches.push({
          entry,
          raw: entry.zh,
          length: consumePairedTranslation(segment, index, entry, entry.zh.length, false, entries),
          score: entry.zh.length + (isCompactExamTerm(entry.en) ? 0 : 10)
        });
      }
    });
    matches.sort((a, b) => b.length - a.length || b.score - a.score || b.entry.en.length - a.entry.en.length);
    return matches[0] || null;
  }

  function inlineTermEntries() {
    if (!inlineTermEntryCache) {
      const used = new Set();
      inlineTermEntryCache = termExplanations
        .map(([en, zh, note]) => ({ en: String(en), zh, note, key: String(en).toLowerCase() }))
        .filter((entry) => {
          if (entry.en.trim().length < 2 || used.has(entry.key)) return false;
          used.add(entry.key);
          return /[A-Za-z]/.test(entry.en);
        })
        .sort((a, b) => b.en.length - a.en.length);
    }
    return inlineTermEntryCache;
  }

  function isTermBoundary(ch) {
    return !/[A-Za-z0-9+]/.test(ch || "");
  }

  function escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // 全站術語以英文顯示，點開看中文；一般敘述仍維持中文。
  function usesChinesePrimaryTerms() {
    return false;
  }

  function isCompactExamTerm(term) {
    const mixedTerms = new Set(["NaCl", "cGMP", "Ca2+", "Na+", "K+", "H+", "O2", "CO2", "Cx", "Ux", "Px", "Tx", "aVR", "aVL", "aVF"]);
    return mixedTerms.has(term) || /^[A-Z0-9/+.-]{2,8}$/.test(term);
  }

  function renderInlineTerm(en, zh, note, alreadyNamed = false) {
    if (!usesChinesePrimaryTerms()) {
      return `<span class="term-inline-wrap"><span class="term-inline" role="button" tabindex="0" aria-expanded="false">${escapeHtml(en)}</span><span class="term-inline-detail" hidden><b>${escapeHtml(zh)}</b><small>${escapeHtml(note)}</small></span></span>`;
    }
    const label = alreadyNamed
      ? `（${en}）`
      : isCompactExamTerm(en) ? `${zh}（${en}）` : zh;
    return `<span class="term-inline-wrap"><span class="term-inline term-inline-chinese" role="button" tabindex="0" aria-expanded="false" aria-label="${escapeHtml(label)}，點開看英文與補充">${escapeHtml(label)}</span><span class="term-inline-detail" hidden><b>英文：${escapeHtml(en)}</b><small>這個詞在這裡：${escapeHtml(note)}</small></span></span>`;
  }

  function chinesePrimaryPlainText(text) {
    const source = String(text ?? "");
    if (!source || !usesChinesePrimaryTerms()) return source;
    const entries = inlineTermEntries();
    let output = "";
    let index = 0;
    while (index < source.length) {
      const entry = entries.find((candidate) => {
        const raw = source.slice(index, index + candidate.en.length);
        return raw.toLowerCase() === candidate.key
          && isTermBoundary(source[index - 1])
          && isTermBoundary(source[index + candidate.en.length]);
      });
      if (!entry) {
        output += source[index];
        index += 1;
        continue;
      }
      const raw = source.slice(index, index + entry.en.length);
      const alreadyNamed = source.slice(0, index).trimEnd().endsWith(entry.zh);
      output += alreadyNamed ? `（${raw}）` : isCompactExamTerm(raw) ? `${entry.zh}（${raw}）` : entry.zh;
      index += entry.en.length;
    }
    return output;
  }

  let activeInlineTerm = null;
  let activeInlineDetail = null;
  let activeInlineHome = null;

  function bindInlineTerms() {
    if (document.body.dataset.inlineTermsBound) return;
    document.body.dataset.inlineTermsBound = "true";
    document.body.addEventListener("click", (event) => {
      const wrap = event.target.closest(".term-inline-wrap");
      if (wrap?.closest("[data-choice]")) event.stopPropagation();
      const term = event.target.closest(".term-inline");
      if (!term) {
        closeInlineTerms();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      toggleInlineTerm(term);
    }, true);
    document.body.addEventListener("keydown", (event) => {
      if (!["Enter", " "].includes(event.key)) return;
      const term = event.target.closest(".term-inline");
      if (!term) return;
      event.preventDefault();
      event.stopPropagation();
      toggleInlineTerm(term);
    }, true);
    window.addEventListener("resize", closeInlineTerms, { passive: true });
    window.addEventListener("scroll", closeInlineTerms, { passive: true, capture: true });
  }

  function closeInlineTerms() {
    if (!activeInlineTerm || !activeInlineDetail) return;
    activeInlineTerm.setAttribute("aria-expanded", "false");
    activeInlineDetail.hidden = true;
    activeInlineDetail.style.removeProperty("left");
    activeInlineDetail.style.removeProperty("top");
    activeInlineHome?.classList.remove("open");
    if (activeInlineHome?.isConnected) activeInlineHome.appendChild(activeInlineDetail);
    activeInlineTerm = null;
    activeInlineDetail = null;
    activeInlineHome = null;
  }

  function positionInlineTerm(term, detail) {
    const anchor = term.getBoundingClientRect();
    const popup = detail.getBoundingClientRect();
    const gap = 7;
    const edge = 12;
    let left = anchor.left;
    let top = anchor.bottom + gap;
    if (left + popup.width > window.innerWidth - edge) left = window.innerWidth - popup.width - edge;
    if (left < edge) left = edge;
    if (top + popup.height > window.innerHeight - edge && anchor.top - popup.height - gap >= edge) {
      top = anchor.top - popup.height - gap;
    }
    detail.style.left = `${Math.round(left)}px`;
    detail.style.top = `${Math.round(Math.max(edge, top))}px`;
  }

  function toggleInlineTerm(term) {
    const wrap = term.closest(".term-inline-wrap");
    const isOpen = term === activeInlineTerm;
    if (isOpen) {
      closeInlineTerms();
      return;
    }
    closeInlineTerms();
    const detail = wrap?.querySelector(".term-inline-detail");
    if (!wrap || !detail) return;
    activeInlineTerm = term;
    activeInlineDetail = detail;
    activeInlineHome = wrap;
    term.setAttribute("aria-expanded", "true");
    wrap.classList.add("open");
    document.body.appendChild(detail);
    detail.hidden = false;
    window.requestAnimationFrame(() => {
      if (term === activeInlineTerm) positionInlineTerm(term, detail);
    });
  }

  function annotateInlineTermsIn(root = document.body) {
    if (!root || root.nodeType !== Node.ELEMENT_NODE) return;
    if (usesChinesePrimaryTerms()) {
      root.querySelectorAll("option:not([data-chinese-primary])").forEach((option) => {
        option.textContent = chinesePrimaryPlainText(option.textContent);
        option.dataset.chinesePrimary = "true";
      });
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        if (parent.closest(".term-inline-wrap, .term-inline-detail, .term-assistant, mjx-container, .MathJax, svg, script, style, textarea, input, option")) return NodeFilter.FILTER_REJECT;
        const lower = node.nodeValue.toLowerCase();
        if (!inlineTermEntries().some((entry) =>
          lower.includes(entry.key) || (!usesChinesePrimaryTerms() && canReverseTerm(entry) && node.nodeValue.includes(entry.zh))
        )) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const html = annotateTerms(node.nodeValue);
      if (html === escapeHtml(node.nodeValue)) return;
      const span = document.createElement("span");
      span.innerHTML = html;
      node.replaceWith(...span.childNodes);
    });
  }

  function startInlineTermObserver() {
    if (inlineTermObserver) return;
    inlineTermObserver = new MutationObserver((records) => {
      records.forEach((record) => {
        if (record.type === "characterData") {
          if (record.target.parentElement) inlineTermPendingRoots.add(record.target.parentElement);
          return;
        }
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) inlineTermPendingRoots.add(node);
          else if (node.nodeType === Node.TEXT_NODE && node.parentElement) inlineTermPendingRoots.add(node.parentElement);
        });
      });
      if (inlineTermObserverQueued) return;
      inlineTermObserverQueued = true;
      window.requestAnimationFrame(() => {
        inlineTermObserverQueued = false;
        const roots = [...inlineTermPendingRoots].filter((root) =>
          root.isConnected &&
          !root.closest(".term-inline-wrap, .term-inline-detail, .term-assistant, mjx-container, .MathJax, svg, script, style, textarea, input, option")
        );
        inlineTermPendingRoots.clear();
        const topLevelRoots = roots.filter((root, index) =>
          !roots.some((other, otherIndex) => otherIndex !== index && other.contains(root))
        );
        inlineTermObserver.disconnect();
        topLevelRoots.forEach((root) => annotateInlineTermsIn(root));
        inlineTermObserver.observe(document.body, inlineTermObserverOptions);
      });
    });
    inlineTermObserver.observe(document.body, inlineTermObserverOptions);
  }

  function renderTermNotes(text, limit = 5) {
    const terms = collectTermNotes(text, limit);
    if (!terms.length) return "";
    return `
      <div class="term-notes" aria-label="英文術語補充">
        ${terms.map((term) => `
          <span class="term-note">
            <b>${escapeHtml(term.zh)}</b>
            <em>${escapeHtml(term.en)}</em>
            <small>${escapeHtml(term.note)}</small>
          </span>
        `).join("")}
      </div>
    `;
  }

  function collectTermNotes(text, limit = 5) {
    const source = String(text ?? "");
    if (!source || /\\\(|\\\[|\$/.test(source) || /^[.#]/.test(source) || /\.\w{2,5}($|[?#])/.test(source)) return [];
    const isWord = (ch) => /[A-Za-z0-9+-]/.test(ch || "");
    const found = [];
    const used = new Set();
    termExplanations
      .slice()
      .sort((a, b) => b[0].length - a[0].length)
      .some(([en, zh, note]) => {
        const key = en.toLowerCase();
        if (used.has(key)) return false;
        const pattern = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+"), "i");
        const match = pattern.exec(source);
        if (!match) return false;
        const before = source[match.index - 1];
        const after = source[match.index + match[0].length];
        if (before === "（" || before === "(" || isWord(before) || isWord(after)) return false;
        used.add(key);
        found.push({ en: match[0], zh, note });
        return found.length >= limit;
      });
    return found;
  }

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function format(value) {
    return String(Math.round(value * 100) / 100);
  }

  function typesetMath() {
    if (window.MathJax?.typesetPromise) window.MathJax.typesetPromise();
  }

  renderShell();
  renderProgressBadges();
  renderDashboard();
  renderUnit();
  renderTermAssistant();
  bindInlineTerms();
  annotateInlineTermsIn(document.body);
  startInlineTermObserver();
})();
