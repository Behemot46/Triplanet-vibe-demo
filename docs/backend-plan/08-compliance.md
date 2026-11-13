# 08 · Compliance control map

Each row: **requirement → control → owner → evidence → status.**

Owners:

| Owner | Role |
|---|---|
| **OWN** | founder/owner |
| **ENG** | engineering lead |
| **SEC** | fractional security lead (vCISO) |
| **DPO** | privacy protection officer, external |
| **CNSL** | outside counsel: US privacy, Israeli privacy, travel/payments |
| **CPA** | US sales tax / Israeli VAT |

Status: **Plan** = designed here; **Ticket** = scheduled in `10-roadmap.md`; **Open** = needs a decision or an advice letter.

Research basis: web search on 13 Nov 2026. gov.il pages could not be fetched, and the Israeli statute is cited from EBN Law's unofficial English translation of Amendment 13 (Sep 2024). **Counsel must check against the official Hebrew text before reliance.**

**Who is who.** Each tour operator is the **controller** of its traveller and client data. Triplanet is the **processor**: under CCPA a "service provider", under Israeli law a "holder" (מחזיק), and under GDPR a processor where GDPR applies. For its own users, billing and marketing data, Triplanet is a controller.

## 1. Israel

| # | Requirement | Control | Owner | Evidence | Status |
|---|---|---|---|---|---|
| IL-1 | **Amendment 13 in force since 14 Aug 2025**: the PPA can fine holders directly, including for processing beyond the controller's authorisation [verified - Meitar memo, Sep 2024; EBN translation] | purpose limitation in the DPA; no secondary use of tenant data; anonymised benchmarks only under an explicit contract clause (§6) | CNSL, OWN | DPA, data-use policy | Ticket LEG-02 |
| IL-2 | **s.17A: a holder of several owners' databases must grant access to each database only to those the owner authorised in writing** [verified - EBN translation] | tenant isolation by FORCE RLS (`02-data-model.md` §4); no standing support access (break-glass) | ENG | RLS coverage test; cross-tenant suite; break-glass log | Ticket TEN-01..03 |
| IL-3 | **DPO appointment**: holders whose main business includes processing especially sensitive data "on a significant scale"; the PPA's final position (~Jul 2026) counts a SaaS holder's clients **cumulatively**; no numeric threshold [verified - Barnea, 22 Jul 2026] | appoint an **external DPO** before Israeli tenants hold health/dietary data at scale; DPO reports to the CEO | OWN | appointment letter; DPO named in privacy notice | Open Q8 |
| IL-4 | "Information of special sensitivity" includes health, religious belief, origin, and financial data; **passport numbers are not listed** [verified - EBN translation s.3] | diet/medical/kosher/halal notes classified Restricted (`07-security-pentest.md` §5); encrypted | ENG | data classification table | Plan |
| IL-5 | **Registration** is now only for public bodies and data brokers > 10,000 people; a **controller** with special-sensitivity data on > 100,000 people notifies the PPA within 30 days [verified - EBN s.8A] | not Triplanet's duty as holder; tell tenants in onboarding docs | DPO | onboarding note | Plan |
| IL-6 | **Data Security Regulations 2017 levels.** An operator database with sensitive data and > 10 users is **medium**; ≥ 100,000 people or > 100 users is **high** [verified - protocol.co.il; EBN Third Schedule] | design to the **high** level so any tenant is covered | SEC | security procedure document; asset inventory | Ticket SEC-06 |
| IL-7 | Medium/high: audit at least every 24 months (Reg. 16); access logs 24 months (one source says 1 year for some records) [verified - EBN Third Schedule item 29; conflict unverified] | security and audit logs retained **24 months**; external audit every 24 months | SEC | log retention config; audit report | Plan |
| IL-8 | High: **risk survey and penetration test at least every 18 months** (Reg. 5(c), 5(d)) [verified - EBN Third Schedule] | annual pen test (`07` §7); annual risk survey | SEC | reports | Ticket PT-01..04 |
| IL-9 | **Severe security incident → report to the PPA immediately** (Reg. 11(d)); the holder reports to the controller (Reg. 11(b)) [verified - EBN; DLA Piper] | incident runbook (`07` §6) with Israeli-specific steps | SEC | runbook; drill record | Ticket OPS-06 |
| IL-10 | **Reg. 15 outsourcing contract**: data, purposes, systems, processing types, duration, return/deletion, security, confidentiality, incident reporting, an **annual compliance report to the controller**, sub-processors [verified - ayr.co.il guide; EBN item 24] | **Israeli DPA template** with every Reg. 15 term; annual compliance statement generated per tenant | CNSL, DPO | signed DPAs; yearly statement | Ticket LEG-03 |
| IL-11 | **Transfer abroad** (2001 Regulations): no ban found on hosting Israeli data in AWS US; the route is Reg. 2(4) + a written undertaking under Reg. 3 (Israeli-equivalent obligations, or ISO 27001 per the PPA paper of 13 Apr 2026) [verified - gornitzky.com; "no ban" is a negative finding, unverified] | Israeli tenants: **default to AWS il-central-1** (RDS, ECS, S3, KMS, Secrets Manager, WAF available) [verified - aws.amazon.com Israel region posts]; or US hosting with the Reg. 3 undertaking in the DPA. **Claude inference is not in Israel** (Bedrock in il-central-1 uses global routing) [verified - platform.claude.com Bedrock page], so the transfer undertaking covers Anthropic too | OWN, CNSL | region config; DPA annex | Open Q2 |
| IL-12 | **Fines**: NIS 4 per person (8 for especially sensitive), minimum NIS 200,000 for processing without authorisation; security breaches up to NIS 320,000 per item at high level; cap 5% of turnover; amounts CPI-indexed [verified - EBN Schedules, pre-indexation] | the controls above; D&O/cyber insurance | OWN | policy | Open Q11 |
| IL-13 | **Tax invoices / allocation numbers / software registration** (`06-integrations/israel-tax-allocation.md`) | only if Triplanet issues Israeli tax invoices | OWN, CPA | ITA registration certificate | Open Q2 |
| IL-14 | Whether Israeli privacy law also reaches Triplanet's holding of **US** operators' data (Israeli holder, foreign controllers) [unverified - open for counsel] | treat all tenants to the same controls (design to "high") so the answer does not change engineering | CNSL | advice letter | Open |

