const TODAY=new Date('2026-10-20T00:00:00');
const D=s=>new Date(s+'T00:00:00');
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d);};
const fmtDate=s=>D(s).toLocaleDateString(LOC(),{day:'numeric',month:'short',year:'numeric'});
const DAY=864e5;
const money=(n,c='USD',dp=0)=>'⁦'+new Intl.NumberFormat('en-US',{style:'currency',currency:c,minimumFractionDigits:dp,maximumFractionDigits:dp}).format(n)+'⁩';
const usd=(n,dp=0)=>money(n,'USD',dp);
const r2=x=>Math.round(x*100)/100;
const pct=x=>'⁦'+(x*100).toFixed(1)+'%⁩';
const kf=n=>Math.abs(n)>=1000?(n/1000).toFixed(1)+'k':String(Math.round(n));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sgn=(n,f)=>(n>0?'+':'')+f(n);
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
const L=(he,en)=>S.lang==='en'?en:he;

/* ---------- the fictional agency ---------- */
const AGENCY='Redbud Group Tours';
const AGENCY_CITY='Tulsa, Oklahoma';
const AGENCY_MAIL='invoices@redbudtours.example';
const AGENTS=['Priya','Dana','Marcus','Grace','Luis','Tom'];
const AGN={Priya:'פריה שאה',Dana:'דנה ויטפילד',Marcus:'מרקוס ריד',Grace:'גרייס אוקפור',Luis:'לואיס אורטגה',Tom:'טום בקר'};
const AGE={Priya:'Priya Shah',Dana:'Dana Whitfield',Marcus:'Marcus Reed',Grace:'Grace Okafor',Luis:'Luis Ortega',Tom:'Tom Becker'};
const agn=a=>L(AGN[a]||a,AGE[a]||a);
const MGR=()=>L('אלה ברוקס','Ella Brooks');

/* ---------- catalog ---------- */
const TYPES=['Lodging','Transport','Guide','Activities','Meals','Insurance'];
const DESTS={};
function Dst(k,o){DESTS[k]=o;}
Dst('HolyLand',{en:'Holy Land',he:'ארץ הקודש',cur:'USD',country:'Israel',intl:true,gw:'Tel Aviv',air:1420,hotel:['Olive Gate Hotel Jerusalem',205],coach:['Galilee Star Coaches',760],shut:['Ben Gurion Group Transfers',340],guide:['Living Stones Guiding',330],meal:['Kinneret Fish House',24,'lunch'],
  acts:[['Sea of Galilee boat','Galilee Boats Co.',14,0,1.5],['Masada cable car & entry','Masada Park Tickets',34,0,4],['Jordan River baptism site','Jordan River Baptism Site',6,0,2]]});
Dst('Rome',{en:'Rome & Assisi',he:'רומא ואסיזי',cur:'EUR',country:'Italy',intl:true,gw:'Rome',air:1180,hotel:['Casa San Pietro Hotel',132],coach:['Roma Granturismo Coaches',640],shut:['Fiumicino Group Transfers',290],guide:['Vatican Path Guides',240],meal:['Trattoria del Borgo',27],
  acts:[['Vatican Museums group entry','Vatican Group Tickets',27,0,3.5],['Assisi day trip','Umbria Day Tours',46,10,8],['Colosseum & Forum entry','Colosseum Group Tickets',24,0,3]]});
Dst('Greece',{en:'Athens & Corinth',he:'אתונה וקורינתוס',cur:'EUR',country:'Greece',intl:true,gw:'Athens',air:1290,hotel:['Plaka Garden Hotel',118],coach:['Attica Coaches',560],shut:['Athens Airport Transfers',230],guide:['Hellenic Guides',195],meal:['Taverna Plaka',24],
  acts:[['Acropolis entry','Hellenic Sites Tickets',20,0,3],['Ancient Corinth day','Corinth Day Tours',38,8,7],['Aegean island cruise','Saronic Cruises',62,12,9]]});
Dst('Ireland',{en:'Ireland',he:'אירלנד',cur:'EUR',country:'Ireland',intl:true,gw:'Dublin',air:1080,hotel:['Liffey Hotel Dublin',142],coach:['Emerald Coaches',620],shut:['Dublin Airport Group Cars',260],guide:['Celtic Driver-Guides',210],meal:['The Brazen Kitchen',28],
  acts:[['Cliffs of Moher day','Wild Atlantic Tours',55,9,9],['Old Library & Book of Kells','Old Library Group Tickets',22,0,2],['Irish music evening','Temple Bar Sessions',29,0,3]]});
Dst('London',{en:'London & Oxford',he:'לונדון ואוקספורד',cur:'GBP',country:'United Kingdom',intl:true,gw:'London',air:1150,hotel:['Kensington Row Hotel',134],coach:['Thames Coaches',540],shut:['Heathrow Group Cars',270],guide:['London Blue Guides',215],meal:['The Covent Kitchen',26],
  acts:[['Westminster Abbey entry','Abbey Group Tickets',27,0,2.5],['West End show','West End Group Sales',64,8,3],['Oxford day trip','Oxford Day Tours',42,8,8]]});
Dst('Niagara',{en:'Niagara & Toronto',he:'ניאגרה וטורונטו',cur:'CAD',country:'Canada',intl:true,gw:'Buffalo',air:390,hotel:['Falls View Inn',172],coach:['Maple Leaf Coaches',980],shut:['Buffalo Airport Shuttles',360],guide:['Niagara Step-On Guides',270],meal:['Clifton Hill Grill',34],
  acts:[['Falls boat tour','Falls Boat Tours',33,0,1.5],['CN Tower entry','Tower Group Tickets',43,0,2],['Niagara wine tasting','Peninsula Wineries',38,10,3]]});
