/* v8 module "pr": proposal formats (PDF design / Agents table / Landing page) and pricing extras (overhead, brokerage).
   Wraps pQuote and pCosts. Every mutation is a named function (prSetFmt, prCopyLink, prPdf, prAccept, prSetFee) so tests can call it. */
Object.assign(S,{prFmt:'pdf'});
const PR_TIERS=[10,15,20,25,30,40];
const PR_FMTS=[['pdf',['עיצוב PDF','PDF design'],'document'],['table',['טבלת מחירים לסוכנים','Agents table'],'checklist'],['landing',['דף נחיתה','Landing page'],'cloud']];
const prFmt=()=>PR_FMTS.some(f=>f[0]===S.prFmt)?S.prFmt:'pdf';
const prLink=t=>'https://go.redbudtours.example/p/'+t.no;
const prCan=()=>typeof can!=='function'||can('price.edit');
const prFoc=n=>Math.floor(n/20);

/* ---------- pure pricing ---------- */
/* Client revenue if the same trip ran with n travelers. The trip is deep-copied (the real one is never touched); genLines
   gives the quantity rules at n and at the real group size, and each real line is scaled by that ratio, so edits to
   a quantity survive. Costs, markups, overrides, discounts, overhead and brokerage come from the real trip. */
function prTierCalc(t,n){
  let f0=[],f1=[];
  try{f0=genLines(t.seg,t.dest,t.pax,t.nights);f1=genLines(t.seg,t.dest,n,t.nights);}catch(e){f0=[];f1=[];}
  const key=l=>l.type+'|'+l.name,m0={},m1={};f0.forEach(l=>{m0[key(l)]=l;});f1.forEach(l=>{m1[key(l)]=l;});
  const cl=JSON.parse(JSON.stringify(t));cl.pax=n;
  cl.lines=cl.lines.filter(l=>!l.extra).map(l=>{
    l.inv=null;const a=m0[key(l)],b=m1[key(l)];
    if(a&&b){
      if(a.qty>0)l.qty=Math.max(0,Math.round(l.qty*b.qty/a.qty));
      if(a.cost>0&&b.cost!==a.cost)l.cost=Math.round(l.cost*b.cost/a.cost);
    }else if(l.scope==='per person')l.qty=Math.max(0,Math.round(l.qty*n/Math.max(1,t.pax)));
    else if(l.unit==='room-night')l.qty=Math.max(0,Math.ceil(l.qty*n/Math.max(1,t.pax)));
    return l;});
  return calc(cl);
}
function prTierPrice(t,n){return r2(prTierCalc(t,n).rev/n);}
/* single supplement: half of the lodging price per room-night, times nights; only for Twin-occupancy segments */
function prSingleSupp(t){
  if(!['Faith','Senior','Alumni'].includes(t.seg))return null;
  const x=calc(t).lines.find(y=>!y.l.extra&&y.l.type==='Lodging'&&y.l.cost>0&&y.l.qty>0);
  return x?r2(x.price/x.l.qty*t.nights*.5):null;
}
function prRows(t){
  const ss=prSingleSupp(t),rows=PR_TIERS.map(n=>{const c=prTierCalc(t,n);return {n,foc:prFoc(n),pp:r2(c.rev/n),tot:c.rev,ss,you:false};});
  const c=calc(t);rows.push({n:t.pax,foc:prFoc(t.pax),pp:r2(c.rev/t.pax),tot:c.rev,ss,you:true});
  return rows;
}

