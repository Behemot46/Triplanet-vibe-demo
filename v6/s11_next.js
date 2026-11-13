/* ---------- v8.1 module nx: "what do I do next" computed from data ----------
   nextSteps(t) is pure: it reads the trip and returns an ordered list of {k,sev,he,en,act:{a,v,pt?},label:[he,en]}.
   Rules (spec-v8.1 row nx):
   - Quote Draft: a line without cost or supplier -> costs; else send for approval. Approval: manager approves, others wait (info).
     Sent: qdays>7 follow up, else info. Negotiating: record the client's answer.
   - Operations: overdue tasks, missing passports (international), forms not done, suppliers not confirmed, late payments (groupsCalc),
     room block open with cutoff within 30 days.
   - Finance: invoices waiting, open gaps, open balance, else "close the file" (info). Closed: none.
   Severity: urgent = overdue / late / past cutoff / follow-up due; info = nothing for this person to do. */
/* ---------- stage moves: named, guarded, reused by the status menu, the dashboard control and the next-step bar ----------
   stmCheck(t,mv) -> {ok,why:[{he,en}]} for mv = 'lost' (Quote -> Lost), 'fin' (Operations -> Finance), 'close' (Finance -> Closed).
   fin needs the return date to have passed; close needs no open gaps, nothing in the supplier-invoice inbox and no balance to collect. */
