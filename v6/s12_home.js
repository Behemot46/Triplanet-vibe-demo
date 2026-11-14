/* ---------- v8.2 Home: the agency command center (owner / manager) ----------
   One screen that tells the whole story in the order an owner thinks:
   1. Hero: how the season stands, how much planned profit is kept, and the one money action (recover open gaps).
   2. Today: the next steps across all files (nextSteps), urgent first, one button each.
   3. Departures: the next trips as photo cards with a readiness ring.
   4. Profit protection: planned -> lost -> expected, recovered vs still open, money at risk.
   5. Pipeline: Quotation -> Operation -> Finance -> Closed, counts and value, each drills to Projects.
   6. Cash: money in and out over the next six months.
   7. Team: booked vs target and margin per agent.
   8. Trip studio: build a priced, mapped trip in seconds.
   Every figure comes from the existing finance functions (portfolio, gapStats, leakModel, groupsCalc, dbTeam,
   dbReadiness, nextSteps). The hero keeps class `ptiles` for the guided tour. */

const HC_STAGES=[['Quote','quotes',['הצעת מחיר','Quotation'],'var(--blue)'],['Operations','files',['תפעול','Operation'],'var(--amber)'],
  ['Finance','files',['כספים','Finance'],'var(--purple)'],['Closed','archive',['נסגרו','Closed'],'var(--green)']];
const hcDays=d=>Math.round((D(d)-TODAY)/DAY);
const hcIn=n=>n<=0?L('היום','today'):n===1?L('מחר','tomorrow'):L(`בעוד ${n} ימים`,`in ${n} days`);
const hcRing=(p,sz,cls)=>{const r=(sz-8)/2,c=2*Math.PI*r,v=Math.max(0,Math.min(100,p));
  return `<svg class="hc-ring ${cls||''}" viewBox="0 0 ${sz} ${sz}" width="${sz}" height="${sz}" aria-hidden="true"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" class="tr"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" class="br" stroke-dasharray="${(c*v/100).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${sz/2} ${sz/2})"/></svg>`;};

/* pure calculations, used by the view and the tests */
function hcModel(){
  const ts=visibleTrips(),P=portfolio(ts),G=gapStats(ts),M=leakModel(ts);
  const steps=typeof nxAgentSteps==='function'?nxAgentSteps(ts,6):[];
  const allSteps=typeof nextSteps==='function'?ts.reduce((a,t)=>a.concat(nextSteps(t)),[]):[];
  const urgent=allSteps.filter(s=>s.sev==='urgent').length;
  const stage=HC_STAGES.map(([st,tab,lab,col])=>{const xs=ts.filter(t=>st==='Quote'?isOpenQ(t):t.stage===st);
    return {st,tab,lab,col,n:xs.length,val:r2(xs.reduce((a,t)=>a+calc(t).rev,0))};});
  const dep=ts.filter(t=>t.dep>=iso(TODAY)&&!(t.stage==='Quote'&&t.qst==='Lost')).sort((a,b)=>a.dep<b.dep?-1:a.dep>b.dep?1:0).slice(0,8);
  const kept=P.pp>0?Math.round(P.fp/P.pp*1000)/10:100;
  const months=MONTHS.slice(0,6).map(k=>({k,in:r2((P.cash[k]||{}).in||0),out:r2((P.cash[k]||{}).out||0)}));
  const team=typeof dbTeam==='function'?dbTeam().rows:[];
  return {ts,P,G,M,steps,urgent,stage,dep,kept,months,team};
}

