# 09 · Operations and cost model

## 1. Hosting and regions

- **US tenants:** AWS us-east-1 (N. Virginia). ECS Fargate, RDS Postgres 16 Multi-AZ, S3, KMS, CloudFront and WAF (`01-architecture.md` §4).
- **Israeli tenants** (only if `11-open-questions.md` Q2 = yes): AWS il-central-1 (Tel Aviv).
  - Live since Aug 2023 with 3 AZs [verified - aws.amazon.com/blogs/aws/now-open-aws-israel-tel-aviv-region].
  - RDS PostgreSQL, ECS/Fargate, S3, KMS, Secrets Manager and WAF are available there; SES and Cognito are unconfirmed [verified/unverified - Israel research notes]. Neither is needed: email is Postmark and auth is WorkOS.
  - Same Terraform module, separate cluster; `tenant.data_region` routes requests.
  - Claude inference does not run in Israel (Bedrock il-central-1 is global routing only) [verified - platform.claude.com Bedrock page]. The DPA covers that transfer (`08-compliance.md` IL-11).
- **Static egress IPs** (NAT Elastic IPs) are published to customers whose on-premise ERPs (Priority) need an allow-list.

## 2. Environments

| Env | Purpose | Data | Deploy |
|---|---|---|---|
| `dev` | each engineer's local Docker Compose (Postgres, MinIO, a fake IdP) | seed fixtures (the demo's 20 trips) | – |
| `preview-<PR>` | ephemeral per pull request (CI-03): API + SPA + a schema-per-PR on a shared staging RDS | seed fixtures | on PR open; destroyed on merge or close |
| `staging` | integration with vendor sandboxes (QBO sandbox, Xero Demo Company, Stripe test, Postmark test server) | seed + synthetic | every merge to `main` |
| `pentest` | isolated AWS account, same Terraform as prod | 2 seeded tenants (`07` §7) | on demand |
| `prod-us` | customers | real | signed tag, manual approval |
| `prod-il` | Israeli tenants (phase 2) | real | same tag as prod-us |

**No production data in lower environments, ever.** Support reproduces issues with an anonymised extract job (phase 2) [estimate].

## 3. CI/CD

- **Pipeline:**
  1. PR: lint, typecheck and tests (finance property tests, cross-tenant suite, RLS coverage), scanners (`07` §6), OpenAPI diff, Schemathesis, preview environment.
  2. Merge: build, SBOM, cosign sign, deploy to staging, smoke tests.
  3. Tag: deploy to prod with manual approval, signature verification and blue/green, then post-deploy smoke tests and automatic rollback on failure.
- **Database migrations: expand/contract.**
  - Every migration is backward compatible with the previous app version: add columns nullable, backfill in a job, switch reads, drop in a later release.
  - "Rollback" means redeploying the previous app version. Down-migrations are written but used only in staging.
  - Destructive steps need a reviewer and a fresh snapshot taken first.
- **Feature flags:** per-tenant flags in Postgres (`tenant_feature`), cached for 30 s, with no vendor needed at this size. Used for:
  - Pilot features per tenant;
  - auto-confirm;
  - Xero;
  - passports.

## 4. Backups, RPO/RTO

| Item | Target | How |
|---|---|---|
| **RPO** (data loss) | ≤ 5 minutes | RDS point-in-time recovery (continuous WAL) + Multi-AZ synchronous standby |
| **RTO** (downtime) | ≤ 4 hours for a full-region failure of a single AZ; ≤ 1 minute or so for an AZ failover (Multi-AZ) [estimate] | Multi-AZ automatic failover; runbook for PITR restore |
| Backup retention | 35 days PITR; monthly snapshot copied to a second region, kept 12 months | RDS automated backups + AWS Backup cross-region copy |
| S3 | versioning + 30-day noncurrent retention; replication to a second region for invoice files | S3 replication |
| **Restore test** | quarterly, timed, into a scratch account; checksum on 5 key tables (OPS-01) | drill record |
| Crypto-shredding | tenant DEKs destroyed at deletion (`07` §4) | – |

## 5. Monitoring, uptime, status, support

- **Monitoring tools:**
  - Sentry: errors (Team $26/month [unverified]).
  - Better Stack: uptime checks every 30 s on `/healthz`, the login flow and an API canary; status page; logs at $0.10/GB [verified - betterstack.com/pricing].
  - CloudWatch: infrastructure.
