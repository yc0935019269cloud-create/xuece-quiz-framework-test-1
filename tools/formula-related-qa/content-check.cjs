const fs=require('fs'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
const load=(s,name)=>{const c={window:{}};vm.runInNewContext(s,c);return c.window[name];};
const current=load(fs.readFileSync('data/learn.js','utf8'),'LEARN'),previous=load(cp.execFileSync('git',['show','HEAD:data/learn.js'],{encoding:'utf8',maxBuffer:16e6}),'LEARN');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const clean=p=>{p=JSON.parse(JSON.stringify(p));for(const n of p.notes||[])for(const f of n.formulas||[]){delete f.relatedQuestions;delete f.relatedHint;}return p;};
assert.equal(hash(current.packs.map(clean)),hash(previous.packs.map(clean)),'Existing course, formulas, summaries and progress IDs changed');
assert.equal(hash(current.packs.find(p=>p.id==='physopt-u6-wave')),hash(previous.packs.find(p=>p.id==='physopt-u6-wave')),'Unit six must be unchanged');
const bank=load(fs.readFileSync('data/bank.js','utf8'),'QB'),oldBank=load(cp.execFileSync('git',['show','HEAD:data/bank.js'],{encoding:'utf8',maxBuffer:16e6}),'QB');
delete bank.built;delete oldBank.built;assert.equal(hash(bank),hash(oldBank),'Question content must be unchanged');
const Q=Object.fromEntries(Object.values(bank.questions).map(q=>[q.id,q])),EX=Object.fromEntries(Object.values(bank.exams).map(ex=>[ex.id,ex]));
const groups=[],unique=new Set(),teachers=new Set();
for(const p of current.packs.filter(p=>/^physopt-u[1-5]-/.test(p.id))){
 const note=p.notes.find(n=>n.kind==='formula-summary');
 for(const f of note.formulas){
  assert.ok(f.relatedQuestions.length>0);assert.equal(new Set(f.relatedQuestions).size,f.relatedQuestions.length);
  let teacher=0,exam=0,practice=0;
  for(const id of f.relatedQuestions){
   const q=Q[id];assert.ok(q?.stem&&q?.ex&&EX[q.exam]);assert.equal(EX[q.exam].subj,'physopt');assert.ok(!/u6/.test(id));unique.add(id);
   if(id.startsWith('physopt-teacher-')){teacher++;teachers.add(id);}else if(id.startsWith('physopt-exam-'))exam++;else practice++;
  }
  const first=f.relatedQuestions[0];if(teacher)assert.ok(first.startsWith('physopt-teacher-'),'Teacher questions should appear first');
  groups.push({pack:p.id,formula:f.id,links:f.relatedQuestions.length,teacher,exam,practice});
 }
}
assert.equal(groups.length,50);assert.ok(current.packs.find(p=>p.id==='physopt-u1-language').notes.find(n=>n.kind==='formula-summary').formulas[1].relatedHint.includes('沒有直接問週期'));
const report={result:'passed',formulaGroups:groups.length,links:groups.reduce((n,g)=>n+g.links,0),uniqueQuestions:unique.size,teacherQuestions:teachers.size,unchangedPacks:current.packs.length,unitSixUnchanged:true,questionContentUnchanged:true,groups};
fs.writeFileSync('output/playwright/formula-related-content-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,groups:undefined}));
