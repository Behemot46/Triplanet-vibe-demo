/* ---------- boot: runs last, after every module has registered its views ---------- */
{const r0=render;render=function(){r0();try{countUp();meetButton();meetAfter();}catch(e){if(typeof console!=='undefined')console.error(e);}};}
{const z0=resetDemo;resetDemo=function(){z0();S.lkDim='trip';S.lkSel='';S.gen=null;S.meet=-1;};}
load();
render();
