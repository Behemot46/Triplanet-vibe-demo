/* v8 module "sp": suppliers page, supplier card, in-trip supplier management (Contact / Pending / Approved / Price comparison), client card.
   Wraps VIEWS.suppliers (sub 'bank') and reassigns vClients. Every mutation is a named function (spSetFlow, spRequest, spChoose, spAssign,
   spOpen, spClose, spCliOpen, spCliClose) so tests can call it. Real brands (supplier.real): no performance, no amber, no negative wording. */
Object.assign(S,{supId:null,spTab:'ov',spQ:'',spDest:'All',spCat:'All',spPref:'All',spPage:0,spRpp:10,spBack:null,cliId:null,cliTab:'ov'});
const SP_UI=()=>({supId:null,spTab:'ov',spQ:'',spDest:'All',spCat:'All',spPref:'All',spPage:0,spRpp:10,spBack:null,cliId:null,cliTab:'ov'});
{const r0=resetDemo;resetDemo=function(){r0();Object.assign(S,SP_UI());};}

/* ---------- labels and small helpers ---------- */
const SP_FLOWS=['contact','pending','approved','compare'];
const SP_FL={contact:['יצירת קשר','Contact'],pending:['ממתין','Pending'],approved:['מאושר','Approved'],compare:['השוואת מחירים','Price comparison']};
const SP_ST={contact:'Not sent',pending:'Sent',approved:'Confirmed'};
const SP_FC={contact:'',pending:'blue',approved:'green',compare:'purple'};
const spFromSt=st=>st==='Confirmed'?'approved':st==='Sent'||st==='No reply'?'pending':'contact';
const spFlow=s=>s.flow==='compare'?'compare':spFromSt(s.st);
const spFlowL=f=>L(SP_FL[f][0],SP_FL[f][1]);
const SP_PREF={High:['גבוהה','High','green'],Medium:['בינונית','Medium','blue'],Low:['נמוכה','Low','']};
const spPrefPill=p=>{const x=SP_PREF[p]||SP_PREF.Medium;return pillF(L(x[0],x[1]),x[2]);};
const SP_UNIT={'room-night':['ללילה לחדר','per room night'],day:['ליום','per day'],person:['לאדם','per person'],meal:['לארוחה','per meal'],transfer:['להעברה','per transfer'],evening:['לערב','per evening']};
const spUnitL=u=>SP_UNIT[u]?L(SP_UNIT[u][0],SP_UNIT[u][1]):esc(u||'');
const SP_SEASON={Low:['עונת שפל','Off-peak'],Shoulder:['עונת ביניים','Shoulder'],High:['עונת שיא','Peak']};
const SP_MONTHS=[['ינו','Jan'],['פבר','Feb'],['מרץ','Mar'],['אפר','Apr'],['מאי','May'],['יוני','Jun'],['יולי','Jul'],['אוג','Aug'],['ספט','Sep'],['אוק','Oct'],['נוב','Nov'],['דצמ','Dec']];
const spMonths=k=>(SEASONS[k]||[]).slice().sort((a,b)=>a-b).map(m=>L(SP_MONTHS[m-1][0],SP_MONTHS[m-1][1])).join(', ');
const SP_PAY={ACH:['העברת ACH','ACH transfer'],Wire:['העברה בנקאית','Wire transfer'],Card:['כרטיס אשראי','Credit card'],Check:['המחאה','Check']};
const SP_SRC={Referral:['המלצה','Referral'],'Trade show':['תערוכה','Trade show'],Website:['אתר','Website'],Repeat:['לקוח חוזר','Repeat client']};
const SP_ROLE={'Group sales manager':'מנהל/ת מכירות קבוצות','Director of sales':'מנהל/ת מכירות','Group reservations':'הזמנות קבוצות','Charter manager':'מנהל/ת שכירות','Operations manager':'מנהל/ת תפעול','Group charter desk':'דסק שכירות קבוצות','Dispatch manager':'מנהל/ת שיגור','Group transfers desk':'דסק העברות קבוצות','Guide coordinator':'מתאם/ת מדריכים','Head of guiding':'ראש תחום הדרכה','Booking desk':'דסק הזמנות','Banquet manager':'מנהל/ת אירועים','Group dining manager':'מנהל/ת ארוחות קבוצות','Events desk':'דסק אירועים','Group sales':'מכירות קבוצות','Tour desk':'דסק סיורים','Group air specialist':'מומחה/ית טיסות קבוצות','Group desk manager':'מנהל/ת דסק קבוצות','Air desk':'דסק טיסות','Group program manager':'מנהל/ת תוכניות קבוצות','Plan administrator':'מנהל/ת תוכניות',
  'Church administrator':'מנהל/ת הקהילה','Pastor':'כומר','Alumni director':'מנהל/ת בוגרים','Club president':'יו"ר המועדון','Trip chaperone lead':'ראש המלווים','Music director':'מנהל/ת מוזיקלי','Activities chair':'יו"ר פעילות','Senior pastor':'כומר בכיר','Head of school travel':'אחראי/ת טיולי בית הספר','Missions pastor':'כומר משימות','Managing partner':'שותף/ה מנהל/ת','Association secretary':'מזכיר/ת העמותה','Choir director':'מנהל/ת המקהלה','Parish secretary':'מזכיר/ת הקהילה','Club treasurer':'גזבר/ית המועדון','Office manager':'מנהל/ת משרד','Deacon':'דיאקון','Principal':'מנהל/ת בית הספר','Events coordinator':'מתאם/ת אירועים','Program director':'מנהל/ת תוכניות','Secretary':'מזכיר/ה','Chair':'יושב/ת ראש','Director':'מנהל/ת','President':'נשיא/ה'};
const spRole=r=>L(SP_ROLE[r]||r,r);
const spPerson=n=>n==='Group sales desk'?L('דסק מכירות קבוצות',n):esc(n);
const spCan=k=>typeof can!=='function'||can(k);
const spNorm=s=>String(s||'').toLowerCase();
const spDestL=k=>k==='ALL'?L('כל היעדים','All destinations'):dn(k);
const spCatIc=s=>s.sub==='air'?'plane':({Lodging:'bed',Transport:'bus',Guide:'tour',Activities:'ticket',Meals:'meal',Insurance:'shield'}[s.cat]||'idcard');
const spDays=iso0=>Math.round((D(iso0)-TODAY)/DAY);
const spPh=p=>`<bdi dir="ltr">${esc(p)}</bdi>`;
const spMail=m=>`<bdi dir="ltr" class="sp-ell" title="${esc(m)}">${esc(m)}</bdi>`;
const spEditBtn=(sup,act,id,disWhy)=>`<button class="btn" data-act="${act}" ${id?`data-v="${esc(id)}"`:''} ${disWhy?`disabled title="${esc(disWhy)}"`:''}>${ic('pen')} ${L('עריכה','Edit')}</button>`;
const spNoForm=()=>typeof formOpen!=='function'?L('עורך הטפסים אינו זמין בגרסה הזו','The form editor is not available in this build'):'';

