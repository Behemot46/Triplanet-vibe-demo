/* ---------- v8.4 Operations coordinator home (module oc, spec-v8.4-viewpoints.md §3.1 + §8) ----------
   Kelsey Dawson (role 'ops') sees every Operations trip and works the queue that keeps departures on track:
   1. Hero: % ready (mean dbReadiness of trips departing in 90 days), brief, open-next-departure and tasks buttons,
      four KPI tiles that scroll to their card.
   2. Departure readiness board, Tasks due, Suppliers to confirm, Rooming and blocks, Documents to send.
   Real-brand rule: a card that shows a real hotel or venue never carries negative wording (A11).
   Actions: oc-tick (task), oc-req (supplier request, through spSetFlow), oc-forms (opSendForms), oc-jump (scroll). */
const OC_WIN=90,OC_BRIEF=60,OC_BLOCK=45;
const ocByDep=(a,b)=>a.dep<b.dep?-1:a.dep>b.dep?1:0;
let OC_REAL=null;
function ocReal(name){
  if(!OC_REAL){OC_REAL=new Set();try{CATALOG.hotels.concat(CATALOG.venues).forEach(x=>OC_REAL.add(String(x.name).toLowerCase()));}catch(e){}}
  const k=String(name||'').toLowerCase();
  if(OC_REAL.has(k))return true;
  try{const s=supByName(name);return !!(s&&s.real);}catch(e){return false;}
}
const ocFormN=t=>(t.trav||[]).reduce((a,x)=>a+(x.form?['reg','med','waiver'].filter(k=>x.form[k]!=='done').length:0),0);
const ocFormTrav=t=>(t.trav||[]).filter(x=>x.form&&['reg','med','waiver'].some(k=>x.form[k]!=='done')).length;
const ocFormNotSent=t=>(t.trav||[]).reduce((a,x)=>a+(x.form?['reg','med','waiver'].filter(k=>x.form[k]==='not sent').length:0),0);
const ocSupsOpen=t=>(t.sups||[]).map((s,i)=>({t,s,i,f:spFlow(s)})).filter(z=>z.f!=='approved');
const ocRoomList=t=>{const r=(t.tasks||[]).filter(x=>/rooming list/i.test(x.t||''));return r.length?r.every(x=>x.done):false;};
/* every figure on the page comes from here, so the tests can recompute it */
function ocModel(){
  const today=iso(TODAY),ops=visibleTrips().filter(t=>t.stage==='Operations').sort(ocByDep);
  const hi=addDays(today,OC_WIN),win=ops.filter(t=>t.dep>=today&&t.dep<=hi);
  const gauge=win.length?Math.round(win.reduce((a,t)=>a+dbReadiness(t).overall,0)/win.length):100;
  const tasks=dbTasks(ops,7),overdue=tasks.filter(z=>z.over).length;
  const sups=ops.reduce((a,t)=>a.concat(ocSupsOpen(t)),[]);
  const blocks=ops.filter(t=>t.room).map(t=>({t,b:blockOf(t),rr:releaseRisk(t),sent:ocRoomList(t)})).sort((a,b)=>a.b.cutoff<b.b.cutoff?-1:1);
  const hi45=addDays(today,OC_BLOCK),rel=blocks.filter(z=>z.b.cutoff>=today&&z.b.cutoff<=hi45);
  const forms=ops.reduce((a,t)=>a+ocFormN(t),0),formsTrav=ops.reduce((a,t)=>a+ocFormTrav(t),0);
  const hi60=addDays(today,OC_BRIEF),soon=ops.filter(t=>t.dep>=today&&t.dep<=hi60);
  const nx=ops.find(t=>t.dep>=today)||ops[0]||null;
  const fRows=ops.map(t=>({t,n:ocFormNotSent(t),miss:ocFormN(t),trav:ocFormTrav(t)})).filter(r=>r.miss>0);
  const vRows=ops.map(t=>({t,n:(t.sups||[]).filter(s=>spFlow(s)==='approved').length})).filter(r=>r.n>0);
  return {ops,win,gauge,tasks,overdue,sups,blocks,rel,forms,formsTrav,soon,nx,fRows,vRows,today};
}
const ocDays=t=>Math.round((D(t.dep)-TODAY)/DAY);

