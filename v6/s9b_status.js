/* ---------- Phase 3: honesty layer. Every feature carries Live, Pilot or Roadmap ----------
   One table drives the "What's live" screen, the badge on each page header and the 10-minute
   meeting beat. The owner confirms the statuses before each show (see CLAUDE.md). */
const FEAT=[
  // Live: in the product today. Revised 13 Nov 2026 (owner decision) after a read-only walkthrough of dev.triplanet.io
  // (Sep 2026 report): the Finance stage, invoices, payments, trip P&L, integrations and multi-currency are not active there.
  ['projects','live','folder',['פרויקטים ושלבים','Projects and stages'],['הצעה ותפעול באותו תיק: מסלול, ספקים, רשימת נוסעים ומשימות.','Quotation and operation in one file: itinerary, suppliers, passenger list and tasks.'],'quotes'],
  ['quote','live','quotes',['הצעות מחיר עם מרקאפ','Quotes with markup'],['מרקאפ לפי סוג שירות, הצעה ממותגת ללקוח.','Markup by service type, a branded client quote.'],null],
  ['catalog','live','hotels',['מלונות, פעילויות וספקים','Hotels, activities and suppliers'],['קטלוג אחד, עם מחירון לפי קטגוריית שירות.','One catalog, with a price list by service category.'],'hotels'],
  ['clients','live','clients',['לקוחות','Clients'],['כל קבוצה וכל תיק במקום אחד.','Every group and file in one place.'],'clients'],
  ['lang','live','widget',['עברית ואנגלית','Hebrew and English'],['ממשק מלא בשתי השפות, כולל ימין לשמאל.','The full interface in both languages, right to left included.'],null],
  ['props','live','invoice',['הצעה בשלושה פורמטים','Proposal in three formats'],['PDF, טבלת מחירים לסוכנים עם מחיר לפי גודל קבוצה, ודף נחיתה עם קישור ציבורי.','PDF, an agents table with group-size pricing, and a landing page with a public link.'],null],
  ['opsx','live','checklist',['משימות ורשימת נוסעים','Tasks and master list'],['צ׳קליסט לפי חלונות זמן, רשימת נוסעים עם ייבוא וייצוא.','A checklist by time window, and a master list with import and export.'],null],
  ['roles','live','users',['תפקידים והרשאות','Roles and permissions'],['ארבעה תפקידים ו-40 הרשאות.','Four roles and 40 permissions.'],'settings'],
  // Pilot: working, offered to pilot customers
  ['alts','pilot','suppliers',['ספקים חלופיים ומחירונים','Supplier alternatives and rate cards'],['השוואה והחלפת ספק עם ההשפעה על הרווח, מחירון לפי עונה וגודל קבוצה.','Compare and swap suppliers with the profit impact; rates by season and group size.'],'suppliers'],
  ['vers','pilot','document',['גרסאות הצעה','Quote versions'],['שמירה, השוואה ושחזור של גרסאות.','Save, compare and restore versions.'],null],
  ['forms','pilot','draft',['מחולל טפסים וטפסי נוסעים','Form builder and traveler forms'],['רישום, מידע רפואי, הצהרת אחריות והעדפת חדר, עם מעקב השלמה.','Registration, medical, waiver and rooming preference, with completion tracking.'],'forms'],
  ['dash','pilot','widget',['דשבורד לכל תפקיד','A dashboard for each role'],['מנהלת, הנהלת חשבונות וסוכן, כל אחד עם המספרים שלו.','Owner, accountant and agent, each with their own numbers.'],'home'],
  ['gaps','pilot','gaps',['בקרת חשבוניות ספקים','Supplier invoice check'],['כל שורה בחשבונית מול מה שתומחר, ודרישת זיכוי בלחיצה.','Every bill line against what was quoted, and a dispute in one click.'],'gaps'],
  ['books','pilot','sync',['חיבור להנהלת חשבונות','Accounting sync'],['פריוריטי, חשבשבת, <bdi>QuickBooks</bdi> ו-<bdi>Xero</bdi>.','QuickBooks, Xero, Priority and Hashavshevet.'],'books'],
  ['leaks','pilot','leaks',['דליפות רווח','Profit leaks'],['לפי טיול, סוכן, סוג קבוצה וספק.','By trip, agent, group type and supplier.'],'leaks'],
  ['ai','pilot','ai',['מאיה עונה מהנתונים שלכם','Maya answers from your data'],['שאלה מוקלדת נענית בזמן אמת על ידי Claude. כפתורי השאלות המוכנות בתסריט.','Typed questions are answered live by Claude. The ready-made question buttons are scripted.'],'ai'],
  ['income','pilot','receipt',['הכנסות, חשבוניות ושוברים','Income, invoices and vouchers'],['חשבוניות עסקה, חשבוניות מס ושוברים לספקים, בשלב הכספים של התיק.','Deal invoices, tax invoices and supplier vouchers, in the file\'s finance stage.'],null],
  ['pnl','pilot','chart2',['רווח והפסד לטיול','Trip P&L'],['רווח מתוכנן מול צפוי לכל טיול ולכל העונה.','Planned against expected profit for every trip and for the season.'],'finance'],
  ['fx','pilot','cash',['מטבעות ושער נעול','Currencies and a locked rate'],['עלויות ב-EUR, GBP או CAD, עם שער נעול לכל טיול.','Costs in EUR, GBP or CAD, with a locked rate per trip.'],null],
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
['gaps','books','leaks','studio','ai','finance'].forEach(v=>{const f0=VIEWS[v];if(!f0)return;VIEWS[v]=function(){const h=f0.apply(this,arguments),f=featOf(v);
  if(!f||h.indexOf('<div class="ph">')!==0)return h;const tag=stPill(f[1]);
  const e=h.indexOf('</div></div>')+12,hd=h.slice(0,e).replace(/<span class="pill (green|info)">(חדש|New|פיילוט|Pilot)<\/span>/,'').replace('<div class="row">','<div class="row">'+tag);
  return hd+h.slice(e);};});
/* photo credits: every embedded photo with author, license and source (CC BY / BY-SA need this) */
function vCredits(){
  const cr=typeof PHOTO_CREDITS!=='undefined'?PHOTO_CREDITS:[],kn={dest:L('יעדים','Destinations'),venue:L('אתרים ופעילויות','Venues and activities'),hotel:L('מלונות','Hotels')};
  const it=c=>`<div class="cr-it">${phImg(c.kind,c.id,'','')}<div><strong><bdi>${esc(c.title.replace(/^File:/,'').replace(/\.[a-z]+$/i,''))}</bdi></strong><br><bdi class="cr-au">${esc(c.author)}</bdi> · ${c.license_url?`<a href="${esc(c.license_url)}" target="_blank" rel="noopener">${esc(c.license)}</a>`:esc(c.license)}${c.source_url?` · <a href="${esc(c.source_url)}" target="_blank" rel="noopener">${L('מקור','Source')}</a>`:''}</div></div>`;
  const sec=k=>{const xs=cr.filter(c=>c.kind===k);return xs.length?`<div class="card"><h3>${kn[k]} <span class="small muted">· ${xs.length}</span></h3><div class="cr-grid">${xs.map(it).join('')}</div></div>`:'';};
  return head(L('קרדיט לתמונות','Photo credits'))+`<p class="muted">${L('התמונות מ-Wikimedia Commons, ברישיונות פתוחים. תמונה של מלון או אתר מציגה את המקום עצמו; היא לא מעידה על שיתוף פעולה עם בעליו.','Photos from Wikimedia Commons under open licenses. A photo of a hotel or venue shows the place itself; it does not imply any partnership with its owner.')}</p><p class="small muted">${typeof AVATAR_KIND!=='undefined'&&AVATAR_KIND==='photo'?L('תמונות הצוות והפנים של מאיה נוצרו בבינה מלאכותית ומציגות אנשים שאינם קיימים (Realistic Vision 5.1 על Stable Diffusion 1.5). מאיה היא עוזרת בינה מלאכותית, לא עובדת.','Staff photos and Maya\'s face are AI-generated and show people who do not exist (Realistic Vision 5.1 on Stable Diffusion 1.5). Maya is an AI assistant, not a staff member.'):L('דיוקנאות הצוות הם איורים של דמויות בדויות: סגנון Avataaars מאת Pablo Stanley, דרך DiceBear.','Staff portraits are illustrations of fictional people: the Avataaars style by Pablo Stanley, via DiceBear.')}</p>${cr.length?['dest','venue','hotel'].map(sec).join(''):`<p class="muted">${L('אין תמונות בגרסה הזו.','No photos in this build.')}</p>`}`;
}
VIEWS.credits=vCredits;
function creditsMenu(){
  if(!document.querySelector)return;const m=document.querySelector('.menu');if(!m||m.querySelector('[data-act="go"][data-v="credits"]'))return;
  const b=document.createElement('button');b.setAttribute('role','menuitem');b.dataset.act='go';b.dataset.v='credits';b.innerHTML=ic('document')+' '+trHe(L('קרדיט לתמונות','Photo credits'));
  m.insertBefore(b,m.querySelector('[data-act="reset"]'));
}
{const r0=render;render=function(){r0();try{creditsMenu();}catch(e){}};}
