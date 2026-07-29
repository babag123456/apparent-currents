# Figma Frame Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand one Payload Figma prototype block into an accurately counted sequence of native presentation slides discovered from the prototype's forward connections.

**Architecture:** A server-only Figma client fetches the selected page using `FIGMA_ACCESS_TOKEN`, while a pure ordering function follows reactions or falls back to top-to-bottom/left-to-right canvas order when no reactions exist. Payload stores that sequence on the block; public projection expands it into synthetic slide blocks rendered with direct Embed Kit 2.0 URLs.

**Tech Stack:** TypeScript, Payload CMS 3 hooks and block fields, Next.js 16, React 19, Figma REST API, Node assertion smoke tests.

## Global Constraints

- The access token is server-only and must never enter Payload data, logs, public projection, or browser markup.
- Only validated HTTPS Figma prototype URLs and official Figma API/embed hosts are permitted.
- Linear forward flows are supported; branches, loops, missing start nodes, and empty flows return explicit errors.
- A failed refresh retains a previous successful frame sequence; a first sync failure prevents a publishable result.
- Every embed uses direct Embed Kit 2.0 and `scaling=contain`.
- Existing non-Figma blocks, scroll mode, slideshow mode, analytics, and legacy Google Slides fallback must continue working.

---

### Task 1: Parse Prototype Identity and Generate Embed Kit 2.0 URLs

**Files:**
- Modify: `src/lib/presentations/figma.ts`
- Test: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `parseFigmaPrototypeUrl(value, interfaceStyle?, frameNodeId?) => FigmaPrototypeUrls | null`, where the result includes `fileKey`, `startNodeId`, `embedUrl`, and `openUrl`.
- Produces: direct `https://embed.figma.com/proto/...` iframe URLs with top-level `embed-host`, `node-id`, `starting-point-node-id`, `scaling=contain`, and UI parameters.

- [ ] **Step 1: Add failing URL tests**

Add assertions that a saved `/proto/{fileKey}/...?...node-id=23055-3529&page-id=...&scaling=min-zoom` parses to `fileKey === fileKey`, `startNodeId === '23055:3529'`, and a direct `embed.figma.com/proto/...` URL. Add a frame override assertion showing `frameNodeId: '23055:4000'` becomes `node-id=23055-4000`, while `starting-point-node-id` remains the original start and `scaling=contain` overrides pasted zoom.

- [ ] **Step 2: Run the smoke test and verify RED**

Run: `npm run presentations:smoke`

Expected: FAIL because identity fields, node override, and the Embed Kit 2.0 URL are absent.

- [ ] **Step 3: Implement normalized identity and embed generation**

Normalize node IDs to colon form internally and hyphen form in query parameters. Build `openUrl` on `www.figma.com/proto/...`; build `embedUrl` directly on `embed.figma.com/proto/...`. Preserve only approved navigation/content parameters, force `scaling=contain`, set `embed-host=thisisouragency`, and map minimal UI to documented Embed Kit parameters rather than legacy `hide-ui`.

- [ ] **Step 4: Verify GREEN and commit**

Run: `npm run presentations:smoke && git diff --check`

Expected: PASS.

Commit: `git commit -am "feat: generate Figma Embed Kit 2 URLs"`

---

### Task 2: Build the Linear Prototype Graph Walker and API Client

**Files:**
- Create: `src/lib/presentations/figmaSync.ts`
- Test: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `type SyncedFigmaFrame = { nodeId: string; name: string; width: number; height: number }`.
- Produces: `orderFigmaPrototypeFrames(document: FigmaDocumentNode, startNodeId: string): SyncedFigmaFrame[]`.
- Produces: `fetchFigmaPrototypeFrames({ fileKey, startNodeId, token, fetchImpl? }): Promise<SyncedFigmaFrame[]>`.

- [ ] **Step 1: Add failing graph fixtures**

Create compact document fixtures whose top-level frames contain `reactions[].action.destinationId`. Assert a three-frame chain returns `[A, B, C]` with dimensions from `absoluteBoundingBox`. Add assertions that two forward destinations throw `Figma prototype branches at "A".`, a repeated destination throws `Figma prototype contains a loop.`, and unknown/empty starting nodes throw precise errors.

- [ ] **Step 2: Run and verify RED**

