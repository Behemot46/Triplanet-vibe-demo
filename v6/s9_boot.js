/* ---------- boot: runs last, after every module has registered its views ---------- */
{const r0=render;render=function(){r0();try{countUp();meetButton();meetAfter();leadsMenu();}catch(e){if(typeof console!=='undefined')console.error(e);}};}
{const z0=resetDemo;resetDemo=function(){z0();S.lkDim='trip';S.lkSel='';S.gen=null;S.meet=-1;S.acct=null;S.incTab='all';S.incPage=0;};}
/* list screens from s7c_lists.js (product-style tables) */
if(typeof vHotelsList==='function')VIEWS.hotels=vHotelsList;
if(typeof vClients==='function'&&!NAV.some(n=>n[0]==='clients')){VIEWS.clients=vClients;NAV.push(['clients',['לקוחות','Clients'],ic('clients')]);}
TOUR[0].sel='.ptiles';
/* v8: per-trip initializers run after brandSwap: at boot, after load, after reset and on new trips */
function runTripInit(){TRIPS.forEach((t,i)=>TRIP_INIT.forEach(f=>{try{f(t,i);}catch(e){if(typeof console!=='undefined')console.error(e);}}));}
{const z1=resetDemo;resetDemo=function(){z1();runTripInit();};}
if(typeof winQuote==='function'){const w0=winQuote;winQuote=function(){const r=w0.apply(this,arguments);runTripInit();return r;};}
if(typeof blankQuote==='function'){const b0=blankQuote;blankQuote=function(){const r=b0.apply(this,arguments);runTripInit();return r;};}
/* v8.4: finance-stage trip tabs need fin.view (the operations coordinator does not have it) */
{const v0=vTrip;vTrip=function(){const t=T();if(t&&typeof can==='function'&&!can('fin.view')&&stageOf(S.ptab)==='f')return noAccess(L('כספי הטיול','Trip finance'));return v0.apply(this,arguments);};}
/* v8: permission-gated pages */
Object.keys(NAV_PERM).forEach(k=>{const v0=VIEWS[k];if(v0)VIEWS[k]=function(){return typeof can==='function'&&!can(NAV_PERM[k])?noAccess():v0.apply(this,arguments);};});
runTripInit();
load();
render();
