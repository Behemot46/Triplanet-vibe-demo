/* ---------- v8 form builder + traveler forms (module code fb) ----------
   VIEWS.forms (reached from Settings, not NAV). Reuses the engine in s10_forms.js: formRender() for previews,
   FM_TYPES for the palette, FM_CUSTOM[entity] for entity custom fields (written on Publish).
   State: PERSIST 'fb-forms' holds every definition {fields, pub, version}; S.fbSel/fbField/fbPrev/fbTab/fbTrip/fbRf are transient.
   Named mutations (tests call them): fbAddField fbMove fbDel fbDup fbSetProp fbPublish fbSend. */
Object.assign(S,{fbSel:'reg',fbField:-1,fbPrev:'',fbTab:'build',fbTrip:'',fbRf:'reg'});
const FB_ENTS=['supplier','client','activity','hotel'];
const FB_TRAV=['reg','med','waiver','room'];
const FB_KEY={reg:'reg',med:'med',waiver:'waiver',room:'room'};
const fbT=(en,he)=>({en,he});
const fbLb=o=>o?L(o.he,o.en):'';
const fbCan=()=>typeof can!=='function'||can('forms.build');
const fbCl=x=>JSON.parse(JSON.stringify(x));
const FB_TYPE_LB={text:['טקסט קצר','Short text'],email:['אימייל','Email'],tel:['טלפון','Phone'],number:['מספר','Number'],money:['סכום','Amount'],select:['רשימה נפתחת','Dropdown'],multi:['בחירה מרובה','Multi-select'],date:['תאריך','Date'],toggle:['מתג','Yes / no'],textarea:['טקסט ארוך','Long text'],file:['קובץ','File'],section:['כותרת פרק','Section heading'],repeater:['שורות חוזרות','Repeating rows']};
const fbTypeLb=t=>{const x=FB_TYPE_LB[t];return x?L(x[0],x[1]):t;};
const fbPalette=()=>Object.keys(FM_TYPES).filter(k=>FB_TYPE_LB[k]);
const fbO=(en,he,v)=>({v:v||fmSlug(en),en,he});
const fbF=(k,type,en,he,x)=>Object.assign({k,type,label:fbT(en,he)},x||{});

const FB_TERMS={
  en:['SAMPLE WORDING ONLY. Your counsel must review and replace this text before use.','1. Assumption of risk. I understand that group travel includes walking, coach travel, stairs, uneven surfaces and changes of weather, and I take part voluntarily.','2. Health. I confirm I am fit to travel, have disclosed any condition that may affect me or the group, and will carry my own medication.','3. Suppliers. I understand that hotels, coach companies and venues are independent businesses, and the agency acts as organizer and booking agent for them.','4. Changes. The itinerary may change for safety, weather or availability. The organizer will offer a comparable alternative where it can.','5. Photos. I allow the agency to use group photos from the trip in its own materials. I can withdraw this in writing at any time.','6. Insurance. I have been advised to buy travel insurance that covers medical costs, cancellation and baggage.','By typing my full name and the date below, I confirm that I have read and accept these terms.'],
  he:['נוסח לדוגמה בלבד. יש להעביר את הטקסט לבדיקת יועץ משפטי ולהחליפו לפני שימוש.','1. קבלת סיכון. אני מבין/ה שטיול קבוצתי כולל הליכה, נסיעה באוטובוס, מדרגות, משטחים לא ישרים ושינויי מזג אוויר, ואני משתתף/ת מרצוני.','2. בריאות. אני מצהיר/ה שאני כשיר/ה לנסוע, דיווחתי על כל מצב רפואי שעלול להשפיע עלי או על הקבוצה, ואקח איתי את התרופות שלי.','3. ספקים. אני מבין/ה שמלונות, חברות הסעות ואתרים הם עסקים עצמאיים, והסוכנות פועלת כמארגנת וכסוכנת הזמנות מטעמם.','4. שינויים. מסלול הטיול עשוי להשתנות מטעמי בטיחות, מזג אוויר או זמינות. המארגנת תציע חלופה דומה ככל האפשר.','5. צילומים. אני מאשר/ת לסוכנות להשתמש בתמונות קבוצתיות מהטיול בחומרים שלה. אפשר לבטל זאת בכתב בכל עת.','6. ביטוח. הומלץ לי לרכוש ביטוח נסיעות שמכסה הוצאות רפואיות, ביטול ומטען.','בהקלדת שמי המלא והתאריך להלן אני מאשר/ת שקראתי את התנאים ומסכים/ה להם.']};
const fbTermsHtml=()=>`<div class="fb-terms" tabindex="0" role="region" aria-label="${L('תנאי כתב הוויתור','Waiver terms')}">${(L(FB_TERMS.he,FB_TERMS.en)).map((p,i)=>`<p${i===0?' class="fb-sample"':''}>${esc(p)}</p>`).join('')}</div>`;

