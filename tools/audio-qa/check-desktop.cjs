async (page) => {
  const report={engine:'Edge desktop',checks:[]};
  const check=(ok,msg)=>{if(!ok)throw new Error(msg);report.checks.push(msg);};
  try {
    await page.evaluate(()=>{localStorage.clear();for(const[k,v]of Object.entries(__audioBackup))localStorage.setItem(k,v);});
    await page.goto('http://127.0.0.1:8977/index.html');
    await page.waitForFunction(()=>typeof App!=='undefined'&&document.querySelector('#screen .panel'));
    await page.evaluate(()=>{BGM.setCfg({mode:'one',one:'select'});App.go('settings');});
    await page.locator('#topTitle').click();
    await page.waitForFunction(()=>BGM.status().playing && BGM.status().t>0.1);
    check(await page.evaluate(()=>!IS_IOS && BGM.status().players===2),'Desktop retains two-player music crossfade');
    await page.evaluate(()=>{VOL.set('amb_rain',0.55);VOL.set('amb_waves',0.3);});
    await page.waitForFunction(()=>AMB.status().rain?.playing && AMB.status().waves?.playing);
    await page.waitForFunction(()=>__media.filter(a=>a.src.includes('/ambient/')).every(a=>Number.isFinite(a.duration)));
    check(await page.evaluate(()=>Object.values(AMB.status()).every(s=>s.backend==='media')),'Desktop uses native media ambient playback');
    await page.evaluate(()=>SFX.play('correct'));
    check(await page.evaluate(()=>__contexts.length===1 && __mediaRoutes.length===0),'Desktop effects create one context while native music and ambient stay native');
    await page.evaluate(()=>{
      const a=__media.filter(a=>a.src.includes('/ambient/rain.mp3'));
      const from=a.find(a=>!a.paused),to=a.find(a=>a.paused);
      window.__rainFrom=from;window.__rainTo=to;window.__rainPlay=to.play.bind(to);window.__rejections=0;
      to.play=()=>{__rejections++;return Promise.reject(new DOMException('Injected rejection','NotAllowedError'));};
      AMB._seek('rain',from.duration-1);from.dispatchEvent(new Event('timeupdate'));
    });
    await page.waitForFunction(()=>__rejections>0);
    await new Promise(r=>setTimeout(r,2800));
    check(await page.evaluate(()=>AMB.status().rain.playing && !__rainFrom.paused && __rainFrom.volume>0 && __rainTo.paused),'Rejected next segment never fades out or pauses the current ambient segment');
    await page.evaluate(()=>{
      __rainTo.play=()=>new Promise(resolve=>{window.__finishRain=()=>__rainPlay().then(resolve);});
      AMB._seek('rain',__rainFrom.duration-1);__rainFrom.dispatchEvent(new Event('timeupdate'));
    });
    await page.waitForFunction(()=>typeof __finishRain==='function');
    await page.evaluate(()=>{VOL.set('muted',true);VOL.set('muted',false);__rainFrom.dispatchEvent(new Event('timeupdate'));__finishRain();});
    await new Promise(r=>setTimeout(r,2700));
    check(await page.evaluate(()=>AMB.status().rain.playing && !__rainTo.paused && __rainTo.volume>0 && __rainFrom.paused),'Delayed playback plus rapid mute/unmute cannot let a stale fade stop the latest player');
    await page.evaluate(()=>{__rainTo.play=__rainPlay;VOL.set('muted',true);});
    await page.waitForFunction(()=>!BGM.status().playing && Object.values(AMB.status()).every(s=>!s.playing));
    await page.evaluate(()=>VOL.set('muted',false));
    await page.waitForFunction(()=>BGM.status().playing && Object.values(AMB.status()).every(s=>s.playing));
    check(true,'Mute and unmute restore desktop music and ambient');
    await page.evaluate(()=>{BGM.setCfg({mode:'scene'});BGM.play('select');BGM.play('stage2');BGM.play('boss');});
    await page.waitForFunction(()=>BGM.current==='boss' && BGM.status().playing);
    check(await page.evaluate(()=>__media.filter(a=>a.src.includes('/assets/music/')).every(a=>a.playbackRate===1)),'Rapid scene changes leave the latest song at normal speed');
    check(await page.evaluate(()=>__audioErrors.length===0),'No browser JavaScript errors or unhandled rejected play promises');
    report.result='passed';report.totalChecks=report.checks.length;return report;
  } catch(e) {throw new Error(e.message+'; last passed: '+report.checks.at(-1));}
  finally {await page.evaluate(()=>{VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(__audioBackup))localStorage.setItem(k,v);});}
}
