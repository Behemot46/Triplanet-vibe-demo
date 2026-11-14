/* ---------- v8.4 Traveler app (module code pt): the phone screen of the demo ----------
   Portal 'traveler' (s13_portal.js). People = travelers of one Operations trip (S.ptTrip), id 'tripId|index'.
   Tabs: home (readiness, balance, forms), pay (simulated card step), forms (4 traveler forms inline), plan (day by day), help.
   Mutations (all finance-neutral): t.groups[gi].depPaid/balPaid via ptPay(), x.form[k]='done' via ptSubmit(), PT_ROOM for the 4th form.
   Nothing here is a real payment: the card step is a labelled placeholder. */
Object.assign(S,{ptTrip:'nas',ptPay:'',ptFill:'',ptErr:null});
const PT_FORMS=['reg','med','waiver','room'];            /* the four traveler forms (FB_TRAV) */
const PT_REAL=['reg','med','waiver'];                    /* the three with per-traveler data (x.form) */
const PT_ROOM={};                                        /* 4th form status per traveler: 'tripId|index' -> 'done' */
const PT_DRAFT={};                                       /* unsaved answers, not persisted */
let PT_LAST=null;                                        /* the last simulated payment, for the confirmation card */
PERSIST.push({key:'pt-room',get:()=>PT_ROOM,set:v=>{Object.keys(PT_ROOM).forEach(k=>delete PT_ROOM[k]);if(v&&typeof v==='object')Object.assign(PT_ROOM,v);},reset:()=>{Object.keys(PT_ROOM).forEach(k=>delete PT_ROOM[k]);}});

/* ---------- data helpers ---------- */
const ptTrips=()=>TRIPS.filter(t=>t.stage==='Operations'&&t.trav&&t.trav.length);
const ptTrip=()=>{const a=ptTrips();return a.find(t=>t.id===S.ptTrip)||a[0]||null;};
const ptKey=(t,i)=>t.id+'|'+i;
function ptPeople(){const t=ptTrip();if(!t)return [];
  const order=t.groups.map(g=>g.name);
  return t.trav.map((x,i)=>({id:ptKey(t,i),name:x.n,sub:x.g,first:String(x.n).split(' ')[0],o:order.indexOf(x.g)*1000+i})).sort((a,b)=>a.o-b.o);}
/* the traveler behind a person id; falls back to the trip's first traveler */
function ptWho(p){const id=p?p.id:'',[tid,ix]=String(id).split('|');
  const t=TRIPS.find(z=>z.id===tid&&z.trav&&z.trav.length)||ptTrip();if(!t)return null;
  const i=t.trav[+ix]?+ix:0;return {t,i,x:t.trav[i]};}
const ptStat=(t,x,i,k)=>k==='room'?(PT_ROOM[ptKey(t,i)]||((x.form&&x.form.reg)==='not sent'?'not sent':'sent')):((x.form&&x.form[k])||'not sent');
const ptTodo=(t,x,i)=>PT_REAL.filter(k=>ptStat(t,x,i,k)!=='done');
const ptIntl=t=>!!(typeof DESTS!=='undefined'&&DESTS[t.dest]&&DESTS[t.dest].intl);
const ptRoomies=(t,x)=>t.trav.filter(y=>y!==x&&y.room===x.room);
const PT_RT={Single:['יחיד','Single'],Twin:['שתי מיטות','Twin'],Double:['זוגי','Double'],Triple:['משולש','Triple'],Quad:['מרובע','Quad']};
const ptRoomType=x=>{const r=PT_RT[x.roomType];return r?L(r[0],r[1]):esc(x.roomType||'');};
const PT_FN={reg:['רישום','Registration'],med:['רפואה ותזונה','Medical and dietary'],waiver:['כתב ויתור','Waiver'],room:['העדפות חדר','Rooming preference']};
const PT_FI={reg:'idcard',med:'shield',waiver:'document',room:'bed'};
const PT_FD={reg:['שם, תאריך לידה, דרכון ואיש קשר לשעת חירום.','Name, date of birth, passport and emergency contact.'],med:['תזונה, אלרגיות וצרכי ניידות.','Diet, allergies and mobility needs.'],waiver:['תנאים, חתימה מוקלדת ותאריך.','Terms, typed signature and date.'],room:['סוג מיטה, שותף לחדר ובקשות לחדר שקט.','Bed type, roommate and quiet-room requests.']};
/* readiness: forms done, household paid, passport received (international trips only), as equal parts */
function ptReady(t,x,i){const hh=pvHousehold(t,i),parts=[];
  parts.push(PT_REAL.filter(k=>ptStat(t,x,i,k)==='done').length/PT_REAL.length);
  parts.push(hh&&hh.row.open<=0?1:0);
  if(ptIntl(t))parts.push(x.pass==='Missing'?0:1);
  return Math.round(parts.reduce((a,b)=>a+b,0)/parts.length*100);}
/* the next payment a household owes: deposit first, then balance */
function ptNext(t,gi){const row=groupsCalc(t).rows[gi];if(!row||row.open<=0)return null;
  return !row.depPaid?{k:'dep',amt:row.dep,due:t.depDue}:{k:'bal',amt:row.bal,due:t.balDue};}
/* the simulated payment: deposit first if unpaid, else balance. Returns the amount paid (0 if nothing was due). */
function ptPay(t,gi){const nx=ptNext(t,gi);if(!nx)return 0;const g=t.groups[gi];if(nx.k==='dep')g.depPaid=true;else g.balPaid=true;return nx.amt;}

