# Business rules

What a backend must implement so the real product gives the same answers as this demo. Each rule has: what it does, the formula, the inputs, edge cases, the test that guards it, and a worked example with numbers computed from the built demo (`python3 build.py`, then the same node `vm` loader as `check6.js`).

Every statement is true to `v6/*.js` at commit `c250ab3`. Citation format is `file: function` (files are under `v6/`). Test citations are `check6.js:<line>` or `TEST <name>` (the names printed by `node check6.js`). Where the backend plan (`origin/claude/fervent-babbage-bkgptx`, `docs/backend-plan/04-finance-engine.md`) says the same thing, it is cited as `04 §x`; where it differs, **Difference** says so. The plan's own line numbers (e.g. `:78`) are from an older commit and have shifted; use function names.

Run state for all examples: `resetDemo()` (so every figure is reproducible). The demo's "today" is **2026-10-20**. Season totals at reset: revenue $950,103.70, planned profit $142,334.70, expected profit $138,322.99 (printed by `check6.js` as `P rev 950103.7 pp 142334.7 fp 138322.99`). If a change of yours moves these numbers, you changed a rule.

## Contents

1. Conventions and rounding
2. Pricing: markup, basis, overrides
3. Discounts
4. Overhead and brokerage
5. Planned vs expected profit and the core identity
6. FX: locked rate and fx difference
7. Commission
8. Invoice status and gap detection
9. Gap workflow: dispute, credit, accept
10. Gap statistics
11. Leak bridge
12. "At risk" items
13. Billing groups: split, deposit, balance
14. Late payments and aging
15. Cash calendar, AR next 30, AP schedule
16. Income documents
17. Tier pricing and single supplement
18. Supplier rates: season, group size, variant
19. Supplier alternatives (`altCost`), including the market anchor
20. Swap and undo guards
21. Versions
22. Room block release exposure
23. Task generation and overdue
24. Form completion
25. Permissions enforcement
26. Real-brand rule
27. Default lines for a trip (generator rules)
28. Quote workflow
29. Dashboard definitions and alerts
30. Day plan rules (overloaded day, day costs)
31. Differences from the backend plan, in one table
32. Things in the code that look inconsistent

---

## 1. Conventions and rounding

- **Money** is a float in major units. After **every** step the demo rounds to 2 dp with `r2(x) = Math.round(x*100)/100` (`s1_core.js: r2`). Totals are sums of rounded line figures (`s1_core.js: calc` accumulates `o.rev = r2(o.rev + price)`), never rounded sums.
- **Identity tolerance** in tests is 0.05 (5 cents) per trip, because of float rounding (`check6.js:12`). `04 §2` replaces this with integer minor units and tolerance 0. **Difference:** demo uses floats; backend uses `bigint` cents. Rounding is half away from zero for positive values (JS `Math.round`).
- **Percentages** are numbers (`25` = 25%).
- **Dates** are ISO strings; "late" and "overdue" mean strictly before today (`D(due) < TODAY`). A date equal to today is not late.
- **Today** is a constant in the demo. Production passes `asOf`.
- **Currency.** Everything is reported in USD. A line's cost is in the line's currency (`Line.cur`); conversion uses `lrate(t, l) = l.cur === 'USD' ? 1 : t.rate` (`s1_core.js: lrate`).

Tests: `TEST core ovh/brk` (identity after overhead and brokerage), `check6.js:12-14` (identity and group sums for all 20 trips at load), `check6.js:37,45,73` (after inbox, win, studio).

## 2. Pricing: markup, basis, overrides

**Inputs.** `Line.qty`, `Line.cost`, `Line.cur`, `Line.ov` (override %), `Trip.markups[type]`, `Trip.basis`, `Trip.rate`.

**Formulas** (`s1_core.js: planC, mkOf, priceC, calc`):

```
planC(l)      = r2(qty × cost)                          // planned cost, line currency
mk(l)         = (ov is a number) ? ov : Trip.markups[l.type]       // percent
priceC(l)     = basis == 'cost'  ? planC × (1 + mk/100)             // markup on cost
              : basis == 'price' ? planC / (1 − mk/100)             // markup "of price" = margin
price(l)      = r2(priceC × lrate)                      // USD
planUSD(l)    = r2(planC × lrate)                       // USD
```

**Edge cases.**
- An override of `''` (empty string) or a non-number means "no override". `0` is a valid override (price = cost). Input is clamped to 0 to 90 (`s6_rest.js: data-ch="ov"`, `"mk"`). With basis `price`, a markup of 90 gives price = cost / 0.1; 100 would divide by zero, so keep the clamp. `04 §3.1`: "reject mk ≥ 100%".
- Markup applies to every line of the type, including per-person lines; the Pricing screen shows per-person lines divided by pax (`s4_views.js: pCosts`).
- `extra` lines have `qty 0`, so price 0.
- Markup type `$` does not exist; the select is disabled with `%` only.
- The default markups come from the segment (`s1_core.js: SEG`): Faith 22/12/20/18/20/0, Student 20/10/18/15/15/0, Senior 25/15/20/20/20/0, Choir 20/10/18/15/15/0, Alumni 28/15/22/22/22/0 (Lodging/Transport/Guide/Activities/Meals/Insurance). Insurance is sold at cost, but earns commission (rule 7).
- 25% on cost equals a margin of 20% on price (`0.25/1.25`); 25% "of price" equals 33.3% above cost. The Pricing screen prints this sentence (`s4_views.js: pCosts`).

**Test.** `check6.js:12` (the identity depends on price and cost being derived the same way), `TEST prop formats and extras` (tier prices recompute with the same `calc`).

**Worked example.** Trip `bra` (Branson Christmas Shows, 46 travelers, 3 nights, basis cost). Line 1 "Twin rooms, 3 nights", Ozark Lakeside Lodge: 75 room-nights × $112 = **$8,400** cost; Lodging markup 25% → price **$10,500**.

| Change | Line 1 price | Trip revenue | Planned profit |
|---|---|---|---|
| As built | $10,500 | $27,854.80 | $5,216.46 |
| Basis "of price" (all types) | 8,400 / 0.75 = $11,200 | $29,101.94 | $6,463.60 |
| Override 30% on line 1 only | 8,400 × 1.30 = $10,920 | $28,274.80 | $5,636.46 |

## 3. Discounts

**Inputs.** `Trip.disc`, keys `"s|<Type>"` (shared lines) and `"p|<Type>"` (per-person lines); value `{m:'%'|'$', v}`.

**Formula** (`s1_core.js: discOf`). For each key with `v > 0`:
```
base   = Σ price of non-extra lines of that Type whose (scope == 'shared') matches the key's scope
%      : disc = r2(base × min(100, v) / 100)
$      : disc = r2(min(base, shared ? v : v × pax))      // shared: flat amount; per person: amount × pax
```
Discounts reduce revenue (`o.rev -= disc`) and the type's revenue (`o.byType[type].rev`). They do not change cost, so planned profit falls by the discount.

**Edge cases.** The discount is capped at the base (never negative revenue). Discounts are keyed on scope as well as type, so a hotel can have a shared discount and a per-person discount independently. Lines of a type with no lines in that scope have no key to type into. `v` blank or ≤ 0 means none. Permission `price.discount` exists in the matrix but is not enforced (§25).

**Test.** `TEST core ovh/brk` restores and re-checks revenue after temporary overhead; the Pricing screen (including the opened line detail) is rendered for every trip, role and language at `check6.js:21-30`; no check asserts a discount amount, so add golden fixtures (the figures below).

**Worked example.** `bra`, key `s|Lodging` (shared lodging price base $10,500, the comp driver room is $0):
- 5% → **$525** discount; revenue 27,854.80 − 525 = **$27,329.80**; planned profit $4,691.46.
- $300 flat (shared) → **$300**.
- Key `p|Activities`, `$10` per person → 10 × 46 pax = **$460** (capped at the base of per-person activities).

## 4. Overhead and brokerage

**Inputs.** `Trip.ovh`, `Trip.brk`, each `{m:'%'|'$', v, on:'both'|'shared'|'pp'}`. Absent = 0.

