
/* ---------- home ---------- */
const LY={Priya:.62,Dana:.7,Marcus:.45,Grace:.55,Luis:.6,Tom:.5};
function vHome(){
  const ts=visibleTrips();if(!ts.length)return noTrip();
  const c=f=>ts.filter(f).length,P=portfolio(ts),G=gapStats(ts);
  const qL=n=>L('הצעות',n===1?'quote':'quotes'),fL=n=>L('תיקים',n===1?'file':'files');
  const n1=c(t=>t.stage==='Quote'&&(t.qst||'Draft')==='Draft'),n2=c(t=>t.stage==='Quote'&&(t.qst||'Draft')!=='Draft'),n3=c(t=>t.stage==='Operations'),n4=c(t=>t.stage==='Finance'),n5=c(t=>t.stage==='Closed');
  const tiles=[[L('סך הכל','Total'),ts.length,L('הצעות ותיקים','quotes and files'),'',ic('folder')],[L('בבנייה','In progress'),n1,qL(n1),'orange',ic('draft')],[L('ממתינות','Pending'),n2,qL(n2),'amber',ic('hourglass')],[L('בתפעול','In operations'),n3,fL(n3),'blue',ic('ops')],[L('סגירה כספית','Financial close'),n4,fL(n4),'purple',ic('wallet')],[L('נסגרו','Closed'),n5,fL(n5),'green',ic('done')]];
  const tot=ts.length||1,nq=c(t=>t.stage==='Quote'),no=c(t=>t.stage==='Operations'),nf=c(t=>t.stage==='Finance'||t.stage==='Closed');
  const ptl=[[L('סך הכל','Total'),ts.length,'var(--ink)',ic('folder'),1],[L('הצעת מחיר','Quotation'),nq,'var(--dis)',ic('document'),nq/tot],[L('תפעול','Operation'),no,'#FFAB00',ic('mapsq'),no/tot],[L('כספים','Finance'),nf,'#22C55E',ic('cash'),nf/tot]]
    .map(x=>`<div class="ptile"><span class="pring" style="--c:${x[2]};--p:${Math.round(x[4]*100)}"><span>${x[3]}</span></span><div><b>${x[0]}</b><span>${x[1]}</span></div></div>`).join('');
  const tl=tiles.map(x=>`<div class="tile"><span class="ring" style="${x[3]?`--c:var(--${x[3]})`:''}">${x[4]}</span><div><div class="l">${x[0]}</div><div class="s">${x[1]} ${x[2]}</div></div></div>`).join('');
  const up=ts.filter(t=>D(t.dep)>=TODAY).sort((a,b)=>D(a.dep)-D(b.dep)).slice(0,7);
  let lastD='',ev='';
  up.forEach(t=>{if(t.dep!==lastD){lastD=t.dep;ev+=`<div class="evh">${fmtDate(t.dep)}</div>`;}
    ev+=`<div class="ev"><span class="dot" style="background:var(--${stCls(t.stage)})"></span><a href="#" data-act="open" data-v="${t.id}" style="flex:1;color:inherit;text-decoration:none">${esc(t.name)}</a><span class="muted small">${range(t)}</span></div>`;});
  const won=c(t=>t.stage!=='Quote'),lost=S.role==='manager'?3:0;
  const H=[['2023',9,4],['2024',11,5],['2025',12,3],['2026',won,lost]];
  const mx=Math.max(...H.map(h=>Math.max(h[1],h[2])),1);
  const bars=H.map(h=>`<div class="col"><div class="bars"><div class="b won" style="height:${h[1]/mx*100}%"><i>${h[1]}</i></div><div class="b lost" style="height:${Math.max(h[2]/mx*100,2)}%"><i>${h[2]}</i></div></div></div>`).join('');
  const labs=H.map(h=>`<span>${h[0]}</span>`).join('');
  const chg=S.role==='manager'?`${sgn(Math.round((won-12)/12*100),v=>v)}% ${L('ביחס לשנה קודמת','vs last year')}`:'';
  const latest=ts.slice().sort((a,b)=>b.no-a.no).slice(0,5).map(t=>{
    const ring=t.stage==='Operations'?(()=>{const d=t.tasks.filter(x=>x.done).length;return `<div class="pr" style="--p:${Math.round(d/t.tasks.length*100)}"><span>${d}/${t.tasks.length}</span></div>`;})():t.stage!=='Quote'?'<span class="okc">'+ic('check')+'</span>':'';
    return `<tr><td><strong>${esc(t.name)}</strong><div class="small muted">${sn(t.seg)}</div></td><td>${esc(t.client)}<div class="small muted">${ctn(t.ctype)}</div></td><td>${range(t)}<div class="small muted">${nightsL(t.nights)}</div></td><td>${agn(t.agent)}</td><td>${qchip(t)}</td><td>${ring}</td><td><button class="btn sm" data-act="open" data-v="${t.id}" aria-label="${L('פתח','Open')}">›</button></td></tr>`;}).join('');
  const ag=AGENTS.filter(a=>S.role==='manager'||a===S.role).map(a=>{const x=TRIPS.filter(t=>t.agent===a),w=x.filter(t=>t.stage!=='Quote').length,r=x.length?w/x.length:0,up=r>=LY[a];
    return `<tr><td><span class="row">${avatarOf(agn(a))}${agn(a)}</span></td><td class="n">${x.length}</td><td class="n">${Math.round(r*100)}% <span class="${up?'pos':'neg'}">${up?ic('trendup'):ic('trenddown')}</span></td></tr>`;}).join('');
  const al=alertsFor(ts,S.thresh).slice(0,6).map(a=>`<div class="alert">${pillF(a.sev==='bad'?L('דחוף','Urgent'):a.sev==='warn'?L('לבדיקה','Check'):L('לידיעה','FYI'),a.sev==='bad'?'red':a.sev==='warn'?'amber':'blue')}<div>${a.txt}</div>${a.trip?`<button class="btn sm" data-act="open" data-v="${a.trip}" data-pt="${a.pt||'costs'}">${L('פתח','Open')}</button>`:`<button class="btn sm" data-act="go" data-v="${a.go}">${L('הצג','View')}</button>`}</div>`).join('')||`<p class="muted">${L('אין התראות.','No alerts.')}</p>`;
  return `<h1 style="margin-bottom:16px">${L('שלום','Hello')} ${S.role==='manager'?MGR():agn(S.role)} 👋</h1>
  <div class="ptiles">${ptl}</div>
  <div class="two">
   <div class="card pstat"><div class="row" style="justify-content:space-between;margin-bottom:14px"><h3 style="margin:0">${L('סטטיסטיקת פרויקטים','Project Statistics')}</h3><select aria-label="${L('תקופה','Period')}"><option>${L('שנה','Year')}</option><option>${L('רבעון','Quarter')}</option><option>${L('חודש','Month')}</option></select></div>
     <div class="pstat-g"><div class="pcards"><div class="pcard"><div><span>${L('פרויקטים שנסגרו','Closed Projects')}</span><b>${won}</b><small>${Math.abs(Math.round((won-12)/12*100))}% ${L('ביחס לשנה שעברה','compared to last year')}</small></div><img src="${TP_ART.open}" alt="" width="96" height="96"></div>
      <div class="pcard"><div><span>${L('פרויקטים שבוטלו','Canceled Projects')}</span><b>${lost}</b><small>${ic('trenddown')} ${Math.round(Math.abs(3-lost)/3*100)}% ${L('ביחס לשנה שעברה','compared to last year')}</small></div><img src="${TP_ART.closed}" alt="" width="96" height="96"></div></div>
      <div><div class="legend"><span><i style="background:#22C55E"></i>${L('פרויקטים שנסגרו','Closed Projects')}</span><span><i style="background:#FFAB00"></i>${L('פרויקטים שבוטלו','Canceled Projects')}</span></div><div class="scroll"><div class="chart" style="min-width:200px;height:190px">${bars}</div><div class="xl" style="min-width:200px">${labs}</div></div></div></div></div>
   <div class="card" style="padding:0;overflow:hidden"><div style="padding:16px 16px 6px"><h3>${L('יציאות קרובות','Upcoming departures')}</h3></div>${ev}</div>
  </div>
  <div class="two">
   <div class="card"><h3>${L('דורש טיפול','Needs attention')} ${NEWP()}</h3>${al}</div>
   <div class="card"><h3>${L('בקרת חשבוניות','Invoice check')} ${NEWP()}</h3><div class="stats" style="margin:0 0 10px"><div class="stat"><div class="l">${L('פערים פתוחים','Open gaps')}</div><div class="v neg">${usd(G.open+G.disp)}</div><div class="s">${G.openN+G.dispN} ${L('פערים',(G.openN+G.dispN)===1?'gap':'gaps')}</div></div><div class="stat"><div class="l">${L('הוחזר מספקים העונה','Recovered this season')}</div><div class="v pos">${usd(G.rec)}</div><div class="s">${G.recN} ${L('זיכויים',(G.recN)===1?'credit':'credits')}</div></div><div class="stat"><div class="l">${L('רווח צפוי','Expected profit')}</div><div class="v">${usd(P.fp)}</div><div class="s">${P.rev?pct(P.fp/P.rev):'-'}</div></div></div><div class="row"><button class="btn pri" data-act="go" data-v="gaps">${L('לבקרת החשבוניות','Open invoice check')}</button><button class="btn" data-act="go" data-v="finance">${L('לדשבורד הכספי','Finance dashboard')}</button></div></div>
  </div>
  <div class="card sec"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">${L('ההצעות האחרונות','Latest quotes')}</h3><button class="btn pri" data-act="newq">${L('הצעה חדשה','New quote')}</button></div>
   <div class="scroll"><table class="tbl"><thead><tr><th>${L('שם','Name')}</th><th>${L('לקוח','Client')}</th><th>${L('תאריכי טיול','Trip dates')}</th><th>${L('אחראי תיק','File owner')}</th><th>${L('סטטוס','Status')}</th><th></th><th></th></tr></thead><tbody>${latest}</tbody></table></div></div>
  <div class="card" style="max-width:560px"><h3>${L('אנשי מכירות','Sales team')}</h3><table class="tbl"><thead><tr><th>${L('מוכר','Agent')}</th><th class="n">${L('תיקים','Files')}</th><th class="n">${L('סגירות','Closing rate')}</th></tr></thead><tbody>${ag}</tbody></table><p class="small muted" style="margin:8px 0 0">${L('החץ משווה לשנה שעברה. שנים קודמות פיקטיביות.','Arrow compares with last year. Prior years are fictional.')}</p></div>`;
}

