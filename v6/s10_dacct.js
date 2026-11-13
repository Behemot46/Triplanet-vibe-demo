/* ---------- v8 module da: the accountant's home dashboard (role key "accountant") ----------
   Every figure comes from an existing function (portfolio, groupsCalc, gapStats, incomeDocs, leakModel, ACCT);
   no new finance math. The calculators below are pure and exported (global) so check6 can recompute them.
   Definitions follow docs/spec-v8-parity.md A19 and 4.8:
   - AR next 30: unpaid group deposit/balance whose due date is in [TODAY, TODAY+30] (overdue is separate);
   - overdue: portfolio().aging (3 buckets);
   - AP schedule: unpaid lines of non-Quote trips, amount effAmt(inv) or planC(l), times lrate, dated by the
     portfolio() cash-out rule (Finance/Closed: TODAY+20, Operations: dep-14), past dates clamped to this week,
     grouped in 7-day weeks counted from TODAY (week 0 = TODAY..TODAY+6). */
Object.assign(S,{daDet:'ar30',daWk:-1});
const DA_STATE={iss:[],ap:[]};
PERSIST.push({key:'da_state',get:()=>({iss:DA_STATE.iss.slice(),ap:DA_STATE.ap.slice()}),
  set:v=>{DA_STATE.iss=(v&&v.iss)||[];DA_STATE.ap=(v&&v.ap)||[];},reset:()=>{DA_STATE.iss=[];DA_STATE.ap=[];}});

const daTrips=()=>visibleTrips().filter(t=>t.stage!=='Quote');
const daDayDiff=dt=>Math.round((dt-TODAY)/DAY);

/* cash to collect: unpaid installments due in [TODAY, TODAY+30] */
function daArNext30(){
  const lo=iso(TODAY),hi=addDays(lo,30),items=[];
  daTrips().forEach(t=>groupsCalc(t).rows.forEach(r=>{
    [['dep',t.depDue,r.depPaid,r.dep],['bal',t.balDue,r.balPaid,r.bal]].forEach(([kind,due,paid,amt])=>{
      if(!paid&&amt>0&&due>=lo&&due<=hi)items.push({t,row:r,kind,due,amt,days:daDayDiff(D(due))});});}));
  items.sort((a,b)=>a.due<b.due?-1:a.due>b.due?1:b.amt-a.amt);
  return {total:r2(items.reduce((a,x)=>a+x.amt,0)),n:items.length,items,from:lo,to:hi};
}
/* overdue receivables: the three aging buckets of portfolio() */
function daOverdue(){
  const P=portfolio(visibleTrips()),lab=[L('1-30 ימים','1-30 days'),L('31-60 ימים','31-60 days'),L('מעל 60 יום','Over 60 days')];
  return {total:r2(P.aging.reduce((a,x)=>a+x,0)),n:P.lateN,buckets:P.aging.map((amt,i)=>({lab:lab[i],amt,n:P.agingN[i]})),groups:P.lateGroups,P};
}
/* supplier bills received, matched to the quote line and not yet paid or approved */
function daBillsToApprove(){
  const items=[];
  daTrips().forEach(t=>t.lines.forEach(l=>{
    if(!l.inv||l.inv.paid)return;const key=t.id+':'+l.id;
    if(DA_STATE.ap.includes(key)||invStatus(l).k!=='match')return;
    items.push({t,l,key,no:l.inv.no,amt:r2(effAmt(l.inv)*lrate(t,l))});}));
  items.sort((a,b)=>b.amt-a.amt);
  return {total:r2(items.reduce((a,x)=>a+x.amt,0)),n:items.length,items};
}
/* all unpaid supplier lines of non-Quote trips with their payment date (portfolio() cash-out rule) */
function daApItems(){
  const out=[];
  daTrips().forEach(t=>{
    const dt=t.stage==='Finance'||t.stage==='Closed'?new Date(TODAY.getTime()+20*DAY):new Date(D(t.dep).getTime()-14*DAY);
    const wk=Math.floor(Math.max(0,daDayDiff(dt))/7);
    t.lines.forEach(l=>{
      if(l.inv&&l.inv.paid)return;
      const amtC=l.inv?effAmt(l.inv):planC(l);
      out.push({t,l,cur:l.cur,native:r2(amtC),amt:r2(amtC*lrate(t,l)),date:iso(dt<TODAY?TODAY:dt),wk,billed:!!l.inv});});});
  return out;
}
function daApWeeks(n){
  n=n||8;const all=daApItems(),weeks=[];
  for(let i=0;i<n;i++)weeks.push({i,from:addDays(iso(TODAY),7*i),to:addDays(iso(TODAY),7*i+6),total:0,n:0,byCur:{},items:[]});
  all.forEach(x=>{const w=weeks[x.wk];if(!w)return;w.total=r2(w.total+x.amt);w.n++;w.items.push(x);
    if(x.cur!=='USD')w.byCur[x.cur]=r2((w.byCur[x.cur]||0)+x.native);});
  const inWin=weeks.reduce((a,w)=>r2(a+w.total),0);
  return {weeks,total:inWin,n:weeks.reduce((a,w)=>a+w.n,0),all:r2(all.reduce((a,x)=>a+x.amt,0)),later:r2(all.reduce((a,x)=>a+x.amt,0)-inWin),max:Math.max(1,...weeks.map(w=>w.total))};
}
/* deal invoices (unpaid installments due within 30 days or already late, by the incomeDocs rule) the accountant has not yet issued */
function daDocsToIssue(){
  const items=[];
  daTrips().forEach(t=>incomeDocs(t).docs.forEach(d=>{
    if(d.type!=='deal'||d.st!=='req')return;const key=t.id+'|'+d.no;
    if(DA_STATE.iss.includes(key))return;
    items.push({t,d,key,amt:d.amt});}));
  items.sort((a,b)=>a.d.date<b.d.date?-1:a.d.date>b.d.date?1:0);
  return {total:r2(items.reduce((a,x)=>a+x.amt,0)),n:items.length,items};
}
/* foreign-currency payables still open, at each trip's locked rate */
function daFxExposure(){
  const fx=portfolio(visibleTrips()).fxExp,rows=Object.keys(fx).map(cur=>({cur,amt:r2(fx[cur].amt),usd:fx[cur].usd})).sort((a,b)=>b.usd-a.usd);
  return {rows,total:r2(rows.reduce((a,x)=>a+x.usd,0)),n:rows.length};
}
/* supplier commission counted in planned profit and not yet received (leakModel rule) */
function daCommReceivable(){
  const M=leakModel(visibleTrips()),rows=M.rows.filter(r=>r.comm>0).map(r=>({t:r.t,amt:r.comm})).sort((a,b)=>b.amt-a.amt);
  return {total:M.comm,n:M.commN,rows};
}
/* month-end checklist: 8 items, each with a computed count; done when the count is 0 */
function daMonthEnd(){
  const ts=visibleTrips(),G=gapStats(ts),od=daOverdue(),bills=daBillsToApprove(),docs=daDocsToIssue(),cm=daCommReceivable(),fx=daFxExposure();
  const it=(id,he,en,count,total,act,v,pt)=>({id,he,en,count,total,act,v,pt,done:count===0});
  return [
    it('match','להתאים כל חשבונית ספק לשורת ההצעה','Match every supplier bill to its quote line',G.received-G.matched,0,'go','gaps'),
    it('missing','לקבל חשבוניות שחסרות מספקים','Collect supplier bills still missing',G.missing,0,'go','gaps'),
    it('gaps','לסגור פערים פתוחים מול ספקים','Close open supplier differences',G.openN+G.dispN,r2(G.open+G.disp),'go','gaps'),
    it('approve','לאשר חשבוניות ספק מותאמות','Approve matched supplier bills',bills.n,bills.total,'da-det','bills'),
    it('issue','להפיק חשבוניות עסקה ללקוחות','Issue deal invoices to clients',docs.n,docs.total,'da-det','docs'),
    it('ar','לעקוב אחרי תשלומי לקוחות באיחור','Follow up on overdue client payments',od.n,od.total,'da-det','overdue'),
    it('comm','לגבות עמלות ספקים שטרם התקבלו','Collect supplier commission not yet received',cm.n,cm.total,'da-det','comm'),
    it('fx','לבדוק חשיפה למט״ח בחובות פתוחים','Review foreign-currency exposure on open payables',fx.n,fx.total,'go','finance')
  ];
}