/* ---------- forms: answers, validation, submit ---------- */
const ptFields=k=>{const f=typeof fbForm==='function'?fbForm(k):null;if(!f)return [];return (f.pub&&f.pub.length?f.pub:f.fields)||[];};
const ptDK=(t,i,k)=>ptKey(t,i)+'|'+k;
function ptAnswers(t,i,k){const dk=ptDK(t,i,k);if(PT_DRAFT[dk])return PT_DRAFT[dk];const x=t.trav[i],a={};
  if(k==='reg'){a.fullName=x.n;a.dob=x.dob||'';a.passExp=x.passExp||'';if(x.emerg){a.emName=x.emerg.name;a.emPhone=x.emerg.phone;}}
  if(k==='med'){const f=ptFields('med').find(z=>z.k==='diet'),o=f&&(f.options||[]).find(z=>z.en===x.diet);a.diet=o?o.v:'';}
  if(k==='waiver')a.signDate=iso(TODAY);
  if(k==='room'){const f=ptFields('room').find(z=>z.k==='roomType'),o=f&&(f.options||[]).find(z=>z.v===x.roomType);a.roomType=o?o.v:'';}
  return (PT_DRAFT[dk]=a);}
const ptVisible=(f,a)=>!f.showIf||(a[f.showIf.k]===f.showIf.eq)||(f.showIf.eq===true&&!!a[f.showIf.k]);
function ptValidate(k,a){const err={};
  ptFields(k).forEach(f=>{if(f.type==='section'||!ptVisible(f,a))return;const v=a[f.k];
    if(f.type==='toggle'){if(f.req&&!v)err[f.k]=L('יש לאשר כדי להמשיך','Please confirm to continue');return;}
    if(f.req&&(v==null||String(v).trim()===''))err[f.k]=L('שדה חובה','Required');});
  return err;}
/* submit: sets the per-traveler status. Returns the error map (empty = saved). */
function ptSubmit(t,i,k){const a=ptAnswers(t,i,k),err=ptValidate(k,a);if(Object.keys(err).length)return err;
  if(k==='room')PT_ROOM[ptKey(t,i)]='done';else{const x=t.trav[i];if(!x.form)x.form={reg:'not sent',med:'not sent',waiver:'not sent'};x.form[k]='done';}
  delete PT_DRAFT[ptDK(t,i,k)];return {};}

function ptField(f,a,err,uid){
  const lab=fbLb(f.label);
  if(f.type==='section')return `<h4 class="pt-sec">${esc(lab)}</h4>`;
  if(!ptVisible(f,a))return '';
  const v=a[f.k]==null?'':a[f.k],id=`pt-${uid}-${f.k}`,at=`data-form="pt-f" data-k="${esc(f.k)}" id="${id}"`;
  const e=err&&err[f.k],help=f.help?`<small class="pt-help">${esc(fbLb(f.help))}</small>`:'';
  const req=f.req?'<i class="pt-req" aria-hidden="true">*</i>':'';
  let ctl='';
  if(f.type==='toggle')return `<div class="pt-fld pt-chk${e?' bad':''}"><label class="pt-ck"><input type="checkbox" ${at} ${v===true?'checked':''}><span>${esc(lab)}${req}</span></label>${help}${e?`<small class="pt-er" role="alert">${esc(e)}</small>`:''}</div>`;
  if(f.type==='select')ctl=`<select ${at}><option value="">${L('בחרו','Choose')}</option>${(f.options||[]).map(o=>`<option value="${esc(o.v)}" ${v===o.v?'selected':''}>${esc(L(o.he,o.en))}</option>`).join('')}</select>`;
  else if(f.type==='textarea')ctl=`<textarea rows="3" ${at}>${esc(v)}</textarea>`;
  else if(f.type==='date')ctl=`<input type="date" ${at} value="${esc(v)}">`;
  else if(f.type==='file')ctl=`<button class="btn sm" type="button" disabled>${ic('document')} ${L('צירוף קובץ (דמו)','Attach a file (demo)')}</button>`;
  else if(f.type==='multi')ctl=`<div class="pt-mc">${(f.options||[]).map(o=>`<label class="pt-ck"><input type="checkbox" data-form="pt-m" data-k="${esc(f.k)}" data-o="${esc(o.v)}" ${(Array.isArray(v)&&v.includes(o.v))?'checked':''}><span>${esc(L(o.he,o.en))}</span></label>`).join('')}</div>`;
  else if(f.type==='repeater')return '';
  else ctl=`<input type="${f.type==='email'?'email':f.type==='tel'?'tel':(f.type==='number'||f.type==='money')?'number':'text'}" ${at} value="${esc(v)}" ${f.type==='tel'?'inputmode="tel"':''}>`;
  return `<div class="pt-fld${e?' bad':''}"><label for="${id}">${esc(lab)}${req}</label>${ctl}${help}${e?`<small class="pt-er" role="alert">${esc(e)}</small>`:''}</div>`;
}
function ptFormBody(t,i,k){const a=ptAnswers(t,i,k),f=typeof fbForm==='function'?fbForm(k):null;
  const err=S.ptErr&&S.ptErr.k===k?S.ptErr.e:null,uid=t.id+i+k;
  return `<div class="card hc-card pt-form" id="pt-form">
   <div class="hc-h"><h3>${ic(PT_FI[k])} ${L(PT_FN[k][0],PT_FN[k][1])}</h3><button class="btn sm" data-act="pt-fclose" aria-label="${L('סגירה','Close')}">${ic('x')}</button></div>
   <p class="muted small">${L(PT_FD[k][0],PT_FD[k][1])}</p>
   ${k==='waiver'&&typeof fbTermsHtml==='function'?`<div class="pt-terms">${fbTermsHtml()}</div><p class="pt-sample">${ic('danger')} ${L('נוסח לדוגמה, יש להעביר לבדיקת יועץ משפטי.','Sample wording, to be reviewed by counsel')}</p>`:''}
   <div class="pt-fields">${ptFields(k).map(z=>ptField(z,a,err,uid)).join('')}</div>
   <div class="pt-act"><button class="btn pri pt-wide" data-act="pt-submit" data-v="${k}">${ic('check')} ${L('שליחה','Submit')}</button><button class="btn pt-wide" data-act="pt-fclose">${L('ביטול','Cancel')}</button></div></div>`;
}

/* ---------- tab views ---------- */
const ptChips=()=>{const a=ptTrips();if(a.length<2)return '';
  return `<div class="pt-chips" role="group" aria-label="${L('בחירת טיול','Choose a trip')}">${a.map(t=>`<button class="chip${t.id===(ptTrip()&&ptTrip().id)?' on':''}" data-act="pt-trip" data-v="${t.id}"><bdi>${esc(t.name)}</bdi></button>`).join('')}</div>`;};
