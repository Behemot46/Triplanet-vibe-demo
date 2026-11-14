/* ---------- v8.1 global search (module code gs) ----------
   The header search icon opens a popover: input + results grouped Projects, Clients, Suppliers, Hotels, Pages.
   gsSearch(q) is pure and returns [{k,title:[he,en],items:[{type,key,label,meta,tags}]}] (max 5 per group).
   S.gs={q,sel} is transient (not in KEEP). Keys: Ctrl/Cmd+Shift+F opens; Up/Down, Enter, Esc inside.
   Ctrl/Cmd+K and "/" belong to Maya (s9d_maya.js) and are not used here. */
Object.assign(S,{gs:null});
const GS_MAX=5;
/* lower case, accents folded; length preserving so highlight offsets match the original text */
const gsN=s=>String(s==null?'':s).split('').map(c=>{const p=c.normalize('NFD')[0]||c;return p.toLowerCase();}).join('');
const gsToks=q=>gsN(q).trim().split(/\s+/).filter(Boolean);
const gsHit=(hay,toks)=>toks.every(t=>hay.includes(t));
/* rank: 0 prefix of the label, 1 word start, 2 inside the label, 3 other field only */
function gsRank(label,toks){const n=gsN(label);
  if(toks.every(t=>n.startsWith(t)||n.includes(' '+t)||n.includes('#'+t)))return n.startsWith(toks[0])?0:1;
  return toks.every(t=>n.includes(t))?2:3;}
