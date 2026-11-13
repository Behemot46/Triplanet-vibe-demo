# 03 · API

## 1. Style (decision): REST + OpenAPI 3.1

The API is REST, described in OpenAPI 3.1 and generated from Zod schemas in code, so the spec cannot drift from the handlers.

| Option | Verdict | Reason |
|---|---|---|
| **REST + OpenAPI** | chosen | Pen testers' tooling (Burp, ZAP, Schemathesis) consumes OpenAPI directly. Accounting partners and future customer integrations expect REST. Idempotency keys, ETags and HTTP caching are standard. A generated TypeScript client gives the frontend the same type safety tRPC would |
| tRPC | rejected | TypeScript-only and not a public contract. Partners, Zapier and a pen-test vendor would need a second API anyway |
| GraphQL | rejected | Field-level authorization and query-cost limits add attack surface (introspection, batching, deep queries) for no product gain at this scale. IDOR across tenants is harder to reason about through resolvers |

Generated artifacts: `openapi.json` (committed, diffed in CI), `@triplanet/api-client` (TypeScript), and a Schemathesis fuzz run in CI.

## 2. Authentication and session

- **Browser sessions.**
  - The managed IdP issues the session (see `01-architecture.md` §4).
  - The API accepts the IdP's short-lived JWT (5-15 min) in an `Authorization: Bearer` header. The SPA gets it from the IdP SDK.
  - The API verifies the signature against the IdP's JWKS, checks `iss`, `aud` and `exp`, then resolves `membership` for the requested tenant.
- **Tenant selection.**
  - The path carries the tenant: `/v1/t/{tenantId}/...`.
  - The API checks membership on every request, so the tenant is never taken from a header alone.
  - The path then sets `app.tenant_id` for RLS.
- **API tokens.** Phase 2: scoped, hashed and expiring `Authorization: Bearer tp_...` tokens for customer integrations.
- **CSRF.** Not applicable to bearer tokens. The CORS allow-list is exact origins only.
- **Step-up authentication.** Exporting data, connecting or disconnecting accounting, changing a locked FX rate and deleting a tenant all require an MFA within the last 10 minutes (IdP `amr`/`auth_time` claim).

## 3. Resources (v1)

All paths are under `/v1/t/{tenantId}`. The verbs are standard. Lists support `?cursor=&limit=` (max 100), `?sort=` and resource-specific filters.

