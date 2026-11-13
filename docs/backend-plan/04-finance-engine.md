# 04 · Finance engine

The finance engine is the part of Triplanet that buyers pay for: planned versus expected profit per departure, supplier-invoice gaps, and the profit-leak bridge. This file pulls the rules out of the demo, states the invariants and the representation of money, and sets out the test plan that ports `check6.js`.

Labels: `[verified - source]`, `[estimate]`, `[unverified]`. Code references point to the demo at commit `d92d52a`.

## 1. Shape of the module

- **What it is.** A pure TypeScript package, `@triplanet/finance`. It has no I/O, no clock and no database. Every function takes plain, typed inputs and returns plain outputs.
- **Versioning.** The package carries `ENGINE_VERSION` (semver).
  - Every stored computed figure records the engine version that produced it: snapshots, leak reports and posted accounting entries.
  - A change to a rule is a major or minor bump, with a migration note. A pure refactor is a patch bump and must reproduce the golden fixtures exactly.
- **Callers.**
  - The API calls the engine on read, for trip P&L, the finance dashboard and leaks.
  - Jobs call it to build snapshots, for accounting sync and Maya's tools.
  - The frontend may import the same package for instant what-if pricing in the quote editor. The server always recomputes, so the client figure is never trusted.
- **"Today" is an input.** The demo's fixed `TODAY = 2026-10-20` (`v6/s1_core.js:1`) becomes an `asOf: LocalDate` argument. The API passes the tenant's local date (tenant time zone). No engine function reads the system clock.

## 2. Money representation (decision)

**Decision: integer minor units (`bigint` in TypeScript, `bigint` columns in Postgres), always paired with an ISO 4217 currency code.** FX rates are exact decimals (`numeric(18,8)` in Postgres, a decimal library in TypeScript), and a conversion rounds once, to minor units, at the point of conversion.

Why:

1. **The identities become exact.** The demo computes in floats and rounds with `r2 = Math.round(x*100)/100` at every step (`v6/s1_core.js:9`). As a result, `check6.js` has to accept a 5-cent tolerance on the core identity (`check6.js:12`), and 5 cents × trip count on the leak bridge (`check6.js:52`). With integer cents, each line contributes integer components and the identity holds with tolerance **0**. That is the property an auditor and a pen tester's "tamper with an amount" test can verify.
2. **Accounting systems expect two-decimal amounts.** QuickBooks and Xero store amounts per line to 2 dp [unverified, but standard for USD, EUR, GBP and CAD]. Integer cents map one to one, so they post without re-rounding drift.
3. **Why not `numeric` everywhere?** `numeric` is also exact, but in JavaScript it arrives as a string and invites accidental `Number()` conversion. `bigint` cents keeps arithmetic in exact integers end to end, with a lint rule that bans `Number` arithmetic in the package.
   - Zero-decimal currencies (JPY) and three-decimal currencies (BHD/KWD/JOD — relevant for Levant trips) are handled through an exponent table per currency (ISO 4217 minor unit) [verified - ISO 4217 minor units are 0/2/3; standard].

**Rounding rule.** Half away from zero, matching the demo's `Math.round` for positive amounts. Rounding happens:

- once per line on conversion to the trip's reporting currency;
- once per line on price (cost × markup);
- once per discount;
- once per group allocation, with the last group taking the remainder, as in the demo (`v6/s1_core.js:350`).

Totals are sums of rounded line figures, never rounded sums. This is what makes the identities exact.

**Reporting currency** is per tenant (USD for US tenants, ILS possible for Israeli ones). The demo hard-codes USD.

## 3. Rules extracted from the demo

Notation: `l` = quote line, `t` = trip, `inv` = the supplier-invoice amount matched to the line, `rate` = the locked FX rate from the line's currency to the reporting currency.

### 3.1 Quote line and price

| Rule | Demo source | Production form |
|---|---|---|
| Planned cost = qty × unit cost | `planC`, `s1_core.js:78` | `plan_cost_minor = round(qty × unit_cost_minor)`; qty is `numeric(12,3)` so half-days and similar fractions work |
| Markup comes from the line override, else the trip's markup for that service type | `mkOf`, `:283` | the same; the default markups come from the client segment, then the trip, then the line |
| Price on a **cost-plus** basis = cost × (1 + mk) | `priceC`, `:284` | the same |
| Price on a **margin** basis = cost / (1 − mk) | `priceC` | the same; reject mk ≥ 100% (division by zero or negative) |
| A line converts at the locked trip rate unless it is in the reporting currency | `lrate`, `:79` | rate locked per **(trip, currency)**, not one rate per trip; see 3.4 |
| Supplier commission = comm% × planned cost, counted as **income** | `calc`, `:304` | the same; commission is earned on the planned cost, not the invoiced cost (a choice to confirm with the owner, see `11-open-questions.md` Q7) |
| Discounts per (scope, service type): % of the price base, or a fixed amount; shared lines take a flat amount, per-person lines take amount × pax; capped at the base | `discOf`, `:293` | the same |
| Comps: 1 free place per 20 pax on per-person activities | `genLines`, `:83` | a supplier contract term (`comp_policy` on the rate), not a constant |

