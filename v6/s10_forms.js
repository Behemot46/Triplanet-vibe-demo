/* ---------- v8 forms: schema-driven form engine + modal (module code fm) ----------
   API for other modules (guard with typeof formOpen==='function'):
   FORM_SCHEMAS[id]={id,title:{en,he},entity,idKey?,fields:[...],toDraft?(rec),onSave(record,isNew)}
   FM_TYPES[type]={render(f,val,c),validate(f,val,rec,path)}   (c = {id,path,attr,ro,rec,errors,opts})
   formOpen(id,record|null) / formClose() / formSet(path,v) / formSave() -> {ok,errors}
   formValidate(id|schema,record) -> {ok,errors}   pure
   formRender(schema|id,record,opts) -> HTML of the fields (opts: {ns,errors,ro,phone})  for previews
   FM_CUSTOM[entity]=[fields]  custom fields added by the form builder; shown under "Custom fields"
   Field: {k,type,label:{en,he},req?,help?,options?:[{v,en,he}]|fn(draft),min?,max?,int?,step?,pattern?,showIf?:{k,eq|ne|in},cols?:1|2,def?,fields?(repeater),curK?(money)}
   Types: text email tel number money select multi date toggle textarea file section repeater.
   Keys may be dotted paths (contact.name, cancel.0.d). */
const FORM_SCHEMAS={};
const FM_EXTRA={activity:[],hotel:[]};
const FM_CUSTOM={};
const FM_ENT={edits:{},added:{},orig:{}};
Object.assign(S,{form:null});

/* ---- helpers ---- */
const fmLb=o=>o?L(o.he,o.en):'';
const fmKeys=p=>String(p).split('.');
const fmGet=(o,p)=>fmKeys(p).reduce((a,k)=>a==null?undefined:a[k],o);
function fmPut(o,p,v){const ks=fmKeys(p);let a=o;for(let i=0;i<ks.length-1;i++){const k=ks[i];if(a[k]==null||typeof a[k]!=='object')a[k]=/^\d+$/.test(ks[i+1])?[]:{};a=a[k];}a[ks[ks.length-1]]=v;}
const fmClone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const fmSchema=x=>typeof x==='string'?FORM_SCHEMAS[x]:x;
const fmEmpty=v=>v==null||v===''||(Array.isArray(v)&&!v.length);
const fmOpts=(f,d)=>typeof f.options==='function'?f.options(d):(f.options||[]);
const fmId=(ns,p)=>'fm-'+(ns||'f')+'-'+String(p).replace(/\./g,'-');
const fmSlug=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'new';
const FM_CUR={USD:'$',EUR:'€',GBP:'£',CAD:'C$',ILS:'₪'};
function fmVisible(f,scope){
  const c=f.showIf;if(!c)return true;if(typeof c==='function')return !!c(scope);
  const v=fmGet(scope,c.k);if('eq' in c)return Array.isArray(c.eq)?c.eq.includes(v):v===c.eq;
  if('ne' in c)return v!==c.ne;if(c.in)return c.in.includes(v==null?'':v);return !!v;}
function fmAllFields(sc){
  const own=sc.fields||[],cu=FM_CUSTOM[sc.entity||sc.id];
  return cu&&cu.length?own.concat([{k:'_cust',type:'section',label:{en:'Custom fields',he:'שדות מותאמים'}}],cu):own;}

/* ---- messages (resolved at call time, so they follow the language) ---- */
const FM_MSG={
  req:()=>L('שדה חובה','This field is required'),
  email:()=>L('הזינו כתובת אימייל תקינה','Enter a valid email address'),
  tel:()=>L('הזינו מספר טלפון תקין','Enter a valid phone number'),
  num:()=>L('הזינו מספר','Enter a number'),
  int:()=>L('הזינו מספר שלם','Enter a whole number'),
  min:v=>L('הערך הנמוך ביותר הוא '+v,'Must be at least '+v),
  max:v=>L('הערך הגבוה ביותר הוא '+v,'Must be at most '+v),
  len:v=>L('עד '+v+' תווים','At most '+v+' characters'),
  date:()=>L('הזינו תאריך תקין','Enter a valid date'),
  opt:()=>L('בחרו אחת מהאפשרויות','Choose one of the options'),
  pat:()=>L('הפורמט אינו תקין','Invalid format'),
  rows:v=>L('הוסיפו לפחות '+v+(v===1?' שורה':' שורות'),'Add at least '+v+(v===1?' row':' rows')),
  rowsMax:v=>L('עד '+v+' שורות','At most '+v+' rows'),
  tick:()=>L('יש לאשר כדי להמשיך','Please confirm to continue')};
const fmNumErr=(f,v)=>{
  if(fmEmpty(v))return '';const n=typeof v==='number'?v:(String(v).trim()===''?NaN:Number(v));
  if(!isFinite(n))return FM_MSG.num();if(f.int&&Math.floor(n)!==n)return FM_MSG.int();
  if(f.min!=null&&n<f.min)return FM_MSG.min(f.min);if(f.max!=null&&n>f.max)return FM_MSG.max(f.max);return '';};

