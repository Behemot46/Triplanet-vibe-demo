/* ---------- v8 module db: manager additions and the agent dashboard ----------
   Every figure comes from an existing function (calc, groupsCalc, portfolio) or a stored field (t.tasks, t.trav, t.sups, qst, qdays,
   STAFF target); no new finance math. The calculators are pure and global so check6 can recompute them.
   Definitions (docs/spec-v8-parity.md 4.8, A19):
   - booked revenue = calc(t).rev of non-Quote trips (sums to portfolio(TRIPS).rev); open quote value = calc(t).rev of Quote trips;
   - expected margin = portfolio(ts).fp / portfolio(ts).rev; target attainment = booked / STAFF target;
   - readiness: tasks done %, passports received % (international trips only, else n/a = 100), suppliers confirmed %,
     deposits collected % (by amount, groupsCalc); an empty denominator counts as 100;
   - follow-up due = quote status Sent and qdays > 7; overdue task = not done and due before TODAY. */
const DB_TODAY=()=>iso(TODAY);
const dbPct=(n,d)=>d>0?Math.max(0,Math.min(100,Math.round(n/d*100))):100;
const dbAgentTrips=(a,ts)=>(ts||TRIPS).filter(t=>t.agent===a);
const dbQst=t=>t.qst||'Draft';

/* readiness of one non-Quote trip: four percentages, each in [0,100] */
function dbReadiness(t){
  const tasks=t.tasks||[],trav=t.trav||[],sups=t.sups||[];
  const intl=!!(DESTS[t.dest]&&DESTS[t.dest].intl);
  const g=t.groups&&t.groups.length?groupsCalc(t).rows:[];
  const depAmt=g.reduce((a,r)=>a+r.dep,0),depGot=g.reduce((a,r)=>a+(r.depPaid?r.dep:0),0);
  const r={tasks:dbPct(tasks.filter(x=>x.done).length,tasks.length),
    pass:intl?dbPct(trav.filter(x=>x.pass!=='Missing').length,trav.length):100,passNA:!intl,
    sups:dbPct(sups.filter(x=>x.st==='Confirmed').length,sups.length),
    dep:dbPct(depGot,depAmt),
    nTasks:tasks.length,nOpen:tasks.filter(x=>!x.done).length};
  r.overall=Math.round((r.tasks+r.pass+r.sups+r.dep)/4);
  return r;
}
/* non-Quote trips departing within [TODAY, TODAY+days] */
const dbDepartures=(ts,days)=>{const lo=DB_TODAY(),hi=addDays(lo,days);
  return (ts||TRIPS).filter(t=>t.stage!=='Quote'&&t.dep>=lo&&t.dep<=hi).sort((a,b)=>a.dep<b.dep?-1:a.dep>b.dep?1:0);};

/* team leaderboard: one row per agent */
function dbTeam(){
  const rows=AGENTS.map(a=>{
    const ts=dbAgentTrips(a),open=ts.filter(t=>t.stage==='Quote'),won=ts.filter(t=>t.stage!=='Quote'),P=portfolio(ts);
    const tgt=(STAFF_BY[a]&&STAFF_BY[a].target)||0,booked=P.rev;
    return {agent:a,openN:open.length,openVal:r2(open.reduce((s,t)=>s+calc(t).rev,0)),files:won.length,all:ts.length,
      booked,fp:P.fp,margin:booked?P.fp/booked:0,target:tgt,att:tgt?booked/tgt:0};});
  const bookedAll=r2(rows.reduce((s,r)=>s+r.booked,0)),fpAll=r2(rows.reduce((s,r)=>s+r.fp,0));
  return {rows,booked:bookedAll,fp:fpAll,margin:bookedAll?fpAll/bookedAll:0,
    openVal:r2(rows.reduce((s,r)=>s+r.openVal,0)),openN:rows.reduce((s,r)=>s+r.openN,0),
    target:rows.reduce((s,r)=>s+r.target,0)};
}
/* quotes waiting for the manager */
const dbApprovals=ts=>(ts||TRIPS).filter(t=>t.stage==='Quote'&&dbQst(t)==='Approval').map(t=>{const c=calc(t);
  return {t,rev:c.rev,margin:c.rev?c.planProfit/c.rev:0,days:t.qdays||0};}).sort((a,b)=>b.days-a.days||b.rev-a.rev);
