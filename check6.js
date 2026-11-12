const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('v6/triplanet-booth.html','utf8');
const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const els={};
const mk=id=>els[id]||(els[id]={id,innerHTML:'',value:'',style:{},setAttribute(){},textContent:'',classList:{add(){},remove(){}},addEventListener(){},focus(){}});
const ctx={document:{getElementById:mk,addEventListener(){},querySelector(){return null;},querySelectorAll(){return []}},window:{scrollY:0,scrollTo(){},matchMedia:()=>({matches:false})},navigator:{},Intl,console,setTimeout:()=>0,clearTimeout(){}};
ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(js+`;globalThis.__t={S,TRIPS,calc,groupsCalc,portfolio,gapStats,tripGaps,VIEWS,render,visibleTrips,answerText,QS,PTABS,vTrip,winQuote,NAV,NAV2,blankQuote,openTrip,trHtml,trChunk,HE_RE,applyInbox,byId,TOUR,tourGo,resetDemo,invStatus,planC,effAmt,isOpenGap,buildDraft,askQ,dayHours};`,ctx);
const X=ctx.__t,{S,TRIPS,calc,groupsCalc,portfolio,gapStats,tripGaps,VIEWS,render,QS,PTABS,vTrip,NAV,NAV2,trHtml,HE_RE,trChunk}=X;
let bad=0;const fail=m=>{bad++;console.log('FAIL',m);};
const chk=(h,l)=>{if(/NaN|undefined|Infinity|\[object|null</.test(h))fail(l+' bad token: '+(h.match(/.{40}(NaN|undefined|Infinity|\[object|null<).{20}/)||[''])[0]);};
const ident=(t,tag)=>{const c=calc(t);if(Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit)>0.05)fail('identity '+tag+' '+t.id);
  if(t.stage!=='Quote'&&t.groups.length){const g=groupsCalc(t);if(Math.abs(g.rows.reduce((a,r)=>a+r.amt,0)-c.rev)>0.01)fail('groups '+t.id);if(g.rows.reduce((a,r)=>a+r.size,0)!==t.pax)fail('pax '+t.id);}};
TRIPS.forEach(t=>ident(t,'init'));
const left={};
const scan=(h,where)=>{const txt=trHtml(h).replace(/<[^>]*>/g,'|');(txt.match(/[א-ת][א-ת"'׳״ ,.\-]*/g)||[]).forEach(c=>{c=c.trim();if(c&&c!=='עברית'){left[c]=left[c]||where;}});};
console.log('--- trips');
TRIPS.forEach(t=>{const c=calc(t);console.log(t.id.padEnd(5),t.stage.padEnd(10),String(t.pax).padStart(3),'pp',Math.round(c.rev/t.pax),'rev',Math.round(c.rev),'plan%',(c.planProfit/c.rev*100).toFixed(1),'exp%',(c.fcProfit/c.rev*100).toFixed(1),'gaps',tripGaps(t).length,'inv',t.lines.filter(l=>l.inv).length+'/'+t.lines.length);});
const nen=X.byId('nen');let c0=calc(nen);console.log('NEN before',c0.rev,c0.plan,c0.planProfit,c0.fcProfit);
let G0=gapStats(TRIPS);console.log('G0 open',G0.open,G0.openN,'disp',G0.disp,'rec',G0.rec,G0.recN,'acc',G0.acc,'under',G0.under,'missing',G0.missing,'recv',G0.received,'matched',G0.matched);
for(const lang of ['en','he']){S.lang=lang;
 ['manager',...['Priya','Dana','Marcus','Grace','Luis','Tom']].forEach(role=>{S.role=role;
  [...NAV,...NAV2].forEach(([k])=>{S.tab=k;try{const h=VIEWS[k]();chk(h,lang+role+'/'+k);if(lang==='en')scan(h,k);}catch(e){fail(lang+role+'/'+k+' '+e.stack.split('\n').slice(0,3).join('|'));}});
  ['prices','import'].forEach(sb=>{S.sub=sb;S.ran=true;S.tab='suppliers';const h=VIEWS.suppliers();chk(h,sb);if(lang==='en')scan(h,sb);});S.sub='bank';
  ['open','disputed','credited','accepted','all'].forEach(f=>{S.gF=f;S.tab='gaps';chk(VIEWS.gaps(),'gaps '+f);});S.gF='open';
  X.visibleTrips().forEach(t=>{S.tripId=t.id;S.tab='trip';PTABS.forEach(([k])=>{S.ptab=k;try{const h=vTrip();chk(h,`${lang}${role}/${t.id}/${k}`);if(lang==='en')scan(h,t.id+'/'+k);}catch(e){fail(`${lang}${role}/${t.id}/${k} ${e.stack.split('\n').slice(0,3).join('|')}`);}});
   S.openT['s|Lodging']=true;S.openT['p|Activities']=true;S.ptab='costs';chk(vTrip(),'detail');S.openDay=0;S.ptab='plan';chk(vTrip(),'plan0');S.openDay=1;});
  S.menu=true;S.chen=true;S.tab='home';try{render();chk(els.app.innerHTML,'render '+role);if(lang==='en')scan(els.app.innerHTML,'shell');}catch(e){fail('render '+e.stack.split('\n').slice(0,3).join('|'));}S.menu=false;S.chen=false;
 });
 S.role='manager';
 // assistant: chips + routing
 QS.forEach(q=>{try{const a=q.f();chk(a.t,'Q'+q.id);if(lang==='en')scan(a.t,'Q'+q.id);const b=X.answerText(lang==='en'?q.en:q.he);if(b.t.split('\n')[0]!==a.t.split('\n')[0])fail(`route ${lang} Q${q.id}: ${b.t.slice(0,60)}`);}catch(e){fail('Q'+q.id+' '+e.message);}});
}
S.lang='en';
QS.forEach(q=>console.log('Q'+q.id,'|',q.f().t.replace(/\n/g,' / ').slice(0,230)));
console.log('--- read inbox');
X.applyInbox(nen);ident(nen,'after inbox');let c1=calc(nen);const gp=tripGaps(nen);console.log('NEN after',c1.fcProfit,(c1.fcProfit/c1.rev*100).toFixed(2),'gaps',gp.map(x=>x.l.sup+':'+x.s.kind+':'+x.usd).join(', '),'sum',gp.reduce((a,x)=>a+x.usd,0));
// dispute and credit flows
gp.forEach((x,i)=>{if(i%2===0){x.l.inv.st='disputed';}else{const amt=X.effAmt(x.l.inv)-X.planC(x.l);x.l.inv.credit=(x.l.inv.credit||0)+amt;x.l.inv.st='credited';}});ident(nen,'credits');console.log('NEN credited',calc(nen).fcProfit);
S.tripId='nen';S.tab='trip';S.ptab='tfin';S.disp='nen|1';chk(vTrip(),'disp');scan(vTrip(),'disp');
// tour
X.resetDemo();X.TOUR.forEach((st,i)=>{try{X.tourGo(i);const [a,b]=st.tx();chk(a+b,'tour'+i);scan(a+' '+b,'tour'+i);chk(els.app.innerHTML,'tourrender'+i);}catch(e){fail('tour'+i+' '+e.stack.split('\n').slice(0,3).join('|'));}});
console.log('tour step8',X.TOUR[7].tx()[1]);console.log('day3 hrs',X.dayHours(X.byId('hl'),3));
// win + new quote + drafts
X.resetDemo();const hl=X.byId('hl');X.winQuote(hl);ident(hl,'win');S.tripId='hl';['ops','people','tfin'].forEach(k=>{S.ptab=k;S.tab='trip';chk(vTrip(),'hl '+k);});
const nq=X.blankQuote({name:'x',dest:'Rome',seg:'Faith',pax:30,nights:8,agent:'Priya'});S.tripId=nq.id;PTABS.forEach(([k])=>{S.ptab=k;chk(vTrip(),'new '+k);});
['Draft a Holy Land pilgrimage for 40 church members, 9 nights','Draft a Branson trip for a 45-person senior club, 3 nights','הכן טיוטה לנאשוויל ל-50 תלמידים 3 לילות','draft 30 alumni grand canyon 5 nights'].forEach(q=>{const b=X.buildDraft(q);console.log('DRAFT',q,'=>',b.dest,b.seg,b.pax,b.nights,Math.round(b.c.rev/b.pax),(b.c.planProfit/b.c.rev*100).toFixed(1));});
const L=Object.entries(left);console.log('LEFTOVER',L.length);L.slice(0,40).forEach(x=>console.log('  ',x[1],'|',x[0],'=>',trChunk(x[0])));
const P=portfolio(TRIPS);console.log('P rev',P.rev,'pp',P.pp,'fp',P.fp,'fx',Object.keys(P.fxExp));
console.log('bad',bad);
