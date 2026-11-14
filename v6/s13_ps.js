/* ---------- v8.4 module "ps": Supplier portal (spec-v8.4-viewpoints.md §3.4 + amendments A1, A10, A11) ----------
   What the supplier of a trip sees: booking requests (Confirm / Decline write the same fields as spSetFlow), rooming lists,
   invoices in neutral supplier-side words, queries from the agency (Issue credit, Reply with documents), and the payment schedule.
   FICTIONAL SUPPLIERS ONLY (real-brand rule): the picker, every row and every card come from pvFictionalSuppliers().
   Supplier-side wording: "difference", "query", "credit". Never "overbilling" or "dispute". Prefix ps- on every act, class and listener. */
const PS_UI={all:{}};
const PS_UNIT={'room-night':['לילות חדר','room nights'],day:['ימים','days'],person:['אנשים','people'],meal:['ארוחות','meals'],transfer:['העברות','transfers'],evening:['ערבים','evenings']};
const psUnitL=u=>PS_UNIT[u]?L(PS_UNIT[u][0],PS_UNIT[u][1]):esc(u||'');
const PS_QST=['','open','disputed'];

/* ---------- model (pure) ---------- */
const psSup=()=>{const p=pvPerson();return p?SUPPLIERS.find(s=>s.id===p.id)||null:null;};
const psPast=t=>endOf(t)<iso(TODAY);
const psTrips=s=>TRIPS.filter(t=>t.stage!=='Quote'&&t.lines.some(l=>l.sup===s.name));
/* booking requests: the trip's supplier entries (t.sups) that name this supplier */
function psRequests(s){const out=[];
  psTrips(s).forEach(t=>(t.sups||[]).forEach((e,i)=>{if(e.n!==s.name)return;const l=typeof spLine==='function'?spLine(t,e):t.lines.find(x=>x.sup===s.name);out.push({t,i,e,l,flow:spFlow(e)});}));
  return out.sort((a,b)=>a.t.dep<b.t.dep?-1:a.t.dep>b.t.dep?1:0);}
/* the field writes of spSetFlow(t,i,flow), mirrored: the supplier acts as the supplier, so there is no agency permission gate (A1) */
function psSetFlow(t,i,flow){const e=t&&t.sups&&t.sups[i];if(!e||(flow!=='approved'&&flow!=='contact'))return false;
  e.flow=flow;e.st=SP_ST[flow];return true;}
/* queries: this supplier's open differences above what was contracted (A10) */
function psQueries(s){const out=[];
  TRIPS.filter(t=>t.stage!=='Quote').forEach(t=>tripGaps(t).forEach(x=>{
    if(x.l.sup===s.name&&x.s.k==='gap'&&x.usd>0&&PS_QST.includes(x.l.inv.st||''))out.push(x);}));
  return out.sort((a,b)=>b.usd-a.usd);}
const psCredited=s=>{const out=[];TRIPS.filter(t=>t.stage!=='Quote').forEach(t=>tripGaps(t).forEach(x=>{if(x.l.sup===s.name&&x.s.k==='credited')out.push(x);}));return out;};
const psQSum=s=>r2(psQueries(s).reduce((a,x)=>a+x.usd,0));
/* the credit: gapCredit (s11_fix) is the single function behind the agency's "Credit received" button; same formula as A10 */
function psCredit(t,l){const i=l&&l.inv;if(!i||!PS_QST.includes(i.st||''))return 0;
  const amt=r2(effAmt(i)-planC(l));if(!(amt>0))return 0;
  if(typeof gapCredit==='function')gapCredit(l);else{i.credit=r2((i.credit||0)+amt);i.st='credited';}
  return r2(amt*lrate(t,l));}
function psReply(l){if(!l||!l.inv)return false;l.inv.reply=true;return true;}
/* invoice status in supplier words, in the order of A10 */
function psInvSt(l){const i=l.inv;if(!i)return {k:'none',pill:['לא הוגשה חשבונית','Not invoiced',''],pay:false};
  const s=invStatus(l);
  if(i.st==='credited')return {k:'credited',pill:['זיכוי הונפק','Credit issued','green']};
  if(i.st==='accepted')return {k:'accepted',pill:['אושר','Approved','green']};
  if(i.paid)return {k:'paid',pill:['שולם','Paid','green']};
  if(s.k==='match')return {k:'match',pill:['תואם','Matched','blue']};
  if(s.k==='gap'&&s.diff>0&&PS_QST.includes(i.st||''))return {k:'query',pill:['שאילתה פתוחה','Query open','amber']};
  return {k:'recv',pill:['התקבלה','Received','']};}
const psPill=st=>pillF(L(st.pill[0],st.pill[1]),st.pill[2]);
const psPayDate=(t,s)=>addDays(endOf(t),s.terms.balDays);
function psInvoices(s){const out=[];
  psTrips(s).forEach(t=>t.lines.forEach(l=>{if(l.sup!==s.name)return;const st=psInvSt(l);out.push({t,l,i:l.inv,st,usd:l.inv?r2(effAmt(l.inv)*lrate(t,l)):0,due:psPayDate(t,s)});}));
  return out.sort((a,b)=>a.t.dep<b.t.dep?-1:a.t.dep>b.t.dep?1:a.l.id-b.l.id);}
