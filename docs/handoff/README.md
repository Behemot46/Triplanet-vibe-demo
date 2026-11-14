# Developer handoff package

For the developers who will build the real Triplanet product (React + MUI front end, Java / Spring back end). The booth demo in this repository is the **specification you can click**: every screen, rule and number in it is real behaviour you can check against the code. These documents explain what is real, what is simulated, and in what order to build it.

The demo is a single offline HTML file for trade shows: Triplanet is an AI-assisted SaaS for group tour operators. The agency in it, "Redbud Group Tours" (Tulsa), 20 trips and 6 agents, is fictional. Hotel and venue names are real; their rates are illustrative.

Written from the code on branch `claude/upbeat-dirac-kiveik` (13 Nov 2026, up to commit `a9fdf77`). When a document and the code disagree, the code is right. Please tell us.

## 1. Run the demo

| Step | Command | Notes |
|---|---|---|
| Open | open `v6/triplanet-booth.html` in Chrome or Edge | Works offline. Starts in English; the flag button in the header switches to Hebrew (full RTL). The sun/moon button switches night mode. |
| Build | `python3 build.py` | Writes `v6/triplanet-booth.html` from `v6/*.js` and `v6/*.css` (order in `build.py`). `TP_SKIP=file.js,...` leaves modules out while debugging. |
| Check | `node check6.js` | About 15 s. Must print `LEFTOVER 0`, `bad 0`, no page errors, `TEST … ok` for each module, and the line `P rev 950103.7 pp 142334.7 fp 138322.99`. If a change moves that line you changed a finance rule. |
| Screenshots | `node shot8.js [prefix]` (also `shot6.js`, `shot7.js`, `shot9.js`) | Output goes to `shots/` (git-ignored). Needs Playwright. |
| Regenerate | `cd tools/geo && npm install && node build_geo.mjs`; `cd tools/brand && npm install && node build_brand.mjs`; `python3 tools/avatars/embed_headshots.py` | Only when cities, icons, logo, fonts or avatars change. |

To explore: use **View as** (header) to switch between the owner (Ella Brooks), the accountant (Nora Kim) and the six agents; each sees different screens and numbers. Use **Reset demo data** in the settings (gear) menu to return to the starting state. The guided tour (header) and meeting mode (1, 3 or 10 minutes) walk the story: leaks, invoice check, dispute, close.

### Developer notes and the UI kit

- **Developer notes.** Settings (gear) menu > **Show developer notes**. Each screen then shows a panel with purpose, roles, data, actions, rules, states, tests and suggested API, from one registry (`SPEC[key]`, contract in `docs/spec-v8.1-clarity.md`). The toggle is stored in `localStorage` key `triplanet-devnotes`. The menu entry appears only when the module is in the build (`s3_shell.js` checks `typeof devPanel === 'function'`).
- **UI kit page.** `VIEWS.uikit`, linked from Settings and from developer notes: live examples of every component with class names and usage notes (module `s11_uikit.js`).
- **Coverage.** Every page, role home, trip tab, trip sub-view, drawer and modal has an entry (46 of 46, checked by `TEST dv developer notes`). The panel follows the screen you are on, including the trip plan view (By day, By components, Map) and the proposal format. Use **Copy as Markdown** to paste a screen's spec into a ticket.

### What to look at first (clarity features)

- **Sidebar by job**: Home, then Sales, Catalog, Money, Help, Admin (`s3_shell.js: NAV_SECTIONS`). "New" pills mark the features the product does not have yet.
- **Next step on every file**: a bar under the project header says what to do now, from the data, with one primary button (`s11_next.js: nextSteps`, `nxBar`). The agent home lists the agent's next steps across files.
- **Stage moves**: the status chip in the project header opens a menu (Mark as lost, Move to financial close, Close the file). Each move has a guard that says why it is blocked, the same guard drives a card on the Operation dashboard and the next-step bar, and a lost quote leaves every open-quote total (`s11_next.js: stmCheck, advanceStage, markLost`; rules in `business-rules.md` §28).
- **Global search**: the header magnifier (or Ctrl/Cmd+Shift+F) finds projects, clients, suppliers, hotels and pages (`s11_search.js: gsSearch`).
- **Role homes**: owner, accountant and agent each get their own dashboard; every number drills to the screen that explains it.
- **Developer notes and UI kit**: the spec and the component reference, inside the product.

