/* ---------- v8 people data (spec-v8-parity.md 3.3-3.6, A1, A4, A13): clients, staff, roles, permissions, traveler extras ----------
   Data only, no UI. Deterministic (own rng per item), no Date.now/Math.random. Loaded after s1c_catalog.js;
   S, ROLE_KEYS, isMgr... live in s3_shell.js (loaded later), so they are only touched inside functions. */

/* ---------- clients ---------- */
const CLI_CONTACTS=[['Margaret Hollis','Church administrator'],['Father Thomas Keane','Pastor'],['Linda Prescott','Alumni director'],['Walter Dunmore','Club president'],['Sheila Ramos','Trip chaperone lead'],
  ['Carolyn Pierce','Music director'],['Gary Whitlow','Activities chair'],['Rev. Alan Mercer','Senior pastor'],['Denise Foster','Head of school travel'],['Pastor Ruth Alvarado','Missions pastor'],
  ['Janet Okoye','Managing partner'],['Helen Brandt','Association secretary'],['Dennis Hale','Choir director'],['Monica Tran','Parish secretary'],['Roy Castellano','Club treasurer'],
  ['Beth Lindqvist','Office manager'],['Frank Odell','Deacon'],['Priscilla Vance','Principal'],['Harold Kemp','Events coordinator'],['Tamara Boyd','Program director'],
  ['Louise Garrity','Secretary'],['Neil Ashford','Chair'],['Paula Redmond','Director'],['Steven Cho','President']];
const CLI_PLACES=[['Tulsa','OK'],['Broken Arrow','OK'],['Owasso','OK'],['Bartlesville','OK'],['Muskogee','OK'],['Claremore','OK'],['Sapulpa','OK'],['Jenks','OK'],['Stillwater','OK'],['Norman','OK'],['Enid','OK'],['Ponca City','OK'],['Coweta','OK'],['Bixby','OK'],['Sand Springs','OK']];
const CLI_NOTES={
  Church:[['Prefers morning departures and a daily devotion slot. Pays the deposit by check.','מעדיפים יציאות בבוקר ושעת תפילה יומית. משלמים מקדמה בהמחאה.'],['Pastor joins every trip. Ask about dietary needs early.','הכומר מצטרף לכל טיול. כדאי לברר העדפות מזון מוקדם.']],
  School:[['Needs chaperone ratio and parent consent forms. Budget sensitive.','נדרש יחס מלווים וטפסי הסכמת הורים. רגישים למחיר.'],['Books a year ahead around the school calendar.','מזמינים שנה מראש לפי לוח השנה של בית הספר.']],
  Club:[['Active members, repeat bookings every spring and fall.','חברים פעילים, הזמנות חוזרות כל אביב וסתיו.'],['Prefers hotels with an elevator and short coach days.','מעדיפים מלונות עם מעלית ויום נסיעה קצר.']],
  Association:[['Board approves the itinerary. Likes a signature dinner on each trip.','הוועד מאשר את המסלול. אוהבים ארוחת ערב מרכזית בכל טיול.'],['Members are mostly retired. Single supplement questions are common.','רוב החברים גמלאים. שאלות על תוספת יחיד שכיחות.']],
  Choir:[['Needs a performance venue and rehearsal space on tour.','צריכים אולם הופעה ומקום חזרות בטיול.'],['Music director leads the planning. Parents pay in installments.','מנהלת המקהלה מובילה את התכנון. ההורים משלמים בתשלומים.']],
  Agency:[['Partner agency. Books our programs for its own clients, net rates.','סוכנות שותפה. מזמינה את התוכניות שלנו ללקוחות שלה, במחירי נטו.']],
  Prospect:[['Cold lead from the trade show list. No trip planned yet.','ליד קר מרשימת התערוכה. עדיין אין טיול מתוכנן.'],['Asked for a brochure. Follow up in spring.','ביקשו חוברת. לחזור אליהם באביב.']]};
