/* v8 module "op": operations depth. Tasks tab (TASK_LIB in 7 windows), Master list tab (passport, forms, custom columns,
   CSV export, simulated import, rooming summary) and a Room blocks card on top of the Hotels page.
   Every mutation is a named function (opToggleTask, opSendForms, opAddCol, opDelCol, opSetCell, opExportCsv, opImportApply, ...)
   so tests can call it. No Date.now(), no Math.random(); each trip gets its own rng. */
Object.assign(S,{opWin:'all',opSt:'all',opWho:'all',opImp:'',opNewCol:''});
/* the accountant can own a task; the existing label helper agn() then prints the right name in both languages */
if(typeof AGN!=='undefined'&&!AGN.Accountant){AGN.Accountant='נורה קים';AGE.Accountant='Nora Kim';}

const OP_WINS=[
  ['prim',['הסדרים ראשוניים','Primary arrangements']],
  ['w60',['60–30 ימים לפני היציאה','60–30 days before']],
  ['w30',['30–14 ימים לפני היציאה','30–14 days before']],
  ['w14',['14–1 ימים לפני היציאה','14–1 days before']],
  ['box',['קופסאות וחומרים','Boxes & materials']],
  ['dur',['במהלך הטיול','During the tour']],
  ['aft',['אחרי הטיול','After the tour']]];
const OP_WIN_BY={};OP_WINS.forEach(w=>{OP_WIN_BY[w[0]]=w;});
/* [key, window, offset days (negative = before departure; 'dur' counts from departure, 'aft' from the return day), owner a=agent o=ops desk f=accountant, intl only, English, Hebrew] */
const TASK_LIB=[
  ['t01','prim',-120,'a',0,'Sign the client agreement and collect the deposit','חתימה על הסכם עם הלקוח וגביית מקדמה'],
  ['t02','prim',-110,'a',0,'Confirm the hotel room block contract','אישור חוזה בלוק החדרים במלון'],
  ['t03','prim',-105,'o',0,'Book the motorcoach','הזמנת אוטובוס תיור'],
  ['t04','prim',-100,'o',0,'Reserve the local guide','שריון מדריך מקומי'],
  ['t05','prim',-95,'a',1,'Book air tickets and send the group list to the airline','הזמנת כרטיסי טיסה ושליחת רשימת הקבוצה לחברת התעופה'],
  ['t06','prim',-90,'o',0,'Confirm show and attraction reservations','אישור הזמנות להופעות ולאתרים'],
  ['t07','prim',-80,'a',0,'Open the traveler registration page','פתיחת עמוד ההרשמה לנוסעים'],
  ['t08','prim',-70,'a',1,'Check passport validity and visa rules','בדיקת תוקף דרכונים ודרישות ויזה'],
  ['t09','prim',-65,'a',0,'Confirm the free room for the group leader','אישור חדר חינם למנהל הקבוצה'],
  ['t10','w60',-60,'f',0,'Send the first payment reminder to households','תזכורת תשלום ראשונה למשקי הבית'],
  ['t11','w60',-55,'f',0,'Check that supplier deposits are paid','בדיקה ששולמו מקדמות הספקים'],
  ['t12','w60',-50,'a',0,'Collect names exactly as shown on photo ID','איסוף שמות כפי שהם מופיעים בתעודה מזהה'],
  ['t13','w60',-45,'a',0,'Collect medical and dietary forms','איסוף טפסי רפואה ותזונה'],
  ['t14','w60',-40,'a',0,'Draft the daily program for the group leader','טיוטת תוכנית יומית למנהל הקבוצה'],
  ['t15','w60',-35,'o',0,'Reconfirm hotel and coach in writing','אישור חוזר בכתב למלון ולאוטובוס'],
  ['t16','w60',-33,'o',1,'Arrange airport transfers','סידור העברות מנמל התעופה'],
  ['t17','w30',-30,'f',0,'Send the balance invoice to households','שליחת חשבון היתרה למשקי הבית'],
  ['t18','w30',-28,'a',0,'Collect signed liability waivers','איסוף כתבי ויתור חתומים'],
  ['t19','w30',-25,'a',0,'Send a draft rooming list to the hotel','שליחת טיוטת רשימת חדרים למלון'],
  ['t20','w30',-24,'o',0,'Confirm restaurant bookings and meal vouchers','אישור הזמנות במסעדות ושוברי ארוחות'],
  ['t21','w30',-22,'o',0,'Confirm accessibility and mobility requests','אישור בקשות נגישות וניידות'],
  ['t22','w30',-20,'a',0,'Prepare the emergency numbers sheet','הכנת דף מספרי חירום'],
  ['t23','w30',-18,'o',0,'Coordination call with the tour guide','שיחת תיאום עם המדריך'],
  ['t24','w30',-16,'a',0,'Send packing and weather tips to travelers','שליחת המלצות אריזה ומזג אוויר לנוסעים'],
  ['t25','w14',-13,'f',0,'Follow up on open household balances','מעקב אחר יתרות פתוחות של משקי בית'],
  ['t26','w14',-9,'o',0,'Print the manifest and emergency contact sheet for the guide','הדפסת רשימת הנוסעים ודף אנשי הקשר לחירום למדריך'],
  ['t27','w14',-7,'a',0,'Check that every traveler has completed the forms','בדיקה שכל הנוסעים השלימו את הטפסים'],
  ['t28','w14',-5,'f',0,'Prepare tip envelopes for the guide and driver','הכנת מעטפות טיפ למדריך ולנהג'],
  ['t29','w14',-4,'f',0,'Prepay on-site items such as parking and tolls','תשלום מראש על פריטים בשטח, כמו חניה ואגרות'],
  ['t30','w14',-3,'a',0,'Send the final reminder with the meeting point and time','שליחת תזכורת אחרונה עם נקודת המפגש והשעה'],
  ['t31','w14',-2,'o',0,'Reconfirm every supplier 48 hours ahead','אישור חוזר מכל ספק 48 שעות מראש'],
  ['t32','box',-28,'o',0,'Order name badges and luggage tags','הזמנת תגי שם ותגי מזוודות'],
  ['t33','box',-21,'o',0,'Print the welcome folder with the itinerary','הדפסת תיק קבלת פנים עם המסלול'],
  ['t34','box',-14,'o',0,'Pack the group box: first aid kit, signs and headsets','ארגון ארגז הקבוצה: ערכת עזרה ראשונה, שלטים ואוזניות'],
  ['t35','box',-12,'o',0,'Prepare welcome gifts and bags','הכנת מתנות ושקיות קבלת פנים'],
  ['t36','box',-10,'o',0,'Print vouchers and tickets','הדפסת שוברים וכרטיסים'],
  ['t37','dur',0,'a',0,'Day 1: welcome call with the group leader','יום 1: שיחת קבלת פנים עם מנהל הקבוצה'],
  ['t38','dur',0,'o',0,'Day 1: confirm everyone arrived and checked in','יום 1: וידוא שכולם הגיעו ונרשמו במלון'],
  ['t39','dur',1,'o',0,'Daily check-in with the guide and driver','בדיקה יומית עם המדריך והנהג'],
  ['t40','dur',1,'f',0,'Record on-trip expenses and receipts','רישום הוצאות וקבלות במהלך הטיול'],
  ['t41','dur',2,'a',0,'Mid-trip check-in with the group leader','שיחת בדיקה באמצע הטיול עם מנהל הקבוצה'],
  ['t42','aft',2,'a',0,'Send the thank-you note and feedback survey','שליחת מכתב תודה וסקר משוב'],
  ['t43','aft',3,'f',0,'Collect final supplier invoices','איסוף חשבוניות הספקים הסופיות'],
  ['t44','aft',5,'f',0,'Collect on-trip payments and close open balances','גביית תשלומים מהטיול וסגירת יתרות פתוחות'],
  ['t45','aft',7,'f',0,'Match supplier invoices against the quote','התאמת חשבוניות הספקים להצעת המחיר'],
  ['t46','aft',7,'a',0,'Team debrief: what to improve next time','סיכום צוות: מה לשפר בפעם הבאה'],
  ['t47','aft',10,'f',0,'Record supplier commissions received','רישום עמלות ספקים שהתקבלו'],
  ['t48','aft',14,'f',0,'Close the file and archive the documents','סגירת התיק וארכוב המסמכים']];
