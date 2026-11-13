/* ---------- product-style list screens (v7): Activities, Hotels, Clients ----------
   Loaded before s8_gen.js, so only call s8 helpers lazily. vHotelsList and vClients are NOT
   registered here; the integrator sets VIEWS.hotels=vHotelsList and VIEWS.clients=vClients. */
const AL_NS={act:{rpp:'actRpp',page:'actPage'},htl:{rpp:'htlRpp',page:'htlPage'},cli:{rpp:'cliRpp',page:'cliPage'}};
const AL_KIND={show:'#B71D18',museum:'#5119B7',landmark:'#B76E00',tour:'#0351AB',cruise:'#078DEE',dining:'#C2410C',park:'#118D57'};
const alKindIc=k=>AL_KIND[k]?k:'landmark';
const alCode=id=>{let h=7;for(let i=0;i<String(id).length;i++)h=(h*131+String(id).charCodeAt(i))%9000000;return String(1000000+h);};
const alNorm=s=>String(s||'').toLowerCase();
const alRpp=ns=>{const v=+S[AL_NS[ns].rpp];return [5,10,25].includes(v)?v:10;};
function alPager(ns,total){
  const rpp=alRpp(ns),pages=Math.max(1,Math.ceil(total/rpp));
  let p=+S[AL_NS[ns].page]||0;p=Math.min(Math.max(0,p),pages-1);S[AL_NS[ns].page]=p;
  const from=total?p*rpp+1:0,to=Math.min(total,(p+1)*rpp);
  return {rpp,p,pages,from,to,html:`<div class="al-pg"><span class="al-pgl">${L('שורות בעמוד','Rows per page')}</span>
    <select class="al-rpp" data-al-rpp="${ns}" aria-label="${L('שורות בעמוד','Rows per page')}">${[5,10,25].map(n=>`<option value="${n}" ${n===rpp?'selected':''}>${n}</option>`).join('')}</select>
    <span class="al-pgc">${from}–${to} ${L('מתוך','of')} ${total}</span>
    <button class="al-pgb" data-act="al-prev" data-v="${ns}" ${p<=0?'disabled':''} aria-label="${L('הקודם','Previous')}">${ic('chev','al-l')}</button>
    <button class="al-pgb" data-act="al-next" data-v="${ns}" ${p>=pages-1?'disabled':''} aria-label="${L('הבא','Next')}">${ic('chev','flip')}</button></div>`};
}
const alSearch=(ns,val)=>`<label class="al-search">${ic('search')}<input type="text" data-al-q="${ns}" value="${esc(val||'')}" placeholder="${L('חיפוש','Search')}" aria-label="${L('חיפוש','Search')}"></label>`;
const alTgl=(ns,k,on,txt)=>`<label class="al-tgl"><input type="checkbox" data-al-tgl="${ns}|${k}" ${on?'checked':''}><span class="al-sw"></span>${txt}</label>`;
const alMore=(ns,k)=>`<button class="al-go" data-act="al-open" data-v="${ns||''}|${esc(k||'')}" aria-label="${L('פרטים','Details')}">${ic('chev','flip')}</button>`;
const alEmpty=n=>`<tr><td colspan="${n}" class="al-none">${L('אין תוצאות בסינון הזה.','No results match these filters.')}</td></tr>`;
const alTh=(t,cls)=>`<th${cls?` class="${cls}"`:''}>${t}</th>`;

