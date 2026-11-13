# 11 · Open questions for the owner

Each question has a recommended answer, marked ★. Questions are ordered by how much the answer changes the plan.

**Q1. Default variant before the audit**

- a) ★ Plan for B (greenfield); switch to A only if all six audit gates pass (`01-architecture.md` §1)
- b) Plan for A; switch to B only if the audit fails
- c) Decide after the audit, with no default work started

**Q3. Engineering team from January**

- a) ★ 3 engineers (2 senior + 1 mid contractor), each driving Claude Code: pilot ~late April (B)
- b) 2 engineers: pilot ~mid-June (B), or late April only via A
- c) 1 engineer + Claude Code: pilot ~Q3 2027

**Q2. Israel in the pilot scope**

- a) ★ No. US only until GA. The Israeli pilot agencies keep using the current product
- b) Yes, with the customer's ERP issuing tax invoices (no ITA registration for Triplanet)
- c) Yes, with Triplanet issuing Israeli tax invoices (ITA software registration + SHAAM, about 10 extra days + elapsed time)

**Q6. Which feature the existing team's trial sprint covers**

- a) ★ Invoice extraction + matching on real invoices: the riskiest, and the core of the value
- b) The QuickBooks sync
- c) Maya live

**Q9. Traveller payments (Stripe Connect)**

- a) ★ Phase 2, after a payments-counsel letter (direct charges only)
- b) Never: operators keep their own processor; Triplanet stays subscription-only
- c) In the MVP (not recommended: money-transmission and Seller of Travel exposure before the pen test)

**Q15. Passport data in the pilot**

- a) ★ Off until the pen-test retest passes
- b) Allowed from pilot day 1 (encrypted)

**Q4. Selling entity for US customers**

- a) ★ A US company (e.g. a Delaware C-corp) contracts with US customers
- b) The Israeli company contracts directly (0% VAT on export of services needs a VAT opinion)
- c) Both, by market

**Q5. Pilot price per company per month** (the strategy deck's band is $400-800)

- a) $400
- b) ★ $600
- c) $800
- d) Free pilot, then paid

**Q7. Commission basis in profit figures**

- a) ★ Planned cost (as in the demo: commission = comm% × planned cost)
- b) Invoiced cost
- c) Contract-specific

**Q8. Privacy protection officer (DPO)**

- a) Appoint an external DPO now
- b) ★ Appoint one when the first Israeli tenant holds health/diet data
- c) Not needed while US-only (counsel to confirm `08-compliance.md` IL-14)

**Q10. Xero's "no AI" developer terms**

- a) ★ Get a counsel opinion before building Xero (phase 2)
- b) Build Xero, but exclude Xero-sourced data from Maya entirely
- c) Drop Xero

**Q11. Cyber / E&O insurance**

- a) ★ Before the first pilot loads real data
- b) At GA
- c) Not now

**Q12. GDPR**

- a) ★ Switch on per tenant when an operator markets to EU residents (EU representative + SCCs then)
- b) Design and contract for GDPR from day 1 for everyone
- c) Exclude EU-marketing operators in 2027

**Q13. SOC 2 trigger**

- a) ★ Start Type I when the first deal requires it
- b) Start Type I at GA regardless
- c) Not in 2027

**Q16. Claims at IITA/ABA**

- a) ★ Quote only the trial sprint's measured accuracy, with the set size and date
- b) No accuracy numbers at the shows

**Q17. Model for Maya and extraction**

- a) ★ Claude Opus 5.5 (effort low) for both; switch extraction down only if the evaluation holds
- b) Sonnet 5.5 for Maya from the start, to halve its cost

**Q18. The demo's fixed "today" (20 Oct 2026)**

- a) ★ Keep it for the February shows (moving it re-baselines every dated figure)
- b) Move it to the show week
