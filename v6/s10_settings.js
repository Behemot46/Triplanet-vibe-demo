/* ---------- v8 module st: Settings (spec 4.7, A5-A8, A18) ----------
   Sub-tabs (S.stSub, transient): Organization, Roles & permissions, Stages, Forms, Integrations.
   Persisted: st-org (agency formats), st-perms (S.perms override {role:{perm:bool}}), st-stages (status lists).
   Organization formats show a preview only; the rest of the app is not reformatted (A18).
   The page is read-only without settings.edit. fin.view is enforced through NAV_PERM (s9_boot wraps finance + gaps). */
Object.assign(S,{stSub:'org'});
NAV_PERM.finance='fin.view';NAV_PERM.gaps='fin.view';

/* ---------- organization ---------- */
const ST_CURS=['USD','EUR','GBP','CAD','ILS'];
const ST_TZ=[['America/Chicago','Central (Tulsa)','מרכז ארה"ב (טולסה)'],['America/New_York','Eastern','מזרח ארה"ב'],['America/Denver','Mountain','הרי הרוקי'],['America/Los_Angeles','Pacific','מערב ארה"ב'],['Europe/London','London','לונדון'],['Asia/Jerusalem','Jerusalem','ירושלים']];
const ST_DATES=['auto','MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'];
const stOrgDef=()=>({name:AGENCY,logo:'R',cur:'USD',datefmt:'auto',time:'12h',tz:'America/Chicago',tax:8.5,taxId:'73-0000000'});
const ST_ORG=stOrgDef();
PERSIST.push({key:'st-org',get:()=>Object.assign({},ST_ORG),set:v=>{if(v&&typeof v==='object')Object.assign(ST_ORG,stOrgDef(),v);},reset:()=>{Object.keys(ST_ORG).forEach(k=>delete ST_ORG[k]);Object.assign(ST_ORG,stOrgDef());}});
const stCanEdit=()=>typeof can!=='function'||can('settings.edit');
function stSetOrg(k,v){
  if(!stCanEdit()||!(k in stOrgDef()))return false;
  if(k==='name')v=String(v||'').trim().slice(0,60)||AGENCY;
  else if(k==='logo')v=String(v||'').trim().slice(0,2).toUpperCase()||ST_ORG.name.charAt(0).toUpperCase();
  else if(k==='cur'){if(!ST_CURS.includes(v))return false;}
  else if(k==='datefmt'){if(!ST_DATES.includes(v))return false;}
  else if(k==='time'){if(v!=='12h'&&v!=='24h')return false;}
  else if(k==='tz'){if(!ST_TZ.some(z=>z[0]===v))return false;}
  else if(k==='tax')v=Math.min(30,Math.max(0,r2(+v||0)));
  else if(k==='taxId')v=String(v||'').trim().slice(0,24);
  ST_ORG[k]=v;return true;
}
const stDateFmt=()=>ST_ORG.datefmt==='auto'?(S.lang==='en'?'MM/DD/YYYY':'DD/MM/YYYY'):ST_ORG.datefmt;
function stFmtDate(d,f){const p=n=>String(n).padStart(2,'0'),y=d.getFullYear(),m=p(d.getMonth()+1),dd=p(d.getDate());
  return f==='DD/MM/YYYY'?dd+'/'+m+'/'+y:f==='YYYY-MM-DD'?y+'-'+m+'-'+dd:m+'/'+dd+'/'+y;}