/* payment schedule per trip from the supplier's terms: deposit depDays before arrival, balance balDays after the trip ends */
function psSchedule(s){const T=s.terms,tdy=iso(TODAY);
  return psTrips(s).map(t=>{const ls=t.lines.filter(l=>l.sup===s.name),lr=l=>lrate(t,l);
    const total=r2(ls.reduce((a,l)=>a+(l.inv?effAmt(l.inv):planC(l))*lr(l),0));
    const dep=r2(total*T.depPct/100),bal=r2(total-dep),dd=addDays(t.dep,-T.depDays),bd=psPayDate(t,s);
    const inv=ls.filter(l=>l.inv),allPaid=inv.length>0&&inv.length===ls.length&&inv.every(l=>l.inv.paid||l.inv.st==='credited');
    const q=r2(psQueries(s).filter(x=>x.t===t).reduce((a,x)=>a+x.usd,0));
    return {t,q,total,dep,bal,dd,bd,depPaid:dd<=tdy||allPaid,balPaid:allPaid};});}
const psArrivals=(s,days)=>psTrips(s).filter(t=>{const d=pvDaysTo(t);return d>=0&&d<=days;});
function psModel(s){
  const reqs=psRequests(s),toConfirm=reqs.filter(r=>r.flow!=='approved'&&!psPast(r.t)),qs=psQueries(s),invs=psInvoices(s).filter(x=>x.i);
  const total=r2(invs.reduce((a,x)=>a+x.usd,0)),settled=r2(invs.filter(x=>x.st.k==='paid'||x.st.k==='accepted'||x.st.k==='credited').reduce((a,x)=>a+x.usd,0));
  const wait=invs.filter(x=>x.st.k!=='paid'&&x.st.k!=='credited'),waitAmt=r2(wait.reduce((a,x)=>a+x.usd,0));
  return {reqs,toConfirm,qs,qAmt:r2(qs.reduce((a,x)=>a+x.usd,0)),invs,total,settled,pct:total>0?Math.round(settled/total*100):0,wait,waitAmt,arr:psArrivals(s,60)};}

/* ---------- small view helpers ---------- */
const psFlowL={approved:['אושר','Confirmed','green'],pending:['ממתין לתשובתך','Awaiting your reply','blue'],contact:['לא אושר','Not confirmed',''],compare:['בבדיקה','Under review','purple']};
const psFlowPill=f=>{const x=psFlowL[f]||psFlowL.contact;return pillF(L(x[0],x[1]),x[2]);};
const psDates=t=>`${fmtDate(t.dep)} – ${fmtDate(endOf(t))}`;
const psTripH=t=>`<b class="ps-tn"><bdi>${esc(t.name)}</bdi></b><span class="muted small ps-ts"><bdi>${esc(t.client)}</bdi> · ${psDates(t)} · ${paxL(t.pax)}</span>`;
const psEmpty=(ic0,txt)=>`<div class="card hc-card ps-empty"><span class="ps-ei">${ic(ic0)}</span><p class="muted">${txt}</p></div>`;
const psTabBtn=(tab,cls,label)=>hcCta(cls,tab==='req'?'check':tab==='inv'?'receipt':tab==='pay'?'wallet':'mail',label,`data-act="ps-tab" data-v="${tab}"`);

