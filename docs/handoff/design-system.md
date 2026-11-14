# Design system

The visual and interaction rules of the demo, written so a React + MUI team can rebuild the screens. Everything here is read from `v6/*.css` and the helper functions in `v6/*.js` (commit `a9fdf77`). The demo is plain HTML strings and CSS; there is no component library. This file names each pattern, its CSS class and its helper so you can map it to an MUI component.

A live "UI kit" page (`VIEWS.uikit`, from Settings and from the developer notes) is built by another module (`s11_uikit.js`, spec `docs/spec-v8.1-clarity.md`). If it is not in your build, `python3 build.py` simply skips it (the build lists it in `JS_ORDER`).

Sources of the look (from `CLAUDE.md`): the MUI "Minimal" kit as seen on app.triplanet.io (Nov 2026); primary color preset1 `#078DEE`; integrated white navigation with a dashed divider; Public Sans for UI and Barlow for figures; Solar icons. Licenses: Solar icons CC BY 4.0 (480 Design); Public Sans and Barlow SIL OFL 1.1.

CSS load order (`build.py`): `base.css` (older base) → embedded Hebrew font → `extra.css` → `v7.css` → `brand-fonts.css` → **`theme.css`** → `lists.css` → every `m_*.css` (alphabetical, `m_zfix.css` last). `theme.css` holds the theme and overrides the earlier files through tokens; later files use tokens only.

---

## 1. Tokens

All colors come from CSS custom properties on `:root` in `v6/theme.css`. **Never write a literal color that reads in only one mode.** Dark mode is set by `<html data-theme="dark">` (the demo toggle, stored in `localStorage` key `triplanet-theme`, `s3_shell.js: themeGet, themeApply, themeToggle`) and mirrored under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])`. Because the demo always writes `data-theme`, the media query is a fallback only.

### 1.1 Color tokens (light and dark values)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--primary` | `#078DEE` | same | Brand blue. Focus ring, active switch, links, primary tints |
| `--primary-light` | `#68CDF9` | same | Avatar ring, dark-mode accents |
| `--primary-lighter` | `#CCF4FE` | same | Avatar fill, selection background |
| `--primary-dark` | `#0351AB` | same | Hero gradient, text on `--primary-lighter` |
| `--primary-darker` | `#012972` | same | Hero start color, dark cards |
| `--mint` | `#5DFCE0` | same | Accent **only on dark-blue bands** (hero, meeting mode, routes, closing screen) |
| `--bg` | `#FFFFFF` | `#141A21` | Page background |
| `--panel` | `#FFFFFF` | `#1C252E` | Cards, inputs, popovers |
| `--recess` | `#F4F6F8` | `#28323D` | Table header, segmented control track, inset areas |
| `--ink` | `#1C252E` | `#FFFFFF` | Primary text; primary button fill |
| `--ink2` | `#454F5B` | `#DFE3E8` | Secondary text, hover fill of primary button |
| `--muted` | `#637381` | `#919EAB` | Captions, table headers, inactive tabs |
| `--dis` | `#919EAB` | `#637381` | Disabled text and toggle off only (2.73:1 on `--bg`; do not use for text people must read; nav section headings use `--muted` since a9fdf77) |
| `--line` | `rgba(145,158,171,.2)` | same | Dashed row dividers |
| `--line2` | `rgba(145,158,171,.32)` | same | Input and button borders, solid dividers, nav divider |
| `--side` | `#FFFFFF` | `#141A21` | Sidebar background |
| `--side2` | `rgba(145,158,171,.08)` | same | Hover fill (nav items, icon buttons, ghost buttons) |
| `--side-ink` | `#637381` | `#919EAB` | Sidebar text |
| `--orange` / `--yellow` / `--amber` | `#8F5500` | `#FFD666` | Warning and "in progress" status color (three names, one value). Light value darkened in `m_zfix.css` (was `#B76E00`, 4.0:1) |
| `--blue` | `#0351AB` | `#68CDF9` | Info status color |
| `--purple` | `#5119B7` | `#C684FF` | Finance, "manager approval" status |
| `--green` | `#0B7442` | `#77ED8B` | Success, positive amounts. Light value darkened in `m_zfix.css` (was `#118D57`, 4.22:1) |
| `--red` | `#B71D18` | `#FFAC82` | Error, negative amounts, late |
| `--teal` | `#078DEE` | `#68CDF9` | Chart series and "AI" pill (same as primary) |
| `--tile` / `--tile-ink` | `#012972` / `#FFFFFF` | same | Dark tile |
| `--btn` / `--btn-ink` | `#1C252E` / `#FFFFFF` | `#FFFFFF` / `#1C252E` | Primary button: inverted ink, as in the MUI kit |
| `--accent` | `#078DEE` | `#68CDF9` | Generic accent |
| `--navon` | `#078DEE` | `#68CDF9` | Active nav item text and icon |
| `--navonbg` | `rgba(7,141,238,.08)` | `rgba(7,141,238,.16)` | Active nav item background |
| `--good` | `#5BE49B` | same | Positive chips on dark bands |
| `--bad` | `#FFAC82` | same | Negative chips on dark bands |
| `--glow` | `rgba(7,141,238,.16)` | same | Soft glow |
| `--hero1` / `--hero2` | `#012972` / `#0351AB` | same | Hero band gradient stops (the band is dark blue in both modes) |
| `--hero-ink` / `--hero-mute` | `#FFFFFF` / `#B7D4F2` | same | Text on hero bands |

