// Commons metadata and bitmap downloads, bounded to 1600px; keeps raw metadata.
const fs=require('fs');
(async()=>{
 const files=process.argv.slice(2);
 const u=new URL('https://commons.wikimedia.org/w/api.php');
 u.search=new URLSearchParams({action:'query',format:'json',titles:files.map(f=>'File:'+f).join('|'),prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'1600'});
 const data=await(await fetch(u)).json();fs.writeFileSync('tmp/artery2-commons-'+Date.now()+'.json',JSON.stringify(data,null,2));
 for(const p of Object.values(data.query.pages)){
  const i=p.imageinfo?.[0];if(!i){console.log('MISSING',p.title);continue;}
  console.log(p.title, i.extmetadata?.LicenseShortName?.value, i.extmetadata?.ImageDescription?.value?.replace(/<[^>]*>/g,'').slice(0,150));
  const url=(i.width<=1600?i.url:i.thumburl)||i.thumburl;
  if(!url)continue;
  const r=await fetch(url.split('?')[0]);if(!r.ok||!/^image\//.test(r.headers.get('content-type')||'')){console.log('FAILED',r.status);continue;}
  fs.writeFileSync('tmp/artery2-'+p.title.slice(5),Buffer.from(await r.arrayBuffer()));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
