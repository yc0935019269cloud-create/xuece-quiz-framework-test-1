const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto('http://127.0.0.1:8965/index.html');
 await page.waitForFunction(()=>document.querySelector('.modal-bg'));
 await page.evaluate(()=>{
  Store.profile.starterPicked=true;Store.profile.activeClass='knight';
  Store.profile.heroSkin={knight:'px_knight_f1'};Store.profile.ownedHeroSkins=['knight:px_knight_f1'];
  SFX.play=()=>{};BGM.play=()=>{};
  const q=Object.values(Store.Q).find(q=>q.type==='single'&&q.key?.length===1);
  const run=Run.create({mode:'free',cls:'knight',subjects:[q.subj],types:['single'],count:20},Array(20).fill(q.id));
  App.go('run',run);
 });
 if(await page.locator('#modalRoot .modal-bg').count())await page.getByRole('button',{name:'迎戰！',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#eHero canvas')?.dataset.pose);
 await page.screenshot({path:'docs/hero-art/screenshots/battle-mobile-latest.png',fullPage:true});
 console.log(await page.evaluate(()=>({hero:document.querySelector('#eHero [data-hero-actor]').dataset.heroActor,width:document.documentElement.scrollWidth,viewport:innerWidth})));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
