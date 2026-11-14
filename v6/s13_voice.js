/* ---------- v8.4 morning brief narration (owner decision 14 Nov 2026: option C, the viewer's built-in Claude voice) ----------
   A "Listen" button on the owner's Home reads a short spoken brief built from the same figures as the hero
   (hcModel: portfolio, leakModel, nextSteps). It uses the claude.ai page capability `tts`, so it exists only when
   the demo is published as a claude.ai page and opened in a Chromium browser or the desktop app. On the offline
   booth file, Safari and the mobile apps the namespace is null and no button is drawn. Scripted text, AI voice:
   never presented as Maya's live answers. Publish the demo with capabilities {downloads:true, tts:{}}. */
let VO=null,VO_STATE='idle';
/* the spoken brief: plain text, no markup, at most ~900 characters (the capability takes up to 2,000) */
function voBrief(){
  const m=hcModel();if(!m.ts.length)return '';
  const {P,M}=m,margin=P.rev?P.fp/P.rev:0,files=m.ts.filter(t=>t.stage!=='Quote').length,nx=m.dep[0];
  const day=TODAY.toLocaleDateString(LOC(),{weekday:'long',day:'numeric',month:'long'});
  const first=String(userName()).split(' ')[0];
  const steps=(m.steps||[]).slice(0,3).map(x=>`${L(x.s.he,x.s.en)} (${x.t.name})`);
  const en=[`Good morning, ${first}. Here is your brief for ${day}.`,
    `This season you booked ${usd(P.rev)} across ${files} files, at ${pct(margin)} expected margin.`,
    `You are keeping ${m.kept} percent of planned profit. ${usd(M.got)} has been recovered from supplier invoices, and ${usd(M.rec)} is still open.`,
    m.urgent?`${m.urgent} urgent ${m.urgent===1?'item needs':'items need'} you today.`:'Nothing urgent today.',
    steps.length?`First on the list: ${steps.join('; ')}.`:'',
    nx?`Your next departure is ${nx.name}, ${hcIn(hcDays(nx.dep))}.`:''].filter(Boolean).join(' ');
  const he=[`בוקר טוב, ${first}. זה הסיכום שלך ל${day}.`,
    `העונה נסגרו ${usd(P.rev)} ב-${files} תיקים, ברווח צפוי של ${pct(margin)}.`,
    `נשמרים ${m.kept} אחוז מהרווח המתוכנן. ${usd(M.got)} כבר הוחזרו מחשבוניות ספקים, ועוד ${usd(M.rec)} פתוחים.`,
    m.urgent?`${m.urgent} דברים דחופים מחכים לך היום.`:'אין היום שום דבר דחוף.',
    steps.length?`ראשונים ברשימה: ${steps.join('; ')}.`:'',
    nx?`היציאה הבאה היא ${nx.name}, ${hcIn(hcDays(nx.dep))}.`:''].filter(Boolean).join(' ');
  /* drop the invisible direction marks that usd()/pct() add for on-screen bidi */
  return L(he,en).replace(/[\u2066-\u2069\u200e\u200f]/g,'');
}
const voOn=()=>!!VO&&isMgr()&&S.tab==='home'&&!S.pv&&!(S.meet>=0);
const voBtn=()=>{const sp=VO_STATE==='speaking';
  return `<button class="hc-btn ghost vo-btn" data-act="vo-play" aria-pressed="${sp}" title="${L('הקראה בקול בינה מלאכותית','Read aloud in an AI voice')}">${ic(sp?'xcircle':'play')} ${sp?L('עצירה','Stop'):L('להאזין לסיכום','Listen to the brief')}</button>`;};
/* inject into the owner hero's buttons only when the voice is available */
{const h0=VIEWS.home;VIEWS.home=function(){const h=h0.apply(this,arguments);if(!voOn())return h;const i=h.indexOf('<div class="hc-cta">');
  return i<0?h:h.slice(0,i+20)+voBtn()+h.slice(i+20);};}
(async()=>{try{if(typeof window!=='undefined'&&window.claude&&typeof window.claude.use==='function'){const t=await window.claude.use('tts');
  if(t){VO=t;try{t.onState(({state})=>{const was=VO_STATE;VO_STATE=state==='speaking'?'speaking':'idle';if(was!==VO_STATE&&voOn())render();});}catch(e){}if(isMgr()&&S.tab==='home')render();}}}catch(e){}})();
if(typeof document!=='undefined'&&document.addEventListener)document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act="vo-play"]');if(!b||!VO)return;
  if(VO_STATE==='speaking'){try{VO.stop();}catch(err){}return;}
  const txt=voBrief();if(!txt)return;
  VO.speak(txt,{language:S.lang==='he'?'he':'en'}).catch(err=>{const c=err&&err.code;if(c==='not_granted'){VO=null;render();}else if(c==='busy')toast(L('ההקראה לא זמינה בזמן הכתבה.','Reading is not available while dictating.'));else if(c==='rate_limited')toast(L('רגע, נסו שוב בעוד כמה שניות.','Please try again in a few seconds.'));});});
if(typeof SPEC!=='undefined'&&SPEC['home:manager']){SPEC['home:manager'].actions.push({label:'Listen to the brief',does:'Reads a short spoken brief aloud in the viewer\'s built-in Claude voice (claude.ai page capability tts)',rule:'Shown only when the voice is available (published page, Chromium or desktop app); hidden offline. Text = voBrief(), same figures as the hero'});
  SPEC['home:manager'].code.push('v6/s13_voice.js: voBrief, voBtn (narration, option C)');}
TESTS.push({name:'vo morning brief narration',run:h=>{const out=[];const r0=S.role;S.role='manager';S.tab='home';
  for(const lang of ['en','he']){S.lang=lang;const t=voBrief();if(!t||/NaN|undefined|null|<|>/.test(t))out.push('brief text '+lang+': '+t.slice(0,80));
    if(t.length>2000)out.push('brief too long '+t.length);if(lang==='en'&&/[֐-׿]/.test(t))out.push('Hebrew in the English brief');
    if(lang==='he'&&!/[֐-׿]/.test(t))out.push('no Hebrew in the Hebrew brief');
    const m=hcModel(),bare=x=>x.replace(/[\u2066-\u2069\u200e\u200f]/g,'');if(!t.includes(bare(usd(m.M.rec)))||!t.includes(bare(usd(m.P.rev))))out.push('brief figures do not match the hero '+lang);}
  S.lang='en';if(VIEWS.home().includes('vo-play'))out.push('button drawn without a voice');
  VO={speak:()=>Promise.resolve(),stop(){},onState(){}};if(!VIEWS.home().includes('vo-play'))out.push('button missing with a voice');
  S.role='accountant';if(VIEWS.home().includes('vo-play'))out.push('button on the accountant home');VO=null;S.role=r0;return out;}});