/* ---- field type registry: render() returns the control only; the wrapper (label, help, error) is added by fmField ---- */
const fmAttr=c=>` id="${c.id}"${c.ro?' disabled':` data-fm="${esc(c.path)}"`}${c.f&&c.f.req?' aria-required="true"':''}${c.err?' aria-invalid="true"':''} aria-describedby="${c.id}-e"`;
const fmInput=(type,extra)=>(f,val,c)=>`<input class="fm-in" type="${type}"${fmAttr(c)} value="${esc(val==null?'':val)}"${f.ph?` placeholder="${esc(fmLb(f.ph))}"`:''}${extra?extra(f):''}>`;
const FM_TYPES={
  text:{render:fmInput('text',f=>f.max?` maxlength="${f.max}"`:''),
    validate:(f,v)=>{if(fmEmpty(v))return '';v=String(v);if(f.max&&v.length>f.max)return FM_MSG.len(f.max);if(f.pattern&&!new RegExp(f.pattern).test(v))return f.patternMsg?fmLb(f.patternMsg):FM_MSG.pat();return '';}},
  email:{render:fmInput('email',()=>' autocomplete="off" inputmode="email"'),
    validate:(f,v)=>fmEmpty(v)||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())?'':FM_MSG.email()},
  tel:{render:fmInput('tel',()=>' inputmode="tel"'),
    validate:(f,v)=>fmEmpty(v)||(/^[+()\-.\s\d]+$/.test(String(v))&&String(v).replace(/\D/g,'').length>=7)?'':FM_MSG.tel()},
  number:{render:fmInput('number',f=>` inputmode="decimal" step="${f.step||(f.int?1:'any')}"${f.min!=null?` min="${f.min}"`:''}${f.max!=null?` max="${f.max}"`:''}`),validate:fmNumErr},
  money:{render:(f,val,c)=>{const cur=f.curK?fmGet(c.rec,f.curK):f.cur;return `<span class="fm-money"><span class="fm-pre">${FM_CUR[cur||'USD']||'$'}</span><input class="fm-in" type="number"${fmAttr(c)} value="${esc(val==null?'':val)}" inputmode="decimal" step="${f.step||'0.01'}" min="${f.min!=null?f.min:0}"${f.max!=null?` max="${f.max}"`:''}></span>`;},
    validate:(f,v)=>fmNumErr({min:0,...f},v)},
  select:{render:(f,val,c)=>{const o=fmOpts(f,c.rec);return `<select class="fm-in"${fmAttr(c)}>${fmEmpty(val)||!f.req?`<option value=""${fmEmpty(val)?' selected':''}>${f.ph?esc(fmLb(f.ph)):L('בחרו...','Select...')}</option>`:''}${o.map(x=>`<option value="${esc(x.v)}"${String(x.v)===String(val)?' selected':''}>${esc(fmLb(x))}</option>`).join('')}</select>`;},
    validate:(f,v,rec)=>fmEmpty(v)||fmOpts(f,rec).some(x=>String(x.v)===String(v))?'':FM_MSG.opt()},
  multi:{render:(f,val,c)=>{const o=fmOpts(f,c.rec),a=Array.isArray(val)?val:[];return `<div class="fm-multi" role="group" id="${c.id}" aria-describedby="${c.id}-e">${o.map(x=>`<label class="fm-chk"><input type="checkbox"${c.ro?' disabled':` data-fm-multi="${esc(c.path)}" data-v="${esc(x.v)}"`}${a.map(String).includes(String(x.v))?' checked':''}><span>${esc(fmLb(x))}</span></label>`).join('')}</div>`;},
    validate:(f,v,rec)=>{if(fmEmpty(v))return '';const o=fmOpts(f,rec).map(x=>String(x.v));return (Array.isArray(v)?v:[v]).every(x=>o.includes(String(x)))?'':FM_MSG.opt();}},
  date:{render:fmInput('date',f=>`${f.min?` min="${esc(f.min)}"`:''}${f.max?` max="${esc(f.max)}"`:''}`),
    validate:(f,v)=>{if(fmEmpty(v))return '';if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||isNaN(Date.parse(v)))return FM_MSG.date();
      if(f.min&&v<f.min)return FM_MSG.min(f.min);if(f.max&&v>f.max)return FM_MSG.max(f.max);return '';}},
  toggle:{inline:true,render:(f,val,c)=>`<label class="fm-tgl"><input type="checkbox"${fmAttr(c)}${val===true?' checked':''}><span class="fm-sw" aria-hidden="true"></span><span class="fm-tt">${esc(fmLb(f.label))}${f.req?'<i class="fm-req" aria-hidden="true">*</i>':''}</span></label>`,
    validate:(f,v)=>f.req&&v!==true?FM_MSG.tick():''},
  textarea:{render:(f,val,c)=>`<textarea class="fm-in fm-ta"${fmAttr(c)} rows="${f.rows||3}"${f.max?` maxlength="${f.max}"`:''}>${esc(val==null?'':val)}</textarea>`,
    validate:(f,v)=>f.max&&!fmEmpty(v)&&String(v).length>f.max?FM_MSG.len(f.max):''},
  file:{render:(f,val,c)=>`<div class="fm-file">${val?`<span class="fm-fn">${ic('document')} <bdi>${esc(val)}</bdi></span>`:`<span class="muted small">${L('לא נבחר קובץ','No file chosen')}</span>`}<label class="btn sm fm-fb">${ic('export')} ${val?L('החלפה','Replace'):L('בחירת קובץ','Choose file')}<input type="file" class="fm-fi"${fmAttr(c)}></label></div>`,
    validate:()=>''},
  section:{render:()=>'',validate:()=>''},
  repeater:{render:(f,val,c)=>{
      const rows=Array.isArray(val)?val:[],max=f.max||99;
      return `<div class="fm-rep" id="${c.id}">${rows.map((r,i)=>`<div class="fm-row"><span class="fm-rn">${i+1}</span><div class="fm-rowf">${f.fields.map(sf=>fmField(sf,r,`${c.path}.${i}.${sf.k}`,c.opts,c.rec)).join('')}</div>${c.ro?'':`<button type="button" class="fm-x" data-act="fm-del" data-v="${esc(c.path)}|${i}" aria-label="${L('הסרת שורה','Remove row')}">${ic('x')}</button>`}</div>`).join('')}
        ${rows.length?'':`<div class="fm-none small muted">${L('אין שורות עדיין','No rows yet')}</div>`}
        ${c.ro||rows.length>=max?'':`<button type="button" class="btn sm" id="${c.id}-add" data-act="fm-add" data-v="${esc(c.path)}">${L('הוספת שורה','Add row')}</button>`}</div>`;},
    validate:(f,v)=>{const n=Array.isArray(v)?v.length:0;if(f.min&&n<f.min)return FM_MSG.rows(f.min);if(f.max&&n>f.max)return FM_MSG.rowsMax(f.max);return '';}}
};

/* ---- one field: wrapper + control. scope = object holding the value (record or repeater row) ---- */
function fmField(f,scope,path,opts,rec){
  opts=opts||{};rec=rec||scope;
  if(!fmVisible(f,scope))return '';
  const T=FM_TYPES[f.type]||FM_TYPES.text,id=fmId(opts.ns,path);
  if(f.type==='section')return `<div class="fm-sec fm-c2"><h3>${esc(fmLb(f.label))}</h3>${f.help?`<p class="small muted">${esc(fmLb(f.help))}</p>`:''}</div>`;
  const key=f.k,val=fmGet(scope,key),err=(opts.errors||{})[path]||'';
  const ctl=T.render(f,val,{id,path,f,err,ro:!!opts.ro,rec,opts});
  const full=f.cols===2||['textarea','repeater','multi','file'].includes(f.type)&&f.cols!==1;
  return `<div class="fm-f ${full?'fm-c2':''} fm-t-${f.type}${err?' fm-bad':''}" data-fm-w="${esc(path)}">${T.inline?'':`<label class="fm-l"${f.type==='multi'||f.type==='repeater'?'':` for="${id}"`}>${esc(fmLb(f.label))}${f.req?'<i class="fm-req" aria-hidden="true">*</i>':''}</label>`}${ctl}${f.help?`<div class="fm-h small muted">${esc(fmLb(f.help))}</div>`:''}<div class="fm-e" id="${id}-e" data-fm-err="${esc(path)}" role="alert">${err?esc(err):''}</div></div>`;
}
/* fields of a schema as HTML, for previews (form builder) and for the modal body */
function formRender(x,record,opts){
  const sc=fmSchema(x);if(!sc)return '';opts=opts||{};record=record||{};
  return `<div class="fm-grid${opts.phone?' fm-phone':''}">${fmAllFields(sc).map(f=>fmField(f,record,f.k,opts,record)).join('')}</div>`;
}

