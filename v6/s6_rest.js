
/* ---------- other pages ---------- */
function vTemplates(){
  const vt=visibleTrips().filter(t=>t.stage!=='Quote');
  const cards=vt.map((t,i)=>`<div class="tpl"><div class="im" style="${phBg(phSrc('dest',t.dest),`background:linear-gradient(135deg,${['#3b6fa5,#7fb0d9','#c9894a,#e8c08a','#4c8a6a,#9ccfae','#8a5aa8,#c6a3dc'][i%4]})`)}">${pillF(sn(t.seg),'')}</div><strong>${esc(t.name)}</strong><div class="small muted">${ic('pin')} ${dn(t.dest)} | ${L(`${t.nights+1} ימים`,`${t.nights+1} days`)} | ${paxL(t.pax)}</div><ul>${t.items.filter(x=>x.day>0).slice(0,3).map(x=>`<li>${esc(x.name)}</li>`).join('')}</ul><button class="btn sm" data-act="dup" data-v="${t.id}">${L('צור הצעה מתבנית','Create quote from template')}</button></div>`).join('');
  return head(L('תבניות','Templates'))+`<p class="muted">${L('טיולים קודמים הופכים לתבניות. שכפול יוצר הצעה חדשה לשנה הבאה עם אותה תוכנית ואותם ספקים, בלי חשבוניות ובלי נוסעים.','Past trips become templates. Duplicating creates next year\'s quote with the same itinerary and suppliers, without invoices or travelers.')}</p><div class="tg">${cards}</div>
  <h3 style="margin-top:22px">${L('תבניות יום','Day templates')}</h3><div class="tg">${DAYTPL.map(d=>`<div class="tpl"><strong>${L(d.n[0],d.n[1])}</strong> ${pillF(L(d.tag[0],d.tag[1]),'')}<ul>${d.items.map(i=>`<li>${esc(i[0])} (${i[1]} ${L('שעות','hours')})</li>`).join('')}</ul></div>`).join('')}</div>`;
}
function vHotels(){
  const hs=Object.entries(DESTS).map(([k,d])=>{const ts=TRIPS.filter(t=>t.dest===k&&t.stage!=='Quote'&&t.room.hotel===d.hotel[0]);return {k,h:d.hotel[0],rate:d.hotel[1],cur:d.cur,held:ts.reduce((a,t)=>a+t.room.held,0),used:ts.reduce((a,t)=>a+t.room.used,0),n:ts.length};});
  return head(L('מלונות','Hotels'))+`<p class="muted">${L('לכל מלון יש קיבולת כללית, ואפשר להחזיק בלוק חדרים לתאריכים מסוימים ולנצל אותו כשמשבצים נוסעים.','Each hotel has a general capacity, and you can hold a room block for specific dates and draw it down as travelers are assigned.')}</p><div class="card scroll"><table class="tbl"><thead><tr><th>${L('מלון','Hotel')}</th><th>${L('יעד','Destination')}</th><th class="n">${L('תעריף קבוצה ללילה','Group rate per night')}</th><th class="n">${L('תיקים עם בלוק','Files with a block')}</th><th class="n">${L('חדרים בבלוק','Rooms in block')}</th><th class="n">${L('חדרים בשימוש','Rooms used')}</th></tr></thead><tbody>${hs.map(x=>`<tr><td>${esc(x.h)}</td><td>${dn(x.k)}</td><td class="n">${money(x.rate,x.cur)}</td><td class="n">${x.n}</td><td class="n">${x.held}</td><td class="n">${x.used}</td></tr>`).join('')}</tbody></table></div>`;
}
const PRICELIST=()=>{const out=[];Object.entries(DESTS).forEach(([k,d])=>{
  out.push({svc:'Twin room, per night',dest:k,cat:'Lodging',sup:d.hotel[0],cur:d.cur,cost:d.hotel[1],basis:'room'});
  out.push({svc:(d.intl?'Coach 49 seats':'Motorcoach 56 seats')+', per day',dest:k,cat:'Transport',sup:d.coach[0],cur:d.cur,cost:d.coach[1],basis:'day'});
  if(d.shut)out.push({svc:'Airport transfer',dest:k,cat:'Transport',sup:d.shut[0],cur:d.cur,cost:d.shut[1],basis:'transfer'});
  out.push({svc:(d.intl?'Tour guide':'Step-on guide')+', full day',dest:k,cat:'Guide',sup:d.guide[0],cur:d.cur,cost:d.guide[1],basis:'day'});
  out.push({svc:d.meal[2]==='lunch'?'Group lunch':'Group dinner',dest:k,cat:'Meals',sup:d.meal[0],cur:d.cur,cost:d.meal[1],basis:'person'});
  d.acts.forEach(a=>out.push({svc:a[0],dest:k,cat:'Activities',sup:a[1],cur:d.cur,cost:a[2],basis:'person'}));});return out;};
