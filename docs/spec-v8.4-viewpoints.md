# Spec v8.4: every viewpoint

Owner decisions (14 Nov 2026): all five viewpoints are in scope. The agency admin merges into the owner (Ella keeps users, permissions and integrations; the `admin` role stays in the permission matrix with no person). External portals get exactly one beat, in the 10-minute meeting cut only. Names are chosen by the lead: fictional, plausible for a Tulsa group-tour business, with AI-generated avatars of people who do not exist.

Read first: `CLAUDE.md`, `docs/v8.2-style-brief.md`, `docs/v8-builder-brief.md`, `v6/s12_home.js` (`hcShell`, `hcPage`, `hcCta`, `hcRing`, `hl*`), `v6/s13_portal.js` (the portal frame, below).

## 1. The people

| Viewpoint | Person (default) | Where the data comes from | Kind |
|---|---|---|---|
| Operations coordinator | **Kelsey Dawson**, role key `ops` | all trips; `t.tasks`, `t.sups`, `blockOf`, `t.trav[].form`, `dbReadiness` | agency role (in `ROLE_KEYS`) |
| Group leader | **Rev. Alan Mercer**, New Hope Baptist Church (trip `nas`, departs 13 Nov 2026) | `CLIENTS[].contact`; trips where `t.client===c.name` | portal `leader` |
| Traveler | **Linda Garcia**, Garcia household, trip `nas` (balance open, waiver sent) | `t.trav[i]`, household `t.groups` / `groupsCalc(t)` | portal `traveler` |
| Supplier | **Morgan Pratt**, Ozark Lakeside Lodge (fictional; trips `bra`, `bro`) | `SUPPLIERS` with `fictional:true` only; `t.lines` with `l.sup===name`, `t.sups` | portal `supplier` |
| Tour director (guide / driver) | **Wade Turner**, tour director | `GUIDES` (new, `s1e_people.js`); trips in Operations | portal `guide` |

The demo's "today" stays 20 Oct 2026 (`TODAY`). Other leaders, travelers and suppliers are reachable through a person picker inside each portal; they use the initial fallback avatar. Avatars (`AVATARS` keys `Kelsey`, `Alan`, `Linda`, `Morgan`, `Wade`) are generated with `tools/avatars/gen_headshots.py`. `avKey` maps the full names to these keys.

## 2. Architecture (lead-owned, built before the viewpoint modules)

### 2.1 Agency role: `ops`
- `ROLE_KEYS=['manager','accountant','ops',...AGENTS]`. `isOps()=S.role==='ops'`. `seesAll()` includes ops. `userName()` resolves through `agn('ops')` (`AGN.ops`, `AGE.ops`).
- `STAFF` gains `{key:'ops', en:'Kelsey Dawson', he:'קלסי דוסון', role:'ops'}`. The pseudo-assignee `Ops desk` stays (tasks keep `who:'Ops desk'`), and the ops home treats `Ops desk` tasks as Kelsey's queue.
- `ROLES.ops={en:'Operations', he:'תפעול'}`. `PERMS` gain an `ops` column: allowed are `proj.viewAll`, `price.seeCost`, all `ops.*`, `sup.edit`, `cli.view`, `forms.build`, `ai.maya`, `ai.live`. Everything else is denied. `fin.view` is denied, so Finance, Invoice check, Profit leaks and Accounting sync are hidden from the sidebar and render `noAccess()` (`NAV_PERM` gains `finance`, `gaps`, `leaks` → `fin.view`). Finance-stage trip tabs render `noAccess()` for ops (lead wraps `vTrip`). Further edit enforcement stays matrix-only, as it is today.
- Ops home: `hcOps()` in `s13_oc.js`, dispatched by wrapping `VIEWS.home` (`isOps()?hcOps():…`). Spec key `home:ops`.