const stFmtTime=(h,m,f)=>f==='24h'?String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'):((h%12)||12)+':'+String(m).padStart(2,'0')+' '+(h<12?'AM':'PM');
function stPreview(){
  const o=ST_ORG,fee=1000,tax=r2(fee*o.tax/100),m=n=>'⁦'+new Intl.NumberFormat('en-US',{style:'currency',currency:o.cur,minimumFractionDigits:2,maximumFractionDigits:2}).format(n)+'⁩';
  return {date:stFmtDate(TODAY,stDateFmt()),time:stFmtTime(14,30,o.time),money:m(12345.6),fee:m(fee),tax:m(tax),total:m(fee+tax)};
}
const stPreviewLine=()=>{const p=stPreview();
  return `<span>${L('תאריך','Date')}: <b><bdi>${p.date}</bdi></b></span><span>${L('שעה','Time')}: <b><bdi>${p.time}</bdi></b></span><span>${L('סכום','Amount')}: <b><bdi>${p.money}</bdi></b></span><span>${L('עמלת שירות','Service fee')} <bdi>${p.fee}</bdi> + ${L('מס מכירה','sales tax')} <bdi>${ST_ORG.tax}%</bdi> = <b><bdi>${p.total}</bdi></b></span>`;};

/* ---------- permissions ---------- */
const ST_ROLES=['owner','admin','agent','accountant'];
/* exactly the keys the code checks with can() (a TEST in s11_fix.js pins the list): pages, approvals, document issue, supplier work, clients, settings, forms */
const ST_ENFORCED=['users.manage','fin.sync','fin.view','prop.approve','fin.issueDocs','settings.edit','settings.stages','price.edit','forms.build','sup.edit','sup.swap','ops.suppliers','cli.edit'];
PERSIST.push({key:'st-perms',get:()=>S.perms?JSON.parse(JSON.stringify(S.perms)):null,set:v=>{S.perms=v&&typeof v==='object'?v:null;},reset:()=>{S.perms=null;}});
/* effective value of a permission for a role key (owner|admin|agent|accountant) */
const stPermOf=(role,k)=>{const p=PERM_BY[k];if(!p)return false;const o=S.perms&&S.perms[role];return o&&typeof o[k]==='boolean'?o[k]:!!p[role];};
function stSetPerm(role,k,v){
  if(!stCanEdit()||!PERM_BY[k]||!ST_ROLES.includes(role)||role==='owner')return false;
  v=!!v;const def=!!PERM_BY[k][role];
  if(!S.perms)S.perms={};
  if(!S.perms[role])S.perms[role]={};
  if(v===def){delete S.perms[role][k];if(!Object.keys(S.perms[role]).length)delete S.perms[role];if(!Object.keys(S.perms).length)S.perms=null;}
  else S.perms[role][k]=v;
  return true;
}
function stResetPerms(){if(!stCanEdit())return false;S.perms=null;return true;}
const stPermChanges=()=>{let n=0;if(S.perms)Object.keys(S.perms).forEach(r=>{n+=Object.keys(S.perms[r]).length;});return n;};

/* ---------- stages (preview only: does not change trip data) ---------- */
const ST_COLORS=['orange','yellow','amber','blue','purple','green','red','teal'];
const ST_CN={orange:['כתום','Orange'],yellow:['צהוב','Yellow'],amber:['ענבר','Amber'],blue:['כחול','Blue'],purple:['סגול','Purple'],green:['ירוק','Green'],red:['אדום','Red'],teal:['טורקיז','Teal']};
const stStagesDef=()=>[
  {k:'q',he:'הצעת מחיר',en:'Quotation',items:[{id:'s1',he:'בבנייה',en:'In progress',c:'orange'},{id:'s2',he:'נשלח ללקוח',en:'Sent to client',c:'yellow'},{id:'s3',he:'ממתין לסגירה',en:'Awaiting close',c:'amber'},{id:'s4',he:'לאישור מנהל',en:'Manager approval',c:'purple'}]},
  {k:'o',he:'תפעול',en:'Operation',items:[{id:'s5',he:'בהכנה',en:'Preparing',c:'blue'},{id:'s6',he:'ספקים מאושרים',en:'Suppliers confirmed',c:'teal'},{id:'s7',he:'בדרכים',en:'On the road',c:'green'}]},
  {k:'f',he:'כספים',en:'Finance',items:[{id:'s8',he:'ממתין לחשבוניות',en:'Awaiting invoices',c:'amber'},{id:'s9',he:'בבקרה',en:'In review',c:'blue'},{id:'s10',he:'סגור',en:'Closed',c:'green'}]}];
