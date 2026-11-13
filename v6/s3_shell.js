
/* ---------- state ---------- */
const S0=()=>({lang:'en',role:'manager',tab:'home',ptab:'costs',tripId:'hl',qtab:'all',q:'',qseg:'All',sub:'bank',openDay:1,openT:{},tplQ:'',tplDest:'All',
  fSeg:'All',fStage:'All',fAgent:'All',thresh:12,shock:0,chat:[],docGroup:0,docMode:'pay',msgSup:0,ran:false,imported:false,priceExtra:[],
  cats:['Lodging','Transport','Guide','Activities','Meals','Insurance'],draft:null,nid:1,showPP:true,showItems:true,showSched:true,siteSel:0,
  page:0,rpp:8,zoom:1,menu:false,tour:-1,chen:false,reading:null,lastMatch:{},disp:null,gF:'open',gK:'All',qg:0});
const S=S0();
const VER=8,KEY='triplanet-booth-demo-v8';
const KEEP=['lang','role','tab','ptab','tripId','qtab','qseg','sub','openDay','thresh','shock','chat','docGroup','docMode','msgSup','ran','imported','priceExtra','cats','nid','showPP','showItems','showSched','page','rpp','zoom','lastMatch','gF','gK','qg'];
function save(){try{const s={};KEEP.forEach(k=>s[k]=S[k]);const X={};PERSIST.forEach(p=>{try{X[p.key]=p.get();}catch(e){}});localStorage.setItem(KEY,JSON.stringify({v:VER,S:s,T:TRIPS,X}));}catch(e){}}
function load(){try{const raw=localStorage.getItem(KEY);if(!raw)return;const d=JSON.parse(raw);if(!d||d.v!==VER||!Array.isArray(d.T)||!d.T.length)return;TRIPS.splice(0,TRIPS.length,...d.T);Object.assign(S,d.S||{});if(d.X)PERSIST.forEach(p=>{if(d.X[p.key]!==undefined)try{p.set(d.X[p.key]);}catch(e){}});TRIPS.forEach((t,i)=>TRIP_INIT.forEach(f=>f(t,i)));}catch(e){}}
function resetDemo(){const keep={lang:S.lang,zoom:S.zoom};TRIPS.splice(0,TRIPS.length,...TRIP_SPECS.map(buildTrip));Object.assign(S,S0(),keep);PERSIST.forEach(p=>{try{p.reset();}catch(e){}});try{localStorage.removeItem(KEY);}catch(e){}}
const T=()=>TRIPS.find(t=>t.id===S.tripId);
const byId=id=>TRIPS.find(t=>t.id===id);
/* roles: owner (key manager), accountant, and the agents. Owner and accountant see every file. */
const ROLE_KEYS=['manager','accountant',...AGENTS];
const canApprove=()=>typeof can==='function'?can('prop.approve'):isMgr();
const canIssueDocs=()=>typeof can==='function'?can('fin.issueDocs'):(isMgr()||isAcct());
const isMgr=()=>S.role==='manager',isAcct=()=>S.role==='accountant',isAgent=()=>AGENTS.includes(S.role);
const seesAll=()=>isMgr()||isAcct();
AGN.accountant='נורה קים';AGE.accountant='Nora Kim';
const userName=()=>isMgr()?MGR():agn(S.role);
const noAccess=what=>`<div class="card"><h2>${L('אין הרשאה','No access')}</h2><p class="muted">${what?esc(what)+'. ':''}${L('התפקיד שלך לא כולל את המסך הזה. מנהלת הסוכנות יכולה לשנות הרשאות בהגדרות.','Your role does not include this page. The agency owner can change permissions in Settings.')}</p></div>`;
const canSee=t=>seesAll()||t.agent===S.role;
/* pages gated by a permission (can() comes from s1e_people.js); gated views render noAccess() in s9_boot.js */
/* Hebrew for generic data strings (s11_trdata.js); identity when absent or in English */
const heDataIf=h=>S.lang==='he'&&typeof heData==='function'?heData(h):h;
const NAV_PERM={users:'users.manage',books:'fin.sync'};
const visibleTrips=()=>TRIPS.filter(canSee);
function ensureTrip(){const v=visibleTrips();if(!v.find(t=>t.id===S.tripId))S.tripId=v.length?v[0].id:null;if(S.tab==='trip'&&!S.tripId)S.tab='quotes';}
function toast(msg){const e=document.getElementById('toast');e.textContent=trHe(msg);e.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('on'),2200);}
/* Save a generated text file. Inside a published claude.ai page the viewer's "downloads" permission is used
   (the viewer confirms); on the booth laptop (plain file) a normal browser download is used. Resolves 'saved',
   'declined' or 'failed'. */