## 2. The documents

| File | What it is | Read it for |
|---|---|---|
| `README.md` (this) | The map, simulated-vs-real, build order, open decisions | Start here |
| `data-model.md` | Every entity as tables (field, type, meaning, example, where set or read, origin) and a Mermaid ER diagram. Mapping to `docs/backend-plan` tables | Schema design |
| `business-rules.md` | 30 rules with formulas, inputs, edge cases, the test that guards each, and a worked example with real demo numbers. A list of code inconsistencies (§32; seven of the twelve are marked resolved) | Finance engine, services, tests |
| `design-system.md` | Tokens (light and dark), typography, spacing, layout, components, RTL, dark mode, mobile, accessibility, content rules | Front end, MUI theme |
| `screens.md` | One section per screen from the developer-notes registry: purpose, roles, data, actions, rules, states, suggested API, tests, code pointers. **Generated** by `node tools/spec/export_spec.js` after `python3 build.py`; do not edit by hand | Page by page build |

Other documents in the repository:

| File | Use |
|---|---|
| `CLAUDE.md` | Owner's handover: constraints, decisions, module map |
| `docs/spec-v8-parity.md` | The v8 spec (parity with the live product, amendments A1 to A19) |
| `docs/spec-v8.1-clarity.md` | The v8.1 spec (clarity, developer notes, this package) |
| `docs/v8-builder-brief.md` | How modules plug into the demo (hooks, rules) |
| `origin/claude/fervent-babbage-bkgptx`: `docs/backend-plan/` | The backend plan (Postgres, API, finance engine, AI, integrations, security). `04-finance-engine.md` is the closest sibling of `business-rules.md`; differences are called out in both documents |

Naming: the demo says "traveler" (US spelling); the backend plan says `traveller`. The demo's "household" is the plan's `booking_group`. The demo's "invoice check" is the plan's gap workflow. Section 1 of `data-model.md` maps every name.

## 3. Module map (from the code)

All in `v6/`; build order is in `build.py: JS_ORDER`. One HTML file, no frameworks, no CDN calls.