/* ---------- tabs ---------- */
function psHome(s,p){
  const m=psModel(s),first=String(p.name).split(' ')[0],nx=m.arr[0]||psTrips(s).filter(t=>pvDaysTo(t)>=0)[0];
  const rq=m.toConfirm.length,q=m.qs.length;
  const brief=(rq?L(`${hlKey(rq)} ${rq===1?'הזמנה':'הזמנות'} ממתינות לאישורך.`,`${hlKey(rq)} ${PLN(rq,'booking','bookings')} to confirm.`):L('כל ההזמנות אושרו.','Every booking is confirmed.'))+' '+
    (q?L(`ל-Redbud ${q===1?'יש שאלה אחת':'יש '+q+' שאלות'} על חשבוניות, בסך ${hlWarn(usd(m.qAmt))}.`,`Redbud has ${hlKey(q)} ${PLN(q,'query','queries')} on invoices, ${hlWarn(usd(m.qAmt))} in total.`):L('אין שאלות פתוחות על חשבוניות.','No open invoice queries.'));
  const hero=pvHero({cls:'ps-hero',name:first,role:esc(s.name),brief,
    ctas:rq?[psTabBtn('req','mint',L('לאשר הזמנות','Confirm bookings')),psTabBtn('inv','ghost',L('חשבוניות','Invoices'))]:q?[psTabBtn('disp','mint',L('שאילתות','Queries')),psTabBtn('inv','ghost',L('חשבוניות','Invoices'))]:[psTabBtn('inv','mint',L('חשבוניות','Invoices')),psTabBtn('pay','ghost',L('תשלומים','Payments'))],
    gauge:{pct:m.pct,label:L('מהסכום שהוגש שולם או אושר','of invoiced amount paid or approved'),lines:[{cls:'ok',icon:'check',lab:L('שולם או אושר','Paid or approved'),val:usd(m.settled)},{cls:'op',icon:'hourglass',lab:L('ממתין לתשלום','Awaiting payment'),val:usd(m.waitAmt)}]},
    kpis:[{lab:L('הזמנות לאישור','Bookings to confirm'),val:rq,cls:rq?'warn':'',sub:L(`מתוך ${m.reqs.length} בקשות`,`of ${m.reqs.length} ${PLN(m.reqs.length,'request','requests')}`),act:'ps-tab',v:'req'},
      {lab:L('הגעות ב-60 הימים הקרובים','Arrivals in 60 days'),val:m.arr.length,sub:nx?`${esc(nx.name)} · ${hcIn(pvDaysTo(nx))}`:L('אין הגעות קרובות','Nothing scheduled'),act:'ps-tab',v:'list'},
      {lab:L('חשבוניות ממתינות לתשלום','Invoices awaiting payment'),val:usd(m.waitAmt),cls:'pf',sub:L(`${m.wait.length} חשבוניות`,`${m.wait.length} ${PLN(m.wait.length,'invoice','invoices')}`),act:'ps-tab',v:'inv'},
      {lab:L('שאילתות פתוחות מ-Redbud','Open queries from Redbud'),val:q,cls:q?'warn':'',sub:q?usd(m.qAmt):L('הכל סגור','All answered'),act:'ps-tab',v:'disp'}]});
  const arr=psTrips(s).filter(t=>pvDaysTo(t)>=0).slice(0,4),T=s.terms;
  const ag=nx?nx.agent:'Priya';
  return hero+`<div class="hc-grid">
   <div class="hc-c7"><div class="card hc-card"><div class="hc-h"><h3>${L('ההגעות הבאות','Next arrivals')}</h3><span class="muted small">${L('קבוצות שמגיעות אליכם','Groups coming to you')}</span></div>
    ${arr.length?`<ul class="ps-lst">${arr.map(t=>{const e=(t.sups||[]).find(x=>x.n===s.name);return `<li><div class="ps-lm">${psTripH(t)}</div><div class="ps-la"><span class="muted small">${hcIn(pvDaysTo(t))}</span>${e?psFlowPill(spFlow(e)):''}</div></li>`;}).join('')}</ul>`
      :`<p class="muted">${L('אין הגעות מתוכננות.','No arrivals scheduled.')}</p>`}
    <button class="hc-more" data-act="ps-tab" data-v="list">${L('לרשימות האורחים','To the rooming lists')} ${ic('chev','flip')}</button></div></div>
   <div class="hc-c5"><div class="card hc-card"><div class="hc-h"><h3>${L('התנאים שלכם עם Redbud','Your terms with Redbud')}</h3></div>
    <dl class="ps-dl"><dt>${L('מקדמה','Deposit')}</dt><dd><bdi>${T.depPct}%</bdi> · ${L(`${T.depDays} ימים לפני ההגעה`,`${T.depDays} days before arrival`)}</dd>
     <dt>${L('יתרה','Balance')}</dt><dd>${L(`${T.balDays} ימים אחרי סוף הטיול`,`${T.balDays} days after the trip ends`)}</dd>
     <dt>${L('אופן תשלום','Paid by')}</dt><dd>${esc(typeof SP_PAY!=='undefined'&&SP_PAY[T.payBy]?L(SP_PAY[T.payBy][0],SP_PAY[T.payBy][1]):T.payBy)}</dd></dl>
    <div class="ps-ct">${avatarOf(agn(ag),'xs')}<span class="small"><b>${esc(agn(ag))}</b><br><span class="muted"><bdi>${esc((AGE[ag]||'agent').split(' ')[0].toLowerCase())}@redbudtours.example</bdi> · <bdi>918-555-0100</bdi></span></span></div></div></div></div>`;
}

function psReqCard(r,s){const {t,i,l,flow}=r,e=r.e;
  const rooms=l&&l.unit==='room-night'&&t.nights?Math.round(l.qty/t.nights):0;
  const units=l?(rooms?L(`${rooms} חדרים · ${l.qty} ${psUnitL(l.unit)}`,`${rooms} rooms · ${l.qty} ${psUnitL(l.unit)}`):L(`${l.qty} ${psUnitL(l.unit)}`,`${l.qty} ${psUnitL(l.unit)}`)):'';
  return `<div class="card hc-card ps-req" data-trip="${t.id}">
   <div class="ps-rh"><div class="ps-lm">${psTripH(t)}</div>${psFlowPill(flow)}</div>
   <div class="ps-chips">${l?`<span class="ps-chip">${ic('tag')} <bdi>${esc(l.name)}</bdi></span><span class="ps-chip">${ic('users2')} ${units}</span><span class="ps-chip">${ic('wallet')} ${money(planC(l),l.cur)}</span>`:''}</div>
   ${psPast(t)?`<div class="ps-acts"><span class="muted small">${ic('done')} ${L('השהייה הסתיימה. אין פעולות נוספות.','This stay is complete. No further action.')}</span></div>`
   :`<div class="ps-acts">${flow!=='approved'?`<button class="btn pri sm" data-act="ps-set" data-v="${t.id}|${i}|approved">${ic('check')} ${L('אישור','Confirm')}</button>${flow!=='contact'?`<button class="btn sm" data-act="ps-set" data-v="${t.id}|${i}|contact">${ic('x')} ${L('דחייה','Decline')}</button>`:''}`
    :`<span class="pos small">${ic('done')} ${L('אישרתם את ההזמנה. Redbud רואה זאת בלשונית הספקים של הטיול.','You confirmed this booking. Redbud sees it in the trip\'s Suppliers tab.')}</span>`}</div>`}</div>`;}
