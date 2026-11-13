# 06 · Israel Tax Authority allocation numbers (חשבוניות ישראל / מספר הקצאה)

**Phase:** only if Triplanet issues **Israeli tax invoices** for Israeli tenants (`11-open-questions.md` Q2). It is not needed for US customers.

**Research basis.** 13 Nov 2026. gov.il pages refused automated fetches, so official pages are cited from search extracts; most facts come from KPMG, Herzog and vendor guides.

## 1. Facts

| Fact | Source |
|---|---|
| **Current threshold: NIS 5,000 before VAT, since 1 Jun 2026.** Earlier steps: NIS 25,000 (May 2024), 20,000 (2025), 10,000 (1 Jan 2026). The older calendar (10,000 in 2027, 5,000 in 2028) was superseded by the 2025 budget law | [verified - https://kpmg.com/us/en/taxnewsflash/news/2025/12/tnf-israel-expansion-of-mandatory-e-invoicing-model.html; Herzog 11 Jan 2026] |
| No step below NIS 5,000 had been legislated as of Oct 2026 | [verified - adviser guides only, not an ITA primary source] |
| Scope: B2B tax invoices to a VAT-registered buyer. Without a number, the **buyer cannot deduct input VAT** (VAT Law s.38(a1)) | [verified - KPMG; Herzog] |
| The ITA approves in real time and may refuse. Options then: cancel, issue without a number, reverse charge, or hearing/objection/appeal | [verified - https://www.efraty.com/?p=5293] |
| **The issuing dealer requests the number.** The business owner logs in through the government identity service and authorises the invoicing software, which then holds a token and requests numbers automatically | [verified - KPMG; Green Invoice guide (vendor)] |
| ITA OpenAPI: OAuth2 "user restricted". Production `openapi.taxes.gov.il/shaam/production/...`; sandbox `ita-api.taxes.gov.il/shaam/tsandbox/...`; support APISupport@taxes.gov.il | [verified - ITA software-house API PDF, Dec 2025] |
| A software house connects to SHAAM (שע"ם) through a connection procedure, an API commitment letter and an information-security appendix | [verified - search summary of https://www.gov.il/he/service/connect-to-shaam] |
| The invoice-approval API specification itself could not be retrieved | [unverified] |
| **Software registration:** accounting software made available to third parties (including free) must be registered with the ITA under the Income Tax (Bookkeeping) Directives (s.36). It must produce the **uniform format file (מבנה אחיד)**. Registration is free and time-limited. Which appendix applies (the brief said H; one source says E) is unconfirmed | [verified - https://www.gov.il/en/service/registration-software-designed-managing-computerized-accounting-system (summary)]; appendix [unverified] |
| VAT 18% since 1 Jan 2025. Section 30(a)(8) zero-rates listed tourism services to tourists (hotels, tourist transport, travel-agency/tour organising). Repeal was proposed and reportedly dropped from the March 2026 budget package | [verified - research notes; the repeal status is unverified against the enacted law] |

## 2. Design (if Israel is in scope)

- **Issuing system.** Per Israeli tenant, exactly one system issues tax invoices: Triplanet, **or** the tenant's Priority/Hashavshevet. Two issuers mean duplicate number series. The default for tenants with an ERP is that **the ERP issues** and Triplanet posts a draft. In that case Triplanet needs no allocation API and no software registration for those tenants.
- **If Triplanet issues:**
  - **Software registration.** Register Triplanet with the ITA before the first live invoice. A uniform-file export is required. Elapsed time is unknown [estimate: 4-8 weeks]. Human-only (owner + Israeli CPA), with Claude Code + reviewer building the export.
  - **SHAAM connection.** Software-house connection procedure, commitment letter, security appendix. Human-only.
  - **OAuth per tenant.** The tenant's owner authorises Triplanet in the ITA portal. The token is stored envelope-encrypted like other connector tokens. The token's lifetime and refresh need to be confirmed against the spec [unverified].
  - **Issue flow.**
    1. The draft invoice is validated.
    2. If it is B2B and ≥ NIS 5,000 before VAT, call the allocation API (idempotent: the same invoice gets the same request).
    3. Store `allocation_no` and the response.
    4. Render the PDF and lock the number.
    - Refusal: the invoice stays a draft and the user sees the ITA reason and the options (cancel / issue without a number with a warning / reverse charge).
    - Outage: retry with backoff. The user can't issue an above-threshold B2B invoice until it succeeds, unless they knowingly choose "without number".
  - **Per-line VAT.** Each line carries `tax_code` (18% standard, or 0% with the legal basis, e.g. s.30(a)(8) tourism to foreign tourists). The invoice shows the basis.
  - **Number series.** Gap-free per document kind (`client_invoice.number`).
  - **Retention.** Bookkeeping retention is 7 years for Israeli records [unverified - standard Israeli rule; confirm with the CPA].
- **Sandbox.** `ita-api.taxes.gov.il/shaam/tsandbox`. An integration test runs against it in CI nightly once access is granted.
- **Account holder.** The ITA software registration and SHAAM connection are held by Triplanet's Israeli entity. Each tenant authorises with its own dealer identity.
- **Who confirms.** An Israeli CPA confirms the VAT codes, the 0% basis per service, the document kinds and the uniform-file mapping.