const stmReturned=t=>!!t&&endOf(t)<=iso(TODAY);
const stmOpenGaps=t=>tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0);
function stmCheck(t,mv){
  const why=[],add=(he,en)=>why.push({he,en});
  if(!t){add('אין תיק','No file');return {ok:false,why};}
  if(mv==='lost'){if(t.stage!=='Quote'||t.qst==='Lost')add('אפשר לסמן כאבודה רק הצעה פתוחה','Only an open quote can be marked lost');}
  else if(mv==='fin'){
    if(t.stage!=='Operations')add('רק תיק בתפעול עובר לסגירה כספית','Only a file in operations can move to financial close');
    else if(!stmReturned(t))add(`הטיול חוזר ב-${fmtDate(endOf(t))}. אפשר לעבור לסגירה כספית אחרי החזרה`,`The trip returns on ${fmtDate(endOf(t))}. It can move to financial close after it returns`);}
  else if(mv==='close'){
    if(t.stage!=='Finance')add('רק תיק בסגירה כספית אפשר לסגור','Only a file in financial close can be closed');
    else{const ni=(t.inbox||[]).length,gp=stmOpenGaps(t),g=t.groups&&t.groups.length?groupsCalc(t):null;
      if(ni)add(`${ni} חשבוניות ספקים ממתינות לבדיקה`,`${ni} supplier invoice${ni>1?'s are':' is'} waiting to be checked`);
      if(gp.length)add(`${gp.length} פערי חשבוניות פתוחים, ${usd(r2(gp.reduce((s,x)=>s+x.usd,0)))}`,`${gp.length} open invoice gap${gp.length>1?'s':''}, ${usd(r2(gp.reduce((s,x)=>s+x.usd,0)))}`);
      if(g&&g.outstanding>0.005)add(`יתרה לגבייה: ${usd(g.outstanding)}`,`Open balance to collect: ${usd(g.outstanding)}`);}}
  else add('מעבר לא מוכר','Unknown move');
  return {ok:!why.length,why};
}
/* Operations -> Finance (only after the trip returned), Finance -> Closed (only when nothing is open) */
function advanceStage(t){
  const mv=t&&t.stage==='Finance'?'close':'fin',r=stmCheck(t,mv);
  if(!r.ok)return {ok:false,mv,why:r.why};
  const from=t.stage;t.stage=mv==='fin'?'Finance':'Closed';
  return {ok:true,mv,from,to:t.stage,why:[]};
}
/* an open quote the client turned down: stage stays Quote, status becomes Lost, and it leaves every open-quote total */
function markLost(t){
  const r=stmCheck(t,'lost');if(!r.ok)return {ok:false,mv:'lost',why:r.why};
  t.qst='Lost';t.qdays=0;return {ok:true,mv:'lost',from:'Quote',to:'Lost',why:[]};
}
function stmGo(mv,id){
  const t=id?byId(id):T();if(!t)return false;
  const r=mv==='lost'?markLost(t):mv==='fin'||mv==='close'||mv==='advance'?advanceStage(t):{ok:false,why:[{he:'מעבר לא מוכר',en:'Unknown move'}]};
  S.pjMenu=false;
  if(r.ok){if(r.to==='Finance')S.ptab='fdash';
    render();toast(r.mv==='lost'?L('ההצעה סומנה כאבודה','The quote is marked lost'):r.to==='Finance'?L('התיק עבר לסגירה כספית','The file moved to financial close'):L('התיק נסגר','The file is closed'));}
  else{render();toast(L('אי אפשר לעבור עדיין: ','Cannot move yet: ')+r.why.map(w=>L(w.he,w.en)).join('; '));}
  return r.ok;
}
/* the moves the project status menu offers for a trip, each with its guard result */
function stmMoves(t){
  const m=(mv,he,en,dhe,den)=>{const r=stmCheck(t,mv);return {mv,he,en,dhe,den,ok:r.ok,why:r.why};};
  if(t.stage==='Quote')return t.qst==='Lost'?[]:[m('lost','סימון כאבודה','Mark as lost','הלקוח לא אישר. ההצעה יוצאת מסכומי ההצעות הפתוחות.','The client did not accept. The quote leaves the open-quote totals.')];
  if(t.stage==='Operations')return [m('fin','מעבר לסגירה כספית','Move to financial close','הטיול חזר. מעבירים לבדיקת חשבוניות וגבייה.','The trip is back. Moves to invoice checks and collection.')];
  if(t.stage==='Finance')return [m('close','סגירת התיק','Close the file','הכול מסודר. התיק עובר לארכיון.','Everything is settled. The file moves to the archive.')];
  return [];
}
/* Operation dashboard: the explicit control, shown only once the trip has returned */
{const f0=pOpsDash;pOpsDash=function(t){const h=f0.apply(this,arguments);
  if(!t||t.stage!=='Operations'||!stmReturned(t))return h;
  return `<div class="card stm-card"><div><b>${L('הטיול חזר','The trip is back')}</b><div class="small muted">${L('מעבירים את התיק לסגירה כספית: בדיקת חשבוניות ספקים וגבייה.','Move the file to financial close: supplier invoice checks and collection.')}</div></div><button class="btn pri" data-act="advance" data-v="${t.id}">${L('מעבר לסגירה כספית','Move to financial close')}</button></div>`+h;};}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]'),a=b&&b.dataset.act;
  if(a==='pjmenu'){S.pjMenu=!S.pjMenu;render();return;}
  if(a==='pjmove'){if(!b.disabled)stmGo(b.dataset.v);return;}
  if(a==='advance'){stmGo('advance',b.dataset.v);return;}
  if(S.pjMenu&&!(e.target.closest&&e.target.closest('.pj-stwrap'))){S.pjMenu=false;if(document.querySelector('.pj-menu'))render();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.pjMenu){S.pjMenu=false;render();}});