function psReq(s){const m=psModel(s);
  if(!m.reqs.length)return psEmpty('inbox',L('אין בקשות הזמנה כרגע.','No booking requests right now.'));
  const todo=m.toConfirm.length,cur=m.reqs.filter(r=>!psPast(r.t)),old=m.reqs.filter(r=>psPast(r.t));
  return `<div class="hc-grid"><div class="hc-c12"><div class="ps-head"><h2>${L('בקשות הזמנה','Booking requests')}</h2><span class="muted small">${todo?L(`${todo} ממתינות לאישור`,`${todo} to confirm`):L('הכל אושר','All confirmed')}</span></div></div>
   ${cur.map(r=>`<div class="hc-c6">${psReqCard(r,s)}</div>`).join('')}
   ${old.length?`<div class="hc-c12"><div class="ps-head"><h2>${L('שהיות שהסתיימו','Completed stays')}</h2></div></div>${old.map(r=>`<div class="hc-c6">${psReqCard(r,s)}</div>`).join('')}`:''}</div>`;}

/* rooming list: rooms from the trip's travelers; other services: head count, dietary counts and service times */
function psRooms(t){const by={};(t.trav||[]).forEach(x=>{const r=by[x.room]||(by[x.room]={room:x.room,type:x.roomType||'',names:[],diet:[]});r.names.push(x.n);if(x.diet&&x.diet!=='None')r.diet.push(x.diet);});
  return Object.values(by).sort((a,b)=>a.room-b.room);}
const PS_DIET={Vegetarian:['צמחוני','Vegetarian'],'Gluten-free':['ללא גלוטן','Gluten-free'],Diabetic:['סוכרתי','Diabetic'],'Nut allergy':['אלרגיה לאגוזים','Nut allergy']};
const psDietL=d=>PS_DIET[d]?L(PS_DIET[d][0],PS_DIET[d][1]):esc(d);
const PS_RT={Single:['יחיד','Single'],Double:['זוגי','Double'],Twin:['שתי מיטות','Twin'],Triple:['משולש','Triple'],Quad:['רביעייה','Quad']};
const psRtL=r=>PS_RT[r]?L(PS_RT[r][0],PS_RT[r][1]):esc(r);
function psService(t,l){const ds=pvDays(t),kind={Transport:'travel',Meals:'meal',Activities:'visit',Guide:'visit'}[l.type];
  const nm=String(l.name).toLowerCase(),hit=[];
  ds.forEach(d=>d.items.forEach(x=>{const a=x.name.toLowerCase();if(a.includes(nm)||nm.includes(a)||(kind&&x.kind===kind&&!hit.length&&l.type!=='Activities'))hit.push({d,x});}));
  return hit.slice(0,3);}
function psList(s){
  const ts=psTrips(s).filter(t=>pvDaysTo(t)>=0);
  if(!ts.length)return psEmpty('checklist',L('אין הגעות קרובות, ולכן אין רשימת אורחים.','No upcoming arrivals, so there is no rooming list yet.'));
  return `<div class="hc-grid">${ts.map(t=>{
    const ls=t.lines.filter(l=>l.sup===s.name&&!l.extra),lodge=ls.some(l=>l.type==='Lodging'),dietN={};(t.trav||[]).forEach(x=>{if(x.diet&&x.diet!=='None')dietN[x.diet]=(dietN[x.diet]||0)+1;});
    const dietTxt=Object.keys(dietN).map(k=>`${psDietL(k)} <b>${dietN[k]}</b>`).join(' · ')||L('אין העדפות מזון מיוחדות','No dietary needs');
    let body='';
    if(lodge){const rooms=psRooms(t),b=typeof blockOf==='function'&&t.room&&t.room.hotel===s.name?blockOf(t):null,all=PS_UI.all[t.id],shown=all?rooms:rooms.slice(0,8);
      const types=b?b.types:rooms.reduce((a,r)=>{a[r.type||'Twin']=(a[r.type||'Twin']||0)+1;return a;},{});
      body=`<div class="ps-chips">${Object.keys(types).map(k=>`<span class="ps-chip">${ic('bed')} ${psRtL(k)} <b>${types[k]}</b></span>`).join('')}<span class="ps-chip">${ic('users2')} ${paxL(t.pax)}</span></div>
       ${rooms.length?`<div class="scroll"><table class="tbl ps-tbl"><thead><tr><th>${L('חדר','Room')}</th><th>${L('סוג','Type')}</th><th>${L('אורחים','Guests')}</th><th>${L('מזון','Dietary')}</th></tr></thead><tbody>${shown.map(r=>`<tr><td class="n"><bdi>${esc(r.room)}</bdi></td><td>${psRtL(r.type)}</td><td><bdi>${esc(r.names.join(', '))}</bdi></td><td>${r.diet.length?r.diet.map(psDietL).join(', '):'<span class="muted">–</span>'}</td></tr>`).join('')}</tbody></table></div>
       ${rooms.length>8?`<button class="hc-more" data-act="ps-all" data-v="${t.id}">${all?L('להציג פחות','Show fewer'):L(`לכל ${rooms.length} החדרים`,`Show all ${rooms.length} rooms`)} ${ic('chev','flip')}</button>`:''}`
        :`<p class="muted small">${L('רשימת החדרים תישלח קרוב להגעה.','The rooming list is sent closer to arrival.')}</p>`}`;}
    else{body=`<div class="ps-chips"><span class="ps-chip">${ic('users2')} ${paxL(t.pax)}</span></div><p class="small">${dietTxt}</p>
      <ul class="ps-lst">${ls.map(l=>{const hit=psService(t,l);return `<li><div class="ps-lm"><b>${esc(l.name)}</b><span class="muted small">${l.qty} ${psUnitL(l.unit)}</span></div><div class="ps-la small">${hit.length?hit.map(h=>`${L('יום','Day')} ${h.d.i} · <bdi>${pvClock(h.x.start)}</bdi>`).join('<br>'):'<span class="muted">–</span>'}</div></li>`;}).join('')}</ul>`;}
    return `<div class="hc-c12"><div class="card hc-card ps-roster"><div class="hc-h"><div class="ps-lm">${psTripH(t)}</div><button class="btn sm" data-act="ps-print">${ic('printer')} ${L('הדפסה','Print')}</button></div>${body}</div></div>`;}).join('')}</div>`;}