/* ---------- usage: which trips use which supplier (booked spend follows supplierBank: non-Quote trips, expected cost) ---------- */
function spUse(){
  const m={};
  TRIPS.forEach(t=>{const q=t.stage==='Quote';calc(t).lines.forEach(x=>{
    const e=m[x.l.sup]||(m[x.l.sup]={ids:new Set(),spend:0,rows:[]});
    e.ids.add(t.id);if(!q)e.spend=r2(e.spend+x.fc);e.rows.push({t,x,amt:q?x.planUSD:x.fc});});});
  return m;
}
/* document health for a fictional supplier: [pill html, needsAttention] */
function spDocs(s){
  if(s.real||!s.docs)return pillF(L('בתיק','On file'),'');
  const d=s.docs,parts=[];let warn=false,any=false;
  if(d.w9===false){parts.push(pillF(L('חסר W-9','W-9 missing'),'amber'));warn=true;}else if(d.w9===true)any=true;
  if(d.coi){const n=spDays(d.coi);any=true;if(n<0){parts.push(pillF(L('COI פג תוקף','COI expired'),'red'));warn=true;}else if(n<60){parts.push(pillF(L(`COI עוד ${n} י׳`,`COI ${n} d`),'amber'));warn=true;}}
  if(!parts.length)parts.push(any?pillF(L('תקין','Complete'),'green'):'<span class="muted">–</span>');
  return `<span class="sp-docs">${parts.join('')}</span>`;
}
const spThumb=s=>s.real?`<span class="al-thumb al-brand" style="--tc:${esc(alBrand(s.family).color)}">${esc(String(alBrand(s.family).label).charAt(0))}</span>`:`<span class="al-thumb">${ic(spCatIc(s))}</span>`;
const spRating=s=>s.real?(s.stars?alStars(s.stars):'<span class="muted">–</span>'):`<span class="sp-rt">${ic('star')}${s.rating.toFixed(1)}</span>`;