const NX_SEV={urgent:0,todo:1,info:2};
function nextSteps(t){
  const out=[],T0=iso(TODAY);
  const add=(k,sev,he,en,act,label)=>out.push({k,sev,he,en,act,label});
  const pt=v=>({a:'pt',v});
  if(!t)return out;
  if(t.stage==='Quote'){
    if(t.qst==='Lost')return out;
    const q=t.qst||'Draft',nm=t.client||'',d=t.qdays||0;
    if(q==='Draft'){
      const bad=(t.lines||[]).filter(l=>!l.extra&&(!(l.cost>0)||!l.sup)).length;
      if(bad)add('price','todo',`להשלים את התמחור: ${bad} שורות בלי עלות או ספק`,`Finish pricing: ${bad} line${bad>1?'s':''} without a cost or supplier`,pt('costs'),['לתמחור','Open pricing']);
      else add('send','todo','התמחור מוכן. שלחו לאישור מנהל','Pricing is complete. Send it for manager approval',pt('approve'),['שליחה לאישור','Send for approval']);
    }else if(q==='Approval'){
      if(canApprove())add('approve','urgent','ההצעה ממתינה לאישורך','This quote is waiting for your approval',pt('approve'),['אישור ההצעה','Approve this quote']);
      else add('wait','info',`ממתין לאישור הבעלים (${d} ימים)`,`Waiting for the owner's approval (${d} day${d===1?'':'s'})`,pt('approve'),['לסטטוס','View status']);
    }else if(q==='Sent'){
      if(d>7)add('follow','urgent',`לחזור ללקוח ${nm} (ההצעה נשלחה לפני ${d} ימים)`,`Follow up with ${nm} (sent ${d} days ago)`,pt('quote'),['להצעה','Open the proposal']);
      else add('await','info',`ההצעה נשלחה לפני ${d} ימים. ממתינים ללקוח`,`The proposal was sent ${d} day${d===1?'':'s'} ago. Waiting for the client`,pt('approve'),['לסטטוס','View status']);
    }else if(q==='Negotiating')add('answer','todo','לרשום את תשובת הלקוח','Record the client\'s answer',pt('approve'),['לרישום','Record the answer']);
    return out;
  }
  if(t.stage==='Operations'){
    if(stmReturned(t))add('finclose','todo','הטיול חזר. מעבירים את התיק לסגירה כספית','The trip is back. Move the file to financial close',{a:'advance',v:t.id},['מעבר לסגירה כספית','Move to financial close']);
    const od=(t.tasks||[]).filter(x=>!x.done&&x.due<T0).length;
    if(od)add('tasks','urgent',`${od} משימות באיחור`,`${od} overdue task${od>1?'s':''}`,pt('optasks'),['למשימות','Open tasks']);
    const tr=t.trav||[],intl=!!(DESTS[t.dest]&&DESTS[t.dest].intl),mp=intl?tr.filter(x=>x.pass==='Missing').length:0;
    if(mp)add('pass','todo',`${mp} דרכונים חסרים`,`${mp} passport${mp>1?'s':''} missing`,pt('manifest'),['לרשימת הנוסעים','Open the master list']);
    const nf=tr.filter(x=>x.form&&['reg','med','waiver'].some(k=>x.form[k]!=='done')).length;
    if(nf)add('forms','todo',`${nf} נוסעים לא השלימו טפסים`,`${nf} traveler${nf>1?'s have':' has'} unfinished forms`,pt('manifest'),['לרשימת הנוסעים','Open the master list']);
    const us=(t.sups||[]).filter(s=>s.st!=='Confirmed').length;
    if(us)add('sups','todo',`${us} ספקים טרם אישרו`,`${us} supplier${us>1?'s':''} not confirmed`,pt('spm'),['לספקים','Open suppliers']);
    const g=t.groups&&t.groups.length?groupsCalc(t):null;
    if(g&&g.late>0){const n=g.rows.filter(r=>r.late>0).length;add('late','urgent',`תשלומים באיחור: ${usd(g.late)} מ-${n} קבוצות`,`Late payments: ${usd(g.late)} from ${n} group${n>1?'s':''}`,pt('people'),['לחיוב ותשלומים','Open billing']);}
    const b=blockOf(t);
    if(b&&b.open>0){const dd=Math.round((D(b.cutoff)-TODAY)/DAY);
      if(dd<=30)add('block',dd<0?'urgent':'todo',dd<0?`בלוק החדרים: ${b.open} חדרים פתוחים אחרי מועד השחרור`:`בלוק החדרים: ${b.open} חדרים לשחרר עד ${fmtDate(b.cutoff)}`,dd<0?`Room block: ${b.open} open rooms past the release date`:`Room block: release ${b.open} open rooms by ${fmtDate(b.cutoff)}`,pt('odash'),['לבלוק החדרים','Open the room block']);}
    return out;
  }
  if(t.stage==='Finance'){
    const ni=(t.inbox||[]).length;
    if(ni)add('inbox','todo',`${ni} חשבוניות ממתינות לבדיקה`,`${ni} supplier invoice${ni>1?'s are':' is'} waiting to be checked`,pt('tfin'),['לבדיקת חשבוניות','Check invoices']);
    const gp=tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0),gu=r2(gp.reduce((s,x)=>s+x.usd,0));
    if(gp.length)add('gaps','urgent',`${gp.length} פערי חשבוניות פתוחים, ${usd(gu)}`,`${gp.length} open invoice gap${gp.length>1?'s':''}, ${usd(gu)}`,pt('tfin'),['לטיפול בפערים','Resolve the gaps']);
    const g=t.groups&&t.groups.length?groupsCalc(t):null;
    if(g&&g.outstanding>0.005)add('bal','todo',`יתרה פתוחה לגבייה: ${usd(g.outstanding)}`,`Open balance to collect: ${usd(g.outstanding)}`,pt('income'),['להכנסות','Open income']);
    if(!out.length)add('close','todo','הכול מסודר. אפשר לסגור את התיק','Everything is settled. The file can be closed',{a:'advance',v:t.id},['סגירת התיק','Close the file']);
  }
  return out;
}
function nxBar(t){
  if(S.meet>=0||S.tour>=0||!t)return '';
  const st=nextSteps(t),a=st[0];
  if(!a)return `<div class="nx-bar clear" role="status"><span class="nx-ic">${ic('check')}</span><span class="nx-t"><b>${L('הכול מסודר','All clear')}</b></span></div>`;
  return `<div class="nx-bar ${a.sev}" role="status"><span class="nx-ic">${ic(a.sev==='urgent'?'danger':a.sev==='info'?'clock':'right')}</span><span class="nx-t"><small>${L('הצעד הבא','Next step')}</small><b>${L(a.he,a.en)}</b></span>
   <button class="btn${a.sev==='info'?'':' pri'} nx-go" data-act="${a.act.a}" data-v="${a.act.v}">${L(a.label[0],a.label[1])}</button>
   ${st.slice(1,3).map(s=>`<button class="nx-more" data-act="${s.act.a}" data-v="${s.act.v}">${L(s.he,s.en)}</button>`).join('')}</div>`;
}
{const v0=vTrip;vTrip=function(){const h=v0.apply(this,arguments),t=T();if(!t)return h;const b=nxBar(t);if(!b)return h;
  const i=h.indexOf('<div class="pj-sub">');if(i<0)return h;const j=h.indexOf('</div>',i);return j<0?h:h.slice(0,j+6)+b+h.slice(j+6);};}

