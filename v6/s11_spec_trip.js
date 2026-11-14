/* ---------- v8.1 module "dt": developer notes for every trip tab (DATA ONLY) ----------
   SPEC['trip:<ptab>'] entries follow the contract in docs/spec-v8.1-clarity.md. The panel that shows them is s11_spec.js.
   Written from the code that renders each tab; formulas are copied from calc / priceC / discOf / groupsCalc / invStatus /
   tripGaps / leakModel / prTierPrice / tbdDayCosts / altCost. API paths are relative to /v1/t/{tenantId} (docs/backend-plan/03-api.md).
   Lists hold at most 8 items, except data (at most 20: the exact fields the code reads). Roles are manager (owner), accountant, agent. An agent sees only own files (canSee). Permission defaults come from PERM_ROWS in s1e_people.js;
   only the ones named "enforced" below actually block a control in the demo. */
const DT_LOAD='Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.';
const DT_ERR='The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.';
const DT_GATE='Quote stage: the tab shows a gate card (opens after the quote is accepted) with the button Client accepted: open the file.';

SPEC['trip:general']={
  title:'General details',
  purpose:'Check and edit the basic facts of a trip: name, deposit percent and the locked exchange rate.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['proj.edit'],
  data:['Trip.name','Trip.client','Trip.ctype','Trip.dest','Trip.seg','Trip.pax','Trip.dep','Trip.nights','Trip.agent','Trip.cur','Trip.rate','Trip.pct','Trip.depDue','Trip.balDue'],
  actions:[
    {label:'Project name (text)',does:'Sets Trip.name. An empty value keeps the old name.',rule:'Any role that can open the trip. proj.edit is not enforced here.'},
    {label:'Locked rate, USD per currency (number)',does:'Sets Trip.rate and reprices every non-USD line.',rule:'Shown only when Trip.cur is not USD. Editable only in Quote stage; later it is read-only: Locked when the quote was accepted on the win date (Trip.wonOn, otherwise Locked at acceptance). Clamped to 0.5 to 2; an empty value falls back to the base rate.'},
    {label:'Deposit (%) (number)',does:'Sets Trip.pct. Group deposits and balances recompute.',rule:'Clamped to 0 to 100. Due dates do not change.'},
    {label:'Client, destination, group type, travelers, dates, file owner, due dates',does:'Read-only rows.',rule:'Changed elsewhere: pax and dates on the trip record, owner via proj.assign.'}],
  rules:[
    'New quote: depDue = dep - 150 days, balDue = dep - 60 days, pct = 25.',
    'lrate(t,l) = 1 for USD lines, else Trip.rate (one locked rate per trip).',
    'Supplier currency Trip.cur comes from the destination; air stays in USD where the destination has air.'],
  states:{empty:'A trip always has these fields; there is no empty state. With no open trip the page shows Open a trip first.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['GET /trips/{id}','PATCH /trips/{id}','PUT /trips/{id}/fx-locks/{cur} (step-up)'],
  tests:['check6: all views per role in EN and HE','check6: finance identities'],
  code:['v6/s4_views.js: pGeneral','v6/s6_rest.js: change handler (name, pct, rate)','v6/s1_core.js: buildTrip']};

SPEC['trip:plan']={
  title:'Trip plan',
  purpose:'Build the day-by-day itinerary by moving sites and templates onto days.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['proj.edit','price.edit'],
  data:['Trip.items','Trip.nights','Trip.dest','Trip.stage','Line.name','Line.cost','Line.type','Line.scope','Line.qty'],
  actions:[
    {label:'Day header (toggle)',does:'Opens or closes a day; Unscheduled is day 0.',rule:'S.openDay holds one open day.'},
    {label:'Move to day (select)',does:'Sets Item.day. 0 = unscheduled.',rule:'Any role that can open the trip.'},
    {label:'Cost per person (number)',does:'Sets Line.cost = value / lrate, so the price follows the markup.',rule:'Shown only if a per-person Activities line has the same name. Min 0.'},
    {label:'Add site to day (select + button)',does:'Adds an item from the destination catalog. In Quote stage also adds an Activities line (per person, qty = pax - floor(pax/20)) if none has that name.',rule:'Operation and Finance add the item only.'},
    {label:'Remove site (x)',does:'Deletes the item. The cost line stays.',rule:'None.'},
    {label:'Template: Add to day, search, destination filter',does:'Appends all template sites to the open day (day 1 if none).',rule:'List shows 8 templates, this destination first.'},
    {label:'Drag and drop (mouse, touch, pen)',does:'Moves a site or a template onto a day or between sites; saves, opens the day, flashes the item.',rule:'dndMoveItem keeps every item once; Esc cancels.'},
    {label:'Save draft / Save and continue',does:'Draft shows a toast only. Continue opens Pricing.',rule:'No data change.'}],
  rules:[
    'dayHours(t,d) = sum of Item.hrs on day d.',
    'A day over 9 hours (day 0 excluded) shows an Overloaded pill and a warning.',
    'Maya offers a one-tap fix: move the longest movable item to the nearest day that fits; arrival and departure days last.',
    'Three views share this tab: By day, By components, Map (view switch).'],
  states:{empty:'A day without sites says: No sites yet. Drag one here or add one.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['GET /trips/{id}/itinerary','POST /trips/{id}/itinerary:move','PATCH /trips/{id}/itinerary/items/{itemId}','POST /trips/{id}/itinerary/items'],
  tests:['TEST tbday','check6: drag and drop model (dndMoveItem, dndAddTpl)','check6: Maya tips and plan fixes'],
  code:['v6/s4_views.js: pPlan','v6/s10_tbday.js: pPlan wrapper, tbdBar','v6/s6b_dnd.js: dndMoveItem, dndAddTpl','v6/s9d_maya.js: mayaPlanFix']};

SPEC['trip:plan:day']={
  title:'Trip plan: By day',
  purpose:'Edit one day: description, photo, and what it costs globally and per participant.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['proj.edit'],
  data:['Trip.dayInfo','Trip.items','Line.planUSD','Line.scope','Line.type','Line.sup','Trip.pax'],
  actions:[
    {label:'View switch (By day / By components / Map)',does:'Sets S.tbView.',rule:'Built from TB_VIEWS, sorted by order.'},
    {label:'Day description (textarea)',does:'Stores Trip.dayInfo[d].desc on every keystroke.',rule:'Without an edit the default text is shown (day 1 intro; departure day; free day).'},
    {label:'Restore default text',does:'Deletes dayInfo[d].desc.',rule:'Shown only after an edit.'},
    {label:'Day photo (picker, up to 6)',does:'Stores Trip.dayInfo[d].img: the destination photo plus catalog venues of the day, then venues of the destination.',rule:'Falls back to the first matching venue, else the destination photo.'},
    {label:'Save day as template',does:'Appends a template (TBD_TPL, persisted) that appears last in the Templates list.',rule:'Disabled when the day has no sites. Duplicate names get (2), (3).'}],
  rules:[
    'tbdDayCosts splits each non-extra line planUSD equally over its active days; the last day takes the rounding remainder.',
    'Active days: Lodging = nights 1..N; Insurance = day 1; transfers = day 1 and last; air or per-person transport = day 1.',
    'Guide = qty days (busiest first); Meals = days from the (n) in the name, lunch from day 2; Activities = days with a matching site.',
    'Activities with no matching site are Unscheduled cost, shown under the tables.',
    'Sum of day totals + unscheduled = sum of planUSD over non-extra lines.',
    'Payment per participant = row amount / Trip.pax.'],
  states:{empty:'A day with no active lines says: No lines active on this day. The details card shows only for an open day 1..N.',loading:DT_LOAD,error:DT_ERR},
  status:'pilot',
  api:['GET /trips/{id}/itinerary/days/{day}','PATCH /trips/{id}/itinerary/days/{day}','POST /templates (from a day)'],
  tests:['TEST tbday'],
  code:['v6/s10_tbday.js: tbdDayCosts','v6/s10_tbday.js: tbdDetails','v6/s10_tbday.js: tbdSaveTpl']};

SPEC['trip:plan:comp']={
  title:'Trip plan: By components',
  purpose:'See every cost line by service type and compare or swap the supplier, with the profit impact.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['price.edit','sup.swap'],
  data:['Line.name','Line.sup','Line.type','Line.qty','Line.unit','Line.cost','Line.cur','Line.comm','Line.scope','Line.inv','Line.alt0','Supplier.id','Supplier.real','Supplier.rating','Supplier.pref','Supplier.cancel','Trip.sups','Trip.room'],
  actions:[
    {label:'Alternatives / Compare (per line)',does:'Opens the comparison table: current supplier first, then alternatives with rating, preference, cancellation, commission, unit cost, cost change and profit impact.',rule:'Disabled when the line has no alternatives and was not swapped.'},
    {label:'Swap supplier',does:'Sets Line.sup, Line.cost, Line.comm and stores Line.alt0 once; the trip supplier list and room block hotel follow.',rule:'UI: Quote stage only, no Line.inv, can sup.swap. tbSwap itself refuses without sup.swap (reason perm) and also allows Operation.'},
    {label:'Undo swap / Swap back',does:'Restores the exact original sup, cost and comm from alt0 and deletes alt0.',rule:'Blocked when the line has an invoice, or without sup.swap.'}],
  rules:[
    'Alternative unit cost = round(l.cost * rate(alt) / rate(incumbent)). The current supplier returns l.cost exactly.',
    'A real brand whose catalog rate differs from the line cost by more than 15% is anchored on the market median of fictional suppliers (altCost).',
    'Cost change = (alt cost - l.cost) * qty * lrate. Profit impact = calc(swapped).planProfit - calc(current).planProfit.',
    'A swap never changes currency or rate. Activities have no alternatives. Lodging shows the 5 closest by rate, at least one fictional.',
    'Real brands show a badge and no rating or performance.',
    'Operation stage: comparison only; choose the supplier in the Suppliers tab.'],
  states:{empty:'A line with no alternatives says each attraction is its own operator. A line with an invoice says the supplier is locked.',loading:DT_LOAD,error:DT_ERR},
  status:'pilot',
  api:['GET /trips/{id}/lines/{lineId}/alternatives','POST /trips/{id}/lines/{lineId}:swap-supplier','POST /trips/{id}/lines/{lineId}:undo-swap'],
  tests:['TEST tbcomp swaps and versions','TEST suppliers: data, coverage, rates, real-brand rules'],
  code:['v6/s10_tbcomp.js: tbcComp','v6/s10_tbcomp.js: tbSwap','v6/s10_tbcomp.js: tbUndo','v6/s1d_data.js: altsFor','v6/s1d_data.js: altCost']};

SPEC['trip:plan:map']={
  title:'Trip plan: Map',
  purpose:'See the route of the trip on a map and the order of the days.',
  roles:{view:['manager','accountant','agent'],act:[]},
  perms:[],
  data:['Trip.dest','Trip.items','Trip.nights','Venue.city'],
  actions:[
    {label:'View switch',does:'Returns to By day or By components.',rule:'Sets S.tbView. The map itself is read-only.'}],
  rules:[
    'City of a site: keyword table per destination (TBD_KW), else the catalog venue city, else the previous city.',
    'A day main city is its most frequent city; stops are the distinct consecutive cities that have map geometry.',
    'The view comes from geoViewFor(stops). On the USA view the route starts at Tulsa. Stops closer than 40 px merge.',
    'Day order card lists each day with its cities and sites; unscheduled sites are listed last.'],
  states:{empty:'A destination without geometry shows: No map for this destination. Here is the day order.',loading:DT_LOAD,error:DT_ERR},
  status:'pilot',
  api:['GET /trips/{id}/route'],
  tests:['TEST tbday'],
  code:['v6/s10_tbday.js: tbdMap','v6/s10_tbday.js: tbdRoute','tools/geo/geo_runtime.js: geoMap']};

SPEC['trip:costs']={
  title:'Pricing',
  purpose:'Set markups, discounts and unit costs and see the client price and planned profit.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['price.edit','price.discount','price.overrideMarkup','price.seeCost'],
  data:['Trip.markups','Trip.basis','Trip.disc','Trip.rate','Trip.cur','Trip.pax','Trip.ovh','Trip.brk','Line.qty','Line.cost','Line.cur','Line.ov','Line.comm','Line.type','Line.scope'],
  actions:[
    {label:'Markup is calculated: On cost / Of price',does:'Sets Trip.basis.',rule:'Changes every price.'},
    {label:'Locked rate (number)',does:'Sets Trip.rate.',rule:'Shown only for non-USD trips. 0.5 to 2. Editable in Quote stage only; read-only after acceptance (the change handler also refuses).'},
    {label:'Line detail (chevron)',does:'Expands the lines of a service type.',rule:'Per scope: shared or per person.'},
    {label:'Markup % per service type',does:'Sets Trip.markups[type].',rule:'0 to 90.'},
    {label:'Discount type and value per type',does:'Sets Trip.disc[scope|type] as % or $.',rule:'Value min 0; empty clears it.'},
    {label:'Unit cost and Markup override per line',does:'Sets Line.cost (min 0) and Line.ov (0 to 90, empty = type markup).',rule:'Overrides are counted under the type.'},
    {label:'Pricing extras: overhead and brokerage fee',does:'Sets Trip.ovh and Trip.brk (kind %, $, applies to shared, per person or both).',rule:'price.edit enforced: the controls are disabled without it.'},
    {label:'Create proposal',does:'Opens the Proposal tab.',rule:'None.'}],
  rules:[
    'planC = round2(qty * cost). mkOf = Line.ov if set, else Trip.markups[type].',
    'priceC = planC * (1 + m/100) on cost; planC / (1 - m/100) of price. price = round2(priceC * lrate).',
    'Discount %: base * min(100,v) / 100. Discount $: shared min(base,v); per person min(base, v * pax).',
    'Overhead and brokerage: % of the post-discount base (shared, pp or both), or a fixed $ (pp x pax). Brokerage also adds to plan cost, so profit does not change.',
    'rev = sum(price) - discounts + ovh + brk. comm = comm% * planC * lrate.',
    'planProfit = rev - plan + comm. Commission is never shown to the client.'],
  states:{empty:'A service scope with no lines is not shown.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['POST /pricing:preview','PATCH /quote-versions/{id}/lines/{lineId}','PUT /quote-versions/{id}/pricing'],
  tests:['TEST core ovh/brk','TEST prop formats and extras','check6: finance identities (planProfit - amtDiff - fx - fcProfit = 0)'],
  code:['v6/s4_views.js: pCosts','v6/s10_prop.js: prFeesCard','v6/s1_core.js: calc','v6/s1_core.js: priceC','v6/s1_core.js: discOf']};

SPEC['trip:quote']={
  title:'Proposal',
  purpose:'Show the client price in the format the client prefers and share it.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['prop.formats','prop.public','prop.send'],
  data:['Trip.name','Trip.items','Trip.pct','Trip.depDue','Trip.balDue','Trip.no','Trip.qst','Trip.stage','Trip.pax'],
  actions:[
    {label:'Format switch: PDF design / Agents table / Landing page',does:'Sets S.prFmt.',rule:'Same data, three views.'},
    {label:'Copy public link',does:'Copies the link to the clipboard.',rule:'Link = https://go.redbudtours.example/p/ + Trip.no (placeholder domain).'},
    {label:'Download PDF',does:'Switches to PDF design and opens the print dialog.',rule:'window.print is wrapped in try/catch.'},
    {label:'To quote approval',does:'Opens the Approval tab.',rule:'None.'}],
  rules:[
    'Price per traveler = rev / pax; group total = rev.',
    'Deposit = round2(rev * pct / 100); balance = rev - deposit.',
    'Supplier commissions and margins never appear in any format.',
    'Available at every stage; the landing page button changes with the quote status.'],
  states:{empty:'Days with no sites show Free day.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['GET /quote-versions/{id}','POST /quote-versions/{id}:send','GET /public/proposals/{token}'],
  tests:['TEST prop formats and extras'],
  code:['v6/s4_views.js: pQuote','v6/s10_prop.js: pQuote wrapper, prBar, prMaster']};

SPEC['trip:quote:pdf']={
  title:'Proposal: PDF design',
  purpose:'A printable document with itinerary, price, inclusions and payment schedule.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['prop.formats'],
  data:['Trip.items','Trip.dep','Trip.nights','Trip.pct','Trip.depDue','Trip.balDue','Trip.agent','Line.type'],
  actions:[
    {label:'Show price per traveler and group total (switch)',does:'Sets S.showPP.',rule:'Document only.'},
    {label:'Show what is included (switch)',does:'Sets S.showItems.',rule:'Lists service types that have lines.'},
    {label:'Show payment schedule (switch)',does:'Sets S.showSched.',rule:'Deposit and balance with due dates.'},
    {label:'Print / PDF',does:'Opens the print dialog.',rule:'try/catch; offline fallback toast.'}],
  rules:[
    'Hero shows dates, days and nights, country and travelers; Sent by is the file owner on today.',
    'Included list: Hotel accommodation, transportation (air and ground if the destination has air), guide, activities, meals, travel protection, only for types present.',
    'The document text is always English.'],
  states:{empty:'A day with no sites lists Free day.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['GET /quote-versions/{id}/document.pdf'],
  tests:['TEST prop formats and extras'],
  code:['v6/s4_views.js: pQuote (document)','v6/s10_prop.js: prPdf']};

SPEC['trip:quote:table']={
  title:'Proposal: Agents table',
  purpose:'Give partner agents an indicative price per traveler for several group sizes.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['prop.formats'],
  data:['Trip.pax','Trip.seg','Trip.markups','Trip.disc','Trip.ovh','Trip.brk','Line.qty','Line.cost','Line.type','Line.scope','Line.unit'],
  actions:[
    {label:'Format switch',does:'Returns to another format.',rule:'The table is read-only.'}],
  rules:[
    'Rows: 10, 15, 20, 25, 30, 40 travelers plus Your quote (real price).',
    'Each row re-prices a copy of the trip: quantities regenerate with genLines at n and at the real pax; each real line is scaled by that ratio.',
    'Per-person lines scale by n / pax; room-night lines by ceil(qty * n / pax).',
    'prTierPrice = round2(calc(copy).rev / n). Unit costs, markups, overrides, discounts, overhead and brokerage come from the trip; fixed $ amounts stay fixed.',
    'FOC places = floor(n / 20), informational only.',
    'Single supplement = lodging price / qty * nights * 0.5, only for Faith, Senior, Alumni; others show n/a.'],
  states:{empty:'The table always has rows.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['POST /pricing:preview (per group size)','GET /quote-versions/{id}/agent-table'],
  tests:['TEST prop formats and extras'],
  code:['v6/s10_prop.js: prTable','v6/s10_prop.js: prTierCalc','v6/s10_prop.js: prTierPrice','v6/s10_prop.js: prSingleSupp']};

SPEC['trip:quote:landing']={
  title:'Proposal: Landing page',
  purpose:'Preview what the client sees at the public link and let the client accept.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['prop.public'],
  data:['Trip.name','Trip.items','Trip.qst','Trip.stage','Trip.pct','Trip.depDue','Trip.balDue','Line.type'],
  actions:[
    {label:'Accept and pay deposit (client button)',does:'Sets Trip.qst = Negotiating and qdays = 0. No real payment.',rule:'Moves only a Draft or Sent quote.'},
    {label:'Copy public link',does:'Copies the placeholder link.',rule:'From the master bar.'}],
  rules:[
    'Price from = ceil(rev / pax) per traveler. Deposit = round2(rev * pct / 100).',
    'Button states: Approval = disabled, Waiting for manager approval; Negotiating or a file past Quote = disabled, deposit recorded or booking confirmed.',
    'Not included: personal expenses and gratuities, optional activities, plus travel protection or meals if absent.',
    'Commissions and margins never appear.'],
  states:{empty:'A day with no sites lists Free day.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['GET /public/proposals/{token}','POST /public/proposals/{token}:accept'],
  tests:['TEST prop formats and extras'],
  code:['v6/s10_prop.js: prLanding','v6/s10_prop.js: prAccept']};

SPEC['trip:tbver']={
  title:'Versions',
  purpose:'Save snapshots of the quote, compare any two and restore an earlier one.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['price.edit'],
  data:['Version.v','Version.at','Version.by','Version.note','Version.noteHe','Version.lines','Version.markups','Version.disc','Version.ovh','Version.brk','Version.totals','Trip.versions'],
  actions:[
    {label:'Save version (note up to 60 characters)',does:'Appends Version n+1 with a snapshot of lines, markups, discounts, overhead, brokerage and totals.',rule:'Quote stage and price.edit (enforced). Empty note becomes Version n.'},
    {label:'Compare: Version A and Version B (selects)',does:'Shows the differing lines, other changes and total deltas.',rule:'Includes Current (unsaved).'},
    {label:'Restore (click twice)',does:'Writes the snapshot back, removes alt0, rebuilds the supplier list and the room block hotel.',rule:'Quote stage and price.edit. Hidden when the version equals the current quote.'}],
  rules:[
    'Snapshot per line: sup, qty, cost, cur, comm, ov. Items, pax and dates are not restored.',
    'A line differs when any of sup, qty, cost, cur, comm, ov differs.',
    'Line total = round2(qty * cost * lrate); delta = total B - total A. Totals: rev, plan, planProfit, comm.',
    'Version number = highest existing + 1.'],
  states:{empty:'No versions yet: the list is empty and Current is the only option to compare.',loading:DT_LOAD,error:DT_ERR+' A past-Quote file shows a banner: versions are read-only.'},
  status:'pilot',
  api:['GET /trips/{id}/quote-versions','POST /trips/{id}/quote-versions','POST /quote-versions/{id}:restore','GET /quote-versions/compare?a=&b='],
  tests:['TEST tbcomp swaps and versions'],
  code:['v6/s10_tbcomp.js: tbcVerTab','v6/s10_tbcomp.js: tbVerSave','v6/s10_tbcomp.js: tbVerRestore','v6/s10_tbcomp.js: tbVerDiff']};

SPEC['trip:approve']={
  title:'Quote approval',
  purpose:'Move the quote from draft to manager approval, to the client, and open the file when the client accepts.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['prop.approve','prop.send'],
  data:['Trip.qst','Trip.qdays','Trip.stage','Trip.groups','Trip.tasks','Trip.sups','Trip.trav','Trip.room'],
  actions:[
    {label:'Send for manager approval',does:'Sets Trip.qst = Approval, qdays = 0.',rule:'Draft only.'},
    {label:'Approve and send to client',does:'Sets Trip.qst = Sent.',rule:'Needs can(prop.approve) (enforced in pApprove and in the qs handler). Others see: only someone who can approve proposals can approve and send.'},
    {label:'Client asked to close',does:'Sets Trip.qst = Negotiating.',rule:'Sent only.'},
    {label:'Client accepted: open the file',does:'winQuote: Trip.stage = Operations; creates groups (unpaid), tasks, supplier confirmations (Sent), travelers and a room block. Opens the Operation dashboard.',rule:'Shown when Sent or Negotiating (and from any gate card).'},
    {label:'To operations',does:'Opens the Operation dashboard.',rule:'Shown after the file is open.'},
    {label:'Status menu (project header): Mark as lost',does:'markLost: Trip.qst = Lost, qdays = 0. The stage stays Quote.',rule:'Open quotes only. A Lost quote leaves the pipeline, open-quote counts, team and agent dashboards, and shows under Archive.'}],
  rules:[
    'Steps: Draft, Approval, Sent, Negotiating, then File opened.',
    'Approval step shows price and planned margin = planProfit / rev.',
    'Room block after winning: held = rooms + 3, used = rooms, rooms = round(first line qty / nights).',
    'Sent shows how many days ago (Trip.qdays).'],
  states:{empty:'Not applicable.',loading:DT_LOAD,error:DT_ERR},
  status:'live',
  api:['POST /quote-versions/{id}:send','POST /quote-versions/{id}:accept','POST /trips/{id}:advance','POST /trips/{id}:lose'],
  tests:['check6: win, new and draft flows','TEST prop formats and extras'],
  code:['v6/s4_views.js: pApprove','v6/s6_rest.js: winQuote','v6/s6_rest.js: click handler (qs, win)']};

SPEC['trip:odash']={
  title:'Operation dashboard',
  purpose:'See what needs attention before departure and jump to tasks, suppliers or finance.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['ops.tasks','ops.suppliers','ops.blocks'],
  data:['Trip.dep','Trip.stage','Trip.tasks','Task.due','Task.done','Task.who','Trip.sups','Trip.room','Trip.room.held','Trip.room.used'],
  actions:[
    {label:'Due this week card',does:'Opens the Tasks tab. Subline: n overdue.',rule:'None.'},
    {label:'Suppliers not confirmed card',does:'Opens the Suppliers tab.',rule:'None.'},
    {label:'Estimated revenue card',does:'Opens the Finance dashboard.',rule:'None.'},
    {label:'Move to financial close (card, only after the trip returned)',does:'advanceStage: Trip.stage = Finance and opens the Finance dashboard.',rule:'Return date on or before today (none of the generated trips qualifies). The same move is in the project status menu, with the reason when it is not allowed.'}],
  rules:[
    'Days to trip = max(0, round((dep - today) / day)). Closed or Finance files say Trip is home.',
    'Due this week = not done and due on or before today + 7 days (overdue included); the subline counts the overdue ones, as the next-step bar does.',
    'Suppliers not confirmed = Trip.sups with st not Confirmed.',
    'Next tasks: the 6 earliest open tasks; pill Overdue, This week, or Planned.',
    'Room block: used / held; releasable = held - used, by dep - 30 days.'],
  states:{empty:'No open tasks: Every task is done.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'live',
  api:['GET /trips/{id}/dashboard/operations','GET /trips/{id}/room-blocks'],
  tests:['TEST ops tasks, master list, blocks','check6: all views per role in EN and HE'],
  code:['v6/s7b_product.js: pOpsDash','v6/s7b_product.js: ocard','v6/s1e_people.js: blockOf']};

SPEC['trip:optasks']={
  title:'Tasks',
  purpose:'Work the trip checklist by time window and see what is overdue.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['ops.tasks'],
  data:['Task.id','Task.k','Task.t','Task.who','Task.due','Task.done','Task.win','Trip.tasks'],
  actions:[
    {label:'Task checkbox',does:'Toggles Task.done.',rule:'ops.tasks is not enforced.'},
    {label:'Filter chips: Window, Status, Owner',does:'Sets S.opWin, S.opSt, S.opWho; counts follow the other two filters.',rule:'Windows with no matching rows are hidden.'}],
  rules:[
    'Library: 48 tasks in 7 windows (primary, 60-30, 30-14, 14-1, boxes, during, after). Added once per trip (ids from 101) for Operation, Finance, Closed.',
    'due = dep + offset; the After window counts from the return day (dep + nights). International-only tasks are skipped for domestic trips.',
    'Owner: a = trip agent, o = Ops desk, f = Accountant.',
    'Status: done; overdue = not done and due before today; else open. Due this week = open and due by today + 7.',
    'Seeded done: Finance and Closed all done; Operation past-due 85%, future 5%; a fresh won file starts with none done.'],
  states:{empty:'No match: No tasks match these filters.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'live',
  api:['GET /trips/{id}/tasks','PATCH /tasks/{id}','GET /task-templates'],
  tests:['TEST ops tasks, master list, blocks'],
  code:['v6/s10_ops.js: opTasksTab','v6/s10_ops.js: opInit','v6/s10_ops.js: opToggleTask','v6/s10_ops.js: TASK_LIB']};

SPEC['trip:spm']={
  title:'Suppliers',
  purpose:'Move each supplier from contact to approved and compare prices before choosing.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['ops.suppliers','sup.swap'],
  data:['Trip.sups','Supplier.n','Supplier.cat','Supplier.line','Supplier.st','Supplier.flow','Supplier.reqs','Line.sup','Line.cost','Line.inv'],
  actions:[
    {label:'Status: Contact / Pending / Approved / Price comparison',does:'Sets Supplier.flow and st (Not sent, Sent, Confirmed). A No reply status stays under Pending.',rule:'ops.suppliers (enforced: buttons disabled).'},
    {label:'Request quotes',does:'Marks every alternative as requested, reply by today + 3, and sets the flow to comparison.',rule:'ops.suppliers.'},
    {label:'Choose (in the comparison)',does:'Swaps the line supplier through tbSwap and clears requests.',rule:'Disabled if approved, the line has an invoice, the trip is Closed, or no sup.swap (tbSwap enforces it too). The list buttons need ops.suppliers.'},
    {label:'Add to list (unassigned components)',does:'Adds a supplier row for a line whose supplier is missing.',rule:'ops.suppliers.'},
    {label:'Supplier name link',does:'Opens the supplier card.',rule:'None.'},
    {label:'Confirmation message: supplier select, Copy message',does:'Builds a booking confirmation text for the chosen supplier and copies it.',rule:'Shown in Operation and Finance.'}],
  rules:[
    'Flow from status: Confirmed = approved; Sent or No reply = pending; else contact. The comparison flag overrides.',
    'Summary: x of n suppliers approved.',
    'Comparison cost change is for the whole line: (alt cost - cost) * qty * lrate.',
    'Real suppliers show a brand badge and no rating or reply time.'],
  states:{empty:'No comparison open: pick Price comparison on a supplier row.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'pilot',
  api:['GET /trips/{id}/suppliers','PATCH /trips/{id}/suppliers/{id}','POST /trips/{id}/suppliers/{id}:request-quotes','POST /trips/{id}/lines/{lineId}:swap-supplier'],
  tests:['TEST sp suppliers table, cards, in-trip flow, client card','TEST tbcomp swaps and versions'],
  code:['v6/s10_sup.js: spmTab','v6/s10_sup.js: spSetFlow','v6/s10_sup.js: spChooseWhy','v6/s10_sup.js: spChoose','v6/s4_views.js: supMsgCard']};

SPEC['trip:manifest']={
  title:'Master list',
  purpose:'Keep every traveler record complete: rooms, passports, forms and custom columns.',
  roles:{view:['manager','accountant','agent'],act:['manager','agent']},
  perms:['ops.manifest','ops.messages','cli.export'],
  data:['Traveler.n','Traveler.g','Traveler.room','Traveler.roomType','Traveler.dob','Traveler.pass','Traveler.passNo','Traveler.passExp','Traveler.diet','Traveler.emerg','Traveler.form','Traveler.x','Trip.mcols'],
  actions:[
    {label:'Send forms (primary)',does:'Marks every not sent form (registration, medical, waiver) as sent and copies the forms link.',rule:'Demo send. ops.messages is not enforced.'},
    {label:'Export CSV',does:'Downloads master-list-<no>.csv: one row per traveler, labels in the current language.',rule:'Falls back to a toast if the browser blocks the download.'},
    {label:'Import, then Apply updates / Cancel',does:'Previews 5 rows and applies them to existing travelers only.',rule:'Traveler and room counts never change; missing passports are first.'},
    {label:'Add column / remove column',does:'Adds or removes a custom column in Trip.mcols.',rule:'Name up to 28 characters, unique, at most 6 columns.'},
    {label:'Custom cell (text)',does:'Stores Traveler.x[col], up to 80 characters.',rule:'Only for existing columns.'}],
  rules:[
    'Passport warning: a passport is on file and expires before return day + 183 days.',
    'Form state per traveler and form: not sent, sent, done. Stat: travelers with all three done.',
    'Room summary compares rooms on the list by type with the block (blockOf).',
    'Domestic trips count emergency forms instead of passports.'],
  states:{empty:'No travelers: an empty table; counts show 0.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'live',
  api:['GET /trips/{id}/travellers','PATCH /travellers/{id}','POST /trips/{id}/travellers:send-forms','POST /imports','GET /exports/{id}'],
  tests:['TEST ops tasks, master list, blocks','TEST people travelers+blocks'],
  code:['v6/s10_ops.js: opManifestTab','v6/s10_ops.js: opSendForms','v6/s10_ops.js: opCsv','v6/s10_ops.js: opImportApply','v6/s10_ops.js: opPassWarn']};

SPEC['trip:people']={
  title:'Billing',
  purpose:'See what each household owes, what is paid and who is late, and copy their payment link.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant','agent']},
  perms:['fin.view','fin.recordPayment'],
  data:['Group.name','Group.size','Group.depPaid','Group.balPaid','Trip.pct','Trip.depDue','Trip.balDue','Trip.pax','Traveler.room','Traveler.diet','Traveler.pass'],
  actions:[
    {label:'Copy payment link',does:'Copies https://pay.redbudtours.example/<household> (placeholder domain).',rule:'No payment is recorded in the demo.'}],
  rules:[
    'Household amount = round2(rev * size / pax); the last row absorbs the rounding so rows add up to rev.',
    'dep = round2(amt * pct / 100); bal = amt - dep; paid = dep if depPaid + bal if balPaid; open = amt - paid.',
    'Late: deposit unpaid after depDue, balance unpaid after balDue; days = longest overdue.',
    'Shared costs split equally: sum of shared line prices / pax. Per-person costs are charged to each traveler.',
    'Per head = rev / pax.'],
  states:{empty:'No households: empty table.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'pilot',
  api:['GET /trips/{id}/groups','POST /client-invoices/{id}/payments','GET /trips/{id}/travellers'],
  tests:['check6: finance identities','check6: all views per role in EN and HE'],
  code:['v6/s4_views.js: pPeople','v6/s1_core.js: groupsCalc','v6/s1_core.js: lateInfo']};

SPEC['trip:fdash']={
  title:'Finance dashboard',
  purpose:'See the trip money at a glance: planned versus expected profit and what is still to collect.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant']},
  perms:['fin.view'],
  data:['Trip.pax','Trip.groups','Line.inv','Invoice.amt','Invoice.credit','Invoice.st','Gap.usd','Group.depPaid','Group.balPaid'],
  actions:[
    {label:'Check invoices',does:'Opens the Expenses tab. Shown when supplier invoices are waiting in the inbox; the heading then says they are not checked yet and profit may change.',rule:'Primary button when the inbox is not empty.'},
    {label:'Open expenses',does:'Opens the Expenses tab, shown when open gaps exist and no invoices are waiting.',rule:'None.'},
    {label:'Accounting sync chip',does:'Shows the books system once connected.',rule:'Pilot; appears only after Accounting sync is connected.'},
    {label:'Close the file (next-step bar, status menu)',does:'advanceStage: Trip.stage = Closed.',rule:'Allowed only with no open gaps, no supplier invoices waiting in the inbox and nothing left to collect (groupsCalc outstanding = 0); otherwise disabled with the reasons listed.'}],
  rules:[
    'Stats: trip total = rev; planned profit = rev - plan + comm; expected profit = rev - fc + comm; remaining = rev - collected.',
    'Leak = planProfit - fcProfit (leakModel). The bridge is supplier differences by kind plus FX.',
    'Open gaps: gaps with status open or disputed and usd above 0.',
    'The identity planProfit - amtDiff - fx - fcProfit = 0 holds for every trip.'],
  states:{empty:'No leak and nothing waiting: No differences between invoices and the quote.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'pilot',
  api:['GET /reports/trip-pnl/{tripId}','GET /reports/leaks?scope=trip&id={tripId}'],
  tests:['check6: leak bridge identities per scope and dimension','check6: finance identities'],
  code:['v6/s7b_product.js: pFinDash','v6/s7_leak.js: leakModel','v6/s9a_books.js: acChip']};

SPEC['trip:income']={
  title:'Income',
  purpose:'See the deal invoices and receipts for each household and how much is billed, received and remaining.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant']},
  perms:['fin.view','fin.issueDocs'],
  data:['Group.name','Group.dep','Group.bal','Group.depPaid','Group.balPaid','Trip.pct','Trip.depDue','Trip.balDue','Trip.no'],
  actions:[
    {label:'Search (text)',does:'Filters documents by client name.',rule:'Resets to page 1.'},
    {label:'Tabs: All / Deal invoices / Receipts',does:'Filters by document type.',rule:'Counts shown.'},
    {label:'Rows per page (5, 10, 25) and paging',does:'Pages the table.',rule:'None.'},
    {label:'Issue document, Filters',does:'Show a toast only (simulated).',rule:'Issue document is disabled without fin.issueDocs (enforced).'}],
  rules:[
    'Documents are derived, not stored: per household a deal invoice for the deposit and for the balance.',
    'A deal invoice exists if paid or its due date is within today + 30 days; dated due - 21 days.',
    'A paid item also gets a receipt (type receipt) dated on the due date.',
    'Footer: Trip total = rev; Amount billed = sum of deal invoices; Payment received = collected; Remaining = outstanding.',
    'Status: Payment received, or Payment requested.'],
  states:{empty:'No documents.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'pilot',
  api:['GET /trips/{id}/client-invoices','POST /client-invoices/{id}:issue','GET /client-invoices/{id}/payments'],
  tests:['check6: all views per role in EN and HE','check6: finance identities'],
  code:['v6/s7b_product.js: pIncome','v6/s7b_product.js: incomeDocs','v6/s1_core.js: groupsCalc']};

SPEC['trip:tfin']={
  title:'Expenses and invoice check',
  purpose:'Match each supplier invoice line to what was quoted and recover the difference.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant']},
  perms:['fin.view','fin.dispute','fin.approveBills'],
  data:['Line.inv','Invoice.no','Invoice.amt','Invoice.credit','Invoice.paid','Invoice.rate','Invoice.st','Invoice.kind','Gap.usd','Gap.kind','Trip.inbox','Trip.stage'],
  actions:[
    {label:'Read and match invoices',does:'Reads the inbox sample files and attaches them to quote lines (applyInbox) with an animation.',rule:'Shown while Trip.inbox has files.'},
    {label:'Draft dispute / View email / Copy / Mark as sent',does:'Builds the credit-note email; Mark as sent sets Invoice.st = disputed.',rule:'Open gaps with an overbill. fin.dispute is not enforced.'},
    {label:'Credit received',does:'gapCredit: adds the difference to Invoice.credit, sets st = credited and Invoice.paid = true (as the generator does).',rule:'Disputed gaps only.'},
    {label:'Accept charge / Checked, nothing missing',does:'Sets Invoice.st = accepted.',rule:'Under-billed gaps use Checked.'},
    {label:'Request invoice',does:'Toast only.',rule:'Missing invoices, Finance and Closed files.'},
    {label:'Documents: Payment request / Supplier voucher',does:'Switches the sample document and its household or supplier select.',rule:'Sample layout.'}],
  rules:[
    'invStatus: none if no invoice; diff = effAmt - planC; match if |diff| below 0.005; else gap. effAmt = amt - credit.',
    'Gap kinds: rooms (qty on Lodging), qty, rate, comp, extra, dup, under, missing.',
    'Gap USD = diff (or credit if credited) * lrate. Open gap = open or disputed and usd above 0.',
    'amtDiff = (effAmt - planC) * lrate; fx = paid and non-USD ? effAmt * (inv.rate - Trip.rate) : 0.',
    'If open gaps are credited, margin = (fcProfit + open) / rev.',
    'Real-brand rule: gap stories use fictional suppliers only; brandSwap skips trips with a gap.'],
  states:{empty:'No gaps: No gaps in the invoices received so far.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE+' It still shows planned price, profit and commission.'},
  status:'pilot',
  api:['GET /supplier-invoices?tripId=','POST /supplier-invoices/{id}:confirm','GET /gaps?tripId=','POST /gaps/{id}:dispute','POST /gaps/{id}:accept','POST /disputes/{id}:send','/supplier-credits'],
  tests:['check6: gap flows (dispute, credit, accept)','check6: finance identities','check6: invoice reading','TEST suppliers: data, coverage, rates, real-brand rules'],
  code:['v6/s5_fin.js: pTripFin','v6/s5_fin.js: gapCard','v6/s1_core.js: invStatus','v6/s1_core.js: tripGaps','v6/s3_shell.js: startReading']};

SPEC['trip:vouch']={
  title:'Vouchers and documents',
  purpose:'Produce the household payment request and the supplier voucher.',
  roles:{view:['manager','accountant','agent'],act:['manager','accountant']},
  perms:['fin.issueDocs'],
  data:['Group.name','Group.size','Group.dep','Group.bal','Trip.sups','Line.name','Line.qty','Line.unit','Line.cost','Trip.no'],
  actions:[
    {label:'Payment request / Supplier voucher',does:'Switches the sample document (S.docMode).',rule:'Sample layout.'},
    {label:'Household select / Supplier select',does:'Chooses whose document to show.',rule:'Payment request uses households; voucher uses suppliers.'}],
  rules:[
    'Payment request: deposit pct% due depDue, balance due balDue, total in USD. Sales tax is not modeled.',
    'Voucher number V-<Trip.no>-<Line.id>; shows service, quantity and agreed cost (planC).',
    'The tab shows only the Documents card of the Expenses tab.'],
  states:{empty:'No documents.',loading:DT_LOAD,error:DT_ERR,gated:DT_GATE},
  status:'pilot',
  api:['GET /trips/{id}/vouchers','POST /vouchers/{id}:issue'],
  tests:['check6: all views per role in EN and HE'],
  code:['v6/s7b_product.js: pVouch','v6/s5_fin.js: pTripFin (Documents card)']};

/* the old Digest tab was merged into the Operation dashboard and the Suppliers tab (v8.1) */
SPEC['trip:ops']={redirect:'odash'};

/* ---------- test: every key and every contract field ---------- */
TESTS.push({name:'dt trip developer notes',run:h=>{
  const out=[],keys=['general','plan','plan:day','plan:comp','plan:map','costs','quote','quote:pdf','quote:table','quote:landing','tbver','approve','odash','optasks','spm','manifest','people','fdash','income','tfin','vouch'];
  const tabs=h.X.PTABS.map(p=>p[0]),names=h.X.TESTS.map(x=>x.name),str=v=>typeof v==='string'&&v.trim().length>0;
  const list=(v,k,n)=>{if(!Array.isArray(v))return out.push(k+' '+n+' not an array');if(v.length>(n==='data'?20:8))out.push(k+' '+n+' has '+v.length+' items');v.forEach(x=>{if(!str(x))out.push(k+' '+n+' empty item');});};
  keys.forEach(k=>{
    const e=SPEC['trip:'+k];if(!e){out.push('missing trip:'+k);return;}
    if(!tabs.includes(k.split(':')[0]))out.push('no such tab '+k);
    ['title','purpose'].forEach(f=>{if(!str(e[f]))out.push(k+' '+f);});
    if(!e.roles||!Array.isArray(e.roles.view)||!Array.isArray(e.roles.act)||!e.roles.view.length)out.push(k+' roles');
    ['perms','data','rules','api','tests','code'].forEach(f=>{if(f==='perms'){if(!Array.isArray(e.perms))out.push(k+' perms');else e.perms.forEach(p=>{if(typeof PERM_BY==='undefined'||!PERM_BY[p])out.push(k+' unknown perm '+p);});}else list(e[f],k,f);});
    if(!e.data.every(d=>/^[A-Z][A-Za-z]*\.[A-Za-z0-9.]+$/.test(d)))out.push(k+' data format');
    if(!Array.isArray(e.actions)||!e.actions.length||e.actions.length>8)out.push(k+' actions');
    else e.actions.forEach(a=>{if(!str(a.label)||!str(a.does)||!str(a.rule))out.push(k+' action '+(a.label||'?'));});
    if(!e.states||!str(e.states.empty)||!str(e.states.loading)||!str(e.states.error))out.push(k+' states');
    if(['live','pilot','roadmap'].indexOf(e.status)<0)out.push(k+' status');
    (e.tests||[]).forEach(x=>{if(!/^check6: /.test(x)&&!names.includes(x.replace(/^TEST /,'')))out.push(k+' unknown test '+x);});
    (e.code||[]).forEach(x=>{if(!/^[\w./-]+\.js: .+/.test(x))out.push(k+' code format '+x);});
  });
  /* gated tabs (Operation and Finance) describe the Quote-stage gate */
  ['odash','optasks','spm','manifest','people','fdash','income','tfin','vouch'].forEach(k=>{const e=SPEC['trip:'+k];if(e&&!(e.states&&str(e.states.gated)))out.push(k+' states.gated');});
  const r=SPEC['trip:ops'];if(!r||r.redirect!=='odash'||Object.keys(r).length!==1||!SPEC['trip:odash'])out.push('ops redirect');
  return out;}});
