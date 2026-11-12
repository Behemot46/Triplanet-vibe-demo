
/* ---------- labels ---------- */
const TH={Lodging:'מלונות',Transport:'הסעים וטיסות',Guide:'מורה דרך',Activities:'פעילויות',Meals:'ארוחות',Insurance:'ביטוח נסיעות'};
const TE={Lodging:'Hotels',Transport:'Transport & air',Guide:'Guide',Activities:'Activities',Meals:'Meals',Insurance:'Travel protection'};
const tn=k=>TH[k]?L(TH[k],TE[k]):esc(k);
const TCOL={Lodging:'#1f5fa8',Transport:'#d6457f',Guide:'#b5403a',Activities:'#6d4fd1',Meals:'#2f9aa0',Insurance:'#d99a1f'};
const TICO={Lodging:'▥',Transport:'▣',Guide:'◉',Activities:'⚑',Meals:'◒',Insurance:'✚'};
const CTH={Church:'כנסייה',School:'בית ספר',Club:'מועדון',Choir:'מקהלה',Association:'איגוד',Agency:'סוכנות שותפה',Prospect:'ליד חדש'};
const CTE={Church:'Church',School:'School',Club:'Club',Choir:'Choir',Association:'Association',Agency:'Partner agency',Prospect:'New lead'};
const ctn=k=>L(CTH[k]||'',CTE[k]||'');
const SUPH={Confirmed:'אושר',Sent:'נשלח','No reply':'אין מענה','Not sent':'טרם נשלח'};
const supn=k=>L(SUPH[k]||k,k);
const DIETH={None:'ללא',Vegetarian:'צמחוני','Gluten-free':'ללא גלוטן',Diabetic:'סוכרתי','Nut allergy':'אלרגיה לאגוזים'};
const dietn=k=>L(DIETH[k]||k,k);
const STH={Quote:'הצעה',Operations:'תפעול',Finance:'סגירה כספית',Closed:'נסגר'};
const STE={Quote:'Quote',Operations:'Operations',Finance:'Financial close',Closed:'Closed'};
const stn=k=>L(STH[k],STE[k]);
const stCls=s=>({Quote:'orange',Operations:'blue',Finance:'purple',Closed:'green'}[s]);
const supCls=s=>({Confirmed:'green',Sent:'blue','No reply':'red','Not sent':''}[s]||'');
const QST={Draft:['בבנייה','In progress','orange'],Sent:['נשלח ללקוח','Sent to client','yellow'],Negotiating:['ממתין לסגירה','Awaiting close','amber'],Approval:['לאישור מנהל','Manager approval','purple']};
const qn=k=>{const q=QST[k||'Draft'];return L(q[0],q[1]);};
const sd=s=>S.lang==='en'?s.slice(5,7)+'/'+s.slice(8,10)+'/'+s.slice(0,4):s.split('-').reverse().join('/');
const endOf=t=>addDays(t.dep,t.nights);
const range=t=>`<bdi dir="ltr">${sd(t.dep)} - ${sd(endOf(t))}</bdi>`;
const m=(t,n,dp)=>money(n,t.cur,dp||0);
const pillF=(txt,c)=>`<span class="pill ${c||''}">${txt}</span>`;
function qchip(t){
  if(t.stage==='Quote'){const q=QST[t.qst||'Draft'];return `<span class="stq"><b>Q</b>${pillF(qn(t.qst),q[2])}</span>`;}
  return `<span class="stq"><b>F</b>${pillF(stn(t.stage),stCls(t.stage))}</span>`;
}
const nightsL=n=>L(n===1?'לילה אחד':n+' לילות',n+(n===1?' night':' nights'));
const hrsL=n=>L(n===1?'שעה':n+' שעות',n+(n===1?' hour':' hours'));
const plE=(n,a,b)=>n+' '+(n===1?a:b);
const paxL=n=>L(n+' נוסעים',n+' travelers');

/* ---------- invoice gap language ---------- */
const KIND={qty:['כמות מעל המוסכם','Over agreed quantity','red'],rooms:['חדרים מעל רשימת החדרים','Rooms over rooming list','red'],rate:['מחיר מעל החוזה','Above contracted rate','red'],comp:['הטבת חינם לא יושמה','Comp not applied','red'],
  extra:['חיוב שלא בהצעה','Charge not in quote','red'],dup:['חשבונית כפולה','Duplicate invoice','red'],under:['חיוב נמוך מההצעה','Billed below quote','blue'],missing:['חשבונית חסרה','Invoice missing','amber']};
