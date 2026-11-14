/* ---------- v8.4 module "pg": the tour director run sheet (spec-v8.4-viewpoints.md §3.5, amendments A7 A8 A9 A11) ----------
   A field portal for the tour director or driver-guide. It is read on a phone, on a coach, in sunlight: big tap targets,
   high contrast, one column. Tabs: day (schedule with done ticks and the supplier contact per stop), pax (manifest, flags,
   emergency calls, head count), vouch (vouchers for approved suppliers) and notes (incident / change / guest request).
   State: S.pgTrip / S.pgDay / S.pgFilter (view only), PVRUN (done stops) and PVNOTE (notes) are saved through PERSIST.
   Real hotels and venues appear with their name and neutral wording only (real-brand rule, A11). */
Object.assign(S,{pgTrip:null,pgDay:1,pgFilter:'all'});
const PVRUN={},PVNOTE={},PG_HEAD={};
PERSIST.push({key:'pv-run',get:()=>JSON.parse(JSON.stringify(PVRUN)),
  set:v=>{Object.keys(PVRUN).forEach(k=>delete PVRUN[k]);if(v&&typeof v==='object')Object.keys(v).forEach(k=>{if(Array.isArray(v[k]))PVRUN[k]=v[k].slice();});},
  reset:()=>{Object.keys(PVRUN).forEach(k=>delete PVRUN[k]);Object.keys(PG_HEAD).forEach(k=>delete PG_HEAD[k]);S.pgTrip=null;S.pgDay=1;S.pgFilter='all';}});
PERSIST.push({key:'pv-notes',get:()=>JSON.parse(JSON.stringify(PVNOTE)),
  set:v=>{Object.keys(PVNOTE).forEach(k=>delete PVNOTE[k]);if(v&&typeof v==='object')Object.keys(v).forEach(k=>{if(Array.isArray(v[k]))PVNOTE[k]=v[k].slice();});},
  reset:()=>{Object.keys(PVNOTE).forEach(k=>delete PVNOTE[k]);}});

const PG_NK=[['incident',['אירוע','Incident'],'red'],['change',['שינוי בתוכנית','Change to plan'],'amber'],['guest',['בקשת אורח','Guest request'],'blue']];
const pgTel=p=>'tel:'+String(p||'').replace(/[^0-9+]/g,'');
const pgIsReal=n=>{const s=supByName(n);return !!(s&&s.real)||(typeof SD_CATNAMES!=='undefined'&&SD_CATNAMES.has(String(n).toLowerCase()));};
const pgIntl=t=>!!(DESTS[t.dest]&&DESTS[t.dest].intl);
const pgFlags=x=>({diet:!!(x.diet&&x.diet!=='None'),med:!!(x.form&&x.form.med&&x.form.med!=='done')});
const pgHasFlag=x=>{const f=pgFlags(x);return f.diet||f.med;};

/* the guide's trips (Operations), the selected trip and the selected day */
function pgTripsOf(g){return (g?g.trips:[]).map(id=>TRIPS.find(t=>t.id===id)).filter(t=>t&&t.stage!=='Quote');}
function pgDefTrip(ts){const up=ts.filter(t=>t.dep>=iso(TODAY)).sort((a,b)=>a.dep<b.dep?-1:1);
  return (up[0]||ts.slice().sort((a,b)=>a.dep<b.dep?1:-1)[0]||null);}
function pgSel(g){const ts=pgTripsOf(g);let t=ts.find(x=>x.id===S.pgTrip)||pgDefTrip(ts);
  if(t&&S.pgTrip!==t.id)S.pgTrip=t.id;
  const n=t?t.nights+1:1;S.pgDay=Math.max(1,Math.min(n,+S.pgDay||1));return {ts,t,day:S.pgDay};}