function ocHero(m){
  const nx=m.nx,first=m.soon[0]||nx,fs=first?ocSupsOpen(first).length:0;
  const brief=m.soon.length
    ?L(`${hlKey(m.soon.length)} יציאות ב-${OC_BRIEF} הימים הקרובים. ${esc(first.name)} יוצאת ${hcIn(ocDays(first))}${fs?`, ו-${hlWarn(fs)} ספקים עוד לאישור`:', וכל הספקים מאושרים'}.`,
       `${hlKey(m.soon.length)} ${m.soon.length===1?'departure':'departures'} in the next ${OC_BRIEF} days. ${esc(first.name)} leaves ${hcIn(ocDays(first))}${fs?` with ${hlWarn(fs)} ${PLN(fs,'supplier','suppliers')} to confirm`:' and every supplier is approved'}.`)
    :nx?L(`אין יציאות ב-${OC_BRIEF} הימים הקרובים. היציאה הבאה: ${esc(nx.name)}, ${hcIn(ocDays(nx))}.`,`No departures in the next ${OC_BRIEF} days. Next up: ${esc(nx.name)}, ${hcIn(ocDays(nx))}.`)
    :L('אין כרגע קבוצות בתפעול.','No groups are in operations right now.');
  const cta=[];
  if(nx)cta.push(hcCta('mint','arrup',L('לפתוח את היציאה הבאה','Open next departure'),`data-act="open" data-v="${nx.id}" data-pt="odash"`));
  cta.push(hcCta('ghost','checklist',L('משימות השבוע','Tasks this week'),'data-act="oc-jump" data-v="tasks"'));
  const supTrips=new Set(m.sups.map(z=>z.t.id)).size;
  return hcShell({cls:'oc-hero',role:L('תפעול','Operations'),aria:L('תמונת מצב תפעולית','Operations overview'),brief,ctas:cta,
    gauge:{pct:m.gauge,label:L('מוכנות ליציאות ב-90 יום','ready, departures in 90 days'),lines:[
      {cls:'oc-r',icon:'clock',lab:L('משימות באיחור','Tasks overdue'),val:m.overdue},
      {cls:'oc-a',icon:'hourglass',lab:L('ספקים לאישור','Suppliers to confirm'),val:m.sups.length},
      {cls:'oc-f',icon:'document',lab:L('טפסים חסרים','Forms missing'),val:m.forms}]},
    kpis:[{lab:L('משימות השבוע','Tasks due this week'),val:m.tasks.length,sub:m.overdue?L(`${m.overdue} באיחור`,`${m.overdue} overdue`):L('כולן בזמן','all on time'),cls:m.overdue?'warn':'',act:'oc-jump',v:'tasks'},
      {lab:L('ספקים לאישור','Suppliers to confirm'),val:m.sups.length,sub:L(`ב-${supTrips} קבוצות`,`across ${supTrips} ${PLN(supTrips,'group','groups')}`),act:'oc-jump',v:'sups'},
      {lab:L(`בלוקי חדרים לשחרור ב-${OC_BLOCK} יום`,`Room blocks releasing in ${OC_BLOCK} days`),val:m.rel.length,sub:m.rel.length?L(`הראשון ב-${fmtDate(m.rel[0].b.cutoff)}`,`first on ${fmtDate(m.rel[0].b.cutoff)}`):L('אין בקרוב','none soon'),act:'oc-jump',v:'blocks'},
      {lab:L('טפסי נוסעים חסרים','Traveler forms missing'),val:m.forms,sub:L(`אצל ${m.formsTrav} נוסעים`,`for ${m.formsTrav} ${PLN(m.formsTrav,'traveler','travelers')}`),act:'oc-jump',v:'docs'}]});
}