const kindOf=(l,s)=>s.kind==='qty'&&l.type==='Lodging'?'rooms':(s.kind||'rate');
const kindL=k=>L(KIND[k][0],KIND[k][1]);
const kindPill=k=>pillF(kindL(k),KIND[k][2]);
const GST={open:['פתוח','Open','red'],disputed:['נשלחה דרישת זיכוי','Dispute sent','amber'],accepted:['אושר','Accepted','blue'],credited:['זוכה','Credited','green']};
const gstPill=st=>pillF(L(GST[st][0],GST[st][1]),GST[st][2]);
function gapExplain(t,l){
  const i=l.inv,s=invStatus(l),k=kindOf(l,s),cur=l.cur,mm=v=>money(v,cur,0);
  if(!i)return L('לא התקבלה חשבונית. לפני סגירת התיק כדאי לבקש אותה, כדי שלא תגיע הפתעה אחרי שהרווח דווח.','No invoice yet. Ask for it before you close the file, so a surprise does not land after profit is reported.');
  if(k==='rooms'){const pr=Math.round(l.qty/t.nights),br=Math.round(i.qty/t.nights);
    return L(`חויבו ${br} חדרים ל-${t.nights} לילות. רשימת החדרים הסופית כללה ${pr} חדרים, והיא נשלחה לפני מועד השחרור בחוזה.`,`Billed ${br} rooms for ${t.nights} nights. The final rooming list had ${pr} rooms and was sent before the contract's release date.`);}
  if(k==='qty')return L(`חויבו ${i.qty} מנות. הספירה הסופית שנשלחה הייתה ${l.qty}.`,`Billed ${i.qty} covers. The final count sent was ${l.qty}.`);
  if(k==='rate')return L(`חויב ${mm(i.unit)} ל${l.unit==='person'?'אדם':'יחידה'} במקום תעריף הקבוצה בחוזה, ${mm(l.cost)}.`,`Billed ${mm(i.unit)} per ${l.unit} instead of the contracted group rate of ${mm(l.cost)}.`);
  if(k==='comp'){if(l.cost===0)return L(`חדר הנהג ניתן בחינם לפי החוזה, אבל חויב ${mm(i.amt)}.`,`The driver room is complimentary under the contract, but was billed at ${mm(i.amt)}.`);
    const c=Math.floor(t.pax/20);return L(`תעריף הקבוצה כולל כרטיס חינם על כל 20 משלמים (${c} כאן). חויבו ${i.qty} כרטיסים במקום ${l.qty}.`,`The group rate includes 1 free per 20 paying (${c} here). Billed ${i.qty} tickets instead of ${l.qty}.`);}
  if(k==='extra')return L(`"${esc(l.name)}" לא מופיע בהצעה ולא בחוזה עם הספק.`,`"${esc(l.name)}" is not in the quote or in the supplier contract.`);
  if(k==='dup')return L(`אותו מספר חשבונית ואותו סכום כמו ${esc(i.ref)}, התקבלה פעמיים.`,`Same invoice number and amount as ${esc(i.ref)}, received twice.`);
  if(k==='under')return L(`חויב ${mm(-s.diff)} פחות מההצעה. כדאי לוודא ששום שירות לא נשמט לפני התשלום.`,`Billed ${mm(-s.diff)} less than quoted. Check that no service was left out before you pay.`);
  return '';
}

/* ---------- alerts ---------- */
function alertsFor(ts,thresh){
  const A=[],P=portfolio(ts);
  ts.filter(t=>t.inbox&&t.inbox.length).forEach(t=>A.push({sev:'warn',txt:L(`${t.name}: ${t.inbox.length} חשבוניות ספקים חדשות ממתינות להתאמה.`,`${t.name}: ${t.inbox.length} new supplier invoices are waiting to be matched.`),trip:t.id,pt:'tfin'}));
  ts.filter(t=>t.stage==='Finance'||t.stage==='Operations').map(t=>{const g=tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0);return {t,n:g.length,amt:r2(g.reduce((a,x)=>a+x.usd,0))};}).filter(x=>x.n).sort((a,b)=>b.amt-a.amt).slice(0,3)
    .forEach(x=>A.push({sev:'bad',txt:L(`${x.t.name}: ${x.n} פערי חשבוניות פתוחים בסך ${usd(x.amt)}.`,`${x.t.name}: ${x.n} open invoice gaps worth ${usd(x.amt)}.`),trip:x.t.id,pt:'tfin'}));
  if(P.lateN)A.push({sev:'bad',txt:L(`${P.lateN} קבוצות חיוב באיחור בתשלום, בסך ${usd(P.late)}.`,`${P.lateN} billing groups are late on payment, totaling ${usd(P.late)}.`),go:'finance'});
  P.rows.filter(r=>r.c.rev>0&&r.fp/r.c.rev*100<thresh).forEach(r=>A.push({sev:'warn',txt:L(`${r.t.name}: שולי רווח צפויים ${pct(r.fp/r.c.rev)}, מתחת לקו ${thresh}%.`,`${r.t.name}: expected margin ${pct(r.fp/r.c.rev)}, below the ${thresh}% line.`),trip:r.t.id,pt:'tfin'}));
  ts.filter(t=>t.stage==='Operations'&&(D(t.dep)-TODAY)/DAY<=60&&(D(t.dep)-TODAY)>=0).forEach(t=>{const od=t.tasks.filter(x=>!x.done&&D(x.due)<TODAY).length,dd=Math.round((D(t.dep)-TODAY)/DAY);if(od)A.push({sev:'bad',txt:L(`${t.name} יוצא בעוד ${dd} ימים ויש ${od} משימות באיחור.`,`${t.name} departs in ${dd} days with ${od} overdue tasks.`),trip:t.id,pt:'ops'});});
  ts.filter(t=>t.stage==='Quote'&&t.qst==='Approval').forEach(t=>A.push({sev:'info',txt:L(`${t.name} ממתינה לאישור מנהל.`,`${t.name} is waiting for manager approval.`),trip:t.id,pt:'approve'}));
  ts.filter(t=>t.stage==='Quote'&&t.qst==='Sent'&&t.qdays>14).forEach(t=>A.push({sev:'info',txt:L(`ההצעה ל-${t.name} ממתינה ${t.qdays} ימים לתשובת הלקוח.`,`The quote for ${t.name} has waited ${t.qdays} days for the client.`),trip:t.id,pt:'approve'}));
  return A;
}
