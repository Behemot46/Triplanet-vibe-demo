/* ---------- v8.4 group leader portal (spec-v8.4-viewpoints.md §3.2 + amendments A5-A9, A11) ----------
   What the person who books the trip for a church, club or school sees: the proposal to accept, the itinerary,
   who has paid, who has sent forms, the documents, and a thread with the agent. Plugs into the portal frame
   (s13_portal.js) with pvRegister('leader',...). People are client contacts (id = client id); the trip chips pick
   among the client's non-Lost trips. Everything is simulated: reminders are toasts, messages stay on this laptop. */
Object.assign(S,{plTrip:'',plFlt:'all',plPf:'all',plAll:false,plLand:false});
let PVMSG={};
PERSIST.push({key:'pv-msgs',get:()=>jclone(PVMSG),set:v=>{if(v&&typeof v==='object'&&!Array.isArray(v))PVMSG=v;},reset:()=>{PVMSG={};}});
const plRem={};  /* simulated reminders sent this session: 'tripId|household' or 'tripId|t<index>' */

/* ---------- selection ---------- */
const plClients=()=>CLIENTS.filter(c=>pvTripsOfClient(c).length);
const plTrips=c=>pvTripsOfClient(c).slice().sort((a,b)=>a.dep<b.dep?-1:a.dep>b.dep?1:0);
/* A6: the chosen trip, else the nearest upcoming one, else the most recent */
function plTripOf(c){const ts=plTrips(c);if(!ts.length)return null;
  const hit=ts.find(t=>t.id===S.plTrip);if(hit)return hit;
  const td=iso(TODAY);return ts.find(t=>t.dep>=td)||ts[ts.length-1];}
const plClientOf=p=>p?CLI_BY[p.id]||CLIENTS.find(c=>c.id===p.id)||null:null;
/* a title in the contact name ("Rev. Alan Mercer") greets as "Rev. Mercer", otherwise the first name */
const plGreetName=n=>{const w=String(n||'').trim().split(/\s+/);return /^(rev\.|father|pastor|dr\.)$/i.test(w[0])&&w.length>1?w[0]+' '+w[w.length-1]:w[0]||'';};
const plIsQ=t=>t.stage==='Quote';
/* proposal state as the client sees it (A5) */
const plState=t=>!plIsQ(t)?'booked':(t.qst||'Draft')==='Draft'?'draft':t.qst==='Sent'?'sent':'accepted';
const plAgent=t=>STAFF.find(s=>s.key===t.agent)||{en:AGE[t.agent]||t.agent,he:AGN[t.agent]||t.agent,email:'',phone:''};
const plAgentName=t=>{const a=plAgent(t);return L(a.he,a.en);};
const plIntl=t=>!!(DESTS[t.dest]&&DESTS[t.dest].intl);
const plFormsDone=x=>!!(x.form&&OP_FORMS.every(f=>x.form[f[0]]==='done'));
const plPP=t=>{const c=calc(t);return t.pax?Math.ceil(c.rev/t.pax):0;};
/* one set of numbers for the hero, the pay tab and the tests */
function plMoney(t){
  if(plIsQ(t)||!t.groups.length)return null;
  const c=calc(t),g=groupsCalc(t),rows=g.rows,openRows=rows.filter(r=>r.open>0.005);
  return {c,g,rows,rev:c.rev,collected:g.collected,outstanding:g.outstanding,
    pct:c.rev?Math.round(g.collected/c.rev*100):0,paidN:rows.length-openRows.length,openN:openRows.length,
    lateN:rows.filter(r=>r.late>0).length,amt:r2(rows.reduce((a,r)=>a+r.amt,0)),paid:r2(rows.reduce((a,r)=>a+r.paid,0)),open:r2(rows.reduce((a,r)=>a+r.open,0))};
}
const plFmtLoc=(d,loc)=>D(d).toLocaleDateString(loc,{day:'numeric',month:'short'});

/* ---------- messages: a seeded thread per trip (deterministic) ---------- */
function plSeed(t){
  const R=rng(hashId(t.id)),a=plAgent(t),afE=String(AGE[t.agent]||a.en).split(' ')[0],afH=String(AGN[t.agent]||a.he).split(' ')[0];
  const both=(d)=>({en:plFmtLoc(d,'en-US'),he:plFmtLoc(d,'he-IL')});
  const dd=both(t.depDue),bd=both(t.balDue),dp=both(t.dep),rl=both(addDays(t.dep,-30));
  const cands=plIsQ(t)?[
    ['agent',`היי, תודה על השיחה. אני מרכיב/ה הצעה ל${t.name} עבור ${t.pax} נוסעים. אעדכן ברגע שהיא מוכנה.`,`Hi, thanks for the call. I am putting together a proposal for ${t.name} for ${t.pax} travelers. I will message you as soon as it is ready.`],
    ['leader',`תודה. האם אפשר להוסיף יום חופשי באמצע הטיול?`,`Thank you. Could we add a free afternoon in the middle of the trip?`],
    ['agent',`בוודאי. הוספתי זאת לטיוטה, והמחיר מתעדכן אוטומטית.`,`Of course. I added it to the draft and the price updates automatically.`],
    ['agent',`ההצעה כוללת מקדמה של ${t.pct}% בלבד לשמירת המקום. אשמח לענות על כל שאלה.`,`The proposal only needs a ${t.pct}% deposit to hold your space. Happy to answer any question.`],
    ['leader',`קיבלנו. נעבור עליה עם הוועדה ונחזור אליך.`,`Got it. We will go through it with the committee and get back to you.`]]
  :[
    ['agent',`תודה על המקדמה ל${t.name}. היתרה (${100-t.pct}%) לתשלום עד ${bd.he}.`,`Thank you for the deposit on ${t.name}. The balance (${100-t.pct}%) is due ${bd.en}.`],
    ['leader',`תודה ${afH}. נעביר תזכורת למשפחות שעדיין לא שילמו.`,`Thanks ${afE}. We will remind the households that have not paid yet.`],
    ['agent',`אפשר לשלוח לי את רשימת החדרים עד ${rl.he}? כולל בקשות לשותפי חדר.`,`Could you send me the rooming list by ${rl.en}? Roommate requests included, please.`],
    ['agent',`תזכורת: כל נוסע צריך להשלים רישום, טופס רפואי וכתב ויתור לפני היציאה.`,`Reminder: every traveler needs the registration, medical and waiver forms completed before departure.`],
    ['agent',`האוטובוס יוצא ממשרדי Redbud Group Tours בטולסה ב-7:00 בבוקר, ב-${dp.he}. כדאי להגיע 30 דקות מוקדם.`,`The coach leaves from the Redbud Group Tours office in Tulsa at 7:00 AM on ${dp.en}. Please arrive 30 minutes early.`]];
  const n=3+Math.floor(R()*3),pick=cands.slice(0,n);
  return pick.map((m,i)=>({from:m[0],at:addDays(iso(TODAY),-((pick.length-i)*3+Math.floor(R()*3))),he:m[1],en:m[2]}));
}
function plThread(t){if(!PVMSG[t.id])PVMSG[t.id]=plSeed(t);return PVMSG[t.id];}
function plSend(t,text){text=String(text||'').trim();if(!t||!text)return false;
  plThread(t).push({from:'leader',at:iso(TODAY),text:text.slice(0,1000)});return true;}

