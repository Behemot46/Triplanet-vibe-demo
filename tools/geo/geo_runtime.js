function geoViewFor(ids){
  ids=(ids||[]).filter(Boolean);
  const vs=GEO.views;let best=null,ba=1e12;
  for(const k in vs){
    if(k==='usa'||k==='euro')continue;
    if(ids.length&&ids.every(i=>GEO.cities[i]&&GEO.cities[i].p[k])){
      const a=vs[k].w*vs[k].h;
      // smaller geographic span = smaller area; use bbox of the view's lon/lat via cities is unavailable, so use fixed order
      const o=GEO_ORDER.indexOf(k);
      if(o<ba){ba=o;best=k;}
    }
  }
  if(best)return best;
  if(ids.length&&ids.every(i=>GEO.cities[i]&&GEO.cities[i].p.usa))return 'usa';
  return 'euro';
}
const GEO_ORDER=['ontario','levant','italy','greece','isles'];
function geoMap(view,opts){
  opts=opts||{};
  const v=GEO.views[view]||GEO.views.usa;
  if(!GEO.views[view])view='usa';
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const W=v.w,H=v.h,label=opts.label!==false,fs=opts.fs||30,cw=opts.cw||16.5;
  // dedupe consecutive, keep only stops present in the view
  const st=[];
  (opts.stops||[]).forEach(id=>{
    const c=GEO.cities[id];
    if(!c||!c.p[view])return;
    if(st.length&&st[st.length-1]===id)return;
    st.push(id);
  });
  let s='<svg viewBox="0 0 '+W+' '+H+'" class="geo geo-'+view+'" role="img" aria-label="'+esc(opts.ariaLabel||'Map')+'"'+(opts.w?' width="'+opts.w+'"':'')+'>';
  s+='<path class="geo-land" fill-rule="evenodd" d="'+v.land+'"/><path class="geo-line" d="'+v.lines+'"/>';
  const P=st.map(id=>GEO.cities[id].p[view]);
  if(P.length>1){
    let d='M'+P[0][0]+' '+P[0][1];
    for(let i=1;i<P.length;i++){
      const a=P[i-1],b=P[i],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1;
      const sg=i%2?1:-1,o=0.18*L*sg;
      const cx=(a[0]+b[0])/2-dy/L*o,cy=(a[1]+b[1])/2+dx/L*o;
      d+='Q'+cx.toFixed(1)+' '+cy.toFixed(1)+' '+b[0]+' '+b[1];
    }
    s+='<path class="geo-route" d="'+d+'" pathLength="1"/>';
  }
  const placed=[];
  const hit=(r)=>placed.some(q=>r[0]<q[2]&&r[2]>q[0]&&r[1]<q[3]&&r[3]>q[1]);
  const seen={};
  st.forEach((id,i)=>{
    if(seen[id])return;seen[id]=1;
    const c=GEO.cities[id],p=c.p[view];
    const r=opts.numbered?16:13;
    let lbl='';
    if(label){
      const tw=c.n.length*cw,th=fs;
      const cands=[
        ['start',p[0]+r+8,p[1]+fs*.35,[p[0]+r+6,p[1]-th/2-2,p[0]+r+10+tw,p[1]+th/2+2]],
        ['end',p[0]-r-8,p[1]+fs*.35,[p[0]-r-10-tw,p[1]-th/2-2,p[0]-r-6,p[1]+th/2+2]],
        ['middle',p[0],p[1]-r-6,[p[0]-tw/2,p[1]-r-6-th,p[0]+tw/2,p[1]-r-4]],
        ['middle',p[0],p[1]+r+th+3,[p[0]-tw/2,p[1]+r+3,p[0]+tw/2,p[1]+r+th+5]]
      ];
      const ok=b=>b[0]>=2&&b[2]<=W-2&&b[1]>=2&&b[3]<=H-2;
      let ch=cands.find(c2=>ok(c2[3])&&!hit(c2[3]))||cands.find(c2=>ok(c2[3]))||cands[0];
      placed.push(ch[3]);
      lbl='<text class="geo-lbl" x="'+ch[1].toFixed(1)+'" y="'+ch[2].toFixed(1)+'" text-anchor="'+ch[0]+'">'+esc(c.n)+'</text>';
    }
    placed.push([p[0]-r,p[1]-r,p[0]+r,p[1]+r]);
    const num=opts.numbered?'<text class="geo-num" text-anchor="middle" y="1">'+(i+1)+'</text>':'';
    s+='<g class="geo-pin'+(opts.hi===id?' geo-hi':'')+'" transform="translate('+p[0]+' '+p[1]+')"><circle r="'+r+'"/>'+num+lbl.replace(/x="([\d.\-]+)" y="([\d.\-]+)"/,(m,x,y)=>'x="'+(x-p[0]).toFixed(1)+'" y="'+(y-p[1]).toFixed(1)+'"')+'</g>';
  });
  return s+'</svg>';
}
