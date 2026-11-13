# Handover prompt: Triplanet backend, detailed execution plan

Paste everything below the line into a new Claude Code session that has the
`behemot46/triplanet-vibe-demo` and `behemot46/triplanet` repositories attached.

---

## Your task

Produce a **detailed, execution-ready plan** for turning the Triplanet v7 booth demo
into a functional, multi-tenant web service. The service must be ready for an
external **penetration test** and a compliance review, and fit for a first **paying
pilot customer**. This session is **planning only**: no production code. Schema
sketches, API contracts, sequence diagrams and config examples inside the plan are fine.

Scope: the **backend in full** (data, API, jobs, integrations, security, ops,
compliance). Cover the frontend only as far as the backend contract and the migration
path of the demo screens need it.

## Read first

1. `Triplanet-vibe-demo/CLAUDE.md`: what the demo is, its constraints and decisions.
2. Demo source, to extract the domain model and business rules:
   - `v6/s1_core.js`: data model, finance math, invoice-gap logic, TRIP_SPECS;
   - `v6/s5_fin.js`: invoice check, dispute email, finance dashboard;
   - `v6/s7_leak.js`: leak model;
   - `v6/s8_gen.js`: Trip studio, `genPlan`/`genLines`/`calc`;
   - `v6/s9a_books.js`: simulated accounting sync, object mapping, posting rules;
   - `v6/s9c_live.js`: Maya live mode;
   - `v6/s9b_status.js`: FEAT table, showing what is Live, Pilot or Roadmap;
   - `v6/s7b_product.js`: product screens (stages, Income, Vouchers).
3. `check6.js`: its finance identities become backend acceptance tests.
4. `Triplanet/research/financial-module.md`: competitor finance features, Israeli
   allocation numbers, payments economics.
5. `Triplanet/research/us-buyer-behavior.md` and `competitor-analysis-en.md`, skimmed for
   buyer expectations.
6. `Triplanet/deliverables/triplanet-strategy.html` (Hebrew), skimmed for go-to-market
   and timeline.

## Context and decisions so far (13 Nov 2026)

- The demo is one self-contained HTML file in vanilla JS. It stores data in
  localStorage, runs on generated data, has a scripted assistant, a simulated
  accounting sync and a fixed "today" of 20 Oct 2026. **None of it is reusable as
  backend.** What carries over:
  - the screens, as a UX spec;
  - the finance rules and the `check6` identities;
  - the i18n dictionary;
  - the FEAT table, as the scope list.
- **A product already exists** at app.triplanet.io, built in React with the MUI
  "Minimal" kit by a founding team of 4 over about a year. Live there: projects and
  stages, quotes with markup, catalog, clients, income/tax invoices/vouchers, HE/EN.
  The demo's Pilot features exist **only** in the demo: invoice check, profit leaks,
  accounting sync, Maya live, Trip studio.
- The owner doubts the team's cost-effectiveness. Agreed approach:
  - a 1-week code audit of the existing product;
  - a 3-4 week paid trial sprint on one Pilot feature;
  - then decide person by person.

  The plan must therefore have **two variants**:
  - **A**: build inside the existing product's backend;
  - **B**: a greenfield service.

  Give a recommended default and the decision criteria. If the existing product's
  repository is not attached, ask the user once for its owner/name (use `add_repo`).
  If it stays unavailable, plan B in full and A as a delta.
- Target buyers: US group tour operators with 3-20 agents. Shows: IITA Summit
  (Birmingham AL, 31 Jan-4 Feb 2027) and ABA Marketplace (Calgary, 6-9 Feb 2027).
  Israel is a secondary market (Hebrew UI, Priority/Hashavshevet).
- Real-brand rule in production: real supplier names WILL appear next to gaps,
  because it is the customer's own data. That moves the risk into the terms of
  service. Cross-customer supplier benchmarks must be anonymised, and the contract
  must cover the right to aggregate data.

## Requirements the plan must cover

### Core platform (must)
- Multi-tenant Postgres. Justify the isolation model (row-level security vs schema
  per tenant).
