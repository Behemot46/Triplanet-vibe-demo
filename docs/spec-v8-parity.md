# v8 spec: closing the gaps between the demo and the product (dev.triplanet.io)

Status: reviewed (independent Sonnet review, 20 findings, all resolved in §A) · 13 Nov 2026 · owner: Gabi · lead: Opus session · builders: Sonnet/Haiku agents

## 0. Goal and boundary

The demo (single HTML file, see `CLAUDE.md`) must show **everything the product shows on dev.triplanet.io, and more**, so it can serve as the full UX spec for the backend plan (`docs/backend-plan/`, branch `claude/fervent-babbage-bkgptx`).

Four owner requests, plus the parity list:
1. **More fictional data**: a real variety of suppliers with alternatives, rate cards, terms and clients.
2. **Form generator**: one schema-driven form engine used for (a) create/edit of every entity and (b) traveler-facing forms (registration, medical/dietary, waiver, rooming preference) built in a form builder. Assumption: "מחולל טפסים" means both. The traveler forms close a gap flagged for US buyers in the 9 Sep walkthrough.
3. **Trip builder beyond the product**: everything the product's Trip Plan has (by-day/by-component views, per-day shared vs per-participant payment tables, day description and photo, save day as template), plus supplier alternatives with live price impact, and quote versions with compare (the product shows "Coming soon").
4. **Tight dashboards** for three roles: owner/manager, accountant (new role), agent. Every number ties to a function that already exists, and is tested.

Parity items the product has and the demo lacks (from `demo_walkthrough.md` 9 Sep, Tech Review 13 Nov):

| # | Product feature | Demo today | v8 module |
|---|---|---|---|
| P1 | Roles & permissions (4 roles, 40 permissions, custom roles) | manager + agents switch, prose permissions | settings |
| P2 | Stages customization | fixed | settings |
| P3 | Proposal formats: Agents Table (pax tiers 10+/15+/25+, FOC, single supplement), PDF, Landing page, public link | PDF-like doc; landing/slideshow "locked" | proposal |
| P4 | Pricing: Overhead and Brokerage Fee (global, shared/per-person) | missing | core + proposal |
| P5 | Supplier management in a trip: Contact / Pending / Approved / Price comparison | Not sent / Sent / Confirmed / No reply | suppliers |
| P6 | Master list: passport fields, custom columns, import/export | room, diet, passport status | ops |
| P7 | Tasks by time windows (~86 tasks), filter by status/owner | 12 tasks | ops |
| P8 | Hotels: room types, blocks calendar | single block bar per trip | suppliers |
| P9 | Create/edit forms for every entity | read-only lists (except quotes) | forms |
| P10 | Client card with finance tab | list only | suppliers (clients) |
| P11 | Trip plan: by components, Global vs per-participant tables, day text/photo, save as template | sites + hours | builder |
| P12 | Versions (product: "Coming soon") | missing | builder |

And beyond the product (US gaps from the walkthrough that the demo should show as the target): organization settings (currency, MM/DD dates, 12h time, sales tax, timezone), supplier rate cards with seasons/pax bands/validity/cancellation/payment terms/W-9/COI, traveler forms.

**Out of scope:** real backend, real email or payment, new photos/avatars (the accountant uses the initial fallback in `avatarOf`), changing `TODAY`, changing existing finance identities.

## A. Binding amendments after the sanity review (these override anything below)

**Foundation (already in the code, lead):**
- A1. `TRIP_INIT` initializers run at boot (`runTripInit()` in `s9_boot.js`), after `load()`, after `resetDemo()`, and after `winQuote`/`blankQuote`. They always run **after `brandSwap`**. They must be idempotent (only fill missing fields) and use their own `rng(seed)`, never a shared generator. Hotel-derived data (blocks) is computed by a function on demand, never stored.
- A2. `NAV_PERM` (in `s3_shell.js`) hides pages a role lacks; the gated views render `noAccess()`. Currently gated: `users→users.manage`, `books→fin.sync`. Settings adds its own gate inside its view (read-only without `settings.edit`). `can()` is defined in `s1e_people.js` and every caller guards with `typeof can==='function'`.
- A3. Trip tabs: call `tabInsert(stage,[key,he,en,icon])` (`s7b_product.js`). It adds to `STAGES` and `PTABS` and sorts by the fixed `TAB_ORDER`: Quotation `general, plan, costs, quote, tbver (Versions), approve`; Operation `odash, optasks (Tasks), spm (Suppliers), manifest (Master list), people, ops`; Finance unchanged. The icon must be one of the brief's icon list. Then set `TRIP_TABS[key]=fn`. **Never** set `TRIP_TABS` for an existing key; wrap the existing function instead. Every new Operation/Finance tab returns `gate(t,label)` for Quote-stage trips. After the ops and sup modules land, the lead relabels `ops` to "Digest & messages" and `people` to "Billing".
- A4. Data module split: `s1d_data.js` (suppliers, rates, alternatives) and `s1e_people.js` (clients, staff, roles, permissions, traveler extras). Both are in `build.py`.

