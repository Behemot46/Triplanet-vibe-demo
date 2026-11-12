/* ---------- Phase 2: accounting sync (pilot), "your numbers", Maya questions ----------
   Simulated against a sample company file; every screen says "Pilot". English leads with
   QuickBooks Online and Xero; Hebrew leads with Priority and Hashavshevet (חשבשבת). All four are
   offered in both languages. No vendor logos: a neutral badge with the name, as for hotel brands. */
const ACCT={
  qbo:{name:['קוויקבוקס','QuickBooks Online'],short:['קוויקבוקס','QuickBooks'],color:'#2E7D32',ini:'QB',region:['ארה״ב וקנדה','US and Canada'],
    map:[[['טיול','Trip'],['Class',"Class"]],[['ספק','Supplier'],['Vendor','Vendor']],[['חשבונית ספק','Supplier invoice'],['Bill','Bill']],[['זיכוי מספק','Supplier credit'],['Vendor credit','Vendor credit']],[['חשבון ללקוח','Client invoice'],['Invoice + Payment','Invoice + Payment']]],
    trip:['Class','Class'],credit:['Vendor credit','vendor credit'],bill:['Bill','bill']},
  xero:{name:['זירו','Xero'],short:['זירו','Xero'],color:'#0E7FA8',ini:'X',region:['גלובלי','Global'],
    map:[[['טיול','Trip'],['Tracking category "Trip"','Tracking category "Trip"']],[['ספק','Supplier'],['Contact','Contact']],[['חשבונית ספק','Supplier invoice'],['Bill (ACCPAY)','Bill (ACCPAY)']],[['זיכוי מספק','Supplier credit'],['Credit note','Credit note']],[['חשבון ללקוח','Client invoice'],['Invoice (ACCREC)','Invoice (ACCREC)']]],
    trip:['Tracking category','tracking category'],credit:['Credit note','credit note'],bill:['Bill','bill']},
  priority:{name:['פריוריטי','Priority ERP'],short:['פריוריטי','Priority'],color:'#6B3FA0',ini:'P',region:['ישראל','Israel'],
    map:[[['טיול','Trip'],['פרויקט / מרכז רווח','Project / profit center']],[['ספק','Supplier'],['כרטיס ספק','Supplier record']],[['חשבונית ספק','Supplier invoice'],['חשבונית ספק','Supplier invoice']],[['זיכוי מספק','Supplier credit'],['חשבונית זיכוי ספק','Supplier credit invoice']],[['חשבון ללקוח','Client invoice'],['חשבונית מס / קבלה','Tax invoice / receipt']]],
    trip:['פרויקט','Project','project'],credit:['חשבונית זיכוי','Credit invoice','credit invoice'],bill:['חשבונית ספק','Supplier invoice','supplier invoice']},
  hash:{name:['חשבשבת','Hashavshevet'],short:['חשבשבת','Hashavshevet'],color:'#1F5FA8',ini:['ח','H'],region:['ישראל','Israel'],
    map:[[['טיול','Trip'],['מרכז רווח','Profit center']],[['ספק','Supplier'],['כרטיס ספק','Supplier account']],[['חשבונית ספק','Supplier invoice'],['קליטת תנועות (פקודת יומן)','Journal entry import']],[['זיכוי מספק','Supplier credit'],['פקודת זיכוי','Credit entry']],[['חשבון ללקוח','Client invoice'],['חשבונית מס / קבלה','Tax invoice / receipt']]],
    trip:['מרכז רווח','Profit center','profit center'],credit:['פקודת זיכוי','Credit entry','credit entry'],bill:['פקודת יומן','Journal entry','journal entry']}};
/* object names: [Title, lower] for English systems, [Hebrew, Title, lower] for Israeli ones */
const term=(p,f,lower)=>{const v=p[f];return v.length===3?(S.lang==='he'?v[0]:(lower?v[2]:v[1])):(lower?v[1]:v[0]);};
const acctOrder=()=>S.lang==='he'?['priority','hash','qbo','xero']:['qbo','xero','priority','hash'];
const A=()=>S.acct||(S.acct={sys:null,phase:'idle',step:-1,opt:{auto:true,tag:true,credit:true},log:[]});
const an=(k,i)=>{const p=ACCT[k];return L(p[i||'name'][0],p[i||'name'][1]);};
const acBadge=k=>{const i=ACCT[k].ini;return `<span class="acb" style="--bc:${ACCT[k].color}">${esc(Array.isArray(i)?L(i[0],i[1]):i)}</span>`;};
const PILOT=()=>pillF(L('פיילוט','Pilot'),'info');
function acStats(){const ts=visibleTrips(),G=gapStats(ts),vend=new Set();ts.filter(t=>t.stage!=='Quote').forEach(t=>t.lines.forEach(l=>{if(l.inv)vend.add(l.sup);}));
  return {bills:G.received,matched:G.matched,vend:vend.size,trips:ts.filter(t=>t.stage!=='Quote').length,gapN:G.openN+G.dispN,gap:r2(G.open+G.disp)};}