/* ---------- state actions (named; the click handler only calls these) ---------- */
function daDet(k){S.daDet=k;if(k!=='ap')S.daWk=-1;render();}
function daWk(i){S.daDet='ap';S.daWk=S.daWk===i?-1:i;render();}
function daIssue(key){
  if(!canIssueDocs()){try{toast(L('התפקיד שלך לא כולל הפקת מסמכים','Your role cannot issue documents'));}catch(e){}return false;}
  if(!DA_STATE.iss.includes(key)){DA_STATE.iss.push(key);try{toast(L('החשבונית הופקה ונשלחה ללקוח','Deal invoice issued and sent to the client'));}catch(e){}}
  render();
  return true;
}
function daApprove(key){
  if(DA_STATE.ap.includes(key))return;
  DA_STATE.ap.push(key);
  try{
    const [tid,lid]=key.split(':'),t=byId(tid),l=t&&t.lines.find(x=>String(x.id)===lid);
    if(t&&l&&typeof A==='function'&&S.acct&&S.acct.phase==='synced')acLog('post',t,l,l.inv?effAmt(l.inv):0);
    else toast(L('החשבונית אושרה לתשלום','Bill approved for payment'));
  }catch(e){}
  render();
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  if(a==='da-det')daDet(v);else if(a==='da-wk')daWk(+v);else if(a==='da-issue')daIssue(v);else if(a==='da-approve')daApprove(v);
});