/* match a plan item to the trip line that serves it: by kind first, then by shared words. No match: null (show nothing) */
const PG_STOPW=new Set(['with','and','the','tour','group','days','day','free','entry','city','guide']);
function pgLineFor(t,item){
  const nm=String(item.name||'').toLowerCase(),ty=re=>t.lines.find(l=>re.test(l.type));
  if(/free|leisure/.test(nm))return null;
  if(/coach|depart|return|transfer/.test(nm))return ty(/Transport/i)||null;
  if(/flight|airport/.test(nm))return ty(/Transport|Flight|Air/i)||null;
  if(/check-?in|check-?out/.test(nm))return ty(/Lodging/i)||null;
  if(/breakfast|lunch|dinner|meal|buffet|supper/.test(nm))return ty(/Meals/i)||null;
  const w=s=>String(s).toLowerCase().split(/[^a-z0-9]+/).filter(x=>x.length>2&&!PG_STOPW.has(x));
  const iw=w(item.name);let best=null,bs=0;
  t.lines.forEach(l=>{const lw=w(l.name),sc=iw.filter(x=>lw.includes(x)).length;if(sc>bs){bs=sc;best=l;}});
  if(!bs&&/guide/.test(nm))return ty(/Guide/i)||null;
  return best;
}
/* the contact block for one stop: fictional suppliers show person and phone; real venues show the name and a neutral desk label */
function pgContact(t,item){
  const l=pgLineFor(t,item);if(!l||!l.sup)return '';const s=supByName(l.sup);
  if(pgIsReal(l.sup))return `<small class="pg-ct"><bdi>${esc(l.sup)}</bdi> · ${L('מוקד קבוצות','Groups desk')}</small>`;
  const c=s&&s.contact;
  return `<small class="pg-ct"><bdi>${esc(l.sup)}</bdi>${c?` · <bdi>${esc(c.name)}</bdi> <a class="pg-tel" href="${pgTel(c.phone)}"><bdi dir="ltr">${esc(c.phone)}</bdi></a>`:''}</small>`;
}

/* ---------- chips ---------- */
function pgChips(g,sel,withDays){
  const t=sel.t,tr=sel.ts.length>1?`<div class="pg-chips" role="group" aria-label="${L('בחירת טיול','Choose a trip')}">${sel.ts.map(x=>`<button class="pg-chip${x.id===t.id?' on':''}" data-act="pg-trip" data-v="${x.id}" aria-pressed="${x.id===t.id}"><b><bdi>${esc(x.name)}</bdi></b><small>${fmtDate(x.dep)}</small></button>`).join('')}</div>`:
    `<p class="pg-one small muted"><b><bdi>${esc(t.name)}</bdi></b> · ${fmtDate(t.dep)}</p>`;
  const dy=withDays?`<div class="pg-chips pg-days" role="group" aria-label="${L('בחירת יום','Choose a day')}">${pvDays(t).map(d=>`<button class="pg-chip pg-d${d.i===sel.day?' on':''}" data-act="pg-day" data-v="${d.i}" aria-pressed="${d.i===sel.day}"><b>${L('יום','Day')} ${d.i}</b><small>${D(d.date).toLocaleDateString(LOC(),{weekday:'short',day:'numeric'})}</small></button>`).join('')}</div>`:'';
  return `<div class="pg-sel">${tr}${dy}</div>`;
}
const pgEmpty=()=>`<div class="card hc-card"><p class="muted">${L('אין טיולים בתפעול לדף הריצה הזה.','No trips in Operations for this run sheet.')}</p></div>`;

