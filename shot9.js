// Product-fidelity screens: home, project stages, lists, accounting. Run from the repo root: node shot9.js [prefix]
const {chromium}=require('playwright');
(async()=>{
 const pre=process.argv[2]||'pf';
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.goto('file://'+process.cwd()+'/v6/triplanet-booth.html');await p.waitForTimeout(500);
 await p.evaluate(()=>{resetDemo();render();});
 const sh=async(n,full)=>{await p.waitForTimeout(350);await p.screenshot({path:`shots/${pre}_${n}.png`,fullPage:!!full});};
 const go=async(js)=>{await p.evaluate(js);await p.waitForTimeout(200);};
 await sh('01_home');
 await go(()=>{openTrip('bra','odash');render();});await sh('02_ops_dash');
 await go(()=>{openTrip('gc','income');render();});await sh('03_income',true);
 await go(()=>{openTrip('gc','fdash');render();});await sh('04_fin_dash');
 await go(()=>{openTrip('hl','general');render();});await sh('05_quote_general');
 await go(()=>{S.tab='hotels';render();});await sh('06_hotels');
 await go(()=>{S.tab='activities';render();});await sh('07_activities');
 await go(()=>{S.tab='clients';render();});await sh('08_clients');
 if(await p.evaluate(()=>!!VIEWS.books)){await go(()=>{S.tab='books';render();});await sh('09_books',true);}
 await p.setViewportSize({width:390,height:844});await go(()=>{S.tab='home';render();});await sh('10_mobile_home',true);
 await go(()=>{openTrip('gc','income');render();});await sh('11_mobile_income',true);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
 await p.setViewportSize({width:1440,height:900});await go(()=>{S.lang='he';S.tab='home';render();});await sh('12_he_home');
 await go(()=>{openTrip('bra','odash');render();});await sh('13_he_ops');
 await go(()=>{S.lang='en';render();});
 console.log('errors',errs,'hscroll mobile',ov);
 await b.close();})();
