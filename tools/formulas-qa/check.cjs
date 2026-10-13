async page => {
  const checks=[],check=(ok,msg)=>{if(!ok)throw Error(msg);checks.push(msg);};
  const backup=await page.evaluate(()=>__formulaBackup),snap=()=>page.locator('body').ariaSnapshot();
  const touch=await page.evaluate(()=>navigator.maxTouchPoints>0),click=l=>touch?l.tap():l.click();
  try {
    await snap();
    check(await page.locator('.lnote-summary').count()===6,'All six unit summaries are available without completed lessons');
    check(await page.locator('.lnote-les').count()===0,'Unread lesson cards are not marked learned by adding summaries');
    check(await page.locator('.formula-logic').count()===62&&await page.evaluate(()=>[...document.querySelectorAll('.formula-logic')].every(d=>!d.open)),'Deeper derivations are separate from the beginner explanation and closed initially');
    check(await page.evaluate(()=>[...document.querySelectorAll('.lnote-summary')].every(d=>d.parentElement.firstElementChild===d||d.previousElementSibling?.classList.contains('lnote-cram'))),'Formula summary follows only the exam priorities inside each unit');
    const before=await page.evaluate(()=>JSON.stringify({les:LEARN_UI.exportData().les,rev:LEARN_UI.exportData().rev,stat:LEARN_UI.exportData().stat}));
    const units=await page.locator('.lnote-summary').evaluateAll(ds=>ds.map(d=>d.dataset.formulaPack));
    for(const id of units){
      const note=page.locator('[data-formula-pack="'+id+'"]');
      await click(note.locator(':scope > summary')); await snap();
      const expected=await page.evaluate(id=>LEARN_UI.packs.find(p=>p.id===id).notes.find(n=>n.kind==='formula-summary').formulas.length,id);
      check(await note.locator('.formula-index li').count()===expected&&await note.locator('.formula-explanation').count()===expected,'Formula index and explanation coverage: '+id);
      await click(note.locator('[data-formula-jump]').first()); await snap();
      const detail=note.locator('.formula-explanation').first();
      check(await detail.getAttribute('open')!==null&&await detail.locator('.formula-body h5').count()===6,'Index jumps to everyday explanation and warmup: '+id);
      await click(detail.locator(':scope > summary')); await snap();
      check(await detail.getAttribute('open')===null,'Explanation collapses without closing unit: '+id);
      await click(note.locator(':scope > summary'));
    }
    check(await page.evaluate(before=>JSON.stringify({les:LEARN_UI.exportData().les,rev:LEARN_UI.exportData().rev,stat:LEARN_UI.exportData().stat})===before,before),'Reading formulas does not advance lessons, reviews or rewards');
    await page.locator('#nSearch').fill('反射率'); await page.waitForTimeout(450); await snap();
    check(await page.locator('[data-formula-pack="physopt-u6-wave"]').count()===1,'Search finds formula symbols and explanations');
    await page.locator('#nSearch').fill('1 ÷ 0.5'); await page.waitForTimeout(450); await snap();
    check(await page.locator('.lnote-summary').count()===1&&await page.locator('.lnote-summary').getAttribute('data-formula-pack')==='physopt-u1-language','Search includes the simple numeric warmups');
    await page.locator('#nSearch').fill('不存在的筆記xyz'); await page.waitForTimeout(450); await snap();
    check((await page.locator('#learnBody').textContent()).includes('找不到符合的筆記'),'Unmatched search shows useful empty state');
    await page.locator('#nSearch').fill(''); await page.waitForTimeout(450); await snap();
    await page.evaluate(()=>{
      const p=LEARN_UI.packs.find(p=>p.id==='physopt-u1-language'),other=LEARN_UI.packs.find(p=>p.subject==='eye_ans');
      LEARN_UI.exportData().les[p.id+'/'+p.lessons[0].id]={done:1,i:0,best:3};
      LEARN_UI.exportData().les[other.id+'/'+other.lessons[0].id]={done:1,i:0,best:2};
      App.go('learn',{tab:'notes'});
    }); await snap();
    check(await page.locator('.lnote-les').count()===2,'Previously learned notes remain accessible alongside formula summaries');
    check(await page.evaluate(()=>[...document.querySelectorAll('.lnote-summary')].every(d=>d.parentElement.firstElementChild===d||d.previousElementSibling?.classList.contains('lnote-cram'))),'Summary remains above earned lesson cards');
    await click(page.locator('[data-nf="eye_ans"]')); await snap();
    check(await page.locator('.lnote-summary').count()===0&&await page.locator('.lnote-les').count()===1,'Other subjects retain their existing notes and filter');
    await click(page.locator('[data-nf="physopt"]')); await snap();
    check(await page.locator('.lnote-summary').count()===6&&await page.locator('.lnote-les').count()===1,'Physiological optics filter includes six summaries and read cards');
    await click(page.locator('#nOpenAll')); await snap();
    check(await page.locator('.lnote-summary[open]').count()===6,'Expand all includes summaries without marking lessons complete');
    await click(page.locator('#nCloseAll')); await snap();
    check(await page.locator('.lnote-summary[open]').count()===0,'Collapse all closes summaries');
    await click(page.locator('#nOpenAll')); await snap();
    // 關閉其他統整，保持截圖只展示一個單元。
    await page.evaluate(()=>document.querySelectorAll('.lnote-summary').forEach(d=>d.open=d.dataset.formulaPack==='physopt-u1-language'));
    await click(page.locator('[data-formula-pack="physopt-u1-language"] [data-formula-jump]').first()); await snap();
    await page.screenshot({path:'output/playwright/formulas-notes.png',animations:'disabled'});
    await page.setViewportSize({width:390,height:844}); await snap();
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'390px formula note has no page overflow');
    await page.screenshot({path:'output/playwright/formulas-mobile.png',animations:'disabled'});
    const matrixNote=page.locator('[data-formula-pack="physopt-u5-matrix"]');
    await click(matrixNote.locator(':scope > summary')); await snap();
    await click(matrixNote.locator('[data-formula-jump]').nth(4)); await snap();
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Long matrix and multiple equations fit the phone width');
    await page.screenshot({path:'output/playwright/formulas-mobile-matrix.png',animations:'disabled'});
    const imported=await page.evaluate(async()=>{
      const pack=structuredClone(LEARN_UI.packs.find(p=>p.id==='physopt-u1-language'));
      const file=new File([JSON.stringify(pack)],'physopt-u1.json',{type:'application/json'});
      const result=await IMP.scan([file]);
      const note=result.packs[0]?.pack.notes?.find(n=>n.kind==='formula-summary');
      return {bad:result.bad.length,n:note?.formulas.length,warmup:note?.formulas[0]?.warmup};
    });
    check(imported.bad===0&&imported.n===6&&imported.warmup.includes('6 m/s'),'Importer preserves formula notes and numeric warmups');
    const legacyImport=await page.evaluate(async()=>{
      const original=structuredClone(LEARN_UI.packs.find(p=>p.id==='physopt-u1-language'));
      const db=await new Promise((resolve,reject)=>{const r=indexedDB.open(SKEY('import'),1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
      const write=data=>new Promise((resolve,reject)=>{const t=db.transaction('items','readwrite');t.objectStore('items').put({id:'learn:'+original.id,kind:'learn',data});t.oncomplete=resolve;t.onerror=()=>reject(t.error);});
      try{
        const old=structuredClone(original);delete old.notes;await write(old);await IMP.load();
        const kept=LEARN_UI.packs.find(p=>p.id===original.id).notes?.find(n=>n.kind==='formula-summary')?.formulas.length===6;
        await write({...old,notes:[]});await IMP.load();
        const cleared=LEARN_UI.packs.find(p=>p.id===original.id).notes.length===0;
        await write(original);await IMP.load();return {kept,cleared};
      }finally{
        await new Promise((resolve,reject)=>{const t=db.transaction('items','readwrite');t.objectStore('items').delete('learn:'+original.id);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});db.close();
      }
    });
    check(legacyImport.kept,'Older imported packs keep the new built-in formula summaries');
    check(legacyImport.cleared,'An explicit empty notes array can replace old notes');
    await page.reload();await page.waitForFunction(()=>typeof App!=='undefined'&&document.querySelector('#screen .panel'));
    await page.evaluate(()=>{VOL.set('muted',true);App.go('learn',{tab:'notes'});});await snap();
    check(await page.locator('.lnote-summary').count()===6&&await page.locator('.lnote-les').count()===2,'Reload preserves the existing learned cards and new summaries');
    await page.evaluate(()=>App.go('learn',{pack:'physopt-u1-language'})); await snap();
    check((await page.locator('#screen').textContent()).includes('光學共同語言'),'Original course screen still opens after note browsing');
    check(await page.evaluate(()=>__formulaErrors.length===0),'No JavaScript errors in note, filter, mobile, importer or course flows');
    return {result:'passed',checks:checks.length,details:checks,iosPath:await page.evaluate(()=>IS_IOS),localStorage:'restored in finally'};
  } finally {
    await page.evaluate(backup=>{VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(backup))localStorage.setItem(k,v);},backup);
  }
}