const TASK_BY={};TASK_LIB.forEach(x=>{TASK_BY[x[0]]=x;});
const OP_WHO={a:null,o:'Ops desk',f:'Accountant'};
/* Hebrew for the 12 original tasks (matched by their English text) */
const OP_OLD_HE={'Final rooming list to hotel':'רשימת חדרים סופית למלון','Release unused rooms from the block':'שחרור חדרים שלא נוצלו מהבלוק','Itinerary to motorcoach company':'מסלול לחברת האוטובוסים','Collect passport copies':'איסוף עותקי דרכונים','Collect emergency contact forms':'איסוף טפסי אנשי קשר לחירום','Confirm show and attraction tickets':'אישור כרטיסים להופעות ולאתרים','Dietary list to restaurants':'רשימת תזונה למסעדות','Final headcount to suppliers':'מספר משתתפים סופי לספקים','Send travel documents to travelers':'שליחת מסמכי נסיעה לנוסעים','Group leader briefing call':'שיחת תדריך למנהל הקבוצה','Travel protection deadline reminder':'תזכורת למועד אחרון לביטוח נסיעות','Driver and guide schedule sheet':'דף לוחות זמנים לנהג ולמדריך'};

/* ---------- pure helpers ---------- */
const opTaskName=x=>{const l=x.k&&TASK_BY[x.k];return l?L(l[6],l[5]):L(OP_OLD_HE[x.t]||x.t,x.t);};
const opStat=x=>x.done?'done':x.due<iso(TODAY)?'overdue':'open';
const opRoleOf=(t,x)=>x.who==='Ops desk'?'o':x.who==='Accountant'?'f':'a';
const opWhoL=x=>x.who==='Ops desk'?L('דסק תפעול','Ops desk'):agn(x.who);
/* window of a task: explicit, else by its distance from departure (the 12 original tasks) */
function opWinByDue(t,x){const d=Math.round((D(t.dep)-D(x.due))/DAY);return d>60?'prim':d>30?'w60':d>14?'w30':'w14';}
const opWinOf=(t,x)=>x.win||opWinByDue(t,x);
/* A1/A16: extends t.tasks for Operations, Finance and Closed trips; ids from 101; idempotent; own rng per trip */
function opInit(t){
  if(!t||t.stage==='Quote'||!Array.isArray(t.tasks))return;
  t.tasks.forEach(x=>{if(!x.win)x.win=opWinByDue(t,x);});
  if(t.tasks.some(x=>x.id>=101))return;
  const R=rng(9300+hashId(t.id)),intl=!!(DESTS[t.dest]&&DESTS[t.dest].intl),ret=addDays(t.dep,t.nights);
  const fresh=t.tasks.length>0&&t.tasks.every(x=>!x.done);
  TASK_LIB.forEach((x,i)=>{
    const r=R();if(x[4]&&!intl)return;
    const due=addDays(x[1]==='aft'?ret:t.dep,x[2]),past=D(due)<TODAY;
    const done=t.stage!=='Operations'?true:fresh?false:(past?r<.85:r<.05);
    t.tasks.push({id:101+i,k:x[0],t:x[5],who:OP_WHO[x[3]]||t.agent,due,done,win:x[1]});
  });
}
TRIP_INIT.push(t=>opInit(t));
function opToggleTask(t,id){const x=t&&t.tasks.find(y=>y.id===+id);if(!x)return null;x.done=!x.done;return x.done;}
function opTaskRows(t){return t.tasks.map(x=>({x,w:opWinOf(t,x),st:opStat(x),who:opRoleOf(t,x)}));}
function opTaskFilter(t,f){f=f||{};return opTaskRows(t).filter(r=>(!f.win||f.win==='all'||r.w===f.win)&&(!f.st||f.st==='all'||r.st===f.st)&&(!f.who||f.who==='all'||r.who===f.who));}