function psInv(s){const m=psModel(s),rows=psInvoices(s);
  if(!rows.length)return psEmpty('receipt',L('עוד לא הוגשו חשבוניות.','No invoices yet.'));
  const row=x=>`<div class="ps-ir"><div class="ps-lm"><b><bdi>${esc(x.l.name)}</bdi></b><span class="muted small"><bdi>${esc(x.t.name)}</bdi>${x.i?` · <bdi>${esc(x.i.no)}</bdi>`:''}</span></div>
    <div class="ps-ia"><b class="n">${x.i?money(effAmt(x.i),x.l.cur):'–'}</b>${psPill(x.st)}</div>
    <div class="ps-id muted small">${x.st.k==='paid'?L('שולם','Paid'):x.st.k==='credited'?L('קוזז בזיכוי','Settled by credit'):x.i?`${L('תשלום צפוי','Expected')} ${fmtDate(x.due)}`:L('עוד לא הוגשה','Not submitted yet')}</div></div>`;
  return `<div class="hc-grid"><div class="hc-c12"><div class="card hc-card"><div class="hc-h"><h3>${L('חשבוניות שהגשתם','Invoices you submitted')}</h3><span class="muted small">${m.invs.length} ${L('חשבוניות','invoices')} · ${usd(m.total)}</span></div>
   <div class="ps-ilist">${rows.map(row).join('')}</div></div></div></div>`;}

function psQCard(x){const {t,l}=x,i=l.inv,k=kindOf(l,x.s),cur=l.cur,mm=v=>money(v,cur,0);
  return `<div class="card hc-card ps-disp" data-trip="${t.id}" data-line="${l.id}">
   <div class="ps-rh"><div class="ps-lm">${psTripH(t)}</div>${i.reply?pillF(L('נשלחו מסמכים','Documents sent'),'blue'):pillF(L('שאילתה פתוחה','Query open'),'amber')}</div>
   <div class="ps-qk">${kindPill(k)}<span class="muted small"><bdi>${esc(l.name)}</bdi> · <bdi>${esc(i.no)}</bdi></span></div>
   <p class="ps-ex">${gapExplain(t,l)}</p>
   <dl class="ps-dl ps-nums"><dt>${L('מה שהוסכם','Agreed')}</dt><dd>${mm(planC(l))}</dd><dt>${L('מה שהוגש','Invoiced')}</dt><dd>${mm(effAmt(i))}</dd><dt>${L('הפרש','Difference')}</dt><dd><b class="hl warn">${mm(r2(effAmt(i)-planC(l)))}</b></dd></dl>
   <div class="ps-acts"><button class="btn pri sm" data-act="ps-credit" data-v="${t.id}|${l.id}">${ic('receipt')} ${L('להנפיק זיכוי','Issue credit')} ${usd(x.usd)}</button>
    <button class="btn sm" data-act="ps-reply" data-v="${t.id}|${l.id}" ${i.reply?'disabled':''}>${ic('mail')} ${L('להשיב עם מסמכים','Reply with documents')}</button></div></div>`;}
function psDisp(s){const qs=psQueries(s),done=psCredited(s);
  const open=qs.length?`<div class="hc-grid"><div class="hc-c12"><div class="ps-head"><h2>${L('שאילתות מ-Redbud','Queries from Redbud')}</h2><span class="muted small">${L(`${qs.length} פתוחות · ${usd(r2(qs.reduce((a,x)=>a+x.usd,0)))} הפרש`,`${qs.length} open · ${usd(r2(qs.reduce((a,x)=>a+x.usd,0)))} difference`)}</span></div></div>${qs.map(x=>`<div class="hc-c6">${psQCard(x)}</div>`).join('')}</div>`
    :`<div class="card hc-card ps-empty ps-disp"><span class="ps-ei">${ic('done')}</span><p>${done.length?L('כל השאילתות נענו. הזיכויים נרשמו אצל Redbud.','Every query is answered. The credits are recorded at Redbud.'):L('אין שאילתות פתוחות מ-Redbud.','No open queries from Redbud.')}</p></div>`;
  const cr=done.length?`<div class="card hc-card ps-cr"><div class="hc-h"><h3>${L('זיכויים שהונפקו','Credits issued')}</h3><span class="hc-pill green">${usd(r2(done.reduce((a,x)=>a+x.usd,0)))}</span></div>
   <ul class="ps-lst">${done.map(x=>`<li><div class="ps-lm"><b><bdi>${esc(x.l.name)}</bdi></b><span class="muted small"><bdi>${esc(x.t.name)}</bdi> · <bdi>${esc(x.l.inv.no)}</bdi></span></div><div class="ps-la"><b class="pos">${usd(x.usd)}</b></div></li>`).join('')}</ul></div>`:'';
  return open+cr;}