const ptDue=d=>d?fmtDate(d):'';
/* "Due by <date>", or "Was due <date>" once the date has passed */
const ptDueL=d=>D(d)<TODAY?L('היה אמור להשתלם ב-','Was due ')+ptDue(d):L('עד ','Due by ')+ptDue(d);
const ptStPill=s=>s==='done'?pillF(`${ic('done')} ${L('בוצע','Done')}`,'green'):s==='sent'?pillF(L('מחכה לך','Waiting for you'),'amber'):pillF(L('עוד לא נשלח','Not sent yet'),'');

function ptMe(t,x,i){const hh=pvHousehold(t,i);
  return `<div class="pt-me">${avatarOf(x.n)}<div><b><bdi>${esc(x.n)}</bdi></b><span class="muted small">${hh?'<bdi>'+esc(x.g)+'</bdi> · ':''}<bdi>${esc(t.name)}</bdi></span></div></div>`;}

function ptHome(t,x,i){
  const hh=pvHousehold(t,i),open=hh?hh.row.open:0,todo=ptTodo(t,x,i),days=pvDaysTo(t),pct=ptReady(t,x,i),intl=ptIntl(t),ro=ptRoomies(t,x);
  const dTxt=days>0?L(`בעוד ${hlKey(days+' ימים')}`,`in ${hlKey(days+' days')}`):days===0?hlKey(L('היום','today')):L('כבר בדרך','already under way');
  const brief=(open>0||todo.length||(intl&&x.pass==='Missing'))
    ?L(`הטיול ל-<bdi>${esc(t.name)}</bdi> יוצא ${dTxt}. ${open>0?`נשארו ${hlWarn(usd(open))} לתשלום`:'התשלום סגור'}${todo.length?`, ו-${hlWarn(todo.length+(todo.length===1?' טופס':' טפסים'))} למילוי`:''}.`,
       `Your <bdi>${esc(t.name)}</bdi> trip leaves ${dTxt}. ${open>0?`${hlWarn(usd(open))} is still to pay`:'Your payment is complete'}${todo.length?` and ${hlWarn(todo.length+(todo.length===1?' form':' forms'))} to fill`:''}.`)
    :L(`הכל מוכן ל-<bdi>${esc(t.name)}</bdi>. ${hlPos('אין מה לעשות')} עד היציאה ${dTxt}.`,`You are all set for <bdi>${esc(t.name)}</bdi>. ${hlPos('Nothing to do')} before you leave ${dTxt}.`);
  const ctas=[];if(open>0)ctas.push(hcCta('mint','card',L('תשלום יתרה','Pay balance'),'data-act="pt-go" data-v="pay"'));
  ctas.push(hcCta(open>0?'ghost':'mint','pen',L('מילוי טפסים','Fill forms'),'data-act="pt-go" data-v="forms"'));
  const roomSub=ro.length?L('עם ','with ')+ro.map(y=>String(y.n).split(' ')[0]).join(', '):L('חדר ','Room ')+esc(x.room);
  const hero=pvHero({cls:'pt-hero',greet:L('שלום','Hello'),role:L('אפליקציית הנוסע','Traveler app'),brief,ctas:ctas.slice(0,2),aria:L('הנסיעה שלי','My trip'),
    gauge:{pct,label:L('מוכנים לנסיעה','ready to travel'),lines:[
      {cls:todo.length?'op':'ok',icon:todo.length?'hourglass':'check',lab:L('טפסים','Forms'),val:`${PT_REAL.length-todo.length}/${PT_REAL.length}`},
      {cls:open>0?'op':'ok',icon:open>0?'hourglass':'check',lab:L('תשלום','Payment'),val:open>0?usd(open):L('שולם','Paid')},
      ...(intl?[{cls:x.pass==='Missing'?'op':'ok',icon:x.pass==='Missing'?'hourglass':'check',lab:L('דרכון','Passport'),val:x.pass==='Missing'?L('חסר','Missing'):L('התקבל','Received')}]:[])]},
    kpis:[{lab:L('ימים ליציאה','Days to go'),val:Math.max(0,days),sub:fmtDate(t.dep)},
      {lab:L('היתרה שלי','My balance'),val:open,money:1,cls:'pf',act:'pt-go',v:'pay',sub:open>0?ptDueL(ptNext(t,hh.gi).due):L('שולם במלואו','Paid in full')},
      {lab:L('טפסים למילוי','Forms to fill'),val:todo.length,act:'pt-go',v:'forms',sub:todo.length?L('הקישו להשלמה','Tap to complete'):L('הכל הוגש','All sent')},
      {lab:L('החדר שלי','My room'),text:ptRoomType(x).replace(/<[^>]*>/g,''),sub:roomSub}]});
  /* to-do list */
  const steps=[];
  if(open>0)steps.push({sev:'urgent',t:L(`לשלם ${usd(open)} (${ptNext(t,hh.gi).k==='dep'?'מקדמה':'יתרה'})`,`Pay ${usd(open)} (${ptNext(t,hh.gi).k==='dep'?'deposit':'balance'})`),s:ptDueL(ptNext(t,hh.gi).due),b:L('תשלום','Pay'),a:'pay'});
  todo.forEach(k=>steps.push({sev:'todo',t:L(`למלא: ${PT_FN[k][0]}`,`Fill in: ${PT_FN[k][1]}`),s:ptStat(t,x,i,k)==='sent'?L('הסוכנות שלחה לך את הטופס','Your agent sent you this form'):L('עוד לא נשלח, אפשר למלא כבר עכשיו','Not sent yet, you can fill it in now'),b:L('מילוי','Fill'),a:'forms',f:k}));
  if(intl&&x.pass==='Missing')steps.push({sev:'todo',t:L('להעביר עותק דרכון לסוכן','Send your passport copy to your agent'),s:L('נדרש לנסיעה בינלאומית','Needed for international travel'),b:L('עזרה','Help'),a:'help'});
  if(ptStat(t,x,i,'room')!=='done')steps.push({sev:'todo',t:L('לאשר העדפות חדר','Confirm your rooming preference'),s:L('סוג מיטה ושותף לחדר','Bed type and roommate'),b:L('מילוי','Fill'),a:'forms',f:'room'});
  const stepsCard=`<div class="card hc-card"><div class="hc-h"><h3>${L('מה נשאר לי','What is left for me')}</h3>${steps.length?`<span class="hc-pill blue">${steps.length}</span>`:`<span class="hc-pill green">${L('הכל מוכן','All set')}</span>`}</div>
    ${steps.length?`<ol class="hc-steps">${steps.map(s=>`<li class="${s.sev}"><span class="hc-dot"></span><div><b>${s.t}</b><span class="muted small">${s.s}</span></div><button class="btn sm${s.sev==='urgent'?' pri':''}" data-act="pt-go" data-v="${s.a}"${s.f?` data-f="${s.f}"`:''}>${s.b}</button></li>`).join('')}</ol>`
      :`<p class="muted">${L('כל הטפסים הוגשו והתשלום סגור. נתראה ביציאה.','Every form is in and your payment is complete. See you at departure.')}</p>`}</div>`;
  /* next up: photo card */
  const bg=phBg(phSrc('dest',t.dest),'background:linear-gradient(135deg,var(--hero1),var(--hero2))'),g=typeof guideOfTrip==='function'?guideOfTrip(t.id):null;
  const nxt=`<div class="card hc-card pt-next"><span class="pt-ph" style="${bg}"><span class="hc-when ${days<=30?'soon':''}">${days>0?L(`בעוד ${days} ימים`,`In ${days} days`):L('בדרך','Under way')}</span></span>
    <div class="pt-nb"><h3><bdi>${esc(t.name)}</bdi></h3><span class="muted small">${fmtDate(t.dep)} · ${t.nights+1} ${L('ימים','days')} · ${dn(t.dest)}</span>
    <ul class="pt-kv"><li>${ic('pin')}<span><b>${L('נקודת מפגש','Meeting point')}</b>${AGENCY} ${L('(משרד), טולסה','office, Tulsa')} · ${pvClock(7*60)}</span></li>
     ${t.room&&t.room.hotel?`<li>${ic('bed')}<span><b>${L('מלון','Hotel')}</b><bdi>${esc(t.room.hotel)}</bdi></span></li>`:''}
     ${g?`<li>${ic('users')}<span><b>${L('מנהל הטיול','Tour director')}</b>${esc(L(g.he,g.en))}</span></li>`:''}</ul>
    <button class="hc-more" data-act="pt-go" data-v="plan">${L('לתוכנית היומית','Day-by-day plan')} ${ic('chev','flip')}</button></div></div>`;
  return `<div class="hc pt-grid">${hero}${stepsCard}${nxt}</div>`;
}