const CLI_PROSPECTS=[
  ['Oakridge Christian Academy','School','Bixby','OK',null],['First Methodist of Sapulpa','Church','Sapulpa','OK',['Open lead: choir tour to Nashville in spring 2028, wants a quote by January.','ליד פתוח: סיור מקהלה בנאשוויל באביב 2028, רוצים הצעה עד ינואר.']],
  ['Cedar Hollow Senior Center','Club','Owasso','OK',null],['Verdigris Valley Garden Club','Club','Claremore','OK',['Open lead: 28 members asking about a New England foliage trip next October.','ליד פתוח: 28 חברים מתעניינים בטיול עלים בניו אינגלנד באוקטובר הבא.']],
  ['Hillcrest Community Choir','Choir','Tulsa','OK',null],['Northgate Alumni Council','Association','Norman','OK',null],
  ['Bluestem Retired Firefighters Assn.','Association','Stillwater','OK',['Open lead: reunion trip to Washington DC, 35 people, met at the booth in Tulsa.','ליד פתוח: טיול מפגש בוושינגטון, 35 משתתפים, נפגשו בביתן בטולסה.']],
  ['St. Brendan Parish','Church','Enid','OK',null],['Prairie Ridge Middle School','School','Ponca City','OK',null],['Cherokee Hills Baptist Church','Church','Muskogee','OK',null]];
const CLI_EXEMPT_OFF={'Heritage Christian Academy':false};
function genClients(){
  const out=[],seen={};let k=0;
  const mk=(name,kind,place,lead,trips)=>{const type=trips===0?'Prospect':kind;
    const R=rng(7100+k*131),ph=()=>'918-555-01'+String(Math.floor(R()*100)).padStart(2,'0');
    const cn=CLI_CONTACTS[k%CLI_CONTACTS.length],pl=place||CLI_PLACES[Math.floor(R()*CLI_PLACES.length)];
    const tax=kind==='Church'||kind==='School'||kind==='Choir'||kind==='Association';
    const src=type==='Prospect'||lead?['Trade show','Website','Referral'][Math.floor(R()*3)]:trips>1?'Repeat':['Referral','Website','Trade show','Repeat'][Math.floor(R()*4)];
    const nv=CLI_NOTES[type]||CLI_NOTES.Prospect,nt=nv[k%nv.length];
    const slug=name.toLowerCase().replace(/\(.*?\)/g,'').replace(/[^a-z0-9]+/g,'').slice(0,18);
    const c={id:'cl'+String(k+1).padStart(2,'0'),name,type,city:pl[0],state:pl[1],
      contact:{name:cn[0],role:cn[1],email:cn[0].toLowerCase().replace(/^(rev\.|father|pastor)\s+/,'').replace(/[^a-z]+/g,'.').replace(/^\.|\.$/g,'')+'@'+slug+'.example',phone:ph()},
      since:type==='Prospect'?2026:2014+Math.floor(R()*12),taxExempt:CLI_EXEMPT_OFF[name]!==undefined?CLI_EXEMPT_OFF[name]:tax,source:src,
      kind,notes:{en:nt[0],he:nt[1]}};
    if(type==='Prospect')c.lead=lead?{open:true,en:lead[0],he:lead[1]}:{open:false,en:'',he:''};
    out.push(c);k++;
  };
  TRIP_SPECS.forEach(sp=>{const nm=sp[3];if(seen[nm])return;seen[nm]={type:sp[4],n:TRIP_SPECS.filter(x=>x[3]===nm).length};});
  Object.keys(seen).forEach(nm=>{const place=nm==='Wheatland Travel (partner agency)'?['Wichita','KS']:null;mk(nm,seen[nm].type,place,null,seen[nm].n);});
  CLI_PROSPECTS.forEach(p=>mk(p[0],p[1],[p[2],p[3]],p[4],0));
  return out;
}
const CLIENTS=genClients(),CLI_BY={};
const cliIndex=()=>{Object.keys(CLI_BY).forEach(k=>delete CLI_BY[k]);CLIENTS.forEach(c=>{CLI_BY[c.id]=c;});};
cliIndex();
/* clients are joined to trips by name (alClients() stays the aggregate); null when the name is not in the agency list */
const cliByName=name=>CLIENTS.find(c=>c.name===name)||null;
function cliUpdate(id,patch){const c=CLI_BY[id];if(!c)return null;Object.assign(c,patch||{});return c;}
function cliAdd(c){const id='cl'+String(CLIENTS.reduce((a,x)=>Math.max(a,parseInt(String(x.id).slice(2),10)||0),0)+1).padStart(2,'0');
  const n={id,name:'',type:'Prospect',city:'',state:'',contact:{name:'',role:'',email:'',phone:''},since:2026,taxExempt:false,source:'Website',notes:{en:'',he:''},...(c||{}),id};
  CLIENTS.push(n);CLI_BY[id]=n;return n;}

