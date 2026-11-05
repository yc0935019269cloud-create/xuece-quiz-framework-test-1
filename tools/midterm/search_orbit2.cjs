// Commons source/metadata discovery for this targeted anatomy audit.
const fs = require('fs');
(async () => {
  for (const [n, q] of process.argv.slice(2).entries()) {
    const u = new URL('https://commons.wikimedia.org/w/api.php');
    u.search = new URLSearchParams({ action:'query', format:'json', generator:'search', gsrnamespace:'6', gsrsearch:(q.startsWith('exact:') ? '"'+q.slice(6)+'"' : q)+' filetype:bitmap', gsrlimit:'12', prop:'imageinfo', iiprop:'url|extmetadata', iiurlwidth:'1600' });
    const a = await (await fetch(u)).json();
    fs.writeFileSync(`tmp/orbit2-search-${n}.json`, JSON.stringify(a,null,2));
    console.log(q, Object.values(a.query?.pages||{}).map(p=>({title:p.title, desc:p.imageinfo?.[0]?.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g,'').slice(0,170)})));
  }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