function psPay(s){const sc=psSchedule(s),T=s.terms,tdy=iso(TODAY);
  if(!sc.length)return psEmpty('wallet',L('אין עדיין לוח תשלומים.','No payment schedule yet.'));
  const hist=[];psInvoices(s).forEach(x=>{if(!x.i)return;
    if(x.st.k==='credited')hist.push({d:x.due<tdy?x.due:tdy,t:x.t,l:x.l,a:x.l.inv.credit*lrate(x.t,x.l),k:'credit'});
    else if(x.st.k==='paid')hist.push({d:x.due<tdy?x.due:tdy,t:x.t,l:x.l,a:x.usd,k:'paid'});});
  hist.sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0);
  const state=(paid,d)=>paid?pillF(L('שולם','Paid'),'green'):d<=tdy?pillF(L('לתשלום','Due'),'blue'):pillF(L('מתוזמן','Scheduled'),'');
  return `<div class="hc-grid"><div class="hc-c7"><div class="card hc-card"><div class="hc-h"><h3>${L('לוח תשלומים','Payment schedule')}</h3><span class="muted small">${L(`מקדמה ${T.depPct}% · יתרה ${T.balDays} ימים אחרי הטיול`,`${T.depPct}% deposit · balance ${T.balDays} days after the trip`)}</span></div>
    <div class="ps-ilist">${sc.map(x=>`<div class="ps-sch"><div class="ps-lm">${psTripH(x.t)}</div>
     <div class="ps-pr"><span>${L('מקדמה','Deposit')} <b class="n">${usd(x.dep)}</b></span><span class="muted small">${fmtDate(x.dd)}</span>${state(x.depPaid,x.dd)}</div>
     <div class="ps-pr"><span>${L('יתרה','Balance')} <b class="n">${usd(x.bal)}</b></span><span class="muted small">${fmtDate(x.bd)}</span>${state(x.balPaid,x.bd)}</div>${x.q>0?`<p class="small muted ps-qn">${L(`כולל ${usd(x.q)} בשאילתה`,`incl. ${usd(x.q)} under query`)}</p>`:''}</div>`).join('')}</div></div></div>
   <div class="hc-c5"><div class="card hc-card"><div class="hc-h"><h3>${L('היסטוריית העברות','Remittance history')}</h3></div>
    ${hist.length?`<ul class="ps-lst">${hist.slice(0,8).map(h=>`<li><div class="ps-lm"><b><bdi>${esc(h.l.name)}</bdi></b><span class="muted small"><bdi>${esc(h.t.name)}</bdi> · ${fmtDate(h.d)}</span></div><div class="ps-la"><b class="n ${h.k==='credit'?'':'pos'}">${usd(h.a)}</b><span class="muted small">${h.k==='credit'?L('זיכוי','Credit'):L('שולם','Paid')}</span></div></li>`).join('')}</ul>`
     :`<p class="muted">${L('עוד לא התקבלו העברות.','No remittances yet.')}</p>`}
    <p class="small muted ps-sim">${pvMoneyNote()}</p></div></div></div>`;}

/* ---------- register ---------- */
const PS_DEF=(SUPPLIERS.find(x=>x.name==='Ozark Lakeside Lodge')||pvFictionalSuppliers()[0]||{}).id;
pvRegister('supplier',{role:['ספק','Supplier'],label:['פורטל ספקים','Supplier portal'],kind:'field',feat:'psup',
  people:()=>pvFictionalSuppliers().map(s=>({id:s.id,name:s.contact.name,sub:s.name})),def:PS_DEF,
  tabs:[['home','בית','Home','home'],['req','בקשות','Requests','inbox'],['list','רשימות','Lists','checklist'],['inv','חשבוניות','Invoices','receipt'],['disp','שאילתות','Queries','mail'],['pay','תשלומים','Payments','wallet']],
  view:(tab,p)=>{const s=psSup();if(!s||s.real)return psEmpty('suppliers',L('אין ספק להצגה.','No supplier to show.'));
    return ({home:psHome,req:psReq,list:psList,inv:psInv,disp:psDisp,pay:psPay}[tab]||psHome)(s,p);}});

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="ps-"]');if(!b||!S.pv||S.pv.k!=='supplier')return;
  const a=b.dataset.act,v=b.dataset.v||'',p=v.split('|'),t=TRIPS.find(x=>x.id===p[0]);
  if(a==='ps-tab'){pvTab(v);try{window.scrollTo(0,0);}catch(err){}render();}
  else if(a==='ps-set'&&t){if(psSetFlow(t,+p[1],p[2])){toast(p[2]==='approved'?L('ההזמנה אושרה. Redbud רואה זאת בלשונית הספקים של הטיול.','Booking confirmed. Redbud sees it in the trip\'s Suppliers tab.'):L('ההזמנה נדחתה. Redbud תקבל הודעה.','Booking declined. Redbud is notified.'));render();}}
  else if(a==='ps-credit'&&t){const l=t.lines.find(x=>String(x.id)===p[1]),n=psCredit(t,l);if(n>0){toast(L(`זיכוי על ${usd(n)} הונפק ונרשם אצל Redbud.`,`Credit for ${usd(n)} issued and recorded at Redbud.`));render();}}
  else if(a==='ps-reply'&&t){const l=t.lines.find(x=>String(x.id)===p[1]);if(psReply(l)){toast(L('המסמכים נשלחו ל-Redbud.','Documents sent to Redbud.'));render();}}
  else if(a==='ps-all'){PS_UI.all[v]=!PS_UI.all[v];render();}
  else if(a==='ps-print'){try{window.print();}catch(err){}}
});