function fbDefaults(){
  const F={};
  F.reg={id:'reg',kind:'trav',title:fbT('Registration','רישום'),desc:fbT('Name, date of birth, passport and emergency contact.','שם, תאריך לידה, דרכון ואיש קשר לשעת חירום.'),fields:[
    fbF('sec1','section','Traveler','נוסע'),fbF('fullName','text','Full name (as on passport)','שם מלא (כבדרכון)',{req:true}),fbF('dob','date','Date of birth','תאריך לידה',{req:true}),
    fbF('sec2','section','Passport','דרכון'),fbF('passNo','text','Passport number','מספר דרכון'),fbF('passExp','date','Passport expiry','תוקף דרכון'),
    fbF('sec3','section','Emergency contact','איש קשר לשעת חירום'),fbF('emName','text','Contact name','שם איש הקשר',{req:true}),fbF('emPhone','tel','Contact phone','טלפון איש הקשר',{req:true}),
    fbF('roomShare','text','Room-share request (traveler name)','בקשת שיתוף חדר (שם הנוסע)',{help:fbT('Leave empty to be paired by the organizer.','אפשר להשאיר ריק והמארגנת תשבץ.')})]};
  F.med={id:'med',kind:'trav',title:fbT('Medical & dietary','רפואי ותזונה'),desc:fbT('Diet, allergies and mobility needs.','תזונה, אלרגיות וצרכי ניידות.'),fields:[
    fbF('diet','select','Dietary need','צורך תזונתי',{req:true,options:[fbO('None','אין'),fbO('Vegetarian','צמחוני'),fbO('Gluten-free','ללא גלוטן'),fbO('Diabetic','סוכרתי'),fbO('Nut allergy','אלרגיה לאגוזים')]}),
    fbF('mobility','select','Mobility','ניידות',{options:[fbO('No limits','ללא מגבלה'),fbO('Walking aid','הליכון או מקל'),fbO('Wheelchair','כסא גלגלים')]}),
    fbF('meds','toggle','I take regular medication','אני נוטל/ת תרופות באופן קבוע'),
    fbF('medNote','textarea','Medication or allergy notes','הערות על תרופות או אלרגיות',{showIf:{k:'meds',eq:true},help:fbT('Only the organizer and the guide see this.','רק המארגנת והמדריך רואים את זה.')})]};
  F.waiver={id:'waiver',kind:'trav',title:fbT('Liability waiver','כתב ויתור אחריות'),desc:fbT('Scrollable terms, typed signature and date.','תנאים לגלילה, חתימה מוקלדת ותאריך.'),terms:true,fields:[
    fbF('agree','toggle','I have read and accept the terms','קראתי ואני מסכים/ה לתנאים',{req:true}),fbF('sig','text','Type your full name to sign','הקלידו שם מלא לחתימה',{req:true}),fbF('signDate','date','Date','תאריך',{req:true})]};
  F.room={id:'room',kind:'trav',title:fbT('Rooming preference','העדפות חדר'),desc:fbT('Bed type, roommate and quiet-room requests.','סוג מיטה, שותף לחדר ובקשות לחדר שקט.'),fields:[
    fbF('roomType','select','Preferred room','חדר מועדף',{req:true,options:[fbO('Twin beds','שתי מיטות','Twin'),fbO('Double bed','מיטה זוגית','Double'),fbO('Single room','חדר יחיד','Single')]}),
    fbF('shareWith','text','Share with','לחלוק חדר עם'),fbF('quiet','toggle','Quiet room away from the lift','חדר שקט הרחק מהמעלית'),fbF('ground','toggle','Ground floor or lift access needed','נדרשת קומת קרקע או מעלית'),
    fbF('roomNote','textarea','Anything else','משהו נוסף')]};
  const ET={supplier:['Supplier custom fields','שדות מותאמים לספק','Supplier','ספק'],client:['Client custom fields','שדות מותאמים ללקוח','Client','לקוח'],activity:['Activity custom fields','שדות מותאמים לפעילות','Activity','פעילות'],hotel:['Hotel custom fields','שדות מותאמים למלון','Hotel','מלון']};
  FB_ENTS.forEach(e=>{F[e]={id:e,kind:'ent',entity:e,title:fbT(ET[e][0],ET[e][1]),ent:fbT(ET[e][2],ET[e][3]),desc:fbT('Extra fields that show under "Custom fields" on the '+ET[e][2].toLowerCase()+' form.','שדות נוספים שמופיעים תחת "שדות מותאמים" בטופס ה'+ET[e][3]+'.'),fields:[]};});
  Object.keys(F).forEach(k=>{F[k].version=1;F[k].pub=fbCl(F[k].fields);});
  return F;
}
const FB={forms:fbDefaults()};
const fbForm=id=>FB.forms[id];
const fbDirty=f=>JSON.stringify(f.fields)!==JSON.stringify(f.pub);
function fbSyncCustom(){FB_ENTS.forEach(e=>{const f=FB.forms[e];if(f&&f.pub.length)FM_CUSTOM[e]=fbCl(f.pub);else delete FM_CUSTOM[e];});}
PERSIST.push({key:'fb-forms',get:()=>{const o={};Object.keys(FB.forms).forEach(k=>{const f=FB.forms[k];o[k]={fields:f.fields,pub:f.pub,version:f.version};});return o;},
  set:v=>{const d=fbDefaults();if(v&&typeof v==='object')Object.keys(d).forEach(k=>{const x=v[k];if(x&&Array.isArray(x.fields)&&Array.isArray(x.pub)){d[k].fields=x.fields;d[k].pub=x.pub;d[k].version=+x.version||1;}});FB.forms=d;fbSyncCustom();},
  reset:()=>{FB.forms=fbDefaults();FB_ENTS.forEach(e=>{delete FM_CUSTOM[e];});Object.assign(S,{fbSel:'reg',fbField:-1,fbPrev:'',fbTab:'build',fbTrip:'',fbRf:'reg'});}});