async function saveFile(name,text,mime){
  try{if(typeof window!=='undefined'&&window.claude&&typeof window.claude.use==='function'){const d=await window.claude.use('downloads');
    if(d){try{await d.save({filename:name,data:text});return 'saved';}catch(e){if(e&&e.code==='declined')return 'declined';}}}}catch(e){}
  try{const u=URL.createObjectURL(new Blob([text],{type:mime||'text/plain;charset=utf-8'})),a=document.createElement('a');
    a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>{try{URL.revokeObjectURL(u);}catch(e){}},1000);return 'saved';}catch(e){return 'failed';}
}
const saveToast=r=>toast(r==='saved'?L('הקובץ נשמר','The file was saved'):r==='declined'?L('השמירה בוטלה','Save canceled'):L('לא ניתן לשמור כאן. נסו בדפדפן.','Saving is not available here. Try in a browser.'));
async function copy(text){try{await navigator.clipboard.writeText(trHe(text));toast(L('הועתק','Copied'));}catch(e){toast(L('סמנו והעתיקו ידנית','Select and copy manually'));}}
const noTrip=()=>`<div class="card"><h2>${L('אין כאן טיולים','No trips here')}</h2><p class="muted">${L('סוכנים רואים רק את התיקים שלהם. עברו לתצוגת מנהל כדי לראות הכול.','Agents only see their own files. Switch to the manager view to see everything.')}</p></div>`;
const gate=(t,what)=>`<div class="card"><h2>${what} ${L('נפתח אחרי אישור ההצעה','opens after the quote is accepted')}</h2><p class="muted">${esc(t.name)} ${L('עדיין בשלב הצעה','is still a quote')} (${qn(t.qst)}). ${L('אישור ההצעה יוצר קבוצות חיוב, רשימת משימות ואישורי ספקים.','Accepting the quote creates billing groups, a task list and supplier confirmations.')}</p><button class="btn grn" data-act="win" data-v="${t.id}">${L('הלקוח אישר: פתח תיק','Client accepted: open the file')}</button></div>`;
const head=(title,right)=>`<div class="ph"><h1>${title}</h1><div class="row">${right||''}</div></div>`;
/* staff portraits (v6/s0_avatars.js, generated): looked up by agent key or by the full name in either language */
const avKey=n=>{n=String(n).trim();if(typeof AVATARS==='undefined')return null;if(AVATARS[n])return n;
  for(const a of AGENTS)if(n===AGN[a]||n===AGE[a])return a;if(n==='אלה ברוקס'||n==='Ella Brooks')return 'Ella';return null;};
const avatarOf=(n,cls)=>{const k=avKey(n);return k?`<img class="avatar avimg${cls?' '+cls:''}" src="${AVATARS[k]}" alt="" width="40" height="40">`:`<span class="avatar${cls?' '+cls:''}">${esc(trHe(String(n)).trim().charAt(0))}</span>`;};
const NEWP=()=>pillF(L('חדש','New'),'green');