function ptPayView(t,x,i){
  const hh=pvHousehold(t,i);if(!hh)return `<div class="card hc-card"><p class="muted">${L('אין נתוני תשלום לנוסע הזה.','No payment details for this traveler.')}</p></div>`;
  const r=hh.row,nx=ptNext(t,hh.gi),late=r.late>0;
  const line=(lab,amt,due,paid)=>`<li class="${paid?'ok':''}"><span class="pt-pl">${paid?ic('done'):ic('clock')}<b>${lab}</b><small>${paid?L('שולם','Paid'):ptDueL(due)}</small></span><span class="pt-pa">${usd(amt)}</span></li>`;
  const sum=`<div class="card hc-card"><div class="hc-h"><h3>${L('התשלום של משק הבית','My household payment')}</h3>${r.open<=0?`<span class="hc-pill green">${L('שולם במלואו','Paid in full')}</span>`:late?`<span class="hc-pill red">${L('באיחור','Overdue')}</span>`:`<span class="hc-pill blue">${L('פתוח','Open')}</span>`}</div>
    <p class="muted small"><bdi>${esc(r.name)}</bdi> · ${hh.members.map(z=>'<bdi>'+esc(String(z.y.n).split(' ')[0])+'</bdi>').join(', ')}</p>
    <div class="pt-total"><span>${L('סך הכל','Total')}</span><b>${usd(r.amt)}</b></div>
    <ul class="pt-pays">${line(L(`מקדמה (${t.pct}%)`,`Deposit (${t.pct}%)`),r.dep,t.depDue,r.depPaid)}${line(L('יתרה','Balance'),r.bal,t.balDue,r.balPaid)}</ul>
    <div class="pt-open"><span>${L('שולם עד כה','Paid so far')} <b>${usd(r.paid)}</b></span><span>${L('נשאר','Still to pay')} <b>${r.open>0?hlWarn(usd(r.open)):hlPos(usd(0))}</b></span></div></div>`;
  let act='';
  if(S.ptPay==='done'&&PT_LAST&&PT_LAST.id===ptKey(t,i))
    act=`<div class="card hc-card pt-ok"><span class="pt-okic">${ic('done')}</span><h3>${L('התשלום התקבל (הדמיה)','Payment received (simulation)')}</h3><p>${L(`${usd(PT_LAST.amt)} נרשמו עבור משק הבית.`,`${usd(PT_LAST.amt)} was recorded for your household.`)}</p><p class="muted small">${pvMoneyNote()}</p>
      <button class="btn" data-act="pt-paycancel">${L('סגירה','Done')}</button></div>`;
  else if(nx&&S.ptPay==='card')
    act=`<div class="card hc-card pt-card"><div class="hc-h"><h3>${L('אישור תשלום','Confirm payment')}</h3><span class="pill amber">${L('דמו','DEMO')}</span></div>
      <div class="pt-cc" aria-hidden="true"><span class="pt-ccl">${L('כרטיס לדוגמה','Sample card')}</span><b>•••• •••• •••• 4242</b><span><i>${L('תוקף','Valid')} 12/30</i><i>${AGENCY}</i></span></div>
      <p class="pt-demo">${ic('lock')} ${L('זה שלב מדומה. לא מזינים פרטי כרטיס ולא יוצא כסף.','This step is simulated. No card details are entered and no money moves.')}</p>
      <div class="pt-total"><span>${nx.k==='dep'?L('מקדמה','Deposit'):L('יתרה','Balance')}</span><b>${usd(nx.amt)}</b></div>
      <div class="pt-act"><button class="btn pri pt-wide" data-act="pt-payconfirm">${ic('check')} ${L(`אישור ותשלום ${usd(nx.amt)}`,`Confirm and pay ${usd(nx.amt)}`)}</button><button class="btn pt-wide" data-act="pt-paycancel">${L('ביטול','Cancel')}</button></div></div>`;
  else if(nx)
    act=`<div class="card hc-card"><div class="hc-h"><h3>${L('התשלום הבא','Next payment')}</h3><span class="muted small">${ptDueL(nx.due)}</span></div>
      <div class="pt-total"><span>${nx.k==='dep'?L('מקדמה','Deposit'):L('יתרה','Balance')}</span><b>${usd(nx.amt)}</b></div>
      <button class="btn pri pt-wide" data-act="pt-paynow">${ic('card')} ${L('תשלום עכשיו','Pay now')}</button></div>`;
  else act=`<div class="card hc-card pt-ok"><span class="pt-okic">${ic('done')}</span><h3>${L('שולם במלואו','Paid in full')}</h3><p class="muted">${L('אין יתרה פתוחה למשק הבית שלך.','Nothing is open for your household.')}</p></div>`;
  const link=pvPayLink(t,r);
  const lk=`<div class="card hc-card"><div class="hc-h"><h3>${L('קישור תשלום','Payment link')}</h3></div><p class="muted small">${L('אפשר לשלוח את הקישור לבן או בת הזוג כדי שישלמו במקומך.','Send this link to a family member so they can pay for you.')}</p>
    <div class="pt-link"><code dir="ltr">${esc(link)}</code><button class="btn sm" data-act="pt-copy" data-v="${esc(link)}">${ic('copy')} ${L('העתקה','Copy')}</button></div></div>`;
  return `<div class="pt-stack">${ptMe(t,x,i)}${act}${sum}${lk}</div>`;
}

