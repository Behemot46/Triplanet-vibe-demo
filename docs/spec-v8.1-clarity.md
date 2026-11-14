# v8.1 spec: clarity, usefulness, developer handoff

Status: approved by lead · 13 Nov 2026 · builds on `docs/spec-v8-parity.md` (its §A rules and `docs/v8-builder-brief.md` still apply)

## Goal
The owner's brief: solve the known limitations, make every screen as useful, clear and simple as possible, and turn the demo into a package developers can build from (inspiration plus specification).

Design principles for this round (every module follows them):
1. **Every screen answers "what do I do next?"** One primary action per screen, top right. A next step is computed from the data, never invented.
2. **Fewer places, clearer names.** Navigation is grouped by job (Sales, Catalog, Money, Help, Admin), not by "new vs old". No tab that only repeats another tab.
3. **No dead ends.** Every empty state says why it is empty and offers the next action. Every number on a dashboard drills to the screen that explains it.
4. **Same language everywhere.** Hebrew mode shows Hebrew for generic data too (room types, services, well-known sites); company and hotel names stay as they are.
5. **The demo is the spec.** Each screen carries developer notes (purpose, roles, data, actions, rules, states, tests, API) that render in-app and export to Markdown, from one registry.

## Lead work (Opus, shared files)
- L1. Price comparison anchoring (`s1d_data.js` `altCost`): when the current supplier is a real brand whose catalog base differs from the line cost by more than 15% (lines that `brandSwap` relabeled), anchor alternatives on the market reference (median rate of the fictional suppliers of that destination and sub-category) instead of the real brand's rate. The current supplier still returns `line.cost` exactly.
- L2. Sidebar sections by job: Home · Sales (Projects, Trip studio, Clients) · Catalog (Suppliers, Hotels, Activities, Templates) · Money (Finance, Invoice check, Profit leaks, Accounting sync) · Help (Maya, What's live) · Admin (Users, Settings). "New" pills stay on new items.
- L3. Operation stage: drop the "Digest & messages" tab. Its room-block card moves to the Operation dashboard, its supplier message template moves to the Suppliers tab, and links to `ops` land on the dashboard. Dashboard cards drill to Tasks and Suppliers.
- L4. Render hook for Hebrew data (`heData`) and the developer-notes toggle in the settings menu.

## Modules (Sonnet, one worktree each)
| Code | File | Scope |
|---|---|---|
| `td` | `s11_trdata.js` | Hebrew for generic data strings: plan items, line names (patterns such as "Twin rooms, 9 nights"), service variants, task names already have HE (skip), well-known sites. `heData(html)` translates whole text nodes only. Tests: English-word count in HE mode on key screens drops to proper names only (allow-list). |
| `nx` | `s11_next.js` | `nextSteps(t)` rules per stage/status (draft → finish pricing; approval → waiting for owner; sent > 7 days → follow up; operations → overdue tasks, missing passports, unconfirmed suppliers, deposits late; finance → open gaps, documents to issue; closed → none). A "Next step" bar on every trip page under the stage switch (one primary button, up to 2 more). Agent home: "My next steps" card under the hero (top 6 across files), and a "Files in close" card when the agent has no upcoming departure. Tests. |
| `gs` | `s11_search.js` | Global search: the header search icon opens a search popover (input, results grouped: Projects, Clients, Suppliers, Hotels, Pages; keyboard up/down/enter/esc). Pure `gsSearch(q)`. Tests. |
| `sp`→`dv` | `s11_spec.js` | Developer notes engine + panel + registry for global pages and role homes. `SPEC[key]` contract below. Toggle via `S`-independent localStorage key `triplanet-devnotes`. English, `dir="ltr"`. |
| `dt` | `s11_spec_trip.js` | Registry entries for every trip tab (`trip:<ptab>`) and drawers/modals (`modal:form`, `drawer:supplier`, `drawer:client`). Data only. |
| `ui` | `s11_uikit.js` | "UI kit" page (`VIEWS.uikit`, linked from Settings and from developer notes): live examples of every component with class names and usage notes. |
| docs | `docs/handoff/*` | Data model, business rules, design system (written from the code; no code changes). |

### `SPEC` contract
```
SPEC[key] = {
  title, purpose,                       // one line each
  roles: {view:[...], act:[...]},        // role keys or 'all'
  perms: ['fin.view', ...],              // permissions that gate it
  data: ['Trip.name', 'Line.qty', ...],  // Entity.field, matches docs/handoff/data-model.md
  actions: [{label, does, rule}],        // what each control does and its guard
  rules: ['planProfit = rev − plan + comm', ...],
  states: {empty, loading, error},       // what to show
  status: 'live'|'pilot'|'roadmap',      // matches FEAT
  api: ['GET /api/trips/:id', ...],      // suggested, from docs/backend-plan where it exists
  tests: ['TEST tbcomp swaps and versions'],
  code: ['v6/s10_tbcomp.js: tbcComp'] }
```
Keys: view keys (`home:manager`, `home:accountant`, `home:agent`, `quotes`, `studio`, …), `trip:<ptab>`, `modal:form`, `drawer:supplier`, `drawer:client`, `page:forms`, `page:uikit`. `specKey()` resolves the current screen. `tools/spec/export_spec.js` writes `docs/handoff/screens.md` from the registry. A TEST fails if any NAV page, trip tab or registered modal lacks an entry.

## Definition of done
- `python3 build.py && node check6.js` → LEFTOVER 0, bad 0, all TEST ok, `P rev 950103.7 pp 142334.7 fp 138322.99`.
- Browser sweep: 0 page errors.
- `docs/handoff/` holds README, screens (generated), data model, business rules, design system.
- Visual QA pass (Haiku) and fixes.