/* ---------- shell ---------- */
/* v8.1: the sidebar is grouped by job. Items not listed in a section go to the last one. */
const NAV_SECTIONS=[[null,['home']],[['מכירות','Sales'],['quotes','studio','clients']],[['קטלוג','Catalog'],['suppliers','hotels','activities','templates']],
  [['כספים ורווח','Money'],['finance','gaps','leaks','books']],[['עזרה','Help'],['ai','status']],[['ניהול','Admin'],['users','settings']]];
function navSections(ok,nb){
  const all=[...NAV,...NAV2].filter(ok),by={},used=new Set();all.forEach(n=>by[n[0]]=n);
  const sec=NAV_SECTIONS.map(([lab,keys])=>{const its=keys.filter(k=>by[k]);its.forEach(k=>used.add(k));return [lab,its.map(k=>by[k])];});
  all.filter(n=>!used.has(n[0])).forEach(n=>sec[sec.length-1][1].push(n));
  return sec.filter(x=>x[1].length).map(([lab,its])=>(lab?`<div class="nvh">${L(lab[0],lab[1])}</div>`:'')+its.map(nb).join('')).join('');
}
const NAV=[['home',['דף הבית','Home'],ic('home')],['quotes',['הצעות מחיר','Quotes'],ic('quotes')],['templates',['תבניות','Templates'],ic('templates')],['hotels',['מלונות','Hotels'],ic('hotels')],['suppliers',['ספקים','Suppliers'],ic('suppliers')],['activities',['פעילויות','Activities'],ic('activities')],['users',['משתמשים','Users'],ic('users')]];
const NAV2=[['gaps',['בקרת חשבוניות','Invoice check'],ic('gaps')],['finance',['כספים','Finance'],ic('finance')],['ai',['מאיה, העוזרת החכמה','Maya, AI assistant'],ic('ai')]];
const FLAG={en:`<svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true"><rect width="30" height="20" fill="#fff"/><g fill="#b22234">${[0,2,4,6,8,10,12].map(i=>`<rect y="${i*20/13}" width="30" height="${20/13}"/>`).join('')}</g><rect width="13" height="${20*7/13}" fill="#3c3b6e"/></svg>`,
  he:`<svg viewBox="0 0 30 20" width="30" height="20" aria-hidden="true"><rect width="30" height="20" fill="#fff" stroke="#d6dbe3" stroke-width=".6"/><rect y="2.2" width="30" height="2.6" fill="#0038b8"/><rect y="15.2" width="30" height="2.6" fill="#0038b8"/><g fill="none" stroke="#0038b8" stroke-width="1"><path d="M15 6.3l3.2 5.5h-6.4z"/><path d="M15 13.7l3.2-5.5h-6.4z"/></g></svg>`};
