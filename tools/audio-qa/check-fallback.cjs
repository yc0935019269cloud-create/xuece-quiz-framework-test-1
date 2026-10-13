async (page) => {
  const report={checks:[]};const check=(ok,msg)=>{if(!ok)throw new Error(msg);report.checks.push(msg);};
  try {
    await page.unroute('**/assets/ambient/fire.mp3');
    await page.reload();await page.waitForFunction(()=>typeof App!=='undefined'&&document.querySelector('#screen .panel'));
    await page.evaluate(()=>{BGM.setCfg({mode:'one',one:'select'});App.go('settings');});
    await page.locator('#topTitle').tap();
    await page.evaluate(()=>{const c=__contexts[0],decode=c.decodeAudioData.bind(c);c.decodeAudioData=data=>data.byteLength===293488?Promise.reject(new Error('Injected decode failure')):decode(data);});
    await page.evaluate(()=>{VOL.set('amb_fire',0.5);VOL.set('amb_rain',0.5);});
    await page.waitForFunction(()=>AMB.status().fire?.backend==='media'&&AMB.status().fire.playing&&AMB.status().rain?.backend==='buffer'&&AMB.status().rain.playing);
    check(await page.evaluate(()=>__media.filter(a=>a.src.includes('/ambient/fire.mp3')).length===1),'Failed iOS ambient decode falls back to one looping media player');
    check(await page.evaluate(()=>__contexts.length===1&&__media.filter(a=>a.src.includes('/ambient/fire.mp3')).every(a=>a.loop&&a.playbackRate===1)),'Fallback shares the same engine and preserves normal speed');
    await page.evaluate(()=>VOL.set('muted',true));
    await page.waitForFunction(()=>!AMB.status().fire.playing&&!AMB.status().rain.playing);
    await page.evaluate(()=>VOL.set('muted',false));
    await page.waitForFunction(()=>AMB.status().fire.playing&&AMB.status().rain.playing);
    check(true,'Mixed buffer/media fallback restores correctly after mute');
    check(await page.evaluate(()=>__audioErrors.length===0),'Handled decode failure produces no unhandled JavaScript rejection');
    return {result:'passed',totalChecks:report.checks.length,...report};
  } finally {await page.evaluate(()=>{VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(__audioBackup))localStorage.setItem(k,v);});}
}
