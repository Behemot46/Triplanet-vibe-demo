# 06 · Email: transactional, customer domain, inbound bills

**Phases:**

- MVP: transactional email, dispute emails sent from the customer's domain.
- Phase 2: inbound bill capture (FEAT `mail`: "Bills straight from your inbox", Roadmap).

## 1. Provider (decision): Postmark, with AWS SES as the fallback

| | Postmark | AWS SES | Resend |
|---|---|---|---|
| Price | 10k emails: Basic $15, Pro $16.50, Platform $18; **inbound parsing only on Pro and Platform** [unverified - postmarkapp.com/pricing via snippets] | $0.10 per 1,000 out; inbound $0.10 per 1,000 + per-chunk [unverified] | Pro $20 for 50k [verified overage - resend.com changelog] |
| Fit | best deliverability reputation for transactional mail, separate "message streams" for transactional vs broadcast, inbound webhook with parsed JSON | cheapest; more DIY (bounce handling via SNS, reputation management) | modern API; inbound reportedly on all plans [unverified] |

**Choice: Postmark Pro**, ≈ $16.50 ≈ ₪52/month at the MVP volume (USD/ILS 3.17). At volumes above 100k/month, re-evaluate SES.

## 2. Sending from the customer's domain

Dispute emails must come **from the operator** (e.g. `accounts@redbudtours.com`), not from Triplanet, so the supplier replies to the operator. Two modes:

| Mode | How | When |
|---|---|---|
| **Verified domain** (default) | The customer adds Postmark's DKIM TXT record and a Return-Path CNAME on their domain. Triplanet shows the exact records and checks them through the Postmark API. `From: Dana Whitfield <accounts@redbudtours.com>` | operators who control their DNS |
| **Reply-to fallback** | `From: "Redbud Group Tours via Triplanet" <disputes@mail.triplanet.io>`, `Reply-To: accounts@redbudtours.com` | until DNS is set up |

- **SPF/DKIM/DMARC.** With DKIM on the customer's domain plus a custom Return-Path, mail passes DMARC alignment through DKIM [unverified - standard Postmark setup]. Triplanet's own domain gets SPF, DKIM, DMARC `p=quarantine`, then `p=reject` after 30 days of clean reports. DMARC monitoring: Postmark's free weekly digest [unverified].
- **Bounces and complaints.**
  - A Postmark webhook (Basic auth plus an IP allow-list) goes to `POST /hooks/postmark`.
  - A hard bounce marks the supplier's `email_ap` invalid and shows a banner on the dispute.
  - A spam complaint suppresses that address for the tenant.
  - The dispute status records `delivered`/`bounced`.
- **Threading.** Store `Message-ID` on `dispute.email_message_id` so phase-2 inbound replies attach to the right dispute.
- **Content.** The demo's `disputeMail` text becomes a template per locale. The user always sees and can edit it before sending. Nothing is sent automatically in the MVP.

## 3. Inbound bill capture (phase 2)

- **Address.** Each tenant gets a unique address, `bills+<tenant-slug>-<random8>@in.triplanet.io`; the random part prevents guessing. The operator sets a forwarding rule from their AP mailbox.
- **Flow.**
  1. Postmark inbound webhook.
  2. Verify the source (Basic auth on the webhook URL plus Postmark IPs).
  3. Store the raw MIME in S3.
  4. Extract attachments.
  5. Malware scan.
  6. Per PDF/image: the extraction pipeline (`05-ai.md`).
  7. The invoice appears in "needs review" with "received by email from X".
- **Spoofing.** Accept only when the sender domain passes DMARC, or the sender is a known supplier `email_ap`. Anything else goes to a quarantine list the user approves.
- **Untrusted content.** Email bodies are never sent to Maya as instructions (`05-ai.md` §3.3). Only attachments are extracted. HTML is stripped.
- **Cost.** Inbound is included in Postmark Pro; extraction cost per invoice as in `05-ai.md` §1.3.

## 4. Account holder

Triplanet holds the Postmark account. Each customer verifies their own sending domain.