/* ---------- developer notes ---------- */
if(typeof SPEC!=='undefined'){
  const base={roles:{view:['supplier'],act:['supplier']},perms:[],status:'roadmap',code:['v6/s13_ps.js','v6/m_ps.css'],tests:['TEST ps supplier portal'],
    api:['GET /v1/portal/{token}/supplier (proposed)'],
    states:{empty:'A supplier with nothing to show gets a short explanation card.',loading:'Not applicable (local data).',error:'A view that throws shows "This screen could not load."'}};
  const E=(title,purpose,data,actions,rules)=>Object.assign({},base,{title,purpose,data,actions,rules:rules.concat(['Fictional suppliers only: a real hotel or venue is never listed or shown','Portal access is by invitation link (proposed), so no agency permissions apply'])});
  SPEC['portal:supplier:home']=E('Supplier portal: home','What needs the supplier today: bookings to confirm, arrivals, invoices awaiting payment and open queries.',['SUPPLIERS (fictional)','t.sups','tripGaps(t)','effAmt(inv)'],
    [{label:'Confirm bookings',does:'Opens the requests tab',rule:'Always available'},{label:'Invoices',does:'Opens the invoices tab',rule:'Always available'}],['Gauge = invoiced amount paid, approved or credited, over all invoiced','KPI tiles open the matching tab']);
  SPEC['portal:supplier:req']=E('Supplier portal: booking requests','Every booking the agency asked this supplier for, with Confirm and Decline.',['t.sups entry (st, flow)','t.lines'],
    [{label:'Confirm',does:'flow=approved, st=Confirmed (same writes as spSetFlow)',rule:'The agency sees it in the trip Suppliers tab'},{label:'Decline',does:'flow=contact, st=Not sent',rule:'Agency is notified (simulated)'}],['Supplier acts as the supplier: no agency permission gate (A1)']);
  SPEC['portal:supplier:list']=E('Supplier portal: rooming lists','Rooming list for lodging and head count, dietary counts and service times for other services.',['t.trav','blockOf(t)','pvDays(t)'],
    [{label:'Print',does:'Prints the page',rule:'window.print in try/catch'},{label:'Show all rooms',does:'Expands the room table',rule:'First 8 rooms shown'}],['Upcoming trips only']);
  SPEC['portal:supplier:inv']=E('Supplier portal: invoices','Invoices the supplier submitted, in neutral words, with the expected payment date.',['l.inv','invStatus(l)','terms.balDays'],
    [],['Status order: Credit issued, Approved, Paid, Matched, Query open, Received, Not invoiced','Expected payment = trip end + terms.balDays']);
  SPEC['portal:supplier:disp']=E('Supplier portal: queries','Differences the agency found between the invoice and the agreed price, with two answers.',['tripGaps(t)','l.inv.st','l.inv.reply'],
    [{label:'Issue credit',does:'inv.credit += effAmt(inv) - planC(l); inv.st=credited (gapCredit)',rule:'Only for open or sent queries above zero'},{label:'Reply with documents',does:'inv.reply=true and a toast',rule:'Query stays open'}],
    ['Wording: difference, query, credit; never overbilling or dispute','Finance identity planProfit - amtDiff - fx - fcProfit = 0 still holds','Meeting beat selects .ps-disp']);
  SPEC['portal:supplier:pay']=E('Supplier portal: payments','Deposit and balance dates from the supplier terms, and the remittance history.',['SUPPLIERS[].terms','l.inv.paid','l.inv.credit'],
    [],['Deposit due = arrival - depDays; balance due = trip end + balDays','Payments are simulated: no money moved']);
}

