# Figma Prototype Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a validated, responsive Figma Prototype block to the shared Payload block library and public Presentation projection.

**Architecture:** A pure URL parser owns exact-host validation and deterministic embed/open URL construction. A shared Payload block and React renderer consume that parser, while the existing public Presentation projection explicitly allowlists and revalidates the new block. Existing block analytics work unchanged through the shared presentation wrapper.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3.84, TypeScript, Node.js assertions, Tailwind utilities.

## Global Constraints

- Accept URLs, never raw iframe HTML.
- Require HTTPS and exact approved Figma hosts; reject credentials and lookalike hosts.
- Interface style is `minimal | full`, defaulting to `minimal`.
- Provide responsive 16:9 rendering, fullscreen permission, strict referrer policy, accessible title, and **Open prototype in Figma ↗** fallback.
- Make the block available to Award Entries and Presentations through `sharedEntryBlocks`.
- Revalidate and allowlist public Presentation block data.
- Do not claim or add analytics inside the cross-origin Figma iframe.
- Add no dependencies and no database schema migration.

---

### Task 1: Figma URL validation core

**Files:**
- Create: `src/lib/presentations/figma.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Produces: `type FigmaInterfaceStyle = 'minimal' | 'full'`.
- Produces: `parseFigmaPrototypeUrl(value: string, interfaceStyle?: FigmaInterfaceStyle): { embedUrl: string; openUrl: string } | null`.
- Produces: `validateFigmaPrototypeUrl(value?: string | null): true | string`.

- [ ] **Step 1: Write failing parser tests**

Add assertions for `/proto/`, `/design/`, and legacy `/file/` URLs on `www.figma.com`, plus normalization of `figma.com` to `www.figma.com`. Verify `minimal` creates an embed URL containing `hide-ui=1`, while `full` omits it. Verify `openUrl` preserves only allowlisted navigation parameters such as `node-id` and `starting-point-node-id`.

Add rejection cases:

```ts
for (const value of [
  'http://www.figma.com/proto/AbCdEfGhIjKlMnOpQrStUv/Test',
  'https://figma.example/proto/AbCdEfGhIjKlMnOpQrStUv/Test',
  'https://evil.figma.com/proto/AbCdEfGhIjKlMnOpQrStUv/Test',
  'https://user:pass@www.figma.com/proto/AbCdEfGhIjKlMnOpQrStUv/Test',
  'https://www.figma.com/community/file/123',
  'javascript:alert(1)',
]) {
  assert.equal(parseFigmaPrototypeUrl(value), null)
  assert.notEqual(validateFigmaPrototypeUrl(value), true)
}
```

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke`

Expected: FAIL because `src/lib/presentations/figma.ts` does not exist.

- [ ] **Step 3: Implement the minimal pure parser**

Use:

```ts
const FIGMA_HOSTS = new Set(['figma.com', 'www.figma.com'])
const FIGMA_PATH_TYPES = new Set(['proto', 'design', 'file'])
const FILE_KEY_PATTERN = /^[A-Za-z0-9]{10,}$/
const ALLOWED_QUERY_KEYS = new Set(['node-id', 'starting-point-node-id'])
```

Reject non-HTTPS URLs, credentials, unknown hosts/path types, or invalid keys. Normalize the open URL to `https://www.figma.com/<type>/<key>/<optional-name>` with allowlisted query parameters. Build the embed URL with `new URL('https://www.figma.com/embed')`, `embed_host=share`, `url=<openUrl>`, and `hide-ui=1` only for `minimal`.

- [ ] **Step 4: Run GREEN**

Run: `npm run presentations:smoke`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/figma.ts
git commit -m "feat: validate Figma prototype URLs"
```

### Task 2: Shared Payload block and renderer

**Files:**
- Create: `src/blocks/entries/EntryFigmaPrototype/config.ts`
- Create: `src/blocks/entries/EntryFigmaPrototype/Component.tsx`
- Modify: `src/blocks/entries/sharedBlocks.ts`
- Modify: `src/blocks/entries/RenderEntryBlocks.tsx`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Consumes: `parseFigmaPrototypeUrl` and `validateFigmaPrototypeUrl` from Task 1.
- Produces: Payload block slug `entryFigmaPrototype` and `EntryFigmaPrototypeComponent` props `{ prototypeUrl?: string | null; title?: string | null; interfaceStyle?: 'minimal' | 'full' | null }`.

- [ ] **Step 1: Write failing block-registration tests**

Update the expected shared slugs to append `entryFigmaPrototype`. Assert its fields contain required `prototypeUrl`, optional `title`, and a select field whose `defaultValue` is `minimal` with only `minimal` and `full` options. Read the component source and assert it includes `allowFullScreen`, `strict-origin-when-cross-origin`, and `Open prototype in Figma`.

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke`