let chenAv=(sz)=>`<span class="chenav" style="width:${sz||30}px;height:${sz||30}px">${L('מ','M')}</span>`;
function render(){
  const y=window.scrollY;ensureTrip();
  const view=S.tab==='trip'?vTrip:VIEWS[S.tab];
  const user=userName();
  const act=S.tab==='trip'?'quotes':S.tab;
  const navOk=n=>typeof can!=='function'||!NAV_PERM[n[0]]||can(NAV_PERM[n[0]]);
  const nb=(a)=>`<button class="nv ${act===a[0]?'on':''}" data-act="go" data-v="${a[0]}"><span class="ic">${a[2]}</span>${L(a[1][0],a[1][1])}${['gaps','studio','leaks'].includes(a[0])?' '+pillF(L('חדש','New'),'info nvp'):''}</button>`;
  const nAl=alertsFor(visibleTrips(),S.thresh).filter(a=>a.sev!=='info').length;
  const menu=S.menu?`<div class="menu" role="menu"><button data-act="tourgo" role="menuitem">${ic('play')} ${L('סיור מודרך (3 דקות)','Guided tour (3 minutes)')}</button><button data-act="lang" role="menuitem">${L('English','עברית')}</button>
     <div class="mz"><span>${L('גודל תצוגה','Display size')}</span>${[[1,'100%'],[1.15,'115%'],[1.3,'130%']].map(z=>`<button class="btn sm ${S.zoom===z[0]?'pri':''}" data-act="zoom" data-v="${z[0]}">${z[1]}</button>`).join('')}</div>
     ${typeof devPanel==='function'?`<button data-act="devnotes" role="menuitem">${ic('document')} ${devOn()?L('הסתר הערות למפתחים','Hide developer notes'):L('הצג הערות למפתחים','Show developer notes')}</button>`:''}
     <button data-act="reset" role="menuitem" class="neg">${ic('restart')} ${L('איפוס נתוני הדמו','Reset demo data')}</button><div class="small muted" style="padding:6px 10px 2px">${L('נתוני הסוכנות פיקטיביים. שמות המלונות והאטרקציות אמיתיים, התעריפים להמחשה.','Agency data is fictional. Hotel and venue names are real; rates are illustrative.')}</div></div>`:'';
  const fab=S.tab==='ai'?'':S.chen?chenPanel():`<button class="chenfab${S.tab==='home'?'':' cmp'}" data-act="chen" aria-label="${L('שאלו את מאיה','Ask Maya')}" data-tip="${L('שאלו את מאיה','Ask Maya')}">${chenAv(S.tab==='home'?28:40)}<span>${L('שאלו את מאיה','Ask Maya')}</span></button>`;
  const app=document.getElementById('app');app.setAttribute('dir',S.lang==='en'?'ltr':'rtl');app.setAttribute('lang',S.lang==='en'?'en':'he');
  try{app.style.zoom=S.zoom===1?'':String(S.zoom);}catch(e){}
  app.innerHTML=heDataIf(trHtml(`<div class="app${S.drawer?' drawer':''}">
   <aside class="side"><div class="brand"><img class="tp-logo" src="${TP_LOGO}" alt="Triplanet" width="132" height="30"><small>${AGENCY}</small></div>${navSections(navOk,nb)}</aside>
   <main class="content"><div class="topbar">
     <button class="iconb hamb" data-act="drawer" aria-label="${L('תפריט','Menu')}"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1m0 5a1 1 0 0 1 1-1h10a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1m1 4a1 1 0 1 0 0 2h7a1 1 0 1 0 0-2z"/></svg></button>
     <button class="btn sm tourbtn" data-act="tourgo" title="${L('סיור מודרך','Guided tour')}">${ic('play')} ${L('סיור מודרך','Guided tour')}</button>
     <span class="grow"></span>
     <label class="small muted" for="role">${L('צפייה כ','View as')}</label>
     <select id="role" data-ch="role" aria-label="${L('בחירת משתמש','Choose user')}">
       <option value="manager" ${S.role==='manager'?'selected':''}>${MGR()} (${L('מנהלת','owner')})</option>
       <option value="accountant" ${isAcct()?'selected':''}>${agn('accountant')} (${L('הנהלת חשבונות','accountant')})</option>
       ${AGENTS.map(a=>`<option value="${a}" ${S.role===a?'selected':''}>${agn(a)} (${L('סוכן/ת','agent')})</option>`).join('')}
     </select>
     <button class="iconb" data-act="go" data-v="quotes" aria-label="${L('חיפוש','Search')}" title="${L('חיפוש','Search')}">${ic('search')}</button>
     <button class="iconb themeb" data-act="theme" aria-label="${themeGet()==='dark'?L('מצב יום','Day mode'):L('מצב לילה','Night mode')}" title="${themeGet()==='dark'?L('מצב יום','Day mode'):L('מצב לילה','Night mode')}">${ic(themeGet()==='dark'?'sun':'moon')}</button>
     <button class="iconb" data-act="lang" aria-label="${L('Switch to English','החלפה לעברית')}" title="${L('English','עברית')}">${FLAG[S.lang]}</button>
     <button class="bell" data-act="go" data-v="home" aria-label="${L('התראות','Alerts')}">${ic('bell')}${nAl?`<b>${nAl}</b>`:''}</button>
     <span class="mwrap"><button class="iconb" data-act="menu" aria-label="${L('הגדרות דמו','Demo settings')}" aria-expanded="${S.menu}">${ic('settings')}</button>${menu}</span>
     ${avatarOf(user)}
   </div><div id="view">${view()}</div></main></div>${fab}${tourPanel()}`));
  window.scrollTo(0,y);
  tourAfter();save();
}