/* ---------- travelers ---------- */
const OP_FORMS=[['reg',['רישום','Registration'],'registration'],['med',['רפואה ותזונה','Medical & dietary'],'medical'],['waiver',['כתב ויתור','Waiver'],'waiver']];
const OP_FSTATE={done:['הושלם','Done','green'],sent:['נשלח','Sent','blue'],'not sent':['לא נשלח','Not sent','']};
const opFormLink=(t,id)=>'https://forms.redbudtours.example/'+t.no+'/'+id;
/* passport expires less than 6 months after the return day; only when a passport is on file */
const opPassWarn=(t,x)=>!!(x.pass!=='Missing'&&x.passExp&&D(x.passExp)<D(addDays(t.dep,t.nights+183)));
const opCols=t=>Array.isArray(t.mcols)?t.mcols:[];
function opSendForms(t){
  if(!t||!t.trav)return 0;let n=0;
  t.trav.forEach(x=>{if(!x.form)return;OP_FORMS.forEach(f=>{if(x.form[f[0]]==='not sent'){x.form[f[0]]='sent';n++;}});});
  try{navigator.clipboard.writeText(opFormLink(t,'registration'));}catch(e){}
  try{toast(n?L(`נשלחו ${n} טפסים. הקישור הועתק (הדגמה).`,`${n} ${PLN(n,'form','forms')} sent. The link was copied (demo).`):L('אין טפסים שטרם נשלחו.','No forms are waiting to be sent.'));}catch(e){}
  return n;
}
function opAddCol(t,label){
  label=String(label||'').trim().slice(0,28);if(!t||!label||opCols(t).length>=6||opCols(t).some(c=>c.label.toLowerCase()===label.toLowerCase()))return null;
  if(!Array.isArray(t.mcols))t.mcols=[];
  const k='c'+(t.mcols.reduce((a,c)=>Math.max(a,+c.k.slice(1)||0),0)+1);t.mcols.push({k,label});return k;
}
function opDelCol(t,k){if(!t||!Array.isArray(t.mcols))return false;const n=t.mcols.length;t.mcols=t.mcols.filter(c=>c.k!==k);t.trav.forEach(x=>{if(x.x)delete x.x[k];});return t.mcols.length<n;}
function opSetCell(t,i,k,v){const x=t&&t.trav&&t.trav[+i];if(!x||!opCols(t).some(c=>c.k===k))return false;if(!x.x)x.x={};x.x[k]=String(v==null?'':v).slice(0,80);return true;}
/* CSV: header + one row per traveler; labels follow the language, so an English export has no Hebrew */
function opCsv(t,lang){
  const lg=lang||S.lang,l0=S.lang;S.lang=lg;
  try{
    const q=v=>{v=String(v==null?'':v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
    const head=[L('חדר','Room'),L('שם','Name'),L('משק בית','Household'),L('סוג חדר','Room type'),L('תאריך לידה','Date of birth'),L('מספר דרכון','Passport no'),L('תוקף דרכון','Passport expiry'),L('תזונה','Diet'),L('איש קשר לחירום','Emergency contact'),L('טלפון חירום','Emergency phone'),L('טופס רישום','Registration form'),L('טופס רפואי','Medical form'),L('כתב ויתור','Waiver'),...opCols(t).map(c=>c.label)];
    const fs=f=>L(OP_FSTATE[f]?OP_FSTATE[f][0]:f,OP_FSTATE[f]?OP_FSTATE[f][1]:f);
    const rows=t.trav.map(x=>[x.room,x.n,x.g,x.roomType||'',x.dob||'',x.pass==='Missing'?L('חסר','Missing'):(x.passNo||''),x.passExp||'',dietn(x.diet),x.emerg?x.emerg.name:'',x.emerg?x.emerg.phone:'',...OP_FORMS.map(f=>fs(x.form?x.form[f[0]]:'not sent')),...opCols(t).map(c=>(x.x&&x.x[c.k])||'')]);
    return [head,...rows].map(r=>r.map(q).join(',')).join('\n');
  }finally{S.lang=l0;}
}
function opExportCsv(t){
  try{saveFile('master-list-'+t.no+'.csv','\ufeff'+opCsv(t),'text/csv;charset=utf-8').then(saveToast);return true;}catch(e){return false;}
}
/* simulated import (A17): 5 rows that update fields of EXISTING travelers only; travelers, rooms and pax never change */
function opImportPreview(t){
  if(!t||!t.trav||!t.trav.length)return [];
  const R=rng(9400+hashId(t.id)),idx=t.trav.map((x,i)=>i).sort((a,b)=>(t.trav[a].pass==='Missing'?0:1)-(t.trav[b].pass==='Missing'?0:1)||a-b).slice(0,5);
  return idx.map(i=>{
    const x=t.trav[i],r=R(),r2_=R(),ch=[];
    if(x.pass==='Missing'){
      ch.push({f:'pass',from:L('חסר','Missing'),to:L('התקבל','Received')});
      ch.push({f:'passNo',from:'',to:'•••• '+String(1000+Math.floor(r*9000))});
      ch.push({f:'passExp',from:'',to:addDays(t.dep,t.nights+200+Math.floor(r2_*2000))});
    }else{
      const ph='918-555-02'+String(Math.floor(r*100)).padStart(2,'0');
      ch.push({f:'emergPhone',from:x.emerg?x.emerg.phone:'',to:ph});
    }
    return {i,name:x.n,ch};
  });
}
function opImportApply(t){
  const rows=opImportPreview(t);let n=0;
  rows.forEach(r=>{const x=t.trav[r.i];r.ch.forEach(c=>{
    if(c.f==='pass'){x.pass='Received';n++;}
    else if(c.f==='passNo'&&!x.passNo)x.passNo=c.to;
    else if(c.f==='passExp'&&!x.passExp)x.passExp=c.to;
    else if(c.f==='emergPhone'){if(!x.emerg)x.emerg={name:'',phone:''};x.emerg.phone=c.to;n++;}});});
  S.opImp='';
  try{toast(L(`עודכנו ${rows.length} נוסעים מהקובץ. מספר הנוסעים לא השתנה.`,`${rows.length} travelers updated from the file. The traveler count did not change.`));}catch(e){}
  return rows.length;
}
function opRoomSummary(t){
  const b=blockOf(t)||{types:{},held:0,picked:0},seen={},list={};
  t.trav.forEach(x=>{if(seen[x.room])return;seen[x.room]=1;list[x.roomType]=(list[x.roomType]||0)+1;});
  const ks=['Single','Double','Twin','Triple','Quad'].filter(k=>list[k]||b.types[k]);
  return {rows:ks.map(k=>({k,list:list[k]||0,block:b.types[k]||0,pax:t.trav.filter(x=>x.roomType===k).length})),rooms:Object.keys(seen).length,held:b.held,picked:b.picked};
}
const opRoomL=k=>L({Single:'יחיד',Double:'זוגי',Twin:'שתי מיטות',Triple:'משולש',Quad:'ארבעה'}[k]||k,k);

/* ---------- Tasks tab ---------- */
const opChip=(g,v,label,n)=>`<button class="chip ${(S['op'+g]||'all')===v?'on':''}" data-act="op-f" data-k="${g}" data-v="${v}">${label}${n==null?'':` <span class="op-n">${n}</span>`}</button>`;
function opTasksTab(t){
  if(t.stage==='Quote')return gate(t,L('המשימות','Tasks'));
  const all=opTaskRows(t),tot=all.length,dn_=all.filter(r=>r.st==='done').length,od=all.filter(r=>r.st==='overdue').length;
  const soon=addDays(iso(TODAY),7),wk=all.filter(r=>r.st==='open'&&r.x.due<=soon).length;
  const f={win:S.opWin||'all',st:S.opSt||'all',who:S.opWho||'all'},rows=opTaskFilter(t,f);
  const sec=OP_WINS.filter(w=>f.win==='all'||f.win===w[0]).map(w=>{
    const wa=all.filter(r=>r.w===w[0]),wr=rows.filter(r=>r.w===w[0]);if(!wa.length||!wr.length)return '';
    const wd=wa.filter(r=>r.st==='done').length;
    const wp=Math.round(wd/wa.length*100),wo=wa.filter(r=>r.st==='overdue').length;
    return `<div class="card hc-card op-win"><div class="hc-h op-wh"><div class="op-ring">${hcRing(wp,52,wd===wa.length?'sm ok':'sm')}<b>${wp}%</b></div><div class="op-wt"><h3>${L(w[1][0],w[1][1])}</h3><span class="small muted">${L(`${wd} מתוך ${wa.length} בוצעו`,`${wd} of ${wa.length} done`)}</span></div>${wo?`<span class="hc-pill red">${L(`${wo} באיחור`,`${wo} overdue`)}</span>`:wd===wa.length?`<span class="hc-pill green">${L('הושלם','Complete')}</span>`:''}</div>
      <div class="scroll"><table class="tbl op-tbl"><thead><tr><th></th><th>${L('משימה','Task')}</th><th>${L('אחראי','Owner')}</th><th>${L('עד','Due')}</th><th>${L('סטטוס','Status')}</th></tr></thead><tbody>${wr.sort((a,b)=>a.x.due<b.x.due?-1:a.x.due>b.x.due?1:a.x.id-b.x.id).map(r=>`<tr class="op-r ${r.st}"><td><input type="checkbox" data-ch="op-task" data-v="${r.x.id}" ${r.x.done?'checked':''} aria-label="${esc(opTaskName(r.x))}"></td><td>${esc(opTaskName(r.x))}</td><td>${opWhoL(r.x)}</td><td>${fmtDate(r.x.due)}</td><td>${r.st==='done'?pillF(L('בוצע','Done'),'green'):r.st==='overdue'?pillF(L('באיחור','Overdue'),'red'):pillF(L('פתוח','Open'),'blue')}</td></tr>`).join('')}</tbody></table></div></div>`;}).join('');
  const cw=v=>opTaskFilter(t,{win:v,st:f.st,who:f.who}).length;
  const tile=(lab,val,sub,cls)=>`<div class="hc-mini op-tile ${cls||''}"><span>${lab}</span><b>${val}</b><small>${sub}</small></div>`;
  return master(t)+`<div class="op-tiles">${tile(L('משימות','Tasks'),tot,L(`${dn_} בוצעו`,`${dn_} done`))}
    <div class="hc-mini op-tile ok"><span>${L('התקדמות','Progress')}</span><div class="op-tp">${hcRing(Math.round(dn_/Math.max(1,tot)*100),44,'sm')}<b>${Math.round(dn_/Math.max(1,tot)*100)}%</b></div></div>
    ${tile(L('באיחור','Overdue'),od,L('עד היום','as of today'),od?'rk':'')}${tile(L('השבוע','Due this week'),wk,L('פתוחות','open'))}</div>
  <div class="card hc-card op-filters"><div class="op-fg"><span class="small muted">${L('חלון זמן','Window')}</span><div class="chips">${opChip('Win','all',L('הכול','All'),cw('all'))}${OP_WINS.map(w=>opChip('Win',w[0],L(w[1][0],w[1][1]),cw(w[0]))).join('')}</div></div>
    <div class="op-fg"><span class="small muted">${L('סטטוס','Status')}</span><div class="chips">${opChip('St','all',L('הכול','All'))}${opChip('St','open',L('פתוח','Open'))}${opChip('St','overdue',L('באיחור','Overdue'))}${opChip('St','done',L('בוצע','Done'))}</div></div>
    <div class="op-fg"><span class="small muted">${L('אחראי','Owner')}</span><div class="chips">${opChip('Who','all',L('הכול','All'))}${opChip('Who','a',L('סוכן/ת','Agent'))}${opChip('Who','o',L('דסק תפעול','Ops desk'))}${opChip('Who','f',L('הנהלת חשבונות','Accountant'))}</div></div></div>
  ${sec||`<div class="card hc-card"><p class="muted" style="margin:0">${L('אין משימות שמתאימות למסננים.','No tasks match these filters.')}</p></div>`}`;
}

/* ---------- Master list tab ---------- */
function opDots(x){
  const fs=x.form||{};
  return `<span class="op-dots" role="img" aria-label="${esc(OP_FORMS.map(f=>L(f[1][0],f[1][1])+': '+L(OP_FSTATE[fs[f[0]]||'not sent'][0],OP_FSTATE[fs[f[0]]||'not sent'][1])).join(', '))}">${OP_FORMS.map(f=>`<i class="op-dot ${(fs[f[0]]||'not sent').replace(' ','-')}"></i>`).join('')}</span>`;
}
function opManifestTab(t){
  if(t.stage==='Quote')return gate(t,L('רשימת הנוסעים','The master list'));
  const intl=DESTS[t.dest].intl,cols=opCols(t),tr=t.trav||[];
  const warn=tr.filter(x=>opPassWarn(t,x)).length,miss=tr.filter(x=>x.pass==='Missing').length;
  const alld=tr.filter(x=>x.form&&OP_FORMS.every(f=>x.form[f[0]]==='done')).length,sentp=tr.reduce((a,x)=>a+OP_FORMS.filter(f=>x.form&&x.form[f[0]]==='sent').length,0);
  const unsent=tr.reduce((a,x)=>a+OP_FORMS.filter(f=>x.form&&x.form[f[0]]==='not sent').length,0);
  const rs=opRoomSummary(t),imp=S.opImp===t.id?opImportPreview(t):null;
  const body=tr.map((x,i)=>`<tr><td class="n">${x.room}</td><td><bdi>${esc(x.n)}</bdi></td><td>${esc(x.g)}</td><td>${opRoomL(x.roomType)}</td><td>${x.dob?fmtDate(x.dob):''}</td>
    <td>${x.pass==='Missing'?pillF(L('חסר','Missing'),'amber'):`<bdi dir="ltr">${esc(x.passNo||'')}</bdi>`}</td>
    <td>${x.pass==='Missing'||!x.passExp?'':opPassWarn(t,x)?pillF(fmtDate(x.passExp)+' · '+L('פחות מ-6 חודשים אחרי החזרה','under 6 months after return'),'amber'):fmtDate(x.passExp)}</td>
    <td>${dietn(x.diet)}</td><td>${x.emerg?`<bdi>${esc(x.emerg.name)}</bdi> <span class="muted"><bdi>${esc(x.emerg.phone)}</bdi></span>`:''}</td><td>${opDots(x)}</td>
    ${cols.map(c=>`<td><input class="op-cell" data-ch="op-cell" data-i="${i}" data-k="${c.k}" value="${esc((x.x&&x.x[c.k])||'')}" aria-label="${esc(c.label)}"></td>`).join('')}</tr>`).join('');
  const tile2=(lab,val,sub,cls)=>`<div class="hc-mini op-tile ${cls||''}"><span>${lab}</span><b>${val}</b><small>${sub}</small></div>`;
  return master(t)+`<div class="op-tiles">${tile2(L('נוסעים','Travelers'),tr.length,`${rs.rooms} ${L('חדרים','rooms')}`)}
    ${tile2(intl?L('דרכונים חסרים','Passports missing'):L('מסמכים חסרים','Documents missing'),miss,`${L('מתוך','of')} ${tr.length}`,miss?'rk':'ok')}
    ${tile2(L('תוקף דרכון קצר','Short passport validity'),warn,L('פחות מ-6 חודשים אחרי החזרה','under 6 months after return'),warn?'rk':'ok')}
    <div class="hc-mini op-tile ok"><span>${L('נוסעים שהשלימו את כל הטפסים','Travelers with all forms done')}</span><div class="op-tp">${hcRing(tr.length?Math.round(alld/tr.length*100):0,44,'sm')}<b>${alld} ${L('מתוך','of')} ${tr.length}</b></div><small>${L(`${sentp} טפסים נשלחו וטרם הושלמו`,`${sentp} ${PLN(sentp,'form','forms')} sent, not done`)} · ${unsent?L(`${unsent} טרם נשלחו`,`${unsent} not sent yet`):L('הכול נשלח','All sent')}</small></div></div>
  <div class="card hc-card"><div class="op-bar"><div><div class="hc-h" style="margin:0"><h3>${L('רשימת נוסעים ראשית','Master list')}</h3></div><p class="small muted" style="margin:2px 0 0">${L('טפסים: רישום, רפואה ותזונה, כתב ויתור.','Forms: registration, medical and dietary, waiver.')}</p></div>
    <div class="row op-btns"><button class="btn sm pri" data-act="op-send">${ic('mail')} ${L('שליחת טפסים','Send forms')}${unsent?` (${unsent})`:''}</button><button class="btn sm" data-act="op-csv">${ic('export')} ${L('ייצוא CSV','Export CSV')}</button><button class="btn sm" data-act="op-imp">${ic('down')} ${L('ייבוא','Import')}</button></div></div>
    <div class="op-legend small muted"><span><i class="op-dot done"></i>${L('הושלם','Done')}</span><span><i class="op-dot sent"></i>${L('נשלח','Sent')}</span><span><i class="op-dot not-sent"></i>${L('לא נשלח','Not sent')}</span><span>${L('קישור לטפסים','Forms link')}: <code>${esc(opFormLink(t,'registration'))}</code></span></div>
    ${imp?`<div class="op-imp"><strong>${L('תצוגה מקדימה של הייבוא: 5 שורות','Import preview: 5 rows')}</strong><p class="small muted" style="margin:2px 0 8px">${L('הקובץ מעדכן נוסעים קיימים בלבד. מספר הנוסעים והחדרים לא ישתנה.','The file updates existing travelers only. The traveler and room counts will not change.')}</p>
      <div class="scroll"><table class="tbl"><thead><tr><th>${L('נוסע','Traveler')}</th><th>${L('שדה','Field')}</th><th>${L('לפני','Before')}</th><th>${L('אחרי','After')}</th></tr></thead><tbody>${imp.map(r=>r.ch.map((c,j)=>`<tr>${j?'':`<td rowspan="${r.ch.length}"><bdi>${esc(r.name)}</bdi></td>`}<td>${{pass:L('דרכון','Passport'),passNo:L('מספר דרכון','Passport no'),passExp:L('תוקף דרכון','Passport expiry'),emergPhone:L('טלפון חירום','Emergency phone')}[c.f]}</td><td>${c.f==='passExp'&&c.from?fmtDate(c.from):c.from?`<bdi dir="ltr">${esc(c.from)}</bdi>`:'–'}</td><td>${c.f==='passExp'?fmtDate(c.to):`<bdi dir="ltr">${esc(c.to)}</bdi>`}</td></tr>`).join('')).join('')}</tbody></table></div>
      <div class="row" style="margin-top:8px"><button class="btn sm pri" data-act="op-impok">${L('החלת העדכונים','Apply updates')}</button><button class="btn sm" data-act="op-impno">${L('ביטול','Cancel')}</button></div></div>`:''}
    <div class="op-addcol"><input id="op-newcol" class="op-in" data-ch="op-newcol" value="${esc(S.opNewCol||'')}" placeholder="${L('שם עמודה חדשה','New column name')}" maxlength="28" aria-label="${L('שם עמודה חדשה','New column name')}"><button class="btn sm" data-act="op-addcol">${L('הוספת עמודה','Add column')}</button>
      ${cols.map(c=>`<span class="op-colchip">${esc(c.label)}<button data-act="op-delcol" data-v="${c.k}" aria-label="${L('הסרת עמודה','Remove column')}">${ic('close')}</button></span>`).join('')}</div>
    <div class="scroll tall"><table class="tbl op-man"><thead><tr><th>${L('חדר','Room')}</th><th>${L('שם','Name')}</th><th>${L('משק בית','Household')}</th><th>${L('סוג חדר','Room type')}</th><th>${L('תאריך לידה','Date of birth')}</th><th>${L('מספר דרכון','Passport no')}</th><th>${L('תוקף דרכון','Passport expiry')}</th><th>${L('תזונה','Diet')}</th><th>${L('איש קשר לחירום','Emergency contact')}</th><th>${L('טפסים','Forms')}</th>${cols.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div></div>
  <div class="card hc-card"><div class="hc-h"><h3>${L('סיכום חדרים','Rooming summary')}</h3></div><p class="small muted">${L(`בלוק של ${rs.held} חדרים, ${rs.rooms} חדרים ברשימה, ${rs.picked} נוצלו.`,`Block of ${rs.held} rooms, ${rs.rooms} rooms on the list, ${rs.picked} picked up.`)}</p>
    <div class="scroll"><table class="tbl"><thead><tr><th>${L('סוג חדר','Room type')}</th><th class="n">${L('חדרים ברשימה','Rooms on the list')}</th><th class="n">${L('בתכנית הבלוק','In the block plan')}</th><th class="n">${L('נוסעים','Travelers')}</th></tr></thead><tbody>${rs.rows.map(r=>`<tr><td>${opRoomL(r.k)}</td><td class="n">${r.list}</td><td class="n">${r.block}</td><td class="n">${r.pax}</td></tr>`).join('')}</tbody></table></div></div>`;
}

/* ---------- Room blocks card on the Hotels page ---------- */
function opBlockRows(){return visibleTrips().filter(t=>t.stage==='Operations').map(t=>({t,b:blockOf(t)})).filter(r=>r.b).sort((a,b)=>a.b.cutoff<b.b.cutoff?-1:a.b.cutoff>b.b.cutoff?1:0);}
function opBlocksCard(){
  const rows=opBlockRows();if(!rows.length)return '';
  const tot=r2(rows.reduce((a,r)=>a+(r.b.exposure||0),0)),open=rows.reduce((a,r)=>a+r.b.open,0);
  const tr=rows.map(({t,b})=>{
    const h=typeof CATALOG!=='undefined'&&CATALOG.hotels.find(x=>x.name===b.hotel),dd=Math.round((D(b.cutoff)-TODAY)/DAY);
    const when=dd>0?L(`בעוד ${dd} ימים`,`In ${dd} ${PLN(dd,'day','days')}`):dd===0?L('היום','Today'):L(`לפני ${-dd} ימים`,`${-dd} ${PLN(-dd,'day','days')} ago`);
    return `<tr><td><span class="op-hot">${h?brandBadge(h.family):''}<bdi>${esc(b.hotel)}</bdi></span></td><td><button class="op-lnk" data-act="open" data-v="${t.id}" data-pt="manifest"><bdi>${esc(t.name)}</bdi></button></td>
      <td>${fmtDate(t.dep)} – ${fmtDate(addDays(t.dep,t.nights))}</td><td class="n">${b.held}</td><td class="n">${b.picked}</td><td class="n">${b.open}</td><td>${fmtDate(b.cutoff)}<div class="small muted">${when}</div></td>
      <td>${b.open>0?`<span class="hc-pill ${dd<=14?'red':'blue'}">${L('לשחרר עד','Release by')} ${fmtDate(b.cutoff)}</span>`:pillF(L('כל החדרים נוצלו','All rooms picked up'),'green')}</td><td class="n">${b.open>0&&b.exposure>0?usd(b.exposure):'–'}</td></tr>`;}).join('');
  return `<div class="card hc-card op-blocks"><div class="hc-h"><h3>${L('מועדי שחרור חדרים לפי טיול','Release deadlines by trip')}</h3>${open?`<span class="hc-pill blue">${L(`${open} חדרים פתוחים`,`${open} ${PLN(open,'room','rooms')} open`)}</span>`:`<span class="hc-pill green">${L('הכול נוצל','All picked up')}</span>`}</div>
    <div class="op-bar"><p class="small muted" style="margin:0">${L(`${rows.length} טיולים בתפעול, ${open} חדרים עדיין בבלוק שלא נוצלו.`,`${rows.length} ${PLN(rows.length,'trip','trips')} in operation, ${open} ${PLN(open,'room','rooms')} still open in the blocks.`)}</p>
    ${tot>0?`<div class="op-tot"><span class="small muted">${L('שווי חדרים פתוחים אחרי מועד השחרור','Value of open rooms after the release date')}</span><strong>${usd(tot)}</strong></div>`:''}</div>
    <div class="scroll"><table class="tbl op-btbl"><thead><tr><th>${L('מלון','Hotel')}</th><th>${L('טיול','Trip')}</th><th>${L('תאריכים','Dates')}</th><th class="n">${L('בבלוק','Held')}</th><th class="n">${L('נוצלו','Picked up')}</th><th class="n">${L('פתוחים','Open')}</th><th>${L('מועד שחרור','Release date')}</th><th>${L('פעולה','Action')}</th><th class="n">${L('שווי פתוח','Open value')}</th></tr></thead><tbody>${tr}</tbody></table></div></div>`;
}

/* ---------- tabs ---------- */
tabInsert('o',['optasks','משימות','Tasks','checklist']);
tabInsert('o',['manifest','רשימת נוסעים','Master list','users2']);
TRIP_TABS.optasks=opTasksTab;TRIP_TABS.manifest=opManifestTab;

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="op-"]');if(!b)return;
  const a=b.dataset.act,t=T();
  if(a==='op-f'){S['op'+b.dataset.k]=b.dataset.v;render();return;}
  if(!t)return;
  if(a==='op-send'){opSendForms(t);render();}
  else if(a==='op-csv')opExportCsv(t);
  else if(a==='op-imp'){S.opImp=t.id;render();}
  else if(a==='op-impno'){S.opImp='';render();}
  else if(a==='op-impok'){opImportApply(t);render();}
  else if(a==='op-addcol'){const inp=document.getElementById('op-newcol'),v=(inp&&inp.value)||S.opNewCol;const k=opAddCol(t,v);S.opNewCol='';if(!k)try{toast(L('שם העמודה חסר או כבר קיים.','The column name is empty or already used.'));}catch(er){}render();}
  else if(a==='op-delcol'){opDelCol(t,b.dataset.v);render();}
});
document.addEventListener('change',e=>{
  const el=e.target,k=el.dataset&&el.dataset.ch;if(!k||k.indexOf('op-')!==0)return;
  const t=T();
  if(k==='op-newcol'){S.opNewCol=el.value;return;}
  if(!t)return;
  if(k==='op-task'){opToggleTask(t,el.dataset.v);render();}
  else if(k==='op-cell'){opSetCell(t,el.dataset.i,el.dataset.k,el.value);}
});

