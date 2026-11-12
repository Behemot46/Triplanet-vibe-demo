const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('v6/triplanet-booth.html','utf8');
const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const els={};
const mk=id=>els[id]||(els[id]={id,innerHTML:'',value:'',style:{},setAttribute(){},textContent:'',classList:{add(){},remove(){}},addEventListener(){},focus(){}});
const ctx={document:{getElementById:mk,addEventListener(){},querySelector(){return null;},querySelectorAll(){return []}},window:{scrollY:0,scrollTo(){},matchMedia:()=>({matches:false})},navigator:{},Intl,console,setTimeout:()=>0,clearTimeout(){}};
ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(js+`;globalThis.__t={MEET,closingHtml,meetBar,S,TRIPS,calc,groupsCalc,portfolio,gapStats,tripGaps,VIEWS,render,visibleTrips,answerText,QS,PTABS,vTrip,winQuote,NAV,NAV2,blankQuote,openTrip,trHtml,trChunk,HE_RE,applyInbox,byId,TOUR,tourGo,resetDemo,invStatus,planC,effAmt,isOpenGap,buildDraft,askQ,dayHours,acLog,ACCT,A,gapLineOf,leakModel,leakRows,genPlan,genCreate,G0,CATALOG,DESTS,DEST_CITIES,GEO,geoViewFor,LK_DIMS};`,ctx);
const X=ctx.__t,{S,TRIPS,calc,groupsCalc,portfolio,gapStats,tripGaps,VIEWS,render,QS,PTABS,vTrip,NAV,NAV2,trHtml,HE_RE,trChunk}=X;
let bad=0;const fail=m=>{bad++;console.log('FAIL',m);};
const chk=(h0,l)=>{const h=String(h0).replace(/data:[a-z/+]+;base64,[A-Za-z0-9+\/=]+/g,'');if(/NaN|undefined|Infinity|\[object|null</.test(h))fail(l+' bad token: '+(h.match(/.{40}(NaN|undefined|Infinity|\[object|null<).{20}/)||[''])[0]);};
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
// ---- v7: leak model identities, studio for every destination, real brands never in a gap
const brandNames=new Set([...X.CATALOG.hotels.map(h=>h.name),...X.CATALOG.venues.map(v=>v.name)]);
const brandGuard=tag=>{const bad2=X.gapStats(TRIPS).list.filter(g=>brandNames.has(g.l.sup));if(bad2.length)fail(tag+' real brand in a gap: '+bad2.map(g=>g.l.sup).join(', '));};
const leakIdent=(tag,ts)=>{const M=X.leakModel(ts);const st=Object.values(M.steps).reduce((a,x)=>a+x.amt,0);
  if(Math.abs(st+M.fx-(M.pp-M.fp))>0.05*Math.max(1,M.n))fail(`${tag} bridge ${st+M.fx} vs ${M.pp-M.fp}`);
  X.LK_DIMS.forEach(([d])=>{const rs=X.leakRows(M,d),sum=rs.reduce((a,r)=>a+r.leak,0),want=d==='sup'?M.amtDiff:M.leak;
    if(d!=='sup'&&Math.abs(sum-want)>0.05*Math.max(1,M.n))fail(`${tag} dim ${d} ${sum} vs ${want}`);});return M;};
X.resetDemo();brandGuard('reset');
const Ml=leakIdent('season',TRIPS);console.log('LEAK season pp',Ml.pp,'fp',Ml.fp,'leak',Ml.leak,'rec',Ml.rec,'lost',Ml.lost,'got',Ml.got,'release',Ml.release,'fx',Ml.fx);
['Priya','Dana','Marcus','Grace','Luis','Tom'].forEach(a=>leakIdent('agent '+a,TRIPS.filter(t=>t.agent===a)));
for(const lang of ['en','he']){S.lang=lang;S.role='manager';
  X.LK_DIMS.forEach(([d])=>[false,true].forEach(all=>{S.tab='leaks';S.lkDim=d;S.lkAll=all;S.lkSel='';const h=VIEWS.leaks();chk(h,'leaks '+d);if(lang==='en')scan(h,'leaks '+d);}));
  S.lkSel='agent|Dana';chk(VIEWS.leaks(),'leaks sel');S.lkSel='';
  S.tab='hotels';S.hFam='Hilton';chk(VIEWS.hotels(),'hotels');if(lang==='en')scan(VIEWS.hotels(),'hotels');S.hFam='All';
  S.tab='studio';S.gen=null;chk(VIEWS.studio(),'studio empty');if(lang==='en')scan(VIEWS.studio(),'studio empty');
  Object.keys(X.DESTS).forEach((k,i)=>{S.gen={...X.G0(),dest:k,tier:[3,4,5][i%3],pace:['relaxed','classic','full'][i%3],pax:12+i*3,nights:2+i%10,built:true};
    try{const h=VIEWS.studio();chk(h,'studio '+k);if(lang==='en')scan(h,'studio '+k);
      const P=X.genPlan(S.gen),c=calc(P.t);if(Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit)>0.05)fail('gen identity '+k);
      if(P.days.length!==S.gen.nights+1)fail('gen days '+k);if(!(P.margin>.05&&P.margin<.45))fail(`gen margin ${k} ${P.margin}`);
      if(!P.route.length||!P.route.every(c2=>X.GEO.cities[c2]))fail('gen route '+k);if(!P.hotel)fail('gen hotel '+k);
      const nb=P.bases.reduce((q,b)=>q+b.nights,0),lq=P.lines.filter(l=>l.type==='Lodging'&&l.cost>0).reduce((q,l)=>q+l.qty,0);if(nb!==S.gen.nights)fail(`gen nights ${k} ${nb}`);if(lq!==P.rooms*S.gen.nights)fail(`gen lodging ${k} ${lq}`);
      P.days.forEach(dy=>{const act=dy.items.filter(x=>x.k!=='travel'&&x.k!=='meal').reduce((q,x)=>q+x.h,0);if(act>9.6)fail(`gen day ${k} D${dy.i} ${act}h`);});
      if(lang==='en'&&i<16)console.log('GEN',k.padEnd(10),String(S.gen.pax).padStart(2),'pax',String(S.gen.nights).padStart(2),'n',S.gen.tier+'*',(P.hotel||{}).name,'| pp',Math.round(P.pp),'margin',(P.margin*100).toFixed(1),'| map',X.geoViewFor(P.route),P.route.join('>'));
    }catch(e){fail('studio '+k+' '+e.stack.split('\n').slice(0,3).join('|'));}});
}
S.lang='en';S.gen={...X.G0(),built:true};const q=X.genCreate();ident(q,'gen quote');PTABS.forEach(([k])=>{S.ptab=k;S.tripId=q.id;S.tab='trip';chk(vTrip(),'genq '+k);});
X.applyInbox(X.byId('nen'));brandGuard('after inbox');leakIdent('after inbox',TRIPS);
console.log('CATALOG hotels',X.CATALOG.hotels.length,'venues',X.CATALOG.venues.length,'dests',Object.keys(X.DESTS).length,'branded trips',TRIPS.filter(t=>t.room&&brandNames.has(t.room.hotel)).map(t=>t.id+':'+t.room.hotel).join(', '));
// ---- phase 2: every accounting system, both languages, posting log
for(const lang of ['en','he']){S.lang=lang;Object.keys(X.ACCT).forEach(k=>{S.acct=null;const a=X.A();a.sys=k;a.phase='synced';
  const g=X.gapStats(TRIPS).list.find(x=>X.isOpenGap(x.s)&&x.usd>0);if(g){X.acLog('post',g.t,g.l,100);X.acLog('credit',g.t,g.l,50);X.acLog('hold',g.t,g.l,100);}
  S.tab='books';const h=VIEWS.books();chk(h,'books '+k);if(lang==='en')scan(h,'books '+k);if(a.log.length<3)fail('books log '+k);
  S.tab='trip';S.tripId='gc';S.ptab='fdash';chk(vTrip(),'chip '+k);if(lang==='en')scan(vTrip(),'chip '+k);});S.acct=null;}
// ---- meeting mode: every beat and the closing screen, both languages
for(const lang of ['en','he']){S.lang=lang;X.resetDemo();X.MEET.forEach((b,i)=>{try{S.meet=i;b.go();const h=(b.close?X.closingHtml():'')+X.meetBar();chk(h,'meet '+i);if(lang==='en')scan(trHtml(h),'meet '+i);
  if(b.close&&/<b>\$0<\/b>/.test(h))fail('meet closing shows $0');}catch(e){fail('meet '+lang+' '+i+' '+e.message);}});S.meet=-1;}
X.resetDemo();
S.lang='en';
const L=Object.entries(left);console.log('LEFTOVER',L.length);L.slice(0,40).forEach(x=>console.log('  ',x[1],'|',x[0],'=>',trChunk(x[0])));
const P=portfolio(TRIPS);console.log('P rev',P.rev,'pp',P.pp,'fp',P.fp,'fx',Object.keys(P.fxExp));
console.log('bad',bad);
