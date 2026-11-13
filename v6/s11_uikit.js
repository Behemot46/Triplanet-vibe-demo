/* ---------- v8.1 UI kit for developers (module code uk) ----------
   VIEWS.uikit: live examples of every component, each with its name, when to use it, the class names / helper call
   (copyable) and do / don't notes. Not in NAV: opened from Settings ("UI kit for developers"), shown to every
   role (it is a reference and shows no agency data beyond the demo's own sample rows).
   Tokens are read at runtime from the loaded stylesheets / computed style; a static list is the fallback (tests, offline). */
Object.assign(S,{ukSeg:'day',ukPop:false,ukTg:true,ukChk:true});
let UK_SNIP=[];
const UK_TOK=[
 ['Brand',[['--primary','#078DEE'],['--primary-light','#68CDF9'],['--primary-lighter','#CCF4FE'],['--primary-dark','#0351AB'],['--primary-darker','#012972'],['--mint','#5DFCE0'],['--accent','#078DEE']]],
 ['Surface and text',[['--bg','#FFFFFF'],['--panel','#FFFFFF'],['--recess','#F4F6F8'],['--ink','#1C252E'],['--ink2','#454F5B'],['--muted','#637381'],['--dis','#919EAB'],['--line','rgba(145,158,171,.2)'],['--line2','rgba(145,158,171,.32)']]],
 ['Navigation',[['--side','#FFFFFF'],['--side2','rgba(145,158,171,.08)'],['--side-ink','#637381'],['--navon','#078DEE'],['--navonbg','rgba(7,141,238,.08)']]],
 ['Status colors',[['--green','#118D57'],['--red','#B71D18'],['--orange','#B76E00'],['--yellow','#B76E00'],['--amber','#B76E00'],['--blue','#0351AB'],['--purple','#5119B7'],['--teal','#078DEE'],['--good','#5BE49B'],['--bad','#FFAC82']]],
 ['Controls and hero',[['--btn','#1C252E'],['--btn-ink','#FFFFFF'],['--tile','#012972'],['--tile-ink','#FFFFFF'],['--hero1','#012972'],['--hero2','#0351AB'],['--hero-ink','#FFFFFF'],['--hero-mute','#B7D4F2'],['--glow','rgba(7,141,238,.16)']]]];
function ukTokVal(n){try{if(typeof getComputedStyle==='function'&&document.documentElement)return getComputedStyle(document.documentElement).getPropertyValue(n).trim();}catch(e){}return '';}
/* every --token found in the stylesheets' :root rules, so a token added to theme.css shows up without editing this file */
function ukTokens(){
  const known=new Set(UK_TOK.flatMap(g=>g[1].map(x=>x[0])));const extra=[],seen=new Set();
  try{if(typeof document!=='undefined'&&document.styleSheets){
    for(const ss of Array.from(document.styleSheets)){let rules;try{rules=ss.cssRules;}catch(e){continue;}
      for(const r of Array.from(rules||[]))if(r.selectorText===':root'&&r.style)for(const p of Array.from(r.style))if(/^--/.test(p)&&!known.has(p)&&!/^--(f-|sh-)/.test(p)&&!seen.has(p)){seen.add(p);extra.push([p,'']);}}}}catch(e){}
  const g=UK_TOK.map(x=>[x[0],x[1]]);if(extra.length)g.push(['Other tokens',extra]);return g;
}
/* one example block: live demo + name + when + copyable code + do / don't */
function ukEx(name,when,live,code,dos,donts,wide){
  const i=UK_SNIP.push(code)-1;
  return `<article class="uk-ex${wide?' uk-wide':''}"><div class="uk-live">${live}</div><div class="uk-doc"><h3>${name}</h3><p class="muted">${when}</p>
   <div class="uk-code"><code>${esc(code)}</code><button class="btn sm" data-act="uk-copy" data-i="${i}" aria-label="${L('העתקת הקוד','Copy the code')}">${ic('copy')} ${L('העתקה','Copy')}</button></div>
   ${dos||donts?`<ul class="uk-dd">${dos?`<li class="do">${ic('check')}<span>${dos}</span></li>`:''}${donts?`<li class="dont">${ic('xcircle')}<span>${donts}</span></li>`:''}</ul>`:''}</div></article>`;
}
const ukSec=(id,title,sub,body)=>`<section class="uk-sec" id="uk-${id}"><h2>${title}</h2><p class="muted uk-sub">${sub}</p>${body}</section>`;

