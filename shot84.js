// v8.4 screenshots: the ops home and every portal tab at 1440 and 390 px (EN), homes in HE and night.
// Run from the repo root: node shot84.js [prefix]  -> shots/<prefix>_*.png
const {chromium}=require('playwright');
(async()=>{
 const pre=process.argv[2]||'v84';
 const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/v6/triplanet-booth.html');await p.waitForTimeout(400);
 const set=async(lang,theme)=>p.evaluate(([l,th])=>{resetDemo();S.lang=l;try{localStorage.setItem('triplanet-theme',th);}catch(e){}themeApply(th);},[lang,theme]);
 const sh=async(n)=>{await p.waitForTimeout(450);await p.screenshot({path:`shots/${pre}_${n}.png`,fullPage:true});};
 const ports=await p.evaluate(()=>Object.keys(PORTALS).map(k=>({k,tabs:PORTALS[k].tabs.map(x=>x[0])})));
 let i=0;const nm=s=>String(++i).padStart(2,'0')+'_'+s;
 for(const [w,h] of [[1440,900],[390,844]]){await p.setViewportSize({width:w,height:h});await set('en','light');
   await p.evaluate(()=>{S.pv=null;S.role='ops';S.tab='home';render();});await sh(nm(`ops_home_${w}`));
   for(const P of ports)for(const tb of P.tabs){await p.evaluate(([k,tb])=>{pvOpen(k,null,tb);render();},[P.k,tb]);await sh(nm(`${P.k}_${tb}_${w}`));}}
 await p.setViewportSize({width:390,height:844});
 for(const [lang,theme] of [['he','light'],['en','dark']]){await set(lang,theme);
   await p.evaluate(()=>{S.pv=null;S.role='ops';S.tab='home';render();});await sh(nm(`ops_home_${lang}_${theme}`));
   for(const P of ports){await p.evaluate(k=>{pvOpen(k);render();},P.k);await sh(nm(`${P.k}_home_${lang}_${theme}`));}}
 await set('en','light');await p.setViewportSize({width:1440,height:900});
 await p.evaluate(()=>{S.role='manager';openTrip('nas','manifest');render();});await sh(nm('link_manifest'));
 await p.evaluate(()=>{S.tab='home';render();});
 console.log('shots',i,'errors',errs);await b.close();})();