const BASIS={room:['לחדר','per room'],day:['ליום','per day'],transfer:['להעברה','per transfer'],person:['לאדם','per person']};
const basisL=b=>BASIS[b]?L(BASIS[b][0],BASIS[b][1]):b;
function supplierBank(){
  const map={};
  PRICELIST().forEach(p=>{map[p.sup]=map[p.sup]||{n:p.sup,cat:p.cat,country:DESTS[p.dest].country,cur:p.cur};});
  TRIPS.forEach(t=>t.lines.forEach(l=>{if(!map[l.sup])map[l.sup]={n:l.sup,cat:l.type,country:l.cur==='USD'&&DESTS[t.dest].intl?'USA':DESTS[t.dest].country,cur:l.cur};}));
  const G=gapStats(TRIPS);
  return Object.values(map).map(s=>{const trips=new Set();let spend=0;TRIPS.filter(t=>t.stage!=='Quote').forEach(t=>{calc(t).lines.forEach(x=>{if(x.l.sup===s.n){trips.add(t.id);spend+=x.fc;}});});const gb=G.bySup[s.n];return {...s,trips:trips.size,spend:r2(spend),gaps:gb?gb.n:0,terms:s.cat==='Lodging'?30:s.cat==='Insurance'?0:s.cat==='Transport'?14:7};}).sort((a,b)=>b.spend-a.spend);
}
function vSuppliers(){
  const subs=[['bank',L('בנק ספקים','Supplier bank')],['prices',L('מחירון','Price list')],['import',L('ייבוא','Import')]];
  let body='';
  if(S.sub==='bank'){const sb=supplierBank();
    body=`<p class="muted">${L('ספקים מקובצים לקטגוריות שאתם מגדירים. שירותים מתומחרים לפי סוג, כך שאפשר להחליף ספק בלי לתמחר מחדש.','Suppliers are grouped into categories you define. Services are priced by type, so a supplier can be swapped without re-pricing.')}</p>
    <div class="row sec">${S.cats.map(c=>`<span class="pill blue">${tn(c)} (${sb.filter(s=>s.cat===c).length})</span>`).join('')}<input type="text" id="newcat" placeholder="${L('קטגוריה חדשה','New category')}" aria-label="${L('קטגוריה חדשה','New category')}" style="width:150px"><button class="btn sm" data-act="addcat">${L('הוסף','Add')}</button></div>
    <div class="scroll tall"><table class="tbl"><thead><tr><th>${L('ספק','Supplier')}</th><th>${L('קטגוריה','Category')}</th><th>${L('מדינה','Country')}</th><th>${L('מטבע','Currency')}</th><th class="n">${L('תנאי תשלום (ימים)','Payment terms (days)')}</th><th class="n">${L('תיקים','Files')}</th><th class="n">${L('הוצאה','Spend')}</th><th class="n">${L('פערי חשבוניות','Invoice gaps')}</th></tr></thead><tbody>${sb.map(s=>`<tr><td>${esc(s.n)}</td><td>${tn(s.cat)}</td><td>${esc(s.country)}</td><td>${s.cur}</td><td class="n">${s.terms}</td><td class="n">${s.trips}</td><td class="n">${usd(s.spend)}</td><td class="n">${s.gaps?pillF(s.gaps,'red'):'0'}</td></tr>`).join('')}</tbody></table></div>`;
  }else if(S.sub==='prices'){
    body=`<p class="muted">${L('עלויות לפי סוג שירות ויעד, במטבע של כל ספק. שורות מיובאות מופיעות בסוף.',"Costs by service type and destination, in each supplier's currency. Imported rows appear at the end.")}</p><div class="scroll tall"><table class="tbl"><thead><tr><th>${L('שירות','Service')}</th><th>${L('יעד','Destination')}</th><th>${L('קטגוריה','Category')}</th><th>${L('ספק','Supplier')}</th><th class="n">${L('עלות','Cost')}</th><th>${L('בסיס','Basis')}</th></tr></thead><tbody>${[...PRICELIST().map(p=>({...p,imp:false})),...S.priceExtra].map(p=>`<tr><td>${esc(p.svc)}${p.imp?' '+pillF(L('מיובא','Imported'),'blue'):''}</td><td>${p.dest?dn(p.dest):'-'}</td><td>${tn(p.cat)}</td><td>${esc(p.sup)}</td><td class="n">${money(p.cost,p.cur,2)}</td><td>${basisL(p.basis)}</td></tr>`).join('')}</tbody></table></div>`;
  }else body=vImport();
  return head(L('ספקים','Suppliers'))+`<div class="tabs">${subs.map(s=>`<button class="${S.sub===s[0]?'on':''}" data-act="sub" data-v="${s[0]}">${s[1]}</button>`).join('')}</div>${body}`;
}
function vActivities(){
  const rows=[];Object.entries(DESTS).forEach(([k,d])=>d.acts.forEach(a=>{const used=TRIPS.filter(t=>t.lines.some(l=>l.name===a[0])).length;rows.push(`<tr><td><span class="row"><span class="flag">${ic('activities')}</span><strong>${esc(a[0])}</strong></span></td><td>${dn(k)}</td><td>${esc(a[1])}</td><td class="n">${money(a[2],d.cur)}</td><td class="n">${usd(a[2]*BASE_RATE[d.cur])}</td><td class="n">${a[3]}%</td><td class="n">${a[4]}</td><td class="n">${used}</td></tr>`);}));
  return head(L('פעילויות','Activities'))+`<p class="muted">${L('קטלוג האתרים והפעילויות. כל אתר מביא איתו ספק, עלות לאדם, עמלה ומשך מוערך שמזין את בדיקת העומס ביום.','The catalog of sites and activities. Each one brings a supplier, cost per person, commission and an estimated duration that feeds the daily load check.')}</p><div class="card scroll tall" style="max-height:620px"><table class="tbl"><thead><tr><th>${L('אתר','Site')}</th><th>${L('יעד','Destination')}</th><th>${L('ספק','Supplier')}</th><th class="n">${L('עלות','Cost')}</th><th class="n">${L('בדולרים','In USD')}</th><th class="n">${L('עמלה','Commission')}</th><th class="n">${L('שעות','Hours')}</th><th class="n">${L('בטיולים','In trips')}</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
}
function vUsers(){
  const us=[['manager',MGR(),L('בעלים ומנהלת','Owner, manager'),L('רואה את כל התיקים, מאשרת הצעות ורואה את הכספים','Sees all files, approves quotes and sees finance')],...AGENTS.map(a=>[a,agn(a),L('סוכן/ת מכירות','Sales agent'),L('רואה ועורך/ת רק את התיקים שלו/ה','Sees and edits only their own files')])];
  return head(L('משתמשים','Users'))+`<p class="muted">${L('הרשאות לפי תפקיד. החלפת משתמש בטבלה משנה את מה שהמערכת מציגה.','Permissions by role. Switching user here changes what the system shows.')}</p><div class="card scroll"><table class="tbl"><thead><tr><th>${L('משתמש','User')}</th><th>${L('תפקיד','Role')}</th><th>${L('הרשאות','Permissions')}</th><th class="n">${L('תיקים','Files')}</th><th></th></tr></thead><tbody>${us.map(u=>`<tr><td><span class="row">${avatarOf(u[1])}${u[1]}</span></td><td>${u[2]}</td><td>${u[3]}</td><td class="n">${u[0]==='manager'?TRIPS.length:TRIPS.filter(t=>t.agent===u[0]).length}</td><td><button class="btn sm" data-act="as" data-v="${u[0]}">${L('צפה כמשתמש','View as this user')}</button></td></tr>`).join('')}</tbody></table></div>`;
}

/* ---------- import ---------- */
const MESSY=[['Evening show, group rate','$48.00 pp','min 20 pax, 1 comp per 20'],['Showboat dinner cruise','64','2026 rate?'],['Motorcoach 56 pax / day','1,180','+ driver room'],['Step-on guide (4h)','USD 240',''],['Hotel dbl / night','112.00 USD','tax 12.6% not incl.'],['Theme park ticket','72/pp','senior rate 68'],['Lunch buffet','18,5','currency?'],['Fuel surcharge','—','ask Jim']];
const CATS=[[/hotel|lodge|room|dbl/i,'Lodging'],[/coach|bus|transfer|shuttle|fuel/i,'Transport'],[/guide/i,'Guide'],[/dinner|lunch|meal|buffet/i,'Meals'],[/insur|protection/i,'Insurance'],[/./,'Activities']];
function parseRow(r){
  const raw=String(r[1]).trim(),note=String(r[2]||''),cat=CATS.find(c=>c[0].test(r[0]))[1];
  if(!raw||/^[—–-]+$/.test(raw))return {item:r[0],cat,ok:false,flag:L('אין מחיר בקובץ. יש לשאול את הספק.','No price in the file. Ask the supplier.')};
  let s=raw.match(/\d[\d.,]*/)[0];s=/^\d{1,3},\d{3}/.test(s)?s.replace(/,/g,''):s.replace(',','.');const num=parseFloat(s);
  const cur=/€|eur/i.test(raw)?'EUR':/\$|usd/i.test(raw)?'USD':null,per=/pp|per person/i.test(raw);
  let v=num,flag='';
  if(cur==='EUR'){v=r2(num*BASE_RATE.EUR);flag=L('מחיר ביורו, הומר לדולר בשער 1.08. לאשר מול הספק.','Price in EUR, converted to USD at 1.08. Confirm with the supplier.');}
  else if(!cur)flag=L('מטבע לא צוין. הונח דולר, צריך בדיקה.','Currency not stated. Assumed USD, needs a check.');
  if(/tax/i.test(note))flag=(flag?flag+' ':'')+L('מס לא כלול, להוסיף 12.6%.','Tax not included; add 12.6%.');
  if(/senior rate/i.test(note))flag=(flag?flag+' ':'')+L('שני תעריפים בקובץ. נלקח התעריף הרגיל, לבדוק תעריף גמלאים.','Two rates in the file. The standard rate was used; check the senior rate.');
  const basis=per?'person':/day/i.test(r[0])?'day':/night/i.test(r[0])?'room':'person';
  return {item:r[0],cat,ok:true,usd:v,basis,flag,warn:!!flag,comp:/comp/i.test(note)};
}
function vImport(){
  const raw=MESSY.map(r=>`<tr><td dir="ltr" style="text-align:left">${esc(r[0])}</td><td dir="ltr" style="text-align:left">${esc(r[1])}</td><td dir="ltr" style="text-align:left">${esc(r[2])}</td></tr>`).join('');
  let out='';
  if(S.ran){const p=MESSY.map(parseRow);
    out=`<div class="sec card"><h3>${L('התוצאה אחרי ניקוי','Result after cleaning')}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${L('פריט','Item')}</th><th>${L('קטגוריה','Category')}</th><th class="n">${L('עלות $','Cost $')}</th><th>${L('בסיס','Basis')}</th><th>${L('לבדיקה','Check')}</th></tr></thead><tbody>${p.map(x=>`<tr><td dir="ltr" style="text-align:left">${esc(x.item)}</td><td>${tn(x.cat)}</td><td class="n">${x.ok?usd(x.usd,2):'-'}</td><td>${x.ok?basisL(x.basis):'-'}</td><td>${x.flag?pillF(esc(x.flag),x.ok?'amber':'red'):pillF(L('נקי','Clean'),'green')}${x.comp?' '+pillF(L('נרשם: 1 חינם על 20','Saved: 1 comp per 20'),'blue'):''}</td></tr>`).join('')}</tbody></table></div>
    <div class="row" style="margin-top:12px"><span class="small muted">${L(`${p.filter(x=>x.ok).length} מתוך ${p.length} שורות ניתנות להוספה. שורות שדורשות בדיקה שומרות את הדגל, כדי שלא ינחשו בשקט. תנאי החינם נשמרים ונבדקים מול החשבונית.`,`${p.filter(x=>x.ok).length} of ${p.length} rows can be added. Rows that need a check keep their flag, so nothing is guessed silently. Comp terms are saved and checked against the invoice later.`)}</span><button class="btn pri" data-act="addpl" ${S.imported?'disabled':''}>${S.imported?L('נוסף למחירון','Added to price list'):L('הוסף למחירון','Add to price list')}</button></div></div>`;}
  return `<p class="muted">${L('החלק האיטי בקליטת לקוח הוא העלאת ההיסטוריה שלו. כאן מחירון מבולגן של ספק הופך לשורות מסודרות, וכל ספק מסומן.','The slow part of onboarding is loading the agency\'s history. Here a messy supplier rate sheet becomes clean rows, with every doubt flagged.')}</p>
  <div class="two"><div class="card"><h3>${L('קובץ שהועלה: Branson_rates_2027.xlsx','Uploaded file: Branson_rates_2027.xlsx')}</h3><div class="scroll"><table class="tbl"><thead><tr><th>${L('פריט','Item')}</th><th>${L('מחיר','Price')}</th><th>${L('הערות','Notes')}</th></tr></thead><tbody>${raw}</tbody></table></div><div style="margin-top:12px"><button class="btn pri" data-act="runimp">${S.ran?L('הרץ שוב','Run again'):ic('magic')+' '+L('נקה ומפה','Clean and map')}</button></div></div>
  <div class="card"><h3>${L('טיולי עבר (PDF ואקסל)','Past trips (PDF and Excel)')}</h3><p class="small muted">${L('דוגמה למה שדוח ייבוא היסטוריה מציג. המספרים להמחשה בלבד.','An example of what a history import shows. Illustrative numbers.')}</p><table class="tbl"><tbody><tr><td dir="ltr" style="text-align:left">Branson_trips_2025.xlsx</td><td>${L('6 טיולים, 84 שורות','6 trips, 84 rows')}</td></tr><tr><td dir="ltr" style="text-align:left">HolyLand_spring_2025.pdf</td><td>${L('10 ימים, 41 שורות','10 days, 41 rows')}</td></tr><tr><td dir="ltr" style="text-align:left">DC_students_2025.pdf</td><td>${L('5 ימים, 33 שורות','5 days, 33 rows')}</td></tr></tbody></table>
  <p class="small muted" style="margin:10px 0 0">${L('בונה הטיולים לומד מטיולים שיובאו, ולכן ההצעות מתאימות לסוכנות כבר בשבוע הראשון.','The trip builder learns from imported trips, so drafts fit the agency from the first week.')}</p></div></div>${out}`;
}

/* ---------- Maya: 25 questions ---------- */
const listL=a=>a.join('\n');
function buildDraft(q){
  let s=q.toLowerCase();const nm=s.match(/(\d+)\s*(?:לילות|לילה|nights?)/);s=s.replace(/(\d+)\s*(?:לילות|לילה|nights?)/,'');
  const num=(s.match(/(\d{1,3})/)||[])[1],pax=num?Math.min(90,Math.max(8,+num)):40;
  const seg=/church|parish|faith|pilgrim|כנסי|קהיל|עליה לרגל|עלייה לרגל/.test(s)?'Faith':/senior|club|bank|retire|גמלא|מועדון/.test(s)?'Senior':/choir|band|chorale|מקהל|להק/.test(s)?'Choir':/alumni|association|בוגר|איגוד/.test(s)?'Alumni':/student|school|grade|תלמיד|בית ספר/.test(s)?'Student':null;
  const KW=[['HolyLand',/holy land|israel|jerusalem|ארץ הקודש|ישראל|ירושלים/],['Rome',/rome|italy|assisi|רומא|איטליה/],['Greece',/greece|athens|corinth|יוון|אתונה/],['Ireland',/ireland|dublin|אירלנד/],['London',/london|england|oxford|לונדון|אנגליה/],['Niagara',/niagara|toronto|canada|ניאגרה|קנדה/],['Branson',/branson|ברנסון/],['Nashville',/nashville|נאשוויל/],['Washington',/washington|\bdc\b|וושינגטון/],['Canyon',/canyon|sedona|קניון/],['NewEngland',/new england|foliage|ניו אינגלנד|שלכת/]];
  let dest=(KW.find(k=>k[1].test(s))||[])[0];
  const sg=seg||(dest==='HolyLand'||dest==='Rome'||dest==='Greece'?'Faith':'Senior');
  if(!dest){const cnt={};TRIPS.filter(t=>t.seg===sg).forEach(t=>cnt[t.dest]=(cnt[t.dest]||0)+1);dest=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]||'Branson';}
  const nights=nm?+nm[1]:(DESTS[dest].intl?8:3),d=DESTS[dest],rate=BASE_RATE[d.cur];
  const tmp={markups:{...SEG[sg].mk},basis:'cost',rate,lines:genLines(sg,dest,pax,nights),disc:{},pax};
  const c=calc(tmp);
  const past=TRIPS.filter(t=>t.seg===sg&&t.stage!=='Quote').map(t=>{const x=calc(t);return x.fcProfit/x.rev;});
  return {seg:sg,dest,pax,nights,c,n:past.length,avg:past.length?past.reduce((a,b)=>a+b,0)/past.length:null,rate};
}
function draftAns(q){
  const b=buildDraft(q);S.draft=b;
  return {t:L(`טיוטה: ${b.pax} נוסעים, ${b.nights} לילות, ${dn(b.dest)} (${sn(b.seg)}). נבנתה לפי המבנה של ${b.n} טיולים קודמים מאותו סוג.\nמחיר ללקוח ${usd(b.c.rev)} (${usd(b.c.rev/b.pax)} לנוסע), עלות מתוכננת ${usd(b.c.plan)}, רווח מתוכנן ${usd(b.c.planProfit)} (${pct(b.c.planProfit/b.c.rev)}).\n${b.avg!=null?`טיולים קודמים מהסוג הזה הגיעו ל-${pct(b.avg)} בממוצע אחרי חשבוניות, אז התכנון הזה ${b.c.planProfit/b.c.rev>b.avg?'מעל':'מתחת'} לממוצע.`:''}`,
    `Draft: ${b.pax} travelers, ${b.nights} nights, ${dn(b.dest)} (${sn(b.seg)}). Built from the structure of ${b.n} past trips of the same type.\nClient price ${usd(b.c.rev)} (${usd(b.c.rev/b.pax)} per traveler), planned cost ${usd(b.c.plan)}, planned profit ${usd(b.c.planProfit)} (${pct(b.c.planProfit/b.c.rev)}).\n${b.avg!=null?`Past trips of this type landed at ${pct(b.avg)} on average after invoices, so this plan is ${b.c.planProfit/b.c.rev>b.avg?'above':'below'} that.`:''}`),btn:{label:L('צור הצעה מהטיוטה','Create quote from draft'),act:'createq'}};
}
const booked=()=>visibleTrips().filter(t=>t.stage!=='Quote');
const gapLine=x=>`${x.t.name}: ${x.l.sup}, ${kindL(kindOf(x.l,x.s))} ${sgn(x.orig,v=>usd(v))}`;
const QS=[
 {g:0,he:'איפה יש פערי חשבוניות פתוחים כרגע?',en:'Where are the open invoice gaps right now?',r:/gap|overbill|invoice|פער|חשבונ/,f:()=>{const G=gapStats(visibleTrips()),op=G.list.filter(x=>isOpenGap(x.s)&&x.usd>0).sort((a,b)=>b.usd-a.usd),un=visibleTrips().filter(t=>t.inbox.length);
   return {t:L(`${op.length} פערים פתוחים בסך ${usd(r2(G.open+G.disp))}. הגדולים:\n`,`${op.length} open gaps worth ${usd(r2(G.open+G.disp))}. The largest:\n`)+listL(op.slice(0,6).map(gapLine))+(un.length?L(`\nבנוסף, ${un.reduce((a,t)=>a+t.inbox.length,0)} חשבוניות של ${un[0].name} עוד לא נקראו.`,`\nAlso, ${un.reduce((a,t)=>a+t.inbox.length,0)} invoices for ${un[0].name} have not been read yet.`):''),btn:{label:L('לבקרת החשבוניות','Open invoice check'),act:'go',v:'gaps'}};}},
 {g:0,he:'איזה ספק מחייב אותנו ביתר הכי הרבה?',en:'Which supplier overbills us the most?',r:/(supplier|ספק).*(overbill|most|ביתר|הכי)|overbills/,f:()=>{const G=gapStats(visibleTrips()),e=Object.entries(G.bySup).sort((a,b)=>b[1].amt-a[1].amt).slice(0,3);
   if(!e.length)return {t:L('לא נמצאו חיובי יתר.','No overbilling found.')};
   const v0=e[0][1];return {t:L(`${e[0][0]} מוביל: ${v0.n===1?'פער אחד':v0.n+' פערים'} ב-${v0.trips.size===1?'טיול אחד':v0.trips.size+' טיולים'}, ${usd(e[0][1].amt)} בסך הכל, ${usd(e[0][1].rec)} כבר הוחזרו.\nאחריו:\n`,`${e[0][0]} leads: ${v0.n} gap${v0.n>1?'s':''} across ${v0.trips.size} trip${v0.trips.size>1?'s':''}, ${usd(e[0][1].amt)} in total, ${usd(e[0][1].rec)} already recovered.\nNext:\n`)+listL(e.slice(1).map(([k,v])=>`${k}: ${v.n} ${v.n>1?L('פערים','gaps'):L('פער','gap')}, ${usd(v.amt)}`))+L('\nכדאי להעלות את זה בחידוש החוזה.','\nWorth raising when you renew the contract.')};}},
 {g:0,he:'כמה החזרנו מספקים העונה?',en:'How much have we recovered from suppliers this season?',r:/recover|credit|החזר|זיכו/,f:()=>{const G=gapStats(visibleTrips());
   return {t:L(`${usd(G.rec)} הוחזרו ב-${G.recN} זיכויים. עוד ${usd(G.disp)} בדרישות זיכוי שנשלחו (${G.dispN}), ו-${usd(G.open)} בפערים פתוחים שעוד לא טופלו (${G.openN}).`,`${usd(G.rec)} recovered in ${G.recN} credit${(G.recN)===1?'':'s'}. Another ${usd(G.disp)} is in disputes already sent (${G.dispN}), and ${usd(G.open)} sits in open gaps nobody has handled yet (${G.openN}).`)};}},
 {g:0,he:'אילו טיולים שחזרו עדיין חסרות להם חשבוניות?',en:'Which returned trips are still missing invoices?',r:/missing|חסר/,f:()=>{const ts=booked().filter(t=>t.stage==='Finance'||t.stage==='Closed').map(t=>{const ib=inboxIds(t);return {t,m:[...new Set(t.lines.filter(l=>!l.extra&&!l.inv&&!ib.has(l.id)).map(l=>l.sup))],q:t.inbox.length};}).filter(x=>x.m.length||x.q);
   return {t:ts.length?L('בטיולים שחזרו:\n','On returned trips:\n')+listL(ts.map(x=>`${x.t.name}: `+[x.m.length?L('חסרות חשבוניות מ-','missing invoices from ')+x.m.join(', '):'',x.q?L(`${x.q} חשבוניות בתיבה עוד לא נקראו`,`${x.q} invoices in the inbox not read yet`):''].filter(Boolean).join('; ')))+L('\nבקשו אותן לפני סגירת התיק, כדי שלא יגיעו אחרי שהרווח דווח.','\nAsk for them before closing the file, so they do not arrive after profit is reported.'):L('אין חשבוניות חסרות בטיולים שחזרו.','No missing invoices on returned trips.')};}},
 {g:0,he:'האם ספק שלח חשבונית כפולה?',en:'Did any supplier send a duplicate invoice?',r:/duplicate|כפול/,f:()=>{const d=gapStats(visibleTrips()).list.filter(x=>x.s.kind==='dup');
   return {t:d.length?L(`${d.length===1?'חשבונית כפולה אחת':d.length+' חשבוניות כפולות'}:\n`,`${d.length} duplicate invoice${d.length>1?'s':''}:\n`)+listL(d.map(x=>`${x.t.name}: ${x.l.sup}, ${x.l.inv.no} ${usd(x.orig)} (${L(GST[x.s.k==='credited'?'credited':x.s.st][0],GST[x.s.k==='credited'?'credited':x.s.st][1])})`)):L('לא נמצאו חשבוניות כפולות.','No duplicate invoices found.')};}},
 {g:0,he:'אילו מלונות חייבו יותר חדרים מרשימת החדרים?',en:'Which hotels billed more rooms than the rooming list?',r:/room.*(rooming|more|extra)|more rooms|חדרים.*(רשימת|יותר)/,f:()=>{const d=gapStats(visibleTrips()).list.filter(x=>kindOf(x.l,x.s)==='rooms');
   return {t:d.length?listL(d.map(x=>`${x.t.name}: ${x.l.sup}, ${L(`${Math.round(x.l.inv.qty/x.t.nights)} חדרים חויבו מול ${Math.round(x.l.qty/x.t.nights)} ברשימה`,`${Math.round(x.l.inv.qty/x.t.nights)} rooms billed vs ${Math.round(x.l.qty/x.t.nights)} on the list`)}, ${usd(x.orig)}`)):L('אף מלון לא חייב מעבר לרשימת החדרים.','No hotel billed beyond the rooming list.')};}},
 {g:0,he:'האם הוחלה הטבת החינם לקבוצה (1 על כל 20)?',en:'Were group comps (1 free per 20) applied?',r:/comp|free per|1 free|חינם/,f:()=>{const ls=[];booked().forEach(t=>t.lines.forEach(l=>{if(l.type==='Activities'&&l.unit==='person'&&l.inv&&t.pax>=20)ls.push({t,l,s:invStatus(l)});}));
   const bad=ls.filter(x=>x.s.kind==='comp'),dr=gapStats(visibleTrips()).list.filter(x=>x.s.kind==='comp'&&x.l.cost===0);
   return {t:L(`נבדקו ${ls.length} חשבוניות כרטיסים בקבוצות של 20 ומעלה. ב-${bad.length} מהן ההטבה לא יושמה`,`Checked ${ls.length} ticket invoices for groups of 20 or more. In ${bad.length} the comp was not applied`)+(bad.length?':\n'+listL(bad.map(x=>`${x.t.name}: ${x.l.sup}`)):'.')+(dr.length?L(`\nבנוסף, ${dr.length} חדרי נהג "חינם" חויבו.`,`\nAlso, ${dr.length} "complimentary" driver rooms were billed.`):'')};}},
 {g:1,he:'איך יצא טיול השלכת בניו אינגלנד מול התכנון?',en:'How did New England Fall Foliage do against plan?',r:/against plan|vs\.? plan|מול התכנון|מול תכנון|new england|ניו אינגלנד|how did/,f:()=>{const cur=T(),t=cur&&cur.stage!=='Quote'&&S.tab==='trip'?cur:byId('nen');if(!t||!canSee(t))return {t:L('אין לך גישה לטיול הזה.','You do not have access to that trip.')};
   const c=calc(t),g=tripGaps(t).filter(x=>isOpenGap(x.s)&&x.usd>0),ga=r2(g.reduce((a,x)=>a+x.usd,0));
   return {t:L(`${t.name}: רווח מתוכנן ${usd(c.planProfit)} (${pct(c.planProfit/c.rev)}), צפוי ${usd(c.fcProfit)} (${pct(c.fcProfit/c.rev)}).\nסכומי ספקים מעל ההצעה: ${usd(c.amtDiff)}. עמלות: ${usd(c.comm)}.`,`${t.name}: planned profit ${usd(c.planProfit)} (${pct(c.planProfit/c.rev)}), expected ${usd(c.fcProfit)} (${pct(c.fcProfit/c.rev)}).\nSupplier amounts above quote: ${usd(c.amtDiff)}. Commission: ${usd(c.comm)}.`)+(t.inbox.length?L(`\n${t.inbox.length} חשבוניות עוד לא נקראו, אז התמונה חלקית.`,`\n${t.inbox.length} invoices are not read yet, so the picture is partial.`):'')+(ga?L(`\n${g.length} פערים פתוחים (${usd(ga)}). אם יזוכו, הרווח יעלה ל-${usd(c.fcProfit+ga)}.`,`\n${g.length} open gaps (${usd(ga)}). If credited, profit rises to ${usd(c.fcProfit+ga)}.`):''),btn:{label:L('פתח את בקרת החשבוניות של הטיול','Open the trip invoice check'),act:'open',v:t.id+'|tfin'}};}},
 {g:1,he:'אילו טיולים מתחת לקו שולי הרווח?',en:'Which trips are below the margin line?',r:/margin|below the line|שולי|מתחת לקו/,f:()=>{const P=portfolio(visibleTrips()),low=P.rows.filter(r=>r.fp/r.c.rev*100<S.thresh);
   return {t:low.length?L(`טיולים מתחת לקו ${S.thresh}%:\n`,`Trips below the ${S.thresh}% line:\n`)+listL(low.map(r=>`${r.t.name}: ${pct(r.fp/r.c.rev)}`)):L(`אף טיול שהוזמן לא מתחת ל-${S.thresh}%. הנמוך: ${P.rows.map(r=>r.fp/r.c.rev).sort((a,b)=>a-b).map(pct)[0]}.`,`No booked trip is below ${S.thresh}%. The lowest is ${P.rows.map(r=>r.fp/r.c.rev).sort((a,b)=>a-b).map(pct)[0]}.`)};}},
 {g:1,he:'מה הרווח הצפוי בטיולים שהוזמנו?',en:'What is our expected profit on booked trips?',r:/profit|רווח/,f:()=>{const P=portfolio(visibleTrips()),G=gapStats(visibleTrips());
   return {t:L(`ב-${P.rows.length} טיולים שהוזמנו: הכנסות ${usd(P.rev)}, רווח צפוי ${usd(P.fp)} (${pct(P.fp/P.rev)}) מול ${usd(P.pp)} מתוכנן.\nלנוסע: ${usd(P.fp/P.pax)}. פערים פתוחים שאפשר עוד להחזיר: ${usd(r2(G.open+G.disp))}.`,`Across ${P.rows.length} booked trips: revenue ${usd(P.rev)}, expected profit ${usd(P.fp)} (${pct(P.fp/P.rev)}) against ${usd(P.pp)} planned.\nPer traveler: ${usd(P.fp/P.pax)}. Open gaps you can still recover: ${usd(r2(G.open+G.disp))}.`)};}},
 {g:1,he:'מי מאחר בתשלום?',en:'Who is late paying?',r:/late|owe|איחור|מאחר/,f:()=>{const P=portfolio(visibleTrips()),top=[...P.lateGroups].sort((a,b)=>b.g.late-a.g.late).slice(0,5);
   return {t:P.lateN?L(`${P.lateN} משקי בית באיחור, ${usd(P.late)} בסך הכל. הגדולים:\n`,`${P.lateN} households are late, ${usd(P.late)} in total. The largest:\n`)+listL(top.map(x=>`${x.g.name}, ${x.t.name}: ${usd(x.g.late)}, ${L(x.g.days+' ימים',x.g.days+' days')}`)):L('אף אחד לא מאחר.','Nobody is late.'),btn:P.lateN?{label:L('שלח תזכורות','Send reminders'),act:'toast',v:L('תזכורות תשלום נשלחו','Payment reminders sent')}:null};}},
 {g:1,he:'אילו מקדמות ויתרות צריכות להיכנס ב-30 הימים הקרובים?',en:'Which deposits and balances are due in the next 30 days?',r:/due|30 days|deposit|balance|מקדמ|יתרות|30 הימים/,f:()=>{const lim=new Date(TODAY.getTime()+30*DAY),out=[];
   booked().forEach(t=>{const g=groupsCalc(t);let a=0;g.rows.forEach(r=>{if(!r.depPaid&&D(t.depDue)>=TODAY&&D(t.depDue)<=lim)a+=r.dep;if(!r.balPaid&&D(t.balDue)>=TODAY&&D(t.balDue)<=lim)a+=r.bal;});if(a)out.push([t,r2(a)]);});
   return {t:out.length?L('צפוי להיכנס ב-30 הימים הקרובים:\n','Due in the next 30 days:\n')+listL(out.map(([t,a])=>`${t.name}: ${usd(a)}`))+`\n${L('סה"כ','Total')}: ${usd(out.reduce((s,x)=>s+x[1],0))}`:L('אין תשלומים שמועדם ב-30 הימים הקרובים. מה שבאיחור מופיע בשאלה "מי מאחר בתשלום".','Nothing falls due in the next 30 days. Overdue amounts are under "Who is late paying".')};}},
 {g:1,he:'מה התזרים בשלושת החודשים הקרובים?',en:'What is the cash flow over the next three months?',r:/cash|תזרים/,f:()=>{const P=portfolio(visibleTrips()),a=MONTHS.slice(0,3),inn=a.reduce((x,k)=>x+P.cash[k].in,0),out=a.reduce((x,k)=>x+P.cash[k].out,0);
   return {t:L(`שלושת החודשים הקרובים (${a.map(monthLabel).join(', ')}): ${usd(inn)} צפויים מלקוחות, ${usd(out)} לתשלום לספקים, נטו ${sgn(r2(inn-out),v=>usd(v))}.`,`Next three months (${a.map(monthLabel).join(', ')}): ${usd(inn)} expected from clients, ${usd(out)} to pay suppliers, net ${sgn(r2(inn-out),v=>usd(v))}.`)};}},
 {g:1,he:'מה החשיפה שלנו לשער חליפין?',en:'What is our exchange-rate exposure?',r:/exchange|currency|\bfx\b|euro|שער|מטבע|יורו/,f:()=>{const P=portfolio(visibleTrips()),ks=Object.keys(P.fxExp),tot=Object.values(P.fxExp).reduce((x,e)=>x+e.usd,0);
   return {t:ks.length?L(`נותר לשלם כ-${usd(tot)} לספקים במטבע זר (${ks.map(k=>k+' '+money(P.fxExp[k].amt,k)).join(', ')}). התחזקות של 5% תעלה כ-${usd(tot*.05)} מהרווח. כל השאר בדולרים.`,`About ${usd(tot)} is still owed to suppliers in foreign currency (${ks.map(k=>k+' '+money(P.fxExp[k].amt,k)).join(', ')}). A 5% rise would cost about ${usd(tot*.05)} of profit. Everything else is in USD.`):L('אין חשיפה, כל הספקים בדולרים.','No exposure; every supplier bills in USD.')};}},
 {g:2,he:'אילו הצעות ממתינות ללקוח יותר משבועיים?',en:'Which quotes have waited more than two weeks for the client?',r:/two weeks|waited|waiting.*client|שבועיים|ממתינות ללקוח/,f:()=>{const q=visibleTrips().filter(t=>t.stage==='Quote'&&t.qst==='Sent'&&t.qdays>14);
   return {t:q.length?listL(q.map(t=>L(`${t.name}: נשלחה לפני ${t.qdays} ימים, ${usd(calc(t).rev)}. ${agn(t.agent)} אחראי/ת.`,`${t.name}: sent ${t.qdays} days ago, ${usd(calc(t).rev)}. Owner: ${agn(t.agent)}.`)))+L('\nכדאי שיחת מעקב השבוע.','\nWorth a follow-up call this week.'):L('אין הצעות שממתינות יותר משבועיים.','No quote has waited more than two weeks.')};}},
 {g:2,he:'אילו הצעות ממתינות לאישור שלי?',en:'Which quotes are waiting for my approval?',r:/approv|לאישור/,f:()=>{const q=visibleTrips().filter(t=>t.stage==='Quote'&&t.qst==='Approval');
   if(S.role!=='manager')return {t:L('רק מנהל מאשר הצעות. ההצעות שלך שממתינות: ','Only a manager approves quotes. Your quotes waiting: ')+(q.map(t=>t.name).join(', ')||L('אין','none'))+'.'};
   return {t:q.length?listL(q.map(t=>{const c=calc(t);return L(`${t.name}: ${usd(c.rev)}, רווח מתוכנן ${pct(c.planProfit/c.rev)}, ${agn(t.agent)}.`,`${t.name}: ${usd(c.rev)}, planned margin ${pct(c.planProfit/c.rev)}, from ${agn(t.agent)}.`);})):L('אין הצעות שממתינות לאישור.','Nothing is waiting for approval.'),btn:q.length?{label:L('פתח לאישור','Open for approval'),act:'open',v:q[0].id+'|approve'}:null};}},
 {g:2,he:'מה שיעור ההמרה מהצעה להזמנה לפי סוכן?',en:'What is our quote-to-booking rate by agent?',r:/conversion|quote-to-booking|booking rate|המרה/,f:()=>{const ag=AGENTS.filter(a=>S.role==='manager'||a===S.role).map(a=>{const x=TRIPS.filter(t=>t.agent===a),w=x.filter(t=>t.stage!=='Quote').length;return [a,w,x.length];}).sort((a,b)=>b[1]/b[2]-a[1]/a[2]);
   return {t:listL(ag.map(([a,w,n])=>`${agn(a)}: ${w}/${n} (${Math.round(w/n*100)}%)`))+L('\nכולל הצעות פתוחות, כך שהשיעור יעלה ככל שייסגרו.','\nOpen quotes are included, so rates rise as they close.')};}},
 {g:2,he:'מי הסוכן המוביל לפי רווח צפוי?',en:'Who is our top agent by expected profit?',r:/top agent|best agent|מוביל/,f:()=>{const m={};booked().forEach(t=>{const c=calc(t);m[t.agent]=r2((m[t.agent]||0)+c.fcProfit);});const e=Object.entries(m).sort((a,b)=>b[1]-a[1]);
   return {t:e.length?L(`${agn(e[0][0])} מוביל/ה עם ${usd(e[0][1])} רווח צפוי בטיולים שהוזמנו.\n`,`${agn(e[0][0])} leads with ${usd(e[0][1])} expected profit on booked trips.\n`)+listL(e.slice(1).map(([a,v])=>`${agn(a)}: ${usd(v)}`)):L('אין עדיין טיולים שהוזמנו.','No booked trips yet.')};}},
 {g:3,he:'לאילו יציאות ב-60 הימים הקרובים יש משימות באיחור?',en:'Which departures in the next 60 days have overdue tasks?',r:/task|משימ/,f:()=>{const ts=visibleTrips().filter(t=>t.stage==='Operations'&&(D(t.dep)-TODAY)/DAY<=60&&D(t.dep)>=TODAY).map(t=>({t,od:t.tasks.filter(x=>!x.done&&D(x.due)<TODAY)})).filter(x=>x.od.length);
   return {t:ts.length?listL(ts.map(x=>L(`${x.t.name} (בעוד ${Math.round((D(x.t.dep)-TODAY)/DAY)} ימים): ${x.od.map(o=>o.t).join('; ')}`,`${x.t.name} (in ${Math.round((D(x.t.dep)-TODAY)/DAY)} days): ${x.od.map(o=>o.t).join('; ')}`))):L('אין משימות באיחור ביציאות הקרובות.','No overdue tasks on upcoming departures.'),btn:ts.length?{label:L('פתח תפעול','Open operations'),act:'open',v:ts[0].t.id+'|ops'}:null};}},
 {g:3,he:'אילו ספקים עוד לא אישרו?',en:'Which suppliers have not confirmed yet?',r:/confirm|אישרו/,f:()=>{const out=[];visibleTrips().filter(t=>t.stage==='Operations').forEach(t=>t.sups.filter(s=>s.st!=='Confirmed').forEach(s=>out.push([t,s])));
   return {t:out.length?L(`${out.length} ספקים בלי אישור:\n`,`${out.length} suppliers without a confirmation:\n`)+listL(out.slice(0,8).map(([t,s])=>`${t.name}: ${s.n} (${supn(s.st)})`)):L('כל הספקים אישרו.','Every supplier has confirmed.')};}},
 {g:3,he:'כמה נוסעים בטיולים הקרובים עם צרכי תזונה?',en:'How many travelers on upcoming trips have dietary needs?',r:/diet|vegetarian|gluten|תזונה|צמחונ/,f:()=>{const c={};let n=0;visibleTrips().filter(t=>t.stage==='Operations').forEach(t=>t.trav.forEach(x=>{if(x.diet!=='None'){n++;c[x.diet]=(c[x.diet]||0)+1;}}));
   return {t:L(`${n} נוסעים בטיולים בתפעול: `,`${n} travelers on trips in operations: `)+Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${dietn(k)} ${v}`).join(', ')+L('. הרשימה נשלחת למסעדות 14 יום לפני היציאה.','. The list goes to restaurants 14 days before departure.')};}},
 {g:3,he:'איפה אפשר לשחרר חדרים לא מנוצלים במלונות?',en:'Where can we release unused hotel rooms?',r:/release|unused|לשחרר|לא מנוצל/,f:()=>{const ts=visibleTrips().filter(t=>t.stage==='Operations'&&t.room.held>t.room.used);
   return {t:ts.length?listL(ts.map(t=>{const rd=addDays(t.dep,-30),past=D(rd)<TODAY,n=t.room.held-t.room.used;return past?L(`${t.name}: ${n} חדרים ב-${t.room.hotel}. מועד השחרור עבר ב-${fmtDate(rd)}, אז צפוי חיוב עליהם. כדאי לבקש מהמלון גמישות עכשיו.`,`${t.name}: ${n} rooms at ${t.room.hotel}. The release date passed on ${fmtDate(rd)}, so expect to be billed for them. Ask the hotel for flexibility now.`):L(`${t.name}: ${n} חדרים ב-${t.room.hotel}, לשחרר עד ${fmtDate(rd)}`,`${t.name}: ${n} rooms at ${t.room.hotel}, release by ${fmtDate(rd)}`);}))+L('\nחדר שלא משוחרר בזמן חוזר אחר כך כפער בחשבונית.','\nA room not released in time comes back later as an invoice gap.'):L('אין חדרים לשחרור.','No rooms to release.')};}},
 {g:4,he:'איזה יעד מרוויח הכי הרבה לנוסע?',en:'Which destination earns the most per traveler?',r:/destination|יעד/,f:()=>{const P=portfolio(visibleTrips()),e=Object.entries(P.byDest).sort((a,b)=>b[1].fp/b[1].pax-a[1].fp/a[1].pax);
   return {t:listL(e.slice(0,5).map(([k,v])=>`${dn(k)}: ${usd(v.fp/v.pax)} ${L('לנוסע','per traveler')} (${pct(v.fp/v.rev)}, ${v.n>1?v.n+' '+L('טיולים','trips'):L('טיול אחד','1 trip')})`))};}},
 {g:4,he:'הכן טיוטה לעלייה לרגל לארץ הקודש ל-40 חברי קהילה, 9 לילות',en:'Draft a Holy Land pilgrimage for 40 church members, 9 nights',draft:1},
 {g:4,he:'הכן טיוטה לברנסון למועדון גמלאים של 45 איש, 3 לילות',en:'Draft a Branson trip for a 45-person senior club, 3 nights',draft:1}
];
QS.forEach((q,i)=>{q.id=i+1;if(q.draft)q.f=()=>draftAns(L(q.he,q.en));});
const QORDER=[5,6,7,4,3,2,8,9,15,16,17,18,19,20,21,22,23,12,11,13,14,1,10];
const QG=[['חשבוניות וספקים','Invoices & suppliers'],['רווח ותזרים','Profit & cash'],['מכירות','Sales'],['תפעול','Operations'],['תכנון','Planning']];
function answerText(txt){
  const s=txt.toLowerCase();
  if(/draft|build|plan a trip|הכן|טיוטה|תכנן/.test(s)&&/\d/.test(s))return draftAns(txt);
  const q=QORDER.map(i=>QS[i-1]).find(q=>q.r.test(s));
  if(q)return q.f();
  return {t:L('אני עונה מהנתונים של הסוכנות. אפשר לשאול על פערי חשבוניות, ספקים, רווחיות, תשלומים, תזרים, משימות, או לבקש טיוטה כמו "הכן טיוטה לברנסון ל-45 גמלאים, 3 לילות".','I answer from your agency data. Ask about invoice gaps, suppliers, margins, payments, cash flow or tasks, or ask for a draft like "Draft a Branson trip for 45 seniors, 3 nights".')};
}
function askQ(q){S.chat.push({r:'u',t:L(q.he,q.en)},{r:'a',...q.f()});}
function askText(txt){S.chat.push({r:'u',t:txt},{r:'a',...answerText(txt)});}
function vAI(){
  if(!visibleTrips().length)return noTrip();
  const groups=QG.map((g,i)=>`<div class="qg"><div class="small muted" style="font-weight:600;margin-bottom:6px">${L(g[0],g[1])}</div><div class="row" style="gap:6px">${QS.filter(q=>q.g===i).map(q=>`<button class="btn sm chip" data-act="ask" data-v="${q.id}">${esc(L(q.he,q.en))}</button>`).join('')}</div></div>`).join('');
  return head(`<span class="row" style="gap:10px">${chenAv(40)}${L('מאיה, העוזרת החכמה','Maya, your AI assistant')}</span>`,`${pillF(L(`תסריט מוכן: ${QS.length} שאלות`,`Scripted: ${QS.length} questions`),'teal')}${S.chat.length?`<button class="btn sm" data-act="clearchat">${L('נקה שיחה','Clear chat')}</button>`:''}`)+`<p class="muted">${L('מאיה עונה מהנתונים שבדמו, בעברית או באנגלית. במוצר מאיה תענה מהיסטוריית הטיולים והחשבוניות של הסוכנות.','Maya answers from the data in this demo, in English or Hebrew. In the product, Maya answers from the agency\'s own trip and invoice history.')}</p>
  <div class="qgs sec">${groups}</div>
  <div class="chat">${chatLog()||`<div class="msg a"><div class="who">${chenAv(22)} ${L('מאיה','Maya')}</div>${L('היי, אני מאיה. בחרו שאלה למעלה או כתבו חופשי.','Hi, I am Maya. Pick a question above or type your own.')}</div>`}</div>
  <form data-form="ask" class="row"><input type="text" name="q" placeholder="${L('שאלו את מאיה...','Ask Maya...')}" style="flex:1;min-width:200px" aria-label="${L('שאלה','Question')}"><button class="btn pri" type="submit">${L('שלח','Send')}</button></form>`;
}

