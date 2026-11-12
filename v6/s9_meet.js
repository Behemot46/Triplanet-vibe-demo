/* ---------- meeting mode: the 3-minute booth story (v7) ----------
   Presenter drives with the arrow keys (or the buttons). Easy process first (studio),
   then high value (leaks, invoices, dispute, Maya), then the close. R restarts with clean data. */
let MEET_T0=0,MEET_TICK=null,MEET_LAST_SCROLL=-1;
const meetPreset=()=>{S.gen={...G0(),dest:'Nashville',seg:'Faith',pax:44,nights:4,tier:4,pace:'classic',built:false};};
const MEET=[
  {sel:'.st-form',go:()=>{S.tab='studio';meetPreset();setTimeout(()=>{if(S.meet===0&&S.gen&&!S.gen.built&&S.genBusy==null)genRun();},700);},
   tx:()=>[L('טיול שלם בתוך שניות','A whole trip in seconds'),L('קבוצת כנסייה, 44 נוסעים, ארבעה לילות בנאשוויל. טריפלאנט בונה מסלול יום אחר יום עם מלונות ואטרקציות אמיתיים, ומתמחרת כל שורה.','A church group, 44 travelers, four nights in Nashville. Triplanet builds the day-by-day route with real hotels and attractions, and prices every line.')]},
  {sel:'.st-hotels',go:()=>{S.tab='studio';if(!S.gen)meetPreset();S.gen.built=true;S.genBusy=null;const hs=catHotels(S.gen.dest);const cur=pickHotel(S.gen);const alt=hs.find(h=>!cur||h.id!==cur.id&&h.stars>=4)||hs.at(1);if(alt)S.gen.hotel=alt.id;},
   tx:()=>{const P=genPlan(S.gen||G0());return [L('מחליפים מלון, המחיר מתעדכן','Swap the hotel, the price follows'),L(`${P.hotel?P.hotel.name:''}: ${usd(P.pp)} לנוסע, ${pct(P.margin)} רווח מתוכנן. כל שינוי מתומחר מחדש מיד, מול קו הרווח שלכם.`,`${P.hotel?P.hotel.name:''}: ${usd(P.pp)} per traveler at a ${pct(P.margin)} planned margin. Every change re-prices instantly against your margin line.`)];}},
  {sel:'.stats',go:()=>{if(!S.gen)meetPreset();S.gen.built=true;genCreate();},
   tx:()=>[L('לחיצה אחת, הצעת מחיר אמיתית','One click, a real quote'),L('התוכנית הופכת להצעה רגילה: שורות עלות, מרקאפ לפי סוג שירות, מסלול והצעה ממותגת ללקוח.','The plan becomes an ordinary quote: cost lines, markup by service type, the itinerary and a branded proposal.')]},
  {sel:'.lk-hero',go:()=>{S.tab='leaks';S.lkSel='';S.lkDim='trip';},
   tx:()=>{const M=leakModel(visibleTrips());return [L('ואחרי הטיול: לאן הלך הרווח?','After the trip: where did the profit go?'),L(`בעונה הזו דלפו ${usd(M.leak)} מהרווח המתוכנן. ${usd(M.rec)} עוד ניתנים להחזרה. אותה תמונה לפי טיול, סוכן, סוג קבוצה וספק.`,`This season ${usd(M.leak)} of planned profit leaked, and ${usd(M.rec)} can still be recovered. The same view by trip, agent, group type and supplier.`)];}},
  {sel:'#inbox,.gaps',go:()=>{openTrip('nen','tfin');setTimeout(()=>{const t=byId('nen');if(S.meet===4&&t&&t.inbox.length&&!S.reading)startReading(t);},600);},
   tx:()=>[L('שש חשבוניות, נקראות בשניות','Six invoices, read in seconds'),L('קבוצת ניו אינגלנד חזרה. טריפלאנט קוראת כל חשבונית ספק ומתאימה כל שורה למה שתומחר.','The New England group is home. Triplanet reads every supplier invoice and matches each line to what was quoted.')]},
  {sel:'.disp',go:()=>{const t=byId('nen');if(t&&(t.inbox.length||S.reading)){const n=(S.reading&&S.reading.n)||t.inbox.length;S.reading=null;applyInbox(t);S.lastMatch.nen=matchSummary(t,n||6);}openTrip('nen','tfin');S.disp='nen|1';setTimeout(()=>{const e=document.querySelector&&document.querySelector('.disp');if(e&&e.scrollIntoView)e.scrollIntoView({block:'center'});},120);},
   tx:()=>{const t=byId('nen'),g=t?tripGaps(t).filter(x=>x.usd>0&&x.s.k==='gap'):[],a=r2(g.reduce((s,x)=>s+x.usd,0));return [L('לחיצה אחת מנסחת את דרישת הזיכוי','One click drafts the dispute'),L(`${g.length} פערים בסך ${usd(a)} בטיול אחד. המייל לספק כבר כתוב, עם המספרים מהחוזה ומרשימת החדרים.`,`${g.length} gaps worth ${usd(a)} on one trip. The email to the supplier is already written, with the numbers from the contract and the rooming list.`)];}},
  {sel:'.chat',go:()=>{S.tab='ai';S.chat=[];askQ(QS[1]);},
   tx:()=>[L('שואלים את מאיה','Ask Maya'),L('מאיה עונה מהנתונים של הסוכנות. 25 שאלות מוכנות על פערים, רווחיות, תשלומים ומשימות.','Maya answers from the agency\'s own data: 25 ready questions on gaps, margins, payments and tasks.')]},
  {sel:'',close:true,go:()=>{S.tab='leaks';},
   tx:()=>[L('בדיקת דליפות חינם','A free leak audit'),L('שלחו 90 יום של חשבוניות ספקים. נחזיר לכם את מפת הדליפות.','Send 90 days of supplier bills. We send back your leak map.')]}
];
function meetGo(i){MEET_LAST_SCROLL=-1;
  S.meet=Math.max(0,Math.min(MEET.length-1,i));S.menu=false;S.chen=false;S.tour=-1;
  MEET[S.meet].go();window.scrollTo(0,0);render();
}
function meetStart(){resetDemo();S.meet=0;MEET_T0=Date.now();clearInterval(MEET_TICK);MEET_TICK=setInterval(meetClock,1000);meetGo(0);}
function meetEnd(){S.meet=-1;clearInterval(MEET_TICK);render();}
function meetClock(){const el=document.getElementById('meetclock');if(!el||S.meet<0)return;const s=Math.floor((Date.now()-MEET_T0)/1000);el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} / 3:00`;}
function closingHtml(){
  const M=leakModel(visibleTrips()),t=byId('nen'),g=t?tripGaps(t).filter(x=>x.usd>0&&x.s.k==='gap'):[],a=r2(g.reduce((s,x)=>s+x.usd,0));
  const nh=HAS_CAT()?CATALOG.hotels.length:0,nf=HAS_CAT()?new Set(CATALOG.hotels.map(h=>h.family)).size:0;
  return `<div class="closing" role="dialog" aria-label="${L('סיכום','Summary')}"><div class="in">
   <div class="eyebrow">Triplanet</div><h1>${L('מצאו את הכסף שהספקים חייבים לכם','Find the money your suppliers owe you')}</h1>
   <p class="lead">${L('שלחו 90 יום של חשבוניות ספקים. נחזיר לכם מפת דליפות לפי טיול, סוכן וספק, בחינם.','Send us 90 days of supplier bills. We send back your leak map by trip, agent and supplier, free.')}</p>
   <div class="pts"><div><b>${usd(a)}</b>${L('נמצאו בטיול אחד, תוך שניות','found on one trip, in seconds')}</div><div><b>${pct(M.pp?M.leak/M.pp:0)}</b>${L('מהרווח המתוכנן דלף העונה','of planned profit leaked this season')}</div><div><b>${nh}</b>${L(`מלונות מ-${nf} רשתות, מוכנים בסטודיו`,`hotels from ${nf} brands, ready in the studio`)}</div></div>
   <p class="fine">${L('נתוני הסוכנות בדמו פיקטיביים. שמות המלונות והאטרקציות אמיתיים, התעריפים להמחשה. חיבור ל-QuickBooks ול-Xero בפיילוט.','The agency data in this demo is fictional. Hotel and venue names are real; rates are illustrative. QuickBooks and Xero connections are in pilot.')}</p></div></div>`;
}
function meetBar(){
  const st=MEET[S.meet],[ti,tx]=st.tx(),last=S.meet===MEET.length-1;
  return `<div class="meet" role="dialog" aria-label="${L('מצב פגישה','Meeting mode')}" dir="${S.lang==='en'?'ltr':'rtl'}"><div class="top"><div class="dots">${MEET.map((m,i)=>`<i class="${i===S.meet?'on':i<S.meet?'done':''}"></i>`).join('')}</div><span class="small" style="color:#8fa3b8">${S.meet+1} / ${MEET.length}</span><span class="clock" id="meetclock"></span></div>
   <h3>${ti}</h3><p>${tx}</p>
   <div class="ctl"><button class="btn" data-act="meetprev" ${S.meet===0?'disabled':''}>← ${L('הקודם','Back')}</button><button class="btn pri" data-act="${last?'meetend':'meetnext'}">${last?L('סיום','Finish'):L('הבא','Next')} →</button><button class="btn" data-act="meetstart">↺ ${L('מההתחלה','Restart')}</button><button class="btn" data-act="meetend">✕</button><span class="keys">${L('חיצים: מעבר · R: התחלה מחדש · Esc: יציאה','Arrows: move · R: restart · Esc: exit')}</span></div></div>`;
}
function meetAfter(){
  if(!document.body||!document.createElement)return;
  let bar=document.getElementById('meetbar');
  if(!(S.meet>=0)){if(bar)bar.remove();document.body.classList.remove('meet-on');return;}
  if(!bar){bar=document.createElement('div');bar.id='meetbar';document.body.appendChild(bar);}
  const st=MEET[S.meet];
  bar.innerHTML=trHtml((st.close?closingHtml():'')+meetBar());document.body.classList.add('meet-on');meetClock();
  if(st.sel){const el=document.querySelector(st.sel);if(el&&el.classList){el.classList.add('thl');if(S.meet!==MEET_LAST_SCROLL){MEET_LAST_SCROLL=S.meet;try{const r=el.getBoundingClientRect();if(r.bottom>window.innerHeight-230||r.top<0)el.scrollIntoView({block:r.height>window.innerHeight-260?'start':'center'});}catch(e){}}}}
}
/* topbar button: inject next to the guided tour button after each render */
function meetButton(){
  if(!document.querySelector)return;const tb=document.querySelector('.tourbtn');if(!tb||document.querySelector('[data-act="meet"]'))return;
  const b=document.createElement('button');b.className='btn sm tourbtn meetbtn';b.dataset.act='meet';b.textContent='◉ '+L('מצב פגישה (3 דק׳)','Meeting mode (3 min)');tb.insertAdjacentElement('afterend',b);
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='meet'||a==='meetstart')meetStart();
  else if(a==='meetnext')meetGo(S.meet+1);
  else if(a==='meetprev')meetGo(S.meet-1);
  else if(a==='meetend')meetEnd();
});
document.addEventListener('keydown',e=>{
  if(!(S.meet>=0))return;const tg=e.target&&e.target.tagName;if(tg==='INPUT'||tg==='SELECT'||tg==='TEXTAREA')return;
  const fwd=S.lang==='en'?'ArrowRight':'ArrowLeft',back=S.lang==='en'?'ArrowLeft':'ArrowRight';
  if(e.key===fwd||e.key===' '||e.key==='PageDown'){e.preventDefault();if(S.meet<MEET.length-1)meetGo(S.meet+1);}
  else if(e.key===back||e.key==='PageUp'){e.preventDefault();meetGo(S.meet-1);}
  else if(e.key==='Escape')meetEnd();
  else if(e.key==='r'||e.key==='R')meetStart();
});
