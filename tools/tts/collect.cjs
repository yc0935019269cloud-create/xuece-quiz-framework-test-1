const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(process.env.PW_EXE?{executablePath:process.env.PW_EXE,args:['--allow-file-access-from-files']}:{args:['--allow-file-access-from-files']});
 const pg=await b.newPage();await pg.goto('file://'+require('path').resolve(__dirname,'../../index.html'));await pg.waitForTimeout(1500);
 const r=await pg.evaluate(()=>{const s=new Set();(window.LEARN.glossary||[]).forEach(e=>e.en&&s.add(e.en));
  (window.LEARN.packs||[]).forEach(p=>(p.lessons||[]).forEach(l=>(l.steps||[]).forEach(st=>{if(st.type==='diagram')(st.points||[]).forEach(pt=>{const m=(pt.name||'').match(/[A-Za-z].*$/);if(m)s.add(m[0]);});})));
  return [...s];});
 require('fs').writeFileSync(require('path').join(__dirname,'terms.json'),JSON.stringify(r,null,1));console.log(r.length,r.slice(0,10));await b.close();})();