/* sent quotes silent for more than 7 days */
const dbFollowUps=(agent,ts)=>(ts||dbAgentTrips(agent)).filter(t=>t.agent===agent&&t.stage==='Quote'&&dbQst(t)==='Sent'&&(t.qdays||0)>7)
  .sort((a,b)=>(b.qdays||0)-(a.qdays||0));
/* open tasks due by TODAY+days (overdue included) of the given trips */
function dbTasks(ts,days){
  const lo=DB_TODAY(),hi=addDays(lo,days),out=[];
  (ts||[]).forEach(t=>{if(t.stage==='Quote')return;(t.tasks||[]).forEach(x=>{if(!x.done&&x.due<=hi)out.push({t,x,over:x.due<lo});});});
  out.sort((a,b)=>a.x.due<b.x.due?-1:a.x.due>b.x.due?1:0);
  return out;
}
/* travelers with a form not done, per non-Quote trip */
function dbFormsPending(ts){
  const rows=[];
  (ts||[]).forEach(t=>{if(t.stage==='Quote')return;const by={reg:0,med:0,waiver:0};let n=0;
    (t.trav||[]).forEach(x=>{const f=x.form;if(!f)return;let any=false;['reg','med','waiver'].forEach(k=>{if(f[k]!=='done'){by[k]++;any=true;}});if(any)n++;});
    if(n)rows.push({t,n,by,pax:(t.trav||[]).length});});
  rows.sort((a,b)=>b.n-a.n);
  return {rows,total:rows.reduce((s,r)=>s+r.n,0)};
}
/* the agent's KPIs and everything the dashboard shows */
function dbAgentKpis(agent,ts){
  ts=(ts||dbAgentTrips(agent)).filter(t=>t.agent===agent);
  const open=ts.filter(t=>t.stage==='Quote'),won=ts.filter(t=>t.stage!=='Quote'),P=portfolio(ts);
  const tgt=(STAFF_BY[agent]&&STAFF_BY[agent].target)||0,team=dbTeam();
  return {agent,openN:open.length,openVal:r2(open.reduce((s,t)=>s+calc(t).rev,0)),
    followN:dbFollowUps(agent,ts).length,depN:dbDepartures(ts,60).length,overN:dbTasks(ts,0).filter(z=>z.over).length,
    booked:P.rev,fp:P.fp,margin:P.rev?P.fp/P.rev:0,teamMargin:team.margin,target:tgt,att:tgt?P.rev/tgt:0,files:won.length};
}

/* named mutation (A6): mark a task done from the dashboard */
function dbTaskDone(tid,id){
  const t=byId(tid),x=t&&(t.tasks||[]).find(z=>z.id===+id);if(!x||x.done)return false;
  x.done=true;try{toast(L('המשימה סומנה כבוצעה','Task marked done'));}catch(e){}
  render();return true;
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act="db-done"]');if(!b)return;
  const p=String(b.dataset.v).split(':');dbTaskDone(p[0],p[1]);
});

/* ---------- rendering ---------- */
const dbCls=v=>v>=80?'ok':v>=50?'mid':'low';
const dbWho=a=>`<span class="row db-who">${avatarOf(agn(a),'sm')}${esc(agn(a))}</span>`;
const dbDays=n=>n===0?L('היום','today'):L(`${n} ימים`,`${n} ${n===1?'day':'days'}`);
function dbMini(v,na){return `<div class="db-m ${na?'na':dbCls(v)}"><b><bdi>${na?L('לא נדרש','n/a'):v+'%'}</bdi></b><i><u style="width:${na?0:v}%"></u></i></div>`;}