/* ---- validation (pure) ---- */
function formValidate(x,record){
  const sc=fmSchema(x),errors={};if(!sc)return {ok:false,errors:{_:'unknown form'}};record=record||{};
  const walk=(fields,base,scope)=>fields.forEach(f=>{
    if(f.type==='section'||!fmVisible(f,scope))return;
    const p=base?base+'.'+f.k:f.k,v=fmGet(scope,f.k),T=FM_TYPES[f.type]||FM_TYPES.text;
    let m=f.type==='toggle'?'':(f.req&&fmEmpty(v)?FM_MSG.req():'');
    if(!m&&T.validate)m=T.validate(f,v,record,p)||'';
    if(m)errors[p]=m;
    if(f.type==='repeater'&&Array.isArray(v))v.forEach((row,i)=>walk(f.fields,p+'.'+i,row||{}));
  });
  walk(fmAllFields(sc),'',record);
  return {ok:!Object.keys(errors).length,errors};
}
/* number strings to numbers, text trimmed, fields hidden by showIf removed */
function fmClean(sc,draft){
  const rec=fmClone(draft)||{};
  const walk=(fields,scope)=>fields.forEach(f=>{
    if(f.type==='section')return;
    if(!fmVisible(f,scope)){const ks=fmKeys(f.k),h=ks.length>1?fmGet(scope,ks.slice(0,-1).join('.')):scope;if(h)delete h[ks[ks.length-1]];return;}
    const v=fmGet(scope,f.k);
    if((f.type==='number'||f.type==='money')&&!fmEmpty(v)&&isFinite(Number(v)))fmPut(scope,f.k,Number(v));
    else if(typeof v==='string'&&['text','email','tel','textarea'].includes(f.type))fmPut(scope,f.k,v.trim());
    else if(f.type==='repeater'&&Array.isArray(v))v.forEach(r=>walk(f.fields,r));
  });
  walk(fmAllFields(sc),rec);
  return rec;
}

/* ---- state: open, set, save, close ---- */
function fmOpenState(id,record){
  const sc=FORM_SCHEMAS[id];if(!sc)return false;
  let draft=record?fmClone(record):{};
  if(record&&sc.toDraft)draft=sc.toDraft(draft)||draft;
  if(!record)fmAllFields(sc).forEach(f=>{if(f.def!==undefined&&f.type!=='section'&&fmGet(draft,f.k)===undefined)fmPut(draft,f.k,fmClone(f.def));});
  const idKey=sc.idKey||'id';
  S.form={id,recId:record?record[idKey]:null,isNew:!record,draft,errors:{},touched:{},submitted:false,dirty:false,fresh:true,focus:'first'};
  try{S.form.opener=document.activeElement&&document.activeElement.id||'';}catch(e){}
  return true;
}
function formOpen(id,record){if(!fmOpenState(id,record||null))return false;render();return true;}
function formClose(){
  const op=S.form&&S.form.opener;S.form=null;render();
  try{if(op){const e=document.getElementById(op);if(e&&e.focus)e.focus();}}catch(e){}
}
function formSet(k,v){if(!S.form)return false;fmPut(S.form.draft,k,v);S.form.dirty=true;return true;}
function formToggleMulti(k,val,on){
  if(!S.form)return false;const a=Array.isArray(fmGet(S.form.draft,k))?fmGet(S.form.draft,k).slice():[];
  const i=a.map(String).indexOf(String(val));if(on&&i<0)a.push(val);if(!on&&i>=0)a.splice(i,1);return formSet(k,a);}
function formAddRow(k){
  if(!S.form)return false;const f=fmFind(k);const a=Array.isArray(fmGet(S.form.draft,k))?fmGet(S.form.draft,k):[];
  if(f&&f.max&&a.length>=f.max)return false;
  const row={};(f&&f.fields||[]).forEach(sf=>{if(sf.def!==undefined)row[sf.k]=fmClone(sf.def);});
  a.push(row);fmPut(S.form.draft,k,a);S.form.dirty=true;fmRedraw(fmId('f',k+'.'+(a.length-1)+'.'+((f&&f.fields[0])||{}).k));return true;}
function formDelRow(k,i){
  if(!S.form)return false;const a=fmGet(S.form.draft,k);if(!Array.isArray(a)||i<0||i>=a.length)return false;
  a.splice(i,1);S.form.dirty=true;fmRedraw(fmId('f',k)+'-add');return true;}
function fmFind(path){const ks=fmKeys(path).filter(x=>!/^\d+$/.test(x)).join('.');const sc=S.form&&FORM_SCHEMAS[S.form.id];if(!sc)return null;
  let r=null;const walk=(fs,pre)=>fs.forEach(f=>{const p=pre?pre+'.'+f.k:f.k;if(p===ks)r=f;if(f.type==='repeater')walk(f.fields,p);});walk(fmAllFields(sc),'');return r;}
/* errors the person should see now: all after a submit try, else only fields already left */
function fmShown(){
  if(!S.form)return {};const sc=FORM_SCHEMAS[S.form.id],all=formValidate(sc,S.form.draft).errors;
  if(S.form.submitted)return all;const o={};Object.keys(all).forEach(k=>{if(S.form.touched[k])o[k]=all[k];});return o;}
const fmHasDeps=p=>{const sc=S.form&&FORM_SCHEMAS[S.form.id];return !!sc&&fmAllFields(sc).some(f=>f.showIf&&typeof f.showIf==='object'&&f.showIf.k===p);};
function formBlur(p){
  if(!S.form)return;S.form.touched[p]=true;const res=formValidate(FORM_SCHEMAS[S.form.id],S.form.draft);S.form.errors=res.errors;
  try{const w=document.querySelector(`[data-fm-w="${p}"]`);if(!w)return;const m=res.errors[p]||'';w.classList.toggle('fm-bad',!!m);
    const e=Array.from(w.children).find(c=>c.hasAttribute&&c.hasAttribute('data-fm-err'));if(e)e.textContent=m;
    const i=w.querySelector('[data-fm]');if(i){if(m)i.setAttribute('aria-invalid','true');else i.removeAttribute('aria-invalid');}}catch(e){}
}
function formSave(){
  if(!S.form)return {ok:false,errors:{_:'no form open'}};
  const sc=FORM_SCHEMAS[S.form.id],res=formValidate(sc,S.form.draft);S.form.errors=res.errors;
  if(!res.ok){S.form.submitted=true;S.form.focus='error';fmRedraw();return {ok:false,errors:res.errors};}
  const isNew=S.form.isNew,rec=fmClean(sc,S.form.draft);let out=rec;
  try{if(sc.onSave){const r=sc.onSave(rec,isNew);if(r&&typeof r==='object')out=r;}}catch(e){if(typeof console!=='undefined')console.error(e);}
  const nm=fmName(out)||fmLb(sc.title);S.form=null;save();render();
  toast(isNew?L(`נוסף: ${nm}`,`Added: ${nm}`):L(`נשמר: ${nm}`,`Saved: ${nm}`));
  return {ok:true,errors:{},record:out};
}
const fmName=r=>r&&(r.name||r.en||r.he||r.id)||'';

