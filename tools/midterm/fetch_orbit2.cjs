// Download verified Commons originals/thumbnails; never save an HTTP error as an image.
const fs = require('fs');
const files = process.argv.slice(2).length ? process.argv.slice(2) : [
  "Dixon's Manual of human osteology (1912) - Fig 107.png",
  "Gerrish's Text-book of Anatomy (1902) - Fig. 233.png",
  'Sobo 1909 103.png', 'Gray165.png',
];
(async () => {
  const u = new URL('https://commons.wikimedia.org/w/api.php');
  u.search = new URLSearchParams({action:'query',format:'json',titles:files.map(f=>'File:'+f).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'1600'});
  const data = await (await fetch(u)).json();
  fs.writeFileSync('tmp/orbit2-candidates-'+Date.now()+'.json',JSON.stringify(data,null,2));
  for (const p of Object.values(data.query.pages)) {
    const i = p.imageinfo?.[0]; if (!i) {console.log('MISSING',p.title);continue;}
    const name = p.title.slice(5), dest = 'tmp/orbit2-'+name;
    const urls = [i.thumburl, i.url].filter(Boolean).map(u=>u.split('?')[0]);
    let done=false;
    for (const url of urls) {
      const r = await fetch(url);
      if (r.ok && /^image\//.test(r.headers.get('content-type')||'')) {
        fs.writeFileSync(dest,Buffer.from(await r.arrayBuffer()));done=true;break;
      }
      console.log('retry',name,r.status);
    }
    console.log(done?'OK':'FAILED',name,i.extmetadata?.ImageDescription?.value?.replace(/<[^>]*>/g,'').slice(0,90));
  }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