Expected: FAIL because the shared block is absent.

- [ ] **Step 3: Add the minimal block configuration**

Configure:

```ts
fields: [
  { name: 'title', type: 'text', label: 'Accessible title' },
  { name: 'prototypeUrl', type: 'text', required: true, validate: validateFigmaPrototypeUrl },
  {
    name: 'interfaceStyle', type: 'select', required: true, defaultValue: 'minimal',
    options: [{ label: 'Minimal', value: 'minimal' }, { label: 'Full controls', value: 'full' }],
  },
]
```

- [ ] **Step 4: Add the responsive renderer and registry entry**

Mirror the Google Slides wrapper. Parse at render time, default title to `Figma prototype`, render the iframe only when parsing succeeds, and add the direct-open fallback with `target="_blank" rel="noreferrer"`.

- [ ] **Step 5: Run GREEN and related checks**

Run:

```bash
npm run presentations:smoke
npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/presentations-smoke.ts src/blocks/entries
git commit -m "feat: add shared Figma prototype block"
```

### Task 3: Secure public Presentation projection

**Files:**
- Modify: `src/lib/presentations/repository.ts`
- Modify: `scripts/presentations-smoke.ts`

**Interfaces:**
- Consumes: stored block type `entryFigmaPrototype` and Task 1 parser.
- Produces: public block `{ id, blockType: 'entryFigmaPrototype', prototypeUrl, title?, interfaceStyle }` only when its URL and style validate.

- [ ] **Step 1: Write failing projection tests**

Add a valid Figma block containing an extra `private` field and an invalid lookalike-host block to the `toPublicPresentation` fixture. Expect only the valid block, with `private` omitted and missing style normalized to `minimal`.

- [ ] **Step 2: Run RED**

Run: `npm run presentations:smoke`

Expected: FAIL because the projector does not recognize `entryFigmaPrototype`.

- [ ] **Step 3: Implement the allowlisted projector**

Add a dedicated branch that re-runs `parseFigmaPrototypeUrl`, accepts only `minimal` or `full`, and returns exactly:

```ts
{
  id: String(block.id),
  blockType: 'entryFigmaPrototype',
  prototypeUrl: String(block.prototypeUrl),
  ...(cleanTitle ? { title: cleanTitle } : {}),
  interfaceStyle,
}
```

Return `null` for an invalid URL or missing ID.

- [ ] **Step 4: Run GREEN and security regression**

Run:

```bash
npm run presentations:smoke
npm run security:smoke
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/presentations-smoke.ts src/lib/presentations/repository.ts
git commit -m "feat: project safe Figma presentation blocks"
```

### Task 4: Generated artifacts and full verification

**Files:**
- Modify: `src/payload-types.ts`
- Modify if generated: `src/app/(payload)/admin/importMap.js`

**Interfaces:**
- Consumes: completed shared Figma block.
- Produces: generated Payload types/admin registration and final verification evidence.

- [ ] **Step 1: Generate and review artifacts**

Run:

```bash
npm run generate:types
npm run generate:importmap
```

Expected: Payload types include `EntryFigmaPrototypeBlock`; no migration file is generated because blocks are stored in the existing JSON `layout` column.

- [ ] **Step 2: Run the full fresh verification suite**

Run:

```bash
npm run presentations:smoke
npm run security:smoke
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Expected: every command exits 0 with no lint/type/build errors.

- [ ] **Step 3: Review requirements and diff**

Confirm exact-host validation, raw-HTML exclusion, both interface styles, accessible/fallback rendering, shared registration, public allowlisting, no new dependency, no migration, and no iframe-internal analytics claim. Confirm `package.json` dependencies are unchanged.

- [ ] **Step 4: Commit generated artifacts**

```bash
git add src/payload-types.ts 'src/app/(payload)/admin/importMap.js'
git commit -m "chore: generate Figma block Payload artifacts"
```
