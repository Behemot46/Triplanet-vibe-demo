/* ---------- v8.4 deep links: open the demo on a given screen from an outside page (the ideas backlog) ----------
   The hash holds key=value pairs joined by &:
     #v=leaks                      a page (any VIEWS key)
     #role=ops&v=home              view as a role, then a page
     #trip=gc.tfin                 a trip and its tab (PTABS key); #trip=hl.plan&tb=comp picks the plan view
     #pv=leader  /  #pv=guide.pax  a portal and, optionally, its tab
     #lang=he                      language
   Applied once after load() (s9_boot.js) and again on hashchange. Unknown keys and values are ignored, so a bad
   link simply opens the demo where it was. */
const DL_KEYS=['lang','role','v','trip','tb','pv'];
function dlParse(h){const q={};String(h||'').replace(/^#/,'').split('&').forEach(kv=>{const i=kv.indexOf('=');if(i>0){let k=kv.slice(0,i),v=kv.slice(i+1);
  try{k=decodeURIComponent(k);v=decodeURIComponent(v);}catch(e){return;}if(DL_KEYS.includes(k))q[k]=v;}});return q;}
function applyDeepLink(h){
  const q=dlParse(h!=null?h:(typeof location!=='undefined'?location.hash:''));if(!Object.keys(q).length)return false;
  let did=false;
  if(q.lang==='he'||q.lang==='en'){S.lang=q.lang;did=true;}
  if(q.role&&ROLE_KEYS.includes(q.role)){S.pv=null;S.role=q.role;S.fAgent='All';did=true;}
  if(q.v&&VIEWS[q.v]){S.pv=null;S.tab=q.v;did=true;}
  if(q.trip){const [id,pt]=q.trip.split('.'),t=byId(id);
    if(t){S.pv=null;if(!canSee(t))S.role='manager';openTrip(id,pt&&PTABS.some(p=>p[0]===pt)?pt:'general');did=true;}}
  if(q.tb&&typeof TB_VIEWS!=='undefined'&&TB_VIEWS[q.tb]){S.tbView=q.tb;did=true;}
  if(q.pv&&typeof PORTALS!=='undefined'){const [k,tab]=q.pv.split('.');if(PORTALS[k]){pvOpen(k,null,tab);did=true;}}
  if(did){S.menu=false;S.chen=false;S.tour=-1;S.meet=-1;S.drawer=false;}
  return did;
}
if(typeof window!=='undefined'&&window.addEventListener)window.addEventListener('hashchange',()=>{if(applyDeepLink()){try{window.scrollTo(0,0);}catch(e){}render();}});
/* the links the ideas backlog uses; the test opens every one */
const DL_SAMPLES=['v=gaps','trip=gc.tfin','v=leaks','trip=gc.fdash','trip=gc.income','trip=rom.costs','v=books','v=status','v=studio','trip=hl.tbver','trip=hl.plan&tb=comp',
  'trip=hl.plan&tb=day','role=ops&v=home','trip=nas.manifest','trip=bra.odash','pv=leader','pv=traveler','pv=supplier','pv=guide','role=accountant&v=home','v=ai','v=home','lang=he&pv=traveler.pay'];
TESTS.push({name:'dl deep links',run:h=>{const out=[];
  DL_SAMPLES.forEach(s=>{const q=dlParse('#'+s);if(!applyDeepLink('#'+s)){out.push('not applied '+s);return;}
    if(q.v&&S.tab!==q.v)out.push('page '+s);if(q.role&&S.role!==q.role)out.push('role '+s);
    if(q.trip){const [id,pt]=q.trip.split('.');if(S.tab!=='trip'||S.tripId!==id||S.ptab!==pt)out.push('trip '+s);}
    if(q.tb&&S.tbView!==q.tb)out.push('plan view '+s);if(q.pv&&!(S.pv&&S.pv.k===q.pv.split('.')[0]))out.push('portal '+s);
    if(!q.pv&&S.pv)out.push('portal left open '+s);
    try{render();h.chk(h.els.app.innerHTML,'dl '+s);}catch(e){out.push('render '+s+' '+e.message);}
    S.lang='en';S.pv=null;S.role='manager';S.tab='home';});
  if(applyDeepLink('#nothing=1')||applyDeepLink('#trip=zz.tfin')||applyDeepLink('#v=nope'))out.push('a bad link changed the state');
  return out;}});