const ST_STAGES=stStagesDef();
const stStagesSet=a=>{ST_STAGES.splice(0,ST_STAGES.length,...a);};
PERSIST.push({key:'st-stages',get:()=>JSON.parse(JSON.stringify(ST_STAGES)),set:v=>{if(Array.isArray(v)&&v.length===3&&v.every(s=>s&&Array.isArray(s.items)))stStagesSet(v);},reset:()=>stStagesSet(stStagesDef())});
const stStageBy=k=>ST_STAGES.find(s=>s.k===k);
const stNextId=()=>'s'+(ST_STAGES.reduce((a,s)=>s.items.reduce((b,i)=>Math.max(b,parseInt(String(i.id).slice(1),10)||0),a),0)+1);
const stCanStages=()=>stCanEdit()&&(typeof can!=='function'||can('settings.stages'));
function stStageAdd(k,name){
  const s=stStageBy(k);if(!s||!stCanStages())return null;
  name=String(name||'').trim().slice(0,40)||L('סטטוס חדש','New status');
  const it={id:stNextId(),he:name,en:name,c:ST_COLORS[s.items.length%ST_COLORS.length]};s.items.push(it);return it;
}
function stStageRename(k,id,name){
  const s=stStageBy(k),it=s&&s.items.find(x=>x.id===id);name=String(name||'').trim().slice(0,40);
  if(!it||!name||!stCanStages())return false;
  it[S.lang==='en'?'en':'he']=name;return true;
}
function stStageColor(k,id,c){const s=stStageBy(k),it=s&&s.items.find(x=>x.id===id);if(!it||!ST_COLORS.includes(c)||!stCanStages())return false;it.c=c;return true;}
function stStageMove(k,id,dir){
  const s=stStageBy(k);if(!s||!stCanStages())return false;
  const i=s.items.findIndex(x=>x.id===id),j=i+(dir<0?-1:1);if(i<0||j<0||j>=s.items.length)return false;
  const t=s.items[i];s.items[i]=s.items[j];s.items[j]=t;return true;
}
function stStageDel(k,id){
  const s=stStageBy(k);if(!s||!stCanStages()||s.items.length<=1)return false;
  const i=s.items.findIndex(x=>x.id===id);if(i<0)return false;s.items.splice(i,1);return true;
}

