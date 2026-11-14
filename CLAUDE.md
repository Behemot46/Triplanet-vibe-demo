# Triplanet booth demo - handover

## What this is
A single-file, offline-capable Hebrew/English (RTL/LTR) demo of Triplanet, an AI-assisted SaaS for group tour operators. It is shown at trade-show booths. NTA Travel Exchange '26 (Tulsa, 15-18 Nov 2026) ran the v6 build. v7 targets IITA Summit (Birmingham AL, 31 Jan-4 Feb 2027) and ABA Marketplace (Calgary, 6-9 Feb 2027). The target buyers are US group tour operators with 3-20 agents.

The story for a short meeting is easy process plus high value. The Trip studio builds a priced, mapped trip in seconds. Profit leaks and the invoice check show where planned profit went and recover it.

Agency data is fictional: "Redbud Group Tours" (Tulsa), 20 trips, 6 agents, an owner, an accountant and (since v8.4) an operations coordinator. Since v8.4 the demo can also be seen from outside the agency: the group leader, a traveler, a supplier and the tour director, each in their own portal. Since v7, hotel and venue names are REAL (owner decision, Nov 2026); see the brand rule below.

## Hard constraints
- Output is ONE self-contained HTML file. No frameworks, no CDN calls. The font (IBM Plex Sans Hebrew) and the map geometry are embedded.
- The file starts with `<meta charset="utf-8">`. Without it, Chromium mis-detects the encoding of the large file and every `$` and symbol turns into garbage.
- Must work offline on a booth laptop.
- Default language is English. The Hebrew toggle must be fully RTL.
- The assistant "Maya" answers from 28 scripted questions (count shown from QS.length). Since 12 Nov 2026 (owner decision) she also has an optional **live mode** (`v6/s9c_live.js`, Pilot):
  - only typed questions go live, to the Claude API (`claude-opus-5-5`, streaming, effort low, server-side refusal fallback), grounded on `liveSnapshot()`: the demo's current data as JSON;
  - the ready-made question buttons and meeting mode stay scripted;
  - the API key is entered on the booth laptop (settings menu > Maya live answers) and kept in that browser's localStorage. **Never put a key in the repo or the HTML file**;
  - no key, offline, an error, a refusal or no first word within 25 s: the scripted answer, with a note;
  - the header pill shows the real mode (Scripted or Live answers · Claude). Never label a scripted answer as live.
- **Real-brand rule:** a real company (hotel, chain, venue, airline) must never appear next to negative wording (gap, overbilling, dispute, late). Gap stories stay on fictional suppliers. `brandSwap()` gives a trip a real hotel only if none of its invoices has a gap. `check6.js` fails if any catalog name appears in a gap.
- No official logos. Brands appear as a neutral badge: a colored square with an initial, plus the name. Using real logos needs the brand owner's permission.

## Look and feel (since v7): indistinguishable from the product
- The design is taken from the live product bundle at app.triplanet.io (Nov 2026):
  - MUI "Minimal" kit, primary color "preset1" (`#078DEE`, light `#68CDF9`, dark `#0351AB`, darker `#012972`);
  - navigation "integrate": white, with a dashed divider;
  - Public Sans for UI and Barlow for figures;
  - Solar icons (bold-duotone in the navigation);
  - light (day) mode by default, plus the kit's dark palette as night mode. The sun/moon button in the header toggles it; the choice is kept per laptop in localStorage `triplanet-theme` (outside the demo state, so Reset and the idle kiosk reset keep it). Colors must come from the theme tokens, never a literal that reads in one mode only.
