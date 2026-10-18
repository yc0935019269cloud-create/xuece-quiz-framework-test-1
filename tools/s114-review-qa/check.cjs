// 每課reload載入測試存檔，實際按色條逐頁；不能只寫localStorage而不reload。
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const plan = JSON.parse(fs.readFileSync(path.join(ROOT,'tools/learn-redo/s114-review-progress.json'),'utf8')).lessons;
const units = plan.map(x=>x.unit);
const selected = Object.fromEntries(plan.map(x=>[x.unit,x.lesson]));
const result = { rendered:0, graded:0, examples:0, images:0, interactiveStates:0, pools:[], navigation:0, issues:[], widths:[1000,390], lessons:[] };
const LEAK=/\[\[img\]\]|^\s*:::|\{[obgrpy]:|\[!(big|tip|warn|why|key|note|exam)\]/m;
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
 for (const width of result.widths) {
  const ctx=await browser.newContext({viewport:{width,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>result.issues.push(`${width}: ${e}`));
  await page.goto(URL); await page.waitForFunction(()=>typeof LEARN_UI!=='undefined'&&LEARN_UI.packs.length);
  const backup=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
  try {
   const key=await page.evaluate(()=>SKEY('learn'));
   const open=async(id,lid,li,si)=>{
    await page.evaluate(({key,id,lid,si})=>{
     const D={les:{},rev:{},cfg:{battle:false,open:{}},stat:{},last:null};
     D.les[id+'/'+lid]={i:si,done:0,best:0,run:{ok:0,n:0,sub:0,pk:{},t0:Date.now()}};
     localStorage.setItem(key,JSON.stringify(D));
    },{key,id,lid,si});
    await page.reload(); await page.waitForFunction(()=>typeof LEARN_UI!=='undefined'&&LEARN_UI.packs.length);
    await page.evaluate(id=>{VOL.set('muted',true);App.go('learn',{pack:id})},id);
    await page.locator(`[data-play="${li}"]`).click();
   };
   for (const id of units) {
    const p=await page.evaluate(id=>LEARN_UI.packs.find(p=>p.id===id),id);
    for (let li=0;li<p.lessons.length;li++) {
     const l=p.lessons[li]; if(l.id!==selected[id])continue;
     await open(id,l.id,li,l.steps.length-1);
     for(let si=0;si<l.steps.length;si++) {
      const s=l.steps[si],tag=`${width} ${id}/${l.id}#${si}`;
      await page.locator(`#lpPips i[data-i="${si}"]`).evaluate(el=>el.click());
      const cnt=await page.locator('#lpCnt').innerText();
      if(cnt!==`${si+1} / ${l.steps.length}`)throw new Error(tag+' wrong page '+cnt);
      if(!await page.locator(`#lpBody.t-${s.type}`).count())throw new Error(tag+' wrong type');
      await page.waitForFunction(()=>[...document.querySelectorAll('#lpBody img')].every(i=>i.complete));
      const r=await page.locator('#lpBody').evaluate(el=>({text:el.innerText,bad:[...el.querySelectorAll('img')].filter(i=>!i.naturalWidth).map(i=>i.src),overflow:document.documentElement.scrollWidth-innerWidth}));
      if(r.text.trim().length<5||r.bad.length||r.overflow>1||LEAK.test(r.text))result.issues.push({tag,r});
      result.rendered++;if(s.img)result.images++;
      if(s.type==='card' && /^(同一個視力|logMAR計分|先統一一套|RAPD：從正常眼)/.test(s.title)) await page.locator('#lpBody').screenshot({path:path.join(ROOT,`output/playwright/s114-review-${id}-${width}-${si}.png`)});
      if(s.type==='interactive'){
       const frame=page.frameLocator('#lpBody iframe');
       for(let pos=0;pos<3;pos++){ await frame.locator(`button[data-position="${pos}"]`).click();
        const shape=await frame.locator('#spot').evaluate(el=>({rx:+el.getAttribute('rx'),ry:+el.getAttribute('ry')}));
        const valid=pos===0?shape.rx<shape.ry/10:pos===1?Math.abs(shape.rx-shape.ry)<.01:shape.ry<shape.rx/10;
        if(!valid)result.issues.push({tag,pos,shape});
        result.interactiveStates++;
       }
      }
      if(s.type==='example'){
       await page.locator('#exAll').click();
       if(s.answer&&!await page.locator('.lp-exans').count())result.issues.push(tag+' no worked answer');
       result.examples++;
      }
      if(s.type!=='check')continue;
      if(s.kind==='single'||s.kind==='tf'){
       const i=s.kind==='tf'?(s.answer?0:1):s.answer;
       await page.locator(`.lc-opt[data-i="${i}"]`).click();
      }else if(s.kind==='multi'){
       for(const i of s.answer) await page.locator(`.lc-opt[data-i="${i}"]`).click();
       await page.locator('.lc-confirm').click();
      }else if(s.kind==='fill'){
       await page.locator('.lc-in').fill(s.answer[0]);await page.locator('.lc-ans button').click();
      }else if(s.kind==='order'){
       for(let i=0;i<s.items.length;i++) await page.locator(`.lc-item[data-i="${i}"]`).click();
      }else throw new Error('Unknown check kind '+s.kind);
      await page.locator('.verdict').waitFor();
      const verdict=await page.locator('.verdict').innerText();
      if(!verdict.includes('答對'))result.issues.push({tag,verdict});
      result.graded++;
     }
     result.lessons.push({width,id,lid:l.id,steps:l.steps.length});
     console.log(width,id,l.id,'rendered',l.steps.length);
    }
    const li=p.lessons.length-1,l=p.lessons[li],si=l.steps.findIndex(s=>s.type==='practice');
    await open(id,l.id,li,si);await page.locator('#lpBody .qtext').waitFor();
    const pool=await page.evaluate(pick=>{const words=(pick.match||[]).map(w=>w.toLowerCase());return Store.filter({subjects:pick.subjects,exams:pick.exams,ids:pick.ids,types:pick.types||['single','multi','fill']}).filter(q=>words.some(w=>(q.tag||'').toLowerCase().includes(w)||(pick.inEx!==false&&(q.ex||'').toLowerCase().includes(w)))).map(q=>q.id)},l.steps[si].pick);
    result.pools.push({width,id,pool:pool.length});
    const leaked=await page.evaluate(({ids,sets})=>ids.filter(qid=>!sets.includes(Store.Q[qid]?.exam)),{ids:pool,sets:l.steps[si].pick.exams});
    if(leaked.length)result.issues.push({width,id,leaked});
    if(pool.length<1)result.issues.push('Small final practice pool '+id);
    await open(id,l.id,li,1);
    const title=await page.locator('#lpBody h3').innerText();
    await page.locator('#lpNext').click();
    // Wait for the new srcdoc frame to finish loading before scrolling the footer
    // into view. A pending frame load can change scroll anchoring during a click.
    if(l.steps[2].type==='interactive') {
     await page.frameLocator('#lpBody iframe').locator('#spot').waitFor();
     const frame=await (await page.locator('#lpBody iframe').elementHandle()).contentFrame();
     await frame.waitForLoadState('load');
     await page.locator('#lpPrev').scrollIntoViewIfNeeded();
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    }
    await page.locator('#lpPrev').click();
    const actual=await page.locator('#lpBody h3').innerText(),count=await page.locator('#lpCnt').innerText();
    if(count!==`2 / ${l.steps.length}`)result.issues.push({navigation:id,title,actual,count});
    result.navigation++;
   }
  } finally {
   await page.evaluate(backup=>{localStorage.clear();for(const [k,v]of Object.entries(backup))localStorage.setItem(k,v);},backup);
   await ctx.close();
  }
 }
 }catch(e){result.issues.push(String(e));throw e;}
 finally{
  await browser.close();
  fs.writeFileSync(path.join(ROOT,'output/playwright/s114-review-qa.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({...result,lessons:result.lessons.length}));
 }
 if(result.issues.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