function ptFormsView(t,x,i){
  const open=S.ptFill&&PT_FORMS.includes(S.ptFill)?S.ptFill:'',done=PT_FORMS.filter(k=>ptStat(t,x,i,k)==='done').length;
  const row=k=>{const s=ptStat(t,x,i,k);
    return `<li class="pt-fr"><span class="pt-fi">${ic(PT_FI[k])}</span><div class="pt-ft"><b>${L(PT_FN[k][0],PT_FN[k][1])}</b><span class="muted small">${L(PT_FD[k][0],PT_FD[k][1])}</span>${ptStPill(s)}</div>
      <button class="btn sm${s==='done'?'':' pri'}" data-act="pt-fill" data-v="${k}">${s==='done'?L('צפייה','Review'):L('מילוי','Fill in')}</button></li>`;};
  return `<div class="pt-stack">${ptMe(t,x,i)}
   <div class="card hc-card"><div class="hc-h"><h3>${L('הטפסים שלי','My forms')}</h3><span class="hc-pill ${done===PT_FORMS.length?'green':'blue'}">${done}/${PT_FORMS.length}</span></div>
    <ul class="pt-fl">${PT_FORMS.map(row).join('')}</ul></div>
   ${open?ptFormBody(t,i,open):''}</div>`;
}

function ptPlanView(t,x,i){
  const days=pvDays(t),run=pvDaysTo(t),cur=run<=0&&-run<=t.nights?-run+1:0;
  const meet=`<div class="card hc-card"><div class="hc-h"><h3>${L('יום היציאה','Departure day')}</h3><span class="muted small">${fmtDate(t.dep)}</span></div>
    <ul class="pt-kv"><li>${ic('pin')}<span><b>${L('נקודת מפגש','Meeting point')}</b>${AGENCY} ${L('(משרד), טולסה','office, Tulsa')}</span></li><li>${ic('clock')}<span><b>${L('שעה','Time')}</b>${pvClock(7*60)}</span></li>
    ${t.room&&t.room.hotel?`<li>${ic('bed')}<span><b>${L('מלון','Hotel')}</b><bdi>${esc(t.room.hotel)}</bdi></span></li>`:''}</ul></div>`;
  return `<div class="pt-stack">${ptMe(t,x,i)}${meet}${days.map(d=>pvDayCard(t,d,{hl:cur===d.i})).join('')}</div>`;
}

function ptHelp(t,x,i){
  const g=typeof guideOfTrip==='function'?guideOfTrip(t.id):null,ag=STAFF.find(s=>s.key===t.agent);
  const warn=x.pass!=='Missing'&&typeof opPassWarn==='function'&&opPassWarn(t,x);
  const call=(ico,lab,sub,tel)=>`<li class="pt-cl">${ic(ico)}<span><b>${lab}</b><small>${sub}</small></span>${tel?`<a class="btn sm pri" href="tel:${esc(tel.replace(/[^0-9+]/g,''))}">${ic('travel')} ${L('התקשרות','Call')}</a>`:''}</li>`;
  const pass=x.pass==='Missing'?pillF(L('עוד לא התקבל','Not received yet'),'amber'):`<bdi>${esc(x.passNo||'')}</bdi> · ${warn?pillF(L('בתוקף פחות מ-6 חודשים אחרי החזרה','Under 6 months valid after return'),'amber'):L('בתוקף עד ','Valid to ')+fmtDate(x.passExp)}`;
  return `<div class="pt-stack">${ptMe(t,x,i)}
   <div class="card hc-card"><div class="hc-h"><h3>${L('מי עוזר לי','Who can help')}</h3></div><ul class="pt-cls">
     ${call('travel',`${AGENCY} · ${L('24/7','24/7')}`,L('קו חירום כל היום','Emergency line, any hour'),'918-555-0100')}
     ${g?call('users',esc(L(g.he,g.en)),esc(L(g.role.he,g.role.en))+' · <bdi>'+esc(g.phone)+'</bdi>',g.phone):''}
     ${ag?call('mail',esc(L(typeof AGN!=='undefined'&&AGN[ag.key]||ag.he,ag.en)),L('הסוכן/ת שלי','My agent')+' · <bdi>'+esc(ag.email)+'</bdi>',ag.phone):''}</ul></div>
   <div class="card hc-card"><div class="hc-h"><h3>${L('הפרטים שלי','My details')}</h3></div><ul class="pt-kv">
     <li>${ic('danger')}<span><b>${L('איש קשר לחירום','Emergency contact')}</b>${x.emerg?`<bdi>${esc(x.emerg.name)}</bdi> · <bdi>${esc(x.emerg.phone)}</bdi>`:L('לא הוזן','Not provided')}</span></li>
     <li>${ic('dining')}<span><b>${L('תזונה','Diet')}</b>${esc(dietn(x.diet||'None'))}</span></li>
     <li>${ic('idcard')}<span><b>${L('דרכון','Passport')}</b>${pass}</span></li>
     <li>${ic('bed')}<span><b>${L('חדר','Room')}</b>${esc(x.room)} · ${ptRoomType(x)}</span></li></ul></div></div>`;
}

