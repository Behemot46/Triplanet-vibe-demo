# Handover prompt: v8.4, every viewpoint (not just Ella)

Paste everything below the line into a new Claude Code session that has the `behemot46/triplanet-vibe-demo` repository attached.

---

## Who you are working for
The owner (Gabi) builds a booth demo of Triplanet, an AI-assisted SaaS for US group tour operators (3–20 agents). The demo also serves as the clickable spec the product developers build from. The owner reads Hebrew and English and is legally trained. Reply in the language they write in. Be concise, answer first, challenge weak assumptions, no flattery. Label claims as verified, estimate or unverified, and state units and currency for any number.

## Start here (read before anything else)
1. `CLAUDE.md`: constraints, look and feel, file map, hooks, decisions.
2. `docs/v8.2-style-brief.md`: the command-center design language every screen uses (`hcPage`, `hcShell`, `.hc-card`, color emphasis `hlNeg`/`hlPos`/`hlWarn`/`hlKey`).
3. `docs/v8-builder-brief.md`: how modules plug in (`VIEWS`, `NAV`, `tabInsert`, `TRIP_TABS`, `TRIP_INIT`, `PERSIST`, `TESTS`), and the verification and commit rules.
4. `docs/handoff/README.md`: the developer package (screens, data model, business rules, design system).
5. `v6/s12_home.js`: the three role homes (`hcHome` owner, `hcAcct` accountant, `hcAgent` agent) on one shared hero (`hcShell`). This is the pattern to extend.
6. `v6/s1e_people.js`: `STAFF`, `ROLES`, `PERMS` (40 permissions), `can()`, client contacts and traveler extras. `v6/s3_shell.js`: `ROLE_KEYS`, `seesAll()`, `NAV_PERM`, the "View as" select, the gear menu, `DEMO_VERSION`.

State at handover (14 Nov 2026):
- `main` is v8.3, merged in PR #2.
- Published v8.3: https://claude.ai/artifact/RDupJaNFEv6obthLqTjL4c
- `python3 build.py && node check6.js` gives `LEFTOVER 0`, `bad 0`, every `TEST … ok`, and `P rev 950103.7 pp 142334.7 fp 138322.99`.
- The Playwright sweep (every page × trip tab × owner/accountant/agent × EN/HE × day/night) gives 0 page errors.
- Meeting mode, 10-minute cut: all 13 beats find their target.

## The goal of v8.4
Today the demo is told from inside the agency: the owner (Ella Brooks), the accountant (Nora Kim) and six agents. Add **every other viewpoint a group tour business has**, each with its own home and screens in the same command-center language. The aim is that a buyer at the booth (or a developer) can switch to any person in the chain and see what that person sees and does.

Candidate viewpoints. Confirm scope with the owner first (see "First step"):
1. **Operations coordinator** (inside the agency; today only the pseudo-assignee "Ops desk").
   - Home: departure readiness board across trips, tasks due today and this week, unconfirmed suppliers, rooming lists and room-block release dates, documents to send.
   - Sees all files and edits only operations.
2. **Group leader / client contact**. An external portal, for example the pastor at Grace Fellowship Church.
   - Their trips only.
   - Proposal to accept, itinerary, payment status per household (`groupsCalc`), traveler form completion, documents, messages with the agent.
3. **Traveler** (household member). A mobile-first portal.
   - My trip, pay the deposit or balance (simulated, `.example` link), fill my forms (the four traveler forms from `s10_fbuild.js`), documents, day-by-day plan, emergency contacts.
4. **Supplier**. An external portal; **fictional suppliers only** (real-brand rule).
   - Booking requests to confirm (`t.sups` flow: Contact / Pending / Approved), rooming list and manifest for their service, invoices submitted and their status, disputes and credits as seen from their side, payment dates.
5. **Tour guide / driver**. A mobile run sheet for the day.
   - Schedule, stops and times, manifest with dietary and medical flags, contacts, vouchers, notes.
6. **Agency admin**. The role exists in `ROLES` with no person yet.
   - Users and permissions, organization settings, integrations. May be merged into the owner; ask.

## Design rules for this stage
- **Same language**: `hcShell` hero for every home, `hcPage` on every page, `.hc-grid`/`.hc-card`, color emphasis rules, theme tokens, logical CSS, real Hebrew via `L(he,en)`, works at 390 px.
- **Inside vs outside**:
  - Agency roles keep the agency sidebar.
  - External portals (group leader, traveler, supplier, guide) get their own minimal shell: the agency's name and badge, a short top bar, no agency navigation, and a clear "You are viewing as …" ribbon with a way back to the agency view.
  - Portals are mobile-first.
