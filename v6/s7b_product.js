/* ---------- product fidelity (v7): navigation, header, home, project stages ----------
   Mirrors the live app (dev.triplanet.io, Nov 2026): nav "Projects" and "Clients" with the
   product's own navbar icons, UK flag for English, search in the header, a project page with a
   Quotation / Operation / Finance stage switch and stage tabs, the Operation dashboard cards and
   the Finance Income table with its totals footer. */
const NAVI={home:'home',quotes:'quotes',templates:'templates',hotels:'hotels',suppliers:'idcard',activities:'activities',users:'users',clients:'clients'};
NAV.forEach(n=>{if(NAVI[n[0]])n[2]=ic(NAVI[n[0]]);if(n[0]==='quotes')n[1]=['פרויקטים','Projects'];});
FLAG.en=`<svg viewBox="0 0 60 40" width="30" height="20" aria-hidden="true"><clipPath id="ukc"><rect width="60" height="40" rx="4"/></clipPath><g clip-path="url(#ukc)"><rect width="60" height="40" fill="#012169"/><path d="M0,0 60,40M60,0 0,40" stroke="#fff" stroke-width="8"/><path d="M0,0 60,40M60,0 0,40" stroke="#C8102E" stroke-width="3"/><path d="M30,0V40M0,20H60" stroke="#fff" stroke-width="12"/><path d="M30,0V40M0,20H60" stroke="#C8102E" stroke-width="7"/></g></svg>`;

/* ---------- project page: stage switch + stage tabs ---------- */
const STAGES=[
  ['q',['הצעת מחיר','Quotation'],[['general','כללי','General','document'],['plan','תוכנית טיול','Trip plan','calendar'],['costs','תמחור ומרווחים','Pricing','cash'],['quote','הצעה ללקוח','Proposal','invoice'],['approve','אישור','Approval','check']]],
  ['o',['תפעול','Operation'],[['odash','דשבורד','Dashboard','widget'],['people','חיוב ותשלומים','Billing','wallet']]],
  ['f',['כספים','Finance'],[['fdash','דשבורד','Dashboard','widget'],['income','הכנסות','Income','wallet'],['tfin','הוצאות ובקרת חשבוניות','Expenses','gaps'],['vouch','שוברים ומסמכים','Vouchers','ticket']]]];
PTABS.push(['odash',['דשבורד תפעול','Operation dashboard']],['fdash',['דשבורד כספים','Finance dashboard']],['income',['הכנסות','Income']],['vouch',['שוברים ומסמכים','Vouchers']]);
/* v8: fixed tab order per stage, so modules can register tabs in any load order */
const TAB_ORDER={q:['general','plan','costs','quote','tbver','approve'],o:['odash','optasks','spm','manifest','people'],f:['fdash','income','tfin','vouch']};
function tabInsert(stage,tab){const sg=STAGES.find(s=>s[0]===stage);if(!sg)return;
  if(!sg[2].some(x=>x[0]===tab[0]))sg[2].push(tab);
  const o=TAB_ORDER[stage]||[],ix=k=>{const i=o.indexOf(k);return i<0?99:i;};sg[2].sort((a,b)=>ix(a[0])-ix(b[0]));
  if(!PTABS.some(p=>p[0]===tab[0]))PTABS.push([tab[0],[tab[1],tab[2]]]);}
