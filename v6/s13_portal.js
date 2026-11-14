/* ---------- v8.4 portals: the frame every external viewpoint shares (spec-v8.4-viewpoints.md §2.2) ----------
   External people (group leader, traveler, supplier, tour director) are not agency roles. While S.pv is set,
   render() draws this minimal, mobile-first shell instead of the agency app: agency badge, a "viewing as" ribbon
   with a way back, tabs (bottom bar on phones) and one content column. Modules register with pvRegister(k,def):
     {role:[he,en], label:[he,en], kind:'client'|'field', feat:<FEAT key>, people:()=>[{id,name,sub}], def:<id>,
      tabs:[[key,he,en,icon]], view:(tab,person)=>html}
   Shared helpers keep the plan, households and money notes identical across portals. */
const PORTALS={};
const PV_STRICT=true;
let PV_PREV='';
function pvRegister(k,def){PORTALS[k]=Object.assign({kind:'client',feat:null,tabs:[],people:()=>[],view:()=>''},def,{k});}
const pvP=()=>S.pv&&PORTALS[S.pv.k];
function pvPerson(){const P=pvP();if(!P)return null;const ps=P.people();return ps.find(x=>x.id===S.pv.id)||ps.find(x=>x.id===P.def)||ps[0]||null;}
function pvOpen(k,id,tab){const P=PORTALS[k];if(!P)return;
  S.pv={k,id:id||P.def,tab:tab&&P.tabs.some(x=>x[0]===tab)?tab:P.tabs[0][0]};S.menu=false;S.chen=false;S.tour=-1;try{window.scrollTo(0,0);}catch(e){}}
function pvExit(){S.pv=null;S.tab='home';}
const pvTab=k=>{if(S.pv&&pvP()&&pvP().tabs.some(x=>x[0]===k))S.pv.tab=k;};

/* ---------- shared helpers ---------- */
/* clock time from minutes since midnight: 2:30 PM in English, 14:30 in Hebrew */
const pvClock=m=>{m=Math.round(m/5)*5;const h=Math.floor(m/60)%24,mm=String(m%60).padStart(2,'0');
  return S.lang==='en'?`${(h%12)||12}:${mm} ${h<12?'AM':'PM'}`:`${String(h).padStart(2,'0')}:${mm}`;};
const pvKind=n=>/coach|depart|return|transfer|drive|flight|airport|check-in|check-out|train|ferry/i.test(n)?'travel':/breakfast|lunch|dinner|meal|buffet|supper/i.test(n)?'meal':/free|leisure/i.test(n)?'free':'visit';
const PV_KIC={travel:'bus',meal:'dining',free:'free',visit:'pin'};
/* the trip day by day with clock times: day 1 starts at the 07:00 departure, other days at 08:00; 15 minutes between stops */
function pvDays(t){
  if(!t)return [];const n=(t.nights||0)+1,out=[];
  for(let i=1;i<=n;i++){let cur=i===1?7*60:8*60;
    const items=(t.items||[]).filter(x=>x.day===i).map(x=>{const s=cur,e=cur+Math.round((+x.hrs||0)*60);cur=e+15;
      return {id:x.id,name:x.name,hrs:+x.hrs||0,start:s,end:e,kind:pvKind(x.name)};});
    out.push({i,date:addDays(t.dep,i-1),items,hotel:i<n&&t.room?t.room.hotel:''});}
  return out;
}
/* one day as a card. o.done: Set of item ids, o.tick: data-act for a done button, o.hl: highlight, o.extra(item)=>html */
function pvDayCard(t,d,o){o=o||{};
  const dt=D(d.date).toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short'});
  return `<div class="card hc-card pv-day${o.hl?' pv-today':''}" data-day="${d.i}">
   <div class="hc-h"><h3>${L('יום','Day')} ${d.i} <span class="muted small">· ${dt}</span></h3>${d.hotel?`<span class="muted small pv-hot">${ic('bed')} <bdi>${esc(d.hotel)}</bdi></span>`:''}</div>
   ${d.items.length?`<ol class="pv-tl">${d.items.map(x=>{const dn=o.done&&o.done.has(x.id);
     return `<li class="pv-st k-${x.kind}${dn?' done':''}"><span class="pv-tm"><b>${pvClock(x.start)}</b><small>${pvClock(x.end)}</small></span>
      <span class="pv-dot">${ic(PV_KIC[x.kind])}</span><span class="pv-tx"><b>${esc(x.name)}</b>${o.extra?o.extra(x):''}</span>
      ${o.tick?`<button class="btn sm${dn?' pri':''} pv-tick" data-act="${o.tick}" data-v="${t.id}|${d.i}|${x.id}" aria-pressed="${!!dn}">${ic(dn?'done':'check')} ${dn?L('בוצע','Done'):L('סמן','Mark done')}</button>`:''}</li>`;}).join('')}</ol>`
     :`<p class="muted small">${L('יום חופשי, בלי תוכנית קבוצתית.','A free day with no group program.')}</p>`}</div>`;
}
/* the household a traveler belongs to, with its billing row (groupsCalc) */
function pvHousehold(t,i){const x=t&&t.trav[i];if(!x)return null;const gi=t.groups.findIndex(g=>g.name===x.g);if(gi<0)return null;
  const row=groupsCalc(t).rows[gi];return {gi,g:t.groups[gi],row,members:t.trav.map((y,j)=>({y,j})).filter(z=>z.y.g===x.g)};}
