# Accounting connectors: vendor API facts (research as of 13 Nov 2026)

Scope: Triplanet syncs supplier bills, vendor credits, customer invoices and payments, tagged per trip/departure, into the customer's accounting system. US group tour operators, 3-20 agents.

## How to read the labels

- **[verified - URL]**: an official vendor page states it. I read the text either by fetching the page or from a search-engine extract of that page.
- **[verified-snippet - URL]**: I saw the official page only as a search-engine extract, never as the full page. Re-check it before you commit money or dates.
- **[third-party - URL]**: an integrator blog or doc (Apideck, Truto, Hookdeck and similar) states it, but no official page I could read does. Treat it as likely, not confirmed.
- **[unverified]**: from general knowledge, or no source found.

## Research limits

- Most of developer.intuit.com, developer.xero.com/documentation/* and Intuit's blog host (blogs.a.intuit.com) could not be read here. They render with JavaScript, or the host was blocked. Several Intuit facts therefore rest on search extracts or on Apideck and Truto write-ups.
- These official pages were read in full: developer.xero.com/pricing, the Xero FAQs on pricing, policy and granular scopes, the Xero changelog, Priority's REST API docs (prioritysoftware.github.io), the WizCloud API docs, and the Hashavshevet (H-ERP) API PDF.

---

## 1. QuickBooks Online (Intuit Accounting API)

### Auth
- **OAuth 2.0 authorization-code flow; scope `com.intuit.quickbooks.accounting`; one connection per company (realm ID).** [unverified]
- **Access token lifetime is 1 hour.** [third-party - https://truto.one/blog/how-much-does-the-quickbooks-api-cost-2026-pricing-rate-limits/ (30 Mar 2026)]
- **Refresh tokens: a rolling 100-day window, now capped at 5 years. CHANGED 2025.**
  - The window is extended each time the token is used. Intuit's release notes list the cap under Sep 2025. [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/faq]
  - The first forced expiries fall in **Feb 2027 or Oct 2028**, depending on the scopes an app uses. [verified-snippet - https://medium.com/intuitdev/important-changes-to-refresh-token-policy-8443779d40db]
  - The refresh response now includes a field giving the refresh token's expiry. [verified-snippet - same source]
  - **Plan: show a re-consent prompt before the expiry.**
- **Restricted premium scopes exist.** Examples: `project-management.project` for the Projects API, and `sales.sales-order.read` / `.write` for the Sales Order API (Sep-Oct 2026). [third-party - https://www.apideck.com/blog/intuit-connect-2026-quickbooks-integrations (29 Oct 2026); third-party - https://support.fivetran.com/hc/en-us/community/posts/38918217013783]

### API style and minor versions
- **REST/JSON v3.** Read one entity: `GET /v3/company/{realmId}/{entity}/{id}`. Read many: `GET /v3/company/{realmId}/query?query=<select>`. [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/learn/rest-api-features]
- **Minor versions 1-74 were retired on 1 Aug 2025; 75 is the minimum. CHANGED 2025.** A request for a lower version is silently answered as version 75, with no error. [verified-snippet - Intuit developer blog, via https://blogs.intuit.com/?p=34635; third-party - https://docs.codat.io/updates/250219-qbo-minor-versions-update]
- **Always send `minorversion=75` or higher.** I did not confirm the current highest minor version. [unverified]
- **GraphQL is now used for premium APIs** (Projects, Custom Fields, Sales Tax, Sales Order), alongside REST. [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/develop/develop-with-graphql]

### Objects we need
- **Bill, VendorCredit, Invoice, Payment, BillPayment, Vendor, Customer, Class, Department (shown as "Location" in the UI) and Attachable** are standard v3 entities. [unverified - standard v3 entity list; the reference pages could not be read]
- **Class is set per line; Location is set on the header.**
  - Lines carry `ClassRef`, for example `Line[].AccountBasedExpenseLineDetail.ClassRef` and the equivalent under ItemBasedExpenseLineDetail.
  - This works only if the company has turned on class tracking per line.
  - `DepartmentRef` (Location) sits on the transaction header.
  - Whether a Location can be set per line is unconfirmed.
  - [third-party - https://cdn.cdata.com/help/RNN/py/pg_table-bills.htm, https://developers.routable.com/docs/payables-in-quickbooks-online]
- **Class and Location limits (key constraint, CHANGED 2025):**
  - **QBO Plus allows 40 classes and locations combined; Advanced allows unlimited.** [verified-snippet - https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-subscriptions/learn-usage-limits-quickbooks-online/L6THMltE4_US_en_US]
  - **Since 15 Sep 2025 the API enforces the same limits.** Creating past the limit returns "Usage Limit Exceeded", error 6570. Plus is also limited to 250 accounts. [verified-snippet - Intuit developer blog https://blogs.a.intuit.com/?p=35161; third-party - https://developers.apideck.com/connectors/quickbooks/docs/application_owner+api_changes]
  - **Only active classes count.** Archived or deleted ones do not, though community threads report some inconsistency. [verified-snippet - https://quickbooks.intuit.com/learn-support/en-uk/account-management/usage-limits-faq/00/1562728]
  - **Simple Start and Essentials have no class or location tracking at all.** [unverified]
  - **Implication:** one class per departure is not viable on Plus.
  - **Options:**
    - one class per trip product or season, archiving old ones;
    - a custom field holding the departure code (premium Custom Fields API, Silver tier or higher);
    - Projects;
    - for Advanced customers only, one class per departure.
- **Projects.**
  - **In REST, a project is a Customer with `IsProject=true` / `Job=true`, read through the Customer endpoints.** Community posts say creating projects through REST is unreliable. [third-party - community.make.com / satvasolutions]
  - **The premium Projects API (GraphQL) manages projects, including adding transactions.** Plus, Advanced and Accountant plans only. [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/workflows/manage-projects/get-started; third-party - https://help.ruddr.io/hc/en-us/articles/30771539473815]
- **Premium APIs launched 17 Jul 2025 for Silver, Gold and Platinum partners:** Projects, Custom Fields (up to 12 fields), Sales Tax, and Time with Payroll Compensation.
  - Access is requested by support ticket. Approval takes "a few days".
  - [third-party - https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program (20 Sep 2025, updated 6 Oct 2026)]
  - An early Intuit post said Gold and Platinum only. Later posts include Silver. [verified-snippet - https://blogs.intuit.com/tag/premium-api]
- **Custom Fields:** definitions are managed in GraphQL (`appFoundationsCreateCustomFieldDefinition`) and values are written through REST. The REST custom-fields approach is now "legacy". [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/workflows/create-custom-fields/get-started]
- **Attachable:** uploads a PDF and links it to a Bill, which suits invoice-check evidence. [unverified]
  - **Cost note:** attachment downloads count as metered CorePlus reads. [third-party - Apideck api_changes page above]
- **Other 2025 changes:**
  - Query filters `>`, `<` and `!=` on ID fields are no longer supported. Unsupported filters are ignored, so all rows come back. In production since 31 Oct 2025.
  - Country fields are now ISO 3-letter codes.
  - Lat/Long and Customer/Vendor "Source" fields were removed.
  - [third-party - https://developers.apideck.com/connectors/quickbooks/docs/application_owner+api_changes]

### Webhooks (CloudEvents CHANGED 2026)
- **The supported-entity table includes Bill, Invoice, Payment, Vendor, Customer and others.** Operations are Create, Update, Delete, Merge, Void and Emailed. [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/develop/webhooks]
  - VendorCredit, BillPayment and Attachable coverage is **unconfirmed**. Check the "Configure webhooks" table. [unverified]
- **Migration to the CloudEvents format was mandatory by 15 May 2026.** The old `eventNotifications` format was deprecated in sandbox and production on that date. [verified-snippet - Intuit developer blog https://blogs.intuit.com/?p=35371 and https://blogs.a.intuit.com/?p=35425]
  - **New payload:** a JSON array of events that can span several realms in one delivery.
  - **Content-Type:** `application/cloudevents+json`.
  - **Signature:** the `intuit-signature` HMAC check is unchanged.
  - Hookdeck advises accepting both formats until legacy delivery is confirmed stopped.
  - [third-party - https://hookdeck.com/webhooks/platforms/guide-to-quickbooks-webhooks-features-and-best-practices]
- **Payloads carry IDs and operations only**, so we fetch each changed record, which is a metered read. Deliveries are batched and can be minutes late. [third-party - Truto, 30 Mar 2026]

### Rate limits
- **500 requests per minute per realm ID** (production and sandbox). [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/learn/limits-and-throttles]
- **10 requests per second per realm ID and app** in production. [verified-snippet - same page]
  - Sandbox has had the same throttle since 15 Sep 2025. [verified-snippet - Intuit blog https://blogs.a.intuit.com/?p=35161]
  - Third parties call this "10 concurrent", which is ambiguous wording.
- **Batch endpoint:** sources conflict.
  - Intuit's docs say 40 requests per minute per realm. [verified-snippet - limits page]
  - A later Intuit blog says 120 per minute. [verified-snippet - Intuit blog]
  - **Plan for 40.**
- **Resource-intensive endpoints: 200 per minute per realm.** [third-party - Truto]
- **Reports are capped at 400,000 cells.** [third-party - Truto]
- **Over the limit, the API returns HTTP 429.** [verified-snippet / third-party]

### Error handling
- **Errors come in a `Fault` object with codes.**
  - 6570: usage limit (verified-snippet as above).
  - 6000: validation, for example account subtype rules. [third-party - Apideck api_changes]
  - Stale `SyncToken` on update. [unverified]
- **The `requestid` query parameter gives idempotent creates.** [unverified]
- **Only successful 2xx calls are metered.** [third-party - Apideck, Truto]

### CDC (reconciliation)
- **Request format:** `GET /v3/company/{realmId}/cdc?entities=Bill,Invoice,...&changedSince=<ISO8601>`.
- **Look-back:** 30 days at most.
- **Response cap:** 1,000 objects, with no paging. Shorten the window if you hit it.
- [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api/change-data-capture]
- **CDC calls are reads, so they count toward CorePlus metering.** [unverified - inferred]

### Sandbox
- **Up to 10 sandbox companies per developer account, each valid for 2 years.** [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/develop/sandboxes/sandbox-faqs; Intuit blog]
- **Plans available:** QBO Plus sandboxes in US, UK, AU, IN, CA and FR. Advanced sandboxes in the US only. [verified-snippet - same]
- **Sandbox calls are not metered.** [third-party - Apideck, Truto]

### Production keys and app assessment
- **Production keys unlock only after the app assessment questionnaire passes.** Failing it blocks access. [verified-snippet - Intuit blog https://blogs.intuit.com/?p=33093]
- **The questionnaire is a self-assessment, followed by an annual security assessment.** [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/go-live/publish-app/platform-requirements]
- **The review applies to unlisted private apps too.** [third-party - https://developers.apideck.com/connectors/intuit-enterprise-suite/docs/application_owner+app_compliance]
- **Apps listed on the App Store, or with more than 500 connections, are reviewed annually or more often.** [third-party - Apideck]
- **Account setup:** a company address in the developer portal, the updated Developer Terms, and a payment method on file for paid tiers. [third-party - Apideck pricing blog]

### Intuit App Partner Program: API fees (NEW, July/Nov 2025)
- **Timeline:**
  - Announced 15 May 2025.
  - Launched for US partners on 28 Jul 2025.
  - Variable fees were 100% discounted until 31 Oct 2025.
  - **Metering started 1 Nov 2025 (US).**
  - Expanded to the UK, AU and CA (except Quebec) on 3 Nov 2025.
  - [third-party - Apideck pricing blog; Truto 30 Mar 2026; https://investors.intuit.com/_assets/_08ee5483ec4c057568cc8774f3fd6aad/intuit/news/2025-07-28_Intuit_Launches_New_App_Partner_Program_to_Drive_1261.pdf]
- **What is metered:**
  - **Core = writes (create/update), unmetered and free.**
  - **CorePlus = reads (get, query, reports, attachment download), metered.**
  - Failed or throttled calls are not metered. Neither are sandbox, OAuth, Payments, Desktop or Payroll/Workforce APIs.
  - [third-party - Apideck, Truto; Intuit says "only the QuickBooks Accounting API is metered": verified-snippet - Intuit blog]
- **Tier prices (USD per month).** Intuit's own regional rate card could not be read, so all of these are third-party. [third-party - Apideck, Truto, Woodard]

  | Tier | Fee | CorePlus credits included | Overage (per 1,000 calls) | Entry rule |
  |---|---|---|---|---|
  | Builder | $0 | 500k | none: calls are **blocked** to month end | none |
  | Silver | $300 | 1M | $3.50 (1M-10M); $1.75 (10M-75M); $0.35 (>75M) | self-serve with a payment method |
  | Gold | $1,700 | 10M | $1.40 (10M-75M); $0.28 (>75M) | ≥500 active connections, Marketplace listing, Intuit review |
  | Platinum | $4,500 | 75M | $0.25 (>75M) | ≥3,000 connections, listing, review |

  - Truto gives no Gold overage rate. Woodard says only "lower".
  - **The Builder tier carries no platform service fee, and all apps start there.** [verified-snippet - https://developer.intuit.com/app/developer/qbo/docs/get-started/partner-faq]
  - **Silver upgrades automatically once a payment method is added. Gold and Platinum need review.** [verified-snippet - same FAQ]
- **Who pays:** billing and metering happen at the developer **Workspace** level, pooled across all production apps in it. [verified-snippet - partner FAQ / Intuit blog]
  - **Triplanet holds the developer workspace.** Each customer only authorizes its own company by OAuth. [unverified - standard model]
- **No pricing change was published at Intuit Connect (27 Oct 2026).** The program guide is dated Mar 2026. "FY27 partner commitments" are still pending. [third-party - Apideck, 29 Oct 2026]
- **Sizing estimate:** 20 agencies, each with a few hundred reads a day (CDC plus webhook fetches), stay well under the Builder cap of 500k per month. [unverified - our estimate]
  - **However, premium Custom Fields or Projects need Silver at $300/month.**

---

## 2. Xero Accounting API

### OAuth2 and scopes (CHANGED 2026)
- **OAuth 2.0 authorization-code flow;** PKCE is supported for native/SPA clients. [unverified]
- **Access tokens last about 30 minutes. Refresh tokens expire after 60 days unused and require `offline_access`.** Sources disagree on whether refresh tokens rotate on use. [third-party - xerotrust.readthedocs.io, nango.dev]
- **Granular scopes:**
  - **Apps created on or after 2 Mar 2026 must use granular scopes; the legacy broad scopes are rejected.** [verified - https://developer.xero.com/faq/granular-scopes; third-party - https://help.apideck.com/en/articles/8647746]
  - **Available since 4 Mar 2026.** `accounting.journals.read` is no longer granted by default. [verified - https://developer.xero.com/changelog]
  - **Broad scopes are formally deprecated (6 Aug 2026). Existing apps have until 13 Sep 2027.** [verified - changelog]
  - **`accounting.transactions` is replaced by** `accounting.invoices`, `accounting.payments`, `accounting.banktransactions` and `accounting.manualjournals`. Add `.read` for read-only access. [third-party - https://apideck.com/blog/xero-scopes; the FAQ confirms the invoices example only]
  - **Calling without the needed scope returns 401** with a WWW-Authenticate "insufficient scope" header. [verified - granular-scopes FAQ]
  - Tracking categories, contacts and settings scope names are not confirmed. Check https://developer.xero.com/documentation/guides/oauth2/scopes/ [unverified]

### Objects
- **Bills are Invoices with `Type=ACCPAY`; sales invoices are `ACCREC`.** Credit notes use `ACCPAYCREDIT` and `ACCRECCREDIT`. Payments apply to invoices and credit notes. Credit notes are applied to invoices through a separate Allocations call. [unverified for the type codes; third-party for allocations - https://getknit.dev/blog/xero-api-directory]
- **Recent behaviour changes:**
  - **8 Oct 2026:** allocating a credit note, prepayment or overpayment to an invoice or bill now requires the **same contact**. A mismatch returns a validation error. [verified - changelog]
  - **6 Sep 2025:** a payment or allocation matches a document only if its type matches. Otherwise the API returns NOT FOUND. [verified - changelog]
  - **19 Mar 2026:** paid bills can now be edited for non-financial fields. [verified - changelog]
  - **22 Jun 2026:** amount-based FX payments for ACCREC and ACCPAY documents. You send Amount and BankAmount, and Xero derives the rate. Relevant to our locked FX rate per trip. [verified - changelog]
  - **16 Jul 2026:** a `UpdatedDateUTCString` field on Invoices, Payments and Credit Notes. [verified - changelog]
  - **29 Jun 2026:** creating or updating contact bank details now needs BankAccountAdmin. [verified - changelog]

### Tracking categories (trip/departure tagging)
- **At most 2 active tracking categories,** out of 4 in total (the other 2 can only be archived). [third-party - https://www.fieldpromax.com/blog/xero-tracking-categories-for-job-costing-setup-and-limits; long-standing Xero product-ideas requests to raise it]
- **About 100 options per category is a recommended or soft limit,** not a hard one. [third-party - same; productideas.xero.com]
- **Option names are capped at 100 characters (since 10 Feb 2025).** Longer names return 400. [verified - changelog]
- **The P&L report has a 1,000-column tracking limit (15 Jun 2026).** [verified - changelog]
- **Each line takes at most one option per category.** [third-party]
- **Implication:**
  - Use category 1 for "Trip" (or Departure), with options archived after each trip closes.
  - Many customers already use their 2 categories, for example for region.
  - Xero Projects is an alternative. [unverified]

### Webhooks (CHANGED 2026)
- **Long-standing events:** Contacts and Invoices. [third-party - Merge help article, Jan 2026]
- **New events added this year:** [verified - changelog; CFOtech Feb/Mar 2026]
  - Credit Notes (4 Mar 2026), the first under a new per-event schema with context fields;
  - Prepayments (14 Aug 2026);
  - Overpayments (3 Sep 2026);
  - a Payments-related webhook (5 Nov 2026). Its changelog text is inconsistent, so check the docs.
- **Signing and setup:**
  - The `x-xero-signature` header is a base64 HMAC-SHA256 of the raw body, keyed with the app's webhook key.
  - The endpoint must pass an "Intent to Receive" check: return 200 for a valid signature and 401 for an invalid one.
  - Payloads are thin events (resourceId, eventType, tenantId).
  - [third-party - Hookdeck]

### Rate limits
- **Per organisation:** 5 concurrent calls, 60 calls per minute, 5,000 calls per day.
- **Per app across all organisations:** 10,000 calls per minute.
- **Over the limit:** HTTP 429.
- **Limits apply per connection and cannot be raised.**
- [verified-snippet - https://developer.xero.com/faq/limits]
- **The Starter tier allows only 1,000 calls per day per organisation; other tiers allow 5,000.** [verified - https://developer.xero.com/pricing]
- **"Rapid Sync" lifts standard limits for the first 30 minutes of a new connection.** It is open to all certified apps. [verified - pricing page]
- **Invoice email sends over the daily limit return 429 instead of 500,** with no Retry-After header. Target date 14 Jan 2027. [verified - changelog, 15 Oct 2026]

### Developer pricing (NEW: replaced revenue share; announced 4 Dec 2025, effective 2 Mar 2026)
- **Tiers (AUD per month, excluding tax, billed to a credit card):** [verified - https://developer.xero.com/pricing and https://developer.xero.com/faq/pricing-and-policy-updates]

  | Tier | Fee (AUD) | Max connections | Egress included | Overage |
  |---|---|---|---|---|
  | Starter | free | 5 | n/a | n/a |
  | Core | 35 | 50 | 10 GB | 2.40/GB |
  | Plus | 245 | 1,000 | 50 GB | 2.40/GB |
  | Advanced | 1,445 | 10,000 | 250 GB | 2.40/GB |
  | Enterprise | on application | unlimited | on application | on application |

  - Third-party USD figures (about $22 / $152 / $895) are conversions and conflict with these. Use the AUD table.
- **Data ingress (writes) is unlimited and free.** Egress is metered per app and cannot be pooled across apps. [verified - pricing page]
- **Certification gate (sources conflict):**
  - The pricing page lists "App Certification" for Plus and up, plus initial and annual security assessments for Advanced and Enterprise.
  - The pricing FAQ, as extracted, says certification is required from Core.
  - **Assume certification is needed before connection 6 (Core), and confirm.** [verified - both pages; the conflict is between them]
- **App Store listing:** required for Enterprise, optional for Plus and Advanced, not available for Starter and Core. [verified - FAQ]
- **Journals endpoint, XPM API and Bulk Connections need Advanced plus a security assessment.** Manual Journals stay available on all tiers. [verified - FAQ]
- **The 6th connection on Starter needs a payment method,** which moves the app to Core. [verified - FAQ]
- **Terms: API data must not be used to "train or contribute to the creation of any AI or machine learning model".** Using bots or browser extensions to simulate users is also banned. [verified - FAQ; https://developer.xero.com/xero-developer-platform-terms-conditions]
  - **This is relevant to Maya live mode:** do not feed Xero data into any training.
  - Whether per-request grounding is allowed should be checked with counsel. [third-party interpretation - Truto]
- **Certification checkpoints** cover connection, branding and naming, scopes, error handling, data integrity and security, account and payment mapping, and tax rates. The program includes annual recertification. [third-party - https://docs.codat.io/integrations/accounting/xero/partner-certification/checkpoints-app-store; Apideck]
- **Security requirements:** [verified-snippet - https://developer.xero.com/partner/security-standard-for-xero-api-consumers]
  - an annual self-assessment against Xero's security standard;
  - an advanced assessment at 1,000+ connections.

### Sandbox
- **There is no true sandbox.** Xero provides a Demo Company that resets every 28 days (or manually). [third-party - ApprovalMax support; Stack Overflow]
- **Test apps created after 2 Mar 2026 use granular scopes by default** against the Demo Company. [verified - granular-scopes FAQ]

---

## 3. Priority Software ERP

### API style
- **REST over OData v4.**
  - Service root pattern: `https://<server>/odata/Priority/<tabula.ini>/<company>/<FORM>`.
  - Demo example: `https://t.eu.priority-connect.online/odata/Priority/tabbtd38.ini/usdemo`.
  - The administrator gets the service root with the "Send Program Activation Link" program.
  - [verified - https://prioritysoftware.github.io/restapi]
- **Requests are case-sensitive.** Form names are usually upper case, with exceptions such as `DOCUMENTS_p`. [verified - same]
- **Writes need Priority version 17.2 or later.**
  - Composite keys are used, for example `AINVOICES(IVNUM='T9696',IVTYPE='A',DEBIT='D')`.
  - Lines are written through subforms, for example `AINVOICEITEMS_SUBFORM`.
  - [verified - https://prioritysoftware.github.io/restapi/modify]
- **Change tracking:**
  - `$since` works on documents (forms with Business Process Management) from v20.0. Use UTC with a `Z` suffix.
  - Timestamp and signature fields for change detection on lookup forms: v25.0 (with the latest CU) and v26.1.
  - [verified - https://prioritysoftware.github.io/restapi/releasenotes]
- **Batching and size limits:**
  - `$batch` holds at most **100** operations. A later correction replaced the earlier 10,000 figure.
  - Responses are capped at 350 MB.
  - Returned rows are capped by MAXFORMLINES, or MAXAPILINES from v25.1.
  - [verified - release notes]

### Cloud vs on-premise
- **Both exist.** Priority Cloud runs on AWS. The old sandbox was taken offline on 8 Sep 2025, and a new sandbox environment was added in Sep 2025. [verified - restapi, release notes]
- **Priority Cloud fair-use policy:** [verified - https://prioritysoftware.github.io/restapi]
  - 100 calls per minute per tenant;
  - 10 requests at once plus 5 queued;
  - 5,000 requests per 300-second sliding window;
  - requests over 3 minutes are dropped;
  - over the limit: HTTP 429.
- **No published limits for on-premise.** [verified - absence noted on same page]

### Authentication
- **Option 1, Basic auth:** uses the **API User Name** from the Personnel File form, which differs from the normal login. It cannot be used while External ID is enabled. [verified - https://prioritysoftware.github.io/restapi/authenticate]
- **Option 2, Personal Access Token (PAT), from v19.1:**
  - Defined in the "REST Interface Access Tokens" form.
  - Sent as Basic auth with the PAT as the username and the literal `PAT` as the password.
  - Recommended for server-to-server use.
  - [verified - same]
- **Option 3, OAuth2:** needs the purchased **External ID module**. The guide covers on-premise only and was tested on v22.1. [verified - same]
- **OIDC is the new method (CHANGED, undated):** [verified - https://prioritysoftware.github.io/OIDC_Authentication_Migration (no date shown)]
  - The page marks Basic auth "Deprecated" and says Basic and token users "will need to update" to OIDC.
  - OIDC requires **registering the app with Priority Software**: name, HTTPS redirect URI, logo and description. Software partners go through Partner Enablement.
  - PAT is still current, and the page recommends it as the interim method.

### Licensing: does the customer pay for API use?
- **API transactions are licensed.** [verified - https://prioritysoftware.github.io/restapi]
  - Each add or update on a form counts as one transaction. Example: an order with 5 lines is 6 transactions.
  - Transactions are sold in **packages of 10,000, renewed monthly**.
  - Forms are classed as premium, regular or free of charge; see the "View License Details" report.
  - Usage appears in the "API Transaction Count" report.
  - From v25.1 (Dec 2025) the count is pooled across all API users; before that it was split per user.
- **Who buys the transactions is not stated.** [verified - absence] In practice the customer's Priority licence holds them, so **the customer, or its Priority partner, must buy or confirm an API transaction package.** [unverified]
  - No price was found. AWS Marketplace lists Priority Cloud at $625 per month for the first 5 named users and $125 per extra user; API pricing is not shown. [third-party - https://aws.amazon.com/marketplace/pp/prodview-j2j4kzc64z2oy]
- **Application licence (v18.3+):** requests can send `X-App-Id` and `X-App-Key` headers to run under a per-application licence. Without them, generic API licensing applies. [verified - restapi, release notes]
  - **A partner app ID for Triplanet would come from Priority partner enablement.** [unverified]

### How a customer grants access
- **Customer admin steps:** [verified - restapi and authenticate pages, steps collated]
  - create an API user (Personnel File, API User Name) or a PAT;
  - **expose each form we need in the "API Forms" form (Limited Access)**; subforms come with their parent form;
  - send us the service root.

### Object (form) names: an accountant or Priority partner MUST confirm
- **`AINVOICES`:** sales or customer invoices. Confirmed as a REST form with subform `AINVOICEITEMS_SUBFORM`. [verified - restapi/modify]
- **`ORDERS` / `ORDERITEMS`** (sales orders) and **`DOCUMENTS_p`:** named in the docs. [verified - restapi]
- **`SUPPLIERS`:** vendors. [unverified - widely cited; not found on an official page]
- **`CUSTOMERS`:** customers. [third-party - jentic and mindcloud summaries]
- **`YINVOICES` / `PINVOICES`:** supplier (AP) invoices. **No source found.** [unverified]
- **`CINVOICES`:** customer invoice variant. **No source found.** [unverified]
- **Projects (`DOCUMENTS_P` / `PROJECTS`):** not confirmed. [unverified]
- **Best practice:** read `$metadata` on the customer's tenant, and have their Priority partner or accountant confirm forms for AP invoices, credit notes, receipts and payments, and the cost-centre or project dimension used for per-trip tagging. [unverified]
- **Israeli e-invoice rules:** B2B invoices need allocation numbers from the Tax Authority, so the ERP must be updated to comply. This affects posting AR invoices from Triplanet in Israel. [verified-snippet - https://www.priority-software.com/il/resources/invoice-tax-regulation/]

---

## 4. Hashavshevet (חשבשבת, Hashavshevet-Wizsoft Group)

### Who makes it
- **"Hashavshevet-Wizsoft Group" makes H-ERP / H-WEB.** Hashavshevet is the product brand. WizSoft Ltd is the company in the contact details, using wizsoft.com addresses. [verified - https://h-erp.co.il/h-erp-eng/]
- **WizCloud (wizcloud.co.il) is the group's cloud platform.** The h-erp WooCommerce plugin calls `shops-integration.wizcloud.co.il`, and the WizCloud accessibility page lists an h-erp.co.il contact. [unverified inference from https://wordpress.org/plugins/h-erp-integration/]

### A) Cloud: WizCloud REST API (exists today)
- **Source:** official docs at https://docs.wizcloud.co.il. Latest version 2.0.0 (1.0.0 is also available, with a SwaggerHub reference). The footer reads "© 2026". [verified - https://docs.wizcloud.co.il/docs/intro]
- **Capabilities:** [verified - intro]
  - imports: journal transactions, items, accounts (index), documents (invoices, delivery notes, orders, quotes), bank statements, sort codes and transaction types;
  - exports: any report built in the report designer, returned as JSON;
  - a list of companies per token.
- **Authentication:** [verified - https://docs.wizcloud.co.il/docs/getting-started; https://docs.wizcloud.co.il/docs/connecting-to-wizcloud (snippet)]
  - The user creates a personal token in WizCloud under נתונים כלליים > תוכניות עזר > ניהול אסימוני הרשאות.
  - Also needed: the company DB key and the server name, for example `lb1.wizcloud.co.il`.
  - Call `GET https://{server}/createSession/{token}/{db}`. It returns a `wizAuthToken` valid for 24 hours, sent in the Authorization header.
  - The connecting user must be a user of that WizCloud company with suitable permissions.
- **Endpoints:** all POST JSON. [verified - https://docs.wizcloud.co.il/docs/rest-api]
  - Journal: `jtransApi/newBatch` → `jtransApi/tmpBatch` (import to a temporary batch) → `jtransApi/chkBatch` (validate) → `jtransApi/issueBatch` (post to permanent).
  - Documents: `invApi/createDoc`, `getDoc`, `delDocument`, `issueDocument`.
  - Accounts: `IndexApi/importIndex`.
  - Receipts: `docsApi/createRecipt`, `createInvRecipt`.
  - Report export: `ExportDataApi/exportData`.
  - Also: `BankPagesApi`, `SortCodeApi`, `TransTypesApi`.
  - Triggers (outbound callback URLs): `TriggersApi/setURL`, `getURL` and related.
- **The temporary-batch-then-issue flow suits a "post as draft, accountant approves" model.** [unverified - design inference]
- **Not documented:** a separate supplier-invoice document type, and rate limits. A Field Limits page exists. [verified - absence]

### B) Desktop / Windows Hashavshevet ERP: "H-Connect" API (from version 2020 SP5)
- **Source:** official PDF "מדריך הגדרות API בחשבשבת" (H-ERP, uploaded May 2021). [verified - https://h-erp.co.il/wp-content/uploads/2021/05/API-חוברת-חדשה-ממשק_-011-3.pdf]
- **How it connects:**
  - The customer's Hashavshevet runs on its own MS SQL Server, locally or on a cloud server.
  - The API does **not** talk to that server directly. Calls go to Hashavshevet's relay at `https://ws.wizground.com/api`, which pushes data to the customer's local station.
- **Customer-side steps:**
  - register for the service at https://forms.h-erp.co.il/HConnectSignContract.asp;
  - a Hashavshevet installer then installs the add-on;
  - the customer sets the Station ID, the Company (the file name in the companies directory), and the vendor's ID under Settings > H-Connect.
- **Vendor side (Triplanet):**
  - Register **once per vendor**, not per customer, at netpassport.io. You get a netPassport ID and an RSA key pair.
  - **Every call's message must be signed** (npm `net-passport` or a signing executable).
- **Plugins (interface types):**
  - `HESHIN`: accounts;
  - `IMOVEIN`: documents;
  - `KUPAIN`: receipts;
  - `Movein`: journal transactions;
  - `Itemin`: items;
  - `Reports`: read data.
- **Internally the plugin converts the data into Hashavshevet's import file and pushes it through "מסופון 2"** (the batch import runner). Nothing is written until מסופון 2 is configured.
- **Cost:** developer email support is free (hatmaot@h-erp.co.il). Phone or Zoom implementation support costs ₪400 + VAT per hour.
- **Current pricing and status could not be confirmed.** The PDF is from 2021. [unverified for 2026]

### C) File import (always available fallback)
- **Hashavshevet's file interfaces ("ממשקי הקבצים") remain a supported alternative.** Specs are on the Hashavshevet site under "מידע לבתי תוכנה". [verified - same PDF, p.2]
- **Journal file import uses MOVEIN.DAT plus MOVEIN.PRM** (the parameter file that describes the layout), usually as fixed-width text in Windows-1255.
  - Green Invoice (Morning) exports `movein.doc`, `movein.prm` and `movein.dat` for Hashavshevet.
  - TravelBooster converts TSV with `tsv2dat_movein`.
  - [third-party - https://www.greeninvoice.co.il/help-center/connect-to-h-erp; https://www.assets.travelbooster.com/Help/Export_Data_to_Hashavshevet.htm; https://help.sap.com/saphelp_sbo900/helpdata/en/45/06da06d8696c30e10000000a114a6b/content.htm]
- **Unified-API vendors do not cover it.** Apideck lists Hashavshevet as "not yet supported". [third-party - https://www.apideck.com/accounting-software/hashavshevet]

### Summary for Hashavshevet
- **There is a real API on both the cloud (WizCloud REST) and desktop (H-Connect relay, 2020 SP5+) editions.** The file import (MOVEIN) remains the universal fallback.
- **An accountant should confirm** journal field mapping, batch handling, and which document type to use for supplier invoices.

---

## Changes in 2025-2026 (summary)
- **Intuit:**
  - App Partner Program and CorePlus read metering (launched Jul 2025, billed from 1 Nov 2025);
  - premium GraphQL APIs (Jul 2025);
  - minor version 75 minimum (1 Aug 2025);
  - class and location limits enforced in the API (15 Sep 2025);
  - sandbox throttling (15 Sep 2025);
  - 5-year refresh-token cap (Sep 2025);
  - CloudEvents webhooks mandatory (15 May 2026);
  - Sales Order GraphQL API (Sep-Oct 2026).
- **Xero:**
  - tiered developer pricing replaced revenue share (announced 4 Dec 2025, effective 2 Mar 2026);
  - AI/ML-training ban in the terms;
  - granular scopes required for new apps (2 Mar 2026), broad scopes deprecated, migration by 13 Sep 2027;
  - Credit Note, Prepayment, Overpayment and Payment webhooks (Mar-Nov 2026);
  - same-contact allocation rule (8 Oct 2026).
- **Priority:**
  - pooled API-transaction licence (v25.1, Dec 2025);
  - new AWS sandbox (Sep 2025);
  - OIDC migration with Basic auth deprecated (undated);
  - login lock mechanism (v26.1, Nov 2026).
- **Hashavshevet:** WizCloud API v2.0.0 is current. No dated 2025-2026 changes found.
