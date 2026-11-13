#!/usr/bin/env python3
"""Builds docs/backend-plan/10-roadmap.md from the ticket table below.

Why a script: the totals per phase, per epic and per "who" and the Gantt chart
are computed, so they cannot drift from the tickets. Edit TICKETS, re-run:
    python3 docs/backend-plan/tools/build_roadmap.py
Estimates are engineer-days at a Claude-Code-assisted pace [estimate].
WHO: CC = Claude Code alone (human merges after CI), CCR = Claude Code + human reviewer,
     H = human only (accounts, contracts, vendor work, app reviews, on-call).
VARIANT: 'both' or 'B' (greenfield only; dropped in variant A).
"""
import os
from collections import OrderedDict, defaultdict

PHASES = OrderedDict([
    ("P0", "Decide: code audit + trial sprint (16 Nov - 18 Dec 2026)"),
    ("P1", "Foundations (4 Jan - 12 Feb 2027)"),
    ("P2", "MVP for the first paying pilot (15 Feb - 23 Apr 2027)"),
    ("P3", "Pen test and remediation (26 Apr - 18 Jun 2027)"),
    ("P4", "GA (by 1 Jul 2027)"),
    ("P5", "Phase 2 (Q3-Q4 2027)"),
])

# id, phase, epic, title, days, who, variant, deps, acceptance criteria
TICKETS = [
 # ---------------- P0
 ("AUD-01","P0","E-AUDIT","Get read access to the app.triplanet.io repos; run SAST, dependency, secret scans and a schema dump",1,"CCR","both","",
  "Scan reports (Semgrep, npm audit/Socket, gitleaks) and a schema ERD committed to the audit folder"),
 ("AUD-02","P0","E-AUDIT","Review tenancy, money types, migrations, tests and CI against the 6 gates in 01-architecture.md",3,"CCR","both","AUD-01",
  "A gate-by-gate verdict with file:line evidence; list of what exists per epic of this roadmap"),
 ("AUD-03","P0","E-AUDIT","Audit report and variant A/B recommendation to the owner",1,"H","both","AUD-02",
  "Signed-off decision memo; if A, the epic list is re-scoped in this file"),
 ("TRIAL-01","P0","E-TRIAL","Collect 50-100 real supplier invoices from the 3 pilot agencies and a US prospect (NDA/DPA first)",3,"H","both","",
  "At least 50 invoices stored in the eval bucket, traveller names redacted, mix per 05-ai.md section 2"),
 ("TRIAL-02","P0","E-TRIAL","Labeling UI and double-labelled ground truth",6,"CCR","both","TRIAL-01",
  "Every invoice labelled twice and reconciled; JSON ground truth committed; labelling UI documented"),
 ("TRIAL-03","P0","E-TRIAL","Extraction prototype (Claude API, structured output, no tools) and eval harness",4,"CCR","both","TRIAL-02",
  "Harness reports per-field precision/recall, cost and latency; runs Opus 5.5, Sonnet 5.5 and Haiku 5.5"),
 ("TRIAL-04","P0","E-TRIAL","Matcher prototype: allocate extracted lines to quote lines (demo NEN trip + 5 real trips)",3,"CCR","both","TRIAL-03",
  "Top-1 allocation accuracy reported; the six NEN inbox files reproduce the demo's gaps"),
 ("TRIAL-05","P0","E-TRIAL","Trial report: accuracy vs targets, thresholds, model choice, cost per invoice",1,"CCR","both","TRIAL-04",
  "Report compares to the 05-ai.md targets; the 15 adversarial invoices change 0 fields"),
 ("FIN-01","P0","E-FIN","Finance engine package: Money type, calc, invStatus, groups, discounts (integer minor units)",5,"CCR","both","",
  "Pure TS package, no I/O; ESLint bans number arithmetic on money; README with rule table"),
 ("FIN-02","P0","E-FIN","Leak model, bridge steps, at-risk items, dimensions",3,"CCR","both","FIN-01",
  "I3/I4 hold exactly on fixtures"),
 ("FIN-03","P0","E-FIN","Export the demo's 20 trips as golden fixtures; parity test T10 against the demo calc",2,"CC","both","FIN-01",
  "Per-trip planProfit/fcProfit within 1 cent per line of the demo; fixtures committed"),
 ("FIN-04","P0","E-FIN","Property tests T1-T9; 100% branch coverage",2,"CC","both","FIN-02",
  "fast-check suites green; coverage report 100% branches"),
 # ---------------- P1
 ("INF-01","P1","E-FOUND","AWS organisation, accounts (dev, staging, prod-us, pentest), Terraform skeleton, state backend",3,"CCR","both","AUD-03",
  "terraform plan/apply per env from CI with OIDC; no long-lived keys"),
 ("INF-02","P1","E-FOUND","VPC, NAT, egress allow-list, WAF with managed rules and rate rule, CloudFront",3,"CCR","both","INF-01",
  "Egress to a non-listed host fails; WAF blocks a test SQLi; IMDSv2 enforced"),
 ("INF-03","P1","E-FOUND","RDS Postgres 16 Multi-AZ, force_ssl, PITR, automated snapshots",2,"CCR","both","INF-01",
  "Non-TLS connection refused; PITR window 7-35 days configured"),
 ("INF-04","P1","E-FOUND","ECS Fargate services (api, worker), ALB, blue/green deploy",3,"CCR","both","INF-02",
  "Deploy from main to staging automatically, to prod on tag; rollback in one command"),
 ("INF-05","P1","E-FOUND","Secrets Manager and KMS keys (per env), IAM least privilege",1,"CCR","both","INF-01",
  "API role cannot decrypt connector tokens; worker can, with encryption context"),
 ("CI-01","P1","E-FOUND","Monorepo, pnpm workspaces, lint, typecheck, unit tests in CI",1,"CC","both","",
  "CI green on an empty package set; required checks on main"),
 ("CI-02","P1","E-FOUND","Security scanners: Semgrep, gitleaks, Socket/Dependabot, Trivy, Checkov",1,"CC","both","CI-01",
  "Each scanner fails the build on a seeded issue"),
 ("CI-03","P1","E-FOUND","Ephemeral preview environment per pull request",3,"CCR","both","INF-04",
  "A PR gets a URL with a seeded tenant; destroyed on merge"),
 ("CI-04","P1","E-FOUND","SBOM per build, cosign keyless signing, signature verified at deploy",2,"CCR","both","INF-04",
  "Unsigned image is refused by the deploy step"),
 ("AUTH-01","P1","E-AUTH","WorkOS AuthKit account, environments, organisations model",2,"H","both","",
  "Dev/staging/prod AuthKit environments; owner holds the account"),
 ("AUTH-02","P1","E-AUTH","JWT verification, membership resolution, deny-by-default role table",3,"CCR","both","AUTH-01,API-01",
  "Unit tests: wrong iss/aud/alg rejected; every route has a role entry or the build fails"),
 ("AUTH-03","P1","E-AUTH","Invitations, member management, session revocation on removal",2,"CCR","both","AUTH-02",
  "Removed member's next request is 401 within 15 min"),
 ("AUTH-04","P1","E-AUTH","MFA enforcement for owner/admin/accountant; step-up for sensitive actions",2,"CCR","both","AUTH-02",
  "Export without fresh MFA returns 403 step_up_required"),
 ("TEN-01","P1","E-TEN","Schema conventions, app_user role, FORCE RLS policies, per-transaction set_config",3,"CCR","both","INF-03",
  "Query without app.tenant_id returns 0 rows; agent policy hides other agents' trips"),
 ("TEN-02","P1","E-TEN","RLS coverage test in CI",1,"CC","both","TEN-01",
  "Adding a tenant table without a policy fails CI"),
 ("TEN-03","P1","E-TEN","Cross-tenant test suite generated from the OpenAPI spec",3,"CCR","both","TEN-01,API-01",
  "For every route: tenant B token on tenant A id returns 404"),
 ("AUDT-01","P1","E-TEN","audit_event trigger, append-only grants, per-tenant hash chain",2,"CCR","both","TEN-01",
  "App role cannot UPDATE/DELETE audit_event; chain verification job passes"),
 ("API-01","P1","E-API","Fastify skeleton, Zod to OpenAPI, RFC 9457 errors, request ids",2,"CCR","both","CI-01",
  "openapi.json generated and diffed in CI"),
 ("API-02","P1","E-API","Idempotency keys, ETag/If-Match, cursor pagination, rate limits",3,"CCR","both","API-01",
  "Replay returns stored response; body mismatch 422; concurrent 409; 429 with Retry-After"),
 ("JOB-01","P1","E-API","pg-boss worker, transactional outbox, signed job payloads, DLQ alerts",3,"CCR","both","API-01,TEN-01",
  "Forged payload rejected; job retried 5x then dead-lettered with alert"),
 ("OBS-01","P1","E-OPS","Sentry, Better Stack logs/uptime/status page, CloudWatch dashboards",2,"CC","both","INF-04",
  "Synthetic error appears in Sentry; status page live"),
 ("OBS-02","P1","E-OPS","Security event catalogue and alert rules",2,"CCR","both","OBS-01",
  "Each event in 07 section 6 fires a test alert"),
 ("DATA-02","P1","E-DATA","Field encryption library (per-tenant DEK, KMS, AAD), key rotation job",3,"CCR","both","INF-05,TEN-01",
  "Ciphertext moved to another row fails; rotation re-encrypts in batches"),
 ("LIVE-01","P1","E-LIVE","Clients and contacts API",2,"CCR","B","TEN-01,API-02",
  "CRUD with RLS, audit and OpenAPI; cross-tenant suite green"),
 ("LIVE-02","P1","E-LIVE","Trips, stages, collaborators, stage transitions",4,"CCR","B","LIVE-01",
  "Stage machine enforced via :advance; agent scope respected"),
 ("LIVE-03","P1","E-LIVE","Quote versions, lines, discounts, pricing preview, send/accept, FX lock on win",6,"CCR","B","LIVE-02,FIN-01",
  "Sent version immutable; totals equal engine output; I1 holds on every saved quote"),
 ("LIVE-04","P1","E-LIVE","Suppliers, catalog, rates, season/pax bands, room blocks, reference catalog import",6,"CCR","B","LIVE-01",
  "Band overlap rejected by exclusion constraint; reference hotels importable"),
 ("LIVE-05","P1","E-LIVE","Itinerary, tasks, booking groups, travellers (no passport fields)",5,"CCR","B","LIVE-02",
  "Itinerary move endpoint matches demo dndMoveItem behaviour"),
 ("LIVE-06","P1","E-LIVE","Client invoices (deal/tax), payment recording, vouchers (PDF)",6,"CCR","B","LIVE-03",
  "Gap-free numbering per kind; I2 holds; PDFs render EN and HE"),
 ("LIVE-07","P1","E-LIVE","i18n package (EN/HE keyed messages, RTL)",3,"CCR","both","",
  "No Hebrew in EN responses (port of check6 LEFTOVER test)"),
 ("LIVE-08","P1","E-LIVE","FX nightly job (ECB, BoI) and fx_lock with audit",2,"CCR","both","JOB-01",
  "Rate stored with source and timestamp; override needs admin + reason"),
 ("FE-01","P1","E-FE","Frontend path decision: repoint the existing React/MUI app or rebuild",2,"H","both","AUD-03",
  "Decision memo with the reuse list"),
 ("FE-02","P1","E-FE","App shell: auth, tenant switch, navigation, theme (MUI Minimal preset1), generated API client",4,"CCR","B","FE-01,AUTH-02",
  "Login, tenant switch and role-based nav work in EN and HE"),
 ("FE-03","P1","E-FE","Screens for the Live features (projects, quotes, catalog, clients, income, vouchers)",12,"CCR","B","FE-02,LIVE-06",
  "Screens match the demo/product screenshots; axe shows no serious issues"),
 # ---------------- P2
 ("FILE-01","P2","E-INV","Presigned upload/download, private bucket policy, sha256 dedupe",2,"CCR","both","INF-05,API-02",
  "Direct S3 access denied; duplicate file detected"),
 ("FILE-02","P2","E-INV","GuardDuty Malware Protection for S3 wiring and quarantine",2,"CCR","both","FILE-01",
  "EICAR upload is quarantined and never processed"),
 ("FILE-03","P2","E-INV","Magic-byte, size and page checks; HEIC to JPEG; encrypted PDF rejection",1,"CC","both","FILE-01",
  "Renamed .exe rejected; 31-page PDF rejected with a clear error"),
 ("FILE-04","P2","E-INV","File attack tests (polyglot, zip bomb, oversized, SVG)",1,"CC","both","FILE-03",
  "All cases rejected in CI"),
 ("EXT-01","P2","E-INV","Production extraction job from the trial prototype (prompt versioning, cost logging)",3,"CCR","both","TRIAL-05,JOB-01,FILE-02",
  "extraction_run rows carry model, prompt_version, tokens and cost"),
 ("EXT-02","P2","E-INV","Deterministic validation rules and confidence capping",2,"CCR","both","EXT-01",
  "Totals that do not tie force review"),
 ("EXT-03","P2","E-INV","Matcher and allocations (many-to-many) in the finance engine",4,"CCR","both","EXT-02,LIVE-03",
  "Top-1 allocation accuracy at or above the trial result on the eval set"),
 ("EXT-04","P2","E-INV","Gap detection, kinds, state machine, gap_event history",3,"CCR","both","EXT-03",
  "No gap from an unconfirmed invoice; I1 holds after every transition"),
 ("EXT-05","P2","E-INV","Dispute drafts and sending via Postmark from the customer's domain",3,"CCR","both","EXT-04",
  "DKIM-verified domain sends as the operator; fallback uses Reply-To; bounce marks the address"),
 ("EXT-06","P2","E-INV","Supplier credits and commission receipts",2,"CCR","both","EXT-04",
  "Credit closes the gap as credited; commission owed equals expected minus received"),
 ("EXT-07","P2","E-INV","Eval harness in CI (10-invoice smoke) and full calibration run",2,"CCR","both","EXT-02",
  "Green band error rate at or below 1% per field"),
 ("FE-04","P2","E-FE","Invoice review screen (evidence next to each field, keyboard path)",5,"CCR","both","EXT-02",
  "Confirm/edit/re-allocate works with keyboard only"),
 ("FE-05","P2","E-FE","Gaps, disputes, profit leaks, finance dashboard, trip P&L screens",8,"CCR","both","EXT-04,FIN-02",
  "Figures equal the API engine output; bridge starts at $0"),
 ("QBO-01","P2","E-QBO","Intuit developer workspace, sandbox companies, app registration",1,"H","both","",
  "Owner holds the workspace; 2 US sandboxes (Plus, Advanced)"),
 ("QBO-02","P2","E-QBO","OAuth connect, encrypted tokens, refresh, re-consent banner",3,"CCR","both","QBO-01,DATA-02",
  "Token stored as ciphertext only; re-consent shown 30 days before refresh expiry"),
 ("QBO-03","P2","E-QBO","Mapping: expense accounts per service type, AP account, tagging method (sub-customer default)",2,"CCR","both","QBO-02",
  "Plus sandbox: 60 trips tag without error 6570"),
 ("QBO-04","P2","E-QBO","Push Vendor, Customer/job, Bill (+Attachable), VendorCredit with idempotency",5,"CCR","both","QBO-03,EXT-04",
  "Replayed push creates no duplicate; external_ref updated"),
 ("QBO-05","P2","E-QBO","CloudEvents webhooks, nightly CDC, reconciliation view",4,"CCR","both","QBO-04",
  "Forged signature rejected; amount changed in QBO shows as out of sync"),
 ("QBO-06","P2","E-QBO","Intuit app assessment questionnaire and production keys",2,"H","both","QBO-05",
  "Production keys issued"),
 ("FE-06","P2","E-FE","Accounting connect, mapping and sync log UI",4,"CCR","both","QBO-03",
  "Matches the demo's books screen flow"),
 ("AI-01","P2","E-AI","Server-side Maya proxy: SSE streaming, effort low, server-side fallbacks, refusal handling, 25 s first-token timeout",2,"CCR","both","API-02",
  "No API key reaches the browser; refusal shows the safe message"),
 ("AI-02","P2","E-AI","Seven read-only, tenant-bound, role-filtered tools",4,"CCR","both","AI-01,FIN-02",
  "Agent role cannot read another agent's trip via any tool"),
 ("AI-03","P2","E-AI","Budget cap, per-user rate limit, ai_message logging, 90-day retention",2,"CCR","both","AI-01",
  "At 100% budget Maya stops and links to reports"),
 ("AI-04","P2","E-AI","Injection defences: untrusted_text wrapping, safe Markdown, number post-check",2,"CCR","both","AI-02",
  "Image and external link rendering blocked; unknown money figures flagged"),
 ("AI-05","P2","E-AI","Maya eval set (28 demo + 30 new) and 10 red-team prompts",3,"CCR","both","AI-04",
  "100% numeric accuracy; 0 cross-tenant reads"),
 ("FE-07","P2","E-FE","Maya panel (SSE, safe Markdown, live/AI labels)",3,"CCR","both","AI-01",
  "Pill shows 'Maya · Claude' only on live answers"),
 ("STU-01","P2","E-STUDIO","Planner package ported from v6/s8_gen.js (bases, nights split, day plans)",5,"CCR","both","FIN-01",
  "I5-I7 hold for every seed destination"),
 ("STU-02","P2","E-STUDIO","Self-hosted OSRM (US, Europe, Levant extracts) with attribution",2,"CCR","both","INF-04",
  "Drive times stored on itinerary items with osrm_version"),
 ("STU-03","P2","E-STUDIO","Studio creates a draft quote from the tenant's catalog and contracted rates",3,"CCR","both","STU-01,LIVE-04",
  "Created quote is an ordinary quote; I1 holds"),
 ("FE-08","P2","E-FE","Studio screen",4,"CCR","both","STU-03",
  "Plan, map and price render in EN and HE"),
 ("IMP-01","P2","E-IMPORT","CSV/XLSX import framework with dry-run report",3,"CCR","both","API-02",
  "Dry run lists every row error; commit is all-or-nothing"),
 ("IMP-02","P2","E-IMPORT","Importers: suppliers, rates, clients, open trips",4,"CCR","both","IMP-01,LIVE-04",
  "A pilot's real files import with 0 unexplained errors"),
 ("BILL-01","P2","E-BILL","Stripe products, Checkout, customer portal, signed webhooks",3,"CCR","both","API-02",
  "Plan/status change only via verified webhook events"),
 ("BILL-02","P2","E-BILL","Tenant lifecycle: trial, suspended (read-only), terminated (export, delete at day 30)",2,"CCR","both","BILL-01,DATA-01",
  "Suspended tenant can export but not write"),
 ("BILL-03","P2","E-BILL","Stripe Tax monitoring; CPA review of nexus",1,"H","both","BILL-01",
  "Nexus report reviewed by CPA"),
 ("DATA-01","P2","E-DATA","Owner data export (ZIP: CSV, JSON, files, manifest)",2,"CCR","both","FILE-01",
  "Export of the seed tenant re-imports into an empty tenant"),
 ("DATA-03","P2","E-DATA","Retention and deletion jobs (05/08 schedules)",2,"CCR","both","DATA-01",
  "Tests prove each class is deleted on schedule"),
 ("OPS-01","P2","E-OPS","Backup restore drill into a scratch environment",2,"CCR","both","INF-03",
  "Restore completes within RTO; checksum of 5 tables matches"),
 ("OPS-02","P2","E-OPS","Migration rollback policy (expand/contract) and feature flags",1,"CC","both","API-01",
  "Flag toggles per tenant without deploy"),
 ("OPS-03","P2","E-OPS","Load test (k6) at 10x expected peak",1,"CC","both","INF-04",
  "p95 under 500 ms on read endpoints at 10x"),
 ("OPS-06","P2","E-OPS","Incident runbook and tabletop drill",2,"H","both","OBS-02",
  "Drill record with timings and fixes"),
 ("OPS-07","P2","E-OPS","Support console with break-glass access (time-boxed, audited, owner notified)",3,"CCR","both","AUTH-02,AUDT-01",
  "Break-glass session expires after 1 h and the owner gets an email"),
 ("SEC-01","P2","E-SEC","ASVS 5.0 L2 matrix in the compliance tracker with evidence links",2,"CCR","both","",
  "Every L2 requirement mapped to a control, N/A with reason, or a ticket"),
 ("SEC-03","P2","E-SEC","Custom Semgrep rules (no sql.raw, no Number on money, no tenant id from body)",1,"CC","both","CI-02",
  "Seeded violations fail CI"),
 ("SEC-05","P2","E-SEC","CSP, HSTS, security headers, CSP report endpoint",1,"CC","both","INF-02",
  "securityheaders grade A; CSP violations logged"),
 ("SEC-06","P2","E-SEC","Security procedure document and asset inventory (Israeli regs level 'high')",2,"H","both","SEC-01",
  "Document approved by owner; inventory complete"),
 ("LEG-02","P2","E-LEG","US DPA (CCPA 7051 terms), ToS/MSA, privacy notice, sub-processor list",5,"H","both","",
  "Counsel-approved templates; acceptance recorded per version in the app"),
 ("LEG-04","P2","E-LEG","Pilot agreement (scope, no passports, pricing, data terms)",1,"H","both","LEG-02",
  "Signed with the first pilot"),
 ("LEG-05","P2","E-LEG","Claims register and security page (FTC section 5)",1,"H","both","SEC-01",
  "Each public claim links to evidence"),
 ("FE-A11Y","P2","E-FE","axe-core in CI on key screens; keyboard paths; RTL parity",2,"CC","both","FE-05",
  "No serious/critical axe issues on 10 key screens"),
 ("PILOT-01","P2","E-PILOT","First pilot onboarding: import, QBO connect, first invoices reviewed",3,"H","both","IMP-02,QBO-04,LEG-04",
  "Pilot tenant live; first 20 real invoices confirmed"),
 # ---------------- P3
 ("PT-01","P3","E-PT","Pen-test scope, vendor selection and contract",2,"H","both","SEC-01",
  "Signed SOW with retest included"),
 ("PT-02","P3","E-PT","Pentest environment: two seeded tenants, 12 role accounts, OpenAPI handover",2,"CCR","both","PT-01",
  "Tester can log in to every role; data seeded from demo fixtures"),
 ("PT-03","P3","E-PT","Test window (vendor, 2 weeks): support and triage",2,"H","both","PT-02",
  "Critical findings triaged within 24 h"),
 ("PT-04","P3","E-PT","Remediation of findings (buffer)",8,"CCR","both","PT-03",
  "All critical/high fixed; medium planned"),
 ("PT-05","P3","E-PT","Retest and letter",1,"H","both","PT-04",
  "Retest letter with no open critical/high"),
 # ---------------- P4
 ("GA-01","P4","E-GA","SLA, status page, support tooling, onboarding playbook",2,"CCR","both","PT-05",
  "Published SLA and status page; support inbox routed"),
 ("GA-02","P4","E-GA","Onboard pilots 2-3 (imports, connections)",3,"H","both","GA-01",
  "Three paying tenants live"),
 # ---------------- P5 (phase 2)
 ("XERO-01","P5","E-P2","Xero connector (granular scopes, tracking option per trip, credit-note allocation, webhooks) + certification",8,"CCR","both","PT-05",
  "Certified app; Demo Company end-to-end"),
 ("CONN-01","P5","E-P2","Stripe Connect (direct charges, application fee, trust-account payout setting) after counsel advice",15,"CCR","both","PT-05",
  "Counsel letter on file; no platform balance in any flow"),
 ("MAIL-01","P5","E-P2","Inbound bills by email (per-tenant address, DMARC check, quarantine)",6,"CCR","both","EXT-01",
  "Forwarded invoice appears in needs review"),
 ("TRUST-01","P5","E-P2","Trust account reports (deposits held for undeparted trips)",6,"CCR","both","LIVE-06",
  "Report ties to client payments and departures"),
 ("PRI-01","P5","E-P2","Priority connector (PAT, OData, accountant-confirmed forms)",10,"CCR","both","PT-05",
  "Posted to a customer test company and confirmed by its accountant"),
 ("HASH-01","P5","E-P2","Hashavshevet connector (WizCloud API; MOVEIN file fallback)",8,"CCR","both","PT-05",
  "Temporary batch passes chkBatch in a test company"),
 ("SHAAM-01","P5","E-P2","ITA software registration, SHAAM connection, allocation-number issue flow (only if Triplanet issues IL invoices)",10,"CCR","both","LIVE-06",
  "Sandbox allocation numbers obtained; uniform file exported"),
 ("ILREG-01","P5","E-P2","Israel region (il-central-1) cluster and tenant routing",5,"CCR","both","PT-05",
  "Israeli tenant data stays in il-central-1"),
 ("PASS-01","P5","E-P2","Passport fields on (field encryption, access audit, 30-day post-trip deletion)",4,"CCR","both","PT-05,DATA-02",
  "Each passport read writes an audit row"),
 ("AUTO-01","P5","E-P2","Auto-confirm invoices per tenant (opt-in thresholds)",3,"CCR","both","EXT-07",
  "Only invoices meeting all 05-ai.md conditions auto-confirm"),
 ("MAYAW-01","P5","E-P2","Maya proposed actions (draft dispute, move activity) as user-confirmed buttons",4,"CCR","both","AI-05",
  "Model never calls a write endpoint itself"),
]

