/* ---------- v8 module tb (day): trip builder, by day view upgrade ----------
   Owns the ONLY pPlan wrapper: a switch bar built from TB_VIEWS (sorted by order) and the day/map views.
   - Day details card for the open day: description, day photo, Global payment and Payment per participant tables.
   - tbdDayCosts(t): pure allocation of every non-extra line's planUSD over its active days (spec A15).
   - tbdSaveTpl(t,d): saves a day as a template (PERSIST 'tbd-tpl'), appended to allTpl() so indices stay stable.
   - Map view: base cities and day order with geoMap / geoViewFor; neutral card when no geometry. */
Object.assign(S,{tbView:'day'});
const TBD_TPL=[];
PERSIST.push({key:'tbd-tpl',get:()=>TBD_TPL.map(x=>JSON.parse(JSON.stringify(x))),set:v=>{TBD_TPL.length=0;(Array.isArray(v)?v:[]).forEach(x=>TBD_TPL.push(x));},reset:()=>{TBD_TPL.length=0;}});
TRIP_INIT.push(t=>{if(!t.dayInfo||typeof t.dayInfo!=='object')t.dayInfo={};});
TRIPS.forEach(t=>{if(!t.dayInfo||typeof t.dayInfo!=='object')t.dayInfo={};});
{const a0=allTpl;allTpl=function(){return a0().concat(TBD_TPL.map(x=>({...x,n:[...x.n],tag:[...x.tag],items:x.items.map(i=>[...i])})));};}

/* ----- day costs (pure) ----- */
const tbdSub=(a,b)=>a.length>=8&&b.includes(a);
const tbdLike=(a,b)=>a===b||tbdSub(a,b)||tbdSub(b,a);
const tbdUniq=a=>[...new Set(a)].sort((x,y)=>x-y);
function tbdActive(t,l,D,N,hrs){
  const all=[...Array(D).keys()].map(k=>k+1),nm=String(l.name||'').toLowerCase(),un=String(l.unit||'').toLowerCase();
  if(l.type==='Lodging')return N>=1?all.slice(0,N):[1];
  if(l.type==='Insurance')return [1];
  if(l.type==='Transport'){
    if(/transfer/.test(un)||/transfer/.test(nm))return tbdUniq([1,D]);
    if(un==='person'||/air|flight/.test(nm))return [1];
    const k=Math.max(1,Math.min(D,Math.round(l.qty)||D));return all.slice(0,k);
  }
  if(l.type==='Guide'){
    const k=Math.max(1,Math.min(D,Math.round(l.qty)||1));if(k>=D)return all;
    return tbdUniq(all.slice().sort((a,b)=>(hrs[b]-hrs[a])||(a-b)).slice(0,k));
  }
  if(l.type==='Meals'){
    const m=nm.match(/\((\d+)\)/),mc=Math.max(1,m?+m[1]:Math.round(l.qty/Math.max(1,t.pax))||1),st=/lunch/.test(nm)&&D>2?2:1;
    const d=all.filter(x=>x>=st&&x<st+mc);return d.length?d:[1];
  }
  if(l.type==='Activities'){
    const its=t.items.filter(i=>i.day>0&&i.day<=D),n0=String(l.name||'').toLowerCase();
    let m=its.filter(i=>String(i.name).toLowerCase()===n0);
    if(!m.length&&n0)m=its.filter(i=>tbdLike(String(i.name).toLowerCase(),n0));
    return tbdUniq(m.map(i=>i.day));
  }
  return [1];
}
function tbdDayCosts(t){
  const D=t.nights+1,N=t.nights,days={},hrs={};
  for(let d=1;d<=D;d++){days[d]={shared:[],pp:[],total:0};hrs[d]=dayHours(t,d);}
  const c=calc(t);let unsched=0,sum=0;const unschedLines=[];
  c.lines.forEach(x=>{
    if(x.l.extra)return;const amt=x.planUSD;sum=r2(sum+amt);
    const act=tbdActive(t,x.l,D,N,hrs);
    if(!act.length){unsched=r2(unsched+amt);unschedLines.push({l:x.l,amt});return;}
    const per=r2(amt/act.length);let used=0;
    act.forEach((d,i)=>{const a=i===act.length-1?r2(amt-used):per;used=r2(used+a);
      days[d][x.l.scope==='shared'?'shared':'pp'].push({l:x.l,amt:a});days[d].total=r2(days[d].total+a);});
  });
  return {days,unsched,unschedLines,sum};
}