/* one hero for every role: brief, two buttons, a gauge and four KPI tiles */
function hcShell(o){
  const an=hpAnim(),first=String(userName()).split(' ')[0];
  const day=TODAY.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long'});
  const kp=(k,i)=>{const tag=k.act?'button':'div',at=k.act?` data-act="${k.act}" data-v="${k.v}"${k.pt?` data-pt="${k.pt}"`:''}${k.on!=null?` aria-pressed="${!!k.on}"`:''}`:'';
    const val=k.money?`<b data-count="${Math.round(k.val)}">${usd(k.val)}</b>`:k.text?`<b class="hc-nn"><bdi>${esc(k.text)}</bdi></b>`:`<b>${k.val}</b>`;
    return `<${tag} class="hc-kpi ${k.cls||''}${k.on?' on':''}" style="--d:${60+i*80}ms"${at}><span>${k.lab}</span>${val}<small>${k.sub||''}</small></${tag}>`;};
  const g=o.gauge;
  return `<section class="${o.cls||''} hc-hero${an?' anim':''}" aria-label="${o.aria||L('תמונת מצב','Overview')}">
   <svg class="hc-bg" viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><radialGradient id="hcg1" cx="85%" cy="10%" r="60%"><stop offset="0" stop-color="#5DFCE0" stop-opacity=".22"/><stop offset="1" stop-color="#5DFCE0" stop-opacity="0"/></radialGradient></defs>
    <rect width="1200" height="420" fill="url(#hcg1)"/>
    <path class="hc-arc a1" d="M80 360 C 330 120, 620 110, 860 250"/><path class="hc-arc a2" d="M300 400 C 520 230, 840 170, 1150 120"/><path class="hc-arc a3" d="M640 420 C 760 300, 930 270, 1110 300"/>
    <circle class="hc-pin" cx="860" cy="250" r="5"/><circle class="hc-pin" cx="1150" cy="120" r="5"/><circle class="hc-pin" cx="1110" cy="300" r="5"/><circle class="hc-pin p0" cx="80" cy="360" r="5"/>
   </svg>
   <div class="hc-hl">
    <div class="hc-hi"><span class="hc-eye">${day}${o.role?` · ${o.role}`:''}</span><h1>${L('בוקר טוב','Good morning')}, ${esc(first)}</h1><p>${o.brief}</p>
     ${o.ctas&&o.ctas.length?`<div class="hc-cta">${o.ctas.join('')}</div>`:''}</div>
    <div class="hc-gauge" role="img" aria-label="${g.pct}% ${esc(g.label)}">${hcRing(g.pct,148,'big')}<div class="hc-gv"><b>${g.pct}%</b><span>${g.label}</span></div>
     <div class="hc-gl">${g.lines.map(x=>`<span class="${x.cls}">${ic(x.icon)} ${x.lab} <b>${x.val}</b></span>`).join('')}</div></div>
   </div>
   <div class="hc-kpis">${o.kpis.map(kp).join('')}</div></section>`;
}
const hcCta=(cls,icon,label,attrs)=>`<button class="hc-btn ${cls}" ${attrs}>${ic(icon)} ${label}</button>`;

function hcHero(m){
  const {P,M}=m,nx=m.dep[0],margin=P.rev?P.fp/P.rev:0,files=m.ts.filter(t=>t.stage!=='Quote').length;
  return hcShell({cls:'ptiles',
    brief:L(`העונה נסגרו ${usd(P.rev)} ב-${files} תיקים, ברווח צפוי של ${pct(margin)}. עוד ${usd(M.rec)} אפשר להחזיר מחשבוניות ספקים${m.urgent?`, ו-${m.urgent} דברים דחופים מחכים לך היום`:''}.`,
      `This season you booked ${usd(P.rev)} across ${files} files at ${pct(margin)} expected margin. ${usd(M.rec)} is still recoverable from supplier invoices${m.urgent?`, and ${m.urgent} urgent ${m.urgent===1?'item needs':'items need'} you today`:''}.`),
    ctas:[hcCta('mint','cash',L(`להחזיר ${usd(M.rec)}`,`Recover ${usd(M.rec)}`),'data-act="go" data-v="gaps"'),hcCta('ghost','magic',L('לבנות טיול','Build a trip'),'data-act="go" data-v="studio"')],
    gauge:{pct:m.kept,label:L('מהרווח המתוכנן נשמר','of planned profit kept'),lines:[{cls:'ok',icon:'check',lab:L('הוחזרו','Recovered'),val:usd(M.got)},{cls:'op',icon:'hourglass',lab:L('פתוח','Still open'),val:usd(M.rec)}]},
    kpis:[{lab:L('הכנסות שנסגרו','Booked revenue'),val:P.rev,money:1,sub:L(`${P.pax} נוסעים`,`${P.pax} travelers`)},
      {lab:L('רווח צפוי','Expected profit'),val:P.fp,money:1,cls:'pf',sub:L(`${pct(margin)} מרווח · ${usd(r2(P.pp-P.fp))} מתחת לתכנון`,`${pct(margin)} margin · ${usd(r2(P.pp-P.fp))} below plan`)},
      {lab:L('בהצעות פתוחות','Open quotes'),val:P.pipeline,money:1,sub:L(`${P.pipelineN} הצעות`,`${P.pipelineN} ${P.pipelineN===1?'quote':'quotes'}`)},
      ...(nx?[{lab:L('היציאה הבאה','Next departure'),text:nx.name,cls:'hc-next',act:'open',v:nx.id,pt:nx.stage==='Quote'?'general':'odash',sub:`${hcIn(hcDays(nx.dep))} · ${fmtDate(nx.dep)}`}]:[])]});
}

