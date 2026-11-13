# 06 · Hashavshevet (חשבשבת, Hashavshevet-Wizsoft Group)

**Phase:** 2, and only if Israel is in scope.

**Correction to the brief.** The brief asked "what API or import format exists, if any; if file import only, say so". **It is not file-import only.** There are three paths.

| Path | What it is | Fit |
|---|---|---|
| **A. WizCloud REST API** (cloud edition) | Documented REST API, v2.0.0 [verified - https://docs.wizcloud.co.il/docs/intro]. Imports: journal transactions, accounts, items, documents, bank pages. Exports: any report-designer report as JSON | **default** for cloud customers |
| **B. H-Connect** (Windows Hashavshevet 2020 SP5+) | Calls go to a relay (`https://ws.wizground.com/api`) that pushes to the customer's local station. The vendor (Triplanet) registers **once** at netpassport.io and **signs every call** with RSA. The customer registers for the service and installs an add-on. Plugins: `HESHIN` (accounts), `IMOVEIN` (documents), `KUPAIN` (receipts), `Movein` (journal), `Reports`. Internally it writes an import file and runs "מסופון 2" [verified - official H-ERP PDF, May 2021: https://h-erp.co.il/wp-content/uploads/2021/05/API-חוברת-חדשה-ממשק_-011-3.pdf] | for desktop customers; **2026 status and pricing unconfirmed** (the source is from 2021) |
| **C. File import** | `MOVEIN.DAT` + `MOVEIN.PRM` (fixed-width, Windows-1255), the long-standing "ממשקי קבצים" [verified - same PDF p.2; third-party - Green Invoice / TravelBooster help pages] | universal fallback: Triplanet produces a downloadable file the bookkeeper imports |

## Spec (path A, WizCloud)

| Item | Detail |
|---|---|
| **Auth** | The customer creates a personal token in WizCloud (נתונים כלליים › תוכניות עזר › ניהול אסימוני הרשאות) and gives us the token, the company DB key and the server (e.g. `lb1.wizcloud.co.il`). `GET https://{server}/createSession/{token}/{db}` returns `wizAuthToken`, valid 24 h [verified - https://docs.wizcloud.co.il/docs/getting-started]. Store the personal token envelope-encrypted, like an OAuth refresh token |
| **API style** | POST JSON endpoints [verified - https://docs.wizcloud.co.il/docs/rest-api] |
| **Objects and mapping** | Supplier invoice → **journal batch** (`jtransApi/newBatch` → `tmpBatch` → `chkBatch` → `issueBatch`). The temporary-then-issue flow lets the bookkeeper approve before posting: **Triplanet stops at `chkBatch` and the bookkeeper issues it** (a design choice that keeps the accountant in control). Supplier credit → journal batch (reverse). Trip → profit centre / sort code (`SortCodeApi`). Client receipts → `docsApi/createRecipt`. The demo's mapping (`ACCT.hash`: profit centre, supplier account, journal entry, supplier credit note, tax invoice-receipt) is a **hypothesis an accountant must confirm** |
| **Direction and timing** | Push on confirm (into a temporary batch); pull receipts/reports nightly. WizCloud supports outbound triggers (`TriggersApi/setURL`) [verified - rest-api page], to evaluate for payment status |
| **Rate limits** | Not documented [verified - absence]. Default to 1 req/s per company |
| **Errors** | `chkBatch` validation errors are shown in the sync log, in Hebrew |
| **Sandbox** | Not found; ask Wizsoft for a test company [unverified] |
| **Cost** | WizCloud API: no fee found. H-Connect: implementation support ₪400 + VAT per hour (2021) [verified - PDF]; registration terms unconfirmed |
| **Account holder** | Customer: the WizCloud/Hashavshevet licence and token. Triplanet: the netPassport vendor registration (path B) |
| **Who confirms** | An Israeli bookkeeper/CPA confirms the account numbers, sort codes and journal structure before the first live post (CLAUDE.md open item) |