/* ---------- projects list ---------- */
function vQuotes(){
  const all=visibleTrips();if(!all.length)return noTrip();
  const inTab=(t,k)=>k==='all'||(k==='quotes'&&t.stage==='Quote')||(k==='files'&&(t.stage==='Operations'||t.stage==='Finance'))||(k==='archive'&&t.stage==='Closed');
  const q=S.q.trim().toLowerCase();
  const base=all.filter(t=>(S.qseg==='All'||t.seg===S.qseg)&&(!q||(t.name+' '+t.client+' #'+t.no+' '+dn(t.dest)).toLowerCase().includes(q)));
  const list=base.filter(t=>inTab(t,S.qtab)).sort((a,b)=>D(a.dep)-D(b.dep));
  const per=S.rpp||list.length||1,pages=Math.max(1,Math.ceil(list.length/per));if(S.page>=pages)S.page=pages-1;
  const shown=S.rpp?list.slice(S.page*per,S.page*per+per):list;
  const rows=shown.map(t=>`<tr><td class="no">#${t.no}</td><td>${qchip(t)}</td><td><strong>${esc(t.name)}</strong><div class="small muted">${dn(t.dest)}</div></td><td>${range(t)}<div class="small muted">${nightsL(t.nights)}</div></td><td>${esc(t.client)}<div class="small muted">${ctn(t.ctype)}</div></td><td><span class="row">${avatarOf(agn(t.agent))}${agn(t.agent)}</span></td>
    <td><div class="row" style="flex-wrap:nowrap"><button class="btn sm" data-act="open" data-v="${t.id}">${L('פתח','Open')}</button><button class="btn sm" data-act="dup" data-v="${t.id}">${L('שכפל','Duplicate')}</button></div></td></tr>`).join('');
  const tabs=[['quotes',L('הצעות','Quotes')],['files',L('תיקים','Files')],['archive',L('ארכיון','Archive')],['all',L('הכל','All')]].map(x=>`<button class="${S.qtab===x[0]?'on':''}" data-act="qtab" data-v="${x[0]}">${x[1]}<span class="cnt">${base.filter(t=>inTab(t,x[0])).length}</span></button>`).join('');
  const from=list.length?S.page*per+1:0,to=Math.min(list.length,S.page*per+per);
  return head(L('פרוייקטים','Projects'),`<button class="btn pri" data-act="newq">+ ${L('תיק חדש','New file')}</button>`)+`<div class="card" id="qlist">
    <div class="row sec"><input type="text" data-in="q" value="${esc(S.q)}" placeholder="${L('חפש...','Search...')}" aria-label="${L('חיפוש','Search')}" style="flex:1;min-width:200px">
    <select data-ch="qseg" aria-label="${L('סינון לפי סוג קבוצה','Filter by group type')}"><option value="All">${L('כל הסוגים','All group types')}</option>${Object.keys(SEG).map(k=>`<option value="${k}" ${S.qseg===k?'selected':''}>${sn(k)}</option>`).join('')}</select></div>
    <div class="tabs">${tabs}</div>
    <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${L('סטטוס','Status')}</th><th>${L('שם הפרוייקט','Project name')}</th><th>${L('תאריכי טיול','Trip dates')}</th><th>${L('לקוח','Client')}</th><th>${L('אחראי תיק','File owner')}</th><th></th></tr></thead><tbody>${rows||`<tr><td colspan="7" class="muted">${L('אין תוצאות.','No results.')}</td></tr>`}</tbody></table></div>
    <div class="pager"><label class="small muted">${L('שורות בעמוד:','Rows per page:')} <select data-ch="rpp">${[8,16,0].map(n=>`<option value="${n}" ${S.rpp===n?'selected':''}>${n||L('הכל','All')}</option>`).join('')}</select></label>
    <span class="small muted">${from}-${to} ${L('מתוך','of')} ${list.length}</span><button class="btn sm" data-act="pg" data-v="-1" ${S.page===0?'disabled':''} aria-label="${L('הקודם','Previous')}">${ic('chev','flip back')}</button><button class="btn sm" data-act="pg" data-v="1" ${S.page>=pages-1?'disabled':''} aria-label="${L('הבא','Next')}">${ic('chev','flip')}</button></div></div>`;
}

