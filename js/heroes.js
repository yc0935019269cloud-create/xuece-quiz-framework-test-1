/* AI 像素角色：每人 8 個原繪姿勢；待機、4 種攻擊、暴擊。可 file:// 使用。 */
const HeroAnim = (() => {
  const ACTORS = [{"id":"px_knight_m1","cls":"knight","gender":"male","name":"月白誓約","accent":"#b6cfff","src":"assets/heroes/knight_m1.png"},{"id":"px_knight_m2","cls":"knight","gender":"male","name":"薔薇近衛","accent":"#b6cfff","src":"assets/heroes/knight_m2.png"},{"id":"px_knight_m3","cls":"knight","gender":"male","name":"蒼海巡誓","accent":"#b6cfff","src":"assets/heroes/knight_m3.png"},{"id":"px_knight_m4","cls":"knight","gender":"male","name":"琥珀王衛","accent":"#b6cfff","src":"assets/heroes/knight_m4.png"},{"id":"px_knight_m5","cls":"knight","gender":"male","name":"風隼領衛","accent":"#c8e0ee","src":"assets/heroes/knight_m5.png"},{"id":"px_knight_m6","cls":"knight","gender":"male","name":"赤砂劍誓","accent":"#e3b56c","src":"assets/heroes/knight_m6.png"},{"id":"px_knight_m7","cls":"knight","gender":"male","name":"霜鐵城衛","accent":"#8bd5ed","src":"assets/heroes/knight_m7.png"},{"id":"px_knight_m8","cls":"knight","gender":"male","name":"星辰王侍","accent":"#b7adff","src":"assets/heroes/knight_m8.png"},{"id":"px_knight_f1","cls":"knight","gender":"female","name":"晨曦女騎","accent":"#b6cfff","src":"assets/heroes/knight_f1.png"},{"id":"px_knight_f2","cls":"knight","gender":"female","name":"紫藤劍姬","accent":"#b6cfff","src":"assets/heroes/knight_f2.png"},{"id":"px_knight_f3","cls":"knight","gender":"female","name":"緋櫻守望","accent":"#b6cfff","src":"assets/heroes/knight_f3.png"},{"id":"px_knight_f4","cls":"knight","gender":"female","name":"夜藍劍華","accent":"#b6cfff","src":"assets/heroes/knight_f4.png"},{"id":"px_knight_f5","cls":"knight","gender":"female","name":"翠羽誓劍","accent":"#91cdaf","src":"assets/heroes/knight_f5.png"},{"id":"px_knight_f6","cls":"knight","gender":"female","name":"沙月女衛","accent":"#eac79a","src":"assets/heroes/knight_f6.png"},{"id":"px_knight_f7","cls":"knight","gender":"female","name":"霜蘭劍衛","accent":"#a3d9ee","src":"assets/heroes/knight_f7.png"},{"id":"px_knight_f8","cls":"knight","gender":"female","name":"曜金女爵","accent":"#ffd58c","src":"assets/heroes/knight_f8.png"},{"id":"px_mage_m1","cls":"mage","gender":"male","name":"星夜魔導","accent":"#c7a5ff","src":"assets/heroes/mage_m1.png"},{"id":"px_mage_m2","cls":"mage","gender":"male","name":"霜雪學者","accent":"#c7a5ff","src":"assets/heroes/mage_m2.png"},{"id":"px_mage_m3","cls":"mage","gender":"male","name":"翠玉術士","accent":"#c7a5ff","src":"assets/heroes/mage_m3.png"},{"id":"px_mage_m4","cls":"mage","gender":"male","name":"暮焰秘法","accent":"#c7a5ff","src":"assets/heroes/mage_m4.png"},{"id":"px_mage_m5","cls":"mage","gender":"male","name":"沙海秘賢","accent":"#e3b478","src":"assets/heroes/mage_m5.png"},{"id":"px_mage_m6","cls":"mage","gender":"male","name":"墨羽咒師","accent":"#9aa6d6","src":"assets/heroes/mage_m6.png"},{"id":"px_mage_m7","cls":"mage","gender":"male","name":"碧潮學士","accent":"#7dd5d0","src":"assets/heroes/mage_m7.png"},{"id":"px_mage_m8","cls":"mage","gender":"male","name":"晴空術士","accent":"#c4e4ff","src":"assets/heroes/mage_m8.png"},{"id":"px_mage_f1","cls":"mage","gender":"female","name":"櫻莓魔女","accent":"#c7a5ff","src":"assets/heroes/mage_f1.png"},{"id":"px_mage_f2","cls":"mage","gender":"female","name":"紫晶占星","accent":"#c7a5ff","src":"assets/heroes/mage_f2.png"},{"id":"px_mage_f3","cls":"mage","gender":"female","name":"薄荷幻術","accent":"#c7a5ff","src":"assets/heroes/mage_f3.png"},{"id":"px_mage_f4","cls":"mage","gender":"female","name":"月霜魔女","accent":"#c7a5ff","src":"assets/heroes/mage_f4.png"},{"id":"px_mage_f5","cls":"mage","gender":"female","name":"赤砂星巫","accent":"#e4b1a0","src":"assets/heroes/mage_f5.png"},{"id":"px_mage_f6","cls":"mage","gender":"female","name":"墨夜書姬","accent":"#c0b3df","src":"assets/heroes/mage_f6.png"},{"id":"px_mage_f7","cls":"mage","gender":"female","name":"珊瑚幻歌","accent":"#f4aca5","src":"assets/heroes/mage_f7.png"},{"id":"px_mage_f8","cls":"mage","gender":"female","name":"青空魔女","accent":"#a6d9ef","src":"assets/heroes/mage_f8.png"},{"id":"px_ranger_m1","cls":"ranger","gender":"male","name":"森境遊俠","accent":"#91d69f","src":"assets/heroes/ranger_m1.png"},{"id":"px_ranger_m2","cls":"ranger","gender":"male","name":"月影獵手","accent":"#91d69f","src":"assets/heroes/ranger_m2.png"},{"id":"px_ranger_m3","cls":"ranger","gender":"male","name":"白羽風行","accent":"#91d69f","src":"assets/heroes/ranger_m3.png"},{"id":"px_ranger_m4","cls":"ranger","gender":"male","name":"日曜獵弓","accent":"#91d69f","src":"assets/heroes/ranger_m4.png"},{"id":"px_ranger_m5","cls":"ranger","gender":"male","name":"砂狼遊獵","accent":"#d9ba8c","src":"assets/heroes/ranger_m5.png"},{"id":"px_ranger_m6","cls":"ranger","gender":"male","name":"霧松巡林","accent":"#9fbfbd","src":"assets/heroes/ranger_m6.png"},{"id":"px_ranger_m7","cls":"ranger","gender":"male","name":"鷹眼機弩","accent":"#b4a8d5","src":"assets/heroes/ranger_m7.png"},{"id":"px_ranger_m8","cls":"ranger","gender":"male","name":"赤楓追跡","accent":"#dc9073","src":"assets/heroes/ranger_m8.png"},{"id":"px_ranger_f1","cls":"ranger","gender":"female","name":"花羽射手","accent":"#91d69f","src":"assets/heroes/ranger_f1.png"},{"id":"px_ranger_f2","cls":"ranger","gender":"female","name":"赤狐斥候","accent":"#91d69f","src":"assets/heroes/ranger_f2.png"},{"id":"px_ranger_f3","cls":"ranger","gender":"female","name":"星蘭追風","accent":"#91d69f","src":"assets/heroes/ranger_f3.png"},{"id":"px_ranger_f4","cls":"ranger","gender":"female","name":"青葉林守","accent":"#91d69f","src":"assets/heroes/ranger_f4.png"},{"id":"px_ranger_f5","cls":"ranger","gender":"female","name":"沙狐弓姬","accent":"#e1c184","src":"assets/heroes/ranger_f5.png"},{"id":"px_ranger_f6","cls":"ranger","gender":"female","name":"松霧巡守","accent":"#a0cfb5","src":"assets/heroes/ranger_f6.png"},{"id":"px_ranger_f7","cls":"ranger","gender":"female","name":"雷隼弩手","accent":"#b2aff4","src":"assets/heroes/ranger_f7.png"},{"id":"px_ranger_f8","cls":"ranger","gender":"female","name":"楓羽獵姬","accent":"#e8a47c","src":"assets/heroes/ranger_f8.png"},{"id":"px_cleric_m1","cls":"cleric","gender":"male","name":"晨光祭司","accent":"#ffe7a3","src":"assets/heroes/cleric_m1.png"},{"id":"px_cleric_m2","cls":"cleric","gender":"male","name":"白夜司祭","accent":"#ffe7a3","src":"assets/heroes/cleric_m2.png"},{"id":"px_cleric_m3","cls":"cleric","gender":"male","name":"月華聖使","accent":"#ffe7a3","src":"assets/heroes/cleric_m3.png"},{"id":"px_cleric_m4","cls":"cleric","gender":"male","name":"翠庭祝禱","accent":"#ffe7a3","src":"assets/heroes/cleric_m4.png"},{"id":"px_cleric_m5","cls":"cleric","gender":"male","name":"曦鐘司祭","accent":"#edd398","src":"assets/heroes/cleric_m5.png"},{"id":"px_cleric_m6","cls":"cleric","gender":"male","name":"海燈祝士","accent":"#9cd6d9","src":"assets/heroes/cleric_m6.png"},{"id":"px_cleric_m7","cls":"cleric","gender":"male","name":"暮星聖使","accent":"#c3ace7","src":"assets/heroes/cleric_m7.png"},{"id":"px_cleric_m8","cls":"cleric","gender":"male","name":"秋穗祭官","accent":"#dfbf7b","src":"assets/heroes/cleric_m8.png"},{"id":"px_cleric_f1","cls":"cleric","gender":"female","name":"月鈴聖女","accent":"#ffe7a3","src":"assets/heroes/cleric_f1.png"},{"id":"px_cleric_f2","cls":"cleric","gender":"female","name":"玫瑰祝禱","accent":"#ffe7a3","src":"assets/heroes/cleric_f2.png"},{"id":"px_cleric_f3","cls":"cleric","gender":"female","name":"星砂聖歌","accent":"#ffe7a3","src":"assets/heroes/cleric_f3.png"},{"id":"px_cleric_f4","cls":"cleric","gender":"female","name":"幽蘭祭司","accent":"#ffe7a3","src":"assets/heroes/cleric_f4.png"},{"id":"px_cleric_f5","cls":"cleric","gender":"female","name":"曦鈴聖詠","accent":"#f1d1a3","src":"assets/heroes/cleric_f5.png"},{"id":"px_cleric_f6","cls":"cleric","gender":"female","name":"海珠祝禱","accent":"#b0e5db","src":"assets/heroes/cleric_f6.png"},{"id":"px_cleric_f7","cls":"cleric","gender":"female","name":"暮星修女","accent":"#c7b8eb","src":"assets/heroes/cleric_f7.png"},{"id":"px_cleric_f8","cls":"cleric","gender":"female","name":"秋禾聖女","accent":"#e2b772","src":"assets/heroes/cleric_f8.png"},{"id":"px_berserker_m1","cls":"berserker","gender":"male","name":"赤焰戰魂","accent":"#ffa097","src":"assets/heroes/berserker_m1.png"},{"id":"px_berserker_m2","cls":"berserker","gender":"male","name":"冰狼戰將","accent":"#ffa097","src":"assets/heroes/berserker_m2.png"},{"id":"px_berserker_m3","cls":"berserker","gender":"male","name":"雷獅戰豪","accent":"#ffa097","src":"assets/heroes/berserker_m3.png"},{"id":"px_berserker_m4","cls":"berserker","gender":"male","name":"夜曜狂刃","accent":"#ffa097","src":"assets/heroes/berserker_m4.png"},{"id":"px_berserker_m5","cls":"berserker","gender":"male","name":"沙蠍戰魁","accent":"#ddaa77","src":"assets/heroes/berserker_m5.png"},{"id":"px_berserker_m6","cls":"berserker","gender":"male","name":"苔岩巨刃","accent":"#9fc498","src":"assets/heroes/berserker_m6.png"},{"id":"px_berserker_m7","cls":"berserker","gender":"male","name":"霹靂戰鼓","accent":"#b3adf3","src":"assets/heroes/berserker_m7.png"},{"id":"px_berserker_m8","cls":"berserker","gender":"male","name":"赤銅鐵衛","accent":"#d69772","src":"assets/heroes/berserker_m8.png"},{"id":"px_berserker_f1","cls":"berserker","gender":"female","name":"薔薇戰姬","accent":"#ffa097","src":"assets/heroes/berserker_f1.png"},{"id":"px_berserker_f2","cls":"berserker","gender":"female","name":"雷霆女王","accent":"#ffa097","src":"assets/heroes/berserker_f2.png"},{"id":"px_berserker_f3","cls":"berserker","gender":"female","name":"霜櫻戰姬","accent":"#ffa097","src":"assets/heroes/berserker_f3.png"},{"id":"px_berserker_f4","cls":"berserker","gender":"female","name":"翡翠戰嵐","accent":"#ffa097","src":"assets/heroes/berserker_f4.png"},{"id":"px_berserker_f5","cls":"berserker","gender":"female","name":"砂蠍戰姬","accent":"#daa879","src":"assets/heroes/berserker_f5.png"},{"id":"px_berserker_f6","cls":"berserker","gender":"female","name":"苔石戰蘭","accent":"#a5c7a4","src":"assets/heroes/berserker_f6.png"},{"id":"px_berserker_f7","cls":"berserker","gender":"female","name":"雷鼓戰姬","accent":"#bdb0f3","src":"assets/heroes/berserker_f7.png"},{"id":"px_berserker_f8","cls":"berserker","gender":"female","name":"熔銅鍛姬","accent":"#e6a66f","src":"assets/heroes/berserker_f8.png"},{"id":"px_assassin_m1","cls":"assassin","gender":"male","name":"夜行影刃","accent":"#7a86de","src":"assets/heroes/assassin_m1.png"},{"id":"px_assassin_m2","cls":"assassin","gender":"male","name":"白鴉密探","accent":"#c5e3ed","src":"assets/heroes/assassin_m2.png"},{"id":"px_assassin_m3","cls":"assassin","gender":"male","name":"赤月忍者","accent":"#e56e77","src":"assets/heroes/assassin_m3.png"},{"id":"px_assassin_m4","cls":"assassin","gender":"male","name":"沙漠幻影","accent":"#e4bd73","src":"assets/heroes/assassin_m4.png"},{"id":"px_assassin_m5","cls":"assassin","gender":"male","name":"紫電夜客","accent":"#b38df2","src":"assets/heroes/assassin_m5.png"},{"id":"px_assassin_m6","cls":"assassin","gender":"male","name":"薔薇紳士","accent":"#d779a0","src":"assets/heroes/assassin_m6.png"},{"id":"px_assassin_m7","cls":"assassin","gender":"male","name":"深海掠影","accent":"#58b8ba","src":"assets/heroes/assassin_m7.png"},{"id":"px_assassin_m8","cls":"assassin","gender":"male","name":"黃昏狐影","accent":"#f4a866","src":"assets/heroes/assassin_m8.png"},{"id":"px_assassin_f1","cls":"assassin","gender":"female","name":"月下影刃","accent":"#a99be7","src":"assets/heroes/assassin_f1.png"},{"id":"px_assassin_f2","cls":"assassin","gender":"female","name":"霜羽密探","accent":"#b8e8f0","src":"assets/heroes/assassin_f2.png"},{"id":"px_assassin_f3","cls":"assassin","gender":"female","name":"紅蝶忍者","accent":"#ef818a","src":"assets/heroes/assassin_f3.png"},{"id":"px_assassin_f4","cls":"assassin","gender":"female","name":"綠洲舞刃","accent":"#66c7b5","src":"assets/heroes/assassin_f4.png"},{"id":"px_assassin_f5","cls":"assassin","gender":"female","name":"雷紫追獵","accent":"#b193eb","src":"assets/heroes/assassin_f5.png"},{"id":"px_assassin_f6","cls":"assassin","gender":"female","name":"黑薔薇刺客","accent":"#dc88b6","src":"assets/heroes/assassin_f6.png"},{"id":"px_assassin_f7","cls":"assassin","gender":"female","name":"珊瑚幽影","accent":"#6bcdd8","src":"assets/heroes/assassin_f7.png"},{"id":"px_assassin_f8","cls":"assassin","gender":"female","name":"秋火狐影","accent":"#e9a967","src":"assets/heroes/assassin_f8.png"},{"id":"px_monk_m1","cls":"monk","gender":"male","name":"金剛武僧","accent":"#e5b367","src":"assets/heroes/monk_m1.png"},{"id":"px_monk_m2","cls":"monk","gender":"male","name":"蒼龍拳師","accent":"#69b7d9","src":"assets/heroes/monk_m2.png"},{"id":"px_monk_m3","cls":"monk","gender":"male","name":"赤焰鬥僧","accent":"#e87b63","src":"assets/heroes/monk_m3.png"},{"id":"px_monk_m4","cls":"monk","gender":"male","name":"白蓮行者","accent":"#d8d8ef","src":"assets/heroes/monk_m4.png"},{"id":"px_monk_m5","cls":"monk","gender":"male","name":"翠竹宗師","accent":"#82c38b","src":"assets/heroes/monk_m5.png"},{"id":"px_monk_m6","cls":"monk","gender":"male","name":"雷鳴拳王","accent":"#a7a3ef","src":"assets/heroes/monk_m6.png"},{"id":"px_monk_m7","cls":"monk","gender":"male","name":"山岩護法","accent":"#b59c83","src":"assets/heroes/monk_m7.png"},{"id":"px_monk_m8","cls":"monk","gender":"male","name":"星辰禪師","accent":"#8eb8e6","src":"assets/heroes/monk_m8.png"},{"id":"px_monk_f1","cls":"monk","gender":"female","name":"蓮心武僧","accent":"#ecb36e","src":"assets/heroes/monk_f1.png"},{"id":"px_monk_f2","cls":"monk","gender":"female","name":"碧龍拳姬","accent":"#72c0d8","src":"assets/heroes/monk_f2.png"},{"id":"px_monk_f3","cls":"monk","gender":"female","name":"火花鬥姬","accent":"#f09a76","src":"assets/heroes/monk_f3.png"},{"id":"px_monk_f4","cls":"monk","gender":"female","name":"雪蓮行者","accent":"#d5c6ee","src":"assets/heroes/monk_f4.png"},{"id":"px_monk_f5","cls":"monk","gender":"female","name":"青竹拳師","accent":"#94c697","src":"assets/heroes/monk_f5.png"},{"id":"px_monk_f6","cls":"monk","gender":"female","name":"紫霆拳姬","accent":"#b0a2ed","src":"assets/heroes/monk_f6.png"},{"id":"px_monk_f7","cls":"monk","gender":"female","name":"琥珀護法","accent":"#d6b27d","src":"assets/heroes/monk_f7.png"},{"id":"px_monk_f8","cls":"monk","gender":"female","name":"星願禪師","accent":"#9cc8e6","src":"assets/heroes/monk_f8.png"},{"id":"px_bard_m1","cls":"bard","gender":"male","name":"旅風吟遊","accent":"#7bc9b4","src":"assets/heroes/bard_m1.png"},{"id":"px_bard_m2","cls":"bard","gender":"male","name":"月琴樂師","accent":"#a6a2e2","src":"assets/heroes/bard_m2.png"},{"id":"px_bard_m3","cls":"bard","gender":"male","name":"烈日歌者","accent":"#edb66a","src":"assets/heroes/bard_m3.png"},{"id":"px_bard_m4","cls":"bard","gender":"male","name":"玫瑰詩人","accent":"#e494b8","src":"assets/heroes/bard_m4.png"},{"id":"px_bard_m5","cls":"bard","gender":"male","name":"航海樂客","accent":"#79b9db","src":"assets/heroes/bard_m5.png"},{"id":"px_bard_m6","cls":"bard","gender":"male","name":"星夜奏者","accent":"#bd9bed","src":"assets/heroes/bard_m6.png"},{"id":"px_bard_m7","cls":"bard","gender":"male","name":"秋葉民謠","accent":"#d1ad70","src":"assets/heroes/bard_m7.png"},{"id":"px_bard_m8","cls":"bard","gender":"male","name":"宮廷首席","accent":"#84cbd0","src":"assets/heroes/bard_m8.png"},{"id":"px_bard_f1","cls":"bard","gender":"female","name":"晨風吟遊","accent":"#87d3b5","src":"assets/heroes/bard_f1.png"},{"id":"px_bard_f2","cls":"bard","gender":"female","name":"月弦樂姬","accent":"#bab1ed","src":"assets/heroes/bard_f2.png"},{"id":"px_bard_f3","cls":"bard","gender":"female","name":"暖陽歌姬","accent":"#efc27f","src":"assets/heroes/bard_f3.png"},{"id":"px_bard_f4","cls":"bard","gender":"female","name":"薔薇詩姬","accent":"#eaa2c5","src":"assets/heroes/bard_f4.png"},{"id":"px_bard_f5","cls":"bard","gender":"female","name":"潮聲樂師","accent":"#88cadf","src":"assets/heroes/bard_f5.png"},{"id":"px_bard_f6","cls":"bard","gender":"female","name":"星夢奏者","accent":"#c6a9ee","src":"assets/heroes/bard_f6.png"},{"id":"px_bard_f7","cls":"bard","gender":"female","name":"楓林歌者","accent":"#dfb97b","src":"assets/heroes/bard_f7.png"},{"id":"px_bard_f8","cls":"bard","gender":"female","name":"皇家首席","accent":"#90d5d6","src":"assets/heroes/bard_f8.png"}];
  const byId = Object.fromEntries(ACTORS.map(a => [a.id, a]));
  const imageCache = new Map(), states = new WeakMap();
  // 圖集增至 128 張後，保留最近使用的 24 張；畫面內與出招中的角色不回收。
  const CACHE_LIMIT = 24;
  function trimCache(keep) {
    if (imageCache.size <= CACHE_LIMIT) return;
    const live = new Set([keep]);
    document.querySelectorAll('.hero-sprite canvas').forEach(canvas => {
      const action = states.get(canvas)?.action, box = canvas.getBoundingClientRect();
      if (action || (canvas.offsetParent !== null && box.bottom >= 0 && box.top <= innerHeight + 180)) live.add(canvas.parentElement.dataset.heroActor);
    });
    for (const [id, item] of imageCache) {
      if (imageCache.size <= CACHE_LIMIT) break;
      if (item.status !== 'loading' && !live.has(id)) imageCache.delete(id);
    }
  }
  const get = id => byId[String(id).replace(/^ha:/, '')];
  const timing = { attack: 650, critical: 850 };
  /* 畫布比角色格子（160×160）多出左右各 32、上方 64 的空間，讓大揮武器的姿勢不被裁掉，
     這樣才能依角色本身的身高統一大小，而不是被最寬的出招姿勢限制。腳底 pivot 仍在格內 (80,157)。 */
  const BOX = 160, OX = 32, OY = 64, CW = BOX + OX * 2, CH = BOX + OY;
  /* 待機身高（畫布像素）。營地裡寵物約 57px／66px 格，勇者 124px 格時此值約為寵物的 1.7 倍。 */
  const TARGET_H = 128;
  const scaleCache = new Map();
  function scaleFor(a, r) {
    const stored = window.HERO_ATLAS && window.HERO_ATLAS[a.id];
    if (!stored || !stored.frames || !stored.frames[0]) { const refH = r.scaleH || r.h; return Math.min(146 / refH, 156 / (r.scaleW || Math.max(r.w, refH * .8))); }
    if (scaleCache.has(a.id)) return scaleCache.get(a.id);
    const idle = stored.frames[0];
    // 身高指標：待機姿勢外框高與「像素面積開根號」各佔一半（帽子、長杖、翹髮不會讓角色被縮太多）
    const metric = idle.h * .5 + Math.sqrt(idle.area) * 1.47 * .5;
    let scale = TARGET_H / metric;
    // 安全上限：所有姿勢（含出招）都要放得進擴大後的畫布
    stored.frames.forEach(f => {
      const half = Math.max(f.pivotX, f.w - f.pivotX), up = f.pivotY;
      scale = Math.min(scale, (OX + 80 - 3) / half, (OY + 157 - 3) / up);
    });
    scaleCache.set(a.id, scale); return scale;
  }
  function html(id, size = 96, cls = '', style = '') {
    const a = get(id); if (!a) return '';
    return '<span class="sp hero-sprite ' + cls.replace(/anim-bob/g,'') + '" data-hero-actor="' + a.id + '" style="width:' + size + 'px;height:' + size + 'px;' + style + '"><canvas width="'+CW+'" height="'+CH+'" role="img" aria-label="' + a.name + '"></canvas></span>';
  }
  function load(a) {
    if (imageCache.has(a.id)) {
      const cached = imageCache.get(a.id);
      imageCache.delete(a.id); imageCache.set(a.id, cached);
      trimCache(a.id);
      return cached;
    }
    const item = { status: 'loading', image: new Image() };
    imageCache.set(a.id, item);
    item.ready = new Promise(resolve => {
      item.image.onload = () => { item.status = 'ready'; trimCache(a.id); resolve(item); };
      item.image.onerror = () => { item.status = 'error'; trimCache(a.id); resolve(item); };
    });
    item.image.src = a.src;
    return item;
  }
  function state(canvas) {
    let st = states.get(canvas);
    if (!st) { st = { born: performance.now(), action: null, last: '' }; states.set(canvas,st); }
    return st;
  }
  function paint(ctx,image,r,x,y,scale) {
    ctx.save();
    if(r.cut && r.cut.length) {
      ctx.beginPath();ctx.rect(x,y,r.w*scale,r.h*scale);
      r.cut.forEach(([cx,cy,cw])=>ctx.rect(x+cx*scale,y+cy*scale,cw*scale,scale));
      ctx.clip('evenodd');
    }
    ctx.drawImage(image,r.x,r.y,r.w,r.h,x,y,r.w*scale,r.h*scale);
    ctx.restore();
  }
  function rect(a, image, frame) {
    const stored = window.HERO_ATLAS && window.HERO_ATLAS[a.id];
    if (stored && stored.frames && stored.frames[frame]) return stored.frames[frame];
    const w = image.naturalWidth / 4, h = image.naturalHeight / 2;
    return { x: (frame % 4) * w, y: Math.floor(frame / 4) * h, w, h,
      pivotX: w / 2, pivotY: h * .96, scaleH: h };
  }
  function render(canvas, now) {
    const a = get(canvas.parentElement.dataset.heroActor); if (!a) return;
    const item = load(a); if (item.status !== 'ready') return;
    const st = state(canvas), action = st.action;
    let frame = 0, x = 0, y = 0, rot = 0, pulse = 1, progress = 0;
    if (action) {
      progress = Math.min(1, (now - action.start) / action.duration);
      if (progress >= 1) { st.action = null; }
      else if (action.kind === 'critical') {
        frame = progress < .36 ? 6 : progress < .82 ? 7 : 0;
        x = progress < .36 ? -3 : progress < .75 ? 4 : 0;
        y = progress < .36 ? 1 : -2;
      } else {
        frame = progress < .18 ? 0 : progress < .38 ? 6 : progress < .82 ? 2 + action.variant : 0;
        const beat = Math.sin(progress * Math.PI);
        if (action.variant === 0) { x = Math.round(beat * 5); rot = beat * .045; }
        if (action.variant === 1) { x = Math.round(beat * 7); y = Math.round(-beat * 2); }
        if (action.variant === 2) { y = Math.round(-beat * 8); rot = -beat * .035; }
        if (action.variant === 3) { x = Math.round(Math.sin(progress * Math.PI * 2) * 4); rot = Math.sin(progress * Math.PI * 2) * .07; }
      }
    }
    if (!st.action) {
      const elapsed = now - st.born;
      frame = elapsed % 3900 > 3500 && elapsed % 3900 < 3720 ? 1 : 0;
      y = Math.round(Math.sin(elapsed / 600) * 1.1);
    }
    const r = rect(a,item.image,frame);
    // 每個角色依待機身高統一大小（見 scaleFor）；各姿勢共用比例，以腳部 pivot 對齊，保留伸出去的武器和披風。
    const scale = scaleFor(a, r);
    const drawX = 80 - (r.pivotX || r.w / 2) * scale;
    const drawY = 157 - (r.pivotY || r.h) * scale;
    // 放大角色後仍留住伸出的武器；約束局部晃動，不裁掉圖集內容。
    const bounds = angle => {
      const co=Math.cos(angle),si=Math.sin(angle);
      const corners=[[drawX,drawY],[drawX+r.w*scale,drawY],[drawX,drawY+r.h*scale],[drawX+r.w*scale,drawY+r.h*scale]].map(([px,py])=>[80+(px-80)*co-(py-157)*si,157+(px-80)*si+(py-157)*co]);
      return {left:Math.min(...corners.map(p=>p[0])),right:Math.max(...corners.map(p=>p[0])),top:Math.min(...corners.map(p=>p[1])),bottom:Math.max(...corners.map(p=>p[1]))};
    };
    let edge=bounds(rot);
    if(edge.right-edge.left>CW-4||edge.bottom-edge.top>CH-4){rot=0;edge=bounds(0);}
    x=Math.max(2-OX-edge.left,Math.min(x,BOX+OX-2-edge.right));
    y=Math.max(2-OY-edge.top,Math.min(y,BOX-2-edge.bottom));
    const key = [frame,x,y,Math.round(rot*100),action && action.kind,Math.round(progress*15)].join('|');
    if (st.last === key) return; st.last = key;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,CW,CH); ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.translate(OX,OY); ctx.translate(80+x,157+y); ctx.rotate(rot); ctx.translate(-80,-157);
    if (action && action.kind === 'critical' && progress < .45) {
      ctx.strokeStyle = a.accent; ctx.lineWidth=2;
      const radius = 15 + Math.round(progress*45); ctx.beginPath();
      ctx.arc(80,96,radius,0,Math.PI*2); ctx.stroke();
      for(let i=0;i<6;i++){const angle=i*Math.PI/3+progress*4;ctx.fillStyle=a.accent;ctx.fillRect(Math.round(80+Math.cos(angle)*radius),Math.round(96+Math.sin(angle)*radius),3,3);}
    }
    paint(ctx,item.image,r,Math.round(drawX),Math.round(drawY),scale);
    ctx.restore();
    canvas.dataset.pose = String(frame);
  }
  function canvasOf(target) {
    if (!target) return null;
    if (target.matches && target.matches('.hero-sprite canvas')) return target;
    return target.querySelector('.hero-sprite canvas');
  }
  async function play(target, kind='attack', variant=0, duration) {
    const canvas=canvasOf(target); if(!canvas) return false;
    const a=get(canvas.parentElement.dataset.heroActor); if(!a)return false;
    await load(a).ready; if(!canvas.isConnected)return false;
    const st=state(canvas), action={kind,variant:Math.max(0,Math.min(3,variant)),duration:duration||timing[kind]||650,start:performance.now()};
    st.action=action; st.last=''; render(canvas,action.start);
    await new Promise(resolve=>setTimeout(resolve,action.duration));
    if(st.action===action){st.action=null;st.last='';if(canvas.isConnected)render(canvas,performance.now());}
    return true;
  }
  function frame(target,index) {
    const canvas=canvasOf(target);if(!canvas)return;
    const a=get(canvas.parentElement.dataset.heroActor);
    return load(a).ready.then(()=>{const st=state(canvas);st.action=null;st.last='';
      const r=rect(a,load(a).image,index),ctx=canvas.getContext('2d'),scale=scaleFor(a,r);
      // 靜態姿勢與即時播放採相同的 2px 畫布安全邊界，保留腳下的小型光點。
      const x=Math.max(2,Math.min(OX+80-(r.pivotX||r.w/2)*scale,CW-2-r.w*scale));
      const y=Math.max(2,Math.min(OY+157-(r.pivotY||r.h)*scale,CH-2-r.h*scale));
      ctx.clearRect(0,0,CW,CH);ctx.imageSmoothingEnabled=false;paint(ctx,load(a).image,r,x,y,scale);canvas.dataset.pose=String(index);});
  }
  setInterval(()=>{
    if(document.hidden)return;
    const now=performance.now();
    document.querySelectorAll('.hero-sprite canvas').forEach(canvas=>{
      if(canvas.offsetParent===null||canvas.closest('[data-static-hero]'))return;
      const box=canvas.getBoundingClientRect();if(box.bottom<0||box.top>innerHeight+180)return;
      render(canvas,now);
    });
  },65);
  return {ACTORS,get,html,play,frame,load,timing,get cacheSize(){return imageCache.size;},cacheLimit:CACHE_LIMIT};
})();
window.HeroAnim=HeroAnim;
{
  /* 保留舊款價格；三個新職業的男女第一款為免費預設外觀。 */
  const NEW_SKIN_COST=[160,180,200,240,200,220,240,260];
  const legacySkinIcon=C.skinIcon;
  C.skinIcon=sk=>sk.actor?'ha:'+sk.actor:legacySkinIcon(sk);
  C.CLASSES.forEach(k=>{
    const additions=HeroAnim.ACTORS.filter(a=>a.cls===k.id).map(a=>({id:a.id,name:a.name,actor:a.id,gender:a.gender,cost:a.id==='px_knight_m2'||(['assassin','monk','bard'].includes(a.cls)&&/_[mf]1$/.test(a.id))?0:NEW_SKIN_COST[Number(a.id.match(/(\d+)$/)[1])-1]}));
    C.HERO_SKINS[k.id]=(C.HERO_SKINS[k.id]||[]).concat(additions);
  });
}

