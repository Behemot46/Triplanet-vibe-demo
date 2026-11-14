# Triplanet booth demo v8.4: handover package

Start here. This page tells the team what is in the package, how to open it, and what to read first.

Prepared by Gabi, consultant to Samuel, 14 Nov 2026. Also published as a page: https://claude.ai/artifact/4HzoztxGfo2R4U6Qnqe7F6 (private until shared).

## 1. What this is
A clickable demo of Triplanet for US group tour operators (3 to 20 agents), built for trade-show booths (NTA 2026; next IITA, 31 Jan 2027, and ABA, 6 Feb 2027). It doubles as a specification: every screen has developer notes, the data model and business rules are written down, and the money rules run as automated checks.

It is **not production code**: one offline HTML file, no backend, no logins, simulated payments and accounting sync, fictional agency data.

## 2. Open it
- **Demo website:** https://triplanet-viewpoints-demo.vercel.app. Public, no account needed. It is deployed from `main` by hand (Vercel project `triplanet-viewpoints-demo`, not connected to GitHub), so after a merge it must be redeployed.
- **Demo on claude.ai:** https://claude.ai/artifact/77KubhecPayYdD4gcVSQCi. Private until the owner shares it; the only copy with the spoken morning brief.
- **Demo (offline):** open `v6/triplanet-booth.html` in Chrome or Edge. No install, no internet needed.
- **Ideas backlog, public link (read, then open each item in the demo):** https://triplanet-viewpoints-demo.vercel.app/ideas
- **Ideas backlog, team page (shared ratings, Hebrew and English):** https://claude.ai/artifact/LPuRt9btXgJdFjpJaa5Mka. Its source is `docs/pitch/ideas-backlog.html`.
- Use **View as** (top bar; in the ☰ menu on phones) to switch person:
  - **Agency team:** owner, accountant, operations coordinator, 6 agents;
  - **Client side:** group leader, traveler;
  - **Suppliers and field:** supplier, tour director.
- The gear menu has the guided tour, meeting mode (1, 3 or 10 minutes), Hebrew/English, day/night, and **developer notes**, which show the specification of the screen you are on.

## 3. Read in this order
1. `docs/handoff/README.md`: module map, what is simulated and what is real, open decisions, suggested build order.
2. `docs/handoff/screens.md`: all 69 screens with purpose, roles, data, actions and rules, states and a proposed API.
3. `docs/handoff/data-model.md`: every entity and field, marked real or demo-only (§28 covers the v8.4 portals).
4. `docs/handoff/business-rules.md`: finance identities, the invoice-gap model, permissions, known inconsistencies.
5. `docs/handoff/design-system.md`: tokens, type, icons, light and dark, taken from the live Triplanet interface.
6. `docs/spec-v8.4-viewpoints.md` and the earlier `docs/spec-v8*.md`: the decisions behind each version.
7. `CLAUDE.md`: the working rules of the project (constraints, file map, decisions already made).

## 4. Build and check
- `python3 build.py` builds `v6/triplanet-booth.html` from the modules in `v6/`.
- `node check6.js` (about 25 s) must show:
  - `LEFTOVER 0` and `bad 0`;
  - every `TEST … ok`;
  - the unchanged line `P rev 950103.7 pp 142334.7 fp 138322.99`.
- `node sweep84.js` (Playwright) opens every page and portal tab, in English and Hebrew, day and night, at desktop and phone width. It must report 0 page errors and 0 overflow.

## 5. What is in v8.4
- **Agency:**
  - owner command center;
  - accountant money desk;
  - operations coordinator readiness board;
  - agent homes;
  - quotes, trip studio, itinerary with drag and drop, pricing, proposals in three formats, versions, supplier alternatives;
  - operations tasks and master list, traveler forms;
  - finance stage, invoice check and dispute, profit leaks, simulated accounting sync;
  - Maya assistant (scripted answers; typed questions can optionally go live to Claude).
- **Portals (previews):** group leader, traveler app, supplier (fictional suppliers only), tour director run sheet.
- **Spoken morning brief** on the owner's home. It appears only on the published page in Chrome or the Claude app.

## 6. Not included, on purpose
- **The Maya live API key.** It lives only in the booth laptop's browser and must never go into the repo or the file.
- **Booth leads.** They are stored only on the booth laptop and contain visitors' personal data.

## 7. Licenses and attribution to keep
- Solar icons: CC BY 4.0 (480 Design).
- Fonts: IBM Plex Sans Hebrew, Public Sans and Barlow, all SIL OFL 1.1.
- Photos: open licenses; credits on the demo's Photo credits screen.
- Staff and portal photos are AI-generated faces of people who do not exist.
- Real hotel and venue names appear only as neutral badges, with no logos, and never next to negative wording.

## 8. Open decisions (owner)
- Which features are live in the product today. The "In the product" column in the backlog and the "What's live" screen are a reading from Sep 2026, not verified with the team.
- Review of the fictional supplier names (`SUP_FICT`).
- Counsel's wording for the sample waiver.
- The demo's fixed "today", which stays 20 Oct 2026.
- Placeholder domains: payments and email use `.example`.