/* ---------- Maya drawer ---------- */
function chatLog(){return S.chat.map(x=>`<div class="msg ${x.r}">${x.r==='a'?`<div class="who">${chenAv(22)} ${L('מאיה','Maya')}</div>`:''}${esc(x.t)}${x.btn?`<div style="margin-top:8px"><button class="btn sm pri" data-act="${x.btn.act}" data-v="${x.btn.v||''}">${x.btn.label}</button></div>`:''}</div>`).join('');}
var chenSuggest=function(){
  const t=T();let ids;
  if(S.tab==='trip'&&t&&S.ptab==='tfin')ids=[1,8,5,2];
  else if(S.tab==='gaps')ids=[2,3,4,6];
  else if(S.tab==='finance')ids=[10,11,13,9];
  else if(S.tab==='quotes'||S.tab==='trip')ids=[15,16,17,24];
  else ids=[1,11,19,24];
  return ids.map(i=>QS[i-1]);
};
function chenPanel(){
  return `<aside class="chen" aria-label="${L('מאיה, העוזרת החכמה','Maya, AI assistant')}"><div class="ch"><span class="row" style="gap:8px">${chenAv(30)}<span><strong>${L('מאיה','Maya')}</strong><div class="small muted">${L('עונה מהנתונים של הסוכנות','Answers from your agency data')}</div></span></span><button class="btn sm" data-act="chen" aria-label="${L('סגור','Close')}">${ic('x')}</button></div>
   <div class="cb">${S.chat.length?chatLog():`<div class="msg a"><div class="who">${chenAv(22)} ${L('מאיה','Maya')}</div>${L('היי, אני מאיה. אפשר לשאול אותי על פערי חשבוניות, רווחיות, תשלומים, משימות או לבקש טיוטה לטיול.','Hi, I am Maya. Ask me about invoice gaps, margins, payments or tasks, or ask me to draft a trip.')}</div>`}</div>
   <div class="cs">${chenSuggest().map(q=>`<button class="btn sm" data-act="ask" data-v="${q.id}">${esc(L(q.he,q.en))}</button>`).join('')}</div>
   <form class="row cf" data-form="ask"><input type="text" name="q" placeholder="${L('שאלו את מאיה...','Ask Maya...')}" aria-label="${L('שאלה','Question')}"><button class="btn pri" type="submit">${L('שלח','Send')}</button></form></aside>`;
}