/* ---- Activities ---- */
function alActRows(){
  const q=alNorm(S.actQ),d=S.actDest||'All';
  return CATALOG.venues.filter(v=>(d==='All'||v.dest===d)&&(!S.actVoucher||v.comm>0)&&(!S.actGroup||v.cost>0)
    &&(!q||alNorm(v.name+' '+dn(v.dest)+' '+alCityName(v.city)).includes(q))).sort((a,b)=>a.name.localeCompare(b.name));
}
function alCityName(id){const c=typeof GEO!=='undefined'&&GEO.cities&&GEO.cities[id];return c?c.n:(id||'');}
function alActBody(){
  const rows=alActRows(),pg=alPager('act',rows.length),page=rows.slice(pg.p*pg.rpp,(pg.p+1)*pg.rpp);
  return `<div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('שם','Name')+' '+ic('up'))}${alTh(L('מיקום','Location'))}${alTh(L('קוד','Code'))}${alTh(L('מחיר לאדם','Price per person'),'n')}${alTh(L('עמלה','Commission'),'n')}<th class="al-ctl"></th></tr></thead><tbody>${
    page.map(v=>`<tr><td><span class="al-nm">${phSrc('venue',v.id)?`<span class="al-thumb al-ph">${phImg('venue',v.id,'',v.name)}</span>`:phSrc('dest',v.dest)?`<span class="al-thumb al-ph">${phImg('dest',v.dest,'','')}</span>`:`<span class="al-thumb" style="--tc:${AL_KIND[alKindIc(v.kind)]}">${ic(alKindIc(v.kind))}</span>`}<span class="al-t"><strong><bdi>${esc(v.name)}</bdi></strong><small>${esc(alCityName(v.city))}</small></span></span></td><td>${dn(v.dest)}</td><td class="al-code">${alCode(v.id)}</td><td class="n">${usd(v.cost)}</td><td class="n">${v.comm}%</td><td class="al-ctl">${alMore('act',v.name)}</td></tr>`).join('')||alEmpty(6)}</tbody></table></div>${pg.html}`;
}
function vActivitiesList(){
  const dests=[...new Set(CATALOG.venues.map(v=>v.dest))].filter(k=>DESTS[k]).sort((a,b)=>dn(a).localeCompare(dn(b)));
  const d=S.actDest||'All';
  return head(L('פעילויות','Activities'),`<button class="btn pri" data-act="al-new" data-v="act">${L('פעילות חדשה','New activity')}</button>`)+
  `<div class="card al-card"><div class="al-filters"><select class="al-sel" data-al-dest="act" aria-label="${L('בחירת מיקומים','Select Locations')}"><option value="All">${L('בחירת מיקומים','Select Locations')}</option>${dests.map(k=>`<option value="${k}" ${d===k?'selected':''}>${dn(k)}</option>`).join('')}</select>
  ${alTgl('act','voucher',S.actVoucher,L('שוברים בלבד','Voucher only'))}${alTgl('act','group',S.actGroup,L('מחיר קבוצות בלבד','Group rate only'))}${alSearch('act',S.actQ)}</div>
  <div id="al-body-act">${alActBody()}</div></div>`;
}
VIEWS.activities=vActivitiesList;