function hcToday(m,o){
  o=o||{};const r=m.steps;
  const btn=(x,i)=>`<button class="btn sm${i?'':' pri'}" ${x.s.act.a==='advance'?`data-act="advance" data-v="${x.t.id}"`:`data-act="open" data-v="${x.t.id}" data-pt="${x.s.act.v}"`}>${L(x.s.label[0],x.s.label[1])}</button>`;
  return `<div class="card hc-card hc-today ${o.cls||''}"><div class="hc-h"><h3>${o.title||L('היום','Today')}</h3>${m.urgent?`<span class="hc-pill red">${L(`${m.urgent} דחופים`,`${m.urgent} urgent`)}</span>`:`<span class="hc-pill green">${L('הכל בשליטה','All clear')}</span>`}</div>
   ${r.length?`<ol class="hc-steps">${r.map((x,i)=>`<li class="${x.s.sev}" style="--d:${i*60}ms"><span class="hc-dot"></span><div><b>${L(x.s.he,x.s.en)}</b><button class="hc-trip" data-act="open" data-v="${x.t.id}" data-pt="${x.s.act.a==='advance'?'fdash':x.s.act.v}"><bdi>${esc(x.t.name)}</bdi> · ${avatarOf(agn(x.t.agent),'xs')}${esc(String(agn(x.t.agent)).split(' ')[0])}</button></div>${btn(x,i)}</li>`).join('')}</ol>`
     :`<p class="muted">${L('אין צעדים פתוחים. כל התיקים מעודכנים.','No open steps. Every file is up to date.')}</p>`}
   <button class="hc-more" data-act="go" data-v="quotes">${L('לכל הפרויקטים','All projects')} ${ic('chev','flip')}</button></div>`;
}

function hcDepartures(m){
  if(!m.dep.length)return '';
  const card=(t,i)=>{const dd=hcDays(t.dep),rd=t.stage==='Operations'&&typeof dbReadiness==='function'?dbReadiness(t).overall:null;
    const bg=phBg(phSrc('dest',t.dest),'background:linear-gradient(135deg,var(--hero1),var(--hero2))');
    const pt=t.stage==='Quote'?'general':'odash';
    return `<button class="hc-dep" style="--d:${i*70}ms" data-act="open" data-v="${t.id}" data-pt="${pt}">
     <span class="hc-ph" style="${bg}"><span class="hc-when ${dd<=30?'soon':''}">${hcIn(dd)}</span>${rd!=null?`<span class="hc-rd" title="${L('מוכנות','Readiness')}">${hcRing(rd,44,'sm')}<b>${rd}%</b></span>`:`<span class="hc-stq">${t.stage==='Quote'?L('הצעה','Quote'):stn(t.stage)}</span>`}</span>
     <span class="hc-dt"><b><bdi>${esc(t.name)}</bdi></b><span>${fmtDate(t.dep)} · ${dn(t.dest)}</span><span class="hc-who">${avatarOf(agn(t.agent),'xs')}${esc(String(agn(t.agent)).split(' ')[0])} · ${paxL(t.pax)}</span></span></button>`;};
  return `<div class="card hc-card hc-deps"><div class="hc-h"><h3>${L('היציאות הקרובות','Coming up')}</h3><span class="muted small">${L('הטבעת מראה כמה התיק מוכן: משימות, דרכונים, ספקים ומקדמות','The ring shows how ready a file is: tasks, passports, suppliers and deposits')}</span></div>
   <div class="hc-rail" role="list">${m.dep.map(card).join('')}</div></div>`;
}