/* ---------- day ---------- */
function pgDay(g,p){
  const sel=pgSel(g),t=sel.t;if(!t)return pgEmpty();
  const ds=pvDays(t),d=ds[sel.day-1],key=t.id+'|'+d.i,run=new Set((PVRUN[key]||[]).map(Number));
  const done=d.items.filter(x=>run.has(x.id)).length,pctDone=d.items.length?Math.round(done/d.items.length*100):0;
  const fl=(t.trav||[]).filter(pgHasFlag).length,pax=(t.trav||[]).length||t.pax||0;
  const first=d.items[0],last=d.i===ds.length;
  const brief=L(`יום ${hlKey(d.i)} מתוך ${ds.length} ב-<bdi>${esc(t.name)}</bdi>: ${hlKey(d.items.length)} עצירות, ${hlPos(done)} בוצעו. ${fl?`${hlWarn(fl)} נוסעים עם התראת תזונה או רפואה.`:'אין התראות לנוסעים.'}`,
    `Day ${hlKey(d.i)} of ${ds.length} on <bdi>${esc(t.name)}</bdi>: ${hlKey(d.items.length)} ${d.items.length===1?'stop':'stops'}, ${hlPos(done)} done. ${fl?`${hlWarn(fl)} ${fl===1?'traveler has':'travelers have'} a dietary or medical flag.`:'No traveler flags.'}`);
  const hero=pvHero({cls:'pg-hero',role:L(P_ROLE()[0],P_ROLE()[1]),brief,
    ctas:[hcCta('mint','users2',L('ספירת נוסעים','Count heads'),'data-act="pv-tab" data-v="pax"'),hcCta('ghost','pen',L('הערה חדשה','Add a note'),'data-act="pv-tab" data-v="notes"')],
    gauge:{pct:pctDone,label:L('מעצירות היום בוצעו','of today\'s stops done'),lines:[{cls:'ok',icon:'check',lab:L('בוצעו','Done'),val:done},{cls:'op',icon:'hourglass',lab:L('נותרו','To go'),val:d.items.length-done}]},
    kpis:[{lab:L('נוסעים','Passengers'),val:pax,sub:t.client?esc(t.client):''},
      {lab:L('איסוף ראשון','First pickup'),text:first?pvClock(first.start):'-',sub:d.i===1?L('משרד Redbud Group Tours, טולסה','Redbud Group Tours office, Tulsa'):L('מהמלון','From the hotel')},
      {lab:L('מלון הלילה','Hotel tonight'),text:d.hotel||(last?L('יום חזרה','Return day'):'-'),sub:d.hotel?L('לינה לפי התוכנית','Per the plan'):''},
      {lab:L('התראות','Alerts'),val:fl,cls:fl?'pg-kflag':'',act:'pv-tab',v:'pax',sub:L('תזונה או רפואי','Dietary or medical')}]});
  const card=pvDayCard(t,d,{done:run,tick:'pg-tick',extra:x=>(d.i===1&&first&&x.id===first.id&&x.kind==='travel'?`<small class="pg-mp">${ic('pin')} ${L('נקודת מפגש: משרד Redbud Group Tours, טולסה','Meeting point: Redbud Group Tours office, Tulsa')}</small>`:'')+pgContact(t,x)});
  return `${pgChips(g,sel,true)}${hero}<div class="pg-card">${card}</div>`;
}
const P_ROLE=()=>PORTALS.guide.role;