- **One switcher**: extend "View as" into grouped options (Agency team / Client side / Suppliers and field). Keep it fast at the booth. Show the person's AI-generated avatar where one exists; otherwise use the initial fallback. Never use photos of real people.
- **Data**:
  - Reuse what exists (CLIENTS contacts, `t.trav`, `groupsCalc`, `incomeDocs`, `t.sups`, `SUPPLIERS`, `t.tasks`, `blockOf`, `t.items`).
  - New data must be deterministic (`rng(seed)`) and fictional. Real hotels and venues may appear only with neutral wording.
- **Honesty**: every portal is Pilot or Roadmap in `FEAT` (`v6/s9b_status.js`) until the product team confirms otherwise. The owner confirms statuses before each show.
- **Developer notes**: add a `SPEC` entry for every new screen (`v6/s11_spec.js` style) and re-run `node tools/spec/export_spec.js`.

## Engineering constraints
- One self-contained offline HTML; `<meta charset="utf-8">` first; no CDN; no secrets in the repo.
- Finance math unchanged. The identity `planProfit − amtDiff − fx − fcProfit = 0` holds, and the `P rev …` line is unchanged.
- `check6.js` sweeps `ROLE_KEYS × (NAV + NAV2) × PTABS` in EN and HE. For external roles, decide deliberately:
  - (a) keep them out of `ROLE_KEYS` and give them their own portal views with their own module TESTS; or
  - (b) add them and make every agency view render `noAccess()` cleanly.
  - Write the choice into the spec, and keep the sweep under about 30 s.
- The guided tour and meeting mode must keep working (their selectors are listed in `docs/v8.2-style-brief.md`). External portals stay out of meeting mode unless the owner asks.
- Bump `DEMO_VERSION` in `v6/s3_shell.js` and the `<title>` in `build.py` to **v8.4**. Publish as a **new** Artifact page (copy the build to the scratchpad as `triplanet-demo-v8-4.html`, title "Triplanet Demo v8.4", capabilities `{downloads: true}`) so versions stay apart.
- Develop on the branch the session gives you. Commit and push there. Open or merge a PR only when the owner asks.

## How to work (this worked well in v8 to v8.3)
1. **First step**: ask the owner one round of tappable questions, only for decisions that change the plan:
   - which viewpoints are in scope (multi-select);
   - names for the new people;
   - whether external portals should appear in meeting mode;
   - whether "agency admin" is a separate person.
2. **Spec**: write `docs/spec-v8.4-viewpoints.md` (screens per viewpoint, data per screen, permissions, the `check6` approach, file ownership per module). Have an independent Sonnet agent sanity-review it against the code (accuracy, tightness, achievability) before building, and fold its findings in as binding amendments.
3. **Build**:
   - The lead (you) owns the shared files (`s3_shell.js`, `s1e_people.js`, `s9_boot.js`, `check6.js`, `build.py`).
   - Sonnet agents build one viewpoint each in a worktree, with their own `v6/s13_<code>.js` + `v6/m_<code>.css`.
   - Tell agents to `git fetch origin <branch> && git reset --hard FETCH_HEAD` first (worktrees start from an old commit).
   - Merge by checking out their files; build and run checks after each merge.
4. **QA**:
   - Playwright sweep with zero page errors, extended to the portals.
   - Screenshots of every new screen at 1440 and 390 px, EN, HE and night.
   - Two Haiku agents review the screenshots for clarity and defects. Look at the key ones yourself.
   - Fix, then run the meeting-mode 10-minute cut.
5. **Wrap up**:
   - Update `CLAUDE.md` (file map, roles, version) and `docs/handoff/` (README, data model for any new entities, screens via export).
   - Commit, push, publish v8.4.
   - Report to the owner in Hebrew, concisely: what each viewpoint shows, what was verified and how, and what still needs their decision.

## Known open items (do not re-decide)
- Agent annual targets are approved (Priya 380K, Dana 300K, Marcus 360K, Grace 340K, Luis 280K, Tom 260K USD).
- Still open for the owner:
  - FEAT statuses before each show;
  - review of the fictional supplier names (`SUP_FICT`);
  - sample waiver wording, which needs counsel;
  - the demo's "today", which stays 20 Oct 2026.