### 1.2 Shadow, font tokens

| Token | Value (light) | Dark |
|---|---|---|
| `--sh-card` | `0 0 2px 0 rgba(145,158,171,.2), 0 12px 24px -4px rgba(145,158,171,.12)` | `0 0 2px 0 rgba(0,0,0,.2), 0 12px 24px -4px rgba(0,0,0,.12)` |
| `--sh-drop` (menus, drawers, Maya) | `0 0 2px 0 rgba(145,158,171,.24), -20px 20px 40px -4px rgba(145,158,171,.24)` | `0 0 2px 0 rgba(0,0,0,.24), -20px 20px 40px -4px rgba(0,0,0,.24)` |
| `--sh-pri` (primary CTA glow) | `0 8px 16px 0 rgba(7,141,238,.24)` | same |
| `--f-ui` | `'Public Sans','Plex','IBM Plex Sans Hebrew',system-ui,-apple-system,'Segoe UI',Arial,sans-serif` | same |
| `--f-num` | `'Barlow','Public Sans','Plex',system-ui,sans-serif` | same |

`'Plex'` is the embedded IBM Plex Sans Hebrew (`fonts.css`), the fallback for Hebrew glyphs. Public Sans is embedded as one variable font (weights 100 to 900); Barlow weights 600, 700, 800 (`v6/brand-fonts.css`, generated by `tools/brand/build_brand.mjs`). The demo is offline, so fonts are embedded; a real app loads them normally.

### 1.3 Component-local custom properties

Set on a component, not on `:root`:

| Property | Where | Meaning |
|---|---|---|
| `--c` | `.pill`, `.tile .ring`, `.pring`, `.hp-st` | The status color the component tints from: `background: color-mix(in srgb, var(--c) 16%, transparent)` |
| `--duo`, `--duobg` | `.ic` and containers | Icon duotone: `--duo` = how much of the current color the secondary layer keeps (default 32%), `--duobg` = the background it blends into |
| `--oc`, `--occ` | `.ocard` | Corner glow and icon color of an Operation dashboard card |
| `--k`, `--k2` | `.hp-kp` | Gradient stops of a KPI badge |
| `--p` | `.pring` | Progress ring, 0 to 100 |
| `--bc` | `.brandb`, `.acb` | Brand color of a neutral brand badge |
| `--tc` | `.al-thumb` | Thumb tint |
| `--scrollsh` | `.scroll` | Edge shadow color (`m_zfix.css`) |

### 1.4 How to use tokens

- Tint a status color, never hard-code it: `background: color-mix(in srgb, var(--green) 16%, transparent)` (see `.pill`).
- Icons: `.ic` paints Solar duotone as two tones of `currentColor` (`theme.css` "icon system"). Set `color`, not `fill`.
- The three warning names (`--orange`, `--yellow`, `--amber`) are the same color. Pick by meaning: orange = "in progress", yellow = "sent", amber = "waiting".

---

## 2. Typography

Base: `body { font: 400 14.5px/1.57 var(--f-ui); -webkit-font-smoothing: antialiased }` (`theme.css`).

| Role | Spec | Where |
|---|---|---|
| h1 (page title) | 24px / 700, letter-spacing −0.005em | `.ph h1`, `.pj-name` |
| h2 | 18px / 700 | card titles in pages |
| h3 (card title) | 16.5px / 600 | `.card h3` |
| Body | 14.5px / 400, line-height 1.57 | |
| Small, muted | 12.5px (`.small`), color `--muted` | captions, helper text |
| Nav item | 14px / 500; active 600 | `.nv` |
| Nav section heading | 11px / 700, uppercase, letter-spacing .06em, color `--muted` | `.nvh` |
| Table header | 13.5px / 600, color `--muted` | `.tbl th` |
| Table cell | 14px | `.tbl td` |
| Button | 13.5px / 700 (small 13px) | `.btn` |
| Pill | 12px / 700 | `.pill` |
| Tab | 14px / 600 | `.tabs button` |
| KPI label | 14px / 600 | `.stat .l` |
| **Figures** (KPI value, dashboard card value) | **Barlow** 30px / 700, `font-variant-numeric: tabular-nums` | `.stat .v`, `.ocard .oc-v`, `.inc-sum b` |
| Hero eyebrow | 11.5px / 600, uppercase, letter-spacing .12em, mint | `.hp-eye` |

