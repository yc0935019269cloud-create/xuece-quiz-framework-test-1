/* Real gallery controls, desktop/mobile and file://; no player storage is accessed. */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),assert=require('assert');
const {pathToFileURL}=require('url');
const root=path.resolve(__dirname,'..');
const report={classes:[],errors:[],widths:[],ok:false};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'docs/hero-art/preview.html')).href);
  await page.waitForFunction(()=>typeof HeroAnim!=='undefined'&&typeof FX!=='undefined');
  assert.equal(await page.locator('[data-class]').count(),8);
  for(const cls of ['knight','mage','ranger','cleric','berserker','assassin','monk','bard']){
   await page.locator('[data-class="'+cls+'"]').click();
   assert.equal(await page.locator('[data-actor]').count(),16);
   await page.waitForFunction(cls=>document.querySelector('#eHero canvas')?.dataset.pose&&document.querySelector('#eHero [data-hero-actor]')?.dataset.heroActor==='px_'+cls+'_m1',cls);
   for(const move of ['0','1','2','3','random','critical']){
    await page.locator('[data-move="'+move+'"]').click();
    await page.waitForFunction(()=>!document.querySelector('[data-move="0"]').disabled);
    assert((await page.locator('#status').textContent()).includes('已回到待機'));
   }
   await page.locator('[data-actor="px_'+cls+'_f8"]').click();
   await page.waitForFunction(cls=>document.querySelector('#eHero [data-hero-actor]')?.dataset.heroActor==='px_'+cls+'_f8'&&document.querySelector('#eHero canvas')?.dataset.pose,cls);
   assert.equal(await page.evaluate(async cls=>(await HeroAnim.load(HeroAnim.get('px_'+cls+'_f8')).ready).status,cls),'ready');
   report.classes.push(cls);
  }
  for(const width of [1280,390]){
   await page.setViewportSize({width,height:900});
   await page.locator('[data-class="assassin"]').click();
   await page.locator('[data-actor="px_assassin_m1"]').click();
   await page.evaluate(()=>scrollTo(0,0));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));
   await page.screenshot({path:path.join(root,'output/playwright/hero-expansion-gallery-'+width+'.png')});
   report.widths.push(width);
  }
  assert.deepEqual(report.errors,[]);report.ok=true;
 }finally{await browser.close();}
})().catch(e=>{report.failure=e.stack;process.exitCode=1;}).finally(()=>{
 fs.writeFileSync(path.join(root,'docs/hero-art/expansion-gallery-qa.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
});