/* ----- text and photos ----- */
function tbdDefaultDesc(t,d){
  const D=t.nights+1;if(d===1)return introOf(t);
  const its=t.items.filter(i=>i.day===d).map(i=>i.name),list=its.join(', ');
  if(!its.length)return L('יום חופשי לפי בחירת הקבוצה.','A free day at the group\'s own pace.');
  return d===D?L('יום העזיבה: '+list+'.','Departure day: '+list+'.'):L('היום: '+list+'. ארוחת ערב ולינה במלון.','Today: '+list+'. Dinner and the night at the hotel.');
}
const tbdInfo=(t,d)=>{if(!t.dayInfo)t.dayInfo={};return t.dayInfo[d]||(t.dayInfo[d]={});};
const tbdDesc=(t,d)=>{const i=t.dayInfo&&t.dayInfo[d];return i&&i.desc!=null?i.desc:tbdDefaultDesc(t,d);};
const tbdVenues=()=>(typeof CATALOG!=='undefined'&&CATALOG.venues)||[];
function tbdPhotoUrl(t,k){if(!k)return '';if(k==='dest')return phSrc('dest',t.dest);if(k.indexOf('v:')===0)return phSrc('venue',k.slice(2));return '';}
function tbdPhotos(t,d){
  const out=[],seen={},add=(k,label)=>{if(out.length>=6||seen[k]||!tbdPhotoUrl(t,k))return;seen[k]=1;out.push({k,label,u:tbdPhotoUrl(t,k)});};
  add('dest',dn(t.dest));
  const V=tbdVenues(),its=t.items.filter(i=>i.day===d);
  its.forEach(i=>{const n=String(i.name).toLowerCase(),v=V.find(v=>phSrc('venue',v.id)&&tbdLike(n,v.name.toLowerCase()));if(v)add('v:'+v.id,v.name);});
  V.filter(v=>v.dest===t.dest).forEach(v=>add('v:'+v.id,v.name));
  return out;
}
function tbdPhotoKey(t,d){
  const i=t.dayInfo&&t.dayInfo[d];if(i&&i.img&&tbdPhotoUrl(t,i.img))return i.img;
  const its=t.items.filter(x=>x.day===d),V=tbdVenues();
  for(const it of its){const n=String(it.name).toLowerCase(),v=V.find(v=>phSrc('venue',v.id)&&tbdLike(n,v.name.toLowerCase()));if(v)return 'v:'+v.id;}
  return 'dest';
}

/* ----- mutations (named, called by the handlers and by the tests) ----- */
function tbdSetDesc(t,d,txt){tbdInfo(t,d).desc=String(txt);}
function tbdResetDesc(t,d){const i=tbdInfo(t,d);delete i.desc;}
function tbdSetImg(t,d,k){tbdInfo(t,d).img=k;}
function tbdSaveTpl(t,d){
  const its=t.items.filter(i=>i.day===d);if(!its.length)return null;
  const taken=new Set(allTpl().map(x=>x.n[1])),base='My day: '+t.name+', day '+d;let en=base,k=2;
  while(taken.has(en))en=base+' ('+(k++)+')';
  const tpl={n:['היום שלי: '+t.name+', יום '+d+(k>2?' ('+(k-1)+')':''),en],dest:t.dest,tag:['שמור','Saved'],items:its.map(i=>[i.name,i.hrs])};
  TBD_TPL.push(tpl);return tpl;
}

