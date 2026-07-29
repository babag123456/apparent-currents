# Presentation Native Blocks and Slideshow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reuse the existing Payload block library in client Presentations, add Google Slides as a shared block, and render the same content as either a scrolling page or full-screen slideshow with block analytics.

**Architecture:** Export one shared block-config list consumed by Award Entries and Presentations, and extend the shared renderer with a safe Google Slides block. The private presentation projection exposes sanitised block data plus editor-selected display mode; separate scrolling and slideshow shells consume the same rendered blocks. Existing visit records gain bounded block metrics through the current tracking endpoint.

**Tech Stack:** Next.js 16 App Router, React 19, Payload CMS 3, PostgreSQL, TypeScript, existing Node assertion smoke tests and existing award-theme CSS.

## Global Constraints

- Work in the existing isolated `feature/client-presentations` worktree.
- Reuse existing block configs/components directly; do not duplicate or wrap their implementations.
- Google Slides is optional and available to both Award Entries and Presentations.
- `scroll` is the default display mode; the Payload editor selects `scroll` or `slideshow`.
- Preserve legacy Slides-only Presentations, private tokens, existing visits, and Award Entry rendering.
- Never render arbitrary iframe HTML or unvalidated iframe URLs.
- Never claim to observe events inside the Google iframe.
- Analytics events contain block ID/type/mode/counts only, never authored content or URLs.
- Add no runtime dependency.

---

### Task 1: Shared block list and Google Slides block

**Files:**
- Create: `src/blocks/entries/sharedBlocks.ts`
- Create: `src/blocks/entries/EntryGoogleSlides/config.ts`
- Create: `src/blocks/entries/EntryGoogleSlides/Component.tsx`
- Modify: `src/payload/collections/AwardEntries.ts`
- Modify: `src/blocks/entries/RenderEntryBlocks.tsx`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `sharedEntryBlocks: Block[]` in the existing block order plus `EntryGoogleSlides`.
- Produces: block slug `entryGoogleSlides` with fields `slidesUrl` and optional `title`.
- Consumes: `parseGoogleSlidesUrl` and `validateGoogleSlidesUrl`.

- [ ] **Step 1: Write failing shared-list and Google block assertions**

Extend `scripts/presentations-smoke.ts` to assert `sharedEntryBlocks.map(block => block.slug)` equals the exact 12-item list from the design, `AwardEntries.layout` references those same config objects, valid Slides URLs pass the block field validator, and hostile hosts fail.

- [ ] **Step 2: Verify RED**

Run with Node 20+: `node --import tsx scripts/presentations-smoke.ts`

Expected: FAIL because `sharedBlocks.ts` and `EntryGoogleSlides` do not exist.

- [ ] **Step 3: Implement shared configs and safe Slides component**

Move only the existing config imports/list into `sharedBlocks.ts`. Add the Slides config using the existing validator. Its component reparses the authored URL at render time, returns `null` when invalid, and renders a titled 16:9 iframe plus canonical direct-open fallback. Do not accept stored embed HTML.

- [ ] **Step 4: Use the shared list in Award Entries and renderer**

Replace the inline Award Entry blocks list with `sharedEntryBlocks`. Add one `entryGoogleSlides` case to `RenderEntryBlocks` while leaving every existing case unchanged.

- [ ] **Step 5: Verify GREEN and commit**

Run: `node --import tsx scripts/presentations-smoke.ts && npm run security:smoke && npm run lint && npx tsc --noEmit`

Expected: all pass.

```bash
git add scripts/presentations-smoke.ts src/blocks/entries src/payload/collections/AwardEntries.ts
git commit -m "feat: add Google Slides to shared content blocks"
```

---

### Task 2: Presentation layout, theme, mode, and public projection