/* ---- modal HTML ---- */
function fmRootHtml(){
  const f=S.form;if(!f)return '';const sc=FORM_SCHEMAS[f.id];if(!sc)return '';
  const errs=fmShown(),n=Object.keys(f.submitted?formValidate(sc,f.draft).errors:{}).length;
  const ttl=f.isNew?(sc.newTitle?fmLb(sc.newTitle):L('הוספת '+sc.title.he,'New '+sc.title.en.toLowerCase())):(sc.editTitle?fmLb(sc.editTitle):L('עריכת '+sc.title.he,'Edit '+sc.title.en.toLowerCase()));
  const sub=f.isNew?'':fmName(f.draft);
  return `<div class="fm-root" data-fm-root="${f.id}"><div class="fm-scrim" data-act="fm-scrim"></div>
   <form class="fm-modal${f.fresh?' fm-fresh':''}" id="fm-form" role="dialog" aria-modal="true" aria-labelledby="fm-title" novalidate>
    <header class="fm-hd"><div class="fm-hdt"><span class="fm-eye">${esc(fmLb(sc.title))}</span><h2 id="fm-title">${esc(ttl)}</h2>${sub?`<div class="fm-sub"><bdi>${esc(sub)}</bdi></div>`:''}</div>
      <div class="fm-hda"><button type="submit" class="fm-save">${ic('check')} ${f.isNew?L('הוספה','Add'):L('שמירה','Save')}</button>
      <button type="button" class="fm-x fm-close" data-act="fm-cancel" aria-label="${L('סגירה','Close')}">${ic('x')}</button></div></header>
    <div class="fm-body">${formRender(sc,f.draft,{errors:errs})}</div>
    <footer class="fm-ft"><span class="fm-sum small" role="status">${n?`${ic('danger')} ${L(`${n} שדות דורשים תיקון`,`${n} ${n===1?'field needs':'fields need'} attention`)}`:''}</span>
      <button type="button" class="btn" data-act="fm-cancel">${L('ביטול','Cancel')}</button>
</footer></form></div>`;
}
function fmRedraw(focusId){
  if(!S.form)return;
  try{const r=document.querySelector('.fm-root');if(!r){render();return;}
    const b=r.querySelector('.fm-body'),st=b?b.scrollTop:0;
    r.outerHTML=trHtml(fmRootHtml());
    const nb=document.querySelector('.fm-root .fm-body');if(nb)nb.scrollTop=st;
    const f=S.form.focus;S.form.focus=null;fmFocus(f==='error'?'error':focusId);
  }catch(e){}
}
function fmFocus(target){
  if(!target)return;
  try{setTimeout(()=>{let e=null;
    if(target==='first')e=document.querySelector('.fm-modal [data-fm]:not([disabled])');
    else if(target==='error')e=document.querySelector('.fm-modal .fm-bad [data-fm],.fm-modal .fm-bad [data-fm-multi]')||document.querySelector('.fm-modal [data-fm]');
    else e=document.getElementById(target);
    if(e&&e.focus){e.focus();if(e.select&&e.type==='text'&&target==='first'){}}},30);}catch(e){}
}
/* wrap render: the modal is appended after the app so it sits above everything (state driven, A7) */
{const r0=render;render=function(){r0();try{fmMount();}catch(e){if(typeof console!=='undefined')console.error(e);}};}
function fmMount(){
  if(!S.form)return;const app=document.getElementById('app');if(!app)return;
  const h=trHtml(fmRootHtml());const fresh=S.form.fresh;S.form.fresh=false;
  if(app.insertAdjacentHTML)app.insertAdjacentHTML('beforeend',h);else app.innerHTML+=h;
  const f=S.form.focus;S.form.focus=null;if(fresh||f)fmFocus(f||'first');
}

/* ---- events ---- */
document.addEventListener('click',e=>{
  if(!S.form)return;const b=e.target.closest&&e.target.closest('[data-act^="fm-"]');if(!b)return;
  const a=b.dataset.act,v=b.dataset.v;
  if(a==='fm-cancel')formClose();
  else if(a==='fm-scrim'){if(!S.form.dirty)formClose();}
  else if(a==='fm-add')formAddRow(v);
  else if(a==='fm-del'){const p=v.split('|');formDelRow(p[0],+p[1]);}
});
document.addEventListener('input',e=>{
  const el=e.target;if(!S.form||!el.dataset||el.dataset.fm==null)return;
  if(el.type==='checkbox'||el.type==='file'||el.tagName==='SELECT')return;
  formSet(el.dataset.fm,el.type==='number'?(el.value===''?'':Number(el.value)):el.value);
});
document.addEventListener('change',e=>{
  const el=e.target;if(!S.form||!el.dataset)return;
  if(el.dataset.fmMulti!=null){formToggleMulti(el.dataset.fmMulti,el.dataset.v,el.checked);formBlur(el.dataset.fmMulti);return;}
  const p=el.dataset.fm;if(p==null)return;
  if(el.type==='checkbox'){formSet(p,el.checked);S.form.touched[p]=true;fmRedraw(el.id);return;}
  if(el.type==='file'){formSet(p,el.files&&el.files[0]?el.files[0].name:'');S.form.touched[p]=true;fmRedraw(el.id);return;}
  if(el.tagName==='SELECT'){formSet(p,el.value);S.form.touched[p]=true;if(fmHasDeps(p))fmRedraw(el.id);else formBlur(p);return;}
  formSet(p,el.type==='number'?(el.value===''?'':Number(el.value)):el.value);
  if(fmHasDeps(p)){S.form.touched[p]=true;fmRedraw(el.id);}else formBlur(p);
});
document.addEventListener('submit',e=>{if(e.target&&e.target.id==='fm-form'&&S.form){e.preventDefault();formSave();}});
/* capture phase: Esc closes the form first, before the Maya panel or menu handlers see it */
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.form){e.stopPropagation();e.preventDefault();formClose();}},true);

/* ---- entity upserts: arrays owned by other modules (guarded), edits persisted via PERSIST ---- */
const FM_KINDS={
  supplier:{arr:()=>typeof SUPPLIERS!=='undefined'&&Array.isArray(SUPPLIERS)?SUPPLIERS:null,idKey:'id',
    maps:r=>{if(typeof SUP_BY!=='undefined'&&SUP_BY)SUP_BY[r.id]=r;}},
  client:{arr:()=>typeof CLIENTS!=='undefined'&&Array.isArray(CLIENTS)?CLIENTS:null,idKey:'id',
    maps:r=>{if(typeof CLI_BY!=='undefined'&&CLI_BY){const e=Object.entries(CLI_BY)[0];if(e&&e[1]&&e[0]===e[1].name)CLI_BY[r.name]=r;else CLI_BY[r.id]=r;}}},
  user:{arr:()=>typeof STAFF!=='undefined'&&Array.isArray(STAFF)?STAFF:null,idKey:'key',maps:()=>{}}
};
function fmUpsert(kind,rec,track){
  const K=FM_KINDS[kind],arr=K&&K.arr();if(!arr)return null;
  const id=rec[K.idKey],i=arr.findIndex(x=>x[K.idKey]===id);let row;
  if(i>=0){row=arr[i];
    if(track&&!(FM_ENT.orig[kind]||{})[id]&&!(FM_ENT.added[kind]||[]).includes(id)){(FM_ENT.orig[kind]=FM_ENT.orig[kind]||{})[id]=fmClone(row);}
    Object.keys(row).forEach(k=>{if(!(k in rec))delete row[k];});Object.assign(row,fmClone(rec));}
  else{row=fmClone(rec);arr.push(row);if(track)(FM_ENT.added[kind]=FM_ENT.added[kind]||[]).push(id);}
  K.maps(row);
  if(track)(FM_ENT.edits[kind]=FM_ENT.edits[kind]||{})[id]=fmClone(row);
  return row;
}
function fmUniqueId(kind,base){
  const K=FM_KINDS[kind],arr=(K&&K.arr())||[];let id=base,n=2;while(arr.some(x=>x[K.idKey]===id))id=base+'-'+n++;return id;}
