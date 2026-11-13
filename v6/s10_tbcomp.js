/* ---------- v8 module tbc: trip components with supplier alternatives, and quote versions ----------
   Registers TB_VIEWS.comp (the "By components" view of the trip plan, rendered by s10_tbday.js) and the Versions tab.
   Mutations are named functions (tbSwap, tbUndo, tbVerSave, tbVerRestore); handlers only call them. */
Object.assign(S,{tbAlt:0,tbVerA:0,tbVerB:0,tbNote:'',tbRestore:0});

const tbcCan=()=>typeof can!=='function'||can('price.edit');
/* swapping a supplier is its own permission (sup.swap); tbSwap and tbUndo refuse without it unless a seed passes force */
const tbcCanSwap=()=>typeof can!=='function'||can('sup.swap');
const tbcLines=t=>t.lines.filter(l=>!l.extra);
const tbcSg=n=>(n<0?'-':n>0?'+':'')+usd(Math.abs(n));
const tbcWho=by=>by==='manager'?MGR():(typeof STAFF_BY!=='undefined'&&STAFF_BY[by]&&by!=='manager'?L(STAFF_BY[by].he,STAFF_BY[by].en):agn(by));

/* ---------- supplier status list follows the line's supplier ---------- */
function tbcSupSync(t,l,old){
  const ss=t.sups||(t.sups=[]),used=n=>t.lines.some(x=>!x.extra&&x.sup===n),st=t.stage==='Operations'?'Sent':'Not sent';
  if(old&&old!==l.sup){
    const e=ss.find(x=>x.n===old);
    if(!used(old)){
      if(e){if(ss.some(x=>x!==e&&x.n===l.sup))ss.splice(ss.indexOf(e),1);else{e.n=l.sup;e.line=l.id;e.st=st;}}
    }else if(e&&!t.lines.some(x=>x.id===e.line&&x.sup===old)){const o=t.lines.find(x=>!x.extra&&x.sup===old);if(o)e.line=o.id;}
  }
  if(!ss.some(x=>x.n===l.sup))ss.push({n:l.sup,cat:l.type,line:l.id,st});
}
/* after a restore: one entry per supplier in use, none for suppliers no longer used */
function tbcSupRebuild(t){
  const ss=t.sups||(t.sups=[]),st=t.stage==='Operations'?'Sent':'Not sent',used=[];
  tbcLines(t).forEach(l=>{if(!used.includes(l.sup))used.push(l.sup);});
  for(let i=ss.length-1;i>=0;i--)if(!used.includes(ss[i].n))ss.splice(i,1);
  ss.forEach(e=>{if(!t.lines.some(x=>x.id===e.line&&x.sup===e.n)){const o=t.lines.find(x=>!x.extra&&x.sup===e.n);if(o)e.line=o.id;}});
  used.forEach(n=>{if(!ss.some(x=>x.n===n)){const o=t.lines.find(x=>!x.extra&&x.sup===n);ss.push({n,cat:o.type,line:o.id,st});}});
}
function tbcRoomSync(t,old,nw){if(t.room&&t.room.hotel===old)t.room.hotel=nw;}

/* ---------- swap and undo ---------- */
const tbcAltOf=(t,l,supId)=>altsFor(t,l).find(a=>a.sup.id===supId||a.sup.name===supId);
function tbcProfitDelta(t,l,a){
  const t2=Object.assign({},t,{lines:t.lines.map(x=>x===l?Object.assign({},x,{sup:a.sup.name,cost:a.cost,comm:a.comm}):x)});
  return r2(calc(t2).planProfit-calc(t).planProfit);
}
function tbUndo(t,lineId,force){
  const l=t.lines.find(x=>x.id===lineId);
  if(!l)return {ok:false,delta:0,reason:'line'};
  if(!force&&!tbcCanSwap())return {ok:false,delta:0,reason:'perm'};
  if(!l.alt0)return {ok:false,delta:0,reason:'nothing'};
  if(l.inv)return {ok:false,delta:0,reason:'invoiced'};
  const p0=calc(t).planProfit,old=l.sup,a=l.alt0;
  l.sup=a.sup;l.cost=a.cost;l.comm=a.comm;delete l.alt0;
  tbcSupSync(t,l,old);tbcRoomSync(t,old,l.sup);
  return {ok:true,delta:r2(calc(t).planProfit-p0),reason:''};
}
function tbSwap(t,lineId,supId,force){
  const l=t.lines.find(x=>x.id===lineId);
  if(!l)return {ok:false,delta:0,reason:'line'};
  if(!force&&!tbcCanSwap())return {ok:false,delta:0,reason:'perm'};
  if(l.inv)return {ok:false,delta:0,reason:'invoiced'};
  if(t.stage!=='Quote'&&t.stage!=='Operations')return {ok:false,delta:0,reason:'stage'};
  const a=tbcAltOf(t,l,supId);
  if(!a)return {ok:false,delta:0,reason:'unknown'};
  if(a.sup.name===l.sup)return {ok:false,delta:0,reason:'same'};
  if(l.alt0&&a.sup.name===l.alt0.sup)return tbUndo(t,lineId,true);   // swapping back restores the exact original
  const p0=calc(t).planProfit,old=l.sup;
  if(!l.alt0)l.alt0={sup:l.sup,cost:l.cost,comm:l.comm};
  l.sup=a.sup.name;l.cost=a.cost;l.comm=a.comm;
  tbcSupSync(t,l,old);tbcRoomSync(t,old,l.sup);
  return {ok:true,delta:r2(calc(t).planProfit-p0),reason:''};
}
function tbcMsg(r,l){
  if(!r.ok)return {invoiced:L('השורה כבר חויבה בחשבונית, אי אפשר להחליף ספק.','This line already has an invoice, so the supplier cannot be changed.'),stage:L('החלפת ספק אפשרית רק בשלב הצעה או תפעול.','Suppliers can be swapped only in Quotation or Operation.'),nothing:L('אין החלפה לבטל.','Nothing to undo.'),perm:L('התפקיד שלך לא כולל החלפת ספקים.','Your role cannot swap suppliers.')}[r.reason]||L('לא ניתן להחליף.','Could not swap.');
  const s=tbcSg(r.delta);
  return L(`הספק הוחלף: ${l?l.sup:''}. השפעה על הרווח המתוכנן ${s}`,`Supplier changed${l?' to '+l.sup:''}. Planned profit ${s}`);
}

