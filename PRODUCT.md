# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal-first (confirmed 2026-08-07): strategists and analysts at Apparent,
working at desks on desktop screens, preparing and investigating audience
intelligence for clients. Two working modes: senior strategists/creatives
scanning for what matters (Surface), and analysts interrogating evidence
(Deep Dive). Clients are a later audience; the first build may be
information-dense and candid (fixture labels, confidence caveats, API unit
meters are welcome).

## Product Purpose

Currents is an audience-intent intelligence product. It combines behavioural
and cultural data sources — search demand (Semrush, live), conversation
(Brandwatch, planned), owned behaviour (GA4, planned), audience attributes
(GWI, planned) — into strategic findings: what an audience appears to want,
what is changing, what is emerging or declining, and where brand
opportunities lie. Success = strategists trust it enough to open it before a
client conversation and can trace every finding back to evidence.

## Positioning

"The APIs are the evidence; the product is the interpretation." Organised by
audience question (Demand / Conversation / Behaviour / People), never by
vendor dashboard. Every finding is traceable: finding → markers → evidence →
source → time. No black-box scores, no false precision, no fabricated
cross-source identity.

## Operating Context

- Two primary experiences: **Surface** ("What matters now.") — curated
  strategic read; **Deep Dive** ("Explore what's driving it.") — evidence
  investigation. Surface = understand, Deep Dive = investigate.
- A persistent context frames everything: Brand · Category · Market ·
  Audience · Date period · Competitor set.
- Paid, metered APIs: explicit refresh + cached results, never live-polling
  dropdowns.

## Capabilities and Constraints

- Working now: Semrush Analytics v3 adapter (keyword overview, related
  keywords, domain organic), canonical evidence model, demand-marker
  derivation v0. No storage/caching layer yet (planned with real data
  wiring).
- Product language (binding): **Marker** = individual evidence signal;
  **Current** = pattern across related markers; **Opportunity** =
  strategically meaningful convergence. Current statuses: Emerging /
  Accelerating / Established / Declining. Never use the phrase
  "read the water".
- Unavailable sources (Brandwatch, GA4, GWI) must be labelled honestly —
  no fake integrations or placeholder results.
- Fixture/demo data is explicitly labelled as such. Confirmed demo context:
  Audi · Premium Automotive · Australia · EV Intenders · last 90 days ·
  BMW / Mercedes-Benz / Volvo.
- Stack: Next.js 16 App Router + Payload 3 + Postgres + Tailwind 4 (existing
  codebase). Server-side data access; API keys never reach the browser.

## Brand Commitments

- Header pattern (user-pinned 2026-08-07): the supplied **LOCKUP** asset
  (logomark + wordmark, red) followed by the product name **Currents**
  typeset in Inter Tight Medium, sentence case, ~16px gap, no divider —
  matching the "Platform Playbook" internal-tool pattern. Apparent appears
  only as supplied logo assets — never retypeset, never a combined logo.
- Typography (user-pinned 2026-08-07): **Inter Tight only** — 400 for copy,
  500 for headlines; headlines are sentence case. DM Mono for labels, data
  and stamps. **Swiss Posters is retired** (trial-licence concern moot).
- Visual world (user-pinned 2026-08-07): the Apparent site system — cream
  ground with red as the working colour (mono uppercase labels, hairline red
  rules, pill chips and controls, red circular action buttons); data lives
  in rounded stone terminal panels with red numerics (the site's LED
  market-board register). Not blue-SaaS; insight still leads.
- Tokens in `src/styles/brand.css`: red #fa0500, red-text #d90400 (AA ramp
  of brand red for small type — 4.9:1 on cream where #fa0500 is 3.8:1),
  plum #780000, cream #f7f4f2, charcoal #242322, stone #e2dfd8.
- Asset library:
  `/Users/hamish.stewart/Documents/Work/02_Internal_Agency/01_Agency_Marketing_&_Brand/04_Brand_Assets/Apparent-Brand-Assets/`

## Evidence on Hand

- Real Semrush data available once `SEMRUSH_API_KEY` is set (metered).
- No real Brandwatch/GA4/GWI data; absence must not be papered over.
- No testimonials, benchmarks or case studies for the product itself; do not
  invent any.

## Product Principles

1. Insight before chart; interpretation over chart density.
2. Every finding traceable to evidence, with source chips
   (SEMRUSH / GA4 / GWI / BRANDWATCH) and visible confidence.
3. Honest by construction: unavailable sources are labelled, fixtures are
   labelled, precision is never implied beyond the data.
4. Surface first, detail through progressive disclosure.
5. Meter paid evidence: cached results with timestamps and explicit refresh.

## Accessibility & Inclusion

Production standard: semantic HTML, keyboard navigation, visible focus,
contrast, no colour-only meaning, reduced-motion support, accessible chart
alternatives. Desktop-first working environment; Surface must still read
well as a concise mobile summary.