**State and tests (all builders):**
- A5. All new persistent state (templates you save, org settings, perms, custom forms, edited suppliers/clients, versions live on trips) goes through `PERSIST` with a working `reset()`. Not `KEEP` (reset does not clear `KEEP` keys that `S0` lacks). Transient UI state (`S.supId`, `S.form`, `S.tbView`, `S.hSub`, `S.stSub`, `S.tbAlt`) is plain `Object.assign(S,…)` and must default safely. PERSIST keys are prefixed with the module code. No `Date.now()`, no `Math.random()`.
- A6. Every mutation is a **named function** (`tbSwap`, `tbVerSave`, `tbVerRestore`, `spChoose`, `formSave`, `fmPublish`, `opExportCsv`, …). Click handlers only call these. TESTS call them directly, because the check6 vm has no DOM (no `createElement`, `querySelector` returns null, clicks never fire).
- A7. Modals, drawers and sub-views are driven by state and rendered inside `render()` output (wrap `render` or the owning view), so tests can set the state and `h.chk()` the HTML. Inputs inside forms write to a draft object on `input` without re-render; `change`/blur validates and re-renders, then refocuses by element id.
- A8. Every module test renders each new screen, sub-tab, drawer, modal and view mode in **both languages** (set `S.lang` yourself) and for manager, accountant and one agent, calling `h.chk` always and `h.scan` in English. Budget: the whole check run may grow by ≤ 5 s.