const VIEWS={home:vHome,quotes:vQuotes,templates:vTemplates,hotels:vHotels,suppliers:vSuppliers,activities:vActivities,users:vUsers,gaps:vGaps,finance:vFinance,ai:vAI};

/* ---------- actions ---------- */
function winQuote(t){
  const R=rng(9000+t.id.length*31+S.nid++);
  t.stage='Operations';t.qst='';
  t.groups=genGroups(t.seg,t.pax,R);t.groups.forEach(g=>{g.depPaid=false;g.balPaid=false;});
  t.tasks=genTasks(t,R).map(x=>({...x,done:false}));
  t.sups=genSups(t.lines,'Operations',R).map(s=>({...s,st:'Sent'}));
  t.trav=genTravelers(t,rng(Math.floor(R()*1e6)));
  const rooms=Math.round(t.lines[0].qty/t.nights);t.room={hotel:t.lines[0].sup,held:rooms+3,used:rooms};
}
function blankQuote(o){
  const R=rng(7000+S.nid++),d=DESTS[o.dest],id='n'+(S.nid++);
  const t={id,no:3300+S.nid,name:o.name,dest:o.dest,client:o.client||L('לקוח חדש','New client'),ctype:o.ctype||'Prospect',seg:o.seg,agent:o.agent,pax:o.pax,dep:addDays(iso(TODAY),210),nights:o.nights,stage:'Quote',qst:'Draft',qdays:0,cur:d.cur,rate:BASE_RATE[d.cur],basis:'cost',markups:{...SEG[o.seg].mk},disc:{},inbox:[],
    pct:25,depDue:addDays(iso(TODAY),60),balDue:addDays(iso(TODAY),150),lines:genLines(o.seg,o.dest,o.pax,o.nights),items:genItems(o.dest,o.nights,R),groups:[],trav:[],tasks:[]};
  t.sups=genSups(t.lines,'Quote',R);t.room={hotel:t.lines[0].sup,held:0,used:0};TRIPS.push(t);return t;
}
const agentNow=()=>S.role==='manager'?'Priya':S.role;
function openTrip(id,pt){S.tripId=id;S.tab='trip';S.ptab=pt||'costs';S.openDay=1;S.disp=null;}
function gapLineOf(v){const [tid,lid]=v.split('|');const t=byId(tid);return {t,l:t&&t.lines.find(x=>String(x.id)===lid)};}
document.addEventListener('click',e=>{
  if(S.menu&&!e.target.closest('.mwrap')){S.menu=false;render();}
  const b=e.target.closest('[data-act]');if(!b)return;
  if(b.tagName==='A')e.preventDefault();
  const a=b.dataset.act,v=b.dataset.v,t=T();
  if(a==='go'){S.tab=v;S.menu=false;render();window.scrollTo(0,0);}
  else if(a==='open'){const p=(v||'').split('|');openTrip(p[0],b.dataset.pt||p[1]);render();window.scrollTo(0,0);}
  else if(a==='pt'){S.ptab=v;S.disp=null;render();window.scrollTo(0,0);}
  else if(a==='qtab'){S.qtab=v;S.page=0;render();}
  else if(a==='pg'){S.page=Math.max(0,S.page+(+v));render();}
  else if(a==='sub'){S.sub=v;render();}
  else if(a==='day'){S.openDay=S.openDay===+v?-1:+v;render();}
  else if(a==='tt'){S.openT[v]=!S.openT[v];render();}
  else if(a==='basis'){t.basis=v;render();}
  else if(a==='dm'){S.docMode=v;render();}
  else if(a==='as'){S.role=v;S.fAgent='All';render();toast(L('מוצג כמשתמש אחר','Now viewing as another user'));}
  else if(a==='toast'){toast(v);}
  else if(a==='cyc'){const s=t.sups[+v],o=['Sent','Confirmed','No reply'];s.st=o[(o.indexOf(s.st)+1)%3];render();}
  else if(a==='copymsg'){const pre=document.querySelector('#view pre');copy(pre?pre.textContent:'');}
  else if(a==='link'){copy('https://pay.redbudtours.example/'+v.toLowerCase());}
  else if(a==='runimp'){S.ran=true;render();}
  else if(a==='addpl'){MESSY.map(parseRow).filter(x=>x.ok).forEach(x=>S.priceExtra.push({svc:x.item+(x.warn?' (check)':''),dest:'Branson',cat:x.cat,sup:'Imported: Branson rates',cur:'USD',cost:x.usd,basis:x.basis,imp:true}));S.imported=true;S.sub='prices';render();toast(L('השורות נוספו למחירון','Rows added to the price list'));}
  else if(a==='ask'){const q=QS[+v-1];if(q)askQ(q);render();const c=document.querySelector('.cb');if(c)c.scrollTop=c.scrollHeight;}
  else if(a==='clearchat'){S.chat=[];render();}
  else if(a==='chen'){S.chen=!S.chen;render();}
  else if(a==='win'){winQuote(byId(v));openTrip(v,'ops');render();window.scrollTo(0,0);toast(L('ההצעה אושרה. התיק נפתח לתפעול.','Quote accepted. The file is open for operations.'));}
  else if(a==='qs'){t.qst=v;t.qdays=0;render();toast(v==='Sent'?L('ההצעה אושרה ונשלחה ללקוח','Quote approved and sent to the client'):L('הסטטוס עודכן','Status updated'));}
  else if(a==='dup'){const s=byId(v);const c=blankQuote({name:s.name.replace(/ 20\d\d$/,'')+' '+(+s.dep.slice(0,4)+1),dest:s.dest,seg:s.seg,pax:s.pax,nights:s.nights,agent:S.role==='manager'?s.agent:S.role,client:s.client,ctype:s.ctype});
    c.lines=s.lines.filter(l=>!l.extra).map(l=>({...l,inv:null}));c.items=s.items.map(i=>({...i}));c.markups={...s.markups};c.rate=s.rate;c.dep=addDays(s.dep,364);c.depDue=addDays(c.dep,-150);c.balDue=addDays(c.dep,-60);
    openTrip(c.id,'plan');render();window.scrollTo(0,0);toast(L('שוכפל כהצעה חדשה','Duplicated as a new quote'));}
  else if(a==='newq'){const c=blankQuote({name:L('טיול חדש','New trip'),dest:'Branson',seg:'Senior',pax:44,nights:3,agent:agentNow()});openTrip(c.id,'general');render();window.scrollTo(0,0);toast(L('נוצרה הצעה חדשה','New quote created'));}
  else if(a==='createq'&&S.draft){const d=S.draft;const c=blankQuote({name:`${DESTS[d.dest].en}: ${SEGE[d.seg]} (draft)`,dest:d.dest,seg:d.seg,pax:d.pax,nights:d.nights,agent:agentNow()});S.draft=null;S.chen=false;openTrip(c.id,'costs');render();window.scrollTo(0,0);toast(L('נוצרה טיוטת הצעה','Draft quote created'));}
  else if(a==='addtpl'){const tp=allTpl()[+v];if(!tp)return;let id=Math.max(0,...t.items.map(i=>i.id));const day=S.openDay>0?S.openDay:1;tp.items.forEach(x=>t.items.push({id:++id,name:x[0],hrs:x[1],day}));S.openDay=day;render();toast(L('התבנית נוספה ליום','Template added to the day'));}
  else if(a==='addsite'){const ac=DESTS[t.dest].acts[S.siteSel]||DESTS[t.dest].acts[0];let id=Math.max(0,...t.items.map(i=>i.id));t.items.push({id:id+1,name:ac[0],hrs:ac[4],day:+v});
    if(t.stage==='Quote'&&!t.lines.some(l=>l.name===ac[0])){t.lines.push({id:Math.max(0,...t.lines.map(l=>l.id))+1,type:'Activities',name:ac[0],sup:ac[1],qty:t.pax-Math.floor(t.pax/20),unit:'person',cost:ac[2],scope:'per person',ov:'',comm:ac[3],inv:null,cur:DESTS[t.dest].cur});toast(L('האתר נוסף יחד עם שורת עלות','Site added together with a cost line'));}
    render();}
  else if(a==='rmitem'){t.items=t.items.filter(i=>i.id!==+v);render();}
  else if(a==='addcat'){const inp=document.getElementById('newcat');const val=inp.value.trim();if(val&&!S.cats.includes(val)){S.cats.push(val);render();toast(L('הקטגוריה נוספה','Category added'));}}
  else if(a==='lang'){S.lang=S.lang==='en'?'he':'en';S.menu=false;render();}
  else if(a==='menu'){S.menu=!S.menu;render();}
  else if(a==='zoom'){S.zoom=+v;render();}
  else if(a==='reset'){resetDemo();render();window.scrollTo(0,0);toast(L('הדמו אופס','Demo reset'));}
  else if(a==='tourgo'){tourGo(0);}
  else if(a==='tournext'){tourGo(Math.min(TOUR.length-1,S.tour+1));}
  else if(a==='tourprev'){tourGo(Math.max(0,S.tour-1));}
  else if(a==='tourend'){S.tour=-1;render();toast(L('סוף הסיור. אפשר להמשיך לבד מכל מסך.','End of tour. Explore freely from any screen.'));}
  else if(a==='readinv'){const tt=byId(v);if(tt)startReading(tt);}
  else if(a==='gapdisp'){S.disp=v||null;render();}
  else if(a==='copydisp'){const {t:tt,l}=gapLineOf(v);if(l)copy(disputeMail(tt,l));}
  else if(a==='gapsent'){const {l}=gapLineOf(v);if(l){l.inv.st='disputed';S.disp=null;render();toast(L(`דרישת זיכוי נשלחה ל-${l.sup}`,`Dispute sent to ${l.sup}`));}}
  else if(a==='gapcred'){const {t:tt,l}=gapLineOf(v);if(l){const amt=r2(effAmt(l.inv)-planC(l));l.inv.credit=r2((l.inv.credit||0)+amt);l.inv.st='credited';render();toast(L(`זיכוי של ${usd(amt*lrate(tt,l))} נרשם. הרווח עודכן.`,`Credit of ${usd(amt*lrate(tt,l))} recorded. Profit updated.`));}}
  else if(a==='gapacc'){const {l}=gapLineOf(v);if(l){l.inv.st='accepted';S.disp=null;render();toast(L('החיוב אושר','Charge accepted'));}}
  else if(a==='print'){try{window.print();}catch(err){}toast(L('אם חלון ההדפסה לא נפתח כאן, הדפיסו מהקובץ המקומי.','If no print dialog opened here, print from the offline file.'));}
});
document.addEventListener('change',e=>{
  const el=e.target,k=el.dataset.ch;if(!k)return;
  const v=el.dataset.v,val=el.value,t=T();
  if(k==='role'){S.role=val;S.fAgent='All';}
  else if(k==='name')t.name=val.trim()||t.name;
  else if(k==='pct')t.pct=Math.min(100,Math.max(0,+val||0));
  else if(k==='mk')t.markups[v]=Math.min(90,Math.max(0,+val||0));
  else if(k==='cost')t.lines.find(l=>l.id===+v).cost=Math.max(0,+val||0);
  else if(k==='itemcost'){const l=t.lines.find(x=>x.id===+v);l.cost=Math.max(0,r2((+val||0)/lrate(t,l)));}
  else if(k==='ov')t.lines.find(l=>l.id===+v).ov=val===''?'':Math.min(90,Math.max(0,+val||0));
  else if(k==='rate')t.rate=Math.min(2,Math.max(.5,+val||BASE_RATE[t.cur]));
  else if(k==='dm'){const d=t.disc[el.dataset.k]||(t.disc[el.dataset.k]={m:'%',v:''});d.m=val;}
  else if(k==='dv'){const d=t.disc[el.dataset.k]||(t.disc[el.dataset.k]={m:'%',v:''});d.v=val===''?'':Math.max(0,+val||0);}
  else if(k==='mv')t.items.find(i=>i.id===+v).day=+val;
  else if(k==='task')t.tasks.find(x=>x.id===+v).done=el.checked;
  else if(k==='msgsup')S.msgSup=+val;
  else if(k==='docgroup')S.docGroup=+val;
  else if(k==='siteSel')S.siteSel=+val;
  else if(k==='tplDest')S.tplDest=val;
  else if(k==='sw')S[v]=el.checked;
  else if(k==='qseg'){S.qseg=val;S.page=0;}
  else if(k==='rpp'){S.rpp=+val;S.page=0;}
  else if(k==='fseg')S.fSeg=val;
  else if(k==='fstage')S.fStage=val;
  else if(k==='fagent')S.fAgent=val;
  else if(k==='gF')S.gF=val;
  else if(k==='gK')S.gK=val;
  else if(k==='thresh')S.thresh=Math.min(50,Math.max(0,+val||0));
  render();
});
document.addEventListener('input',e=>{
  const el=e.target,k=el.dataset.in;if(!k)return;
  if(k==='shock')S.shock=+el.value;else if(k==='q'){S.q=el.value;S.page=0;}else if(k==='tplQ')S.tplQ=el.value;
  const y=window.scrollY;document.getElementById('view').innerHTML=trHtml((S.tab==='trip'?vTrip:VIEWS[S.tab])());window.scrollTo(0,y);
  const n=document.querySelector(`[data-in="${k}"]`);if(n){n.focus();if(n.setSelectionRange&&n.type==='text'){const Ln=n.value.length;n.setSelectionRange(Ln,Ln);}}
  save();
});
document.addEventListener('submit',e=>{
  const f=e.target;if(f.dataset&&f.dataset.form==='ask'){e.preventDefault();const q=f.querySelector('input').value.trim();if(!q)return;askText(q);render();const c=document.querySelector('.cb');if(c)c.scrollTop=c.scrollHeight;const n=document.querySelector('[data-form="ask"] input');if(n)n.focus();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(S.menu){S.menu=false;render();}else if(S.chen){S.chen=false;render();}}});
let dragId=null;
document.addEventListener('dragstart',e=>{const c=e.target.closest&&e.target.closest('.site');if(c){dragId=+c.dataset.item;try{e.dataTransfer.setData('text/plain',String(dragId));e.dataTransfer.effectAllowed='move';}catch(x){}}});
document.addEventListener('dragover',e=>{const d=e.target.closest&&e.target.closest('.acc');if(d&&dragId!==null){e.preventDefault();d.classList.add('over');}});
document.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('.acc');if(d)d.classList.remove('over');});
document.addEventListener('drop',e=>{const d=e.target.closest&&e.target.closest('.acc');if(d&&dragId!==null){e.preventDefault();const it=T().items.find(i=>i.id===dragId);if(it)it.day=+d.dataset.day;dragId=null;render();}});