## 2. United States

| # | Requirement | Control | Owner | Evidence | Status |
|---|---|---|---|---|---|
| US-1 | **CCPA/CPRA service provider**: without a contract meeting 11 CCR §7051(a) the recipient is **not** a service provider and the disclosure can be a sale or sharing; amended regulations in force 1 Jan 2026 [verified - prighter.com §7050; cppa.ca.gov] | DPA with all §7051(a) terms: business purposes listed, no sell/share, no combining, compliance rights, notice if unable to comply, flow-down to sub-processors | CNSL | DPA | Ticket LEG-02 |
| US-2 | **Other state laws**: 19 comprehensive state laws enacted per IAPP (Jan 2026); trackers show about 20 in effect, about 23 enacted [verified IAPP / unverified trackers]. Oklahoma SB 546 reported, unverified | one processor-terms annex covering Virginia-model processor duties (instructions, confidentiality, deletion, audits, sub-processor notice) | CNSL | DPA annex | Ticket LEG-02 |
| US-3 | **FTC Act s.5, AI claims**: Operation AI Comply (Sep 2024); Workado consent order (Aug 2025) for an unsupported "98% accuracy" claim [verified - ftc.gov; fkks.com] | **no quantified AI claim without evidence**: accuracy claims only from the evaluation set (`05-ai.md` §2), with the date and set size; keep the demo's Live/Pilot/Roadmap labelling in the product and marketing; Maya answers labelled live vs scripted | OWN | claims register linking each claim to its evidence | Ticket LEG-05 |
| US-4 | **FTC Act s.5, security claims**: Illuminate Education order (Jun 2026) bans security misrepresentations [verified - natlawreview.com] | security page states only implemented controls; no "bank-level" or "SOC 2 compliant" claims until true | OWN, SEC | security page reviewed against this matrix | Ticket LEG-05 |
| US-5 | **Sales tax on SaaS** (`06-integrations/stripe.md` §2): Oklahoma exempt; Texas 80% taxable; CA/CO reportedly from 1 Jan 2027 [mixed labels] | Stripe Tax monitoring; register at 80% of a threshold | CPA | nexus report | Ticket BILL-03 |
| US-6 | **Seller of Travel** (CA, FL, WA, HI) | phase 1: Triplanet never touches traveller funds and does not contract with travellers. Phase 2: direct charges only, operator payout to its trust account | CNSL | advice letter before Connect | Open Q9 |
| US-7 | **State breach notification**: the controller (operator) notifies; the processor assists | DPA: notify the customer without undue delay, target ≤ 72 h; provide the facts needed | SEC | runbook | Plan |
| US-8 | **ESIGN/UETA** for quote acceptance | acceptance record (`06-integrations/fx-maps-esign.md` §3) | CNSL | record schema | Plan |