/* ---------- staff, roles ---------- */
const STAFF_TARGET={Priya:380000,Dana:300000,Marcus:360000,Grace:340000,Luis:280000,Tom:260000};
function genStaff(){
  const out=[{key:'manager',en:'Ella Brooks',he:'אלה ברוקס',role:'owner',email:'ella.brooks@redbudtours.example',phone:'918-555-0101',target:null,active:true},
    {key:'accountant',en:'Nora Kim',he:'נורה קים',role:'accountant',email:'nora.kim@redbudtours.example',phone:'918-555-0102',target:null,active:true}];
  AGENTS.forEach((a,i)=>out.push({key:a,en:AGE[a],he:AGN[a],role:'agent',email:AGE[a].toLowerCase().replace(/[^a-z]+/g,'.')+'@redbudtours.example',phone:'918-555-01'+String(10+i),target:STAFF_TARGET[a],active:true}));
  /* v8.4: the operations coordinator, a real person behind the "Ops desk" queue (tasks keep who:'Ops desk') */
  out.push({key:'ops',en:'Kelsey Dawson',he:'קלסי דוסון',role:'ops',email:'kelsey.dawson@redbudtours.example',phone:'918-555-0103',target:null,active:true});
  out.push({key:'Ops desk',en:'Ops desk',he:'צוות תפעול',role:'ops',email:'ops@redbudtours.example',phone:'918-555-0100',target:null,active:true});
  return out;
}
const STAFF=genStaff(),STAFF_BY={};
const staffIndex=()=>{Object.keys(STAFF_BY).forEach(k=>delete STAFF_BY[k]);STAFF.forEach(s=>{STAFF_BY[s.key]=s;});};
staffIndex();
const ROLES={owner:{en:'Owner',he:'בעלים'},admin:{en:'Admin',he:'מנהל/ת מערכת'},agent:{en:'Agent',he:'סוכן/ת'},accountant:{en:'Accountant',he:'חשב/ת'},ops:{en:'Operations',he:'תפעול'}};
/* role of a role key (S.role) or staff key: manager -> owner, accountant -> accountant, agents -> agent */
const roleOf=key=>{const s=STAFF_BY[key];return s&&ROLES[s.role]?s.role:'agent';};
function staffUpdate(key,patch){const s=STAFF_BY[key];if(!s)return null;Object.assign(s,patch||{});return s;}

/* ---------- permissions: 40 in 9 groups ---------- */
const PERM_GROUPS=[{k:'proj',en:'Projects',he:'פרויקטים'},{k:'price',en:'Pricing',he:'תמחור'},{k:'prop',en:'Proposals',he:'הצעות'},{k:'ops',en:'Operations',he:'תפעול'},{k:'fin',en:'Finance',he:'כספים'},
  {k:'sup',en:'Suppliers & catalog',he:'ספקים וקטלוג'},{k:'cli',en:'Clients',he:'לקוחות'},{k:'users',en:'Users & settings',he:'משתמשים והגדרות'},{k:'ai',en:'AI',he:'בינה מלאכותית'}];