const PT_SIDE={
  home:['המסך הראשי','Home','מוכנות אישית לנסיעה: טפסים, תשלום, דרכון, וצעדים אחרונים.','Personal readiness: forms, payment, passport and the last steps.'],
  pay:['תשלום','Pay','התשלום של משק הבית, מקדמה ויתרה, ושלב כרטיס מדומה. הגבייה בסוכנות מתעדכנת, ההכנסות והרווח לא משתנים.','The household payment, deposit and balance, with a simulated card step. Collected moves in the agency; revenue and profit do not.'],
  forms:['טפסים','Forms','ארבעת טפסי הנוסע ממעצב הטפסים, ממולאים בטלפון.','The four traveler forms from the form builder, filled in on the phone.'],
  plan:['תוכנית','Plan','יום אחרי יום, עם שעות, מלון ונקודת מפגש.','Day by day, with times, hotel and meeting point.'],
  help:['עזרה','Help','קו 24/7, מנהל הטיול, הסוכן ואיש הקשר לחירום.','The 24/7 line, tour director, agent and emergency contact.']};
function ptView(tab,p){
  const w=ptWho(p);if(!w)return `<div class="card hc-card"><p class="muted">${L('אין נוסעים בטיולים בשלב תפעול.','No travelers on Operations trips.')}</p></div>`;
  const {t,x,i}=w;let body='';
  if(tab==='pay')body=ptPayView(t,x,i);else if(tab==='forms')body=ptFormsView(t,x,i);else if(tab==='plan')body=ptPlanView(t,x,i);else if(tab==='help')body=ptHelp(t,x,i);else body=ptHome(t,x,i);
  const s=PT_SIDE[tab]||PT_SIDE.home;
  return `<div class="pt-wrap"><div class="pt-phone"><div class="pt-notch" aria-hidden="true"><span></span></div>${ptChips()}${body}</div>
   <aside class="pt-side"><div class="card hc-card"><div class="hc-h"><h3>${L('מה הנוסע רואה','What the traveler sees')}</h3><span class="hc-pill blue">${L(s[0],s[1])}</span></div>
    <p class="muted">${L(s[2],s[3])}</p>
    <ul class="pt-pts"><li>${ic('check')} ${L('נוסעים מזינים הכל בטלפון, בלי התקנה.','Travelers do everything on the phone, no install.')}</li><li>${ic('check')} ${L('כל שינוי נשמר בתיק של הסוכנות.','Every change lands in the agency file.')}</li><li>${ic('check')} ${L('בחרו נוסע אחר בסרגל העליון.','Pick another traveler in the bar above.')}</li></ul>
    <p class="muted small">${L('תצוגה מקדימה בלבד. האפליקציה לנוסעים עדיין לא קיימת.','Preview only. The traveler app does not exist yet.')}</p></div></aside></div>`;
}

/* default traveler: Linda Garcia on nas (found by name, not by index) */
const PT_DEF=(()=>{const t=TRIPS.find(z=>z.id==='nas'&&z.trav&&z.trav.length)||ptTrips()[0];if(!t)return '';
  const i=t.trav.findIndex(x=>x.n==='Linda Garcia');return t.id+'|'+(i>=0?i:0);})();
pvRegister('traveler',{role:['נוסע/ת','Traveler'],label:['אפליקציית הנוסע','Traveler app'],kind:'client',feat:'ptrav',people:ptPeople,def:PT_DEF,
  tabs:[['home','בית','Home','home'],['pay','תשלום','Pay','wallet'],['forms','טפסים','Forms','checklist'],['plan','תוכנית','Plan','calendar'],['help','עזרה','Help','shield']],view:ptView});