Use Barlow for every money, count and percentage that is a headline figure; use Public Sans inside prose and tables.

## 3. Spacing, radius, size

No spacing tokens exist. These values are used consistently:

| Thing | Value |
|---|---|
| Page gutter | 40px (desktop), 16px at ≤ 900px (`.content`) |
| Page bottom padding | 72px; 96px with the Maya button (`m_zfix.css`) |
| Gap between cards and stat tiles | 24px (`.two`, `.stats`, `.card` margin) |
| Card padding | 24px (list cards `.al-card`: 0, children pad themselves) |
| Table cell padding | 14px 16px |
| Button padding | 6px 14px (small 3px 10px); height about 36px (small about 28px) |
| Inputs | 8px radius, 8px 12px padding; list filters 48px high |
| Nav item | 44px high, 8px radius |
| Topbar | 72px high, sticky, blurred background (`color-mix(var(--bg) 84%, transparent)` + blur 8px) |
| Sidebar | 280px wide, sticky, full height, dashed `border-inline-end` |

| Radius | Use |
|---|---|
| 6px | pills, tab badges, nav "New" pill |
| 8px | buttons, inputs, nav items, segmented control |
| 10 to 14px | thumbs, small tiles, toast (10), icon tiles (12 to 14) |
| 16px | cards, stat tiles, tile strips |
| 24px | hero bands |
| 99px | stage-bar segments, progress bars, chips |
| 50% | avatars, icon buttons |

Shadows: cards `--sh-card`; menus, drawers, popovers `--sh-drop`; primary CTA on dark bands `--sh-pri`; hero `0 24px 48px -16px rgba(1,41,114,.45)`.

---

## 4. Layout

### 4.1 Shell (`s3_shell.js: render`)

```
.app  (flex; column at ≤900px)
├─ aside.side   280px: .brand (logo + agency chip), nav sections
└─ main.content
   ├─ .topbar   sticky, 72px
   └─ #view     the current screen
```
Floating: Maya button `.chenfab` (bottom end), Maya panel `aside.chen`, toast `#toast`, tour panel, meeting bar.

### 4.2 Sidebar: sections by job (`s3_shell.js: NAV_SECTIONS, navSections`)

| Section | Items (key) |
|---|---|
| (none) | Home (`home`) |
| Sales | Projects (`quotes`), Trip studio (`studio`), Clients (`clients`) |
| Catalog | Suppliers (`suppliers`), Hotels (`hotels`), Activities (`activities`), Templates (`templates`) |
| Money | Finance (`finance`), Invoice check (`gaps`), Profit leaks (`leaks`), Accounting sync (`books`) |
| Help | Maya (`ai`), What's live (`status`) |
| Admin | Users (`users`), Settings (`settings`) |

Items not listed go to the last section. Items gated by a permission (`NAV_PERM`: Users, Accounting sync, Finance, Invoice check) are hidden when `can()` is false. "New" pills (`pillF('New','info nvp')`) sit on Invoice check, Trip studio and Profit leaks. The brand block shows the Triplanet wordmark and a chip with the agency name.

### 4.3 Header (topbar)

Left to right: hamburger (≤ 900px), "Guided tour" button, spacer, **View as** select (owner, accountant, six agents; hidden at ≤ 640px), search icon, theme toggle (sun or moon), language flag (UK flag for English, Israeli flag for Hebrew), bell with an unread badge (count of non-info alerts), settings gear (menu, `role="menu"`), avatar of the current user. Icon buttons are 40px circles (`.iconb`).

### 4.4 Page header: one primary action

`head(title, right)` (`s3_shell.js`) → `<div class="ph"><h1>title</h1><div class="row">right</div></div>`. **One primary action per screen, at the end of the header row** (`.btn.pri`: ink-filled). Secondary actions are plain `.btn`. Pilot or Live badges go beside the title (`s9b_status.js`). Where a screen computes a "next step" it goes under the header (spec principle 1).

### 4.5 Project page: stage switch and tabs (`s7b_product.js: vTrip, STAGES`)

