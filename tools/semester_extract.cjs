const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '資源', '114 大一下', '.來源');
function extract(file) {
  const context = {window: {}, console};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, {timeout: 10000});
  return context.window;
}
const src = 'E:/學習/大一下/眼解剖/期末/遊戲';
for (const name of ['data.js','data-physiology.js','data-optometry.js','data-basic-optics.js']) {
  const obj = extract(path.join(src,name));
  fs.writeFileSync(path.join(out, '_'+name+'.json'), JSON.stringify(obj,null,2));
  for (const [key,b] of Object.entries(obj)) {
    console.log(name,key,Object.keys(b), 'units',b.units?.length,'questions',b.questions?.length);
    console.log('unit',JSON.stringify(b.units?.[0]));
    console.log('question',JSON.stringify(b.questions?.[0]).slice(0,5000));
  }
}
for (const host of fs.readdirSync(out).filter(s=>!s.startsWith('_'))) {
  const file = path.join(out,host,'assets/content.js');
  if (!fs.existsSync(file)) continue;
  const obj=extract(file);
  fs.writeFileSync(path.join(out,host,'_content.json'), JSON.stringify(obj,null,2));
  for(const [key,b] of Object.entries(obj)) {
    console.log(host,key,Object.keys(b));
    for(const [k,v] of Object.entries(b)) if(Array.isArray(v)) console.log(k,v.length,JSON.stringify(v[0]).slice(0,4500));
  }
}
function snippet(file, start, end, exports) {
  const source=fs.readFileSync(file,'utf8');
  const context={window:{}}; vm.createContext(context);
  vm.runInContext(source.slice(source.indexOf(start),source.indexOf(end))+`;window.result={${exports}};`,context);
  return context.window.result;
}
const rapid=path.join(out,'glittering-pony-c07f88/assets/rapid.js');
const rescue=path.join(out,'gleeful-paletas-d56a9b/index.html');
const supplements={
  rapid:snippet(rapid,'  const glossary=','  const done=', 'glossary,babySprint,babyWords'),
  rescue:snippet(rescue,'const CH =','const grid =','CH,REPS'),
  highyield:extract(path.join(out,'lustrous-malasada-6d28a9/assets/high-yield.js')).PHYSIO_HIGH_YIELD
};
fs.writeFileSync(path.join(out,'_supplements.json'),JSON.stringify(supplements,null,2));
