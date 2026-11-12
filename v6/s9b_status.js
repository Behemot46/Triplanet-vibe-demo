/* ---------- Phase 3: honesty layer. Every feature carries Live, Pilot or Roadmap ----------
   One table drives the "What's live" screen, the badge on each page header and the 10-minute
   meeting beat. The owner confirms the statuses before each show (see CLAUDE.md). */
const FEAT=[
  // Live: in the product today (app.triplanet.io screens)
  ['projects','live','folder',['פרויקטים ושלבים','Projects and stages'],['הצעה, תפעול וכספים באותו תיק.','Quotation, operation and finance in one file.'],'quotes'],
  ['quote','live','quotes',['הצעות מחיר עם מרקאפ','Quotes with markup'],['מרקאפ לפי סוג שירות, הצעה ממותגת ללקוח.','Markup by service type, a branded client quote.'],null],
  ['catalog','live','hotels',['מלונות, פעילויות וספקים','Hotels, activities and suppliers'],['קטלוג אחד עם עלויות, עמלות וקיבולת.','One catalog with costs, commissions and capacity.'],'hotels'],
  ['clients','live','clients',['לקוחות','Clients'],['כל קבוצה וכל תיק במקום אחד.','Every group and file in one place.'],'clients'],
  ['income','live','receipt',['הכנסות, חשבוניות ושוברים','Income, invoices and vouchers'],['חשבוניות עסקה, חשבוניות מס ושוברים לספקים.','Deal invoices, tax invoices and supplier vouchers.'],null],
  ['lang','live','widget',['עברית ואנגלית','Hebrew and English'],['ממשק מלא בשתי השפות, כולל ימין לשמאל.','The full interface in both languages, right to left included.'],null],
  // Pilot: working, offered to pilot customers
  ['gaps','pilot','gaps',['בקרת חשבוניות ספקים','Supplier invoice check'],['כל שורה בחשבונית מול מה שתומחר, ודרישת זיכוי בלחיצה.','Every bill line against what was quoted, and a dispute in one click.'],'gaps'],
  ['books','pilot','sync',['חיבור להנהלת חשבונות','Accounting sync'],['פריוריטי, חשבשבת, <bdi>QuickBooks</bdi> ו-<bdi>Xero</bdi>.','QuickBooks, Xero, Priority and Hashavshevet.'],'books'],
  ['leaks','pilot','leaks',['דליפות רווח','Profit leaks'],['לפי טיול, סוכן, סוג קבוצה וספק.','By trip, agent, group type and supplier.'],'leaks'],
  ['ai','pilot','ai',['מאיה עונה מהנתונים שלכם','Maya answers from your data'],['שאלה מוקלדת נענית בזמן אמת על ידי Claude. כפתורי השאלות המוכנות בתסריט.','Typed questions are answered live by Claude. The ready-made question buttons are scripted.'],'ai'],
  ['studio','pilot','studio',['סטודיו לטיולים','Trip studio'],['מסלול יום אחר יום ותמחור מבקשת הלקוח.','A day-by-day plan and price from the client request.'],'studio'],
  // Roadmap: planned, not available yet
  
  ['mail','roadmap','mail',['חשבוניות ישר מתיבת המייל','Bills straight from your inbox'],['היום: העלאה ידנית או ייבוא מהנהלת החשבונות.','Today: manual upload or import from your books.'],null],
  ['comm','roadmap','percent',['דרישת עמלות אוטומטית מספקים','Automatic commission claims'],['היום: עמלה שלא נגבתה מסומנת בדליפות רווח.','Today: uncollected commission is flagged in Profit leaks.'],null],
  ['trust','roadmap','shield',['דוחות חשבון נאמנות','Trust account reports'],['לחוקי Seller of Travel במדינות ארה״ב.','For US Seller of Travel rules.'],null],
  ['guide','roadmap','users2',['אפליקציה למדריך','Guide mobile app'],['מסלול, רשימת נוסעים ושוברים בטלפון.','Itinerary, passenger list and vouchers on the phone.'],null],
];
const ST_META={live:[['זמין','Live'],'green'],pilot:[['פיילוט','Pilot'],'info'],roadmap:[['בתכנון','Roadmap'],'amber']};
const stPill=st=>pillF(L(ST_META[st][0][0],ST_META[st][0][1]),ST_META[st][1]);
const featOf=v=>FEAT.find(f=>f[5]===v);
function vStatus(){
  const col=st=>`<div class="card rm-col"><div class="rm-h">${stPill(st)}<span class="small muted">${{live:L('במוצר היום','In the product today'),pilot:L('עובד, פתוח ללקוחות פיילוט','Working, open to pilot customers'),roadmap:L('מתוכנן, עוד לא זמין','Planned, not available yet')}[st]}</span></div>
    ${FEAT.filter(f=>f[1]===st).map(f=>`<div class="rm-f"><span class="rm-ic">${ic(f[2])}</span><div><strong>${L(f[3][0],f[3][1])}</strong><div class="small muted">${L(f[4][0],f[4][1])}</div></div>${f[5]&&VIEWS[f[5]]?`<button class="btn sm" data-act="go" data-v="${f[5]}" aria-label="${L('פתיחה','Open')}">${ic('chev','flip')}</button>`:''}</div>`).join('')}</div>`;
  return head(L('מה זמין היום','What\'s live'))+`<p class="muted">${L('כל מה שמוצג בדמו, ומה מצבו במוצר. מה שעוד לא במוצר מסומן כפיילוט או בתכנון.','Everything in this demo and where it stands in the product. Anything not in the product yet is marked Pilot or Roadmap.')}</p>
   <div class="rm-grid">${['live','pilot','roadmap'].map(col).join('')}</div>`;
}
VIEWS.status=vStatus;
NAV2.push(['status',['מה זמין היום','What\'s live'],ic('checklist')]);
/* a status badge on every page header that shows a Pilot or Roadmap feature */
['gaps','books','leaks','studio','ai'].forEach(v=>{const f0=VIEWS[v];if(!f0)return;VIEWS[v]=function(){const h=f0.apply(this,arguments),f=featOf(v);
  if(!f||h.indexOf('<div class="ph">')!==0)return h;const tag=stPill(f[1]);
  const e=h.indexOf('</div></div>')+12,hd=h.slice(0,e).replace(/<span class="pill (green|info)">(חדש|New|פיילוט|Pilot)<\/span>/,'').replace('<div class="row">','<div class="row">'+tag);
  return hd+h.slice(e);};});
