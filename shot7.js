const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const ctx=await b.newContext({viewport:{width:1440,height:900}});const p=await ctx.newPage();
 const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const url='file://'+process.cwd()+'/v6/triplanet-booth.html';
 await p.goto(url);await p.waitForTimeout(500);
 await p.click('[data-act=tourgo]');for(let i=0;i<4;i++){await p.click('[data-act=tournext]');await p.waitForTimeout(500);}
 await p.screenshot({path:'shots/30_doc.png'});
 for(let i=0;i<3;i++){await p.click('[data-act=tournext]');await p.waitForTimeout(500);} // step 8 auto-reads
 await p.screenshot({path:'shots/31_step8.png'});
 await p.click('[data-act=tournext]');await p.waitForTimeout(500);await p.click('[data-act=tournext]');await p.waitForTimeout(500);
 await p.screenshot({path:'shots/32_step10.png'});
 await p.click('[data-act=tourend]');
 await p.reload();await p.waitForTimeout(500);
 const st=await p.evaluate(()=>({tab:S.tab,inbox:byId('nen').inbox.length,gaps:tripGaps(byId('nen')).length,chat:S.chat.length}));
 console.log('after reload',st);
 await p.click('[data-act=menu]');await p.click('[data-act=reset]');await p.waitForTimeout(300);
 const st2=await p.evaluate(()=>({tab:S.tab,inbox:byId('nen').inbox.length,gaps:tripGaps(byId('nen')).length,chat:S.chat.length,hl:byId('hl').stage}));
 console.log('after reset',st2);
 // print
 await p.setViewportSize({width:1024,height:768});await p.click('[data-act=go][data-v=quotes]');await p.screenshot({path:'shots/33_tablet_quotes.png'});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:'shots/34_mobile_quotes.png'});
 await p.click('.chenfab');await p.waitForTimeout(200);await p.screenshot({path:'shots/35_mobile_maya.png'});
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
 console.log('errors',errs,'hscroll',ov);
 await b.close();})();
