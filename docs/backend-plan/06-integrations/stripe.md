# 06 · Stripe (Billing, Tax, Connect)

**Research basis.** Source: web search on 13 Nov 2026, kept in the session's research notes. "Verified" means the vendor or official page states the fact in its indexed text. Re-check prices on the vendor pages before you sign.

## Summary

| Part | Phase | Who holds the account | Cost |
|---|---|---|---|
| **Billing** (Triplanet's own subscriptions) | MVP | Triplanet's legal entity | 0.7% of billing volume, plus card fees [verified - https://stripe.com/en-us/billing/pricing] |
| **Tax** (sales tax on Triplanet's subscriptions) | MVP: monitoring only. Collect only where registered | Triplanet | 0.5% of volume in registered jurisdictions [verified - https://support.stripe.com/questions/understanding-stripe-tax-pricing] |
| **Connect** (operators collect traveller payments) | **Phase 2**: confirmed, see "Why phase 2" below | each operator holds its own connected account; Triplanet holds the platform | no Connect fee if Stripe handles pricing [verified - https://stripe.com/connect/pricing] |

## 1. Billing

- **Auth.** Secret key `sk_live_...`, kept in Secrets Manager and used by the worker and the API only. A restricted key with only the Billing scopes. Publishable key in the SPA for Checkout only.
- **API style.** REST, form-encoded. Every POST takes an `Idempotency-Key` header (standard Stripe practice) [unverified here; Stripe's documented convention].
- **Model.** Pricing is per company, not per user, as the strategy deck recommends: $400-800/month for the target tier.
  - Products: `Starter`, `Team`, `Pro` × monthly/annual.
  - Seats are a `quantity` on an add-on price only if the owner later decides to charge per seat. Mid-cycle quantity changes prorate [verified - https://docs.stripe.com/billing/subscriptions/quantities].
- **Trials.** 30 days, with no card needed: `payment_method_collection=if_required`. At the end of the trial: `trial_settings.end_behavior.missing_payment_method = pause` [verified - https://docs.stripe.com/billing/subscriptions/trials].
- **Dunning.**
  - Smart Retries, 8 tries within 2 weeks (the recommended default) [verified - https://docs.stripe.com/billing/revenue-recovery/smart-retries].
  - Failed-payment and expiring-card emails are on.
  - After the final failure: tenant `status = suspended`. Read-only, export allowed, no deletion for 30 days.
- **Customer portal.** Update card, tax ID, invoices, cancel. Plan switching stays off: it is off by default [verified - https://docs.stripe.com/customer-management/configure-portal]. Upgrades go through sales during the pilot.
- **Webhooks** to `POST /hooks/stripe`:
  - Verify the `Stripe-Signature` header with the endpoint secret. Use the raw body and allow 5 minutes of tolerance.
  - Store the event in `webhook_inbox`, keyed on `event.id`, then process it asynchronously.
  - Events: `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.trial_will_end`.
  - The tenant's plan and status are driven **only** by these events, never by the client.
- **Reconciliation.** A nightly job lists subscriptions changed in the last 48 h and compares them with `tenant.plan`/`status`. Any difference raises an alert.
- **Sandbox.** Stripe test mode plus `stripe listen` for local webhooks.
- **Certification.** None.

## 2. Tax: US sales tax on Triplanet's subscriptions

**Facts:**

- **Oklahoma does not tax SaaS.** 68 O.S. §1357(32) exempts electronically delivered software. OTC Letter Ruling LR-26-012 (8 Sep 2026) treated a hosted web platform as exempt [verified - secondary summary, https://www.salestaxinstitute.com/resources/oklahoma-saas-sales-tax-ruling]. A letter ruling binds only its own facts.
- **Texas** taxes SaaS as a data processing service on 80% of the charge [verified - Comptroller rulings via ezel.ai]. Its economic nexus threshold is $500k [unverified].
- **Washington, New York, Pennsylvania, Ohio** (business use) and **Massachusetts** tax SaaS; **Connecticut** taxes business use at 1% [unverified - secondary sources].
- **California and Colorado** are reported to start taxing SaaS on **1 Jan 2027** (CA SB 122) [unverified - BDO/vatcalc; **confirm with the CDTFA**]. If true, it matters as soon as Triplanet crosses California's threshold.
- **Economic nexus** is typically $100k and/or 200 transactions. 16 states plus Kentucky (1 Aug 2026) have dropped the transaction count [verified - Avalara, 21 Apr 2026].

**Plan:**

- **MVP:** Stripe Tax in *monitoring* mode. It calculates exposure per state, but nothing is collected until Triplanet registers. The billing address and the customer's tax ID are captured on every subscription.
- **Registration trigger:** when monitoring shows 80% of any state's threshold, or physical presence (an employee or office) in a taxing state. A CPA decides; this is human-only work.
- **Selling entity:**
  - If Triplanet sells from an **Israeli** company, Israeli VAT at 0% on services to foreign residents probably applies (VAT Law §30(a)(5)) [verified - Israeli law-firm commentary; the SaaS-specific application is unverified]. A VAT opinion is needed (`11-open-questions.md` Q4).
  - A US entity (Delaware C-corp) is the usual choice for US sales and is assumed in this plan [estimate].

## 3. Connect: traveller payments to operators (phase 2)

### Why phase 2, not earlier

- The strategy deck's own model is subscription-only for the first ~20 customers, with payments going through the customer's own processor. It moves to a platform fee once the entity and advice are in place. That is the deck's decision, and it stands.
- **Exposure that only exists once money moves:**
  - money-transmission questions (state by state; California DFPI has denied an agent-of-payee exemption to a payment processor [verified - dfpi.ca.gov opinion letter]);
  - Seller of Travel trust-account rules (CA, WA, HI);
  - PCI scope;
  - chargebacks.
- **The counter-argument, recorded.** Payments are the revenue multiplier: WeTravel takes 1% of volume, and TravelJoy's payment fees are 86% of an advisor's cost of the platform (`Triplanet/research/financial-module.md` §5.1). This is a reason to *design* the data model for Connect now (client invoices, payments and processor references are already in `02-data-model.md`), not to ship it before the pilot.

### Design (when phase 2 starts)

- **Account model.**
  - Controller properties (Stripe's current recommendation, replacing Standard/Express/Custom) [verified - https://docs.stripe.com/connect/migrate-to-controller-properties].
  - Settings: `losses.payments = stripe`, `fees.payer = account`, `requirement_collection = stripe`, full Stripe Dashboard for the operator. This is the Standard equivalent.
  - Result: Stripe prices the operator directly, so there is no Connect fee for Triplanet [verified - https://stripe.com/connect/pricing].
- **Charge type: direct charges only.**
  - The operator is the merchant of record and bears refunds and disputes [verified - https://docs.stripe.com/connect/merchant-of-record].
  - Triplanet takes `application_fee_amount` [verified - https://docs.stripe.com/connect/direct-charges].
  - **Never** destination charges, `on_behalf_of`, or separate charges and transfers. With those, the platform balance sits in the flow and the platform is liable for negative balances [verified - https://docs.stripe.com/connect/merchant-of-record].
  - Effect: Triplanet never receives, holds or transmits traveller funds [unverified - analysis; **payments counsel must confirm**, `11-open-questions.md` Q9].
- **Seller of Travel.**
  - Each operator sets its Stripe payout account. Where the operator sells to CA, WA or HI residents, that account must be its **trust account**: HI requires a Hawaii bank and WA a Washington bank, or an approved alternative [verified - HRS 468L, RCW 19.138 via the research notes].
  - The product shows a per-operator compliance setting and a clear notice that the operator is responsible for Seller of Travel compliance.
  - Open question for a travel lawyer: does a Stripe balance held before payout satisfy California's "deposit 100% directly into a trust account" (§17550.15)? [unverified]
  - This is also the hook for the roadmap item "Trust account reports" (FEAT `trust`).
- **PCI: SAQ A.**
  - Stripe Checkout or Elements only, never a self-hosted card form [verified - https://support.stripe.com/questions/pci-faq].
  - SAQ A r1 (30 Jan 2025) removed 6.4.3/11.6.1 from SAQ A. In their place is an eligibility criterion that **the whole site** is not susceptible to script attacks [verified - Akamai and Adyen summaries].
  - Therefore: a strict CSP (`script-src 'self' https://js.stripe.com`), SRI on own scripts, no third-party tag managers or analytics scripts in the app, and Stripe.js loaded from Stripe, never self-hosted [verified - report-uri on Stripe's CSP attestation].
  - In Connect the **operator** is the merchant. Whether Triplanet is a PCI "service provider" depends on whether it can affect cardholder-data security; a QSA should confirm [unverified].
- **Pricing for the operator** (from the strategy deck): free ACH as a selling point, 1% platform fee on card [estimate - the deck's proposal, an owner decision].
- **Webhooks:** Connect events (`account.updated`, `payment_intent.succeeded`, `charge.dispute.created`) on the same endpoint, with a separate signing secret. Payments write `client_payment` with `processor_ref`.
