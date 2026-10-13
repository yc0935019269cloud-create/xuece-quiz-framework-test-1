async page => {
  await page.route('http://127.0.0.1:18769/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":false}'}));
  await page.addInitScript(()=>{
    window.__formulaBackup=Object.fromEntries(Object.entries(localStorage));window.__formulaErrors=[];
    addEventListener('error',e=>__formulaErrors.push(e.message));addEventListener('unhandledrejection',e=>__formulaErrors.push(String(e.reason)));
  });
  await page.goto('http://127.0.0.1:8977/index.html');
  await page.waitForFunction(()=>typeof App!=='undefined'&&document.querySelector('#screen .panel'));
  await page.evaluate(()=>{VOL.set('muted',true);App.go('learn',{tab:'notes'});});
  return await page.evaluate(()=>({units:LEARN_UI.packs.filter(p=>p.subject==='physopt').length,notes:document.querySelectorAll('.lnote-summary').length,ios:IS_IOS}));
}