/* ---------- rendering ---------- */
const daOpen=(t,pt,txt,cls)=>`<button class="btn sm ${cls||''}" data-act="open" data-v="${t.id}" data-pt="${pt}" aria-label="${L('פתח','Open')} ${esc(t.name)}">${txt||L('פתח','Open')}</button>`;
const daRowAttr=(t,pt)=>`class="da-row" data-act="open" data-v="${t.id}" data-pt="${pt}"`;
const daDate=s=>D(s).toLocaleDateString(LOC(),{month:'short',day:'numeric'});
const daKind=k=>k==='dep'?L('מקדמה','Deposit'):L('יתרה','Balance');
const daMore=(n,page,lab)=>n>0?`<div class="da-more"><span class="muted small">${L(`ועוד ${n}`,`and ${n} more`)}</span><button class="btn sm" data-act="go" data-v="${page}">${lab}</button></div>`:'';
const daNum=(v,cls)=>`<td class="n ${cls||''}"><bdi>${v}</bdi></td>`;

function daDetail(key){
  const CAP=8,tbl=(cols,rows,more)=>`<div class="scroll"><table class="tbl da-tbl"><thead><tr>${cols.map(c=>`<th${c[1]?` class="${c[1]}"`:''}>${c[0]}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${cols.length}" class="muted">${L('אין פריטים.','Nothing here.')}</td></tr>`}</tbody></table></div>${more||''}`;
  if(key==='overdue'){const o=daOverdue(),rows=o.groups.slice().sort((a,b)=>b.g.late-a.g.late);
    return {title:L('חובות לקוחות באיחור','Overdue client payments'),sum:usd(o.total),page:'finance',
      body:`<div class="da-chips">${o.buckets.map(b=>`<span class="da-chip">${b.lab}<b>${usd(b.amt)}</b><em>${b.n}</em></span>`).join('')}</div>`+
      tbl([[L('קבוצת חיוב','Billing group')],[L('טיול','Trip')],[L('ימי איחור','Days late'),'n'],[L('סכום','Amount'),'n'],['']],
        rows.slice(0,CAP).map(x=>`<tr ${daRowAttr(x.t,'income')}><td><strong>${esc(x.g.name)}</strong></td><td>${esc(x.t.name)}</td>${daNum(x.g.days)}${daNum(usd(x.g.late),'neg')}<td>${daOpen(x.t,'income')}</td></tr>`).join(''),daMore(rows.length-CAP,'finance',L('לכל הכספים','Open Finance')))};}
  if(key==='bills'){const b=daBillsToApprove();
    return {title:L('חשבוניות ספק לאישור','Supplier bills to approve'),sum:usd(b.total),page:'gaps',
      body:tbl([[L('טיול','Trip')],[L('קטגוריה','Category')],[L('חשבונית','Bill')],[L('סכום','Amount'),'n'],['']],
        b.items.slice(0,CAP).map(x=>`<tr ${daRowAttr(x.t,'tfin')}><td><strong>${esc(x.t.name)}</strong></td><td>${tn(x.l.type)}</td><td><bdi>${esc(x.no)}</bdi></td>${daNum(usd(x.amt))}<td><button class="btn sm pri" data-act="da-approve" data-v="${x.key}">${L('אשר','Approve')}</button></td></tr>`).join(''),daMore(b.n-CAP,'gaps',L('לבקרת החשבוניות','Open invoice check')))};}
  if(key==='comm'){const c=daCommReceivable();
    return {title:L('עמלות ספקים לגבייה','Supplier commission receivable'),sum:usd(c.total),page:'leaks',
      body:tbl([[L('טיול','Trip')],[L('סטטוס','Status')],[L('עמלה','Commission'),'n'],['']],
        c.rows.slice(0,CAP).map(x=>`<tr ${daRowAttr(x.t,'tfin')}><td><strong>${esc(x.t.name)}</strong></td><td>${pillF(stn(x.t.stage),stCls(x.t.stage))}</td>${daNum(usd(x.amt))}<td>${daOpen(x.t,'tfin')}</td></tr>`).join(''),daMore(c.rows.length-CAP,'leaks',L('לדליפות רווח','Open profit leaks')))};}
  if(key==='docs'){const d=daDocsToIssue();
    return {title:L('חשבוניות עסקה להפקה','Deal invoices to issue'),sum:usd(d.total),page:'finance',
      body:tbl([[L('קבוצת חיוב','Billing group')],[L('טיול','Trip')],[L('סוג','Type')],[L('תאריך','Date')],[L('סכום','Amount'),'n'],['']],
        d.items.slice(0,CAP).map(x=>`<tr ${daRowAttr(x.t,'income')}><td><strong>${esc(x.d.name)}</strong></td><td>${esc(x.t.name)}</td><td>${daKind(x.d.kind)}</td><td>${fmtDate(x.d.date)}</td>${daNum(usd(x.amt))}<td><button class="btn sm pri" data-act="da-issue" data-v="${x.key}" ${canIssueDocs()?'':`disabled title="${L('התפקיד שלך לא כולל הפקת מסמכים','Your role cannot issue documents')}"`}>${L('הפק','Issue')}</button></td></tr>`).join(''),daMore(d.n-CAP,'finance',L('לכל הכספים','Open Finance')))};}
  if(key==='ap'){const w=daApWeeks(8),sel=S.daWk>=0?w.weeks[S.daWk]:null,items=(sel?sel.items:w.weeks.flatMap(x=>x.items)).slice().sort((a,b)=>b.amt-a.amt);
    return {title:sel?L(`תשלומים לספקים: ${daDate(sel.from)} עד ${daDate(sel.to)}`,`Supplier payments: ${daDate(sel.from)} to ${daDate(sel.to)}`):L('תשלומים לספקים ב-8 השבועות הקרובים','Supplier payments, next 8 weeks'),sum:usd(sel?sel.total:w.total),page:'finance',
      body:tbl([[L('טיול','Trip')],[L('קטגוריה','Category')],[L('תאריך תשלום','Pay date')],[L('סכום','Amount'),'n'],['']],
        items.slice(0,CAP).map(x=>`<tr ${daRowAttr(x.t,'tfin')}><td><strong>${esc(x.t.name)}</strong></td><td>${tn(x.l.type)}</td><td>${daDate(x.date)}</td>${daNum(usd(x.amt)+(x.cur!=='USD'?` <span class="muted small">(${x.cur} ${Math.round(x.native).toLocaleString('en-US')})</span>`:''))}<td>${daOpen(x.t,'tfin')}</td></tr>`).join(''),daMore(items.length-CAP,'finance',L('לכל הכספים','Open Finance')))};}
  /* default: ar30 */
  const a=daArNext30();
  return {title:L('לגבייה ב-30 הימים הקרובים','To collect in the next 30 days'),sum:usd(a.total),page:'finance',
    body:tbl([[L('קבוצת חיוב','Billing group')],[L('טיול','Trip')],[L('סוג','Type')],[L('מועד','Due')],[L('סכום','Amount'),'n'],['']],
      a.items.slice(0,CAP).map(x=>`<tr ${daRowAttr(x.t,'income')}><td><strong>${esc(x.row.name)}</strong></td><td>${esc(x.t.name)}</td><td>${daKind(x.kind)}</td><td>${fmtDate(x.due)}<div class="small muted">${x.days===0?L('היום','Today'):L(`בעוד ${x.days} ימים`,`in ${x.days} ${PLN(x.days,'day','days')}`)}</div></td>${daNum(usd(x.amt))}<td>${daOpen(x.t,'income')}</td></tr>`).join(''),daMore(a.n-CAP,'finance',L('לכל הכספים','Open Finance')))};
}