/* ---------- actions ---------- */
function plAccept(id){const t=TRIPS.find(x=>x.id===id);
  if(!t||t.stage!=='Quote'||t.qst!=='Sent'||typeof prAccept!=='function')return false;
  if(!prAccept(t))return false;try{toast(L('הסוכן שלכם קיבל הודעה','Your agent has been notified'));}catch(e){}return true;}
function plRemind(t,key){
  const m=plMoney(t);if(!m)return;
  if(key==='all'){const rs=m.rows.filter(r=>r.open>0.005);rs.forEach(r=>{plRem[t.id+'|'+r.name]=1;});
    toast(rs.length?L(`נשלחה תזכורת ל-${rs.length} משקי בית (הדגמה)`,`Reminder sent to ${rs.length} ${rs.length===1?'household':'households'} (simulated)`):L('כל משקי הבית שילמו','Every household has paid'));}
  else{const r=m.rows.find(x=>x.name===key);if(!r)return;plRem[t.id+'|'+r.name]=1;toast(L(`נשלחה תזכורת ל${r.name} (הדגמה)`,`Reminder sent to ${r.name} (simulated)`));}
}

/* ---------- pieces ---------- */
const plChips=(c,t)=>{const ts=plTrips(c);if(ts.length<2)return '';
  return `<div class="pl-chips" role="group" aria-label="${L('הטיולים שלכם','Your trips')}">${ts.map(x=>`<button class="pl-chip${x.id===t.id?' on':''}" data-act="pl-trip" data-v="${x.id}" aria-pressed="${x.id===t.id}"><b><bdi>${esc(x.name)}</bdi></b><small>${fmtDate(x.dep)} · ${plIsQ(x)?L('הצעה','Proposal'):L('הזמנה','Booked')}</small></button>`).join('')}</div>`;};
const plEmpty=(icon,title,sub)=>`<div class="card hc-card pl-empty">${ic(icon)}<h3>${title}</h3><p class="muted">${sub}</p></div>`;
const plStatusPill=r=>r.open<=0.005?pillF(`${ic('check')} ${L('שולם','Paid')}`,'green'):r.late>0?pillF(L(`באיחור ${r.days} ימים`,`Late ${r.days} days`),'red'):pillF(L('יתרה פתוחה','Balance open'),'amber');
const plFormPill=(x,id)=>{const s=(x.form&&x.form[id])||'not sent',m=OP_FSTATE[s]||OP_FSTATE['not sent'];return pillF(L(m[0],m[1]),m[2]);};
const plNext=t=>{const m=plMoney(t);if(!m)return '';
  const miss=t.trav.filter(x=>!plFormsDone(x)).length;
  return m.openN?L(`תזכורת ל-${m.openN} משקי בית`,`Remind ${m.openN} ${m.openN===1?'household':'households'}`):miss?L(`${miss} נוסעים עם טפסים חסרים`,`${miss} with forms missing`):L('מוכנים ליציאה','Ready to go');};
const plIncluded=t=>{const c=calc(t);
  const inc={Lodging:L('לינה במלונות','Hotel accommodation'),Transport:DESTS[t.dest].air?L('טיסות קבוצתיות והסעות','Group air and ground transportation'):L('הסעה באוטובוס תיור','Motorcoach transportation'),Guide:L('מדריך מקצועי','Professional guide'),Activities:L('פעילויות וכרטיסי כניסה','Activities and entrances'),Meals:L('ארוחות קבוצתיות','Group meals'),Insurance:L('הגנת נסיעה','Travel protection')};
  return TYPES.filter(ty=>c.byType[ty]).map(ty=>inc[ty]).filter(Boolean);};