Dst('Branson',{en:'Branson',he:'ברנסון',cur:'USD',country:'USA',intl:false,gw:'',air:0,hotel:['Ozark Lakeside Lodge',112],coach:['Show-Me Motorcoach',1180],shut:null,guide:['Ozark Step-On Guides',240],meal:['Lakeside Family Buffet',22],
  acts:[['Evening show tickets','Branson Show Group Sales',48,8,2.5],['Showboat dinner cruise','Lake Queen Cruises',64,10,3],['Heritage theme park','Ozark Heritage Park',72,8,6]]});
Dst('Nashville',{en:'Nashville',he:'נאשוויל',cur:'USD',country:'USA',intl:false,gw:'',air:0,hotel:['Music Row Inn',154],coach:['Cumberland Motorcoach',1260],shut:null,guide:['Music City Step-On Guides',260],meal:['Broadway Hot Chicken Hall',25],
  acts:[['Country music show','Music City Show Tickets',66,8,3],['Historic auditorium tour','Mother Church Tours',32,0,1.5],['Music museum entry','Music Museum Group Sales',29,0,2.5]]});
Dst('Washington',{en:'Washington, DC',he:'וושינגטון די.סי.',cur:'USD',country:'USA',intl:false,gw:'Washington',air:360,hotel:['Capitol View Hotel',196],coach:['Potomac Coach Lines',1380],shut:['Reagan Airport Group Shuttles',420],guide:['Monument Step-On Guides',290],meal:['Union Station Food Hall',21],
  acts:[['Monuments by night tour','DC Night Tours',35,8,3],['Mount Vernon entry','Mount Vernon Group Tickets',28,0,4],['Smithsonian museum day','Smithsonian (free entry)',0,0,5]]});
Dst('Canyon',{en:'Grand Canyon & Sedona',he:'הגרנד קניון וסדונה',cur:'USD',country:'USA',intl:false,gw:'Phoenix',air:340,hotel:['Canyon Rim Lodge',184],coach:['Red Rock Coaches',1320],shut:['Phoenix Airport Group Shuttles',380],guide:['Canyon Step-On Guides',280],meal:['Trailhead Grill',27],
  acts:[['Park entry, group permit','National Park Group Permits',20,0,1],['Helicopter flight','Canyon Air Tours',249,10,1.5],['Sedona jeep tour','Red Rock Jeep Co.',89,10,2.5]]});
Dst('NewEngland',{en:'New England Fall Foliage',he:'ניו אינגלנד בשלכת',cur:'USD',country:'USA',intl:false,gw:'Boston',air:418,hotel:['Maple Ridge Inn',229],coach:['Yankee Coach Lines',1450],shut:null,guide:['Foliage Step-On Guides',260],meal:['New England Dining Group',38],
  acts:[['Scenic railroad','Notch Scenic Railroad',45,0,3],['Lobster bake','Maine Coast Bakes',72,0,3],['Maple farm visit','Sugarhouse Tours',15,0,1.5]]});
const CTRYH={Israel:'ישראל',Italy:'איטליה',Greece:'יוון',Ireland:'אירלנד','United Kingdom':'בריטניה',Canada:'קנדה',USA:'ארה״ב'};
const dn=k=>DESTS[k]?L(DESTS[k].he,DESTS[k].en):k;
const cn=k=>L(CTRYH[DESTS[k].country]||DESTS[k].country,DESTS[k].country);
const SEG={
  Faith:{mk:{Lodging:22,Transport:12,Guide:20,Activities:18,Meals:20,Insurance:0}},
  Student:{mk:{Lodging:20,Transport:10,Guide:18,Activities:15,Meals:15,Insurance:0}},
  Senior:{mk:{Lodging:25,Transport:15,Guide:20,Activities:20,Meals:20,Insurance:0}},
  Choir:{mk:{Lodging:20,Transport:10,Guide:18,Activities:15,Meals:15,Insurance:0}},
  Alumni:{mk:{Lodging:28,Transport:15,Guide:22,Activities:22,Meals:22,Insurance:0}}
};
const SEGH={Faith:'קהילות וכנסיות',Student:'תלמידים',Senior:'גמלאים ומועדונים',Choir:'מקהלות ולהקות',Alumni:'בוגרים ואיגודים'};
const SEGE={Faith:'Faith groups',Student:'Student groups',Senior:'Senior & bank clubs',Choir:'Choirs & bands',Alumni:'Alumni & associations'};
const sn=k=>L(SEGH[k]||k,SEGE[k]||k);
const BASE_RATE={USD:1,EUR:1.08,GBP:1.27,CAD:0.73};
const SUR=['Anderson','Baker','Carter','Davis','Edwards','Foster','Garcia','Hughes','Irwin','Johnson','Keller','Lawson','Martinez','Nguyen','Owens','Parker','Quinn','Sanders','Turner','Underwood','Vaughn','Walker','Young','Zimmerman','Adams','Bennett','Collins','Dawson','Ellis','Fletcher','Graham','Harper','Jenkins','Kimball','Lopez','Mitchell','Norris','Ortiz','Patel','Ramsey','Simmons','Thompson','Upton','Vargas','Whitaker','Yates','Chandler','Holt','Pruitt','Haskins'];
const FIRST=['James','Mary','Robert','Linda','John','Patricia','Michael','Barbara','David','Susan','William','Karen','Richard','Nancy','Joseph','Betty','Thomas','Sandra','Charles','Donna','Emma','Noah','Olivia','Liam','Ava','Ethan','Mia','Mason','Sophia','Logan'];
const TASKT=[['Final rooming list to hotel',30],['Release unused rooms from the block',30],['Itinerary to motorcoach company',21],['Collect passport copies',75,1],['Collect emergency contact forms',30],['Confirm show and attraction tickets',45],['Dietary list to restaurants',14],['Final headcount to suppliers',10],['Send travel documents to travelers',21],['Group leader briefing call',14],['Travel protection deadline reminder',100],['Driver and guide schedule sheet',7]];
const DAYTPL=[
  {n:['יום הגעה','Arrival day'],dest:'',tag:['כללי','General'],items:[['Airport pickup and check-in',2],['Orientation walk',1.5],['Welcome dinner',2]]},
  {n:['מנזרים, יפו - ירושלים','Monasteries, Jaffa to Jerusalem'],dest:'HolyLand',tag:['קתולי','Catholic'],items:[["St. Peter's Church, Jaffa",1.5],['Israel Museum',2.5],['Western Wall',1]]},
  {n:['שווקים בירושלים ובתל אביב','Markets of Jerusalem and Tel Aviv'],dest:'HolyLand',tag:['כללי','General'],items:[['Mahane Yehuda market',2],['Carmel market',1.5],['Sarona food hall',1.5]]},
  {n:['ערב מופע','Show night'],dest:'',tag:['כללי','General'],items:[['Early group dinner',1.5],['Evening show',2.5]]},
  {n:['יום עזיבה','Departure day'],dest:'',tag:['כללי','General'],items:[['Free morning',2.5],['Transfer to airport',1.5]]}
];