/* ---------- pax ---------- */
function pgPax(g,p){
  const sel=pgSel(g),t=sel.t;if(!t)return pgEmpty();
  const tr=(t.trav||[]).map((x,i)=>({x,i})),intl=pgIntl(t),flagOnly=S.pgFilter==='flags';
  const rows=flagOnly?tr.filter(o=>pgHasFlag(o.x)):tr,hc=PG_HEAD[t.id]||{},n=tr.length,on=tr.filter(o=>hc[o.i]).length,nf=tr.filter(o=>pgHasFlag(o.x)).length;
  const chip=(k,lab,c)=>`<button class="pg-chip pg-f${S.pgFilter===k?' on':''}" data-act="pg-filter" data-v="${k}" aria-pressed="${S.pgFilter===k}"><b>${lab}</b><small>${c}</small></button>`;
  const row=o=>{const x=o.x,f=pgFlags(x),hit=!!hc[o.i];
    const med=x.form&&x.form.med!=='done'?pillF(L('טופס רפואי חסר','Medical form open'),'amber'):'';
    const diet=f.diet?pillF(`${L('תזונה','Diet')}: ${esc(x.diet)}`,'blue'):'';
    const pp=intl?(x.pass==='Missing'?pillF(L('דרכון חסר','Passport missing'),'red'):`${opPassWarn(t,x)?pillF(L('תוקף דרכון קצר','Short passport validity'),'amber'):pillF(L('דרכון התקבל','Passport on file'),'green')}${x.passNo?` <span class="muted small" dir="ltr">${esc(x.passNo)}</span>`:''}`):'';
    const em=x.emerg&&x.emerg.phone?`<a class="btn sm pg-call" href="${pgTel(x.emerg.phone)}" aria-label="${L('חיוג לאיש קשר לחירום','Call emergency contact')} ${esc(x.emerg.name)}">${ic('shield')} <span><b><bdi>${esc(x.emerg.name)}</bdi></b><small dir="ltr">${esc(x.emerg.phone)}</small></span></a>`:'';
    return `<li class="pg-px${hit?' on':''}${pgHasFlag(x)?' pg-flagged':''}"><button class="pg-hb${hit?' on':''}" data-act="pg-head" data-v="${t.id}|${o.i}" aria-pressed="${hit}" aria-label="${L('על האוטובוס','On board')}: ${esc(x.n)}">${ic('check')}</button>
      <div class="pg-pi"><b><bdi>${esc(x.n)}</bdi></b><span class="muted small">${L('חדר','Room')} <bdi>${esc(x.room)}</bdi>${x.roomType?` · ${esc(x.roomType)}`:''}</span>
       ${diet||med||pp?`<span class="pg-fl">${diet}${med}${pp}</span>`:''}</div>${em}</li>`;};
  const bar=`<div class="card hc-card pg-hcbar"><div class="hc-h"><h3>${L('ספירת נוסעים','Head count')}</h3><button class="btn sm" data-act="pg-head-reset" data-v="${t.id}">${ic('restart')} ${L('איפוס','Reset')}</button></div>
    <div class="pg-hcn"><b>${on}</b> <span>${L('מתוך','of')} ${n} ${L('על האוטובוס','on board')}</span></div><div class="pg-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${on}"><i style="inline-size:${n?Math.round(on/n*100):0}%"></i></div>
    <p class="muted small">${L('הספירה נשמרת במכשיר הזה בלבד.','The count stays on this device only.')}</p></div>`;
  return `${pgChips(g,sel,false)}${bar}<div class="pg-chips pg-filt" role="group" aria-label="${L('סינון','Filter')}">${chip('all',L('הכל','All'),n)}${chip('flags',L('רק התראות','Flags only'),nf)}</div>
   <div class="card hc-card pg-man">${rows.length?`<ul class="pg-pl">${rows.map(row).join('')}</ul>`:`<p class="muted">${L('אין נוסעים עם התראות.','No travelers with flags.')}</p>`}</div>`;
}