/* ---------- home ---------- */
function plHome(p,c,t){
  const st=plState(t),days=pvDaysTo(t),ag=plAgentName(t),dep=fmtDate(t.dep),cn=calc(t),m=plMoney(t);
  let hero,steps=[];
  const dayK=days>=0?{lab:L('ימים ליציאה','Days to departure'),val:days,sub:dep}:{lab:L('יצאה','Departed'),text:fmtDate(t.dep),sub:L(`לפני ${-days} ימים`,`${-days} days ago`)};
  if(st==='booked'&&m){
    const fOK=t.trav.filter(plFormsDone).length,late=m.lateN;
    const miss=t.pax-fOK;
    hero=pvHero({cls:'pl-hero',role:esc(c.name),aria:L('תמונת מצב של הקבוצה','Group overview'),name:plGreetName(p.name),
      brief:L(`${hlKey(m.pct+'%')} ממחיר הקבוצה כבר נגבה. ${m.openN?`${hlWarn(usd(m.outstanding))} עדיין פתוחים ב-${m.openN} משקי בית${late?`, ${hlNeg(late+' באיחור')}`:''}.`:'כל משקי הבית שילמו.'} ${days>=0?`היציאה ${hcIn(days)}.`:`הקבוצה יצאה ב-${dep}.`}`,
        `${hlKey(m.pct+'%')} of the group price is in. ${m.openN?`${hlWarn(usd(m.outstanding))} is still open across ${m.openN} ${m.openN===1?'household':'households'}${late?`, ${hlNeg(late+' late')}`:''}.`:'Every household has paid.'} ${days>=0?`Departure ${hcIn(days)}.`:`The group departed on ${dep}.`}`),
      ctas:[m.openN?hcCta('mint','mail',L('תזכורת למשקי בית שלא שילמו','Remind unpaid households'),'data-act="pl-remind" data-v="all"'):hcCta('mint','plane',L('לצפות במסלול','View itinerary'),'data-act="pv-tab" data-v="trip"'),
        m.openN?hcCta('ghost','plane',L('לצפות במסלול','View itinerary'),'data-act="pv-tab" data-v="trip"'):''].filter(Boolean),
      gauge:{pct:m.pct,label:L('ממחיר הקבוצה נגבה','of the group price collected'),lines:[
        {cls:'ok',icon:'check',lab:L('שילמו','Paid households'),val:m.paidN},{cls:'op',icon:'hourglass',lab:L('יתרה פתוחה','Balance open'),val:m.openN},{cls:'op',icon:'clock',lab:L('באיחור','Late'),val:m.lateN}]},
      kpis:[Object.assign(dayK,{act:'pv-tab',v:'trip'}),
        {lab:L('טפסים מלאים','Forms complete'),val:fOK,sub:L(`מתוך ${t.pax} נוסעים`,`of ${t.pax} travelers`),act:'pv-tab',v:'people'},
        {lab:L('יתרה לתשלום','Balance due'),val:m.outstanding,money:1,cls:'warn',sub:L(`עד ${fmtDate(t.balDue)}`,`due ${fmtDate(t.balDue)}`),act:'pv-tab',v:'pay'},
        {lab:L('הצעד הבא','Next step'),text:plNext(t),cls:'hc-next',sub:miss?L(`${miss} נוסעים חסרים טפסים`,`${miss} travelers still owe forms`):L('הכל מסודר','All set'),act:'pv-tab',v:m.openN?'pay':'people'}]});
    if(m.openN)steps.push({sev:late?'urgent':'todo',tx:L(`${m.openN} משקי בית עם יתרה פתוחה`,`${m.openN} ${m.openN===1?'household has':'households have'} a balance open`),sub:L(`סך ${usd(m.outstanding)}`,`${usd(m.outstanding)} in total`),b:L('לתשלומים','Payments'),a:'pv-tab',v:'pay'});
    if(miss)steps.push({sev:'todo',tx:L(`${miss} נוסעים צריכים להשלים טפסים`,`${miss} ${miss===1?'traveler needs':'travelers need'} to finish forms`),sub:L('רישום, רפואה וכתב ויתור','Registration, medical and waiver'),b:L('לנוסעים','Travelers'),a:'pv-tab',v:'people'});
    steps.push({sev:'ok',tx:L('שלחו לסוכן את רשימת החדרים','Send your agent the rooming list'),sub:L(`עד ${fmtDate(addDays(t.dep,-30))}`,`by ${fmtDate(addDays(t.dep,-30))}`),b:L('להודעות','Messages'),a:'pv-tab',v:'msgs'});
  }else{
    const pp=plPP(t),dep$=r2(cn.rev*t.pct/100);
    const prog=st==='draft'?20:st==='sent'?50:80;
    const greet=st==='sent'?L('ההצעה שלכם מוכנה','Your proposal is ready'):st==='draft'?L('ברוכים הבאים','Welcome'):L('תודה','Thank you');
    const brief=st==='sent'?L(`ההצעה ל${hlKey(esc(t.name))} מוכנה: ${hlKey(usd(pp))} לנוסע, ${t.pax} נוסעים, יציאה ב-${dep}. אישור לוקח רגע.`,`Your proposal for ${hlKey(esc(t.name))} is ready: ${hlKey(usd(pp))} per traveler for ${t.pax} travelers, departing ${dep}. Accepting takes one tap.`)
      :st==='draft'?L(`${esc(ag)} מכין/ה את ההצעה ל${hlKey(esc(t.name))}. נעדכן אתכם ברגע שהיא מוכנה לעיון.`,`${esc(ag)} is preparing the proposal for ${hlKey(esc(t.name))}. You will hear as soon as it is ready to review.`)
      :L(`אושר, ${esc(ag)} מכין/ה את ההזמנה ל${hlKey(esc(t.name))}. ${hlPos('ההצעה התקבלה')} ונעבור יחד על הפרטים.`,`${hlPos('Accepted')}, ${esc(ag)} is preparing the booking for ${hlKey(esc(t.name))}. You will get the confirmation and the payment schedule next.`);
    hero=pvHero({cls:'pl-hero',role:esc(c.name),aria:L('תמונת מצב של ההצעה','Proposal overview'),name:plGreetName(p.name),greet,brief,
      ctas:[st==='sent'?hcCta('mint','check',L('אישור ההצעה','Accept proposal'),`data-act="pl-accept" data-v="${t.id}"`):hcCta('mint','mail',L('הודעה לסוכן','Message your agent'),'data-act="pv-tab" data-v="msgs"'),
        hcCta('ghost','plane',L('לצפות במסלול','View itinerary'),'data-act="pv-tab" data-v="trip"')],
      gauge:{pct:prog,label:L('בדרך להזמנה מאושרת','of the way to a booked trip'),lines:[
        {cls:'ok',icon:'check',lab:L('מצב','Status'),val:st==='draft'?L('בהכנה','In preparation'):st==='sent'?L('נשלחה','Sent'):L('אושרה','Accepted')},
        ...(st==='draft'?[]:[{cls:'op',icon:'hourglass',lab:L('מקדמה','Deposit'),val:usd(dep$)}])]},
      kpis:st==='draft'?[
        Object.assign(dayK,{act:'pv-tab',v:'trip'}),{lab:L('נוסעים','Travelers'),val:t.pax,sub:dn(t.dest)},
        {lab:L('לילות','Nights'),val:t.nights,sub:`${fmtDate(t.dep)} - ${fmtDate(endOf(t))}`,act:'pv-tab',v:'trip'},{lab:L('הסוכן שלכם','Your agent'),text:ag,sub:L('עונה בדוא"ל','replies by email'),act:'pv-tab',v:'msgs'}]
      :[{lab:L('מחיר לנוסע','Price per traveler'),val:pp,money:1,cls:'pf',sub:L(`סך ${usd(cn.rev)} ל-${t.pax}`,`${usd(cn.rev)} for ${t.pax}`),act:'pv-tab',v:'trip'},
        {lab:L('מקדמה','Deposit'),val:dep$,money:1,sub:L(`${t.pct}% · עד ${fmtDate(t.depDue)}`,`${t.pct}% · due ${fmtDate(t.depDue)}`),act:'pv-tab',v:'pay'},
        Object.assign(dayK,{act:'pv-tab',v:'trip'}),{lab:L('נוסעים','Travelers'),val:t.pax,sub:dn(t.dest)}]});
    if(st==='sent')steps.push({sev:'todo',tx:L('לעבור על ההצעה ולאשר','Review the proposal and accept it'),sub:L(`מקדמה ${usd(dep$)} אחרי האישור`,`A ${usd(dep$)} deposit follows acceptance`),b:L('לאשר','Accept'),a:'pl-accept',v:t.id});
    if(st==='accepted')steps.push({sev:'ok',tx:L('הסוכן מכין את ההזמנה','Your agent is preparing the booking'),sub:L('לוח התשלומים יופיע כאן','The payment schedule will appear here'),b:L('להודעות','Messages'),a:'pv-tab',v:'msgs'});
    if(st==='draft')steps.push({sev:'ok',tx:L('הסוכן מכין את ההצעה','Your agent is preparing the proposal'),sub:L('יש בקשות או שינויים? כתבו לו/לה','Any requests or changes? Write to your agent'),b:L('להודעות','Messages'),a:'pv-tab',v:'msgs'});
  }
  const a=plAgent(t);
  const stepsCard=`<div class="card hc-card"><div class="hc-h"><h3>${L('מה צריך מכם','What needs you')}</h3><span class="muted small"><bdi>${esc(t.name)}</bdi></span></div>
    <ol class="hc-steps">${steps.map((s,i)=>`<li class="${s.sev}" style="--d:${i*60}ms"><span class="hc-dot"></span><div><b>${s.tx}</b><small class="muted">${s.sub}</small></div><button class="btn sm${i?'':' pri'}" data-act="${s.a}" data-v="${s.v}">${s.b}</button></li>`).join('')}</ol></div>`;
  const agentCard=`<div class="card hc-card pl-agent"><div class="hc-h"><h3>${L('הסוכן שלכם','Your agent')}</h3></div>
    <div class="pl-ag">${avatarOf(L(AGN[t.agent]||a.he,AGE[t.agent]||a.en))}<div><b>${esc(L(a.he,a.en))}</b><div class="muted small">${L('Redbud Group Tours, טולסה','Redbud Group Tours, Tulsa')}</div>
     <div class="small"><bdi>${esc(a.email||'')}</bdi></div><div class="small"><bdi>${esc(a.phone||'')}</bdi></div></div></div>
    <p class="small muted">${L('קו חירום 24/7 בזמן הטיול: 918-555-0100','24/7 line while you travel: 918-555-0100')}</p>
    <button class="hc-more" data-act="pv-tab" data-v="msgs">${L('לשלוח הודעה','Send a message')} ${ic('chev','flip')}</button></div>`;
  return `<div class="hc${PV_ANIM?' anim':''}">${plChips(c,t)}${hero}<div class="hc-grid"><div class="hc-c7">${stepsCard}</div><div class="hc-c5">${agentCard}</div></div></div>`;
}