| File | What it holds |
|---|---|
| `s0_brand.js` | GENERATED: Solar icons (`ic()`), Triplanet logo |
| `s0_avatars.js` | GENERATED: AI-generated staff headshots (people who do not exist) |
| `s0_geo.js`, `s0_photos.js`, `s0_video.js` | Map geometry, photos (credited), embedded video |
| `s1_core.js` | **Data model, generators, finance math** (`calc`, `invStatus`, `gapStats`, `groupsCalc`, `portfolio`), trip specs, inbox files, extension hooks `PERSIST`, `TESTS`, `TRIP_INIT`, `TRIP_TABS`, `SPEC` |
| `s1c_catalog.js` | Real hotels (65), venues (82), airlines, brands, 5 extra destinations |
| `s1d_data.js` | 344 suppliers, rate cards, alternatives (`altsFor`, `altCost`) |
| `s1e_people.js` | Clients (24), staff, roles, 40 permissions, `can()`, traveler extras, `blockOf` |
| `s1b_labels.js` | Labels, gap explanations, alerts |
| `s2_i18n.js` | Hebrew-to-English translator (`DICT`, `trHtml`) |
| `s3_shell.js` | State, save and load, navigation, shell, Maya drawer, guided tour |
| `s4_views.js` | Home hero and statistics, quotes list, trip tabs (General, Plan, Pricing, Proposal, Approval, Billing) |
| `s5_fin.js` | Trip invoice check, gap cards, dispute email, Invoice check page, Finance dashboard |
| `s6_rest.js` | Templates, hotels, suppliers, activities, users, import, Maya questions (`QS`, 28), event wiring |
| `s6b_dnd.js` | Trip-plan drag and drop (mouse, touch, pen) |
| `s7_leak.js` | Leak model and Profit leaks screen |
| `s7b_product.js` | Product fidelity: stages and tabs, Operation and Finance dashboards, Income, Vouchers |
| `s7c_lists.js`, `lists.css` | Product-style lists: Activities, Hotels, Clients |
| `s8_gen.js` | Trip studio (`genPlan`, `genCreate`), brand badges, `brandSwap`, catalog Hotels |
| `s9a_books.js` | Accounting sync (simulated): QuickBooks, Xero, Priority, Hashavshevet |
| `s9b_status.js` | "What's live": `FEAT` table (Live / Pilot / Roadmap) |
| `s9c_live.js` | Maya live mode (Claude API; key kept in the browser, never in the repo) |
| `s9d_maya.js` | Maya always at hand: face, page tips, one-tap plan fix, `/` shortcut |
| `s10_forms.js` | Schema-driven forms engine and drawer |
| `s10_fbuild.js` | Form builder, traveler forms and responses |
| `s10_prop.js` | Proposal formats, tier pricing, overhead and brokerage |
| `s10_tbday.js` | Trip plan views (By day, By components, Map), day details, day templates |
| `s10_tbcomp.js` | By components, supplier swap and undo, Versions |
| `s10_sup.js` | Supplier list and card, in-trip suppliers, client card |
| `s10_ops.js` | Tasks (48-task library), Master list, room blocks |
| `s10_settings.js` | Settings: organization, roles and permissions, stages, links |
| `s10_dacct.js`, `s10_dash.js` | Role dashboards: accountant, manager, agent |
| `s11_next.js` | Next-step bar, stage moves (`stmCheck`, `advanceStage`, `markLost`), status menu, Operation dashboard move card |
| `s11_fix.js` | `gapCredit` (the one credit function) and the test that pins permissions, credits, stage moves, the locked rate and receipts |
| `s9_meet.js` | Meeting mode: three cuts of one story, booth lead capture, kiosk idle reset |
| `s9_boot.js` | Wraps render and reset, then `load(); render()`. Must stay last |
| `base.css`, `extra.css`, `v7.css`, `brand-fonts.css`, `theme.css`, `lists.css`, `m_*.css` | Styles in load order; `theme.css` holds the theme |

Hooks to read first (`docs/v8-builder-brief.md`): `VIEWS[key]` pages, `NAV`, `PTABS` + `STAGES` + `TRIP_TABS`, `TRIP_INIT` (idempotent per-trip initializers), `PERSIST` (saved datasets), `TESTS` (module self-tests run by `check6.js`), `can(perm)`.

How strings and events work: every visible string is `L(he, en)`; data goes through `esc()`; markup is built as template strings; clicks use `data-act` (delegated in `s6_rest.js`), changes use `data-ch`, inputs `data-in`, forms `data-form`. State is the object `S`; saved in `localStorage` key `triplanet-booth-demo-v8`.

## 4. Simulated vs real