/* ---------- vouchers ---------- */
const pgVouchNo=(t,l)=>`RB-${t.no}-${l.id}`;
function pgVouch(g,p){
  const sel=pgSel(g),t=sel.t;if(!t)return pgEmpty();
  const all=(t.sups||[]).map(s=>({s,l:spLine(t,s)})).filter(o=>o.l);
  const ok=all.filter(o=>spFlow(o.s)==='approved'),rest=all.length-ok.length,pax=(t.trav||[]).length||t.pax||0;
  const card=o=>{const l=o.l,real=pgIsReal(l.sup),sp=supByName(l.sup),c=!real&&sp&&sp.contact;
    return `<div class="card hc-card pg-vo"><div class="hc-h"><h3><bdi>${esc(l.sup)}</bdi></h3>${pillF(L('שובר מוכן','Voucher ready'),'green')}</div>
     <p class="pg-vs">${esc(l.name)}<span class="muted small"> · ${esc(l.type)} · ${pax} ${L('נוסעים','travelers')}</span></p>
     <div class="pg-vn"><span class="muted small">${L('מספר שובר','Voucher number')}</span><b dir="ltr">${pgVouchNo(t,l)}</b></div>
     ${c?`<p class="small pg-ct"><bdi>${esc(c.name)}</bdi> <a class="pg-tel" href="${pgTel(c.phone)}"><bdi dir="ltr">${esc(c.phone)}</bdi></a></p>`:`<p class="small muted">${L('להציג את המספר בקבלה.','Show this number at the desk.')}</p>`}</div>`;};
  const wait=o=>{const l=o.l,real=pgIsReal(l.sup);
    return `<div class="card hc-card pg-vo pg-wait"><div class="hc-h"><h3><bdi>${esc(l.sup)}</bdi></h3>${pillF(real?L('סטטוס: נשלחה בקשה','Status: requested'):L('ממתין לאישור הספק','Awaiting supplier confirmation'),'')}</div>
     <p class="pg-vs">${esc(l.name)}<span class="muted small"> · ${esc(l.type)} · ${pax} ${L('נוסעים','travelers')}</span></p>
     <p class="small muted">${L('המספר יופיע כאן כשהשובר יונפק.','The number will show here once the voucher is issued.')}</p></div>`;};
  const pend=all.filter(o=>spFlow(o.s)!=='approved');
  return `${pgChips(g,sel,false)}
   <div class="card hc-card"><div class="hc-h"><h3>${L('שוברים','Vouchers')}</h3><span class="muted small">${ok.length} ${L('מוכנים','ready')}${rest?` · ${rest} ${L('עדיין בלי שובר','with no voucher yet')}`:''}</span></div>
    <p class="muted small">${L('שובר מופיע כשהספק מאושר. מספרי השוברים בנויים כך: <bdi dir="ltr">RB-[טיול]-[פריט]</bdi>.','A voucher appears once the supplier is approved. Voucher numbers follow <bdi dir="ltr">RB-[trip]-[item]</bdi>.')}</p></div>
   ${ok.length?ok.map(card).join(''):`<div class="card hc-card"><p class="muted">${L('עדיין אין שוברים לטיול הזה.','No vouchers for this trip yet.')}</p></div>`}${pend.map(wait).join('')}`;
}

/* ---------- notes ---------- */
function pgNotes(g,p){
  const sel=pgSel(g),t=sel.t;if(!t)return pgEmpty();
  const list=(PVNOTE[t.id]||[]).slice().reverse(),n=t.nights+1,kl=k=>(PG_NK.find(x=>x[0]===k)||PG_NK[0]);
  const form=`<form class="card hc-card pg-nf" data-form="pg-note" autocomplete="off"><div class="hc-h"><h3>${L('הערה חדשה','New note')}</h3></div>
    <div class="pg-row"><label>${L('סוג','Type')}<select name="kind">${PG_NK.map(k=>`<option value="${k[0]}">${L(k[1][0],k[1][1])}</option>`).join('')}</select></label>
     <label>${L('יום','Day')}<select name="day">${Array.from({length:n},(_,i)=>`<option value="${i+1}" ${i+1===sel.day?'selected':''}>${L('יום','Day')} ${i+1}</option>`).join('')}</select></label></div>
    <label>${L('מה קרה','What happened')}<textarea name="txt" rows="3" maxlength="500" required placeholder="${L('למשל: אורחת הרגישה לא טוב, ישבה באוטובוס.','For example: a guest felt unwell and stayed on the coach.')}"></textarea></label>
    <button class="hc-btn mint pg-add" type="submit">${ic('check')} ${L('שמירת הערה','Save note')}</button></form>`;
  const item=x=>{const k=kl(x.kind);return `<li class="pg-nt"><div class="pg-nh">${pillF(L(k[1][0],k[1][1]),k[2])}<span class="muted small">${L('יום','Day')} ${x.day} · ${fmtDate(x.d)}</span>
      <button class="iconb pg-del" data-act="pg-note-del" data-v="${t.id}|${x.id}" aria-label="${L('מחיקת הערה','Delete note')}">${ic('x')}</button></div><p>${esc(x.txt)}</p></li>`;};
  return `${pgChips(g,sel,false)}${form}<div class="card hc-card"><div class="hc-h"><h3>${L('הערות הטיול','Trip notes')}</h3><span class="muted small">${list.length}</span></div>
    ${list.length?`<ul class="pg-nl">${list.map(item).join('')}</ul>`:`<p class="muted">${L('אין הערות עדיין. אירועים, שינויים ובקשות אורחים יופיעו כאן.','No notes yet. Incidents, changes and guest requests will show here.')}</p>`}</div>`;
}

