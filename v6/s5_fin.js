
/* ---------- trip invoice check ---------- */
function hbar(label,a,b,mx,tail){return `<div class="hbar"><span>${label}</span><div><div class="t"><div style="width:${Math.max(0,a/mx*100)}%;background:var(--muted);opacity:.55"></div></div><div class="t"><div style="width:${Math.max(0,b/mx*100)}%;background:var(--teal)"></div></div></div><span class="small hv">${tail||usd(a)+' / '+usd(b)}</span></div>`;}
const gkey=(t,l)=>t.id+'|'+l.id;
function disputeMail(t,l){
  const i=l.inv,s=invStatus(l),diff=s.diff,mm=v=>money(v,l.cur,2),ex=S.lang==='en'?gapExplain(t,l):(()=>{const k=S.lang;S.lang='en';const e=gapExplain(t,l);S.lang=k;return e;})();
  return `Subject: Invoice ${i.no} - request for a credit note\n\nHello ${l.sup} team,\n\nThank you for hosting ${t.client} (${t.name}, ${D(t.dep).toLocaleDateString('en-US')} - ${D(endOf(t)).toLocaleDateString('en-US')}). Reviewing invoice ${i.no} against our confirmed booking, we found a difference:\n\n- ${ex.replace(/&quot;/g,'"')}\n- Contracted: ${mm(planC(l))}. Invoiced: ${mm(i.amt)}. Difference: ${mm(diff)}.\n\nCould you please issue a credit note for ${mm(diff)} or send a corrected invoice? We are happy to share the signed contract and the final rooming list.\n\nThank you,\n${AGE[t.agent]}\n${AGENCY}, ${AGENCY_CITY}`;
}
/* one-line money verdict at the top of a gap card, with the key figure colored */
function gapLead(x,st){
  const a=usd(Math.abs(x.orig));
  if(st==='credited')return L(`${hlPos(usd(x.usd))} הוחזרו מהספק.`,`${hlPos(usd(x.usd))} recovered from the supplier.`);
  if(x.orig<=0)return L(`החשבונית נמוכה מההצעה ב-${hlPos(a)}.`,`Invoice is ${hlPos(a)} below the quote.`);
  if(st==='disputed')return L(`${hlWarn(a)} בדרישת זיכוי, ממתינים לספק.`,`${hlWarn(a)} in dispute, waiting on the supplier.`);
  if(st==='accepted')return L(`החיוב של ${hlWarn(a)} אושר.`,`Charge of ${hlWarn(a)} accepted.`);
  return L(`חויבתם ${hlNeg(a)} מעל ההצעה.`,`Billed ${hlNeg(a)} above the quote.`);
}
function gapCard(t,x){
  const l=x.l,s=x.s,k=kindOf(l,s),key=gkey(t,l),st=s.k==='credited'?'credited':s.st;
  let acts='';
  if(s.k==='gap'&&s.diff<0)acts=st==='open'?`<button class="btn sm" data-act="gapacc" data-v="${key}">${ic('check')} ${L('בדקתי, הכל כלול','Checked, nothing missing')}</button>`:'';
  else if(st==='open')acts=`<button class="btn sm pri" data-act="gapdisp" data-v="${key}">${ic('mail')} ${L('נסח דרישת זיכוי','Draft dispute')}</button><button class="btn sm" data-act="gapacc" data-v="${key}">${L('אשר את החיוב','Accept charge')}</button>`;
  else if(st==='disputed')acts=`<button class="btn sm grn" data-act="gapcred" data-v="${key}">${ic('check')} ${L('התקבל זיכוי','Credit received')}</button><button class="btn sm" data-act="gapdisp" data-v="${key}">${L('הצג את המייל','View email')}</button><button class="btn sm" data-act="gapacc" data-v="${key}">${L('אשר את החיוב','Accept charge')}</button>`;
  else if(st==='credited')acts=`<span class="pos" style="font-weight:600">${L('הוחזרו','Recovered')} ${usd(x.usd,2)}</span>`;
  const mail=S.disp===key?`<div class="disp"><pre class="mail">${esc(disputeMail(t,l))}</pre><div class="row"><button class="btn sm" data-act="copydisp" data-v="${key}">${L('העתק','Copy')}</button>${st==='open'?`<button class="btn sm pri" data-act="gapsent" data-v="${key}">${L('סמן כנשלח','Mark as sent')}</button>`:''}<button class="btn sm" data-act="gapdisp" data-v="">${L('סגור','Close')}</button></div></div>`:'';
  return `<div class="gapc st-${st}"><div class="gh"><div><strong>${esc(l.sup)}</strong> <span class="small muted">· ${esc(l.inv.no)}</span><div class="small">${esc(l.name)}</div></div><div class="row" style="gap:6px">${kindPill(k)}${gstPill(st)}</div></div>
    <p class="gl-lead">${gapLead(x,st)}</p><p>${gapExplain(t,l)}</p>
    <div class="nums"><span>${L('בהצעה','Quoted')} <b>${money(planC(l),l.cur)}</b></span><span>${L('בחשבונית','Invoiced')} <b>${money(l.inv.amt,l.cur)}</b></span><span>${L('פער','Gap')} <b class="${x.orig>0?'neg':'pos'}">${sgn(x.orig,v=>usd(v))}</b></span></div>
    <div class="row">${acts}</div>${mail}</div>`;
}
function pTripFin(t){
  const c=calc(t);
  if(t.stage==='Quote')return `<div class="stats"><div class="stat"><div class="l">${L('מחיר מתוכנן','Planned price')}</div><div class="v">${usd(c.rev)}</div></div><div class="stat"><div class="l">${L('רווח מתוכנן','Planned profit')}</div><div class="v">${usd(c.planProfit)}</div><div class="s">${pct(c.planProfit/c.rev)}</div></div><div class="stat"><div class="l">${L('עמלת ספקים צפויה','Expected supplier commission')}</div><div class="v">${usd(c.comm)}</div></div></div>${gate(t,L('בקרת החשבוניות','Invoice check'))}`;
  const g=groupsCalc(t),gaps=tripGaps(t);
  const open=gaps.filter(x=>isOpenGap(x.s)&&x.usd>0),openAmt=r2(open.reduce((a,x)=>a+x.usd,0));
  const rec=gaps.filter(x=>x.s.k==='credited'),recAmt=r2(rec.reduce((a,x)=>a+x.usd,0));
  const recvN=t.lines.filter(l=>!l.extra&&l.inv).length,expN=t.lines.filter(l=>!l.extra).length,extraN=t.lines.filter(l=>l.extra).length;
  const rd=S.reading&&S.reading.tid===t.id?S.reading:null;
  let inbox='';
  if(t.inbox.length||rd){
    const files=[...(rd?rd.done.map(d=>({file:d.file,done:d})):[]),...t.inbox.map((f,i)=>({file:f.file,cur:!!rd&&i===0}))];
    inbox=`<div class="card sec inbox" id="inbox"><div class="row" style="justify-content:space-between"><div><h3 style="margin:0">${ic('inbox')} ${L('חשבוניות ספקים חדשות','New supplier invoices')}</h3><div class="small muted">${L('התקבלו בתיבה','Arrived at')} <bdi>${AGENCY_MAIL}</bdi></div></div><button class="btn pri" data-act="readinv" data-v="${t.id}" ${rd?'disabled':''}>${rd?L('קוראת...','Reading...'):ic('magic')+' '+L('קרא והתאם חשבוניות','Read & match invoices')}</button></div>
     <div class="files">${files.map(f=>`<div class="file ${f.done?'ok':f.cur?'cur':''}"><span class="fi">PDF</span><span class="fn">${esc(f.file)}</span><span class="small">${f.done?(f.done.gaps?`<span class="neg">${L(f.done.lines+' שורות',plE(f.done.lines,'line','lines'))}, ${L(f.done.gaps===1?'פער אחד':f.done.gaps+' פערים',plE(f.done.gaps,'gap','gaps'))}</span>`:`<span class="pos">${ic('check')} ${L(f.done.lines===1?'שורה תואמת':f.done.lines+' שורות תואמות',f.done.lines===1?'1 line matches':f.done.lines+' lines match')}</span>`):f.cur?L('קורא ומתאים לשורות ההצעה...','Reading and matching to quote lines...'):L('ממתין','Waiting')}</span></div>`).join('')}</div>
     <p class="small muted" style="margin:10px 0 0">${L('בדמו נקראות חשבוניות לדוגמה. במוצר הן נקראות מהמייל או מהעלאה ידנית.','The demo reads sample invoices. In the product they are read from email or a manual upload.')}</p></div>`;
  }
  const lm=S.lastMatch[t.id],m0=c.fcProfit/c.rev,m1=(c.fcProfit+openAmt)/c.rev;
  const banner=lm&&!t.inbox.length&&!rd?`<div class="banner ${open.length?'bad':'good'}"><strong>${L(`${lm.files} חשבוניות נקראו תוך שניות.`,`${lm.files} invoices read in seconds.`)}</strong> ${open.length?L(`נמצאו ${open.length} פערים פתוחים בסך ${usd(openAmt)}. אם יזוכו, שולי הרווח יחזרו מ-${pct(m0)} ל-${pct(m1)}.`,`${open.length} open gaps worth ${usd(openAmt)}. If they are credited, this trip's margin goes back from ${pct(m0)} to ${pct(m1)}.`):L('כל הפערים טופלו.','Every gap is handled.')}</div>`:'';
  const order=x=>{const st=x.s.k==='credited'?3:x.s.st==='open'?(x.usd>0?0:2):x.s.st==='disputed'?1:2;return st;};
  const cards=gaps.slice().sort((a,b)=>order(a)-order(b)||b.usd-a.usd).map(x=>gapCard(t,x)).join('');
  const ib=inboxIds(t),missing=t.lines.filter(l=>!l.extra&&!l.inv&&!ib.has(l.id));
  const miss=missing.length&&(t.stage==='Finance'||t.stage==='Closed')?`<div class="card sec"><h3>${L('חשבוניות חסרות','Missing invoices')} ${pillF(missing.length,'amber')}</h3>${missing.map(l=>`<div class="alert"><div><strong>${esc(l.sup)}</strong> · ${esc(l.name)}<div class="small muted">${L('צפוי','Expected')} ${money(planC(l),l.cur)}. ${gapExplain(t,l)}</div></div><button class="btn sm" data-act="toast" data-v="${L('בקשה לחשבונית נשלחה לספק','Invoice request sent to the supplier')}">${L('בקש חשבונית','Request invoice')}</button></div>`).join('')}</div>`:'';
  const mx=Math.max(...Object.values(c.byType).map(b=>Math.max(b.plan,b.fc)),1);
  const types=Object.keys(c.byType).map(k=>hbar(tn(k),c.byType[k].plan,c.byType[k].fc,mx)).join('');
  const inv=c.lines.map(x=>{const l=x.l,s=invStatus(l),k=kindOf(l,s);
    const pill=s.k==='match'?pillF(L('תואם','Match'),'green'):s.k==='credited'?pillF(L('זוכה','Credited'),'green'):s.k==='none'?pillF(L('אין חשבונית','No invoice'),'amber'):kindPill(k);
    return `<tr><td>${esc(l.sup)}</td><td>${esc(l.name)}</td><td class="n">${money(planC(l),l.cur)}</td><td class="n">${l.inv?money(l.inv.amt,l.cur):'-'}</td><td>${pill}</td><td class="small">${!l.inv?'-':l.inv.paid?(l.cur==='USD'?L('שולם','Paid'):L('שולם בשער ','Paid at rate ')+l.inv.rate):L('טרם שולם','Not paid yet')}</td></tr>`;}).join('');
  const dg=Math.min(S.docGroup,g.rows.length-1),r=g.rows[dg];
  let doc;
  if(S.docMode==='pay')doc=`<div class="doc" style="padding:20px"><div class="row" style="justify-content:space-between"><strong>Payment request</strong><span>${AGENCY} (fictional)</span></div>
    <p style="margin:10px 0 0">For: ${esc(r.name)} (${r.size} traveler${r.size>1?'s':''})<br>Trip: ${esc(t.name)}, departing ${D(t.dep).toLocaleDateString('en-US')}</p>
    <table><tr><td>Deposit, ${t.pct}%, due ${D(t.depDue).toLocaleDateString('en-US')}</td><td>${usd(r.dep,2)}</td></tr><tr><td>Balance, due ${D(t.balDue).toLocaleDateString('en-US')}</td><td>${usd(r.bal,2)}</td></tr><tr><td><strong>Total, USD</strong></td><td><strong>${usd(r.amt,2)}</strong></td></tr></table><p class="small" style="color:#555;margin:0">Sample layout. Sales tax is not modeled in this demo.</p></div>`;
  else{const sp=t.sups[Math.min(S.msgSup,t.sups.length-1)],ln=t.lines.find(l=>l.id===sp.line);
    doc=`<div class="doc" style="padding:20px"><div class="row" style="justify-content:space-between"><strong>Supplier voucher</strong><span>No. V-${t.no}-${ln.id}</span></div>
    <p style="margin:10px 0 0">To: ${esc(sp.n)}<br>Group: ${esc(t.client)}, ${t.pax} travelers, arriving ${D(t.dep).toLocaleDateString('en-US')}</p>
    <table><tr><td>Service</td><td>${esc(ln.name)}</td></tr><tr><td>Quantity</td><td>${ln.qty} ${ln.unit}</td></tr><tr><td>Agreed cost</td><td>${money(planC(ln),ln.cur)}</td></tr></table><p class="small" style="color:#555;margin:0">Present this voucher on arrival. Sample layout.</p></div>`;}
  const wf=(l,v,cls)=>`<tr><td>${l}</td><td class="n ${cls||''}">${v}</td></tr>`;
  return master(t)+inbox+banner+`
  <div class="stats"><div class="stat"><div class="l">${L('חשבוניות שהתקבלו','Invoices received')}</div><div class="v">${recvN}/${expN}</div><div class="s">${L('שורות הצעה','quote lines')}${extraN?`, +${extraN} ${L('חיובים נוספים','extra charges')}`:''}</div></div>
   <div class="stat"><div class="l">${L('פערים פתוחים','Open gaps')}</div><div class="v ${openAmt>0?'neg':''}">${usd(openAmt)}</div><div class="s">${open.length} ${L('פערים',(open.length)===1?'gap':'gaps')}</div></div>
   <div class="stat"><div class="l">${L('הוחזר מספקים','Recovered')}</div><div class="v pos">${usd(recAmt)}</div><div class="s">${rec.length} ${L('זיכויים',(rec.length)===1?'credit':'credits')}</div></div>
   <div class="stat"><div class="l">${L('רווח צפוי','Expected profit')}</div><div class="v">${usd(c.fcProfit)}</div><div class="s ${c.fcProfit<c.planProfit?'neg':'pos'}">${pct(m0)} · ${L('מתוכנן','planned')} ${pct(c.planProfit/c.rev)}</div></div>
   <div class="stat"><div class="l">${L('חייבים','Receivable')}</div><div class="v">${usd(g.outstanding)}</div><div class="s">${usd(g.late)} ${L('באיחור','late')}</div></div></div>
  ${gaps.length?`<div class="sec gaps"><h3>${L('פערים בחשבוניות','Invoice gaps')} ${NEWP()}</h3><div class="gapgrid">${cards}</div></div>`:(t.inbox.length||rd?'':`<div class="card sec gaps"><p class="muted" style="margin:0">${L('אין פערים בחשבוניות שהתקבלו עד עכשיו.','No gaps in the invoices received so far.')}</p></div>`)}
  ${miss}
  <div class="two"><div class="card"><h3>${L('מרווח מתוכנן לרווח צפוי','From planned to expected profit')}</h3><table class="tbl"><tbody>${wf(L('רווח מתוכנן','Planned profit'),usd(c.planProfit,2))}${wf(L('סכומי ספקים מעל או מתחת להצעה','Supplier amounts above or below quote'),usd(-c.amtDiff,2),c.amtDiff>0?'neg':'pos')}${t.cur!=='USD'?wf(L('שער ששולם מול שער נעול','Rate paid vs locked rate'),usd(-c.fx,2),c.fx>0?'neg':'pos'):''}</tbody><tfoot><tr><td>${L('רווח צפוי','Expected profit')}</td><td class="n">${usd(c.fcProfit,2)}</td></tr></tfoot></table>
   <p class="small muted" style="margin-top:8px">${L(`הרווח המתוכנן כולל ${usd(c.comm)} עמלות ספקים צפויות.`,`Planned profit includes ${usd(c.comm)} of expected supplier commission.`)}</p>${openAmt>0?`<p class="small" style="margin-top:8px">${L(`אם הפערים הפתוחים יזוכו: ${usd(c.fcProfit+openAmt,2)} (${pct(m1)}).`,`If the open gaps are credited: ${usd(c.fcProfit+openAmt,2)} (${pct(m1)}).`)}</p>`:''}</div>
  <div class="card"><h3>${L('עלות לפי סוג','Cost by type')}</h3><div class="legend"><span><i style="background:var(--muted);opacity:.55"></i>${L('מתוכנן','Planned')}</span><span><i style="background:var(--teal)"></i>${L('צפוי','Expected')}</span></div>${types}</div></div>
  <div class="sec card"><h3>${L('התאמת חשבוניות ספקים','Supplier invoice matching')}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${L('ספק','Supplier')}</th><th>${L('שירות','Service')}</th><th class="n">${L('בהצעה','In quote')}</th><th class="n">${L('בחשבונית','In invoice')}</th><th>${L('תוצאה','Result')}</th><th>${L('תשלום','Payment')}</th></tr></thead><tbody>${inv}</tbody></table></div></div>
  <div class="card"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${L('מסמכים','Documents')}</h3><div class="row"><div class="row"><button class="btn sm ${S.docMode==='pay'?'pri':''}" data-act="dm" data-v="pay">${L('דרישת תשלום','Payment request')}</button><button class="btn sm ${S.docMode==='vch'?'pri':''}" data-act="dm" data-v="vch">${L('שובר לספק','Supplier voucher')}</button></div>
   ${S.docMode==='pay'?`<select data-ch="docgroup" aria-label="${L('משק בית','Household')}">${g.rows.map((x,i)=>`<option value="${i}" ${i===dg?'selected':''}>${esc(x.name)}</option>`).join('')}</select>`:`<select data-ch="msgsup" aria-label="${L('ספק','Supplier')}">${t.sups.map((s,i)=>`<option value="${i}" ${i===Math.min(S.msgSup,t.sups.length-1)?'selected':''}>${esc(s.n)}</option>`).join('')}</select>`}</div></div><div style="margin-top:12px">${doc}</div></div>`;
}