/* ---------- events (own listeners) ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="pt-"]');if(!b||!S.pv||S.pv.k!=='traveler')return;const a=b.dataset.act,v=b.dataset.v||'',w=ptWho(pvPerson());if(!w)return;
  if(a==='pt-go'){pvTab(v);if(b.dataset.f){S.ptFill=b.dataset.f;}S.ptPay='';try{window.scrollTo(0,0);}catch(err){}render();}
  else if(a==='pt-trip'){S.ptTrip=v;const t=ptTrip();S.pv.id=t?(t.id==='nas'?PT_DEF:t.id+'|0'):S.pv.id;S.ptFill='';S.ptPay='';S.ptErr=null;render();}
  else if(a==='pt-paynow'){S.ptPay='card';render();}
  else if(a==='pt-paycancel'){S.ptPay='';render();}
  else if(a==='pt-payconfirm'){const hh=pvHousehold(w.t,w.i);const amt=hh?ptPay(w.t,hh.gi):0;if(amt){PT_LAST={id:ptKey(w.t,w.i),amt};S.ptPay='done';}else S.ptPay='';render();toast(pvMoneyNote());}
  else if(a==='pt-copy'){try{navigator.clipboard.writeText(v);}catch(err){}toast(L('הקישור הועתק','Link copied'));}
  else if(a==='pt-fill'){S.ptFill=v;S.ptErr=null;render();try{const f=document.getElementById('pt-form');if(f)f.scrollIntoView({block:'start'});}catch(err){}}
  else if(a==='pt-fclose'){S.ptFill='';S.ptErr=null;render();}
  else if(a==='pt-submit'){const err=ptSubmit(w.t,w.i,v);
    if(Object.keys(err).length){S.ptErr={k:v,e:err};render();toast(L('יש להשלים את שדות החובה','Please complete the required fields'));}
    else{S.ptFill='';S.ptErr=null;render();toast(L(`${PT_FN[v][0]} נשלח לסוכן`,`${PT_FN[v][1]} sent to your agent`));}}
});
document.addEventListener('input',e=>{const el=e.target;if(!el.dataset||el.dataset.form!=='pt-f'||!S.pv||S.pv.k!=='traveler'||el.type==='checkbox'||el.tagName==='SELECT')return;
  const w=ptWho(pvPerson());if(!w||!S.ptFill)return;ptAnswers(w.t,w.i,S.ptFill)[el.dataset.k]=el.value;});
document.addEventListener('change',e=>{const el=e.target;if(!el.dataset||!S.pv||S.pv.k!=='traveler'||!S.ptFill)return;
  const w=ptWho(pvPerson());if(!w)return;const a=ptAnswers(w.t,w.i,S.ptFill);
  if(el.dataset.form==='pt-f'){a[el.dataset.k]=el.type==='checkbox'?el.checked:el.value;
    if(el.type==='checkbox'||el.tagName==='SELECT'){const y=window.scrollY;render();window.scrollTo(0,y);}}
  else if(el.dataset.form==='pt-m'){const c=Array.isArray(a[el.dataset.k])?a[el.dataset.k]:[];a[el.dataset.k]=el.checked?c.concat(el.dataset.o):c.filter(z=>z!==el.dataset.o);}});

/* ---------- developer notes ---------- */
(function(){if(typeof SPEC==='undefined')return;
  const base={roles:{view:['traveler'],act:['traveler']},perms:[],status:'roadmap',tests:['TEST pt traveler app'],code:['v6/s13_pt.js','v6/m_pt.css'],
    states:{empty:'A trip with no travelers shows an empty-state card.',loading:'Not applicable (local data).',error:'A view that throws shows "This screen could not load."'}};
  const E=(tab,o)=>{SPEC['portal:traveler:'+tab]=Object.assign({},base,o);};
  const rules=['Portal access is by invitation link (proposed); the traveler sees only their own household','Simulated payment: no card data, no money moves','Phone-width column on desktop, full width on phones'];
  E('home',{title:'Traveler app: home',purpose:'The traveler\'s own readiness, balance and what is left to do before departure.',data:['t.trav[i]','groupsCalc(t).rows','t.dep','pt-room'],
    actions:[{label:'Pay balance',does:'Opens the Pay tab',rule:'Shown only when the household has an open amount'},{label:'Fill forms',does:'Opens the Forms tab',rule:'Always available'}],
    rules:rules.concat(['Readiness = equal parts: forms done (reg, medical, waiver), household paid, passport received (international only)']),api:['GET /v1/portal/{token}/me (proposed)']});
  E('pay',{title:'Traveler app: pay',purpose:'The household amount, deposit and balance, and a simulated card payment.',data:['t.groups[gi].depPaid','t.groups[gi].balPaid','t.depDue','t.balDue','pvPayLink'],
    actions:[{label:'Pay now',does:'Opens the simulated card step',rule:'Deposit first if unpaid, else balance'},{label:'Confirm and pay',does:'Sets depPaid or balPaid on the household',rule:'Collected rises by the amount; revenue and profit do not change'},{label:'Copy link',does:'Copies the household payment link',rule:'pay.redbudtours.example placeholder'}],
    rules:rules,api:['POST /v1/portal/{token}/payments (proposed)']});
  E('forms',{title:'Traveler app: forms',purpose:'The four traveler forms (registration, medical, waiver, rooming), filled in inline.',data:['x.form.reg|med|waiver','pt-room (4th form)','FB forms (published fields)'],
    actions:[{label:'Fill in / Review',does:'Opens the form inline',rule:'Fields come from the form builder'},{label:'Submit',does:'Sets the form status to done',rule:'Required fields checked; waiver needs acceptance'}],
    rules:rules.concat(['Waiver wording is a sample, to be reviewed by counsel','The rooming form is not counted in "forms missing"']),api:['PUT /v1/portal/{token}/forms/{form} (proposed)']});
  E('plan',{title:'Traveler app: plan',purpose:'The trip day by day with clock times, hotel and meeting point.',data:['pvDays(t)','t.room.hotel'],
    actions:[],rules:rules.concat(['Day 1 starts at the 07:00 demo departure; the meeting point is a fixed placeholder','Today\'s day is highlighted only while the trip is running']),api:['GET /v1/portal/{token}/itinerary (proposed)']});
  E('help',{title:'Traveler app: help',purpose:'Who to call, the traveler\'s emergency contact, diet and passport status.',data:['GUIDES','STAFF','x.emerg','x.diet','x.passNo','opPassWarn'],
    actions:[{label:'Call',does:'Dials the number (tel: link)',rule:'Agency 24/7 line, tour director, agent'}],rules:rules.concat(['Passport shown masked; warning when valid under 6 months after return']),api:['GET /v1/portal/{token}/contacts (proposed)']});
})();

