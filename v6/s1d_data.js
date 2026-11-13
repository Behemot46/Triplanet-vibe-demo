/* v8 data module: suppliers, rate cards, supplier alternatives (docs/spec-v8-parity.md 3.1, 3.2 and amendments A9-A12).
   Loads after s1c_catalog.js and before brandSwap (s8_gen.js), so hotel names on trips change later: every lookup works by the
   line's current `sup` name at call time. Pure data and pure functions, no UI, deterministic (rng with fixed seeds, no clock).
   Public API: SUPPLIERS, SUP_BY, supByName(name), incumbentOf(line,t?), SEASONS, seasonOf(iso), BANDS, bandOf(pax),
   rateCard(sup), rateFor(sup,iso,pax,variantKey?), altCost(t,line,sup), altsFor(t,line), lineSub(line), SUP_FICT (generated names).
   Real brands (real:true): no rating, no replyHrs, pref High/Medium, docs null, contact "Group sales desk", showPerf:false.
   Terms: depPct = % deposit, depDays = days after booking the deposit is due, balDays = days before arrival the balance is due.
   Cancellation: [[daysBefore, penaltyPct], ...] descending days. */
/* English singular/plural helper: PLN(n,'invoice','invoices') */
const PLN=(n,one,many)=>n===1?one:many;
const SD_h=s=>{let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
const SD_slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const SD_dom=s=>SD_slug(s).replace(/-/g,'').slice(0,22);
const SD_pad=n=>String(n).padStart(2,'0');
const SD_pick=(R,a)=>a[Math.floor(R()*a.length)];

/* ---------- seasons, pax bands ---------- */
const SEASONS={Low:[1,2,11],Shoulder:[3,4,10,12],High:[5,6,7,8,9]};
const SD_SMULT={Low:.9,Shoulder:1,High:1.12};
const seasonOf=isoDate=>{const m=+String(isoDate).slice(5,7);return Object.keys(SEASONS).find(k=>SEASONS[k].includes(m))||'Shoulder';};
const BANDS=[[10,19],[20,34],[35,49],[50,60]];
const SD_bandIdx=pax=>pax<20?0:pax<35?1:pax<50?2:3;
const bandOf=pax=>BANDS[SD_bandIdx(+pax||0)];
const SD_PERCAP={'room-night':1,person:1,meal:1};
const SD_BMULT=[1.04,1,.97,.95];

/* ---------- category templates ---------- */
const SD_SUB={
  hotel:{cat:'Lodging',unit:'room-night',comm:[8,12],dep:[10,25],
    v:[['twin','Twin room','חדר זוגי',1],['single','Single room','חדר יחיד',.95],['triple','Triple room','חדר משולש',1.12],['quad','Quad room','חדר רביעייה',1.22]],
    can:[[[90,0],[60,25],[30,50],[14,100]],[[60,0],[30,30],[14,60],[7,100]],[[120,0],[75,20],[45,50],[21,100]]],
    role:['Group sales manager','Director of sales','Group reservations'],
    note:[['Group-friendly property with a dedicated sales desk.','נכס ידידותי לקבוצות עם מחלקת מכירות ייעודית.'],['Block-booking specialist with flexible release terms.','מתמחה בחסימות חדרים עם תנאי שחרור גמישים.'],['Complimentary room ratio for groups of 20 and over.','יחס חדרים חינם לקבוצות של 20 משתתפים ומעלה.']]},
  coach:{cat:'Transport',unit:'day',comm:[4,8],dep:[20,30],
    v:[['full','Full coach, 55 seats','אוטובוס מלא, 55 מקומות',1],['midi','Midi coach, 35 seats','מידי-באס, 35 מקומות',.72],['mini','Minibus, 24 seats','מיניבוס, 24 מקומות',.5]],
    can:[[[60,0],[30,25],[14,50],[3,100]],[[45,0],[21,40],[7,100]],[[90,10],[45,30],[21,60],[7,100]]],
    role:['Charter manager','Operations manager','Group charter desk'],
    note:[['Motorcoach charter with trip-length contracts and a driver room policy.','השכרת אוטובוסים לקבוצות עם חוזה לאורך הטיול.'],['Late-model coaches with restroom and wifi on request.','אוטובוסים חדשים עם שירותים ו-wifi לפי בקשה.'],['Charter and step-on service for tour groups.','שירות שכר ומדריך מצטרף לקבוצות תיירים.']]},
  shuttle:{cat:'Transport',unit:'transfer',comm:[3,7],dep:[0,20],
    v:[['coach','Coach transfer','העברה באוטובוס',1],['mini','Minibus transfer','העברה במיניבוס',.62]],
    can:[[[30,0],[14,50],[2,100]],[[45,0],[21,25],[7,100]],[[14,0],[3,50],[1,100]]],
    role:['Dispatch manager','Group transfers desk','Operations manager'],
    note:[['Airport group transfers with flight tracking.','העברות קבוצתיות משדה התעופה עם מעקב טיסות.'],['Meet-and-greet and luggage handling for groups.','קבלת פנים וטיפול במזוודות לקבוצות.'],['Scheduled and on-demand group shuttles.','הסעות קבוצתיות מתוזמנות ולפי דרישה.']]},
  guide:{cat:'Guide',unit:'day',comm:[0,6],dep:[10,25],
    v:[['en','English-speaking guide','מדריך דובר אנגלית',1],['es','Spanish-speaking guide','מדריך דובר ספרדית',1.1]],
    can:[[[30,0],[14,50],[3,100]],[[45,0],[21,30],[7,100]],[[60,0],[30,25],[10,100]]],
    role:['Guide coordinator','Head of guiding','Booking desk'],
    note:[['Licensed local guides for church, school and senior groups.','מדריכים מורשים מקומיים לקבוצות כנסיה, בתי ספר וגיל הזהב.'],['Step-on and full-day guiding in English.','הדרכה במתכונת מדריך מצטרף ויום מלא באנגלית.'],['Small guide collective with group-leader briefings.','קולקטיב קטן של מדריכים עם תדרוך למנהיגי קבוצה.']]},
  meal:{cat:'Meals',unit:'meal',comm:[0,6],dep:[10,30],
    v:[['lunch','Group lunch','ארוחת צהריים לקבוצה',1],['dinner','Group dinner','ארוחת ערב לקבוצה',1.28],['buffet','Buffet meal','ארוחה מסוג בופה',.9]],
    can:[[[14,0],[7,50],[2,100]],[[21,0],[10,30],[3,100]],[[30,0],[14,25],[5,100]]],
    role:['Banquet manager','Group dining manager','Events desk'],
    note:[['Set group menus with dietary options on request.','תפריטים קבועים לקבוצות עם אפשרויות תזונה לפי בקשה.'],['Seats large groups with a pre-ordered menu.','מארח קבוצות גדולות עם תפריט שהוזמן מראש.'],['Family-style group meals.','ארוחות קבוצתיות בסגנון משפחתי.']]},
  act:{cat:'Activities',unit:'person',comm:[0,10],dep:[0,25],
    v:[['std','Group admission','כניסה קבוצתית',1]],
    can:[[[30,0],[14,50],[3,100]],[[21,0],[7,50],[1,100]],[[45,0],[21,25],[7,100]]],
    role:['Group sales','Group reservations','Tour desk'],
    note:[['Group admission, advance booking required.','כניסה קבוצתית, נדרשת הזמנה מראש.'],['Group rates and guided options.','תעריפי קבוצות ואפשרויות הדרכה.'],['Timed group entry.','כניסה קבוצתית בשעה קבועה.']]},
  air:{cat:'Transport',unit:'person',comm:[0,3],dep:[10,25],
    v:[['econ','Economy group fare','תעריף קבוצתי במחלקת תיירים',1],['prem','Premium economy group fare','תעריף קבוצתי במחלקת פרימיום',1.35]],
    can:[[[60,10],[30,50],[14,75],[0,100]],[[90,0],[45,25],[21,60],[0,100]],[[75,10],[45,35],[21,70],[0,100]]],
    role:['Group air specialist','Group desk manager','Air desk'],
    note:[['Group air desk: name list, deposit and ticketing deadlines.','מחלקת טיסות קבוצתיות: רשימת שמות, מקדמה ומועדי הנפקה.'],['Negotiated group fares across major carriers.','תעריפי קבוצות במשא ומתן מול חברות תעופה מובילות.']]},
  ins:{cat:'Insurance',unit:'person',comm:[10,15],dep:[100,100],
    v:[['std','Standard protection','הגנה סטנדרטית',1],['plus','Plus protection','הגנה מורחבת',1.4],['cfar','Cancel for any reason','ביטול מכל סיבה',1.8]],
    can:[[[60,0],[30,10],[0,25]],[[90,0],[45,10],[0,20]]],
    role:['Group program manager','Plan administrator'],
    note:[['Group travel protection plans with per-person pricing.','תוכניות הגנת נסיעות לקבוצות במחיר לאדם.'],['Group plans with trip cancellation and medical benefits.','תוכניות קבוצתיות עם כיסוי ביטול ורפואי.']]}
};
const SD_CITY={assisi:'Assisi',athens:'Athens',austin:'Austin',barharbor:'Bar Harbor',bethlehem:'Bethlehem',boston:'Boston',branson:'Branson',chicago:'Chicago',corinth:'Corinth',delphi:'Delphi',dublin:'Dublin',gatlinburg:'Gatlinburg',grandcanyon:'Tusayan',jerusalem:'Jerusalem',killarney:'Killarney',knoxville:'Knoxville',london:'London',masada:'Masada',moher:'Liscannor',mountvernon:'Mount Vernon',nashville:'Nashville',neworleans:'New Orleans',newyork:'New York',niagarafalls:'Niagara Falls',northconway:'North Conway',oxford:'Oxford',phoenix:'Phoenix',pigeonforge:'Pigeon Forge',portlandme:'Portland',rome:'Rome',sanantonio:'San Antonio',sedona:'Sedona',stowe:'Stowe',stratford:'Stratford-upon-Avon',telaviv:'Tel Aviv',tiberias:'Tiberias',toronto:'Toronto',vatican:'Vatican City',washington:'Washington, DC'};
const SD_HOME={HolyLand:'Jerusalem',Rome:'Rome',Greece:'Athens',Ireland:'Dublin',London:'London',Niagara:'Niagara Falls',Branson:'Branson',Nashville:'Nashville',Washington:'Washington, DC',Canyon:'Phoenix',NewEngland:'Boston',NewYork:'New York',Smokies:'Pigeon Forge',SanAntonio:'San Antonio',Chicago:'Chicago',NewOrleans:'New Orleans'};
const SD_PHONE={Israel:n=>'+972 2-555-01'+n,Italy:n=>'+39 06 5550 01'+n,Greece:n=>'+30 21 0555 01'+n,Ireland:n=>'+353 1 555 01'+n,'United Kingdom':n=>'+44 20 7946 01'+n,Canada:n=>'+1 (555) 555-01'+n,USA:n=>'+1 (555) 555-01'+n};
const SD_PEOPLE={
  USA:['Casey Morgan','Jordan Ellis','Riley Fox','Taylor Brandt','Alex Dunham','Morgan Pratt','Jamie Holloway','Cameron Lowe','Drew Whitlock','Sam Rutledge'],
  Canada:['Chloe Tremblay','Liam Gagnon','Emma Roy','Noah Fortin','Ava Lavoie','Ethan Pelletier'],
  Israel:['Yael Barak','Amir Levi','Noa Shapira','Daniel Katz','Tamar Golan','Ori Mizrahi'],
  Italy:['Giulia Ferri','Marco Bellini','Chiara Romano','Luca Moretti','Elena Gallo','Paolo Serra'],
  Greece:['Eleni Marinos','Nikos Karras','Katerina Vlachos','Dimitris Sakis','Maria Lekkas','Yiannis Pappas'],
  Ireland:['Aoife Brennan','Cian Doherty','Niamh Keane','Sean Gallagher','Orla Fitzgerald','Eoin Brady'],
  'United Kingdom':['Harriet Cole','Oliver Pryce','Imogen Reid','Callum Barlow','Freya Stannard','Rhys Aldridge']
};
/* place words and name suffixes for generated fictional suppliers (the owner reviews the printed list before a show) */
const SD_PL={
  HolyLand:['Galilee','Judean Hills','Carmel Ridge','Negev Gate','Olive Terrace','Jordan Valley','Kfar Shalem','Zion Road'],
  Rome:['Tiber','Appian','Seven Hills','Trastevere','Lazio','Ostiense','Colle Alto','Via Serena'],
  Greece:['Attic','Aegean','Pnyx','Hymettus','Saronic Gulf','Isthmia','Argolis','Lycabettus'],
  Ireland:['Shannon','Wicklow','Burren','Kerry Glen','Claddagh','Liffeyside','Connemara','Slieve'],
  London:['Thamesbank','Kensal','Chiltern','Albion','Southwark','Heathfield','Cotswold','Hampstead Row'],
  Niagara:['Cataract','Fallsview Ridge','Welland','Lake Ontario','Escarpment','Peninsula Gate','Queenston','Maple Bridge'],
  Branson:['Ozark Valley','Table Rock','Taneycomo','Shepherd Ridge','Hollister','Stone Hill','White River','Silver Hollow'],
  Nashville:['Cumberland Bend','Music Valley','Percy Ridge','Harpeth','Belle Meade','Opryland Way','Tennessee Hills','Germantown'],
  Washington:['Potomac Bend','Capitol Hill','Anacostia','Chesapeake','Tidal Basin','Georgetown Row','Foggy Bottom','Old Town'],
  Canyon:['Painted Desert','Mogollon','Sonoran','Verde Valley','Kaibab','Red Mesa','Coconino','Oak Creek'],
  NewEngland:['Green Mountain','Granite State','Merrimack','Kancamagus','Berkshire','Acadia Gate','Pine Tree','Harvest Hill'],
  NewYork:['Hudson Gate','Brooklyn Bridge','Gotham Row','Empire Line','Five Boroughs','Harlem River','Midtown East','Palisades'],
  Smokies:['Cedar Ridge','Little Pigeon','Newfound Gap','Laurel Valley','Parkway Pines','Clingmans','Foothills','Sevier Springs'],
  SanAntonio:['Mesquite Trail','Cibolo Bend','Alamo Heights','Hill Country','Guadalupe','Medina Ridge','Blanco','Bluebonnet'],
  Chicago:['Lakefront Prairie','Loop Line','Wabash','Lincoln Park','Windy Shore','Michigan Mile','Prairie Avenue','River North'],
  NewOrleans:['Pelican Bend','Crescent','Bayou Bend','Garden District','Lafitte','Pontchartrain','Magnolia Row','Delta Lantern']
};
const SD_SFX={
  hotel:['Inn','Lodge','Suites','Hotel','Garden Inn','Grand Hotel','Resort Hotel'],
  coach:['Coaches','Motorcoach','Coach Lines','Charter Bus','Bus Lines','Executive Coaches','Tours & Charter'],
  shuttle:['Airport Shuttles','Group Transfers','Transfer Co.','Group Cars','Shuttle Service','Airport Group Cars'],
  guide:['Step-On Guides','Guiding','Local Guides','Guide Collective','Guide Service','Tour Guides'],
  meal:['Kitchen','Table','Dining Hall','Grill','Bistro','Supper House','Group Dining']
};
const SD_GLOBAL={
  air:['Cloudline Group Air Desk','Meridian Air Group Desk'],
  ins:['Harborlight Travel Protection','Ridgeway Protection Plans']
};
/* real brands among the generator's activity suppliers (the catalog covers hotels and venues; these names come from the destination defaults) */
const SD_REAL_ACT=['Dollywood',"Dolly Parton's Stampede",'National Park Service','The Alamo','GO RIO Cruises','Natural Bridge Caverns','Skydeck Chicago',"Chicago's First Lady Cruises",'Shedd Aquarium','The National WWII Museum','Steamboat NATCHEZ','Mardi Gras World','Empire State Building Observatory','Radio City Music Hall','Statue City Cruises','Smithsonian (free entry)'];
const SD_REALSET=new Set([...(CATALOG.hotels||[]),...(CATALOG.venues||[]),...(CATALOG.airlines||[])].map(x=>x.name.toLowerCase()).concat(SD_REAL_ACT.map(x=>x.toLowerCase())));
const SD_CATNAMES=new Set([...(CATALOG.hotels||[]),...(CATALOG.venues||[]),...(CATALOG.airlines||[])].map(x=>x.name.toLowerCase()));

/* ---------- registry ---------- */
const SUPPLIERS=[],SUP_BY={},SD_POOL={},SD_REF={},SD_USED=new Set(),SUP_FICT=[];
let SD_IDX=null,SD_IDXN=-1;
function supByName(name){
  if(!SD_IDX||SD_IDXN!==SUPPLIERS.length){SD_IDX=new Map();SUPPLIERS.forEach(s=>{if(!SD_IDX.has(s.name))SD_IDX.set(s.name,s);});SD_IDXN=SUPPLIERS.length;}
  return SD_IDX.get(name)||null;
}
/* build one supplier object (pure; registration is done by sdAdd) */
function sdMk(o,id){
  const T=SD_SUB[o.sub],R=rng(SD_h(id)),d=o.dest==='ALL'?null:DESTS[o.dest],country=o.country||(d?d.country:'USA'),real=!!o.real;
  const nn=SD_pad(Math.floor(R()*100)),ph=(SD_PHONE[country]||SD_PHONE.USA)(nn);
  const nm=SD_pick(R,SD_PEOPLE[country]||SD_PEOPLE.USA),dom=SD_dom(o.name);
  const us=country==='USA',cur=o.cur||(d?d.cur:'USD');
  const s={id,name:o.name,cat:T.cat,sub:o.sub,dest:o.dest,city:o.city||(d?SD_HOME[o.dest]:'Tulsa'),country,cur,real,fictional:!real,incumbent:false,gen:!!o.gen,showPerf:!real,
    pref:real?(R()<.5?'High':'Medium'):(R()<.34?'High':R()<.75?'Medium':'Low'),
    contact:real?{name:'Group sales desk',role:'Group sales',email:'groups@'+dom+'.example',phone:ph}
      :{name:nm,role:SD_pick(R,T.role),email:nm.split(' ')[0].toLowerCase()+'@'+dom+'.example',phone:ph},
    terms:{depPct:T.dep[0]+Math.floor(R()*(T.dep[1]-T.dep[0]+1)),depDays:SD_pick(R,[7,14,21,30]),balDays:SD_pick(R,[30,45,60]),payBy:SD_pick(R,['ACH','Wire','Card','Check'])},
    cancel:SD_pick(R,T.can).map(x=>x.slice()),
    comm:o.comm!=null?o.comm:T.comm[0]+Math.floor(R()*(T.comm[1]-T.comm[0]+1)),
    base:o.base,unit:o.unit||T.unit,variants:T.v.map(v=>({k:v[0],en:v[1],he:v[2],mult:v[3]})),
    notes:real?{en:'Catalog partner. '+(o.note||'Group rates are illustrative.'),he:'שותף מהקטלוג. מחירי הקבוצות להמחשה בלבד.'}:(()=>{const n=SD_pick(R,T.note);return {en:n[0],he:n[1]+(d?' · '+d.he:'')};})()};
  if(real){s.docs=null;if(o.stars)s.stars=o.stars;if(o.brand)s.brand=o.brand;if(o.family)s.family=o.family;if(o.src)s.src=o.src;}
  else{
    s.rating=Math.round((3.4+R()*1.5)*10)/10;s.replyHrs=2+Math.floor(R()*34);
    const soon=R()<.14,coi=['coach','shuttle','guide','hotel','meal','act'].includes(o.sub);
    s.docs={w9:us?R()<.92:null,coi:coi?addDays(iso(TODAY),soon?12+Math.floor(R()*45):90+Math.floor(R()*400)):null,contractTo:addDays(iso(TODAY),200+Math.floor(R()*500))};
    if(o.sub==='hotel')s.stars=R()<.6?3:4;
  }
  return s;
}
function sdAdd(o){
  const id0='sup-'+SD_slug(o.name);let id=id0,n=2;while(SUP_BY[id])id=id0+'-'+n++;
  const s=sdMk(o,id);SUPPLIERS.push(s);SUP_BY[id]=s;SD_USED.add(o.name.toLowerCase());
  if(o.sub!=='act'){const k=o.dest+'|'+o.sub;(SD_POOL[k]||(SD_POOL[k]=[])).push(s);}
  if(o.ref&&!SD_REF[o.dest+'|'+o.sub])SD_REF[o.dest+'|'+o.sub]=o.base;
  return s;
}
/* generated fictional name for (dest, sub): place word + service word, unique and never a catalog or existing name */
function sdName(dest,sub,R){
  const pl=SD_PL[dest];
  for(let k=0;k<200;k++){
    const nm=SD_pick(R,pl)+' '+SD_pick(R,SD_SFX[sub]);
    if(!SD_USED.has(nm.toLowerCase())&&!SD_REALSET.has(nm.toLowerCase()))return nm;
  }
  return pl[0]+' '+SD_SFX[sub][0]+' '+(SD_USED.size+1);
}
(function build(){
  /* 1. real catalog hotels */
  (CATALOG.hotels||[]).forEach(h=>{const d=DESTS[h.dest];if(!d)return;
    sdAdd({name:h.name,sub:'hotel',dest:h.dest,real:true,cur:d.cur,base:h.rate,city:SD_CITY[h.city]||SD_HOME[h.dest],country:d.country,stars:h.stars,brand:h.brand,family:h.family,src:h.src,note:h.note});});
  /* 2. incumbents from the destination defaults (names unchanged), then the pool alternatives */
  Object.keys(DESTS).forEach(k=>{const d=DESTS[k],R=rng(SD_h('alt|'+k));
    const inc=(name,sub,base,extra)=>{if(!name||supByName(name))return;const real=SD_REALSET.has(name.toLowerCase());sdAdd(Object.assign({name,sub,dest:k,real,base,ref:sub!=='act'},extra||{}));};
    inc(d.hotel[0],'hotel',d.hotel[1]);inc(d.coach[0],'coach',d.coach[1]);if(d.shut)inc(d.shut[0],'shuttle',d.shut[1]);inc(d.guide[0],'guide',d.guide[1]);inc(d.meal[0],'meal',d.meal[1]);
    d.acts.forEach(a=>inc(a[1],'act',a[2]));
    SD_REF[k+'|hotel']=d.hotel[1];SD_REF[k+'|coach']=d.coach[1];if(d.shut)SD_REF[k+'|shuttle']=d.shut[1];SD_REF[k+'|guide']=d.guide[1];SD_REF[k+'|meal']=d.meal[1];
    const gen=(sub,ref,n)=>{for(let i=0;i<n;i++){const nm=sdName(k,sub,R),f=.86+R()*.3;
      const usd=d.intl&&R()<.22;   // a minority of international suppliers bill in USD (A9: USD or the destination currency only)
      const base=Math.round(ref*f*(usd&&d.cur!=='USD'?BASE_RATE[d.cur]:1));
      sdAdd({name:nm,sub,dest:k,real:false,gen:true,cur:usd?'USD':d.cur,base});SUP_FICT.push(nm);}};
    gen('hotel',d.hotel[1],2);gen('coach',d.coach[1],2);if(d.shut)gen('shuttle',d.shut[1],2);gen('guide',d.guide[1],2);gen('meal',d.meal[1],2);
  });
  /* 3. global desks: air and insurance */
  const R=rng(SD_h('global'));
  sdAdd({name:'SkyGroup Air Desk',sub:'air',dest:'ALL',cur:'USD',base:1000,comm:0,ref:true});
  SD_GLOBAL.air.forEach(nm=>{sdAdd({name:nm,sub:'air',dest:'ALL',cur:'USD',base:Math.round(1000*(.9+R()*.2)),gen:true});SUP_FICT.push(nm);});
  sdAdd({name:'SafeJourney Protection',sub:'ins',dest:'ALL',cur:'USD',base:60,comm:15,ref:true});
  SD_GLOBAL.ins.forEach(nm=>{sdAdd({name:nm,sub:'ins',dest:'ALL',cur:'USD',base:Math.round(60*(.9+R()*.2)),gen:true});SUP_FICT.push(nm);});
  /* 4. any other name the trips use today (concert halls, studio leftovers): incumbents only */
  TRIPS.forEach(t=>t.lines.forEach(l=>{if(supByName(l.sup))return;const sub=lineSub(l);
    sdAdd({name:l.sup,sub,dest:sub==='air'||sub==='ins'?'ALL':t.dest,real:SD_REALSET.has(String(l.sup).toLowerCase()),cur:l.cur,base:l.cost||1,unit:l.unit||undefined});}));
})();

/* which supplier family a trip line belongs to */
function lineSub(l){
  const s=supByName(l.sup);if(s&&s.sub)return s.sub;
  if(l.type==='Lodging')return 'hotel';if(l.type==='Guide')return 'guide';if(l.type==='Meals')return 'meal';if(l.type==='Insurance')return 'ins';if(l.type==='Activities')return 'act';
  if(/^Group air/.test(l.name||''))return 'air';
  if(l.unit==='transfer'||/transfer|shuttle/i.test(l.name||''))return 'shuttle';
  return 'coach';
}
/* incumbents: the line's own supplier. A supplier that is not in SUPPLIERS (studio plans, blank quotes) is synthesized,
   priced like the market reference of its family so alternatives stay comparable */
const SD_SYN={};
function incumbentOf(l,t){
  const s=supByName(l.sup);if(s)return s;
  const sub=lineSub(l),dest=sub==='air'||sub==='ins'?'ALL':(t&&t.dest)||'ALL',key=dest+'|'+sub+'|'+l.sup+'|'+l.cur;
  if(SD_SYN[key])return SD_SYN[key];
  const id='syn-'+SD_slug(l.sup)+'-'+SD_h(key).toString(36);
  const o={name:l.sup,sub,dest,real:SD_REALSET.has(String(l.sup).toLowerCase()),cur:l.cur,base:SD_REF[dest+'|'+sub]||l.cost||1,unit:l.unit||undefined,comm:l.comm||0};
  const x=sdMk(o,id);x.synthetic=true;return SD_SYN[key]=x;
}

/* ---------- rates ---------- */
const SD_jit=(s,season)=>((SD_h(s.id+'|'+season)%81)-40)/1000;
function sdRaw(s,isoDate,pax,vk){
  const season=seasonOf(isoDate),sm=SD_SMULT[season]+SD_jit(s,season);
  const bm=(SD_PERCAP[s.unit])?SD_BMULT[SD_bandIdx(+pax||0)]:1;
  const v=(s.variants||[]).find(x=>x.k===vk)||(s.variants||[])[0]||{mult:1};
  return s.base*sm*bm*v.mult;
}
const rateFor=(s,isoDate,pax,vk)=>Math.round(sdRaw(s,isoDate,pax,vk));
function rateCard(s){
  const rows=[];
  Object.keys(SEASONS).forEach(season=>{
    const sm=SD_SMULT[season]+SD_jit(s,season);
    BANDS.forEach((band,bi)=>(s.variants||[]).forEach(v=>{
      const bm=SD_PERCAP[s.unit]?SD_BMULT[bi]:1;
      rows.push({season,band:band.slice(),variant:v.k,cost:Math.round(s.base*sm*bm*v.mult)});}));
  });
  return rows;
}
/* unit cost of supplier `sup` for this line, in the line's currency, anchored to the line's current price */
function altCost(t,l,sup){
  const inc=incumbentOf(l,t);
  if(!sup||sup===inc||sup.name===l.sup||sup.id===inc.id)return l.cost;
  const pax=t&&t.pax||0,dep=(t&&t.dep)||iso(TODAY);
  const B=c=>BASE_RATE[c]||1,den=sdRaw(inc,dep,pax)*B(inc.cur);
  if(!(den>0))return l.cost;
  return Math.round(l.cost*sdRaw(sup,dep,pax)*B(sup.cur)/den);
}
/* the incumbent first, then alternatives by cost. Activities are exempt from alternatives (A11). Lodging is capped at the 5 closest by rate, with at least one fictional option. */
function altsFor(t,l){
  const inc=incumbentOf(l,t),sub=lineSub(l);
  const lr=l.cur==='USD'?1:(t&&t.rate)||BASE_RATE[l.cur]||1;
  const mk=(s,isInc)=>{const cost=isInc?l.cost:altCost(t,l,s);
    return {sup:s,cost,cur:l.cur,delta:r2((cost-l.cost)*(l.qty||0)*lr),rating:s.rating,pref:s.pref,cancel:s.cancel,comm:isInc?(l.comm||0):s.comm,real:!!s.real,inc:!!isInc};};
  const out=[mk(inc,true)];
  if(sub==='act')return out;
  const dest=sub==='air'||sub==='ins'?'ALL':(t&&t.dest)||'ALL';
  let pool=(SD_POOL[dest+'|'+sub]||[]).filter(s=>s.name!==l.sup&&s.id!==inc.id);
  if(sub==='hotel'&&pool.length>5){
    const ib=inc.base||1,d=s=>Math.abs(Math.log((s.base||1)/ib));
    const ranked=pool.slice().sort((a,b)=>d(a)-d(b)||(a.name<b.name?-1:1)),top=ranked.slice(0,5);
    if(!top.some(s=>!s.real)){const f=ranked.find(s=>!s.real);if(f)top[4]=f;}
    pool=top;
  }
  const alts=pool.map(s=>mk(s,false)).sort((a,b)=>a.cost-b.cost||(a.sup.name<b.sup.name?-1:1));
  return out.concat(alts);
}
/* every supplier that appears on a trip line counts as an incumbent, also after brandSwap renames hotels */
const sdMarkInc=t=>t.lines.forEach(l=>{const s=supByName(l.sup);if(s)s.incumbent=true;});
TRIPS.forEach(sdMarkInc);
TRIP_INIT.push(t=>sdMarkInc(t));

/* ---------- tests ---------- */
TESTS.push({name:'suppliers: data, coverage, rates, real-brand rules',run:()=>{
  const f=[],COV=['Lodging','Transport','Guide','Meals','Insurance'];
  const cats={};SUPPLIERS.forEach(s=>{const c=cats[s.cat]||(cats[s.cat]={n:0,real:0,names:[]});c.n++;if(s.real)c.real++;if(s.gen)c.names.push(s.name);});
  Object.keys(cats).forEach(c=>console.log('SUPPLIERS',c,'n='+cats[c].n,'real='+cats[c].real,'generated='+cats[c].names.length,'|',cats[c].names.join('; ')));
  console.log('SUPPLIERS total',SUPPLIERS.length,'real',SUPPLIERS.filter(s=>s.real).length,'fictional',SUPPLIERS.filter(s=>!s.real).length,'generated',SUP_FICT.length);
  /* identity of the registry */
  const names=new Set(),ids=new Set();
  SUPPLIERS.forEach(s=>{if(names.has(s.name))f.push('duplicate name '+s.name);names.add(s.name);if(ids.has(s.id))f.push('duplicate id '+s.id);ids.add(s.id);if(SUP_BY[s.id]!==s)f.push('SUP_BY '+s.id);});
  /* coverage: >=3 options for every covered line, incumbent exact, no third currency */
  let lines=0,minOpts=99;
  TRIPS.forEach(t=>t.lines.forEach(l=>{
    const cur=DESTS[t.dest].cur,a=altsFor(t,l);
    if(!COV.includes(l.type)){if(!a.length||a[0].cost!==l.cost)f.push('activity incumbent '+t.id+'/'+l.id);return;}
    lines++;minOpts=Math.min(minOpts,a.length);
    if(a.length<3)f.push('<3 options '+t.id+'/'+l.id+' '+l.sup+' ('+a.length+')');
    if(a[0].sup.name!==l.sup||!a[0].inc)f.push('incumbent not first '+t.id+'/'+l.id);
    if(a[0].cost!==l.cost||altCost(t,l,incumbentOf(l,t))!==l.cost)f.push('incumbent cost '+t.id+'/'+l.id);
    if(a[0].comm!==(l.comm||0))f.push('incumbent comm '+t.id+'/'+l.id);
    a.forEach(x=>{
      if(x.cur!==l.cur)f.push('alt cur '+t.id+'/'+l.id+' '+x.sup.name);
      if(!['USD',cur].includes(x.sup.cur))f.push('third currency '+x.sup.name+' '+x.sup.cur);
      if(!isFinite(x.cost)||!isFinite(x.delta)||x.cost<0)f.push('bad cost '+t.id+'/'+l.id+' '+x.sup.name);
      if(l.cost>0&&x.cost<=0)f.push('zero alt cost '+t.id+'/'+l.id+' '+x.sup.name);
    });
    for(let i=2;i<a.length;i++)if(a[i].cost<a[i-1].cost)f.push('not sorted '+t.id+'/'+l.id);
    if(new Set(a.map(x=>x.sup.name)).size!==a.length)f.push('duplicate option '+t.id+'/'+l.id);
  }));
  console.log('SUPPLIERS coverage lines',lines,'min options',minOpts);
  /* supplier rules */
  SUPPLIERS.forEach(s=>{
    if(!['USD',s.dest==='ALL'?'USD':DESTS[s.dest].cur].includes(s.cur))f.push('supplier currency '+s.name+' '+s.cur);
    if(!(s.cancel&&s.cancel.length>=3&&s.cancel.length<=4)&&s.cat!=='Insurance')f.push('cancel tiers '+s.name);
    for(let i=1;i<(s.cancel||[]).length;i++)if(s.cancel[i][0]>=s.cancel[i-1][0])f.push('cancel order '+s.name);
    if(!(s.comm>=0&&s.comm<=15))f.push('comm '+s.name);
    if(!/@[a-z0-9]+\.example$/.test(s.contact.email))f.push('email '+s.name);
    if(s.real){
      if(s.rating!==undefined||s.replyHrs!==undefined)f.push('real has rating/replyHrs '+s.name);
      if(!['High','Medium'].includes(s.pref))f.push('real pref '+s.name);
      if(s.docs!==null)f.push('real docs '+s.name);
      if(s.contact.name!=='Group sales desk')f.push('real contact '+s.name);
      if(s.showPerf)f.push('real showPerf '+s.name);
    }else{
      if(SD_CATNAMES.has(s.name.toLowerCase()))f.push('fictional equals catalog name '+s.name);
      if(!(s.rating>=3&&s.rating<=5)||!(s.replyHrs>0))f.push('fictional perf '+s.name);
      if(!s.docs||!s.docs.contractTo)f.push('fictional docs '+s.name);
    }
  });
  const cat=(CATALOG.hotels||[]);
  cat.forEach(h=>{const s=supByName(h.name);if(!s||!s.real||s.stars!==h.stars)f.push('catalog hotel missing '+h.name);});
  SUP_FICT.forEach(n=>{if(SD_REALSET.has(n.toLowerCase()))f.push('generated name is real '+n);});
  /* rates */
  if(seasonOf('2027-03-08')!=='Shoulder'||seasonOf('2027-07-01')!=='High'||seasonOf('2027-01-15')!=='Low')f.push('seasonOf');
  if(bandOf(12)!==BANDS[0]||bandOf(34)!==BANDS[1]||bandOf(49)!==BANDS[2]||bandOf(60)!==BANDS[3])f.push('bandOf');
  [SUP_BY['sup-skygroup-air-desk'],SUPPLIERS.find(s=>s.sub==='hotel'&&s.real),SUPPLIERS.find(s=>s.sub==='coach'),SUPPLIERS.find(s=>s.sub==='guide')].forEach(s=>{
    if(!s){f.push('rate sample missing');return;}
    const rc=rateCard(s);
    if(rc.length!==12*s.variants.length)f.push('rateCard rows '+s.name);
    const pax={0:15,1:25,2:40,3:55},mid={Low:'2027-01-10',Shoulder:'2027-04-10',High:'2027-07-10'};
    rc.forEach(r=>{const bi=BANDS.findIndex(b=>b[0]===r.band[0]);if(r.cost!==rateFor(s,mid[r.season],pax[bi],r.variant))f.push('rateCard vs rateFor '+s.name+' '+r.season+r.band);});
    const hi=rateFor(s,'2027-07-10',40),lo=rateFor(s,'2027-01-10',40);if(!(hi>lo))f.push('season order '+s.name);
  });
  /* synthesized incumbent (studio / blank quote): unknown supplier name still gets >=3 options and an exact incumbent */
  const T0=TRIPS.find(x=>x.dest==='Branson'&&x.stage==='Operations')||TRIPS[0];
  [['Lodging','Twin rooms, 3 nights','Unlisted Test Hotel',99,'room-night'],['Transport','Motorcoach, 4 days','Unlisted Test Coach',1000,'day'],['Guide','Step-on guide, 2 days','Unlisted Test Guide',250,'day'],['Meals','Group lunches (2)','Unlisted Test Kitchen',20,'meal']].forEach(r=>{
    const l={id:900,type:r[0],name:r[1],sup:r[2],qty:10,unit:r[4],cost:r[3],scope:'shared',ov:'',comm:3,inv:null,cur:T0.cur};
    const a=altsFor(T0,l);if(a.length<3)f.push('synth options '+r[2]+' '+a.length);
    if(a[0].cost!==l.cost||a[0].comm!==3)f.push('synth incumbent '+r[2]);
  });
  if(supByName('Unlisted Test Hotel'))f.push('synth leaked into SUPPLIERS');
  return f;
}});