/* ---------- mutations ---------- */
function prSetFmt(f){S.prFmt=PR_FMTS.some(x=>x[0]===f)?f:'pdf';}
function prCopyLink(t){try{copy(prLink(t));}catch(e){}}
function prPdf(){S.prFmt='pdf';try{render();}catch(e){}try{window.print();}catch(e){}try{toast(L('אם חלון ההדפסה לא נפתח כאן, הדפיסו מהקובץ המקומי.','If no print dialog opened here, print from the offline file.'));}catch(e){}}
/* simulated client acceptance: only Draft or Sent move to Negotiating; Approval is never skipped for a quote still waiting for the manager */
function prAccept(t){
  if(!t||t.stage!=='Quote')return false;
  const q=t.qst||'Draft';
  if(q==='Draft'||q==='Sent'){t.qst='Negotiating';t.qdays=0;try{toast(L('ההפקדה נרשמה (הדגמה). ההצעה עברה למשא ומתן.','Deposit recorded (demo). The quote moved to Negotiating.'));}catch(e){}return true;}
  return false;
}
function prSetFee(t,kind,o){
  if(!t||(kind!=='ovh'&&kind!=='brk')||!prCan())return false;
  const cur=t[kind]||{m:'%',v:0,on:'both'},n=Object.assign({},cur,o||{});
  n.m=n.m==='$'?'$':'%';n.on=['shared','pp','both'].includes(n.on)?n.on:'both';
  n.v=Math.max(0,Math.min(n.m==='%'?100:1000000,+n.v||0));
  t[kind]=n;return true;
}