function dbReadyRows(ts,days){
  const dep=dbDepartures(ts,days);
  const rows=dep.map(t=>{const r=dbReadiness(t),dd=Math.round((D(t.dep)-TODAY)/DAY);
    return `<tr class="da-row" data-act="open" data-v="${t.id}" data-pt="ops"><td><strong>${esc(t.name)}</strong><div class="small muted">${esc(t.client)} · ${agn(t.agent)}</div></td>
     <td>${fmtDate(t.dep)}<div class="small muted">${L(`בעוד ${dd} ימים`,`in ${dd} days`)}</div></td>
     <td>${dbMini(r.tasks)}<div class="small muted">${L(`${r.nOpen} פתוחות`,`${r.nOpen} open`)}</div></td><td>${dbMini(r.pass,r.passNA)}</td><td>${dbMini(r.sups)}</td><td>${dbMini(r.dep)}</td>
     <td class="n"><span class="db-ov ${dbCls(r.overall)}"><bdi>${r.overall}%</bdi></span></td></tr>`;}).join('');
  return {n:dep.length,html:`<div class="scroll"><table class="tbl da-tbl db-rt"><thead><tr><th>${L('טיול','Trip')}</th><th>${L('יציאה','Departs')}</th><th>${L('משימות','Tasks done')}</th><th>${L('דרכונים','Passports')}</th><th>${L('ספקים מאושרים','Suppliers confirmed')}</th><th>${L('מקדמות שנגבו','Deposits collected')}</th><th class="n">${L('מוכנות','Ready')}</th></tr></thead>
   <tbody>${rows||`<tr><td colspan="7" class="muted">${L('אין יציאות בתקופה.','No departures in this period.')}</td></tr>`}</tbody></table></div>`};
}

function dbApprovalsCard(){
  const a=dbApprovals(TRIPS),tot=r2(a.reduce((s,x)=>s+x.rev,0));
  const rows=a.map(x=>`<div class="da-li db-ap"><div><strong>${esc(x.t.name)}</strong><div class="small muted">${esc(x.t.client)} · ${agn(x.t.agent)} · ${L(`ממתינה ${dbDays(x.days)}`,`waiting ${dbDays(x.days)}`)} · ${L('רווח מתוכנן','planned margin')} <bdi>${pct(x.margin)}</bdi></div></div>
    <span class="da-amt">${usd(x.rev)}</span><button class="btn sm pri" data-act="open" data-v="${x.t.id}" data-pt="approve">${L('אשר','Approve')}</button></div>`).join('');
  return `<div class="card da-card db-card"><div class="da-h"><h3>${L('הצעות הממתינות לאישור','Approvals waiting')}</h3><span class="da-sum">${usd(tot)}</span></div>
   ${rows||`<p class="muted">${L('אין הצעות הממתינות לאישור.','No quotes are waiting for approval.')}</p>`}</div>`;
}
function dbTeamCard(){
  const T=dbTeam();
  const body=T.rows.map(r=>`<tr class="da-row" data-act="go" data-v="quotes"><td>${dbWho(r.agent)}</td><td class="n">${usd(r.openVal)}<div class="small muted">${r.openN} ${L(r.openN===1?'הצעה':'הצעות',r.openN===1?'quote':'quotes')}</div></td><td class="n">${usd(r.booked)}</td><td class="n"><bdi>${pct(r.margin)}</bdi></td><td class="n">${r.files}</td>
    <td class="db-att"><div class="db-bar"><i style="width:${Math.min(100,r.att*100).toFixed(0)}%" class="${r.att>=1?'ok':r.att>=.6?'mid':'low'}"></i></div><span class="small"><bdi>${Math.round(r.att*100)}%</bdi> ${L('מהיעד','of target')}</span></td></tr>`).join('');
  return `<div class="card da-card db-card"><div class="da-h"><h3>${L('לוח הצוות','Team leaderboard')}</h3><span class="da-sum">${usd(T.booked)}</span></div>
   <div class="scroll"><table class="tbl da-tbl"><thead><tr><th>${L('סוכן','Agent')}</th><th class="n">${L('הצעות פתוחות','Open quotes')}</th><th class="n">${L('הכנסות שהוזמנו','Booked revenue')}</th><th class="n">${L('רווח צפוי','Expected margin')}</th><th class="n">${L('תיקים','Files')}</th><th>${L('עמידה ביעד','Target attainment')}</th></tr></thead><tbody>${body}</tbody>
   <tfoot><tr><th>${L('סך הכל','Total')}</th><th class="n">${usd(T.openVal)}</th><th class="n">${usd(T.booked)}</th><th class="n"><bdi>${pct(T.margin)}</bdi></th><th class="n">${T.rows.reduce((s,r)=>s+r.files,0)}</th><th><bdi>${T.target?Math.round(T.booked/T.target*100):0}%</bdi> ${L('מהיעד','of target')}</th></tr></tfoot></table></div></div>`;
}
function dbMgrCards(){
  if(!visibleTrips().length)return '';
  const r=dbReadyRows(TRIPS,30);
  return `${dbApprovalsCard()}${dbTeamCard()}
  <div class="card da-card db-card"><div class="da-h"><h3>${L('יציאות ב-30 הימים הקרובים: מוכנות','Departures, next 30 days: readiness')}</h3><span class="da-sum">${r.n}</span></div>${r.html}</div>`;
}