const planC=l=>r2(l.qty*l.cost);
const lrate=(t,l)=>l.cur==='USD'?1:t.rate;
let LID=1;
/* ---------- generators ---------- */
function genLines(seg,k,pax,nights){
  const d=DESTS[k],Lx=[];let id=1;const days=nights+1,comps=Math.floor(pax/20);
  const add=(type,name,sup,qty,unit,cost,scope,comm,cur)=>Lx.push({id:id++,type,name,sup,qty,unit,cost:Math.round(cost),scope,ov:'',comm:comm||0,inv:null,cur:cur||d.cur});
  const occ={Faith:2,Student:3.6,Senior:1.9,Choir:3,Alumni:1.9}[seg],rooms=Math.ceil(pax/occ);
  const rl={Student:'Quad',Choir:'Triple'}[seg]||'Twin';
  add('Lodging',rl+' rooms, '+nights+' nights',d.hotel[0],rooms*nights,'room-night',d.hotel[1]*(seg==='Student'?1.18:seg==='Choir'?1.1:1),'shared');
  if(!d.intl)add('Lodging','Driver room, '+nights+' nights (comp)',d.hotel[0],nights,'room-night',0,'shared');
  if(d.air)add('Transport','Group air, Tulsa to '+d.gw,'SkyGroup Air Desk',pax,'person',d.air,'per person',0,'USD');
  const bus=d.intl?'49-seat coach':'Motorcoach';
  add('Transport',bus+', '+days+' days',d.coach[0],days,'day',d.coach[1]*(pax>50?1.08:1),'shared');
  if(d.shut)add('Transport','Airport transfers',d.shut[0],2*Math.ceil(pax/50),'transfer',d.shut[1],'shared');
  const gd=d.intl?days:Math.max(1,Math.round(days/2));
  add('Guide',(d.intl?(k==='HolyLand'?'Licensed Christian guide':'Tour guide'):'Step-on guide')+', '+gd+' days',d.guide[0],gd,'day',d.guide[1],'shared');
  const acts={Faith:d.acts,Student:d.acts,Senior:[d.acts[0],d.acts[1]],Choir:[d.acts[0]],Alumni:[d.acts[1],d.acts[2]]}[seg];
  acts.forEach(a=>add('Activities',a[0],a[1],pax-comps,'person',a[2],'per person',a[3]));
  if(seg==='Choir')add('Activities','Concert venue and sound',d.en.split(' ')[0]+' Concert Hall',1,'evening',k==='London'?1400:1600,'shared');
  const lunch=d.meal[2]==='lunch',mc=lunch?Math.max(1,days-2):nights;
  add('Meals',(lunch?'Group lunches (':'Group dinners (')+mc+')',d.meal[0],pax*mc,'meal',d.meal[1],'per person');
  add('Insurance','Travel protection','SafeJourney Protection',pax,'person',d.intl?89:39,'per person',15,'USD');
  return Lx;
}
function genItems(k,nights,R){
  const d=DESTS[k],days=nights+1,it=[];let id=1;
  const add=(name,hrs,day)=>it.push({id:id++,name,hrs,day});
  if(d.air){add('Arrival and transfer to hotel',2,1);add('Orientation walk',1.5,1);}
  else{add('Motorcoach departs Tulsa',4.5,1);add('Hotel check-in',1,1);}
  add('Welcome dinner',2,1);
  for(let day=2;day<=days-1;day++){const a=d.acts[(day-2)%d.acts.length];add(a[0],a[4],day);if(R()<.7)add('City tour with step-on guide',2.5,day);}
  add('Free morning',2.5,days);add(d.air?'Transfer to airport':'Motorcoach returns to Tulsa',d.air?1.5:4.5,days);
  if(R()<.5)add('Optional evening activity',2,0);
  return it;
}
function genGroups(seg,pax,R){
  const out=[];let left=pax;const sur=[...SUR];
  const take=()=>sur.length?sur.splice(Math.floor(R()*sur.length),1)[0]:'Guest '+(out.length+1);
  while(left>0){
    let s=1;
    if(seg!=='Student'&&seg!=='Choir'&&R()<.55)s=Math.min(left,2);
    else if(R()<.08)s=Math.min(left,2);
    out.push({name:take()+' household',size:s});left-=s;
  }
  return out;
}
function genTravelers(t,R){
  const out=[];let room=0,inRoom=0;const per={Faith:2,Student:4,Senior:2,Choir:3,Alumni:2}[t.seg];
  t.groups.forEach(g=>{
    const sur=g.name.replace(' household','');
    if(g.size>1&&inRoom){room++;inRoom=0;}
    for(let i=0;i<g.size;i++){
      if(inRoom===0)room++;inRoom=(inRoom+1)%per;
      const r=R();
      out.push({n:FIRST[Math.floor(R()*FIRST.length)]+' '+sur,g:g.name,room:100+room,diet:r<.82?'None':r<.9?'Vegetarian':r<.95?'Gluten-free':r<.985?'Diabetic':'Nut allergy',pass:R()<(t.stage==='Operations'?.75:1)?'Received':'Missing'});
    }
  });
  return out;
}
function genTasks(t,R){
  if(t.stage==='Quote')return [];
  const intl=DESTS[t.dest].intl;
  return TASKT.filter(x=>!x[2]||intl).map((x,i)=>{const due=addDays(t.dep,-x[1]);const past=D(due)<TODAY;
    return {id:i+1,t:x[0],who:i%3===0?'Ops desk':t.agent,due,done:t.stage!=='Operations'?true:(past?R()<.7:R()<.05)};});
}
function genSups(lines,stage,R){
  const seen={},out=[];
  lines.forEach(l=>{if(l.extra||seen[l.sup])return;seen[l.sup]=1;const r=R();
    out.push({n:l.sup,cat:l.type,line:l.id,st:stage==='Quote'?'Not sent':stage!=='Operations'?'Confirmed':r<.6?'Confirmed':r<.85?'Sent':'No reply'});});
  return out;
}
const invNo=R=>'INV-'+(10000+Math.floor(R()*89999));
function mkInv(t,l,R,o){
  o=o||{};const qty=o.qty!=null?o.qty:l.qty,unit=o.unit!=null?o.unit:l.cost;
  return {no:o.no||invNo(R),amt:r2(o.amt!=null?o.amt:qty*unit),qty,unit,rate:l.cur==='USD'?1:r2(t.rate+(R()-.3)*.04),paid:!!o.paid,kind:o.kind||'',st:o.st||'',credit:0,ref:o.ref||''};
}
function settle(l){ // credited gaps carry their credit; accepted/open keep the billed amount
  const i=l.inv;if(!i||!i.kind)return;
  if(i.st==='credited'){i.credit=r2(i.amt-planC(l));i.paid=true;}
}
function addExtra(t,base,name,amt,kind,st,R,ref){
  const id=Math.max(...t.lines.map(x=>x.id))+1;
  const e={id,type:base.type,name,sup:base.sup,qty:0,unit:'',cost:0,scope:'shared',ov:'',comm:0,cur:base.cur,extra:true,inv:null};
  e.inv=mkInv(t,e,R,{amt,qty:1,unit:r2(amt),kind,st,no:ref||undefined,ref:ref||''});
  if(st==='credited'){e.inv.credit=e.inv.amt;e.inv.paid=true;}
  t.lines.push(e);return e;
}
function genInvoices(t,R){
  const st=t.stage;if(st==='Quote')return;
  const toDep=(D(t.dep)-TODAY)/DAY,comps=Math.floor(t.pax/20),n=t.nights;
  const gs=()=>st==='Closed'?(R()<.82?'credited':'accepted'):st==='Finance'?(R()<.55?'open':R()<.6?'disputed':'credited'):'open';
  const isPre=l=>/^Group air/.test(l.name)||l.type==='Insurance';
  const late=st==='Finance'||st==='Closed'||toDep<45;
  t.lines.filter(l=>!l.extra).forEach(l=>{
    let has=st==='Closed'?true:st==='Finance'?(isPre(l)||R()>.1):(isPre(l)||(toDep<45&&R()<.45));
    if(!has){l.inv=null;return;}
    let o={paid:st==='Closed'||isPre(l)||(st==='Finance'&&R()<.5)};
    const r=R();
    if(late&&!isPre(l)){
      if(l.type==='Lodging'&&l.cost>0){if(r<.32)o={...o,qty:l.qty+(R()<.35?2:1)*n,kind:'qty'};else if(r<.5)o={...o,unit:l.cost+8+Math.floor(R()*7),kind:'rate'};}
      else if(l.type==='Lodging'){if(r<.35)o={...o,unit:Math.round(DESTS[t.dest].hotel[1]*.6),kind:'comp'};}
      else if(l.type==='Activities'&&l.unit==='person'&&l.cost>0){if(r<.15&&comps)o={...o,qty:t.pax,kind:'comp'};else if(r<.21)o={...o,unit:Math.round(l.cost*1.15),kind:'rate'};else if(r<.24)o={...o,qty:l.qty-2,kind:'under'};}
      else if(l.type==='Meals'){if(r<.18)o={...o,qty:l.qty+2+Math.floor(R()*5),kind:'qty'};}
    }
    if(o.kind){o.st=o.kind==='under'?(st==='Closed'?'accepted':'open'):gs();if(o.st!=='credited'&&o.st!=='accepted')o.paid=false;}
    l.inv=mkInv(t,l,R,o);settle(l);
    if(late&&l.type==='Transport'&&/coach/i.test(l.name)&&R()<.28){
      const fuel=R()<.5;addExtra(t,l,fuel?'Fuel surcharge (4%)':'Driver overtime, 3 hours',fuel?r2(planC(l)*.04):285,'extra',gs(),R);}
    if(late&&l.type==='Guide'&&R()<.12)addExtra(t,l,'Duplicate of '+l.inv.no,l.inv.amt,'dup',gs(),R,l.inv.no);
  });
}

