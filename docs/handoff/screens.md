# Screens: developer notes

Generated from the `SPEC` registry by `node tools/spec/export_spec.js`. Do not edit by hand: edit `v6/s11_spec.js` (global pages, role homes, drawers, modals) or `v6/s11_spec_trip.js` (trip tabs) and run the export again.
The same text shows in the demo: Settings menu, "Show developer notes". API paths are suggestions that follow `docs/backend-plan/03-api.md`; a path marked (proposed) is not in that plan yet.

## Coverage

| Group | Screens | With a spec |
|---|---|---|
| Role homes | 3 | 3 |
| Pages | 18 | 18 |
| Trip tabs: Quotation | 6 | 6 |
| Trip tabs: Operation | 5 | 5 |
| Trip tabs: Finance | 4 | 4 |
| Drawers and modals | 33 | 33 |
| **Total** | **69** | **69 (100%)** |

Status of the documented screens: 22 Live, 24 Pilot, 22 Roadmap (as in `FEAT`, `v6/s9b_status.js`).

## Contents

- Role homes
  - [Home, owner (command center)](#home-manager) (`home:manager`)
  - [Home, accountant](#home-accountant) (`home:accountant`)
  - [Home, sales agent](#home-agent) (`home:agent`)
- Pages
  - [Projects (quotes and files)](#quotes) (`quotes`)
  - [Templates](#templates) (`templates`)
  - [Hotels](#hotels) (`hotels`)
  - [Suppliers](#suppliers) (`suppliers`)
  - [Activities](#activities) (`activities`)
  - [Users](#users) (`users`)
  - [Settings](#settings) (`settings`)
  - [Clients](#clients) (`clients`)
  - [Trip studio](#studio) (`studio`)
  - [Profit leaks](#leaks) (`leaks`)
  - [Invoice check](#gaps) (`gaps`)
  - [Finance dashboard](#finance) (`finance`)
  - [Accounting sync](#books) (`books`)
  - [Maya, AI assistant](#ai) (`ai`)
  - [What's live](#status) (`status`)
  - [Photo credits](#credits) (`credits`)
  - [Form builder and traveler forms](#page-forms) (`page:forms`)
  - [UI kit](#page-uikit) (`page:uikit`)
- Trip tabs: Quotation
  - [General details](#trip-general) (`trip:general`)
  - [Trip plan](#trip-plan) (`trip:plan`)
  - [Pricing](#trip-costs) (`trip:costs`)
  - [Proposal](#trip-quote) (`trip:quote`)
  - [Quote approval](#trip-approve) (`trip:approve`)
  - [Versions](#trip-tbver) (`trip:tbver`)
- Trip tabs: Operation
  - [Billing](#trip-people) (`trip:people`)
  - [Operation dashboard](#trip-odash) (`trip:odash`)
  - [Suppliers](#trip-spm) (`trip:spm`)
  - [Tasks](#trip-optasks) (`trip:optasks`)
  - [Master list](#trip-manifest) (`trip:manifest`)
- Trip tabs: Finance
  - [Expenses and invoice check](#trip-tfin) (`trip:tfin`)
  - [Finance dashboard](#trip-fdash) (`trip:fdash`)
  - [Income](#trip-income) (`trip:income`)
  - [Vouchers and documents](#trip-vouch) (`trip:vouch`)
- Drawers and modals
  - [Supplier card](#drawer-supplier) (`drawer:supplier`)
  - [Client card](#drawer-client) (`drawer:client`)
  - [Entity form (modal)](#modal-form) (`modal:form`)
  - [Trip plan: By day](#trip-plan-day) (`trip:plan:day`)
  - [Trip plan: By components](#trip-plan-comp) (`trip:plan:comp`)
  - [Trip plan: Map](#trip-plan-map) (`trip:plan:map`)
  - [Proposal: PDF design](#trip-quote-pdf) (`trip:quote:pdf`)
  - [Proposal: Agents table](#trip-quote-table) (`trip:quote:table`)
  - [Proposal: Landing page](#trip-quote-landing) (`trip:quote:landing`)
  - [undefined](#trip-ops) (`trip:ops`)
  - [Portal frame (external viewpoints)](#portal-frame) (`portal:frame`)
  - [Home, operations coordinator](#home-ops) (`home:ops`)
  - [Group leader portal: home](#portal-leader-home) (`portal:leader:home`)
  - [Group leader portal: trip](#portal-leader-trip) (`portal:leader:trip`)
  - [Group leader portal: payments](#portal-leader-pay) (`portal:leader:pay`)
  - [Group leader portal: travelers](#portal-leader-people) (`portal:leader:people`)
  - [Group leader portal: documents](#portal-leader-docs) (`portal:leader:docs`)
  - [Group leader portal: messages](#portal-leader-msgs) (`portal:leader:msgs`)
  - [Traveler app: home](#portal-traveler-home) (`portal:traveler:home`)
  - [Traveler app: pay](#portal-traveler-pay) (`portal:traveler:pay`)
  - [Traveler app: forms](#portal-traveler-forms) (`portal:traveler:forms`)
  - [Traveler app: plan](#portal-traveler-plan) (`portal:traveler:plan`)
  - [Traveler app: help](#portal-traveler-help) (`portal:traveler:help`)
  - [Supplier portal: home](#portal-supplier-home) (`portal:supplier:home`)
  - [Supplier portal: booking requests](#portal-supplier-req) (`portal:supplier:req`)
  - [Supplier portal: rooming lists](#portal-supplier-list) (`portal:supplier:list`)
  - [Supplier portal: invoices](#portal-supplier-inv) (`portal:supplier:inv`)
  - [Supplier portal: queries](#portal-supplier-disp) (`portal:supplier:disp`)
  - [Supplier portal: payments](#portal-supplier-pay) (`portal:supplier:pay`)
  - [Run sheet: day](#portal-guide-day) (`portal:guide:day`)
  - [Run sheet: passengers](#portal-guide-pax) (`portal:guide:pax`)
  - [Run sheet: vouchers](#portal-guide-vouch) (`portal:guide:vouch`)
  - [Run sheet: notes](#portal-guide-notes) (`portal:guide:notes`)

## Role homes

<a id="home-manager"></a>

### Home, owner (command center)

`home:manager` · Status: Pilot

Tell the owner in one screen how the season stands, what needs them today, and where profit is leaking or can be recovered.

**Roles.** View: manager. Act: manager. Permissions: `proj.viewAll`, `fin.view`.

**Data.** `Trip.stage`, `Trip.qst`, `Trip.dep`, `Trip.dest`, `Trip.agent`, `Trip.pax`, `Line.cost`, `Invoice.amt`, `Gap.kind`, `Group.depPaid`, `Group.balPaid`, `Task.done`, `Staff.target`

| Control | Does | Guard |
|---|---|---|
| Recover $X | Opens Invoice check with the open gaps | Amount = leakModel().rec (open supplier gaps, USD) |
| Build a trip | Opens the Trip studio | Always available |
| Today: step button | Opens the trip tab the step names, or advances the stage | Top 6 of nxAgentSteps(visibleTrips()), urgent first, then by departure |
| Departure card | Opens the trip (dashboard, or general for quotes) | Next 8 departures from today, Lost quotes excluded |
| Stage card | Opens Projects on the matching tab | Quotation→quotes, Operation and Finance→files, Closed→archive |
| Recovered / Still open / At risk | Open Invoice check or Profit leaks | From leakModel(): got, rec, late+release |

**Rules**
- `kept % = expected profit / planned profit = P.fp / P.pp`
- `Leaked = P.pp − P.fp = leakModel().leak`
- `Quotation value = Σ calc(t).rev of open quotes = portfolio().pipeline`
- `Σ Operation + Finance + Closed values = portfolio().rev`
- `Readiness ring = dbReadiness(t).overall (tasks, passports, suppliers, deposits)`
- `Cash = portfolio().cash for the next 6 months (in = client payments due, out = supplier payments due)`
- `Team attainment = booked / Staff.target`

**States**
- empty: No files: the "No trips here" card.
- loading: Not applicable (local data).
- error: Missing photos fall back to the brand gradient.

**Suggested API**
- `GET /v1/t/{tenantId}/dashboard/owner (proposed)`
- `GET /v1/t/{tenantId}/reports/trip-pnl`
- `GET /v1/t/{tenantId}/trips?from=today&limit=8 (proposed)`

**Tests**
- `TEST hc home command center`
- `TEST db manager and agent dashboards`

**Code**
- `v6/s12_home.js: hcHome, hcModel, hcHero, hcToday, hcProfit, hcDepartures, hcPipeline, hcCash, hcTeam, hcStudio`
- `v6/m_home.css`

<a id="home-accountant"></a>

### Home, accountant

`home:accountant` · Status: Pilot

The money to collect and pay: receivables, payables schedule, documents to issue, FX exposure and a month-end checklist.

**Roles.** View: accountant. Act: accountant. Permissions: `fin.view`, `fin.approveBills`, `fin.issueDocs`, `fin.sync`.

**Data.** `Group.depPaid`, `Group.balPaid`, `Trip.depDue`, `Trip.balDue`, `Invoice.amt`, `Invoice.paid`, `Line.cur`, `Doc.type`

| Control | Does | Guard |
|---|---|---|
| Hero KPI tiles | Switch the detail card to AR next 30 days, overdue, bills to approve, open gaps or commission receivable. | daDet(key); no data change |
| Approve (bills to approve) | Marks a matched supplier bill as approved for payment and removes it from the list. | Only bills whose invoice status is match and not yet paid; kept in DA_STATE.ap |
| Issue (documents to issue) | Marks a deal invoice as issued. | Only deal documents with status req; kept in DA_STATE.iss |
| AP week row | Filters the payables detail to that 7-day week. | Weeks count from TODAY; week 0 = TODAY..TODAY+6 |
| Month-end item | Jumps to Invoice check, the detail card or Finance. | An item is done when its count is 0 |

**Rules**
- `AR next 30 = unpaid deposit or balance with due date in [TODAY, TODAY+30]  (daArNext30)`
- `overdue = portfolio().aging, buckets 1-30, 31-60, over 60 days`
- AP date: Finance or Closed trips TODAY+20, Operations trips dep-14; past dates clamp to this week  (portfolio cash-out rule)
- `bill amount in USD = effAmt(inv) * lrate(t, l), where effAmt = amt - credit`
- `FX exposure = unpaid foreign-currency payables at each trip locked rate  (portfolio().fxExp)`

**States**
- empty: noTrip() when no trips are visible; each card shows its own "nothing to do" line
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/reports/cashflow`
- `GET /v1/t/{tenantId}/supplier-invoices?status=matched`
- `POST /v1/t/{tenantId}/supplier-invoices/{id}:confirm`
- `POST /v1/t/{tenantId}/client-invoices/{id}:issue`
- `GET /v1/t/{tenantId}/commissions`

**Tests**
- `TEST hc home command center`
- `TEST da accountant dashboard`
- `check6.js: every view renders for each role in EN and HE`

**Code**
- `v6/s12_home.js: hcAcct, hcShell`
- `v6/s10_dacct.js: dbAcct, daArNext30, daOverdue, daBillsToApprove, daMonthEnd`
- `v6/s5_fin.js: gapStats`

<a id="home-agent"></a>

### Home, sales agent

`home:agent` · Status: Pilot

One agent: own quote pipeline, next departures with readiness, tasks due this week, numbers against the annual target and pending traveler forms.

**Roles.** View: agent. Act: agent. Permissions: `ops.tasks`, `ai.maya`.

**Data.** `Trip.agent`, `Trip.qst`, `Trip.qdays`, `Task.done`, `Task.due`, `Traveler.form`, `Staff.target`

| Control | Does | Guard |
|---|---|---|
| Pipeline card | Opens the quote (Approval cards open the approval tab). | Only the agent own trips; a Sent quote older than 7 days is flagged late |
| Done (My week) | Marks a task done and removes it from the list. | dbTaskDone(tripId, taskId); the agent sees only own trips |
| Forms pending row | Opens the trip People tab. | Travelers with a registration, medical or waiver form not done |
| Departures row | Opens the trip; four readiness bars. | Non-Quote trips, readiness as on the manager home |

**Rules**
- `booked = sum calc(t).rev of own non-Quote trips; target = STAFF target; attainment = booked / target`
- `margin = portfolio(own).fp / rev, compared with the team average`
- `follow-up due = quote status Sent and qdays > 7`
- `overdue task = not done and due before TODAY`

**States**
- empty: noTrip(): agents see only their own files
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/trips?agent=me`
- `GET /v1/t/{tenantId}/trips/{id}/tasks?due= (proposed)`
- `GET /v1/t/{tenantId}/reports/agent-numbers (proposed)`

**Tests**
- `TEST hc home command center`
- `TEST db manager and agent dashboards`
- `check6.js: every view renders for each role in EN and HE`

**Code**
- `v6/s12_home.js: hcAgent, hcShell`
- `v6/s10_dash.js: dbAgent, dbAgentKpis, dbWeekCard, dbNumbersCard, dbFormsCard`

## Pages

<a id="quotes"></a>

### Projects (quotes and files)

`quotes` · Status: Live

List of every quote and file with search, group-type filter and tabs; the entry point to a trip.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `proj.viewAll`, `proj.create`.

**Data.** `Trip.no`, `Trip.name`, `Trip.stage`, `Trip.qst`, `Trip.dep`, `Trip.client`, `Trip.seg`, `Trip.agent`

| Control | Does | Guard |
|---|---|---|
| + New file | Creates a blank quote and opens its General details tab. | Agents become the file owner; the manager gets Priya |
| Open | Opens the trip. | Agents see only their own trips (canSee) |
| Duplicate | Creates next year quote with the same destination, group, size and client; no invoices, no travelers. | Name loses its year suffix; departure +210 days from TODAY |
| Tabs Quotes / Files / Archive / All | Filters by stage. | Quotes = stage Quote; Files = Operations or Finance; Archive = Closed |
| Search, group type, rows per page | Filters on name, client, #, destination; pages 8, 16 or all. | Client-side filter |

**Rules**
- `sort = departure date ascending`
- tab counts use the same filter as the list, ignoring the tab
- `visible trips = all for manager and accountant, own for an agent`

**States**
- empty: noTrip() when the viewer has no trips; an empty tab shows an empty table
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/trips?stage=&q=&seg=&cursor=&limit=`
- `POST /v1/t/{tenantId}/trips`
- `POST /v1/t/{tenantId}/trips/{id}:duplicate (proposed)`

**Tests**
- `check6.js: every view renders for each role in EN and HE`
- `check6.js: win, new quote and draft flows`

**Code**
- `v6/s4_views.js: vQuotes`
- `v6/s6_rest.js: blankQuote, click handler newq and dup`

<a id="templates"></a>

### Templates

`templates` · Status: Live

Past trips become templates; duplicating makes next year quote. Day templates add a ready day to a plan.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `price.templates`, `proj.create`.

**Data.** `Trip.name`, `Trip.dest`, `Trip.seg`, `Trip.nights`, `Trip.items`, `Item.name`, `Item.hrs`, `Item.day`

| Control | Does | Guard |
|---|---|---|
| Duplicate (trip card) | Creates a new quote with the same plan and suppliers, without invoices or travelers. | Same handler as Duplicate on Projects |
| Day template list | Read only here; templates are added from the plan tab. | addtpl runs on the plan tab with an open day |

**Rules**
- `cards = visible non-Quote trips`
- a day template is a list of [site, hours] pairs

**States**
- empty: No cards when the viewer has no non-Quote trips
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/trips?stage=closed`
- `POST /v1/t/{tenantId}/trips/{id}:duplicate (proposed)`
- `GET /v1/t/{tenantId}/day-templates (proposed)`

**Tests**
- `check6.js: every view renders for each role in EN and HE`

**Code**
- `v6/s6_rest.js: vTemplates, DAYTPL click handlers (dup, addtpl)`

<a id="hotels"></a>

### Hotels

`hotels` · Status: Live

Real hotel catalog (65) by brand and destination, with group rates and the files using each; room blocks by trip below.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `cat.edit`, `ops.blocks`.

**Data.** `Hotel.name`, `Hotel.family`, `Hotel.dest`, `Hotel.stars`, `Hotel.rate`, `Block.held`, `Block.used`, `Block.cutoff`

| Control | Does | Guard |
|---|---|---|
| New hotel | Opens the hotel form. | formOpen("hotel", null) |
| Brand chips, destination, search | Filter the catalog. | Client-side |
| Row chevron | Opens the supplier card of that hotel. | Only when a supplier with that name exists, else a toast |
| Room blocks row | Opens the trip Master list tab. | Exposure = unreleased rooms x nights x rate |

**Rules**
- rate and ratings are illustrative; every catalog entry carries a src URL
- a real hotel name never sits next to negative wording (brand rule)
- `release exposure = (held - used) * nights * lodging cost, when the release date (dep - 30) has passed  (releaseRisk)`

**States**
- empty: "No results match these filters."
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/reference/hotels?q=&dest=`
- `GET /v1/t/{tenantId}/catalog-items?kind=hotel`
- `POST /v1/t/{tenantId}/catalog-items:import-from-reference`
- `GET /v1/t/{tenantId}/trips/{id}/room-blocks`

**Tests**
- `TEST ops tasks, master list, blocks`
- `check6.js: hotels screen, real-brand guard`

**Code**
- `v6/s7c_lists.js: vHotelsList`
- `v6/s10_ops.js: opBlocksCard`
- `v6/s1c_catalog.js: CATALOG`

<a id="suppliers"></a>

### Suppliers

`suppliers` · Status: Pilot

The supplier bank (344 suppliers) with terms, rate cards and alternatives; plus the price list and the price-list import.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `sup.edit`, `sup.rates`.

**Data.** `Supplier.name`, `Supplier.cat`, `Supplier.dest`, `Supplier.pref`, `Supplier.rating`, `Supplier.cur`, `Supplier.comm`, `Supplier.real`

| Control | Does | Guard |
|---|---|---|
| New supplier | Opens the supplier form. | Disabled without sup.edit |
| Tabs Supplier bank / Price list / Import | Switch S.sub. | Import parses a messy price list into rows with flags before adding them |
| Filters and search | Destination, category, preference, free text. | Sorted by spend then by trips used |
| Row chevron | Opens the supplier card. | spOpen(id) |

**Rules**
- `spend and trips = per supplier over lines of visible trips (spUse)`
- `real suppliers (real = true) show brand badge and star level, never rating, reply time or negative wording`
- `rate card = season x pax band x variant (rateFor)`

**States**
- empty: Empty table body when a filter matches nothing
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/suppliers?dest=&cat=&q=`
- `POST /v1/t/{tenantId}/suppliers`
- `GET /v1/t/{tenantId}/suppliers/{id}/rates`

**Tests**
- `TEST suppliers: data, coverage, rates, real-brand rules`
- `TEST sp suppliers table, cards, in-trip flow, client card`

**Code**
- `v6/s10_sup.js: spPage, spList, spFiltered`
- `v6/s6_rest.js: vSuppliers (price list, import)`
- `v6/s1d_data.js: SUPPLIERS, rateFor`

<a id="activities"></a>

### Activities

`activities` · Status: Live

Catalog of venues and attractions (82) with price per person and commission; feeds the plan day-load check.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `cat.edit`.

**Data.** `Venue.name`, `Venue.dest`, `Venue.city`, `Venue.kind`, `Venue.cost`, `Venue.comm`, `Venue.hrs`

| Control | Does | Guard |
|---|---|---|
| New activity | Opens the activity form. | formOpen("activity", null) |
| Location, Voucher only, Group rate only, search | Filter the list. | Voucher only = commission > 0; group rate only = cost > 0 |
| Row chevron | Shows a toast; the detail page is in the full product. | No detail screen in the demo |

**Rules**
- each site brings supplier, cost per person, commission and estimated hours
- estimated hours feed the day-load warning (over 9 h) on the plan tab

**States**
- empty: "No results match these filters."
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/reference/venues?q=&dest=`
- `GET /v1/t/{tenantId}/catalog-items?kind=activity`
- `POST /v1/t/{tenantId}/catalog-items`

**Tests**
- `check6.js: every view renders for each role in EN and HE`
- `check6.js: real-brand guard`

**Code**
- `v6/s7c_lists.js: vActivitiesList, alActRows`
- `v6/s1c_catalog.js: CATALOG.venues`

<a id="users"></a>

### Users

`users` · Status: Live

The agency staff by role, with their file counts; "View as this user" switches the demo to that person.

**Roles.** View: manager. Act: manager. Permissions: `users.manage`.

**Data.** `Staff.name`, `Staff.role`, `Staff.target`, `Trip.agent`

| Control | Does | Guard |
|---|---|---|
| View as this user | Switches S.role so every screen shows what that user sees. | Demo-only impersonation; the product would use an invite and role assignment |

**Rules**
- page is gated: without users.manage it renders noAccess()
- `files = all trips for the owner, own trips for an agent`
- roles: owner (manager), accountant, six agents

**States**
- empty: Not applicable: the staff list is fixed
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/members`
- `POST /v1/t/{tenantId}/invitations`
- `PATCH /v1/t/{tenantId}/members/{id}`
- `DELETE /v1/t/{tenantId}/members/{id}`

**Tests**
- `TEST st settings`
- `TEST people data`
- `check6.js: every view renders for each role in EN and HE`

**Code**
- `v6/s6_rest.js: vUsers`
- `v6/s9_boot.js: NAV_PERM wrapper`

<a id="settings"></a>

### Settings

`settings` · Status: Live

Organization formats, roles and permissions matrix, stages and statuses, and links to forms and accounting sync.

**Roles.** View: manager, accountant, agent. Act: manager. Permissions: `settings.edit`, `users.roles`, `settings.stages`.

**Data.** `Org.name`, `Org.cur`, `Org.tax`, `Perm.key`, `Perm.role`, `Stage.items`

| Control | Does | Guard |
|---|---|---|
| Tabs Organization / Roles / Stages / Forms / Integrations | Switch S.stSub. | Read-only banner without settings.edit |
| Permission switch | Overrides a permission for admin, agent or accountant. | Owner column is locked; 8 permissions are enforced in the demo, the rest are matrix only |
| Organization fields | Edit name, logo letter, currency, date, time, timezone, tax. | Preview line only; the rest of the app is not reformatted |
| Stages editor | Rename, recolor, reorder, add statuses. | Preview only; trip data does not change |

**Rules**
- `effective permission = S.perms override else role default  (can(k))`
- enforced (13, ST_ENFORCED): users.manage, fin.sync, fin.view, prop.approve, fin.issueDocs, settings.edit, settings.stages, price.edit, forms.build, sup.edit, sup.swap, ops.suppliers, cli.edit
- 40 permissions in 9 groups

**States**
- empty: Not applicable
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/roles (proposed)`
- `PATCH /v1/t/{tenantId}/roles/{role}/permissions (proposed)`
- `GET /v1/t/{tenantId}/settings (proposed)`
- `PATCH /v1/t/{tenantId}/settings (proposed)`

**Tests**
- `TEST st settings`

**Code**
- `v6/s10_settings.js: vSettings, stRoles, stSetPerm`
- `v6/s1e_people.js: PERMS, can`

<a id="clients"></a>

### Clients

`clients` · Status: Live

Every group the agency serves, with trips, booked revenue and last trip; opens the client card.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `cli.view`, `cli.edit`.

**Data.** `Client.name`, `Client.type`, `Client.city`, `Client.source`, `Client.taxExempt`, `Trip.client`, `Trip.stage`

| Control | Does | Guard |
|---|---|---|
| New client | Opens the client form. | formOpen("client", null) |
| Row chevron | Opens the client card. | spCliOpen(name) |
| Search | Filters by name. | Client-side |

**Rules**
- `list = distinct Trip.client over all trips, sorted by name`
- `booked revenue = sum calc(t).rev of that client non-Quote trips`
- prospects (no trips) are in CLIENTS and appear once a trip exists for them

**States**
- empty: "No results match these filters." row
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/clients?q=&cursor=`
- `POST /v1/t/{tenantId}/clients`
- `GET /v1/t/{tenantId}/clients/{id}`

**Tests**
- `TEST sp suppliers table, cards, in-trip flow, client card`
- `TEST people data`
- `check6.js: every view renders for each role in EN and HE`

**Code**
- `v6/s7c_lists.js: vClients, alCliBody`
- `v6/s1e_people.js: CLIENTS, cliByName`

<a id="studio"></a>

### Trip studio

`studio` · Status: Pilot

Turns a client request into a priced, mapped, day-by-day trip in seconds, then into an ordinary quote.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `proj.create`.

**Data.** `Gen.dest`, `Gen.seg`, `Gen.pax`, `Gen.nights`, `Gen.tier`, `Hotel.rate`, `Line.cost`, `Trip.markups`

| Control | Does | Guard |
|---|---|---|
| Destination, group type, pace, hotel class chips | Set the request (S.gen). | 16 destinations; hotel class falls back when the catalog has none of that star level |
| Travelers, nights sliders | Set pax 12 to 60 and nights 2 to 12. | Plan has nights + 1 days |
| Build the trip plan | Runs the 5-step reading animation, then shows the plan. | genRun(); result = genPlan(S.gen) |
| Hotel card | Swaps the hotel and re-prices. | Real hotel names; rates are illustrative |
| Create the quote | Creates a Quote trip from the plan lines and items and opens its cost table. | genCreate(); same genLines + calc as any quote, so the identity holds |

**Rules**
- multi-base: hotels define bases, each attraction goes to its nearest base within 170 km, nights split by attractions
- `drive time from Tulsa = straight-line km * 1.12 / 100 km/h + 1 h; coach transfers and day trips = km * 1.35 / 80 km/h`
- `price per traveler = calc(t).rev / pax; margin = planProfit / rev, ring line = S.thresh (12%)`
- `planProfit = rev - plan + comm`

**States**
- empty: Before the first build: big promise text and the form only
- loading: Busy panel with 5 steps while genRun() animates
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `POST /v1/t/{tenantId}/studio:plan`
- `POST /v1/t/{tenantId}/studio:create-quote`
- `POST /v1/t/{tenantId}/pricing:preview`

**Tests**
- `check6.js: studio for all 16 destinations in EN and HE, gen-quote identities`

**Code**
- `v6/s8_gen.js: genPlan, genRun, genCreate, vStudio, stResult`

<a id="leaks"></a>

### Profit leaks

`leaks` · Status: Pilot

Where planned profit went: a bridge from planned to expected profit by gap kind and FX, cut by trip, agent, group type or supplier.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `fin.view`.

**Data.** `Trip.agent`, `Trip.seg`, `Line.sup`, `Gap.kind`, `Gap.diff`, `Invoice.credit`, `Block.held`, `Block.used`

| Control | Does | Guard |
|---|---|---|
| Breakdown tabs Trip / Agent / Group type / Supplier | Change the dimension (S.lkDim). | Rows with no leak are hidden until Show more |
| Row or heatmap cell | Scopes the whole page to that agent, group type or trip. | S.lkSel = dim|key; a trip row opens its Finance tab |
| Your numbers inputs | Estimates a yearly leak for a visitor agency. | trips * revenue * demo leak rate; an illustration, not data |

**Rules**
- `leak = planned profit - expected profit`
- `bridge = amtDiff by kind (rooms, rate, comp, dup, extra, qty, under) + fx, so it ties to planProfit - fcProfit`
- `recoverable = open or disputed gaps with amtDiff > 0`
- at risk, outside the bridge: unreleased block rooms, late client payments, missing invoices, uncollected commission
- commission collected uses a fixed rule per line (commPaid) so figures are stable

**States**
- empty: noTrip() when no non-Quote trips are visible; "No data." in the table
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/reports/leaks?scope=&dim=`
- `GET /v1/t/{tenantId}/gaps?status=open`

**Tests**
- `check6.js: leak-bridge identities per scope and per dimension`
- `check6.js: every view renders for each role in EN and HE`

**Code**
- `v6/s7_leak.js: leakModel, leakRows, vLeaks, wfSvg`
- `v6/s9a_books.js: yourNumbers`

<a id="gaps"></a>

### Invoice check

`gaps` · Status: Pilot

Every supplier bill line matched to what was quoted; differences are found, explained and chased until credited.

**Roles.** View: manager, accountant, agent. Act: manager, accountant. Permissions: `fin.view`, `fin.dispute`.

**Data.** `Invoice.no`, `Invoice.amt`, `Invoice.credit`, `Invoice.st`, `Gap.kind`, `Gap.diff`, `Line.cost`, `Line.sup`

| Control | Does | Guard |
|---|---|---|
| Status and type filters | Filter the gap table (open, disputed, credited, accepted, all). | S.gF, S.gK |
| Trip link | Opens the trip Finance tab where the gap card lives. | Dispute email, credit and accept actions are on that tab |
| Gap kinds | rooms, qty, rate, comp, extra, dup, under, missing. | kind = invoice kind, else under when diff < 0, else rate |

**Rules**
- `diff = effAmt(inv) - planC(line), effAmt = amt - credit; zero diff = match`
- a gap is open or disputed until credited or accepted  (isOpenGap)
- `under = invoice below plan (a saving); missing = no invoice on a Finance or Closed trip`
- about 20% of invoices carry a gap: an estimate, not a benchmark
- a real hotel or venue never appears in a gap (brandSwap guard)

**States**
- empty: No gap rows: "No gaps."
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/gaps?status=&kind=`
- `POST /v1/t/{tenantId}/gaps/{id}:dispute`
- `POST /v1/t/{tenantId}/gaps/{id}:accept`
- `POST /v1/t/{tenantId}/supplier-credits`

**Tests**
- `check6.js: every view renders for each role in EN and HE`
- `check6.js: dispute and credit flows, real-brand guard`

**Code**
- `v6/s5_fin.js: vGaps`
- `v6/s1_core.js: invStatus, tripGaps, gapStats`

<a id="finance"></a>

### Finance dashboard

`finance` · Status: Pilot

All booked trips in one place: planned vs expected profit, receivables, 12-month cash flow, FX scenario and profit per traveler.

**Roles.** View: manager, accountant, agent. Act: manager, accountant. Permissions: `fin.view`.

**Data.** `Trip.stage`, `Trip.rate`, `Line.cost`, `Line.cur`, `Invoice.amt`, `Invoice.paid`, `Group.depPaid`, `Group.balPaid`

| Control | Does | Guard |
|---|---|---|
| Filters group type, stage, agent | Re-compute the whole page for the filtered trips. | Quotes stay in the pipeline line and never count as revenue |
| Currency move slider (-10 to +10%) | Shows the impact on open foreign-currency payables. | S.shock; no stored change |
| Trip name link | Opens the trip Finance tab. | No guard beyond canSee |

**Rules**
- `planProfit = rev - plan + comm`
- `planProfit - amtDiff - fx - fcProfit = 0  (identity per trip, holds for the portfolio)`
- `expected profit fp = rev - fc + comm`
- `receivable = rev - collected; late = unpaid deposit or balance past its due date`
- `FX impact = open foreign payables at locked rate * shock %`

**States**
- empty: "No booked trips in this filter" with the pipeline value
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/reports/finance-dashboard?seg=&stage=&agent=`
- `GET /v1/t/{tenantId}/reports/cashflow`
- `GET /v1/t/{tenantId}/reports/trip-pnl/{tripId}`

**Tests**
- `check6.js: every view renders for each role in EN and HE`
- `check6.js: finance identities`

**Code**
- `v6/s5_fin.js: vFinance`
- `v6/s1_core.js: calc, portfolio, groupsCalc`

<a id="books"></a>

### Accounting sync

`books` · Status: Pilot

Connects an accounting system, imports supplier bills, maps objects, posts bills, holds and credits, and logs every sync (simulated).

**Roles.** View: manager, accountant. Act: manager, accountant. Permissions: `fin.sync`.

**Data.** `Acct.sys`, `Acct.phase`, `Acct.opt`, `Acct.log`, `Invoice.no`, `Invoice.amt`, `Trip.id`

| Control | Does | Guard |
|---|---|---|
| Connect (system card) | Runs the connect animation against a sample company file. | QuickBooks Online and Xero lead in English; Priority and Hashavshevet in Hebrew; all four in both |
| Sync now | Re-reads the sample bills. | Simulated |
| Disconnect | Clears the connection. | Resets A().phase |
| Posting rule toggles | Auto-post approved bills, tag each line, post credits. | A bill with an open gap is held from payment until handled |

**Rules**
- `mapping per system: Trip -> Class or tracking category, Supplier -> Vendor, Supplier invoice -> Bill, Supplier credit -> Vendor credit`
- gap actions elsewhere (dispute, credit, accept) add rows to the sync log
- page is badged Pilot: live connections are product work

**States**
- empty: Before connecting: four system cards
- loading: Connecting animation, then the synced view
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/accounting/connections`
- `POST /v1/t/{tenantId}/accounting/{system}:connect`
- `POST /v1/t/{tenantId}/accounting/connections/{id}:sync`
- `GET /v1/t/{tenantId}/accounting/connections/{id}/log`
- `DELETE /v1/t/{tenantId}/accounting/connections/{id}`

**Tests**
- `check6.js: every accounting system in both languages, posting log`

**Code**
- `v6/s9a_books.js: vBooks, ACCT, acLog`

<a id="ai"></a>

### Maya, AI assistant

`ai` · Status: Pilot

Ask the data in plain language: 28 scripted questions, plus optional live answers from Claude for typed questions.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `ai.maya`, `ai.live`.

**Data.** `QS.id`, `QS.he`, `QS.en`, `Chat.r`, `Chat.t`, `Live.key`

| Control | Does | Guard |
|---|---|---|
| Question chips | Ask a ready-made question; always scripted. | Meeting mode stays scripted |
| Typed question | Routes to a scripted answer, or goes live when a key is set. | Live: claude-opus-5-5, streaming, grounded on liveSnapshot(); falls back to scripted on no key, offline, error, refusal or 25 s without a word |
| Clear chat | Empties the conversation. | S.chat = [] |

**Rules**
- the header pill shows the real mode: Scripted or Live answers - Claude; a scripted answer is never labeled live
- API key is entered on the booth laptop and kept in localStorage only; never in the repo or the HTML
- snapshot carries no invalid numbers and no real brand in a gap, and its leak total ties to leakModel()

**States**
- empty: Greeting message and question groups
- loading: Streaming text while a live answer arrives
- error: Scripted answer with a small note explaining the fallback

**Suggested API**
- `POST /v1/t/{tenantId}/ai/threads`
- `POST /v1/t/{tenantId}/ai/threads/{id}/messages (SSE)`
- `GET /v1/t/{tenantId}/ai/usage`

**Tests**
- `check6.js: all 25 Maya routes, live snapshot checks, Maya tips`

**Code**
- `v6/s6_rest.js: vAI, QS`
- `v6/s9c_live.js: liveAsk, liveSnapshot`
- `v6/s9d_maya.js: mayaTip`

<a id="status"></a>

### What's live

`status` · Status: Live

Honesty layer: every feature marked Live, Pilot or Roadmap. A demo-only screen, not a product page.

**Roles.** View: all roles. Act: all roles.

**Data.** `FEAT.id`, `FEAT.status`, `FEAT.view`

| Control | Does | Guard |
|---|---|---|
| Open (feature row) | Jumps to the screen that shows the feature. | Only rows with a view key that exists |

**Rules**
- `Live = seen on app.triplanet.io screens; Pilot = working in the demo and offered to pilot customers; Roadmap = not available`
- statuses are confirmed by the owner before each show; income, vouchers, trip P&L and currencies are Pilot since 13 Nov 2026

**States**
- empty: Not applicable: static table
- loading: None
- error: None

**Tests**
- `check6.js: status screen in EN and HE`

**Code**
- `v6/s9b_status.js: FEAT, vStatus`

<a id="credits"></a>

### Photo credits

`credits` · Status: Live

Author, license and source for every embedded photo (open licenses require it). Also states that staff headshots are AI-generated.

**Roles.** View: all roles. Act: all roles.

**Data.** `Photo.kind`, `Photo.title`, `Photo.author`, `Photo.license`, `Photo.source_url`

| Control | Does | Guard |
|---|---|---|
| Source and license links | Open the original file and its license. | External links; offline they do nothing |

**Rules**
- only public domain, CC0 and CC BY licenses are allowed (no NC, no ND)
- every embedded photo must have a credit with author and source

**States**
- empty: A group with no photos is not shown
- loading: None
- error: None

**Tests**
- `check6.js: photo credits and license check`

**Code**
- `v6/s9b_status.js: vCredits`

<a id="page-forms"></a>

### Form builder and traveler forms

`page:forms` · Status: Pilot

Build registration, medical, waiver and room-preference forms, preview on desktop or phone, and send them to travelers; also entity custom fields.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `forms.build`.

**Data.** `Form.id`, `Form.fields`, `Form.pub`, `Form.version`, `Traveler.form`, `Field.type`, `Field.req`

| Control | Does | Guard |
|---|---|---|
| Add, move, duplicate, delete field | Edit the draft definition of the selected form. | Disabled without forms.build |
| Publish | Saves the draft as a new version; entity forms also write custom fields. | fbPublish(); version + 1 |
| Send to travelers | Sends the form link for the chosen trip. | fbSend(); progress is tracked per traveler |
| Responses tab | Shows completion by traveler for a trip. | Form status: done, sent, not sent |

**Rules**
- 4 traveler forms: reg, med, waiver, room; waiver wording is sample text for counsel to replace
- field types: text, email, tel, number, money, select, multi, date, toggle, textarea, file, section, repeater
- `Settings > Forms links here; the page is not in the sidebar`

**States**
- empty: A form with no fields shows an empty canvas with the palette
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Validation errors list per field; nothing saved until valid

**Suggested API**
- `GET /v1/t/{tenantId}/form-definitions (proposed)`
- `PUT /v1/t/{tenantId}/form-definitions/{id} (proposed)`
- `POST /v1/t/{tenantId}/trips/{id}/forms/{formId}:send (proposed)`
- `GET /v1/t/{tenantId}/trips/{id}/forms/{formId}/responses (proposed)`

**Tests**
- `TEST form builder`
- `TEST forms engine`

**Code**
- `v6/s10_fbuild.js: VIEWS.forms, fbPublish, fbSend`
- `v6/s10_forms.js: formRender, FM_TYPES`

<a id="page-uikit"></a>

### UI kit

`page:uikit` · Status: Live

Live examples of every component with class names and usage notes; the visual reference for developers.

**Roles.** View: all roles. Act: all roles.

| Control | Does | Guard |
|---|---|---|
| Open UI kit (developer notes) | Jumps to this page from the panel footer or Settings. | Only when VIEWS.uikit exists |

**Rules**
- tokens come from v6/theme.css (var(--primary), var(--panel), ...); no literal colors
- logical CSS properties only, so Hebrew RTL works

**States**
- empty: Not applicable
- loading: None
- error: None

**Code**
- `v6/s11_uikit.js: VIEWS.uikit`

## Trip tabs: Quotation

<a id="trip-general"></a>

### General details

`trip:general` · Status: Live

Check and edit the basic facts of a trip: name, deposit percent and the locked exchange rate.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `proj.edit`.

**Data.** `Trip.name`, `Trip.client`, `Trip.ctype`, `Trip.dest`, `Trip.seg`, `Trip.pax`, `Trip.dep`, `Trip.nights`, `Trip.agent`, `Trip.cur`, `Trip.rate`, `Trip.pct`, `Trip.depDue`, `Trip.balDue`

| Control | Does | Guard |
|---|---|---|
| Project name (text) | Sets Trip.name. An empty value keeps the old name. | Any role that can open the trip. proj.edit is not enforced here. |
| Locked rate, USD per currency (number) | Sets Trip.rate and reprices every non-USD line. | Shown only when Trip.cur is not USD. Editable only in Quote stage; later it is read-only: Locked when the quote was accepted on the win date (Trip.wonOn, otherwise Locked at acceptance). Clamped to 0.5 to 2; an empty value falls back to the base rate. |
| Deposit (%) (number) | Sets Trip.pct. Group deposits and balances recompute. | Clamped to 0 to 100. Due dates do not change. |
| Client, destination, group type, travelers, dates, file owner, due dates | Read-only rows. | Changed elsewhere: pax and dates on the trip record, owner via proj.assign. |

**Rules**
- `New quote: depDue = dep - 150 days, balDue = dep - 60 days, pct = 25.`
- `lrate(t,l) = 1 for USD lines, else Trip.rate (one locked rate per trip).`
- Supplier currency Trip.cur comes from the destination; air stays in USD where the destination has air.

**States**
- empty: A trip always has these fields; there is no empty state. With no open trip the page shows Open a trip first.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}`
- `PATCH /trips/{id}`
- `PUT /trips/{id}/fx-locks/{cur} (step-up)`

**Tests**
- `check6: all views per role in EN and HE`
- `check6: finance identities`

**Code**
- `v6/s4_views.js: pGeneral`
- `v6/s6_rest.js: change handler (name, pct, rate)`
- `v6/s1_core.js: buildTrip`

<a id="trip-plan"></a>

### Trip plan

`trip:plan` · Status: Live

Build the day-by-day itinerary by moving sites and templates onto days.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `proj.edit`, `price.edit`.

**Data.** `Trip.items`, `Trip.nights`, `Trip.dest`, `Trip.stage`, `Line.name`, `Line.cost`, `Line.type`, `Line.scope`, `Line.qty`

| Control | Does | Guard |
|---|---|---|
| Day header (toggle) | Opens or closes a day; Unscheduled is day 0. | S.openDay holds one open day. |
| Move to day (select) | Sets Item.day. 0 = unscheduled. | Any role that can open the trip. |
| Cost per person (number) | Sets Line.cost = value / lrate, so the price follows the markup. | Shown only if a per-person Activities line has the same name. Min 0. |
| Add site to day (select + button) | Adds an item from the destination catalog. In Quote stage also adds an Activities line (per person, qty = pax - floor(pax/20)) if none has that name. | Operation and Finance add the item only. |
| Remove site (x) | Deletes the item. The cost line stays. | None. |
| Template: Add to day, search, destination filter | Appends all template sites to the open day (day 1 if none). | List shows 8 templates, this destination first. |
| Drag and drop (mouse, touch, pen) | Moves a site or a template onto a day or between sites; saves, opens the day, flashes the item. | dndMoveItem keeps every item once; Esc cancels. |
| Save draft / Save and continue | Draft shows a toast only. Continue opens Pricing. | No data change. |

**Rules**
- `dayHours(t,d) = sum of Item.hrs on day d.`
- A day over 9 hours (day 0 excluded) shows an Overloaded pill and a warning.
- Maya offers a one-tap fix: move the longest movable item to the nearest day that fits; arrival and departure days last.
- Three views share this tab: By day, By components, Map (view switch).

**States**
- empty: A day without sites says: No sites yet. Drag one here or add one.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/itinerary`
- `POST /trips/{id}/itinerary:move`
- `PATCH /trips/{id}/itinerary/items/{itemId}`
- `POST /trips/{id}/itinerary/items`

**Tests**
- `TEST tbday`
- `check6: drag and drop model (dndMoveItem, dndAddTpl)`
- `check6: Maya tips and plan fixes`

**Code**
- `v6/s4_views.js: pPlan`
- `v6/s10_tbday.js: pPlan wrapper, tbdBar`
- `v6/s6b_dnd.js: dndMoveItem, dndAddTpl`
- `v6/s9d_maya.js: mayaPlanFix`

<a id="trip-costs"></a>

### Pricing

`trip:costs` · Status: Live

Set markups, discounts and unit costs and see the client price and planned profit.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `price.edit`, `price.discount`, `price.overrideMarkup`, `price.seeCost`.

**Data.** `Trip.markups`, `Trip.basis`, `Trip.disc`, `Trip.rate`, `Trip.cur`, `Trip.pax`, `Trip.ovh`, `Trip.brk`, `Line.qty`, `Line.cost`, `Line.cur`, `Line.ov`, `Line.comm`, `Line.type`, `Line.scope`

| Control | Does | Guard |
|---|---|---|
| Markup is calculated: On cost / Of price | Sets Trip.basis. | Changes every price. |
| Locked rate (number) | Sets Trip.rate. | Shown only for non-USD trips. 0.5 to 2. Editable in Quote stage only; read-only after acceptance (the change handler also refuses). |
| Line detail (chevron) | Expands the lines of a service type. | Per scope: shared or per person. |
| Markup % per service type | Sets Trip.markups[type]. | 0 to 90. |
| Discount type and value per type | Sets Trip.disc[scope|type] as % or $. | Value min 0; empty clears it. |
| Unit cost and Markup override per line | Sets Line.cost (min 0) and Line.ov (0 to 90, empty = type markup). | Overrides are counted under the type. |
| Pricing extras: overhead and brokerage fee | Sets Trip.ovh and Trip.brk (kind %, $, applies to shared, per person or both). | price.edit enforced: the controls are disabled without it. |
| Create proposal | Opens the Proposal tab. | None. |

**Rules**
- `planC = round2(qty * cost). mkOf = Line.ov if set, else Trip.markups[type].`
- `priceC = planC * (1 + m/100) on cost; planC / (1 - m/100) of price. price = round2(priceC * lrate).`
- Discount %: base * min(100,v) / 100. Discount $: shared min(base,v); per person min(base, v * pax).
- Overhead and brokerage: % of the post-discount base (shared, pp or both), or a fixed $ (pp x pax). Brokerage also adds to plan cost, so profit does not change.
- `rev = sum(price) - discounts + ovh + brk. comm = comm% * planC * lrate.`
- `planProfit = rev - plan + comm. Commission is never shown to the client.`

**States**
- empty: A service scope with no lines is not shown.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `POST /pricing:preview`
- `PATCH /quote-versions/{id}/lines/{lineId}`
- `PUT /quote-versions/{id}/pricing`

**Tests**
- `TEST core ovh/brk`
- `TEST prop formats and extras`
- `check6: finance identities (planProfit - amtDiff - fx - fcProfit = 0)`

**Code**
- `v6/s4_views.js: pCosts`
- `v6/s10_prop.js: prFeesCard`
- `v6/s1_core.js: calc`
- `v6/s1_core.js: priceC`
- `v6/s1_core.js: discOf`

<a id="trip-quote"></a>

### Proposal

`trip:quote` · Status: Live

Show the client price in the format the client prefers and share it.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `prop.formats`, `prop.public`, `prop.send`.

**Data.** `Trip.name`, `Trip.items`, `Trip.pct`, `Trip.depDue`, `Trip.balDue`, `Trip.no`, `Trip.qst`, `Trip.stage`, `Trip.pax`

| Control | Does | Guard |
|---|---|---|
| Format switch: PDF design / Agents table / Landing page | Sets S.prFmt. | Same data, three views. |
| Copy public link | Copies the link to the clipboard. | Link = https://go.redbudtours.example/p/ + Trip.no (placeholder domain). |
| Download PDF | Switches to PDF design and opens the print dialog. | window.print is wrapped in try/catch. |
| To quote approval | Opens the Approval tab. | None. |

**Rules**
- `Price per traveler = rev / pax; group total = rev.`
- `Deposit = round2(rev * pct / 100); balance = rev - deposit.`
- Supplier commissions and margins never appear in any format.
- Available at every stage; the landing page button changes with the quote status.

**States**
- empty: Days with no sites show Free day.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /quote-versions/{id}`
- `POST /quote-versions/{id}:send`
- `GET /public/proposals/{token}`

**Tests**
- `TEST prop formats and extras`

**Code**
- `v6/s4_views.js: pQuote`
- `v6/s10_prop.js: pQuote wrapper, prBar, prMaster`

<a id="trip-approve"></a>

### Quote approval

`trip:approve` · Status: Live

Move the quote from draft to manager approval, to the client, and open the file when the client accepts.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `prop.approve`, `prop.send`.

**Data.** `Trip.qst`, `Trip.qdays`, `Trip.stage`, `Trip.groups`, `Trip.tasks`, `Trip.sups`, `Trip.trav`, `Trip.room`

| Control | Does | Guard |
|---|---|---|
| Send for manager approval | Sets Trip.qst = Approval, qdays = 0. | Draft only. |
| Approve and send to client | Sets Trip.qst = Sent. | Needs can(prop.approve) (enforced in pApprove and in the qs handler). Others see: only someone who can approve proposals can approve and send. |
| Client asked to close | Sets Trip.qst = Negotiating. | Sent only. |
| Client accepted: open the file | winQuote: Trip.stage = Operations; creates groups (unpaid), tasks, supplier confirmations (Sent), travelers and a room block. Opens the Operation dashboard. | Shown when Sent or Negotiating (and from any gate card). |
| To operations | Opens the Operation dashboard. | Shown after the file is open. |
| Status menu (project header): Mark as lost | markLost: Trip.qst = Lost, qdays = 0. The stage stays Quote. | Open quotes only. A Lost quote leaves the pipeline, open-quote counts, team and agent dashboards, and shows under Archive. |

**Rules**
- Steps: Draft, Approval, Sent, Negotiating, then File opened.
- `Approval step shows price and planned margin = planProfit / rev.`
- `Room block after winning: held = rooms + 3, used = rooms, rooms = round(first line qty / nights).`
- Sent shows how many days ago (Trip.qdays).

**States**
- empty: Not applicable.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `POST /quote-versions/{id}:send`
- `POST /quote-versions/{id}:accept`
- `POST /trips/{id}:advance`
- `POST /trips/{id}:lose`

**Tests**
- `check6: win, new and draft flows`
- `TEST prop formats and extras`

**Code**
- `v6/s4_views.js: pApprove`
- `v6/s6_rest.js: winQuote`
- `v6/s6_rest.js: click handler (qs, win)`

<a id="trip-tbver"></a>

### Versions

`trip:tbver` · Status: Pilot

Save snapshots of the quote, compare any two and restore an earlier one.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `price.edit`.

**Data.** `Version.v`, `Version.at`, `Version.by`, `Version.note`, `Version.noteHe`, `Version.lines`, `Version.markups`, `Version.disc`, `Version.ovh`, `Version.brk`, `Version.totals`, `Trip.versions`

| Control | Does | Guard |
|---|---|---|
| Save version (note up to 60 characters) | Appends Version n+1 with a snapshot of lines, markups, discounts, overhead, brokerage and totals. | Quote stage and price.edit (enforced). Empty note becomes Version n. |
| Compare: Version A and Version B (selects) | Shows the differing lines, other changes and total deltas. | Includes Current (unsaved). |
| Restore (click twice) | Writes the snapshot back, removes alt0, rebuilds the supplier list and the room block hotel. | Quote stage and price.edit. Hidden when the version equals the current quote. |

**Rules**
- Snapshot per line: sup, qty, cost, cur, comm, ov. Items, pax and dates are not restored.
- A line differs when any of sup, qty, cost, cur, comm, ov differs.
- `Line total = round2(qty * cost * lrate); delta = total B - total A. Totals: rev, plan, planProfit, comm.`
- `Version number = highest existing + 1.`

**States**
- empty: No versions yet: the list is empty and Current is the only option to compare.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data. A past-Quote file shows a banner: versions are read-only.

**Suggested API**
- `GET /trips/{id}/quote-versions`
- `POST /trips/{id}/quote-versions`
- `POST /quote-versions/{id}:restore`
- `GET /quote-versions/compare?a=&b=`

**Tests**
- `TEST tbcomp swaps and versions`

**Code**
- `v6/s10_tbcomp.js: tbcVerTab`
- `v6/s10_tbcomp.js: tbVerSave`
- `v6/s10_tbcomp.js: tbVerRestore`
- `v6/s10_tbcomp.js: tbVerDiff`

## Trip tabs: Operation

<a id="trip-people"></a>

### Billing

`trip:people` · Status: Pilot

See what each household owes, what is paid and who is late, and copy their payment link.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `fin.view`, `fin.recordPayment`.

**Data.** `Group.name`, `Group.size`, `Group.depPaid`, `Group.balPaid`, `Trip.pct`, `Trip.depDue`, `Trip.balDue`, `Trip.pax`, `Traveler.room`, `Traveler.diet`, `Traveler.pass`

| Control | Does | Guard |
|---|---|---|
| Copy payment link | Copies https://pay.redbudtours.example/<household> (placeholder domain). | No payment is recorded in the demo. |

**Rules**
- `Household amount = round2(rev * size / pax); the last row absorbs the rounding so rows add up to rev.`
- `dep = round2(amt * pct / 100); bal = amt - dep; paid = dep if depPaid + bal if balPaid; open = amt - paid.`
- `Late: deposit unpaid after depDue, balance unpaid after balDue; days = longest overdue.`
- Shared costs split equally: sum of shared line prices / pax. Per-person costs are charged to each traveler.
- `Per head = rev / pax.`

**States**
- empty: No households: empty table.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/groups`
- `POST /client-invoices/{id}/payments`
- `GET /trips/{id}/travellers`

**Tests**
- `check6: finance identities`
- `check6: all views per role in EN and HE`

**Code**
- `v6/s4_views.js: pPeople`
- `v6/s1_core.js: groupsCalc`
- `v6/s1_core.js: lateInfo`

<a id="trip-odash"></a>

### Operation dashboard

`trip:odash` · Status: Live

See what needs attention before departure and jump to tasks, suppliers or finance.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `ops.tasks`, `ops.suppliers`, `ops.blocks`.

**Data.** `Trip.dep`, `Trip.stage`, `Trip.tasks`, `Task.due`, `Task.done`, `Task.who`, `Trip.sups`, `Trip.room`, `Trip.room.held`, `Trip.room.used`

| Control | Does | Guard |
|---|---|---|
| Due this week card | Opens the Tasks tab. Subline: n overdue. | None. |
| Suppliers not confirmed card | Opens the Suppliers tab. | None. |
| Estimated revenue card | Opens the Finance dashboard. | None. |
| Move to financial close (card, only after the trip returned) | advanceStage: Trip.stage = Finance and opens the Finance dashboard. | Return date on or before today (none of the generated trips qualifies). The same move is in the project status menu, with the reason when it is not allowed. |

**Rules**
- `Days to trip = max(0, round((dep - today) / day)). Closed or Finance files say Trip is home.`
- `Due this week = not done and due on or before today + 7 days (overdue included); the subline counts the overdue ones, as the next-step bar does.`
- `Suppliers not confirmed = Trip.sups with st not Confirmed.`
- Next tasks: the 6 earliest open tasks; pill Overdue, This week, or Planned.
- `Room block: used / held; releasable = held - used, by dep - 30 days.`

**States**
- empty: No open tasks: Every task is done.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/dashboard/operations`
- `GET /trips/{id}/room-blocks`

**Tests**
- `TEST ops tasks, master list, blocks`
- `check6: all views per role in EN and HE`

**Code**
- `v6/s7b_product.js: pOpsDash`
- `v6/s7b_product.js: ocard`
- `v6/s1e_people.js: blockOf`

<a id="trip-spm"></a>

### Suppliers

`trip:spm` · Status: Pilot

Move each supplier from contact to approved and compare prices before choosing.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `ops.suppliers`, `sup.swap`.

**Data.** `Trip.sups`, `Supplier.n`, `Supplier.cat`, `Supplier.line`, `Supplier.st`, `Supplier.flow`, `Supplier.reqs`, `Line.sup`, `Line.cost`, `Line.inv`

| Control | Does | Guard |
|---|---|---|
| Status: Contact / Pending / Approved / Price comparison | Sets Supplier.flow and st (Not sent, Sent, Confirmed). A No reply status stays under Pending. | ops.suppliers (enforced: buttons disabled). |
| Request quotes | Marks every alternative as requested, reply by today + 3, and sets the flow to comparison. | ops.suppliers. |
| Choose (in the comparison) | Swaps the line supplier through tbSwap and clears requests. | Disabled if approved, the line has an invoice, the trip is Closed, or no sup.swap (tbSwap enforces it too). The list buttons need ops.suppliers. |
| Add to list (unassigned components) | Adds a supplier row for a line whose supplier is missing. | ops.suppliers. |
| Supplier name link | Opens the supplier card. | None. |
| Confirmation message: supplier select, Copy message | Builds a booking confirmation text for the chosen supplier and copies it. | Shown in Operation and Finance. |

**Rules**
- `Flow from status: Confirmed = approved; Sent or No reply = pending; else contact. The comparison flag overrides.`
- Summary: x of n suppliers approved.
- Comparison cost change is for the whole line: (alt cost - cost) * qty * lrate.
- Real suppliers show a brand badge and no rating or reply time.

**States**
- empty: No comparison open: pick Price comparison on a supplier row.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/suppliers`
- `PATCH /trips/{id}/suppliers/{id}`
- `POST /trips/{id}/suppliers/{id}:request-quotes`
- `POST /trips/{id}/lines/{lineId}:swap-supplier`

**Tests**
- `TEST sp suppliers table, cards, in-trip flow, client card`
- `TEST tbcomp swaps and versions`

**Code**
- `v6/s10_sup.js: spmTab`
- `v6/s10_sup.js: spSetFlow`
- `v6/s10_sup.js: spChooseWhy`
- `v6/s10_sup.js: spChoose`
- `v6/s4_views.js: supMsgCard`

<a id="trip-optasks"></a>

### Tasks

`trip:optasks` · Status: Live

Work the trip checklist by time window and see what is overdue.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `ops.tasks`.

**Data.** `Task.id`, `Task.k`, `Task.t`, `Task.who`, `Task.due`, `Task.done`, `Task.win`, `Trip.tasks`

| Control | Does | Guard |
|---|---|---|
| Task checkbox | Toggles Task.done. | ops.tasks is not enforced. |
| Filter chips: Window, Status, Owner | Sets S.opWin, S.opSt, S.opWho; counts follow the other two filters. | Windows with no matching rows are hidden. |

**Rules**
- Library: 48 tasks in 7 windows (primary, 60-30, 30-14, 14-1, boxes, during, after). Added once per trip (ids from 101) for Operation, Finance, Closed.
- `due = dep + offset; the After window counts from the return day (dep + nights). International-only tasks are skipped for domestic trips.`
- `Owner: a = trip agent, o = Ops desk, f = Accountant.`
- `Status: done; overdue = not done and due before today; else open. Due this week = open and due by today + 7.`
- Seeded done: Finance and Closed all done; Operation past-due 85%, future 5%; a fresh won file starts with none done.

**States**
- empty: No match: No tasks match these filters.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/tasks`
- `PATCH /tasks/{id}`
- `GET /task-templates`

**Tests**
- `TEST ops tasks, master list, blocks`

**Code**
- `v6/s10_ops.js: opTasksTab`
- `v6/s10_ops.js: opInit`
- `v6/s10_ops.js: opToggleTask`
- `v6/s10_ops.js: TASK_LIB`

<a id="trip-manifest"></a>

### Master list

`trip:manifest` · Status: Live

Keep every traveler record complete: rooms, passports, forms and custom columns.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `ops.manifest`, `ops.messages`, `cli.export`.

**Data.** `Traveler.n`, `Traveler.g`, `Traveler.room`, `Traveler.roomType`, `Traveler.dob`, `Traveler.pass`, `Traveler.passNo`, `Traveler.passExp`, `Traveler.diet`, `Traveler.emerg`, `Traveler.form`, `Traveler.x`, `Trip.mcols`

| Control | Does | Guard |
|---|---|---|
| Send forms (primary) | Marks every not sent form (registration, medical, waiver) as sent and copies the forms link. | Demo send. ops.messages is not enforced. |
| Export CSV | Downloads master-list-<no>.csv: one row per traveler, labels in the current language. | Falls back to a toast if the browser blocks the download. |
| Import, then Apply updates / Cancel | Previews 5 rows and applies them to existing travelers only. | Traveler and room counts never change; missing passports are first. |
| Add column / remove column | Adds or removes a custom column in Trip.mcols. | Name up to 28 characters, unique, at most 6 columns. |
| Custom cell (text) | Stores Traveler.x[col], up to 80 characters. | Only for existing columns. |

**Rules**
- Passport warning: a passport is on file and expires before return day + 183 days.
- Form state per traveler and form: not sent, sent, done. Stat: travelers with all three done.
- Room summary compares rooms on the list by type with the block (blockOf).
- Domestic trips count emergency forms instead of passports.

**States**
- empty: No travelers: an empty table; counts show 0.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/travellers`
- `PATCH /travellers/{id}`
- `POST /trips/{id}/travellers:send-forms`
- `POST /imports`
- `GET /exports/{id}`

**Tests**
- `TEST ops tasks, master list, blocks`
- `TEST people travelers+blocks`

**Code**
- `v6/s10_ops.js: opManifestTab`
- `v6/s10_ops.js: opSendForms`
- `v6/s10_ops.js: opCsv`
- `v6/s10_ops.js: opImportApply`
- `v6/s10_ops.js: opPassWarn`

## Trip tabs: Finance

<a id="trip-tfin"></a>

### Expenses and invoice check

`trip:tfin` · Status: Pilot

Match each supplier invoice line to what was quoted and recover the difference.

**Roles.** View: manager, accountant, agent. Act: manager, accountant. Permissions: `fin.view`, `fin.dispute`, `fin.approveBills`.

**Data.** `Line.inv`, `Invoice.no`, `Invoice.amt`, `Invoice.credit`, `Invoice.paid`, `Invoice.rate`, `Invoice.st`, `Invoice.kind`, `Gap.usd`, `Gap.kind`, `Trip.inbox`, `Trip.stage`

| Control | Does | Guard |
|---|---|---|
| Read and match invoices | Reads the inbox sample files and attaches them to quote lines (applyInbox) with an animation. | Shown while Trip.inbox has files. |
| Draft dispute / View email / Copy / Mark as sent | Builds the credit-note email; Mark as sent sets Invoice.st = disputed. | Open gaps with an overbill. fin.dispute is not enforced. |
| Credit received | gapCredit: adds the difference to Invoice.credit, sets st = credited and Invoice.paid = true (as the generator does). | Disputed gaps only. |
| Accept charge / Checked, nothing missing | Sets Invoice.st = accepted. | Under-billed gaps use Checked. |
| Request invoice | Toast only. | Missing invoices, Finance and Closed files. |
| Documents: Payment request / Supplier voucher | Switches the sample document and its household or supplier select. | Sample layout. |

**Rules**
- `invStatus: none if no invoice; diff = effAmt - planC; match if |diff| below 0.005; else gap. effAmt = amt - credit.`
- Gap kinds: rooms (qty on Lodging), qty, rate, comp, extra, dup, under, missing.
- `Gap USD = diff (or credit if credited) * lrate. Open gap = open or disputed and usd above 0.`
- `amtDiff = (effAmt - planC) * lrate; fx = paid and non-USD ? effAmt * (inv.rate - Trip.rate) : 0.`
- `If open gaps are credited, margin = (fcProfit + open) / rev.`
- Real-brand rule: gap stories use fictional suppliers only; brandSwap skips trips with a gap.

**States**
- empty: No gaps: No gaps in the invoices received so far.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /supplier-invoices?tripId=`
- `POST /supplier-invoices/{id}:confirm`
- `GET /gaps?tripId=`
- `POST /gaps/{id}:dispute`
- `POST /gaps/{id}:accept`
- `POST /disputes/{id}:send`
- `/supplier-credits`

**Tests**
- `check6: gap flows (dispute, credit, accept)`
- `check6: finance identities`
- `check6: invoice reading`
- `TEST suppliers: data, coverage, rates, real-brand rules`

**Code**
- `v6/s5_fin.js: pTripFin`
- `v6/s5_fin.js: gapCard`
- `v6/s1_core.js: invStatus`
- `v6/s1_core.js: tripGaps`
- `v6/s3_shell.js: startReading`

<a id="trip-fdash"></a>

### Finance dashboard

`trip:fdash` · Status: Pilot

See the trip money at a glance: planned versus expected profit and what is still to collect.

**Roles.** View: manager, accountant, agent. Act: manager, accountant. Permissions: `fin.view`.

**Data.** `Trip.pax`, `Trip.groups`, `Line.inv`, `Invoice.amt`, `Invoice.credit`, `Invoice.st`, `Gap.usd`, `Group.depPaid`, `Group.balPaid`

| Control | Does | Guard |
|---|---|---|
| Check invoices | Opens the Expenses tab. Shown when supplier invoices are waiting in the inbox; the heading then says they are not checked yet and profit may change. | Primary button when the inbox is not empty. |
| Open expenses | Opens the Expenses tab, shown when open gaps exist and no invoices are waiting. | None. |
| Accounting sync chip | Shows the books system once connected. | Pilot; appears only after Accounting sync is connected. |
| Close the file (next-step bar, status menu) | advanceStage: Trip.stage = Closed. | Allowed only with no open gaps, no supplier invoices waiting in the inbox and nothing left to collect (groupsCalc outstanding = 0); otherwise disabled with the reasons listed. |

**Rules**
- `Stats: trip total = rev; planned profit = rev - plan + comm; expected profit = rev - fc + comm; remaining = rev - collected.`
- `Leak = planProfit - fcProfit (leakModel). The bridge is supplier differences by kind plus FX.`
- Open gaps: gaps with status open or disputed and usd above 0.
- `The identity planProfit - amtDiff - fx - fcProfit = 0 holds for every trip.`

**States**
- empty: No leak and nothing waiting: No differences between invoices and the quote.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /reports/trip-pnl/{tripId}`
- `GET /reports/leaks?scope=trip&id={tripId}`

**Tests**
- `check6: leak bridge identities per scope and dimension`
- `check6: finance identities`

**Code**
- `v6/s7b_product.js: pFinDash`
- `v6/s7_leak.js: leakModel`
- `v6/s9a_books.js: acChip`

<a id="trip-income"></a>

### Income

`trip:income` · Status: Pilot

See the deal invoices and receipts for each household and how much is billed, received and remaining.

**Roles.** View: manager, accountant, agent. Act: manager, accountant. Permissions: `fin.view`, `fin.issueDocs`.

**Data.** `Group.name`, `Group.dep`, `Group.bal`, `Group.depPaid`, `Group.balPaid`, `Trip.pct`, `Trip.depDue`, `Trip.balDue`, `Trip.no`

| Control | Does | Guard |
|---|---|---|
| Search (text) | Filters documents by client name. | Resets to page 1. |
| Tabs: All / Deal invoices / Receipts | Filters by document type. | Counts shown. |
| Rows per page (5, 10, 25) and paging | Pages the table. | None. |
| Issue document, Filters | Show a toast only (simulated). | Issue document is disabled without fin.issueDocs (enforced). |

**Rules**
- Documents are derived, not stored: per household a deal invoice for the deposit and for the balance.
- A deal invoice exists if paid or its due date is within today + 30 days; dated due - 21 days.
- A paid item also gets a receipt (type receipt) dated on the due date.
- `Footer: Trip total = rev; Amount billed = sum of deal invoices; Payment received = collected; Remaining = outstanding.`
- Status: Payment received, or Payment requested.

**States**
- empty: No documents.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/client-invoices`
- `POST /client-invoices/{id}:issue`
- `GET /client-invoices/{id}/payments`

**Tests**
- `check6: all views per role in EN and HE`
- `check6: finance identities`

**Code**
- `v6/s7b_product.js: pIncome`
- `v6/s7b_product.js: incomeDocs`
- `v6/s1_core.js: groupsCalc`

<a id="trip-vouch"></a>

### Vouchers and documents

`trip:vouch` · Status: Pilot

Produce the household payment request and the supplier voucher.

**Roles.** View: manager, accountant, agent. Act: manager, accountant. Permissions: `fin.issueDocs`.

**Data.** `Group.name`, `Group.size`, `Group.dep`, `Group.bal`, `Trip.sups`, `Line.name`, `Line.qty`, `Line.unit`, `Line.cost`, `Trip.no`

| Control | Does | Guard |
|---|---|---|
| Payment request / Supplier voucher | Switches the sample document (S.docMode). | Sample layout. |
| Household select / Supplier select | Chooses whose document to show. | Payment request uses households; voucher uses suppliers. |

**Rules**
- Payment request: deposit pct% due depDue, balance due balDue, total in USD. Sales tax is not modeled.
- Voucher number V-<Trip.no>-<Line.id>; shows service, quantity and agreed cost (planC).
- The tab shows only the Documents card of the Expenses tab.

**States**
- empty: No documents.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/vouchers`
- `POST /vouchers/{id}:issue`

**Tests**
- `check6: all views per role in EN and HE`

**Code**
- `v6/s7b_product.js: pVouch`
- `v6/s5_fin.js: pTripFin (Documents card)`

## Drawers and modals

<a id="drawer-supplier"></a>

### Supplier card

`drawer:supplier` · Status: Pilot

One supplier: contact, payment terms, cancellation policy, documents, performance, rate card and trips with spend.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `sup.edit`, `sup.rates`.

**Data.** `Supplier.contact`, `Supplier.terms`, `Supplier.cancel`, `Supplier.docs`, `Supplier.rating`, `Rate.season`, `Rate.band`, `Line.sup`

| Control | Does | Guard |
|---|---|---|
| Back | Closes the card; returns to the trip when opened from one. | spClose(); S.spBack remembers the trip tab |
| Edit | Opens the supplier form. | Disabled with a reason when the role lacks sup.edit |
| Tabs Overview / Rate card / Trips and spend | Switch S.spTab. | Rate card = season x pax band x variant |

**Rules**
- `a real supplier (real = true) shows a brand badge and stars; no rating, reply time or invented documents`
- performance (accuracy, reply time) shows for fictional suppliers only
- trips and spend come from lines of visible trips  (spUse)

**States**
- empty: Trips tab: "No trips yet" line when the supplier is unused
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/suppliers/{id}`
- `PATCH /v1/t/{tenantId}/suppliers/{id}`
- `GET /v1/t/{tenantId}/suppliers/{id}/rates`
- `GET /v1/t/{tenantId}/suppliers/{id}/trips (proposed)`

**Tests**
- `TEST sp suppliers table, cards, in-trip flow, client card`
- `TEST suppliers: data, coverage, rates, real-brand rules`

**Code**
- `v6/s10_sup.js: spCardHtml, spOpen, spClose`

<a id="drawer-client"></a>

### Client card

`drawer:client` · Status: Live

One client: contact, details, open lead, notes, trips, and a finance tab with billed and received per trip.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `cli.view`, `cli.edit`.

**Data.** `Client.contact`, `Client.type`, `Client.taxExempt`, `Client.lead`, `Client.notes`, `Doc.type`, `Doc.amt`

| Control | Does | Guard |
|---|---|---|
| Back | Closes the card. | spCliClose() |
| Edit | Opens the client form. | Disabled with a reason without cli.edit, or for a client that only exists as a trip name |
| Trip link | Opens the trip. | Agents see only their own trips |

**Rules**
- `billed = deal invoices of the client non-Quote trips; received = tax invoices (receipts); open = billed - received`
- `booked = sum calc(t).rev; quotes do not issue invoices`

**States**
- empty: Finance tab: "Nothing billed yet. Quotes do not issue invoices."
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Not modelled in the demo. In the product show an inline retry banner and keep the last good data.

**Suggested API**
- `GET /v1/t/{tenantId}/clients/{id}`
- `PATCH /v1/t/{tenantId}/clients/{id}`
- `GET /v1/t/{tenantId}/clients/{id}/finance (proposed)`

**Tests**
- `TEST sp suppliers table, cards, in-trip flow, client card`

**Code**
- `v6/s10_sup.js: spCliHtml, spCliFin, spCliOpen`

<a id="modal-form"></a>

### Entity form (modal)

`modal:form` · Status: Pilot

One schema-driven form for supplier, client, user, activity and hotel: validation, dirty check, save to the local dataset.

**Roles.** View: manager, accountant, agent. Act: manager, accountant, agent. Permissions: `sup.edit`, `cli.edit`, `cat.edit`.

**Data.** `FormSchema.fields`, `FormDraft.errors`, `FormDraft.dirty`, `Field.req`, `Field.showIf`

| Control | Does | Guard |
|---|---|---|
| Save | Validates, saves through the schema onSave, closes and toasts. | formSave(); invalid fields focus the first error and nothing is saved |
| Cancel, Esc | Closes without saving. | Asks for confirmation when the draft is dirty (formClose) |
| Repeater add or remove row | Edits lists such as contacts or cancellation steps. | Dotted paths, for example cancel.0.d |

**Rules**
- validation runs on blur and on save: required, email, phone, number range, money, pattern
- showIf hides a field and skips its validation
- field types: text email tel number money select multi date toggle textarea file section repeater

**States**
- empty: New record starts with schema defaults
- loading: Demo data is in memory and renders at once. In the product show skeleton cards while the request runs.
- error: Per-field message under the input and a summary on submit

**Suggested API**
- `POST /v1/t/{tenantId}/suppliers`
- `PATCH /v1/t/{tenantId}/suppliers/{id}`
- `POST /v1/t/{tenantId}/clients`
- `PATCH /v1/t/{tenantId}/clients/{id}`
- `POST /v1/t/{tenantId}/catalog-items`

**Tests**
- `TEST forms engine`
- `TEST form builder`

**Code**
- `v6/s10_forms.js: formOpen, formSave, formValidate, FORM_SCHEMAS`

<a id="trip-plan-day"></a>

### Trip plan: By day

`trip:plan:day` · Status: Pilot

Edit one day: description, photo, and what it costs globally and per participant.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `proj.edit`.

**Data.** `Trip.dayInfo`, `Trip.items`, `Line.planUSD`, `Line.scope`, `Line.type`, `Line.sup`, `Trip.pax`

| Control | Does | Guard |
|---|---|---|
| View switch (By day / By components / Map) | Sets S.tbView. | Built from TB_VIEWS, sorted by order. |
| Day description (textarea) | Stores Trip.dayInfo[d].desc on every keystroke. | Without an edit the default text is shown (day 1 intro; departure day; free day). |
| Restore default text | Deletes dayInfo[d].desc. | Shown only after an edit. |
| Day photo (picker, up to 6) | Stores Trip.dayInfo[d].img: the destination photo plus catalog venues of the day, then venues of the destination. | Falls back to the first matching venue, else the destination photo. |
| Save day as template | Appends a template (TBD_TPL, persisted) that appears last in the Templates list. | Disabled when the day has no sites. Duplicate names get (2), (3). |

**Rules**
- tbdDayCosts splits each non-extra line planUSD equally over its active days; the last day takes the rounding remainder.
- `Active days: Lodging = nights 1..N; Insurance = day 1; transfers = day 1 and last; air or per-person transport = day 1.`
- `Guide = qty days (busiest first); Meals = days from the (n) in the name, lunch from day 2; Activities = days with a matching site.`
- Activities with no matching site are Unscheduled cost, shown under the tables.
- `Sum of day totals + unscheduled = sum of planUSD over non-extra lines.`
- `Payment per participant = row amount / Trip.pax.`

**States**
- empty: A day with no active lines says: No lines active on this day. The details card shows only for an open day 1..N.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/itinerary/days/{day}`
- `PATCH /trips/{id}/itinerary/days/{day}`
- `POST /templates (from a day)`

**Tests**
- `TEST tbday`

**Code**
- `v6/s10_tbday.js: tbdDayCosts`
- `v6/s10_tbday.js: tbdDetails`
- `v6/s10_tbday.js: tbdSaveTpl`

<a id="trip-plan-comp"></a>

### Trip plan: By components

`trip:plan:comp` · Status: Pilot

See every cost line by service type and compare or swap the supplier, with the profit impact.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `price.edit`, `sup.swap`.

**Data.** `Line.name`, `Line.sup`, `Line.type`, `Line.qty`, `Line.unit`, `Line.cost`, `Line.cur`, `Line.comm`, `Line.scope`, `Line.inv`, `Line.alt0`, `Supplier.id`, `Supplier.real`, `Supplier.rating`, `Supplier.pref`, `Supplier.cancel`, `Trip.sups`, `Trip.room`

| Control | Does | Guard |
|---|---|---|
| Alternatives / Compare (per line) | Opens the comparison table: current supplier first, then alternatives with rating, preference, cancellation, commission, unit cost, cost change and profit impact. | Disabled when the line has no alternatives and was not swapped. |
| Swap supplier | Sets Line.sup, Line.cost, Line.comm and stores Line.alt0 once; the trip supplier list and room block hotel follow. | UI: Quote stage only, no Line.inv, can sup.swap. tbSwap itself refuses without sup.swap (reason perm) and also allows Operation. |
| Undo swap / Swap back | Restores the exact original sup, cost and comm from alt0 and deletes alt0. | Blocked when the line has an invoice, or without sup.swap. |

**Rules**
- `Alternative unit cost = round(l.cost * rate(alt) / rate(incumbent)). The current supplier returns l.cost exactly.`
- A real brand whose catalog rate differs from the line cost by more than 15% is anchored on the market median of fictional suppliers (altCost).
- `Cost change = (alt cost - l.cost) * qty * lrate. Profit impact = calc(swapped).planProfit - calc(current).planProfit.`
- A swap never changes currency or rate. Activities have no alternatives. Lodging shows the 5 closest by rate, at least one fictional.
- Real brands show a badge and no rating or performance.
- Operation stage: comparison only; choose the supplier in the Suppliers tab.

**States**
- empty: A line with no alternatives says each attraction is its own operator. A line with an invoice says the supplier is locked.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/lines/{lineId}/alternatives`
- `POST /trips/{id}/lines/{lineId}:swap-supplier`
- `POST /trips/{id}/lines/{lineId}:undo-swap`

**Tests**
- `TEST tbcomp swaps and versions`
- `TEST suppliers: data, coverage, rates, real-brand rules`

**Code**
- `v6/s10_tbcomp.js: tbcComp`
- `v6/s10_tbcomp.js: tbSwap`
- `v6/s10_tbcomp.js: tbUndo`
- `v6/s1d_data.js: altsFor`
- `v6/s1d_data.js: altCost`

<a id="trip-plan-map"></a>

### Trip plan: Map

`trip:plan:map` · Status: Pilot

See the route of the trip on a map and the order of the days.

**Roles.** View: manager, accountant, agent. Act: .

**Data.** `Trip.dest`, `Trip.items`, `Trip.nights`, `Venue.city`

| Control | Does | Guard |
|---|---|---|
| View switch | Returns to By day or By components. | Sets S.tbView. The map itself is read-only. |

**Rules**
- City of a site: keyword table per destination (TBD_KW), else the catalog venue city, else the previous city.
- A day main city is its most frequent city; stops are the distinct consecutive cities that have map geometry.
- The view comes from geoViewFor(stops). On the USA view the route starts at Tulsa. Stops closer than 40 px merge.
- Day order card lists each day with its cities and sites; unscheduled sites are listed last.

**States**
- empty: A destination without geometry shows: No map for this destination. Here is the day order.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /trips/{id}/route`

**Tests**
- `TEST tbday`

**Code**
- `v6/s10_tbday.js: tbdMap`
- `v6/s10_tbday.js: tbdRoute`
- `tools/geo/geo_runtime.js: geoMap`

<a id="trip-quote-pdf"></a>

### Proposal: PDF design

`trip:quote:pdf` · Status: Live

A printable document with itinerary, price, inclusions and payment schedule.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `prop.formats`.

**Data.** `Trip.items`, `Trip.dep`, `Trip.nights`, `Trip.pct`, `Trip.depDue`, `Trip.balDue`, `Trip.agent`, `Line.type`

| Control | Does | Guard |
|---|---|---|
| Show price per traveler and group total (switch) | Sets S.showPP. | Document only. |
| Show what is included (switch) | Sets S.showItems. | Lists service types that have lines. |
| Show payment schedule (switch) | Sets S.showSched. | Deposit and balance with due dates. |
| Print / PDF | Opens the print dialog. | try/catch; offline fallback toast. |

**Rules**
- Hero shows dates, days and nights, country and travelers; Sent by is the file owner on today.
- Included list: Hotel accommodation, transportation (air and ground if the destination has air), guide, activities, meals, travel protection, only for types present.
- The document text is always English.

**States**
- empty: A day with no sites lists Free day.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /quote-versions/{id}/document.pdf`

**Tests**
- `TEST prop formats and extras`

**Code**
- `v6/s4_views.js: pQuote (document)`
- `v6/s10_prop.js: prPdf`

<a id="trip-quote-table"></a>

### Proposal: Agents table

`trip:quote:table` · Status: Live

Give partner agents an indicative price per traveler for several group sizes.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `prop.formats`.

**Data.** `Trip.pax`, `Trip.seg`, `Trip.markups`, `Trip.disc`, `Trip.ovh`, `Trip.brk`, `Line.qty`, `Line.cost`, `Line.type`, `Line.scope`, `Line.unit`

| Control | Does | Guard |
|---|---|---|
| Format switch | Returns to another format. | The table is read-only. |

**Rules**
- Rows: 10, 15, 20, 25, 30, 40 travelers plus Your quote (real price).
- Each row re-prices a copy of the trip: quantities regenerate with genLines at n and at the real pax; each real line is scaled by that ratio.
- Per-person lines scale by n / pax; room-night lines by ceil(qty * n / pax).
- `prTierPrice = round2(calc(copy).rev / n). Unit costs, markups, overrides, discounts, overhead and brokerage come from the trip; fixed $ amounts stay fixed.`
- `FOC places = floor(n / 20), informational only.`
- `Single supplement = lodging price / qty * nights * 0.5, only for Faith, Senior, Alumni; others show n/a.`

**States**
- empty: The table always has rows.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `POST /pricing:preview (per group size)`
- `GET /quote-versions/{id}/agent-table`

**Tests**
- `TEST prop formats and extras`

**Code**
- `v6/s10_prop.js: prTable`
- `v6/s10_prop.js: prTierCalc`
- `v6/s10_prop.js: prTierPrice`
- `v6/s10_prop.js: prSingleSupp`

<a id="trip-quote-landing"></a>

### Proposal: Landing page

`trip:quote:landing` · Status: Live

Preview what the client sees at the public link and let the client accept.

**Roles.** View: manager, accountant, agent. Act: manager, agent. Permissions: `prop.public`.

**Data.** `Trip.name`, `Trip.items`, `Trip.qst`, `Trip.stage`, `Trip.pct`, `Trip.depDue`, `Trip.balDue`, `Line.type`

| Control | Does | Guard |
|---|---|---|
| Accept and pay deposit (client button) | Sets Trip.qst = Negotiating and qdays = 0. No real payment. | Moves only a Draft or Sent quote. |
| Copy public link | Copies the placeholder link. | From the master bar. |

**Rules**
- `Price from = ceil(rev / pax) per traveler. Deposit = round2(rev * pct / 100).`
- `Button states: Approval = disabled, Waiting for manager approval; Negotiating or a file past Quote = disabled, deposit recorded or booking confirmed.`
- Not included: personal expenses and gratuities, optional activities, plus travel protection or meals if absent.
- Commissions and margins never appear.

**States**
- empty: A day with no sites lists Free day.
- loading: Not applicable in the demo: the tab renders at once from in-memory data. In the product, show a skeleton of the same layout.
- error: The demo makes no server calls. In the product, show an inline error card with a Retry button and keep the last good data.

**Suggested API**
- `GET /public/proposals/{token}`
- `POST /public/proposals/{token}:accept`

**Tests**
- `TEST prop formats and extras`

**Code**
- `v6/s10_prop.js: prLanding`
- `v6/s10_prop.js: prAccept`

<a id="trip-ops"></a>

### undefined

`trip:ops` · Status: -

**Roles.** View: -. Act: -.

<a id="portal-frame"></a>

### Portal frame (external viewpoints)

`portal:frame` · Status: Roadmap

One minimal, mobile-first shell for every external viewpoint: who you are viewing as, a way back to the agency, and the portal tabs.

**Roles.** View: leader, traveler, supplier, guide. Act: leader, traveler, supplier, guide.

**Data.** `S.pv {k,id,tab}`, `PORTALS registry`

| Control | Does | Guard |
|---|---|---|
| Person picker | Switches the person inside the portal | PORTALS[k].people() |
| View as | Switches to any agency role or portal | Grouped: Agency team, Client side, Suppliers and field |
| Back to agency | Leaves the portal (S.pv=null) and opens Home | Always available |

**Rules**
- External people are not agency roles (not in ROLE_KEYS); access is by invitation link (proposed)
- Bottom tab bar under 721 px, top tabs above
- No Maya, tour or meeting buttons inside portals

**States**
- empty: A portal with no people shows its first tab with an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/me (proposed)`

**Tests**
- `TEST pv portal frame`

**Code**
- `v6/s13_portal.js: pvRegister, pvOpen, pvShell, pvRender, pvDays, pvDayCard, pvHousehold`
- `v6/m_portal.css`

<a id="home-ops"></a>

### Home, operations coordinator

`home:ops` · Status: Pilot

Give the operations coordinator one screen that shows which departures are ready, and the tasks, suppliers, room blocks and documents that still need her.

**Roles.** View: ops, manager. Act: ops. Permissions: `proj.viewAll`, `ops.tasks`, `ops.suppliers`, `ops.manifest`, `forms.build`.

**Data.** `Trip.stage`, `Trip.dep`, `Trip.tasks`, `Trip.sups`, `Trip.room`, `Trip.trav.form`, `Trip.trav.pass`, `Group.depPaid`

| Control | Does | Guard |
|---|---|---|
| Open next departure | Opens the operation dashboard of the nearest Operations trip | First Operations trip with dep >= today |
| Tasks this week / tile | Scrolls to the Tasks due card | Open tasks with due <= today + 7 days, overdue first |
| Done (task) | Marks the task done (opToggleTask) | Requires ops.tasks (matrix only) |
| Send request (supplier) | Moves the supplier to Pending (spSetFlow) and toasts | Requires ops.suppliers; contact-stage suppliers only |
| Send forms | Marks "not sent" traveler forms as sent (opSendForms), copies the link | Per trip |

**Rules**
- `Gauge = mean dbReadiness(t).overall of Operations trips departing within 90 days`
- `Suppliers to confirm = t.sups with spFlow(s) !== "approved"`
- `Blocks releasing = blockOf(t).cutoff within 45 days of today`
- `Forms missing = traveler form values (registration, medical, waiver) that are not "done"`
- `Vouchers to issue = approved suppliers on Operations trips`
- Real hotels and venues never appear next to negative wording; exposure shows only after the release date and only for fictional hotels

**States**
- empty: No Operations trips: a card says approved quotes appear here.
- loading: Not applicable (local data).
- error: Cards with nothing to do are hidden.

**Suggested API**
- `GET /v1/t/{tenantId}/dashboard/operations (proposed)`
- `PATCH /v1/t/{tenantId}/trips/{id}/suppliers/{n} (proposed)`

**Tests**
- `TEST oc operations home`

**Code**
- `v6/s13_oc.js: hcOps, ocModel, ocBoard, ocTasks, ocSups, ocBlocks, ocDocs`
- `v6/m_oc.css`

<a id="portal-leader-home"></a>

### Group leader portal: home

`portal:leader:home` · Status: Roadmap

The leader sees how much of the group price is collected, who still owes forms, and the one next step. For a quote it shows the proposal state and, when Sent, an Accept button.

**Roles.** View: leader. Act: leader.

**Data.** `CLIENTS[].contact`, `TRIPS where t.client===c.name and not Lost`, `groupsCalc(t)`, `calc(t)`, `t.trav[].form`

| Control | Does | Guard |
|---|---|---|
| Accept proposal | Calls prAccept(t): Sent becomes Negotiating, stage stays Quote | Only for qst Sent; never winQuote |
| Remind unpaid households | Simulated toast, no email sent | Only when a balance is open |

**Rules**
- Default trip is the nearest upcoming non-Lost trip, else the most recent
- `Gauge = collected / group price`
- Draft: no accept, "being prepared"; Negotiating and Approval: "Accepted"

**States**
- empty: A client with no non-Lost trip is not listed. A quote has no households, so Pay and Travelers explain what opens after acceptance.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/trips (proposed)`

**Tests**
- `TEST pl group leader portal`

**Code**
- `v6/s13_pl.js`
- `v6/m_pl.css`

<a id="portal-leader-trip"></a>

### Group leader portal: trip

`portal:leader:trip` · Status: Roadmap

The day-by-day itinerary with clock times, hotel and departure point. For a quote, the proposal summary: price per traveler, deposit, inclusions and the public proposal page.

**Roles.** View: leader. Act: leader.

**Data.** `pvDays(t)`, `t.room.hotel`, `calc(t).byType`, `prLanding(t) (preview)`

| Control | Does | Guard |
|---|---|---|
| Open proposal page | Shows the public proposal page inline | Quotes that are not Draft |

**Rules**
- Departure point is a fixed demo placeholder at 7:00 AM
- Commissions and margins never appear

**States**
- empty: A client with no non-Lost trip is not listed. A quote has no households, so Pay and Travelers explain what opens after acceptance.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/trips (proposed)`

**Tests**
- `TEST pl group leader portal`

**Code**
- `v6/s13_pl.js`
- `v6/m_pl.css`

<a id="portal-leader-pay"></a>

### Group leader portal: payments

`portal:leader:pay` · Status: Roadmap

Payment status per household with a totals footer that ties to the agency books.

**Roles.** View: leader. Act: leader.

**Data.** `groupsCalc(t).rows`, `calc(t).rev`

| Control | Does | Guard |
|---|---|---|
| Send reminder | Simulated toast per household | Only rows with a balance open |
| Filter | All / Open / Late | Footer always shows all households |

**Rules**
- `Footer amount = group price; collected = sum of paid; open = amount - collected`
- Quotes show the deposit and balance schedule instead

**States**
- empty: A client with no non-Lost trip is not listed. A quote has no households, so Pay and Travelers explain what opens after acceptance.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/trips (proposed)`

**Tests**
- `TEST pl group leader portal`

**Code**
- `v6/s13_pl.js`
- `v6/m_pl.css`

<a id="portal-leader-people"></a>

### Group leader portal: travelers

`portal:leader:people` · Status: Roadmap

Which travelers have finished registration, medical and waiver forms, and passports for international trips.

**Roles.** View: leader. Act: leader.

**Data.** `t.trav[].form`, `t.trav[].pass`, `opPassWarn(t,x)`

| Control | Does | Guard |
|---|---|---|
| Remind | Simulated toast per traveler | Only when something is missing |

**Rules**
- `Complete = all three forms done`
- Passport column only on international trips
- The rooming-preference form has no per-traveler data here

**States**
- empty: A client with no non-Lost trip is not listed. A quote has no households, so Pay and Travelers explain what opens after acceptance.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/trips (proposed)`

**Tests**
- `TEST pl group leader portal`

**Code**
- `v6/s13_pl.js`
- `v6/m_pl.css`

<a id="portal-leader-docs"></a>

### Group leader portal: documents

`portal:leader:docs` · Status: Roadmap

The proposal, the household invoices and receipts, the printable itinerary and a sample waiver.

**Roles.** View: leader. Act: leader.

**Data.** `incomeDocs(t).docs`, `calc(t)`

| Control | Does | Guard |
|---|---|---|
| Itinerary, print as PDF | window.print() in a try/catch | Always |

**Rules**
- Waiver wording is a sample and says it must be reviewed by counsel
- Quote-stage trips have no invoices

**States**
- empty: A client with no non-Lost trip is not listed. A quote has no households, so Pay and Travelers explain what opens after acceptance.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/trips (proposed)`

**Tests**
- `TEST pl group leader portal`

**Code**
- `v6/s13_pl.js`
- `v6/m_pl.css`

<a id="portal-leader-msgs"></a>

### Group leader portal: messages

`portal:leader:msgs` · Status: Roadmap

A thread with the trip agent. The seed is deterministic per trip; the leader can add messages.

**Roles.** View: leader. Act: leader.

**Data.** `PVMSG[tripId] (PERSIST pv-msgs)`, `agn(t.agent)`

| Control | Does | Guard |
|---|---|---|
| Send | Appends {from:"leader",at,text} to the thread | Non-empty text, 1000 characters |

**Rules**
- The agent does not reply automatically; the note says "Your agent replies by email."
- Messages live on this laptop only

**States**
- empty: A client with no non-Lost trip is not listed. A quote has no households, so Pay and Travelers explain what opens after acceptance.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/trips (proposed)`

**Tests**
- `TEST pl group leader portal`

**Code**
- `v6/s13_pl.js`
- `v6/m_pl.css`

<a id="portal-traveler-home"></a>

### Traveler app: home

`portal:traveler:home` · Status: Roadmap

The traveler's own readiness, balance and what is left to do before departure.

**Roles.** View: traveler. Act: traveler.

**Data.** `t.trav[i]`, `groupsCalc(t).rows`, `t.dep`, `pt-room`

| Control | Does | Guard |
|---|---|---|
| Pay balance | Opens the Pay tab | Shown only when the household has an open amount |
| Fill forms | Opens the Forms tab | Always available |

**Rules**
- Portal access is by invitation link (proposed); the traveler sees only their own household
- Simulated payment: no card data, no money moves
- Phone-width column on desktop, full width on phones
- `Readiness = equal parts: forms done (reg, medical, waiver), household paid, passport received (international only)`

**States**
- empty: A trip with no travelers shows an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/me (proposed)`

**Tests**
- `TEST pt traveler app`

**Code**
- `v6/s13_pt.js`
- `v6/m_pt.css`

<a id="portal-traveler-pay"></a>

### Traveler app: pay

`portal:traveler:pay` · Status: Roadmap

The household amount, deposit and balance, and a simulated card payment.

**Roles.** View: traveler. Act: traveler.

**Data.** `t.groups[gi].depPaid`, `t.groups[gi].balPaid`, `t.depDue`, `t.balDue`, `pvPayLink`

| Control | Does | Guard |
|---|---|---|
| Pay now | Opens the simulated card step | Deposit first if unpaid, else balance |
| Confirm and pay | Sets depPaid or balPaid on the household | Collected rises by the amount; revenue and profit do not change |
| Copy link | Copies the household payment link | pay.redbudtours.example placeholder |

**Rules**
- Portal access is by invitation link (proposed); the traveler sees only their own household
- Simulated payment: no card data, no money moves
- Phone-width column on desktop, full width on phones

**States**
- empty: A trip with no travelers shows an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `POST /v1/portal/{token}/payments (proposed)`

**Tests**
- `TEST pt traveler app`

**Code**
- `v6/s13_pt.js`
- `v6/m_pt.css`

<a id="portal-traveler-forms"></a>

### Traveler app: forms

`portal:traveler:forms` · Status: Roadmap

The four traveler forms (registration, medical, waiver, rooming), filled in inline.

**Roles.** View: traveler. Act: traveler.

**Data.** `x.form.reg|med|waiver`, `pt-room (4th form)`, `FB forms (published fields)`

| Control | Does | Guard |
|---|---|---|
| Fill in / Review | Opens the form inline | Fields come from the form builder |
| Submit | Sets the form status to done | Required fields checked; waiver needs acceptance |

**Rules**
- Portal access is by invitation link (proposed); the traveler sees only their own household
- Simulated payment: no card data, no money moves
- Phone-width column on desktop, full width on phones
- Waiver wording is a sample, to be reviewed by counsel
- The rooming form is not counted in "forms missing"

**States**
- empty: A trip with no travelers shows an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `PUT /v1/portal/{token}/forms/{form} (proposed)`

**Tests**
- `TEST pt traveler app`

**Code**
- `v6/s13_pt.js`
- `v6/m_pt.css`

<a id="portal-traveler-plan"></a>

### Traveler app: plan

`portal:traveler:plan` · Status: Roadmap

The trip day by day with clock times, hotel and meeting point.

**Roles.** View: traveler. Act: traveler.

**Data.** `pvDays(t)`, `t.room.hotel`

**Rules**
- Portal access is by invitation link (proposed); the traveler sees only their own household
- Simulated payment: no card data, no money moves
- Phone-width column on desktop, full width on phones
- Day 1 starts at the 07:00 demo departure; the meeting point is a fixed placeholder
- Today's day is highlighted only while the trip is running

**States**
- empty: A trip with no travelers shows an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/itinerary (proposed)`

**Tests**
- `TEST pt traveler app`

**Code**
- `v6/s13_pt.js`
- `v6/m_pt.css`

<a id="portal-traveler-help"></a>

### Traveler app: help

`portal:traveler:help` · Status: Roadmap

Who to call, the traveler's emergency contact, diet and passport status.

**Roles.** View: traveler. Act: traveler.

**Data.** `GUIDES`, `STAFF`, `x.emerg`, `x.diet`, `x.passNo`, `opPassWarn`

| Control | Does | Guard |
|---|---|---|
| Call | Dials the number (tel: link) | Agency 24/7 line, tour director, agent |

**Rules**
- Portal access is by invitation link (proposed); the traveler sees only their own household
- Simulated payment: no card data, no money moves
- Phone-width column on desktop, full width on phones
- Passport shown masked; warning when valid under 6 months after return

**States**
- empty: A trip with no travelers shows an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/contacts (proposed)`

**Tests**
- `TEST pt traveler app`

**Code**
- `v6/s13_pt.js`
- `v6/m_pt.css`

<a id="portal-supplier-home"></a>

### Supplier portal: home

`portal:supplier:home` · Status: Roadmap

What needs the supplier today: bookings to confirm, arrivals, invoices awaiting payment and open queries.

**Roles.** View: supplier. Act: supplier.

**Data.** `SUPPLIERS (fictional)`, `t.sups`, `tripGaps(t)`, `effAmt(inv)`

| Control | Does | Guard |
|---|---|---|
| Confirm bookings | Opens the requests tab | Always available |
| Invoices | Opens the invoices tab | Always available |

**Rules**
- `Gauge = invoiced amount paid, approved or credited, over all invoiced`
- KPI tiles open the matching tab
- Fictional suppliers only: a real hotel or venue is never listed or shown
- Portal access is by invitation link (proposed), so no agency permissions apply

**States**
- empty: A supplier with nothing to show gets a short explanation card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/supplier (proposed)`

**Tests**
- `TEST ps supplier portal`

**Code**
- `v6/s13_ps.js`
- `v6/m_ps.css`

<a id="portal-supplier-req"></a>

### Supplier portal: booking requests

`portal:supplier:req` · Status: Roadmap

Every booking the agency asked this supplier for, with Confirm and Decline.

**Roles.** View: supplier. Act: supplier.

**Data.** `t.sups entry (st, flow)`, `t.lines`

| Control | Does | Guard |
|---|---|---|
| Confirm | flow=approved, st=Confirmed (same writes as spSetFlow) | The agency sees it in the trip Suppliers tab |
| Decline | flow=contact, st=Not sent | Agency is notified (simulated) |

**Rules**
- Supplier acts as the supplier: no agency permission gate (A1)
- Fictional suppliers only: a real hotel or venue is never listed or shown
- Portal access is by invitation link (proposed), so no agency permissions apply

**States**
- empty: A supplier with nothing to show gets a short explanation card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/supplier (proposed)`

**Tests**
- `TEST ps supplier portal`

**Code**
- `v6/s13_ps.js`
- `v6/m_ps.css`

<a id="portal-supplier-list"></a>

### Supplier portal: rooming lists

`portal:supplier:list` · Status: Roadmap

Rooming list for lodging and head count, dietary counts and service times for other services.

**Roles.** View: supplier. Act: supplier.

**Data.** `t.trav`, `blockOf(t)`, `pvDays(t)`

| Control | Does | Guard |
|---|---|---|
| Print | Prints the page | window.print in try/catch |
| Show all rooms | Expands the room table | First 8 rooms shown |

**Rules**
- Upcoming trips only
- Fictional suppliers only: a real hotel or venue is never listed or shown
- Portal access is by invitation link (proposed), so no agency permissions apply

**States**
- empty: A supplier with nothing to show gets a short explanation card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/supplier (proposed)`

**Tests**
- `TEST ps supplier portal`

**Code**
- `v6/s13_ps.js`
- `v6/m_ps.css`

<a id="portal-supplier-inv"></a>

### Supplier portal: invoices

`portal:supplier:inv` · Status: Roadmap

Invoices the supplier submitted, in neutral words, with the expected payment date.

**Roles.** View: supplier. Act: supplier.

**Data.** `l.inv`, `invStatus(l)`, `terms.balDays`

**Rules**
- Status order: Credit issued, Approved, Paid, Matched, Query open, Received, Not invoiced
- `Expected payment = trip end + terms.balDays`
- Fictional suppliers only: a real hotel or venue is never listed or shown
- Portal access is by invitation link (proposed), so no agency permissions apply

**States**
- empty: A supplier with nothing to show gets a short explanation card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/supplier (proposed)`

**Tests**
- `TEST ps supplier portal`

**Code**
- `v6/s13_ps.js`
- `v6/m_ps.css`

<a id="portal-supplier-disp"></a>

### Supplier portal: queries

`portal:supplier:disp` · Status: Roadmap

Differences the agency found between the invoice and the agreed price, with two answers.

**Roles.** View: supplier. Act: supplier.

**Data.** `tripGaps(t)`, `l.inv.st`, `l.inv.reply`

| Control | Does | Guard |
|---|---|---|
| Issue credit | inv.credit += effAmt(inv) - planC(l); inv.st=credited (gapCredit) | Only for open or sent queries above zero |
| Reply with documents | inv.reply=true and a toast | Query stays open |

**Rules**
- Wording: difference, query, credit; never overbilling or dispute
- `Finance identity planProfit - amtDiff - fx - fcProfit = 0 still holds`
- Meeting beat selects .ps-disp
- Fictional suppliers only: a real hotel or venue is never listed or shown
- Portal access is by invitation link (proposed), so no agency permissions apply

**States**
- empty: A supplier with nothing to show gets a short explanation card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/supplier (proposed)`

**Tests**
- `TEST ps supplier portal`

**Code**
- `v6/s13_ps.js`
- `v6/m_ps.css`

<a id="portal-supplier-pay"></a>

### Supplier portal: payments

`portal:supplier:pay` · Status: Roadmap

Deposit and balance dates from the supplier terms, and the remittance history.

**Roles.** View: supplier. Act: supplier.

**Data.** `SUPPLIERS[].terms`, `l.inv.paid`, `l.inv.credit`

**Rules**
- `Deposit due = arrival - depDays; balance due = trip end + balDays`
- Payments are simulated: no money moved
- Fictional suppliers only: a real hotel or venue is never listed or shown
- Portal access is by invitation link (proposed), so no agency permissions apply

**States**
- empty: A supplier with nothing to show gets a short explanation card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/supplier (proposed)`

**Tests**
- `TEST ps supplier portal`

**Code**
- `v6/s13_ps.js`
- `v6/m_ps.css`

<a id="portal-guide-day"></a>

### Run sheet: day

`portal:guide:day` · Status: Roadmap

The day for the tour director: stops with clock times, a done tick per stop and the supplier contact per stop.

**Roles.** View: guide. Act: guide.

**Data.** `t.items (day, hrs) through pvDays`, `t.lines and SUPPLIERS contact`, `PVRUN (PERSIST pv-run)`, `GUIDES`

| Control | Does | Guard |
|---|---|---|
| Trip and day chips | Pick the trip (default: nearest departure) and the day (default day 1) | S.pgTrip, S.pgDay |
| Mark done | Ticks a stop; survives reload | PVRUN[tripId|day] |
| Call supplier | Opens the phone dialer | Fictional suppliers only; real venues show the name and a neutral desk label |

**Rules**
- Access is by invitation link (proposed); the tour director is not an agency role
- Real hotels and venues show their name and neutral wording only
- Phone-first: large tap targets, high contrast, one column

**States**
- empty: A guide with no Operations trips sees an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/run/{trip}/day/{n} (proposed)`
- `PUT /v1/portal/{token}/run/{trip}/stops/{id}/done (proposed)`

**Tests**
- `TEST pg tour director run sheet`

**Code**
- `v6/s13_pg.js: pgDay, pgPax, pgVouch, pgNotes, pgContact, pgLineFor`
- `v6/m_pg.css`

<a id="portal-guide-pax"></a>

### Run sheet: passengers

`portal:guide:pax` · Status: Roadmap

The manifest with dietary and medical flags, emergency contacts to call, passport status on international trips and a local head count.

**Roles.** View: guide. Act: guide.

**Data.** `t.trav (diet, form.med, emerg, pass, passExp)`, `opPassWarn`

| Control | Does | Guard |
|---|---|---|
| Flags only | Filters the manifest to travelers with a dietary or medical flag | diet is not None, or the medical form is not done |
| Count heads | Ticks each traveler on board; the count stays on this device | Not saved |
| Emergency contact | Calls the emergency contact | tel: link |

**Rules**
- Access is by invitation link (proposed); the tour director is not an agency role
- Real hotels and venues show their name and neutral wording only
- Phone-first: large tap targets, high contrast, one column

**States**
- empty: A guide with no Operations trips sees an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/run/{trip}/manifest (proposed)`

**Tests**
- `TEST pg tour director run sheet`

**Code**
- `v6/s13_pg.js: pgDay, pgPax, pgVouch, pgNotes, pgContact, pgLineFor`
- `v6/m_pg.css`

<a id="portal-guide-vouch"></a>

### Run sheet: vouchers

`portal:guide:vouch` · Status: Roadmap

Vouchers for suppliers that are approved on the trip, with the number to show at the desk.

**Roles.** View: guide. Act: guide.

**Data.** `t.sups (spFlow approved)`, `spLine(t,s)`

| Control | Does | Guard |
|---|---|---|
| Show number | Read the number to the supplier desk | RB-<t.no>-<l.id> |

**Rules**
- Voucher number is RB-<trip no>-<component id>
- A voucher appears only for an approved supplier

**States**
- empty: A guide with no Operations trips sees an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `GET /v1/portal/{token}/run/{trip}/vouchers (proposed)`

**Tests**
- `TEST pg tour director run sheet`

**Code**
- `v6/s13_pg.js: pgDay, pgPax, pgVouch, pgNotes, pgContact, pgLineFor`
- `v6/m_pg.css`

<a id="portal-guide-notes"></a>

### Run sheet: notes

`portal:guide:notes` · Status: Roadmap

Notes from the road: incidents, changes to the plan and guest requests, per trip.

**Roles.** View: guide. Act: guide.

**Data.** `PVNOTE[tripId] (PERSIST pv-notes)`

| Control | Does | Guard |
|---|---|---|
| Save note | Adds a note with type and day | Up to 500 characters |
| Delete note | Removes the note | Local to the demo |

**Rules**
- Access is by invitation link (proposed); the tour director is not an agency role
- Real hotels and venues show their name and neutral wording only
- Phone-first: large tap targets, high contrast, one column

**States**
- empty: A guide with no Operations trips sees an empty-state card.
- loading: Not applicable (local data).
- error: A view that throws shows "This screen could not load."

**Suggested API**
- `POST /v1/portal/{token}/run/{trip}/notes (proposed)`
- `DELETE /v1/portal/{token}/run/{trip}/notes/{id} (proposed)`

**Tests**
- `TEST pg tour director run sheet`

**Code**
- `v6/s13_pg.js: pgDay, pgPax, pgVouch, pgNotes, pgContact, pgLineFor`
- `v6/m_pg.css`