**Formula** (`s1_core.js: calc`, v8 block; guarded by `s10_prop.js: prSetFee`, which needs `price.edit`):
```
base.s = Σ price of shared non-extra lines − shared discounts
base.p = Σ price of per-person non-extra lines − per-person discounts
add(x) = x.m == '$' ? (x.on == 'pp' ? v × pax : v)                 // flat; "pp" multiplies by pax
                    : v/100 × ((on != 'pp' ? base.s : 0) + (on != 'shared' ? base.p : 0))
ovh    = r2(add(Trip.ovh))      → rev += ovh                       // overhead: price only
brk    = r2(add(Trip.brk))      → rev += brk, plan += brk, fc += brk   // brokerage: price AND cost
```
So **overhead raises profit by its full amount; brokerage raises revenue and cost equally and leaves planned profit unchanged** (it is a pass-through fee).

**Edge cases.** `v` is clamped to ≥ 0 and ≤ 100 for `%`, ≤ 1,000,000 for `$`. `on` is `both` by default. A flat `$` with `on:'both'` or `'shared'` is a flat trip amount (not per person). Overhead and brokerage are included in the percentage base after discounts. They are **not** added to `byType` (type revenue and type cost totals do not include them; see §32.5).

**Test.** `TEST core ovh/brk`: overhead 5% raises revenue by `5% × base`; brokerage $10 per person raises revenue by `10 × pax` and leaves planned profit unchanged; identity holds; deleting both restores revenue exactly.

**Worked example.** `bra`: overhead 5% on both → 27,854.80 × 5% = **$1,392.74**, revenue **$29,247.54**, planned profit $6,609.20. Then brokerage $10 per person (`pp`) → 10 × 46 = **$460**, revenue $29,707.54, planned cost 23,358 + 460 = $23,818, planned profit still **$6,609.20**. Overhead $500 on `shared` → **$500** flat.

## 5. Planned vs expected profit and the core identity

**Per line** (`s1_core.js: calc`), with `lr = lrate`, `pc = planC`, `e = effAmt(inv) = inv.amt − inv.credit`:
```
planUSD = r2(pc × lr)
amtDiff = inv ? r2((e − pc) × lr) : 0                      // supplier amount above (+) or below (−) plan
fx      = (inv && inv.paid && l.cur != 'USD') ? r2(e × (inv.rate − t.rate)) : 0
fc      = r2(planUSD + amtDiff + fx)                       // expected ("forecast") cost
comm    = r2(l.comm / 100 × pc × lr)
```
**Trip totals** (after discounts, overhead, brokerage):
```
rev        = Σ price − discounts + ovh + brk
plan       = Σ planUSD + brk
fc_total   = Σ fc + brk
planProfit = r2(rev − plan + comm)
fcProfit   = r2(rev − fc_total + comm)
```
**Core identity (I1):** `planProfit − amtDiff − fx − fcProfit = 0` for every trip, because `fc = planUSD + amtDiff + fx` per line and the other terms cancel. Commission is income, so it is in both profits.

**Edge cases.** A line with no invoice contributes `amtDiff = fx = 0`, so expected = planned until an invoice arrives (a missing invoice is shown, but not guessed). `extra` lines have `planUSD 0`, so their whole amount is `amtDiff`. A credit lowers `e`, so credited lines return to zero `amtDiff`. `Quote` trips are excluded from portfolio and leak totals (`s1_core.js: portfolio`, `s7_leak.js: leakModel`).

**Test.** `check6.js:12` (`ident`, tolerance 0.05) for the 20 trips at load, after reading the inbox (`:37`), after dispute and credit flows (`:39`), after a quote is won (`:45`), for studio quotes in all 16 destinations (`:65`), and after the studio creates a quote (`:73`).

**Worked example.** Trip `bra`: planned cost $23,358.00, planned profit **$5,216.46** (includes $719.66 commission). Supplier amounts are $681.00 above plan (a $201 comp driver room billed, a $480 duplicate invoice), so `amtDiff = 681`, `fx = 0`, expected cost $24,039.00, expected profit **$4,535.46**. Identity: 5,216.46 − 681.00 − 0 − 4,535.46 = **0**.

## 6. FX: locked rate and fx difference

**Inputs.** `Trip.cur`, `Trip.rate` (locked USD per 1 unit of `cur`), `Invoice.rate` (paid rate), `Invoice.paid`, `Line.cur`.

**Rules.**
- A trip has **one** locked rate. Every non-USD line converts at it. Air and insurance lines are always USD, so they ignore it (`s1_core.js: genLines`).
- Planned USD = `planC × rate`. The rate is editable on the Pricing tab (0.5 to 2) at **any** stage (`s6_rest.js: data-ch="rate"`).
- **Realized FX** counts only when the invoice is **paid**: `fx = r2(e × (inv.rate − t.rate))`, with `e = effAmt`. Positive `fx` means the agency paid more USD than planned (a loss). It is computed on the amount **after credit**.
- **Unpaid** foreign-currency lines are *exposure*, not P&L: `portfolio().fxExp[cur] = {amt (native), usd (= amt × t.rate)}`, summed over unpaid lines of non-Quote trips (`s1_core.js: portfolio`; shown by `s10_dacct.js: daFxExposure`).
- `inv.rate` in the demo is the locked rate plus a seeded random offset (−0.012 to +0.028) (`s1_core.js: mkInv`). In production it comes from the accounting system's bill payment (`04 §3.4`).

**Edge cases.** USD trips and USD lines never produce `fx`. `fx` can be negative (a gain), e.g. guide line on `irl0`. A credit received after payment changes `e` and therefore `fx`. The demo's credit action does **not** mark the invoice paid, so FX is not recognized on credits made in the UI (§32.3).

**Difference.** `04 §3.4`: one lock per (trip, currency), changeable only by an admin with an audit row and a reason; demo: one rate per trip, editable by anyone who can open Pricing.

**Test.** `check6.js:12` covers `fx` through the identity (trips `ita` and `irl0` carry non-zero realized FX; `gre` and `nia` have no paid foreign invoices yet). `check6.js:51-57` ties FX into the leak bridge (§11). `P.fxExp` currencies are printed at the end of `check6.js` (`fx [ 'CAD', 'EUR' ]`).

**Worked example.** Trip `ita` (Italy Pilgrimage Fall, EUR, locked rate **1.08**), line 9 "Group dinners (8)": 240 meals × €27 = **€6,480** planned = $6,998.40. Invoice €6,642 with a €162 credit → effective €6,480, so `amtDiff = 0`. Paid at **1.10**: `fx = 6,480 × (1.10 − 1.08) = $129.60`. Expected cost = 6,998.40 + 0 + 129.60 = **$7,128.00**. Same trip, line 4 "Airport transfers": €580 paid at 1.10 → `fx = $11.60`. Trip `ita` total `fx = $141.20`. Season FX: **$362.43**.

## 7. Commission

**Rule.** Supplier commission is **income**, earned on **planned** cost: `comm = r2(l.comm/100 × planC × lr)` (`s1_core.js: calc`). It is included in planned and expected profit. Not on invoiced cost, not reduced by credits (a choice to confirm with the owner, `04 §3.1`).

**Where `comm` comes from.** Generated lines: activities carry the venue's % (0 to 12), insurance 15%, hotels and coaches 0 on the generated lines (supplier-level `Supplier.comm` of 3 to 12% appears on alternatives and is copied to the line on swap, `s10_tbcomp.js: tbSwap`).

**Commission "not yet received"** is *not* a stored fact. `s7_leak.js: commPaid(t, l)` is a fixed hash rule: `h = Σ char codes of "<tripId>:<lineId>"`; `Closed` trips: paid when `h % 4 != 0`; others: paid when `h % 3 == 0`. Commission counts as outstanding only for lines with `comm > 0` on `Finance` or `Closed` trips that are not "paid" (`leakModel`). **Difference:** production replaces this with real receipts (`commission_receipt`, `04 §3.6`); do not port the hash.

**Tests.** `check6.js:86`: outstanding commission ≤ total commission, and Σ by supplier = total. `TEST suppliers: …` checks `0 ≤ comm ≤ 15`.

**Worked example.** `nen` line 10 "Travel protection": 42 × $79 = $3,318 planned, 15% → **$497.70** (shown as `comm: 497.7` in `calc`). `bra` line 8: 46 × $39 = $1,794 → **$269.10**. Season: commission outstanding **$2,014.17** over 7 lines.

## 8. Invoice status and gap detection

**Inputs.** `Line.inv`, `planC(l)`.