function gsPages(){
  const out=[],seen=new Set();
  const add=(key,lab)=>{if(seen.has(key))return;seen.add(key);out.push({type:'page',key,label:L(lab[0],lab[1]),tags:lab[0]+' '+lab[1],act:key});};
  const ok=n=>typeof can!=='function'||typeof NAV_PERM==='undefined'||!NAV_PERM[n[0]]||can(NAV_PERM[n[0]]);
  [...(typeof NAV!=='undefined'?NAV:[]),...(typeof NAV2!=='undefined'?NAV2:[])].filter(ok).forEach(n=>add(n[0],n[1]));
  if(typeof VIEWS!=='undefined'&&typeof VIEWS.forms==='function')add('forms',['בונה הטפסים','Form builder']);
  if(typeof ST_TABS!=='undefined'&&typeof VIEWS!=='undefined'&&typeof VIEWS.settings==='function')
    ST_TABS.forEach(t=>add('settings:'+t[0],['הגדרות: '+t[1][0],'Settings: '+t[1][1]]));
  return out;
}
const gsHe=()=>S.lang==='he';
const gsCity=c=>!c?'':gsHe()&&typeof tdCity==='function'?tdCity(c):c;
const gsCat=c=>!c?'':gsHe()&&typeof TH!=='undefined'&&TH[c]?TH[c]:c;
const gsCType=c=>!c?'':gsHe()&&typeof CTH!=='undefined'&&CTH[c]?CTH[c]:c;
const gsDestTxt=k=>typeof DESTS!=='undefined'&&DESTS[k]?DESTS[k].he+' '+DESTS[k].en:k;
const gsTripItem=t=>({type:'trip',key:t.id,label:t.name,meta:'#'+t.no+' · '+t.client+' · '+(typeof dn==='function'?dn(t.dest):t.dest),tags:t.name+' '+t.client+' #'+t.no+' '+gsDestTxt(t.dest)});
function gsSearch(q){
  const toks=gsToks(q),G=[];
  const trips=typeof visibleTrips==='function'?visibleTrips():[];
  if(!toks.length){
    const T0=typeof TODAY!=='undefined'?TODAY:new Date(),up=trips.filter(t=>D(t.dep)>=T0).sort((a,b)=>D(a.dep)-D(b.dep)),past=trips.filter(t=>D(t.dep)<T0).sort((a,b)=>D(b.dep)-D(a.dep));
    G.push({k:'recent',title:['פרויקטים אחרונים','Recent projects'],items:[...up,...past].slice(0,GS_MAX).map(gsTripItem)});
    G.push({k:'pages',title:['קפיצה אל','Jump to'],items:gsPages().slice(0,6)});
    return G.filter(g=>g.items.length);
  }
  const pick=(k,title,rows)=>{
    const m=rows.filter(r=>gsHit(gsN(r.tags),toks)).map((r,i)=>({r,i,s:gsRank(r.label,toks)}));
    m.sort((a,b)=>a.s-b.s||a.i-b.i);
    if(m.length)G.push({k,title,items:m.slice(0,GS_MAX).map(x=>x.r)});};
  pick('trips',['פרויקטים','Projects'],trips.map(gsTripItem));
  pick('clients',['לקוחות','Clients'],(typeof CLIENTS!=='undefined'?CLIENTS:[]).map(c=>({type:'client',key:c.name,label:c.name,meta:[gsCType(c.type),gsCity(c.city)].filter(Boolean).join(' · '),tags:c.name+' '+(c.city||'')+' '+gsCity(c.city)+' '+(c.contact&&c.contact.name||'')})));
  pick('sups',['ספקים','Suppliers'],(typeof SUPPLIERS!=='undefined'?SUPPLIERS:[]).filter(s=>!(s.real&&s.cat==='Lodging')).map(s=>({type:'sup',key:s.id,label:s.name,meta:[gsCat(s.cat),gsCity(s.city)].filter(Boolean).join(' · '),tags:s.name+' '+(s.city||'')+' '+gsCity(s.city)+' '+(s.cat||'')+' '+gsCat(s.cat)})));
  pick('hotels',['מלונות','Hotels'],(typeof CATALOG!=='undefined'&&CATALOG.hotels||[]).map(h=>({type:'hotel',key:h.name,label:h.name,meta:[h.city?gsCity(h.city.charAt(0).toUpperCase()+h.city.slice(1)):'',h.dest&&typeof DESTS!=='undefined'&&DESTS[h.dest]?L(DESTS[h.dest].he,DESTS[h.dest].en):h.dest].filter((x,i,a)=>x&&a.indexOf(x)===i).join(' · '),tags:h.name+' '+(h.city||'')+' '+gsDestTxt(h.dest)})));
  pick('pages',['עמודים','Pages'],gsPages());
  return G;
}
const gsFlat=G=>G.reduce((a,g)=>a.concat(g.items),[]);
function gsMark(text,toks){
  const s=String(text==null?'':text),n=gsN(s),on=new Array(s.length).fill(false);
  toks.forEach(t=>{let i=n.indexOf(t);while(i>=0){let k=i;while(k>0&&/[\p{L}\p{N}]/u.test(s[k-1]))k--;for(let j=k;j<i+t.length;j++)on[j]=true;i=n.indexOf(t,i+t.length);}});
  let out='',open=false;
  for(let i=0;i<s.length;i++){if(on[i]&&!open){out+='<mark>';open=true;}else if(!on[i]&&open){out+='</mark>';open=false;}out+=esc(s[i]);}
  return open?out+'</mark>':out;
}
const gsIco={trip:'quotes',client:'clients',sup:'suppliers',hotel:'hotel',page:'right'};
function gsResults(){
  const q=S.gs?S.gs.q:'',toks=gsToks(q),G=gsSearch(q),flat=gsFlat(G);
  if(S.gs&&S.gs.sel>=flat.length)S.gs.sel=Math.max(0,flat.length-1);
  if(!flat.length)return `<div class="gs-empty">${ic('search')}<div>${L('לא נמצאו תוצאות עבור','No results for')} <strong>${esc(q)}</strong></div><div class="small muted">${L('נסו שם לקוח, מספר פרויקט, עיר או יעד.','Try a client name, a project number, a city or a destination.')}</div></div>`;
  let n=0;
  return G.map(g=>`<div class="gs-g" role="group" aria-label="${esc(L(g.title[0],g.title[1]))}"><div class="gs-gh">${L(g.title[0],g.title[1])}</div>${g.items.map(it=>{const i=n++,on=S.gs&&S.gs.sel===i;
    return `<button type="button" class="gs-r${on?' on':''}" role="option" aria-selected="${on}" id="gs-r${i}" data-act="gs-pick" data-i="${i}"><span class="gs-ic">${ic(gsIco[it.type]||'right')}</span><span class="gs-t"><span class="gs-l">${gsMark(it.label,toks)}</span>${it.meta?`<span class="gs-m">${gsMark(it.meta,toks)}</span>`:''}</span></button>`;}).join('')}</div>`).join('');
}
function gsHtml(){
  const scope=typeof isAgent==='function'&&isAgent()&&!(typeof seesAll==='function'&&seesAll());
  return `<div class="gs-root" id="gs-root"><div class="gs-scrim" data-act="gs-close"></div><div class="gs-panel" role="dialog" aria-modal="true" aria-label="${L('חיפוש','Search')}">
   <div class="gs-bar">${ic('search')}<input id="gs-in" type="text" autocomplete="off" spellcheck="false" value="${esc(S.gs.q)}" placeholder="${L('חיפוש פרויקטים, לקוחות, ספקים ועוד','Search projects, clients, suppliers and more')}" aria-label="${L('חיפוש','Search')}" role="combobox" aria-expanded="true" aria-controls="gs-res"><button type="button" class="gs-x" data-act="gs-close" aria-label="${L('סגירה','Close')}">${ic('x')}</button></div>
   ${scope?`<div class="gs-note small muted">${L('מוצגים התיקים שלך בלבד','Showing your files only')}</div>`:''}
   <div class="gs-res" id="gs-res" role="listbox">${gsResults()}</div>
   <div class="gs-foot small muted"><span><kbd>&uarr;</kbd><kbd>&darr;</kbd> ${L('ניווט','move')}</span><span><kbd>Enter</kbd> ${L('פתיחה','open')}</span><span><kbd>Esc</kbd> ${L('סגירה','close')}</span></div></div></div>`;
}
/* ---- open / close / go ---- */
function gsOpen(){S.gs={q:'',sel:0};S.menu=false;render();setTimeout(()=>{const i=document.getElementById('gs-in');if(i)i.focus();},20);}
function gsClose(back){S.gs=null;render();
  if(back)setTimeout(()=>{const b=document.querySelector('.topbar .iconb[data-v="quotes"]');if(b&&b.focus)b.focus();},0);}
