/* 怪物擴充包：新怪物 + 手繪像素圖、新特性、怪物攻擊演出（遠程／電擊／重擊…）。
 * 載入順序：content2.js 之後（擴充 C.MONSTERS、C.TRAITS、SP.MAPS）。 */
(() => {
  /* ---------- 像素圖：每列只寫左半（6 字元），自動左右鏡射成 12×12；12 字元的列原樣使用 ---------- */
  const sym = rows => rows.map(r => r.length === 12 ? r : r + [...r].reverse().join(''));
  const ART = {
    eraser: ['......', '..kkkk', '.kpppp', '.kpwwp', '.kpwkp', '.kpppp', '.kpppk', '.kpppp', 'kbbbbb', 'kBBBBB', '.kkkkk', '..kk..'],
    pencil: ['.....k', '....kS', '...klS', '..klll', '..kkkk', '..kyyy', '..kywy', '..kyky', '..kyyr', '..kYYY', '..ksss', '..kppp'],
    fuzz: ['......', '..k.k.', '.kssSS', '.ksWWs', '.ksWks', 'ksssss', 'kysSss', 'kssskk', '.kssss', '..kkss', '.k.kkk', '......'],
    sprout: ['...gg.', '..gGGg', '...ggg', '..kkkk', '.kgggg', '.kgwwg', '.kgwkg', '.kgggg', '.kgpgk', '.kGggg', '..kkGG', '...nn.'],
    cloud: ['......', '....kk', '..kkSS', '.kSSss', 'kSSwwS', 'kSSwkS', 'kSSSSS', '.kSSSk', '..kkkk', '..kyk.', '...ky.', '....k.'],
    scarecrow: ['....kk', '...kNN', '.kNNNN', '..klll', '..klkl', '..kllk', '..kBbb', 'kyyybb', '..kkBb', '....kb', '....kn', '....kn'],
    tortoise: ['......', '....kk', '..kkgg', '.kgGgg', 'kgGggG', 'kGgGgg', 'kgGggG', '.kkkkk', '..klll', '..klkl', '.kllll', '.kk...'],
    snowman: ['....kk', '....kS', '..kkkk', '..kwww', '..kwkw', '..kwwo', '..kwww', '.kbbbb', '.kwwww', '.kwwwk', '.kWwwk', '..kkkk'],
    piranha: ['......', '....kk', '..kkbb', '.kbbbb', '.kbwwb', '.kbwkb', '.kbbbb', 'kkkkkk', '.kwRwR', '.kRRRR', '..kBBB', '...kkk'],
    mummy: ['..kkkk', '.klWWl', '.kWlWW', '.kkrkk', '.kWWlW', '.klWWW', '..kWlW', '.kWWlW', 'kWWkWl', '.kWlWW', '.kWlk.', '.kkk..'],
    cactus: ['.....p', '....pP', '...kkg', '.kk.kg', '.kgkkg', '.kggkg', '..kkkg', '...kwg', '...kgg', '...kgg', '..knnn', '..kNNN'],
    robot: ['.....r', '.....k', '..kkkk', '.kssss', '.kkkkk', '.kkrrk', '.kkkkk', '.kssss', 'kkSsss', 'kSkSyy', '.kkSSS', '..kkSS'],
    wolf: ['.k....', '.kSk..', '.kSSkk', '.kSSSS', '.kSyyS', '.kSkyS', '.kssss', '..kwww', '..kwwk', '..kwwR', '..kkww', '...kkk'],
    gargoyle: ['.k....', '.kSk..', '..kSSS', '..kSrS', 'kSk.kS', 'kSSkSs', '.kSSkS', '..kkSs', '...kSs', '...kSS', '..kSkS', '..kkk.'],
    minotaur: ['kw....', 'kwk...', '.kwkkk', '..knnn', '..knrn', '..knnn', '..kppp', '..kpkp', '..kppy', '...kkk', '.kNNNN', '.kkkkk'],
    siren: ['..kkkk', '.kBbbb', '.kbbll', '.kbbkl', '.kbllp', '.kBbll', 'kBbccc', '.kBbll', '..kCcc', '...kCc', '.kppPP', '..kkkk'],
    reaper: ['..kkkk', '.kVVVV', '.kVkkk', '.kVkrk', '.kVkkk', '.kVkwk', 'kVVVVV', 'kVwVVV', 'kVvVVV', 'kVVVVV', 'kVkVkV', '.k.k.k'],
    phoenix: ['.....f', '....fo', '...kyy', '...kwy', 'fo.kky', 'ffokyy', 'fooYyy', '.foYyy', '..fkYy', '...kfo', '...kff', '....kf'],
    treant: ['..gGgG', '.gGgGg', '.gGgGG', '.knnnn', '.knnyn', '.knnnn', '.knnkk', '.knnnn', 'kNnnNn', '.knnNn', 'kkNnnn', 'kk.kkk'],
    kraken: ['......', '...kkk', '..kVVV', '.kVvvV', '.kVwwV', '.kVwkV', '.kVVVV', '.kVVkk', 'kVVkVV', 'kVk.kV', 'kV..kV', '.k..k.'],
    cobra: ['....kk', '..kkgg', '.kGggg', '.kGyyg', '.kGkyg', '.kGggg', 'kGggGg', 'kGgGgg', '.kGgpp', '..kGgg', '...kGg', '....kk'],
    seraph: ['...yyy', '..kkkk', '..klll', '..klkl', '..kllk', 'kwwkVV', 'kWwkVV', '.kWkVV', '..kkVV', '...kVv', '...kVV', '...kkk']
  };
  Object.entries(ART).forEach(([k, half]) => {
    const rows = sym(half);
    // 第二格：刪掉中間一列、頂端補空白 → 身體微微壓扁再彈起（與 content2.js 同一套做法）
    SP.MAPS[k] = [rows, ['............'].concat(rows.slice(0, 5), rows.slice(6))];
  });

  /* ---------- 新特性 ---------- */
  Object.assign(C.TRAITS, {
    shock: { name: '麻痺', desc: '你答錯時被電麻，下一次答對無法暴擊' },
    expose: { name: '破綻', desc: '你答錯時露出破綻，直到下次答對前受到的傷害 +30%' },
    ambush: { name: '先制', desc: '偷襲：第 1 題答錯時，受到的傷害 ×1.6' },
    harden: { name: '硬化', desc: '每被命中一次就更堅硬：受到的傷害再 -1（最多 -3）' }
  });
  C.ELITE_AFFIX.push('shock', 'expose', 'ambush', 'harden');

  /* ---------- 新怪物（23 種） ---------- */
  C.MONSTERS.push(
    // 淺層
    { id: 'eraser', name: '橡皮擦怪', tile: 'eraser', hp: 0.95, atk: 0.85, tier: 0, traits: ['expose'], desc: '把你的答案擦得亂七八糟，答錯就會露出破綻。' },
    { id: 'pencil', name: '鉛筆兵', tile: 'pencil', hp: 0.85, atk: 0.95, tier: 0, traits: ['ambush'], fx: 'needle', desc: '尖尖的筆尖搶先出手，第一題可別答錯！' },
    { id: 'fuzz', name: '靜電毛球', tile: 'fuzz', filter: 'none', hp: 0.9, atk: 0.8, tier: 0, traits: ['shock'], fx: 'zap', desc: '渾身是靜電，被電到手一麻就打不出暴擊。' },
    { id: 'sprout', name: '嫩芽怪', tile: 'sprout', hp: 1.0, atk: 0.75, tier: 0, traits: ['heal'], desc: '每隔幾題就會光合作用回復生命。' },
    // 中層
    { id: 'cloud', name: '雷雨雲', tile: 'cloud', filter: 'none', hp: 0.9, atk: 1.05, tier: 1, traits: ['shock', 'swift'], fx: 'zap', desc: '飄在頭頂的小烏雲，閃電說劈就劈。' },
    { id: 'scarecrow', name: '稻草人', tile: 'scarecrow', filter: 'none', hp: 1.1, atk: 0.95, tier: 1, traits: ['fragile', 'spite'], desc: '一戳就破，但倒下時會把怨氣灑給你。' },
    { id: 'tortoise', name: '鐵甲龜', tile: 'tortoise', filter: 'none', hp: 1.25, atk: 0.85, tier: 1, traits: ['harden', 'thick'], fx: 'slam', desc: '殼會越打越硬，快攻才能撬開它。' },
    { id: 'snowman', name: '雪人守衛', tile: 'snowman', filter: 'none', hp: 1.05, atk: 0.95, tier: 1, traits: ['chill', 'heal'], fx: 'frost', desc: '冰冷的雪球加上緩慢回復。' },
    { id: 'piranha', name: '食人魚', tile: 'piranha', filter: 'none', hp: 0.8, atk: 1.2, tier: 1, traits: ['ambush', 'drain'], desc: '一口咬下去還會回血，開場特別兇。' },
    // 深層
    { id: 'mummy', name: '木乃伊', tile: 'mummy', filter: 'none', hp: 1.15, atk: 1.15, tier: 2, traits: ['undying', 'rot'], desc: '倒下後還會爬起來，繃帶會腐蝕你的護甲。' },
    { id: 'cactus', name: '仙人掌怪', tile: 'cactus', filter: 'none', hp: 1.1, atk: 1.05, tier: 2, traits: ['thorny', 'harden'], fx: 'needle', desc: '渾身是刺，越打越硬。' },
    { id: 'robot', name: '失控機器人', tile: 'robot', filter: 'none', hp: 1.2, atk: 1.15, tier: 2, traits: ['shock', 'armor'], fx: 'zap', desc: '電路短路亂放電，外殼還很硬。' },
    { id: 'wolf', name: '月夜餓狼', tile: 'wolf', filter: 'none', hp: 0.95, atk: 1.35, tier: 2, traits: ['ambush', 'frenzy'], desc: '撲上來又快又狠，越戰越瘋狂。' },
    { id: 'gargoyle', name: '石像鬼', tile: 'gargoyle', hp: 1.25, atk: 1.15, tier: 2, traits: ['stoneskin', 'shock'], fx: 'slam', desc: '石化的外皮吸收前兩下攻擊，重拳還會震麻你。' },
    // 深淵
    { id: 'minotaur', name: '牛頭人', tile: 'minotaur', hp: 1.5, atk: 1.3, tier: 3, traits: ['ambush', 'frenzy'], fx: 'slam', desc: '低頭衝撞，血越少越暴躁。' },
    { id: 'siren', name: '海妖', tile: 'siren', hp: 1.05, atk: 1.25, tier: 3, traits: ['expose', 'silence'], fx: 'orb', desc: '歌聲封住你的技能，還讓你露出破綻。' },
    { id: 'reaper', name: '死神學徒', tile: 'reaper', hp: 1.1, atk: 1.35, tier: 3, traits: ['expose', 'spite', 'dodge'], desc: '飄忽難捉，死前還要拉你陪葬。' },
    { id: 'phoenix', name: '焰羽鳳凰', tile: 'phoenix', filter: 'none', hp: 1.2, atk: 1.3, tier: 3, traits: ['scorch', 'undying'], fx: 'fire', desc: '浴火重生，烈焰讓你一直著火。' },
    { id: 'treant', name: '古樹守衛', tile: 'treant', filter: 'none', hp: 1.7, atk: 1.0, tier: 3, traits: ['harden', 'heal'], fx: 'slam', desc: '樹皮越打越厚，還會自己長回來。' },
    // 深淵最深處
    { id: 'kraken', name: '深淵觸手王', tile: 'kraken', hp: 1.5, atk: 1.4, tier: 4, traits: ['swarm', 'shock', 'mirror'], fx: 'ink', desc: '無數觸手同時抽打，還會反彈暴擊。' },
    { id: 'cobra', name: '劇毒蛇王', tile: 'cobra', filter: 'none', hp: 1.5, atk: 1.35, tier: 4, traits: ['poison', 'harden', 'dodge'], fx: 'spore', desc: '毒牙見血封喉，鱗片一天比一天硬。' },
    { id: 'seraph', name: '墮天使', tile: 'seraph', filter: 'none', hp: 1.4, atk: 1.5, tier: 4, traits: ['expose', 'silence', 'mirror'], fx: 'orb', desc: '光環已經黯淡，審判卻更加無情。' },
    { id: 'drake', name: '深淵魔龍', tile: 'dragon', filter: 'hue-rotate(250deg) saturate(1.6) brightness(.75)', hp: 1.9, atk: 1.4, tier: 4, traits: ['scorch', 'frenzy', 'armor'], fx: 'fire', desc: '龍息點燃一切，硬鱗讓人無從下手。' }
  );

  /* ---------- 怪物攻擊方式（反擊時的演出）：預設近身衝撞，其他見 FX.monStrike ---------- */
  const STYLE = {
    mage: 'orb', warlock: 'orb', eye: 'orb', book: 'orb', witch: 'orb', voideye: 'orb', bonelord: 'orb',
    imp: 'fire', wisp: 'fire', candle: 'fire', inkdragon: 'ink', inkblot: 'ink',
    shroom: 'spore', frog: 'spore', plague: 'spore', sporeking: 'spore',
    bee: 'swarm', hive: 'swarm', jelly: 'swarm', icebat: 'frost', crystal: 'frost',
    cyclops: 'slam', golem: 'slam', crystalgolem: 'slam', guard: 'slam', abyssknight: 'slam', fallen: 'slam'
  };
  C.MONSTERS.forEach(m => { if (!m.fx && STYLE[m.id]) m.fx = STYLE[m.id]; });
})();
