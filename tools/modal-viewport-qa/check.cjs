async page => {
 const checks=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
 const backup=await page.evaluate(()=>__formulaBackup),touch=await page.evaluate(()=>navigator.maxTouchPoints>0);
 const device=touch?'ipad':'desktop';
 const click=l=>touch?l.tap():l.click(),snap=()=>page.locator('body').ariaSnapshot();
 const settle=()=>page.waitForFunction(()=>{const b=document.querySelector('.modal-contained'),v=visualViewport;return b&&Math.abs(b.getBoundingClientRect().height-(v?.height||innerHeight))<1&&Math.abs(b.getBoundingClientRect().width-(v?.width||innerWidth))<1;});
 const state=()=>page.evaluate(()=>JSON.stringify({qs:Store.qs,wrong:Store.wrong,profile:Store.profile,les:LEARN_UI.exportData().les,rev:LEARN_UI.exportData().rev,stat:LEARN_UI.exportData().stat}));
 const geometry=()=>page.evaluate(()=>{
  const bg=document.querySelector('.modal-contained'),box=bg.querySelector('.modal'),head=box.querySelector('.modal-header'),close=head.querySelector('.close'),body=box.querySelector('.modal-scroll');
  const rect=el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height};};
  const v=visualViewport;return {bg:rect(bg),box:rect(box),head:rect(head),close:rect(close),body:rect(body),viewport:{top:v?.offsetTop||0,left:v?.offsetLeft||0,height:v?.height||innerHeight,width:v?.width||innerWidth},bodyScroll:body.scrollTop,bodyHeight:body.scrollHeight,bodyClient:body.clientHeight,bgScroll:bg.scrollTop,pageLocked:getComputedStyle(document.body).position==='fixed'};
 });
 const fits=g=>g.box.top>=g.viewport.top-1&&g.box.bottom<=g.viewport.top+g.viewport.height+1&&g.close.top>=g.viewport.top&&g.close.bottom<=g.viewport.top+g.viewport.height&&Math.abs(g.bg.height-g.viewport.height)<1;
 try {
  await snap();const before=await state();
  await page.setViewportSize({width:1180,height:820});
  await page.locator('#nSearch').fill('Prentice');await page.waitForTimeout(450);await snap();
  const group=page.locator('.cram-related').first();await click(group.locator(':scope > summary'));await group.locator('[data-related-q]').first().waitFor();await snap();
  const link=page.locator('[data-related-q="physopt-exam-u5-107-sp-49"]');await link.scrollIntoViewIfNeeded();await snap();
  const originalScroll=await page.evaluate(()=>({x:scrollX,y:scrollY,body:document.body.getAttribute('style'),html:document.documentElement.getAttribute('style')}));
  check(originalScroll.y>100,'Open the screenshot question after scrolling far down the note list');
  await click(link);await snap();
  const modal=page.locator('.qpreview-modal'),scroller=modal.locator('.modal-scroll');
  let g=await geometry();check(fits(g),'Landscape tablet header, close and panel fit the visible viewport');check(g.pageLocked,'Background page is locked while reading');check(g.bodyHeight>g.bodyClient,'Long question scrolls inside its content area');
  const headTop=g.head.top;
  for(const part of [0.5,1]){
   await scroller.evaluate((el,part)=>el.scrollTop=el.scrollHeight*part,part);await snap();g=await geometry();
   check(fits(g)&&Math.abs(g.head.top-headTop)<1,'Header and close stay visible at scroll fraction '+part);
   check(g.bodyScroll>0&&g.bgScroll===0,'Only question content scrolls at fraction '+part);
  }
  check(g.bodyScroll+g.bodyClient>=g.bodyHeight-2,'Can reach the end of the explanation');
  await page.evaluate(()=>window.scrollTo(0,0));
  check(await page.evaluate(()=>document.body.style.top)===-originalScroll.y+'px','Background position stays fixed during scroll attempts');
  await page.screenshot({path:'output/playwright/modal-viewport-'+device+'-bottom.png',animations:'disabled'});
  await scroller.evaluate(el=>el.scrollTop=0);await snap();
  await page.screenshot({path:'output/playwright/modal-viewport-'+device+'-top.png',animations:'disabled'});
  await page.setViewportSize({width:820,height:1180});await settle();await snap();g=await geometry();check(fits(g),'Portrait rotation resizes the existing floating window');
  await page.setViewportSize({width:390,height:844});await settle();await snap();g=await geometry();check(fits(g)&&g.box.right<=390,'Phone width keeps header and content inside the viewport');
  await scroller.evaluate(el=>el.scrollTop=el.scrollHeight);await snap();g=await geometry();check(fits(g),'Phone close remains visible at the end of details');
  await page.screenshot({path:'output/playwright/modal-viewport-'+device+'-phone-bottom.png',animations:'disabled'});
  await page.setViewportSize({width:1180,height:820});await settle();await snap();await click(modal.locator('.close'));await snap();
  const restored=await page.evaluate(()=>({x:scrollX,y:scrollY,body:document.body.getAttribute('style'),html:document.documentElement.getAttribute('style')}));
  check(Math.abs(restored.y-originalScroll.y)<=1&&Math.abs(restored.x-originalScroll.x)<=1,'Close restores the note list scroll position');
  check((restored.body||'')===(originalScroll.body||'')&&(restored.html||'')===(originalScroll.html||''),'Close restores original page styles');
  check(await state()===before,'Reading and scrolling leave all study records unchanged');
  // 模擬瀏覽器工具列／鍵盤造成的 visual viewport 收縮與偏移，不宣稱實機 Safari。
  const mocked=await page.evaluate(()=>{
   const descriptor=Object.getOwnPropertyDescriptor(window,'visualViewport'),fake=new EventTarget();Object.assign(fake,{width:1000,height:600,offsetTop:64,offsetLeft:20});
   Object.defineProperty(window,'visualViewport',{configurable:true,value:fake});
   const m=QV.previewModal(Store.Q['physopt-exam-u5-107-sp-49']);
   const bounds=()=>{const r=m.el.getBoundingClientRect(),b=m.el.parentElement.getBoundingClientRect(),c=m.el.querySelector('.close').getBoundingClientRect();return {top:r.top,bottom:r.bottom,bgTop:b.top,bgLeft:b.left,bgHeight:b.height,closeBottom:c.bottom};};
   try{const first=bounds();fake.height=420;fake.offsetTop=96;fake.dispatchEvent(new Event('resize'));const resized=bounds();fake.offsetTop=120;fake.dispatchEvent(new Event('scroll'));const moved=bounds();return {first,resized,moved};}
   finally{m.close();Object.defineProperty(window,'visualViewport',descriptor);}
  });
  check(mocked.first.bgTop===64&&mocked.first.bgLeft===20&&mocked.first.bgHeight===600,'Visual viewport offset and height drive overlay bounds');
  check(mocked.resized.bgTop===96&&mocked.resized.bgHeight===420&&mocked.resized.closeBottom<=516,'Toolbar or keyboard shrink keeps header visible');
  check(mocked.moved.bgTop===120&&mocked.moved.bottom<=540,'Visual viewport scroll updates overlay position');
  const nested=await page.evaluate(()=>{
   const a=QV.previewModal(Store.Q['physopt-exam-u5-107-sp-49']),b=QV.previewModal(Store.Q['physopt-exam-u5-107-sp-49']);
   a.close();const stillLocked=document.body.style.position==='fixed';b.close();b.close();return {stillLocked,released:document.body.style.position!=='fixed'};
  });
  check(nested.stillLocked&&nested.released,'Nested and repeated closes preserve scroll lock ownership');
  await page.evaluate(()=>QV.previewModal(Store.Q['physopt-exam-u5-107-sp-49']));await snap();await page.keyboard.press('Escape');await snap();
  check(await page.locator('.qpreview-modal').count()===0&&await page.evaluate(()=>document.body.style.position!=='fixed'),'Escape releases the scroll lock');
  await page.evaluate(()=>{QV.previewModal(Store.Q['physopt-exam-u5-107-sp-49']);App.go('hub');});await snap();
  check(await page.evaluate(()=>document.body.style.position!=='fixed'&&scrollY===0)&&await page.locator('.modal-contained').count()===0,'Navigation clears the reading modal and lock without restoring old page scroll');
  await page.evaluate(()=>{const m=QV.previewModal(Store.Q['physopt-exam-u5-107-sp-49']);m.el.parentElement.remove();});await page.waitForTimeout(50);await snap();
  check(await page.evaluate(()=>document.body.style.position!=='fixed'),'External removal cleans up the scroll lock');
  const legacy=await page.evaluate(()=>{const m=U.modal({title:'普通視窗',body:'測試'});const unchanged=!m.body.classList.contains('modal-scroll')&&document.body.style.position!=='fixed';m.close();return unchanged;});
  check(legacy,'Existing ordinary dialogs keep their layout and scroll behavior');
  check(await page.evaluate(()=>__formulaErrors.length===0),'No JavaScript errors in viewport and lifecycle checks');
  return {result:'passed',checks:checks.length,iosPath:await page.evaluate(()=>IS_IOS),details:checks,mockedViewport:mocked};
 } finally { await page.evaluate(backup=>{U.clearModals();VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(backup))localStorage.setItem(k,v);},backup); }
}