function dbHero(K,ts){
  const first=String(userName()).split(' ')[0],day=TODAY.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const open=ts.filter(t=>t.stage==='Quote'),cols=['Draft','Approval','Sent','Negotiating'],cc=['#68CDF9','#C684FF','#FFC145','#5BE49B'];
  const seg=cols.map((k,i)=>{const x=open.filter(t=>dbQst(t)===k);return [r2(x.reduce((s,t)=>s+calc(t).rev,0)),cc[i],qn(k),x.length];});
  const tot=Math.max(1,seg.reduce((s,x)=>s+x[0],0));
  const nx=dbDepartures(ts,400)[0],dd=nx?Math.round((D(nx.dep)-TODAY)/DAY):0;
  const tile=(c,i,lab,val,sub,act,v,pt)=>`<button class="hp-st da-t" data-act="${act}" data-v="${v}"${pt?` data-pt="${pt}"`:''} style="--c:${c};--d:${i*70}ms"><span class="hp-k"><i></i>${lab}</span><b>${val}</b><small>${sub}</small></button>`;
  const od=dbTasks(ts,0).filter(z=>z.over)[0];
  const tiles=[tile('#68CDF9',0,L('הצעות פתוחות','Open quotes'),K.openN,usd(K.openVal),'go','quotes'),
    tile('#FFC145',1,L('מעקבים לביצוע','Follow-ups due'),K.followN,L('נשלחו לפני יותר משבוע','sent over a week ago'),'go','quotes'),
    tile('#5BE49B',2,L('יציאות ב-60 יום','Departures, 60 days'),K.depN,L('תיקים בתפעול','files in operations'),'go','quotes'),
    tile('#FF8F00',3,L('משימות באיחור','Overdue tasks'),K.overN,K.overN?L('דורשות טיפול','need attention'):L('הכול בזמן','all on time'),od?'open':'go',od?od.t.id:'quotes',od?'ops':'')].join('');
  return `<section class="hp db-hero${typeof hpAnim==='function'&&hpAnim()?' anim':''}" aria-label="${L('תמונת מצב','Overview')}">
   <div class="hp-top"><div class="hp-hi"><span class="hp-eye">${day}</span><h1>${L('שלום','Hello')}, ${esc(first)}</h1>
     <p>${L(`${ts.length} תיקים והצעות שלך`,`${ts.length} of your files and quotes`)}${nx?` · ${L(`היציאה הבאה בעוד ${dd} ימים`,`next departure in ${dd} days`)}: <a href="#" data-act="open" data-v="${nx.id}" data-pt="ops">${esc(nx.name)}</a>`:''}</p></div>
    <div class="hp-kpi"><div><span>${L('הכנסות שהוזמנו','Booked revenue')}</span><b>${usd(K.booked)}</b></div><div><span>${L('רווח צפוי','Expected profit')}</span><b>${usd(K.fp)}</b><em>${K.booked?pct(K.margin):''}</em></div><div><span>${L('בהצעות פתוחות','In open quotes')}</span><b>${usd(K.openVal)}</b></div></div></div>
   <div class="hp-bar" role="img" aria-label="${seg.map(x=>x[2]+' '+usd(x[0])).join(', ')}">${seg.map(x=>`<i style="--w:${(x[0]/tot*100).toFixed(2)}%;--c:${x[1]}" title="${x[2]}: ${usd(x[0])}"></i>`).join('')}</div>
   <div class="da-leg">${seg.map(x=>`<span><i style="background:${x[1]}"></i>${x[2]} <b>${x[3]}</b> · ${usd(x[0])}</span>`).join('')}</div>
   <div class="hp-grid da-grid">${tiles}</div></section>`;
}

