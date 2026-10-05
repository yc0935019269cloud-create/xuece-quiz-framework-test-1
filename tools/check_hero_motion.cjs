const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert');
(async()=>{const browser=await chromium.launch(process.env.PW_EXE?{executablePath:process.env.PW_EXE,headless:true}:{channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1280,height:900}});await page.goto('http://127.0.0.1:8965/docs/hero-art/preview.html');
const result=await page.evaluate(async()=>{
 await Promise.all(HeroAnim.ACTORS.map(a=>HeroAnim.load(a).ready));
 const host=document.createElement('div');host.style='position:fixed;left:0;top:0;width:1000px;display:grid;grid-template-columns:repeat(10,96px);z-index:500;background:#182036';document.body.appendChild(host);
 host.innerHTML=HeroAnim.ACTORS.map(a=>'<div>'+HeroAnim.html(a.id,96)+'</div>').join('');const targets=[...host.children],bad=[];let normal=0,critical=0;
 await Promise.all(targets.map(t=>HeroAnim.frame(t,0)));await new Promise(r=>setTimeout(r,130));
 for(let variant=0;variant<4;variant++){
  const tasks=targets.map(t=>HeroAnim.play(t,'attack',variant));
  await new Promise(r=>setTimeout(r,445));
  targets.forEach(t=>{const c=t.querySelector('canvas');if(Number(c.dataset.pose)!==2+variant)bad.push(t.firstElementChild.dataset.heroActor+':attack'+variant+':'+c.dataset.pose);else normal++;});
  await Promise.all(tasks);
 }
 const tasks=targets.map(t=>HeroAnim.play(t,'critical'));await new Promise(r=>setTimeout(r,530));
 targets.forEach(t=>{const c=t.querySelector('canvas');if(Number(c.dataset.pose)!==7)bad.push(t.firstElementChild.dataset.heroActor+':critical:'+c.dataset.pose);else critical++;});
 await Promise.all(tasks);host.remove();return {normal,critical,total:normal+critical,bad};
});console.log(JSON.stringify(result));assert.deepEqual(result.bad,[]);assert.equal(result.normal,160);assert.equal(result.critical,40);
const file=path.resolve(__dirname,'../docs/hero-art/qa-report.json'),report=JSON.parse(fs.readFileSync(file,'utf8'));report.animations=result;fs.writeFileSync(file,JSON.stringify(report,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