/* ---- 1. tokens ---- */
function ukTokensHtml(){
  const sw=(n,fb)=>{const v=ukTokVal(n)||fb||'';return `<div class="uk-sw"><span class="uk-chip" style="background:var(${n})"></span><div><code>${n}</code><small>${esc(v)}</small></div></div>`;};
  const groups=ukTokens().map(g=>`<div class="uk-tgrp"><h4>${esc(g[0])}</h4><div class="uk-swg">${g[1].map(x=>sw(x[0],x[1])).join('')}</div></div>`).join('');
  const typo=[['h1','24px / 700',`<h1 class="uk-h">${L('כותרת עמוד','Page title')}</h1>`],['h2','18px / 700',`<h2 class="uk-h">${L('כותרת כרטיס','Card title')}</h2>`],['h3','16.5px / 600',`<h3 class="uk-h">${L('כותרת משנה','Section title')}</h3>`],['body','14.5px / 400 Public Sans',`<span>${L('טקסט רגיל לשימוש כללי','Body text for general use')}</span>`],['small','12 to 13px',`<span class="small muted">${L('טקסט עזר ותוויות','Helper text and labels')}</span>`],['figures','Barlow, tabular',`<span class="uk-fig">$1,234,567.89</span>`]];
  const typoH=`<div class="uk-typo">${typo.map(t=>`<div class="uk-ty"><code>${t[0]}</code><small>${t[1]}</small>${t[2]}</div>`).join('')}</div>`;
  const rad=[['6px','6px',L('תיבות קלט, צ׳יפים','inputs, chips')],['8px','8px',L('כפתורים, פריטי ניווט','buttons, nav items')],['14 to 16px','16px',L('כרטיסים, אריחים','cards, tiles')],['24px','24px',L('פס הגיבור בדף הבית','Home hero band')],['99px','99px',L('גלולות, מתגים','pills, toggles')]];
  const sh=[['--sh-card',L('כרטיס במנוחה','card at rest')],['--sh-drop',L('תפריטים וחלונות צפים','menus and drawers')],['--sh-pri',L('כפתור ראשי מודגש','featured primary button')]];
  const geo=`<div class="uk-geo"><div><h4>${L('רדיוס','Radius')}</h4>${rad.map(r=>`<div class="uk-rad"><span style="border-radius:${r[1]}"></span><code>${r[0]}</code><small>${r[2]}</small></div>`).join('')}</div>
   <div><h4>${L('צללים','Shadows')}</h4>${sh.map(s=>`<div class="uk-shd"><span style="box-shadow:var(${s[0]})"></span><code>${s[0]}</code><small>${s[1]}</small></div>`).join('')}</div>
   <div><h4>${L('ריווח','Spacing')}</h4><div class="uk-spc">${[4,8,12,16,24,32].map(n=>`<div><span style="inline-size:${n}px"></span><code>${n}px</code></div>`).join('')}</div><small class="muted">${L('מרווחים בין כרטיסים 14 עד 24, שוליים צדדיים 16 בטלפון.','Gaps between cards 14 to 24, side gutter 16 on phones.')}</small></div></div>`;
  return ukSec('tokens',L('1. טוקנים','1. Tokens'),L('הערכים בערכת הנושא הנוכחית (יום או לילה). צבעים תמיד מ-var(--token), אף פעם לא ערך קבוע.','Values in the current theme (day or night). Colors always come from var(--token), never a literal.'),
   groups+`<h4 class="uk-h4">${L('טיפוגרפיה','Typography')}</h4>`+typoH+geo);
}