/* [key, group, en, he, denied for agent?, denied for accountant?, denied for admin?] (owner always allowed) */
const PERM_ROWS=[
  ['proj.viewAll','proj','See all projects','צפייה בכל הפרויקטים',1,0,0],['proj.create','proj','Create projects and quotes','יצירת פרויקטים והצעות',0,1,0],['proj.edit','proj','Edit project details','עריכת פרטי פרויקט',0,1,0],
  ['proj.delete','proj','Delete projects','מחיקת פרויקטים',1,1,0],['proj.assign','proj','Reassign the responsible agent','שינוי הסוכן האחראי',1,1,0],
  ['price.edit','price','Edit prices and markups','עריכת מחירים ומרווחים',0,1,0],['price.seeCost','price','See supplier costs','צפייה בעלויות ספקים',0,0,0],['price.overrideMarkup','price','Override the default markup','שינוי מרווח ברירת מחדל',1,1,0],
  ['price.discount','price','Give client discounts','מתן הנחות ללקוח',0,1,0],['price.templates','price','Manage pricing templates','ניהול תבניות תמחור',1,1,0],
  ['prop.send','prop','Send proposals to clients','שליחת הצעות ללקוחות',0,1,0],['prop.approve','prop','Approve proposals before sending','אישור הצעות לפני שליחה',1,1,0],['prop.formats','prop','Choose proposal formats','בחירת תבניות הצעה',0,1,0],
  ['prop.public','prop','Publish a public proposal link','פרסום קישור ציבורי להצעה',0,1,0],
  ['ops.tasks','ops','Manage operations tasks','ניהול משימות תפעול',0,1,0],['ops.manifest','ops','Edit the master list of travelers','עריכת רשימת הנוסעים',0,1,0],['ops.suppliers','ops','Manage trip suppliers and confirmations','ניהול ספקי הטיול ואישורים',0,1,0],
  ['ops.blocks','ops','Manage room blocks','ניהול בלוקים של חדרים',0,1,0],['ops.messages','ops','Send traveler messages','שליחת הודעות לנוסעים',0,1,0],
  ['fin.view','fin','See finance pages','צפייה בדפי הכספים',0,0,0],['fin.issueDocs','fin','Issue invoices and receipts','הפקת חשבוניות וקבלות',1,0,0],['fin.recordPayment','fin','Record payments','רישום תשלומים',1,0,0],
  ['fin.approveBills','fin','Approve supplier bills','אישור חשבוניות ספקים',1,0,0],['fin.dispute','fin','Dispute supplier invoices','הגשת השגות על חשבוניות ספקים',1,0,0],['fin.sync','fin','Run accounting sync','הפעלת סנכרון הנהלת חשבונות',1,0,0],
  ['fin.export','fin','Export finance data','ייצוא נתוני כספים',1,0,0],
  ['sup.edit','sup','Edit suppliers','עריכת ספקים',0,0,0],['sup.rates','sup','Edit supplier rate cards','עריכת מחירוני ספקים',1,1,0],['sup.swap','sup','Swap a supplier on a trip line','החלפת ספק בשורת טיול',0,1,0],
  ['cat.edit','sup','Edit the hotel and venue catalog','עריכת קטלוג מלונות ואתרים',1,1,0],
  ['cli.view','cli','See clients','צפייה בלקוחות',0,0,0],['cli.edit','cli','Edit clients','עריכת לקוחות',0,0,0],['cli.export','cli','Export client lists','ייצוא רשימות לקוחות',1,0,0],
  ['users.manage','users','Manage users','ניהול משתמשים',1,1,0],['users.roles','users','Edit roles and permissions','עריכת תפקידים והרשאות',1,1,1],['settings.edit','users','Edit agency settings','עריכת הגדרות הסוכנות',1,1,0],
  ['settings.stages','users','Customize project stages','התאמת שלבי פרויקט',1,1,0],['forms.build','users','Build traveler forms','בניית טפסים לנוסעים',0,1,0],
  ['ai.maya','ai','Use Maya, the AI assistant','שימוש במאיה, העוזרת החכמה',0,0,0],['ai.live','ai','Use live AI answers','שימוש בתשובות AI חיות',0,0,0]];