function hcProfit(m){
  const {P,M}=m,max=Math.max(P.pp,1),w=v=>Math.max(1.5,v/max*100).toFixed(2)+'%',lost=r2(P.pp-P.fp);
  const row=(lab,v,cls,sub)=>`<div class="hc-br ${cls}"><span class="l">${lab}</span><span class="t"><i style="width:${w(Math.abs(v))}"></i></span><b>${cls==='loss'?'−':''}${usd(Math.abs(v))}</b>${sub?`<small>${sub}</small>`:''}</div>`;
  return `<div class="card hc-card hc-profit"><div class="hc-h"><h3>${L('הגנה על הרווח','Profit protection')} ${NEWP()}</h3></div>
   <p class="hc-lead">${L(`מתוך ${usd(P.pp)} רווח מתוכנן, ${usd(lost)} נעלמו בפערי חשבוניות ושער. טריפלאנט כבר החזירה ${usd(M.got)}.`,`Of ${usd(P.pp)} planned profit, ${usd(lost)} slipped through invoice gaps and exchange rates. Triplanet has already recovered ${usd(M.got)}.`)}</p>
   ${row(L('רווח מתוכנן','Planned profit'),P.pp,'plan')}
   ${row(L('דלף','Leaked'),lost,'loss',L('פערי ספקים ושער','supplier gaps and FX'))}
   ${row(L('רווח צפוי','Expected profit'),P.fp,'exp')}
   <div class="hc-split"><button class="hc-mini ok" data-act="go" data-v="gaps"><span>${L('הוחזרו','Recovered')}</span><b>${usd(M.got)}</b><small>${L(`${M.gotN} זיכויים`,`${M.gotN} credits`)}</small></button>
    <button class="hc-mini op" data-act="go" data-v="gaps"><span>${L('עוד פתוח','Still open')}</span><b>${usd(M.rec)}</b><small>${L(`${M.recN} פערים`,`${M.recN} ${M.recN===1?'gap':'gaps'}`)}</small></button>
    <button class="hc-mini rk" data-act="go" data-v="leaks"><span>${L('בסיכון','At risk')}</span><b>${usd(r2(M.late+M.release))}</b><small>${L('תשלומים באיחור וחדרים לשחרור','late payments, unreleased rooms')}</small></button></div>
   <button class="hc-more" data-act="go" data-v="leaks">${L('לדליפות הרווח','Open profit leaks')} ${ic('chev','flip')}</button></div>`;
}

function hcPipeline(m){
  const tot=Math.max(1,m.stage.reduce((a,s)=>a+s.val,0));
  return `<div class="card hc-card hc-pipe"><div class="hc-h"><h3>${L('מהצעה לסגירה','From quote to close')}</h3><span class="muted small">${L(`${m.ts.length} פרויקטים`,`${m.ts.length} projects`)}</span></div>
   <div class="hc-flow" role="img" aria-label="${m.stage.map(s=>L(s.lab[0],s.lab[1])+' '+s.n).join(', ')}">${m.stage.map(s=>`<i style="flex:${Math.max(.06,s.val/tot).toFixed(3)};background:${s.col}"></i>`).join('')}</div>
   <div class="hc-stages">${m.stage.map((s,i)=>`<button class="hc-stage" style="--c:${s.col};--d:${i*70}ms" data-act="hc-q" data-v="${s.tab}"><span class="k"><i></i>${L(s.lab[0],s.lab[1])}</span><b>${s.n}</b><small>${usd(s.val)}</small>${i<m.stage.length-1?`<span class="ar" aria-hidden="true">${ic('chev','flip')}</span>`:''}</button>`).join('')}</div></div>`;
}

function hcCash(m){
  const mx=Math.max(1,...m.months.map(x=>Math.max(x.in,x.out))),H=64;
  const inT=r2(m.months.reduce((a,x)=>a+x.in,0)),outT=r2(m.months.reduce((a,x)=>a+x.out,0));
  const cols=m.months.map((x,i)=>`<div class="hc-mo" title="${monthLabel(x.k)}: +${usd(x.in)} / −${usd(x.out)}"><span class="up"><i style="height:${(x.in/mx*H).toFixed(1)}px;--d:${i*50}ms"></i></span><span class="dn"><i style="height:${(x.out/mx*H).toFixed(1)}px;--d:${i*50+30}ms"></i></span><em>${monthLabel(x.k)}</em></div>`).join('');
  return `<div class="card hc-card hc-cash"><div class="hc-h"><h3>${L('תזרים ל-6 חודשים','Cash, next 6 months')}</h3></div>
   <div class="hc-cs"><span class="in">${L('נכנס','In')} <b>${usd(inT)}</b></span><span class="out">${L('יוצא','Out')} <b>${usd(outT)}</b></span><span class="net ${inT-outT<0?'neg':''}">${L('נטו','Net')} <b>${inT-outT<0?'−':''}${usd(Math.abs(r2(inT-outT)))}</b></span></div>
   <div class="hc-bars">${cols}</div>
   <button class="hc-more" data-act="go" data-v="finance">${L('לכספים','Open finance')} ${ic('chev','flip')}</button></div>`;
}

