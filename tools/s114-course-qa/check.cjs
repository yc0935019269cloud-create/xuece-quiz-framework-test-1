// Real file:// page navigation with fresh stored state per lesson.
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert').strict;
const ROOT=path.resolve(__dirname,'../..'),ledger=path.join(ROOT,'tools/learn-redo/s114-course-progress.json');
const plan=JSON.parse(fs.readFileSync(ledger,'utf8')),out=path.join(ROOT,'output/playwright');fs.mkdirSync(out,{recursive:true});
const result={rendered:0,graded:0,selfReviewed:0,examples:0,practices:0,images:0,interactiveStates:0,navigation:0,lessons:[],issues:[],widths:[1000,390]};
const LEAK=/\[\[img\]\]|^\s*:::|\{[obgrpy]:|\[!(big|tip|warn|why|key|note|exam)\]/m;
function progress(e,width){
 const p=JSON.parse(fs.readFileSync(ledger,'utf8')),x=p.lessons.find(x=>x.unit===e.unit&&x.lesson===e.lesson);
 x.qaWidths=[...new Set([...(x.qaWidths||[]),width])];x.status=x.qaWidths.length===2?'已驗證':'桌機已驗證，待390px';
 x.qa='docs/s114-course-readability/qa.json';fs.writeFileSync(ledger,JSON.stringify(p,null,2)+'\n');
 const file=path.join(ROOT,'SESSION_NOTE_OPTOMETRY_S114_COURSES.md'),n=p.lessons.filter(x=>x.status==='已驗證').length;
 let note=fs.readFileSync(file,'utf8').replace(/目前 \*\*.*?\*\*/,`目前 **59/59 已改寫，${n}/59 已驗證**`);
 note=note.replace(/\n最新驗證：[^\n]*/g,'')+`\n最新驗證：${e.unit}/${e.lesson}，${width}px；完整逐課狀態以JSON為準。\n`;
 fs.writeFileSync(file,note);
}
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const width of result.widths){
 const ctx=await browser.newContext({viewport:{width,height:900}}),page=await ctx.newPage();
 page.on('pageerror',e=>result.issues.push(`${width}: ${e}`));
 await page.goto(require('url').pathToFileURL(path.join(ROOT,'index.html')).href);await page.waitForFunction(()=>typeof LEARN_UI!=='undefined');
 const backup=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 try{for(const e of plan.lessons){
  const p=await page.evaluate(id=>LEARN_UI.packs.find(p=>p.id===id),e.unit),li=p.lessons.findIndex(l=>l.id===e.lesson),l=p.lessons[li];
  const open=async si=>{
   await page.evaluate(({e,si})=>localStorage.setItem(SKEY('learn'),JSON.stringify({les:{[e.unit+'/'+e.lesson]:{i:si,run:{ok:0,n:0,pk:{},sub:0,t0:Date.now()}}},rev:{},cfg:{battle:false,open:{}},stat:{}})),{e,si});
   await page.reload();await page.waitForFunction(()=>typeof LEARN_UI!=='undefined');
   await page.evaluate(id=>{VOL.set('muted',true);App.go('learn',{pack:id})},e.unit);await page.locator(`[data-play="${li}"]`).click();
  };
  await open(l.steps.length-1);const start=result.issues.length;
  for(let si=0;si<l.steps.length;si++){
   const s=l.steps[si],tag=`${width} ${e.unit}/${l.id}#${si}`;
   await page.locator(`#lpPips i[data-i="${si}"]`).evaluate(el=>el.click());
   assert.equal(await page.locator('#lpCnt').innerText(),`${si+1} / ${l.steps.length}`,tag);
   assert.equal(await page.locator(`#lpBody.t-${s.type}`).count(),1,tag);
   await page.waitForFunction(()=>[...document.querySelectorAll('#lpBody img')].every(i=>i.complete));
   const r=await page.locator('#lpBody').evaluate(el=>({text:el.innerText,bad:[...el.querySelectorAll('img')].filter(i=>!i.naturalWidth).map(i=>i.src),overflow:document.documentElement.scrollWidth-innerWidth}));
   if(r.text.trim().length<5||r.bad.length||r.overflow>1||LEAK.test(r.text))result.issues.push({tag,r});
   result.rendered++;result.images+=await page.locator('#lpBody img').count();
   if(si===1&&['va-sph','astigmatism-rx','pupil-response-p1','near-point-p1'].some(x=>e.unit.endsWith(x))&&li===0)await page.locator('#lpBody').screenshot({path:path.join(out,`s114-course-${e.unit}-${width}.png`)});
   if(s.type==='example'){
    await page.locator('#exAll').click();if(s.answer)assert.equal(await page.locator('.lp-exans').count(),1,tag);result.examples++;
   }
   if(s.type==='practice'){result.practices++;assert(await page.locator('#lpBody .qtext,#lpBody .lc-ans').count(),tag+' empty practice');}
   if(s.type==='interactive'){
    const f=page.frameLocator('#lpBody iframe');
    if(s.html.includes('data-position=')){
     for(let n=0;n<3;n++){await f.locator(`button[data-position="${n}"]`).click();const a=await f.locator('#spot').evaluate(el=>[+el.getAttribute('rx'),+el.getAttribute('ry')]);assert(n===0?a[0]<a[1]/10:n===1?Math.abs(a[0]-a[1])<.01:a[1]<a[0]/10);result.interactiveStates++}
    }else if(e.unit.includes('pupil-response')){
     for(let n=1;n<=5;n++){assert((await f.locator('#count').innerText()).startsWith(String(n)));await f.locator('#step').click();result.interactiveStates++}
     await f.locator('#reset').click();assert((await f.locator('#count').innerText()).startsWith('1'));
    }else{
     for(const edge of ['min','max']){
      const expected=await f.locator('body').evaluate((body,edge)=>{for(const x of body.querySelectorAll('input[type=range]')){x.value=x[edge];x.dispatchEvent(new Event('input',{bubbles:true}))}const v=id=>Number(body.querySelector('#'+id).value);return body.querySelector('#c')?(v('c')/10*Math.abs(v('a'))).toFixed(2):body.querySelector('#r').max==='10'?(337.5/v('r')).toFixed(2):(100/v('r')).toFixed(2)},edge);
      assert((await f.locator('#result').innerText()).includes(expected),tag+' interactive output');result.interactiveStates++;
     }
     await f.locator('#reset').click();
    }
   }
   if(s.type!=='check')continue;
   if(s.kind==='single'||s.kind==='tf')await page.locator(`.lc-opt[data-i="${s.kind==='tf'?(s.answer?0:1):s.answer}"]`).click();
   else if(s.kind==='self'){
    await page.locator('.lc-ta').fill('逐課檢查參考答案');await page.locator('.lc-ans button').click();
    assert(await page.locator('.lc-ans .lc-ex').innerText());await page.locator('.lc-ans button.green').click();result.selfReviewed++;
   }else throw new Error('Unsupported check '+s.kind);
   await page.locator('.verdict').waitFor();assert((await page.locator('.verdict').innerText()).includes('答對'),tag);
   if(s.kind!=='self')result.graded++;
  }
  await open(1);await page.locator('#lpNext').click();
  if(l.steps[2].type==='interactive'){
   await page.frameLocator('#lpBody iframe').locator('#spot').waitFor();
   await (await (await page.locator('#lpBody iframe').elementHandle()).contentFrame()).waitForLoadState('load');
   await page.locator('#lpPrev').scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  }
  await page.locator('#lpPrev').click();
  assert.equal(await page.locator('#lpCnt').innerText(),`2 / ${l.steps.length}`,e.unit+'/'+l.id+' nav');result.navigation++;
  result.lessons.push({width,id:e.unit,lid:l.id,steps:l.steps.length});
  if(result.issues.length===start)progress(e,width);
  console.log(width,e.number,e.lesson,'rendered',l.steps.length);
 }}finally{await page.evaluate(b=>{localStorage.clear();Object.entries(b).forEach(([k,v])=>localStorage.setItem(k,v))},backup);await ctx.close()}
}}
catch(e){result.issues.push(String(e));throw e}
finally{await browser.close();fs.writeFileSync(path.join(out,'s114-course-qa.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,lessons:result.lessons.length}))}
assert.deepEqual(result.issues,[]);
})().catch(e=>{console.error(e);process.exitCode=1});