/* ----- views ----- */
const tbdViews=()=>Object.keys(TB_VIEWS).map(k=>({k,...TB_VIEWS[k]})).sort((a,b)=>(a.order||9)-(b.order||9));
function tbdBar(){
  const vs=tbdViews(),cur=TB_VIEWS[S.tbView]?S.tbView:'day';
  return `<div class="tbd-bar" role="tablist" aria-label="${L('תצוגת בניית תוכנית','Itinerary view')}">${vs.map(v=>`<button class="${cur===v.k?'on':''}" role="tab" aria-selected="${cur===v.k}" data-act="tb-view" data-v="${v.k}">${v.icon?ic(v.icon):''}<span>${L(v.he,v.en)}</span></button>`).join('')}</div>`;
}
function tbdCostTable(t,rows,pp){
  if(!rows.length)return `<p class="small muted tbd-none">${L('אין שורות פעילות ביום הזה.','No lines active on this day.')}</p>`;
  const tot=rows.reduce((a,x)=>a+x.amt,0);
  return `<div class="scroll"><table class="tbl tbd-tbl"><thead><tr><th>${L('שירות','Service')}</th><th>${L('ספק','Supplier')}</th>${pp?`<th class="n">${L('לנוסע','Per traveler')}</th>`:''}<th class="n">${L('עלות היום','Day cost')}</th></tr></thead><tbody>${rows.map(x=>`<tr><td><span class="small muted">${tn(x.l.type)}</span><div>${esc(x.l.name)}</div></td><td>${esc(x.l.sup)}</td>${pp?`<td class="n">${usd(x.amt/t.pax,2)}</td>`:''}<td class="n">${usd(x.amt,2)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2">${L('סה"כ','Total')}</td>${pp?`<td class="n">${usd(tot/t.pax,2)}</td>`:''}<td class="n">${usd(tot,2)}</td></tr></tfoot></table></div>`;
}
function tbdDetails(t,d){
  const C=tbdDayCosts(t),dc=C.days[d];if(!dc)return '';
  const key=tbdPhotoKey(t,d),pics=tbdPhotos(t,d),has=t.items.some(i=>i.day===d),edited=t.dayInfo&&t.dayInfo[d]&&t.dayInfo[d].desc!=null;
  return `<div class="card tbd-det" data-tbd-day="${d}">
    <div class="tbd-hd"><h3>${L('פרטי יום ','Day details · Day ')}${d}</h3><div class="row"><span class="tbd-tot">${L('עלות היום','Day cost')} <b>${usd(dc.total,2)}</b></span><button class="btn sm" data-act="tbd-savetpl" data-v="${d}" ${has?'':'disabled'} title="${L('שמירת היום כתבנית לשימוש חוזר','Save this day as a reusable template')}">${ic('templates')} ${L('שמור יום כתבנית','Save day as template')}</button></div></div>
    <div class="tbd-top"><div class="tbd-ph" role="img" aria-label="${L('תמונת היום','Day photo')}" style="${phBg(tbdPhotoUrl(t,key),'background:var(--recess)')}"></div>
      <div class="tbd-tx"><label for="tbd-desc-${d}">${L('תיאור היום','Day description')}</label><textarea id="tbd-desc-${d}" rows="4" data-tbd="desc" data-v="${d}">${esc(tbdDesc(t,d))}</textarea>${edited?`<button class="btn sm" data-act="tbd-descreset" data-v="${d}">${ic('restart')} ${L('החזר לטקסט המקורי','Restore default text')}</button>`:''}</div></div>
    <div class="tbd-sec"><div class="small muted">${L('תמונת היום','Day photo')}</div><div class="tbd-picks">${pics.map(p=>`<button class="tbd-pick ${p.k===key?'on':''}" data-act="tbd-img" data-v="${esc(p.k)}" data-d="${d}" aria-pressed="${p.k===key}" title="${esc(p.label)}" style="${phBg(p.u,'')}"><span>${esc(p.label)}</span></button>`).join('')||`<span class="small muted">${L('אין תמונות ליעד.','No photos for this destination.')}</span>`}</div></div>
    <div class="tbd-2"><div><h4>${L('תשלום כללי','Global payment')} <span class="small muted">${L('שורות משותפות הפעילות ביום הזה','shared lines active on this day')}</span></h4>${tbdCostTable(t,dc.shared,false)}</div>
    <div><h4>${L('תשלום לנוסע','Payment per participant')} <span class="small muted">${L('שורות לנוסע הפעילות ביום הזה','per-person lines active on this day')}</span></h4>${tbdCostTable(t,dc.pp,true)}</div></div>
    ${C.unsched>0?`<p class="small muted tbd-un">${L('עלות שלא שויכה ליום (פעילויות שלא שובצו): ','Cost not tied to a day (unscheduled activities): ')}<b>${usd(C.unsched,2)}</b> · ${L('סה"כ בתוכנית','Plan total')} ${usd(C.sum,2)}</p>`:''}</div>`;
}
function tbdDay(t,p0){
  let h=p0(t);
  if(S.openDay>0&&S.openDay<=t.nights+1){
    const m=`<div class="acc" data-day="${S.openDay}">`,i=h.indexOf(m);
    if(i>=0){
      let j=h.indexOf('<div class="acc" data-day="',i+m.length);
      if(j<0)j=h.indexOf('<p class="small muted">',i+m.length);
      const card=tbdDetails(t,S.openDay);
      h=j>=0?h.slice(0,j)+card+h.slice(j):h+card;
    }
  }
  return h;
}
const TBD_P0=pPlan;
pPlan=function(t){return tbdBar()+(S.tbView==='day'||!TB_VIEWS[S.tbView]?tbdDay(t,TBD_P0):TB_VIEWS[S.tbView].render(t));};
TB_VIEWS.day={he:'לפי יום',en:'By day',icon:'calendar',order:1,render:t=>tbdDay(t,TBD_P0)};

/* ----- map ----- */
function tbdDayCity(t,d,prev){
  const V=tbdVenues(),cnt={};
  t.items.filter(i=>i.day===d).forEach(i=>{const n=String(i.name).toLowerCase(),v=V.find(v=>v.city&&v.dest===t.dest&&tbdLike(n,v.name.toLowerCase()));if(v)cnt[v.city]=(cnt[v.city]||0)+1;});
  const k=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]);return k[0]||prev;
}
function tbdRoute(t){
  const full=(typeof DEST_CITIES!=='undefined'&&DEST_CITIES[t.dest])||[],D=t.nights+1,days=[];let prev=full[0]||'';
  for(let d=1;d<=D;d++){prev=tbdDayCity(t,d,prev);days.push({d,city:prev});}
  const ok=c=>typeof GEO!=='undefined'&&GEO.cities&&GEO.cities[c],seq=days.map(x=>x.city).filter(ok).filter((c,i,a)=>!i||a[i-1]!==c);
  return {days,stops:seq.length?seq:full.filter(ok),full};
}
function tbdMap(t){
  const R=tbdRoute(t),cn_=id=>(typeof GEO!=='undefined'&&GEO.cities[id]&&GEO.cities[id].n)||id;
  const view=R.stops.length&&typeof geoViewFor==='function'?geoViewFor(R.stops):null;
  let svg='';
  if(view){
    const near=(a,b)=>{const p=GEO.cities[a]&&GEO.cities[a].p[view],q=GEO.cities[b]&&GEO.cities[b].p[view];return p&&q&&Math.hypot(p[0]-q[0],p[1]-q[1])<40;};
    let stops=(view==='usa'?['tulsa',...R.stops]:R.stops).filter((x,i,arr)=>!arr.slice(0,i).some(y=>y===x||near(x,y)));
    if(stops.some(s=>GEO.cities[s]&&GEO.cities[s].p[view]))svg=geoMap(view,{stops,hi:R.stops[0],numbered:view!=='usa',ariaLabel:L('מפת המסלול','Route map')});
  }
  const list=R.days.map(x=>{const its=t.items.filter(i=>i.day===x.d);return `<div class="tbd-md"><b>${L('יום ','Day ')}${x.d}</b>${x.city&&GEO.cities[x.city]?`<span class="small muted">${ic('pin')} ${esc(cn_(x.city))}</span>`:''}<div class="small">${its.map(i=>esc(i.name)).join(' · ')||`<span class="muted">${L('יום חופשי','Free day')}</span>`}</div></div>`;}).join('');
  const un=t.items.filter(i=>i.day===0);
  return `<div class="pg tbd-map"><div class="card"><h3>${L('מסלול הטיול','Trip route')} <span class="small muted">· ${dn(t.dest)}</span></h3>${svg?`<div class="tbd-svg">${svg}</div>`:`<p class="muted small tbd-nomap">${ic('mapsq')} ${L('אין מפה ליעד הזה. הנה סדר הימים.','No map for this destination. Here is the day order.')}</p>`}
    ${R.stops.length?`<p class="small muted">${R.stops.map(c=>esc(cn_(c))).join(' › ')}</p>`:''}</div>
    <div class="card"><h3>${L('סדר הימים','Day order')}</h3><div class="tall" style="max-height:560px">${list}${un.length?`<div class="tbd-md"><b>${L('לא משובץ','Unscheduled')}</b><div class="small">${un.map(i=>esc(i.name)).join(' · ')}</div></div>`:''}</div></div></div>`;
}
TB_VIEWS.map={he:'מפה',en:'Map',icon:'mapsq',order:3,render:tbdMap};

