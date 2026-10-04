/* 像素素材：Kenney Tiny Dungeon (CC0) 圖塊 + 自繪寵物/道具像素圖 */
const SP = (() => {
  const TILE = id => typeof id === 'string' && id.startsWith('sk:') ? `assets/skins/tile_${id.slice(3)}.png` : `assets/kenney/tiles/tile_${String(id).padStart(4, '0')}.png`;

  function tile(id, size = 64, cls = '', style = '') {
    if (window.HeroAnim && HeroAnim.get(id)) return HeroAnim.html(id, size, cls, style);
    return `<span class="sp ${cls}" style="width:${size}px;height:${size}px;${style}"><img class="px" src="${TILE(id)}" alt=""></span>`;
  }

  /* ---- 自繪像素圖：每格一字元，'.' 為透明 ---- */
  const PAL = {
    k: '#1b1325', w: '#ffffff', W: '#d8e3ee', b: '#4fa8ff', B: '#2c6bc4', r: '#e8483f', R: '#a4262f',
    y: '#ffd84a', Y: '#e0a526', o: '#ff9a3d', O: '#c4611c', g: '#62d66e', G: '#2f8f3b', p: '#ffb3c7',
    P: '#e86f9b', c: '#a8f0ff', C: '#5fc8e8', n: '#8a5a34', N: '#5a3a22', l: '#f3dcb0', s: '#9aa3b5',
    S: '#5d6577', v: '#b98bff', V: '#7a4fd0', e: '#1b1325', f: '#ff6a2a', h: '#fff2b0', m: '#6b4a1f'
  };
  const MAPS = {
    slime: [[
      '............',
      '............',
      '....kkkk....',
      '...kbbbbk...',
      '..kbwwbbbk..',
      '..kbwbbbbk..',
      '.kbbkbbkbbk.',
      '.kbbkbbkbbk.',
      '.kbbbppbbbk.',
      '.kBbbbbbbBk.',
      '..kkkkkkkk..',
      '............'], [
      '............',
      '............',
      '............',
      '....kkkk....',
      '..kkbbbbkk..',
      '.kbwwbbbbbk.',
      '.kbwkbbkbbk.',
      'kbbbkbbkbbbk',
      'kbbbbppbbbbk',
      'kBBbbbbbbBBk',
      '.kkkkkkkkkk.',
      '............']],
    dragon: [[
      '............',
      '......kkk...',
      '.....krrrk..',
      '.kk..krwkrk.',
      'kRRk.krrrrrk',
      'kRrRkkrrrkk.',
      '.kRrrrrrrk..',
      '..kkrryyrk..',
      '...krryyrk..',
      '..krrryyrrk.',
      '.krkkrrkrk..',
      '.k...kk.kk..'], [
      '............',
      '......kkk...',
      '.kk..krrrk..',
      'kRRk.krwkrk.',
      'kRrRkkrrrrrk',
      '.kRrRkrrrkk.',
      '..kRrrrrrk..',
      '..kkrryyrk..',
      '...krryyrk..',
      '..krrryyrrk.',
      '.krkkrrkrk..',
      '.k...kk.kk..']],
    owl: [[
      '............',
      '..k......k..',
      '..knkkkknk..',
      '.knnnnnnnnk.',
      '.knwwnnwwnk.',
      '.knwknnwknk.',
      '.knnnyynnnk.',
      '.knnlyylnnk.',
      '.knllllllnk.',
      '.knllllllnk.',
      '..knnnnnnk..',
      '...ok..ko...'], [
      '............',
      '..k......k..',
      '..knkkkknk..',
      '.knnnnnnnnk.',
      '.knkknnkknk.',
      '.knnnnnnnnk.',
      '.knnnyynnnk.',
      'knnnlyylnnnk',
      'knnllllllnnk',
      '.knllllllnk.',
      '..knnnnnnk..',
      '...ok..ko...']],
    cat: [[
      '..k......k..',
      '.kwk....kwk.',
      '.kpwkkkkwpk.',
      '.kwwwwwwwwk.',
      '.kwkwwwwkwk.',
      '.kwwwppwwwk.',
      '..kwwwwwwk..',
      '..krrrrrrk..',
      '..kwwywwwk..',
      '.kwwwwwwwwk.',
      '.kwwkwwkwwk.',
      '..kk.kk.kk..'], [
      '..k......k..',
      '.kwk....kwk.',
      '.kpwkkkkwpk.',
      '.kwwwwwwwwk.',
      '.kwkkwwkkwk.',
      '.kwwwppwwwk.',
      '..kwwwwwwk..',
      '..krrrrrrk..',
      '..kwwywwwkyk',
      '.kwwwwwwwwkk',
      '.kwwkwwkwwk.',
      '..kk.kk.kk..']],
    fairy: [[
      '............',
      '.cc..kk..cc.',
      'cCck.yyk.cCc',
      '.cckyyyykcc.',
      '..kyppppyk..',
      '...kpkpkk...',
      '...kppppk...',
      '..cckPPkcc..',
      '.cCckPPkcCc.',
      '..c.kPPk.c..',
      '.....kk.....',
      '......h.....'], [
      '............',
      '............',
      '.....kk.....',
      '.cc.kyyk.cc.',
      'cCckyyyykcCc',
      'cCkyppppykCc',
      '.cckpkpkkcc.',
      '...kppppk...',
      '...kPPPPk...',
      '....kPPk....',
      '....h.kk....',
      '.......h....']],
    fox: [[
      '.k......k...',
      '.kok...kok..',
      '.kook.kook..',
      '.koooooooo k',
      'kowkoooowkok',
      'kooooooooook',
      '.kolllokook.',
      '..kllllook..',
      '..koooooook.',
      '..kooooookwk',
      '..kokk.kokwk',
      '..kk....kkk.'], [
      '.k......k...',
      '.kok...kok..',
      '.kook.kook..',
      '.kooooooook.',
      'kokkoooookok',
      'kooooooooook',
      '.kolllokook.',
      '..kllllook.k',
      '..koooooookw',
      '..koooooookw',
      '..kokk.kokk.',
      '..kk....kk..']],
    campfire: [[
      '.....f......',
      '....ffy.....',
      '...fyyf.f...',
      '...fyhyff...',
      '..ffyhhyf...',
      '..fyhhhyff..',
      '..ffyhhyff..',
      '...ffyyff...',
      '.NnnNNnnNn..',
      'nNNnnnNNnnN.',
      '.nn.NNN.nn..',
      '............'], [
      '......f.....',
      '.....yff....',
      '...f.fyyf...',
      '...ffyhyf...',
      '...fyhhyff..',
      '..ffyhhhyf..',
      '..ffyhhyff..',
      '...ffyyff...',
      '.nNNnnNNnN..',
      'NnnNNNnnNNn.',
      '.NN.nnn.NN..',
      '............']],
    gem: [[
      '............',
      '....kkkk....',
      '...kvvhvk...',
      '..kvvvvhvk..',
      '.kVvvvvvvVk.',
      '.kkkkkkkkkk.',
      '..kVvvvvVk..',
      '...kVvvVk...',
      '....kVVk....',
      '.....kk.....',
      '............',
      '............']],
    coin: [[
      '............',
      '....kkkk....',
      '...kyyyyk...',
      '..kyhyyYYk..',
      '..kyhYYyYk..',
      '..kyhYyyYk..',
      '..kyhYYyYk..',
      '..kyyyyYYk..',
      '...kYYYYk...',
      '....kkkk....',
      '............',
      '............']],
    question: [[
      '....kkkk....',
      '...kyyyyk...',
      '..kyykkyyk..',
      '..kkk..kyyk.',
      '......kyyk..',
      '.....kyyk...',
      '.....kyk....',
      '.....kyk....',
      '......k.....',
      '.....kyk....',
      '.....kyk....',
      '......k.....']],
    mushroom: [[
      '............',
      '...kkkkkk...',
      '..krrwrrrrk.',
      '.krwwrrrwwrk',
      '.krrrrrrrrrk',
      'kkkkkkkkkkkk',
      '...klllllk..',
      '...klelelk..',
      '...klllllk..',
      '...kllPllk..',
      '....kkkkk...',
      '............'], [
      '............',
      '............',
      '...kkkkkk...',
      '..krrwrrrrk.',
      '.krwwrrrwwrk',
      'kkkkkkkkkkkk',
      '...klllllk..',
      '...klklklk..',
      '...klllllk..',
      '...kllPllk..',
      '....kkkkk...',
      '............']],
    book: [[
      '............',
      '.kkkkkkkkkk.',
      '.kVvvvvvvvk.',
      '.kVvwwvwwvk.',
      '.kVvwkvwkvk.',
      '.kVvvvvvvvk.',
      '.kVvkwkwkvk.',
      '.kVvvvvvvvk.',
      '.kWWWWWWWWk.',
      '.kkkkkkkkkk.',
      '..h......h..',
      '............'], [
      '............',
      '............',
      '.kkkkkkkkkk.',
      '.kVvvvvvvvk.',
      '.kVvwwvwwvk.',
      '.kVvkwvkwvk.',
      '.kVvvvvvvvk.',
      '.kVkwkwkwkk.',
      '.kWWWWWWWWk.',
      '.kkkkkkkkkk.',
      '.h........h.',
      '............']],
    skull: [[
      '............',
      '...kkkkkk...',
      '..kWWWWWWk..',
      '.kWWWWWWWWk.',
      '.kWkkWWkkWk.',
      '.kWkkWWkkWk.',
      '.kWWWkkWWWk.',
      '..kWWWWWWk..',
      '..kWkWkWkk..',
      '...kWWWWk...',
      '..kWkWWkWk..',
      '...kk..kk...'], [
      '............',
      '...kkkkkk...',
      '..kWWWWWWk..',
      '.kWWWWWWWWk.',
      '.kWrkWWrkWk.',
      '.kWkkWWkkWk.',
      '.kWWWkkWWWk.',
      '..kWWWWWWk..',
      '..kkWkWkWk..',
      '...kWWWWk...',
      '..kWkWWkWk..',
      '...kk..kk...']],
    eye: [[
      '............',
      '....kkkk....',
      '..kkWWWWkk..',
      '.kWWWrWWWWk.',
      'kWWWkkkkWWWk',
      'kWWkbbbbkWWk',
      'kWWkbeebkWWk',
      'kWWkbbbbkWWk',
      'kWrWkkkkWWWk',
      '.kWWWWWrWWk.',
      '..kkWWWWkk..',
      '....kkkk....'], [
      '............',
      '....kkkk....',
      '..kkWWWWkk..',
      '.kWWWrWWWWk.',
      'kWWWkkkkWWWk',
      'kWWkbbbbkWWk',
      'kWWkbbeekWWk',
      'kWWkbbbbkWWk',
      'kWrWkkkkWWWk',
      '.kWWWWWrWWk.',
      '..kkWWWWkk..',
      '....kkkk....']],
    wisp: [[
      '......c.....',
      '.....cC.....',
      '....cCCc....',
      '...cCbbCc...',
      '..cCbwwbCc..',
      '..cbwkwkbc..',
      '..cbwwwwbc..',
      '..cCbwwbCc..',
      '...cCbbCc...',
      '....cCCc....',
      '.....cc.....',
      '............'], [
      '.....c......',
      '....Cc......',
      '....cCCc....',
      '...cCbbCc...',
      '..cCbwwbCc..',
      '..cbkwkwbc..',
      '..cbwwwwbc..',
      '..cCbwwbCc..',
      '...cCbbCc...',
      '....cCCc....',
      '......cc....',
      '............']],
    bow: [[
      '....kk......',
      '...knk......',
      '..knk.w.....',
      '..kn..w.....',
      '.kn...w.....',
      '.kn...w.....',
      '.kn...w.....',
      '.kn...w.....',
      '..kn..w.....',
      '..knk.w.....',
      '...knk......',
      '....kk......']],
    heart: [[
      '............',
      '.kkk...kkk..',
      'krrrk.krrrk.',
      'krwrrkrrrrk.',
      'krrrrrrrrrk.',
      'krrrrrrrrRk.',
      '.krrrrrrRk..',
      '..krrrrRk...',
      '...krrRk....',
      '....kRk.....',
      '.....k......',
      '............']]
  };
  /* ---- 萌系寵物 16x16（寵物小屋/營地/戰鬥共用），可換色（造型）與配件 ---- */
  const PPAL = {  'k':'#4a2f45','w':'#ffffff','e':'#2a1a2e','a':'#ff8fae','A':'#e8607f','q':'#fff6ea','o':'#ffc48a','O':'#f09a5a',  't':'#e8a860','T':'#b87a3c','z':'#e9ecf3','Z':'#b9bfcc','g':'#8fe07a','G':'#4fb05a','b':'#7cc4ff','B':'#3f8fe0',  'r':'#ff6b6b','R':'#c93f4f','y':'#ffd84a','Y':'#e0a526','n':'#c98b5a','N':'#6b4424','v':'#c9a0ff','V':'#8a5ad6',  'c':'#bff4ff','C':'#6fd0ee','p':'#ffc4d6','l':'#fff7b0','s':'#8a8fa0','L':'#9fd8ff','x':'#d6d9e4','f':'#ff7a3a','F':'#c9501c'};
  const PETMAPS = {
"cat": [
"................",
".kk..........kk.",
".kak........kak.",
".kaok......koak.",
".koookkkkkkoook.",
"kooooOooooOooook",
"kooooooooooooook",
"koowoooooooowook",
"kooweooooooweook",
"kooeLooooooeLook",
"kaaoooqkqoooaaok",
".kooooooooooook.",
"..kkooqqqqookk..",
"...koqqqqqqok.kk",
"...koaokkoaokkok",
"....kkk..kkk.kk."
],
"dog": [
"................",
"..kkk......kkk..",
".knnnkkkkkknnnk.",
"knnnkqqqqqqknnnk",
"knnkqqqqqqnnknnk",
"knnkqwqqqwnnknnk",
"knnkqweqqwenknnk",
"knnkqeLqqeLnknnk",
".kkqaaqkkqaaqkk.",
"kqqqqqqaaqqqqqqk",
"..kqqqqqqqqqqk..",
"...krrryrrrrk...",
"...kqqqqqqqqk...",
"...kqnqqqqqqk.kk",
"...kqqqqqqqqkkn.",
"...kqkk..kkqk..."
],
"rat": [
"................",
".kkk........kkk.",
"kaaak......kaaak",
"kaAak......kaAak",
".kaakkkkkkkkaak.",
"..kxxxxxxxxxxk..",
".kxxxxxxxxxxxxk.",
".kxwxxxxxxxwxxk.",
".kxwexxxxxxwexk.",
".kxeLzzzzzzeLxk.",
".kaazzzAAzzzaak.",
"..kzzzzzzzzzzk..",
"...kkzzyyzzkk...",
"...kxzyYyzxk....",
"...kxxzzzzxxkaa.",
"....kkk..kkk..a."
],
"slime": [
"................",
"................",
".......kk.......",
"......kbbk......",
".....kbwbbk.....",
"....kbwwbbbk....",
"...kbbwbbbbbk...",
"..kbbbbbbbbbbk..",
".kbbbewbbbewbbk.",
".kbbbeebbbeebbk.",
"kbbaabbbkbbaabbk",
"kbbbbbbkkbbbbbbk",
"kbbbbbbbbbbbbbBk",
"kBbbbbbbbbbbbBBk",
".kBBBBBBBBBBBBk.",
"..kkkkkkkkkkkk.."
],
"fox": [
"................",
".kk..........kk.",
".kfk........kfk.",
".kpfk......kfpk.",
".kffFkkkkkkFffk.",
"kffffffffffffffk",
"kqfffffffffffffk",
"kqfewffffffewfqk",
"kqqeeffffffeeqqk",
"kqaqqqqkkqqqqaqk",
".kqqqqqqqqqqqqk.",
"..kkqqqqqqqqkkkk",
"...kffffffffkfFk",
"...kfqqqqqqfkFfk",
"...kNkkkkkkNkqqk",
"....kk....kk.kk."
],
"dragon": [
"................",
"...y........y...",
"..kyk......kyk..",
".kggkkkkkkkkggk.",
"kggggggggggggggk",
"kggggggggggggggk",
"kggewggggggewggk",
"kggeeggggggeeggk",
"kgaaggqqqqggaagk",
".kgggqqkkqqgggk.",
"kGk.kggggggk.kGk",
"kGGkgqqqqqqgkGGk",
".kGkgqqqqqqgkGk.",
"...kggggggggk.kg",
"...kgkkkkkkgk.kk",
"....kk....kk...."
],
"owl": [
"................",
"..kk........kk..",
"..knk......knk..",
"..knnkkkkkkknk..",
".knnnnnnnnnnnnk.",
"knnwwwnnnnwwwnnk",
"knwwewwnnwwewwnk",
"knwweewnnweewwnk",
"knnwwwnyynwwwnnk",
"knaannnyynnnaank",
".knqqqqqqqqqqnk.",
"kNnqnqnqnqnqnNk.",
"kNNqqqqqqqqqqNNk",
".kNnqnqnqnqnqnk.",
"..knnnnnnnnnnk..",
"....ky....yk...."
],
"fairy": [
"......kkkk......",
".....kyyyyk.....",
".cc.kyyyyyyk.cc.",
"cCck yyyyyyk kcC",
".cckppppppppkcc.",
"..kppewppewppk..",
"..kppeeppeeppk..",
"..kpaappppaapk..",
"..kpppppkpppkk..",
"...kkppppppkk...",
".cc.kvvvvvvk.cc.",
"cCcckvVvvVvkcCc.",
".cc.kvvvvvvk.cc.",
".....kvvvvk.....",
"......kppk......",
".......ll......."
],
"luckycat": [
"................",
"..k.........k...",
".kzk.......kzk..",
".kazk.....kzak..",
".kzzzkkkkkzzzk..",
"kzzzzzzzzzzzzzk.",
"kzzzzzzzzzzzzzk.",
"kzzewzzzzzewzzk.",
"kzzeezzzzzeezzk.",
"kzaazzqkqzzaazk.",
"kzzzzzzzzzzzzzk.",
".krrrrrrrrrrrk..",
"..kzzzyyzzzzk.kz",
"..kzzzYYzzzzk.kz",
"..kzzkkkkkzzkk..",
"...kk.....kk...."
]
};
  /* 配件：at=head 戴在頭頂／ear 耳邊／side 頭側／halo 頭上方／neck 脖子 */
  const ACCMAP = {
    bow: { at: 'ear', map: ['kk.kk', 'kaAak', 'kk.kk'] },
    crown: { at: 'head', map: ['y.y.y', 'yyyyy', 'YrYbY'] },
    wizard: { at: 'head', map: ['...k...', '..kVk..', '..kvk..', '.kvvvk.', 'kkyyykk'] },
    straw: { at: 'head', map: ['..kttk..', '.kttttk.', 'kTTTTTTk'] },
    flower: { at: 'side', map: ['.a.', 'aya', '.a.'] },
    halo: { at: 'halo', map: ['.yyyy.', 'y....y', '.yyyy.'] },
    scarf: { at: 'neck', map: ['krrrrrrrrk', '..kRRk....'] },
    party: { at: 'head', map: ['..y..', '.kbk.', '.krk.', 'kyyyk'] }
  };
  const ANCHOR = {
    cat: { x: 7, top: 4, neck: 11 }, dog: { x: 7, top: 2, neck: 12 }, rat: { x: 7, top: 4, neck: 10 },
    slime: { x: 7, top: 3, neck: 11 }, fox: { x: 7, top: 4, neck: 11 }, dragon: { x: 7, top: 3, neck: 10 },
    owl: { x: 7, top: 3, neck: 10 }, fairy: { x: 7, top: 1, neck: 9 }, luckycat: { x: 7, top: 4, neck: 11 }
  };
  const pcache = {}, preg = [], pregIdx = {};
  function petURL(id, skin, acc, frame) {
    const key = id + '|' + JSON.stringify(skin || {}) + '|' + (acc || '') + '|' + frame;
    if (pcache[key]) return pcache[key];
    const c = document.createElement('canvas'); c.width = 20; c.height = 20;
    const g = c.getContext('2d');
    const pal = Object.assign({}, PPAL, skin || {});
    const ox = 2, oy = 3 + (frame ? 1 : 0);
    const put = (rows, bx, by) => rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(ox + bx + x, oy + by + y, 1, 1); } }));
    const rows = PETMAPS[id] || PETMAPS.slime;
    // 第二格：身體稍微壓扁（呼吸感）
    put(rows, 0, 0);
    if (acc && ACCMAP[acc]) {
      const A = ACCMAP[acc], an = ANCHOR[id] || ANCHOR.cat, w = A.map[0].length, h = A.map.length;
      let ax = an.x - Math.floor(w / 2) + 1, ay;
      if (A.at === 'head') ay = an.top - h + 1;
      else if (A.at === 'ear') { ax = an.x + 3; ay = an.top - 2; }
      else if (A.at === 'side') { ax = an.x - 6; ay = an.top - 1; }
      else if (A.at === 'halo') ay = an.top - h - 1;
      else ay = an.neck;
      put(A.map, ax, ay + (frame && A.at !== 'halo' ? 0 : 0));
    }
    return (pcache[key] = c.toDataURL());
  }
  function pet(id, size = 48, cls = '', style = '', skin = null, acc = null) {
    const key = id + '|' + JSON.stringify(skin || {}) + '|' + (acc || '');
    if (pregIdx[key] === undefined) { pregIdx[key] = preg.length; preg.push([id, skin, acc]); }
    return `<span class="sp pet-sp ${cls}" style="width:${size}px;height:${size}px;${style}" data-anim="P${pregIdx[key]}"><img class="px" src="${petURL(id, skin, acc, 0)}" alt=""></span>`;
  }
  const cache = {};
  function mapURL(name, frame = 0) {
    const key = name + frame;
    if (cache[key]) return cache[key];
    const rows = MAPS[name][frame] || MAPS[name][0];
    const w = 12, hgt = rows.length;
    const c = document.createElement('canvas'); c.width = w; c.height = hgt;
    const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === '.' || ch === ' ' || !PAL[ch]) return;
      g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1);
    }));
    return (cache[key] = c.toDataURL());
  }
  /* 兩格動畫：用 JS 定時切換 frame */
  function pix(name, size = 48, cls = '', style = '') {
    const two = MAPS[name].length > 1;
    return `<span class="sp ${cls}" style="width:${size}px;height:${size}px;${style}" ${two ? `data-anim="${name}"` : ''}><img class="px" src="${mapURL(name, 0)}" alt=""></span>`;
  }
  let tick = 0;
  setInterval(() => {
    tick ^= 1;
    document.querySelectorAll('[data-anim]').forEach(s => {
      const img = s.firstElementChild; if (!img) return;
      const a = s.dataset.anim;
      if (a[0] === 'P') { const r = preg[+a.slice(1)]; if (r) img.src = petURL(r[0], r[1], r[2], tick); }
      else img.src = mapURL(a, tick);
    });
  }, 420);

  /* icon: 數字 => kenney tile；字串 => 自繪圖 */
  function icon(ic, size = 32, cls = '', style = '') {
    if (typeof ic === 'number' || (typeof ic === 'string' && (ic.startsWith('sk:') || ic.startsWith('ha:')))) return tile(ic, size, cls, style);
    if (MAPS[ic]) return pix(ic, size, cls, style);
    if (PETMAPS[ic]) return SP.pet(ic, size, cls, style);
    return `<span class="sp ${cls}" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .7)}px;line-height:${size}px;text-align:center;${style}">${ic}</span>`;
  }

  const HEROES = [
    { id: 97, name: '鐵甲騎士' }, { id: 96, name: '銀盔衛士' }, { id: 85, name: '見習冒險者' },
    { id: 87, name: '維京戰士' }, { id: 88, name: '遊俠' }, { id: 99, name: '見習魔女' },
    { id: 84, name: '大賢者' }, { id: 100, name: '白髮劍聖' }, { id: 98, name: '村莊勇者' }
  ];

  return { tile, pix, icon, pet, petURL, mapURL, TILE, HEROES, MAPS, PETMAPS };
})();