```
.pj-head   [back] #no  name   .pj-stage (Quotation | Operation | Finance, role=tablist)   .pj-status button + .pj-menu
.pj-sub    dates · days, nights · destination · client · travelers
.tabs.pj-tabs   tabs of the chosen stage (role=tablist; each tab role=tab + aria-selected; icon + label + optional count badge)
(tab content)
```
Tabs per stage (`TAB_ORDER`): Quotation: General, Trip plan, Pricing, Proposal, Versions, Approval. Operation: Dashboard, Tasks, Suppliers, Master list, Billing. Finance: Dashboard, Income, Expenses (invoice check, with a badge of open gaps or waiting files), Vouchers. Tabs of a stage not yet reached render `gate(t, what)`: a card explaining that the section opens after the quote is accepted. Status chip (`pjStatus`, `s7b_product.js`): Quotation and Operation use the default amber tint (label is the quote status, or "Ready"), Lost red, Finance purple ("In close"), Closed green. Since a9fdf77 the chip is a real `<button class="pj-status" aria-haspopup="menu" aria-expanded aria-label="Project status: <label>">` inside `.pj-stwrap` (relative). It opens the **status menu** `.pj-menu[role=menu]` (absolute under the chip, `inset-inline-end: 0`, min 260px, max `min(340px, 86vw)`, `--panel` fill, 12px radius, 1px `--line2` border, shadow, z-index 30), listing the moves of `stmMoves(t)` as `.pj-mi[role=menuitem]` rows (bold title and a small muted sentence; a blocked move has `.off`, `disabled`, a muted title and shows its reasons instead of the description; with no moves, `.pj-mn` "No moves available."). Closed by default; closes on Esc and on a click outside `.pj-stwrap`. Moves: Mark as lost (open quote), Move to financial close (Operations), Close the file (Finance); rules in `business-rules.md` §28.

Two more project-page pieces from the same commit: the **stage-move card** `.stm-card` (a `.card`, flex row, title and one small sentence, one `.btn.pri`; shown at the top of the Operation dashboard only after the trip has returned), and the **read-only locked rate** `.rate-ro` (inline flex: the rate in bold, then a muted small note "Locked when the quote was accepted on <date>"), which replaces the number input outside the Quote stage.

### 4.6 Surfaces

| Surface | Markup | Notes |
|---|---|---|
| Card | `.card` | 16px radius, `--sh-card`, no border |
| Two columns | `.two` | grid, `repeat(auto-fit, minmax(340px, 1fr))`, 24px gap; stacks on phones |
| Section spacing | `.sec` | bottom margin 22px |
| Popover menu | `.mwrap > .menu[role=menu]` | `--sh-drop`, 12px radius; closes on outside click or Esc; trigger has `aria-expanded` |
| Right-hand drawer ("modal") | `.fm-root > .fm-scrim + form.fm-modal[role=dialog][aria-modal=true]` | full height, width `min(600px, 100%)`, header / body / footer; Esc closes first (capture phase); focus returns to the opener (`s10_forms.js`) |
| Maya panel | `aside.chen[aria-label]` | non-modal side panel; `/` or Ctrl/Cmd+K opens it |
| Toast | `#toast` | one line, ink background, bottom center, 2.2 s; call `toast(msg)` |
| Mobile nav drawer | `.app.drawer .side` | slides in from the start edge, scrim behind |

---

## 5. Components

Class names are from `v6/theme.css` unless a file is named. "Helper" is the JS function that renders it.

### 5.1 Buttons

`.btn` (default: panel fill, 1px `--line2` border), `.btn.pri` (ink fill, inverts in dark mode), `.btn.grn` (positive action, green fill), `.btn.sm`. Icon inside: `${ic('name')} Label` (icons 18px). Icon-only: `.iconb` (40px circle) with `aria-label`.
- **Do:** one `.pri` per screen; verb-first labels ("Read & match invoices", "Draft dispute"); a disabled button carries a `title` that says why (`spChooseWhy`).
- **Don't:** put two primary buttons side by side; use an icon alone without `aria-label`; use `.grn` for anything but "confirm and move forward".

### 5.2 Pills / status labels

Helper: `pillF(text, cls)` (`s1b_labels.js`) → `<span class="pill cls">`. Classes: `orange yellow amber blue info purple green ok red bad warn teal ai` (and none = muted). Soft tinted label, 24px high, 12px/700. Domain helpers: `kindPill(k)` for gap kinds, `gstPill(st)` for gap status, `stPill(st)` for Live / Pilot / Roadmap, `NEWP()` for "New".
- **Do:** one meaning per color (green = done or recovered, red = problem or late, amber = waiting or at risk, blue = info or sent, purple = finance or approval).
- **Don't:** use a pill as a button (use `.btn.sm`; the Operations supplier status is a `.btn.sm` containing a pill); put real brand names next to red or amber pills.

### 5.3 Cards and KPI tiles

- `.card`: general container.
- `.stats > .stat` (`.l` label, `.v` Barlow value, `.s` sub-line): KPI tiles on trip pages. Values are `usd(n)`; negative or leaked amounts add `.neg`, positive `.pos`.
- `.tiles > .tile` (`.ring` icon circle tinted by `--c`, `.l`, `.s`): a joined strip with dashed dividers.
- `.ogrid > button.ocard` (`ocard(cls, icon, value, label, act)` in `s7b_product.js`): Operation dashboard cards, tinted by class `dark | red | green | amber`; clickable cards carry `data-act` and drill to the screen that explains the number (principle 3).
- **Do:** every number on a dashboard links to the screen that explains it; show the unit ("$1,386", "12 days", "3 gaps").
- **Don't:** show a bare number without a label or unit; invent a figure that is not computed from data.

