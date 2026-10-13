async (page) => {
  const checks=[]; const check=(ok,msg)=>{if(!ok)throw new Error(msg);checks.push(msg);};
  try {
    await page.evaluate(()=>App.go('bank'));
    const first=page.locator('.bank-card').first(),id=await first.getAttribute('data-qid');
    const before=await page.evaluate(()=>JSON.stringify(Store.qs));
    check(await page.locator('.bank-card').count()===30 && await first.locator('.qpreview-choice').count()===4,'Question bank still renders full stems and choices after merge');
    await page.waitForFunction(()=>document.querySelector('.bank-toggle > .hap-sw'));
    await first.locator('.bank-toggle').tap();
    check(await first.locator('.bank-explanation').isVisible() && await first.locator('.explain').count()===1,'Native haptic overlay tap expands details exactly once');
    await page.waitForFunction(()=>document.querySelector('.bank-toggle > .hap-sw'));
    await first.locator('.bank-toggle').tap();
    check(await first.locator('.bank-explanation').isHidden(),'Replacement haptic overlay still collapses details');
    await first.locator('.qpreview-choice').first().tap();
    check(await first.locator('.bank-explanation').isVisible() && await page.evaluate(()=>JSON.stringify(Store.qs))===before,'Reading choices preserves answer records with haptics enabled');
    await first.locator('.bank-practice').tap();
    const key=await page.evaluate(id=>Store.Q[id].key,id);
    const count=await page.evaluate(id=>Store.qs[id]?.a||0,id);
    await page.locator('.modal .opt[data-l="'+key+'"]').tap();
    check(await page.evaluate(id=>Store.qs[id].a,id)===count+1,'Haptic answer overlay records practice once');
    await page.locator('.modal button.close').tap();
    check(await first.locator('.bank-explanation').isVisible(),'Practice closes and refreshes the expanded question card');
    await page.evaluate(()=>{VOL.set('muted',false);['thump','boom','oof','hit','crit'].forEach(SFX.play);});
    check(await page.evaluate(()=>typeof HAPTIC!=='undefined' && __contexts.length===1),'Upstream impact sounds and haptics remain on the shared audio engine');
    await page.evaluate(()=>App.go('learn'));
    check(await page.evaluate(()=>document.querySelector('#screen').textContent.includes('學習')),'Upstream learning screen still loads');
    check(await page.evaluate(()=>__audioErrors.length===0),'No merged UI or audio JavaScript errors');
    return {result:'passed',totalChecks:checks.length,checks};
  } finally {await page.evaluate(()=>{VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(__audioBackup))localStorage.setItem(k,v);});}
}