/* ---- 2. navigation and layout ---- */
function ukNav(){
  const st=[['quote',['הצעת מחיר','Quotation']],['ops',['תפעול','Operation']],['fin',['כספים','Finance']]];
  const e=[];
  e.push(ukEx(L('כותרת עמוד','Page header'),L('כל מסך מתחיל בה: כותרת ופעולות בצד.','Every page starts with it: title on one side, actions on the other.'),
   head(L('פרויקטים','Projects'),`<button class="btn">${ic('filter')} ${L('סינון','Filter')}</button><button class="btn pri">${ic('userplus')} ${L('חדש','New')}</button>`),
   "head(L(he,'Projects'), `<button class=\"btn pri\">…</button>`)",L('פעולה ראשית אחת בלבד, בקצה.','One primary action only, at the end.'),L('לא להחביא ניווט בתוך הכותרת.','Do not hide navigation inside the header.')));
  e.push(ukEx(L('לשוניות','Tabs'),L('מעבר בין תצוגות של אותו עמוד. הלשונית הפעילה מסומנת ב-.on והבחירה נשמרת ב-S.','Switch views of the same page. The active tab gets .on and the choice is kept in S.'),
   `<div class="tabs"><button class="on">${L('סקירה','Overview')}</button><button>${L('ספקים','Suppliers')}</button><button>${L('מסמכים','Documents')} <span class="cnt">3</span></button></div>`,
   '<div class="tabs"><button class="on" data-act="x-sub" data-v="a">…</button></div>',L('עד שבע לשוניות; מונה ב-.cnt.','Up to seven tabs; counts in .cnt.'),L('לא למעבר בין עמודים.','Not for moving between pages.')));
  e.push(ukEx(L('מתג שלבים','Stage switch'),L('הצעת מחיר / תפעול / כספים בראש תיק פרויקט.','Quotation / Operation / Finance at the top of a project file.'),
   `<div class="pj-stage" role="tablist">${st.map((s,i)=>`<button role="tab" aria-selected="${i===1}" class="${i===1?'on':''}">${L(s[1][0],s[1][1])}</button>`).join('')}</div>`,
   '<div class="pj-stage" role="tablist"><button role="tab" class="on" data-act="pstage" data-v="ops">…</button></div>',L('שלושה שלבים קבועים בלבד.','Exactly the three fixed stages.'),L('לא להוסיף שלב רביעי כאן; להשתמש בלשוניות.','Do not add a fourth stage here; use tabs.')));
  e.push(ukEx(L('פריט בסרגל הצד','Sidebar item'),L('ניווט ראשי. פריט פעיל מסומן ב-.on.','Primary navigation. The active item gets .on.'),
   `<div class="uk-side"><button class="nv on"><span class="ic">${ic('home')}</span>${L('בית','Home')}</button><button class="nv"><span class="ic">${ic('quotes')}</span>${L('פרויקטים','Projects')}</button><button class="nv"><span class="ic">${ic('finance')}</span>${L('כספים','Finance')} ${pillF(L('חדש','New'),'info nvp')}</button></div>`,
   "NAV.push(['key',[he,en],ic('icon')])   // <button class=\"nv on\"><span class=\"ic\">…</span>label</button>",L('אייקון Solar בסגנון duotone.','Solar duotone icon.'),L('לא יותר משלוש מילים בתווית.','Keep labels to three words.')));
  e.push(ukEx(L('כפתור חזרה','Back button'),L('חזרה לרשימה מתוך תיק או מסך משנה. במוצר אין פירורי לחם.','Back to the list from a file or sub-screen. The product has no breadcrumbs.'),
   `<div class="uk-row"><button class="pj-back" aria-label="${L('חזרה','Back')}">${ic('chev','flip back')}</button><span class="pj-no">#1042</span><strong>${L('טיול לדוגמה','Sample trip')}</strong></div>`,
   "<button class=\"pj-back\" data-act=\"go\" data-v=\"quotes\">${ic('chev','flip back')}</button>",L('ic(\'chev\',\'flip back\') מתהפך לבד ב-RTL.','ic(\'chev\',\'flip back\') mirrors itself in RTL.'),L('לא להשתמש בחץ Unicode.','Do not use a Unicode arrow.')));
  return ukSec('nav',L('2. ניווט ופריסה','2. Navigation and layout'),L('הקליפה של כל מסך.','The shell of every screen.'),`<div class="uk-grid">${e.join('')}</div>`);
}

