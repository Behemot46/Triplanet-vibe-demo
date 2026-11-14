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
/* v8.2 photo cards shared by Activities and Hotels (catalog grid) */
const cgBg=(src,color)=>src?phBg(src,''):`background:linear-gradient(135deg,color-mix(in srgb,${color||'#078DEE'} 62%,#0b1b2e),${color||'#078DEE'})`;
const cgGrid=(cards,empty)=>cards.length?`<div class="cg-grid">${cards.join('')}</div>`:`<div class="cg-none">${empty}</div>`;
function alActBody(){
  const rows=alActRows(),pg=alPager('act',rows.length),page=rows.slice(pg.p*pg.rpp,(pg.p+1)*pg.rpp);
  const card=(v,i)=>{const src=phSrc('venue',v.id)||phSrc('dest',v.dest),col=AL_KIND[alKindIc(v.kind)];
    return `<button class="cg-card" style="--d:${i*40}ms" data-act="al-open" data-v="act|${esc(v.name)}" aria-label="${esc(v.name)}">
     <span class="cg-ph${src?'':' nophoto'}" style="${cgBg(src,col)}"><span class="cg-kind" style="--tc:${col}">${ic(alKindIc(v.kind))}</span>${v.comm>0?`<span class="cg-chip">${L('שובר','Voucher')} · ${v.comm}%</span>`:''}</span>
     <span class="cg-b"><b><bdi>${esc(v.name)}</bdi></b><span class="cg-sub">${esc(alCityName(v.city))}${alNorm(dn(v.dest))===alNorm(alCityName(v.city))?'':' · '+dn(v.dest)}</span>
      <span class="cg-foot"><span><b>${usd(v.cost)}</b> <small>${L('לאדם','per person')}</small></span><small class="muted">${alCode(v.id)}</small></span></span></button>`;};
  return cgGrid(page.map(card),L('אין תוצאות בסינון הזה.','No results match these filters.'))+pg.html;
}
function alActStats(){
  const vs=CATALOG.venues,ds=new Set(vs.map(v=>v.dest)),vo=vs.filter(v=>v.comm>0),gr=vs.filter(v=>v.cost>0);
  const avg=vs.length?r2(vs.reduce((a,v)=>a+v.cost,0)/vs.length):0,comm=vo.length?Math.round(vo.reduce((a,v)=>a+v.comm,0)/vo.length):0;
  return {n:vs.length,dests:ds.size,vo:vo.length,gr:gr.length,avg,comm};
}
function vActivitiesList(){
  const dests=[...new Set(CATALOG.venues.map(v=>v.dest))].filter(k=>DESTS[k]).sort((a,b)=>dn(a).localeCompare(dn(b)));
  const d=S.actDest||'All',z=alActStats();
  const band=hcPage({eyebrow:L('קטלוג','Catalog'),title:L('פעילויות','Activities'),aria:L('פעילויות','Activities'),
    brief:L(`${hlKey(z.n+' אטרקציות')} ב-${z.dests} יעדים. ${hlPos(z.vo+' משלמות עמלת שובר')}, בממוצע ${hlKey(z.comm+'%')}, והמחיר הממוצע לאדם הוא ${hlKey(usd(z.avg))}.`,
      `${hlKey(z.n+' attractions')} across ${z.dests} destinations. ${hlPos(z.vo+' pay a voucher commission')}, averaging ${hlKey(z.comm+'%')}, and the average price is ${hlKey(usd(z.avg))} per person.`),
    ctas:[hcCta('mint','ticket',L('פעילות חדשה','New activity'),'data-act="al-new" data-v="act"')],
    kpis:[{lab:L('פעילויות','Activities'),val:z.n,sub:L(`${z.dests} יעדים`,`${z.dests} destinations`),act:'al-kpi',v:'act|all'},
      {lab:L('שוברים','Vouchers'),val:z.vo,cls:'pf',sub:L('משלמות עמלה לסוכנות','pay the agency a commission'),act:'al-kpi',v:'act|voucher'},
      {lab:L('מחיר קבוצות','Group rate'),val:z.gr,sub:L('עם מחיר קבוצות','with a group price'),act:'al-kpi',v:'act|group'},
      {lab:L('מחיר ממוצע','Average price'),val:usd(z.avg),sub:L('לאדם','per person')}]});
  return band+`<div class="card hc-card al-card"><div class="al-filters"><select class="al-sel" data-al-dest="act" aria-label="${L('בחירת מיקומים','Select Locations')}"><option value="All">${L('בחירת מיקומים','Select Locations')}</option>${dests.map(k=>`<option value="${k}" ${d===k?'selected':''}>${dn(k)}</option>`).join('')}</select>
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
  const card=(h,i)=>{const b=alBrand(h.family),src=phSrc('hotel',h.id)||phSrc('dest',h.dest);
    return `<button class="cg-card" style="--d:${i*40}ms" data-act="al-open" data-v="htl|${esc(h.name)}" aria-label="${esc(h.name)}">
     <span class="cg-ph${src?'':' nophoto'}" style="${cgBg(src,b.color)}">${src?'':`<span class="cg-big">${esc(String(b.label).charAt(0))}</span>`}<span class="cg-chip">${alStars(h.stars)}</span></span>
     <span class="cg-b"><b><bdi>${esc(h.name)}</bdi></b><span class="cg-sub">${esc(alCityName(h.city))}${alNorm(dn(h.dest))===alNorm(alCityName(h.city))?'':' · '+dn(h.dest)}</span>
      <span class="cg-brand">${typeof brandBadge==='function'?brandBadge(h.family):esc(b.label)}</span>
      <span class="cg-foot"><span><b>${usd(h.rate)}</b> <small>${L('ללילה, קבוצה','per night, group')}</small></span><small class="muted">${alFiles(h.name)}</small></span></span></button>`;};
  return cgGrid(page.map(card),L('אין תוצאות בסינון הזה.','No results match these filters.'))+pg.html;
}
function vHotelsList(){
  const f=S.htlFam||'All',d=S.htlDest||'All';
  const fams=Object.keys(BRANDS).filter(k=>CATALOG.hotels.some(h=>h.family===k));
  const dests=[...new Set(CATALOG.hotels.map(h=>h.dest))].filter(k=>DESTS[k]).sort((a,b)=>dn(a).localeCompare(dn(b)));
  const blocks=vHotels().replace(/^[\s\S]*?<div class="card scroll">/,'<div class="card scroll">');
  const hs=CATALOG.hotels,nd=new Set(hs.map(h=>h.dest)).size,rate=hs.length?Math.round(hs.reduce((a,h)=>a+h.rate,0)/hs.length):0;
  const br=typeof opBlockRows==='function'?opBlockRows():[],open=br.reduce((a,r)=>a+r.b.open,0),exp=r2(br.reduce((a,r)=>a+(r.b.exposure||0),0));
  const first=br.find(r=>r.b.open>0);
  const band=hcPage({eyebrow:L('קטלוג','Catalog'),title:L('מלונות','Hotels'),aria:L('מלונות','Hotels'),
    brief:br.length?L(`${hlKey(hs.length+' מלונות')} ב-${nd} יעדים. ${open?`${hlWarn(open+' חדרים')} עדיין פתוחים בבלוקים של ${br.length} טיולים${first?`, והשחרור הקרוב ב-${hlWarn(fmtDate(first.b.cutoff))}`:''}.`:'כל החדרים בבלוקים נוצלו.'}`,
        `${hlKey(hs.length+' hotels')} in ${nd} destinations. ${open?`${hlWarn(open+' '+PLN(open,'room','rooms'))} still open in the blocks of ${br.length} ${PLN(br.length,'trip','trips')}${first?`, and the next release date is ${hlWarn(fmtDate(first.b.cutoff))}`:''}.`:'Every room in the blocks has been picked up.'}`)
      :L(`${hlKey(hs.length+' מלונות')} ב-${nd} יעדים, תעריף קבוצה ממוצע ${hlKey(usd(rate))} ללילה.`,`${hlKey(hs.length+' hotels')} in ${nd} destinations, with an average group rate of ${hlKey(usd(rate))} per night.`),
    ctas:[hcCta('mint','hotel',L('מלון חדש','New hotel'),'data-act="al-new" data-v="htl"')],
    kpis:[{lab:L('מלונות','Hotels'),val:hs.length,sub:L(`${nd} יעדים`,`${nd} destinations`),act:'al-kpi',v:'htl|all'},
      {lab:L('רשתות','Brands'),val:fams.length,sub:L('בקטלוג','in the catalog')},
      ...(br.length?[{lab:L('חדרים פתוחים בבלוקים','Open block rooms'),val:open,cls:open?'warn':'',sub:L(`${br.length} טיולים`,`${br.length} ${PLN(br.length,'trip','trips')}`),act:'al-kpi',v:'htl|blocks'},
        {lab:L('שווי אחרי השחרור','Value after release'),val:exp>0?usd(exp):'–',sub:L('חדרים שלא ינוצלו','rooms not picked up'),act:'al-kpi',v:'htl|blocks'}]:[{lab:L('תעריף ממוצע','Average rate'),val:usd(rate),sub:L('ללילה','per night')}])]});
  return band+(typeof opBlocksCard==='function'?opBlocksCard():'')+
  `<div class="card hc-card al-card"><div class="al-filters"><div class="chips al-chips"><button class="chip ${f==='All'?'on':''}" data-act="al-fam" data-v="All">${L('כל הרשתות','All brands')}</button>${fams.map(x=>`<button class="chip ${f===x?'on':''}" data-act="al-fam" data-v="${esc(x)}">${esc(BRANDS[x].label)}</button>`).join('')}</div>
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
  /* v8.2: the agency's clients without a trip yet (prospects) are listed too */
  (typeof CLIENTS!=='undefined'?CLIENTS:[]).forEach(c=>{if(!m[c.name])m[c.name]={name:c.name,type:c.type,n:0,rev:0,last:null};m[c.name].lead=!!(c.lead&&c.lead.open);m[c.name].prospect=c.type==='Prospect';});
  return Object.values(m).sort((a,b)=>a.name.localeCompare(b.name));
}
function alCliStats(){
  const cs=typeof CLIENTS!=='undefined'?CLIENTS:[],withTrips=cs.filter(c=>TRIPS.some(t=>t.client===c.name)).length;
  return {n:cs.length,trips:withTrips,pros:cs.filter(c=>c.type==='Prospect').length,leads:cs.filter(c=>c.lead&&c.lead.open).length};
}
const alCliPass=(c,f)=>f==='trips'?c.n>0:f==='prospects'?!!c.prospect:f==='leads'?!!c.lead:true;
function alCliBody(){
  const q=alNorm(S.cliQ),f=S.cliF||'all',all=alClients().filter(c=>(!q||alNorm(c.name).includes(q))&&alCliPass(c,f));
  const pg=alPager('cli',all.length),page=all.slice(pg.p*pg.rpp,(pg.p+1)*pg.rpp);
  return `<div class="scroll"><table class="tbl al-tbl"><thead><tr>${alTh(L('לקוח','Client')+' '+ic('up'))}${alTh(L('סוג','Type'))}${alTh(L('פרויקטים','Projects'),'n')}${alTh(L('הכנסה סגורה','Booked revenue'),'n')}${alTh(L('טיול אחרון','Last trip'))}${alTh(L('סוכן/ת אחראי/ת','Owner agent'))}<th class="al-ctl"></th></tr></thead><tbody>${
    page.map(c=>{const ty=CTYPE[c.type]||[c.type,c.type,''];return `<tr><td><span class="al-nm"><span class="al-thumb al-av">${esc(c.name.charAt(0))}</span><span class="al-t"><strong><bdi>${esc(c.name)}</bdi></strong>${c.lead?`<small>${hlPos(L('פנייה פתוחה','Open lead'))}</small>`:''}</span></span></td><td>${pillF(L(ty[0],ty[1]),ty[2])}</td><td class="n">${c.n}</td><td class="n">${c.rev?usd(c.rev):'–'}</td><td>${c.last?fmtDate(c.last.dep):'–'}</td><td>${c.last?agn(c.last.agent):'–'}</td><td class="al-ctl">${alMore('cli',c.name)}</td></tr>`;}).join('')||alEmpty(7)}</tbody></table></div>${pg.html}`;
}
function vClients(){
  const z=alCliStats(),f=S.cliF||'all';
  const band=hcPage({eyebrow:L('מכירות','Sales'),title:L('לקוחות','Clients'),aria:L('לקוחות','Clients'),
    brief:L(`${hlKey(z.n+' לקוחות')}: ${z.trips} עם טיולים העונה, ${z.pros} לקוחות פוטנציאליים ו-${hlPos(z.leads+' פניות פתוחות')} שמחכות להצעה.`,
      `${hlKey(z.n+' clients')}: ${z.trips} with trips this season, ${z.pros} ${PLN(z.pros,'prospect','prospects')} and ${hlPos(z.leads+' open '+PLN(z.leads,'lead','leads'))} waiting for a quote.`),
    ctas:[hcCta('mint','userplus',L('לקוח חדש','New client'),'data-act="al-new" data-v="cli"')],
    kpis:[{lab:L('לקוחות','Clients'),val:z.n,sub:L('בסוכנות','in the agency'),act:'al-kpi',v:'cli|all'},
      {lab:L('עם טיולים','With trips'),val:z.trips,cls:'pf',sub:L('העונה','this season'),act:'al-kpi',v:'cli|trips'},
      {lab:L('לקוחות פוטנציאליים','Prospects'),val:z.pros,sub:L('עוד בלי טיול','no trip yet'),act:'al-kpi',v:'cli|prospects'},
      {lab:L('פניות פתוחות','Open leads'),val:z.leads,sub:L('ממתינות להצעה','waiting for a quote'),act:'al-kpi',v:'cli|leads'}]});
  const chip=(k,lab)=>`<button class="chip ${f===k?'on':''}" data-act="al-kpi" data-v="cli|${k}">${lab}</button>`;
  return band+`<div class="card hc-card al-card"><div class="al-filters"><div class="chips al-chips">${chip('all',L('כולם','All'))}${chip('trips',L('עם טיולים','With trips'))}${chip('prospects',L('פוטנציאליים','Prospects'))}${chip('leads',L('פניות פתוחות','Open leads'))}</div>${alSearch('cli',S.cliQ)}</div><div id="al-body-cli">${alCliBody()}</div></div>`;
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
  else if(a==='al-kpi'){const [ns,k]=String(v).split('|');
    if(ns==='act'){S.actDest='All';S.actVoucher=k==='voucher';S.actGroup=k==='group';S.actQ='';S.actPage=0;alRefresh(ns);}
    else if(ns==='htl'){if(k==='blocks'){const el=document.querySelector('.op-blocks');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}else{S.htlFam='All';S.htlDest='All';S.htlQ='';S.htlPage=0;alRefresh(ns);}}
    else if(ns==='cli'){S.cliF=k;S.cliQ='';S.cliPage=0;alRefresh(ns);}}
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