/* ---------- register ---------- */
pvRegister('guide',{role:['מנהל/ת טיול','Tour director'],label:['דף ריצה למדריך','Run sheet'],kind:'field',feat:'guide',
  people:()=>GUIDES.map(g=>({id:g.id,name:L(g.he,g.en),sub:L(g.role.he,g.role.en)})),def:'wade',
  tabs:[['day','יום','Day','calendar'],['pax','נוסעים','Passengers','users2'],['vouch','שוברים','Vouchers','ticket'],['notes','הערות','Notes','pen']],
  view:(tab,p)=>{const g=GUIDE_BY[p&&p.id]||GUIDES[0];
    return `<div class="pg-run">${tab==='pax'?pgPax(g,p):tab==='vouch'?pgVouch(g,p):tab==='notes'?pgNotes(g,p):pgDay(g,p)}</div>`;}});

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b||!b.dataset.act||b.dataset.act.slice(0,3)!=='pg-')return;
  const a=b.dataset.act,v=b.dataset.v||'';
  if(a==='pg-trip'){S.pgTrip=v;S.pgDay=1;render();}
  else if(a==='pg-day'){S.pgDay=+v||1;render();}
  else if(a==='pg-filter'){S.pgFilter=v==='flags'?'flags':'all';render();}
  else if(a==='pg-tick'){const [tid,d,id]=v.split('|'),k=tid+'|'+d,arr=PVRUN[k]=PVRUN[k]||[],i=arr.indexOf(+id);
    if(i<0){arr.push(+id);toast(L('העצירה סומנה כבוצעה','Stop marked done'));}else{arr.splice(i,1);toast(L('הסימון הוסר','Mark removed'));}
    if(!arr.length)delete PVRUN[k];render();}
  else if(a==='pg-head'){const [tid,i]=v.split('|'),h=PG_HEAD[tid]=PG_HEAD[tid]||{};if(h[i])delete h[i];else h[i]=1;render();}
  else if(a==='pg-head-reset'){delete PG_HEAD[v];toast(L('הספירה אופסה','Head count reset'));render();}
  else if(a==='pg-note-del'){const [tid,id]=v.split('|');PVNOTE[tid]=(PVNOTE[tid]||[]).filter(x=>String(x.id)!==id);if(!PVNOTE[tid].length)delete PVNOTE[tid];toast(L('ההערה נמחקה','Note deleted'));render();}
});
document.addEventListener('submit',e=>{const f=e.target;if(!f||!f.dataset||f.dataset.form!=='pg-note')return;e.preventDefault();
  if(!S.pv||S.pv.k!=='guide'||!S.pgTrip)return;const fd=new FormData(f),txt=String(fd.get('txt')||'').trim().slice(0,500);
  if(!txt){toast(L('כתבו מה קרה','Write what happened'));return;}
  const arr=PVNOTE[S.pgTrip]=PVNOTE[S.pgTrip]||[];
  arr.push({id:arr.reduce((m,x)=>Math.max(m,x.id),0)+1,kind:PG_NK.some(k=>k[0]===fd.get('kind'))?fd.get('kind'):'incident',day:Math.max(1,+fd.get('day')||1),txt,d:iso(TODAY)});
  toast(L('ההערה נשמרה','Note saved'));render();});