## 3. GDPR

**Decision: GDPR does not apply by default. Build so it can be switched on per tenant.**

- Art. 3(2) reaches a non-EU processor only where its controller targets people **in** the EU. A US operator selling to US travellers going to Europe is generally not caught, because travel destination and citizenship are not the test [verified - EDPB Guidelines 3/2018 for the rule; the application to Triplanet is analysis, unverified].
- **EU suppliers** (hotels, guides) are B2B contacts; their staff's names and emails are personal data, but the processing is by a US controller not targeting the EU.
- **When it would apply:** an operator markets tours to EU residents (e.g. an Irish parish group), or an Israeli tenant receives data from EU partners (Israeli EEA-data regulations 2023).
- **If it applies:**
  - an Art. 28 DPA with SCCs (Module 3, processor to processor, for sub-processors);
  - an **Art. 27 EU representative**, because continuous processing including health and dietary data is not "occasional" [verified - gdpr-info.eu Art. 27];
  - a TIA for US hosting. The EU-US DPF remains valid: the General Court dismissed Latombe (T-553/23) on 3 Sep 2025, and appeal C-703/25 P is pending [verified - WilmerHale];
  - Israel has EU adequacy, reconfirmed 15 Jan 2024 [verified - DLA Piper].
- **Owner:** CNSL. **Status:** Open Q12 (decide at the first EU-facing tenant).

## 4. Sub-processors (initial list for the DPA)

| Sub-processor | Purpose | Data | Location |
|---|---|---|---|
| Amazon Web Services | hosting, database, storage, malware scan | all tenant data | US (us-east-1); Israel (il-central-1) for Israeli tenants if Q2 = yes |
| Anthropic | invoice extraction, Maya | invoice files, aggregated finance figures; no passport/DOB/medical data | US (`inference_geo: "us"`) |
| WorkOS | authentication | user names, emails, MFA | US [unverified] |
| Postmark (ActiveCampaign) | transactional email, inbound bills | email addresses, email content | US [unverified] |
| Stripe | Triplanet's billing (and phase-2 Connect) | billing contacts | US |
| Intuit / Xero / Priority / Hashavshevet | accounting sync, **at the customer's instruction** | bills, credits, invoices, payments | vendor regions |
| Sentry, Better Stack | error and log monitoring | scrubbed technical data | US/EU [unverified] |

Changes are notified 30 days in advance, by email and on the trust page.

## 5. Retention and deletion schedule

| Data | Retention | Basis |
|---|---|---|
| Tenant business data (trips, quotes, invoices, gaps) | life of the subscription + 30 days after termination (export window), then hard delete; backups roll off within 35 days | DPA |
| Financial records the customer must keep (US: 7 years is typical; Israel: 7 years) | **the customer's duty**: export before exit; Triplanet does not keep them after termination unless contracted | [unverified retention periods; CPA to confirm] |
| Traveller personal data | delete or anonymise 12 months after trip return, unless the tenant sets longer (max 7 years) | data minimisation |
| Passport fields | delete 30 days after trip return | minimisation (Restricted) |
| AI prompts and completions (`ai_message`) | 90 days, configurable down to 0 | `05-ai.md` §3.4 |
| Extraction runs (results, not files) | life of the invoice | evidence for gap findings |
| Application logs | 90 days | ops |
| Security and audit logs | 24 months | IL-7 |
| Webhook payloads | 30 days | ops |

Implemented by the nightly `retention` job (ticket DATA-03), with tests.

## 6. Contracts the backend must support

