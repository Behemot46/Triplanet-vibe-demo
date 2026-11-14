/* ---------- meeting mode: the 3-minute booth story (v7) ----------
   Presenter drives with the arrow keys (or the buttons). Easy process first (studio),
   then high value (leaks, invoices, dispute, Maya), then the close. R restarts with clean data. */
let MEET_T0=0,MEET_TICK=null,MEET_LAST_SCROLL=-1;
const meetPreset=()=>{S.gen={...G0(),dest:'Nashville',seg:'Faith',pax:44,nights:4,tier:4,pace:'classic',built:false};};
const MEET_ALL=[
  {id:'studio',sel:'#st-right',go:()=>{S.tab='studio';meetPreset();setTimeout(()=>{if(meetIs('studio')&&S.gen&&!S.gen.built&&S.genBusy==null)genRun();},700);},
   tx:()=>[L('טיול שלם בתוך שניות','A whole trip in seconds'),L('קבוצת כנסייה, 44 נוסעים, ארבעה לילות בנאשוויל. טריפלאנט בונה מסלול יום אחר יום עם מלונות ואטרקציות אמיתיים, ומתמחרת כל שורה.','A church group, 44 travelers, four nights in Nashville. Triplanet builds the day-by-day route with real hotels and attractions, and prices every line.')]},
  {id:'swap',sel:'.st-hotels',go:()=>{S.tab='studio';if(!S.gen)meetPreset();S.gen.built=true;S.genBusy=null;const hs=catHotels(S.gen.dest);const cur=pickHotel(S.gen);const alt=hs.find(h=>!cur||h.id!==cur.id&&h.stars>=4)||hs.at(1);if(alt)S.gen.hotel=alt.id;},
   tx:()=>{const P=genPlan(S.gen||G0());return [L('מחליפים מלון, המחיר מתעדכן','Swap the hotel, the price follows'),L(`${P.hotel?P.hotel.name:''}: ${usd(P.pp)} לנוסע, ${pct(P.margin)} רווח מתוכנן. כל שינוי מתומחר מחדש מיד, מול קו הרווח שלכם.`,`${P.hotel?P.hotel.name:''}: ${usd(P.pp)} per traveler at a ${pct(P.margin)} planned margin. Every change re-prices instantly against your margin line.`)];}},
  {id:'quote',sel:'.stats',go:()=>{if(!S.gen)meetPreset();S.gen.built=true;genCreate();},
   tx:()=>[L('לחיצה אחת, הצעת מחיר אמיתית','One click, a real quote'),L('התוכנית הופכת להצעה רגילה: שורות עלות, מרקאפ לפי סוג שירות, מסלול והצעה ממותגת ללקוח.','The plan becomes an ordinary quote: cost lines, markup by service type, the itinerary and a branded proposal.')]},
  {id:'books',sel:'.ac-head,.ac-busy',go:()=>{S.tab='books';const x=A();if(x.phase==='idle')setTimeout(()=>{if(meetIs('books')&&A().phase==='idle')acConnect(S.lang==='he'?'priority':'qbo');},600);},
   tx:()=>{const k=A().sys||(S.lang==='he'?'priority':'qbo');return [L('מחברים את הנהלת החשבונות','Connect your books'),L(`${an(k,'short')} מחובר בלחיצה. טריפלאנט מייבאת את חשבוניות הספקים, מתייגת כל טיול ומתאימה כל שורה להצעה. בעברית: פריוריטי וחשבשבת, באנגלית: QuickBooks ו-Xero.`,`${an(k,'short')} connects in one click. Triplanet imports supplier bills, tags every trip and matches each line to the quote. QuickBooks and Xero in English; Priority and Hashavshevet in Hebrew.`)];}},
  {id:'leaks',sel:'.lk-hero',top:true,go:()=>{S.tab='leaks';S.lkSel='';S.lkDim='trip';},
   tx:()=>{const M=leakModel(visibleTrips());return [L('ואחרי הטיול: לאן הלך הרווח?','After the trip: where did the profit go?'),L(`בעונה הזו דלפו ${usd(M.leak)} מהרווח המתוכנן. ${usd(M.rec)} עוד ניתנים להחזרה. אותה תמונה לפי טיול, סוכן, סוג קבוצה וספק.`,`This season ${usd(M.leak)} of planned profit leaked, and ${usd(M.rec)} can still be recovered. The same view by trip, agent, group type and supplier.`)];}},
  {id:'inbox',sel:'#inbox,.gaps',top:true,go:()=>{openTrip('nen','tfin');setTimeout(()=>{const t=byId('nen');if(meetIs('inbox')&&t&&t.inbox.length&&!S.reading)startReading(t);},600);},
   tx:()=>[L('שש חשבוניות חדשות, נקראות בשניות','Six new invoices, read in seconds'),L('קבוצת ניו אינגלנד חזרה. טריפלאנט קוראת כל חשבונית ספק ומתאימה כל שורה למה שתומחר.','The New England group is home. Triplanet reads every supplier invoice and matches each line to what was quoted.')]},
  {id:'dispute',sel:'.disp',go:()=>{const t=byId('nen');if(t&&(t.inbox.length||S.reading)){const n=(S.reading&&S.reading.n)||t.inbox.length;S.reading=null;applyInbox(t);S.lastMatch.nen=matchSummary(t,n||6);}openTrip('nen','tfin');S.disp='nen|1';setTimeout(()=>{const e=document.querySelector&&document.querySelector('.disp');if(e&&e.scrollIntoView)e.scrollIntoView({block:'center'});},120);},
   tx:()=>{const t=byId('nen'),g=t?tripGaps(t).filter(x=>x.usd>0&&x.s.k==='gap'):[],a=r2(g.reduce((s,x)=>s+x.usd,0));return [L('לחיצה אחת מנסחת את דרישת הזיכוי','One click drafts the dispute'),L(`${g.length} פערים בסך ${usd(a)} בטיול אחד. המייל לספק כבר כתוב, עם המספרים מהחוזה ומרשימת החדרים.`,`${g.length} gap${(g.length)===1?'':'s'} worth ${usd(a)} on one trip. The email to the supplier is already written, with the numbers from the contract and the rooming list.`)];}},
  {id:'maya',sel:'.chat',go:()=>{S.tab='ai';S.chat=[];askQ(QS[1]);},
   tx:()=>[L('שואלים את מאיה','Ask Maya'),L(`מאיה עונה מהנתונים של הסוכנות. ${QS.length} שאלות מוכנות על פערים, רווחיות, תשלומים ומשימות.`,`Maya answers from the agency's own data: ${QS.length} ready questions on gaps, margins, payments and tasks.`)]},
  {id:'close',sel:'',close:true,go:()=>{S.tab='leaks';},
   tx:()=>[L('בדיקת דליפות חינם','A free leak audit'),L('שלחו 90 יום של חשבוניות ספקים. נחזיר לכם את מפת הדליפות.','Send 90 days of supplier bills. We send back your leak map.')]},
  {id:'ops',sel:'.ogrid',go:()=>{openTrip('bra','odash');},
   tx:()=>[L('מהצעה לתפעול, בלי להקליד מחדש','From quote to operations, with no re-typing'),L('אותו תיק עובר מהצעה לתפעול: ימים ליציאה, משימות דחופות, ספקים שעוד לא אישרו. הכל מהשורות שכבר תומחרו.','The same file moves from quotation to operation: days to departure, urgent tasks, suppliers not yet confirmed. All from the lines already priced.')]},
  {id:'numbers',sel:'.yn',top:true,go:()=>{S.tab='leaks';S.lkSel='';S.lkDim='trip';},
   tx:()=>[L('ובסוכנות שלכם?','And at your agency?'),L('מקלידים טיולים בשנה והכנסה ממוצעת לטיול, ורואים טווח דליפה להמחשה. הבדיקה החינמית מחליפה אותו במספרים שלכם.','Type trips per year and average revenue per trip to see an illustrative leak range. The free audit replaces it with your own numbers.')]},
  {id:'fin',sel:'.stats',go:()=>{openTrip('nen','fdash');},
   tx:()=>{const t=byId('nen'),c=t?calc(t):{planProfit:0,fcProfit:0,rev:1};return [L('דוח רווח והפסד לטיול, חי','A live P&L for every trip'),L(`ניו אינגלנד: רווח מתוכנן ${usd(c.planProfit)}, צפוי ${usd(c.fcProfit)}. גבייה, תשלומים לספקים ופערים פתוחים באותו מסך.`,`New England: planned profit ${usd(c.planProfit)}, expected ${usd(c.fcProfit)}. Collections, supplier payments and open gaps on one screen.`)];}},
  {id:'status',sel:'.rm-grid',go:()=>{S.tab='status';},
   tx:()=>[L('מה זמין היום','What is live today'),L('כל מה שראיתם, ואיפה הוא עומד: במוצר, בפיילוט או בתכנון.','Everything you saw, and where it stands: in the product, in pilot or on the roadmap.')]}
];
/* three cuts of the same story: 60 seconds, 3 minutes, 10 minutes */
const MEET_CUTS={1:['leaks','inbox','dispute','close'],3:['studio','swap','quote','books','leaks','inbox','dispute','maya','close'],10:['studio','swap','quote','ops','books','leaks','numbers','inbox','dispute','fin','maya','status','close']};
const MEET=[];let MEET_CUT=3;
function meetSetCut(c){MEET_CUT=MEET_CUTS[c]?+c:3;MEET.splice(0,MEET.length,...MEET_CUTS[MEET_CUT].map(id=>MEET_ALL.find(b=>b.id===id)));}
meetSetCut(3);
const meetIs=id=>S.meet>=0&&!!MEET[S.meet]&&MEET[S.meet].id===id;
const meetLen=()=>MEET_CUT===10?'10:00':MEET_CUT===1?'1:00':'3:00';
function meetGo(i){MEET_LAST_SCROLL=-1;
  S.meet=Math.max(0,Math.min(MEET.length-1,i));S.menu=false;S.chen=false;S.tour=-1;S.pv=null;
  MEET[S.meet].go();window.scrollTo(0,0);render();
}
function meetStart(c){if(c)meetSetCut(c);resetDemo();S.meet=0;MEET_T0=Date.now();clearInterval(MEET_TICK);MEET_TICK=setInterval(meetClock,1000);meetGo(0);}
function meetEnd(){S.meet=-1;clearInterval(MEET_TICK);render();}
function meetClock(){const el=document.getElementById('meetclock');if(!el||S.meet<0)return;const s=Math.floor((Date.now()-MEET_T0)/1000);el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} / ${meetLen()}`;}
function closingHtml(){
  const M=leakModel(visibleTrips()),t=byId('nen'),g=t?tripGaps(t).filter(x=>x.usd>0&&x.s.k==='gap'):[],a=r2(g.reduce((s,x)=>s+x.usd,0));
  const tg=x=>r2(tripGaps(x).filter(y=>y.usd>0&&y.s.k==='gap').reduce((s,y)=>s+y.usd,0)),a1=a>0?a:Math.max(0,...visibleTrips().map(tg));
  const nh=HAS_CAT()?CATALOG.hotels.length:0,nf=HAS_CAT()?new Set(CATALOG.hotels.map(h=>h.family)).size:0;
  return `<div class="closing" role="dialog" aria-label="${L('סיכום','Summary')}"><div class="in">
   <div class="eyebrow"><img src="${TP_LOGO}" alt="Triplanet" width="150" height="34"></div><h1>${L('מצאו את הכסף שהספקים חייבים לכם','Find the money your suppliers owe you')}</h1>
   <p class="lead">${L('שלחו 90 יום של חשבוניות ספקים. נחזיר לכם מפת דליפות לפי טיול, סוכן וספק, בחינם.','Send us 90 days of supplier bills. We send back your leak map by trip, agent and supplier, free.')}</p>
   <div class="pts"><div><b>${usd(a1)}</b>${L('נמצאו בטיול אחד, תוך שניות','found on one trip, in seconds')}</div><div><b>${pct(M.pp?M.leak/M.pp:0)}</b>${L('מהרווח המתוכנן דלף העונה','of planned profit leaked this season')}</div><div><b>${nh}</b>${L(`מלונות מ-${nf} רשתות, מוכנים בסטודיו`,`hotels from ${nf} brands, ready in the studio`)}</div></div>
   <form class="leadf" data-form="lead"><input name="name" type="text" required placeholder="${L('שם','Name')}" aria-label="${L('שם','Name')}"><input name="agency" type="text" placeholder="${L('סוכנות','Agency')}" aria-label="${L('סוכנות','Agency')}"><input name="email" type="text" inputmode="email" required placeholder="${L('אימייל','Email')}" aria-label="${L('אימייל','Email')}">
    <select name="sys" aria-label="${L('מערכת הנהלת חשבונות','Accounting system')}">${acctOrder().map(k=>`<option value="${k}">${an(k,'short')}</option>`).join('')}<option value="other">${L('אחר','Other')}</option></select><button class="btn" type="submit">${L('אני רוצה בדיקה','I want the audit')}</button></form>
   <p class="fine">${L('נתוני הסוכנות בדמו פיקטיביים. שמות המלונות והאטרקציות אמיתיים, התעריפים להמחשה. החיבורים לפריוריטי, לחשבשבת, ל-<bdi>QuickBooks</bdi> ול-<bdi>Xero</bdi> בפיילוט.','The agency data in this demo is fictional. Hotel and venue names are real; rates are illustrative. QuickBooks, Xero, Priority and Hashavshevet connections are in pilot.')}</p></div></div>`;
}
function meetBar(){
  const st=MEET[S.meet],[ti,tx]=st.tx(),last=S.meet===MEET.length-1;
  return `<div class="meet" role="dialog" aria-label="${L('מצב פגישה','Meeting mode')}" dir="${S.lang==='en'?'ltr':'rtl'}"><div class="top"><div class="dots">${MEET.map((m,i)=>`<i class="${i===S.meet?'on':i<S.meet?'done':''}"></i>`).join('')}</div><span class="small" style="color:#B7D4F2" dir="ltr">${S.meet+1} / ${MEET.length}</span><span class="cuts" role="group" aria-label="${L('אורך הפגישה','Meeting length')}">${[1,3,10].map(c=>`<button class="${MEET_CUT===c?'on':''}" data-act="meetcut" data-v="${c}" aria-pressed="${MEET_CUT===c}">${c} ${L('דק׳','min')}</button>`).join('')}</span><span class="clock" id="meetclock" dir="ltr"></span></div>
   <h3>${ti}</h3><p>${tx}</p>
   <div class="ctl"><button class="btn" data-act="meetprev" ${S.meet===0?'disabled':''}>${ic('left','flip')} ${L('הקודם','Back')}</button><button class="btn pri" data-act="${last?'meetend':'meetnext'}">${last?L('סיום','Finish'):L('הבא','Next')} ${ic('right','flip')}</button><button class="btn" data-act="meetstart">${ic('restart')} ${L('מההתחלה','Restart')}</button><button class="btn" data-act="meetend">${ic('x')}</button><span class="keys">${L('חיצים: מעבר · 1/3/0: אורך · R: מההתחלה · Esc: יציאה','Arrows: move · 1/3/0: length · R: restart · Esc: exit')}</span></div></div>`;
}
function meetAfter(){
  if(!document.body||!document.createElement)return;
  let bar=document.getElementById('meetbar');
  if(!(S.meet>=0)){if(bar)bar.remove();document.body.classList.remove('meet-on');return;}
  if(!bar){bar=document.createElement('div');bar.id='meetbar';document.body.appendChild(bar);}
  const st=MEET[S.meet];
  const html=trHtml((st.close?closingHtml():'')+meetBar());if(bar._h!==html){bar.innerHTML=html;bar._h=html;}document.body.classList.add('meet-on');meetClock();
  if(st.sel){const el=document.querySelector(st.sel);if(el&&el.classList){el.classList.add('thl');try{const r=el.getBoundingClientRect(),key=S.meet+':'+Math.round(r.height/24);if(key!==MEET_LAST_SCROLL){MEET_LAST_SCROLL=key;const room=window.innerHeight-bar.offsetHeight-40;if(st.top?r.top>90:(r.top<80||r.bottom>room))window.scrollBy({top:r.top-(!st.top&&r.height<room-80?Math.max(80,(room-r.height)/2):84),behavior:'auto'});}}catch(e){}}}
}
/* topbar button: inject next to the guided tour button after each render */
function meetButton(){
  if(!document.querySelector)return;const tb=document.querySelector('.tourbtn');if(!tb||document.querySelector('[data-act="meet"]'))return;
  const b=document.createElement('button');b.className='btn sm tourbtn meetbtn';b.dataset.act='meet';b.title=trHe(L('מצב פגישה','Meeting mode'));b.innerHTML=ic('present')+' '+trHe(L('מצב פגישה (3 דק׳)','Meeting mode (3 min)'));tb.insertAdjacentElement('afterend',b);
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='meet'||a==='meetstart')meetStart();
  else if(a==='meetnext')meetGo(S.meet+1);
  else if(a==='meetprev')meetGo(S.meet-1);
  else if(a==='meetend')meetEnd();
  else if(a==='meetcut')meetStart(+b.dataset.v);
});
document.addEventListener('keydown',e=>{
  if(!(S.meet>=0))return;const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA')return;
  const fwd=S.lang==='en'?'ArrowRight':'ArrowLeft',back=S.lang==='en'?'ArrowLeft':'ArrowRight';
  if(e.key===fwd||e.key===' '||e.key==='PageDown'){e.preventDefault();if(S.meet<MEET.length-1)meetGo(S.meet+1);}
  else if(e.key===back||e.key==='PageUp'){e.preventDefault();meetGo(S.meet-1);}
  else if(e.key==='Escape')meetEnd();
  else if(e.key==='r'||e.key==='R')meetStart();
  else if(e.key==='1'||e.key==='3')meetStart(+e.key);
  else if(e.key==='0')meetStart(10);
});

/* booth lead capture: stored on this laptop only, exported from the settings menu */
const LEADS_KEY='triplanet-booth-leads';
const leadsGet=()=>{try{return JSON.parse(localStorage.getItem(LEADS_KEY)||'[]');}catch(e){return [];}};
document.addEventListener('submit',e=>{const f=e.target;if(!(f.dataset&&f.dataset.form==='lead'))return;e.preventDefault();
  const d=Object.fromEntries(new FormData(f).entries());if(!d.name||!d.email)return;
  const all=leadsGet();all.push({at:new Date().toISOString(),name:d.name,agency:d.agency||'',email:d.email,system:d.sys,lang:S.lang});
  try{localStorage.setItem(LEADS_KEY,JSON.stringify(all));toast(L('נשמר במחשב הזה. נחזור אליכם עם פרטי הבדיקה.','Saved on this laptop. We will follow up with the audit details.'));f.reset();}
  catch(err){toast(L('השמירה נכשלה. רשמו את הפרטים ידנית.','Could not save. Please write the details down.'));}});
function leadsMenu(){
  if(!document.querySelector)return;const m=document.querySelector('.menu');if(!m||m.querySelector('[data-act="leadsx"]'))return;
  const n=leadsGet().length,b=document.createElement('button');b.setAttribute('role','menuitem');b.dataset.act='leadsx';
  b.innerHTML=ic('export')+' '+trHe(L(`ייצוא לידים מהביתן (${n})`,`Export booth leads (${n})`));m.insertBefore(b,m.querySelector('[data-act="reset"]'));
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="leadsx"]');if(!b)return;
  const rows=leadsGet();if(!rows.length){toast(L('אין עדיין לידים.','No leads yet.'));return;}
  const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"',csv=['at,name,agency,email,system,lang',...rows.map(r=>[r.at,r.name,r.agency,r.email,r.system,r.lang].map(q).join(','))].join('\n');
  saveFile('triplanet-booth-leads.csv',csv,'text/csv;charset=utf-8').then(r=>{if(r==='saved')toast(L(`${rows.length} לידים יוצאו`,`${rows.length} leads exported`));else saveToast(r);});});

/* booth kiosk: after 4 idle minutes, warn for 15 seconds, then reset to a clean Home.
   Any key, click or touch cancels. Booth leads are kept. */
const IDLE_MS=240000,IDLE_WARN=15;let IDLE_AT=Date.now(),IDLE_LEFT=0;
function idleBump(){IDLE_AT=Date.now();if(IDLE_LEFT){IDLE_LEFT=0;const el=document.getElementById('idlewarn');if(el)el.remove();}}
['pointerdown','keydown','wheel','touchstart'].forEach(ev=>document.addEventListener(ev,idleBump,{passive:true,capture:true}));
if(typeof setInterval==='function'&&document.body)setInterval(()=>{
  if(Date.now()-IDLE_AT<IDLE_MS||document.getElementById('attract'))return;
  if(!IDLE_LEFT)IDLE_LEFT=IDLE_WARN+1;IDLE_LEFT--;
  let el=document.getElementById('idlewarn');
  if(IDLE_LEFT>0){if(!el){el=document.createElement('div');el.id='idlewarn';el.setAttribute('role','status');document.body.appendChild(el);}
    el.innerHTML=trHe(L(`הדמו יתאפס בעוד ${IDLE_LEFT} שניות. נגיעה כלשהי תעצור.`,`The demo resets in ${IDLE_LEFT} s. Touch anything to keep it.`));return;}
  if(el)el.remove();IDLE_AT=Date.now();clearInterval(MEET_TICK);resetDemo();S.tab='home';window.scrollTo(0,0);render();attractShow();
},1000);

/* attract screen: the HyperFrames booth loop, full screen and muted, after an idle reset or from the menu.
   Any touch, click or key closes it and leaves a clean Home. */
function attractShow(){
  if(typeof BOOTH_VIDEO==='undefined'||!document.body||document.getElementById('attract'))return;
  const d=document.createElement('div');d.id='attract';d.setAttribute('role','dialog');d.setAttribute('aria-label',trHe(L('סרטון הדגמה','Booth video')));
  d.innerHTML=`<video src="${BOOTH_VIDEO}" autoplay muted loop playsinline aria-hidden="true"></video><div class="at-cta">${trHe(L('נגעו במסך כדי להתחיל','Touch anywhere to start'))}</div>`;
  document.body.appendChild(d);const v=d.querySelector('video');try{const p=v.play();if(p&&p.catch)p.catch(()=>{});}catch(e){}
  const close=ev=>{ev.preventDefault();ev.stopPropagation();d.remove();['pointerdown','keydown'].forEach(t=>document.removeEventListener(t,close,true));idleBump();};
  setTimeout(()=>['pointerdown','keydown'].forEach(t=>document.addEventListener(t,close,true)),300);
}
function attractMenu(){
  if(!document.querySelector||typeof BOOTH_VIDEO==='undefined')return;const m=document.querySelector('.menu');if(!m||m.querySelector('[data-act="attract"]'))return;
  const b=document.createElement('button');b.setAttribute('role','menuitem');b.dataset.act='attract';b.innerHTML=ic('play')+' '+trHe(L('הפעלת סרטון הביתן','Play booth video'));
  m.insertBefore(b,m.querySelector('[data-act="reset"]'));
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="attract"]');if(!b)return;S.menu=false;render();setTimeout(attractShow,50);});
{const r0=render;render=function(){r0();try{attractMenu();}catch(e){}};}
