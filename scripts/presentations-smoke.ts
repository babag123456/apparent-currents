import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import {
  classifyDevice,
  mergeVisitMetrics,
  parsePresentationEvent,
} from '../src/lib/presentations/analytics.ts'
import {
  extractGoogleSlidesId,
  parseGoogleSlidesUrl,
  validateGoogleSlidesUrl,
} from '../src/lib/presentations/googleSlides.ts'
import { deriveSlideTitle, orderGoogleSlides } from '../src/lib/presentations/googleSlidesSync.ts'
import { syncGoogleSlidesDecks } from '../src/lib/presentations/googleSlidesBlockSync.ts'
import { expandGoogleSlideDecks } from '../src/lib/presentations/figmaSlides.ts'
import {
  parseFigmaPrototypeUrl,
  validateFigmaPrototypeUrl,
} from '../src/lib/presentations/figma.ts'
import { fetchFigmaPrototypeFrames, orderFigmaPrototypeFrames } from '../src/lib/presentations/figmaSync.ts'
import { syncFigmaBlocks } from '../src/lib/presentations/figmaBlockSync.ts'
import {
  createPresentationShareToken,
  isValidPresentationShareToken,
} from '../src/lib/presentations/shareToken.ts'
import { PresentationVisits } from '../src/payload/collections/PresentationVisits.ts'
import { Presentations } from '../src/payload/collections/Presentations.ts'
import { sharedEntryBlocks } from '../src/blocks/entries/sharedBlocks.ts'
import { isValidPresentationBlockTarget, mergeBlockJourney, mergeBlockMetrics, mergeLinkClicks, toPublicPresentation } from '../src/lib/presentations/repository.ts'
import { summarizePresentationVisits } from '../src/lib/presentations/summary.ts'
import { summarizePresentationDashboard } from '../src/lib/presentations/dashboard.ts'
import { isInteractiveNavigationTarget, nextSlide, previousSlide } from '../src/lib/presentations/slideshow.ts'

const deckId = '1AbCdEfGhIjKlMnOpQrStUvWxYz_123456'
const publishedId = '2PACX-1vQwertyUiopAsdfGhjkLzxcVbnm123456'
const figmaKey = 'AbCdEfGhIjKlMnOpQrStUv'

assert.equal(nextSlide(0, 3), 1)
assert.equal(nextSlide(2, 3), 2)
assert.equal(previousSlide(2, 3), 1)
assert.equal(previousSlide(0, 3), 0)
assert.equal(isInteractiveNavigationTarget({ closest: () => ({}) } as unknown as EventTarget), true)
assert.equal(isInteractiveNavigationTarget({ closest: () => null } as unknown as EventTarget), false)

assert.deepEqual(sharedEntryBlocks.map((block) => block.slug), [
  'entryHero', 'entryCaseStudy', 'entryRichText', 'entryMedia', 'entryResults', 'entryQuote',
  'entryImageGrid', 'entryVideo', 'entryButton', 'entrySpacer', 'entryDivider', 'entryGoogleSlides',
  'entryGoogleSlidesDeck', 'entryFigmaPrototype',
])