| Area | Real (behaviour to build) | Simulated or fictional in the demo |
|---|---|---|
| Pricing, markup, discounts, overhead, brokerage | The formulas (`business-rules.md` §2 to §4) | Costs and rates are illustrative |
| Planned vs expected profit, identity, FX, commission | The formulas (§5 to §7) | Locked rate has seeded noise; commission "not received" is a hash rule (`commPaid`) |
| Supplier invoice matching and gaps | Detection rule and statuses (§8 to §10) | Invoices are generated; gap `kind` is written by the generator; invoice "reading" is an animation over sample PDFs. No email or upload pipeline |
| Leak bridge and "at risk" | The model (§11, §12) | |
| Billing groups, deposits, late payments, aging | The rules (§13, §14) | Payment flags are generated; no real payments or links (`pay.redbudtours.example`) |
| Income documents, vouchers | The derivation rule (§16) | Numbers are derived, nothing is issued; sales tax not modeled |
| Supplier directory, rates, alternatives, swap, versions | Shapes and guards (§18 to §21) | 344 suppliers, 156 generated names, rate multipliers and jitter, ratings, reply times, documents |
| Forms and traveler forms | Engine, builder, completion states (§24) | Responses are computed from traveler data; no public form pages; sample waiver wording |
| Tasks, master list, room blocks | Library, windows, overdue, block types (§22, §23) | Task completion is generated; import is a 5-row preview; release cutoff is a fixed `dep − 30 d` |
| Roles and permissions | The 40-key matrix as a proposal (§25) | Roles are a "view as" switch; 13 of the 40 permissions are enforced, 27 are matrix only |
| Accounting sync | Object mapping per system (`s9a_books.js: ACCT`) | Entire flow is simulated against a sample company file; badged Pilot |
| Maya | The idea; the live-mode grounding (`liveSnapshot`) | 28 scripted answers; live mode needs a key kept in the browser |
| Trip studio | Same lines and `calc` as quotes (§27) | Routing is straight-line geometry over a 48-city map |
| Dashboards | Definitions (§29) | "Year on year" and prior-year statistics on Home are fictional |
| Today | | Fixed at 2026-10-20 |
| People, clients, travelers, agency | | All fictional; emails use `.example` |

## 5. Known limitations and open owner decisions

From `CLAUDE.md` and the code. These are decisions for the owner, not for you, but they affect what you may copy.

1. **Agent annual targets** (`s1e_people.js: STAFF_TARGET`, 260,000 to 380,000 USD): approved by the owner on 14 Nov 2026.
2. **FEAT statuses** (`s9b_status.js`): 8 Live, 12 Pilot, 4 Roadmap. Finance stage, invoices, payments, trip P&L, integrations and multi-currency were moved to Pilot on 13 Nov 2026 after a read-only walkthrough of dev.triplanet.io (Sep 2026 report, not verified with the product team). **The product team must confirm what is live in finance before IITA (31 Jan 2027).**
3. **Fictional supplier names** (`SUP_FICT`, 156 generated names across hotels, coaches, shuttles, guides, meals, air and insurance desks). The owner reviews the list before a show. Print it with `node check6.js | grep "^SUPPLIERS"`.
4. **Sample waiver wording** (`s10_fbuild.js: FB_TERMS`) is marked "SAMPLE WORDING ONLY". Counsel must write the real text.
5. **Hebrew data translation scope.** English and Hebrew UI strings are complete. In Hebrew mode, generic data strings (line names such as "Twin rooms, 9 nights", service variants, room types, plan items and well-known sites) are translated by `s11_trdata.js` (`heData`, about 360 phrases and 26 patterns). Company, hotel, venue, client and traveler names stay as written. Client-facing documents (the PDF proposal, payment requests, supplier emails) stay in English on purpose, because they go to US clients and suppliers.
6. **Real brands** are shown with a neutral badge (no logos; permission needed). Real names never sit next to negative wording. Some Israeli hotels' operating status and some star ratings are approximate (catalog caveat).
7. **Gap frequency** (about 20% of invoices carry a gap) is an estimate, not a benchmark.
8. **Placeholders**: payment and email domains are `.example`; tax id `73-0000000`.
9. **Accounting object names** for Priority and Hashavshevet must be verified with an accountant before any Israeli demo. Live connections (Intuit, Xero, Priority, Hashavshevet) are product work.
10. **The demo's "today"** stays 2026-10-20 (moving it re-baselines every dated figure).
11. **Prior-year statistics** on Home (won and canceled projects, year-on-year chips) are fictional.
12. **Permissions**: 13 of the 40 are enforced (`ST_ENFORCED` in `s10_settings.js`, pinned to the code by a test: `users.manage, fin.sync, fin.view, prop.approve, fin.issueDocs, settings.edit, settings.stages, price.edit, forms.build, sup.edit, sup.swap, ops.suppliers, cli.edit`); the other 27 show in the matrix only. The earlier mismatch between the "8 enforced" list and the code was fixed in a9fdf77 (`business-rules.md` §25, §32.1). Decide the production enforcement list; the matrix defaults are a proposal. CLAUDE.md still says "8 enforced" for `s10_settings.js`.
13. **Real-brand wording** and `brandSwap` are demo rules; they do not apply to customer data.

