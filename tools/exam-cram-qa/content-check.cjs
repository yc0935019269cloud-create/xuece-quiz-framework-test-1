const fs=require('fs'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const load=text=>{const c={window:{}};vm.runInNewContext(text,c);return c.window.LEARN;};
const current=load(fs.readFileSync('data/learn.js','utf8')),previous=load(cp.execFileSync('git',['show','HEAD:data/learn.js'],{encoding:'utf8',maxBuffer:16e6}));
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const withoutCram=p=>{p=JSON.parse(JSON.stringify(p));if(p.notes)p.notes=p.notes.filter(n=>n.kind!=='exam-cram');return p;};
assert.equal(hash(Array.from(current.packs,withoutCram)),hash(Array.from(previous.packs,withoutCram)),'Courses, original formula summaries and progress IDs must be unchanged');
const evidence=JSON.parse(fs.readFileSync('output/playwright/exam-cram-evidence.json','utf8'));
assert.equal(evidence.curatedQuestionCount,421);assert.equal(evidence.archiveQuestionCount,1300);assert.equal(evidence.archivePapers.length,26);
const packs=current.packs.filter(p=>p.subject==='physopt'),checked=[];
assert.equal(packs.length,6);
for(const pack of packs){
 const unit=Number(pack.id.split('-')[1].slice(1)),note=pack.notes.find(n=>n.kind==='exam-cram');
 assert.equal(pack.notes[0],note);assert.equal(note.title,'考前必看');
 assert.ok(note.items.length>=2&&note.items.length<=5);
 for(const item of note.items){
  const row=unit<=5?evidence.families['u'+unit+':'+item.id]:evidence.waveFamilies[item.id];
  assert.equal(hash(item.evidence),hash({count:row.count,questionIds:row.questionIds,years:row.years}));
  assert.equal(new Set(item.evidence.questionIds).size,item.evidence.count);
  assert.ok(item.evidence.count>0&&item.evidence.years.length>=2);
  assert.ok(item.use.length<=60&&item.tip.length<=80,'Cram copy must be concise');
  checked.push({unit,item:item.id,relatedQuestions:row.count,years:row.years});
 }
}
assert.equal(checked.length,22);
assert.equal(packs.find(p=>p.id==='physopt-u5-matrix').notes[0].items[0].id,'prentice');
assert.ok(!packs.find(p=>p.id==='physopt-u6-wave').notes[0].items.some(i=>/slit|phase/.test(i.id)),'Do not label unmatched slit formulas as frequent exam topics');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
near(.5*Math.abs(-4),2); // 5 mm with −4 D induces 2Δ.
near(2.5/(1-.15*2.5)-2,2); // 114 high exam Q7: outgoing vergence from lens two.
near(1/(2.5/(1-.15*2.5)-2),.5);
near(-10/(1-.003*(-10)),-9.70873786407767); // 114 high exam Q44: move 3 mm closer.
near(Math.hypot(3,4),5);
const report={result:'passed',units:6,concisePriorities:22,originalUnitsAndFormulaNotesUnchanged:current.packs.length,scope:evidence.scope,curatedQuestions:421,archivePapers:26,archiveQuestions:1300,matchedPriorities:checked};
fs.writeFileSync('output/playwright/exam-cram-content-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({result:'passed',priorities:22,units:6,originalUnitsUnchanged:current.packs.length}));