/* ---------- helpers for display ---------- */
function tbcCancel(c){
  if(!c||!c.length)return '-';
  const free=c.filter(x=>x[1]===0).sort((a,b)=>b[0]-a[0])[0],rest=c.filter(x=>x[1]>0).sort((a,b)=>b[0]-a[0]);
  const parts=[];
  if(free)parts.push(L(`חינם ≥${free[0]} י׳`,`Free ≥${free[0]} d`));
  rest.forEach(x=>parts.push(`${x[1]}% ≥${x[0]} ${L('י׳','d')}`));
  return parts.map(x=>`<bdi class="tbc-cx">${x}</bdi>`).join(' · ');
}
const tbcPref=p=>pillF(({High:L('גבוהה','High'),Medium:L('בינונית','Medium'),Low:L('נמוכה','Low')})[p]||'-',p==='High'?'green':p==='Medium'?'blue':'amber');
function tbcSupCell(t,l,s){
  const sup=s||supByName(l.sup);
  return sup&&sup.real?`<span class="tbc-rb">${brandBadge(sup.family||sup.brand)}<strong><bdi>${esc(sup.name)}</bdi></strong></span>`:`<strong>${esc(s?s.name:l.sup)}</strong>`;
}
function tbcVariant(l){
  const s=supByName(l.sup),vs=(s&&s.variants)||[];if(!vs.length)return '-';
  const nm=String(l.name||'').toLowerCase(),v=vs.find(x=>nm.indexOf(String(x.en).toLowerCase().split(' ')[0])>=0)||vs[0];
  return esc(L(v.he,v.en));
}
const tbcScope=l=>l.scope==='shared'?L('משותף','Shared'):L('לנוסע','Per person');

