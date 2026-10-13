async (page) => {
  const report={engine:'Chromium Web Audio with iOS routing emulation on Windows',checks:[],hardwareVerified:false};
  const check=(ok,msg)=>{if(!ok)throw new Error(msg);report.checks.push(msg);};
  try {
    await page.evaluate(()=>{localStorage.clear();for(const[k,v]of Object.entries(__audioBackup))localStorage.setItem(k,v);});
    await page.goto('http://127.0.0.1:8977/index.html');await page.waitForFunction(()=>typeof App!=='undefined'&&document.querySelector('#screen .panel'));
    await page.evaluate(()=>{BGM.setCfg({mode:'one',one:'select'});App.go('settings');});
    check(await page.evaluate(()=>IS_IOS && __contexts.length===0 && BGM.status().players===1),'iOS chooses one music player and waits for a gesture');
    report.device=await page.evaluate(()=>navigator.userAgent.includes('iPhone')?'iPhone':'iPad');
    await page.locator('#topTitle').tap();
    await page.waitForFunction(()=>AUDIO_ENGINE.status().state==='running' && BGM.status().playing && BGM.status().t>0.1);
    await page.evaluate(()=>Object.keys(AMB.TYPES).forEach(k=>VOL.set('amb_'+k,0.55)));
    await page.waitForFunction(()=>Object.keys(AMB.TYPES).every(k=>AMB.status()[k]?.backend==='buffer' && AMB.status()[k].playing),{timeout:20000});
    const loaded=await page.evaluate(()=>({ctx:AUDIO_ENGINE.status(),ambient:AMB.status(),contexts:__contexts.length,media:__media.filter(a=>a.src.includes('/assets/ambient/')).length,loopSources:__sources.filter(s=>s.loop).length}));
    report.loaded=loaded;
    check(loaded.contexts===1 && loaded.media===0 && loaded.loopSources===4,'All four ambient files decode into one engine without extra media players');
    check(await page.evaluate(()=>__sources.filter(s=>s.loop).every(s=>s.buffer.sampleRate===__contexts[0].sampleRate && s.playbackRate.value===1)),'Ambient sample rates match the output engine and playback rates stay at 1');
    await page.evaluate(()=>{SFX.play('correct');SFX.combo(8);SFX.chime('bell',0.2,1);});
    check(await page.evaluate(()=>__contexts.length===1 && __mediaRoutes.every(r=>r.ctx===__contexts[0])),'Music, ambient, effects and timer chimes share one AudioContext');
    for(const k of ['rain','waves','stream','fire']) {
      await page.evaluate(k=>AMB._seek(k,AMB.status()[k].duration-0.15),k);
      const count=await page.evaluate(()=>__sources.filter(s=>s.loop).length);
      await page.evaluate(()=>{const end=performance.now()+500;while(performance.now()<end){};});
      await page.waitForFunction(k=>AMB.status()[k].t<2 && AMB.status()[k].playing,k);
      check(await page.evaluate(n=>__sources.filter(s=>s.loop).length===n,count),k+' crosses the loop boundary during a blocked main thread without replacing its source');
    }
    const t=await page.evaluate(()=>BGM.status().t);
    await page.evaluate(()=>{BGM.play('title');BGM.play('select');BGM.play('stage2');});
    await page.waitForFunction(t=>BGM.status().t>t,t);
    check(await page.evaluate(()=>BGM.current==='select' && BGM.status().players===1 && __media.filter(a=>a.src.includes('/assets/music/')).length===1),'Single-song mode keeps playing across scene changes without replacing the music player');
    await page.evaluate(()=>VOL.set('muted',true));
    await page.waitForFunction(()=>Object.values(AMB.status()).every(s=>!s.playing) && !BGM.status().playing);
    check(true,'Mute stops music and all ambient loops');
    await page.evaluate(()=>{for(let i=0;i<5;i++){VOL.set('muted',false);VOL.set('muted',true);}VOL.set('muted',false);});
    await page.waitForFunction(()=>Object.values(AMB.status()).every(s=>s.playing)&&BGM.status().playing);
    check(await page.evaluate(()=>__contexts.length===1),'Rapid mute/unmute restores every channel without creating another engine');
    await page.evaluate(()=>VOL.set('amb_rain',0));
    check(await page.evaluate(()=>!AMB.status().rain.playing && ['waves','stream','fire'].every(k=>AMB.status()[k].playing)),'Turning off one ambient channel preserves the other three');
    await page.evaluate(()=>VOL.set('amb_rain',0.55));
    await page.evaluate(()=>BGM.hold(true));
    await page.waitForFunction(()=>!BGM.status().playing);
    check(await page.evaluate(()=>Object.values(AMB.status()).every(s=>s.playing)),'Pomodoro music hold does not stop ambient loops');
    await page.evaluate(()=>BGM.hold(false));
    await page.waitForFunction(()=>BGM.status().playing);
    await page.evaluate(()=>{BGM.setCfg({mode:'list',list:['select','c_balance'],shuffle:false});const a=__media.find(a=>a.src.includes('/assets/music/'));a.dispatchEvent(new Event('ended'));});
    await page.waitForFunction(()=>BGM.current==='c_balance' && BGM.status().playing);
    check(await page.evaluate(()=>BGM.status().players===1 && BGM.status().rate===1),'Playlist advances at normal speed using the same player');
    await page.evaluate(()=>{
      const c=__contexts[0],s=c.suspend.bind(c),r=c.resume.bind(c);window.__interruptCalls=[];
      c.suspend=()=>{__interruptCalls.push('suspend');return s();};
      c.resume=()=>{__interruptCalls.push('resume');delete c.state;return r();};
      Object.defineProperty(c,'state',{configurable:true,get:()=> 'interrupted'});
      AUDIO_ENGINE.wake();
    });
    await page.waitForFunction(()=>AUDIO_ENGINE.status().state==='running'&&__interruptCalls.join(',')==='suspend,resume');
    check(await page.evaluate(()=>__contexts.length===1 && Object.values(AMB.status()).every(s=>s.playing)),'Injected interrupted state recovers with suspend/resume on the existing engine');
    await page.evaluate(()=>{
      const c=__contexts[0],resume=c.resume.bind(c);window.__blockedResumes=0;
      Object.defineProperty(c,'state',{configurable:true,get:()=> 'suspended'});
      c.resume=()=>{if(++__blockedResumes===1)return new Promise(()=>{});delete c.state;return resume();};
      AUDIO_ENGINE.wake();
    });
    await page.locator('#topTitle').tap();
    await page.waitForFunction(()=>__blockedResumes>=2 && AUDIO_ENGINE.status().state==='running');
    check(true,'A trusted touch retries a pending blocked resume instead of waiting forever');
    await page.evaluate(()=>{const a=__media.find(a=>a.src.includes('/assets/music/'));a.pause();dispatchEvent(new Event('focus'));});
    await page.waitForFunction(()=>BGM.status().playing);
    check(true,'Returning focus restarts a system-paused music element');
    await page.evaluate(()=>__contexts[0].suspend());
    await page.waitForFunction(()=>AUDIO_ENGINE.status().state==='running');
    check(true,'Foreground watchdog resumes an unexpected suspended engine');
    check(await page.evaluate(()=>__audioErrors.length===0),'No JavaScript errors or unhandled playback rejections');
    report.totalChecks=report.checks.length;report.result='passed';
    return report;
  } catch(e) { throw new Error(e.message+'; last passed: '+report.checks.at(-1));
  } finally {
    await page.evaluate(()=>{VOL.set('muted',true);localStorage.clear();for(const[k,v]of Object.entries(__audioBackup))localStorage.setItem(k,v);});
  }
}