### 5.4 Hero bands

Dark-blue band with greeting, headline figures, a stage bar and four stage cards. **The band is dark in both modes** (`--hero1/2`, white text) so text never needs a theme variant.
- Manager home: `hpHero(ts, P, up)` in `s4_views.js` → `section.ptiles.hp` (class `ptiles` is kept for the guided tour). Parts: `.hp-top`, `.hp-eye` (date), `h1` greeting, `.hp-kpi` (booked revenue, expected profit with margin, value in open quotes), `.hp-bar` (stage bar), `.hp-grid > .hp-st` (four clickable stage cards: Quotation, Operation, Finance, Closed, each with count and share bar).
- Project statistics: `hpStats(won, lost, H)` → `.card.pstat.hp-ps`: two KPI tiles `.hp-kp` with year-on-year chips `.hp-chip` (`good|bad|flat`), a legend, and an SVG bar chart `.hp-ch` (`role="img"` with `aria-label`, `direction: ltr`). Prior years are **fictional demo data**.
- Accountant and agent homes reuse the band: `.hp.da-hero` (`s10_dacct.js`), `.hp.db-hero` (`s10_dash.js`). `m_zfix.css` forces readable label colors on the band.
- Animation only when Home is entered (`hpAnim()`); `prefers-reduced-motion` turns it off.

### 5.5 Tables

- `.tbl` inside `.scroll` (horizontal scroll wrapper). Header row on `--recess`, dashed row dividers, numeric columns `th.n`/`td.n` aligned to the end, optional `tfoot` with a solid top border.
- `.al-tbl` (`lists.css`): product-style list tables (Activities, Hotels, Clients, Suppliers). Name cell `.al-nm` = `.al-thumb` (40px tinted tile with icon, or `.al-brand` brand initial, or `.al-av` avatar) + `.al-t` (strong name, small muted subline). Filter bar `.al-filters` (`.al-sel`, `.al-chips`, `.al-search` 48px, `.al-tgl` switch), pagination row.
- **Do:** wrap every wide table in `<div class="scroll">` (the shadow cue shows only where more content is hidden, `m_zfix.css`); right-align money (`.n`); format with `usd()`/`money()`; give empty tables a row with `colspan` and a message.
- **Don't:** let a table push the page wider than 390px; truncate a money value; put tables in tables beyond one level.

### 5.6 Tabs, segmented control, chips

- `.tabs > button(.on)`: underline tabs, 28px gap, `em` badge for "New", `.cnt` for counts, `.bdg` for alert counts. `data-act="pt"` for trip tabs.
- `.pj-stage`: segmented control (recess track, active segment panel + shadow), `role=tablist`, buttons `role=tab aria-selected`.
- `.chip(.on)`: filter chips (ink fill when on), used by task filters (`m_ops.css`) and form builder modes.
- Itinerary view bar `.tbd-bar` (`role=tablist`): By day, By components, Map.

### 5.7 Forms

Engine: `s10_forms.js`. `formRender(schema|id, record, opts)` returns the fields as HTML (used by the drawer and by builder previews); `formOpen(id, record|null)` opens the drawer; `formValidate(schema, record)` is pure. Field types: `text email tel number money select multi date toggle textarea file section repeater`. Layout: `.fm-grid` (1 or 2 columns, `cols`), `.fm-sec` section heading, `.fm-f` field wrapper with `.fm-l` label (+ `.fm-req` marker), control `.fm-in`, help `.fm-h`, error `.fm-e` (`aria-describedby` links control and error). Toggle `.fm-tgl` (switch `.fm-sw`), multi `.fm-multi > .fm-chk`.
Validation messages (`FM_MSG`): required, email, phone, number, integer, min, max, length, date, option, pattern. Errors show after blur or submit, on the field, in the user's language.
- **Do:** label every field, mark required with `req`, show the error next to the field in plain words ("Enter a valid email address"); keep the footer's primary button `Save` and a `Cancel`.
- **Don't:** validate on first keystroke; clear what the user typed on error; use placeholder text as the label.

### 5.8 Banner, alerts, empty states, gates

- `.banner.good | .bad`: a one-line result under a header (e.g. "6 invoices read in seconds. 6 open gaps worth $4,046").
- `.alert` rows (icon, text, action) in the alerts card on Home.
- **Empty states**: no shared component. Patterns in use: `.card` with `<p class="muted">` that says **why it is empty and offers the action** ("No gaps in the invoices received so far."), `.fb-empty` (dashed box with title + hint, `m_fbuild.css`), `.st-empty` (studio), `.db-empty`. `gate(t, what)` is the "not yet" state for later stages. `noAccess(what)` (permission), `noTrip()` (agent has no trips). A unified `.empty` component is on the v8.1 list; do it in React once.
- **Do:** say what the user can do next ("Add a field from the palette below."); keep the tone neutral.
- **Don't:** leave a blank card; show an error tone for "nothing yet".