**Files:**
- Modify: `src/payload/collections/Presentations.ts`
- Modify: `src/lib/presentations/repository.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Presentation fields: `theme: 'light' | 'dark'`, `displayMode: 'scroll' | 'slideshow'`, `layout: shared blocks`.
- Public projection adds `theme`, `displayMode`, and sanitised `layout` with stable `id` and `blockType`.
- Legacy projection remains available when layout is empty and top-level Slides URL is valid.

- [ ] **Step 1: Write failing model/projection assertions**

Assert Presentations exposes the shared block list, theme defaults to light, display mode defaults to scroll, and `toPublicPresentation` retains required block render fields while removing client labels, timestamps, provider-internal media fields, arbitrary properties, and invalid Google block URLs. Add a legacy Slides-only fixture and an empty-invalid fixture.

- [ ] **Step 2: Verify RED**

Run: `node --import tsx scripts/presentations-smoke.ts`

Expected: FAIL because the collection/projection lacks layout and mode.

- [ ] **Step 3: Add fields and sanitised projection**

Add the three fields using `sharedEntryBlocks`. Project blocks by recognised block type and the exact fields their existing components consume. For media/video relationships, retain public display fields only. Require either at least one valid block or a valid legacy Slides URL.

- [ ] **Step 4: Preserve legacy fallback**

Return a discriminated projection containing `layout` when blocks exist; otherwise preserve the current legacy `embedUrl/openUrl` result. Existing share-token lookup rules remain unchanged.

- [ ] **Step 5: Verify and commit**

Run: `node --import tsx scripts/presentations-smoke.ts && npm run security:smoke && npm run lint && npx tsc --noEmit`

```bash
git add scripts/presentations-smoke.ts src/payload/collections/Presentations.ts src/lib/presentations/repository.ts
git commit -m "feat: compose presentations from shared blocks"
```

---

### Task 3: Scrolling and full-screen slideshow renderers

**Files:**
- Create: `src/components/presentations/PresentationBlocks.tsx`
- Create: `src/components/presentations/PresentationSlideshow.tsx`
- Create: `src/lib/presentations/slideshow.ts`
- Modify: `src/components/presentations/PresentationView.tsx`
- Modify: `src/styles/presentation.css`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `isInteractiveNavigationTarget(target: EventTarget | null): boolean`.
- Produces: `nextSlide(index, count)` and `previousSlide(index, count)` with boundary clamping.
- `PresentationBlocks` wraps each block in `data-presentation-block-id` and `data-presentation-block-type` then delegates to `RenderEntryBlocks`.

- [ ] **Step 1: Write failing navigation assertions**

Test index boundaries, interactive-target detection for iframe/video/button/link/input/textarea/select/contenteditable, and false for a normal section. Test display-mode dispatch chooses scrolling by default and slideshow only for the explicit value.

- [ ] **Step 2: Verify RED**

Run: `node --import tsx scripts/presentations-smoke.ts`

Expected: FAIL because slideshow utilities/components do not exist.

- [ ] **Step 3: Implement scrolling block rendering**

Wrap stable block metadata around the existing renderer without modifying block output. Apply `EntryThemeProvider` and retain supporting links/tracker.

- [ ] **Step 4: Implement slideshow state and controls**

Create a client component with previous/next buttons, left/right keyboard navigation, 50-pixel horizontal swipe threshold, slide counter, progress bar, polite live region, URL hash index, and Fullscreen API enter/exit. Ignore navigation from interactive descendants. Clamp boundaries without wrapping.

- [ ] **Step 5: Add accessible responsive styling**

One block fills the viewport; overflowing content scrolls inside its slide. Add visible focus, reduced-motion rules, touch-safe controls, and internal iframe pointer/keyboard isolation. Reuse current typography/colours.

- [ ] **Step 6: Verify and commit**

Run: `node --import tsx scripts/presentations-smoke.ts && npm run lint && npx tsc --noEmit && npm run build`

```bash
git add scripts/presentations-smoke.ts src/components/presentations src/lib/presentations/slideshow.ts src/styles/presentation.css
git commit -m "feat: add presentation scroll and slideshow modes"
```

---

### Task 4: Block analytics, admin summary, migration, and delivery

**Files:**
- Modify: `src/lib/presentations/analytics.ts`
- Modify: `src/lib/presentations/repository.ts`
- Modify: `src/components/presentations/PresentationTracker.tsx`
- Modify: `src/lib/presentations/summary.ts`
- Modify: `src/components/payload/PresentationEngagementSummary.tsx`
- Modify: `src/payload/collections/PresentationVisits.ts`
- Modify: `scripts/presentations-smoke.ts`
- Modify: `scripts/security-smoke.ts`
- Modify: `src/payload-types.ts` (generated)
- Create: `src/migrations/<timestamp>_presentation_blocks.ts`
- Modify: `src/migrations/index.ts` (generated)
- Modify: `README.md`

**Interfaces:**
- New event: `{ type: 'blockHeartbeat'; sessionId; blockId; blockType; displayMode; activeSeconds: 1..30 }`.
- New event: `{ type: 'slideNavigation'; sessionId; blockId; blockType; displayMode: 'slideshow' }`.
- Visit metric rows: block ID/type, viewed boolean, bounded active seconds, navigation count, display mode.

- [ ] **Step 1: Write failing analytics assertions**

Test accepted/rejected mode values, block IDs/types, 1..30 second bounds, unknown published-block rejection, metric merging/caps, and summaries for block time/navigation/mode totals. Confirm no event accepts text, URLs, client labels, or arbitrary fields.

- [ ] **Step 2: Verify RED**

Run: `node --import tsx scripts/presentations-smoke.ts`

Expected: FAIL because block events/metrics do not exist.

- [ ] **Step 3: Extend visit model and event endpoint**

Add bounded block metrics to Presentation Visits. Before merging an event, load the published Presentation and require its block ID/type membership. Keep the current same-origin endpoint, body-size bounds, non-blocking failure behaviour, and anonymous session model.

- [ ] **Step 4: Track visible/active blocks**

Scrolling mode uses Intersection Observer and selects the block with the largest visible ratio. Slideshow mode reports the active block directly. Reuse current visibility/recent-activity heartbeat timing and flush behaviour; never attach listeners inside the iframe.

- [ ] **Step 5: Extend admin summary**

Show mode totals, blocks viewed, active seconds, and navigation counts using safe labels `<position> · <blockType>`. Do not copy authored content into visit records or labels.

- [ ] **Step 6: Generate types and delta migration**

Run `npm run generate:types`. With the existing local database started and current migrations applied, run `npm run migrate:create`. Review the migration to ensure it alters Presentation/visit schema only and preserves existing data; add exact compound/lookup indexes if generation omits them.

- [ ] **Step 7: Update documentation and import map**

Document shared blocks, optional Google Slides, both display modes, author workflow, analytics limits, and legacy fallback. Run `npm run generate:importmap` if Payload reports changed admin component mappings.

- [ ] **Step 8: Run final verification**

Run:

```bash
npm run presentations:smoke
npm run security:smoke
npm run lint
npx tsc --noEmit
npm run build
git diff --check
```

Perform desktop/mobile browser checks for mixed native/Google content in both modes, keyboard/swipe/fullscreen behaviour, iframe interaction isolation, private-link access, legacy fallback, and admin analytics.

- [ ] **Step 9: Commit delivery**

```bash
git add README.md scripts src
git commit -m "feat: track presentation block engagement"
```

Do not push until GitHub permission is `WRITE`, `MAINTAIN`, or `ADMIN`.

---

## Final Review Gate

1. Confirm the worktree is clean and review `git log --oneline staging..HEAD`.
2. Re-run the final verification suite.
3. Confirm anonymous REST/GraphQL cannot read Presentations or visits while authenticated Payload admins can.
4. Confirm Award Entries render every pre-existing block unchanged and can add Google Slides.
5. Confirm legacy Slides-only Presentation links still work.
6. Confirm no analytics payload or stored block metric includes authored content or URLs.
