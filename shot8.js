// v7 screens: profit leaks, trip studio, meeting mode. Run from the repo root: node shot8.js [prefix]
const {chromium}=require('playwright');
(async()=>{
 const pre=process.argv[2]||'v7';
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.goto('file://'+process.cwd()+'/v6/triplanet-booth.html');await p.waitForTimeout(500);
 await p.evaluate(()=>{resetDemo();render();});
 const sh=async(n,full)=>{await p.waitForTimeout(300);await p.screenshot({path:`shots/${pre}_${n}.png`,fullPage:!!full});};
 await p.click('[data-act=go][data-v=leaks]');await p.waitForTimeout(1200);await sh('01_leaks',true);
 await p.click('[data-act=lkdim][data-v=agent]');await sh('02_leaks_agent');
 await p.click('[data-act=go][data-v=studio]');await sh('03_studio_empty');
 await p.click('[data-act=ggo]');await p.waitForTimeout(1300);await sh('04_studio_busy');
 await p.waitForTimeout(2600);await sh('05_studio_nashville',true);
 await p.click('[data-act=gset][data-k=dest][data-v=HolyLand]');await p.waitForTimeout(400);await sh('06_studio_holyland',true);
 await p.click('[data-act=gset][data-k=dest][data-v=Rome]');await p.click('[data-act=gset][data-k=tier][data-v="4"]');await p.waitForTimeout(400);await sh('07_studio_rome');
 await p.click('[data-act=gcreate]');await p.waitForTimeout(400);await sh('08_created_quote');
 await p.click('[data-act=lang]');await p.click('[data-act=go][data-v=studio]');await p.waitForTimeout(400);await sh('09_he_studio',true);
 await p.click('[data-act=go][data-v=leaks]');await p.waitForTimeout(1200);await sh('10_he_leaks');
 await p.click('[data-act=lang]');
 await p.setViewportSize({width:390,height:844});await p.click('[data-act=go][data-v=studio]');await sh('11_mobile_studio',true);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
 await p.setViewportSize({width:1440,height:900});
 if(await p.$('[data-act=meet]')){await p.click('[data-act=meet]');for(let i=0;i<9;i++){await p.waitForTimeout(i===2?4200:900);await sh('2'+i+'_meet');const nx=await p.$('[data-act=meetnext]');if(!nx)break;await nx.click();}}
 console.log('errors',errs,'hscroll mobile',ov);
 await b.close();})();
