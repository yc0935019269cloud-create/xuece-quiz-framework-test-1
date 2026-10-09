/* 遊戲內容設定：區域、怪物、遺物、天賦、道具、寵物、事件、永久強化 */
const C = (() => {
  /* ---- 區域主題：每個科目選一個主題（content/project.json 的 theme），決定地區名、首領與怪物名前綴 ---- */
  const THEMES = {
    lit: { name: '語文', region: '墨韻書林', color: '#e8a04a', icon: 84, desc: '國文、作文、文學、閱讀' },
    lang: { name: '外語', region: '異語迷城', color: '#4fa8ff', icon: 99, desc: '英文、日文等外語' },
    math: { name: '數學', region: '數理深淵', color: '#b98bff', icon: 111, desc: '數學、邏輯、程式' },
    calc: { name: '計算應用', region: '算式礦坑', color: '#ff7ab8', icon: 109, desc: '統計、會計、商用數學、證照計算' },
    hist: { name: '人文社會', region: '史地遺跡', color: '#62d66e', icon: 100, desc: '歷史、地理、公民、法律、管理' },
    sci: { name: '自然科學', region: '元素洞窟', color: '#5fe0d0', icon: 122, desc: '物理、化學、生物、地科、醫護' },
    mix: { name: '綜合', region: '試煉迷宮', color: '#ffd84a', icon: 92, desc: '不限主題：首領從所有主題隨機登場' }
  };
  const THEME_KEYS = ['lit', 'lang', 'math', 'calc', 'hist', 'sci'];
  const PALETTE = ['#e8a04a', '#4fa8ff', '#b98bff', '#ff7ab8', '#62d66e', '#5fe0d0', '#ffd84a', '#ff8a5c', '#9fd7ff', '#c6e36a'];
  /* 科目：由 data/bank.js（content/project.json）決定，缺的欄位用主題預設值補上 */
  const SUBJECTS = {};
  /* 新增／更新一個科目（建置資料與「導入素材」共用） */
  function addSubject(sj) {
    const th = THEMES[sj.theme] ? sj.theme : 'mix', T = THEMES[th], i = Object.keys(SUBJECTS).length;
    SUBJECTS[sj.id] = { id: sj.id, name: sj.name || sj.id, theme: th, region: sj.region || (th === 'mix' ? `${sj.name || sj.id}迷宮` : T.region),
      color: sj.color || (SUBJECTS[sj.id] || {}).color || PALETTE[i % PALETTE.length], icon: sj.icon || T.icon, desc: sj.desc || T.desc, words: sj.words, time: sj.time };
  }
  ((window.QB && window.QB.subjects) || []).forEach(addSubject);
  const themeOf = subj => (SUBJECTS[subj] || {}).theme || 'mix';
  const PREFIX = {
    lit: ['錯字', '文言', '修辭', '成語', '虛詞', '通假', '賦比興', '典故'],
    lang: ['單字', '文法', '時態', '片語', '介係詞', '克漏字', '子句', '倒裝'],
    math: ['根號', '向量', '矩陣', '機率', '對數', '三角', '多項式', '行列式'],
    calc: ['統計', '複利', '指數', '三角', '數列', '比例', '期望值', '迴歸'],
    hist: ['史料', '地形', '憲法', '季風', '供需', '殖民', '條約', '人口'],
    sci: ['電子', '酸鹼', '細胞', '板塊', '力學', '光譜', '氧化', '基因'],
    mix: ['考古', '迷途', '混沌', '試煉', '暗影', '古卷', '謎題', '迴廊']
  };
  /* ---- 怪物特性（行為模式） ---- */
  const TRAITS = {
    thief: { name: '扒手', desc: '你答錯時偷走金幣' },
    drain: { name: '吸血', desc: '反擊造成傷害的 50% 回復自身' },
    poison: { name: '劇毒', desc: '你答錯時中毒 3 題，每題扣血' },
    silence: { name: '封印', desc: '你答錯時所有技能冷卻 +1' },
    armor: { name: '硬殼', desc: '每次受到的傷害 -3' },
    dodge: { name: '虛化', desc: '25% 機率閃避你的攻擊' },
    undying: { name: '不死', desc: '第一次倒下時以 30% 生命復活' },
    stoneskin: { name: '石膚', desc: '前 2 次受到攻擊只受一半傷害' },
    charge: { name: '蓄力', desc: '每 3 題蓄力一次；蓄力時你答錯，反擊 ×2' },
    weaken: { name: '凝視', desc: '你答錯時本場攻擊力 -1' },
    frenzy: { name: '狂暴', desc: '生命低於 50% 時攻擊力 +40%' },
    fragile: { name: '脆弱', desc: '受到暴擊時傷害再 ×1.5' },
    heal: { name: '再生', desc: '每 3 題回復 10% 生命' },
    swift: { name: '迅捷', desc: '攻擊高、生命低' },
    thick: { name: '厚實', desc: '生命高、攻擊低' },
    spite: { name: '怨念', desc: '被擊敗時對你造成 6 點傷害' }
  };
  /* 精英詞綴：從這裡抽 1～2 個（可能是特性或首領機制） */
  const ELITE_AFFIX = ['armor', 'heal', 'frenzy', 'drain', 'poison', 'charge', 'dodge', 'stoneskin', 'undying', 'silence', 'weaken', 'm:shield', 'm:haste', 'm:enrage'];
  /* ---- 怪物種類：tier 越高越晚出現；tile 為數字=Kenney 圖塊，字串=自繪像素圖 ---- */
  const MONSTERS = [
    { id: 'slime', name: '史萊姆', tile: 108, hp: 0.9, atk: 0.8, tier: 0, traits: [], desc: '最普通的怪物，沒有特殊能力。' },
    { id: 'rat', name: '竄鼠', tile: 124, hp: 0.8, atk: 0.9, tier: 0, traits: ['thief'], desc: '趁你答錯時叼走金幣。' },
    { id: 'bat', name: '吸血蝙蝠', tile: 120, hp: 0.8, atk: 1.0, tier: 0, traits: ['drain'], desc: '咬傷你的同時回復自己。' },
    { id: 'shroom', name: '孢子菇', tile: 'mushroom', hp: 0.9, atk: 0.8, tier: 0, traits: ['poison'], desc: '散播毒孢子，讓你持續扣血。' },
    { id: 'book', name: '噬題魔典', tile: 'book', hp: 0.9, atk: 0.9, tier: 0, traits: ['silence'], desc: '翻動書頁封印你的技能。' },
    { id: 'snail', name: '火蝸牛', tile: 123, hp: 1.2, atk: 0.8, tier: 1, traits: ['armor', 'thick'], desc: '堅硬的殼能擋住部分傷害。' },
    { id: 'spider', name: '毒蜘蛛', tile: 122, hp: 0.85, atk: 1.2, tier: 1, traits: ['poison', 'swift'], desc: '速度快、毒性強。' },
    { id: 'ghost', name: '幽靈', tile: 121, hp: 1.0, atk: 1.1, tier: 1, traits: ['dodge'], desc: '半透明的身體常讓攻擊落空。' },
    { id: 'skeleton', name: '骷髏兵', tile: 'skull', hp: 0.9, atk: 1.1, tier: 1, traits: ['undying'], desc: '打倒一次還會爬起來。' },
    { id: 'eye', name: '凝視之眼', tile: 'eye', hp: 0.9, atk: 1.0, tier: 1, traits: ['weaken'], desc: '被它盯著答錯，力氣會一點點流失。' },
    { id: 'bandit', name: '盜賊', tile: 112, hp: 0.9, atk: 1.3, tier: 2, traits: ['thief', 'swift'], desc: '出手快又貪財。' },
    { id: 'crab', name: '赤甲魔', tile: 110, hp: 1.3, atk: 1.05, tier: 2, traits: ['stoneskin'], desc: '外殼能吸收最初的攻擊。' },
    { id: 'mage', name: '暗影術士', tile: 111, hp: 1.0, atk: 1.2, tier: 2, traits: ['charge'], desc: '會詠唱強力魔法，蓄力時務必答對！' },
    { id: 'wisp', name: '鬼火', tile: 'wisp', hp: 0.8, atk: 1.2, tier: 2, traits: ['frenzy', 'fragile'], desc: '瀕死時會暴走，但怕暴擊。' },
    { id: 'guard', name: '鐵甲守衛', tile: 96, filter: 'grayscale(1) brightness(.8)', hp: 1.3, atk: 1.0, tier: 2, traits: ['armor', 'heal'], desc: '厚重盔甲加上緩慢回復，是場耐力戰。' },
    { id: 'cyclops', name: '獨眼巨人', tile: 109, hp: 1.5, atk: 1.2, tier: 3, traits: ['charge', 'thick'], desc: '巨棒蓄力一擊非常致命。' },
    { id: 'golem', name: '岩石魔像', tile: 109, filter: 'grayscale(.8) sepia(.4) brightness(.8)', hp: 1.6, atk: 1.0, tier: 3, traits: ['stoneskin', 'heal'], desc: '石膚加上再生，需要持續輸出。' },
    { id: 'fallen', name: '墮落騎士', tile: 97, filter: 'hue-rotate(300deg) saturate(3) brightness(.6)', hp: 1.2, atk: 1.35, tier: 3, traits: ['frenzy', 'drain'], desc: '越打越瘋狂，還會吸血。' },
    { id: 'warlock', name: '禁咒術師', tile: 84, filter: 'hue-rotate(90deg) saturate(1.5) brightness(.8)', hp: 1.1, atk: 1.25, tier: 3, traits: ['silence', 'charge'], desc: '封印技能後詠唱大招。' },
    { id: 'wraith', name: '怨靈', tile: 121, filter: 'hue-rotate(300deg) saturate(2.5)', hp: 1.0, atk: 1.3, tier: 3, traits: ['dodge', 'spite'], desc: '難以命中，死前還會詛咒你。' }
  ];
  const BOSSES = [
    { id: 'lich', name: '禁書大巫妖', tile: 84, filter: 'hue-rotate(200deg) saturate(1.6) brightness(.9)' },
    { id: 'dknight', name: '墮落考官騎士', tile: 96, filter: 'hue-rotate(260deg) saturate(3) brightness(.7)' },
    { id: 'titan', name: '遠古巨像', tile: 109, filter: 'hue-rotate(120deg) saturate(1.8)' },
    { id: 'demon', name: '深淵魔王', tile: 110, filter: 'hue-rotate(290deg) saturate(1.8) brightness(.85)' }
  ];
  const VARIANT = ['', 'hue-rotate(90deg)', 'hue-rotate(180deg)', 'hue-rotate(270deg) saturate(1.4)', 'saturate(2) brightness(1.1)'];

  /* ---- 遺物：locked=true 需在「遺物圖鑑」用魂晶解鎖後才會出現 ---- */
  const RELICS = [
    { id: 'sword', name: '鐵劍', icon: 104, rar: 1, desc: '攻擊力 +3', gain: p => { p.atk += 3; } },
    { id: 'buckler', name: '橡木盾', icon: 102, rar: 1, desc: '防禦力 +2', gain: p => { p.def += 2; } },
    { id: 'belt', name: '巨人腰帶', icon: 101, rar: 1, desc: '最大生命 +20，並回復 20', gain: p => { p.maxHp += 20; p.hp += 20; } },
    { id: 'fang', name: '吸血獠牙', icon: '🦷', rar: 2, desc: '答對時回復 2 生命' },
    { id: 'clover', name: '四葉草', icon: '🍀', rar: 1, desc: '暴擊率 +10%', gain: p => { p.crit += 0.10; } },
    { id: 'purse', name: '貪婪錢袋', icon: 'coin', rar: 1, desc: '金幣獲得 +30%', gain: p => { p.goldMul += 0.3; } },
    { id: 'bracer', name: '連擊護腕', icon: 29, rar: 2, desc: '連擊加成翻倍' },
    { id: 'owlglass', name: '貓頭鷹眼鏡', icon: '👓', rar: 2, desc: '單選題開場自動刪去 1 個錯誤選項', locked: true, cost: 80 },
    { id: 'thorns', name: '荊棘甲', icon: 117, rar: 2, desc: '受擊時反彈 60% 傷害給怪物', locked: true, cost: 60 },
    { id: 'hourglass', name: '時之沙漏', icon: '⌛', rar: 2, desc: '每場戰鬥第一次答錯不受傷', locked: true, cost: 90 },
    { id: 'quill', name: '學者羽毛筆', icon: 129, rar: 2, desc: '多選題與填答題答對傷害 +60%' },
    { id: 'ember', name: '營火餘燼', icon: 'campfire', rar: 1, desc: '篝火休息回復量 +50%' },
    { id: 'badge', name: '商人徽章', icon: 'coin', rar: 1, desc: '商店價格 8 折', locked: true, cost: 50 },
    { id: 'orb', name: '經驗寶珠', icon: 'gem', rar: 2, desc: '經驗值 +30%', gain: p => { p.xpMul += 0.3; } },
    { id: 'phoenix', name: '鳳凰羽毛', icon: '🪶', rar: 3, desc: '倒下時以 50% 生命復活一次', locked: true, cost: 150, gain: p => { p.revive += 1; } },
    { id: 'berserk', name: '狂戰士面具', icon: 111, rar: 3, desc: '攻擊 +40%，但受到傷害 +25%', locked: true, cost: 120, gain: p => { p.atkMul += 0.4; p.hurtMul += 0.25; } },
    { id: 'calm', name: '冷靜之石', icon: 56, rar: 2, desc: '答錯後的下一次答對，傷害 ×2' },
    { id: 'soul', name: '靈魂瓶', icon: 116, rar: 3, desc: '每擊敗 1 隻怪物額外 +2 魂晶', locked: true, cost: 100 },
    { id: 'crown', name: '賢者之冠', icon: 32, rar: 3, desc: '暴擊傷害 +80%', locked: true, cost: 130, gain: p => { p.critDmg += 0.8; } },
    { id: 'lantern', name: '探險提燈', icon: 7, rar: 1, desc: '每進入新樓層回復 5 生命' },
    { id: 'anvil', name: '矮人鐵砧', icon: 74, rar: 2, desc: '升級時攻擊力額外 +2', locked: true, cost: 70 },
    { id: 'mimicTooth', name: '寶箱怪之牙', icon: 92, rar: 3, desc: '寶箱與事件中的金幣 ×2', locked: true, cost: 90 },
    /* ---- 首領遺物：只會在深淵遠征擊敗首領後三選一 ---- */
    { id: 'philo', name: '賢者之石', icon: 'gem', rar: 4, boss: true, desc: '攻擊力 +6，最大生命 +20', gain: p => { p.atk += 6; p.maxHp += 20; p.hp += 20; } },
    { id: 'dragonheart', name: '龍之心', icon: 'heart', rar: 4, boss: true, desc: '最大生命 +35；每場戰鬥開始獲得 12 護盾', gain: p => { p.maxHp += 35; p.hp += 35; } },
    { id: 'tome', name: '無盡之書', icon: 63, rar: 4, boss: true, desc: '單選題出題時自動刪去 1 個錯誤選項' },
    { id: 'cloak', name: '吸血鬼披風', icon: 111, rar: 4, boss: true, desc: '答對時回復造成傷害的 15%' },
    { id: 'mjolnir', name: '雷神之鎚', icon: 117, rar: 4, boss: true, desc: '答對時 30% 機率追加一次 60% 的攻擊' },
    { id: 'compass', name: '黃金羅盤', icon: 'coin', rar: 4, boss: true, desc: '金幣 +50%；行商價格 7 折', gain: p => { p.goldMul += 0.5; } },
    { id: 'phoenixheart', name: '不死鳥之心', icon: 'fairy', rar: 4, boss: true, desc: '復活次數 +1，且復活時生命全滿', gain: p => { p.revive += 1; } },
    { id: 'chaosdice', name: '混沌骰子', icon: 56, rar: 4, boss: true, desc: '暴擊率 +15%，暴擊傷害 +60%', gain: p => { p.crit += 0.15; p.critDmg += 0.6; } },
    { id: 'aegis', name: '神盾', icon: 29, rar: 4, boss: true, desc: '防禦力 +4，受到的傷害 -10%', gain: p => { p.def += 4; p.hurtMul *= 0.9; } },
    { id: 'hourcrown', name: '時之王冠', icon: 32, rar: 4, boss: true, desc: '限時作答時間 +50%；連擊上限 +4', gain: p => { p.comboCap += 4; } }
  ];

  /* ---- 首領機制 ---- */
  const MECHS = {
    enrage: { name: '狂怒', desc: '每答一題，首領攻擊力 +8%（累積）' },
    shield: { name: '結界', desc: '每 3 題，首領獲得 12% 最大生命的護盾' },
    regen: { name: '再生', desc: '你答錯時，首領回復 8% 最大生命' },
    double: { name: '連擊', desc: '你答錯時，首領連續攻擊兩次（各 65%）' },
    curse: { name: '詛咒', desc: '你答錯時，本場攻擊力 -2' },
    haste: { name: '催促', desc: '限時作答：選擇題超時視為答錯' }
  };
  /* ---- 各科三章首領（深淵遠征） ---- */
  const BOSS_DEFS = {
    lit: [
      { name: '錯字書蠹王', tile: 122, filter: 'hue-rotate(40deg) saturate(1.6)', mech: 'curse', line: '一字之差，萬劫不復！' },
      { name: '文言幽魂・太史', tile: 121, filter: 'hue-rotate(180deg) saturate(2)', mech: 'regen', line: '之乎者也，汝可識乎？' },
      { name: '禁書大巫妖', tile: 84, filter: 'hue-rotate(200deg) saturate(1.6) brightness(.9)', mech: 'shield', line: '千卷禁書，皆為吾盾。' }],
    lang: [
      { name: '單字吞噬鼠王', tile: 124, filter: 'hue-rotate(250deg) saturate(2)', mech: 'enrage', line: 'Squeak! Your vocabulary is MINE!' },
      { name: '文法迷宮守衛', tile: 96, filter: 'hue-rotate(260deg) saturate(3) brightness(.7)', mech: 'double', line: 'Subject, verb, object... or die.' },
      { name: '克漏字魔女', tile: 99, filter: 'hue-rotate(230deg) saturate(1.8) brightness(.85)', mech: 'haste', line: 'Fill in the blank... before time runs out!' }],
    math: [
      { name: '無理數史萊姆王', tile: 108, filter: 'hue-rotate(160deg) saturate(1.5)', mech: 'regen', line: '√2 永遠除不盡，我也永遠不會倒下！' },
      { name: '矩陣魔像', tile: 109, filter: 'hue-rotate(200deg) saturate(1.2) brightness(.8)', mech: 'shield', line: '行列式為零？那可不行。' },
      { name: '極限魔王', tile: 110, filter: 'hue-rotate(290deg) saturate(1.8) brightness(.85)', mech: 'enrage', line: '當 x 趨近我，你將趨近於零。' }],
    calc: [
      { name: '統計鼠群之主', tile: 124, filter: 'hue-rotate(60deg) saturate(2)', mech: 'double', line: '樣本數越多，我越強！' },
      { name: '複利貪狼盜賊', tile: 112, filter: 'hue-rotate(300deg) saturate(1.6)', mech: 'curse', line: '你的時間，就是我的本金。' },
      { name: '三角函數巨像', tile: 109, filter: 'hue-rotate(120deg) saturate(1.8)', mech: 'haste', line: 'sin、cos、tan，一個都跑不掉！' }],
    hist: [
      { name: '史料盜墓者', tile: 112, filter: 'hue-rotate(20deg) saturate(1.4) brightness(.8)', mech: 'regen', line: '歷史由勝利者改寫！' },
      { name: '季風幽靈', tile: 121, filter: 'hue-rotate(90deg) saturate(2)', mech: 'haste', line: '夏季西南，冬季東北——快答！' },
      { name: '帝國遺魂皇帝', tile: 100, filter: 'hue-rotate(320deg) saturate(1.6) brightness(.85)', mech: 'shield', line: '朕的疆域，由不得你踏足。' }],
    sci: [
      { name: '酸鹼毒蛛', tile: 122, filter: 'hue-rotate(100deg) saturate(2.2)', mech: 'curse', line: 'pH 值 1，嚐嚐腐蝕吧！' },
      { name: '電磁術士', tile: 111, filter: 'hue-rotate(180deg) saturate(2)', mech: 'double', line: '右手定則，雙倍電擊！' },
      { name: '核融合惡魔', tile: 110, filter: 'hue-rotate(20deg) saturate(2.4) brightness(1.1)', mech: 'enrage', line: 'E = mc²，我的怒火無窮無盡！' }]
  };

  /* ---- 試煉等級（深淵遠征難度，累加） ---- */
  const DIFFS = [
    { n: 0, name: '見習', desc: '標準規則' },
    { n: 1, name: '試煉 I', desc: '怪物攻擊力 +15%' },
    { n: 2, name: '試煉 II', desc: '普通怪物生命 +20%' },
    { n: 3, name: '試煉 III', desc: '起始生命 -15，且不帶回復藥' },
    { n: 4, name: '試煉 IV', desc: '篝火休息回復量減半' },
    { n: 5, name: '試煉 V', desc: '首領生命 +25%、攻擊力 +15%' },
    { n: 6, name: '試煉 VI', desc: '行商價格 +30%' },
    { n: 7, name: '試煉 VII', desc: '精英怪生命 +30%、攻擊力 +15%' },
    { n: 8, name: '試煉 VIII', desc: '限時作答：選擇題每題限時（數學 150 秒、其他 75 秒）' },
    { n: 9, name: '試煉 IX', desc: '多選部分正確不再造成擦傷；連擊上限 -2' },
    { n: 10, name: '試煉 X・深淵', desc: '所有首領額外獲得第二種機制' }
  ];

  /* ---- 職業：各自的基礎能力、被動、技能樹；職業等級分開計算 ----
   * 技能 kind：elim 刪選項 / smite 本題傷害倍率 / heal 回復% / freeze 本題答錯不受擊 / nuke 立即傷害(攻擊×val)
   *           shield 護盾(%最大生命) / double 本題答對攻擊兩次 / dodge 本題必定閃避 / rage 本場攻擊+val
   *           leech 本題答對回復傷害 val / half 本題受擊減半
   *           被動(cd 0)：execute 斬殺線 / hunter 殘血必暴擊 / burn 暴擊追加灼燒 / bless 額外復活一次 / fury 低血量增傷 */
  const CLASSES = [
    {
      id: 'knight', name: '騎士', tile: 97, cost: 0, color: '#9fb4d0',
      desc: '攻守平衡的守護者，適合新手。', base: { hp: 70, atk: 10, def: 2, crit: 0.05 },
      passive: '鐵壁：受到的傷害 -10%', apply: p => { p.hurtMul *= 0.9; },
      skills: [
        { id: 'k_insight', name: '洞察', lv: 2, cd: 3, icon: 'question', kind: 'elim', val: 1, desc: '刪去本題 1 個錯誤選項' },
        { id: 'k_smite', name: '蓄力斬', lv: 4, cd: 4, icon: 107, kind: 'smite', val: 2.5, desc: '本題答對時傷害 ×2.5' },
        { id: 'k_holy', name: '聖光', lv: 6, cd: 5, icon: 'fairy', kind: 'heal', val: 0.25, desc: '回復 25% 最大生命' },
        { id: 'k_freeze', name: '不動如山', lv: 8, cd: 6, icon: 102, kind: 'freeze', desc: '本題答錯不會受到反擊' },
        { id: 'k_exec', name: '處決', lv: 10, cd: 0, icon: 105, kind: 'execute', val: 0.25, desc: '被動：怪物生命低於 25%（首領 15%）時，答對直接擊殺' }]
    },
    {
      id: 'mage', name: '法師', tile: 84, cost: 80, color: '#b98bff',
      desc: '脆弱但爆發力驚人，擅長多選與填答題。', base: { hp: 50, atk: 13, def: 0, crit: 0.05 },
      passive: '奧術：多選題與填答題答對傷害 +30%', apply: p => { p.arcane = 0.3; },
      skills: [
        { id: 'm_insight', name: '奧術洞察', lv: 2, cd: 4, icon: 'question', kind: 'elim', val: 2, desc: '刪去本題 2 個錯誤選項' },
        { id: 'm_fire', name: '火球術', lv: 4, cd: 4, icon: 116, kind: 'nuke', val: 1.8, desc: '立即對怪物造成 攻擊力×1.8 的傷害' },
        { id: 'm_shield', name: '魔力護盾', lv: 6, cd: 5, icon: 128, kind: 'shield', val: 0.35, desc: '獲得 35% 最大生命的護盾' },
        { id: 'm_freeze', name: '時間凍結', lv: 8, cd: 6, icon: 7, kind: 'freeze', desc: '本題答錯不會受到反擊' },
        { id: 'm_burn', name: '元素爆發', lv: 10, cd: 0, icon: 'dragon', kind: 'burn', val: 0.6, desc: '被動：暴擊時追加 攻擊力×0.6 的灼燒傷害' }]
    },
    {
      id: 'ranger', name: '遊俠', tile: 88, cost: 90, color: '#62d66e',
      desc: '高暴擊、重連擊，越答越順越強。', base: { hp: 60, atk: 11, def: 0, crit: 0.15 },
      passive: '專注：連擊上限 +3、暴擊率 15% 起跳', apply: p => { p.comboCap += 3; },
      skills: [
        { id: 'r_eye', name: '鷹眼', lv: 2, cd: 3, icon: 'owl', kind: 'elim', val: 1, desc: '刪去本題 1 個錯誤選項' },
        { id: 'r_multi', name: '連射', lv: 4, cd: 4, icon: 103, kind: 'double', desc: '本題答對時攻擊兩次' },
        { id: 'r_aid', name: '急救', lv: 6, cd: 5, icon: 114, kind: 'heal', val: 0.2, desc: '回復 20% 最大生命' },
        { id: 'r_step', name: '疾風步', lv: 8, cd: 5, icon: 'fox', kind: 'dodge', desc: '本題答錯時必定閃避反擊' },
        { id: 'r_hunt', name: '獵殺本能', lv: 10, cd: 0, icon: 106, kind: 'hunter', val: 0.35, desc: '被動：怪物生命低於 35% 時，答對必定暴擊' }]
    },
    {
      id: 'cleric', name: '聖女', tile: 99, cost: 100, color: '#ffd84a',
      desc: '持續回復、容錯率高，適合長篇冒險。', base: { hp: 65, atk: 9, def: 1, crit: 0.05 },
      passive: '祈禱：每次答對回復 2 生命', apply: p => { p.regen += 2; },
      skills: [
        { id: 'c_rev', name: '啟示', lv: 2, cd: 3, icon: 'question', kind: 'elim', val: 1, desc: '刪去本題 1 個錯誤選項' },
        { id: 'c_strike', name: '神聖打擊', lv: 4, cd: 4, icon: 104, kind: 'leech', val: 0.6, desc: '本題答對傷害 ×1.8，並回復傷害的 60%' },
        { id: 'c_heal', name: '大治療術', lv: 6, cd: 5, icon: 'heart', kind: 'heal', val: 0.4, desc: '回復 40% 最大生命' },
        { id: 'c_ward', name: '聖盾', lv: 8, cd: 5, icon: 29, kind: 'freeze', desc: '本題答錯不會受到反擊' },
        { id: 'c_bless', name: '天使祝福', lv: 10, cd: 0, icon: 'fairy', kind: 'bless', desc: '被動：學會時獲得 1 次復活' }]
    },
    {
      id: 'berserker', name: '狂戰士', tile: 87, cost: 120, color: '#ec5454',
      desc: '血量越低越危險，高風險高報酬。', base: { hp: 80, atk: 12, def: 0, crit: 0.05 },
      passive: '血怒：每失去 10% 生命，攻擊 +6%', apply: p => { p.fury = 0.06; },
      skills: [
        { id: 'b_roar', name: '戰吼', lv: 2, cd: 6, icon: 'dragon', kind: 'rage', val: 0.25, desc: '本場戰鬥攻擊力 +25%' },
        { id: 'b_smite', name: '重劈', lv: 4, cd: 4, icon: 118, kind: 'smite', val: 2.5, desc: '本題答對時傷害 ×2.5' },
        { id: 'b_blood', name: '嗜血', lv: 6, cd: 5, icon: 111, kind: 'leech', val: 0.5, mult: 1.3, desc: '本題答對傷害 ×1.3，並回復傷害的 50%' },
        { id: 'b_skin', name: '鐵皮', lv: 8, cd: 4, icon: 119, kind: 'half', desc: '本題受到的反擊減半' },
        { id: 'b_exec', name: '斬首', lv: 10, cd: 0, icon: 117, kind: 'execute', val: 0.3, desc: '被動：怪物生命低於 30%（首領 18%）時，答對直接擊殺' }]
    }
  ];
  const ALL_SKILLS = CLASSES.flatMap(c => c.skills);
  /* 職業等級：以該職業遠征結算獲得的經驗累積，各職業分開 */
  const classNeed = lv => Math.round(300 * Math.pow(lv, 1.4));
  const CLASS_PERKS = [
    { lv: 2, name: '熟練', desc: '起始最大生命 +8', apply: p => { p.maxHp += 8; p.hp += 8; } },
    { lv: 3, name: '行囊整理', desc: '起始金幣 +20', apply: p => { p.gold += 20; } },
    { lv: 5, name: '武藝精進', desc: '起始攻擊力 +2', apply: p => { p.atk += 2; } },
    { lv: 7, name: '天資聰穎', desc: '技能解鎖等級 -1（更早學會技能）', apply: p => { p.skillBonus = (p.skillBonus || 0) + 1; } },
    { lv: 9, name: '強韌體魄', desc: '起始最大生命 +15', apply: p => { p.maxHp += 15; p.hp += 15; } },
    { lv: 12, name: '護身符文', desc: '每場戰鬥開始獲得 6 護盾', apply: p => { p.startShield = (p.startShield || 0) + 6; } },
    { lv: 15, name: '萬全準備', desc: '開局額外攜帶 1 瓶大回復藥', item: 'potion_l' },
    { lv: 18, name: '宗師', desc: '技能解鎖等級再 -1', apply: p => { p.skillBonus = (p.skillBonus || 0) + 1; } },
    { lv: 20, name: '傳奇', desc: '攻擊力 +3、暴擊率 +5%、暴擊傷害 +20%', apply: p => { p.atk += 3; p.crit += 0.05; p.critDmg += 0.2; } }
  ];

  const NODES = {
    battle: { name: '戰鬥', icon: 120 },
    elite: { name: '精英', icon: 109, filter: 'hue-rotate(300deg) saturate(2)' },
    event: { name: '事件', icon: 'question' },
    camp: { name: '篝火', icon: 'campfire' },
    shop: { name: '行商', icon: 86 },
    treasure: { name: '寶箱', icon: 89 },
    boss: { name: '首領', icon: 84 }
  };
  const TALENTS = [
    { id: 't_hp', name: '強健體魄', icon: 'heart', desc: '最大生命 +15，並完全回復', gain: p => { p.maxHp += 15; p.hp = p.maxHp; } },
    { id: 't_atk', name: '鋒利刀刃', icon: 105, desc: '攻擊力 +4', gain: p => { p.atk += 4; } },
    { id: 't_def', name: '堅韌', icon: 102, desc: '防禦力 +2', gain: p => { p.def += 2; } },
    { id: 't_crit', name: '精準', icon: 103, desc: '暴擊率 +8%', gain: p => { p.crit += 0.08; } },
    { id: 't_critd', name: '致命一擊', icon: 107, desc: '暴擊傷害 +50%', gain: p => { p.critDmg += 0.5; } },
    { id: 't_regen', name: '再生', icon: 114, desc: '每次答對額外回復 2 生命', gain: p => { p.regen += 2; } },
    { id: 't_gold', name: '淘金者', icon: 'coin', desc: '金幣獲得 +25%', gain: p => { p.goldMul += 0.25; } },
    { id: 't_combo', name: '專注', icon: '🔥', desc: '連擊上限 +3 層', gain: p => { p.comboCap += 3; } },
    { id: 't_med', name: '冥想', icon: 'fairy', desc: '每次擊敗怪物回復 8% 最大生命', gain: p => { p.killHeal += 0.08; } },
    { id: 't_xp', name: '勤學', icon: 'gem', desc: '經驗值 +25%', gain: p => { p.xpMul += 0.25; } },
    { id: 't_dodge', name: '身輕如燕', icon: 'fox', desc: '閃避率 +6%', gain: p => { p.dodge += 0.06; } }
  ];
  const ITEMS = {
    potion_s: { name: '小回復藥', icon: 115, price: 25, desc: '回復 30% 最大生命', battle: true, map: true },
    potion_l: { name: '大回復藥', icon: 127, price: 50, desc: '回復 65% 最大生命', battle: true, map: true },
    elixir: { name: '力量藥劑', icon: 114, price: 35, desc: '本場戰鬥攻擊力 +50%', battle: true },
    shield: { name: '護盾卷軸', icon: 102, price: 30, desc: '獲得 20 點護盾（吸收傷害）', battle: true },
    elim: { name: '刪去卷軸', icon: 128, price: 30, desc: '刪去本題 2 個錯誤選項（選擇題）', battle: true },
    skip: { name: '換題卷軸', icon: 125, price: 40, desc: '跳過本題，不受懲罰（不計入作答）', battle: true },
    bomb: { name: '火焰炸彈', icon: 116, price: 35, desc: '立即對怪物造成 30 點傷害', battle: true },
    feather: { name: '復活羽毛', icon: 131, price: 90, desc: '放在背包：倒下時自動以 40% 生命復活', battle: false }
  };
  const PETS = [
    { id: 'cat', name: '咪咪', kind: '小貓', sprite: 'cat', cost: 50, starter: true, voice: ['喵～', '喵嗚？', '呼嚕呼嚕…', '喵！（伸懶腰）'], desc: lv => `你答錯時 ${10 + lv * 3}% 機率對怪物撒嬌，讓牠放棄反擊` },
    { id: 'dog', name: '旺旺', kind: '小狗', sprite: 'dog', cost: 50, starter: true, voice: ['汪！', '汪汪！', '（搖尾巴）', '嗚～摸摸～'], desc: lv => `答對時 ${15 + lv * 3}% 機率撲咬，追加 40% 攻擊的傷害` },
    { id: 'rat', name: '小花', kind: '花枝鼠', sprite: 'rat', cost: 50, starter: true, voice: ['吱吱～', '吱？', '（啃啃瓜子）', '吱吱吱！'], desc: lv => `擊敗怪物時 ${12 + lv * 3}% 機率叼回道具；金幣 +${5 + lv * 2}%` },
    { id: 'slime', name: '波波', kind: '史萊姆', sprite: 'slime', cost: 40, voice: ['噗嚕～', '噗嚕噗嚕！', '（彈彈）'], desc: lv => `戰鬥開始時給主人 ${3 + lv * 2} 點護盾` },
    { id: 'luckycat', name: '福福', kind: '招財貓', sprite: 'luckycat', cost: 60, voice: ['招財進寶～', '喵（招手）', '今天會發大財喵！'], desc: lv => `金幣獲得 +${10 + lv * 5}%` },
    { id: 'dragon', name: '烈烈', kind: '火焰幼龍', sprite: 'dragon', cost: 80, voice: ['嗷～', '（噴出小火花）', '嗷嗚！'], desc: lv => `答對時追加 ${2 + lv} 點火焰傷害` },
    { id: 'owl', name: '咕咕', kind: '智慧貓頭鷹', sprite: 'owl', cost: 90, voice: ['咕咕～', '咕？（歪頭）', '讀書要專心咕！'], desc: lv => `出題時 ${15 + lv * 4}% 機率刪去 1 個錯誤選項` },
    { id: 'fairy', name: '芙芙', kind: '治癒精靈', sprite: 'fairy', cost: 110, voice: ['啦啦～♪', '要休息一下嗎？', '（撒下光點）'], desc: lv => `答對時回復 ${1 + Math.floor(lv / 2)} 生命；擊敗怪物回復 ${lv * 2}` },
    { id: 'fox', name: '阿狐', kind: '幽影狐', sprite: 'fox', cost: 120, voice: ['嚶～', '（尾巴蓬起來）', '嘿嘿～'], desc: lv => `${Math.round(8 + lv * 2.5)}% 機率閃避怪物反擊` }
  ];
  /* 寵物造型（換色），每隻寵物各自購買 */
  const PET_SKINS = {
    cat: [{ id: 'black', name: '黑貓', pal: { body: '#5a5266', belly: '#8a8298', accent: '#3a3444', line: '#3a3040', eye: '#ffe99a', mouth: '#e8d8e8', nose: '#ffb3c1' } }, { id: 'white', name: '白貓', pal: { body: '#ffffff', belly: '#fff6f6', accent: '#e8dde8' } }, { id: 'grey', name: '灰虎斑', pal: { body: '#c8ccd8', belly: '#f2f3f7', accent: '#9aa0b0' } }, { id: 'peach', name: '蜜桃粉', pal: { body: '#ffd0de', belly: '#fff4f8', accent: '#ff9fbf' } }],
    dog: [{ id: 'choco', name: '巧克力', pal: { body: '#f3dcc0', ear: '#8a5a34' } }, { id: 'panda', name: '黑白花', pal: { ear: '#4a4252' } }, { id: 'husky', name: '哈士奇', pal: { body: '#f4f6fa', ear: '#8e97a8' } }, { id: 'sakura', name: '櫻花粉', pal: { body: '#fff0f5', ear: '#ffb3cb', accent: '#8fd3ff' } }],
    rat: [{ id: 'white', name: '全白', pal: { hood: '#f4f5fa', ear: '#f4f4f8' } }, { id: 'milktea', name: '奶茶色', pal: { hood: '#dcb890', body: '#fbf1e4', ear: '#f0dcc4' } }, { id: 'black', name: '黑頭巾', pal: { hood: '#5e5868', ear: '#8a8494' } }, { id: 'lilac', name: '薰衣草', pal: { hood: '#cdb8ec', body: '#f8f4ff', ear: '#e8def8' } }],
    slime: [{ id: 'berry', name: '草莓', pal: { body: '#ffb3cf', line: '#b0607f' } }, { id: 'matcha', name: '抹茶', pal: { body: '#b4e89a', line: '#5a8a4a' } }, { id: 'grape', name: '葡萄', pal: { body: '#cdb0ff', line: '#7a5ab0' } }, { id: 'gold', name: '黃金', pal: { body: '#ffe27a', line: '#b08a2a' } }],
    luckycat: [{ id: 'gold', name: '金招財', pal: { body: '#ffe9a0', accent: '#f0b040' } }, { id: 'black', name: '黑招財', pal: { body: '#5a5266', accent: '#3a3444', line: '#3a3040', eye: '#ffe99a', mouth: '#e8d8e8', nose: '#ffb3c1' } }],
    dragon: [{ id: 'red', name: '赤龍', pal: { body: '#ffaaa0', wing: '#e0706a', line: '#a0504a' } }, { id: 'blue', name: '蒼龍', pal: { body: '#a8d8ff', wing: '#6aa8e0', line: '#4a70a0' } }, { id: 'gold', name: '金龍', pal: { body: '#ffe27a', wing: '#e0b040', line: '#a08030' } }],
    owl: [{ id: 'snow', name: '雪鴞', pal: { body: '#f4f4f8', wing: '#d6d8e2', belly: '#ffffff', line: '#8a8a9a' } }, { id: 'night', name: '夜梟', pal: { body: '#6a5a7a', wing: '#4a3e5a', belly: '#8a7a9a', face: '#e8e0f0', line: '#3a2e4a', eye: '#ffe99a', mouth: '#e8d8e8', nose: '#ffb3c1' } }],
    fairy: [{ id: 'mint', name: '薄荷', pal: { body: '#e0fff0', petal: '#8ee0c0', wing: '#e6fff4' } }, { id: 'night', name: '星夜', pal: { body: '#e0e4ff', petal: '#8a9aff', wing: '#c8d0ff' } }],
    fox: [{ id: 'snow', name: '雪狐', pal: { body: '#f4f7ff', belly: '#ffffff', tip: '#9aa0c0', line: '#7a809a' } }, { id: 'shadow', name: '玄狐', pal: { body: '#6a5a6a', belly: '#b0a0b0', tip: '#2e262e', line: '#3a2e3a', eye: '#ffe99a', mouth: '#e8d8e8', nose: '#ffb3c1' } }]
  };
  const SKIN_COST = 40;
  /* 配件：買一次所有寵物都能戴 */
  const PET_ACCS = [
    { id: 'bow', name: '粉紅蝴蝶結', cost: 30 }, { id: 'flower', name: '小花髮飾', cost: 30 }, { id: 'scarf', name: '紅圍巾', cost: 40 },
    { id: 'straw', name: '小草帽', cost: 50 }, { id: 'party', name: '派對帽', cost: 50 }, { id: 'wizard', name: '魔法師帽', cost: 70 },
    { id: 'crown', name: '小皇冠', cost: 90 }, { id: 'halo', name: '天使光環', cost: 90 },
    { id: 'set_wizard', name: '魔法師套裝', cost: 150, set: 1 }, { id: 'set_knight', name: '小騎士套裝', cost: 150, set: 1 }, { id: 'set_princess', name: '公主套裝', cost: 160, set: 1 },
    { id: 'set_scholar', name: '學霸套裝', cost: 120, set: 1 }, { id: 'set_fisher', name: '釣魚套裝', cost: 120, set: 1 }, { id: 'set_chef', name: '小廚師套裝', cost: 120, set: 1 }
  ];
  const PET_MAX = 10;
  const petNeed = lv => 8 + lv * 6; // 升到下一級所需經驗

  const UPGRADES = [
    { id: 'hp', name: '生命之源', icon: 'heart', desc: '起始最大生命 +8', max: 10, cost: l => 20 + l * 15 },
    { id: 'atk', name: '戰鬥訓練', icon: 105, desc: '起始攻擊力 +1', max: 10, cost: l => 25 + l * 20 },
    { id: 'def', name: '鐵壁', icon: 102, desc: '起始防禦力 +1', max: 5, cost: l => 30 + l * 25 },
    { id: 'crit', name: '精準直覺', icon: 103, desc: '暴擊率 +2%', max: 5, cost: l => 30 + l * 20 },
    { id: 'gold', name: '起始資金', icon: 'coin', desc: '起始金幣 +15', max: 5, cost: l => 15 + l * 10 },
    { id: 'gem', name: '靈魂共鳴', icon: 'gem', desc: '結算魂晶 +10%', max: 5, cost: l => 40 + l * 30 },
    { id: 'bag', name: '冒險行囊', icon: 115, desc: '起始多帶 1 瓶小回復藥', max: 3, cost: l => 40 + l * 40 },
    { id: 'will', name: '不屈意志', icon: 131, desc: '每次遠征可復活 1 次', max: 1, cost: () => 200 },
    { id: 'legacy', name: '傳承', icon: 89, desc: '遠征開始時獲得 1 個隨機遺物', max: 1, cost: () => 160 },
    { id: 'petxp', name: '寵物零食', icon: 'slime', desc: '寵物經驗 +25%', max: 4, cost: l => 30 + l * 25 }
  ];

  /* ---- 隨機事件：choices 回傳訊息（字串） ---- */
  const EVENTS = [
    {
      id: 'spring', title: '神秘泉水', icon: 'fairy', text: '石縫中湧出閃著微光的泉水，旁邊刻著「智者飲之，愚者嘗之」。',
      choices: [
        { label: '喝一口', run: R => { if (U.chance(0.7)) { const v = Math.round(R.p.maxHp * 0.4); R.heal(v); return `泉水甘甜，回復 ${v} 生命！`; } R.damage(8, true); return '好苦！受到 8 點傷害。'; } },
        { label: '裝一瓶帶走', run: R => { R.addItem('potion_s'); return '獲得「小回復藥」。'; } }
      ]
    },
    {
      id: 'chest', title: '上鎖的寶箱', icon: 89, text: '角落擺著一只沉甸甸的寶箱，鎖孔有點鬆動。',
      choices: [
        { label: '撬開它', run: R => { if (U.chance(0.25)) { R.s.pendingMimic = true; return '寶箱張開血盆大口——是寶箱怪！'; } const r = R.randomRelic(); if (r) { R.addRelic(r.id); return `寶箱裡躺著一件遺物——獲得「${r.name}」！`; } R.addItem('potion_l'); return '寶箱裡只剩一瓶大回復藥。'; } },
        { label: '離開', run: () => '你決定不冒險。' }
      ]
    },
    {
      id: 'scholar', title: '迷路的學者', icon: 84, text: '一位老學者攔住你：「年輕人，答對我的問題，我就把珍藏送你。」',
      choices: [
        { label: '接受考驗（額外一題）', run: R => { R.s.pendingQuiz = 'scholar'; return '學者翻開一本泛黃的考卷……'; } },
        { label: '婉拒', run: () => '學者嘆了口氣，消失在書架之間。' }
      ]
    },
    {
      id: 'altar', title: '血之祭壇', icon: 65, text: '祭壇上刻著古老的文字：「以血為祭，換取力量。」',
      choices: [
        { label: '獻祭 15% 生命換遺物', run: R => { R.damage(Math.round(R.p.maxHp * 0.15), true); const r = R.randomRelic(); if (r) { R.addRelic(r.id); return `獲得遺物「${r.name}」！`; } R.p.atk += 3; return '力量湧入體內，攻擊 +3。'; } },
        { label: '不理會', run: () => '你繞過了祭壇。' }
      ]
    },
    {
      id: 'gambler', title: '骰子賭徒', icon: 112, text: '戴兜帽的賭徒搖著骰子：「押 20 金幣，擲出 4 以上就翻倍！」',
      choices: [
        { label: '押 20 金幣', cond: R => R.p.gold >= 20, run: R => { const d = U.rnd(1, 6); if (d >= 4) { R.p.gold += 20; return `擲出 ${d}！贏得 20 金幣。`; } R.p.gold -= 20; return `擲出 ${d}……輸掉 20 金幣。`; } },
        { label: '走開', run: () => '賭徒聳聳肩。' }
      ]
    },
    {
      id: 'shrine', title: '學問神龕', icon: 7, text: '神龕上擺著一本發光的筆記，封面寫著「錯題是最好的老師」。',
      choices: [
        { label: '研讀筆記', run: R => { R.gainXp(40); return '獲得 40 經驗值！'; } },
        { label: '祈禱', run: R => { R.p.crit += 0.05; return '直覺變得敏銳，暴擊率 +5%。'; } }
      ]
    },
    {
      id: 'blacksmith', title: '流浪鐵匠', icon: 86, text: '鐵匠敲著鐵砧：「30 金幣，幫你把武器磨得更利。」',
      choices: [
        { label: '付 30 金幣（攻擊 +3）', cond: R => R.p.gold >= 30, run: R => { R.p.gold -= 30; R.p.atk += 3; return '武器閃閃發光，攻擊 +3！'; } },
        { label: '付 30 金幣（防禦 +2）', cond: R => R.p.gold >= 30, run: R => { R.p.gold -= 30; R.p.def += 2; return '護甲更堅固了，防禦 +2！'; } },
        { label: '離開', run: () => '鐵匠繼續打鐵。' }
      ]
    },
    {
      id: 'lost_pet', title: '受傷的小動物', icon: 'fox', text: '一隻小動物縮在角落發抖，腳上有傷。',
      choices: [
        { label: '用藥水幫牠治療', cond: R => R.hasItem('potion_s'), run: R => { R.useItemRaw('potion_s'); R.petXp(12); R.gainGold(20, true); return '小動物舔了舔你的手，留下 20 金幣就跑了。寵物也感到開心（寵物經驗 +12）。'; } },
        { label: '輕輕摸摸牠', run: R => { R.heal(6); return '心情平靜下來，回復 6 生命。'; } }
      ]
    },
    {
      id: 'trap', title: '機關走廊', icon: 62, text: '地板上佈滿可疑的壓力板。',
      choices: [
        { label: '小心通過', run: R => { if (U.chance(0.6)) return '你成功避開所有機關！'; R.damage(10, true); return '踩到機關，受到 10 點傷害。'; } },
        { label: '衝過去', run: R => { R.damage(5, true); const g = R.gainGold(15, true); return `被刺了一下（-5 生命），但撿到 ${g} 金幣。`; } }
      ]
    }
  ];

  function relic(id) { return RELICS.find(r => r.id === id); }
  function talent(id) { return TALENTS.find(r => r.id === id); }
  function pet(id) { return PETS.find(r => r.id === id); }
  function skill(id) { return ALL_SKILLS.find(r => r.id === id); }
  function cls(id) { return CLASSES.find(r => r.id === id) || CLASSES[0]; }
  /* 某科目的首領池：mix 主題每次隨機挑一個主題 */
  const bossTheme = subj => { const t = themeOf(subj); return t === 'mix' ? THEME_KEYS[Math.floor(Math.random() * THEME_KEYS.length)] : t; };
  const monPrefix = subj => { const S = SUBJECTS[subj]; return (S && S.words && S.words.length) ? S.words : PREFIX[themeOf(subj)] || PREFIX.mix; };
  return { addSubject, THEMES, THEME_KEYS, themeOf, bossTheme, monPrefix, SUBJECTS, PREFIX, MONSTERS, BOSSES, VARIANT, RELICS, TALENTS, ITEMS, PETS, PET_MAX, petNeed, UPGRADES, EVENTS, MECHS, TRAITS, ELITE_AFFIX, BOSS_DEFS, DIFFS, CLASSES, ALL_SKILLS, PET_SKINS, SKIN_COST, PET_ACCS, CLASS_PERKS, classNeed, NODES, relic, talent, pet, skill, cls };
})();