/* ---------- agent home ---------- */
function nxAgentSteps(ts,max){
  const rows=[];ts.forEach(t=>nextSteps(t).filter(s=>s.sev!=='info').slice(0,2).forEach(s=>rows.push({t,s})));
  rows.sort((a,b)=>NX_SEV[a.s.sev]-NX_SEV[b.s.sev]||(a.t.dep<b.t.dep?-1:a.t.dep>b.t.dep?1:0));
  return rows.slice(0,max==null?6:max);
}
function nxMyCard(ts){
  const r=nxAgentSteps(ts,6);
  return `<div class="card da-card nx-card"><div class="da-h"><h3>${L('הצעדים הבאים שלי','My next steps')}</h3><span class="da-sum">${r.length}</span></div>
   ${r.length?r.map(x=>`<div class="nx-li ${x.s.sev}"><span class="nx-dot"></span><div class="nx-lt"><b>${L(x.s.he,x.s.en)}</b><span class="small muted"><bdi>${esc(x.t.name)}</bdi></span></div><button class="btn nx-go" ${x.s.act.a==='advance'?`data-act="advance" data-v="${x.t.id}"`:`data-act="open" data-v="${x.t.id}" data-pt="${x.s.act.v}"`}>${L(x.s.label[0],x.s.label[1])}</button></div>`).join(''):`<p class="muted" style="margin:0">${L('אין צעדים פתוחים. כל התיקים שלך מעודכנים.','No open steps. All your files are up to date.')}</p>`}</div>`;
}
function nxCloseRows(ts){return ts.filter(t=>t.stage==='Finance').map(t=>{const gp=tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0);return {t,gaps:gp.length,gapUsd:r2(gp.reduce((s,x)=>s+x.usd,0)),open:r2(groupsCalc(t).outstanding)};});}
const nxHasUpcoming=ts=>ts.some(t=>t.stage!=='Quote'&&t.stage!=='Finance'&&t.stage!=='Closed'&&t.dep>=iso(TODAY));
function nxCloseCard(ts){
  const r=nxCloseRows(ts);
  return `<div class="card da-card nx-card"><div class="da-h"><h3>${L('תיקים בסגירה כספית','Files in financial close')}</h3><span class="da-sum">${r.length}</span></div>
   ${r.length?`<div class="scroll"><table class="tbl"><thead><tr><th>${L('טיול','Trip')}</th><th class="n">${L('פערים פתוחים','Open gaps')}</th><th class="n">${L('יתרה פתוחה','Open balance')}</th><th></th></tr></thead><tbody>${r.map(x=>`<tr><td><bdi>${esc(x.t.name)}</bdi></td><td class="n">${x.gaps?`${x.gaps} · ${usd(x.gapUsd)}`:'0'}</td><td class="n">${usd(x.open)}</td><td><button class="btn nx-go" data-act="open" data-v="${x.t.id}" data-pt="tfin">${L('לסגירה','Open close')}</button></td></tr>`).join('')}</tbody></table></div>`:`<p class="muted" style="margin:0">${L('אין תיקים בסגירה כספית.','No files in financial close.')}</p>`}</div>`;
}
{const h0=dbHero;dbHero=function(K,ts){const h=h0.apply(this,arguments);if(S.meet>=0||S.tour>=0||!isAgent())return h;
  return h+nxMyCard(ts)+(nxHasUpcoming(ts)?'':nxCloseCard(ts));};}

