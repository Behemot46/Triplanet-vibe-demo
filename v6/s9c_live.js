/* ---------- Maya live mode (pilot): typed questions answered by Claude ----------
   - The ready-made question buttons stay scripted, so meeting mode is predictable.
   - A typed question goes to the Claude API (Messages, streaming) with a snapshot of the
     demo's current data, and the answer streams into the chat.
   - The API key is entered on the booth laptop (settings menu > Maya live answers) and kept in
     that browser's localStorage only. It is never in the repo or the HTML file.
   - No key, offline, an error, a refusal or no first word within 25 s: Maya gives the scripted
     answer instead and says so in a small note. */
const LIVE_KEY='triplanet-maya-live',LIVE_MODEL='claude-opus-5-5',LIVE_URL='https://api.anthropic.com/v1/messages';
const liveCfg=()=>{try{return JSON.parse(localStorage.getItem(LIVE_KEY)||'{}');}catch(e){return {};}};
const liveSave=c=>{try{localStorage.setItem(LIVE_KEY,JSON.stringify(c));return true;}catch(e){return false;}};
const liveReady=()=>{const c=liveCfg();return !!(c.on&&c.key&&typeof fetch==='function'&&(typeof navigator==='undefined'||navigator.onLine!==false));};
let LIVE_BUSY=false;
const liveHeaders=k=>({'content-type':'application/json','x-api-key':k||'','anthropic-version':'2026-10-21','anthropic-beta':'server-side-fallback-2026-07-01','anthropic-dangerous-direct-browser-access':'true'});