const pvTripsOfClient=c=>c?TRIPS.filter(t=>t.client===c.name&&!(t.stage==='Quote'&&t.qst==='Lost')):[];
/* suppliers that may appear in the supplier portal: fictional only (real-brand rule), and on at least one trip line */
function pvFictionalSuppliers(){const used=new Set();TRIPS.forEach(t=>t.lines.forEach(l=>used.add(l.sup)));
  return SUPPLIERS.filter(s=>s.fictional===true&&s.real!==true&&used.has(s.name));}
const pvSupLines=name=>TRIPS.reduce((a,t)=>a.concat(t.lines.filter(l=>l.sup===name).map(l=>({t,l}))),[]);
const pvMoneyNote=()=>L('תשלום לדוגמה. לא הועבר כסף.','Simulated payment. No money moved.');
const pvPayLink=(t,g)=>`https://pay.redbudtours.example/${t.id}/${String(g&&g.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
const pvDaysTo=t=>Math.round((D(t.dep)-TODAY)/DAY);
/* a "Back to agency" note shown on portal cards that link agency screens */
const pvAgencyBadge=()=>`<span class="pv-ag"><i class="pv-agb" aria-hidden="true">${esc(AGENCY.charAt(0))}</i><b>${esc(AGENCY)}</b></span>`;

/* ---------- the frame ---------- */
function pvShell(){
  const P=pvP(),p=pvPerson(),tab=S.pv.tab,tabs=P.tabs;
  const f=P.feat&&typeof FEAT!=='undefined'?FEAT.find(x=>x[0]===P.feat):null;
  const people=P.people();
  let body='';try{body=P.view(tab,p);}catch(e){if(typeof console!=='undefined')console.error(e);body=`<div class="card"><p class="muted">${L('המסך לא נטען.','This screen could not load.')}</p></div>`;}
  const theme=themeGet();
  return `<div class="pv pv-${P.k}${tabs.length>1?' pv-hastabs':''}">
   <header class="pv-top">${pvAgencyBadge()}<span class="pv-pn">${L(P.label[0],P.label[1])}</span>${f?stPill(f[1]):''}<span class="grow"></span>
    <button class="iconb themeb" data-act="theme" aria-label="${theme==='dark'?L('מצב יום','Day mode'):L('מצב לילה','Night mode')}" title="${theme==='dark'?L('מצב יום','Day mode'):L('מצב לילה','Night mode')}">${ic(theme==='dark'?'sun':'moon')}</button>
    <button class="iconb" data-act="lang" aria-label="${L('Switch to English','החלפה לעברית')}" title="${L('English','עברית')}">${FLAG[S.lang]}</button>
    ${p?avatarOf(p.name):''}</header>
   <div class="pv-rib" role="note"><span class="pv-rt">${ic('show')} ${L('צפייה בתור','You are viewing as')} <b><bdi>${esc(p?p.name:'')}</bdi></b> · ${L(P.role[0],P.role[1])}</span>
    <span class="pv-sel">${people.length>1?`<label class="pv-pk"><span class="sr">${L('בחירת אדם','Choose a person')}</span><select data-ch="pv-person" aria-label="${L('בחירת אדם','Choose a person')}">${people.map(x=>`<option value="${esc(x.id)}" ${p&&x.id===p.id?'selected':''}>${esc(x.name)}${x.sub?' · '+esc(x.sub):''}</option>`).join('')}</select></label>`:''}
    <span class="pv-sw">${viewAsSelect('pvrole')}</span></span>
    <button class="hc-btn mint pv-back" data-act="pv-exit" aria-label="${L('חזרה לסוכנות','Back to agency')}">${ic('left','flip')} <span>${L('חזרה לסוכנות','Back to agency')}</span></button></div>
   ${tabs.length>1?`<nav class="pv-tabs" aria-label="${L('מסכים','Screens')}">${tabs.map(x=>`<button class="pv-tb${x[0]===tab?' on':''}" data-act="pv-tab" data-v="${x[0]}" ${x[0]===tab?'aria-current="page"':''}>${ic(x[3])}<span>${L(x[1],x[2])}</span></button>`).join('')}</nav>`:''}
   <main class="pv-main" id="view">${body}</main>
   <footer class="pv-foot small muted">${L('נתוני הדמו פיקטיביים: הסוכנות, האנשים והתשלומים. הפורטל הזה הוא תצוגה מקדימה.','Demo data: the agency, the people and the payments are fictional. This portal is a preview.')}</footer>
  </div>`;
}
function pvRender(){
  const y=window.scrollY,app=document.getElementById('app'),key=[S.pv.k,S.pv.id,S.pv.tab,S.lang].join('|');
  PV_ANIM=PV_PREV!==key;
  app.setAttribute('dir',S.lang==='en'?'ltr':'rtl');app.setAttribute('lang',S.lang==='en'?'en':'he');
  try{app.style.zoom=S.zoom===1?'':String(S.zoom);}catch(e){}
  app.innerHTML=heDataIf(trHtml(pvShell()));
  PV_PREV=key;window.scrollTo(0,y);save();
}
let PV_ANIM=false;
/* the portal home hero: the shared command-center hero with the portal person's name */
function pvHero(o){const p=pvPerson();return hcShell(Object.assign({name:p?String(p.first||p.name).split(' ')[0]:'',anim:PV_ANIM},o));}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v||'';
  if(a==='pv-tab'){pvTab(v);try{window.scrollTo(0,0);}catch(err){}render();}
  else if(a==='pv-exit'){pvExit();render();}
  else if(a==='pv-open'){const [k,id,tab]=v.split('|');const pid=b.dataset.id||id,tr=b.dataset.trip;
    if(tr){if(k==='traveler')S.ptTrip=tr;else if(k==='leader')S.plTrip=tr;else if(k==='guide'){S.pgTrip=tr;S.pgDay=1;}}
    pvOpen(k,pid,b.dataset.tab||tab);render();}
});
document.addEventListener('change',e=>{const el=e.target;if(!el.dataset||el.dataset.ch!=='pv-person'||!S.pv)return;S.pv.id=el.value;render();});

/* ---------- entry links from the agency: "see this as …" strips on the matching agency screens ---------- */
const pvLink=(k,id,label,sub,extra)=>`<div class="pv-link"><span>${ic('show')} <b>${label}</b>${sub?` <span class="muted small">${sub}</span>`:''}</span><button class="btn sm" data-act="pv-open" data-v="${k}" data-id="${esc(id)}"${extra||''}>${L('פתיחה','Open')} ${ic('chev','flip')}</button></div>`;
if(typeof opTasksTab==='function'){const f0=opTasksTab;opTasksTab=function(t){const h=f0.apply(this,arguments);const g=t&&t.stage!=='Quote'&&typeof guideOfTrip==='function'&&guideOfTrip(t.id);
  return g&&PORTALS.guide?pvLink('guide',g.id,L('דף הריצה של מנהל הטיול','The tour director\'s run sheet'),esc(L(g.he,g.en)),` data-trip="${t.id}" data-tab="day"`)+h:h;};}
if(typeof opManifestTab==='function'){const f0=opManifestTab;opManifestTab=function(t){const h=f0.apply(this,arguments);
  return t&&t.stage==='Operations'&&t.trav&&t.trav.length&&PORTALS.traveler?pvLink('traveler',t.id+'|0',L('האפליקציה של הנוסע','The traveler app'),L('כפי שנוסע רואה את הטיול','as a traveler sees this trip'),` data-trip="${t.id}"`)+h:h;};}
if(typeof spCardHtml==='function'){const f0=spCardHtml;spCardHtml=function(s){const h=f0.apply(this,arguments);
  return s&&PORTALS.supplier&&pvFictionalSuppliers().some(x=>x.id===s.id)?pvLink('supplier',s.id,L('פורטל הספקים','The supplier portal'),L('כפי שהספק רואה את ההזמנות והחשבוניות','as this supplier sees bookings and invoices'))+h:h;};}
if(typeof spCliHtml==='function'){const f0=spCliHtml;spCliHtml=function(c){const h=f0.apply(this,arguments);
  return c&&c.id&&PORTALS.leader&&PORTALS.leader.people().some(x=>x.id===c.id)?pvLink('leader',c.id,L('פורטל ראש הקבוצה','The group leader portal'),esc(c.contact&&c.contact.name||''))+h:h;};}

/* ---------- developer notes and tests for the frame ---------- */
if(typeof SPEC!=='undefined')SPEC['portal:frame']={title:'Portal frame (external viewpoints)',
  purpose:'One minimal, mobile-first shell for every external viewpoint: who you are viewing as, a way back to the agency, and the portal tabs.',
  roles:{view:['leader','traveler','supplier','guide'],act:['leader','traveler','supplier','guide']},perms:[],
  data:['S.pv {k,id,tab}','PORTALS registry'],
  actions:[{label:'Person picker',does:'Switches the person inside the portal',rule:'PORTALS[k].people()'},{label:'View as',does:'Switches to any agency role or portal',rule:'Grouped: Agency team, Client side, Suppliers and field'},
    {label:'Back to agency',does:'Leaves the portal (S.pv=null) and opens Home',rule:'Always available'}],
  rules:['External people are not agency roles (not in ROLE_KEYS); access is by invitation link (proposed)','Bottom tab bar under 721 px, top tabs above','No Maya, tour or meeting buttons inside portals'],
  states:{empty:'A portal with no people shows its first tab with an empty-state card.',loading:'Not applicable (local data).',error:'A view that throws shows "This screen could not load."'},
  status:'roadmap',api:['GET /v1/portal/{token}/me (proposed)'],tests:['TEST pv portal frame'],code:['v6/s13_portal.js: pvRegister, pvOpen, pvShell, pvRender, pvDays, pvDayCard, pvHousehold','v6/m_portal.css']};
TESTS.push({name:'pv portal frame',run:h=>{const out=[];
  const ks=Object.keys(PORTALS);if(PV_STRICT&&ks.length<4)out.push('portals registered: '+ks.join(','));
  for(const lang of ['en','he']){S.lang=lang;
    ks.forEach(k=>{const P=PORTALS[k];const ps=P.people();if(!ps.length){out.push('no people '+k);return;}
      [P.def,ps[ps.length-1].id].forEach(id=>P.tabs.forEach(([tab])=>{pvOpen(k,id,tab);
        try{render();const hh=h.els.app.innerHTML;h.chk(hh,`pv ${k} ${id} ${tab} ${lang}`);if(lang==='en')h.scan(hh,`pv ${k} ${tab}`);
          if(hh.includes('class="side"'))out.push('agency sidebar inside portal '+k);if(!hh.includes('pv-rib'))out.push('no ribbon '+k);
          if(typeof specKey==='function'&&specKey()!=='portal:'+k+':'+tab)out.push('specKey '+k+' '+tab+' '+specKey());
          if(typeof SPEC!=='undefined'&&!SPEC['portal:'+k+':'+tab])out.push('no SPEC entry portal:'+k+':'+tab);
        }catch(e){out.push(`pv ${k} ${tab} threw ${e.message}`);}}));});}
  S.lang='en';if(ks.length){pvOpen(ks[0]);render();const sel2=h.els.app.innerHTML;ks.forEach(k=>{if(!sel2.includes(`value="pv:${k}"`))out.push('switcher lacks pv:'+k);});}
  pvExit();render();if(S.pv||!h.els.app.innerHTML.includes('class="side"'))out.push('exit did not return to the agency');
  /* days: times increase, every item placed once */
  TRIPS.filter(t=>t.stage!=='Quote').forEach(t=>{const ds=pvDays(t);if(ds.length!==t.nights+1)out.push('days '+t.id);
    if(ds.reduce((a,d)=>a+d.items.length,0)!==t.items.filter(x=>x.day>=1&&x.day<=t.nights+1).length)out.push('items '+t.id);
    ds.forEach(d=>d.items.forEach((x,i)=>{if(x.end<x.start||(i&&x.start<d.items[i-1].end))out.push('times '+t.id+' d'+d.i);}));});
  if(pvFictionalSuppliers().some(s=>s.real))out.push('real supplier in the portal list');
  /* entry links from the agency */
  S.role='manager';S.pv=null;const nas=TRIPS.find(t=>t.id==='nas');
  if(!opTasksTab(nas).includes('data-v="guide"'))out.push('no run sheet link on Tasks');
  if(!opManifestTab(nas).includes('data-v="traveler"'))out.push('no traveler link on the Master list');
  const fs=pvFictionalSuppliers()[0],rs=SUPPLIERS.find(x=>x.real);
  if(fs&&!spCardHtml(fs).includes('data-v="supplier"'))out.push('no supplier portal link');if(rs&&spCardHtml(rs).includes('data-v="supplier"'))out.push('supplier portal link on a real supplier');
  const cl=cliByName(nas.client);if(cl&&!spCliHtml(cl).includes('data-v="leader"'))out.push('no leader portal link on the client card');
  return out;}});