/* ---------- guided tour ---------- */
const TOUR=[
  {sel:'.tiles',go:()=>{S.role='manager';S.tab='home';},
   tx:()=>[L('הסוכנות במבט אחד','Your agency at a glance'),L('הצעות, תיקים, יציאות קרובות ומה שדורש טיפול היום, במסך אחד. הנתונים פיקטיביים ומדמים סוכנות עם 6 סוכנים.','Quotes, files, upcoming departures and what needs attention today, on one screen. The data is fictional and models an agency with 6 agents.')]},
  {sel:'#qlist',go:()=>{S.tab='quotes';S.qtab='all';S.page=0;S.q='';S.qseg='All';},
   tx:()=>[L('כל ההצעות והתיקים ברשימה אחת','Every quote and file in one list'),L('סטטוס, תאריכים, לקוח ואחראי תיק. סוכן רואה רק את התיקים שלו, מנהל רואה הכול.','Status, dates, client and owner. Agents see their own files, managers see everything.')]},
  {sel:'.acc[data-day="3"]',go:()=>{openTrip('hl','plan');S.openDay=3;},
   tx:()=>[L('בונים את מסלול הטיול','Build the itinerary'),L(`גוררים אתרים בין ימים או מוסיפים תבנית יום. טריפלאנט מסמנת יום עמוס של ${dayHours(byId('hl'),3)} שעות לפני שהלקוח רואה אותו.`,`Drag sites between days or add a day template. Triplanet flags a ${dayHours(byId('hl'),3)}-hour day before the client ever sees it.`)]},
  {sel:'.stats',go:()=>openTrip('hl','costs'),
   tx:()=>[L('מתמחרים לפי סוג שירות','Price it by service type'),L('מרקאפ והנחה לכל סוג שירות, והמחיר לנוסע מתעדכן תוך כדי הקלדה. עמלות ספקים נשארות פנימיות.','Markup and discount per service type; the price per traveler updates as you type. Supplier commissions stay internal.')]},
  {sel:'.doc .hero',go:()=>openTrip('hl','quote'),
   tx:()=>[L('הצעה שהלקוח קורא','A proposal the client can read'),L('לחיצה אחת הופכת את התוכנית להצעה ממותגת. שולי רווח ועמלות לא מופיעים בה.','One click turns the plan into a branded proposal. Margins and commissions never appear on it.')]},
  {sel:'.appr',go:()=>{const t=byId('hl');if(t&&t.stage==='Quote'&&(t.qst==='Draft'||t.qst==='Approval'))t.qst='Negotiating';openTrip('hl','approve');},
   tx:()=>[L('אישור, ואז תיק חי','Approval, then a live file'),L('המנהל מאשר, הלקוח אומר כן, ולחיצה אחת פותחת תיק: קבוצות חיוב, רשימת חדרים, משימות ואישורי ספקים.','The manager approves, the client says yes, and one click opens the file: billing groups, rooming list, tasks and supplier confirmations.')]},
  {sel:'#inbox',go:()=>openTrip('nen','tfin'),
   tx:()=>[L('אחרי הטיול, החשבוניות מגיעות','After the trip, the invoices arrive'),L('קבוצת ניו אינגלנד חזרה הביתה. שש חשבוניות ספקים הגיעו במייל. טריפלאנט קוראת אותן ומתאימה כל שורה למה שתומחר בהצעה.','The New England group is home. Six supplier invoices just arrived by email. Triplanet reads them and matches every line to what you quoted.')]},
  {sel:'.gaps',go:()=>{const t=byId('nen');if(t&&t.inbox.length&&!S.reading){applyInbox(t);S.lastMatch.nen=matchSummary(t,6);}openTrip('nen','tfin');},
   tx:()=>{const t=byId('nen'),g=tripGaps(t).filter(x=>x.usd>0&&x.s.k==='gap'),a=r2(g.reduce((s,x)=>s+x.usd,0)),c=calc(t),base=r2(c.fcProfit+a);
     return [L('פערים שנמצאו לבד','Gaps found automatically'),L(`${g.length} פערים בסך ${usd(a)} בטיול אחד: חדר מיותר, חדר נהג "חינם" שחויב, תוספת דלק, חשבונית כפולה, מחיר מחירון במקום תעריף קבוצה ומנות עודפות. זה ${base>0?pct(a/base):''} מהרווח של הטיול. לחיצה אחת מנסחת דרישת זיכוי.`,`${g.length} gap${(g.length)===1?'':'s'} worth ${usd(a)} on one trip: an extra room, a "complimentary" driver room billed, a fuel surcharge, a duplicate invoice, the public rate instead of the group rate, and extra covers. That is ${base>0?pct(a/base):''} of this trip's profit. One click drafts the dispute.`)];}},
  {sel:'.stats',go:()=>{S.tab='gaps';S.gF='open';},
   tx:()=>[L('כל הטיולים, כל הספקים','Every trip, every supplier'),L('פערים פתוחים, דרישות זיכוי וזיכויים שהתקבלו לאורך העונה, ואילו ספקים מחייבים ביתר הכי הרבה.','Open, disputed and recovered gaps across the season, and which suppliers overbill most often.')]},
  {sel:'.chat',go:()=>{S.tab='ai';if(!S.chat.length)askQ(QS[1]);},
   tx:()=>[L('שאלו את מאיה','Ask Maya'),L(`מאיה עונה מהנתונים של הסוכנות, בעברית או באנגלית. ${QS.length} שאלות מוכנות, ואפשר גם לכתוב חופשי.`,`Maya answers from your own agency data, in English or Hebrew. ${QS.length} ready questions, or type your own.`)]}
];
function tourPanel(){
  if(S.tour<0)return '';
  const st=TOUR[S.tour],[ti,tx]=st.tx(),last=S.tour===TOUR.length-1;
  return `<div class="tour" role="dialog" aria-label="${L('סיור מודרך','Guided tour')}"><div class="tp"><span class="small muted">${L('שלב','Step')} ${S.tour+1} ${L('מתוך','of')} ${TOUR.length}</span><button class="btn sm" data-act="tourend" aria-label="${L('סיום הסיור','End tour')}">${ic('x')}</button></div>
   <div class="tbar"><div style="width:${(S.tour+1)/TOUR.length*100}%"></div></div><h3>${ti}</h3><p>${tx}</p>
   <div class="row" style="justify-content:space-between"><button class="btn" data-act="tourprev" ${S.tour===0?'disabled':''}>${L('הקודם','Back')}</button><button class="btn pri" data-act="${last?'tourend':'tournext'}">${last?L('סיום','Finish'):L('הבא','Next')}</button></div></div>`;
}
function tourGo(i){S.tour=i;S.menu=false;S.chen=false;TOUR[i].go();window.scrollTo(0,0);render();}
function tourAfter(){
  if(S.tour<0)return;
  const el=document.querySelector&&document.querySelector(TOUR[S.tour].sel);
  if(el&&el.classList){el.classList.add('thl');try{const rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;el.scrollIntoView({block:'center',behavior:rm?'auto':'smooth'});}catch(e){}}
}