### 2.2 Portals: `S.pv`
- Option (a) from the handover: portal people are NOT in `ROLE_KEYS`. The check6 agency sweep is unchanged, apart from the extra `ops` role. Each portal module registers its own `TESTS`, which render every portal tab for at least two people in EN and HE.
- State: `S.pv=null` (agency) or `{k:'leader'|'traveler'|'supplier'|'guide', id:<person id>, tab:<tab key>}`. It is in `S0`, so Reset clears it, and it is in `KEEP`. `tourGo`, `meetStart` and the idle reset set `S.pv=null`. The supplier beat sets it explicitly (§6).
- Registry `PORTALS[k]={label:[he,en], kind:'client'|'field', feat:<FEAT key>, people:()=>[{id,name,sub,av}], def:<id>, tabs:[[key,he,en,icon]], view:(tab,person)=>html, spec:<string>}`. A module registers with `pvRegister(k,def)`.
- `render()` draws the portal frame instead of the agency app while `S.pv` is set. The frame is `pvShell()` in `s13_portal.js`, mobile-first:
  - top bar: the agency badge (colored square "R" + "Redbud Group Tours"), the portal name, the language flag and the day/night button, the person's avatar;
  - ribbon (mint on dark blue): "You are viewing as **Linda Garcia** · Traveler" + person picker (`<select data-ch="pv-person">`) + "Back to agency" (`data-act="pv-exit"`);
  - tabs: a top tab row from 721 px up, a fixed bottom tab bar below that (at most 5 tabs; icons + short labels);
  - content column max 920 px, centered; `hcShell` hero on the portal home, `.hc-grid`/`.hc-card` below.
  - No sidebar, no Maya button, no guided-tour or meeting buttons. A short "demo data" note sits in the footer.
- `hcShell(o)` gains `o.name` (greeting name; default `userName()`) and `o.greet` (overrides "Good morning"); the portal homes pass them.
- Switcher: the "View as" `<select id="role">` becomes grouped with `<optgroup>`: **Agency team** (Ella, Nora, Kelsey, 6 agents), **Client side** (Group leader: Rev. Alan Mercer; Traveler: Linda Garcia), **Suppliers and field** (Supplier: Morgan Pratt; Tour director: Wade Turner). Portal options have values `pv:leader`, `pv:traveler`, `pv:supplier` and `pv:guide`, and open the portal with its default person and first tab. The same grouped select sits in the portal ribbon (`pvSwitch()`), so any person is reachable in one tap from anywhere.
- Avatars: `avatarOf(name)` works unchanged after `avKey` learns the new names.
- Entry links from the agency (nice to have; one each, owned by the module): the client drawer "Open client portal" (leader), the trip Master list row "Open traveler portal", the supplier card "Open supplier portal" (fictional only), and the trip Tasks tab "Open run sheet" (guide). All use `data-act="pv-open" data-v="<k>|<id>"`.
- Shared helpers in `s13_portal.js`, so that leader, traveler and guide render the plan the same way:
  - `pvDays(t)`: `[{i, date, title, items:[{id,name,hrs,start,end,kind}], hotel}]`. Times start at 08:00 and run cumulatively by `hrs`; day 1 starts at the departure time 07:00.
  - `pvDayCard(t,d,opts)`: card HTML.
  - `pvHousehold(t,i)`: the traveler's household row from `groupsCalc(t)`.
  - `pvTripsOfClient(c)`, `pvFictionalSuppliers()`, `pvSupLines(name)`: `[{t,l}]`.
  - `pvMoneyNote()`: "Simulated payment. No money moved."
  - `pvPayLink(t,g)`: `https://pay.redbudtours.example/...`.
- Spec keys: `specKey()` returns `portal:<k>:<tab>` while `S.pv` is set.

### 2.3 Honesty (`FEAT`, `v6/s9b_status.js`)
New rows: `opsrole` **Pilot** ("Operations coordinator view"), `pleader` **Roadmap** ("Group leader portal"), `ptrav` **Roadmap** ("Traveler app"), `psup` **Roadmap** ("Supplier portal"). The existing `guide` row (Roadmap, "Guide mobile app") covers the run sheet. Portal tops show the status pill (`stPill`). This is conservative: the owner flips a row to Pilot only after confirming it with the product team.

## 3. Screens per viewpoint
General rules for every screen: `L(he,en)` for every visible string, `esc()` for data, `ic()` icons from the list in the builder brief (add none), color emphasis rules, tokens only, logical CSS, 390 px with no horizontal page scroll, empty cards hidden. Every action that changes data saves through `render()` (which calls `save()`), shows a toast, and never changes finance math. The identity `planProfit − amtDiff − fx − fcProfit = 0` must still hold afterwards.

