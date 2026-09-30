(function(){
  const data=window.PHYSIO_CONTENT;
  const high=window.PHYSIO_HIGH_YIELD;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const names={all:"全部",cardiovascular:"心血管",urinary:"泌尿",cns:"CNS / PNS","special-senses":"特殊感覺",ans:"ANS",endocrine:"內分泌",reproduction:"生殖"};
  const glossary={
    "ECG":"Electrocardiogram，心電圖。從體表記錄心臟整體電活動，不是心臟收縮力量。",
    "lead":"導程。像從某個方向拍心臟電活動的攝影機。",
    "RA":"Right atrium，右心房；收全身回來的缺氧血。","RV":"Right ventricle，右心室；把血送去肺。",
    "LA":"Left atrium，左心房；收肺回來的含氧血。","LV":"Left ventricle，左心室；把血送去全身。",
    "AV node":"Atrioventricular node，房室結；故意讓訊號慢一下，讓心房先把血倒進心室。",
    "SA node":"Sinoatrial node，竇房結；心臟天然的 pacemaker。",
    "pacemaker":"節律器；能自己規律發出電訊號的細胞或裝置。",
    "depolarization":"去極化；細胞膜電位變得比較不負，通常代表準備啟動訊號。",
    "repolarization":"再極化；細胞膜電位回到休息狀態。",
    "preload":"前負荷；心室收縮前裝進多少血。","afterload":"後負荷；心室把血推出去時面對的阻力。",
    "contractility":"收縮力；在相同裝血量下，心肌本身能擠多用力。",
    "EDV":"End-diastolic volume，舒張末期容積；心室裝最滿時的血量。",
    "ESV":"End-systolic volume，收縮末期容積；射血後剩下的血量。",
    "SV":"Stroke volume，每搏量；一次心跳射出的血量，SV = EDV − ESV。",
    "CO":"Cardiac output，心輸出量；每分鐘打出的血量，CO = HR × SV。",
    "GFR":"Glomerular filtration rate，腎絲球過濾率；每分鐘產生多少濾液。",
    "RPF":"Renal plasma flow，腎血漿流量；每分鐘送到腎臟的血漿量。",
    "clearance":"清除率；想像每分鐘有多少 mL 血漿被完全清掉某物質。",
    "nephron":"腎元；腎臟做過濾、回收、分泌的基本工作單位。",
    "JGA":"Juxtaglomerular apparatus，腎絲球旁器；偵測壓力與 NaCl，控制 renin。",
    "RAAS":"Renin–angiotensin–aldosterone system；低血壓時啟動的保水、保鈉、升壓系統。",
    "renin":"腎素；RAAS 的第一個開關，由 JG cells 釋放。",
    "Ang II":"Angiotensin II；讓血管收縮、促進 aldosterone，幫忙升血壓。",
    "aldosterone":"醛固酮；叫腎臟留 Na⁺、水，並排 K⁺。",
    "CNS":"Central nervous system，中樞神經系統；brain + spinal cord。",
    "PNS":"Peripheral nervous system，周邊神經系統；中樞以外的神經部分。",
    "afferent":"傳入；把感覺資訊送到 CNS。記 A = Arrives。",
    "efferent":"傳出；把命令從 CNS 送出去。記 E = Exits。",
    "neuron":"神經元；負責接收、處理與傳遞訊號的細胞。",
    "glia":"膠質細胞；負責支援、保護、髓鞘、免疫與環境維持。",
    "myelin":"髓鞘；包住 axon 的絕緣層，讓訊號跳著跑、跑更快。",
    "action potential":"動作電位；細胞沿膜傳遞的一次全有全無電訊號。",
    "BBB":"Blood–brain barrier，血腦障壁；保護 CNS、限制許多物質進入。",
    "rod":"桿狀細胞；擅長暗處、靈敏但不看顏色與細節。",
    "cone":"錐狀細胞；擅長亮處、顏色與高解析度。",
    "rhodopsin":"視紫質；rod 裡的感光色素。",
    "phototransduction":"感光換能；把光變成神經電訊號。",
    "hyperpolarization":"超極化；膜電位變得更負。photoreceptor 見光時會這樣。",
    "cochlea":"耳蝸；內耳負責把聲音振動轉成神經訊號的構造。",
    "basilar membrane":"基底膜；耳蝸內的頻率地圖，高頻靠 base、低頻靠 apex。",
    "hair cell":"毛細胞；內耳的機械感受器，纖毛彎曲就改變 transmitter 釋放。",
    "endolymph":"內淋巴；內耳特殊液體，K⁺ 很高。",
    "ANS":"Autonomic nervous system，自主神經系統；自動控制內臟、腺體與平滑肌。",
    "ACh":"Acetylcholine，乙醯膽鹼；所有 ANS 節前神經都使用。",
    "NE":"Norepinephrine，正腎上腺素；多數 sympathetic 節後神經使用。",
    "sympathetic":"交感神經；偏向緊急、動員能量的 fight-or-flight。",
    "parasympathetic":"副交感神經；偏向休息、消化的 rest-and-digest。",
    "nicotinic receptor":"菸鹼型受體；ACh 受體中的 ion channel，ganglia 常見 Nn。",
    "muscarinic receptor":"毒蕈鹼型受體；ACh 受體中的 GPCR，副交感效應器常見。",
    "GPCR":"G protein-coupled receptor，G 蛋白偶聯受體；把膜外訊號傳進細胞。",
    "peptide hormone":"胜肽荷爾蒙；水溶、用膜受體、可先儲存在 vesicle。",
    "steroid hormone":"類固醇荷爾蒙；脂溶、由 cholesterol 製造、使用細胞內受體。",
    "intracrine":"胞內分泌；訊號留在製造它的細胞內作用，沒有被分泌出去。",
    "autocrine":"自分泌；細胞放出訊號後，回頭作用在自己身上。",
    "paracrine":"旁分泌；訊號只走到附近鄰居，不靠血液跑遍全身。",
    "endocrine":"內分泌；荷爾蒙進入血液，前往遠方帶有正確 receptor 的 target cell。",
    "neuroendocrine":"神經內分泌；neuron 把訊號分泌進血液，例如 ADH、oxytocin。",
    "target cell":"標的細胞；具有對應 receptor、能讀懂某種荷爾蒙的細胞。",
    "RTK":"Receptor tyrosine kinase，受體酪胺酸激酶；insulin receptor 使用的膜受體。",
    "JAK-STAT":"由 receptor 旁的 JAK 啟動 STAT，STAT 再進細胞核調整 gene expression。",
    "second messenger":"第二傳訊者；細胞內接棒傳訊的分子，如 cAMP、IP₃、Ca²⁺。",
    "ADH":"Antidiuretic hormone，抗利尿激素；V2 使 collecting duct 插入 AQP2、幫身體留水。",
    "AQP2":"Aquaporin-2；ADH 叫 collecting duct 放到膜上的水通道。",
    "oxytocin":"催產素；促進子宮收縮，也讓乳腺肌上皮收縮、射出乳汁。",
    "prolactin":"泌乳激素；負責製造乳汁。射乳則主要靠 oxytocin。",
    "GH":"Growth hormone，生長激素；促進 IGF-1、生長，也直接影響代謝。",
    "IGF-1":"Insulin-like growth factor 1；主要由肝臟在 GH 刺激下製造，幫助身體生長。",
    "NIS":"Sodium–iodide symporter；甲狀腺濾泡細胞從血液攝取 iodide 的運輸器。",
    "TPO":"Thyroid peroxidase；負責 iodide oxidation、organification 與 coupling 的關鍵酵素。",
    "MIT":"Monoiodotyrosine；一個碘的 tyrosine，MIT + DIT 可形成 T3。",
    "DIT":"Diiodotyrosine；兩個碘的 tyrosine，DIT + DIT 可形成 T4。",
    "calcitonin":"降鈣素；由 thyroid C cells 分泌，方向上幫助降低血鈣。",
    "osteoblast":"造骨細胞；負責形成骨，也用 RANKL 間接叫 osteoclast 工作。",
    "osteoclast":"蝕骨細胞；負責分解骨、把 Ca²⁺ 釋放到血液。",
    "RANKL":"osteoblast 表面的訊號；促進 osteoclast precursor 成熟並增加骨吸收。",
    "C-peptide":"proinsulin 被切割時和 insulin 一起產生；可用來判斷內源性 insulin 分泌。",
    "insulin resistance":"胰島素阻抗；細胞對 insulin 反應變差，早期 β cell 會代償分泌更多。",
    "PTH":"Parathyroid hormone，副甲狀腺素；低血鈣時升高血鈣。",
    "T3":"Triiodothyronine，三碘甲狀腺素；活性較強的 thyroid hormone。",
    "T4":"Thyroxine，四碘甲狀腺素；甲狀腺主要分泌形式，可在周邊轉成 T3。",
    "insulin":"胰島素；由 pancreatic β cells 分泌，幫助降低血糖與儲存能量。",
    "glucagon":"升糖素；由 pancreatic α cells 分泌，幫助升高血糖。",
    "GnRH":"Gonadotropin-releasing hormone；下視丘叫 pituitary 釋放 LH/FSH 的口令。",
    "LH":"Luteinizing hormone；男性刺激 Leydig，女性觸發 ovulation 並支持 corpus luteum。",
    "FSH":"Follicle-stimulating hormone；男性支持 spermatogenesis，女性促 follicle 與 estrogen。",
    "HPG axis":"Hypothalamic–pituitary–gonadal axis；下視丘→腦下垂體→性腺的控制軸。",
    "gamete":"配子；男性是 sperm、女性是 oocyte，各帶一半染色體。",
    "meiosis":"減數分裂；把染色體數目減半，並透過重組增加遺傳變化。",
    "spermatogenesis":"精子生成；由 spermatogonia 經 meiosis 與成熟形成 sperm。",
    "oogenesis":"卵子生成；出生前已開始，包含 prophase I 與 metaphase II 兩次停頓。",
    "primary oocyte":"初級卵母細胞；停在 prophase I，直到排卵前才完成 meiosis I。",
    "secondary oocyte":"次級卵母細胞；排卵時停在 metaphase II，受精後才完成 meiosis II。",
    "17β-HSD":"17β-hydroxysteroid dehydrogenase；參與 testosterone 與 estradiol 的生成轉換。",
    "5α-reductase":"把 testosterone 轉成作用更強的 DHT，主要在周邊 target tissue。",
    "DHT":"Dihydrotestosterone；由 testosterone 經 5α-reductase 形成，對外生殖器與前列腺很重要。",
    "inhibin":"主要由 Sertoli／granulosa cells 分泌，選擇性負回饋抑制 FSH。",
    "activin":"促進 FSH 合成與分泌，方向大致與 inhibin 相反。",
    "SRY":"Y chromosome 上的 sex-determining region；啟動未分化性腺往 testis 發展。",
    "AMH":"Anti-Müllerian hormone；由 fetal Sertoli cells 分泌，使 Müllerian duct 退化。",
    "seminiferous tubule":"曲細精管；testis 內進行 spermatogenesis 的場所。",
    "blood-testis barrier":"血睪屏障；由 Sertoli cell tight junction 形成，保護發育中的 germ cells。",
    "ABP":"Androgen-binding protein；由 Sertoli cell 分泌，維持 seminiferous tubule 內高 testosterone。",
    "theca cell":"卵泡膜細胞；受 LH 刺激製造 androgen。",
    "granulosa cell":"顆粒細胞；受 FSH 刺激，用 aromatase 把 androgen 轉成 estrogen。",
    "aromatase":"芳香化酶；把 androgen 轉成 estrogen。",
    "follicular phase":"濾泡期；從月經開始到 ovulation，主要由 follicle 與 estrogen 主導。",
    "luteal phase":"黃體期；ovulation 後到下次月經，主要由 corpus luteum 與 progesterone 主導。",
    "LH surge":"LH 急升；高 estradiol 正回饋造成，會觸發 ovulation。",
    "Sertoli cell":"支持細胞；照顧精子生成，分泌 ABP 與 inhibin。",
    "Leydig cell":"間質細胞；受 LH 刺激製造 testosterone。",
    "ovulation":"排卵；成熟卵泡釋出 secondary oocyte，通常在下次月經前約 14 天。",
    "hCG":"Human chorionic gonadotropin；早期胚胎訊號，維持 corpus luteum。",
    "corpus luteum":"黃體；排卵後卵泡變成的暫時內分泌構造，主要分泌 progesterone。",
    "progesterone":"黃體素；穩定 endometrium、支持妊娠，並使基礎體溫稍微升高。",
    "implantation":"著床；blastocyst 黏附並進入 endometrium，之後開始建立 placenta。",
    "placenta":"胎盤；負責母胎物質交換，也分泌 hCG、progesterone、estrogen 等荷爾蒙。",
    "Barr body":"失活並濃縮的 X chromosome；數量通常是 X 染色體數減 1。"
  };
  const babySprint={
    cardiovascular:[
      ["心電圖在看電往哪跑","把心臟想成一群人搬正電。電往鏡頭的正端跑，線就往上；背對它跑，線就往下。","朝正端＝上；離正端＝下。"],
      ["為什麼休息波還是向上","心室恢復休息時，移動方向和電性一起反過來；反兩次就等於沒反，所以通常仍畫向上。","兩個相反互相取消。"],
      ["兩個尖峰隔多久","找相鄰兩個最高尖峰，它們的距離就是一次心跳花的時間；越近代表跳越快。","尖峰擠得近＝心跳快。"],
      ["心房要先倒完血","訊號到心房和心室中間時會故意等一下，讓上面的心房先把血倒進下面的心室。","先裝滿，再開打。"],
      ["中間轉運站故意很慢","房室之間的轉運站路窄、出口少，所以電跑得慢；這不是故障，是讓心室有時間裝血。","慢，是為了裝血。"],
      ["平線翹起或沉下要小心","心室整片都在忙時，圖本來應接近平線；突然抬高或壓低，常表示心肌正在缺血或受傷。","該平不平＝警報。"],
      ["六個方向看同一顆心","手腳上的電極像六台相機，從不同方向看同一股心臟電流。","相機方向不同，波形就不同。"],
      ["肌肉放鬆不等於舒張開始","心室正在把最後一點血推出去時，肌肉可能已開始鬆，但出口門還沒關，所以仍算收縮期。","看門，不看肌肉表情。"]
    ],
    urinary:[
      ["腎臟門口的三人警報隊","腎臟入口旁有三種細胞一起看鹽夠不夠、血壓夠不夠；不夠就按下升壓警鈴。","低鹽或低壓 → 按警鈴。"],
      ["血壓太低就啟動保水鏈","腎臟覺得血不夠，會啟動一串接力：先縮血管，再叫身體留下鹽和水，把血壓救回來。","縮管＋留鹽水＝升壓。"],
      ["尿裡最後有多少","某物進入腎小管後，可以被拿回身體，也可以再被丟進尿裡；最後排出量就是進來減拿回、再加丟入。","排出＝進來－拿回＋再丟。"],
      ["短吸管和長吸管","多數腎元的管子較短；少數管子伸得很深，專門建立濃度階梯，幫你在缺水時做出濃尿。","長管子＝比較會省水。"],
      ["血管捏細，壓力就上去","水管半徑只縮一點，阻力就會暴增；心臟更難推血，血壓也容易升高。","管子細一點，阻力大很多。"]
    ],
    cns:[
      ["先認英文路標","這單元的題目常直接放英文，所以要做到看到字就能知道它是中樞、周邊、傳入還是傳出。","英文不是裝飾，是題目本體。"],
      ["有一截跑出腦和脊髓就算周邊","一條神經只要有部分離開 brain 或 spinal cord，那段就屬於身體外圍的神經系統。","全程待在中樞才叫中樞。"],
      ["感覺進來，命令出去","感覺訊息往 brain/spinal cord 送；運動命令則從那裡送往肌肉或器官。","A＝到達；E＝離開。"],
      ["運動神經的家在裡面，手伸到外面","控制骨骼肌的神經元，細胞本體住在 spinal cord，但長長的軸突會伸出去找肌肉。","身體在中樞，長手在周邊。"],
      ["一個隊長帶幾個兵","一顆運動神經帶的肌纖維越少，動作越精細；一次帶很多，力量較大但控制較粗。","小隊精細，大隊有力。"],
      ["神經元工作，膠質細胞養家","神經元負責傳訊；旁邊的膠質細胞負責餵養、清潔、包絕緣層與維持環境。","一個送訊息，一群做後勤。"]
    ],
    "special-senses":[
      ["光照下去，感光細胞反而安靜","暗處時感光細胞一直放訊號；光一來會把入口關起來，細胞變得更安靜，訊號反而減少。","光來＝關門＝更安靜。"],
      ["夜班眼睛和白天眼睛","一種細胞很會在暗處抓微光，但看不清顏色；另一種要亮一點，卻能看顏色與細節。","暗處求有，亮處求精。"],
      ["每個感受器都有最愛","感受器不是只能被一種刺激叫醒，而是對某種刺激最省力、最敏感。","最容易叫醒它的，就是它的最愛。"],
      ["鼻側的線會換邊","兩眼送出的視覺線路中，靠鼻子那半邊會在中間交叉，靠太陽穴那半邊不交叉。","鼻子過橋，太陽穴直走。"],
      ["看缺哪一塊，找哪裡斷線","單眼全黑多半是眼睛剛出去的線壞；兩側外邊看不到常是中間交叉處壞；同一側視野缺則是更後面壞。","缺損形狀就是斷線地址。"],
      ["盲點是沒有感光工人的出口","視神經離開眼球的地方沒有感光細胞，所以那一小塊真的看不到；平常由另一眼和腦補起來。","電線出口沒裝鏡頭。"],
      ["小鼓面把力集中到小窗戶","耳膜面積大，內耳入口小，再加上三塊小骨頭幫忙，把空氣的小震動集中成較大的壓力。","大面收力，小面出力。"],
      ["高音停得早，低音跑得遠","耳蝸裡的膜像一條長地毯：高頻在入口附近震最大，低頻要跑到深處才震最大。","高音靠門，低音進裡面。"],
      ["毛往高處倒，細胞就開門","內耳小毛被推向最高那根時，拉繩把通道打開，特殊液體裡的鉀跑進細胞，開始放訊號。","往高毛倒＝開門。"],
      ["分清是傳不進去，還是接收器壞了","外耳或中耳卡住，是聲音傳送問題；內耳或神經壞掉，是接收與傳訊問題。","前段塞車 vs 後段機器壞。"],
      ["轉圈和直線由不同感測器管","三個半圓管負責感覺旋轉；另外兩個小袋子負責直線加速和頭部傾斜。","轉彎看管子，直線看袋子。"],
      ["味道和氣味都是化學偵探","舌頭認基本味道，鼻子補出食物的完整風味；鼻子的線路也很靠近情緒與記憶區。","舌頭給骨架，鼻子加靈魂。"]
    ],
    ans:[
      ["內臟的自動駕駛","這套系統不必一直用意識指揮，會自動調心跳、腸胃、腺體；多數器官還有油門和煞車一起管。","自動控制，兩邊拉平衡。"],
      ["緊急線短前長後，休息線長前短後","緊急系統的轉運站靠近 spinal cord；休息系統的轉運站靠近器官，所以前後兩段長短剛好相反。","站靠哪邊，哪一邊的線就短。"],
      ["第一棒都用同一種傳話筒","不管緊急或休息系統，從 CNS 出發的第一顆神經都用同一種傳遞物；第二棒才開始分家。","第一棒相同，第二棒不同。"],
      ["汗腺是穿錯制服的例外","汗腺明明屬於緊急系統，但最後一棒不用平常的緊急傳遞物，反而使用休息系統常見的那一種。","交感的身分，副交感的武器。"],
      ["腎上腺是把訊號倒進血裡的大喇叭","一般神經只對附近器官說話；腎上腺會把緊急訊號灑進血液，讓全身一起進入備戰。","局部電話變全身廣播。"],
      ["分類看工作，不要只看細胞住哪","這套系統算周邊運動輸出，但第一顆神經的細胞本體仍住在 brain 或 spinal cord。","系統分類和住址是兩件事。"],
      ["同一把鑰匙可以開快門或慢機器","一種受體是直接開離子門、反應快；另一種先叫細胞內接力、反應較慢但變化多。","快門直接開，慢門叫接力。"],
      ["看到受體先問器官結果","不同受體會讓心跳變快、支氣管放鬆或血管收縮；不要只背字母，要把字母黏到器官動作。","受體名字要綁器官反應。"]
    ],
    endocrine:[
      ["荷爾蒙分三種送貨方式","水溶性的包好放倉庫、需要時倒出去；脂溶性的臨時製造、直接穿牆；少數由胺基酸做的要看它像哪一邊。","先問能不能溶在水。"],
      ["蛋白質荷爾蒙像工廠包裹","先做很長的半成品，再一路剪裁、包進小泡泡；收到命令時，小泡泡和細胞膜融合，把成品倒出去。","先做、先存、再出貨。"],
      ["細胞外按門鈴，細胞內跑接力","不能穿膜的荷爾蒙在門外按 receptor，細胞內再用小分子接力，把訊號放大。","外面按鈴，裡面傳話。"],
      ["甲狀腺把碘裝到大蛋白上","先把碘抓進細胞，再送進濾泡中央，接到 tyrosine 上並兩兩配對，最後切下 T3/T4 放進血。","抓碘 → 黏碘 → 配對 → 剪下。"],
      ["T4 像庫存，T3 像開工版本","甲狀腺主要放出較多 T4；到了周邊組織，可以轉成較有力的 T3，也能轉成沒作用的版本。","T4 多，T3 強。"],
      ["看上游和下游誰高誰低","甲狀腺自己太旺時，下游荷爾蒙高、上游命令低；原料不足時，下游低、上游會拼命催，腺體可能被催大。","產品多就少催，產品少就猛催。"],
      ["血鈣太低時，身體先救血液","身體會從骨頭借鈣、讓腎臟少丟鈣，並叫腸子多吸收；因為血鈣太低會讓神經肌肉亂放電。","先救血，再顧骨。"],
      ["骨頭拆除隊不是直接接命令","升血鈣荷爾蒙先告訴造骨細胞，再由造骨細胞叫醒拆骨細胞，讓骨鈣釋出。","長官不直接找拆除工。"],
      ["維生素 D 要蓋三個章","皮膚或食物取得原料後，先去肝、再去腎加工，才變成能幫腸子吸收鈣的活性版本。","皮膚 → 肝 → 腎 → 腸。"],
      ["胰島像四色小隊","不同細胞各自負責降血糖、升血糖、踩煞車；胰臟同時也會把消化液送進腸道。","一邊管血糖，一邊管消化。"],
      ["看陪跑碎片就知道是不是自己做的","身體自己製造 insulin 時，會同時放出一塊陪跑碎片；外面打進來的 insulin 沒有它。","有陪跑碎片＝自己做的。"]
    ],
    reproduction:[
      ["多一條 X，就多收起一條","細胞只需要一條 X 工作，多出來的會捲起來休息；所以休息小球的數量是 X 數量減一。","X 有幾條，休息的少一條。"],
      ["卵子一生會按兩次暫停","女性的卵細胞出生前先停一次；排卵時再停一次，只有真的受精才會把第二次分裂做完。","出生前停一，排卵後停二。"],
      ["一把做性荷爾蒙，一把做更強男性版本","性腺裡的酵素幫忙做 testosterone 或 estrogen；另一把酵素在周邊把 testosterone 改成更強的 DHT。","性腺製造，周邊強化。"],
      ["睪丸從裡面長，卵巢從外面長","胚胎早期的性腺有外層和內層；男性主要保留內層，女性主要保留外層。","男內、女外。"],
      ["大腦下令，兩種細胞分工","上游先放總命令，再分成兩條：一條叫 Leydig 做 testosterone；另一條叫 Sertoli 照顧精子。","L 做荷爾蒙，S 顧精子。"],
      ["Sertoli 是精子幼兒園老師","它餵養發育中的精子、築起保護牆、留住高濃度 testosterone，還會回報上游不要再催太多。","餵、擋、留、回報。"],
      ["血裡和睪丸小管裡用不同保母車","testosterone 在一般血液中搭一種運輸蛋白；進入製造精子的管子後，改由 Sertoli 做的蛋白留住。","血裡一台，小管另一台。"],
      ["卵泡兩個房間接力做 estrogen","外層細胞先在 LH 命令下做原料；內層細胞再受 FSH 命令，把原料改成 estrogen。","外層做原料，內層做成品。"],
      ["排卵看下次月經倒數十四天","不是每個人都固定在週期第十四天排卵；比較穩的是排卵後大約十四天才來月經。","從下次月經往前倒數。"],
      ["胚胎先發維持黃體的續約通知","懷孕初期胎盤還沒完全接手，胚胎先放出類似 LH 的訊號，叫黃體繼續製造 progesterone。","先續約黃體，再由胎盤接班。"]
    ]
  };
  const babyWords=[
    ["intracrine","訊號留在自己細胞裡，不送出去（intracrine）"],
    ["autocrine","自己送訊號給自己（autocrine）"],
    ["paracrine","只送給隔壁鄰居（paracrine）"],
    ["neuroendocrine","神經細胞把訊號倒進血裡（neuroendocrine）"],
    ["endocrine","訊號搭血液去遠方（endocrine）"],
    ["target cells","有正確接收器的目標細胞（target cells）"],
    ["target cell","有正確接收器的目標細胞（target cell）"],
    ["negative feedback","產品夠了，就回頭叫上游少做一點（negative feedback）"],
    ["positive feedback","越做越強，直到事情完成（positive feedback）"],
    ["homeostasis","把身體維持在剛剛好的狀態（homeostasis）"],
    ["second messenger","細胞裡負責接棒傳話的小弟（second messenger）"],
    ["gene transcription","叫細胞照 DNA 說明書製造新東西（gene transcription）"],
    ["intracellular receptor","住在細胞裡面的接收器（intracellular receptor）"],
    ["membrane receptor","裝在細胞外牆上的接收器（membrane receptor）"],
    ["action potential","沿著細胞膜跑的一次電訊號（action potential）"],
    ["depolarization","細胞被叫醒、準備放電（depolarization）"],
    ["hyperpolarization","細胞變得更安靜、更難放電（hyperpolarization）"],
    ["repolarization","細胞回到休息狀態（repolarization）"],
    ["afferent","把消息送進腦和脊髓（afferent）"],
    ["efferent","把命令從腦和脊髓送出去（efferent）"],
    ["CNS","腦和脊髓這個總部（CNS）"],
    ["PNS","總部以外的神經線（PNS）"],
    ["neuron","負責傳訊的神經細胞（neuron）"],
    ["glia","照顧神經元的後勤細胞（glia）"],
    ["myelin","包住神經線、讓電跑更快的絕緣套（myelin）"],
    ["filtration","先把血漿裡的小東西大量篩出去（filtration）"],
    ["reabsorption","把身體還想要的東西撿回來（reabsorption）"],
    ["secretion","再把不要的東西丟進尿管（secretion）"],
    ["excretion","最後真的跟尿一起離開（excretion）"],
    ["cortical nephron","住得較外面、管子較短的腎元（cortical nephron）"],
    ["juxtamedullary nephron","伸進深處、很會幫忙濃縮尿的長腎元（juxtamedullary nephron）"],
    ["collecting duct","最後決定要留多少水的集合管（collecting duct）"],
    ["glomerulus","腎臟最前面的濾網球（glomerulus）"],
    ["nephron","腎臟裡的一條迷你處理管（nephron）"],
    ["macula densa","負責聞尿管裡鹽夠不夠的感測細胞（macula densa）"],
    ["renin","低壓時按下升壓接力賽第一棒的訊號（renin）"],
    ["aldosterone","叫腎臟留鹽留水、排鉀的荷爾蒙（aldosterone）"],
    ["preload","心室開打前先裝進多少血（preload）"],
    ["afterload","心室把血推出去時遇到多大阻力（afterload）"],
    ["contractility","心肌自己能擠多用力（contractility）"],
    ["cardiac output","心臟一分鐘總共送出多少血（cardiac output）"],
    ["stroke volume","一次心跳送出多少血（stroke volume）"],
    ["pacemaker","自己會規律喊開始的節拍器細胞（pacemaker）"],
    ["photoreceptor","把光變成神經訊號的感光細胞（photoreceptor）"],
    ["rod","負責暗處、敏感但看不清顏色的細胞（rod）"],
    ["cone","負責亮處、顏色和細節的細胞（cone）"],
    ["cochlea","把聲音震動變成神經訊號的耳蝸（cochlea）"],
    ["hair cell","毛一彎就開始傳訊的內耳細胞（hair cell）"],
    ["sympathetic","身體的緊急備戰模式（sympathetic）"],
    ["parasympathetic","身體的休息消化模式（parasympathetic）"],
    ["preganglionic","從 CNS 到轉運站的第一棒神經（preganglionic）"],
    ["postganglionic","從轉運站到器官的第二棒神經（postganglionic）"],
    ["ganglion","兩顆神經交棒的轉運站（ganglion）"],
    ["neurotransmitter","神經末端放出的傳話小分子（neurotransmitter）"],
    ["peptide hormone","能溶在水、先包好存起來的荷爾蒙（peptide hormone）"],
    ["steroid hormone","能穿膜、需要時才製造的荷爾蒙（steroid hormone）"],
    ["cholesterol","製造 steroid hormone 的原料（cholesterol）"],
    ["follicle","裝著卵細胞、照顧它長大的小房間（follicle）"],
    ["ovulation","卵泡把卵細胞放出去（ovulation）"],
    ["corpus luteum","排卵後留下、暫時做 progesterone 的黃體（corpus luteum）"],
    ["implantation","小胚胎黏進子宮內膜安家（implantation）"],
    ["placenta","媽媽和胎兒交換物資、也做荷爾蒙的胎盤（placenta）"],
    ["spermatogenesis","一路把原始生殖細胞做成精子（spermatogenesis）"],
    ["oogenesis","一路準備卵細胞的過程（oogenesis）"],
    ["meiosis","把染色體分成一半、製造配子的分裂（meiosis）"],
    ["germ cell","未來會變成精子或卵子的細胞（germ cell）"],
    ["Sertoli cell","餵養並保護發育中精子的保母細胞（Sertoli cell）"],
    ["Leydig cell","收到 LH 後製造 testosterone 的細胞（Leydig cell）"],
    ["theca cell","先製造 androgen 原料的卵泡外層細胞（theca cell）"],
    ["granulosa cell","把原料改成 estrogen、也照顧卵子的細胞（granulosa cell）"],
    ["inhibin","回頭叫 FSH 少一點的煞車訊號（inhibin）"],
    ["aromatase","把 androgen 改造成 estrogen 的工具酵素（aromatase）"],
    ["estrogen","讓子宮內膜長厚、排卵前能踩油門的荷爾蒙（estrogen）"],
    ["progesterone","排卵後穩住子宮內膜、支持懷孕的荷爾蒙（progesterone）"],
    ["testosterone","主要男性 androgen，也支援精子生成（testosterone）"],
    ["insulin","叫細胞收下血糖、儲存能量的荷爾蒙（insulin）"],
    ["glucagon","血糖低時叫肝臟放糖的荷爾蒙（glucagon）"],
    ["osteoblast","負責蓋骨頭、也能呼叫拆骨隊的細胞（osteoblast）"],
    ["osteoclast","負責拆骨頭並放出鈣的細胞（osteoclast）"],
    ["vitamin D","加工完成後幫腸子吸收鈣的訊號（vitamin D）"],
    ["pituitary","接收命令、再指揮其他腺體的腦下垂體（pituitary）"],
    ["hypothalamus","連接神經和荷爾蒙控制的下視丘（hypothalamus）"],
    ["receptor","收訊號用的接收器（receptor）"],
    ["hormone","身體細胞用來傳話的化學小紙條（hormone）"]
  ].sort((a,b)=>b[0].length-a[0].length);
  function babyTranslate(text){
    let out=String(text||"");
    const saved=[];
    babyWords.forEach(([term,meaning])=>{
      const safe=term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      out=out.replace(new RegExp(`(^|[^A-Za-z0-9])${safe}(?=$|[^A-Za-z0-9])`,"g"),(all,prefix)=>{
        const token=`@@B${saved.length}@@`;saved.push(meaning);return prefix+token;
      });
    });
    saved.forEach((value,i)=>{out=out.replace(`@@B${i}@@`,value)});
    return out.split(/[。；]\s*/).map(s=>s.trim()).filter(Boolean);
  }
  function babyLinesHtml(text){
    return `<div class="baby-lines">${babyTranslate(text).map((line,i)=>`<div class="baby-line"><i>${i+1}</i><span>${esc(line)}。</span></div>`).join("")}</div>`;
  }
  let state={unit:"all",mode:"sprint",query:"",quizIndex:0,quizPool:[]};
  const done=new Set(JSON.parse(localStorage.getItem("physio-baby-done")||"[]"));
  function save(){localStorage.setItem("physio-baby-done",JSON.stringify([...done]));updateProgress()}
  function updateProgress(){const total=Object.values(high).reduce((n,a)=>n+a.length,0);$("#progressText").textContent=`已吞下 ${done.size} / ${total} 個必考小口`;$("#progressBar").style.width=`${Math.min(100,done.size/total*100)}%`}
  function annotate(root){
    const keys=Object.keys(glossary).sort((a,b)=>b.length-a.length);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())if(!walker.currentNode.parentElement.closest("button,input,script,style,.term"))nodes.push(walker.currentNode);
    nodes.forEach(node=>{const text=node.nodeValue;let best=null;
      keys.forEach(k=>{
        let from=0;
        while(from<text.length){
          const i=text.indexOf(k,from);
          if(i<0)break;
          const before=i===0?"":text[i-1];
          const after=i+k.length>=text.length?"":text[i+k.length];
          const leftOK=!before||!/[A-Za-z0-9]/.test(before);
          const rightOK=!after||!/[A-Za-z0-9]/.test(after);
          if(leftOK&&rightOK){
            if(!best||i<best.i||(i===best.i&&k.length>best.k.length))best={i,k};
            break;
          }
          from=i+1;
        }
      });
      if(!best)return;const frag=document.createDocumentFragment();frag.append(text.slice(0,best.i));
      const b=document.createElement("button");b.className="term";b.dataset.term=best.k;b.textContent=text.slice(best.i,best.i+best.k.length);frag.append(b);frag.append(text.slice(best.i+best.k.length));node.replaceWith(frag);
    });
  }
  function unitList(){return state.unit==="all"?data.units:data.units.filter(u=>u.id===state.unit)}
  function sprintCards(){
    let cards=[];unitList().forEach(u=>(high[u.id]||[]).forEach((x,i)=>cards.push({u,x,baby:(babySprint[u.id]||[])[i],id:`${u.id}-${i}`})));
    if(state.query)cards=cards.filter(o=>`${o.u.title} ${o.x.join(" ")} ${(o.baby||[]).join(" ")}`.toLowerCase().includes(state.query));
    return `<div class="section-head"><div><p class="eyebrow">真的先講人話，再講考卷話</p><h2>⚡ 必考衝刺卡</h2></div><p>${cards.length} 張｜第一輪不要展開術語</p></div>
      <div class="sprint-rule"><b>🐣 寶寶使用規則：</b>先只讀白色卡面，能自己講出因果後，才打開「老師會怎麼寫」。</div>
      <div class="cards">${cards.map(({u,x,baby,id})=>{
        const b=baby||[x[1],x[2],"先搞懂方向，再認英文名字。"];
        return `<article class="card sprint-card ${done.has(id)?"done":""}">
          <span class="card-tag">${x[0]==="must"?"必吞":"高頻"} · ${esc(u.shortTitle)}</span>
          <h3>${esc(b[0])}</h3>
          <div class="baby-story"><span class="baby-face">🐣</span><p>${esc(b[1])}</p></div>
          <div class="memory-line"><b>小腦記法</b><span>${esc(b[2])}</span></div>
          <details class="exam-language">
            <summary>老師／考卷會怎麼寫？</summary>
            <h4>${esc(x[1])}</h4>
            <p>${esc(x[2])}</p>
            ${x[3]?`<div class="exam-warning"><b>容易考或搞反：</b>${esc(x[3])}</div>`:""}
          </details>
          <label class="check"><input type="checkbox" data-done="${id}" ${done.has(id)?"checked":""}>我能用自己的話講出來</label>
        </article>`}).join("")}</div>`;
  }
  function library(){
    let html=`<div class="section-head"><div><p class="eyebrow">先看地圖，再一口一口吃</p><h2>🧸 全部白話知識點</h2></div><p>主線 → 核心句 → 原因 → 考點</p></div>
      <div class="reading-guide">
        <b>怎麼看這一頁？</b>
        <span><i>1</i> 看章節地圖</span><span><i>2</i> 只讀黃色核心句</span>
        <span><i>3</i> 不懂才展開原因</span><span><i>4</i> 最後收考點與陷阱</span>
      </div>`;
    unitList().forEach(u=>{let sections=u.sections.filter(s=>!state.query||`${s.title} ${s.points.map(p=>`${p.title} ${p.text}`).join(" ")}`.toLowerCase().includes(state.query));
      if(!sections.length)return;
      html+=`<div class="unit-banner"><span>${esc(u.code)}</span><h2>${esc(u.title)}</h2><p>${esc(u.tagline||"")}</p></div>`+
      sections.map((s,sectionIndex)=>{
        const logic=(s.thread&&s.thread.length?s.thread:s.points.map(p=>p.title));
        return `<details class="chapter" ${state.query?"open":""}>
          <summary>
            <span class="chapter-number">${String(sectionIndex+1).padStart(2,"0")}</span>
            <span class="chapter-summary-text"><b>${esc(s.title)}</b><small>${esc(s.summary||"")} · ${s.points.length} 個觀念</small></span>
            <span class="open-hint">展開地圖</span>
          </summary>
          <div class="chapter-inside">
            <div class="logic-map">
              <p class="eyebrow">這章的腦內路線</p>
              <div class="logic-steps">${logic.map((step,i)=>`<div class="logic-step"><i>${i+1}</i><span>${esc(step)}</span></div>`).join("")}</div>
            </div>
            <div class="point-list">${s.points.map((p,i)=>{
              const original=p.text||p.plain||"";
              const core=p.bridge||`這一小口要懂：${p.title}`;
              return `<article class="point">
                <div class="point-index">${sectionIndex+1}.${i+1}</div>
                <div class="point-body">
                  <h3>${esc(p.title)}</h3>
                  <div class="core-sentence"><b>先記這句</b><span>${esc(core)}</span></div>
                  <div class="plain-explain"><b>🐣 翻成寶寶話</b>${babyLinesHtml(original)}</div>
                  <details class="more">
                    <summary>把邏輯拆開看 ↓</summary>
                    <div class="detail-stack">
                      <div class="detail-row original-text"><b>正式完整版（資訊保留區）</b><p>${esc(original)}</p></div>
                      ${p.mechanism?`<div class="detail-row why"><b>為什麼會這樣？</b><p>${esc(p.mechanism)}</p></div>`:""}
                      ${p.formula?`<div class="detail-row formula"><b>公式／關係</b><p>${esc(p.formula)}</p></div>`:""}
                      ${p.exam?`<div class="detail-row exam-focus"><b>考試抓這些</b><ul class="exam-list">${p.exam.map(e=>`<li>${esc(e)}</li>`).join("")}</ul></div>`:""}
                      ${p.trap?`<div class="detail-row trap-focus"><b>最容易搞反</b><p>${esc(p.trap)}</p></div>`:""}
                    </div>
                  </details>
                </div>
              </article>`}).join("")}</div>
            ${s.wrapUp?`<div class="chapter-wrap"><b>🧠 關書前自己講：</b>${esc(s.wrapUp)}</div>`:""}
          </div>
        </details>`}).join("")
    });
    return html;
  }
  function buildQuiz(){
    const pool=[];
    unitList().forEach(u=>{
      u.sections.forEach(s=>s.points.forEach(p=>p.drill&&pool.push({...p.drill,unit:u.shortTitle})));
      u.quiz.forEach(q=>pool.push({...q,unit:u.shortTitle}));
    });
    state.quizPool=pool.sort(()=>Math.random()-.5);state.quizIndex=0;
  }
  function quiz(){
    if(!state.quizPool.length)buildQuiz();const q=state.quizPool[state.quizIndex%state.quizPool.length];
    if(!q)return `<div class="empty">這裡沒有題目。</div>`;
    return `<div class="section-head"><div><p class="eyebrow">先猜才會黏住</p><h2>🍼 快問快答</h2></div><p>${state.quizIndex+1} / ${state.quizPool.length}</p></div><article class="quiz-card"><span class="card-tag">${esc(q.unit)}</span><h2>${esc(q.question)}</h2><div class="choices">${q.choices.map((c,i)=>`<button class="choice" data-choice="${i}">${esc(c)}</button>`).join("")}</div><div id="answerBox"></div></article>`;
  }
  function glossaryView(){
    const entries=Object.entries(glossary).filter(([k,v])=>!state.query||`${k} ${v}`.toLowerCase().includes(state.query));
    return `<div class="section-head"><div><p class="eyebrow">English 外殼，中文內餡</p><h2>ABC 名詞奶瓶</h2></div><p>${entries.length} 個名詞</p></div><div class="glossary">${entries.map(([k,v])=>`<article class="term-card"><h3>${esc(k)}</h3><p>${esc(v)}</p></article>`).join("")}</div>`;
  }
  function render(){
    const content=$("#content");content.innerHTML=state.mode==="sprint"?sprintCards():state.mode==="library"?library():state.mode==="quiz"?quiz():glossaryView();
    if(state.mode!=="glossary")annotate(content);updateProgress();
  }
  function initTabs(){
    $("#unitTabs").innerHTML=["all",...data.units.map(u=>u.id)].map(id=>`<button data-unit="${id}" class="${id==="all"?"active":""}">${names[id]}</button>`).join("");
  }
  document.addEventListener("click",e=>{
    const unit=e.target.closest("[data-unit]");if(unit){state.unit=unit.dataset.unit;state.quizPool=[];document.querySelectorAll("[data-unit]").forEach(b=>b.classList.toggle("active",b===unit));render();return}
    const mode=e.target.closest("[data-mode]");if(mode){state.mode=mode.dataset.mode;document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b===mode));render();return}
    const cb=e.target.closest("[data-done]");if(cb){cb.checked?done.add(cb.dataset.done):done.delete(cb.dataset.done);save();cb.closest(".card").classList.toggle("done",cb.checked);return}
    const term=e.target.closest("[data-term]");if(term){$("#termTitle").textContent=term.dataset.term;$("#termMeaning").textContent=glossary[term.dataset.term];$("#termDialog").showModal();return}
    if(e.target.closest(".dialog-close"))$("#termDialog").close();
    const choice=e.target.closest("[data-choice]");if(choice){const q=state.quizPool[state.quizIndex%state.quizPool.length];document.querySelectorAll(".choice").forEach((b,i)=>{b.disabled=true;b.classList.toggle("correct",i===q.answer)});if(+choice.dataset.choice!==q.answer)choice.classList.add("wrong");$("#answerBox").innerHTML=`<div class="answer"><b>${+choice.dataset.choice===q.answer?"嘎！答對了 🐣":"咕…差一點"}</b><br>${esc(q.explain)}</div><button class="next" id="nextQuiz">下一題 →</button>`;annotate($("#answerBox"));return}
    if(e.target.id==="nextQuiz"){state.quizIndex++;render()}
  });
  $("#searchInput").addEventListener("input",e=>{state.query=e.target.value.trim().toLowerCase();render()});
  $("#randomBtn").addEventListener("click",()=>{const units=data.units;const u=units[Math.floor(Math.random()*units.length)];state.unit=u.id;state.mode="sprint";document.querySelectorAll("[data-unit]").forEach(b=>b.classList.toggle("active",b.dataset.unit===u.id));document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode==="sprint"));render();setTimeout(()=>document.querySelector(".card")?.scrollIntoView({behavior:"smooth",block:"center"}),50)});
  $("#resetBtn").addEventListener("click",()=>{if(confirm("真的要把已讀進度清空嗎？")){done.clear();save();render()}});
  initTabs();render();
})();
