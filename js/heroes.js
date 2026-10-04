/* AI 像素角色：每人 8 個原繪姿勢；待機、4 種攻擊、暴擊。可 file:// 使用。 */
const HeroAnim = (() => {
  const ACTORS = [{"id":"px_knight_m1","cls":"knight","gender":"male","name":"月白誓約","src":"assets/heroes/knight_m1.png","accent":"#b6cfff"},{"id":"px_knight_m2","cls":"knight","gender":"male","name":"薔薇近衛","src":"assets/heroes/knight_m2.png","accent":"#b6cfff"},{"id":"px_knight_m3","cls":"knight","gender":"male","name":"蒼海巡誓","src":"assets/heroes/knight_m3.png","accent":"#b6cfff"},{"id":"px_knight_m4","cls":"knight","gender":"male","name":"琥珀王衛","src":"assets/heroes/knight_m4.png","accent":"#b6cfff"},{"id":"px_knight_f1","cls":"knight","gender":"female","name":"晨曦女騎","src":"assets/heroes/knight_f1.png","accent":"#b6cfff"},{"id":"px_knight_f2","cls":"knight","gender":"female","name":"紫藤劍姬","src":"assets/heroes/knight_f2.png","accent":"#b6cfff"},{"id":"px_knight_f3","cls":"knight","gender":"female","name":"緋櫻守望","src":"assets/heroes/knight_f3.png","accent":"#b6cfff"},{"id":"px_knight_f4","cls":"knight","gender":"female","name":"夜藍劍華","src":"assets/heroes/knight_f4.png","accent":"#b6cfff"},{"id":"px_mage_m1","cls":"mage","gender":"male","name":"星夜魔導","src":"assets/heroes/mage_m1.png","accent":"#c7a5ff"},{"id":"px_mage_m2","cls":"mage","gender":"male","name":"霜雪學者","src":"assets/heroes/mage_m2.png","accent":"#c7a5ff"},{"id":"px_mage_m3","cls":"mage","gender":"male","name":"翠玉術士","src":"assets/heroes/mage_m3.png","accent":"#c7a5ff"},{"id":"px_mage_m4","cls":"mage","gender":"male","name":"暮焰秘法","src":"assets/heroes/mage_m4.png","accent":"#c7a5ff"},{"id":"px_mage_f1","cls":"mage","gender":"female","name":"櫻莓魔女","src":"assets/heroes/mage_f1.png","accent":"#c7a5ff"},{"id":"px_mage_f2","cls":"mage","gender":"female","name":"紫晶占星","src":"assets/heroes/mage_f2.png","accent":"#c7a5ff"},{"id":"px_mage_f3","cls":"mage","gender":"female","name":"薄荷幻術","src":"assets/heroes/mage_f3.png","accent":"#c7a5ff"},{"id":"px_mage_f4","cls":"mage","gender":"female","name":"月霜魔女","src":"assets/heroes/mage_f4.png","accent":"#c7a5ff"},{"id":"px_ranger_m1","cls":"ranger","gender":"male","name":"森境遊俠","src":"assets/heroes/ranger_m1.png","accent":"#91d69f"},{"id":"px_ranger_m2","cls":"ranger","gender":"male","name":"月影獵手","src":"assets/heroes/ranger_m2.png","accent":"#91d69f"},{"id":"px_ranger_m3","cls":"ranger","gender":"male","name":"白羽風行","src":"assets/heroes/ranger_m3.png","accent":"#91d69f"},{"id":"px_ranger_m4","cls":"ranger","gender":"male","name":"日曜獵弓","src":"assets/heroes/ranger_m4.png","accent":"#91d69f"},{"id":"px_ranger_f1","cls":"ranger","gender":"female","name":"花羽射手","src":"assets/heroes/ranger_f1.png","accent":"#91d69f"},{"id":"px_ranger_f2","cls":"ranger","gender":"female","name":"赤狐斥候","src":"assets/heroes/ranger_f2.png","accent":"#91d69f"},{"id":"px_ranger_f3","cls":"ranger","gender":"female","name":"星蘭追風","src":"assets/heroes/ranger_f3.png","accent":"#91d69f"},{"id":"px_ranger_f4","cls":"ranger","gender":"female","name":"青葉林守","src":"assets/heroes/ranger_f4.png","accent":"#91d69f"},{"id":"px_cleric_m1","cls":"cleric","gender":"male","name":"晨光祭司","src":"assets/heroes/cleric_m1.png","accent":"#ffe7a3"},{"id":"px_cleric_m2","cls":"cleric","gender":"male","name":"白夜司祭","src":"assets/heroes/cleric_m2.png","accent":"#ffe7a3"},{"id":"px_cleric_m3","cls":"cleric","gender":"male","name":"月華聖使","src":"assets/heroes/cleric_m3.png","accent":"#ffe7a3"},{"id":"px_cleric_m4","cls":"cleric","gender":"male","name":"翠庭祝禱","src":"assets/heroes/cleric_m4.png","accent":"#ffe7a3"},{"id":"px_cleric_f1","cls":"cleric","gender":"female","name":"月鈴聖女","src":"assets/heroes/cleric_f1.png","accent":"#ffe7a3"},{"id":"px_cleric_f2","cls":"cleric","gender":"female","name":"玫瑰祝禱","src":"assets/heroes/cleric_f2.png","accent":"#ffe7a3"},{"id":"px_cleric_f3","cls":"cleric","gender":"female","name":"星砂聖歌","src":"assets/heroes/cleric_f3.png","accent":"#ffe7a3"},{"id":"px_cleric_f4","cls":"cleric","gender":"female","name":"幽蘭祭司","src":"assets/heroes/cleric_f4.png","accent":"#ffe7a3"},{"id":"px_berserker_m1","cls":"berserker","gender":"male","name":"赤焰戰魂","src":"assets/heroes/berserker_m1.png","accent":"#ffa097"},{"id":"px_berserker_m2","cls":"berserker","gender":"male","name":"冰狼戰將","src":"assets/heroes/berserker_m2.png","accent":"#ffa097"},{"id":"px_berserker_m3","cls":"berserker","gender":"male","name":"雷獅戰豪","src":"assets/heroes/berserker_m3.png","accent":"#ffa097"},{"id":"px_berserker_m4","cls":"berserker","gender":"male","name":"夜曜狂刃","src":"assets/heroes/berserker_m4.png","accent":"#ffa097"},{"id":"px_berserker_f1","cls":"berserker","gender":"female","name":"薔薇戰姬","src":"assets/heroes/berserker_f1.png","accent":"#ffa097"},{"id":"px_berserker_f2","cls":"berserker","gender":"female","name":"雷霆女王","src":"assets/heroes/berserker_f2.png","accent":"#ffa097"},{"id":"px_berserker_f3","cls":"berserker","gender":"female","name":"霜櫻戰姬","src":"assets/heroes/berserker_f3.png","accent":"#ffa097"},{"id":"px_berserker_f4","cls":"berserker","gender":"female","name":"翡翠戰嵐","src":"assets/heroes/berserker_f4.png","accent":"#ffa097"}];
  const byId = Object.fromEntries(ACTORS.map(a => [a.id, a]));
  const imageCache = new Map(), states = new WeakMap();
  const get = id => byId[String(id).replace(/^ha:/, '')];
  const timing = { attack: 650, critical: 850 };
  function html(id, size = 96, cls = '', style = '') {
    const a = get(id); if (!a) return '';
    return '<span class="sp hero-sprite ' + cls.replace(/anim-bob/g,'') + '" data-hero-actor="' + a.id + '" style="width:' + size + 'px;height:' + size + 'px;' + style + '"><canvas width="160" height="160" role="img" aria-label="' + a.name + '"></canvas></span>';
  }
  function load(a) {
    if (imageCache.has(a.id)) return imageCache.get(a.id);
    const item = { status: 'loading', image: new Image() };
    imageCache.set(a.id, item);
    item.ready = new Promise(resolve => {
      item.image.onload = () => { item.status = 'ready'; resolve(item); };
      item.image.onerror = () => { item.status = 'error'; resolve(item); };
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
    const referenceH = r.scaleH || r.h;
    // 素材姿勢共用比例；以腳部 pivot 對齊，保留伸出去的武器和披風。
    const scale = Math.min(146 / referenceH, 156 / (r.scaleW || Math.max(r.w,referenceH * .8)));
    const drawX = 80 - (r.pivotX || r.w / 2) * scale;
    const drawY = 157 - (r.pivotY || r.h) * scale;
    const key = [frame,x,y,Math.round(rot*100),action && action.kind,Math.round(progress*15)].join('|');
    if (st.last === key) return; st.last = key;
    const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,160,160); ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.translate(80+x,157+y); ctx.rotate(rot); ctx.translate(-80,-157);
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
      const r=rect(a,load(a).image,index),ctx=canvas.getContext('2d'),scale=Math.min(146/(r.scaleH||r.h),156/(r.scaleW||Math.max(r.w,(r.scaleH||r.h)*.8)));
      ctx.clearRect(0,0,160,160);ctx.imageSmoothingEnabled=false;paint(ctx,load(a).image,r,80-(r.pivotX||r.w/2)*scale,157-(r.pivotY||r.h)*scale,scale);canvas.dataset.pose=String(index);});
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
  return {ACTORS,get,html,play,frame,load,timing};
})();
window.HeroAnim=HeroAnim;
{
  /* 新造型比經典造型（60～120 魂晶）貴：依款式 1～4 */
  const NEW_SKIN_COST=[160,180,200,240];
  const legacySkinIcon=C.skinIcon;
  C.skinIcon=sk=>sk.actor?'ha:'+sk.actor:legacySkinIcon(sk);
  C.CLASSES.forEach(k=>{
    const additions=HeroAnim.ACTORS.filter(a=>a.cls===k.id).map(a=>({id:a.id,name:a.name,actor:a.id,gender:a.gender,cost:NEW_SKIN_COST[Number(a.id.slice(-1))-1]}));
    C.HERO_SKINS[k.id]=C.HERO_SKINS[k.id].concat(additions);
  });
}