/* receivables by client: overdue in three buckets (portfolio().aging rule) plus what falls due in 30 days */
function daArByClient(){
  const o=daOverdue(),a=daArNext30(),by={};
  const row=c=>by[c]||(by[c]={client:c,b:[0,0,0],late:0,next:0,trips:{}});
  o.groups.forEach(x=>{const r=row(x.t.client),bi=x.g.days<=30?0:x.g.days<=60?1:2;r.b[bi]=r2(r.b[bi]+x.g.late);r.late=r2(r.late+x.g.late);r.trips[x.t.id]=(r.trips[x.t.id]||0)+x.g.late;});
  a.items.forEach(x=>{const r=row(x.t.client);r.next=r2(r.next+x.amt);if(!r.trips[x.t.id])r.trips[x.t.id]=0;});
  const rows=Object.values(by).sort((x,y)=>y.late-x.late||y.next-x.next);
  rows.forEach(r=>{r.t=byId(Object.keys(r.trips).sort((p,q)=>r.trips[q]-r.trips[p])[0]);});
  return {rows,o,a};
}

function daHero(P,ar,od,bills,G,cm){
  const first=String(userName()).split(' ')[0],day=TODAY.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const rest=Math.max(0,r2(P.outstanding-od.total-ar.total)),tot=Math.max(1,P.rev);
  const seg=[[P.col,'#5BE49B',L('התקבל','Collected')],[od.total,'#FFAB00',L('באיחור','Overdue')],[ar.total,'#68CDF9',L('לגבייה ב-30 יום','Due in 30 days')],[rest,'#C684FF',L('מאוחר יותר','Later')]];
  const nx=daArNext30().items[0];
  const tile=(k,cls,lab,val,sub,c,i)=>`<button class="hp-st da-t${S.daDet===k?' on':''}" data-act="${k==='gaps'?'go':'da-det'}" data-v="${k==='gaps'?'gaps':k}" style="--c:${c};--d:${i*70}ms" aria-pressed="${S.daDet===k}"><span class="hp-k"><i></i>${lab}</span><b>${val}</b><small>${sub}</small></button>`;
  const tiles=[tile('ar30','',L('לגבייה ב-30 יום','Cash to collect, 30 days'),usd(ar.total),L(`${ar.n} תשלומים צפויים`,`${ar.n} ${PLN(ar.n,'installment','installments')} due`),'#68CDF9',0),
    tile('overdue','',L('חובות לקוחות באיחור','Overdue receivables'),usd(od.total),L(`${od.n} קבוצות חיוב`,`${od.n} ${PLN(od.n,'billing group','billing groups')}`),'#FFAB00',1),
    tile('bills','',L('חשבוניות ספק לאישור','Supplier bills to approve'),usd(bills.total),L(`${bills.n} חשבוניות מותאמות`,`${bills.n} matched ${PLN(bills.n,'bill','bills')}`),'#C684FF',2),
    tile('gaps','',L('פערים פתוחים מול ספקים','Open supplier gaps'),usd(r2(G.open+G.disp)),L(`${G.openN+G.dispN} פערים`,`${G.openN+G.dispN} ${(G.openN+G.dispN)===1?'gap':'gaps'}`),'#FFC145',3),
    tile('comm','',L('עמלות לגבייה','Commission receivable'),usd(cm.total),L(`${cm.n} שורות`,`${cm.n} ${PLN(cm.n,'line','lines')}`),'#5BE49B',4)].join('');
  return `<section class="hp da-hero${typeof hpAnim==='function'&&hpAnim()?' anim':''}" aria-label="${L('תמונת מצב כספית','Finance overview')}">
   <div class="hp-top"><div class="hp-hi"><span class="hp-eye">${day}</span><h1>${L('שלום','Hello')}, ${esc(first)}</h1>
     <p>${L(`${P.rows.length} תיקים בחיוב`,`${P.rows.length} ${PLN(P.rows.length,'file','files')} in billing`)} · ${L(`${P.pax} נוסעים`,`${P.pax} ${PLN(P.pax,'traveler','travelers')}`)}${nx?` · ${L('התשלום הבא מלקוח','next client payment')}: <a href="#" data-act="open" data-v="${nx.t.id}" data-pt="income">${esc(nx.row.name)}</a> ${L(nx.days===0?'היום':`בעוד ${nx.days} ימים`,nx.days===0?'today':`in ${nx.days} ${PLN(nx.days,'day','days')}`)}`:''}</p></div>
    <div class="hp-kpi"><div><span>${L('הכנסות שהוזמנו','Booked revenue')}</span><b>${usd(P.rev)}</b></div><div><span>${L('התקבל','Collected')}</span><b>${usd(P.col)}</b><em>${P.rev?pct(P.col/P.rev):''}</em></div><div><span>${L('יתרה לגבייה','Outstanding')}</span><b>${usd(P.outstanding)}</b></div></div></div>
   <div class="hp-bar" role="img" aria-label="${seg.map(x=>x[2]+' '+usd(x[0])).join(', ')}">${seg.map(x=>`<i style="--w:${(x[0]/tot*100).toFixed(2)}%;--c:${x[1]}" title="${x[2]}: ${usd(x[0])}"></i>`).join('')}</div>
   <div class="da-leg">${seg.map(x=>`<span><i style="background:${x[1]}"></i>${x[2]} <b>${usd(x[0])}</b></span>`).join('')}</div>
   <div class="hp-grid da-grid">${tiles}</div></section>`;
}