### 3.2 Trip P&L

For each line, in reporting-currency minor units:

```
planUSD  = round(planCost × rate)
price    = round(priceC × rate)
amtDiff  = inv ? round((effAmt(inv) − planCost) × rate) : 0        // effAmt = billed − credit
fx       = (inv && inv.paid && l.cur ≠ reporting) ? round(effAmt(inv) × (inv.paidRate − rate)) : 0
fc       = planUSD + amtDiff + fx                                   // expected (forecast) cost
comm     = round(comm% × planCost × rate)
```

Trip totals are sums over lines, then:

```
rev        = Σ price − Σ discounts
planProfit = rev − Σ planUSD + Σ comm
fcProfit   = rev − Σ fc + Σ comm
```

**Invariant I1 (core identity):** `planProfit − Σ amtDiff − Σ fx − fcProfit = 0`.

This holds by construction because `fc = planUSD + amtDiff + fx` per line. With integer components it is exact.

### 3.3 Supplier-invoice gaps

Demo source: `invStatus`, `tripGaps`, `gapStats`, `kindOf` (`s1_core.js:286-341`, `s1b_labels.js:39`).

- `diff = effAmt(inv) − planCost`. If |diff| < ½ minor unit, the line is a **match**, or **credited** if a credit brought it back to plan. Otherwise it is a **gap**.
- Gap kinds:

  | Kind | Meaning |
  |---|---|
  | `rooms` | qty gap on Lodging |
  | `qty` | quantity higher than planned |
  | `rate` | unit price higher than planned |
  | `comp` | a promised comp was billed |
  | `extra` | an unplanned charge (fuel, overtime) |
  | `dup` | the same invoice billed twice |
  | `under` | billed less than planned |
  | `missing` | no invoice after the trip, with Finance/Closed stage |

- Gap states: `open → disputed → credited | accepted`. `under` gaps default to accepted at close.
- **Production change 1: many-to-many matching.** The demo attaches at most one invoice to a line (`l.inv`). Real invoices bundle several lines (rooms plus comp room on one Maple Ridge invoice, `NEN_INBOX`), and one line can be billed in parts.
  - Production uses an allocation table `invoice_line_allocation(invoice_line_id, quote_line_id, amount_minor, qty)`.
  - The effective billed amount of a quote line is the sum of its allocations minus credits allocated to it.
  - The gap kind is decided by the matcher from the qty/unit decomposition (qty differs → `qty`/`rooms`; unit differs → `rate`; billed comp line → `comp`; no matching quote line → `extra`; same supplier invoice number and amount within 180 days → `dup`).
- **Production change 2: tolerance.** Use a per-tenant tolerance (default $1.00 or 0.5%, whichever is larger) so rounding by suppliers does not flood the queue. The demo has none. [estimate — tune on the evaluation set]
- **Production change 3: the paid-rate rule.** In the demo, FX realised only counts once an invoice is **paid** (`calc`, `:303`). Keep it, and add an "FX exposure" figure for unpaid foreign-currency lines (the demo shows this as `P.fxExp`, `:386`).

### 3.4 FX lock

- A trip locks one rate per foreign currency when the quote is **won**. Demo: when a quote moves to Operations.
- Stored as `fx_lock(trip_id, currency, rate numeric(18,8), source, source_ts, locked_by, locked_at)`.
- Changing a locked rate needs an `admin` and writes an audit row with a reason. This is an accounting decision, and it moves every planned figure.
- Paid rate: the rate at which the supplier invoice was actually settled. It comes from the accounting system's bill payment when synced, or is entered manually.

### 3.5 Client payments

Demo source: `groupsCalc`, `lateInfo`, `s1_core.js:342-354`.

- Each booking group (household) owes `rev × size / pax`; the last group absorbs the rounding remainder.
- The deposit is `pct%` (default 25) due at `dep − 150 d`; the balance is due at `dep − 60 d`. Both are trip settings.
- Late = unpaid after the due date. Aging buckets are ≤30, 31-60 and >60 days.
- **Invariant I2:** Σ group amounts = trip revenue, and Σ group sizes = pax.
- Production: payments are recorded against **client invoices**, not booleans. A group can make partial payments. The demo's `depPaid`/`balPaid` flags become derived values.