/* ----- handlers ----- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;if(a.indexOf('tb-view')!==0&&a.indexOf('tbd-')!==0)return;
  const t=T(),v=b.dataset.v;
  if(a==='tb-view'){S.tbView=v;render();}
  else if(a==='tbd-img'&&t){tbdSetImg(t,+b.dataset.d,v);save();render();}
  else if(a==='tbd-descreset'&&t){tbdResetDesc(t,+v);save();render();}
  else if(a==='tbd-savetpl'&&t){const x=tbdSaveTpl(t,+v);if(x){save();render();toast(L('היום נשמר כתבנית ומופיע ברשימת התבניות','Day saved as a template. Find it in the templates list.'));}}
});
document.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset||el.dataset.tbd!=='desc')return;const t=T();if(!t)return;tbdSetDesc(t,+el.dataset.v,el.value);save();
});

/* ----- tests (A8) ----- */
TESTS.push({name:'tbday',run:h=>{
  const out=[];
  TRIPS.forEach(t=>{
    const C=tbdDayCosts(t),want=calc(t).lines.filter(x=>!x.l.extra).reduce((a,x)=>a+x.planUSD,0);
    const got=Object.values(C.days).reduce((a,d)=>a+d.total,0)+C.unsched;
    if(Math.abs(got-want)>0.01)out.push(`day costs ${t.id} ${got} vs ${want}`);
    if(Math.abs(C.sum-want)>0.01)out.push(`day sum ${t.id}`);
    Object.entries(C.days).forEach(([d,x])=>{const s=[...x.shared,...x.pp].reduce((a,y)=>a+y.amt,0);if(Math.abs(s-x.total)>0.01)out.push(`day ${t.id}/${d} rows vs total`);});
  });
  const t=h.X.byId('hl');
  const n0=allTpl().length,tpl=tbdSaveTpl(t,1);
  if(!tpl)out.push('save tpl returned null');
  else{
    const A=allTpl();if(A.length!==n0+1||A[A.length-1].n[1]!==tpl.n[1])out.push('template not appended last');
    const tpl2=tbdSaveTpl(t,1);if(!tpl2||tpl2.n[1]===tpl.n[1])out.push('duplicate template name');
    const idx=allTpl().findIndex(y=>y.n[1]===tpl.n[1]),before=t.items.length,k=dndAddTpl(t,idx,2,null);
    if(!k||t.items.length!==before+k)out.push('dndAddTpl with saved template');
    S.lang='en';S.role='manager';S.tripId='hl';S.tab='trip';S.ptab='plan';S.tbView='day';S.openDay=1;S.tplDest='All';S.tplQ='';
    const hh=vTrip();if(!hh.includes('data-tpl="'+idx+'"')&&!hh.includes(tpl.n[1].replace(/&/g,'&amp;')))out.push('saved template not in rail');
    if(JSON.stringify(PERSIST.find(p=>p.key==='tbd-tpl').get()).length<5)out.push('persist empty');
  }
  ['en','he'].forEach(lang=>['manager','accountant',h.X.ROLE_KEYS[2]].forEach(role=>{
    S.lang=lang;S.role=role;S.tab='trip';S.ptab='plan';
    const vis=h.X.visibleTrips(),qs=vis.filter(x=>x.stage==='Quote'),ops=vis.find(x=>x.stage==='Operations'),pick=role==='manager'?qs.concat(ops?[ops]:[]):qs.slice(0,2).concat(ops?[ops]:[]);
    pick.forEach(x=>{S.tripId=x.id;
      Object.keys(TB_VIEWS).forEach(v=>{S.tbView=v;[1,2,0].forEach(od=>{if(od>x.nights+1)return;S.openDay=od;
        try{const html=vTrip();h.chk(html,`tbday ${lang}/${role}/${x.id}/${v}/${od}`);if(lang==='en')h.scan(html,`tbday ${x.id}/${v}`);}catch(e){out.push(`render ${lang}/${role}/${x.id}/${v}: ${e.message}`);}});});});
  }));
  S.tbView='day';S.role='manager';S.lang='en';
  return out;
}});
