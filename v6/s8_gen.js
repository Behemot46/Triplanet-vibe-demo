/* ---------- trip studio: a live, priced, mapped itinerary generator (v7) ----------
   Uses the same cost lines (genLines) and the same math (calc) as every quote, so a plan
   created here opens as an ordinary quote. Hotel and venue names come from CATALOG (real
   places); their rates are illustrative. */
const HAS_CAT=()=>typeof CATALOG!=='undefined'&&CATALOG&&Array.isArray(CATALOG.hotels);
const catHotels=k=>HAS_CAT()?CATALOG.hotels.filter(h=>h.dest===k):[];
const catVenues=k=>HAS_CAT()?CATALOG.venues.filter(v=>v.dest===k):[];
const destCities=k=>(typeof DEST_CITIES!=='undefined'&&DEST_CITIES[k])||[];
const GEN_NEW=['NewYork','Smokies','SanAntonio','Chicago','NewOrleans'];
const REGC={USA:'#14b8a6',Canada:'#ef4444',Israel:'#f59e0b',Italy:'#6366f1',Greece:'#3b82f6',Ireland:'#22c55e','United Kingdom':'#8b5cf6'};
const VK=new Proxy({},{get:(o,k)=>ic(['show','museum','landmark','tour','cruise','dining','park','travel','hotel','meal','free'].includes(k)?k:'landmark')});
const TYPEC={Lodging:'#0f766e',Transport:'#0e7490',Guide:'#6366f1',Activities:'#f59e0b',Meals:'#ef4444',Insurance:'#94a3b8'};
const TYPEH={Lodging:'לינה',Transport:'הסעות',Guide:'הדרכה',Activities:'אטרקציות',Meals:'ארוחות',Insurance:'ביטוח'};
const tyn=k=>L(TYPEH[k]||k,k);
const G0=()=>({dest:'Nashville',seg:'Faith',pax:44,nights:4,month:'',tier:4,pace:'classic',hotel:'',built:false});
function brandBadge(fam){
  const b=(typeof BRANDS!=='undefined'&&BRANDS[fam])||{label:fam||'Independent',color:'#5B6472'};
  return `<span class="brandb" style="--bc:${esc(b.color)}"><i>${esc(String(b.label).charAt(0))}</i>${esc(b.label)}</span>`;
}
const stars=n=>`<span class="stars" aria-label="${n} ${L('כוכבים','stars')}">${Array.from({length:n||0},()=>ic('star')).join('')}</span>`;
function genMonths(){const out=[];for(let i=1;i<=12;i++){const d=new Date(TODAY.getFullYear(),TODAY.getMonth()+i,1);out.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'));}return out;}
function pickHotel(o){
  const hs=catHotels(o.dest);if(!hs.length)return null;
  const byId=hs.find(h=>h.id===o.hotel);if(byId)return byId;
  return hs.slice().sort((a,b)=>Math.abs(a.stars-o.tier)-Math.abs(b.stars-o.tier)||a.rate-b.rate).at(0);
}
/* motorcoach hours from Tulsa: straight-line distance x 1.12 road factor at 100 km/h, plus 1 h of stops */
function driveH(id){
  const a=typeof GEO!=='undefined'&&GEO.cities.tulsa,b=typeof GEO!=='undefined'&&GEO.cities[id];if(!a||!b)return 6;
  const R=6371,r=Math.PI/180,dl=(b.lat-a.lat)*r,dn2=(b.lon-a.lon)*r,h=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dn2/2)**2;
  const km=2*R*Math.asin(Math.sqrt(h));return Math.min(13,Math.round((km*1.12/100+1)*2)/2);
}
const CITYH={tulsa:'טולסה',branson:'ברנסון',nashville:'נאשוויל',memphis:'ממפיס',washington:'וושינגטון',mountvernon:'מאונט ורנון',boston:'בוסטון',northconway:'נורת׳ קונוויי',stowe:'סטואו',barharbor:'בר הרבור',portlandme:'פורטלנד',grandcanyon:'הגרנד קניון',sedona:'סדונה',phoenix:'פיניקס',niagarafalls:'מפלי ניאגרה',toronto:'טורונטו',buffalo:'באפלו',newyork:'ניו יורק',philadelphia:'פילדלפיה',gatlinburg:'גטלינבורג',pigeonforge:'פיג׳ן פורג׳',knoxville:'נוקסוויל',sanantonio:'סן אנטוניו',austin:'אוסטין',chicago:'שיקגו',neworleans:'ניו אורלינס',jerusalem:'ירושלים',telaviv:'תל אביב',tiberias:'טבריה',nazareth:'נצרת',bethlehem:'בית לחם',deadsea:'ים המלח',masada:'מצדה',rome:'רומא',vatican:'הוותיקן',assisi:'אסיזי',florence:'פירנצה',athens:'אתונה',corinth:'קורינתוס',delphi:'דלפי',dublin:'דבלין',galway:'גולוויי',killarney:'קילרני',moher:'צוקי מוהר',london:'לונדון',oxford:'אוקספורד',stratford:'סטרטפורד'};
const cityName=id=>{if(!id)return '';const c=typeof GEO!=='undefined'&&GEO.cities[id];return L(CITYH[id]||(c?c.n:id),c?c.n:id);};
function kmBetween(a,b){const A=typeof GEO!=='undefined'&&GEO.cities[a],B=typeof GEO!=='undefined'&&GEO.cities[b];if(!A||!B)return null;
  const r=Math.PI/180,h=Math.sin((B.lat-A.lat)*r/2)**2+Math.cos(A.lat*r)*Math.cos(B.lat*r)*Math.sin((B.lon-A.lon)*r/2)**2;return 2*6371*Math.asin(Math.sqrt(h));}
const coachH=km=>Math.max(.5,Math.round(km*1.35/80*2)/2);
/* Bases come from where the catalog has hotels; every attraction belongs to its nearest base
   (within 170 km), so the group never "day-trips" across a country. Nights split by attractions. */
function planBases(o){
  const full=destCities(o.dest),ord=c=>{const i=full.indexOf(c);return i<0?99:i;};
  const hs=catHotels(o.dest),vs=catVenues(o.dest);
  let cities=[...new Set(hs.map(h=>h.city))].sort((a,b)=>ord(a)-ord(b));
  const sel=hs.find(h=>h.id===o.hotel);
  const near=c=>{let best=null,bd=1e9;cities.forEach(b=>{const k=kmBetween(c,b);if(k!=null&&k<bd){bd=k;best=b;}});return bd<=170?best:null;};
  const pools={};cities.forEach(c=>pools[c]=[]);
  vs.forEach(v=>{const b=v.city&&near(v.city);if(b)pools[b].push(v);});
  const maxB=o.nights<=3?1:o.nights<=6?2:3;
  let bases=cities.filter(c=>pools[c].length||(sel&&sel.city===c));
  bases.sort((a,b)=>(sel&&a===sel.city?-1:0)-(sel&&b===sel.city?-1:0)||pools[b].length-pools[a].length);
  bases=bases.slice(0,maxB).sort((a,b)=>ord(a)-ord(b));
  if(!bases.length)bases=cities.slice(0,1);
  const tot=bases.reduce((a,c)=>a+Math.max(1,pools[c].length),0);
  let nights=bases.map(c=>Math.max(1,Math.round(o.nights*Math.max(1,pools[c].length)/tot)));
  while(nights.reduce((a,x)=>a+x,0)>o.nights){const i=nights.indexOf(Math.max(...nights));nights[i]--;}
  while(nights.reduce((a,x)=>a+x,0)<o.nights){const i=nights.indexOf(Math.max(...nights));nights[i]++;}
  const pick=c=>{if(sel&&sel.city===c)return sel;return hs.filter(h=>h.city===c).sort((a,b)=>Math.abs(a.stars-o.tier)-Math.abs(b.stars-o.tier)||a.rate-b.rate).at(0);};
  return bases.map((c,i)=>({city:c,nights:nights[i],hotel:pick(c),pool:pools[c].slice()})).filter(b=>b.nights>0&&b.hotel);
}
function genPlan(o){
  const d=DESTS[o.dest],days=o.nights+1,fxr=BASE_RATE[d.cur]||1,comps=Math.floor(o.pax/20);
  const base0=genLines(o.seg,o.dest,o.pax,o.nights),lod=base0.find(l=>l.type==='Lodging'),rooms=Math.round(lod.qty/o.nights),factor=lod.cost/d.hotel[1];
  let B=HAS_CAT()?planBases(o):[];
  if(!B.length)B=[{city:destCities(o.dest)[0]||'',nights:o.nights,hotel:{name:d.hotel[0],rate:d.hotel[1]*fxr,city:'',stars:3},pool:d.acts.map(a=>({name:a[0],kind:'tour',hrs:a[4],cost:a[2]*fxr,comm:a[3],city:''}))}];
  /* cost lines: one lodging line per base, attractions actually visited */
  const lines=base0.filter(l=>l.type!=='Lodging'&&!(l.type==='Activities'&&!/Concert venue/.test(l.name)));
  let id=Math.max(...base0.map(l=>l.id));const rl=lod.name.split(' rooms')[0];
  B.forEach(b=>{lines.push({id:++id,type:'Lodging',name:`${rl} rooms, ${b.nights} ${b.nights===1?'night':'nights'}`,sup:b.hotel.name,qty:rooms*b.nights,unit:'room-night',cost:Math.round(b.hotel.rate/fxr*factor),scope:'shared',ov:'',comm:0,inv:null,cur:d.cur});
    if(!d.intl)lines.push({id:++id,type:'Lodging',name:`Driver room, ${b.nights} ${b.nights===1?'night':'nights'} (comp)`,sup:b.hotel.name,qty:b.nights,unit:'room-night',cost:0,scope:'shared',ov:'',comm:0,inv:null,cur:d.cur});});
  /* itinerary */
  const start=(o.month||genMonths()[5])+'-10',per={relaxed:1,classic:2,full:3}[o.pace]||2,dayList=[],used=[],toured={};
  const nightBase=[];B.forEach((b,k)=>{for(let n=0;n<b.nights;n++)nightBase.push(k);});
  for(let i=0;i<days;i++){
    const k=i<o.nights?nightBase[i]:nightBase[o.nights-1],b=B[k],it=[];let label=b.city,hrs0=0;
    const hn=b.hotel.name,gwc=(d.gw||'').toLowerCase().replace(/[^a-z]/g,''),gwKm=d.air&&GEO.cities[gwc]?kmBetween(gwc,b.city):0;
    if(i===0){
      if(d.air&&d.intl)it.push({n:L(`נחיתה ב${d.gw} בטיסת הלילה הקבוצתית מטולסה`,`Arrive in ${d.gw} on the overnight group flight from Tulsa`),h:1,k:'travel'});
      else if(d.air)it.push({n:L(`טיסה קבוצתית מטולסה ל${d.gw}`,`Group flight, Tulsa to ${d.gw}`),h:3.5,k:'travel'});
      else it.push({n:L(`אוטובוס תיירים מטולסה ל${cityName(b.city)}`,`Motorcoach from Tulsa to ${cityName(b.city)}`),h:driveH(b.city),k:'travel'});
      if(gwKm>30)it.push({n:L(`העברה ל${cityName(b.city)}`,`Transfer to ${cityName(b.city)}`),h:coachH(gwKm),k:'travel'});
      it.push({n:L(`צ׳ק-אין ב-${hn}`,`Check-in at ${hn}`),h:1,k:'hotel'});
      it.push({n:L('ארוחת ערב קבוצתית לפתיחה','Welcome group dinner'),h:2,k:'meal'});
    }else if(i===days-1){
      it.push({n:L('בוקר חופשי','Free morning'),h:2.5,k:'free'});
      it.push({n:d.air?L(`העברה מ${cityName(b.city)} לשדה התעופה וטיסה הביתה`,`Transfer from ${cityName(b.city)} to the airport and fly home`):L(`אוטובוס התיירים חוזר מ${cityName(b.city)} לטולסה`,`Motorcoach from ${cityName(b.city)} back to Tulsa`),h:d.air?Math.max(2.5,coachH(gwKm||0)+1.5):driveH(b.city),k:'travel'});
    }else{
      const prev=nightBase[i-1];
      if(prev!==k){const km=kmBetween(B[prev].city,b.city)||100;it.push({n:L(`מעבר ל${cityName(b.city)}, צ׳ק-אין ב-${hn}`,`Move to ${cityName(b.city)}, check in at ${hn}`),h:coachH(km)+1,k:'travel'});}
      const moving=prev!==k,daysLeft=nightBase.slice(i).filter(x=>x===k).length||1;
      let budget=8-it.reduce((a,x)=>a+x.h,0),got=0;const want=Math.min(per,Math.max(1,Math.ceil(b.pool.length/daysLeft)));
      while(got<want&&b.pool.length){
        const v=b.pool[0],far=v.city&&v.city!==b.city?kmBetween(v.city,b.city)||0:0,trip=far>35?coachH(far)*2:0,need=(v.hrs||2)+trip;
        if(need>budget&&!(got===0&&!moving&&need<=9.5))break;
        if(trip){it.push({n:L(`יום טיול ל${cityName(v.city)} (נסיעה הלוך ושוב)`,`Day trip to ${cityName(v.city)}, coach both ways`),h:trip,k:'travel'});label=v.city;}
        it.push({n:v.name,h:v.hrs||2,k:v.kind||'tour',real:HAS_CAT()});used.push(v);b.pool.shift();budget-=need;got++;
        if(!got||trip)break;
      }
      if(!toured[b.city]&&budget>=2.5&&o.pace!=='relaxed'&&!it.some(x=>x.k==='travel')){it.push({n:L(`סיור מודרך ב${cityName(b.city)}`,`Guided tour of ${cityName(b.city)}`),h:2.5,k:'tour'});toured[b.city]=1;}
      if(!got&&!it.some(x=>x.k!=='meal'))it.push({n:L(`יום חופשי ב${cityName(b.city)}, סיורי רשות`,`Free day in ${cityName(b.city)}, optional excursions`),h:3,k:'free'});
      if(o.pace==='relaxed'&&budget>=3)it.push({n:L('אחר צהריים חופשי','Free afternoon'),h:3,k:'free'});
      it.push({n:L('ארוחת ערב קבוצתית','Group dinner'),h:1.5,k:'meal'});
    }
    const hrs=r2(it.reduce((a,x)=>a+x.h,0));
    dayList.push({i:i+1,date:addDays(start,i),city:label,cn:cityName(label),base:hn,items:it,hrs,travel:it.some(x=>x.k==='travel'&&x.h>=4)});
  }
  used.forEach(v=>lines.push({id:++id,type:'Activities',name:v.name,sup:v.name,qty:o.pax-comps,unit:'person',cost:Math.round((v.cost||0)/fxr),scope:'per person',ov:'',comm:v.comm||0,inv:null,cur:d.cur}));
  const t={id:'gen',dest:o.dest,seg:o.seg,pax:o.pax,nights:o.nights,cur:d.cur,rate:fxr,basis:'cost',markups:{...SEG[o.seg].mk},disc:{},lines,stage:'Quote'};
  const c=calc(t);
  const route=[];dayList.forEach(x=>{if(x.city&&route.at(-1)!==x.city)route.push(x.city);});
  const past=TRIPS.filter(x=>x.dest===o.dest&&x.stage!=='Quote'),pm=past.length?past.reduce((a,x)=>{const cc=calc(x);return a+cc.planProfit/cc.rev;},0)/past.length:null;
  return {o,d,hotel:B[0].hotel,bases:B,hotels:catHotels(o.dest),t,c,lines,days:dayList,route,start,pp:r2(c.rev/o.pax),margin:c.rev?c.planProfit/c.rev:0,past:past.length,pastM:pm,real:HAS_CAT(),rooms};
}
/* ---------- view ---------- */
function stForm(g){
  const ks=Object.keys(DESTS),ch=(k,v,lab)=>`<button class="chip ${g[k]===v?'on':''}" data-act="gset" data-k="${k}" data-v="${v}">${lab}</button>`;
  return `<div class="card st-form">
   <div class="st-sec"><div class="lbl">${L('יעד','Destination')}<span>${ks.length}</span></div><div class="st-dests">${ks.map(k=>{const d=DESTS[k];return `<button class="st-d ${g.dest===k?'on':''} ${GEN_NEW.includes(k)?'new':''} ${phSrc('dest',k)?'has-ph':''}" style="--dc:${REGC[d.country]||'#14b8a6'}${phSrc('dest',k)?`;--ph:url(${phSrc('dest',k)})`:''}" data-act="gset" data-k="dest" data-v="${k}">${dn(k)}<small>${cn(k)}</small></button>`;}).join('')}</div></div>
   <div class="st-sec"><div class="lbl">${L('סוג קבוצה','Group type')}</div><div class="chips">${Object.keys(SEG).map(s=>ch('seg',s,sn(s))).join('')}</div></div>
   <div class="st-sec"><div class="lbl">${L('נוסעים','Travelers')}</div><div class="st-range"><input type="range" min="12" max="60" value="${g.pax}" data-gen="pax" aria-label="${L('נוסעים','Travelers')}"><output>${g.pax}</output></div></div>
   <div class="st-sec"><div class="lbl">${L('לילות','Nights')}</div><div class="st-range"><input type="range" min="2" max="12" value="${g.nights}" data-gen="nights" aria-label="${L('לילות','Nights')}"><output>${g.nights}</output></div></div>
   <div class="st-sec"><div class="lbl">${L('רמת מלון','Hotel class')}</div><div class="chips">${[3,4,5].map(n=>{const ok=!HAS_CAT()||catHotels(g.dest).some(h=>h.stars===n);return `<button class="chip ${g.tier===n?'on':''}" data-act="gset" data-k="tier" data-v="${n}" ${ok?'':`disabled title="${L(`אין מלון שותף ${n}★ ביעד הזה`,`No ${n}★ partner hotel here`)}"`}>${n} ${ic('star')}</button>`;}).join('')}</div></div>
   <div class="st-sec"><div class="lbl">${L('קצב','Pace')}</div><div class="chips">${[['relaxed',L('רגוע','Relaxed')],['classic',L('קלאסי','Classic')],['full',L('עמוס','Full')]].map(p=>ch('pace',p[0],p[1])).join('')}</div></div>
   <div class="st-sec"><div class="lbl">${L('חודש יציאה','Departure month')}</div><select data-ch="gmonth" aria-label="${L('חודש יציאה','Departure month')}">${genMonths().map(m=>`<option value="${m}" ${(g.month||genMonths()[5])===m?'selected':''}>${monthLabel(m)} ${m.slice(0,4)}</option>`).join('')}</select></div>
   <button class="st-go" data-act="ggo">${ic('magic')} ${g.built?L('בנה מחדש','Rebuild the plan'):L('בנה תוכנית טיול','Build the trip plan')}</button>
  </div>`;
}
function ring(m,line){
  const r=26,C=2*Math.PI*r,v=Math.max(0,Math.min(1,m/.3));
  return `<div class="st-ring"><svg viewBox="0 0 66 66" aria-hidden="true"><circle class="trk" cx="33" cy="33" r="${r}" fill="none" stroke-width="7"/><circle class="val ${m*100<line?'low':''}" cx="33" cy="33" r="${r}" fill="none" stroke-width="7" stroke-dasharray="${(C*v).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 33 33)"/><text x="33" y="38" text-anchor="middle">${Math.round(m*100)}%</text></svg><div><b>${L('שולי רווח מתוכננים','Planned margin')}</b>${m*100<line?L(`מתחת לקו ${line}%`,`Below your ${line}% line`):L(`מעל קו ה-${line}% שלך`,`Above your ${line}% line`)}</div></div>`;
}
function stResult(P,anim){
  const g=P.o,d=P.d,c=P.c,view=typeof geoViewFor==='function'&&P.route.length?geoViewFor(P.route):null;
  const near=(a,b)=>{const p=GEO.cities[a]&&GEO.cities[a].p[view],q=GEO.cities[b]&&GEO.cities[b].p[view];return p&&q&&Math.hypot(p[0]-q[0],p[1]-q[1])<70;};
  const stops=(view==='usa'?['tulsa',...P.route]:P.route).filter((x,i,arr)=>!arr.slice(0,i).some(y=>near(x,y)));
  const map=view?geoMap(view,{stops,hi:P.route[0],numbered:view!=='usa',ariaLabel:L('מפת המסלול','Route map')}):`<div class="small" style="color:var(--hero-mute)">${L('אין מפה ליעד הזה','No map for this destination')}</div>`;
  const end=addDays(P.start,g.nights),cost=r2(c.plan-c.comm);
  const types=Object.keys(c.byType).filter(k=>c.byType[k].plan>0),tot=types.reduce((a,k)=>a+c.byType[k].plan,0)||1;
  const tl=P.days.map((dy,i)=>`<div class="tl-day" style="animation-delay:${anim?i*60:0}ms"><div class="tl-n"><b>${dy.i}</b><small>${new Date(dy.date+'T00:00:00').toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short'})}</small></div>
    <div class="tl-c"><div class="hd"><strong>${esc(dy.cn||dn(g.dest))}</strong>${P.bases.length>1?`<span class="small muted"> · ${esc(dy.base)}</span>`:''}<span class="small muted">${dy.hrs} ${L('שעות','hrs')}</span></div>
    ${dy.items.map(x=>{const pu=x.k!=='travel'&&x.k!=='meal'?phVenueBy(x.n):'';return `<div class="tl-it"><span class="k${pu?' kph':''}">${pu?`<img src="${pu}" alt="" loading="lazy" decoding="async">`:VK[x.k]}</span><span>${esc(x.n)}</span><span class="h">${x.h} ${L('ש׳','h')}</span></div>`;}).join('')}
    <div class="hrs ${dy.hrs>9?'hot':''}"><i style="width:${Math.min(100,dy.hrs/12*100)}%"></i></div>${dy.hrs>9?`<div class="small" style="color:var(--orange);margin-top:4px">${dy.travel?L('יום נסיעה ארוך. כדאי לשקול לינת ביניים.','A long travel day. Consider an overnight stop on the way.'):L('יום ארוך. כדאי לפצל לשני ימים.','A long day. Consider splitting it.')}</div>`:''}</div></div>`).join('');
  const hotels=P.hotels.length?`<div class="card"><h3>${L('מלון','Hotel')} <span class="small muted">· ${L('לחיצה מחליפה ומתמחרת מחדש','click to swap and re-price')}</span></h3><div class="st-hotels">${P.hotels.map(h=>`<button class="hcard ${P.bases.some(b=>b.hotel.id===h.id)?'on':''}" data-act="gset" data-k="hotel" data-v="${esc(h.id)}">${phImg('hotel',h.id,'hc-ph',h.name)}
      <div class="row2">${brandBadge(h.family)}${P.bases.some(b=>b.hotel.id===h.id)?`<span class="pick">${L('בתוכנית','In the plan')}</span>`:''}</div><div class="nm">${esc(h.name)}</div>
      <div class="row2">${stars(h.stars)}<span>${usd(h.rate)} / ${L('לילה','night')}</span></div>${h.note?`<div class="small muted">${esc(h.note)}</div>`:''}</button>`).join('')}</div>
      <p class="st-note">${L('שמות המלונות אמיתיים. התעריפים להמחשה בלבד ואינם הצעת מחיר.','Hotel names are real. Rates are illustrative, not quotes.')}</p></div>`:'';
  const mix=`<div class="card"><h3>${L('לאן הולך הכסף, לנוסע','Where the money goes, per traveler')}</h3><div class="cmix">${types.map(k=>`<i style="width:${c.byType[k].plan/tot*100}%;background:${TYPEC[k]}" title="${tyn(k)}"></i>`).join('')}</div>
    <div class="cleg">${types.map(k=>`<span><b style="background:${TYPEC[k]}"></b>${tyn(k)}<em>${usd(c.byType[k].plan/g.pax)}</em></span>`).join('')}</div></div>`;
  const hist=`<div class="card"><h3>${L('מול ההיסטוריה שלכם','Against your history')}</h3>${P.past?`<p style="margin:0">${L(`${P.past} טיולים קודמים ל${dn(g.dest)} הרוויחו בממוצע ${pct(P.pastM)}. התוכנית הזו מתוכננת ל-${pct(P.margin)}.`,`${P.past} past ${dn(g.dest)} trips planned an average margin of ${pct(P.pastM)}. This plan is set at ${pct(P.margin)}.`)}</p>`:`<p style="margin:0">${L(`אין עדיין טיולים קודמים ל${dn(g.dest)}. המרקאפ נלקח מסוג הקבוצה.`,`No past ${dn(g.dest)} trips yet. Markups come from the group type.`)}</p>`}
    <p class="st-note">${L(`${P.lines.length} שורות עלות, ${c.byType.Activities?P.lines.filter(l=>l.type==='Activities').length:0} אטרקציות, מטבע ${d.cur}. אותו חישוב כמו בכל הצעת מחיר.`,`${P.lines.length} cost lines, ${P.lines.filter(l=>l.type==='Activities').length} attractions, priced in ${d.cur}. Same math as every quote.`)}</p></div>`;
  return `<div class="st-res ${anim?'anim':''}">
   <div class="lk-hero st-hero ${phSrc('dest',g.dest)?'has-ph':''}" ${phSrc('dest',g.dest)?`style="--ph:url(${phSrc('dest',g.dest)})"`:''}><div class="txt"><div class="small" style="color:#5eead4;font-weight:700;letter-spacing:.08em;text-transform:uppercase">${L('טיוטת תוכנית','Draft plan')} · ${sn(g.seg)}</div>
     <h2>${dn(g.dest)}: ${g.nights} ${L('לילות','nights')}, ${g.pax} ${L('נוסעים','travelers')}</h2>
     <div class="st-meta"><span>${fmtDate(P.start)} – ${fmtDate(end)}</span><span>${P.bases.map(b=>esc(b.hotel.name)+(P.bases.length>1?` (${b.nights})`:'')).join(' · ')}</span><span>${P.route.length===1?L('תחנה אחת','1 stop'):`${P.route.length} ${L('תחנות','stops')}`}</span></div>
     <div class="st-price"><div class="pp"><span class="n" data-count="${P.pp}">${usd(P.pp)}</span><small>${L('מחיר לנוסע','price per traveler')}</small></div>${ring(P.margin,S.thresh)}</div>
     <div class="st-kv"><div>${L('מחיר כולל','Total price')}<b>${usd(c.rev)}</b></div><div>${L('רווח מתוכנן','Planned profit')}<b>${usd(c.planProfit)}</b></div><div>${L('עלות לנוסע','Cost per traveler')}<b>${usd(c.plan/g.pax)}</b></div></div>
     <div class="st-actions"><button class="btn glow" data-act="gcreate">${L('צור הצעת מחיר','Create the quote')} ${ic('right','flip')}</button><button class="btn ghost" data-act="ggo">${ic('refresh')} ${L('בנה מחדש','Rebuild')}</button></div></div>
     <div class="st-map">${map}</div></div>
   <div class="st-two"><div class="card"><h3>${L('המסלול יום אחר יום','Day by day')}</h3><div class="tl">${tl}</div></div><div class="st-side">${hotels}${mix}${hist}</div></div></div>`;
}
const GEN_STEPS=[
  g=>L(`קורא טיולים קודמים ל${dn(g.dest)}`,`Reading past ${dn(g.dest)} trips and templates`),
  g=>{const b=genPlan(g).bases;return L(`בוחר ${b.length>1?'מלונות':'מלון'}: ${b.map(x=>x.hotel.name).join(', ')}`,`Choosing ${b.length>1?'hotels':'the hotel'}: ${b.map(x=>x.hotel.name).join(', ')}`);},
  g=>{const r=genPlan(g).route.map(cityName);return r.length>1?L(`בונה מסלול: ${r.join(' ← ')}`,`Routing ${r.length} stops: ${r.join(' → ')}`):L(`בונה מסלול ב${r[0]||dn(g.dest)}`,`Planning the days in ${r[0]||dn(g.dest)}`);},
  g=>L(`מתמחר שורות עלות ב-${DESTS[g.dest].cur}`,`Pricing every cost line in ${DESTS[g.dest].cur}`),
  g=>L(`בודק שולי רווח מול קו ה-${S.thresh}%`,`Checking margin against your ${S.thresh}% line`)];
function stRight(){
  const g=S.gen||(S.gen=G0());
  const busy=S.genBusy!=null&&S.genBusy>=0;
  let right;
  if(busy)right=`<div class="st-busy"><h3>${L('בונה את התוכנית...','Building your plan...')}</h3>${GEN_STEPS.map((f,i)=>i<=S.genBusy?`<div class="st-step ${i<S.genBusy?'done':'cur'}"><span class="dot">${i<S.genBusy?'✓':''}</span>${esc(f(g))}</div>`:'').join('')}</div>`;
  else if(g.built){const anim=!!S.genAnim;S.genAnim=false;right=stResult(genPlan(g),anim);}
  else right=`<div class="st-empty"><div class="big">${L('טיול שלם, מתומחר וממופה, בתוך שניות','A full trip, priced and mapped, in seconds')}</div><p style="margin:0 auto">${L('בחרו יעד, סוג קבוצה וגודל. טריפלאנט בונה מסלול יום אחר יום עם מלונות ואטרקציות אמיתיים, מתמחרת כל שורה ובודקת את שולי הרווח.','Pick a destination, a group type and a size. Triplanet builds a day-by-day route with real hotels and attractions, prices every line and checks the margin.')}</p></div>`;
  return right;
}
function vStudio(){
  const g=S.gen||(S.gen=G0()),right=stRight();
  return head(L('סטודיו לטיולים','Trip studio'),pillF(L('חדש','New'),'green'))+`<p class="muted">${L('מהבקשה של הלקוח להצעה מתומחרת: כל שינוי בצד ימין מתעדכן מיד בתוכנית.','From the client\'s request to a priced proposal. Every change on the left updates the plan instantly.')}</p>
   <div class="st-wrap">${stForm(g)}<div id="st-right">${right}</div></div>`;
}
function genRun(){
  const g=S.gen||(S.gen=G0());
  let rm=false;try{rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  if(rm){g.built=true;S.genBusy=null;S.genAnim=false;render();return;}
  S.genBusy=0;render();
  const tick=()=>{if(S.genBusy==null)return;S.genBusy++;if(S.genBusy>=GEN_STEPS.length){S.genBusy=null;g.built=true;S.genAnim=true;CU_SEEN['studio|']=0;render();return;}render();setTimeout(tick,420);};
  setTimeout(tick,420);
}
function genCreate(){
  const g=S.gen;if(!g)return;const P=genPlan(g);
  const t=blankQuote({name:`${dn(g.dest)}: ${sn(g.seg)} (${g.pax})`,dest:g.dest,seg:g.seg,pax:g.pax,nights:g.nights,agent:agentNow(),client:({Faith:'Cedar Hills Community Church',Student:'Lincoln Park Middle School',Senior:'Prairie Hills Seniors Club',Choir:'Green Country Youth Chorale',Alumni:'Red River Alumni Association'})[g.seg]||'Cedar Hills Community Church',ctype:'Prospect'});
  t.lines=P.lines.map(l=>({...l,inv:null}));let id=0;
  t.items=[];P.days.forEach(dy=>dy.items.forEach(x=>t.items.push({id:++id,name:x.n,hrs:x.h,day:dy.i})));
  t.dep=P.start;t.depDue=addDays(P.start,-150);t.balDue=addDays(P.start,-60);
  t.sups=genSups(t.lines,'Quote',rng(9000+S.nid));t.room={hotel:t.lines[0].sup,held:0,used:0};
  openTrip(t.id,'costs');render();window.scrollTo(0,0);toast(L('נוצרה הצעת מחיר מהתוכנית','Quote created from the plan'));
  return t;
}
/* ---------- wiring ---------- */
NAV2.unshift(['studio',['סטודיו לטיולים','Trip studio'],ic('studio')]);
VIEWS.studio=vStudio;
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  if(a==='gset'){const g=S.gen||(S.gen=G0()),k=b.dataset.k;g[k]=k==='tier'?+v:v;if(k==='dest'||k==='tier')g.hotel='';if(k==='dest'&&HAS_CAT()){const st=[...new Set(catHotels(v).map(h=>h.stars))];if(st.length&&!st.includes(g.tier))g.tier=st.sort((a,b)=>Math.abs(a-g.tier)-Math.abs(b-g.tier))[0];}render();}
  else if(a==='ggo')genRun();
  else if(a==='gcreate')genCreate();
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&el.dataset.ch==='gmonth'){(S.gen||(S.gen=G0())).month=el.value;render();}});
let genRaf=0;
document.addEventListener('input',e=>{
  const el=e.target,k=el.dataset&&el.dataset.gen;if(!k)return;
  (S.gen||(S.gen=G0()))[k]=+el.value;
  const out=el.parentNode&&el.parentNode.querySelector('output');if(out)out.textContent=el.value;
  if(genRaf)return;genRaf=requestAnimationFrame(()=>{genRaf=0;const r=document.getElementById('st-right');if(r){r.innerHTML=trHtml(stRight());}});
});