/* the agency's data as Maya sees it: plain JSON, USD, fictional agency, demo "today" */
function liveSnapshot(){
  const ts=visibleTrips(),M=leakModel(ts),r=x=>Math.round(x);
  const trips=ts.map(t=>{const c=calc(t),g=groupsCalc(t),gaps=tripGaps(t).filter(x=>x.usd>0&&isOpenGap(x.s));
    return {id:t.id,no:t.no,name:t.name,stage:t.stage,agent:agn(t.agent),group_type:t.seg,client:t.client,destination:t.dest,departs:t.dep,nights:t.nights,travelers:t.pax,
      revenue:r(c.rev),planned_profit:r(c.planProfit),expected_profit:r(c.fcProfit),planned_margin_pct:c.rev?+(c.planProfit/c.rev*100).toFixed(1):0,expected_margin_pct:c.rev?+(c.fcProfit/c.rev*100).toFixed(1):0,
      open_gaps:gaps.length,open_gap_usd:r(gaps.reduce((s,x)=>s+x.usd,0)),client_payments_late_usd:r(g.late||0),client_outstanding_usd:r(g.outstanding||0),
      tasks_open:t.tasks.filter(x=>!x.done).map(x=>({task:x.t,owner:x.who,due:x.due})).slice(0,6),
      suppliers_not_confirmed:(t.sups||[]).filter(s=>s.st!=='Confirmed').map(s=>s.n)};});
  const gaps=[];ts.forEach(t=>tripGaps(t).forEach(x=>{if(!(x.usd>0)||!isOpenGap(x.s))return;gaps.push({trip:t.name,supplier:x.l.sup,line:x.l.name,kind:x.s.kind,usd:r(x.usd),status:x.s.st});}));
  return {agency:AGENCY+' (fictional demo agency, Tulsa OK)',today:iso(TODAY),currency:'USD',
    season:{trips_booked:M.n,travelers:M.pax,revenue:r(M.rev),planned_profit:r(M.pp),expected_profit:r(M.fp),leaked:r(M.leak),recoverable_now:r(M.rec),recovered_from_suppliers:r(M.got),
      at_risk:{unreleased_block_rooms_usd:r(M.release),late_client_payments_usd:r(M.late),missing_supplier_invoices:M.missing,supplier_commission_not_collected_usd:r(M.comm)}},
    leak_by_kind:Object.fromEntries(Object.entries(M.steps).filter(([,v])=>v.n).map(([k,v])=>[k,{usd:r(v.amt),lines:v.n}])),
    open_invoice_gaps:gaps,trips};
}
function liveSystem(){
  return [
`You are Maya, the assistant inside Triplanet, software for US group tour operators. You are running in a trade-show booth demo.
Rules:
- Answer only from the JSON data below. If the data does not hold the answer, say so in one sentence and suggest a question it can answer.
- The agency, its trips, agents and clients are fictional demo data. Never present them as a real company.
- Hotel, venue and airline brands in the data are real companies. Never connect a real brand with a gap, overbilling, a dispute, lateness or any negative claim. Gaps belong to the suppliers named in open_invoice_gaps only.
- Money is USD. Round to whole dollars and write amounts like $1,234. "today" is the demo date in the data, not the real date.
- Keep it short: at most 4 sentences or 5 short lines. Plain text only, no markdown, no tables, no headings.
- Do not invent features. Triplanet can check supplier bills against the quote, draft a dispute email, track leaks by trip, agent, group type and supplier, and sync with accounting systems (pilot).
- Off-topic, personal or unsafe requests: decline in one sentence and steer back to the agency's numbers.`,
    'DATA (JSON):\n'+JSON.stringify(liveSnapshot())];
}
/* recent turns, so follow-up questions work. Scripted and live turns both count. */
function liveHistory(){
  const out=[];S.chat.slice(0,-2).slice(-8).forEach(x=>{const role=x.r==='u'?'user':'assistant',t=String(x.t||'').trim();if(!t||x.live==='wait')return;
    if(out.length&&out[out.length-1].role===role)out[out.length-1].content+='\n'+t;else out.push({role,content:t});});
  while(out.length&&out[0].role!=='user')out.shift();
  if(out.length&&out[out.length-1].role==='user')out.pop();
  return out;
}
function liveBubble(m){
  if(!document.querySelectorAll)return;const all=document.querySelectorAll('.cb .msg.a, .chat .msg.a');const el=all[all.length-1];if(!el)return;
  const w=el.querySelector('.who');el.innerHTML=(w?w.outerHTML:'')+esc(m.t)+(m.live==='stream'?'<span class="lv-caret" aria-hidden="true"></span>':'');
  const c=el.closest('.cb');if(c)c.scrollTop=c.scrollHeight;
}
async function liveAsk(m,txt){
  const cfg=liveCfg(),lang=S.lang;LIVE_BUSY=true;
  const ctl=new AbortController(),first=setTimeout(()=>{if(!m.t||m.live==='wait')ctl.abort();},25000),hard=setTimeout(()=>ctl.abort(),60000);
  const [rules,data]=liveSystem();
  const body={model:LIVE_MODEL,max_tokens:8000,stream:true,output_config:{effort:'low'},fallbacks:'default',
    system:[{type:'text',text:rules},{type:'text',text:data,cache_control:{type:'ephemeral'}}],
    messages:[...liveHistory(),{role:'user',content:(lang==='he'?'Answer in Hebrew.\n':'Answer in English.\n')+txt}]};
  let stop='',ok=false;
  try{
    const res=await fetch(LIVE_URL,{method:'POST',signal:ctl.signal,headers:liveHeaders(cfg.key),body:JSON.stringify(body)});
    if(!res.ok||!res.body)throw new Error('HTTP '+res.status);
    const rd=res.body.getReader(),dec=new TextDecoder();let buf='';
    for(;;){const {done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});
      let i;while((i=buf.indexOf('\n\n'))>=0){const ev=buf.slice(0,i);buf=buf.slice(i+2);
        const d=ev.split('\n').filter(l=>l.startsWith('data:')).map(l=>l.slice(5).trim()).join('');if(!d)continue;
        let j;try{j=JSON.parse(d);}catch(e){continue;}
        if(j.type==='content_block_delta'&&j.delta&&j.delta.type==='text_delta'){if(m.live==='wait'){m.t='';m.live='stream';}m.t+=j.delta.text;liveBubble(m);}
        else if(j.type==='message_delta'&&j.delta&&j.delta.stop_reason)stop=j.delta.stop_reason;
        else if(j.type==='error')throw new Error((j.error&&j.error.type)||'stream error');}}
    ok=stop!=='refusal'&&m.t.trim().length>0;
  }catch(e){ok=false;m.err=String(e&&e.message||e);}
  clearTimeout(first);clearTimeout(hard);LIVE_BUSY=false;
  if(ok){m.live='done';}
  else{const a=answerText(txt);Object.assign(m,a);m.live='fallback';}
  render();const c=document.querySelector&&document.querySelector('.cb');if(c)c.scrollTop=c.scrollHeight;
}
{const a0=askText;askText=function(txt){
  if(!liveReady()||LIVE_BUSY)return a0(txt);
  const m={r:'a',t:L('מאיה חושבת...','Maya is thinking...'),live:'wait'};S.chat.push({r:'u',t:txt},m);
  setTimeout(()=>liveAsk(m,txt),0);};}
/* chat log: same markup as before, plus a small source note on live and fallback answers */
chatLog=function(){return S.chat.map(x=>`<div class="msg ${x.r}${x.live==='wait'?' lv-wait':''}">${x.r==='a'?`<div class="who">${chenAv(22)} ${L('מאיה','Maya')}</div>`:''}${esc(x.t)}${x.btn?`<div style="margin-top:8px"><button class="btn sm pri" data-act="${x.btn.act}" data-v="${x.btn.v||''}">${x.btn.label}</button></div>`:''}${x.live==='done'?`<div class="lv-src">${ic('sparkle')} ${L('תשובה חיה מהנתונים · Claude','Live answer from the data · Claude')}</div>`:x.live==='fallback'?`<div class="lv-src off">${L('אין חיבור כרגע. זו התשובה המוכנה.','No connection right now. This is the ready answer.')}</div>`:''}</div>`).join('');};