/* ---------- UI pieces ---------- */
function prMaster(t){
  return `<div class="master"><strong>${masterTitle()}</strong><div class="row"><button class="btn sm" data-act="pr-copy">${ic('link')} ${L('העתקת קישור ציבורי','Copy public link')}</button><button class="btn sm" data-act="pr-pdf">${ic('printer')} ${L('הורדת PDF','Download PDF')}</button></div></div>`;
}
function prBar(t){
  const f=prFmt();
  return `<div class="card pr-bar"><div class="pr-seg" role="group" aria-label="${L('פורמט הצעה','Proposal format')}">${PR_FMTS.map(x=>`<button class="${f===x[0]?'on':''}" aria-pressed="${f===x[0]}" data-act="pr-fmt" data-v="${x[0]}">${ic(x[2])} ${L(x[1][0],x[1][1])}</button>`).join('')}</div>
  <div class="pr-link"><span class="small muted">${L('קישור ציבורי','Public link')}</span><code dir="ltr">${esc(prLink(t))}</code></div></div>`;
}
function prTable(t){
  const rows=prRows(t),ss=rows[0].ss,seg=['Faith','Senior','Alumni'].includes(t.seg);
  const body=rows.map(r=>`<tr class="${r.you?'pr-you':''}"><td>${r.you?`<strong>${L('ההצעה שלכם','Your quote')}</strong> <span class="small muted">(${paxL(r.n)})</span>`:`<strong><bdi>${r.n}+</bdi></strong> ${L('נוסעים','travelers')}`}</td><td class="n">${r.foc||'-'}</td><td class="n"><strong>${usd(r.pp,2)}</strong></td><td class="n">${r.ss==null?'<span class="muted">n/a</span>':usd(r.ss,2)}</td><td class="n">${usd(r.tot)}</td></tr>`).join('');
  return `<div class="card pr-agt"><h3>${L('טבלת מחירים לסוכנים: מחיר משוער לנוסע לפי גודל קבוצה','Agents table: indicative price per traveler by group size')}</h3>
  <div class="scroll"><table class="tbl"><thead><tr><th>${L('גודל קבוצה','Group size')}</th><th class="n">${L('מקומות חינם (FOC)','FOC places')}</th><th class="n">${L('מחיר לנוסע','Price per traveler')}</th><th class="n">${L('תוספת חדר יחיד','Single supplement')}</th><th class="n">${L('סך הקבוצה','Group total')}</th></tr></thead><tbody>${body}</tbody></table></div>
  <p class="small muted" style="margin-top:10px">${L('כל שורה מחושבת מחדש: עותק של הטיול עם מספר הנוסעים בשורה, כמויות מחדש לפי אותם כללים של מחולל השורות (חדרים לפי תפוסה, שירותים לנוסע, מקומות חינם לכל 20), ואז מחיר הלקוח חלקי מספר הנוסעים.','Each row re-prices a copy of this trip at that group size: quantities are regenerated with the same rules as the line generator (rooms by occupancy, per-person services, one comp per 20), then client price divided by travelers.')}</p>
  <p class="small muted">${L('הקירוב: עלויות יחידה, מרקאפים, חריגים, הנחות, תקורה ועמלת תיווך נלקחים מהטיול כפי שהוא. הנחות ותקורה בסכום קבוע נשארות קבועות. שורת "ההצעה שלכם" היא המחיר האמיתי של ההצעה.','Approximation: unit costs, markups, overrides, discounts, overhead and brokerage come from this trip as it stands; fixed-dollar discounts and fees stay fixed. The "Your quote" row is the real proposal price.')}</p>
  <p class="small muted">${L('מקומות החינם הם מידע בלבד: המחיר כבר כולל את עלות הנהג והמדריך. ','The FOC column is informational: the price already carries the cost of the comps. ')}${seg?L('תוספת חדר יחיד היא חצי ממחיר הלינה ללילה כפול מספר הלילות.','Single supplement is half the lodging price per room-night times the nights.'):L('תוספת חדר יחיד אינה רלוונטית לסוג הקבוצה הזה.','Single supplement does not apply to this group type.')}</p></div>`;
}
function prLanding(t){
  const c=calc(t),days=[...Array(t.nights+1).keys()].map(k=>k+1),dep=r2(c.rev*t.pct/100),q=t.stage==='Quote'?(t.qst||'Draft'):'Accepted';
  const hero=phSrc('dest',t.dest),hues=['var(--primary-dark)','var(--primary)','var(--hero2)','var(--primary-darker)','var(--primary-light)'];
  const dc=days.map(d=>{const its=t.items.filter(i=>i.day===d),ph=phFor((its.find(i=>phVenueBy(i.name))||its[0]||{}).name,t.dest);
    return `<div class="pr-day"><div class="pr-dimg" style="${phBg(ph,`background:linear-gradient(135deg,${hues[d%5]},var(--primary-lighter))`)}"></div><div><b>${L('יום','Day')} ${d}</b> <span class="small muted">${fmtDate(addDays(t.dep,d-1))}</span><ul>${its.map(i=>`<li>${esc(i.name)}</li>`).join('')||`<li>${L('יום חופשי','Free day')}</li>`}</ul></div></div>`;}).join('');
  const inc={Lodging:L('לינה במלונות','Hotel accommodation'),Transport:DESTS[t.dest].air?L('טיסות קבוצתיות והסעות','Group air and ground transportation'):L('הסעה באוטובוס תיור','Motorcoach transportation'),Guide:L('מדריך מקצועי','Professional guide'),Activities:L('פעילויות וכרטיסי כניסה','Activities and entrances'),Meals:L('ארוחות קבוצתיות','Group meals'),Insurance:L('הגנת נסיעה','Travel protection')};
  const incl=TYPES.filter(ty=>c.byType[ty]).map(ty=>`<li>${ic('check')} ${inc[ty]}</li>`).join('');
  const not=[!c.byType.Insurance?L('הגנת נסיעה','Travel protection'):'',!c.byType.Meals?L('ארוחות','Meals'):'',L('הוצאות אישיות וטיפים','Personal expenses and gratuities'),L('פעילויות אופציונליות','Optional activities')].filter(Boolean).map(x=>`<li>${ic('x')} ${x}</li>`).join('');
  let btn;
  if(t.stage!=='Quote'||q==='Negotiating')btn=`<button class="pr-cta" disabled>${ic('check')} ${t.stage!=='Quote'?L('ההצעה אושרה','Booking confirmed'):L('ההפקדה נרשמה','Deposit recorded')}</button>`;
  else if(q==='Approval')btn=`<button class="pr-cta" disabled>${ic('hourglass')} ${L('ממתין לאישור מנהל','Waiting for manager approval')}</button>`;
  else btn=`<button class="pr-cta" data-act="pr-accept">${ic('card')} ${L('אשרו ושלמו מקדמה','Accept and pay deposit')} ${usd(dep)}</button>`;
  return `<div class="pr-wrap"><div class="pr-dev"><div class="pr-bezel"><span></span></div><div class="pr-land">
  <div class="pr-hero" style="${phBg(hero,'background:linear-gradient(135deg,var(--hero1),var(--hero2))')}"><div class="pr-agy">${esc(AGENCY)}</div><h2>${esc(t.name)}</h2><div class="pr-meta">${fmtDate(t.dep)} - ${fmtDate(endOf(t))} · ${L(`${t.nights+1} ימים`,`${t.nights+1} days`)} · ${dn(t.dest)}</div>
    <div class="pr-from"><span>${L('מחיר החל מ','Price from')}</span> <strong>${usd(Math.ceil(c.rev/t.pax))}</strong> <span>${L('לנוסע','per traveler')}</span></div></div>
  <div class="pr-sec"><h3>${L('מסלול','Itinerary')}</h3>${dc}</div>
  <div class="pr-sec pr-cols"><div><h3>${L('כלול במחיר','Included')}</h3><ul class="pr-list ok">${incl}</ul></div><div><h3>${L('לא כלול','Not included')}</h3><ul class="pr-list no">${not}</ul></div></div>
  <div class="pr-sec"><h3>${L('לוח תשלומים','Payment schedule')}</h3><table class="pr-pay"><tr><td>${L(`מקדמה ${t.pct}%, עד`,`Deposit ${t.pct}%, due`)} ${fmtDate(t.depDue)}</td><td>${usd(dep,2)}</td></tr><tr><td>${L('יתרה, עד','Balance, due')} ${fmtDate(t.balDue)}</td><td>${usd(r2(c.rev-dep),2)}</td></tr></table>
  ${btn}<p class="small muted">${L('הדגמה: לא מתבצע תשלום אמיתי.','Demo: no real payment is taken.')}</p></div></div></div>
  <p class="small muted pr-cap">${L('כך הלקוח רואה את הקישור הציבורי. עמלות ושולי רווח אינם מופיעים.','This is what the client sees at the public link. Commissions and margins never appear.')}</p></div>`;
}