function hcTeam(m){
  if(!m.team.length)return '';
  const rows=m.team.slice().sort((a,b)=>b.att-a.att).map((r,i)=>{const att=Math.round(r.att*100);
    return `<div class="hc-ag" style="--d:${i*50}ms"><span class="hc-av">${avatarOf(agn(r.agent))}${hcRing(Math.min(100,att),52,'av')}</span><div class="hc-an"><b>${esc(agn(r.agent))}</b><span>${usd(r.booked)} ${L('מתוך','of')} ${usd(r.target)}</span></div><div class="hc-am"><b>${att}%</b><span>${L('מהיעד','of target')}</span></div><div class="hc-am"><b>${pct(r.margin)}</b><span>${L('מרווח','margin')}</span></div></div>`;}).join('');
  return `<div class="card hc-card hc-team"><div class="hc-h"><h3>${L('הצוות מול היעד','Team vs target')}</h3><span class="muted small">${L('יעדים להמחשה','Illustrative targets')}</span></div>${rows}</div>`;
}

function hcStudio(){
  const ks=['NewEngland','HolyLand','Canyon'];
  return `<div class="card hc-card hc-studio"><div class="hc-ims">${ks.map((k,i)=>`<span style="${phBg(phSrc('dest',k),'background:linear-gradient(135deg,var(--hero1),var(--hero2))')};--i:${i}"></span>`).join('')}</div>
   <div class="hc-st"><span class="hc-eye2">${L('סטודיו לטיולים','Trip studio')} ${NEWP()}</span><h3>${L('טיול מתומחר, עם מפה, תוך שניות','A priced, mapped trip in seconds')}</h3><p>${L('בוחרים יעד, גודל קבוצה ותאריך. טריפלאנט בונה מסלול, מלונות ומחיר לנוסע, ואפשר להפוך אותו להצעה בלחיצה.','Pick a destination, a group size and a date. Triplanet builds the route, the hotels and the price per traveler, and one click turns it into a quote.')}</p>
   <button class="hc-btn mint" data-act="go" data-v="studio">${ic('magic')} ${L('לפתוח את הסטודיו','Open the studio')}</button></div></div>`;
}

function hcHome(){
  const m=hcModel();if(!m.ts.length)return noTrip();
  return `<div class="hc${hpAnim()?' anim':''}">${hcHero(m)}
   <div class="hc-grid">
    <div class="hc-c7">${hcToday(m)}</div><div class="hc-c5">${hcProfit(m)}</div>
    <div class="hc-c12">${hcDepartures(m)}</div>
    <div class="hc-c7">${hcPipeline(m)}${hcTeam(m)}</div><div class="hc-c5">${hcCash(m)}${hcStudio()}</div>
   </div></div>`;
}

