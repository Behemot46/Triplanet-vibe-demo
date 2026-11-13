#!/usr/bin/env node
/* Writes docs/handoff/screens.md from the SPEC registry of the built demo.
   Run from the repo root after `python3 build.py`:   node tools/spec/export_spec.js
   It loads v6/triplanet-booth.html in a vm exactly like check6.js, so the Markdown is the same text the developer-notes panel shows.
   It also checks every "Code" pointer (file exists, each named symbol appears in it) and prints warnings. No dependencies. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const root=process.cwd(),html=fs.readFileSync(path.join(root,'v6/triplanet-booth.html'),'utf8');
const js=html.match(/<script>([\s\S]*)<\/script>/)[1];
const els={};
const mk=id=>els[id]||(els[id]={id,innerHTML:'',value:'',style:{},setAttribute(){},textContent:'',classList:{add(){},remove(){}},addEventListener(){},focus(){}});
const ctx={document:{getElementById:mk,addEventListener(){},querySelector(){return null;},querySelectorAll(){return []}},window:{scrollY:0,scrollTo(){},matchMedia:()=>({matches:false})},navigator:{},Intl,console,setTimeout:()=>0,clearTimeout(){}};
ctx.window.window=ctx.window;vm.createContext(ctx);
vm.runInContext(js+';globalThis.__x={SPEC,devMarkdown,NAV,NAV2,PTABS,STAGES,TESTS};',ctx);
const {SPEC,devMarkdown,NAV,NAV2,PTABS,STAGES}=ctx.__x;
const en=a=>Array.isArray(a)?a[1]:a;

/* groups */
const homes=['home:manager','home:accountant','home:agent'];
const navKeys=[...NAV,...NAV2].map(n=>n[0]).filter(k=>k!=='home');
const extraPages=['credits','page:forms','page:uikit'];
const pages=[...navKeys,...extraPages];
const tripTabs=PTABS.map(p=>p[0]).filter(k=>k!=='ops');
const stageOf={};STAGES.forEach(s=>s[2].forEach(t=>{stageOf[t[0]]=en(s[1]);}));
const stageNames=STAGES.map(s=>en(s[1]));
const tripByStage=stageNames.map(n=>[n,tripTabs.filter(k=>stageOf[k]===n).map(k=>'trip:'+k)]);
const odd=tripTabs.filter(k=>!stageOf[k]);if(odd.length)tripByStage.push(['Other',odd.map(k=>'trip:'+k)]);
const overlays=['drawer:supplier','drawer:client','modal:form'];
const listed=new Set([...homes,...pages,...tripByStage.flatMap(x=>x[1]),...overlays]);
const extra=Object.keys(SPEC).filter(k=>!listed.has(k));

const has=k=>!!SPEC[k];
const group=(name,keys)=>({name,keys:keys.filter(k=>true)});
const groups=[
  ['Role homes',homes],
  ['Pages',pages],
  ...tripByStage.map(([n,ks])=>['Trip tabs: '+n,ks]),
  ['Drawers and modals',[...overlays,...extra]]];

const anchor=k=>k.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const titleOf=k=>SPEC[k]?SPEC[k].title:k;
const allKeys=groups.flatMap(g=>g[1]);
const covered=allKeys.filter(has).length;
const pct=Math.round(covered/allKeys.length*100);

const out=[];
out.push('# Screens: developer notes','',
 'Generated from the `SPEC` registry by `node tools/spec/export_spec.js`. Do not edit by hand: edit `v6/s11_spec.js` (global pages, role homes, drawers, modals) or `v6/s11_spec_trip.js` (trip tabs) and run the export again.',
 'The same text shows in the demo: Settings menu, "Show developer notes". API paths are suggestions that follow `docs/backend-plan/03-api.md`; a path marked (proposed) is not in that plan yet.','',
 '## Coverage','',
 '| Group | Screens | With a spec |','|---|---|---|',
 ...groups.map(([n,ks])=>`| ${n} | ${ks.length} | ${ks.filter(has).length} |`),
 `| **Total** | **${allKeys.length}** | **${covered} (${pct}%)** |`,'');
const miss=allKeys.filter(k=>!has(k));
if(miss.length)out.push('Without a spec yet: '+miss.map(k=>'`'+k+'`').join(', '),'');
const st={live:0,pilot:0,roadmap:0};allKeys.filter(has).forEach(k=>{st[SPEC[k].status]++;});
out.push(`Status of the documented screens: ${st.live} Live, ${st.pilot} Pilot, ${st.roadmap} Roadmap (as in \`FEAT\`, \`v6/s9b_status.js\`).`,'');
out.push('## Contents','');
groups.forEach(([n,ks])=>{out.push(`- ${n}`);ks.forEach(k=>out.push(`  - [${titleOf(k)}](#${anchor(k)}) (\`${k}\`)`));});
out.push('');
groups.forEach(([n,ks])=>{
  out.push(`## ${n}`,'');
  ks.forEach(k=>{out.push(`<a id="${anchor(k)}"></a>`,'',devMarkdown(k,3));});
});
fs.mkdirSync(path.join(root,'docs/handoff'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/handoff/screens.md'),out.join('\n').replace(/\n{3,}/g,'\n\n').trimEnd()+'\n');

/* code pointers: "path: Sym, Sym" or "path: text" */
let warn=0;
Object.keys(SPEC).forEach(k=>(SPEC[k].code||[]).forEach(c=>{
  const m=c.match(/^([\w\/.\-]+\.(?:js|css|html)):?\s*(.*)$/);if(!m){console.log('WARN code pointer not parsed',k,c);warn++;return;}
  const f=path.join(root,m[1]);if(!fs.existsSync(f)){console.log('WARN code file missing',k,m[1]);warn++;return;}
  const src=fs.readFileSync(f,'utf8');
  m[2].split(/,|\bor\b/).map(x=>x.trim()).filter(Boolean).forEach(sym=>{
    const id=sym.replace(/\(.*$/,'').replace(/^VIEWS\./,'').split(/\s+/)[0].split('.')[0].replace(/[^\w$]/g,'');
    if(id&&!/^(click|DAYTPL|handler|handlers)$/.test(id)&&!src.includes(id)){console.log('WARN code symbol not found',k,m[1],id);warn++;}});}));
console.log(`screens.md: ${allKeys.length} screens, ${covered} with a spec (${pct}%), ${Object.keys(SPEC).length} registry entries, ${warn} warnings`);
if(miss.length)console.log('missing:',miss.join(', '));