/* v8.4: the operations coordinator sees every file and edits only operations (spec-v8.4 §2.1) */
const OPS_PERMS=new Set(['proj.viewAll','price.seeCost','ops.tasks','ops.manifest','ops.suppliers','ops.blocks','ops.messages','sup.edit','cli.view','forms.build','ai.maya','ai.live']);
const PERMS=PERM_ROWS.map(r=>({k:r[0],group:r[1],en:r[2],he:r[3],owner:true,admin:!r[6],agent:!r[4],accountant:!r[5],ops:OPS_PERMS.has(r[0])}));
const PERM_BY={};PERMS.forEach(p=>{PERM_BY[p.k]=p;});
/* can(k): the current role (S.role) from the S.perms override ({role:{perm:bool}}, set by the settings screen) else the defaults */
function can(k){
  const p=PERM_BY[k];if(!p)return false;
  const role=roleOf(typeof S!=='undefined'?S.role:'manager'),o=typeof S!=='undefined'&&S.perms&&S.perms[role];
  return o&&typeof o[k]==='boolean'?o[k]:!!p[role];
}

/* ---------- persisted edits (A5): clients and staff, reset to the generated data ---------- */
const jclone=x=>JSON.parse(JSON.stringify(x));
PERSIST.push({key:'pe-clients',get:()=>jclone(CLIENTS),set:v=>{if(Array.isArray(v)&&v.length){CLIENTS.splice(0,CLIENTS.length,...v);cliIndex();}},reset:()=>{CLIENTS.splice(0,CLIENTS.length,...genClients());cliIndex();}});
PERSIST.push({key:'pe-staff',get:()=>jclone(STAFF),set:v=>{if(Array.isArray(v)&&v.length){STAFF.splice(0,STAFF.length,...v);staffIndex();}},reset:()=>{STAFF.splice(0,STAFF.length,...genStaff());staffIndex();}});

/* ---------- traveler extras (A1, A13): passport, dob, emergency contact, room type, form status ---------- */
const TRV_OCC={Faith:2,Student:4,Senior:2,Choir:3,Alumni:2};
const TRV_DOB={Faith:[1950,1990],Student:[2012,2013],Senior:[1944,1958],Choir:[2009,2011],Alumni:[1952,1975]};
const roomTypeOf=(n,per)=>n<=1?'Single':n===2?(per===2?'Twin':'Double'):n===3?'Triple':'Quad';
const hashId=s=>[...String(s)].reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,7);
function tripExtras(t){
  if(!t.trav||!t.trav.length)return;
  const R=rng(8800+hashId(t.id)),per=TRV_OCC[t.seg]||2,intl=!!(DESTS[t.dest]&&DESTS[t.dest].intl),ret=addDays(t.dep,t.nights);
  const toDep=(D(t.dep)-TODAY)/DAY,pf=t.stage==='Operations'?(toDep<30?.9:toDep<90?.65:.4):1;
  const occ={};t.trav.forEach(x=>{occ[x.room]=(occ[x.room]||0)+1;});
  const dr=TRV_DOB[t.seg]||[1950,1980];
  const st=(r,p)=>t.stage!=='Operations'?'done':r<p?'done':r<p+(1-p)*.55?'sent':'not sent';
  t.trav.forEach(x=>{
    /* fixed number of draws per traveler, so a partially filled record never shifts the rest */
    const r=[R(),R(),R(),R(),R(),R(),R(),R(),R(),R(),R(),R()];
    if(x.pass!=='Missing'){
      if(!x.passNo)x.passNo='•••• '+String(1000+Math.floor(r[0]*9000));
      if(!x.passExp)x.passExp=intl&&r[1]<.06?addDays(ret,20+Math.floor(r[2]*150)):addDays(ret,200+Math.floor(r[2]*3000));
    }
    if(!x.dob){const y=dr[0]+Math.floor(r[3]*(dr[1]-dr[0]+1));x.dob=y+'-'+String(1+Math.floor(r[4]*12)).padStart(2,'0')+'-'+String(1+Math.floor(r[5]*28)).padStart(2,'0');}
    if(!x.emerg){const sur=String(x.n).split(' ').slice(1).join(' ')||'Contact';x.emerg={name:FIRST[Math.floor(r[6]*FIRST.length)]+' '+(r[7]<.7?sur:sur+'-Hayes'),phone:'918-555-01'+String(Math.floor(r[8]*100)).padStart(2,'0')};}
    if(!x.roomType)x.roomType=roomTypeOf(occ[x.room]||1,per);
    if(!x.form)x.form={reg:st(r[9],Math.min(1,pf+.1)),med:st(r[10],pf*.9),waiver:st(r[11],pf*.8)};
  });
}
TRIP_INIT.push(t=>tripExtras(t));