const AC_STEPS=[k=>L(`מתחבר ל${an(k,'short')} (קובץ חברה לדוגמה)`,`Signing in to ${an(k,'short')} (sample company file)`),
  k=>L('חברה: Redbud Group Tours LLC','Company: Redbud Group Tours LLC'),
  k=>{const s=acStats();return L(`מייבא ${s.vend} ספקים`,`Importing ${s.vend} suppliers`);},
  k=>{const s=acStats();return L(`מייבא ${s.bills} חשבוניות ספק מ-90 הימים האחרונים`,`Importing ${s.bills} supplier bills from the last 90 days`);},
  k=>{const s=acStats();return L(`ממפה ${s.trips} טיולים ל${term(ACCT[k],'trip')}`,`Mapping ${s.trips} trips to ${term(ACCT[k],'trip')}`);},
  k=>L('מתאים כל חשבונית לשורת ההצעה','Matching every bill to its quote line')];
function acConnect(k){
  const a=A();a.sys=k;a.phase='connecting';a.step=0;render();
  let rm=false;try{rm=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  const done=()=>{a.phase='synced';a.step=-1;a.at=Date.now();if(!a.log.length)acSeed();render();toast(L(`${an(k,'short')} מחובר. ${acStats().bills} חשבוניות סונכרנו.`,`${an(k,'short')} connected. ${acStats().bills} bills synced.`));};
  if(rm){done();return;}
  const tick=()=>{if(a.phase!=='connecting'||a.sys!==k)return;a.step++;if(a.step>=AC_STEPS.length){done();return;}render();setTimeout(tick,480);};
  setTimeout(tick,480);
}
function acSeed(){
  const a=A(),ts=visibleTrips().filter(t=>t.stage==='Closed'||t.stage==='Finance');
  ts.slice(0,3).forEach(t=>{const l=t.lines.find(x=>x.inv&&invStatus(x).k==='match'&&effAmt(x.inv)>0&&x.type!=='Lodging');if(l)a.log.unshift({k:'import',t:t.name,sup:l.sup,no:l.inv.no,amt:r2(effAmt(l.inv)*lrate(t,l))});});
}
function acLog(kind,t,l,amt){
  const a=A();if(a.phase!=='synced')return;a.log.unshift({k:kind,t:t.name,sup:l.sup,no:l.inv?l.inv.no:'',amt:r2(amt)});a.log=a.log.slice(0,30);
  const p=ACCT[a.sys],tag=a.opt.tag?L(` · ${term(p,'trip')}: ${t.name}`,` · ${term(p,'trip')}: ${t.name}`):'';
  const msg=kind==='post'?L(`${term(p,'bill')} נרשמה ב${an(a.sys,'short')}${tag}`,`${term(p,'bill')} posted to ${an(a.sys,'short')}${tag}`)
    :kind==='credit'?L(`${term(p,'credit')} נוצר ב${an(a.sys,'short')}: ${usd(amt)}`,`${term(p,'credit')} created in ${an(a.sys,'short')}: ${usd(amt)}`)
    :L(`החשבונית ${l.inv.no} מוקפאת לתשלום ב${an(a.sys,'short')} עד לזיכוי`,`Bill ${l.inv.no} held from payment in ${an(a.sys,'short')} until the credit arrives`);
  toast(msg);
}
function acLogRow(e){const a=A(),p=ACCT[a.sys||'qbo'];
  const lab={import:L('יובאה ותואמה','Imported and matched'),post:L(`${term(p,'bill')} נרשמה`,`${term(p,'bill')} posted`),credit:L(`${term(p,'credit')} נוצר`,`${term(p,'credit')} created`),hold:L('הוקפאה לתשלום','Held from payment')}[e.k];
  const pc={import:'green',post:'blue',credit:'green',hold:'amber'}[e.k];
  return `<tr><td>${pillF(lab,pc)}</td><td><strong>${esc(e.sup)}</strong><div class="small muted">${esc(e.no||'')}</div></td><td>${esc(e.t)}</td><td class="n">${usd(e.amt,2)}</td></tr>`;}
function vBooks(){
  const a=A(),s=acStats();
  const head0=head(L('הנהלת חשבונות','Accounting sync'),PILOT());
  const intro=`<p class="muted">${L('טריפלאנט קוראת את חשבוניות הספקים ממערכת הנהלת החשבונות, מתאימה כל שורה למה שתומחר, ומחזירה לשם חשבוניות מאושרות וזיכויים, מתויגים לפי טיול.','Triplanet reads supplier bills from your accounting system, matches every line to what you quoted, and writes approved bills and credits back, tagged to the trip.')}</p>`;
  if(a.phase==='connecting'){const k=a.sys;return head0+intro+`<div class="card ac-busy"><div class="row" style="gap:12px;margin-bottom:12px">${acBadge(k)}<h3 style="margin:0">${L(`מתחבר ל${an(k)}...`,`Connecting ${an(k)}...`)}</h3></div>${AC_STEPS.map((f,i)=>i<=a.step?`<div class="st-step ${i<a.step?'done':'cur'}"><span class="dot">${i<a.step?ic('check'):''}</span>${esc(f(k))}</div>`:'').join('')}</div>`;}
  if(a.phase!=='synced'){
    const cards=acctOrder().map(k=>`<div class="card ac-card"><div class="row" style="gap:12px">${acBadge(k)}<div><strong>${an(k)}</strong><div class="small muted">${L(ACCT[k].region[0],ACCT[k].region[1])}</div></div></div>
      <ul class="ac-ul">${ACCT[k].map.slice(0,3).map(m=>`<li>${L(m[0][0],m[0][1])} ${ic('right','flip')} <b>${L(m[1][0],m[1][1])}</b></li>`).join('')}</ul>
      <button class="btn pri" data-act="acconn" data-v="${k}">${ic('plug')} ${L(`חיבור ${an(k,'short')}`,`Connect ${an(k,'short')}`)}</button></div>`).join('');
    return head0+intro+`<div class="ac-grid">${cards}</div><p class="st-note">${L('בדמו החיבור רץ מול קובץ חברה לדוגמה. החיבורים החיים ל-QuickBooks, Xero, פריוריטי וחשבשבת נמצאים בפיילוט.','In the demo the connection runs against a sample company file. Live connections to QuickBooks, Xero, Priority and Hashavshevet are in pilot.')}</p>`;
  }
  const k=a.sys,p=ACCT[k],pctm=s.bills?s.matched/s.bills:0;
  const opt=(key,he,en)=>`<label class="ac-opt"><input type="checkbox" data-acopt="${key}" ${a.opt[key]?'checked':''}> <span>${L(he,en)}</span></label>`;
  return head0+intro+`<div class="card ac-head"><div class="row" style="gap:14px;flex-wrap:wrap">${acBadge(k)}<div style="flex:1;min-width:220px"><strong style="font-size:16px">${an(k)}</strong> ${pillF(L('מחובר','Connected'),'green')}<div class="small muted">Redbud Group Tours LLC · ${L('קובץ חברה לדוגמה','sample company file')} · ${L('סנכרון אחרון: היום','Last sync: today')}</div></div>
     <button class="btn" data-act="acsync">${ic('refresh')} ${L('סנכרן עכשיו','Sync now')}</button><button class="btn" data-act="acoff">${L('ניתוק','Disconnect')}</button></div></div>
   <div class="stats"><div class="stat"><div class="l">${L('חשבוניות שיובאו','Bills imported')}</div><div class="v">${s.bills}</div><div class="s">${L('90 הימים האחרונים','last 90 days')}</div></div>
    <div class="stat"><div class="l">${L('תואמו להצעה','Matched to the quote')}</div><div class="v">${pct(pctm)}</div><div class="s">${s.matched} ${L('בלי מגע יד','with no touch')}</div></div>
    <div class="stat"><div class="l">${L('פערים שנמצאו','Gaps found')}</div><div class="v neg">${usd(s.gap)}</div><div class="s">${s.gapN} ${L('פתוחים או בדרישה','open or disputed')}</div></div>
    <div class="stat"><div class="l">${L('טיולים מתויגים','Trips tagged')}</div><div class="v">${s.trips}</div><div class="s">${L(`כ${term(p,'trip')}`,`as ${term(p,'trip',1)}`)}</div></div></div>
   <div class="two"><div class="card"><h3>${L('מה ממופה למה','What maps to what')}</h3><table class="tbl"><thead><tr><th>Triplanet</th><th>${an(k,'short')}</th></tr></thead><tbody>${p.map.map(m=>`<tr><td>${L(m[0][0],m[0][1])}</td><td><strong>${L(m[1][0],m[1][1])}</strong></td></tr>`).join('')}</tbody></table></div>
    <div class="card"><h3>${L('כללי רישום','Posting rules')}</h3>${opt('auto','לרשום אוטומטית חשבוניות שאושרו','Post approved bills automatically')}${opt('tag',`לתייג כל שורה לפי הטיול (${term(p,'trip')})`,`Tag every line with the trip (${term(p,'trip',1)})`)}${opt('credit',`ליצור ${term(p,'credit')} כשמתקבל זיכוי`,`Create a ${term(p,'credit',1)} when a dispute is credited`)}
     <p class="st-note">${L('חשבונית עם פער פתוח לא נרשמת לתשלום עד שהיא מטופלת.','A bill with an open gap is held from payment until it is handled.')}</p></div></div>
   <div class="card"><div class="row" style="justify-content:space-between;margin-bottom:8px"><h3 style="margin:0">${L('יומן סנכרון','Sync log')}</h3><button class="btn sm" data-act="go" data-v="gaps">${L('לבקרת החשבוניות','Open invoice check')}</button></div>
    <div class="scroll"><table class="tbl"><thead><tr><th>${L('פעולה','Action')}</th><th>${L('ספק','Supplier')}</th><th>${L('טיול','Trip')}</th><th class="n">${L('סכום','Amount')}</th></tr></thead><tbody>${a.log.map(acLogRow).join('')||`<tr><td colspan="4" class="muted">${L('אין עדיין פעולות.','Nothing yet.')}</td></tr>`}</tbody></table></div>
    <p class="st-note">${L('אשרו, שלחו דרישה או רשמו זיכוי בכרטיס פער, והפעולה תופיע כאן ובמערכת הנהלת החשבונות.','Accept, dispute or credit a gap card and the entry appears here and in your accounting system.')}</p></div>`;
}
/* sync chip on the trip's finance tabs */
function acChip(t){const a=A();if(a.phase!=='synced'||t.stage==='Quote')return '';return `<div class="ac-chip">${acBadge(a.sys)}<span>${L(`מסונכרן עם ${an(a.sys,'short')}`,`Synced with ${an(a.sys,'short')}`)} · ${term(ACCT[a.sys],'trip')}: <strong>${esc(t.name)}</strong></span>${PILOT()}</div>`;}
{const f0=pFinDash,t0=pTripFin;pFinDash=function(t){return acChip(t)+f0(t);};pTripFin=function(t){return acChip(t)+t0(t);};}
/* your numbers: what this leak rate would mean for the visitor's agency (illustration) */
function yourNumbers(){
  const M=leakModel(visibleTrips()),rate=M.rev?Math.max(0,M.leak)/M.rev:0,n=S.ynTrips||60,rev=S.ynRev||45000,est=r2(n*rev*rate);
  return `<div class="card yn"><div class="row" style="justify-content:space-between"><h3 style="margin:0">${L('המספרים שלכם','Your numbers')}</h3>${pillF(L('המחשה','Illustration'),'')}</div>
   <div class="yn-g"><label>${L('טיולים בשנה','Trips per year')}<input type="number" min="1" max="2000" value="${n}" data-yn="ynTrips"></label><label>${L('הכנסה ממוצעת לטיול ($)','Average revenue per trip ($)')}<input type="number" min="1000" max="1000000" step="1000" value="${rev}" data-yn="ynRev"></label>
   <div class="yn-out"><span>${L('דליפה צפויה בשנה, בשיעור של הדמו','Leak per year at this demo\'s rate')}</span><b>${usd(est)}</b><small>${L(`${pct(rate)} מההכנסות. הערכה, לא נתון שלכם.`,`${pct(rate)} of revenue. An estimate, not your data.`)}</small></div></div></div>`;
}
{const v0=VIEWS.leaks;VIEWS.leaks=function(){return v0()+yourNumbers();};}
/* Maya: three new questions */
QS.push(
 {g:1,he:'איזה סוכן מאבד הכי הרבה רווח?',en:'Which agent leaks the most profit?',r:/(agent|סוכן).*(leak|lose|דלי|מאבד)/,f:()=>{const M=leakModel(visibleTrips()),rs=leakRows(M,'agent').filter(r=>r.leak>0);
   return rs.length?{t:L(`${rs[0].label} מוביל: ${usd(rs[0].leak)} דלפו ב-${rs[0].n} טיולים.\n`,`${rs[0].label} leads: ${usd(rs[0].leak)} leaked across ${rs[0].n} trips.\n`)+listL(rs.slice(1,4).map(r=>`${r.label}: ${usd(r.leak)}`)),btn:{label:L('לדליפות רווח','Open profit leaks'),act:'go',v:'leaks'}}:{t:L('אף סוכן לא איבד רווח.','No agent has lost profit.')};}},
 {g:1,he:'איזה סוג קבוצה מאבד הכי הרבה רווח?',en:'Which group type leaks the most profit?',r:/(group type|segment|סוג קבוצה).*(leak|lose|דלי|מאבד)/,f:()=>{const M=leakModel(visibleTrips()),rs=leakRows(M,'seg').filter(r=>r.leak>0);
   return rs.length?{t:L(`${rs[0].label}: ${usd(rs[0].leak)} דלפו, ${pct(rs[0].pp?rs[0].leak/rs[0].pp:0)} מהרווח המתוכנן.\n`,`${rs[0].label}: ${usd(rs[0].leak)} leaked, ${pct(rs[0].pp?rs[0].leak/rs[0].pp:0)} of planned profit.\n`)+listL(rs.slice(1,4).map(r=>`${r.label}: ${usd(r.leak)}`))}:{t:L('אף סוג קבוצה לא איבד רווח.','No group type has lost profit.')};}},
 {g:0,he:'מה ייבאנו ממערכת הנהלת החשבונות?',en:'What did we import from our accounting system?',r:/(accounting|quickbooks|xero|priority|hashavshevet|books|הנהלת ה?חשבונות|פריוריטי|חשבשבת).*(import|sync|ייב|יבא|סנכר)|(import|ייב).*(accounting|books|הנהלת ה?חשבונות)/,f:()=>{const a=A(),s=acStats();
   return a.phase==='synced'?{t:L(`מ${an(a.sys,'short')}: ${s.bills} חשבוניות ספק, ${s.vend} ספקים ו-${s.trips} טיולים מתויגים. ${s.matched} חשבוניות תואמו בלי מגע יד, ונמצאו ${s.gapN} פערים בסך ${usd(s.gap)}.`,`From ${an(a.sys,'short')}: ${s.bills} supplier bills, ${s.vend} suppliers and ${s.trips} tagged trips. ${s.matched} bills matched with no touch, and ${s.gapN} gaps worth ${usd(s.gap)} were found.`),btn:{label:L('לסנכרון','Open accounting sync'),act:'go',v:'books'}}
     :{t:L('עוד לא חיברתם מערכת הנהלת חשבונות. אפשר לחבר QuickBooks, Xero, פריוריטי או חשבשבת (פיילוט).','No accounting system is connected yet. You can connect QuickBooks, Xero, Priority or Hashavshevet (pilot).'),btn:{label:L('לחיבור','Connect'),act:'go',v:'books'}};}});
QS.slice(-3).forEach((q,i)=>{q.id=QS.length-2+i;});
QORDER.unshift(QS.length-2,QS.length-1,QS.length);
/* wiring */
NAV2.splice(NAV2.findIndex(n=>n[0]==='finance')+1,0,['books',['הנהלת חשבונות','Accounting sync'],ic('sync')]);
VIEWS.books=vBooks;
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,v=b.dataset.v;
  if(a==='acconn')acConnect(v);
  else if(a==='acoff'){const x=A();x.sys=null;x.phase='idle';x.log=[];render();}
  else if(a==='acsync'){const x=A();if(x.sys){toast(L(`${an(x.sys,'short')}: הכל מעודכן`,`${an(x.sys,'short')}: everything is up to date`));}}
  else if((a==='gapacc'||a==='gapcred'||a==='gapsent')&&A().phase==='synced'){
    const {t,l}=gapLineOf(v||'');if(!l)return;
    if(a==='gapacc'&&A().opt.auto)acLog('post',t,l,effAmt(l.inv)*lrate(t,l));
    else if(a==='gapcred'&&A().opt.credit)acLog('credit',t,l,(l.inv.credit||0)*lrate(t,l));
    else if(a==='gapsent')acLog('hold',t,l,effAmt(l.inv)*lrate(t,l));
    render();}
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset&&el.dataset.acopt){A().opt[el.dataset.acopt]=el.checked;render();}
  else if(el.dataset&&el.dataset.yn){S[el.dataset.yn]=Math.max(1,+el.value||1);render();}});