function ocBoard(m){
  if(!m.ops.length)return '';
  const rows=m.ops.map(t=>{const r=dbReadiness(t),d=ocDays(t),over=(t.tasks||[]).filter(x=>!x.done&&x.due<m.today).length,su=ocSupsOpen(t).length,fm=ocFormTrav(t),b=blockOf(t);
    const cls=r.overall>=75?'ok':r.overall>=50?'mid':'low';
    return `<tr><td><b><bdi>${esc(t.name)}</bdi></b><div class="muted small">${fmtDate(t.dep)} · ${dn(t.dest)}</div></td>
     <td><span class="oc-rd ${cls}">${hcRing(r.overall,40,'sm')}<b>${r.overall}%</b></span></td>
     <td class="n">${d>=0?hcIn(d):L('יצאה','departed')}</td><td class="n">${t.pax}</td>
     <td class="n">${r.nOpen}${over?` <span class="oc-ov">${L(`(${over} באיחור)`,`(${over} overdue)`)}</span>`:''}</td>
     <td class="n">${su}</td><td class="n">${fm}</td>
     <td class="small">${b?(b.cutoff>=m.today?L(`שחרור ${fmtDate(b.cutoff)}`,`Releases ${fmtDate(b.cutoff)}`):L('מועד השחרור עבר','Release date passed')):'–'}</td>
     <td><button class="btn sm" data-act="open" data-v="${t.id}" data-pt="odash">${L('פתיחה','Open')}</button></td></tr>`;}).join('');
  return `<div class="card hc-card oc-board" id="oc-board"><div class="hc-h"><h3>${L('לוח מוכנות ליציאות','Departure readiness board')}</h3><span class="muted small">${L('הטבעת: משימות, דרכונים, ספקים ומקדמות','Ring: tasks, passports, suppliers and deposits')}</span></div>
   <div class="scroll"><table class="tbl oc-tbl"><thead><tr><th>${L('קבוצה','Group')}</th><th>${L('מוכנות','Ready')}</th><th>${L('יציאה','Departs')}</th><th>${L('נוסעים','Pax')}</th><th>${L('משימות פתוחות','Open tasks')}</th><th>${L('ספקים לאישור','Suppliers')}</th><th>${L('טפסים','Forms')}</th><th>${L('שחרור בלוק','Block')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function ocTasks(m){
  if(!m.tasks.length)return '';
  const rows=m.tasks.slice(0,8).map((z,i)=>`<li class="${z.over?'urgent':'todo'}" style="--d:${i*50}ms"><span class="hc-dot"></span><div><b>${esc(opTaskName(z.x))}</b>
    <button class="hc-trip" data-act="open" data-v="${z.t.id}" data-pt="optasks"><bdi>${esc(z.t.name)}</bdi> · ${z.over?`<span class="oc-ov">${L('באיחור','overdue')} · </span>`:''}${fmtDate(z.x.due)} · ${opWhoL(z.x)}</button></div>
    <button class="btn sm" data-act="oc-tick" data-v="${z.t.id}|${z.x.id}" aria-label="${L('סימון כבוצע','Mark done')}">${ic('check')} ${L('בוצע','Done')}</button></li>`).join('');
  return `<div class="card hc-card oc-tasks" id="oc-tasks"><div class="hc-h"><h3>${L('משימות לביצוע','Tasks due')}</h3>${m.overdue?`<span class="hc-pill red">${L(`${m.overdue} באיחור`,`${m.overdue} overdue`)}</span>`:`<span class="hc-pill blue">${L('השבוע','This week')}</span>`}</div>
   <ol class="hc-steps">${rows}</ol>${m.tasks.length>8?`<p class="muted small">${L(`ועוד ${m.tasks.length-8} משימות`,`and ${m.tasks.length-8} more`)}</p>`:''}</div>`;
}

function ocSups(m){
  if(!m.sups.length)return '';
  const perm=spCan('ops.suppliers');
  const rows=m.sups.slice(0,10).map(z=>{
    const act=z.f==='contact'?`<button class="btn sm" data-act="oc-req" data-v="${z.t.id}|${z.i}" ${perm?'':'disabled'}>${ic('mail')} ${L('שליחת בקשה','Send request')}</button>`:`<span class="muted small">${L('הבקשה נשלחה','Request sent')}</span>`;
    return `<li class="todo"><span class="hc-dot"></span><div><b>${esc(z.s.n)}</b><button class="hc-trip" data-act="open" data-v="${z.t.id}" data-pt="spm"><bdi>${esc(z.t.name)}</bdi> · ${esc(z.s.cat||'')} · <span class="oc-fl">${spFlowL(z.f)}</span></button></div>${act}</li>`;}).join('');
  return `<div class="card hc-card oc-sups" id="oc-sups"><div class="hc-h"><h3>${L('ספקים לאישור','Suppliers to confirm')}</h3><span class="hc-pill blue">${m.sups.length}</span></div>
   <ol class="hc-steps">${rows}</ol>${m.sups.length>10?`<p class="muted small">${L(`ועוד ${m.sups.length-10} ספקים`,`and ${m.sups.length-10} more`)}</p>`:''}</div>`;
}

function ocBlocks(m){
  if(!m.blocks.length)return '';
  const rows=m.blocks.map(z=>{const b=z.b,real=ocReal(b.hotel),past=b.cutoff<m.today;
    const when=past?L('מועד השחרור עבר','Release date passed'):L(`שחרור ב-${fmtDate(b.cutoff)}`,`Releases on ${fmtDate(b.cutoff)}`);
    const expo=z.rr&&!real?` · ${hlNeg(L('עלות חדרים שלא נוצלו ','Unused rooms cost ')+usd(z.rr.amt))}`:'';
    return `<div class="oc-bk"><div class="oc-bh"><b><bdi>${esc(b.hotel)}</bdi></b><span class="muted small"><bdi>${esc(z.t.name)}</bdi></span></div>
     <div class="oc-bn"><span>${L('בלוק','Held')} <b>${b.held}</b></span><span>${L('נבחרו','Picked')} <b>${b.picked}</b></span><span>${L('פנויים','Open')} <b>${b.open}</b></span></div>
     <div class="oc-bw small">${when}${expo}</div>
     <div>${pillF(z.sent?L('רשימת חדרים נשלחה','Rooming list sent'):L('רשימת חדרים לא נשלחה','Rooming list not sent'),z.sent?'green':'')}</div></div>`;}).join('');
  return `<div class="card hc-card oc-blocks" id="oc-blocks"><div class="hc-h"><h3>${L('חדרים ובלוקים','Rooming and blocks')}</h3><span class="muted small">${L('מועד שחרור = 30 יום לפני היציאה','Release date = 30 days before departure')}</span></div>${rows}</div>`;
}

function ocDocs(m){
  if(!m.fRows.length&&!m.vRows.length)return '';
  const fr=m.fRows.map(r=>`<li class="${r.n?'todo':'info'}"><span class="hc-dot"></span><div><b><bdi>${esc(r.t.name)}</bdi></b><span class="muted small">${r.n?L(`${r.n} טפסים טרם נשלחו`,`${r.n} ${PLN(r.n,'form','forms')} not sent yet`):L(`${r.miss} טפסים נשלחו וממתינים לנוסעים`,`${r.miss} ${PLN(r.miss,'form','forms')} sent, with the travelers`)}</span></div>
    ${r.n?`<button class="btn sm" data-act="oc-forms" data-v="${r.t.id}">${ic('mail')} ${L('שליחת טפסים','Send forms')}</button>`:`<button class="btn sm" data-act="open" data-v="${r.t.id}" data-pt="manifest">${L('לרשימת הנוסעים','Master list')}</button>`}</li>`).join('');
  const vr=m.vRows.map(r=>`<li class="info"><span class="hc-dot"></span><div><b><bdi>${esc(r.t.name)}</bdi></b><span class="muted small">${L(`${r.n} שוברים להנפקה`,`${r.n} ${PLN(r.n,'voucher','vouchers')} to issue`)}</span></div>
    <button class="btn sm" data-act="open" data-v="${r.t.id}" data-pt="vouch">${L('לשוברים','Vouchers')}</button></li>`).join('');
  return `<div class="card hc-card oc-docs" id="oc-docs"><div class="hc-h"><h3>${L('מסמכים לשליחה','Documents to send')}</h3><span class="hc-pill blue">${m.forms} ${L('טפסים','forms')}</span></div>
   <ol class="hc-steps">${fr}${vr}</ol></div>`;
}

function hcOps(){
  const m=ocModel();
  if(!m.ops.length)return `<div class="hc${hpAnim()?' anim':''}">${ocHero(m)}<div class="card hc-card"><p class="muted">${L('אין כרגע קבוצות בתפעול. כשהצעה מאושרת, היא תופיע כאן.','No groups are in operations right now. An approved quote shows up here.')}</p></div></div>`;
  return `<div class="hc oc${hpAnim()?' anim':''}">${ocHero(m)}
   <div class="hc-grid"><div class="hc-c12">${ocBoard(m)}</div>
    <div class="hc-c7">${ocTasks(m)}${ocSups(m)}</div><div class="hc-c5">${ocBlocks(m)}${ocDocs(m)}</div></div></div>`;
}

{const h1=VIEWS.home;VIEWS.home=function(){return isOps()?hcOps():h1.apply(this,arguments);};}

document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="oc-"]');if(!b)return;const a=b.dataset.act,v=b.dataset.v||'';
  if(a==='oc-jump'){const el=document.getElementById('oc-'+v)||document.getElementById('oc-board');if(el){let rm=false;try{rm=window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(x){}
    try{el.scrollIntoView({block:'start',behavior:rm?'auto':'smooth'});}catch(x){}}return;}
  const p=v.split('|'),t=byId(p[0]);if(!t)return;
  if(a==='oc-tick'){const x=t.tasks.find(y=>y.id===+p[1]),r=opToggleTask(t,p[1]);render();if(r!=null)toast(L(`סומן כבוצע: ${opTaskName(x)}`,`Marked done: ${opTaskName(x)}`));}
  else if(a==='oc-req'){if(!spCan('ops.suppliers')){toast(L('התפקיד שלך לא כולל אישור ספקים','Your role cannot change suppliers'));return;}
    const s=t.sups[+p[1]];if(s&&spSetFlow(t,+p[1],'pending')){render();toast(L(`בקשה נשלחה ל-${s.n} (הדגמה)`,`Request sent to ${s.n} (demo)`));}}
  else if(a==='oc-forms'){opSendForms(t);render();}
});

/* ---------- tests ---------- */
TESTS.push({name:'oc operations home',run:h=>{const out=[],S=h.S,r0=S.role,l0=S.lang;
  const recompute=()=>{const today=iso(TODAY),ops=TRIPS.filter(t=>t.stage==='Operations');
    const win=ops.filter(t=>t.dep>=today&&t.dep<=addDays(today,90));
    const tk=ops.reduce((a,t)=>a+t.tasks.filter(x=>!x.done&&x.due<=addDays(today,7)).length,0);
    const su=ops.reduce((a,t)=>a+t.sups.filter(s=>spFlow(s)!=='approved').length,0);
    const bl=ops.filter(t=>{if(!t.room)return false;const c=addDays(t.dep,-30);return c>=today&&c<=addDays(today,45);}).length;
    const fm=ops.reduce((a,t)=>a+(t.trav||[]).reduce((b,x)=>b+(x.form?['reg','med','waiver'].filter(k=>x.form[k]!=='done').length:0),0),0);
    return {g:win.length?Math.round(win.reduce((a,t)=>a+dbReadiness(t).overall,0)/win.length):100,tk,su,bl,fm,n:ops.length};};
  S.role='ops';
  try{
    const m=ocModel(),c=recompute();
    if(m.gauge!==c.g)out.push('oc gauge '+m.gauge+' vs '+c.g);
    if(m.tasks.length!==c.tk)out.push('oc tasks '+m.tasks.length+' vs '+c.tk);
    if(m.sups.length!==c.su)out.push('oc suppliers '+m.sups.length+' vs '+c.su);
    if(m.rel.length!==c.bl)out.push('oc blocks '+m.rel.length+' vs '+c.bl);
    if(m.forms!==c.fm)out.push('oc forms '+m.forms+' vs '+c.fm);
    if(m.ops.length!==c.n)out.push('oc trip set');
    if(!m.ops.length)out.push('oc: no Operations trips');
    const BAD=/unconfirmed|overdue|exposure|\blate\b|risk|query|\bgap\b|dispute|overbill/i;
    const names=[...new Set([...(typeof CATALOG!=='undefined'?CATALOG.hotels.concat(CATALOG.venues).map(x=>x.name):[]),...TRIPS.map(t=>t.room&&t.room.hotel).filter(Boolean),...TRIPS.reduce((a,t)=>a.concat((t.sups||[]).map(s=>s.n)),[])])].filter(n=>ocReal(n));
    let realSeen=0;
    for(const lang of ['en','he']){S.lang=lang;
      const hh=VIEWS.home();h.chk(hh,'oc '+lang);if(lang==='en')h.scan(hh,'oc home');
      if(!hh.includes('oc-hero'))out.push('oc hero missing '+lang);
      if(!hh.includes('hc-kpis'))out.push('oc kpis missing '+lang);
      /* real-brand guard (A11): no real name in a card or table row that carries negative wording */
      if(lang==='en'){hh.split('<div class="card hc-card').slice(1).forEach(cd=>{
        (cd.includes('<table')?cd.split('</tr>'):[cd]).forEach(pc=>{const txt=pc.replace(/<[^>]+>/g,' ');
          names.forEach(n=>{if(txt.includes(esc(n))||txt.includes(n)){realSeen++;const mm=txt.match(BAD);if(mm)out.push('oc real brand "'+n+'" next to "'+mm[0]+'"');}});});});}
    }
    if(!realSeen)out.push('oc guard saw no real name (guard is not testing anything)');
    S.lang='en';
    /* the Finance page is closed to ops and hidden from the sidebar */
    S.tab='home';S.menu=true;render();const app=h.els.app.innerHTML;S.menu=false;
    if(/<button[^>]*data-v="finance"/.test(app)&&/class="[^"]*\bnav\b[^"]*"[^>]*data-v="finance"|data-v="finance"[^>]*class="[^"]*\bnav\b/.test(app))out.push('oc: Finance is in the ops sidebar');
    if(!/No access/.test(VIEWS.finance()))out.push('oc: VIEWS.finance() is not noAccess for ops');
    /* the supplier request goes through spSetFlow and lands on Pending */
    const z=m.sups.find(q=>q.f==='contact');
    if(z){const s=z.t.sups[z.i],st=s.st,fl=s.flow;spSetFlow(z.t,z.i,'pending');if(spFlow(s)!=='pending')out.push('oc request does not move the flow to pending');s.st=st;s.flow=fl;}
  }catch(e){out.push('oc '+e.stack.split('\n').slice(0,3).join('|'));}
  S.role=r0;S.lang=l0;return out;}});

/* developer notes */
SPEC['home:ops']={title:'Home, operations coordinator',
  purpose:'Give the operations coordinator one screen that shows which departures are ready, and the tasks, suppliers, room blocks and documents that still need her.',
  roles:{view:['ops','manager'],act:['ops']},perms:['proj.viewAll','ops.tasks','ops.suppliers','ops.manifest','forms.build'],
  data:['Trip.stage','Trip.dep','Trip.tasks','Trip.sups','Trip.room','Trip.trav.form','Trip.trav.pass','Group.depPaid'],
  actions:[{label:'Open next departure',does:'Opens the operation dashboard of the nearest Operations trip',rule:'First Operations trip with dep >= today'},
    {label:'Tasks this week / tile',does:'Scrolls to the Tasks due card',rule:'Open tasks with due <= today + 7 days, overdue first'},
    {label:'Done (task)',does:'Marks the task done (opToggleTask)',rule:'Requires ops.tasks (matrix only)'},
    {label:'Send request (supplier)',does:'Moves the supplier to Pending (spSetFlow) and toasts',rule:'Requires ops.suppliers; contact-stage suppliers only'},
    {label:'Send forms',does:'Marks "not sent" traveler forms as sent (opSendForms), copies the link',rule:'Per trip'}],
  rules:['Gauge = mean dbReadiness(t).overall of Operations trips departing within 90 days','Suppliers to confirm = t.sups with spFlow(s) !== "approved"','Blocks releasing = blockOf(t).cutoff within 45 days of today','Forms missing = traveler form values (registration, medical, waiver) that are not "done"','Vouchers to issue = approved suppliers on Operations trips','Real hotels and venues never appear next to negative wording; exposure shows only after the release date and only for fictional hotels'],
  states:{empty:'No Operations trips: a card says approved quotes appear here.',loading:'Not applicable (local data).',error:'Cards with nothing to do are hidden.'},
  status:'pilot',api:['GET /v1/t/{tenantId}/dashboard/operations (proposed)','PATCH /v1/t/{tenantId}/trips/{id}/suppliers/{n} (proposed)'],
  tests:['TEST oc operations home'],code:['v6/s13_oc.js: hcOps, ocModel, ocBoard, ocTasks, ocSups, ocBlocks, ocDocs','v6/m_oc.css']};
