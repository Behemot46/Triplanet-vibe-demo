# 06 · Xero Accounting API

**Phase:** 2. The brief puts Xero in phase 2. Xero is the second-largest small-business ledger among US operators, but QuickBooks dominates the US segment (strategy research) [unverified share].

**Research basis.** 13 Nov 2026. developer.xero.com/pricing, the pricing and policy FAQ, the granular-scopes FAQ and the changelog were read in full. The API reference pages render with JavaScript.

## 1. Spec

| Item | Detail |
|---|---|
| **Auth** | OAuth 2.0 authorization code. Access token about 30 min; refresh token expires after 60 days unused and needs `offline_access` [third-party]. **Apps created on or after 2 Mar 2026 must use granular scopes**: `accounting.invoices`, `accounting.payments` (+ `.read`), contacts and settings [verified - https://developer.xero.com/faq/granular-scopes]. A missing scope returns 401 with "insufficient scope" [verified - same]. A connection is per Xero organisation (`tenantId`) |
| **API style** | REST/JSON. `Xero-tenant-id` header per organisation [unverified] |
| **Objects** | `Contact` ↔ supplier/client; `Invoice` Type=`ACCPAY` (bill) ↔ confirmed supplier invoice; `CreditNote` Type=`ACCPAYCREDIT` ↔ supplier credit, applied with an Allocation **to the same contact** (required since 8 Oct 2026) [verified - https://developer.xero.com/changelog]; `Invoice` Type=`ACCREC` and `Payment` ↔ client billing; `TrackingCategory`/option ↔ trip; attachments ↔ the invoice PDF [unverified for type codes] |
| **Trip tagging** | Tracking categories: at most **2 active** per organisation [third-party]. About 100 options per category is a soft limit [third-party]. Option names ≤ 100 characters [verified - changelog]. **Plan:** one category "Trip" (or reuse an existing one, chosen at connection time). Each trip's option is created when the trip is won and **archived when it closes**. If the customer already uses both categories, fall back to a trip code in the line description plus a "Program" option. Xero Projects is phase 3 [unverified API fit] |
| **FX** | Since 22 Jun 2026 an ACCPAY payment can be sent as Amount + BankAmount and Xero derives the rate [verified - changelog]. Read it back as the trip's paid rate |
| **Direction and timing** | Same as QBO: push contacts, bills and credit notes; pull payments. Triggered by webhooks plus a nightly sweep using `If-Modified-Since` / `UpdatedDateUTC` |
| **Webhooks** | Invoices and Contacts; Credit Notes since 4 Mar 2026; Prepayments and Overpayments 2026; a payments event 5 Nov 2026 (check the docs) [verified - changelog]. `x-xero-signature` is a base64 HMAC-SHA256 of the raw body. The endpoint must pass the "Intent to Receive" check: 200 on a valid signature, 401 on an invalid one [third-party - Hookdeck] |
| **Rate limits** | Per organisation: 5 concurrent, 60/min, 5,000/day; per app: 10,000/min [verified-snippet - https://developer.xero.com/faq/limits]. The Starter tier allows 1,000/day per organisation [verified - https://developer.xero.com/pricing]. Worker: a per-organisation semaphore of 4 and 50/min |
| **Idempotency** | `Idempotency-Key` header [unverified - confirm on the API docs] + `external_ref` |
| **Errors** | 401 insufficient scope → reconnect flow. 400 validation → shown in the sync log. 429 → back off (no Retry-After on some endpoints [verified - changelog]) |
| **Reconciliation** | A nightly fetch of bills, credit notes and payments modified in the last 48 h, compared with `external_ref.hash` |
| **Sandbox** | No real sandbox: a Demo Company that resets every 28 days [third-party] |
| **Certification** | Xero's pages conflict: the pricing page shows **App Certification** from the Plus tier; the FAQ extract says from Core [verified - both pages]. **Plan: certify before the 6th Xero customer.** Checkpoints cover connection, branding, scopes, error handling, data integrity, account mapping and tax rates; annual recertification [third-party - Codat]. Security self-assessment annually [verified-snippet - Xero security standard] |
| **Cost** (AUD/month, ex tax) | Starter free (5 connections); Core 35 (50 connections, 10 GB egress); Plus 245 (1,000); Advanced 1,445 (10,000). Writes free; egress over the allowance 2.40/GB [verified - https://developer.xero.com/pricing]. At 1-50 Xero tenants: **Core, AUD 35 ≈ US$23 ≈ ₪72/month** [estimate - AUD/USD 0.65 assumed, unverified] |
| **AI terms (legal check)** | Xero's developer terms ban using API data to "**train or contribute to the creation of any AI or machine learning model**" [verified - https://developer.xero.com/xero-developer-platform-terms-conditions]. Triplanet does not train models. Whether Maya's per-request grounding on data that came from Xero counts as "contributing" is a question for counsel (`11-open-questions.md` Q10). **Until answered:** Maya's tools read Triplanet's own tables; Xero-sourced fields are limited to payment status; no Xero data in AI logs beyond 90 days |
| **Account holder** | Triplanet holds the Xero developer account and app. Each customer connects its organisation |