/* ---------- invoice reading animation ---------- */
function matchSummary(t,files){const g=tripGaps(t).filter(x=>x.s.k==='gap'&&x.usd>0&&isOpenGap(x.s));return {files,n:g.length,amt:r2(g.reduce((a,x)=>a+x.usd,0))};}
function startReading(t){
  if(S.reading||!t.inbox.length)return;
  S.reading={tid:t.id,done:[],n:t.inbox.length};render();
  const tick=()=>{
    if(!S.reading||S.reading.tid!==t.id||byId(t.id)!==t)return; // demo reset mid-read
    const f=t.inbox.shift();if(!f){const n=S.reading.n;S.reading=null;S.lastMatch[t.id]=matchSummary(t,n);render();const s=S.lastMatch[t.id];toast(L(`נמצאו ${s.n} פערים בסך ${usd(s.amt)}`,`Found ${s.n} gap${(s.n)===1?'':'s'} worth ${usd(s.amt)}`));return;}
    applyInboxFile(t,f);
    const lines=(f.inv||[]).length+(f.extra||[]).length,gaps=(f.inv||[]).filter(x=>x[1].kind).length+(f.extra||[]).length;
    S.reading.done.push({file:f.file,lines,gaps});render();setTimeout(tick,650);
  };
  setTimeout(tick,500);
}

/* day/night: an explicit choice on <html data-theme>. Kept per laptop outside the demo state,
   so Reset and the idle kiosk reset keep it. Light is the default (the product's default). */
const THEME_KEY='triplanet-theme';
function themeGet(){try{return localStorage.getItem(THEME_KEY)==='dark'?'dark':'light';}catch(e){return 'light';}}
function themeApply(t){try{document.documentElement.setAttribute('data-theme',t);}catch(e){}}
function themeToggle(){const t=themeGet()==='dark'?'light':'dark';try{localStorage.setItem(THEME_KEY,t);}catch(e){}themeApply(t);}
themeApply(themeGet());