function daApCard(){
  const w=daApWeeks(8),W=400,H=170,top=22,bot=28,ch=H-top-bot,gw=W/8,bw=26;
  const bars=w.weeks.map((x,i)=>{const hh=Math.max(x.total>0?4:0,ch*x.total/w.max),cx=gw*i+gw/2,y=top+ch-hh,sel=S.daWk===i;
    return `<g class="da-bar${sel?' on':''}" data-act="da-wk" data-v="${i}" tabindex="0" role="button" aria-label="${daDate(x.from)}: ${usd(x.total)}"><rect class="hit" x="${(cx-gw/2).toFixed(1)}" y="0" width="${gw.toFixed(1)}" height="${H}"/><rect class="b" x="${(cx-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw}" height="${hh.toFixed(1)}" rx="6"/><text class="v" x="${cx.toFixed(1)}" y="${(y-6).toFixed(1)}">${x.total>=1000?Math.round(x.total/1000)+'k':Math.round(x.total)}</text><text class="x" x="${cx.toFixed(1)}" y="${H-9}">${daDate(x.from)}</text></g>`;}).join('');
  const cur=Object.keys(w.weeks.reduce((a,x)=>({...a,...x.byCur}),{}));
  const rows=w.weeks.filter(x=>x.n).map(x=>`<tr class="da-row${S.daWk===x.i?' on':''}" data-act="da-wk" data-v="${x.i}"><td>${daDate(x.from)} - ${daDate(x.to)}</td><td class="n">${x.n}</td>${daNum(usd(x.total))}<td class="small muted">${Object.keys(x.byCur).map(c=>`${c} ${Math.round(x.byCur[c]).toLocaleString('en-US')}`).join(' · ')}</td></tr>`).join('');
  return `<div class="card da-card"><div class="da-h"><h3>${L('לוח תשלומים לספקים, 8 שבועות','Supplier payments, next 8 weeks')}</h3><span class="da-sum">${usd(w.total)}</span></div>
   <svg class="da-ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('תשלומים לספקים לפי שבוע','Supplier payments by week')}"><g class="g"><line x1="0" x2="${W}" y1="${top+ch}" y2="${top+ch}"/></g>${bars}</svg>
   <div class="scroll"><table class="tbl da-tbl"><thead><tr><th>${L('שבוע','Week')}</th><th class="n">${L('שורות','Lines')}</th><th class="n">${L('סכום','Amount')}</th><th>${cur.length?L('במטבע מקור','In source currency'):''}</th></tr></thead><tbody>${rows||`<tr><td colspan="4" class="muted">${L('אין תשלומים.','No payments.')}</td></tr>`}</tbody></table></div>
   <p class="small muted da-note">${L('תאריך התשלום: סגירה כספית 20 יום מהיום, תפעול 14 יום לפני היציאה. תאריכים שעברו נספרים בשבוע הנוכחי.','Pay date: financial close 20 days from today, operations 14 days before departure. Past dates count in this week.')}${w.later>0?` ${L(`אחרי 8 שבועות: ${usd(w.later)}.`,`After week 8: ${usd(w.later)}.`)}`:''}</p></div>`;
}