/* ---------- wrap pQuote ---------- */
{const f0=pQuote;pQuote=function(t){
  const f=prFmt(),bar=prBar(t);
  if(f==='table')return prMaster(t)+bar+prTable(t);
  if(f==='landing')return prMaster(t)+bar+prLanding(t);
  const h=f0(t),i=h.indexOf('<div class="pg rev"');
  return i<0?prMaster(t)+bar+h:prMaster(t)+bar+h.slice(i);
};}

/* ---------- pricing extras (wrap pCosts) ---------- */
function prFeeRow(t,kind,c,c0){
  const f=t[kind]||{m:'%',v:0,on:'both'},ok=prCan(),dis=ok?'':'disabled',amt=c[kind]||0;
  const nm=kind==='ovh'?L('תקורה','Overhead'):L('עמלת תיווך','Brokerage fee');
  const eff=kind==='ovh'?L(`מוסיף ${usd(amt,2)} למחיר (${usd(amt/t.pax,2)} לנוסע). הרווח המתוכנן עולה באותו סכום.`,`Adds ${usd(amt,2)} to the price (${usd(amt/t.pax,2)} per traveler). Planned profit rises by the same amount.`)
    :L(`מוסיף ${usd(amt,2)} למחיר (${usd(amt/t.pax,2)} לנוסע) ומועבר למתווך כעלות. הרווח המתוכנן לא משתנה.`,`Adds ${usd(amt,2)} to the price (${usd(amt/t.pax,2)} per traveler) and passes through to the broker as cost. Planned profit does not change.`);
  return `<tr><td><strong>${nm}</strong></td><td><span class="inl"><select ${dis} data-ch="pr-fee" data-k="${kind}" data-f="m" aria-label="${nm}: ${L('סוג','type')}"><option value="%" ${f.m!=='$'?'selected':''}>%</option><option value="$" ${f.m==='$'?'selected':''}>$</option></select><input type="number" min="0" step="any" ${dis} data-ch="pr-fee" data-k="${kind}" data-f="v" value="${+f.v||0}" aria-label="${nm}: ${L('ערך','value')}"></span></td>
  <td><select ${dis} data-ch="pr-fee" data-k="${kind}" data-f="on" aria-label="${nm}: ${L('חל על','applies to')}"><option value="shared" ${f.on==='shared'?'selected':''}>${L('עלויות משותפות לקבוצה','Shared expenses')}</option><option value="pp" ${f.on==='pp'?'selected':''}>${L('הוצאות פר אדם','Per-person expenses')}</option><option value="both" ${(f.on||'both')==='both'?'selected':''}>${L('שניהם','Both')}</option></select></td>
  <td class="small">${amt?eff:`<span class="muted">${L('לא פעיל','Not applied')}</span>`}</td></tr>`;
}
function prFeesCard(t){
  const c=calc(t),c0=calc(Object.assign({},t,{ovh:null,brk:null})),ok=prCan();
  const pp1=c.rev/t.pax,pp0=c0.rev/t.pax,d=c.planProfit-c0.planProfit;
  return `<div class="card sec pr-fees"><h3>${ic('percent')} ${L('תוספות תמחור','Pricing extras')}</h3>
  <p class="small muted">${L('תקורה ועמלת תיווך מחושבות על אותה בסיס אחרי הנחות, ולא מצטברות זו על זו. הן לא מופיעות בפירוט לפי סוג שירות.','Overhead and brokerage are computed on the same post-discount base and are not compounded. They are not part of the service-type breakdown.')}</p>
  ${ok?'':`<p class="small muted">${ic('lock')} ${L('התפקיד שלכם לא יכול לערוך מחירים.','Your role cannot edit prices.')}</p>`}
  <div class="scroll"><table class="tbl"><thead><tr><th>${L('תוספת','Extra')}</th><th>${L('ערך','Value')}</th><th>${L('חלה על','Applies to')}</th><th>${L('השפעה','Effect')}</th></tr></thead><tbody>${prFeeRow(t,'ovh',c,c0)}${prFeeRow(t,'brk',c,c0)}</tbody></table></div>
  <div class="pr-fx"><div><span class="small muted">${L('מחיר לנוסע','Price per traveler')}</span><strong>${usd(pp1,2)}</strong><span class="small muted">${L('בלי התוספות','without extras')}: ${usd(pp0,2)}</span></div><div><span class="small muted">${L('רווח מתוכנן','Planned profit')}</span><strong>${usd(c.planProfit)}</strong><span class="small muted">${L('בלי התוספות','without extras')}: ${usd(c0.planProfit)} (${d>=0?'+':'-'}${usd(Math.abs(d))})</span></div></div></div>`;
}
{const f0=pCosts;pCosts=function(t){return f0(t)+prFeesCard(t);};}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act^="pr-"]');if(!b)return;
  const a=b.dataset.act,t=T();
  if(a==='pr-fmt'){prSetFmt(b.dataset.v);render();}
  else if(a==='pr-copy'&&t)prCopyLink(t);
  else if(a==='pr-pdf')prPdf();
  else if(a==='pr-accept'&&t){prAccept(t);render();}
});
document.addEventListener('change',e=>{
  const el=e.target;if(!el.dataset||el.dataset.ch!=='pr-fee')return;
  const t=T();if(!t)return;const o={};o[el.dataset.f]=el.value;prSetFee(t,el.dataset.k,o);render();
});

