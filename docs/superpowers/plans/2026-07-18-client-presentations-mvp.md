# Client Presentations MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add private Google Slides presentation pages managed in Payload with anonymous engagement tracking and administrator-only reporting.

**Architecture:** A private `presentations` collection owns validated Slides configuration and high-entropy share tokens. A server-rendered `/present/[shareToken]` route displays a safe canonical embed, while a narrow same-origin endpoint merges bounded anonymous engagement events into a private `presentation-visits` collection. Pure validation and aggregation modules keep security-sensitive rules independently testable.

**Tech Stack:** Next.js 16 App Router, React 19, Payload CMS 3, PostgreSQL, TypeScript, Node assertion-based smoke tests, existing Payload Local API and design tokens.

## Global Constraints

- Work on `feature/client-presentations`, which starts from `staging`.
- Do not require client accounts, passwords, named-recipient data, cookies, fingerprinting, raw IP storage, or third-party analytics.
- Do not claim or attempt to capture events inside the cross-origin Google Slides iframe.
- Accept only validated `https://docs.google.com/presentation` URLs and construct iframe URLs; never accept iframe HTML.
- Public collection APIs must not expose presentations or visit records.
- Presentation rendering must continue when tracking fails.
- Existing `/<slug>` award pages, Google admin auth, media/video collections, and security controls must remain unchanged.
- Use the existing Node/TypeScript toolchain; add no runtime dependency for this MVP.

---

## File Map

- `src/lib/presentations/googleSlides.ts`: parse supported Slides URLs and return canonical view/embed URLs.
- `src/lib/presentations/shareToken.ts`: generate and validate high-entropy URL-safe tokens.
- `src/lib/presentations/analytics.ts`: event schema, bounds, device classification, and visit merge helpers.
- `scripts/presentations-smoke.ts`: assertion-based tests for pure presentation utilities.
- `src/payload/collections/Presentations.ts`: editor-facing presentation content and private access rules.
- `src/payload/collections/PresentationVisits.ts`: administrator-only anonymous analytics records.
- `src/payload/award-kit.config-fragment.ts`: register both collections.
- `src/components/payload/PresentationGoToPageButton.tsx`: open/copy affordance for saved presentation links.
- `src/app/(frontend)/present/[shareToken]/page.tsx`: server lookup, metadata, and presentation page.
- `src/components/presentations/PresentationView.tsx`: responsive shell, embed, fallback, and supporting links.
- `src/components/presentations/PresentationTracker.tsx`: anonymous session and visibility-aware activity batching.
- `src/app/api/presentation-events/route.ts`: validate and merge public analytics events.
- `src/lib/presentations/repository.ts`: narrow Local API queries and analytics writes shared by route/endpoint.
- `src/components/payload/PresentationEngagementSummary.tsx`: authenticated admin engagement summary.
- `src/styles/presentation.css`: isolated presentation styles using current fonts and colour variables.
- `src/app/(frontend)/layout.tsx`: import presentation styles.
- `scripts/security-smoke.ts`: assert new URL/token/access invariants.
- `package.json`: add presentation smoke command.
- `src/payload-types.ts`: regenerate Payload types.
- `src/migrations/<timestamp>_add_presentations.ts`: generated PostgreSQL schema migration.
- `README.md`: document authoring, sharing, analytics limits, and verification.

---

### Task 1: Slides, token, and analytics validation core

**Files:**
- Create: `src/lib/presentations/googleSlides.ts`
- Create: `src/lib/presentations/shareToken.ts`
- Create: `src/lib/presentations/analytics.ts`
- Create: `scripts/presentations-smoke.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `parseGoogleSlidesUrl(value: string): GoogleSlidesUrls | null`
- Produces: `validateGoogleSlidesUrl(value?: string | null): true | string`
- Produces: `createPresentationShareToken(): string`
- Produces: `isValidPresentationShareToken(value: string): boolean`
- Produces: `parsePresentationEvent(value: unknown): PresentationEvent | null`
- Produces: `classifyDevice(userAgent: string): DeviceCategory`
- Produces: `mergeVisitMetrics(current, event, now): VisitMetrics`

- [ ] **Step 1: Add failing utility assertions**

Create `scripts/presentations-smoke.ts` with assertions covering edit, present, and published Slides URLs; hostile hosts and malformed IDs; token format/uniqueness; bounded event parsing; and visit merging:

```ts
import assert from 'node:assert/strict'