# phase calendar for the Gantt (start, weeks)
GANTT = [
 ("Decide", [("Code audit","2026-11-16","1w"),("Trial sprint (extraction)","2026-11-23","4w"),("Finance engine package","2026-11-23","4w")]),
 ("Foundations", [("Infra, CI, auth, tenancy, API","2027-01-04","6w"),("Live features rebuild (B)","2027-01-18","6w"),("IITA + ABA shows","2027-01-31","10d")]),
 ("MVP", [("Invoice check + QBO","2027-02-15","8w"),("Maya, studio, import, billing","2027-03-01","7w"),("Legal: DPA, ToS, pilot agreement","2027-02-15","6w"),("First pilot live (no passports)","2027-04-26","1d")]),
 ("Pen test", [("Vendor test window","2027-05-03","2w"),("Remediation","2027-05-17","3w"),("Retest","2027-06-07","2w")]),
 ("GA", [("GA","2027-07-01","1d")]),
 ("Phase 2", [("Xero, inbox, passports, IL region","2027-07-05","10w"),("Connect (after counsel)","2027-08-02","8w")]),
]

WHO_LABEL = {"CC":"Claude Code alone","CCR":"Claude Code + human reviewer","H":"Human only"}

def main():
    ids = {t[0] for t in TICKETS}
    for t in TICKETS:
        for d in [x for x in t[7].split(",") if x]:
            assert d in ids, f"{t[0]} depends on unknown {d}"
    out = []
    w = out.append
    w("# 10 · Roadmap\n")
    w("Generated by `docs/backend-plan/tools/build_roadmap.py` from its ticket table. Edit the table and re-run; do not edit this file by hand.\n")
    w("**Who:** `CC` = Claude Code alone (a human merges after CI) · `CCR` = Claude Code + human reviewer · `H` = human only (accounts, contracts, app reviews, vendors, on-call).\n")
    w("**Estimates** are engineer-days at a Claude-Code-assisted pace [estimate]. Every ticket is sized to fit one Claude Code session or one human working day block, and carries acceptance criteria.\n")
    w("**Variant:** `B` tickets are dropped in variant A (build inside the existing product), subject to the audit report's list of what already exists.\n")
    # totals
    tot = defaultdict(float); totA = defaultdict(float); by_who = defaultdict(lambda: defaultdict(float)); by_epic = OrderedDict()
    for t in TICKETS:
        tid, ph, ep, title, d, who, var = t[:7]
        tot[ph] += d
        if var == "both": totA[ph] += d
        by_who[ph][who] += d
        by_epic.setdefault((ph, ep), 0); by_epic[(ph, ep)] += d
    w("## 1. Totals\n")
    w("| Phase | Engineer-days, variant B | Variant A (B-only tickets dropped) | CC | CCR | H |")
    w("|---|---:|---:|---:|---:|---:|")
    gB = gA = 0
    for ph, name in PHASES.items():
        gB += tot[ph]; gA += totA[ph]
        w(f"| {ph} {name} | {tot[ph]:.0f} | {totA[ph]:.0f} | {by_who[ph]['CC']:.0f} | {by_who[ph]['CCR']:.0f} | {by_who[ph]['H']:.0f} |")
    allwho = defaultdict(float)
    for ph in PHASES:
        for k, v in by_who[ph].items(): allwho[k] += v
    w(f"| **Total** | **{gB:.0f}** | **{gA:.0f}** | **{allwho['CC']:.0f}** | **{allwho['CCR']:.0f}** | **{allwho['H']:.0f}** |\n")
    pilot_B = sum(tot[p] for p in ("P0","P1","P2")); pilot_A = sum(totA[p] for p in ("P0","P1","P2"))
    w(f"To the first paying pilot (P0-P2): **{pilot_B:.0f} engineer-days in variant B, {pilot_A:.0f} in variant A**. Through GA (P0-P4): **{sum(tot[p] for p in ('P0','P1','P2','P3','P4')):.0f}** (B) / **{sum(totA[p] for p in ('P0','P1','P2','P3','P4')):.0f}** (A).\n")
    engB = tot['P1'] + tot['P2'] - by_who['P1']['H'] - by_who['P2']['H']
    engA = totA['P1'] + totA['P2'] - by_who['P1']['H'] - by_who['P2']['H']
    hum = by_who['P1']['H'] + by_who['P2']['H']
    per_eng_week = 4.5
    w("### Capacity check (the plan does not fit two engineers by late April)\n")
    w(f"- P1+P2 need **{engB:.0f} engineering days** in variant B ({engA:.0f} in A), plus {hum:.0f} human-only days (owner, counsel, CPA, vendors), which run in parallel.")
    w(f"- One engineer delivers about {per_eng_week} productive days a week with Claude Code doing most implementation [estimate].")
    w("- The window 4 Jan - 23 Apr 2027 is 16 weeks.\n")
    w("| Team (engineers) | Capacity in 16 weeks | Weeks needed, B | Weeks needed, A | First pilot (B) |")
    w("|---|---:|---:|---:|---|")
    import datetime
    for n in (2, 3):
        cap = n * per_eng_week * 16
        wb = engB / (n * per_eng_week); wa = engA / (n * per_eng_week)
        pilot = datetime.date(2027, 1, 4) + datetime.timedelta(weeks=wb)
        w(f"| {n} | {cap:.0f} | {wb:.1f} | {wa:.1f} | ~{pilot.strftime('%d %b %Y')} |")
    w("")
    w("**Recommendation:** three engineers from January (two senior, one mid-level contractor), each driving Claude Code. That keeps the late-April pilot in variant B. "
      "With two engineers, either accept a pilot in about mid-June (variant B) or reach late April only through variant A, if the audit passes. "
      "A third lever is starting P1 infrastructure on 7 Dec 2026, if the audit already rules out variant A on gates 1-5. That adds about 2 effective weeks before the holidays [estimate].\n")
    w("## 2. Epics and tickets\n")
    for ph, name in PHASES.items():
        w(f"### {ph} · {name}\n")
        w("| ID | Ticket | Days | Who | Var. | Depends on | Acceptance criteria |")
        w("|---|---|---:|---|---|---|---|")
        for t in TICKETS:
            if t[1] != ph: continue
            tid, _, ep, title, d, who, var, deps, ac = t
            w(f"| {tid} | {title} ({ep}) | {d:g} | {who} | {var} | {deps.replace(',', ', ') or '-'} | {ac} |")
        eps = [(ep, v) for (p, ep), v in by_epic.items() if p == ph]
        w("\nEpic totals: " + ", ".join(f"{ep} {v:g}" for ep, v in eps) + f" · phase total {tot[ph]:g}.\n")
    w("## 3. Critical path (Gantt)\n")
    w("```mermaid\ngantt\n  title Triplanet backend: critical path\n  dateFormat YYYY-MM-DD\n  axisFormat %d %b")
    for sec, rows in GANTT:
        w(f"  section {sec}")
        for name, start, dur in rows:
            mil = ":milestone," if dur == "1d" else ":"
            w(f"  {name} {mil} {start}, {dur}")
    w("```\n")
    w("Critical path: audit → decision → foundations (tenancy, auth) → invoice check + QuickBooks → first pilot → pen test → remediation → retest → GA. "
      "The Intuit app assessment (QBO-06) and the pen-test vendor's calendar are the two external dates that can slip it; both are started early.\n")
    w("## 4. What must be ready for IITA (31 Jan - 4 Feb 2027) and ABA (6-9 Feb 2027), and what comes later\n")
    w("| Ready for the shows | Later |")
    w("|---|---|")
    w("| The v7 booth demo, with Live/Pilot/Roadmap labels re-confirmed by the owner (no production backend is shown as live) | The production backend (pilot from late April 2027) |")
    w("| Trial-sprint results on 50+ real invoices: measured accuracy and cost per invoice, quoted only as measured (FTC section 5) | Any accuracy claim beyond the measured set |")
    w("| A one-page security and data overview, the DPA outline, and the sub-processor list (from 07/08) | SOC 2 (only when a deal requires it) |")
    w("| A pilot offer: price, scope (invoice check + QuickBooks + profit leaks), start date late April, no passports | Xero, Priority, Hashavshevet, Connect, inbox, trust reports |")
    w("| Lead capture into a CRM, and 5-10 qualified pilot candidates booked for April onboarding | Self-serve signup |")
    w("")
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(out))
    print(f"wrote {OUT}: B total {gB:.0f}, A total {gA:.0f}, to pilot B {pilot_B:.0f} A {pilot_A:.0f}")
    for ph in PHASES: print(ph, tot[ph], totA[ph], dict(by_who[ph]))

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "10-roadmap.md")
if __name__ == "__main__":
    main()