- **SLOs** (pilot; published at GA):

  | Measure | Target |
  |---|---|
  | API availability | 99.5% monthly |
  | p95 latency, read endpoints | < 500 ms |
  | Invoice extraction p95 | < 60 s |
  | Accounting sync lag p95 | < 15 min |

- **On-call:** pilot phase is business hours (Israel + US Central overlap), best effort. At GA, a 2-person rotation with Better Stack on-call. This is human-only.
- **Support tooling:**
  - shared inbox (Help Scout or similar, phase 2);
  - in-app "report a problem", which attaches the `request_id`;
  - the support console with break-glass (OPS-07).
- **Status page:** `status.triplanet.io` (Better Stack), with incident posts linked from the app banner.

## 6. Monthly running cost

**Assumptions:**

- USD/ILS **3.17**: the Bank of Israel representative rate was 3.1720 on 11 Nov 2026 [verified - https://www.boi.org.il/en/economic-roles/financial-markets/exchange-rates/]; ±10% sensitivity.
- AWS prices: Fargate ARM $0.03238/vCPU-h and $0.00356/GB-h; RDS t4g.medium Multi-AZ about $0.13/h and m7g.large Multi-AZ about $0.337/h; gp3 Multi-AZ $0.23/GB-month; ALB $0.0225/h + $0.008/LCU-h; NAT $0.045/h + $0.045/GB [unverified - third-party sites, research notes]; WAF $5/ACL + $1/rule + $0.60/M requests [verified - aws.amazon.com/waf/pricing].
- Per tenant: 50 invoices/month and 180 Maya questions/month (3 active users × 60) [estimate]. LLM unit costs from `05-ai.md` §1.3 and §3.4.
- Price to the customer for the margin check: **$600/tenant/month**, the middle of the strategy deck's $400-800 target [estimate - owner decision].
- 730 hours a month.

All figures are USD per month.

| Item | 1 tenant | 10 tenants | 50 tenants |
|---|---:|---:|---:|
| RDS Postgres prod Multi-AZ (t4g.medium; m7g.large at 50) | 95 | 95 | 246 |
| RDS storage gp3 Multi-AZ (50 / 100 / 200 GB) | 12 | 23 | 46 |
| RDS staging (single-AZ t4g.small, ~$0.032/h) | 23 | 23 | 23 |
| Fargate prod API (2×0.5 vCPU/1 GB; 3×1 vCPU/2 GB at 50) | 29 | 29 | 87 |
| Fargate prod workers | 14 | 29 | 58 |
| Fargate OSRM routing (1 vCPU/4 GB) | 34 | 34 | 34 |
| Fargate staging + preview environments | 43 | 43 | 58 |
| ALB × 2 environments | 45 | 45 | 56 |
| NAT gateway × 2 environments | 67 | 69 | 76 |
| WAF | 11 | 11 | 16 |
| S3 + GuardDuty malware scan | 3 | 5 | 15 |
| KMS, Secrets Manager, CloudWatch, CloudTrail, backups | 20 | 30 | 60 |
| **Cloud subtotal** | **395** | **436** | **774** |
| Invoice extraction (Opus 5.5, $0.046/invoice) | 2 | 23 | 115 |
| Maya (Opus 5.5, $0.061/question) | 11 | 110 | 549 |
| Evaluation runs | 15 | 20 | 30 |
| **LLM subtotal** | **28** | **153** | **694** |
| Postmark Pro (≈50k emails at 50 tenants) | 16 | 16 | 68 |
| FX (ECB/BoI, free); OSM routing (in Fargate above) | 0 | 0 | 0 |
| **Email/maps/FX subtotal** | **16** | **16** | **68** |
| WorkOS AuthKit (free to 1M MAU) | 0 | 0 | 0 |
| Better Stack (on-call + logs) | 32 | 34 | 68 |
| Sentry Team | 26 | 26 | 26 |
| GitHub Team (4 users); Semgrep/Socket free tiers | 16 | 16 | 16 |
| Intuit App Partner (Builder free → Silver $300 at about 30 tenants) | 0 | 0 | 300 |
| Xero developer Core (AUD 35 ≈ USD 23; phase 2) | 0 | 23 | 23 |
| Domain and DNS | 3 | 3 | 3 |
| **Tools subtotal (excl. Stripe)** | **77** | **102** | **436** |
| **Total running cost (excl. Stripe)** | **516** | **707** | **1,972** |
| **Total in ₪** | **₪1,636** | **₪2,241** | **₪6,251** |
| Per tenant | $516 | $71 | $39 |
| Stripe Billing 0.7% + card ~2.9% + 30¢ (revenue-linked) | 22 | 219 | 1,095 |
| **Total incl. Stripe** | **538** | **926** | **3,067** |
| Revenue at $600/tenant | 600 | 6,000 | 30,000 |
| Gross margin on running cost | 10% | 85% | 90% |

**Re-added:**

- Cloud: 95+12+23+29+14+34+43+45+67+11+3+20 = 396. The computed value is 395.4, shown rounded per line. The same applies to 436 and 774.
- Totals were computed from unrounded lines by a script: 1 tenant 516.3 + Stripe 21.9 = 538 ✓; 10 tenants 707 + 219 = 926 ✓; 50 tenants 1,972 + 1,095 = 3,067 ✓.
- ₪ = USD × 3.17: 516 × 3.17 = 1,636 ✓; 707 × 3.17 = 2,241 ✓; 1,972 × 3.17 = 6,251 ✓.

[estimate — all rows]

**Reading the table:**

- At 1 tenant the fixed platform (Multi-AZ database, two environments, NAT) dominates. That is the price of being pen-test- and SOC-2-ready from day 1.
- At 50 tenants the largest variable line is **Maya** (about $550). The per-tenant budget cap (`05-ai.md` §3.4) bounds it: at the $25 default cap, the worst case is 50 × $25 = $1,250.
- **People are not in this table.** At pilot stage, people dominate the cost: one engineer-month costs more than the whole 50-tenant platform.

## 7. Build cost to GA (one-off)

**Assumptions:**

- Engineering days from `10-roadmap.md`, P0-P4, excluding human-only (H) tickets. Variant B: 291 total − 34 H = **257**. Variant A: 246 − 34 = **212**.
- Day rate $600-900 (≈ ₪1,900-2,850) for a senior contractor in Israel, or a blended in-house cost [estimate].

| Item | Low (USD) | High (USD) | Basis |
|---|---:|---:|---|
| Engineering, variant B: 257 days × $600 / × $900 | 154,200 | 231,300 | [estimate] |
| Pen test + retest | 10,000 | 15,000 | `07` §7 [estimate; AppSec Labs Professional $10,300 verified] |
| Counsel: ToS/MSA, US DPA, privacy notice, Israeli DPA, Xero AI-terms and Seller of Travel opinions | 15,000 | 30,000 | [estimate] |
| CPA: sales-tax nexus, Israeli VAT opinion | 3,000 | 6,000 | [estimate] |
| Fractional security lead (vCISO), 7 months × $2,000 | 14,000 | 14,000 | [estimate] |
| External DPO (only if Israel in scope), 0-6 months | 0 | 6,000 | [estimate] |
| Claude Code / API usage for engineers, 3 seats × 8 months | 4,800 | 4,800 | about $200 per seat per month [unverified] |
| Running cost during the build (staging, sandboxes), 8 months | 4,000 | 4,000 | §6, staging-only share [estimate] |
| **Total, variant B** | **205,000** | **311,100** | |
| **Total, variant B (₪, × 3.17)** | **₪649,850** | **₪986,187** | |
| Engineering, variant A: 212 days × $600 / × $900 | 127,200 | 190,800 | |
| Other items (same as B) | 50,800 | 79,800 | |
| **Total, variant A** | **178,000** | **270,600** | |
| **Total, variant A (₪)** | **₪564,260** | **₪857,802** | |

**Re-added:**

- B low: 154,200 + 10,000 + 15,000 + 3,000 + 14,000 + 0 + 4,800 + 4,000 = 205,000 ✓
- B high: 231,300 + 15,000 + 30,000 + 6,000 + 14,000 + 6,000 + 4,800 + 4,000 = 311,100 ✓
- A: other items low 50,800 (= 205,000 − 154,200) and high 79,800 (= 311,100 − 231,300) ✓

**Not included:**

- the owner's own time;
- sales and marketing, including the two shows;
- insurance (cyber/E&O, about $2-5k a year [estimate]);
- SOC 2 (`08` §8: $20-60k if triggered);
- phase 2 (P5: 79 engineering days ≈ $47-71k).