/* ---------- trip ---------- */
function plTrip(p,c,t){
  const st=plState(t),cn=calc(t),days=pvDays(t),hot=t.room&&t.room.hotel?t.room.hotel:'';
  let prop='';
  if(plIsQ(t)){
    if(st==='draft')prop=`<div class="card hc-card pl-note">${ic('pen')}<div><h3>${L('ההצעה בהכנה','The proposal is being prepared')}</h3><p class="muted">${L(`${plAgentName(t)} עובד/ת על המחיר והפרטים. המסלול למטה הוא טיוטה ועשוי להשתנות.`,`${esc(plAgentName(t))} is working on the price and the details. The itinerary below is a draft and may change.`)}</p></div></div>`;
    else{
      const pp=plPP(t),dep$=r2(cn.rev*t.pct/100),inc=plIncluded(t);
      prop=`<div class="card hc-card pl-prop"><div class="hc-h"><h3>${L('סיכום ההצעה','Proposal summary')}</h3>${st==='sent'?`<span class="hc-pill blue">${L('ממתינה לאישור שלכם','Waiting for you')}</span>`:`<span class="hc-pill green">${L('אושרה','Accepted')}</span>`}</div>
       <div class="pl-price"><div><span class="muted small">${L('מחיר לנוסע','Price per traveler')}</span><b>${usd(pp)}</b></div><div><span class="muted small">${L(`סך הכל ל-${t.pax}`,`Total for ${t.pax}`)}</span><b>${usd(cn.rev)}</b></div><div><span class="muted small">${L(`מקדמה ${t.pct}%`,`Deposit ${t.pct}%`)}</span><b>${usd(dep$)}</b><small class="muted">${L('עד','due')} ${fmtDate(t.depDue)}</small></div></div>
       <h4>${L('כלול במחיר','Included')}</h4><ul class="pl-inc">${inc.map(x=>`<li>${ic('check')} ${x}</li>`).join('')}</ul>
       <div class="pl-act">${st==='sent'?`<button class="hc-btn mint" data-act="pl-accept" data-v="${t.id}">${ic('check')} ${L('אישור ההצעה','Accept proposal')}</button>`:''}
        <button class="btn" data-act="pl-land" aria-pressed="${!!S.plLand}">${ic('link')} ${S.plLand?L('הסתרת דף ההצעה','Hide proposal page'):L('דף ההצעה','Open proposal page')}</button></div>
       <p class="small muted">${L('קישור ציבורי','Public link')}: <code dir="ltr">${esc(typeof prLink==='function'?prLink(t):'')}</code></p>
       ${S.plLand&&typeof prLanding==='function'?`<div class="pl-land">${prLanding(t).replace('data-act="pr-accept"',`data-act="pl-accept" data-v="${t.id}"`)}</div>`:''}</div>`;}
  }
  const ov=`<div class="card hc-card"><div class="hc-h"><h3><bdi>${esc(t.name)}</bdi></h3><span class="muted small">${paxL(t.pax)}</span></div>
    <dl class="pl-facts"><div><dt>${L('תאריכים','Dates')}</dt><dd>${fmtDate(t.dep)} - ${fmtDate(endOf(t))}</dd></div><div><dt>${L('יעד','Destination')}</dt><dd>${dn(t.dest)} · ${L(`${t.nights+1} ימים`,`${t.nights+1} days`)}</dd></div>
     <div><dt>${L('נקודת יציאה','Departure point')}</dt><dd>Redbud Group Tours office, Tulsa · ${pvClock(7*60)}</dd></div>${hot?`<div><dt>${L('מלון','Hotel')}</dt><dd><bdi>${esc(hot)}</bdi></dd></div>`:''}</dl></div>`;
  return `<div class="hc">${plChips(c,t)}${prop}${ov}<div class="pl-days">${days.map(d=>pvDayCard(t,d)).join('')}</div></div>`;
}

