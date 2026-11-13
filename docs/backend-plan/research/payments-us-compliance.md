# Payments, tax and US compliance research for Triplanet (as of 13 Nov 2026)

Scope: US-market multi-tenant SaaS for group tour operators (3-20 agents), secondary market Israel. Triplanet bills its own subscriptions; phase 2 may let operators collect traveller payments.

## How to read the labels
- **[verified - URL]**: a web-search result from that URL states the fact. Only search results were available (no page fetch), so "verified" means the source states it in the indexed text, not that I read the full page. Official sources (stripe.com, ftc.gov, state .gov sites, eur-lex, edpb) are named where possible.
- **[unverified]**: from secondary or vendor sources only, conflicting sources, or my own background knowledge. Confirm before relying on it.
- This is research for planning, not legal or tax advice. Items marked "counsel" need a lawyer or CPA.

---

## A. Stripe Billing (Triplanet's own subscriptions)

| Fact | Label |
|---|---|
| Pay-as-you-go price: 0.7% of Billing volume, no monthly fee, on top of standard Stripe payment processing fees. | [verified - https://stripe.com/en-us/billing/pricing] |
| The older Starter (0.5%) and Scale (0.8%) tiers were folded into a single 0.7% rate in 2024. | [unverified - third-party: https://www.withorb.com/blog/stripe-billing-pricing] |
| Monthly contract plans reportedly start at $620/month for up to $100k of monthly Billing volume (1-year contract). Higher tiers of $1,500 and $2,950 are also reported. | [unverified - aggregators: https://erpresearch.com/erp-add-ons/billing-subscriptions/stripe-billing/pricing, https://flexprice.io/blog/stripe-pricing-breakdown-2026] |
| Advanced usage-based billing was moved into Metronome (a Stripe product) in July 2026. One tracker says Metronome charges 0.8% above a $100k allotment. Not relevant to per-seat pricing. | [unverified - https://usagepricing.com/blueprint/activity/stripe-billing-2026-07-22-packaging] |
| Per-seat pricing: seats map to subscription `quantity`, which is set when the subscription is created. Mid-cycle seat changes are prorated. | [verified - https://docs.stripe.com/subscriptions/pricing-models/per-seat-pricing, https://docs.stripe.com/billing/subscriptions/quantities] |
| Trials: `trial_period_days` on a subscription or Checkout. `payment_method_collection=if_required` allows a trial with no card. `trial_settings.end_behavior.missing_payment_method` can be `cancel`, `pause` or `create_invoice`. Trial offers and free-trial periods can't be combined. | [verified - https://docs.stripe.com/payments/checkout/free-trials, https://docs.stripe.com/billing/subscriptions/trials, https://docs.stripe.com/billing/subscriptions/trials/compare] |
| Smart Retries: the retry policy is "N tries within" a window of 1 week, 2 weeks, 3 weeks, 1 month or 2 months. The recommended default is **8 tries within 2 weeks**. A custom schedule allows up to 3 retries. Set it in Dashboard > Billing > Revenue recovery > Retries. | [verified - https://docs.stripe.com/billing/revenue-recovery/smart-retries] |
| Revenue recovery also includes customer emails for failed payments and expiring cards, plus recovery analytics. | [verified (general) - https://docs.stripe.com/billing/revenue-recovery] |
| Customer portal: a Stripe-hosted page. Customers can update payment methods and billing info (including tax IDs), view invoices, and cancel. Plan switching is configurable and **off by default**. Prorations apply. Deep links ("portal flows") go to specific actions. | [verified - https://docs.stripe.com/customer-management, https://docs.stripe.com/customer-management/configure-portal] |
| Customers lowering the seat quantity themselves in the portal. | [unverified - only a third-party doc says this; check the portal configuration] |

**Planning note:** at 3-20 agents (low ARPA), pay-as-you-go 0.7% plus card fees is simpler than a contract plan. Add Stripe Tax at 0.5% (section B) only if Triplanet registers in states that tax SaaS.

---

## B. Stripe Tax and US sales tax on SaaS

### Stripe Tax pricing
| Fact | Label |
|---|---|
| No-code integration (Billing, Checkout, Invoicing, Payment Links), pay-as-you-go: **0.5% of volume processed in jurisdictions where you are registered to collect**. The volume includes the tax itself. | [verified - https://support.stripe.com/questions/understanding-stripe-tax-pricing, https://support.stripe.com/questions/understanding-stripe-tax-pay-as-you-go-pricing] |
| API integration: $0.50 per transaction, including 10 calculation calls, then $0.05 per extra call. | [partly verified: the $0.50 appears on the Stripe pricing page per search summary. The 10-call and $0.05 detail is unverified (third party)] |
| "Tax Complete" subscription from $90/month (1-year contract), covering filing. | [unverified - third-party blog] |
| Stripe Tax monitors thresholds and calculates and collects tax. Registration and filing are separate (Tax Complete or a partner). | [unverified - background knowledge] |

### Which states tax SaaS (sales to US tour operators, i.e. B2B)
Counts differ by source. One guide says 22 states plus DC tax SaaS fully or partly (Sep 2026). Others say 24 or 26. [unverified - https://taxcloud.com/blog/saas-sales-tax-by-state/, https://www.anrok.com/saas-sales-tax-by-state]

| State | Treatment | Label |
|---|---|---|
| **Texas** | Taxed as a "data processing service". 20% of the charge is exempt, so **80% is taxable** (Tax Code §151.351). State rate 6.25% plus up to 2% local, an effective maximum of about 6.6%. Comptroller letter rulings go back to 1999. | [verified - Comptroller rulings summarized at https://ezel.ai/tax-rulings/tx/9909732l-information-data-processing-services-20-is-exempt-only-80-is-taxable, https://ezel.ai/tax-rulings/tx/201705045l-combined-services-twenty-percent-20-exemption-for-data-processing-is. Rates per https://stripe.com/resources/more/are-services-taxable-in-texas] |
| **New York** | Taxable as prewritten software (remote access is treated as a license). 4% state rate plus local. Taxed by user location. | [unverified - secondary (https://stripe.com/resources/more/software-sales-tax-for-saas-companies); primary is NY TB-ST-128] |
| **Washington** | SaaS ("remote access software", a digital product) is subject to retail sales tax, 6.5% state rate plus local, and retailing B&O. ESSB 5814 (from 1 Oct 2025) also taxes IT services, custom software and customization, and removed several DAS exclusions. SB 6346 reportedly passed to repeal most of 5814's expansion from 1 Jan 2029. Its signing status is not confirmed. | [verified - https://www.arts.wa.gov/wp-content/uploads/2025/08/2025-ARTS-5814-Notice-for-impacted-industries.pdf (5814 scope), https://taxnews.ey.com/news/2025-1822. The SB 6346 status is unverified] |
| **Pennsylvania** | Taxable at 6% (treated as canned software) when the user is in PA. | [unverified - secondary. Primary is PA SUT-12-001] |
| **Ohio** | Taxable **only for business use** (automatic data processing or electronic information services). 5.75% state rate plus county. Because Triplanet's buyers are businesses, this matters. | [unverified - secondary (https://stripe.com/resources/more/software-sales-tax-for-saas-companies). Primary is ORC 5739.01] |
| **Connecticut** | Business use is taxed at a reduced **1%** rate. Personal use is taxed at the full rate. | [unverified - secondary (https://www.fonoa.com/resources/blog/sales-tax-on-saas)] |
| **Iowa** | Taxable by default. Exempt when sold to a commercial enterprise for exclusively business use. | [unverified - secondary] |
| **Massachusetts** | Taxable (prewritten software), 6.25%. | [unverified - secondary] |
| **Utah** | SB 162 codified seller-hosted SaaS as taxable prewritten software from 1 Jul 2026. | [unverified - https://www.eidebailly.com/insights/blogs/2026/10/salt20261015 (search summary)] |
| **California, Colorado** | Reported to start taxing SaaS on **1 Jan 2027** (California SB 122, signed June 2026). This would be a major change if accurate. | [unverified - https://www.bdo.global/en-gb/insights/tax/indirect-tax/united-states-expansion-of-sales-tax-to-digital-products-what-businesses-should-do-before-2027, https://www.vatcalc.com/?p=52212. **Confirm with the CDTFA and Colorado DOR before acting.**] |
| **Oklahoma** (Tulsa customer base) | **Not taxable.** 68 O.S. §1357(32) exempts electronically delivered software. OTC Letter Ruling **LR-26-012 (8 Sep 2026)** treated subscription charges for a hosted web platform, plus related training and support, as exempt. A letter ruling binds only its own facts. Oklahoma economic nexus is $100k. | [verified (secondary summary of the OTC ruling) - https://www.salestaxinstitute.com/resources/oklahoma-saas-sales-tax-ruling, https://www.vatupdate.com/2026/09/21/oklahoma-letter-ruling-treats-hosted-saas-and-related-services-as-exempt/. The OTC primary text was not reached] |

Other states (e.g. AL, AZ municipal, DC, HI, NM, RI, SC, SD, TN, WV) also tax SaaS in some form. [unverified - background knowledge. Not checked in this pass]

### Economic nexus thresholds
| Fact | Label |
|---|---|
| The typical test is $100,000 in sales and/or 200 transactions in the current or prior year. Some states use higher amounts (e.g. TX, CA and NY at $500k, with NY also requiring 100 transactions). | [unverified for specific amounts - background knowledge. TX $500k appears in vendor sources] |
| States that have **dropped the 200-transaction test** (Avalara, 21 Apr 2026): AK, CA, CO, IL, IN, IA, LA, ME, MA, NC, ND, SD, UT, WA, WI, WY. **Kentucky** joined on 1 Aug 2026 (HB 757). Recent dates: AK 1 Jan 2025, UT 1 Jul 2025, IL 1 Jan 2026 (HB 2755). | [verified - https://www.avalara.com/us/en/blog/2025/06/states-eliminating-economic-nexus-transaction-thresholds, https://www.vatcalc.com/united-states/us-illinois-end-transaction-nexus-threshold-sales-tax-2026/] |
| States that still use $100k **or** 200 transactions include AR, GA, HI, MD, MI, MN, NE, NV, NJ, OH, RI, VT, VA, DC, WV. Connecticut uses $100k **and** 200 transactions. | [verified - same Avalara source] |

**Planning implication:** at 3-20-seat ARPA, Triplanet is unlikely to cross $100k of sales into most single states early on. Texas (taxable SaaS, $500k threshold) is the nearest risk outside Oklahoma. Use Stripe Tax monitoring before registering. A physical presence (staff or office) creates nexus regardless of thresholds. [unverified - background knowledge]

### Israel VAT (only if the selling entity is Israeli)
| Fact | Label |
|---|---|
| Section 30(a)(5) of the VAT Law zero-rates services supplied to a **foreign resident**. Exceptions: services that concern an Israeli asset, or that are also provided to an Israeli resident in Israel. Courts read the exceptions strictly, so contract design matters. | [verified - Israeli law firm commentary: https://www.ampeli-tax.com/post/the-entitlement-of-zero-vat, https://www.ampeli-tax.com/post/third-condition-for-zero-vat, https://herzoglaw.co.il/en/news-and-insights/vat-precedent-ruling/] |
| Whether SaaS sold by an Israeli company to US tour operators (with no Israeli end users) qualifies for 0%. | [unverified - very likely, but no SaaS-specific ITA source found. Get an Israeli VAT opinion. Sales to Israeli operators are standard-rated] |
| Israel's standard VAT rate is 18% (from 1 Jan 2025). | [unverified - background knowledge] |

---

## C. Stripe Connect (phase 2: operators collect traveller payments)

### Account models
| Fact | Label |
|---|---|
| Stripe now **recommends controller properties instead of account types** (Standard, Express, Custom). The properties are `controller.fees.payer`, `controller.losses.payments`, `controller.requirement_collection` and `controller.stripe_dashboard.type`. Migration is optional and backward compatible. Existing accounts get the mapped properties automatically. An account's type can't be changed after creation. | [verified - https://docs.stripe.com/connect/migrate-to-controller-properties, https://docs.stripe.com/connect/accounts] |
| The Standard equivalent is `losses.payments=stripe`, `fees.payer=account`, `requirement_collection=stripe` and a full Dashboard. The Express equivalent is losses and fees on `application`, `requirement_collection=stripe` and the Express dashboard. The Custom equivalent is `requirement_collection=application`. | [verified - https://docs.stripe.com/connect/migrate-to-controller-properties] |
| There is a newer Accounts v2 API, with a guide for SaaS platforms combining Billing and Connect. | [verified (existence) - https://docs.stripe.com/connect/accounts-v2/integrate-billing-connect] |

### Merchant of record and funds flow
| Fact | Label |
|---|---|
| **Direct charges** make the **connected account (the tour operator) the merchant of record**. The operator handles refunds and disputes, and disputed amounts are debited from the connected account's balance, not the platform's. Stripe says SaaS platforms typically use direct charges. | [verified - https://docs.stripe.com/connect/merchant-of-record, https://docs.stripe.com/connect/charges] |
| With destination charges or `on_behalf_of`, if a connected account's balance goes negative, **the platform is ultimately responsible**. | [verified - https://docs.stripe.com/connect/merchant-of-record] |
| Platform fee: pass `application_fee_amount` on a direct charge, which must be positive and less than the charge. Example: on a $10 charge with a $2 fee, $2 goes to the platform and $8 nets to the connected account. Application fees also work on Connect invoices. PaymentIntents and Charges live on the connected account. | [verified - https://docs.stripe.com/connect/direct-charges, https://docs.stripe.com/connect/saas/tasks/app-fees, https://docs.stripe.com/connect/invoices] |
| Stripe's Connect marketing says platforms can rely on Stripe's money transmitter and e-money licenses instead of obtaining their own. | [verified (vendor claim) - https://stripe.com/connect] |

### Connect pricing (US)
| Fact | Label |
|---|---|
| **If Stripe handles pricing** (the connected account pays Stripe directly, Standard-like), there is no extra Connect fee for the platform. | [verified - https://stripe.com/connect/pricing] |
| **If the platform handles pricing**: **$2 per monthly active account** plus **0.25% + 25¢ per payout**. An account counts as active in a month when a payout is sent to it. | [verified - https://stripe.com/connect/pricing. The definition of "active" comes from a third-party review] |
| Instant Payouts cost 1% of payout volume. | [verified per search summary of Stripe pricing - https://stripe.com/connect/pricing] |

### Money-transmitter exposure
| Fact | Label |
|---|---|
| FinCEN's **payment processor exemption** (31 CFR 1010.100(ff)(5)(ii)(B); formerly 103.11(uu)(5)(ii)) has four conditions. (1) The service facilitates the purchase of goods or services, or payment of bills for them, not person-to-person transfers. (2) It operates through clearing and settlement systems that admit only BSA-regulated financial institutions. (3) It provides the service under a formal agreement. (4) The agreement is at minimum with the seller or creditor that provided the goods or services and receives the funds. | [verified (conditions 1-2 and the agreement element) - https://www.fincen.gov/sites/default/files/administrative_ruling/FIN-2014-R009.pdf, https://www.fincen.gov/sites/default/files/administrative_ruling/fin-2009-r004.pdf. The exact wording of condition 4 is from background knowledge and unverified] |
| States run separate money-transmission regimes. About 22 states allow an "agent of the payee" exemption, and about 3 more decide case by case. California's version needs a prior written contract, and delivery to the agent must satisfy the payor's obligation. California DFPI has issued an opinion that a payment processor was not exempt. | [verified - https://moderntreasury.com/learn/what-is-an-agent-of-the-payee-exemption, https://dfpi.ca.gov/rules-enforcement/laws-and-regulations/opinion-letters-by-law-subject/opinion-letter-payment-processing-service-not-exempt-as-agent-of-payee-or-factoring] |
| **Design conclusion:** the lowest exposure is **direct charges, with funds settling directly to the operator's own Stripe account and only an application fee to Triplanet**. Triplanet then never receives, holds or transmits traveller funds. Avoid separate charges and transfers and destination charges, where the platform balance sits in the flow. | [unverified - analysis. Confirm with payments counsel] |

### PCI DSS
| Fact | Label |
|---|---|
| Stripe Checkout, Elements (card fields in a Stripe-hosted iframe) and the mobile SDKs qualify a merchant for **SAQ A**. Stripe.js v2 with a self-hosted form means SAQ A-EP. | [verified - https://support.stripe.com/questions/pci-faq, https://stripe.com/guides/pci-compliance] |
| PCI SSC published **SAQ A for v4.0.1 (r1) on 30 Jan 2025**. It **removed requirements 6.4.3 and 11.6.1** (and the related 12.3.1) from SAQ A. In their place is a **new eligibility criterion**: the merchant confirms its site is **not susceptible to attacks from scripts that could affect its e-commerce system(s)**. Unlike 6.4.3 and 11.6.1, which apply only to payment pages, this criterion applies to the whole site. It took effect with v4.0.1's future-dated requirements on 31 Mar 2025. | [verified - https://www.akamai.com/blog/security/pci-dss-v4-0-1-changes-qualify-saq-a, https://docs.adyen.com/development-resources/pci-dss-compliance-guide/saq-a-eligibility, https://jscrambler.com/blog/saq-a-new-eligibility-criteria/] |
| 6.4.3 and 11.6.1 still apply to SAQ D merchants, onsite assessments and service providers. | [verified - Adyen and Akamai, same URLs] |
| Stripe now asks users to attest that they have deployed a CSP. Self-hosting Stripe.js can break SAQ A eligibility. | [verified (third party reporting on Stripe) - https://blog.report-uri.com/stripe-now-asks-you-to-attest-that-youve-deployed-a-csp/] |
| **Note:** in phase 2 the **operator** (connected account) is the merchant. Triplanet, as the platform that hosts the payment page, still needs to keep script integrity on pages that embed Elements or redirect to Checkout: a strict CSP, SRI, and no third-party scripts on payment flows. Whether Triplanet is itself a "service provider" under PCI depends on whether it can affect the security of cardholder data. | [unverified - analysis. Confirm with a QSA] |

---

## D. Seller of Travel laws

| State | Key rules | Label |
|---|---|---|
| **California** (B&P §17550 et seq.) | A "seller of travel" is anyone who sells, provides, furnishes, contracts for, arranges or advertises air or sea transportation (alone or in a package), at wholesale or retail. This covers anyone selling **to California residents** or from a California office, wherever located. Registration is with the Attorney General, and the registration number must appear on all ads. **Trust account**: 100% of customer funds go into a trust account at a federally insured institution (§17550.15). Alternatives are a bond, a Consumer Protection Deposit Plan or a Consumer Protection Escrow Plan. §17550.16 lists exemptions (e.g. sellers that forward all funds to a registered seller's trust account). **Travel Consumer Restitution Fund (TCRC)**: only in-state sellers participate; out-of-state sellers can't join and must disclose that they are not participants. Selling only hotels or resorts, without air or sea, falls outside the definition. | [verified - https://www.oag.ca.gov/travel/reg-faqs, https://oag.ca.gov/travel/statute, https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-2-6/section-17550-15 (2024 code). The air/sea-only scope and out-of-state TCRC points come from https://travellaw.com/seller-of-travel-registration/california-seller-of-travel-registration/ and Travel Weekly. Fees ($100 SOT, $275 TCRC) are unverified] |
| **Florida** (Ch. 559 Part XI, FDACS) | Registration with FDACS. Performance bond **up to $25,000**, or **$50,000** if selling vacation certificates (§559.929). A security reduction application or waiver is available. | [verified - https://codes.findlaw.com/fl/title-xxxiii-regulation-of-trade-commerce-investments-and-solicitations/fl-st-sect-559-929/ (text current to 1 Jan 2025), https://ccmedia.fdacs.gov/content/download/116022/file/Travel-Registration-Package-Guide.pdf] |
| **Washington** (RCW 19.138, DOL plus a DOR endorsement) | Applies to anyone transacting business with Washington consumers, in or out of state. Requires a Sellers of Travel endorsement through the business licensing system. **Trust account** at a federally insured Washington institution for customer funds (or an approved alternative), with the account number filed at registration. Exemption: a surety bond approved by the director. The bond is tiered by gross income from Washington residents. The original registration fee is $222 (WAC, 2024). | [verified - https://lawfilesext.leg.wa.gov/Law/RCW/RCW%20%2019%20%20TITLE/RCW%20%2019%20.138%20%20CHAPTER/RCW%20%2019%20.138%20.140.pdf, https://dor.wa.gov/state-endorsements/sellers-travel, https://lawfilesext.leg.wa.gov/Law/WACArchive/2024/pdf/WAC%20308%20-129%20%20CHAPTER/WAC%20308%20-129%20%20COMBINEDCHAPTER.pdf] |
| **Hawaii** (HRS ch. 468L, DCCA) | Travel agencies must register before selling or advertising. **Client trust account** at a federally insured financial institution **located in Hawaii**, filed with DCCA. Consumer payments go into it within a set window. A trust account violation can be a prima facie showing of fraud. Charter tour operators have a separate trust account (Part II). A waiver of the trust account requirement may be available. | [verified - https://data.capitol.hawaii.gov/hrscurrent/Vol10_Ch0436-0474/HRS0468L/HRS_0468L-.htm, https://cca.hawaii.gov/pvl/files/2013/08/468L-Travel-Agencies-_0616_.pdf. The deposit window and waiver details are unverified] |

**Is a SaaS platform that never holds funds in scope?**
- No source found addresses a software vendor directly. [unverified]
- California's definition is broad: "arranges or advertises that he or she can or may arrange". If Triplanet only licenses software and the **operator** sells and contracts with travellers, Triplanet is a vendor to the seller, not the seller. The risk rises if Triplanet ever markets trips to consumers, appears as the contracting party, or receives funds. [unverified - analysis. Confirm with a travel lawyer]
- **Trust-account implication for phase 2 (decision-relevant):**
  - In CA, WA and HI, the **operator's** traveller receipts must land in a **trust account** (or bond or alternative).
  - A Stripe direct charge settles to the operator's Stripe balance, then pays out to a bank account the operator chooses. The product must let each operator set its Stripe payout account to its trust account. HI requires that account to be at a Hawaii bank, WA at a Washington bank (or an approved alternative).
  - Show a per-operator setting and a disclaimer ("you are responsible for seller-of-travel compliance"). Don't route funds through Triplanet.
  - Whether a Stripe balance held before payout satisfies "deposit directly into a trust account" (CA requires 100% deposited directly) is an open question for counsel. [unverified]
- Other seller-of-travel states (e.g. Iowa, Nevada) were not researched in this pass. [unverified]

---

## E. Privacy and FTC

### CCPA/CPRA service-provider contracts
| Fact | Label |
|---|---|
| Cal. Civ. Code §1798.140(ag): a service provider is a person that processes personal information on behalf of a business and receives it for a business purpose **under a written contract** that limits its use. | [verified (summary) - https://california.public.law/codes/civil_code_section_1798.140. Exact wording should be checked on leginfo] |
| 11 CCR §7051(a) sets the required contract terms (one law firm counts 9). They include: no selling or sharing; no retaining, using or disclosing outside the specified business purpose or the direct business relationship; no combining with other data (with exceptions); listing the specific business purposes; complying with the CCPA and providing the same level of protection; granting the business rights to take reasonable steps to ensure compliance and to stop and remediate unauthorized use; notifying the business if it can no longer comply; flowing the terms down to subcontractors. | [verified (secondary summary) - https://prighter.com/resources/laws/ccpa-regulations/sections/7051, https://www.cppa.ca.gov/regulations/pdf/cppa_regs.pdf. Items beyond (a)(1)-(a)(3) are from background knowledge and unverified] |
| Without a compliant §7051(a) contract, the recipient is **not** a service provider (§7050(e)), and the disclosure may be treated as a sale or sharing. Amended regulations took effect 1 Jan 2026. | [verified - https://prighter.com/resources/laws/ccpa-regulations/sections/7050, https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf] |
| Action: Triplanet's DPA must include the §7051 terms and the equivalent processor terms of other states (Virginia-model laws require similar processor contracts). | [unverified - analysis] |

### Number of US state comprehensive privacy laws
| Fact | Label |
|---|---|
| IAPP's report counted **19 enacted** comprehensive state laws (Jan 2026). Indiana, Kentucky and Rhode Island took effect 1 Jan 2026. | [verified - https://iapp.org/news/a/new-year-new-rules-us-state-privacy-requirements-coming-online-as-2026-begins] |
| By mid or late 2026 some trackers count about **20 in effect and about 23 enacted**. | [unverified - vendor trackers. Check https://iapp.org/resources/article/us-state-privacy-legislation-tracker] |
| Oklahoma enacted a comprehensive privacy law (SB 546) in 2025, effective 1 Jan 2026 or later. Relevant given the Tulsa customer base. | [unverified - background knowledge. **Verify**] |

### FTC Act Section 5: AI claims
| Fact | Label |
|---|---|
| **Operation AI Comply** was announced 25 Sep 2024 with 5 actions: **DoNotPay** ("robot lawyer", $193,000 settlement), **Rytr** (AI review generator; barred from review or testimonial generation), **Ascend Ecom**, **Ecommerce Empire Builders** and **FBA Machine** (AI-powered income schemes). | [verified - https://www.ftc.gov/news-events/news/press-releases/2024/09/ftc-announces-crackdown-deceptive-ai-claims-schemes] |
| 2025: **Workado**. Claimed its AI content detector was 98% accurate; the FTC found about 53%. Final consent order 28 Aug 2025, requiring competent and reliable evidence for accuracy claims. **Click Profit**: "AI-powered" passive income claims, with over $20M in judgments reported. **Air AI** (Aug 2025 complaint): claims that it could replace human customer service and generate income. Commentators say Operation AI Comply continued under the new administration. | [verified - https://advertisinglaw.fkks.com/post/102l358/ftcs-ai-crackdown-continues-workado-ordered-to-drop-unsupported-accuracy-claims, https://www.beneschlaw.com/insight/one-year-in-ftcs-operation-ai-comply-continues-under-new-administration-signaling-enduring-enforcement-focus/, https://www.dlapiper.com/en-es/insights/publications/2025/08/ftcs-latest-ai-washing-case. A reported Air AI outcome in March 2026 is unverified] |
| **Implication:** substantiate every quantified Maya or "AI" claim, e.g. "recovers X% of leaked profit" or "builds a trip in seconds". The demo's FEAT Live/Pilot/Roadmap labelling directly lowers Section 5 risk. | [unverified - analysis] |

### FTC: data-security claims
| Fact | Label |
|---|---|
| Misrepresenting security while failing to keep reasonable measures can violate §5(a). **Illuminate Education**: the complaint alleged the company overstated its data-security commitment while lacking basic controls (10.1M students exposed). The modified final order (5 Jun 2026) requires a 10-year security program, data deletion and breach disclosure, and bans security misrepresentations. FTC reports count over 90 data-security actions. | [verified (law firm reporting) - https://natlawreview.com/article/when-we-take-security-seriously-isnt-enough-lessons-ftcs-illuminate-order, https://www.privacysecurityacademy.com/wp-content/uploads/2026/04/FTC-Privacy-Enforcement-in-2026-and-Beyond.pdf] |
| **Implication:** avoid "bank-level security" or "SOC 2 compliant" claims unless true, and keep security-page statements matched to actual controls. | [unverified - analysis] |

---

## F. SOC 2

| Fact | Label |
|---|---|
| **Type I** tests control design at a point in time. **Type II** tests operating effectiveness over an observation period, typically 3-12 months. Most buyers who ask want Type II; Type I serves as a milestone. | [verified (practitioner sources) - https://blog.getagency.com/articles/soc-2-audit-cost, https://www.compassitc.com/blog/does-soc-2-reduce-security-questionnaires-or-just-change-them] |
| When buyers ask: mid-market and enterprise procurement typically sends a security questionnaire mid-to-late in the cycle, and the first question is often "do you have a SOC report?". For **SMB SaaS with light procurement and short cycles, SOC 2 is "useful but not urgent"**. Some buyers accept a questionnaire or trust center instead. | [verified (opinion, no survey data) - https://sm911.github.io/compliance-blog/aicpa/soc2-type2-for-saas-smbs.html, https://warrenaverett.com/insights/soc-for-saas/] |
| For 3-20-agent tour operators, SOC 2 demand will be rare. Expect it from larger operators, association or consortium partners, or deals involving payments or accounting integrations. A security page, DPA and questionnaire answers will cover most SMB deals. | [unverified - analysis] |
| **Vanta**: no public price list. Estimates run about **$7,500-$11,500/yr** (Core tier, one framework), with others citing about $10k/yr. **Drata**: estimates start about **$7,500/yr** (Foundation tier about $7.5k-$15k). Auditor fees are extra. | [unverified - third-party estimates: https://www.spendhound.com/marketplace/vanta-pricing, https://www.knowlee.ai/blog/tools/drata-pricing-2026, https://www.costbench.com/compare/drata-vs-vanta/] |
| **Type I auditor fee**: commonly cited as **$5,000-$20,000** for small companies (boutique CPA firms about $8k-$18k). Type II is about $15k-$50k (some say up to $70k). First-year all-in cost is about $20k-$60k. | [unverified - vendor-authored ranges: https://blog.getagency.com/articles/soc-2-audit-cost-for-startups, https://sprinto.com/hub/breakdown-of-soc-2-cost/, https://thoropass.com/blog/soc-2-audit-cost-a-guide] |

---

## G. GDPR

| Fact | Label |
|---|---|
| Art. 3(2) reaches non-EU controllers **and processors** whose processing relates to offering goods or services to people in the EU, or monitoring their behaviour in the EU. The EDPB Guidelines 3/2018 (v2.0, 12 Nov 2019) say a non-EU processor's activities are caught by Art. 3(2) where they relate to the targeting activities of a controller that is itself caught by Art. 3(2). | [verified - https://edpb.europa.eu/sites/edpb/files/files/file1/edpb_guidelines_3_2018_territorial_scope_en.pdf (summarized by https://www.algoodbody.com/insights-publications/edpb-publishes-finalised-guidelines-on-territorial-scope-of-the-gdpr)] |
| **Applied to Triplanet:** US tour operators selling tours **to US travellers** (even for travel to Europe) are generally not "offering services to data subjects in the Union". The Art. 3(2) test turns on targeting people *in* the EU, not EU citizenship or travel destination. If an operator actively markets to EU residents, that operator is caught, and Triplanet as its processor is caught for that processing. Triplanet's own EU vendors (hotels) are B2B contacts. | [unverified - analysis based on the EDPB guidance. Confirm with EU counsel] |
| Art. 27 requires a non-EU controller or processor caught by Art. 3(2) to designate an EU representative, unless processing is **occasional**, does not include large-scale Art. 9 or 10 data, and is unlikely to create risk (all three conditions). Continuous SaaS processing is usually not "occasional". Having a representative does not create an "establishment". | [verified - https://gdpr-info.eu/art-27-gdpr/, EDPB Guidelines 3/2018] |
| Travel data can include health and dietary data (Art. 9 special category) and passport data, which weighs against the Art. 27(2) exemption. | [unverified - analysis] |
| **EU-US Data Privacy Framework**: the adequacy decision is dated 10 Jul 2023. The **General Court dismissed Latombe v Commission (T-553/23) on 3 Sep 2025**. Latombe **appealed to the Court of Justice on 31 Oct 2025 (C-703/25 P)**, and the appeal is **pending** (Microsoft intervened in support of the Commission, reported 28 Jun 2026). The DPF stays valid in the meantime. | [verified - https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law-blog/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework, https://eur-lex.europa.eu/eli/C/2025/6610/oj/eng, https://digitalpolicyalert.org/event/35459. No CJEU judgment found as of Nov 2026] |
| Separate risk: noyb (Schrems) has signalled a broader challenge. A fallback to SCCs plus a transfer impact assessment is prudent. | [unverified - background knowledge] |
| Israel holds an EU adequacy decision (reconfirmed in the Commission's Jan 2024 review). Relevant if the Israeli entity processes EU data. | [unverified - background knowledge] |

---

## H. Accessibility (WCAG 2.1 AA, ADA)

| Fact | Label |
|---|---|
| **Title III lawsuits**: Seyfarth counted **3,117 federal website-accessibility suits in 2025, up 27% on 2024**, out of 8,667 Title III federal filings (36%, up from 28%). New York had 1,021 and Florida 961. California's federal courts had very few because filings moved to state court. UsableNet counted 3,195 federal plus 1,919 NY and CA state cases in 2025, and projects about 6,000 digital suits for 2026. | [verified - https://www.adatitleiii.com/2026/03/federal-court-website-accessibility-lawsuit-filings-bounce-back-in-2025/ (Seyfarth). UsableNet figures are via secondary sources, unverified] |
| **Title III and online-only or B2B businesses**: circuits split. The 9th Circuit and California's Court of Appeal (Martinez v. Cot'n Wash, 2022) hold online-only businesses are not public accommodations. An S.D.N.Y. judge (Judge Wood, 2024) held a standalone website is not a "place". Other courts (e.g. some in the 1st, 2nd and 7th Circuits) read Title III more broadly. B2B SaaS sold to businesses, not the public, is a low-frequency target. Risk rises for consumer-facing pages such as traveller booking or payment pages built on Triplanet for operators. | [verified - https://www.proskauer.com/blog/california-court-of-appeal-holds-online-only-business-websites-are-not-public-accommodations, https://crowell.com/en/insights/client-alerts/what-is-a-place-southern-district-chief-judge-issues-sui-generis-opinion-holding-ada-title-iii-protections-do-not-apply-to-online-only-business-websites. B2B risk weighting is unverified analysis] |
| **DOJ Title II rule** (28 CFR 35 Subpart H, final rule April 2024) requires WCAG 2.1 AA for **state and local government** web and mobile content. Original compliance dates were 24 Apr 2026 (population ≥50k) and 26 Apr 2027 (smaller). An **interim final rule of 20 Apr 2026 extended them by one year: to 26 Apr 2027 (≥50k) and 26 Apr 2028 (smaller entities and special districts)**. Comments closed 22 Jun 2026, and the extension is reportedly being challenged in court. | [verified - https://www.duanemorris.com/alerts/doj_extends_ada_title_ii_digital_accessibility_deadlines_one_year_0426.html, https://www.reedsmith.com/articles/doj-extends-digital-accessibility-compliance-dates-under-title-ii-of-the-ada/. Federal Register doc 2026-07663] |
| **Does Title II apply to private B2B SaaS?** Not directly. It binds public entities, which are responsible for content they provide "through contractual, licensing, or other arrangements", including vendor apps. Vendors are reached through procurement terms. Triplanet is affected only if it sells to public bodies (e.g. a city or state tourism office, or a public university travel program). | [verified - https://canons.sog.unc.edu/blog/2026/01/14/understanding-the-new-ada-web-accessibility-requirements-for-state-and-local-governments/, https://browngold.com/blog/eight-key-takeaways-from-the-dojs-new-web-and-mobile-accessibility-rule-for-public-entities/] |
| HHS Section 504 rule: WCAG 2.1 AA for HHS-funded recipients from May 2026 (≥15 employees). Not relevant to Triplanet. | [unverified - noted in Jackson Lewis headline only] |
| Practical: target WCAG 2.1 AA (or 2.2 AA) for the app and any traveller-facing pages. Publish a VPAT/ACR for association and public buyers. The existing Hebrew RTL work helps. | [unverified - analysis] |

---

## Open questions for counsel or a CPA
1. Is California SB 122 (SaaS taxable from 1 Jan 2027) real and enacted? Same question for Colorado. This would change Stripe Tax registration plans.
2. Does a Stripe direct charge to an operator's balance, paid out to its trust account, meet the CA §17550.15, WA RCW 19.138 and HI §468L-5 "deposit into trust account" rules?
3. Is Triplanet outside every state's "seller of travel" definition if it never contracts with or markets to travellers? (Check CA §17550.1(b) exemptions.)
4. Israeli entity: confirm the 0% VAT under §30(a)(5) for US customers.
5. Verify the Oklahoma privacy law status and its processor-contract terms.
6. Confirm Washington SB 6346 (repeal of most of ESSB 5814 from 2029) was signed.