/* ---------- named mutations ---------- */
function fbNewKey(f,pre){let n=1;f.fields.forEach(x=>{const m=/(\d+)$/.exec(String(x.k));if(m)n=Math.max(n,+m[1]+1);});return pre+'f'+n;}
const fbPre=f=>f.kind==='ent'?'custom.':'';
function fbAddField(formId,type){
  const f=fbForm(formId);if(!f||!fbCan()||!FB_TYPE_LB[type])return -1;
  const fld={k:fbNewKey(f,fbPre(f)),type,label:type==='section'?fbT('New section','פרק חדש'):fbT('New field','שדה חדש')};
  if(type==='select'||type==='multi')fld.options=[fbO('Option 1','אפשרות 1'),fbO('Option 2','אפשרות 2')];
  if(type==='repeater'){fld.label=fbT('New list','רשימה חדשה');fld.fields=[{k:'item',type:'text',label:fbT('Item','פריט')}];}
  f.fields.push(fld);S.fbField=f.fields.length-1;return S.fbField;
}
function fbMove(formId,idx,dir){
  const f=fbForm(formId);if(!f||!fbCan())return -1;const j=idx+(dir<0?-1:1);if(idx<0||idx>=f.fields.length||j<0||j>=f.fields.length)return -1;
  const a=f.fields;[a[idx],a[j]]=[a[j],a[idx]];if(S.fbField===idx)S.fbField=j;else if(S.fbField===j)S.fbField=idx;return j;
}
function fbDel(formId,idx){
  const f=fbForm(formId);if(!f||!fbCan()||idx<0||idx>=f.fields.length)return false;
  const k=f.fields[idx].k;f.fields.splice(idx,1);
  f.fields.forEach(x=>{if(x.showIf&&x.showIf.k===k)delete x.showIf;});
  S.fbField=f.fields.length?Math.min(idx,f.fields.length-1):-1;return true;
}
function fbDup(formId,idx){
  const f=fbForm(formId);if(!f||!fbCan()||idx<0||idx>=f.fields.length)return -1;
  const c=fbCl(f.fields[idx]);c.k=fbNewKey(f,fbPre(f));c.label={en:c.label.en+' (copy)',he:c.label.he+' (עותק)'};
  f.fields.splice(idx+1,0,c);S.fbField=idx+1;return idx+1;
}
const fbLines=s=>String(s==null?'':s).split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
function fbSetProp(formId,idx,k,v){
  const f=fbForm(formId);if(!f||!fbCan()||idx<0||idx>=f.fields.length)return false;const x=f.fields[idx];
  if(k==='label.en'||k==='label.he'){x.label=x.label||{en:'',he:''};x.label[k.slice(6)]=String(v);return true;}
  if(k==='help.en'||k==='help.he'){x.help=x.help||{en:'',he:''};x.help[k.slice(5)]=String(v);if(!x.help.en&&!x.help.he)delete x.help;return true;}
  if(k==='req'){if(v)x.req=true;else delete x.req;return true;}
  if(k==='optsEn'||k==='optsHe'){
    if(!x.options)return false;const old=x.options,ls=fbLines(v),en=k==='optsEn';
    const used={};x.options=ls.map((s,i)=>{const o=old[i];let val=o?o.v:fmSlug(s);while(used[val])val+='-'+i;used[val]=1;
      return en?{v:val,en:s,he:o?o.he:s}:{v:val,en:o?o.en:s,he:s};});
    return true;}
  if(/^opt\.(en|he)\.\d+$/.test(k)){const p=k.split('.'),o=x.options&&x.options[+p[2]];if(!o)return false;o[p[1]]=String(v);return true;}
  if(k==='optAdd'){if(!x.options)return false;const n=x.options.length+1;x.options.push(fbO('Option '+n,'אפשרות '+n,'option-'+n+'-'+x.options.length));return true;}
  if(k==='optDel'){if(!x.options||x.options.length<2||v<0||v>=x.options.length)return false;x.options.splice(v,1);return true;}
  if(k==='showK'){if(!v)delete x.showIf;else{const src=f.fields.find(y=>y.k===v);x.showIf={k:v,eq:src&&src.type==='toggle'?true:''};}return true;}
  if(k==='showV'){if(!x.showIf)return false;const src=f.fields.find(y=>y.k===x.showIf.k);x.showIf.eq=src&&src.type==='toggle'?(v===true||v==='true'):String(v);return true;}
  return false;
}
function fbPublish(formId){
  const f=fbForm(formId);if(!f||!fbCan())return 0;
  f.version++;f.pub=fbCl(f.fields);
  if(f.kind==='ent')fbSyncCustom();
  try{save();}catch(e){}
  try{toast(L('הטופס פורסם, גרסה '+f.version,'Form published, version '+f.version));}catch(e){}
  return f.version;
}
const fbLink=(t,fid)=>'https://forms.redbudtours.example/'+t.no+'/'+fid;
function fbSt(x,fid){
  const k=FB_KEY[fid],v=x.form&&x.form[k];if(v)return v;
  return fid==='room'?((x.form&&x.form.reg)==='done'?'done':'not sent'):'not sent';
}
function fbCounts(t,fid){const c={done:0,sent:0,'not sent':0};(t.trav||[]).forEach(x=>{c[fbSt(x,fid)]++;});return c;}
/* only 'not sent' travelers change, to 'sent'; returns how many */
function fbSend(t,formId){
  if(!t||!FB_KEY[formId]||!fbCan())return 0;let n=0;
  (t.trav||[]).forEach(x=>{if(fbSt(x,formId)==='not sent'){x.form=x.form||{};x.form[FB_KEY[formId]]='sent';n++;}});
  try{save();}catch(e){}
  try{copy(fbLink(t,formId));}catch(e){}
  return n;
}

