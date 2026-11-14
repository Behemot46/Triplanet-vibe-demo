/* ---------- Maya, always at hand (v7.2) ----------
   - a face: AI-generated headshot (AVATARS.Maya) with an "AI" badge, so she is never mistaken for staff;
   - one proactive tip per page, computed from the data on screen (scripted logic, never labeled live);
     on the trip plan she can fix an overloaded day herself with one tap;
   - "/" or Ctrl/Cmd+K opens her from anywhere; her suggested questions follow the page.
   Tips stay off in meeting mode, the guided tour, the kiosk attract screen and while her panel is open. */
const MAYA={key:'',shown:{},el:null,tmr:0,hide:0,cur:null};
const mayaImg=()=>typeof AVATARS!=='undefined'&&AVATARS.Maya?AVATARS.Maya:'';
chenAv=(sz)=>{const u=mayaImg(),s=sz||30;return u?`<span class="chenav ph${s>=28?' big':''}" style="width:${s}px;height:${s}px"><img src="${u}" alt="" width="${s}" height="${s}">${s>=28?`<i class="ai">AI</i>`:''}</span>`:`<span class="chenav" style="width:${s}px;height:${s}px">${L('מ','M')}</span>`;};
const mayaQn=id=>QS[id-1]?L(QS[id-1].he,QS[id-1].en):'';
function mayaPlanFix(t){
  if(!t||!t.items)return null;const days=[...Array(t.nights+1).keys()].map(k=>k+1);
  const over=days.map(d=>[d,dayHours(t,d)]).filter(x=>x[1]>9).sort((a,b)=>b[1]-a[1])[0];if(!over)return null;
  const its=t.items.filter(i=>i.day===over[0]).sort((a,b)=>b.hrs-a.hrs);
  /* nearest day that fits wins; arrival and departure days only as a last resort */
  const last=days.length,edge=d=>d===1||d===last?1:0;
  const tg=days.filter(d=>d!==over[0]).map(d=>[d,dayHours(t,d)]).sort((a,b)=>edge(a[0])-edge(b[0])||Math.abs(a[0]-over[0])-Math.abs(b[0]-over[0])||a[1]-b[1]);
  for(const it of its)for(const [d,h] of tg)if(h+it.hrs<=9&&over[1]-it.hrs<over[1])return {it,from:over[0],to:d,fromH:over[1],toH:h};
  return null;
}
function mayaTip(){
  const t=T(),vt=visibleTrips();
  if(S.tab==='trip'&&t&&S.ptab==='plan'){const f=mayaPlanFix(t);if(!f)return null;
    return {k:'plan:'+t.id+':'+f.it.id+':'+f.to,txt:L(`יום ${f.from} עמוס: ${f.fromH} שעות. להעביר את "${f.it.name}" (${hrsL(f.it.hrs)}) ליום ${f.to}, שיש בו ${f.toH} שעות?`,`Day ${f.from} is overloaded at ${f.fromH} hours. Move "${f.it.name}" (${hrsL(f.it.hrs)}) to Day ${f.to}, which has ${f.toH} hours?`),
      act:'mayafix',v:`${f.it.id}|${f.to}`,lab:L('להעביר','Move it')};}
  if(S.tab==='home'){const G=gapStats(vt),n=G.openN+G.dispN;if(!n)return null;return {k:'home',txt:L(`יש ${n} פערי חשבוניות פתוחים בסך ${usd(r2(G.open+G.disp))}. להציג את הרשימה?`,`You have ${n} open invoice gaps worth ${usd(r2(G.open+G.disp))}. Want the list?`),act:'ask',v:1,lab:L('הצג','Show me')};}
  if(S.tab==='gaps')return {k:'gaps',txt:L('רוצים לראות איזה ספק מחייב ביתר הכי הרבה?','Want to see which supplier overbills you the most?'),act:'ask',v:2,lab:L('הצג','Show me')};
  if(S.tab==='leaks'&&QS[25])return {k:'leaks',txt:L('אפשר לפרק את הדליפה לפי סוכן. להראות מי מדליף הכי הרבה?','I can break the leak down by agent. See who leaks the most?'),act:'ask',v:26,lab:L('הצג','Show me')};
  if(S.tab==='finance'){const P=portfolio(vt);if(!P.lateN)return null;return {k:'fin',txt:L(`${P.lateN} קבוצות מאחרות בתשלום, ${usd(P.late)} בסך הכל. להציג?`,`${P.lateN} groups are late paying, ${usd(P.late)} in total. Want the list?`),act:'ask',v:11,lab:L('הצג','Show me')};}
  if(S.tab==='quotes')return {k:'quotes',txt:L('יש הצעות שמחכות ללקוח יותר משבועיים. להציג?','Some quotes have waited more than two weeks for the client. Want them?'),act:'ask',v:15,lab:L('הצג','Show me')};
  if(S.tab==='studio')return {k:'studio',txt:L('אפשר גם לבקש ממני: "'+mayaQn(24)+'"','You can also just ask me: "'+mayaQn(24)+'"'),act:'ask',v:24,lab:L('נסו','Try it')};
  if(S.tab==='books'&&QS[27])return {k:'books',txt:L('רוצים לדעת מה יובא ממערכת הנהלת החשבונות?','Want to know what we imported from your accounting system?'),act:'ask',v:28,lab:L('הצג','Show me')};
  return null;
}
const mayaQuiet=()=>!document.querySelector||S.chen||S.gs||S.form||S.tab==='home'||S.tab==='ai'||(S.tour!=null&&S.tour>=0)||S.meet>=0||document.getElementById('attract')||document.body.classList.contains('dnd');
function mayaHide(){clearTimeout(MAYA.hide);if(MAYA.el){MAYA.el.remove();MAYA.el=null;}MAYA.cur=null;}
function mayaShow(tip){
  mayaHide();if(mayaQuiet())return;MAYA.cur=tip;MAYA.shown[tip.k]=1;
  const d=document.createElement('div');d.className='maya-nudge';d.setAttribute('role','status');
  d.innerHTML=`<button class="mn-x" data-act="mayanx" aria-label="${L('סגור','Close')}">${ic('x')}</button><div class="mn-h">${chenAv(28)}<span><strong>${L('מאיה','Maya')}</strong><small>${L('טיפ מהנתונים שלכם','A tip from your data')}</small></span></div><p>${esc(tip.txt)}</p><div class="mn-a"><button class="btn sm pri" data-act="${tip.act}" data-v="${tip.v}">${tip.lab}</button><button class="btn sm" data-act="mayanx">${L('לא עכשיו','Not now')}</button></div>`;
  document.body.appendChild(d);MAYA.el=d;MAYA.hide=setTimeout(mayaHide,16000);
}
function mayaSchedule(){
  if(!document.querySelector)return;const t=T();const key=[S.tab,S.ptab,t&&t.id,S.lang].join('|');
  if(MAYA.cur&&MAYA.el&&!mayaQuiet()){if(!document.body.contains(MAYA.el))document.body.appendChild(MAYA.el);}
  if(mayaQuiet())mayaHide();
  if(key===MAYA.key)return;MAYA.key=key;clearTimeout(MAYA.tmr);mayaHide();
  MAYA.tmr=setTimeout(()=>{const tip=mayaTip();if(tip&&!MAYA.shown[tip.k])mayaShow(tip);},1400);
}
/* the floating button: her face, an online dot and the shortcut hint */
function mayaFab(){
  if(!document.querySelector)return;const b=document.querySelector('.chenfab');if(!b||b.dataset.m)return;b.dataset.m='1';
  b.setAttribute('aria-label',trHe(L('שאלו את מאיה (/)','Ask Maya (/)')));b.dataset.tip=trHe(L('שאלו את מאיה (/)','Ask Maya (/)'));
  const s=b.querySelector('span:not(.chenav)');if(s)s.innerHTML=`${L('שאלו את מאיה','Ask Maya')}<kbd>/</kbd>`;
}
{const r0=render;render=function(){r0();try{mayaFab();mayaSchedule();}catch(e){}};}
/* actions: run a tip, apply the plan fix, dismiss */
document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('[data-act="mayanx"],[data-act="mayafix"],.maya-nudge [data-act="ask"]');if(!b)return;
  const a=b.dataset.act;if(a==='mayanx'){mayaHide();return;}
  if(a==='mayafix'){e.stopPropagation();const [id,to]=b.dataset.v.split('|').map(Number),t=T(),it=t&&t.items.find(i=>i.id===id);mayaHide();if(!it)return;const from=it.day;
    dndMoveItem(t,id,to,null);S.openDay=to;
    S.chat.push({r:'a',t:L(`העברתי את "${it.name}" מיום ${from} ליום ${to}. ביום ${from} נשארו ${dayHours(t,from)} שעות, וביום ${to} יש עכשיו ${dayHours(t,to)}.`,`I moved "${it.name}" from Day ${from} to Day ${to}. Day ${from} is now ${dayHours(t,from)} hours and Day ${to} is ${dayHours(t,to)}.`)});
    save();render();dndFlash([id]);toast(L(`מאיה העבירה את "${it.name}" ליום ${to}`,`Maya moved "${it.name}" to Day ${to}`));return;}
  /* a tip's question opens her panel with the answer */
  S.chen=true;mayaHide();
},true);
/* "/" or Ctrl/Cmd+K opens Maya with the cursor in her box */
document.addEventListener('keydown',e=>{
  const typing=e.target&&e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]');
  if(((e.key==='/'&&!typing)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&!(S.meet>=0)&&!document.getElementById('attract')){
    e.preventDefault();if(S.tab==='ai'){const i=document.querySelector('[data-form="ask"] input');if(i)i.focus();return;}
    S.chen=true;mayaHide();render();const i=document.querySelector('.chen [data-form="ask"] input');if(i)i.focus();}
});
/* her suggested questions follow the page */
{const c0=chenSuggest;chenSuggest=function(){const t=T();let ids=null;
  if(S.tab==='trip'&&t&&S.ptab==='plan')ids=[19,22,15,24];
  else if(S.tab==='leaks')ids=QS[26]?[26,27,9,1]:null;
  else if(S.tab==='studio')ids=[24,25,23,9];
  else if(S.tab==='books')ids=QS[27]?[28,1,10,3]:null;
  return ids?ids.map(i=>QS[i-1]).filter(Boolean):c0();};}
