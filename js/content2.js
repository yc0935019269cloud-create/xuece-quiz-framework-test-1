/* 內容擴充包（第 8 版）：新怪物與像素圖、新特性、新首領機制、每章兩位候選首領、隱藏首領、
 * 新隨機事件（含稀有／條件事件）、隱藏遺物、隱藏配件、成就。
 * 載入順序：content.js 之後（直接擴充 C、SP.MAPS、PetArt.ACC）。 */
(() => {
  /* ---------- 新怪物像素圖（12×12，第二格動畫自動產生「呼吸」效果） ---------- */
  const ART = {
    ink: [
      '............', '....kkkk....', '...kSSSSk...', '..kSsSSSSk..', '..kSSSSSSk..', '.kSwwSSwwSk.',
      '.kSwkSSwkSk.', '.kSSSSSSSSk.', '.kSSSkkSSSk.', '.kSSSSSSSSk.', '.kSSkSSkSSk.', '..kk.kk.kk..'],
    bee: [
      '............', '.kkk....kkk.', 'kcwck..kcwck', 'kccckkkkccck', '.kkkyyyykkk.', '..kykyykyk..',
      '..kyyyyyyk..', '..kkkkkkkk..', '..kyyyyyyk..', '...kkkkkk...', '....kYYk....', '.....kk.....'],
    jelly: [
      '............', '...kkkkkk...', '..kppppppk..', '.kpwwppppPk.', '.kpwppppppk.', '.kpkppppkpk.',
      '.kPPPPPPPPk.', '..kkkkkkkk..', '..kp.kp.kp..', '...p..p..p..', '..p..p..p...', '............'],
    candle: [
      '.....oo.....', '....oyyo....', '....oyho....', '.....oo.....', '.....kk.....', '..kkkkkkkk..',
      '..kllllllk..', '..klkllklk..', '..kllllllk..', '..kllRRllk..', '.kkllllllkk.', '.kkkkkkkkkk.'],
    pumpkin: [
      '.....GG.....', '....GG......', '..kkkkkkkk..', '.koOooOoOok.', 'koooooooooOk', 'koyyoooyyook',
      'kooyooooyook', 'kooooooooook', 'koyykyykyyok', 'kOooyyyyooOk', '.kOOOOOOOOk.', '..kkkkkkkk..'],
    crystal: [
      '.....kk.....', '....kcck....', '...kcwcCk...', '..kcwccCCk..', '.kcwcccCCCk.', 'kcckccckCCCk',
      'kcccccccCCCk', '.kCccccCCCk.', '..kCcccCCk..', '...kCCCCk...', '....kCCk....', '.....kk.....'],
    imp: [
      '.k........k.', '.kk......kk.', '..kRkkkkRk..', '..krrrrrrk..', '.krrrrrrrrk.', '.krwkrrwkrk.',
      'kkrrrrrrrrkk', 'kVkrrkkrrkVk', 'kVVkrrrrkVVk', '.kk.krrk.kk.', '....kRRk....', '...kk..kk...'],
    worm: [
      '............', '............', '......kkkkk.', '.....kgggggk', '.....kgwgwgk', '.....kgkgkgk',
      '..kkkkGgggk.', '.kggkgGGgk..', 'kgggkgggk...', 'kGGGkGGGk...', '.kkk.kkk....', '............'],
    frog: [
      '............', '..kkk..kkk..', '.kwwwkkwwwk.', '.kwkwkkwkwk.', 'kggggggggggk', 'kgggvgggvggk',
      'kgRRRRRRRRgk', 'kggggggggggk', '.kgvggggvgk.', 'kkggkkkkggkk', 'kGGk....kGGk', 'kkkk....kkkk'],
    bombling: [
      '........yo..', '.......kf...', '......kk....', '...kkkkk....', '..kSSSSSkk..', '.kSsSSSSSSk.',
      '.kswkSSwkSk.', '.kSSSSSSSSk.', '.kSSSkkSSSk.', '..kSSSSSSk..', '...kkkkkk...', '............'],
    moth: [
      '...k....k...', '....k..k....', 'kkk..kk..kkk', 'kvvkknnkkvvk', 'kvwvknnkvwvk', 'kvvvknnkvvvk',
      '.kvVknnkVvk.', '.kVvknnkvVk.', '..kkknnkkk..', '....knnk....', '.....kk.....', '............'],
    clock: [
      '..kk....kk..', '.kyyk..kyyk.', '..kkkkkkkk..', '.kYyyyyyyYk.', 'kYwwwkwwwwYk', 'kywwwkwwwwyk',
      'kywwwkkkwwyk', 'kywwwwwwwwyk', 'kYwwwwwwwwYk', '.kYyyyyyyYk.', '..kkkkkkkk..', '..kk....kk..'],
    /* ---- 營地與收藏用小圖 ---- */
    mailbox: [
      '............', '...kkkkkk...', '..kbbbbbbk..', '.kbBBBBBBbk.', '.kbwwwwwwbkr', '.kbBBBBBBbkR',
      '.kbbbbbbbbk.', '..kkkkkkkk..', '.....kk.....', '.....nk.....', '.....nk.....', '....kNNk....'],
    fish: [
      '............', '............', '............', '....kkkk....', '.k.kbbbbk...', 'kbkbbbwkbk..',
      'kbbbbbbkbbk.', 'kbkbbbbbbk..', '.k.kBBBBk...', '....kkkk....', '............', '............'],
    boot: [
      '............', '...kkkk.....', '...knnk.....', '...knnk.....', '...knnk.....', '...knnkkkk..',
      '...knnnnnnk.', '..kNnnnnnnk.', '..kNNNNNNNk.', '..kkkkkkkkk.', '............', '............'],
    crab2: [
      '............', '.kk......kk.', 'krrk....krrk', '.krk....krk.', '..krkkkkrk..', '.krrrrrrrrk.',
      'krwkrrrrwkrk', 'krrrrrrrrrrk', '.kRRRRRRRRk.', '.k.k.kk.k.k.', '............', '............'],
    rabbit: [
      '...kk..kk...', '...kwk.kwk..', '...kpk.kpk..', '...kwkkkwk..', '..kwwwwwwk..', '..kwkwwkwk..',
      '..kwwppwwk..', '...kwwwwk...', '..kwwwwwwk..', '..kwwwwwwk..', '...kk..kk...', '............']
  };
  // 第二格：刪掉中間一列、頂端補空白 → 身體微微壓扁再彈起
  Object.entries(ART).forEach(([k, rows]) => {
    const f2 = ['............'].concat(rows.slice(0, 5), rows.slice(6));
    SP.MAPS[k] = [rows, f2];
  });

  /* ---------- 新怪物特性 ---------- */
  Object.assign(C.TRAITS, {
    chill: { name: '冰霜', desc: '你答錯時被凍傷，下一次攻擊傷害 -30%' },
    thorny: { name: '尖刺', desc: '你每次攻擊命中都會被刺傷（1 點＋深度加成）' },
    greed: { name: '貪婪', desc: '身上藏著大量金幣：擊敗時金幣 ×2' },
    flee: { name: '逃跑', desc: '第 5 題結束時還沒被打倒就會逃走（沒有獎勵）' },
    scorch: { name: '灼燒', desc: '你答錯時著火 2 題，每題扣較多生命' },
    bloat: { name: '膨脹', desc: '每 2 題攻擊力 +10%（累積）' },
    swarm: { name: '群襲', desc: '反擊時分成兩下（各 60%），護盾與閃避要分別判定' },
    hex: { name: '厄運', desc: '本場戰鬥你的暴擊率 -10%' },
    explode: { name: '自爆', desc: '生命低於 25% 時點燃引信；下一題還沒倒下就自爆（攻擊力 ×1.5 的傷害）' },
    guard: { name: '格擋', desc: '每 3 題舉盾一次，完全擋下你的下一次攻擊' },
    rot: { name: '腐蝕', desc: '你答錯時本場防禦力 -1' },
    split: { name: '分裂', desc: '生命第一次低於 50% 時分裂，回復 20% 生命' },
    mirror: { name: '鏡面', desc: '你暴擊時反彈 30% 傷害給你' },
    siphon: { name: '汲取', desc: '你答錯時偷走 1 點攻擊力（牠 +1、你 -1）' }
  });
  C.ELITE_AFFIX.push('chill', 'thorny', 'scorch', 'bloat', 'hex', 'guard', 'rot', 'split', 'mirror', 'swarm', 'm:summon', 'm:phase', 'm:fortify', 'm:miasma');

  /* ---------- 新怪物（48 種，另有隱藏的黃金史萊姆） ---------- */
  C.MONSTERS.push(
    // 淺層
    { id: 'inkblot', name: '墨汁怪', tile: 'ink', hp: 0.9, atk: 0.85, tier: 0, traits: ['chill'], desc: '被牠的墨汁潑到，手會凍得握不住筆。' },
    { id: 'bee', name: '考卷毒蜂', tile: 'bee', hp: 0.75, atk: 0.9, tier: 0, traits: ['thorny'], desc: '每打牠一下都會被螫一下。' },
    { id: 'goblin', name: '金幣哥布林', tile: 86, filter: 'hue-rotate(70deg) saturate(1.6)', hp: 0.8, atk: 0.8, tier: 0, traits: ['greed', 'flee'], desc: '揹著一大袋金幣，打不贏就跑。' },
    { id: 'candle', name: '燭火妖', tile: 'candle', hp: 0.85, atk: 0.9, tier: 0, traits: ['scorch'], desc: '熬夜讀書的蠟燭成了精，火苗很燙。' },
    { id: 'worm', name: '書蟲', tile: 'worm', hp: 0.95, atk: 0.75, tier: 0, traits: ['bloat'], desc: '越啃越胖，拖久了會變很兇。' },
    // 中層
    { id: 'jelly', name: '夢遊水母', tile: 'jelly', hp: 0.9, atk: 1.0, tier: 1, traits: ['swarm'], desc: '好幾條觸手一起甩過來。' },
    { id: 'frog', name: '厄運毒蛙', tile: 'frog', hp: 0.95, atk: 1.0, tier: 1, traits: ['poison', 'hex'], desc: '被牠盯上，運氣和身體都會變差。' },
    { id: 'pumpkin', name: '南瓜爆彈', tile: 'pumpkin', hp: 1.0, atk: 1.0, tier: 1, traits: ['explode'], desc: '快倒下時會點燃引信，務必一口氣打倒！' },
    { id: 'icebat', name: '冰晶蝙蝠', tile: 120, filter: 'hue-rotate(180deg) saturate(1.8) brightness(1.1)', hp: 0.8, atk: 1.15, tier: 1, traits: ['chill', 'swift'], desc: '冷冽的翅膀讓你的手腳發僵。' },
    { id: 'sandcrab', name: '沙丘蟹', tile: 110, filter: 'sepia(1) saturate(1.4) brightness(.95)', hp: 1.15, atk: 0.95, tier: 1, traits: ['guard'], desc: '會舉起大鉗子擋住攻擊。' },
    { id: 'moth', name: '幻蛾', tile: 'moth', hp: 0.85, atk: 1.05, tier: 1, traits: ['dodge', 'rot'], desc: '鱗粉會腐蝕你的護甲。' },
    // 深層
    { id: 'crystal', name: '水晶魔', tile: 'crystal', hp: 1.2, atk: 1.05, tier: 2, traits: ['mirror', 'armor'], desc: '光滑的晶面會把暴擊反彈回來。' },
    { id: 'imp', name: '火焰小惡魔', tile: 'imp', hp: 0.9, atk: 1.3, tier: 2, traits: ['scorch', 'swift'], desc: '又快又燙的搗蛋鬼。' },
    { id: 'bombling', name: '炸彈怪', tile: 'bombling', hp: 1.3, atk: 1.05, tier: 2, traits: ['explode', 'thick'], desc: '肉很厚，快倒時會自爆。' },
    { id: 'shade', name: '影刺客', tile: 88, filter: 'brightness(.45) saturate(.4) hue-rotate(220deg)', hp: 0.9, atk: 1.35, tier: 2, traits: ['hex', 'swift'], desc: '從陰影中出手，讓你的招式失準。' },
    { id: 'witch', name: '墮落魔女', tile: 99, filter: 'hue-rotate(250deg) saturate(1.6) brightness(.8)', hp: 1.0, atk: 1.2, tier: 2, traits: ['siphon', 'silence'], desc: '一點一點偷走你的力量。' },
    { id: 'clock', name: '監考時鐘', tile: 'clock', hp: 1.1, atk: 1.1, tier: 2, traits: ['bloat'], mechs: ['haste'], desc: '滴答滴答……選擇題要在時限內作答！' },
    // 深淵
    { id: 'vampire', name: '吸血伯爵', tile: 100, filter: 'hue-rotate(300deg) saturate(2) brightness(.7)', hp: 1.2, atk: 1.3, tier: 3, traits: ['drain', 'siphon'], desc: '吸血又吸力量的貴族。' },
    { id: 'viking', name: '狂戰亡魂', tile: 87, filter: 'grayscale(.6) hue-rotate(180deg) brightness(.75)', hp: 1.3, atk: 1.25, tier: 3, traits: ['frenzy', 'bloat'], desc: '戰意永不熄滅，越拖越可怕。' },
    { id: 'plague', name: '瘟疫術士', tile: 111, filter: 'hue-rotate(100deg) saturate(1.6) brightness(.8)', hp: 1.15, atk: 1.2, tier: 3, traits: ['poison', 'rot', 'heal'], desc: '毒霧、腐蝕加上自我治療。' },
    { id: 'sporeking', name: '巨孢菇王', tile: 'mushroom', filter: 'hue-rotate(250deg) saturate(1.5)', hp: 1.45, atk: 1.1, tier: 3, traits: ['split', 'poison'], desc: '被打到一半會分裂再生。' },
    { id: 'hive', name: '蜂后', tile: 'bee', filter: 'hue-rotate(300deg) saturate(1.8)', hp: 1.25, atk: 1.2, tier: 3, traits: ['swarm', 'thorny'], desc: '一整群毒蜂圍著你打。' },
    // 深淵最深處（第 3 章後段）
    { id: 'voideye', name: '虛空之眼', tile: 'eye', filter: 'hue-rotate(250deg) saturate(2) brightness(.8)', hp: 1.35, atk: 1.35, tier: 4, traits: ['weaken', 'hex', 'mirror'], desc: '凝視深淵，深淵也在凝視你。' },
    { id: 'bonelord', name: '骸骨法王', tile: 'skull', filter: 'sepia(.8) hue-rotate(250deg) saturate(2)', hp: 1.3, atk: 1.4, tier: 4, traits: ['undying', 'silence', 'charge'], desc: '不死、封印、蓄力，三重威脅。' },
    { id: 'abyssknight', name: '深淵騎士', tile: 96, filter: 'hue-rotate(200deg) saturate(2) brightness(.5)', hp: 1.6, atk: 1.3, tier: 4, traits: ['armor', 'frenzy', 'charge'], desc: '厚甲加上狂暴蓄力的重擊。' },
    { id: 'crystalgolem', name: '晶化巨像', tile: 109, filter: 'hue-rotate(160deg) saturate(2.5)', hp: 1.8, atk: 1.15, tier: 4, traits: ['mirror', 'stoneskin', 'heal'], desc: '堅硬、反射又會再生的巨像。' },
    { id: 'inkdragon', name: '墨龍幼體', tile: 'ink', filter: 'hue-rotate(260deg) saturate(3) brightness(.8)', hp: 1.4, atk: 1.45, tier: 4, traits: ['swarm', 'scorch', 'spite'], desc: '墨焰噴吐，死前還會詛咒你。' },
    // 隱藏：黃金史萊姆（普通戰鬥 3% 機率出現）
    { id: 'goldslime', name: '黃金史萊姆', tile: 108, filter: 'sepia(1) saturate(5) hue-rotate(5deg) brightness(1.25)', hp: 0.7, atk: 0.5, tier: 9, secret: true, traits: ['greed', 'flee', 'dodge'], desc: '傳說中的幸運怪物，擊敗可得大量金幣與魂晶，但牠很快就會逃走！' }
  );

  /* ---------- 新首領機制 ---------- */
  Object.assign(C.MECHS, {
    summon: { name: '召喚', desc: '每 4 題召喚僕從，接下來 2 次攻擊只造成一半傷害' },
    phase: { name: '二階段', desc: '生命第一次低於 50% 時進入第二階段：回復 15% 生命、攻擊 +25%' },
    fortify: { name: '堅守', desc: '你的連擊未滿 3 時，對它的傷害 -30%' },
    miasma: { name: '瘴氣', desc: '每一題（不論對錯）你都受到少量毒傷' },
    seal: { name: '封咒', desc: '你答錯時，所有技能冷卻 +2' },
    countdown: { name: '審判', desc: '每 6 題施放審判，造成你 20% 最大生命的傷害' },
    reflect: { name: '反射', desc: '你暴擊時反彈 25% 傷害給你' }
  });

  /* ---------- 各科首領：每章兩位候選，隨機登場 ---------- */
  Object.values(C.BOSS_DEFS).forEach(arr => arr.forEach((b, i) => { b.act = i + 1; }));
  const NB = {
    lit: [
      { act: 1, name: '成語變臉妖蛾', tile: 'moth', filter: 'hue-rotate(40deg) saturate(1.5)', mech: 'reflect', line: '畫蛇添足？還是畫龍點睛？' },
      { act: 2, name: '墨龍・書法宗師', tile: 'ink', filter: 'hue-rotate(20deg) saturate(2)', mech: 'miasma', line: '一筆一劃，皆是殺招。' },
      { act: 3, name: '科舉判官', tile: 100, filter: 'hue-rotate(180deg) saturate(1.5) brightness(.8)', mech: 'countdown', line: '金榜題名，或名落孫山。' }],
    lang: [
      { act: 1, name: '拼字女王蜂', tile: 'bee', filter: 'hue-rotate(260deg) saturate(1.5)', mech: 'summon', line: 'B-E-E! Spell it right or feel my sting!' },
      { act: 2, name: '時態鐘塔守衛', tile: 'clock', filter: 'hue-rotate(200deg)', mech: 'fortify', line: 'Past, present, future — all belong to me.' },
      { act: 3, name: '長篇閱讀巨龍', tile: 'dragon', filter: 'hue-rotate(200deg) saturate(1.8) brightness(.8)', mech: 'phase', line: 'Read carefully... every paragraph is a trap.' }],
    math: [
      { act: 1, name: '機率骰子惡魔', tile: 'imp', filter: 'hue-rotate(250deg)', mech: 'seal', line: '連擲三次六點的機率？對你來說是零。' },
      { act: 2, name: '向量水晶巨像', tile: 'crystal', filter: 'hue-rotate(60deg) saturate(1.5)', mech: 'reflect', line: '方向與大小，缺一不可！' },
      { act: 3, name: '無窮級數之眼', tile: 'eye', filter: 'hue-rotate(260deg) saturate(2)', mech: 'countdown', line: '收斂還是發散？你的生命即將收斂。' }],
    calc: [
      { act: 1, name: '利滾利蟾蜍', tile: 'frog', filter: 'hue-rotate(40deg) saturate(1.6)', mech: 'miasma', line: '呱！利滾利，毒滾毒！' },
      { act: 2, name: '數列燭台妖', tile: 'candle', filter: 'hue-rotate(260deg) saturate(1.5)', mech: 'phase', line: '下一項是什麼？是你的終點！' },
      { act: 3, name: '迴歸線巨像', tile: 109, filter: 'hue-rotate(300deg) saturate(1.5) brightness(.8)', mech: 'fortify', line: '誤差平方和最小化——包括你。' }],
    hist: [
      { act: 1, name: '南瓜地主', tile: 'pumpkin', filter: 'saturate(1.3)', mech: 'summon', line: '這片土地的地租，你付得起嗎？' },
      { act: 2, name: '鐵幕騎士', tile: 96, filter: 'grayscale(1) brightness(.6)', mech: 'fortify', line: '鐵幕之後，寸步難行。' },
      { act: 3, name: '大航海幽靈船長', tile: 121, filter: 'hue-rotate(160deg) saturate(2) brightness(.8)', mech: 'seal', line: '季風一起，萬帆齊發！' }],
    sci: [
      { act: 1, name: '細胞分裂史萊姆', tile: 108, filter: 'hue-rotate(80deg) saturate(2)', mech: 'phase', line: '有絲分裂，無限增生！' },
      { act: 2, name: '板塊巨蟹', tile: 110, filter: 'sepia(.8) saturate(1.5) brightness(.8)', mech: 'miasma', line: '隱沒帶的岩漿，吞噬一切！' },
      { act: 3, name: '黑洞魔導師', tile: 111, filter: 'hue-rotate(250deg) brightness(.5) saturate(2)', mech: 'reflect', line: '連光都逃不出我的引力。' }]
  };
  Object.entries(NB).forEach(([k, arr]) => C.BOSS_DEFS[k].push(...arr));
  /* 隱藏首領：深淵第 3 章首領倒下後，若本局命中率 ≥ 80%，會出現裂縫 */
  C.SECRET_BOSS = { name: '命題委員・幻影', tile: 84, filter: 'grayscale(1) brightness(1.5) drop-shadow(0 0 6px #b8a0ff)', mechs: ['phase', 'countdown', 'enrage'], hp: 480, atk: 36, line: '這一題……是你從沒見過的題目。' };

  /* ---------- 隱藏遺物（只能從特殊事件取得，不會出現在圖鑑商店） ---------- */
  C.RELICS.push(
    { id: 'yuzucharm', name: '柚子護符', icon: '🍊', rar: 3, secret: true, desc: '最大生命 +15；每次答對回復 1 生命', gain: p => { p.maxHp += 15; p.hp += 15; p.regen += 1; } },
    { id: 'koiscale', name: '錦鯉之鱗', icon: '🐟', rar: 3, secret: true, desc: '暴擊率 +8%，金幣 +15%', gain: p => { p.crit += 0.08; p.goldMul += 0.15; } },
    { id: 'teacup', name: '貓咪茶杯', icon: '🍵', rar: 3, secret: true, desc: '每場戰鬥開始獲得 8 護盾，最大生命 +10', gain: p => { p.maxHp += 10; p.hp += 10; p.startShield = (p.startShield || 0) + 8; } },
    { id: 'nightowl', name: '深夜咖啡杯', icon: '☕', rar: 2, secret: true, desc: '經驗值 +20%，暴擊率 +3%', gain: p => { p.xpMul += 0.2; p.crit += 0.03; } }
  );

  /* ---------- 隱藏配件（不能購買，靠隱藏要素解鎖） ---------- */
  Object.assign(PetArt.ACC, {
    heartclip: { pal: { a: '#ff6b9a', b: '#ffc2d6' }, head: [{ e: [6.2, 3.6, 1.1, 1.1], c: 'a' }, { e: [8.2, 3.6, 1.1, 1.1], c: 'a' }, { p: [[5.2, 3.9], [9.2, 3.9], [7.2, 6.4]], c: 'a' }, { px: [[6, 3]], c: 'b' }] },
    laurel: { pal: { a: '#7fd06a', b: '#4f9a4a', c: '#ffd84a' }, head: [{ e: [13.5, 4.6, 7.4, 1.9], c: 'a' }, { e: [13.5, 4.6, 5.6, 1], c: null }, { px: [[7, 4], [9, 3], [18, 3], [20, 4]], c: 'b' }, { px: [[13, 2], [14, 2]], c: 'c' }] },
    yuzuhat: { pal: { a: '#ffcf3a', b: '#6fcf6a', c: '#f0a020' }, head: [{ e: [13.5, 2.8, 4.2, 3.2], c: 'a' }, { px: [[15, 1], [12, 3]], c: 'c' }, { p: [[13.5, -0.4], [17.5, -1.8], [16, 0.9]], c: 'b' }] },
    moonears: { pal: { a: '#ffffff', b: '#ffb3c7' }, head: [{ e: [10.2, 0.6, 1.7, 4.6], c: 'a' }, { e: [16.8, 0.6, 1.7, 4.6], c: 'a' }, { e: [10.2, 0.9, 0.7, 3.2], c: 'b' }, { e: [16.8, 0.9, 0.7, 3.2], c: 'b' }] }
  });
  C.PET_ACCS.push(
    { id: 'heartclip', name: '愛心髮夾', cost: 0, hidden: true, how: '和夥伴的好感度達到滿級' },
    { id: 'moonears', name: '月兔耳朵', cost: 0, hidden: true, how: '夜晚的營地裡，月亮好像藏著什麼……' },
    { id: 'yuzuhat', name: '柚子帽', cost: 0, hidden: true, how: '在深淵裡遇見一棵柚子樹' },
    { id: 'laurel', name: '月桂冠', cost: 0, hidden: true, how: '擊敗隱藏首領' }
  );
  C.unlockAcc = id => {
    const P = Store.profile; if (P.ownedAcc.includes(id)) return false;
    P.ownedAcc.push(id); Store.saveProfile();
    const a = C.PET_ACCS.find(x => x.id === id);
    U.toast(`🎀 解鎖隱藏配件「${a ? a.name : id}」！到寵物小屋的衣櫃試穿看看`);
    return true;
  };

  /* ---------- 新隨機事件 ----------
   * when(R)：出現條件；rare：稀有（出現機率約為一般事件的 1/4） */
  const hour = () => new Date().getHours();
  C.EVENTS.push(
    {
      id: 'fountain', title: '許願池', icon: 'coin', text: '清澈的池底鋪滿了前人丟下的硬幣，水面映著微光。',
      choices: [
        { label: '丟 10 金幣許願', cond: R => R.p.gold >= 10, run: R => { R.p.gold -= 10; const x = Math.random(); if (x < 0.45) { const v = R.heal(R.p.maxHp * 0.3); return `願望實現了！回復 ${v} 生命。`; } if (x < 0.8) { R.p.crit += 0.05; return '一股好運湧上來，暴擊率 +5%。'; } const r = R.randomRelic(); if (r) { R.addRelic(r.id); return `池底浮出一件寶物——遺物「${r.name}」！`; } R.p.atk += 2; return '你覺得自己更強了，攻擊 +2。'; } },
        { label: '偷偷撈幾枚硬幣', run: R => { const g = R.gainGold(U.rnd(15, 25), true); if (U.chance(0.35)) { R.damage(8, true); return `撈到 ${g} 金幣……但被池中的守護靈打了一下（-8 生命）。`; } return `撈到 ${g} 金幣，沒人發現。`; } }
      ]
    },
    {
      id: 'library', title: '被遺忘的圖書館', icon: 63, text: '成排的書架延伸到黑暗裡，桌上攤著一本寫滿筆記的講義。',
      choices: [
        { label: '專心閱讀（經驗 +45，但有點累）', run: R => { R.gainXp(45); R.damage(Math.round(R.p.maxHp * 0.08), true); return '讀得頭昏眼花，但收穫滿滿：經驗 +45。'; } },
        { label: '抄下重點（獲得 2 張刪去卷軸）', run: R => { R.addItem('elim', 2); return '獲得「刪去卷軸」×2。'; } }
      ]
    },
    {
      id: 'sphinx', title: '人面獅身像', icon: 109, text: '巨大的石像睜開眼睛：「回答我的謎題，否則付出代價。」',
      choices: [
        { label: '回答謎題（額外一題）', run: R => { R.s.pendingQuiz = 'sphinx'; return '石像的眼睛亮了起來……'; } },
        { label: '繞遠路（-8 生命）', run: R => { R.damage(8, true); return '你繞了好長一段路，走得腳痠（-8 生命）。'; } }
      ]
    },
    {
      id: 'shady', title: '可疑的藥販', icon: 112, text: '斗篷底下伸出一隻手：「神秘藥水，40 金幣。喝了會發生什麼……我也不知道。」',
      choices: [
        { label: '買一瓶喝掉（40 金）', cond: R => R.p.gold >= 40, run: R => { R.p.gold -= 40; const x = Math.random(); if (x < 0.3) { R.p.maxHp += 12; R.heal(12); return '身體暖了起來：最大生命 +12！'; } if (x < 0.6) { R.p.atk += 3; return '肌肉在跳動：攻擊 +3！'; } if (x < 0.8) { R.addItem('potion_l'); return '其實是一瓶大回復藥，你收了起來。'; } R.damage(12, true); return '噁……是毒藥！-12 生命。'; } },
        { label: '搖頭離開', run: () => '藥販嘖了一聲，消失在陰影裡。' }
      ]
    },
    {
      id: 'forge', title: '遠古熔爐', icon: 74, text: '一座還在燃燒的熔爐，爐口刻著「以物易力」。',
      choices: [
        { label: '熔掉一瓶小回復藥（攻擊 +3）', cond: R => R.hasItem('potion_s'), run: R => { R.useItemRaw('potion_s'); R.p.atk += 3; return '藥水化作火焰鍛進武器，攻擊 +3！'; } },
        { label: '熔掉一個道具換護甲（防禦 +2）', cond: R => Object.keys(R.s.items).some(k => k !== 'feather'), run: R => { const k = U.pick(Object.keys(R.s.items).filter(k => k !== 'feather')); R.useItemRaw(k); R.p.def += 2; return `「${C.ITEMS[k].name}」被熔成護片，防禦 +2！`; } },
        { label: '烤烤火（回復 10 生命）', run: R => { const v = R.heal(10); return `暖呼呼的，回復 ${v} 生命。`; } }
      ]
    },
    {
      id: 'ghostexam', title: '幽靈考生', icon: 121, text: '一個半透明的學生趴在桌上啜泣：「這題我卡了好幾百年……可以幫我嗎？」',
      choices: [
        { label: '幫他解題（額外一題）', run: R => { R.s.pendingQuiz = 'ghost'; return '幽靈把考卷推到你面前……'; } },
        { label: '拍拍他的肩膀', run: R => { R.heal(5); R.petXp(5); return '幽靈露出一點微笑，你也覺得心裡暖暖的（+5 生命）。'; } }
      ]
    },
    {
      id: 'wheel', title: '命運輪盤', icon: 56, text: '一座鑲滿寶石的輪盤：「轉一次，付出你 10% 的生命。」',
      choices: [
        { label: '轉動輪盤', run: R => { R.damage(Math.round(R.p.maxHp * 0.1), true); const r = U.rnd(1, 6); if (r === 1) { const g = R.gainGold(60, true); return `🎯 大獎！獲得 ${g} 金幣。`; } if (r === 2) { R.p.atk += 3; return '⚔ 攻擊 +3！'; } if (r === 3) { R.p.maxHp += 15; R.heal(15); return '❤ 最大生命 +15！'; } if (r === 4) { R.addItem('potion_l'); return '🧪 獲得大回復藥！'; } if (r === 5) { R.p.crit += 0.06; return '✦ 暴擊率 +6%！'; } return '💨 什麼都沒有……'; } },
        { label: '不賭了', run: () => '輪盤緩緩停下。' }
      ]
    },
    {
      id: 'traveler', title: '旅人的篝火', icon: 'campfire', text: '一位旅人在篝火旁烤著麵包，招手要你坐下。',
      choices: [
        { label: '分享一瓶小回復藥', cond: R => R.hasItem('potion_s'), run: R => { R.useItemRaw('potion_s'); if (U.chance(0.55)) { const r = R.randomRelic(); if (r) { R.addRelic(r.id); return `旅人很感動，送你遺物「${r.name}」！`; } } const g = R.gainGold(45, true); return `旅人塞給你 ${g} 金幣當謝禮。`; } },
        { label: '一起休息', run: R => { const v = R.heal(R.p.maxHp * 0.15); return `聊了很多冒險故事，回復 ${v} 生命。`; } }
      ]
    },
    {
      id: 'mirror', title: '真理之鏡', icon: 102, text: '鏡子裡的你露出了奇怪的笑容。',
      choices: [
        { label: '凝視鏡子', run: R => { if (U.chance(0.5)) { R.p.atk += 2; R.p.crit += 0.04; return '你看清了自己的弱點：攻擊 +2、暴擊率 +4%。'; } R.s.pendingElite = true; R.s.pendingFight = true; return '鏡中的你走了出來——精英戰鬥！'; } },
        { label: '打碎鏡子', run: R => { R.damage(5, true); const g = R.gainGold(25, true); return `碎片割傷了手（-5），但鏡框上的寶石值 ${g} 金幣。`; } }
      ]
    },
    {
      id: 'rockfall', title: '落石！', icon: 62, text: '頭頂傳來轟隆聲，大量碎石正在崩落！',
      choices: [
        { label: '用護盾卷軸擋住', cond: R => R.hasItem('shield'), run: R => { R.useItemRaw('shield'); const g = R.gainGold(20, true); return `毫髮無傷！碎石裡還翻出 ${g} 金幣。`; } },
        { label: '拔腿就跑', run: R => { if (U.chance(0.65)) return '千鈞一髮，你成功躲開了！'; R.damage(12, true); return '被砸中了……-12 生命。'; } }
      ]
    },
    {
      id: 'alchemy', title: '煉金台', icon: 114, text: '冒著泡泡的燒杯、各色粉末……前一位煉金術士好像剛離開。',
      choices: [
        { label: '照筆記調配', run: R => { const a = U.pick(['elixir', 'shield', 'bomb']), b = U.pick(['elixir', 'shield', 'bomb', 'potion_s']); R.addItem(a); R.addItem(b); return `調配出「${C.ITEMS[a].name}」和「${C.ITEMS[b].name}」！`; } },
        { label: '喝掉桌上的神秘液體', run: R => { if (U.chance(0.5)) { R.p.maxHp += 8; R.heal(8); return '居然是營養劑！最大生命 +8。'; } R.damage(8, true); return '肚子好痛……-8 生命。'; } }
      ]
    },
    {
      id: 'critter', title: '野生小動物', icon: 'slime', text: '一群毛茸茸的小動物圍了過來，好奇地嗅著你的夥伴。',
      when: R => !!R.s.pet,
      choices: [
        { label: '讓夥伴跟牠們玩', run: R => { R.petXp(15); return `${Store.petName(R.s.pet)}玩得好開心（寵物經驗 +15）！`; } },
        { label: '分點零食（10 金）', cond: R => R.p.gold >= 10, run: R => { R.p.gold -= 10; R.heal(10); R.petXp(6); const it = U.chance(0.4) ? U.pick(['potion_s', 'shield', 'elim']) : null; if (it) R.addItem(it); return `小動物們開心地蹭蹭你（+10 生命）${it ? `，還叼來了「${C.ITEMS[it].name}」` : ''}！`; } }
      ]
    },
    {
      id: 'studygroup', title: '地下讀書會', icon: 84, text: '幾個冒險者圍著桌子討論考古題：「要不要一起讀？」',
      choices: [
        { label: '一起讀（經驗 +55，-10% 生命）', run: R => { R.gainXp(55); R.damage(Math.round(R.p.maxHp * 0.1), true); return '熬到半夜，經驗 +55！'; } },
        { label: '借一份筆記（換題卷軸）', run: R => { R.addItem('skip'); return '獲得「換題卷軸」。'; } }
      ]
    },
    {
      id: 'bounty', title: '懸賞告示', icon: 65, text: '牆上貼著告示：「附近有精英怪作亂，討伐者先付訂金 30 金幣。」',
      choices: [
        { label: '接下懸賞（先拿 30 金，立刻精英戰）', run: R => { const g = R.gainGold(30, true); R.s.pendingElite = true; R.s.pendingFight = true; return `收下 ${g} 金幣訂金，精英怪出現了！`; } },
        { label: '假裝沒看到', run: () => '你把告示翻到背面。' }
      ]
    },
    {
      id: 'veteran', title: '退休冒險者', icon: 100, text: '白髮老劍士坐在石頭上：「年輕人，想學兩招嗎？」',
      choices: [
        { label: '請教心得（隨機天賦）', run: R => { const t = U.pick(C.TALENTS); R.addTalent(t.id); return `學到了「${t.name}」：${t.desc}`; } },
        { label: '切磋一下（-10 生命，經驗 +40）', run: R => { R.damage(10, true); R.gainXp(40); return '被打得滿頭包，但經驗 +40！'; } }
      ]
    },
    {
      id: 'coin', title: '閃亮的硬幣', icon: 'coin', text: '路中間有一枚閃閃發亮的金幣。',
      choices: [
        { label: '撿起來', run: R => { const g = R.gainGold(25, true); return `獲得 ${g} 金幣！`; } },
        { label: '留給下一個冒險者', run: R => { if (U.chance(0.5)) { R.p.crit += 0.04; return '好心有好報，你覺得運氣變好了（暴擊率 +4%）。'; } R.heal(8); return '心情很好，回復 8 生命。'; } }
      ]
    },
    /* ---- 稀有／條件事件（隱藏要素） ---- */
    {
      id: 'rift', title: '時光裂縫', icon: 7, rare: true, text: '空氣裂開一道縫，裡面浮現你曾經答錯的題目……',
      when: () => Object.keys(Store.wrong).some(id => !Store.wrong[id].done && Store.Q[id] && ['single', 'multi'].includes(Store.Q[id].type)),
      choices: [
        { label: '回到過去重答一次', run: R => { R.s.pendingQuiz = 'rift'; return '你伸手觸碰裂縫……'; } },
        { label: '過去就讓它過去', run: R => { R.gainXp(15); return '你深吸一口氣繼續前進（經驗 +15）。'; } }
      ]
    },
    {
      id: 'yuzu', title: '深淵裡的柚子樹', icon: '🍊', rare: true, text: '不可思議——在不見天日的深淵裡，竟然長著一棵結滿金黃柚子的樹，散發清香。',
      choices: [
        { label: '摘一顆柚子', run: R => { if (!R.has('yuzucharm')) R.addRelic('yuzucharm'); else R.heal(R.p.maxHp); C.unlockAcc('yuzuhat'); Ach.unlock('yuzu'); return '柚子在手中化成一枚護符——獲得隱藏遺物「柚子護符」！（還解鎖了隱藏配件）'; } },
        { label: '在樹下睡個午覺', run: R => { const v = R.heal(R.p.maxHp * 0.6); Ach.unlock('yuzu'); return `柚子香讓你睡得好沉，回復 ${v} 生命。`; } }
      ]
    },
    {
      id: 'koi', title: '錦鯉池', icon: '🐟', rare: true, text: '一條金紅色的大錦鯉在池中悠游，據說摸到牠的考生都會上榜。',
      choices: [
        { label: '投 1 枚金幣祈福', cond: R => R.p.gold >= 1, run: R => { R.p.gold -= 1; if (!R.has('koiscale')) R.addRelic('koiscale'); else R.gainGold(50, true); Ach.unlock('koi'); return '錦鯉躍出水面，一片鱗片落在你手中——獲得隱藏遺物「錦鯉之鱗」！'; } },
        { label: '靜靜看著', run: R => { R.p.crit += 0.02; return '心情平靜下來，暴擊率 +2%。'; } }
      ]
    },
    {
      id: 'catparty', title: '貓咪茶會', icon: 'cat', rare: true, text: '一群戴著小禮帽的貓咪正在開茶會，看到你的夥伴就熱情地招手。',
      when: R => ['cat', 'luckycat'].includes(R.s.pet),
      choices: [
        { label: '一起喝茶', run: R => { R.heal(R.p.maxHp * 0.4); R.petXp(20); if (!R.has('teacup')) R.addRelic('teacup'); Ach.unlock('catparty'); return '喵喵喵～貓咪們送你一只茶杯——獲得隱藏遺物「貓咪茶杯」！'; } },
        { label: '婉拒', run: () => '貓咪們有點失望地揮揮爪子。' }
      ]
    },
    {
      id: 'coffee', title: '深夜咖啡攤', icon: '☕', rare: true, text: '「這麼晚還在讀書啊？」老闆推來一杯熱咖啡。（只在深夜 22:00～4:59 出現）',
      when: () => { const h = hour(); return h >= 22 || h < 5; },
      choices: [
        { label: '喝一杯（15 金）', cond: R => R.p.gold >= 15, run: R => { R.p.gold -= 15; R.heal(20); if (!R.has('nightowl')) R.addRelic('nightowl'); Ach.unlock('coffee'); return '咖啡香讓你精神一振（+20 生命）——獲得隱藏遺物「深夜咖啡杯」！不過還是要早點睡喔。'; } },
        { label: '還是早點睡好了', run: R => { R.heal(12); return '你決定打完這層就休息（+12 生命）。'; } }
      ]
    }
  );

  /* ---------- 成就（hidden：解鎖前顯示「？？？」） ---------- */
  C.ACH = [
    { id: 'first_win', name: '初次凱旋', desc: '完成任一次遠征並獲勝', gem: 10, icon: 45 },
    { id: 'abyss_clear', name: '深淵制霸', desc: '深淵遠征三章全破', gem: 30, icon: 110 },
    { id: 'diff3', name: '試煉者', desc: '通關試煉 III 以上的深淵遠征', gem: 40, icon: 32 },
    { id: 'diff6', name: '深淵行者', desc: '通關試煉 VI 以上的深淵遠征', gem: 80, icon: 32 },
    { id: 'kill100', name: '百戰勇者', desc: '累計擊敗 100 隻怪物', gem: 20, icon: 105 },
    { id: 'kill500', name: '千軍辟易', desc: '累計擊敗 500 隻怪物', gem: 60, icon: 118 },
    { id: 'ans300', name: '題海戰士', desc: '累計作答 300 題', gem: 20, icon: 63 },
    { id: 'ans1000', name: '題海無涯', desc: '累計作答 1000 題', gem: 60, icon: 63 },
    { id: 'boss10', name: '首領獵人', desc: '累計擊敗 10 位首領', gem: 30, icon: 84 },
    { id: 'streak7', name: '七日不輟', desc: '連續登入 7 天', gem: 25, icon: '🔥' },
    { id: 'wrong30', name: '錯題剋星', desc: '讓 30 題錯題「畢業」', gem: 30, icon: 65 },
    { id: 'bestiary', name: '怪物博士', desc: '怪物圖鑑收集 40 種', gem: 50, icon: 'eye' },
    { id: 'petlv10', name: '最佳拍檔', desc: '任一夥伴升到 Lv.10', gem: 30, icon: 'heart' },
    { id: 'fisher', name: '釣魚新手', desc: '在營地釣到 10 條魚', gem: 10, icon: 'fish' },
    // ---- 隱藏成就 ----
    { id: 'goldslime', name: '追金者', desc: '擊敗傳說中的黃金史萊姆', gem: 30, icon: 108, hidden: true },
    { id: 'secret_boss', name: '超越命題', desc: '擊敗隱藏首領「命題委員・幻影」', gem: 100, icon: 84, hidden: true },
    { id: 'yuzu', name: '柚子的祝福', desc: '在深淵中找到柚子樹', gem: 20, icon: '🍊', hidden: true },
    { id: 'koi', name: '錦鯉附身', desc: '遇見錦鯉池', gem: 20, icon: '🐟', hidden: true },
    { id: 'catparty', name: '喵星人外交官', desc: '參加貓咪茶會', gem: 20, icon: 'cat', hidden: true },
    { id: 'coffee', name: '夜貓子', desc: '在深夜咖啡攤喝一杯', gem: 15, icon: '☕', hidden: true },
    { id: 'moon', name: '月亮上的兔子', desc: '在夜晚的營地發現月兔', gem: 20, icon: 'rabbit', hidden: true },
    { id: 'wish', name: '流星許願', desc: '抓住劃過營地夜空的流星', gem: 10, icon: '🌠', hidden: true },
    { id: 'petlove', name: '心有靈犀', desc: '和夥伴的好感度達到滿級', gem: 30, icon: 'heart', hidden: true },
    { id: 'fishall', name: '釣魚大師', desc: '釣到所有種類的魚（含傳說魚）', gem: 50, icon: 'fish', hidden: true },
    { id: 'flower', name: '綠手指', desc: '讓營地的花盆開花', gem: 15, icon: '🌷', hidden: true },
    { id: 'perfect', name: '完美無瑕', desc: '以 95% 以上命中率通關深淵遠征', gem: 60, icon: 32, hidden: true },
    { id: 'cheat', name: '偷看答案？', desc: '發現戰鬥中的隱藏答案', gem: 1, icon: '👀', hidden: true },
    { id: 'bugs', name: '捕蟲少年', desc: '在營地抓到 30 隻蝴蝶或螢火蟲', gem: 15, icon: '🦋', hidden: true }
  ];
})();

