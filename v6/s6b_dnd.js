/* ---------- trip plan drag and drop (v7.2) ----------
   One pointer-based system for mouse, touch and pen (native HTML5 drag and drop does not work on
   tablets). Sources: a site row (.site[data-item]) or a template card (.tpl[data-tpl]).
   Targets: any day accordion (.acc[data-day]); inside the open day a line shows the exact slot.
   Mouse: press anywhere on the row or card and move 5 px. Touch: drag the grip handle or the
   template photo at once, or long-press anywhere for 300 ms. Hovering a closed day opens it.
   Esc cancels. Every drop saves, opens the target day and flashes what moved. */
const DND={on:false,pend:null,src:null,ghost:null,line:null,tgt:null,hover:null,hoverT:0,raf:0,x:0,y:0,lp:0};
function dndMoveItem(t,id,day,beforeId){
  const a=t.items,i=a.findIndex(x=>x.id===id);if(i<0)return null;const it=a.splice(i,1)[0];it.day=day;
  let j=beforeId!=null?a.findIndex(x=>x.id===beforeId):-1;
  if(j<0){let last=-1;a.forEach((x,k)=>{if(x.day===day)last=k;});j=last<0?a.length:last+1;}
  a.splice(j,0,it);return it;
}
function dndAddTpl(t,idx,day,beforeId){
  const tp=allTpl()[idx];if(!tp)return 0;let id=Math.max(0,...t.items.map(i=>i.id));
  const add=tp.items.map(x=>({id:++id,name:x[0],hrs:x[1],day}));
  let j=beforeId!=null?t.items.findIndex(x=>x.id===beforeId):-1;
  if(j<0){let last=-1;t.items.forEach((x,k)=>{if(x.day===day)last=k;});j=last<0?t.items.length:last+1;}
  t.items.splice(j,0,...add);return add.length;
}
const dndDayName=d=>d===0?L('לא משובץ','Unscheduled'):L('יום ','Day ')+d;
function dndSrcOf(el){
  if(!el||!el.closest||S.tab!=='trip'||S.ptab!=='plan')return null;
  if(el.closest('input,select,textarea,button,a'))return null;
  const s=el.closest('.site[data-item]');if(s)return {kind:'item',id:+s.dataset.item,el:s,label:(s.querySelector('.nm')||s).firstChild.textContent.trim()};
  const c=el.closest('.tpl[data-tpl]');if(c)return {kind:'tpl',id:+c.dataset.tpl,el:c,label:(c.querySelector('strong')||c).textContent.trim()};
  return null;
}
function dndStart(){
  const p=DND.pend;DND.pend=null;if(!p)return;DND.on=true;DND.src=p.src;clearTimeout(DND.lp);
  p.src.el.classList.add('dnd-src');document.body.classList.add('dnd');
  const g=document.createElement('div');g.className='dnd-ghost';g.setAttribute('aria-hidden','true');
  g.innerHTML=`${ic(p.src.kind==='tpl'?'templates':'pin')}<span>${esc(p.src.label)}</span>${p.src.kind==='tpl'?`<em>${allTpl()[p.src.id].items.length}</em>`:''}`;
  document.body.appendChild(g);DND.ghost=g;
  const ln=document.createElement('div');ln.className='dnd-line';document.body.appendChild(ln);DND.line=ln;
  try{navigator.vibrate&&navigator.vibrate(12);}catch(e){}
  dndTrack(p.x,p.y);DND.raf=requestAnimationFrame(dndScroll);
}
function dndTrack(x,y){
  DND.x=x;DND.y=y;if(!DND.on)return;
  DND.ghost.style.transform=`translate(${x+14}px,${y+12}px)`;
  const el=document.elementFromPoint(x,y),inBar=el&&el.closest&&el.closest('.topbar,.meet,.chen,.chenfab');let acc=!inBar&&el&&el.closest&&el.closest('.acc[data-day]');
  /* the gaps between day cards snap to the nearest day, so a thumb never lands on a dead zone */
  if(!acc&&!inBar){let best=null,bd=18;document.querySelectorAll('.acc[data-day]').forEach(a=>{const r=a.getBoundingClientRect();if(x<r.left||x>r.right)return;const d=y<r.top?r.top-y:y>r.bottom?y-r.bottom:0;if(d<bd){bd=d;best=a;}});acc=best;}
  document.querySelectorAll('.acc.over').forEach(a=>{if(a!==acc)a.classList.remove('over');});
  DND.line.style.display='none';
  if(!acc){DND.tgt=null;DND.hover=null;return;}
  acc.classList.add('over');const day=+acc.dataset.day;let before=null;
  const rows=[...acc.querySelectorAll('.bd .site[data-item]')].filter(r=>!(DND.src.kind==='item'&&+r.dataset.item===DND.src.id));
  if(rows.length&&acc.querySelector('.bd')){
    let after=null;for(const r of rows){const b=r.getBoundingClientRect();if(y<b.top+b.height/2){before=+r.dataset.item;break;}after=r;}
    const ref=before!=null?rows.find(r=>+r.dataset.item===before):after,b=ref.getBoundingClientRect();
    const ly=before!=null?b.top-1:b.bottom-1;Object.assign(DND.line.style,{display:'block',left:b.left+'px',width:b.width+'px',top:ly+'px'});
  }
  DND.tgt={day,before};
  /* spring-loaded: hovering a closed day for 550 ms opens it */
  if(!acc.querySelector('.bd')&&!DND.scrolling){if(DND.hover!==day){DND.hover=day;DND.hoverT=Date.now();}
    else if(Date.now()-DND.hoverT>550&&S.openDay!==day){S.openDay=day;render();DND.src.el=document.querySelector(DND.src.kind==='item'?`.site[data-item="${DND.src.id}"]`:`.tpl[data-tpl="${DND.src.id}"]`)||DND.src.el;DND.src.el.classList.add('dnd-src');dndTrack(x,y);}}
  else DND.hover=null;
}
function dndScroll(){
  if(!DND.on)return;const m=64,y=DND.y,h=innerHeight;
  /* gentle edge scroll: speed grows with how deep the pointer is in the 64 px edge band, at most ~9 px a frame */
  const k=y<m?-(m-Math.max(y,0))/m:y>h-m?(Math.min(y,h)-(h-m))/m:0;
  DND.scrolling=!!k;if(k){DND.hover=null;window.scrollBy(0,Math.round(Math.sign(k)*(1+8*k*k)));dndTrack(DND.x,DND.y);}
  DND.raf=requestAnimationFrame(dndScroll);
}
function dndEnd(drop){
  clearTimeout(DND.lp);DND.pend=null;if(!DND.on)return;DND.on=false;cancelAnimationFrame(DND.raf);
  const src=DND.src,tg=DND.tgt;DND.ghost&&DND.ghost.remove();DND.line&&DND.line.remove();DND.ghost=DND.line=null;DND.src=null;DND.tgt=null;DND.hover=null;
  document.body.classList.remove('dnd');document.querySelectorAll('.acc.over,.dnd-src').forEach(e=>e.classList.remove('over','dnd-src'));
  DND.justEnded=Date.now();
  const t=T();if(!drop||!tg||!t)return;
  if(src.kind==='item'){const it=t.items.find(i=>i.id===src.id);const from=it&&it.day;if(!it||(from===tg.day&&tg.before===null&&t.items.filter(i=>i.day===from).slice(-1)[0]===it))return;
    dndMoveItem(t,src.id,tg.day,tg.before);S.openDay=tg.day;save();render();dndFlash([src.id]);
    toast(from===tg.day?L(`הסדר ב${dndDayName(tg.day)} עודכן`,`Order updated in ${dndDayName(tg.day)}`):L(`"${src.label}" הועבר ל${dndDayName(tg.day)}`,`Moved "${src.label}" to ${dndDayName(tg.day)}`));}
  else{const n0=Math.max(0,...t.items.map(i=>i.id)),n=dndAddTpl(t,src.id,tg.day,tg.before);if(!n)return;S.openDay=tg.day;save();render();
    dndFlash([...Array(n).keys()].map(k=>n0+1+k));toast(L(`התבנית נוספה ל${dndDayName(tg.day)}: ${n} אתרים`,`Template added to ${dndDayName(tg.day)}: ${n} sites`));}
}
function dndFlash(ids){requestAnimationFrame(()=>ids.forEach(id=>{const r=document.querySelector(`.site[data-item="${id}"]`);if(r){r.classList.add('just');if(id===ids[0])r.scrollIntoView({block:'nearest',behavior:'smooth'});}}));}
document.addEventListener('pointerdown',e=>{
  if(e.button>0||DND.on)return;const src=dndSrcOf(e.target);if(!src)return;
  const grip=e.target.closest('.grip,.tpl .im');
  DND.pend={src,x:e.clientX,y:e.clientY,type:e.pointerType};
  if(e.pointerType!=='mouse'){if(grip){e.preventDefault();dndStart();}else DND.lp=setTimeout(()=>{if(DND.pend)dndStart();},300);}
});
document.addEventListener('pointermove',e=>{
  if(DND.on){e.preventDefault();dndTrack(e.clientX,e.clientY);return;}
  const p=DND.pend;if(!p)return;const d=Math.hypot(e.clientX-p.x,e.clientY-p.y);
  if(p.type==='mouse'){if(d>5){p.x=e.clientX;p.y=e.clientY;dndStart();}}else if(d>8){clearTimeout(DND.lp);DND.pend=null;}
});
document.addEventListener('pointerup',()=>dndEnd(true));
document.addEventListener('pointercancel',()=>dndEnd(false));
document.addEventListener('touchmove',e=>{if(DND.on)e.preventDefault();},{passive:false});
document.addEventListener('keydown',e=>{if(DND.on&&e.key==='Escape'){e.stopPropagation();dndEnd(false);toast(L('הגרירה בוטלה','Drag canceled'));}},true);
/* a drag must not also count as a click on the row's controls */
document.addEventListener('click',e=>{if(DND.justEnded&&Date.now()-DND.justEnded<250){e.stopPropagation();e.preventDefault();}},true);
/* no native image or text drag inside the plan */
document.addEventListener('dragstart',e=>{if(e.target.closest&&e.target.closest('.site,.tpl'))e.preventDefault();});