function daArCard(){
  const x=daArByClient(),tot=x.rows.reduce((a,r)=>({b:a.b.map((v,i)=>r2(v+r.b[i])),late:r2(a.late+r.late),next:r2(a.next+r.next)}),{b:[0,0,0],late:0,next:0});
  const body=x.rows.map(r=>`<tr ${daRowAttr(r.t,'income')}><td><strong>${esc(r.client)}</strong></td>${r.b.map(v=>daNum(v?usd(v):'-')).join('')}${daNum(r.late?usd(r.late):'-',r.late?'neg':'')}${daNum(r.next?usd(r.next):'-')}</tr>`).join('');
  return `<div class="card da-card"><div class="da-h"><h3>${L('חייבים לפי לקוח','Receivables by client')}</h3><span class="da-sum">${usd(r2(tot.late+tot.next))}</span></div>
   <div class="scroll"><table class="tbl da-tbl"><thead><tr><th>${L('לקוח','Client')}</th><th class="n">${L('1-30 יום','1-30 d')}</th><th class="n">${L('31-60 יום','31-60 d')}</th><th class="n">${L('מעל 60','60+ d')}</th><th class="n">${L('באיחור','Overdue')}</th><th class="n">${L('ב-30 יום','Next 30 d')}</th></tr></thead>
   <tbody>${body||`<tr><td colspan="6" class="muted">${L('אין חובות פתוחים.','No open balances.')}</td></tr>`}</tbody>
   <tfoot><tr><th>${L('סך הכל','Total')}</th>${tot.b.map(v=>`<th class="n">${usd(v)}</th>`).join('')}<th class="n">${usd(tot.late)}</th><th class="n">${usd(tot.next)}</th></tr></tfoot></table></div></div>`;
}

function daDocsCard(){
  const d=daDocsToIssue(),CAP=5;
  return `<div class="card da-card"><div class="da-h"><h3>${L('מסמכים להפקה','Documents to issue')}</h3><span class="da-sum">${d.n}</span></div>
   <p class="small muted da-note">${L('חשבוניות עסקה לתשלומי לקוחות שמועדם בתוך 30 יום או שעבר.','Deal invoices for client installments due within 30 days or already past due.')}</p>
   ${d.items.slice(0,CAP).map(x=>`<div class="da-li"><div><strong>${esc(x.d.name)}</strong><div class="small muted">${esc(x.t.name)} · ${daKind(x.d.kind)} · ${fmtDate(x.d.date)}</div></div><span class="da-amt">${usd(x.amt)}</span><button class="btn sm pri" data-act="da-issue" data-v="${x.key}" ${canIssueDocs()?'':`disabled title="${L('התפקיד שלך לא כולל הפקת מסמכים','Your role cannot issue documents')}"`}>${L('הפק','Issue')}</button></div>`).join('')||`<p class="muted">${L('כל המסמכים הופקו.','Everything is issued.')}</p>`}
   <div class="da-more">${d.n>CAP?`<span class="muted small">${L(`ועוד ${d.n-CAP}`,`and ${d.n-CAP} more`)}</span>`:'<span></span>'}<button class="btn sm" data-act="da-det" data-v="docs">${L('לכל המסמכים','See all')}</button></div></div>`;
}

function daFxCard(){
  const f=daFxExposure();
  return `<div class="card da-card"><div class="da-h"><h3>${L('חשיפה למט״ח','Foreign-currency exposure')}</h3><span class="da-sum">${usd(f.total)}</span></div>
   <p class="small muted da-note">${L('חובות פתוחים לספקים במטבע זר, לפי השער הננעל של כל טיול.','Open supplier payables in a foreign currency, at each trip\'s locked rate.')}</p>
   ${f.rows.map(r=>`<button class="da-li da-btn" data-act="go" data-v="finance"><div><strong>${r.cur}</strong><div class="small muted">${Math.round(r.amt).toLocaleString('en-US')} ${r.cur}</div></div><span class="da-amt">${usd(r.usd)}</span><span class="da-go">${ic('chev','flip')}</span></button>`).join('')||`<p class="muted">${L('אין חשיפה למט״ח.','No foreign-currency exposure.')}</p>`}</div>`;
}