/* ---------- trip shell ---------- */
const PTABS=[['general',['פרטים כלליים','General details']],['plan',['בניית תוכנית','Build itinerary']],['costs',['טבלת עלויות','Cost table']],['quote',['הצעת מחיר','Proposal']],['approve',['אישור הצעה','Quote approval']],['ops',['תפעול','Operations'],1],['people',['נוסעים וחיוב','Travelers & billing'],1],['tfin',['בקרת חשבוניות','Invoice check'],1]];
function vTrip(){
  const t=T();if(!t)return noTrip();
  const f={general:pGeneral,plan:pPlan,costs:pCosts,quote:pQuote,approve:pApprove,ops:pOps,people:pPeople,tfin:pTripFin}[S.ptab]||pCosts;
  const stb=t.stage==='Quote'?`<span class="stbox"><b>QUOTE</b>${qn(t.qst)}</span>`:`<span class="stbox" style="color:var(--${stCls(t.stage)});background:color-mix(in srgb,var(--${stCls(t.stage)}) 12%,var(--panel))"><b>FILE</b>${stn(t.stage)}</span>`;
  const badge=k=>{if(k!=='tfin')return '';const n=t.inbox.length?t.inbox.length:tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0).length;return n?`<span class="bdg">${n}</span>`:'';};
  return `<div class="th"><div><div style="display:flex;align-items:center;flex-wrap:wrap"><button class="btn sm" data-act="go" data-v="quotes" aria-label="${L('חזרה לרשימה','Back to list')}" style="margin-inline-end:10px">${L('›','‹')}</button><h1>${esc(t.name)}</h1><span class="no">#${t.no}</span></div>
    <div class="sub">${range(t)} · ${L(`${t.nights+1} ימים, ${t.nights} לילות`,`${t.nights+1} days, ${t.nights} nights`)} · ${dn(t.dest)} · <bdi>${esc(t.client)}</bdi> · ${paxL(t.pax)}</div></div>${stb}</div>
  <div class="tabs">${PTABS.map(x=>`<button class="${S.ptab===x[0]?'on':''}" data-act="pt" data-v="${x[0]}">${L(x[1][0],x[1][1])}${x[2]?`<em>${L('חדש','New')}</em>`:''}${badge(x[0])}</button>`).join('')}</div>${f(t)}`;
}
const master=(t,btns)=>`<div class="master"><strong>${L('תוכנית מאסטר','Master plan')}</strong><div class="row">${btns||''}</div></div>`;

