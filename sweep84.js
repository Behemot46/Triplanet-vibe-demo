// v8.4 browser sweep: every agency page and trip tab for each role, and every portal tab for two people,
// in EN and HE, day and night, at 1440 and 390 px. Reports page errors and horizontal overflow at 390 px.
// Run from the repo root: node sweep84.js [quick]
const {chromium}=require('playwright');
(async()=>{
 const quick=process.argv[2]==='quick';
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errs=[];let where='';p.on('pageerror',e=>errs.push(where+' :: '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push(where+' :: '+m.text());});
 await p.goto('file://'+process.cwd()+'/v6/triplanet-booth.html');await p.waitForTimeout(400);
 await p.evaluate(()=>{resetDemo();render();});
 const over=[];let n=0;
 const visit=async(tag,js,arg)=>{where=tag;await p.evaluate(js,arg);n++;
   if(await p.evaluate(()=>window.innerWidth<500&&document.documentElement.scrollWidth>window.innerWidth+1))over.push(tag);};
 const roles=await p.evaluate(()=>ROLE_KEYS.slice());
 const pages=await p.evaluate(()=>[...NAV,...NAV2].map(x=>x[0]));
 const tabs=await p.evaluate(()=>PTABS.map(x=>x[0]));
 for(const [w,h] of [[1440,900],[390,844]]){await p.setViewportSize({width:w,height:h});
  for(const theme of quick?['light']:['light','dark'])for(const lang of ['en','he']){
   await p.evaluate(([th,l])=>{try{localStorage.setItem('triplanet-theme',th);}catch(e){}themeApply(th);S.lang=l;S.pv=null;},[theme,lang]);
   for(const r of roles){
    for(const pg of pages)await visit(`${w} ${theme} ${lang} ${r} ${pg}`,([r,pg])=>{S.pv=null;S.role=r;S.tab=pg;render();},[r,pg]);
    if(!quick||r==='manager'||r==='ops')for(const tid of ['nas','gc','hl'])for(const tb of tabs)
      await visit(`${w} ${theme} ${lang} ${r} trip ${tid} ${tb}`,([r,tid,tb])=>{S.pv=null;S.role=r;if(!visibleTrips().some(t=>t.id===tid))return;openTrip(tid,tb);render();},[r,tid,tb]);
   }
   const ports=await p.evaluate(()=>Object.keys(PORTALS).map(k=>({k,ids:(()=>{const ps=PORTALS[k].people();return [PORTALS[k].def,ps[ps.length-1]&&ps[ps.length-1].id];})(),tabs:PORTALS[k].tabs.map(x=>x[0])})));
   for(const P of ports)for(const id of P.ids)for(const tb of P.tabs)
     await visit(`${w} ${theme} ${lang} portal ${P.k} ${id} ${tb}`,([k,id,tb])=>{pvOpen(k,id,tb);render();},[P.k,id,tb]);
  }}
 await p.evaluate(()=>{S.pv=null;S.lang='en';try{localStorage.setItem('triplanet-theme','light');}catch(e){}themeApply('light');resetDemo();render();});
 console.log('views',n,'page errors',errs.length);errs.slice(0,30).forEach(e=>console.log('  ERR',e));
 console.log('overflow at 390',over.length);over.slice(0,40).forEach(e=>console.log('  OVF',e));
 await b.close();})();