- Since v8.3 (14 Nov 2026) every page uses the same language: `hcPage` header band (eyebrow = sidebar section, one-sentence brief with emphasized figures, at most two buttons, 2-4 KPI tiles that drill), `.hc-grid` columns and `.hc-card` cards. Color emphasis inside text (owner decision): `hlNeg` red for a negative outcome, `hlPos` green for a positive one, `hlWarn` amber for money still open, `hlKey` bold neutral; only the key figure, at most two or three per sentence. Rules for builders: `docs/v8.2-style-brief.md`. Per-screen CSS lives in `v6/m_v82a.css`..`m_v82e.css`. The same "can still be recovered" figure (open + disputed gaps) appears on Home, Invoice check, Profit leaks and Accounting sync.
- Since 14 Nov 2026 (owner request: "stun the viewer") the owner's Home is the command center in `v6/s12_home.js` + `v6/m_home.css`: hero (season brief, % of planned profit kept, Recover and Build-a-trip buttons, four KPI tiles, class `ptiles` kept for the tour), Today (next steps across files), Coming up (photo cards with readiness rings), Profit protection, From quote to close, Cash next 6 months, Team vs target, Trip studio. Every figure ties to `portfolio`/`leakModel` (TEST hc home command center). Maya's proactive tip is off on this page because the hero says the same thing. Since v8.2 the accountant (`hcAcct`: money desk, % of revenue collected, approve bills, AR, AP, FX, documents, month end) and the agents (`hcAgent`: % of annual target, next steps, pipeline, files in close, departures) use the same hero (`hcShell`) and card language; empty cards are hidden. The older description below still applies to `hpHero`/`hpStats`, which remain for the UI kit.
- Home is a deliberate step beyond the product (owner request, 12 Nov 2026): a dark-blue hero band (greeting, booked revenue, expected profit, open quotes, a stage bar and four stage cards; it keeps class `ptiles` for the tour) and a redesigned Project statistics card (KPI tiles with year-on-year chips, SVG bar chart). Both live in `hpHero`/`hpStats` in `v6/s4_views.js`, styles under `.hp*` in theme.css. They animate only when Home is entered.
- The logo is the real Triplanet wordmark (triplanet.io/logo/logo-full.png), embedded as a 480 px PNG. Its mint plane (`#5DFCE0`) is the accent on the dark-blue hero bands, routes and meeting mode.
- `v6/theme.css` loads last and holds the theme. `v6/s0_brand.js` (ICONS, `ic()`, TP_LOGO) and `v6/brand-fonts.css` are GENERATED by `cd tools/brand && npm install && node build_brand.mjs`.
- Licenses: Solar icons CC BY 4.0 (480 Design); Public Sans and Barlow SIL OFL 1.1.
- Do not use Unicode glyphs or emoji as icons. Use `ic('name')` and add new names in `build_brand.mjs`.
- Icons render as two-tone duotone: theme.css paints each Solar icon's secondary layer as a solid tint of the current color (`--duo`, `--duobg`). The product's own navbar SVGs (NAVIC/`nic()`, dashboard art TP_ART) are embedded too, but the nav uses Solar duotone because the owner asked for a higher-end icon look.

## Build and verify
- Map geometry, only when views or cities change: `cd tools/geo && npm install && node build_geo.mjs` regenerates `v6/s0_geo.js`. The runtime functions (`geoMap`, `geoViewFor`) live in `tools/geo/geo_runtime.js`.
- Build: `python3 build.py` writes `v6/triplanet-booth.html`. Use `TP_SKIP=file.js,...` to leave optional modules out while debugging.
- Checks: `node check6.js`. It covers:
  - finance identities;
  - every view for each role in EN and HE;
  - leftover Hebrew in EN mode (must be 0);
  - all 28 Maya routes;
  - the tour and the win/new/draft flows;
  - since v7: leak-bridge identities per scope and per dimension, the studio for all 16 destinations in both languages, gen-quote identities, and the real-brand guard.
- Browser sweep: `node sweep84.js [quick]` visits every agency page and trip tab per role and every portal tab, EN/HE, day/night, 1440 and 390 px, and reports page errors and horizontal overflow at 390 px (must be 0 and 0).
- Screenshots: `shot6.js`, `shot7.js` (v6 paths) and `shot8.js [prefix]` (v7: leaks, studio, Hebrew, mobile, meeting mode), run from the repo root. Output goes to `shots/` (git-ignored).
- Before any publish or handover, run the check and confirm LEFTOVER 0, bad 0, and no page errors.