/* presenter settings: a card on the Maya page, opened from the settings menu */
function liveCard(){
  const c=liveCfg(),has=!!c.key;
  return `<div class="card lv-card"><div class="row" style="justify-content:space-between;gap:12px;flex-wrap:wrap"><h3 style="margin:0">${L('תשובות חיות של מאיה','Maya live answers')} ${pillF(L('פיילוט','Pilot'),'info')}</h3><button class="btn sm" data-act="livecfg">${ic('close')} ${L('סגירה','Close')}</button></div>
   <p class="small muted">${L('שאלה מוקלדת נענית על ידי Claude מתוך נתוני הדמו. כפתורי השאלות המוכנות נשארים בתסריט. המפתח נשמר בדפדפן של המחשב הזה בלבד.','A typed question is answered by Claude from the demo data. The ready-made question buttons stay scripted. The key is kept in this laptop\'s browser only.')}</p>
   <form class="row lv-f" data-form="livekey"><input type="password" name="key" autocomplete="off" placeholder="${has?L('מפתח שמור. הדביקו כדי להחליף','Key saved. Paste to replace'):L('מפתח API של Anthropic','Anthropic API key')}" aria-label="${L('מפתח API','API key')}"><button class="btn pri" type="submit">${L('שמירה','Save')}</button></form>
   <div class="row" style="gap:8px;flex-wrap:wrap;margin-top:10px"><label class="lv-tg"><input type="checkbox" data-ch="liveon" ${c.on?'checked':''} ${has?'':'disabled'}> ${L('להפעיל תשובות חיות','Use live answers')}</label>${has?`<button class="btn sm" data-act="livetest">${L('בדיקת חיבור','Test connection')}</button><button class="btn sm" data-act="liveforget">${L('מחיקת המפתח','Forget key')}</button>`:''}<span class="small muted" id="livestat">${S.liveStat||''}</span></div></div>`;
}
{const v0=VIEWS.ai;VIEWS.ai=function(){let h=v0();const live=liveReady();
  h=h.replace(/<span class="pill teal">[^<]*<\/span>/,live?pillF(L('תשובות חיות · Claude','Live answers · Claude'),'green'):pillF(L(`תסריט מוכן: ${QS.length} שאלות`,`Scripted: ${QS.length} questions`),'teal'));
  return S.liveCfg?h.replace('<div class="qgs sec">',liveCard()+'<div class="qgs sec">'):h;};}
function liveMenu(){
  if(!document.querySelector)return;const m=document.querySelector('.menu');if(!m||m.querySelector('[data-act="livecfg"]'))return;
  const b=document.createElement('button');b.setAttribute('role','menuitem');b.dataset.act='livecfg';b.innerHTML=ic('ai')+' '+trHe(L('תשובות חיות של מאיה','Maya live answers'));
  m.insertBefore(b,m.querySelector('[data-act="reset"]'));
}
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='livecfg'){S.liveCfg=!S.liveCfg;S.menu=false;if(S.liveCfg)S.tab='ai';render();}
  else if(a==='liveforget'){liveSave({});S.liveStat=L('המפתח נמחק.','Key removed.');render();}
  else if(a==='livetest'){const el=document.getElementById('livestat');if(el)el.textContent=trHe(L('בודק...','Testing...'));
    fetch(LIVE_URL,{method:'POST',headers:liveHeaders(liveCfg().key),body:JSON.stringify({model:LIVE_MODEL,max_tokens:256,output_config:{effort:'low'},fallbacks:'default',messages:[{role:'user',content:'Reply with OK.'}]})})
      .then(r=>{S.liveStat=r.ok?L('מחובר. מאיה תענה בזמן אמת.','Connected. Maya will answer live.'):L(`החיבור נכשל (${r.status}). בדקו את המפתח.`,`Connection failed (${r.status}). Check the key.`);render();})
      .catch(()=>{S.liveStat=L('אין רשת. מאיה תענה מהתסריט.','No network. Maya will use the ready answers.');render();});}});
document.addEventListener('submit',e=>{const f=e.target;if(!(f.dataset&&f.dataset.form==='livekey'))return;e.preventDefault();
  const k=(new FormData(f).get('key')||'').trim();if(!k)return;const ok=liveSave({key:k,on:true});
  S.liveStat=ok?L('המפתח נשמר במחשב הזה. תשובות חיות פעילות.','Key saved on this laptop. Live answers are on.'):L('לא ניתן לשמור בדפדפן הזה.','This browser cannot store the key.');render();});
document.addEventListener('change',e=>{const el=e.target;if(!(el.dataset&&el.dataset.ch==='liveon'))return;const c=liveCfg();c.on=el.checked;liveSave(c);render();});
{const r0=render;render=function(){r0();try{liveMenu();}catch(e){}};}
