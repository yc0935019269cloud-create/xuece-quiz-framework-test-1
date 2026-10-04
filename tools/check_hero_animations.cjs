/* Integration QA in disposable browser contexts; backs up/restores that context's localStorage. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/hero-art');
const url=process.env.HERO_TEST_URL||'http://127.0.0.1:8965/index.html';
const report={actors:0,poses:0,wardrobe:0,classes:[],errors:[],offline:false,mobile:false};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.addInitScript(()=>{window.__heroStorageBackup=Object.fromEntries(Object.entries(localStorage));});
 try{
  await page.goto(url);await page.waitForFunction(()=>typeof App!=='undefined'&&typeof Store!=='undefined'&&document.querySelector('.modal-bg'));
  await page.evaluate(async()=>{
   Store.profile.starterPicked=true;Store.profile.gems=222;
   C.CLASSES.forEach(c=>Store.profile.classes[c.id]={lv:1,xp:0});
   Store.profile.ownedHeroSkins=['knight:crimson'];
   SFX.play=()=>{};BGM.play=()=>{};
   await Promise.all(HeroAnim.ACTORS.map(a=>HeroAnim.load(a).ready));
   window.__motions=[];window.__attacks=[];
   const play=HeroAnim.play;HeroAnim.play=async(...args)=>{__motions.push({kind:args[1],variant:args[2],id:args[0]?.querySelector('[data-hero-actor]')?.dataset.heroActor});return play(...args)};
   const attack=FX.attack;FX.attack=async(...args)=>{const name=await attack(...args);__attacks.push(name);return name;};
   App.go('classes');
  });
  const definition=await page.evaluate(()=>HeroAnim.ACTORS.map(a=>({id:a.id,cls:a.cls,gender:a.gender})));
  assert.equal(definition.length,40);report.actors=40;
  for(const cls of ['knight','mage','ranger','cleric','berserker']){
   assert.equal(definition.filter(a=>a.cls===cls&&a.gender==='male').length,4);
   assert.equal(definition.filter(a=>a.cls===cls&&a.gender==='female').length,4);
   await page.evaluate(cls=>{Store.profile.activeClass=cls;App.go('classes')},cls);
   const classIndex=['knight','mage','ranger','cleric','berserker'].indexOf(cls);
   await page.locator('.class-card').nth(classIndex).locator('button.pink').click();
   await page.locator('[data-hgroup="male"]').click();assert.equal(await page.locator('[data-sk]').count(),4);
   await page.locator('[data-hgroup="female"]').click();assert.equal(await page.locator('[data-sk]').count(),4);
   await page.locator('[data-hgroup="all"]').click();assert.equal(await page.locator('[data-sk]').count(),8);
   for(const a of definition.filter(a=>a.cls===cls)){
    await page.locator('[data-sk="'+a.id+'"]').click();
    const big=page.locator('#hsk .big-stage [data-hero-actor]');assert.equal(await big.getAttribute('data-hero-actor'),a.id);
    if(await page.locator('#hwear').count())await page.locator('#hwear').click();
    assert.equal(await page.evaluate(()=>Store.profile.gems),222);
    assert.equal(await page.evaluate(cls=>Store.heroTile(cls),cls),'ha:'+a.id);
    report.wardrobe++;
   }
   if(cls==='knight'){
    await page.locator('[data-hgroup="classic"]').click();await page.locator('[data-sk="crimson"]').click();await page.locator('#hwear').click();
    assert.equal(await page.evaluate(()=>Store.heroTile('knight')),'sk:97_crimson');
    await page.locator('[data-hgroup="all"]').click();await page.locator('[data-sk="px_knight_f1"]').click();await page.locator('#hwear').click();
   }
   await page.locator('#modalRoot button.close').click();
  }
  // Reload verifies durable choices while leaving other profile fields intact.
  const before=await page.evaluate(()=>JSON.parse(JSON.stringify(Store.profile.heroSkin)));
  await page.reload();await page.waitForFunction(()=>typeof App!=='undefined'&&document.getElementById('cHero'));
  assert.deepEqual(await page.evaluate(()=>Store.profile.heroSkin),before);
  await page.evaluate(()=>{SFX.play=()=>{};BGM.play=()=>{};});
  for(const cls of ['knight','mage','ranger','cleric','berserker']){
   await page.evaluate(cls=>{
    Store.profile.activeClass=cls;Store.profile.heroSkin[cls]='px_'+cls+'_f1';
    const q=Object.values(Store.Q).find(q=>q.type==='single'&&q.key?.length===1);
    const run=Run.create({mode:'free',cls,types:['single'],subjects:[q.subj],count:3},[q.id,q.id,q.id]);run.p.crit=cls==='knight'?1:0;run.p.atk=1;
    App.go('run',run);run.s.mon.hp=9999;run.s.mon.maxHp=9999;
    window.__done=0;const original=FX.attack;FX.attack=async(...args)=>{const name=await original(...args);__done++;return name;};
   },cls);
   await page.waitForFunction(()=>document.querySelector('#eHero [data-hero-actor] canvas')?.dataset.pose);
   if(await page.locator('#modalRoot .modal-bg').count()) await page.getByRole('button',{name:'迎戰！',exact:true}).click();
   const label=await page.evaluate(()=>Store.Q[CUR.s.curQ].key[0]);
   await page.locator('.opt[data-l="'+label+'"]').click();
   await page.waitForFunction(()=>__done>0);
   assert.equal(await page.evaluate(()=>CUR.s.stats.correct),1);
   const cycle=await page.evaluate(async cls=>{
    const names=[];for(let i=0;i<4;i++)names.push(await FX.attack(cls,{}));
    await FX.critical(cls);return {names,variants:Object.keys(FX.ATTACKS[cls])};
   },cls);
   assert.equal(cycle.variants.length,4);
   // Shuffle bag coverage over whole 4-item bags, independent from prior attacks.
   const distribution=await page.evaluate(cls=>{const hits={};for(let i=0;i<400;i++){const n=FX.pickAttack(cls);hits[n]=(hits[n]||0)+1;}return hits},cls);
   assert.equal(Object.keys(distribution).length,4);assert(Object.values(distribution).every(n=>Math.abs(n-100)<=1));
   await page.locator('#stage').screenshot({path:path.join(out,'screenshots','battle-'+cls+'.png')});
   report.classes.push({cls,answerFlow:true,variants:cycle.variants,distribution});
   console.log('battle checked:',cls);
  }
  await page.evaluate(()=>{App.go('classes');});
  const frameResult=await page.evaluate(async()=>{
   const host=document.createElement('div');host.style='position:fixed;left:0;top:0;display:flex;z-index:10000;background:#182036';document.body.appendChild(host);
   let count=0;const failed=[];
   for(const a of HeroAnim.ACTORS){
    host.innerHTML=HeroAnim.html(a.id,160);host.dataset.staticHero='1';
    const hashes=[];
    for(let f=0;f<8;f++){
     await HeroAnim.frame(host,f);const cv=host.querySelector('canvas'),data=cv.getContext('2d').getImageData(0,0,160,160).data;
     let alpha=0,hash=2166136261;for(let j=0;j<data.length;j++){hash=Math.imul(hash^data[j],16777619)>>>0;if(j%4===3&&data[j]>40)alpha++;}
     if(alpha<300)failed.push(a.id+':'+f+':blank');
     hashes.push(hash);count++;
    }
    if(new Set(hashes).size<7)failed.push(a.id+':duplicate poses');
   }
   host.remove();return {count,failed};
  });
  assert.deepEqual(frameResult.failed,[]);report.poses=frameResult.count;
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{App.go('classes')});await page.locator('.class-card').first().locator('button.pink').click();
  await page.locator('[data-hgroup="female"]').click();assert.equal(await page.locator('[data-sk]').count(),4);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));report.mobile=true;
  await page.screenshot({path:path.join(out,'screenshots','wardrobe-mobile.png'),fullPage:true});
  assert.deepEqual(report.errors,[]);
 }finally{
  await page.evaluate(()=>{localStorage.clear();Object.entries(window.__heroStorageBackup||{}).forEach(([k,v])=>localStorage.setItem(k,v));}).catch(()=>{});
  await context.close();
 }
 const offline=await browser.newContext();const op=await offline.newPage();const offlineErrors=[];op.on('pageerror',e=>offlineErrors.push(e.message));
 await op.goto('file:///'+path.join(root,'index.html').replace(/\\/g,'/'));
 await op.waitForFunction(()=>typeof App!=='undefined'&&typeof Store!=='undefined');
 await op.evaluate(()=>{Store.profile.starterPicked=true;App.go('hub');});
 await op.waitForFunction(()=>typeof HeroAnim!=='undefined'&&document.querySelector('#cHero canvas')?.dataset.pose);
 const offlineLoaded=await op.evaluate(async()=>{const results=await Promise.all(HeroAnim.ACTORS.map(a=>HeroAnim.load(a).ready));return results.filter(a=>a.status==='ready').length});
 assert.equal(offlineLoaded,40);assert.deepEqual(offlineErrors,[]);report.offline=true;
 await offline.close();await browser.close();
 report.ok=true;fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{report.ok=false;report.failure=e.stack;fs.writeFileSync(path.join(out,'qa-report.json'),JSON.stringify(report,null,2));console.error(e);process.exit(1)});

