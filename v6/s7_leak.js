/* ---------- profit-leak model and snapshot (v7, Phase A) ----------
   The bridge runs from planned profit to expected profit. Its steps are the supplier-invoice
   differences by kind plus FX, so per trip: planProfit - amtDiff - fx = fcProfit (check6.js).
   Items that are not yet in the books (room-block release, late client payments, missing
   invoices) sit beside the bridge as "at risk", never inside it. */
const LK_ORDER=['rooms','rate','comp','dup','extra','qty','under'];
const kUsd=v=>{const a=Math.abs(v),s=v<0?'-':'';return s+'$'+(a>=10000?(a/1000).toFixed(1)+'k':Math.round(a).toLocaleString('en-US'));};
function releaseRisk(t){
  if(t.stage!=='Operations'||!t.room)return null;
  const rd=addDays(t.dep,-30),n=t.room.held-t.room.used;
  if(!(n>0)||!(D(rd)<TODAY))return null;
  const lod=t.lines.find(l=>l.type==='Lodging'&&l.cost>0);if(!lod)return null;
  return {t,n,rd,amt:r2(n*t.nights*lod.cost*lrate(t,lod))};
}
function leakModel(ts){
  const M={rev:0,pp:0,fp:0,amtDiff:0,fx:0,pax:0,n:0,steps:{},rec:0,recN:0,lost:0,lostN:0,got:0,gotN:0,release:0,rel:[],late:0,lateN:0,missing:0,rows:[],sup:{}};
  LK_ORDER.forEach(k=>M.steps[k]={amt:0,n:0});
  ts.filter(t=>t.stage!=='Quote').forEach(t=>{
    const c=calc(t),g=groupsCalc(t);
    const row={t,key:t.id,rev:c.rev,pp:c.planProfit,fp:c.fcProfit,leak:r2(c.planProfit-c.fcProfit),rec:0,recN:0,fx:c.fx};
    c.lines.forEach(x=>{
      const l=x.l;if(!l.inv)return;const s=invStatus(l);
      if(s.k==='credited'){const u=r2(s.credit*lrate(t,l));M.got=r2(M.got+u);M.gotN++;const sp=M.sup[l.sup]||(M.sup[l.sup]={over:0,rec:0,got:0,n:0,trips:new Set()});sp.got=r2(sp.got+u);sp.trips.add(t.id);return;}
      if(s.k!=='gap')return;
      const k=kindOf(l,s),st=M.steps[k]||(M.steps[k]={amt:0,n:0});st.amt=r2(st.amt+x.amtDiff);st.n++;
      const sp=M.sup[l.sup]||(M.sup[l.sup]={over:0,rec:0,got:0,n:0,trips:new Set()});sp.over=r2(sp.over+x.amtDiff);sp.n++;sp.trips.add(t.id);
      if(x.amtDiff>0&&(s.st==='open'||s.st==='disputed')){M.rec=r2(M.rec+x.amtDiff);M.recN++;row.rec=r2(row.rec+x.amtDiff);row.recN++;sp.rec=r2(sp.rec+x.amtDiff);}
      else if(x.amtDiff>0){M.lost=r2(M.lost+x.amtDiff);M.lostN++;}
    });
    const rr=releaseRisk(t);if(rr){M.release=r2(M.release+rr.amt);M.rel.push(rr);row.release=rr.amt;}
    M.rev=r2(M.rev+c.rev);M.pp=r2(M.pp+c.planProfit);M.fp=r2(M.fp+c.fcProfit);M.amtDiff=r2(M.amtDiff+c.amtDiff);M.fx=r2(M.fx+c.fx);
    M.late=r2(M.late+g.late);M.lateN+=g.rows.filter(r=>r.late>0).length;M.pax+=t.pax;M.n++;
    M.rows.push(row);
  });
  M.leak=r2(M.pp-M.fp);
  M.missing=gapStats(ts).missing;
  return M;
}
/* rows of the snapshot table for one dimension; every dimension except supplier sums to M.leak */
const LK_DIMS=[['trip',['טיול','Trip']],['agent',['סוכן','Agent']],['seg',['סוג קבוצה','Group type']],['sup',['ספק','Supplier']]];
function lkKey(dim,t){return dim==='agent'?t.agent:dim==='seg'?t.seg:t.id;}
function lkLabel(dim,k){if(dim==='agent')return agn(k);if(dim==='seg')return sn(k);if(dim==='sup')return k;const t=byId(k);return t?t.name:k;}
function leakRows(M,dim){
  if(dim==='sup')return Object.entries(M.sup).map(([k,s])=>({key:k,label:k,n:s.trips.size,leak:s.over,rec:s.rec,got:s.got,pp:0})).filter(r=>r.leak>0||r.got>0).sort((a,b)=>b.leak-a.leak);
  const out={};
  M.rows.forEach(r=>{const k=lkKey(dim,r.t),o=out[k]||(out[k]={key:k,label:lkLabel(dim,k),n:0,rev:0,pp:0,fp:0,leak:0,rec:0,ts:[]});
    o.n++;o.rev=r2(o.rev+r.rev);o.pp=r2(o.pp+r.pp);o.fp=r2(o.fp+r.fp);o.leak=r2(o.leak+r.leak);o.rec=r2(o.rec+r.rec);o.ts.push(r.t);});
  return Object.values(out).sort((a,b)=>b.leak-a.leak);
}
function lkScopeTrips(){
  const ts=visibleTrips().filter(t=>t.stage!=='Quote'),d=S.lkSel&&S.lkSel.split('|');
  if(!d||d[0]==='sup')return ts;
  return ts.filter(t=>lkKey(d[0],t)===d[1]);
}
/* ---------- leak bridge, drawn as inline SVG ----------
   Starts at $0 and walks down by each leak kind to the total leaked, so the steps are readable
   (planned and expected profit are the hero numbers above it). Axis is not truncated. */