## File map (build order)
- `v6/s0_brand.js` - GENERATED icons, `ic()`, logo
- `v6/s0_avatars.js` - GENERATED staff headshots (`AVATARS`, `AVATAR_KIND`, used by `avatarOf`). Since 13 Nov 2026 they are photoreal AI-generated images of people who do NOT exist, made on CPU with no API key: `tools/avatars/gen_headshots.py` (Realistic Vision 5.1 + LCM-LoRA, fixed seeds, CreativeML OpenRAIL-M / OpenRAIL++), chosen seeds and crop in `tools/avatars/embed_headshots.py`, 160 px WebP kept in `tools/avatars/out/`. `python3 tools/avatars/embed_headshots.py` rebuilds the JS from those files. The Photo credits screen says they are AI-generated. Never swap in photos of real people. The older illustrated set: `cd tools/avatars && npm install && node build_avatars.mjs`.
- `v6/s0_geo.js` - GENERATED map data (US, Europe, Levant, Italy, Isles, Greece, Ontario; 48 cities) plus `geoMap`/`geoViewFor`
- `v6/s1_core.js` - data model, generators, finance math, invoice-gap logic, trip specs (TRIP_SPECS), inbox files (NEN_INBOX)
- `v6/s1c_catalog.js` - real hotels (65), venues (82), airlines, BRANDS, 5 extra destinations (NewYork, Smokies, SanAntonio, Chicago, NewOrleans), DEST_CITIES routes. Every entry has a `src` URL; rates and costs are illustrative.
- `v6/s1d_data.js` - (v8) SUPPLIERS: 344 suppliers (81 real: CATALOG hotels and 16 real attractions; the rest fictional, generated from name patterns, list in `SUP_FICT` for owner review), rate cards by season x pax band x variant (`rateCard`, `rateFor`), `altsFor(t,line)` alternatives anchored to the line's current cost, `incumbentOf`. Real suppliers carry no rating, reply time or invented documents.
- `v6/s1e_people.js` - (v8) CLIENTS (24 incl. 10 prospects), STAFF (owner Ella Brooks, accountant Nora Kim, 6 agents with annual targets approved by the owner on 14 Nov 2026: Priya 380K, Dana 300K, Marcus 360K, Grace 340K, Luis 280K, Tom 260K USD), ROLES, 40 PERMS in 9 groups, `can(perm)`, traveler extras (passport no/expiry, DOB, emergency contact, room type, form status), `blockOf(t)`.
- `v6/s1b_labels.js` - labels, gap explanations, alerts
- `v6/s2_i18n.js` - Hebrew-to-English translator (DICT, trHtml), English answers
- `v6/s3_shell.js` - state, save/load/reset (localStorage key v8), navigation (sidebar grouped by job: `NAV_SECTIONS`), render shell, Maya drawer, guided tour (TOUR), invoice-reading animation
- `v6/s4_views.js` - home, quotes, trip tabs
- `v6/s5_fin.js` - trip invoice check, gap cards, dispute email, Invoice check page, finance dashboard
- `v6/s6_rest.js` - templates, hotels, suppliers, activities, users, import, Maya questions (QS), event wiring (no boot lines any more)
- `v6/s6b_dnd.js` - trip plan drag and drop (since 13 Nov 2026): one pointer-based system for mouse, touch and pen (native HTML5 drag and drop does not work on tablets). Sites and template cards drag onto any day, or between sites to set the order; a line shows the slot; a closed day opens after a 550 ms hover (not while edge-scrolling); gaps between days snap to the nearest day; Esc cancels; every drop saves, opens the target day, flashes what moved and says so in a toast. Touch: drag the grip or the template photo, or long-press 300 ms. `dndMoveItem`/`dndAddTpl` are covered by check6.
- `v6/s7_leak.js` - leak model (`leakModel`, `leakRows`), Profit leaks screen, leak bridge SVG, heatmap, count-up
- `v6/s7b_product.js` - product fidelity from dev.triplanet.io screenshots (Nov 2026):
  - nav "Projects" and "Clients";
  - UK flag for English, header search;
  - the project page with a Quotation / Operation / Finance stage switch and stage tabs;
  - the Operation dashboard cards, the Finance dashboard, Income (deal invoices and tax invoices with a totals footer) and Vouchers;
  - the phone hamburger drawer.
- `v6/s7c_lists.js`, `v6/lists.css` - product-style tables for Activities (catalog venues), Hotels (`vHotelsList`) and Clients (`vClients`). The last two are registered in s9_boot.js.
- `v6/s9a_books.js` - Phase 2:
  - accounting sync (pilot, simulated against a sample company file): QuickBooks Online and Xero lead in English, Priority and Hashavshevet lead in Hebrew, all four in both languages;
  - connect animation, object mapping, posting rules and sync log;
  - gap actions post bills, holds and credits to the log;
  - a sync chip on trip finance tabs;
  - the "Your numbers" card on Profit leaks;
  - Maya questions 26-28.
