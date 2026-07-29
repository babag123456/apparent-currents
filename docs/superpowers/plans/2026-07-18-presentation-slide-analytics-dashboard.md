# Presentation Slide Analytics Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authenticated, in-Presentation dashboard showing slide/block performance and bounded anonymous session journeys.

**Architecture:** Extend the existing visit model with server-timestamped bounded block journeys, then calculate dashboard data through a pure summariser using current ordered blocks and visit records. Replace the compact Payload engagement component with a responsive authenticated dashboard; keep public tracking non-blocking and avoid a separate analytics service.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3, PostgreSQL, TypeScript, Node assertion smoke tests.

## Global Constraints

- Work only in the existing `feature/client-presentations` worktree.
- Dashboard access is limited to authenticated Payload administrators.
- Calculate summaries from visit records; add no analytics service or runtime dependency.
- Journey entries contain block ID, block type, display mode, and server timestamp only.
- Collapse consecutive duplicate journey entries and store at most 500 entries per visit.
- Validate every block event against the active published Presentation's block ID and type.
- Never store authored content, URLs, client labels, names, emails, raw IP addresses, or precise locations.
- Google Slides remains one measurable block; do not claim visibility into iframe-internal activity.
- Preserve legacy analytics and keep public tracking failures non-blocking.

---

### Task 1: Bounded Journey Model and Event Merging

**Files:**
- Modify: `src/lib/presentations/repository.ts`
- Modify: `src/payload/collections/PresentationVisits.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `JourneyEntry = { blockId: string; blockType: string; displayMode: 'scroll' | 'slideshow'; viewedAt: string }`.
- Produces: `mergeBlockJourney(current: JourneyEntry[], event, viewedAt: Date): JourneyEntry[]`.
- Consumes: existing validated `blockHeartbeat` and `slideNavigation` events.

- [ ] **Step 1: Write failing journey assertions**

Import `mergeBlockJourney` into `scripts/presentations-smoke.ts`. Assert an empty journey receives one server-timestamped entry; consecutive events for the same ID/type/mode do not append; returning after another block does append; malformed historic entries are discarded; and a 500-entry journey never becomes 501 entries.

- [ ] **Step 2: Verify RED**

Run: `node --import tsx scripts/presentations-smoke.ts`

Expected: FAIL because `mergeBlockJourney` is not exported.

- [ ] **Step 3: Implement the bounded merge**

Add `JourneyEntry`, `MAX_JOURNEY_ENTRIES = 500`, a strict historic-entry normaliser, and `mergeBlockJourney`. Use the supplied `viewedAt.toISOString()`, never a browser timestamp. Compare the final valid entry's ID, type, and mode to collapse only consecutive duplicates.

- [ ] **Step 4: Persist journey entries**

Add `blockJourney` as a read-only Payload array with required `blockId`, `blockType`, `displayMode`, and `viewedAt`. On visit creation and updates, merge block events through `mergeBlockJourney`. Do not modify journeys for open, heartbeat, or link events.

- [ ] **Step 5: Verify and commit**

Run: `node --import tsx scripts/presentations-smoke.ts && node --import tsx scripts/security-smoke.ts && npx tsc --noEmit && npm run lint`

Expected: all checks pass; generated migration warnings are permitted but lint errors are not.

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/repository.ts src/payload/collections/PresentationVisits.ts
git commit -m "feat: record bounded presentation journeys"
```

---

### Task 2: Pure Dashboard Aggregation

**Files:**
- Create: `src/lib/presentations/dashboard.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `summarizePresentationDashboard(blocks: DashboardBlock[], visits: DashboardVisit[]): PresentationDashboard`.
- Produces ordered `slides`, `sessions`, `legacyActivity`, and overview fields.
- Consumes stable current block IDs/types and journey/metric fields from Task 1.

- [ ] **Step 1: Write failing overview tests**

Create fixtures for three current blocks and three visits. Assert viewers, summed visits, rounded average active seconds, final-block completion rate, earliest-tie most-viewed slide, per-slide viewers, reached percentage, average seconds, and next-slide drop-off. Assert zero-safe empty results.

- [ ] **Step 2: Write failing session and legacy tests**

Assert sessions sort newest-first and receive labels `Anonymous viewer 1`, `Anonymous viewer 2`; expose coarse device, visits, time, modes, slides reached, and ordered current positions. Assert deleted-block activity appears under `legacyActivity` and never attaches by reused position. Assert malformed numeric/timestamp fields are safely omitted or zeroed.

- [ ] **Step 3: Verify RED**

Run: `node --import tsx scripts/presentations-smoke.ts`

Expected: FAIL because `dashboard.ts` does not exist.

- [ ] **Step 4: Implement pure aggregation**

Define input/output types and private helpers for safe integers, percentages, identity (`${id}:${blockType}`), current-block lookup, sessions, and legacy aggregation. Import no React, Payload, or database code. Calculate drop-off against the next current block and return `null` for the final block.

- [ ] **Step 5: Verify and commit**

Run: `node --import tsx scripts/presentations-smoke.ts && npx tsc --noEmit && npm run lint`

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/dashboard.ts
git commit -m "feat: summarize presentation slide analytics"
```