const figmaBlock = sharedEntryBlocks.find((block) => block.slug === 'entryFigmaPrototype')
assert.ok(figmaBlock)
const figmaFields = figmaBlock.fields.filter((field) => 'name' in field) as Array<{
  defaultValue?: unknown
  name: string
  options?: Array<{ value: unknown }>
  required?: boolean
}>
assert.equal(figmaFields.find((field) => field.name === 'prototypeUrl')?.required, true)
assert.equal(figmaFields.find((field) => field.name === 'interfaceStyle')?.defaultValue, 'minimal')
assert.deepEqual(
  figmaFields.find((field) => field.name === 'interfaceStyle')?.options?.map((option) => option.value),
  ['minimal', 'full'],
)
const figmaComponentSource = readFileSync(
  new URL('../src/blocks/entries/EntryFigmaPrototype/Component.tsx', import.meta.url),
  'utf8',
)
assert.match(figmaComponentSource, /allowFullScreen/)
assert.match(figmaComponentSource, /strict-origin-when-cross-origin/)
assert.match(figmaComponentSource, /Open prototype in Figma/)
for (const className of [
  'figma-prototype',
  'figma-prototype__inner',
  'figma-prototype__frame',
  'figma-prototype__fallback',
]) {
  assert.match(figmaComponentSource, new RegExp(className))
}
const presentationCssSource = readFileSync(
  new URL('../src/styles/presentation.css', import.meta.url),
  'utf8',
)
assert.match(presentationCssSource, /\.figma-prototype__frame\s*\{[\s\S]*?aspect-ratio:\s*16\s*\/\s*9/)
assert.match(presentationCssSource, /\.presentation-slide \.figma-prototype__frame\s*\{[\s\S]*?max-height:\s*calc\(100dvh - 8rem\)/)
assert.match(presentationCssSource, /\.google-slides-deck__frame\s*\{[\s\S]*?max-height:\s*calc\(100dvh - 8rem\)/)
assert.match(presentationCssSource, /\.presentation-slide \.google-slides-deck__frame\s*\{[\s\S]*?max-height:\s*calc\(100dvh - 5rem\)/)

const deckComponentSource = readFileSync(
  new URL('../src/blocks/entries/EntryGoogleSlidesDeck/Component.tsx', import.meta.url),
  'utf8',
)
assert.match(deckComponentSource, /object-contain/)
assert.match(deckComponentSource, /strict-origin-when-cross-origin/)
for (const className of ['google-slides-deck', 'google-slides-deck__inner', 'google-slides-deck__frame', 'google-slides-deck__fallback']) {
  assert.match(deckComponentSource, new RegExp(className))
}
// The inline (module) player is native images with its own nav — no Google
// iframe, so viewers never reach presenter notes or the deck menu.
const deckPlayerSource = readFileSync(
  new URL('../src/components/presentations/GoogleSlidesDeckPlayer.tsx', import.meta.url),
  'utf8',
)
assert.doesNotMatch(deckPlayerSource, /<iframe/)
assert.match(deckPlayerSource, /requestFullscreen/)
for (const className of ['google-slides-player', 'google-slides-player__frame', 'google-slides-player__controls']) {
  assert.match(deckPlayerSource, new RegExp(className))
}
assert.match(deckComponentSource, /GoogleSlidesDeckPlayer/)
assert.match(presentationCssSource, /\.presentation-slideshow:fullscreen[\s\S]*?max-height:\s*100dvh/)

const deckBlock = sharedEntryBlocks.find((block) => block.slug === 'entryGoogleSlidesDeck')
assert.ok(deckBlock)
const deckFields = deckBlock.fields.filter((field) => 'name' in field) as Array<{ name: string; required?: boolean }>
assert.equal(deckFields.find((field) => field.name === 'slidesUrl')?.required, true)
assert.ok(deckFields.some((field) => field.name === 'syncedSlides'))

for (const value of [
  `https://docs.google.com/presentation/d/${deckId}/edit#slide=id.p`,
  `https://docs.google.com/presentation/d/${deckId}/present`,
  `https://docs.google.com/presentation/d/e/${publishedId}/pub?start=false`,
]) {
  assert.equal(validateGoogleSlidesUrl(value), true, `${value} should validate`)
}
assert.equal(validateGoogleSlidesUrl(undefined), true, 'legacy Slides URL should be optional')

assert.deepEqual(parseGoogleSlidesUrl(`https://docs.google.com/presentation/d/${deckId}/edit`), {
  embedUrl: `https://docs.google.com/presentation/d/${deckId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/${deckId}/present`,
})
assert.deepEqual(parseGoogleSlidesUrl(`https://docs.google.com/presentation/d/e/${publishedId}/pub`), {
  embedUrl: `https://docs.google.com/presentation/d/e/${publishedId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/e/${publishedId}/pub`,
})

for (const value of [
  'javascript:alert(1)',
  `https://evil.example/presentation/d/${deckId}/edit`,
  'https://docs.google.com/presentation/d/x/edit',
  `http://docs.google.com/presentation/d/${deckId}/edit`,
]) {
  assert.notEqual(validateGoogleSlidesUrl(value), true, `${value} should be rejected`)
  assert.equal(parseGoogleSlidesUrl(value), null)
}

for (const value of [
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2`,
  `https://www.figma.com/design/${figmaKey}/Client-Prototype?node-id=1-2`,
  `https://figma.com/file/${figmaKey}/Client-Prototype?starting-point-node-id=3%3A4`,
]) {
  assert.equal(validateFigmaPrototypeUrl(value), true, `${value} should validate`)
}

const minimalFigma = parseFigmaPrototypeUrl(
  `https://figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2&utm_source=unsafe`,
)
assert.equal(
  minimalFigma?.openUrl,
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2&scaling=contain`,
)
assert.equal(minimalFigma?.fileKey, figmaKey)
assert.equal(minimalFigma?.startNodeId, '1:2')
assert.equal(minimalFigma?.embedUrl, `https://embed.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2&scaling=contain&embed-host=thisisouragency&footer=false`)

const fullFigma = parseFigmaPrototypeUrl(
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?starting-point-node-id=3%3A4`,
  'full',
)
assert.equal(
  fullFigma?.openUrl,
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?starting-point-node-id=3%3A4&scaling=contain`,
)
assert.equal(fullFigma?.embedUrl, `https://embed.figma.com/proto/${figmaKey}/Client-Prototype?starting-point-node-id=3%3A4&scaling=contain&embed-host=thisisouragency`)

const scaledFigma = parseFigmaPrototypeUrl(
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2&starting-point-node-id=3%3A4&page-id=5%3A6&scaling=min-zoom&content-scaling=fixed&utm_source=remove-me`,
)
assert.equal(
  scaledFigma?.openUrl,
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2&starting-point-node-id=3%3A4&page-id=5%3A6&scaling=contain&content-scaling=fixed`,
)
const overriddenFigma = parseFigmaPrototypeUrl(
  `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2&scaling=min-zoom`,
  'minimal',
  '5:6',
)
assert.equal(overriddenFigma?.startNodeId, '1:2')
assert.match(overriddenFigma?.embedUrl ?? '', /node-id=5-6/)
assert.match(overriddenFigma?.embedUrl ?? '', /starting-point-node-id=1%3A2/)
assert.equal(scaledFigma?.pageId, '5:6')

const figmaDocument = {
  id: '0:0', name: 'Document', type: 'DOCUMENT', children: [{
    id: '1:1', name: 'Page', type: 'CANVAS', children: [
      { id: '1:2', name: 'A', type: 'FRAME', absoluteBoundingBox: { width: 1600, height: 900 }, reactions: [{ action: { destinationId: '1:3' } }] },
      { id: '1:3', name: 'B', type: 'FRAME', absoluteBoundingBox: { width: 1600, height: 900 }, reactions: [{ action: { destinationId: '1:4' } }] },
      { id: '1:4', name: 'C', type: 'FRAME', absoluteBoundingBox: { width: 1600, height: 900 } },
    ],
  }],
}
assert.deepEqual(orderFigmaPrototypeFrames(figmaDocument, '1:2').map((frame) => frame.name), ['A', 'B', 'C'])
assert.throws(
  () => orderFigmaPrototypeFrames({ ...figmaDocument, children: [{ id: '1:1', type: 'CANVAS', children: [
    { id: '1:2', name: 'A', type: 'FRAME', reactions: [{ action: { destinationId: '1:3' } }, { action: { destinationId: '1:4' } }] },
    { id: '1:3', name: 'B', type: 'FRAME' }, { id: '1:4', name: 'C', type: 'FRAME' },
  ] }] }, '1:2'),
  /branches at "A"/,
)
assert.throws(
  () => orderFigmaPrototypeFrames({ ...figmaDocument, children: [{ id: '1:1', type: 'CANVAS', children: [
    { id: '1:2', name: 'A', type: 'FRAME', reactions: [{ action: { destinationId: '1:3' } }] },
    { id: '1:3', name: 'B', type: 'FRAME', reactions: [{ action: { destinationId: '1:2' } }] },
  ] }] }, '1:2'),
  /contains a loop/,
)
assert.throws(() => orderFigmaPrototypeFrames(figmaDocument, '9:9'), /starting frame was not found/)
const canvasOrderedDocument = {
  id: '5:6', name: 'Page', type: 'CANVAS', children: [
    { id: '1:4', name: 'Third', type: 'FRAME', absoluteBoundingBox: { x: 0, y: 100, width: 1600, height: 900 } },
    { id: '1:3', name: 'Second', type: 'FRAME', absoluteBoundingBox: { x: 2000, y: 0, width: 1600, height: 900 } },
    { id: '1:2', name: 'First', type: 'FRAME', absoluteBoundingBox: { x: 0, y: 0, width: 1600, height: 900 } },
    { id: '9:9', name: 'Ignore section', type: 'SECTION', absoluteBoundingBox: { x: 0, y: -100, width: 1, height: 1 } },
  ],
}
assert.deepEqual(orderFigmaPrototypeFrames(canvasOrderedDocument, '1:2').map((frame) => frame.name), ['First', 'Second', 'Third'])

let figmaRequest: { init?: RequestInit; url?: string } = {}
const fetchedFrames = await fetchFigmaPrototypeFrames({
  fileKey: figmaKey,
  pageId: '5:6',
  startNodeId: '1:2',
  token: 'secret-token',
  fetchImpl: async (input, init) => {
    figmaRequest = { url: String(input), init }
    return new Response(JSON.stringify({ nodes: { '5:6': { document: figmaDocument } } }), { status: 200 })
  },
})
assert.equal(fetchedFrames.length, 3)
assert.equal(figmaRequest.url, `https://api.figma.com/v1/files/${figmaKey}/nodes?ids=5%3A6&depth=1`)
assert.equal(new Headers(figmaRequest.init?.headers).get('X-Figma-Token'), 'secret-token')
assert.doesNotMatch(figmaRequest.url ?? '', /secret-token/)
await assert.rejects(
  fetchFigmaPrototypeFrames({ fileKey: figmaKey, pageId: '5:6', startNodeId: '1:2', token: 'secret-token', fetchImpl: async () => new Response('private body', { status: 403 }) }),
  /Figma denied access to this prototype/,
)

const unsyncedLayout = [{ id: 'figma-sync-1', blockType: 'entryFigmaPrototype', prototypeUrl: `https://www.figma.com/proto/${figmaKey}/Deck?node-id=1-2` }]
let syncCalls = 0
const syncedLayout = await syncFigmaBlocks({
  layout: unsyncedLayout,
  now: new Date('2026-07-18T12:00:00.000Z'),
  token: 'secret-token',
  fetchFrames: async () => { syncCalls += 1; return orderFigmaPrototypeFrames(figmaDocument, '1:2') },
})
assert.equal(syncCalls, 1)
assert.equal(syncedLayout[0].syncedFrames?.length, 3)
assert.equal(syncedLayout[0].figmaSyncedAt, '2026-07-18T12:00:00.000Z')
await syncFigmaBlocks({
  layout: syncedLayout,
  previousLayout: syncedLayout,
  token: 'secret-token',
  fetchFrames: async () => { syncCalls += 1; return [] },
})
assert.equal(syncCalls, 1)
const staleLayout = await syncFigmaBlocks({
  layout: syncedLayout.map((block) => ({ ...block, forceFigmaSync: true })),
  previousLayout: syncedLayout,
  token: 'secret-token',
  fetchFrames: async () => { throw new Error('Figma could not sync this prototype.') },
})
assert.equal(staleLayout[0].syncedFrames?.length, 3)
assert.equal(staleLayout[0].figmaSyncError, 'Figma could not sync this prototype.')
await assert.rejects(
  syncFigmaBlocks({ layout: unsyncedLayout, token: '', fetchFrames: async () => [] }),
  /FIGMA_ACCESS_TOKEN/,
)

for (const value of [
  `http://www.figma.com/proto/${figmaKey}/Test`,
  `https://figma.example/proto/${figmaKey}/Test`,
  `https://evil.figma.com/proto/${figmaKey}/Test`,
  `https://user:pass@www.figma.com/proto/${figmaKey}/Test`,
  'https://www.figma.com/community/file/123',
  'javascript:alert(1)',
]) {
  assert.equal(parseFigmaPrototypeUrl(value), null)
  assert.notEqual(validateFigmaPrototypeUrl(value), true)
}

const tokens = new Set(Array.from({ length: 100 }, createPresentationShareToken))
assert.equal(tokens.size, 100)
for (const token of tokens) {
  assert.equal(isValidPresentationShareToken(token), true)
  assert.match(token, /^[A-Za-z0-9_-]{32}$/)
}
assert.equal(isValidPresentationShareToken('too-short'), false)

const sessionId = crypto.randomUUID()
assert.deepEqual(parsePresentationEvent({ type: 'open', sessionId }), {
  type: 'open',
  sessionId,
})
assert.deepEqual(parsePresentationEvent({ type: 'heartbeat', sessionId, activeSeconds: 15 }), {
  type: 'heartbeat',
  sessionId,
  activeSeconds: 15,
})
assert.deepEqual(parsePresentationEvent({ type: 'linkClick', sessionId, linkId: 'prototype-link' }), {
  type: 'linkClick',
  sessionId,
  linkId: 'prototype-link',
})
assert.deepEqual(parsePresentationEvent({ type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 15 }), {
  type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 15,
})
assert.equal(parsePresentationEvent({ type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 31 }), null)
assert.equal(parsePresentationEvent({ type: 'heartbeat', sessionId: 'bad', activeSeconds: 15 }), null)
assert.equal(parsePresentationEvent({ type: 'heartbeat', sessionId, activeSeconds: 31 }), null)
assert.equal(parsePresentationEvent({ type: 'heartbeat', sessionId, activeSeconds: 0 }), null)
assert.equal(parsePresentationEvent({ type: 'linkClick', sessionId, linkId: '../unsafe' }), null)
assert.equal(parsePresentationEvent({ type: 'unknown', sessionId }), null)

assert.equal(classifyDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'mobile')
assert.equal(classifyDevice('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'), 'tablet')
assert.equal(classifyDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'), 'desktop')
assert.equal(classifyDevice(''), 'unknown')

assert.deepEqual(
  mergeVisitMetrics(
    { activeSeconds: 20, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:00:00Z') },
    { type: 'heartbeat', activeSeconds: 10 },
    new Date('2026-07-18T00:01:00Z'),
  ),
  { activeSeconds: 30, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:01:00Z') },
)
assert.deepEqual(
  mergeVisitMetrics(
    { activeSeconds: 20, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:00:00Z') },
    { type: 'open' },
    new Date('2026-07-18T00:01:00Z'),
  ),
  { activeSeconds: 20, visitCount: 2, lastSeenAt: new Date('2026-07-18T00:01:00Z') },
)
assert.deepEqual(
  mergeVisitMetrics(
    { activeSeconds: 31_535_995, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:00:00Z') },
    { type: 'heartbeat', activeSeconds: 10 },
    new Date('2026-07-18T00:01:00Z'),
  ),
  { activeSeconds: 31_536_000, visitCount: 1, lastSeenAt: new Date('2026-07-18T00:01:00Z') },
)

console.log('Presentation smoke checks passed.')

assert.equal(Presentations.slug, 'presentations')
assert.equal(PresentationVisits.slug, 'presentation-visits')
assert.equal(await Presentations.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await Presentations.access?.read?.({ req: { user: { id: 1 } } } as never), true)
assert.equal(await PresentationVisits.access?.read?.({ req: { user: null } } as never), false)
assert.equal(await PresentationVisits.access?.create?.({ req: { user: null } } as never), false)

const presentationFields = Presentations.fields.filter((field) => 'name' in field)
type InspectedField = { blocks?: Array<{ slug: string }>; defaultValue?: unknown }
const presentationField = (name: string): InspectedField | undefined =>
  presentationFields.find((field) => 'name' in field && field.name === name) as InspectedField | undefined
const engagementField = presentationField('engagementSummary')
assert.equal((engagementField as { admin?: { components?: { Field?: string } } })?.admin?.components?.Field,
  '@/components/payload/PresentationAnalyticsDashboard#PresentationAnalyticsDashboard')
const dashboardSource = readFileSync(new URL('../src/components/payload/PresentationAnalyticsDashboard.tsx', import.meta.url), 'utf8')
assert.match(dashboardSource, /hasNextPage/)
assert.match(dashboardSource, /page \+= 1/)
assert.equal(presentationField('theme')?.defaultValue, 'light')
assert.equal(presentationField('displayMode')?.defaultValue, 'scroll')
assert.deepEqual(
  presentationField('layout')?.blocks?.map((block) => block.slug) ?? [],
  sharedEntryBlocks.map((block) => block.slug),
)

const presentationHook = Presentations.hooks?.beforeValidate?.[0]
assert.equal(typeof presentationHook, 'function')
if (typeof presentationHook === 'function') {
  const hooked = await presentationHook({
    data: { slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit` },
    operation: 'create',
  } as never)
  assert.equal(isValidPresentationShareToken(String(hooked?.shareToken)), true)
  assert.equal(hooked?.embedUrl, `https://docs.google.com/presentation/d/${deckId}/embed`)
  assert.equal(hooked?.openUrl, `https://docs.google.com/presentation/d/${deckId}/present`)
}

assert.deepEqual(toPublicPresentation({
  id: 42,
  title: 'Client deck',
  clientLabel: 'Secret client',
  slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit`,
  embedUrl: `https://docs.google.com/presentation/d/${deckId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/${deckId}/present`,
  introduction: 'A short introduction.',
  coverImage: { url: 'https://example.com/cover.jpg', alt: 'Cover' },
  supportingLinks: [
    { id: 'prototype', label: 'Prototype', href: 'https://example.com/prototype' },
    { id: 'unsafe', label: 'Unsafe', href: 'javascript:alert(1)' },
  ],
  createdAt: 'private',
  updatedAt: 'private',
}), {
  title: 'Client deck',
  theme: 'light',
  displayMode: 'scroll',
  layout: [],
  embedUrl: `https://docs.google.com/presentation/d/${deckId}/embed`,
  openUrl: `https://docs.google.com/presentation/d/${deckId}/present`,
  introduction: 'A short introduction.',
  coverImage: { url: 'https://example.com/cover.jpg', alt: 'Cover' },
  supportingLinks: [{ id: 'prototype', label: 'Prototype', href: 'https://example.com/prototype' }],
})
assert.equal(toPublicPresentation({
  title: 'Unsafe deck',
  embedUrl: 'https://evil.example/embed',
  openUrl: 'https://evil.example/open',
}), null)

assert.deepEqual(toPublicPresentation({
  title: 'Native presentation',
  theme: 'dark',
  displayMode: 'slideshow',
  layout: [
    { id: 'hero-1', blockType: 'entryHero', headline: 'Hello', prehead: 'Welcome', private: 'remove me' },
    { id: 'slides-1', blockType: 'entryGoogleSlides', title: 'Research', slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit`, arbitrary: true },
    { id: 'figma-1', blockType: 'entryFigmaPrototype', title: 'Prototype', prototypeUrl: `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2`, syncedFrames: [
      { nodeId: '1:2', name: 'Opening', width: 1600, height: 900 },
      { nodeId: '1:3', name: 'Details', width: 1600, height: 900 },
    ], figmaSyncError: 'private error', private: 'remove me' },
    { id: 'bad-figma', blockType: 'entryFigmaPrototype', prototypeUrl: `https://evil.figma.com/proto/${figmaKey}/Client-Prototype` },
    { id: 'bad-slides', blockType: 'entryGoogleSlides', slidesUrl: 'https://evil.example/deck' },
    { id: 'unknown', blockType: 'unknownBlock', headline: 'Nope' },
  ],
  clientLabel: 'Private',
  createdAt: 'private',
}), {
  title: 'Native presentation',
  theme: 'dark',
  displayMode: 'slideshow',
  layout: [
    { id: 'hero-1', blockType: 'entryHero', headline: 'Hello', prehead: 'Welcome' },
    { id: 'slides-1', blockType: 'entryGoogleSlides', title: 'Research', slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit` },
    { id: 'figma-1--figma--1%3A2', sourceBlockId: 'figma-1', blockType: 'entryFigmaPrototype', title: 'Opening', prototypeUrl: `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2`, interfaceStyle: 'minimal', figmaFrameNodeId: '1:2' },
    { id: 'figma-1--figma--1%3A3', sourceBlockId: 'figma-1', blockType: 'entryFigmaPrototype', title: 'Details', prototypeUrl: `https://www.figma.com/proto/${figmaKey}/Client-Prototype?node-id=1-2`, interfaceStyle: 'minimal', figmaFrameNodeId: '1:3' },
  ],
  supportingLinks: [],
})
assert.equal(toPublicPresentation({ title: 'Empty', layout: [] }), null)

const analyticsLayout = [{ id: 'figma-1', blockType: 'entryFigmaPrototype', syncedFrames: [{ nodeId: '1:2' }, { nodeId: '1:3' }] }]
assert.equal(isValidPresentationBlockTarget(analyticsLayout, 'figma-1--figma--1%3A2', 'entryFigmaPrototype'), true)
assert.equal(isValidPresentationBlockTarget(analyticsLayout, 'figma-1--figma--9%3A9', 'entryFigmaPrototype'), false)
assert.equal(isValidPresentationBlockTarget(analyticsLayout, 'figma-1--figma--1%3A2', 'entryHero'), false)
assert.equal(isValidPresentationBlockTarget(analyticsLayout, 'forged--figma--1%3A2', 'entryFigmaPrototype'), false)

// ── Google Slides deck sync ──────────────────────────────────────────────
assert.deepEqual(extractGoogleSlidesId(`https://docs.google.com/presentation/d/${deckId}/edit`), { presentationId: deckId, published: false })
assert.deepEqual(extractGoogleSlidesId(`https://docs.google.com/presentation/d/e/${publishedId}/pub`), { presentationId: publishedId, published: true })
assert.equal(extractGoogleSlidesId('https://evil.example/presentation/d/x/edit'), null)

assert.equal(deriveSlideTitle({ pageElements: [{ shape: { text: { textElements: [{ textRun: { content: '  Quarterly \n review  ' } }] } } }] }, 0), 'Quarterly review')
assert.equal(deriveSlideTitle({ pageElements: [] }, 4), 'Slide 5')
assert.deepEqual(orderGoogleSlides({ slides: [{ objectId: 'p1', pageElements: [{ shape: { text: { textElements: [{ textRun: { content: 'Intro' } }] } } }] }, { objectId: 'p2' }] }), [
  { objectId: 'p1', title: 'Intro' },
  { objectId: 'p2', title: 'Slide 2' },
])
assert.throws(() => orderGoogleSlides({ slides: [] }), /no slides/)

// Expansion turns a synced deck into one tracked block per slide, dropping the
// editable deck URL and the server-only UploadThing key.
const expandedDeck = expandGoogleSlideDecks([
  { id: 'deck-1', blockType: 'entryGoogleSlidesDeck', slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit`, syncedSlides: [
    { objectId: 'p1', title: 'Intro', imageUrl: 'https://utfs.io/f/p1.png', imageKey: 'p1key', width: 1600, height: 900 },
    { objectId: 'p2', title: 'Details', imageUrl: 'https://utfs.io/f/p2.png', imageKey: 'p2key', width: 1600, height: 900 },
  ] },
])
assert.deepEqual(expandedDeck, [
  { id: 'deck-1--gslide--p1', sourceBlockId: 'deck-1', blockType: 'entryGoogleSlidesDeck', title: 'Intro', googleSlideObjectId: 'p1', googleSlideImageUrl: 'https://utfs.io/f/p1.png', googleSlideWidth: 1600, googleSlideHeight: 900 },
  { id: 'deck-1--gslide--p2', sourceBlockId: 'deck-1', blockType: 'entryGoogleSlidesDeck', title: 'Details', googleSlideObjectId: 'p2', googleSlideImageUrl: 'https://utfs.io/f/p2.png', googleSlideWidth: 1600, googleSlideHeight: 900 },
])
// An unsynced deck passes through untouched so the live-embed fallback renders.
assert.deepEqual(expandGoogleSlideDecks([{ id: 'deck-2', blockType: 'entryGoogleSlidesDeck', slidesUrl: 'x', syncedSlides: [] }]), [
  { id: 'deck-2', blockType: 'entryGoogleSlidesDeck', slidesUrl: 'x', syncedSlides: [] },
])

// A synced deck expands through the public sanitiser (imageKey + slidesUrl are stripped).
const publicDeck = toPublicPresentation({
  title: 'Deck presentation', theme: 'light', displayMode: 'slideshow',
  layout: [{ id: 'deck-1', blockType: 'entryGoogleSlidesDeck', slidesUrl: `https://docs.google.com/presentation/d/${deckId}/edit`, syncedSlides: [
    { objectId: 'p1', title: 'Intro', imageUrl: 'https://utfs.io/f/p1.png', imageKey: 'secret-key', width: 1600, height: 900 },
  ] }],
})
assert.deepEqual(publicDeck?.layout, [
  { id: 'deck-1--gslide--p1', sourceBlockId: 'deck-1', blockType: 'entryGoogleSlidesDeck', title: 'Intro', googleSlideObjectId: 'p1', googleSlideImageUrl: 'https://utfs.io/f/p1.png', googleSlideWidth: 1600, googleSlideHeight: 900 },
])

const deckAnalyticsLayout = [{ id: 'deck-1', blockType: 'entryGoogleSlidesDeck', syncedSlides: [{ objectId: 'p1' }, { objectId: 'p2' }] }]
assert.equal(isValidPresentationBlockTarget(deckAnalyticsLayout, 'deck-1--gslide--p1', 'entryGoogleSlidesDeck'), true)
assert.equal(isValidPresentationBlockTarget(deckAnalyticsLayout, 'deck-1--gslide--p9', 'entryGoogleSlidesDeck'), false)
assert.equal(isValidPresentationBlockTarget(deckAnalyticsLayout, 'forged--gslide--p1', 'entryGoogleSlidesDeck'), false)

// Block sync: unchanged URL is skipped; forced re-sync pulls fresh slides.
const fakeDeck = async () => [{ objectId: 'p1', title: 'Intro', imageUrl: 'https://utfs.io/f/p1.png', imageKey: 'k1', width: 1600, height: 900 }]
const deckUrl = `https://docs.google.com/presentation/d/${deckId}/edit`
const skipped = await syncGoogleSlidesDecks({
  configured: true, fetchDeck: fakeDeck as never, removeImage: async () => undefined,
  layout: [{ id: 'deck-1', blockType: 'entryGoogleSlidesDeck', slidesUrl: deckUrl, syncedSlides: [{ objectId: 'old', title: 'Old', imageUrl: 'u', imageKey: 'k', width: 1, height: 1 }] }],
  previousLayout: [{ id: 'deck-1', blockType: 'entryGoogleSlidesDeck', slidesUrl: deckUrl, syncedSlides: [{ objectId: 'old', title: 'Old', imageUrl: 'u', imageKey: 'k', width: 1, height: 1 }] }],
})
assert.equal((skipped[0].syncedSlides as unknown[]).length, 1)
assert.equal((skipped[0].syncedSlides as Array<{ objectId: string }>)[0].objectId, 'old')

const resynced = await syncGoogleSlidesDecks({
  configured: true, fetchDeck: fakeDeck as never, now: new Date('2026-07-18T00:00:00.000Z'), removeImage: async () => undefined,
  layout: [{ id: 'deck-1', blockType: 'entryGoogleSlidesDeck', slidesUrl: deckUrl, forceSlidesSync: true, syncedSlides: [] }],
})
assert.equal((resynced[0].syncedSlides as Array<{ objectId: string }>)[0].objectId, 'p1')
assert.equal(resynced[0].slidesSyncError, undefined)

// Unconfigured: authors can still save; the deck degrades to the live embed.
const unconfigured = await syncGoogleSlidesDecks({
  configured: false, fetchDeck: fakeDeck as never, removeImage: async () => undefined,
  layout: [{ id: 'deck-1', blockType: 'entryGoogleSlidesDeck', slidesUrl: deckUrl, syncedSlides: [] }],
})
assert.match(String(unconfigured[0].slidesSyncError), /not configured/)

assert.deepEqual(mergeLinkClicks([], 'prototype'), [{ linkId: 'prototype', count: 1 }])
assert.deepEqual(mergeLinkClicks([{ linkId: 'prototype', count: 2 }], 'prototype'), [{ linkId: 'prototype', count: 3 }])
assert.deepEqual(mergeLinkClicks([{ linkId: 'download', count: 1 }], 'prototype'), [
  { linkId: 'download', count: 1 },
  { linkId: 'prototype', count: 1 },
])
assert.deepEqual(mergeBlockMetrics([], { type: 'blockHeartbeat', sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', activeSeconds: 15 }), [
  { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewed: true, activeSeconds: 15, navigationCount: 0 },
])
const viewedAt = new Date('2026-07-18T03:00:00.000Z')
const heroEvent = { type: 'blockHeartbeat' as const, sessionId, blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll' as const, activeSeconds: 15 }
assert.deepEqual(mergeBlockJourney([], heroEvent, viewedAt), [
  { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewedAt: viewedAt.toISOString() },
])
assert.equal(mergeBlockJourney(mergeBlockJourney([], heroEvent, viewedAt), heroEvent, viewedAt).length, 1)
const resultsEvent = { ...heroEvent, blockId: 'results-1', blockType: 'entryResults' }
const journey = mergeBlockJourney(mergeBlockJourney([], heroEvent, viewedAt), resultsEvent, viewedAt)
assert.equal(mergeBlockJourney(journey, heroEvent, viewedAt).length, 3)
assert.deepEqual(mergeBlockJourney([{ unsafe: true }] as never, heroEvent, viewedAt), [
  { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewedAt: viewedAt.toISOString() },
])
const fullJourney = Array.from({ length: 500 }, (_, index) => ({
  blockId: `block-${index}`, blockType: 'entryHero', displayMode: 'scroll' as const, viewedAt: viewedAt.toISOString(),
}))
assert.equal(mergeBlockJourney(fullJourney, heroEvent, viewedAt).length, 500)

assert.deepEqual(summarizePresentationVisits([]), {
  sessions: 0, totalVisits: 0, returningSessions: 0, totalActiveSeconds: 0,
  averageActiveSeconds: 0, lastSeenAt: null, linkClicks: {},
  blockMetrics: {},
})
assert.deepEqual(summarizePresentationVisits([
  { visitCount: 2, activeSeconds: 30, lastSeenAt: '2026-07-18T00:01:00.000Z', linkClicks: [{ linkId: 'prototype', count: 2 }] },
  { visitCount: 1, activeSeconds: 10, lastSeenAt: '2026-07-18T00:02:00.000Z', linkClicks: [{ linkId: 'prototype', count: 1 }] },
]), {
  sessions: 2, totalVisits: 3, returningSessions: 1, totalActiveSeconds: 40,
  averageActiveSeconds: 20, lastSeenAt: '2026-07-18T00:02:00.000Z', linkClicks: { prototype: 3 },
  blockMetrics: {},
})

const dashboard = summarizePresentationDashboard([
  { id: 'hero-1', blockType: 'entryHero' },
  { id: 'results-1', blockType: 'entryResults' },
  { id: 'quote-1', blockType: 'entryQuote' },
], [
  {
    anonymousSessionId: 'session-a', visitCount: 2, activeSeconds: 60, lastSeenAt: '2026-07-18T03:00:00.000Z', deviceCategory: 'desktop',
    blockMetrics: [
      { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'slideshow', viewed: true, activeSeconds: 20, navigationCount: 1 },
      { blockId: 'results-1', blockType: 'entryResults', displayMode: 'slideshow', viewed: true, activeSeconds: 30, navigationCount: 1 },
      { blockId: 'quote-1', blockType: 'entryQuote', displayMode: 'slideshow', viewed: true, activeSeconds: 10, navigationCount: 0 },
    ],
    blockJourney: [
      { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'slideshow', viewedAt: '2026-07-18T02:58:00.000Z' },
      { blockId: 'results-1', blockType: 'entryResults', displayMode: 'slideshow', viewedAt: '2026-07-18T02:59:00.000Z' },
      { blockId: 'quote-1', blockType: 'entryQuote', displayMode: 'slideshow', viewedAt: '2026-07-18T03:00:00.000Z' },
    ],
  },
  {
    anonymousSessionId: 'session-b', visitCount: 1, activeSeconds: 30, lastSeenAt: '2026-07-18T02:00:00.000Z', deviceCategory: 'mobile',
    blockMetrics: [
      { blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewed: true, activeSeconds: 20, navigationCount: 0 },
      { blockId: 'results-1', blockType: 'entryResults', displayMode: 'scroll', viewed: true, activeSeconds: 10, navigationCount: 0 },
      { blockId: 'deleted-1', blockType: 'entryMedia', displayMode: 'scroll', viewed: true, activeSeconds: 5, navigationCount: 0 },
    ],
    blockJourney: [{ blockId: 'hero-1', blockType: 'entryHero', displayMode: 'scroll', viewedAt: '2026-07-18T02:00:00.000Z' }],
  },
  { anonymousSessionId: 'session-c', visitCount: 1, activeSeconds: 0, lastSeenAt: 'invalid', deviceCategory: 'unknown', blockMetrics: [] },
])
assert.deepEqual(dashboard.overview, {
  viewers: 3, totalVisits: 4, averageActiveSeconds: 30, completionRate: 33, mostViewedSlide: 1,
})
assert.deepEqual(dashboard.slides.map((slide) => ({ viewers: slide.viewers, reachedPercent: slide.reachedPercent, averageActiveSeconds: slide.averageActiveSeconds, dropOffCount: slide.dropOffCount })), [
  { viewers: 2, reachedPercent: 67, averageActiveSeconds: 20, dropOffCount: 0 },
  { viewers: 2, reachedPercent: 67, averageActiveSeconds: 20, dropOffCount: 1 },
  { viewers: 1, reachedPercent: 33, averageActiveSeconds: 10, dropOffCount: null },
])
assert.equal(dashboard.sessions[0].label, 'Anonymous viewer 1')
assert.deepEqual(dashboard.sessions[0].journey.map((entry) => entry.position), [1, 2, 3])
assert.equal(dashboard.legacyActivity[0].blockId, 'deleted-1')
assert.deepEqual(summarizePresentationDashboard([{ id: 'hero-1', blockType: 'entryHero' }], []).overview, {
  viewers: 0, totalVisits: 0, averageActiveSeconds: 0, completionRate: 0, mostViewedSlide: null,
})
