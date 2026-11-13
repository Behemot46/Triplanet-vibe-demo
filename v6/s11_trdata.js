/* s11_trdata.js (module td): Hebrew for generic DATA strings in Hebrew mode.
   render() passes the whole app HTML through heDataIf -> heData(html) when S.lang==='he'.
   Only whole text nodes are translated (exact phrase -> pattern). Attributes, scripts, URLs and numbers are never touched.
   Names of companies, hotels, venues and people stay in English on purpose. */
const TD_DICT={};
const TD_PAT=[];
/* one phrase per line: English :: Hebrew */
const TD_LINES=`
Arrival at Ben Gurion and transfer :: הגעה לנתב״ג (בן גוריון) והעברה
St. Peter's Church, Jaffa :: כנסיית פטרוס הקדוש ביפו
Old Jaffa walk :: סיור רגלי ביפו העתיקה
Mount of Olives panorama :: מבט פנורמי מהר הזיתים
Garden of Gethsemane :: גן גת שמנים
St. Anne's Church and Pool of Bethesda :: כנסיית סנטה אן ובריכת בית חסדא
Via Dolorosa :: הוויה דולורוזה
Church of the Holy Sepulchre :: כנסיית הקבר
Western Wall :: הכותל המערבי
Tower of David :: מגדל דוד
Garden Tomb :: קבר הגן
Israel Museum and Dead Sea Scrolls :: מוזיאון ישראל ומגילות ים המלח
Israel Museum :: מוזיאון ישראל
Yad Vashem :: יד ושם
Masada cable car & entry :: רכבל למצדה וכניסה
Dead Sea float :: ציפה בים המלח
Qumran :: קומראן
Jordan River baptism site :: אתר הטבילה בנהר הירדן
Nazareth Village :: כפר נצרת
Cana :: כפר כנא
Sea of Galilee boat :: שייט בכנרת
Capernaum :: כפר נחום
Mount of Beatitudes :: הר האושר
Tabgha :: טבחה
Caesarea Philippi :: קיסריה פיליפי (בניאס)
Golan Heights lookout :: תצפית ברמת הגולן
Free afternoon in Tiberias :: אחר צהריים חופשי בטבריה
Mount Carmel :: הר הכרמל
Megiddo :: מגידו
Caesarea Maritima :: קיסריה
Bethlehem, Church of the Nativity :: בית לחם, כנסיית המולד
Shepherds' Field :: שדה הרועים
Farewell dinner :: ארוחת פרידה
Free morning :: בוקר חופשי
Free afternoon :: אחר צהריים חופשי
Free day :: יום חופשי
Transfer to Ben Gurion :: העברה לנתב״ג (בן גוריון)
Optional: Tel Aviv food tour :: אופציונלי: סיור אוכל בתל אביב
Optional evening activity :: פעילות ערב אופציונלית
Airport pickup and check-in :: איסוף משדה התעופה וצ׳ק-אין
Orientation walk :: סיור רגלי היכרות
Welcome dinner :: ארוחת ערב פתיחה
Welcome group dinner :: ארוחת ערב קבוצתית לפתיחה
Group dinner :: ארוחת ערב קבוצתית
Mahane Yehuda market :: שוק מחנה יהודה
Carmel market :: שוק הכרמל
Sarona food hall :: מתחם האוכל שרונה
Early group dinner :: ארוחת ערב קבוצתית מוקדמת
Evening show :: מופע ערב
Arrival and transfer to hotel :: הגעה והעברה למלון
Motorcoach departs Tulsa :: האוטובוס יוצא מטולסה
Motorcoach returns to Tulsa :: האוטובוס חוזר לטולסה
Hotel check-in :: צ׳ק-אין במלון
City tour with step-on guide :: סיור עירוני עם מדריך מקומי
Transfer to airport :: העברה לשדה התעופה
Sea of Galilee boat :: שייט בכנרת
Vatican Museums group entry :: כניסה קבוצתית למוזיאוני הוותיקן
Assisi day trip :: טיול יום לאסיזי
Colosseum & Forum entry :: כניסה לקולוסיאום ולפורום
Acropolis entry :: כניסה לאקרופוליס
Ancient Corinth day :: יום בקורינתוס העתיקה
Aegean island cruise :: שייט באיי הים האגאי
Cliffs of Moher day :: יום בצוקי מוהר
Old Library & Book of Kells :: הספרייה העתיקה וספר קלס
Irish music evening :: ערב מוזיקה אירית
Westminster Abbey entry :: כניסה למנזר וסטמינסטר
West End show :: מופע בווסט אנד
Oxford day trip :: טיול יום לאוקספורד
Falls boat tour :: שייט במפלים
CN Tower entry :: כניסה למגדל CN
Niagara wine tasting :: טעימות יין בניאגרה
Evening show tickets :: כרטיסים למופע ערב
Showboat dinner cruise :: שייט ארוחת ערב על ספינת מופעים
Heritage theme park :: פארק שעשועים מורשת
Country music show :: מופע מוזיקת קאנטרי
Historic auditorium tour :: סיור באולם ההיסטורי
Music museum entry :: כניסה למוזיאון המוזיקה
Monuments by night tour :: סיור באנדרטאות בלילה
Mount Vernon entry :: כניסה למאונט ורנון
Smithsonian museum day :: יום במוזיאוני הסמית׳סוניאן
Park entry, group permit :: כניסה לפארק, אישור קבוצתי
Helicopter flight :: טיסת מסוק
Sedona jeep tour :: סיור ג׳יפים בסדונה
Scenic railroad :: רכבת נופית
Lobster bake :: ארוחת לובסטר
Maple farm visit :: ביקור בחוות מייפל
Statue of Liberty & Ellis Island ferry :: מעבורת לפסל החירות ולאליס איילנד
Empire State Building Observatory :: מצפה האמפייר סטייט בילדינג
Radio City Stage Door Tour :: סיור מאחורי הקלעים ברדיו סיטי
Dollywood group admission :: כניסה קבוצתית ל-Dollywood
Dolly Parton's Stampede dinner show :: ארוחה ומופע ב-Dolly Parton's Stampede
Cades Cove loop, Great Smoky Mountains NP :: לולאת קייד קוב, הפארק הלאומי הרי סמוקי
The Alamo guided group tour :: סיור קבוצתי מודרך באלמו
River Walk narrated cruise :: שייט מודרך בריבר ווק
Natural Bridge Caverns :: מערות נייצ׳רל ברידג׳
Skydeck Chicago at Willis Tower :: מצפה סקיידק במגדל וויליס, שיקגו
Architecture river cruise :: שייט אדריכלות בנהר
Shedd Aquarium group entry :: כניסה קבוצתית לאקווריום שד
The National WWII Museum :: המוזיאון הלאומי למלחמת העולם השנייה
Steamboat NATCHEZ jazz cruise :: שייט ג׳אז על ספינת הקיטור נאצ׳ז
Mardi Gras World tour :: סיור בעולם המרדי גרא
Ryman Auditorium guided backstage tour :: סיור מודרך מאחורי הקלעים באולם ריימן
Country Music Hall of Fame and Museum :: היכל התהילה והמוזיאון למוזיקת קאנטרי
The Hermitage, home of President Andrew Jackson :: האחוזה ״הרמיטז׳״, ביתו של הנשיא אנדרו ג׳קסון
General Jackson Showboat lunch or dinner cruise :: שייט ארוחת צהריים או ערב על ספינת General Jackson
Showboat Branson Belle dinner cruise :: שייט ארוחת ערב על ספינת Showboat Branson Belle
Titanic Museum Attraction :: מוזיאון הטיטאניק
Titanic Museum Attraction Pigeon Forge :: מוזיאון הטיטאניק, פיג׳ן פורג׳
Smithsonian National Air and Space Museum :: המוזיאון הלאומי לאוויר וחלל, הסמית׳סוניאן
Mount Vernon, George Washington's estate :: מאונט ורנון, אחוזת ג׳ורג׳ וושינגטון
Ford's Theatre and Petersen House :: תיאטרון פורד ובית פיטרסן
Odyssey plated dinner cruise on the Potomac :: שייט ארוחת ערב בפוטומק (Odyssey)
Arlington National Cemetery Tours :: סיורים בבית הקברות הלאומי ארלינגטון
Grand Canyon National Park, South Rim :: הפארק הלאומי הגרנד קניון, השפה הדרומית
Grand Canyon Railway from Williams :: רכבת הגרנד קניון מוויליאמס
Chapel of the Holy Cross :: קפלת הצלב הקדוש
Tlaquepaque Arts & Shopping Village :: כפר האמנות והקניות טלקפאקה
Mount Washington Cog Railway :: רכבת השיניים של הר וושינגטון
Conway Scenic Railroad :: רכבת קונוויי הנופית
Ben & Jerry's Factory Tour :: סיור במפעל בן אנד ג׳ריס
Freedom Trail Foundation Walk Into History tour :: סיור בשביל החירות בבוסטון
Cadillac Summit Road, Acadia National Park :: דרך פסגת קדילק, הפארק הלאומי אקדיה
Niagara City Cruises Voyage to the Falls :: שייט אל המפלים (Niagara City Cruises)
CN Tower :: מגדל CN
Journey Behind the Falls :: מסע מאחורי המפלים
Royal Ontario Museum :: המוזיאון המלכותי של אונטריו
Ripley's Aquarium of Canada :: האקווריום של ריפליס קנדה
Statue of Liberty and Ellis Island ferry (Statue City Cruises) :: מעבורת לפסל החירות ולאליס איילנד (Statue City Cruises)
National September 11 Memorial & Museum :: האנדרטה והמוזיאון הלאומיים ל-11 בספטמבר
Radio City Music Hall Stage Door Tour :: סיור מאחורי הקלעים ברדיו סיטי מיוזיק הול
Broadway show (official group sales) :: מופע בברודווי (מכירות קבוצות רשמיות)
Ripley's Aquarium of the Smokies :: האקווריום של ריפליס בסמוקיז
Cades Cove Loop, Great Smoky Mountains National Park :: לולאת קייד קוב, הפארק הלאומי הרי סמוקי
The Alamo :: האלמו
River Walk narrated cruise (GO RIO Cruises) :: שייט מודרך בריבר ווק (GO RIO Cruises)
San Antonio Missions National Historical Park :: הפארק ההיסטורי הלאומי של המיסיונים בסן אנטוניו
Lyndon B. Johnson National Historical Park :: הפארק ההיסטורי הלאומי לינדון ב. ג׳ונסון
Chicago Architecture Center River Cruise (Chicago's First Lady) :: שייט אדריכלות בנהר שיקגו (Chicago's First Lady)
Shedd Aquarium :: אקווריום שד
Art Institute of Chicago :: מכון האמנות של שיקגו
Field Museum :: מוזיאון פילד
Mardi Gras World :: עולם המרדי גרא
Oak Alley Plantation tour :: סיור במטע אוק אלי
Preservation Hall :: פרזרווציה הול
Masada National Park :: הפארק הלאומי מצדה
Western Wall Tunnels (guided tour) :: מנהרות הכותל (סיור מודרך)
Church of the Nativity, Bethlehem :: כנסיית המולד, בית לחם
Yardenit Baptismal Site :: אתר הטבילה ירדנית
Vatican Museums and Sistine Chapel :: מוזיאוני הוותיקן וקפלת סיסטינה
Colosseum :: הקולוסיאום
Roman Forum and Palatine Hill :: הפורום הרומי וגבעת הפלטין
St. Peter's Basilica :: בזיליקת פטרוס הקדוש
Basilica of St. Francis, Assisi :: בזיליקת פרנציסקוס הקדוש, אסיזי
Acropolis of Athens :: האקרופוליס של אתונה
Acropolis Museum :: מוזיאון האקרופוליס
Ancient Corinth Archaeological Site and Museum :: אתר ארכאולוגי ומוזיאון קורינתוס העתיקה
Delphi Archaeological Site and Museum :: אתר ארכאולוגי ומוזיאון דלפי
Temple of Poseidon, Cape Sounion :: מקדש פוסידון, כף סוניון
Cliffs of Moher Visitor Experience :: מרכז המבקרים בצוקי מוהר
Book of Kells Experience :: חוויית ספר קלס
Muckross House, Gardens and Traditional Farms :: בית מאקרוס, הגנים והחוות המסורתיות
Kilmainham Gaol Museum :: מוזיאון בית הכלא קילמיינהם
Westminster Abbey :: מנזר וסטמינסטר
Tower of London and Crown Jewels :: מצודת לונדון ותכשיטי הכתר
Shakespeare's Globe theatre tour :: סיור בתיאטרון הגלוב של שייקספיר
Christ Church, Oxford :: קולג׳ כריסט צ׳רץ׳, אוקספורד
Blenheim Palace :: ארמון בלנהיים
Shakespeare's Birthplace :: בית הולדתו של שייקספיר
Airport transfers :: העברות משדה התעופה ואליו
Travel protection :: ביטוח נסיעות
Concert venue and sound :: אולם קונצרטים והגברה
Fuel surcharge (4%) :: תוספת דלק (4%)
Discount :: הנחה
day :: ימים
meal :: ארוחות
person :: נוסעים
room-night :: חדר-לילה
transfer :: העברות
evening :: ערבים
Total :: סה״כ
Tot Global :: סה״כ לקבוצה
Tot PP :: סה״כ לנוסע
Mark up :: תוספת רווח
Vegetarian :: צמחוני
Gluten-free :: ללא גלוטן
Diabetic :: סוכרתי
Nut allergy :: אלרגיה לאגוזים
None :: ללא
Received :: התקבל
Missing :: חסר
`;
TD_LINES.split('\n').forEach(l=>{const i=l.indexOf(' :: ');if(i>0)TD_DICT[l.slice(0,i).trim()]=l.slice(i+4).trim();});
/* numbers with Hebrew plural forms */
const tdN=(n,one,two,many)=>{n=+n;return n===1?one:n===2?two:n+' '+many;};
const tdDays=n=>tdN(n,'יום אחד','יומיים','ימים'),tdNights=n=>tdN(n,'לילה אחד','שני לילות','לילות'),tdHours=n=>tdN(n,'שעה אחת','שעתיים','שעות');
const TD_ROOMS={Twin:'חדרים זוגיים',Single:'חדרים יחידים',Triple:'חדרים משולשים',Quad:'חדרים מרובעי מיטות',Double:'חדרים זוגיים'};
const TD_CITY={};/* English city name -> Hebrew, built from the map data */
try{Object.keys(CITYH).forEach(id=>{const c=GEO.cities[id];if(c&&c.n)TD_CITY[c.n]=CITYH[id];});}catch(e){}
const tdCity=s=>TD_CITY[s]||(TD_DICT[s]!=null?TD_DICT[s]:s);
Object.keys(TD_CITY).forEach(k=>{if(!(k in TD_DICT))TD_DICT[k]=TD_CITY[k];});
try{Object.keys(DESTS).forEach(k=>{const d=DESTS[k];if(!(d.en in TD_DICT))TD_DICT[d.en]=d.he;if(d.country&&CTRYH[d.country]&&!(d.country in TD_DICT))TD_DICT[d.country]=CTRYH[d.country];});}catch(e){}
try{TASK_LIB.forEach(x=>{if(x[5]&&x[6]&&!(x[5] in TD_DICT))TD_DICT[x[5]]=x[6];});Object.keys(OP_OLD_HE).forEach(k=>{if(!(k in TD_DICT))TD_DICT[k]=OP_OLD_HE[k];});}catch(e){}
try{Object.keys(SEGE).forEach(k=>{if(!(SEGE[k] in TD_DICT))TD_DICT[SEGE[k]]=SEGH[k];});}catch(e){}
try{Object.keys(SD_SUB).forEach(k=>{const T=SD_SUB[k];(T.v||[]).forEach(v=>{if(!(v[1] in TD_DICT))TD_DICT[v[1]]=v[2];});(T.note||[]).forEach(n=>{if(n[0]&&n[1]&&!(n[0] in TD_DICT))TD_DICT[n[0]]=n[1];});});}catch(e){}
const TD_UNIT={'room-night':['חדר-לילה','חדר-לילה'],day:['יום','ימים'],meal:['ארוחה','ארוחות'],person:['נוסע','נוסעים'],transfer:['העברה','העברות'],evening:['ערב','ערבים']};
TD_PAT.push(
 [/^([\d,.]+) (room-night|day|meal|person|transfer|evening)s?$/,(n,u)=>n+' '+TD_UNIT[u][+n.replace(/,/g,'')===1?0:1]],
 [/^(Twin|Single|Triple|Quad|Double) rooms?, (\d+) nights?$/,(t,n)=>TD_ROOMS[t]+', '+tdNights(n)],
 [/^Driver room, (\d+) nights? \(comp\)$/,(n)=>'חדר נהג, '+tdNights(n)+' (ללא תשלום)'],
 [/^Group air, Tulsa to (.+)$/,(c)=>'טיסה קבוצתית, טולסה – '+tdCity(c)],
 [/^49-seat coach, (\d+) days?$/,(n)=>'אוטובוס 49 מושבים, '+tdDays(n)],
 [/^Motorcoach, (\d+) days?$/,(n)=>'אוטובוס תיירים, '+tdDays(n)],
 [/^Licensed Christian guide, (\d+) days?$/,(n)=>'מדריך נוצרי מורשה, '+tdDays(n)],
 [/^Tour guide, (\d+) days?$/,(n)=>'מדריך טיולים, '+tdDays(n)],
 [/^Step-on guide, (\d+) days?$/,(n)=>'מדריך מקומי לאוטובוס, '+tdDays(n)],
 [/^Group lunches \((\d+)\)$/,(n)=>'ארוחות צהריים קבוצתיות ('+n+')'],
 [/^Group dinners \((\d+)\)$/,(n)=>'ארוחות ערב קבוצתיות ('+n+')'],
 [/^Driver overtime, (\d+) hours?$/,(n)=>'שעות נוספות לנהג, '+tdHours(n)],
 [/^Duplicate of (.+)$/,(n)=>'כפילות של '+n],
 [/^Sent by (.+) on (.+)$/,(a,d)=>'נשלח על ידי '+a+' ב-'+d],
 [/^(.+) household$/,(n)=>'משפחת '+n],
 [/^Arrive in (.+) on the overnight group flight from Tulsa$/,(c)=>'נחיתה ב'+tdCity(c)+' בטיסת הלילה הקבוצתית מטולסה'],
 [/^Group flight, Tulsa to (.+)$/,(c)=>'טיסה קבוצתית מטולסה ל'+tdCity(c)],
 [/^Motorcoach from Tulsa to (.+)$/,(c)=>'אוטובוס תיירים מטולסה ל'+tdCity(c)],
 [/^Transfer to (.+)$/,(c)=>(TD_CITY[c]!=null?'העברה ל'+TD_CITY[c]:null)],
 [/^Check-in at (.+)$/,(h)=>'צ׳ק-אין ב-'+h],
 [/^Transfer from (.+) to the airport and fly home$/,(c)=>'העברה מ'+tdCity(c)+' לשדה התעופה וטיסה הביתה'],
 [/^Motorcoach from (.+) back to Tulsa$/,(c)=>'אוטובוס התיירים חוזר מ'+tdCity(c)+' לטולסה'],
 [/^Move to (.+?), check in at (.+)$/,(c,h)=>'מעבר ל'+tdCity(c)+', צ׳ק-אין ב-'+h],
 [/^Day trip to (.+), coach both ways$/,(c)=>'יום טיול ל'+tdCity(c)+' (נסיעה הלוך ושוב)'],
 [/^Guided tour of (.+)$/,(c)=>'סיור מודרך ב'+tdCity(c)],
 [/^Free day in (.+), optional excursions$/,(c)=>'יום חופשי ב'+tdCity(c)+', סיורי רשות']
);
const tdEsc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const tdUnesc=s=>s.replace(/&#0?39;|&apos;|&rsquo;/g,"'").replace(/&quot;/g,'"').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const TD_CACHE=new Map();
function tdHe(s){
  if(typeof s!=='string')return s;
  const k=s.trim();if(!k)return s;
  if(Object.prototype.hasOwnProperty.call(TD_DICT,k))return TD_DICT[k];
  for(let i=0;i<TD_PAT.length;i++){const m=k.match(TD_PAT[i][0]);if(m){const r=TD_PAT[i][1](...m.slice(1));if(r!=null)return r;}}
  const sf=k.match(/^(.+?)( \([^()]*\))$/);/* "Airport pickup and check-in (2 שעות)": translate the name, keep the suffix */
  if(sf){const h=tdHe(sf[1]);if(h!==sf[1])return h+sf[2];}
  return s;
}
function tdNode(raw){
  let r=TD_CACHE.get(raw);if(r!==undefined)return r;
  r=raw;
  const m=raw.match(/^(\s*(?:[·•–—:|]\s+)?)([\s\S]*?)(\s*)$/),lead=m[1],core=m[2],trail=m[3];
  if(core&&/[A-Za-z]/.test(core)){
    const dec=tdUnesc(core);let out=tdHe(dec);
    if(out===dec&&/ (·|—|\||›) /.test(dec)){ /* "Day 3 · Western Wall": translate parts that are whole phrases */
      const parts=dec.split(/( (?:·|—|\||›) )/);let ch=false;
      const o2=parts.map((p,i)=>{if(i%2)return p;const x=tdHe(p);if(x!==p)ch=true;return x;});if(ch)out=o2.join('');}
    if(out!==dec)r=lead+tdEsc(out)+trail;
  }
  if(TD_CACHE.size>6000)TD_CACHE.clear();
  TD_CACHE.set(raw,r);return r;
}
const TD_RE=/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|(>)([^<>]+)(?=<)/g;
const tdRun=h=>h.replace(TD_RE,(m,g,txt)=>g?'>'+tdNode(txt):m);
/* the client-facing PDF proposal (s4_views qView) is an English document for US clients: it stays whole */
function tdSplitDoc(html){
  const a=html.indexOf('<div class="doc"><div class="hero">');
  if(a>=0){const b=html.indexOf('<div class="card" style="order:-1">',a);if(b>a)return [html.slice(0,a),html.slice(b)];}
  return [html];
}
function heData(html){
  if(typeof html!=='string'||!html)return html;
  const p=tdSplitDoc(html);
  if(p.length===1)return tdRun(html);
  return tdRun(p[0])+html.slice(p[0].length,html.length-p[1].length)+tdRun(p[1]);
}
/* ---------- leftover finder (used by the tests): text nodes with >=2 consecutive English words that are not proper names ---------- */
function tdAllowRe(){
  const n=new Set();
  const add=x=>{if(x&&typeof x==='string'&&x.length>2)n.add(x);};
  try{SUPPLIERS.forEach(s=>add(s.name));}catch(e){}
  try{(CATALOG.hotels||[]).forEach(h=>{add(h.name);add(h.brand);add(h.family);});(CATALOG.venues||[]).forEach(v=>{add(v.name);add(v.brand);});(CATALOG.airlines||[]).forEach(a=>{add(a.name);add(a.code);});}catch(e){}
  try{Object.keys(DESTS).forEach(k=>{const d=DESTS[k];add(d.en);add(d.country);(d.hotel||[]).slice(0,1).forEach(add);(d.acts||[]).forEach(a=>add(a[1]));[d.coach,d.shut,d.guide,d.meal].forEach(x=>x&&add(x[0]));});}catch(e){}
  try{CLIENTS.forEach(c=>{add(c.name);add(c.contact&&c.contact.name);add(c.contact&&c.contact.email);add(c.city);});}catch(e){}
  try{TRIPS.forEach(t=>{add(t.name);add(t.client);if(t.contact)add(t.contact.name||t.contact);});}catch(e){}
  try{STAFF.forEach(s=>{add(s.en);add(s.email);});}catch(e){}
  try{Object.keys(AGE).forEach(k=>add(AGE[k]));FIRST.forEach(add);SUR.forEach(add);add('Hayes');}catch(e){}
  try{Object.keys(GEO.cities).forEach(k=>{const c=GEO.cities[k];add(c.n||c.name);});}catch(e){}
  try{(typeof BRANDS==='object'?Object.keys(BRANDS):[]).forEach(add);}catch(e){}
  ['Redbud Group Tours','Triplanet','Maya','QuickBooks Online','QuickBooks','Xero','Priority','Hashavshevet','Claude','Tulsa','Public Sans','SkyGroup Air Desk','SafeJourney Protection','Cedar Hills Community Church','Lincoln Park Middle School','Prairie Hills Seniors Club','Green Country Youth Chorale','Red River Alumni Association'].forEach(add);
  const a=[...n].sort((x,y)=>y.length-x.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
  return a.length?new RegExp(a.join('|'),'g'):/$^/g;
}
const TD_WORDS=/[A-Za-z][A-Za-z'’.&\-]+(?:\s+|\/)[A-Za-z][A-Za-z'’.&\-]+/;
function tdLeft(html,allowRe){
  const re=allowRe||tdAllowRe(),out=[];
  tdSplitDoc(String(html)).forEach(part=>part.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|>([^<>]+)(?=<)/g,(m,txt)=>{
    if(!txt)return m;
    let s=tdUnesc(txt).trim();if(!s)return m;
    s=s.replace(/https?:\/\/\S+|[\w.+-]+@[\w.-]+|\b[A-Z]{2,5}-\d+\b|\b(?:USD|EUR|GBP|CAD|ILS)\b/g,' ').replace(re,' ');
    if(/[\u0590-\u05FF]/.test(s))s=s.replace(/\b[A-Z][\w'’.&\-]*(?:\s+[A-Z&][\w'’.&\-]*)*/g,' ');/* mixed node: capitalised runs are names */
    if(TD_WORDS.test(s))out.push(tdUnesc(txt).trim());
    return m;}));
  return out;
}
/* ---------- tests ---------- */
TESTS.push({name:'td Hebrew data strings',run:h=>{
  const out=[],{S}=h,keep={lang:S.lang,tab:S.tab,tripId:S.tripId,ptab:S.ptab,tbView:S.tbView,prFmt:S.prFmt,openDay:S.openDay};
  /* 1. phrases and patterns */
  const eq=(a,b)=>{const r=tdHe(a);if(r!==b)out.push('tdHe '+a+' => '+r+' (want '+b+')');};
  eq('Twin rooms, 9 nights','חדרים זוגיים, 9 לילות');eq('Quad rooms, 1 night','חדרים מרובעי מיטות, לילה אחד');eq('Free morning','בוקר חופשי');
  eq('Step-on guide, 3 days','מדריך מקומי לאוטובוס, 3 ימים');eq('Step-on guide, 2 days','מדריך מקומי לאוטובוס, יומיים');eq('Group lunches (8)','ארוחות צהריים קבוצתיות (8)');
  eq('Group air, Tulsa to Boston','טיסה קבוצתית, טולסה – בוסטון');eq('Duplicate of INV-0412','כפילות של INV-0412');eq('Western Wall','הכותל המערבי');
  eq('Hilton Nashville Downtown','Hilton Nashville Downtown');eq('INV-0412','INV-0412');eq('12,345','12,345');eq('','');
  Object.keys(TD_DICT).forEach(k=>{const v=TD_DICT[k];if(!/[֐-׿]/.test(v))out.push('dict value without Hebrew: '+k);if(/["<>&]/.test(v))out.push('dict value has markup chars: '+k);});
  /* 2. every generated name has Hebrew: line names, plan items, templates, tasks */
  const un=new Set(),need=n=>{if(typeof n==='string'&&n&&tdHe(n)===n)un.add(n);};
  Object.keys(DESTS).forEach(k=>{Object.keys(SEG).forEach(sg=>{[20,38,55].forEach(px=>genLines(sg,k,px,k==='HolyLand'?9:4).forEach(l=>{if(l.type!=='Activities'||DESTS[k].acts.some(a=>a[0]===l.name))need(l.name);}));});
    DESTS[k].acts.forEach(a=>need(a[0]));[0,1,2,3,4,5,6].forEach(sd=>{const R=rng(sd+11);genItems(k,6,R).forEach(i=>need(i.name));});});
  HL_ITEMS.forEach(i=>need(i[0]));DAYTPL.forEach(d=>d.items.forEach(i=>need(i[0])));
  NEN_LINES.forEach(x=>need(x[2]));TASKT.forEach(x=>need(x[0]));TASK_LIB.forEach(x=>need(x[5]));
  (CATALOG.venues||[]).forEach(v=>{if(/\b(tour|cruise|museum|entry|ferry|railway|park|abbey|basilica|chapel|palace|site)\b/i.test(v.name))need(v.name);});
  if(un.size)out.push('names without Hebrew ('+un.size+'): '+[...un].slice(0,25).join(' | '));
  /* 3. rendered screens in Hebrew: no English phrases left that are not proper names (client-facing English documents are excluded by design) */
  const re=tdAllowRe(),left={};let nodes=0;
  const scan=(html,w)=>{const o=heData(html);nodes+=o.length;tdLeft(o,re).forEach(x=>{(left[x]=left[x]||[]).push(w);});return o;};
  S.lang='he';S.tab='trip';S.openDay=1;
  ['hl','nen','irl','bra','dc2'].forEach(id=>{S.tripId=id;
    ['day','comp'].forEach(v=>{S.tbView=v;S.ptab='plan';scan(vTrip(),id+'/plan:'+v);});S.tbView='day';
    ['costs','tbver','manifest','optasks'].forEach(tb=>{S.ptab=tb;scan(vTrip(),id+'/'+tb);});
    ['pdf','table','landing'].forEach(f=>{S.prFmt=f;S.ptab='quote';scan(vTrip(),id+'/quote:'+f);});S.prFmt='pdf';});
  Object.keys(left).forEach(k=>out.push('English left in Hebrew: "'+k.slice(0,90)+'" on '+left[k][0]));
  /* 4. attributes, scripts and tag skeletons stay as they were; idempotent; English untouched */
  const skel=x=>x.replace(/>[^<>]*(?=<)/g,'>');
  S.tripId='hl';S.ptab='plan';S.tbView='day';const a=vTrip(),b=heData(a);
  if(skel(a)!==skel(b))out.push('tag skeleton changed');
  if(b===a)out.push('plan page not translated at all');
  if(heData(b)!==b)out.push('heData not idempotent');
  const probe='<td title="Western Wall" data-x="Free morning">Western Wall</td><scr'+'ipt>var x="Free morning";if(a>b)Free<c</scr'+'ipt><a href="https://x.example/Western Wall">Hello Western Wall x</a><b>12</b><i>Hilton Nashville Downtown</i>';
  const pr=heData(probe);
  if(!pr.includes('title="Western Wall"')||!pr.includes('data-x="Free morning"')||!pr.includes('href="https://x.example/Western Wall"'))out.push('attribute touched');
  if(!pr.includes('var x="Free morning"'))out.push('script touched');
  if(!pr.includes('>הכותל המערבי</td>')||!pr.includes('>Hello Western Wall x</a>')||!pr.includes('<b>12</b>')||!pr.includes('<i>Hilton Nashville Downtown</i>'))out.push('whole-node rule broken: '+pr);
  if(heData('<td>St. Peter&#39;s Church, Jaffa</td>')!=='<td>כנסיית פטרוס הקדוש ביפו</td>')out.push('entity key');
  S.lang='en';if(heDataIf(a)!==a)out.push('English mode touched');
  Object.assign(S,keep);
  console.log('td: dict',Object.keys(TD_DICT).length,'patterns',TD_PAT.length,'Hebrew chars checked',nodes);
  return out;}});