function fmSaveEntity(kind,rec,isNew){
  const K=FM_KINDS[kind];
  if(isNew&&!rec[K.idKey])rec[K.idKey]=fmUniqueId(kind,kind==='supplier'?'sup-'+fmSlug(rec.name):kind==='client'?'cli-'+fmSlug(rec.name):fmSlug(String(rec.en||'').split(' ')[0])||'user');
  fmUpsert(kind,rec,true);return rec;
}
function fmSaveExtra(kind,rec,isNew){
  const a=FM_EXTRA[kind];
  if(isNew&&!rec.id){let n=a.length+1,id;do{id='x-'+kind.slice(0,3)+'-'+fmSlug(rec.name)+(n>1?'-'+n:'');n++;}while(a.some(x=>x.id===id));rec.id=id;}
  const i=a.findIndex(x=>x.id===rec.id);if(i>=0)a[i]=rec;else a.push(rec);return rec;
}
const fmExtra=kind=>FM_EXTRA[kind]||[];
PERSIST.push({key:'fm-extra',get:()=>FM_EXTRA,
  set:v=>{FM_EXTRA.activity=Array.isArray(v&&v.activity)?v.activity:[];FM_EXTRA.hotel=Array.isArray(v&&v.hotel)?v.hotel:[];},
  reset:()=>{FM_EXTRA.activity=[];FM_EXTRA.hotel=[];S.form=null;}});
PERSIST.push({key:'fm-ents',get:()=>({edits:FM_ENT.edits,added:FM_ENT.added}),
  set:v=>{FM_ENT.edits={};FM_ENT.added={};FM_ENT.orig={};
    Object.keys((v&&v.edits)||{}).forEach(kind=>Object.keys(v.edits[kind]).forEach(id=>{
      fmUpsert(kind,v.edits[kind][id],true);}));},
  reset:()=>{
    Object.keys(FM_ENT.added).forEach(kind=>{const K=FM_KINDS[kind],arr=K&&K.arr();if(!arr)return;
      FM_ENT.added[kind].forEach(id=>{const i=arr.findIndex(x=>x[K.idKey]===id);if(i>=0)arr.splice(i,1);});});
    Object.keys(FM_ENT.orig).forEach(kind=>{const K=FM_KINDS[kind],arr=K&&K.arr();if(!arr)return;
      Object.keys(FM_ENT.orig[kind]).forEach(id=>{const row=arr.find(x=>x[K.idKey]===id);if(row){Object.keys(row).forEach(k=>delete row[k]);Object.assign(row,FM_ENT.orig[kind][id]);}});});
    FM_ENT.edits={};FM_ENT.added={};FM_ENT.orig={};S.form=null;}});

/* ---- built-in schemas ---- */
const fmO=(v,en,he)=>({v,en,he});
const fmDestOpts=all=>()=>{const o=typeof DESTS!=='undefined'?Object.keys(DESTS).map(k=>({v:k,en:DESTS[k].en,he:DESTS[k].he})):[];return all?[fmO('ALL','All destinations','כל היעדים'),...o]:o;};
const FM_CATS=[fmO('Lodging','Lodging','לינה'),fmO('Transport','Transport','הסעות'),fmO('Guide','Guide','הדרכה'),fmO('Activities','Activities','אטרקציות'),fmO('Meals','Meals','ארוחות'),fmO('Insurance','Insurance','ביטוח')];
const FM_CURS=[fmO('USD','US dollar (USD)','דולר אמריקאי (USD)'),fmO('EUR','Euro (EUR)','יורו (EUR)'),fmO('GBP','British pound (GBP)','לירה שטרלינג (GBP)'),fmO('CAD','Canadian dollar (CAD)','דולר קנדי (CAD)')];
const FM_UNITS=[fmO('room-night','Room night','לילה לחדר'),fmO('day','Day','יום'),fmO('person','Person','לאדם'),fmO('meal','Meal','ארוחה'),fmO('transfer','Transfer','העברה'),fmO('evening','Evening','ערב')];
const fmCtypes=()=>{const k=typeof CTYPE!=='undefined'?Object.keys(CTYPE):['Church','School','Club','Association','Choir','Agency'];if(!k.includes('Prospect'))k.push('Prospect');
  return k.map(x=>typeof CTYPE!=='undefined'&&CTYPE[x]?fmO(x,CTYPE[x][1],CTYPE[x][0]):fmO(x,x,x==='Prospect'?'פוטנציאלי':x));};
const fmT=(en,he)=>({en,he});
const fmContact=(pre,reqName)=>[
  {k:pre+'.name',type:'text',label:fmT('Contact name','שם איש קשר'),req:reqName,max:60},
  {k:pre+'.role',type:'text',label:fmT('Role','תפקיד'),max:60},
  {k:pre+'.email',type:'email',label:fmT('Email','אימייל')},
  {k:pre+'.phone',type:'tel',label:fmT('Phone','טלפון')}];