### 5.9 Avatars, brand badges, stars, icons

- `avatarOf(name, cls)`: 40px round image from `AVATARS` (AI-generated people who do not exist; the Photo credits screen says so), else the initial in a tinted circle (`.avatar`).
- `brandBadge(family)` (`s8_gen.js`) → `.brandb` = colored square with the initial + the name. **No official logos** (permission needed); real brands appear only as this neutral badge. `alBrand`, `alStars` in `s7c_lists.js`; `stars(n)` for star ratings.
- `ic('name', cls)`: Solar duotone SVG, `aria-hidden`. An unknown name renders **nothing** (no error). Available names: home quotes templates hotels suppliers activities users studio leaks gaps finance ai bell settings play present check close x star pin clock danger hourglass pen printer lock mail inbox up down right left restart refresh trendup trenddown magic plane sparkle folder draft ops wallet done bed users2 calendar show museum landmark tour cruise dining park travel hotel meal free search widget checklist document filter chev idcard chart2 clients ticket receipt export link sync cloud card plug invoice tag copy userplus mapsq cash sun moon xcircle trophy grip pinx arrup arrdown flag bus money percent shield. Add new ones in `tools/brand/build_brand.mjs`. **Do not use Unicode glyphs or emoji as icons.** Directional icons: add class `flip` (`ic('chev','flip')`) so they mirror in RTL.

### 5.10 Other recurring pieces

| Piece | Class / helper | Notes |
|---|---|---|
| Progress bar | `.prog > div` | width in %; 8px, radius 5 |
| Progress ring | `.pring` (`--p`, `--c`) | conic gradient |
| Horizontal bars | `hbar(label, a, b, max, tail)` → `.hbar` | planned vs expected cost by type |
| Leak bridge | `wfSvg(M)` (`s7_leak.js`) | inline SVG, starts at $0, no truncated axis, drawn LTR |
| Gap card | `gapCard(t, x)` → `.gapc.st-<status>` | header (supplier, invoice no, kind pill, status pill), explanation, three numbers (quoted, invoiced, gap), actions, optional email |
| Document preview | `.doc` | **always white** (it previews paper), LTR |
| Sample letter | `pre.mail` | monospace email text |
| Pager | `.inc-pg`, `spPager` | rows per page select + prev/next `.iconb` |
| Dashboard rows | `.da-*`, `.db-*` (`m_dacct.css`, `m_dash.css`) | accountant and manager/agent cards |

---

## 6. RTL rules

The app root gets `dir="rtl"` and `lang="he"` in Hebrew, `dir="ltr"` and `lang="en"` in English (`s3_shell.js: render`). The Hebrew toggle must be **fully** RTL.
- **Logical CSS only**: `margin-inline-start/end`, `padding-inline-*`, `inset-inline-start/end`, `border-inline-*`, `text-align: start|end`. Never `left`/`right`/`margin-left`. (Exceptions that are deliberate: the toast is centered with `left:50%`; SVG charts and the paper `.doc` are LTR.)
- **Directional icons** (chevron, arrows) use `ic(name, 'flip')`; `[dir=rtl] .ic.flip { transform: scaleX(-1) }`.
- **Numbers, money, percentages, dates, ranges** are isolated so they keep their order inside Hebrew text: `money()`, `usd()` and `pct()` wrap output in U+2066 … U+2069 (LRI/PDI); ranges use `<bdi dir="ltr">`; emails, phones and passport numbers use `<bdi dir="ltr">` (`spPh`, `spMail`). Wrap any Latin name inside Hebrew text in `<bdi>` (hotel and client names).
- **Names stay as they are.** Company, hotel and venue names are never translated. Generic data (room types, services, well-known sites) is translated by `heData` in `s11_trdata.js` (a module in progress; whole text nodes only, so "Twin rooms, 9 nights" becomes Hebrew but "Hilton Nashville Downtown" does not).
- **Strings**: every visible string is `L(he, en)`; Hebrew is the source for many strings and `trHtml` + `DICT` (`s2_i18n.js`) translate leftovers in English mode. `check6.js` must report `LEFTOVER 0` (no Hebrew in English mode).
- **Right-aligned figures**: in English KPI values are start-aligned; in RTL they are right-aligned explicitly (`[dir=rtl] .stat .v`).
- **Dates**: English `MM/DD/YYYY` (`sd()`), Hebrew `DD/MM/YYYY`; long dates by `toLocaleDateString(LOC())`.

## 7. Dark mode rules