### 3.6 Profit-leak model

Demo source: `leakModel`, `leakRows`, `releaseRisk`, `commPaid`, `s7_leak.js:8-53`.

- The bridge runs from planned to expected profit. Its steps are the Σ amtDiff on gap lines, grouped by kind in the order `rooms, rate, comp, dup, extra, qty, under`, then the Σ fx step.
- **Invariant I3 (bridge ties):** Σ steps + fx = Σ planProfit − Σ fcProfit, for every scope: season, per agent, per selection.
- **Invariant I4 (dimensions tie):** for the dimensions trip, agent and segment, Σ row leak = model leak. The supplier dimension is excluded; it sums to Σ amtDiff only, because FX is not a supplier's fault.
- Recoverable: positive amtDiff on open or disputed gaps. Lost: positive amtDiff on accepted gaps. Recovered: credits.
- "At risk", outside the bridge:
  - **Room-block release exposure:** the trip is in Operations, the release date (`dep − 30 d`; production uses the contract cutoff) has passed, and held > used. Exposure = (held − used) × nights × the lodging rate.
  - **Late client payments.**
  - **Missing invoices:** a line with no invoice once the trip is in Finance or Closed.
  - **Supplier commission not yet received.** The demo uses a fixed pseudo-rule, `commPaid` (`s7_leak.js:16`). Production replaces it with real `commission_receipt` records, so this figure becomes data, not a rule.

### 3.7 Trip studio (pricing parts only)

The studio builds lines with the same `genLines` and `calc` (`v6/s8_gen.js:60`), so a studio plan creates an ordinary quote. In production, the studio's output is a **draft quote**, built from the tenant's own catalog and contracted rates, not demo constants.

- **Invariant I5:** a studio-created quote satisfies I1.
- **Invariant I6:** lodging qty = rooms × nights.
- **Invariant I7:** Σ base nights = nights.

The routing and day-plan logic (bases, drive time `km × 1.12 at 100 km/h + 1 h`) belongs to a separate `@triplanet/planner` package, not the finance engine.

## 4. Things the demo does that production must NOT carry over

- Generated data, `rng` seeds and `TRIP_SPECS`: replaced by real tenant data and import.
- The fixed `TODAY`.
- `commPaid`, the hash rule.
- `brandSwap` and the real-brand guard. In production, real supplier names appear next to gaps because the data is the customer's own (see `08-compliance.md` §6).
- Float arithmetic and `r2` everywhere.
- Gap states set by randomness: in production they are set only by user actions or synced credits.

## 5. Test plan (ports `check6.js`)

| # | Test | check6 origin | Production form |
|---|---|---|---|
| T1 | I1 per trip | `ident()` line 12 | property test (fast-check): random trips, lines, invoices, credits, FX; tolerance **0** |
| T2 | I2 groups sum to revenue and pax | line 13 | property test |
| T3 | I3 bridge ties, per season and per agent | `leakIdent()` 51-57 | property test plus golden fixtures |
| T4 | I4 dimension rows tie | 53 | property test |
| T5 | the inbox flow: reading NEN's six files yields the expected gaps and expected profit | 37 | golden fixture: the demo's New England trip, as JSON, with expected outputs in cents |
| T6 | dispute and credit flows keep I1 | 39 | state-machine test (open → disputed → credited/accepted) |
| T7 | studio quotes satisfy I1, I5-I7 for every destination | 63-69 | per catalog destination in the seed tenant |
| T8 | commission owed ≤ commission total, and Σ by supplier = total | 86 | property test |
| T9 | Maya's tenant snapshot has no NaN/null and its leak total ties | 87-89 | contract test on the `get_season_summary` tool output (see `05-ai.md`) |
| T10 | **parity:** the engine reproduces the demo's numbers | new | run the demo's 20 trips through both the demo `calc` and the new engine; per-trip planProfit/fcProfit agree within 1 cent per line (the float-rounding difference); this guards the port |
| T11 | no float arithmetic | new | ESLint rule plus a type-level `Money` brand; CI fails if `number` money appears in the package |
| T12 | engine version is stamped | new | every persisted computed figure carries `engine_version` |

**Golden fixtures.** Export the demo's 20 trips (after `resetDemo()`) to JSON once, with a small script run against the built HTML, as `check6.js` does. Commit them as `packages/finance/fixtures/demo-v7/*.json`, with expected outputs in cents. They become the regression suite. Any change to an expected value needs an `ENGINE_VERSION` bump and a reviewer's sign-off.

**Coverage target:** 100% branch coverage on `@triplanet/finance`. It is small, pure and money-critical. [estimate: about 1,200-1,800 lines of TypeScript]