/* ---------- room block (A1, A13): computed on demand from t.room, never stored ---------- */
function blockOf(t){
  if(!t||!t.room)return null;
  const per=TRV_OCC[t.seg]||2,types={};
  if(t.trav&&t.trav.length){const seen={};t.trav.forEach(x=>{if(seen[x.room])return;seen[x.room]=1;const ty=x.roomType||'Twin';types[ty]=(types[ty]||0)+1;});}
  else{const full=Math.floor(t.pax/per),rem=t.pax%per;if(full)types[roomTypeOf(per,per)]=full;if(rem)types.Single=(types.Single||0)+rem;}
  const open=t.room.held-t.room.used,rr=typeof releaseRisk==='function'?releaseRisk(t):null;
  return {hotel:t.room.hotel,held:t.room.held,picked:t.room.used,open,cutoff:addDays(t.dep,-30),attrition:t.room.held?r2(open/t.room.held*100):0,types,exposure:rr?rr.amt:0};
}

/* ---------- tests ---------- */
TESTS.push({name:'people data',run:h=>{const out=[],S=h.S;
  console.log('people: clients',CLIENTS.length,'staff',STAFF.length,'perms',PERMS.length);
  if(PERMS.length!==40)out.push('perm count '+PERMS.length);
  if(new Set(PERMS.map(p=>p.group)).size!==9||PERMS.some(p=>!PERM_GROUPS.some(g=>g.k===p.group)))out.push('perm groups');
  if(new Set(PERMS.map(p=>p.k)).size!==40)out.push('duplicate perm keys');
  PERMS.forEach(p=>{if(!p.en||!/[֐-׿]/.test(p.he)||/[A-Za-z]{3}/.test(p.he))out.push('perm labels '+p.k);});
  PERM_GROUPS.forEach(g=>{if(!g.en||!/[֐-׿]/.test(g.he))out.push('group labels '+g.k);});
  ['proj.viewAll','proj.create','proj.delete','price.edit','price.seeCost','price.overrideMarkup','prop.send','prop.approve','ops.tasks','ops.manifest','ops.suppliers','fin.view','fin.issueDocs','fin.recordPayment','fin.approveBills','fin.dispute','fin.sync','fin.export','sup.edit','sup.rates','cli.edit','users.manage','settings.edit','forms.build','ai.live'].forEach(k=>{if(!PERM_BY[k])out.push('missing perm '+k);});
  const roles=['manager','accountant','Priya','Tom'];
  roles.forEach(r=>{S.role=r;PERMS.forEach(p=>{if(typeof can(p.k)!=='boolean')out.push('can not boolean '+r+' '+p.k);});});
  if(roleOf('manager')!=='owner'||roleOf('accountant')!=='accountant'||AGENTS.some(a=>roleOf(a)!=='agent'))out.push('roleOf');
  ['proj.viewAll','prop.approve','fin.issueDocs','fin.approveBills','fin.sync','users.manage','settings.edit'].forEach(k=>{AGENTS.forEach(a=>{S.role=a;if(can(k))out.push('agent can '+k);});});
  S.role='accountant';['price.edit','prop.send','ops.manifest'].forEach(k=>{if(can(k))out.push('accountant can '+k);});
  PERMS.filter(p=>p.group==='fin').forEach(p=>{if(!can(p.k))out.push('accountant cannot '+p.k);});
  S.role='manager';PERMS.forEach(p=>{if(!can(p.k))out.push('owner cannot '+p.k);});
  S.role='Priya';if(can('users.manage'))out.push('pre-override');S.perms={agent:{'users.manage':true,'fin.view':false}};
  if(!can('users.manage')||can('fin.view')||!can('price.edit'))out.push('S.perms override');S.perms=undefined;
  if(can('nope.x')!==false)out.push('unknown perm');
  const st=STAFF_BY.accountant;if(!st||st.en!=='Nora Kim'||st.role!=='accountant'||!/[֐-׿]/.test(st.he))out.push('Nora Kim');
  if(STAFF.length!==10)out.push('staff count '+STAFF.length);
  AGENTS.forEach(a=>{const s=STAFF_BY[a];if(!s||!(s.target>0)||s.en!==AGE[a]||s.he!==AGN[a])out.push('agent staff '+a);});
  STAFF.forEach(s=>{if(!/\.example$/.test(s.email))out.push('staff email '+s.key);});
  /* clients */
  TRIPS.forEach(t=>{if(!cliByName(t.client))out.push('client not found '+t.client);else if(cliByName(t.client).type!==t.ctype)out.push('client type '+t.client);});
  const pr=CLIENTS.filter(c=>c.type==='Prospect');
  if(pr.length!==10)out.push('prospects '+pr.length);if(pr.filter(c=>c.lead&&c.lead.open).length!==3)out.push('open leads');
  if(new Set(CLIENTS.map(c=>c.id)).size!==CLIENTS.length||new Set(CLIENTS.map(c=>c.name)).size!==CLIENTS.length)out.push('client ids/names');
  CLIENTS.forEach(c=>{if(!/@[a-z0-9]+\.example$/.test(c.contact.email))out.push('client email '+c.name);if(typeof c.taxExempt!=='boolean'||!c.notes.en||!/[֐-׿]/.test(c.notes.he)||!c.city||!c.since)out.push('client fields '+c.name);});
  if(!CLIENTS.some(c=>c.taxExempt)||!CLIENTS.some(c=>!c.taxExempt))out.push('taxExempt variety');
  return out;}});
