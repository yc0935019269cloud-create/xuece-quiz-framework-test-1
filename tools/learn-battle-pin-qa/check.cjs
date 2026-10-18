// file://, disposable contexts; a long-question fixture exercises scroll positions.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert').strict;
const ROOT=path.resolve(__dirname,'../..'),out=path.join(ROOT,'output/playwright');fs.mkdirSync(out,{recursive:true});
const report={widths:[],checks:0,attacks:0,issues:[]};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const width of [1000,390]){
 const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage();
 page.on('pageerror',e=>report.issues.push(String(e)));
 await page.goto(require('url').pathToFileURL(path.join(ROOT,'index.html')).href);await page.waitForFunction(()=>typeof LEARN_UI!=='undefined');
 const backup=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 try{
  const pick=await page.evaluate(()=>{const p=LEARN_UI.packs.find(p=>p.id==='optom2-u2-msr'),l=p.lessons.find(l=>l.id==='l4'),i=l.steps.findIndex(s=>s.type==='check'&&s.kind==='single');return{p:p.id,l:l.id,li:p.lessons.indexOf(l),i,answer:l.steps[i].answer}});
  await page.evaluate(p=>{localStorage.setItem(SKEY('learn'),JSON.stringify({les:{[p.p+'/'+p.l]:{i:p.i,run:{ok:0,n:0,pk:{},sub:0,t0:Date.now()}}},rev:{},cfg:{battle:true,open:{}},stat:{}}))},pick);
  await page.reload();await page.waitForFunction(()=>typeof App!=='undefined');
  await page.evaluate(p=>{VOL.set('muted',true);App.go('learn',{pack:p.p})},pick);await page.locator(`[data-play="${pick.li}"]`).click();
  await page.evaluate(()=>{
   window.savedHero=document.querySelector('#lbHeroBody');window.savedCanvas=document.querySelector('#lbHeroBody canvas');window.hits=0;
   for(const key of ['attack','critical']){const original=FX[key];FX[key]=function(...args){window.hits++;return original.apply(this,args)}}
   document.querySelector('#lpBody .lc').insertAdjacentHTML('afterbegin','<div data-long-question-fixture style="height:1100px">長題目捲動測試</div>');
  });
  const snap=()=>page.evaluate(()=>{const w=document.querySelector('#lpBattlePin'),s=document.querySelector('#lbStage'),top=document.querySelector('#topbar').getBoundingClientRect();return{compact:w.classList.contains('compact'),rect:s.getBoundingClientRect().toJSON(),top:top.bottom,flow:document.documentElement.scrollHeight,hero:window.savedHero===document.querySelector('#lbHeroBody'),canvas:window.savedCanvas===document.querySelector('#lbHeroBody canvas'),overflow:document.documentElement.scrollWidth-innerWidth}});
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>!document.querySelector('#lpBattlePin').classList.contains('compact'));
  const full=await snap();assert.equal(full.rect.height,width>640?212:168);report.checks++;
  const bodyBefore=await page.locator('#lpBody').evaluate(el=>el.getBoundingClientRect().top+scrollY);
  await page.evaluate(()=>scrollTo(0,700));await page.waitForFunction(()=>document.querySelector('#lpBattlePin').classList.contains('compact'));
  const compact=await snap();assert(compact.rect.height<full.rect.height);assert(Math.abs(compact.rect.top-compact.top-8)<2,JSON.stringify(compact));assert(compact.hero&&compact.canvas);assert(compact.overflow<=1);report.checks+=4;
  const bodyAfter=await page.locator('#lpBody').evaluate(el=>el.getBoundingClientRect().top+scrollY);assert(Math.abs(bodyBefore-bodyAfter)<2,JSON.stringify({bodyBefore,bodyAfter,full,compact,margin:await page.locator('#lpBattlePin').evaluate(el=>el.style.marginBottom)}));report.checks++;
  await page.locator(`.lc-opt[data-i="${pick.answer}"]`).click();await page.waitForFunction(()=>window.hits>0);
  const attack=await snap();assert(attack.rect.top>=attack.top-2&&attack.rect.bottom<900);assert(attack.hero&&attack.canvas);report.attacks++;report.checks+=2;
  await page.screenshot({path:path.join(out,`learn-battle-pin-${width}.png`)});
  // Mobile toolbar wrapping and orientation changes must update the sticky offset.
  await page.setViewportSize({width:width===390?844:800,height:900});
  await page.waitForFunction(()=>Math.abs(document.querySelector('#lpBattlePin').getBoundingClientRect().top-document.querySelector('#topbar').getBoundingClientRect().bottom)<2);
  report.checks++;
  await page.evaluate(()=>{document.querySelector('#lpBattle').click()});await page.waitForFunction(()=>document.querySelector('#lpBattlePin').hidden);
  assert.equal(await page.locator('#lpBattlePin').evaluate(el=>el.getBoundingClientRect().height),0);report.checks++;
  await page.evaluate(()=>document.querySelector('#lpBattle').click());await page.waitForFunction(()=>!document.querySelector('#lpBattlePin').hidden);report.checks++;
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>!document.querySelector('#lpBattlePin').classList.contains('compact'));assert.equal(await page.locator('#lpBattleSpacer').evaluate(el=>el.style.height),'0px');report.checks++;
  await page.locator('#lpExit').click();await page.evaluate(()=>scrollTo(0,700));assert.equal(await page.locator('#lpBattlePin').count(),0);report.checks++;
  // Re-enter in peaceful mode: no residual sticky stage or spacer.
  await page.locator(`[data-play="${pick.li}"]`).click();await page.evaluate(()=>document.querySelector('#lpBattle').click());await page.waitForFunction(()=>document.querySelector('#lpBattlePin').hidden);report.checks++;
  await page.evaluate(()=>App.go('camp'));assert.equal(await page.locator('#lpBattlePin').count(),0);report.checks++;
  report.widths.push({width,full:full.rect.height,compact:compact.rect.height,bodyShift:bodyAfter-bodyBefore});
 }finally{await page.evaluate(b=>{localStorage.clear();Object.entries(b).forEach(([k,v])=>localStorage.setItem(k,v))},backup);await ctx.close()}
}}
catch(e){report.issues.push(String(e));throw e}
finally{await browser.close();fs.writeFileSync(path.join(out,'learn-battle-pin-qa.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report))}
assert.deepEqual(report.issues,[]);
})().catch(e=>{console.error(e);process.exitCode=1});