function gsGo(it){
  if(!it)return false;S.gs=null;S.menu=false;
  if(it.type==='trip'){openTrip(it.key,'general');}
  else if(it.type==='client'){if(typeof spCliOpen==='function'){spCliOpen(it.key);return true;}S.tab='clients';}
  else if(it.type==='sup'){if(typeof spOpen==='function'&&spOpen(it.key))return true;S.tab='suppliers';}
  else if(it.type==='hotel'){const s=typeof supByName==='function'?supByName(it.key):null;if(s&&typeof spOpen==='function'&&spOpen(s.id))return true;S.tab='hotels';}
  else if(it.type==='page'){const a=String(it.act||it.key);if(a.indexOf('settings:')===0){S.tab='settings';S.stSub=a.slice(9);}else S.tab=a;}
  render();window.scrollTo(0,0);return true;
}
function gsRedraw(scroll){const el=document.getElementById('gs-res');if(!el)return;el.innerHTML=heDataIf(trHtml(gsResults()));
  if(scroll){const r=document.getElementById('gs-r'+S.gs.sel);if(r&&r.scrollIntoView)r.scrollIntoView({block:'nearest'});}
  const i=document.getElementById('gs-in');if(i&&i.setAttribute)i.setAttribute('aria-activedescendant','gs-r'+S.gs.sel);}
function gsMove(d){const n=gsFlat(gsSearch(S.gs.q)).length;if(!n)return;S.gs.sel=(S.gs.sel+d+n)%n;gsRedraw(true);}
/* ---- render wrap: the popover is appended after the app (state driven) ---- */
{const r0=render;render=function(){r0();try{if(!S.gs)return;const app=document.getElementById('app');if(!app)return;const h=heDataIf(trHtml(gsHtml()));
  if(app.insertAdjacentHTML)app.insertAdjacentHTML('beforeend',h);else app.innerHTML+=h;}catch(e){if(typeof console!=='undefined')console.error(e);}};}
/* ---- events (capture phase: the icon's own go-to-Projects handler never sees the click) ---- */
document.addEventListener('click',e=>{
  const t=e.target,ic0=t&&t.closest&&t.closest('button.iconb[data-act="go"][data-v="quotes"]');
  if(ic0&&!S.gs){e.preventDefault();e.stopPropagation();gsOpen();return;}
  if(!S.gs)return;
  const b=t&&t.closest&&t.closest('[data-act^="gs-"]');if(!b)return;
  e.stopPropagation();
  if(b.dataset.act==='gs-close')gsClose(true);
  else if(b.dataset.act==='gs-pick')gsGo(gsFlat(gsSearch(S.gs.q))[+b.dataset.i]);
},true);
document.addEventListener('input',e=>{const el=e.target;if(!S.gs||!el||el.id!=='gs-in')return;S.gs.q=el.value;S.gs.sel=0;gsRedraw(false);});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.shiftKey&&String(e.key).toLowerCase()==='f'){e.preventDefault();if(!S.gs&&!(S.meet>=0)&&!document.getElementById('attract'))gsOpen();return;}
  if(!S.gs)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();gsClose(true);}
  else if(e.key==='ArrowDown'){e.preventDefault();gsMove(1);}
  else if(e.key==='ArrowUp'){e.preventDefault();gsMove(-1);}
  else if(e.key==='Enter'){e.preventDefault();gsGo(gsFlat(gsSearch(S.gs.q))[S.gs.sel]);}
},true);