/* ---------- accountant: the money desk ---------- */
function hcAcct(){
  const ts=visibleTrips();if(!ts.length)return noTrip();
  const P=portfolio(ts),G=gapStats(ts),M=leakModel(ts),ar=daArNext30(),od=daOverdue(),bills=daBillsToApprove(),cm=daCommReceivable(),docs=daDocsToIssue();
  const col=P.rev>0?Math.round(P.col/P.rev*1000)/10:100,dt=daDetail(S.daDet);
  const hero=hcShell({cls:'da-hero hc-acct',role:L('הנהלת חשבונות','Accounting'),aria:L('תמונת מצב כספית','Finance overview'),
    brief:L(`${usd(ar.total)} צפויים להיכנס מלקוחות ב-30 הימים הקרובים ו-${usd(od.total)} באיחור. ${bills.n} חשבוניות ספקים תואמות להצעה ומחכות לאישור שלך${docs.n?`, ו-${docs.n} מסמכים מחכים להפקה`:''}.`,
      `${usd(ar.total)} is due from clients in the next 30 days and ${usd(od.total)} is overdue. ${bills.n} supplier ${bills.n===1?'bill matches its quote and waits':'bills match their quotes and wait'} for your approval${docs.n?`, and ${docs.n} ${docs.n===1?'document is':'documents are'} ready to issue`:''}.`),
    ctas:[hcCta('mint','check',L(`לאישור ${bills.n} חשבוניות`,`Approve ${bills.n} ${bills.n===1?'bill':'bills'}`),'data-act="da-det" data-v="bills"'),hcCta('ghost','bell',L('חובות באיחור','Overdue payments'),'data-act="da-det" data-v="overdue"')],
    gauge:{pct:col,label:L('מההכנסות כבר נגבו','of booked revenue collected'),lines:[{cls:'ok',icon:'check',lab:L('נגבה','Collected'),val:usd(P.col)},{cls:'op',icon:'hourglass',lab:L('יתרה','Outstanding'),val:usd(P.outstanding)}]},
    kpis:[{lab:L('לגבייה ב-30 יום','Due in 30 days'),val:ar.total,money:1,sub:L(`${ar.n} תשלומים`,`${ar.n} ${ar.n===1?'installment':'installments'}`),act:'da-det',v:'ar30',on:S.daDet==='ar30'},
      {lab:L('באיחור','Overdue'),val:od.total,money:1,cls:'warn',sub:L(`${od.n} קבוצות חיוב`,`${od.n} billing ${od.n===1?'group':'groups'}`),act:'da-det',v:'overdue',on:S.daDet==='overdue'},
      {lab:L('חשבוניות ספק לאישור','Bills to approve'),val:bills.total,money:1,sub:L(`${bills.n} תואמות להצעה`,`${bills.n} matched`),act:'da-det',v:'bills',on:S.daDet==='bills'},
      {lab:L('עמלות לגבייה','Commission receivable'),val:cm.total,money:1,sub:L(`${cm.n} שורות`,`${cm.n} ${cm.n===1?'line':'lines'}`),act:'da-det',v:'comm',on:S.daDet==='comm'}]});
  const m={P,M};
  return `<div class="hc${hpAnim()?' anim':''}">${hero}
   <div class="hc-grid">
    <div class="hc-c12"><div class="card hc-card da-card da-det"><div class="hc-h"><h3>${dt.title}</h3>${dt.sum?`<span class="hc-pill blue">${dt.sum}</span>`:''}</div>${dt.body}</div></div>
    <div class="hc-c7">${daArCard()}${daApCard()}</div>
    <div class="hc-c5">${hcProfit(m)}${daFxCard()}${daSyncCard()}</div>
    <div class="hc-c7">${daDocsCard()}</div><div class="hc-c5">${daMonthCard()}</div>
   </div></div>`;
}