/* ---------- trips ---------- */
const TRIP_SPECS=[
  ['hl','Grace Fellowship Holy Land Pilgrimage','HolyLand','Grace Fellowship Church','Church','Faith','Priya',38,'2027-03-08',9,'Quote','Draft'],
  ['rom','St. Anne Parish Rome & Assisi','Rome','St. Anne Catholic Parish','Church','Faith','Marcus',32,'2027-04-19',8,'Quote','Approval'],
  ['can','Prairie State Alumni Grand Canyon','Canyon','Prairie State Alumni Assn.','Association','Alumni','Luis',28,'2027-05-10',5,'Quote','Sent'],
  ['irl','Ireland Heritage Tour','Ireland','Riverbend Seniors Club','Club','Senior','Grace',30,'2027-06-14',8,'Quote','Negotiating'],
  ['dc2','Washington DC 8th Grade Trip 2027','Washington','Prairie View Middle School','School','Student','Tom',56,'2027-04-05',4,'Quote','Sent'],
  ['lon','London & Oxford Choir Tour','London','Green Country Youth Chorale','Choir','Choir','Marcus',40,'2027-07-06',7,'Quote','Draft'],
  ['bra','Branson Christmas Shows','Branson','Arrowhead Bank Prime Club','Club','Senior','Dana',46,'2026-11-30',3,'Operations'],
  ['nas','Nashville Gospel Weekend','Nashville','New Hope Baptist Church','Church','Faith','Grace',44,'2026-11-13',3,'Operations'],
  ['nia','Niagara & Toronto Spring Tour','Niagara','Riverbend Seniors Club','Club','Senior','Grace',36,'2027-05-17',5,'Operations'],
  ['dc1','Washington DC Spring Trip','Washington','Heritage Christian Academy','School','Student','Tom',48,'2027-03-22',4,'Operations'],
  ['gre','Footsteps of Paul: Greece','Greece','Cornerstone Community Church','Church','Faith','Priya',34,'2027-04-26',8,'Operations'],
  ['hl2','Holy Land Spring Pilgrimage','HolyLand','Wheatland Travel (partner agency)','Agency','Faith','Priya',40,'2027-02-15',9,'Operations'],
  ['nen','New England Fall Foliage','NewEngland','Arrowhead Bank Prime Club','Club','Senior','Dana',42,'2026-10-06',6,'Finance'],
  ['gc','Canyon & Sedona Fall Tour','Canyon','Tri-County Retired Teachers','Association','Alumni','Luis',30,'2026-09-21',5,'Finance'],
  ['nsh','Nashville Choir Festival','Nashville','Red Earth High School Choir','Choir','Choir','Marcus',52,'2026-09-28',3,'Finance'],
  ['ita','Italy Pilgrimage Fall','Rome','Holy Family Parish','Church','Faith','Marcus',30,'2026-09-14',8,'Finance'],
  ['bro','Branson Summer Shows','Branson','Arrowhead Bank Prime Club','Club','Senior','Dana',48,'2026-07-13',3,'Closed'],
  ['irl0','Ireland Summer Tour','Ireland','Prairie State Alumni Assn.','Association','Alumni','Luis',26,'2026-06-08',8,'Closed'],
  ['dc0','Washington DC Spring 2026','Washington','Prairie View Middle School','School','Student','Tom',54,'2026-04-20',4,'Closed'],
  ['hl0','Holy Land Spring 2026','HolyLand','Grace Fellowship Church','Church','Faith','Priya',36,'2026-03-16',9,'Closed']
];
const HL_ITEMS=[['Arrival at Ben Gurion and transfer',1.5,1],["St. Peter's Church, Jaffa",1.5,1],['Old Jaffa walk',1.5,1],
  ['Mount of Olives panorama',1.5,2],['Garden of Gethsemane',1,2],["St. Anne's Church and Pool of Bethesda",1.5,2],['Via Dolorosa',2,2],['Church of the Holy Sepulchre',1.5,2],
  ['Western Wall',1,3],['Tower of David',2,3],['Garden Tomb',1.5,3],['Israel Museum and Dead Sea Scrolls',2.5,3],['Yad Vashem',2.5,3],
  ['Masada cable car & entry',4,4],['Dead Sea float',2,4],['Qumran',1.5,4],
  ['Jordan River baptism site',2,5],['Nazareth Village',2.5,5],['Cana',1,5],
  ['Sea of Galilee boat',1.5,6],['Capernaum',1.5,6],['Mount of Beatitudes',1,6],['Tabgha',1,6],
  ['Caesarea Philippi',1.5,7],['Golan Heights lookout',1.5,7],['Free afternoon in Tiberias',3,7],
  ['Mount Carmel',1.5,8],['Megiddo',2,8],['Caesarea Maritima',2,8],
  ['Bethlehem, Church of the Nativity',3,9],["Shepherds' Field",1.5,9],['Farewell dinner',2,9],
  ['Free morning',2,10],['Transfer to Ben Gurion',1.5,10],['Optional: Tel Aviv food tour',3,0]];
