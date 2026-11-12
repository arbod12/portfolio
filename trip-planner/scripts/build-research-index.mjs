/** Optional metadata-only Wikivoyage indexer: no commercial scraping.
 * Usage: node scripts/build-research-index.mjs --max=2500
 * Deliberate pacing, provenance, rights, and bounded paging.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
const max=Math.min(10000,Math.max(50,Number(process.argv.find(a=>a.startsWith('--max='))?.split('=')[1]||2000)));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const records=[];let apcontinue=null;
while(records.length<max){
  const params=new URLSearchParams({action:'query',format:'json',list:'allpages',aplimit:'max',apnamespace:'0'});
  if(apcontinue)params.set('apcontinue',apcontinue);
  let response;try{response=await fetch('https://en.wikivoyage.org/w/api.php?'+params,{headers:{'user-agent':'ArielBodikAtlas/1.0 (metadata-only source catalog)'}});}catch(e){console.error('Connection error; preserving completed records:',e.message);break;}
  if(!response.ok){console.error('HTTP',response.status,'while indexing; stopping');break;}
  const data=await response.json();const rows=data.query?.allpages||[];
  for(const p of rows){if(records.length>=max)break;records.push({id:'wikivoyage-en:'+p.pageid,title:p.title,url:'https://en.wikivoyage.org/wiki/'+encodeURIComponent(p.title.replaceAll(' ','_')),publisher:'Wikivoyage contributors',license:'CC BY-SA 4.0',type:'travel-guide-page',indexedAt:new Date().toISOString()});}
  apcontinue=data.continue?.apcontinue||null;console.log('Indexed',records.length,'guide pages');if(!apcontinue||!rows.length)break;await sleep(1150);
}
const out=path.resolve('data/wikivoyage-index.json');await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify({metadata:{publisher:'Wikivoyage',source:'https://en.wikivoyage.org/',license:'CC BY-SA 4.0',date:new Date().toISOString(),count:records.length,definition:'Articles from one publisher; not independently vetted sources'},records},null,2));console.log('Saved',out);