Run: `npm run presentations:smoke`

Expected: FAIL because `figmaSync.ts` does not exist.

- [ ] **Step 3: Implement the pure walker**

Recursively index document nodes by normalized ID. Treat navigation reactions with destination IDs as forward edges, ignore non-navigation reactions and self-contained overlays, require at most one unique forward destination per presented frame, track visited IDs, and return the start frame plus each reachable destination.

- [ ] **Step 4: Add failing transport tests**

Inject a fake `fetchImpl`. Assert the request targets `https://api.figma.com/v1/files/{fileKey}`, sends `X-Figma-Token`, never places the token in the URL, maps a successful document through the walker, and turns 401, 403, 429, and malformed JSON into editor-safe messages without response bodies or credentials.

- [ ] **Step 5: Implement transport, verify, and commit**

Run: `npm run presentations:smoke && npm run security:smoke && git diff --check`

Expected: PASS with no token leakage.

Commit: `git add src/lib/presentations/figmaSync.ts scripts/presentations-smoke.ts && git commit -m "feat: discover linear Figma prototype frames"`

---

### Task 3: Sync Frames into Payload Blocks

**Files:**
- Modify: `src/blocks/entries/EntryFigmaPrototype/config.ts`
- Create: `src/lib/presentations/figmaBlockSync.ts`
- Modify: `src/payload/collections/Presentations.ts`
- Modify: `src/payload-types.ts` (generated)
- Test: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: hidden/read-only block fields `syncedFrames`, `figmaSyncedAt`, and `figmaSyncError`.
- Produces: `syncFigmaBlocks({ layout, previousLayout, token, fetchFrames, now }): Promise<unknown[]>`.
- Consumes: `parseFigmaPrototypeUrl` and `fetchFigmaPrototypeFrames` from Tasks 1-2.

- [ ] **Step 1: Add failing block-sync tests**

Assert that a new Figma block calls the injected fetcher and stores ordered frames plus an ISO timestamp; an unchanged block with frames avoids a redundant fetch; a URL change resyncs; a failed refresh retains previous frames and stores a safe error; a first failure rejects; and a non-Figma block is unchanged.

- [ ] **Step 2: Run and verify RED**

Run: `npm run presentations:smoke`

Expected: FAIL because sync fields and orchestration are absent.

- [ ] **Step 3: Add server-managed fields and sync orchestration**

Define `syncedFrames` as a hidden/read-only array of required `nodeId`, `name`, `width`, and `height`; define hidden/read-only timestamp and error fields. Implement immutable layout mapping and previous-block lookup by block ID. Read `FIGMA_ACCESS_TOKEN` only inside the collection hook, run sync after existing URL/share-token preparation, and preserve drafts with stale successful data on refresh errors.

- [ ] **Step 4: Regenerate types and verify schema**

Run: `npm run generate:types && npm run presentations:smoke && npm run security:smoke`

Expected: generated `EntryFigmaPrototypeBlock` contains the sync fields and all checks pass. Because presentation layout is stored as JSONB, no SQL schema migration should be generated; confirm with `git status --short`.

- [ ] **Step 5: Commit**

Commit: `git add src/blocks/entries/EntryFigmaPrototype/config.ts src/lib/presentations/figmaBlockSync.ts src/payload/collections/Presentations.ts src/payload-types.ts scripts/presentations-smoke.ts && git commit -m "feat: sync Figma frames when presentations save"`

---

### Task 4: Expand Synced Frames into Native Presentation Slides

**Files:**
- Create: `src/lib/presentations/figmaSlides.ts`
- Modify: `src/lib/presentations/repository.ts`
- Modify: `src/blocks/entries/EntryFigmaPrototype/Component.tsx`
- Test: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `expandFigmaSlides(blocks: PublicBlock[]): PublicBlock[]`.
- A synthetic frame slide has `id: "{sourceBlockId}--figma--{encodedNodeId}"`, `sourceBlockId`, `figmaFrameNodeId`, frame title, and the existing safe Figma fields.
- Consumes: Task 1's optional frame override to render the direct per-frame embed URL.

- [ ] **Step 1: Add failing projection and expansion tests**

