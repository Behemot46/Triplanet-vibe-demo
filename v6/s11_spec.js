/* ---------- v8.1 module dv: developer notes (the demo as a living spec) ----------
   SPEC (global {} from s1_core.js) holds one entry per screen, drawer and modal; this file owns the engine, the panel
   and the entries for global pages and role homes. Trip tabs (trip:<ptab>) live in s11_spec_trip.js (loads after this file).
   Entry contract: docs/spec-v8.1-clarity.md. Keys: specKey() below.
   - devOn()/devToggle(): localStorage "triplanet-devnotes" ("1" = on). Settings menu item data-act="devnotes".
   - devPanel(): the panel HTML (English, dir=ltr, docked right, 380 px; bottom sheet on phones). Rendered outside #app by the render wrapper.
   - devMarkdown(key): one entry as Markdown (panel "Copy as Markdown" and tools/spec/export_spec.js use the same function).
   API paths follow docs/backend-plan/03-api.md (/v1/t/{tenantId}/...); a path marked (proposed) is not in that plan yet. */
const DV_KEY='triplanet-devnotes',DV_TAB='triplanet-devnotes-tab';
let DV_ON=null,DV_COL=null;
const dvGet=k=>{try{return localStorage.getItem(k);}catch(e){return null;}};
const dvSet=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
function devOn(){if(DV_ON===null)DV_ON=dvGet(DV_KEY)==='1';return DV_ON;}
function devToggle(){DV_ON=!devOn();dvSet(DV_KEY,DV_ON?'1':'0');return DV_ON;}
const dvCol=()=>{if(DV_COL===null)DV_COL=dvGet(DV_TAB)==='1';return DV_COL;};
const dvAttract=()=>{try{return !!(document.body&&document.getElementById('attract'));}catch(e){return false;}};
/* shown only when on, and never in meeting mode, the guided tour or the attract screen */
const devVisible=()=>devOn()&&!(S.meet>=0)&&!(S.tour>=0)&&!dvAttract();

/* which entry describes the screen on show: an open modal or drawer wins, then role home, trip tab, page */
function specKey(){
  if(S.form)return 'modal:form';
  if(S.tab==='suppliers'&&S.supId)return 'drawer:supplier';
  if(S.tab==='clients'&&S.cliId)return 'drawer:client';
  if(S.tab==='home')return 'home:'+(isMgr()?'manager':isAcct()?'accountant':'agent');
  if(S.tab==='trip'){const pt=S.ptab==='ops'?'odash':S.ptab;
    /* sub-views have their own entries: plan by day/components/map, proposal pdf/table/landing */
    const sub=pt==='plan'?(S.tbView||'day'):pt==='quote'?({table:'table',landing:'landing'}[S.prFmt]||'pdf'):'';
    return sub&&SPEC['trip:'+pt+':'+sub]?'trip:'+pt+':'+sub:'trip:'+pt;}
  if(S.tab==='forms')return 'page:forms';
  if(S.tab==='uikit')return 'page:uikit';
  return S.tab;
}

/* ---------- panel ---------- */
const DV_ST={live:['green','Live'],pilot:['info','Pilot'],roadmap:['amber','Roadmap']};
const dvPill=st=>{const x=DV_ST[st];return x?`<span class="pill ${x[0]}">${x[1]}</span>`:'';};
const dvRoles=r=>!r?'-':(r==='all'?'all roles':[].concat(r).join(', '));
const dvChips=a=>(a||[]).map(x=>`<code class="dv-chip">${esc(x)}</code>`).join('');
const dvList=a=>(a||[]).map(x=>`<li><code>${esc(x)}</code></li>`).join('');
const dvIsF=x=>/ = | -> |[<>]=? /.test(x);/* a rule that is a formula is set in monospace, a sentence is not */
const dvRule=a=>(a||[]).map(x=>`<li>${dvIsF(x)?`<code>${esc(x)}</code>`:esc(x)}</li>`).join('');
function dvSec(h,body){return body?`<section class="dv-s"><h4>${h}</h4>${body}</section>`:'';}
function dvEntryHtml(key,e){
  if(!e)return `<div class="dv-key"><code>${esc(key)}</code></div><div class="dv-miss" role="alert"><b>No spec yet for ${esc(key)}</b><span>Add SPEC["${esc(key)}"] in v6/s11_spec.js (global pages and role homes) or v6/s11_spec_trip.js (trip tabs).</span></div>`;
  const rl=e.roles||{},st=e.states||{};
  const acts=(e.actions||[]).length?`<ul class="dv-acts">${e.actions.map(a=>`<li><b>${esc(a.label)}</b><span>${esc(a.does)}</span>${a.rule?`<em>Guard: ${esc(a.rule)}</em>`:''}</li>`).join('')}</ul>`:'';
  const stt=['empty','loading','error'].filter(k=>st[k]).map(k=>`<li><b>${k}</b> ${esc(st[k])}</li>`).join('');
  return `<div class="dv-key"><code>${esc(key)}</code>${dvPill(e.status)}</div><h3 class="dv-title">${esc(e.title)}</h3><p class="dv-p">${esc(e.purpose)}</p>
   ${dvSec('Roles and permissions',`<p class="dv-p"><b>View</b> ${esc(dvRoles(rl.view))}<br><b>Act</b> ${esc(dvRoles(rl.act))}</p>${(e.perms||[]).length?`<div class="dv-chips">${dvChips(e.perms)}</div>`:''}`)}
   ${dvSec('Data',(e.data||[]).length?`<div class="dv-chips">${dvChips(e.data)}</div>`:'')}
   ${dvSec('Actions',acts)}
   ${dvSec('Rules',(e.rules||[]).length?`<ul class="dv-ul dv-rules">${dvRule(e.rules)}</ul>`:'')}
   ${dvSec('States',stt?`<ul class="dv-ul">${stt}</ul>`:'')}
   ${dvSec('Suggested API',(e.api||[]).length?`<ul class="dv-ul">${dvList(e.api)}</ul>`:'')}
   ${dvSec('Tests',(e.tests||[]).length?`<ul class="dv-ul">${dvList(e.tests)}</ul>`:'')}
   ${dvSec('Code',(e.code||[]).length?`<ul class="dv-ul">${dvList(e.code)}</ul>`:'')}`;
}
function devPanel(){
  const key=specKey(),e=SPEC[key];
  if(dvCol())return `<button class="dv-tab" data-act="dv-col" aria-label="Open developer notes" title="Developer notes">${ic('document')}<span>Dev notes</span></button>`;
  return `<aside class="dv-panel" dir="ltr" lang="en" aria-label="Developer notes">
   <div class="dv-h"><span class="dv-ht">${ic('document')} Developer notes</span><span class="dv-hb"><button class="dv-ib" data-act="dv-col" aria-label="Collapse developer notes" title="Collapse">${ic('right')}</button><button class="dv-ib" data-act="dv-off" aria-label="Turn developer notes off" title="Turn off">${ic('close')}</button></span></div>
   <div class="dv-body">${dvEntryHtml(key,e)}</div>
   <div class="dv-f"><button class="btn sm" data-act="dv-copy" ${e?'':'disabled'}>${ic('copy')} Copy as Markdown</button>${typeof VIEWS.uikit==='function'?`<button class="btn sm" data-act="dv-uikit">${ic('widget')} Open UI kit</button>`:''}</div></aside>`;
}

