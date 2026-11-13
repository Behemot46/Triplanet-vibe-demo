/* ---------- v8.2 fixes: one truth for credits, permissions, stage moves ----------
   gapCredit(l): the single function behind the "Credit received" button. Like the generator's settle(), it marks the
   invoice paid, so realized FX and the AP schedule agree whether a credit was generated or recorded in the UI. */
function gapCredit(l){
  if(!l||!l.inv)return 0;
  const amt=r2(effAmt(l.inv)-planC(l));
  l.inv.credit=r2((l.inv.credit||0)+amt);l.inv.st='credited';l.inv.paid=true;
  return amt;
}

/* ---------- tests ---------- */
const FX_IDN=t=>{const c=calc(t);return Math.abs(c.planProfit-c.amtDiff-c.fx-c.fcProfit)<=0.05;};
TESTS.push({name:'fix credit, permissions, stage moves',run:h=>{
  const out=[],role0=S.role,lang0=S.lang;
  /* 1. enforced list equals the keys the code checks */
  const want=['users.manage','fin.sync','fin.view','prop.approve','fin.issueDocs','settings.edit','settings.stages','price.edit','forms.build','sup.edit','sup.swap','ops.suppliers','cli.edit'];
  if(want.length!==ST_ENFORCED.length||want.some(k=>!ST_ENFORCED.includes(k))||ST_ENFORCED.some(k=>!PERM_BY[k]))out.push('ST_ENFORCED differs from the checked keys');

  /* 2. crediting a gap in the UI marks it paid and keeps the identity */
  {const t=TRIPS.find(x=>x.stage==='Finance'&&tripGaps(x).some(g=>isOpenGap(g.s)));
    if(!t)out.push('no Finance trip with an open gap');
    else{const g=tripGaps(t).find(x=>isOpenGap(x.s)),l=g.l,usd0=g.usd;
      const amt=gapCredit(l);
      if(!l.inv.paid)out.push('credit did not mark the invoice paid');
      if(l.inv.st!=='credited'||invStatus(l).k!=='credited')out.push('credit status '+l.inv.st);
      if(!FX_IDN(t))out.push('identity after credit '+t.id);
      if(Math.abs(amt*lrate(t,l)-usd0)>0.02)out.push(`credit amount ${amt} vs gap ${usd0}`);
      if(tripGaps(t).some(x=>x.l===l&&isOpenGap(x.s)))out.push('gap still open after credit');
      const before=JSON.stringify(l.inv);gapCredit(l);if(JSON.stringify(l.inv)!==before)out.push('second credit changed the invoice');
      /* a generated credited invoice carries the same flags */
      const gen=TRIPS.flatMap(x=>x.lines).find(x=>x.inv&&x.inv.st==='credited'&&x!==l);
      if(gen&&(!gen.inv.paid||gen.inv.st!==l.inv.st))out.push('generated credit differs from UI credit');}}
  resetAfter();

  /* 3. permissions: prop.approve */
  {const q=TRIPS.find(x=>x.stage==='Quote'&&x.qst==='Approval');
    if(!q)out.push('no quote in Approval');
    else{S.tripId=q.id;S.lang='en';
      S.role='manager';if(!pApprove(q).includes('data-v="Sent"'))out.push('owner lacks approve control');
      S.role='Priya';if(pApprove(q).includes('data-v="Sent"'))out.push('agent sees approve control');
      S.perms={agent:{'prop.approve':true}};if(!pApprove(q).includes('data-v="Sent"'))out.push('agent with prop.approve lacks control');
      if(nextSteps(q)[0].k!=='approve')out.push('agent with prop.approve next step');
      const mq=QS.find(x=>/approv/.test(x.en));if(!mq)out.push('no Maya approval question');
      S.role='manager';S.perms=null;if(mq&&!mq.f().btn)out.push('Maya approval answer lacks the button for an approver');
      S.role='Priya';S.perms={agent:{'prop.approve':true}};
      S.perms={owner:{'prop.approve':false}};S.role='manager';
      if(pApprove(q).includes('data-v="Sent"'))out.push('owner without prop.approve sees control');
      if(nextSteps(q)[0].k!=='wait')out.push('owner without prop.approve next step');
      if(mq&&mq.f().btn)out.push('Maya offers approval to a role without prop.approve');
      if(typeof dbApprovalsCard==='function'&&/btn sm pri" data-act="open"[^>]*data-pt="approve"/.test(dbApprovalsCard()))out.push('approvals card still shows Approve');
      S.perms=null;}}
  /* fin.issueDocs */
  {S.role='accountant';S.perms=null;DA_STATE.iss=[];const d=daDocsToIssue();
    if(d.n){if(!daIssue(d.items[0].key)||DA_STATE.iss.length!==1)out.push('accountant cannot issue');DA_STATE.iss=[];
      S.perms={accountant:{'fin.issueDocs':false}};if(daIssue(d.items[0].key)||DA_STATE.iss.length)out.push('issue without fin.issueDocs');
      S.role='Priya';S.perms=null;if(daIssue(d.items[0].key)||DA_STATE.iss.length)out.push('agent issued a document');}
    S.perms=null;DA_STATE.iss=[];
    const tr=TRIPS.find(x=>x.stage==='Finance');S.tripId=tr.id;S.role='accountant';S.lang='en';
    if(/data-act="toast"[^>]*disabled[^>]*>.{0,40}Issue document/.test(pIncome(tr)))out.push('accountant Issue document disabled');
    S.perms={accountant:{'fin.issueDocs':false}};if(!/disabled[^>]*>[^<]*<svg[^>]*>.*?<\/svg> Issue document/s.test(pIncome(tr))&&!/disabled title="Your role cannot issue documents"/.test(pIncome(tr)))out.push('Income issue button not disabled');S.perms=null;}
  /* sup.swap guards tbSwap itself */
  {const t=TRIPS.find(x=>x.stage==='Quote'&&x.lines.some(l=>!l.inv&&altsFor(x,l).length>1));
    if(!t)out.push('no swappable quote');
    else{const l=t.lines.find(x=>!x.inv&&altsFor(t,x).length>1),a=altsFor(t,l).find(x=>!x.inc);
      S.role='manager';S.perms={owner:{'sup.swap':false}};const k0=l.sup;
      const r=tbSwap(t,l.id,a.sup.id);if(r.ok||r.reason!=='perm'||l.sup!==k0)out.push('tbSwap ignored sup.swap');
      S.lang='en';S.tripId=t.id;S.ptab='tbcomp';S.perms=null;
      S.role='accountant';const r2_=tbSwap(t,l.id,a.sup.id);if(r2_.ok||r2_.reason!=='perm')out.push('accountant swapped a supplier');
      S.role='Priya';const r3=tbSwap(t,l.id,a.sup.id);if(!r3.ok)out.push('agent cannot swap by default '+r3.reason);}}
  resetAfter();

  /* 4. stage moves */
  const mk=(st)=>TRIPS.find(x=>x.stage===st);
  {const q=TRIPS.find(x=>isOpenQ(x)&&x.qst==='Draft'),P0=portfolio(TRIPS),T0=dbTeam(),n0=TRIPS.filter(isOpenQ).length;
    if(!q)out.push('no draft quote');
    else{const rev=calc(q).rev;
      if(markLost(mk('Operations')).ok)out.push('markLost on a file');
      const r=markLost(q);if(!r.ok||q.qst!=='Lost'||q.stage!=='Quote')out.push('markLost failed');
      if(markLost(q).ok)out.push('markLost twice');
      const P1=portfolio(TRIPS),T1=dbTeam();
      if(P1.pipelineN!==P0.pipelineN-1||Math.abs(P1.pipeline-(P0.pipeline-rev))>.05)out.push('pipeline still counts a lost quote');
      if(P1.rev!==P0.rev||P1.fp!==P0.fp)out.push('booked totals changed by a lost quote');
      if(T1.openN!==T0.openN-1)out.push('team open quotes count a lost quote');
      if(TRIPS.filter(isOpenQ).length!==n0-1)out.push('isOpenQ');
      if(nextSteps(q).length)out.push('lost quote has next steps');
      if(!FX_IDN(q))out.push('identity lost quote');
      for(const lang of ['en','he']){S.lang=lang;S.role='manager';S.tripId=q.id;
        ['home','quotes'].forEach(v=>{S.tab=v;S.qtab='archive';const html=VIEWS[v]();h.chk(html,'lost '+v+lang);if(lang==='en')h.scan(html,'lost '+v);});
        if(!VIEWS.quotes().includes(q.name))out.push('lost quote missing from Archive '+lang);
        S.qtab='quotes';if(VIEWS.quotes().includes(q.name))out.push('lost quote still under Quotes '+lang);S.qtab='quotes';
        S.tab='trip';S.ptab='general';const html=vTrip();h.chk(html,'lost trip '+lang);if(lang==='en'){h.scan(html,'lost trip');if(!html.includes('Lost'))out.push('Lost label missing');}}}}
  resetAfter();
  /* Operations -> Finance */
  {const o=mk('Operations');
    if(!o)out.push('no Operations trip');
    else{const r=advanceStage(o);if(r.ok||o.stage!=='Operations'||!r.why.length)out.push('moved to finance before return');
      if(!/returns on/.test(r.why[0].en))out.push('why text');
      if(nextSteps(o).some(s=>s.k==='finclose'))out.push('finclose step before return');
      S.lang='en';S.role='manager';S.tripId=o.id;S.ptab='odash';if(vTrip().includes('data-act="advance"'))out.push('advance control before return');
      o.dep=addDays(iso(TODAY),-(o.nights+5));
      if(!nextSteps(o).some(s=>s.k==='finclose'&&s.act.a==='advance'))out.push('finclose step after return');
      if(!vTrip().includes('data-act="advance"'))out.push('advance control missing after return');
      const r2=stmGo('advance',o.id);if(!r2||o.stage!=='Finance'||S.ptab!=='fdash')out.push('advance after return (UI handler)');
      if(!FX_IDN(o))out.push('identity after advance');}}
  resetAfter();
  /* Finance -> Closed */
  {const f=TRIPS.find(x=>x.stage==='Finance'&&(stmCheck(x,'close').why.length>=1));
    if(!f)out.push('no blocked Finance trip');
    else{const r=advanceStage(f);if(r.ok||f.stage!=='Finance'||!r.why.length)out.push('closed with blockers');
      S.lang='en';S.role='manager';S.tripId=f.id;S.ptab='fdash';S.pjMenu=true;let html=vTrip();
      if(!/pj-mi off"[^>]*disabled/.test(html)||!html.includes('role="menu"'))out.push('menu not disabled with blockers');
      r.why.forEach(w=>{if(!html.includes(w.en.replace(/&/g,'&amp;')))out.push('blocker not listed: '+w.en);});
      /* resolve through the UI functions, one blocker at a time */
      if((f.inbox||[]).length)applyInbox(f);
      if(advanceStage(f).ok)out.push('closed with open gaps/balance');
      tripGaps(f).filter(x=>isOpenGap(x.s)).forEach(x=>gapCredit(x.l));
      f.groups.forEach(g=>{g.depPaid=true;g.balPaid=true;});
      if(stmCheck(f,'close').why.length)out.push('still blocked: '+JSON.stringify(stmCheck(f,'close').why));
      if(!nextSteps(f).some(s=>s.k==='close'&&s.act.a==='advance'&&s.sev==='todo'))out.push('close-the-file step');
      html=vTrip();if(/pj-mi off"/.test(html))out.push('menu still disabled when clear');
      for(const lang of ['en','he']){S.lang=lang;const hh=vTrip();h.chk(hh,'menu '+lang);if(lang==='en')h.scan(hh,'status menu');}
      S.lang='en';
      const r2=advanceStage(f);if(!r2.ok||f.stage!=='Closed')out.push('close failed when clear');
      if(advanceStage(f).ok)out.push('advanced a closed file');
      if(nextSteps(f).length)out.push('closed file has steps');
      if(!FX_IDN(f))out.push('identity after close');S.pjMenu=false;}}
  resetAfter();
  /* the status menu renders for every stage and role in both languages, closed by default */
  for(const lang of ['en','he'])for(const role of ['manager','accountant','Marcus'])for(const t of [mk('Quote'),mk('Operations'),mk('Finance'),mk('Closed')]){
    S.lang=lang;S.role=role;S.tripId=t.id;S.ptab=stageOf(S.ptab)===(t.stage==='Quote'?'q':t.stage==='Operations'?'o':'f')?S.ptab:(t.stage==='Quote'?'general':t.stage==='Operations'?'odash':'fdash');
    S.pjMenu=false;let html=vTrip();if(html.includes('class="pj-menu"'))out.push('menu open by default');
    S.pjMenu=true;html=vTrip();h.chk(html,`pjmenu ${t.id} ${lang} ${role}`);if(lang==='en')h.scan(html,'pjmenu');
    if(!html.includes('aria-haspopup="menu"'))out.push('menu button aria');S.pjMenu=false;}
  resetAfter();

  /* 5. locked rate */
  {const q=TRIPS.find(x=>x.stage==='Quote'&&x.cur!=='USD'),o=TRIPS.find(x=>x.stage!=='Quote'&&x.cur!=='USD');
    S.lang='en';S.role='manager';
    if(q){S.tripId=q.id;S.ptab='costs';if(!vTrip().includes('data-ch="rate"'))out.push('quote lacks rate input');S.ptab='general';if(!vTrip().includes('data-ch="rate"'))out.push('general lacks rate input');}
    if(o){S.tripId=o.id;for(const pt of ['costs','general']){S.ptab=pt;const html=vTrip();
      if(html.includes('data-ch="rate"'))out.push('rate editable after acceptance '+pt);
      if(!html.includes('Locked at acceptance'))out.push('rate note '+pt);}
      o.wonOn='2026-09-02';S.ptab='general';if(!/Locked when the quote was accepted on [^<]*2026/.test(vTrip()))out.push('rate note with date');
      S.lang='he';if(!vTrip().includes('ננעל כשההצעה אושרה'))out.push('rate note he');S.lang='en';}
    {const w=TRIPS.find(x=>x.stage==='Quote'&&x.cur!=='USD'&&x.qst==='Sent');if(w){winQuote(w);if(w.wonOn!==iso(TODAY))out.push('winQuote wonOn');S.tripId=w.id;S.ptab='general';if(!vTrip().includes('Locked when the quote was accepted on'))out.push('won rate note');}}}
  resetAfter();

  /* 6. receipts */
  {const t=TRIPS.find(x=>x.stage==='Finance');S.tripId=t.id;S.ptab='income';S.role='manager';S.incTab='all';
    S.lang='en';let html=vTrip();if(/Tax invoice/.test(html))out.push('Tax invoice label remains');if(!/>Receipts </.test(html)&&!html.includes('Receipts'))out.push('Receipts tab');if(!html.includes('role="tab"'))out.push('income tabs role');
    S.lang='he';html=vTrip();if(!html.includes('קבלה'))out.push('קבלה label');if(html.includes('חשבונית מס קבלה'))out.push('old he label');S.lang='en';}
  /* tab roles on the stage row */
  {const t=TRIPS[0];S.tripId=t.id;S.ptab='general';S.lang='en';const html=vTrip();
    if(!/class="tabs pj-tabs" role="tablist"/.test(html)||!/role="tab" aria-selected="true" class="on" data-act="pt"/.test(html))out.push('pj-tabs aria');}
  S.role=role0;S.lang=lang0;S.perms=null;S.pjMenu=false;
  return out;
}});
function resetAfter(){try{resetDemo();}catch(e){}S.perms=null;S.pjMenu=false;S.role='manager';S.lang='en';S.tab='home';S.qtab='quotes';}