- Audit trail on every money field.
- Soft delete; data export on termination.
- Auth through a managed provider: MFA, roles owner/admin/agent/accountant
  (check the demo's roles), invitations, sessions, optional SSO later.
- Domain model, as an ERD with every entity, key fields and ownership:
  - tenant, users, clients, projects/trips with stages (quotation/operation/finance);
  - quote lines;
  - suppliers, hotels, venues, contracted rates with seasons and pax bands;
  - room blocks with cutoff/attrition;
  - supplier invoices and their lines;
  - gaps (kinds rooms/qty/rate/comp/extra/dup/under/missing) and disputes/credits;
  - commissions;
  - FX rates locked per trip, with source and timestamp;
  - client payments, vouchers, tax invoices.
- Finance engine as a pure, versioned server module. Invariants as tests:
  - planProfit = rev − plan + comm;
  - planProfit − amtDiff − fx − fcProfit = 0;
  - the leak bridge ties to the identity per scope and per dimension;
  - money as integer minor units or decimal, never float. State which, and why.
- API: REST or tRPC/GraphQL, justified. OpenAPI spec for the main resources.
  Idempotency keys on writes that integrations retry. Pagination, rate limits.
- Background jobs and queue: invoice extraction, sync, email, webhooks, retries,
  dead-letter queue.
- File storage for invoices and PDFs: encrypted, signed URLs, malware scan on upload.
- Import: CSV/Excel import of suppliers, rates, clients and open trips, with validation
  and a dry run.

### AI features
- **Invoice extraction:**
  - PDF or image goes to the Claude API (structured output), then human confirmation,
    then matching against quote lines;
  - confidence thresholds;
  - an evaluation set of 50-100 real invoices, with target precision and recall
    per field;
  - cost per invoice.
- **Maya live:**
  - server-side API key only;
  - grounded only on the tenant's data (retrieval plus tool calls scoped to the tenant);
  - prompt-injection defences (invoices are untrusted input);
  - a per-tenant spending cap, logging, and the refusal and fallback behaviour.
- Use the `claude-api` skill for current model IDs, pricing and data-retention options.
  Do not answer from memory.

### Integrations: one spec each
For each connector, give:
- auth (OAuth2 or keys), API style, objects mapped, sync direction and timing;
- webhooks, rate limits, error handling and reconciliation;
- a test sandbox, certification or app-review steps, cost;
- who must hold the account.

Verify every fact against the vendor's current docs and label it.

1. **QuickBooks Online** (Intuit Accounting API): departure → Class or Location,
   bills, vendor credits, invoices, payments. Production keys and the Intuit app
   assessment.
2. **Xero**: tracking categories, bills, credit notes. App partner certification.
3. **Priority** (Priority Software ERP REST/OData API, cloud and on-premise variants):
   - objects for suppliers, AP invoices, AR invoices, projects;
   - how a customer grants access;
   - who must confirm the object names (an accountant).
4. **Hashavshevet** (Wizsoft): what API or import format exists, if any. If it is file
   import only, say so.
5. **Stripe**, in three separate parts:
   - **Billing**: Triplanet's own subscriptions, trials, seats, dunning;
   - **Tax**: US sales tax on software subscriptions, economic nexus, and VAT/Israel
     where relevant;
   - **Connect**: traveller payments to operators. Designed so Triplanet never holds
     client funds. Cover money-transmission exposure, Seller of Travel trust-account
     rules (CA, FL, WA, HI), and PCI scope kept at SAQ A through Stripe Elements or
     Checkout.

   Mark Connect as phase 2 unless you find a reason it must be earlier.
6. **Israel Tax Authority allocation numbers** (SHAAM API, OAuth2) for tax invoices
   above the current threshold: verify the current threshold and timetable. Only if
   selling in Israel.
7. **Email**: transactional provider, sending from the customer's domain
   (SPF/DKIM/DMARC), bounce handling, and inbound email for bill capture (roadmap item).
8. **FX rates** source; **maps and routing** (licensing for drive times); **e-sign** for
   client quote acceptance (optional).

### Security: ready for a penetration test
- Build the plan around **OWASP ASVS 5.0 Level 2** (5.0.0 released 30 May 2025; map to
  4.0.3 only if the chosen pen-test vendor asks). Include a control matrix:
  each control → how it is implemented → evidence.
- Threat model (STRIDE) covering:
  - tenant isolation;
  - file upload;
  - LLM prompt injection;
  - OAuth token storage for connectors;
  - webhook signature checks;
  - SSRF;
  - IDOR across tenants.
- Secrets management:
  - KMS;
  - encryption of connector tokens and passport data at field level;
  - key rotation.
- Dependency, static and secret scanning in CI; signed builds; infrastructure as code.
- Logging and SIEM-lite; alerting; an incident response runbook.
- **Pen-test package:**
  - scope document;
  - test tenant with seeded data;
  - test accounts per role;
  - out-of-scope list;
  - remediation and retest window;
  - how to pick a vendor and a budget range.

### Compliance: control map with owner and evidence per item
- **Israel:**
  - Privacy Protection Law, including Amendment 13 (in force Aug 2025);
  - Privacy Protection (Data Security) Regulations 2017: the database security level
    and registration/notification duties;
  - plus Israeli tax-invoice rules if selling in Israel.
- **US:**
  - CCPA/CPRA and other state laws, where Triplanet acts as a service provider/processor;
  - FTC Act Section 5 on AI and security claims;
  - US sales tax on software subscriptions;
  - Seller of Travel, if payments are touched.
- **GDPR:** decide whether it applies (EU travellers on Europe trips, EU suppliers) and
  what follows if so.
- **PCI DSS:** keep scope at SAQ A.
- **SOC 2:** a Type I readiness path (Vanta/Drata or similar): which controls the
  architecture gives for free. Say when buyers will actually ask for it.
- **Contracts the backend must support:**
  - terms of service and an MSA;
  - data processing agreement and a subprocessor list (cloud, Anthropic, email,
    Stripe, Intuit/Xero);
  - data retention and deletion schedule;
  - AI disclosure;
  - export on exit;
  - liability for gap findings, which are suggestions the customer must check.
- **Accessibility:** WCAG 2.1 AA. Mark should or nice, with the reason.

### Operations
- Hosting recommendation with regions: US customers in US regions; consider the AWS
  Tel Aviv region for Israeli customers' data.
- Environments: dev, staging, prod, plus an ephemeral preview per pull request.
- CI/CD, database migrations and their rollback, feature flags.
- Backups with a tested restore; RPO/RTO targets.
- Monitoring and uptime; status page; a support tooling path.
- Monthly cost model at 1, 10 and 50 tenants. Itemise cloud, LLM, email, maps and
  tools. Give amounts in USD and ₪ with the exchange rate stated.

### Frontend contract (brief)
- How the demo screens become a client of the API. Choose one path, with reasons:
  - port into the existing React/MUI product (variant A); or
  - rebuild in React (variant B).
- Which demo-only parts are dropped: meeting mode, scripted Maya, brandSwap,
  generated data, the fixed "today" date.

## Deliverables

Write them in `Triplanet-vibe-demo/docs/backend-plan/`, commit and push on the
branch this session is given:

1. `00-summary.md`:
   - the answer first, for the owner;
   - recommended variant, timeline and team;
   - total cost range;
   - top 5 risks;
   - go/no-go lean and the single factor most likely to change it.
2. `01-architecture.md`: stack choice with alternatives rejected and why; component
   diagram; tenancy model.
3. `02-data-model.md`: ERD (Mermaid) and table definitions.
4. `03-api.md`: resources, auth, an OpenAPI outline, idempotency, errors.
5. `04-finance-engine.md`: rules from the demo, invariants, test plan that ports
   `check6`.
6. `05-ai.md`: extraction pipeline, evaluation plan, Maya grounding, LLM security.
7. `06-integrations/`: one file per connector, as specified above.
8. `07-security-pentest.md`: ASVS matrix, threat model, the pen-test package.
9. `08-compliance.md`: the control map (requirement → control → owner → evidence →
   status).
10. `09-ops.md`: environments, CI/CD, observability, backup/DR, cost model.
11. `10-roadmap.md`:
    - phases with exit criteria: foundations, then the MVP for the first paying pilot,
      then pen test and remediation, then GA, then phase 2 (Connect, Xero, inbox, trust
      reports);
    - work broken down into epics and then tickets, each with:
      - an estimate in engineer-days;
      - dependencies;
      - **who does it**: Claude Code alone, Claude Code plus a human reviewer, or
        human-only (accounts, contracts, app reviews, pen-test vendor, on-call);
    - a critical-path Gantt chart (Mermaid);
    - what must be ready for IITA/ABA (Feb 2027) versus later.
12. `11-open-questions.md`: decisions only the owner can make, each as a short
    multiple-choice question.

Also publish `00-summary.md` plus the roadmap as one shareable page (Artifact).

## Working rules

- **Label every factual claim:**
  - `[verified - source URL]`;
  - `[estimate]`;
  - `[unverified]`.

  Regulatory, vendor-API and pricing claims need a source or the unverified label.
  Research current vendor docs with web search, sending parallel searches.
- **Calculations:** state units and currency, list assumptions, and re-add totals
  before you deliver.
- **Challenge the brief** where it is wrong. Don't flatter. The owner is legally
  trained: skip generic disclaimers and flag only risks that aren't obvious.
- **Write so the plan can be executed by Claude Code** in later sessions: each ticket
  is small enough for one session and has acceptance criteria.
- **Never put API keys or secrets** in the repo or the plan.
- **Reply to the user in the language they write in.** If a Hebrew document is
  requested, make it fully RTL.
- **Start** by reading the files above. Then ask the user at most one round of
  questions, as tappable options, only for answers that would change the plan, for
  example:
  - access to the app.triplanet.io repository;
  - Israel in scope for the pilot or not;
  - payments in phase 1 or not.

  Then proceed.