/* ---------- tests ---------- */
TESTS.push({name:'ps supplier portal',run:h=>{const out=[];
  const P=PORTALS.supplier;if(!P)return ['supplier portal not registered'];
  const ps=P.people();
  if(!ps.length)return ['no supplier people'];
  ps.forEach(x=>{const s=SUPPLIERS.find(y=>y.id===x.id);if(!s||s.real||s.fictional!==true)out.push('picker lists a non-fictional supplier '+x.id);});
  if(!ps.some(x=>x.id===P.def))out.push('default supplier not in picker');
  if(SUPPLIERS.find(x=>x.id===P.def).name!=='Ozark Lakeside Lodge')out.push('default is not Ozark Lakeside Lodge');
  const bigGap=()=>ps.map(x=>SUPPLIERS.find(y=>y.id===x.id)).sort((a,b)=>psQSum(b)-psQSum(a))[0];
  const catNames=(CATALOG.hotels||[]).concat(CATALOG.venues||[]).map(x=>x.name).filter(n=>n&&n.length>5);
  const fictNames=pvFictionalSuppliers().map(x=>x.name).sort((a,b)=>b.length-a.length);
  const NEG=/query|queries|credit|difference|unconfirmed|overdue|\blate\b|risk|\bgap|dispute|overbill/i;
  const sweep=(ids,tag)=>{for(const lang of ['en','he']){S.lang=lang;
    ids.forEach(id=>P.tabs.forEach(([tab])=>{pvOpen('supplier',id,tab);
      try{render();const hh=h.els.app.innerHTML;h.chk(hh,`ps ${tag} ${id} ${tab} ${lang}`);
        if(lang==='en'){h.scan(hh,`ps ${tab}`);
          if(/overbill|dispute/i.test(hh.replace(/<[^>]*>/g,' ')))out.push(`buyer-side wording on supplier side: ${tag} ${tab}`);
          const main=(hh.match(/<main[\s\S]*<\/main>/)||[hh])[0].replace(/<[^>]*>/g,' ');
          /* fictional suppliers may carry a landmark in their name (Colosseum Group Tickets); only REAL catalog names are guarded */
          const txt=fictNames.reduce((a,n)=>a.split(n).join(' '),main);
          if(NEG.test(txt))catNames.forEach(n=>{if(txt.includes(n))out.push(`catalog name "${n}" in ps ${tag} ${tab}`);});}
        if(hh.includes('class="side"')||!hh.includes('pv-rib'))out.push('frame '+tag+tab);
        if(specKey()!=='portal:supplier:'+tab)out.push('specKey '+tab);
        if(tab==='disp'){const s=SUPPLIERS.find(y=>y.id===id),n=psQueries(s).length,c=(hh.match(/class="card hc-card ps-disp"/g)||[]).length;
          if(n!==c)out.push(`query cards ${c} != queries ${n} for ${id}`);if(!hh.includes('ps-disp'))out.push('no ps-disp '+id);}
      }catch(e){out.push(`ps ${tag} ${id} ${tab} ${lang} threw ${e.message}`);}}));}
    S.lang='en';};
  const big=bigGap();
  if(!(psQSum(big)>0))out.push('no supplier has an open query');
  sweep([P.def,big.id],'base');
  /* after the nen inbox is read, again for the largest fictional nen supplier */
  const nen=byId('nen');applyInbox(nen);
  const nenSups=ps.map(x=>SUPPLIERS.find(y=>y.id===x.id)).map(s=>({s,a:r2(psQueries(s).filter(q=>q.t.id==='nen').reduce((a,q)=>a+q.usd,0))})).sort((a,b)=>b.a-a.a);
  if(!(nenSups[0]&&nenSups[0].a>0))out.push('nen inbox gives no fictional supplier a query');
  else sweep([nenSups[0].s.id],'nen');
  /* confirm and decline: same field writes as spSetFlow */
  const rq=ps.map(x=>SUPPLIERS.find(y=>y.id===x.id)).map(psRequests).find(r=>r.some(q=>q.flow!=='approved'));
  if(!rq)out.push('no unconfirmed request to test');
  else{const r=rq.find(q=>q.flow!=='approved');
    ['approved','contact'].forEach(fl=>{const clone={sups:[{...r.e}]};spSetFlow(clone,0,fl);
      if(!psSetFlow(r.t,r.i,fl))out.push('psSetFlow '+fl);
      if(r.e.flow!==clone.sups[0].flow||r.e.st!==clone.sups[0].st)out.push(`psSetFlow differs from spSetFlow (${fl}): ${r.e.flow}/${r.e.st} vs ${clone.sups[0].flow}/${clone.sups[0].st}`);});
    if(psSetFlow(r.t,r.i,'bogus')||psSetFlow(r.t,99,'approved'))out.push('psSetFlow accepts junk');
    psSetFlow(r.t,r.i,'approved');if(spFlow(r.e)!=='approved')out.push('confirm did not make spFlow approved');
    S.lang='en';pvOpen('supplier',SUPPLIERS.find(y=>y.name===r.l.sup).id,'req');render();
    if(!h.els.app.innerHTML.includes('Confirmed'))out.push('confirmed state not shown');}
  /* issuing a credit: identity holds, gapStats open falls by exactly that gap, status becomes Credit issued */
  const cand=[];ps.forEach(x=>psQueries(SUPPLIERS.find(y=>y.id===x.id)).forEach(q=>{if((q.l.inv.st||'open')==='open')cand.push(q);}));
  cand.sort((a,b)=>b.usd-a.usd);
  if(!cand.length)out.push('no open-state query to credit');
  else{const q=cand[0],G0=gapStats(TRIPS),sup=SUPPLIERS.find(y=>y.name===q.l.sup);
    if(!psReply(q.l)||q.l.inv.reply!==true)out.push('reply flag');
    const n=psCredit(q.t,q.l),G1=gapStats(TRIPS),c=calc(q.t);
    if(Math.abs(n-q.usd)>.005)out.push(`credit returned ${n} != gap ${q.usd}`);
    if(Math.abs(r2(G0.open-G1.open)-q.usd)>.005)out.push(`gapStats open fell by ${r2(G0.open-G1.open)}, expected ${q.usd}`);
    if(Math.abs(r2(G1.rec-G0.rec)-q.usd)>.005)out.push('recovered did not rise by the credit');
    if(Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit)>.05)out.push('identity after credit '+q.t.id);
    if(q.l.inv.st!=='credited')out.push('inv.st not credited');
    if(psInvSt(q.l).k!=='credited')out.push('status not Credit issued');
    if(psQueries(sup).some(y=>y.l===q.l))out.push('credited query still open');
    if(psCredit(q.t,q.l)!==0)out.push('credit applied twice');
    pvOpen('supplier',sup.id,'disp');render();if(!/Credits issued/.test(h.els.app.innerHTML))out.push('credits card missing after credit');
    S.lang='he';render();h.chk(h.els.app.innerHTML,'ps credited he');S.lang='en';}
  /* status mapping (A10) */
  const L0={inv:null};if(psInvSt(L0).k!=='none')out.push('status none');
  pvExit();render();
  return out;}});