/* ---------- pay ---------- */
function plPay(p,c,t){
  const m=plMoney(t);
  if(!m){
    const cn=calc(t),dep$=r2(cn.rev*t.pct/100),st=plState(t);
    return `<div class="hc">${plChips(c,t)}<div class="card hc-card"><div class="hc-h"><h3>${L('לוח תשלומים','Payment schedule')}</h3><span class="muted small">${st==='draft'?L('בהכנה','In preparation'):L('לפי ההצעה','Per the proposal')}</span></div>
     ${st==='draft'?`<p class="muted">${L('לוח התשלומים יופיע כשההצעה תהיה מוכנה.','The payment schedule appears once the proposal is ready.')}</p>`
     :`<div class="scroll"><table class="tbl pl-tbl"><thead><tr><th>${L('תשלום','Payment')}</th><th>${L('עד','Due')}</th><th class="n">${L('סכום','Amount')}</th></tr></thead><tbody>
       <tr><td>${L(`מקדמה ${t.pct}%`,`Deposit ${t.pct}%`)}</td><td>${fmtDate(t.depDue)}</td><td class="n">${usd(dep$,2)}</td></tr>
       <tr><td>${L('יתרה','Balance')}</td><td>${fmtDate(t.balDue)}</td><td class="n">${usd(r2(cn.rev-dep$),2)}</td></tr></tbody>
       <tfoot><tr><td colspan="2">${L('סך הכל','Total')}</td><td class="n">${usd(cn.rev,2)}</td></tr></tfoot></table></div>
      <p class="small muted">${L('התשלום לפי משק בית נפתח אחרי אישור ההזמנה.','Payment by household opens once the booking is confirmed.')}</p>`}</div></div>`;
  }
  const f=S.plFlt||'all',rows=m.rows.filter(r=>f==='open'?r.open>0.005:f==='late'?r.late>0:true);
  const cnt=k=>k==='open'?m.openN:k==='late'?m.lateN:m.rows.length;
  return `<div class="hc">${plChips(c,t)}<div class="card hc-card"><div class="hc-h"><h3>${L('תשלומים לפי משק בית','Payments by household')}</h3><span class="muted small">${L('מחיר לנוסע','Per traveler')} ${usd(m.g.perHead,2)}</span></div>
   <div class="pl-chips pl-flt" role="group" aria-label="${L('סינון','Filter')}">${[['all',L('הכל','All')],['open',L('פתוח','Open')],['late',L('באיחור','Late')]].map(x=>`<button class="pl-chip${f===x[0]?' on':''}" data-act="pl-flt" data-v="${x[0]}" aria-pressed="${f===x[0]}"><b>${x[1]}</b> <small>${cnt(x[0])}</small></button>`).join('')}</div>
   <div class="scroll"><table class="tbl pl-tbl"><thead><tr><th>${L('משק בית','Household')}</th><th class="n">${L('סכום','Amount')}</th><th class="pl-hm">${L('מקדמה / יתרה','Deposit / balance')}</th><th class="n">${L('פתוח','Open')}</th><th>${L('סטטוס','Status')}</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td><b><bdi>${esc(r.name)}</bdi></b><div class="muted small">${r.size===1?L('נוסע אחד','1 traveler'):paxL(r.size)}</div></td><td class="n">${usd(r.amt,2)}</td>
      <td class="small pl-hm">${r.depPaid?ic('check'):ic('clock')} ${L('מקדמה','Deposit')} ${usd(r.dep,2)}<br>${r.balPaid?ic('check'):ic('clock')} ${L('יתרה','Balance')} ${usd(r.bal,2)}</td>
      <td class="n"><b>${usd(r.open,2)}</b></td>
      <td>${plStatusPill(r)}${r.open>0.005?`<div><button class="btn sm pl-rm" data-act="pl-remind" data-v="${esc(r.name)}" ${plRem[t.id+'|'+r.name]?'aria-disabled="true"':''}>${ic('mail')} ${plRem[t.id+'|'+r.name]?L('התזכורת נשלחה','Reminder sent'):L('שליחת תזכורת','Send reminder')}</button></div>`:''}</td></tr>`).join('')||`<tr><td colspan="5" class="muted">${L('אין משקי בית במסנן הזה.','No households in this filter.')}</td></tr>`}</tbody>
    <tfoot><tr><td>${L('כל משקי הבית','All households')} <span class="muted small">(${m.rows.length})</span></td><td class="n">${usd(m.amt,2)}</td><td class="small pl-hm">${L('נגבה','Collected')} ${usd(m.paid,2)}</td><td class="n">${usd(m.open,2)}</td><td>${m.pct}%</td></tr></tfoot></table></div>
   <p class="small muted">${L('תשלומים בכרטיס אשראי נעשים בקישור האישי של כל משק בית. הדגמה: לא מועבר כסף.','Households pay by card through their own link. Demo: no money moves.')}</p></div></div>`;
}

/* ---------- people ---------- */
function plPeople(p,c,t){
  if(plIsQ(t))return `<div class="hc">${plChips(c,t)}${plEmpty('users2',L('רשימת הנוסעים נפתחת אחרי אישור ההזמנה','The traveler list opens once the booking is confirmed'),L('אז תוכלו לראות כאן מי השלים רישום, טופס רפואי וכתב ויתור.','Then you can see here who has finished registration, medical and waiver forms.'))}</div>`;
  const intl=plIntl(t),done=t.trav.filter(plFormsDone).length,f=S.plPf||'all';
  const inc=t.trav.map((x,i)=>({x,i})).filter(z=>f==='all'||!plFormsDone(z.x)||(intl&&z.x.pass==='Missing'));
  const lim=S.plAll?inc.length:12,rows=inc.slice(0,lim);
  return `<div class="hc">${plChips(c,t)}<div class="card hc-card"><div class="hc-h"><h3>${L('נוסעים וטפסים','Travelers and forms')}</h3><span class="hc-pill ${done===t.pax?'green':'blue'}">${L(`${done} מתוך ${t.pax} השלימו`,`${done} of ${t.pax} complete`)}</span></div>
   <div class="pl-chips pl-flt" role="group" aria-label="${L('סינון','Filter')}">${[['all',L('כולם','Everyone'),t.pax],['todo',L('חסר משהו','Needs attention'),inc.length&&f!=='all'?inc.length:t.trav.filter(x=>!plFormsDone(x)||(intl&&x.pass==='Missing')).length]].map(x=>`<button class="pl-chip${f===x[0]?' on':''}" data-act="pl-pf" data-v="${x[0]}" aria-pressed="${f===x[0]}"><b>${x[1]}</b> <small>${x[2]}</small></button>`).join('')}</div>
   <div class="scroll"><table class="tbl pl-tbl"><thead><tr><th>${L('נוסע','Traveler')}</th>${OP_FORMS.map(fm=>`<th>${L(fm[1][0],fm[1][1])}</th>`).join('')}${intl?`<th>${L('דרכון','Passport')}</th>`:''}<th></th></tr></thead>
    <tbody>${rows.map(({x,i})=>{const need=!plFormsDone(x)||(intl&&x.pass==='Missing'),k=t.id+'|t'+i;
      return `<tr><td><b><bdi>${esc(x.n)}</bdi></b><div class="muted small"><bdi>${esc(x.g)}</bdi></div></td>${OP_FORMS.map(fm=>`<td>${plFormPill(x,fm[0])}</td>`).join('')}
      ${intl?`<td>${x.pass==='Missing'?pillF(L('חסר','Missing'),'amber'):opPassWarn(t,x)?pillF(L('תוקף קצר','Check expiry'),'amber'):pillF(`${ic('check')} ${L('התקבל','Received')}`,'green')}</td>`:''}
      <td>${need?`<button class="btn sm pl-rm" data-act="pl-rem-trav" data-v="${t.id}|${i}" ${plRem[k]?'aria-disabled="true"':''}>${ic('mail')} ${plRem[k]?L('נשלח','Sent'):L('תזכורת','Remind')}</button>`:''}</td></tr>`;}).join('')||`<tr><td colspan="${5+(intl?1:0)}" class="muted">${L('כל הנוסעים השלימו הכל.','Everyone has finished everything.')}</td></tr>`}</tbody></table></div>
   ${inc.length>lim?`<button class="hc-more" data-act="pl-all">${L(`ועוד ${inc.length-lim} נוסעים`,`and ${inc.length-lim} more`)} ${ic('chev','flip')}</button>`:S.plAll&&inc.length>12?`<button class="hc-more" data-act="pl-all">${L('פחות','Show fewer')} ${ic('chev','flip')}</button>`:''}
   <p class="small muted">${L('תזכורות נשלחות לנוסעים בדוא"ל (הדגמה).','Reminders go to travelers by email (simulated).')}</p></div></div>`;
}

/* ---------- documents ---------- */
function plDocs(p,c,t){
  const cn=calc(t),st=plState(t),m=plMoney(t);
  const prop=`<div class="card hc-card"><div class="hc-h"><h3>${L('ההצעה','The proposal')}</h3><span class="hc-pill ${st==='accepted'||st==='booked'?'green':'blue'}">${st==='draft'?L('בהכנה','In preparation'):st==='sent'?L('נשלחה','Sent'):L('אושרה','Accepted')}</span></div>
    <p><b><bdi>${esc(t.name)}</bdi></b><br><span class="muted small">${fmtDate(t.dep)} - ${fmtDate(endOf(t))} · ${paxL(t.pax)}${st==='draft'?'':` · ${usd(plPP(t))} ${L('לנוסע','per traveler')}`}</span></p>
    <div class="pl-act"><button class="btn" data-act="pl-print">${ic('printer')} ${L('מסלול להדפסה (PDF)','Itinerary, print as PDF')}</button>${st==='draft'?'':`<button class="btn" data-act="pv-tab" data-v="trip">${ic('document')} ${L('סיכום ההצעה','Proposal summary')}</button>`}</div></div>`;
  let inv='';
  if(m){const docs=incomeDocs(t).docs,lab={deal:L('חשבונית עסקה','Deal invoice'),receipt:L('קבלה','Receipt')},rs=docs.slice(0,8);
    inv=`<div class="card hc-card"><div class="hc-h"><h3>${L('חשבוניות וקבלות','Invoices and receipts')}</h3><span class="muted small">${docs.length}</span></div>
     <div class="scroll"><table class="tbl pl-tbl"><thead><tr><th>${L('משק בית','Household')}</th><th>${L('מסמך','Document')}</th><th>${L('תאריך','Date')}</th><th class="n">${L('סכום','Amount')}</th><th>${L('סטטוס','Status')}</th></tr></thead>
     <tbody>${rs.map(d=>`<tr><td><bdi>${esc(d.name)}</bdi></td><td>${lab[d.type]} <span class="muted small">#${d.no} · ${d.kind==='dep'?L('מקדמה','Deposit'):L('יתרה','Balance')}</span></td><td>${fmtDate(d.date)}</td><td class="n">${usd(d.amt,2)}</td><td>${d.st==='paid'?pillF(L('שולם','Paid'),'green'):pillF(L('ממתין לתשלום','Awaiting payment'),'amber')}</td></tr>`).join('')||`<tr><td colspan="5" class="muted">${L('אין מסמכים עדיין.','No documents yet.')}</td></tr>`}</tbody></table></div>
     ${docs.length>rs.length?`<p class="small muted">${L(`מוצגים ${rs.length} מתוך ${docs.length} מסמכים. השאר אצל הסוכן.`,`Showing ${rs.length} of ${docs.length}. Your agent has the rest.`)}</p>`:''}</div>`;}
  else inv=`<div class="card hc-card"><div class="hc-h"><h3>${L('חשבוניות וקבלות','Invoices and receipts')}</h3></div><p class="muted">${L('חשבוניות מופקות אחרי אישור ההזמנה.','Invoices are issued once the booking is confirmed.')}</p></div>`;
  const waiver=`<div class="card hc-card pl-waiver"><div class="hc-h"><h3>${L('כתב ויתור לדוגמה','Waiver template')}</h3><span class="hc-pill blue">${L('נוסח לדוגמה','Sample')}</span></div>
    <p class="pl-flag">${ic('shield')} ${L('נוסח לדוגמה, יש לבדוק מול יועץ משפטי.','Sample wording, to be reviewed by counsel.')}</p>
    <blockquote>${L(`אני מאשר/ת שהבנתי את מסלול הטיול ואת הסיכונים הכרוכים בנסיעה קבוצתית, ושהמידע הרפואי שמסרתי מדויק. אני מסכים/ה לפעול לפי הנחיות מנהל/ת הקבוצה ומדריך/ת הטיול, ומשחרר/ת את ${AGENCY} מאחריות לאובדן או נזק שלא נגרמו ברשלנות.`,
      `I confirm that I understand the itinerary and the risks of group travel, that the medical information I gave is accurate, and that I will follow the directions of the group leader and tour director. I release ${AGENCY} from liability for loss or injury not caused by its negligence.`)}</blockquote>
    <p class="small muted">${L('כל נוסע חותם בנפרד דרך טופס כתב הוויתור שלו.','Each traveler signs separately through their own waiver form.')}</p></div>`;
  return `<div class="hc">${plChips(c,t)}<div class="hc-grid"><div class="hc-c7">${prop}${inv}</div><div class="hc-c5">${waiver}</div></div></div>`;
}

/* ---------- messages ---------- */
function plMsgs(p,c,t){
  const a=plAgent(t),th=plThread(t).slice().sort((x,y)=>x.at<y.at?-1:x.at>y.at?1:0);
  const bub=m=>{const me=m.from==='leader',tx=m.text!=null?m.text:L(m.he,m.en);
    return `<li class="pl-m ${me?'me':'ag'}">${me?'':avatarOf(L(AGN[t.agent]||a.he,AGE[t.agent]||a.en),'xs')}<div class="pl-b"><div class="pl-bh"><b>${me?esc(p.name):esc(L(a.he,a.en))}</b> <span class="muted small">${fmtDate(m.at)}</span></div><p>${esc(tx)}</p></div></li>`;};
  return `<div class="hc">${plChips(c,t)}<div class="card hc-card"><div class="hc-h"><h3>${L('שיחה עם','Conversation with')} <bdi>${esc(L(a.he,a.en))}</bdi></h3><span class="muted small"><bdi>${esc(t.name)}</bdi></span></div>
   <ul class="pl-thread" aria-live="polite">${th.map(bub).join('')}</ul>
   <form class="pl-compose" data-form="pl-msg" data-v="${t.id}"><label class="sr" for="pl-msg-t">${L('הודעה לסוכן','Message to your agent')}</label>
    <textarea id="pl-msg-t" name="text" rows="3" maxlength="1000" placeholder="${L('כתבו הודעה לסוכן...','Write a message to your agent...')}" required></textarea>
    <div class="pl-cf"><span class="small muted">${L('הסוכן שלכם עונה בדוא"ל.','Your agent replies by email.')}</span><button class="hc-btn mint" type="submit">${ic('mail')} ${L('שליחה','Send')}</button></div></form></div></div>`;
}

/* ---------- registration ---------- */
const PL_TABS=[['home',['בית','Home'],'home'],['trip',['הטיול','Trip'],'plane'],['pay',['תשלומים','Payments'],'wallet'],['people',['נוסעים','Travelers'],'users2'],['docs',['מסמכים','Documents'],'document'],['msgs',['הודעות','Messages'],'mail']];
pvRegister('leader',{role:['ראש/ת קבוצה','Group leader'],label:['פורטל ראש הקבוצה','Group leader portal'],kind:'client',feat:'pleader',
  people:()=>plClients().map(c=>({id:c.id,name:c.contact.name,sub:c.name})),
  def:(()=>{const t=TRIPS.find(x=>x.id==='nas'),c=t&&CLIENTS.find(x=>x.name===t.client);return c?c.id:'';})(),
  tabs:PL_TABS.map(x=>[x[0],x[1][0],x[1][1],x[2]]),
  view:(tab,p)=>{const c=plClientOf(p),t=c&&plTripOf(c);
    if(!c||!t)return plEmpty('users2',L('אין טיולים להצגה','No trips to show'),L('כשיהיה טיול או הצעה ללקוח הזה, הוא יופיע כאן.','When this client has a trip or a proposal, it will show up here.'));
    return {home:plHome,trip:plTrip,pay:plPay,people:plPeople,docs:plDocs,msgs:plMsgs}[tab](p,c,t);}});

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="pl-"]');if(!b||!S.pv||S.pv.k!=='leader')return;
  const a=b.dataset.act,v=b.dataset.v||'',p=pvPerson(),c=plClientOf(p),t=c&&plTripOf(c);
  if(a==='pl-trip'){S.plTrip=v;S.plAll=false;S.plFlt='all';S.plPf='all';S.plLand=false;render();}
  else if(a==='pl-flt'){S.plFlt=v;render();}
  else if(a==='pl-pf'){S.plPf=v;S.plAll=false;render();}
  else if(a==='pl-all'){S.plAll=!S.plAll;render();}
  else if(a==='pl-land'){S.plLand=!S.plLand;render();}
  else if(a==='pl-accept'){plAccept(v);render();}
  else if(a==='pl-remind'&&t){plRemind(t,v);render();}
  else if(a==='pl-rem-trav'&&t){const [tid,i]=v.split('|'),x=t.trav[+String(i)];if(x){plRem[tid+'|t'+i]=1;render();toast(L(`נשלחה תזכורת ל${x.n} (הדגמה)`,`Reminder sent to ${x.n} (simulated)`));}}
  else if(a==='pl-print'){try{window.print();}catch(err){}toast(L('אם חלון ההדפסה לא נפתח כאן, הדפיסו מהקובץ המקומי.','If no print dialog opened here, print from the offline file.'));}
});
document.addEventListener('submit',e=>{const f=e.target;if(!(f&&f.dataset&&f.dataset.form==='pl-msg'))return;e.preventDefault();
  const t=TRIPS.find(x=>x.id===f.dataset.v),ta=f.querySelector('textarea');if(!t||!ta)return;
  if(plSend(t,ta.value)){render();toast(L('ההודעה נשלחה. הסוכן עונה בדוא"ל.','Message sent. Your agent replies by email.'));}});

/* ---------- developer notes ---------- */
if(typeof SPEC!=='undefined'){
  const base={roles:{view:['leader'],act:['leader']},perms:[],status:'roadmap',tests:['TEST pl group leader portal'],code:['v6/s13_pl.js','v6/m_pl.css'],
    api:['GET /v1/portal/{token}/trips (proposed)'],states:{empty:'A client with no non-Lost trip is not listed. A quote has no households, so Pay and Travelers explain what opens after acceptance.',loading:'Not applicable (local data).',error:'A view that throws shows "This screen could not load."'}};
  const put=(tab,o)=>{SPEC['portal:leader:'+tab]=Object.assign({},base,o);};
  put('home',{title:'Group leader portal: home',purpose:'The leader sees how much of the group price is collected, who still owes forms, and the one next step. For a quote it shows the proposal state and, when Sent, an Accept button.',
    data:['CLIENTS[].contact','TRIPS where t.client===c.name and not Lost','groupsCalc(t)','calc(t)','t.trav[].form'],
    actions:[{label:'Accept proposal',does:'Calls prAccept(t): Sent becomes Negotiating, stage stays Quote',rule:'Only for qst Sent; never winQuote'},{label:'Remind unpaid households',does:'Simulated toast, no email sent',rule:'Only when a balance is open'}],
    rules:['Default trip is the nearest upcoming non-Lost trip, else the most recent','Gauge = collected / group price','Draft: no accept, "being prepared"; Negotiating and Approval: "Accepted"']});
  put('trip',{title:'Group leader portal: trip',purpose:'The day-by-day itinerary with clock times, hotel and departure point. For a quote, the proposal summary: price per traveler, deposit, inclusions and the public proposal page.',
    data:['pvDays(t)','t.room.hotel','calc(t).byType','prLanding(t) (preview)'],actions:[{label:'Open proposal page',does:'Shows the public proposal page inline',rule:'Quotes that are not Draft'}],
    rules:['Departure point is a fixed demo placeholder at 7:00 AM','Commissions and margins never appear']});
  put('pay',{title:'Group leader portal: payments',purpose:'Payment status per household with a totals footer that ties to the agency books.',data:['groupsCalc(t).rows','calc(t).rev'],
    actions:[{label:'Send reminder',does:'Simulated toast per household',rule:'Only rows with a balance open'},{label:'Filter',does:'All / Open / Late',rule:'Footer always shows all households'}],
    rules:['Footer amount = group price; collected = sum of paid; open = amount - collected','Quotes show the deposit and balance schedule instead']});
  put('people',{title:'Group leader portal: travelers',purpose:'Which travelers have finished registration, medical and waiver forms, and passports for international trips.',data:['t.trav[].form','t.trav[].pass','opPassWarn(t,x)'],
    actions:[{label:'Remind',does:'Simulated toast per traveler',rule:'Only when something is missing'}],rules:['Complete = all three forms done','Passport column only on international trips','The rooming-preference form has no per-traveler data here']});
  put('docs',{title:'Group leader portal: documents',purpose:'The proposal, the household invoices and receipts, the printable itinerary and a sample waiver.',data:['incomeDocs(t).docs','calc(t)'],
    actions:[{label:'Itinerary, print as PDF',does:'window.print() in a try/catch',rule:'Always'}],rules:['Waiver wording is a sample and says it must be reviewed by counsel','Quote-stage trips have no invoices']});
  put('msgs',{title:'Group leader portal: messages',purpose:'A thread with the trip agent. The seed is deterministic per trip; the leader can add messages.',data:['PVMSG[tripId] (PERSIST pv-msgs)','agn(t.agent)'],
    actions:[{label:'Send',does:'Appends {from:"leader",at,text} to the thread',rule:'Non-empty text, 1000 characters'}],rules:['The agent does not reply automatically; the note says "Your agent replies by email."','Messages live on this laptop only']});
}

/* ---------- tests ---------- */
TESTS.push({name:'pl group leader portal',run:h=>{const out=[];
  const brands=new Set([...CATALOG.hotels.map(x=>x.name),...CATALOG.venues.map(x=>x.name)]);
  const cli=n=>CLIENTS.find(c=>c.name===n),NEG=/unconfirmed|overdue|exposure|\blate\b|risk|query|gap|dispute|overbill/i;
  const cases=[['New Hope Baptist Church','nas'],['Grace Fellowship Church','hl'],['Prairie State Alumni Assn.','can'],['Riverbend Seniors Club','irl'],['Riverbend Seniors Club','nia']];
  const ident=t=>{const c=calc(t);if(Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit)>0.05)out.push('identity '+t.id);};
  if(!pvPerson||!PORTALS.leader)return ['leader portal not registered'];
  if(PORTALS.leader.people().length<8)out.push('few leaders '+PORTALS.leader.people().length);
  const defc=CLI_BY[PORTALS.leader.def];if(!defc||defc.contact.name!=='Rev. Alan Mercer')out.push('default leader '+(defc&&defc.contact.name));
  const guard=(hh,l)=>hh.split(/<div class="card|<section|<tr/).forEach(ch=>{[...brands].forEach(b=>{if(ch.includes('>'+esc(b))||ch.includes(esc(b)+'<')||ch.includes(' '+esc(b)+' ')){if(NEG.test(ch.replace(/<[^>]*>/g,' ').replace(esc(b),'')))out.push('brand next to negative wording '+b+' '+l);}});});
  for(const lang of ['en','he']){S.lang=lang;
    cases.forEach(([cn,tid])=>{const c=cli(cn);if(!c){out.push('no client '+cn);return;}
      PL_TABS.forEach(([tab])=>{pvOpen('leader',c.id,tab);S.plTrip=tid;S.plFlt='all';S.plPf='all';S.plAll=false;S.plLand=false;
        try{render();const hh=h.els.app.innerHTML,l=`pl ${tid} ${tab} ${lang}`;h.chk(hh,l);if(lang==='en')h.scan(hh,'pl '+tab);guard(hh,l);
          if(hh.includes('class="side"'))out.push('agency sidebar '+l);
          const t=TRIPS.find(x=>x.id===tid),st=plState(t);
          if(tab==='home'){const acc=hh.includes('data-act="pl-accept"');
            if(st==='sent'&&!acc)out.push('no accept for Sent '+tid);if(st!=='sent'&&acc)out.push('accept offered in '+st+' '+tid);
            if(st==='draft'&&lang==='en'&&!/being|preparing/i.test(hh))out.push('draft not "preparing"');
            if(st==='accepted'&&lang==='en'&&!/Accepted/.test(hh))out.push('accepted state missing '+tid);}
          if(tab==='docs'&&lang==='en'&&!/reviewed by counsel/.test(hh))out.push('waiver flag missing');
          if(tab==='msgs'&&!hh.includes('data-form="pl-msg"'))out.push('compose missing');
        }catch(e){out.push(`pl ${tid} ${tab} ${lang} threw ${e.message}`);}});});}
  S.lang='en';
  /* the trip chips: Riverbend has two trips, the default is the nearest upcoming one */
  {const c=cli('Riverbend Seniors Club');S.plTrip='';const t=plTripOf(c),ts=plTrips(c);if(ts.length<2||t.id!=='nia')out.push('default trip '+t.id);
   pvOpen('leader',c.id,'home');render();if(!h.els.app.innerHTML.includes('pl-chips'))out.push('no trip chips');}
  /* pay totals equal groupsCalc, in the markup and in the model */
  ['nas','nia'].forEach(tid=>{const t=TRIPS.find(x=>x.id===tid),c=cli(t.client),m=plMoney(t),g=groupsCalc(t),cn=calc(t);
    if(Math.abs(m.amt-cn.rev)>0.01||Math.abs(m.paid-g.collected)>0.01||Math.abs(m.open-g.outstanding)>0.01)out.push('pay totals '+tid);
    if(m.paidN+m.openN!==g.rows.length)out.push('paid+open '+tid);
    pvOpen('leader',c.id,'pay');S.plTrip=tid;S.plFlt='all';render();const hh=h.els.app.innerHTML;
    [usd(cn.rev,2),usd(g.collected,2),usd(g.outstanding,2)].forEach(s=>{if(!hh.includes(s))out.push('pay footer lacks '+s+' '+tid);});
    S.plFlt='late';render();const nl=(h.els.app.innerHTML.match(/class="btn sm pl-rm"/g)||[]).length;if(nl!==m.lateN)out.push(`late filter ${tid} ${nl} vs ${m.lateN}`);S.plFlt='all';
    /* the hero gauge is the collected share */
    pvOpen('leader',c.id,'home');S.plTrip=tid;render();if(!h.els.app.innerHTML.includes(`<b>${m.pct}%</b>`))out.push('gauge pct '+tid);});
  /* messages: deterministic seed, compose appends, persistence round trip */
  {const t=TRIPS.find(x=>x.id==='nas'),a=JSON.stringify(plSeed(t)),b=JSON.stringify(plSeed(t));if(a!==b)out.push('seed not deterministic');
   const n=plSeed(t).length;if(n<3||n>5)out.push('seed size '+n);
   PVMSG={};const n0=plThread(t).length;plSend(t,'We will <b>send</b> the rooming list');if(plThread(t).length!==n0+1)out.push('send did not append');
   pvOpen('leader',defc.id,'msgs');S.plTrip='nas';render();if(!h.els.app.innerHTML.includes('We will &lt;b&gt;send&lt;/b&gt; the rooming list'))out.push('sent text not shown escaped');
   const pe=PERSIST.find(x=>x.key==='pv-msgs'),snap=pe.get();PVMSG={};pe.set(snap);if(plThread(t).length!==n0+1)out.push('persist round trip');pe.reset();if(Object.keys(PVMSG).length)out.push('reset did not clear');
   if(plSend(t,'   '))out.push('blank message accepted');}
  /* accept: Sent moves to Negotiating, stays in Quote, identity holds; Draft and Negotiating refuse */
  {const can=TRIPS.find(x=>x.id==='can'),hl=TRIPS.find(x=>x.id==='hl'),irl=TRIPS.find(x=>x.id==='irl');
   if(plAccept('hl')||hl.qst!=='Draft')out.push('draft accepted');if(plAccept('irl')||irl.qst!=='Negotiating')out.push('negotiating re-accepted');
   const rev0=calc(can).rev;
   if(!plAccept('can'))out.push('accept refused');if(can.qst!=='Negotiating'||can.stage!=='Quote')out.push('accept result '+can.qst+' '+can.stage);
   if(Math.abs(calc(can).rev-rev0)>0.005)out.push('accept changed revenue');
   TRIPS.forEach(ident);
   pvOpen('leader',cli('Prairie State Alumni Assn.').id,'home');S.plTrip='can';render();if(h.els.app.innerHTML.includes('data-act="pl-accept"'))out.push('accept still offered after accepting');}
  return out;}});
