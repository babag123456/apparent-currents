# Responsive Figma Fitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Figma prototypes fit cleanly within scrolling and slideshow viewports without cropping or distortion.

**Architecture:** Extend the pure Figma URL parser to preserve only safe navigation/scaling parameters. Give the Figma renderer stable semantic classes, then use shared CSS constraints plus a slideshow override to fit a centered 16:9 frame within the available width and height.

**Tech Stack:** TypeScript, React 19, Next.js 16, Payload CMS 3.84, CSS, Node.js assertion smoke tests.

## Global Constraints

- Preserve `node-id`, `starting-point-node-id`, `page-id`, `scaling`, and `content-scaling` only.
- Remove unrelated query parameters from Figma open/embed URLs.
- Maintain a 16:9 frame without cropping or distortion.
- Cap scrolling embeds to available viewport height.
- Use more available height in slideshow mode while retaining control-safe spacing.
- Add no CMS fields, dependencies, migrations, or iframe-internal analytics.

---

### Task 1: Preserve safe Figma scaling parameters

**Files:**
- Modify: `scripts/presentations-smoke.ts`
- Modify: `src/lib/presentations/figma.ts`

**Interfaces:**
- Consumes: `parseFigmaPrototypeUrl(value, interfaceStyle)`.
- Produces: canonical open/embed URLs containing only the five approved query keys.

- [ ] **Step 1: Write the failing parser assertion**

Use a URL containing all approved parameters plus `utm_source=remove-me`. Expect the canonical `openUrl` to preserve:

```text
node-id=1-2&starting-point-node-id=3%3A4&page-id=5%3A6&scaling=scale-down&content-scaling=fixed
```

and omit `utm_source`.

- [ ] **Step 2: Run RED**

Run:

```bash
node --import tsx --input-type=module -e "import assert from 'node:assert/strict'; import { parseFigmaPrototypeUrl } from './src/lib/presentations/figma.ts'; const result = parseFigmaPrototypeUrl('https://www.figma.com/proto/AbCdEfGhIjKlMnOpQrStUv/Test?node-id=1-2&starting-point-node-id=3%3A4&page-id=5%3A6&scaling=scale-down&content-scaling=fixed&utm_source=remove-me'); assert.equal(result?.openUrl, 'https://www.figma.com/proto/AbCdEfGhIjKlMnOpQrStUv/Test?node-id=1-2&starting-point-node-id=3%3A4&page-id=5%3A6&scaling=scale-down&content-scaling=fixed')"
```

Expected: FAIL because `page-id`, `scaling`, and `content-scaling` are currently removed.

- [ ] **Step 3: Extend the exact allowlist**

Change:

```ts
const ALLOWED_QUERY_KEYS = [
  'node-id', 'starting-point-node-id', 'page-id', 'scaling', 'content-scaling',
] as const
```

- [ ] **Step 4: Run GREEN**

Run the targeted assertion and `npm run presentations:smoke` with local `DATABASE_URL` and `PAYLOAD_SECRET`.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/figma.ts
git commit -m "fix: preserve safe Figma scaling parameters"
```

### Task 2: Fit the shared Figma frame to both view modes

**Files:**
- Modify: `src/blocks/entries/EntryFigmaPrototype/Component.tsx`
- Modify: `src/styles/presentation.css`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `.figma-prototype`, `.figma-prototype__inner`, `.figma-prototype__frame`, and `.figma-prototype__fallback` hooks.
- Consumes: `.presentation-slide` slideshow context.

- [ ] **Step 1: Write failing source/CSS assertions**

Assert the component contains the four class hooks. Assert presentation CSS contains:

```css
.figma-prototype__frame { aspect-ratio: 16 / 9; }
.presentation-slide .figma-prototype__frame { max-height: calc(100dvh - 8rem); }
```

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke` with the local test environment.

Expected: FAIL because the class hooks and viewport rules are absent.

- [ ] **Step 3: Replace the inline padding-ratio wrapper**

Use the semantic classes and remove the inline `paddingBottom` style. Keep the iframe absolutely positioned at full width/height and keep the fallback link outside the frame.

- [ ] **Step 4: Add shared and slideshow fitting rules**

Add CSS that centers the inner container, sets the frame to `width: min(100%, calc((100dvh - 8rem) * 16 / 9))`, `max-height: calc(100dvh - 8rem)`, and `aspect-ratio: 16 / 9`. In slideshow context, reduce section padding, make the inner container use the available slide height, and reserve space for the controls/fallback.

- [ ] **Step 5: Run GREEN**

Run:

```bash
npm run presentations:smoke
npm run security:smoke
npm run lint
npm run build
```

Expected: smoke/security/build exit 0; lint has zero errors and only the eight existing migration warnings.

- [ ] **Step 6: Commit and restart localhost**

```bash
git add scripts/presentations-smoke.ts src/blocks/entries/EntryFigmaPrototype/Component.tsx src/styles/presentation.css
git commit -m "fix: fit Figma prototypes to presentation viewports"
```

Restart `npm start` with the local PostgreSQL URL and preview secret, then verify the presentation and admin routes return HTTP 200.