### 3.1 Operations coordinator: `s13_oc.js`, `m_oc.css`, prefix `oc`
Home `hcOps()` = `hcShell` with:
- **Gauge**: the average `dbReadiness(t).overall` of Operations trips departing in the next 90 days. Gauge lines: tasks overdue (red), suppliers unconfirmed (amber), forms missing.
- **Brief**: one sentence, for example: "**3** departures in the next 60 days. Branson leaves in **41 days** with **2** suppliers unconfirmed."
- **CTAs**: mint "Open next departure" (the nearest Operations trip's `odash`); ghost "Tasks this week" (scrolls to the tasks card).
- **KPI tiles**:
  - tasks due this week, incl. overdue (`t.tasks`, `!done`, `due<=TODAY+7`);
  - suppliers to confirm (`t.sups` with `flow!=='approved'`, Operations trips);
  - room blocks releasing in 45 days (`blockOf(t).cutoff`);
  - traveler forms missing (`x.form` values not `done`).

  Each tile drills.

Cards:
1. **Departure readiness board** (`hc-c12`): Operations trips by departure. Each shows a ring (`dbReadiness`), days to go, pax, tasks open/overdue, suppliers unconfirmed, forms missing, block release date and exposure (neutral wording if the hotel is real), and an "Open" button (`odash`).
2. **Tasks due**: today and this week across trips (sorted, overdue first). The task name comes from `opTaskName`. A tick button uses the existing `opToggleTask`, if it exists, or toggles `done`.
3. **Suppliers to confirm**: trip, supplier, category, flow (`spFlowL`) and a "Send request" button (simulated toast; flow → `pending`).
4. **Rooming and blocks**: per trip: hotel, held/picked rooms, cutoff date, exposure (`releaseRisk`), and the rooming-list status (sent/not). Real hotels get neutral wording only, so "release date", never "risk".
5. **Documents to send**: travelers with forms `not sent` (button: the existing `opSendForms` if available, else a toast), vouchers to issue (`pVouch` source count).

Ops sees agency pages minus finance (§2.1). Tests: `TEST oc operations home`. Render the home in EN and HE: the gauge equals the mean of `dbReadiness`, KPI numbers equal the recomputed counts, no Finance nav item for ops, and `VIEWS.finance()` returns noAccess for ops.

### 3.2 Group leader portal: `s13_pl.js`, `m_pl.css`, prefix `pl`
People: the contacts of clients that have a non-Lost trip (id = client id). Default: the client of `nas` (New Hope Baptist, Rev. Alan Mercer). Trip selector inside the portal when the client has several trips: chips at the top; the default is the nearest upcoming trip.

Tabs:

**`home`** (`hcShell`)
- Greeting: `o.name` = contact name.
- Gauge: % of the group's price collected (`groupsCalc(t).collected / calc(t).rev`). Lines: paid households, households with a balance open, late.
- KPIs: days to departure; travelers with all forms done (n of pax); balance due (sum of open, date `t.balDue`); next step.
- CTAs: mint "Remind unpaid households" (toast, simulated); ghost "View itinerary".
- For a quote in `Sent` or `Negotiating`, the hero instead says "Your proposal is ready". The mint CTA is "Accept proposal", which calls `prAccept(t)` if it exists, else `winQuote(t)`, then a toast "Your agent has been notified".

**`trip`**: the day-by-day itinerary (`pvDayCard`), the hotel (neutral), departure point and time; for a quote, the proposal summary: price per person, inclusions, and a link to the proposal format (`prLanding` if available).

**`pay`**: payment status per household: name, size, amount, deposit paid, balance paid, open, late flag (`groupsCalc(t).rows`). Filter chips All / Open / Late. Totals footer. Button "Send reminder" per row (toast).

**`people`**: travelers and forms: per traveler, the status of registration, medical and waiver, and passport received (intl). "Remind" per traveler (toast). Count of complete travelers.

**`docs`**: the proposal, the deal invoices for the client (`incomeDocs(t)` filtered to client-facing docs), the itinerary PDF (print), and the waiver template (sample wording, flagged "sample, counsel to review").

**`msgs`**: the thread with the agent (`agn(t.agent)`, avatar).
- Seed: 3 to 5 messages per trip, deterministic from `rng(hashId(t.id))`, about deposit, rooming and the departure time.
- Compose appends `{from:'leader', at:TODAY ISO, text}` to `PVMSG[t.id]`. `PERSIST` key `pv-msgs`, reset to the seed. The agent does not reply automatically; the note says "Your agent replies by email."

Tests: `TEST pl group leader portal`.
- Every tab in EN and HE for the default leader and for one client with a quote (`hl`, Grace Fellowship, Draft: the proposal state shows "being prepared", no Accept) and one with Sent (`can`, Prairie State Alumni).
- The pay tab sums equal `groupsCalc`.
- Accept on a Sent quote moves the trip out of `Quote` or sets `qst` per `prAccept`, and the identity holds.

### 3.3 Traveler app: `s13_pt.js`, `m_pt.css`, prefix `pt`
People: the travelers of Operations trips (id = `tripId|index`). The picker lists the default trip's travelers, grouped by household; a trip chip switches trips. Default: Linda Garcia on `nas`. Mobile-first: on desktop, render the content in a phone-width column (max 460 px) beside a short explainer card.

Tabs:

**`home`** (`hcShell`, compact)
- Gauge: my readiness: forms done, household paid, passport received if intl, as equal parts in %.
- KPIs: days to go; my household balance; forms to fill (n); room type and roommate(s).
- CTA: mint "Pay balance" (only if open > 0), ghost "Fill forms".

**`pay`**: the household's amount, deposit and balance, with due dates (`t.depDue`/`t.balDue`) and a payment link (`pvPayLink`).
- "Pay now" opens a simulated card form (no real card fields, a disabled-looking placeholder with "demo"). Confirm sets `t.groups[g].balPaid=true` (or `depPaid` first) and shows the `pvMoneyNote()` toast.
- The household then shows as paid in the leader portal and in the agency (the collected figure moves; revenue and profit do not).

**`forms`**: the four traveler forms from `s10_fbuild.js` (registration, medical, waiver, rooming preference), each with its status.
- "Fill" opens an inline form (fields from the form definitions; `fbPreview`, if usable, else a simple field list). "Submit" sets `x.form[k]='done'` (keys as in the data: `reg`, `med`, `waiver`; rooming maps to `x.roomType` confirmation).
- The waiver shows the sample wording plus the note "Sample wording, to be reviewed by counsel".

**`plan`**: day by day (`pvDayCard`), today's day highlighted when the trip is running. Hotel, meeting point and time.

**`help`**: the agency's 24/7 line (`918-555-0100`), the tour director (Wade Turner, phone from `GUIDES`), the agent (name, email), my emergency contact (`x.emerg`), dietary note (`x.diet`) and the passport (masked number, expiry warning if within 6 months of return).

Tests: `TEST pt traveler app`.
- Every tab in EN and HE for the default traveler and one fully paid traveler.
- Pay → `groupsCalc` collected rises by exactly the household's open amount; `calc(t).rev` and the identity are unchanged.
- Submitting a form sets the status.
- No horizontal overflow classes on wide tables (no tables wider than the column).

### 3.4 Supplier portal: `s13_ps.js`, `m_ps.css`, prefix `ps`
People: suppliers with `fictional:true` that appear on at least one trip line (id = supplier id). **Never** list or render a supplier with `real:true`; the test enforces this. Default: Ozark Lakeside Lodge (contact Morgan Pratt). The greeting uses the contact name, and the sub line is the supplier name.

Tabs:

**`home`** (`hcShell`)
- Gauge: % of invoiced amount paid or approved.
- KPIs: booking requests to confirm; arrivals in the next 60 days; invoices awaiting payment (amount); open queries from Redbud (count).
- Brief, for example: "**1** booking to confirm. Redbud has **1** question on an invoice."
- CTAs: mint "Confirm bookings", ghost "Invoices".

**`req`**: booking requests: every trip line for this supplier with the trip's `t.sups` entry.
- Shows the trip name (group name), dates, pax, rooms or units and the flow state.
- "Confirm" sets the `t.sups` entry `flow='approved', st='Confirmed'`; "Decline" sets `flow='contact'` and adds a toast.
- The agency sees the change in the trip's Suppliers tab.

**`list`**: rooming list / manifest for upcoming trips.
- Lodging: rooms by type (`blockOf(t).types`), names per room from `t.trav` (room number, names, room type, dietary).
- Other categories: pax count, dietary counts and the service time from `pvDays`.
- Print button.

**`inv`**: invoices submitted: line, amount (`effAmt(inv)`), status in neutral supplier-side words (Received, Matched, Query open, Credit issued, Approved, Paid), and the expected payment date from `terms.balDays` after the trip end.

**`disp`**: queries from Redbud (this supplier's gaps: `tripGaps` rows where `l.sup===name`, `s.k==='gap'`, `usd>0`).
- Each shows the difference in plain words (from the existing gap explanations), the amount and two actions:
  - "Issue credit": the same mutation check6 uses: `inv.credit += effAmt(inv) − planC(l)`, `inv.st='credited'`;
  - "Reply with documents": a toast, and the state is marked `replied` (`inv.reply=true`).
- Wording: "difference", "query", "credit", never "overbilling" or "dispute" on this side. The card carries class `ps-disp` (the meeting beat selector).

**`pay`**: payment schedule (deposit and balance dates from `terms`, amounts), remittance history (credited/paid).

Tests: `TEST ps supplier portal`.
- The picker has only fictional suppliers.
- Every tab in EN and HE for the default and for the supplier with the largest open gap (Canyon Rim Lodge).
- Issuing a credit keeps the identity, and `gapStats` open falls by that gap.
- The guard: no `CATALOG` hotel or venue name appears in any `ps` view HTML next to "query" or "credit".

### 3.5 Tour director run sheet: `s13_pg.js`, `m_pg.css`, prefix `pg`
`GUIDES` in `s1e_people.js` (lead): `[{id:'wade', en:'Wade Turner', he:'וייד טרנר', role:'Tour director', phone:'918-555-0177', email:'wade.turner@redbudtours.example', trips:['nas','bra','nia','dc1']}]` plus `{id:'cody', en:'Cody Harper', he:'קודי הארפר', role:'Driver-guide', phone:'918-555-0178', trips:['gre','hl2']}`. People: GUIDES (id = guide id). Default: `wade`. A trip chip row picks the trip (default: the nearest departure); a day chip row picks the day (default day 1, or today's day if the trip is running).

Tabs:

**`day`** (home; `hcShell` compact: greeting, trip and day, gauge = % of the day's stops done, KPIs: pax, first pickup time, hotel tonight, flags (dietary + medical count))
- Schedule: `pvDays(t)[d].items` with start and end times, a "Done" tick per stop (`PVRUN[t.id+'|'+d]` set, `PERSIST` key `pv-run`), and the supplier contact per stop (name and phone; real venues neutral).

**`pax`**: manifest: name, room, dietary flag, medical flag (from `x.form.med` and `x.diet`), emergency contact (tap to call: `tel:` link), passport status for intl trips. Filter chips: All / Flags only. Head count control "Count heads" (n of pax tick list, local only).

**`vouch`**: vouchers for the day's services: the supplier, service and voucher number from the trip's voucher data if available (`pVouch` source), else `RB-<trip>-<line>`.

**`notes`**: a notes list per trip (`PVNOTE[t.id]`, `PERSIST` key `pv-notes`): add a note (incident, change, guest request). Seeded empty.

Tests: `TEST pg tour director run sheet`. Every tab in EN and HE for both guides and every day of `nas`; times are increasing within a day; a done tick persists through `save`/`load`.

## 4. Meeting mode (lead)
One new beat `supplier` in the 10-minute cut only, after `dispute`:
- `go`: apply the `nen` inbox as the dispute beat does. Pick the fictional supplier with the largest open `nen` gap. Set `S.pv={k:'supplier', id, tab:'disp'}`.
- `sel`: `.ps-disp`.
- Text: "The supplier sees the same query, on their side. One tap issues the credit, and it lands back in your books."
- The next beat (`fin`) sets `S.pv=null`. The 1- and 3-minute cuts are unchanged. Every beat sets or clears `S.pv` explicitly.

## 5. check6 and tests
- The agency sweep adds the `ops` role automatically through `ROLE_KEYS`; Finance-gated pages must render `noAccess()` cleanly for ops.
- Portal modules register `TESTS` (above). The lead adds `TEST pv portal frame`:
  - `render()` with each portal and each tab in EN and HE gives no bad tokens and no Hebrew in EN;
  - the frame has no `.side` and has the ribbon;
  - `pv-exit` returns to the agency;
  - the grouped select contains all 4 portal options;
  - `specKey()` returns `portal:<k>:<tab>` and every portal tab has a `SPEC` entry.
- Budget: check6 under about 30 s.
- `P rev 950103.7 pp 142334.7 fp 138322.99` is unchanged (portal mutations happen inside tests, which reset).

## 6. Developer notes
Every new screen gets a `SPEC` entry:
- `home:ops`;
- `portal:leader:{home,trip,pay,people,docs,msgs}`;
- `portal:traveler:{home,pay,forms,plan,help}`;
- `portal:supplier:{home,req,list,inv,disp,pay}`;
- `portal:guide:{day,pax,vouch,notes}`.

Each module writes its own entries in its own file, in the existing shape (`title`, `purpose`, `roles`, `perms`, `data`, `actions`, `rules`, `states`, `status`, `api` (proposed), `tests`, `code`). External portals use `roles:{view:['leader'],act:['leader']}` etc. and `perms:[]` with a note that portal access is by invitation link (proposed). The lead re-runs `node tools/spec/export_spec.js`.

## 7. File ownership
- **Lead**:
  - `s3_shell.js`, `s1e_people.js` (ops staff, ROLES, PERMS column, GUIDES), `s6_rest.js` (role change handler), `s12_home.js` (`hcShell` options), `s9b_status.js`, `s9_meet.js`, `s9_boot.js`, `s11_spec.js` (`specKey`);
  - the new `s13_portal.js` + `m_portal.css`;
  - `check6.js`, `build.py`, avatars, `CLAUDE.md`, `docs/handoff/`.
- **Agents**: one viewpoint each: `s13_oc.js`/`m_oc.css`, `s13_pl.js`/`m_pl.css`, `s13_pt.js`/`m_pt.css`, `s13_ps.js`/`m_ps.css`, `s13_pg.js`/`m_pg.css`. Each owns its tests and `SPEC` entries. No other files; shared changes go into the report as patch suggestions.
- Build order: after `s12_home.js`: `s13_portal.js`, `s13_oc.js`, `s13_pl.js`, `s13_pt.js`, `s13_ps.js`, `s13_pg.js`, then `s9_meet.js`, `s9_boot.js`.

## 8. Binding amendments (independent review, 14 Nov 2026)
These override the sections above where they differ.

**A1. Supplier state goes through `spSetFlow`.** `t.sups` changes call `spSetFlow(t, idx, 'approved'|'pending'|'contact')` (s10_sup.js; idx = index in `t.sups`, entry `.line` = `l.id`). Agency state is read with `spFlow(s)`, which derives from `st`. "To confirm" means `spFlow(s)!=='approved'`, which is what `dbReadiness` counts. `spSetFlow` checks `spCan('ops.suppliers')`. The supplier portal acts as the supplier, so it sets the entry with the same field values `spSetFlow` writes (read that function and mirror it exactly) rather than going through the gate.

**A2. Lead changes already made:**
- `ops` is LAST in `ROLE_KEYS`, so tests that take `ROLE_KEYS[2]` or "first non-manager/accountant" as an agent still get an agent.
- `PERMS` has an `ops` boolean.
- `ST_ROLES` includes `ops`: 200 toggles.
- `STAFF` has Kelsey (`key:'ops'`) next to the existing team row `Ops desk` (role ops).
- `AGN.ops`/`AGE.ops` are set.
- `S.pv` is NOT in `KEEP`: a reload returns to the agency.
- The Maya and search hotkeys are off while `S.pv` is set.
- `DEMO_VERSION` and the build title are v8.4.

**A3. Releases and exposure.** `releaseRisk(t)` is null until the cutoff has passed, so exposure appears only when it is non-null. Otherwise show "releases on <cutoff>" with held, picked and open rooms. "Room blocks releasing in 45 days" counts `blockOf(t).cutoff` in `[iso(TODAY), addDays(iso(TODAY),45)]`. Dates are ISO strings; compare against `iso(TODAY)`.

**A4. No hard-coded example numbers.** Every brief is computed. With the default data there are 2 Operations departures within 60 days (nas 24 d, bra 41 d), and bra has 3 suppliers unconfirmed.

**A5. Proposals.**
- `prAccept(t)` (s10_prop.js) moves only Draft/Sent to Negotiating, stays in stage Quote, and toasts by itself.
- The leader portal shows "Accept proposal" only for `qst==='Sent'` and calls `prAccept(t)`. Never call `winQuote`.
- Negotiating and Approval read "Accepted, your agent is preparing the booking".
- Draft reads "Your agent is preparing the proposal" and offers no accept.
- Test clients: Sent → `can` (Prairie State Alumni), Draft → `hl` (Grace Fellowship), Negotiating → `irl` (Riverbend Seniors).

**A6. Leader default trip.** The nearest upcoming non-Lost trip; else the most recent one.

**A7. Data shapes.**
- `incomeDocs(t)` returns `{docs,g}`. Doc fields: `name,type('deal'|'receipt'),no,date,amt,st('paid'|'req'),kind('dep'|'bal')`. Quote-stage trips have no groups, so no docs.
- `pVouch(t)` returns HTML, not data. A voucher number is always `RB-<t.no>-<l.id>`. "Vouchers to issue" means `t.sups` entries with `spFlow==='approved'` on Operations trips.

**A8. Travelers.**
- Fields: `x.n` name, `x.g` household, `x.room` room number, `x.roomType`, `x.diet`, `x.pass ('Received'|'Missing')`, `x.passNo` (already masked), `x.passExp`, `x.dob`, `x.emerg {name,phone}`, `x.form {reg,med,waiver}` with values `'done'|'sent'|'not sent'`.
- The 4th traveler form (`room` in `FB_TRAV`) has no per-traveler data. Keep its status in the portal's own PERSIST map (`pt-room`, key `tripId|index`) and leave it out of "forms missing".
- Use `opPassWarn(t,x)` for the passport warning.
- `opSendForms(t)` works per trip (it also copies to the clipboard). Ops card 5 groups by trip.

**A9. Plan.**
- Trip items are `{id,name,hrs,day}`; `t.dayInfo` is usually `{}`. `pvDays` classifies the kind by name.
- The hotel is `t.room.hotel`.
- The meeting point is the fixed placeholder text "Redbud Group Tours office, Tulsa".
- The 07:00 departure is a demo constant.
- No Operations trip is running on 20 Oct 2026, so the "today" highlight never fires with the default data; the default day is day 1.

**A10. Supplier side.**
- Queries are `tripGaps(t)` rows for this supplier with `x.s.k==='gap'`, `x.usd>0` and `x.l.inv.st` in `''|'open'|'disputed'`.
- Statuses:

  | Condition | Status |
  |---|---|
  | `inv.st==='credited'` | Credit issued |
  | `inv.st==='accepted'` | Approved |
  | `inv.paid` | Paid |
  | `s.k==='match'` (no gap) | Matched |
  | open or disputed gap | Query open |
  | no invoice yet | Not invoiced |

- `inv.reply` is a new optional field kept inside TRIPS.
- Credit uses `inv.credit=(inv.credit||0)+effAmt(inv)-planC(l); inv.st='credited'` (USD lines; for other currencies the same formula applies in line currency, as s5_fin does).
- Do not hard-code "largest gap" names in tests. Compute them. After `applyInbox(nen)` the largest fictional `nen` supplier is used by the meeting beat.
- Ozark Lakeside Lodge has its open gap on `bra` only.

**A11. Real-brand guard.** 4 of the 6 Operations trips use real hotels. In the ops home and every portal, a `CATALOG` hotel or venue name must never be in the same `.hc-card` (or table row) as: unconfirmed, overdue, exposure, late, risk, query, gap, dispute, overbilling. Rows for real names use neutral words ("releases on", "awaiting confirmation" is not allowed next to a real name; use "status: requested"). Each module adds a guard test over its rendered HTML.

**A12. Ops home dispatch.** `s13_oc.js` wraps `VIEWS.home` (outermost, by build order): `isOps()?hcOps():prev()`.