- Every color is a token; both values live in `theme.css`. Check any new screen in both modes (the sun/moon button, or `data-theme`).
- Status colors invert **lightness**: dark mode uses the light MUI shades (`#77ED8B`, `#FFAC82`, `#FFD666`, `#68CDF9`, `#C684FF`) so text on `--panel` keeps contrast (see §10).
- The primary button inverts (`--btn` white, `--btn-ink` dark). Active nav uses a stronger tint (`--navonbg` .16).
- **Always the same in both modes** (by design): hero bands and dark cards (`--hero1/2`, `.ocard.dark`), meeting mode, the landing-page phone frame (`.pr-dev`, `m_zfix.css`), and the `.doc` paper preview.
- **Known literal colors** (exceptions to "tokens only"; they read in both modes): status chip tints `#FFAB00`, `#8E33FF`, `#22C55E`, `#FF5630` in `.pj-status`, `.ocard`, `.inc-sum b.due`; `.btn.grn` `#0B7A47` (hover `#08633A`, white text, both modes); star rating `#FFAB00`; chart gradients. Replace with tokens when rebuilding.
- Form builder and form modal have two dark-only rules that lighten text to `--primary-light` (`m_fbuild.css`, `m_forms.css`).
- Do not rely on `prefers-color-scheme` alone; the demo's stored choice wins.

## 8. Mobile rules (390 px)

Breakpoints: 1100 (cards go two-up), 900 (sidebar becomes a drawer), 760, 640 (phone), 600, 560. Shot script `shot8.js` checks mobile.
- At ≤ 900px: sidebar fixed off-canvas (translate ±105%, mirrored in RTL), hamburger shown, scrim behind, `.content` padding **16px** gutter, topbar scrolls horizontally, `.card > table.tbl` becomes horizontally scrollable.
- At ≤ 640px: "Guided tour" shows its icon only, the **View as** select is hidden, hero grid is 2 columns, KPI strip wraps, Operation cards stack (1 column), Maya's button shrinks to its avatar.
- Every wide table sits in `.scroll`. No horizontal page scroll. Content bottom padding 96px so the Maya button never covers the last row.
- Tap targets: icon buttons 40px; nav items 44px.
- Drag and drop in the trip plan works with touch (grip or 300 ms long-press; `s6b_dnd.js`).

## 9. Motion

`rise` and count-up animations on Home and leaks; stage bar and chart bars animate once on entering Home. Every animation has a `@media (prefers-reduced-motion: reduce)` override (`theme.css`, `v7.css`, `base.css`). Do not animate on every render.

## 10. Accessibility notes

What is in place:
- **Focus**: `:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px }` globally; inputs show a 1px ink ring on focus; switches and checkbox chips show the outline on the hidden input's sibling.
- **Roles and ARIA**: stage switch `role=tablist` / `role=tab` + `aria-selected`; the tab row under it (`.pj-tabs`) and the Income filter tabs (`.inc-t`) likewise (since a9fdf77); the project status chip is a button with `aria-haspopup="menu"` and `aria-expanded`, its menu `role=menu` / `menuitem`; itinerary view bar and form-builder tabs likewise; settings menu `role=menu` / `menuitem` with `aria-expanded` on the trigger; drawer `role=dialog aria-modal=true aria-labelledby`; fields `aria-required`, `aria-invalid`, `aria-describedby` (error); icons `aria-hidden`; icon buttons have `aria-label`; charts `role=img` with a text `aria-label`; the waiver text is a focusable scroll region (`tabindex=0`, `role=region`).
- **Keyboard**: Esc closes the form drawer first, then the menu, then Maya; `/` or Ctrl/Cmd+K opens Maya; meeting mode: arrows, R, Esc, keys 1/3/0.
- **Contrast fixes made**: light-mode status colors are the dark MUI shades (`#B71D18`, `#0351AB`, `#5119B7`), with green and amber/orange/yellow darkened further to `#0B7442` and `#8F5500` so small text passes 4.5:1 (`m_zfix.css`, a9fdf77); `.nvh` and `.dv-s h4` headings use `--muted`; `.btn.grn` is `#0B7A47` with white text; the Presentation button (`.tourbtn.meetbtn`) is `--primary-dark`; hero-band labels are forced to `hero-ink` (88% mix) in `m_zfix.css` (QA fix, commit `68569c7`); the landing-page phone frame is dark in both modes; `.scroll` edge shadows are darker in dark mode.

Measured contrast (WCAG, computed from the token values; a rebuild should fix the ones marked low):

