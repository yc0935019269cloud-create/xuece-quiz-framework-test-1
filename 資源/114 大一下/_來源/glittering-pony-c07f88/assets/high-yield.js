window.PHYSIO_HIGH_YIELD = {
  cardiovascular: [
    ["must","ECG 核心算法","每個 lead 記錄「正極電位總和 − 負極電位總和」；細胞外正電荷朝正極移動，波形向上，背離則向下。","I：RA(−)→LA(+)；II：RA(−)→LL(+)；III：LA(−)→LL(+)。"],
    ["must","T wave 為何通常向上","心室再極化方向與去極化相反，但電性也相反；兩次負號抵銷，所以多數 lead 的 T wave 仍向上。","不能只看到「方向相反」就判定向下。"],
    ["freq","RR interval 與心率","RR interval 是相鄰 R 波間距，代表一個心搏週期。","規則心律：HR ≈ 60 ÷ RR（秒）。"],
    ["freq","PR interval 與 AV delay","PR interval 是心房去極化開始到心室去極化開始；AV delay 讓心房先收縮、心室後收縮。","PR > 0.20 s 常見於 first-degree AV block。"],
    ["freq","AV node 為何傳得慢","transitional/nodal fibers 較細、K⁺ channel 較多、gap junction 較少。","生理目的：確保心室充盈。"],
    ["freq","ST segment 臨床意義","ST elevation 常提示急性 transmural injury；ST depression 常見於 subendocardial ischemia。","勿混淆 ST、T wave、Q wave 的意義。"],
    ["must","肢導程與增強肢導程","Lead I/II/III 正負極要背；aVR、aVL、aVF 分別看右臂、左臂、足部方向。","增強導程其餘兩肢是共同 reference。"],
    ["freq","心臟週期分界","射血後段即使肌纖維開始放鬆仍屬收縮期；主動脈瓣關閉到二尖瓣開啟才是 isovolumetric relaxation。","肌肉開始放鬆 ≠ 已進入舒張期。"]
  ],
  urinary: [
    ["freq","JGA 三大組成","macula densa、juxtaglomerular/granular cells、extraglomerular mesangial cells；感知 NaCl／灌流並調節 renin。","distal tubule 貼近 afferent arteriole 就想到 JGA。"],
    ["freq","RAAS 主線","腎灌流壓↓、macula densa NaCl↓或 β₁ 刺激→renin→Ang I→ACE→Ang II→血管收縮與 aldosterone。","TPR↑、Na⁺/水再吸收↑、血壓↑。"],
    ["freq","Renal handling 總公式","排泄量 = 濾過量 − 再吸收量 + 分泌量。","filtered load = plasma [X] × GFR。"],
    ["freq","兩類 nephron","Cortical nephron 多、loop 短；juxtamedullary loop 長，配合 vasa recta 建立髓質滲透梯度。","不要誤背成 renin 只由某類 nephron 分泌。"],
    ["freq","小動脈半徑與血壓","半徑下降→resistance、TPR、arterial pressure 上升。","Poiseuille：R ∝ 1/r⁴。"]
  ],
  cns: [
    ["must","英文名詞直接考","CNS/PNS、afferent/efferent、somatic/autonomic、cerebrum/cerebellum/brainstem/spinal cord 都要直接認英文。","不能只認中文。"],
    ["freq","CNS / PNS 判定","完全位於 brain 與 spinal cord 內才算 CNS；伸到中樞外的構造屬 PNS。","常用 cell body 與 axon terminal 位置混淆。"],
    ["must","Afferent vs Efferent","Afferent 把資訊送往 CNS；Efferent 把命令從 CNS 送到效應器。","A = Arrives；E = Exits。"],
    ["freq","α motor neuron 位置","cell body 在 ventral horn；axon 經 ventral root 離開並支配 skeletal muscle。","胞體在 CNS，但軸突大部分位於 PNS。"],
    ["freq","Motor unit 與精細度","一個 α motor neuron + 它支配的全部肌纖維 = motor unit；小 unit 精細，大 unit 力量大。","眼外肌、手指偏小；大腿肌偏大。"],
    ["freq","Glia 語言與功能","glia 可作集合／複數；負責支持、髓鞘、恆定、免疫與修復。","不負責主要長距離 action potential 傳遞。"]
  ],
  "special-senses": [
    ["must","Rhodopsin cycle","Rhodopsin=opsin+11-cis retinal；光→all-trans→transducin→PDE→cGMP↓→Na⁺ channel 關閉→hyperpolarization。","感光細胞受光是超極化，不是去極化。"],
    ["must","Rod vs Cone","Rod：暗視、靈敏、低解析、無色覺；Cone：明視、高解析、色覺。","Rhodopsin 屬 rod；cone 使用 photopsin。"],
    ["freq","Adequate stimulus","適宜刺激是以最低能量門檻活化 receptor 的刺激型態。","不代表 receptor 絕不能被其他刺激活化。"],
    ["must","Visual pathway 與交叉","Retina→optic nerve→chiasm→tract→LGN→radiation→visual cortex；只有 nasal retina 纖維交叉。","右視野到左半球；左視野到右半球。"],
    ["freq","視野病灶速判","Optic nerve：同側單眼失明；chiasm：雙顳側偏盲；tract/radiation/cortex：對側同名偏盲。","要會由視野找病灶，也要反推視野。"],
    ["freq","盲點判讀","盲點來自無 photoreceptor 的 optic disc；右眼盲點在右眼視野 temporal side，左眼相反。","測量圖要包含 entering 與 leaving point。"],
    ["freq","中耳阻抗匹配","鼓膜面積大於卵圓窗，加三小聽骨槓桿，提高壓力並把空氣振動傳入 cochlear fluid。","不考計算仍要會概念。"],
    ["freq","Traveling wave","高頻在 basilar membrane 基部達最大振幅；低頻在 apex 達最大振幅。","高頻靠底、低頻跑遠。"],
    ["freq","Hair cell 換能","朝最高 stereocilia 偏轉→tip link 開 K⁺ channel→K⁺由 endolymph 進入→去極化→Ca²⁺進入→transmitter↑。","endolymph 是高 K⁺。"],
    ["freq","Air vs Bone conduction","正常 Rinne：AC>BC；Weber 傳導性聽損偏患側，感音神經性聽損偏健側。","先分 conductive 或 sensorineural。"],
    ["freq","平衡器官配對","semicircular canals 感受 angular acceleration；utricle/saccule 感受 linear acceleration 與重力位置。","平衡也整合視覺與 proprioception。"],
    ["freq","味覺與嗅覺","味覺：CN VII 前2/3、IX 後1/3、X 會厭；嗅覺：CN I；兩者都是 chemical senses。","不考很細，不等於完全不考。"]
  ],
  ans: [
    ["must","ANS 四大特性","involuntary、雙神經元鏈、多數器官雙重支配、以拮抗或協同維持 homeostasis。","問答題先畫比較表，再補例外。"],
    ["must","交感 vs 副交感長短","交感 thoracolumbar：短節前、長節後；副交感 craniosacral：長節前、短節後。","副交感 cranial：III/VII/IX/X；sacral：S2–S4。"],
    ["must","傳遞物總表","所有 ANS 節前 ACh→Nn；副交感節後 ACh→M；多數交感節後 NE→α/β。","體運動是單一 neuron，ACh→Nm。"],
    ["must","汗腺例外","汗腺只受交感支配，但節後釋放 ACh，作用 muscarinic receptor。","「交感節後一律 NE」是錯的。"],
    ["must","腎上腺髓質","改造的 sympathetic ganglion；節前 ACh→chromaffin Nn→E/NE 入血。","沒有典型 postganglionic axon。"],
    ["freq","ANS 的 CNS/PNS 位置","ANS 屬 PNS motor division，但 preganglionic cell body 在 CNS；交感胞體主要在 IML。","勿混淆系統分類與胞體位置。"],
    ["freq","ACh 合成與受體","Choline+acetyl-CoA 經 ChAT→ACh；AChE 分解。Nicotinic 是 ion channel，muscarinic 是 GPCR。","Nm 在 NMJ；Nn 在 ganglia/adrenal medulla。"],
    ["freq","Adrenergic receptor 快表","α₁收縮；α₂抑制釋放；β₁心率/收縮力/renin↑；β₂支氣管與部分血管舒張；β₃脂解與逼尿肌舒張。","β₂ 不是讓所有平滑肌收縮。"]
  ],
  endocrine: [
    ["must","荷爾蒙三大類","Peptide：水溶、膜受體、可儲存、反應快；Steroid：膽固醇來源、脂溶、細胞內受體、現做現放；catecholamine 像 peptide，thyroid hormone 像 steroid。","Amine 分類表超高頻。"],
    ["must","Peptide hormone 合成","preprohormone→prohormone→hormone；RER/Golgi 加工後裝入 vesicle，Ca²⁺促進釋放。","可儲存，因此可有雙相分泌。"],
    ["freq","受體位置與訊息","水溶性用膜受體與 second messenger；脂溶性用 cytosolic/nuclear receptor 調 gene transcription。","Gs↑cAMP；Gi↓cAMP；Gq→PLC→IP₃/DAG→Ca²⁺。"],
    ["must","甲狀腺素合成","NIS 攝碘→pendrin 入 colloid→TPO 氧化/organification→MIT/DIT→coupling→thyroglobulin 儲存→endocytosis/proteolysis。","DIT+DIT=T4；MIT+DIT=T3。"],
    ["freq","T3、T4、rT3","甲狀腺主要分泌 T4；周邊轉成活性較高 T3 或不活性 rT3；free T3/T4 才具活性。","判功能不可只看 total hormone。"],
    ["freq","甲狀腺疾病比較","Cretinism：幼兒 TH 不足，生長與智力受損；Graves：T3/T4↑、TSH↓；缺碘 goiter：TH↓、TSH↑。","GH deficiency 侏儒症通常智力不受損。"],
    ["must","血鈣三巨頭","PTH、active vitamin D 提高血鈣；calcitonin 降低血鈣；低血鈣使神經肌肉興奮性↑。","PTH 是快速維持血鈣主角。"],
    ["board","PTH 與骨重塑","PTH→osteoblast→RANKL↑→活化 osteoclast precursor→bone resorption↑。","osteoclast 沒有主要 PTH receptor。"],
    ["board","Vitamin D 活化","皮膚 UVB→肝 25-hydroxylation→腎 1α-hydroxylation（PTH 促進）→calcitriol。","活性型 1,25-(OH)₂D₃；增加腸道 Ca²⁺/PO₄³⁻吸收。"],
    ["must","胰島細胞配對","α/A→glucagon；β/B→insulin；δ/D→somatostatin；PP/F→pancreatic polypeptide。","Pancreas 是 endocrine+exocrine 混合腺。"],
    ["freq","C-peptide 判讀","proinsulin→insulin+C-peptide，內源性約1:1釋放；外源 insulin 不含 C-peptide。","用來估 β-cell 自體分泌。"]
  ],
  reproduction: [
    ["must","Barr body","Barr body 是失活 X chromosome；嗜中性球可見 drumstick appendage。","Barr body 數=X chromosome 數−1。"],
    ["must","卵子兩次 arrest","primary oocyte 停 prophase I；排卵時 secondary oocyte 停 metaphase II，受精後才完成 meiosis II。","oogonia mitosis 在出生前停止。"],
    ["must","17β-HSD vs 5α-reductase","17β-HSD 在性腺參與形成 testosterone/estradiol；5α-reductase 在周邊把 testosterone→DHT。","DHT 不是主要在性腺製造。"],
    ["must","性腺胚胎來源","男性 testis 主要由 medulla 發展；女性 ovary 主要由 cortex 發展。","老師明示必考。"],
    ["must","男性 HPG axis","GnRH→LH/FSH；LH→Leydig→testosterone；FSH→Sertoli→spermatogenesis、ABP、inhibin。","Inhibin 主要負回饋 FSH。"],
    ["must","Sertoli cell","支持/營養 germ cell、blood-testis barrier、分泌 ABP/inhibin、協助 spermatogenesis。","ABP 維持管內高 testosterone。"],
    ["must","Testosterone 運輸","一般血液中主要與 SHBG 結合；seminiferous tubule 內靠 ABP。","主要 transport protein：SHBG。"],
    ["must","Two-cell, two-gonadotropin","LH→theca→androgen；androgen 進 granulosa，FSH 促 aromatase→estrogen。","theca 造 androgen；granulosa 造 estrogen。"],
    ["freq","排卵與週期","排卵約在下一次月經前14天；高 estradiol 正回饋→LH surge→ovulation。","不是固定週期第14天。"],
    ["board","hCG 功能","早期胚胎/胎盤 hCG 類似 LH，維持 corpus luteum 與 progesterone，直到 placenta 接手。","驗孕測 hCG；排卵試紙測 LH。"]
  ]
};