Assert one Figma block with three stored frames becomes three consecutive public blocks between neighbouring native blocks, with unique stable IDs and frame node IDs. Assert `figmaSyncError` and unknown stored fields are absent publicly, while invalid or unsynced Figma blocks are dropped. Assert the EB Expo-style block produces three direct embed URLs with `scaling=contain`.

- [ ] **Step 2: Run and verify RED**

Run: `npm run presentations:smoke`

Expected: FAIL because Figma blocks still project one-to-one.

- [ ] **Step 3: Implement safe projection and expansion**

Allowlist only frame ID/name/dimensions from `syncedFrames`, create stable synthetic slide IDs, and call expansion during `toPublicPresentation`. Update the Figma component to pass `figmaFrameNodeId` to the parser and use each frame name as the fallback accessible title.

- [ ] **Step 4: Verify both display modes and commit**

Run: `npm run presentations:smoke && npm run security:smoke && git diff --check`

Expected: PASS; `PresentationView` receives already-expanded blocks, so existing scroll and slideshow renderers both work without branching logic.

Commit: `git add src/lib/presentations/figmaSlides.ts src/lib/presentations/repository.ts src/blocks/entries/EntryFigmaPrototype/Component.tsx scripts/presentations-smoke.ts && git commit -m "feat: render synced Figma frames as slides"`

---

### Task 5: Preserve Analytics for Synthetic Figma Slides

**Files:**
- Modify: `src/lib/presentations/repository.ts`
- Test: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `isValidPresentationBlockTarget(layout, blockId, blockType): boolean`.
- Consumes: the synthetic ID format from Task 4.

- [ ] **Step 1: Add failing analytics validation tests**

Assert stored block `figma-1` accepts event target `figma-1--figma--23055%3A4000` only when its type is `entryFigmaPrototype`; reject forged prefixes, unknown frame IDs, wrong block types, and ordinary unknown IDs. Validate synthetic frame IDs against the stored `syncedFrames` list rather than prefix matching alone.

- [ ] **Step 2: Run and verify RED**

Run: `npm run presentations:smoke`

Expected: FAIL because event validation only accepts stored block IDs.

- [ ] **Step 3: Implement exact source/frame validation**

Parse the synthetic ID, locate the source block, verify block type, decode the frame ID, and require a matching stored synced frame. Replace the inline `layout.some(...)` event check with this helper.

- [ ] **Step 4: Verify and commit**

Run: `npm run presentations:smoke && npm run security:smoke && git diff --check`

Expected: PASS.

Commit: `git add src/lib/presentations/repository.ts scripts/presentations-smoke.ts && git commit -m "fix: validate analytics for synced Figma slides"`

---

### Task 6: Configure, Sync EB Expo, and Verify End-to-End

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Potentially modify: generated migration files only if Payload reports an actual non-JSONB schema change.

**Interfaces:**
- Runtime input: `FIGMA_ACCESS_TOKEN` with read access to the prototype file.

- [ ] **Step 1: Document server configuration**

Add `FIGMA_ACCESS_TOKEN=` to `.env.example`. Document creation of a least-privilege Figma personal access token, local setup, production secret setup, save-to-sync behaviour, stale-data fallback, and linear-flow limitation. Do not write a real token to any tracked file.

- [ ] **Step 2: Run full verification**

Run with the supported bundled Node runtime:

```bash
npm run generate:types
npm run presentations:smoke
npm run security:smoke
npm run lint
npm run build
npm run migrate:verify-blank
git diff --check
```

Expected: all commands pass; lint may retain only the existing migration unused-argument warnings.

- [ ] **Step 3: Configure localhost and sync the real record**

Provide `FIGMA_ACCESS_TOKEN` through the local untracked environment, restart the production server, open Payload, and re-save EB Expo. Confirm the stored block has more than one synced frame and no sync error. Never print the token.

- [ ] **Step 4: Verify the public presentation**

Open `http://localhost:3000/present/amber-orbit-canvas-river-2026-xx`. Confirm the outer counter matches the discovered Figma frame count, arrows and keyboard navigation advance frames, all frames use contained fitting, fullscreen still works, and the route returns HTTP 200.

- [ ] **Step 5: Commit documentation and final generated artifacts**

Commit: `git add .env.example README.md src/payload-types.ts && git commit -m "docs: configure Figma prototype sync"`
