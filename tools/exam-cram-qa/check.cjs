async page=>{
 const checks=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
 const backup=await page.evaluate(()=>__formulaBackup),touch=await page.evaluate(()=>navigator.maxTouchPoints>0);
 const click=l=>touch?l.tap():l.click(),snap=()=>page.locator('body').ariaSnapshot();
 try{
  await snap();
  check(await page.locator('.lnote-cram').count()===6&&await page.locator('.lnote-summary').count()===6,'Six exam sections coexist with six original formula summaries');
  check(await page.evaluate(()=>[...document.querySelectorAll('.lnote-cram')].every(d=>d.parentElement.firstElementChild===d&&d.nextElementSibling.classList.contains('lnote-summary'))),'Every exam section comes directly before formula summary');
  check((await page.locator('#learnBody').textContent()).includes('6 份考前必看')&&(await page.locator('#learnBody').textContent()).includes('6 份公式統整'),'Counts distinguish quick exam notes from full summaries');
  const before=await page.evaluate(()=>JSON.stringify({les:LEARN_UI.exportData().les,rev:LEARN_UI.exportData().rev,stat:LEARN_UI.exportData().stat}));
  const units=await page.locator('.lnote-cram').evaluateAll(ds=>ds.map(d=>d.dataset.cramPack));
  for(const id of units){
   const note=page.locator('[data-cram-pack="'+id+'"]');await click(note.locator(':scope > summary'));await snap();
   const expected=await page.evaluate(id=>LEARN_UI.packs.find(p=>p.id===id).notes.find(n=>n.kind==='exam-cram').items.length,id);
   check(await note.locator('.cram-item').count()===expected&&await note.locator('.formula-equations').count()===expected,'Formula and short use/trap rows: '+id);
   check((await note.textContent()).includes('相關題')&&(await note.textContent()).includes('106～114'),'Exam basis and sample range remain visible: '+id);
   await click(note.locator(':scope > summary'));
  }
  check(await page.evaluate(before=>JSON.stringify({les:LEARN_UI.exportData().les,rev:LEARN_UI.exportData().rev,stat:LEARN_UI.exportData().stat})===before,before),'Reading quick exam notes does not advance progress or rewards');
  await page.locator('#nSearch').fill('Prentice');await page.waitForTimeout(450);await snap();
  check(await page.locator('[data-cram-pack="physopt-u5-matrix"]').count()===1,'Search finds the newly prioritized Prentice formula');
  await page.locator('#nSearch').fill('考前必看');await page.waitForTimeout(450);await snap();
  check(await page.locator('.lnote-cram').count()===6&&await page.locator('.lnote-summary').count()===0,'Title search shows only the six concise exam sections');
  await page.locator('#nSearch').fill('');await page.waitForTimeout(450);await snap();
  await click(page.locator('#nOpenAll'));await snap();
  check(await page.locator('.lnote-cram[open]').count()===6&&await page.locator('.lnote-summary[open]').count()===6,'Expand all handles both note types');
  await click(page.locator('#nCloseAll'));await snap();
  check(await page.locator('.lnote-cram[open]').count()===0,'Collapse all works for exam notes');
  await click(page.locator('#nOpenAll'));await snap();
  await page.evaluate(()=>document.querySelectorAll('.lnote-cram,.lnote-summary').forEach(d=>d.open=d.dataset.cramPack==='physopt-u5-matrix'));
  const target=page.locator('[data-cram-pack="physopt-u5-matrix"]');await target.scrollIntoViewIfNeeded();await snap();
  await page.screenshot({path:'output/playwright/exam-cram-notes.png',animations:'disabled'});
  await page.setViewportSize({width:390,height:844});await target.scrollIntoViewIfNeeded();await snap();
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'390px concise exam formulas have no horizontal overflow');
  await page.screenshot({path:'output/playwright/exam-cram-mobile.png',animations:'disabled'});
  const imports=await page.evaluate(async()=>{
   const original=structuredClone(LEARN_UI.packs.find(p=>p.id==='physopt-u5-matrix'));
   const scanned=await IMP.scan([new File([JSON.stringify(original)],'u5.json',{type:'application/json'})]);
   const preserved=scanned.packs[0]?.pack.notes?.some(n=>n.kind==='exam-cram'&&n.items.length===5);
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(SKEY('import'),1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
   const write=data=>new Promise((resolve,reject)=>{const t=db.transaction('items','readwrite');t.objectStore('items').put({id:'learn:'+original.id,kind:'learn',data});t.oncomplete=resolve;t.onerror=()=>reject(t.error);});
   try{
    const old=structuredClone(original);old.notes=old.notes.filter(n=>n.kind!=='exam-cram');await write(old);await IMP.load();
    const upgraded=LEARN_UI.packs.find(p=>p.id===original.id).notes.some(n=>n.kind==='exam-cram');
    await write({...old,notes:[]});await IMP.load();const cleared=LEARN_UI.packs.find(p=>p.id===original.id).notes.length===0;
    await write(original);await IMP.load();return {preserved,upgraded,cleared};
   }finally{await new Promise((resolve,reject)=>{const t=db.transaction('items','readwrite');t.objectStore('items').delete('learn:'+original.id);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});db.close();}
  });
  check(imports.preserved,'Importer keeps concise exam rows');check(imports.upgraded,'Version 90 imported notes receive the missing new exam section');check(imports.cleared,'Explicit empty imported notes still clear all notes');
  await page.reload();await page.waitForFunction(()=>typeof App!=='undefined'&&document.querySelector('#screen .panel'));
  await page.evaluate(()=>{VOL.set('muted',true);App.go('learn',{tab:'notes'});});await snap();
  check(await page.locator('.lnote-cram').count()===6&&await page.locator('.lnote-summary').count()===6,'Both note types persist after reload');
  check(await page.evaluate(()=>__formulaErrors.length===0),'No JavaScript errors in exam notes flow');
  return {result:'passed',checks:checks.length,details:checks,iosPath:await page.evaluate(()=>IS_IOS)};
 }finally{await page.evaluate(backup=>{VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(backup))localStorage.setItem(k,v);},backup);}
}
