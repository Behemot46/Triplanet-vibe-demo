# 06 · QuickBooks Online (Intuit Accounting API)

**Phase:** MVP. It is the first connector, because the strategy deck says the accountant blocks the deal without QuickBooks sync.

**Research basis.** 13 Nov 2026. Most of developer.intuit.com renders with JavaScript and could not be read in full. Labels:

- `[verified-snippet]`: an official page, seen only as a search extract;
- `[third-party]`: Apideck, Truto or Hookdeck write-ups.

Re-check every fee and limit on the Intuit developer portal before you commit.

## 1. Plan-changing finding: one class per departure does not work on QBO Plus

- **QBO Plus caps classes and locations at 40, combined. Advanced is unlimited** [verified-snippet - https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-subscriptions/learn-usage-limits-quickbooks-online/L6THMltE4_US_en_US].
- **Since 15 Sep 2025 the API enforces the same limit** (error 6570) [verified-snippet - Intuit developer blog; third-party - Apideck].
- **Simple Start and Essentials** reportedly have no class tracking at all [unverified].
- **Consequence:**
  - The demo maps "Trip → Class" (`v6/s9a_books.js` `ACCT.qbo.map`).
  - A 20-trip-a-season operator on Plus would run out of classes in about two seasons, even with archiving, since only active classes count [verified-snippet - Intuit usage-limits FAQ].
  - It also competes with any classes the customer already uses.

**Decision: tag the trip as a customer "job" (sub-customer), not a class.**

| Tagging option | Plan needed | API tier | Verdict |
|---|---|---|---|
| **Sub-customer (job) per trip**, under the client customer: `Customer` with `ParentRef` and `Job=true`. Each bill expense line carries `CustomerRef` = the trip job, which makes it billable/job-costed | Plus, Advanced (job costing reports) [unverified per plan] | Core (writes, free) | **default** |
| Class per trip | Advanced only (unlimited) | Core | offered as a setting for Advanced customers |
| Class per *season* or *program* (few values) + trip code in the memo | Plus | Core | fallback where sub-customers clash with the customer's setup |
| Premium Projects API (GraphQL) | Plus/Advanced | **Silver: $300/month** [third-party - Apideck/Truto] | phase 2, only if customers ask for QBO "Projects" specifically |
| Premium Custom Fields (trip code) | any | Silver | phase 2 |

The mapping is chosen at connection time by the customer's accountant, in the "object mapping" step the demo already shows. The default is sub-customer.

## 2. Spec

