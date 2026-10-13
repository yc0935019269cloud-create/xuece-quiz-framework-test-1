async page=>{
 const checks=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
 const backup=await page.evaluate(()=>__formulaBackup),touch=await page.evaluate(()=>navigator.maxTouchPoints>0),device=touch?'ipad':'desktop';
 const click=l=>touch?l.tap():l.click(),snap=()=>page.locator('body').ariaSnapshot();
 const state=()=>page.evaluate(()=>JSON.stringify({qs:Store.qs,wrong:Store.wrong,profile:Store.profile,les:LEARN_UI.exportData().les,rev:LEARN_UI.exportData().rev,stat:LEARN_UI.exportData().stat}));
 try{
  await snap();const before=await state();
  check(await page.locator('.formula-related').count()===50,'All fifty formula groups in units one to five have related questions');
  check(await page.locator('[data-formula-pack="physopt-u6-wave"] .formula-related').count()===0,'Unit six has no added formula question links');
  check(await page.locator('.formula-related[open]').count()===0,'Formula question lists start collapsed');
  check(await page.locator('.cram-related').count()===20,'Existing quick exam notes still have their separate question lists');
  await click(page.locator('#nOpenAll'));await snap();
  check(await page.locator('.formula-related[open]').count()===0,'Expand all keeps formula question lists collapsed');
  let teacherGroups=0;
  const formulas=page.locator('.formula-explanation').filter({has:page.locator('.formula-related')});
  for(let i=0;i<50;i++){
   const formula=formulas.nth(i);await click(formula.locator(':scope > summary'));await snap();
   const related=formula.locator('.formula-related');await click(related.locator(':scope > summary'));await related.locator('[data-related-q]').first().waitFor();await snap();
   const ids=await related.evaluate(d=>JSON.parse(d.dataset.relatedIds));
   check(await related.locator('[data-related-q]').count()===ids.length,'Correct formula link list '+(i+1));
   const link=related.locator('[data-related-q]').first();
   if(await link.getAttribute('data-related-source')==='teacher'){teacherGroups++;check((await link.textContent()).includes('老師講義'),'Teacher source is visibly marked for formula '+(i+1));}
   await click(link);await snap();
   const modal=page.locator('.qpreview-modal');
   check(await modal.locator('.qtext').count()>0&&(await modal.locator('.explain').textContent()).includes('正確答案')&&await modal.locator('.answers').count()===0,'Formula '+(i+1)+' opens read-only question and explanation');
   const body=modal.locator('.modal-scroll');await body.evaluate(el=>el.scrollTop=el.scrollHeight);await snap();
   check(await modal.locator('.close').isVisible(),'Fixed close remains available for formula '+(i+1));
   await click(modal.locator('.close'));await snap();
   await click(related.locator(':scope > summary'));await click(formula.locator(':scope > summary'));await snap();
  }
  check(await state()===before,'Formula question reading changes no answers or learning progress');
  await page.locator('#nSearch').fill('頻率與週期');await page.waitForTimeout(450);await snap();
  const period=page.locator('#physopt-u1-language-formula-summary-f02');await click(period.locator(':scope > summary'));await click(period.locator('.formula-related > summary'));await snap();
  check((await period.textContent()).includes('題目本身沒有直接問週期'),'Frequency exercise is explicitly marked as extension for the period formula');
  await page.locator('#nSearch').fill('Newton');await page.waitForTimeout(450);await snap();
  const target=page.locator('#physopt-u4-thicklens-formula-summary-f10');await click(target.locator(':scope > summary'));await click(target.locator('.formula-related > summary'));await target.locator('[data-related-q]').first().waitFor();await snap();
  await target.locator('.formula-related').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/formula-related-'+device+'-links.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});await target.locator('.formula-related').scrollIntoViewIfNeeded();await snap();
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Phone formula question links fit the viewport');
  await click(target.locator('[data-related-q]').first());await snap();
  check(await page.locator('.modal-header .close').isVisible(),'Phone formula question uses the fixed header modal');
  await page.screenshot({path:'output/playwright/formula-related-'+device+'-mobile.png',animations:'disabled'});await page.keyboard.press('Escape');await snap();
  const imports=await page.evaluate(async()=>{
   const original=structuredClone(LEARN_UI.packs.find(p=>p.id==='physopt-u3-thinlens'));
   const scanned=await IMP.scan([new File([JSON.stringify(original)],'u3.json',{type:'application/json'})]);
   const preserved=scanned.packs[0].pack.notes.find(n=>n.kind==='formula-summary').formulas.every(f=>f.relatedQuestions.length);
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(SKEY('import'),1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
   const write=data=>new Promise((resolve,reject)=>{const t=db.transaction('items','readwrite');t.objectStore('items').put({id:'learn:'+original.id,kind:'learn',data});t.oncomplete=resolve;t.onerror=()=>reject(t.error);});
   try{
    const old=structuredClone(original);for(const f of old.notes.find(n=>n.kind==='formula-summary').formulas)delete f.relatedQuestions;
    await write(old);await IMP.load();const upgraded=LEARN_UI.packs.find(p=>p.id===old.id).notes.find(n=>n.kind==='formula-summary').formulas.every(f=>f.relatedQuestions.length);
    for(const f of old.notes.find(n=>n.kind==='formula-summary').formulas)f.relatedQuestions=[];
    await write(old);await IMP.load();const cleared=LEARN_UI.packs.find(p=>p.id===old.id).notes.find(n=>n.kind==='formula-summary').formulas.every(f=>f.relatedQuestions.length===0);
    await write(original);await IMP.load();return{preserved,upgraded,cleared};
   }finally{await new Promise(resolve=>{const t=db.transaction('items','readwrite');t.objectStore('items').delete('learn:'+original.id);t.oncomplete=resolve;});db.close();}
  });
  check(imports.preserved&&imports.upgraded&&imports.cleared,'Importer keeps links, upgrades old notes and honors explicit empty link arrays');
  check(await page.evaluate(()=>__formulaErrors.length===0),'No JavaScript errors in formula question flow');
  return{result:'passed',checks:checks.length,teacherGroups,iosPath:await page.evaluate(()=>IS_IOS),details:checks};
 }finally{await page.evaluate(backup=>{U.clearModals();VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(backup))localStorage.setItem(k,v);},backup);}
}