/* ---------- agent: my files ---------- */
function hcAgent(){
  const a=S.role,ts=visibleTrips();if(!ts.length)return noTrip();
  const K=dbAgentKpis(a,ts),att=Math.round(Math.min(1,K.att||0)*1000)/10,togo=Math.max(0,r2((K.target||0)-K.booked));
  const steps=typeof nxAgentSteps==='function'?nxAgentSteps(ts,6):[],urgent=steps.filter(x=>x.s.sev==='urgent').length;
  const dep=ts.filter(t=>t.dep>=iso(TODAY)&&!(t.stage==='Quote'&&t.qst==='Lost')).sort((x,y)=>x.dep<y.dep?-1:x.dep>y.dep?1:0).slice(0,8);
  const nx=dep.find(t=>t.stage!=='Quote'),s0=steps[0];
  const brief=L(`${K.openN?`יש לך ${K.openN} הצעות פתוחות בשווי ${usd(K.openVal)}${K.followN?`, ${K.followN} מהן צריכות מעקב`:''}.`:'אין לך הצעות פתוחות כרגע.'} ${nx?`היציאה הבאה שלך: ${nx.name}, ${hcIn(hcDays(nx.dep))}.`:'אין לך יציאות קרובות; כדאי לסגור את התיקים שבסגירה כספית.'}`,
    `${K.openN?`You have ${K.openN} open ${K.openN===1?'quote':'quotes'} worth ${usd(K.openVal)}${K.followN?`, and ${K.followN} ${K.followN===1?'needs':'need'} a follow-up`:''}.`:'No open quotes right now.'} ${nx?`Your next departure is ${nx.name}, ${hcIn(hcDays(nx.dep))}.`:'No departures coming up; your files in financial close are the next thing to finish.'}`);
  const first=s0?hcCta('mint','arrup',L(s0.s.label[0],s0.s.label[1]),s0.s.act.a==='advance'?`data-act="advance" data-v="${s0.t.id}"`:`data-act="open" data-v="${s0.t.id}" data-pt="${s0.s.act.v}"`):'';
  const hero=hcShell({cls:'db-hero hc-agent',role:L('סוכן/ת מכירות','Sales agent'),
    brief,ctas:[first,hcCta('ghost','magic',L('לבנות טיול','Build a trip'),'data-act="go" data-v="studio"')].filter(Boolean),
    gauge:{pct:att,label:L('מהיעד השנתי שלך','of your annual target'),lines:[{cls:'ok',icon:'check',lab:L('נסגרו','Booked'),val:usd(K.booked)},{cls:'op',icon:'hourglass',lab:L('נותרו','To go'),val:usd(togo)}]},
    kpis:[{lab:L('הצעות פתוחות','Open quotes'),val:K.openVal,money:1,sub:L(`${K.openN} הצעות`,`${K.openN} ${K.openN===1?'quote':'quotes'}`),act:'hc-q',v:'quotes'},
      {lab:L('מעקבים לביצוע','Follow-ups due'),val:K.followN,sub:L('נשלחו לפני יותר משבוע','sent over a week ago'),act:'hc-q',v:'quotes'},
      {lab:L('יציאות ב-60 יום','Departures, 60 days'),val:K.depN,sub:L('תיקים בתפעול','files in operations'),act:'hc-q',v:'files'},
      {lab:L('רווח צפוי','Expected profit'),val:K.fp,money:1,cls:'pf',sub:L(`${pct(K.margin)} מרווח · צוות ${pct(K.teamMargin)}`,`${pct(K.margin)} margin · team ${pct(K.teamMargin)}`)}]});
  const m={steps,urgent,dep};
  const close=typeof nxHasUpcoming==='function'&&!nxHasUpcoming(ts)?nxCloseCard(ts):'';
  /* empty cards add noise: show the week only when tasks exist, forms only when some are pending */
  const wk=dbTasks(ts,400).length?dbWeekCard(ts):'',fm=dbFormsPending(ts).rows.length?dbFormsCard(ts):'';
  return `<div class="hc${hpAnim()?' anim':''}">${hero}
   <div class="hc-grid">
    <div class="hc-c7">${hcToday(m,{cls:'nx-card',title:L('הצעדים הבאים שלי','My next steps')})}</div>
    <div class="hc-c5">${close}${wk}${fm}</div>
    <div class="hc-c12">${dbPipelineCard(ts)}</div>
    <div class="hc-c12">${hcDepartures(m)}</div>
   </div></div>`;
}

/* every role gets the command-center language: owner, accountant, agents */
{const h1=VIEWS.home;VIEWS.home=function(){return isMgr()?hcHome():isAcct()?hcAcct():isAgent()?hcAgent():h1.apply(this,arguments);};}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="hc-q"]');if(!b)return;
  S.tab='quotes';S.qtab=b.dataset.v||'all';S.page=0;render();window.scrollTo(0,0);});

TESTS.push({name:'hc home command center',run:h=>{const out=[];const r0=S.role,l0=S.lang;
  S.role='manager';const m=hcModel();
  if(Math.abs(m.stage.reduce((a,s)=>a+s.n,0)-m.ts.filter(t=>!(t.stage==='Quote'&&!isOpenQ(t))).length)>0)out.push('stage counts do not cover the files');
  const P=portfolio(m.ts);if(Math.abs(m.stage.filter(s=>s.st!=='Quote').reduce((a,s)=>a+s.val,0)-P.rev)>0.05)out.push('stage values do not tie to booked revenue');
  if(Math.abs(m.stage[0].val-P.pipeline)>0.05)out.push('quotation value does not tie to the pipeline');
  if(!(m.kept>0&&m.kept<=100))out.push('kept % out of range '+m.kept);
  const M=leakModel(m.ts);if(Math.abs((P.pp-P.fp)-M.leak)>0.05)out.push('leak does not tie to planned minus expected');
  if(m.dep.some((t,i)=>i&&t.dep<m.dep[i-1].dep))out.push('departures not sorted');
  for(const lang of ['en','he']){S.lang=lang;const hh=VIEWS.home();h.chk(hh,'hc '+lang);if(lang==='en')h.scan(hh,'hc');
    if(!hh.includes('ptiles'))out.push('hero lost ptiles (tour target)');if(!hh.includes('hc-today'))out.push('no today card');}
  for(const lang of ['en','he']){S.lang=lang;
    S.role='accountant';{const hh=VIEWS.home();h.chk(hh,'hc acct '+lang);if(lang==='en')h.scan(hh,'hc acct');if(!hh.includes('hc-acct')||hh.includes('ptiles'))out.push('accountant home');}
    for(const ag of AGENTS){S.role=ag;const hh=VIEWS.home();h.chk(hh,'hc agent '+ag+' '+lang);if(lang==='en')h.scan(hh,'hc agent');if(!hh.includes('hc-agent')||hh.includes('hc-acct'))out.push('agent home '+ag);}}
  S.lang='en';S.role='accountant';{const P=portfolio(visibleTrips()),ar=daArNext30();if(!VIEWS.home().includes(usd(ar.total)))out.push('accountant hero lacks the 30-day figure');if(P.col>P.rev)out.push('collected above revenue');}
  S.role=r0;S.lang=l0;return out;}});

