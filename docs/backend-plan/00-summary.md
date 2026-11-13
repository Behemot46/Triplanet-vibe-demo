# 00 · Summary for the owner

## The answer

**Build the production backend as a new, multi-tenant service (variant B). Do not build it into the existing product. Make the call final only after a 1-week code audit of app.triplanet.io.**

- Its repository is not reachable from this session, so the audit is the first real step.
- With **three engineers** driving Claude Code, the first paying pilot can go live in **late April 2027**. The pen test follows in May-June, and **GA is 1 July 2027**.
- With two engineers, the pilot moves to **mid-June**.
- **Nothing in production will be ready for IITA or ABA in February.** The shows run on the v7 demo plus measured trial results and a pilot offer.

| | Variant B (recommended) | Variant A (only if the audit passes all 6 gates) |
|---|---|---|
| Engineering days to the first pilot / to GA | 271 / 291 | 226 / 246 |
| Team | 3 engineers + fractional security lead + counsel + CPA + owner | same, with the existing team |
| **Build cost to GA** | **$205k-311k ≈ ₪650k-986k** | **$178k-271k ≈ ₪564k-858k** |
| Running cost per month, excl. Stripe (1 / 10 / 50 tenants) | $516 / $707 / $1,972 ≈ ₪1.6k / ₪2.2k / ₪6.3k | similar |

All figures are estimates. USD/ILS is 3.17 (Bank of Israel, 11 Nov 2026) [verified]. Details are in `09-ops.md` §6-7 and `10-roadmap.md`.

**Why B:**

- The value is in finance. That needs integer money, many-to-many invoice allocation, an audit trail on every money field, and tenant isolation enforced by the database.
- Retrofitting those into a year-old schema typically costs as much as building them fresh. It is also the most likely place for a pen test to find a gap [estimate].
- The finance engine, extraction pipeline, connectors and Maya tools are built as **portable packages**, so most of the work survives either variant.

## Where I challenge the brief

1. **ASVS 4.0 is out of date.** 5.0.0 was released on 30 May 2025 [verified - github.com/OWASP/ASVS]. The plan and the handover prompt now use 5.0 Level 2.
2. **"Departure → QuickBooks Class" breaks on QBO Plus.** Since Sep 2025 the API enforces Plus's limit of 40 classes and locations combined [verified-snippet - Intuit]. The plan tags each trip as a **customer job (sub-customer)** instead, and offers a class per trip only to Advanced customers.
3. **Hashavshevet is not file-import only.** WizCloud has a documented REST API, desktop editions have the H-Connect relay API, and MOVEIN files remain the fallback [verified - docs.wizcloud.co.il, H-ERP PDF].
4. **"Real supplier names next to gaps moves the risk into the ToS" is only half right.**
   - A gap shown to the customer from its own data is the customer's assertion. A neutral label ("difference vs quote", not "overbilling") plus a ToS clause covers it.
   - A **cross-customer benchmark that singles out a real hotel is Triplanet's own statement**. That is a trade-libel risk the ToS does not shift. The plan therefore allows no named suppliers in benchmarks without counsel's sign-off.
5. **Xero's developer terms ban using API data to "train or contribute to" any AI model** [verified - developer.xero.com terms]. Whether Maya's grounding counts needs counsel before the Xero build.
6. **Israel: Triplanet is a "holder" with direct liability under Amendment 13.**
   - The regulator's July 2026 position counts a SaaS holder's clients **together** when deciding whether a DPO is needed [verified - Barnea, 22 Jul 2026].
   - Severe incidents must be reported **immediately**, not "within 72 h". The first fine for late reporting was NIS 256,000 [verified - inplp.com].
7. **The pen test should come before sensitive data, not just before GA.** The pilot starts without passport data, and passports switch on only after the retest.
8. **The 1-week audit can judge the code, not the people.** The 3-4 week trial sprint is the person-by-person test. Point it at the riskiest feature, invoice extraction on real invoices, so it de-risks the product while it tests the team.

## Top 5 risks

