# 06 · Priority Software ERP (Israel)

**Phase:** 2, and only if Israel is in scope (`11-open-questions.md` Q2).

**Research basis.** prioritysoftware.github.io (REST API, authentication, OIDC migration, release notes) was read in full on 13 Nov 2026.

| Item | Detail |
|---|---|
| **API style** | REST over **OData v4**. Service root: `https://<server>/odata/Priority/<tabula.ini>/<company>/<FORM>`. Case-sensitive. Writes need v17.2+ and use composite keys plus subforms (e.g. `AINVOICES(...)/AINVOICEITEMS_SUBFORM`) [verified - https://prioritysoftware.github.io/restapi, /restapi/modify] |
| **Cloud vs on-premise** | Both. Priority Cloud (on AWS) fair use: 100 calls/min per tenant, 10 concurrent + 5 queued, 5,000 per 300 s, requests over 3 min dropped, 429 on excess. No published limits on-premise [verified - restapi]. On-premise is often behind the customer's firewall, so the customer must expose the endpoint or allow-list Triplanet's egress IPs (static NAT IPs, see `09-ops.md`) |
| **Auth** | **Personal Access Token (PAT)**, recommended for server-to-server: Basic auth with the PAT as the user and `PAT` as the password, v19.1+ [verified - /restapi/authenticate]. Plain Basic auth is marked **deprecated**; the new **OIDC** method requires registering Triplanet's app with Priority (partner enablement) [verified - /OIDC_Authentication_Migration, undated]. **Plan:** PAT at launch; start Priority partner enablement in parallel for OIDC and an **application licence** (`X-App-Id`/`X-App-Key`, v18.3+) [verified - restapi] |
| **How a customer grants access** | The customer's Priority admin (or Priority partner): (1) creates an API user or PAT; (2) **opens each form we use in "API Forms"**; (3) sends us the service root. Subforms follow the parent [verified - collated from restapi/authenticate] |
| **Objects** | Confirmed: `AINVOICES` (sales invoices) [verified - /restapi/modify], `ORDERS`, `DOCUMENTS_p` [verified - restapi]. **Not confirmed:** `SUPPLIERS` (vendors), the supplier/AP invoice form (often cited as `YINVOICES`/`PINVOICES`), `CINVOICES`, the project form [unverified]. **An Israeli accountant or Priority partner must confirm each form**, plus the dimension used per trip (project or cost centre). Read `$metadata` on the customer's tenant during onboarding |
| **Mapping (from the demo)** | Trip → project (פרויקט); supplier → supplier record; supplier invoice → supplier invoice; supplier credit → supplier credit invoice; client invoice → tax invoice-receipt (`v6/s9a_books.js` `ACCT.priority`). The demo's labels are a hypothesis until the accountant confirms |
| **Change tracking** | `$since` on BPM documents from v20.0 (UTC with `Z`) [verified - release notes]. Nightly sweep |
| **Batching** | `$batch` ≤ 100 operations [verified - release notes] |
| **Cost to the customer** | **API transactions are licensed**: every insert/update = 1 transaction (an invoice with 5 lines = 6); sold in **packs of 10,000 per month** [verified - restapi]. No price found. **The customer, or its Priority partner, must buy or confirm a pack** [unverified]. Estimated usage: 25 invoices × 8 lines ≈ 225 transactions/month per tenant [estimate], well inside one pack |
| **Israeli e-invoice rules** | AR invoices posted from Triplanet must carry an ITA allocation number above the threshold. Either Priority obtains it (if the customer's Priority issues the tax invoice) or Triplanet does (see `israel-tax-allocation.md`). **Decide per customer which system is the issuing system; never both** |
| **Sandbox** | A new Priority sandbox environment since Sep 2025 [verified - release notes]. Access through partner enablement [unverified] |
| **Account holder** | Customer: Priority licence and API transactions. Triplanet: partner enablement / app registration |