/* ---------- rendering ---------- */
const ST_TABS=[['org',['ארגון','Organization']],['roles',['תפקידים והרשאות','Roles & permissions']],['stages',['שלבים','Stages']],['forms',['טפסים','Forms']],['integ',['אינטגרציות','Integrations']]];
const stDis=ro=>ro?' disabled':'';
function stOrg(ro){
  const o=ST_ORG,d=stDis(ro),sel=(id,k,opts)=>`<select id="${id}" data-ch="st-org" data-k="${k}"${d}>${opts.map(x=>`<option value="${esc(x[0])}"${String(o[k])===String(x[0])?' selected':''}>${x[1]}</option>`).join('')}</select>`;
  const f=(lab,inner,hint)=>`<label class="st-f"><span>${lab}</span>${inner}${hint?`<small class="muted">${hint}</small>`:''}</label>`;
  const inp=(id,k,type,extra)=>`<input id="${id}" type="${type}" value="${esc(o[k])}" data-ch="st-org" data-st-in="st-org" data-k="${k}"${extra||''}${d}>`;
  return `<div class="card st-card"><div class="st-h"><h3>${L('פרטי הסוכנות','Agency details')}</h3>${pillF(L('תצוגה מקדימה בלבד','Preview only'),'info')}</div>
  <p class="muted st-note">${L('הפורמטים כאן מוצגים בשורת הדוגמה למטה. הדמו לא משנה את שאר התאריכים והסכומים במערכת.','The formats below show in the sample line. In this demo they do not reformat the rest of the app.')}</p>
  <div class="st-grid">
   ${f(L('שם הסוכנות','Agency name'),inp('st-name','name','text',' maxlength="60"'))}
   ${f(L('אות הלוגו','Logo initial'),`<span class="st-logo-row"><span class="st-logo" aria-hidden="true">${esc(o.logo)}</span>${inp('st-logo','logo','text',' maxlength="2" size="3"')}</span>`)}
   ${f(L('מטבע ברירת מחדל','Default currency'),sel('st-cur','cur',ST_CURS.map(c=>[c,c])))}
   ${f(L('פורמט תאריך','Date format'),sel('st-date','datefmt',ST_DATES.map(x=>[x,x==='auto'?L('אוטומטי לפי שפה','Automatic by language'):x])),L('ברירת מחדל: MM/DD/YYYY באנגלית, DD/MM/YYYY בעברית','Default: MM/DD/YYYY in English, DD/MM/YYYY in Hebrew'))}
   ${f(L('פורמט שעה','Time format'),sel('st-time','time',[['12h',L('12 שעות (AM/PM)','12-hour (AM/PM)')],['24h',L('24 שעות','24-hour')]]))}
   ${f(L('אזור זמן','Time zone'),sel('st-tz','tz',ST_TZ.map(z=>[z[0],L(z[2],z[1])+' · '+z[0]])))}
   ${f(L('מס מכירה על עמלות שירות (%)','Sales tax on service fees (%)'),inp('st-tax','tax','number',' min="0" max="30" step="0.1"'))}
   ${f(L('מספר מזהה לצרכי מס','Tax ID'),inp('st-taxid','taxId','text',' maxlength="24"'))}
  </div>
  <div class="st-prev" id="st-prev" aria-live="polite"><b>${L('דוגמה','Sample')}</b>${stPreviewLine()}</div></div>`;
}
function stRoles(ro){
  const d=stDis(ro),n=stPermChanges();
  const roleH=ST_ROLES.map(r=>`<th class="st-c">${L(ROLES[r].he,ROLES[r].en)}${r==='owner'?` <span class="st-lock" title="${L('תמיד פעיל עבור הבעלים','Always on for the owner')}">${ic('lock')}</span>`:''}</th>`).join('');
  const rows=PERM_GROUPS.map(g=>{const ps=PERMS.filter(p=>p.group===g.k);
    return `<tr class="st-grp"><th colspan="6">${L(g.he,g.en)}</th></tr>`+ps.map(p=>{
      const enf=ST_ENFORCED.includes(p.k);
      return `<tr><td class="st-pn">${L(p.he,p.en)}${typeof devOn==='function'&&devOn()?`<small class="muted"><bdi>${p.k}</bdi></small>`:''}</td><td class="st-tagc">${enf?pillF(L('נאכף','Enforced'),'ok'):''}</td>`+
        ST_ROLES.map(r=>{const on=stPermOf(r,p.k),lock=r==='owner',ch=!lock&&on!==!!p[r];
          return `<td class="st-c" data-r="${esc(L(ROLES[r].he,ROLES[r].en))}"><label class="st-sw${ch?' chg':''}"${lock?` title="${L('תמיד פעיל עבור הבעלים','Always on for the owner')}"`:''}><input type="checkbox" class="st-tg" data-ch="st-perm" data-role="${r}" data-k="${p.k}"${on?' checked':''}${lock||ro?' disabled':''} aria-label="${esc(L(p.he,p.en))} · ${L(ROLES[r].he,ROLES[r].en)}"><i></i></label></td>`;}).join('')+`</tr>`;}).join('');}).join('');
  return `<div class="card st-card"><div class="st-h"><h3>${L('תפקידים והרשאות','Roles & permissions')}</h3><div class="row"><span class="muted small">${n?L(`${n} שינויים מברירת המחדל`,`${n} change${n===1?'':'s'} from the defaults`):L('ברירות מחדל','Defaults')}</span><button class="btn sm" data-act="st-reset"${d}>${ic('restart')} ${L('איפוס לברירת מחדל','Reset to defaults')}</button></div></div>
  <p class="muted st-note">${L('שורות שמסומנות ״נאכף״ פועלות בדמו. השאר מציגות את המדיניות המוצעת. עמודת הבעלים נעולה.','Rows marked Enforced are applied in this demo. The others show the proposed policy. The owner column is locked.')}</p>
  <div class="scroll"><table class="tbl st-tbl"><thead><tr><th>${L('הרשאה','Permission')}</th><th>${L('מצב','Status')}</th>${roleH}</tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function stStages(ro){
  const d=stDis(ro||!stCanStages());
  const cols=ST_STAGES.map(s=>`<div class="st-stage"><h4>${L(s.he,s.en)} <span class="muted small">${s.items.length}</span></h4>
   <ul class="st-list">${s.items.map((it,i)=>`<li><span class="pill ${it.c}">${esc(L(it.he,it.en))}</span>
     <input type="text" id="st-n-${it.id}" value="${esc(L(it.he,it.en))}" maxlength="40" data-ch="st-ren" data-s="${s.k}" data-i="${it.id}" aria-label="${L('שם הסטטוס','Status name')}"${d}>
     <select data-ch="st-col" data-s="${s.k}" data-i="${it.id}" aria-label="${L('צבע','Color')}"${d}>${ST_COLORS.map(c=>`<option value="${c}"${it.c===c?' selected':''}>${L(ST_CN[c][0],ST_CN[c][1])}</option>`).join('')}</select>
     <span class="st-ar"><button class="iconb" data-act="st-mv" data-s="${s.k}" data-i="${it.id}" data-v="-1" aria-label="${L('למעלה','Move up')}"${i===0?' disabled':d}>${ic('arrup')}</button><button class="iconb" data-act="st-mv" data-s="${s.k}" data-i="${it.id}" data-v="1" aria-label="${L('למטה','Move down')}"${i===s.items.length-1?' disabled':d}>${ic('arrdown')}</button><button class="iconb" data-act="st-del" data-s="${s.k}" data-i="${it.id}" aria-label="${L('מחיקה','Delete')}"${s.items.length<=1?' disabled':d}>${ic('x')}</button></span></li>`).join('')}</ul>
   <button class="btn sm" data-act="st-add" data-s="${s.k}"${d}>${ic('userplus')} ${L('הוספת סטטוס','Add status')}</button></div>`).join('');
  return `<div class="card st-card"><div class="st-h"><h3>${L('שלבים וסטטוסים','Stages and statuses')}</h3>${pillF(L('תצוגה מקדימה','Preview'),'info')}</div>
  <p class="muted st-note">${L('העריכה כאן היא תצוגה מקדימה: היא לא משנה את נתוני הטיולים. סטטוסים חדשים יופיעו בהמשך ברשימת הסטטוס של הפרויקט.','Editing here is a preview: it does not change trip data. New statuses will later appear in the project status list.')}</p>
  <div class="st-stages">${cols}</div></div>`;
}
function stForms(){
  const has=typeof VIEWS.forms==='function';
  return `<div class="card st-card st-link"><span class="st-ico">${ic('document')}</span><div><h3>${L('בונה הטפסים','Form builder')}</h3>
   <p class="muted">${has?L('בנו טפסי הרשמה, בריאות והסכמה לנוסעים ושלחו אותם עם ההצעה.','Build registration, medical and waiver forms for travelers and send them with the proposal.'):L('בונה הטפסים יגיע בגרסה הזו, בקרוב.','The form builder is coming in this build.')}</p></div>
   ${has?`<button class="btn pri" data-act="go" data-v="forms">${L('פתיחת הטפסים','Open forms')}</button>`:pillF(L('בקרוב','Coming soon'),'')}</div>`;
}
function stInteg(){
  const ok=typeof can!=='function'||can('fin.sync');
  return `<div class="card st-card st-link"><span class="st-ico">${ic('sync')}</span><div><h3>${L('סנכרון הנהלת חשבונות','Accounting sync')}</h3>
   <p class="muted">${L('חיבור ל-QuickBooks, Xero, פריוריטי או חשבשבת: מיפוי, כללי רישום ויומן סנכרון (פיילוט).','Connect QuickBooks, Xero, Priority or Hashavshevet: mapping, posting rules and a sync log (Pilot).')}${ok?'':' '+L('התפקיד שלך לא כולל הרשאת סנכרון.','Your role does not have the sync permission.')}</p></div>
   ${ok?`<button class="btn pri" data-act="go" data-v="books">${L('פתיחת הסנכרון','Open accounting sync')}</button>`:pillF(L('אין הרשאה','No access'),'warn')}</div>`;
}
function vSettings(){
  const ro=!stCanEdit();if(!ST_TABS.some(t=>t[0]===S.stSub))S.stSub='org';
  const body=S.stSub==='roles'?stRoles(ro):S.stSub==='stages'?stStages(ro):S.stSub==='forms'?stForms():S.stSub==='integ'?stInteg():stOrg(ro);
  return head(L('הגדרות','Settings'))+(ro?`<div class="card st-ro">${ic('lock')}<span>${L('המסך הזה במצב קריאה בלבד. רק בעלים או מנהל עם הרשאת עריכת הגדרות יכולים לשנות.','This page is read-only. Only an owner or admin with the Edit agency settings permission can change it.')}</span></div>`:'')+
   `<div class="tabs">${ST_TABS.map(t=>`<button class="${S.stSub===t[0]?'on':''}" data-act="st-sub" data-v="${t[0]}">${L(t[1][0],t[1][1])}</button>`).join('')}</div>${body}`;
}
VIEWS.settings=vSettings;
NAV.push(['settings',['הגדרות','Settings'],ic('settings')]);

/* ---------- events (own prefixes only) ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;if(a.slice(0,3)!=='st-')return;
  const s=b.dataset.s,i=b.dataset.i;
  if(a==='st-sub'){S.stSub=b.dataset.v;}
  else if(a==='st-reset'){if(stResetPerms())toast(L('ההרשאות אופסו לברירת המחדל','Permissions reset to the defaults'));}
  else if(a==='st-add'){stStageAdd(s);}
  else if(a==='st-mv'){stStageMove(s,i,+b.dataset.v);}
  else if(a==='st-del'){stStageDel(s,i);}
  save();render();
});
document.addEventListener('change',e=>{
  const el=e.target,k=el.dataset&&el.dataset.ch;if(!k||k.slice(0,3)!=='st-')return;
  if(k==='st-org')stSetOrg(el.dataset.k,el.value);
  else if(k==='st-perm')stSetPerm(el.dataset.role,el.dataset.k,el.checked);
  else if(k==='st-ren')stStageRename(el.dataset.s,el.dataset.i,el.value);
  else if(k==='st-col')stStageColor(el.dataset.s,el.dataset.i,el.value);
  save();render();
});
document.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset||el.dataset.stIn!=='st-org')return;
  if(!stSetOrg(el.dataset.k,el.value))return;
  const p=document.getElementById('st-prev');if(p)p.innerHTML='<b>'+L('דוגמה','Sample')+'</b>'+stPreviewLine();
  if(el.dataset.k==='logo'){const g=document.querySelector('.st-logo');if(g)g.textContent=ST_ORG.logo;}
  save();
});

/* ---------- tests (A8) ---------- */
TESTS.push({name:'st settings',run:h=>{const out=[],S=h.S,role0=S.role,lang0=S.lang;
  const count=(s,sub)=>s.split(sub).length-1;
  const sig=()=>{const P=portfolio(TRIPS);return P.rev+'/'+P.pp+'/'+P.fp;},s0=sig(),st0=JSON.stringify(TRIPS.map(t=>t.stage));
  const tabs=ST_TABS.map(t=>t[0]);
  /* every sub-tab, both languages, three roles */
  ['manager','accountant','Priya'].forEach(role=>{S.role=role;
    ['en','he'].forEach(lang=>{S.lang=lang;tabs.forEach(tb=>{S.stSub=tb;const html=VIEWS.settings();h.chk(html,'settings '+tb+' '+role+' '+lang);if(lang==='en')h.scan(html,'settings '+tb);
      if(!html.includes('data-act="st-sub"'))out.push('no sub-tabs '+tb);
      const ro=!can('settings.edit');if(ro!==html.includes('st-ro'))out.push(`read-only note mismatch ${role} ${tb}`);
      if(tb==='roles'&&ro&&(html.match(/<input type="checkbox" class="st-tg"[^>]*>/g)||[]).some(x=>!/disabled/.test(x)))out.push('read-only matrix has an enabled toggle for '+role);});});});
  S.lang='en';S.role='manager';S.stSub='roles';
  /* 40 x 4 = 160 toggles; 13 enforced tags, no matrix-only tags; owner column locked on */
  {const html=VIEWS.settings(),n=count(html,'class="st-tg"');if(n!==160)out.push('toggles '+n);
    if(count(html,'class="st-mx"')!==0)out.push('matrix-only tags '+count(html,'class="st-mx"'));
    if((html.match(/pill ok/g)||[]).length!==ST_ENFORCED.length)out.push('enforced tags');
    const own=html.match(/<input type="checkbox" class="st-tg"[^>]*data-role="owner"[^>]*>/g)||[];if(own.length!==40||own.some(x=>!/checked/.test(x)||!/disabled/.test(x)))out.push('owner column not locked on');}
  /* fin.view off for agent: can() false for Priya, Finance and Invoice check render noAccess, owner unaffected */
  if(!can('fin.view'))out.push('owner lacks fin.view');
  stSetPerm('agent','fin.view',false);
  S.role='Priya';if(can('fin.view'))out.push('Priya still has fin.view');
  ['finance','gaps'].forEach(v=>{const html=VIEWS[v]();if(!/Your role does not include this page/.test(html))out.push(v+' not gated for Priya');h.chk(html,v+' noAccess');});
  if(NAV_PERM.finance!=='fin.view'||NAV_PERM.gaps!=='fin.view')out.push('NAV_PERM not set');
  S.role='manager';if(/Your role does not include this page/.test(VIEWS.finance()))out.push('owner finance blocked');
  S.role='accountant';if(!can('fin.view'))out.push('accountant lost fin.view');
  /* the override is a persisted dataset and reset restores the default */
  {const ent=PERSIST.find(p=>p.key==='st-perms'),snap=JSON.parse(JSON.stringify(ent.get()));
    if(!snap||snap.agent['fin.view']!==false)out.push('perms not persisted');
    S.perms=null;ent.set(snap);S.role='Priya';if(can('fin.view'))out.push('perms set() lost override');
    S.role='manager';if(stPermChanges()!==1)out.push('change count '+stPermChanges());
    stResetPerms();S.role='Priya';if(!can('fin.view'))out.push('reset did not restore fin.view');S.role='manager';if(S.perms)out.push('reset left S.perms');
    stSetPerm('agent','fin.view',false);ent.reset();if(S.perms)out.push('PERSIST reset left S.perms');}
  /* toggling back to the default drops the override; owner is locked; unknown keys rejected */
  stSetPerm('admin','proj.delete',false);stSetPerm('admin','proj.delete',true);if(S.perms)out.push('default value kept as an override');
  if(stSetPerm('owner','fin.view',false)||stSetPerm('agent','nope',true)||stSetPerm('boss','fin.view',true))out.push('invalid stSetPerm accepted');
  /* without settings.edit nothing can be changed (agent) */
  S.role='Priya';if(stSetPerm('agent','fin.view',false)||stSetOrg('name','X')||stStageAdd('q','X')||stResetPerms())out.push('mutation allowed without settings.edit');S.role='manager';
  /* organization: previews follow the chosen formats, bad values are rejected */
  {stSetOrg('datefmt','YYYY-MM-DD');if(stPreview().date!=='2026-10-20')out.push('date preview '+stPreview().date);
    stSetOrg('datefmt','DD/MM/YYYY');if(stPreview().date!=='20/10/2026')out.push('date preview 2 '+stPreview().date);
    stSetOrg('datefmt','auto');if(stPreview().date!=='10/20/2026')out.push('auto EN date '+stPreview().date);S.lang='he';if(stPreview().date!=='20/10/2026')out.push('auto HE date');S.lang='en';
    stSetOrg('time','24h');if(stPreview().time!=='14:30')out.push('24h '+stPreview().time);stSetOrg('time','12h');if(stPreview().time!=='2:30 PM')out.push('12h '+stPreview().time);
    stSetOrg('cur','EUR');if(!/€/.test(stPreview().money))out.push('currency preview');
    stSetOrg('tax',8.5);if(!/85\.00/.test(stPreview().tax))out.push('tax preview '+stPreview().tax);
    if(stSetOrg('cur','XXX')||stSetOrg('time','7h')||stSetOrg('nope',1))out.push('invalid org accepted');
    stSetOrg('tax',999);if(ST_ORG.tax!==30)out.push('tax clamp');stSetOrg('name','  ');if(ST_ORG.name!==AGENCY)out.push('name fallback');
    const ent=PERSIST.find(p=>p.key==='st-org'),snap=ent.get();stSetOrg('name','Acme');ent.set(snap);if(ST_ORG.name!==AGENCY)out.push('org set()');stSetOrg('name','Acme');ent.reset();if(ST_ORG.name!==AGENCY||ST_ORG.cur!=='USD')out.push('org reset');
    ['en','he'].forEach(l=>{S.lang=l;S.stSub='org';const html=VIEWS.settings();h.chk(html,'org '+l);if(!html.includes('id="st-prev"'))out.push('no preview line');});S.lang='en';}
  /* stages: add, rename, move, color, delete; min one status; reset */
  {const q=stStageBy('q'),n0=q.items.length,it=stStageAdd('q','Won');if(!it||q.items.length!==n0+1)out.push('stage add');
    if(!stStageRename('q',it.id,'Booked')||q.items.find(x=>x.id===it.id).en!=='Booked')out.push('stage rename');
    if(!stStageMove('q',it.id,-1)||q.items[n0-1].id!==it.id)out.push('stage move');if(stStageMove('q',q.items[0].id,-1))out.push('moved above the top');
    if(!stStageColor('q',it.id,'red')||it.c!=='red'||stStageColor('q',it.id,'pink'))out.push('stage color');
    S.stSub='stages';['en','he'].forEach(l=>{S.lang=l;const html=VIEWS.settings();h.chk(html,'stages '+l);if(l==='en'){h.scan(html,'stages');if(!html.includes('Booked'))out.push('new status not shown');}});S.lang='en';
    if(!stStageDel('q',it.id)||q.items.length!==n0)out.push('stage delete');
    const f=stStageBy('f');while(f.items.length>1)stStageDel('f',f.items[0].id);if(stStageDel('f',f.items[0].id))out.push('deleted the last status');
    const ent=PERSIST.find(p=>p.key==='st-stages'),snap=ent.get();ent.reset();if(stStageBy('f').items.length!==3)out.push('stages reset');ent.set(snap);if(stStageBy('f').items.length!==1)out.push('stages set');ent.reset();
    if(JSON.stringify(TRIPS.map(t=>t.stage))!==st0)out.push('trip data changed');}
  /* finance printout unchanged by any of this */
  if(sig()!==s0)out.push('finance printout changed');
  S.role=role0;S.lang=lang0;S.stSub='org';return out;}});