import { classifyDevice, mergeVisitMetrics, parsePresentationEvent } from '../src/lib/presentations/analytics.ts'
import { parseGoogleSlidesUrl, validateGoogleSlidesUrl } from '../src/lib/presentations/googleSlides.ts'
import { createPresentationShareToken, isValidPresentationShareToken } from '../src/lib/presentations/shareToken.ts'

const id = '1AbCdEfGhIjKlMnOpQrStUvWxYz_123456'
for (const value of [
  `https://docs.google.com/presentation/d/${id}/edit#slide=id.p`,
  `https://docs.google.com/presentation/d/${id}/present`,
  `https://docs.google.com/presentation/d/e/${id}/pub?start=false`,
]) assert.equal(validateGoogleSlidesUrl(value), true)

assert.equal(parseGoogleSlidesUrl(`https://docs.google.com/presentation/d/${id}/edit`)?.embedUrl, `https://docs.google.com/presentation/d/${id}/embed`)
for (const value of ['javascript:alert(1)', `https://evil.example/presentation/d/${id}/edit`, 'https://docs.google.com/presentation/d/x/edit']) {
  assert.notEqual(validateGoogleSlidesUrl(value), true)
}

const tokens = new Set(Array.from({ length: 100 }, createPresentationShareToken))
assert.equal(tokens.size, 100)
for (const token of tokens) assert.equal(isValidPresentationShareToken(token), true)