/* ---------- sample answers for travelers who completed a form (deterministic, from trav data) ---------- */
const FB_DIET={None:['אין','None'],Vegetarian:['צמחוני','Vegetarian'],'Gluten-free':['ללא גלוטן','Gluten-free'],Diabetic:['סוכרתי','Diabetic'],'Nut allergy':['אלרגיה לאגוזים','Nut allergy']};
const FB_RT={Twin:['שתי מיטות','Twin beds'],Double:['מיטה זוגית','Double bed'],Single:['חדר יחיד','Single room'],Triple:['משולש','Triple'],Quad:['ארבעה','Quad']};
const fbPick=(m,k)=>m[k]?L(m[k][0],m[k][1]):(k||'');
function fbCols(fid){
  return {reg:[L('תאריך לידה','Date of birth'),L('דרכון','Passport'),L('איש קשר לשעת חירום','Emergency contact')],
    med:[L('תזונה','Diet'),L('ניידות','Mobility'),L('הערות','Notes')],waiver:[L('חתימה','Signed as'),L('תאריך','Date'),L('תנאים','Terms')],
    room:[L('חדר','Room'),L('חדר מועדף','Preferred room'),L('שיתוף עם','Share with')]}[fid];
}
function fbAnswers(t,x,i,fid){
  const dash='-';
  if(fid==='reg')return [x.dob?fmtDate(x.dob):dash,x.passNo?'<bdi dir="ltr">'+esc(x.passNo)+'</bdi> · '+fmtDate(x.passExp):L('חסר','Not provided'),x.emerg?x.emerg.name+' · '+x.emerg.phone:dash];
  if(fid==='med')return [fbPick(FB_DIET,x.diet),i%11===0?L('הליכון או מקל','Walking aid'):L('ללא מגבלה','No limits'),x.diet==='Nut allergy'?L('נושא/ת מזרק אפינפרין','Carries an epinephrine pen'):x.diet==='Diabetic'?L('נוטל/ת אינסולין','Takes insulin'):dash];
  if(fid==='waiver')return [x.n,fmtDate(addDays(iso(TODAY),-(2+i%20))),L('אושרו','Accepted')];
  const mate=(t.trav||[]).find(y=>y!==x&&y.room===x.room);
  return [String(x.room),fbPick(FB_RT,x.roomType),mate?mate.n:L('חדר יחיד','Single room')];
}