/* ---------- 職業造型：t 為圖塊編號，v 為換色（tools/hero_skins.py 產生 assets/skins/） ---------- */
C.HERO_SKINS = {
  knight: [{ id: '', name: '鐵甲騎士', t: 97 }, { id: 'silver', name: '銀盔衛士', t: 96, cost: 60 }, { id: 'village', name: '村莊勇者', t: 98, cost: 60 },
    { id: 'crimson', name: '赤焰騎士', t: 97, v: 'crimson', cost: 90 }, { id: 'gold', name: '黃金聖騎', t: 97, v: 'gold', cost: 120 }, { id: 'shadow', name: '暗夜騎士', t: 97, v: 'shadow', cost: 100 }],
  mage: [{ id: '', name: '紫袍法師', t: 84 }, { id: 'azure', name: '蒼藍法師', t: 84, v: 'azure', cost: 80 }, { id: 'jade', name: '翡翠賢者', t: 84, v: 'jade', cost: 80 },
    { id: 'sakura', name: '櫻花魔導', t: 84, v: 'sakura', cost: 100 }, { id: 'shadow', name: '暗影術士', t: 84, v: 'shadow', cost: 100 }],
  ranger: [{ id: '', name: '遊俠', t: 88 }, { id: 'rookie', name: '見習冒險者', t: 85, cost: 60 }, { id: 'hood', name: '綠林遊俠', t: 112, cost: 80 },
    { id: 'crimson', name: '赤羽獵人', t: 112, v: 'crimson', cost: 90 }, { id: 'azure', name: '蒼穹射手', t: 112, v: 'azure', cost: 90 }, { id: 'shadow', name: '夜行獵手', t: 112, v: 'shadow', cost: 100 }],
  cleric: [{ id: '', name: '見習聖女', t: 99 }, { id: 'sage', name: '白髮賢者', t: 100, cost: 80 }, { id: 'sakura', name: '櫻花聖女', t: 99, v: 'sakura', cost: 90 },
    { id: 'azure', name: '蒼藍修女', t: 99, v: 'azure', cost: 90 }, { id: 'jade', name: '翡翠祭司', t: 99, v: 'jade', cost: 90 }],
  berserker: [{ id: '', name: '維京戰士', t: 87 }, { id: 'dwarf', name: '矮人戰士', t: 86, cost: 60 }, { id: 'crimson', name: '血怒狂戰', t: 87, v: 'crimson', cost: 90 },
    { id: 'azure', name: '寒冰狂戰', t: 87, v: 'azure', cost: 90 }, { id: 'shadow', name: '暗影狂戰', t: 87, v: 'shadow', cost: 100 }]
};
/* 造型 → 圖示代碼：數字＝Kenney 圖塊；'sk:97_crimson'＝換色圖 */
C.skinIcon = sk => sk.v ? `sk:${sk.t}_${sk.v}` : sk.t;