- `v6/s8_gen.js` - Trip studio (`genPlan`, `genRun`, `genCreate`), brand badges, `brandSwap`, catalog Hotels screen
- `v6/s9b_status.js` - Phase 3 honesty layer: one `FEAT` table marks every feature Live, Pilot or Roadmap. It drives the "What's live" screen, the badge on page headers (studio, leaks, invoice check, accounting sync, Maya) and the 10-minute beat. **The owner confirms the statuses before each show.** Live = seen on app.triplanet.io screens; Pilot = working in the demo, offered to pilot customers; Roadmap = not available.
- `v6/s9c_live.js` - Maya live mode (see Hard constraints): settings card, `liveSnapshot()`, `liveSystem()`, streaming `liveAsk()`, scripted fallback. `check6.js` checks the snapshot (no NaN, no real brand in a gap, leak total ties).
- `v6/s9d_maya.js` - Maya always at hand (her chat closes from the Close button, the backdrop or Esc; the panel sits above the header) (since 13 Nov 2026): her AI-generated face (`AVATARS.Maya`) with an "AI" badge, one proactive tip per page computed from the data on screen (scripted logic, never labeled live), a one-tap fix for an overloaded trip-plan day (nearest day that fits, arrival and departure days last), "/" or Ctrl/Cmd+K to open her, and page-aware suggested questions. Tips are off in meeting mode, the tour, the attract screen and while her panel is open. check6 covers the tips in both languages and every plan fix.
- v8 feature modules (spec `docs/spec-v8-parity.md`, builder rules `docs/v8-builder-brief.md`). Each module owns `v6/s10_<code>.js` + `v6/m_<code>.css`, plugs in through the hooks below, and registers its own tests:
  - `s10_forms.js` - schema-driven forms engine and modal (`FORM_SCHEMAS`, `formOpen`, `formValidate`); entity forms for supplier, client, user, activity, hotel.
  - `s10_fbuild.js` - form builder page (`VIEWS.forms`, from Settings) and the 4 traveler forms with responses and "send" links.
  - `s10_prop.js` - proposal formats (PDF, agents table with group-size tiers and single supplement, landing page) and the overhead / brokerage fee card on Pricing.
  - `s10_tbday.js` - trip plan view switch (By day / By components / Map), day details with Global and per-participant payment tables, save day as template, route map. Owns the only `pPlan` wrapper.
  - `s10_tbcomp.js` - By components view with supplier alternatives and swap/undo (`tbSwap`, `tbUndo`), and the Versions tab (save, compare, restore).
  - `s10_sup.js` - supplier list and card (rate card, terms, documents), in-trip Suppliers tab (Contact / Pending / Approved / Price comparison), client card with a finance tab.
  - `s10_ops.js` - Operation Tasks tab (48-task library by time window), Master list tab (forms, custom columns, CSV export, import preview), room blocks card on Hotels.
  - `s10_settings.js` - Settings: organization, roles and permissions matrix (13 enforced, the rest matrix only), stages preview, links to forms and integrations.
  - `s10_dacct.js` / `s10_dash.js` - role dashboards: accountant (AR, AP schedule, FX, documents, month end), manager additions (approvals, team leaderboard vs target, departure readiness), agent home.
- v8.1 clarity and handoff modules (spec `docs/spec-v8.1-clarity.md`):
  - `s11_trdata.js` - Hebrew for generic data strings in Hebrew mode (`heData`, called by `render()` through `heDataIf`); names and client-facing documents stay English.
  - `s11_next.js` - `nextSteps(t)`: the "Next step" bar under every project header and the agent home's next steps; hidden in meeting mode and the tour.
  - `s11_search.js` - global search (header magnifier, Ctrl/Cmd+Shift+F): projects, clients, suppliers, hotels, pages.
  - `s11_uikit.js` - UI kit page (`VIEWS.uikit`, linked from Settings) with live components, tokens and icons.
  - `s11_spec.js` / `s11_spec_trip.js` - developer notes: the `SPEC` registry (46 screens), the in-app panel (settings menu > Show developer notes, English, per laptop in localStorage `triplanet-devnotes`) and `tools/spec/export_spec.js`, which writes `docs/handoff/screens.md`. Update the registry when a screen changes, then re-export.