| # | Risk | Effect | Mitigation |
|---|---|---|---|
| 1 | **Capacity.** P1+P2 need 215 engineering days; two engineers give 144 in the 16 weeks to late April | the pilot slips to about 20 June | a third engineer, or variant A if the audit passes, or starting infrastructure in December |
| 2 | **Extraction accuracy on real invoices is unproven.** The demo's inbox is scripted | the invoice check, the core value, degrades into manual entry | trial sprint on 50-100 real invoices, with targets and a hard prompt-injection gate (`05-ai.md` §2) before the build commits |
| 3 | **Unknown existing codebase and team dependency** | wrong variant choice; rework | 6 written gates, plus portable packages either way |
| 4 | **External gates** | QuickBooks production access slips the pilot | apply in March; build against the sandbox. Intuit's app assessment comes before production keys [verified-snippet]; the pen-test vendor's calendar; Intuit's read metering ($300/month Silver from about 30 tenants [third-party]) |
| 5 | **Legal exposure that is easy to miss** | | counsel package in P2 (LEG-02..05) |

Risk 5 covers:

- benchmark trade libel (above);
- FTC §5 on AI accuracy claims, e.g. the Workado order (Aug 2025) [verified - ftc.gov]: quote only measured accuracy;
- Israeli holder liability;
- money transmission and Seller of Travel trust accounts, if payments arrive (phase 2 only, after counsel).

## Phases

| Phase | Dates | Exit criteria |
|---|---|---|
| P0 Decide | 16 Nov - 18 Dec 2026 | audit memo with A/B decision; trial report on ≥ 50 real invoices; finance engine package with exact identities |
| P1 Foundations | 4 Jan - 12 Feb 2027 | prod-ready infra; auth + MFA; FORCE RLS with the cross-tenant suite green; Live features rebuilt (B) |
| P2 MVP | 15 Feb - 23 Apr 2027 | invoice check, profit leaks, QuickBooks sync, Maya, studio, import, billing; DPA/ToS signed; first pilot live without passports |
| P3 Pen test | 26 Apr - 18 Jun 2027 | retest letter with no open critical or high findings |
| P4 GA | by 1 Jul 2027 | SLA, status page, 3 paying tenants |
| P5 Phase 2 | Q3-Q4 2027 | Xero, inbox bills, Stripe Connect (after counsel), trust reports, Priority, Hashavshevet, Israeli tax invoices (if in scope) |

**For IITA (31 Jan) and ABA (6 Feb)**, ready by then:

- the demo, with its Live/Pilot/Roadmap labels re-confirmed;
- the measured trial results;
- a one-page security and data overview;
- a pilot offer for late April.

## Go / no-go

**Lean: go.** Start P0 now (the audit and the trial sprint) and commit to the full build only after the trial report.

**The single factor most likely to change it:** the trial sprint's measured accuracy on real supplier invoices. If totals and line amounts fall well short of the targets (≥ 98% on totals, ≥ 95% on line amounts), the invoice check becomes a data-entry tool. In that case the build should narrow to profit leaks plus the QuickBooks sync before scaling the team.

## Files

| File | Content |
|---|---|
| `01-architecture.md` | A vs B and the audit gates, stack, tenancy, components |
| `02-data-model.md` | ERD and tables, RLS pattern, export |
| `03-api.md` | REST/OpenAPI, auth, resources, idempotency, errors, limits |
| `04-finance-engine.md` | rules from the demo, integer money, invariants, the check6 port |
| `05-ai.md` | extraction pipeline, evaluation, Maya grounding and LLM security, costs |
| `06-integrations/` | QuickBooks, Xero, Priority, Hashavshevet, Stripe, Israel Tax Authority allocation numbers, email, FX/maps/e-sign |
| `07-security-pentest.md` | ASVS 5.0 L2 matrix, STRIDE, keys, CI, incident response, pen-test package |
| `08-compliance.md` | control map: Israel, US, GDPR, PCI, SOC 2, WCAG, contracts |
| `09-ops.md` | environments, CI/CD, backup/DR, monitoring, cost model |
| `10-roadmap.md` | 115 tickets with estimates, who does each, dependencies, acceptance criteria; Gantt (generated by `tools/build_roadmap.py`) |
| `11-open-questions.md` | decisions for the owner, multiple choice |