FORM_SCHEMAS.supplier={id:'supplier',entity:'supplier',title:fmT('Supplier','ספק'),idKey:'id',
  toDraft:d=>{if(Array.isArray(d.cancel))d.cancel=d.cancel.map(x=>Array.isArray(x)?{d:x[0],p:x[1]}:x);return d;},
  fields:[
    {k:'_a',type:'section',label:fmT('Basics','פרטים בסיסיים')},
    {k:'name',type:'text',label:fmT('Supplier name','שם הספק'),req:true,max:80,cols:2},
    {k:'cat',type:'select',label:fmT('Category','קטגוריה'),req:true,options:FM_CATS,def:'Lodging'},
    {k:'dest',type:'select',label:fmT('Destination','יעד'),req:true,options:fmDestOpts(true)},
    {k:'city',type:'text',label:fmT('City','עיר'),max:60},
    {k:'country',type:'text',label:fmT('Country','מדינה'),max:60},
    {k:'cur',type:'select',label:fmT('Billing currency','מטבע חיוב'),req:true,options:FM_CURS,def:'USD',help:fmT('USD or the destination currency.','דולר או מטבע היעד.')},
    {k:'pref',type:'select',label:fmT('Preference','מועדפות'),req:true,def:'Medium',
      options:d=>[fmO('High','High','גבוהה'),fmO('Medium','Medium','בינונית')].concat(d&&d.real?[]:[fmO('Low','Low','נמוכה')])},
    {k:'rating',type:'number',label:fmT('Rating (3.0 to 5.0)','דירוג (3.0 עד 5.0)'),min:3,max:5,step:'0.1',showIf:{k:'real',ne:true}},
    {k:'_b',type:'section',label:fmT('Rates and commission','תעריפים ועמלה')},
    {k:'base',type:'money',label:fmT('Reference unit cost','עלות יחידה לייחוס'),req:true,curK:'cur',min:0,max:100000},
    {k:'unit',type:'select',label:fmT('Unit','יחידה'),req:true,options:FM_UNITS,def:'person'},
    {k:'comm',type:'number',label:fmT('Commission to the agency (%)','עמלה לסוכנות (%)'),min:0,max:15,step:'0.5',def:0},
    {k:'variants',type:'repeater',label:fmT('Variants (for example bus size or room type)','וריאנטים (למשל גודל אוטובוס או סוג חדר)'),max:8,def:[],
      fields:[{k:'k',type:'text',label:fmT('Code','קוד'),req:true,max:20},{k:'en',type:'text',label:fmT('Name (English)','שם (אנגלית)'),req:true,max:40},
        {k:'he',type:'text',label:fmT('Name (Hebrew)','שם (עברית)'),max:40},{k:'mult',type:'number',label:fmT('Price multiplier','מכפיל מחיר'),req:true,min:0.1,max:5,step:'0.01',def:1}]},
    {k:'_c',type:'section',label:fmT('Contact','איש קשר')},
    ...fmContact('contact',true),
    {k:'_d',type:'section',label:fmT('Payment terms','תנאי תשלום')},
    {k:'terms.depPct',type:'number',label:fmT('Deposit (%)','מקדמה (%)'),min:0,max:100,def:25},
    {k:'terms.depDays',type:'number',label:fmT('Deposit due (days after booking)','מועד מקדמה (ימים מההזמנה)'),min:0,max:365,int:true,def:14},
    {k:'terms.balDays',type:'number',label:fmT('Balance due (days before arrival)','מועד יתרה (ימים לפני ההגעה)'),min:0,max:365,int:true,def:30},
    {k:'terms.payBy',type:'select',label:fmT('Pay by','אמצעי תשלום'),options:[fmO('ACH','ACH','ACH'),fmO('Wire','Wire transfer','העברה בנקאית'),fmO('Card','Card','כרטיס אשראי'),fmO('Check','Check','המחאה')],def:'ACH'},
    {k:'cancel',type:'repeater',label:fmT('Cancellation tiers','מדרגות ביטול'),max:6,min:1,
      def:[{d:60,p:0},{d:30,p:25},{d:14,p:50},{d:7,p:100}],
      fields:[{k:'d',type:'number',label:fmT('Days before arrival','ימים לפני ההגעה'),req:true,min:0,max:365,int:true},{k:'p',type:'number',label:fmT('Penalty (%)','קנס (%)'),req:true,min:0,max:100}]},
    {k:'_e',type:'section',label:fmT('Documents','מסמכים')},
    {k:'docs.w9',type:'toggle',label:fmT('W-9 on file','טופס W-9 בתיק'),showIf:{k:'country',in:['USA','United States','']}},
    {k:'docs.coi',type:'date',label:fmT('Insurance certificate valid until','תעודת ביטוח בתוקף עד')},
    {k:'docs.contractTo',type:'date',label:fmT('Contract valid until','חוזה בתוקף עד')},
    {k:'_f',type:'section',label:fmT('Notes','הערות')},
    {k:'notes.en',type:'textarea',label:fmT('Notes (English)','הערות (אנגלית)'),max:400},
    {k:'notes.he',type:'textarea',label:fmT('Notes (Hebrew)','הערות (עברית)'),max:400}],
  onSave(rec,isNew){
    if(Array.isArray(rec.cancel))rec.cancel=rec.cancel.map(x=>[Number(x.d),Number(x.p)]).sort((a,b)=>b[0]-a[0]);
    if(isNew){rec.real=false;rec.incumbent=false;rec.fictional=true;if(!rec.docs)rec.docs={};}
    if(typeof rec.rating==='number')rec.rating=Math.round(rec.rating*10)/10;
    return fmSaveEntity('supplier',rec,isNew);}};

FORM_SCHEMAS.client={id:'client',entity:'client',title:fmT('Client','לקוח'),idKey:'id',
  fields:[
    {k:'_a',type:'section',label:fmT('Client','פרטי הלקוח')},
    {k:'name',type:'text',label:fmT('Name','שם'),req:true,max:80,cols:2},
    {k:'type',type:'select',label:fmT('Type','סוג'),req:true,options:fmCtypes,def:'Church'},
    {k:'source',type:'select',label:fmT('How they found us','מקור הלקוח'),options:[fmO('Referral','Referral','המלצה'),fmO('Trade show','Trade show','תערוכה'),fmO('Website','Website','אתר'),fmO('Repeat','Repeat','לקוח חוזר')],def:'Referral'},
    {k:'city',type:'text',label:fmT('City','עיר'),max:60},
    {k:'state',type:'text',label:fmT('State','מדינה (ארה"ב)'),max:30,pattern:'^[A-Za-z .]{2,30}$',patternMsg:fmT('Use letters only, for example OK','אותיות באנגלית בלבד, למשל OK')},
    {k:'since',type:'number',label:fmT('Client since (year)','לקוח מאז (שנה)'),int:true,min:1950,max:2026},
    {k:'taxExempt',type:'toggle',label:fmT('Tax exempt','פטור ממס'),def:false},
    {k:'_c',type:'section',label:fmT('Contact','איש קשר')},
    ...fmContact('contact',true),
    {k:'_n',type:'section',label:fmT('Notes','הערות')},
    {k:'notes.en',type:'textarea',label:fmT('Notes (English)','הערות (אנגלית)'),max:400},
    {k:'notes.he',type:'textarea',label:fmT('Notes (Hebrew)','הערות (עברית)'),max:400}],
  onSave(rec,isNew){if(isNew&&!rec.type)rec.type='Church';return fmSaveEntity('client',rec,isNew);}};

FORM_SCHEMAS.user={id:'user',entity:'user',title:fmT('User','משתמש'),newTitle:fmT('New user','משתמש חדש'),editTitle:fmT('Edit user','עריכת משתמש'),idKey:'key',
  fields:[
    {k:'en',type:'text',label:fmT('Full name (English)','שם מלא (אנגלית)'),req:true,max:60},
    {k:'he',type:'text',label:fmT('Full name (Hebrew)','שם מלא (עברית)'),max:60},
    {k:'email',type:'email',label:fmT('Email','אימייל'),req:true},
    {k:'phone',type:'tel',label:fmT('Phone','טלפון')},
    {k:'role',type:'select',label:fmT('Role','תפקיד'),req:true,def:'agent',options:[fmO('owner','Owner','בעלים'),fmO('admin','Admin','מנהל/ת מערכת'),fmO('agent','Agent','סוכן/ת'),fmO('accountant','Accountant','הנהלת חשבונות')]},
    {k:'target',type:'money',label:fmT('Annual booked-revenue target','יעד שנתי להכנסות'),min:0,max:50000000,showIf:{k:'role',eq:'agent'}},
    {k:'active',type:'toggle',label:fmT('Active user','משתמש פעיל'),def:true}],
  onSave(rec,isNew){return fmSaveEntity('user',rec,isNew);}};