Code inconsistencies found while writing these documents are in `business-rules.md` §32. Fixed in a9fdf77 (permissions list and the two unchecked permissions, credit not marking paid, swap permission by screen, receipt label, free "locked" rate, no stage moves after win) and marked so there. Still open: partial credits, `byType` vs overhead and brokerage, `Trip.ctype` and the join by client name, `qdays` as a counter, `themeGet()` and `prefers-color-scheme`.

## 6. Suggested build order for the real product

Order by risk and by how much each step unlocks. Each step names the screens (view keys and trip tabs) and the rules to implement, and the demo tests to port as acceptance tests.

**Step 0. Foundations (before step 1).** Tenancy and users, roles and permissions server-side (rules §25; `02-data-model.md` §3.1 and §4), audit trail, money as integer minor units, `asOf` date instead of a fixed "today". Screens: Users, Settings > Roles and permissions. Entities: `data-model.md` §2 to §5.

**Step 1. Finance engine first.** It is the product's value and the part that must be exact.
- Rules: pricing §2 to §4; planned vs expected profit and identity §5; FX §6; commission §7; invoice status and gaps §8 to §10; leak bridge and at-risk §11, §12; billing groups, late, aging §13, §14; cash calendar §15; income documents §16.
- Screens: trip tabs Pricing (`costs`), Expenses (`tfin`), Finance dashboard (`fdash`), Income (`income`), Vouchers (`vouch`), Billing (`people`); pages Invoice check (`gaps`), Finance (`finance`), Profit leaks (`leaks`); the leak bridge SVG.
- Acceptance: export the demo's 20 trips after `resetDemo()` as golden fixtures and port `check6.js:12-14, 37-40, 51-57` (identities I1 to I4) with tolerance 0. Plan: `04-finance-engine.md` §5 (T1 to T12).
- Replace on the way: generated gap `kind` by a matcher (`04` §3.3), one-to-many invoice allocation, `commPaid` by real receipts, one FX lock per (trip, currency).

**Step 2. Suppliers and rates.**
- Rules: supplier rates §18; alternatives §19 (skip the market anchor; it only exists because the demo relabels hotels); swap and undo §20; versions §21; room-block exposure §22.
- Screens: Suppliers list and card (`suppliers`), in-trip Suppliers tab (`spm`: Contact / Pending / Approved / Price comparison), Trip plan By components (`plan`), Versions (`tbver`), Hotels, Activities, Clients and client card, Templates.
- Entities: supplier, rate, rate band, variant, block, version (`data-model.md` §14 to §16, §18).

**Step 3. Forms and operations.**
- Rules: task generation and overdue §23; form completion §24.
- Screens: Operation dashboard (`odash`), Tasks (`optasks`), Master list (`manifest`), form builder (`forms`, from Settings), traveler forms and responses, room blocks card, Proposal formats (`quote`: PDF, agents table, landing page; tier pricing §17).
- Replace: derived responses by a real `form_response` store; public form pages and links; import preview by real import.

**Step 4. Dashboards and assistants.**
- Rules: AR next 30 and AP schedule §15; dashboard definitions §29.
- Screens: Home for owner, accountant and agent (`home`), Accounting sync (`books`), Maya (`ai`, grounded on a server snapshot like `s9c_live.js: liveSnapshot`), Trip studio (`studio`; planner package separate from the finance engine), global search, next-step bar.

**Throughout.** Build the design system once (`design-system.md`): MUI theme from the tokens, Public Sans and Barlow, Solar icons, RTL and dark mode from day one, empty states with an action. Port the demo's tests as you go; check6's identity checks and the real-brand wording rule (as a content lint) are cheap to keep.