/* ---- Hotels ---- */
const alBrand=f=>(typeof BRANDS!=='undefined'&&BRANDS[f])||{label:f||'Independent',color:'#5B6472'};
const alFiles=n=>{const c=TRIPS.filter(t=>t.room&&t.room.hotel===n).length;return !c?'\u2013':c===1?L('תיק אחד','1 file'):`${c} ${L('תיקים','files')}`;};
const alStars=n=>`<span class="al-stars" aria-label="${n} ${L('כוכבים','stars')}">${ic('star').repeat(n||0)}</span>`;
function alHotelRows(){
  const f=S.htlFam||'All',d=S.htlDest||'All',q=alNorm(S.htlQ);
  return CATALOG.hotels.filter(h=>(f==='All'||h.family===f)&&(d==='All'||h.dest===d)&&(!q||alNorm(h.name+' '+alBrand(h.family).label+' '+alCityName(h.city)+' '+dn(h.dest)).includes(q))).sort((a,b)=>a.name.localeCompare(b.name));
}
function alHotelBody(){
  const rows=alHotelRows(),pg=alPager('htl',rows.length),page=rows.slice(pg.p*pg.rpp,(pg.p+1)*pg.rpp);
  return `<div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('שם','Name')+' '+ic('up'))}${alTh(L('מיקום','Location'))}${alTh(L('רמה','Level'))}${alTh(L('תעריף קבוצה ללילה','Group rate per night'),'n')}${alTh(L('תיקים','Files'),'n')}<th class="al-ctl"></th></tr></thead><tbody>${
    page.map(h=>{const b=alBrand(h.family);return `<tr><td><span class="al-nm">${phSrc('hotel',h.id)?`<span class="al-thumb al-ph">${phImg('hotel',h.id,'',h.name)}</span>`:`<span class="al-thumb al-brand" style="--tc:${esc(b.color)}">${esc(String(b.label).charAt(0))}</span>`}<span class="al-t"><strong><bdi>${esc(h.name)}</bdi></strong><small>${esc(b.label)}</small></span></span></td><td><span class="al-t"><span>${esc(alCityName(h.city))}</span>${alNorm(dn(h.dest))===alNorm(alCityName(h.city))?'':`<small>${dn(h.dest)}</small>`}</span></td><td>${alStars(h.stars)}</td><td class="n">${usd(h.rate)}</td><td class="n">${alFiles(h.name)}</td><td class="al-ctl">${alMore('htl',h.name)}</td></tr>`;}).join('')||alEmpty(6)}</tbody></table></div>${pg.html}`;
}
function vHotelsList(){
  const f=S.htlFam||'All',d=S.htlDest||'All';
  const fams=Object.keys(BRANDS).filter(k=>CATALOG.hotels.some(h=>h.family===k));
  const dests=[...new Set(CATALOG.hotels.map(h=>h.dest))].filter(k=>DESTS[k]).sort((a,b)=>dn(a).localeCompare(dn(b)));
  const blocks=vHotels().replace(/^[\s\S]*?<div class="card scroll">/,'<div class="card scroll">');
  return head(L('מלונות','Hotels'),`<button class="btn pri" data-act="al-new" data-v="htl">${L('מלון חדש','New hotel')}</button>`)+
  `<div class="card al-card"><div class="al-filters"><div class="chips al-chips"><button class="chip ${f==='All'?'on':''}" data-act="al-fam" data-v="All">${L('כל הרשתות','All brands')}</button>${fams.map(x=>`<button class="chip ${f===x?'on':''}" data-act="al-fam" data-v="${esc(x)}">${esc(BRANDS[x].label)}</button>`).join('')}</div>
  <select class="al-sel" data-al-dest="htl" aria-label="${L('יעד','Destination')}"><option value="All">${L('כל היעדים','All destinations')}</option>${dests.map(k=>`<option value="${k}" ${d===k?'selected':''}>${dn(k)}</option>`).join('')}</select>${alSearch('htl',S.htlQ)}</div>
  <div id="al-body-htl">${alHotelBody()}</div></div>
  ${typeof opBlocksCard==='function'?'':`<h2 class="al-h2">${L('בלוקים של חדרים','Room blocks')}</h2>${blocks}`}`;
}