function pGeneral(t){
  const d=DESTS[t.dest];
  const rows=[[L('שם הפרוייקט','Project name'),`<input type="text" data-ch="name" value="${esc(t.name)}" aria-label="${L('שם','Name')}" style="width:min(340px,100%)">`],[L('לקוח','Client'),`${esc(t.client)} (${ctn(t.ctype)})`],[L('יעד','Destination'),dn(t.dest)+', '+cn(t.dest)],[L('סוג קבוצה','Group type'),sn(t.seg)],[L('מספר נוסעים','Travelers'),t.pax],[L('תאריכי טיול','Trip dates'),range(t)],[L('אחראי תיק','File owner'),agn(t.agent)],
    [L('מטבע ספקים','Supplier currency'),t.cur+(d.air?L(' (טיסות ב-USD)',' (air in USD)'):'')],
    ...(t.cur!=='USD'?[[L(`שער נעול, דולר ל-${t.cur}`,`Locked rate, USD per ${t.cur}`),`<input type="number" step="0.01" min="0.5" max="2" data-ch="rate" value="${t.rate}" aria-label="${L('שער נעול','Locked rate')}">`]]:[]),
    [L('מקדמה (%)','Deposit (%)'),`<input type="number" min="0" max="100" data-ch="pct" value="${t.pct}" aria-label="${L('אחוז מקדמה','Deposit percent')}">`],[L('מועד מקדמה','Deposit due'),fmtDate(t.depDue)],[L('מועד יתרה','Balance due'),fmtDate(t.balDue)]];
  return master(t)+`<div class="card"><table class="tbl"><tbody>${rows.map(r=>`<tr><td class="muted" style="width:220px">${r[0]}</td><td>${r[1]}</td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- plan builder ---------- */
const dayHours=(t,d)=>t.items.filter(i=>i.day===d).reduce((a,i)=>a+i.hrs,0);
function allTpl(){const o=DAYTPL.map(x=>({...x}));Object.keys(DESTS).forEach(k=>o.push({n:['יום פעילויות: '+DESTS[k].he,'Activity day: '+DESTS[k].en],dest:k,tag:[DESTS[k].he,DESTS[k].en],items:DESTS[k].acts.map(a=>[a[0],a[4]])}));return o;}
function introOf(t){
  const d=DESTS[t.dest];
  if(t.dest==='HolyLand')return L('הקבוצה נוחתת בנתב"ג, פוגשת את המדריך ועולה לאוטובוס. מבקרים בכנסיית פטרוס הקדוש ביפו וממשיכים לירושלים לארוחת ערב ולינה.',"The group lands at Ben Gurion, meets our guide and boards the coach. We visit St. Peter's Church in Jaffa, then continue to Jerusalem for dinner and the night.");
  if(!d.air)return L('האוטובוס יוצא מטולסה בבוקר, עם עצירה לארוחת צהריים בדרך. צ\'ק-אין במלון ואז ארוחת ערב קבוצתית.','The motorcoach leaves Tulsa in the morning, with a lunch stop on the way. Hotel check-in, then a welcome dinner.');
  return L('הקבוצה נוחתת, פוגשת את המדריך ועולה לאוטובוס. אחרי הצ\'ק-אין יוצאים לסיור היכרות וארוחת ערב.','The group lands, meets the guide and boards the coach. After check-in: an orientation walk and a welcome dinner.');
}
function pPlan(t){
  const days=[...Array(t.nights+1).keys()].map(k=>k+1);
  if(S.openDay>days.length)S.openDay=1;
  const costOf=name=>t.lines.find(l=>!l.extra&&l.type==='Activities'&&l.name===name&&l.scope==='per person');
  const siteRow=i=>{const l=costOf(i.name);return `<div class="site" draggable="true" data-item="${i.id}"><span class="flag">${ic('pin')}</span><span class="nm">${esc(i.name)}<div class="small muted">${hrsL(i.hrs)}</div></span>
    ${l?`<span class="cbox">${L('עלות לאדם','Cost per person')} $<input type="number" min="0" step="1" data-ch="itemcost" data-v="${l.id}" value="${Math.round(l.cost*lrate(t,l))}" aria-label="${L('עלות לאדם','Cost per person')}"></span>`:''}
    <select data-ch="mv" data-v="${i.id}" aria-label="${L('העבר ליום','Move to day')}">${[...Array(t.nights+2).keys()].map(k=>`<option value="${k}" ${k===i.day?'selected':''}>${k===0?L('לא משובץ','Unscheduled'):L('יום ','Day ')+k}</option>`).join('')}</select>
    <button class="btn sm" data-act="rmitem" data-v="${i.id}" aria-label="${L('הסר','Remove')}">${ic('x')}</button></div>`;};
  const acts=DESTS[t.dest].acts;
  const accs=[...days,0].map(d=>{
    const hrs=dayHours(t,d),over=d>0&&hrs>9,open=S.openDay===d,its=t.items.filter(i=>i.day===d);
    const body=open?`<div class="bd">${d===1?`<div class="welcome"><div class="wim" aria-hidden="true"></div><div><strong style="font-size:17px">${L('ברוכים הבאים','Welcome')}${t.dest==='HolyLand'?L(' לארץ',' to the Holy Land'):L(' ל'+dn(t.dest),' to '+dn(t.dest))}</strong><div class="small muted">${ic('pin')} ${dn(t.dest)}, ${cn(t.dest)}</div><p style="margin:8px 0 0">${introOf(t)}</p></div></div>`:''}
      <div style="font-weight:700;margin-bottom:4px">${d===0?L('אתרים שלא שובצו','Unscheduled sites'):L('אתרים ביום הטיול','Sites on this day')}</div>${its.map(siteRow).join('')||`<p class="muted small">${L('אין אתרים. גררו לכאן או הוסיפו.','No sites yet. Drag one here or add one.')}</p>`}
      ${over?`<div class="warnbox">${ic('danger')} ${L(`${hrs} שעות ביום הזה. קבוצות מחזיקות בדרך כלל כ-9 שעות, אז סביר שהלו"ז יחרוג.`,`${hrs} hours on this day. Groups usually manage about 9 hours, so the schedule will likely slip.`)}</div>`:''}
      ${d>0?`<div class="row" style="margin-top:10px"><select data-ch="siteSel" aria-label="${L('אתר להוספה','Site to add')}">${acts.map((a,k)=>`<option value="${k}" ${k===S.siteSel?'selected':''}>${esc(a[0])}</option>`).join('')}</select><button class="btn sm" data-act="addsite" data-v="${d}">${L('הוסף אתר ליום','Add site to day')}</button></div>`:''}</div>`:'';
    return `<div class="acc" data-day="${d}"><button data-act="day" data-v="${d}"><span>${d===0?L('לא משובץ','Unscheduled'):L('יום ','Day ')+d} ${over?pillF(L('עומס','Overloaded'),'red'):''}</span><span class="small muted">${hrsL(hrs)} ${open?ic('up'):ic('down')}</span></button>${body}</div>`;}).join('');
  const q=S.tplQ.trim().toLowerCase(),ALL=allTpl();
  const tpls=ALL.filter(x=>(S.tplDest==='All'||x.dest===S.tplDest||x.dest==='')&&(!q||(x.n.join(' ')+x.items.map(i=>i[0]).join(' ')).toLowerCase().includes(q))).sort((a,b)=>(b.dest===t.dest)-(a.dest===t.dest)).slice(0,8);
  const tp=tpls.map((x,i)=>`<div class="tpl"><div class="im" style="background:linear-gradient(135deg,${i%2?'#3b6fa5,#7fb0d9':'#c9894a,#e8c08a'})">${pillF(L(x.tag[0],x.tag[1]),'')}</div><strong>${L(x.n[0],x.n[1])}</strong>${x.dest?`<div class="small muted">${ic('pin')} ${dn(x.dest)}</div>`:''}<ul>${x.items.slice(0,3).map(i=>`<li>${esc(i[0])}</li>`).join('')}</ul>
    <button class="btn sm" data-act="addtpl" data-v="${ALL.findIndex(y=>y.n[1]===x.n[1])}">${L('הוסף ליום ','Add to day ')}${S.openDay>0?S.openDay:1}</button></div>`).join('');
  return master(t,`<button class="btn" data-act="toast" data-v="${L('נשמר כטיוטה','Saved as draft')}">${L('שמור טיוטה','Save draft')}</button><button class="btn pri" data-act="pt" data-v="costs">${L('שמור והמשך','Save and continue')}</button>`)+`<div class="pg"><div>${accs}
    <p class="small muted">${L('גררו אתר ליום אחר או השתמשו בתפריט. עלות לאדם נשלפת מטבלת העלויות, ושינוי כאן מעדכן את המחיר.','Drag a site to another day or use the menu. Cost per person comes from the cost table, and changing it here updates the price.')}${t.stage==='Quote'?L(' הוספת אתר מהקטלוג מוסיפה גם שורת עלות.',' Adding a catalog site also adds a cost line.'):''}</p></div>
    <div class="card"><h3>${L('תבניות','Templates')}</h3><input type="text" data-in="tplQ" value="${esc(S.tplQ)}" placeholder="${L('חיפוש','Search')}" aria-label="${L('חיפוש תבנית','Search templates')}" style="width:100%;margin-bottom:8px">
    <select data-ch="tplDest" aria-label="${L('סינון לפי יעד','Filter by destination')}" style="width:100%;margin-bottom:12px"><option value="All">${L('כל היעדים','All destinations')}</option>${Object.keys(DESTS).map(k=>`<option value="${k}" ${S.tplDest===k?'selected':''}>${dn(k)}</option>`).join('')}</select><div class="tall" style="max-height:620px">${tp||`<p class="muted small">${L('אין תבניות.','No templates.')}</p>`}</div></div></div>`;
}

/* ---------- cost table ---------- */
function pCosts(t){
  const c=calc(t),cs=t.cur,usdOnly=cs==='USD';
  const sect=(sk)=>{
    const sh=sk==='s';
    const types=TYPES.filter(ty=>c.lines.some(x=>!x.l.extra&&x.l.type===ty&&(x.l.scope==='shared')===sh));
    let tot=0;
    const rows=types.map(ty=>{
      const ls=c.lines.filter(x=>!x.l.extra&&x.l.type===ty&&(x.l.scope==='shared')===sh),key=sk+'|'+ty,d=t.disc[key]||{m:'%',v:''};
      const cost=ls.reduce((a,x)=>a+x.planUSD,0),price=ls.reduce((a,x)=>a+x.price,0),da=c.discBy[key]||0,total=price-da;tot+=total;
      const ovN=ls.filter(x=>x.l.ov!==''&&x.l.ov!=null).length,op=S.openT[key],mkv=t.markups[ty];
      let r=`<tr><td><span class="type"><i style="background:${TCOL[ty]}">${TICO[ty]}</i>${tn(ty)}</span><button class="btn sm" style="margin-inline-start:8px" data-act="tt" data-v="${key}" aria-label="${L('פירוט שורות','Line detail')}">${op?ic('up'):ic('down')}</button></td>
        <td class="n">${usd(sh?cost:cost/t.pax,sh?0:2)}</td>
        <td class="n"><span class="inl"><select disabled aria-label="${L('סוג מרקאפ','Markup type')}"><option>%</option></select><input type="number" min="0" max="90" data-ch="mk" data-v="${ty}" value="${mkv}" aria-label="${L('מרקאפ','Markup')} ${tn(ty)}"></span>${ovN?`<div class="small muted">${ovN} ${L('חריגות','overrides')}</div>`:''}</td>
        <td class="n"><span class="inl"><select data-ch="dm" data-k="${key}" aria-label="${L('סוג הנחה','Discount type')}"><option value="%" ${d.m==='%'?'selected':''}>%</option><option value="$" ${d.m==='$'?'selected':''}>$</option></select><input type="number" min="0" data-ch="dv" data-k="${key}" value="${d.v}" aria-label="${L('הנחה','Discount')} ${tn(ty)}"></span></td>
        <td class="n"><strong>${usd(sh?total:total/t.pax,sh?0:2)}</strong></td></tr>`;
      if(op)r+=`<tr><td colspan="5" style="background:var(--recess)"><table class="tbl"><thead><tr><th>${L('שירות','Service')}</th><th>${L('ספק','Supplier')}</th><th class="n">${L('כמות','Qty')}</th><th class="n">${L('עלות יחידה','Unit cost')}</th><th class="n">${L('עלות','Cost')}</th><th class="n">${L('מרקאפ חריג','Markup override')}</th><th class="n">${L('מחיר $','Price $')}</th></tr></thead><tbody>${ls.map(x=>`<tr><td>${esc(x.l.name)}</td><td>${esc(x.l.sup)}</td><td class="n">${x.l.qty} ${x.l.unit}</td><td class="n"><span class="small muted">${x.l.cur}</span> <input type="number" min="0" step="1" data-ch="cost" data-v="${x.l.id}" value="${x.l.cost}" aria-label="${L('עלות יחידה','Unit cost')}"></td><td class="n">${money(planC(x.l),x.l.cur)}</td><td class="n"><input type="number" min="0" max="90" placeholder="${mkv}" data-ch="ov" data-v="${x.l.id}" value="${x.l.ov}" aria-label="${L('מרקאפ חריג','Markup override')}"></td><td class="n">${usd(x.price,2)}</td></tr>`).join('')}</tbody></table></td></tr>`;
      return r;}).join('');
    return {rows,tot,has:types.length>0};
  };
  const a=sect('s'),b=sect('p');
  const ex=t.basis==='cost'?L(`מרקאפ 25% על העלות הוא שולי רווח של ${pct(.25/1.25)} מהמחיר.`,`A 25% markup on cost is a ${pct(.25/1.25)} margin on price.`):L(`מרקאפ 25% מהמחיר פירושו מחיר שווה לעלות חלקי 0.75, כלומר ${pct(.25/.75)} מעל העלות.`,`A 25% markup of price means price equals cost divided by 0.75, that is ${pct(.25/.75)} above cost.`);
  const th=(first,lbl)=>`<thead><tr><th>${first}</th><th class="n">${lbl}</th><th class="n">Mark up</th><th class="n">Discount</th><th class="n">Total</th></tr></thead>`;
  return master(t,`<button class="btn pri" data-act="pt" data-v="quote">${L('צור הצעת מחיר','Create proposal')}</button>`)+`
  <div class="stats"><div class="stat"><div class="l">${L('מחיר ללקוח','Client price')}</div><div class="v">${usd(c.rev)}</div><div class="s">${usd(c.rev/t.pax,2)} ${L('לנוסע','per traveler')}</div></div><div class="stat"><div class="l">${L('עלות מתוכננת','Planned cost')}</div><div class="v">${usd(c.plan)}</div></div><div class="stat"><div class="l">${L('רווח מתוכנן','Planned profit')}</div><div class="v">${usd(c.planProfit)}</div><div class="s">${pct(c.planProfit/c.rev)} ${L('מהמחיר, כולל עמלות','of price, incl. commission')}</div></div><div class="stat"><div class="l">${L('עמלת ספקים צפויה','Expected supplier commission')}</div><div class="v">${usd(c.comm)}</div><div class="s">${L('לא מוצגת ללקוח','not shown to client')}</div></div>${c.disc?`<div class="stat"><div class="l">${L('הנחות','Discounts')}</div><div class="v">${usd(c.disc)}</div></div>`:''}</div>
  <div class="card sec"><div class="row" style="justify-content:space-between"><div class="row"><strong>${L('המרקאפ מחושב','Markup is calculated')}</strong><div class="row"><button class="btn sm ${t.basis==='cost'?'pri':''}" data-act="basis" data-v="cost">${L('על העלות','On cost')}</button><button class="btn sm ${t.basis==='price'?'pri':''}" data-act="basis" data-v="price">${L('מהמחיר','Of price')}</button></div></div>
    ${usdOnly?'':`<label class="row small muted">${L(`שער נעול, דולר ל-${cs}`,`Locked rate, USD per ${cs}`)}<input type="number" step="0.01" min="0.5" max="2" data-ch="rate" value="${t.rate}" aria-label="${L('שער נעול','Locked rate')}"></label>`}</div><p class="small muted" style="margin:8px 0 0">${usdOnly?L('כל הספקים בטיול הזה מחייבים בדולרים, אז אין חשיפה לשער חליפין.','Every supplier on this trip bills in USD, so there is no exchange-rate exposure.'):L(`עלויות הספקים ב-${cs} (טיסות וביטוח בדולרים), והמחיר ללקוח בדולרים לפי השער הנעול.`,`Supplier costs are in ${cs} (air and travel protection in USD); the client price is in dollars at the locked rate.`)} ${ex}</p></div>
  ${a.has?`<div class="card sec"><h3>${L('הוצאות משותפות','Shared expenses')}</h3><div class="scroll"><table class="tbl">${th(L('סוג השירות','Service type'),'Tot Global')}<tbody>${a.rows}</tbody><tfoot><tr><td>${L('סה"כ','Total')}</td><td></td><td></td><td></td><td class="n">${usd(a.tot)}</td></tr></tfoot></table></div></div>`:''}
  ${b.has?`<div class="card sec"><h3>${L('הוצאות פר אדם','Per-person expenses')}</h3><div class="scroll"><table class="tbl">${th(L('סוג השירות','Service type'),'Tot PP')}<tbody>${b.rows}</tbody><tfoot><tr><td>${L('סה"כ לאדם','Total per person')}</td><td></td><td></td><td></td><td class="n">${usd(b.tot/t.pax,2)}</td></tr><tr><td>${paxL(t.pax)}</td><td></td><td></td><td></td><td class="n">${usd(b.tot)}</td></tr></tfoot></table></div></div>`:''}`;
}

/* ---------- proposal document ---------- */
function pQuote(t){
  const c=calc(t),days=[...Array(t.nights+1).keys()].map(k=>k+1),owner=AGE[t.agent]||t.agent;
  const hues=['#1e6f7c','#b87a3a','#3b6fa5','#6a8f3a','#8a5aa8'];
  const dc=days.map(d=>{const dd=addDays(t.dep,d-1),its=t.items.filter(i=>i.day===d);return `<div class="dc"><div class="dimg" style="background:linear-gradient(135deg,${hues[d%5]},#e8c08a)"></div><b>DAY ${d}</b><div style="color:#667">${D(dd).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}</div><ul style="margin:6px 0 0;padding-left:18px">${its.map(i=>`<li>${esc(i.name)}</li>`).join('')||'<li>Free day</li>'}</ul></div>`;}).join('');
  const dep=r2(c.rev*t.pct/100);
  const sw=(k,l)=>`<label class="sw"><input type="checkbox" data-ch="sw" data-v="${k}" ${S[k]?'checked':''}>${l}</label>`;
  return master(t,`<span class="pill">PDF</span><span class="pill">${ic('lock')} slideshow</span><span class="pill">${ic('lock')} landing page</span><button class="btn" data-act="print">${ic('printer')} ${L('הדפסה / PDF','Print / PDF')}</button>`)+`<div class="pg rev" style="grid-template-columns:320px minmax(0,1fr)"><div class="doc"><div class="hero"><div class="logo"><span>R</span>${AGENCY}</div><h2>${esc(t.name)}</h2><div class="meta">${t.dep.slice(5,7)}/${t.dep.slice(8)}/${t.dep.slice(2,4)} - ${endOf(t).slice(5,7)}/${endOf(t).slice(8)}/${endOf(t).slice(2,4)} | ${t.nights+1} days, ${t.nights} nights | ${DESTS[t.dest].country} | ${t.pax} travelers</div><div class="meta" style="margin-top:12px">Sent by ${esc(owner)} on ${D(iso(TODAY)).toLocaleDateString('en-US')}</div></div>
    <div class="intro">Hello everyone and welcome! We are excited to host ${esc(t.client)} for a ${t.nights+1}-day journey to ${DESTS[t.dest].en}. This proposal covers the daily schedule, what is included and the price per traveler.</div>
    <div class="body"><h3>Itinerary</h3><div class="days">${dc}</div>
    ${S.showPP?`<h3 style="margin-top:18px">Price</h3><table><tr><td>Price per traveler</td><td><strong>${usd(c.rev/t.pax,2)}</strong></td></tr><tr><td>Group total (${t.pax} travelers)</td><td><strong>${usd(c.rev,2)}</strong></td></tr></table>`:''}
    ${S.showItems?`<h3 style="margin-top:18px">What is included</h3><ul>${TYPES.filter(ty=>c.byType[ty]).map(ty=>`<li>${({Lodging:'Hotel accommodation',Transport:DESTS[t.dest].air?'Group air and ground transportation':'Motorcoach transportation',Guide:'Professional guide',Activities:'Activities and entrances',Meals:'Group meals',Insurance:'Travel protection'})[ty]}</li>`).join('')}</ul>`:''}
    ${S.showSched?`<h3 style="margin-top:18px">Payment schedule</h3><table><tr><td>Deposit ${t.pct}% (due ${D(t.depDue).toLocaleDateString('en-US')})</td><td>${usd(dep,2)}</td></tr><tr><td>Balance (due ${D(t.balDue).toLocaleDateString('en-US')})</td><td>${usd(r2(c.rev-dep),2)}</td></tr></table>`:''}
    <p style="font-size:12px;color:#667;margin:14px 0 0">${AGENCY} · ${AGENCY_CITY} · fictional company for demonstration</p></div></div>
    <div class="card" style="order:-1"><h3>${ic('settings')} ${L('הגדרת קובץ','File settings')}</h3>${sw('showPP',L('הצג מחיר לנוסע וסך לקבוצה','Show price per traveler and group total'))}${sw('showItems',L('הצג מה כלול במחיר',"Show what's included"))}${sw('showSched',L('הצג לוח תשלומים','Show payment schedule'))}<p class="small muted">${L('עמלות ספקים ושולי רווח אף פעם לא מופיעים במסמך ללקוח.','Supplier commissions and margins never appear in the client document.')}</p>
    <div class="row" style="margin-top:12px"><button class="btn" data-act="pt" data-v="approve">${L('לשלב אישור ההצעה','To quote approval')}</button></div></div></div>`;
}

/* ---------- approval ---------- */
function pApprove(t){
  const steps=[['Draft',L('בבנייה','In progress')],['Approval',L('לאישור מנהל','Manager approval')],['Sent',L('נשלח ללקוח','Sent to client')],['Negotiating',L('ממתין לסגירה','Awaiting close')]];
  const cur=t.stage==='Quote'?steps.findIndex(s=>s[0]===(t.qst||'Draft')):4,c=calc(t);
  const st=steps.map((s,i)=>`<div class="tile" style="border:0"><span class="ring" style="--c:var(--${i<cur?'green':i===cur?'blue':'muted'})">${i<cur?ic('check'):i+1}</span><div class="l">${s[1]}</div></div>`).join('')+`<div class="tile" style="border:0"><span class="ring" style="--c:var(--${cur>=4?'green':'muted'})">${cur>=4?ic('check'):5}</span><div class="l">${L('תיק נפתח','File opened')}</div></div>`;
  let act='';
  if(t.stage!=='Quote')act=`<p>${L('ההצעה אושרה והתיק פעיל.','The quote is accepted and the file is live.')}</p><button class="btn" data-act="pt" data-v="ops">${L('לתפעול','To operations')}</button>`;
  else if((t.qst||'Draft')==='Draft')act=`<button class="btn pri" data-act="qs" data-v="Approval">${L('שלח לאישור מנהל','Send for manager approval')}</button>`;
  else if(t.qst==='Approval')act=S.role==='manager'?`<p>${L(`ההצעה ממתינה לאישורך. מחיר ${usd(c.rev)}, רווח מתוכנן ${pct(c.planProfit/c.rev)}.`,`The quote is waiting for your approval. Price ${usd(c.rev)}, planned margin ${pct(c.planProfit/c.rev)}.`)}</p><button class="btn grn" data-act="qs" data-v="Sent">${L('אשר ושלח ללקוח','Approve and send to client')}</button>`:`<p class="muted">${L('ההצעה ממתינה לאישור מנהל. רק מנהל יכול לאשר ולשלוח.','The quote is waiting for manager approval. Only a manager can approve and send it.')}</p>`;
  else if(t.qst==='Sent')act=`<p>${L(`ההצעה נשלחה ללקוח לפני ${t.qdays} ימים.`,`The quote was sent to the client ${t.qdays} days ago.`)}</p><button class="btn" data-act="qs" data-v="Negotiating">${L('הלקוח ביקש לסגור','Client asked to close')}</button>`;
  else act=`<p>${L('הלקוח מוכן לסגור.','The client is ready to close.')}</p>`;
  if(t.stage==='Quote'&&(t.qst==='Sent'||t.qst==='Negotiating'))act+=` <button class="btn grn" data-act="win" data-v="${t.id}">${L('הלקוח אישר: פתח תיק','Client accepted: open the file')}</button>`;
  return master(t)+`<div class="card appr"><div class="tiles" style="border:0;margin-bottom:6px">${st}</div><div class="row" style="padding:6px 4px">${act}</div></div>`;
}

/* ---------- operations ---------- */
function pOps(t){
  if(t.stage==='Quote')return gate(t,L('תפעול','Operations'));
  const od=t.tasks.filter(x=>!x.done&&D(x.due)<TODAY),dn2=t.tasks.filter(x=>x.done).length,op=t.tasks.filter(x=>!x.done&&D(x.due)>=TODAY).length;
  const who=w=>w==='Ops desk'?L('מחלקת תפעול','Ops desk'):agn(w);
  const tasks=t.tasks.map(x=>{const o=!x.done&&D(x.due)<TODAY;return `<tr><td><input type="checkbox" data-ch="task" data-v="${x.id}" ${x.done?'checked':''} aria-label="${esc(x.t)}"></td><td>${esc(x.t)}</td><td>${who(x.who)}</td><td>${fmtDate(x.due)}</td><td>${x.done?pillF(L('בוצע','Done'),'green'):o?pillF(L('באיחור','Overdue'),'red'):pillF(L('פתוח','Open'),'blue')}</td></tr>`;}).join('');
  const sups=t.sups.map((s,i)=>`<tr><td>${esc(s.n)}</td><td>${tn(s.cat)}</td><td><button class="btn sm" data-act="cyc" data-v="${i}">${pillF(supn(s.st),supCls(s.st))}</button></td></tr>`).join('');
  const k=Math.min(S.msgSup,t.sups.length-1),sp=t.sups[k],ln=t.lines.find(l=>l.id===sp.line);
  const msg=`Hello ${sp.n} team,\n\nPlease confirm the booking for our group of ${t.pax} travelers (${t.client}, arriving ${D(t.dep).toLocaleDateString('en-US')}): ${ln.name}, ${ln.qty} ${ln.unit} at ${money(ln.cost,ln.cur)}. A reply with your confirmation number and invoice details is all we need.\n\nThank you,\n${AGE[t.agent]}\n${AGENCY}`;
  const rm=t.room;
  return master(t)+`<div class="two"><div class="card"><h3>${L('תקציר יומי למנהלים','Daily manager digest')}</h3><p style="font-size:17px;font-weight:600">${L(`מחר: ${od.length} משימות באיחור, ${dn2} הושלמו, ${op} פתוחות.`,`Tomorrow: ${od.length} overdue tasks, ${dn2} done, ${op} open.`)}</p><p class="small muted">${od.length?L('באיחור: ','Overdue: ')+od.map(x=>esc(x.t)).join('; ')+'. ':L('אין משימות באיחור. ','No overdue tasks. ')}${L('נבנה מרשימת המשימות למטה.','Built from the task list below.')}</p></div>
  <div class="card"><h3>${L('בלוק חדרים במלון','Hotel room block')}</h3><p class="small muted">${esc(rm.hotel)}, ${fmtDate(t.dep)}</p><div class="prog"><div style="width:${rm.used/rm.held*100}%"></div></div><p class="small" style="margin-top:8px">${L(`${rm.used} מתוך ${rm.held} חדרים נוצלו מהבלוק. ${rm.held-rm.used} ניתנים לשחרור.`,`${rm.used} of ${rm.held} rooms used from the block. ${rm.held-rm.used} can be released.`)}</p></div></div>
  <div class="sec card"><h3>${L('רשימת משימות','Task list')}</h3><div class="scroll tall"><table class="tbl"><thead><tr><th></th><th>${L('משימה','Task')}</th><th>${L('אחראי','Owner')}</th><th>${L('דד-ליין','Due')}</th><th>${L('סטטוס','Status')}</th></tr></thead><tbody>${tasks}</tbody></table></div></div>
  <div class="two"><div class="card"><h3>${L('אישורי ספקים','Supplier confirmations')}</h3><p class="small muted">${L('לחצו על סטטוס כדי לשנות אותו.','Click a status to change it.')}</p><div class="scroll"><table class="tbl"><thead><tr><th>${L('ספק','Supplier')}</th><th>${L('קטגוריה','Category')}</th><th>${L('סטטוס','Status')}</th></tr></thead><tbody>${sups}</tbody></table></div></div>
  <div class="card"><h3>${L('תבנית הודעה לספק','Supplier message template')}</h3><label class="row small muted">${L('ספק','Supplier')} <select data-ch="msgsup">${t.sups.map((s,i)=>`<option value="${i}" ${i===k?'selected':''}>${esc(s.n)}</option>`).join('')}</select></label>
  <pre class="mail">${esc(msg)}</pre><button class="btn" data-act="copymsg">${L('העתק הודעה','Copy message')}</button></div></div>`;
}

/* ---------- travelers and billing ---------- */
function pPeople(t){
  if(t.stage==='Quote')return gate(t,L('נוסעים וחיוב','Travelers & billing'));
  const g=groupsCalc(t),c=calc(t),intl=DESTS[t.dest].intl;
  const shared=c.lines.filter(x=>x.l.scope==='shared').reduce((a,x)=>a+x.price,0);
  const rows=g.rows.map(r=>{const st=r.balPaid&&r.depPaid?pillF(L('שולם במלואו','Paid in full'),'green'):r.late>0?pillF(r.days===1?L('יום איחור','1 day late'):L(r.days+' ימי איחור',r.days+' days late'),'red'):r.depPaid?pillF(L('מקדמה שולמה','Deposit paid'),'blue'):pillF(L('טרם הגיע המועד','Not due yet'),'');
    return `<tr><td>${esc(r.name)}</td><td class="n">${r.size}</td><td class="n">${usd(r.amt,2)}</td><td class="n">${usd(r.paid,2)}</td><td class="n">${usd(r.open,2)}</td><td>${st}</td><td><button class="btn sm" data-act="link" data-v="${r.name.replace(/\W/g,'')}">${L('העתק קישור תשלום','Copy payment link')}</button></td></tr>`;}).join('');
  const dietN=t.trav.filter(x=>x.diet!=='None').length,passN=t.trav.filter(x=>x.pass==='Missing').length;
  const docL=intl?L('דרכון','Passport'):L('טופס חירום','Emergency form');
  const trav=t.trav.map(x=>`<tr><td>${x.room}</td><td>${esc(x.n)}</td><td>${esc(x.g)}</td><td>${dietn(x.diet)}</td><td>${x.pass==='Received'?pillF(L('התקבל','Received'),'green'):pillF(L('חסר','Missing'),'amber')}</td></tr>`).join('');
  return master(t)+`<p class="muted">${L('כל משק בית משלם עבור הנוסעים שלו בקישור אישי. הסכומים תמיד מתחברים למחיר ללקוח.','Each household pays for its own travelers through a personal link. The amounts always add up to the client price.')}</p>
  <div class="two"><div class="card"><h3>${L('איך מתחלקות העלויות המשותפות','How shared costs are split')}</h3><p>${L(`העלויות המשותפות (חדרים, אוטובוס, העברות, מדריך) מסתכמות ב-${usd(shared,2)} במחיר. הן מתחלקות שווה בשווה, כך שכל נוסע נושא ${usd(shared/t.pax,2)}.`,`Shared costs (rooms, coach, transfers, guide) come to ${usd(shared,2)} in the price. They are split equally, so each traveler carries ${usd(shared/t.pax,2)}.`)}</p><p class="small muted">${L('עלויות פר אדם, כמו טיסה, כרטיסים וארוחות, מחויבות לכל אחד ישירות.','Per-person costs such as air, tickets and meals are charged to each traveler directly.')}</p></div>
  <div class="card"><h3>${L('לוח תשלומים','Payment schedule')}</h3><div class="stats" style="margin:0"><div class="stat"><div class="l">${L('לנוסע','Per traveler')}</div><div class="v">${usd(g.perHead,2)}</div></div><div class="stat"><div class="l">${L('מקדמה','Deposit')} ${t.pct}%</div><div class="v">${usd(g.perHead*t.pct/100,2)}</div><div class="s">${L('עד','by')} ${fmtDate(t.depDue)}</div></div><div class="stat"><div class="l">${L('יתרה','Balance')}</div><div class="v">${usd(g.perHead*(100-t.pct)/100,2)}</div><div class="s">${L('עד','by')} ${fmtDate(t.balDue)}</div></div></div></div></div>
  <div class="sec card"><h3>${L('קבוצות חיוב','Billing groups')}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${L('משק בית','Household')}</th><th class="n">${L('נוסעים','Travelers')}</th><th class="n">${L('סה"כ','Total')}</th><th class="n">${L('שולם','Paid')}</th><th class="n">${L('פתוח','Open')}</th><th>${L('סטטוס','Status')}</th><th></th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td>${L('סה"כ','Total')}</td><td class="n">${g.rows.reduce((a,r)=>a+r.size,0)}</td><td class="n">${usd(c.rev,2)}</td><td class="n">${usd(g.collected,2)}</td><td class="n">${usd(g.outstanding,2)}</td><td></td><td></td></tr></tfoot></table></div></div>
  <div class="card"><h3>${L('רשימת חדרים ונוסעים','Rooming list and travelers')}</h3><p class="small muted">${L(`${t.trav.length} נוסעים, ${dietN} עם צרכי תזונה, ${passN} ${intl?'דרכונים חסרים':'טפסי חירום חסרים'}. הרשימה בפורמט שמלונות מבקשים.`,`${t.trav.length} travelers, ${dietN} with dietary needs, ${passN} ${intl?'passports':'emergency forms'} missing. The list is in the format hotels ask for.`)}</p><div class="scroll tall"><table class="tbl"><thead><tr><th>${L('חדר','Room')}</th><th>${L('נוסע','Traveler')}</th><th>${L('משק בית','Household')}</th><th>${L('תזונה','Diet')}</th><th>${docL}</th></tr></thead><tbody>${trav}</tbody></table></div></div>`;
}