/* ---------- suppliers table ---------- */
function spFiltered(){
  const q=spNorm(S.spQ),d=S.spDest||'All',c=S.spCat||'All',p=S.spPref||'All',U=spUse();
  return SUPPLIERS.filter(s=>(d==='All'||s.dest===d)&&(c==='All'||s.cat===c)&&(p==='All'||s.pref===p)
    &&(!q||spNorm(s.name+' '+s.city+' '+(s.contact&&s.contact.name)+' '+s.id).includes(q)))
    .map(s=>({s,u:U[s.name]||null}))
    .sort((a,b)=>(b.u?b.u.spend:0)-(a.u?a.u.spend:0)||(b.u?b.u.ids.size:0)-(a.u?a.u.ids.size:0)||a.s.name.localeCompare(b.s.name));
}
function spRpp(){const v=+S.spRpp;return [5,10,25].includes(v)?v:10;}
function spPager(total){
  const rpp=spRpp(),pages=Math.max(1,Math.ceil(total/rpp));
  let p=+S.spPage||0;p=Math.min(Math.max(0,p),pages-1);S.spPage=p;
  const from=total?p*rpp+1:0,to=Math.min(total,(p+1)*rpp);
  return {rpp,p,pages,html:`<div class="al-pg"><span class="al-pgl">${L('שורות בעמוד','Rows per page')}</span>
    <select class="al-rpp" data-sp-rpp="1" aria-label="${L('שורות בעמוד','Rows per page')}">${[5,10,25].map(n=>`<option value="${n}" ${n===rpp?'selected':''}>${n}</option>`).join('')}</select>
    <span class="al-pgc">${from}–${to} ${L('מתוך','of')} ${total}</span>
    <button class="al-pgb" data-act="sp-prev" ${p<=0?'disabled':''} aria-label="${L('הקודם','Previous')}">${ic('chev','al-l')}</button>
    <button class="al-pgb" data-act="sp-next" ${p>=pages-1?'disabled':''} aria-label="${L('הבא','Next')}">${ic('chev','flip')}</button></div>`};
}
function spRow(r){
  const s=r.s,u=r.u,b=s.real?alBrand(s.family):null;
  return `<tr class="sp-row" data-sp-id="${esc(s.id)}"><td><span class="al-nm">${spThumb(s)}<span class="al-t"><strong><bdi>${esc(s.name)}</bdi></strong><small>${s.real?esc(b.label)+' · ':''}${esc(s.city)}</small></span></span></td>
    <td>${tn(s.cat)}</td><td>${spDestL(s.dest)}</td><td>${spPrefPill(s.pref)}</td><td>${spRating(s)}</td><td>${esc(s.cur)}</td><td class="n">${s.comm}%</td><td>${spDocs(s)}</td>
    <td class="n">${u?u.ids.size:0}</td><td class="n">${u&&u.spend?usd(u.spend):'–'}</td>
    <td class="al-ctl"><button class="al-go" data-act="sp-open" data-v="${esc(s.id)}" aria-label="${L('כרטיס ספק','Supplier card')}">${ic('chev','flip')}</button></td></tr>`;
}
/* the table body (rows of the current page, plus the pager); also used by tests to walk every page */
function spBody(){
  const rows=spFiltered(),pg=spPager(rows.length),page=rows.slice(pg.p*pg.rpp,(pg.p+1)*pg.rpp);
  return `<div class="scroll"><table class="tbl al-tbl sp-tbl"><thead><tr>${alTh(L('ספק','Supplier')+' '+ic('down'))}${alTh(L('קטגוריה','Category'))}${alTh(L('יעד','Destination'))}${alTh(L('העדפה','Preference'))}${alTh(L('דירוג','Rating'))}${alTh(L('מטבע','Currency'))}${alTh(L('עמלה','Commission'),'n')}${alTh(L('מסמכים','Documents'))}${alTh(L('טיולים','Trips'),'n')}${alTh(L('הוצאה','Spend'),'n')}<th class="al-ctl"></th></tr></thead><tbody>${page.map(spRow).join('')||alEmpty(11)}</tbody></table></div>${pg.html}`;
}
function spList(){
  const dests=[...new Set(SUPPLIERS.map(s=>s.dest))].sort((a,b)=>(a==='ALL'?-1:b==='ALL'?1:dn(a).localeCompare(dn(b))));
  const cats=[...new Set([...(typeof TYPES!=='undefined'?TYPES:[]),...SUPPLIERS.map(s=>s.cat)])].filter(c=>SUPPLIERS.some(s=>s.cat===c));
  const sel=(k,all,opts,cur)=>`<select class="al-sel" data-sp-f="${k}" aria-label="${all}"><option value="All">${all}</option>${opts.map(o=>`<option value="${esc(o[0])}" ${cur===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
  const newBtn=`<button class="btn pri" data-act="sp-new" ${spNoForm()||!spCan('sup.edit')?`disabled title="${esc(spNoForm()||L('התפקיד שלך לא כולל עריכת ספקים','Your role cannot edit suppliers'))}"`:''}>${L('ספק חדש','New supplier')}</button>`;
  const subs=[['bank',L('בנק ספקים','Supplier bank')],['prices',L('מחירון','Price list')],['import',L('ייבוא','Import')]];
  return head(L('ספקים','Suppliers'),newBtn)+`<div class="tabs">${subs.map(s=>`<button class="${(S.sub||'bank')===s[0]?'on':''}" data-act="sub" data-v="${s[0]}">${s[1]}</button>`).join('')}</div>
  <p class="muted">${L('כל הספקים בקטלוג עם תנאים, מחירון והחלופות שלהם. לחצו על שורה כדי לפתוח את כרטיס הספק.','Every supplier in the catalog with terms, rate cards and alternatives. Click a row to open the supplier card.')}</p>
  <div class="card al-card"><div class="al-filters">${sel('dest',L('כל היעדים','All destinations'),dests.map(k=>[k,spDestL(k)]),S.spDest)}${sel('cat',L('כל הקטגוריות','All categories'),cats.map(c=>[c,tn(c)]),S.spCat)}${sel('pref',L('כל ההעדפות','All preferences'),['High','Medium','Low'].map(p=>[p,L(SP_PREF[p][0],SP_PREF[p][1])]),S.spPref)}
  <label class="al-search">${ic('search')}<input type="text" data-sp-q="1" value="${esc(S.spQ||'')}" placeholder="${L('חיפוש','Search')}" aria-label="${L('חיפוש','Search')}"></label></div>
  <div id="sp-body">${spBody()}</div></div>`;
}

/* ---------- supplier card ---------- */
function spCancelTl(s){
  const c=s.cancel||[];
  return `<div class="sp-tl">${c.map(x=>`<div class="sp-tls"><i></i><b>${L(`${x[0]} ימים לפני`,`${x[0]} days before`)}</b><span>${x[1]?L(`דמי ביטול ${x[1]}%`,`${x[1]}% fee`):L('ללא דמי ביטול','No fee')}</span></div>`).join('')}</div>`;
}
const spCancelSum=c=>{c=c||[];if(!c.length)return '–';const f=c.find(x=>x[1]===0);return f?L(`ללא עלות עד ${f[0]} ימים לפני`,`Free until ${f[0]} days before`):L(`דמי ביטול מ-${c[0][0]} ימים לפני`,`Fee from ${c[0][0]} days before`);};
/* invoice accuracy for a fictional supplier, from gapStats().bySup: [invoices, gaps, gap amount USD] */
function spAccuracy(name){
  let inv=0;TRIPS.forEach(t=>{if(t.stage!=='Quote')t.lines.forEach(l=>{if(l.sup===name&&l.inv)inv++;});});
  const g=gapStats(TRIPS).bySup[name];return {inv,n:g?g.n:0,amt:g?g.amt:0};
}
function spPerfCard(s){
  if(s.real||s.showPerf===false)return '';
  const a=spAccuracy(s.name),pct=a.inv?Math.round((1-a.n/a.inv)*100):null;
  return `<div class="card sp-c"><h3>${L('ביצועים','Performance')}</h3><dl class="sp-kv"><dt>${L('דיוק חשבוניות','Invoice accuracy')}</dt><dd>${pct==null?L('אין חשבוניות עדיין','No invoices yet'):`<b>${pct}%</b> <span class="muted">${L(`${a.n} פערים מתוך ${a.inv} חשבוניות, ${usd(a.amt)}`,`${a.n} ${PLN(a.n,'gap','gaps')} in ${a.inv} ${PLN(a.inv,'invoice','invoices')}, ${usd(a.amt)}`)}</span>`}</dd>
    <dt>${L('זמן מענה','Reply time')}</dt><dd><b>${s.replyHrs}</b> ${L('שעות','hours')}</dd></dl></div>`;
}
function spDocsCard(s){
  if(s.real||!s.docs)return `<div class="card sp-c"><h3>${L('מסמכים','Documents')}</h3><p>${pillF(L('בתיק','On file'),'')} <span class="muted">${L('W-9, אישור ביטוח וחוזה שמורים בתיק הספק.','W-9, insurance certificate and contract are kept on file.')}</span></p></div>`;
  const d=s.docs,row=(k,v)=>`<dt>${k}</dt><dd>${v}</dd>`;
  const coi=d.coi?(()=>{const n=spDays(d.coi);return `${fmtDate(d.coi)} ${n<0?pillF(L('פג תוקף','Expired'),'red'):n<60?pillF(L(`עוד ${n} ימים`,`${n} ${PLN(n,'day','days')} left`),'amber'):pillF(L('בתוקף','Valid'),'green')}`;})():'<span class="muted">–</span>';
  return `<div class="card sp-c"><h3>${L('מסמכים','Documents')}</h3><dl class="sp-kv">${d.w9==null?'':row('W-9',d.w9?pillF(L('התקבל','Received'),'green'):pillF(L('חסר','Missing'),'amber'))}${row(L('אישור ביטוח (COI)','Insurance certificate (COI)'),coi)}${row(L('חוזה בתוקף עד','Contract valid to'),fmtDate(d.contractTo))}</dl></div>`;
}
function spRatesHtml(s){
  const rc=rateCard(s),vs=s.variants||[];
  return `<p class="muted">${L(`מחירי קבוצות להמחשה ב-${esc(s.cur)}, ${spUnitL(s.unit)}. ההצעה משתמשת במחיר של עונת היציאה ובגודל הקבוצה.`,`Illustrative group rates in ${esc(s.cur)}, ${spUnitL(s.unit)}. A quote uses the rate for the departure season and group size.`)}</p>
  ${Object.keys(SEASONS).map(se=>`<div class="card sp-c"><div class="sp-rh"><h3>${L(SP_SEASON[se][0],SP_SEASON[se][1])}</h3><span class="muted small">${spMonths(se)}</span></div><div class="scroll"><table class="tbl sp-rt-tbl"><thead><tr><th>${L('סוג','Variant')}</th>${BANDS.map(b=>`<th class="n">${b[0]}–${b[1]} ${L('נוסעים','travelers')}</th>`).join('')}</tr></thead><tbody>${vs.map(v=>`<tr><td>${L(v.he,v.en)}</td>${BANDS.map(b=>{const r=rc.find(x=>x.season===se&&x.variant===v.k&&x.band[0]===b[0]);return `<td class="n">${r?money(r.cost,s.cur):'–'}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div></div>`).join('')}`;
}
function spTripsHtml(s,U){
  const u=U[s.name],rows=u?u.rows:[];
  if(!rows.length)return `<div class="card sp-c"><p class="muted">${L('הספק עדיין לא משובץ באף טיול. הוא מופיע כחלופה בהשוואות מחירים.','This supplier is not used in any trip yet. It shows up as an alternative in price comparisons.')}</p></div>`;
  const by={};rows.forEach(r=>{(by[r.t.id]||(by[r.t.id]={t:r.t,names:[],amt:0}));by[r.t.id].names.push(r.x.l.name);by[r.t.id].amt=r2(by[r.t.id].amt+r.amt);});
  const list=Object.values(by).sort((a,b)=>D(a.t.dep)-D(b.t.dep));
  return `<div class="card sp-c" style="padding:0"><div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('טיול','Trip'))}${alTh(L('לקוח','Client'))}${alTh(L('שלב','Stage'))}${alTh(L('תאריכים','Dates'))}${alTh(L('שירותים','Services'))}${alTh(L('סכום','Amount'),'n')}</tr></thead><tbody>${list.map(x=>`<tr><td><button class="sp-lnk" data-act="open" data-v="${x.t.id}">${esc(x.t.name)}</button></td><td>${esc(x.t.client)}</td><td>${x.t.stage==='Quote'?pillF(qn(x.t.qst),''):pillF(stn(x.t.stage),'blue')}</td><td>${range(x.t)}</td><td class="small">${x.names.map(esc).join('; ')}</td><td class="n">${usd(x.amt)}</td></tr>`).join('')}</tbody><tfoot><tr><th colspan="5">${L('הוצאה בטיולים מאושרים (עלות צפויה)','Booked spend (expected cost)')}</th><th class="n">${usd(u.spend)}</th></tr></tfoot></table></div></div>`;
}
function spCardHtml(s,tab){
  tab=tab||S.spTab||'ov';
  const U=spUse(),u=U[s.name],real=!!s.real,b=real?alBrand(s.family):null,t=s.terms||{};
  const kv=(k,v)=>`<dt>${k}</dt><dd>${v}</dd>`;
  const tabs=[['ov',L('סקירה','Overview')],['rates',L('מחירון','Rate card')],['trips',L('טיולים והוצאה','Trips and spend')+` <span class="cnt">${u?u.ids.size:0}</span>`]];
  const editWhy=spNoForm()||(!spCan('sup.edit')?L('התפקיד שלך לא כולל עריכת ספקים','Your role cannot edit suppliers'):'');
  let body='';
  if(tab==='rates')body=spRatesHtml(s);
  else if(tab==='trips')body=spTripsHtml(s,U);
  else body=`<div class="sp-grid"><div class="card sp-c"><h3>${L('איש קשר','Contact')}</h3><dl class="sp-kv">${kv(L('שם','Name'),spPerson(s.contact.name))}${kv(L('תפקיד','Role'),esc(spRole(s.contact.role)))}${kv(ic('mail')+' '+L('אימייל','Email'),spMail(s.contact.email))}${kv(L('טלפון','Phone'),spPh(s.contact.phone))}${kv(L('מטבע','Currency'),esc(s.cur))}${kv(L('עמלה לסוכנות','Commission to the agency'),s.comm+'%')}</dl></div>
    <div class="card sp-c"><h3>${L('תנאי תשלום','Payment terms')}</h3><dl class="sp-kv">${kv(L('מקדמה','Deposit'),L(`${t.depPct}% תוך ${t.depDays} ימים מההזמנה`,`${t.depPct}% within ${t.depDays} days of booking`))}${kv(L('יתרה','Balance'),L(`${t.balDays} ימים לפני ההגעה`,`${t.balDays} days before arrival`))}${kv(L('אמצעי תשלום','Pay by'),L(SP_PAY[t.payBy]?SP_PAY[t.payBy][0]:esc(t.payBy),SP_PAY[t.payBy]?SP_PAY[t.payBy][1]:esc(t.payBy)))}</dl></div>
    <div class="card sp-c sp-wide"><h3>${L('מדיניות ביטול','Cancellation policy')}</h3>${spCancelTl(s)}</div>
    ${spDocsCard(s)}${spPerfCard(s)}
    <div class="card sp-c sp-wide"><h3>${L('הערות','Notes')}</h3><p>${esc(L(s.notes.he,s.notes.en))}</p></div></div>`;
  return `<div class="sp-hd"><button class="pj-back" data-act="sp-close" aria-label="${L('חזרה לספקים','Back to suppliers')}">${ic('chev','flip back')}</button>${spThumb(s).replace('al-thumb','al-thumb sp-big')}
    <div class="sp-ht"><h1><bdi>${esc(s.name)}</bdi></h1><div class="sp-pills">${real?brandBadge(s.family):''}${pillF(tn(s.cat),'blue')}${spPrefPill(s.pref)}${real?(s.stars?alStars(s.stars):''):`<span class="sp-rt">${ic('star')}${s.rating.toFixed(1)}</span>`}<span class="muted small">${esc(s.city)}, ${esc(s.country)} · ${spDestL(s.dest)}</span></div></div>
    <div class="sp-ha">${spEditBtn(s,'sp-edit',s.id,editWhy)}</div></div>
  <div class="tabs sp-tabs">${tabs.map(x=>`<button class="${tab===x[0]?'on':''}" data-act="sp-tab" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>${body}`;
}
function spPage(){
  const s=S.supId&&SUP_BY[S.supId];
  if(s)return `<div class="sp-page">${spCardHtml(s)}</div>`;
  if(S.supId)S.supId=null;
  return spList();
}
{const v0=VIEWS.suppliers;VIEWS.suppliers=function(){if(S.sub&&S.sub!=='bank')return v0.apply(this,arguments);return spPage();};}

/* ---------- supplier card: open and close ---------- */
function spOpen(id,from){
  if(!SUP_BY[id])return false;
  S.spBack=from==='trip'?{tab:S.tab,ptab:S.ptab,tripId:S.tripId}:null;
  S.supId=id;S.spTab='ov';S.tab='suppliers';S.sub='bank';S.menu=false;
  render();window.scrollTo(0,0);return true;
}
function spClose(){
  const b=S.spBack;S.supId=null;S.spBack=null;
  if(b){S.tab=b.tab;S.ptab=b.ptab;S.tripId=b.tripId;}
  render();window.scrollTo(0,0);
}

/* ---------- in-trip supplier management ---------- */
const spInit=t=>{(t.sups||[]).forEach(s=>{if(!s.flow)s.flow=spFromSt(s.st);});};
TRIP_INIT.push(spInit);TRIPS.forEach(spInit);
const spLine=(t,s)=>t.lines.find(l=>l.id===s.line)||t.lines.find(l=>l.sup===s.n)||null;
function spSetFlow(t,i,flow){
  const s=t&&t.sups&&t.sups[i];if(!s||!SP_FLOWS.includes(flow))return false;
  if(flow==='compare')s.flow='compare';
  else{s.flow=flow;if(!(flow==='pending'&&s.st==='No reply'))s.st=SP_ST[flow];}
  return true;
}
/* components whose supplier is not on the trip's supplier list */
const spUnassigned=t=>t.lines.filter(l=>!t.sups.some(s=>s.n===l.sup));
function spAssign(t,lineId){
  const l=t.lines.find(x=>x.id===+lineId||x.id===lineId);if(!l||t.sups.some(s=>s.n===l.sup))return -1;
  t.sups.push({n:l.sup,cat:l.type,line:l.id,st:'Not sent',flow:'contact'});return t.sups.length-1;
}
/* simulated "Request quotes": every alternative is marked requested, reply by TODAY+3 */
function spRequest(t,i){
  const s=t.sups[i],l=s&&spLine(t,s);if(!l)return 0;
  const by=addDays(iso(TODAY),3);s.reqs=s.reqs||{};let n=0;
  altsFor(t,l).forEach(a=>{if(!a.inc){s.reqs[a.sup.id]=by;n++;}});
  s.flow='compare';return n;
}
/* why Choose is unavailable ('' when allowed) */
function spChooseWhy(t,i){
  const s=t.sups[i],l=s&&spLine(t,s);if(!l)return L('אין שורה בהצעה','No component on the quote');
  if(spFromSt(s.st)==='approved')return L('הספק כבר אושר. החזירו אותו לממתין כדי להחליף.','Already approved. Move it back to Pending to switch supplier.');
  if(l.inv)return L('לשירות הזה כבר יש חשבונית ספק.','This component already has a supplier invoice.');
  if(t.stage==='Closed')return L('הטיול סגור.','The trip is closed.');
  if(!spCan('sup.swap'))return L('התפקיד שלך לא כולל החלפת ספקים.','Your role cannot swap suppliers.');
  if(typeof tbSwap!=='function')return L('החלפת ספק אינה זמינה בגרסה הזו.','Supplier swap is not available in this build.');
  return '';
}
function spChoose(t,i,supId){
  const why=spChooseWhy(t,i);if(why)return {ok:false,reason:why};
  const s=t.sups[i],r=tbSwap(t,s.line,supId);
  if(!r||!r.ok)return {ok:false,reason:(r&&r.reason)||L('ההחלפה לא בוצעה.','The swap did not go through.')};
  s.reqs={};s.flow=spFromSt(s.st);
  return {ok:true,delta:r.delta};
}
const spDelta=d=>!d?'<span class="muted">–</span>':`<b class="${d<0?'sp-dn':''}">${d<0?'−':'+'}${usd(Math.abs(d))}</b>`;
function spComparePanel(t,i,c){
  const s=t.sups[i],l=spLine(t,s);if(!l)return '';
  const alts=altsFor(t,l),why=spChooseWhy(t,i),perm=spCan('ops.suppliers');
  const X=c.lines.find(x=>x.l===l);
  const row=a=>{const sp=a.sup,req=s.reqs&&s.reqs[sp.id];
    return `<tr><td><span class="al-nm">${spThumb(sp)}<span class="al-t"><strong><bdi>${esc(sp.name)}</bdi></strong><small>${sp.real?brandBadge(sp.family):esc(sp.city)}</small>${a.inc?'':req?pillF(L(`נשלחה בקשה, מענה עד ${fmtDate(req)}`,`Requested, reply by ${fmtDate(req)}`),'blue'):''}</span></span></td>
    <td>${a.inc?pillF(L('הספק הנוכחי','Current supplier'),'blue'):spPrefPill(a.pref)}</td><td>${sp.real?(sp.stars?alStars(sp.stars):'<span class="muted">–</span>'):`<span class="sp-rt">${ic('star')}${sp.rating!=null?sp.rating.toFixed(1):'–'}</span>`}</td>
    <td class="n">${money(a.cost,a.cur)}</td><td class="n">${a.inc?'<span class="muted">–</span>':spDelta(a.delta)}</td><td class="small">${spCancelSum(a.cancel)}</td><td class="n">${a.comm}%</td>
    <td class="al-ctl">${a.inc?'':`<button class="btn sm pri" data-act="sp-choose" data-v="${i}|${esc(sp.id)}" ${why||!perm?`disabled title="${esc(why||L('התפקיד שלך לא כולל ניהול ספקים','Your role cannot manage suppliers'))}"`:''}>${L('בחירה','Choose')}</button>`}</td></tr>`;};
  return `<div class="card sp-cmp"><div class="da-h"><h3>${L('השוואת מחירים','Price comparison')}: <bdi>${esc(l.name)}</bdi></h3><button class="btn sm" data-act="sp-req" data-v="${i}" ${perm?'':`disabled title="${esc(L('התפקיד שלך לא כולל ניהול ספקים','Your role cannot manage suppliers'))}"`}>${ic('mail')} ${L('בקשת הצעות מחיר','Request quotes')}</button></div>
  <p class="muted small">${L(`עלות נוכחית: ${money(l.cost,l.cur)} ${spUnitL(l.unit)}, ${l.qty} ${esc(l.unit)}${X?`, ${usd(X.planUSD)} בסך הכול`:''}. ההפרש מחושב על כל השורה.`,`Current cost: ${money(l.cost,l.cur)} ${spUnitL(l.unit)}, ${l.qty} ${esc(l.unit)}${X?`, ${usd(X.planUSD)} in total`:''}. The change is for the whole line.`)}</p>
  <div class="scroll"><table class="tbl sp-alt"><thead><tr><th>${L('ספק','Supplier')}</th><th>${L('העדפה','Preference')}</th><th>${L('דירוג','Rating')}</th><th class="n">${L('עלות ליחידה','Unit cost')}</th><th class="n">${L('שינוי בשורה','Line change')}</th><th>${L('ביטול','Cancellation')}</th><th class="n">${L('עמלה','Commission')}</th><th class="al-ctl"></th></tr></thead><tbody>${alts.map(row).join('')}</tbody></table></div>
  ${why?`<p class="small muted sp-why">${ic('lock')} ${why}</p>`:''}</div>`;
}
function spmTab(t){
  if(t.stage==='Quote')return gate(t,L('ספקים','Suppliers'));
  spInit(t);
  const c=calc(t),cnt={contact:0,pending:0,approved:0,compare:0};t.sups.forEach(s=>{cnt[spFlow(s)]++;});
  const un=spUnassigned(t),perm=spCan('ops.suppliers'),n=t.sups.length,ok=t.sups.filter(s=>spFromSt(s.st)==='approved').length;
  const sum=`<div class="sp-sum">${SP_FLOWS.map(f=>`<span class="sp-chip">${pillF(spFlowL(f),SP_FC[f])}<b>${cnt[f]}</b></span>`).join('')}<span class="muted small">${L(`${ok} מתוך ${n} ספקים אושרו`,`${ok} of ${n} ${PLN(n,'supplier','suppliers')} approved`)}</span></div>`;
  const unHtml=un.length?`<div class="card sp-un"><h3>${L('רכיבים בלי ספק ברשימה','Unassigned components')}</h3><p class="muted small">${L('שורות בהצעה שהספק שלהן עדיין לא ברשימת הספקים של הטיול.','Quote lines whose supplier is not yet on this trip\'s supplier list.')}</p><div class="scroll"><table class="tbl"><thead><tr><th>${L('רכיב','Component')}</th><th>${L('ספק','Supplier')}</th><th class="al-ctl"></th></tr></thead><tbody>${un.map(l=>`<tr><td>${esc(l.name)}</td><td>${esc(l.sup)}</td><td class="al-ctl"><button class="btn sm" data-act="sp-assign" data-v="${l.id}" ${perm?'':'disabled'}>${L('הוספה לרשימה','Add to list')}</button></td></tr>`).join('')}</tbody></table></div></div>`:'';
  const rows=t.sups.map((s,i)=>{
    const l=spLine(t,s),X=l&&c.lines.find(x=>x.l===l),sp=supByName(s.n),f=spFlow(s);
    return `<tr><td><span class="al-nm">${sp?spThumb(sp):`<span class="al-thumb">${ic('idcard')}</span>`}<span class="al-t"><strong>${sp?`<button class="sp-lnk" data-act="sp-open" data-v="${esc(sp.id)}" data-from="trip"><bdi>${esc(s.n)}</bdi></button>`:`<bdi>${esc(s.n)}</bdi>`}</strong><small>${tn(s.cat)}${sp&&sp.real?' · '+esc(alBrand(sp.family).label):''}</small></span></span></td>
      <td>${l?esc(l.name):'–'}</td><td class="n">${X?usd(X.planUSD):'–'}</td>
      <td><div class="sp-seg" role="group" aria-label="${L('סטטוס ספק','Supplier status')}">${SP_FLOWS.map(k=>`<button class="${f===k?'on '+k:''}" data-act="sp-set" data-v="${i}|${k}" aria-pressed="${f===k}" ${perm?'':'disabled'}>${spFlowL(k)}</button>`).join('')}</div></td></tr>`;}).join('');
  const panels=t.sups.map((s,i)=>spFlow(s)==='compare'?spComparePanel(t,i,c):'').join('');
  return `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">${L('ספקי הטיול','Trip suppliers')}</h2></div>${sum}${unHtml}
  <div class="card" style="padding:0"><div class="scroll"><table class="tbl al-tbl sp-trip"><thead><tr>${alTh(L('ספק','Supplier'))}${alTh(L('רכיב','Component'))}${alTh(L('עלות בדולרים','Cost in USD'),'n')}${alTh(L('סטטוס','Status'))}</tr></thead><tbody>${rows}</tbody></table></div></div>
  ${panels?`<div class="sp-panels">${panels}</div>`:`<p class="muted small" style="margin-top:12px">${L('בחרו "השוואת מחירים" בשורת ספק כדי לראות את הספק הנוכחי מול שתי חלופות.','Pick "Price comparison" on a supplier row to see the current supplier next to two alternatives.')}</p>`}`;
}
tabInsert('o',['spm','ספקים','Suppliers','idcard']);
TRIP_TABS.spm=t=>{const h=spmTab(t);return t.stage==='Quote'||typeof supMsgCard!=='function'?h:h+supMsgCard(t);};

/* ---------- client card ---------- */
const spCli=()=>S.cliId?(CLI_BY[S.cliId]||cliByName(S.cliId)||(TRIPS.some(t=>t.client===S.cliId)?{id:null,name:S.cliId,type:(TRIPS.find(t=>t.client===S.cliId)||{}).ctype||'Prospect',city:'',state:'',contact:{name:'',role:'',email:'',phone:''},since:'',taxExempt:false,source:'',notes:{en:'',he:''}}:null)):null;
function spCliOpen(name){
  const c=cliByName(name)||CLI_BY[name];
  S.cliId=c?c.id:name;S.cliTab='ov';S.tab='clients';S.menu=false;render();window.scrollTo(0,0);return !!spCli();
}
function spCliClose(){S.cliId=null;render();window.scrollTo(0,0);}
/* a client's money: documents from incomeDocs across its non-Quote trips; billed = deal invoices, received = tax invoices (receipts) */
function spCliFin(name){
  const trips=TRIPS.filter(t=>t.client===name&&canSee(t)),rows=[],docs=[];let billed=0,received=0,booked=0;
  trips.filter(t=>t.stage!=='Quote').forEach(t=>{
    const {docs:d}=incomeDocs(t),b=r2(d.filter(x=>x.type==='deal').reduce((a,x)=>a+x.amt,0)),r=r2(d.filter(x=>x.type==='receipt').reduce((a,x)=>a+x.amt,0)),rev=calc(t).rev;
    billed=r2(billed+b);received=r2(received+r);booked=r2(booked+rev);rows.push({t,billed:b,received:r,open:r2(b-r),rev});d.forEach(x=>docs.push({...x,t}));});
  return {trips,rows,docs,billed,received,open:r2(billed-received),booked};
}
function spCliHtml(c,tab){
  tab=tab||S.cliTab||'ov';
  const F=spCliFin(c.name),ty=CTYPE[c.type]||[c.type,c.type,''],ct=c.contact||{};
  const quotes=F.trips.filter(t=>t.stage==='Quote'),qv=r2(quotes.reduce((a,t)=>a+calc(t).rev,0));
  const editWhy=spNoForm()||(!spCan('cli.edit')?L('התפקיד שלך לא כולל עריכת לקוחות','Your role cannot edit clients'):'');
  const kv=(k,v)=>`<dt>${k}</dt><dd>${v}</dd>`,sr=SP_SRC[c.source];
  const tabs=[['ov',L('סקירה','Overview')],['fin',L('כספים','Finance')]];
  const tripRows=F.trips.slice().sort((a,b)=>D(b.dep)-D(a.dep)).map(t=>`<tr><td><button class="sp-lnk" data-act="open" data-v="${t.id}">#${t.no} ${esc(t.name)}</button></td><td>${t.stage==='Quote'?pillF(qn(t.qst),''):pillF(stn(t.stage),'blue')}</td><td>${range(t)}</td><td class="n">${t.pax}</td><td class="n">${usd(calc(t).rev)}</td><td>${agn(t.agent)}</td></tr>`).join('');
  let body='';
  if(tab==='fin'){
    const docLab={deal:L('חשבונית עסקה','Deal invoice'),receipt:L('חשבונית מס קבלה','Tax invoice')};
    body=`<div class="sp-sum sp-fin"><span class="sp-kpi"><small>${L('הכנסה סגורה','Booked revenue')}</small><b>${usd(F.booked,2)}</b></span><span class="sp-kpi"><small>${L('חויב','Billed')}</small><b>${usd(F.billed,2)}</b></span><span class="sp-kpi"><small>${L('התקבל','Received')}</small><b>${usd(F.received,2)}</b></span><span class="sp-kpi"><small>${L('פתוח','Open')}</small><b class="${F.open>0?'due':''}">${usd(F.open,2)}</b></span></div>
    ${F.rows.length?`<div class="card" style="padding:0"><div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('טיול','Trip'))}${alTh(L('סך הטיול','Trip total'),'n')}${alTh(L('חויב','Billed'),'n')}${alTh(L('התקבל','Received'),'n')}${alTh(L('פתוח','Open'),'n')}</tr></thead><tbody>${F.rows.map(r=>`<tr><td><button class="sp-lnk" data-act="open" data-v="${r.t.id}|income">#${r.t.no} ${esc(r.t.name)}</button></td><td class="n">${usd(r.rev,2)}</td><td class="n">${usd(r.billed,2)}</td><td class="n">${usd(r.received,2)}</td><td class="n">${usd(r.open,2)}</td></tr>`).join('')}</tbody></table></div></div>
    <h3 class="al-h2">${L('מסמכים','Documents')}</h3><div class="card" style="padding:0"><div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('מסמך','Document'))}${alTh(L('מספר','Number'))}${alTh(L('טיול','Trip'))}${alTh(L('תאריך','Date'))}${alTh(L('סכום','Amount'),'n')}${alTh(L('סטטוס','Status'))}</tr></thead><tbody>${F.docs.map(d=>`<tr><td>${docLab[d.type]}<div class="small muted">${d.kind==='dep'?L('מקדמה','Deposit'):L('יתרה','Balance')}</div></td><td>${d.no}</td><td>#${d.t.no}</td><td>${fmtDate(d.date)}</td><td class="n">${usd(d.amt,2)}</td><td>${d.st==='paid'?pillF(L('התקבל תשלום','Payment received'),'green'):pillF(L('נשלחה דרישת תשלום','Payment requested'),'amber')}</td></tr>`).join('')||alEmpty(6)}</tbody></table></div></div>`
    :`<div class="card sp-c"><p class="muted">${L('אין עדיין חיוב. הצעות מחיר לא מפיקות חשבוניות.','Nothing billed yet. Quotes do not issue invoices.')}</p></div>`}`;
  }else body=`<div class="sp-grid"><div class="card sp-c"><h3>${L('איש קשר','Contact')}</h3><dl class="sp-kv">${kv(L('שם','Name'),esc(ct.name||'–'))}${kv(L('תפקיד','Role'),esc(ct.role?spRole(ct.role):'–'))}${kv(L('אימייל','Email'),ct.email?spMail(ct.email):'–')}${kv(L('טלפון','Phone'),ct.phone?spPh(ct.phone):'–')}${kv(L('עיר','Location'),esc([c.city,c.state].filter(Boolean).join(', ')||'–'))}</dl></div>
    <div class="card sp-c"><h3>${L('פרטי לקוח','Client details')}</h3><dl class="sp-kv">${kv(L('סוג','Type'),pillF(L(ty[0],ty[1]),ty[2]))}${kv(L('פטור ממס','Tax status'),c.taxExempt?pillF(L('פטור ממס','Tax-exempt'),'green'):pillF(L('חייב במס','Taxable'),''))}${kv(L('לקוח מאז','Client since'),esc(c.since||'–'))}${kv(L('מקור','Source'),sr?L(sr[0],sr[1]):esc(c.source||'–'))}${kv(L('טיולים','Trips'),F.trips.length)}${kv(L('הצעות פתוחות','Open quotes'),quotes.length?`${quotes.length} · ${usd(qv)}`:'0')}</dl></div>
    ${c.lead&&c.lead.open?`<div class="card sp-c sp-wide"><h3>${L('פנייה פתוחה','Open lead')}</h3><p>${esc(L(c.lead.he,c.lead.en))}</p></div>`:''}
    <div class="card sp-c sp-wide"><h3>${L('הערות','Notes')}</h3><p>${esc(L((c.notes||{}).he,(c.notes||{}).en)||'–')}</p></div>
    <div class="card sp-c sp-wide" style="padding:0"><div class="sp-ch"><h3>${L('טיולים','Trips')}</h3></div>${F.trips.length?`<div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('טיול','Trip'))}${alTh(L('שלב','Stage'))}${alTh(L('תאריכים','Dates'))}${alTh(L('נוסעים','Travelers'),'n')}${alTh(L('שווי','Value'),'n')}${alTh(L('סוכן/ת','Agent'))}</tr></thead><tbody>${tripRows}</tbody></table></div>`:`<p class="muted" style="padding:0 20px 16px">${L('עדיין אין טיולים ללקוח הזה.','No trips for this client yet.')}</p>`}</div></div>`;
  return `<div class="sp-hd"><button class="pj-back" data-act="sp-cli-close" aria-label="${L('חזרה ללקוחות','Back to clients')}">${ic('chev','flip back')}</button><span class="al-thumb al-av sp-big">${esc(String(c.name).charAt(0))}</span>
    <div class="sp-ht"><h1><bdi>${esc(c.name)}</bdi></h1><div class="sp-pills">${pillF(L(ty[0],ty[1]),ty[2])}${c.taxExempt?pillF(L('פטור ממס','Tax-exempt'),'green'):''}<span class="muted small">${esc([c.city,c.state].filter(Boolean).join(', '))}</span></div></div>
    <div class="sp-ha">${spEditBtn(c,'sp-cli-edit',null,editWhy)}</div></div>
  <div class="tabs sp-tabs">${tabs.map(x=>`<button class="${tab===x[0]?'on':''}" data-act="sp-cli-tab" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>${body}`;
}
{const v0=vClients;vClients=function(){const c=spCli();if(c)return `<div class="sp-page">${spCliHtml(c)}</div>`;if(S.cliId)S.cliId=null;return v0.apply(this,arguments);};}
function spCliEdit(){const c=spCli();if(c&&c.id&&typeof formOpen==='function'&&spCan('cli.edit')){formOpen('client',c);return true;}return false;}
function spCliNew(){if(typeof formOpen==='function'&&spCan('cli.edit')){formOpen('client',null);return true;}return false;}

/* ---------- events (every handler only calls a named function) ---------- */
const spPartial=()=>{const el=document.getElementById('sp-body');if(el)el.innerHTML=spBody();};
document.addEventListener('click',e=>{
  const g=e.target.closest&&e.target.closest('[data-act="go"],[data-act="sub"]');
  if(g){S.supId=null;S.cliId=null;S.spBack=null;}
},true);
document.addEventListener('click',e=>{
  const row=e.target.closest&&e.target.closest('tr[data-sp-id]');
  if(row&&!e.target.closest('button,a,input,select')){spOpen(row.dataset.spId);return;}
  const b=e.target.closest&&e.target.closest('[data-act^="sp-"]');if(!b)return;
  const a=b.dataset.act,v=b.dataset.v,t=T();
  if(a==='sp-open')spOpen(v,b.dataset.from);
  else if(a==='sp-close')spClose();
  else if(a==='sp-tab'){S.spTab=v;render();}
  else if(a==='sp-prev'||a==='sp-next'){S.spPage=(+S.spPage||0)+(a==='sp-next'?1:-1);spPartial();}
  else if(a==='sp-new'){if(typeof formOpen==='function')formOpen('supplier',null);}
  else if(a==='sp-edit'){const s=SUP_BY[S.supId];if(s&&typeof formOpen==='function'&&spCan('sup.edit'))formOpen('supplier',s);}
  else if(a==='sp-set'&&t){const p=v.split('|');if(spCan('ops.suppliers')&&spSetFlow(t,+p[0],p[1]))render();}
  else if(a==='sp-req'&&t){const n=spRequest(t,+v);render();toast(L(`נשלחו בקשות הצעת מחיר ל-${n} חלופות. מענה עד ${fmtDate(addDays(iso(TODAY),3))}.`,`Quotes requested from ${n} ${PLN(n,'alternative','alternatives')}. Reply by ${fmtDate(addDays(iso(TODAY),3))}.`));}
  else if(a==='sp-choose'&&t){const p=v.split('|'),r=spChoose(t,+p[0],p[1]);render();toast(r.ok?L(`הספק הוחלף. שינוי בעלות: ${r.delta<0?'−':'+'}${usd(Math.abs(r.delta||0))}`,`Supplier switched. Cost change: ${r.delta<0?'−':'+'}${usd(Math.abs(r.delta||0))}`):r.reason);}
  else if(a==='sp-assign'&&t){spAssign(t,v);render();}
  else if(a==='sp-cli-close')spCliClose();
  else if(a==='sp-cli-tab'){S.cliTab=v;render();}
  else if(a==='sp-cli-edit')spCliEdit();
});
document.addEventListener('change',e=>{
  const el=e.target,d=el.dataset;if(!d)return;
  if(d.spF){S[{dest:'spDest',cat:'spCat',pref:'spPref'}[d.spF]]=el.value;S.spPage=0;spPartial();}
  else if(d.spRpp){S.spRpp=+el.value;S.spPage=0;spPartial();}
});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.spQ){S.spQ=el.value;S.spPage=0;spPartial();}});

/* ---------- tests ---------- */
TESTS.push({name:'sp suppliers table, cards, in-trip flow, client card',run:h=>{
  const out=[],{S}=h,BAD=/gap|overbill|dispute|late|slow|poor|expir|low/i,keep=S.lang;
  const sampleIds=a=>{const o=[];for(let i=0;i<a.length;i+=Math.max(1,Math.floor(a.length/10)))o.push(a[i]);return o;};
  /* 1. every SUPPLIERS row renders (all pages, both rows-per-page sizes used) */
  S.lang='en';S.sub='bank';S.supId=null;S.spQ='';S.spDest='All';S.spCat='All';S.spPref='All';S.spRpp=25;S.spPage=0;
  const seen=new Set();
  for(let p=0;p<Math.ceil(SUPPLIERS.length/25)+1;p++){S.spPage=p;const html=spBody();h.chk(html,'sp table p'+p);h.scan(html,'sp table');
    (html.match(/data-sp-id="[^"]+"/g)||[]).forEach(x=>seen.add(x));
    html.split('<tr class="sp-row"').slice(1).forEach(r=>{const row=r.split('</tr>')[0];if(SUPPLIERS.some(s=>s.real&&row.includes('>'+esc(s.name)+'<'))&&BAD.test(row.replace(/data-sp-id="[^"]*"/,'')))out.push('real row has negative wording: '+row.slice(0,80));});}
  if(seen.size!==SUPPLIERS.length)out.push('table rows '+seen.size+' vs '+SUPPLIERS.length);
  S.spPage=0;
  /* filters */
  S.spDest='Branson';let f=spFiltered();if(!f.length||f.some(r=>r.s.dest!=='Branson'))out.push('dest filter');
  S.spCat='Lodging';f=spFiltered();if(f.some(r=>r.s.cat!=='Lodging'||r.s.dest!=='Branson'))out.push('cat filter');
  S.spPref='High';f=spFiltered();if(f.some(r=>r.s.pref!=='High'))out.push('pref filter');
  S.spDest='All';S.spCat='All';S.spPref='All';S.spQ='hilton';f=spFiltered();if(!f.length||f.some(r=>!/hilton/i.test(r.s.name+r.s.city+r.s.contact.name+r.s.id)))out.push('search');
  S.spQ='zzzz-none';if(spFiltered().length)out.push('search none');h.chk(spBody(),'sp empty');S.spQ='';S.spRpp=10;S.spPage=0;
  /* 2. supplier cards: 10 sampled fictional, every real; EN and HE; real cards carry no negative wording or performance */
  const reals=SUPPLIERS.filter(s=>s.real),fict=SUPPLIERS.filter(s=>!s.real),sample=[...sampleIds(fict),...reals.slice(0,3)];
  for(const lang of ['en','he']){S.lang=lang;
    sample.forEach(s=>['ov','rates','trips'].forEach(tab=>{const html=spCardHtml(s,tab);h.chk(html,'sp card '+s.id+'/'+tab);if(lang==='en')h.scan(html,'sp card '+tab);}));
    reals.forEach(s=>{const html=spCardHtml(s,'ov')+spCardHtml(s,'rates');if(BAD.test(html))out.push('real card wording '+s.id+': '+(html.match(/.{20}(gap|overbill|dispute|late|slow|poor|expir|low).{12}/i)||[''])[0]);
      if(!/Group sales desk|דסק מכירות קבוצות/.test(html))out.push('real contact '+s.id);
      if(/replyHrs|Reply time|זמן מענה|Invoice accuracy/.test(html))out.push('real perf shown '+s.id);});
    if(!/>(Reply time|זמן מענה)</.test(spCardHtml(fict[0],'ov')))out.push('fictional card lacks performance');}
  /* the page wrapper: card and list through VIEWS.suppliers, three roles, both languages */
  for(const lang of ['en','he'])for(const role of ['manager','accountant',AGENTS[0]]){S.lang=lang;S.role=role;S.tab='suppliers';S.sub='bank';
    S.supId=null;const l=VIEWS.suppliers();h.chk(l,'sp list '+role);if(lang==='en')h.scan(l,'sp list');
    [fict[3],reals[0]].forEach(s=>{S.supId=s.id;S.spTab='ov';const c=VIEWS.suppliers();h.chk(c,'sp page '+role);if(lang==='en')h.scan(c,'sp page');if(!c.includes('sp-hd'))out.push('card not rendered '+s.id);});
    S.supId=null;S.sub='prices';h.chk(VIEWS.suppliers(),'sp prices');S.sub='import';h.chk(VIEWS.suppliers(),'sp import');S.sub='bank';}
  S.role='manager';S.lang='en';S.supId=null;
  /* 3. flow <-> st mapping */
  const T0=TRIPS.find(t=>t.stage==='Operations');
  TRIPS.forEach(t=>{spInit(t);t.sups.forEach((s,i)=>{if(!SP_FLOWS.includes(s.flow))out.push('flow init '+t.id+i);if(s.flow!==spFromSt(s.st))out.push('flow not from st '+t.id+i);});});
  const s0=T0.sups[0];
  SP_FLOWS.forEach(fl=>{const st0=s0.st;if(!spSetFlow(T0,0,fl))out.push('setFlow '+fl);if(spFlow(s0)!==fl||s0.flow!==fl)out.push('flow round trip '+fl);if(fl!=='compare'&&spFromSt(s0.st)!==fl)out.push('st sync '+fl+' '+s0.st);if(fl==='compare'&&s0.st!==(st0))out.push('compare changed st');});
  ['Not sent','Sent','Confirmed','No reply'].forEach(st=>{s0.st=st;s0.flow=spFromSt(st);if(spFlow(s0)!==spFromSt(st))out.push('st->flow '+st);});
  if(spSetFlow(T0,0,'bogus')||spSetFlow(T0,99,'contact'))out.push('setFlow accepts junk');
  s0.st='No reply';spSetFlow(T0,0,'pending');if(s0.st!=='No reply')out.push('pending drops No reply');
  /* 4. in-trip tab renders for every non-Quote trip, all comparison panels open, EN/HE x roles */
  const ops=TRIPS.filter(t=>t.stage!=='Quote'),quotes=TRIPS.filter(t=>t.stage==='Quote');
  quotes.forEach(t=>{const html=spmTab(t);h.chk(html,'spm gate '+t.id);if(!/opens after the quote|נפתח אחרי/.test(html))out.push('spm not gated '+t.id);});
  ops.forEach(t=>t.sups.forEach((s,i)=>spSetFlow(t,i,'compare')));
  for(const lang of ['en','he'])for(const role of ['manager','accountant',AGENTS[0]]){S.lang=lang;S.role=role;
    ops.forEach(t=>{S.tripId=t.id;S.tab='trip';S.ptab='spm';const html=vTrip();h.chk(html,'spm '+lang+role+t.id);if(lang==='en')h.scan(html,'spm '+t.id);
      if(!html.includes('sp-seg'))out.push('spm not rendered '+t.id);if(t.sups.length&&!html.includes('sp-cmp'))out.push('no comparison '+t.id);});}
  S.role='manager';S.lang='en';
  /* unassigned components */
  const T1=ops[0],ln=T1.lines.find(l=>!l.extra&&T1.sups.some(s=>s.n===l.sup));
  const sv=T1.sups.splice(T1.sups.findIndex(s=>s.n===ln.sup),1)[0];
  if(!spUnassigned(T1).includes(ln))out.push('unassigned missing');
  h.chk(spmTab(T1),'spm unassigned');if(!/Unassigned components/.test(spmTab(T1)))out.push('unassigned card');
  const ix=spAssign(T1,ln.id);if(ix<0||T1.sups[ix].flow!=='contact'||spUnassigned(T1).includes(ln))out.push('spAssign');
  T1.sups.splice(ix,1);T1.sups.push(sv);
  /* 5. request quotes and choose */
  const by=addDays(iso(TODAY),3);let reqOk=0;
  ops.forEach(t=>t.sups.forEach((s,i)=>{const l=spLine(t,s),alts=l?altsFor(t,l).filter(a=>!a.inc):[];if(!alts.length)return;const n=spRequest(t,i);
    if(n!==alts.length||alts.some(a=>s.reqs[a.sup.id]!==by)||s.flow!=='compare')out.push('spRequest '+t.id+i);else reqOk++;}));
  if(!reqOk)out.push('no request tested');
  const T2=ops.find(t=>t.stage==='Operations'),k=T2.sups.findIndex(s=>{const l=spLine(T2,s);return l&&!l.inv&&altsFor(T2,l).length>1;});
  if(k>=0){const s=T2.sups[k],l=spLine(T2,s),alt=altsFor(T2,l).find(a=>!a.inc);
    s.st='Confirmed';let r=spChoose(T2,k,alt.sup.id);if(r.ok||!r.reason)out.push('choose allowed after approved');
    s.st='Sent';
    const inv0=l.inv;l.inv={fake:1};r=spChoose(T2,k,alt.sup.id);if(r.ok||!r.reason)out.push('choose allowed with invoice');l.inv=inv0;
    if(typeof tbSwap==='function'){const c0=calc(T2);r=spChoose(T2,k,alt.sup.id);if(!r.ok)out.push('choose failed: '+r.reason);else{
      const c1=calc(T2);if(Math.abs(c1.planProfit-c1.amtDiff-c1.fx-c1.fcProfit)>.05)out.push('identity after choose');if(spLine(T2,s).sup!==alt.sup.name)out.push('choose did not swap');if(spFlow(s)!==spFromSt(s.st))out.push('flow after choose');}}
    else{r=spChoose(T2,k,alt.sup.id);if(r.ok||!r.reason)out.push('choose without tbSwap');}}
  else out.push('no choosable line');
  /* 6. client card: every client, EN/HE, three roles; finance ties to incomeDocs */
  let cn=0;
  for(const lang of ['en','he'])for(const role of ['manager','accountant',AGENTS[0]]){S.lang=lang;S.role=role;S.tab='clients';
    CLIENTS.forEach(c=>{S.cliId=c.id;S.cliTab=cn%2?'fin':'ov';cn++;const html=vClients();h.chk(html,'client '+c.id);if(lang==='en')h.scan(html,'client');
      ['ov','fin'].forEach(tb=>{const x=spCliHtml(c,tb);h.chk(x,'client '+c.id+tb);if(lang==='en')h.scan(x,'client '+tb);});});}
  S.cliId=null;S.role='manager';S.lang='en';S.tab='clients';
  if(!/al-tbl/.test(vClients()))out.push('client list lost');
  CLIENTS.forEach(c=>{const F=spCliFin(c.name);let b=0,r=0;
    TRIPS.filter(t=>t.client===c.name&&t.stage!=='Quote').forEach(t=>{incomeDocs(t).docs.forEach(d=>{if(d.type==='deal')b=r2(b+d.amt);else r=r2(r+d.amt);});});
    if(Math.abs(F.billed-b)>.005||Math.abs(F.received-r)>.005||Math.abs(F.open-(b-r))>.01)out.push('client finance '+c.id+' '+F.billed+' vs '+b);});
  const withBill=CLIENTS.filter(c=>spCliFin(c.name).billed>0).length;if(!withBill)out.push('no client with billing');
  /* spCliOpen / spCliClose set the state and render */
  const c0=CLIENTS.find(c=>TRIPS.some(t=>t.client===c.name));
  if(!spCliOpen(c0.name)||S.cliId!==c0.id||S.tab!=='clients')out.push('spCliOpen');spCliClose();if(S.cliId)out.push('spCliClose');
  if(!spOpen(fict[0].id)||S.supId!==fict[0].id)out.push('spOpen');spClose();if(S.supId)out.push('spClose');
  /* finance printout unchanged by this module */
  TRIPS.forEach(t=>{const c=calc(t);if(Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit)>.05)out.push('identity '+t.id);});
  S.lang=keep;
  console.log('sp: '+SUPPLIERS.length+' supplier rows over '+Math.ceil(SUPPLIERS.length/25)+' pages, '+(sample.length+reals.length)+' cards, '+CLIENTS.length+' clients, '+ops.length+' trips');
  return out;
}});