/* ---------- Markdown (panel copy and docs/handoff/screens.md) ---------- */
function devMarkdown(key,lvl){
  const e=SPEC[key],h='#'.repeat(lvl||3);
  if(!e)return `${h} ${key}\n\nNo spec yet for \`${key}\`.\n`;
  const rl=e.roles||{},st=e.states||{},o=[];
  o.push(`${h} ${e.title}`,'',`\`${key}\` · Status: ${(DV_ST[e.status]||['','-'])[1]}`,'',e.purpose,'');
  o.push(`**Roles.** View: ${dvRoles(rl.view)}. Act: ${dvRoles(rl.act)}.`+((e.perms||[]).length?` Permissions: ${e.perms.map(x=>'`'+x+'`').join(', ')}.`:''),'');
  if((e.data||[]).length)o.push(`**Data.** ${e.data.map(x=>'`'+x+'`').join(', ')}`,'');
  if((e.actions||[]).length){o.push('| Control | Does | Guard |','|---|---|---|');e.actions.forEach(a=>o.push(`| ${a.label} | ${a.does} | ${a.rule||'-'} |`));o.push('');}
  if((e.rules||[]).length){o.push('**Rules**');e.rules.forEach(x=>o.push(dvIsF(x)?`- \`${x}\``:`- ${x}`));o.push('');}
  if(st.empty||st.loading||st.error){o.push('**States**');['empty','loading','error'].forEach(k=>{if(st[k])o.push(`- ${k}: ${st[k]}`);});o.push('');}
  [['Suggested API',e.api],['Tests',e.tests],['Code',e.code]].forEach(([t,a])=>{if((a||[]).length){o.push(`**${t}**`);a.forEach(x=>o.push(`- \`${x}\``));o.push('');}});
  return o.join('\n');
}

/* ---------- wiring: render wrapper, clicks, padding ---------- */
function dvSync(){
  try{
    if(!document.body||!document.createElement)return;
    let el=document.getElementById('dvroot');
    if(!devVisible()){if(el)el.remove();document.body.classList.remove('dv-open','dv-shut');return;}
    if(!el||!el.parentNode){el=document.createElement('div');el.id='dvroot';document.body.appendChild(el);}
    const b=el.querySelector&&el.querySelector('.dv-body'),y=b?b.scrollTop:0,k=el.dataset&&el.dataset.key,key=specKey();
    el.innerHTML=devPanel();
    const nb=el.querySelector('.dv-body');if(nb&&k===key)nb.scrollTop=y;
    if(el.dataset)el.dataset.key=key;
    document.body.classList.toggle('dv-open',!dvCol());document.body.classList.toggle('dv-shut',dvCol());
  }catch(e){if(typeof console!=='undefined')console.error(e);}
}
{const r0=render;render=function(){r0();dvSync();};}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="dv"],[data-act="devnotes"]');if(!b)return;
  const a=b.dataset.act;
  if(a==='devnotes'){devToggle();S.menu=false;render();}
  else if(a==='dv-off'){DV_ON=false;dvSet(DV_KEY,'0');render();}
  else if(a==='dv-col'){DV_COL=!dvCol();dvSet(DV_TAB,DV_COL?'1':'0');render();}
  else if(a==='dv-copy'){copy(devMarkdown(specKey()));}
  else if(a==='dv-uikit'){if(typeof VIEWS.uikit==='function'){S.tab='uikit';S.menu=false;render();window.scrollTo(0,0);}}
});

/* ---------- registry ---------- */
const DV_API='/v1/t/{tenantId}';
const dvApi=l=>l.map(x=>x.replace(/^(\S+) /,'$1 '+DV_API));
function dvAdd(key,e){e.api=dvApi(e.api||[]);SPEC[key]=e;}
const DV_EMPTY_LOAD='Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.';
const DV_ERR='Not modelled in the demo. In the product show an inline retry banner and keep the last good data.';
const DV_C6='check6.js: every view renders for each role in EN and HE';

