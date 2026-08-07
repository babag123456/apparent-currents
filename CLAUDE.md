# Currents

## Purpose

Currents is an Apparent audience-intent intelligence product combining
multiple behavioural and cultural data sources into strategic findings.

It answers audience questions — what is happening, what is changing, what is
emerging or declining, where intent is moving, and where brand opportunities
lie — with every conclusion traceable to evidence.

**The APIs are the evidence. The product is the interpretation.**

## Repository

Seeded from the Apparent site codebase (`aprnt/thisisouragency`, remote kept
as `source-site` — never modify or merge from it) and stripped back to a
minimal clean foundation in August 2026: the previous product's awards and
presentations features, media stack (UploadThing/Mux) and migrations were
removed. Their patterns remain in git history. `origin` is
`babag123456/apparent-currents`.

**Stack:** Next.js 16 (App Router) · React 19 · Payload CMS 3.8x ·
`@payloadcms/db-postgres` · Tailwind CSS 4 · TypeScript (strict) ·
Google OAuth admin login (the only user-provisioning path) ·
Vercel deployment (`vercel-build` runs Payload migrations — any non-Vercel
deploy needs an equivalent migrate step).

**Layout:** `src/app/(frontend)` and `src/app/(payload)` route groups;
`src/collections/Users.ts` (collections inlined in `src/payload.config.ts`);
auth + security helpers in `src/lib` (`google-auth.ts`, `security/`);
brand foundation in `src/styles/brand.css` (Tailwind entry + fonts +
`@theme` tokens — the palette matches the supplied brand assets);
one fresh baseline migration in `src/migrations` (see
`docs/payload-migration-baseline.md`).

**Commands:**
- `npm run db:start` / `db:stop` / `db:logs` / `db:reset` — local Postgres
  via Docker (port **5434**, db `apparent_currents`).
- `npm run dev` — Next dev server. `npm run build` — production build.
- `npm run lint` — ESLint. Typecheck with `npx tsc --noEmit`.
- `npm run migrate` / `migrate:create` — Payload migrations.
- `npm run generate:types` — regenerate `src/payload-types.ts` after any
  collection change. `generate:importmap` after admin component changes.
- `npm run migrate:verify-blank` — prove migrations rebuild a blank DB.
- `npm run security:smoke` — security regression assertions.
- `npm test` — vitest (domain transformations, normalisers, client errors).
- `npx tsx scripts/semrush-probe.ts "<phrase>" [db]` — one narrow live
  Semrush request to validate key + normalizer assumptions (spends units).
- First admin on a fresh DB: configure Google OAuth, or locally
  `npx tsx scripts/bootstrap-admin.ts <email> '<password>'`.

**Env:** `.env` (gitignored) from `.env.example`: `DATABASE_URL`,
`PAYLOAD_SECRET`, `SEMRUSH_API_KEY`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_CALLBACK_URL`,
`GOOGLE_ALLOWED_EMAILS` or `GOOGLE_ALLOWED_DOMAIN`.

## Product principles

- APIs are evidence; interpretation is the product.
- Organise by audience question, not vendor. The user-facing model is
  **Demand** (Semrush), **Conversation** (Brandwatch), **Behaviour** (GA4),
  **People** (GWI) — vendors are data sources, never navigation.
- Every finding must be traceable to evidence: finding → markers → evidence
  → source → time → methodology.
- Never fabricate cross-source person-level identity. This is aggregate
  audience intelligence; signals converge around topic, need-state, audience,
  brand, category, market and period — never around individuals.
- Surface first; detail through progressive disclosure.
- Do not manufacture false precision. No black-box scores; if a composite
  score is ever introduced, expose its components, methodology and confidence.
- Make insights more prominent than charts.
- AI-generated interpretation must never be indistinguishable from source data.

## Product language

- **Marker** = individual evidence signal (e.g. search volume rising,
  competitor gaining share, audience over-index).
- **Current** = pattern across related markers around a shared topic,
  need-state or audience behaviour.
- **Opportunity** = strategically meaningful convergence of currents.
- **Surface** = curated strategic view. Subhead: “What matters now.”
- **Deep Dive** = evidence investigation. Subhead: “Explore what’s driving it.”
- Current status taxonomy: Emerging / Accelerating / Established / Declining.

Do not use the phrase “read the water”.

## Brand

- Product name = **Currents** (sentence case in UI).
- Apparent appears as supplied logo assets only. **Never typeset
  “Apparent Currents” as a UI wordmark** unless explicitly asked. Header
  pattern (pinned 2026-08-07): `[APPARENT LOCKUP, red] Currents` — the
  lockup asset, then the product name in Inter Tight Medium, ~16px gap, no
  divider. Do not create a combined logo.
- Typography (pinned 2026-08-07): **Inter Tight only** — weight 400 for
  copy, 500 for headlines; headlines sentence case. DM Mono for labels,
  data, stamps. **Swiss Posters is retired — do not use it.**
- Visual world (pinned 2026-08-07): the Apparent site system — cream
  ground, red as the working colour (mono uppercase labels, hairline red
  rules, pill chips/controls, red circular action buttons); data in rounded
  stone terminal panels with red numerics. Not blue-SaaS.
- Brand assets live at:
  `/Users/hamish.stewart/Documents/Work/02_Internal_Agency/01_Agency_Marketing_&_Brand/04_Brand_Assets/Apparent-Brand-Assets/`
  - `logo/SYMBOL/`, `logo/WORDMARK/`, `logo/LOCKUP/` — each in SVG + PNG,
    five colourways (lockup red + charcoal copied to `public/brand/`).
  - `fonts/` — Inter Tight (variable + statics), DM Mono Medium (Swiss
    Posters files remain in the library but are unused).
  - `shapes/`, `icons/`, `ui/` — supporting brand elements.
- Palette (extracted from supplied logo SVGs — verify against any formal
  spec before finalising tokens):
  - Charcoal `#242322` (default logo colour)
  - Cream `#F7F4F2`
  - Stone `#E2DFD8`
  - Red `#FA0500` (plus `--color-red-text` `#D90400`, the AA-contrast ramp
    for small type on cream)
  - Plum `#780000`