**Data rules:**
- A9. Currency: suppliers use only `USD` or the destination's currency (`DESTS[k].cur`). No ILS (HolyLand bills in USD). `altCost` returns the cost in the line's currency (convert with `BASE_RATE` if the supplier's differs). A swap never changes `l.cur` and never touches `t.rate`.
- A10. Real brands (`real:true`): no invented `rating`, no `replyHrs`, `pref` only High or Medium, `docs` null (shown as "On file"), contact "Group sales desk", stars from CATALOG. Amber states, "expiring", "Low", "late", "slow" and performance metrics only for `real:false`. A data test fails if any rendered supplier list/card puts those words within the same table row/card as a catalog name.
- A11. Alternatives coverage applies to **Lodging, Transport, Guide, Meals** per destination, and to air and insurance globally. Activities are exempt (each attraction is its own operator). The incumbent alternative copies the line's own `comm`. `altsFor` synthesizes the incumbent from the line when the supplier is not in `SUPPLIERS` (studio and blank quotes). Remove the "≥ 180" target; the count follows the coverage rule (about 250). Fictional names come from generator patterns (place word + service word, like "Show-Me Motorcoach"), checked against CATALOG so none collides; the module prints the list for an owner review.
- A12. Swaps (§4.2 Swap, §4.3 Choose) are allowed only on lines **without** `l.inv`. The first swap stores `l.alt0={sup,cost,comm}` so Undo/swap-back restores exactly. After a swap, `t.sups` is synced (the entry's `n` follows the line's supplier; status resets to `Not sent` in Quote, `Sent` in Operations).
- A13. Traveler extras: `passNo`/`passExp` only when `pass!=='Missing'`. The stage name in data is `'Operations'` (not "Operation"). Blocks reuse `releaseRisk(t)` from `s7_leak.js` for exposure, so Profit leaks and Blocks show the same number.

**Feature rules:**
- A14. Tiers (§4.4): each tier price = clone the trip with `pax=n`, regenerate quantities with the same rules `genLines` uses (rooms by segment occupancy, per-person qty, comps `floor(n/20)` as today), then `calc(clone).rev / n`. The FOC column shows `floor(n/20)` and is informational. The "Your quote" row is `calc(t).rev / t.pax`. Single supplement only for Twin-occupancy segments (Faith, Senior, Alumni): lodging price per room-night × nights × 0.5; "n/a" otherwise. Delete the formula `pp(n)=…` and `t.focPer`.
- A15. Overhead and brokerage are computed on the same post-discount base and are not compounded. `byType` does not include them; the tie is `Σ byType.rev + ovh + brk = rev`, `Σ byType.plan + brk = plan`. The §4.2 day-total tie is to `Σ lines planUSD` (excludes brk), with the rounding remainder on the last active day.
- A16. Tasks (§4.6): existing 12 tasks keep their ids and done state; new library tasks get ids ≥ 101, their own `rng`, and are added only to Operations/Finance/Closed trips. Alert counts, Maya tips and home rings will change; that is expected. The finance printout (`P rev/pp/fp`) must not change.
- A17. Manifest import updates fields of existing travelers only (no pax change). CSV export is wrapped in try/catch (the vm has no Blob); the test calls the pure `opCsv(t)` string builder.
- A18. Settings: the matrix shows 40 permissions, but only these are enforced: `users.manage` (Users page), `fin.sync` (Accounting sync), `fin.view` (Finance and Invoice check pages, if an owner turns it off), `prop.approve` (approve button), `fin.issueDocs` (issue buttons on Income), `settings.edit` (Settings read-only), `price.edit` (pricing inputs disabled), `forms.build` (form builder). The rest show "Matrix only in this demo". Stages editing is a UI preview and does not change trip data.
- A19. Dashboards: manager home = `vHome()` output plus new cards appended (keep `.ptiles`). Accountant AR-next-30 = unpaid deposits/balances with `depDue`/`balDue` in `[TODAY, TODAY+30]`; overdue is shown separately from `portfolio().aging`. AP schedule = unpaid lines of non-Quote trips, amount `effAmt(inv)` or `planC(l)`, × `lrate`, dated by the `portfolio()` rule (Finance/Closed → TODAY+20, Operations → dep−14), past dates clamped to this week, grouped by week for 8 weeks. The test recomputes it independently.
- A20. `s7c_lists.js` buttons `al-new` (activities, hotels, clients) and row clicks: the lead rewires them to `formOpen` / the client card after the forms and sup modules merge. Builders do not edit `s7c_lists.js`. To replace the Hotels or Clients page body, reassign the global function (`vHotelsList=function…`, `vClients=function…`), because `s9_boot.js` assigns `VIEWS.hotels`/`VIEWS.clients` last.

**Waves (replaces §5 step 2):**
- Wave 1 (parallel, Sonnet): `s1d_data.js` suppliers+rates+alternatives · `s1e_people.js` clients+staff+roles+perms+traveler extras · `s10_forms.js` engine+modal+entity schemas (guards `typeof SUPPLIERS`) · `s10_prop.js` proposal formats+pricing extras · `s10_dacct.js` accountant dashboard.
- Wave 2 (parallel, Sonnet, after wave 1 merges): `s10_tbday.js` builder day details, payment tables, save-as-template, map · `s10_tbcomp.js` components, alternatives, versions (both register in `TB_VIEWS[key]=fn`, and `s10_tbday.js` owns the single `pPlan` wrapper and the view switch; `s10_tbcomp.js` only registers `TB_VIEWS.comp` and the `tbver` tab) · `s10_sup.js` suppliers page, card, in-trip suppliers, client card · `s10_fbuild.js` form builder and traveler forms · `s10_ops.js` tasks, master list, blocks · `s10_settings.js` · `s10_dash.js` manager additions and agent dashboard (`VIEWS.home` role switch; calls `dbAcct()` from wave 1).
- Haiku: screenshot QA and the Hebrew wording review, after each wave merges.

## 1. Hard rules (from CLAUDE.md, restated for builders)

- One self-contained HTML; no CDN, no frameworks; `<meta charset="utf-8">` first.
- Every visible string goes through `L(he, en)`. English is the default. `check6.js` must report `LEFTOVER 0` and `bad 0` (no `NaN`, `undefined`, `Infinity`, `[object`, `null<`).
- Hebrew = full RTL (the shell sets `dir`). Use logical CSS (`margin-inline-start`, `inset-inline-end`), never left/right.
- Icons only via `ic('name')` (names that exist in `v6/s0_brand.js`; list with `grep -o "^  [a-z0-9]*:" v6/s0_brand.js` or `Object.keys(ICONS)`). No emoji, no Unicode glyph icons.
- Colors only from theme tokens in `v6/theme.css` (`var(--...)`); both day and night mode must read.
- **Real-brand rule**: real names (`CATALOG` hotels/venues, `real:true` suppliers) never appear next to negative wording (gap, overbilling, dispute, late, slow, poor). Supplier performance metrics (gap rate, reply time) are shown only for `real:false` suppliers. `check6.js` already fails if a catalog name appears in a gap.
- Money: existing helpers `usd()`, `money()`, `r2()`. Never float-accumulate without `r2`.
- Finance identity must keep holding for every trip: `planProfit − amtDiff − fx − fcProfit = 0`.
- No secrets, no API keys.
- Mobile: layouts work at 390 px; tables inside `.scroll`.

## 2. Architecture: how modules plug in (no shared-file edits by builders)

Existing extension points (read these before coding):
- `VIEWS[key] = fn` registers a page; `NAV`/`NAV2` arrays add sidebar items (`s7c_lists.js` does `NAV.push`).
- Trip tabs: push to `PTABS` and to the right stage in `STAGES` (`v6/s7b_product.js`), and add the renderer by wrapping `vTrip` (see below).
- Each module adds its own `document.addEventListener('click'|'change'|'input', ...)` and handles only its own `data-act` / `data-ch` names. **Prefix every new action with the module code** (`fm-`, `tb-`, `db-`, `sp-`, `pr-`, `st-`, `op-`) to avoid collisions.
- State: add keys with `Object.assign(S, {...})` at module load and `KEEP.push(...)` for those that must persist. Trip-level data goes on the trip object (TRIPS is saved whole).

New foundation hooks (built by the lead in `s3_shell.js`, `s1_core.js`, `check6.js`, `build.py` before builders start):
- `PERSIST.push({key, get:()=>data, set:v=>{}, reset:()=>{}})`: extra datasets saved with the demo state and reset by "Reset demo data".
- `TESTS.push({name, run:()=>[...failure strings]})`: `check6.js` runs every registered test after the standard sweep; an empty array is a pass.
- `TRIP_TABS[ptabKey] = t => html`: renderers for new trip tabs; the lead's `vTrip` wrapper looks here before the built-in map.
- `ROLE_KEYS` = `['manager','accountant',...AGENTS]`; `isAgent()`, `isAcct()`, `isMgr()`; `canSee(t)` true for manager and accountant. The role `<select>` lists the accountant. `check6.js` sweeps every role in `ROLE_KEYS`.
- `can(perm)` → boolean for the current role, from `PERMS` (defined in `s1d_data.js`). A page or action the role lacks renders a "no access" card (`noAccess(what)` helper), never an exception.
- `calc(t)` gains optional `t.ovh` and `t.brk` (see §4.5). Absent = 0, so every existing number is unchanged.
- `build.py`: JS order gets `s1d_data.js` after `s1c_catalog.js`, and `s10_forms.js, s10_builder.js, s10_sup.js, s10_prop.js, s10_ops.js, s10_settings.js, s10_dash.js` after `s9d_maya.js` (before `s9_meet.js`). It also inlines every `v6/m_*.css` (sorted) after `lists.css`. Missing files are skipped, so modules can land in any order.

Builders create **only their own files**: `v6/s10_<code>.js` and `v6/m_<code>.css`. If a shared-file change is unavoidable, they describe it in their final report and the lead applies it.

## 3. Data expansion: `v6/s1d_data.js` (Sonnet, first, alone)

Deterministic (`rng(seed)`), no Date.now(). Uses `DESTS` (16 keys after `s1c_catalog.js`), `CATALOG`, `TRIPS`, `TYPES`.

### 3.1 `SUPPLIERS` (array) and `SUP_BY` (id → supplier)
```
{ id:'sup-<slug>', name, cat: one of TYPES, dest: DESTS key | 'ALL' (air desk, insurance),
  city, country, cur: 'USD'|'EUR'|'GBP'|'CAD'|'ILS',
  real: bool,            // true only for CATALOG hotels
  incumbent: bool,       // true when TRIPS lines already use this exact name
  pref: 'High'|'Medium'|'Low', rating: 3.0..5.0 (one decimal),
  contact:{name, role, email:'…@<slug>.example', phone}, // US +1 (555) 01xx-format; intl in local format, fictional
  terms:{depPct, depDays, balDays, payBy:'ACH'|'Wire'|'Card'|'Check'},
  cancel:[[daysBefore, penaltyPct], …]  // 3–4 tiers, descending days
  comm: 0..15,           // % commission the supplier pays the agency
  docs:{w9:bool|null (US only), coi:'YYYY-MM-DD'|null, contractTo:'YYYY-MM-DD'},
  base: number,          // reference unit cost in its currency
  unit: 'room-night'|'day'|'person'|'meal'|'transfer'|'evening',
  variants:[{k, en, he, mult}],  // e.g. Full Bus 55 / Midi 35 / Minibus 24; guide EN/ES; room Twin/Single/Triple
  replyHrs: number,      // shown only when real:false
  notes:{en,he} }
```
Coverage rule, for every destination in `DESTS` × category in `Lodging, Transport, Guide, Meals, Activities`:
- the **incumbent**: every distinct `l.sup` used in TRIPS for that dest+type (names unchanged);
- **at least 2 alternatives**, so every line has ≥ 3 options. Lodging alternatives come from `CATALOG.hotels` of that dest (`real:true`, brand badge via existing `brandBadge`) plus one fictional; all other alternatives are fictional names that do not exist as real companies in that city (add `{fictional:true}` and use generic name patterns, e.g. "Ozark Valley Coaches").
- Global suppliers (`dest:'ALL'`): `SkyGroup Air Desk` + 2 air desks, `SafeJourney Protection` + 2 insurers.
Target: ≥ 180 suppliers. Print the count in the test.

### 3.2 Rates
- `SEASONS = {Low:[1,2,11], Shoulder:[3,4,10,12], High:[5,6,7,8,9]}` (months); `seasonOf(isoDate)`.
- `BANDS = [[10,19],[20,34],[35,49],[50,60]]`; `bandOf(pax)`.
- `rateCard(sup)` → rows `{season, band:[a,b], variant, cost}`, `cost = round(base × seasonMult × bandMult × variant.mult)`. Season mults: Low .9, Shoulder 1, High 1.12 (± per-supplier jitter ≤ 0.04). Band mults for per-person/per-room units: 1.04, 1, .97, .95; for per-day/transfer units: 1.
- `rateFor(sup, isoDate, pax, variantKey?)` → number.
- `altCost(t, line, sup)` → unit cost in the line's currency, anchored to the current line: `round(line.cost × rateFor(sup,dep,pax) / rateFor(incumbentOf(line), dep, pax))`. For the incumbent itself it returns `line.cost` exactly. If the alternative's currency differs from the line's, convert with `BASE_RATE` and return `{cost, cur}`.
- `altsFor(t, line)` → `[{sup, cost, cur, delta (USD, line total), rating, pref, cancel, comm, real}]`, incumbent first, sorted by cost.

### 3.3 Clients: `CLIENTS` (array), `CLI_BY`
Every distinct `t.client` in TRIPS plus 10 prospects (`type:'Prospect'`, 3 with an open lead note). Fields: `id, name, type (CTYPE key), city, state, contact{name, role, email .example, phone}, since (year), taxExempt (bool; churches/schools usually true), source ('Referral'|'Trade show'|'Website'|'Repeat'), notes{en,he}`. The existing `alClients()` stays the aggregate; client cards join on `name`.

### 3.4 People, roles, permissions
- `STAFF`: Ella Brooks (owner, key `manager`), **Nora Kim** (accountant, key `accountant`, HE נורה קים), the 6 agents, `Ops desk` (pseudo-assignee). Each: `key, en, he, role, email .example, phone, target (annual booked revenue, USD; agents only), active`.
- `ROLES = {owner, admin, agent, accountant}`; role keys map: manager→owner, accountant→accountant, agents→agent.
- `PERMS`: 40 permissions in 9 groups (Projects, Pricing, Proposals, Operations, Finance, Suppliers & catalog, Clients, Users & settings, AI). Each `{k, group, en, he, owner:true, admin, agent, accountant}`. Must include at least: `proj.viewAll, proj.create, proj.delete, price.edit, price.seeCost, price.overrideMarkup, prop.send, prop.approve, ops.tasks, ops.manifest, ops.suppliers, fin.view, fin.issueDocs, fin.recordPayment, fin.approveBills, fin.dispute, fin.sync, fin.export, sup.edit, sup.rates, cli.edit, users.manage, settings.edit, forms.build, ai.live`.
  Defaults: agent cannot `proj.viewAll, prop.approve, fin.issueDocs, fin.approveBills, fin.sync, users.manage, settings.edit`; accountant cannot `price.edit, prop.send, ops.manifest` (read-only on ops) but can all `fin.*`.
- `can(k)` reads a mutable copy `S.perms` (if set by the settings screen) else `PERMS` defaults, for the role of `S.role`.

### 3.5 Extra trip-level data (added to every trip at load, deterministic, persisted with TRIPS)
- `t.trav[i]` gains `passNo` (masked e.g. `•••• 4821`), `passExp` (ISO; ~6% of intl trips expire < 6 months after return), `dob`, `emerg:{name, phone}`, `roomType: 'Twin'|'Double'|'Single'|'Triple'|'Quad'` consistent with the segment occupancy, `form:{reg, med, waiver}` each `'done'|'sent'|'not sent'`.
- `t.block = {hotel, held, picked, cutoff (dep−30), attrition (%), types:{Twin, Single, …}}` derived from `t.room`; keep `t.room` untouched.

### 3.6 Tests registered by this module (`TESTS.push`)
- every TRIPS line has `altsFor` length ≥ 3 and its incumbent alt cost === `line.cost`;
- no supplier with `real:true` has `replyHrs` displayed (field may exist but flag `showPerf:false`);
- `can()` returns booleans for all 40 perms × 4 roles;
- counts printed: suppliers, clients, staff.

## 4. Feature modules (parallel, after §3 and the foundation land)

Each module section lists: files · model · screens · behavior · acceptance tests (registered via `TESTS`).

### 4.1 Forms engine and form builder: `s10_forms.js`, `m_forms.css` · **Sonnet**
API (other modules call it; guard with `typeof formOpen==='function'`):
- `FORM_SCHEMAS[id] = {id, title:{en,he}, entity, fields:[…], onSave(record, isNew)}`.
- Field: `{k, type, label:{en,he}, req?, help?, options?:[{v,en,he}], min?, max?, pattern?, showIf?:{k, eq}, cols?:1|2, def?}`; types: `text, email, tel, number, money, select, multi, date, toggle, textarea, file (simulated name only), section, repeater (fields:[…])`.
- `formOpen(id, record|null)` opens a modal (right drawer on desktop, full screen at ≤ 600 px) with Save/Cancel, inline validation on blur and submit, focus on first error, Esc closes. `formValidate(id, record)` returns `{ok, errors:{k:msg}}`, pure, testable.
- Built-in entity schemas: `supplier` (all §3.1 fields incl. cancel tiers repeater and variants repeater), `client` (§3.3), `user` (name, email, role, active), `activity` (name, dest, city, duration h, cost pp, comm %), `hotel` (name, dest, city, stars, brand, rate, room types). Saving updates `SUPPLIERS` / `CLIENTS` / `STAFF` in memory and persists through `PERSIST`.
- **Form builder** page `VIEWS.forms` (reached from Settings, not NAV): left list of forms (4 traveler forms + entity custom-field sets), middle canvas of fields (add from palette, move up/down, delete, duplicate), right properties panel (labels EN/HE, required, options, help, showIf), top toggle Desktop / Phone preview, `Publish` (bumps version, toast). Entity custom fields added here appear in the entity form under a "Custom fields" section.
- **Traveler forms**: Registration (name, DOB, passport no/expiry, emergency contact, room-share request), Medical & dietary, Liability waiver (scroll + typed signature + date), Rooming preference. On a trip in Operation stage, the Manifest tab (ops module) shows per-form completion from `t.trav[i].form`; a "Send forms" action marks `not sent → sent` and copies a simulated link `https://forms.redbudtours.example/<tripNo>/<formId>`.
Acceptance tests: `formValidate` rejects missing required, bad email, number out of range; accepts a complete supplier; every built-in schema renders in EN and HE without bad tokens or Hebrew leftovers; publish increments version.

### 4.2 Trip builder: `s10_builder.js`, `m_builder.css` · **Sonnet** (most complex UI)
Extends the Trip plan tab (`ptab 'plan'`) of the Quotation stage without breaking `s6b_dnd.js` (drag and drop) or Maya plan fixes (`s9d_maya.js`).
- **View switch** at the top of the plan tab: `By day` (today's view, unchanged) / `By components` / `Map`. Implement by wrapping `pPlan`: `const p0=pPlan; pPlan=function(t){return S.tbView==='comp'?tbComp(t):S.tbView==='map'?tbMap(t):p0(t);}` plus a switch bar injected at the top.
- **Day panel additions (By day)**: per open day, a "Day details" card: description textarea (`t.dayInfo[d].desc`, defaults to generated text), day photo (pick from the destination's photos via existing `phSrc`/`phFor`), and two payment tables like the product: **Global payment** (shared lines active that day: lodging if a night follows, coach, guide days, transfers on day 1 and last) and **Payment per participant** (activities scheduled that day via item→line match, meals). Costs are the line's per-day share: `planC(line)/activeDays(line)`; totals per day; the sum of all day totals + unscheduled = `calc(t).plan` (test).
- **By components**: one table per line type: line, supplier (with brand badge for real), variant, qty, unit, unit cost, total, scope, days active; each row has an **Alternatives** button opening a side panel from `altsFor(t,l)`: supplier, rating, pref, cancel policy summary, commission, unit cost, delta vs current (USD, green if cheaper); `Swap` (Quote stage only) sets `l.sup`, `l.cost`, `l.cur`, and `l.comm` from the alternative and keeps qty; a toast shows the profit impact; Undo available for 8 s. In Operation stage the button reads "Compare" and is read-only.
- **Save day as template**: pushes `{n:[he,en], dest, tag, items}` to `S.myTpl` (KEEP); wrap `allTpl()` to append them; they appear in the existing templates rail and work with drag and drop.
- **Versions** (new tab in Quotation stage, `ptab 'tbver'`, label "Versions"): `Save version` snapshots `{v, at: TODAY iso, by: role, note, lines (deep copy of sup/qty/cost/cur/comm/ov), markups, disc, ovh, brk, totals:{rev, plan, planProfit}}` into `t.versions`; list with totals; select two to compare (per-line diff table + totals delta); `Restore` writes the snapshot back (with confirm). Seed each Quote-stage trip with v1 (created when the quote was drafted) and for `hl` and `irl` a v2 with a different hotel alternative.
- **Map** view: reuse `geoMap`/`geoViewFor` (`s0_geo.js`) to show the base cities and the day order; if the destination has no geometry, show a neutral note.
Acceptance tests: day totals tie to `calc(t).plan` per Quote trip (±0.05); swap then swap back restores identical `calc(t)` (planProfit equal); identity holds after swaps on every Quote trip; versions restore reproduces totals exactly; `dndMoveItem` tests still pass.

### 4.3 Suppliers, hotels, clients: `s10_sup.js`, `m_sup.css` · **Sonnet**
- **Suppliers page** (replaces `VIEWS.suppliers` body for sub `bank`; keep subs `prices` and `import` working): product-style table on `SUPPLIERS`: name (+ brand badge), category, destination, preference, rating, currency, commission, docs status (W-9 / COI expiring < 60 days amber), trips used, spend (from `supplierBank()` logic); filters by destination, category, preference; search; `New supplier` → `formOpen('supplier')`.
- **Supplier card** (drawer or page `S.supId`): header (name, category, city, pref, rating), contact, payment terms, cancellation tiers as a small timeline, rate card table (season × band × variant), documents, trips and spend; for `real:false` only: invoice accuracy (gap count and amount from `gapStats().bySup`) and reply time. `Edit` → `formOpen('supplier', sup)`.
- **In-trip supplier management** (Operation stage, new tab `ptab 'spm'`, label "Suppliers", in the Operation stage): rows per supplier on the trip with the product's status flow **Contact → Pending → Approved** plus **Price comparison**: selecting it opens a comparison of the incumbent and 2 alternatives (`altsFor`) with "Request quotes" (simulated; marks the alternatives Pending with a reply date) and "Choose" (only before Approved; swaps like §4.2 and logs). Unassigned components (lines with no supplier status) listed on top. Map the old `t.sups[].st` (Not sent/Sent/Confirmed/No reply) to the new flow; keep `t.sups` as the source of truth so existing views and Maya keep working.
- **Hotels: Blocks** (new sub-tab on the hotels page or a section in it): table of `t.block` for Operation trips: hotel, dates, held, picked up, cutoff, days to cutoff, attrition allowed, exposure in USD = (held − picked − attrition allowance) × rate × nights if past cutoff (else "release by <date>"). Real hotels: neutral wording only ("Release by", "Pick-up").
- **Client card**: from the Clients list (`s7c_lists.js` `vClients`), clicking a row opens a card: contact, type, tax-exempt badge, trips (all stages) with value, **Finance** tab (documents from `incomeDocs` across the client's trips: billed, received, open), notes; `New client` / `Edit` via forms.
Acceptance tests: every SUPPLIERS row renders; supplier card renders for 10 sampled suppliers incl. real ones with no gap/late wording near real names; blocks exposure ≥ 0 and computed only after cutoff; client finance totals equal the sum of `incomeDocs` deal docs for that client.

### 4.4 Proposal formats and pricing extras: `s10_prop.js`, `m_prop.css` · **Sonnet**
- Wrap the Proposal tab (`pQuote`): a format switch **PDF design** (today's document, unchanged) / **Agents table** / **Landing page**, plus `Copy public link` (`https://go.redbudtours.example/p/<no>`) and `Download PDF` (calls the existing print path, try/catch).
- **Agents table**: indicative price per person by group size for tiers `[10,15,20,25,30,40,actual]`, with FOC rule `foc(n)=floor(n/t.focPer)` (`t.focPer` default 20, editable 10–25), single supplement, and the current markups. Formula, with `Ssh` = shared price total and `Ppp` = per-person price per traveler at the current pax (both from `calc(t)` lines, after discounts and ovh/brk): `pp(n) = (Ssh + Ppp × foc(n)) / (n − foc(n)) + Ppp`. The `actual` row must equal `calc(t).rev / (t.pax − foc(t.pax))` to the cent only if FOC is priced that way; otherwise show `calc(t).rev / t.pax` and label the row "Your quote". Pick the second (simpler, no identity risk) and say so in a footnote. Single supplement = lodging price per room-night × nights × (1 − 1/occ) where occ is the segment occupancy used by `genLines`.
- **Landing page**: web-style preview inside a framed device: hero photo of the destination, title, dates, price from (per person), days with photos (`phFor`), includes / not included, deposit and dates (`t.pct`, `t.depDue`, `t.balDue`), an "Accept and pay deposit" button (simulated: toast + sets `t.qst='Negotiating'` only if Draft/Sent, never skips approval).
- **Pricing extras** in the Pricing tab (wrap `pCosts`, append a card at the bottom like the product): Overhead and Brokerage fee, each `{m:'%'|'$', v, on:'shared'|'pp'|'both'}` stored on `t.ovh`, `t.brk`. Show their effect on price per traveler and profit live.
Acceptance tests: tier prices decrease monotonically from 10 to 40 for every Quote trip (or flag where FOC steps break monotonicity, which is expected: assert only no NaN and > 0); with ovh=5% the client price rises by 5% of the selected base and identity still holds; brk changes revenue and plan cost by the same amount (profit unchanged), identity holds.

### 4.5 Core change for §4.4 (lead, in `s1_core.js`)
In `calc(t)`, after discounts: `ovhAmt` = % of (shared and/or per-person price) or fixed $ (pp × pax when on pp) → added to `o.rev` and to a new `o.ovh`; `brkAmt` computed the same way → added to `o.rev`, `o.plan`, `o.fc` and `o.brk` (pass-through to a broker). Identity unaffected; with both absent nothing changes.

### 4.6 Operations depth: `s10_ops.js`, `m_ops.css` · **Sonnet**
- **Tasks** (replace the task list in `pOps` via a new Operation tab `ptab 'optasks'` "Tasks" and keep `pOps` for digest/block/messages): `TASK_LIB` of ~45 tasks in 7 windows exactly like the product (Primary arrangements, 60–30 days, 30–14, 14–1, Boxes & materials, During tour, After tour), each with owner role (agent / ops desk / accountant), offset days, intl-only flag. Generate per Operation/Finance/Closed trip deterministically (keep the 12 existing tasks' ids and done state; extend with the rest). Filters: window, status (open/overdue/done), owner. Checkbox toggles; overdue logic as today.
- **Manifest** (wrap `pPeople` or a new tab `ptab 'manifest'` "Master list"): columns Room, Name, Household, Room type, DOB, Passport no, Passport expiry (amber if < 6 months after return), Diet, Emergency contact, Forms (3 dots); `Add column` (custom text column per trip, persisted on `t.mcols`); `Export CSV` (Blob download, try/catch, no Hebrew in EN export); `Import` (simulated: shows a 5-row preview and adds nothing unless confirmed; confirm adds 2 late registrations and re-splits groups so `groupsCalc` still ties to revenue — **only if pax stays equal**; simpler: import updates fields of existing travelers only). Rooming summary: count per room type vs `t.block.types`.
Acceptance tests: every Operation trip has ≥ 30 tasks; windows cover all tasks; CSV export has header + pax rows; passport-expiry warning count equals the data rule; groupsCalc identity unchanged.

### 4.7 Settings: `s10_settings.js`, `m_settings.css` · **Sonnet**
`VIEWS.settings` + NAV item "Settings" (icon `settings`) with sub-tabs:
- **Organization**: agency name, logo initial, default currency (USD; list USD/EUR/GBP/CAD/ILS), date format (MM/DD/YYYY default for EN, DD/MM/YYYY for HE), time 12h/24h, timezone (America/Chicago), sales tax on service fees (%), tax ID. Stored in `S.org` (KEEP). Apply `S.org.datefmt` to `fmtDate` only if trivial; otherwise show the setting with a preview line (decide: preview only, to avoid touching every date).
- **Roles & permissions**: matrix 40 perms × 4 roles grouped, toggles (owner column locked on), "Reset to defaults". Writes `S.perms`. The role switcher then hides NAV items the role lacks (`fin.view` → Finance/Invoice check; `users.manage` → Users; `settings.edit` → Settings shows read-only).
- **Stages**: per stage (Quotation, Operation, Finance) list of statuses with color, add/rename/reorder (does not change trip data; new statuses available in a status dropdown on the project header later).
- **Forms**: link card to `VIEWS.forms`.
- **Integrations**: link card to the existing accounting sync page (`VIEWS.books`).
Acceptance tests: matrix renders 160 toggles; turning off `fin.view` for agent hides Finance for agents and the view renders `noAccess`; settings render in EN/HE.

### 4.8 Dashboards: `s10_dash.js`, `m_dash.css` · **Sonnet**
`VIEWS.home` becomes role-aware: manager → existing `vHome` (keep hero class `ptiles`, keep `hpHero`/`hpStats`) plus two new cards; accountant → `dbAcct()`; agent → `dbAgent()`. Same visual language (hero band, KPI tiles with chips, cards). Every tile is a button that drills to the page that explains it. Every figure computed from existing functions; no new finance math.
- **Manager additions**: *Approvals waiting* (quotes with `qst==='Approval'`, value, agent, days waiting, Approve button → opens approve tab); *Team* leaderboard per agent: open quote value (Quote stage `calc().rev`), booked revenue (non-Quote), expected margin % (`fcProfit/rev`), files, target attainment = booked / `STAFF.target`; *Departures next 30 days* readiness (tasks done %, passports %, suppliers confirmed %, deposits collected %).
- **Accountant** (`dbAcct`): hero KPIs: cash to collect next 30 days (unpaid group deposit/balance due in [TODAY, TODAY+30]); overdue receivables (from `portfolio().aging`, 3 buckets); supplier bills awaiting approval (lines with `inv` not paid and status match); open gaps amount (`gapStats().open` + `.disp`); commission receivable (existing commission rule). Cards: *AR aging* table by client; *AP schedule* next 60 days by week (rule identical to `portfolio()` cash-out: Finance/Closed → TODAY+20, Operations → dep−14), with currency; *FX exposure* (`portfolio().fxExp`); *Documents to issue* (deal invoices due ≤ 30 days not yet issued, from `incomeDocs` rules); *Sync status* (from `ACCT` in `s9a_books.js`, if connected); *Month-end checklist* (8 static items with computed counts).
- **Agent** (`dbAgent`, visibleTrips only): hero KPIs: my open quotes (count, value), follow-ups due (Sent and `qdays>7`), my departures next 60 days, my overdue tasks; cards: *My pipeline* kanban-lite by status (Draft / Approval / Sent / Negotiating) with days in status; *My departures* readiness rows (same four %); *My week* tasks list; *My numbers* booked vs target with progress bar and expected margin; *Forms pending* (travelers with forms not done).
Acceptance tests: accountant AR-next-30 equals an independent recomputation from `groupsCalc`; AP schedule total equals the sum of unpaid `fc` used by `portfolio()` cash-out for the same window; agent tiles count only that agent's trips; manager leaderboard booked revenue sums to `portfolio(TRIPS).rev`; every dashboard renders for every role in EN/HE with LEFTOVER 0.

## 5. Sequence, owners, models

| Step | Work | Who / model | Depends on |
|---|---|---|---|
| 0 | Spec + sanity review | lead (Opus) + reviewer (**Sonnet**, independent) | — |
| 1a | Foundation hooks (§2, §4.5), check6 role sweep + TESTS runner | lead (Opus) | 0 |
| 1b | Data module (§3) | **Sonnet**, worktree | 0 (schema), merged after 1a |
| 2 | Modules 4.1, 4.2, 4.3, 4.4, 4.6, 4.7, 4.8 in parallel | **Sonnet** ×7, one worktree each | 1a + 1b merged |
| 3 | Merge, build, `node check6.js`, fix integration | lead (Opus) | 2 |
| 4 | Visual QA: screenshots (EN, HE, night, 390 px) of every new screen, defect list | **Haiku** ×2 (reads PNGs, lists defects; no code) | 3 |
| 5 | Fix defects; Hebrew wording pass (plain Hebrew) | lead (Opus) + **Haiku** for Hebrew string review | 4 |
| 6 | CLAUDE.md file map + FEAT table statuses (new items Pilot/Roadmap only; owner confirms) | lead | 5 |

Model rule: Haiku only for read-and-report tasks with a checklist (screenshots, string review). Sonnet for every coding module. Opus (lead) for spec, shared files, finance math, merges, final review.

## 6. Definition of done
- `python3 build.py && node check6.js` → `LEFTOVER 0`, `bad 0`, all registered TESTS pass, existing printouts unchanged for finance (P rev/pp/fp identical to baseline: `P rev 950103.7 pp 142334.7 fp 138322.99`) unless a test intentionally changes ovh/brk and restores it.
- No page errors in a Playwright sweep of every NAV page and every trip tab, both languages, day and night.
- HTML size stays < 8 MB (baseline 6.75 MB).
- Each parity row P1–P12 maps to a working screen; a short table in the final report shows row → screen → test.
- FEAT table: new demo-only features marked Pilot (forms, versions, alternatives) or Roadmap; nothing new marked Live.
