const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const ROOT=path.resolve(__dirname,'..'),base=path.join(ROOT,'資源','114 大一下');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?files(path.join(dir,x.name)):[path.join(dir,x.name)]);}
const all=files(base),visible=all.filter(f=>!path.relative(base,f).split(path.sep).some(x=>x.startsWith('.')));
const subjects=JSON.parse(fs.readFileSync(path.join(base,'00_科目設定.json'),'utf8')).subjects;
const context={window:{},SKEY:s=>'test_'+s,C:{SUBJECTS:Object.fromEntries(subjects.map(s=>[s.id,s])),THEMES:{sci:{},calc:{},mix:{}}},QB:{exams:[],questions:[],subjects:[]},LEARN:{packs:[]},console};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT,'js/importer.js'),'utf8')+';globalThis.TEST_IMP=IMP;',context);
const input=all.map(file=>({name:path.basename(file),webkitRelativePath:'114 大一下/'+path.relative(base,file).replaceAll(path.sep,'/'),text:async()=>fs.readFileSync(file,'utf8')}));
(async()=>{
 const r=await context.TEST_IMP.scan(input);
 const n=r.sets.reduce((n,s)=>n+s.qs.length,0),lessons=r.packs.reduce((n,p)=>n+p.pack.lessons.length,0);
 assert.equal(n,1445);assert.equal(r.sets.length,167);assert.equal(r.packs.length,78);assert.equal(lessons,364);
 assert.deepEqual(r.bad,[]);assert.equal(r.sets.flatMap(s=>s.missing).length+r.packs.flatMap(p=>p.missing).length,0);
 assert.equal(r.sets.flatMap(s=>s.warn).length+r.packs.flatMap(p=>p.warn).length,0);
 const importedBySubject=new Map();
 for(const f of visible.filter(x=>path.basename(x).startsWith('題庫_')&&x.endsWith('.json'))){const b=JSON.parse(fs.readFileSync(f,'utf8'));const map=importedBySubject.get(b.set.subject)||new Map();for(const q of b.questions){assert(!map.has(q.source_id));map.set(q.source_id,q);}importedBySubject.set(b.set.subject,map);}
 for(const [name,sj] of [['_data.js.json','eye_ans'],['_data-physiology.js.json','physio'],['_data-optometry.js.json','optometry'],['_data-basic-optics.js.json','basic_optics']]){
  const original=Object.values(JSON.parse(fs.readFileSync(path.join(base,'.來源',name),'utf8')))[0];const imported=importedBySubject.get(sj);assert.equal(original.questions.length,imported.size);
  for(const q of original.questions){const converted=imported.get(q.id);assert(converted);assert.deepEqual(converted.answer,q.answer);assert.deepEqual(converted.source_detail,q.detail);assert.deepEqual(converted.source_optionReviews,q.optionReviews);assert.equal(converted.source_number,q.number);assert.equal(converted.source_year,q.year);assert.equal(converted.source_subject,q.subject);assert.equal(converted.choices.length,q.choices.length);}
 }
 for(const s of r.sets)assert.equal(s.path[0],'114 大一下');
 for(const {pack} of r.packs)assert.equal(pack.path[0],'114 大一下');
 let sims=0,diagrams=0,scriptTests=0;
 for(const f of visible.filter(x=>path.basename(x).startsWith('學習_')&&x.endsWith('.json'))){
  const p=JSON.parse(fs.readFileSync(f,'utf8'));
  assert(p.lessons.length>=2&&p.lessons.length<=6);
  assert.equal(path.dirname(f),path.join(path.dirname(base),...p.path));
  for(const l of p.lessons){
   assert(l.steps.length>=8&&l.steps.length<=20,p.id+'/'+l.id);
   assert(l.steps.filter(s=>s.type==='card').length>=2);
   assert.equal(l.steps[0].type,'intro');assert.equal(l.steps.at(-1).type,'recap');
   for(let i=0;i<l.steps.length;i++){
    const s=l.steps[i];if(s.type==='card')assert.equal(l.steps[i+1]?.type,'check');
    if(s.type==='interactive'){
     sims++;assert(s.html.startsWith('<!doctype html>'));assert(s.html.length<15000);
     assert(!/(?:fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|alert\s*\(|confirm\s*\(|prompt\s*\(|https?:\/\/|<script[^>]*src=)/i.test(s.html));
     const match=s.html.match(/<script>([\s\S]*?)<\/script>/);new vm.Script(match[1]);scriptTests++;
     // Execute the real simulation JS against a small DOM fixture. Test
     // defaults and extremes; no browser automation or persistent state.
     const nodes={};const controls=[...s.html.matchAll(/<input\b([^>]+)>/g)].map(m=>{
      const attrs=Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]]));
      const item={id:attrs.id,value:attrs.value,defaultValue:attrs.value,min:attrs.min,max:attrs.max,dataset:{unit:attrs['data-unit']||''},addEventListener:(name,fn)=>{item.event=fn}};nodes[item.id]=item;return item;
     });
     const get=id=>nodes[id]||(nodes[id]={textContent:'',innerHTML:'',value:0});
     const sandbox={document:{querySelectorAll:()=>controls,getElementById:get},performance:{now:()=>0},requestAnimationFrame:()=>{},console};vm.createContext(sandbox);vm.runInContext(match[1],sandbox);
     for(const c of controls)for(const value of [c.min,c.max]){
      c.value=value;
      if(c.event)c.event();else if(c.oninput)c.oninput({target:c});
      assert(!/NaN|Infinity/.test(get('result').textContent),s.title);
     }
     if(nodes.play){nodes.play.onclick();nodes.step.onclick();nodes.reset.onclick();assert(get('count').textContent.startsWith('1 /'));}
     if(nodes.reset&&!nodes.play){nodes.reset.onclick();}
     if(s.title.startsWith('厚透鏡'))assert(get('result').textContent.includes('5.08')&&get('result').textContent.includes('5.21'));
     if(s.title.startsWith('球面鏡')){nodes.f.value='10';nodes.u.value='10';nodes.u.event();assert(get('result').textContent.includes('無限遠'));}
    }
    if(s.type==='diagram'){diagrams++;assert(s.points.length>=5&&s.points.length<=15);assert(fs.existsSync(path.join(base,s.img)));s.points.forEach(pt=>assert(pt.x>=0&&pt.x<=100&&pt.y>=0&&pt.y<=100));}
   }
  }
 }
 const preview=fs.readFileSync(path.join(base,'預覽.html'),'utf8');const scripts=[...preview.matchAll(/<script>([\s\S]*?)<\/script>/g)];assert.equal(scripts.length,1);new vm.Script(scripts[0][1]);
 const report={status:'PASS',importer:{questions:n,sets:r.sets.length,packs:r.packs.length,lessons,badFiles:r.bad.length,missingImages:0,warnings:0},sourceQuestionPreservation:'1445/1445 原ID、答案、來源編號、年份、原詳解完整保留',simulationScripts:scriptTests,simulations:sims,diagrams,lessonSteps:'8–20',folderPaths:'一致'};
 fs.writeFileSync(path.join(base,'.校驗','驗證報告.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});