function daSyncCard(){
  const a=S.acct,on=typeof ACCT!=='undefined'&&a&&a.phase==='synced'&&a.sys,ok=typeof can!=='function'||can('fin.sync');
  if(on){const s=acStats(),k=a.sys,log=(a.log||[]).slice(0,3);
    return `<div class="card da-card"><div class="da-h"><h3>${L('סנכרון הנהלת חשבונות','Accounting sync')}</h3>${PILOT()}</div>
     <div class="row da-sync">${acBadge(k)}<div><strong>${an(k)}</strong><div class="small muted">${L(`${s.bills} חשבוניות סונכרנו, ${s.matched} תואמות`,`${s.bills} ${PLN(s.bills,'bill','bills')} synced, ${s.matched} matched`)}</div></div></div>
     ${log.map(e=>`<div class="da-li"><div><strong>${esc(e.t)}</strong><div class="small muted">${esc(e.no||'')}</div></div><span class="da-amt">${usd(e.amt)}</span></div>`).join('')}
     ${ok?`<div class="da-more"><span></span><button class="btn sm" data-act="go" data-v="books">${L('ליומן הסנכרון','Open sync log')}</button></div>`:''}</div>`;}
  return `<div class="card da-card"><div class="da-h"><h3>${L('סנכרון הנהלת חשבונות','Accounting sync')}</h3>${PILOT()}</div>
   <p class="muted">${L('חברו את מערכת הנהלת החשבונות כדי שחשבוניות ספק יתאימו לשורות ההצעה ויירשמו אוטומטית.','Connect your accounting system so supplier bills match quote lines and post automatically.')}</p>
   ${ok?`<button class="btn pri" data-act="go" data-v="books">${ic('plug')} ${L('חיבור הנהלת חשבונות','Connect accounting')}</button>`:`<p class="small muted">${L('החיבור דורש הרשאת סנכרון.','Connecting needs the sync permission.')}</p>`}</div>`;
}

function daMonthCard(){
  const m=daMonthEnd(),dn=m.filter(x=>x.done).length;
  return `<div class="card da-card"><div class="da-h"><h3>${L('רשימת סגירת חודש','Month-end checklist')}</h3><span class="da-sum">${dn}/${m.length}</span></div>
   <div class="da-prog"><i style="width:${(dn/m.length*100).toFixed(0)}%"></i></div>
   ${m.map(x=>`<button class="da-li da-btn da-ck${x.done?' done':''}" data-act="${x.act}" data-v="${x.v}"><span class="da-tick">${x.done?ic('check'):''}</span><div><strong>${L(x.he,x.en)}</strong>${x.done?'':`<div class="small muted">${x.total?usd(x.total)+' · ':''}${x.count}</div>`}</div><span class="da-go">${ic('chev','flip')}</span></button>`).join('')}</div>`;
}

function dbAcct(){
  const ts=visibleTrips();if(!ts.length)return noTrip();
  const P=portfolio(ts),G=gapStats(ts),ar=daArNext30(),od=daOverdue(),bills=daBillsToApprove(),cm=daCommReceivable();
  const dt=daDetail(S.daDet);
  return `${daHero(P,ar,od,bills,G,cm)}
  <div class="card da-card da-det"><div class="da-h"><h3>${dt.title}</h3><span class="da-sum">${dt.sum}</span></div>${dt.body}</div>
  ${daArCard()}
  <div class="two">${daApCard()}${daFxCard()}</div>
  <div class="two">${daDocsCard()}${daSyncCard()}</div>
  ${daMonthCard()}`;
}
{const h0=VIEWS.home;VIEWS.home=function(){return isAcct()?dbAcct():h0.apply(this,arguments);};}