/* ---------- tests ---------- */
TESTS.push({name:'prop formats and extras',run:h=>{
  const out=[],{S,X}=h,qs=TRIPS.filter(t=>t.stage==='Quote');
  if(!qs.length)out.push('no quote trips');
  qs.forEach(t=>{
    PR_TIERS.forEach(n=>{const p=prTierPrice(t,n);if(!isFinite(p)||p<=0)out.push('tier '+t.id+' '+n+' '+p);});
    const r=prRows(t).pop(),c=calc(t);
    if(Math.abs(r.pp-r2(c.rev/t.pax))>.005)out.push('your quote '+t.id);
    if(prTierCalc(t,t.pax).rev!==c.rev&&Math.abs(prTierCalc(t,t.pax).rev-c.rev)>.5)out.push('tier at actual pax differs '+t.id+' '+prTierCalc(t,t.pax).rev+' vs '+c.rev);
    const ss=prSingleSupp(t),seg=['Faith','Senior','Alumni'].includes(t.seg);
    if(seg?!(ss>0):ss!==null)out.push('single supp '+t.id);
  });
  TRIPS.forEach(t=>{
    const c0=calc(t),pr0=c0.planProfit,rev0=c0.rev;
    prSetFee(t,'ovh',{m:'%',v:5,on:'both'});const c1=calc(t);
    if(!(c1.rev>rev0)||Math.abs(c1.planProfit-c1.amtDiff-c1.fx-c1.fcProfit)>.05)out.push('ovh '+t.id);
    prSetFee(t,'brk',{m:'$',v:12,on:'pp'});const c2=calc(t);
    if(Math.abs(c2.planProfit-c1.planProfit)>.05||Math.abs(c2.rev-c1.rev-12*t.pax)>.05)out.push('brk '+t.id);
    const sr=TYPES.reduce((a,ty)=>a+(c2.byType[ty]?c2.byType[ty].rev:0),0),sp=TYPES.reduce((a,ty)=>a+(c2.byType[ty]?c2.byType[ty].plan:0),0);
    if(Math.abs(sr+c2.ovh+c2.brk-c2.rev)>.05)out.push('A15 rev '+t.id);
    if(Math.abs(sp+c2.brk-c2.plan)>.05)out.push('A15 plan '+t.id);
    if(!(prTierPrice(t,20)>0))out.push('tier with fees '+t.id);
    t.ovh=null;t.brk=null;
    if(calc(t).rev!==rev0||calc(t).planProfit!==pr0)out.push('restore '+t.id);
    delete t.ovh;delete t.brk;
  });
  /* setter validation */
  {const t=qs[0];prSetFee(t,'ovh',{m:'x',v:-3,on:'zz'});if(t.ovh.m!=='%'||t.ovh.v!==0||t.ovh.on!=='both')out.push('setter clamp');delete t.ovh;}
  /* accept: Draft/Sent move to Negotiating, Approval does not */
  {const t=qs[0];t.qst='Approval';if(prAccept(t)||t.qst!=='Approval')out.push('accept approval');t.qst='Draft';if(!prAccept(t)||t.qst!=='Negotiating')out.push('accept draft');t.qst='Sent';prAccept(t);if(t.qst!=='Negotiating')out.push('accept sent');
    const o=TRIPS.find(x=>x.stage!=='Quote');if(prAccept(o))out.push('accept non-quote');}
  /* rendering: every format, EN and HE, manager, accountant and an agent; fees card on the Pricing tab */
  const agent=X.ROLE_KEYS.find(r=>r!=='manager'&&r!=='accountant');
  ['en','he'].forEach(lang=>{S.lang=lang;['manager','accountant',agent].forEach(role=>{S.role=role;
    X.visibleTrips().filter(t=>t.stage==='Quote').slice(0,3).forEach(t=>{S.tripId=t.id;S.tab='trip';
      PR_FMTS.forEach(f=>{prSetFmt(f[0]);S.ptab='quote';const hh=X.vTrip();h.chk(hh,'pr '+lang+role+t.id+f[0]);if(lang==='en')h.scan(hh,'pr '+f[0]);});
      S.ptab='costs';t.ovh={m:'%',v:5,on:'both'};t.brk={m:'$',v:10,on:'pp'};const hh=X.vTrip();h.chk(hh,'prfees '+lang+role+t.id);if(lang==='en')h.scan(hh,'prfees');
      if(!/pr-fees/.test(hh))out.push('fees card missing '+t.id);delete t.ovh;delete t.brk;});
    const o=X.visibleTrips().find(t=>t.stage!=='Quote');if(o){S.tripId=o.id;S.ptab='quote';PR_FMTS.forEach(f=>{prSetFmt(f[0]);h.chk(X.vTrip(),'pr non-quote '+lang+f[0]);});}
  });});
  prSetFmt('pdf');S.role='manager';S.lang='en';
  return out;}});