| Pair | Ratio | Note |
|---|---|---|
| `--ink` on `--bg` | 15.5:1 | |
| `--muted` on `--bg` | 4.88:1 | passes AA for text |
| `--muted` on `--recess` (table header) | 4.51:1 | borderline pass |
| `--dis` on `--bg` | **2.73:1** | **low by design**: now only for disabled text and toggles; the 11px nav section headings moved to `--muted` (4.88:1) |
| White on `--primary` `#078DEE` | **3.47:1** | **low** for 13.5px text; any new small text button should use `--primary-dark` (white on it: 7.58:1, as `.tourbtn.meetbtn` now does) or larger text |
| White on `.btn.grn` `#0B7A47` | 5.40:1 | passes (hover `#08633A`: 7.35:1); was 2.28:1 on `#22C55E` |
| `--red` on `--bg` | 6.56:1 | |
| `--green` `#0B7442` on `--bg` | 5.85:1 | passes (was 4.22:1) |
| `--orange`/`--amber` `#8F5500` on `--bg` | 6.06:1 | passes (was 4.00:1) |
| Pill text on its 16% tint over `--bg`, light: green / amber / red | 4.64 / 4.81 / 4.98:1 | passes at 12px (was 3.46 / 3.30 for green and amber). On `--recess` (table header, `#F4F6F8`) green and amber drop to 4.30 / 4.45:1, just under AA; avoid pills there or darken the tint |
| Dark: muted on panel / blue / green / red / amber / purple on panel | 5.68 / 8.64 / 10.54 / 8.48 / 11.13 / 6.02:1 | all pass |
| `--hero-mute` and `--mint` on `--hero1` | 8.78 / 10.55:1 | |

Known gaps to close in the rebuild: a unified empty-state component; the status menu has no arrow-key navigation or focus return (it opens and closes with the mouse, Enter or Esc); the search icon in the header only navigates to Projects (a global search popover is specified in `spec-v8.1-clarity.md`, module `gs`); the drawer does not trap focus (it restores focus on close).

## 11. Content rules

1. **Plain words.** Write for a travel agent, not an accountant. Say "Billed 138 rooms for 6 nights. The final rooming list had 132." not "Qty variance". Gap kinds are named in plain English: "Rooms over rooming list", "Above contracted rate", "Comp not applied", "Charge not in quote", "Duplicate invoice", "Billed below quote", "Invoice missing" (`s1b_labels.js: KIND`).
2. **Numbers with units.** Always `$`, `%`, `days`, `travelers`, `nights`, `hours`. Use `usd()` (no decimals in headlines, 2 dp in tables), `pct()` (1 dp), `fmtDate()`. Plural helper `PLN(n, 'invoice', 'invoices')`.
3. **Next step.** Every screen answers "what do I do next?" with one primary action, computed from data, never invented. A dashboard number links to the screen that explains it. A "Next step" bar on trip pages is specified (`nx` module).
4. **Empty states with an action.** Say why it is empty and what to do ("No gaps in the invoices received so far." / "Add a field from the palette below.").
5. **No dead ends.** A gated tab says when it opens ("opens after the quote is accepted") and what accepting creates.
6. **Honesty labels.** Every feature carries Live, Pilot or Roadmap (`s9b_status.js: FEAT`); the badge sits in the page header. Maya's header pill shows the real mode (Scripted or Live answers); never label a scripted answer as live. AI faces carry an "AI" badge.
7. **Real-brand wording.** A real company (hotel, chain, venue, airline) never appears next to negative wording (gap, overbilling, dispute, late, slow, poor, risk). Gap stories live on fictional suppliers. Real brands appear as the neutral `brandb` badge, never as a logo; no performance numbers for real suppliers. (Demo rule; production shows the customer's own supplier data.)
8. **Fictional data is labelled.** Sample documents say "Sample layout" or "fictional company for demonstration"; waiver text says "SAMPLE WORDING ONLY"; emails use `.example` domains.
9. **Tone.** Sentence case. Verbs for buttons. No exclamation marks, no marketing words, no emoji.
10. **Both languages.** A string exists in Hebrew and English before it ships (`L(he, en)`); a Hebrew sentence is written in plain Hebrew, not a transliteration.

## 12. Do and don't, per component (short list)

| Component | Do | Don't |
|---|---|---|
| Button | one `.pri` per screen; verb + object; disabled with a reason in `title` | two primaries; icon-only without `aria-label` |
| Pill | one color = one meaning; text says the state | use for actions; use red/amber near a real brand |
| Card | one idea per card; title at 16.5px/600 | nest cards more than one level |
| KPI tile | label + value + unit; link to the explanation | unlabeled numbers; made-up values |
| Hero band | dark in both modes; white text; only on Home-type screens | place a light-only token inside it |
| Table | in `.scroll`; money right-aligned; `colspan` empty row | exceed 390px width; truncate money |
| Tabs | underline tabs for sections, segmented control for modes | mix both in one row |
| Form | label above, error below, plain-words messages | placeholder as label; validate on first keystroke |
| Drawer | Esc closes; return focus to opener | open a drawer from a drawer |
| Empty state | why + next action | blank card |
| Icon | `ic('name')`, `flip` for direction | glyphs or emoji |
| Chart | text `aria-label`; start axes at $0 | truncated axis; color-only meaning |
| Real brand | neutral badge + name | logo; negative wording |
| Money in RTL | `usd()`/`money()` (isolated) | raw numbers in Hebrew text |