/* ---------- tests ---------- */
TESTS.push({name:'da accountant dashboard',run:h=>{const out=[];
  const role0=S.role,lang0=S.lang;S.role='accountant';
  const sum=a=>r2(a.reduce((s,x)=>s+x,0));
  /* AR next 30: independent recomputation from groupsCalc rows */
  {let exp=0,n=0;const lo=TODAY.getTime(),hi=lo+30*DAY+3600e3;
    visibleTrips().forEach(t=>{if(t.stage==='Quote')return;groupsCalc(t).rows.forEach(r=>{
      if(!r.depPaid){const d=D(t.depDue).getTime();if(d>=lo&&d<=hi){exp+=r.dep;n++;}}
      if(!r.balPaid){const d=D(t.balDue).getTime();if(d>=lo&&d<=hi){exp+=r.bal;n++;}}});});
    const a=daArNext30();if(Math.abs(a.total-r2(exp))>.02||a.n!==n)out.push(`AR30 ${a.total}/${a.n} vs ${r2(exp)}/${n}`);
    if(!(a.total>0))out.push('AR30 is empty (demo data should have installments due)');
    if(Math.abs(sum(a.items.map(x=>x.amt))-a.total)>.02)out.push('AR30 items do not sum');}
  /* overdue = sum of portfolio aging; buckets add up; AR-by-client table ties */
  {const P=portfolio(visibleTrips()),o=daOverdue(),ag=sum(P.aging);
    if(Math.abs(o.total-ag)>.02)out.push(`overdue ${o.total} vs aging ${ag}`);
    if(Math.abs(o.total-P.late)>.02)out.push(`overdue ${o.total} vs P.late ${P.late}`);
    if(o.buckets.length!==3||Math.abs(sum(o.buckets.map(b=>b.amt))-o.total)>.02)out.push('overdue buckets');
    const c=daArByClient();if(Math.abs(sum(c.rows.map(r=>r.late))-o.total)>.02||Math.abs(sum(c.rows.map(r=>r.next))-daArNext30().total)>.02)out.push('AR by client does not tie');}
  /* AP weeks: independent sum per A19 */
  {const w=daApWeeks(8);let exp=0,expAll=0,expCash=0;
    visibleTrips().forEach(t=>{if(t.stage==='Quote')return;
      const late=t.stage==='Finance'||t.stage==='Closed',dep=D(t.dep).getTime();
      const days=late?20:Math.round((dep-14*DAY-TODAY.getTime())/DAY),wk=Math.floor(Math.max(0,days)/7);
      t.lines.forEach(l=>{const paid=l.inv&&l.inv.paid;if(paid)return;
        const amt=(l.inv?l.inv.amt-(l.inv.credit||0):l.qty*l.cost)*(l.cur==='USD'?1:t.rate);
        expAll+=amt;if(wk<8)exp+=amt;});});
    const P=portfolio(visibleTrips());Object.keys(P.cash).forEach(k=>{expCash+=P.cash[k].out;});
    if(Math.abs(w.total-r2(exp))>.05)out.push(`AP weeks ${w.total} vs ${r2(exp)}`);
    if(Math.abs(w.all-r2(expAll))>.05)out.push(`AP all ${w.all} vs ${r2(expAll)}`);
    if(Math.abs(w.all-r2(expCash))>.05)out.push(`AP all ${w.all} vs portfolio cash out ${r2(expCash)}`);
    if(Math.abs(sum(w.weeks.map(x=>x.total))-w.total)>.02||w.weeks.length!==8)out.push('AP weeks do not sum');
    if(!(w.total>0))out.push('AP weeks empty');}
  /* bills, docs, fx, commission */
  {const b=daBillsToApprove();let n=0,s=0;visibleTrips().forEach(t=>{if(t.stage==='Quote')return;t.lines.forEach(l=>{if(l.inv&&!l.inv.paid&&invStatus(l).k==='match'){n++;s+=effAmt(l.inv)*lrate(t,l);}});});
    if(b.n!==n||Math.abs(b.total-r2(s))>.05)out.push(`bills ${b.n}/${b.total} vs ${n}/${r2(s)}`);
    if(b.n){const k=b.items[0].key;daApprove(k);const b2=daBillsToApprove();if(b2.n!==b.n-1)out.push('approve did not remove a bill');DA_STATE.ap=[];}
    const d=daDocsToIssue();if(d.n){const k=d.items[0].key;daIssue(k);if(daDocsToIssue().n!==d.n-1)out.push('issue did not remove a doc');DA_STATE.iss=[];}
    const f=daFxExposure(),P=portfolio(visibleTrips());if(Math.abs(f.total-sum(Object.keys(P.fxExp).map(c=>P.fxExp[c].usd)))>.02)out.push('fx total');
    const cm=daCommReceivable(),M=leakModel(visibleTrips());if(Math.abs(cm.total-M.comm)>.02||Math.abs(sum(cm.rows.map(r=>r.amt))-cm.total)>.02)out.push('commission total');
    const me=daMonthEnd();if(me.length!==8)out.push('month-end items');}
  /* render in both languages for accountant, manager and one agent */
  const stateKeys=['ar30','overdue','bills','comm','docs','ap'];
  for(const lang of ['en','he']){S.lang=lang;
    S.role='accountant';stateKeys.forEach(k=>{S.daDet=k;S.daWk=k==='ap'?1:-1;const html=VIEWS.home();h.chk(html,'da '+lang+' '+k);if(lang==='en')h.scan(html,'da '+k);
      if(!html.includes('da-hero'))out.push('accountant home lacks da-hero '+k);});
    S.daDet='ar30';S.daWk=-1;
    const s0=S.acct;S.acct={sys:'qbo',phase:'synced',step:-1,opt:{auto:true,tag:true,credit:true},log:[{k:'import',t:'Test trip',sup:'X',no:'INV-1',amt:100}]};
    {const html=VIEWS.home();h.chk(html,'da synced '+lang);if(lang==='en')h.scan(html,'da synced');if(!html.includes('QuickBooks')&&lang==='en')out.push('sync card missing system');}
    S.acct=s0;
    S.role='manager';{const html=VIEWS.home();h.chk(html,'mgr home '+lang);if(!html.includes('ptiles'))out.push('manager home lost ptiles');if(html.includes('da-hero'))out.push('manager sees accountant home');}
    S.role=AGENTS[0];{const html=VIEWS.home();h.chk(html,'agent home '+lang);if(html.includes('da-hero'))out.push('agent sees accountant home');}}
  S.role=role0;S.lang=lang0;S.daDet='ar30';S.daWk=-1;DA_STATE.ap=[];DA_STATE.iss=[];
  return out;}});