const sessionId = crypto.randomUUID()
assert.deepEqual(parsePresentationEvent({ type: 'heartbeat', sessionId, activeSeconds: 15 }), {
  type: 'heartbeat', sessionId, activeSeconds: 15,
})
assert.equal(parsePresentationEvent({ type: 'heartbeat', sessionId: 'bad', activeSeconds: 999999 }), null)
assert.equal(classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'mobile')
assert.deepEqual(
  mergeVisitMetrics({ activeSeconds: 20, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:00:00Z') }, { type: 'heartbeat', activeSeconds: 10 }, new Date('2026-07-18T00:01:00Z')),
  { activeSeconds: 30, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:01:00Z') },
)
```

- [ ] **Step 2: Add the smoke command and confirm RED**

Add to `package.json`:

```json
"presentations:smoke": "tsx scripts/presentations-smoke.ts"
```

Run: `npm run presentations:smoke`

Expected: FAIL because `src/lib/presentations/*` does not exist.

- [ ] **Step 3: Implement canonical Slides parsing**

Implement a parser that requires `https:`, exact hostname `docs.google.com`, path shape `/presentation/d/<id>/...` or `/presentation/d/e/<id>/...`, and an ID matching `/^[A-Za-z0-9_-]{20,}$/`. Return:

```ts
export type GoogleSlidesUrls = { embedUrl: string; openUrl: string }
```

For normal decks construct `/presentation/d/<id>/embed` and `/presentation/d/<id>/present`; for published decks construct `/presentation/d/e/<id>/embed` and `/presentation/d/e/<id>/pub`.

- [ ] **Step 4: Implement token and analytics bounds**

Generate tokens with `randomBytes(24).toString('base64url')`; validate exactly 32 URL-safe characters. Define event shapes:

```ts
export type PresentationEvent =
  | { type: 'open'; sessionId: string }
  | { type: 'heartbeat'; sessionId: string; activeSeconds: number }
  | { type: 'linkClick'; sessionId: string; linkId: string }
```

Require UUID session IDs, heartbeat increments of `1..30`, and link IDs matching `/^[A-Za-z0-9_-]{1,64}$/`. Cap stored active time at `31_536_000` seconds. Device category is `mobile | tablet | desktop | unknown` using conservative user-agent matching.

- [ ] **Step 5: Verify GREEN and existing security checks**

Run: `npm run presentations:smoke && npm run security:smoke && npx tsc --noEmit`

Expected: all commands pass.

- [ ] **Step 6: Commit the validation core**

```bash
git add package.json scripts/presentations-smoke.ts src/lib/presentations
git commit -m "feat: add presentation validation core"
```

---

### Task 2: Private Payload content and visit collections

**Files:**
- Create: `src/payload/collections/Presentations.ts`
- Create: `src/payload/collections/PresentationVisits.ts`
- Create: `src/components/payload/PresentationGoToPageButton.tsx`
- Modify: `src/payload/award-kit.config-fragment.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Consumes: validators and token generator from Task 1.
- Produces: collection slugs `presentations` and `presentation-visits`.
- Produces: supporting links shaped `{ id: string; label: string; href: string }`.

- [ ] **Step 1: Add failing collection assertions**

Extend `scripts/presentations-smoke.ts` to import both collection configs and assert:

```ts
assert.equal(Presentations.slug, 'presentations')
assert.equal(PresentationVisits.slug, 'presentation-visits')
assert.equal(await Presentations.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await PresentationVisits.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await PresentationVisits.access?.create?.({ req: { user: null } } as never), false)
```

Also invoke the presentation `beforeValidate` hook with missing `shareToken` and a valid Slides URL, then assert that it creates a valid token and canonical URLs.

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke`

Expected: FAIL because the collection modules do not exist.

- [ ] **Step 3: Implement `Presentations`**

Follow `AwardEntries.ts` access conventions but set anonymous `read` to false. Define authenticated CRUD, admin title/default columns, version drafts via `versions: { drafts: true }`, an `active` checkbox defaulting true, validated Slides URL, read-only canonical URLs/token, optional media cover, short rich-text introduction, and supporting links validated with `validatePublicHref`.

Use hooks to generate missing tokens/IDs and derive canonical Slides URLs. Token regeneration is performed by clearing the token in admin, causing the hook to create a new value.

- [ ] **Step 4: Implement `PresentationVisits`**

Use authenticated read and deny native API create/update/delete. Add the relationship, indexed session ID, timestamps, visit count, active seconds, device category, and link click array. Mark analytics fields read-only in admin. Add a compound unique PostgreSQL index in Task 6's migration.

- [ ] **Step 5: Register collections and add admin open button**

Append `Presentations` and `PresentationVisits` to `awardKitCollections`. Mirror `AwardEntryGoToPageButton`, but construct `/present/${shareToken}` and return nothing until a token exists.

- [ ] **Step 6: Verify and commit**

Run: `npm run presentations:smoke && npm run security:smoke && npx tsc --noEmit`

Expected: all pass.

```bash
git add scripts/presentations-smoke.ts src/payload/collections src/payload/award-kit.config-fragment.ts src/components/payload/PresentationGoToPageButton.tsx
git commit -m "feat: add presentation content models"
```

---

### Task 3: Presentation repository and public route

**Files:**
- Create: `src/lib/presentations/repository.ts`
- Create: `src/app/(frontend)/present/[shareToken]/page.tsx`
- Create: `src/components/presentations/PresentationView.tsx`
- Create: `src/styles/presentation.css`
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `getPublicPresentation(shareToken: string): Promise<PublicPresentation | null>`.
- Produces: `PublicPresentation` with title, cover, introduction, embed/open URLs, and validated supporting links.

- [ ] **Step 1: Add failing public projection tests**

Extract and test a pure `toPublicPresentation(doc)` projection in `repository.ts`. Assert it excludes `clientLabel`, database IDs, raw author URLs, timestamps, and visit data; invalid supporting links are filtered.

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke`

Expected: FAIL because the repository module does not exist.

- [ ] **Step 3: Implement the narrow Local API lookup**

Validate the token before querying. Call `payload.find` with `overrideAccess: true`, `limit: 1`, and a conjunction requiring token equality, `_status: published`, and `active: true`. Return only the public projection.

- [ ] **Step 4: Build the route and metadata**

Create the server page under `/present/[shareToken]`, return `notFound()` on every invalid/inactive/missing result, and define strict no-index metadata matching the existing award page. Do not include `clientLabel` in metadata.

- [ ] **Step 5: Build the responsive view**

Render optional cover/introduction, a `title`d 16:9 iframe using only `embedUrl`, `allowFullScreen`, a safe external fallback using `openUrl`, and configured supporting links. The iframe uses `referrerPolicy="strict-origin-when-cross-origin"` and a minimal `allow` list required for fullscreen.

- [ ] **Step 6: Add isolated presentation styling**

Import `presentation.css` in the frontend layout. Use existing Swiss Posters, Inter Tight, and DM Mono variables/classes; ensure a neutral shell, 16:9 aspect ratio, keyboard-visible focus states, and a usable mobile fallback. Do not alter award page selectors.

- [ ] **Step 7: Verify and commit**

Run: `npm run presentations:smoke && npm run lint && npx tsc --noEmit`

Expected: all pass.

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/repository.ts 'src/app/(frontend)/present' src/components/presentations/PresentationView.tsx src/styles/presentation.css 'src/app/(frontend)/layout.tsx'
git commit -m "feat: render private presentation pages"
```

---

### Task 4: Anonymous engagement endpoint and tracker

**Files:**
- Create: `src/app/api/presentation-events/route.ts`
- Create: `src/components/presentations/PresentationTracker.tsx`
- Modify: `src/components/presentations/PresentationView.tsx`
- Modify: `src/lib/presentations/repository.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Consumes: `parsePresentationEvent`, `classifyDevice`, and visit bounds from Task 1.
- Produces: `recordPresentationEvent({ shareToken, event, userAgent, now }): Promise<'recorded' | 'not-found'>`.
- Endpoint request: `{ shareToken: string, event: PresentationEvent }`; success response: HTTP 202 with no analytics data.

- [ ] **Step 1: Add failing event-recording tests**

Create injectable repository collaborators so the smoke test can supply fake `findVisit`, `createVisit`, and `updateVisit` functions. Assert open creates one record, a repeat open increments `visitCount`, heartbeat adds only bounded active seconds, an unknown link ID is rejected against the presentation's configured links, and not-found tokens disclose no details.

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke`

Expected: FAIL because event recording is not implemented.

- [ ] **Step 3: Implement atomic merge behaviour**

Look up the active published presentation from the token, identify visits by presentation/session, and update or create through Payload Local API with `overrideAccess: true`. Catch a compound-unique race by retrying one lookup/update. Never persist the request IP or full user agent.

- [ ] **Step 4: Implement the endpoint**

Reject request bodies over 4 KiB using `content-length` when present and bounded text parsing otherwise. Parse JSON defensively. Return `400` for malformed events, `404` for invalid/inactive tokens, and `202` for accepted events. Set `Cache-Control: no-store`.

- [ ] **Step 5: Implement the client tracker**

Generate/reuse a site-local UUID under `thisisour.presentation.session`. Send `open` once per page load. Count activity in one-second intervals only while `document.visibilityState === 'visible'` and within 30 seconds of pointer, keyboard, touch, or focus activity. Flush at most 15 seconds per heartbeat every 15 seconds, plus a best-effort `sendBeacon` on visibility change/page hide. Swallow network errors.

- [ ] **Step 6: Track supporting-link clicks**

Pass stable configured link IDs into tracker click handlers. Send the event without delaying navigation; do not record raw destination URLs in analytics.

- [ ] **Step 7: Verify and commit**

Run: `npm run presentations:smoke && npm run lint && npx tsc --noEmit`

Expected: all pass.

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/repository.ts src/app/api/presentation-events/route.ts src/components/presentations
git commit -m "feat: track anonymous presentation engagement"
```

---

### Task 5: Administrator engagement summary

**Files:**
- Create: `src/lib/presentations/summary.ts`
- Create: `src/components/payload/PresentationEngagementSummary.tsx`
- Modify: `src/payload/collections/Presentations.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `summarizePresentationVisits(visits): PresentationEngagementSummary`.
- Summary fields: `sessions`, `totalVisits`, `returningSessions`, `totalActiveSeconds`, `averageActiveSeconds`, `lastSeenAt`, and click counts by link ID.

- [ ] **Step 1: Add failing aggregation tests**

Test zero visits, multiple sessions, returning sessions where `visitCount > 1`, average rounding, latest timestamp, and click counts. Ensure malformed/unknown numeric values do not produce `NaN`.

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke`

Expected: FAIL because `summary.ts` does not exist.

- [ ] **Step 3: Implement the pure summary reducer**

Clamp negative metrics to zero, sum safe integers, divide average by session count, return `null` for no last-seen value, and aggregate only valid link IDs.

- [ ] **Step 4: Implement the authenticated admin component**

Use Payload admin document context to obtain the presentation ID and an authenticated same-origin Payload query or server component boundary to fetch visit records. Render compact labelled totals and an empty state. Do not expose this summary on the public presentation route.

- [ ] **Step 5: Register the component on presentation edit views**

Add it through the collection's edit-view component configuration beside the open-page action. Confirm it returns nothing for an unsaved document.

- [ ] **Step 6: Verify and commit**

Run: `npm run presentations:smoke && npm run lint && npx tsc --noEmit`

Expected: all pass.

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/summary.ts src/components/payload/PresentationEngagementSummary.tsx src/payload/collections/Presentations.ts
git commit -m "feat: show presentation engagement summary"
```

---

### Task 6: Types, migration, security regression, and documentation

**Files:**
- Modify: `src/payload-types.ts` (generated)
- Create: `src/migrations/<generated_timestamp>_add_presentations.ts` (generated, then reviewed)
- Modify: `scripts/security-smoke.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes all previous tasks.
- Produces deployable schema and documented operating workflow.

- [ ] **Step 1: Extend security regression assertions**

Add tests that anonymous collection read/create/update/delete access is denied as designed, token format rejects short guesses, constructed embeds use only the exact Google hostname, and supporting links continue to use `validatePublicHref`.

- [ ] **Step 2: Run RED if any collection invariant is missing**

Run: `npm run security:smoke`

Expected: PASS if prior access controls are correct; otherwise FAIL on the exact missing invariant before fixing it.

- [ ] **Step 3: Generate Payload types**

Run: `npm run generate:types`

Expected: `src/payload-types.ts` contains `Presentation` and `PresentationVisit` types and collection slug mappings.

- [ ] **Step 4: Generate and review the migration**

With the local database available, run:

```bash
npm run db:start
npm run migrate:create
```

Expected: a migration adds presentation, supporting-link, visit, and click tables/columns plus indexes. Review it to ensure a unique compound index exists for `(presentation_id, anonymous_session_id)` and a unique index exists for `share_token`. If Payload generation omits the compound index, add an explicit idempotent `CREATE UNIQUE INDEX` in `up` and matching `DROP INDEX IF EXISTS` in `down`.

- [ ] **Step 5: Update operating documentation**

Add a `Client Presentations` README section with exact admin workflow: make the deck link-viewable, create presentation, paste Slides URL, publish, copy private link, interpret anonymous metrics, deactivate/regenerate links, and understand the no-password/no-per-slide-analytics limitations.

- [ ] **Step 6: Run the full verification suite**

Run:

```bash
npm run presentations:smoke
npm run security:smoke
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Expected: every command exits 0; build lists `/present/[shareToken]` and `/api/presentation-events`; no whitespace errors.

- [ ] **Step 7: Perform focused browser verification**

Using local development with a test presentation, verify desktop and mobile layouts, keyboard focus, full-screen affordance, safe fallback link, published/active access behaviour, repeat visit merge, admin summary, and that an intentionally failed analytics request does not break the deck.

- [ ] **Step 8: Commit the deployable feature**

```bash
git add README.md scripts/security-smoke.ts src/payload-types.ts src/migrations
git commit -m "docs: finish presentation MVP delivery"
```

Do not push until `gh repo view aprnt/thisisouragency --json viewerPermission` reports `WRITE`, `MAINTAIN`, or `ADMIN`.

---

## Final Review Gate

Before requesting integration:

1. Confirm `git status --short` is clean.
2. Review `git log --oneline staging..HEAD` for the intended task commits.
3. Re-run the full verification suite from Task 6.
4. Confirm no presentation title, client label, token, or visit record is exposed by anonymous Payload REST/GraphQL queries.
5. Confirm the private presentation loads with browser tracking blocked.
6. Confirm the implementation matches `docs/superpowers/specs/2026-07-18-client-presentations-mvp-design.md` and deferred features were not added.