/* hand-set flagship: returned trip whose invoices are waiting to be read */
const NEN_LINES=[[1,'Lodging','Twin rooms, 6 nights','Maple Ridge Inn',132,'room-night',229,'shared',0],[2,'Lodging','Driver room, 6 nights (comp)','Maple Ridge Inn',6,'room-night',0,'shared',0],
  [3,'Transport','Group air, Tulsa to Boston','SkyGroup Air Desk',42,'person',418,'per person',0],[4,'Transport','Motorcoach, 7 days','Yankee Coach Lines',7,'day',1450,'shared',0],
  [5,'Guide','Step-on guide, 3 days','Foliage Step-On Guides',3,'day',260,'shared',0],[6,'Activities','Scenic railroad','Notch Scenic Railroad',40,'person',45,'per person',0],
  [7,'Activities','Lobster bake','Maine Coast Bakes',40,'person',72,'per person',0],[8,'Activities','Maple farm visit','Sugarhouse Tours',40,'person',15,'per person',0],
  [9,'Meals','Group dinners (6)','New England Dining Group',252,'meal',38,'per person',0],[10,'Insurance','Travel protection','SafeJourney Protection',42,'person',79,'per person',15]];
const NEN_PRE={3:{no:'INV-31877',paid:true},9:{no:'INV-62210'},10:{no:'INV-40391',paid:true}};
const NEN_INBOX=[
  {file:'MapleRidgeInn_INV-20931.pdf',inv:[[1,{no:'INV-20931',qty:138,kind:'qty'}],[2,{no:'INV-20931',unit:129,kind:'comp'}]]},
  {file:'YankeeCoach_INV-55120.pdf',inv:[[4,{no:'INV-55120'}]],extra:[[4,'Fuel surcharge (4%)',406,'extra','INV-55120']]},
  {file:'FoliageStepOn_INV-0412.pdf',inv:[[5,{no:'INV-0412'}]]},
  {file:'FoliageStepOn_INV-0412 (1).pdf',extra:[[5,'Duplicate of INV-0412',780,'dup','INV-0412']]},
  {file:'NotchRailroad_7781.pdf',inv:[[6,{no:'NSR-7781',unit:52,kind:'rate'}]]},
  {file:'MaineCoastBakes_1093.pdf',inv:[[7,{no:'MCB-1093',qty:46,kind:'qty'}]]}];