/* ---------- developer notes ---------- */
(function(){if(typeof SPEC==='undefined')return;
  const base={roles:{view:['guide'],act:['guide']},perms:[],
    rules:['Access is by invitation link (proposed); the tour director is not an agency role','Real hotels and venues show their name and neutral wording only','Phone-first: large tap targets, high contrast, one column'],
    states:{empty:'A guide with no Operations trips sees an empty-state card.',loading:'Not applicable (local data).',error:'A view that throws shows "This screen could not load."'},
    status:'roadmap',tests:['TEST pg tour director run sheet'],code:['v6/s13_pg.js: pgDay, pgPax, pgVouch, pgNotes, pgContact, pgLineFor','v6/m_pg.css']};
  const E=(k,o)=>{SPEC['portal:guide:'+k]=Object.assign({},base,o);};
  E('day',{title:'Run sheet: day',purpose:'The day for the tour director: stops with clock times, a done tick per stop and the supplier contact per stop.',
    data:['t.items (day, hrs) through pvDays','t.lines and SUPPLIERS contact','PVRUN (PERSIST pv-run)','GUIDES'],
    actions:[{label:'Trip and day chips',does:'Pick the trip (default: nearest departure) and the day (default day 1)',rule:'S.pgTrip, S.pgDay'},{label:'Mark done',does:'Ticks a stop; survives reload',rule:'PVRUN[tripId|day]'},{label:'Call supplier',does:'Opens the phone dialer',rule:'Fictional suppliers only; real venues show the name and a neutral desk label'}],
    api:['GET /v1/portal/{token}/run/{trip}/day/{n} (proposed)','PUT /v1/portal/{token}/run/{trip}/stops/{id}/done (proposed)']});
  E('pax',{title:'Run sheet: passengers',purpose:'The manifest with dietary and medical flags, emergency contacts to call, passport status on international trips and a local head count.',
    data:['t.trav (diet, form.med, emerg, pass, passExp)','opPassWarn'],
    actions:[{label:'Flags only',does:'Filters the manifest to travelers with a dietary or medical flag',rule:'diet is not None, or the medical form is not done'},{label:'Count heads',does:'Ticks each traveler on board; the count stays on this device',rule:'Not saved'},{label:'Emergency contact',does:'Calls the emergency contact',rule:'tel: link'}],
    api:['GET /v1/portal/{token}/run/{trip}/manifest (proposed)']});
  E('vouch',{title:'Run sheet: vouchers',purpose:'Vouchers for suppliers that are approved on the trip, with the number to show at the desk.',
    data:['t.sups (spFlow approved)','spLine(t,s)'],rules:['Voucher number is RB-<trip no>-<component id>','A voucher appears only for an approved supplier'],
    actions:[{label:'Show number',does:'Read the number to the supplier desk',rule:'RB-<t.no>-<l.id>'}],api:['GET /v1/portal/{token}/run/{trip}/vouchers (proposed)']});
  E('notes',{title:'Run sheet: notes',purpose:'Notes from the road: incidents, changes to the plan and guest requests, per trip.',
    data:['PVNOTE[tripId] (PERSIST pv-notes)'],
    actions:[{label:'Save note',does:'Adds a note with type and day',rule:'Up to 500 characters'},{label:'Delete note',does:'Removes the note',rule:'Local to the demo'}],
    api:['POST /v1/portal/{token}/run/{trip}/notes (proposed)','DELETE /v1/portal/{token}/run/{trip}/notes/{id} (proposed)']});
})();

