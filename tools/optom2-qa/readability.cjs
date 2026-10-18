// 每課reload載入測試存檔，實際按色條逐頁；不能只寫localStorage而不reload。
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const URL = require('url').pathToFileURL(path.join(ROOT, 'index.html')).href;
const units = ['optom2-u2-msr','optom2-u3-vf','optom2-u4-bb'];
const result = { rendered:0, graded:0, examples:0, images:0, pools:[], navigation:0, issues:[], widths:[1000,390], lessons:[] };
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
     const l=p.lessons[li];
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
    result.pools.push({width,id,pool:l.steps[si].pick.ids.length});
    if(l.steps[si].pick.ids.length<20)result.issues.push('Small final practice pool '+id);
    await open(id,p.lessons[0].id,0,1);
    const title=await page.locator('#lpBody h3').innerText();
    await page.locator('#lpNext').click();await page.locator('#lpPrev').click();
    if(await page.locator('#lpBody h3').innerText()!==title)result.issues.push('Navigation '+id);
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
  fs.writeFileSync(path.join(ROOT,'output/playwright/optometry-readability-qa.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({...result,lessons:result.lessons.length}));
 }
 if(result.issues.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