/* ---- 3. data display ---- */
function ukData(){
  const e=[];
  e.push(ukEx(L('אריח KPI','KPI tile'),L('מספר אחד עם תווית ותת-שורה. עוטפים בשורת .stats.','One number with a label and a sub-line. Wrap in a .stats row.'),
   `<div class="stats"><div class="stat"><div class="l">${L('הכנסות','Revenue')}</div><div class="v">${usd(950103.7)}</div><div class="s">${L('20 טיולים','20 trips')}</div></div><div class="stat"><div class="l">${L('רווח צפוי','Expected profit')}</div><div class="v">${usd(138322.99)}</div><div class="s">14.6%</div></div></div>`,
   '<div class="stats"><div class="stat"><div class="l">…</div><div class="v">${usd(x)}</div><div class="s">…</div></div></div>',L('usd() לכל סכום; .v.neg לערך שלילי.','usd() for every amount; .v.neg for a negative.'),L('לא להציג מספר בלי תווית.','Never show a number without a label.')));
  let hero='';try{const P=portfolio(TRIPS);hero=hpHero(TRIPS,P,[]);}catch(x){hero='';}
  e.push(ukEx(L('פס גיבור עם אריחים','Hero band with tiles'),L('פותח את דף הבית ואת לוחות המחוונים של התפקידים. כחול כהה, מנטה כהדגשה.','Opens Home and the role dashboards. Dark blue, mint as accent.'),
   hero?`<div class="uk-hero">${hero}</div>`:`<p class="muted">${L('לא זמין בבנייה הזו.','Not available in this build.')}</p>`,
   'hpHero(ts,P,up)   // .hp .hp-top .hp-kpi .hp-bar .hp-grid; accountant: .hp.da-hero',L('אנימציה רק בכניסה לעמוד.','Animates only when the page is entered.'),L('לא לחזור על הפס בעמודי משנה.','Do not repeat the band on sub-pages.'),true));
  e.push(ukEx(L('כרטיס','Card'),L('המכל הבסיסי לכל קבוצת תוכן.','The base container for any group of content.'),
   `<div class="card"><h3>${L('כותרת כרטיס','Card title')}</h3><p class="muted">${L('טקסט תומך קצר.','Short supporting text.')}</p></div>`,
   '<div class="card"><h3>…</h3><p class="muted">…</p></div>',L('כרטיס אחד לנושא אחד.','One card per topic.'),L('לא לקנן כרטיסים בתוך כרטיסים.','Do not nest cards in cards.')));
  const rows=(typeof TRIPS!=='undefined'?TRIPS.slice(0,3):[]).map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(t.client||'')}</td><td class="n">${usd(calc(t).rev)}</td><td>${pillF(esc(typeof qn==='function'?qn(t.qst):t.stage),'info')}</td></tr>`).join('');
  e.push(ukEx(L('טבלה עם בורר שורות','Table with pager'),L('רשימות. עוטפים ב-.scroll כדי שבטלפון תיגלל הצידה. .al-tbl לטבלאות צפופות.','Lists. Wrap in .scroll so it scrolls sideways on a phone. .al-tbl for dense tables.'),
   `<div class="scroll"><table class="tbl al-tbl"><thead><tr><th>${L('שם','Name')}</th><th>${L('לקוח','Client')}</th><th class="n">${L('מחיר','Price')}</th><th>${L('סטטוס','Status')}</th></tr></thead><tbody>${rows}</tbody></table></div><div class="pager"><label class="small muted">${L('שורות בעמוד:','Rows per page:')} <select aria-label="${L('שורות בעמוד','Rows per page')}"><option>8</option><option>16</option></select></label></div>`,
   '<div class="scroll"><table class="tbl al-tbl"><thead>…</thead><tbody>…</tbody></table></div><div class="pager">…</div>',L('עמודות מספרים עם class="n".','Number columns get class="n".'),L('לא להוציא טבלה מחוץ ל-.scroll.','Never put a table outside .scroll.'),true));
  e.push(ukEx(L('גלולות סטטוס','Pills'),L('סטטוס קצר. הצבע נושא משמעות: ירוק תקין, כתום תשומת לב, אדום בעיה.','Short status. Color carries meaning: green fine, orange attention, red problem.'),
   `<div class="uk-row">${[['green',L('שולם','Paid')],['ok',L('אושר','Approved')],['info',L('מידע','Info')],['blue',L('פעיל','Active')],['teal',L('חדש','New')],['purple',L('מיוחד','Special')],['ai','AI'],['warn',L('ממתין','Pending')],['orange',L('בהמתנה','On hold')],['amber',L('לבדיקה','Review')],['yellow',L('טיוטה','Draft')],['red',L('פער','Gap')],['bad',L('נדחה','Rejected')],['',L('ניטרלי','Neutral')]].map(p=>pillF(p[1],p[0])).join('')}</div>`,
   "pillF(text, 'green|ok|info|blue|teal|purple|ai|warn|orange|amber|yellow|red|bad|')",L('מילה אחת או שתיים.','One or two words.'),L('לא להשתמש באדום לעיצוב בלבד.','Never use red as decoration.')));
  e.push(ukEx(L('תג מותג','Brand badge'),L('מלון או אתר אמיתי: ריבוע צבעוני עם אות. בלי לוגו רשמי.','A real hotel or venue: colored square with an initial. No official logo.'),
   `<div class="uk-row">${typeof brandBadge==='function'?['Hilton','Marriott','Hyatt'].map(f=>{try{return brandBadge(f);}catch(x){return '';}}).join(' '):''}</div>`,
   "brandBadge('Marriott')",L('ליד ניסוח ניטרלי בלבד.','Next to neutral wording only.'),L('לעולם לא ליד פער, חיוב-יתר, מחלוקת או איחור.','Never next to a gap, overbilling, dispute or late.')));
  e.push(ukEx(L('אווטאר','Avatar'),L('אדם אחד: צוות או איש קשר. הדיוקנאות נוצרו ב-AI ואינם של אנשים אמיתיים.','One person: staff or a contact. Headshots are AI-generated, of people who do not exist.'),
   `<div class="uk-row">${['Ella Brooks','Nora Kim','Maya'].map(n=>avatarOf(n)).join('')}${avatarOf('Zed')}</div>`,
   "avatarOf('Ella Brooks')   // avatarOf(name, extraClass)",L('אות ראשונה אוטומטית כשאין דיוקן.','Falls back to the initial when there is no headshot.'),L('לעולם לא תמונות של אנשים אמיתיים.','Never photos of real people.')));
  e.push(ukEx(L('פס התקדמות','Progress bar'),L('אחוז השלמה אחד.','One completion percentage.'),
   `<div class="uk-col"><div class="prog"><div style="width:35%"></div></div><div class="prog"><div style="width:72%"></div></div></div>`,
   '<div class="prog"><div style="width:72%"></div></div>',L('להוסיף את המספר כטקסט לידו.','Add the number as text beside it.'),L('לא להציג יותר מערך אחד.','Not for more than one value.')));
  e.push(ukEx(L('מצב ריק','Empty state'),L('רשימה בלי פריטים: אייקון, משפט והצעד הבא.','A list with no items: icon, one sentence and the next step.'),
   `<div class="uk-empty">${ic('inbox')}<strong>${L('אין עדיין פריטים','Nothing here yet')}</strong><span class="muted">${L('הוסיפו את הראשון כדי להתחיל.','Add the first one to get started.')}</span><button class="btn pri sm">${ic('userplus')} ${L('הוספה','Add')}</button></div>`,
   '<div class="uk-empty">ic(\'inbox\') <strong>…</strong> <span class="muted">…</span> <button class="btn pri sm">…</button></div>',L('תמיד צעד הבא אחד.','Always one next step.'),L('לא להשאיר טבלה ריקה בלי הסבר.','Never leave a bare empty table.')));
  let br='';try{br=wfSvg(leakModel(TRIPS));}catch(x){br='';}
  if(br)e.push(ukEx(L('גשר הדליפות','Leak bridge'),L('מרווח מתוכנן לרווח צפוי. SVG מוטמע; הציר מתחיל מ-$0.','Planned to expected profit. Inline SVG; the axis starts at $0.'),
   `<div class="uk-bridge">${br}</div>`,'wfSvg(leakModel(TRIPS))',L('להעביר את המודל, בלי לחשב מחדש.','Pass the model; do not recompute.'),L('לא לקטום את הציר.','Do not truncate the axis.'),true));
  return ukSec('data',L('3. הצגת נתונים','3. Data display'),L('אריחים, כרטיסים, טבלאות וסימונים.','Tiles, cards, tables and markers.'),`<div class="uk-grid">${e.join('')}</div>`);
}

/* ---- 4. inputs ---- */
function ukInputs(){
  const e=[];
  e.push(ukEx(L('כפתורים','Buttons'),L('ראשי אחד לכל מסך, השאר רגילים. .sm בטבלאות, [disabled] כשאי אפשר.','One primary per screen, the rest default. .sm in tables, [disabled] when unavailable.'),
   `<div class="uk-row"><button class="btn pri">${L('ראשי','Primary')}</button><button class="btn">${L('רגיל','Default')}</button><button class="btn sm">${L('קטן','Small')}</button><button class="btn" disabled>${L('מושבת','Disabled')}</button><button class="btn grn">${ic('check')} ${L('אישור','Confirm')}</button><button class="btn" aria-label="${L('חיפוש','Search')}">${ic('search')}</button></div>`,
   '<button class="btn pri|grn|sm" [disabled]>${ic(\'check\')} label</button>   // icon-only: add aria-label',L('אייקון לפני הטקסט.','Icon before the text.'),L('בלי כפתור ראשי שני.','No second primary button.')));
  e.push(ukEx(L('שדות קלט','Fields'),L('בחירה, טקסט, מספר ותאריך. תמיד עם תווית.','Select, text, number and date. Always with a label.'),
   `<div class="uk-fields"><label>${L('סוג','Type')}<select><option>${L('קבוצה','Group')}</option><option>${L('כנסייה','Church')}</option></select></label><label>${L('שם','Name')}<input type="text" placeholder="${L('הקלידו שם','Type a name')}"></label><label>${L('נוסעים','Travelers')}<input type="number" value="24"></label><label>${L('יציאה','Departure')}<input type="date"></label></div>`,
   '<label>…<select|input[type=text|number|date]></label>   // data-ch="myact" for change events',L('תווית גלויה מעל השדה.','A visible label above the field.'),L('placeholder אינו תחליף לתווית.','A placeholder is not a label.')));
  e.push(ukEx(L('מתג וצ׳קבוקס','Toggle and checkbox'),L('מתג להפעלה מיידית; צ׳קבוקס לבחירה בתוך טופס.','Toggle for an immediate on/off; checkbox for a choice inside a form.'),
   `<div class="uk-row"><label class="uk-tgl"><span class="st-sw"><input type="checkbox" data-ch="uk-tg"${S.ukTg?' checked':''} aria-label="${L('התראות','Notifications')}"><i></i></span> ${L('התראות','Notifications')}</label><label class="uk-tgl"><input type="checkbox" data-ch="uk-chk"${S.ukChk?' checked':''}> ${L('שלחו לי עותק','Send me a copy')}</label></div>`,
   '<label class="st-sw"><input type="checkbox" data-ch="x" checked><i></i></label>',L('מתג משנה מיד, בלי כפתור שמירה.','A toggle applies at once, no save button.'),L('לא להשתמש במתג בתוך טופס עם שמירה.','No toggle inside a form with Save.')));
  e.push(ukEx(L('בקרה מקוטעת','Segmented control'),L('בחירה אחת מתוך שלוש או ארבע אפשרויות קצרות של אותה תצוגה.','One of three or four short options of the same view.'),
   `<div class="pr-seg" role="group" aria-label="${L('תצוגה','View')}">${[['day',L('לפי יום','By day'),'calendar'],['comp',L('לפי רכיב','By component'),'checklist'],['map',L('מפה','Map'),'mapsq']].map(x=>`<button class="${S.ukSeg===x[0]?'on':''}" aria-pressed="${S.ukSeg===x[0]}" data-act="uk-seg" data-v="${x[0]}">${ic(x[2])} ${x[1]}</button>`).join('')}</div>`,
   '<div class="pr-seg" role="group"><button class="on" aria-pressed="true" data-act="x" data-v="a">…</button></div>',L('aria-pressed בכל כפתור.','aria-pressed on each button.'),L('לא במקום לשוניות.','Not a substitute for tabs.')));
  let fm='';try{if(typeof formRender==='function'){const sc={id:'uk-demo',entity:'uk',fields:[{k:'name',type:'text',label:{en:'Client name',he:'שם הלקוח'},req:true,cols:2},{k:'pax',type:'number',label:{en:'Travelers',he:'נוסעים'},req:true,min:1},{k:'type',type:'select',label:{en:'Type',he:'סוג'},options:[{v:'g',en:'Group',he:'קבוצה'},{v:'c',en:'Church',he:'כנסייה'}]}]};
    fm=formRender(sc,{name:'',pax:24,type:'g'},{ns:'ukd',errors:{name:formValidate(sc,{name:'',pax:24}).errors.name}});}}catch(x){fm='';}
  if(fm)e.push(ukEx(L('טופס מנוע הטפסים','Schema form'),L('טפסים נבנים מסכמה אחת: אימות, שגיאות והנגשה מגיעים מהמנוע. כאן עם שגיאה אחת.','Forms are built from one schema: validation, errors and accessibility come from the engine. One error shown here.'),
   `<div class="uk-form">${fm}</div>`,"formRender(schema, record, {ns:'x', errors:{name:'Required'}})   // formOpen(id, record) opens it in the right drawer",L('הודעת השגיאה מתחת לשדה, ב-role=alert.','The error sits under the field, in role=alert.'),L('לא להסתיר שגיאה בטוסט.','Do not hide an error in a toast.'),true));
  return ukSec('inputs',L('4. קלטים','4. Inputs'),L('פקדים וטפסים.','Controls and forms.'),`<div class="uk-grid">${e.join('')}</div>`);
}

/* ---- 5. feedback ---- */
function ukFeedback(){
  const e=[],t0=(typeof TRIPS!=='undefined'&&(TRIPS.find(t=>t.stage==='Quote')||TRIPS[0]))||{name:'Sample',qst:'Draft',id:'x'};
  e.push(ukEx(L('טוסט','Toast'),L('אישור קצר לפעולה שהצליחה. נעלם אחרי כשתי שניות.','Short confirmation of an action that worked. Disappears after about 2 seconds.'),
   `<button class="btn" data-act="uk-toast">${ic('sparkle')} ${L('הצגת טוסט','Show a toast')}</button>`,"toast(L(he,'Saved'))",L('מה קרה, במשפט אחד.','What happened, in one sentence.'),L('לא לשגיאות שדורשות פעולה.','Not for errors that need action.')));
  e.push(ukEx(L('תיבת אזהרה','Warning box'),L('הערה מוטמעת באדום, ליד מה שגורם לה.','An inline red note beside what causes it.'),
   `<div class="warnbox">${ic('danger')} ${L('11 שעות ביום הזה. הלו"ז כנראה יחרוג.','11 hours on this day. The schedule will likely slip.')}</div>`,
   '<div class="warnbox">${ic(\'danger\')} text</div>',L('לכתוב את הסיבה ואת המספר.','State the cause and the number.'),L('לא למידע ניטרלי.','Not for neutral information.')));
  e.push(ukEx(L('כרטיס שער','Gate card'),L('מסך שנפתח רק אחרי אירוע (אישור הצעה).','A screen that opens only after an event (quote accepted).'),
   `<div class="uk-gate">${gate(t0,L('תפעול','Operation'))}</div>`,"gate(trip, L(he,'Operation'))",L('להציע את הפעולה שפותחת.','Offer the action that unlocks it.'),L('לא להסתיר מסך בלי הסבר.','Never hide a screen without a reason.')));
  e.push(ukEx(L('כרטיס אין הרשאה','No-access card'),L('התפקיד אינו כולל את המסך.','The role does not include the screen.'),
   `<div class="uk-gate">${noAccess(L('דוגמה','Example'))}</div>`,"noAccess('Reports')   // gate by can('perm')",L('להסביר מי יכול לשנות.','Say who can change it.'),L('לא להציג דף ריק.','Never show a blank page.')));
  if(typeof nxBar==='function'){let ns='';try{const tq=TRIPS.find(x=>x.stage==='Operations')||t0;ns=String(nxBar(tq)||'');}catch(x){ns='';}
    if(ns&&ns!=='undefined')e.push(ukEx(L('סרגל הצעד הבא','Next-step bar'),L('מציע את הפעולה הבאה בתיק לפי הנתונים.','Suggests the next action on a file from its data.'),`<div class="uk-gate">${ns}</div>`,'nxBar(trip)   // steps come from nextSteps(trip)',L('עד שלושה צעדים.','Up to three steps.'),L('לא לחזור על הלשוניות.','Do not repeat the tabs.')));}
  return ukSec('feedback',L('5. משוב','5. Feedback'),L('הודעות, אזהרות ומצבים חסומים.','Messages, warnings and blocked states.'),`<div class="uk-grid">${e.join('')}</div>`);
}

/* ---- 6. icons ---- */
function ukIcons(){
  const ks=Object.keys(ICONS);
  const i=UK_SNIP.push("ic('name')   // ic('chev','flip') mirrors in RTL")-1;
  return ukSec('icons',L('6. אייקונים','6. Icons'),`${ks.length} ${L('אייקוני Solar. תמיד ic(\'שם\'), לעולם לא סימן Unicode או אימוג׳י.','Solar icons. Always ic(\'name\'), never a Unicode glyph or emoji.')}`,
   `<div class="uk-code uk-icode"><code>ic('name')</code><button class="btn sm" data-act="uk-copy" data-i="${i}">${ic('copy')} ${L('העתקה','Copy')}</button></div><div class="uk-icons">${ks.map(k=>`<div class="uk-ic" data-uk-icon="${k}">${ic(k)}<code>${k}</code></div>`).join('')}</div>`);
}

/* ---- 7. patterns ---- */
function ukPatterns(){
  const e=[],hasF=typeof formOpen==='function';
  e.push(ukEx(L('מגירה ימנית','Right drawer'),L('עריכה או יצירה בלי לעזוב את הרשימה. נפתחת מהצד, Esc סוגר.','Edit or create without leaving the list. Slides in from the side, Esc closes.'),
   hasF?`<button class="btn pri" data-act="uk-drawer">${ic('userplus')} ${L('פתיחת טופס לקוח','Open the client form')}</button>`:`<span class="muted">${L('לא זמין בבנייה הזו.','Not available in this build.')}</span>`,
   "formOpen('client', null)   // formOpen(id, record) to edit",L('שמירה וביטול בתחתית.','Save and Cancel at the foot.'),L('לא לפתוח מגירה מתוך מגירה.','Never open a drawer from a drawer.')));
  e.push(ukEx(L('תפריט צף','Popover menu'),L('פעולות משניות מאחורי כפתור. נסגר בלחיצה בחוץ.','Secondary actions behind a button. Closes on an outside click.'),
   `<div class="uk-popw"><button class="btn" data-act="uk-pop" aria-haspopup="menu" aria-expanded="${!!S.ukPop}">${ic('settings')} ${L('פעולות','Actions')}</button>${S.ukPop?`<div class="menu" role="menu"><button role="menuitem" data-act="uk-toast">${ic('pen')} ${L('עריכה','Edit')}</button><button role="menuitem" data-act="uk-toast">${ic('copy')} ${L('שכפול','Duplicate')}</button><button role="menuitem" data-act="uk-toast">${ic('printer')} ${L('הדפסה','Print')}</button></div>`:''}</div>`,
   '<div style="position:relative"><button aria-haspopup="menu">…</button><div class="menu" role="menu"><button role="menuitem">…</button></div></div>',L('עד חמש פעולות.','Up to five actions.'),L('לא להחביא שם את הפעולה הראשית.','Do not hide the primary action in it.')));
  return ukSec('patterns',L('7. תבניות','7. Patterns'),L('אינטראקציות שחוזרות.','Recurring interactions.'),`<div class="uk-grid">${e.join('')}</div>`);
}

function vUikit(){
  UK_SNIP=[];
  const secs=[['tokens',L('טוקנים','Tokens')],['nav',L('ניווט','Navigation')],['data',L('נתונים','Data')],['inputs',L('קלטים','Inputs')],['feedback',L('משוב','Feedback')],['icons',L('אייקונים','Icons')],['patterns',L('תבניות','Patterns')]];
  const body=ukTokensHtml()+ukNav()+ukData()+ukInputs()+ukFeedback()+ukIcons()+ukPatterns();
  return head(L('ערכת רכיבים למפתחים','UI kit for developers'),`<button class="btn" data-act="go" data-v="settings">${ic('left','flip')} ${L('חזרה להגדרות','Back to settings')}</button><button class="btn" data-act="uk-theme">${ic(themeGet()==='dark'?'sun':'moon')} ${L('יום / לילה','Day / night')}</button>`)+
   `<p class="muted uk-intro">${L('דוגמאות חיות, בנויות מאותם עוזרים ומחלקות של המוצר. לכל רכיב: מתי משתמשים, קוד להעתקה, ומה כן ומה לא.','Live examples built from the product\'s own helpers and classes. Each component lists when to use it, copyable code, and do and don\'t notes.')}</p>
   <nav class="uk-jump" aria-label="${L('קפיצה לסעיף','Jump to section')}">${secs.map(s=>`<button class="btn sm" data-act="uk-jump" data-v="${s[0]}">${s[1]}</button>`).join('')}</nav>${body}`;
}
VIEWS.uikit=vUikit;

/* link from Settings: wraps the existing view and appends one card (all roles; the kit is a reference) */
{const f0=VIEWS.settings;
 if(typeof f0==='function')VIEWS.settings=function(){
  return f0.apply(this,arguments)+`<div class="card uk-link"><span class="uk-lico">${ic('widget')}</span><div><h3>${L('ערכת רכיבים למפתחים','UI kit for developers')}</h3><p class="muted">${L('כל הרכיבים, הטוקנים והאייקונים של המוצר עם קוד להעתקה.','Every component, token and icon of the product, with code to copy.')}</p></div><button class="btn" data-act="go" data-v="uikit">${L('פתיחה','Open')}</button></div>`;
 };}

document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act]');
  if(S.ukPop&&!(e.target.closest&&e.target.closest('.uk-popw'))){S.ukPop=false;if(S.tab==='uikit'&&!(b&&String(b.dataset.act).slice(0,3)==='uk-'))render();}
  if(!b)return;const a=b.dataset.act;if(a.slice(0,3)!=='uk-')return;
  if(a==='uk-copy'){copy(UK_SNIP[+b.dataset.i]||'');}
  else if(a==='uk-toast'){S.ukPop=false;render();toast(L('דוגמה לטוסט: הפעולה נשמרה','Example toast: the action was saved'));}
  else if(a==='uk-seg'){S.ukSeg=b.dataset.v;render();}
  else if(a==='uk-pop'){S.ukPop=!S.ukPop;render();}
  else if(a==='uk-drawer'){if(typeof formOpen==='function')formOpen('client',null);}
  else if(a==='uk-jump'){const el=document.getElementById('uk-'+b.dataset.v);if(el&&el.scrollIntoView)el.scrollIntoView({behavior:'smooth',block:'start'});}
  else if(a==='uk-theme'){themeToggle();render();}
});
document.addEventListener('change',e=>{
  const t=e.target;if(!t||!t.dataset)return;
  if(t.dataset.ch==='uk-tg')S.ukTg=t.checked;else if(t.dataset.ch==='uk-chk')S.ukChk=t.checked;
});

TESTS.push({name:'uikit page',run:h=>{const out=[],role0=S.role,lang0=S.lang;
  [ROLE_KEYS[0],ROLE_KEYS[1],ROLE_KEYS[ROLE_KEYS.length-1]].forEach(role=>{S.role=role;['en','he'].forEach(lang=>{S.lang=lang;S.tab='uikit';const html=VIEWS.uikit();h.chk(html,'uikit '+role+' '+lang);if(lang==='en')h.scan(html,'uikit');
    if(!html.includes('id="uk-tokens"'))out.push('no tokens section');
    const sn=(html.match(/data-act="uk-copy"/g)||[]).length;if(sn<20)out.push('copy buttons '+sn);
    if(/NaN|undefined/.test(html.replace(/<code>[\s\S]*?<\/code>/g,'')))out.push('NaN/undefined '+role+' '+lang);
    Object.keys(ICONS).forEach(k=>{const n=html.split('data-uk-icon="'+k+'"').length-1;if(n!==1)out.push('icon '+k+' x'+n);});
    const sh=VIEWS.settings();if(!sh.includes('data-v="uikit"'))out.push('settings link missing '+role+' '+lang);
    h.chk(sh,'settings+uikit link '+role+' '+lang);});});
  S.role=role0;S.lang=lang0;return out;}});