/* ---------- tests ---------- */
TESTS.push({name:'pt traveler app',run:h=>{const out=[];
  const t=TRIPS.find(z=>z.id==='nas');if(!t){return ['no nas trip'];}
  const lin=t.trav.findIndex(x=>x.n==='Linda Garcia');if(lin<0)out.push('Linda Garcia missing on nas');
  if(PORTALS.traveler.def!==('nas|'+lin))out.push('default is '+PORTALS.traveler.def);
  const idn=()=>{const c=calc(t);return Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit);};
  /* a fully paid traveler: a household whose balance we settle */
  const gi0=t.groups.findIndex(g=>g.name===t.trav[lin].g);
  const real=[].concat(CATALOG.hotels,CATALOG.venues).map(z=>z.name).filter(Boolean);
  const NEG=/unconfirmed|overdue|exposure|\blate\b|\brisk\b|\bquery\b|\bgap\b|dispute|overbilling/i;
  const guard=(hh,label)=>{hh.split('class="card hc-card').slice(1).forEach(seg=>{const card=seg.split('</div></div>')[0];const rn=real.find(n=>card.includes(n)||card.includes(n.replace(/&/g,'&amp;')));if(rn&&NEG.test(card.replace(/<[^>]*>/g,' ')))out.push('real brand '+rn+' next to negative wording '+label);});};
  const pass=()=>{const tabs=['home','pay','forms','plan','help'];
    for(const lang of ['en','he']){S.lang=lang;
      [PORTALS.traveler.def,t.id+'|'+(t.trav.length-1)].forEach(id=>tabs.forEach(tab=>{pvOpen('traveler',id,tab);
        try{render();const hh=h.els.app.innerHTML;h.chk(hh,`pt ${id} ${tab} ${lang}`);if(lang==='en')h.scan(hh,`pt ${id} ${tab}`);guard(hh,`${id} ${tab} ${lang}`);
          if(!hh.includes('pt-phone'))out.push('no phone column '+tab);
          if(tab==='home'&&!hh.includes('hc-hero'))out.push('no hero');
        }catch(e){out.push(`pt ${id} ${tab} ${lang} threw ${e.message}`);}}));}
    S.lang='en';};
  pass();
  /* open forms inline (all four) in both languages */
  for(const lang of ['en','he']){S.lang=lang;PT_FORMS.forEach(k=>{pvOpen('traveler',PORTALS.traveler.def,'forms');S.ptFill=k;try{render();const hh=h.els.app.innerHTML;h.chk(hh,`pt form ${k} ${lang}`);if(lang==='en')h.scan(hh,'pt form '+k);
    if(!hh.includes('id="pt-form"'))out.push('form not open '+k);
    if(k==='waiver'&&lang==='en'&&!hh.includes('Sample wording, to be reviewed by counsel'))out.push('waiver note missing');
    if(/<input[^>]*(cc-num|cardnumber|autocomplete="cc)/i.test(hh))out.push('card input');}catch(e){out.push('pt form '+k+' threw '+e.message);}});}
  S.lang='en';S.ptFill='';
  /* pay: collected rises by exactly the paid amount; revenue and identity unchanged */
  if(gi0>=0){const g=t.groups[gi0];g.depPaid=false;g.balPaid=false;
    const rev0=calc(t).rev,id0=idn(),col0=groupsCalc(t).collected,row=groupsCalc(t).rows[gi0];
    const a1=ptPay(t,gi0);if(!g.depPaid||g.balPaid)out.push('first pay should set depPaid only');if(Math.abs(a1-row.dep)>.005)out.push('deposit amount '+a1+' vs '+row.dep);
    let col1=groupsCalc(t).collected;if(Math.abs(col1-col0-a1)>.005)out.push('collected after deposit '+(col1-col0)+' vs '+a1);
    const a2=ptPay(t,gi0);if(!g.balPaid)out.push('second pay should set balPaid');if(Math.abs(a2-row.bal)>.005)out.push('balance amount '+a2+' vs '+row.bal);
    const col2=groupsCalc(t).collected;if(Math.abs(col2-col0-a1-a2)>.01)out.push('collected after balance');
    if(groupsCalc(t).rows[gi0].open>.005)out.push('household still open');
    if(ptPay(t,gi0)!==0)out.push('third pay should do nothing');
    if(calc(t).rev!==rev0)out.push('rev changed by pay');if(Math.abs(idn()-id0)>.01||idn()>.01)out.push('identity broke '+idn());
    /* a fully paid traveler renders every tab */
    pass();
    /* the browser flow through the real handlers */
    pvOpen('traveler',PORTALS.traveler.def,'pay');g.depPaid=false;g.balPaid=false;S.ptPay='';render();
    if(!h.els.app.innerHTML.includes('data-act="pt-paynow"'))out.push('no Pay now button');
    S.ptPay='card';render();const ph=h.els.app.innerHTML;if(!ph.includes('data-act="pt-payconfirm"')||!/DEMO|דמו/.test(ph))out.push('card step missing or unlabelled');
    if(/<input/i.test(ph.slice(ph.indexOf('pt-card'),ph.indexOf('pt-card')+1500)))out.push('inputs in card step');
    S.ptPay='';}
  /* form submit sets the status */
  const x=t.trav[lin];S.lang='en';x.form.waiver='sent';delete PT_ROOM[ptKey(t,lin)];
  let err=ptSubmit(t,lin,'waiver');if(!Object.keys(err).length)out.push('empty waiver should not submit');if(x.form.waiver==='done')out.push('waiver done without answers');
  const wa=ptAnswers(t,lin,'waiver');wa.agree=true;wa.sig=x.n;err=ptSubmit(t,lin,'waiver');if(Object.keys(err).length||x.form.waiver!=='done')out.push('waiver submit failed '+JSON.stringify(err));
  x.form.med='sent';err=ptSubmit(t,lin,'med');if(Object.keys(err).length||x.form.med!=='done')out.push('med submit '+JSON.stringify(err));
  const ra=ptAnswers(t,lin,'room');ra.roomType=ra.roomType||'Twin';err=ptSubmit(t,lin,'room');if(Object.keys(err).length||PT_ROOM[ptKey(t,lin)]!=='done')out.push('room submit '+JSON.stringify(err));
  const ready=ptReady(t,x,lin);if(ready<0||ready>100)out.push('readiness '+ready);
  /* trip chips and person list */
  if(ptPeople().length!==t.trav.length)out.push('people count');
  pvExit();S.ptFill='';S.ptPay='';PT_LAST=null;
  return out;}});