---

### Task 3: Authenticated Payload Dashboard UI

**Files:**
- Create: `src/components/payload/PresentationAnalyticsDashboard.tsx`
- Create: `src/components/payload/presentationAnalyticsDashboard.css`
- Modify: `src/payload/collections/Presentations.ts`
- Modify: `src/app/(payload)/admin/importMap.js` (generated)
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Consumes current Payload document ID and ordered layout block IDs/types.
- Fetches every matching visit page from authenticated `/api/presentation-visits`.
- Renders the pure `PresentationDashboard` from Task 2.

- [ ] **Step 1: Write failing registration and pagination assertions**

Assert the Presentation UI field points to `@/components/payload/PresentationAnalyticsDashboard#PresentationAnalyticsDashboard`. Add a source assertion that loading advances pagination until `hasNextPage` is false rather than treating `limit=100` as a total cap.

- [ ] **Step 2: Verify RED**

Run: `node --import tsx scripts/presentations-smoke.ts`

Expected: FAIL because the dashboard is not registered.

- [ ] **Step 3: Implement authenticated paginated loading**

Use `useDocumentInfo()` for ID and `useFormFields()` for current layout. Fetch `depth=0`, `limit=100`, and incrementing `page`; concatenate until `hasNextPage` is false. Retain AbortController, loading, retry, and contained error states. Never use `overrideAccess` or a share token.

- [ ] **Step 4: Render the dashboard**

Render five summary cards, a horizontally scrollable semantic slide table, optional Legacy activity, and native `<details>` session rows. Use positions/types as labels and never display full session IDs. Explain the empty state before the first visit.

- [ ] **Step 5: Add accessible responsive styling**

Scope styles under `.presentation-analytics`. Use Payload theme variables, visible focus, 44-pixel targets, tabular numerals, and narrow-screen overflow. Do not encode meaning solely by colour.

- [ ] **Step 6: Register, generate, verify, and commit**

Update the UI field, run `npm run generate:importmap`, then run `node --import tsx scripts/presentations-smoke.ts && npx tsc --noEmit && npm run lint`.

```bash
git add scripts/presentations-smoke.ts src/components/payload src/payload/collections/Presentations.ts 'src/app/(payload)/admin/importMap.js'
git commit -m "feat: add presentation analytics dashboard"
```

---

### Task 4: Types, Migration, Documentation, and Delivery

**Files:**
- Modify: `src/payload-types.ts` (generated)
- Create: `src/migrations/<timestamp>_presentation_journeys.ts` (generated/reviewed)
- Create: `src/migrations/<timestamp>_presentation_journeys.json` (generated)
- Modify: `src/migrations/index.ts` (generated)
- Modify: `README.md`
- Modify: `scripts/security-smoke.ts`

**Interfaces:**
- Produces a data-preserving delta migration adding only the journey child table/indexes.
- Documents dashboard calculations, privacy limits, and the Google iframe boundary.

- [ ] **Step 1: Extend security assertions**

Assert anonymous REST/GraphQL reads remain denied, authenticated visit reads remain allowed, and public events cannot submit browser timestamps, authored text, URLs, client labels, or arbitrary event types.

- [ ] **Step 2: Generate Payload artifacts**

Run: `npm run generate:types && npm run migrate:create -- --name presentation_journeys`

Expected: types include `blockJourney`; the migration adds its enum/table/foreign key/order and parent indexes.

- [ ] **Step 3: Review the migration**

Confirm it does not drop or rewrite existing Presentation, visit, block metric, link click, or version data. Confirm `down` removes only journey schema. If unrelated operations appear, regenerate against the current local migration state.

- [ ] **Step 4: Update documentation**

Document dashboard location, slide/block terminology, summary calculations, session journeys, 500-entry bound, admin-only access, anonymous data, and Google Slides as one measurable iframe block.

- [ ] **Step 5: Run complete verification**

Run:

```bash
npm run presentations:smoke
npm run security:smoke
npm run lint
npx tsc --noEmit
node ./node_modules/next/dist/bin/next build --webpack
git diff --check
```

Expected: all checks and build pass. Generated migration unused-argument warnings are acceptable; errors are not.

- [ ] **Step 6: Perform manual admin checks**

Apply the local migration and verify empty/populated/error states, desktop/narrow layouts, keyboard session expansion, scrolling/slideshow journeys, reordered/deleted blocks, and logged-out denial.

- [ ] **Step 7: Commit delivery**

```bash
git add README.md scripts src
git commit -m "feat: deliver slide analytics dashboard"
```

Do not push or merge until repository write permission and environment deployment authority are available.

---

## Final Review Gate

1. Confirm the worktree is clean and review `git log --oneline staging..HEAD`.
2. Confirm summary values against the three-visit fixture by hand.
3. Confirm journeys never exceed 500 records and contain no browser timestamps or authored data.
4. Confirm slides align by stable ID plus type and deleted blocks remain Legacy activity.
5. Confirm requests paginate beyond 100 visits using authenticated Payload access.
6. Confirm Google Slides is described and measured as one iframe block only.