/* developer notes for the redesigned owner home (replaces the entry in s11_spec.js) */
SPEC['home:manager']={title:'Home, owner (command center)',
  purpose:'Tell the owner in one screen how the season stands, what needs them today, and where profit is leaking or can be recovered.',
  roles:{view:['manager'],act:['manager']},perms:['proj.viewAll','fin.view'],
  data:['Trip.stage','Trip.qst','Trip.dep','Trip.dest','Trip.agent','Trip.pax','Line.cost','Invoice.amt','Gap.kind','Group.depPaid','Group.balPaid','Task.done','Staff.target'],
  actions:[{label:'Recover $X',does:'Opens Invoice check with the open gaps',rule:'Amount = leakModel().rec (open supplier gaps, USD)'},
    {label:'Build a trip',does:'Opens the Trip studio',rule:'Always available'},
    {label:'Today: step button',does:'Opens the trip tab the step names, or advances the stage',rule:'Top 6 of nxAgentSteps(visibleTrips()), urgent first, then by departure'},
    {label:'Departure card',does:'Opens the trip (dashboard, or general for quotes)',rule:'Next 8 departures from today, Lost quotes excluded'},
    {label:'Stage card',does:'Opens Projects on the matching tab',rule:'Quotation→quotes, Operation and Finance→files, Closed→archive'},
    {label:'Recovered / Still open / At risk',does:'Open Invoice check or Profit leaks',rule:'From leakModel(): got, rec, late+release'}],
  rules:['kept % = expected profit / planned profit = P.fp / P.pp','Leaked = P.pp − P.fp = leakModel().leak','Quotation value = Σ calc(t).rev of open quotes = portfolio().pipeline','Σ Operation + Finance + Closed values = portfolio().rev','Readiness ring = dbReadiness(t).overall (tasks, passports, suppliers, deposits)','Cash = portfolio().cash for the next 6 months (in = client payments due, out = supplier payments due)','Team attainment = booked / Staff.target'],
  states:{empty:'No files: the "No trips here" card.',loading:'Not applicable (local data).',error:'Missing photos fall back to the brand gradient.'},
  status:'pilot',api:['GET /v1/t/{tenantId}/dashboard/owner (proposed)','GET /v1/t/{tenantId}/reports/trip-pnl','GET /v1/t/{tenantId}/trips?from=today&limit=8 (proposed)'],
  tests:['TEST hc home command center','TEST db manager and agent dashboards'],
  code:['v6/s12_home.js: hcHome, hcModel, hcHero, hcToday, hcProfit, hcDepartures, hcPipeline, hcCash, hcTeam, hcStudio','v6/m_home.css']};

/* developer notes: the accountant and agent homes now render through the shared hero (hcShell) */
['home:accountant','home:agent'].forEach(k=>{const e=SPEC[k];if(!e)return;const fn=k==='home:agent'?'hcAgent':'hcAcct';
  e.code=[`v6/s12_home.js: ${fn}, hcShell`].concat((e.code||[]).filter(c=>!/s12_home/.test(c))).slice(0,8);
  e.tests=['TEST hc home command center'].concat((e.tests||[]).filter(x=>x!=='TEST hc home command center')).slice(0,8);});