FORM_SCHEMAS.activity={id:'activity',entity:'activity',title:fmT('Activity','פעילות'),idKey:'id',
  fields:[
    {k:'name',type:'text',label:fmT('Activity name','שם הפעילות'),req:true,max:80,cols:2},
    {k:'dest',type:'select',label:fmT('Destination','יעד'),req:true,options:fmDestOpts(false)},
    {k:'city',type:'text',label:fmT('City','עיר'),req:true,max:60},
    {k:'kind',type:'select',label:fmT('Kind','סוג'),def:'landmark',options:[fmO('show','Show','הופעה'),fmO('museum','Museum','מוזיאון'),fmO('landmark','Landmark','אתר מורשת'),fmO('tour','Tour','סיור'),fmO('cruise','Cruise','שייט'),fmO('dining','Dining','ארוחה'),fmO('park','Park','פארק')]},
    {k:'dur',type:'number',label:fmT('Duration (hours)','משך (שעות)'),req:true,min:0.5,max:12,step:'0.5',def:2},
    {k:'cost',type:'money',label:fmT('Cost per person','עלות לאדם'),req:true,min:0,max:5000},
    {k:'comm',type:'number',label:fmT('Commission (%)','עמלה (%)'),min:0,max:30,step:'0.5',def:0},
    {k:'note',type:'textarea',label:fmT('Note','הערה'),max:300}],
  onSave(rec,isNew){return fmSaveExtra('activity',rec,isNew);}};

FORM_SCHEMAS.hotel={id:'hotel',entity:'hotel',title:fmT('Hotel','מלון'),idKey:'id',
  fields:[
    {k:'name',type:'text',label:fmT('Hotel name','שם המלון'),req:true,max:80,cols:2},
    {k:'dest',type:'select',label:fmT('Destination','יעד'),req:true,options:fmDestOpts(false)},
    {k:'city',type:'text',label:fmT('City','עיר'),req:true,max:60},
    {k:'stars',type:'number',label:fmT('Stars (1 to 5)','כוכבים (1 עד 5)'),req:true,int:true,min:1,max:5,def:3},
    {k:'brand',type:'select',label:fmT('Brand','מותג'),def:'Independent',options:()=>typeof BRANDS!=='undefined'?Object.keys(BRANDS).map(k=>fmO(k,BRANDS[k].label,BRANDS[k].label)):[fmO('Independent','Independent','עצמאי')]},
    {k:'rate',type:'money',label:fmT('Group rate per room night','תעריף קבוצות ללילה'),req:true,min:20,max:3000},
    {k:'rooms',type:'repeater',label:fmT('Room types','סוגי חדרים'),max:6,def:[{type:'Twin',rate:''}],
      fields:[{k:'type',type:'select',label:fmT('Type','סוג'),req:true,options:[fmO('Twin','Twin','זוגי עם שתי מיטות'),fmO('Double','Double','זוגי'),fmO('Single','Single','יחיד'),fmO('Triple','Triple','משלוש'),fmO('Quad','Quad','מארבע')]},
        {k:'rate',type:'money',label:fmT('Rate per night','תעריף ללילה'),min:20,max:3000}]},
    {k:'note',type:'textarea',label:fmT('Note','הערה'),max:300}],
  onSave(rec,isNew){return fmSaveExtra('hotel',rec,isNew);}};