/* ===== role homes ===== */
dvAdd('home:manager',{title:'Home, owner and manager',
  purpose:'Season overview: booked revenue, expected profit, open quotes, what needs attention, approvals, team and departure readiness.',
  roles:{view:['manager'],act:['manager']},perms:['proj.viewAll','prop.approve'],
  data:['Trip.stage','Trip.qst','Trip.qdays','Trip.dep','Trip.agent','Trip.pax','Gap.st','Staff.target'],
  actions:[
   {label:'New quote',does:'Creates a Branson senior quote (44 travelers, 3 nights) for Priya and opens its General details tab.',rule:'blankQuote() then openTrip(); agent defaults to Priya when the viewer sees all files'},
   {label:'Stage card, Latest quotes row',does:'Opens the Projects list or the trip.',rule:'No guard; the manager sees every trip'},
   {label:'Approve (Approvals waiting)',does:'Opens the Quote approval tab of a quote in Approval status.',rule:'Only quotes with qst = Approval are listed'},
   {label:'Alert Open or View',does:'Jumps to the trip tab or page the alert is about.',rule:'Alerts come from alertsFor(trips, S.thresh), the first 6 that are not FYI-only'},
   {label:'Departure readiness row',does:'Opens the trip; four bars show tasks, passports, suppliers and deposits.',rule:'Non-Quote trips departing in the next 30 days'}],
  rules:['booked revenue = sum calc(t).rev over trips with stage != Quote  (portfolio().rev)','expected profit = rev - fc + comm  (portfolio().fp)','open quotes value = sum calc(t).rev over stage = Quote  (portfolio().pipeline)','closed this year = count of non-Quote trips; canceled = 3 (fixed demo figure); prior years are fictional','readiness % = tasks done, passports received (international only), suppliers Confirmed, deposits collected by amount; empty denominator counts as 100'],
  states:{empty:'noTrip(): "No trips here" card when the viewer has no visible trips',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /reports/finance-dashboard','GET /trips?stage=&agent=','GET /quote-versions?status=approval (proposed)'],
  tests:['TEST db manager and agent dashboards',DV_C6],
  code:['v6/s4_views.js: vHome, hpHero, hpStats','v6/s10_dash.js: dbMgrCards, dbApprovalsCard, dbTeamCard, dbReadiness']});

dvAdd('home:accountant',{title:'Home, accountant',
  purpose:'The money to collect and pay: receivables, payables schedule, documents to issue, FX exposure and a month-end checklist.',
  roles:{view:['accountant'],act:['accountant']},perms:['fin.view','fin.approveBills','fin.issueDocs','fin.sync'],
  data:['Group.depPaid','Group.balPaid','Trip.depDue','Trip.balDue','Invoice.amt','Invoice.paid','Line.cur','Doc.type'],
  actions:[
   {label:'Hero KPI tiles',does:'Switch the detail card to AR next 30 days, overdue, bills to approve, open gaps or commission receivable.',rule:'daDet(key); no data change'},
   {label:'Approve (bills to approve)',does:'Marks a matched supplier bill as approved for payment and removes it from the list.',rule:'Only bills whose invoice status is match and not yet paid; kept in DA_STATE.ap'},
   {label:'Issue (documents to issue)',does:'Marks a deal invoice as issued.',rule:'Only deal documents with status req; kept in DA_STATE.iss'},
   {label:'AP week row',does:'Filters the payables detail to that 7-day week.',rule:'Weeks count from TODAY; week 0 = TODAY..TODAY+6'},
   {label:'Month-end item',does:'Jumps to Invoice check, the detail card or Finance.',rule:'An item is done when its count is 0'}],
  rules:['AR next 30 = unpaid deposit or balance with due date in [TODAY, TODAY+30]  (daArNext30)','overdue = portfolio().aging, buckets 1-30, 31-60, over 60 days','AP date: Finance or Closed trips TODAY+20, Operations trips dep-14; past dates clamp to this week  (portfolio cash-out rule)','bill amount in USD = effAmt(inv) * lrate(t, l), where effAmt = amt - credit','FX exposure = unpaid foreign-currency payables at each trip locked rate  (portfolio().fxExp)'],
  states:{empty:'noTrip() when no trips are visible; each card shows its own "nothing to do" line',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /reports/cashflow','GET /supplier-invoices?status=matched','POST /supplier-invoices/{id}:confirm','POST /client-invoices/{id}:issue','GET /commissions'],
  tests:['TEST da accountant dashboard',DV_C6],
  code:['v6/s10_dacct.js: dbAcct, daArNext30, daOverdue, daBillsToApprove, daMonthEnd','v6/s5_fin.js: gapStats']});

dvAdd('home:agent',{title:'Home, sales agent',
  purpose:'One agent: own quote pipeline, next departures with readiness, tasks due this week, numbers against the annual target and pending traveler forms.',
  roles:{view:['agent'],act:['agent']},perms:['ops.tasks','ai.maya'],
  data:['Trip.agent','Trip.qst','Trip.qdays','Task.done','Task.due','Traveler.form','Staff.target'],
  actions:[
   {label:'Pipeline card',does:'Opens the quote (Approval cards open the approval tab).',rule:'Only the agent own trips; a Sent quote older than 7 days is flagged late'},
   {label:'Done (My week)',does:'Marks a task done and removes it from the list.',rule:'dbTaskDone(tripId, taskId); the agent sees only own trips'},
   {label:'Forms pending row',does:'Opens the trip People tab.',rule:'Travelers with a registration, medical or waiver form not done'},
   {label:'Departures row',does:'Opens the trip; four readiness bars.',rule:'Non-Quote trips, readiness as on the manager home'}],
  rules:['booked = sum calc(t).rev of own non-Quote trips; target = STAFF target; attainment = booked / target','margin = portfolio(own).fp / rev, compared with the team average','follow-up due = quote status Sent and qdays > 7','overdue task = not done and due before TODAY'],
  states:{empty:'noTrip(): agents see only their own files',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /trips?agent=me','GET /trips/{id}/tasks?due= (proposed)','GET /reports/agent-numbers (proposed)'],
  tests:['TEST db manager and agent dashboards',DV_C6],
  code:['v6/s10_dash.js: dbAgent, dbAgentKpis, dbWeekCard, dbNumbersCard, dbFormsCard']});

/* ===== pages (one per NAV/NAV2 key) ===== */
dvAdd('quotes',{title:'Projects (quotes and files)',
  purpose:'List of every quote and file with search, group-type filter and tabs; the entry point to a trip.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},perms:['proj.viewAll','proj.create'],
  data:['Trip.no','Trip.name','Trip.stage','Trip.qst','Trip.dep','Trip.client','Trip.seg','Trip.agent'],
  actions:[
   {label:'+ New file',does:'Creates a blank quote and opens its General details tab.',rule:'Agents become the file owner; the manager gets Priya'},
   {label:'Open',does:'Opens the trip.',rule:'Agents see only their own trips (canSee)'},
   {label:'Duplicate',does:'Creates next year quote with the same destination, group, size and client; no invoices, no travelers.',rule:'Name loses its year suffix; departure +210 days from TODAY'},
   {label:'Tabs Quotes / Files / Archive / All',does:'Filters by stage.',rule:'Quotes = stage Quote; Files = Operations or Finance; Archive = Closed'},
   {label:'Search, group type, rows per page',does:'Filters on name, client, #, destination; pages 8, 16 or all.',rule:'Client-side filter'}],
  rules:['sort = departure date ascending','tab counts use the same filter as the list, ignoring the tab','visible trips = all for manager and accountant, own for an agent'],
  states:{empty:'noTrip() when the viewer has no trips; an empty tab shows an empty table',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /trips?stage=&q=&seg=&cursor=&limit=','POST /trips','POST /trips/{id}:duplicate (proposed)'],
  tests:[DV_C6,'check6.js: win, new quote and draft flows'],
  code:['v6/s4_views.js: vQuotes','v6/s6_rest.js: blankQuote, click handler newq and dup']});

dvAdd('studio',{title:'Trip studio',
  purpose:'Turns a client request into a priced, mapped, day-by-day trip in seconds, then into an ordinary quote.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},perms:['proj.create'],
  data:['Gen.dest','Gen.seg','Gen.pax','Gen.nights','Gen.tier','Hotel.rate','Line.cost','Trip.markups'],
  actions:[
   {label:'Destination, group type, pace, hotel class chips',does:'Set the request (S.gen).',rule:'16 destinations; hotel class falls back when the catalog has none of that star level'},
   {label:'Travelers, nights sliders',does:'Set pax 12 to 60 and nights 2 to 12.',rule:'Plan has nights + 1 days'},
   {label:'Build the trip plan',does:'Runs the 5-step reading animation, then shows the plan.',rule:'genRun(); result = genPlan(S.gen)'},
   {label:'Hotel card',does:'Swaps the hotel and re-prices.',rule:'Real hotel names; rates are illustrative'},
   {label:'Create the quote',does:'Creates a Quote trip from the plan lines and items and opens its cost table.',rule:'genCreate(); same genLines + calc as any quote, so the identity holds'}],
  rules:['multi-base: hotels define bases, each attraction goes to its nearest base within 170 km, nights split by attractions','drive time from Tulsa = straight-line km * 1.12 / 100 km/h + 1 h; coach transfers and day trips = km * 1.35 / 80 km/h','price per traveler = calc(t).rev / pax; margin = planProfit / rev, ring line = S.thresh (12%)','planProfit = rev - plan + comm'],
  states:{empty:'Before the first build: big promise text and the form only',loading:'Busy panel with 5 steps while genRun() animates',error:DV_ERR},status:'pilot',
  api:['POST /studio:plan','POST /studio:create-quote','POST /pricing:preview'],
  tests:['check6.js: studio for all 16 destinations in EN and HE, gen-quote identities'],
  code:['v6/s8_gen.js: genPlan, genRun, genCreate, vStudio, stResult']});

dvAdd('clients',{title:'Clients',
  purpose:'Every group the agency serves, with trips, booked revenue and last trip; opens the client card.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['cli.view','cli.edit'],
  data:['Client.name','Client.type','Client.city','Client.source','Client.taxExempt','Trip.client','Trip.stage'],
  actions:[
   {label:'New client',does:'Opens the client form.',rule:'formOpen("client", null)'},
   {label:'Row chevron',does:'Opens the client card.',rule:'spCliOpen(name)'},
   {label:'Search',does:'Filters by name.',rule:'Client-side'}],
  rules:['list = distinct Trip.client over all trips, sorted by name','booked revenue = sum calc(t).rev of that client non-Quote trips','prospects (no trips) are in CLIENTS and appear once a trip exists for them'],
  states:{empty:'"No results match these filters." row',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /clients?q=&cursor=','POST /clients','GET /clients/{id}'],
  tests:['TEST sp suppliers table, cards, in-trip flow, client card','TEST people data',DV_C6],
  code:['v6/s7c_lists.js: vClients, alCliBody','v6/s1e_people.js: CLIENTS, cliByName']});

dvAdd('suppliers',{title:'Suppliers',
  purpose:'The supplier bank (344 suppliers) with terms, rate cards and alternatives; plus the price list and the price-list import.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['sup.edit','sup.rates'],
  data:['Supplier.name','Supplier.cat','Supplier.dest','Supplier.pref','Supplier.rating','Supplier.cur','Supplier.comm','Supplier.real'],
  actions:[
   {label:'New supplier',does:'Opens the supplier form.',rule:'Disabled without sup.edit'},
   {label:'Tabs Supplier bank / Price list / Import',does:'Switch S.sub.',rule:'Import parses a messy price list into rows with flags before adding them'},
   {label:'Filters and search',does:'Destination, category, preference, free text.',rule:'Sorted by spend then by trips used'},
   {label:'Row chevron',does:'Opens the supplier card.',rule:'spOpen(id)'}],
  rules:['spend and trips = per supplier over lines of visible trips (spUse)','real suppliers (real = true) show brand badge and star level, never rating, reply time or negative wording','rate card = season x pax band x variant (rateFor)'],
  states:{empty:'Empty table body when a filter matches nothing',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /suppliers?dest=&cat=&q=','POST /suppliers','GET /suppliers/{id}/rates'],
  tests:['TEST suppliers: data, coverage, rates, real-brand rules','TEST sp suppliers table, cards, in-trip flow, client card'],
  code:['v6/s10_sup.js: spPage, spList, spFiltered','v6/s6_rest.js: vSuppliers (price list, import)','v6/s1d_data.js: SUPPLIERS, rateFor']});

dvAdd('hotels',{title:'Hotels',
  purpose:'Real hotel catalog (65) by brand and destination, with group rates and the files using each; room blocks by trip below.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['cat.edit','ops.blocks'],
  data:['Hotel.name','Hotel.family','Hotel.dest','Hotel.stars','Hotel.rate','Block.held','Block.used','Block.cutoff'],
  actions:[
   {label:'New hotel',does:'Opens the hotel form.',rule:'formOpen("hotel", null)'},
   {label:'Brand chips, destination, search',does:'Filter the catalog.',rule:'Client-side'},
   {label:'Row chevron',does:'Opens the supplier card of that hotel.',rule:'Only when a supplier with that name exists, else a toast'},
   {label:'Room blocks row',does:'Opens the trip Master list tab.',rule:'Exposure = unreleased rooms x nights x rate'}],
  rules:['rate and ratings are illustrative; every catalog entry carries a src URL','a real hotel name never sits next to negative wording (brand rule)','release exposure = (held - used) * nights * lodging cost, when the release date (dep - 30) has passed  (releaseRisk)'],
  states:{empty:'"No results match these filters."',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /reference/hotels?q=&dest=','GET /catalog-items?kind=hotel','POST /catalog-items:import-from-reference','GET /trips/{id}/room-blocks'],
  tests:['TEST ops tasks, master list, blocks','check6.js: hotels screen, real-brand guard'],
  code:['v6/s7c_lists.js: vHotelsList','v6/s10_ops.js: opBlocksCard','v6/s1c_catalog.js: CATALOG']});

dvAdd('activities',{title:'Activities',
  purpose:'Catalog of venues and attractions (82) with price per person and commission; feeds the plan day-load check.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['cat.edit'],
  data:['Venue.name','Venue.dest','Venue.city','Venue.kind','Venue.cost','Venue.comm','Venue.hrs'],
  actions:[
   {label:'New activity',does:'Opens the activity form.',rule:'formOpen("activity", null)'},
   {label:'Location, Voucher only, Group rate only, search',does:'Filter the list.',rule:'Voucher only = commission > 0; group rate only = cost > 0'},
   {label:'Row chevron',does:'Shows a toast; the detail page is in the full product.',rule:'No detail screen in the demo'}],
  rules:['each site brings supplier, cost per person, commission and estimated hours','estimated hours feed the day-load warning (over 9 h) on the plan tab'],
  states:{empty:'"No results match these filters."',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /reference/venues?q=&dest=','GET /catalog-items?kind=activity','POST /catalog-items'],
  tests:[DV_C6,'check6.js: real-brand guard'],
  code:['v6/s7c_lists.js: vActivitiesList, alActRows','v6/s1c_catalog.js: CATALOG.venues']});

dvAdd('templates',{title:'Templates',
  purpose:'Past trips become templates; duplicating makes next year quote. Day templates add a ready day to a plan.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},perms:['price.templates','proj.create'],
  data:['Trip.name','Trip.dest','Trip.seg','Trip.nights','Trip.items','Item.name','Item.hrs','Item.day'],
  actions:[
   {label:'Duplicate (trip card)',does:'Creates a new quote with the same plan and suppliers, without invoices or travelers.',rule:'Same handler as Duplicate on Projects'},
   {label:'Day template list',does:'Read only here; templates are added from the plan tab.',rule:'addtpl runs on the plan tab with an open day'}],
  rules:['cards = visible non-Quote trips','a day template is a list of [site, hours] pairs'],
  states:{empty:'No cards when the viewer has no non-Quote trips',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /trips?stage=closed','POST /trips/{id}:duplicate (proposed)','GET /day-templates (proposed)'],
  tests:[DV_C6],
  code:['v6/s6_rest.js: vTemplates, DAYTPL click handlers (dup, addtpl)']});

dvAdd('finance',{title:'Finance dashboard',
  purpose:'All booked trips in one place: planned vs expected profit, receivables, 12-month cash flow, FX scenario and profit per traveler.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant']},perms:['fin.view'],
  data:['Trip.stage','Trip.rate','Line.cost','Line.cur','Invoice.amt','Invoice.paid','Group.depPaid','Group.balPaid'],
  actions:[
   {label:'Filters group type, stage, agent',does:'Re-compute the whole page for the filtered trips.',rule:'Quotes stay in the pipeline line and never count as revenue'},
   {label:'Currency move slider (-10 to +10%)',does:'Shows the impact on open foreign-currency payables.',rule:'S.shock; no stored change'},
   {label:'Trip name link',does:'Opens the trip Finance tab.',rule:'No guard beyond canSee'}],
  rules:['planProfit = rev - plan + comm','planProfit - amtDiff - fx - fcProfit = 0  (identity per trip, holds for the portfolio)','expected profit fp = rev - fc + comm','receivable = rev - collected; late = unpaid deposit or balance past its due date','FX impact = open foreign payables at locked rate * shock %'],
  states:{empty:'"No booked trips in this filter" with the pipeline value',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /reports/finance-dashboard?seg=&stage=&agent=','GET /reports/cashflow','GET /reports/trip-pnl/{tripId}'],
  tests:[DV_C6,'check6.js: finance identities'],
  code:['v6/s5_fin.js: vFinance','v6/s1_core.js: calc, portfolio, groupsCalc']});

dvAdd('gaps',{title:'Invoice check',
  purpose:'Every supplier bill line matched to what was quoted; differences are found, explained and chased until credited.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant']},perms:['fin.view','fin.dispute'],
  data:['Invoice.no','Invoice.amt','Invoice.credit','Invoice.st','Gap.kind','Gap.diff','Line.cost','Line.sup'],
  actions:[
   {label:'Status and type filters',does:'Filter the gap table (open, disputed, credited, accepted, all).',rule:'S.gF, S.gK'},
   {label:'Trip link',does:'Opens the trip Finance tab where the gap card lives.',rule:'Dispute email, credit and accept actions are on that tab'},
   {label:'Gap kinds',does:'rooms, qty, rate, comp, extra, dup, under, missing.',rule:'kind = invoice kind, else under when diff < 0, else rate'}],
  rules:['diff = effAmt(inv) - planC(line), effAmt = amt - credit; zero diff = match','a gap is open or disputed until credited or accepted  (isOpenGap)','under = invoice below plan (a saving); missing = no invoice on a Finance or Closed trip','about 20% of invoices carry a gap: an estimate, not a benchmark','a real hotel or venue never appears in a gap (brandSwap guard)'],
  states:{empty:'No gap rows: "No gaps."',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /gaps?status=&kind=','POST /gaps/{id}:dispute','POST /gaps/{id}:accept','POST /supplier-credits'],
  tests:[DV_C6,'check6.js: dispute and credit flows, real-brand guard'],
  code:['v6/s5_fin.js: vGaps','v6/s1_core.js: invStatus, tripGaps, gapStats']});

dvAdd('leaks',{title:'Profit leaks',
  purpose:'Where planned profit went: a bridge from planned to expected profit by gap kind and FX, cut by trip, agent, group type or supplier.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['fin.view'],
  data:['Trip.agent','Trip.seg','Line.sup','Gap.kind','Gap.diff','Invoice.credit','Block.held','Block.used'],
  actions:[
   {label:'Breakdown tabs Trip / Agent / Group type / Supplier',does:'Change the dimension (S.lkDim).',rule:'Rows with no leak are hidden until Show more'},
   {label:'Row or heatmap cell',does:'Scopes the whole page to that agent, group type or trip.',rule:'S.lkSel = dim|key; a trip row opens its Finance tab'},
   {label:'Your numbers inputs',does:'Estimates a yearly leak for a visitor agency.',rule:'trips * revenue * demo leak rate; an illustration, not data'}],
  rules:['leak = planned profit - expected profit','bridge = amtDiff by kind (rooms, rate, comp, dup, extra, qty, under) + fx, so it ties to planProfit - fcProfit','recoverable = open or disputed gaps with amtDiff > 0','at risk, outside the bridge: unreleased block rooms, late client payments, missing invoices, uncollected commission','commission collected uses a fixed rule per line (commPaid) so figures are stable'],
  states:{empty:'noTrip() when no non-Quote trips are visible; "No data." in the table',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /reports/leaks?scope=&dim=','GET /gaps?status=open'],
  tests:['check6.js: leak-bridge identities per scope and per dimension',DV_C6],
  code:['v6/s7_leak.js: leakModel, leakRows, vLeaks, wfSvg','v6/s9a_books.js: yourNumbers']});

dvAdd('books',{title:'Accounting sync',
  purpose:'Connects an accounting system, imports supplier bills, maps objects, posts bills, holds and credits, and logs every sync (simulated).',
  roles:{view:['manager','accountant'],act:['manager','accountant']},perms:['fin.sync'],
  data:['Acct.sys','Acct.phase','Acct.opt','Acct.log','Invoice.no','Invoice.amt','Trip.id'],
  actions:[
   {label:'Connect (system card)',does:'Runs the connect animation against a sample company file.',rule:'QuickBooks Online and Xero lead in English; Priority and Hashavshevet in Hebrew; all four in both'},
   {label:'Sync now',does:'Re-reads the sample bills.',rule:'Simulated'},
   {label:'Disconnect',does:'Clears the connection.',rule:'Resets A().phase'},
   {label:'Posting rule toggles',does:'Auto-post approved bills, tag each line, post credits.',rule:'A bill with an open gap is held from payment until handled'}],
  rules:['mapping per system: Trip -> Class or tracking category, Supplier -> Vendor, Supplier invoice -> Bill, Supplier credit -> Vendor credit','gap actions elsewhere (dispute, credit, accept) add rows to the sync log','page is badged Pilot: live connections are product work'],
  states:{empty:'Before connecting: four system cards',loading:'Connecting animation, then the synced view',error:DV_ERR},status:'pilot',
  api:['GET /accounting/connections','POST /accounting/{system}:connect','POST /accounting/connections/{id}:sync','GET /accounting/connections/{id}/log','DELETE /accounting/connections/{id}'],
  tests:['check6.js: every accounting system in both languages, posting log'],
  code:['v6/s9a_books.js: vBooks, ACCT, acLog']});

dvAdd('ai',{title:'Maya, AI assistant',
  purpose:'Ask the data in plain language: 28 scripted questions, plus optional live answers from Claude for typed questions.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['ai.maya','ai.live'],
  data:['QS.id','QS.he','QS.en','Chat.r','Chat.t','Live.key'],
  actions:[
   {label:'Question chips',does:'Ask a ready-made question; always scripted.',rule:'Meeting mode stays scripted'},
   {label:'Typed question',does:'Routes to a scripted answer, or goes live when a key is set.',rule:'Live: claude-opus-5-5, streaming, grounded on liveSnapshot(); falls back to scripted on no key, offline, error, refusal or 25 s without a word'},
   {label:'Clear chat',does:'Empties the conversation.',rule:'S.chat = []'}],
  rules:['the header pill shows the real mode: Scripted or Live answers - Claude; a scripted answer is never labeled live','API key is entered on the booth laptop and kept in localStorage only; never in the repo or the HTML','snapshot carries no invalid numbers and no real brand in a gap, and its leak total ties to leakModel()'],
  states:{empty:'Greeting message and question groups',loading:'Streaming text while a live answer arrives',error:'Scripted answer with a small note explaining the fallback'},status:'pilot',
  api:['POST /ai/threads','POST /ai/threads/{id}/messages (SSE)','GET /ai/usage'],
  tests:['check6.js: all 25 Maya routes, live snapshot checks, Maya tips'],
  code:['v6/s6_rest.js: vAI, QS','v6/s9c_live.js: liveAsk, liveSnapshot','v6/s9d_maya.js: mayaTip']});

dvAdd('status',{title:"What's live",
  purpose:'Honesty layer: every feature marked Live, Pilot or Roadmap. A demo-only screen, not a product page.',
  roles:{view:'all',act:'all'},perms:[],
  data:['FEAT.id','FEAT.status','FEAT.view'],
  actions:[{label:'Open (feature row)',does:'Jumps to the screen that shows the feature.',rule:'Only rows with a view key that exists'}],
  rules:['Live = seen on app.triplanet.io screens; Pilot = working in the demo and offered to pilot customers; Roadmap = not available','statuses are confirmed by the owner before each show; income, vouchers, trip P&L and currencies are Pilot since 13 Nov 2026'],
  states:{empty:'Not applicable: static table',loading:'None',error:'None'},status:'live',
  api:[],tests:['check6.js: status screen in EN and HE'],code:['v6/s9b_status.js: FEAT, vStatus']});

dvAdd('users',{title:'Users',
  purpose:'The agency staff by role, with their file counts; "View as this user" switches the demo to that person.',
  roles:{view:['manager'],act:['manager']},perms:['users.manage'],
  data:['Staff.name','Staff.role','Staff.target','Trip.agent'],
  actions:[{label:'View as this user',does:'Switches S.role so every screen shows what that user sees.',rule:'Demo-only impersonation; the product would use an invite and role assignment'}],
  rules:['page is gated: without users.manage it renders noAccess()','files = all trips for the owner, own trips for an agent','roles: owner (manager), accountant, six agents'],
  states:{empty:'Not applicable: the staff list is fixed',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /members','POST /invitations','PATCH /members/{id}','DELETE /members/{id}'],
  tests:['TEST st settings','TEST people data',DV_C6],
  code:['v6/s6_rest.js: vUsers','v6/s9_boot.js: NAV_PERM wrapper']});

dvAdd('settings',{title:'Settings',
  purpose:'Organization formats, roles and permissions matrix, stages and statuses, and links to forms and accounting sync.',
  roles:{view:['manager','accountant','agent'],act:['manager']},perms:['settings.edit','users.roles','settings.stages'],
  data:['Org.name','Org.cur','Org.tax','Perm.key','Perm.role','Stage.items'],
  actions:[
   {label:'Tabs Organization / Roles / Stages / Forms / Integrations',does:'Switch S.stSub.',rule:'Read-only banner without settings.edit'},
   {label:'Permission switch',does:'Overrides a permission for admin, agent or accountant.',rule:'Owner column is locked; 8 permissions are enforced in the demo, the rest are matrix only'},
   {label:'Organization fields',does:'Edit name, logo letter, currency, date, time, timezone, tax.',rule:'Preview line only; the rest of the app is not reformatted'},
   {label:'Stages editor',does:'Rename, recolor, reorder, add statuses.',rule:'Preview only; trip data does not change'}],
  rules:['effective permission = S.perms override else role default  (can(k))','enforced (13, ST_ENFORCED): users.manage, fin.sync, fin.view, prop.approve, fin.issueDocs, settings.edit, settings.stages, price.edit, forms.build, sup.edit, sup.swap, ops.suppliers, cli.edit','40 permissions in 9 groups'],
  states:{empty:'Not applicable',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /roles (proposed)','PATCH /roles/{role}/permissions (proposed)','GET /settings (proposed)','PATCH /settings (proposed)'],
  tests:['TEST st settings'],
  code:['v6/s10_settings.js: vSettings, stRoles, stSetPerm','v6/s1e_people.js: PERMS, can']});

dvAdd('credits',{title:'Photo credits',
  purpose:'Author, license and source for every embedded photo (open licenses require it). Also states that staff headshots are AI-generated.',
  roles:{view:'all',act:'all'},perms:[],
  data:['Photo.kind','Photo.title','Photo.author','Photo.license','Photo.source_url'],
  actions:[{label:'Source and license links',does:'Open the original file and its license.',rule:'External links; offline they do nothing'}],
  rules:['only public domain, CC0 and CC BY licenses are allowed (no NC, no ND)','every embedded photo must have a credit with author and source'],
  states:{empty:'A group with no photos is not shown',loading:'None',error:'None'},status:'live',
  api:[],tests:['check6.js: photo credits and license check'],code:['v6/s9b_status.js: vCredits']});

/* ===== pages reached from other pages ===== */
dvAdd('page:forms',{title:'Form builder and traveler forms',
  purpose:'Build registration, medical, waiver and room-preference forms, preview on desktop or phone, and send them to travelers; also entity custom fields.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},perms:['forms.build'],
  data:['Form.id','Form.fields','Form.pub','Form.version','Traveler.form','Field.type','Field.req'],
  actions:[
   {label:'Add, move, duplicate, delete field',does:'Edit the draft definition of the selected form.',rule:'Disabled without forms.build'},
   {label:'Publish',does:'Saves the draft as a new version; entity forms also write custom fields.',rule:'fbPublish(); version + 1'},
   {label:'Send to travelers',does:'Sends the form link for the chosen trip.',rule:'fbSend(); progress is tracked per traveler'},
   {label:'Responses tab',does:'Shows completion by traveler for a trip.',rule:'Form status: done, sent, not sent'}],
  rules:['4 traveler forms: reg, med, waiver, room; waiver wording is sample text for counsel to replace','field types: text, email, tel, number, money, select, multi, date, toggle, textarea, file, section, repeater','Settings > Forms links here; the page is not in the sidebar'],
  states:{empty:'A form with no fields shows an empty canvas with the palette',loading:DV_EMPTY_LOAD,error:'Validation errors list per field; nothing saved until valid'},status:'pilot',
  api:['GET /form-definitions (proposed)','PUT /form-definitions/{id} (proposed)','POST /trips/{id}/forms/{formId}:send (proposed)','GET /trips/{id}/forms/{formId}/responses (proposed)'],
  tests:['TEST form builder','TEST forms engine'],
  code:['v6/s10_fbuild.js: VIEWS.forms, fbPublish, fbSend','v6/s10_forms.js: formRender, FM_TYPES']});

dvAdd('page:uikit',{title:'UI kit',
  purpose:'Live examples of every component with class names and usage notes; the visual reference for developers.',
  roles:{view:'all',act:'all'},perms:[],
  data:[],
  actions:[{label:'Open UI kit (developer notes)',does:'Jumps to this page from the panel footer or Settings.',rule:'Only when VIEWS.uikit exists'}],
  rules:['tokens come from v6/theme.css (var(--primary), var(--panel), ...); no literal colors','logical CSS properties only, so Hebrew RTL works'],
  states:{empty:'Not applicable',loading:'None',error:'None'},status:'live',
  api:[],tests:[],code:['v6/s11_uikit.js: VIEWS.uikit']});

/* ===== drawers and modals ===== */
dvAdd('drawer:supplier',{title:'Supplier card',
  purpose:'One supplier: contact, payment terms, cancellation policy, documents, performance, rate card and trips with spend.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['sup.edit','sup.rates'],
  data:['Supplier.contact','Supplier.terms','Supplier.cancel','Supplier.docs','Supplier.rating','Rate.season','Rate.band','Line.sup'],
  actions:[
   {label:'Back',does:'Closes the card; returns to the trip when opened from one.',rule:'spClose(); S.spBack remembers the trip tab'},
   {label:'Edit',does:'Opens the supplier form.',rule:'Disabled with a reason when the role lacks sup.edit'},
   {label:'Tabs Overview / Rate card / Trips and spend',does:'Switch S.spTab.',rule:'Rate card = season x pax band x variant'}],
  rules:['a real supplier (real = true) shows a brand badge and stars; no rating, reply time or invented documents','performance (accuracy, reply time) shows for fictional suppliers only','trips and spend come from lines of visible trips  (spUse)'],
  states:{empty:'Trips tab: "No trips yet" line when the supplier is unused',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'pilot',
  api:['GET /suppliers/{id}','PATCH /suppliers/{id}','GET /suppliers/{id}/rates','GET /suppliers/{id}/trips (proposed)'],
  tests:['TEST sp suppliers table, cards, in-trip flow, client card','TEST suppliers: data, coverage, rates, real-brand rules'],
  code:['v6/s10_sup.js: spCardHtml, spOpen, spClose']});

dvAdd('drawer:client',{title:'Client card',
  purpose:'One client: contact, details, open lead, notes, trips, and a finance tab with billed and received per trip.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['cli.view','cli.edit'],
  data:['Client.contact','Client.type','Client.taxExempt','Client.lead','Client.notes','Doc.type','Doc.amt'],
  actions:[
   {label:'Back',does:'Closes the card.',rule:'spCliClose()'},
   {label:'Edit',does:'Opens the client form.',rule:'Disabled with a reason without cli.edit, or for a client that only exists as a trip name'},
   {label:'Trip link',does:'Opens the trip.',rule:'Agents see only their own trips'}],
  rules:['billed = deal invoices of the client non-Quote trips; received = tax invoices (receipts); open = billed - received','booked = sum calc(t).rev; quotes do not issue invoices'],
  states:{empty:'Finance tab: "Nothing billed yet. Quotes do not issue invoices."',loading:DV_EMPTY_LOAD,error:DV_ERR},status:'live',
  api:['GET /clients/{id}','PATCH /clients/{id}','GET /clients/{id}/finance (proposed)'],
  tests:['TEST sp suppliers table, cards, in-trip flow, client card'],
  code:['v6/s10_sup.js: spCliHtml, spCliFin, spCliOpen']});

dvAdd('modal:form',{title:'Entity form (modal)',
  purpose:'One schema-driven form for supplier, client, user, activity and hotel: validation, dirty check, save to the local dataset.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},perms:['sup.edit','cli.edit','cat.edit'],
  data:['FormSchema.fields','FormDraft.errors','FormDraft.dirty','Field.req','Field.showIf'],
  actions:[
   {label:'Save',does:'Validates, saves through the schema onSave, closes and toasts.',rule:'formSave(); invalid fields focus the first error and nothing is saved'},
   {label:'Cancel, Esc',does:'Closes without saving.',rule:'Asks for confirmation when the draft is dirty (formClose)'},
   {label:'Repeater add or remove row',does:'Edits lists such as contacts or cancellation steps.',rule:'Dotted paths, for example cancel.0.d'}],
  rules:['validation runs on blur and on save: required, email, phone, number range, money, pattern','showIf hides a field and skips its validation','field types: text email tel number money select multi date toggle textarea file section repeater'],
  states:{empty:'New record starts with schema defaults',loading:DV_EMPTY_LOAD,error:'Per-field message under the input and a summary on submit'},status:'pilot',
  api:['POST /suppliers','PATCH /suppliers/{id}','POST /clients','PATCH /clients/{id}','POST /catalog-items'],
  tests:['TEST forms engine','TEST form builder'],
  code:['v6/s10_forms.js: formOpen, formSave, formValidate, FORM_SCHEMAS']});

/* ---------- tests: coverage, panel render, hidden in meeting mode and the tour ---------- */
const DV_OWNED=()=>{
  const k=[];[...NAV,...NAV2].forEach(n=>{if(n[0]==='home')k.push('home:manager','home:accountant','home:agent');else k.push(n[0]);});
  k.push('credits','page:forms','page:uikit','drawer:supplier','drawer:client','modal:form');return [...new Set(k)];
};
const DV_TRIP=()=>PTABS.map(p=>p[0]).filter(k=>k!=='ops').map(k=>'trip:'+k);
TESTS.push({name:'dv developer notes',run:h=>{const out=[],S0_={role:S.role,tab:S.tab,lang:S.lang,ptab:S.ptab},on0=DV_ON;
  const owned=DV_OWNED(),miss=owned.filter(k=>!SPEC[k]);
  if(miss.length)out.push('no SPEC entry for: '+miss.join(', '));
  const tm=DV_TRIP().filter(k=>!SPEC[k]);
  if(tm.length)out.push('trip tabs without a SPEC entry: '+tm.join(', '));
  /* entry shape */
  Object.keys(SPEC).forEach(k=>{const e=SPEC[k];if(!e||typeof e!=='object'){out.push('entry not an object '+k);return;}if(e.redirect){if(!SPEC['trip:'+e.redirect]&&!SPEC[e.redirect])out.push(k+' redirects to a missing entry');return;}
    ['title','purpose'].forEach(f=>{if(!e[f]||typeof e[f]!=='string')out.push(k+' missing '+f);});
    if(!DV_ST[e.status])out.push(k+' bad status '+e.status);
    ['perms','data','actions','rules','api','tests','code'].forEach(f=>{if(!Array.isArray(e[f]))out.push(k+' '+f+' not an array');else{const mx=f==='data'?20:8;if(e[f].length>mx)out.push(k+' '+f+' has '+e[f].length+' items (max '+mx+')');}});
    (e.actions||[]).forEach((a,i)=>{if(!a||!a.label||!a.does)out.push(k+' action '+i+' incomplete');});
    if(!e.roles||!e.roles.view||!e.roles.act)out.push(k+' roles incomplete');
    if(!e.states||!e.states.empty)out.push(k+' states.empty missing');
    if(/[֐-׿]/.test(JSON.stringify(e)))out.push(k+' has Hebrew (notes are English)');
    if(/NaN|undefined|\[object/.test(JSON.stringify(e)))out.push(k+' bad token');});
  /* status agrees with FEAT where a feature points at the screen */
  owned.forEach(k=>{const f=typeof featOf==='function'?featOf(k):null;if(f&&SPEC[k]&&SPEC[k].status!==f[1])out.push(`${k} status ${SPEC[k].status} vs FEAT ${f[1]}`);});
  /* specKey resolves each owned key from state, and the panel renders it */
  DV_ON=true;
  const set=k=>{S.form=null;S.supId=null;S.cliId=null;S.role='manager';S.lang='en';
    if(k.startsWith('home:')){S.tab='home';S.role=k==='home:manager'?'manager':k==='home:accountant'?'accountant':AGENTS[0];}
    else if(k==='drawer:supplier'){S.tab='suppliers';S.supId=SUPPLIERS[0].id;}
    else if(k==='drawer:client'){S.tab='clients';S.cliId=CLIENTS[0].id;}
    else if(k==='modal:form'){S.tab='suppliers';S.form={id:'supplier'};}
    else if(k==='page:forms')S.tab='forms';else if(k==='page:uikit')S.tab='uikit';else S.tab=k;};
  owned.forEach(k=>{set(k);
    if(specKey()!==k)out.push('specKey '+specKey()+' != '+k);
    ['en','he'].forEach(l=>{S.lang=l;const html=devPanel();h.chk(html,'dv panel '+k+' '+l);
      if(!html.includes('data-act="dv-copy"')&&!dvCol())out.push('no copy button '+k);
      if(!html.includes(esc(SPEC[k].title)))out.push('panel lacks title '+k);});
    S.lang='en';const md=devMarkdown(k);if(!/^### /.test(md)||/undefined/.test(md))out.push('markdown '+k);});
  /* an unknown key shows the red note */
  S.form=null;S.supId=null;S.cliId=null;S.tab='trip';S.ptab='__nope__';
  if(specKey()!=='trip:__nope__'||!/No spec yet for trip:__nope__/.test(devPanel()))out.push('missing-entry note');
  /* hidden in meeting mode and the tour; shown otherwise; off when toggled off */
  S.tab='home';S.meet=0;if(devVisible())out.push('visible in meeting mode');S.meet=-1;
  S.tour=0;if(devVisible())out.push('visible in the tour');S.tour=-1;
  if(!devVisible())out.push('not visible when on');
  DV_ON=false;if(devVisible())out.push('visible when off');
  DV_ON=on0;S.role=S0_.role;S.tab=S0_.tab;S.lang=S0_.lang;S.ptab=S0_.ptab;S.form=null;
  console.log('SPEC entries',Object.keys(SPEC).length,'owned',owned.length,'trip',DV_TRIP().filter(k=>SPEC[k]).length+'/'+DV_TRIP().length);
  return out;}});