- `s12_home.js` - the owner's Home command center (see Look and feel).
- v8.4 viewpoints (spec `docs/spec-v8.4-viewpoints.md`, incl. §8 binding amendments). External people are NOT roles: they are portals.
  - `s13_portal.js` + `m_portal.css` - the portal frame: `S.pv={k,id,tab}` (not saved: a reload returns to the agency), `PORTALS` registry (`pvRegister`), `pvShell`/`pvRender` (agency badge, "You are viewing as" ribbon with person picker, grouped View as and Back to agency, top tabs or a bottom tab bar under 721 px), shared helpers `pvDays`/`pvDayCard` (plan with clock times), `pvHousehold`, `pvFictionalSuppliers`, `pvMoneyNote`, `pvPayLink`. `render()` hands over to `pvRender()` while `S.pv` is set. The "View as" select (`viewAsSelect`, `s3_shell.js`) is grouped: Agency team / Client side / Suppliers and field.
  - `s13_oc.js` - operations coordinator home (`hcOps`, role `ops`, Kelsey Dawson).
  - `s13_pl.js` - group leader portal (Rev. Alan Mercer, New Hope Baptist, trip `nas` by default).
  - `s13_pt.js` - traveler app (Linda Garcia, `nas`); simulated payments move `collected` only.
  - `s13_ps.js` - supplier portal, fictional suppliers only (Morgan Pratt, Ozark Lakeside Lodge); supplier-side wording: difference, query, credit.
  - `s13_pg.js` - tour director run sheet (`GUIDES` in `s1e_people.js`: Wade Turner, Cody Harper).
  - `s13_voice.js` - "Listen to the brief" on the owner's Home (owner decision 14 Nov 2026, option C): `voBrief()` builds a spoken brief from the hero's figures and the page capability `tts` (Claude's built-in voice) reads it. The button appears only on the published claude.ai page in a Chromium browser or the desktop app; offline, Safari and mobile apps show nothing. Publish the demo with capabilities `{downloads:true, tts:{}}`.
  - `s13_link.js` - deep links: the hash opens a screen (`#v=leaks`, `#role=ops&v=home`, `#trip=gc.tfin`, `#trip=hl.plan&tb=comp`, `#pv=guide.pax`, `#lang=he`), applied after `load()` in `s9_boot.js` and on hashchange; unknown values are ignored. The ideas backlog's "Open in the demo" buttons use them on the public website (`DL_SAMPLES` lists them and `TEST dl deep links` opens each).
  - Avatars for the new people: `AV_NAMES` in `s3_shell.js` maps full names to `AVATARS` keys (Kelsey, Alan, Linda, Morgan, Wade).
- Developer handoff package: `docs/handoff/` (README, screens, data model, business rules, design system). Start there.
- Public website (14 Nov 2026): https://triplanet-viewpoints-demo.vercel.app, Vercel project `triplanet-viewpoints-demo` (team Red Queen), built from GitHub `main`: the build copies `v6/triplanet-booth.html` to `public/index.html` with the title "Triplanet Viewpoints Demo", and `docs/pitch/ideas-backlog.html` to `public/ideas/index.html` (the public ideas backlog: reading and demo links; shared ratings only on the claude.ai page, personal picks kept in the browser). The project is NOT connected to GitHub: after a merge to `main`, redeploy it (Vercel create_deployment with gitSource main, or connect the repo in the project's Git settings). The claude.ai copy keeps the narration (tts); the website has no narration button.
- `HANDOVER.md` (start-here page for the team) and its published version `docs/pitch/handover-page.html` ("Triplanet Handover Guide"). Framing for anything addressed to the Triplanet team: Samuel runs the company; Gabi is his consultant, and the backlog is Gabi's proposal (first person singular, "the team").
- `docs/pitch/ideas-backlog.html` - source of the "Triplanet Ideas Backlog" page for the product team (Hebrew default, English toggle): 24 features and specifications from the demo (TP-101..TP-503, 5 areas) offered as a direction for the development plan, each with a user story, why it matters and where to see it in the demo. Team members rate priority (Jira's 5 levels) and size (S-XL); the list sorts by the team average and flags quick wins. Published as an artifact with capabilities db (`ratings/{user}`), user (profile names) and comments. Wording: first person singular (the owner) and "the team".
- `v6/s9_meet.js` - meeting mode:
  - three cuts of one story, picked with the bar chips or keys 1 / 3 / 0: 1 min (4 beats: leaks, invoices, dispute, close), 3 min (9 beats), 10 min (14 beats, adds quote to operations, your numbers, the supplier's side of the query (supplier portal, v8.4), trip P&L, what's live);
  - beats are found by `id` (`meetIs('inbox')`), never by index;
  - arrow keys, R restart, Esc exit, closing screen with booth lead capture (CSV export from the settings menu);
  - kiosk idle reset: after 4 idle minutes a 15-second warning, then a clean Home. Booth leads are kept.
- `v6/s9_boot.js` - wraps render/resetDemo, then `load(); render();`. Must stay last.
- `v6/base.css`, `v6/extra.css`, `v6/v7.css`, `v6/brand-fonts.css`, `v6/theme.css` - styles in load order. `fonts.css` - embedded Hebrew font (IBM Plex Sans Hebrew), the fallback for Hebrew glyphs.

## v8 hooks and roles
- Roles: `ROLE_KEYS` = manager (owner), accountant, the 6 agents, then `ops` (operations coordinator, last on purpose: tests take `ROLE_KEYS[2]` as an agent). Owner, accountant and ops see every file (`seesAll()`). Ops has no `fin.view`: Finance, Invoice check, Profit leaks, Accounting sync and finance-stage trip tabs render `noAccess()`. The agency admin is merged into the owner (owner decision, 14 Nov 2026): the `admin` role stays in the permission matrix with no person. `can(perm)` gates pages through `NAV_PERM` (Users, Accounting sync, Finance and Invoice check) and a few actions.
- Hooks in `s1_core.js`: `PERSIST` (extra saved datasets with reset), `TESTS` (module self-tests run by check6), `TRIP_TABS`, `TRIP_INIT` (idempotent per-trip initializers, run at boot after brandSwap, after load/reset and on new trips), `TB_VIEWS`. Trip tabs are added with `tabInsert(stage, tab)` and ordered by `TAB_ORDER` (`s7b_product.js`).
- `calc(t)` supports optional overhead `t.ovh` (added to price) and brokerage `t.brk` (added to price and cost, profit unchanged). Absent = 0.
- Storage key is v8 (`triplanet-booth-demo-v8`); older saves are ignored.
- Version name: `DEMO_VERSION` in `s3_shell.js` (now v8.4), shown at the bottom of the gear menu and in the page title (`build.py`). Bump both for every published build. Each version is published as its own Artifact page so versions stay apart.
- Gear menu: Settings page, day/night, guided tour, language, display size, developer notes, photo credits, Maya live answers, booth video, booth leads export, reset, version. On phones the header no longer scrolls sideways, because that clipped the menu.
- check6 now takes about 20 s and prints one `TEST <name> ok` line per module.

## Decisions already made
- Assistant name: Maya / מאיה. Hebrew is secondary, EN is the default.
- Money in USD by default. Locked FX rate per trip. Commission counts as income in planned profit: planProfit = rev - plan + comm. The identity planProfit - amtDiff - fx - fcProfit = 0 must hold.
- Gap model: kinds are rooms, qty, rate, comp, extra, dup, under, missing.
- Leak model: the bridge runs from planned to expected profit. It is the supplier differences by kind plus FX, so it ties to the identity. Room-block release exposure, late client payments, missing invoices and supplier commission not yet collected are shown as "at risk", outside the bridge. Commission collection uses a fixed demo rule per line (`commPaid`), so the figure is stable. The bridge chart starts at $0 (no truncated axis).
- Studio plans use the same `genLines` + `calc` as quotes, so "Create the quote" yields an ordinary quote. Studio plans are multi-base: hotels define bases, each attraction belongs to its nearest base (within 170 km), and nights split by attractions. Drive time from Tulsa is straight-line km x 1.12 at 100 km/h plus 1 h; coach transfers and day trips use km x 1.35 at 80 km/h.
- The demo's "today" is still fixed at 20 Oct 2026 (owner decision pending; moving it re-baselines every dated figure).
- Print: window.print is wrapped in try/catch.
- Honesty labels revised 13 Nov 2026 (owner decision): a read-only walkthrough of dev.triplanet.io (report dated Sep 2026, not verified with the product team) found no active Finance stage, invoices, payments, trip P&L, integrations or multi-currency. So Income/invoices/vouchers moved Live -> Pilot, Trip P&L and Currencies/locked rate were added as Pilot, and the Projects and Catalog rows no longer claim finance or commissions. Flip a row back only when the product team confirms it is live.

## Open items (owner)
- Confirm with the product team, before IITA (31 Jan 2027), what is live today in finance (Finance stage, invoices, payments, trip P&L) and adjust `FEAT` in `v6/s9b_status.js`.
- Payment and email domains are placeholders (`.example`).
- Gap frequencies (about 20% of invoices with a gap) are estimates, not benchmarks.
- Live accounting connections (Intuit, Xero, Priority, Hashavshevet) are product work; the demo is simulated and badged Pilot. Verify Hashavshevet and Priority object names with an accountant before showing to Israeli buyers.
- Catalog caveats from research: some Israel hotel operating statuses need confirming; star ratings for a few properties are approximate.