/* ---------- invoice check, all trips ---------- */
function vGaps(){
  const ts=visibleTrips();if(!ts.length)return noTrip();
  const G=gapStats(ts);
  const kinds=['rooms','qty','rate','comp','extra','dup','under'];
  const stOf=x=>x.s.k==='credited'?'credited':x.s.st;
  const list=G.list.filter(x=>(S.gF==='all'||(stOf(x)===S.gF&&!(S.gF==='open'&&x.usd<0&&S.gK!=='under')))&&(S.gK==='All'||kindOf(x.l,x.s)===S.gK)).sort((a,b)=>Math.abs(b.usd)-Math.abs(a.usd));
  const kmx=Math.max(...Object.values(G.byKind).map(b=>b.amt),1);
  const byKind={};G.list.forEach(x=>{if(x.orig<=0)return;const k=kindOf(x.l,x.s),b=byKind[k]||(byKind[k]={n:0,amt:0});b.n++;b.amt=r2(b.amt+x.orig);});
  const kbars=kinds.filter(k=>byKind[k]).sort((a,b)=>byKind[b].amt-byKind[a].amt).map(k=>`<div class="hbar"><span>${kindL(k)}</span><div class="t"><div style="width:${byKind[k].amt/kmx*100}%;background:var(--red);opacity:.75"></div></div><span class="small hv">${usd(byKind[k].amt)} · ${byKind[k].n}</span></div>`).join('');
  const sup=Object.entries(G.bySup).sort((a,b)=>b[1].amt-a[1].amt).slice(0,8).map(([k,v])=>`<tr><td>${esc(k)}</td><td class="n">${v.trips.size}</td><td class="n">${v.n}</td><td class="n neg">${usd(v.amt)}</td><td class="n pos">${usd(v.rec)}</td></tr>`).join('');
  const rowOf=x=>{const st=stOf(x),k=kindOf(x.l,x.s);return `<tr><td><a href="#" data-act="open" data-v="${x.t.id}" data-pt="tfin" style="color:var(--blue)">${esc(x.t.name)}</a><div class="small muted">${stn(x.t.stage)}</div></td><td>${esc(x.l.sup)}<div class="small muted">${esc(x.l.inv.no)}</div></td><td>${kindPill(k)}</td><td class="n ${x.orig>0?'neg':'pos'}">${sgn(x.orig,v=>usd(v))}</td><td>${gstPill(st)}</td></tr>`;};
  const rate=G.received?G.matched/G.received:0;
  const sel=(k,arr,v)=>`<select data-ch="${k}">${arr.map(x=>`<option value="${x[0]}" ${x[0]===v?'selected':''}>${x[1]}</option>`).join('')}</select>`;
  /* the page brief: open money first, then what is already back */
  const opens=G.list.filter(x=>stOf(x)==='open'&&x.s.k!=='credited'&&x.usd>=0).sort((a,b)=>b.usd-a.usd),nT=new Set(opens.map(x=>x.t.id)).size,big=opens[0];
  const brief=G.openN?L(`${hlWarn(usd(r2(G.open+G.disp)))} עוד אפשר להחזיר: ${G.openN} פערים פתוחים (${usd(G.open)})${G.dispN?` ו-${G.dispN} בדרישת זיכוי (${usd(G.disp)})`:''} ב-${nT} טיולים. ${hlPos(usd(G.rec))} כבר הוחזרו העונה.`,`${hlWarn(usd(r2(G.open+G.disp)))} can still be recovered: ${G.openN} open ${G.openN===1?'gap':'gaps'} (${usd(G.open)})${G.dispN?` and ${G.dispN} in dispute (${usd(G.disp)})`:''} across ${nT} ${nT===1?'trip':'trips'}. ${hlPos(usd(G.rec))} already recovered this season.`)
    :L(`אין פערים פתוחים כרגע. ${hlPos(usd(G.rec))} הוחזרו העונה${G.dispN?`, ו-${hlWarn(usd(G.disp))} ממתינים לספקים`:''}.`,`No open gaps right now. ${hlPos(usd(G.rec))} recovered this season${G.dispN?`, and ${hlWarn(usd(G.disp))} is waiting on suppliers`:''}.`);
  const ctas=[big?hcCta('mint','mail',L(`לטפל בפער הגדול, ${usd(big.usd)}`,`Work the biggest gap, ${usd(big.usd)}`),`data-act="open" data-v="${big.t.id}" data-pt="tfin"`):hcCta('mint','leaks',L('לדליפות הרווח','See profit leaks'),'data-act="go" data-v="leaks"'),
    hcCta('ghost','sync',L('סנכרון הנהלת חשבונות','Accounting sync'),'data-act="go" data-v="books"')];
  const kpis=[{lab:L('פתוחים, טרם נשלחה דרישה','Open, no dispute yet'),val:usd(G.open),sub:`${G.openN} ${L('פערים',G.openN===1?'gap':'gaps')}`,cls:'warn',act:'fn-gf',v:'open'},
    {lab:L('נשלחה דרישת זיכוי','Dispute sent'),val:usd(G.disp),sub:`${G.dispN} ${L('פערים',G.dispN===1?'gap':'gaps')}`,act:'fn-gf',v:'disputed'},
    {lab:L('הוחזר העונה','Recovered this season'),val:usd(G.rec),sub:`${G.recN} ${L('זיכויים',G.recN===1?'credit':'credits')}`,cls:'pf',act:'fn-gf',v:'credited'},
    {lab:L('חשבוניות שנקראו','Invoices read'),val:G.received,sub:`${pct(rate)} ${L('תואמות בלי מגע יד','matched with no touch')}${G.missing?` · ${G.missing} ${L('חסרות','missing')}`:''}`}];
  const lim=8,more=!S.gMore&&list.length>lim+1,rows=(more?list.slice(0,lim):list).map(rowOf).join('');
  return hcPage({eyebrow:L('כסף','Money'),title:`${L('בקרת חשבוניות','Invoice check')} ${pillF(L('חדש','New'),'green')}`,aria:L('בקרת חשבוניות','Invoice check'),cls:'stats',brief,ctas,kpis})+`
  <div class="hc-grid"><div class="hc-c12"><div class="card hc-card" id="gaps-all"><div class="hc-h"><h3>${L('כל הפערים','All gaps')} <span class="cnt">${list.length}</span></h3><div class="row">
   <label class="row small muted">${L('סטטוס','Status')} ${sel('gF',[['open',L('פתוח','Open')],['disputed',L('נשלחה דרישה','Dispute sent')],['credited',L('זוכה','Credited')],['accepted',L('אושר','Accepted')],['all',L('הכל','All')]],S.gF)}</label>
   <label class="row small muted">${L('סוג','Type')} ${sel('gK',[['All',L('הכל','All')],...kinds.map(k=>[k,kindL(k)])],S.gK)}</label></div></div>
   <p class="hc-lead">${L('כל חשבונית ספק מותאמת למה שתומחר בהצעה. פערים נמצאים לבד ונשארים במעקב עד שמתקבל זיכוי או שהחיוב מאושר.','Every supplier invoice is matched to what you quoted. Gaps are found automatically and tracked until they are credited or accepted.')}</p>
   <div class="scroll tall" style="max-height:520px"><table class="tbl"><thead><tr><th>${L('טיול','Trip')}</th><th>${L('ספק וחשבונית','Supplier and invoice')}</th><th>${L('סוג','Type')}</th><th class="n">${L('פער','Gap')}</th><th>${L('סטטוס','Status')}</th></tr></thead><tbody>${rows||`<tr><td colspan="5" class="muted">${L('אין פערים בסינון הזה.','No gaps in this filter.')}</td></tr>`}</tbody></table></div>
   ${more?`<button class="hc-more" data-act="fn-gmore">${L(`ועוד ${list.length-lim}`,`and ${list.length-lim} more`)} ${ic('chev','flip')}</button>`:''}</div></div>
  <div class="hc-c5"><div class="card hc-card"><div class="hc-h"><h3>${L('איפה הכסף בורח, לפי סוג פער','Where money leaks, by gap type')}</h3></div>${kbars||`<p class="muted">${L('אין פערים.','No gaps.')}</p>`}<p class="small muted" style="margin:6px 0 0">${L('סכום הפערים שנמצאו, כולל כאלה שכבר זוכו.','Total gaps found, including ones already credited.')}</p></div></div>
  <div class="hc-c7"><div class="card hc-card"><div class="hc-h"><h3>${L('ספקים שמחייבים ביתר','Suppliers that overbill')}</h3></div><div class="scroll"><table class="tbl"><thead><tr><th>${L('ספק','Supplier')}</th><th class="n">${L('טיולים','Trips')}</th><th class="n">${L('פערים','Gaps')}</th><th class="n">${L('חיוב ביתר','Overbilled')}</th><th class="n">${L('הוחזר','Recovered')}</th></tr></thead><tbody>${sup}</tbody></table></div></div></div></div>`;
}
/* KPI tiles drill into the filtered list; "and N more" opens the whole list */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act="fn-gf"],[data-act="fn-gmore"]');if(!b)return;
  if(b.dataset.act==='fn-gmore'){S.gMore=true;render();return;}
  S.gF=b.dataset.v;S.gK='All';S.gMore=false;S.tab='gaps';render();
  try{const el=document.getElementById('gaps-all');if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'start'});}catch(x){}
});
function vFinance(){
  let ts=visibleTrips();if(!ts.length)return noTrip();
  const segs=['All',...Object.keys(SEG)],stages=['All','Operations','Finance','Closed'],agents=['All',...AGENTS];
  ts=ts.filter(t=>(S.fSeg==='All'||t.seg===S.fSeg)&&(S.fStage==='All'||t.stage===S.fStage||t.stage==='Quote')&&(S.fAgent==='All'||t.agent===S.fAgent));
  const sel=(k,arr,v,lab)=>`<select data-ch="${k}">${arr.map(x=>`<option value="${x}" ${x===v?'selected':''}>${x==='All'?L('הכל','All'):lab(x)}</option>`).join('')}</select>`;
  const filt=`<div class="card hc-card hc-filt"><div class="row"><label class="row small muted">${L('סוג קבוצה','Group type')} ${sel('fseg',segs,S.fSeg,sn)}</label><label class="row small muted">${L('שלב','Stage')} ${sel('fstage',stages,S.fStage,stn)}</label>${seesAll()?`<label class="row small muted">${L('סוכן','Agent')} ${sel('fagent',agents,S.fAgent,agn)}</label>`:''}<label class="row small muted">${L('קו התראה לשולי רווח','Margin alert line')} <input type="number" min="0" max="50" data-ch="thresh" value="${S.thresh}" aria-label="${L('קו התראה','Alert line')}">%</label></div></div>`;
  const P=portfolio(ts);
  const eyebrow=L('כסף','Money'),title=`${L('כספים','Finance')} ${pillF(L('חדש','New'),'green')}`;
  if(!P.rows.length)return hcPage({eyebrow,title,aria:L('כספים','Finance'),brief:L('אין טיולים שהוזמנו בסינון הזה.','No booked trips in this filter.'),ctas:[hcCta('mint','quotes',L('לפרויקטים','Open projects'),'data-act="go" data-v="quotes"')]})+`<div class="hc-grid"><div class="hc-c12">${filt}<div class="card hc-card"><p class="muted" style="margin:0">${L('אין טיולים שהוזמנו בסינון הזה.','No booked trips in this filter.')} ${P.pipelineN?L(`${P.pipelineN} הצעות (${usd(P.pipeline)}) נחשבות צנרת ולא הכנסה.`,`${P.pipelineN} quotes (${usd(P.pipeline)}) count as pipeline, not revenue.`):''}</p></div></div></div>`;
  const rows=[...P.rows].sort((a,b)=>D(a.t.dep)-D(b.t.dep));
  const mx=Math.max(...rows.map(r=>Math.max(r.pp,r.fp)),1);
  const bars=rows.map(r=>`<div class="col"><div class="bars"><div class="b plan" style="height:${Math.max(r.pp/mx*100,1)}%"><i>${kf(r.pp)}</i></div><div class="b fc" style="height:${Math.max(r.fp/mx*100,1)}%"><i>${kf(r.fp)}</i></div></div></div>`).join('');
  const SH={HolyLand:['ארץ הקודש','Holy Land'],Washington:['וושינגטון','DC'],NewEngland:['ניו אינגלנד','New England'],Canyon:['גרנד קניון','Canyon'],Rome:['רומא','Rome'],Greece:['יוון','Greece'],Niagara:['ניאגרה','Niagara'],London:['לונדון','London'],Ireland:['אירלנד','Ireland'],Branson:['ברנסון','Branson'],Nashville:['נאשוויל','Nashville']};
  const labs=rows.map(r=>`<span>${L(SH[r.t.dest][0],SH[r.t.dest][1])}<br><small>${r.t.dep.slice(5,7)}/${r.t.dep.slice(2,4)}</small></span>`).join('');
  const cm=Math.max(...MONTHS.map(k=>Math.max(P.cash[k].in,P.cash[k].out)),1);
  const cbars=MONTHS.map(k=>`<div class="col"><div class="bars"><div class="b in" style="height:${Math.max(P.cash[k].in/cm*100,1)}%"><i>${kf(P.cash[k].in)}</i></div><div class="b out" style="height:${Math.max(P.cash[k].out/cm*100,1)}%"><i>${kf(P.cash[k].out)}</i></div></div></div>`).join('');
  const clabs=MONTHS.map(k=>`<span>${monthLabel(k)}</span>`).join('');
  const inT=MONTHS.reduce((a,k)=>a+P.cash[k].in,0),outT=MONTHS.reduce((a,k)=>a+P.cash[k].out,0);
  const agL=[L('1 עד 30 ימים','1 to 30 days'),L('31 עד 60 ימים','31 to 60 days'),L('מעל 60 ימים','Over 60 days')].map((l,i)=>`<tr><td>${l}</td><td class="n">${P.agingN[i]}</td><td class="n">${usd(P.aging[i])}</td></tr>`).join('');
  const prof=(obj,lab)=>{const ks=Object.keys(obj).sort((a,b)=>obj[b].fp/obj[b].pax-obj[a].fp/obj[a].pax);const mxv=Math.max(...ks.map(k=>obj[k].fp/obj[k].pax),1);
    return ks.map(k=>`<div class="hbar"><span>${lab(k)}</span><div class="t"><div style="width:${Math.max(0,obj[k].fp/obj[k].pax/mxv*100)}%;background:var(--teal)"></div></div><span class="small hv">${usd(obj[k].fp/obj[k].pax)} | ${pct(obj[k].fp/obj[k].rev)}</span></div>`).join('');};
  const fxk=Object.keys(P.fxExp);
  const fx=fxk.map(k=>{const e=P.fxExp[k],imp=r2(e.usd*S.shock/100);return `<tr><td>${k}</td><td class="n">${money(e.amt,k)}</td><td class="n">${usd(e.usd)}</td><td class="n ${imp>0?'neg':'pos'}">${sgn(-imp,v=>usd(v))}</td></tr>`;}).join('');
  const fxTot=r2(Object.values(P.fxExp).reduce((a,e)=>a+e.usd*S.shock/100,0));
  const rank=[...P.rows].sort((a,b)=>b.fp/b.t.pax-a.fp/a.t.pax).map(r=>`<tr><td><a href="#" data-act="open" data-v="${r.t.id}" data-pt="tfin" style="color:var(--blue)">${esc(r.t.name)}</a></td><td>${sn(r.t.seg)}</td><td>${pillF(stn(r.t.stage),stCls(r.t.stage))}</td><td class="n">${r.t.pax}</td><td class="n">${usd(r.c.rev)}</td><td class="n">${usd(r.pp)}</td><td class="n">${usd(r.fp)}</td><td class="n ${r.fp<r.pp?'neg':'pos'}">${sgn(r2(r.fp-r.pp),usd)}</td><td class="n">${pct(r.fp/r.c.rev)}</td><td class="n">${usd(r.fp/r.t.pax)}</td></tr>`).join('');
  const late=[...P.lateGroups].sort((a,b)=>b.g.late-a.g.late).slice(0,6).map(x=>`<tr><td>${esc(x.g.name)}</td><td>${esc(x.t.name)}</td><td class="n">${x.g.days}</td><td class="n">${usd(x.g.late,2)}</td></tr>`).join('');
  const wf=(l,v,cls)=>`<tr><td>${l}</td><td class="n ${cls||''}">${v}</td></tr>`;
  /* brief: booked, collected, outstanding, late */
  const brief=L(`הוזמנו ${hlKey(usd(P.rev))} ב-${P.rows.length} טיולים. ${hlPos(usd(P.col))} נגבו, ${hlWarn(usd(P.outstanding))} עדיין חייבים${P.late>0?`, מהם ${hlNeg(usd(P.late))} באיחור`:''}.`,
    `${hlKey(usd(P.rev))} booked across ${P.rows.length} ${P.rows.length===1?'trip':'trips'}. ${hlPos(usd(P.col))} collected, ${hlWarn(usd(P.outstanding))} still outstanding${P.late>0?`, of which ${hlNeg(usd(P.late))} is late`:''}.`);
  const ctas=[hcCta('mint','leaks',L('לדליפות הרווח','See where profit leaked'),'data-act="go" data-v="leaks"'),hcCta('ghost','gaps',L('לבקרת החשבוניות','Invoice check'),'data-act="go" data-v="gaps"')];
  const dP=r2(P.fp-P.pp);
  const kpis=[{lab:L('הכנסות מוזמנות','Booked revenue'),val:usd(P.rev),sub:L(`${P.rows.length} טיולים, ${P.pax} נוסעים`,`${P.rows.length} trips, ${P.pax} travelers`)},
    {lab:L('רווח צפוי','Expected profit'),val:usd(P.fp),sub:`${pct(P.fp/P.rev)} · ${sgn(dP,usd)} ${L('מול תכנון','vs plan')}`,cls:'pf',act:'go',v:'leaks'},
    {lab:L('חייבים','Receivable'),val:usd(P.outstanding),sub:`${usd(P.late)} ${L('באיחור','late')}`,cls:P.late>0?'warn':'',act:'fn-fl',v:'fin-late'},
    {lab:L('רווח לנוסע','Profit per traveler'),val:usd(P.fp/P.pax),sub:`${L('עמלות ספקים','Supplier commission')} ${usd(P.comm)}`}];
  return hcPage({eyebrow,title,aria:L('כספים','Finance'),brief,ctas,kpis})+`
  <div class="hc-grid"><div class="hc-c12">${filt}</div>
  <div class="hc-c7"><div class="card hc-card"><div class="hc-h"><h3>${L('רווח מתוכנן מול צפוי, לפי טיול','Planned vs expected profit, by trip')}</h3><div class="legend" style="margin:0"><span><i style="background:var(--muted);opacity:.55"></i>${L('מתוכנן','Planned')}</span><span><i style="background:var(--teal)"></i>${L('צפוי','Expected')}</span></div></div><div class="scroll"><div class="chart">${bars}</div><div class="xl">${labs}</div></div></div>
   <div class="card hc-card"><div class="hc-h"><h3>${L('תזרים ל-12 חודשים','12-month cash flow')}</h3><span class="hc-pill ${inT-outT>=0?'green':'red'}">${L('נטו','Net')} ${sgn(r2(inT-outT),usd)}</span></div><p class="small muted">${L('תשלומי לקוחות צפויים מול תשלומי ספקים שנותרו. פיגורים נספרים בחודש הנוכחי. ספקים משולמים 14 יום לפני היציאה, או בעוד 20 יום בטיולים שחזרו.','Expected client payments against supplier payments still due. Late items count in the current month. Suppliers are paid 14 days before departure, or in 20 days for trips already back.')}</p>
    <div class="legend"><span><i style="background:#22a06b"></i>${L('מלקוחות','From clients')} ${usd(inT)}</span><span><i style="background:#e07a5f"></i>${L('לספקים','To suppliers')} ${usd(outT)}</span></div><div class="scroll"><div class="chart">${cbars}</div><div class="xl">${clabs}</div></div></div></div>
  <div class="hc-c5"><div class="card hc-card"><div class="hc-h"><h3>${L('מרווח מתוכנן לרווח צפוי','From planned to expected profit')}</h3>${P.amtDiff+P.fx>0?`<span class="hc-pill red">${usd(-(P.amtDiff+P.fx))}</span>`:`<span class="hc-pill green">${sgn(r2(-(P.amtDiff+P.fx)),usd)}</span>`}</div><table class="tbl"><tbody>${wf(L('רווח מתוכנן','Planned profit'),usd(P.pp,2))}${wf(L('סכומי ספקים מעל או מתחת להצעה','Supplier amounts above or below quote'),usd(-P.amtDiff,2),P.amtDiff>0?'neg':'pos')}${wf(L('שער ששולם מול שער נעול','Rate paid vs locked rate'),usd(-P.fx,2),P.fx>0?'neg':'pos')}</tbody><tfoot><tr><td>${L('רווח צפוי','Expected profit')}</td><td class="n">${usd(P.fp,2)}</td></tr></tfoot></table><p class="small muted" style="margin-top:8px">${L(`${P.gapN} חשבוניות שונות מההצעה, ו-${P.noneN} שורות ספק בלי חשבונית.`,`${P.gapN} invoices differ from the quote, and ${P.noneN} supplier lines have no invoice yet.`)} <a href="#" data-act="go" data-v="gaps" style="color:var(--blue)">${L('לבקרת החשבוניות','Open invoice check')}</a></p></div>
   <div class="card hc-card" id="fin-late"><div class="hc-h"><h3>${L('איחורים בתשלומי לקוחות','Late client payments')}</h3>${P.late>0?`<span class="hc-pill red">${usd(P.late)}</span>`:`<span class="hc-pill green">${L('אין איחורים','None late')}</span>`}</div><table class="tbl"><thead><tr><th>${L('ימי איחור','Days late')}</th><th class="n">${L('קבוצות','Groups')}</th><th class="n">${L('סכום','Amount')}</th></tr></thead><tbody>${agL}</tbody><tfoot><tr><td>${L('סה"כ','Total')}</td><td class="n">${P.lateN}</td><td class="n">${usd(P.late)}</td></tr></tfoot></table>
    ${late?`<div class="scroll" style="margin-top:12px"><table class="tbl"><thead><tr><th>${L('משק בית','Household')}</th><th>${L('טיול','Trip')}</th><th class="n">${L('ימים','Days')}</th><th class="n">${L('באיחור','Late')}</th></tr></thead><tbody>${late}</tbody></table></div>`:''}</div>
   <div class="card hc-card"><div class="hc-h"><h3>${L('תרחיש שער חליפין','Exchange-rate scenario')}</h3></div><p class="small muted">${L('רוב הספקים מחייבים בדולרים. אם היורו, הליש"ט או הדולר הקנדי יתחזקו לפני התשלום, זו ההשפעה על הרווח הצפוי.','Most suppliers bill in USD. If the euro, pound or Canadian dollar strengthen before you pay, this is the effect on expected profit.')}</p>
    <div class="row"><input type="range" min="-10" max="10" step="1" value="${S.shock}" data-in="shock" aria-label="${L('שינוי מטבע באחוזים','Currency move, percent')}"><strong style="direction:ltr">${sgn(S.shock,v=>v)}%</strong></div>
    ${fxk.length?`<div class="scroll"><table class="tbl" style="margin-top:8px"><thead><tr><th>${L('מטבע','Currency')}</th><th class="n">${L('נותר לשלם','Still to pay')}</th><th class="n">${L('בשער נעול','At locked rate')}</th><th class="n">${L('השפעה על הרווח','Profit effect')}</th></tr></thead><tbody>${fx}</tbody><tfoot><tr><td colspan="3">${L('סה"כ השפעה','Total effect')}</td><td class="n ${fxTot>0?'neg':'pos'}">${sgn(-fxTot,usd)}</td></tr></tfoot></table></div>`:`<p class="muted">${L('אין חשיפה במטבע זר בסינון הזה.','No foreign-currency exposure in this filter.')}</p>`}
    <p class="small muted" style="margin:8px 0 0">${L(`הרווח הצפוי יהיה ${usd(P.fp-fxTot)} (${pct((P.fp-fxTot)/P.rev)}).`,`Expected profit would be ${usd(P.fp-fxTot)} (${pct((P.fp-fxTot)/P.rev)}).`)}</p></div>
   <div class="card hc-card"><div class="hc-h"><h3>${L('רווח לנוסע לפי סוג קבוצה','Profit per traveler by group type')}</h3></div>${prof(P.bySeg,sn)}<h3 style="margin:16px 0 8px;font-size:16px">${L('רווח לנוסע לפי יעד','Profit per traveler by destination')}</h3>${prof(P.byDest,dn)}</div></div>
  <div class="hc-c12"><div class="card hc-card"><div class="hc-h"><h3>${L('טיולים לפי רווח לנוסע','Trips ranked by profit per traveler')}</h3><span class="muted small">${P.rows.length} ${L('טיולים','trips')}</span></div><div class="scroll"><table class="tbl"><thead><tr><th>${L('טיול','Trip')}</th><th>${L('סוג','Type')}</th><th>${L('שלב','Stage')}</th><th class="n">${L('נוסעים','Travelers')}</th><th class="n">${L('הכנסה','Revenue')}</th><th class="n">${L('מתוכנן','Planned')}</th><th class="n">${L('צפוי','Expected')}</th><th class="n">${L('שינוי','Change')}</th><th class="n">${L('שולי רווח','Margin')}</th><th class="n">${L('לנוסע','Per traveler')}</th></tr></thead><tbody>${rank}</tbody>
   <tfoot><tr><td colspan="3">${L('סה"כ','Total')}</td><td class="n">${P.pax}</td><td class="n">${usd(P.rev)}</td><td class="n">${usd(P.pp)}</td><td class="n">${usd(P.fp)}</td><td class="n">${sgn(r2(P.fp-P.pp),usd)}</td><td class="n">${pct(P.fp/P.rev)}</td><td class="n">${usd(P.fp/P.pax)}</td></tr></tfoot></table></div></div></div>
  <div class="hc-c12"><div class="card hc-card"><div class="hc-h"><h3>${L('סנכרון הנהלת חשבונות וסליקה','Accounting and payments sync')}</h3>${pillF(L('בקרוב','Coming soon'),'amber')}</div><p class="muted" style="margin:0">QuickBooks Online, Xero, Stripe. ${L('הדמו לא רושם פקודות יומן ולא גובה תשלומים.','The demo does not post journal entries or collect payments.')}</p></div></div></div>`;
}
/* the Receivable tile scrolls to the late payments card */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="fn-fl"]');if(!b)return;
  try{const el=document.getElementById(b.dataset.v);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'center'});}catch(x){}});