/* ---------- real brands in the existing data ----------
   A trip gets a real catalog hotel only when none of its invoices carries a gap (quotes, and
   bookings whose hotel bills have not arrived or matched). Overbilling stories stay on the
   fictional suppliers; check6.js asserts that no catalog name ever appears in a gap. */
function brandSwap(t,i){
  if(!HAS_CAT()||t.id==='nen')return t;
  if(t.lines.some(l=>l.inv&&(l.inv.kind||invStatus(l).k==='gap')))return t;
  const hs=catHotels(t.dest).filter(h=>h.stars>=4);if(!hs.length)return t;
  const h=hs.at(i%hs.length),old=t.lines.find(l=>l.type==='Lodging');if(!old)return t;
  const was=old.sup;t.lines.forEach(l=>{if(l.sup===was)l.sup=h.name;});
  if(t.room&&t.room.hotel===was)t.room.hotel=h.name;
  if(t.sups)t.sups.forEach(s=>{if(s.n===was)s.n=h.name;});
  return t;
}
TRIPS.forEach((t,i)=>brandSwap(t,i));
{const b0=buildTrip;buildTrip=function(sp,i){return brandSwap(b0(sp,i),i);};}
/* hotels screen: partner hotels from the catalog, then the room blocks table */
const vHotels0=VIEWS.hotels;
function vHotels2(){
  if(!HAS_CAT())return vHotels0();
  const f=S.hFam||'All',dk=S.hDest||'All';
  const fams=[...new Set(CATALOG.hotels.map(h=>h.family))];
  const hs=CATALOG.hotels.filter(h=>(f==='All'||h.family===f)&&(dk==='All'||h.dest===dk));
  const use=n=>TRIPS.filter(t=>t.room&&t.room.hotel===n).length;
  const cards=hs.map(h=>{const u=use(h.name);return `<div class="hcard" style="cursor:default">${phImg('hotel',h.id,'hc-ph',h.name)}<div class="row2">${brandBadge(h.family)}${u?`<span class="pick">${u===1?L('תיק אחד','1 file'):`${u} ${L('תיקים','files')}`}</span>`:''}</div><div class="nm">${esc(h.name)}</div>
    <div class="row2">${stars(h.stars)}<span>${usd(h.rate)} / ${L('לילה','night')}</span></div><div class="small muted">${dn(h.dest)}${h.note?' · '+esc(h.note):''}</div></div>`;}).join('');
  const blocks=vHotels0().replace(/^[\s\S]*?<div class="card scroll">/,'<div class="card scroll">');
  return head(L('מלונות','Hotels'),`<span class="small muted">${CATALOG.hotels.length} ${L('מלונות','hotels')} · ${fams.length} ${L('רשתות','brands')}</span>`)+
  `<p class="muted">${L('מלונות שותפים לפי יעד ורשת, עם תעריף הקבוצה שלכם. אותם מלונות זמינים בסטודיו לטיולים.','Partner hotels by destination and brand, with your group rate. The same hotels feed the trip studio.')}</p>
  <div class="row" style="gap:10px;margin:10px 0 12px;flex-wrap:wrap"><div class="chips"><button class="chip ${f==='All'?'on':''}" data-act="hfam" data-v="All">${L('כל הרשתות','All brands')}</button>${fams.map(x=>`<button class="chip ${f===x?'on':''}" data-act="hfam" data-v="${esc(x)}">${esc((BRANDS[x]||{label:x}).label)}</button>`).join('')}</div>
  <select data-ch="hdest" aria-label="${L('יעד','Destination')}"><option value="All">${L('כל היעדים','All destinations')}</option>${Object.keys(DESTS).map(k=>`<option value="${k}" ${dk===k?'selected':''}>${dn(k)}</option>`).join('')}</select></div>
  <div class="st-hotels" style="margin-bottom:16px">${cards||`<p class="muted">${L('אין מלונות בסינון הזה.','No hotels in this filter.')}</p>`}</div>
  <p class="st-note" style="margin:-6px 0 14px">${L('שמות המלונות והרשתות אמיתיים. התעריפים להמחשה בלבד. אין שימוש בלוגו רשמי.','Hotel and brand names are real. Rates are illustrative. No official logos are used.')}</p>
  <h2 style="margin-bottom:10px">${L('בלוקים של חדרים','Room blocks')}</h2>${blocks}`;
}
VIEWS.hotels=vHotels2;
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="hfam"]');if(b){S.hFam=b.dataset.v;render();}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&el.dataset.ch==='hdest'){S.hDest=el.value;render();}});