- Encode brand values as design tokens; do not hard-code hex values in
  components. Do not invent brand styles beyond the supplied assets.

## Architecture

- Next.js + Payload CMS (single app; Payload admin for domain data).
- API credentials server-side only. Semrush key = `SEMRUSH_API_KEY` env var.
  Never expose to the browser, commit, store in Payload data, return via API
  responses, or log. `.env.example` carries variable names only.
- Vendor adapters separated from domain/intelligence logic:
  `integrations/<vendor>/` (client, types, adapter, normalisers) →
  canonical evidence records → marker derivation → database →
  server-side queries → UI. Vendor response shapes must never reach
  presentation components.
- Design for Semrush, Brandwatch, GA4 and GWI even though Semrush is the
  first (and currently only) implementation. No fake integrations — label
  unavailable sources honestly.
- Cache and meter paid API use: explicit refresh over polling, timestamps,
  stale/fresh status, duplicate prevention, unit awareness. Use Payload
  Jobs/Tasks for ingestion rather than coupling long work to page requests.
- Maintain provenance on every evidence record: source, endpoint/report,
  retrievedAt, market, period, query/topic, brand, source identifier,
  normalised metrics, refresh status.
- Before implementing any Semrush endpoint, verify against the current
  official Semrush API docs (versions, endpoints, inputs, unit costs) —
  never assume remembered syntax is current. Document chosen endpoints in
  the integration README.

## Design

- Use the **Impeccable 4.0** skill (`/impeccable`, installed at
  `.claude/skills/impeccable/`) for all frontend design work — iteratively
  throughout build and review, not once at the end.
- Editorial, restrained, strategic, high craft. The feel is a hybrid of
  strategy presentation, intelligence terminal and editorial publication —
  not a martech dashboard.
- Avoid: generic SaaS card walls, gradient blobs, “AI purple”, glow effects,
  KPI-tile grids, chart junk, icon overload, default-shadcn look,
  equal-weight cards.
- Favour: editorial hierarchy, strong typography, deliberate whitespace,
  clear grid, restrained visualisation, compact metadata, source/evidence
  chips (SEMRUSH / GA4 / GWI / BRANDWATCH), progressive disclosure.
- Insight before chart. The first thing a user sees on Surface is an
  insight, not navigation chrome.
- Loading / empty / error / stale / quota states are designed product
  states with useful remediation — never a generic “Something went wrong”.
- Accessibility and responsive behaviour are mandatory: semantic HTML,
  keyboard navigation, visible focus, contrast, accessible chart
  alternatives, no colour-only meaning, reduced-motion support. Desktop is
  primary; Surface must still read well as a concise mobile summary.

## Development behaviour

- Inspect before refactoring; follow repository conventions.
- Prefer small coherent changes.
- Type strictly.
- Do not silently introduce major dependencies (including chart libraries —
  none until a demonstrated need).
- Add tests for domain transformations, normalisers, marker derivation,
  API error handling and cache/stale logic. Do not over-test presentation.
- Never commit secrets.
- Keep fixtures explicitly separate from live data, and label fixture/demo
  data as such in the UI.
- Document assumptions and TODOs.
- Run lint / typecheck / tests / production build before declaring work
  complete.
- Work in phases; at the end of each phase summarise changes, assumptions
  and unresolved decisions before starting major new architecture.

## Out of scope for the first vertical slice

Do not build yet: GA4 / GWI / Brandwatch connectors, an AI chat assistant,
automatic strategic recommendations, a proprietary composite score, a data
warehouse, a vector database, a heavyweight chart library, or a separate
frontend application.