/* ---- tests ---- */
TESTS.push({name:'forms engine',run:h=>{const els=h.els;
  const out=[],S0l=S.lang,S0r=S.role,add=m=>out.push(m);
  S.lang='en';
  const okSup={name:'Prairie Coach Lines',cat:'Transport',dest:'Branson',city:'Branson',country:'USA',cur:'USD',pref:'Medium',rating:4.2,base:640,unit:'day',comm:5,
    variants:[{k:'full',en:'Full bus',he:'אוטובוס מלא',mult:1}],contact:{name:'Dale Pruitt',role:'Sales',email:'dale@prairiecoach.example',phone:'+1 (555) 0142-300'},
    terms:{depPct:25,depDays:14,balDays:30,payBy:'ACH'},cancel:[{d:60,p:0},{d:14,p:50}],docs:{w9:true,coi:'2027-06-30',contractTo:'2027-12-31'}};
  const dest=typeof DESTS!=='undefined'&&DESTS.Branson?'Branson':Object.keys(DESTS)[0];okSup.dest=dest;
  let r=formValidate('supplier',okSup);if(!r.ok)add('complete supplier rejected: '+JSON.stringify(r.errors));
  r=formValidate('supplier',{});if(r.ok||!r.errors.name||!r.errors.cat||!r.errors['contact.name']||!r.errors.base)add('missing required not caught: '+Object.keys(r.errors).join());
  r=formValidate('supplier',{...okSup,contact:{...okSup.contact,email:'not-an-email'}});if(!r.errors['contact.email'])add('bad email accepted');
  r=formValidate('supplier',{...okSup,contact:{...okSup.contact,phone:'12'}});if(!r.errors['contact.phone'])add('bad phone accepted');
  r=formValidate('supplier',{...okSup,rating:7});if(!r.errors.rating)add('rating out of range accepted');
  r=formValidate('supplier',{...okSup,comm:40});if(!r.errors.comm)add('commission out of range accepted');
  r=formValidate('supplier',{...okSup,terms:{...okSup.terms,depPct:120}});if(!r.errors['terms.depPct'])add('deposit % out of range accepted');
  r=formValidate('supplier',{...okSup,cancel:[{d:30,p:150}]});if(!r.errors['cancel.0.p'])add('repeater row range not caught');
  r=formValidate('supplier',{...okSup,cancel:[]});if(!r.errors.cancel)add('repeater min rows not caught');
  r=formValidate('supplier',{...okSup,real:true,rating:9});if(r.errors.rating)add('hidden showIf field validated');
  r=formValidate('supplier',{...okSup,pref:'Low',real:true});if(!r.errors.pref)add('real supplier accepted Low pref');
  r=formValidate('user',{en:'Test Person',email:'t@redbud.example',role:'accountant',target:'abc'});if(r.errors.target)add('target validated for non-agent');
  r=formValidate('user',{en:'Test Person',email:'t@redbud.example',role:'agent',target:-5});if(!r.errors.target)add('negative target accepted');
  r=formValidate('client',{name:'X',type:'Church',contact:{name:'A'},since:2030});if(!r.errors.since)add('client since out of range accepted');
  r=formValidate('hotel',{name:'H',dest,city:'C',stars:6,rate:100});if(!r.errors.stars)add('stars out of range accepted');
  r=formValidate('activity',{name:'A',dest,city:'C',dur:0,cost:10});if(!r.errors.dur)add('duration out of range accepted');
  /* rendering: every schema, both languages, three roles, new + submitted-empty (+ existing record when the data modules exist) */
  const ents={supplier:typeof SUPPLIERS!=='undefined'?SUPPLIERS[0]:null,client:typeof CLIENTS!=='undefined'?CLIENTS[0]:null,user:typeof STAFF!=='undefined'?STAFF[0]:null};
  const role2=[S0r,'accountant',AGENTS[0]];
  ['en','he'].forEach(lang=>{S.lang=lang;role2.forEach(role=>{S.role=role;
    Object.keys(FORM_SCHEMAS).forEach(id=>{
      fmOpenState(id,null);let html=fmRootHtml();h.chk(html,`form ${id} new ${lang}/${role}`);if(lang==='en')h.scan(html,`form ${id} new`);
      if(!/fm-modal/.test(html)||!/role="dialog"/.test(html))add(`modal shell missing ${id}`);
      S.form.submitted=true;html=fmRootHtml();h.chk(html,`form ${id} errors ${lang}/${role}`);if(lang==='en')h.scan(html,`form ${id} errors`);
      if(!/fm-bad/.test(html)&&Object.keys(formValidate(id,S.form.draft).errors).length)add(`errors not shown ${id}`);
      if(ents[id]){fmOpenState(id,ents[id]);html=fmRootHtml();h.chk(html,`form ${id} edit ${lang}/${role}`);}
      S.form=null;});});});
  S.lang='en';S.role=S0r;
  /* formRender for previews */
  const prev=formRender('client',{name:'Preview Co'},{ns:'pv',ro:true});h.chk(prev,'formRender');if(/data-fm=/.test(prev)||!/disabled/.test(prev))add('read-only preview is editable');
  /* a custom field registered by the builder shows under Custom fields */
  FM_CUSTOM.client=[{k:'custom.fav',type:'text',label:{en:'Favourite site',he:'אתר אהוב'}}];fmOpenState('client',null);
  if(!/Custom fields/.test(fmRootHtml()))add('custom fields section missing');
  delete FM_CUSTOM.client;S.form=null;
  /* real flow through render(): modal appears in the app, closes again */
  S.tab='home';formOpen('supplier',null);if(!/fm-modal/.test(els.app.innerHTML))add('modal not mounted by render()');
  formClose();if(/fm-modal/.test(els.app.innerHTML))add('modal still mounted after close');
  /* draft writes do not need a render; save of an invalid form keeps it open */
  fmOpenState('client',null);formSet('name','Zed Travel Club');const res0=formSave();if(res0.ok||!S.form)add('invalid client saved');
  /* saves into the data arrays (when the data modules are present) */
  const base=typeof CLIENTS!=='undefined'?CLIENTS.length:-1;
  fmOpenState('client',null);formSet('name','Verification Choir Society');formSet('type','Choir');formSet('contact.name','Pat Lee');formSet('contact.email','pat@verifychoir.example');
  const sv=formSave();if(!sv.ok)add('valid client rejected: '+JSON.stringify(sv.errors));
  if(typeof CLIENTS!=='undefined'){
    if(CLIENTS.length!==base+1)add(`client save added ${CLIENTS.length-base} rows`);
    const row=CLIENTS.find(c=>c.name==='Verification Choir Society');if(!row||!row.id)add('saved client has no id');
    else{fmOpenState('client',row);formSet('city','Tulsa');const e2=formSave();if(!e2.ok||CLIENTS.length!==base+1||CLIENTS.find(c=>c.id===row.id).city!=='Tulsa')add('client edit duplicated or lost');}
    PERSIST.find(p=>p.key==='fm-ents').reset();if(CLIENTS.length!==base)add('reset did not remove the added client');
  }
  if(typeof SUPPLIERS!=='undefined'){
    const n=SUPPLIERS.length;fmOpenState('supplier',null);Object.entries({name:'Verification Coaches',cat:'Transport',dest,cur:'USD',pref:'Medium',base:500,unit:'day','contact.name':'Sam','contact.email':'s@verifycoach.example'}).forEach(([k,v])=>formSet(k,v));
    const s2=formSave();if(!s2.ok)add('valid supplier rejected: '+JSON.stringify(s2.errors));
    else{if(SUPPLIERS.length!==n+1)add('supplier not added once');const q=SUPPLIERS.find(x=>x.name==='Verification Coaches');
      if(!q||!Array.isArray(q.cancel)||!Array.isArray(q.cancel[0]))add('supplier cancel tiers not stored as pairs');
      if(q&&q.real)add('new supplier marked real');}
    PERSIST.find(p=>p.key==='fm-ents').reset();if(SUPPLIERS.length!==n)add('reset did not remove the added supplier');
    const s0=SUPPLIERS[0],o=JSON.stringify(s0);fmOpenState('supplier',s0);formSet('notes.en','Edited in test');formSave();
    if(!SUPPLIERS[0].notes||SUPPLIERS[0].notes.en!=='Edited in test')add('supplier edit not applied');
    PERSIST.find(p=>p.key==='fm-ents').reset();if(JSON.stringify(SUPPLIERS[0])!==o)add('reset did not restore the edited supplier');
  }
  /* activities and hotels live in FM_EXTRA and are cleared by reset */
  fmOpenState('activity',null);Object.entries({name:'Verification Walk',dest,city:'Tulsa',dur:2,cost:20}).forEach(([k,v])=>formSet(k,v));
  const a1=formSave();if(!a1.ok||FM_EXTRA.activity.length!==1)add('activity not stored in FM_EXTRA');
  fmOpenState('hotel',null);Object.entries({name:'Verification Inn',dest,city:'Tulsa',stars:3,rate:120}).forEach(([k,v])=>formSet(k,v));
  const a2=formSave();if(!a2.ok||FM_EXTRA.hotel.length!==1)add('hotel not stored in FM_EXTRA');
  const snap=JSON.stringify(PERSIST.find(p=>p.key==='fm-extra').get());FM_EXTRA.activity=[];FM_EXTRA.hotel=[];PERSIST.find(p=>p.key==='fm-extra').set(JSON.parse(snap));
  if(FM_EXTRA.activity.length!==1||FM_EXTRA.hotel.length!==1)add('FM_EXTRA persist round trip failed');
  PERSIST.find(p=>p.key==='fm-extra').reset();if(FM_EXTRA.activity.length||FM_EXTRA.hotel.length)add('FM_EXTRA reset failed');
  console.log('  forms: schemas',Object.keys(FORM_SCHEMAS).length,'types',Object.keys(FM_TYPES).length,'data arrays',[typeof SUPPLIERS!=='undefined'&&'SUPPLIERS',typeof CLIENTS!=='undefined'&&'CLIENTS',typeof STAFF!=='undefined'&&'STAFF'].filter(Boolean).join('+')||'none');
  S.lang=S0l;S.role=S0r;S.form=null;
  return out;}});
