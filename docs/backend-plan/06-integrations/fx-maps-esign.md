# 06 · FX rates, maps and routing, e-signature

## 1. FX rates

**Need:** one reference rate per (trip, currency), locked when the quote is won (`04-finance-engine.md` §3.4), plus a daily rate for FX-exposure figures. No intraday or trading use.

| Source | Price | Terms | Verdict |
|---|---|---|---|
| **ECB euro reference rates** | free; daily at about 16:00 CET; about 30 currencies incl. USD, ILS, GBP, CAD | free reuse incl. commercial if the source is cited and the data is not modified; the ECB says the rates are "for information purposes only" and discourages transaction use [verified - https://www.ecb.europa.eu/stats/ via the research notes] | **default** for EUR/GBP/CAD/etc., computed as a USD cross |
| **Bank of Israel** representative rate | free | indicative, "no obligatory status under law" [verified - https://www.boi.org.il/en/economic-roles/financial-markets/exchange-rates/] | **default** for ILS (Israeli tenants report in ILS) |
| Open Exchange Rates | Developer $12/month; Enterprise $47/month [verified $47 - openexchangerates.org/signup] | commercial terms of paid plans not confirmed | fallback, and if hourly rates are wanted |
| exchangerate.host | free tier | **non-commercial use only** [verified - https://exchangerate.host/pricing] | rejected |

**Design:**

- A nightly job stores `fx_rate(date, base, quote, rate, source, fetched_at)`.
- The trip lock copies the rate with its source and timestamp.
- The user may override with their bank's actual rate. The reason is required and the change is audited.
- Cross rates: USD/EUR from ECB as 1/EURUSD. A cross rate is a derived figure; we state "derived from ECB reference rates", which complies with "data not modified" by showing the source rate too [unverified - interpretation; low risk].
- **Disclosure in the UI:** "Reference rate, ECB, 13 Nov 2026. Not a transaction rate."

## 2. Maps and routing (Trip studio)

**Today:** the demo uses straight-line distance heuristics. Drive time = km × 1.12 at 100 km/h + 1 h from Tulsa; transfers km × 1.35 at 80 km/h (`CLAUDE.md`, decisions). The geometry is embedded with `tools/geo`.

| Option | Price | Storage terms | Verdict |
|---|---|---|---|
| **Self-hosted OSRM** (or openrouteservice self-hosted) on OSM data | $0 software; one Fargate task about $15-30/month for the US + Europe + Levant extracts [estimate] | BSD-2 code; OSM data ODbL: show "© OpenStreetMap contributors" with a link; derived databases are share-alike if distributed [verified - https://wiki.openstreetmap.org/wiki/Osrm, OSMF licence page] | **choice**: results can be **stored** on the trip, which the studio needs |
| Google Routes API (Compute Routes Essentials) | 10k free per month, then $5 per 1k [verified - https://developers.google.com/maps/billing-and-pricing/pricing] | place IDs may be cached; lat/lng up to 30 days [verified - Google service terms via the research notes]; storing drive times on a trip is restricted | rejected for stored itineraries |
| Mapbox Directions/Matrix | 100k free per month, then $2 per 1k [unverified] | "you may not cache, store, or export" (quoted secondary) [unverified] | rejected for the same reason |

**Design:**

- The planner (`packages/planner`) calls OSRM for coach legs and stores `{km, minutes, osrm_version, data_date}` on the itinerary item.
- Map tiles in the SPA: OSM-based vector tiles from a commercial tile host, or self-hosted. The demo's embedded geometry is enough for the overview maps, so this is optional.
- The OSM attribution sits on every map view.
- Group coach speed is not car speed. Keep the demo's coach factors (×1.35 and 80 km/h) as a configurable adjustment on top of OSRM car times, plus driver-hours rules (phase 2) [estimate].

## 3. E-signature for client quote acceptance (optional)

**MVP:**

- The quote acceptance page (signed link, 14-day expiry) records name, email, IP, user agent, timestamp, the quote-version hash and an "I accept" click.
- This is an **ESIGN/UETA-style electronic acceptance** with no third-party vendor. US federal ESIGN and state UETA generally recognise electronic signatures, given intent and record retention [unverified - general legal knowledge; the owner is legally trained, so confirm the form of the acceptance record].

**Vendor option** (phase 2, if customers ask for a "real" signature certificate):

| Vendor | Price | Note |
|---|---|---|
| **BoldSign API** | from $30/month incl. 40 envelopes, then $0.75 each [verified - https://boldsign.com/pricing] | cheapest per envelope; embedded signing |
| SignWell API | 25 docs/month free, then from $0.85 [verified - https://www.signwell.com/api-pricing/] | good for low volume |
| Dropbox Sign API | Essentials from $75/month [verified - https://sign.dropbox.com/api] | embedded signing needs a higher tier [unverified] |
| DocuSign eSignature API | Starter about $50/month [unverified] | brand familiarity; the most expensive at scale |

**Choice when needed:** BoldSign. Webhook (signed) on completion: `quote_version.accepted_at` plus the stored signed PDF.