function buildTrip(sp,i){
  const R=rng(1000+i*77);
  const [id,name,dest,client,ctype,seg,agent,pax,dep,nights,stage,qst]=sp;
  const d=DESTS[dest],cur=d.cur;
  const rate=cur==='USD'?1:r2(BASE_RATE[cur]+(R()-.5)*.03);
  const t={id,name,dest,client,ctype,seg,agent,pax,dep,nights,stage,qst:qst||'',qdays:stage==='Quote'?(qst==='Sent'?(id==='can'?18:9):qst==='Negotiating'?6:2+Math.floor(R()*4)):0,cur,rate,basis:'cost',markups:{...SEG[seg].mk},
    depDue:addDays(dep,-150),balDue:addDays(dep,-60),pct:25,no:id==='hl'?3211:id==='nen'?3187:3000+Math.floor(rng(300+i)()*1999),disc:{},inbox:[]};
  if(id==='nen'){t.depDue='2026-05-01';t.balDue='2026-08-07';t.rate=1;
    t.lines=NEN_LINES.map(x=>({id:x[0],type:x[1],name:x[2],sup:x[3],qty:x[4],unit:x[5],cost:x[6],scope:x[7],ov:'',comm:x[8],inv:null,cur:'USD'}));
    t.lines.forEach(l=>{const p=NEN_PRE[l.id];if(p)l.inv=mkInv(t,l,R,p);});
    t.inbox=JSON.parse(JSON.stringify(NEN_INBOX));
  }else{
    t.lines=genLines(seg,dest,pax,nights);
    genInvoices(t,R);
  }
  if(id==='hl')t.items=HL_ITEMS.map((x,k)=>({id:k+1,name:x[0],hrs:x[1],day:x[2]}));
  else t.items=genItems(dest,nights,R);
  t.tasks=genTasks(t,R);
  t.sups=genSups(t.lines,stage,R);
  t.groups=stage==='Quote'?[]:genGroups(seg,pax,R);
  const dd=D(t.depDue)<TODAY,bd=D(t.balDue)<TODAY;
  t.groups.forEach(g=>{
    if(stage==='Closed'){g.depPaid=g.balPaid=true;}
    else if(stage==='Finance'){g.depPaid=g.balPaid=true;}
    else if(bd){g.depPaid=R()>.02;g.balPaid=g.depPaid&&R()>.12;}
    else if(dd){g.depPaid=R()>.1;g.balPaid=false;}
    else{g.depPaid=R()>.75;g.balPaid=false;}
  });
  const lod=t.lines[0],rooms=Math.round(lod.qty/nights);
  t.room={hotel:lod.sup,held:rooms+(stage==='Operations'?3:2),used:stage==='Quote'?0:rooms};
  t.trav=stage==='Quote'?[]:genTravelers(t,rng(5000+i));
  return t;
}
const TRIPS=TRIP_SPECS.map(buildTrip);

/* ---------- invoice reading (shared by the animation and the tests) ---------- */
function applyInboxFile(t,f){
  const R=rng(4242+t.no+(f.file.length*13));
  (f.inv||[]).forEach(([lid,o])=>{const l=t.lines.find(x=>x.id===lid);if(!l)return;l.inv=mkInv(t,l,R,{...o,st:o.kind?'open':'',paid:!o.kind&&false});});
  (f.extra||[]).forEach(([lid,name,amt,kind,ref])=>{const b=t.lines.find(x=>x.id===lid);addExtra(t,b,name,amt,kind,'open',R,ref);});
}
function applyInbox(t){const n=t.inbox.length;t.inbox.forEach(f=>applyInboxFile(t,f));t.inbox=[];return n;}

