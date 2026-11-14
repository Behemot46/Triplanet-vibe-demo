# v8 builder brief (read before coding)

You are building one module of the Triplanet booth demo v8. The spec is `docs/spec-v8-parity.md`. Your section is named in your task. Read `CLAUDE.md`, the spec's §1–§2, your section, and the code you extend.

## Ground rules
- Create only your own files: `v6/s10_<code>.js` (or `v6/s1d_data.js`) and `v6/m_<code>.css`. Do not edit any other file. If you need a shared change, write it as a precise patch suggestion in your final report.
- The build already includes your files (see `build.py` JS_ORDER, and every `v6/m_*.css` is inlined after `lists.css`).
- Code style: match the existing dense style (template literals building HTML strings, `L(he,en)` for every visible string, `esc()` for data, `ic('name')` for icons, `pillF(text,cls)` for pills, `usd()/money()/r2()/pct()` for numbers, `fmtDate()` for dates). Prefix every new `data-act`, `data-ch`, `data-in`, `data-form` value with your module code (e.g. `tb-swap`). Prefix CSS classes with your code too (`.tb-…`).
- Hebrew: write real, plain Hebrew for every string (not transliteration). English is the default; `check6.js` must report `LEFTOVER 0` (no Hebrew in English mode) and `bad 0`.
- Logical CSS only (`margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `text-align:start`). Colors only from `var(--token)` in `v6/theme.css`; check night mode (`[data-theme="dark"]`) reads.
- Icons available (only these): home quotes templates hotels suppliers activities users studio leaks gaps finance ai bell settings play present check close x star pin clock danger hourglass pen printer lock mail inbox up down right left restart refresh trendup trenddown magic plane sparkle folder draft ops wallet done bed users2 calendar show museum landmark tour cruise dining park travel hotel meal free search widget checklist document filter chev idcard chart2 clients ticket receipt export link sync cloud card plug invoice tag copy userplus mapsq cash sun moon xcircle trophy grip pinx arrup arrdown flag bus money percent shield.
- Real-brand rule: a real hotel/venue name (CATALOG, or a supplier with `real:true`) never appears next to negative wording (gap, overbilling, dispute, late, slow, poor, risk). Performance metrics only for `real:false` suppliers.
- Never change finance math in `s1_core.js`. The identity `planProfit − amtDiff − fx − fcProfit = 0` must hold for every trip after anything your module does.
- New trip-level fields are optional: always read them with defaults (`t.versions||[]`), because trips created from a blank quote may lack them. If your module adds per-trip data, register an idempotent initializer: `TRIP_INIT.push((t,i)=>{if(!t.x)t.x=…})` and also run it on existing `TRIPS` at load.
- Persist module datasets with `PERSIST.push({key, get, set, reset})`; persist UI state with `Object.assign(S,{…})` + `KEEP.push('key')`.
- Mobile: works at 390 px; wide tables inside `<div class="scroll">`.

## Hooks (already in the code)
- `VIEWS[key]=fn` page; `NAV.push([key,[he,en],ic('icon')])` sidebar item.
- Trip tabs: `PTABS.push([key,[he,en]])`, add `[key,he,en,icon]` to the right stage in `STAGES` (`v6/s7b_product.js`: index 0 Quotation, 1 Operation, 2 Finance), and `TRIP_TABS[key]=t=>html`. In Quote stage, Operation/Finance tabs must render `gate(t, L(...))` like the existing ones.
- `TESTS.push({name, run:h=>[…failure strings]})`. `h.chk(html,label)` flags bad tokens; `h.scan(html,label)` records Hebrew in English mode (call it with `S.lang='en'`); `h.S`, `h.X` (exports). The demo is reset after each test. Your tests must render every new screen/drawer/modal in both languages (`S.lang='en'` then `'he'`) and for at least one agent, the accountant and the manager.
- Roles: `ROLE_KEYS`, `isMgr()`, `isAcct()`, `isAgent()`, `seesAll()`, `userName()`, `noAccess(what)`, `can(perm)` (from `s1d_data.js`).
- Wrapping an existing function: `{const f0=pPlan;pPlan=function(t){…f0(t)…};}` works because callers resolve the name at call time.

## Verify before you finish
1. `python3 build.py && node check6.js 2>&1 | grep -v "^Q[0-9]" | tail -25` → `LEFTOVER 0`, `bad 0`, your `TEST … ok`, and the line `P rev 950103.7 pp 142334.7 fp 138322.99` unchanged.
2. A browser check with Playwright (pre-installed; `require('playwright')`, `chromium.launch()`), loading `file:///…/v6/triplanet-booth.html`: open each new screen in EN and HE, collect `pageerror`/console errors (must be none), and save 1–3 screenshots to `shots/v8-<code>-*.png` (deviceScaleFactor 1). Look at them yourself and fix obvious layout breaks.
3. Commit on your worktree branch with a clear message ending with:
```
Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Fa5Pfjt4ocG3Dc8AEr7AzV
```
Do not push. In your final report: files created, public functions, tests, screenshots paths, anything not done, and any shared-file patch you need.