/* ---- Clients ---- */
const CTYPE={Church:['כנסייה','Church','blue'],School:['בית ספר','School','green'],Club:['מועדון','Club','amber'],Association:['עמותה','Association','purple'],Choir:['מקהלה','Choir','red'],Agency:['סוכנות','Agency','teal'],Prospect:['לקוח פוטנציאלי','Prospect','']};
function alClients(){
  const m={};
  TRIPS.forEach(t=>{const c=m[t.client]||(m[t.client]={name:t.client,type:t.ctype,n:0,rev:0,last:null});
    c.n++;if(t.stage!=='Quote')c.rev+=calc(t).rev;if(!c.last||D(t.dep)>D(c.last.dep))c.last=t;});
  return Object.values(m).sort((a,b)=>a.name.localeCompare(b.name));
}
function alCliBody(){
  const q=alNorm(S.cliQ),all=alClients().filter(c=>!q||alNorm(c.name).includes(q));
  const pg=alPager('cli',all.length),page=all.slice(pg.p*pg.rpp,(pg.p+1)*pg.rpp);
  return `<div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('לקוח','Client')+' '+ic('up'))}${alTh(L('סוג','Type'))}${alTh(L('פרויקטים','Projects'),'n')}${alTh(L('הכנסה סגורה','Booked revenue'),'n')}${alTh(L('טיול אחרון','Last trip'))}${alTh(L('סוכן/ת אחראי/ת','Owner agent'))}<th class="al-ctl"></th></tr></thead><tbody>${
    page.map(c=>{const ty=CTYPE[c.type]||[c.type,c.type,''];return `<tr><td><span class="al-nm"><span class="al-thumb al-av">${esc(c.name.charAt(0))}</span><span class="al-t"><strong><bdi>${esc(c.name)}</bdi></strong></span></span></td><td>${pillF(L(ty[0],ty[1]),ty[2])}</td><td class="n">${c.n}</td><td class="n">${c.rev?usd(c.rev):'–'}</td><td>${fmtDate(c.last.dep)}</td><td>${agn(c.last.agent)}</td><td class="al-ctl">${alMore('cli',c.name)}</td></tr>`;}).join('')||alEmpty(7)}</tbody></table></div>${pg.html}`;
}
function vClients(){
  return head(L('לקוחות','Clients'),`<button class="btn pri" data-act="al-new" data-v="cli">${L('לקוח חדש','New client')}</button>`)+
  `<div class="card al-card"><div class="al-filters">${alSearch('cli',S.cliQ)}</div><div id="al-body-cli">${alCliBody()}</div></div>`;
}

/* ---- events ---- */
const AL_BODY={act:alActBody,htl:alHotelBody,cli:alCliBody};
const AL_KEY={act:{q:'actQ',dest:'actDest',voucher:'actVoucher',group:'actGroup'},htl:{q:'htlQ',dest:'htlDest'},cli:{q:'cliQ'}};
const alRefresh=ns=>{const y=window.scrollY;render();window.scrollTo(0,y);};
const alPartial=ns=>{const el=document.getElementById('al-body-'+ns);if(el)el.innerHTML=AL_BODY[ns]();};
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="al-"]');if(!b)return;
  const a=b.dataset.act,v=b.dataset.v;
  if(a==='al-prev'||a==='al-next'){const k=AL_NS[v].page;S[k]=(+S[k]||0)+(a==='al-next'?1:-1);alPartial(v);}
  else if(a==='al-fam'){S.htlFam=v;S.htlPage=0;alRefresh('htl');}
  else if(a==='al-new'){const id={act:'activity',htl:'hotel',cli:'client'}[v];if(id&&typeof formOpen==='function'){formOpen(id,null);render();}else toast(L('יצירה חדשה זמינה במוצר המלא','Creating new records is available in the full product'));}
  else if(a==='al-open'){const [ns,k]=String(v||'').split('|');
    /* v8: clients open the client card; hotels open the supplier card */
    if(ns==='cli'&&typeof spCliOpen==='function'){spCliOpen(k);render();window.scrollTo(0,0);}
    else if(ns==='htl'&&typeof spOpen==='function'&&typeof supByName==='function'&&supByName(k)){S.tab='suppliers';spOpen(supByName(k).id);render();window.scrollTo(0,0);}
    else toast(L('דף הפרטים נפתח במוצר המלא','The detail page opens in the full product'));}
});
document.addEventListener('change',e=>{
  const el=e.target,d=el.dataset;if(!d)return;
  if(d.alRpp){S[AL_NS[d.alRpp].rpp]=+el.value;S[AL_NS[d.alRpp].page]=0;alPartial(d.alRpp);}
  else if(d.alDest){S[AL_KEY[d.alDest].dest]=el.value;S[AL_NS[d.alDest].page]=0;alPartial(d.alDest);}
  else if(d.alTgl){const [ns,k]=d.alTgl.split('|');S[AL_KEY[ns][k]]=el.checked;S[AL_NS[ns].page]=0;alPartial(ns);}
});
document.addEventListener('input',e=>{
  const el=e.target,ns=el.dataset&&el.dataset.alQ;if(!ns)return;
  S[AL_KEY[ns].q]=el.value;S[AL_NS[ns].page]=0;alPartial(ns);
});