/* ---------- builder view ---------- */
const fbStPill=s=>pillF(s==='done'?L('הושלם','Done'):s==='sent'?L('נשלח','Sent'):L('לא נשלח','Not sent'),s==='done'?'green':s==='sent'?'amber':'');
function fbList(){
  const grp=(kind,title)=>`<div class="fb-gt">${title}</div>`+FB_TRAV.concat(FB_ENTS).filter(id=>fbForm(id).kind===kind).map(id=>{const f=fbForm(id);
    return `<button class="fb-li${S.fbSel===id?' on':''}" data-act="fb-sel" data-v="${id}"><span class="fb-lt"><b>${esc(fbLb(f.title))}</b><span class="small muted">${f.fields.length} ${L('שדות','fields')} · v${f.version}</span></span>${fbDirty(f)?`<span class="fb-dot" title="${L('שינויים שלא פורסמו','Unpublished changes')}"></span>`:''}</button>`;}).join('');
  return `<nav class="fb-list card hc-card" aria-label="${L('רשימת טפסים','Forms')}">${grp('trav',L('טפסי נוסעים','Traveler forms'))}${grp('ent',L('שדות מותאמים לפי ישות','Custom fields by record'))}</nav>`;
}
function fbCanvas(f,can_){
  if(!f.fields.length)return `<div class="fb-empty"><b>${L('אין שדות עדיין','No fields yet')}</b><div class="small muted">${L('הוסיפו שדה מהרשימה למטה.','Add a field from the palette below.')}</div></div>`;
  return f.fields.map((x,i)=>{
    const on=S.fbField===i,sec=x.type==='section';
    return `<div class="fb-fl${on?' on':''}${sec?' sec':''}" data-act="fb-pick" data-v="${i}" role="button" tabindex="0" aria-label="${esc(fbLb(x.label))}" aria-pressed="${on}">
      <span class="fb-ft">${esc(fbTypeLb(x.type))}</span><span class="fb-fn"><span data-fb-lbl="${i}">${esc(fbLb(x.label))}</span>${x.req?'<i class="fm-req">*</i>':''}</span>
      ${x.showIf?`<span class="small muted fb-cond">${L('מותנה','conditional')}</span>`:''}
      ${can_?`<span class="fb-acts"><button class="fb-ib" data-act="fb-up" data-v="${i}" aria-label="${L('הזזה למעלה','Move up')}"${i?'':' disabled'}>${ic('arrup')}</button><button class="fb-ib" data-act="fb-dn" data-v="${i}" aria-label="${L('הזזה למטה','Move down')}"${i<f.fields.length-1?'':' disabled'}>${ic('arrdown')}</button><button class="fb-ib" data-act="fb-dup" data-v="${i}" aria-label="${L('שכפול','Duplicate')}">${ic('copy')}</button><button class="fb-ib" data-act="fb-del" data-v="${i}" aria-label="${L('מחיקה','Delete')}">${ic('x')}</button></span>`:''}</div>`;}).join('');
}
function fbProps(f,can_){
  const x=f.fields[S.fbField];
  if(!x)return `<aside class="fb-props card hc-card"><h3>${L('מאפייני שדה','Field properties')}</h3><p class="muted small">${L('בחרו שדה בקנבס כדי לערוך את התוויות, החובה והתנאים שלו.','Select a field on the canvas to edit its labels, required state and conditions.')}</p></aside>`;
  const d=can_?'':' disabled',i=S.fbField,inp=(k,lab,val,ta)=>`<label class="fb-pl"><span>${lab}</span>${ta?`<textarea class="fm-in fb-pi" rows="3" data-fbi="${k}"${d}>${esc(val)}</textarea>`:`<input class="fm-in fb-pi" type="text" data-fbi="${k}" value="${esc(val)}"${d}>`}</label>`;
  const others=f.fields.filter((y,j)=>j!==i&&y.type!=='section'&&y.type!=='repeater'),sk=x.showIf&&x.showIf.k,src=others.find(y=>y.k===sk);
  let val='';
  if(x.showIf){const eq=x.showIf.eq;
    if(src&&src.type==='toggle')val=`<select class="fm-in fb-pi" data-fbc="showV"${d}><option value="true"${eq===true?' selected':''}>${L('כן','Yes')}</option><option value="false"${eq===true?'':' selected'}>${L('לא','No')}</option></select>`;
    else if(src&&(src.type==='select'||src.type==='multi')&&src.options)val=`<select class="fm-in fb-pi" data-fbc="showV"${d}>${src.options.map(o=>`<option value="${esc(o.v)}"${String(eq)===String(o.v)?' selected':''}>${esc(fbLb(o))}</option>`).join('')}</select>`;
    else val=`<input class="fm-in fb-pi" type="text" data-fbi="showV" value="${esc(eq==null?'':eq)}"${d}>`;}
  return `<aside class="fb-props card hc-card"><h3>${L('מאפייני שדה','Field properties')}</h3><div class="small muted fb-pt">${esc(fbTypeLb(x.type))}</div>
    ${inp('label.en',L('תווית (אנגלית)','Label (English)'),x.label.en)}${inp('label.he',L('תווית (עברית)','Label (Hebrew)'),x.label.he)}
    ${x.type==='section'?'':`<label class="fb-pc"><input type="checkbox" data-fbc="req"${x.req?' checked':''}${d}><span>${x.type==='toggle'?L('חובה לאשר','Must be ticked'):L('שדה חובה','Required')}</span></label>
    ${inp('help.en',L('טקסט עזרה (אנגלית)','Help text (English)'),x.help?x.help.en:'')}${inp('help.he',L('טקסט עזרה (עברית)','Help text (Hebrew)'),x.help?x.help.he:'')}`}
    ${x.options?`<div class="fb-pl"><span>${L('אפשרויות (אנגלית / עברית)','Options (English / Hebrew)')}</span>${x.options.map((o,j)=>`<div class="fb-op"><input class="fm-in fb-pi" type="text" data-fbi="opt.en.${j}" value="${esc(o.en)}" aria-label="${L('אפשרות באנגלית','Option in English')} ${j+1}"${d}><input class="fm-in fb-pi" type="text" data-fbi="opt.he.${j}" value="${esc(o.he)}" aria-label="${L('אפשרות בעברית','Option in Hebrew')} ${j+1}"${d}>${can_?`<button class="fb-ib" data-act="fb-optdel" data-v="${j}" aria-label="${L('הסרת אפשרות','Remove option')}"${x.options.length>1?'':' disabled'}>${ic('x')}</button>`:''}</div>`).join('')}${can_?`<button class="btn sm" data-act="fb-optadd">${L('הוספת אפשרות','Add option')}</button>`:''}</div>`:''}
    ${x.type==='section'?'':`<div class="fb-pl"><span>${L('הצגה מותנית','Show only if')}</span><select class="fm-in fb-pi" data-fbc="showK"${d}><option value="">${L('תמיד מוצג','Always shown')}</option>${others.map(y=>`<option value="${esc(y.k)}"${sk===y.k?' selected':''}>${esc(fbLb(y.label))}</option>`).join('')}</select>${val}</div>`}
  </aside>`;
}
function fbPreview(f,phone){
  const sc={id:'fb-'+f.id,entity:'fb-'+f.id,title:f.title,fields:f.fields};
  const terms=f.terms?fbTermsHtml():'';
  const body=f.fields.length?formRender(sc,{},{ns:'fbp',ro:true,phone}):`<div class="fb-empty small muted">${L('אין שדות להצגה.','No fields to show.')}</div>`;
  const hd=f.kind==='ent'?`${esc(fbLb(f.ent))} - ${L('שדות מותאמים','Custom fields')}`:esc(fbLb(f.title));
  const inner=`<div class="fb-pvh"><b>Redbud Group Tours</b><span class="small muted">${hd}</span></div>${f.kind==='trav'?`<p class="small muted fb-pvd">${esc(fbLb(f.desc))}</p>`:''}${f.fields.length&&f.terms?`${terms}`:''}${body}${f.kind==='trav'?`<button class="btn pri fb-pvs" disabled>${L('שליחה','Submit')}</button>`:''}`;
  return phone?`<div class="fb-pwrap"><div class="fb-phone" aria-label="${L('תצוגת טלפון','Phone preview')}"><div class="fb-notch"><span></span></div><div class="fb-screen">${inner}</div></div><p class="small muted fb-pcap">${L('כך הנוסע רואה את הטופס בטלפון.','This is how a traveler sees the form on a phone.')}</p></div>`:`<div class="fb-desk">${inner}</div>`;
}
function fbBuild(){
  const f=fbForm(S.fbSel)||fbForm('reg'),can_=fbCan(),pv=S.fbPrev;
  const modes=[['',L('עריכה','Edit'),'pen'],['desk',L('מחשב','Desktop'),'widget'],['phone',L('טלפון','Phone'),'show']];
  const pal=can_?`<div class="fb-pal"><span class="small muted">${L('הוספת שדה','Add field')}</span>${fbPalette().map(k=>`<button class="chip" data-act="fb-add" data-v="${k}">${esc(fbTypeLb(k))}</button>`).join('')}</div>`:'';
  const mid=pv?`<div class="fb-mid card hc-card fb-pvwrap">${fbPreview(f,pv==='phone')}</div>`
    :`<div class="fb-mid card hc-card"><div class="fb-mh"><div><h3>${esc(fbLb(f.title))}</h3><div class="small muted">${esc(fbLb(f.desc))}</div></div>${f.kind==='ent'?`<span class="small muted">${L('מופיע בטופס ה','Shown on the ')}${esc(fbLb(f.ent))}${L(' תחת "שדות מותאמים"',' form under "Custom fields"')}</span>`:''}</div>
      ${f.terms?`<div class="fb-fixed"><span class="small muted">${L('נוסח התנאים קבוע בהדגמה','Terms text is fixed in this demo')}</span>${fbTermsHtml()}</div>`:''}
      <div class="fb-cv">${fbCanvas(f,can_)}</div>${pal}</div>`;
  return `<div class="fb-top"><div class="seg fb-modes" role="group" aria-label="${L('מצב תצוגה','View mode')}">${modes.map(m=>`<button class="chip${pv===m[0]?' on':''}" data-act="fb-prev" data-v="${m[0]}">${ic(m[2])} ${m[1]}</button>`).join('')}</div>
    <div class="fb-pub"><span class="pill ${fbDirty(f)?'amber':'green'}">v${f.version} · ${fbDirty(f)?L('שינויים שלא פורסמו','Unpublished changes'):L('פורסם','Published')}</span>${can_?`<button class="btn pri" data-act="fb-pub"${fbDirty(f)?'':' disabled'}>${ic('check')} ${L('פרסום','Publish')}</button>`:''}</div></div>
   <div class="fb-grid">${fbList()}${mid}${pv?'':fbProps(f,can_)}</div>`;
}
/* travelers across the Operation-stage trips: finished every form / not yet sent any form */
function fbSummary(){
  const ts=visibleTrips().filter(t=>t.stage==='Operations');let n=0,all=0,none=0;
  ts.forEach(t=>(t.trav||[]).forEach(x=>{n++;const st=FB_TRAV.map(id=>fbSt(x,id));if(st.every(v=>v==='done'))all++;if(st.every(v=>v==='not sent'))none++;}));
  return {n,all,none,trips:ts.length};
}
function fbResp(){
  const ts=visibleTrips().filter(t=>t.stage==='Operations');
  if(!ts.length)return `<div class="card hc-card"><p class="muted">${L('אין טיולים בשלב התפעול. כשהצעה מאושרת והופכת לתפעול, כאן אפשר לשלוח לנוסעים טפסים ולעקוב אחרי התשובות.','No trips in the Operation stage. Once a quote is accepted and moves to Operation, you can send forms to its travelers and follow the answers here.')}</p></div>`;
  const t=ts.find(x=>x.id===S.fbTrip)||ts[0],fid=FB_TRAV.includes(S.fbRf)?S.fbRf:'reg',can_=fbCan();
  const cols=fbCols(fid),tr=t.trav||[],lim=tr.slice(0,40);
  return `<div class="card hc-card fb-rh"><label class="fb-pl"><span>${L('טיול','Trip')}</span><select class="fm-in fb-pi" data-fbc="trip" aria-label="${L('בחירת טיול','Choose trip')}">${ts.map(x=>`<option value="${x.id}"${x.id===t.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
    <span class="small muted">${tr.length} ${L('נוסעים','travelers')} · ${fmtDate(t.dep)}</span></div>
   <div class="fb-cards">${FB_TRAV.map(id=>{const c=fbCounts(t,id),f=fbForm(id),p=tr.length?Math.round(c.done/tr.length*100):0;
     return `<button class="fb-sc card hc-card${fid===id?' on':''}" data-act="fb-rf" data-v="${id}" aria-pressed="${fid===id}"><span class="fb-ring"><span class="fb-rg">${hcRing(p,64,p>=100?'ok':'')}<b>${p}%</b></span><span class="fb-st"><b>${esc(fbLb(f.title))}</b><span class="small muted">${c.done}/${tr.length} ${L('הושלמו','done')}</span></span></span><span class="fb-n"><span><em>${c.done}</em> ${L('הושלמו','done')}</span><span><em>${c.sent}</em> ${L('נשלחו','sent')}</span><span><em>${c['not sent']}</em> ${L('לא נשלחו','not sent')}</span></span><span class="fb-bar"><i style="width:${p}%"></i></span></button>`;}).join('')}</div>
   <div class="card hc-card"><div class="fb-sh hc-h"><h3>${esc(fbLb(fbForm(fid).title))}</h3>${can_?`<button class="btn pri" data-act="fb-send" data-v="${fid}"${fbCounts(t,fid)['not sent']?'':' disabled'}>${ic('mail')} ${L('שליחה לנוסעים ('+fbCounts(t,fid)['not sent']+')','Send to travelers ('+fbCounts(t,fid)['not sent']+')')}</button>`:''}</div>
    <div class="small muted fb-lk">${ic('link')} <bdi>${esc(fbLink(t,fid))}</bdi></div>
    <div class="scroll"><table class="fb-tb"><thead><tr><th>${L('נוסע','Traveler')}</th><th>${L('סטטוס','Status')}</th>${cols.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${lim.map((x,i)=>{const s=fbSt(x,fid),a=s==='done'?fbAnswers(t,x,i,fid):null;
      return `<tr><td><b>${esc(x.n)}</b></td><td>${fbStPill(s)}</td>${cols.map((c,j)=>`<td>${a?`<bdi>${/^<bdi dir="ltr">/.test(a[j])?a[j]:esc(a[j])}</bdi>`:'<span class="muted">-</span>'}</td>`).join('')}</tr>`;}).join('')}</tbody></table></div>
    ${tr.length>lim.length?`<p class="small muted">${L(`מוצגים ${lim.length} מתוך ${tr.length}`,`Showing the first ${lim.length} of ${tr.length}`)}</p>`:''}</div>`;
}
VIEWS.forms=function(){
  const can_=fbCan(),tab=S.fbTab==='resp'?'resp':'build',sm=fbSummary();
  const nf=FB_TRAV.length+FB_ENTS.length,dirty=Object.keys(FB.forms).filter(k=>fbDirty(FB.forms[k])).length;
  const brief=sm.n?L(`${hlPos(sm.all+' מתוך '+sm.n)} נוסעים סיימו את כל הטפסים, ל-${hlNeg(sm.none)} עוד לא נשלח אף טופס.`,
      `${hlPos(sm.all+' of '+sm.n)} travelers finished every form; ${hlNeg(sm.none)} ${sm.none===1?'has':'have'} not been sent a form.`)
    :L(`${hlKey(nf+' טפסים')} מוכנים לעריכה${dirty?`, ${hlWarn(dirty+' עם שינויים שלא פורסמו')}`:''}.`,`${hlKey(nf+' forms')} ready to edit${dirty?`, ${hlWarn(dirty+' with unpublished changes')}`:''}.`);
  const ctas=[tab==='build'?hcCta('mint','play',L('תצוגת טלפון','Phone preview'),'data-act="fb-prev" data-v="phone"'):hcCta('mint','pen',L('לבונה','Open the builder'),'data-act="fb-tab" data-v="build"'),
    typeof VIEWS.settings==='function'?hcCta('ghost','left',L('חזרה להגדרות','Back to settings'),'data-act="go" data-v="settings"'):''].filter(Boolean);
  return `<div class="hc fb-page">`+hcPage({eyebrow:L('ניהול','Admin'),title:L('בונה הטפסים','Form builder'),brief,ctas,aria:L('בונה הטפסים','Form builder'),
     kpis:[{lab:L('טפסי נוסעים','Traveler forms'),val:FB_TRAV.length,sub:L('רישום, רפואי, ויתור, חדרים','Registration, medical, waiver, rooms')},
       {lab:L('סיימו הכל','Finished all'),val:sm.all,cls:'pf',sub:L(`מתוך ${sm.n} נוסעים`,`of ${sm.n} travelers`)},
       {lab:L('טרם נשלח להם','Not yet sent'),val:sm.none,cls:sm.none?'warn':'',sub:L(`ב-${sm.trips} טיולים בתפעול`,`across ${sm.trips} trips in Operation`)}]})
   +(can_?'':`<div class="card hc-card fb-note">${ic('lock')} <span>${L('התפקיד שלך יכול לצפות בטפסים אך לא לערוך אותם. מנהלת הסוכנות יכולה להפעיל את ההרשאה "בניית טפסים" בהגדרות.','Your role can view forms but not edit them. The agency owner can turn on the "Build traveler forms" permission in Settings.')}</span></div>`)
   +`<div class="st-seg fb-tabs" role="tablist"><button class="${tab==='build'?'on':''}" role="tab" aria-selected="${tab==='build'}" data-act="fb-tab" data-v="build">${ic('pen')} ${L('בונה','Builder')}</button><button class="${tab==='resp'?'on':''}" role="tab" aria-selected="${tab==='resp'}" data-act="fb-tab" data-v="resp">${ic('checklist')} ${L('תשובות נוסעים','Traveler responses')}</button></div>`
   +(tab==='build'?fbBuild():fbResp())+`</div>`;
};

/* ---------- events ---------- */
function fbRerender(focus){
  render();try{if(focus){const e=document.getElementById(focus);if(e&&e.focus)e.focus();}}catch(e){}
}
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act^="fb-"]');if(!b||S.tab!=='forms')return;
  if(b.closest&&b.closest('.fb-acts')&&b.dataset.act==='fb-pick')return;
  const a=b.dataset.act,v=b.dataset.v,id=S.fbSel;
  if(a==='fb-sel'){S.fbSel=v;S.fbField=-1;}
  else if(a==='fb-pick')S.fbField=+v;
  else if(a==='fb-add')fbAddField(id,v);
  else if(a==='fb-up')fbMove(id,+v,-1);
  else if(a==='fb-dn')fbMove(id,+v,1);
  else if(a==='fb-dup')fbDup(id,+v);
  else if(a==='fb-del')fbDel(id,+v);
  else if(a==='fb-optadd')fbSetProp(id,S.fbField,'optAdd',1);
  else if(a==='fb-optdel')fbSetProp(id,S.fbField,'optDel',+v);
  else if(a==='fb-prev')S.fbPrev=v;
  else if(a==='fb-pub')fbPublish(id);
  else if(a==='fb-tab')S.fbTab=v;
  else if(a==='fb-rf')S.fbRf=v;
  else if(a==='fb-send'){const t=byId((visibleTrips().filter(x=>x.stage==='Operations').find(x=>x.id===S.fbTrip)||visibleTrips().find(x=>x.stage==='Operations')||{}).id);
    if(t){const n=fbSend(t,v);try{toast(L(n+' טפסים נשלחו, הקישור הועתק',n+' sent, link copied'));}catch(er){}}}
  else return;
  try{save();}catch(er){}
  render();
});
document.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset||el.dataset.fbi==null||S.tab!=='forms')return;
  const k=el.dataset.fbi;if(!fbSetProp(S.fbSel,S.fbField,k,el.value))return;
  try{if(k==='label.en'||k==='label.he'){if((k==='label.he')===(S.lang==='he')){const n=document.querySelector(`[data-fb-lbl="${S.fbField}"]`);if(n)n.textContent=el.value;}}}catch(er){}
});
document.addEventListener('change',e=>{
  const el=e.target;if(!el.dataset||S.tab!=='forms')return;
  if(el.dataset.fbi!=null){try{save();}catch(er){}return;}
  const k=el.dataset.fbc;if(!k)return;
  if(k==='trip'){S.fbTrip=el.value;render();return;}
  if(k==='req')fbSetProp(S.fbSel,S.fbField,'req',el.checked);else fbSetProp(S.fbSel,S.fbField,k,el.value);
  try{save();}catch(er){}render();
});

/* ---------- tests (A8) ---------- */
TESTS.push({name:'form builder',run:h=>{
  const out=[],add=m=>out.push(m),S0=S.role,tid=TRIPS.find(t=>t.stage==='Operations').id;
  S.role='manager';
  const n0=fbForm('reg').fields.length,v0=fbForm('reg').version;
  /* add / move / dup / delete / publish */
  const i=fbAddField('reg','text');if(i!==n0||fbForm('reg').fields.length!==n0+1)add('add failed');
  if(!FB_TRAV.concat(FB_ENTS).every(k=>fbForm(k)))add('forms missing');
  fbSetProp('reg',i,'label.en','Hobby');fbSetProp('reg',i,'req',true);
  if(fbMove('reg',i,-1)!==i-1||fbForm('reg').fields[i-1].label.en!=='Hobby')add('move up failed');
  if(fbMove('reg',0,-1)!==-1)add('move above first allowed');
  const d=fbDup('reg',i-1);if(d!==i||fbForm('reg').fields[d].k===fbForm('reg').fields[i-1].k||fbForm('reg').fields.length!==n0+2)add('dup failed');
  if(!fbDel('reg',d)||fbForm('reg').fields.length!==n0+1)add('delete failed');
  fbSetProp('reg',0,'showK','');
  if(fbPublish('reg')!==v0+1||fbForm('reg').version!==v0+1||fbDirty(fbForm('reg')))add('publish did not bump version');
  /* select options and showIf */
  const si=fbAddField('med','select');fbSetProp('med',si,'optsEn','A\nB\nC');if(fbForm('med').fields[si].options.length!==3||fbForm('med').fields[si].options[1].v!=='option-2'&&!fbForm('med').fields[si].options[1].v)add('options not parsed');
  fbSetProp('med',si,'showK','meds');fbSetProp('med',si,'showV','true');
  if(!fbForm('med').fields[si].showIf||fbForm('med').fields[si].showIf.eq!==true)add('showIf not set');
  fbSetProp('med',si,'optAdd',1);fbSetProp('med',si,'opt.en.0','AA');if(fbForm('med').fields[si].options.length!==4||fbForm('med').fields[si].options[0].en!=='AA')add('option rows failed');fbSetProp('med',si,'optDel',3);
  const mr=formRender({id:'x',fields:fbForm('med').fields},{meds:true},{ns:'t'});if(!mr.includes('A'))add('conditional field not shown when condition met');
  /* custom field set -> entity form */
  const ci=fbAddField('supplier','text');fbSetProp('supplier',ci,'label.en','Fleet size zz');
  if((formRender('supplier',{})||'').includes('Fleet size zz'))add('custom field visible before publish');
  fbPublish('supplier');
  const sh=formRender('supplier',{});if(!sh.includes('Fleet size zz')||!sh.includes('custom.f1'))add('published supplier custom field not in formRender');
  S.lang='he';fbSetProp('supplier',ci,'label.he','גודל צי');fbPublish('supplier');if(!formRender('supplier',{}).includes('גודל צי'))add('hebrew custom label missing');S.lang='en';
  const pj=JSON.stringify(PERSIST.find(p=>p.key==='fb-forms').get());
  /* send: only 'not sent' changes for that form */
  const t=byId(tid),before=t.trav.map(x=>({reg:x.form.reg,med:x.form.med,waiver:x.form.waiver}));
  const ns=t.trav.filter(x=>x.form.med==='not sent').length,nr=fbSend(t,'med');
  if(nr!==ns)add('fbSend count '+nr+' vs '+ns);
  t.trav.forEach((x,j)=>{const b=before[j];if(x.form.reg!==b.reg||x.form.waiver!==b.waiver)add('fbSend touched another form');
    if(b.med==='not sent'?x.form.med!=='sent':x.form.med!==b.med)add('fbSend changed a non-pending traveler');});
  if(fbSend(t,'med')!==0)add('fbSend not idempotent');
  /* persistence round trip */
  PERSIST.find(p=>p.key==='fb-forms').set(JSON.parse(pj));
  if(!formRender('supplier',{}).includes('Fleet size zz'))add('persist round trip lost custom field');
  /* reset restores defaults */
  PERSIST.forEach(p=>{try{p.reset();}catch(e){}});
  if(fbForm('reg').fields.length!==n0||fbForm('reg').version!==1||fbForm('supplier').fields.length||formRender('supplier',{}).includes('Fleet size zz')||FM_CUSTOM.supplier)add('reset did not restore defaults');
  if(S.fbSel!=='reg'||S.fbField!==-1)add('reset left builder state');
  /* render every form, mode, tab, language, role */
  const fin=JSON.stringify(portfolio(TRIPS).rev);
  fbAddField('hotel','multi');fbAddField('client','repeater');fbAddField('activity','section');
  ['manager','accountant',AGENTS[0]].forEach(role=>{S.role=role;
    ['en','he'].forEach(lang=>{S.lang=lang;
      FB_TRAV.concat(FB_ENTS).forEach(id=>{S.fbSel=id;S.fbField=fbForm(id).fields.length?0:-1;S.fbTab='build';
        ['','desk','phone'].forEach(pv=>{S.fbPrev=pv;const html=VIEWS.forms();h.chk(html,'forms '+role+' '+lang+' '+id+' '+pv);if(lang==='en')h.scan(html,'forms '+id+' '+pv);
          if(!fbCan()&&/data-act="fb-(add|del|pub)"/.test(html))out.push('edit controls shown to '+role);});});
      S.fbPrev='';S.fbTab='resp';FB_TRAV.forEach(id=>{S.fbRf=id;const html=VIEWS.forms();h.chk(html,'fb resp '+role+' '+lang+' '+id);if(lang==='en')h.scan(html,'fb resp '+id);
        if(role!=='agent'&&seesAll()&&!html.includes('forms.redbudtours.example'))out.push('responses link missing '+id);});
      S.fbTab='build';});});
  S.lang='en';S.role='manager';S.fbTab='resp';S.fbRf='reg';
  {const html=VIEWS.forms();if(!/Send to travelers/.test(html))out.push('send button missing');}
  S.fbTab='build';S.fbPrev='';
  if(JSON.stringify(portfolio(TRIPS).rev)!==fin)add('finance changed');
  S.role=S0;return out;}});