function dbPipelineCard(ts){
  const cols=['Draft','Approval','Sent','Negotiating'],open=ts.filter(t=>t.stage==='Quote');
  const col=k=>{const x=open.filter(t=>dbQst(t)===k).sort((a,b)=>(b.qdays||0)-(a.qdays||0));
    return `<div class="db-col"><div class="db-ch"><span class="pill ${QST[k][2]}">${qn(k)}</span><b>${x.length}</b></div>
     ${x.map(t=>{const c=calc(t),late=k==='Sent'&&(t.qdays||0)>7;
       return `<button class="db-q${late?' late':''}" data-act="open" data-v="${t.id}" data-pt="${k==='Approval'?'approve':'costs'}"><strong>${esc(t.name)}</strong><span class="small muted">${esc(t.client)}</span><span class="db-qf"><b>${usd(c.rev)}</b><em>${L(`${dbDays(t.qdays||0)} בסטטוס`,`${dbDays(t.qdays||0)} in status`)}${late?' · '+L('לעקוב','follow up'):''}</em></span></button>`;}).join('')||`<p class="small muted db-empty">${L('ריק','Empty')}</p>`}</div>`;};
  return `<div class="card da-card db-card"><div class="da-h"><h3>${L('צנרת ההצעות שלי','My pipeline')}</h3><span class="da-sum">${open.length}</span></div><div class="db-kan">${cols.map(col).join('')}</div></div>`;
}
function dbWeekCard(ts){
  const list=dbTasks(ts,7),CAP=8,over=list.filter(z=>z.over).length;
  const rows=list.slice(0,CAP).map(z=>`<div class="da-li"><div><strong>${esc(z.x.t)}</strong><div class="small muted"><a href="#" data-act="open" data-v="${z.t.id}" data-pt="ops">${esc(z.t.name)}</a> · ${z.over?`<span class="db-red">${L('באיחור','Overdue')}</span> · `:''}${fmtDate(z.x.due)}</div></div>
    <button class="btn sm" data-act="db-done" data-v="${z.t.id}:${z.x.id}" aria-label="${L('סמן כבוצע','Mark done')}: ${esc(z.x.t)}">${ic('check')} ${L('בוצע','Done')}</button></div>`).join('');
  return `<div class="card da-card db-card"><div class="da-h"><h3>${L('השבוע שלי','My week')}</h3><span class="da-sum">${list.length}</span></div>
   <p class="small muted da-note">${L(`משימות לשבוע הקרוב, כולל ${over} באיחור.`,`Tasks due in the next 7 days, including ${over} overdue.`)}</p>
   ${rows||`<p class="muted">${L('אין משימות פתוחות לשבוע הקרוב.','No open tasks this week.')}</p>`}
   ${list.length>CAP?`<div class="da-more"><span class="muted small">${L(`ועוד ${list.length-CAP}`,`and ${list.length-CAP} more`)}</span><button class="btn sm" data-act="go" data-v="quotes">${L('לכל התיקים','All files')}</button></div>`:''}</div>`;
}
function dbNumbersCard(K){
  const att=K.att;
  return `<div class="card da-card db-card"><div class="da-h"><h3>${L('המספרים שלי','My numbers')}</h3><span class="da-sum"><bdi>${Math.round(att*100)}%</bdi></span></div>
   <p class="small muted da-note">${L('הכנסות שהוזמנו מול היעד השנתי.','Booked revenue against the annual target.')}</p>
   <div class="db-bar big"><i style="width:${Math.min(100,att*100).toFixed(0)}%" class="${att>=1?'ok':att>=.6?'mid':'low'}"></i></div>
   <div class="db-nums"><div><span>${L('הוזמן','Booked')}</span><b>${usd(K.booked)}</b></div><div><span>${L('יעד','Target')}</span><b>${K.target?usd(K.target):'-'}</b></div><div><span>${L('נותר ליעד','To go')}</span><b>${K.target?usd(Math.max(0,K.target-K.booked)):'-'}</b></div></div>
   <div class="da-li"><div><strong>${L('רווח צפוי','Expected margin')}</strong><div class="small muted">${L('ממוצע הצוות','Team average')} <bdi>${pct(K.teamMargin)}</bdi></div></div>
    <span class="db-chip ${K.margin>=K.teamMargin?'good':'bad'}">${ic(K.margin>=K.teamMargin?'arrup':'arrdown')}<bdi>${K.booked?pct(K.margin):'-'}</bdi></span></div></div>`;
}
function dbFormsCard(ts){
  const F=dbFormsPending(ts),CAP=6;
  return `<div class="card da-card db-card"><div class="da-h"><h3>${L('טפסים ממתינים','Forms pending')}</h3><span class="da-sum">${F.total}</span></div>
   <p class="small muted da-note">${L('נוסעים שטרם השלימו טופס רישום, רפואי או הצהרה.','Travelers who have not finished a registration, medical or waiver form.')}</p>
   ${F.rows.slice(0,CAP).map(r=>`<button class="da-li da-btn" data-act="open" data-v="${r.t.id}" data-pt="people"><div><strong>${esc(r.t.name)}</strong><div class="small muted">${L(`${r.n} מתוך ${r.pax} נוסעים`,`${r.n} of ${r.pax} travelers`)} · ${L('רישום','Registration')} ${r.by.reg} · ${L('רפואי','Medical')} ${r.by.med} · ${L('הצהרה','Waiver')} ${r.by.waiver}</div></div><span class="da-go">${ic('chev','flip')}</span></button>`).join('')||`<p class="muted">${L('כל הטפסים הושלמו.','All forms are complete.')}</p>`}
   ${F.rows.length>CAP?`<div class="da-more"><span class="muted small">${L(`ועוד ${F.rows.length-CAP} טיולים`,`and ${F.rows.length-CAP} more trips`)}</span><span></span></div>`:''}</div>`;
}