/* ---------- pricing and finance logic ---------- */
const mkOf=(t,l)=>(l.ov!==''&&l.ov!=null&&!isNaN(+l.ov))?+l.ov:t.markups[l.type];
const priceC=(t,l)=>t.basis==='cost'?planC(l)*(1+mkOf(t,l)/100):planC(l)/(1-mkOf(t,l)/100);
const effAmt=i=>r2(i.amt-(i.credit||0));
function invStatus(l){
  if(!l.inv)return {k:'none',diff:0,kind:'missing'};
  const i=l.inv,diff=r2(effAmt(i)-planC(l));
  if(Math.abs(diff)<.005)return {k:i.credit?'credited':'match',diff:0,kind:i.kind,st:i.st,credit:i.credit||0};
  return {k:'gap',diff,kind:i.kind||(diff<0?'under':'rate'),st:i.st||'open',credit:i.credit||0};
}
const isOpenGap=s=>s.k==='gap'&&(s.st==='open'||s.st==='disputed');
function discOf(t,o){const out={};if(!t.disc)return out;
  Object.keys(t.disc).forEach(k=>{const d=t.disc[k];if(!d||!(+d.v>0))return;const p=k.split('|'),sh=p[0]==='s';
    const base=o.lines.filter(x=>!x.l.extra&&x.l.type===p[1]&&(x.l.scope==='shared')===sh).reduce((a,x)=>a+x.price,0);
    out[k]=d.m==='%'?r2(base*Math.min(100,+d.v)/100):r2(Math.min(base,sh?+d.v:+d.v*t.pax));});
  return out;}
