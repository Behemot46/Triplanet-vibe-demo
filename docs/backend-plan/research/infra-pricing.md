# Triplanet infra and tooling prices (research, 13 Nov 2026)

Method: web search only (no page fetch). Labels:
- **[verified - URL]**: the price was shown in a snippet of the vendor's own page, docs, changelog or announcement.
- **[unverified - URL]**: only third-party pricing guides or aggregators state it (URL = best source found, usually agreeing across 2+ sites), or the official page was in results but its figure was not visible.
- **[not found]**: no usable figure.
All prices USD, list or on-demand, before tax and discounts. Confirm every [unverified] line on the official URL before the plan is final. Hours/month = 730.

## 1. AWS us-east-1

| Item | Price | Label / source |
|---|---|---|
| RDS PostgreSQL db.t4g.medium Single-AZ | ~$0.065/h (~$47/mo) | [unverified - https://www.bytebase.com/dbcost/rds/instance/db.t4g.medium/ ; official page https://aws.amazon.com/rds/postgresql/pricing/ did not show the figure] |
| RDS PostgreSQL db.t4g.medium Multi-AZ (1 standby) | ~$0.129-0.130/h (~$95/mo) | [unverified - https://sparecores.com/database/aws/db.t4g.medium , https://infratally.com/articles/aws-rds-pricing-explained-2026/] |
| RDS PostgreSQL db.m7g.large Single-AZ | ~$0.168/h (~$123/mo) | [unverified - https://calculator.holori.com/aws/rds/db.m7g.large] |
| RDS PostgreSQL db.m7g.large Multi-AZ | ~$0.337/h (~$246/mo) | [unverified - https://sparecores.com/database/aws/db.m7g.large] |
| RDS gp3 storage | $0.115/GB-mo Single-AZ (3,000 IOPS / 125 MB/s baseline included) | [unverified - https://www.bytebase.com/blog/understanding-aws-rds-pricing.md] |
| RDS gp3 storage Multi-AZ | $0.23/GB-mo (double) per most sources; one source says not doubled. AWS CUR has a separate SKU `USE1-RDS:Multi-AZ-GP3-Storage`, which supports a separate (doubled) rate | [unverified - https://cur.vantage.sh/aws/amazonrds/uge1-rds:multi-az-gp3-storage , https://amnic.com/blogs/aws-rds-pricing]. Model at $0.23. |
| Aurora Serverless v2 (PostgreSQL) | $0.12/ACU-h Standard; $0.156/ACU-h I/O-Optimized | [unverified - https://www.bytebase.com/blog/understanding-aws-aurora-pricing.md (quotes official page); official https://aws.amazon.com/rds/aurora/pricing/ not in results]. Min 0.5 ACU unless scale-to-zero is used = ~$44/mo floor per instance. |
| ECS Fargate Linux/ARM (Graviton) | $0.03238/vCPU-h, $0.00356/GB-h | [unverified - https://www.vantage.sh/blog/fargate-pricing ; official https://aws.amazon.com/fargate/pricing/ in results but figures not shown] |
| ECS Fargate Linux/x86 | $0.04048/vCPU-h, $0.004445/GB-h; 20 GB ephemeral included, extra $0.000111/GB-h; per-second billing, 1-min min | [unverified - same] |
| S3 Standard | $0.023/GB-mo first 50 TB | [unverified - https://upstash.com/blog/aws-s3-pricing-explained-2026 ; official https://aws.amazon.com/s3/pricing/ not in results] |
| KMS customer-managed key | $1/key-mo (prorated hourly); AWS-managed keys free | [unverified - https://cloudburn.io/blog/aws-kms-pricing ; official https://aws.amazon.com/kms/pricing/ in results, figure not visible] |
| KMS requests | $0.03 per 10,000 symmetric requests; 20,000 free/mo; asymmetric higher (RSA GenerateDataKeyPair $0.10/10k, some ops $0.15/10k) | [unverified - same]. Use S3 Bucket Keys to cut KMS calls. |
| Secrets Manager | $0.40/secret-mo; $0.05 per 10,000 API calls; each replica region billed as another secret | [unverified - https://cloudburn.io/blog/aws-secrets-manager-pricing ; official https://aws.amazon.com/secrets-manager/pricing/] |
| CloudWatch Logs ingestion | $0.50/GB Standard (first 10 TB; tiers below are for vended logs); Infrequent Access class 50% less | [unverified - https://www.factualminds.com/blog/amazon-cloudwatch-pricing-metrics-logs-alarms-dashboards/ ; tier table in AWS blog https://aws.amazon.com/blogs/compute/aws-lambda-introduces-tiered-pricing-for-amazon-cloudwatch-logs-and-additional-logging-destinations]. Storage ~$0.03/GB-mo [unverified, from memory, not searched]. |
| WAF | $5.00/web ACL-mo; $1.00/rule-mo; $0.60 per 1M requests; +$0.20/1M per extra 500 WCU over 1,500 | [verified - https://aws.amazon.com/waf/pricing/ (AWS page, CN-language copy shows figures)]. Bot Control $10/ACL-mo + request fee [unverified]. 10M free requests claim [unverified]. |
| NAT gateway | $0.045/h (~$32.85/mo) + $0.045/GB processed | [unverified - https://cloudburn.io/blog/aws-nat-gateway-pricing ; official https://aws.amazon.com/vpc/pricing/]. Per AZ; 2 AZs = 2x. VPC endpoints for S3 (gateway, free) cut NAT GB. |
| ALB | $0.0225/h (~$16.43/mo) + $0.008/LCU-h | [unverified - https://cloudburn.io/blog/aws-elastic-load-balancing-pricing ; official https://aws.amazon.com/elasticloadbalancing/pricing/] |
| Public IPv4 address | $0.005/h each (since Feb 2024) | [unverified - from memory, not searched this session] |

### Indicative AWS baseline (my arithmetic, 1-10 tenants)
| Line | Assumption | $/mo |
|---|---|---|
| RDS t4g.medium Multi-AZ | 730 h x $0.13 | 94.90 |
| RDS gp3 50 GB Multi-AZ | 50 x $0.23 | 11.50 |
| Fargate ARM: 2 API + 1 worker tasks, 0.5 vCPU / 1 GB each | 3 x (0.5x0.03238 + 1x0.00356) x 730 | 43.25 |
| ALB | 16.43 + ~1 LCU avg 5.84 | 22.27 |
| NAT gateway x1 + 20 GB | 32.85 + 0.90 | 33.75 |
| WAF: 1 ACL, 5 rules, 2M req | 5 + 5 + 1.20 | 11.20 |
| KMS 3 keys + Secrets Manager 10 | 3 + 4 | 7.00 |
| CloudWatch Logs 10 GB | 10 x 0.50 | 5.00 |
| S3 50 GB + GuardDuty S3 10 GB / 10k objects | 1.15 + 0.90 + 2.15 | 4.20 |
| **Total** | before backups beyond free, data transfer out, IPv4, support plan | **~$233** |
At 50 tenants a db.m7g.large Multi-AZ (~$246) and 4-6 tasks put the same stack at roughly $450-550/mo.

## 2. PaaS / managed Postgres alternatives

| Vendor | Starter pricing (one line) | Label / source |
|---|---|---|
| Render | Web service Starter $7/mo (0.5 CPU, 512 MB), Standard $25; Postgres Basic-256mb $6, Basic-1gb $19, storage $0.30/GB; Pro workspace ~$25/mo. Note: a plan change on 1 Aug 2026 and a bandwidth cut were reported | [unverified - https://render.com/pricing (not in results); https://www.activepieces.com/blog/render-pricing-2026-free-tier-workers-total-cost.md , https://jwatte.com/blog/render-com-platform-review/] |
| Fly.io | shared-cpu-1x 256 MB $2.19/mo; RAM $6/GB-mo from 1 Oct 2026 (was $5); Managed Postgres Basic (shared-2x, 1 GB) $38/mo, Starter (2 GB) $72/mo, storage $0.28/GB-mo | [verified - https://fly.io/pricing , https://fly.io/pricing-update/] |
| Railway | Hobby $5/mo, Pro $20/mo (fee = included usage); $20/vCPU-mo, $10/GB RAM-mo, $0.05/GB egress, $0.15/GB-mo volume | [verified - https://docs.railway.com/reference/pricing]. Pro per seat vs per workspace: conflicting [unverified]. |
| Neon | Launch: usage only, $0.106/CU-h (1 CU ~ 1 vCPU / 4 GB), storage $0.35/GB-mo; Scale $0.222/CU-h | [unverified - https://www.srvrlss.io/provider/neon/ ; official https://neon.com/pricing not in results] |
| Supabase | Pro $25/org-mo incl. $10 compute credit (= 1 Micro); Micro $10, Small $15 (2 GB); 8 GB DB incl., then $0.125/GB | [verified - https://supabase.com/pricing (compute sizes); rest unverified - https://makerkit.dev/blog/saas/supabase-pricing] |

## 3. Auth providers

| Vendor | Pricing | Label / source |
|---|---|---|
| Clerk Pro | $25/mo ($20 annual), 50,000 monthly retained users included per app (since 5 Feb 2026), then $0.02/MRU | [unverified - https://clerk.com/articles/clerk-pricing-explained (vendor article), https://clerk.com/blog/new-pricing-plans] |
| Clerk Organizations | 100 monthly retained orgs per app included on every plan; orgs > 20 members or org-linked SSO need the **B2B Authentication add-on $100/mo ($85 annual)** | [unverified - https://clerk.com/articles/clerk-pricing-explained , https://supertokens.com/blog/clerk-pricing-the-complete-guide] |
| Clerk SAML/OIDC SSO | 1 enterprise connection included on Pro/Business; connections 2-15 $75/mo each | [unverified - https://clerk.com/articles/auth-platforms-with-sso-and-scim-in-the-base-tier] |
| Clerk MFA | Conflicting: "included in Pro" vs "Enhanced authentication add-on". Directory Sync (SCIM) billed separately from 1 Jan 2027 per pricing page | [unverified - check https://clerk.com/pricing] |
| WorkOS AuthKit | Free to 1M MAU; each further 1M MAU $2,500/mo; includes MFA, passkeys, social | [verified - https://workos.com/pricing] |
| WorkOS SSO / Directory Sync | $125/connection-mo (1-15), $100 (16-30), $80 (31-50), $65 (51-100); 1 connection = 1 enterprise customer; Directory Sync priced the same | [verified for definition, tiers unverified - https://workos.com/pricing , https://ssojet.com/blog/workos-pricing-at-scale-50-100-200-connections] |
| Auth0 B2B Essentials | From $150/mo for 500 MAU; 3 enterprise SSO connections included (Professional $800/mo, 5); extra connections ~$100/mo [unverified] | [verified for $150 / 3 connections - https://auth0.com/pricing (DE copy https://auth0.com/de/pricing.md)] |
| AWS Cognito | Lite $0.0055/MAU after 10k free; Essentials $0.015/MAU after 10k free; Plus $0.02/MAU, no free tier; SAML/OIDC federated: 50 free then $0.015/MAU | [unverified - https://frontegg.com/guides/aws-cognito-pricing (dated 5 Nov 2026); official https://aws.amazon.com/cognito/pricing/] |

Triplanet scale (50 tenants x 20 users = 1,000 users max) fits every free/included allowance; the cost driver is SSO per connection and B2B org add-ons, not MAU.

## 4. Email

| Vendor | Pricing | Label / source |
|---|---|---|
| Postmark | 10k emails/mo: Basic $15 (overage $1.80/1k), Pro $16.50 ($1.30/1k), Platform $18 ($1.20/1k); free 100/mo. **Inbound processing: Pro and Platform only, not Basic** | [unverified - https://postmarkapp.com/pricing (pricing.txt in results), https://www.sendx.io/blog/postmark-pricing ; tier change: https://postmarkapp.com/blog/new-we-made-pro-and-platform-tier-features-accessible-to-lower-volume-email-plans] |
| AWS SES | Outbound $0.10/1,000 (a-la-carte); inbound $0.10/1,000 + $0.09 per 1,000 256 KB chunks; Mail Manager extra. SES added bundled plans (Essentials/Pro/Enterprise) in mid-2026, rates not confirmed | [unverified - https://www.usecarly.com/blog/amazon-ses-pricing/ , https://dev.to/mr_manushukla/amazon-ses-pricing-plans-in-2026-essentials-vs-pro-vs-enterprise-and-when-a-la-carte-still-wins ; official https://aws.amazon.com/ses/pricing/] |
| Resend | Free 3,000/mo [unverified]; Pro $20/mo 50k, overage $0.90/1k in 1k buckets; receiving (inbound) said to be included on all plans | [verified overage example - https://resend.com/changelog/pay-as-you-go-pricing.md ; inbound unverified - https://www.usecarly.com/blog/resend-pricing/] |
| DMARC monitoring | Postmark DMARC weekly digests free, DMARC Digests $14/domain-mo; EasyDMARC free (1k msgs/mo), paid from $35.99/mo annual; Valimail Monitor free; dmarcian free tier non-business only, business $24/$240/$600 per mo | [unverified - https://www.suped.com/compare/best-16-dmarc-alternatives-to-free-dmarc-weekly-digests-by-postmark , https://dmarcreport.com/blog/best-free-dmarc-monitoring-tools-2026-guide-without-budget-approval/] |

## 5. FX rate APIs

| Source | Price | License / terms | Label / source |
|---|---|---|---|
| Open Exchange Rates | Free 1k req/mo (hourly, USD base); Developer $12/mo 10k; Enterprise $47/mo 100k, 30-min; Unlimited $97/mo | Free-plan commercial use: conflicting; paid commercial terms not found in snippets | [verified Enterprise $47 - https://openexchangerates.org/signup ; rest unverified - https://support.openexchangerates.org/article/69-plans-pricing-guide] |
| exchangerate.host | Free 100 req/mo, daily | **Free tier is Non-Commercial Use**; now apilayer, key required | [verified - https://exchangerate.host/pricing] |
| Fixer (apilayer) | Free tier (100 req/mo, EUR base) [unverified]; paid from ~$14.99/mo [unverified] | Free tier reported non-commercial [unverified] | [https://fixer.io/pricing] |
| ECB euro reference rates | Free, daily ~16:00 CET, ~30 currencies (incl. USD, ILS) | ESCB statistics reuse policy: free reuse incl. commercial if source quoted and data not modified. ECB states rates are "for information purposes only" and discourages transaction use | [verified - https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html , https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html] |
| Bank of Israel representative rate | Free | Indicative, "no obligatory status under law" | [verified - https://www.boi.org.il/en/economic-roles/financial-markets/exchange-rates/] |

Fit for Triplanet: locked FX per trip only needs a daily reference rate; ECB (EUR cross) or BoI covers it at $0, OXR Developer $12/mo if hourly or more bases are wanted.

## 6. Maps and routing

| Service | Price | Caching / license | Label / source |
|---|---|---|---|
| Mapbox Directions API | 100,000 req/mo free; then $2.00/1k (100k-500k), $1.60, $1.20 at 1M+ | ToS: "you may not cache, store, or export any map content from the Services" (quoted secondary); persistent storage needs a separate agreement; Search Box results temporary only | [unverified - https://www.mapbox.com/pricing/ (not shown), https://gotime.readthedocs.io/en/stable/pricing.html , https://gotime.readthedocs.io/en/latest/compliance.html ; ToS https://www.mapbox.com/legal/tos] |
| Mapbox Matrix API | 100,000 elements/mo free (origins x destinations); $2.00 / $1.60 / $1.20 per 1k elements | as above | [unverified - same] |
| Google Routes API Compute Routes Essentials | 10,000 free/mo; $5.00/1k first tier | Since 1 Mar 2025: per-SKU free caps replace the $200 credit; Essentials 10k, Pro 5k, Enterprise 1k free; Directions / Distance Matrix are Legacy | [verified - https://developers.google.com/maps/billing-and-pricing/pricing , https://developers.google.com/maps/billing-and-pricing/march-2025] |
| Google Compute Route Matrix | Essentials 10k free, $5.00/$4.00/$3.00/$1.50/$0.38 per 1k elements by tier; Pro 5k free, $10.00/$8.00/$6.00/$3.00/$0.75; Enterprise 1k free, $15.00... (traffic-aware routing is a Pro SKU trigger [unverified]) | Service terms: place IDs may be cached indefinitely; lat/lng may be cached up to 30 consecutive days; other content not stored | [verified - https://developers.google.cn/maps/billing-and-pricing/pricing?hl=en ; terms https://cloud.google.com/maps-platform/terms/maps-service-terms , https://developers.google.com/maps/documentation/routes/policies] |
| openrouteservice (hosted) | Free Standard key: 2,000 directions/day and 500 matrix/day, 40/min each | "free for everyone"; commercial terms unclear; self-host has no limits | [verified - https://openrouteservice.org/restrictions/ , https://openrouteservice.org/plans/] |
| OSRM self-hosted | $0 software (server cost only) | Code BSD-2-Clause; OSM data ODbL 1.0: show "© OpenStreetMap contributors" + link to openstreetmap.org/copyright when used publicly; derived databases share-alike if distributed | [verified - https://wiki.openstreetmap.org/wiki/Osrm , https://osmfoundation.org/wiki/Licence_and_Legal_FAQ , https://www.openstreetmap.org/copyright] |

Note for the studio: the demo computes straight-line km heuristics; storing real drive times per trip is a cache. Under Mapbox/Google ToS that is restricted; OSRM/ORS self-hosted results can be stored (with OSM attribution).

## 7. E-signature APIs

| Vendor | Pricing | Label / source |
|---|---|---|
| Dropbox Sign API | Essentials from $75/mo annual ($900/yr), ~50 req/mo; >500/mo contact sales; Standard (needed for embedded signing) $250-300/mo, conflicting | [verified Essentials - https://sign.dropbox.com/api ; Standard unverified - https://help.dropbox.com/plans/how-much-does-the-dropbox-sign-api-cost] |
| DocuSign eSignature API | Starter ~$50/mo annual (40 envelopes/mo); Intermediate $300/mo (100/mo); Advanced $480/mo; embedded signing needs Enhanced (custom) | [unverified - https://signeasy.com/blog/business/docusign-api-pricing ; official https://www.docusign.com/products/api-pricing not in results] |
| BoldSign API | From $30/mo incl. 40 envelopes, then $0.75/envelope pay-as-you-go | [verified - https://boldsign.com/pricing , https://support.boldsign.com/kb/article/21759/understanding-signature-request-charges-in-boldsign-api] |
| SignWell API | 25 docs/mo free; from $0.85/doc, falling to $0.20 with volume | [verified - https://www.signwell.com/api-pricing/] |

## 8. Malware scanning of uploads

| Option | Pricing | Label / source |
|---|---|---|
| GuardDuty Malware Protection for S3 | us-east-1 $0.09/GB scanned (cut from $0.60 in Feb 2025) + $0.215 per 1,000 objects evaluated; S3 API/tagging billed separately; 12-month free tier (1,000 req + 1 GB/mo [unverified]) | [verified $0.09 - https://aws.amazon.com/about-aws/whats-new/2025/02/amazon-guardduty-malware-protection-s3-price-reduction ; $0.215 unverified - https://cloudburn.io/blog/amazon-guardduty-pricing] |
| ClamAV self-hosted | $0 software (GPLv2; libclamunrar has a restricted license); cost = a Fargate task (~0.5 vCPU / 2 GB ARM ~ $14.40/mo by the rates above) + ~1 GB RAM for signatures. Terms of the Cisco signature mirror (rate limits) not confirmed | [verified license - https://docs.clamav.net/ ; mirror terms not found] |
| Cloudmersive Virus Scan API | 600 free calls/mo, no expiry; paid tiers (Small/Medium Business, Enterprise) price not published in snippets | [verified free tier - https://cloudmersive.com/virus-api ; paid not found] |

Triplanet volume (say 2,000 invoice PDFs/mo at 0.5 MB = 1 GB): GuardDuty ~ $0.09 + $0.43 = ~$0.52/mo. Cheapest by far; no ops.

## 9. Observability

| Vendor | Pricing | Label / source |
|---|---|---|
| Sentry Team | $26/mo annual ($29 monthly), 50k errors/mo included | [unverified - https://www.activepieces.com/blog/sentry-pricing-2026-developer-team-business-plans.md ; official https://sentry.io/pricing/] |
| Better Stack | Free: 10 monitors, 1 status page, 3 GB logs/3 days. Responder license $29/mo annual ($34 monthly); +50 monitors $21-25/mo; extra status page $12-15/mo; logs $0.10/GB ingest + $0.05/GB-mo retention | [verified - https://betterstack.com/pricing (snippets)] |
| Grafana Cloud Free | 10k active metric series, 50 GB logs, 50 GB traces, 50 GB profiles, 3 users, 14-day retention; Pro $19/mo platform fee + usage | [unverified - https://last9.io/blog/grafana-cloud-pricing/ ; official https://grafana.com/pricing/] |
| Datadog | Infra Pro $15/host-mo annual ($18 on-demand); APM $31/host-mo annual ($36), needs Infra on same host; logs $0.10/GB ingest + $1.70/M events indexed (15-day) | [unverified - https://signoz.io/blog/datadog-pricing/ ; official https://www.datadoghq.com/pricing/]. Fargate is billed per task, not host [not checked]. |

## 10. Penetration testing (web app + API, small SaaS)

| Source | Price | Retest | Label / source |
|---|---|---|---|
| Market range (single web app, auth + unauth) | $5,000-15,000 typical; mid-tier vendor $8,000-25,000; multi-role SaaS + API $20,000-50,000 | Varies: often 1 retest within 30-90 days included; else +$1,200-3,000 | [unverified - https://www.synack.com/?p=27316 , https://www.stingrai.io/blog/penetration-testing-cost-2026 , https://www.brightdefense.com/resources/penetration-testing-pricing] |
| Cobalt PtaaS | 1 credit = 8 tester hours; ~$1,800/credit reported; web app 10-20 credits (~$18k-36k); annual credit packages. "Autonomous pentest" $3,500 promo (to 31 Dec 2026) | Retest of findings included in platform [unverified] | [verified credit = 8 h - https://docs.cobalt.io/credits ; price unverified - https://www.synack.com/?p=27342] |
| NetSPI | Fixed-fee per engagement, quote only; directory lists $50k-100k typical (enterprise); NetSPI says a $4k test of a multi-role app is "probably not a true penetration test" | Remediation testing priced per finding count | [verified quote model - https://www.netspi.com/blog/executive-blog/penetration-testing/cost-of-a-penetration-test ; range unverified] |
| AppSec Labs (Israel) | Focused $4,900 (1 web app or API, 1-2 roles); Professional $10,300 (app + API, several roles, business logic) | not stated in snippet | [verified - https://appsec-labs.com/ (llms.txt)] |
| Other published | Stingrai $3,000 per web app + API, $6,800 hybrid | not stated | [verified - https://www.stingrai.io/blog/netspi-alternatives-2026] |
| Israeli NIS prices | not found (Persistsec Hebrew guide in results, no figures) | - | [not found - https://persistsec.com/he/penetration-testing-pricing-israel/] |
Budget suggestion: $8k-15k for a grey-box web + API test with one retest, from a boutique (US or Israel).

## 11. Compliance automation and SOC 2

| Item | Price | Label / source |
|---|---|---|
| Vanta | Quote only; ~$10k/yr entry (Core), $10k-30k typical | [unverified - https://tech-insider.org/vanta-vs-drata-vs-secureframe-2026/] |
| Drata | Quote only; from ~$7,500/yr, typical $10k-35k | [unverified - https://www.trycomp.ai/drata-pricing , https://www.vendr.com/marketplace/Drata] |
| Secureframe | Fundamentals ~$7,500/yr; startup discounts to $5k-7k reported | [unverified - https://trycomp.ai/secureframe-pricing] |
| SOC 2 Type I audit (CPA firm) | $5,000-12,000 security-only small scope; $7,000-25,000 typical; all-in first year (tool + audit + pentest) $25k-50k | [unverified - https://www.brightdefense.com/blog/soc-2-audit-costs/ , https://blog.getagency.com/articles/soc-2-audit-cost-for-startups] |
No vendor publishes a list price; none [verified].

## 12. CI and security scanning

| Item | Price | Label / source |
|---|---|---|
| GitHub Team | $4/user-mo; 3,000 Actions minutes/mo, 2 GB packages | [unverified - https://www.eesel.ai/blog/github-pricing ; minutes per GitHub docs https://docs.github.com/en/get-started/learning-about-github/githubs-plans]. Linux minute $0.006 after Jan 2026 cut [unverified]. |
| GitHub Secret Protection | $19 per active committer-mo (push protection, AI detection); Team plans can buy since 1 Apr 2025 | [verified - https://github.blog/changelog/2025-03-04-introducing-github-secret-protection-and-github-code-security/ , https://github.blog/changelog/2025-04-01-github-advanced-security-is-here-for-github-team-organizations] |
| GitHub Code Security | $30 per active committer-mo (CodeQL, Copilot Autofix, dependency review) | [verified - same]. Free for public repos; Dependabot alerts free. |
| Snyk Free | ~200 open-source (SCA) tests, 100 Code (SAST) tests, 100 container tests per month | [unverified - https://toolradar.com/guides/best-free-security-tools] |
| Socket.dev Free | Free for open-source repos + first private repo | [unverified - https://agentdeals.dev/security-free-tier-comparison-2026] |
| Semgrep | Free up to 10 contributors (Code + Supply Chain); Teams $30/contributor-mo; auto Teams trial when exceeded | [verified free trial rule - https://semgrep.dev/docs/usage-and-billing ; contributor count unverified] |

## 13. USD/ILS (Bank of Israel representative rate)

| Date | Rate (ILS per USD) | Label / source |
|---|---|---|
| 11 Nov 2026 | **3.1720** (+0.35% on the day) | [verified - https://www.boi.org.il/en/economic-roles/financial-markets/exchange-rates/ ("up-to-date as of 11/11")] |
| 12 Nov 2026 05:57 EST | 3.1777 (market quote, not representative rate) | [verified - https://www.bloomberg.com/quote/USDILS:CUR] |
| 4 Nov 2026 | 3.157 | [unverified - https://www.ynetnews.com/business/article/r10ydkk6ze] |
| 17 Aug 2026 | 2.95 | [unverified - Globes, https://en.globes.co.il/en/article-1001552533] |
Range in 2026: ~2.8 (Q2 low) to ~3.18. Suggest modelling at 3.17 with a +/-10% sensitivity. BoI next rate decision: 23 Nov 2026.

## Gaps and cautions
- Official AWS pricing pages are rendered dynamically and their figures did not appear in snippets; AWS numbers are consistent across 2+ secondary sources but must be checked in the AWS Pricing Calculator.
- Not found: Cloudmersive paid prices, ClamAV signature-mirror terms, NIS pen-test prices, ECB terms specific to exchange-rate data (general ESCB reuse policy applies), commercial terms of OXR paid plans.
- Conflicts to resolve on vendor pages: RDS Multi-AZ storage doubling; Clerk MFA inclusion and SCIM billing from 2027; Dropbox Sign Standard API ($250 vs $300); Railway Pro per seat vs per workspace; Matrix free tier in requests vs elements (Mapbox).