function dbAgent(){
  const ts=visibleTrips();if(!ts.length)return noTrip();
  const K=dbAgentKpis(S.role,ts),r=dbReadyRows(ts,60);
  return `${dbHero(K,ts)}
  ${dbPipelineCard(ts)}
  <div class="card da-card db-card"><div class="da-h"><h3>${L('היציאות שלי: מוכנות','My departures: readiness')}</h3><span class="da-sum">${r.n}</span></div>${r.html}</div>
  <div class="two db-two">${dbWeekCard(ts)}${dbNumbersCard(K)}</div>
  ${dbFormsCard(ts)}`;
}
{const h0=VIEWS.home;VIEWS.home=function(){return isAgent()?dbAgent():isMgr()?h0.apply(this,arguments)+dbMgrCards():h0.apply(this,arguments);};}

/* ---------- tests ---------- */
TESTS.push({name:'db manager and agent dashboards',run:h=>{const out=[];
  const role0=S.role,lang0=S.lang,sum=a=>r2(a.reduce((s,x)=>s+x,0));
  /* leaderboard ties to the portfolio */
  {const T=dbTeam(),P=portfolio(TRIPS);
    if(Math.abs(T.booked-P.rev)>.02)out.push(`leaderboard booked ${T.booked} vs portfolio ${P.rev}`);
    if(Math.abs(T.fp-P.fp)>.05)out.push(`leaderboard fp ${T.fp} vs ${P.fp}`);
    if(T.rows.length!==AGENTS.length)out.push('leaderboard rows');
    let n=0,v=0;TRIPS.forEach(t=>{if(t.stage==='Quote'){n++;v+=calc(t).rev;}});
    if(T.openN!==n||Math.abs(T.openVal-r2(v))>.05)out.push(`open quotes ${T.openN}/${T.openVal} vs ${n}/${r2(v)}`);
    T.rows.forEach(r=>{if(!isFinite(r.att)||!isFinite(r.margin))out.push('non-finite team row '+r.agent);});}
  /* agent KPIs count only that agent's trips (every agent) */
  AGENTS.forEach(a=>{const K=dbAgentKpis(a),mine=TRIPS.filter(t=>t.agent===a),lo=iso(TODAY);
    const q=mine.filter(t=>t.stage==='Quote'),exp={n:q.length,v:r2(q.reduce((s,t)=>s+calc(t).rev,0)),
      f:q.filter(t=>t.qst==='Sent'&&t.qdays>7).length,
      d:mine.filter(t=>t.stage!=='Quote'&&t.dep>=lo&&t.dep<=addDays(lo,60)).length,
      o:mine.reduce((s,t)=>s+(t.stage==='Quote'?0:t.tasks.filter(x=>!x.done&&x.due<lo).length),0),
      b:r2(mine.filter(t=>t.stage!=='Quote').reduce((s,t)=>s+calc(t).rev,0))};
    if(K.openN!==exp.n||Math.abs(K.openVal-exp.v)>.05)out.push(`agent ${a} open ${K.openN}/${K.openVal} vs ${exp.n}/${exp.v}`);
    if(K.followN!==exp.f||K.depN!==exp.d||K.overN!==exp.o)out.push(`agent ${a} counts ${K.followN}/${K.depN}/${K.overN} vs ${exp.f}/${exp.d}/${exp.o}`);
    if(Math.abs(K.booked-exp.b)>.05)out.push(`agent ${a} booked ${K.booked} vs ${exp.b}`);
    if(dbFollowUps(a).some(t=>t.agent!==a))out.push('follow-ups include another agent');});
  if(AGENTS.reduce((s,a)=>s+dbAgentKpis(a).openN,0)!==TRIPS.filter(t=>t.stage==='Quote').length)out.push('agent open quotes do not add up');
  /* readiness: finite and in [0,100] for every non-Quote trip, with any number of tasks */
  TRIPS.forEach(t=>{if(t.stage==='Quote')return;const r=dbReadiness(t);
    ['tasks','pass','sups','dep','overall'].forEach(k=>{if(!isFinite(r[k])||r[k]<0||r[k]>100)out.push(`readiness ${t.id}.${k}=${r[k]}`);});});
  {const t=TRIPS.find(x=>x.stage==='Operations');if(t){const keep=t.tasks;t.tasks=keep.concat(Array.from({length:40},(_,i)=>({id:101+i,t:'Extra task '+i,who:t.agent,due:t.dep,done:i%2===0})));
    const r=dbReadiness(t);if(!isFinite(r.tasks)||r.tasks<0||r.tasks>100)out.push('readiness with many tasks');t.tasks=keep;}}
  /* task done mutation */
  {const z=dbTasks(TRIPS,400)[0];if(z){if(!dbTaskDone(z.t.id,z.x.id)||!z.x.done)out.push('dbTaskDone failed');z.x.done=false;}}
  /* every dashboard renders in both languages for manager, accountant and every agent */
  for(const lang of ['en','he']){S.lang=lang;
    ['manager','accountant',...AGENTS].forEach(role=>{S.role=role;const html=VIEWS.home();h.chk(html,`db ${role} ${lang}`);if(lang==='en')h.scan(html,`db ${role}`);
      if(role==='manager'){if(!html.includes('ptiles'))out.push('manager home lost ptiles');if(!html.includes('db-card'))out.push('manager home lacks db cards');}
      else if(role==='accountant'){if(!html.includes('da-hero')||html.includes('db-hero'))out.push('accountant home changed');}
      else if(!html.includes('db-hero')||!html.includes('db-kan'))out.push('agent home lacks dashboard '+role);});}
  S.role=role0;S.lang=lang0;
  return out;}});