const stageOf=pt=>(STAGES.find(s=>s[2].some(x=>x[0]===pt))||STAGES[0])[0];
const tabIcon=k=>k.startsWith('N:')?nic(k.slice(2)):ic(k);
function pjStatus(t){
  const lab=t.stage==='Quote'?qn(t.qst):{Operations:L('מוכן','Ready'),Finance:L('בסגירה כספית','In close'),Closed:L('נסגר','Closed')}[t.stage]||stn(t.stage);
  const cls=t.stage==='Quote'?'q':'s-'+t.stage,open=!!S.pjMenu,mv=typeof stmMoves==='function'?stmMoves(t):[];
  const items=mv.map(m=>`<button type="button" role="menuitem" class="pj-mi${m.ok?'':' off'}" data-act="pjmove" data-v="${m.mv}" ${m.ok?'':'disabled'}><b>${L(m.he,m.en)}</b><span class="small muted">${m.ok?L(m.dhe,m.den):m.why.map(w=>L(w.he,w.en)).join('. ')}</span></button>`).join('')||`<p class="small muted pj-mn">${L('אין מעברים זמינים.','No moves available.')}</p>`;
  return `<span class="pj-stwrap"><button type="button" class="pj-status ${cls}" data-act="pjmenu" aria-haspopup="menu" aria-expanded="${open}" aria-label="${L('סטטוס הפרויקט','Project status')}: ${esc(lab)}">${lab} ${ic('down')}</button>${open?`<div class="pj-menu" role="menu" aria-label="${L('מעברי סטטוס','Status moves')}">${items}</div>`:''}</span>`;
}
vTrip=function(){
  const t=T();if(!t)return noTrip();
  if(S.ptab==='ops')S.ptab='odash'; /* v8.1: the digest tab was merged into the dashboard */
  const st=stageOf(S.ptab),SG=STAGES.find(s=>s[0]===st);
  const f=TRIP_TABS[S.ptab]||{general:pGeneral,plan:pPlan,costs:pCosts,quote:pQuote,approve:pApprove,ops:pOps,people:pPeople,tfin:pTripFin,odash:pOpsDash,fdash:pFinDash,income:pIncome,vouch:pVouch}[S.ptab]||pCosts;
  const badge=k=>{if(k!=='tfin')return '';const n=t.inbox.length?t.inbox.length:tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0).length;return n?`<span class="bdg">${n}</span>`:'';};
  return `<div class="pj-head"><button class="pj-back" data-act="go" data-v="quotes" aria-label="${L('חזרה לפרויקטים','Back to projects')}">${ic('chev','flip back')}</button><span class="pj-no">#${t.no}</span><h1 class="pj-name">${esc(t.name)}</h1>
    <div class="pj-stage" role="tablist">${STAGES.map(s=>`<button role="tab" aria-selected="${s[0]===st}" class="${s[0]===st?'on':''}" data-act="pstage" data-v="${s[0]}">${L(s[1][0],s[1][1])}</button>`).join('')}</div>${pjStatus(t)}</div>
   <div class="pj-sub">${range(t)} · ${L(`${t.nights+1} ימים, ${t.nights} לילות`,`${t.nights+1} days, ${t.nights} nights`)} · ${dn(t.dest)} · <bdi>${esc(t.client)}</bdi> · ${paxL(t.pax)}</div>
   <div class="tabs pj-tabs" role="tablist" aria-label="${L('לשוניות הפרויקט','Project tabs')}">${SG[2].map(x=>`<button role="tab" aria-selected="${S.ptab===x[0]}" class="${S.ptab===x[0]?'on':''}" data-act="pt" data-v="${x[0]}">${tabIcon(x[3])}${L(x[1],x[2])}${badge(x[0])}</button>`).join('')}</div>${f(t)}`;
};
/* Operation dashboard, as in the product: days to trip, urgent tasks, suppliers, revenue */
function ocard(cls,icon,val,label,act,sub){return `<button class="ocard ${cls}" ${act||''}><span class="oc-ic">${icon}</span><span class="oc-v">${val}</span><span class="oc-l">${label} ${act?ic('chev','flip'):''}</span>${sub?`<span class="oc-s">${sub}</span>`:''}</button>`;}
function pOpsDash(t){
  if(t.stage==='Quote')return gate(t,L('דשבורד התפעול','The operation dashboard'));
  const days=Math.max(0,Math.round((D(t.dep)-TODAY)/DAY)),soon=addDays(iso(TODAY),7);
  const urgent=t.tasks.filter(x=>!x.done&&x.due<=soon),odue=t.tasks.filter(x=>!x.done&&x.due<iso(TODAY)).length,open=t.sups.filter(s=>s.st!=='Confirmed'),c=calc(t);
  const next=t.tasks.filter(x=>!x.done).sort((a,b)=>a.due<b.due?-1:1).slice(0,6);
  return `<div class="ogrid">${ocard('dark',ic('calendar'),days===0?L('0 ימים','0 Days'):L(`${days} ימים`,`${days} Days`),t.stage==='Operations'?L('ימים ליציאה','Days to trip'):L('הטיול חזר','Trip is home'))}
    ${ocard('red',ic('bell'),urgent.length,L('לביצוע השבוע','Due this week'),'data-act="pt" data-v="optasks"',L(`${odue} באיחור`,`${odue} overdue`))}
    ${ocard('green',ic('idcard'),open.length,L('ספקים שעוד לא אישרו','Suppliers not confirmed'),'data-act="pt" data-v="spm"')}
    ${ocard('amber',ic('chart2'),usd(c.rev),L('הכנסה צפויה','Estimated revenue'),'data-act="pt" data-v="fdash"')}</div>
   <div class="card"><h3>${L('המשימות הבאות','Next tasks')}</h3>${next.length?`<div class="scroll"><table class="tbl"><thead><tr><th>${L('משימה','Task')}</th><th>${L('אחראי','Owner')}</th><th>${L('עד','Due')}</th><th>${L('סטטוס','Status')}</th></tr></thead><tbody>${next.map(x=>`<tr><td>${esc(x.t)}</td><td>${x.who==='Ops desk'?L('דסק תפעול','Ops desk'):agn(x.who)}</td><td>${fmtDate(x.due)}</td><td>${x.due<iso(TODAY)?pillF(L('באיחור','Overdue'),'red'):x.due<=soon?pillF(L('השבוע','This week'),'amber'):pillF(L('מתוכנן','Planned'),'')}</td></tr>`).join('')}</tbody></table></div>`:`<p class="muted" style="margin:0">${L('כל המשימות הושלמו.','Every task is done.')}</p>`}</div>${t.room?`<div class="card sec"><h3>${L('בלוק חדרים במלון','Hotel room block')}</h3><p class="small muted"><bdi>${esc(t.room.hotel)}</bdi>, ${fmtDate(t.dep)}</p><div class="prog"><div style="width:${t.room.held?Math.round(t.room.used/t.room.held*100):0}%"></div></div><p class="small" style="margin-top:8px">${L(`${t.room.used} מתוך ${t.room.held} חדרים נוצלו מהבלוק. ${t.room.held-t.room.used} ניתנים לשחרור עד ${fmtDate(addDays(t.dep,-30))}.`,`${t.room.used} of ${t.room.held} rooms used from the block. ${t.room.held-t.room.used} can be released by ${fmtDate(addDays(t.dep,-30))}.`)}</p></div>`:''}`;
}
/* Finance dashboard: the trip's own leak bridge */
function pFinDash(t){
  if(t.stage==='Quote')return gate(t,L('דשבורד הכספים','The finance dashboard'));
  const c=calc(t),g=groupsCalc(t),M=leakModel([t]),open=tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0);
  const nIn=(t.inbox||[]).length,nChk=L(`${nIn} חשבוניות ספקים עדיין לא נבדקו. הרווח עשוי להשתנות.`,`${nIn} supplier invoice${nIn===1?' is':'s are'} not checked yet. Profit may change.`);
  return `<div class="stats"><div class="stat"><div class="l">${L('סך הטיול','Trip total')}</div><div class="v">${usd(c.rev)}</div><div class="s">${paxL(t.pax)}</div></div>
   <div class="stat"><div class="l">${L('רווח מתוכנן','Planned profit')}</div><div class="v">${usd(c.planProfit)}</div><div class="s">${pct(c.planProfit/c.rev)}</div></div>
   <div class="stat"><div class="l">${L('רווח צפוי','Expected profit')}</div><div class="v ${c.fcProfit<c.planProfit?'neg':''}">${usd(c.fcProfit)}</div><div class="s">${pct(c.fcProfit/c.rev)}</div></div>
   <div class="stat"><div class="l">${L('יתרה לגבייה','Remaining to collect')}</div><div class="v">${usd(g.outstanding)}</div><div class="s">${usd(g.collected)} ${L('התקבלו','received')}</div></div></div>
   <div class="card"><h3>${M.leak>0?L(`${usd(M.leak)} מהרווח המתוכנן דלפו בטיול הזה`,`${usd(M.leak)} of planned profit leaked on this trip`):nIn?nChk:L('אין פערים בין החשבוניות להצעה.','No differences between invoices and the quote.')}</h3>${wfSvg(M).startsWith('<p class="muted">')?'':wfSvg(M)}
    ${nIn&&M.leak>0?`<div class="row" style="margin-top:8px"><span class="muted">${nChk}</span><button class="btn sm pri" data-act="pt" data-v="tfin">${L('בדקו חשבוניות','Check invoices')}</button></div>`:''}
    ${nIn&&!(M.leak>0)?`<div class="row" style="margin-top:8px"><button class="btn sm pri" data-act="pt" data-v="tfin">${L('בדקו חשבוניות','Check invoices')}</button></div>`:''}
    ${open.length?`<div class="row" style="margin-top:8px"><span class="muted">${L(`${open.length} פערים פתוחים בסך ${usd(open.reduce((a,x)=>a+x.usd,0))}`,`${open.length} open gaps worth ${usd(open.reduce((a,x)=>a+x.usd,0))}`)}</span>${nIn?'':`<button class="btn sm pri" data-act="pt" data-v="tfin">${L('לבקרת החשבוניות','Open expenses')}</button>`}</div>`:''}</div>`;
}
/* Income: client documents per billing group, with the product's totals footer */
function incomeDocs(t){
  const g=groupsCalc(t),docs=[];let n=90001+(t.no%50)*20,rc=70001+(t.no%50)*20;
  g.rows.forEach(r=>{
    const due=(d,amt,paid,kind)=>{if(!(amt>0))return;const issued=paid||D(d)<=new Date(TODAY.getTime()+30*DAY);if(!issued)return;
      docs.push({name:r.name,type:'deal',no:n++,date:addDays(d,-21),amt,st:paid?'paid':'req',kind});if(paid)docs.push({name:r.name,type:'receipt',no:rc++,date:d,amt,st:'paid',kind});};
    due(t.depDue,r.dep,r.depPaid,'dep');due(t.balDue,r.bal,r.balPaid,'bal');});
  return {docs,g};
}
function pIncome(t){
  if(t.stage==='Quote')return gate(t,L('ההכנסות','Income'));
  const {docs,g}=incomeDocs(t),c=calc(t),tab=S.incTab||'all',q=(S.incQ||'').toLowerCase();
  const billed=r2(docs.filter(d=>d.type==='deal').reduce((a,d)=>a+d.amt,0));
  const all=docs.filter(d=>(tab==='all'||d.type===tab)&&(!q||d.name.toLowerCase().includes(q))),rpp=S.incRpp||10,pages=Math.max(1,Math.ceil(all.length/rpp)),pg=Math.min(S.incPage||0,pages-1),rows=all.slice(pg*rpp,pg*rpp+rpp);
  const lab={deal:L('חשבונית עסקה','Deal invoice'),receipt:L('קבלה','Receipt')},cnt=k=>docs.filter(d=>k==='all'||d.type===k).length;
  const stl=d=>d.st==='paid'?pillF(L('התקבל תשלום','Payment received'),'green'):pillF(L('נשלחה דרישת תשלום','Payment requested'),'amber');
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">${L('הכנסות','Income')}</h2><button class="btn pri" data-act="toast" data-v="${L('מסמך חדש נוצר כטיוטה','A new document was drafted')}" ${canIssueDocs()?'':`disabled title="${L('התפקיד שלך לא כולל הפקת מסמכים','Your role cannot issue documents')}"`}>${ic('invoice')} ${L('הפקת מסמך','Issue document')}</button></div>
   <div class="card inc" style="padding:0;overflow:hidden"><div class="row inc-f"><input type="text" data-inc="q" value="${esc(S.incQ||'')}" placeholder="${L('חיפוש...','Search...')}" aria-label="${L('חיפוש','Search')}"><button class="btn" data-act="toast" data-v="${L('סינון לפי סוג, סטטוס ותאריך','Filter by type, status and date')}">${ic('filter')} ${L('סינון','Filters')}</button></div>
    <div class="tabs inc-t" role="tablist" aria-label="${L('סוג מסמך','Document type')}">${[['all',L('הכל','All')],['deal',L('חשבוניות עסקה','Deal invoices')],['receipt',L('קבלות','Receipts')]].map(x=>`<button role="tab" aria-selected="${tab===x[0]}" class="${tab===x[0]?'on':''}" data-act="inctab" data-v="${x[0]}">${x[1]} <span class="cnt">${cnt(x[0])}</span></button>`).join('')}</div>
    <div class="scroll"><table class="tbl"><thead><tr><th>${L('שם לקוח','Client name')}</th><th>${L('סוג מסמך','Document type')}</th><th>${L('מספר','Number')}</th><th>${L('תאריך','Date')}</th><th class="n">${L('סכום','Amount')}</th><th>${L('סטטוס','Status')}</th></tr></thead>
    <tbody>${rows.map(d=>`<tr><td><strong>${esc(d.name)}</strong></td><td>${lab[d.type]}<div class="small muted">${d.kind==='dep'?L('מקדמה','Deposit'):L('יתרה','Balance')}</div></td><td>${d.no}</td><td>${fmtDate(d.date)}</td><td class="n">${usd(d.amt,2)}</td><td>${stl(d)}</td></tr>`).join('')||`<tr><td colspan="6" class="muted">${L('אין מסמכים.','No documents.')}</td></tr>`}</tbody></table></div>
    <div class="inc-pg"><label class="small muted">${L('שורות בעמוד','Rows per page')} <select data-ch="incrpp" aria-label="${L('שורות בעמוד','Rows per page')}">${[5,10,25].map(n=>`<option value="${n}" ${rpp===n?'selected':''}>${n}</option>`).join('')}</select></label><span class="small muted" dir="ltr">${all.length?pg*rpp+1:0}–${Math.min(all.length,pg*rpp+rpp)} ${L('מתוך','of')} ${all.length}</span><button class="iconb" data-act="incpg" data-v="${pg-1}" ${pg===0?'disabled':''} aria-label="${L('הקודם','Previous')}">${ic('chev','flip back')}</button><button class="iconb" data-act="incpg" data-v="${pg+1}" ${pg>=pages-1?'disabled':''} aria-label="${L('הבא','Next')}">${ic('chev','flip')}</button></div>
    <div class="inc-sum"><div><span>${L('סך הטיול','Trip total')}</span><b>${usd(c.rev,2)}</b></div><div><span>${L('חויב','Amount billed')}</span><b>${usd(billed,2)}</b></div><div><span>${L('התקבל','Payment received')}</span><b>${usd(g.collected,2)}</b></div><div><span>${L('נותר לתשלום','Remaining to pay')}</span><b class="due">${usd(g.outstanding,2)}</b></div></div></div>`;
}
function pVouch(t){
  if(t.stage==='Quote')return gate(t,L('השוברים','Vouchers'));
  const h=pTripFin(t),k=h.lastIndexOf('<div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">');
  return k>0?h.slice(k):`<p class="muted">${L('אין מסמכים.','No documents.')}</p>`;
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  if(a==='pstage'){const SG=STAGES.find(s=>s[0]===v);if(SG){S.ptab=SG[2][0][0];S.disp=null;render();}}
  else if(a==='inctab'){S.incTab=v;S.incPage=0;render();}
  else if(a==='incpg'){S.incPage=Math.max(0,+v);render();}
});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.inc==='q'){S.incQ=el.value;S.incPage=0;const y=window.scrollY;document.getElementById('view').innerHTML=trHtml(vTrip());window.scrollTo(0,y);const n=document.querySelector('[data-inc="q"]');if(n){n.focus();const Ln=n.value.length;n.setSelectionRange(Ln,Ln);}}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&el.dataset.ch==='incrpp'){S.incRpp=+el.value;S.incPage=0;render();}});
/* phone: the product's hamburger drawer */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');
  if(b&&b.dataset.act==='drawer'){S.drawer=!S.drawer;render();return;}
  if(S.drawer&&((b&&(b.dataset.act==='go'||b.dataset.act==='open'))||e.target.classList&&e.target.classList.contains('app'))){S.drawer=false;render();}
});