| Contract item | What the backend provides | Owner |
|---|---|---|
| **Terms of service / MSA** | acceptance recorded per user and version (`terms_acceptance`) | CNSL |
| **DPA** (US + Israeli Reg. 15 + optional GDPR annex) + sub-processor list | DPA version accepted per tenant; sub-processor change notices | CNSL, DPO |
| **AI disclosure** | in-product labels (Maya · Claude, "suggested by AI"); privacy notice section on AI; no training on customer data | OWN |
| **Gap findings are suggestions** | every gap shows "detected by Triplanet, confirmed by <user>"; disputes are sent only by a user; ToS: Triplanet does not warrant that a gap exists or that a supplier owes money; the customer verifies before disputing. **Real supplier names will appear next to gaps** (it is the customer's own data); the demo's real-brand rule does not carry over, but the **customer** is the one asserting the claim to its supplier | CNSL |
| **Aggregated, anonymised benchmarks** ("hotels in Branson overbill qty in 18% of invoices") | an opt-in clause; benchmarks only from ≥ 5 tenants and ≥ 20 invoices per cell; **no supplier named in cross-customer benchmarks** unless counsel clears it (defamation/trade-libel risk is non-obvious: a statistic that singles out one real hotel is an assertion by Triplanet, not by the customer) | CNSL, OWN |
| **Export on exit** | `POST /exports` (`02-data-model.md` §5), plus automatic export at termination | ENG |
| **Liability cap** | standard SaaS cap (12 months' fees); carve-outs for data-protection breaches negotiated | CNSL |
| **Xero AI terms** | Xero data not used to train or "contribute to" AI models (Q10) | CNSL |

## 7. PCI DSS

- **Phase 1:** only Triplanet's own subscription billing, via Stripe Checkout/portal. Triplanet as a merchant qualifies for **SAQ A** [verified - Stripe PCI FAQ].
- **Phase 2:** Connect, with the operator as merchant. Keep the whole app SAQ-A-eligible under the r1 criterion that the site is "not susceptible to script attacks": a strict CSP and no third-party scripts [verified - Akamai/Adyen summaries].
- **Owner:** SEC. **Status:** Plan.

## 8. SOC 2

- **When buyers ask:**
  - For 3-20-agent operators it is rare. A security page, the DPA, a pen-test summary and questionnaire answers cover most deals [unverified - practitioner opinion].
  - Expect requests from larger operators, consortia/associations, and anyone procuring payments [unverified].
- **Plan:**
  - Run SOC 2 **readiness** from the start (the controls in `07`). No audit before there is a concrete deal that requires it.
  - Then a **Type I** about 3 months after the decision, and Type II after 6-12 months of observation.
- **Cost if triggered:**
  - tool: Vanta or Drata about $7.5-11.5k/yr;
  - Type I audit: $5-20k;
  - first year all-in: $20-60k ≈ ₪63k-190k;

  [all unverified - third-party estimates].
- **What the architecture already gives** (for the auditor's mapping):
  - IaC change control (PRs, reviews, CI);
  - RLS tenant isolation and its tests;
  - encryption at rest and in transit;
  - centralised logging and alerting;
  - an append-only audit trail;
  - MFA for privileged roles;
  - vulnerability management (CI scanners);
  - backups with tested restores;
  - the incident runbook;
  - vendor management (the sub-processor list with SOC reports).
- **Gaps that are process, not code:** HR onboarding/offboarding, security training, the access review cadence, the risk register, board oversight. The tool templates these.
- **Owner:** SEC, OWN. **Status:** Open Q13 (the trigger).

## 9. Accessibility (WCAG 2.1 AA)

**Rating: should, not must.**

- ADA Title III website suits: 3,117 federal suits in 2025, +27% [verified - Seyfarth via adatitleiii.com]. But courts split on online-only businesses, and B2B SaaS is a low-frequency target [verified - Proskauer and case law via the research notes].
- The DOJ Title II rule binds public bodies, not private SaaS. Deadlines moved to 26 Apr 2027 / 26 Apr 2028 by the interim rule of 20 Apr 2026 [verified - Duane Morris]. Triplanet is reached only if it sells to public bodies (e.g. public-university travel programmes).
- **Raise to must** for any **traveller-facing page** in phase 2 (quote acceptance, payment pages), since those face consumers.
- **Controls:**
  - the MUI component baseline;
  - axe-core in CI on key screens;
  - keyboard paths for the review screen;
  - RTL parity for Hebrew;
  - publish a VPAT/ACR when an association or public buyer asks.
- **Owner:** ENG. **Status:** Ticket FE-A11Y.
