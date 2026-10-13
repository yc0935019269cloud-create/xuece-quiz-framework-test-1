async page => {
 const checks=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
 const backup=await page.evaluate(()=>__formulaBackup),touch=await page.evaluate(()=>navigator.maxTouchPoints>0);
 const click=l=>touch?l.tap():l.click(),snap=()=>page.locator('body').ariaSnapshot();
 const state=()=>page.evaluate(()=>JSON.stringify({qs:Store.qs,wrong:Store.wrong,profile:Store.profile,les:LEARN_UI.exportData().les,rev:LEARN_UI.exportData().rev,stat:LEARN_UI.exportData().stat}));
 try {
  await snap();const before=await state();
  check(await page.locator('.cram-related').count()===20,'Twenty formula groups in units one to five have related questions');
  check(await page.locator('[data-cram-pack="physopt-u6-wave"] .cram-related').count()===0,'Unit six remains unchanged');
  check(await page.locator('.cram-related[open]').count()===0&&await page.locator('[data-related-q]').count()===0,'Related lists start collapsed and load links only when expanded');
  const source=await page.evaluate(()=>{
   const items=LEARN_UI.packs.filter(p=>/^physopt-u[1-5]-/.test(p.id)).flatMap(p=>p.notes.find(n=>n.kind==='exam-cram').items);
   const ids=items.flatMap(i=>i.evidence.questionIds);
   return {groups:items.length,links:ids.length,unique:new Set(ids).size,valid:ids.every(id=>Store.Q[id]?.ex&&Store.Q[id]?.choices?.length&&Store.EX[Store.Q[id].exam])};
  });
  check(source.valid,'Every referenced question has a loaded bank, choices and explanation');
  await click(page.locator('#nOpenAll'));await snap();
  check(await page.locator('.cram-related[open]').count()===0,'Expand all keeps related lists collapsed');
  const groups=page.locator('.cram-related');
  for(let i=0;i<20;i++) {
   const group=groups.nth(i);await click(group.locator(':scope > summary'));
   await group.locator('[data-related-q]').first().waitFor();await snap();
   const expected=await group.evaluate(d=>JSON.parse(d.dataset.relatedIds).length);
   check(await group.locator('[data-related-q]').count()===expected,'Correct question link count for formula '+(i+1));
   const link=group.locator('[data-related-q]').first(),id=await link.getAttribute('data-related-q');
   await click(link);await snap();
   const modal=page.locator('.qpreview-modal');
   const result=await modal.evaluate((el,id)=>{
    const q=Store.Q[id],clean=s=>String(s).replace(/[\s*]/g,'');return {stem:clean(el.querySelector('.qtext')?.textContent).includes(clean(q.stem)),choices:el.querySelectorAll('.qpreview-choice').length,answer:el.textContent.includes('正確答案：'+q.ans),ex:el.querySelector('.explain')?.textContent?.length>80,readonly:el.querySelector('.answers')===null,role:el.getAttribute('role')};
   },id);
   check(result.stem&&result.choices>0&&result.answer&&result.ex&&result.readonly&&result.role==='dialog','Read-only floating question and explanation for formula '+(i+1));
   if(i===0) {
    await page.keyboard.press('Tab');
    check(await modal.evaluate(el=>el.contains(document.activeElement)),'Keyboard focus stays in the floating window');
   }
   if(i%2)await click(modal.locator('.close'));else await page.keyboard.press('Escape');await snap();
   check(await page.locator('.qpreview-modal').count()===0,'Close and Escape dismiss formula '+(i+1)+' question');
   if(!touch)check(await link.evaluate(el=>el===document.activeElement),'Closing restores focus to formula '+(i+1)+' link');
   await click(group.locator(':scope > summary'));await snap();
  }
  check(await state()===before,'Reading related questions changes no answers, wrong answers, learning progress or rewards');
  await page.locator('#nSearch').fill('Prentice');await page.waitForTimeout(450);await snap();
  check(await page.locator('.cram-related[open]').count()===0,'Search keeps question lists collapsed');
  const group=page.locator('.cram-related').first();await click(group.locator(':scope > summary'));await group.locator('[data-related-q]').first().waitFor();await snap();
  await page.screenshot({path:'output/playwright/exam-related-links.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});await group.scrollIntoViewIfNeeded();await snap();
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'390px question links have no horizontal overflow');
  const last=group.locator('[data-related-q]').last();await click(last);await snap();
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.querySelector('.qpreview-modal').getBoundingClientRect().right<=innerWidth),'390px floating question and details fit the viewport');
  await page.screenshot({path:'output/playwright/exam-related-modal-mobile.png',animations:'disabled'});
  await page.keyboard.press('Escape');await snap();
  check(await state()===before,'Mobile reading leaves study records unchanged');
  await page.reload();await page.waitForFunction(()=>typeof App!=='undefined'&&document.querySelector('#screen .panel'));
  await page.evaluate(()=>{VOL.set('muted',true);App.go('learn',{tab:'notes'});});await snap();
  check(await page.locator('.cram-related[open]').count()===0,'Related questions remain collapsed after reload');
  check(await page.evaluate(()=>__formulaErrors.length===0),'No JavaScript errors in related question flow');
  return {result:'passed',checks:checks.length,source,iosPath:await page.evaluate(()=>IS_IOS),details:checks};
 } finally { await page.evaluate(backup=>{VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(backup))localStorage.setItem(k,v);},backup); }
}
