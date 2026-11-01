const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const url = require('url').pathToFileURL(path.resolve(__dirname, '../../index.html')).href;
const out = { checks: [], errors: [] };
const check = (name, ok) => out.checks.push({ name, ok: !!ok });
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [1100, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 });
    const page = await ctx.newPage(), errors = []; page.setDefaultTimeout(6000); let offline = false, requests = 0;
    page.on('pageerror', e => errors.push(e.message));
    await page.route('https://commons.wikimedia.org/w/api.php?*', route => {
      requests++; if (offline) return route.abort();
      const pages = {}; for (let i=0;i<3;i++) pages[i] = {title:`File:Test${i}.jpg`,imageinfo:[{mime:'image/jpeg',url:`https://upload.wikimedia.org/full${i}.jpg`,thumburl:`https://upload.wikimedia.org/thumb${i}.jpg`,descriptionurl:`https://commons.wikimedia.org/wiki/File:Test${i}.jpg`,extmetadata:{LicenseShortName:{value:'CC BY 4.0'},Artist:{value:i===0?'<script>window.__pwned=1</script><b>Artist</b>':'Artist'}}}]};
      return route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({query:{pages}})});
    });
    await page.route('https://test.invalid/**', route => route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify(route.request().url().includes('ai_status') ? {allowed:true} : {text:'角膜（Cornea）、鞏膜與瞳孔。',provider:'fixture'})}));
    let backup;
    try {
      await page.goto(url); await page.waitForFunction(() => typeof PICFIND !== 'undefined' && typeof LEARN_UI !== 'undefined');
      backup = await page.evaluate(() => ({...localStorage})); await page.evaluate(() => U.clearModals());
      const matches = await page.evaluate(() => ['瞳孔','睫狀體','眼動脈'].map(n => ({n, count:PICFIND.siteImages({zh:n}).length})));
      check(width+' site image data '+JSON.stringify(matches), matches.some(x=>x.count));
      await page.evaluate(() => PICFIND.open({zh:'睫狀體'}));
      check(width+' red circle', await page.locator('.picfind .term-pin').count()>0);
      await page.locator('.picfind .lp-img').first().click(); check(width+' existing zoom', await page.locator('.img-zoom').count()===1); await page.keyboard.press('Escape');
      await page.locator('.picfind button').first().click(); await page.locator('.picfind-results figure').first().waitFor();
      check(width+' Commons metadata', await page.locator('.picfind-results figure').count()===3 && (await page.locator('.picfind-results').innerText()).includes('CC BY 4.0') && await page.locator('.picfind-results a[rel=noopener]').count()===3);
      check(width+' untrusted script', await page.evaluate(() => !window.__pwned && !document.querySelector('.picfind-results script')));
      check(width+' layout', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('.picfind').getBoundingClientRect().width <= innerWidth));
      await page.keyboard.press('Escape'); check(width+' Esc', await page.locator('.picfind').count()===0);
      const before = requests; await page.evaluate(() => PICFIND.open({zh:'不存在測試結構',en:'imaginary structure'})); await page.locator('.picfind-results figure').first().waitFor(); check(width+' auto Commons', requests>before);
      await page.locator('.modal-contained .close').click(); offline=true; await page.evaluate(() => PICFIND.open({zh:'不存在測試結構',en:'imaginary structure'})); await page.getByText('連不到維基共享資源（需要網路）').waitFor(); check(width+' offline', true); await page.keyboard.press('Escape'); offline=false;
      await page.evaluate(() => { const e=document.createElement('div'); e.className='lp-body'; e.textContent='瞳孔'; document.body.appendChild(e); GLOSS.scan(e); });
      await page.locator('.lp-body .gl').last().click(); check(width+' glossary button',await page.locator('.gl-pop .gl-picture').count()===1); await page.locator('.gl-pop .gl-picture').click(); check(width+' glossary opens',await page.locator('.picfind').count()===1); await page.keyboard.press('Escape');
      await page.evaluate(() => { Object.defineProperty(CLOUD,'signedIn',{configurable:true,get:()=>true}); Object.defineProperty(CLOUD,'email',{configurable:true,get:()=> 'qa'}); CLOUD.cfg=()=>({url:'https://test.invalid',key:'test'}); CLOUD.token=async()=> 'test'; AI.open(); });
      await page.locator('#aiPanel textarea').fill('角膜是什麼'); await page.locator('#aiPanel [data-act=send]').click(); await page.locator('#aiPanel [data-act=picture]').last().waitFor(); await page.locator('#aiPanel [data-act=picture]').last().click();
      check(width+' AI chooser',await page.locator('.picfind-choice button').count()>1); await page.locator('.picfind-choice button').first().click(); check(width+' AI chooser opens',await page.locator('.picfind').count()===1); await page.keyboard.press('Escape');
      await page.locator('#aiPanel textarea').fill('睫狀體長怎樣'); await page.locator('#aiPanel [data-act=send]').click(); await page.locator('.picfind').waitFor(); check(width+' AI auto open', (await page.locator('#aiPanel').innerText()).includes('已為你找出「睫狀體」的圖')); await page.keyboard.press('Escape');
    } catch (e) { errors.push(e.stack || String(e)); }
    if (backup) await page.evaluate(b => { localStorage.clear(); for(const [k,v] of Object.entries(b)) localStorage.setItem(k,v); }, backup).catch(()=>{});
    check(width+' no page errors', errors.length===0); out.errors.push(...errors.map(error=>({width,error}))); await ctx.close();
  }
  await browser.close(); out.passed=out.checks.filter(c=>c.ok).length; out.total=out.checks.length;
  fs.writeFileSync(path.resolve(__dirname,'../../docs/picfind-qa.json'),JSON.stringify(out,null,2)); console.log(JSON.stringify(out,null,2)); if(out.passed!==out.total||out.errors.length) process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