| Resource | Endpoints | Roles (write) |
|---|---|---|
| Members | `GET /members`, `POST /invitations`, `PATCH /members/{id}`, `DELETE /members/{id}` | owner, admin |
| Clients | `/clients`, `/clients/{id}`, `/clients/{id}/contacts` | owner, admin, agent |
| Trips | `/trips`, `/trips/{id}`, `POST /trips/{id}:advance` (stage change), `POST /trips/{id}:lose` | owner, admin, agent (own) |
| Quotes | `/trips/{id}/quote-versions`, `/quote-versions/{id}/lines`, `POST /quote-versions/{id}:send`, `POST /quote-versions/{id}:accept` | owner, admin, agent (own) |
| Pricing preview | `POST /pricing:preview` (lines in, totals out; no write) | any |
| FX | `GET /trips/{id}/fx-locks`, `PUT /trips/{id}/fx-locks/{cur}` (step-up) | owner, admin |
| Itinerary | `/trips/{id}/itinerary`, `POST /trips/{id}/itinerary:move` (the demo's drag-and-drop) | owner, admin, agent (own) |
| Groups and travellers | `/trips/{id}/groups`, `/groups/{id}/travellers` | owner, admin, agent (own) |
| Suppliers | `/suppliers`, `/suppliers/{id}/rates`, `/rates/{id}/bands` | owner, admin |
| Catalog | `/catalog-items`, `GET /reference/hotels`, `GET /reference/venues`, `POST /catalog-items:import-from-reference` | owner, admin |
| Room blocks | `/trips/{id}/room-blocks` | owner, admin, agent (own) |
| Files | `POST /files:upload-url` (signed PUT), `POST /files/{id}:complete`, `GET /files/{id}:download-url` | role checked against the owning entity |
| Supplier invoices | `/supplier-invoices`, `POST /supplier-invoices/{id}:confirm`, `:void`, `/supplier-invoices/{id}/allocations` | owner, admin, accountant, agent (own trip, no confirm) |
| Gaps | `GET /gaps`, `POST /gaps/{id}:dispute`, `:accept`, `:reopen` | owner, admin, accountant |
| Disputes | `/disputes`, `POST /disputes/{id}:send` | owner, admin, accountant |
| Credits | `/supplier-credits` | owner, admin, accountant |
| Commissions | `GET /commissions`, `POST /commissions/{id}/receipts` | owner, admin, accountant |
| Client billing | `/client-invoices`, `POST /client-invoices/{id}:issue`, `/client-invoices/{id}/payments` | owner, admin, accountant |
| Vouchers | `/trips/{id}/vouchers`, `POST /vouchers/{id}:issue` | owner, admin, agent (own) |
| Reports | `GET /reports/trip-pnl/{tripId}`, `GET /reports/leaks?scope=&dim=`, `GET /reports/finance-dashboard`, `GET /reports/cashflow` | finance figures: owner, admin, accountant; agents see only their own trips |
| Studio | `POST /studio:plan`, `POST /studio:create-quote` | owner, admin, agent |
| Import | `POST /imports` (file id + kind), `GET /imports/{id}` (dry-run report), `POST /imports/{id}:commit` | owner, admin |
| Accounting | `GET /accounting/connections`, `POST /accounting/{system}:connect` (OAuth start), `GET /accounting/oauth/callback`, `POST /accounting/connections/{id}:sync`, `GET /accounting/connections/{id}/log`, `DELETE /accounting/connections/{id}` | owner, admin (step-up for connect and disconnect) |
| Maya | `POST /ai/threads`, `POST /ai/threads/{id}/messages` (SSE stream), `GET /ai/usage` | any; tools are filtered by role |
| Export | `POST /exports`, `GET /exports/{id}` | owner (step-up) |
| Audit | `GET /audit-events?entity=&id=` | owner, admin |
| Billing (Triplanet's own) | `GET /billing`, `POST /billing:portal-session` | owner |

**Webhooks in** are global, outside the tenant path. Each one is verified before parsing (see `07-security-pentest.md`):

- `POST /hooks/stripe`
- `POST /hooks/intuit`
- `POST /hooks/xero`
- `POST /hooks/email-inbound` (phase 2)

**Actions as `:verb` sub-resources** (Google AIP-136 style) keep state transitions explicit and auditable. A state change is never a bare `PATCH`.

## 4. OpenAPI outline (excerpt)

```yaml
openapi: 3.1.0
info: { title: Triplanet API, version: 1.0.0 }
servers: [{ url: https://api.triplanet.io/v1 }]
security: [{ bearer: [] }]
components:
  securitySchemes:
    bearer: { type: http, scheme: bearer, bearerFormat: JWT }
  parameters:
    TenantId: { name: tenantId, in: path, required: true, schema: { type: string, format: uuid } }
    IdempotencyKey: { name: Idempotency-Key, in: header, required: false, schema: { type: string, maxLength: 64 } }
  schemas:
    Money:
      type: object
      required: [amount_minor, currency]
      properties:
        amount_minor: { type: string, pattern: '^-?[0-9]{1,18}$', description: integer minor units as a string (no JS float loss) }
        currency: { type: string, pattern: '^[A-Z]{3}$' }
    QuoteLine:
      type: object
      required: [service_type, name, qty, unit_cost, scope]
      properties:
        id: { type: string, format: uuid, readOnly: true }
        service_type: { enum: [Lodging, Transport, Guide, Activities, Meals, Insurance, Other] }
        name: { type: string, maxLength: 200 }
        supplier_id: { type: string, format: uuid }
        qty: { type: string, pattern: '^[0-9]{1,9}(\.[0-9]{1,3})?$' }
        unit_cost: { $ref: '#/components/schemas/Money' }
        scope: { enum: [shared, per_person] }
        markup_override_bp: { type: integer, minimum: 0, maximum: 9999 }
        commission_bp: { type: integer, minimum: 0, maximum: 5000 }
    Gap:
      type: object
      properties:
        id: { type: string, format: uuid }
        kind: { enum: [rooms, qty, rate, comp, extra, dup, under, missing] }
        status: { enum: [open, disputed, credited, accepted] }
        amount: { $ref: '#/components/schemas/Money' }
        quote_line_id: { type: string, format: uuid }
        explanation: { type: string }
    Problem:   # RFC 9457
      type: object
      properties: { type: {type: string}, title: {type: string}, status: {type: integer}, detail: {type: string}, instance: {type: string}, code: {type: string}, errors: {type: array} }
paths:
  /t/{tenantId}/supplier-invoices/{id}:confirm:
    post:
      parameters: [{ $ref: '#/components/parameters/TenantId' }, { $ref: '#/components/parameters/IdempotencyKey' }]
      requestBody: { content: { application/json: { schema: { type: object, properties: { lines: { type: array } } } } } }
      responses:
        '200': { description: confirmed; gaps recomputed }
        '409': { description: version conflict or already confirmed }
        '422': { description: validation failed, see Problem.errors }
```

Money travels as **strings of integer minor units**. JSON numbers above 2^53 lose precision in JavaScript, and a string prevents a client from silently converting to float.

## 5. Idempotency

- **Accepted on:** every `POST` that creates or transitions, every `:action` endpoint and every webhook handler.
- **Required on:** the endpoints that integrations or a retrying client might call twice:
  - `POST /supplier-invoices` (also from the email inbox);
  - `:confirm`, `:dispute`, `:send`, `:issue`;
  - `POST /client-invoices/{id}/payments`;
  - `:sync`;
  - all webhook handlers (keyed on the provider's event id).
- **Semantics** (as Stripe's):
  - the key is scoped per tenant and route;
  - stored with a SHA-256 of the request body;
  - a replay with the same body returns the stored response;
  - the same key with a different body returns `422 idempotency_key_reused`;
  - the TTL is 24 h;
  - a concurrent duplicate returns `409 request_in_progress`.
- **Outbound** (Triplanet → QuickBooks/Xero): each push carries a deterministic key derived from `(connection, local_type, local_id, version)`.
  - QuickBooks: the `requestid` query parameter.
  - Xero: the `Idempotency-Key` header.

  Both vendors' support for these is to be verified in `06-integrations/` [unverified here]. The `external_ref` table is the second guard: when a mapping exists, the call becomes an update, not a create.

## 6. Concurrency

`ETag` = the row `version`. `PATCH`/`PUT` require `If-Match`; a mismatch returns `412`. A quote edited by two agents at once fails loudly instead of losing a line.

## 7. Errors

- **Format.** RFC 9457 `application/problem+json`, with a stable machine `code`. Examples:
  - `gap.already_credited`
  - `fx.locked`
  - `quote.version_sent`
  - `ai.budget_exhausted`
  - `accounting.reauth_required`
- **Messages.** In the user's locale. Never include stack traces, SQL or another tenant's identifiers.
- **Status mapping:**

  | Status | Meaning |
  |---|---|
  | 400 | malformed |
  | 401 | no or invalid token |
  | 403 | authenticated but not allowed |
  | **404** | not found **or another tenant's resource** (never 403, so tenant existence does not leak) |
  | 409 | conflict |
  | 412 | precondition failed |
  | 422 | validation |
  | 429 | rate limit, with `Retry-After` |
  | 5xx | no detail |

## 8. Rate limits

| Bucket | Limit | Why |
|---|---|---|
| Per user, general | 600 req/min | normal UI use is well under this [estimate] |
| Per tenant, general | 3,000 req/min | protects shared resources |
| Uploads | 120 files/hour per tenant | caps extraction cost |
| Maya | 30 messages/hour per user, plus the monthly `ai_budget` | caps LLM spend |
| Exports | 3/day per tenant | heavy job |
| Auth-adjacent (invitation accept, OAuth callbacks) | 10/min per IP | anti-abuse |

Implementation: a token bucket in Postgres (`unlogged` table) or Redis if added later. The WAF adds an IP-level rate rule in front (see `09-ops.md`).

## 9. Pagination and filtering

- Cursor pagination: an opaque, signed cursor of `(sort_key, id)`; `limit` ≤ 100.
- No offset pagination on large tables.
- Filters are typed and allow-listed per resource. There is no generic `?filter=` passed to SQL.

## 10. Versioning

- `/v1` in the path.
- Additive changes need no new version.
- Breaking changes go to `/v2`, with 12 months' overlap once there are API-token customers. Before that, the SPA and the API deploy together and the version stays v1.