/* ---------- tests ---------- */
TESTS.push({name:'global search',run:h=>{
  const out=[],{S}=h,lang0=S.lang,role0=S.role;
  S.role='manager';S.lang='en';
  const find=(q,type)=>gsFlat(gsSearch(q)).filter(x=>!type||x.type===type);
  const t0=TRIPS[0],t5=TRIPS[5];
  if(!find(t0.client,'trip').some(x=>x.key===t0.id))out.push('trip by client');
  if(!find('#'+t5.no,'trip').some(x=>x.key===t5.id))out.push('trip by #number');
  if(!find(String(t5.no),'trip').some(x=>x.key===t5.id))out.push('trip by bare number');
  const dk=Object.keys(DESTS).find(k=>TRIPS.some(t=>t.dest===k)),dt=TRIPS.find(t=>t.dest===dk);
  if(!find(DESTS[dk].he,'trip').some(x=>x.key===dt.id))out.push('trip by Hebrew destination');
  if(!find(DESTS[dk].en.toUpperCase(),'trip').some(x=>x.key===dt.id))out.push('trip by destination, upper case');
  const sup=SUPPLIERS.find(s=>s.city&&s.city.length>3&&!(s.real&&s.cat==='Lodging'));
  if(!gsSearch(sup.city).some(g=>g.k==='sups'&&g.items.length))out.push('supplier by city');
  if(!find(sup.name.slice(0,6),'sup').some(x=>x.key===sup.id))out.push('supplier by name prefix');
  const hot=CATALOG.hotels[0];if(!find(hot.name.slice(0,8),'hotel').some(x=>x.key===hot.name))out.push('hotel by name');
  if(gsN('Café')!=='cafe')out.push('accent fold');
  if(!gsSearch('home').some(g=>g.k==='pages'&&g.items.some(i=>i.key==='home')))out.push('page by EN label');
  if(!gsSearch('הגדרות').some(g=>g.k==='pages'&&g.items.length))out.push('page by HE label');
  if(typeof ST_TABS!=='undefined'&&!gsSearch('stages').some(g=>g.k==='pages'&&g.items.some(i=>i.key==='settings:stages')))out.push('settings sub-page');
  if(!gsSearch('form builder').some(g=>g.k==='pages'&&g.items.some(i=>i.key==='forms')))out.push('form builder page');
  gsSearch('a').forEach(g=>{if(g.items.length>GS_MAX)out.push('max per group '+g.k);});
  if(gsSearch('zzzqqqxx').length)out.push('nonsense query returned groups');
  /* ranking: a prefix match comes before an inner match */
  {const r=find('nash','trip');if(r.length>1){const rk=r.map(x=>gsRank(x.label,['nash']));if(rk.join()!==rk.slice().sort((a,b)=>a-b).join())out.push('rank order');}}
  /* empty query shape */
  {const g=gsSearch('');if(g.length!==2||g[0].k!=='recent'||g[1].k!=='pages')out.push('empty shape '+g.map(x=>x.k));
    else{if(g[0].items.length!==5)out.push('recent count '+g[0].items.length);const ds=g[0].items.map(i=>TRIPS.find(t=>t.id===i.key).dep);
      const up=ds.filter(d=>D(d)>=TODAY);if(up.join()!==up.slice().sort().join())out.push('recent not ordered');}}
  /* agent visibility */
  const ag=ROLE_KEYS.find(r=>r!=='manager'&&r!=='accountant');S.role=ag;
  {const vis=new Set(visibleTrips().map(t=>t.id)),other=TRIPS.find(t=>!vis.has(t.id));
    gsFlat(gsSearch('')).concat(gsFlat(gsSearch('a'))).filter(x=>x.type==='trip').forEach(x=>{if(!vis.has(x.key))out.push('agent sees foreign trip '+x.key);});
    if(other&&find('#'+other.no,'trip').some(x=>x.key===other.id))out.push('agent finds a foreign file');
    if(!vis.size)out.push('agent has no trips');}
  S.role='manager';
  /* popover HTML in both languages for manager, accountant and an agent */
  ['manager','accountant',ag].forEach(role=>{S.role=role;
    ['en','he'].forEach(lang=>{S.lang=lang;
      ['','nash','ל','zzzqq'].forEach(q=>{S.gs={q,sel:0};const html=gsHtml();h.chk(html,'gs '+role+' '+lang+' "'+q+'"');if(lang==='en')h.scan(html,'gs '+role+' "'+q+'"');
        if(!html.includes('id="gs-res"'))out.push('no results container');
        const note=html.includes(L('מוצגים התיקים שלך בלבד','Showing your files only'));
        if(role===ag&&!note)out.push('agent scope note missing');
        if(role!==ag&&note)out.push('scope note shown to '+role);});});});
  S.gs=null;
  /* highlight and escaping */
  {const m=gsMark('Nashville Music Tour',['nash']);if(m!=='<mark>Nash</mark>ville Music Tour')out.push('mark '+m);
    const w=gsMark('Nashville',['ash']);if(w!=='<mark>Nash</mark>ville')out.push('mark from word start '+w);
    const e=gsMark('<b>x</b>',['b']);if(e!=='&lt;<mark>b</mark>&gt;x&lt;/<mark>b</mark>&gt;')out.push('mark escapes '+e);}
  S.gs=null;S.role=role0;S.lang=lang0;return out;}});