function calc(t){
  const o={rev:0,plan:0,fc:0,amtDiff:0,fx:0,comm:0,byType:{},lines:[]};
  t.lines.forEach(l=>{
    const lr=lrate(t,l),pc=planC(l),price=r2(priceC(t,l)*lr),planUSD=r2(pc*lr);
    let amtDiff=0,fx=0;
    if(l.inv){const e=effAmt(l.inv);amtDiff=r2((e-pc)*lr);fx=(l.inv.paid&&l.cur!=='USD')?r2(e*(l.inv.rate-t.rate)):0;}
    const fc=r2(planUSD+amtDiff+fx),comm=r2(l.comm/100*pc*lr);
    o.rev=r2(o.rev+price);o.plan=r2(o.plan+planUSD);o.fc=r2(o.fc+fc);
    o.amtDiff=r2(o.amtDiff+amtDiff);o.fx=r2(o.fx+fx);o.comm=r2(o.comm+comm);
    const b=o.byType[l.type]||(o.byType[l.type]={plan:0,fc:0,rev:0});
    b.plan=r2(b.plan+planUSD);b.fc=r2(b.fc+fc);b.rev=r2(b.rev+price);
    o.lines.push({l,price,planUSD,fc,comm,amtDiff,fx});
  });
  o.disc=0;o.discBy=discOf(t,o);
  Object.keys(o.discBy).forEach(k=>{const a=o.discBy[k],ty=k.split('|')[1];o.rev=r2(o.rev-a);o.byType[ty].rev=r2(o.byType[ty].rev-a);o.disc=r2(o.disc+a);});
  o.planProfit=r2(o.rev-o.plan+o.comm);o.fcProfit=r2(o.rev-o.fc+o.comm);
  return o;
}
/* gaps of one trip, in USD */
function tripGaps(t){
  const out=[];
  t.lines.forEach(l=>{const s=invStatus(l),lr=lrate(t,l);
    if(s.k==='gap'||s.k==='credited')out.push({t,l,s,usd:r2((s.k==='credited'?s.credit:s.diff)*lr),orig:r2((effAmt(l.inv)+(l.inv.credit||0)-planC(l))*lr)});});
  return out;
}
const inboxIds=t=>{const s=new Set();(t.inbox||[]).forEach(f=>(f.inv||[]).forEach(x=>s.add(x[0])));return s;};
function gapStats(ts){
  const G={open:0,openN:0,disp:0,dispN:0,acc:0,accN:0,rec:0,recN:0,under:0,underN:0,missing:0,matched:0,received:0,expected:0,byKind:{},bySup:{},list:[]};
  ts.filter(t=>t.stage!=='Quote').forEach(t=>{const ib=inboxIds(t);
    t.lines.forEach(l=>{if(!l.extra)G.expected++;if(l.inv){G.received++;const s=invStatus(l);if(s.k==='match')G.matched++;}
      else if(!l.extra&&!ib.has(l.id)&&(t.stage==='Finance'||t.stage==='Closed'))G.missing++;});
    tripGaps(t).forEach(g=>{
      G.list.push(g);const k=g.s.kind||'rate',st=g.s.k==='credited'?'credited':g.s.st;
      if(g.s.k==='credited'){G.rec=r2(G.rec+g.usd);G.recN++;}
      else if(g.usd<0){G.under=r2(G.under+g.usd);G.underN++;}
      else if(st==='open'){G.open=r2(G.open+g.usd);G.openN++;}
      else if(st==='disputed'){G.disp=r2(G.disp+g.usd);G.dispN++;}
      else{G.acc=r2(G.acc+g.usd);G.accN++;}
      if(g.orig>0){const b=G.byKind[k]||(G.byKind[k]={n:0,amt:0});b.n++;b.amt=r2(b.amt+g.orig);
        const sp=G.bySup[g.l.sup]||(G.bySup[g.l.sup]={n:0,amt:0,rec:0,trips:new Set()});sp.n++;sp.amt=r2(sp.amt+g.orig);sp.trips.add(t.id);if(g.s.k==='credited')sp.rec=r2(sp.rec+g.usd);}
    });
  });
  return G;
}
function lateInfo(t,g){
  const dd=D(t.depDue),bd=D(t.balDue);let amt=0,days=0;
  if(!g.depPaid&&dd<TODAY){amt+=g.dep;days=Math.max(days,Math.floor((TODAY-dd)/DAY));}
  if(!g.balPaid&&bd<TODAY){amt+=g.bal;days=Math.max(days,Math.floor((TODAY-bd)/DAY));}
  return {amt:r2(amt),days};
}
function groupsCalc(t){
  const c=calc(t),rows=t.groups.map(g=>({...g,amt:r2(c.rev*g.size/t.pax)}));
  if(rows.length){const diff=r2(c.rev-rows.reduce((a,g)=>a+g.amt,0));rows[rows.length-1].amt=r2(rows[rows.length-1].amt+diff);}
  rows.forEach(g=>{g.dep=r2(g.amt*t.pct/100);g.bal=r2(g.amt-g.dep);g.paid=r2((g.depPaid?g.dep:0)+(g.balPaid?g.bal:0));g.open=r2(g.amt-g.paid);const li=lateInfo(t,g);g.late=li.amt;g.days=li.days;});
  const collected=r2(rows.reduce((a,g)=>a+g.paid,0));
  return {rows,collected,outstanding:r2(c.rev-collected),perHead:r2(c.rev/t.pax),late:r2(rows.reduce((a,g)=>a+g.late,0))};
}
const monthKey=dt=>{if(dt<TODAY)dt=TODAY;return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');};
const MONTHS=(()=>{const a=[];for(let i=0;i<12;i++){const d=new Date(2026,9+i,1);a.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}return a;})();
const monthLabel=k=>new Date(+k.slice(0,4),+k.slice(5)-1,1).toLocaleDateString(LOC(),{month:'short'});
function portfolio(ts){
  const P={rev:0,plan:0,fc:0,amtDiff:0,fx:0,comm:0,pax:0,col:0,late:0,lateN:0,pipeline:0,pipelineN:0,rows:[],bySeg:{},byDest:{},sup:{},cash:{},aging:[0,0,0],agingN:[0,0,0],fxExp:{},gapN:0,noneN:0,lateGroups:[]};
  MONTHS.forEach(m=>P.cash[m]={in:0,out:0});
  ts.forEach(t=>{
    const c=calc(t);
    if(t.stage==='Quote'){P.pipeline=r2(P.pipeline+c.rev);P.pipelineN++;return;}
    const g=groupsCalc(t);
    P.rev=r2(P.rev+c.rev);P.plan=r2(P.plan+c.plan);P.fc=r2(P.fc+c.fc);P.amtDiff=r2(P.amtDiff+c.amtDiff);P.fx=r2(P.fx+c.fx);P.comm=r2(P.comm+c.comm);
    P.pax+=t.pax;P.col=r2(P.col+g.collected);P.late=r2(P.late+g.late);
    const fp=c.fcProfit,pp=c.planProfit;
    P.rows.push({t,c,g,pp,fp});
    [['bySeg',t.seg],['byDest',t.dest]].forEach(([k,key])=>{const b=P[k][key]||(P[k][key]={rev:0,fp:0,pax:0,n:0});b.rev=r2(b.rev+c.rev);b.fp=r2(b.fp+fp);b.pax+=t.pax;b.n++;});
    g.rows.forEach(r=>{
      if(!r.depPaid){const k=monthKey(D(t.depDue));if(P.cash[k])P.cash[k].in=r2(P.cash[k].in+r.dep);}
      if(!r.balPaid){const k=monthKey(D(t.balDue));if(P.cash[k])P.cash[k].in=r2(P.cash[k].in+r.bal);}
      if(r.late>0){P.lateN++;const bi=r.days<=30?0:r.days<=60?1:2;P.aging[bi]=r2(P.aging[bi]+r.late);P.agingN[bi]++;P.lateGroups.push({t,g:r});}
    });
    c.lines.forEach(x=>{
      const l=x.l,st=invStatus(l);
      if(st.k==='gap')P.gapN++;
      if(st.k==='none'&&!l.extra)P.noneN++;
      const s=P.sup[l.sup]||(P.sup[l.sup]={spend:0,open:0,issues:0,comm:0,trips:new Set()});
      s.spend=r2(s.spend+x.fc);s.comm=r2(s.comm+x.comm);s.trips.add(t.id);
      if(st.k==='gap')s.issues++;
      const unpaid=!(l.inv&&l.inv.paid);
      if(unpaid){
        s.open=r2(s.open+x.fc);
        const amtC=l.inv?effAmt(l.inv):planC(l);
        if(l.cur!=='USD'){const fe=P.fxExp[l.cur]||(P.fxExp[l.cur]={amt:0,usd:0});fe.amt+=amtC;fe.usd=r2(fe.usd+amtC*t.rate);}
        const dt=t.stage==='Finance'||t.stage==='Closed'?new Date(TODAY.getTime()+20*DAY):new Date(D(t.dep).getTime()-14*DAY);
        const k=monthKey(dt);if(P.cash[k])P.cash[k].out=r2(P.cash[k].out+amtC*lrate(t,l));
      }
    });
  });
  P.pp=r2(P.rev-P.plan+P.comm);P.fp=r2(P.rev-P.fc+P.comm);
  P.outstanding=r2(P.rev-P.col);
  return P;
}