**Rule** (`s1_core.js: invStatus`):
```
no invoice                       → {k:'none', kind:'missing'}
diff = effAmt(inv) − planC(l)
|diff| < 0.005                   → {k: inv.credit ? 'credited' : 'match'}
otherwise                        → {k:'gap', diff, kind: inv.kind || (diff < 0 ? 'under' : 'rate'), st: inv.st || 'open'}
```
The label kind is `kindOf` (`s1b_labels.js`): a `qty` gap on a **Lodging** line is shown as `rooms`. Kinds and what they mean:

| Kind | Meaning | Detected how in the demo |
|---|---|---|
| `rooms` | Billed more room-nights than the rooming list | Lodging line with `inv.kind='qty'` |
| `qty` | Billed quantity above agreed | `inv.kind='qty'` |
| `rate` | Unit price above contract | `inv.kind='rate'`, or any positive diff with no kind |
| `comp` | A promised complimentary item was billed | Driver-room line (cost 0) billed; or an activity billed for all pax instead of pax − floor(pax/20) |
| `extra` | A charge not in the quote or contract | An `extra` line (fuel surcharge 4%, driver overtime $285) |
| `dup` | The same invoice billed twice | An `extra` line with `inv.ref` = the original number, same amount |
| `under` | Billed below plan | negative diff; default status `accepted` at close, else `open` |
| `missing` | No invoice after the trip | `Finance` or `Closed` trip, line without invoice (and not waiting in the inbox) |

**Important difference.** In the demo, `inv.kind` is **written by the generator** (random, or by hand for the flagship trip); the matcher does not infer it. The plan says production decides the kind from the qty/unit decomposition (`04 §3.3`): qty differs → `qty`/`rooms`; unit differs → `rate`; billed comp line → `comp`; no quote line → `extra`; same supplier invoice number and amount within 180 days → `dup`. Use that. Tolerance: demo has none (< half a cent); `04` proposes a per-tenant tolerance (default $1.00 or 0.5%).

**One invoice per line.** `Line.inv` is a single object. Real invoices bundle several lines (rooms and comp room on one hotel invoice, see `NEN_INBOX`); the demo models that as two lines each carrying a slice with the same invoice number. Production uses allocations (`04 §3.3`).

**Edge cases.** A credited gap that no longer differs from plan reads `credited` (`k`), not `gap`. A **partial** credit (not back to plan) would read `gap` with `st:'credited'` and be mis-bucketed (§9, §32.2); the demo never creates one.