function wfSvg(M){
  const steps=LK_ORDER.filter(k=>M.steps[k]&&Math.abs(M.steps[k].amt)>=.5).map(k=>({k,v:-M.steps[k].amt,n:M.steps[k].n,label:kindL(k)}));
  steps.sort((a,b)=>a.v-b.v);
  if(Math.abs(M.fx)>=.5)steps.push({k:'fx',v:-M.fx,n:0,label:L('הפרשי שער','Exchange rate')});
  if(!steps.length)return `<p class="muted">${L('אין הפרשים בין החשבוניות להצעה בטווח הזה.','No differences between invoices and quotes in this scope.')}</p>`;
  const cols=[...steps,{k:'tot',v:-M.leak,tot:true,label:L('סה״כ דלף','Total leaked')}];
  let lvl=0,lo=0,hi=0;const bars=cols.map(c=>{const from=c.tot?0:lvl,to=c.tot?c.v:lvl+c.v;if(!c.tot)lvl=to;lo=Math.min(lo,from,to);hi=Math.max(hi,from,to);return {...c,from,to};});
  const W=760,H=300,x0=14,y0=42,yb=232,n=cols.length,band=(W-2*x0)/n,bw=Math.min(62,band*.6),rng=(hi-lo)||1,y=v=>y0+(hi-v)/rng*(yb-y0);
  const words=s=>{const w=String(s).split(' ');if(w.length<2)return [s,''];const half=s.length/2;let a='',b='';w.forEach(x=>{if(!b&&(a+' '+x).trim().length<=half+3)a=(a+' '+x).trim();else b=(b+' '+x).trim();});return [a,b];};
  const g=bars.map((b,i)=>{
    const x=x0+i*band+(band-bw)/2,yt=Math.min(y(b.from),y(b.to)),h=Math.max(2,Math.abs(y(b.from)-y(b.to)));
    const cls=b.tot?'wf-total':b.v<0?'wf-neg':'wf-pos',[l1,l2]=words(b.label),down=b.to<b.from;
    const val=(b.v<0?'-':'+')+kUsd(Math.abs(b.v));
    const conn=i<bars.length-1&&!b.tot&&!bars[i+1].tot?`<line class="wf-conn" x1="${x+bw}" x2="${x+band}" y1="${y(b.to)}" y2="${y(b.to)}"/>`:'';
    return `<g class="wf-col" style="--d:${i*80}ms"><rect class="wf-bar ${cls}" x="${x}" y="${yt}" width="${bw}" height="${h}" rx="4"><title>${esc(b.label)}: ${val}${b.n?` (${b.n})`:''}</title></rect>${conn}
      <text class="wf-val ${b.tot?'big':''}" x="${x+bw/2}" y="${down?yt+h+16:yt-7}" text-anchor="middle">${b.tot?kUsd(b.v):val}</text>
      <text class="wf-lbl" x="${x+bw/2}" y="${yb+30}" text-anchor="middle">${esc(l1)}</text><text class="wf-lbl" x="${x+bw/2}" y="${yb+45}" text-anchor="middle">${esc(l2)}</text></g>`;}).join('');
  return `<svg class="wf" viewBox="0 0 ${W} ${H}" role="img" dir="ltr" aria-label="${L('גשר הדליפה לפי סוג','Leak bridge by kind')}"><line class="wf-axis" x1="${x0}" x2="${W-x0}" y1="${y(0)}" y2="${y(0)}"/><text class="wf-sub" x="${x0}" y="${y(0)-8}">$0</text>${g}</svg>`;
}
/* ---------- the snapshot view ---------- */
function lkKpi(label,val,sub,cls,num){return `<div class="lk-k ${cls||''}"><div class="l">${label}</div><div class="v"${num!=null?` data-count="${num}"`:''}>${usd(val)}</div><div class="s">${sub}</div></div>`;}
function lkHeat(M){
  const ags=[...new Set(M.rows.map(r=>r.t.agent))].sort(),sg=[...new Set(M.rows.map(r=>r.t.seg))];
  const cell=(a,s)=>{const rs=M.rows.filter(r=>r.t.agent===a&&r.t.seg===s);if(!rs.length)return {v:null,n:0};return {v:r2(rs.reduce((x,r)=>x+r.leak,0)),n:rs.length};};
  const mx=Math.max(1,...ags.flatMap(a=>sg.map(s=>cell(a,s).v||0)));
  return `<div class="card lk-heat"><h3>${L('איפה זה דולף: סוכן מול סוג קבוצה','Where it leaks: agent by group type')}</h3><div class="scroll"><table class="hm"><thead><tr><th></th>${sg.map(s=>`<th>${sn(s)}</th>`).join('')}</tr></thead><tbody>
   ${ags.map(a=>`<tr><th>${agn(a)}</th>${sg.map(s=>{const c=cell(a,s);if(c.v===null)return '<td class="e">·</td>';const i=Math.max(0,Math.min(1,c.v/mx));
     return `<td><button class="hmc" data-act="lksel" data-v="agent|${a}" style="--i:${i.toFixed(2)}" title="${esc(agn(a))} · ${esc(sn(s))}: ${c.n}">${kUsd(c.v)}</button></td>`;}).join('')}</tr>`).join('')}</tbody></table></div>
   <p class="small muted" style="margin:8px 0 0">${L('כהה יותר = יותר רווח שדלף. לחיצה מסננת לפי הסוכן.','Darker means more profit lost. Click to focus on that agent.')}</p></div>`;
}
function vLeaks(){
  const all=visibleTrips().filter(t=>t.stage!=='Quote');if(!all.length)return noTrip();
  const dim=S.lkDim||'trip',ts=lkScopeTrips(),M=leakModel(ts),Mall=leakModel(all);
  const sel=S.lkSel&&S.lkSel.split('|'),scopeName=sel&&sel[0]!=='sup'?lkLabel(sel[0],sel[1]):L('כל העונה','Whole season');
  const share=M.pp?M.leak/M.pp:0;
  const top=leakRows(M,'trip').at(0);
  const finding=M.leak>0?L(`${usd(M.leak)} מהרווח המתוכנן דלפו (${pct(share)}). ${usd(M.rec)} עדיין ניתנים להחזרה.`,`${usd(M.leak)} of planned profit has leaked (${pct(share)}). ${usd(M.rec)} can still be recovered.`):L('אין דליפה בטווח הזה.','No leak in this scope.');
  const allRows=leakRows(M,dim),rows=S.lkAll?allRows:allRows.filter(r=>Math.abs(r.leak)>=.5||(r.got||0)>0),hidden=allRows.length-rows.length,mxL=Math.max(1,...rows.map(r=>r.leak));
  const th=dim==='sup'?`<th>${L('ספק','Supplier')}</th><th class="n">${L('טיולים','Trips')}</th><th>${L('חיוב ביתר','Overbilled')}</th><th class="n">${L('ניתן להחזרה','Recoverable')}</th><th class="n">${L('הוחזר','Recovered')}</th>`
    :`<th>${LK_DIMS.find(d=>d[0]===dim)[1][S.lang==='en'?1:0]}</th><th class="n">${L('טיולים','Trips')}</th><th class="n">${L('רווח מתוכנן','Planned')}</th><th>${L('דלף','Leaked')}</th><th class="n">${L('רווח צפוי','Expected')}</th><th class="n">${L('ניתן להחזרה','Recoverable')}</th>`;
  const bar=r=>`<div class="lk-bar"><i style="width:${Math.max(0,r.leak/mxL*100)}%"></i><span>${usd(r.leak)}</span></div>`;
  const tr=rows.map(r=>{const on=S.lkSel===`${dim}|${r.key}`;
    if(dim==='sup')return `<tr class="${on?'on':''}"><td><strong>${esc(r.label)}</strong></td><td class="n">${r.n}</td><td>${bar(r)}</td><td class="n">${usd(r.rec)}</td><td class="n pos">${usd(r.got)}</td></tr>`;
    const act=dim==='trip'?`data-act="open" data-v="${r.key}" data-pt="tfin"`:`data-act="lksel" data-v="${dim}|${esc(r.key)}"`;
    return `<tr class="${on?'on':''}"><td><button class="lk-name" ${act}>${esc(r.label)}</button>${dim==='trip'?`<span class="small muted"> · ${agn(r.ts[0].agent)}, ${stn(r.ts[0].stage)}</span>`:''}</td><td class="n">${r.n}</td><td class="n">${usd(r.pp)} <span class="small muted">${pct(r.rev?r.pp/r.rev:0)}</span></td><td>${bar(r)}</td><td class="n">${usd(r.fp)} <span class="small muted">${pct(r.rev?r.fp/r.rev:0)}</span></td><td class="n">${r.rec?usd(r.rec):'·'}</td></tr>`;}).join('');
  const risk=`<div class="card lk-risk"><h3>${L('בסיכון, עוד לא בספרים','At risk, not in the books yet')}</h3>
    <div class="lk-ri"><span class="ic">▥</span><div><strong>${usd(M.release)}</strong> ${L('חדרים בבלוק שלא שוחררו','unreleased block rooms')}<div class="small muted">${M.rel.length?M.rel.map(x=>`${esc(x.t.name)}: ${x.n} ${L('חדרים','rooms')}, ${esc(x.t.room.hotel)}`).join(' · '):L('אין','None')}</div></div></div>
    <div class="lk-ri"><span class="ic">⏱</span><div><strong>${usd(M.late)}</strong> ${L('תשלומי לקוחות באיחור','late client payments')}<div class="small muted">${M.lateN} ${L('קבוצות חיוב. סיכון מזומנים, לא רווח.','billing groups. A cash risk, not profit.')}</div></div></div>
    <div class="lk-ri"><span class="ic">?</span><div><strong>${M.missing}</strong> ${L('חשבוניות ספק חסרות','missing supplier invoices')}<div class="small muted">${L('בטיולים שחזרו. הסכום ידוע רק כשהן מגיעות.','On returned trips. The amount is known only when they arrive.')}</div></div></div>
    <div class="lk-ri ok"><span class="ic">✓</span><div><strong>${usd(M.got)}</strong> ${L('הוחזר מספקים העונה','recovered from suppliers this season')}<div class="small muted">${M.gotN} ${L('זיכויים','credits')}</div></div></div></div>`;
  return head(L('דליפות רווח','Profit leaks'),pillF(L('חדש','New'),'green'))+
  `<p class="muted">${L('כל טיול, סוכן וסוג קבוצה: כמה מהרווח המתוכנן הגיע בפועל, ולאן השאר הלך.','Every trip, agent and group type: how much planned profit is still there, and where the rest went.')}</p>
  <div class="lk-hero">
    <div class="lk-scope"><span class="small">${L('טווח','Scope')}</span> <strong>${esc(scopeName)}</strong> <span class="small">· ${M.n} ${L('טיולים','trips')}, ${M.pax} ${L('נוסעים','travelers')}</span>${sel?` <button class="lk-x" data-act="lksel" data-v="" aria-label="${L('הצגת כל העונה','Show whole season')}">✕ ${L('כל העונה','Whole season')}</button>`:''}</div>
    <div class="lk-ks">${lkKpi(L('רווח מתוכנן','Planned profit'),M.pp,`${pct(M.rev?M.pp/M.rev:0)} ${L('מההכנסות','of revenue')}`,'',M.pp)}
    ${lkKpi(L('רווח צפוי','Expected profit'),M.fp,`${pct(M.rev?M.fp/M.rev:0)} ${L('מההכנסות','of revenue')}`,'',M.fp)}
    ${lkKpi(L('דלף','Leaked'),M.leak,`${pct(share)} ${L('מהרווח המתוכנן','of planned profit')}`,'bad',M.leak)}
    ${lkKpi(L('ניתן להחזרה עכשיו','Recoverable now'),M.rec,`${M.recN} ${L('פערים פתוחים או בדרישה','open or disputed gaps')}`,'good',M.rec)}</div>
  </div>
  <div class="lk-grid"><div class="card lk-wf"><h3>${finding}</h3>${wfSvg(M)}<p class="small muted" style="margin:4px 0 0">${L('אדום: חיוב ספקים מעל ההצעה. ירוק: חיוב מתחת להצעה. זיכויים שהתקבלו כבר מקוזזים.','Red: supplier bills above the quote. Green: bills below the quote. Credits already received are netted out.')}</p></div>${risk}</div>
  <div class="card lk-break"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">${L('הפירוט','Breakdown')}</h3><div class="seg" role="tablist">${LK_DIMS.map(d=>`<button role="tab" aria-selected="${dim===d[0]}" class="${dim===d[0]?'on':''}" data-act="lkdim" data-v="${d[0]}">${L(d[1][0],d[1][1])}</button>`).join('')}</div></div>
   <div class="scroll"><table class="tbl lk-tbl"><thead><tr>${th}</tr></thead><tbody>${tr||`<tr><td colspan="6" class="muted">${L('אין נתונים.','No data.')}</td></tr>`}</tbody></table></div>
   ${hidden>0||S.lkAll?`<button class="btn sm" style="margin-top:8px" data-act="lkall">${S.lkAll?L('הצג רק מה שדולף','Show only what leaks'):L(`הצג גם ${hidden} ללא דליפה`,`Show ${hidden} more with no leak`)}</button>`:''}
   ${top&&dim==='trip'&&top.leak>0?`<p class="small muted" style="margin:8px 0 0">${L('הדליפה הגדולה:','Largest leak:')} <strong>${esc(top.label)}</strong>, ${usd(top.leak)}. ${L('לחיצה על שם טיול פותחת את בקרת החשבוניות שלו.','Click a trip name to open its invoice check.')}</p>`:''}</div>${lkHeat(Mall)}`;
}
/* ---------- wiring ---------- */
NAV2.unshift(['leaks',['דליפות רווח','Profit leaks'],'%']);
VIEWS.leaks=vLeaks;
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  if(a==='lkdim'){S.lkDim=v;render();}
  else if(a==='lkall'){S.lkAll=!S.lkAll;render();}
  else if(a==='lksel'){S.lkSel=v||'';S.tab='leaks';render();}
});
/* count-up for hero numbers: runs once per screen visit, final value is already in the markup */
const CU_SEEN={};
function countUp(){
  try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;}catch(e){}
  if(!document.querySelectorAll)return;
  const key=S.tab+'|'+(S.lkSel||'');if(CU_SEEN[key])return;CU_SEEN[key]=1;
  document.querySelectorAll('[data-count]').forEach(el=>{const to=+el.dataset.count,fin=el.textContent,t0=performance.now(),dur=900;
    const step=now=>{const p=Math.min(1,(now-t0)/dur),e2=1-Math.pow(1-p,3);el.textContent=p<1?usd(to*e2):fin;if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step);});
}