| Item | Detail |
|---|---|
| **Auth** | OAuth 2.0 authorization code, scope `com.intuit.quickbooks.accounting` [unverified]. Access token 1 h [third-party - Truto]. Refresh token: a rolling 100-day window, **now capped at 5 years**, with first forced expiries Feb 2027 / Oct 2028 [verified-snippet - Intuit authentication FAQ]. Store the refresh-expiry field and **prompt re-consent 30 days ahead** |
| **API style** | REST/JSON v3: `/v3/company/{realmId}/...`. **Always send `minorversion=75` or higher**: 1-74 were retired 1 Aug 2025 and lower values are silently treated as 75 [verified-snippet - Intuit blog]. Premium APIs are GraphQL |
| **Objects** | `Vendor` ↔ supplier; `Customer` (client) + sub-customer job ↔ trip; `Bill` ↔ confirmed supplier invoice (lines: `AccountBasedExpenseLineDetail` with `AccountRef` from the account map, `CustomerRef` = trip job, `ClassRef` optional); `VendorCredit` ↔ supplier credit; `Invoice` + `Payment` ↔ client invoice/payment (phase 1b); `BillPayment` (read, for the paid FX rate); `Attachable` ↔ the original invoice PDF linked to the Bill [unverified - standard v3 entities] |
| **Direction and timing** | Push (Triplanet → QBO): Vendor, Customer/job, Bill (on confirm, if the setting is "auto" — the demo's `opt.auto`), VendorCredit (on credit recorded). The demo's "hold" becomes a Bill memo plus a private note; QBO has no bill-hold flag [unverified]. Pull (QBO → Triplanet): BillPayment and Payment status, for the paid flag and paid rate. Trigger: webhook, plus a nightly CDC sweep |
| **Webhooks** | **CloudEvents format mandatory since 15 May 2026** [verified-snippet - Intuit blog]: `application/cloudevents+json`, a batched array that can span several realms. Verify the `intuit-signature` HMAC on the raw body. Payloads carry IDs only, so each change needs a fetch, which is a **metered read** [third-party - Truto]. VendorCredit and BillPayment webhook coverage is unconfirmed, so CDC covers them |
| **Rate limits** | 500 req/min and 10 req/s per realm per app; batch endpoint 40/min (sources say 40 or 120; plan for 40) [verified-snippet - Intuit limits page]. 429 on excess. Worker: a per-realm token bucket at 8 req/s, exponential backoff with jitter |
| **Idempotency** | `requestid` query parameter on creates [unverified], derived as `sha256(connection, local_type, local_id, version)`, plus the `external_ref` row (`02-data-model.md`). Updates use `SyncToken`; on a stale token, re-read and retry once |
| **Errors** | `Fault` codes. 6570 usage limit: tell the user to switch tagging. 6000 validation: show the account-mapping fix. 401: refresh, and if that fails, set `status = reauth_required` and email the owner. 5xx/429: retry 5× then dead-letter. Every error is shown in the sync log (the demo's log screen) |
| **Reconciliation** | Nightly CDC: `GET /cdc?entities=Bill,VendorCredit,BillPayment,Payment,Invoice&changedSince=` (max 30-day look-back, 1,000 objects, no paging; narrow the window if capped) [verified-snippet - Intuit CDC page]. Compare amount and paid status with `external_ref.hash`. Any mismatch becomes an "out of sync" item on the trip finance tab |
| **Sandbox** | Up to 10 sandbox companies per developer account, valid 2 years; US Plus and Advanced sandboxes [verified-snippet - Intuit sandbox FAQ]. Sandbox calls are not metered [third-party] |
| **Production gate** | **App assessment questionnaire** before production keys, then an **annual security assessment**. Applies to private, unlisted apps too [verified-snippet - Intuit blog / platform requirements; third-party - Apideck]. Budget 2-4 weeks of elapsed time [estimate]. Human-only: the owner holds the developer account; an engineer answers the questionnaire, with `07-security-pentest.md` as evidence |
| **Cost** | Intuit App Partner Program, metered since 1 Nov 2025: **writes free; reads metered**. Builder tier $0, 500k reads/month, then **calls blocked until month end**. Silver $300/month, 1M reads, then $3.50 per 1k [third-party - Apideck/Truto; Intuit's rate card not readable]. At 1-50 tenants with webhook fetches plus a nightly CDC, reads ≈ 50 tenants × 300/day × 30 = 450k/month [estimate], close to the Builder cap. **Plan: Builder at pilot; move to Silver ($300 ≈ ₪951/month) before 30 tenants, or earlier if premium APIs are needed.** An alert fires at 70% of the cap |
| **Account holder** | Triplanet's legal entity holds the Intuit developer workspace and pays the tier fee. Each customer authorises its own company via OAuth |
| **Who confirms mapping** | The customer's accountant, in the mapping step: expense accounts per service type (Lodging, Transport, …), the AP account, the tagging method |

## 3. Tickets (summary; full list in `10-roadmap.md`, epic E-QBO)

- Developer workspace, sandbox companies, app registration. *Human-only.*
- OAuth connect/callback, encrypted token storage, refresh, re-consent banner. *Claude Code + reviewer.*
- Mapping UI (accounts, tagging method). *Claude Code + reviewer.*
- Push Vendor, Customer/job, Bill (+Attachable), VendorCredit, with idempotency. *Claude Code + reviewer.*
- Webhook endpoint (CloudEvents, signature), CDC nightly job, reconciliation view. *Claude Code + reviewer.*
- App assessment questionnaire and production keys. *Human-only.*
