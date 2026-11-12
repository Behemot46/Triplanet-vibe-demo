/* ---------- boot: runs last, after every module has registered its views ---------- */
{const r0=render;render=function(){r0();try{countUp();meetButton();meetAfter();leadsMenu();}catch(e){if(typeof console!=='undefined')console.error(e);}};}
{const z0=resetDemo;resetDemo=function(){z0();S.lkDim='trip';S.lkSel='';S.gen=null;S.meet=-1;S.acct=null;S.incTab='all';S.incPage=0;};}
/* list screens from s7c_lists.js (product-style tables) */
if(typeof vHotelsList==='function')VIEWS.hotels=vHotelsList;
if(typeof vClients==='function'&&!NAV.some(n=>n[0]==='clients')){VIEWS.clients=vClients;NAV.push(['clients',['לקוחות','Clients'],ic('clients')]);}
TOUR[0].sel='.ptiles';
load();
render();