/* ---------- tests ---------- */
TESTS.push({name:'pg tour director run sheet',run:h=>{const out=[];
  const NEG=/unconfirmed|overdue|exposure|\blate\b|\brisk|query|\bgap|dispute|overbilling/i;
  const guard=(html,lab)=>{html.split(/(?=<div class="card|<li class="pg-px|<tr)/).forEach(seg=>{if(!NEG.test(seg))return;
    const low=seg.toLowerCase();for(const nm of SD_CATNAMES){if(low.includes(esc(nm).toLowerCase())){out.push(`real brand ${nm} near negative wording in ${lab}`);break;}}});};
  const run0=PERSIST.find(p=>p.key==='pv-run'),notes0=PERSIST.find(p=>p.key==='pv-notes');
  for(const lang of ['en','he']){S.lang=lang;
    GUIDES.forEach(g=>{pgTripsOf(g).forEach(t=>{S.pgTrip=t.id;
      const days=t.id==='nas'?t.nights+1:1;
      ['day','pax','vouch','notes'].forEach(tab=>{for(let d=1;d<=(tab==='day'?days:1);d++){S.pgDay=d;
        try{pvOpen('guide',g.id,tab);render();const hh=h.els.app.innerHTML,lab=`pg ${g.id} ${t.id} ${tab} d${d} ${lang}`;
          h.chk(hh,lab);if(lang==='en'){h.scan(hh,lab);guard(hh,lab);}
          if(!hh.includes('pg-chip')&&pgTripsOf(g).length>1)out.push('no chips '+lab);
          if(tab==='pax'&&hh.includes('href="tel:')===false)out.push('no tel link '+lab);
          if(tab==='vouch'){const ok=(t.sups||[]).filter(s=>spFlow(s)==='approved'&&spLine(t,s));ok.forEach(s=>{if(!hh.includes(pgVouchNo(t,spLine(t,s))))out.push('voucher missing '+lab);});}
        }catch(e){out.push('threw '+g.id+' '+t.id+' '+tab+' '+e.message);}}});});});}
  S.lang='en';
  /* times increase within a day, contacts match at least one nas stop */
  const nas=TRIPS.find(t=>t.id==='nas');
  pvDays(nas).forEach(d=>d.items.forEach((x,i)=>{if(x.end<x.start||(i&&x.start<d.items[i-1].end))out.push('times nas d'+d.i);}));
  if(!nas.items.some(x=>pgContact(nas,x)))out.push('no supplier contact matched on nas');
  if(pgLineFor(nas,{name:'Free morning'}))out.push('free stop matched a line');
  if(pgLineFor(nas,{name:'Zzzz unknown'}))out.push('unknown stop matched a line');
  /* a done tick survives the persistence round trip and shows as pressed */
  S.pgTrip='nas';S.pgDay=1;PVRUN['nas|1']=[1];pvOpen('guide','wade','day');render();
  if(!/pv-st[^"]*done/.test(h.els.app.innerHTML))out.push('done tick not rendered');
  const snap=JSON.stringify(run0.get());run0.reset();if(Object.keys(PVRUN).length)out.push('reset left ticks');
  run0.set(JSON.parse(snap));if(JSON.stringify(PVRUN['nas|1'])!=='[1]')out.push('done tick lost through get/set');
  /* notes round trip */
  PVNOTE.nas=[{id:1,kind:'incident',day:1,txt:'Test note',d:iso(TODAY)}];const ns=JSON.stringify(notes0.get());notes0.reset();notes0.set(JSON.parse(ns));
  if(!PVNOTE.nas||PVNOTE.nas[0].txt!=='Test note')out.push('note lost through get/set');
  S.pgTrip='nas';pvOpen('guide','wade','notes');render();if(!h.els.app.innerHTML.includes('Test note'))out.push('note not rendered');
  /* the flag filter narrows the manifest */
  S.pgFilter='flags';pvOpen('guide','wade','pax');render();const fl=(h.els.app.innerHTML.match(/class="pg-px/g)||[]).length;
  if(fl!==nas.trav.filter(pgHasFlag).length)out.push('flag filter count '+fl);
  S.pgFilter='all';
  run0.reset();notes0.reset();pvExit();S.lang='en';return out;}});