TESTS.push({name:'people persist',run:h=>{const out=[],P=PERSIST.filter(p=>/^pe-/.test(p.key));
  if(P.length!==2)out.push('persist entries');
  const c0=JSON.stringify(CLIENTS),s0=JSON.stringify(STAFF);
  cliUpdate(CLIENTS[0].id,{city:'Zzz'});staffUpdate('Tom',{active:false});cliAdd({name:'New Co',type:'Church'});
  const snap=P.map(p=>JSON.stringify(p.get()));
  P.forEach(p=>p.reset());if(JSON.stringify(CLIENTS)!==c0||JSON.stringify(STAFF)!==s0)out.push('reset does not restore');
  if(Object.keys(CLI_BY).length!==CLIENTS.length)out.push('CLI_BY after reset');
  P.forEach((p,i)=>p.set(JSON.parse(snap[i])));
  if(CLIENTS[0].city!=='Zzz'||STAFF_BY.Tom.active!==false||!cliByName('New Co')||!CLI_BY[cliByName('New Co').id])out.push('set does not restore edits');
  P.forEach(p=>p.reset());if(JSON.stringify(CLIENTS)!==c0||JSON.stringify(STAFF)!==s0)out.push('second reset');
  return out;}});
TESTS.push({name:'people travelers+blocks',run:h=>{const out=[];
  TRIPS.forEach(t=>{
    if(t.stage==='Quote'){if(t.trav.length)out.push('quote has travelers '+t.id);if(!blockOf(t))out.push('block null '+t.id);return;}
    const per=TRV_OCC[t.seg],occ={};t.trav.forEach(x=>{occ[x.room]=(occ[x.room]||0)+1;});
    t.trav.forEach(x=>{
      const miss=x.pass==='Missing';
      if(miss&&(x.passNo||x.passExp))out.push('passNo on Missing '+t.id);
      if(!miss&&(!/^•{4} \d{4}$/.test(x.passNo||'')||!/^\d{4}-\d\d-\d\d$/.test(x.passExp||'')))out.push('passport missing '+t.id);
      if(!/^\d{4}-\d\d-\d\d$/.test(x.dob||'')||!x.emerg||!x.emerg.name||!/^918-555-01\d\d$/.test(x.emerg.phone)||!x.form||!['reg','med','waiver'].every(f=>['done','sent','not sent'].includes(x.form[f])))out.push('traveler fields '+t.id);
      if(!['Twin','Double','Single','Triple','Quad'].includes(x.roomType)||x.roomType!==roomTypeOf(occ[x.room],per))out.push('roomType '+t.id);
      if(per===2&&occ[x.room]===2&&x.roomType!=='Twin')out.push('twin '+t.id);
    });
    const exp=t.trav.filter(x=>x.passExp&&D(x.passExp)<D(addDays(t.dep,t.nights+183))).length;
    if(!DESTS[t.dest].intl&&exp)out.push('domestic expiring '+t.id);
  });
  /* idempotent and deterministic */
  const a=JSON.stringify(TRIPS.map(t=>t.trav));TRIPS.forEach((t,i)=>TRIP_INIT.forEach(f=>f(t,i)));if(JSON.stringify(TRIPS.map(t=>t.trav))!==a)out.push('not idempotent');
  const rs=TRIPS.filter(t=>t.trav.length&&DESTS[t.dest].intl).reduce((n,t)=>n+t.trav.filter(x=>x.passExp&&D(x.passExp)<D(addDays(t.dep,t.nights+183))).length,0);
  if(!(rs>0))out.push('no expiring passport example');
  /* a fresh trip with no extras gets them without touching existing fields */
  const t0=JSON.parse(JSON.stringify(TRIPS.find(t=>t.id==='nas')));t0.trav.forEach(x=>{delete x.passNo;delete x.passExp;delete x.dob;delete x.emerg;delete x.roomType;delete x.form;});
  const keep=t0.trav.map(x=>x.n+'|'+x.room+'|'+x.diet+'|'+x.pass).join();tripExtras(t0);
  if(t0.trav.map(x=>x.n+'|'+x.room+'|'+x.diet+'|'+x.pass).join()!==keep)out.push('existing fields changed');
  if(JSON.stringify(t0.trav)!==JSON.stringify(TRIPS.find(t=>t.id==='nas').trav))out.push('not deterministic');
  /* blocks */
  TRIPS.forEach(t=>{const b=blockOf(t),rr=releaseRisk(t);
    if(!b){out.push('no block '+t.id);return;}
    if(b.hotel!==t.room.hotel||b.held!==t.room.held||b.picked!==t.room.used||b.cutoff!==addDays(t.dep,-30))out.push('block fields '+t.id);
    if(b.exposure!==(rr?rr.amt:0))out.push('exposure '+t.id);
    if(t.stage!=='Quote'&&Object.values(b.types).reduce((s,n)=>s+n,0)!==new Set(t.trav.map(x=>x.room)).size)out.push('block types '+t.id);
    if(!(b.attrition>=0&&b.attrition<=100))out.push('attrition '+t.id);});
  if(!TRIPS.some(t=>blockOf(t).exposure>0))out.push('no exposure example');
  return out;}});

/* ---------- v8.4: field staff for the tour director run sheet (fictional people) ---------- */
const GUIDES=[
  {id:'wade',en:'Wade Turner',he:'וייד טרנר',role:{en:'Tour director',he:'מנהל טיול'},phone:'918-555-0177',email:'wade.turner@redbudtours.example',trips:['nas','bra','nia','dc1']},
  {id:'cody',en:'Cody Harper',he:'קודי הארפר',role:{en:'Driver-guide',he:'נהג ומדריך'},phone:'918-555-0178',email:'cody.harper@redbudtours.example',trips:['gre','hl2']}];
const GUIDE_BY={};GUIDES.forEach(g=>{GUIDE_BY[g.id]=g;});
const guideOfTrip=id=>GUIDES.find(g=>g.trips.includes(id))||null;
