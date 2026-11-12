# Triplanet booth demo - handover

## What this is
A single-file, offline-capable Hebrew/English (RTL/LTR) demo of Triplanet, an AI-assisted SaaS for group tour operators. It is shown at a trade-show booth: NTA Travel Exchange '26, Tulsa, Oklahoma, 15-18 Nov 2026. The target buyers are US agencies with 3-20 agents. The hero feature is the supplier-invoice gap check (overbilling detection, dispute email drafting, credit tracking, margin recovery).

All data is fictional: the agency is "Redbud Group Tours" (Tulsa), 20 trips, 6 agents, 11 destinations. Keep it that way unless the owner says otherwise.

## Hard constraints
- Output is ONE self-contained HTML file. No frameworks, no CDN calls. Fonts are embedded (IBM Plex Sans Hebrew, base64 in fonts.css).
- Must work offline on a booth laptop.
- Default language is English. The Hebrew toggle must be fully RTL.
- The assistant "Maya" answers from 25 scripted questions. It is NOT a live LLM. Do not present it as one in the UI.

## Build and verify
- Build: `python3 build.py` writes `v6/triplanet-booth.html` (same file the Artifact is published from).
- Logic and text checks: `node check6.js`. It checks finance identities, renders every view for each role in EN and HE, counts leftover Hebrew in EN mode (must be 0), routes all 25 Maya questions, and runs the tour and the win/new/draft flows.
- Screenshots: `shot6.js` and `shot7.js` (Playwright, Chromium at /opt/pw-browsers/chromium), run from the repo root.
- Before any publish or handover, run the check and confirm LEFTOVER 0, bad 0, and no page errors.

## File map
- `v6/s1_core.js` - data model, generators, finance math, invoice-gap logic, trip specs (TRIP_SPECS), inbox files (NEN_INBOX)
- `v6/s1b_labels.js` - labels, gap explanations, alerts
- `v6/s2_i18n.js` - Hebrew-to-English translator (DICT, trHtml), English answers
- `v6/s3_shell.js` - state, save/load/reset (localStorage, try/catch), navigation, render shell, Maya drawer, guided tour (TOUR), invoice-reading animation
- `v6/s4_views.js` - home, quotes, trip tabs (general, plan, costs, quote, approve, ops, people)
- `v6/s5_fin.js` - trip invoice check, gap cards, dispute email, Invoice check page, finance dashboard
- `v6/s6_rest.js` - templates, hotels, suppliers, activities, users, import, the 25 Maya questions (QS), event wiring
- `v6/base.css`, `v6/extra.css` - styles. `fonts.css` - embedded font. `fonts/` - font source package.
- `build.py` - concatenates the parts above in this order: base CSS, fonts, extra CSS, then the JS in the order listed in build.py.

## Decisions already made
- Assistant name: Maya / מאיה.
- Hebrew is secondary. EN is the default.
- Money in USD by default. Locked FX rate per trip. Commission counts as income in planned profit: planProfit = rev - plan + comm. Identity planProfit - amtDiff - fx - fcProfit = 0 must hold.
- Gap model: kinds are rooms, qty, rate, comp, extra, dup, under, missing. Missing invoices exclude lines already covered by unread inbox files.
- Print: window.print is wrapped in try/catch. Printing works only from a real browser, not from some preview frames.

## Open items
- Real Triplanet logo and brand colors. The placeholder is a plain "R" mark.
- Payment and email domains are placeholders.
- Gap frequencies (about 20% of invoices with a gap) are estimates, not benchmarks. Replace them with real customer data if available.
- Triplanet pilot-client threshold and go-to-market are owned outside this repo (see the owner's memory notes).