**Test.** `check6.js:37-40` (the flagship trip's six files produce the expected gaps and the identity holds). `check6.js:50,55,74` (`brandGuard`).

**Worked example.** `nen` after "Read & match invoices" (`applyInbox`): six gaps totalling **$4,046.00**.

| Line | Supplier | Planned | Billed | Kind | Gap |
|---|---|---|---|---|---|
| 1 Twin rooms, 6 nights | Maple Ridge Inn | 132 × $229 = $30,228 | 138 × $229 = $31,602 | rooms | $1,374 |
| 2 Driver room (comp) | Maple Ridge Inn | $0 | 6 × $129 = $774 | comp | $774 |
| 6 Scenic railroad | Notch Scenic Railroad | 40 × $45 = $1,800 | 40 × $52 = $2,080 | rate | $280 |
| 7 Lobster bake | Maine Coast Bakes | 40 × $72 = $2,880 | 46 × $72 = $3,312 | qty | $432 |
| 11 Fuel surcharge (4%) | Yankee Coach Lines | $0 | $406 | extra | $406 |
| 12 Duplicate of INV-0412 | Foliage Step-On Guides | $0 | $780 | dup | $780 |

Planned profit stays **$15,337.80**; expected profit falls from $15,337.80 to **$11,291.80** (12.31% margin).

## 9. Gap workflow: dispute, credit, accept

**Statuses** (`Invoice.st`): `open → disputed → credited | accepted`; `open → accepted`; `disputed → accepted`. No other moves.

**Actions** (`s6_rest.js`, buttons from `s5_fin.js: gapCard`):

| Action | Allowed when | Effect |
|---|---|---|
| Draft dispute (`gapdisp`) | gap `open` with positive diff | Opens the generated email (`s5_fin.js: disputeMail`); no state change |
| Mark as sent (`gapsent`) | `open` | `inv.st = 'disputed'` |
| Credit received (`gapcred`) | `disputed` | `amt = effAmt − planC`; `inv.credit += amt`; `inv.st = 'credited'`. The credit always brings the line back to plan |
| Accept charge (`gapacc`) | `open` or `disputed` | `inv.st = 'accepted'`: the money is lost |
| Checked, nothing missing (`gapacc`) | `under` gaps, `open` | `inv.st = 'accepted'` |

Credit amount shown in the toast is `usd(amt × lrate)`. Reading the inbox creates all new gaps with `st='open'` (`s1_core.js: applyInboxFile`).

**Edge cases.** The demo has no partial credits and no credit larger than the gap. A credit does not set `inv.paid` (the generator's `settle` does, §32.3). No timestamps, actors or dispute history are kept. The dispute text is always English.

**Tests.** `check6.js:39` flips half the flagship gaps to disputed and half to credited and re-checks the identity. `TEST sp …` covers supplier performance from gap stats.

**Worked example.** `nen` gap 1 (Maple Ridge rooms, $1,374): "Mark as sent" → `disputed`; "Credit received" → credit = 31,602 − 30,228 = **$1,374**, `credited`; the line's `amtDiff` returns to 0 and expected profit rises by $1,374.

## 10. Gap statistics

`s1_core.js: gapStats(ts)` over non-Quote trips (`stage != 'Quote'`):

```
expected = count of non-extra lines;  received = lines with an invoice;  matched = lines with k == 'match'
missing  = lines with no invoice, not extra, not waiting in Trip.inbox, on Finance or Closed trips
for each gap or credited line g (usd = (credited ? credit : diff) × lr):
   credited                → rec  += usd
   usd < 0                 → under += usd            (billed below plan)
   st == 'open'            → open += usd
   st == 'disputed'        → disp += usd
   else (accepted)         → acc  += usd
   byKind[kind] / bySup[supplier] += orig  only when orig > 0       // orig = gap in the line currency before credit
```
**Edge cases.** `under` is decided by sign (`usd < 0`), not by kind. `byKind` and `bySup` count only positive original gaps and include credited ones, so they show all overbilling ever found, not only open items. `rec` for credited lines uses the credit amount.

**Test.** `check6.js:20` prints the reset values; `TEST da accountant dashboard` recomputes counts from the same functions.

**Worked example.** At reset: open **$3,331.48** (5 gaps), disputed **$361.80** (2), accepted **$88.00** (1), recovered **$4,838.44** (8 credits), under **−$132.00** (1), missing invoices **2**, matched **70** of **87** invoices received against **133** expected lines. By kind (original gap): comp 6 / $1,371, dup 1 / $480, rate 3 / $2,527, qty 5 / $3,933.92, extra 1 / $307.80.

## 11. Leak bridge

**Purpose.** Explain where planned profit went. `s7_leak.js: leakModel(ts)`; screen `leaks` (Profit leaks).

**Formula.**
```
leak      = Σ planProfit − Σ fcProfit           over non-Quote trips
bridge    = steps (Σ amtDiff on gap lines, grouped by kind, in order rooms, rate, comp, dup, extra, qty, under) + fx step
Σ steps + fx = leak                                  // identity I3
```
Per-trip `row.leak = planProfit − fcProfit`. Dimensions (`leakRows`): by trip, agent, segment and supplier. For trip, agent and segment `Σ row.leak = leak` (identity I4). The **supplier** dimension sums to Σ amtDiff only: FX is not a supplier's fault, and credited lines are listed under `got`.

Classification of each positive-difference gap line: **recoverable** (`rec`) = status `open` or `disputed`; **lost** = status `accepted`; **recovered** (`got`) = credited lines (credit in USD).

**Edge cases.** The chart starts at $0 (no truncated axis). Negative steps (`under`) reduce the leak. A trip with no invoices has leak 0. Credited lines have `amtDiff 0`, so they are not in the steps; their value is in `got`. A partial credit with status `credited` would fall into `lost` (§32.2).

**Tests.** `check6.js:51-57` (`leakIdent`): bridge ties per season, per agent (all six), and after reading the inbox (`:74`); every dimension except supplier ties; tolerance 0.05 × trip count.

**Worked example (season, 14 non-Quote trips).** Planned profit $142,334.70, expected $138,322.99, **leak $4,011.71**.

| Step | Amount | Gaps |
|---|---|---|
| rooms | $1,140.48 | 1 |
| rate | $960.00 | 1 |
| comp | $751.00 | 2 |
| dup | $480.00 | 1 |
| extra | $307.80 | 1 |
| qty | $142.00 | 2 |
| under | −$132.00 | 1 |
| Σ supplier differences | **$3,649.28** | |
| FX | **$362.43** | |
| **Total** | **$4,011.71** | |

Recoverable $3,693.28 (7 gaps), lost $88.00 (1), recovered $4,838.44 (8 credits). By agent: Luis $1,785.23, Marcus $1,589.48, Dana $769.00, Tom $0, Priya $0, Grace −$132.00; sum **$4,011.71**. Top supplier by overbilling: Canyon Rim Lodge $1,510 (all recoverable).

## 12. "At risk" items

Shown beside the bridge, **never inside it** (`s7_leak.js` header comment). They are not yet in the books.

| Item | Rule | Source |
|---|---|---|
| Room-block release exposure | §22 | `releaseRisk` |
| Late client payments | `Σ groupsCalc(t).late` (§14) over non-Quote trips | `leakModel`: `M.late`, `M.lateN` |
| Missing invoices | `gapStats().missing` (§10) | `M.missing` |
| Supplier commission not yet received | §7 | `M.comm`, `M.commSup` |

**Worked example (season).** Release exposure **$1,386.00** (1 trip), late client payments **$13,253.97** (13 groups), missing invoices **2**, commission not yet received **$2,014.17** (7 lines).

**Test.** `TEST people travelers+blocks` (exposure equals `releaseRisk`), `check6.js:86` (commission).

## 13. Billing groups: split, deposit, balance

**Inputs.** `Trip.groups[]` (household `size`), `Trip.pax`, trip revenue `rev` (from `calc`), `Trip.pct`, `depDue`, `balDue`.

**Rule** (`s1_core.js: groupsCalc`):
```
group.amt  = r2(rev × size / pax)                         // each household's share of the final price
last group.amt += r2(rev − Σ amt)                         // the last group absorbs the rounding remainder
group.dep  = r2(amt × pct/100);   group.bal = r2(amt − dep)
paid       = r2((depPaid ? dep : 0) + (balPaid ? bal : 0));   open = r2(amt − paid)
collected  = Σ paid;  outstanding = r2(rev − collected);  perHead = r2(rev / pax)
```
Defaults: deposit 25% due `dep − 150 d`; balance due `dep − 60 d` (`s1_core.js: buildTrip`; a blank quote uses today + 60 d and today + 150 d).

**Invariants (I2).** Σ `amt` = `rev` and Σ `size` = `pax`, for every non-Quote trip with groups (`check6.js:12-13`).

**Edge cases.** The split is by head, not by room type: the Billing tab says shared costs "are split equally" (`s4_views.js: pPeople`). The demo has no partial payments, no single-supplement or per-household price, and no refunds. Payment flags are generated (`s1_core.js: buildTrip`): Finance and Closed trips are fully paid; Operations trips depend on whether the due dates have passed.

**Worked example.** `ita` (30 travelers, 21 households, revenue **$85,639.98**): a one-person household owes 85,639.98 × 1/30 = **$2,854.67**; the last household (2 travelers) would owe 5,709.33, but absorbs the remainder and owes **$5,709.30**, so Σ = $85,639.98. `nen` (42 travelers, 28 households, revenue $91,728.10): Baker household (2 travelers) owes $4,368.00 = deposit $1,092.00 (25%) + balance $3,276.00.

## 14. Late payments and aging

**Late rule** (`s1_core.js: lateInfo`). For a household: if the deposit is unpaid and `depDue < today`, its amount is late, days late = `floor((today − depDue)/day)`; same for the balance with `balDue`. `late = Σ late amounts`, `days = max(days of the late installments)`.

**Aging** (`s1_core.js: portfolio`): each late household goes into **one** bucket by its `days`: ≤ 30, 31 to 60, > 60. The bucket receives the household's **whole** late amount, even if only the older installment is over 60 days.

**Edge cases.** `days` counts calendar days between midnights; a due date of "yesterday" is 1 day late. Production should age each installment separately (the demo's bucket choice is a simplification). Late amounts of a trip are in `groupsCalc(t).late`; portfolio `late` and `lateN` count households, not trips.

**Test.** `check6.js:12-13` (groups tie), `TEST da accountant dashboard` (`daOverdue` buckets recomputed).

**Worked example.** Trip `bra`, deposit due 2026-07-03, balance due 2026-10-01. "Turner household" (amount $1,211.08: deposit $302.77, balance $908.31) paid nothing: both installments late, `days = max(109, 19) = 109` → bucket **> 60**, late amount **$1,211.08**. "Graham household" paid the deposit only: balance $908.31 is 19 days late → bucket **≤ 30**. Season aging: ≤ 30 days **$2,724.93** (3 households), 31 to 60 **$9,317.96** (9), > 60 **$1,211.08** (1); total **$13,253.97** in 13 households. Outstanding on all non-Quote trips: $303,135.90 of $950,103.70.

## 15. Cash calendar, AR next 30, AP schedule

All in `s1_core.js: portfolio` (monthly cash calendar) and `s10_dacct.js` (accountant's views; spec definitions A19).

**Cash calendar** (`portfolio().cash[month]`, 12 months from Oct 2026):
- *in*: for each **unpaid** deposit, `dep` in the month of `depDue`; for each unpaid balance, `bal` in the month of `balDue`. Past dates clamp to the current month (`monthKey`).
- *out*: for each line whose invoice is not paid (or no invoice), `(effAmt or planC) × lrate` in the month of: **today + 20 days** when the trip is Finance or Closed; **departure − 14 days** otherwise; clamped to the current month if earlier.

**AR next 30** (`daArNext30`): unpaid deposit or balance with amount > 0 and due date in `[today, today + 30 d]`. Overdue is separate (§14). Sorted by due date, then amount descending.

**AP schedule** (`daApItems`, `daApWeeks`): every unpaid supplier line of non-Quote trips (invoice not paid), amount = `effAmt` or `planC`, × `lrate`, dated by the rule above and clamped to today; grouped in **7-day weeks counted from today** (`week = floor(max(0, daysFromToday)/7)`); 8 weeks are shown, the rest is "later". Foreign currency is also totalled in its native currency per week.

**Other accountant figures:** bills to approve = unpaid invoices that are an exact `match` and not yet approved in `DA_STATE.ap`; deal invoices to issue = `incomeDocs` of type `deal` with status `req` not yet in `DA_STATE.iss` (§16); month-end checklist: 8 items, each done when its count is 0 (`daMonthEnd`: match, missing, gaps, approve, issue, overdue, commission, FX).

**Edge cases.** The demo's payment dates are rules, not data (suppliers' real terms exist: `Supplier.terms`, but are not used here). "Approve" and "Issue" only add keys to a list; nothing is posted, unless the simulated accounting sync is connected (`s10_dacct.js: daApprove` logs a post).

**Test.** `TEST da accountant dashboard` recomputes each figure from `portfolio`, `groupsCalc`, `gapStats`, `incomeDocs` and `leakModel`.

**Worked example (reset).** AR next 30 (2026-10-20 to 2026-11-19): **$10,108.83** in 32 installments (first: Upton, Johnson and Lawson households of `dc1`, deposit $561.60 each, due 2026-10-23). AP schedule: eight-week total **$179,185.44** in 40 lines of $326,034.61 open; week of 2026-10-27 **$24,226.00** (8 lines), week of 2026-11-03 **$132,714.44** (24 lines, mostly Finance and Closed trips paid on today + 20 = 2026-11-09), week of 2026-11-10 **$22,245.00**; later **$146,849.17**. Bills to approve: 16, **$55,894.96**. Deal invoices to issue: 46, **$23,362.80**. FX exposure: EUR 61,009 = **$65,551.81**, CAD 33,340 = **$24,004.80**, total **$89,556.61**.

## 16. Income documents

**Rule** (`s7b_product.js: incomeDocs`). For each household and each installment (deposit with `depDue`, balance with `balDue`) with amount > 0:
- A document exists only if the installment is **paid** or its due date is on or before **today + 30 days**.
- A **deal invoice** (`type 'deal'`) is dated `due − 21 days`, status `paid` if the installment is paid, else `req` (payment requested).
- If paid, a **receipt** (`type 'receipt'`, shown as "Tax invoice") is also created, dated the due date, status `paid`.
- Numbers: deals `90001 + (trip.no % 50) × 20` counting up; receipts `70001 + …`.
- Totals footer: trip total = `calc(t).rev`; billed = Σ deal amounts; received = `groupsCalc().collected`; remaining = outstanding.

**Edge cases.** Nothing is stored, so numbering changes if the trip number changes and a document disappears if the due date moves. "Issue document" is a toast only (`data-act="toast"`). Sales tax is not modeled; `ST_ORG.tax` is preview-only. Hebrew labels it "tax invoice receipt", English "Tax invoice" (§32.7).

**Test.** `TEST st settings` and `TEST da accountant dashboard` (documents to issue).

**Worked example.** `nas` (deposit due 2026-06-16, balance due 2026-09-14, 28 households): 106 documents. Davis household: deposit $174.09 paid → deal invoice 90081 (2026-05-26) + receipt 70081 (2026-06-16); balance $522.25 unpaid → deal invoice 90082 dated 2026-08-24, **requested** (due date is already in the past). Billed $30,639.00 (= trip total), received **$26,460.98** = collected.

## 17. Tier pricing and single supplement

**Tier table** (`s10_prop.js: prRows`, `prTierCalc`): price per traveler for hypothetical group sizes `10, 15, 20, 25, 30, 40` plus the real size. For size `n`: deep-copy the trip (the real one is untouched), regenerate default lines at the real size and at `n` (`genLines`), scale every real line's `qty` by `qty_n / qty_real` for the same `type|name` and its `cost` by `cost_n / cost_real` (coach price steps up above 50 travelers), non-matching per-person lines scale by `n / pax`, non-matching room-night lines scale by `ceil(qty × n / pax)`, drop invoices, then `calc`. Price per traveler = `r2(rev / n)`. Free places = `floor(n / 20)`.

**Single supplement** (`prSingleSupp`): only for segments Faith, Senior, Alumni (twin occupancy). `= r2(price of first lodging line / qty × nights × 0.5)`, i.e. half of the marked-up room-night price for the whole stay. Students and choirs: none.

**Edge cases.** Markups, overrides, discounts, overhead and brokerage come from the real trip, so overhead as a flat `$` does not scale with `n`. If generation fails, the tier falls back to a copy with scaled quantities. Price per traveler falls as `n` grows because shared costs are spread over more heads.

**Test.** `TEST prop formats and extras` (tier rows, single supplement, accept flow, overhead/brokerage setting).

**Worked example.** `can` (Prairie State Alumni Grand Canyon, 28 travelers, 5 nights, Alumni): price per traveler at 10 = **$2,814.30**, 15 = $2,368.90, 20 = $2,184.46 (1 free place), 25 = $2,090.29, 30 = $1,988.26, 40 = $1,909.29 (2 free places); the trip's own size (28) = **$2,016.29**, total $56,456.12. Single supplement **$588.80**.

## 18. Supplier rates: season, group size, variant

**Formula** (`s1d_data.js: sdRaw, rateFor, rateCard`):
```
rate(s, date, pax, variant) = round( base × (seasonMult + jitter) × bandMult × variant.mult )
seasonMult: Low 0.90, Shoulder 1.00, High 1.12      seasons by month: Low = Jan, Feb, Nov; Shoulder = Mar, Apr, Oct, Dec; High = May to Sep
jitter      = ((hash(supplierId + '|' + season) % 81) − 40) / 1000        // ±0.04, deterministic per supplier and season
bandMult    = [1.04, 1.00, 0.97, 0.95] for bands 10-19, 20-34, 35-49, 50-60 — applies only when unit is room-night, person or meal; day and transfer units are flat
```
A rate card is the full grid: 3 seasons × 4 bands × variants (hotel: 12 × 4 = 48 rows).

**Difference.** Production stores real contracted rates (`rate`, `rate_band` with an exclusion constraint so bands never overlap, `02-data-model.md` §3.4). The multipliers and jitter are demo inventions; keep only the *shape* (season × group size × variant).

**Test.** `TEST suppliers: …`: `rateCard` rows equal `12 × variants`, each row equals `rateFor`, High > Low, season and band lookups.

**Worked example.** Hilton Nashville Downtown (real hotel, base **$229**, jitters Low +0.001, Shoulder +0.038, High −0.027): 40 travelers (band 35 to 49, ×0.97) twin room: Low season **$200**, Shoulder (Apr) **$231**, High (Jul) **$243**; 15 travelers in July (band 10 to 19, ×1.04) **$260**; quad room, 40 travelers, July **$296** (×1.22). Galilee Star Coaches (base $760/day): July **$851** at both 15 and 40 travelers (day unit: no band multiplier).

## 19. Supplier alternatives (`altCost`), including the market anchor

**Purpose.** For one trip line, list the incumbent and other suppliers with a comparable unit cost and the effect on planned profit (Price comparison, By components view).

**Candidates** (`s1d_data.js: altsFor`): the incumbent first (cost = `line.cost` exactly), then all suppliers of the same destination and sub-category (air and insurance: the global desks), excluding the incumbent; sorted by `cost`, then name. **Activities are exempt** (only the incumbent). **Lodging** is capped at the 5 candidates closest to the incumbent's `base` by `|ln(base / incumbentBase)|`, and at least one must be fictional (the 5th slot is replaced by the closest fictional one if needed).

**Cost** (`altCost(t, line, sup)`):
```
den  = rate(incumbent, trip.dep, trip.pax) × BASE_RATE[incumbent.cur]         // incumbent's modelled rate, USD
lc   = line.cost × BASE_RATE[line.cur]                                         // the line's actual cost, USD
if incumbent.real and lc > 0 and |den − lc| / lc > 0.15:                       // MARKET ANCHOR
      den = median of rate(x, dep, pax) × BASE_RATE[x.cur]  for x in the FICTIONAL suppliers of the same destination, category and sub-category
cost(sup) = round( line.cost × rate(sup, dep, pax) × BASE_RATE[sup.cur] / den )     // in the line's currency
```
If `den ≤ 0` the line cost is returned. The current supplier always returns `line.cost` exactly. `delta = r2((cost − line.cost) × qty × lr)`, with `lr = trip.rate` (or `BASE_RATE` when the trip has none). Note `BASE_RATE` (static: EUR 1.08, GBP 1.27, CAD 0.73) is used for the cross-currency ratios, not the trip's locked rate.

**Why the market anchor exists.** `brandSwap` (§26) relabels a trip's lodging line with a real catalog hotel but **keeps the line's cost**. Then the real hotel's catalog rate and the line cost can differ a lot, and comparing alternatives to the brand's catalog rate would produce huge, false "savings". When the gap is over 15%, alternatives anchor on the median fictional supplier instead. **Production note:** this is a demo artefact. A real tenant's lines are priced from the contracted rate of the real supplier, so no anchor is needed; keep only the comparison idea.

**Edge cases.** An unknown incumbent (studio or blank quote supplier not in `SUPPLIERS`) is synthesized priced like the market reference of its family (`incumbentOf`), so there are always at least 3 options; the synthetic supplier is never added to `SUPPLIERS`. All options are in the line's currency; a third currency is rejected by test.

**Test.** `TEST suppliers: data, coverage, rates, real-brand rules`: ≥ 3 options for every covered line (143 lines, min 3), incumbent first and exact, sorted, no duplicates, `delta` finite, no third currency, synthetic incumbent works. `TEST tbcomp swaps and versions`, `TEST sp …`.

**Worked example (market anchor).** Trip `rom` (32 travelers, departs 2027-04-19, Shoulder season, band 20 to 34): lodging line "Twin rooms, 8 nights" is labelled **Sheraton Rome Parco de' Medici** (a real hotel, catalog base €189) with line cost **€132**, 128 room-nights.
- Modelled rate `den` = 189 × (1.0 + jitter) × 1.00 × 1.08 = **$204.12**; actual line cost `lc` = 132 × 1.08 = **$142.56**. Deviation (204.12 − 142.56) / 142.56 = **43.2%** > 15%, so the anchor switches to the median of the 3 fictional Rome hotels, **$147.41**.
- Result: Casa San Pietro Hotel (fictional, base €132) → **€132**, delta $0 (commission 9%); Trastevere Suites (fictional, base €148) → **€145**, delta +128 × €13 × 1.09 = **+$1,813.76**; real alternatives are priced the same way (Holiday Inn Rome - Aurelia €146 / +$1,953.28, NH Collection Roma Centro €188, Hilton Rome Airport €194).
- Eleven trips are relabelled with a real hotel; 7 of them exceed the 15% threshold (`rom, irl, lon, nia, gre, hl2, nsh`).

## 20. Swap and undo guards

`s10_tbcomp.js: tbSwap(t, lineId, supId)` and `tbUndo(t, lineId)`. Both return `{ok, delta, reason}`.

| Guard (in this order) | Reason code |
|---|---|
| Line exists | `line` |
| `tbSwap`: line has **no invoice** (`l.inv` null) | `invoiced` |
| `tbSwap`: `stage` is `Quote` or `Operations` | `stage` |
| The target is in `altsFor(t, line)` | `unknown` |
| Target is not the current supplier | `same` |
| Target is the original supplier (`alt0`) → performs `tbUndo` | |
| `tbUndo`: an original exists (`alt0`) | `nothing` |
| `tbUndo`: line has no invoice | `invoiced` |

**Effect.** First swap saves `alt0 = {sup, cost, comm}`; `l.sup`, `l.cost`, `l.comm` take the alternative's values. A second swap (B to C) **keeps the first `alt0`**, so Undo always returns to the **original**, not the previous supplier. `delta` = change in **planned profit** (it includes the commission change: a cheaper supplier with higher commission moves profit twice). Side effects: the trip's supplier list is synced (`tbcSupSync`: the old entry is renamed to the new supplier if no other line uses the old one; its status resets to `Sent` in Operations, `Not sent` in Quotation), and the room block hotel follows if it was the old hotel (`tbcRoomSync`).

**Permissions.** The By-components buttons check `price.edit` (`tbcCan`); the Price-comparison "Choose" checks `sup.swap`, `ops.suppliers` and also refuses when the supplier is already **Approved**, or the trip is **Closed** (`s10_sup.js: spChooseWhy`). `tbSwap` itself checks none of these (§32.4).

**Test.** `TEST tbcomp swaps and versions`; `TEST sp suppliers table, cards, in-trip flow, client card`.

**Worked example.** `rom` lodging line, swap Sheraton → Casa San Pietro Hotel: line cost stays €132, commission 0% → 9%; planned profit **$12,562.43 → $14,219.93**, delta **+$1,657.50** (= 9% × 128 × €132 × 1.09, all from commission). Undo: delta **−$1,657.50**, profit back to $12,562.43, `alt0` removed. On `nen` (Finance stage) a swap returns `stage`; on a line with an invoice, `invoiced`.

## 21. Versions

`s10_tbcomp.js`. **Quote stage only.**
- **Save** (`tbVerSave`): `v = max(v) + 1`, snapshot of every line's `{id, sup, qty, cost, cur, comm, ov}`, markups, discounts, overhead, brokerage and frozen totals `{rev, plan, planProfit, comm}`; label defaults to `Version n`.
- **Restore** (`tbVerRestore`): for each line **id present in the snapshot and still on the trip**, copy the saved values and delete `alt0`; lines added later keep their current values; lines in the snapshot but deleted are ignored. Replace markups, discounts, overhead and brokerage; rebuild the supplier list (`tbcSupRebuild`); set the room-block hotel to the first line's supplier when that line is Lodging. Totals of the live trip are recomputed by `calc`, not read from the snapshot.
- **Diff** (`tbVerDiff`): compares per line id `sup, qty, cost, cur, comm, ov`, then markups, discount keys, overhead, brokerage, then the four totals. `empty` is true when there is no difference and every total delta < 0.005.

**Edge cases.** A snapshot does not store line *names* or added/removed lines. In production, a sent quote should be immutable and edits create a new version (`02-data-model.md` §3.2 `quote_version`).

**Test.** `TEST tbcomp swaps and versions`.

**Worked example.** `hl` (Grace Fellowship Holy Land): v1 "First draft" (2026-10-11): revenue **$130,930.74**, planned profit $18,167.04, commission $507.30. v2 (2026-10-14) swaps Dan Jerusalem ($205) for Leonardo Club Hotel Tiberias ($161): revenue **$121,751.46** (−$9,179.28), planned cost −$7,524, planned profit **$19,264.86** (+$1,097.82) because commission income rises from $507.30 to $3,260.40. Restoring v1 returns revenue to $130,930.74 and the supplier to Dan Jerusalem.

## 22. Room block release exposure

`s7_leak.js: releaseRisk(t)`; `s1e_people.js: blockOf`.

```
applies when:  stage == 'Operations'  and  room exists
releaseDate = departure − 30 days
open        = held − used
exposure    = open > 0 and releaseDate < today ? r2(open × nights × lodging.cost × lrate) : none
              (lodging = the first Lodging line with cost > 0)
```
`blockOf(t)` adds `cutoff = departure − 30 d`, `attrition = open / held × 100`, and `types` (rooms by type: from travelers' `roomType`, or from pax and occupancy when none). The cutoff is a fixed rule, not a contract date.

**Edge cases.** Only Operations trips; a trip whose release date has not passed has no exposure even if rooms are unused. Uses the *planned* lodging cost and the whole stay (`nights`), the worst case. Production: use the contract cutoff, attrition allowance and release schedule (`02-data-model.md` §3.4 `room_block`).

**Test.** `TEST people travelers+blocks` (block fields, exposure equals `releaseRisk`, block type counts equal distinct rooms, at least one trip with exposure).

**Worked example.** `nas` (Nashville Gospel Weekend, departs 2026-11-13, 3 nights, Music Row Inn): 25 rooms held, 22 used → open 3; release date **2026-10-14** is before today; lodging cost $154. Exposure = 3 × 3 × $154 × 1 = **$1,386.00**. Attrition 12%.

## 23. Task generation and overdue

**Generation.**
- *Original 12 tasks* (`s1_core.js: genTasks`, `TASKT`): none for `Quote` trips. `due = dep − offset` days (offsets 30, 30, 21, 75 (international only), 30, 45, 14, 10, 21, 14, 100, 7). Owner: every third task (`i % 3 === 0`) is `Ops desk`, the rest the trip's agent. `done`: always true for Finance and Closed; for Operations, if the due date is past 70% done, else 5%.
- *Library of 48* (`s10_ops.js: TASK_LIB`, `opInit`): runs for every non-Quote trip, idempotent (skips when any task id ≥ 101 exists). Due = `dep + offset` (negative before), or `return day + offset` for the `aft` window. Owner `a` = agent, `o` = Ops desk, `f` = Accountant. International-only tasks (t05 air, t08 passport and visa, t16 airport transfers) are skipped for domestic trips. Done: Finance and Closed true; Operations: a freshly won quote (no task done yet) all false; otherwise past-due 85% done, future 5% done. The task `win` is the window of the library row; original tasks get a window from distance to departure (> 60 days prim, > 30 w60, > 14 w30, else w14).
- *Won quote* (`s6_rest.js: winQuote`): original tasks regenerated all open.

**Overdue** (`s10_ops.js: opStat`): `done` → done; else `due < today` → **overdue**; else open. "Urgent" on the Operation dashboard = open tasks due by today + 7 days (`s7b_product.js: pOpsDash`). The task list sorts by due date.

**Edge cases.** Done tasks never become overdue. A future-dated task due today is open. Overdue counts feed alerts (`s1b_labels.js: alertsFor`: trip departs within 60 days with ≥ 1 overdue task) and readiness.

**Test.** `TEST ops tasks, master list, blocks`; `check6.js` renders every trip's tabs in both languages and roles.

**Worked example.** `nas` has **56 tasks** (11 original + 45 library; 3 international-only library tasks and the original passport-copy task are skipped): 22 done, 33 open, **1 overdue**: task 115 "Reconfirm hotel and coach in writing", owner Ops desk, due **2026-10-09** (= departure 2026-11-13 − 35 days) and not done. Window counts: prim 8, w60 7, w30 13, w14 11, box 5, dur 5, aft 7.

## 24. Form completion

**Per traveler** (`Traveler.form`, `s1e_people.js: tripExtras`): `{reg, med, waiver}` each `done | sent | not sent`.
- Non-Operations trips: all `done` (travel is over, or it is a closed file).
- Operations trips: `p = pf` by days to departure (> 90 days 0.4; 30 to 90 days 0.65; < 30 days 0.9) scaled by form (reg `min(1, pf + 0.1)`, med `pf × 0.9`, waiver `pf × 0.8`); with a fixed number of random draws per traveler so a partly filled record never shifts the rest: `r < p` → done; `r < p + (1 − p) × 0.55` → sent; else not sent.
- A fourth form (`room`) reads `done` when the registration is done, else `not sent` (`s10_fbuild.js: fbSt`).

**Send** (`opSendForms`, `fbSend`): changes only `not sent` to `sent`, returns how many, copies the form link. Idempotent. A traveler form never goes back from `done`.

**Completion percentage.** `dbReadiness` (§29) treats passports separately (`pass != 'Missing'`, international trips only); the Master list KPI counts forms done per traveler. A form counts as complete only when all travelers have it `done`; pending travelers are listed by `s10_dash.js: dbFormsPending`.

**Validation of entity forms** (`s10_forms.js: formValidate`): required (toggles are never "empty"), email, phone, number, integer, min, max, length, date, option, pattern; fields hidden by `showIf` are skipped and removed on save (`fmClean`).

**Test.** `TEST form builder`, `TEST forms engine`, `TEST people travelers+blocks`.

**Worked example.** `nas` (44 travelers, Operations, departs in 24 days → `pf = 0.9`): registration 44 done; medical 34 done, 7 sent, 3 not sent; waiver 29 done, 11 sent, 4 not sent. "Send" on waiver changes **4** travelers to `sent`; a second click changes **0**.

## 25. Permissions enforcement

`can(k)` (`s1e_people.js`): the role of `S.role` (owner, accountant, agent) → the override in `S.perms[role][k]` if boolean, else the matrix default; unknown keys → false. Owner column is locked true.

**What the demo actually checks**, by call site (`grep can(` across `v6/`):

| Permission | Checked in | Effect |
|---|---|---|
| `users.manage` | `NAV_PERM.users` (`s3_shell.js:26`); view wrapper `s9_boot.js:14` | Hides the Users item; page renders `noAccess()` |
| `fin.sync` | `NAV_PERM.books`; `s10_dacct.js:226`; `s10_settings.js:145` | Hides Accounting sync; gates posting from the accountant home and the Integrations tab |
| `fin.view` | `NAV_PERM.finance`, `NAV_PERM.gaps` (`s10_settings.js:7`) | Finance and Invoice check render `noAccess()` |
| `price.edit` | `s10_prop.js: prCan`; `s10_tbcomp.js: tbcCan` | Overhead/brokerage setters; swap buttons on By components |
| `settings.edit`, `settings.stages` | `s10_settings.js: stCanEdit, stCanStages` | Settings page read-only; every `st*` mutation returns false |
| `forms.build` | `s10_fbuild.js: fbCan` | Every form-builder mutation returns false/−1/0 |
| `sup.edit`, `ops.suppliers`, `sup.swap`, `cli.edit` | `s10_sup.js: spCan` | Edit buttons and in-trip supplier actions disabled with a reason |

The settings screen advertises **8** as enforced (`s10_settings.js: ST_ENFORCED`: `users.manage, fin.sync, fin.view, prop.approve, fin.issueDocs, settings.edit, price.edit, forms.build`). That list is not accurate; see §32.1. **Agent scoping** is separate: agents see only trips where `Trip.agent === S.role` (`s3_shell.js: canSee`; owner and accountant see all, `seesAll`). Quote approval from `Approval` to `Sent` checks `S.role === 'manager'` directly (`s4_views.js: pApprove`), not `prop.approve`.

**Production.** Enforce on the server for every permission in the matrix; scope agents at the database (`02-data-model.md` §4 row-level security). The matrix is a proposal for the owner to confirm; `users.roles` is owner-only even for admin.

**Test.** `TEST people data` (defaults per role, override works, owner has all), `TEST st settings` (override persistence, `fin.view` off removes Finance, mutation refused without `settings.edit`, 8 enforced tags drawn).

**Worked example.** Remove `fin.view` from agents: Priya's sidebar loses Finance and Invoice check and both pages return "No access"; Ella (owner) and Nora (accountant) are unaffected.

## 26. Real-brand rule

A real company (hotel, chain, venue, airline) never appears next to negative wording (gap, overbilling, dispute, late, slow, poor, risk). This is a **demo** rule (owner decision, Nov 2026); production does not need it.

How the demo enforces it:
1. `s8_gen.js: brandSwap(t, i)` (runs at build and after reset): skip the flagship `nen` and any trip where some invoice has a kind or is a gap; otherwise replace the lodging supplier with `catHotels(dest).filter(stars ≥ 4)[i % n]` in lines, room block hotel and supplier list. Line cost is kept (§19).
2. Real suppliers (`Supplier.real`) have no rating, reply time, documents or performance card; preference is High or Medium only; the contact is "Group sales desk" (`s1d_data.js: sdMk`; `s10_sup.js: spPerfCard`).
3. `s9c_live.js: liveSnapshot` is checked for real names inside gaps.

**Test.** `check6.js:49-50` (`brandGuard`: no catalog hotel or venue name in `gapStats().list`), run at reset (`:55`) and after reading the inbox (`:74`); live snapshot guard `:88`; `TEST suppliers: …` (real suppliers have no performance data; no fictional name equals a catalog name; no generated name is real).

**Worked example.** 11 trips carry a real hotel (`hl` Dan Jerusalem, `rom` Sheraton Rome Parco de' Medici, `can` Sheraton Phoenix Downtown, `irl` Hilton Dublin Kilmainham, `dc2` Hilton Washington DC Capitol Hill, `lon` Crowne Plaza London - Kings Cross, `nia` Hilton Niagara Falls/Fallsview Hotel and Suites, `dc1` Hyatt Regency Washington on Capitol Hill, `gre` Crowne Plaza Athens City Centre, `hl2` Crowne Plaza Jerusalem, `nsh` Hilton Nashville Downtown). Every invoice gap in the season sits on a fictional supplier (`Canyon Rim Lodge`, `Casa San Pietro Hotel`, `Liffey Hotel Dublin`, …).

## 27. Default lines for a trip (generator rules)

`s1_core.js: genLines(seg, dest, pax, nights)`. The studio, blank quotes and tier pricing all use it, so "Create the quote" yields an ordinary quote.

| Line | Quantity | Unit cost | Notes |
|---|---|---|---|
| Lodging, `<Twin or Quad or Triple> rooms, n nights` | `rooms × nights`, `rooms = ceil(pax / occupancy)`; occupancy Faith 2, Student 3.6, Senior 1.9, Choir 3, Alumni 1.9 | destination hotel rate; Student ×1.18, Choir ×1.10 | shared; Students use "Quad", Choirs "Triple" |
| Driver room (comp) | `nights` | 0 | domestic only; shared |
| Group air, Tulsa to gateway | `pax` | destination air fare, USD | per person; only when the destination has air |
| Coach | `nights + 1` days | destination coach day rate; ×1.08 above 50 travelers | shared |
| Airport transfers | `2 × ceil(pax / 50)` | transfer rate | when the destination has a shuttle |
| Guide | days (international) or `max(1, round(days / 2))` (domestic) | guide day rate | shared |
| Activities | `pax − floor(pax / 20)` (1 free per 20) | venue rate | per person; Faith and Student: all 3; Senior: first 2; Choir: first 1 plus a concert venue (1,400 or 1,600); Alumni: last 2 |
| Meals | `pax × meals` (lunches: days − 2, min 1; dinners: nights) | meal rate | per person |
| Insurance | `pax` | $89 international, $39 domestic | per person, commission 15%, USD |

Costs are rounded to whole units. **Test.** `check6.js:65-69` (studio for all 16 destinations: lodging quantity = rooms × nights, base nights sum to the trip's nights, margin between 5% and 45%, no day over 9.6 active hours).

**Worked example.** `dc2` (Washington DC 8th Grade Trip, 56 Student travelers, 4 nights): rooms = ceil(56 / 3.6) = 16 quad rooms × 4 nights = **64 room-nights** × $231 (196 × 1.18); free places = floor(56 / 20) = 2, so activities are **54** per person; dinners 56 × 4 = **224**; insurance 56 × $39.

**Studio.** `s8_gen.js: genPlan`: hotels define bases; each attraction belongs to its nearest base within 170 km; nights are split by attractions (max 1, 2 or 3 bases for ≤ 3, ≤ 6, more nights). Drive time from Tulsa: straight-line km × 1.12 at 100 km/h + 1 h, rounded to half hours, capped at 13 h (`driveH`); coach transfers and day trips: km × 1.35 at 80 km/h, minimum 0.5 h (`coachH`). A day's active hours (visits, not travel or meals) stay ≤ 9.6.

## 28. Quote workflow

`s6_rest.js` (`qs`, `win`), `s4_views.js: pApprove`, `s10_prop.js: prAccept`.
- `Draft → Approval` (anyone), `Approval → Sent` (UI: owner only), `Sent → Negotiating`.
- **Win** is offered for `Sent` and `Negotiating` only: `winQuote` sets `stage = 'Operations'`, `qst = ''`, creates households (`genGroups`, all unpaid), tasks (open), supplier list (status `Sent`), travelers and the room block (`held = rooms + 3`, `used = rooms`). It does not lock the FX rate (the rate is already a trip field).
- Client acceptance (`prAccept`): only `Draft` or `Sent` → `Negotiating`; `Approval` is never skipped.
- Duplicate a past trip (`dup`): new `Quote/Draft`, lines without invoices and without extra lines, departure `+364 d`, deposit and balance dates recomputed from it.

**Missing in the demo:** `lost`; moving Operations to Finance and to Closed; reopening. **Test.** `TEST prop formats and extras`; `check6.js:45-46` (won and new quotes keep the identity and render every tab).

## 29. Dashboard definitions and alerts

`s10_dash.js` (spec A19). All figures come from `calc`, `groupsCalc`, `portfolio`.
- **Booked revenue** = Σ `calc(t).rev` of non-Quote trips (= `portfolio().rev`). **Open quote value** = Σ rev of Quote trips.
- **Expected margin** = `portfolio().fp / rev`. **Target attainment** = booked / `STAFF.target`.
- **Readiness of a non-Quote trip** (`dbReadiness`): four percentages, each `round(n / d × 100)`, an empty denominator counting as 100: tasks done; passports received (international trips only, otherwise 100 "n/a"); suppliers confirmed (`st == 'Confirmed'`); deposits collected (by amount). `overall = round(mean of the four)`.
- **Follow-up due** = quote `Sent` with `qdays > 7` (`dbFollowUps`); the Alerts list uses `qdays > 14` (`s1b_labels.js: alertsFor`).
- **Alerts** (`alertsFor`, margin threshold `S.thresh`, default 12): inbox files waiting (warn), open gaps per Finance or Operations trip, top 3 by amount (bad), late billing groups (bad), expected margin below the threshold (warn), departure ≤ 60 days with overdue tasks (bad), quotes waiting for approval (info), sent quotes waiting > 14 days (info).
- **Approvals queue** = `Quote` with `qst == 'Approval'`, sorted by days waiting then revenue.

**Test.** `TEST db manager and agent dashboards` recomputes each from the base functions.

**Worked example.** `nas` readiness: tasks done 39%, passports n/a (domestic) 100, suppliers 88%, deposits 100 → overall **82**. Team: Priya booked $357,122.49 of $380,000 (94%), Dana $148,362.90 of $300,000 (49.5%). Alert: "Italy Pilgrimage Fall: expected margin 11.9%, below the 12% line".

## 30. Day plan rules

- **Overloaded day:** hours of `Trip.items` on a day > 9 (`s4_views.js: pPlan`, `dayHours`). Maya's one-tap fix (`s9d_maya.js: mayaPlanFix`) moves the longest item that fits to the nearest day whose total stays ≤ 9, using arrival and departure days only as a last resort; test: moving keeps every item once and revenue unchanged (`check6.js:99,104`).
- **Day costs** (`s10_tbday.js: tbdDayCosts`): each non-extra line's planned USD is spread equally over the days it is active: lodging nights `1..N`; insurance and air day 1; transfers days 1 and last; coach `min(days, round(qty))` days; guide: the busiest days by hours; meals from day 1 (lunches from day 2) for the number in the name; activities on the days the item with the same or similar name is planned. A line with no active day is "unscheduled". The last active day takes the rounding remainder. Output splits "Global" (shared lines) and "Per participant" (per-person lines). **Test:** `TEST tbday`.

## 31. Differences from the backend plan, in one table

| Topic | Demo | Backend plan (`04`, `02`) |
|---|---|---|
| Money | floats, `r2` each step, 0.05 test tolerance | `bigint` minor units, tolerance 0 |
| FX | one locked rate per trip, editable by anyone with Pricing | one lock per (trip, currency); admin only, audited |
| Gap kind | written by the generator | inferred by the matcher |
| Invoice to line | one invoice per line | many-to-many allocations |
| Tolerance | none | per tenant ($1 or 0.5%) |
| Partial credit | none | needs a state-machine decision |
| Commission received | hash rule `commPaid` | `commission_receipt` records |
| Today | constant | `asOf` input |
| Aging | by the oldest installment per household | per installment |
| Release exposure | fixed cutoff `dep − 30 d` | contract cutoff, attrition, schedule |
| Roles | owner, admin, agent, accountant (+ Ops desk, not a role) | + `viewer` |
| Trip stage | `Quote, Operations, Finance, Closed` | `quotation, operation, finance, closed, lost` + quote status incl. `won, lost` |
| Versions | light snapshot | `quote_version` owns the lines; sent versions immutable |

## 32. Things in the code that look inconsistent

Reported for the owner and the developers; none were changed. Listed so you decide before copying a behaviour.

1. **Enforced permissions.** `ST_ENFORCED` (and CLAUDE.md, "8 enforced") lists `prop.approve` and `fin.issueDocs`, but neither is checked by `can()` anywhere (`prop.approve` is a role check on `manager` in `s4_views.js: pApprove`; `daIssue` has no guard). Meanwhile `sup.edit`, `sup.swap`, `ops.suppliers`, `cli.edit` and `settings.stages` **are** enforced (`s10_sup.js: spCan`, `s10_settings.js: stCanStages`) but not in the list. Real count of distinct `can()` keys: 11 (`users.manage, fin.sync, fin.view, price.edit, settings.edit, settings.stages, forms.build, sup.edit, sup.swap, ops.suppliers, cli.edit`).
2. **Partial credits.** `invStatus` yields `k:'gap', st:'credited'` for a partial credit. `leakModel` would put it in `steps` and then in `lost` (status is neither open/disputed). The demo never creates one (credits are always full), so tests do not catch it.
3. **Credit does not mark paid.** The generator's `settle` sets `inv.paid = true` on credited invoices; the UI action `gapcred` does not. So realized FX (§6) and the AP schedule differ between a generated credited invoice and one credited in the UI.
4. **Swap permission differs by screen.** By components checks `price.edit`; Price comparison "Choose" checks `sup.swap` and `ops.suppliers`; `tbSwap` checks nothing.
5. **`byType` and overhead/brokerage.** `calc().byType[t].rev` includes discounts but not overhead or brokerage, and `byType[t].plan` excludes brokerage. Σ `byType.rev` therefore differs from `rev` when `ovh`/`brk` are set. The Invoice check cost-by-type bars use `byType.plan/fc`. Decide where overhead and brokerage post.
6. **`Trip.ctype`** duplicates `Client.type`, kept equal by a test, and the trip joins the client by **name**.
7. **Receipt label.** Income type `receipt` shows "Tax invoice" in English and "חשבונית מס קבלה" (tax invoice receipt) in Hebrew.
8. **Rate lock.** The "locked" rate is a free field, editable at any stage; changing it silently re-baselines every planned figure of the trip.
9. **No stage moves after win.** Nothing moves a trip from Operations to Finance or Closed; those stages exist only in generated data.
10. **`qdays` and dates.** `qdays` is a stored counter reset on status change, not derived from a timestamp; version dates are `TODAY` based.
11. **`themeGet()`** defaults to light and always writes `data-theme`, so the `prefers-color-scheme` CSS rules in `theme.css` never apply; the user's choice is stored in `triplanet-theme`.
12. **Docs vs code.** CLAUDE.md says check6 covers "all 25 Maya routes"; `QS.length` is 28 (questions 26 to 28 were added by the accounting module) and check6 loops over all of them (`check6.js:32`).