/* ---------- tests ---------- */
TESTS.push({name:'ops tasks, master list, blocks',run:h=>{
  const out=[],{S}=h,lang0=S.lang,role0=S.role;
  const ops=TRIPS.filter(t=>t.stage==='Operations'),late=TRIPS.filter(t=>t.stage==='Finance'||t.stage==='Closed');
  console.log('ops: tasks per Operations trip',ops.map(t=>t.tasks.length).join('/'),'library',TASK_LIB.length);
  if(TASK_LIB.length<44||TASK_LIB.length>50)out.push('library size '+TASK_LIB.length);
  if(new Set(TASK_LIB.map(x=>x[0])).size!==TASK_LIB.length)out.push('duplicate task keys');
  if(OP_WINS.some(w=>!TASK_LIB.some(x=>x[1]===w[0])))out.push('window without tasks');
  TASK_LIB.forEach(x=>{if(!OP_WIN_BY[x[1]]||!x[5]||!/[֐-׿]/.test(x[6])||/[A-Za-z]{4}/.test(x[6]))out.push('task text '+x[0]);});
  Object.keys(OP_OLD_HE).forEach(k=>{if(!/[֐-׿]/.test(OP_OLD_HE[k]))out.push('old he '+k);});
  TRIPS.forEach(t=>{
    if(t.stage==='Quote'){if(t.tasks.length)out.push('quote has tasks '+t.id);return;}
    if(t.stage==='Operations'&&t.tasks.length<30)out.push('too few tasks '+t.id+' '+t.tasks.length);
    const old=t.tasks.filter(x=>x.id<=12);if(old.length!==TASKT.filter(x=>!x[2]||DESTS[t.dest].intl).length)out.push('old task count '+t.id);
    t.tasks.forEach(x=>{if(!OP_WIN_BY[x.win])out.push('no window '+t.id+'/'+x.id);if(x.id>=101&&x.id-101>=TASK_LIB.length)out.push('bad id');});
    if(new Set(t.tasks.map(x=>x.id)).size!==t.tasks.length)out.push('duplicate ids '+t.id);
    if(t.stage!=='Operations'&&t.tasks.some(x=>!x.done))out.push('not all done '+t.id);
    if(!DESTS[t.dest].intl&&t.tasks.some(x=>x.k&&TASK_BY[x.k][4]))out.push('intl task on domestic '+t.id);
  });
  /* existing 12 unchanged (ids, done, due), idempotent, deterministic */
  {const t=JSON.parse(JSON.stringify(ops[0])),before=JSON.stringify(t.tasks);const first=t.tasks.filter(x=>x.id>100);
    t.tasks=t.tasks.filter(x=>x.id<=12).map(x=>{const y={...x};delete y.win;return y;});const old=JSON.stringify(t.tasks.map(x=>[x.id,x.t,x.who,x.due,x.done]));
    opInit(t);if(JSON.stringify(t.tasks.filter(x=>x.id<=12).map(x=>[x.id,x.t,x.who,x.due,x.done]))!==old)out.push('old tasks changed');
    if(JSON.stringify(t.tasks)!==before)out.push('init not deterministic');
    opInit(t);if(JSON.stringify(t.tasks)!==before)out.push('init not idempotent');
    if(!first.length)out.push('no new tasks');}
  /* windows partition the tasks; filters; toggle */
  ops.forEach(t=>{
    const all=opTaskFilter(t),sum=OP_WINS.reduce((a,w)=>a+opTaskFilter(t,{win:w[0]}).length,0);
    if(all.length!==t.tasks.length||sum!==t.tasks.length)out.push('windows do not cover '+t.id);
    const st=['open','overdue','done'].reduce((a,s)=>a+opTaskFilter(t,{st:s}).length,0);if(st!==t.tasks.length)out.push('status filter '+t.id);
    const wo=['a','o','f'].reduce((a,s)=>a+opTaskFilter(t,{who:s}).length,0);if(wo!==t.tasks.length)out.push('owner filter '+t.id);
  });
  {const t=ops[0],x=t.tasks.find(y=>!y.done),was=x.done;const r=opToggleTask(t,x.id);if(r!==!was||x.done===was)out.push('toggle');opToggleTask(t,x.id);if(x.done!==was)out.push('toggle back');if(opToggleTask(t,99999)!==null)out.push('toggle unknown');}
  /* CSV */
  TRIPS.filter(t=>t.stage!=='Quote').forEach(t=>{
    const c=opCsv(t,'en'),ln=c.split('\n');if(ln.length!==t.pax+1||t.trav.length!==t.pax)out.push(`csv rows ${t.id} ${ln.length} vs ${t.pax}+1`);
    if(/[֐-׿]/.test(c))out.push('hebrew in english csv '+t.id);
    if(!/^Room,Name,Household,Room type,Date of birth,Passport no,Passport expiry/.test(ln[0]))out.push('csv header');
    if(!/[֐-׿]/.test(opCsv(t,'he')))out.push('hebrew csv');
    if(S.lang!==lang0)out.push('opCsv leaked language');
  });
  {const t=ops[0];S.lang='en';const k=opAddCol(t,'Seat, bus "A"');if(!k)out.push('addcol');opSetCell(t,0,k,'12A');
    const c=opCsv(t,'en').split('\n');if(!/Seat, bus ""A""/.test(c[0])||!/,12A$/.test(c[1]))out.push('csv custom column '+c[0].slice(-40));
    if(opAddCol(t,'seat, bus "a"')!==null)out.push('duplicate column');if(opSetCell(t,0,'zzz','x'))out.push('setcell unknown col');
    if(!opDelCol(t,k)||opCols(t).length||t.trav[0].x[k]!==undefined)out.push('delcol');}
  /* passports */
  TRIPS.filter(t=>t.stage!=='Quote').forEach(t=>{
    const ret=addDays(t.dep,t.nights+183),exp=t.trav.filter(x=>x.pass!=='Missing'&&x.passExp&&D(x.passExp)<D(ret)).length;
    if(t.trav.filter(x=>opPassWarn(t,x)).length!==exp)out.push('passport warn count '+t.id);
    if(t.trav.some(x=>x.pass==='Missing'&&opPassWarn(t,x)))out.push('warn on missing passport');
  });
  {const n=TRIPS.filter(t=>t.stage==='Operations').reduce((a,t)=>a+t.trav.filter(x=>opPassWarn(t,x)).length,0);console.log('ops: passport warnings on Operations trips',n);
    S.lang='en';const w=ops.find(t=>t.trav.some(x=>opPassWarn(t,x)));if(w){const html=opManifestTab(w);if(!/under 6 months after return/.test(html))out.push('warning not rendered');}}
  /* send forms changes only 'not sent' */
  {const t=ops.find(y=>y.trav.some(x=>Object.values(x.form).includes('not sent')))||ops[0],snap=t.trav.map(x=>({...x.form}));
    const nsent=snap.reduce((a,f)=>a+Object.values(f).filter(v=>v==='not sent').length,0),n=opSendForms(t);
    if(n!==nsent)out.push('sendforms count '+n+' vs '+nsent);
    t.trav.forEach((x,i)=>Object.keys(x.form).forEach(f=>{const a=snap[i][f],b=x.form[f];if(a==='not sent'?b!=='sent':b!==a)out.push('sendforms changed '+a+' to '+b);}));
    if(opSendForms(t)!==0)out.push('sendforms not idempotent');}
  /* import: existing travelers only, pax and billing groups unchanged */
  ops.forEach(t=>{
    const pax=t.trav.length,names=t.trav.map(x=>x.n+'|'+x.room+'|'+x.g).join(),c0=calc(t).rev,g0=JSON.stringify(groupsCalc(t).rows.map(r=>[r.name,r.size,r.amt]));
    const pv=opImportPreview(t);if(pv.length!==5)out.push('preview rows '+pv.length);
    const miss0=t.trav.filter(x=>x.pass==='Missing').length;
    opImportApply(t);
    if(t.trav.length!==pax||t.trav.map(x=>x.n+'|'+x.room+'|'+x.g).join()!==names||t.pax!==pax)out.push('import changed travelers '+t.id);
    if(calc(t).rev!==c0||JSON.stringify(groupsCalc(t).rows.map(r=>[r.name,r.size,r.amt]))!==g0)out.push('import changed groupsCalc '+t.id);
    if(t.trav.filter(x=>x.pass==='Missing').length>miss0)out.push('import added missing');
    if(t.trav.some(x=>x.pass==='Missing'&&(x.passNo||x.passExp)))out.push('import left passNo on Missing');
    const ident=calc(t);if(Math.abs(ident.planProfit-ident.amtDiff-ident.fx-ident.fcProfit)>.05)out.push('identity '+t.id);
  });
  /* rooming summary and blocks */
  TRIPS.filter(t=>t.stage!=='Quote').forEach(t=>{
    const rs=opRoomSummary(t),b=blockOf(t);
    rs.rows.forEach(r=>{if(r.list!==r.block)out.push('rooming vs block '+t.id+' '+r.k);});
    if(rs.rows.reduce((a,r)=>a+r.pax,0)!==t.pax)out.push('rooming pax '+t.id);if(rs.rows.reduce((a,r)=>a+r.list,0)!==rs.rooms)out.push('rooming rooms '+t.id);
    if(b.exposure<0)out.push('exposure<0 '+t.id);
  });
  {S.role='manager';const rows=opBlockRows(),sum=r2(rows.reduce((a,r)=>a+r.b.exposure,0)),rr=r2(ops.reduce((a,t)=>{const x=releaseRisk(t);return a+(x?x.amt:0);},0));
    if(rows.length!==ops.length)out.push('block rows '+rows.length);if(Math.abs(sum-rr)>.01)out.push('blocks exposure '+sum+' vs releaseRisk '+rr);
    const M=leakModel(TRIPS);if(Math.abs(M.release-rr)>.01)out.push('blocks vs leaks '+M.release+' vs '+rr);
    console.log('ops: blocks',rows.length,'exposure',sum);}
  /* render everything in both languages for manager, accountant and one agent */
  const brandNames=new Set([...CATALOG.hotels.map(x=>x.name),...CATALOG.venues.map(x=>x.name)]);
  for(const lang of ['en','he']){S.lang=lang;
    for(const role of ['manager','accountant','Priya','Dana']){S.role=role;
      const html=opBlocksCard()+(typeof vHotelsList==='function'?vHotelsList():'');h.chk(html,`ops blocks ${lang} ${role}`);if(lang==='en')h.scan(html,'ops blocks');
      if(role==='manager'||role==='accountant'){if(!/Release deadlines by trip|מועדי שחרור חדרים לפי טיול/.test(html)||html.indexOf('op-blocks')>html.indexOf('al-card'))out.push('blocks card not on top '+role);}
      /* real brand rows carry neutral wording only */
      (opBlocksCard().match(/<tr>[\s\S]*?<\/tr>/g)||[]).forEach(row=>{const tx=row.replace(/<[^>]*>/g,' ');if([...brandNames].some(n=>tx.includes(n))&&/gap|overbill|dispute|late|slow|poor|risk|overdue|expir|פער|מחלוק|איחור|סיכון/i.test(tx))out.push('negative wording next to a brand: '+tx.slice(0,80));});
      visibleTrips().forEach(t=>{S.tripId=t.id;S.tab='trip';
        ['optasks','manifest'].forEach(pt=>{S.ptab=pt;
          [{},{opWin:'w14',opSt:'open',opWho:'a'},{opWin:'aft',opSt:'done',opWho:'f'},{opWin:'all',opSt:'overdue',opWho:'o'}].forEach(fl=>{
            Object.assign(S,{opWin:'all',opSt:'all',opWho:'all'},fl);
            const hh=vTrip();h.chk(hh,`ops ${pt} ${lang} ${role} ${t.id}`);if(lang==='en')h.scan(hh,'ops '+pt);
            if(t.stage==='Quote'&&!/opens after the quote|נפתח אחרי/.test(hh))out.push('no gate '+pt+' '+t.id);
            if(t.stage!=='Quote'&&pt==='optasks'&&!fl.opWin&&fl.opSt===undefined&&!/op-win/.test(hh))out.push('tasks not rendered '+t.id);});});
        S.opWin=S.opSt=S.opWho='all';});
      if(role==='manager'){const t=ops[0];S.tripId=t.id;S.ptab='manifest';S.opImp=t.id;const hh=vTrip();h.chk(hh,'ops import '+lang);if(lang==='en')h.scan(hh,'ops import');if(!/op-imp/.test(hh))out.push('import preview not rendered');S.opImp='';
        const k=opAddCol(t,lang==='en'?'Seat':'Seat');const h2=vTrip();h.chk(h2,'ops custom col '+lang);if(lang==='en')h.scan(h2,'ops custom col');opDelCol(t,k);}
    }}
  S.lang=lang0;S.role=role0;
  /* tab registry */
  const tabs=STAGES.find(s=>s[0]==='o')[2].map(x=>x[0]);
  if(tabs.indexOf('optasks')<0||tabs.indexOf('manifest')<0||tabs.indexOf('optasks')>tabs.indexOf('manifest')||tabs.indexOf('odash')>tabs.indexOf('optasks'))out.push('tab order '+tabs.join());
  if(typeof TRIP_TABS.optasks!=='function'||typeof TRIP_TABS.manifest!=='function')out.push('TRIP_TABS');
  return out;}});