/* ---------- tests ---------- */
TESTS.push({name:'nx next steps',run:h=>{const out=[],role0=S.role,lang0=S.lang,meet0=S.meet,tour0=S.tour,ptab0=S.ptab,tr0=S.tripId;
  const tabs=new Set(PTABS.map(p=>p[0])),T0=iso(TODAY),cnt={};
  TRIPS.forEach(t=>{S.role='manager';const st=nextSteps(t);
    st.forEach(s=>{if(s.act.a!=='advance'&&!tabs.has(s.act.v))out.push(`${t.id}: step ${s.k} tab ${s.act.v} not in PTABS`);if(!['urgent','todo','info'].includes(s.sev))out.push('sev '+s.k);
      if(!s.he||!s.en||!s.label||!s.label[0]||!s.label[1])out.push(`${t.id}: step ${s.k} text`);if(/NaN|undefined/.test(s.he+s.en))out.push(`${t.id}: step ${s.k} NaN`);});
    const by={};st.forEach(s=>by[s.k]=s);cnt[t.stage]=(cnt[t.stage]||0)+1;
    const has=k=>!!by[k];
    if(t.stage==='Closed'&&st.length)out.push(t.id+': closed trip has steps');
    if(t.stage==='Quote'){const q=t.qst||'Draft';
      if(q==='Draft'){const bad=t.lines.filter(l=>!l.extra&&(!(l.cost>0)||!l.sup)).length;if(bad&&!has('price'))out.push(t.id+': draft lacks price');if(!bad&&!has('send'))out.push(t.id+': draft lacks send');if(bad&&!by.price.en.includes(': '+bad+' line'))out.push(t.id+': price count');}
      if(q==='Approval'&&!has('approve'))out.push(t.id+': approval lacks approve');
      if(q==='Sent'&&((t.qdays>7)!==has('follow')))out.push(t.id+': follow-up rule');
      if(q==='Negotiating'&&!has('answer'))out.push(t.id+': negotiating lacks answer');
      if(q==='Approval'){S.role='Priya';const s=nextSteps(t)[0];if(!s||s.k!=='wait'||s.sev!=='info')out.push(t.id+': non-manager approval');S.role='manager';}}
    if(t.stage==='Operations'){const od=t.tasks.filter(x=>!x.done&&x.due<T0).length,us=t.sups.filter(s=>s.st!=='Confirmed').length;
      if(!!od!==has('tasks')||(od&&!by.tasks.en.startsWith(od+' ')))out.push(t.id+': overdue rule');if(!!us!==has('sups')||(us&&!by.sups.en.startsWith(us+' ')))out.push(t.id+': suppliers rule');
      const late=t.groups&&t.groups.length?groupsCalc(t).late>0:false;if(late!==has('late'))out.push(t.id+': late rule');
      const mp=DESTS[t.dest].intl?(t.trav||[]).filter(x=>x.pass==='Missing').length:0;if(!!mp!==has('pass'))out.push(t.id+': passport rule');}
    if(t.stage==='Finance'){const ni=t.inbox.length,gp=tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0).length;
      if(!!ni!==has('inbox'))out.push(t.id+': inbox rule');if(!!gp!==has('gaps')||(gp&&!by.gaps.en.startsWith(gp+' ')))out.push(t.id+': gaps rule');
      if(!st.length||(has('close')&&st.length!==1))out.push(t.id+': finance fallback');}});
  console.log('nx stages',JSON.stringify(cnt));
  /* the bar renders on every trip x tab for three roles, both languages; hidden in meeting mode and tour */
  const tabsL=STAGES.flatMap(s=>s[2].map(x=>x[0]));
  for(const lang of ['en','he']){S.lang=lang;
    for(const role of ['manager','accountant','Marcus']){S.role=role;
      for(const t of TRIPS){S.tripId=t.id;
        for(const tb of tabsL){S.ptab=tb;let html;try{html=vTrip();}catch(e){out.push(`vTrip ${t.id}/${tb} ${role} ${lang}: ${e.message}`);continue;}
          if(t.stage==='Closed'&&!html.includes('All clear')&&lang==='en')out.push(t.id+': closed trip not all clear');
          if(!html.includes('nx-bar'))out.push(`bar missing ${t.id}/${tb} ${role} ${lang}`);
          else if(!html.includes('</div><div class="nx-bar'))out.push('bar not under pj-sub');
          if(tb==='general'||tb==='odash'||tb==='fdash'){const lab=`nx ${t.id}/${tb} ${role}`;h.chk(html,lab);if(lang==='en')h.scan(html,lab);}}}}
    S.role='manager';S.tripId=TRIPS[0].id;S.ptab='general';
    S.meet=0;if(vTrip().includes('nx-bar'))out.push('bar in meeting mode');S.meet=-1;
    S.tour=0;if(vTrip().includes('nx-bar'))out.push('bar during tour');S.tour=-1;}
  /* agent home */
  for(const lang of ['en','he']){S.lang=lang;
    AGENTS.forEach(a=>{S.role=a;const html=VIEWS.home();h.chk(html,'nx home '+a+' '+lang);if(lang==='en')h.scan(html,'nx home '+a);
      if(!html.includes('nx-card'))out.push('agent home lacks next steps '+a);
      const ts=visibleTrips(),up=nxHasUpcoming(ts),hasClose=html.includes(lang==='en'?'Files in financial close':'תיקים בסגירה כספית');
      if(up===hasClose)out.push(`close card rule ${a} ${lang}`);
      const r=nxAgentSteps(ts,6);if(r.length>6)out.push('more than 6 steps');
      for(let i=1;i<r.length;i++){const p=r[i-1],q=r[i];if(NX_SEV[p.s.sev]>NX_SEV[q.s.sev]||(p.s.sev===q.s.sev&&p.t.dep>q.t.dep))out.push('agent steps order '+a);}
      if(r.some(x=>x.t.agent!==a))out.push('agent steps leak '+a);});}
  S.role='Marcus';S.lang='en';{const ts=visibleTrips();if(nxHasUpcoming(ts))out.push('Marcus has upcoming departures');if(!VIEWS.home().includes('Files in financial close'))out.push('Marcus lacks close card');}
  S.role=role0;S.lang=lang0;S.meet=meet0;S.tour=tour0;S.ptab=ptab0;S.tripId=tr0;
  return out;}});