/* ---------- By components view ---------- */
function tbcAltPanel(t,l){
  const alts=altsFor(t,l),canSwap=tbcCanSwap()&&t.stage==='Quote'&&!l.inv,ops=t.stage==='Operations';
  const hint=l.inv?L('לשורה יש חשבונית, הספק נעול. אפשר להשוות בלבד.','This line has an invoice, so the supplier is locked. Comparison only.')
    :t.stage==='Quote'?(tbcCanSwap()?L('החלפה משנה את עלות היחידה והעמלה בלבד, לא את המטבע או השער. אפשר לבטל.','A swap changes the unit cost and commission only, never the currency or rate. You can undo it.'):L('התפקיד שלך לא כולל החלפת ספקים.','Your role cannot swap suppliers.'))
    :ops?L('בתפעול בוחרים ספק מתוך מסך הספקים של התיק.','In Operation, the supplier is chosen from the trip Suppliers tab.')
    :L('תצוגה לקריאה בלבד בשלב הזה.','Read-only at this stage.');
  const rows=alts.map(a=>{
    const real=a.real,cur=a.inc,orig=!cur&&l.alt0&&l.alt0.sup===a.sup.name;
    const pi=cur?0:tbcProfitDelta(t,l,a);
    const act=cur?(l.alt0&&canSwap?`<button class="btn sm" data-act="tbc-undo" data-l="${l.id}">${ic('restart')} ${L('ביטול החלפה','Undo swap')}</button>`:''):
      canSwap?`<button class="btn sm pri" data-act="tbc-swap" data-l="${l.id}" data-s="${esc(a.sup.id)}">${orig?L('חזרה למקור','Swap back'):L('החלפה','Swap')}</button>`:'';
    return `<tr class="${cur?'tbc-cur':''}"><td>${tbcSupCell(t,l,a.sup)}${cur?' '+pillF(L('נוכחי','Current'),'info'):''}${orig?' '+pillF(L('מקורי','Original'),'info'):''}<div class="small muted">${esc(a.sup.city||'')}</div></td>
      <td class="n">${real||a.rating==null?'-':ic('star')+' '+a.rating.toFixed(1)}</td><td>${tbcPref(a.pref)}</td><td class="small tbc-cancel">${tbcCancel(a.cancel)}</td><td class="n">${a.comm||0}%</td>
      <td class="n">${money(a.cost,a.cur)}</td><td class="n ${a.delta<0?'tbc-dn':a.delta>0?'tbc-up':''}">${cur?'-':tbcSg(a.delta)}</td><td class="n ${pi>0?'tbc-dn':pi<0?'tbc-up':''}">${cur?'-':tbcSg(pi)}</td><td class="n">${act}</td></tr>`;}).join('');
  return `<div class="tbc-panel"><div class="row" style="justify-content:space-between"><strong>${L('ספקים חלופיים','Alternative suppliers')}: ${esc(l.name)}</strong><button class="btn sm" data-act="tbc-alt" data-v="${l.id}" aria-label="${L('סגירה','Close')}">${ic('x')}</button></div>
    <p class="small muted" style="margin:6px 0 8px">${hint}</p>
    ${alts.length<2?`<p class="small muted">${L('לשורה הזו אין חלופות במערכת. כל אטרקציה היא ספק בפני עצמה.','No alternatives for this line. Each attraction is its own operator.')}</p>`:''}
    <div class="scroll"><table class="tbl"><thead><tr><th>${L('ספק','Supplier')}</th><th class="n">${L('דירוג','Rating')}</th><th>${L('העדפה','Preference')}</th><th>${L('ביטולים','Cancellation')}</th><th class="n">${L('עמלה','Comm.')}</th><th class="n">${L('עלות יחידה','Unit cost')}</th><th class="n">${L('הפרש עלות $','Cost vs current $')}</th><th class="n">${L('השפעה על רווח $','Profit impact $')}</th><th></th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function tbcComp(t){
  const c=calc(t),by={};c.lines.forEach(x=>{if(!x.l.extra)(by[x.l.type]||(by[x.l.type]=[])).push(x);});
  const swapped=tbcLines(t).filter(l=>l.alt0).length,ops=t.stage!=='Quote';
  const tables=TYPES.filter(ty=>by[ty]).map(ty=>{
    const ls=by[ty],tot=ls.reduce((a,x)=>a+x.planUSD,0);
    const body=ls.map(x=>{const l=x.l,open=S.tbAlt===l.id,n=altsFor(t,l).length-1;
      return `<tr class="${open?'tbc-open':''}"><td>${esc(l.name)}</td><td>${tbcSupCell(t,l)}${l.alt0?`<div class="small muted">${L('הוחלף מ','Changed from')} ${esc(l.alt0.sup)}</div>`:''}</td><td class="small">${tbcVariant(l)}</td><td class="n">${l.qty} <span class="small muted">${esc(l.unit)}</span></td><td class="n">${money(l.cost,l.cur)}</td><td class="n"><strong>${usd(x.planUSD)}</strong></td><td class="small">${tbcScope(l)}</td>
        <td class="n"><button class="btn sm ${open?'pri':''}" data-act="tbc-alt" data-v="${l.id}" ${n<1&&!l.alt0?'disabled':''} aria-expanded="${open}">${ic('refresh')} ${ops||l.inv?L('השוואה','Compare'):L('חלופות','Alternatives')}${n>0?` (${n})`:''}</button></td></tr>`;}).join('');
    const ol=ls.find(x=>x.l.id===S.tbAlt);
    return `<div class="card sec tbc-card"><h3><span class="type"><i style="background:${TCOL[ty]}">${TICO[ty]}</i>${tn(ty)}</span></h3><div class="scroll"><table class="tbl tbc-tbl"><thead><tr><th>${L('שורה','Line')}</th><th>${L('ספק','Supplier')}</th><th>${L('וריאנט','Variant')}</th><th class="n">${L('כמות','Qty')}</th><th class="n">${L('עלות יחידה','Unit cost')}</th><th class="n">${L('סה"כ $','Total $')}</th><th>${L('היקף','Scope')}</th><th></th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="5">${L('סה"כ','Total')} ${tn(ty)}</td><td class="n">${usd(tot)}</td><td colspan="2"></td></tr></tfoot></table></div>${ol?tbcAltPanel(t,ol.l):''}</div>`;}).join('');
  return `<div class="tbc-sum"><div><span class="small muted">${L('עלות מתוכננת','Planned cost')}</span><strong>${usd(c.plan)}</strong></div><div><span class="small muted">${L('רווח מתוכנן','Planned profit')}</span><strong>${usd(c.planProfit)}</strong></div><div><span class="small muted">${L('עמלות ספקים','Supplier commission')}</span><strong>${usd(c.comm)}</strong></div><div><span class="small muted">${L('שורות עם ספק שהוחלף','Lines with a changed supplier')}</span><strong>${swapped}</strong></div></div>
  <p class="small muted">${L('בחרו שורה כדי להשוות ספקים. המחירים בטבלה הם עלות ספק, המחיר ללקוח נגזר מהמרקאפ.','Pick a line to compare suppliers. Prices here are supplier cost; the client price follows the markup.')}</p>${tables}`;
}
TB_VIEWS.comp={he:'לפי רכיבים',en:'By components',icon:'checklist',order:2,render:t=>tbcComp(t)};

/* ---------- versions ---------- */
function tbVerSnap(t,v,at,by,note,noteHe){
  const c=calc(t);
  return {v,at,by,note:note||'',noteHe:noteHe||'',
    lines:t.lines.map(l=>({id:l.id,sup:l.sup,qty:l.qty,cost:l.cost,cur:l.cur,comm:l.comm,ov:l.ov==null?'':l.ov})),
    markups:JSON.parse(JSON.stringify(t.markups||{})),disc:JSON.parse(JSON.stringify(t.disc||{})),
    ovh:t.ovh?JSON.parse(JSON.stringify(t.ovh)):null,brk:t.brk?JSON.parse(JSON.stringify(t.brk)):null,
    totals:{rev:c.rev,plan:c.plan,planProfit:c.planProfit,comm:c.comm}};
}
const tbcVers=t=>t.versions||[];
const tbcVerOf=(t,v)=>typeof v==='object'&&v?v:v==='cur'||v===0||v==null?tbVerSnap(t,0,iso(TODAY),S.role,''):tbcVers(t).find(x=>x.v===+v);
function tbVerSave(t,note){
  if(t.stage!=='Quote')return null;
  const vs=t.versions||(t.versions=[]),n=vs.reduce((a,x)=>Math.max(a,x.v),0)+1;
  const x=tbVerSnap(t,n,iso(TODAY),S.role,String(note||'').trim()||('Version '+n),String(note||'').trim()||('גרסה '+n));
  vs.push(x);return x;
}
function tbVerRestore(t,v){
  if(t.stage!=='Quote')return {ok:false,reason:'stage'};
  const s=tbcVerOf(t,v);if(!s)return {ok:false,reason:'missing'};
  s.lines.forEach(x=>{const l=t.lines.find(y=>y.id===x.id);if(!l)return;l.sup=x.sup;l.qty=x.qty;l.cost=x.cost;l.cur=x.cur;l.comm=x.comm;l.ov=x.ov;delete l.alt0;});
  t.markups=JSON.parse(JSON.stringify(s.markups));t.disc=JSON.parse(JSON.stringify(s.disc));
  if(s.ovh)t.ovh=JSON.parse(JSON.stringify(s.ovh));else delete t.ovh;
  if(s.brk)t.brk=JSON.parse(JSON.stringify(s.brk));else delete t.brk;
  tbcSupRebuild(t);
  const lod=t.lines[0];if(t.room&&lod&&lod.type==='Lodging')t.room.hotel=lod.sup;
  return {ok:true,reason:''};
}
function tbVerDiff(t,a,b){
  const A=tbcVerOf(t,a),B=tbcVerOf(t,b),out={a:A,b:B,lines:[],other:[],totals:{},empty:true};
  if(!A||!B)return out;
  const lr=x=>x.cur==='USD'?1:t.rate,tot=x=>x?r2(x.qty*x.cost*lr(x)):0;
  const ids=[];A.lines.concat(B.lines).forEach(x=>{if(!ids.includes(x.id))ids.push(x.id);});
  ids.forEach(id=>{
    const x=A.lines.find(y=>y.id===id),y=B.lines.find(z=>z.id===id),l=t.lines.find(z=>z.id===id)||{};
    const keys=['sup','qty','cost','cur','comm','ov'];
    if(x&&y&&keys.every(k=>String(x[k])===String(y[k])))return;
    out.lines.push({id,name:l.name||'#'+id,type:l.type,a:x||null,b:y||null,ta:tot(x),tb:tot(y),d:r2(tot(y)-tot(x))});
  });
  Object.keys(Object.assign({},A.markups,B.markups)).forEach(k=>{if(String((A.markups||{})[k])!==String((B.markups||{})[k]))out.other.push({k:'mk',t:k,a:(A.markups||{})[k],b:(B.markups||{})[k]});});
  Object.keys(Object.assign({},A.disc,B.disc)).forEach(k=>{if(JSON.stringify((A.disc||{})[k]||null)!==JSON.stringify((B.disc||{})[k]||null))out.other.push({k:'disc',t:k,a:(A.disc||{})[k],b:(B.disc||{})[k]});});
  ['ovh','brk'].forEach(k=>{if(JSON.stringify(A[k]||null)!==JSON.stringify(B[k]||null))out.other.push({k,t:k,a:A[k],b:B[k]});});
  ['rev','plan','planProfit','comm'].forEach(k=>{out.totals[k]={a:A.totals[k],b:B.totals[k],d:r2(B.totals[k]-A.totals[k])};});
  out.empty=!out.lines.length&&!out.other.length&&Object.keys(out.totals).every(k=>Math.abs(out.totals[k].d)<.005);
  return out;
}
function tbcNote(x){return S.lang==='he'&&x.noteHe?x.noteHe:x.note;}
function tbcLineCell(t,x){
  if(!x)return `<span class="muted">${L('לא קיימת','not present')}</span>`;
  const s=supByName(x.sup);
  return `${s&&s.real?`<span class="tbc-rb">${brandBadge(s.family||s.brand)}<strong><bdi>${esc(s.name)}</bdi></strong></span>`:`<strong>${esc(x.sup)}</strong>`}<div class="small muted">${x.qty} x ${money(x.cost,x.cur)} · ${L('עמלה','comm.')} ${x.comm}%${x.ov!==''?' · '+L('מרקאפ','markup')+' '+x.ov+'%':''}</div>`;
}
function tbcOtherLabel(o){
  const f=v=>v==null||v===''?'-':typeof v==='object'?(v.m==='$'?usd(+v.v):(+v.v)+'%')+(v.on?' ('+v.on+')':''):v+'%';
  if(o.k==='mk')return `${L('מרקאפ','Markup')} ${tn(o.t)}: ${f(o.a)} → ${f(o.b)}`;
  if(o.k==='disc')return `${L('הנחה','Discount')} ${esc(o.t.split('|')[0]==='s'?L('משותף','shared'):L('לנוסע','per person'))} ${tn(o.t.split('|')[1])}: ${f(o.a)} → ${f(o.b)}`;
  return `${o.k==='ovh'?L('תקורה','Overhead'):L('עמלת תיווך','Brokerage fee')}: ${f(o.a)} → ${f(o.b)}`;
}
function tbcVerTab(t){
  const vs=tbcVers(t),isQ=t.stage==='Quote',ok=isQ&&tbcCan(),live=tbVerSnap(t,0,iso(TODAY),S.role,'');
  const has=v=>v==='cur'||vs.some(x=>x.v===+v);
  let A=has(S.tbVerA)&&S.tbVerA?S.tbVerA:(vs.length>1?vs[vs.length-2].v:vs.length?vs[0].v:'cur'),B=has(S.tbVerB)&&S.tbVerB?S.tbVerB:(vs.length?vs[vs.length-1].v:'cur');
  if(A===B&&vs.length>1)A=vs[0].v===B?vs[1].v:vs[0].v;
  const d=tbVerDiff(t,A,B);
  const opts=sel=>vs.map(x=>`<option value="${x.v}" ${String(sel)===String(x.v)?'selected':''}>v${x.v} - ${esc(tbcNote(x))}</option>`).join('')+`<option value="cur" ${sel==='cur'?'selected':''}>${L('נוכחית (לא נשמרה)','Current (unsaved)')}</option>`;
  const list=vs.map(x=>{
    const same=tbVerDiff(t,x,live).empty,pend=S.tbRestore===x.v;
    return `<tr><td><strong>v${x.v}</strong></td><td>${esc(tbcNote(x))} ${same?pillF(L('זהה לנוכחית','Matches current'),'green'):''}</td><td class="small">${fmtDate(x.at)}</td><td class="small">${esc(tbcWho(x.by))}</td><td class="n">${usd(x.totals.rev)}</td><td class="n">${usd(x.totals.plan)}</td><td class="n">${usd(x.totals.planProfit)}</td><td class="n">${pct(x.totals.planProfit/(x.totals.rev||1))}</td>
      <td class="n">${ok&&!same?`<button class="btn sm ${pend?'pri':''}" data-act="tbc-vrestore" data-v="${x.v}">${pend?L('לחצו שוב לשחזור','Click again to restore'):L('שחזור','Restore')}</button>`:''}</td></tr>`;}).join('');
  const dl=d.lines.map(x=>`<tr><td>${esc(x.name)}<div class="small muted">${tn(x.type)}</div></td><td>${tbcLineCell(t,x.a)}</td><td>${tbcLineCell(t,x.b)}</td><td class="n">${usd(x.ta)}</td><td class="n">${usd(x.tb)}</td><td class="n ${x.d<0?'tbc-dn':x.d>0?'tbc-up':''}">${tbcSg(x.d)}</td></tr>`).join('');
  const tl=[['rev',L('הכנסה','Revenue')],['plan',L('עלות מתוכננת','Planned cost')],['planProfit',L('רווח מתוכנן','Planned profit')],['comm',L('עמלות ספקים','Supplier commission')]].map(([k,lab])=>`<tr><td>${lab}</td><td class="n">${usd(d.totals[k].a)}</td><td class="n">${usd(d.totals[k].b)}</td><td class="n ${d.totals[k].d<0&&k!=='plan'?'tbc-up':d.totals[k].d>0&&k!=='plan'?'tbc-dn':d.totals[k].d<0?'tbc-dn':d.totals[k].d>0?'tbc-up':''}">${tbcSg(d.totals[k].d)}</td></tr>`).join('');
  return master(t,'')+`
  ${isQ?'':`<div class="banner">${ic('lock')} ${L('התיק כבר עבר שלב הצעה. הגרסאות מוצגות לקריאה בלבד.','This file is past the quotation stage. Versions are shown read-only.')}</div>`}
  <div class="card sec"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:10px"><h3 style="margin:0">${ic('document')} ${L('גרסאות הצעה','Quote versions')}</h3>
    ${ok?`<div class="row tbc-save"><input id="tbc-note" data-in="tbc-note" type="text" maxlength="60" placeholder="${L('הערה לגרסה (לא חובה)','Version note (optional)')}" value="${esc(S.tbNote||'')}" aria-label="${L('הערה לגרסה','Version note')}"><button class="btn pri" data-act="tbc-vsave">${ic('check')} ${L('שמירת גרסה','Save version')}</button></div>`:''}</div>
    <p class="small muted" style="margin:6px 0 10px">${L('גרסה שומרת את הספקים, הכמויות, העלויות, המרקאפ וההנחות של ההצעה. אפשר להשוות שתי גרסאות ולשחזר גרסה קודמת.','A version keeps the quote\'s suppliers, quantities, costs, markups and discounts. Compare any two versions and restore an earlier one.')}</p>
    <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>${L('הערה','Note')}</th><th>${L('תאריך','Date')}</th><th>${L('נשמרה על ידי','Saved by')}</th><th class="n">${L('הכנסה','Revenue')}</th><th class="n">${L('עלות','Cost')}</th><th class="n">${L('רווח מתוכנן','Planned profit')}</th><th class="n">${L('שולי רווח','Margin')}</th><th></th></tr></thead><tbody>${list||`<tr><td colspan="9" class="muted">${L('אין גרסאות שמורות.','No saved versions.')}</td></tr>`}</tbody></table></div></div>
  <div class="card sec"><div class="row tbc-cmp" style="flex-wrap:wrap;gap:10px"><h3 style="margin:0">${ic('refresh')} ${L('השוואת גרסאות','Compare versions')}</h3><label class="small muted">${L('גרסה א','Version A')} <select data-ch="tbc-va" aria-label="${L('גרסה א','Version A')}">${opts(A)}</select></label><label class="small muted">${L('גרסה ב','Version B')} <select data-ch="tbc-vb" aria-label="${L('גרסה ב','Version B')}">${opts(B)}</select></label></div>
    ${d.empty?`<p class="muted" style="margin:12px 0 0">${L('אין הבדלים בין שתי הגרסאות.','No differences between these two versions.')}</p>`:`
    ${d.lines.length?`<div class="scroll" style="margin-top:10px"><table class="tbl tbc-diff"><thead><tr><th>${L('שורה','Line')}</th><th>A</th><th>B</th><th class="n">A $</th><th class="n">B $</th><th class="n">${L('הפרש עלות $','Cost change $')}</th></tr></thead><tbody>${dl}</tbody></table></div>`:''}
    ${d.other.length?`<ul class="tbc-other">${d.other.map(o=>`<li>${tbcOtherLabel(o)}</li>`).join('')}</ul>`:''}
    <div class="scroll" style="margin-top:10px"><table class="tbl"><thead><tr><th>${L('סיכומים','Totals')}</th><th class="n">A</th><th class="n">B</th><th class="n">${L('הפרש','Change')}</th></tr></thead><tbody>${tl}</tbody></table></div>`}</div>`;
}
tabInsert('q',['tbver','גרסאות','Versions','document']);
TRIP_TABS.tbver=t=>tbcVerTab(t);

/* seed: every Quote trip has v1; hl and irl have a v2 with another hotel (computed on a deep copy) */
TRIP_INIT.push(t=>{
  if(t.stage!=='Quote'||(t.versions&&t.versions.length))return;
  const q=t.qdays||0,at1=addDays(iso(TODAY),-(q+4)),at2=addDays(iso(TODAY),-(q+1));
  t.versions=[tbVerSnap(t,1,at1,t.agent,'First draft','טיוטה ראשונה')];
  if(t.id==='hl'||t.id==='irl'){
    const c=JSON.parse(JSON.stringify(t)),l=c.lines.find(x=>x.type==='Lodging'&&!x.inv);
    if(!l)return;const a=altsFor(c,l).filter(x=>!x.inc)[0];if(!a)return;
    if(tbSwap(c,l.id,a.sup.id,true).ok)t.versions.push(tbVerSnap(c,2,at2,t.agent,'Alternative hotel: '+a.sup.name,'מלון חלופי: '+a.sup.name));
  }
});

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="tbc-"]');if(!b)return;
  const a=b.dataset.act,t=T();if(!t)return;
  if(a==='tbc-alt'){S.tbAlt=S.tbAlt===+b.dataset.v?0:+b.dataset.v;render();}
  else if(a==='tbc-swap'){const l=t.lines.find(x=>x.id===+b.dataset.l),r=tbSwap(t,+b.dataset.l,b.dataset.s);toast(tbcMsg(r,l));render();}
  else if(a==='tbc-undo'){const r=tbUndo(t,+b.dataset.l);toast(tbcMsg(r));render();}
  else if(a==='tbc-vsave'){const x=tbVerSave(t,S.tbNote);S.tbNote='';S.tbRestore=0;if(x){S.tbVerB=x.v;toast(L('הגרסה נשמרה: v'+x.v,'Version saved: v'+x.v));}render();}
  else if(a==='tbc-vrestore'){const v=+b.dataset.v;
    if(S.tbRestore!==v){S.tbRestore=v;render();}
    else{S.tbRestore=0;const r=tbVerRestore(t,v);toast(r.ok?L('הגרסה שוחזרה: v'+v,'Version restored: v'+v):L('לא ניתן לשחזר.','Could not restore.'));render();}}
});
document.addEventListener('change',e=>{
  const el=e.target;if(!el.dataset)return;
  if(el.dataset.ch==='tbc-va'){S.tbVerA=el.value==='cur'?'cur':+el.value;S.tbRestore=0;render();}
  else if(el.dataset.ch==='tbc-vb'){S.tbVerB=el.value==='cur'?'cur':+el.value;S.tbRestore=0;render();}
});
document.addEventListener('input',e=>{const el=e.target;if(el.dataset&&el.dataset.in==='tbc-note')S.tbNote=el.value;});

/* ---------- tests ---------- */
TESTS.push({name:'tbcomp swaps and versions',run:h=>{
  const out=[],{S}=h,sum=()=>TRIPS.map(t=>{const c=calc(t);return c.rev+'/'+c.plan+'/'+c.planProfit+'/'+c.comm;}).join('|'),snap0=sum();
  const key=t=>{const c=calc(t);return [c.rev,c.plan,c.planProfit,c.comm,c.fcProfit].join('/');};
  const idn=(t,w)=>{const c=calc(t);if(Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit)>.05)out.push('identity '+w+' '+t.id);};
  const supsOk=(t,w)=>{const names=t.sups.map(s=>s.n),used=[...new Set(tbcLines(t).map(l=>l.sup))];
    if(new Set(names).size!==names.length)out.push('dup sups '+w+' '+t.id);
    if(names.slice().sort().join('|')!==used.slice().sort().join('|'))out.push('sups vs lines '+w+' '+t.id+' '+names.length+'/'+used.length);};
  const qs=TRIPS.filter(t=>t.stage==='Quote');let swaps=0;
  qs.forEach(t=>{
    supsOk(t,'init');
    t.lines.filter(l=>!l.inv).forEach(l=>{
      const alts=altsFor(t,l);if(alts.length<2)return;
      const k0=key(t),s0=t.sups.map(s=>s.n).sort().join('|'),cheap=alts.slice(1).sort((a,b)=>a.cost-b.cost)[0];
      const r=tbSwap(t,l.id,cheap.sup.id);swaps++;
      if(!r.ok){out.push('swap refused '+t.id+'/'+l.id+' '+r.reason);return;}
      if(l.sup!==cheap.sup.name||l.cost!==cheap.cost||!l.alt0)out.push('swap fields '+t.id+'/'+l.id);
      idn(t,'swap');supsOk(t,'swap');
      const r2_=tbUndo(t,l.id);
      if(!r2_.ok||l.alt0)out.push('undo '+t.id+'/'+l.id);
      if(key(t)!==k0)out.push('calc after undo '+t.id+'/'+l.id+' '+key(t)+' vs '+k0);
      if(t.sups.map(s=>s.n).sort().join('|')!==s0)out.push('sups after undo '+t.id+'/'+l.id);
      idn(t,'undo');supsOk(t,'undo');
    });
  });
  if(swaps<40)out.push('few swaps tested '+swaps);
  /* swap then swap back by name restores exactly */
  {const t=qs[0],l=t.lines[0],k0=key(t),a=altsFor(t,l)[1];tbSwap(t,l.id,a.sup.id);
    if(!tbSwap(t,l.id,l.alt0.sup).ok||key(t)!==k0||l.alt0)out.push('swap back by name');
    /* two swaps in a row keep the first original */
    const o=l.sup,b=altsFor(t,l);tbSwap(t,l.id,b[1].sup.id);tbSwap(t,l.id,altsFor(t,l).find(x=>!x.inc&&x.sup.name!==o).sup.id);
    if(!l.alt0||l.alt0.sup!==o)out.push('alt0 kept');tbUndo(t,l.id);if(l.sup!==o||key(t)!==k0)out.push('double swap undo');
    if(tbSwap(t,l.id,l.sup).ok)out.push('same sup swap');if(tbSwap(t,999,'x').ok||tbSwap(t,l.id,'nope').ok)out.push('bad args');if(tbUndo(t,l.id).ok)out.push('undo nothing');}
  /* the lodging line drives t.room.hotel */
  {const t=TRIPS.find(x=>x.id==='hl'),l=t.lines[0],old=l.sup,a=altsFor(t,l)[1];tbSwap(t,l.id,a.sup.id);if(t.room.hotel!==a.sup.name)out.push('room hotel follows');tbUndo(t,l.id);if(t.room.hotel!==old)out.push('room hotel restored');}
  /* a supplier used by two lines keeps its entry when only one line moves */
  {const t=qs.find(x=>{const m={};x.lines.filter(l=>!l.extra).forEach(l=>m[l.sup]=(m[l.sup]||0)+1);return Object.values(m).some(n=>n>1);});
   if(t){const m={};t.lines.forEach(l=>m[l.sup]=(m[l.sup]||0)+1);const nm=Object.keys(m).find(k=>m[k]>1),l=t.lines.find(x=>x.sup===nm&&altsFor(t,x).length>1);
     if(l){tbSwap(t,l.id,altsFor(t,l)[1].sup.id);if(!t.sups.some(s=>s.n===nm))out.push('shared supplier entry lost');supsOk(t,'shared');tbUndo(t,l.id);supsOk(t,'shared undo');}}}
  /* invoiced lines, other stages */
  TRIPS.filter(t=>t.stage==='Operations'||t.stage==='Finance'||t.stage==='Closed').forEach(t=>{
    t.lines.filter(l=>l.inv).forEach(l=>{const a=altsFor(t,l)[1];if(a&&tbSwap(t,l.id,a.sup.id).ok)out.push('swap on invoiced '+t.id+'/'+l.id);if(l.alt0)out.push('alt0 on invoiced');});
    if(t.stage!=='Operations'){const l=t.lines.find(x=>!x.inv&&!x.extra&&altsFor(t,x).length>1);if(l&&tbSwap(t,l.id,altsFor(t,l)[1].sup.id).ok)out.push('swap in stage '+t.stage);}
  });
  {const t=TRIPS.find(x=>x.stage==='Operations'&&x.lines.some(l=>!l.inv&&!l.extra&&altsFor(x,l).length>1));
   if(!t)out.push('no operations trip');else{const l=t.lines.find(x=>!x.inv&&!x.extra&&altsFor(t,x).length>1),k0=key(t);
     const r=tbSwap(t,l.id,altsFor(t,l)[1].sup.id);if(!r.ok)out.push('operations swap');else{const e=t.sups.find(s=>s.n===l.sup);if(!e||e.st!=='Sent')out.push('ops sup status '+(e&&e.st));idn(t,'ops swap');tbUndo(t,l.id);if(key(t)!==k0)out.push('ops undo calc');}}}
  /* versions */
  qs.forEach(t=>{
    if(!t.versions||t.versions[0].v!==1)out.push('v1 missing '+t.id);
    if(tbVerDiff(t,1,1).empty!==true)out.push('self diff '+t.id);
    const live=tbVerDiff(t,t.versions[0],'cur');if(!live.empty)out.push('v1 differs from live '+t.id);
  });
  ['hl','irl'].forEach(id=>{const t=TRIPS.find(x=>x.id===id),v1=t.versions[0],v2=t.versions[1];
    if(!v2||v2.v!==2){out.push('v2 missing '+id);return;}
    const d=tbVerDiff(t,v1,v2),lod=d.lines.find(x=>x.type==='Lodging');
    if(!lod||lod.a.sup===lod.b.sup)out.push('v2 lodging same '+id);if(d.empty)out.push('v1 v2 diff empty '+id);
    if(Math.abs(d.totals.planProfit.d-r2(v2.totals.planProfit-v1.totals.planProfit))>.005)out.push('diff totals '+id);});
  {const t=qs[1],tp=t.stage,n0=t.versions.length,k0=key(t);
    const v=tbVerSave(t,'Test save');if(!v||t.versions.length!==n0+1||v.v!==n0+1||v.by!==S.role||v.at!==iso(TODAY))out.push('save');
    const l=t.lines.find(x=>altsFor(t,x).length>1);tbSwap(t,l.id,altsFor(t,l)[1].sup.id);t.markups.Lodging+=3;t.disc['s|Lodging']={m:'%',v:5};
    if(key(t)===k0)out.push('change had no effect');
    const r=tbVerRestore(t,v);if(!r.ok||key(t)!==k0)out.push('restore totals '+key(t)+' vs '+k0);
    supsOk(t,'restore');if(!tbVerDiff(t,v,'cur').empty)out.push('restore diff');idn(t,'restore');
    t.versions.splice(n0,1);if(t.stage!==tp)out.push('stage');}
  {const t=TRIPS.find(x=>x.stage==='Operations');if(tbVerSave(t,'x')!==null||tbVerRestore(t,1).ok)out.push('versions non-quote');}
  /* views */
  const role0=S.role,lang0=S.lang,agent=AGENTS[0];
  const lodL=t=>t.lines.find(l=>l.type==='Lodging'),trL=t=>t.lines.find(l=>l.type==='Transport'&&altsFor(t,l).length>1);
  const negRe=/\b(gap|overbill|dispute|late|slow|poor|risk|expir)/i,realNames=SUPPLIERS.filter(s=>s.real).map(s=>s.name);
  const negNear=(html,w)=>html.split('<tr').forEach(r=>{const txt=r.replace(/<[^>]*>/g,' ');if(negRe.test(txt)&&realNames.some(n=>txt.indexOf(n)>=0))out.push('negative near real name '+w+': '+txt.slice(0,80));});
  ['manager','accountant',agent].forEach(role=>['en','he'].forEach(lang=>{
    S.role=role;S.lang=lang;
    TRIPS.filter(t=>['hl','irl','rom','bra','nen','bro'].includes(t.id)).forEach(t=>{
      [0,lodL(t).id,(trL(t)||lodL(t)).id].forEach(a=>{
        S.tbAlt=a;const w=lang+role+'/'+t.id+'/alt'+a;
        let html='';try{html=tbcComp(t);}catch(e){out.push('comp threw '+w+' '+e.message);return;}
        h.chk(html,w);if(lang==='en')h.scan(html,w);negNear(html,w);
        if(a&&html.indexOf('tbc-panel')<0)out.push('panel closed '+w);if(!a&&html.indexOf('tbc-panel')>=0)out.push('panel open '+w);
      });
      try{const html=tbcVerTab(t);h.chk(html,lang+role+'/'+t.id+'/ver');if(lang==='en')h.scan(html,lang+role+'/'+t.id+'/ver');negNear(html,'ver '+t.id);}catch(e){out.push('ver threw '+lang+role+'/'+t.id+' '+e.message);}
    });
    {const t=TRIPS.find(x=>x.id==='hl');S.tbVerA=1;S.tbVerB=2;const html=tbcVerTab(t);h.chk(html,'cmp '+lang);if(lang==='en')h.scan(html,'cmp');if(html.indexOf('tbc-diff')<0)out.push('compare table missing');
      S.tbVerA=1;S.tbVerB='cur';if(tbcVerTab(t).indexOf('No differences')<0&&lang==='en')out.push('empty compare text');
      S.tbRestore=2;if(lang==='en'&&role==='manager'&&tbcVerTab(t).indexOf('Click again to restore')<0)out.push('confirm text');}
    S.tbVerA=0;S.tbVerB=0;S.tbRestore=0;S.tbAlt=0;
  }));
  S.role=role0;S.lang=lang0;S.tbAlt=0;
  if(sum()!==snap0)out.push('state not restored');
  return out;
}});
